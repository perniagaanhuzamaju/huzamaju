import Link from "next/link";
import { notFound } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { commissionTransactions, leads, partners, payments, projectDocuments, projects } from "@/db/schema";
import { requirePage, can } from "@/lib/auth/session";
import { RESOURCES } from "@/lib/admin/resources";
import { PageTitle, Badge } from "@/components/app/AppShell";
import { ActionButton, JsonForm, UploadForm } from "@/components/app/Forms";
import { ResourceFields } from "@/components/app/ResourceFields";
import { rm, dmy } from "@/lib/format";
import { klToday } from "@/lib/quotation/number";

export default async function AdminProject({ params }: PageProps<"/admin/projects/[id]">) {
  const u = await requirePage("projects.view", "/admin/projects");
  const id = Number((await params).id);
  const [p] = Number.isInteger(id) ? await db.select().from(projects).where(eq(projects.id, id)) : [];
  if (!p) notFound();
  const [docs, pays, comms, lead] = await Promise.all([
    db.select().from(projectDocuments).where(eq(projectDocuments.projectId, id)),
    db.select().from(payments).where(eq(payments.projectId, id)).orderBy(desc(payments.paidAt)),
    db.select({ t: commissionTransactions, code: partners.code }).from(commissionTransactions).leftJoin(partners, eq(partners.id, commissionTransactions.partnerId)).where(eq(commissionTransactions.projectId, id)),
    p.leadId ? db.select({ l: leads, code: partners.code }).from(leads).leftJoin(partners, eq(partners.id, leads.partnerId)).where(eq(leads.id, p.leadId)).then((r) => r[0]) : Promise.resolve(undefined),
  ]);
  const received = pays.filter((x) => x.kind === "client_receipt" && x.verifiedAt).reduce((a, x) => a + x.amount, 0);
  const edit = can(u, "projects.edit");
  return (
    <>
      <PageTitle title={p.titleMs} lead={`${p.location ?? ""} · Nilai ${rm(p.value)} · Bayaran disahkan ${rm(received)}`} actions={<Badge status={p.status} />} />
      {p.isDemo && <p className="mb-4 rounded-lg bg-bad/10 p-3 text-sm font-bold text-bad">DATA DEMO: projek ini bukan rekod projek sebenar syarikat.</p>}
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card p-5 text-sm">
          <h2 className="mb-3 font-bold">Pautan</h2>
          {p.quotationId && <p>Sebut harga: <Link href={`/admin/quotations/${p.quotationId}`} className="underline">#{p.quotationId}</Link></p>}
          {p.customerId && <p>Pelanggan: <Link href={`/admin/customers/${p.customerId}`} className="underline">#{p.customerId}</Link></p>}
          {lead && <p>Lead: #{lead.l.id} {lead.l.name} <Badge status={lead.l.status} /> {lead.code && <b>· Rakan niaga {lead.code}</b>}</p>}
          {edit && (
            <JsonForm action={`/api/admin/projects/${id}`} method="PATCH" submit="Simpan pautan" className="mt-3 flex flex-wrap gap-2">
              <input name="customerId" defaultValue={p.customerId ?? ""} placeholder="ID pelanggan" className="field w-36" />
              <input name="leadId" defaultValue={p.leadId ?? ""} placeholder="ID lead" className="field w-36" />
            </JsonForm>
          )}
          <h2 className="mt-6 mb-3 font-bold">Komisen rakan niaga</h2>
          {comms.length ? (
            <ul className="grid gap-1">{comms.map(({ t, code }) => <li key={t.id}>{code} · peringkat {t.trancheNo} · {rm(t.amount)} <Badge status={t.status} /></li>)}</ul>
          ) : lead?.code ? (
            can(u, "commissions.manage") ? <ActionButton action={`/api/admin/projects/${id}/commission`} label="Jana komisen (projek diperoleh)" className="btn btn-gold btn-sm" confirm="Sahkan projek ini telah diperoleh dengan nilai kontrak yang betul?" /> : <p className="text-mute">Belum dijana.</p>
          ) : (
            <p className="text-mute">Projek ini bukan daripada rakan niaga.</p>
          )}
        </section>
        <section className="card p-5 text-sm">
          <h2 className="mb-3 font-bold">Bayaran pelanggan</h2>
          <ul className="grid gap-2">
            {pays.filter((x) => x.kind === "client_receipt").map((x) => (
              <li key={x.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-sand p-2">
                <span>{dmy(x.paidAt)} · {rm(x.amount)} · {x.milestone ?? ""} {x.reference && `(${x.reference})`}</span>
                {x.verifiedAt ? <Badge status="verified" /> : can(u, "payments.manage") ? <ActionButton action={`/api/admin/payments/${x.id}`} method="PATCH" label="Sahkan bayaran" confirm="Sahkan bayaran ini telah diterima dalam akaun syarikat?" /> : <Badge status="pending" />}
              </li>
            ))}
          </ul>
          {can(u, "payments.manage") && (
            <JsonForm action="/api/admin/payments" extra={{ projectId: id }} submit="Rekod bayaran" reset className="mt-4 grid grid-cols-2 gap-2">
              <input name="amount" type="number" step="0.01" required placeholder="Amaun (RM)" className="field" />
              <input name="paidAt" type="date" required defaultValue={klToday()} className="field" />
              <input name="milestone" placeholder="Peringkat (cth: Deposit 30%)" className="field" />
              <input name="reference" placeholder="Rujukan bank / resit" className="field" />
            </JsonForm>
          )}
          <div className="mt-6 flex items-center justify-between"><h2 className="font-bold">Dokumen & gambar</h2>{edit && <UploadForm action="/api/admin/documents" extra={{ projectId: String(id), customerId: String(p.customerId ?? "") }} />}</div>
          <ul className="mt-2 flex flex-wrap gap-2">{docs.map((d) => <li key={d.id}><a className="chip" href={`/api/documents/${d.id}`} target="_blank" rel="noopener">{d.fileName}</a></li>)}</ul>
        </section>
      </div>
      {edit && (
        <section className="card mt-8 p-5">
          <h2 className="mb-4 font-bold">Butiran projek & portfolio</h2>
          <JsonForm action={`/api/admin/resources/projects/${id}`} method="PATCH" submit="Simpan" success="Disimpan" className="grid gap-4">
            <ResourceFields fields={RESOURCES.projects.fields} row={p as unknown as Record<string, unknown>} prefix="p" />
          </JsonForm>
        </section>
      )}
    </>
  );
}
