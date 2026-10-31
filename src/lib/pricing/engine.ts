import { convertQuantity, normalizeUnit, type Unit } from "./units";

/**
 * Deterministic quotation calculator. Every ringgit amount shown to a customer
 * comes from here, from rates in the pricing database. The AI only proposes
 * work items and quantities; it never supplies prices.
 *
 * All arithmetic is done in sen (integers) to avoid floating point drift.
 */

export type RateRecord = {
  id: number;
  code: string;
  description: string;
  unit: string;
  materialRate: number;
  labourRate: number;
  machineryRate: number;
  transportRate: number;
  subcontractorRate: number;
  isVerified: boolean;
  active: boolean;
};

export type PricingSettings = {
  /** "margin": sell = cost / (1 - m). "markup": sell = cost × (1 + m). */
  marginMode: "margin" | "markup";
  targetMargin: number; // e.g. 0.40
  overheadPct: number; // applied to cost before margin, e.g. 0
  commercialFactor: number; // e.g. 1.15 for shops/offices
  contingencyPct: number; // quotation-level, e.g. 0.05
  sstEnabled: boolean;
  sstPct: number; // e.g. 0.08 (only when the company is SST registered)
  minMargin: number; // project overrides may not go below this, e.g. 0.35
  /** "tiered" mirrors Senarai Harga 2026 (RM0.05 below RM5 … RM10 above RM1,000); "flat" uses roundingStep. */
  roundingMode: "tiered" | "flat";
  roundingStep: number;
  rangeLowPct: number; // indicative range below the estimate, e.g. 0.10
  rangeHighPct: number; // indicative range above the estimate, e.g. 0.20
  allowUnverifiedRates: boolean;
};

export type AdditionalCharge = {
  name: string;
  kind: "fixed" | "percent";
  amount: number; // RM for fixed, percent (e.g. 3 = 3%) for percent
};

export type LineInput = {
  code?: string | null;
  description: string;
  unit: string;
  quantity: number | null;
  quantityBasis?: string;
};

export type PricedLine = {
  sort: number;
  pricingItemId: number | null;
  code: string | null;
  description: string;
  unit: string;
  quantity: number | null;
  costRate: number | null;
  rate: number | null;
  amount: number | null;
  costAmount: number | null;
  status: "priced" | "needs_review";
  reviewReason: string | null;
  quantityBasis?: string;
  components?: { material: number; labour: number; machinery: number; transport: number; subcontractor: number };
};

export type CalcResult = {
  lines: PricedLine[];
  subtotal: number;
  additional: { name: string; amount: number }[];
  additionalTotal: number;
  contingency: number;
  minimumChargeAdjustment: number;
  preTax: number;
  sst: number;
  grandTotal: number;
  rangeLow: number;
  rangeHigh: number;
  pendingReviewCount: number;
  status: "preliminary" | "pending_qs";
  internal: {
    costTotal: number;
    grossProfit: number;
    effectiveMargin: number | null;
    warnings: string[];
    locationFactor: number;
    segmentFactor: number;
    settings: PricingSettings;
  };
};

export type CalcInput = {
  lines: LineInput[];
  rates: Map<string, RateRecord>;
  settings: PricingSettings;
  segment: "residential" | "commercial";
  locationFactor: number;
  additionalCharges: AdditionalCharge[];
  minimumCharge: number;
  /** Project-specific overrides, e.g. { targetMargin: 0.35 } or { "rate:B-006": 30 } */
  overrides?: Record<string, number>;
};

const toSen = (rm: number) => Math.round(rm * 100);
const fromSen = (sen: number) => sen / 100;

export const ROUNDING_TIERS = [
  { below: 5, step: 0.05 },
  { below: 20, step: 0.1 },
  { below: 100, step: 0.5 },
  { below: 1000, step: 5 },
  { below: Infinity, step: 10 },
];

function roundUpToStep(value: number, step: number): number {
  if (step <= 0) return Math.round(value * 100) / 100;
  // Subtract a tiny epsilon so 27.000000001 does not round up to the next step; fix float noise after.
  return Math.round(Math.ceil(value / step - 1e-9) * step * 100) / 100;
}

export function roundSellingRate(value: number, s: Pick<PricingSettings, "roundingMode" | "roundingStep">): number {
  if (s.roundingMode === "flat") return roundUpToStep(value, s.roundingStep);
  const tier = ROUNDING_TIERS.find((t) => value < t.below)!;
  return roundUpToStep(value, tier.step);
}

export function sellingRate(
  cost: number,
  s: Pick<PricingSettings, "marginMode" | "targetMargin" | "roundingMode" | "roundingStep">,
) {
  if (s.marginMode === "margin") {
    if (s.targetMargin >= 1) throw new Error("targetMargin must be below 1 in margin mode");
    return roundSellingRate(cost / (1 - s.targetMargin), s);
  }
  return roundSellingRate(cost * (1 + s.targetMargin), s);
}

