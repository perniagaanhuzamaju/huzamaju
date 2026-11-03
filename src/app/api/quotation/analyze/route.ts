import { NextResponse } from "next/server";
import { inArray } from "drizzle-orm";
import { db } from "@/db";
import { projectDocuments } from "@/db/schema";
import { handle, HttpError } from "@/lib/api";
import { quoteCategory } from "@/lib/catalog";
import { clientIp } from "@/lib/security/request";
import { hashIp, sha256 } from "@/lib/security/crypto";
import { normalizePhone } from "@/lib/phone";
import { env } from "@/lib/env";
import { rateLimit, RateLimitError } from "@/lib/security/rate-limit";
import { verifyHuman } from "@/lib/security/turnstile";
import { currentUser } from "@/lib/auth/session";
import { referralPartnerId } from "@/lib/data/crm";
import { runEstimator, EstimatorUnavailable } from "@/lib/ai/estimator";
import type { Estimate } from "@/lib/ai/schema";
import { BriefInput } from "@/lib/quotation/brief";
import { loadPricingContext } from "@/lib/quotation/context";
import { sessionUploads, toAttachments } from "@/lib/quotation/uploads";
import { createAiQuotation, getQuotationByToken, toPublicView, type QuotationInputs } from "@/lib/quotation/service";

export const maxDuration = 300;

/** An empty estimate used when the AI is unavailable: the request still reaches a QS. */
const emptyEstimate = (lang: "ms" | "en", category: string): Estimate => ({
  project_category: category,
  project_summary:
    lang === "ms"
      ? "Analisis automatik tidak tersedia buat masa ini. QS kami akan menyemak maklumat anda dan menyediakan anggaran secara manual."
      : "Automatic analysis is not available right now. Our QS will review your details and prepare the estimate manually.",
  scope_of_work: [],
  line_items: [],
  missing_information: [],
  recommended_materials: [],
  assumptions: [],
  risks: [],
  requires_site_inspection: true,
  pricing_status: "insufficient_information",
});

export const POST = handle(async (req: Request) => {
  const ip = await clientIp();
  const ipHash = hashIp(ip);
  if (!(await rateLimit(`analyze:${ipHash ?? "unknown"}`, 12, 3600)).allowed) throw new RateLimitError();

  const b = BriefInput.parse(await req.json().catch(() => ({})));
  if (b.website) throw new HttpError(400, "Permintaan ditolak");
  if (!(await verifyHuman(b.turnstileToken, ip))) throw new HttpError(400, "Pengesahan keselamatan gagal. Sila cuba lagi.");
  const cat = quoteCategory(b.categoryKey);
  if (!cat) throw new HttpError(400, "Kategori tidak sah");

  const user = await currentUser();
  const partnerId = await referralPartnerId();
  const docs = await sessionUploads(b.uploadIds);
  const ctx = await loadPricingContext(cat.key, cat.segment, b.location);

  const inputs: QuotationInputs = {
    lang: b.lang,
    categoryKey: cat.key,
    work: b.work,
    customerName: b.customerName,
    customerPhone: b.customerPhone,
    location: b.location,
    projectType: b.projectType,
    buildingType: b.buildingType,
    measurements: b.measurements,
    quantity: b.quantity,
    materialPreference: b.materialPreference,
    specifications: b.specifications,
    siteConditions: b.siteConditions,
    timeline: b.timeline,
    remarks: b.remarks,
    answers: [],
    uploadIds: docs.map((d) => d.id),
    refinements: 0,
  };

  let estimate: Estimate;
  let aiUnavailable: string | null = null;
  try {
    const r = await runEstimator({
      brief: { ...inputs, category: cat.name[b.lang], segment: cat.segment },
      candidates: ctx.candidates,
      attachments: await toAttachments(docs),
      ipHash,
      phoneHash: sha256(`${env().SESSION_SECRET}:phone:${normalizePhone(b.customerPhone)}`).slice(0, 32),
      userId: user?.id ?? null,
    });
    estimate = r.estimate;
    inputs.aiModel = r.model;
  } catch (e) {
    if (!(e instanceof EstimatorUnavailable)) throw e;
    if (e.reason === "ip_limit") throw new RateLimitError(e.message);
    aiUnavailable = e.reason;
    estimate = emptyEstimate(b.lang, cat.name.ms);
  }

  const created = await createAiQuotation({
    inputs,
    title: `${cat.name[b.lang]} – ${b.work}`,
    segment: cat.segment,
    estimate,
    partnerId,
    userId: user?.id ?? null,
    customerId: null,
  });
  if (docs.length) await db.update(projectDocuments).set({ quotationId: created.id }).where(inArray(projectDocuments.id, docs.map((d) => d.id)));

  const full = await getQuotationByToken(created.token);
  return NextResponse.json({ token: created.token, aiUnavailable, quotation: toPublicView(full!.q, full!.items) });
});
