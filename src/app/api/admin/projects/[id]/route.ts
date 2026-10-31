import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { projects } from "@/db/schema";
import { handle, HttpError } from "@/lib/api";
import { requirePermission } from "@/lib/auth/session";
import { audit } from "@/lib/audit";

const opt = z.union([z.coerce.number().int().positive(), z.literal("")]).optional();
const Body = z.object({ customerId: opt, leadId: opt });

/** Links a project to a customer / lead (the other fields are edited through the projects resource). */
export const PATCH = handle(async (req: Request, ctx: RouteContext<"/api/admin/projects/[id]">) => {
  const u = await requirePermission("projects.edit");
  const id = Number((await ctx.params).id);
  const b = Body.parse(await req.json());
  const r = await db.update(projects).set({ customerId: b.customerId ? Number(b.customerId) : null, leadId: b.leadId ? Number(b.leadId) : null, updatedAt: new Date() }).where(eq(projects.id, id)).returning({ id: projects.id });
  if (!r.length) throw new HttpError(404, "Tidak dijumpai");
  await audit(u.id, "project.link", "project", String(id), b);
  return NextResponse.json({ ok: true });
});
