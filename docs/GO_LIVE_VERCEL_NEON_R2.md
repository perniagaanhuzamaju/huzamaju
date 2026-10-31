# Go-live huzamaju.my: Vercel + Neon + Cloudflare R2

Ikut langkah mengikut susunan. Semua akaun didaftar dengan e-mel syarikat. **Jangan hantar sebarang kunci, kata laluan atau connection string melalui chat, WhatsApp atau e-mel.** Masukkan nilai itu terus ke papan pemuka Vercel sahaja.

Anggaran kos bulanan: Vercel Pro USD 20, Neon (pelan percuma memadai pada mulanya), R2 (percuma sehingga 10 GB), Anthropic mengikut penggunaan (letak had, cth. USD 50). Domain .my lebih kurang RM70 hingga RM100 setahun.

---

## Langkah 1: GitHub (kod)

1. Daftar atau log masuk di https://github.com.
2. Cipta repositori **peribadi (Private)** bernama `huzamaju`. Jangan tandakan "Add README".
3. Sambungkan GitHub kepada Claude: https://claude.ai/connect-github
4. Beritahu saya nama repositori (cth. `namaanda/huzamaju`). Saya akan push kod.

## Langkah 2: Neon (pangkalan data)

1. Daftar di https://neon.tech (boleh guna akaun GitHub).
2. **Create project**:
   - Name: `huzamaju`
   - Postgres version: 16 atau lebih baharu
   - Region: **AWS Asia Pacific (Singapore)**
3. Di halaman projek, klik **Connect**, aktifkan **Connection pooling**, dan salin connection string. Rupanya seperti ini:
   `postgresql://user:xxxx@ep-xxxx-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require`
4. Simpan nilai ini untuk Langkah 5 (`DATABASE_URL`).

## Langkah 3: Cloudflare R2 (fail muat naik)

1. Daftar di https://dash.cloudflare.com, kemudian pilih **R2 Object Storage**. Aktifkan R2; kad diperlukan walaupun penggunaan percuma.
2. **Create bucket**:
   - Nama: `huzamaju-files`
   - Location: Automatic (atau Asia-Pacific)
   - **Jangan** aktifkan akses awam (Public access). Fail pelanggan adalah peribadi dan hanya dibuka melalui laman dengan semakan akses.
3. Di halaman R2 Overview, buka **Manage R2 API Tokens**, kemudian **Create API token**:
   - Permissions: **Object Read & Write**
   - Specify bucket: `huzamaju-files` sahaja
4. Salin tiga nilai berikut. Secret hanya dipaparkan sekali.
   - Access Key ID → `STORAGE_ACCESS_KEY`
   - Secret Access Key → `STORAGE_SECRET_KEY`
   - Endpoint `https://<ACCOUNT_ID>.r2.cloudflarestorage.com` → `STORAGE_ENDPOINT`

## Langkah 4: Kunci Anthropic (AI Estimator)

1. Log masuk di https://console.anthropic.com.
2. **Billing**: tambah kad dan tetapkan had bulanan.
3. **API Keys**, kemudian **Create key**. Namakan kunci `huzamaju-production` dan salin nilainya (`ANTHROPIC_API_KEY`).

## Langkah 5: Vercel (hosting)

1. Daftar di https://vercel.com menggunakan **Continue with GitHub**, kemudian naik taraf ke pelan **Pro**. Analisis AI boleh mengambil sehingga 90 saat, dan pelan percuma memotongnya lebih awal.
2. Pilih **Add New**, kemudian **Project**, dan import repositori `huzamaju`.
3. Sebelum klik Deploy, buka **Build and Output Settings** dan ubah **Build Command** kepada:
   ```
   npm run db:migrate && npm run db:seed && npm run build
   ```
   Arahan ini mencipta jadual dan akaun admin dalam Neon secara automatik. Ia selamat dijalankan setiap kali deploy kerana tidak menulis ganti data sedia ada.
