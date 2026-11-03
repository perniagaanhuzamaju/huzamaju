/**
 * Integration test against the local PostgreSQL database: the AI provider is
 * replaced with a fixed response (no network), everything else is real —
 * limits, usage logging, code sanitising, pricing from the database,
 * persistence, the public view and the PDF.
 */
import { afterAll, describe, expect, it, vi } from "vitest";
import type { Estimate } from "@/lib/ai/schema";

process.env.ANTHROPIC_API_KEY = "test-key-not-used";

const FIXED: Estimate = {
  project_category: "Kerja Cat",
  project_summary: "Cat semula dinding dalaman 3 bilik.",
  scope_of_work: ["Persediaan permukaan", "Cat 1 lapis sealer + 2 lapis emulsion"],
  line_items: [
    { pricing_code: "D-001", description: "Cat dinding dalaman", unit: "ft2", quantity: 1188, quantity_basis: "3 x 2(12+10) x 9", confidence: "medium" },
    { pricing_code: "Z-999", description: "Kod rekaan", unit: "unit", quantity: 1, quantity_basis: "-", confidence: "low" },
    { pricing_code: null, description: "Baiki retak dinding", unit: "lot", quantity: null, quantity_basis: "Perlu dilihat di tapak", confidence: "low" },
  ],
  missing_information: [{ question: "Warna dan jenama cat?", reason: "Mempengaruhi kos bahan" }],
  recommended_materials: ["Cat emulsion dalaman"],
  assumptions: ["Ketinggian siling 9 kaki"],
  risks: [],
  requires_site_inspection: false,
  pricing_status: "requires_database_lookup",
};

vi.mock("@/lib/ai/anthropic", () => ({
  anthropicProvider: {
    name: "anthropic",
    estimate: vi.fn(async () => ({
      output: FIXED,
      usage: { inputTokens: 1000, outputTokens: 500, cacheReadTokens: 0, cacheWriteTokens: 0 },
      model: "claude-opus-5-5",
      requestId: "req_test",
    })),
  },
}));

const { runEstimator } = await import("@/lib/ai/estimator");
const { loadPricingContext } = await import("@/lib/quotation/context");
const { createAiQuotation, getQuotationByToken, toPublicView } = await import("@/lib/quotation/service");
const { renderQuotationPdf } = await import("@/lib/quotation/pdf");
const { db } = await import("@/db");
const { aiUsageLogs, quotations, pricingItems } = await import("@/db/schema");
const { eq } = await import("drizzle-orm");

const created: number[] = [];

describe("AI quotation flow", () => {
  const brief = { lang: "ms" as const, category: "Kerja Cat", work: "Cat dalaman", segment: "residential" as const, location: "Kluang", projectType: "", buildingType: "", measurements: "3 bilik 12x10", quantity: "", materialPreference: "", specifications: "", siteConditions: "", timeline: "", remarks: "", answers: [] };

  it("caps AI estimates per phone number per day, then falls back to manual QS", async () => {
    const ctx = await loadPricingContext("painting", "residential", "Kluang, Johor");
    const phoneHash = `phone-${Date.now()}`;
    const call = (i: number) => runEstimator({ brief, candidates: ctx.candidates, attachments: [], ipHash: `ip-${Date.now()}-${i}`, phoneHash, userId: null });
    await call(1);
    await call(2);
    await expect(call(3)).rejects.toMatchObject({ reason: "contact_limit" });
  });

  it("caps AI estimates per network per day", async () => {
    const ctx = await loadPricingContext("painting", "residential", "Kluang, Johor");
    const ipHash = `ipday-${Date.now()}`;
    const call = (i: number) => runEstimator({ brief, candidates: ctx.candidates, attachments: [], ipHash, phoneHash: `p-${Date.now()}-${i}`, userId: null });
    for (let i = 0; i < 3; i++) await call(i);
    await expect(call(9)).rejects.toMatchObject({ reason: "contact_limit" });
  });

  it("requires a valid Malaysian phone number before analysis", async () => {
    const { BriefInput } = await import("@/lib/quotation/brief");
    const base = { categoryKey: "painting", work: "Cat dalaman", location: "Kluang", customerName: "Ali" };
    expect(BriefInput.safeParse({ ...base, customerPhone: "017-871 7848" }).success).toBe(true);
    expect(BriefInput.safeParse({ ...base, customerPhone: "123" }).success).toBe(false);
    expect(BriefInput.safeParse({ ...base, customerName: "", customerPhone: "0178717848" }).success).toBe(false);
  });

  it("prices only database codes and flags the rest for QS", async () => {
    const ctx = await loadPricingContext("painting", "residential", "Kluang, Johor");
    expect(ctx.candidates.some((c) => c.code === "D-001")).toBe(true);
    const ipHash = `test-${Date.now()}`;
    const r = await runEstimator({
      brief: { lang: "ms", category: "Kerja Cat", work: "Cat dalaman", segment: "residential", location: "Kluang", projectType: "", buildingType: "", measurements: "3 bilik 12x10", quantity: "", materialPreference: "", specifications: "", siteConditions: "", timeline: "", remarks: "", answers: [] },
      candidates: ctx.candidates,
      attachments: [],
      ipHash,
      userId: null,
    });
    expect(r.estimate.line_items[1].pricing_code).toBeNull(); // invented code removed

    const log = await db.select().from(aiUsageLogs).where(eq(aiUsageLogs.ipHash, ipHash));
    expect(log[0].status).toBe("ok");
    expect(log[0].costUsd).toBeCloseTo((1000 * 4 + 500 * 20) / 1e6, 5);

    const q = await createAiQuotation({
      inputs: { lang: "ms", categoryKey: "painting", work: "Cat dalaman", location: "Kluang, Johor", projectType: "", buildingType: "", measurements: "", quantity: "", materialPreference: "", specifications: "", siteConditions: "", timeline: "", remarks: "", answers: [], uploadIds: [], refinements: 0 },
      title: "Kerja Cat – Cat dalaman",
      segment: "residential",
      estimate: r.estimate,
      partnerId: null,
      userId: null,
      customerId: null,
    });
    created.push(q.id);
    expect(q.number).toMatch(/^HM-SH-\d{4}-\d{4}$/);

    const [d001] = await db.select().from(pricingItems).where(eq(pricingItems.code, "D-001"));
    const full = (await getQuotationByToken(q.token))!;
    const view = toPublicView(full.q, full.items);
    expect(view.status).toBe("pending_qs");
    expect(view.pendingReviewCount).toBe(2);
    const priced = view.items.find((i) => i.status === "priced")!;
    expect(priced.quantity).toBe(1188);
    expect(priced.rate).toBeGreaterThan(d001.totalBaseRate); // selling rate above cost
    expect(priced.amount).toBeCloseTo(priced.rate! * 1188, 2);
    expect(view.grandTotal).toBeGreaterThan(0);
    // customer view never carries cost data
    expect(JSON.stringify(view)).not.toMatch(/costRate|margin|components/i);
    expect(view.disclaimer).toContain("Anggaran Bajet Awal");

    const pdf = await renderQuotationPdf(view, { name: "Pelanggan Ujian" });
    expect(pdf.subarray(0, 5).toString()).toBe("%PDF-");
    expect(pdf.length).toBeGreaterThan(5000);
    if (process.env.PDF_OUT) (await import("node:fs")).writeFileSync(process.env.PDF_OUT, pdf);
  });
});

afterAll(async () => {
  if (process.env.KEEP_TEST_DATA) return;
  for (const id of created) await db.delete(quotations).where(eq(quotations.id, id));
});
