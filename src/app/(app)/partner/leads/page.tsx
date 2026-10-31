import { partnerContext, partnerLeads } from "@/lib/data/partner-portal";
import { PageTitle, Badge } from "@/components/app/AppShell";
import { PartnerStatusNotice, NoPartner } from "@/components/app/PartnerGate";
import { JsonForm } from "@/components/app/Forms";
import { QUOTE_CATEGORIES } from "@/lib/catalog";
import { dmy } from "@/lib/format";

export const metadata = { title: "Lead & rujukan" };

const NOTE: Record<string, string> = {
  new: "Diterima, menunggu pengesahan staf",
  verified: "Disahkan sebagai lead sah",
  duplicate: "Pelanggan ini telah didaftarkan sebelum ini (90 hari) dan tidak layak komisen",
  rejected: "Ditolak oleh staf",
  follow_up: "Dalam susulan",
  quoted: "Sebut harga telah dihantar",
  won: "Projek diperoleh. Komisen layak mengikut bayaran pelanggan",
  lost: "Pelanggan tidak meneruskan",
};

export default async function PartnerLeads() {
  const { partner } = await partnerContext();
  if (!partner) return <NoPartner />;
  const leads = await partnerLeads(partner.id);
  const cat = Object.fromEntries(QUOTE_CATEGORIES.map((c) => [c.key, c.name.ms]));
  return (
    <>
      <PageTitle title="Lead & rujukan" lead="Hantar maklumat bakal pelanggan. Sistem menyemak duplikasi secara automatik." />
      <PartnerStatusNotice status={partner.status} />
      {partner.status === "approved" && (
        <div className="card mb-8 p-6">
          <h2 className="font-bold">Hantar lead baharu</h2>
          <JsonForm action="/api/partner/leads" submit="Hantar lead" success="Lead diterima" reset className="mt-4 grid gap-4 md:grid-cols-2">
            <div><label className="label" htmlFor="pl-name">Nama pelanggan</label><input id="pl-name" name="name" required minLength={2} maxLength={160} className="field" /></div>
            <div><label className="label" htmlFor="pl-phone">No. telefon pelanggan</label><input id="pl-phone" name="phone" required className="field" placeholder="01X-XXX XXXX" /></div>
            <div><label className="label" htmlFor="pl-email">E-mel (pilihan)</label><input id="pl-email" name="email" type="email" className="field" /></div>
            <div><label className="label" htmlFor="pl-company">Syarikat (pilihan)</label><input id="pl-company" name="companyName" className="field" /></div>
            <div><label className="label" htmlFor="pl-loc">Lokasi projek</label><input id="pl-loc" name="location" required className="field" /></div>
            <div>
              <label className="label" htmlFor="pl-cat">Jenis kerja</label>
              <select id="pl-cat" name="serviceCategory" required className="field">
                {QUOTE_CATEGORIES.map((c) => <option key={c.key} value={c.key}>{c.name.ms}</option>)}
              </select>
            </div>
            <div className="md:col-span-2"><label className="label" htmlFor="pl-desc">Keterangan keperluan</label><textarea id="pl-desc" name="description" required minLength={10} maxLength={3000} rows={3} className="field" /></div>
            <label className="flex items-start gap-2 text-sm md:col-span-2">
              <input type="checkbox" name="clientConsent" required className="mt-1" />
              <span>Pelanggan ini telah bersetuju maklumatnya dikongsi dengan HUZA MAJU untuk dihubungi berkaitan projek ini.</span>
            </label>
          </JsonForm>
        </div>
      )}
      <div className="card overflow-x-auto">
        <table className="table">
          <thead><tr><th>Tarikh</th><th>Pelanggan</th><th>Kerja</th><th>Lokasi</th><th>Status</th><th>Catatan</th></tr></thead>
          <tbody>
            {leads.map((l) => (
              <tr key={l.id}>
                <td>{dmy(l.createdAt.toISOString())}</td>
                <td className="font-semibold">{l.name}</td>
                <td>{(l.serviceCategory && cat[l.serviceCategory]) ?? l.serviceCategory ?? "-"}</td>
                <td>{l.location ?? "-"}</td>
                <td><Badge status={l.status} /></td>
                <td className="text-xs text-mute">{NOTE[l.status] ?? ""}</td>
              </tr>
            ))}
            {!leads.length && <tr><td colSpan={6} className="text-center text-mute">Belum ada lead.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
