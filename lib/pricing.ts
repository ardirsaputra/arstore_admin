// lib/pricing.ts — Shared subscription pricing data + helpers.
//
// Paket harga disimpan di tabel `pricing_packages` (dapat diatur dari admin panel).
// Endpoint publik /api/pricing membaca dari sini lalu mengonversi USD→IDR secara live.
// Jika tabel kosong/error, jatuh ke BASE_PACKAGES sebagai fallback offline.

import { sql } from "@/lib/db";

export type PricingPackage = {
  id: string;                 // '3months', 'yearly', 'lifetime', dst.
  months: number | null;      // null = lifetime
  priceUsd: number;
  regularUsd: number | null;  // null = tanpa diskon
  isPopular: boolean;
  isLifetime: boolean;
  isActive: boolean;
  sortOrder: number;
};

// Default bawaan — dipakai sebagai seed awal tabel & fallback bila DB tak tersedia.
export const BASE_PACKAGES: PricingPackage[] = [
  { id: "3months",  months: 3,    priceUsd: 0.60, regularUsd: null, isPopular: false, isLifetime: false, isActive: true, sortOrder: 1 },
  { id: "6months",  months: 6,    priceUsd: 1.00, regularUsd: 1.20, isPopular: false, isLifetime: false, isActive: true, sortOrder: 2 },
  { id: "yearly",   months: 12,   priceUsd: 1.80, regularUsd: 2.40, isPopular: true,  isLifetime: false, isActive: true, sortOrder: 3 },
  { id: "18months", months: 18,   priceUsd: 2.50, regularUsd: 3.60, isPopular: false, isLifetime: false, isActive: true, sortOrder: 4 },
  { id: "2years",   months: 24,   priceUsd: 3.00, regularUsd: 4.80, isPopular: false, isLifetime: false, isActive: true, sortOrder: 5 },
  { id: "lifetime", months: null, priceUsd: 6.00, regularUsd: null, isPopular: false, isLifetime: true,  isActive: true, sortOrder: 6 },
];

let _migrationRan = false;

/** Buat tabel pricing_packages bila belum ada, lalu seed dengan BASE_PACKAGES sekali. */
export async function ensurePricingTable(): Promise<void> {
  if (_migrationRan) return;
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS pricing_packages (
        id           VARCHAR(50) PRIMARY KEY,
        months       INTEGER,
        price_usd    NUMERIC(10,2) NOT NULL,
        regular_usd  NUMERIC(10,2),
        is_popular   BOOLEAN NOT NULL DEFAULT FALSE,
        is_lifetime  BOOLEAN NOT NULL DEFAULT FALSE,
        is_active    BOOLEAN NOT NULL DEFAULT TRUE,
        sort_order   INTEGER NOT NULL DEFAULT 0,
        updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    // Seed hanya bila tabel masih kosong (jangan timpa edit admin)
    const existing = await sql`SELECT COUNT(*)::int AS count FROM pricing_packages`;
    if ((existing[0]?.count ?? 0) === 0) {
      for (const p of BASE_PACKAGES) {
        await sql`
          INSERT INTO pricing_packages
            (id, months, price_usd, regular_usd, is_popular, is_lifetime, is_active, sort_order)
          VALUES
            (${p.id}, ${p.months}, ${p.priceUsd}, ${p.regularUsd},
             ${p.isPopular}, ${p.isLifetime}, ${p.isActive}, ${p.sortOrder})
          ON CONFLICT (id) DO NOTHING
        `;
      }
    }
    _migrationRan = true;
  } catch (err) {
    console.error("ensurePricingTable error:", err);
  }
}

function rowToPackage(row: Record<string, unknown>): PricingPackage {
  return {
    id:         String(row.id),
    months:     row.months == null ? null : Number(row.months),
    priceUsd:   Number(row.price_usd),
    regularUsd: row.regular_usd == null ? null : Number(row.regular_usd),
    isPopular:  Boolean(row.is_popular),
    isLifetime: Boolean(row.is_lifetime),
    isActive:   Boolean(row.is_active),
    sortOrder:  Number(row.sort_order ?? 0),
  };
}

/** Semua paket (termasuk nonaktif) — dipakai admin. Urut by sort_order. */
export async function getAllPackages(): Promise<PricingPackage[]> {
  await ensurePricingTable();
  try {
    const rows = await sql`SELECT * FROM pricing_packages ORDER BY sort_order, id`;
    if (rows.length === 0) return [...BASE_PACKAGES];
    return rows.map(rowToPackage);
  } catch (err) {
    console.error("getAllPackages error:", err);
    return [...BASE_PACKAGES];
  }
}

/** Hanya paket aktif — dipakai endpoint publik. */
export async function getActivePackages(): Promise<PricingPackage[]> {
  const all = await getAllPackages();
  const active = all.filter((p) => p.isActive);
  return active.length > 0 ? active : BASE_PACKAGES.filter((p) => p.isActive);
}

/** Ganti seluruh isi tabel dengan daftar paket baru (dipanggil admin PUT). */
export async function replaceAllPackages(packages: PricingPackage[]): Promise<void> {
  await ensurePricingTable();
  await sql`DELETE FROM pricing_packages`;
  for (const p of packages) {
    await sql`
      INSERT INTO pricing_packages
        (id, months, price_usd, regular_usd, is_popular, is_lifetime, is_active, sort_order)
      VALUES
        (${p.id}, ${p.months}, ${p.priceUsd}, ${p.regularUsd},
         ${p.isPopular}, ${p.isLifetime}, ${p.isActive}, ${p.sortOrder})
    `;
  }
}
