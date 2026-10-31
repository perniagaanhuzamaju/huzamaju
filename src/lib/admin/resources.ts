import { projects, additionalCharges, blogPosts, commissionRules, galleryItems, labourRates, locationAdjustments, machineryRates, materialPrices, minimumCharges, services, testimonials } from "@/db/schema";
import type { Permission } from "@/lib/auth/permissions";
import { PROJECT_CATEGORIES, QUOTE_CATEGORIES, SERVICE_GROUPS } from "@/lib/catalog";
import { UNITS } from "@/lib/pricing/units";

/**
 * Declarative admin resources: one config drives the list page, the forms and
 * the validated create/update/delete API, so every editable table behaves the
 * same way and every change is audited.
 */
export type FieldType = "text" | "textarea" | "number" | "bool" | "date" | "select" | "lines" | "json";
export type Field = { name: string; label: string; type: FieldType; options?: { value: string; label: string }[]; required?: boolean; list?: boolean; help?: string; wide?: boolean };
export type Resource = {
  key: string;
  title: string;
  lead?: string;
  permission: Permission;
  idField?: string;
  fields: Field[];
  group: string;
};

const unitOpts = UNITS.map((u) => ({ value: u, label: u }));
const quoteCatOpts = QUOTE_CATEGORIES.map((c) => ({ value: c.key, label: c.name.ms }));
const libFields: Field[] = [
  { name: "code", label: "Kod", type: "text", required: true, list: true },
  { name: "name", label: "Nama", type: "text", required: true, list: true, wide: true },
  { name: "unit", label: "Unit", type: "select", options: unitOpts, required: true, list: true },
  { name: "rate", label: "Kadar (RM)", type: "number", required: true, list: true },
  { name: "supplier", label: "Pembekal", type: "text", list: true },
  { name: "effectiveDate", label: "Tarikh berkuat kuasa", type: "date", required: true, list: true },
  { name: "active", label: "Aktif", type: "bool", list: true },
  { name: "notes", label: "Catatan", type: "textarea", wide: true },
];

