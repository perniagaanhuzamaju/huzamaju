import "server-only";
import { and, eq, gt, ne, or } from "drizzle-orm";
import { cookies } from "next/headers";
import { db } from "@/db";
import { customers, leads, partners } from "@/db/schema";
import { normalizePhone } from "@/lib/phone";

/** Finds a customer by phone or email, or creates one. */
export async function upsertCustomer(input: { fullName: string; phone: string; email?: string | null; companyName?: string | null; address?: string | null; userId?: number | null; partnerId?: number | null; source?: string }) {
  const phoneNormalized = normalizePhone(input.phone);
  const where = input.email ? or(eq(customers.phoneNormalized, phoneNormalized), eq(customers.email, input.email.toLowerCase())) : eq(customers.phoneNormalized, phoneNormalized);
  const existing = await db.select().from(customers).where(where).limit(1);
  if (existing[0]) {
    const c = existing[0];
    await db
      .update(customers)
      .set({
        companyName: c.companyName ?? input.companyName ?? null,
        email: c.email ?? input.email?.toLowerCase() ?? null,
        address: c.address ?? input.address ?? null,
        partnerId: c.partnerId ?? input.partnerId ?? null,
      })
      .where(eq(customers.id, c.id));
    return c.id;
  }
  const [row] = await db
    .insert(customers)
    .values({
      fullName: input.fullName,
      phone: input.phone,
      phoneNormalized,
      email: input.email?.toLowerCase() ?? null,
      companyName: input.companyName ?? null,
      address: input.address ?? null,
      userId: input.userId ?? null,
      partnerId: input.partnerId ?? null,
      source: input.source ?? "website",
      consentAt: new Date(),
    })
    .returning({ id: customers.id });
  return row.id;
}

/**
 * The customer record owned by a portal user, created on first use. Portal
 * access is never granted by matching an unverified phone or e-mail to an
 * existing record; staff merge records, or the customer claims a quotation
 * with its private link.
 */
export async function customerForUser(u: { id: number; name: string; phone: string | null; email: string }, extra?: { companyName?: string | null; partnerId?: number | null; source?: string }) {
  const [c] = await db.select({ id: customers.id }).from(customers).where(eq(customers.userId, u.id)).limit(1);
  if (c) return c.id;
  const [row] = await db
    .insert(customers)
    .values({
      userId: u.id,
      fullName: u.name,
      phone: u.phone,
      phoneNormalized: u.phone ? normalizePhone(u.phone) : null,
      email: u.email.toLowerCase(),
      companyName: extra?.companyName ?? null,
      partnerId: extra?.partnerId ?? null,
      source: extra?.source ?? "portal",
      consentAt: new Date(),
    })
    .returning({ id: customers.id });
  return row.id;
}

/** Partner attributed through the referral cookie, if the partner is approved. */
export async function referralPartnerId(): Promise<number | null> {
  const code = (await cookies()).get("hm_ref")?.value;
  if (!code) return null;
  const r = await db.select({ id: partners.id }).from(partners).where(and(eq(partners.code, code), eq(partners.status, "approved"))).limit(1);
  return r[0]?.id ?? null;
}

const DUP_WINDOW_DAYS = 90;

/** Returns an existing open lead with the same phone in the last 90 days, if any. */
export async function findDuplicateLead(phone: string, excludeId?: number) {
  const since = new Date(Date.now() - DUP_WINDOW_DAYS * 864e5);
  const conds = [eq(leads.phoneNormalized, normalizePhone(phone)), gt(leads.createdAt, since), ne(leads.status, "rejected"), ne(leads.status, "duplicate")];
  if (excludeId) conds.push(ne(leads.id, excludeId));
  const r = await db.select().from(leads).where(and(...conds)).limit(1);
  return r[0] ?? null;
}

export async function createLead(input: {
  name: string; phone: string; email?: string | null; companyName?: string | null; location?: string | null; serviceCategory?: string | null;
  description?: string | null; estimatedValue?: number | null; source: string; partnerId?: number | null; customerId?: number | null;
}) {
  const dup = await findDuplicateLead(input.phone);
  const [row] = await db
    .insert(leads)
    .values({
      ...input,
      phoneNormalized: normalizePhone(input.phone),
      email: input.email?.toLowerCase() ?? null,
      status: dup ? "duplicate" : "new",
      duplicateOfId: dup?.id ?? null,
      statusNote: dup ? `Nombor telefon sama dengan lead #${dup.id} (${DUP_WINDOW_DAYS} hari)` : null,
    })
    .returning();
  return { lead: row, duplicateOf: dup };
}
