import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { href, t, type Lang } from "@/lib/i18n";
import { PROJECT_CATEGORIES } from "@/lib/catalog";
import { breadcrumbJsonLd, ldScript, pageMeta } from "@/lib/seo";
import { getPortfolioProject } from "@/lib/data/public";
import { PageHero, Section } from "@/components/site/ui";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/[lang]/projects/[slug]">): Promise<Metadata> {
  const { lang, slug } = (await params) as { lang: Lang; slug: string };
  const p = await getPortfolioProject(slug);
  if (!p) return {};
  return pageMeta(lang, `/projects/${slug}`, lang === "ms" ? p.titleMs : p.titleEn, (lang === "ms" ? p.descriptionMs : p.descriptionEn) ?? "", p.coverImage ?? undefined);
}

const money = (n: number) => `RM ${n.toLocaleString("en-MY", { minimumFractionDigits: 0 })}`;

export default async function ProjectPage({ params }: PageProps<"/[lang]/projects/[slug]">) {
  const { lang, slug } = (await params) as { lang: Lang; slug: string };
  const p = await getPortfolioProject(slug);
  if (!p) notFound();
  const d = t(lang);
  const ms = lang === "ms";
  const cat = PROJECT_CATEGORIES.find((c) => c.key === p.category);
  const statusLabel: Record<string, string> = ms
    ? { completed: "Siap", ongoing: "Sedang berjalan", planned: "Dirancang", on_hold: "Ditangguhkan" }
    : { completed: "Completed", ongoing: "Ongoing", planned: "Planned", on_hold: "On hold" };
  const facts = [
    [d.labels.client, p.clientPublic ? p.clientName : null],
    [d.labels.role, p.role],
    [d.labels.location, p.location],
    [d.labels.value, p.valuePublic && p.value ? money(p.value) : null],
    [d.labels.duration, p.duration],
    [ms ? "Tahun" : "Year", p.year],
    [d.labels.status, statusLabel[p.status] ?? p.status],
  ].filter(([, v]) => v) as [string, string][];
  const photos = [...(p.coverImage ? [{ src: p.coverImage, kind: "gallery" as const, captionMs: "", captionEn: "" }] : []), ...p.gallery];
  return (
    <>
      <PageHero lang={lang} eyebrow={cat?.name[lang] ?? d.nav.projects} title={ms ? p.titleMs : p.titleEn} image={p.coverImage} />
      <Section>
        <div className="grid gap-12 lg:grid-cols-[1fr_1.4fr]">
          <dl className="card divide-y divide-line self-start">
            {facts.map(([k, v]) => (
              <div key={k} className="grid grid-cols-[130px_1fr] gap-4 px-5 py-4 text-[15px]">
                <dt className="text-mute">{k}</dt>
                <dd className="font-semibold">{v}</dd>
              </div>
            ))}
          </dl>
          <div>
            {(ms ? p.scopeMs : p.scopeEn) && (
              <>
                <h2 className="text-xl font-extrabold">{d.labels.scope}</h2>
                <p className="mt-3 whitespace-pre-line text-[16px] leading-relaxed text-ink-2">{ms ? p.scopeMs : p.scopeEn}</p>
              </>
            )}
            {(ms ? p.descriptionMs : p.descriptionEn) && <p className="mt-6 whitespace-pre-line text-[16px] leading-relaxed text-mute">{ms ? p.descriptionMs : p.descriptionEn}</p>}
            {photos.length > 1 && (
              <div className="mt-10 grid grid-cols-2 gap-3">
                {photos.slice(1).map((g, i) => (
                  <figure key={i} className="relative aspect-[4/3] overflow-hidden rounded-xl bg-line">
                    <Image src={g.src} alt={(ms ? g.captionMs : g.captionEn) || ""} fill sizes="(max-width: 768px) 50vw, 30vw" className="object-cover" />
                    {g.kind && g.kind !== "gallery" && (
                      <span className="absolute top-3 left-3 rounded-full bg-black/70 px-2.5 py-1 text-[11px] font-bold uppercase text-white">{g.kind === "before" ? (ms ? "Sebelum" : "Before") : ms ? "Selepas" : "After"}</span>
                    )}
                  </figure>
                ))}
              </div>
            )}
            <div className="mt-10 flex flex-wrap gap-3">
              <Link href={href(lang, "/quotation")} className="btn-dark">{d.cta.requestQuote}</Link>
              <Link href={href(lang, "/projects")} className="btn-line">{d.nav.projects}</Link>
            </div>
          </div>
        </div>
      </Section>
      <script type="application/ld+json" dangerouslySetInnerHTML={ldScript(breadcrumbJsonLd(lang, [[d.nav.projects, "/projects"], [ms ? p.titleMs : p.titleEn, `/projects/${p.slug}`]]))} />
    </>
  );
}
