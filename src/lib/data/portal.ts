import "server-only";
import { and, desc, eq, inArray, or } from "drizzle-orm";
import { db } from "@/db";
import { communications, enquiries, projectDocuments, projects, quotations } from "@/db/schema";
import { requirePage, requirePermission, type SessionUser } from "@/lib/auth/session";
import { customerForUser } from "./crm";

export async function portalContext() {
  const u = await requirePage("portal.customer", "/portal");
  return { user: u, customerId: await customerForUser(u) };
}

export async function portalApiContext(): Promise<{ user: SessionUser; customerId: number }> {
  const u = await requirePermission("portal.customer");
  return { user: u, customerId: await customerForUser(u) };
}

export const customerQuotations = (customerId: number) =>
  db.select().from(quotations).where(eq(quotations.customerId, customerId)).orderBy(desc(quotations.createdAt));

export const customerEnquiries = (customerId: number) =>
  db.select().from(enquiries).where(eq(enquiries.customerId, customerId)).orderBy(desc(enquiries.createdAt));

export const customerProjects = (customerId: number) =>
  db.select().from(projects).where(eq(projects.customerId, customerId)).orderBy(desc(projects.createdAt));

export async function customerDocuments(customerId: number) {
  const [qs, ps] = await Promise.all([
    db.select({ id: quotations.id }).from(quotations).where(eq(quotations.customerId, customerId)),
    db.select({ id: projects.id }).from(projects).where(eq(projects.customerId, customerId)),
  ]);
  const conds = [eq(projectDocuments.customerId, customerId)];
  if (qs.length) conds.push(inArray(projectDocuments.quotationId, qs.map((q) => q.id)));
  if (ps.length) conds.push(inArray(projectDocuments.projectId, ps.map((p) => p.id)));
  return db.select().from(projectDocuments).where(or(...conds)).orderBy(desc(projectDocuments.createdAt));
}

export const customerMessages = (customerId: number) =>
  db
    .select()
    .from(communications)
    .where(and(eq(communications.customerId, customerId), eq(communications.visibleToCustomer, true)))
    .orderBy(desc(communications.createdAt))
    .limit(200);
