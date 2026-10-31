import "server-only";
import { eq } from "drizzle-orm";
import type { PgTable } from "drizzle-orm/pg-core";
import { db } from "@/db";
import { HttpError } from "@/lib/api";
import { requirePermission } from "@/lib/auth/session";
import { audit } from "@/lib/audit";
import { coerce, RESOURCES } from "./resources";

function extraChecks(key: string, data: Record<string, unknown>) {
  if (key === "commission-rules" && data.milestones != null) {
    const ms = data.milestones as { paymentPct: number; commissionPct: number }[];
    if (!Array.isArray(ms) || !ms.length || ms.some((m) => typeof m?.paymentPct !== "number" || typeof m?.commissionPct !== "number"))
      throw new HttpError(400, "Peringkat bayaran mesti senarai {paymentPct, commissionPct}");
    const sum = ms.reduce((a, m) => a + m.commissionPct, 0);
    if (Math.abs(sum - 100) > 0.001) throw new HttpError(400, `Jumlah commissionPct mesti 100 (sekarang ${sum})`);
  }
  if (key === "commission-rules" && data.kind === "percent" && typeof data.amount === "number" && (data.amount < 0 || data.amount > 100))
    throw new HttpError(400, "Peratus komisen mesti antara 0 dan 100");
  if (key === "blog" && data.status === "published") data.publishedAt = new Date();
  if (key === "testimonials" && data.rating != null && (Number(data.rating) < 1 || Number(data.rating) > 5)) throw new HttpError(400, "Penilaian 1 hingga 5");
}

export async function resourceAction(key: string, op: "create" | "update" | "delete", id: string | null, body: Record<string, unknown>) {
  const r = RESOURCES[key];
  if (!r) throw new HttpError(404, "Sumber tidak dijumpai");
  const user = await requirePermission(r.permission);
  const table = r.table as PgTable & Record<string, never>;
  const idCol = (table as unknown as Record<string, unknown>)[r.idField ?? "id"] as Parameters<typeof eq>[0];
  const idVal = r.idField ? id : Number(id);
  if (op !== "create" && (id == null || (!r.idField && !Number.isInteger(idVal)))) throw new HttpError(400, "ID tidak sah");

  if (op === "delete") {
    const res = await db.delete(table).where(eq(idCol, idVal)).returning();
    if (!res.length) throw new HttpError(404, "Tidak dijumpai");
    await audit(user.id, `${key}.delete`, key, String(id), { row: res[0] as Record<string, unknown> });
    return { ok: true };
  }
  const { data, errors } = coerce(r.fields, body, op === "update");
  if (errors.length) throw new HttpError(400, errors.join("; "));
  extraChecks(key, data);
  try {
    if (op === "create") {
      const [row] = (await db.insert(table).values(data as never).returning()) as Record<string, unknown>[];
      await audit(user.id, `${key}.create`, key, String(row[r.idField ?? "id"]), data);
      return { ok: true, id: row[r.idField ?? "id"] };
    }
    const [before] = (await db.select().from(table as never).where(eq(idCol, idVal))) as Record<string, unknown>[];
    if (!before) throw new HttpError(404, "Tidak dijumpai");
    await db.update(table).set(data as never).where(eq(idCol, idVal));
    await audit(user.id, `${key}.update`, key, String(id), { before, after: data });
    return { ok: true, id };
  } catch (e) {
    if ((e as { cause?: { code?: string } })?.cause?.code === "23505" || (e as { code?: string }).code === "23505") throw new HttpError(409, "Rekod dengan kod / slug yang sama sudah wujud");
    throw e;
  }
}
