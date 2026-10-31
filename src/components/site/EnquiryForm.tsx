"use client";

import Link from "next/link";
import { useState } from "react";
import { href, t, type Lang } from "@/lib/i18n";

type Props = { lang: Lang; kind?: "general" | "corporate" | "site_visit"; service?: string; services?: { slug: string; title: string }[]; compact?: boolean };

export function EnquiryForm({ lang, kind = "general", service, services, compact }: Props) {
  const d = t(lang);
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState("sending");
    setError(null);
    const fd = new FormData(e.currentTarget);
    const body = Object.fromEntries(fd.entries());
    try {
      const r = await fetch("/api/enquiries", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...body, kind, consent: fd.get("consent") === "on", landingPage: window.location.pathname }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || "Ralat");
      setState("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ralat");
      setState("error");
    }
  }

  if (state === "done")
    return (
      <div className="card p-8 text-center" role="status">
        <p className="text-lg font-bold">{d.labels.sent}</p>
        <p className="mt-2 text-mute">{lang === "ms" ? "Kami akan hubungi anda melalui telefon atau WhatsApp." : "We will contact you by phone or WhatsApp."}</p>
      </div>
    );

  return (
    <form onSubmit={submit} className={`card grid gap-4 p-6 md:p-8 ${compact ? "" : "md:grid-cols-2"}`}>
      <div>
        <label className="label" htmlFor="eq-name">{d.labels.name}</label>
        <input id="eq-name" name="name" required maxLength={160} className="field" autoComplete="name" />
      </div>
      <div>
        <label className="label" htmlFor="eq-company">{d.labels.company}</label>
        <input id="eq-company" name="companyName" maxLength={200} className="field" autoComplete="organization" />
      </div>
      <div>
        <label className="label" htmlFor="eq-phone">{d.labels.phone}</label>
        <input id="eq-phone" name="phone" required inputMode="tel" maxLength={30} className="field" autoComplete="tel" placeholder="01X-XXX XXXX" />
      </div>
      <div>
        <label className="label" htmlFor="eq-email">{d.labels.email}</label>
        <input id="eq-email" name="email" type="email" maxLength={200} className="field" autoComplete="email" />
      </div>
      {services ? (
        <div className={compact ? "" : "md:col-span-2"}>
          <label className="label" htmlFor="eq-service">{d.labels.service}</label>
          <select id="eq-service" name="serviceSlug" className="field" defaultValue={service ?? ""}>
            <option value="">{lang === "ms" ? "Pilih (pilihan)" : "Select (optional)"}</option>
            {services.map((s) => (
              <option key={s.slug} value={s.slug}>{s.title}</option>
            ))}
          </select>
        </div>
      ) : (
        <input type="hidden" name="serviceSlug" value={service ?? ""} />
      )}
      <div className={compact ? "" : "md:col-span-2"}>
        <label className="label" htmlFor="eq-location">{d.labels.location}</label>
        <input id="eq-location" name="location" maxLength={200} className="field" placeholder={lang === "ms" ? "cth: Taman Sri Kluang, Kluang" : "e.g. Kluang, Johor"} />
      </div>
      <div className={compact ? "" : "md:col-span-2"}>
        <label className="label" htmlFor="eq-message">{d.labels.message}</label>
        <textarea id="eq-message" name="message" required minLength={10} maxLength={4000} rows={4} className="field" />
      </div>
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
      <label className={`flex items-start gap-3 text-sm text-mute ${compact ? "" : "md:col-span-2"}`}>
        <input type="checkbox" name="consent" required className="mt-1 h-4 w-4 accent-[var(--color-ink)]" />
        <span>
          {d.labels.consent}{" "}
          <Link href={href(lang, "/privacy")} className="underline">{d.labels.privacy}</Link>
        </span>
      </label>
      {error && <p className="text-sm font-semibold text-bad md:col-span-2" role="alert">{error}</p>}
      <div className={compact ? "" : "md:col-span-2"}>
        <button className="btn-dark w-full md:w-auto" disabled={state === "sending"}>
          {state === "sending" ? d.labels.sending : d.labels.send}
        </button>
      </div>
    </form>
  );
}
