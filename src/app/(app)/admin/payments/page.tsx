import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { partners, payments, projects } from "@/db/schema";
import { requirePage } from "@/lib/auth/session";
import { PageTitle, Badge } from "@/components/app/AppShell";
import { ActionButton } from "@/components/app/Forms";
import { rm, dmy } from "@/lib/format";

export const metadata = { title: "Bayaran" };

export default async function AdminPayments() {
  await requirePage("payments.manage", "/admin/payments");
  const rows = await db.select({ p: payments, title: projects.titleMs, code: partners.code }).from(payments).leftJoin(projects, eq(projects.id, payments.projectId)).leftJoin(partners, eq(partners.id, payments.partnerId)).orderBy(desc(payments.paidAt)).limit(500);
  return (
    <>
      <PageTitle title="Bayaran" lead="Bayaran pelanggan (rekod di halaman projek, kemudian sahkan) dan bayaran komisen kepada rakan niaga." />
      <div className="card overflow-x-auto">
        <table className="table">
          <thead><tr><th>Tarikh</th><th>Jenis</th><th>Projek / rakan</th><th>Peringkat</th><th>Rujukan</th><th className="text-right">Amaun</th><th>Status</th></tr></thead>
          <tbody>
            {rows.map(({ p, title, code }) => (
              <tr key={p.id}>
                <td>{dmy(p.paidAt)}</td>
                <td>{p.kind === "client_receipt" ? "Terimaan pelanggan" : "Bayaran komisen"}</td>
                <td>{p.projectId ? <Link href={`/admin/projects/${p.projectId}`} className="underline">{title}</Link> : null}{code && <p className="text-xs">{code}</p>}</td>
                <td>{p.milestone ?? "-"}</td><td>{p.reference ?? "-"}</td><td className="text-right tabular-nums">{rm(p.amount)}</td>
                <td>{p.verifiedAt ? <Badge status="verified" /> : <ActionButton action={`/api/admin/payments/${p.id}`} method="PATCH" label="Sahkan" confirm="Sahkan bayaran ini telah diterima?" />}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
