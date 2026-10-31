import type { Metadata } from "next";
import Image from "next/image";
import { t, type Lang } from "@/lib/i18n";
import { PROJECT_CATEGORIES } from "@/lib/catalog";
import { pageMeta } from "@/lib/seo";
import { getGallery, getPortfolio } from "@/lib/data/public";
import { PageHero, Section } from "@/components/site/ui";
import { ProjectsGrid } from "@/components/site/ProjectsGrid";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/[lang]/projects">): Promise<Metadata> {
  const { lang } = (await params) as { lang: Lang };
  return pageMeta(lang, "/projects", lang === "ms" ? "Projek & Portfolio" : "Projects & Portfolio",
    lang === "ms" ? "Rekod projek HUZA MAJU: renovation rumah, bangunan, jalan raya, infrastruktur dan kerja industri di Johor, Perak dan Kelantan." : "HUZA MAJU project record: renovations, buildings, roads, infrastructure and industrial works in Johor, Perak and Kelantan.");
}

export default async function Projects({ params }: PageProps<"/[lang]/projects">) {
  const { lang } = (await params) as { lang: Lang };
  const d = t(lang);
  const ms = lang === "ms";
  const [projects, gallery] = await Promise.all([getPortfolio(), getGallery()]);
  return (
    <>
      <PageHero lang={lang} eyebrow={d.nav.projects} title={ms ? "Pengalaman yang terbukti." : "Proven experience."}
        lead={ms ? "Projek terpilih daripada lebih 100 projek kerajaan, swasta dan kediaman sejak 2018. Nama pelanggan dipaparkan hanya apabila dibenarkan." : "Selected projects from more than 100 government, private and residential projects since 2018. Client names are shown only where permitted."} />
      <Section>
        <ProjectsGrid
          lang={lang}
          categories={PROJECT_CATEGORIES.map((c) => ({ key: c.key, name: c.name[lang] }))}
          projects={projects.map((p) => ({ id: p.id, slug: p.slug, title: ms ? p.titleMs : p.titleEn, category: p.category, client: p.clientPublic ? p.clientName : null, location: p.location, cover: p.coverImage, role: p.role }))}
        />
      </Section>
      {gallery.length > 0 && (
        <Section tone="sand">
          <span className="eyebrow">{ms ? "Galeri Kerja" : "Work Gallery"}</span>
          <h2 className="h2">{ms ? "Hasil kerja di tapak." : "Work on site."}</h2>
          <div className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-4">
            {gallery.map((g) => (
              <figure key={g.id} className="relative aspect-square overflow-hidden rounded-xl bg-line">
                <Image src={g.src} alt={ms ? g.captionMs : g.captionEn} fill sizes="(max-width: 768px) 50vw, 25vw" className="object-cover" />
                <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent p-3 pt-8 text-[12.5px] font-semibold text-white">
                  {ms ? g.captionMs : g.captionEn}
                  <span className="block text-[10.5px] font-medium text-white/70">{g.isActualProject ? d.labels.actualPhoto : d.labels.illustrativePhoto}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </Section>
      )}
    </>
  );
}
