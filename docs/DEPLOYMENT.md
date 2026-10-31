# Panduan go-live: huzamaju.my

Langkah bertanda **(anda)** memerlukan akaun milik syarikat. Kod tidak boleh melakukannya bagi pihak anda.

Langkah terperinci untuk Vercel + Neon + Cloudflare R2: lihat [`GO_LIVE_VERCEL_NEON_R2.md`](GO_LIVE_VERCEL_NEON_R2.md).

## 1. Pilih hos (disyorkan: Pilihan A)

| | Pilihan A: Vercel + Neon + Cloudflare R2 | Pilihan B: VPS (cth. DigitalOcean / Exabytes) |
|---|---|---|
| Kos anggaran | RM0 hingga ~RM120/bulan bergantung trafik | ~RM30 hingga RM80/bulan |
| Penyelenggaraan | Minimum, SSL & skala automatik | Anda urus kemas kini OS, backup, SSL |
| Storan fail | `STORAGE_DRIVER=s3` (R2) | `STORAGE_DRIVER=local` |

Nota: Vercel pelan percuma mengehadkan masa fungsi. Analisis AI boleh mengambil 20 hingga 90 saat, jadi gunakan pelan **Pro** (had 300 saat, sudah ditetapkan `maxDuration = 300`) atau Pilihan B.

## 2. Pangkalan data (anda)

1. Cipta pangkalan PostgreSQL (Neon: projek baharu, rantau Singapura `ap-southeast-1`).
2. Salin connection string ke `DATABASE_URL`, tetapkan `DATABASE_SSL=true`.
3. Dari komputer anda (atau langkah build):
   ```bash
   npm run db:migrate
   SEED_ADMIN_PASSWORD='kata-laluan-kuat' npm run db:seed
   ```
   Seed boleh dijalankan semula dengan selamat; ia tidak menulis ganti data yang telah diubah.

## 3. Pemboleh ubah persekitaran

Salin semua kunci daripada `.env.example` ke papan pemuka hos (Vercel: Settings → Environment Variables). Wajib:

- `DATABASE_URL`, `APP_URL=https://huzamaju.my`
- `SESSION_SECRET` (`openssl rand -base64 48`)
- `DATA_ENCRYPTION_KEY` (`openssl rand -hex 32`). **Simpan salinan di tempat selamat.** Tanpa kunci ini nombor akaun bank rakan niaga tidak boleh dibaca semula.

## 4. Kunci Anthropic Claude (anda)

1. Daftar / log masuk di https://console.anthropic.com dengan e-mel syarikat.
2. Billing → tambah kad & had perbelanjaan bulanan (cth. USD 50).
3. API Keys → Create key → nama "huzamaju-production".
4. Letakkan nilai itu dalam `ANTHROPIC_API_KEY` di hos sahaja. Jangan hantar melalui WhatsApp/e-mel dan jangan letak dalam kod.
5. Selepas deploy, buka **Admin → AI Estimator**: status mesti "ANTHROPIC_API_KEY ditetapkan". Buat satu anggaran ujian di `/quotation` dan semak log penggunaan & kos.

Had lalai: 300 panggilan sehari, 6 sejam setiap IP. Boleh diubah di Admin → AI Estimator.

## 5. Domain huzamaju.my (anda)

1. Daftar `huzamaju.my` melalui pendaftar MYNIC (cth. Exabytes, Shinjiru, IPServerOne, MYNIC terus). Domain `.my` biasanya sekitar RM70 hingga RM100 setahun.
2. Dalam Vercel: Project → Settings → Domains → tambah `huzamaju.my` dan `www.huzamaju.my`.
3. Di panel DNS pendaftar, tambah rekod yang dipaparkan oleh Vercel, biasanya:

| Jenis | Nama | Nilai |
|---|---|---|
| A | `@` | `76.76.21.21` |
| CNAME | `www` | `cname.vercel-dns.com` |

   (Untuk VPS: rekod A `@` dan `www` ke alamat IP pelayan.)
4. Penyebaran DNS mengambil masa beberapa minit hingga 24 jam.

