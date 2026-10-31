import Link from "next/link";
import { portalContext, customerEnquiries, customerProjects, customerQuotations, customerMessages } from "@/lib/data/portal";
import { PageTitle, Stat, Badge, Empty } from "@/components/app/AppShell";
import { rm, dmy } from "@/lib/format";

export const metadata = { title: "Portal Pelanggan" };

export default async function PortalHome() {
  const { user, customerId } = await portalContext();
  const [qs, es, ps, ms] = await Promise.all([customerQuotations(customerId), customerEnquiries(customerId), customerProjects(customerId), customerMessages(customerId)]);
  return (
    <>
      <PageTitle
        title={`Selamat datang, ${user.name}`}
        lead="Semua pertanyaan, sebut harga dan projek anda bersama HUZA MAJU."
        actions={<Link href="/quotation" className="btn btn-gold btn-sm">Anggaran segera AI</Link>}
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Sebut harga" value={qs.length} />
        <Stat label="Pertanyaan" value={es.length} />
        <Stat label="Projek aktif" value={ps.filter((p) => p.status === "ongoing").length} />
        <Stat label="Mesej" value={ms.length} />
      </div>
      <h2 className="mt-10 mb-3 text-lg font-bold">Sebut harga terkini</h2>
      {qs.length ? (
        <div className="card overflow-x-auto">
          <table className="table">
            <thead><tr><th>No.</th><th>Projek</th><th>Tarikh</th><th>Status</th><th className="text-right">Jumlah</th></tr></thead>
            <tbody>
              {qs.slice(0, 5).map((q) => (
                <tr key={q.id}>
                  <td><Link className="font-semibold underline" href={`/q/${q.publicToken}`}>{q.number}</Link></td>
                  <td>{q.title}</td>
                  <td>{dmy(q.issueDate)}</td>
                  <td><Badge status={q.status} /></td>
                  <td className="text-right tabular-nums">{rm(q.grandTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <Empty>Tiada sebut harga lagi. <Link href="/quotation" className="underline">Dapatkan anggaran segera</Link> atau tuntut anggaran sedia ada di halaman Sebut harga.</Empty>
      )}
      {ps.length > 0 && (
        <>
          <h2 className="mt-10 mb-3 text-lg font-bold">Projek</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {ps.map((p) => (
              <div key={p.id} className="card p-5">
                <div className="flex justify-between gap-2"><p className="font-bold">{p.titleMs}</p><Badge status={p.status} /></div>
                <div className="mt-3 h-2 rounded-full bg-line"><div className="h-2 rounded-full bg-gold" style={{ width: `${p.progress}%` }} /></div>
                <p className="mt-1 text-xs text-mute">{p.progress}% siap</p>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}
