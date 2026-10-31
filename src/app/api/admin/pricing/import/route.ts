import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { pricingItems } from "@/db/schema";
import { handle, HttpError } from "@/lib/api";
import { requirePermission } from "@/lib/auth/session";
import { audit } from "@/lib/audit";
import { coerce } from "@/lib/admin/resources";
import { PRICING_FIELDS, updatePricingItem, withTotal } from "@/lib/pricing/admin";

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [], cur = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') { cur += '"'; i++; }
      else if (c === '"') q = false;
      else cur += c;
    } else if (c === '"') q = true;
    else if (c === ",") { row.push(cur); cur = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(cur); rows.push(row); row = []; cur = "";
    } else cur += c;
  }
  if (cur || row.length) { row.push(cur); rows.push(row); }
  return rows.filter((r) => r.some((x) => x.trim()));
}

/**
 * Imports pricing from CSV or Excel (same columns as the export). Rows are
 * matched by code: existing items are updated with history, new codes are
 * created. With dryRun=1 nothing is written and a summary is returned.
 */
export const POST = handle(async (req: Request) => {
  const u = await requirePermission("pricing.edit");
  const fd = await req.formData();
  const file = fd.get("file");
  const dryRun = fd.get("dryRun") === "1";
  if (!(file instanceof File) || file.size === 0) throw new HttpError(400, "Tiada fail");
  if (file.size > 5 * 1024 * 1024) throw new HttpError(413, "Fail melebihi 5 MB");
  const buf = Buffer.from(await file.arrayBuffer());
  let table: string[][];
  if (buf.subarray(0, 2).toString("latin1") === "PK") {
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(buf as unknown as ArrayBuffer);
    const ws = wb.worksheets[0];
    table = [];
    ws.eachRow((r) => table.push((r.values as unknown[]).slice(1).map((v) => (v instanceof Date ? v.toISOString().slice(0, 10) : v == null ? "" : typeof v === "object" && "result" in (v as object) ? String((v as { result: unknown }).result) : String(v)))));
  } else {
    table = parseCsv(buf.toString("utf8").replace(/^﻿/, ""));
  }
  if (table.length < 2) throw new HttpError(400, "Fail tiada data");
  const header = table[0].map((h) => h.trim());
  if (!header.includes("code")) throw new HttpError(400, "Lajur 'code' diperlukan");
  const result = { created: 0, updated: 0, unchanged: 0, errors: [] as string[] };
  for (const [i, r] of table.slice(1).entries()) {
    const body: Record<string, unknown> = {};
    header.forEach((h, j) => { if (PRICING_FIELDS.some((f) => f.name === h)) body[h] = h === "workCategories" ? (r[j] ?? "").split("|").join("\n") : (r[j] ?? "").replace(/^'(?=[=+\-@])/, ""); });
    for (const b of ["isVerified", "active"]) if (b in body) body[b] = ["true", "1", "ya", "yes"].includes(String(body[b]).toLowerCase());
    const code = String(body.code ?? "").trim().toUpperCase();
    if (!code) continue;
    const [existing] = await db.select().from(pricingItems).where(eq(pricingItems.code, code));
    const { data, errors } = coerce(PRICING_FIELDS, body, !!existing);
    if (errors.length) { result.errors.push(`Baris ${i + 2} (${code}): ${errors.join(", ")}`); continue; }
    data.code = code;
    if (existing) {
      const changed = Object.entries(data).some(([k, v]) => JSON.stringify(v) !== JSON.stringify((existing as Record<string, unknown>)[k]));
      if (!changed) { result.unchanged++; continue; }
      result.updated++;
      if (!dryRun) await updatePricingItem(existing.id, data, `Import ${file.name}`, u.id);
    } else {
      result.created++;
      if (!dryRun) await db.insert(pricingItems).values({ ...withTotal(data), updatedBy: u.id } as typeof pricingItems.$inferInsert);
    }
  }
  if (!dryRun) await audit(u.id, "pricing.import", "pricing_item", null, { file: file.name, ...result, errors: result.errors.length });
  return NextResponse.json({ ok: true, dryRun, ...result });
});