export const RESOURCES: Record<string, Resource & { table: unknown }> = {
  projects: {
    key: "projects", group: "Projek", title: "Projek", permission: "projects.edit", table: projects,
    fields: [
      { name: "titleMs", label: "Tajuk (BM)", type: "text", required: true, list: true, wide: true },
      { name: "titleEn", label: "Tajuk (EN)", type: "text", required: true, wide: true },
      { name: "slug", label: "Slug URL portfolio", type: "text", required: true },
      { name: "category", label: "Kategori", type: "select", options: PROJECT_CATEGORIES.map((c) => ({ value: c.key, label: c.name.ms })), required: true, list: true },
      { name: "status", label: "Status", type: "select", options: [{ value: "planned", label: "Dirancang" }, { value: "ongoing", label: "Sedang berjalan" }, { value: "on_hold", label: "Ditangguh" }, { value: "completed", label: "Siap" }], required: true, list: true },
      { name: "progress", label: "Kemajuan (%)", type: "number", list: true },
      { name: "location", label: "Lokasi", type: "text" },
      { name: "role", label: "Peranan syarikat", type: "text" },
      { name: "value", label: "Nilai kontrak (RM)", type: "number" },
      { name: "startDate", label: "Tarikh mula", type: "date" },
      { name: "endDate", label: "Tarikh siap", type: "date" },
      { name: "duration", label: "Tempoh", type: "text" },
      { name: "year", label: "Tahun", type: "text" },
      { name: "clientName", label: "Nama klien", type: "text" },
      { name: "clientPublic", label: "Papar nama klien di laman web (dengan kebenaran)", type: "bool" },
      { name: "valuePublic", label: "Papar nilai projek di laman web (dengan kebenaran)", type: "bool" },
      { name: "scopeMs", label: "Skop (BM)", type: "textarea" },
      { name: "scopeEn", label: "Skop (EN)", type: "textarea" },
      { name: "descriptionMs", label: "Penerangan (BM)", type: "textarea" },
      { name: "descriptionEn", label: "Penerangan (EN)", type: "textarea" },
      { name: "coverImage", label: "Gambar utama (laluan)", type: "text" },
      { name: "gallery", label: "Galeri (JSON)", type: "json", help: '[{"src":"/img/projek/x.jpg","kind":"before"}]' },
      { name: "isPortfolio", label: "Papar dalam portfolio awam", type: "bool", list: true },
      { name: "featured", label: "Projek pilihan di laman utama", type: "bool" },
      { name: "isDemo", label: "DATA DEMO (bukan projek sebenar)", type: "bool", help: "Projek demo dilabel jelas dan tidak dipaparkan sebagai rekod syarikat" },
    ],
  },
  services: {
    key: "services", group: "Kandungan", title: "Perkhidmatan", permission: "content.edit", table: services,
    lead: "Katalog perkhidmatan yang dipaparkan di laman web. Setiap perkhidmatan mempunyai halaman sendiri.",
    fields: [
      { name: "titleMs", label: "Tajuk (BM)", type: "text", required: true, list: true },
      { name: "titleEn", label: "Tajuk (EN)", type: "text", required: true },
      { name: "slug", label: "Slug URL", type: "text", required: true, list: true },
      { name: "groupKey", label: "Kumpulan", type: "select", options: SERVICE_GROUPS.map((g) => ({ value: g.key, label: g.name.ms })), required: true, list: true },
      { name: "quoteCategory", label: "Kategori sebut harga AI", type: "select", options: quoteCatOpts },
      { name: "summaryMs", label: "Ringkasan (BM)", type: "textarea", required: true, wide: true },
      { name: "summaryEn", label: "Ringkasan (EN)", type: "textarea", required: true, wide: true },
      { name: "scopeMs", label: "Skop (BM), satu baris satu item", type: "lines", wide: true },
      { name: "scopeEn", label: "Skop (EN), satu baris satu item", type: "lines", wide: true },
      { name: "image", label: "Gambar (laluan /img/...)", type: "text" },
      { name: "imageIsActual", label: "Gambar projek sebenar (bukan ilustrasi)", type: "bool" },
      { name: "sort", label: "Susunan", type: "number" },
      { name: "active", label: "Aktif", type: "bool", list: true },
    ],
  },
  gallery: {
    key: "gallery", group: "Kandungan", title: "Galeri", permission: "content.edit", table: galleryItems,
    fields: [
      { name: "src", label: "Gambar (laluan /img/...)", type: "text", required: true, list: true },
      { name: "captionMs", label: "Kapsyen (BM)", type: "text", required: true, list: true },
      { name: "captionEn", label: "Kapsyen (EN)", type: "text", required: true },
      { name: "category", label: "Kategori", type: "select", options: PROJECT_CATEGORIES.map((c) => ({ value: c.key, label: c.name.ms })), required: true, list: true },
      { name: "isActualProject", label: "Gambar projek sebenar HUZA MAJU", type: "bool", list: true, help: "Nyahtanda untuk gambar ilustrasi / stok" },
      { name: "sort", label: "Susunan", type: "number" },
      { name: "active", label: "Aktif", type: "bool", list: true },
    ],
  },
  blog: {
    key: "blog", group: "Kandungan", title: "Blog", permission: "content.edit", table: blogPosts,
    fields: [
      { name: "title", label: "Tajuk", type: "text", required: true, list: true, wide: true },
      { name: "slug", label: "Slug URL", type: "text", required: true, list: true },
      { name: "lang", label: "Bahasa", type: "select", options: [{ value: "ms", label: "BM" }, { value: "en", label: "EN" }], required: true, list: true },
      { name: "status", label: "Status", type: "select", options: [{ value: "draft", label: "Draf" }, { value: "published", label: "Terbit" }], required: true, list: true },
      { name: "excerpt", label: "Petikan", type: "textarea", wide: true },
      { name: "body", label: "Kandungan (Markdown)", type: "textarea", required: true, wide: true },
      { name: "coverImage", label: "Gambar muka (laluan)", type: "text" },
    ],
  },
  testimonials: {
    key: "testimonials", group: "Kandungan", title: "Testimoni", permission: "content.edit", table: testimonials,
    lead: "Hanya testimoni sebenar dengan kebenaran pelanggan. Testimoni dipaparkan hanya jika 'Aktif' dan 'Kebenaran diterbitkan' ditanda.",
    fields: [
      { name: "name", label: "Nama", type: "text", required: true, list: true },
      { name: "company", label: "Syarikat", type: "text", list: true },
      { name: "textMs", label: "Testimoni (BM)", type: "textarea", required: true, wide: true },
      { name: "textEn", label: "Testimoni (EN)", type: "textarea", wide: true },
      { name: "rating", label: "Penilaian (1-5)", type: "number" },
      { name: "consentToPublish", label: "Pelanggan memberi kebenaran untuk diterbitkan", type: "bool", list: true },
      { name: "active", label: "Aktif", type: "bool", list: true },
    ],
  },
  "commission-rules": {
    key: "commission-rules", group: "Rakan niaga", title: "Peraturan komisen", permission: "commissions.manage", table: commissionRules,
    lead: "Kadar komisen tidak ditetapkan dalam kod. Peraturan paling khusus (keutamaan, kategori, jenis rakan) dipilih. Peringkat bayaran: % komisen dikeluarkan apabila % bayaran pelanggan disahkan.",
    fields: [
      { name: "name", label: "Nama peraturan", type: "text", required: true, list: true, wide: true },
      { name: "partnerType", label: "Jenis rakan", type: "select", options: [{ value: "all", label: "Semua" }, { value: "referral", label: "Rakan Rujukan" }, { value: "agent", label: "Ejen Jualan" }], required: true, list: true },
      { name: "serviceCategory", label: "Kategori kerja (kosong = semua)", type: "select", options: quoteCatOpts, list: true },
      { name: "kind", label: "Jenis", type: "select", options: [{ value: "percent", label: "Peratus nilai projek" }, { value: "fixed", label: "Amaun tetap (RM)" }], required: true, list: true },
      { name: "amount", label: "Kadar (% atau RM)", type: "number", required: true, list: true },
      { name: "minProjectValue", label: "Nilai projek minimum (RM)", type: "number" },
      { name: "maxProjectValue", label: "Nilai projek maksimum (RM)", type: "number" },
      { name: "capAmount", label: "Had maksimum komisen (RM)", type: "number" },
      { name: "campaignBonus", label: "Bonus kempen (RM)", type: "number" },
      { name: "milestones", label: "Peringkat bayaran (JSON)", type: "json", wide: true, help: 'cth: [{"paymentPct":50,"commissionPct":50},{"paymentPct":100,"commissionPct":50}]' },
      { name: "validFrom", label: "Sah dari", type: "date" },
      { name: "validTo", label: "Sah hingga", type: "date" },
      { name: "priority", label: "Keutamaan", type: "number" },
      { name: "active", label: "Aktif", type: "bool", list: true },
    ],
  },
  "location-adjustments": {
    key: "location-adjustments", group: "Harga", title: "Pelarasan lokasi", permission: "pricing.edit", table: locationAdjustments,
    lead: "Faktor didarab dengan kos asas apabila lokasi projek mengandungi salah satu kata kunci. Padanan pertama mengikut susunan digunakan.",
    fields: [
      { name: "name", label: "Nama", type: "text", required: true, list: true },
      { name: "keywords", label: "Kata kunci lokasi (satu baris satu)", type: "lines", list: true, wide: true },
      { name: "factor", label: "Faktor (cth 1.05)", type: "number", required: true, list: true },
      { name: "sort", label: "Susunan", type: "number", list: true },
      { name: "active", label: "Aktif", type: "bool", list: true },
    ],
  },
  "minimum-charges": {
    key: "minimum-charges", group: "Harga", title: "Caj minimum", permission: "pricing.edit", table: minimumCharges, idField: "categoryKey",
    fields: [
      { name: "categoryKey", label: "Kategori", type: "select", options: quoteCatOpts, required: true, list: true },
      { name: "amount", label: "Caj minimum (RM)", type: "number", required: true, list: true },
    ],
  },
  "additional-charges": {
    key: "additional-charges", group: "Harga", title: "Caj tambahan", permission: "pricing.edit", table: additionalCharges,
    lead: "Caj yang ditambah pada setiap anggaran yang sepadan (cth: pengangkutan, permit). Kosongkan kategori untuk semua.",
    fields: [
      { name: "name", label: "Nama caj", type: "text", required: true, list: true },
      { name: "kind", label: "Jenis", type: "select", options: [{ value: "fixed", label: "Tetap (RM)" }, { value: "percent", label: "% jumlah kecil" }], required: true, list: true },
      { name: "amount", label: "Amaun", type: "number", required: true, list: true },
      { name: "appliesTo", label: "Kategori (satu baris satu kunci, kosong = semua)", type: "lines", list: true },
      { name: "segment", label: "Segmen", type: "select", options: [{ value: "all", label: "Semua" }, { value: "residential", label: "Kediaman" }, { value: "commercial", label: "Komersial" }], required: true, list: true },
      { name: "active", label: "Aktif", type: "bool", list: true },
    ],
  },
  materials: { key: "materials", group: "Harga", title: "Pustaka harga bahan", permission: "pricing.edit", table: materialPrices, fields: libFields },
  labour: { key: "labour", group: "Harga", title: "Pustaka kadar buruh", permission: "pricing.edit", table: labourRates, fields: libFields },
  machinery: {
    key: "machinery", group: "Harga", title: "Pustaka kadar jentera", permission: "pricing.edit", table: machineryRates,
    fields: [...libFields, { name: "withOperator", label: "Termasuk operator", type: "bool", list: true }],
  },
};

