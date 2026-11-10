import type { Lang } from "@/lib/i18n";

/** Shared copy for the manpower supply offering. Process steps only, no invented figures. */
export const MANPOWER_STEPS = {
  ms: [
    ["Nyatakan keperluan", "Bilangan pekerja, kemahiran, lokasi, waktu kerja dan tempoh."],
    ["Cadangan & sebut harga", "Kami cadangkan susunan pasukan dan kadar secara bertulis."],
    ["Perjanjian", "Skop, tempoh, kadar dan tanggungjawab dipersetujui sebelum mula."],
    ["Mobilisasi", "Pasukan tiba di lokasi dengan ketua pasukan dan taklimat keselamatan."],
    ["Pemantauan", "Laporan kehadiran dan semakan prestasi sepanjang tempoh kontrak."],
  ],
  en: [
    ["Tell us what you need", "Headcount, skills, location, working hours and duration."],
    ["Proposal & quotation", "We propose the crew make-up and rates in writing."],
    ["Agreement", "Scope, duration, rates and responsibilities agreed before work starts."],
    ["Mobilisation", "The crew arrives at your premises with a team leader and a safety briefing."],
    ["Monitoring", "Attendance reports and performance reviews throughout the contract."],
  ],
} satisfies Record<Lang, [string, string][]>;

export const MANPOWER_TRADES = {
  ms: ["Pekerja am", "Pekerja penyelenggaraan", "Pendawai", "Tukang paip", "Jurukimpal", "Tukang cat", "Tukang bata & plaster", "Pekerja kilang", "Pekerja ladang", "Pekerja landskap", "Pekerja pembersihan", "Penyelia"],
  en: ["General workers", "Maintenance workers", "Wiremen", "Plumbers", "Welders", "Painters", "Bricklayers & plasterers", "Factory workers", "Estate workers", "Landscape workers", "Cleaning crew", "Supervisors"],
} satisfies Record<Lang, string[]>;

export const MANPOWER_TERMS = {
  ms: [["Harian / mingguan", "Untuk kerja segera, shutdown atau jangka pendek."], ["Bulanan", "Untuk tambahan kapasiti atau tempoh puncak."], ["Kontrak tahunan", "Pasukan tetap untuk penyelenggaraan berterusan."]],
  en: [["Daily / weekly", "For urgent, shutdown or short-term work."], ["Monthly", "For extra capacity or peak periods."], ["Annual contract", "A dedicated crew for ongoing maintenance."]],
} satisfies Record<Lang, [string, string][]>;
