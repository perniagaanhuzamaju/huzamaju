import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { projectDocuments, projects, quotations } from "@/db/schema";
import { HttpError } from "@/lib/api";
import { putObject, sniffType, UPLOAD_RULES } from "@/lib/storage";
import { stripJpegMetadata } from "@/lib/ai/privacy";
import { randomToken } from "@/lib/security/crypto";
import { can, type SessionUser } from "@/lib/auth/session";
import { customerForUser } from "@/lib/data/crm";

/** Validates (by content, not extension) and stores an uploaded file privately. */
export async function storeUpload(
  file: FormDataEntryValue | null,
  link: { customerId?: number | null; projectId?: number | null; quotationId?: number | null; kind?: string; uploadedBy?: number | null },
) {
  if (!(file instanceof File)) throw new HttpError(400, "Tiada fail dihantar");
  if (file.size === 0) throw new HttpError(400, "Fail kosong");
  if (file.size > UPLOAD_RULES.maxBytes) throw new HttpError(413, "Saiz fail melebihi 10 MB");
  const raw = Buffer.from(await file.arrayBuffer());
  const type = sniffType(raw);
  if (!type) throw new HttpError(415, "Hanya fail PDF, JPG dan PNG dibenarkan");
  const data = type === "image/jpeg" ? stripJpegMetadata(raw) : raw;
  const ext = UPLOAD_RULES.types[type];
  const key = `documents/${new Date().toISOString().slice(0, 7)}/${randomToken(16)}.${ext}`;
  await putObject(key, data, type);
  const [doc] = await db
    .insert(projectDocuments)
    .values({
      storageKey: key,
      fileName: file.name.replace(/[^\w.\- ()]+/g, "_").slice(0, 200) || `fail.${ext}`,
      mimeType: type,
      sizeBytes: data.length,
      kind: link.kind ?? (type === "application/pdf" ? "other" : "photo"),
      customerId: link.customerId ?? null,
      projectId: link.projectId ?? null,
      quotationId: link.quotationId ?? null,
      uploadedBy: link.uploadedBy ?? null,
    })
    .returning();
  return doc;
}

/** Staff with customer access, or the customer who owns the document's record. */
export async function canAccessDocument(u: SessionUser, doc: typeof projectDocuments.$inferSelect) {
  if (can(u, "customers.view") || can(u, "projects.view") || can(u, "quotations.view")) return true;
  if (!can(u, "portal.customer")) return false;
  const cid = await customerForUser(u);
  if (doc.customerId === cid) return true;
  if (doc.quotationId) {
    const [q] = await db.select({ c: quotations.customerId }).from(quotations).where(eq(quotations.id, doc.quotationId));
    if (q?.c === cid) return true;
  }
  if (doc.projectId) {
    const [p] = await db.select({ c: projects.customerId }).from(projects).where(eq(projects.id, doc.projectId));
    if (p?.c === cid) return true;
  }
  return false;
}
