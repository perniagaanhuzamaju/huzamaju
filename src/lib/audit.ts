import "server-only";
import { db } from "@/db";
import { auditLogs } from "@/db/schema";
import { hashIp } from "@/lib/security/crypto";
import { clientIp } from "@/lib/security/request";

export async function audit(userId: number | null, action: string, entity: string, entityId?: string | number | null, meta?: Record<string, unknown>) {
  try {
    await db.insert(auditLogs).values({
      userId,
      action,
      entity,
      entityId: entityId == null ? null : String(entityId),
      meta: meta ?? null,
      ipHash: hashIp(await clientIp()),
    });
  } catch (e) {
    console.error("audit log failed", e);
  }
}
