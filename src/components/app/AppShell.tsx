import Link from "next/link";
import type { ReactNode } from "react";
import { TopBar } from "./TopBar";
import { NavLinks, type NavItem } from "./NavLinks";

/** Shared chrome for the customer portal, partner portal and admin dashboard. */
export function AppShell({ title, user, nav, children }: { title: string; user: { name: string; role: string }; nav: NavItem[]; children: ReactNode }) {
  return (
    <>
      <TopBar>
        <span className="hidden font-semibold text-mute sm:inline">{title}</span>
        <span className="hidden rounded-full bg-sand px-3 py-1 font-semibold md:inline">{user.name}</span>
        <Link href="/" className="btn btn-line btn-sm">Laman web</Link>
        <form action="/api/auth/logout" method="post">
          <button className="btn btn-dark btn-sm">Log keluar</button>
        </form>
      </TopBar>
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 md:grid-cols-[220px_1fr] md:px-6 md:py-8">
        <NavLinks items={nav} />
        <main className="min-w-0">{children}</main>
      </div>
    </>
  );
}

export function PageTitle({ title, lead, actions }: { title: string; lead?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight md:text-3xl">{title}</h1>
        {lead && <p className="mt-1 text-sm text-mute">{lead}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Stat({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <div className="card p-5">
      <p className="text-xs font-semibold tracking-wide text-mute uppercase">{label}</p>
      <p className="mt-2 text-2xl font-extrabold tabular-nums">{value}</p>
      {hint && <p className="mt-1 text-xs text-mute">{hint}</p>}
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="card p-8 text-center text-sm text-mute">{children}</div>;
}

const TONES: Record<string, string> = {
  new: "bg-amber/20", pending: "bg-amber/20", pending_qs: "bg-amber/20", follow_up: "bg-amber/20", in_progress: "bg-amber/20", ongoing: "bg-amber/20", eligible: "bg-amber/20", planned: "bg-line",
  verified: "bg-ok/10 text-ok", approved: "bg-ok/10 text-ok", won: "bg-ok/10 text-ok", paid: "bg-ok/10 text-ok", completed: "bg-ok/10 text-ok", accepted: "bg-ok/10 text-ok", sent: "bg-ok/10 text-ok", preliminary: "bg-sand", closed: "bg-line", quoted: "bg-sand",
  rejected: "bg-bad/10 text-bad", lost: "bg-bad/10 text-bad", duplicate: "bg-bad/10 text-bad", suspended: "bg-bad/10 text-bad", cancelled: "bg-bad/10 text-bad", expired: "bg-bad/10 text-bad", on_hold: "bg-line", disabled: "bg-bad/10 text-bad",
};
export const STATUS_MS: Record<string, string> = {
  new: "Baharu", pending: "Menunggu", pending_qs: "Semakan QS", follow_up: "Susulan", in_progress: "Dalam tindakan", ongoing: "Sedang berjalan", planned: "Dirancang", eligible: "Layak",
  verified: "Disahkan", approved: "Diluluskan", won: "Berjaya", paid: "Dibayar", completed: "Siap", accepted: "Diterima", sent: "Dihantar", preliminary: "Anggaran awal", closed: "Ditutup", quoted: "Disebut harga",
  rejected: "Ditolak", lost: "Tidak berjaya", duplicate: "Duplikasi", suspended: "Digantung", cancelled: "Dibatalkan", expired: "Tamat tempoh", on_hold: "Ditangguh", draft: "Draf", active: "Aktif", disabled: "Dinyahaktif",
};
export function Badge({ status }: { status: string }) {
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-bold whitespace-nowrap ${TONES[status] ?? "bg-sand"}`}>{STATUS_MS[status] ?? status}</span>;
}
