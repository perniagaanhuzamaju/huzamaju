/**
 * Idempotent seed: roles & permissions, first super admin, service catalogue,
 * pricing database (from Senarai_Harga_HUZA_MAJU_2026.xlsx), pricing settings,
 * verified project records from the 2026 company profile, gallery and site content.
 *
 *   SEED_ADMIN_EMAIL=... SEED_ADMIN_PASSWORD=... npm run db:seed
 */
import "dotenv/config";
import crypto from "node:crypto";
import { sql } from "drizzle-orm";
import { db } from "../src/db";
import * as t from "../src/db/schema";
import { PERMISSIONS, ROLES } from "../src/lib/auth/permissions";
import { hashPassword, passwordProblem } from "../src/lib/auth/password";
import { DEFAULT_SERVICES, QUOTE_CATEGORIES } from "../src/lib/catalog";
import pricing from "../src/db/seed-data/pricing-2026.json";

const UNIT_MAP: Record<string, string> = { kps: "ft2", ka: "ft", titik: "point", bilik: "unit", lokasi: "lot", unit: "unit", lot: "lot", set: "set", trip: "trip" };
const SOURCE: Record<string, string> = {
  Q: "Qanvast (Dis 2025)",
  P: "PropCashflow (2026)",
  R: "Recommend.my (2024)",
  A: "Anggaran pasaran HUZA MAJU — sahkan dengan pembekal",
};

async function roles() {
  await db.insert(t.permissions).values(Object.entries(PERMISSIONS).map(([key, description]) => ({ key, description }))).onConflictDoNothing();
  for (const [key, r] of Object.entries(ROLES)) {
    await db.insert(t.roles).values({ key: key as never, name: r.name, description: r.description }).onConflictDoUpdate({
      target: t.roles.key,
      set: { name: r.name, description: r.description },
    });
    await db.delete(t.rolePermissions).where(sql`${t.rolePermissions.roleKey} = ${key}`);
    if (r.permissions.length)
      await db.insert(t.rolePermissions).values(r.permissions.map((p) => ({ roleKey: key as never, permissionKey: p })));
  }
}

async function admin() {
  const email = (process.env.SEED_ADMIN_EMAIL ?? "huzamaju@gmail.com").toLowerCase();
  const exists = await db.select({ id: t.users.id }).from(t.users).where(sql`${t.users.email} = ${email}`);
  if (exists.length) return console.log(`• Super admin ${email} already exists`);
  let password = process.env.SEED_ADMIN_PASSWORD;
  let generated = false;
  if (!password) {
    password = crypto.randomBytes(12).toString("base64url") + "9a";
    generated = true;
  }
  const problem = passwordProblem(password);
  if (problem) throw new Error(`SEED_ADMIN_PASSWORD: ${problem}`);
  await db.insert(t.users).values({ email, name: "Syed Hud bin Syed Abdullah", phone: "0178717848", role: "super_admin", passwordHash: await hashPassword(password) });
  console.log(`• Super admin created: ${email}${generated ? `  password: ${password}  (change it after first login)` : ""}`);
}

async function services() {
  let sort = 0;
  for (const s of DEFAULT_SERVICES) {
    await db
      .insert(t.services)
      .values({
        slug: s.slug,
        groupKey: s.group,
        quoteCategory: s.quote,
        titleMs: s.title.ms,
        titleEn: s.title.en,
        summaryMs: s.summary.ms,
        summaryEn: s.summary.en,
        scopeMs: s.scope.ms,
        scopeEn: s.scope.en,
        image: s.image ?? null,
        imageIsActual: true,
        sort: sort++,
      })
      .onConflictDoNothing();
  }
}

