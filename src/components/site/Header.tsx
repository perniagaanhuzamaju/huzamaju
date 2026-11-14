"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { href, t, type Lang } from "@/lib/i18n";
import { IconMenu, IconX } from "./icons";

export function Header({ lang }: { lang: Lang }) {
  const d = t(lang);
  const pathname = usePathname() || "/";
  // The menu is open only for the path it was opened on, so navigating closes it.
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === pathname;
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  const bare = lang === "ms" ? pathname.replace(/^\/ms/, "") || "/" : pathname;
  const other: Lang = lang === "ms" ? "en" : "ms";
  const nav = [
    ["/", d.nav.home],
    ["/about", d.nav.about],
    ["/services", d.nav.services],
    ["/projects", d.nav.projects],
    ["/capabilities", d.nav.capabilities],
    ["/quotation", d.nav.quotation],
    ["/partners", d.nav.partners],
    ["/contact", d.nav.contact],
  ] as const;
  const active = (p: string) => (p === "/" ? bare === "/" : bare.startsWith(p));

  return (
    <header className={`sticky top-0 z-50 bg-white/95 backdrop-blur transition-shadow ${scrolled ? "shadow-[0_1px_0_var(--color-line)]" : ""}`}>
      <div className="wrap flex h-[76px] items-center justify-between gap-5">
        <Link href={href(lang)} className="flex shrink-0 items-center gap-3" aria-label="HUZA MAJU">
          <Image src="/img/logo.png" alt="Logo Perniagaan Huza Maju" width={60} height={38} priority className="h-[34px] w-auto" />
          <span className="leading-tight">
            <span className="block text-[15px] font-extrabold tracking-[0.06em]">HUZA MAJU</span>
            <span className="block text-[10px] font-semibold tracking-[0.14em] text-mute xl:hidden 2xl:block">PERNIAGAAN HUZA MAJU</span>
          </span>
        </Link>

        <nav aria-label="Utama" className="hidden xl:block">
          <ul className="flex items-center gap-[18px] whitespace-nowrap text-[14px] font-medium">
            {nav.map(([p, label]) => (
              <li key={p}>
                <Link
                  href={href(lang, p)}
                  aria-current={active(p) ? "page" : undefined}
                  className={`py-2 transition hover:text-ink ${active(p) ? "text-ink font-semibold shadow-[inset_0_-2px_0_var(--color-gold)]" : "text-ink-2/80"}`}
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="hidden items-center gap-3 xl:flex">
          <Link href={href(other, bare)} className="text-[13px] font-semibold text-mute hover:text-ink" hrefLang={other}>
            {other.toUpperCase()}
          </Link>
          <Link href={href(lang, "/quotation")} className="btn-dark btn-sm whitespace-nowrap">
            {d.cta.requestQuote}
          </Link>
        </div>

        <button className="rounded-lg p-2 xl:hidden" aria-label={open ? "Tutup menu" : "Buka menu"} aria-expanded={open} onClick={() => setOpenOn(open ? null : pathname)}>
          {open ? <IconX width={26} height={26} /> : <IconMenu width={26} height={26} />}
        </button>
      </div>

      {open && (
        <nav className="border-t border-line bg-white xl:hidden" aria-label="Menu telefon">
          <ul className="wrap py-2">
            {nav.map(([p, label]) => (
              <li key={p}>
                <Link href={href(lang, p)} className={`block border-b border-line py-3.5 text-[16px] ${active(p) ? "font-bold" : ""}`}>
                  {label}
                </Link>
              </li>
            ))}
            <li className="flex gap-3 py-4">
              <Link href={href(lang, "/quotation")} className="btn-dark flex-1">
                {d.cta.instantEstimate}
              </Link>
              <Link href={href(other, bare)} className="btn-line" hrefLang={other}>
                {other.toUpperCase()}
              </Link>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}
