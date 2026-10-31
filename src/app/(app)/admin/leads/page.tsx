import Link from "next/link";
import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { leads, partners, users } from "@/db/schema";
import { requirePage } from "@/lib/auth/session";
import { STAFF_ROLES } from "@/lib/auth/permissions";
import { PageTitle, Badge } from "@/components/app/AppShell";
import { JsonForm } from "@/components/app/Forms";
import { rm } from "@/lib/format";

export const metadata = { title: "Lead" };
const STATUSES = ["new", "verified", "follow_up", "quoted", "won", "lost", "duplicate", "rejected"] as const;
const LABEL: Record<string, string> = { new: "Baharu", verified: "Disahkan", follow_up: "Susulan", quoted: "Disebut harga", won: "Berjaya", lost: "Tidak berjaya", duplicate: "Duplikasi", rejected: "Ditolak" };

export default async function AdminLeads({ searchParams }: PageProps<"/admin/leads">) {
  await requirePage("leads.manage", "/admin/leads");
  const sp = await searchParams;
  const status = typeof sp.status === "string" && (STATUSES as readonly string[]).includes(sp.status) ? sp.status : null;
  const source = sp.source === "partner" ? "partner" : null;
  const conds = [status ? eq(leads.status, status) : undefined, source ? eq(leads.source, source) : undefined].filter(Boolean);
  const rows = await db
    .select({ l: leads, pcode: partners.code })
    .from(leads)
    .leftJoin(partners, eq(partners.id, leads.partnerId))
    .where(conds.length ? and(...conds) : undefined)
    .orderBy(desc(leads.createdAt))
    .limit(300);
  const staff = await db.select({ id: users.id, name: users.name }).from(users).where(inArray(users.role, STAFF_ROLES));
  return (
    <>
      <PageTitle title="Lead" lead="Sahkan lead, tanda duplikasi dan jejak hingga projek diperoleh. Lead rakan niaga hanya layak komisen selepas projek diperoleh dan bayaran disahkan." />
      <div className="mb-4 flex flex-wrap gap-2 text-sm">
        <Link href="?" className={`chip ${!status && !source ? "border-ink bg-ink text-white" : ""}`}>Semua</Link>
        <Link href="?source=partner" className={`chip ${source ? "border-ink bg-ink text-white" : ""}`}>Rakan niaga</Link>
        {STATUSES.map((s) => <Link key={s} href={`?status=${s}`} className={`chip ${status === s ? "border-ink bg-ink text-white" : ""}`}>{LABEL[s]}</Link>)}
      </div>
      <div className="grid gap-3">
        {rows.map(({ l, pcode }) => (
          <details key={l.id} className="card" open={sp.id === String(l.id)}>
            <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-3 p-4">
              <span>
                <b>#{l.id} {l.name}</b>{l.companyName && ` (${l.companyName})`} · <span className="text-mute">{l.phone} · {l.location ?? "-"} · {l.source}{pcode && ` · ${pcode}`}</span>
              </span>
              <span className="flex items-center gap-2">{l.estimatedValue ? <span className="text-sm tabular-nums">{rm(l.estimatedValue)}</span> : null}<Badge status={l.status} /></span>
            </summary>
            <div className="border-t border-line p-4">
              {l.description && <p className="mb-3 text-sm whitespace-pre-line">{l.description}</p>}
              {l.statusNote && <p className="mb-3 text-xs text-mute">Catatan: {l.statusNote}</p>}
              <JsonForm action={`/api/admin/leads/${l.id}`} method="PATCH" submit="Kemas kini" success="Disimpan" className="grid gap-3 md:grid-cols-3">
                <select name="status" defaultValue={l.status} className="field">{STATUSES.map((s) => <option key={s} value={s}>{LABEL[s]}</option>)}</select>
                <select name="assignedTo" defaultValue={l.assignedTo ?? ""} className="field"><option value="">Tiada pegawai</option>{staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
                <input name="statusNote" defaultValue={l.statusNote ?? ""} placeholder="Catatan status" className="field" />
              </JsonForm>
              <div className="mt-3 flex gap-2 text-sm">{l.customerId && <Link href={`/admin/customers/${l.customerId}`} className="underline">Lihat pelanggan</Link>}</div>
            </div>
          </details>
        ))}
        {!rows.length && <p className="card p-6 text-center text-sm text-mute">Tiada lead.</p>}
      </div>
    </>
  );
}
