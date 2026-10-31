"use client";

import Link from "next/link";
import { useState } from "react";
import { href, type Lang } from "@/lib/i18n";

export function PartnerRegisterForm({ lang }: { lang: Lang }) {
  const ms = lang === "ms";
  const [state, setState] = useState<"idle" | "sending" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState("sending");
    setError(null);
    const fd = new FormData(e.currentTarget);
    const r = await fetch("/api/partners/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...Object.fromEntries(fd.entries()), agree: fd.get("agree") === "on" }),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) {
      setError(j.error || "Ralat");
      setState("error");
      return;
    }
    window.location.href = "/partner";
  }

  return (
    <form onSubmit={submit} className="card grid gap-4 p-6 md:grid-cols-2 md:p-8">
      <fieldset className="md:col-span-2">
        <legend className="label">{ms ? "Kategori" : "Category"}</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            ["referral", ms ? "Rakan Rujukan" : "Referral Partner", ms ? "Perkenal pelanggan sekali-sekala" : "Introduce customers occasionally"],
            ["agent", ms ? "Ejen Jualan Bebas" : "Freelance Sales Agent", ms ? "Promosi aktif & urus pelanggan" : "Actively promote & manage customers"],
          ].map(([v, k, s], i) => (
            <label key={v} className="flex cursor-pointer gap-3 rounded-lg border border-line p-4 has-[:checked]:border-ink has-[:checked]:bg-sand">
              <input type="radio" name="type" value={v} defaultChecked={i === 0} className="mt-1 accent-[var(--color-ink)]" />
              <span><span className="block font-bold">{k}</span><span className="text-sm text-mute">{s}</span></span>
            </label>
          ))}
        </div>
      </fieldset>
      <div><label className="label" htmlFor="p-name">{ms ? "Nama penuh" : "Full name"}</label><input id="p-name" name="name" required maxLength={160} className="field" autoComplete="name" /></div>
      <div><label className="label" htmlFor="p-phone">{ms ? "Telefon / WhatsApp" : "Phone / WhatsApp"}</label><input id="p-phone" name="phone" required inputMode="tel" className="field" autoComplete="tel" /></div>
      <div><label className="label" htmlFor="p-email">{ms ? "E-mel (untuk log masuk)" : "Email (for login)"}</label><input id="p-email" name="email" type="email" required className="field" autoComplete="email" /></div>
      <div><label className="label" htmlFor="p-pw">{ms ? "Kata laluan (min 10 aksara, huruf + nombor)" : "Password (min 10 chars, letters + digits)"}</label><input id="p-pw" name="password" type="password" required minLength={10} className="field" autoComplete="new-password" /></div>
      <div><label className="label" htmlFor="p-area">{ms ? "Kawasan liputan" : "Coverage area"}</label><input id="p-area" name="area" maxLength={160} className="field" placeholder={ms ? "cth: Kluang, Batu Pahat" : "e.g. Kluang, Johor Bahru"} /></div>
      <div><label className="label" htmlFor="p-occ">{ms ? "Pekerjaan" : "Occupation"}</label><input id="p-occ" name="occupation" maxLength={160} className="field" /></div>
      <div className="md:col-span-2"><label className="label" htmlFor="p-exp">{ms ? "Pengalaman / rangkaian (pilihan)" : "Experience / network (optional)"}</label><textarea id="p-exp" name="experience" rows={3} maxLength={2000} className="field" /></div>
      <label className="flex items-start gap-3 text-sm text-mute md:col-span-2">
        <input type="checkbox" name="agree" required className="mt-1 h-4 w-4 accent-[var(--color-ink)]" />
        <span>{ms ? "Saya bersetuju dengan " : "I agree to the "}<Link href={href(lang, "/terms")} className="underline">{ms ? "Terma Perkhidmatan" : "Terms of Service"}</Link>{ms ? " (termasuk syarat program rakan niaga) dan " : " (including partner programme terms) and "}<Link href={href(lang, "/privacy")} className="underline">{ms ? "Notis Privasi" : "Privacy Notice"}</Link>.</span>
      </label>
      {error && <p role="alert" className="text-sm font-semibold text-bad md:col-span-2">{error}</p>}
      <div className="md:col-span-2"><button className="btn-dark" disabled={state === "sending"}>{state === "sending" ? (ms ? "Mendaftar…" : "Registering…") : ms ? "Daftar sebagai rakan" : "Register as partner"}</button></div>
    </form>
  );
}
