import { and, gte, sql, eq, isNotNull } from "drizzle-orm";
import { db } from "@/db";
import { leads, payments, quotations, referrals, partners, users } from "@/db/schema";
import { requirePage } from "@/lib/auth/session";
import { PageTitle, Stat } from "@/components/app/AppShell";
import { QUOTE_CATEGORIES } from "@/lib/catalog";
import { rm } from "@/lib/format";

export const metadata = { title: "Analitik" };
const daysAgo = (n: number) => new Date(Date.now() - n * 864e5);

function Bars({ rows, label }: { rows: { k: string | null; n: number }[]; label?: (k: string) => string }) {
    const max = Math.max(1, ...rows.map((r) => r.n));
    return <ul className="grid gap-2">{rows.sort((a, b) => b.n - a.n).map((r) => <li key={r.k ?? "-"} className="text-sm"><div className="flex justify-between"><span>{label ? label(r.k ?? "-") : r.k}</span><b>{r.n}</b></div><div className="mt-1 h-2 rounded-full bg-line"><div className="h-2 rounded-full bg-gold" style={{ width: `${(r.n / max) * 100}%` }} /></div></li>)}</ul>;
}

export default async function Analytics() {
  await requirePage("analytics.view", "/admin/analytics");
  const since = daysAgo(90);
  const [bySource, byStatus, byCat, [conv], [rev], partnerPerf] = await Promise.all([
    db.select({ k: leads.source, n: sql<number>`count(*)::int` }).from(leads).where(gte(leads.createdAt, since)).groupBy(leads.source),
    db.select({ k: leads.status, n: sql<number>`count(*)::int` }).from(leads).where(gte(leads.createdAt, since)).groupBy(leads.status),
    db.select({ k: quotations.category, n: sql<number>`count(*)::int`, v: sql<number>`coalesce(sum(${quotations.grandTotal}),0)::float` }).from(quotations).where(gte(quotations.createdAt, since)).groupBy(quotations.category),
    db.select({ total: sql<number>`count(*)::int`, withContact: sql<number>`count(${quotations.customerId})::int`, accepted: sql<number>`count(*) filter (where ${quotations.status} = 'accepted')::int` }).from(quotations).where(gte(quotations.createdAt, since)),
    db.select({ v: sql<number>`coalesce(sum(${payments.amount}),0)::float` }).from(payments).where(and(eq(payments.kind, "client_receipt"), isNotNull(payments.verifiedAt), gte(payments.createdAt, since))),
    db.select({ code: partners.code, name: users.name, visits: sql<number>`(select count(*) from ${referrals} r where r.partner_id = ${partners.id})::int`, leads: sql<number>`(select count(*) from ${leads} l where l.partner_id = ${partners.id})::int`, won: sql<number>`(select count(*) from ${leads} l where l.partner_id = ${partners.id} and l.status = 'won')::int` }).from(partners).innerJoin(users, eq(users.id, partners.userId)),
  ]);
  const cat = Object.fromEntries(QUOTE_CATEGORIES.map((c) => [c.key, c.name.ms]));
  return (
    <>
      <PageTitle title="Analitik" lead="90 hari terakhir. Untuk trafik laman web, sambungkan Google Analytics (NEXT_PUBLIC_GA_ID)." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Anggaran dibuat" value={conv.total} />
        <Stat label="Anggaran dengan maklumat pelanggan" value={conv.withContact} hint={conv.total ? `${Math.round((conv.withContact / conv.total) * 100)}% penukaran` : undefined} />
        <Stat label="Sebut harga diterima" value={conv.accepted} />
        <Stat label="Bayaran pelanggan disahkan" value={rm(rev.v)} />
      </div>
      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <section className="card p-5"><h2 className="mb-4 font-bold">Lead mengikut sumber</h2><Bars rows={bySource} /></section>
        <section className="card p-5"><h2 className="mb-4 font-bold">Lead mengikut status</h2><Bars rows={byStatus} /></section>
        <section className="card p-5"><h2 className="mb-4 font-bold">Anggaran mengikut kategori</h2><Bars rows={byCat} label={(k) => cat[k] ?? k} /></section>
      </div>
      <h2 className="mt-8 mb-3 font-bold">Prestasi rakan niaga</h2>
      <div className="card overflow-x-auto"><table className="table text-sm"><thead><tr><th>ID</th><th>Nama</th><th>Lawatan</th><th>Lead</th><th>Berjaya</th></tr></thead><tbody>{partnerPerf.map((p) => <tr key={p.code}><td>{p.code}</td><td>{p.name}</td><td>{p.visits}</td><td>{p.leads}</td><td>{p.won}</td></tr>)}</tbody></table></div>
    </>
  );
}
