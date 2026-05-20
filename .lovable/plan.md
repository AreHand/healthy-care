# FitLife Health Calculator

Landing + kalkulator kesehatan publik dengan fitur lanjutan (riwayat, ekspor, share, akun). Desain modern energetic — palet hijau-mint + jingga aksen, tipografi Space Grotesk + Inter, layout asymmetric dengan ilustrasi data.

## Struktur Halaman (TanStack routes)

- `/` — Landing + Calculator (hero, form input, hasil real-time)
- `/history` — Daftar riwayat perhitungan (lokal + sinkron akun)
- `/share/$id` — Halaman publik hasil yang dibagikan
- `/auth` — Sign in / Sign up (email+password, Google)
- `/about` — Tentang metodologi & rumus

## Fitur & Implementasi

### 1. Kalkulator inti
- Input: jenis kelamin (radio), usia, berat, tinggi
- Toggle satuan: **Metric (kg/cm) ↔ Imperial (lbs/in)** — konversi otomatis
- Validasi (Zod): usia 2–120, berat 20–500 kg, tinggi 50–250 cm; pesan error inline
- Output realtime:
  - **BMI** = berat(kg) / tinggi(m)²
  - **Kategori** WHO: <18.5 Underweight · 18.5–24.9 Normal · 25–29.9 Overweight · ≥30 Obese
  - **Berat ideal** rumus Devine: pria 50 + 2.3×(inch>60); wanita 45.5 + 2.3×(inch>60) + range Hamwi
  - **Kalori harian** Mifflin-St Jeor × faktor aktivitas (sedentary→very active)
- Visualisasi: gauge BMI berwarna, kartu kategori, rekomendasi singkat per kategori (nutrisi, olahraga, hidrasi)

### 2. Riwayat
- **Tanpa login**: simpan ke `localStorage`
- **Login**: simpan ke tabel `calculations` di Lovable Cloud, sinkron otomatis saat login (merge local→cloud)
- Halaman `/history`: tabel + grafik tren BMI (Recharts), filter tanggal, hapus per item / bulk

### 3. Ekspor
- **PDF Report**: `jspdf` + `jspdf-autotable`, template branded (logo FitLife, header gradient, kartu hasil, gauge, rekomendasi, disclaimer, footer halaman)
- **CSV Riwayat**: unduh seluruh riwayat (atau hasil filter)

### 4. Share link
- Klik "Bagikan" → POST ke server function → simpan ke tabel `shared_results` (public read by id) → URL `/share/{nanoid}` dengan OG meta dinamis

### 5. Dark mode
- Toggle persisten (`localStorage` + `prefers-color-scheme`), token semantik di `src/styles.css`

### 6. Akun (Lovable Cloud)
- Email/password + Google OAuth
- Tabel `profiles` (id, display_name, unit_preference, dark_mode)
- RLS: user hanya akses datanya sendiri
- `shared_results` boleh dibaca anon (read-only)

### 7. Uji akurasi rumus
- File `src/lib/health.ts` murni + suite Vitest (`src/lib/health.test.ts`) dengan kasus referensi WHO/Mifflin

## Teknis

**Stack**: TanStack Start + Tailwind v4 + shadcn/ui + Lovable Cloud (Supabase) + jspdf + recharts + zod + framer-motion + nanoid

**Tabel database**:
```
profiles(id uuid pk → auth.users, display_name, unit_preference, created_at)
calculations(id, user_id, gender, age, weight_kg, height_cm, bmi,
             category, ideal_weight_kg, daily_calories, activity_level,
             notes, created_at)
shared_results(id text pk, payload jsonb, created_at, expires_at)
```
Semua dengan RLS sesuai pola owner-only; `shared_results` SELECT TO anon.

**Server functions**:
- `saveCalculation` (auth) — insert ke `calculations`
- `listCalculations` / `deleteCalculation` (auth)
- `createShare` (auth atau anon) — generate id, simpan payload
- `getShare` — public read

**Design tokens** (oklch): primary mint `oklch(0.72 0.17 165)`, accent orange `oklch(0.7 0.19 50)`, surface gelap untuk dark mode.

## Urutan implementasi

1. Setup design tokens (light+dark), font, layout shell + nav + theme toggle
2. `health.ts` rumus + tes Vitest
3. Halaman `/` dengan form + validasi + hasil + gauge + rekomendasi + unit toggle
4. Enable Lovable Cloud + auth (email + Google) + tabel + RLS
5. Riwayat (local + cloud merge) + halaman `/history` + grafik
6. Server functions share + halaman `/share/$id` + OG meta
7. Ekspor PDF (template branded) + ekspor CSV
8. Halaman `/about` + polish micro-interactions (framer-motion)

## Disclaimer
Halaman menampilkan disclaimer: hasil edukatif, bukan saran medis.
