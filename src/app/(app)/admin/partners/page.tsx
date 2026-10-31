import { count, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { leads, partners, referrals, users } from "@/db/schema";
import { requirePage, can } from "@/lib/auth/session";
import { PageTitle, Badge } from "@/components/app/AppShell";
import { ActionButton } from "@/components/app/Forms";
import { RevealBank } from "@/components/app/RevealBank";
import { dmy } from "@/lib/format";

export const metadata = { title: "Rakan niaga" };

export default async function AdminPartners() {
  const u = await requirePage("partners.manage", "/admin/partners");
  const [rows, leadCounts, visitCounts] = await Promise.all([
    db.select({ p: partners, name: users.name, email: users.email, phone: users.phone }).from(partners).innerJoin(users, eq(users.id, partners.userId)).orderBy(desc(partners.createdAt)),
    db.select({ id: leads.partnerId, n: count() }).from(leads).groupBy(leads.partnerId),
    db.select({ id: referrals.partnerId, n: count() }).from(referrals).groupBy(referrals.partnerId),
  ]);
  const lc = new Map(leadCounts.map((r) => [r.id, r.n]));
  const vc = new Map(visitCounts.map((r) => [r.id, r.n]));
  return (
    <>
      <PageTitle title="Rakan niaga" lead="Luluskan permohonan Rakan Rujukan dan Ejen Jualan Bebas. Pautan rujukan hanya aktif selepas diluluskan." />
      <div className="grid gap-3">
        {rows.map(({ p, name, email, phone }) => (
          <div key={p.id} className="card p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p><b>{p.code}</b> · {name} · {p.type === "agent" ? "Ejen Jualan" : "Rakan Rujukan"}</p>
              <Badge status={p.status} />
            </div>
            <p className="mt-1 text-sm text-mute">{email} · {phone} · {p.area ?? "-"} · {p.occupation ?? "-"} · daftar {dmy(p.createdAt.toISOString())}</p>
            {p.experience && <p className="mt-2 text-sm">{p.experience}</p>}
            <p className="mt-2 text-sm">Lawatan pautan: <b>{vc.get(p.id) ?? 0}</b> · Lead: <b>{lc.get(p.id) ?? 0}</b> · Bank: {p.payoutBankName ?? "-"} {p.payoutAccountLast4 ? (can(u, "commissions.approve") ? <RevealBank partnerId={p.id} last4={p.payoutAccountLast4} /> : `****${p.payoutAccountLast4}`) : ""}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {p.status !== "approved" && <ActionButton action={`/api/admin/partners/${p.id}`} method="PATCH" body={{ action: "approve" }} label="Luluskan" className="btn btn-gold btn-sm" />}
              {p.status === "approved" && <ActionButton action={`/api/admin/partners/${p.id}`} method="PATCH" body={{ action: "suspend" }} label="Gantung" confirm="Gantung rakan niaga ini?" />}
              {p.status === "pending" && <ActionButton action={`/api/admin/partners/${p.id}`} method="PATCH" body={{ action: "reject" }} label="Tolak" confirm="Tolak permohonan ini?" />}
            </div>
          </div>
        ))}
        {!rows.length && <p className="card p-6 text-center text-sm text-mute">Tiada rakan niaga.</p>}
      </div>
    </>
  );
}
