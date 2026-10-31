"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import type { PublicQuotation } from "@/lib/quotation/service";
import type { L } from "@/lib/catalog";
import { bytes } from "@/lib/format";
import { IconCheck, IconDoc, IconSpark, IconX, IconCamera } from "@/components/site/icons";
import { QuotationResult } from "./QuotationResult";

type Category = { key: string; name: L; works: L[] };
type Upload = { id: number; name: string; type: string; size: number };

const STEPS = {
  ms: ["Kategori", "Kerja", "Maklumat projek", "Analisis AI", "Pengiraan harga", "Anggaran awal", "Maklumat pelanggan", "Sebut harga"],
  en: ["Category", "Work", "Project info", "AI analysis", "Pricing", "Preliminary quote", "Your details", "Quotation"],
};

const T = {
  ms: {
    s1: "Langkah 1: Pilih kategori kerja",
    s2: "Langkah 2: Pilih kerja khusus",
    other: "Lain-lain (nyatakan)",
    otherPh: "Nyatakan kerja yang diperlukan",
    s3: "Langkah 3: Maklumat projek",
    s3lead: "Lebih terperinci maklumat anda, lebih tepat anggaran. Ukuran dalam kaki atau meter kedua-duanya diterima.",
    customerName: "Nama anda",
    location: "Lokasi projek (bandar / daerah)",
    locationPh: "cth: Taman Sri Lambak, Kluang",
    projectType: "Jenis projek",
    projectTypes: ["Kerja baharu", "Ubah suai / renovation", "Baik pulih / repair", "Penyelenggaraan berkala", "Tender / projek kerajaan"],
    buildingType: "Jenis bangunan / tapak",
    buildingTypes: ["Rumah teres", "Rumah berkembar (semi-D)", "Banglo", "Rumah kampung", "Kedai / rumah kedai", "Pejabat", "Kilang / gudang", "Bangunan kerajaan / sekolah", "Jalan / tapak terbuka", "Lain-lain"],
    measurements: "Ukuran",
    measurementsPh: "cth: Dapur 12 kaki x 10 kaki, tinggi siling 10 kaki",
    quantity: "Kuantiti",
    quantityPh: "cth: 3 bilik, 6 titik lampu, 2 pintu",
    material: "Pilihan bahan",
    materialPh: "cth: jubin homogeneous 2x2, cat Nippon, metal deck 0.48mm",
    specs: "Spesifikasi teknikal",
    specsPh: "Lukisan, BQ atau keperluan khusus (jika ada)",
    site: "Keadaan tapak",
    sitePh: "cth: akses lori terhad, dinding sedia ada retak, tanah lembut",
    timeline: "Jangka masa projek",
    timelines: ["Segera (dalam 1 bulan)", "1 hingga 3 bulan", "3 hingga 6 bulan", "Lebih 6 bulan", "Belum pasti"],
    remarks: "Catatan tambahan",
    remarksPh: "Terangkan kerja yang anda mahu",
    uploads: "Gambar tapak & lukisan",
    uploadsLead: "PDF, JPG atau PNG. Maksimum 10 fail, 10 MB setiap satu. Data lokasi (GPS) dalam gambar JPG akan dibuang.",
    choose: "Pilih fail",
    uploading: "Memuat naik…",
    select: "Pilih",
    back: "Kembali",
    next: "Seterusnya",
    analyse: "Analisis dengan AI",
    privacy: "Nama dan maklumat hubungan anda tidak dihantar kepada penyedia AI. Hanya butiran teknikal projek dianalisis.",
    working: ["Membaca maklumat projek", "Mengenal pasti item kerja & unit", "Menganggar kuantiti", "Mengambil kadar dari pangkalan harga HUZA MAJU", "Mengira jumlah"],
    waitNote: "Analisis biasanya mengambil masa 20 hingga 90 saat.",
    unavailable: "Analisis automatik tidak tersedia sekarang. Permintaan anda telah direkodkan dan QS kami akan menyediakan anggaran secara manual.",
    invalidFile: "Hanya PDF, JPG atau PNG sehingga 10 MB.",
    required: "Sila isi lokasi projek dan sekurang-kurangnya ukuran, kuantiti atau catatan.",
  },
  en: {
    s1: "Step 1: Choose a work category",
    s2: "Step 2: Choose the specific work",
    other: "Other (please specify)",
    otherPh: "Describe the work you need",
    s3: "Step 3: Project information",
    s3lead: "The more detail you give, the sharper the estimate. Feet or metres are both fine.",
    customerName: "Your name",
    location: "Project location (town / district)",
    locationPh: "e.g. Taman Sri Lambak, Kluang",
    projectType: "Project type",
    projectTypes: ["New works", "Renovation", "Repair", "Scheduled maintenance", "Tender / government project"],
    buildingType: "Building / site type",
    buildingTypes: ["Terrace house", "Semi-detached house", "Bungalow", "Village house", "Shop / shophouse", "Office", "Factory / warehouse", "Government building / school", "Road / open site", "Other"],
    measurements: "Measurements",
    measurementsPh: "e.g. Kitchen 12 ft x 10 ft, ceiling height 10 ft",
    quantity: "Quantity",
    quantityPh: "e.g. 3 rooms, 6 light points, 2 doors",
    material: "Material preference",
    materialPh: "e.g. 2x2 homogeneous tiles, Nippon paint, 0.48mm metal deck",
    specs: "Technical specifications",
    specsPh: "Drawings, BQ or special requirements (if any)",
    site: "Site conditions",
    sitePh: "e.g. limited lorry access, existing wall cracks, soft ground",
    timeline: "Project timeline",
    timelines: ["Urgent (within 1 month)", "1 to 3 months", "3 to 6 months", "More than 6 months", "Not sure yet"],
    remarks: "Additional remarks",
    remarksPh: "Describe the work you want",
    uploads: "Site photos & drawings",
    uploadsLead: "PDF, JPG or PNG. Up to 10 files, 10 MB each. Location (GPS) data in JPG photos is removed.",
    choose: "Choose files",
    uploading: "Uploading…",
    select: "Select",
    back: "Back",
    next: "Next",
    analyse: "Analyse with AI",
    privacy: "Your name and contact details are not sent to the AI provider. Only the technical project details are analysed.",
    working: ["Reading your project details", "Identifying work items & units", "Estimating quantities", "Retrieving rates from the HUZA MAJU pricing database", "Calculating totals"],
    waitNote: "Analysis usually takes 20 to 90 seconds.",
    unavailable: "Automatic analysis is unavailable right now. Your request has been recorded and our QS will prepare the estimate manually.",
    invalidFile: "Only PDF, JPG or PNG up to 10 MB.",
    required: "Please fill in the project location and at least the measurements, quantity or remarks.",
  },
};

