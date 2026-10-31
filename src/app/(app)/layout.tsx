import type { Metadata, Viewport } from "next";
import { jakarta } from "@/lib/fonts";
import "../globals.css";
import { SITE_URL } from "@/lib/seo";

export const viewport: Viewport = { themeColor: "#ffffff", width: "device-width", initialScale: 1 };

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "HUZA MAJU", template: "%s | HUZA MAJU" },
  icons: { icon: "/img/favicon.png", apple: "/img/apple-touch-icon.png" },
  robots: { index: false, follow: false },
};

/** Root layout for the application areas: login, quotation links, customer portal, partner portal and admin. */
export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ms-MY" className={jakarta.variable}>
      <body className="min-h-screen bg-sand font-sans text-ink">{children}</body>
    </html>
  );
}
