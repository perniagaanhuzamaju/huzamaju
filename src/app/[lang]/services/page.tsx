import Link from "next/link";
import type { Metadata } from "next";
import { href, t, type Lang } from "@/lib/i18n";
import { SERVICE_GROUPS } from "@/lib/catalog";
import { pageMeta } from "@/lib/seo";
import { getServices } from "@/lib/data/public";
import { PageHero, Photo } from "@/components/site/ui";
import { IconArrow } from "@/components/site/icons";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/[lang]/services">): Promise<Metadata> {
  const { lang } = (await params) as { lang: Lang };
  return pageMeta(
    lang,
    "/services",
    lang === "ms" ? "Perkhidmatan: Binaan, Sivil, Fasiliti & ICT" : "Services: Construction, Civil, Facilities & ICT",
    lang === "ms"
      ? "Katalog lengkap perkhidmatan HUZA MAJU: bina rumah, renovation, jalan raya, saliran, kerja tanah, penyelenggaraan bangunan, pembersihan dan ICT di Johor."
      : "Full HUZA MAJU service catalogue: house construction, renovation, roads, drainage, earthworks, building maintenance, cleaning and ICT in Johor.",
  );
}

export default async function Services({ params }: PageProps<"/[lang]/services">) {
  const { lang } = (await params) as { lang: Lang };
  const d = t(lang);
  const services = await getServices();
  return (
    <>
      <PageHero
        lang={lang}
        eyebrow={d.nav.services}
        title={lang === "ms" ? "Satu rakan kontraktor untuk setiap peringkat projek." : "One contracting partner for every stage of your project."}
        lead={lang === "ms" ? `${services.length} perkhidmatan dalam empat bidang. Pilih servis untuk melihat skop kerja dan minta sebut harga.` : `${services.length} services across four disciplines. Choose a service to see its scope and request a quotation.`}
      />
      <nav className="sticky top-[76px] z-30 border-b border-line bg-white/95 backdrop-blur" aria-label="Bidang">
        <div className="wrap flex gap-2 overflow-x-auto py-3">
          {SERVICE_GROUPS.map((g) => (
            <a key={g.key} href={`#${g.key}`} className="chip shrink-0 whitespace-nowrap hover:border-ink">{g.name[lang]}</a>
          ))}
        </div>
      </nav>
      {SERVICE_GROUPS.map((g, gi) => {
        const list = services.filter((s) => s.groupKey === g.key);
        return (
          <section key={g.key} id={g.key} className={`${gi % 2 ? "bg-sand" : "bg-white"} scroll-mt-32 py-16 md:py-20`}>
            <div className="wrap">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="text-sm font-bold text-gold-strong">{String.fromCharCode(65 + gi)}.</p>
                  <h2 className="h2 mt-1">{g.name[lang]}</h2>
                  <p className="lead">{g.tagline[lang]}</p>
                </div>
              </div>
              <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {list.map((s) => (
                  <Link key={s.slug} href={href(lang, `/services/${s.slug}`)} className="group card flex flex-col overflow-hidden transition hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-24px_rgba(0,0,0,.35)]">
                    {s.image && (
                      <Photo src={s.image} alt="" lang={lang} actual={s.imageIsActual} className="aspect-[16/9] rounded-none" sizes="(max-width: 640px) 100vw, 33vw" />
                    )}
                    <div className="flex flex-1 flex-col p-5">
                      <h3 className="font-bold">{lang === "ms" ? s.titleMs : s.titleEn}</h3>
                      <p className="mt-1.5 flex-1 text-[14.5px] text-mute">{lang === "ms" ? s.summaryMs : s.summaryEn}</p>
                      <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold">
                        {d.cta.readMore} <IconArrow width={16} className="transition group-hover:translate-x-1" />
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        );
      })}
    </>
  );
}
