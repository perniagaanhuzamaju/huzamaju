"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Row = { pricing_code: string; description: string; unit: string; quantity: string; quantity_basis: string };
type Item = { code: string; description: string; unit: string };

/** Admin/QS editor for line items. Saving re-prices every line from the database. */
export function QuotationItemsEditor({ id, initial, catalog, units }: { id: number; initial: Row[]; catalog: Item[]; units: readonly string[] }) {
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>(initial);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const byCode = new Map(catalog.map((c) => [c.code, c]));
  const set = (i: number, k: keyof Row, v: string) =>
    setRows((rs) =>
      rs.map((r, j) => {
        if (j !== i) return r;
        const next = { ...r, [k]: v };
        if (k === "pricing_code" && byCode.has(v)) {
          const c = byCode.get(v)!;
          next.unit = c.unit;
          if (!r.description) next.description = c.description;
        }
        return next;
      }),
    );
  async function save() {
    setBusy(true);
    setMsg(null);
    const r = await fetch(`/api/admin/quotations/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "items", items: rows.map((r) => ({ ...r, pricing_code: r.pricing_code || null, quantity: r.quantity === "" ? null : Number(r.quantity) })) }),
    });
    const j = await r.json().catch(() => ({}));
    setBusy(false);
    setMsg(r.ok ? "Disimpan & dikira semula" : j.error || "Ralat");
    if (r.ok) router.refresh();
  }
  return (
    <div>
      <datalist id="pricing-codes">{catalog.map((c) => <option key={c.code} value={c.code}>{c.description} ({c.unit})</option>)}</datalist>
      <div className="overflow-x-auto">
        <table className="table">
          <thead><tr><th>Kod harga</th><th>Butiran</th><th>Unit</th><th>Kuantiti</th><th>Asas kuantiti</th><th /></tr></thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                <td><input list="pricing-codes" value={r.pricing_code} onChange={(e) => set(i, "pricing_code", e.target.value.toUpperCase())} className="field w-24" /></td>
                <td><input value={r.description} onChange={(e) => set(i, "description", e.target.value)} className="field min-w-64" /></td>
                <td><select value={r.unit} onChange={(e) => set(i, "unit", e.target.value)} className="field w-24">{units.map((u) => <option key={u}>{u}</option>)}</select></td>
                <td><input type="number" step="any" value={r.quantity} onChange={(e) => set(i, "quantity", e.target.value)} className="field w-28" /></td>
                <td><input value={r.quantity_basis} onChange={(e) => set(i, "quantity_basis", e.target.value)} className="field min-w-48" /></td>
                <td><button type="button" className="text-bad" onClick={() => setRows(rows.filter((_, j) => j !== i))} aria-label="Buang">✕</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button type="button" className="btn btn-line btn-sm" onClick={() => setRows([...rows, { pricing_code: "", description: "", unit: "unit", quantity: "", quantity_basis: "QS" }])}>+ Tambah item</button>
        <button type="button" className="btn btn-dark btn-sm" disabled={busy} onClick={save}>{busy ? "…" : "Simpan & kira semula"}</button>
        {msg && <span className="text-sm font-semibold">{msg}</span>}
      </div>
    </div>
  );
}
