import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { Lang } from "@/lib/i18n";
import { breadcrumbJsonLd, ldScript, pageMeta, SITE_URL } from "@/lib/seo";
import { href } from "@/lib/i18n";
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
  const url = `${SITE_URL}${href(lang, `/blog/${p.slug}`)}`;
  const ld = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: p.title,
    description: p.excerpt ?? undefined,
    image: p.coverImage ? new URL(p.coverImage, SITE_URL).toString() : `${SITE_URL}/img/og.jpg`,
    datePublished: p.publishedAt?.toISOString(),
    dateModified: p.updatedAt?.toISOString(),
    inLanguage: lang === "ms" ? "ms-MY" : "en-MY",
    mainEntityOfPage: url,
    author: { "@id": `${SITE_URL}/#org` },
    publisher: { "@id": `${SITE_URL}/#org` },
  };
  return (
    <Section>
      <article className="mx-auto max-w-3xl">
        <p className="text-sm font-bold text-gold-strong">{p.publishedAt?.toLocaleDateString(lang === "ms" ? "ms-MY" : "en-MY", { dateStyle: "long" })}</p>
        <h1 className="mt-3 text-4xl font-extrabold tracking-tight">{p.title}</h1>
        <div className="prose-hm mt-8" dangerouslySetInnerHTML={{ __html: renderMarkdown(p.body) }} />
      </article>
      <script type="application/ld+json" dangerouslySetInnerHTML={ldScript(ld)} />
      <script type="application/ld+json" dangerouslySetInnerHTML={ldScript(breadcrumbJsonLd(lang, [["Blog", "/blog"], [p.title, `/blog/${p.slug}`]]))} />
    </Section>
  );
}
