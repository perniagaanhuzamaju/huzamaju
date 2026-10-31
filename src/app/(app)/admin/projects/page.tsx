import Link from "next/link";
import { desc } from "drizzle-orm";
import { db } from "@/db";
import { projects } from "@/db/schema";
import { requirePage, can } from "@/lib/auth/session";
import { PageTitle, Badge } from "@/components/app/AppShell";
import { JsonForm } from "@/components/app/Forms";
import { rm } from "@/lib/format";

export const metadata = { title: "Projek" };

export default async function AdminProjects() {
  const u = await requirePage("projects.view", "/admin/projects");
  const rows = await db.select().from(projects).orderBy(desc(projects.createdAt));
  return (
    <>
      <PageTitle title="Projek & portfolio" lead="Projek pelanggan, kemajuan, dokumen, dan projek yang dipaparkan dalam portfolio awam." />
      {can(u, "projects.edit") && (
        <details className="card mb-6 p-5">
          <summary className="cursor-pointer font-bold">+ Projek baharu</summary>
          <JsonForm action="/api/admin/projects" submit="Cipta" redirectTo="/admin/projects/:id" className="mt-4 flex gap-3">
            <input name="titleMs" required placeholder="Tajuk projek" className="field" />
          </JsonForm>
        </details>
      )}
      <div className="card overflow-x-auto">
        <table className="table">
          <thead><tr><th>Projek</th><th>Lokasi</th><th>Status</th><th>Kemajuan</th><th>Portfolio</th><th className="text-right">Nilai</th></tr></thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id}>
                <td><Link href={`/admin/projects/${p.id}`} className="font-semibold underline">{p.titleMs}</Link>{p.isDemo && <span className="ml-2 rounded bg-bad/10 px-1.5 text-xs font-bold text-bad">DEMO</span>}</td>
                <td>{p.location ?? "-"}</td><td><Badge status={p.status} /></td><td>{p.progress}%</td><td>{p.isPortfolio ? "Ya" : "-"}</td><td className="text-right">{rm(p.value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
