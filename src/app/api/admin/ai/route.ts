import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { aiSettings } from "@/db/schema";
import { handle, HttpError } from "@/lib/api";
import { requirePermission } from "@/lib/auth/session";
import { audit } from "@/lib/audit";
import { AI_SETTING_KEYS } from "@/lib/ai/settings";

const Body = z.record(z.string(), z.union([z.string(), z.boolean(), z.number()]));
const RULES: Record<string, (v: string) => boolean> = {
  model: (v) => v === "" || /^[a-z0-9][a-z0-9.\-]{2,79}$/.test(v),
  effort: (v) => ["", "low", "medium", "high", "xhigh", "max"].includes(v),
  max_tokens: (v) => v === "" || (Number(v) >= 1024 && Number(v) <= 64000),
  daily_limit: (v) => v === "" || (Number(v) >= 0 && Number(v) <= 100000),
  per_ip_hourly: (v) => v === "" || (Number(v) >= 1 && Number(v) <= 1000),
  max_attachments: (v) => v === "" || (Number(v) >= 0 && Number(v) <= 10),
  extra_instructions: (v) => v.length <= 4000,
};

/** Non-secret AI settings. The API key is environment-only and cannot be set or read here. */
export const POST = handle(async (req: Request) => {
  const u = await requirePermission("ai.manage");
  const b = Body.parse(await req.json());
  const saved: Record<string, string> = {};
  for (const key of AI_SETTING_KEYS) {
    if (!(key in b)) continue;
    const v = typeof b[key] === "boolean" ? (b[key] ? "1" : "0") : String(b[key]).trim();
    if (RULES[key] && !RULES[key](v)) throw new HttpError(400, `Nilai ${key} tidak sah`);
    saved[key] = v;
    if (v === "") await db.delete(aiSettings).where(eq(aiSettings.key, key));
    else await db.insert(aiSettings).values({ key, value: v }).onConflictDoUpdate({ target: aiSettings.key, set: { value: v, updatedAt: new Date() } });
  }
  await audit(u.id, "ai.settings", "ai_settings", null, saved);
  return NextResponse.json({ ok: true });
});
