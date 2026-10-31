# Laporan QA: platform HUZA MAJU

Tarikh: 31/10/2026 · Persekitaran: Node 22, PostgreSQL 16 tempatan, Chromium (Playwright)

## Ringkasan

| Semakan | Keputusan |
|---|---|
| `npm test` (Vitest) | **109 / 109 lulus** |
| `npm run typecheck` | Lulus, 0 ralat |
| `npx eslint src scripts` | Lulus, 0 ralat |
| `npm run build` (produksi) | Lulus, semua laluan dibina |
| Migrasi vs skema (`drizzle-kit generate`) | Tiada perubahan tertunggak |
| Kerja pengekalan data (`npm run retention`) | Berjalan tanpa ralat |

## Apa yang diuji

### Enjin harga (`tests/pricing.test.ts`)
- Kesemua 93 kadar Senarai Harga 2026: harga jual kediaman dan komersial yang dikira sistem sama dengan hamparan syarikat.
- Pembundaran berperingkat, mod margin/markup, margin minimum dikuatkuasakan, faktor lokasi, penukaran unit (kps, kaki larian, titik), caj minimum, luar jangka, SST dimatikan secara lalai.
- Item tanpa kadar, unit tidak serasi atau kuantiti kosong ditanda "Semakan QS" dan tidak dimasukkan dalam jumlah.

### Enjin komisen (`tests/commission.test.ts`)
- Pemilihan peraturan (keutamaan, kategori, jenis rakan, julat nilai, tarikh sah), had, bonus kempen, pembahagian peringkat, kelayakan mengikut bayaran disahkan.

### Privasi & fail (`tests/privacy.test.ts`)
- Telefon, e-mel dan no. IC ditapis daripada teks yang dihantar ke AI; ukuran tidak terjejas.
- Segmen EXIF/GPS dibuang daripada JPG.
- Jenis fail dikesan melalui kandungan (bukan sambungan); fail `.txt` ditolak.

### Aliran sebut harga AI (`tests/quotation-flow.test.ts`)
Penyedia AI digantikan dengan jawapan tetap (tiada rangkaian); selebihnya sebenar (pangkalan data, had, log, harga, PDF):
- Kod harga rekaan daripada AI dibuang dan item menjadi "Semakan QS".
- Log penggunaan AI merekod token dan kos (USD) dengan betul.
- Nombor rujukan `HM-SH-2026-0001` dijana secara atomik.
- Paparan pelanggan tidak mengandungi kos dalaman, margin atau komponen.
- PDF dijana dengan penafian "Anggaran Bajet Awal – Tertakluk kepada Pemeriksaan Tapak dan Pengesahan Akhir", nombor, tarikh, tempoh sah, butiran syarikat dan terma.

### Ujian pelayar (Playwright, pelayan sebenar)
- 17 halaman awam BM/EN, sitemap dan robots: HTTP 200.
- Wizard 8 langkah: pilih kategori → kerja → maklumat projek + muat naik JPG → analisis → keputusan → maklumat pelanggan → permintaan lawatan tapak berjaya → pautan `/q/…`.
- Muat naik `.txt` ditolak; padam fail muat naik berfungsi.
- Portal pelanggan: daftar → tuntut anggaran dengan pautan → muat naik dokumen → hantar mesej. Pengguna tanpa log masuk mendapat 401 untuk dokumen peribadi. Anggaran milik akaun lain tidak boleh dituntut (409).
- Admin: 25 halaman dibuka tanpa ralat konsol.

### Aliran rakan niaga & komisen (hujung ke hujung melalui API)
1. Peraturan komisen dengan peringkat tidak berjumlah 100% ditolak.
2. Rakan niaga mendaftar; hantar lead sebelum kelulusan ditolak (403).
3. Admin meluluskan; lead diterima; lead kedua dengan telefon sama ditanda duplikasi (409).
4. Akaun bank disimpan bersulit; hanya 4 digit akhir dipaparkan.
5. Projek tanpa nilai kontrak tidak boleh menjana komisen.
6. Projek RM40,000 dengan peraturan 5% (50/50): 2 peringkat RM1,000 "menunggu".
7. Kelulusan sebelum bayaran disahkan ditolak.
8. Bayaran RM20,000 direkod dan disahkan → hanya peringkat 1 menjadi "layak".
9. Peringkat 1 diluluskan dan dibayar; peringkat 2 kekal menunggu. Rakan niaga melihat status dalam portal.
10. Paparan nombor akaun penuh oleh admin direkodkan dalam log audit. Rakan niaga mendapat 403 untuk API admin.

## Belum diuji (memerlukan kelayakan sebenar)

Bahagian ini telah dibina dan diuji sejauh mungkin tanpa kunci, tetapi **tidak boleh disahkan berfungsi** sehingga kelayakan sebenar dimasukkan:

| Integrasi | Status | Cara mengesahkan selepas go-live |
|---|---|---|
| Anthropic Claude API (panggilan langsung) | Kod menggunakan SDK rasmi; tiada kunci API dalam persekitaran ujian, jadi tiada panggilan sebenar dibuat. Laluan "AI tidak tersedia" diuji. | Tetapkan `ANTHROPIC_API_KEY`, buat satu anggaran, semak Admin → AI Estimator (status "ok", token, kos). |
| E-mel (Resend) | Tidak dikonfigurasi; butang e-mel memaparkan mesej yang betul (503). | Sahkan domain dalam Resend, hantar anggaran ujian kepada diri sendiri. |
| WhatsApp Cloud API | Tidak dikonfigurasi; pautan wa.me berfungsi. | Isi token Meta, hantar pertanyaan ujian. |
| Storan S3 / Cloudflare R2 | Hanya storan tempatan diuji. | Tetapkan `STORAGE_DRIVER=s3`, muat naik satu fail. |
| Cloudflare Turnstile | Tidak dikonfigurasi (pengesahan dilangkau). | Isi kunci tapak & rahsia, cuba wizard. |
| Google Analytics / Search Console | Kod sedia; tiada ID. | Isi ID, semak masa nyata GA. |
| Deploy, DNS, SSL | Belum dilakukan (memerlukan akaun syarikat). | Ikut `docs/DEPLOYMENT.md`. |

## Had yang diketahui & cadangan seterusnya

- **Lupa kata laluan / pengesahan e-mel** belum dibina kerana bergantung pada penghantaran e-mel. Buat masa ini admin menetapkan kata laluan staf; disyorkan ditambah sebaik Resend aktif.
- Faktor lokasi JB (1.11), daerah lain Johor (1.05) dan luar Johor (1.15) ialah **andaian** dan perlu disahkan oleh QS.
- 66 kadar dalam pangkalan harga ditanda "anggaran" (tiada kos sebenar dalam hamparan); hanya item dengan kos sebenar ditanda "disahkan".
- Statistik nilai projek, bilangan pelanggan dan tenaga kerja dibiarkan kosong sehingga syarikat memberikan angka yang boleh dibuktikan.
- Data ujian QA (anggaran HM-SH-2026-0001 hingga 0007, akaun QA) hanya wujud dalam pangkalan data pembangunan tempatan dan tidak termasuk dalam seed produksi.
