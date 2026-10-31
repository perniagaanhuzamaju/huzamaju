import { NextResponse } from "next/server";
import { handle, HttpError } from "@/lib/api";
import { rateLimit, RateLimitError } from "@/lib/security/rate-limit";
import { env } from "@/lib/env";
import { sendEmail } from "@/lib/notify";
import { COMPANY } from "@/lib/company";
import { db } from "@/db";
import { communications } from "@/db/schema";
import { getQuotationByToken, toPublicView } from "@/lib/quotation/service";
import { renderQuotationPdf } from "@/lib/quotation/pdf";
import { quotationCustomer } from "@/lib/quotation/customer";

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

/** Emails the estimate PDF to the e-mail address the customer gave in step 7 (never to an arbitrary address). */
export const POST = handle(async (_req: Request, ctx: RouteContext<"/api/quotation/[token]/email">) => {
  const found = await getQuotationByToken((await ctx.params).token);
  if (!found) throw new HttpError(404, "Sebut harga tidak dijumpai");
  if (!(await rateLimit(`qemail:${found.q.id}`, 3, 3600)).allowed) throw new RateLimitError();
  const customer = await quotationCustomer(found.q.customerId);
  if (!customer?.email) throw new HttpError(400, "Sila isi alamat e-mel dalam maklumat pelanggan dahulu");

  const view = toPublicView(found.q, found.items);
  const pdf = await renderQuotationPdf(view, customer);
  const link = `${env().APP_URL}/q/${view.token}`;
  const ms = view.lang === "ms";
  const html = `<p>${ms ? "Salam" : "Dear"} ${esc(customer.name)},</p>
<p>${ms ? "Terima kasih kerana menggunakan HUZA MAJU AI Estimator. Anggaran bajet awal anda dilampirkan." : "Thank you for using the HUZA MAJU AI Estimator. Your preliminary budget estimate is attached."}</p>
<p><b>${esc(view.number)}</b> · ${esc(view.title)}<br>${ms ? "Anggaran" : "Estimate"}: RM ${view.grandTotal.toFixed(2)}</p>
<p><i>${esc(view.disclaimer)}</i></p>
<p><a href="${link}">${ms ? "Lihat dalam talian" : "View online"}</a></p>
<p>${COMPANY.name}<br>${COMPANY.phoneDisplay} · ${COMPANY.email}</p>`;
  const r = await sendEmail(customer.email, `${view.number} · ${view.disclaimer}`, html, [{ filename: `${view.number}.pdf`, content: pdf }]);
  if (r.status === "skipped") throw new HttpError(503, "Penghantaran e-mel belum dikonfigurasi. Sila muat turun PDF.");
  if (r.status === "failed") throw new HttpError(502, "E-mel gagal dihantar. Sila cuba lagi atau muat turun PDF.");
  await db.insert(communications).values({ customerId: found.q.customerId, quotationId: found.q.id, leadId: found.q.leadId, direction: "out", channel: "email", body: `Anggaran ${view.number} dihantar ke ${customer.email}`, visibleToCustomer: true });
  return NextResponse.json({ ok: true });
});
