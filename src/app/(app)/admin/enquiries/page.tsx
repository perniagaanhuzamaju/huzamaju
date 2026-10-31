import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { enquiries } from "@/db/schema";
import { requirePage } from "@/lib/auth/session";
import { PageTitle, Badge } from "@/components/app/AppShell";
import { ActionButton } from "@/components/app/Forms";

export const metadata = { title: "Pertanyaan" };
const KIND: Record<string, string> = { general: "Umum", corporate: "Korporat", site_visit: "Lawatan tapak", formal_quote: "Sebut harga rasmi" };

export default async function AdminEnquiries({ searchParams }: PageProps<"/admin/enquiries">) {
  await requirePage("customers.view", "/admin/enquiries");
  const sp = await searchParams;
  const status = typeof sp.status === "string" ? sp.status : null;
  const rows = await db.select().from(enquiries).where(status ? eq(enquiries.status, status) : undefined).orderBy(desc(enquiries.createdAt)).limit(300);
  return (
    <>
      <PageTitle title="Pertanyaan" lead="Pertanyaan laman web, korporat, lawatan tapak dan permintaan sebut harga rasmi." />
      <div className="mb-4 flex gap-2 text-sm">
        {[null, "new", "in_progress", "closed"].map((s) => (
          <Link key={s ?? "all"} href={s ? `?status=${s}` : "?"} className={`chip ${status === s ? "border-ink bg-ink text-white" : ""}`}>{s ? ({ new: "Baharu", in_progress: "Dalam tindakan", closed: "Ditutup" } as Record<string, string>)[s] : "Semua"}</Link>
        ))}
      </div>
      <div className="grid gap-3">
        {rows.map((e) => (
          <div key={e.id} className="card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-bold">#{e.id} · {KIND[e.kind] ?? e.kind} · {e.name}{e.companyName && ` (${e.companyName})`}</p>
                <p className="text-sm text-mute">
                  <a href={`tel:${e.phone}`} className="underline">{e.phone}</a>
                  {e.email && <> · <a href={`mailto:${e.email}`} className="underline">{e.email}</a></>}
                  {e.location && ` · ${e.location}`} · {e.createdAt.toLocaleString("ms-MY", { timeZone: "Asia/Kuala_Lumpur" })} · {e.source}
                </p>
              </div>
              <Badge status={e.status} />
            </div>
            <p className="mt-3 text-sm whitespace-pre-line">{e.message}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {e.customerId && <Link href={`/admin/customers/${e.customerId}`} className="btn btn-line btn-sm">Pelanggan</Link>}
              <a href={`https://wa.me/${e.phone.replace(/\D/g, "").replace(/^0/, "60")}`} target="_blank" rel="noopener" className="btn btn-wa btn-sm">WhatsApp</a>
              {e.status !== "in_progress" && <ActionButton action={`/api/admin/enquiries/${e.id}`} method="PATCH" body={{ status: "in_progress" }} label="Dalam tindakan" />}
              {e.status !== "closed" && <ActionButton action={`/api/admin/enquiries/${e.id}`} method="PATCH" body={{ status: "closed" }} label="Tutup" />}
            </div>
          </div>
        ))}
        {!rows.length && <p className="card p-6 text-center text-sm text-mute">Tiada pertanyaan.</p>}
      </div>
    </>
  );
}
