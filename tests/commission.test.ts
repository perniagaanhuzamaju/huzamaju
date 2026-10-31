import { describe, it, expect } from "vitest";
import { selectRule, commissionTotal, tranches, eligibleTranches, type CommissionRule } from "@/lib/commission/engine";

const rule = (p: Partial<CommissionRule>): CommissionRule => ({
  id: 1, name: "r", partnerType: "all", serviceCategory: null, minProjectValue: null, maxProjectValue: null,
  kind: "percent", amount: 3, capAmount: null, campaignBonus: 0, milestones: [{ paymentPct: 100, commissionPct: 100 }],
  validFrom: null, validTo: null, priority: 0, active: true, ...p,
});

describe("commission engine", () => {
  const rules = [
    rule({ id: 1, name: "Generic 3%" }),
    rule({ id: 2, name: "Agent reno 5%", partnerType: "agent", serviceCategory: "house_renovation", amount: 5 }),
    rule({ id: 3, name: "Big projects fixed", kind: "fixed", amount: 5000, minProjectValue: 200000, priority: 5 }),
    rule({ id: 4, name: "Expired campaign", amount: 10, priority: 9, validTo: "2026-01-31" }),
    rule({ id: 5, name: "Inactive", amount: 20, priority: 10, active: false }),
  ];
  it("selects the most specific active rule in date", () => {
    expect(selectRule(rules, { partnerType: "agent", serviceCategory: "house_renovation", projectValue: 50000, date: "2026-11-01" })?.id).toBe(2);
    expect(selectRule(rules, { partnerType: "referral", serviceCategory: "house_renovation", projectValue: 50000, date: "2026-11-01" })?.id).toBe(1);
    expect(selectRule(rules, { partnerType: "agent", serviceCategory: "road_works", projectValue: 300000, date: "2026-11-01" })?.id).toBe(3);
    expect(selectRule(rules, { partnerType: "agent", serviceCategory: "road_works", projectValue: 300000, date: "2026-01-15" })?.id).toBe(4);
  });
  it("computes totals with cap and bonus", () => {
    expect(commissionTotal(rule({ amount: 3 }), 45678.9)).toBe(1370.37);
    expect(commissionTotal(rule({ amount: 3, capAmount: 1000, campaignBonus: 200 }), 100000)).toBe(1200);
    expect(commissionTotal(rule({ kind: "fixed", amount: 500 }), 100000)).toBe(500);
  });
  it("splits into milestone tranches and releases them only against verified payments", () => {
    const r = rule({ milestones: [{ paymentPct: 30, commissionPct: 50 }, { paymentPct: 100, commissionPct: 50 }] });
    const t = tranches(r, 1000.01);
    expect(t.map((x) => x.amount)).toEqual([500.01, 500]);
    expect(t.reduce((a, x) => a + x.amount, 0)).toBeCloseTo(1000.01, 2);
    expect(eligibleTranches(t, 0, 50000)).toEqual([]);
    expect(eligibleTranches(t, 15000, 50000)).toEqual([1]);
    expect(eligibleTranches(t, 50000, 50000)).toEqual([1, 2]);
    expect(() => tranches(rule({ milestones: [{ paymentPct: 50, commissionPct: 60 }] }), 100)).toThrow();
  });
});
