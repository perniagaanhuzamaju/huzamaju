import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { handle, HttpError } from "@/lib/api";
import { requirePermission } from "@/lib/auth/session";
import { hashPassword, passwordProblem } from "@/lib/auth/password";
import { audit } from "@/lib/audit";
import { STAFF_ROLES } from "@/lib/auth/permissions";

const Body = z.object({ name: z.string().trim().min(2).max(160), email: z.string().trim().toLowerCase().email(), phone: z.string().trim().max(30).optional().default(""), role: z.enum(STAFF_ROLES as [string, ...string[]]), password: z.string().min(10).max(200) });

export const POST = handle(async (req: Request) => {
  const u = await requirePermission("users.manage");
  const b = Body.parse(await req.json());
  const pw = passwordProblem(b.password);
  if (pw) throw new HttpError(400, pw);
  if (b.role === "super_admin" && u.role !== "super_admin") throw new HttpError(403, "Hanya Super Admin boleh mencipta Super Admin");
  const [exists] = await db.select({ id: users.id }).from(users).where(eq(users.email, b.email));
  if (exists) throw new HttpError(409, "E-mel sudah digunakan");
  const [row] = await db.insert(users).values({ name: b.name, email: b.email, phone: b.phone || null, role: b.role as (typeof STAFF_ROLES)[number], passwordHash: await hashPassword(b.password) }).returning({ id: users.id });
  await audit(u.id, "user.create", "user", String(row.id), { role: b.role, email: b.email });
  return NextResponse.json({ ok: true, id: row.id });
});
