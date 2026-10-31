import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { commissionTransactions, partners, payments } from "@/db/schema";
import { handle, HttpError } from "@/lib/api";
import { requirePermission } from "@/lib/auth/session";
import { audit } from "@/lib/audit";
import { notifyUser } from "@/lib/notify";
import { klToday } from "@/lib/quotation/number";

const Body = z.discriminatedUnion("action", [
  z.object({ action: z.literal("approve") }),
  z.object({ action: z.literal("cancel"), note: z.string().trim().max(500).optional().default("") }),
  z.object({ action: z.literal("pay"), reference: z.string().trim().min(2).max(120), paidAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional() }),
]);

/** Workflow steps 8-9: approval by an authorised person, then payout with notification to the partner. */
export const PATCH = handle(async (req: Request, ctx: RouteContext<"/api/admin/commissions/[id]">) => {
  const b = Body.parse(await req.json());
  const u = await requirePermission(b.action === "cancel" ? "commissions.manage" : "commissions.approve");
  const id = Number((await ctx.params).id);
  const [t] = await db.select().from(commissionTransactions).where(eq(commissionTransactions.id, id));
  if (!t) throw new HttpError(404, "Tidak dijumpai");
  const [partner] = await db.select().from(partners).where(eq(partners.id, t.partnerId));

  if (b.action === "approve") {
    if (t.status !== "eligible") throw new HttpError(400, "Hanya komisen berstatus 'layak' (bayaran pelanggan disahkan) boleh diluluskan");
    await db.update(commissionTransactions).set({ status: "approved", approvedBy: u.id, approvedAt: new Date() }).where(eq(commissionTransactions.id, id));
  } else if (b.action === "cancel") {
    if (t.status === "paid") throw new HttpError(400, "Komisen yang telah dibayar tidak boleh dibatalkan");
    await db.update(commissionTransactions).set({ status: "cancelled", note: [t.note, b.note].filter(Boolean).join(" · ") }).where(eq(commissionTransactions.id, id));
  } else {
    if (t.status !== "approved") throw new HttpError(400, "Komisen mesti diluluskan sebelum dibayar");
    if (!partner?.payoutAccountEnc) throw new HttpError(400, "Rakan niaga belum mengisi akaun bank");
    const paidAt = b.paidAt ?? klToday();
    await db.transaction(async (tx) => {
      const [pay] = await tx.insert(payments).values({ kind: "partner_payout", partnerId: t.partnerId, projectId: t.projectId, amount: t.amount, reference: b.reference, paidAt, verifiedBy: u.id, verifiedAt: new Date(), milestone: `Komisen peringkat ${t.trancheNo}` }).returning({ id: payments.id });
      await tx.update(commissionTransactions).set({ status: "paid", paymentId: pay.id, paidAt: new Date() }).where(eq(commissionTransactions.id, id));
    });
    if (partner) await notifyUser(partner.userId, "Komisen telah dibayar", `RM ${t.amount.toFixed(2)} telah dibayar ke akaun ****${partner.payoutAccountLast4}. Rujukan: ${b.reference}`, "/partner/commissions");
  }
  await audit(u.id, `commission.${b.action}`, "commission", String(id), { amount: t.amount });
  return NextResponse.json({ ok: true });
});
