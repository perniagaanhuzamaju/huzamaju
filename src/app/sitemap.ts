import type { MetadataRoute } from "next";
import { getPortfolio, getPosts, getServices } from "@/lib/data/public";
import { SOLUTIONS } from "@/lib/catalog";
import { href } from "@/lib/i18n";
import { SITE_URL } from "@/lib/seo";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [services, projects, postsMs, postsEn] = await Promise.all([getServices(), getPortfolio(), getPosts("ms"), getPosts("en")]);
  const paths = [
    "/", "/about", "/services", "/projects", "/capabilities", "/quotation", "/partners", "/partners/register", "/contact", "/blog", "/privacy", "/terms",
    ...SOLUTIONS.map((s) => `/solutions/${s.slug}`),
    ...services.map((s) => `/services/${s.slug}`),
    ...projects.map((p) => `/projects/${p.slug}`),
  ];
  const entry = (p: string) => ({
    url: `${SITE_URL}${href("ms", p)}`,
    alternates: { languages: { ms: `${SITE_URL}${href("ms", p)}`, en: `${SITE_URL}${href("en", p)}` } },
    changeFrequency: "weekly" as const,
    priority: p === "/" ? 1 : p.split("/").length > 2 ? 0.6 : 0.8,
  });
  return [
    ...paths.map(entry),
    ...postsMs.map((p) => ({ url: `${SITE_URL}/blog/${p.slug}`, lastModified: p.updatedAt })),
    ...postsEn.map((p) => ({ url: `${SITE_URL}/en/blog/${p.slug}`, lastModified: p.updatedAt })),
  ];
}
