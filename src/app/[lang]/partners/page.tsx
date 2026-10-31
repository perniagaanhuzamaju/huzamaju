import Link from "next/link";
import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { href, t, type Lang } from "@/lib/i18n";
import { quoteCategory } from "@/lib/catalog";
import { pageMeta } from "@/lib/seo";
import { db } from "@/db";
import { commissionRules } from "@/db/schema";
import { PageHero, Section, Heading } from "@/components/site/ui";
import { IconCheck } from "@/components/site/icons";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/[lang]/partners">): Promise<Metadata> {
  const { lang } = (await params) as { lang: Lang };
  return pageMeta(lang, "/partners", lang === "ms" ? "Program Rakan Niaga: Rujukan & Ejen Jualan" : "Business Partner Programme",
    lang === "ms" ? "Hubungkan Peluang. Raih Bersama. Sertai program Rakan Rujukan atau Ejen Jualan Bebas HUZA MAJU." : "Connect Opportunities. Earn Together. Join HUZA MAJU as a Referral Partner or Freelance Sales Agent.");
}

export default async function Partners({ params }: PageProps<"/[lang]/partners">) {
  const { lang } = (await params) as { lang: Lang };
  const d = t(lang);
  const ms = lang === "ms";
  const rules = await db.select().from(commissionRules).where(eq(commissionRules.active, true));
  const steps = ms
    ? ["Anda hantar lead melalui pautan rujukan atau dashboard.", "Sistem semak lead pendua secara automatik.", "Admin sahkan lead.", "Pasukan kami membuat susulan dengan pelanggan.", "Projek berjaya diperoleh.", "Bayaran pelanggan mengikut peringkat disahkan.", "Komisen menjadi layak.", "Admin luluskan pembayaran.", "Anda terima notifikasi pembayaran."]
    : ["You submit a lead via your referral link or dashboard.", "The system checks for duplicates automatically.", "Admin verifies the lead.", "Our team follows up with the customer.", "The project is secured.", "The client's milestone payment is verified.", "Commission becomes eligible.", "Admin approves the payment.", "You receive a payment notification."];
  const tiers = [
    {
      name: ms ? "Rakan Rujukan" : "Referral Partner",
      who: ms ? "Individu yang memperkenalkan bakal pelanggan." : "Individuals who introduce potential customers.",
      f: ms ? ["Pendaftaran & ID rakan", "Pautan rujukan unik", "Hantar lead", "Jejak rujukan & status projek", "Jejak komisen & sejarah pendapatan"] : ["Registration & partner ID", "Unique referral link", "Lead submission", "Referral & project status tracking", "Commission tracking & earnings history"],
    },
    {
      name: ms ? "Ejen Jualan Bebas" : "Freelance Sales Agent",
      who: ms ? "Individu yang aktif mempromosikan servis HUZA MAJU." : "Individuals who actively promote HUZA MAJU services.",
      f: ms ? ["Dashboard jualan", "Pengurusan lead & pelanggan", "Jejak projek", "Jejak komisen & sejarah bayaran", "Bahan pemasaran & sumber jualan"] : ["Sales dashboard", "Lead & customer management", "Project tracking", "Commission & payment history", "Marketing materials & sales resources"],
    },
  ];
  return (
    <>
      <PageHero lang={lang} eyebrow={ms ? "Program Rakan Niaga HUZA MAJU" : "HUZA MAJU Business Partner Programme"} title={ms ? "Hubungkan Peluang. Raih Bersama." : "Connect Opportunities. Earn Together."}
        lead={ms ? "Bantu kami bertemu pelanggan yang memerlukan kerja binaan, renovation, sivil, penyelenggaraan, pembersihan atau ICT di seluruh Malaysia, dan raih komisen bagi setiap projek yang berjaya." : "Help us reach customers who need construction, renovation, civil, maintenance, cleaning or ICT work across Malaysia, and earn commission on every secured project."} />
      <Section>
        <div className="grid gap-5 md:grid-cols-2">
          {tiers.map((x) => (
            <div key={x.name} className="card p-7">
              <h2 className="text-2xl font-extrabold">{x.name}</h2>
              <p className="mt-2 text-mute">{x.who}</p>
              <ul className="mt-6 space-y-2.5">
                {x.f.map((f) => <li key={f} className="flex gap-2.5"><IconCheck className="mt-0.5 shrink-0 text-gold-strong" width={18} /> {f}</li>)}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href={href(lang, "/partners/register")} className="btn-dark">{d.cta.becomePartner}</Link>
          <Link href="/login?next=/partner" className="btn-line">{ms ? "Log masuk rakan" : "Partner login"}</Link>
        </div>
      </Section>
      <Section tone="sand">
        <Heading eyebrow={ms ? "Aliran Komisen" : "Commission Workflow"} title={ms ? "Telus dari lead hingga bayaran." : "Transparent from lead to payout."}
          lead={ms ? "Komisen tidak dibayar hanya kerana sebut harga dijana. Ia hanya layak selepas projek diperoleh dan bayaran pelanggan disahkan." : "Commission is never paid just because a quotation was generated. It becomes eligible only after the project is secured and the client's payment is verified."} />
        <ol className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {steps.map((s, i) => (
            <li key={s} className="card flex items-start gap-4 p-5">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-ink text-sm font-extrabold text-amber">{i + 1}</span>
              <span className="text-[15px] font-medium">{s}</span>
            </li>
          ))}
        </ol>
      </Section>
      <Section>
        <Heading eyebrow={ms ? "Kadar Komisen" : "Commission Rates"} title={ms ? "Ditetapkan mengikut kategori & nilai projek." : "Set by category & project value."} />
        {rules.length ? (
          <div className="mt-8 overflow-x-auto">
            <table className="table min-w-[600px]">
              <thead><tr><th>{ms ? "Skim" : "Scheme"}</th><th>{ms ? "Kategori" : "Category"}</th><th>{ms ? "Nilai projek" : "Project value"}</th><th>{ms ? "Komisen" : "Commission"}</th></tr></thead>
              <tbody>
                {rules.map((r) => (
                  <tr key={r.id}>
                    <td className="font-semibold">{r.name}</td>
                    <td>{r.serviceCategory ? quoteCategory(r.serviceCategory)?.name[lang] ?? r.serviceCategory : ms ? "Semua" : "All"}</td>
                    <td>{r.minProjectValue ? `≥ RM${r.minProjectValue.toLocaleString()}` : "-"}{r.maxProjectValue ? ` ≤ RM${r.maxProjectValue.toLocaleString()}` : ""}</td>
                    <td className="font-bold">{r.kind === "percent" ? `${r.amount}%` : `RM${r.amount.toLocaleString()}`}{r.campaignBonus ? ` + RM${r.campaignBonus} bonus` : ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="lead">{ms ? "Kadar komisen semasa dimaklumkan semasa kelulusan pendaftaran dan dipaparkan dalam dashboard rakan." : "Current commission rates are shared on approval and shown in the partner dashboard."}</p>
        )}
      </Section>
    </>
  );
}
