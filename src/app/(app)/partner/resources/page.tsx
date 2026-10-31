import Link from "next/link";
import { partnerContext } from "@/lib/data/partner-portal";
import { PageTitle } from "@/components/app/AppShell";
import { NoPartner, PartnerStatusNotice } from "@/components/app/PartnerGate";
import { CopyBox } from "@/components/app/CopyBox";
import { SITE_URL } from "@/lib/seo";
import { COMPANY } from "@/lib/company";
import { SERVICE_GROUPS } from "@/lib/catalog";

export const metadata = { title: "Bahan jualan" };

export default async function PartnerResources() {
  const { user, partner } = await partnerContext();
  if (!partner) return <NoPartner />;
  const agent = user.permissions.has("partner.agent_tools");
  const r = (path: string) => `${SITE_URL}/r/${partner.code}?to=${encodeURIComponent(path)}`;
  const templates = [
    ["Umum", `Assalamualaikum. Saya rakan kepada HUZA MAJU, kontraktor CIDB G2 di Kluang, Johor. Mereka buat bina rumah, renovation, bumbung, paip, elektrik dan kerja sivil. Boleh dapatkan anggaran awal segera di sini: ${r("/quotation")}`],
    ["Renovation rumah", `Nak renovate dapur, bilik air atau tambah bilik? HUZA MAJU boleh bagi anggaran bajet awal dalam beberapa minit, kemudian QS mereka sahkan selepas lawatan tapak: ${r("/quotation?category=house_renovation")}`],
    ["Korporat / kilang", `Untuk penyelenggaraan bangunan, kerja sivil dan subkontrak, HUZA MAJU (CIDB G2 B, CE, ME) menerima projek kerajaan dan swasta. Profil syarikat: ${r("/about")}`],
  ];
  return (
    <>
      <PageTitle title={agent ? "Bahan jualan" : "Kit perkongsian"} lead="Mesej sedia untuk dikongsi. Setiap pautan sudah mengandungi ID rujukan anda." />
      <PartnerStatusNotice status={partner.status} />
      <div className="grid gap-4">
        {templates.map(([title, text]) => (
          <div key={title} className="card p-5">
            <p className="font-bold">{title}</p>
            <p className="mt-2 text-sm text-ink-2">{text}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <CopyBox value={text} label="Salin mesej" />
              <a href={`https://wa.me/?text=${encodeURIComponent(text)}`} target="_blank" rel="noopener" className="btn btn-wa btn-sm">WhatsApp</a>
            </div>
          </div>
        ))}
      </div>
      {agent && (
        <div className="card mt-8 p-6">
          <h2 className="font-bold">Pautan perkhidmatan untuk ejen</h2>
          <ul className="mt-4 grid gap-3 md:grid-cols-2">
            {SERVICE_GROUPS.map((g) => (
              <li key={g.key}>
                <p className="text-sm font-semibold">{g.name.ms}</p>
                <CopyBox value={r(`/services#${g.key}`)} />
              </li>
            ))}
          </ul>
          <p className="mt-6 text-sm text-mute">
            Panduan: jangan menjanjikan harga muktamad kepada pelanggan. Semua harga ialah anggaran sehingga sebut harga rasmi diluluskan oleh {COMPANY.name}. Sila rujuk <Link href="/terms" className="underline">Terma rakan niaga</Link>.
          </p>
        </div>
      )}
    </>
  );
}
