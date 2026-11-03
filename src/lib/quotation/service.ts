import "server-only";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { quotationItems, quotations, websiteContent } from "@/db/schema";
import { calculateQuotation, type CalcResult } from "@/lib/pricing/engine";
import { randomToken } from "@/lib/security/crypto";
import type { Estimate } from "@/lib/ai/schema";
import { loadPricingContext } from "./context";
import { addDays, klToday, nextQuotationNumber } from "./number";

export const DISCLAIMER = {
  ms: "Anggaran Bajet Awal – Tertakluk kepada Pemeriksaan Tapak dan Pengesahan Akhir",
  en: "Preliminary Budget Estimate – Subject to Site Inspection and Final Verification",
};

export const DEFAULT_TERMS = {
  ms: [
    "Dokumen ini ialah anggaran bajet awal yang dijana secara automatik berdasarkan maklumat yang diberikan. Ia bukan sebut harga rasmi atau tawaran kontrak.",
    "Harga dikira daripada pangkalan harga HUZA MAJU yang diluluskan. Kuantiti dan skop tertakluk kepada pemeriksaan tapak dan pengesahan oleh QS syarikat.",
    "Item bertanda 'Semakan QS' belum dihargakan dan akan disahkan dalam sebut harga rasmi.",
    "Sebut harga rasmi hanya sah selepas diluluskan dan ditandatangani oleh wakil syarikat yang diberi kuasa.",
    "Harga tidak termasuk SST kerana syarikat tidak berdaftar SST, melainkan dinyatakan sebaliknya.",
    "Tidak termasuk kelulusan pihak berkuasa tempatan, yuran perunding, dan kerja di luar skop yang disenaraikan, melainkan dinyatakan.",
  ],
  en: [
    "This document is a preliminary budget estimate generated automatically from the information provided. It is not a formal quotation or contract offer.",
    "Prices are calculated from HUZA MAJU's approved pricing database. Quantities and scope are subject to site inspection and verification by the company's QS.",
    "Items marked 'QS review' are not yet priced and will be confirmed in the formal quotation.",
    "A formal quotation is valid only once approved and signed by an authorised company representative.",
    "Prices exclude SST as the company is not SST registered, unless stated otherwise.",
    "Local authority approvals, consultant fees and works outside the listed scope are excluded unless stated.",
  ],
};

export async function quotationTerms(lang: "ms" | "en"): Promise<string[]> {
  const r = await db.select().from(websiteContent).where(eq(websiteContent.key, "quotation_terms")).limit(1);
  const v = (lang === "ms" ? r[0]?.valueMs : r[0]?.valueEn || r[0]?.valueMs)?.trim();
  return v ? v.split(/\n+/).map((s) => s.trim()).filter(Boolean) : DEFAULT_TERMS[lang];
}

export type QuotationInputs = {
  lang: "ms" | "en";
  categoryKey: string;
  work: string;
  customerName?: string;
  customerPhone?: string;
  location: string;
  projectType: string;
  buildingType: string;
  measurements: string;
  quantity: string;
  materialPreference: string;
  specifications: string;
  siteConditions: string;
  timeline: string;
  remarks: string;
  answers: { question: string; answer: string }[];
  uploadIds: number[];
  refinements: number;
  aiModel?: string;
};

export async function priceEstimate(
  estimate: Estimate,
  categoryKey: string,
  segment: "residential" | "commercial",
  location: string | null,
  overrides: Record<string, number> = {},
) {
  const ctx = await loadPricingContext(categoryKey, segment, location);
  const calc = calculateQuotation({
    lines: estimate.line_items.map((li) => ({
      code: li.pricing_code,
      description: li.description,
      unit: li.unit,
      quantity: li.quantity,
      quantityBasis: li.quantity_basis,
    })),
    rates: ctx.rates,
    settings: ctx.settings,
    segment,
    locationFactor: ctx.locationFactor,
    additionalCharges: ctx.additionalCharges,
    minimumCharge: ctx.minimumCharge,
    overrides,
  });
  return { calc, ctx };
}

function snapshot(calc: CalcResult, locationName: string | null) {
  return {
    internal: calc.internal,
    lineComponents: calc.lines.map((l) => ({ sort: l.sort, code: l.code, costRate: l.costRate, components: l.components ?? null })),
    public: { additional: calc.additional, minimumChargeAdjustment: calc.minimumChargeAdjustment, locationName, preTax: calc.preTax },
  };
}

function totals(calc: CalcResult) {
  return {
    subtotal: calc.subtotal,
    additionalTotal: calc.additionalTotal + calc.minimumChargeAdjustment,
    contingency: calc.contingency,
    sst: calc.sst,
    grandTotal: calc.grandTotal,
    rangeLow: calc.rangeLow,
    rangeHigh: calc.rangeHigh,
    pendingReviewCount: calc.pendingReviewCount,
  };
}

const itemRows = (quotationId: number, calc: CalcResult) =>
  calc.lines.map((l) => ({
    quotationId,
    sort: l.sort,
    pricingItemId: l.pricingItemId,
    code: l.code,
    description: l.description,
    unit: l.unit,
    quantity: l.quantity,
    costRate: l.costRate,
    rate: l.rate,
    amount: l.amount,
    status: l.status,
    reviewReason: l.reviewReason,
    quantityBasis: l.quantityBasis ?? null,
  }));

