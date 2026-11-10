import { STOCK } from "@/lib/stock";
import Link from "next/link";
import type { Metadata } from "next";
import { href, t, type Lang } from "@/lib/i18n";
import { COMPANY } from "@/lib/company";
import { pageMeta } from "@/lib/seo";
import { getContent } from "@/lib/data/public";
import { PageHero, Section, Heading, Photo } from "@/components/site/ui";
import { IconCheck } from "@/components/site/icons";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/[lang]/about">): Promise<Metadata> {
  const { lang } = (await params) as { lang: Lang };
  return pageMeta(lang, "/about", lang === "ms" ? "Tentang Kami" : "About Us",
    lang === "ms" ? "Latar belakang, visi, misi, nilai dan pengurusan PERNIAGAAN HUZA MAJU, kontraktor Bumiputera di Kluang, Johor sejak 2018." : "Background, vision, mission, values and management of PERNIAGAAN HUZA MAJU, a Bumiputera contractor in Kluang, Johor since 2018.");
}

export default async function About({ params }: PageProps<"/[lang]/about">) {
  const { lang } = (await params) as { lang: Lang };
  const d = t(lang);
  const ms = lang === "ms";
  const c = await getContent(lang);

  const mission = ms
    ? ["Menyiapkan setiap projek mengikut spesifikasi, bajet dan jadual yang dipersetujui.", "Mengutamakan keselamatan pekerja, orang awam dan harta benda di setiap tapak.", "Membina hubungan jangka panjang melalui urusan yang telus dan jujur.", "Melabur dalam kemahiran pasukan, jentera dan kaedah kerja yang lebih cekap.", "Menyumbang kepada komuniti setempat dan melahirkan lebih ramai usahawan pembinaan Bumiputera."]
    : ["Deliver every project to the agreed specification, budget and schedule.", "Put the safety of workers, the public and property first on every site.", "Build long-term relationships through transparent, honest dealings.", "Invest in team skills, machinery and more efficient methods.", "Contribute to the local community and develop more Bumiputera construction entrepreneurs."];
  const values = ms
    ? [["Amanah", "Kami buat apa yang kami janji."], ["Kualiti", "Kemasan kemas dan tahan lama, bukan sekadar siap."], ["Selamat", "Tiada kerja yang cukup penting untuk dibuat secara tidak selamat."], ["Tepat Masa", "Jadual dipantau dari hari pertama hingga serah kunci."], ["Telus", "Harga, progres dan perubahan dimaklumkan dengan jelas."]]
    : [["Integrity", "We do what we promise."], ["Quality", "Neat, durable finishes, not just completion."], ["Safety", "No job is important enough to do unsafely."], ["On Time", "Schedules tracked from day one to handover."], ["Transparency", "Pricing, progress and changes communicated clearly."]];
  const expertise = ms
    ? ["Pembinaan bangunan", "Renovation kediaman", "Renovation komersial", "Kejuruteraan awam", "Infrastruktur", "Penyelenggaraan fasiliti", "Pembersihan", "Penyelesaian ICT", "Penyelarasan projek", "Reka & bina"]
    : ["Building construction", "Residential renovation", "Commercial renovation", "Civil engineering", "Infrastructure", "Facilities maintenance", "Cleaning", "ICT solutions", "Project coordination", "Design and build"];
  const stats = ["stat_years", "stat_projects", "stat_value", "stat_clients", "stat_workforce", "stat_states"]
    .map((k) => [c(k), c(`${k}_label`)] as const)
    .filter(([v]) => v);
  const blocks: [string, string][] = ms
    ? [
        ["Falsafah perniagaan", "Kepercayaan pelanggan dibina di tapak, bukan di atas kertas. Kami memilih kerja yang kami mampu siapkan dengan baik, dan bercakap benar tentang kos serta masa."],
        ["Keupayaan teknikal", "Kerja bangunan (B04, B24), kejuruteraan awam (CE01, CE06, CE08, CE21) dan M&E (M15) di bawah pendaftaran CIDB, disokong jentera sendiri: 3 excavator, 5 backhoe dan 2 lori."],
        ["Keupayaan tenaga kerja", "Struktur organisasi ringkas dengan bahagian kewangan, pentadbiran & HR dan teknikal (jurutera, juruukur bahan & penyelia tapak), dibantu tukang mahir dan subkontraktor tempatan yang dipercayai."],
        ["Pendekatan pengurusan projek", "Skop, harga, jadual bayaran dan tempoh siap dipersetujui secara bertulis. Penyelia berada di tapak, progres dilaporkan bersama gambar, dan sebarang perubahan dipersetujui sebelum dilaksanakan."],
        ["Jaminan kualiti", "Kawalan bahan, pemeriksaan kemasan harian, pemeriksaan bersama sebelum serahan dan pembaikan senarai kecacatan."],
        ["Komitmen keselamatan", "PPE, papan tanda dan kawalan tapak di setiap projek, termasuk method statement untuk kerja berisiko seperti perobohan."],
        ["Liputan perkhidmatan", "Berpangkalan di Kluang, Johor dan melaksanakan kerja di seluruh Malaysia."],
        ["Hala tuju pembangunan perniagaan", "Mengembangkan kerja reka & bina, penyelenggaraan fasiliti dan ICT, membina rangkaian rakan niaga di seluruh Malaysia, dan menggunakan teknologi seperti AI untuk sebut harga yang lebih pantas dan konsisten."],
      ]
    : [
        ["Business philosophy", "Client trust is built on site, not on paper. We take on work we can deliver well, and we are honest about cost and time."],
        ["Technical capabilities", "Building (B04, B24), civil engineering (CE01, CE06, CE08, CE21) and M&E (M15) works under CIDB registration, supported by our own machinery: 3 excavators, 5 backhoes and 2 lorries."],
        ["Workforce capabilities", "A lean organisation with finance, administration & HR and technical divisions (engineer, quantity surveyor & site supervisors), supported by skilled tradesmen and trusted local subcontractors."],
        ["Project management approach", "Scope, price, payment schedule and completion are agreed in writing. A supervisor is on site, progress is reported with photos, and any change is agreed before it is carried out."],
        ["Quality assurance", "Material control, daily finish checks, joint inspection before handover and defect rectification."],
        ["Safety commitment", "PPE, signage and site control on every project, including method statements for higher-risk work such as demolition."],
        ["Service coverage", "Based in Kluang, Johor and working throughout Malaysia."],
        ["Business development direction", "Growing design & build, facilities maintenance and ICT, building a nationwide partner network, and using technology such as AI for faster, more consistent quotations."],
      ];

  return (
    <>
      <PageHero lang={lang} eyebrow={d.nav.about} title={ms ? "Membina dengan amanah, menyiapkan dengan kualiti." : "Building with integrity, delivering with quality."} lead={c("about_intro")} image={STOCK.blueprint2} actual={false} />

      <Section>
        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            <Heading eyebrow={ms ? "Latar Belakang" : "Background"} title={ms ? "Bermula di Kluang, 2018." : "Founded in Kluang, 2018."} />
            <p className="mt-5 text-[16.5px] leading-relaxed text-mute">
              {ms
                ? "HUZA MAJU bermula dengan satu prinsip yang mudah: setiap kerja, besar atau kecil, mesti siap dengan kemas, selamat dan mengikut masa yang dijanjikan. Sejak itu kami terlibat dalam kerja jalan raya, kerja tanah, struktur awam, baik pulih bangunan kerajaan dan renovation untuk pelanggan swasta."
                : "HUZA MAJU started with one simple principle: every job, big or small, must be finished neatly, safely and on the promised date. Since then we have worked on roads, earthworks, civil structures, government building refurbishments and renovations for private clients."}
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="card p-6 sm:col-span-2">
              <p className="eyebrow">{ms ? "Visi" : "Vision"}</p>
              <p className="mt-3 text-[17px] font-semibold leading-relaxed">{c("vision")}</p>
            </div>
            <div className="card p-6 sm:col-span-2">
              <p className="eyebrow">{ms ? "Misi" : "Mission"}</p>
              <ul className="mt-3 space-y-2 text-[15px]">
                {mission.map((m) => (
                  <li key={m} className="flex gap-2.5"><IconCheck className="mt-0.5 shrink-0 text-gold-strong" width={18} /> {m}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </Section>

      <Section tone="sand">
        <Heading eyebrow={ms ? "Nilai Teras" : "Core Values"} title={ms ? "Apa yang kami pegang." : "What we stand for."} />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {values.map(([k, v]) => (
            <div key={k} className="card p-5">
              <h3 className="text-lg font-extrabold">{k}</h3>
              <p className="mt-2 text-[14.5px] text-mute">{v}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section>
        <div className="grid items-start gap-12 lg:grid-cols-[1fr_1.3fr]">
          <div className="card p-8">
            <p className="eyebrow">{ms ? "Pengurusan" : "Management"}</p>
            <h2 className="mt-4 text-2xl font-extrabold">{COMPANY.owner}</h2>
            <p className="mt-1 font-semibold text-gold-strong">{c("management_note")}</p>
            <p className="mt-5 text-[15.5px] leading-relaxed text-mute">
              {ms
                ? "Memimpin HUZA MAJU sejak penubuhannya pada 2018, bertanggungjawab ke atas hala tuju syarikat, perhubungan pelanggan dan pemantauan projek."
                : "Has led HUZA MAJU since its founding in 2018, responsible for company direction, client relationships and project oversight."}
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            {blocks.map(([k, v]) => (
              <div key={k} className="border-t-2 border-ink pt-4">
                <h3 className="font-bold">{k}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-mute">{v}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Section tone="dark" id="experience">
        <Heading eyebrow={ms ? "Pengalaman & Kepakaran" : "Our Experience & Expertise"} title={ms ? "Kontraktor pembinaan & perkhidmatan bersepadu." : "A construction & integrated services provider."} dark />
        {stats.length > 0 && (
          <div className="mt-10 grid grid-cols-2 gap-px overflow-hidden rounded-xl2 bg-white/10 md:grid-cols-3">
            {stats.map(([v, l]) => (
              <div key={l} className="bg-ink-2 p-6">
                <p className="text-4xl font-extrabold text-amber">{v}</p>
                <p className="mt-2 text-sm text-white/70">{l}</p>
              </div>
            ))}
          </div>
        )}
        <ul className="mt-10 flex flex-wrap gap-2">
          {expertise.map((x) => (
            <li key={x} className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold">{x}</li>
          ))}
        </ul>
        <div className="mt-10 flex flex-wrap gap-3">
          <Link href={href(lang, "/capabilities")} className="btn-gold">{d.nav.capabilities}</Link>
          <Link href={href(lang, "/projects")} className="btn border border-white/25 text-white hover:bg-white/10">{d.nav.projects}</Link>
        </div>
      </Section>

      <Section>
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <Photo src={STOCK.inspection} alt={ms ? "Jurutera memeriksa bangunan" : "Engineers inspecting a building"} lang={lang} actual={false} className="aspect-[16/10]" />
          <div>
            <Heading eyebrow={d.labels.registered} title={ms ? "Berdaftar & diiktiraf." : "Registered & recognised."} />
            <ul className="mt-6 space-y-2 text-[15px]">
              {[
                `SSM ${COMPANY.ssm}`,
                `CIDB ${COMPANY.cidb} · ${COMPANY.cidbGrades}`,
                ms ? "Sijil Perolehan Kerja Kerajaan (SPKK) & Sijil Taraf Bumiputera (STB)" : "Government Works Procurement Certificate (SPKK) & Bumiputera Status (STB)",
                `JCCD ${COMPANY.jccd}`,
                `MOF ${COMPANY.mof}`,
              ].map((x) => (
                <li key={x} className="flex gap-2.5"><IconCheck className="mt-0.5 shrink-0 text-gold-strong" width={18} /> {x}</li>
              ))}
            </ul>
          </div>
        </div>
      </Section>
    </>
  );
}
