import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { enquiries } from "@/db/schema";
import { rateLimit } from "@/lib/security/rate-limit";
import { clientIp } from "@/lib/security/request";
import { hashIp } from "@/lib/security/crypto";
import { isValidMyPhone } from "@/lib/phone";
import { upsertCustomer, referralPartnerId, createLead, customerForUser } from "@/lib/data/crm";
import { notifyStaff } from "@/lib/notify";
import { currentUser } from "@/lib/auth/session";

const Body = z.object({
  name: z.string().trim().min(2).max(160),
  companyName: z.string().trim().max(200).optional().default(""),
  phone: z.string().trim().min(8).max(30),
  email: z.union([z.string().trim().email().max(200), z.literal("")]).optional().default(""),
  serviceSlug: z.string().trim().max(120).optional().default(""),
  location: z.string().trim().max(200).optional().default(""),
  message: z.string().trim().min(10).max(4000),
  kind: z.enum(["general", "corporate", "site_visit"]).default("general"),
  consent: z.literal(true),
  website: z.string().max(0).optional().default(""), // honeypot
  landingPage: z.string().max(200).optional(),
});

export async function POST(req: Request) {
  const ip = await clientIp();
  const rl = await rateLimit(`enquiry:${hashIp(ip) ?? "unknown"}`, 8, 3600);
  if (!rl.allowed) return NextResponse.json({ error: "Terlalu banyak pertanyaan. Sila cuba lagi dalam sejam." }, { status: 429 });

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Sila semak maklumat yang diisi.", issues: parsed.error.issues.map((i) => i.path.join(".")) }, { status: 400 });
  const b = parsed.data;
  if (!isValidMyPhone(b.phone)) return NextResponse.json({ error: "Nombor telefon tidak sah." }, { status: 400 });

  const user = await currentUser();
  const partnerId = await referralPartnerId();
  const customerId = user?.permissions.has("portal.customer")
    ? await customerForUser(user, { companyName: b.companyName || null, partnerId })
    : await upsertCustomer({ fullName: b.name, phone: b.phone, email: b.email || null, companyName: b.companyName || null, partnerId });
  const [enq] = await db
    .insert(enquiries)
    .values({ customerId, name: b.name, companyName: b.companyName || null, phone: b.phone, email: b.email || null, serviceSlug: b.serviceSlug || null, location: b.location || null, message: b.message, kind: b.kind, landingPage: b.landingPage ?? null, source: partnerId ? "referral" : "website" })
    .returning({ id: enquiries.id });
  const { lead } = await createLead({ name: b.name, phone: b.phone, email: b.email || null, companyName: b.companyName || null, location: b.location || null, serviceCategory: b.serviceSlug || null, description: b.message, source: partnerId ? "partner" : "website", partnerId, customerId });

  await notifyStaff(`Pertanyaan baharu #${enq.id}`, `${b.name} (${b.phone})${b.companyName ? `, ${b.companyName}` : ""}\n${b.message.slice(0, 300)}`, `/admin/enquiries?id=${enq.id}`);
  return NextResponse.json({ ok: true, id: enq.id, leadStatus: lead.status });
}
