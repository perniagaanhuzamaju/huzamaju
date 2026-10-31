import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { commissionTransactions, partners, projects, users } from "@/db/schema";
import { requirePage, can } from "@/lib/auth/session";
import { PageTitle, Badge } from "@/components/app/AppShell";
import { ActionButton, JsonForm } from "@/components/app/Forms";
import { rm, dmy } from "@/lib/format";

export const metadata = { title: "Komisen" };

export default async function AdminCommissions() {
  const u = await requirePage("commissions.manage", "/admin/commissions");
  const rows = await db
    .select({ t: commissionTransactions, code: partners.code, name: users.name, last4: partners.payoutAccountLast4, bank: partners.payoutBankName, title: projects.titleMs })
    .from(commissionTransactions)
    .leftJoin(partners, eq(partners.id, commissionTransactions.partnerId))
    .leftJoin(users, eq(users.id, partners.userId))
    .leftJoin(projects, eq(projects.id, commissionTransactions.projectId))
    .orderBy(desc(commissionTransactions.createdAt))
    .limit(500);
  const approver = can(u, "commissions.approve");
  return (
    <>
      <PageTitle title="Komisen" lead="Aliran: projek diperoleh → komisen 'menunggu' → bayaran pelanggan disahkan → 'layak' → diluluskan → dibayar. Komisen tidak dijana hanya kerana sebut harga dibuat." />
      <div className="grid gap-3">
        {rows.map(({ t, code, name, last4, bank, title }) => (
          <div key={t.id} className="card p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p><b>{code}</b> {name} · <Link href={`/admin/projects/${t.projectId}`} className="underline">{title}</Link> · peringkat {t.trancheNo}</p>
              <p className="flex items-center gap-2"><b className="tabular-nums">{rm(t.amount)}</b><Badge status={t.status} /></p>
            </div>
            <p className="mt-1 text-xs text-mute">{t.note} · asas {rm(t.baseValue)} · {dmy(t.createdAt.toISOString())}{t.eligibleAt && ` · layak ${dmy(t.eligibleAt.toISOString())}`}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {approver && t.status === "eligible" && <ActionButton action={`/api/admin/commissions/${t.id}`} method="PATCH" body={{ action: "approve" }} label="Luluskan" className="btn btn-gold btn-sm" />}
              {approver && t.status === "approved" && (
                <JsonForm action={`/api/admin/commissions/${t.id}`} method="PATCH" extra={{ action: "pay" }} submit={`Tanda dibayar ke ${bank ?? "bank"} ****${last4 ?? "----"}`} className="flex flex-wrap items-center gap-2">
                  <input name="reference" required placeholder="Rujukan pindahan" className="field w-48" />
                </JsonForm>
              )}
              {!["paid", "cancelled"].includes(t.status) && <ActionButton action={`/api/admin/commissions/${t.id}`} method="PATCH" body={{ action: "cancel" }} label="Batal" confirm="Batalkan komisen ini?" />}
            </div>
          </div>
        ))}
        {!rows.length && <p className="card p-6 text-center text-sm text-mute">Tiada transaksi komisen.</p>}
      </div>
    </>
  );
}
