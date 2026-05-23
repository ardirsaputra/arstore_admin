# arstore_admin

# ArStore Admin — Next.js + NeonDB + Vercel

Panel admin untuk manajemen lisensi aplikasi **UtilitasKu**.

## Stack

- **Framework**: Next.js 14 (App Router, TypeScript)
- **Database**: NeonDB (Serverless PostgreSQL)
- **Styling**: Tailwind CSS
- **Auth**: JWT (HttpOnly cookie)
- **Deployment**: Vercel

---

## Setup Lokal

### 1. Clone & install

```bash
git clone git@github.com:ardirsaputra/arstore_admin.git
cd arstore_admin
npm install
```

### 2. Konfigurasi environment

```bash
cp .env.example .env.local
# Edit .env.local dengan nilai yang sesuai
```

### 3. Init database NeonDB

Buat database di [neon.tech](https://neon.tech), lalu:

```bash
node scripts/db-init.js
```

Script ini akan membuat semua tabel dan admin user default.

### 4. Jalankan dev server

```bash
npm run dev
# Buka http://localhost:3000
```

---

## Deploy ke Vercel

1. Push repo ke GitHub
2. Buka [vercel.com](https://vercel.com) → Import repository `ardirsaputra/arstore_admin`
3. Set environment variables di Vercel dashboard:
   - `DATABASE_URL` — connection string NeonDB
   - `JWT_SECRET` — string acak panjang
   - `ADMIN_USERNAME` — username admin
   - `ADMIN_PASSWORD` — password admin (hanya untuk db:init)
   - `TRIAL_DAYS` — durasi trial (default: 14)
4. Deploy!

---

## Update Flutter App

Setelah deploy, update `LICENSE_API_URL` di build Flutter:

```bash
flutter build apk --dart-define=LICENSE_API_URL=https://your-app.vercel.app/api
```

---

## Endpoint API (Mobile)

| Method | Path                            | Keterangan                 |
| ------ | ------------------------------- | -------------------------- |
| POST   | `/api/license/register`         | Daftarkan perangkat        |
| GET    | `/api/license/status/:deviceId` | Cek status lisensi         |
| POST   | `/api/license/activate`         | Aktifkan dengan kode       |
| POST   | `/api/license/register-user`    | Simpan nama/email pengguna |
| GET    | `/api/payment-info`             | Info pembayaran (publik)   |
| POST   | `/api/feature-requests`         | Kirim permintaan fitur     |