async function pricingDb() {
  const seq: Record<string, number> = {};
  const today = "2026-10-17";
  for (const r of pricing as Array<Record<string, unknown>>) {
    const letter = String(r.cat).charAt(0);
    seq[letter] = (seq[letter] ?? 0) + 1;
    const code = `${letter}-${String(seq[letter]).padStart(3, "0")}`;
    const workCategories = QUOTE_CATEGORIES.filter((c) => c.sections.includes(letter)).map((c) => c.key);
    const material = Number(r.mat ?? 0);
    const labour = Number(r.lab ?? 0);
    const src = String(r.src ?? "A");
    await db
      .insert(t.pricingItems)
      .values({
        code,
        description: String(r.desc),
        category: String(r.cat),
        workCategories,
        unit: UNIT_MAP[String(r.unit)] ?? "unit",
        materialRate: Math.round(material * 10000) / 10000,
        labourRate: Math.round(labour * 10000) / 10000,
        totalBaseRate: Math.round((material + labour) * 10000) / 10000,
        marketLow: Number(r.mkt_low ?? 0) || null,
        marketHigh: Number(r.mkt_high ?? 0) || null,
        effectiveDate: today,
        source: SOURCE[src] ?? src,
        notes: (r.note as string) || null,
        isVerified: r.actual_cost != null,
      })
      .onConflictDoNothing();
  }

  const settings: [string, number, string][] = [
    ["margin_mode_markup", 0, "0 = margin atas harga jual (Kos ÷ (1 − margin)); 1 = markup atas kos"],
    ["target_margin", 0.4, "Margin sasaran (Tetapan Senarai Harga 2026)"],
    ["min_margin", 0.35, "Margin minimum; kadar khas projek tidak boleh di bawah ini"],
    ["overhead_pct", 0, "Overhead tambahan atas kos (0 kerana sudah termasuk dalam kos 2026)"],
    ["commercial_factor", 1.15, "Faktor kos kerja kedai/pejabat"],
    ["contingency_pct", 0.05, "Kontingensi sebut harga"],
    ["sst_enabled", 0, "HUZA MAJU tidak berdaftar SST (surat 2026). Tukar kepada 1 bila berdaftar"],
    ["sst_pct", 0.08, "Kadar SST perkhidmatan"],
    ["rounding_tiered", 1, "1 = bundar ikut peringkat Senarai Harga 2026; 0 = langkah tetap"],
    ["rounding_step", 0.05, "Langkah bundar bila rounding_tiered = 0"],
    ["range_low_pct", 0.1, "Julat anggaran di bawah"],
    ["range_high_pct", 0.2, "Julat anggaran di atas"],
    ["allow_unverified_rates", 1, "1 = guna kadar anggaran yang belum disahkan untuk sebut harga awal"],
    ["validity_days", 30, "Tempoh sah sebut harga (hari)"],
  ];
  await db.insert(t.pricingSettings).values(settings.map(([key, value, description]) => ({ key, value, description }))).onConflictDoNothing();

  await db
    .insert(t.locationAdjustments)
    .values([
      { name: "Kluang (asas harga 2026)", keywords: ["kluang", "simpang renggam", "paloh", "renggam", "mengkibol", "lambak"], factor: 1, sort: 1 },
      { name: "Johor Bahru / Iskandar (andaian)", keywords: ["johor bahru", "jb", "skudai", "iskandar", "pasir gudang", "kulai", "plentong", "nusajaya"], factor: 1.11, sort: 2 },
      { name: "Daerah lain di Johor (andaian)", keywords: ["batu pahat", "muar", "segamat", "kota tinggi", "pontian", "mersing", "tangkak", "johor"], factor: 1.05, sort: 3 },
      { name: "Luar Johor (andaian)", keywords: ["melaka", "selangor", "kuala lumpur", "negeri sembilan", "pahang", "perak", "kelantan", "terengganu", "kedah", "penang", "pulau pinang", "perlis", "sabah", "sarawak", "putrajaya"], factor: 1.15, sort: 4 },
    ])
    .onConflictDoNothing();

  await db
    .insert(t.minimumCharges)
    .values([
      { categoryKey: "house_renovation", amount: 1500 },
      { categoryKey: "commercial_renovation", amount: 3000 },
      { categoryKey: "painting", amount: 800 },
      { categoryKey: "roofing", amount: 550 },
      { categoryKey: "plaster_ceiling", amount: 800 },
      { categoryKey: "flooring", amount: 1000 },
      { categoryKey: "plumbing", amount: 300 },
      { categoryKey: "wiring", amount: 300 },
    ])
    .onConflictDoNothing();

  const commissionRows = await db.select({ id: t.commissionRules.id }).from(t.commissionRules).limit(1);
  if (!commissionRows.length)
    await db.insert(t.commissionRules).values({
      name: "CONTOH (tidak aktif) — tetapkan kadar sebenar sebelum diaktifkan",
      partnerType: "all",
      kind: "percent",
      amount: 0,
      milestones: [
        { paymentPct: 30, commissionPct: 50 },
        { paymentPct: 100, commissionPct: 50 },
      ],
      active: false,
    });
}

