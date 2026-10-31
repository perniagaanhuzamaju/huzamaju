import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { customers, quotations } from "@/db/schema";
import { handle, HttpError } from "@/lib/api";
import { portalApiContext } from "@/lib/data/portal";
import { getQuotationByToken } from "@/lib/quotation/service";
import { rateLimit, RateLimitError } from "@/lib/security/rate-limit";
import { audit } from "@/lib/audit";

const Body = z.object({ link: z.string().trim().min(10).max(500) });

/** Adds an estimate to the portal. Holding its private link is the proof of ownership. */
export const POST = handle(async (req: Request) => {
  const { user, customerId } = await portalApiContext();
  if (!(await rateLimit(`claim:${user.id}`, 10, 3600)).allowed) throw new RateLimitError();
  const { link } = Body.parse(await req.json());
  const token = link.split("/q/").pop()!.split(/[?#/]/)[0];
  const found = await getQuotationByToken(token);
  if (!found) throw new HttpError(404, "Pautan sebut harga tidak sah");
  const { q } = found;
  if (q.customerId && q.customerId !== customerId) {
    const [owner] = await db.select({ userId: customers.userId }).from(customers).where(eq(customers.id, q.customerId));
    if (owner?.userId && owner.userId !== user.id) throw new HttpError(409, "Sebut harga ini telah dikaitkan dengan akaun lain");
  }
  await db.update(quotations).set({ customerId, updatedAt: new Date() }).where(eq(quotations.id, q.id));
  await audit(user.id, "quotation.claim", "quotation", q.id);
  return NextResponse.json({ ok: true, number: q.number });
});
