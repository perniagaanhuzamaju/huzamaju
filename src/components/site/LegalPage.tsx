import type { Lang } from "@/lib/i18n";
import { PageHero, Section } from "./ui";

export function LegalPage({ lang, eyebrow, title, updated, sections }: { lang: Lang; eyebrow: string; title: string; updated: string; sections: [string, string[]][] }) {
  return (
    <>
      <PageHero lang={lang} eyebrow={eyebrow} title={title} lead={updated} />
      <Section>
        <div className="prose-hm mx-auto max-w-3xl">
          {sections.map(([h, ps]) => (
            <section key={h}>
              <h2>{h}</h2>
              {ps.map((p, i) => (p.startsWith("• ") ? <ul key={i}><li>{p.slice(2)}</li></ul> : <p key={i}>{p}</p>))}
            </section>
          ))}
        </div>
      </Section>
    </>
  );
}
