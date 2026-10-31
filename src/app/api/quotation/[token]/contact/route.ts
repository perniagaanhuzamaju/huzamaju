import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { quotations, leads } from "@/db/schema";
import { handle, HttpError } from "@/lib/api";
import { rateLimit, RateLimitError } from "@/lib/security/rate-limit";
import { clientIp } from "@/lib/security/request";
import { hashIp } from "@/lib/security/crypto";
import { isValidMyPhone } from "@/lib/phone";
import { currentUser } from "@/lib/auth/session";
import { createLead, customerForUser, referralPartnerId, upsertCustomer } from "@/lib/data/crm";
import { notifyStaff } from "@/lib/notify";
import { ContactInput } from "@/lib/quotation/brief";
import { getQuotationByToken, toPublicView } from "@/lib/quotation/service";

/** Step 7: attaches the customer's contact details to the estimate and opens a lead. */
export const POST = handle(async (req: Request, ctx: RouteContext<"/api/quotation/[token]/contact">) => {
  if (!(await rateLimit(`qcontact:${hashIp(await clientIp()) ?? "unknown"}`, 10, 3600)).allowed) throw new RateLimitError();
  const found = await getQuotationByToken((await ctx.params).token);
  if (!found) throw new HttpError(404, "Sebut harga tidak dijumpai");
  const { q } = found;
  const b = ContactInput.parse(await req.json().catch(() => ({})));
  if (b.website) throw new HttpError(400, "Permintaan ditolak");
  if (!isValidMyPhone(b.phone)) throw new HttpError(400, "Nombor telefon tidak sah");

  const user = await currentUser();
  const partnerId = q.partnerId ?? (await referralPartnerId());
  const customerId = user?.permissions.has("portal.customer")
    ? await customerForUser(user, { companyName: b.companyName || null, partnerId, source: "ai_quotation" })
    : await upsertCustomer({
        fullName: b.fullName,
        phone: b.phone,
        email: b.email || null,
        companyName: b.companyName || null,
        address: b.projectAddress || null,
        partnerId,
        source: "ai_quotation",
      });

  let leadId = q.leadId;
  if (leadId) {
    await db.update(leads).set({ name: b.fullName, phone: b.phone, email: b.email || null, companyName: b.companyName || null, estimatedValue: q.grandTotal || null, updatedAt: new Date() }).where(eq(leads.id, leadId));
  } else {
    const { lead } = await createLead({
      name: b.fullName,
      phone: b.phone,
      email: b.email || null,
      companyName: b.companyName || null,
      location: q.projectLocation,
      serviceCategory: q.category,
      description: `${q.title}\n${b.projectDescription}`.trim().slice(0, 4000),
      estimatedValue: q.grandTotal || null,
      source: partnerId ? "partner" : "quotation",
      partnerId,
      customerId,
    });
    leadId = lead.id;
  }

  await db
    .update(quotations)
    .set({
      customerId,
      leadId,
      partnerId,
      projectAddress: b.projectAddress || null,
      notes: b.projectDescription || q.notes,
      updatedAt: new Date(),
    })
    .where(eq(quotations.id, q.id));

  if (!q.customerId) {
    await notifyStaff(
      `Anggaran AI baharu ${q.number}`,
      `${b.fullName} (${b.phone})${b.companyName ? `, ${b.companyName}` : ""}\n${q.title}\nAnggaran: RM ${q.grandTotal.toFixed(2)}${q.pendingReviewCount ? ` · ${q.pendingReviewCount} item perlu semakan QS` : ""}`,
      `/admin/quotations/${q.id}`,
    );
  }
  const full = await getQuotationByToken(q.publicToken);
  return NextResponse.json({ quotation: toPublicView(full!.q, full!.items) });
});
