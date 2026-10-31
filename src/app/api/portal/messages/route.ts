import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { communications } from "@/db/schema";
import { handle } from "@/lib/api";
import { portalApiContext } from "@/lib/data/portal";
import { rateLimit, RateLimitError } from "@/lib/security/rate-limit";
import { notifyStaff } from "@/lib/notify";

const Body = z.object({ body: z.string().trim().min(2).max(3000) });

export const POST = handle(async (req: Request) => {
  const { user, customerId } = await portalApiContext();
  if (!(await rateLimit(`portal-msg:${user.id}`, 20, 3600)).allowed) throw new RateLimitError();
  const { body } = Body.parse(await req.json());
  await db.insert(communications).values({ customerId, direction: "in", channel: "portal", body, visibleToCustomer: true, userId: user.id });
  await notifyStaff(`Mesej portal dari ${user.name}`, body.slice(0, 300), `/admin/customers/${customerId}`);
  return NextResponse.json({ ok: true });
});
