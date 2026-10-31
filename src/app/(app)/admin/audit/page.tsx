import { desc, eq, ilike } from "drizzle-orm";
import { db } from "@/db";
import { auditLogs, users } from "@/db/schema";
import { requirePage } from "@/lib/auth/session";
import { PageTitle } from "@/components/app/AppShell";

export const metadata = { title: "Log audit" };

export default async function Audit({ searchParams }: PageProps<"/admin/audit">) {
  await requirePage("audit.view", "/admin/audit");
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim().slice(0, 60) : "";
  const rows = await db.select({ a: auditLogs, by: users.name }).from(auditLogs).leftJoin(users, eq(users.id, auditLogs.userId)).where(q ? ilike(auditLogs.action, `%${q}%`) : undefined).orderBy(desc(auditLogs.createdAt)).limit(300);
  return (
    <>
      <PageTitle title="Log audit" lead="Semua tindakan penting: log masuk, kelulusan, perubahan harga, komisen, paparan akaun bank." />
      <form className="mb-3 flex gap-2"><input name="q" defaultValue={q} placeholder="Tapis tindakan (cth: pricing, commission, auth)" className="field max-w-sm" /><button className="btn btn-dark btn-sm">Tapis</button></form>
      <div className="card overflow-x-auto">
        <table className="table text-xs">
          <thead><tr><th>Masa</th><th>Pengguna</th><th>Tindakan</th><th>Rekod</th><th>Butiran</th></tr></thead>
          <tbody>{rows.map(({ a, by }) => <tr key={a.id}><td className="whitespace-nowrap">{a.createdAt.toLocaleString("ms-MY", { timeZone: "Asia/Kuala_Lumpur" })}</td><td>{by ?? "-"}</td><td className="font-mono">{a.action}</td><td>{a.entity} {a.entityId}</td><td className="max-w-md truncate font-mono">{a.meta ? JSON.stringify(a.meta).slice(0, 200) : ""}</td></tr>)}</tbody>
        </table>
      </div>
    </>
  );
}
