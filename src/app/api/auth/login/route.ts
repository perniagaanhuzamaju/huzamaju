import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { handle, HttpError } from "@/lib/api";
import { verifyPassword } from "@/lib/auth/password";
import { createSession, currentUser, homeFor } from "@/lib/auth/session";
import { rateLimit, RateLimitError } from "@/lib/security/rate-limit";
import { clientIp } from "@/lib/security/request";
import { hashIp } from "@/lib/security/crypto";
import { audit } from "@/lib/audit";

const Body = z.object({ email: z.string().trim().toLowerCase().email(), password: z.string().min(1).max(200) });
// A real hash so unknown e-mails take the same time as wrong passwords.
const DUMMY = "$2b$12$C6UzMDM.H6dfI/f/IKcEeO5zv0XWm/0kO6r3m0f2Lk7cX2y4zW3nK";

export const POST = handle(async (req: Request) => {
  const ipKey = hashIp(await clientIp());
  const b = Body.parse(await req.json());
  const [byIp, byEmail] = await Promise.all([rateLimit(`login-ip:${ipKey}`, 20, 900), rateLimit(`login-email:${b.email}`, 8, 900)]);
  if (!byIp.allowed || !byEmail.allowed) throw new RateLimitError("Terlalu banyak cubaan log masuk. Cuba lagi dalam 15 minit.");
  const [u] = await db.select().from(users).where(eq(users.email, b.email)).limit(1);
  const ok = await verifyPassword(b.password, u?.passwordHash ?? DUMMY);
  if (!u || !ok || u.status !== "active") {
    await audit(u?.id ?? null, "auth.login_failed", "user", u?.id, { email: b.email });
    throw new HttpError(401, "E-mel atau kata laluan salah");
  }
  await createSession(u.id);
  await audit(u.id, "auth.login", "user", u.id);
  const me = await currentUser();
  return NextResponse.json({ ok: true, home: me ? homeFor(me) : "/" });
});
