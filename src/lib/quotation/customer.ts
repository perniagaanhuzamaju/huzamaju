import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { customers } from "@/db/schema";

export async function quotationCustomer(customerId: number | null) {
  if (!customerId) return null;
  const [c] = await db.select().from(customers).where(eq(customers.id, customerId)).limit(1);
  return c ? { name: c.fullName, company: c.companyName, email: c.email, phone: c.phone } : null;
}
