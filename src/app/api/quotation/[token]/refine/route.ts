import { NextResponse } from "next/server";
import { handle, HttpError } from "@/lib/api";
import { quoteCategory } from "@/lib/catalog";
import { clientIp } from "@/lib/security/request";
import { hashIp } from "@/lib/security/crypto";
import { currentUser } from "@/lib/auth/session";
import { runEstimator, EstimatorUnavailable } from "@/lib/ai/estimator";
import { RateLimitError } from "@/lib/security/rate-limit";
import { RefineInput } from "@/lib/quotation/brief";
import { loadPricingContext } from "@/lib/quotation/context";
import { getQuotationByToken, repriceQuotation, toPublicView, type QuotationInputs } from "@/lib/quotation/service";
import { db } from "@/db";
import { projectDocuments } from "@/db/schema";
import { eq } from "drizzle-orm";
import { toAttachments } from "@/lib/quotation/uploads";

const MAX_REFINEMENTS = 2;

/** Re-runs the estimator with the customer's answers to the follow-up questions. */
export const POST = handle(async (req: Request, ctx: RouteContext<"/api/quotation/[token]/refine">) => {
  const found = await getQuotationByToken((await ctx.params).token);
  if (!found) throw new HttpError(404, "Sebut harga tidak dijumpai");
  const { q } = found;
  const inputs = q.inputs as unknown as QuotationInputs;
  if (q.source !== "ai" || !["preliminary", "pending_qs"].includes(q.status) || q.formalRequestedAt) throw new HttpError(409, "Anggaran ini tidak boleh dikemas kini lagi");
  if ((inputs.refinements ?? 0) >= MAX_REFINEMENTS) throw new HttpError(409, "Had kemas kini telah dicapai. QS kami akan menyemak selebihnya.");
  const cat = quoteCategory(q.category);
  if (!cat) throw new HttpError(400, "Kategori tidak sah");

  const { answers } = RefineInput.parse(await req.json().catch(() => ({})));
  const merged = [...(inputs.answers ?? []), ...answers.filter((a) => a.answer)].slice(-16);
  const user = await currentUser();
  const pctx = await loadPricingContext(q.category, cat.segment, q.projectLocation);
  const docs = await db.select().from(projectDocuments).where(eq(projectDocuments.quotationId, q.id));
  try {
    const r = await runEstimator({
      brief: { ...inputs, answers: merged, category: cat.name[inputs.lang], segment: cat.segment },
      candidates: pctx.candidates,
      attachments: await toAttachments(docs),
      ipHash: hashIp(await clientIp()),
      userId: user?.id ?? null,
      quotationId: q.id,
      purpose: "refine",
    });
    await repriceQuotation(q.id, r.estimate, { answers: merged, refinements: (inputs.refinements ?? 0) + 1, aiModel: r.model });
  } catch (e) {
    if (e instanceof EstimatorUnavailable) {
      if (e.reason === "ip_limit") throw new RateLimitError(e.message);
      throw new HttpError(503, "Analisis AI tidak tersedia buat masa ini. Jawapan anda boleh dihantar terus kepada QS melalui borang permintaan.");
    }
    throw e;
  }
  const full = await getQuotationByToken(q.publicToken);
  return NextResponse.json({ quotation: toPublicView(full!.q, full!.items) });
});