type ProjSeed = [slug: string, ms: string, en: string, cat: string, client: string | null, pub: boolean, role: string | null, loc: string | null, cover?: string];
const PROJECTS: ProjSeed[] = [
  ["renovation-rumah-kluang", "Renovation rumah di 7 taman sekitar Kluang", "House renovations in 7 Kluang neighbourhoods", "house_renovation", "Pemilik kediaman", false, "Kontraktor", "Taman Saujana, Sri Kluang, Mengkibol, Sri Impian, Kg & Tmn Sri Lambak, Cahaya Pelangi, Kluang", "r_ext"],
  ["70-unit-taman-pasir-puteh", "Reka & bina baik pulih dan naik taraf 70 unit rumah tidak terjual, Taman Pasir Puteh", "Design & build refurbishment of 70 unsold houses, Taman Pasir Puteh", "house_renovation", null, false, "Reka & Bina", "Mukim Plentong, Johor Bahru"],
  ["kerja-bata-taman-sri-impian", "Kerja bata pembinaan rumah taman perumahan, Taman Sri Impian", "Brickwork for housing estate construction, Taman Sri Impian", "building", "Developer Matrix", true, "Subkontraktor", "Kluang", "r_brick"],
  ["stor-baja-felcra", "Membina stor baja 60' × 20'", "60' × 20' fertiliser store", "building", "FELCRA Berhad", true, "Kontraktor", "Johor", "r_store1"],
  ["wisma-kem-mahkota", "Kerja bata, plaster dan skim, Wisma Kem Mahkota TMJ", "Brickwork, plaster and skim coat, Wisma Kem Mahkota TMJ", "building", null, false, "Subkontraktor", "Johor", "r_plaster2"],
  ["pejabat-daerah-muar", "Kerja bata, plaster dan skim bangunan baharu Pejabat Daerah Muar", "Brickwork, plaster and skim coat for the new Muar District Office", "building", null, false, "Subkontraktor", "Muar, Johor", "r_2st3"],
  ["premis-iks-jabatan-pertanian", "Membaik pulih 5 premis IKS sekitar Kluang", "Refurbishment of 5 SME premises around Kluang", "building", "Jabatan Pertanian", true, "Kontraktor", "Kluang", "r_store3"],
  ["tadika-kemas", "Membaik pulih Tadika KEMAS", "KEMAS kindergarten refurbishment", "building", "Pejabat Daerah Kluang", true, "Kontraktor", "Kluang", "r_class"],
  ["tandas-dewan-terbuka", "Membaik pulih tandas dan dewan terbuka", "Toilet and open hall refurbishment", "building", "Pejabat Daerah Kluang", true, "Kontraktor", "Kluang", "r_toilet"],
  ["mozek-sekolah", "Kerja memasang mozek, Sekolah Tengku Mahmud 2 & SK SDARA Simpang Renggam", "Terrazzo flooring at two schools", "building", null, false, "Kontraktor", "Kluang & Simpang Renggam"],
  ["pagar-anti-climb", "Pagar anti-climb, SK SDARA Simpang Renggam & Surau Kampung Contoh", "Anti-climb fencing at a school and a surau", "civil", null, false, "Kontraktor", "Simpang Renggam", "r_fence"],
  ["jalan-simpang-pulai-gua-musang", "Menyiapkan Jalan Raya Simpang Pulai–Gua Musang Pakej 6A (Aring ke sempadan Kelantan/Terengganu)", "Completion of Simpang Pulai–Gua Musang Road Package 6A", "road", null, false, "Subkontraktor", "Kelantan", "proj_road1"],
  ["jalan-kampung-tenau", "Membina dan menaik taraf jalan 24.5 km, Kampung Tenau, Mukim Slim, Batang Padang", "Construction and upgrading of 24.5 km road, Kampung Tenau", "road", null, false, "Subkontraktor", "Batang Padang, Perak", "proj_palm1"],
  ["turapan-jalan-paloh", "Kerja-kerja menurap jalan di Paloh", "Road paving works in Paloh", "road", "JKR", true, "Kontraktor", "Paloh, Kluang", "proj_paver1"],
  ["kecemasan-jkr-kluang", "Kerja-kerja kecemasan JKR sekitar Kluang, 2022–2023", "JKR emergency works around Kluang, 2022–2023", "infrastructure", "JKR", true, "Kontraktor", "Kluang", "proj_slope1"],
  ["parkir-hentian-kulai", "Tempat letak kereta tambahan dan kerja berkaitan, Hentian Sebelah Kulai Jaya (arah selatan)", "Additional car park and associated works, Kulai Jaya lay-by (southbound)", "infrastructure", null, false, "Kontraktor", "Kulai, Johor"],
  ["hoarding-guocera", "Hoarding sepanjang 1,645 meter", "1,645-metre site hoarding", "civil", "Guocera", true, "Kontraktor", "Johor", "proj_guocera1"],
  ["wash-through-guocera", "Kerja wash through", "Wash-through works", "facilities", "Guocera", true, "Kontraktor", "Johor"],
  ["premix-kilang-guocera", "Turapan premix jalan dalam kawasan kilang", "Premix paving of factory internal roads", "road", "Guocera", true, "Kontraktor", "Johor", "proj_guocera2"],
];

