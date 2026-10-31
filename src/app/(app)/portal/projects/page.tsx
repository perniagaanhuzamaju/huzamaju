import { portalContext, customerProjects, customerDocuments } from "@/lib/data/portal";
import { PageTitle, Badge, Empty } from "@/components/app/AppShell";
import { UploadForm } from "@/components/app/Forms";
import { dmy } from "@/lib/format";

export const metadata = { title: "Projek saya" };

export default async function PortalProjects() {
  const { customerId } = await portalContext();
  const [ps, docs] = await Promise.all([customerProjects(customerId), customerDocuments(customerId)]);
  return (
    <>
      <PageTitle title="Projek saya" lead="Kemajuan, tarikh dan dokumen projek anda." />
      {ps.length ? (
        <div className="grid gap-4">
          {ps.map((p) => {
            const pd = docs.filter((d) => d.projectId === p.id);
            return (
              <div key={p.id} className="card p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-bold">{p.titleMs}</p>
                    <p className="text-sm text-mute">{p.location}</p>
                  </div>
                  <Badge status={p.status} />
                </div>
                <div className="mt-4 h-2.5 rounded-full bg-line"><div className="h-2.5 rounded-full bg-gold" style={{ width: `${p.progress}%` }} /></div>
                <div className="mt-2 flex flex-wrap gap-x-6 text-sm text-mute">
                  <span>{p.progress}% siap</span>
                  {p.startDate && <span>Mula: {dmy(p.startDate)}</span>}
                  {p.endDate && <span>Jangka siap: {dmy(p.endDate)}</span>}
                </div>
                {p.scopeMs && <p className="mt-4 text-sm whitespace-pre-line text-ink-2">{p.scopeMs}</p>}
                <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
                  <ul className="flex flex-wrap gap-2 text-sm">
                    {pd.map((d) => (
                      <li key={d.id}><a href={`/api/documents/${d.id}`} target="_blank" rel="noopener" className="chip">{d.fileName}</a></li>
                    ))}
                    {!pd.length && <li className="text-mute">Tiada dokumen</li>}
                  </ul>
                  <UploadForm action="/api/portal/documents" extra={{ projectId: String(p.id) }} label="Muat naik gambar / dokumen" />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <Empty>Tiada projek aktif. Projek akan dipaparkan di sini selepas sebut harga diterima dan kerja bermula.</Empty>
      )}
    </>
  );
}
