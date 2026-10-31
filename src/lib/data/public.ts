import "server-only";
import { and, asc, desc, eq } from "drizzle-orm";
import { cache } from "react";
import { db } from "@/db";
import { services, projects, galleryItems, websiteContent, testimonials, blogPosts } from "@/db/schema";
import type { Lang } from "@/lib/catalog";

export const getServices = cache(async () =>
  db.select().from(services).where(eq(services.active, true)).orderBy(asc(services.sort)),
);

export const getService = cache(async (slug: string) => {
  const r = await db.select().from(services).where(and(eq(services.slug, slug), eq(services.active, true))).limit(1);
  return r[0] ?? null;
});

export const getPortfolio = cache(async () =>
  db.select().from(projects).where(and(eq(projects.isPortfolio, true), eq(projects.isDemo, false))).orderBy(desc(projects.featured), asc(projects.id)),
);

export const getPortfolioProject = cache(async (slug: string) => {
  const r = await db.select().from(projects).where(and(eq(projects.slug, slug), eq(projects.isPortfolio, true), eq(projects.isDemo, false))).limit(1);
  return r[0] ?? null;
});

export const getGallery = cache(async () =>
  db.select().from(galleryItems).where(eq(galleryItems.active, true)).orderBy(asc(galleryItems.sort)),
);

export const getTestimonials = cache(async () =>
  db.select().from(testimonials).where(and(eq(testimonials.active, true), eq(testimonials.consentToPublish, true))),
);

export const getPosts = cache(async (lang: Lang) =>
  db.select().from(blogPosts).where(and(eq(blogPosts.status, "published"), eq(blogPosts.lang, lang))).orderBy(desc(blogPosts.publishedAt)),
);

export const getPost = cache(async (lang: Lang, slug: string) => {
  const r = await db
    .select()
    .from(blogPosts)
    .where(and(eq(blogPosts.slug, slug), eq(blogPosts.lang, lang), eq(blogPosts.status, "published")))
    .limit(1);
  return r[0] ?? null;
});

/** Website content as a lookup that falls back to Malay, then to the provided default. */
export const getContent = cache(async (lang: Lang) => {
  const rows = await db.select().from(websiteContent);
  const map = new Map(rows.map((r) => [r.key, r]));
  return (key: string, fallback = "") => {
    const r = map.get(key);
    const v = (lang === "en" ? r?.valueEn || r?.valueMs : r?.valueMs) ?? "";
    return v || fallback;
  };
});
