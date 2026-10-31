"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Result = { created: number; updated: number; unchanged: number; errors: string[]; dryRun: boolean };

export function PricingImport() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [res, setRes] = useState<Result | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  async function send(dryRun: boolean) {
    if (!file) return;
    setBusy(true);
    setErr(null);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("dryRun", dryRun ? "1" : "0");
    const r = await fetch("/api/admin/pricing/import", { method: "POST", body: fd });
    const j = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok) return setErr(j.error || "Ralat");
    setRes(j);
    if (!dryRun) router.refresh();
  }
  return (
    <div className="grid gap-3">
      <input type="file" accept=".csv,.xlsx" onChange={(e) => { setFile(e.target.files?.[0] ?? null); setRes(null); }} className="text-sm" />
      <div className="flex gap-2">
        <button type="button" className="btn btn-line btn-sm" disabled={!file || busy} onClick={() => send(true)}>Semak dahulu</button>
        <button type="button" className="btn btn-dark btn-sm" disabled={!file || busy || !res?.dryRun} onClick={() => send(false)}>Import</button>
      </div>
      {err && <p className="text-sm font-semibold text-bad">{err}</p>}
      {res && (
        <div className="rounded-lg bg-sand p-3 text-sm">
          <p className="font-semibold">{res.dryRun ? "Semakan (belum disimpan)" : "Import selesai"}: {res.created} baharu, {res.updated} dikemas kini, {res.unchanged} tiada perubahan, {res.errors.length} ralat</p>
          {res.errors.slice(0, 20).map((e) => <p key={e} className="text-bad">{e}</p>)}
        </div>
      )}
    </div>
  );
}