declare global {
  interface Window {
    turnstile?: { render: (el: HTMLElement, opts: { sitekey: string; callback: (t: string) => void }) => void };
  }
}

export function QuotationWizard({ lang, categories, services, initialCategory, turnstileSiteKey }: { lang: "ms" | "en"; categories: Category[]; services: Record<string, string[]>; initialCategory?: string; turnstileSiteKey?: string }) {
  const t = T[lang];
  const init = categories.find((c) => c.key === initialCategory);
  const [step, setStep] = useState(init ? 2 : 1);
  const [cat, setCat] = useState<Category | null>(init ?? null);
  const [work, setWork] = useState("");
  const [otherWork, setOtherWork] = useState("");
  const [form, setForm] = useState<Record<string, string>>({});
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PublicQuotation | null>(null);
  const [unavailable, setUnavailable] = useState(false);
  const [tick, setTick] = useState(0);
  const [captcha, setCaptcha] = useState<string | null>(null);
  const captchaRef = useRef<HTMLDivElement>(null);
  const topRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (step !== 4) return;
    const id = setInterval(() => setTick((x) => Math.min(x + 1, T.ms.working.length - 1)), 6000);
    return () => clearInterval(id);
  }, [step]);

  useEffect(() => {
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [step]);

  const renderCaptcha = () => {
    if (turnstileSiteKey && captchaRef.current && window.turnstile && !captchaRef.current.childElementCount)
      window.turnstile.render(captchaRef.current, { sitekey: turnstileSiteKey, callback: setCaptcha });
  };
  useEffect(() => {
    if (step === 3) renderCaptcha();
  });

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setForm({ ...form, [k]: e.target.value });

  async function addFiles(files: FileList | null) {
    if (!files) return;
    setError(null);
    setUploading(true);
    for (const f of Array.from(files)) {
      if (uploads.length >= 10) break;
      if (!["image/jpeg", "image/png", "application/pdf"].includes(f.type) || f.size > 10 * 1024 * 1024) {
        setError(`${f.name}: ${t.invalidFile}`);
        continue;
      }
      const fd = new FormData();
      fd.append("file", f);
      const r = await fetch("/api/quotation/uploads", { method: "POST", body: fd });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) setError(`${f.name}: ${j.error ?? t.invalidFile}`);
      else setUploads((u) => [...u, j]);
    }
    setUploading(false);
  }

  async function removeUpload(id: number) {
    await fetch(`/api/quotation/uploads/${id}`, { method: "DELETE" });
    setUploads((u) => u.filter((x) => x.id !== id));
  }

  async function analyse() {
    if (!form.location?.trim() || !(form.measurements?.trim() || form.quantity?.trim() || form.remarks?.trim())) {
      setError(t.required);
      return;
    }
    setError(null);
    setTick(0);
    setStep(4);
    try {
      const r = await fetch("/api/quotation/analyze", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          lang,
          categoryKey: cat!.key,
          work: work === "__other" ? otherWork : work,
          ...form,
          uploadIds: uploads.map((u) => u.id),
          turnstileToken: captcha ?? undefined,
        }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || "Ralat");
      setUnavailable(!!j.aiUnavailable);
      setTick(T.ms.working.length - 1);
      setResult(j.quotation);
      setStep(6);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ralat");
      setStep(3);
    }
  }

  const progressStep = result ? (result.hasContact ? 8 : 7) : step;

  return (
    <div ref={topRef} className="scroll-mt-28">
      {turnstileSiteKey && <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" strategy="afterInteractive" onLoad={renderCaptcha} />}
      <ol className="mb-8 grid grid-cols-4 gap-2 md:grid-cols-8" aria-label="Progress">
        {STEPS[lang].map((s, i) => {
          const n = i + 1;
          const done = n < progressStep;
          const active = n === progressStep || (step === 4 && n === 5 && tick >= 3);
          return (
            <li key={s} className="flex flex-col gap-1.5">
              <span className={`h-1.5 rounded-full ${done ? "bg-gold" : active ? "bg-ink" : "bg-line"}`} />
              <span className={`text-[11px] leading-tight font-semibold ${active ? "text-ink" : "text-mute"}`}>
                {n}. {s}
              </span>
            </li>
          );
        })}
      </ol>

      {error && step !== 4 && (
        <p role="alert" className="mb-6 rounded-lg bg-bad/10 p-3 text-sm font-semibold text-bad">
          {error}
        </p>
      )}

      {step === 1 && (
        <section>
          <h2 className="text-2xl font-extrabold tracking-tight">{t.s1}</h2>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {categories.map((c) => (
              <button
                key={c.key}
                type="button"
                onClick={() => {
                  setCat(c);
                  setWork("");
                  setStep(2);
                }}
                className={`card p-4 text-left font-bold transition hover:-translate-y-0.5 hover:border-ink ${cat?.key === c.key ? "border-ink ring-2 ring-gold" : ""}`}
              >
                {c.name[lang]}
              </button>
            ))}
          </div>
        </section>
      )}

      {step === 2 && cat && (
        <section>
          <h2 className="text-2xl font-extrabold tracking-tight">{t.s2}</h2>
          <p className="mt-1 text-mute">{cat.name[lang]}</p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {[...cat.works.map((w) => w[lang]), ...(services[cat.key] ?? []).filter((s) => !cat.works.some((w) => w[lang] === s))].map((w) => (
              <button key={w} type="button" onClick={() => setWork(w)} className={`card flex items-center justify-between gap-3 p-4 text-left font-semibold ${work === w ? "border-ink ring-2 ring-gold" : ""}`}>
                {w}
                {work === w && <IconCheck width={18} height={18} className="text-gold-strong" />}
              </button>
            ))}
            <button type="button" onClick={() => setWork("__other")} className={`card p-4 text-left font-semibold ${work === "__other" ? "border-ink ring-2 ring-gold" : ""}`}>
              {t.other}
            </button>
          </div>
          {work === "__other" && <input className="field mt-4" placeholder={t.otherPh} maxLength={200} value={otherWork} onChange={(e) => setOtherWork(e.target.value)} />}
          <div className="mt-8 flex gap-3">
            <button type="button" className="btn btn-line" onClick={() => setStep(1)}>
              {t.back}
            </button>
            <button type="button" className="btn btn-dark" disabled={!work || (work === "__other" && otherWork.trim().length < 2)} onClick={() => setStep(3)}>
              {t.next}
            </button>
          </div>
        </section>
      )}

      {step === 3 && cat && (
        <section>
          <h2 className="text-2xl font-extrabold tracking-tight">{t.s3}</h2>
          <p className="mt-1 text-mute">
            {cat.name[lang]} · {work === "__other" ? otherWork : work}
          </p>
          <p className="mt-2 max-w-2xl text-sm text-mute">{t.s3lead}</p>
          <div className="card mt-6 grid gap-4 p-6 md:grid-cols-2">
            <In id="customerName" label={t.customerName} value={form.customerName} onChange={set("customerName")} auto="name" />
            <In id="location" label={`${t.location} *`} value={form.location} onChange={set("location")} placeholder={t.locationPh} required />
            <Sel id="projectType" label={t.projectType} value={form.projectType} onChange={set("projectType")} options={t.projectTypes} placeholder={t.select} />
            <Sel id="buildingType" label={t.buildingType} value={form.buildingType} onChange={set("buildingType")} options={t.buildingTypes} placeholder={t.select} />
            <Area id="measurements" label={t.measurements} value={form.measurements} onChange={set("measurements")} placeholder={t.measurementsPh} />
            <Area id="quantity" label={t.quantity} value={form.quantity} onChange={set("quantity")} placeholder={t.quantityPh} />
            <Area id="materialPreference" label={t.material} value={form.materialPreference} onChange={set("materialPreference")} placeholder={t.materialPh} />
            <Area id="specifications" label={t.specs} value={form.specifications} onChange={set("specifications")} placeholder={t.specsPh} />
            <Area id="siteConditions" label={t.site} value={form.siteConditions} onChange={set("siteConditions")} placeholder={t.sitePh} />
            <Sel id="timeline" label={t.timeline} value={form.timeline} onChange={set("timeline")} options={t.timelines} placeholder={t.select} />
            <div className="md:col-span-2">
              <Area id="remarks" label={t.remarks} value={form.remarks} onChange={set("remarks")} placeholder={t.remarksPh} rows={4} />
            </div>
            <div className="md:col-span-2">
              <p className="label">{t.uploads}</p>
              <p className="text-xs text-mute">{t.uploadsLead}</p>
              <label className="mt-3 flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-line p-6 text-center hover:border-gold">
                <IconCamera width={24} height={24} className="text-mute" />
                <span className="font-semibold">{uploading ? t.uploading : t.choose}</span>
                <input type="file" multiple accept="application/pdf,image/jpeg,image/png" className="sr-only" disabled={uploading || uploads.length >= 10} onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }} />
              </label>
              {uploads.length > 0 && (
                <ul className="mt-3 grid gap-2">
                  {uploads.map((u) => (
                    <li key={u.id} className="flex items-center justify-between gap-3 rounded-lg bg-sand px-3 py-2 text-sm">
                      <span className="inline-flex min-w-0 items-center gap-2">
                        <IconDoc width={16} height={16} className="shrink-0" /> <span className="truncate">{u.name}</span> <span className="text-mute">{bytes(u.size)}</span>
                      </span>
                      <button type="button" onClick={() => removeUpload(u.id)} aria-label="Remove" className="text-mute hover:text-bad">
                        <IconX width={16} height={16} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {turnstileSiteKey && <div ref={captchaRef} className="md:col-span-2" />}
          </div>
          <p className="mt-4 text-xs text-mute">{t.privacy}</p>
          <div className="mt-6 flex gap-3">
            <button type="button" className="btn btn-line" onClick={() => setStep(2)}>
              {t.back}
            </button>
            <button type="button" className="btn btn-gold" onClick={analyse} disabled={uploading || (!!turnstileSiteKey && !captcha)}>
              <IconSpark width={18} height={18} /> {t.analyse}
            </button>
          </div>
        </section>
      )}

      {step === 4 && (
        <section className="card mx-auto max-w-xl p-8" aria-live="polite">
          <div className="flex items-center gap-3">
            <span className="h-3 w-3 animate-pulse rounded-full bg-gold" />
            <h2 className="text-xl font-extrabold">HUZA MAJU AI Estimator</h2>
          </div>
          <ul className="mt-6 grid gap-3">
            {t.working.map((w, i) => (
              <li key={w} className={`flex items-center gap-3 text-sm ${i <= tick ? "text-ink" : "text-mute/60"}`}>
                {i < tick ? <IconCheck width={16} height={16} className="text-ok" /> : <span className={`h-4 w-4 rounded-full border-2 ${i === tick ? "animate-spin border-gold border-t-transparent" : "border-line"}`} />}
                {w}
              </li>
            ))}
          </ul>
          <p className="mt-6 text-xs text-mute">{t.waitNote}</p>
        </section>
      )}

      {step >= 6 && result && (
        <section>
          {unavailable && <p className="mb-6 rounded-lg bg-amber/15 p-4 text-sm font-semibold">{t.unavailable}</p>}
          <QuotationResult initial={result} />
        </section>
      )}
    </div>
  );
}

type FieldProps = { id: string; label: string; value?: string; onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void; placeholder?: string };

function In({ id, label, value, onChange, placeholder, required, auto }: FieldProps & { required?: boolean; auto?: string }) {
  return (
    <div>
      <label className="label" htmlFor={`w-${id}`}>
        {label}
      </label>
      <input id={`w-${id}`} className="field" value={value ?? ""} onChange={onChange} placeholder={placeholder} required={required} maxLength={200} autoComplete={auto} />
    </div>
  );
}

function Area({ id, label, value, onChange, placeholder, rows = 2 }: FieldProps & { rows?: number }) {
  return (
    <div>
      <label className="label" htmlFor={`w-${id}`}>
        {label}
      </label>
      <textarea id={`w-${id}`} className="field" rows={rows} value={value ?? ""} onChange={onChange} placeholder={placeholder} maxLength={3000} />
    </div>
  );
}

function Sel({ id, label, value, onChange, options, placeholder }: FieldProps & { options: string[] }) {
  return (
    <div>
      <label className="label" htmlFor={`w-${id}`}>
        {label}
      </label>
      <select id={`w-${id}`} className="field" value={value ?? ""} onChange={onChange}>
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
    </div>
  );
}
