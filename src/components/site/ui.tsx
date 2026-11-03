import Link from "next/link";
import Image from "next/image";
import type { ReactNode } from "react";
import { href, t, type Lang } from "@/lib/i18n";
import { IconArrow, IconCamera } from "./icons";

export function Section({ id, tone = "white", children, className = "" }: { id?: string; tone?: "white" | "sand" | "dark"; children: ReactNode; className?: string }) {
  const bg = tone === "sand" ? "bg-sand" : tone === "dark" ? "bg-ink text-white" : "bg-white";
  return (
    <section id={id} className={`${bg} py-20 md:py-28 ${className}`}>
      <div className="wrap">{children}</div>
    </section>
  );
}

export function Heading({ eyebrow, title, lead, dark }: { eyebrow: string; title: string; lead?: string; dark?: boolean }) {
  return (
    <div className="max-w-3xl">
      <span className="eyebrow">{eyebrow}</span>
      <h2 className="h2">{title}</h2>
      {lead && <p className={`lead ${dark ? "text-white/65" : ""}`}>{lead}</p>}
    </div>
  );
}

export function PageHero({ eyebrow, title, lead, image, lang, actual = true }: { eyebrow: string; title: string; lead?: string; image?: string | null; lang: Lang; actual?: boolean }) {
  return (
    <section className="border-b border-line bg-sand">
      <div className={`wrap grid items-center gap-10 py-14 md:py-20 ${image ? "lg:grid-cols-[1.1fr_1fr]" : ""}`}>
        <div className="rise">
          <span className="eyebrow">{eyebrow}</span>
          <h1 className="mt-4 text-[34px] leading-[1.08] font-extrabold tracking-tight md:text-[52px]">{title}</h1>
          {lead && <p className="lead">{lead}</p>}
        </div>
        {image && <Photo src={image} alt={title} lang={lang} actual={actual} className="aspect-[4/3] rise" priority />}
      </div>
    </section>
  );
}

/** Every photo carries a label so actual project photos are never confused with illustrative ones. */
export function Photo({ src, alt, lang, actual = true, className = "", priority, sizes = "(max-width: 768px) 100vw, 50vw" }: { src: string; alt: string; lang: Lang; actual?: boolean; className?: string; priority?: boolean; sizes?: string }) {
  const d = t(lang);
  return (
    <figure className={`ph relative overflow-hidden rounded-xl2 bg-ink ${className}`}>
      <Image src={src} alt={alt} fill sizes={sizes} className="object-cover" priority={priority} />
      <figcaption className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur">
        <IconCamera width={13} height={13} />
        {actual ? d.labels.actualPhoto : d.labels.illustrativePhoto}
      </figcaption>
    </figure>
  );
}

export function ArrowLink({ to, lang, children }: { to: string; lang: Lang; children: ReactNode }) {
  return (
    <Link href={href(lang, to)} className="group inline-flex items-center gap-2 font-bold text-ink">
      {children}
      <IconArrow className="transition group-hover:translate-x-1" />
    </Link>
  );
}
