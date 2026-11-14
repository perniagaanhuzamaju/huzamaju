import type { Metadata } from "next";
import { COMPANY } from "./company";
import { href, type Lang } from "./i18n";

/** Public address used in canonical links, sitemap and social cards. The old *.vercel.app address is never used. */
const envUrl = process.env.APP_URL?.replace(/\/$/, "");
export const SITE_URL = envUrl && !/\.vercel\.app$/.test(envUrl) ? envUrl : `https://${COMPANY.domain}`;

/** Official social pages (comma-separated SOCIAL_LINKS env, e.g. the Facebook page). Linked from the Organization data so Google ties them to this site. */
const SAME_AS = (process.env.SOCIAL_LINKS ?? "").split(",").map((x) => x.trim()).filter((x) => /^https:\/\//.test(x));

export function pageMeta(lang: Lang, path: string, title: string, description: string, image = "/img/og.jpg"): Metadata {
  const url = `${SITE_URL}${href(lang, path)}`;
  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: { ms: `${SITE_URL}${href("ms", path)}`, en: `${SITE_URL}${href("en", path)}`, "x-default": `${SITE_URL}${href("ms", path)}` },
    },
    openGraph: {
      type: "website",
      url,
      title,
      description,
      siteName: COMPANY.name,
      locale: lang === "ms" ? "ms_MY" : "en_MY",
      images: [{ url: `${SITE_URL}${image}`, width: 1200, height: 630 }],
    },
    twitter: { card: "summary_large_image", title, description, images: [`${SITE_URL}${image}`] },
  };
}

export function orgJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "GeneralContractor",
    "@id": `${SITE_URL}/#org`,
    name: COMPANY.name,
    alternateName: COMPANY.shortName,
    slogan: COMPANY.tagline.en,
    url: SITE_URL,
    logo: `${SITE_URL}/img/logo.png`,
    image: `${SITE_URL}/img/og.jpg`,
    telephone: COMPANY.phoneIntl,
    email: COMPANY.email,
    foundingDate: COMPANY.founded,
    address: {
      "@type": "PostalAddress",
      streetAddress: "No. 12A, Jalan Penaga 1, Kampung Dato Abdul Rahman Yassin",
      addressLocality: COMPANY.city,
      postalCode: COMPANY.postcode,
      addressRegion: COMPANY.state,
      addressCountry: "MY",
    },
    areaServed: [
      { "@type": "City", name: "Kluang" },
      { "@type": "State", name: "Johor" },
      { "@type": "Country", name: "Malaysia" },
    ],
    contactPoint: [{ "@type": "ContactPoint", telephone: COMPANY.phoneIntl, contactType: "customer service", areaServed: "MY", availableLanguage: ["ms", "en"] }],
    ...(SAME_AS.length ? { sameAs: SAME_AS } : {}),
    founder: { "@type": "Person", name: COMPANY.owner },
    knowsAbout: ["Building construction", "Renovation", "Civil engineering", "Road works", "Drainage", "Earthworks", "Facilities maintenance", "Cleaning", "ICT", "Design and build"],
  };
}

export function websiteJsonLd(lang: Lang) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    url: SITE_URL,
    name: COMPANY.shortName,
    alternateName: COMPANY.name,
    inLanguage: lang === "ms" ? "ms-MY" : "en-MY",
    publisher: { "@id": `${SITE_URL}/#org` },
  };
}

/** Breadcrumb trail for a page; each crumb is [name, path]. Home is added first. */
export function breadcrumbJsonLd(lang: Lang, crumbs: [string, string][]) {
  const all: [string, string][] = [[lang === "ms" ? "Utama" : "Home", "/"], ...crumbs];
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: all.map(([name, path], i) => ({ "@type": "ListItem", position: i + 1, name, item: `${SITE_URL}${href(lang, path)}` })),
  };
}

export const ldScript = (data: unknown) => ({ __html: JSON.stringify(data).replace(/</g, "\\u003c") });
