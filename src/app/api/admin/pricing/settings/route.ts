import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { pricingSettings, websiteContent } from "@/db/schema";
import { handle, HttpError } from "@/lib/api";
import { requirePermission } from "@/lib/auth/session";
import { audit } from "@/lib/audit";

const SETTING_RULES: Record<string, [number, number]> = {
  target_margin: [0, 0.9], min_margin: [0, 0.9], overhead_pct: [0, 1], commercial_factor: [0.5, 3], contingency_pct: [0, 0.5],
  sst_enabled: [0, 1], sst_pct: [0, 0.2], rounding_tiered: [0, 1], rounding_step: [0.01, 100], range_low_pct: [0, 0.9], range_high_pct: [0, 2],
  allow_unverified_rates: [0, 1], validity_days: [1, 365], margin_mode_markup: [0, 1],
};

const Body = z.record(z.string(), z.union([z.string(), z.number(), z.boolean()]));

export const POST = handle(async (req: Request) => {
  const u = await requirePermission("pricing.edit");
  const b = Body.parse(await req.json());
  const changes: Record<string, number> = {};
  for (const [k, raw] of Object.entries(b)) {
    if (k === "quotation_terms_ms" || k === "quotation_terms_en") continue;
    const range = SETTING_RULES[k];
    if (!range) continue;
    const v = typeof raw === "boolean" ? Number(raw) : Number(raw);
    if (!Number.isFinite(v) || v < range[0] || v > range[1]) throw new HttpError(400, `${k} mesti antara ${range[0]} dan ${range[1]}`);
    changes[k] = v;
  }
  if (changes.min_margin != null && changes.target_margin != null && changes.target_margin < changes.min_margin) throw new HttpError(400, "Margin sasaran tidak boleh kurang daripada margin minimum");
  for (const [key, value] of Object.entries(changes))
    await db.insert(pricingSettings).values({ key, value }).onConflictDoUpdate({ target: pricingSettings.key, set: { value, updatedAt: new Date() } });
  if (typeof b.quotation_terms_ms === "string")
    await db.insert(websiteContent).values({ key: "quotation_terms", valueMs: b.quotation_terms_ms, valueEn: String(b.quotation_terms_en ?? ""), updatedBy: u.id })
      .onConflictDoUpdate({ target: websiteContent.key, set: { valueMs: b.quotation_terms_ms, valueEn: String(b.quotation_terms_en ?? ""), updatedBy: u.id, updatedAt: new Date() } });
  await audit(u.id, "pricing.settings", "pricing_settings", null, changes);
  return NextResponse.json({ ok: true });
});
