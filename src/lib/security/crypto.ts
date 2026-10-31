import "server-only";
import crypto from "node:crypto";
import { env } from "@/lib/env";

export const sha256 = (s: string) => crypto.createHash("sha256").update(s).digest("hex");
export const randomToken = (bytes = 32) => crypto.randomBytes(bytes).toString("base64url");

/** One-way hash of an IP address, salted with the session secret, so logs never store raw IPs. */
export const hashIp = (ip: string | null | undefined) => (ip ? sha256(`${env().SESSION_SECRET}:${ip}`).slice(0, 32) : null);

function key(): Buffer {
  const hex = env().DATA_ENCRYPTION_KEY;
  if (!hex || hex.length !== 64) throw new Error("DATA_ENCRYPTION_KEY must be 64 hex characters (32 bytes)");
  return Buffer.from(hex, "hex");
}

/** AES-256-GCM for sensitive fields such as partner bank account numbers. */
export function encrypt(plain: string): string {
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv("aes-256-gcm", key(), iv);
  const enc = Buffer.concat([c.update(plain, "utf8"), c.final()]);
  return [iv, c.getAuthTag(), enc].map((b) => b.toString("base64url")).join(".");
}

export function decrypt(payload: string): string {
  const [iv, tag, enc] = payload.split(".").map((p) => Buffer.from(p, "base64url"));
  const d = crypto.createDecipheriv("aes-256-gcm", key(), iv);
  d.setAuthTag(tag);
  return Buffer.concat([d.update(enc), d.final()]).toString("utf8");
}
