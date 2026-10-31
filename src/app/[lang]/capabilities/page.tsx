import Link from "next/link";
import type { Metadata } from "next";
import { href, t, type Lang } from "@/lib/i18n";
import { COMPANY } from "@/lib/company";
import { pageMeta } from "@/lib/seo";
import { PageHero, Section, Heading, Photo } from "@/components/site/ui";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/[lang]/capabilities">): Promise<Metadata> {
  const { lang } = (await params) as { lang: Lang };
  return pageMeta(lang, "/capabilities", lang === "ms" ? "Keupayaan: Pendaftaran, Jentera & Kaedah Kerja" : "Capabilities: Registration, Machinery & Methods",
    lang === "ms" ? "Pendaftaran CIDB G2 (B, CE, ME), JCCD, MOF, jentera sendiri dan kaedah kerja HUZA MAJU." : "HUZA MAJU's CIDB G2 (B, CE, ME), JCCD and MOF registration, own machinery and work methods.");
}

export default async function Capabilities({ params }: PageProps<"/[lang]/capabilities">) {
  const { lang } = (await params) as { lang: Lang };
  const d = t(lang);
  const ms = lang === "ms";
  const grades = [
    ["G2 B", ms ? "Pembinaan Bangunan" : "Building Construction", "B04 · B24"],
    ["G2 CE", ms ? "Kejuruteraan Awam" : "Civil Engineering", "CE01 · CE06 · CE08 · CE21"],
    ["G2 ME", ms ? "Mekanikal & Elektrikal" : "Mechanical & Electrical", "M15"],
  ];
  const regs = [
    ["CIDB", ms ? "Perakuan Pendaftaran Kontraktor (PPK)" : "Contractor Registration Certificate (PPK)", COMPANY.cidb],
    ["CIDB", ms ? "Sijil Perolehan Kerja Kerajaan (SPKK)" : "Government Works Procurement Certificate (SPKK)", COMPANY.cidb],
    ["KUSKOP", ms ? "Sijil Taraf Bumiputera (STB)" : "Bumiputera Status Certificate (STB)", COMPANY.cidb],
    ["JCCD", ms ? "Sijil Kontraktor Johor" : "Johor Contractor Certificate", COMPANY.jccd],
    ["MOF", ms ? "Pendaftaran Kementerian Kewangan (21 kod bidang)" : "Ministry of Finance registration (21 codes)", COMPANY.mof],
    ["SSM", ms ? "Pendaftaran Perniagaan" : "Business Registration", COMPANY.ssm],
  ];
  const machinery = [
    ["3", "Excavator", ms ? "Long arm, standard & mini" : "Long arm, standard & mini"],
    ["5", "Backhoe", ms ? "Untuk korek, angkut & kambus" : "For digging, loading & backfilling"],
    ["2", ms ? "Lori" : "Lorries", ms ? "Angkut bahan & sisa binaan" : "Material & debris haulage"],
  ];
  const process = ms
    ? [["Perbincangan & lawatan tapak", "Dengar keperluan, ukur tapak dan kenal pasti risiko awal."], ["Sebut harga & BQ", "Harga ikut item kerja daripada kadar semasa."], ["Perjanjian & jadual", "Skop, bayaran dan tempoh siap secara bertulis."], ["Pelaksanaan", "Penyelia di tapak; keselamatan, bahan & kemasan dipantau harian."], ["Laporan progres", "Kemas kini berkala bersama gambar."], ["Pemeriksaan & serahan", "Pemeriksaan bersama, pembaikan kecacatan dan serahan bersih."]]
    : [["Discussion & site visit", "Understand needs, measure the site and identify risks early."], ["Quotation & BQ", "Item-by-item pricing from current rates."], ["Agreement & schedule", "Scope, payments and completion in writing."], ["Execution", "Supervisor on site; safety, materials & finishes checked daily."], ["Progress reporting", "Regular updates with photos."], ["Inspection & handover", "Joint inspection, defect rectification and a clean handover."]];

  return (
    <>
      <PageHero lang={lang} eyebrow={d.nav.capabilities} title={ms ? "Keupayaan yang boleh disahkan." : "Capabilities you can verify."}
        lead={ms ? "Semua pendaftaran di bawah adalah daripada sijil asal syarikat. Salinan sijil disertakan bersama sebut harga rasmi atau dokumen tender." : "Every registration below is from the company's original certificates. Copies are provided with formal quotations and tender documents."} image="/img/projek/m_exc1.jpg" />
      <Section>
        <Heading eyebrow={ms ? "Gred CIDB" : "CIDB Grades"} title={ms ? "Berdaftar untuk tiga kategori kerja." : "Registered for three work categories."} />
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {grades.map(([g, n, codes]) => (
            <div key={g} className="rounded-xl2 bg-ink p-7 text-white">
              <p className="text-4xl font-extrabold text-amber">{g}</p>
              <p className="mt-3 text-lg font-bold">{n}</p>
              <p className="mt-1 text-sm text-white/60">{codes}</p>
            </div>
          ))}
        </div>
        <div className="mt-6 overflow-x-auto">
          <table className="table min-w-[640px]">
            <thead><tr><th>{ms ? "Badan" : "Body"}</th><th>{ms ? "Sijil" : "Certificate"}</th><th>{ms ? "No. rujukan" : "Reference no."}</th></tr></thead>
            <tbody>
              {regs.map(([b, n, r]) => (
                <tr key={n}><td className="font-bold">{b}</td><td>{n}</td><td className="font-mono text-[13px]">{r}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
      <Section tone="sand">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <Heading eyebrow={ms ? "Jentera & Aset" : "Machinery & Assets"} title={ms ? "Sedia bergerak ke tapak." : "Ready to mobilise."}
              lead={ms ? "Jentera sendiri membolehkan kami memulakan kerja dengan cepat dan mengawal jadual tanpa bergantung sepenuhnya kepada pihak luar. Sewaan dengan operator juga ditawarkan." : "Our own machinery lets us start quickly and keep schedules without relying entirely on third parties. Hire with operator is also available."} />
            <div className="mt-8 grid grid-cols-3 gap-3">
              {machinery.map(([n, k, v]) => (
                <div key={k} className="card p-5">
                  <p className="text-3xl font-extrabold">{n}</p>
                  <p className="mt-1 font-bold">{k}</p>
                  <p className="mt-1 text-[13px] text-mute">{v}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Photo src="/img/projek/m_bh_065.jpg" alt="Backhoe" lang={lang} className="aspect-square" sizes="25vw" />
            <Photo src="/img/projek/m_lorry2.jpg" alt={ms ? "Lori" : "Lorry"} lang={lang} className="aspect-square" sizes="25vw" />
          </div>
        </div>
      </Section>
      <Section>
        <Heading eyebrow={ms ? "Kaedah Kerja" : "Work Method"} title={ms ? "Dari lawatan tapak hingga serah kunci." : "From site visit to handover."} />
        <ol className="mt-10 grid gap-px overflow-hidden rounded-xl2 bg-line sm:grid-cols-2 lg:grid-cols-3">
          {process.map(([k, v], i) => (
            <li key={k} className="bg-white p-6">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-amber font-extrabold">{i + 1}</span>
              <h3 className="mt-4 font-bold">{k}</h3>
              <p className="mt-1.5 text-[15px] text-mute">{v}</p>
            </li>
          ))}
        </ol>
        <div className="mt-10 flex flex-wrap gap-3">
          <Link href={href(lang, "/contact")} className="btn-dark">{d.cta.contact}</Link>
          <Link href={href(lang, "/quotation")} className="btn-line">{d.cta.instantEstimate}</Link>
        </div>
      </Section>
    </>
  );
}
