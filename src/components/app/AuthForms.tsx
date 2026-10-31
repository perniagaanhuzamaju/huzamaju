"use client";

import Link from "next/link";
import { useState } from "react";

async function post(url: string, body: unknown) {
  const r = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || "Ralat. Sila cuba lagi.");
  return j;
}

/** Only same-site relative paths are accepted as a post-login destination. */
const safeNext = (n?: string) => (n && /^\/(?![\/\\])/.test(n) ? n : null);

export function LoginForm({ next }: { next?: string }) {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setBusy(true);
    setError(null);
    try {
      const j = await post("/api/auth/login", { email: fd.get("email"), password: fd.get("password") });
      window.location.href = safeNext(next) ?? j.home;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ralat");
      setBusy(false);
    }
  }
  return (
    <form onSubmit={submit} className="grid gap-4">
      <div>
        <label className="label" htmlFor="l-email">E-mel</label>
        <input id="l-email" name="email" type="email" required autoComplete="email" className="field" />
      </div>
      <div>
        <label className="label" htmlFor="l-pw">Kata laluan</label>
        <input id="l-pw" name="password" type="password" required autoComplete="current-password" className="field" />
      </div>
      {error && <p role="alert" className="rounded-lg bg-bad/10 p-3 text-sm font-semibold text-bad">{error}</p>}
      <button className="btn btn-dark" disabled={busy}>{busy ? "Sedang log masuk…" : "Log masuk"}</button>
      <p className="text-center text-sm text-mute">
        Pelanggan baharu? <Link href="/register" className="font-semibold text-ink underline">Daftar akaun</Link>
        <br />
        Rakan niaga? <Link href="/partners/register" className="font-semibold text-ink underline">Daftar sebagai rakan niaga</Link>
      </p>
    </form>
  );
}

export function RegisterForm() {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    if (fd.get("password") !== fd.get("password2")) return setError("Kata laluan tidak sepadan");
    setBusy(true);
    setError(null);
    try {
      await post("/api/auth/register", {
        name: fd.get("name"),
        companyName: fd.get("companyName"),
        phone: fd.get("phone"),
        email: fd.get("email"),
        password: fd.get("password"),
        agree: fd.get("agree") === "on",
      });
      window.location.href = "/portal";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ralat");
      setBusy(false);
    }
  }
  return (
    <form onSubmit={submit} className="grid gap-4">
      <div>
        <label className="label" htmlFor="r-name">Nama penuh</label>
        <input id="r-name" name="name" required minLength={2} maxLength={160} autoComplete="name" className="field" />
      </div>
      <div>
        <label className="label" htmlFor="r-company">Nama syarikat (jika ada)</label>
        <input id="r-company" name="companyName" maxLength={200} autoComplete="organization" className="field" />
      </div>
      <div>
        <label className="label" htmlFor="r-phone">No. telefon / WhatsApp</label>
        <input id="r-phone" name="phone" required inputMode="tel" autoComplete="tel" placeholder="01X-XXX XXXX" className="field" />
      </div>
      <div>
        <label className="label" htmlFor="r-email">E-mel</label>
        <input id="r-email" name="email" type="email" required autoComplete="email" className="field" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="r-pw">Kata laluan</label>
          <input id="r-pw" name="password" type="password" required minLength={10} autoComplete="new-password" className="field" />
        </div>
        <div>
          <label className="label" htmlFor="r-pw2">Ulang kata laluan</label>
          <input id="r-pw2" name="password2" type="password" required minLength={10} autoComplete="new-password" className="field" />
        </div>
      </div>
      <p className="text-xs text-mute">Sekurang-kurangnya 10 aksara, termasuk huruf dan nombor.</p>
      <label className="flex items-start gap-2 text-sm">
        <input type="checkbox" name="agree" required className="mt-1" />
        <span>Saya bersetuju dengan <Link href="/terms" className="underline">Terma</Link> dan <Link href="/privacy" className="underline">Notis Privasi</Link>.</span>
      </label>
      {error && <p role="alert" className="rounded-lg bg-bad/10 p-3 text-sm font-semibold text-bad">{error}</p>}
      <button className="btn btn-gold" disabled={busy}>{busy ? "Mendaftar…" : "Daftar akaun"}</button>
      <p className="text-center text-sm text-mute">Sudah ada akaun? <Link href="/login" className="font-semibold text-ink underline">Log masuk</Link></p>
    </form>
  );
}
