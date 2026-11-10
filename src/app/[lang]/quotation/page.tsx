import type { Metadata } from "next";
import { t, type Lang } from "@/lib/i18n";
import { QUOTE_CATEGORIES } from "@/lib/catalog";
import { pageMeta } from "@/lib/seo";
import { getServices } from "@/lib/data/public";
import { Section } from "@/components/site/ui";
import { QuotationWizard } from "@/components/quote/QuotationWizard";
import { IconShield, IconSpark, IconDoc } from "@/components/site/icons";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/[lang]/quotation">): Promise<Metadata> {
  const { lang } = (await params) as { lang: Lang };
  return pageMeta(
    lang,
    "/quotation",
    lang === "ms" ? "Sebut Harga Segera AI" : "AI Instant Quotation",
    lang === "ms"
      ? "Dapatkan anggaran bajet awal untuk renovation, bina rumah, bumbung, cat, paip, elektrik, kerja sivil dan pembersihan di seluruh Malaysia dalam beberapa minit."
      : "Get a preliminary budget estimate for renovation, house construction, roofing, painting, plumbing, wiring, civil works and cleaning across Malaysia within minutes.",
  );
}

export default async function QuotationPage({ params, searchParams }: PageProps<"/[lang]/quotation">) {
  const { lang } = (await params) as { lang: Lang };
  const sp = await searchParams;
  const d = t(lang);
  const ms = lang === "ms";
  const services = await getServices();
  const byCat: Record<string, string[]> = {};
  for (const s of services) if (s.quoteCategory) (byCat[s.quoteCategory] ??= []).push(ms ? s.titleMs : s.titleEn);
  const categories = QUOTE_CATEGORIES.map((c) => ({ key: c.key, name: c.name, works: c.works }));
  const points = [
    [IconSpark, ms ? "AI memecahkan skop kepada item, unit & kuantiti" : "AI breaks the scope into items, units & quantities"],
    [IconDoc, ms ? "Harga dikira dari pangkalan harga syarikat, bukan oleh AI" : "Prices come from the company's pricing database, not the AI"],
    [IconShield, ms ? "Disemak QS sebelum menjadi sebut harga rasmi" : "Reviewed by a QS before it becomes a formal quotation"],
  ] as const;
  return (
    <>
      <section className="border-b border-line bg-sand">
        <div className="wrap py-12 md:py-16">
          <span className="eyebrow">HUZA MAJU AI ESTIMATOR</span>
          <h1 className="mt-4 max-w-3xl text-[32px] leading-[1.1] font-extrabold tracking-tight md:text-[46px]">{d.nav.quotation}</h1>
          <p className="lead max-w-2xl">{d.home.aiText}</p>
          <ul className="mt-6 grid gap-3 md:grid-cols-3">
            {points.map(([Icon, text]) => (
              <li key={text} className="flex items-start gap-3 text-sm font-semibold">
                <Icon width={20} height={20} className="mt-0.5 shrink-0 text-gold-strong" /> {text}
              </li>
            ))}
          </ul>
        </div>
      </section>
      <Section className="!pt-12">
        <QuotationWizard
          lang={lang}
          categories={categories}
          services={byCat}
          initialCategory={typeof sp.category === "string" ? sp.category : undefined}
          turnstileSiteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || undefined}
        />
      </Section>
    </>
  );
}
