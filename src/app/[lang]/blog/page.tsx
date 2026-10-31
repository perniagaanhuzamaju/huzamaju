import Link from "next/link";
import type { Metadata } from "next";
import { href, type Lang } from "@/lib/i18n";
import { pageMeta } from "@/lib/seo";
import { getPosts } from "@/lib/data/public";
import { PageHero, Section } from "@/components/site/ui";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/[lang]/blog">): Promise<Metadata> {
  const { lang } = (await params) as { lang: Lang };
  return pageMeta(lang, "/blog", "Blog", lang === "ms" ? "Tips renovation, pembinaan dan penyelenggaraan daripada HUZA MAJU." : "Renovation, construction and maintenance tips from HUZA MAJU.");
}

export default async function Blog({ params }: PageProps<"/[lang]/blog">) {
  const { lang } = (await params) as { lang: Lang };
  const posts = await getPosts(lang);
  const ms = lang === "ms";
  return (
    <>
      <PageHero lang={lang} eyebrow="Blog" title={ms ? "Ilmu binaan & renovation." : "Construction & renovation insights."} />
      <Section>
        {posts.length === 0 ? (
          <p className="text-mute">{ms ? "Artikel akan diterbitkan tidak lama lagi." : "Articles coming soon."}</p>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((p) => (
              <Link key={p.id} href={href(lang, `/blog/${p.slug}`)} className="card p-6 hover:border-ink">
                <p className="text-xs font-bold text-gold-strong">{p.publishedAt?.toLocaleDateString(ms ? "ms-MY" : "en-MY", { dateStyle: "medium" })}</p>
                <h2 className="mt-2 text-lg font-bold leading-snug">{p.title}</h2>
                {p.excerpt && <p className="mt-2 text-[15px] text-mute">{p.excerpt}</p>}
              </Link>
            ))}
          </div>
        )}
      </Section>
    </>
  );
}
