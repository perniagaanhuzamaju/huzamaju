"use client";

import Link from "next/link";
import Image from "next/image";
import { useMemo, useState } from "react";
import { href, t, type Lang } from "@/lib/i18n";

type P = { id: number; slug: string; title: string; category: string; client: string | null; location: string | null; cover: string | null; role: string | null };

export function ProjectsGrid({ lang, projects, categories }: { lang: Lang; projects: P[]; categories: { key: string; name: string }[] }) {
  const d = t(lang);
  const [cat, setCat] = useState("all");
  const used = useMemo(() => categories.filter((c) => projects.some((p) => p.category === c.key)), [categories, projects]);
  const list = cat === "all" ? projects : projects.filter((p) => p.category === cat);
  return (
    <>
      <div className="flex flex-wrap gap-2" role="tablist">
        {[{ key: "all", name: d.labels.all }, ...used].map((c) => (
          <button key={c.key} role="tab" aria-selected={cat === c.key} onClick={() => setCat(c.key)} className={`chip px-4 py-2 text-sm ${cat === c.key ? "border-ink bg-ink text-white" : "bg-white hover:border-ink"}`}>
            {c.name}
          </button>
        ))}
      </div>
      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((p) => (
          <Link key={p.id} href={href(lang, `/projects/${p.slug}`)} className="group card flex flex-col overflow-hidden hover:border-ink">
            <div className="relative aspect-[4/3] bg-sand">
              {p.cover ? (
                <>
                  <Image src={p.cover} alt={p.title} fill sizes="(max-width: 640px) 100vw, 33vw" className="object-cover transition duration-500 group-hover:scale-105" />
                  <span className="absolute bottom-3 left-3 rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-semibold text-white">{d.labels.actualPhoto}</span>
                </>
              ) : (
                <div className="grid h-full place-items-center p-6 text-center text-sm font-semibold text-mute">{lang === "ms" ? "Gambar akan ditambah" : "Photos to be added"}</div>
              )}
            </div>
            <div className="flex flex-1 flex-col p-5">
              <p className="text-xs font-bold uppercase tracking-wider text-gold-strong">{p.client ?? p.role}</p>
              <h3 className="mt-2 font-bold leading-snug">{p.title}</h3>
              {p.location && <p className="mt-2 text-sm text-mute">{p.location}</p>}
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
