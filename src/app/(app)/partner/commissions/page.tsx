import { partnerContext, partnerCommissions, partnerPayouts, partnerStats } from "@/lib/data/partner-portal";
import { PageTitle, Stat, Badge, Empty } from "@/components/app/AppShell";
import { NoPartner } from "@/components/app/PartnerGate";
import { rm, dmy } from "@/lib/format";

export const metadata = { title: "Komisen" };

export default async function PartnerCommissions() {
  const { partner } = await partnerContext();
  if (!partner) return <NoPartner />;
  const [tx, payouts, s] = await Promise.all([partnerCommissions(partner.id), partnerPayouts(partner.id), partnerStats(partner.id)]);
  return (
    <>
      <PageTitle title="Komisen & pendapatan" lead="Komisen hanya dijana apabila projek diperoleh, dan layak dibayar mengikut bayaran pelanggan yang telah disahkan." />
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Menunggu bayaran pelanggan" value={rm(s.pending)} />
        <Stat label="Layak / diluluskan" value={rm(s.eligible)} />
        <Stat label="Telah dibayar" value={rm(s.paid)} />
      </div>
      <h2 className="mt-10 mb-3 text-lg font-bold">Transaksi komisen</h2>
      {tx.length ? (
        <div className="card overflow-x-auto">
          <table className="table">
            <thead><tr><th>Tarikh</th><th>Projek</th><th>Peringkat</th><th className="text-right">Nilai asas</th><th className="text-right">Komisen</th><th>Status</th></tr></thead>
            <tbody>
              {tx.map((t) => (
                <tr key={t.id}>
                  <td>{dmy(t.createdAt.toISOString())}</td>
                  <td>#{t.projectId ?? "-"}{t.note && <p className="text-xs text-mute">{t.note}</p>}</td>
                  <td>{t.trancheNo}</td>
                  <td className="text-right tabular-nums">{rm(t.baseValue)}</td>
                  <td className="text-right font-semibold tabular-nums">{rm(t.amount)}</td>
                  <td><Badge status={t.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <Empty>Belum ada komisen. Komisen akan muncul di sini apabila projek daripada rujukan anda diperoleh.</Empty>
      )}
      <h2 className="mt-10 mb-3 text-lg font-bold">Bayaran kepada anda</h2>
      {payouts.length ? (
        <div className="card overflow-x-auto">
          <table className="table">
            <thead><tr><th>Tarikh</th><th>Rujukan</th><th className="text-right">Jumlah</th></tr></thead>
            <tbody>{payouts.map((p) => <tr key={p.id}><td>{dmy(p.paidAt)}</td><td>{p.reference ?? "-"}</td><td className="text-right tabular-nums">{rm(p.amount)}</td></tr>)}</tbody>
          </table>
        </div>
      ) : (
        <Empty>Tiada bayaran lagi.</Empty>
      )}
    </>
  );
}
