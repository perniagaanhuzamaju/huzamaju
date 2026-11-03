import "server-only";
import { db } from "@/db";
import { aiSettings } from "@/db/schema";
import { env } from "@/lib/env";

export type AiConfig = {
  enabled: boolean;
  model: string;
  effort: "low" | "medium" | "high" | "xhigh" | "max";
  maxTokens: number;
  dailyLimit: number;
  perIpHourly: number;
  perIpDaily: number;
  perPhoneDaily: number;
  sendAttachments: boolean;
  maxAttachments: number;
  extraInstructions: string;
};

const EFFORTS = ["low", "medium", "high", "xhigh", "max"] as const;

/** Env supplies defaults; admin can override non-secret values in ai_settings. The API key is env-only. */
export async function getAiConfig(): Promise<AiConfig> {
  const e = env();
  const rows = await db.select().from(aiSettings);
  const m = new Map(rows.map((r) => [r.key, r.value]));
  const num = (k: string, d: number) => {
    const v = Number(m.get(k));
    return Number.isFinite(v) && m.has(k) ? v : d;
  };
  const effort = m.get("effort");
  return {
    enabled: m.get("enabled") !== "0",
    model: m.get("model")?.trim() || e.ANTHROPIC_MODEL,
    effort: EFFORTS.includes(effort as AiConfig["effort"]) ? (effort as AiConfig["effort"]) : e.AI_EFFORT,
    maxTokens: num("max_tokens", e.AI_MAX_TOKENS),
    dailyLimit: num("daily_limit", e.AI_DAILY_REQUEST_LIMIT),
    perIpHourly: num("per_ip_hourly", e.AI_PER_IP_HOURLY_LIMIT),
    perIpDaily: num("per_ip_daily", 3),
    perPhoneDaily: num("per_phone_daily", 2),
    sendAttachments: m.get("send_attachments") !== "0",
    maxAttachments: num("max_attachments", 4),
    extraInstructions: m.get("extra_instructions") ?? "",
  };
}

export const AI_SETTING_KEYS = ["enabled", "model", "effort", "max_tokens", "daily_limit", "per_ip_hourly", "per_ip_daily", "per_phone_daily", "send_attachments", "max_attachments", "extra_instructions"] as const;
