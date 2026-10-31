import "server-only";
import { sql } from "drizzle-orm";
import { db } from "@/db";

/** Atomically allocates the next running number for a key, e.g. "quotation:2026" → 1, 2, 3 … */
export async function nextCounter(key: string): Promise<number> {
  const r = await db.execute<{ value: number }>(sql`
    INSERT INTO counters (key, value) VALUES (${key}, 1)
    ON CONFLICT (key) DO UPDATE SET value = counters.value + 1
    RETURNING value`);
  return Number(r.rows[0].value);
}

export function klToday(): string {
  return new Date(Date.now() + 8 * 3600e3).toISOString().slice(0, 10);
}

export function addDays(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** HM-SH-2026-0001 for AI/preliminary estimates; formal quotations keep the same number once approved. */
export async function nextQuotationNumber() {
  const year = klToday().slice(0, 4);
  const n = await nextCounter(`quotation:${year}`);
  return `HM-SH-${year}-${String(n).padStart(4, "0")}`;
}
