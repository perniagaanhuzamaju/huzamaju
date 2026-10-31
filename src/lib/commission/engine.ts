/**
 * Configurable commission engine. Nothing here is hardcoded: rules come from
 * the commission_rules table. Commission is only ever created for a secured
 * project and only becomes eligible against verified client payments.
 */

export type CommissionRule = {
  id: number;
  name: string;
  partnerType: "all" | "referral" | "agent";
  serviceCategory: string | null;
  minProjectValue: number | null;
  maxProjectValue: number | null;
  kind: "fixed" | "percent";
  amount: number;
  capAmount: number | null;
  campaignBonus: number;
  milestones: { paymentPct: number; commissionPct: number }[];
  validFrom: string | null;
  validTo: string | null;
  priority: number;
  active: boolean;
};

export type CommissionContext = {
  partnerType: "referral" | "agent";
  serviceCategory: string | null;
  projectValue: number;
  date: string; // YYYY-MM-DD, the date the project was secured
};

export function selectRule(rules: CommissionRule[], ctx: CommissionContext): CommissionRule | null {
  const matches = rules.filter((r) => {
    if (!r.active) return false;
    if (r.partnerType !== "all" && r.partnerType !== ctx.partnerType) return false;
    if (r.serviceCategory && r.serviceCategory !== ctx.serviceCategory) return false;
    if (r.minProjectValue != null && ctx.projectValue < r.minProjectValue) return false;
    if (r.maxProjectValue != null && ctx.projectValue > r.maxProjectValue) return false;
    if (r.validFrom && ctx.date < r.validFrom) return false;
    if (r.validTo && ctx.date > r.validTo) return false;
    return true;
  });
  // Most specific first: higher priority, then category-specific over generic.
  matches.sort(
    (a, b) =>
      b.priority - a.priority ||
      Number(!!b.serviceCategory) - Number(!!a.serviceCategory) ||
      Number(b.partnerType !== "all") - Number(a.partnerType !== "all") ||
      a.id - b.id,
  );
  return matches[0] ?? null;
}

const sen = (rm: number) => Math.round(rm * 100);

export function commissionTotal(rule: CommissionRule, projectValue: number): number {
  let base = rule.kind === "fixed" ? sen(rule.amount) : Math.round((sen(projectValue) * rule.amount) / 100);
  if (rule.capAmount != null) base = Math.min(base, sen(rule.capAmount));
  return (base + sen(rule.campaignBonus || 0)) / 100;
}

export type Tranche = { trancheNo: number; paymentPct: number; amount: number };

/** Splits the total commission into payment-milestone tranches. The last tranche absorbs rounding. */
export function tranches(rule: CommissionRule, total: number): Tranche[] {
  const ms = [...(rule.milestones?.length ? rule.milestones : [{ paymentPct: 100, commissionPct: 100 }])].sort(
    (a, b) => a.paymentPct - b.paymentPct,
  );
  const pctSum = ms.reduce((a, m) => a + m.commissionPct, 0);
  if (Math.abs(pctSum - 100) > 0.001) throw new Error(`Milestone commission percentages must total 100 (got ${pctSum})`);
  const totalSen = sen(total);
  let allocated = 0;
  return ms.map((m, i) => {
    const amt = i === ms.length - 1 ? totalSen - allocated : Math.round((totalSen * m.commissionPct) / 100);
    allocated += amt;
    return { trancheNo: i + 1, paymentPct: m.paymentPct, amount: amt / 100 };
  });
}

/** Returns tranche numbers whose payment milestone has been met by verified client payments. */
export function eligibleTranches(all: Tranche[], verifiedPaid: number, projectValue: number): number[] {
  if (projectValue <= 0) return [];
  const paidPct = (verifiedPaid / projectValue) * 100;
  return all.filter((t) => paidPct + 1e-9 >= t.paymentPct).map((t) => t.trancheNo);
}
