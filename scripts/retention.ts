/**
 * Data retention job (PDPA). Run daily, e.g. cron: 0 3 * * * npm run retention
 * - unclaimed quotation-wizard uploads older than 30 days are deleted
 * - expired sessions and stale rate-limit counters are removed
 * - leads closed as lost / rejected / duplicate for 24 months are anonymised
 * - read in-app notifications older than 180 days are removed
 */
import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import { and, inArray, isNotNull, isNull, lt } from "drizzle-orm";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { db } from "../src/db";
import { leads, notifications, projectDocuments, rateLimits, sessions } from "../src/db/schema";

const days = (n: number) => new Date(Date.now() - n * 864e5);

async function removeObject(key: string) {
  if (process.env.STORAGE_DRIVER === "s3") {
    const s3 = new S3Client({
      region: process.env.STORAGE_REGION || "auto",
      endpoint: process.env.STORAGE_ENDPOINT || undefined,
      credentials: { accessKeyId: process.env.STORAGE_ACCESS_KEY!, secretAccessKey: process.env.STORAGE_SECRET_KEY! },
      forcePathStyle: !!process.env.STORAGE_ENDPOINT,
    });
    await s3.send(new DeleteObjectCommand({ Bucket: process.env.STORAGE_BUCKET, Key: key }));
  } else {
    await fs.rm(path.join(path.resolve(process.env.STORAGE_LOCAL_DIR || "./storage"), key), { force: true });
  }
}

async function main() {
  const stale = await db.select().from(projectDocuments).where(and(isNull(projectDocuments.quotationId), isNull(projectDocuments.projectId), isNull(projectDocuments.customerId), isNotNull(projectDocuments.uploadSession), lt(projectDocuments.createdAt, days(30))));
  for (const d of stale) await removeObject(d.storageKey).catch((e) => console.error("delete failed", d.storageKey, e));
  if (stale.length) await db.delete(projectDocuments).where(inArray(projectDocuments.id, stale.map((d) => d.id)));
  const s = await db.delete(sessions).where(lt(sessions.expiresAt, new Date())).returning({ id: sessions.id });
  const r = await db.delete(rateLimits).where(lt(rateLimits.windowStart, days(2))).returning({ k: rateLimits.key });
  const l = await db
    .update(leads)
    .set({ name: "(dipadam)", phone: "-", phoneNormalized: "-", email: null, companyName: null, description: null })
    .where(and(inArray(leads.status, ["lost", "rejected", "duplicate"]), lt(leads.updatedAt, days(730))))
    .returning({ id: leads.id });
  const n = await db.delete(notifications).where(and(isNotNull(notifications.readAt), lt(notifications.createdAt, days(180)))).returning({ id: notifications.id });
  console.log(`retention: uploads ${stale.length}, sessions ${s.length}, rate limits ${r.length}, leads anonymised ${l.length}, notifications ${n.length}`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
