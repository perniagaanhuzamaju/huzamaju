import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { partners, users } from "@/db/schema";
import { handle, HttpError } from "@/lib/api";
import { hashPassword, passwordProblem } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { rateLimit, RateLimitError } from "@/lib/security/rate-limit";
import { clientIp } from "@/lib/security/request";
import { hashIp } from "@/lib/security/crypto";
import { isValidMyPhone } from "@/lib/phone";
import { newPartnerCode } from "@/lib/data/partners";
import { notifyStaff } from "@/lib/notify";
import { audit } from "@/lib/audit";

const Body = z.object({
  type: z.enum(["referral", "agent"]),
  name: z.string().trim().min(2).max(160),
  phone: z.string().trim().min(8).max(30),
  email: z.string().trim().toLowerCase().email().max(200),
  password: z.string().min(10).max(200),
  area: z.string().trim().max(160).optional().default(""),
  occupation: z.string().trim().max(160).optional().default(""),
  experience: z.string().trim().max(2000).optional().default(""),
  agree: z.literal(true),
});

export const POST = handle(async (req: Request) => {
  const rl = await rateLimit(`partner-reg:${hashIp(await clientIp())}`, 5, 3600);
  if (!rl.allowed) throw new RateLimitError();
  const b = Body.parse(await req.json());
  const pw = passwordProblem(b.password);
  if (pw) throw new HttpError(400, pw);
  if (!isValidMyPhone(b.phone)) throw new HttpError(400, "Nombor telefon tidak sah");
  const exists = await db.select({ id: users.id }).from(users).where(eq(users.email, b.email)).limit(1);
  if (exists.length) throw new HttpError(409, "E-mel ini sudah berdaftar. Sila log masuk.");

  const code = await newPartnerCode(b.type);
  const user = await db.transaction(async (tx) => {
    const [u] = await tx
      .insert(users)
      .values({ email: b.email, name: b.name, phone: b.phone, role: b.type === "agent" ? "sales_agent" : "referral_partner", passwordHash: await hashPassword(b.password) })
      .returning({ id: users.id });
    await tx.insert(partners).values({ userId: u.id, code, type: b.type, area: b.area || null, occupation: b.occupation || null, experience: b.experience || null, agreedTermsAt: new Date() });
    return u;
  });
  await audit(user.id, "partner.register", "partner", code, { type: b.type });
  await notifyStaff("Pendaftaran rakan niaga baharu", `${b.name} (${b.type === "agent" ? "Ejen Jualan" : "Rakan Rujukan"}) ${b.phone}. Menunggu kelulusan.`, "/admin/partners");
  await createSession(user.id);
  return NextResponse.json({ ok: true, code });
});
