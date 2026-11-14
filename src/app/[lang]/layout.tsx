import type { Metadata, Viewport } from "next";
import { jakarta } from "@/lib/fonts";
import Script from "next/script";
import { notFound } from "next/navigation";
import "../globals.css";
import { Header } from "@/components/site/Header";
import { Footer, WhatsAppFloat } from "@/components/site/Footer";
import { isLang, LANGS } from "@/lib/i18n";
import { COMPANY } from "@/lib/company";
import { ldScript, orgJsonLd, SITE_URL, websiteJsonLd } from "@/lib/seo";

export function generateStaticParams() {
  return LANGS.map((lang) => ({ lang }));
}

export const viewport: Viewport = { themeColor: "#ffffff", width: "device-width", initialScale: 1 };

export async function generateMetadata({ params }: LayoutProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  const ms = lang !== "en";
  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: ms
        ? "Kontraktor Binaan & Renovation di Kluang, Johor | HUZA MAJU"
        : "Construction & Renovation Contractor in Kluang, Johor | HUZA MAJU",
      template: "%s | HUZA MAJU",
    },
    description: ms
      ? "PERNIAGAAN HUZA MAJU: kontraktor Bumiputera berdaftar CIDB (B, CE, ME) di Kluang, Johor, berkhidmat di seluruh Malaysia. Pembinaan, renovation, jalan raya, saliran, penyelenggaraan, pembersihan & ICT."
      : "PERNIAGAAN HUZA MAJU: CIDB-registered (B, CE, ME) Bumiputera contractor in Kluang, Johor, serving all of Malaysia. Construction, renovation, roads, drainage, maintenance, cleaning & ICT.",
    icons: { icon: "/img/favicon.png", apple: "/img/apple-touch-icon.png" },
    verification: {
      ...(process.env.GOOGLE_SITE_VERIFICATION ? { google: process.env.GOOGLE_SITE_VERIFICATION } : {}),
      ...(process.env.BING_SITE_VERIFICATION ? { other: { "msvalidate.01": process.env.BING_SITE_VERIFICATION } } : {}),
    },
    applicationName: COMPANY.shortName,
  };
}

export default async function SiteLayout({ children, params }: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const ga = process.env.NEXT_PUBLIC_GA_ID;
  return (
    <html lang={lang === "ms" ? "ms-MY" : "en-MY"} className={jakarta.variable}>
      <body className="flex min-h-screen flex-col font-sans">
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[60] focus:rounded focus:bg-ink focus:px-3 focus:py-2 focus:text-white">
          {lang === "ms" ? "Langkau ke kandungan" : "Skip to content"}
        </a>
        <Header lang={lang} />
        <main id="main" className="flex-1">
          {children}
        </main>
        <Footer lang={lang} />
        <WhatsAppFloat lang={lang} />
        <script type="application/ld+json" dangerouslySetInnerHTML={ldScript(orgJsonLd())} />
        <script type="application/ld+json" dangerouslySetInnerHTML={ldScript(websiteJsonLd(lang))} />
        {ga && (
          <>
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${ga}`} strategy="afterInteractive" />
            <Script id="ga" strategy="afterInteractive">
              {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${ga}',{anonymize_ip:true});`}
            </Script>
          </>
        )}
      </body>
    </html>
  );
}
