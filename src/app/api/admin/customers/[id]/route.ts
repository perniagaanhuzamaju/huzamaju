import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { customers } from "@/db/schema";
import { handle, HttpError } from "@/lib/api";
import { requirePermission } from "@/lib/auth/session";
import { normalizePhone } from "@/lib/phone";
import { audit } from "@/lib/audit";

const o = (n: number) => z.string().trim().max(n).optional().default("");
const Body = z.object({ fullName: z.string().trim().min(2).max(160), companyName: o(200), phone: o(30), email: o(200), address: o(1000), segment: o(40), notes: o(5000) });

export const PATCH = handle(async (req: Request, ctx: RouteContext<"/api/admin/customers/[id]">) => {
  const u = await requirePermission("customers.edit");
  const id = Number((await ctx.params).id);
  const b = Body.parse(await req.json());
  const r = await db
    .update(customers)
    .set({ ...Object.fromEntries(Object.entries(b).map(([k, v]) => [k, v || null])), fullName: b.fullName, phoneNormalized: b.phone ? normalizePhone(b.phone) : null, email: b.email ? b.email.toLowerCase() : null, updatedAt: new Date() })
    .where(eq(customers.id, id))
    .returning({ id: customers.id });
  if (!r.length) throw new HttpError(404, "Tidak dijumpai");
  await audit(u.id, "customer.update", "customer", String(id));
  return NextResponse.json({ ok: true });
});
