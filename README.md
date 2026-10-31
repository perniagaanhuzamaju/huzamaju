# HUZA MAJU platform (huzamaju.my)

Laman korporat dwibahasa, **HUZA MAJU AI Estimator** (Anthropic Claude), portal pelanggan, portal rakan niaga dan papan pemuka pentadbir untuk PERNIAGAAN HUZA MAJU.

## Teknologi

| Lapisan | Pilihan |
|---|---|
| Aplikasi | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4 |
| Pangkalan data | PostgreSQL + Drizzle ORM (migrasi dalam `drizzle/`) |
| AI | `@anthropic-ai/sdk`, Messages API, output berstruktur (zod), dipanggil dari pelayan sahaja |
| PDF / Excel | pdfkit, exceljs |
| Storan fail | Folder tempatan (VPS) atau S3 / Cloudflare R2 |
| E-mel / WhatsApp | Resend, WhatsApp Business Cloud API (pilihan) |
| Ujian | Vitest (enjin harga, komisen, privasi, aliran sebut harga) |

## Mula (pembangunan)

```bash
npm install
cp .env.example .env          # isi DATABASE_URL, SESSION_SECRET, DATA_ENCRYPTION_KEY
npm run db:migrate            # cipta jadual
npm run db:seed               # peranan, 66 perkhidmatan, 93 kadar harga, projek portfolio, admin pertama
npm run dev                   # http://localhost:3000
npm test                      # 109 ujian
```

Tanpa `ANTHROPIC_API_KEY`, wizard sebut harga tetap berfungsi: permintaan direkodkan sebagai "Menunggu semakan QS" supaya QS menyediakan anggaran secara manual.

## Struktur

```
src/app/[lang]/        Laman awam (BM di /, EN di /en)
src/app/(app)/         Log masuk, /q/[token], /portal, /partner, /admin
src/app/api/           API (semua pengesahan & kebenaran di pelayan)
src/lib/ai/            Lapisan AI: antara muka penyedia, Anthropic, prompt, had, log kos
src/lib/pricing/       Enjin harga berketentuan (semua RM dikira di sini)
src/lib/commission/    Enjin komisen & aliran kelayakan
src/lib/quotation/     Konteks harga, nombor rujukan, PDF, perkhidmatan sebut harga
src/db/schema.ts       27 jadual
scripts/seed.ts        Data awal (daripada dokumen syarikat & Senarai Harga 2026)
scripts/retention.ts   Kerja pengekalan data PDPA (jalankan setiap hari)
docs/                  Deploy, DNS, SSL, backup, laporan QA
```

## Peraturan penting yang dibina dalam sistem

- AI **tidak pernah** memberi harga. Claude hanya mencadangkan item, unit dan kuantiti, memilih kod daripada senarai harga yang diluluskan. Kod rekaan dibuang; item tanpa kadar ditanda "Semakan QS".
- Nama, telefon, e-mel dan alamat pelanggan **tidak dihantar** kepada penyedia AI. Teks bebas ditapis (telefon, e-mel, no. IC) dan data GPS dibuang daripada gambar JPG.
- Kunci API hanya dalam pemboleh ubah persekitaran di pelayan. Had harian, had setiap IP, log token & kos dalam `ai_usage_logs` (metadata sahaja).
- Setiap anggaran memaparkan "Anggaran Bajet Awal – Tertakluk kepada Pemeriksaan Tapak dan Pengesahan Akhir". Sebut harga rasmi mesti diluluskan oleh pengguna dengan kebenaran `quotations.approve`.
- Komisen tidak ditetapkan dalam kod dan tidak dijana kerana sebut harga dibuat. Ia dijana apabila projek diperoleh, layak hanya mengikut bayaran pelanggan yang **disahkan**, kemudian perlu kelulusan dan rekod bayaran.
- Kos dalaman, margin dan nombor akaun bank tidak pernah dihantar ke pelayar pelanggan / rakan niaga. Paparan nombor akaun penuh oleh admin direkodkan dalam log audit.

Lihat `docs/DEPLOYMENT.md` untuk langkah go-live dan `docs/QA_REPORT.md` untuk apa yang telah diuji.
