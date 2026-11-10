import type { Lang } from "@/lib/i18n";

/** Shared copy for the manpower supply offering. Process steps only, no invented figures. */
export const MANPOWER_STEPS = {
  ms: [
    ["Nyatakan keperluan", "Bilangan pekerja, kemahiran, lokasi tapak, waktu kerja dan tempoh."],
    ["Cadangan & sebut harga", "Kami cadangkan susunan pasukan dan kadar secara bertulis."],
    ["Perjanjian", "Skop, tempoh, kadar dan tanggungjawab dipersetujui sebelum mula."],
    ["Mobilisasi", "Pasukan tiba di tapak dengan ketua pasukan dan taklimat keselamatan."],
    ["Pemantauan", "Laporan kehadiran dan semakan prestasi sepanjang tempoh kontrak."],
  ],
  en: [
    ["Tell us what you need", "Headcount, skills, site location, working hours and duration."],
    ["Proposal & quotation", "We propose the crew make-up and rates in writing."],
    ["Agreement", "Scope, duration, rates and responsibilities agreed before work starts."],
    ["Mobilisation", "The crew arrives on site with a team leader and a safety briefing."],
    ["Monitoring", "Attendance reports and performance reviews throughout the contract."],
  ],
} satisfies Record<Lang, [string, string][]>;

export const MANPOWER_TRADES = {
  ms: ["Pekerja am", "Tukang bata & plaster", "Tukang jubin", "Tukang kayu & acuan", "Pekerja besi tetulang", "Jurukimpal", "Pendawai", "Tukang paip", "Tukang cat", "Pekerja landskap", "Pekerja pembersihan", "Penyelia tapak"],
  en: ["General workers", "Bricklayers & plasterers", "Tilers", "Carpenters & formwork", "Rebar workers", "Welders", "Wiremen", "Plumbers", "Painters", "Landscape workers", "Cleaning crew", "Site supervisors"],
} satisfies Record<Lang, string[]>;

export const MANPOWER_TERMS = {
  ms: [["Harian", "Untuk kerja segera atau jangka pendek."], ["Mingguan / bulanan", "Untuk fasa projek atau tambahan kapasiti."], ["Ikut projek", "Pasukan tetap dari mula hingga siap."]],
  en: [["Daily", "For urgent or short-term work."], ["Weekly / monthly", "For a project phase or extra capacity."], ["Per project", "A dedicated crew from start to finish."]],
} satisfies Record<Lang, [string, string][]>;
