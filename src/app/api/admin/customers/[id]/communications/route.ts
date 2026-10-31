import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { communications } from "@/db/schema";
import { handle } from "@/lib/api";
import { requirePermission } from "@/lib/auth/session";

const Body = z.object({
  channel: z.enum(["phone", "whatsapp", "email", "site_visit", "note", "portal"]),
  direction: z.enum(["in", "out", "note"]),
  body: z.string().trim().min(1).max(5000),
  visibleToCustomer: z.boolean().optional().default(false),
});

export const POST = handle(async (req: Request, ctx: RouteContext<"/api/admin/customers/[id]/communications">) => {
  const u = await requirePermission("customers.edit");
  const customerId = Number((await ctx.params).id);
  const b = Body.parse(await req.json());
  await db.insert(communications).values({ ...b, customerId, userId: u.id });
  return NextResponse.json({ ok: true });
});
