import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { quotations } from "@/db/schema";
import { handle, HttpError } from "@/lib/api";
import { requirePermission } from "@/lib/auth/session";
import { audit } from "@/lib/audit";
import { UNITS } from "@/lib/pricing/units";
import type { Estimate } from "@/lib/ai/schema";
import { repriceQuotation } from "@/lib/quotation/service";
import { addDays } from "@/lib/quotation/number";
import { loadPricingSettings } from "@/lib/quotation/context";

const Items = z.object({
  action: z.literal("items"),
  items: z.array(z.object({
    pricing_code: z.string().trim().max(30).nullable(),
    description: z.string().trim().min(1).max(400),
    unit: z.enum(UNITS),
    quantity: z.number().positive().nullable(),
    quantity_basis: z.string().trim().max(600).default(""),
  })).max(200),
});
const num = z.union([z.coerce.number(), z.literal("")]).optional();
const Overrides = z.object({ action: z.literal("overrides"), targetMargin: num, contingencyPct: num, locationFactor: num, overheadPct: num, rates: z.string().max(2000).optional().default("") });
const Status = z.object({ action: z.literal("status"), status: z.enum(["sent", "accepted", "rejected", "cancelled", "pending_qs"]) });
const Approve = z.object({ action: z.literal("approve") });
const Meta = z.object({ action: z.literal("meta"), title: z.string().trim().min(2).max(300), notes: z.string().max(5000).optional().default(""), terms: z.string().max(10000).optional().default(""), validityDays: z.coerce.number().int().min(1).max(365) });
const Body = z.discriminatedUnion("action", [Items, Overrides, Status, Approve, Meta]);

export const PATCH = handle(async (req: Request, ctx: RouteContext<"/api/admin/quotations/[id]">) => {
  const id = Number((await ctx.params).id);
  const b = Body.parse(await req.json());
  const u = await requirePermission(b.action === "approve" ? "quotations.approve" : "quotations.edit");
  const [q] = await db.select().from(quotations).where(eq(quotations.id, id));
  if (!q) throw new HttpError(404, "Tidak dijumpai");
  const est = (q.aiAnalysis ?? {}) as Estimate;

  if (b.action === "items") {
    const estimate: Estimate = {
      project_category: est.project_category ?? q.category,
      project_summary: est.project_summary ?? "",
      scope_of_work: est.scope_of_work ?? [],
      missing_information: [],
      recommended_materials: est.recommended_materials ?? [],
      assumptions: est.assumptions ?? [],
      risks: est.risks ?? [],
      requires_site_inspection: est.requires_site_inspection ?? true,
      pricing_status: "requires_database_lookup",
      line_items: b.items.map((i) => ({ ...i, pricing_code: i.pricing_code || null, confidence: "high" as const })),
    };
    await repriceQuotation(id, estimate);
    await audit(u.id, "quotation.items", "quotation", String(id), { count: b.items.length });
  } else if (b.action === "overrides") {
    const settings = await loadPricingSettings();
    const o: Record<string, number> = {};
    for (const k of ["targetMargin", "contingencyPct", "locationFactor", "overheadPct"] as const) if (b[k] !== "" && b[k] != null) o[k] = Number(b[k]);
    if (o.targetMargin != null && o.targetMargin < settings.minMargin && !u.permissions.has("quotations.approve"))
      throw new HttpError(403, `Margin di bawah minimum ${settings.minMargin} memerlukan kebenaran kelulusan`);
    for (const line of b.rates.split(/\n|,/).map((s) => s.trim()).filter(Boolean)) {
      const m = line.match(/^([A-Z]-\d{3,})\s*[=:]\s*([\d.]+)$/i);
      if (!m) throw new HttpError(400, `Format kadar khas tidak sah: "${line}" (guna KOD=kadar)`);
      o[`rate:${m[1].toUpperCase()}`] = Number(m[2]);
    }
    await db.update(quotations).set({ overridesJson: o }).where(eq(quotations.id, id));
    await repriceQuotation(id, est);
    await audit(u.id, "quotation.overrides", "quotation", String(id), o);
  } else if (b.action === "approve") {
    if (q.pendingReviewCount > 0) throw new HttpError(400, "Masih ada item belum dihargakan. Lengkapkan semua item sebelum kelulusan.");
    if (q.grandTotal <= 0) throw new HttpError(400, "Jumlah sebut harga RM0");
    await db.update(quotations).set({ status: "approved", approvedBy: u.id, approvedAt: new Date(), updatedAt: new Date() }).where(eq(quotations.id, id));
    await audit(u.id, "quotation.approve", "quotation", String(id), { total: q.grandTotal });
  } else if (b.action === "status") {
    if (["sent", "accepted"].includes(b.status) && !["approved", "sent", "accepted"].includes(q.status))
      throw new HttpError(400, "Sebut harga rasmi mesti diluluskan dahulu");
    await db.update(quotations).set({ status: b.status, updatedAt: new Date() }).where(eq(quotations.id, id));
    await audit(u.id, "quotation.status", "quotation", String(id), { from: q.status, to: b.status });
  } else {
    await db
      .update(quotations)
      .set({ title: b.title, notes: b.notes || null, terms: b.terms || null, validityDays: b.validityDays, validUntil: addDays(q.issueDate, b.validityDays), updatedAt: new Date() })
      .where(eq(quotations.id, id));
    await audit(u.id, "quotation.meta", "quotation", String(id));
  }
  return NextResponse.json({ ok: true });
});
