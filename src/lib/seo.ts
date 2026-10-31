import type { Metadata } from "next";
import { COMPANY } from "./company";
import { href, type Lang } from "./i18n";

export const SITE_URL = process.env.APP_URL || `https://${COMPANY.domain}`;

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
    areaServed: [{ "@type": "State", name: "Johor" }, { "@type": "Country", name: "Malaysia" }],
    founder: { "@type": "Person", name: COMPANY.owner },
    knowsAbout: ["Building construction", "Renovation", "Civil engineering", "Road works", "Drainage", "Earthworks", "Facilities maintenance", "Cleaning", "ICT", "Design and build"],
  };
}
