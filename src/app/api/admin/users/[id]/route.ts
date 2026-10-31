import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { sessions, users } from "@/db/schema";
import { handle, HttpError } from "@/lib/api";
import { requirePermission } from "@/lib/auth/session";
import { audit } from "@/lib/audit";
import { ROLES, type RoleKey } from "@/lib/auth/permissions";

const Body = z.object({ role: z.enum(Object.keys(ROLES) as [RoleKey, ...RoleKey[]]), status: z.enum(["active", "disabled"]) });

export const PATCH = handle(async (req: Request, ctx: RouteContext<"/api/admin/users/[id]">) => {
  const u = await requirePermission("users.manage");
  const id = Number((await ctx.params).id);
  const b = Body.parse(await req.json());
  if (id === u.id && (b.status !== "active" || b.role !== u.role)) throw new HttpError(400, "Anda tidak boleh menukar peranan atau menyahaktif akaun sendiri");
  const [target] = await db.select().from(users).where(eq(users.id, id));
  if (!target) throw new HttpError(404, "Tidak dijumpai");
  if ((target.role === "super_admin" || b.role === "super_admin") && u.role !== "super_admin") throw new HttpError(403, "Hanya Super Admin boleh mengubah Super Admin");
  await db.update(users).set({ role: b.role, status: b.status, updatedAt: new Date() }).where(eq(users.id, id));
  if (b.status === "disabled" || b.role !== target.role) await db.delete(sessions).where(eq(sessions.userId, id));
  await audit(u.id, "user.update", "user", String(id), { from: { role: target.role, status: target.status }, to: b });
  return NextResponse.json({ ok: true });
});
