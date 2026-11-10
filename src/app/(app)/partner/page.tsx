import Link from "next/link";
import { partnerContext, partnerStats, partnerLeads } from "@/lib/data/partner-portal";
import { PageTitle, Stat, Badge } from "@/components/app/AppShell";
import { PartnerStatusNotice, NoPartner } from "@/components/app/PartnerGate";
import { CopyBox } from "@/components/app/CopyBox";
import { SITE_URL } from "@/lib/seo";
import { rm, dmy } from "@/lib/format";

export const metadata = { title: "Portal Rakan Niaga" };

export default async function PartnerHome() {
  const { user, partner } = await partnerContext();
  if (!partner) return <NoPartner />;
  const [s, leads] = await Promise.all([partnerStats(partner.id), partnerLeads(partner.id)]);
  const link = `${SITE_URL}/r/${partner.code}`;
  const share = `Nak bina rumah, renovate atau buat kerja sivil? Dapatkan anggaran segera dari HUZA MAJU (kontraktor berdaftar CIDB, Kluang): ${link}`;
  return (
    <>
      <PageTitle title={`Hai, ${user.name}`} lead={`${partner.type === "agent" ? "Ejen Jualan Bebas" : "Rakan Rujukan"} · ID ${partner.code}`} />
      <PartnerStatusNotice status={partner.status} />
      {partner.status === "approved" && (
        <div className="card mb-6 p-6">
          <h2 className="font-bold">Pautan rujukan anda</h2>
          <p className="mt-1 text-sm text-mute">Pelanggan yang membuka pautan ini dan menghantar pertanyaan atau anggaran dalam 30 hari akan direkodkan di bawah anda.</p>
          <div className="mt-4"><CopyBox value={link} /></div>
          <a href={`https://wa.me/?text=${encodeURIComponent(share)}`} target="_blank" rel="noopener" className="btn btn-wa btn-sm mt-3">Kongsi di WhatsApp</a>
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Stat label="Lawatan pautan" value={s.visits} />
        <Stat label="Lead dihantar" value={s.leads} />
        <Stat label="Projek berjaya" value={s.won} />
        <Stat label="Komisen menunggu bayaran pelanggan" value={rm(s.pending)} hint="Projek diperoleh; menunggu bayaran pelanggan disahkan" />
        <Stat label="Komisen layak / diluluskan" value={rm(s.eligible)} />
        <Stat label="Telah dibayar" value={rm(s.paid)} />
      </div>
      <div className="mt-10 mb-3 flex items-center justify-between">
        <h2 className="text-lg font-bold">Lead terkini</h2>
        <Link href="/partner/leads" className="text-sm font-semibold underline">Hantar lead baharu</Link>
      </div>
      <div className="card overflow-x-auto">
        <table className="table">
          <thead><tr><th>Tarikh</th><th>Nama</th><th>Kerja</th><th>Status</th></tr></thead>
          <tbody>
            {leads.slice(0, 6).map((l) => (
              <tr key={l.id}><td>{dmy(l.createdAt.toISOString())}</td><td>{l.name}</td><td>{l.serviceCategory ?? "-"}</td><td><Badge status={l.status} /></td></tr>
            ))}
            {!leads.length && <tr><td colSpan={4} className="text-center text-mute">Belum ada lead.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