export function calculateQuotation(input: CalcInput): CalcResult {
  const o = input.overrides ?? {};
  const warnings: string[] = [];
  let targetMargin = o.targetMargin ?? input.settings.targetMargin;
  if (targetMargin < input.settings.minMargin) {
    warnings.push(`Margin ${targetMargin} di bawah minimum ${input.settings.minMargin}; minimum digunakan`);
    targetMargin = input.settings.minMargin;
  }
  const settings: PricingSettings = {
    ...input.settings,
    targetMargin,
    overheadPct: o.overheadPct ?? input.settings.overheadPct,
    contingencyPct: o.contingencyPct ?? input.settings.contingencyPct,
  };
  const segmentFactor = input.segment === "commercial" ? settings.commercialFactor : 1;
  const locationFactor = o.locationFactor ?? input.locationFactor;

  const lines: PricedLine[] = input.lines.map((line, i) => {
    const base: PricedLine = {
      sort: i + 1,
      pricingItemId: null,
      code: line.code ?? null,
      description: line.description,
      unit: line.unit,
      quantity: line.quantity,
      costRate: null,
      rate: null,
      amount: null,
      costAmount: null,
      status: "needs_review",
      reviewReason: null,
      quantityBasis: line.quantityBasis,
    };
    const rec = line.code ? input.rates.get(line.code) : undefined;
    if (!rec) return { ...base, reviewReason: "Tiada kadar diluluskan dalam pangkalan harga" };
    base.pricingItemId = rec.id;
    base.unit = rec.unit;
    if (!rec.active) return { ...base, reviewReason: "Kadar tidak aktif" };
    if (!rec.isVerified && !settings.allowUnverifiedRates) return { ...base, reviewReason: "Kadar belum disahkan" };
    if (line.quantity == null || !(line.quantity > 0)) return { ...base, reviewReason: "Kuantiti perlu diukur di tapak" };

    const fromU = normalizeUnit(line.unit);
    const toU = normalizeUnit(rec.unit) as Unit | null;
    if (!fromU || !toU) return { ...base, reviewReason: `Unit tidak dikenali (${line.unit})` };
    const qty = convertQuantity(line.quantity, fromU, toU);
    if (qty == null) return { ...base, reviewReason: `Unit ${line.unit} tidak boleh ditukar kepada ${rec.unit}` };
    const quantity = Math.round(qty * 1000) / 1000;

    const factor = locationFactor * segmentFactor * (1 + settings.overheadPct);
    const components = {
      material: rec.materialRate * factor,
      labour: rec.labourRate * factor,
      machinery: rec.machineryRate * factor,
      transport: rec.transportRate * factor,
      subcontractor: rec.subcontractorRate * factor,
    };
    const overrideRate = o[`rate:${rec.code}`];
    const costRate = Object.values(components).reduce((a, b) => a + b, 0);
    const rate = overrideRate ?? sellingRate(costRate, settings);
    if (overrideRate != null) {
      const floor = settings.marginMode === "margin" ? costRate / (1 - settings.minMargin) : costRate * (1 + settings.minMargin);
      if (overrideRate < floor) warnings.push(`Kadar khas ${rec.code} (RM${overrideRate}) di bawah margin minimum`);
    }
    const amountSen = Math.round(quantity * toSen(rate));
    const costSen = Math.round(quantity * toSen(costRate));
    return {
      ...base,
      quantity,
      costRate: Math.round(costRate * 10000) / 10000,
      rate,
      amount: fromSen(amountSen),
      costAmount: fromSen(costSen),
      status: "priced",
      reviewReason: null,
      components,
    };
  });

  const priced = lines.filter((l) => l.status === "priced");
  const subtotalSen = priced.reduce((a, l) => a + toSen(l.amount!), 0);
  const costSen = priced.reduce((a, l) => a + toSen(l.costAmount!), 0);

  const additional = priced.length
    ? input.additionalCharges.map((c) => ({
        name: c.name,
        amountSen: c.kind === "fixed" ? toSen(c.amount) : Math.round((subtotalSen * c.amount) / 100),
      }))
    : [];
  const additionalSen = additional.reduce((a, c) => a + c.amountSen, 0);
  const contingencySen = Math.round((subtotalSen + additionalSen) * settings.contingencyPct);
  let preTaxSen = subtotalSen + additionalSen + contingencySen;

  let minAdjSen = 0;
  const minSen = toSen(input.minimumCharge || 0);
  if (priced.length && preTaxSen < minSen) {
    minAdjSen = minSen - preTaxSen;
    preTaxSen = minSen;
  }
  const sstSen = settings.sstEnabled ? Math.round(preTaxSen * settings.sstPct) : 0;
  const grandSen = preTaxSen + sstSen;
  const pendingReviewCount = lines.length - priced.length;

  const grossProfitSen = preTaxSen - costSen;
  return {
    lines,
    subtotal: fromSen(subtotalSen),
    additional: additional.map((a) => ({ name: a.name, amount: fromSen(a.amountSen) })),
    additionalTotal: fromSen(additionalSen),
    contingency: fromSen(contingencySen),
    minimumChargeAdjustment: fromSen(minAdjSen),
    preTax: fromSen(preTaxSen),
    sst: fromSen(sstSen),
    grandTotal: fromSen(grandSen),
    rangeLow: fromSen(Math.round(grandSen * (1 - settings.rangeLowPct))),
    rangeHigh: fromSen(Math.round(grandSen * (1 + settings.rangeHighPct))),
    pendingReviewCount,
    status: pendingReviewCount > 0 || lines.length === 0 ? "pending_qs" : "preliminary",
    internal: {
      costTotal: fromSen(costSen),
      grossProfit: fromSen(grossProfitSen),
      effectiveMargin: preTaxSen > 0 ? Math.round((grossProfitSen / preTaxSen) * 10000) / 10000 : null,
      warnings,
      locationFactor,
      segmentFactor,
      settings,
    },
  };
}

/** Picks the location factor whose keywords match the project location (first match by sort order). */
export function matchLocationFactor(
  location: string | null | undefined,
  rules: { keywords: string[]; factor: number; active: boolean }[],
): number {
  const loc = (location ?? "").toLowerCase();
  for (const r of rules) {
    if (!r.active) continue;
    if (r.keywords.some((k) => k && loc.includes(k.toLowerCase()))) return r.factor;
  }
  return 1;
}