async function projects() {
  for (const [slug, ms, en, category, client, pub, role, location, cover] of PROJECTS) {
    await db
      .insert(t.projects)
      .values({
        slug,
        titleMs: ms,
        titleEn: en,
        category,
        clientName: client,
        clientPublic: pub,
        role,
        location,
        status: "completed",
        progress: 100,
        coverImage: cover ? `/img/projek/${cover}.jpg` : null,
        isPortfolio: true,
        featured: !!cover && ["stor-baja-felcra", "turapan-jalan-paloh", "renovation-rumah-kluang", "jalan-kampung-tenau", "premix-kilang-guocera", "pagar-anti-climb"].includes(slug),
        descriptionMs: "Rekod daripada Profil Syarikat HUZA MAJU 2026. Nilai dan tempoh projek boleh ditambah oleh admin.",
        descriptionEn: "Record from the HUZA MAJU 2026 company profile. Project value and duration can be added by admin.",
      })
      .onConflictDoNothing();
  }
}

const GALLERY: [string, string, string, string][] = [
  ["r_kitchen2", "Kabinet dapur & kemasan granit", "Kitchen cabinets & granite top", "house_renovation"],
  ["r_bath", "Bilik mandi siap", "Completed bathroom", "house_renovation"],
  ["r_ext", "Tambahan rumah", "House extension", "house_renovation"],
  ["r_kitchen", "Dapur konkrit berjubin", "Tiled concrete kitchen", "house_renovation"],
  ["r_toilet", "Lantai mozek tandas", "Terrazzo toilet floor", "building"],
  ["r_green", "Lantai epoksi", "Epoxy floor", "commercial_renovation"],
  ["r_ceiling", "Pemasangan siling", "Ceiling installation", "house_renovation"],
  ["r_class", "Baik pulih kelas & pendawaian", "Classroom & wiring refurbishment", "building"],
  ["r_office", "Baik pulih pejabat", "Office refurbishment", "commercial_renovation"],
  ["r_2st2", "Struktur bangunan dua tingkat", "Two-storey building structure", "building"],
  ["r_2st3", "Bangunan dua tingkat", "Two-storey building", "building"],
  ["r_brick", "Kerja bata & tingkap", "Brickwork & window openings", "building"],
  ["r_store1", "Stor baja FELCRA siap dicat", "FELCRA fertiliser store, painted", "building"],
  ["r_store3", "Stor siap struktur", "Store, structure complete", "building"],
  ["proj_paver1", "Kerja turapan premix", "Premix paving", "road"],
  ["proj_paver2", "Pemadatan lapisan asfalt", "Asphalt compaction", "road"],
  ["proj_road1", "Jalan siap dengan pengadang", "Completed road with guardrail", "road"],
  ["proj_palm1", "Jalan ladang siap diturap", "Paved estate road", "road"],
  ["proj_bridgepave", "Turapan atas jambatan", "Bridge deck paving", "road"],
  ["proj_guocera2", "Turapan kawasan kilang", "Factory compound paving", "road"],
  ["proj_culvert1", "Pembetung konkrit", "Concrete culvert", "civil"],
  ["proj_culvert2", "Kerja acuan & tetulang", "Formwork & reinforcement", "civil"],
  ["proj_drain", "Longkang konkrit", "Concrete drain", "drainage"],
  ["proj_grass", "Turfing cerun", "Slope turfing", "civil"],
  ["proj_slope1", "Cerun bertingkat", "Terraced slope", "civil"],
  ["r_gabion2", "Pemasangan gabion", "Gabion installation", "civil"],
  ["r_fence", "Pagar anti-climb", "Anti-climb fence", "civil"],
  ["m_exc1", "Excavator di tapak", "Excavator on site", "civil"],
  ["m_bh_062", "Backhoe", "Backhoe", "civil"],
  ["m_lorry2", "Lori", "Lorry", "civil"],
];

