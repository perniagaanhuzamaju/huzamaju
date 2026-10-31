import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { Lang } from "@/lib/i18n";
import { pageMeta, SITE_URL } from "@/lib/seo";
import { getPost } from "@/lib/data/public";
import { Section } from "@/components/site/ui";
import { renderMarkdown } from "@/lib/markdown";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/[lang]/blog/[slug]">): Promise<Metadata> {
  const { lang, slug } = (await params) as { lang: Lang; slug: string };
  const p = await getPost(lang, slug);
  if (!p) return {};
  return pageMeta(lang, `/blog/${slug}`, p.title, p.excerpt ?? "", p.coverImage ?? undefined);
}

export default async function Post({ params }: PageProps<"/[lang]/blog/[slug]">) {
  const { lang, slug } = (await params) as { lang: Lang; slug: string };
  const p = await getPost(lang, slug);
  if (!p) notFound();
  const ld = { "@context": "https://schema.org", "@type": "BlogPosting", headline: p.title, datePublished: p.publishedAt?.toISOString(), publisher: { "@id": `${SITE_URL}/#org` } };
  return (
    <Section>
      <article className="mx-auto max-w-3xl">
        <p className="text-sm font-bold text-gold-strong">{p.publishedAt?.toLocaleDateString(lang === "ms" ? "ms-MY" : "en-MY", { dateStyle: "long" })}</p>
        <h1 className="mt-3 text-4xl font-extrabold tracking-tight">{p.title}</h1>
        <div className="prose-hm mt-8" dangerouslySetInnerHTML={{ __html: renderMarkdown(p.body) }} />
      </article>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, "\\u003c") }} />
    </Section>
  );
}
