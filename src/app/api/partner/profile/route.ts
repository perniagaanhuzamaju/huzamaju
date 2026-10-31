import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { partners } from "@/db/schema";
import { handle, HttpError } from "@/lib/api";
import { partnerApiContext } from "@/lib/data/partner-portal";
import { encrypt } from "@/lib/security/crypto";
import { audit } from "@/lib/audit";

const Body = z.object({
  area: z.string().trim().max(160).optional().default(""),
  occupation: z.string().trim().max(160).optional().default(""),
  payoutBankName: z.string().trim().max(80).optional().default(""),
  payoutAccountName: z.string().trim().max(160).optional().default(""),
  payoutAccount: z.string().trim().max(30).optional().default(""),
});

export const POST = handle(async (req: Request) => {
  const { user, partner } = await partnerApiContext(false);
  const b = Body.parse(await req.json());
  const acct = b.payoutAccount.replace(/[\s-]/g, "");
  if (acct && !/^\d{6,20}$/.test(acct)) throw new HttpError(400, "No. akaun bank tidak sah");
  await db
    .update(partners)
    .set({
      area: b.area || null,
      occupation: b.occupation || null,
      payoutBankName: b.payoutBankName || null,
      payoutAccountName: b.payoutAccountName || null,
      ...(acct ? { payoutAccountEnc: encrypt(acct), payoutAccountLast4: acct.slice(-4) } : {}),
    })
    .where(eq(partners.id, partner.id));
  await audit(user.id, "partner.profile_update", "partner", partner.id, { bankChanged: !!acct });
  return NextResponse.json({ ok: true });
});
