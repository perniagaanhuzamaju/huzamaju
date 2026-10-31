import { notFound } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { pricingItemHistory, pricingItems, users } from "@/db/schema";
import { requirePage, can } from "@/lib/auth/session";
import { PageTitle } from "@/components/app/AppShell";
import { JsonForm } from "@/components/app/Forms";
import { ResourceFields } from "@/components/app/ResourceFields";
import { PRICING_FIELDS } from "@/lib/pricing/admin";

export default async function PricingItem({ params }: PageProps<"/admin/pricing/[id]">) {
  const u = await requirePage("pricing.view", "/admin/pricing");
  const id = Number((await params).id);
  const [item] = Number.isInteger(id) ? await db.select().from(pricingItems).where(eq(pricingItems.id, id)) : [];
  if (!item) notFound();
  const hist = await db.select({ h: pricingItemHistory, by: users.name }).from(pricingItemHistory).leftJoin(users, eq(users.id, pricingItemHistory.changedBy)).where(eq(pricingItemHistory.pricingItemId, id)).orderBy(desc(pricingItemHistory.changedAt));
  return (
    <>
      <PageTitle title={`${item.code} · ${item.description}`} lead={`Kos asas RM ${item.totalBaseRate.toFixed(2)} / ${item.unit}`} />
      {can(u, "pricing.edit") && (
        <section className="card p-5">
          <JsonForm action={`/api/admin/pricing/${id}`} method="PATCH" submit="Simpan" success="Disimpan (versi lama disimpan dalam sejarah)" className="grid gap-4">
            <ResourceFields fields={PRICING_FIELDS} row={item as unknown as Record<string, unknown>} prefix="pi" />
            <div><label className="label" htmlFor="pi-reason">Sebab perubahan</label><input id="pi-reason" name="reason" className="field" placeholder="cth: harga pembekal baharu" /></div>
          </JsonForm>
        </section>
      )}
      <h2 className="mt-8 mb-3 font-bold">Sejarah harga</h2>
      <div className="card overflow-x-auto">
        <table className="table text-sm">
          <thead><tr><th>Tarikh</th><th>Oleh</th><th>Sebab</th><th className="text-right">Bahan</th><th className="text-right">Buruh</th><th className="text-right">Kos asas</th><th>Berkuat kuasa</th></tr></thead>
          <tbody>
            {hist.map(({ h, by }) => {
              const s = h.snapshot as Record<string, number | string>;
              return <tr key={h.id}><td>{h.changedAt.toLocaleString("ms-MY", { timeZone: "Asia/Kuala_Lumpur" })}</td><td>{by ?? "-"}</td><td>{h.reason ?? "-"}</td><td className="text-right">{Number(s.materialRate).toFixed(2)}</td><td className="text-right">{Number(s.labourRate).toFixed(2)}</td><td className="text-right">{Number(s.totalBaseRate).toFixed(2)}</td><td>{String(s.effectiveDate)}</td></tr>;
            })}
            {!hist.length && <tr><td colSpan={7} className="text-mute">Tiada perubahan direkodkan.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