export const resourceList = () => Object.values(RESOURCES);

/** Converts form strings into typed column values according to the field definitions. */
export function coerce(fields: Field[], body: Record<string, unknown>, partial: boolean) {
  const out: Record<string, unknown> = {};
  const errors: string[] = [];
  for (const f of fields) {
    if (!(f.name in body)) {
      if (!partial && f.required) errors.push(`${f.label} diperlukan`);
      continue;
    }
    const raw = body[f.name];
    const s = typeof raw === "string" ? raw.trim() : raw;
    if (f.type === "bool") {
      out[f.name] = raw === true || raw === "true" || raw === "on";
      continue;
    }
    if (s === "" || s == null) {
      if (f.required) errors.push(`${f.label} diperlukan`);
      else out[f.name] = f.type === "lines" ? [] : null;
      continue;
    }
    switch (f.type) {
      case "number": {
        const n = Number(s);
        if (!Number.isFinite(n)) errors.push(`${f.label} mesti nombor`);
        else out[f.name] = n;
        break;
      }
      case "date":
        if (!/^\d{4}-\d{2}-\d{2}$/.test(String(s))) errors.push(`${f.label} tidak sah`);
        else out[f.name] = s;
        break;
      case "lines":
        out[f.name] = Array.isArray(s) ? s : String(s).split(/\r?\n|,/).map((x) => x.trim()).filter(Boolean);
        break;
      case "json":
        try {
          out[f.name] = typeof s === "string" ? JSON.parse(s) : s;
        } catch {
          errors.push(`${f.label}: JSON tidak sah`);
        }
        break;
      case "select":
        if (f.options && !f.options.some((o) => o.value === s)) errors.push(`${f.label} tidak sah`);
        else out[f.name] = s;
        break;
      default:
        out[f.name] = String(s).slice(0, f.type === "textarea" ? 50000 : 500);
    }
  }
  return { data: out, errors };
}

/** Serialises a row value for a form input. */
export function fieldValue(f: Field, v: unknown): string {
  if (v == null) return "";
  if (f.type === "lines") return Array.isArray(v) ? v.join("\n") : String(v);
  if (f.type === "json") return JSON.stringify(v);
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  return String(v);
}
