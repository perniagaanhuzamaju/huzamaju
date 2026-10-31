import { notFound } from "next/navigation";
import { asc } from "drizzle-orm";
import type { PgTable } from "drizzle-orm/pg-core";
import { db } from "@/db";
import { requirePage } from "@/lib/auth/session";
import { RESOURCES, fieldValue } from "@/lib/admin/resources";
import { PageTitle } from "@/components/app/AppShell";
import { JsonForm, ActionButton } from "@/components/app/Forms";
import { ResourceFields } from "@/components/app/ResourceFields";

export default async function ResourcePage({ params }: PageProps<"/admin/r/[resource]">) {
  const { resource } = await params;
  const r = RESOURCES[resource];
  if (!r) notFound();
  await requirePage(r.permission, `/admin/r/${resource}`);
  const table = r.table as PgTable;
  const idKey = r.idField ?? "id";
  const idCol = (table as unknown as Record<string, Parameters<typeof asc>[0]>)[idKey];
  const rows = (await db.select().from(table).orderBy(asc(idCol)).limit(1000)) as Record<string, unknown>[];
  const listFields = r.fields.filter((f) => f.list);
  const label = (f: (typeof listFields)[number], v: unknown) => {
    if (f.type === "bool") return v ? "Ya" : "Tidak";
    if (f.type === "select") return f.options?.find((o) => o.value === v)?.label ?? String(v ?? "-");
    const s = fieldValue(f, v);
    return s.length > 60 ? `${s.slice(0, 60)}…` : s || "-";
  };
  return (
    <>
      <PageTitle title={r.title} lead={r.lead} />
      <details className="card mb-6 p-5">
        <summary className="cursor-pointer font-bold">+ Tambah baharu</summary>
        <JsonForm action={`/api/admin/resources/${resource}`} submit="Tambah" success="Ditambah" reset className="mt-4 grid gap-4">
          <ResourceFields fields={r.fields} prefix="new" />
        </JsonForm>
      </details>
      <p className="mb-2 text-sm text-mute">{rows.length} rekod</p>
      <div className="grid gap-2">
        {rows.map((row) => {
          const id = String(row[idKey]);
          return (
            <details key={id} className="card">
              <summary className="flex cursor-pointer flex-wrap gap-x-6 gap-y-1 p-4 text-sm">
                {listFields.map((f) => (
                  <span key={f.name}><span className="text-mute">{f.label}: </span><b>{label(f, row[f.name])}</b></span>
                ))}
              </summary>
              <div className="border-t border-line p-4">
                <JsonForm action={`/api/admin/resources/${resource}/${encodeURIComponent(id)}`} method="PATCH" submit="Simpan" success="Disimpan" className="grid gap-4">
                  <ResourceFields fields={r.fields} row={row} prefix={`e${id}`} />
                </JsonForm>
                <div className="mt-3 border-t border-line pt-3">
                  <ActionButton action={`/api/admin/resources/${resource}/${encodeURIComponent(id)}`} method="DELETE" label="Padam" confirm="Padam rekod ini?" className="btn btn-sm border border-bad/40 text-bad" />
                </div>
              </div>
            </details>
          );
        })}
      </div>
    </>
  );
}
