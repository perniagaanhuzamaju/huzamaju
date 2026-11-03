import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { href, t, type Lang } from "@/lib/i18n";
import { SERVICE_GROUPS, quoteCategory } from "@/lib/catalog";
import { pageMeta, SITE_URL } from "@/lib/seo";
import { waLink, COMPANY } from "@/lib/company";
import { getPortfolio, getService, getServices } from "@/lib/data/public";
import { ProjectCover } from "@/components/site/ProjectCover";
import { PageHero, Section, Photo } from "@/components/site/ui";
import { EnquiryForm } from "@/components/site/EnquiryForm";
import { IconCheck, IconSpark, IconWhatsApp } from "@/components/site/icons";

export const dynamic = "force-dynamic";

const PROJECT_MATCH: Record<string, string[]> = {
  building: ["building", "house_renovation", "commercial_renovation"],
  civil: ["civil", "road", "drainage", "infrastructure"],
  facilities: ["facilities", "cleaning"],
  ict: ["ict"],
};

export async function generateMetadata({ params }: PageProps<"/[lang]/services/[slug]">): Promise<Metadata> {
  const { lang, slug } = (await params) as { lang: Lang; slug: string };
  const s = await getService(slug);
  if (!s) return {};
  const title = lang === "ms" ? `${s.titleMs} di Kluang & Johor` : `${s.titleEn} in Johor`;
  return pageMeta(lang, `/services/${slug}`, title, lang === "ms" ? s.summaryMs : s.summaryEn, s.image ?? undefined);
}

export default async function ServicePage({ params }: PageProps<"/[lang]/services/[slug]">) {
  const { lang, slug } = (await params) as { lang: Lang; slug: string };
  const s = await getService(slug);
  if (!s) notFound();
  const d = t(lang);
  const ms = lang === "ms";
  const group = SERVICE_GROUPS.find((g) => g.key === s.groupKey)!;
  const [all, portfolio] = await Promise.all([getServices(), getPortfolio()]);
  const related = all.filter((x) => x.groupKey === s.groupKey && x.slug !== s.slug).slice(0, 6);
  const examples = portfolio.filter((p) => PROJECT_MATCH[s.groupKey]?.includes(p.category)).slice(0, 4);
  const title = ms ? s.titleMs : s.titleEn;
  const scope = (ms ? s.scopeMs : s.scopeEn) ?? [];
  const qc = s.quoteCategory ? quoteCategory(s.quoteCategory) : null;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: title,
    description: ms ? s.summaryMs : s.summaryEn,
    provider: { "@id": `${SITE_URL}/#org` },
    areaServed: "Johor, Malaysia",
    url: `${SITE_URL}${href(lang, `/services/${s.slug}`)}`,
  };
  return (
    <>
      <PageHero lang={lang} eyebrow={group.name[lang]} title={title} lead={ms ? s.summaryMs : s.summaryEn} image={s.image} actual={s.imageIsActual} />
      <Section>
        <div className="grid gap-12 lg:grid-cols-[1.3fr_1fr]">
          <div>
            <h2 className="text-2xl font-extrabold">{d.labels.scope}</h2>
            <ul className="mt-6 space-y-3">
              {scope.map((x) => (
                <li key={x} className="flex gap-3 text-[16px]"><IconCheck className="mt-0.5 shrink-0 text-gold-strong" /> {x}</li>
              ))}
            </ul>
            <div className="mt-10 rounded-xl2 bg-sand p-6">
              <h3 className="font-bold">{ms ? "Cara kami bekerja" : "How we work"}</h3>
              <ol className="mt-4 grid gap-3 text-[15px] text-ink-2 sm:grid-cols-2">
                {(ms
                  ? ["Lawatan tapak & ukuran", "Sebut harga ikut item kerja", "Perjanjian & jadual bertulis", "Pelaksanaan & laporan progres", "Pemeriksaan bersama & serahan"]
                  : ["Site visit & measurement", "Itemised quotation", "Written agreement & schedule", "Execution & progress reports", "Joint inspection & handover"]
                ).map((x, i) => (
                  <li key={x} className="flex gap-3"><span className="font-extrabold text-gold-strong">{i + 1}</span>{x}</li>
                ))}
              </ol>
            </div>
            {examples.length > 0 && (
              <div className="mt-12">
                <h2 className="text-2xl font-extrabold">{ms ? "Contoh projek berkaitan" : "Related project examples"}</h2>
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  {examples.map((p) => (
                    <Link key={p.id} href={href(lang, `/projects/${p.slug}`)} className="card overflow-hidden hover:border-ink">
                      {p.coverImage ? (
                        <>
                          <Photo src={p.coverImage} alt={ms ? p.titleMs : p.titleEn} lang={lang} className="aspect-[16/10] rounded-none" sizes="(max-width: 640px) 100vw, 30vw" />
                          <p className="p-4 text-[15px] font-semibold leading-snug">{ms ? p.titleMs : p.titleEn}</p>
                        </>
                      ) : (
                        <ProjectCover title={ms ? p.titleMs : p.titleEn} categoryKey={p.category} location={p.location} className="aspect-[16/10]" />
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
          <aside className="space-y-4 lg:sticky lg:top-28 lg:self-start">
            <div className="rounded-xl2 bg-ink p-6 text-white">
              <h3 className="text-lg font-bold">{ms ? "Dapatkan harga" : "Get a price"}</h3>
              <p className="mt-2 text-sm text-white/70">{ms ? "Anggaran awal segera melalui AI, atau hubungi kami terus." : "An instant AI preliminary estimate, or contact us directly."}</p>
              <div className="mt-5 grid gap-2">
                <Link href={`${href(lang, "/quotation")}?category=${qc?.key ?? ""}`} className="btn-gold"><IconSpark /> {d.cta.instantEstimate}</Link>
                <a href={waLink(`${ms ? "Assalamualaikum, saya berminat dengan servis" : "Hello, I'm interested in"}: ${title}`)} target="_blank" rel="noopener" className="btn-wa"><IconWhatsApp /> {COMPANY.phoneDisplay}</a>
              </div>
            </div>
            <EnquiryForm lang={lang} service={s.slug} compact />
          </aside>
        </div>
      </Section>
      {related.length > 0 && (
        <Section tone="sand">
          <h2 className="text-2xl font-extrabold">{ms ? "Servis lain dalam bidang ini" : "Other services in this discipline"}</h2>
          <div className="mt-6 flex flex-wrap gap-2">
            {related.map((r) => (
              <Link key={r.slug} href={href(lang, `/services/${r.slug}`)} className="chip bg-white px-4 py-2 text-sm hover:border-ink">{ms ? r.titleMs : r.titleEn}</Link>
            ))}
          </div>
        </Section>
      )}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
    </>
  );
}
