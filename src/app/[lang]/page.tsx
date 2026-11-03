import Link from "next/link";
import type { Metadata } from "next";
import { href, t, type Lang } from "@/lib/i18n";
import { COMPANY } from "@/lib/company";
import { PROJECT_CATEGORIES, SERVICE_GROUPS } from "@/lib/catalog";
import { ProjectCover } from "@/components/site/ProjectCover";
import { pageMeta } from "@/lib/seo";
import { getContent, getPortfolio, getServices, getTestimonials } from "@/lib/data/public";
import { Section, Heading, Photo, ArrowLink } from "@/components/site/ui";
import { EnquiryForm } from "@/components/site/EnquiryForm";
import { HeroVisual } from "@/components/site/HeroVisual";
import { STOCK } from "@/lib/stock";
import {
  IconArrow, IconBuilding, IconRoad, IconBroom, IconChip, IconShield, IconClock, IconDoc, IconUsers, IconTruck, IconSpark, IconCheck, IconPhone, IconMail, IconPin, IconWhatsApp,
} from "@/components/site/icons";
import { waLink } from "@/lib/company";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/[lang]">): Promise<Metadata> {
  const { lang } = (await params) as { lang: Lang };
  return pageMeta(
    lang,
    "/",
    lang === "ms" ? "HUZA MAJU | Kontraktor Binaan, Renovation & Sivil Kluang, Johor" : "HUZA MAJU | Construction & Civil Contractor in Johor",
    lang === "ms"
      ? "Kontraktor Kluang & Johor: pembinaan, renovation rumah dan komersial, jalan raya, saliran, penyelenggaraan, pembersihan dan ICT. CIDB G2. Sebut harga AI segera."
      : "Construction company in Johor: building, residential and commercial renovation, roads, drainage, maintenance, cleaning and ICT. CIDB G2. Instant AI estimates.",
  );
}

const groupIcon: Record<string, typeof IconBuilding> = { building: IconBuilding, civil: IconRoad, facilities: IconBroom, ict: IconChip };

