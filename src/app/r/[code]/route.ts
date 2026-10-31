import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { partners, referrals } from "@/db/schema";
import { hashIp } from "@/lib/security/crypto";
import { clientIp } from "@/lib/security/request";
import { rateLimit } from "@/lib/security/rate-limit";
import { isProd } from "@/lib/env";

/** Referral link: https://huzamaju.my/r/HMR-XXXXX → records the visit, sets a 30-day attribution cookie, redirects. */
export async function GET(req: Request, ctx: RouteContext<"/r/[code]">) {
  const { code } = await ctx.params;
  const url = new URL(req.url);
  const to = url.searchParams.get("to");
  const dest = to && to.startsWith("/") && !to.startsWith("//") ? to : "/";
  const res = NextResponse.redirect(new URL(dest, req.url), 302);
  const clean = code.toUpperCase().slice(0, 20);
  const [p] = await db.select({ id: partners.id }).from(partners).where(and(eq(partners.code, clean), eq(partners.status, "approved"))).limit(1);
  if (p) {
    const ipH = hashIp(await clientIp());
    const rl = await rateLimit(`refvisit:${p.id}:${ipH}`, 1, 3600); // count one visit per IP per hour
    if (rl.allowed) await db.insert(referrals).values({ partnerId: p.id, landingPath: dest.slice(0, 300), ipHash: ipH });
    res.cookies.set("hm_ref", clean, { httpOnly: true, sameSite: "lax", secure: isProd(), path: "/", maxAge: 30 * 86400 });
  }
  return res;
}
