import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { enquiries } from "@/db/schema";
import { handle, HttpError } from "@/lib/api";
import { requirePermission } from "@/lib/auth/session";
import { audit } from "@/lib/audit";

export const PATCH = handle(async (req: Request, ctx: RouteContext<"/api/admin/enquiries/[id]">) => {
  const u = await requirePermission("customers.edit");
  const id = Number((await ctx.params).id);
  const { status } = z.object({ status: z.enum(["new", "in_progress", "closed"]) }).parse(await req.json());
  const r = await db.update(enquiries).set({ status }).where(eq(enquiries.id, id)).returning({ id: enquiries.id });
  if (!r.length) throw new HttpError(404, "Tidak dijumpai");
  await audit(u.id, "enquiry.status", "enquiry", String(id), { status });
  return NextResponse.json({ ok: true });
});
