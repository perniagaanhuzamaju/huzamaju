import { portalContext, customerEnquiries } from "@/lib/data/portal";
import { PageTitle, Badge, Empty } from "@/components/app/AppShell";
import { EnquiryForm } from "@/components/site/EnquiryForm";
import { getServices } from "@/lib/data/public";
import { dmy } from "@/lib/format";

export const metadata = { title: "Pertanyaan" };

const KIND: Record<string, string> = { general: "Pertanyaan", corporate: "Korporat", site_visit: "Lawatan tapak", formal_quote: "Sebut harga rasmi" };

export default async function PortalEnquiries() {
  const { customerId } = await portalContext();
  const [es, services] = await Promise.all([customerEnquiries(customerId), getServices()]);
  return (
    <>
      <PageTitle title="Pertanyaan & lawatan tapak" lead="Hantar pertanyaan baharu atau minta lawatan tapak percuma." />
      {es.length ? (
        <ul className="grid gap-3">
          {es.map((e) => (
            <li key={e.id} className="card p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-bold">{KIND[e.kind] ?? e.kind} #{e.id}</p>
                <div className="flex items-center gap-2 text-sm text-mute">{dmy(e.createdAt.toISOString())} <Badge status={e.status} /></div>
              </div>
              <p className="mt-2 text-sm whitespace-pre-line text-ink-2">{e.message}</p>
            </li>
          ))}
        </ul>
      ) : (
        <Empty>Tiada pertanyaan lagi.</Empty>
      )}
      <h2 className="mt-10 mb-3 text-lg font-bold">Minta lawatan tapak</h2>
      <EnquiryForm lang="ms" kind="site_visit" services={services.map((s) => ({ slug: s.slug, title: s.titleMs }))} />
    </>
  );
}
