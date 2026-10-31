import type { Metadata } from "next";
import type { Lang } from "@/lib/i18n";
import { pageMeta } from "@/lib/seo";
import { PageHero, Section } from "@/components/site/ui";
import { PartnerRegisterForm } from "@/components/site/PartnerRegisterForm";

export async function generateMetadata({ params }: PageProps<"/[lang]/partners/register">): Promise<Metadata> {
  const { lang } = (await params) as { lang: Lang };
  return pageMeta(lang, "/partners/register", lang === "ms" ? "Daftar Rakan Niaga" : "Partner Registration", lang === "ms" ? "Daftar sebagai Rakan Rujukan atau Ejen Jualan Bebas HUZA MAJU." : "Register as a HUZA MAJU Referral Partner or Freelance Sales Agent.");
}

export default async function Register({ params }: PageProps<"/[lang]/partners/register">) {
  const { lang } = (await params) as { lang: Lang };
  const ms = lang === "ms";
  return (
    <>
      <PageHero lang={lang} eyebrow={ms ? "Program Rakan Niaga" : "Partner Programme"} title={ms ? "Daftar rakan niaga." : "Become a partner."}
        lead={ms ? "Pendaftaran disemak oleh admin. Selepas diluluskan, anda akan menerima ID rakan dan pautan rujukan unik dalam dashboard." : "Registrations are reviewed by admin. Once approved you get a partner ID and a unique referral link in your dashboard."} />
      <Section><div className="mx-auto max-w-3xl"><PartnerRegisterForm lang={lang} /></div></Section>
    </>
  );
}
