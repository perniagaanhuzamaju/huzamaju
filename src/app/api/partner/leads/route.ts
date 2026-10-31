import { NextResponse } from "next/server";
import { z } from "zod";
import { handle, HttpError } from "@/lib/api";
import { partnerApiContext } from "@/lib/data/partner-portal";
import { createLead, upsertCustomer } from "@/lib/data/crm";
import { isValidMyPhone } from "@/lib/phone";
import { quoteCategory } from "@/lib/catalog";
import { rateLimit, RateLimitError } from "@/lib/security/rate-limit";
import { notifyStaff } from "@/lib/notify";
import { audit } from "@/lib/audit";

const Body = z.object({
  name: z.string().trim().min(2).max(160),
  phone: z.string().trim().min(8).max(30),
  email: z.union([z.string().trim().email().max(200), z.literal("")]).optional().default(""),
  companyName: z.string().trim().max(200).optional().default(""),
  location: z.string().trim().min(2).max(200),
  serviceCategory: z.string().trim().max(40),
  description: z.string().trim().min(10).max(3000),
  clientConsent: z.literal(true),
});

/** Partner lead submission (workflow step 1). Duplicates are flagged automatically and never earn commission. */
export const POST = handle(async (req: Request) => {
  const { user, partner } = await partnerApiContext();
  if (!(await rateLimit(`partner-lead:${partner.id}`, 30, 86400)).allowed) throw new RateLimitError("Had 30 lead sehari dicapai");
  const b = Body.parse(await req.json());
  if (!isValidMyPhone(b.phone)) throw new HttpError(400, "Nombor telefon tidak sah");
  if (!quoteCategory(b.serviceCategory)) throw new HttpError(400, "Jenis kerja tidak sah");
  if (user.phone && b.phone.replace(/\D/g, "").endsWith(user.phone.replace(/\D/g, "").slice(-9))) throw new HttpError(400, "Anda tidak boleh merujuk diri sendiri");

  const customerId = await upsertCustomer({ fullName: b.name, phone: b.phone, email: b.email || null, companyName: b.companyName || null, partnerId: partner.id, source: "partner" });
  const { lead, duplicateOf } = await createLead({ ...b, email: b.email || null, companyName: b.companyName || null, source: "partner", partnerId: partner.id, customerId });
  await audit(user.id, "partner.lead_submit", "lead", lead.id, { duplicate: !!duplicateOf });
  await notifyStaff(`Lead rakan niaga ${partner.code}${duplicateOf ? " (duplikasi)" : ""}`, `${b.name} (${b.phone}) · ${b.location}\n${b.description.slice(0, 300)}`, `/admin/leads?id=${lead.id}`);
  if (duplicateOf) throw new HttpError(409, "Pelanggan ini sudah didaftarkan dalam 90 hari lepas. Lead direkodkan sebagai duplikasi.");
  return NextResponse.json({ ok: true, id: lead.id });
});
