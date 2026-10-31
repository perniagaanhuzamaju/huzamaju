"use client";

import { useState } from "react";
import Link from "next/link";
import type { PublicQuotation } from "@/lib/quotation/service";
import { UNIT_LABEL, type Unit } from "@/lib/pricing/units";
import { COMPANY, waLink } from "@/lib/company";
import { dmy, num, rm } from "@/lib/format";
import { href } from "@/lib/i18n";
import { IconDoc, IconMail, IconWhatsApp, IconCheck, IconPin, IconSpark } from "@/components/site/icons";

const W = {
  ms: {
    ref: "No. rujukan",
    issued: "Tarikh",
    valid: "Sah sehingga",
    status: { preliminary: "Anggaran awal", pending_qs: "Menunggu semakan QS", approved: "Diluluskan", sent: "Dihantar", accepted: "Diterima", rejected: "Ditolak", expired: "Tamat tempoh", cancelled: "Dibatalkan", draft: "Draf" } as Record<string, string>,
    summary: "Ringkasan skop",
    scope: "Skop kerja",
    table: ["Butiran kerja", "Unit", "Kuantiti", "Kadar", "Jumlah"],
    review: "Semakan QS",
    basis: "Asas kuantiti",
    subtotal: "Jumlah kecil",
    contingency: "Peruntukan luar jangka",
    minAdj: "Pelarasan caj minimum",
    sst: "SST",
    total: "Jumlah anggaran",
    range: "Julat indikatif",
    pending: (n: number) => `${n} item memerlukan semakan QS. Item ini belum dimasukkan dalam jumlah dan akan disahkan selepas pemeriksaan tapak.`,
    noItems: "Tiada item yang dapat dihargakan secara automatik. QS kami akan menyediakan anggaran selepas menyemak maklumat anda.",
    questionsTitle: "Soalan susulan untuk anggaran lebih tepat",
    questionsLead: "Jawab mana-mana soalan yang anda tahu, kemudian kemas kini anggaran.",
    refine: "Kemas kini anggaran",
    refining: "Menganalisis semula…",
    assumptions: "Andaian",
    materials: "Cadangan bahan",
    risks: "Risiko yang boleh mengubah kos",
    site: "Pemeriksaan tapak disyorkan sebelum harga dimuktamadkan.",
    contactTitle: "Langkah 7: Maklumat pelanggan",
    contactLead: "Isi maklumat anda untuk memuat turun PDF, menerima anggaran melalui e-mel dan meminta sebut harga rasmi.",
    name: "Nama penuh",
    company: "Nama syarikat (jika ada)",
    phone: "No. telefon / WhatsApp",
    email: "E-mel",
    address: "Alamat projek",
    desc: "Penerangan projek (pilihan)",
    consent: "Saya bersetuju data saya diproses mengikut Notis Privasi untuk tujuan sebut harga ini.",
    save: "Simpan & teruskan",
    saving: "Menyimpan…",
    outTitle: "Langkah 8: Sebut harga anda",
    pdf: "Muat turun PDF",
    emailMe: "E-mel kepada saya",
    emailed: "E-mel dihantar",
    share: "Kongsi melalui WhatsApp",
    waUs: "WhatsApp HUZA MAJU",
    formal: "Minta sebut harga rasmi",
    formalDone: "Permintaan sebut harga rasmi diterima",
    site_visit: "Minta lawatan tapak",
    siteDone: "Permintaan lawatan tapak diterima",
    preferred: "Tarikh pilihan (pilihan)",
    notes: "Catatan (pilihan)",
    send: "Hantar permintaan",
    cancel: "Batal",
    link: "Pautan anggaran ini",
    formalNote: "Sebut harga rasmi disediakan oleh QS kami dan hanya sah selepas diluluskan oleh wakil syarikat yang diberi kuasa.",
    terms: "Terma",
    aiNote: "Skop dan kuantiti dicadangkan oleh HUZA MAJU AI Estimator. Semua harga dikira oleh sistem daripada pangkalan harga syarikat.",
  },
  en: {
    ref: "Reference",
    issued: "Date",
    valid: "Valid until",
    status: { preliminary: "Preliminary estimate", pending_qs: "Pending QS review", approved: "Approved", sent: "Sent", accepted: "Accepted", rejected: "Rejected", expired: "Expired", cancelled: "Cancelled", draft: "Draft" } as Record<string, string>,
    summary: "Scope summary",
    scope: "Scope of work",
    table: ["Description", "Unit", "Qty", "Rate", "Amount"],
    review: "QS review",
    basis: "Quantity basis",
    subtotal: "Subtotal",
    contingency: "Contingency allowance",
    minAdj: "Minimum charge adjustment",
    sst: "SST",
    total: "Estimated total",
    range: "Indicative range",
    pending: (n: number) => `${n} item(s) need QS review. They are not yet included in the total and will be confirmed after a site inspection.`,
    noItems: "No items could be priced automatically. Our QS will prepare the estimate after reviewing your details.",
    questionsTitle: "Follow-up questions for a sharper estimate",
    questionsLead: "Answer any you know, then update the estimate.",
    refine: "Update estimate",
    refining: "Re-analysing…",
    assumptions: "Assumptions",
    materials: "Recommended materials",
    risks: "Risks that may change the cost",
    site: "A site inspection is recommended before the price is finalised.",
    contactTitle: "Step 7: Your details",
    contactLead: "Fill in your details to download the PDF, receive the estimate by email and request a formal quotation.",
    name: "Full name",
    company: "Company name (if any)",
    phone: "Phone / WhatsApp",
    email: "Email",
    address: "Project address",
    desc: "Project description (optional)",
    consent: "I agree that my data will be processed under the Privacy Notice for this quotation.",
    save: "Save & continue",
    saving: "Saving…",
    outTitle: "Step 8: Your quotation",
    pdf: "Download PDF",
    emailMe: "Email it to me",
    emailed: "Email sent",
    share: "Share on WhatsApp",
    waUs: "WhatsApp HUZA MAJU",
    formal: "Request formal quotation",
    formalDone: "Formal quotation request received",
    site_visit: "Request site inspection",
    siteDone: "Site inspection request received",
    preferred: "Preferred date (optional)",
    notes: "Notes (optional)",
    send: "Send request",
    cancel: "Cancel",
    link: "Link to this estimate",
    formalNote: "Formal quotations are prepared by our QS and are valid only once approved by an authorised company representative.",
    terms: "Terms",
    aiNote: "Scope and quantities are proposed by the HUZA MAJU AI Estimator. All prices are calculated by our system from the company's pricing database.",
  },
};

