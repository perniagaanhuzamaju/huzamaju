import { handle, HttpError } from "@/lib/api";
import { rateLimit, RateLimitError } from "@/lib/security/rate-limit";
import { clientIp } from "@/lib/security/request";
import { hashIp } from "@/lib/security/crypto";
import { getQuotationByToken, toPublicView } from "@/lib/quotation/service";
import { renderQuotationPdf } from "@/lib/quotation/pdf";
import { quotationCustomer } from "@/lib/quotation/customer";

export const GET = handle(async (_req: Request, ctx: RouteContext<"/api/quotation/[token]/pdf">) => {
  if (!(await rateLimit(`qpdf:${hashIp(await clientIp()) ?? "unknown"}`, 60, 3600)).allowed) throw new RateLimitError();
  const found = await getQuotationByToken((await ctx.params).token);
  if (!found) throw new HttpError(404, "Sebut harga tidak dijumpai");
  const view = toPublicView(found.q, found.items);
  const pdf = await renderQuotationPdf(view, await quotationCustomer(found.q.customerId));
  return new Response(new Uint8Array(pdf), {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `inline; filename="${view.number}.pdf"`,
      "cache-control": "private, no-store",
      "x-robots-tag": "noindex",
    },
  });
});
