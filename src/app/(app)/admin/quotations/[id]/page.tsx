import Link from "next/link";
import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { customers, pricingItems, projectDocuments, quotationItems, quotations, users } from "@/db/schema";
import { requirePage, can } from "@/lib/auth/session";
import { UNITS } from "@/lib/pricing/units";
import { quoteCategory } from "@/lib/catalog";
import type { Estimate } from "@/lib/ai/schema";
import { PageTitle, Badge, Stat } from "@/components/app/AppShell";
import { ActionButton, JsonForm, UploadForm } from "@/components/app/Forms";
import { QuotationItemsEditor } from "@/components/app/QuotationItemsEditor";
import { rm, dmy, num } from "@/lib/format";

export default async function AdminQuotation({ params }: PageProps<"/admin/quotations/[id]">) {
  const u = await requirePage("quotations.view", "/admin/quotations");
  const id = Number((await params).id);
  const [q] = Number.isInteger(id) ? await db.select().from(quotations).where(eq(quotations.id, id)) : [];
  if (!q) notFound();
  const [items, catalog, docs, [cust], [approver]] = await Promise.all([
    db.select().from(quotationItems).where(eq(quotationItems.quotationId, id)).orderBy(asc(quotationItems.sort)),
    db.select({ code: pricingItems.code, description: pricingItems.description, unit: pricingItems.unit }).from(pricingItems).where(eq(pricingItems.active, true)).orderBy(asc(pricingItems.code)),
    db.select().from(projectDocuments).where(eq(projectDocuments.quotationId, id)),
    q.customerId ? db.select().from(customers).where(eq(customers.id, q.customerId)) : Promise.resolve([]),
    q.approvedBy ? db.select({ name: users.name }).from(users).where(eq(users.id, q.approvedBy)) : Promise.resolve([]),
  ]);
  const snap = (q.calcSnapshot ?? {}) as { internal?: { costTotal: number; grossProfit: number; effectiveMargin: number | null; warnings: string[]; locationFactor: number; segmentFactor: number; settings: { targetMargin: number } } };
  const internal = snap.internal;
  const est = (q.aiAnalysis ?? {}) as Partial<Estimate>;
  const inputs = q.inputs as Record<string, unknown>;
  const editable = can(u, "quotations.edit");
  const ov = q.overridesJson ?? {};
  return (
    <>
      <PageTitle
        title={q.number}
        lead={`${q.title} · ${quoteCategory(q.category)?.name.ms ?? q.category} · ${q.segment === "commercial" ? "Komersial" : "Kediaman"}`}
        actions={
          <>
            <Badge status={q.status} />
            <a href={`/api/quotation/${q.publicToken}/pdf`} target="_blank" rel="noopener" className="btn btn-line btn-sm">PDF</a>
            <a href={`/q/${q.publicToken}`} target="_blank" rel="noopener" className="btn btn-line btn-sm">Pautan pelanggan</a>
            {can(u, "quotations.approve") && !["approved", "sent", "accepted"].includes(q.status) && <ActionButton action={`/api/admin/quotations/${id}`} method="PATCH" body={{ action: "approve" }} label="Luluskan sebagai sebut harga rasmi" className="btn btn-gold btn-sm" confirm="Luluskan sebut harga ini sebagai sebut harga rasmi syarikat?" />}
            {editable && q.status === "approved" && <ActionButton action={`/api/admin/quotations/${id}`} method="PATCH" body={{ action: "status", status: "sent" }} label="Tanda dihantar" />}
            {editable && ["approved", "sent"].includes(q.status) && <ActionButton action={`/api/admin/quotations/${id}`} method="PATCH" body={{ action: "status", status: "accepted" }} label="Pelanggan terima" />}
            {editable && q.status === "accepted" && can(u, "projects.edit") && <ActionButton action={`/api/admin/projects`} body={{ fromQuotationId: id }} label="Cipta projek" className="btn btn-dark btn-sm" />}
          </>
        }
      />
      {approver && <p className="mb-4 text-sm text-ok">Diluluskan oleh {approver.name} pada {q.approvedAt?.toLocaleString("ms-MY", { timeZone: "Asia/Kuala_Lumpur" })}</p>}
      {(q.formalRequestedAt || q.siteVisitRequestedAt) && (
        <p className="mb-4 rounded-lg bg-amber/15 p-3 text-sm font-semibold">
          {q.formalRequestedAt && `Pelanggan meminta sebut harga rasmi (${q.formalRequestedAt.toLocaleDateString("ms-MY")}). `}
          {q.siteVisitRequestedAt && `Pelanggan meminta lawatan tapak (${q.siteVisitRequestedAt.toLocaleDateString("ms-MY")}).`}
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Jumlah (pelanggan)" value={rm(q.grandTotal)} hint={`Julat ${rm(q.rangeLow)} – ${rm(q.rangeHigh)}`} />
        {internal && <Stat label="Kos dalaman" value={rm(internal.costTotal)} hint="Sulit: tidak dipaparkan kepada pelanggan" />}
        {internal && <Stat label="Untung kasar" value={rm(internal.grossProfit)} hint={internal.effectiveMargin != null ? `Margin efektif ${(internal.effectiveMargin * 100).toFixed(1)}%` : undefined} />}
        <Stat label="Item semakan QS" value={q.pendingReviewCount} hint={internal ? `Faktor lokasi ${internal.locationFactor} · segmen ${internal.segmentFactor}` : undefined} />
      </div>
      {internal?.warnings?.length ? <ul className="mt-4 grid gap-1 text-sm font-semibold text-bad">{internal.warnings.map((w, i) => <li key={i}>⚠ {w}</li>)}</ul> : null}

      <section className="card mt-8 overflow-x-auto">
        <table className="table">
          <thead><tr><th>#</th><th>Kod</th><th>Butiran</th><th>Unit</th><th className="text-right">Kuantiti</th><th className="text-right">Kos/unit</th><th className="text-right">Kadar</th><th className="text-right">Jumlah</th><th>Status</th></tr></thead>
          <tbody>
            {items.map((i) => (
              <tr key={i.id}>
                <td>{i.sort}</td><td className="font-mono text-xs">{i.code ?? "-"}</td>
                <td>{i.description}{i.quantityBasis && <p className="text-xs text-mute">{i.quantityBasis}</p>}{i.reviewReason && <p className="text-xs font-semibold text-gold-strong">{i.reviewReason}</p>}</td>
                <td>{i.unit}</td><td className="text-right">{num(i.quantity)}</td><td className="text-right text-mute">{rm(i.costRate)}</td><td className="text-right">{rm(i.rate)}</td><td className="text-right font-semibold">{rm(i.amount)}</td>
                <td>{i.status === "priced" ? <span className="text-xs font-bold text-ok">Dihargakan</span> : <Badge status="pending_qs" />}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="grid justify-end gap-1 p-4 text-sm">
          <p>Jumlah kecil: <b>{rm(q.subtotal)}</b></p>
          {q.additionalTotal > 0 && <p>Caj tambahan / minimum: <b>{rm(q.additionalTotal)}</b></p>}
          <p>Luar jangka: <b>{rm(q.contingency)}</b></p>
          {q.sst > 0 && <p>SST: <b>{rm(q.sst)}</b></p>}
          <p className="text-base">Jumlah: <b>{rm(q.grandTotal)}</b></p>
        </div>
      </section>

      {editable && (
        <>
          <section className="card mt-8 p-5">
            <h2 className="mb-1 font-bold">Edit item (QS)</h2>
            <p className="mb-4 text-sm text-mute">Pilih kod daripada pangkalan harga. Item tanpa kod atau kuantiti kekal sebagai &quot;semakan QS&quot;. Semua kadar dikira semula daripada pangkalan harga.</p>
            <QuotationItemsEditor
              id={id}
              catalog={catalog}
              units={UNITS}
              initial={(est.line_items ?? []).map((l) => ({ pricing_code: l.pricing_code ?? "", description: l.description, unit: l.unit, quantity: l.quantity == null ? "" : String(l.quantity), quantity_basis: l.quantity_basis ?? "" }))}
            />
          </section>
          <section className="card mt-8 p-5">
            <h2 className="mb-1 font-bold">Harga khusus projek</h2>
            <p className="mb-4 text-sm text-mute">Kosongkan untuk guna tetapan am. Margin di bawah minimum hanya untuk pegawai kelulusan.</p>
            <JsonForm action={`/api/admin/quotations/${id}`} method="PATCH" extra={{ action: "overrides" }} submit="Guna & kira semula" success="Dikira semula" className="grid gap-3 md:grid-cols-4">
              <div><label className="label">Margin sasaran</label><input name="targetMargin" defaultValue={ov.targetMargin ?? ""} placeholder={String(internal?.settings.targetMargin ?? "")} className="field" /></div>
              <div><label className="label">Luar jangka</label><input name="contingencyPct" defaultValue={ov.contingencyPct ?? ""} placeholder="0.05" className="field" /></div>
              <div><label className="label">Faktor lokasi</label><input name="locationFactor" defaultValue={ov.locationFactor ?? ""} placeholder={String(internal?.locationFactor ?? "")} className="field" /></div>
              <div><label className="label">Overhead</label><input name="overheadPct" defaultValue={ov.overheadPct ?? ""} placeholder="0" className="field" /></div>
              <div className="md:col-span-4"><label className="label">Kadar jualan khas (KOD=RM, satu baris satu)</label><textarea name="rates" rows={2} defaultValue={Object.entries(ov).filter(([k]) => k.startsWith("rate:")).map(([k, v]) => `${k.slice(5)}=${v}`).join("\n")} className="field font-mono" /></div>
            </JsonForm>
          </section>
          <section className="card mt-8 p-5">
            <h2 className="mb-4 font-bold">Butiran sebut harga</h2>
            <JsonForm action={`/api/admin/quotations/${id}`} method="PATCH" extra={{ action: "meta" }} submit="Simpan" success="Disimpan" className="grid gap-3">
              <input name="title" defaultValue={q.title} className="field" />
              <div className="flex items-center gap-2 text-sm">Tempoh sah (hari) <input name="validityDays" type="number" defaultValue={q.validityDays} className="field w-24" /> <span className="text-mute">Tarikh: {dmy(q.issueDate)} → {dmy(q.validUntil)}</span></div>
              <textarea name="terms" defaultValue={q.terms ?? ""} rows={6} className="field text-sm" placeholder="Terma (satu baris satu terma)" />
              <textarea name="notes" defaultValue={q.notes ?? ""} rows={2} className="field text-sm" placeholder="Catatan" />
            </JsonForm>
          </section>
        </>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="card p-5 text-sm">
          <h2 className="mb-3 font-bold">Pelanggan</h2>
          {cust ? <><Link href={`/admin/customers/${cust.id}`} className="font-semibold underline">{cust.fullName}</Link><p>{cust.phone} · {cust.email}</p><p className="text-mute">{q.projectAddress}</p></> : <p className="text-mute">Pelanggan belum mengisi maklumat.</p>}
          <h2 className="mt-6 mb-3 font-bold">Input pelanggan</h2>
          <dl className="grid gap-1">
            {Object.entries(inputs).filter(([k, v]) => typeof v === "string" && v && !["lang", "categoryKey"].includes(k)).map(([k, v]) => <div key={k}><dt className="inline text-mute">{k}: </dt><dd className="inline whitespace-pre-line">{String(v)}</dd></div>)}
            {Array.isArray(inputs.answers) && (inputs.answers as { question: string; answer: string }[]).map((a, i) => <div key={i}><dt className="text-mute">S: {a.question}</dt><dd>J: {a.answer}</dd></div>)}
          </dl>
        </section>
        <section className="card p-5 text-sm">
          <h2 className="mb-3 font-bold">Analisis AI</h2>
          <p className="text-xs text-mute">Model: {String(inputs.aiModel ?? "-")} · status: {est.pricing_status ?? "-"}</p>
          <p className="mt-2">{est.project_summary}</p>
          {est.risks?.length ? <><p className="mt-3 font-semibold">Risiko</p><ul className="list-disc pl-5">{est.risks.map((r, i) => <li key={i}>{r}</li>)}</ul></> : null}
          {est.missing_information?.length ? <><p className="mt-3 font-semibold">Maklumat kurang</p><ul className="list-disc pl-5">{est.missing_information.map((m, i) => <li key={i}>{m.question}</li>)}</ul></> : null}
          <div className="mt-6 flex items-center justify-between"><h2 className="font-bold">Fail</h2>{editable && <UploadForm action="/api/admin/documents" extra={{ quotationId: String(id) }} />}</div>
          <ul className="mt-2 flex flex-wrap gap-2">{docs.map((d) => <li key={d.id}><a className="chip" href={`/api/documents/${d.id}`} target="_blank" rel="noopener">{d.fileName}</a></li>)}</ul>
        </section>
      </div>
    </>
  );
}
