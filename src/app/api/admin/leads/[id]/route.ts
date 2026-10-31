import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { leads, partners } from "@/db/schema";
import { handle, HttpError } from "@/lib/api";
import { requirePermission } from "@/lib/auth/session";
import { audit } from "@/lib/audit";
import { notifyUser } from "@/lib/notify";

const Body = z.object({
  status: z.enum(["new", "verified", "follow_up", "quoted", "won", "lost", "duplicate", "rejected"]),
  assignedTo: z.union([z.coerce.number().int().positive(), z.literal("")]).optional(),
  statusNote: z.string().trim().max(500).optional().default(""),
});

export const PATCH = handle(async (req: Request, ctx: RouteContext<"/api/admin/leads/[id]">) => {
  const u = await requirePermission("leads.manage");
  const id = Number((await ctx.params).id);
  const b = Body.parse(await req.json());
  const [before] = await db.select().from(leads).where(eq(leads.id, id));
  if (!before) throw new HttpError(404, "Tidak dijumpai");
  await db.update(leads).set({ status: b.status, assignedTo: b.assignedTo ? Number(b.assignedTo) : null, statusNote: b.statusNote || null, updatedAt: new Date() }).where(eq(leads.id, id));
  await audit(u.id, "lead.update", "lead", String(id), { from: before.status, to: b.status });
  if (before.partnerId && before.status !== b.status) {
    const [p] = await db.select().from(partners).where(eq(partners.id, before.partnerId));
    if (p) await notifyUser(p.userId, `Status lead ${before.name}: ${b.status}`, b.statusNote || "Status lead anda telah dikemas kini.", "/partner/leads");
  }
  return NextResponse.json({ ok: true });
});
