import "server-only";
import type { Estimate } from "./schema";

export type AiAttachment = { mimeType: "image/jpeg" | "image/png" | "application/pdf"; data: Buffer; name: string };

export type AiUsage = { inputTokens: number; outputTokens: number; cacheReadTokens: number; cacheWriteTokens: number };

export type EstimateRequest = {
  system: string;
  prompt: string;
  attachments: AiAttachment[];
  model: string;
  effort: "low" | "medium" | "high" | "xhigh" | "max";
  maxTokens: number;
};

export type EstimateResponse = { output: Estimate; usage: AiUsage; model: string; requestId: string | null };

export type AiErrorKind = "not_configured" | "refusal" | "invalid_output" | "truncated" | "overloaded" | "error";

export class AiError extends Error {
  constructor(
    public kind: AiErrorKind,
    message: string,
    public usage?: AiUsage,
    public requestId?: string | null,
  ) {
    super(message);
  }
}

/**
 * Every AI provider implements this interface, so the estimator can switch
 * providers or models through configuration without touching the rest of the app.
 */
export interface AiProvider {
  readonly name: string;
  estimate(req: EstimateRequest): Promise<EstimateResponse>;
}
