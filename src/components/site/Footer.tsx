import Link from "next/link";
import Image from "next/image";
import { COMPANY, waLink } from "@/lib/company";
import { href, t, type Lang } from "@/lib/i18n";
import { IconWhatsApp } from "./icons";

export function Footer({ lang }: { lang: Lang }) {
  const d = t(lang);
  const col = (title: string, items: [string, string][]) => (
    <div>
      <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-white/50">{title}</h3>
      <ul className="mt-4 space-y-2.5 text-[14.5px]">
        {items.map(([p, l]) => (
          <li key={p}>
            <Link href={href(lang, p)} className="text-white/80 hover:text-white">
              {l}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
  return (
    <footer className="bg-ink text-white">
      <div className="wrap grid gap-10 py-16 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
        <div>
          <div className="inline-flex rounded-xl bg-white p-3">
            <Image src="/img/logo.png" alt="Logo Perniagaan Huza Maju" width={70} height={45} className="h-[40px] w-auto" />
          </div>
          <p className="mt-5 text-lg font-extrabold tracking-wide">{COMPANY.name}</p>
          <p className="mt-1 text-sm font-semibold tracking-[0.12em] text-amber">{COMPANY.tagline.en.toUpperCase()}</p>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/65">{COMPANY.positioning[lang]}</p>
        </div>
        {col(lang === "ms" ? "Syarikat" : "Company", [
          ["/about", d.nav.about],
          ["/capabilities", d.nav.capabilities],
          ["/projects", d.nav.projects],
          ["/blog", "Blog"],
          ["/contact", d.nav.contact],
        ])}
        {col(lang === "ms" ? "Penyelesaian" : "Solutions", [
          ["/services", d.nav.services],
          ["/solutions/pemilik-rumah", lang === "ms" ? "Pemilik rumah" : "Homeowners"],
          ["/solutions/korporat", lang === "ms" ? "Korporat" : "Corporate"],
          ["/solutions/sivil-infrastruktur", lang === "ms" ? "Sivil & infrastruktur" : "Civil & infrastructure"],
          ["/solutions/bekalan-tenaga-kerja", lang === "ms" ? "Bekalan tenaga kerja" : "Manpower supply"],
          ["/quotation", d.nav.quotation],
          ["/partners", d.nav.partners],
        ])}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-white/50">{d.nav.contact}</h3>
          <ul className="mt-4 space-y-3 text-[14.5px] text-white/80">
            <li>
              <a href={waLink()} target="_blank" rel="noopener" className="inline-flex items-center gap-2 font-semibold text-white">
                <IconWhatsApp className="text-wa" /> {COMPANY.phoneDisplay}
              </a>
            </li>
            <li>
              <a href={`mailto:${COMPANY.email}`} className="hover:text-white">{COMPANY.email}</a>
            </li>
            <li className="leading-relaxed">
              <a href={COMPANY.googleMaps} target="_blank" rel="noopener" className="hover:text-white">{COMPANY.address}</a>
            </li>
            <li>
              <a href={COMPANY.facebook} target="_blank" rel="noopener me" className="hover:text-white">Facebook: HUZA MAJU</a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="wrap flex flex-col gap-3 py-6 text-[13px] text-white/55 md:flex-row md:items-center md:justify-between">
          <p>
            SSM {COMPANY.ssm} · CIDB {COMPANY.cidb} · {COMPANY.cidbGrades}
          </p>
          <p className="flex flex-wrap gap-4">
            <Link href={href(lang, "/privacy")} className="hover:text-white">{d.labels.privacy}</Link>
            <Link href={href(lang, "/terms")} className="hover:text-white">{d.labels.terms}</Link>
            <Link href="/login" className="hover:text-white">{d.cta.login}</Link>
            <span>© {new Date().getFullYear()} {COMPANY.shortName}</span>
          </p>
        </div>
        <p className="wrap pb-6 text-[11.5px] text-white/35">{d.labels.stockNote}</p>
      </div>
    </footer>
  );
}

export function WhatsAppFloat({ lang }: { lang: Lang }) {
  return (
    <a
      href={waLink(lang === "ms" ? "Assalamualaikum HUZA MAJU, saya nak bertanya." : "Hello HUZA MAJU, I have an enquiry.")}
      target="_blank"
      rel="noopener"
      aria-label="WhatsApp HUZA MAJU"
      className="fixed right-4 bottom-4 z-40 inline-flex items-center gap-2 rounded-full bg-wa px-4 py-3.5 font-bold text-white shadow-[0_12px_30px_-10px_rgba(0,0,0,.5)] md:right-6 md:bottom-6"
    >
      <IconWhatsApp width={24} height={24} />
      <span className="hidden sm:inline">{t(lang).cta.whatsapp}</span>
    </a>
  );
}
