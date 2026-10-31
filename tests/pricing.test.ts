import { describe, it, expect } from "vitest";
import { calculateQuotation, sellingRate, matchLocationFactor, type PricingSettings, type RateRecord } from "@/lib/pricing/engine";
import { convertQuantity, normalizeUnit } from "@/lib/pricing/units";
import seed from "@/db/seed-data/pricing-2026.json";

const S: PricingSettings = {
  marginMode: "margin", targetMargin: 0.4, minMargin: 0.35, overheadPct: 0, commercialFactor: 1.15,
  contingencyPct: 0, sstEnabled: false, sstPct: 0.08, roundingMode: "tiered", roundingStep: 0.05,
  rangeLowPct: 0.1, rangeHighPct: 0.2, allowUnverifiedRates: true,
};
const rec = (code: string, unit: string, material: number, labour: number, extra: Partial<RateRecord> = {}): RateRecord => ({
  id: 1, code, description: code, unit, materialRate: material, labourRate: labour, machineryRate: 0,
  transportRate: 0, subcontractorRate: 0, isVerified: true, active: true, ...extra,
});

describe("units", () => {
  it("normalises Malaysian shorthand", () => {
    expect(normalizeUnit("kps")).toBe("ft2");
    expect(normalizeUnit("ka")).toBe("ft");
    expect(normalizeUnit("titik")).toBe("point");
    expect(normalizeUnit("m²")).toBe("m2");
    expect(normalizeUnit("banana")).toBeNull();
  });
  it("converts within a dimension only", () => {
    expect(convertQuantity(10, "m2", "ft2")).toBeCloseTo(107.639, 3);
    expect(convertQuantity(1, "m3", "ft3")).toBeCloseTo(35.3147, 3);
    expect(convertQuantity(2, "tonne", "kg")).toBe(2000);
    expect(convertQuantity(5, "m2", "m")).toBeNull();
    expect(convertQuantity(3, "unit", "lot")).toBeNull();
  });
});

describe("selling rate matches Senarai Harga 2026 spreadsheet", () => {
  it.each(seed.filter((r) => r.cost).map((r) => [r.desc, r.cost, r.res_price, r.com_price] as const))(
    "%s",
    (_d, cost, res, com) => {
      expect(sellingRate(cost as number, S)).toBeCloseTo(res as number, 2);
      expect(sellingRate((cost as number) * 1.15, S)).toBeCloseTo(com as number, 2);
    },
  );
});

describe("calculateQuotation", () => {
  const rates = new Map([
    ["B-006", rec("B-006", "kps", 8.748, 8.748)],
    ["D-001", rec("D-001", "kps", 0.5, 1.0)],
    ["X-OFF", rec("X-OFF", "kps", 1, 1, { active: false })],
  ]);
  const base = { rates, settings: S, segment: "residential" as const, locationFactor: 1, additionalCharges: [], minimumCharge: 0 };

  it("prices lines from the database and converts m2 to ft2", () => {
    const r = calculateQuotation({ ...base, lines: [{ code: "B-006", description: "Dinding bata", unit: "m2", quantity: 10 }] });
    const l = r.lines[0];
    expect(l.status).toBe("priced");
    expect(l.unit).toBe("kps");
    expect(l.quantity).toBeCloseTo(107.639, 3);
    expect(l.rate).toBe(29.5);
    expect(l.amount).toBe(Math.round(107.639 * 29.5 * 100) / 100);
    expect(r.subtotal).toBe(l.amount);
    expect(r.status).toBe("preliminary");
  });

  it("flags unknown codes, missing quantities, inactive rates and bad units for QS review", () => {
    const r = calculateQuotation({
      ...base,
      lines: [
        { code: "ZZZ", description: "Tiada", unit: "m2", quantity: 3 },
        { code: "B-006", description: "Tiada kuantiti", unit: "kps", quantity: null },
        { code: "X-OFF", description: "Tidak aktif", unit: "kps", quantity: 3 },
        { code: "D-001", description: "Unit salah", unit: "m3", quantity: 3 },
        { code: "D-001", description: "OK", unit: "kps", quantity: 100 },
      ],
    });
    expect(r.lines.map((l) => l.status)).toEqual(["needs_review", "needs_review", "needs_review", "needs_review", "priced"]);
    expect(r.pendingReviewCount).toBe(4);
    expect(r.status).toBe("pending_qs");
    expect(r.subtotal).toBe(250); // 1.5 / 0.6 = 2.50 × 100
  });

  it("applies commercial factor, charges, contingency, minimum charge and SST in sen", () => {
    const r = calculateQuotation({
      ...base,
      segment: "commercial",
      settings: { ...S, contingencyPct: 0.05, sstEnabled: true, sstPct: 0.08 },
      additionalCharges: [{ name: "Pengangkutan", kind: "fixed", amount: 150 }, { name: "Permit", kind: "percent", amount: 2 }],
      lines: [{ code: "D-001", description: "Cat", unit: "kps", quantity: 1000 }],
    });
    // cost 1.5 × 1.15 = 1.725 → /0.6 = 2.875 → 2.90
    expect(r.lines[0].rate).toBe(2.9);
    expect(r.subtotal).toBe(2900);
    expect(r.additionalTotal).toBe(150 + 58);
    expect(r.contingency).toBe(Math.round((2900 + 208) * 0.05 * 100) / 100);
    expect(r.sst).toBe(Math.round(r.preTax * 0.08 * 100) / 100);
    expect(r.grandTotal).toBeCloseTo(r.preTax + r.sst, 2);

    const small = calculateQuotation({ ...base, minimumCharge: 500, lines: [{ code: "D-001", description: "Cat", unit: "kps", quantity: 10 }] });
    expect(small.minimumChargeAdjustment).toBe(475);
    expect(small.grandTotal).toBe(500);
  });

  it("never lets a project override go below the minimum margin", () => {
    const r = calculateQuotation({ ...base, overrides: { targetMargin: 0.2 }, lines: [{ code: "D-001", description: "Cat", unit: "kps", quantity: 1 }] });
    expect(r.internal.settings.targetMargin).toBe(0.35);
    expect(r.internal.warnings.length).toBe(1);
  });

  it("matches location factors by keyword", () => {
    const rules = [
      { keywords: ["kluang"], factor: 1, active: true },
      { keywords: ["johor bahru", "jb"], factor: 1.11, active: true },
    ];
    expect(matchLocationFactor("Taman Sri Kluang", rules)).toBe(1);
    expect(matchLocationFactor("Skudai, Johor Bahru", rules)).toBe(1.11);
    expect(matchLocationFactor("Ipoh", rules)).toBe(1);
  });
});
