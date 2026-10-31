import Link from "next/link";
import { portalContext, customerQuotations } from "@/lib/data/portal";
import { PageTitle, Badge, Empty } from "@/components/app/AppShell";
import { JsonForm } from "@/components/app/Forms";
import { rm, dmy } from "@/lib/format";

export const metadata = { title: "Sebut harga" };

export default async function PortalQuotations() {
  const { customerId } = await portalContext();
  const qs = await customerQuotations(customerId);
  return (
    <>
      <PageTitle title="Sebut harga" lead="Anggaran AI dan sebut harga rasmi anda." actions={<Link href="/quotation" className="btn btn-gold btn-sm">Anggaran baharu</Link>} />
      {qs.length ? (
        <div className="card overflow-x-auto">
          <table className="table">
            <thead><tr><th>No.</th><th>Projek</th><th>Tarikh</th><th>Sah sehingga</th><th>Status</th><th className="text-right">Jumlah</th><th /></tr></thead>
            <tbody>
              {qs.map((q) => (
                <tr key={q.id}>
                  <td className="font-semibold">{q.number}</td>
                  <td>{q.title}{q.pendingReviewCount > 0 && <p className="text-xs text-gold-strong">{q.pendingReviewCount} item semakan QS</p>}</td>
                  <td>{dmy(q.issueDate)}</td>
                  <td>{dmy(q.validUntil)}</td>
                  <td><Badge status={q.status} /></td>
                  <td className="text-right tabular-nums">{rm(q.grandTotal)}</td>
                  <td className="whitespace-nowrap">
                    <Link href={`/q/${q.publicToken}`} className="underline">Lihat</Link> ·{" "}
                    <a href={`/api/quotation/${q.publicToken}/pdf`} target="_blank" rel="noopener" className="underline">PDF</a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <Empty>Tiada sebut harga dalam akaun anda lagi.</Empty>
      )}
      <div className="card mt-8 p-6">
        <h2 className="font-bold">Tambah anggaran sedia ada</h2>
        <p className="mt-1 text-sm text-mute">Buat anggaran sebelum mendaftar? Tampal pautan anggaran (contoh: https://huzamaju.my/q/…) untuk menambahnya ke akaun anda.</p>
        <JsonForm action="/api/portal/claim" submit="Tambah" success="Ditambah" reset className="mt-4 grid gap-3">
          <input name="link" required className="field" placeholder="https://huzamaju.my/q/..." />
        </JsonForm>
      </div>
    </>
  );
}