export async function createAiQuotation(args: {
  inputs: QuotationInputs;
  title: string;
  segment: "residential" | "commercial";
  estimate: Estimate;
  partnerId: number | null;
  userId: number | null;
  customerId: number | null;
}) {
  const { calc, ctx } = await priceEstimate(args.estimate, args.inputs.categoryKey, args.segment, args.inputs.location);
  const number = await nextQuotationNumber();
  const issueDate = klToday();
  const token = randomToken(24);
  const terms = await quotationTerms(args.inputs.lang);
  return db.transaction(async (tx) => {
    const [q] = await tx
      .insert(quotations)
      .values({
        number,
        publicToken: token,
        status: calc.status,
        source: "ai",
        customerId: args.customerId,
        partnerId: args.partnerId,
        category: args.inputs.categoryKey,
        segment: args.segment,
        title: args.title.slice(0, 300),
        projectLocation: args.inputs.location.slice(0, 300) || null,
        inputs: args.inputs as unknown as Record<string, unknown>,
        aiAnalysis: args.estimate as unknown as Record<string, unknown>,
        calcSnapshot: snapshot(calc, ctx.locationName),
        ...totals(calc),
        requiresSiteInspection: args.estimate.requires_site_inspection || calc.pendingReviewCount > 0,
        validityDays: ctx.settings.validityDays,
        issueDate,
        validUntil: addDays(issueDate, ctx.settings.validityDays),
        terms: terms.join("\n"),
        createdBy: args.userId,
      })
      .returning({ id: quotations.id });
    const rows = itemRows(q.id, calc);
    if (rows.length) await tx.insert(quotationItems).values(rows);
    return { id: q.id, token, number, calc };
  });
}

/** Re-prices a quotation after new AI output or admin changes; replaces its line items. */
export async function repriceQuotation(id: number, estimate: Estimate, inputsPatch?: Partial<QuotationInputs>) {
  const [q] = await db.select().from(quotations).where(eq(quotations.id, id)).limit(1);
  if (!q) throw new Error("Quotation not found");
  const { calc, ctx } = await priceEstimate(estimate, q.category, q.segment as "residential" | "commercial", q.projectLocation, q.overridesJson);
  await db.transaction(async (tx) => {
    await tx
      .update(quotations)
      .set({
        status: calc.status,
        aiAnalysis: estimate as unknown as Record<string, unknown>,
        calcSnapshot: snapshot(calc, ctx.locationName),
        ...totals(calc),
        requiresSiteInspection: estimate.requires_site_inspection || calc.pendingReviewCount > 0,
        ...(inputsPatch ? { inputs: { ...q.inputs, ...inputsPatch } } : {}),
        updatedAt: new Date(),
      })
      .where(eq(quotations.id, id));
    await tx.delete(quotationItems).where(eq(quotationItems.quotationId, id));
    const rows = itemRows(id, calc);
    if (rows.length) await tx.insert(quotationItems).values(rows);
  });
  return calc;
}

export async function getQuotationByToken(token: string) {
  if (!/^[A-Za-z0-9_-]{20,64}$/.test(token)) return null;
  const [q] = await db.select().from(quotations).where(eq(quotations.publicToken, token)).limit(1);
  if (!q) return null;
  const items = await db.select().from(quotationItems).where(eq(quotationItems.quotationId, q.id)).orderBy(asc(quotationItems.sort));
  return { q, items };
}

export type PublicQuotation = ReturnType<typeof toPublicView>;

/** The customer-safe view: no cost rates, margins, components or internal warnings. */
export function toPublicView(q: typeof quotations.$inferSelect, items: (typeof quotationItems.$inferSelect)[]) {
  const inputs = q.inputs as Partial<QuotationInputs>;
  const ai = (q.aiAnalysis ?? {}) as Partial<Estimate>;
  const pub = ((q.calcSnapshot as { public?: { additional?: { name: string; amount: number }[]; minimumChargeAdjustment?: number; locationName?: string | null } } | null)?.public) ?? {};
  const lang = inputs.lang ?? "ms";
  const expired = q.validUntil < klToday();
  return {
    number: q.number,
    token: q.publicToken,
    status: expired && ["preliminary", "pending_qs"].includes(q.status) ? "expired" : q.status,
    lang,
    title: q.title,
    category: q.category,
    work: inputs.work ?? "",
    segment: q.segment,
    location: q.projectLocation,
    issueDate: q.issueDate,
    validUntil: q.validUntil,
    summary: ai.project_summary ?? "",
    scope: ai.scope_of_work ?? [],
    missingInformation: ai.missing_information ?? [],
    assumptions: ai.assumptions ?? [],
    recommendedMaterials: ai.recommended_materials ?? [],
    risks: ai.risks ?? [],
    items: items
      .filter((i) => i.status !== "excluded")
      .map((i) => ({
        sort: i.sort,
        description: i.description,
        unit: i.unit,
        quantity: i.quantity,
        rate: i.status === "priced" ? i.rate : null,
        amount: i.status === "priced" ? i.amount : null,
        status: i.status as "priced" | "needs_review",
        reviewReason: i.reviewReason,
        basis: i.quantityBasis,
      })),
    additional: pub.additional ?? [],
    minimumChargeAdjustment: pub.minimumChargeAdjustment ?? 0,
    subtotal: q.subtotal,
    additionalTotal: q.additionalTotal,
    contingency: q.contingency,
    sst: q.sst,
    grandTotal: q.grandTotal,
    rangeLow: q.rangeLow,
    rangeHigh: q.rangeHigh,
    pendingReviewCount: q.pendingReviewCount,
    requiresSiteInspection: q.requiresSiteInspection,
    disclaimer: DISCLAIMER[lang],
    terms: (q.terms ?? "").split("\n").filter(Boolean),
    hasContact: !!q.customerId,
    formalRequestedAt: q.formalRequestedAt?.toISOString() ?? null,
    siteVisitRequestedAt: q.siteVisitRequestedAt?.toISOString() ?? null,
    refinements: inputs.refinements ?? 0,
    isFormal: ["approved", "sent", "accepted"].includes(q.status),
  };
}
