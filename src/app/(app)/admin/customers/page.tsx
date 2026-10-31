import Link from "next/link";
import { desc, ilike, or } from "drizzle-orm";
import { db } from "@/db";
import { customers } from "@/db/schema";
import { requirePage } from "@/lib/auth/session";
import { PageTitle } from "@/components/app/AppShell";
import { dmy } from "@/lib/format";

export const metadata = { title: "Pelanggan" };

export default async function AdminCustomers({ searchParams }: PageProps<"/admin/customers">) {
  await requirePage("customers.view", "/admin/customers");
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim().slice(0, 100) : "";
  const like = `%${q.replace(/[%_]/g, "")}%`;
  const rows = await db
    .select()
    .from(customers)
    .where(q ? or(ilike(customers.fullName, like), ilike(customers.phone, like), ilike(customers.email, like), ilike(customers.companyName, like)) : undefined)
    .orderBy(desc(customers.createdAt))
    .limit(300);
  return (
    <>
      <PageTitle title="Pelanggan" lead="Rekod pelanggan daripada laman web, sebut harga AI, portal dan rakan niaga." />
      <form className="mb-4 flex gap-2"><input name="q" defaultValue={q} placeholder="Cari nama, telefon, e-mel, syarikat" className="field max-w-md" /><button className="btn btn-dark btn-sm">Cari</button></form>
      <div className="card overflow-x-auto">
        <table className="table">
          <thead><tr><th>Nama</th><th>Telefon</th><th>E-mel</th><th>Sumber</th><th>Portal</th><th>Didaftar</th></tr></thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.id}>
                <td><Link href={`/admin/customers/${c.id}`} className="font-semibold underline">{c.fullName}</Link>{c.companyName && <p className="text-xs text-mute">{c.companyName}</p>}</td>
                <td>{c.phone ?? "-"}</td><td>{c.email ?? "-"}</td><td>{c.source}</td><td>{c.userId ? "Ya" : "-"}</td><td>{dmy(c.createdAt.toISOString())}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
