import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { env } from "@/lib/env";
import { EstimateSchema } from "./schema";
import { AiError, type AiProvider, type AiUsage, type EstimateRequest } from "./provider";

let client: Anthropic | null = null;

function getClient() {
  const e = env();
  if (!e.ANTHROPIC_API_KEY) throw new AiError("not_configured", "ANTHROPIC_API_KEY is not set");
  if (!client) {
    // ANTHROPIC_API_URL is the full messages endpoint; the SDK wants the base URL.
    const baseURL = e.ANTHROPIC_API_URL.replace(/\/v1\/messages\/?$/, "");
    client = new Anthropic({ apiKey: e.ANTHROPIC_API_KEY, baseURL, maxRetries: 2, timeout: 180_000 });
  }
  return client;
}

/** Anthropic Messages API implementation, server-side only. */
export const anthropicProvider: AiProvider = {
  name: "anthropic",
  async estimate(req: EstimateRequest) {
    const c = getClient();
    const content: Anthropic.Beta.BetaContentBlockParam[] = [];
    for (const a of req.attachments) {
      const data = a.data.toString("base64");
      if (a.mimeType === "application/pdf") {
        content.push({ type: "document", source: { type: "base64", media_type: "application/pdf", data }, title: a.name });
      } else {
        content.push({ type: "image", source: { type: "base64", media_type: a.mimeType, data } });
      }
    }
    content.push({ type: "text", text: req.prompt });

    const fallbacks = env().AI_FALLBACKS === "default";
    let msg;
    try {
      msg = await c.beta.messages.parse({
        model: req.model,
        max_tokens: req.maxTokens,
        system: [{ type: "text", text: req.system, cache_control: { type: "ephemeral" } }],
        messages: [{ role: "user", content }],
        output_config: { effort: req.effort, format: betaZodOutputFormat(EstimateSchema) },
        ...(fallbacks ? { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" as const } : {}),
      });
    } catch (err) {
      if (err instanceof Anthropic.APIError) {
        const kind = err.status === 529 || err.status === 503 ? "overloaded" : "error";
        throw new AiError(kind, `Anthropic ${err.status ?? ""} ${err.message}`.slice(0, 500), undefined, err.requestID ?? null);
      }
      // zod validation failures from the SDK parser surface here
      throw new AiError("invalid_output", String(err).slice(0, 500));
    }

    const usage: AiUsage = {
      inputTokens: msg.usage.input_tokens ?? 0,
      outputTokens: msg.usage.output_tokens ?? 0,
      cacheReadTokens: msg.usage.cache_read_input_tokens ?? 0,
      cacheWriteTokens: msg.usage.cache_creation_input_tokens ?? 0,
    };
    const requestId = msg._request_id ?? null;
    if (msg.stop_reason === "refusal") throw new AiError("refusal", "The model declined this request", usage, requestId);
    if (msg.stop_reason === "max_tokens") throw new AiError("truncated", "Output hit max_tokens", usage, requestId);
    if (!msg.parsed_output) throw new AiError("invalid_output", "No parsed output", usage, requestId);
    return { output: msg.parsed_output, usage, model: msg.model, requestId };
  },
};
