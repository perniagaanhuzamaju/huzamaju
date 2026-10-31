import "server-only";
import crypto from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { partners } from "@/db/schema";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export async function newPartnerCode(type: "referral" | "agent") {
  for (let i = 0; i < 10; i++) {
    const bytes = crypto.randomBytes(5);
    const code = `HM${type === "agent" ? "A" : "R"}-${Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("")}`;
    const exists = await db.select({ id: partners.id }).from(partners).where(eq(partners.code, code)).limit(1);
    if (!exists.length) return code;
  }
  throw new Error("Could not allocate partner code");
}

export async function partnerForUser(userId: number) {
  const [p] = await db.select().from(partners).where(eq(partners.userId, userId)).limit(1);
  return p ?? null;
}