## 6. SSL

- Vercel: sijil Let's Encrypt dikeluarkan automatik selepas DNS sah.
- VPS: pasang Caddy (SSL automatik) atau Nginx + Certbot:
  ```bash
  sudo certbot --nginx -d huzamaju.my -d www.huzamaju.my
  ```
- Header HSTS sudah dihantar oleh aplikasi.

## 7. VPS (Pilihan B) ringkas

```bash
# Ubuntu 24.04
sudo apt install -y nodejs npm postgresql nginx
git clone <repo> /srv/huzamaju && cd /srv/huzamaju
npm ci && cp .env.example .env && nano .env
npm run db:migrate && npm run db:seed
npm run build
# jalankan dengan systemd atau pm2:
npx pm2 start "npm run start" --name huzamaju && npx pm2 save
```
Nginx: `proxy_pass http://127.0.0.1:3000;`, `client_max_body_size 12m;`.

## 8. E-mel (pilihan, disyorkan)

1. Daftar di https://resend.com, tambah domain `huzamaju.my`.
2. Tambah rekod DNS SPF, DKIM (dan DMARC) yang diberi oleh Resend.
3. Tetapkan `EMAIL_PROVIDER=resend`, `EMAIL_API_KEY`, `EMAIL_FROM=HUZA MAJU <noreply@huzamaju.my>`.
Sehingga itu, butang "E-mel kepada saya" memaklumkan pelanggan untuk memuat turun PDF dan staf menerima notifikasi dalam papan pemuka.

## 9. WhatsApp

Pautan `wa.me/60178717848` berfungsi tanpa konfigurasi. Notifikasi automatik kepada staf memerlukan WhatsApp Business Cloud API (Meta Business), kemudian isi `WHATSAPP_API_TOKEN` dan `WHATSAPP_PHONE_NUMBER_ID`.

## 10. Backup

- Neon: point-in-time restore disertakan (semak tempoh pelan). Tambah eksport mingguan:
  ```bash
  pg_dump "$DATABASE_URL" -Fc -f huzamaju-$(date +%F).dump
  ```
- VPS: cron harian `pg_dump` ke folder lain + salin ke storan luar (R2 / Google Drive), simpan 30 hari.
- Fail muat naik: R2 mempunyai ketahanan tinggi; untuk storan tempatan, backup folder `storage/` bersama pangkalan data.
- Uji pemulihan sekurang-kurangnya sekali: `pg_restore -d <db-ujian> fail.dump`.

## 11. Kerja berjadual

```
0 3 * * *  cd /srv/huzamaju && npm run retention
```
(Vercel: gunakan Vercel Cron atau GitHub Actions untuk menjalankan arahan yang sama.)

## 12. Google

1. Search Console: tambah harta `https://huzamaju.my`, pilih pengesahan tag HTML, letak kod dalam `GOOGLE_SITE_VERIFICATION`, kemudian hantar `https://huzamaju.my/sitemap.xml`.
2. Analytics: cipta harta GA4, letak ID `G-XXXX` dalam `NEXT_PUBLIC_GA_ID`.
3. Google Business Profile: daftar alamat Kluang dengan nombor 017-871 7848.

## 13. Senarai semak sebelum dilancarkan

- [ ] Log masuk sebagai admin, tukar kata laluan seed.

Untuk Pilihan A, ikut langkah terperinci dalam `docs/GO_LIVE_VERCEL_NEON_R2.md`.
- [ ] Semak Admin → Kandungan laman: statistik pengalaman hanya angka yang boleh dibuktikan.
- [ ] Semak Admin → Pangkalan harga & Tetapan harga (margin, luar jangka, faktor lokasi bertanda "andaian").
- [ ] Cipta peraturan komisen sebenar (Admin → Peraturan komisen). Contoh yang di-seed adalah tidak aktif dan bernilai 0.
- [ ] Buat satu anggaran AI ujian dan muat turun PDF.
- [ ] Pastikan semua gambar dalam galeri dilabel betul (projek sebenar vs ilustrasi).
- [ ] Hantar sitemap ke Google Search Console.
