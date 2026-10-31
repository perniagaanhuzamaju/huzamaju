import { asc } from "drizzle-orm";
import { db } from "@/db";
import { websiteContent } from "@/db/schema";
import { requirePage } from "@/lib/auth/session";
import { PageTitle } from "@/components/app/AppShell";
import { JsonForm } from "@/components/app/Forms";

export const metadata = { title: "Kandungan laman" };

const HELP: Record<string, string> = {
  stat_years: "Statistik 'Pengalaman' di halaman Tentang Kami. Kosongkan untuk sembunyi. Jangan isi angka yang tidak dapat dibuktikan.",
  stat_value: "Jumlah nilai projek (cth: RM 5 juta+). Isi hanya dengan angka yang disahkan.",
  hours: "Waktu operasi. Dipaparkan hanya jika diisi.",
  quotation_terms: "Terma sebut harga (diurus di Tetapan harga).",
};

export default async function AdminContent() {
  await requirePage("content.edit", "/admin/content");
  const rows = await db.select().from(websiteContent).orderBy(asc(websiteContent.key));
  return (
    <>
      <PageTitle title="Kandungan laman" lead="Teks boleh diubah tanpa pembangun: statistik pengalaman, pengenalan, visi, nota pengurusan dan lain-lain. Kosongkan untuk menyembunyikan statistik." />
      <div className="grid gap-3">
        {rows.map((r) => (
          <details key={r.key} className="card">
            <summary className="cursor-pointer p-4 text-sm"><b className="font-mono">{r.key}</b> <span className="text-mute">{(r.valueMs ?? "").slice(0, 80) || "(kosong)"}</span></summary>
            <JsonForm action="/api/admin/content" extra={{ key: r.key }} submit="Simpan" success="Disimpan" className="grid gap-3 border-t border-line p-4">
              {HELP[r.key] && <p className="text-xs text-mute">{HELP[r.key]}</p>}
              <label className="label">BM</label><textarea name="valueMs" defaultValue={r.valueMs ?? ""} rows={3} className="field" />
              <label className="label">EN</label><textarea name="valueEn" defaultValue={r.valueEn ?? ""} rows={3} className="field" />
            </JsonForm>
          </details>
        ))}
      </div>
      <details className="card mt-6 p-5"><summary className="cursor-pointer font-bold">+ Kunci baharu</summary>
        <JsonForm action="/api/admin/content" submit="Tambah" reset className="mt-4 grid gap-3">
          <input name="key" required placeholder="kunci_huruf_kecil" className="field font-mono" />
          <textarea name="valueMs" rows={2} placeholder="BM" className="field" /><textarea name="valueEn" rows={2} placeholder="EN" className="field" />
        </JsonForm>
      </details>
    </>
  );
}