async function gallery() {
  const has = await db.select({ id: t.galleryItems.id }).from(t.galleryItems).limit(1);
  if (has.length) return;
  await db.insert(t.galleryItems).values(
    GALLERY.map(([f, ms, en, category], i) => ({ src: `/img/projek/${f}.jpg`, captionMs: ms, captionEn: en, category, isActualProject: true, sort: i })),
  );
}

async function content() {
  const rows: [string, string, string][] = [
    ["stat_years", "8+", "8+"],
    ["stat_years_label", "Tahun beroperasi (sejak 2018)", "Years in operation (since 2018)"],
    ["stat_projects", "100+", "100+"],
    ["stat_projects_label", "Projek kerajaan, swasta & kediaman", "Government, private & residential projects"],
    ["stat_value", "", ""],
    ["stat_value_label", "Jumlah nilai projek", "Total project value"],
    ["stat_clients", "", ""],
    ["stat_clients_label", "Pelanggan", "Clients"],
    ["stat_workforce", "", ""],
    ["stat_workforce_label", "Tenaga kerja teknikal", "Technical workforce"],
    ["stat_states", "3", "3"],
    ["stat_states_label", "Negeri: Johor, Perak & Kelantan", "States: Johor, Perak & Kelantan"],
    ["stat_machinery", "10", "10"],
    ["stat_machinery_label", "Jentera & lori sendiri", "Own machinery & lorries"],
    [
      "about_intro",
      "PERNIAGAAN HUZA MAJU ialah syarikat milik penuh Bumiputera yang berpangkalan di Kluang, Johor dan beroperasi sejak 3 Januari 2018. Kami melaksanakan kerja binaan dan ubah suai bangunan, jalan raya dan turapan, kerja tanah, cerun dan saliran, penyelenggaraan fasiliti, ICT serta pembersihan untuk agensi kerajaan, syarikat swasta dan pemilik kediaman.",
      "PERNIAGAAN HUZA MAJU is a wholly Bumiputera-owned company based in Kluang, Johor, operating since 3 January 2018. We carry out building construction and renovation, roads and paving, earthworks, slopes and drainage, facilities maintenance, ICT and cleaning for government agencies, private companies and homeowners.",
    ],
    [
      "vision",
      "Menjadi kontraktor Bumiputera pilihan di Johor untuk kerja binaan, ubah suai dan infrastruktur yang siap tepat masa, berkualiti dan boleh dipercayai.",
      "To be the preferred Bumiputera contractor in Johor for construction, renovation and infrastructure work that is delivered on time, to quality and with integrity.",
    ],
    ["management_note", "Pemilik & Pengarah Urusan", "Owner & Managing Director"],
    ["hours", "", ""],
  ];
  await db.insert(t.websiteContent).values(rows.map(([key, valueMs, valueEn]) => ({ key, valueMs, valueEn }))).onConflictDoNothing();
}

async function main() {
  await roles();
  console.log("• Roles & permissions");
  await admin();
  await services();
  console.log(`• ${DEFAULT_SERVICES.length} services`);
  await pricingDb();
  console.log(`• ${pricing.length} pricing items + settings`);
  await projects();
  console.log(`• ${PROJECTS.length} portfolio projects`);
  await gallery();
  await content();
  console.log("• Gallery & website content");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
