import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { handle, HttpError } from "@/lib/api";
import { hashPassword, passwordProblem } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { rateLimit, RateLimitError } from "@/lib/security/rate-limit";
import { clientIp } from "@/lib/security/request";
import { hashIp } from "@/lib/security/crypto";
import { isValidMyPhone } from "@/lib/phone";
import { customerForUser, referralPartnerId } from "@/lib/data/crm";
import { audit } from "@/lib/audit";

const Body = z.object({
  name: z.string().trim().min(2).max(160),
  companyName: z.string().trim().max(200).optional().default(""),
  phone: z.string().trim().min(8).max(30),
  email: z.string().trim().toLowerCase().email().max(200),
  password: z.string().min(10).max(200),
  agree: z.literal(true),
});

/** Customer self-registration for the customer portal. */
export const POST = handle(async (req: Request) => {
  const rl = await rateLimit(`cust-reg:${hashIp(await clientIp())}`, 5, 3600);
  if (!rl.allowed) throw new RateLimitError();
  const b = Body.parse(await req.json());
  const pw = passwordProblem(b.password);
  if (pw) throw new HttpError(400, pw);
  if (!isValidMyPhone(b.phone)) throw new HttpError(400, "Nombor telefon tidak sah");
  const exists = await db.select({ id: users.id }).from(users).where(eq(users.email, b.email)).limit(1);
  if (exists.length) throw new HttpError(409, "E-mel ini sudah berdaftar. Sila log masuk.");
  const [u] = await db.insert(users).values({ email: b.email, name: b.name, phone: b.phone, role: "customer", passwordHash: await hashPassword(b.password) }).returning({ id: users.id });
  await customerForUser({ id: u.id, name: b.name, phone: b.phone, email: b.email }, { companyName: b.companyName || null, partnerId: await referralPartnerId() });
  await audit(u.id, "customer.register", "user", u.id);
  await createSession(u.id);
  return NextResponse.json({ ok: true });
});
