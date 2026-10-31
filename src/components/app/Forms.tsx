"use client";

import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";

type Props = {
  action: string;
  method?: "POST" | "PATCH" | "PUT" | "DELETE";
  children: ReactNode;
  submit?: string;
  success?: string;
  className?: string;
  reset?: boolean;
  confirm?: string;
  extra?: Record<string, unknown>;
  buttonClass?: string;
  redirectTo?: string;
};

/** Sends a form as JSON and refreshes the server-rendered page. Checkboxes become booleans. */
export function JsonForm({ action, method = "POST", children, submit = "Simpan", success, className = "", reset, confirm, extra, buttonClass = "btn btn-dark btn-sm", redirectTo }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (confirm && !window.confirm(confirm)) return;
    const form = e.currentTarget;
    const body: Record<string, unknown> = { ...extra };
    for (const el of Array.from(form.elements) as HTMLInputElement[]) {
      if (!el.name || el.disabled) continue;
      if (el.type === "checkbox") body[el.name] = el.checked;
      else if (el.type === "radio") { if (el.checked) body[el.name] = el.value; }
      else body[el.name] = el.value;
    }
    setBusy(true);
    setMsg(null);
    try {
      const r = await fetch(action, { method, headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || "Ralat");
      if (reset) form.reset();
      setMsg(success ? { ok: true, text: success } : null);
      if (redirectTo) router.push(redirectTo.replace(":id", String(j.id ?? "")));
      else router.refresh();
    } catch (err) {
      setMsg({ ok: false, text: err instanceof Error ? err.message : "Ralat" });
    } finally {
      setBusy(false);
    }
  }
  return (
    <form onSubmit={onSubmit} className={className}>
      {children}
      <div className="flex flex-wrap items-center gap-3">
        <button className={buttonClass} disabled={busy}>{busy ? "…" : submit}</button>
        {msg && <span role={msg.ok ? "status" : "alert"} className={`text-sm font-semibold ${msg.ok ? "text-ok" : "text-bad"}`}>{msg.text}</span>}
      </div>
    </form>
  );
}

/** One-click action button (approve, delete, …) posting a fixed JSON body. */
export function ActionButton({ action, method = "POST", body, label, className = "btn btn-line btn-sm", confirm }: { action: string; method?: string; body?: unknown; label: string; className?: string; confirm?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  return (
    <span className="inline-flex flex-col">
      <button
        type="button"
        className={className}
        disabled={busy}
        onClick={async () => {
          if (confirm && !window.confirm(confirm)) return;
          setBusy(true);
          setErr(null);
          const r = await fetch(action, { method, headers: { "content-type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
          const j = await r.json().catch(() => ({}));
          setBusy(false);
          if (!r.ok) setErr(j.error || "Ralat");
          else router.refresh();
        }}
      >
        {busy ? "…" : label}
      </button>
      {err && <span className="mt-1 text-xs font-semibold text-bad">{err}</span>}
    </span>
  );
}

export function UploadForm({ action, extra, label = "Muat naik", accept = "application/pdf,image/jpeg,image/png" }: { action: string; extra?: Record<string, string>; label?: string; accept?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  return (
    <div>
      <label className="btn btn-line btn-sm cursor-pointer">
        {busy ? "Memuat naik…" : label}
        <input
          type="file"
          accept={accept}
          className="sr-only"
          disabled={busy}
          onChange={async (e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (!f) return;
            setBusy(true);
            setErr(null);
            const fd = new FormData();
            fd.append("file", f);
            for (const [k, v] of Object.entries(extra ?? {})) fd.append(k, v);
            const r = await fetch(action, { method: "POST", body: fd });
            const j = await r.json().catch(() => ({}));
            setBusy(false);
            if (!r.ok) setErr(j.error || "Ralat");
            else router.refresh();
          }}
        />
      </label>
      {err && <p className="mt-1 text-xs font-semibold text-bad">{err}</p>}
    </div>
  );
}
