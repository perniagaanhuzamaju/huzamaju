import Link from "next/link";
import { notFound } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { communications, customers, enquiries, projects, quotations, users } from "@/db/schema";
import { requirePage, can } from "@/lib/auth/session";
import { customerDocuments } from "@/lib/data/portal";
import { PageTitle, Badge } from "@/components/app/AppShell";
import { JsonForm, UploadForm } from "@/components/app/Forms";
import { rm, dmy } from "@/lib/format";

export default async function AdminCustomer({ params }: PageProps<"/admin/customers/[id]">) {
  const u = await requirePage("customers.view", "/admin/customers");
  const id = Number((await params).id);
  const [c] = Number.isInteger(id) ? await db.select().from(customers).where(eq(customers.id, id)) : [];
  if (!c) notFound();
  const [qs, es, ps, comms, docs] = await Promise.all([
    db.select().from(quotations).where(eq(quotations.customerId, id)).orderBy(desc(quotations.createdAt)),
    db.select().from(enquiries).where(eq(enquiries.customerId, id)).orderBy(desc(enquiries.createdAt)),
    db.select().from(projects).where(eq(projects.customerId, id)),
    db.select({ m: communications, by: users.name }).from(communications).leftJoin(users, eq(users.id, communications.userId)).where(eq(communications.customerId, id)).orderBy(desc(communications.createdAt)),
    customerDocuments(id),
  ]);
  const editable = can(u, "customers.edit");
  return (
    <>
      <PageTitle title={c.fullName} lead={[c.companyName, c.phone, c.email].filter(Boolean).join(" · ")} actions={c.phone ? <a className="btn btn-wa btn-sm" target="_blank" rel="noopener" href={`https://wa.me/${c.phone.replace(/\D/g, "").replace(/^0/, "60")}`}>WhatsApp</a> : null} />
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card p-5">
          <h2 className="font-bold">Maklumat</h2>
          {editable ? (
            <JsonForm action={`/api/admin/customers/${c.id}`} method="PATCH" submit="Simpan" success="Disimpan" className="mt-3 grid gap-3">
              <input name="fullName" defaultValue={c.fullName} className="field" required />
              <input name="companyName" defaultValue={c.companyName ?? ""} placeholder="Syarikat" className="field" />
              <input name="phone" defaultValue={c.phone ?? ""} placeholder="Telefon" className="field" />
              <input name="email" defaultValue={c.email ?? ""} placeholder="E-mel" className="field" />
              <textarea name="address" defaultValue={c.address ?? ""} placeholder="Alamat" rows={2} className="field" />
              <input name="segment" defaultValue={c.segment ?? ""} placeholder="Segmen (pemilik rumah, syarikat, kilang…)" className="field" />
              <textarea name="notes" defaultValue={c.notes ?? ""} placeholder="Catatan dalaman" rows={3} className="field" />
            </JsonForm>
          ) : (
            <p className="mt-2 text-sm whitespace-pre-line">{c.address}</p>
          )}
        </section>
        <section className="card p-5">
          <h2 className="font-bold">Log komunikasi</h2>
          {editable && (
            <JsonForm action={`/api/admin/customers/${c.id}/communications`} submit="Tambah" reset className="mt-3 grid gap-2">
              <div className="grid grid-cols-2 gap-2">
                <select name="channel" className="field">{["phone", "whatsapp", "email", "site_visit", "note"].map((x) => <option key={x}>{x}</option>)}</select>
                <select name="direction" className="field"><option value="out">Keluar</option><option value="in">Masuk</option><option value="note">Nota</option></select>
              </div>
              <textarea name="body" required rows={2} className="field" placeholder="Ringkasan perbualan / tindakan" />
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="visibleToCustomer" /> Papar kepada pelanggan di portal</label>
            </JsonForm>
          )}
          <ul className="mt-4 grid max-h-96 gap-2 overflow-y-auto">
            {comms.map(({ m, by }) => (
              <li key={m.id} className="rounded-lg bg-sand p-3 text-sm">
                <p className="text-xs text-mute">{m.createdAt.toLocaleString("ms-MY", { timeZone: "Asia/Kuala_Lumpur" })} · {m.channel} · {m.direction}{by && ` · ${by}`}{m.visibleToCustomer && " · dipapar"}</p>
                <p className="mt-1 whitespace-pre-line">{m.body}</p>
              </li>
            ))}
          </ul>
        </section>
      </div>
      <h2 className="mt-8 mb-3 font-bold">Sebut harga</h2>
      <div className="card overflow-x-auto">
        <table className="table"><tbody>
          {qs.map((q) => <tr key={q.id}><td><Link href={`/admin/quotations/${q.id}`} className="font-semibold underline">{q.number}</Link></td><td>{q.title}</td><td>{dmy(q.issueDate)}</td><td><Badge status={q.status} /></td><td className="text-right">{rm(q.grandTotal)}</td></tr>)}
          {!qs.length && <tr><td className="text-mute">Tiada</td></tr>}
        </tbody></table>
      </div>
      <h2 className="mt-8 mb-3 font-bold">Pertanyaan</h2>
      <ul className="grid gap-2">{es.map((e) => <li key={e.id} className="card p-3 text-sm"><b>#{e.id} {e.kind}</b> · {dmy(e.createdAt.toISOString())} <Badge status={e.status} /><p className="mt-1 whitespace-pre-line text-ink-2">{e.message}</p></li>)}</ul>
      <h2 className="mt-8 mb-3 font-bold">Projek</h2>
      <ul className="grid gap-2">{ps.map((p) => <li key={p.id} className="card p-3 text-sm"><Link href={`/admin/projects/${p.id}`} className="font-semibold underline">{p.titleMs}</Link> <Badge status={p.status} /> {p.progress}%</li>)}</ul>
      <div className="mt-8 mb-3 flex items-center justify-between"><h2 className="font-bold">Dokumen</h2>{editable && <UploadForm action={`/api/admin/documents`} extra={{ customerId: String(c.id) }} />}</div>
      <ul className="flex flex-wrap gap-2">{docs.map((d) => <li key={d.id}><a href={`/api/documents/${d.id}`} target="_blank" rel="noopener" className="chip">{d.fileName}</a></li>)}</ul>
    </>
  );
}
