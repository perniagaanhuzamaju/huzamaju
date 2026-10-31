import { asc } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { requirePage } from "@/lib/auth/session";
import { ROLES, PERMISSIONS, STAFF_ROLES, type RoleKey, type Permission } from "@/lib/auth/permissions";
import { PageTitle, Badge } from "@/components/app/AppShell";
import { JsonForm } from "@/components/app/Forms";
import { dmy } from "@/lib/format";

export const metadata = { title: "Pengguna & peranan" };

export default async function AdminUsers() {
  const me = await requirePage("users.manage", "/admin/users");
  const rows = await db.select({ id: users.id, name: users.name, email: users.email, role: users.role, status: users.status, lastLoginAt: users.lastLoginAt, createdAt: users.createdAt }).from(users).orderBy(asc(users.id));
  const roleKeys = Object.keys(ROLES) as RoleKey[];
  return (
    <>
      <PageTitle title="Pengguna & peranan" />
      <details className="card mb-6 p-5"><summary className="cursor-pointer font-bold">+ Staf baharu</summary>
        <JsonForm action="/api/admin/users" submit="Cipta" success="Dicipta" reset className="mt-4 grid gap-3 md:grid-cols-2">
          <input name="name" required placeholder="Nama" className="field" /><input name="email" type="email" required placeholder="E-mel" className="field" />
          <input name="phone" placeholder="Telefon" className="field" />
          <select name="role" className="field">{STAFF_ROLES.filter((r) => r !== "super_admin" || me.role === "super_admin").map((r) => <option key={r} value={r}>{ROLES[r].name}</option>)}</select>
          <input name="password" type="password" required minLength={10} placeholder="Kata laluan sementara (min 10, huruf + nombor)" className="field md:col-span-2" autoComplete="new-password" />
        </JsonForm>
      </details>
      <div className="card overflow-x-auto">
        <table className="table text-sm">
          <thead><tr><th>Nama</th><th>E-mel</th><th>Log masuk terakhir</th><th>Peranan & status</th></tr></thead>
          <tbody>
            {rows.map((u) => (
              <tr key={u.id}>
                <td className="font-semibold">{u.name}</td><td>{u.email}</td><td>{u.lastLoginAt ? dmy(u.lastLoginAt.toISOString()) : "-"}</td>
                <td>
                  <JsonForm action={`/api/admin/users/${u.id}`} method="PATCH" submit="Simpan" className="flex flex-wrap items-center gap-2">
                    <select name="role" defaultValue={u.role} className="field w-44">{roleKeys.map((r) => <option key={r} value={r}>{ROLES[r].name}</option>)}</select>
                    <select name="status" defaultValue={u.status} className="field w-32"><option value="active">Aktif</option><option value="disabled">Dinyahaktif</option></select>
                    <Badge status={u.status} />
                  </JsonForm>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <h2 className="mt-8 mb-3 font-bold">Matriks kebenaran</h2>
      <div className="card overflow-x-auto">
        <table className="table text-xs">
          <thead><tr><th>Kebenaran</th>{roleKeys.map((r) => <th key={r}>{ROLES[r].name}</th>)}</tr></thead>
          <tbody>{(Object.keys(PERMISSIONS) as Permission[]).map((p) => <tr key={p}><td>{PERMISSIONS[p]}</td>{roleKeys.map((r) => <td key={r} className="text-center">{ROLES[r].permissions.includes(p) ? "✓" : ""}</td>)}</tr>)}</tbody>
        </table>
      </div>
    </>
  );
}
