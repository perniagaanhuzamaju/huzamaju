import Link from "next/link";
import { and, desc, eq, ilike, isNotNull, or } from "drizzle-orm";
import { db } from "@/db";
import { customers, quotations } from "@/db/schema";
import { requirePage, can } from "@/lib/auth/session";
import { QUOTE_CATEGORIES } from "@/lib/catalog";
import { PageTitle, Badge } from "@/components/app/AppShell";
import { JsonForm } from "@/components/app/Forms";
import { rm, dmy } from "@/lib/format";

export const metadata = { title: "Sebut harga" };
const ST = ["preliminary", "pending_qs", "approved", "sent", "accepted", "rejected", "cancelled"];

export default async function AdminQuotations({ searchParams }: PageProps<"/admin/quotations">) {
  const u = await requirePage("quotations.view", "/admin/quotations");
  const sp = await searchParams;
  const status = typeof sp.status === "string" && ST.includes(sp.status) ? sp.status : null;
  const q = typeof sp.q === "string" ? sp.q.trim().slice(0, 80) : "";
  const conds = [
    status ? eq(quotations.status, status) : undefined,
    sp.formal === "1" ? isNotNull(quotations.formalRequestedAt) : undefined,
    q ? or(ilike(quotations.number, `%${q}%`), ilike(quotations.title, `%${q}%`), ilike(customers.fullName, `%${q}%`)) : undefined,
  ].filter(Boolean);
  const rows = await db.select({ q: quotations, c: customers.fullName }).from(quotations).leftJoin(customers, eq(customers.id, quotations.customerId)).where(and(...conds)).orderBy(desc(quotations.createdAt)).limit(300);
  return (
    <>
      <PageTitle title="Sebut harga" lead="Anggaran AI dan sebut harga manual. Sebut harga rasmi memerlukan kelulusan pegawai yang diberi kuasa." />
      {can(u, "quotations.edit") && (
        <details className="card mb-6 p-5">
          <summary className="cursor-pointer font-bold">+ Sebut harga manual</summary>
          <JsonForm action="/api/admin/quotations" submit="Cipta" redirectTo="/admin/quotations/:id" className="mt-4 grid gap-3 md:grid-cols-2">
            <input name="title" required placeholder="Tajuk projek" className="field md:col-span-2" />
            <select name="categoryKey" className="field">{QUOTE_CATEGORIES.map((c) => <option key={c.key} value={c.key}>{c.name.ms}</option>)}</select>
            <select name="segment" className="field"><option value="residential">Kediaman</option><option value="commercial">Komersial</option></select>
            <input name="location" placeholder="Lokasi projek" className="field" />
            <input name="customerId" placeholder="ID pelanggan (pilihan)" className="field" />
          </JsonForm>
        </details>
      )}
      <form className="mb-3 flex flex-wrap gap-2">
        <input name="q" defaultValue={q} placeholder="No., tajuk atau pelanggan" className="field max-w-xs" />
        <select name="status" defaultValue={status ?? ""} className="field max-w-48"><option value="">Semua status</option>{ST.map((s) => <option key={s} value={s}>{s}</option>)}</select>
        <button className="btn btn-dark btn-sm">Tapis</button>
      </form>
      <div className="card overflow-x-auto">
        <table className="table">
          <thead><tr><th>No.</th><th>Tajuk</th><th>Pelanggan</th><th>Sumber</th><th>Status</th><th>Permintaan</th><th className="text-right">Jumlah</th></tr></thead>
          <tbody>
            {rows.map(({ q, c }) => (
              <tr key={q.id}>
                <td><Link href={`/admin/quotations/${q.id}`} className="font-semibold underline">{q.number}</Link><p className="text-xs text-mute">{dmy(q.issueDate)}</p></td>
                <td>{q.title}{q.pendingReviewCount > 0 && <p className="text-xs text-gold-strong">{q.pendingReviewCount} item semakan QS</p>}</td>
                <td>{c ?? <span className="text-mute">Tanpa maklumat</span>}</td>
                <td>{q.source}</td>
                <td><Badge status={q.status} /></td>
                <td className="text-xs">{q.formalRequestedAt && <p>Rasmi</p>}{q.siteVisitRequestedAt && <p>Lawatan tapak</p>}</td>
                <td className="text-right tabular-nums">{rm(q.grandTotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
