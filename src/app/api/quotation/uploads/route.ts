import { NextResponse } from "next/server";
import { and, count, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { projectDocuments } from "@/db/schema";
import { handle, HttpError } from "@/lib/api";
import { rateLimit, RateLimitError } from "@/lib/security/rate-limit";
import { clientIp } from "@/lib/security/request";
import { hashIp, randomToken } from "@/lib/security/crypto";
import { putObject, sniffType, UPLOAD_RULES } from "@/lib/storage";
import { stripJpegMetadata } from "@/lib/ai/privacy";
import { uploadSession } from "@/lib/quotation/uploads";

export const POST = handle(async (req: Request) => {
  const ip = await clientIp();
  if (!(await rateLimit(`upload:${hashIp(ip) ?? "unknown"}`, 40, 3600)).allowed) throw new RateLimitError();

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) throw new HttpError(400, "Tiada fail dihantar");
  if (file.size === 0) throw new HttpError(400, "Fail kosong");
  if (file.size > UPLOAD_RULES.maxBytes) throw new HttpError(413, "Saiz fail melebihi 10 MB");

  const raw = Buffer.from(await file.arrayBuffer());
  const type = sniffType(raw);
  if (!type) throw new HttpError(415, "Hanya fail PDF, JPG dan PNG dibenarkan");
  const data = type === "image/jpeg" ? stripJpegMetadata(raw) : raw;

  const sess = (await uploadSession(true))!;
  const [{ n }] = await db
    .select({ n: count() })
    .from(projectDocuments)
    .where(and(eq(projectDocuments.uploadSession, sess), isNull(projectDocuments.quotationId)));
  if (n >= UPLOAD_RULES.maxFiles) throw new HttpError(400, `Maksimum ${UPLOAD_RULES.maxFiles} fail`);

  const ext = UPLOAD_RULES.types[type];
  const key = `uploads/${new Date().toISOString().slice(0, 7)}/${randomToken(16)}.${ext}`;
  await putObject(key, data, type);
  const safeName = file.name.replace(/[^\w.\- ()]+/g, "_").slice(0, 200) || `fail.${ext}`;
  const [doc] = await db
    .insert(projectDocuments)
    .values({ storageKey: key, fileName: safeName, mimeType: type, sizeBytes: data.length, kind: type === "application/pdf" ? "drawing" : "photo", uploadSession: sess })
    .returning({ id: projectDocuments.id });
  return NextResponse.json({ id: doc.id, name: safeName, type, size: data.length });
});
