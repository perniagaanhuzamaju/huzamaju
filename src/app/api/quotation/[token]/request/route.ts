import { NextResponse } from "next/server";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { communications, enquiries, quotations, leads } from "@/db/schema";
import { handle, HttpError } from "@/lib/api";
import { rateLimit, RateLimitError } from "@/lib/security/rate-limit";
import { notifyStaff } from "@/lib/notify";
import { RequestInput } from "@/lib/quotation/brief";
import { getQuotationByToken, toPublicView } from "@/lib/quotation/service";
import { quotationCustomer } from "@/lib/quotation/customer";

/** Step 8: request a formal quotation or a site inspection. Both go to staff; formal quotations need approval. */
export const POST = handle(async (req: Request, ctx: RouteContext<"/api/quotation/[token]/request">) => {
  const found = await getQuotationByToken((await ctx.params).token);
  if (!found) throw new HttpError(404, "Sebut harga tidak dijumpai");
  const { q } = found;
  if (!(await rateLimit(`qreq:${q.id}`, 6, 3600)).allowed) throw new RateLimitError();
  const customer = await quotationCustomer(q.customerId);
  if (!customer) throw new HttpError(400, "Sila isi maklumat pelanggan dahulu");
  const b = RequestInput.parse(await req.json().catch(() => ({})));

  const formal = b.kind === "formal";
  const label = formal ? "Permintaan sebut harga rasmi" : "Permintaan lawatan tapak";
  const message = `${label} untuk ${q.number} (${q.title}).${b.preferredDate ? ` Tarikh pilihan: ${b.preferredDate}.` : ""}${b.notes ? `\n${b.notes}` : ""}`;
  await db.transaction(async (tx) => {
    await tx
      .update(quotations)
      .set(formal ? { formalRequestedAt: new Date(), status: q.status === "preliminary" ? "pending_qs" : q.status, updatedAt: new Date() } : { siteVisitRequestedAt: new Date(), updatedAt: new Date() })
      .where(eq(quotations.id, q.id));
    await tx.insert(enquiries).values({
      customerId: q.customerId,
      name: customer.name,
      companyName: customer.company,
      phone: customer.phone ?? "",
      email: customer.email,
      location: q.projectLocation,
      message,
      kind: formal ? "formal_quote" : "site_visit",
      source: "ai_quotation",
    });
    await tx.insert(communications).values({ customerId: q.customerId, quotationId: q.id, leadId: q.leadId, direction: "in", channel: "portal", body: message, visibleToCustomer: true });
    if (q.leadId) await tx.update(leads).set({ status: "follow_up", updatedAt: new Date() }).where(and(eq(leads.id, q.leadId), inArray(leads.status, ["new", "verified"])));
  });
  await notifyStaff(`${label}: ${q.number}`, `${customer.name} (${customer.phone})\n${message}`, `/admin/quotations/${q.id}`);
  const full = await getQuotationByToken(q.publicToken);
  return NextResponse.json({ quotation: toPublicView(full!.q, full!.items) });
});
