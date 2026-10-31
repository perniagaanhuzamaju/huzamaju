import Link from "next/link";
import { and, count, desc, eq, gte, sql } from "drizzle-orm";
import { db } from "@/db";
import { aiUsageLogs, enquiries, leads, notifications, partners, payments, projects, quotations } from "@/db/schema";
import { requirePage, can } from "@/lib/auth/session";
import { PageTitle, Stat, Badge } from "@/components/app/AppShell";
import { rm, dmy } from "@/lib/format";

export const metadata = { title: "Papan pemuka" };

export default async function AdminHome() {
  const u = await requirePage("customers.view", "/admin");
  const monthStart = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1));
  const [[newEnq], [newLeads], [pendingQs], [formalReq], [ongoing], [pendingPartners], [ai], [received], recentQ, notes] = await Promise.all([
    db.select({ n: count() }).from(enquiries).where(eq(enquiries.status, "new")),
    db.select({ n: count() }).from(leads).where(eq(leads.status, "new")),
    db.select({ n: count() }).from(quotations).where(eq(quotations.status, "pending_qs")),
    db.select({ n: count() }).from(quotations).where(and(sql`${quotations.formalRequestedAt} is not null`, sql`${quotations.status} not in ('approved','sent','accepted','rejected','cancelled')`)),
    db.select({ n: count() }).from(projects).where(eq(projects.status, "ongoing")),
    db.select({ n: count() }).from(partners).where(eq(partners.status, "pending")),
    db.select({ n: count(), cost: sql<number>`coalesce(sum(${aiUsageLogs.costUsd}),0)::float` }).from(aiUsageLogs).where(gte(aiUsageLogs.createdAt, monthStart)),
    db.select({ total: sql<number>`coalesce(sum(${payments.amount}),0)::float` }).from(payments).where(and(eq(payments.kind, "client_receipt"), sql`${payments.verifiedAt} is not null`, gte(payments.createdAt, monthStart))),
    db.select().from(quotations).orderBy(desc(quotations.createdAt)).limit(8),
    db.select().from(notifications).where(and(eq(notifications.userId, u.id), eq(notifications.channel, "in_app"))).orderBy(desc(notifications.createdAt)).limit(8),
  ]);
  return (
    <>
      <PageTitle title="Papan pemuka" lead={`Selamat datang, ${u.name}.`} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link href="/admin/enquiries"><Stat label="Pertanyaan baharu" value={newEnq.n} /></Link>
        <Link href="/admin/leads"><Stat label="Lead baharu" value={newLeads.n} /></Link>
        <Link href="/admin/quotations?status=pending_qs"><Stat label="Menunggu semakan QS" value={pendingQs.n} /></Link>
        <Link href="/admin/quotations?formal=1"><Stat label="Minta sebut harga rasmi" value={formalReq.n} /></Link>
        <Link href="/admin/projects"><Stat label="Projek sedang berjalan" value={ongoing.n} /></Link>
        {can(u, "partners.manage") && <Link href="/admin/partners"><Stat label="Rakan niaga menunggu kelulusan" value={pendingPartners.n} /></Link>}
        {can(u, "payments.manage") && <Stat label="Bayaran pelanggan disahkan (bulan ini)" value={rm(received.total)} />}
        {can(u, "ai.manage") && <Link href="/admin/ai"><Stat label="Panggilan AI bulan ini" value={ai.n} hint={`Anggaran kos API: USD ${Number(ai.cost).toFixed(2)}`} /></Link>}
      </div>
      <div className="mt-10 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <h2 className="mb-3 text-lg font-bold">Sebut harga terkini</h2>
          <div className="card overflow-x-auto">
            <table className="table">
              <thead><tr><th>No.</th><th>Tajuk</th><th>Status</th><th className="text-right">Jumlah</th></tr></thead>
              <tbody>
                {recentQ.map((q) => (
                  <tr key={q.id}>
                    <td><Link href={`/admin/quotations/${q.id}`} className="font-semibold underline">{q.number}</Link><p className="text-xs text-mute">{dmy(q.issueDate)}</p></td>
                    <td>{q.title}</td>
                    <td><Badge status={q.status} /></td>
                    <td className="text-right tabular-nums">{rm(q.grandTotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div>
          <h2 className="mb-3 text-lg font-bold">Notifikasi</h2>
          <ul className="grid gap-2">
            {notes.map((n) => (
              <li key={n.id} className="card p-3 text-sm">
                {n.link ? <Link href={n.link} className="font-semibold underline">{n.title}</Link> : <p className="font-semibold">{n.title}</p>}
                <p className="mt-1 line-clamp-2 whitespace-pre-line text-mute">{n.body}</p>
              </li>
            ))}
            {!notes.length && <li className="card p-4 text-sm text-mute">Tiada notifikasi.</li>}
          </ul>
        </div>
      </div>
    </>
  );
}
