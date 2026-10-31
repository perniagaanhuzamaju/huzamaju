import { requirePage } from "@/lib/auth/session";
import { loadPricingSettings } from "@/lib/quotation/context";
import { DEFAULT_TERMS, quotationTerms } from "@/lib/quotation/service";
import { PageTitle } from "@/components/app/AppShell";
import { JsonForm } from "@/components/app/Forms";

export const metadata = { title: "Tetapan harga" };

function F({ name, label, value, help }: { name: string; label: string; value: number; help?: string }) {
  return (
    <div><label className="label" htmlFor={`s-${name}`}>{label}</label><input id={`s-${name}`} name={name} type="number" step="any" defaultValue={value} className="field" />{help && <p className="mt-1 text-xs text-mute">{help}</p>}</div>
  );
}

export default async function PricingSettings() {
  await requirePage("pricing.edit", "/admin/pricing/settings");
  const s = await loadPricingSettings();
  const [tms, ten] = await Promise.all([quotationTerms("ms"), quotationTerms("en")]);
  return (
    <>
      <PageTitle title="Tetapan harga" lead="Semua komponen pengiraan boleh dikonfigurasi. Perubahan terpakai pada anggaran baharu dan pengiraan semula." />
      <JsonForm action="/api/admin/pricing/settings" submit="Simpan tetapan" success="Disimpan" className="card grid gap-4 p-6 md:grid-cols-3">
        <F name="target_margin" label="Margin sasaran" value={s.targetMargin} help="0.40 = 40% daripada harga jual" />
        <F name="min_margin" label="Margin minimum" value={s.minMargin} help="Had bawah untuk harga khusus projek" />
        <F name="overhead_pct" label="Overhead" value={s.overheadPct} help="Ditambah pada kos sebelum margin" />
        <F name="commercial_factor" label="Faktor komersial" value={s.commercialFactor} />
        <F name="contingency_pct" label="Luar jangka" value={s.contingencyPct} />
        <F name="validity_days" label="Tempoh sah (hari)" value={s.validityDays} />
        <F name="range_low_pct" label="Julat bawah" value={s.rangeLowPct} />
        <F name="range_high_pct" label="Julat atas" value={s.rangeHighPct} />
        <F name="rounding_step" label="Langkah bundar (mod rata)" value={s.roundingStep} />
        <F name="sst_pct" label="Kadar SST" value={s.sstPct} help="Hanya digunakan jika SST diaktifkan" />
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="sst_enabled" defaultChecked={s.sstEnabled} /> Kenakan SST (syarikat berdaftar SST)</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="rounding_tiered" defaultChecked={s.roundingMode === "tiered"} /> Pembundaran berperingkat (Senarai Harga 2026)</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="allow_unverified_rates" defaultChecked={s.allowUnverifiedRates} /> Benarkan kadar belum disahkan dalam anggaran</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="margin_mode_markup" defaultChecked={s.marginMode === "markup"} /> Guna markup (kos × (1+m)) bukan margin</label>
        <div className="md:col-span-3"><label className="label">Terma sebut harga (BM), satu baris satu terma</label><textarea name="quotation_terms_ms" rows={6} defaultValue={tms.join("\n")} className="field text-sm" placeholder={DEFAULT_TERMS.ms.join("\n")} /></div>
        <div className="md:col-span-3"><label className="label">Terma sebut harga (EN)</label><textarea name="quotation_terms_en" rows={6} defaultValue={ten.join("\n")} className="field text-sm" /></div>
      </JsonForm>
    </>
  );
}