export default async function Home({ params }: PageProps<"/[lang]">) {
  const { lang } = (await params) as { lang: Lang };
  const d = t(lang);
  const ms = lang === "ms";
  const [c, services, portfolio, testimonials] = await Promise.all([getContent(lang), getServices(), getPortfolio(), getTestimonials()]);
  const featured = portfolio.filter((p) => p.featured).slice(0, 6);
  const stats = [
    ["stat_years", "stat_years_label"],
    ["stat_projects", "stat_projects_label"],
    ["stat_value", "stat_value_label"],
    ["stat_clients", "stat_clients_label"],
    ["stat_workforce", "stat_workforce_label"],
    ["stat_states", "stat_states_label"],
    ["stat_machinery", "stat_machinery_label"],
  ]
    .map(([v, l]) => [c(v), c(l)] as const)
    .filter(([v]) => v)
    .slice(0, 4);

  const capabilities = [
    [IconShield, ms ? "CIDB G2 · B, CE, ME" : "CIDB G2 · B, CE, ME", ms ? "Bangunan, Kejuruteraan Awam dan Mekanikal & Elektrikal. SPKK, STB, JCCD & MOF." : "Building, Civil Engineering and M&E. SPKK, STB, JCCD & MOF registered."],
    [IconTruck, ms ? "Jentera sendiri" : "Own machinery", ms ? "Excavator, backhoe dan lori sedia digerakkan ke tapak." : "Excavators, backhoes and lorries ready to mobilise."],
    [IconUsers, ms ? "Pasukan teknikal" : "Technical team", ms ? "Penyelia tapak, jurutera dan juruukur bahan dalam satu pasukan." : "Site supervisors, engineer and quantity surveyor in one team."],
    [IconDoc, ms ? "Dokumen lengkap" : "Complete documentation", ms ? "BQ, method statement dan dokumen tender disediakan." : "BQs, method statements and tender documents prepared."],
  ] as const;

  const industries = ms
    ? ["Pemilik rumah", "Syarikat swasta", "Pemaju hartanah", "Kilang & industri", "Pemilik premis komersial", "Kontraktor utama", "Subkontraktor", "Syarikat pengurusan fasiliti", "Agensi kerajaan & institusi"]
    : ["Homeowners", "Private companies", "Property developers", "Factories & industry", "Commercial property owners", "Main contractors", "Subcontractors", "Facilities management companies", "Government & institutions"];

  const why = [
    [ms ? "Amanah" : "Integrity", ms ? "Kami buat apa yang kami janji, dan jujur tentang kos serta masa." : "We do what we promise, and we are honest about cost and time."],
    [ms ? "Harga telus" : "Transparent pricing", ms ? "Sebut harga dipecahkan ikut item kerja daripada pangkalan harga semasa." : "Quotations broken down by work item from a current pricing database."],
    [ms ? "Tepat masa" : "On schedule", ms ? "Jadual dirancang dan dipantau dari hari pertama hingga serah kunci." : "Schedules planned and tracked from day one to handover."],
    [ms ? "Selamat" : "Safety first", ms ? "PPE, papan tanda dan kawalan tapak di setiap projek." : "PPE, signage and site control on every project."],
    [ms ? "Laporan progres" : "Progress reports", ms ? "Kemas kini bergambar tanpa anda perlu ke tapak." : "Photo updates without you needing to visit the site."],
    [ms ? "Kekal dihubungi" : "Always reachable", ms ? "Kami kekal boleh dihubungi selepas projek diserahkan." : "We stay reachable after the project is handed over."],
  ];

  return (
    <>
      {/* 1. Hero */}
      <section className="hero-dark relative overflow-hidden text-white">
        <div className="wrap relative z-10 grid items-center gap-10 pt-12 pb-16 md:pt-20 md:pb-24 lg:grid-cols-[1.05fr_1fr]">
          <div className="rise">
            <span className="flex items-start gap-2.5 text-[11.5px] leading-relaxed font-bold tracking-[0.12em] text-amber uppercase md:text-[12px]">
              <span className="mt-[7px] h-1.5 w-6 shrink-0 rounded-full bg-amber" /> {d.hero.eyebrow}
            </span>
            <h1 className="mt-6 text-[40px] leading-[1.03] font-extrabold tracking-[-0.03em] md:text-[66px]">
              Building Solutions.<br /><span className="text-gradient-gold">Creating Opportunities.</span>
            </h1>
            {ms && <p className="mt-3 text-[15px] font-semibold text-white/70">Membina Penyelesaian. Mencipta Peluang.</p>}
            <p className="mt-6 max-w-xl text-[17px] leading-relaxed text-white/65 md:text-lg">{d.hero.text}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={href(lang, "/quotation")} className="btn-gold shadow-[0_0_40px_rgba(242,183,5,0.35)]">
                <IconSpark /> {d.cta.getInstant}
              </Link>
              <Link href={href(lang, "/services")} className="btn border border-white/20 bg-white/5 text-white backdrop-blur hover:bg-white/10">
                {d.cta.explore} <IconArrow />
              </Link>
            </div>
            <dl className="mt-10 grid max-w-md grid-cols-3 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] text-sm backdrop-blur">
              {[
                ["CIDB", COMPANY.cidbGrades],
                [ms ? "Taraf" : "Status", "Bumiputera"],
                [ms ? "Sejak" : "Since", "2018"],
              ].map(([k, v]) => (
                <div key={k} className="border-r border-white/10 px-4 py-3 last:border-r-0">
                  <dt className="text-[11px] font-semibold tracking-wider text-white/45 uppercase">{k}</dt>
                  <dd className="mt-0.5 font-bold text-white">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="rise">
            <HeroVisual lang={lang} />
          </div>
        </div>
      </section>

      {/* stats */}
      {stats.length > 0 && (
        <div className="border-y border-white/10 bg-[#0b0d10] text-white">
          <div className="wrap grid grid-cols-2 md:grid-cols-4">
            {stats.map(([v, l], i) => (
              <div key={i} className={`px-2 py-8 md:px-6 ${i % 2 ? "" : "border-r"} md:border-r border-white/10 last:border-r-0`}>
                <p className="text-gradient-gold text-[34px] leading-none font-extrabold tracking-tight md:text-[44px]">{v}</p>
                <p className="mt-2 text-sm font-medium text-white/55">{l}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. Company introduction */}
      <Section>
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <Photo src={STOCK.teamSite} alt={ms ? "Pasukan kerja di tapak binaan" : "Site team at a construction site"} lang={lang} actual={false} className="aspect-[4/3.2]" />
          <div>
            <Heading eyebrow={d.home.introEyebrow} title={d.home.introTitle} />
            <p className="mt-5 text-[17px] leading-relaxed text-mute">{c("about_intro")}</p>
            <p className="mt-4 text-[17px] leading-relaxed text-mute">
              {ms
                ? "Dengan pasukan teknikal sendiri, jentera yang sedia digerakkan dan rangkaian pembekal tempatan, kami bergerak pantas dan mengawal kos tanpa menjejaskan kualiti."
                : "With our own technical team, ready-to-mobilise machinery and a local supplier network, we move quickly and control cost without compromising quality."}
            </p>
            <div className="mt-8"><ArrowLink to="/about" lang={lang}>{d.cta.readMore}</ArrowLink></div>
          </div>
        </div>
      </Section>

      {/* 3. Capabilities */}
      <Section tone="sand">
        <Heading eyebrow={d.home.capEyebrow} title={d.home.capTitle} />
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {capabilities.map(([Icon, title, text]) => (
            <div key={title} className="card p-6">
              <span className="inline-grid h-11 w-11 place-items-center rounded-xl bg-ink text-amber"><Icon /></span>
              <h3 className="mt-5 text-lg font-bold">{title}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-mute">{text}</p>
            </div>
          ))}
        </div>
        <div className="mt-8"><ArrowLink to="/capabilities" lang={lang}>{d.nav.capabilities}</ArrowLink></div>
      </Section>

      {/* 4. Core services */}
      <Section>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <Heading eyebrow={d.home.servicesEyebrow} title={d.home.servicesTitle} />
          <ArrowLink to="/services" lang={lang}>{d.cta.viewAll} ({services.length})</ArrowLink>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-2">
          {SERVICE_GROUPS.map((g) => {
            const Icon = groupIcon[g.key];
            const list = services.filter((s) => s.groupKey === g.key);
            return (
              <Link key={g.key} href={href(lang, `/services#${g.key}`)} className="group card grid overflow-hidden sm:grid-cols-[200px_1fr]">
                <Photo src={g.image} alt="" lang={lang} actual={false} className="min-h-[180px] rounded-none" sizes="(max-width: 640px) 100vw, 200px" />
                <div className="p-6">
                  <Icon className="text-gold-strong" />
                  <h3 className="mt-3 text-xl font-bold">{g.name[lang]}</h3>
                  <p className="mt-2 text-[15px] text-mute">{g.tagline[lang]}</p>
                  <p className="mt-4 text-sm font-semibold text-ink-2">
                    {list.slice(0, 4).map((s) => (lang === "ms" ? s.titleMs : s.titleEn)).join(" · ")}
                    {list.length > 4 && ` · +${list.length - 4}`}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </Section>

      {/* 5. Industries served */}
      <Section tone="dark">
        <Heading eyebrow={d.home.industriesEyebrow} title={d.home.industriesTitle} dark />
        <ul className="mt-12 grid gap-px overflow-hidden rounded-xl2 bg-white/10 sm:grid-cols-2 lg:grid-cols-3">
          {industries.map((x) => (
            <li key={x} className="flex items-center gap-3 bg-ink-2 px-6 py-5 text-[16px] font-semibold">
              <IconCheck className="text-amber" /> {x}
            </li>
          ))}
        </ul>
        <div className="mt-10 flex flex-wrap gap-3">
          <Link href={href(lang, "/solutions/pemilik-rumah")} className="btn border border-white/25 text-white hover:bg-white/10">{ms ? "Untuk pemilik rumah" : "For homeowners"}</Link>
          <Link href={href(lang, "/solutions/korporat")} className="btn border border-white/25 text-white hover:bg-white/10">{ms ? "Untuk korporat" : "For corporates"}</Link>
          <Link href={href(lang, "/solutions/sivil-infrastruktur")} className="btn border border-white/25 text-white hover:bg-white/10">{ms ? "Sivil & infrastruktur" : "Civil & infrastructure"}</Link>
        </div>
      </Section>

      {/* 6. Why choose */}
      <Section>
        <Heading eyebrow={d.home.whyEyebrow} title={d.home.whyTitle} />
        <div className="mt-12 grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
          {why.map(([title, text], i) => (
            <div key={title} className="border-t-2 border-ink pt-5">
              <p className="text-sm font-bold text-gold-strong">0{i + 1}</p>
              <h3 className="mt-1 text-lg font-bold">{title}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-mute">{text}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* 7. Featured projects */}
      <Section tone="sand">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <Heading eyebrow={d.home.projectsEyebrow} title={d.home.projectsTitle} />
          <ArrowLink to="/projects" lang={lang}>{d.cta.viewAll}</ArrowLink>
        </div>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((p) => (
            <Link key={p.id} href={href(lang, `/projects/${p.slug}`)} className="group card overflow-hidden">
              {p.coverImage ? (
                <Photo src={p.coverImage} alt={lang === "ms" ? p.titleMs : p.titleEn} lang={lang} className="aspect-[4/3] rounded-none" sizes="(max-width: 640px) 100vw, 33vw" />
              ) : (
                <ProjectCover categoryKey={p.category} category={PROJECT_CATEGORIES.find((c) => c.key === p.category)?.name[lang]} className="aspect-[4/3]" />
              )}
              <div className="p-5">
                <p className="text-xs font-bold uppercase tracking-wider text-gold-strong">{p.clientPublic && p.clientName ? p.clientName : p.role}</p>
                <h3 className="mt-2 font-bold leading-snug group-hover:underline">{lang === "ms" ? p.titleMs : p.titleEn}</h3>
                {p.location && <p className="mt-2 text-sm text-mute">{p.location}</p>}
              </div>
            </Link>
          ))}
        </div>
      </Section>

      {/* 8. AI quotation */}
      <Section>
        <div className="grid items-center gap-12 overflow-hidden rounded-[28px] bg-ink p-8 text-white md:p-14 lg:grid-cols-[1.2fr_1fr]">
          <div>
            <span className="eyebrow">{d.home.aiEyebrow}</span>
            <h2 className="h2">{d.home.aiTitle}</h2>
            <p className="mt-5 text-[17px] leading-relaxed text-white/70">{d.home.aiText}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={href(lang, "/quotation")} className="btn-gold"><IconSpark /> {d.cta.instantEstimate}</Link>
            </div>
          </div>
          <ol className="space-y-3">
            {(ms
              ? ["Pilih kategori & kerja", "Terangkan projek, ukuran & gambar", "AI pecahkan skop & kuantiti", "Sistem kira harga dari pangkalan harga HUZA MAJU", "Muat turun PDF atau minta lawatan tapak"]
              : ["Choose category & work", "Describe the project, measurements & photos", "AI breaks down scope & quantities", "System prices it from the HUZA MAJU pricing database", "Download PDF or request a site visit"]
            ).map((s, i) => (
              <li key={s} className="flex items-center gap-4 rounded-xl bg-white/5 px-5 py-4">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-amber text-sm font-extrabold text-ink">{i + 1}</span>
                <span className="font-semibold">{s}</span>
              </li>
            ))}
          </ol>
        </div>
      </Section>

      {/* 9. Partner programme */}
      <Section tone="sand">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <Heading eyebrow={d.home.partnerEyebrow} title={d.home.partnerTitle} lead={d.home.partnerText} />
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={href(lang, "/partners")} className="btn-dark">{d.cta.becomePartner}</Link>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              [ms ? "Rakan Rujukan" : "Referral Partner", ms ? "Perkenalkan pelanggan melalui pautan atau borang. Kami uruskan selebihnya." : "Introduce customers via your link or a form. We handle the rest."],
              [ms ? "Ejen Jualan Bebas" : "Freelance Sales Agent", ms ? "Promosikan servis HUZA MAJU secara aktif dengan dashboard, bahan pemasaran & penjejakan." : "Actively promote HUZA MAJU with a dashboard, marketing materials & tracking."],
            ].map(([title, text]) => (
              <div key={title} className="card p-6">
                <h3 className="text-lg font-bold">{title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-mute">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {testimonials.length > 0 && (
        <Section>
          <Heading eyebrow={ms ? "Testimoni" : "Testimonials"} title={ms ? "Kata pelanggan kami." : "What our clients say."} />
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {testimonials.slice(0, 3).map((x) => (
              <blockquote key={x.id} className="card p-6">
                <p className="text-[15px] leading-relaxed">“{lang === "en" && x.textEn ? x.textEn : x.textMs}”</p>
                <footer className="mt-4 text-sm font-bold">{x.name}{x.company && <span className="font-normal text-mute"> · {x.company}</span>}</footer>
              </blockquote>
            ))}
          </div>
        </Section>
      )}

      {/* 10 + 11. Corporate enquiry & contact */}
      <Section id="enquiry">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.2fr]">
          <div>
            <Heading eyebrow={d.home.enquiryEyebrow} title={d.home.enquiryTitle} lead={d.home.enquiryText} />
            <ul className="mt-8 space-y-3">
              <li>
                <a href={waLink()} target="_blank" rel="noopener" className="card flex items-center gap-4 p-4 hover:border-ink">
                  <IconWhatsApp className="text-wa" width={24} height={24} />
                  <span><span className="block text-xs font-bold uppercase tracking-wider text-mute">WhatsApp</span><span className="font-bold">{COMPANY.phoneDisplay}</span></span>
                </a>
              </li>
              <li>
                <a href={`tel:${COMPANY.phoneIntl}`} className="card flex items-center gap-4 p-4 hover:border-ink">
                  <IconPhone className="text-gold-strong" />
                  <span><span className="block text-xs font-bold uppercase tracking-wider text-mute">{ms ? "Telefon" : "Phone"}</span><span className="font-bold">{COMPANY.phoneDisplay}</span></span>
                </a>
              </li>
              <li>
                <a href={`mailto:${COMPANY.email}`} className="card flex items-center gap-4 p-4 hover:border-ink">
                  <IconMail className="text-gold-strong" />
                  <span><span className="block text-xs font-bold uppercase tracking-wider text-mute">{d.labels.email}</span><span className="font-bold">{COMPANY.email}</span></span>
                </a>
              </li>
              <li className="card flex items-center gap-4 p-4">
                <IconPin className="shrink-0 text-gold-strong" />
                <span><span className="block text-xs font-bold uppercase tracking-wider text-mute">{d.labels.address}</span><span className="font-semibold">{COMPANY.address}</span></span>
              </li>
              {c("hours") && (
                <li className="card flex items-center gap-4 p-4">
                  <IconClock className="shrink-0 text-gold-strong" />
                  <span className="font-semibold">{c("hours")}</span>
                </li>
              )}
            </ul>
          </div>
          <EnquiryForm lang={lang} kind="corporate" services={services.map((s) => ({ slug: s.slug, title: lang === "ms" ? s.titleMs : s.titleEn }))} />
        </div>
      </Section>
    </>
  );
}
