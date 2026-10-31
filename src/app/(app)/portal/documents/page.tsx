import { portalContext, customerDocuments } from "@/lib/data/portal";
import { PageTitle, Empty } from "@/components/app/AppShell";
import { UploadForm } from "@/components/app/Forms";
import { bytes, dmy } from "@/lib/format";

export const metadata = { title: "Dokumen" };

export default async function PortalDocuments() {
  const { customerId } = await portalContext();
  const docs = await customerDocuments(customerId);
  return (
    <>
      <PageTitle title="Dokumen" lead="Gambar tapak, lukisan dan dokumen projek. PDF, JPG atau PNG sehingga 10 MB." actions={<UploadForm action="/api/portal/documents" />} />
      {docs.length ? (
        <div className="card overflow-x-auto">
          <table className="table">
            <thead><tr><th>Fail</th><th>Jenis</th><th>Saiz</th><th>Tarikh</th></tr></thead>
            <tbody>
              {docs.map((d) => (
                <tr key={d.id}>
                  <td><a href={`/api/documents/${d.id}`} target="_blank" rel="noopener" className="font-semibold underline">{d.fileName}</a></td>
                  <td>{d.kind}</td>
                  <td>{bytes(d.sizeBytes)}</td>
                  <td>{dmy(d.createdAt.toISOString())}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <Empty>Tiada dokumen lagi.</Empty>
      )}
    </>
  );
}
