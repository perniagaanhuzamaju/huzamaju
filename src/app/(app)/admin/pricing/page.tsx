import Link from "next/link";
import { asc, ilike, or, eq, and } from "drizzle-orm";
import { db } from "@/db";
import { pricingItems } from "@/db/schema";
import { requirePage, can } from "@/lib/auth/session";
import { PageTitle } from "@/components/app/AppShell";
import { JsonForm } from "@/components/app/Forms";
import { ResourceFields } from "@/components/app/ResourceFields";
import { PricingImport } from "@/components/app/PricingImport";
import { PRICING_FIELDS, COMPONENTS } from "@/lib/pricing/admin";
import { loadPricingSettings } from "@/lib/quotation/context";
import { sellingRate } from "@/lib/pricing/engine";
import { klToday } from "@/lib/quotation/number";

export const metadata = { title: "Pangkalan harga" };
const COMP_LABEL: Record<string, string> = { materialRate: "Bahan", labourRate: "Buruh", machineryRate: "Jentera", transportRate: "Pengangkutan", subcontractorRate: "Subkontraktor" };

export default async function AdminPricing({ searchParams }: PageProps<"/admin/pricing">) {
  const u = await requirePage("pricing.view", "/admin/pricing");
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim().slice(0, 80) : "";
  const cat = typeof sp.cat === "string" ? sp.cat : "";
  const [all, settings] = await Promise.all([db.select().from(pricingItems).orderBy(asc(pricingItems.code)), loadPricingSettings()]);
  const cats = [...new Set(all.map((i) => i.category))];
  const rows = await db.select().from(pricingItems).where(and(q ? or(ilike(pricingItems.code, `%${q}%`), ilike(pricingItems.description, `%${q}%`)) : undefined, cat ? eq(pricingItems.category, cat) : undefined)).orderBy(asc(pricingItems.code));
  const edit = can(u, "pricing.edit");
  return (
    <>
      <PageTitle
        title="Pangkalan harga"
        lead={`Sumber tunggal semua harga. ${all.length} item. Kadar jualan = kos ÷ (1 − margin ${settings.targetMargin}), dibundarkan; komersial × ${settings.commercialFactor}. SULIT.`}
        actions={<>{/* eslint-disable-next-line @next/next/no-html-link-for-pages -- file download from an API route */}
<a href="/api/admin/pricing/export?format=csv" className="btn btn-line btn-sm">Eksport CSV</a>{/* eslint-disable-next-line @next/next/no-html-link-for-pages -- file download */}
<a href="/api/admin/pricing/export?format=xlsx" className="btn btn-line btn-sm">Eksport Excel</a></>}
      />
      {edit && (
        <div className="mb-6 grid gap-4 lg:grid-cols-3">
          <details className="card p-5"><summary className="cursor-pointer font-bold">+ Item baharu</summary>
            <JsonForm action="/api/admin/pricing" submit="Tambah" success="Ditambah" reset extra={{ effectiveDate: klToday() }} className="mt-4 grid gap-3"><ResourceFields fields={PRICING_FIELDS} prefix="np" /></JsonForm>
          </details>
          <details className="card p-5"><summary className="cursor-pointer font-bold">Import CSV / Excel</summary>
            <p className="mt-2 mb-3 text-xs text-mute">Guna lajur yang sama seperti fail eksport. Dipadankan mengikut kod; sejarah disimpan.</p><PricingImport />
          </details>
          <details className="card p-5"><summary className="cursor-pointer font-bold">Kemas kini pukal</summary>
            <JsonForm action="/api/admin/pricing/bulk" submit="Guna" success="Dikemas kini" confirm="Kemas kini harga secara pukal? Sejarah setiap item akan disimpan." className="mt-4 grid gap-2">
              <select name="category" className="field"><option value="">Semua seksyen</option>{cats.map((c) => <option key={c}>{c}</option>)}</select>
              <select name="component" className="field"><option value="all">Semua komponen</option>{COMPONENTS.map((c) => <option key={c} value={c}>{COMP_LABEL[c]}</option>)}</select>
              <input name="pct" type="number" step="0.1" required placeholder="% perubahan (cth 5 atau -3)" className="field" />
              <input name="effectiveDate" type="date" required defaultValue={klToday()} className="field" />
              <input name="reason" required placeholder="Sebab (cth: kenaikan harga simen Nov 2026)" className="field" />
            </JsonForm>
          </details>
        </div>
      )}
      <form className="mb-3 flex flex-wrap gap-2">
        <input name="q" defaultValue={q} placeholder="Cari kod atau butiran" className="field max-w-xs" />
        <select name="cat" defaultValue={cat} className="field max-w-xs"><option value="">Semua seksyen</option>{cats.map((c) => <option key={c}>{c}</option>)}</select>
        <button className="btn btn-dark btn-sm">Tapis</button>
      </form>
      <div className="card overflow-x-auto">
        <table className="table text-sm">
          <thead><tr><th>Kod</th><th>Butiran</th><th>Unit</th><th className="text-right">Bahan</th><th className="text-right">Buruh</th><th className="text-right">Lain</th><th className="text-right">Kos</th><th className="text-right">Jual (kediaman)</th><th className="text-right">Jual (komersial)</th><th>Status</th></tr></thead>
          <tbody>
            {rows.map((i) => {
              const other = i.machineryRate + i.transportRate + i.subcontractorRate;
              return (
                <tr key={i.id} className={i.active ? "" : "opacity-50"}>
                  <td><Link href={`/admin/pricing/${i.id}`} className="font-mono font-semibold underline">{i.code}</Link></td>
                  <td>{i.description}<p className="text-xs text-mute">{i.category} · {i.effectiveDate}</p></td>
                  <td>{i.unit}</td>
                  <td className="text-right tabular-nums">{i.materialRate.toFixed(2)}</td>
                  <td className="text-right tabular-nums">{i.labourRate.toFixed(2)}</td>
                  <td className="text-right tabular-nums">{other.toFixed(2)}</td>
                  <td className="text-right font-semibold tabular-nums">{i.totalBaseRate.toFixed(2)}</td>
                  <td className="text-right tabular-nums">{sellingRate(i.totalBaseRate, settings).toFixed(2)}</td>
                  <td className="text-right tabular-nums">{sellingRate(i.totalBaseRate * settings.commercialFactor, settings).toFixed(2)}</td>
                  <td className="text-xs">{i.isVerified ? <span className="text-ok">Disahkan</span> : <span className="text-gold-strong">Anggaran</span>}{!i.active && " · tidak aktif"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
