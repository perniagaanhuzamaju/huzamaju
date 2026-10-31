import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { env } from "@/lib/env";

/**
 * Private file storage for customer uploads and documents. Files are never
 * served from a public URL; they are streamed through permission-checked routes.
 * Driver "local" writes to STORAGE_LOCAL_DIR (VPS); "s3" works with AWS S3,
 * Cloudflare R2 or any S3-compatible bucket.
 */
let s3: S3Client | null = null;
function s3Client() {
  const e = env();
  if (!e.STORAGE_BUCKET || !e.STORAGE_ACCESS_KEY || !e.STORAGE_SECRET_KEY) throw new Error("S3 storage is not configured");
  s3 ??= new S3Client({
    region: e.STORAGE_REGION,
    endpoint: e.STORAGE_ENDPOINT || undefined,
    credentials: { accessKeyId: e.STORAGE_ACCESS_KEY, secretAccessKey: e.STORAGE_SECRET_KEY },
    forcePathStyle: !!e.STORAGE_ENDPOINT,
  });
  return s3;
}

function localPath(key: string) {
  if (!/^[a-z0-9/_.-]+$/i.test(key) || key.includes("..")) throw new Error("Invalid storage key");
  return path.join(path.resolve(env().STORAGE_LOCAL_DIR), key);
}

export async function putObject(key: string, data: Buffer, contentType: string) {
  if (env().STORAGE_DRIVER === "s3") {
    await s3Client().send(new PutObjectCommand({ Bucket: env().STORAGE_BUCKET, Key: key, Body: data, ContentType: contentType }));
    return;
  }
  const p = localPath(key);
  await fs.mkdir(path.dirname(p), { recursive: true });
  await fs.writeFile(p, data);
}

export async function getObject(key: string): Promise<Buffer> {
  if (env().STORAGE_DRIVER === "s3") {
    const r = await s3Client().send(new GetObjectCommand({ Bucket: env().STORAGE_BUCKET, Key: key }));
    return Buffer.from(await r.Body!.transformToByteArray());
  }
  return fs.readFile(localPath(key));
}

export async function deleteObject(key: string) {
  if (env().STORAGE_DRIVER === "s3") {
    await s3Client().send(new DeleteObjectCommand({ Bucket: env().STORAGE_BUCKET, Key: key }));
    return;
  }
  await fs.rm(localPath(key), { force: true });
}

export const UPLOAD_RULES = {
  maxBytes: 10 * 1024 * 1024,
  maxFiles: 10,
  types: { "image/jpeg": "jpg", "image/png": "png", "application/pdf": "pdf" } as Record<string, string>,
};

/** Detects the real file type from its first bytes; the browser-supplied type is not trusted. */
export function sniffType(buf: Buffer): "image/jpeg" | "image/png" | "application/pdf" | null {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  if (buf.length >= 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  if (buf.length >= 5 && buf.subarray(0, 5).toString("latin1") === "%PDF-") return "application/pdf";
  return null;
}
