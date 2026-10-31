import "server-only";
import { and, count, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { commissionTransactions, leads, referrals, payments } from "@/db/schema";
import { requirePage, requirePermission } from "@/lib/auth/session";
import { HttpError } from "@/lib/api";
import { partnerForUser } from "./partners";

export async function partnerContext() {
  const user = await requirePage("portal.partner", "/partner");
  return { user, partner: await partnerForUser(user.id) };
}

export async function partnerApiContext(requireApproved = true) {
  const user = await requirePermission("portal.partner");
  const partner = await partnerForUser(user.id);
  if (!partner) throw new HttpError(404, "Profil rakan niaga tidak dijumpai");
  if (requireApproved && partner.status !== "approved") throw new HttpError(403, "Akaun rakan niaga belum diluluskan");
  return { user, partner };
}

export async function partnerStats(partnerId: number) {
  const [[visits], leadRows, comm] = await Promise.all([
    db.select({ n: count() }).from(referrals).where(eq(referrals.partnerId, partnerId)),
    db.select({ status: leads.status, n: count() }).from(leads).where(eq(leads.partnerId, partnerId)).groupBy(leads.status),
    db
      .select({ status: commissionTransactions.status, total: sql<number>`coalesce(sum(${commissionTransactions.amount}),0)::float` })
      .from(commissionTransactions)
      .where(eq(commissionTransactions.partnerId, partnerId))
      .groupBy(commissionTransactions.status),
  ]);
  const leadBy = Object.fromEntries(leadRows.map((r) => [r.status, r.n]));
  const commBy = Object.fromEntries(comm.map((r) => [r.status, Number(r.total)]));
  return {
    visits: visits.n,
    leads: leadRows.reduce((a, r) => a + r.n, 0),
    won: leadBy.won ?? 0,
    pending: (commBy.pending ?? 0),
    eligible: (commBy.eligible ?? 0) + (commBy.approved ?? 0),
    paid: commBy.paid ?? 0,
  };
}

export const partnerLeads = (partnerId: number) => db.select().from(leads).where(eq(leads.partnerId, partnerId)).orderBy(desc(leads.createdAt));
export const partnerCommissions = (partnerId: number) =>
  db.select().from(commissionTransactions).where(eq(commissionTransactions.partnerId, partnerId)).orderBy(desc(commissionTransactions.createdAt));
export const partnerPayouts = (partnerId: number) =>
  db.select().from(payments).where(and(eq(payments.partnerId, partnerId), eq(payments.kind, "partner_payout"))).orderBy(desc(payments.paidAt));
