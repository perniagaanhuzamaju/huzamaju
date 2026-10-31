import "server-only";
import { cookies } from "next/headers";
import { and, eq, inArray, isNull } from "drizzle-orm";
import { db } from "@/db";
import { projectDocuments } from "@/db/schema";
import { randomToken, sha256 } from "@/lib/security/crypto";
import { getObject } from "@/lib/storage";
import type { AiAttachment } from "@/lib/ai/provider";

export const UPLOAD_COOKIE = "hm_up";

/** Anonymous upload session for the quotation wizard; returns the hashed id stored in the database. */
export async function uploadSession(create: boolean): Promise<string | null> {
  const jar = await cookies();
  let tok = jar.get(UPLOAD_COOKIE)?.value;
  if (!tok && create) {
    tok = randomToken(24);
    jar.set(UPLOAD_COOKIE, tok, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 7 });
  }
  return tok ? sha256(tok) : null;
}

/** Uploads in this browser session that are not yet attached to a quotation. */
export async function sessionUploads(ids: number[]) {
  const sess = await uploadSession(false);
  if (!sess || !ids.length) return [];
  return db
    .select()
    .from(projectDocuments)
    .where(and(inArray(projectDocuments.id, ids), eq(projectDocuments.uploadSession, sess), isNull(projectDocuments.quotationId)));
}

export async function toAttachments(docs: (typeof projectDocuments.$inferSelect)[]): Promise<AiAttachment[]> {
  const out: AiAttachment[] = [];
  for (const d of docs) {
    // The API accepts images up to 5 MB; larger photos stay with the QS only.
    if (d.mimeType !== "application/pdf" && d.sizeBytes > 5 * 1024 * 1024) continue;
    if (d.mimeType === "application/pdf" && d.sizeBytes > 10 * 1024 * 1024) continue;
    try {
      out.push({ mimeType: d.mimeType as AiAttachment["mimeType"], data: await getObject(d.storageKey), name: d.fileName });
    } catch (e) {
      console.error("attachment read failed", d.id, e);
    }
  }
  return out;
}
