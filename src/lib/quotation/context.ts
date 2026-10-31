import "server-only";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { additionalCharges, locationAdjustments, minimumCharges, pricingItems, pricingSettings } from "@/db/schema";
import { quoteCategory } from "@/lib/catalog";
import type { AdditionalCharge, PricingSettings, RateRecord } from "@/lib/pricing/engine";
import type { Candidate } from "@/lib/ai/estimator";

export async function loadPricingSettings(): Promise<PricingSettings & { validityDays: number }> {
  const rows = await db.select().from(pricingSettings);
  const m = new Map(rows.map((r) => [r.key, Number(r.value)]));
  const g = (k: string, d: number) => (m.has(k) && Number.isFinite(m.get(k)) ? m.get(k)! : d);
  return {
    marginMode: g("margin_mode_markup", 0) ? "markup" : "margin",
    targetMargin: g("target_margin", 0.4),
    minMargin: g("min_margin", 0.35),
    overheadPct: g("overhead_pct", 0),
    commercialFactor: g("commercial_factor", 1.15),
    contingencyPct: g("contingency_pct", 0.05),
    sstEnabled: g("sst_enabled", 0) === 1,
    sstPct: g("sst_pct", 0.08),
    roundingMode: g("rounding_tiered", 1) ? "tiered" : "flat",
    roundingStep: g("rounding_step", 0.05),
    rangeLowPct: g("range_low_pct", 0.1),
    rangeHighPct: g("range_high_pct", 0.2),
    allowUnverifiedRates: g("allow_unverified_rates", 1) === 1,
    validityDays: Math.round(g("validity_days", 30)),
  };
}

export const toRateRecord = (r: typeof pricingItems.$inferSelect): RateRecord => ({
  id: r.id,
  code: r.code,
  description: r.description,
  unit: r.unit,
  materialRate: r.materialRate,
  labourRate: r.labourRate,
  machineryRate: r.machineryRate,
  transportRate: r.transportRate,
  subcontractorRate: r.subcontractorRate,
  isVerified: r.isVerified,
  active: r.active,
});

/** Everything the calculator needs for one quotation, read fresh from the pricing database. */
export async function loadPricingContext(categoryKey: string, segment: "residential" | "commercial", location: string | null) {
  const [settings, items, locs, charges, minRow] = await Promise.all([
    loadPricingSettings(),
    db.select().from(pricingItems).orderBy(asc(pricingItems.code)),
    db.select().from(locationAdjustments).orderBy(asc(locationAdjustments.sort)),
    db.select().from(additionalCharges).where(eq(additionalCharges.active, true)),
    db.select().from(minimumCharges).where(eq(minimumCharges.categoryKey, categoryKey)),
  ]);
  const rates = new Map(items.map((r) => [r.code, toRateRecord(r)]));
  const cat = quoteCategory(categoryKey);
  const relevant = items.filter(
    (r) => r.active && (categoryKey === "other" || r.workCategories.includes(categoryKey) || (cat && cat.sections.includes(r.code.split("-")[0]))),
  );
  const candidates: Candidate[] = (relevant.length ? relevant : items.filter((r) => r.active)).map((r) => ({
    code: r.code,
    description: r.description,
    unit: r.unit,
    category: r.category,
  }));

  const loc = (location ?? "").toLowerCase();
  const match = locs.find((l) => l.active && l.keywords.some((k) => k && loc.includes(k.toLowerCase())));
  const additional: AdditionalCharge[] = charges
    .filter((c) => (c.appliesTo.length === 0 || c.appliesTo.includes(categoryKey)) && (c.segment === "all" || c.segment === segment))
    .map((c) => ({ name: c.name, kind: c.kind as "fixed" | "percent", amount: c.amount }));

  return {
    settings,
    rates,
    candidates,
    locationFactor: match?.factor ?? 1,
    locationName: match?.name ?? null,
    additionalCharges: additional,
    minimumCharge: minRow[0]?.amount ?? 0,
  };
}

