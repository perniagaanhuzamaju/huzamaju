import Link from "next/link";
import Image from "next/image";
import { href, type Lang } from "@/lib/i18n";
import { COMPANY, waLink } from "@/lib/company";
import { STOCK } from "@/lib/stock";
import { MANPOWER_STEPS, MANPOWER_TERMS, MANPOWER_TRADES } from "@/lib/manpower";
import { IconArrow, IconCheck, IconWhatsApp } from "./icons";

/** Homepage feature section for manpower supply. */
export function ManpowerSection({ lang }: { lang: Lang }) {
  const ms = lang === "ms";
  return (
    <section className="hero-dark relative overflow-hidden py-20 text-white md:py-28">
      <div className="wrap relative z-10">
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_1fr]">
          <div>
            <span className="flex items-center gap-2.5 text-[12px] font-bold tracking-[0.14em] text-amber uppercase">
              <span className="h-1.5 w-6 rounded-full bg-amber" /> {ms ? "Bekalan Tenaga Kerja" : "Manpower Supply"}
            </span>
            <h2 className="mt-5 text-[32px] leading-[1.08] font-extrabold tracking-[-0.02em] md:text-[48px]">
              {ms ? "Tenaga kerja untuk" : "Manpower for"} <span className="text-gradient-gold">{ms ? "bangunan, kilang & ladang." : "buildings, factories & estates."}</span>
            </h2>
            <p className="mt-5 max-w-xl text-[17px] leading-relaxed text-white/65">
              {ms
                ? "Kami membekalkan pekerja am, tukang mahir dan penyelia untuk penyelenggaraan bangunan, kilang dan ladang, termasuk syarikat pengurusan fasiliti dan kontraktor. Setiap pasukan datang dengan ketua pasukan, taklimat keselamatan dan laporan kehadiran, disokong oleh kontraktor berdaftar CIDB yang memahami kerja penyelenggaraan."
                : "We supply general workers, skilled tradesmen and supervisors for building, factory and estate maintenance, including facility management companies and contractors. Every crew comes with a team leader, a safety briefing and attendance reports, backed by a CIDB-registered contractor that understands maintenance work."}
            </p>
            <ul className="mt-7 flex flex-wrap gap-2">
              {MANPOWER_TRADES[lang].map((x) => (
                <li key={x} className="rounded-full border border-white/12 bg-white/[0.04] px-3 py-1.5 text-[13px] font-semibold text-white/85 backdrop-blur">{x}</li>
              ))}
            </ul>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href={href(lang, "/solutions/bekalan-tenaga-kerja")} className="btn-gold shadow-[0_0_40px_rgba(242,183,5,0.3)]">
                {ms ? "Mohon tenaga kerja" : "Request manpower"} <IconArrow />
              </Link>
              <a href={waLink(ms ? "Assalamualaikum, saya perlukan bekalan tenaga kerja." : "Hello, I need manpower supply.")} target="_blank" rel="noopener" className="btn border border-white/20 bg-white/5 text-white backdrop-blur hover:bg-white/10">
                <IconWhatsApp /> {COMPANY.phoneDisplay}
              </a>
            </div>
          </div>
          <div className="relative">
            <div className="ph relative aspect-[4/3.4] overflow-hidden rounded-[28px]">
              <Image src={STOCK.factoryCrew} alt={ms ? "Pasukan pekerja di kilang" : "Work crew in a factory"} fill sizes="(max-width: 1024px) 100vw, 45vw" className="object-cover" />
            </div>
            <div className="hv-card absolute -bottom-6 left-4 max-w-[78%] sm:left-6">
              <p className="hv-k">{ms ? "Tempoh kontrak" : "Contract terms"}</p>
              <p className="hv-v">{MANPOWER_TERMS[lang].map(([k]) => k).join(" · ")}</p>
            </div>
          </div>
        </div>
        <ol className="mt-20 grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-5">
          {MANPOWER_STEPS[lang].map(([title, text], i) => (
            <li key={title} className="bg-[#0f1216]/90 p-6 backdrop-blur">
              <span className="font-mono text-[12px] font-bold text-amber">0{i + 1}</span>
              <h3 className="mt-2 font-bold">{title}</h3>
              <p className="mt-1.5 text-[14px] leading-relaxed text-white/55">{text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/** Extra detail block on the manpower solutions page. */
export function ManpowerDetails({ lang }: { lang: Lang }) {
  const ms = lang === "ms";
  return (
    <section className="bg-sand py-20 md:py-24">
      <div className="wrap">
        <span className="eyebrow">{ms ? "Proses kami" : "Our process"}</span>
        <h2 className="h2">{ms ? "Dari permintaan hingga pasukan di lokasi." : "From request to crew on location."}</h2>
        <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {MANPOWER_STEPS[lang].map(([title, text], i) => (
            <li key={title} className="card p-5">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-ink text-sm font-extrabold text-amber">{i + 1}</span>
              <h3 className="mt-4 font-bold">{title}</h3>
              <p className="mt-1.5 text-[14px] leading-relaxed text-mute">{text}</p>
            </li>
          ))}
        </ol>
        <div className="mt-14 grid gap-10 lg:grid-cols-2">
          <div>
            <h3 className="text-xl font-extrabold">{ms ? "Kemahiran yang dibekalkan" : "Skills we supply"}</h3>
            <ul className="mt-5 grid grid-cols-2 gap-x-6 gap-y-3">
              {MANPOWER_TRADES[lang].map((x) => (
                <li key={x} className="flex items-center gap-2.5 text-[15px] font-medium"><IconCheck className="shrink-0 text-gold-strong" /> {x}</li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-xl font-extrabold">{ms ? "Pilihan tempoh kontrak" : "Contract options"}</h3>
            <div className="mt-5 grid gap-3">
              {MANPOWER_TERMS[lang].map(([k, v]) => (
                <div key={k} className="card flex items-baseline justify-between gap-4 px-5 py-4">
                  <span className="font-bold">{k}</span>
                  <span className="text-right text-[14px] text-mute">{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
