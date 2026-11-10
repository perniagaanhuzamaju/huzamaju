import type { Metadata } from "next";
import { t, type Lang } from "@/lib/i18n";
import { COMPANY, waLink } from "@/lib/company";
import { pageMeta } from "@/lib/seo";
import { getContent, getServices } from "@/lib/data/public";
import { PageHero, Section } from "@/components/site/ui";
import { EnquiryForm } from "@/components/site/EnquiryForm";
import { IconWhatsApp, IconPhone, IconMail, IconPin, IconClock } from "@/components/site/icons";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/[lang]/contact">): Promise<Metadata> {
  const { lang } = (await params) as { lang: Lang };
  return pageMeta(lang, "/contact", lang === "ms" ? "Hubungi Kami" : "Contact Us",
    lang === "ms" ? `Hubungi HUZA MAJU di Kluang, Johor. WhatsApp ${COMPANY.phoneDisplay}, e-mel ${COMPANY.email}.` : `Contact HUZA MAJU in Kluang, Johor. WhatsApp ${COMPANY.phoneDisplay}, email ${COMPANY.email}.`);
}

export default async function Contact({ params }: PageProps<"/[lang]/contact">) {
  const { lang } = (await params) as { lang: Lang };
  const d = t(lang);
  const ms = lang === "ms";
  const [services, c] = await Promise.all([getServices(), getContent(lang)]);
  const map = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(COMPANY.address)}`;
  const rows = [
    [IconWhatsApp, "WhatsApp", COMPANY.phoneDisplay, waLink()],
    [IconPhone, ms ? "Telefon" : "Phone", COMPANY.phoneDisplay, `tel:${COMPANY.phoneIntl}`],
    [IconMail, d.labels.email, COMPANY.email, `mailto:${COMPANY.email}`],
    [IconPin, d.labels.address, COMPANY.address, map],
  ] as const;
  return (
    <>
      <PageHero lang={lang} eyebrow={d.nav.contact} title={ms ? "Ada projek? Jom bincang." : "Have a project? Let's talk."}
        lead={ms ? "Lawatan tapak dan sebut harga adalah percuma di sekitar Kluang. Kami menerima kerja di seluruh Malaysia." : "Site visits and quotations are free around Kluang. We take on work throughout Malaysia."} />
      <Section>
        <div className="grid gap-12 lg:grid-cols-[1fr_1.3fr]">
          <ul className="space-y-3">
            {rows.map(([Icon, k, v, link]) => (
              <li key={k}>
                <a href={link} target={link.startsWith("http") ? "_blank" : undefined} rel="noopener" className="card flex items-start gap-4 p-5 hover:border-ink">
                  <Icon className={`mt-0.5 shrink-0 ${k === "WhatsApp" ? "text-wa" : "text-gold-strong"}`} width={22} height={22} />
                  <span><span className="block text-xs font-bold uppercase tracking-wider text-mute">{k}</span><span className="font-bold">{v}</span></span>
                </a>
              </li>
            ))}
            {c("hours") && (
              <li className="card flex items-start gap-4 p-5">
                <IconClock className="mt-0.5 shrink-0 text-gold-strong" width={22} />
                <span><span className="block text-xs font-bold uppercase tracking-wider text-mute">{ms ? "Waktu operasi" : "Hours"}</span><span className="font-bold">{c("hours")}</span></span>
              </li>
            )}
            <li className="pt-2 text-sm text-mute">SSM {COMPANY.ssm}</li>
          </ul>
          <div>
            <h2 className="mb-5 text-2xl font-extrabold">{ms ? "Hantar pertanyaan" : "Send an enquiry"}</h2>
            <EnquiryForm lang={lang} services={services.map((s) => ({ slug: s.slug, title: ms ? s.titleMs : s.titleEn }))} />
          </div>
        </div>
      </Section>
    </>
  );
}