4. Buka **Environment Variables** dan tambah pemboleh ubah berikut (Environment: Production).

   | Nama | Nilai |
   |---|---|
   | `DATABASE_URL` | connection string Neon (Langkah 2) |
   | `DATABASE_SSL` | `true` |
   | `APP_URL` | `https://huzamaju.my` |
   | `SESSION_SECRET` | rentetan rawak panjang (lihat nota di bawah) |
   | `DATA_ENCRYPTION_KEY` | 64 aksara hex rawak (lihat nota di bawah). **Simpan salinan di tempat selamat.** |
   | `SEED_ADMIN_EMAIL` | e-mel admin syarikat |
   | `SEED_ADMIN_PASSWORD` | kata laluan admin yang kuat (tukar selepas log masuk pertama) |
   | `AI_PROVIDER` | `anthropic` |
   | `ANTHROPIC_API_KEY` | kunci daripada Langkah 4 |
   | `STORAGE_DRIVER` | `s3` |
   | `STORAGE_BUCKET` | `huzamaju-files` |
   | `STORAGE_REGION` | `auto` |
   | `STORAGE_ENDPOINT` | endpoint R2 |
   | `STORAGE_ACCESS_KEY` | Access Key ID R2 |
   | `STORAGE_SECRET_KEY` | Secret Access Key R2 |

   Pemboleh ubah lain dalam `.env.example` (e-mel, WhatsApp API, Turnstile, Google) boleh ditambah kemudian.

   **Nota: cara menjana rahsia rawak.** Buka https://generate-secret.vercel.app/32 dan salin hasilnya (64 aksara) untuk `SESSION_SECRET`. Muat semula halaman itu dan salin hasil yang baharu untuk `DATA_ENCRYPTION_KEY`. Dua nilai ini mesti berbeza. Jika ada komputer dengan terminal, boleh juga guna `openssl rand -hex 32`.

   **Kata laluan admin** mesti sekurang-kurangnya 10 aksara dan mengandungi huruf serta nombor. Akaun admin hanya dicipta pada deploy pertama. Selepas itu, `SEED_ADMIN_PASSWORD` boleh dipadam daripada Vercel.
5. Buka **Settings**, kemudian **Functions**, dan pilih **Function Region: Singapore (sin1)**. Region ini dekat dengan Neon dan pelanggan di Johor.
6. Klik **Deploy**. Selepas siap, buka alamat `xxxx.vercel.app` untuk menyemak laman.

## Langkah 6: Domain huzamaju.my

1. Daftar `huzamaju.my` di pendaftar .my (cth. Exabytes, Shinjiru, IPServerOne).
2. Dalam Vercel, buka **Settings**, kemudian **Domains**, dan tambah `huzamaju.my` serta `www.huzamaju.my`.
3. Di panel DNS pendaftar, tambah rekod yang dipaparkan oleh Vercel. Biasanya:

   | Jenis | Nama | Nilai |
   |---|---|---|
   | A | `@` | `76.76.21.21` |
   | CNAME | `www` | `cname.vercel-dns.com` |

4. Tunggu sehingga Vercel memaparkan "Valid Configuration". Proses ini mengambil beberapa minit hingga 24 jam. Sijil SSL dikeluarkan secara automatik.

## Langkah 7: Semakan selepas go-live

- [ ] Log masuk di `https://huzamaju.my/login` dengan akaun admin seed, kemudian tukar kata laluan.
- [ ] Buka **Admin → AI Estimator**: status kunci mesti "ditetapkan".
- [ ] Buat satu anggaran di `/quotation` dengan satu gambar. Semak bahawa analisis berjaya, PDF boleh dimuat turun, dan fail muncul dalam bucket R2.
- [ ] Semak **Admin → AI Estimator → log**. Token dan kos mesti direkodkan.
- [ ] Semak Pangkalan harga, Tetapan harga dan Kandungan laman.
- [ ] Cipta peraturan komisen sebenar.
- [ ] Hantar `https://huzamaju.my/sitemap.xml` ke Google Search Console.

## Langkah 8: Kerja harian dan backup

- **Pembersihan data (PDPA):** fail `.github/workflows/retention.yml` menjalankan `npm run retention` setiap hari pada jam 3 pagi waktu Malaysia. Untuk mengaktifkannya, buka GitHub → repositori → **Settings → Secrets and variables → Actions** dan tambah `DATABASE_URL`, `STORAGE_ENDPOINT`, `STORAGE_BUCKET`, `STORAGE_ACCESS_KEY` dan `STORAGE_SECRET_KEY`.
- **Backup:** Neon menyediakan pemulihan point-in-time. Semak tempohnya dalam pelan anda; pelan percuma tempohnya pendek, jadi pertimbangkan pelan Launch apabila data sebenar mula masuk. Fail dalam R2 mempunyai ketahanan tinggi.
- **Kemas kini kod:** setiap push ke cawangan `main` di GitHub akan deploy semula secara automatik.