async function post(url: string, body?: unknown) {
  const r = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || "Ralat. Sila cuba lagi.");
  return j;
}

export function QuotationResult({ initial, showSteps = true }: { initial: PublicQuotation; showSteps?: boolean }) {
  const [q, setQ] = useState(initial);
  const lang = q.lang;
  const w = W[lang];
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [emailed, setEmailed] = useState(false);
  const [requestKind, setRequestKind] = useState<"formal" | "site_visit" | null>(null);
  const api = `/api/quotation/${q.token}`;
  const link = typeof window !== "undefined" ? `${window.location.origin}/q/${q.token}` : `/q/${q.token}`;
  const editable = ["preliminary", "pending_qs"].includes(q.status) && !q.formalRequestedAt && q.refinements < 2;
  const unit = (u: string) => UNIT_LABEL[u as Unit]?.[lang] ?? u;

  async function run(key: string, fn: () => Promise<void>) {
    setBusy(key);
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ralat");
    } finally {
      setBusy(null);
    }
  }

  const refine = () =>
    run("refine", async () => {
      const list = q.missingInformation.map((m, i) => ({ question: m.question, answer: (answers[i] ?? "").trim() })).filter((a) => a.answer);
      if (!list.length) throw new Error(lang === "ms" ? "Sila jawab sekurang-kurangnya satu soalan." : "Please answer at least one question.");
      const j = await post(`${api}/refine`, { answers: list });
      setQ(j.quotation);
      setAnswers({});
    });

  const saveContact = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    run("contact", async () => {
      const j = await post(`${api}/contact`, { ...Object.fromEntries(fd.entries()), consent: fd.get("consent") === "on" });
      setQ(j.quotation);
    });
  };

  const sendRequest = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    run("request", async () => {
      const j = await post(`${api}/request`, { kind: requestKind, preferredDate: fd.get("preferredDate"), notes: fd.get("notes") });
      setQ(j.quotation);
      setRequestKind(null);
    });
  };

  const shareText = `${lang === "ms" ? "Anggaran bajet awal" : "Preliminary budget estimate"} ${q.number} – ${q.title}: ${link}`;
  const statusTone = q.status === "pending_qs" ? "bg-amber/20 text-ink" : q.status === "expired" ? "bg-bad/10 text-bad" : "bg-ok/10 text-ok";

  return (
    <div className="grid gap-6">
      <div className="card overflow-hidden">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line p-6">
          <div>
            <p className="text-sm text-mute">{w.ref}</p>
            <p className="text-xl font-extrabold tracking-tight">{q.number}</p>
            <p className="mt-1 font-semibold">{q.title}</p>
            {q.location && (
              <p className="mt-1 inline-flex items-center gap-1 text-sm text-mute">
                <IconPin width={14} height={14} /> {q.location}
              </p>
            )}
          </div>
          <div className="text-right text-sm">
            <span className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${statusTone}`}>{w.status[q.status] ?? q.status}</span>
            <p className="mt-2 text-mute">
              {w.issued}: <b className="text-ink">{dmy(q.issueDate)}</b>
            </p>
            <p className="text-mute">
              {w.valid}: <b className="text-ink">{dmy(q.validUntil)}</b>
            </p>
          </div>
        </div>
        <div className="border-b border-gold/40 bg-gold/10 px-6 py-3 text-sm font-bold">{q.disclaimer}</div>

        {(q.summary || q.scope.length > 0) && (
          <div className="grid gap-6 border-b border-line p-6 md:grid-cols-2">
            {q.summary && (
              <div>
                <h3 className="font-bold">{w.summary}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-2">{q.summary}</p>
              </div>
            )}
            {q.scope.length > 0 && (
              <div>
                <h3 className="font-bold">{w.scope}</h3>
                <ol className="mt-2 grid list-decimal gap-1 pl-5 text-sm text-ink-2">
                  {q.scope.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        )}

        {q.items.length ? (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="table">
                <thead>
                  <tr>
                    <th className="w-10">#</th>
                    <th>{w.table[0]}</th>
                    <th>{w.table[1]}</th>
                    <th className="text-right">{w.table[2]}</th>
                    <th className="text-right">{w.table[3]}</th>
                    <th className="text-right">{w.table[4]}</th>
                  </tr>
                </thead>
                <tbody>
                  {q.items.map((it, i) => (
                    <tr key={i}>
                      <td className="text-mute">{i + 1}</td>
                      <td>
                        <p className="font-semibold">{it.description}</p>
                        {it.basis && <p className="mt-0.5 text-xs text-mute">{w.basis}: {it.basis}</p>}
                        {it.status === "needs_review" && it.reviewReason && <p className="mt-0.5 text-xs font-semibold text-gold-strong">{w.review}: {it.reviewReason}</p>}
                      </td>
                      <td className="whitespace-nowrap">{unit(it.unit)}</td>
                      <td className="text-right tabular-nums">{num(it.quantity)}</td>
                      {it.status === "priced" ? (
                        <>
                          <td className="text-right tabular-nums">{rm(it.rate)}</td>
                          <td className="text-right font-semibold tabular-nums">{rm(it.amount)}</td>
                        </>
                      ) : (
                        <td colSpan={2} className="text-right">
                          <span className="chip border-gold/50 bg-gold/10 text-gold-strong">{w.review}</span>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Mobile cards */}
            <ul className="divide-y divide-line md:hidden">
              {q.items.map((it, i) => (
                <li key={i} className="p-4">
                  <p className="font-semibold">
                    {i + 1}. {it.description}
                  </p>
                  <div className="mt-1 flex justify-between text-sm text-mute">
                    <span>
                      {num(it.quantity)} {unit(it.unit)} {it.status === "priced" && <>× {rm(it.rate)}</>}
                    </span>
                    {it.status === "priced" ? <b className="text-ink">{rm(it.amount)}</b> : <b className="text-gold-strong">{w.review}</b>}
                  </div>
                  {it.status === "needs_review" && it.reviewReason && <p className="mt-1 text-xs text-gold-strong">{it.reviewReason}</p>}
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="p-6 text-sm text-ink-2">{w.noItems}</p>
        )}

        <div className="grid gap-6 border-t border-line p-6 md:grid-cols-[1fr_340px]">
          <div className="grid content-start gap-3 text-sm">
            {q.pendingReviewCount > 0 && <p className="rounded-lg bg-amber/15 p-3 font-semibold">{w.pending(q.pendingReviewCount)}</p>}
            {q.requiresSiteInspection && <p className="text-ink-2">{w.site}</p>}
            <p className="inline-flex gap-2 text-mute">
              <IconSpark width={16} height={16} className="mt-0.5 shrink-0 text-gold" /> {w.aiNote}
            </p>
          </div>
          <dl className="grid gap-1.5 text-sm">
            <Row k={w.subtotal} v={rm(q.subtotal)} />
            {q.additional.map((a, i) => (
              <Row key={i} k={a.name} v={rm(a.amount)} />
            ))}
            {q.contingency > 0 && <Row k={w.contingency} v={rm(q.contingency)} />}
            {q.minimumChargeAdjustment > 0 && <Row k={w.minAdj} v={rm(q.minimumChargeAdjustment)} />}
            {q.sst > 0 && <Row k={w.sst} v={rm(q.sst)} />}
            <div className="mt-2 flex items-center justify-between rounded-lg bg-ink px-4 py-3 text-white">
              <dt className="font-bold">{w.total}</dt>
              <dd className="text-lg font-extrabold tabular-nums">{rm(q.grandTotal)}</dd>
            </div>
            {q.grandTotal > 0 && q.rangeLow != null && q.rangeHigh != null && (
              <p className="text-right text-xs text-mute">
                {w.range}: {rm(q.rangeLow)} – {rm(q.rangeHigh)}
              </p>
            )}
          </dl>
        </div>
      </div>

      {editable && q.missingInformation.length > 0 && (
        <div className="card p-6">
          <h3 className="text-lg font-bold">{w.questionsTitle}</h3>
          <p className="mt-1 text-sm text-mute">{w.questionsLead}</p>
          <div className="mt-4 grid gap-4">
            {q.missingInformation.map((m, i) => (
              <div key={i}>
                <label className="label" htmlFor={`fq-${i}`}>
                  {m.question}
                </label>
                <input id={`fq-${i}`} className="field" maxLength={1000} value={answers[i] ?? ""} onChange={(e) => setAnswers({ ...answers, [i]: e.target.value })} />
                <p className="mt-1 text-xs text-mute">{m.reason}</p>
              </div>
            ))}
          </div>
          <button type="button" onClick={refine} disabled={!!busy} className="btn btn-dark mt-5">
            {busy === "refine" ? w.refining : w.refine}
          </button>
        </div>
      )}

      {(q.assumptions.length > 0 || q.recommendedMaterials.length > 0 || q.risks.length > 0) && (
        <div className="card grid gap-6 p-6 md:grid-cols-3">
          <ListBlock title={w.assumptions} items={q.assumptions} />
          <ListBlock title={w.materials} items={q.recommendedMaterials} />
          <ListBlock title={w.risks} items={q.risks} />
        </div>
      )}

      {error && (
        <p role="alert" className="rounded-lg bg-bad/10 p-3 text-sm font-semibold text-bad">
          {error}
        </p>
      )}

      {!q.hasContact ? (
        <form onSubmit={saveContact} className="card grid gap-4 p-6 md:grid-cols-2">
          <div className="md:col-span-2">
            {showSteps && <h3 className="text-lg font-bold">{w.contactTitle}</h3>}
            <p className="mt-1 text-sm text-mute">{w.contactLead}</p>
          </div>
          <Field id="c-name" name="fullName" label={w.name} required auto="name" />
          <Field id="c-company" name="companyName" label={w.company} auto="organization" />
          <Field id="c-phone" name="phone" label={w.phone} required auto="tel" placeholder="01X-XXX XXXX" />
          <Field id="c-email" name="email" label={w.email} type="email" auto="email" />
          <div className="md:col-span-2">
            <Field id="c-address" name="projectAddress" label={w.address} auto="street-address" />
          </div>
          <div className="md:col-span-2">
            <label className="label" htmlFor="c-desc">
              {w.desc}
            </label>
            <textarea id="c-desc" name="projectDescription" rows={3} maxLength={3000} className="field" />
          </div>
          <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
          <label className="flex items-start gap-2 text-sm md:col-span-2">
            <input type="checkbox" name="consent" required className="mt-1" />
            <span>
              {w.consent}{" "}
              <Link href={href(lang, "/privacy")} className="underline">
                {lang === "ms" ? "Notis Privasi" : "Privacy Notice"}
              </Link>
            </span>
          </label>
          <div className="md:col-span-2">
            <button className="btn btn-gold" disabled={!!busy}>
              {busy === "contact" ? w.saving : w.save}
            </button>
          </div>
        </form>
      ) : (
        <div className="card p-6">
          {showSteps && <h3 className="text-lg font-bold">{w.outTitle}</h3>}
          <div className="mt-4 flex flex-wrap gap-3">
            <a href={`${api}/pdf`} target="_blank" rel="noopener" className="btn btn-dark">
              <IconDoc width={18} height={18} /> {w.pdf}
            </a>
            <button type="button" className="btn btn-line" disabled={!!busy || emailed} onClick={() => run("email", async () => { await post(`${api}/email`); setEmailed(true); })}>
              <IconMail width={18} height={18} /> {emailed ? w.emailed : busy === "email" ? "…" : w.emailMe}
            </button>
            <a href={`https://wa.me/?text=${encodeURIComponent(shareText)}`} target="_blank" rel="noopener" className="btn btn-line">
              <IconWhatsApp width={18} height={18} /> {w.share}
            </a>
            <a href={waLink(shareText)} target="_blank" rel="noopener" className="btn btn-wa">
              <IconWhatsApp width={18} height={18} /> {w.waUs}
            </a>
          </div>

          <div className="mt-6 grid gap-3 border-t border-line pt-6 sm:grid-cols-2">
            {q.formalRequestedAt ? (
              <Done text={w.formalDone} />
            ) : (
              <button type="button" className="btn btn-gold" onClick={() => setRequestKind("formal")} disabled={q.isFormal}>
                {w.formal}
              </button>
            )}
            {q.siteVisitRequestedAt ? (
              <Done text={w.siteDone} />
            ) : (
              <button type="button" className="btn btn-line" onClick={() => setRequestKind("site_visit")}>
                {w.site_visit}
              </button>
            )}
          </div>
          {requestKind && (
            <form onSubmit={sendRequest} className="mt-4 grid gap-3 rounded-xl bg-sand p-4">
              <p className="font-bold">{requestKind === "formal" ? w.formal : w.site_visit}</p>
              <Field id="r-date" name="preferredDate" label={w.preferred} type={requestKind === "site_visit" ? "date" : "text"} />
              <div>
                <label className="label" htmlFor="r-notes">
                  {w.notes}
                </label>
                <textarea id="r-notes" name="notes" rows={2} maxLength={1000} className="field" />
              </div>
              <div className="flex gap-2">
                <button className="btn btn-dark btn-sm" disabled={!!busy}>
                  {busy === "request" ? "…" : w.send}
                </button>
                <button type="button" className="btn btn-line btn-sm" onClick={() => setRequestKind(null)}>
                  {w.cancel}
                </button>
              </div>
            </form>
          )}
          <p className="mt-4 text-xs text-mute">{w.formalNote}</p>
          <p className="mt-4 text-sm">
            {w.link}:{" "}
            <a href={`/q/${q.token}`} className="break-all font-semibold underline">
              {link}
            </a>
          </p>
          <p className="mt-1 text-xs text-mute">
            {COMPANY.name} · {COMPANY.phoneDisplay} · {COMPANY.email}
          </p>
        </div>
      )}

      {q.terms.length > 0 && (
        <details className="card p-6 text-sm">
          <summary className="cursor-pointer font-bold">{w.terms}</summary>
          <ol className="mt-3 grid list-decimal gap-1.5 pl-5 text-ink-2">
            {q.terms.map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ol>
        </details>
      )}
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-mute">{k}</dt>
      <dd className="font-semibold tabular-nums">{v}</dd>
    </div>
  );
}

function ListBlock({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return <div />;
  return (
    <div>
      <h3 className="font-bold">{title}</h3>
      <ul className="mt-2 grid gap-1 text-sm text-ink-2">
        {items.map((s, i) => (
          <li key={i} className="flex gap-2">
            <IconCheck width={14} height={14} className="mt-1 shrink-0 text-gold" /> {s}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Done({ text }: { text: string }) {
  return (
    <p className="inline-flex items-center gap-2 rounded-lg bg-ok/10 px-4 py-3 text-sm font-bold text-ok">
      <IconCheck width={16} height={16} /> {text}
    </p>
  );
}

function Field({ id, name, label, type = "text", required, auto, placeholder }: { id: string; name: string; label: string; type?: string; required?: boolean; auto?: string; placeholder?: string }) {
  return (
    <div>
      <label className="label" htmlFor={id}>
        {label}
      </label>
      <input id={id} name={name} type={type} required={required} maxLength={500} autoComplete={auto} placeholder={placeholder} className="field" />
    </div>
  );
}
