import ExcelJS from "exceljs";
import { asc } from "drizzle-orm";
import { db } from "@/db";
import { pricingItems } from "@/db/schema";
import { handle } from "@/lib/api";
import { requirePermission } from "@/lib/auth/session";
import { audit } from "@/lib/audit";
import { EXPORT_COLUMNS } from "@/lib/pricing/admin";

const cell = (v: unknown) => (Array.isArray(v) ? v.join("|") : v == null ? "" : String(v));
const csvEsc = (s: string) => (/[",\n\r]/.test(s) || /^[=+\-@]/.test(s) ? `"${(/^[=+\-@]/.test(s) ? `'${s}` : s).replace(/"/g, '""')}"` : s);

/** Internal pricing export (CSV or Excel). Restricted to pricing.view and audited. */
export const GET = handle(async (req: Request) => {
  const u = await requirePermission("pricing.view");
  const format = new URL(req.url).searchParams.get("format") === "xlsx" ? "xlsx" : "csv";
  const rows = await db.select().from(pricingItems).orderBy(asc(pricingItems.code));
  await audit(u.id, "pricing.export", "pricing_item", null, { format, rows: rows.length });
  const stamp = new Date().toISOString().slice(0, 10);
  if (format === "csv") {
    const lines = [EXPORT_COLUMNS.join(","), ...rows.map((r) => EXPORT_COLUMNS.map((c) => csvEsc(cell(r[c]))).join(","))];
    return new Response("﻿" + lines.join("\r\n"), { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="harga-huzamaju-${stamp}.csv"`, "cache-control": "no-store" } });
  }
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Harga");
  ws.columns = EXPORT_COLUMNS.map((c) => ({ header: c, key: c, width: c === "description" ? 48 : 16 }));
  rows.forEach((r) => ws.addRow(Object.fromEntries(EXPORT_COLUMNS.map((c) => [c, Array.isArray(r[c]) ? cell(r[c]) : r[c]]))));
  ws.getRow(1).font = { bold: true };
  const buf = await wb.xlsx.writeBuffer();
  return new Response(new Uint8Array(buf as ArrayBuffer), { headers: { "content-type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "content-disposition": `attachment; filename="harga-huzamaju-${stamp}.xlsx"`, "cache-control": "no-store" } });
});
