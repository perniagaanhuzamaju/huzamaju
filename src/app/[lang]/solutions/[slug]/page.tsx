import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { href, t, type Lang } from "@/lib/i18n";
import { SOLUTIONS } from "@/lib/catalog";
import { pageMeta } from "@/lib/seo";
import { getServices } from "@/lib/data/public";
import { PageHero, Section } from "@/components/site/ui";
import { EnquiryForm } from "@/components/site/EnquiryForm";
import { IconCheck, IconSpark, IconWhatsApp } from "@/components/site/icons";
import { ManpowerDetails } from "@/components/site/Manpower";
import { COMPANY, waLink } from "@/lib/company";

export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return SOLUTIONS.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: PageProps<"/[lang]/solutions/[slug]">): Promise<Metadata> {
  const { lang, slug } = (await params) as { lang: Lang; slug: string };
  const s = SOLUTIONS.find((x) => x.slug === slug);
  if (!s) return {};
  return pageMeta(lang, `/solutions/${slug}`, s.title[lang], s.lead[lang], s.image);
}

export default async function Solution({ params }: PageProps<"/[lang]/solutions/[slug]">) {
  const { lang, slug } = (await params) as { lang: Lang; slug: string };
  const s = SOLUTIONS.find((x) => x.slug === slug);
  if (!s) notFound();
  const d = t(lang);
  const ms = lang === "ms";
  const services = (await getServices()).filter((x) => s.groups.includes(x.groupKey));
  const manpower = s.groups.includes("manpower");
  return (
    <>
      <PageHero lang={lang} eyebrow={ms ? "Penyelesaian" : "Solutions"} title={s.title[lang]} lead={s.lead[lang]} image={s.image} actual={false} />
      <Section>
        <div className="grid gap-12 lg:grid-cols-[1fr_1.2fr]">
          <div>
            <h2 className="text-2xl font-extrabold">{ms ? "Apa yang anda dapat" : "What you get"}</h2>
            <ul className="mt-6 space-y-3">
              {s.points[lang].map((p) => (
                <li key={p} className="flex gap-3 text-[16px]"><IconCheck className="mt-0.5 shrink-0 text-gold-strong" /> {p}</li>
              ))}
            </ul>
            <div className="mt-8 flex flex-wrap gap-3">
              {manpower ? (
                <a href={waLink(ms ? "Assalamualaikum, saya perlukan bekalan tenaga kerja." : "Hello, I need manpower supply.")} target="_blank" rel="noopener" className="btn-wa"><IconWhatsApp /> {COMPANY.phoneDisplay}</a>
              ) : (
                <Link href={`${href(lang, "/quotation")}?category=${s.quote}`} className="btn-gold"><IconSpark /> {d.cta.instantEstimate}</Link>
              )}
            </div>
            <h3 className="mt-12 font-bold">{ms ? "Servis berkaitan" : "Related services"}</h3>
            <div className="mt-4 flex flex-wrap gap-2">
              {services.map((x) => (
                <Link key={x.slug} href={href(lang, `/services/${x.slug}`)} className="chip px-3.5 py-1.5 text-[13px] hover:border-ink">{ms ? x.titleMs : x.titleEn}</Link>
              ))}
            </div>
          </div>
          <div>
            <h2 className="mb-5 text-2xl font-extrabold">{d.cta.requestQuote}</h2>
            <EnquiryForm lang={lang} kind={slug === "pemilik-rumah" ? "general" : "corporate"} services={services.map((x) => ({ slug: x.slug, title: ms ? x.titleMs : x.titleEn }))} />
          </div>
        </div>
      </Section>
      {manpower && <ManpowerDetails lang={lang} />}
    </>
  );
}
