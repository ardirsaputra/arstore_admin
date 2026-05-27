import { NextResponse } from 'next/server';

// ── Konfigurasi paket harga (nilai dalam USD) ────────────────────────────────

type Package = {
  id: string;
  months: number | null;
  priceUsd: number;
  regularUsd?: number;
  isPopular: boolean;
  isLifetime: boolean;
};

const BASE_PACKAGES: Package[] = [
  { id: '3months',  months: 3,    priceUsd: 0.60,                   isPopular: false, isLifetime: false },
  { id: '6months',  months: 6,    priceUsd: 1.00, regularUsd: 1.20, isPopular: false, isLifetime: false },
  { id: 'yearly',   months: 12,   priceUsd: 1.80, regularUsd: 2.40, isPopular: true,  isLifetime: false },
  { id: '18months', months: 18,   priceUsd: 2.50, regularUsd: 3.60, isPopular: false, isLifetime: false },
  { id: '2years',   months: 24,   priceUsd: 3.00, regularUsd: 4.80, isPopular: false, isLifetime: false },
  { id: 'lifetime', months: null, priceUsd: 6.00,                   isPopular: false, isLifetime: true  },
];

const FALLBACK_RATE_IDR = 16500;
const CACHE_DURATION_MS = 6 * 60 * 60 * 1000;

let _cachedRate = FALLBACK_RATE_IDR;
let _cachedAt: number | null = null;
let _rateSource = 'fallback';

async function fetchUsdToIdr(): Promise<{ rate: number; source: string }> {
  if (_cachedAt && Date.now() - _cachedAt < CACHE_DURATION_MS) {
    return { rate: _cachedRate, source: _rateSource };
  }

  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD', { cache: 'no-store' });
    const json = await res.json();
    if (json.result === 'success' && typeof json.rates?.IDR === 'number') {
      _cachedRate = json.rates.IDR as number;
      _cachedAt = Date.now();
      _rateSource = 'open.er-api.com';
      return { rate: _cachedRate, source: _rateSource };
    }
  } catch (_) {}

  try {
    const res = await fetch('https://api.exchangerate.host/latest?base=USD&symbols=IDR', { cache: 'no-store' });
    const json = await res.json();
    if (json.success && typeof json.rates?.IDR === 'number') {
      _cachedRate = json.rates.IDR as number;
      _cachedAt = Date.now();
      _rateSource = 'exchangerate.host';
      return { rate: _cachedRate, source: _rateSource };
    }
  } catch (_) {}

  // Return cached or fallback — _cachedRate is always a number (initialized to FALLBACK_RATE_IDR)
  return { rate: _cachedRate, source: 'fallback' };
}

function roundIdr(amount: number): number {
  if (amount < 5000)  return Math.round(amount / 500)  * 500;
  if (amount < 20000) return Math.round(amount / 1000) * 1000;
  if (amount < 50000) return Math.round(amount / 2000) * 2000;
  return               Math.round(amount / 5000) * 5000;
}

function formatIdr(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export async function GET() {
  try {
    const { rate, source } = await fetchUsdToIdr();

    const packages = BASE_PACKAGES.map((pkg) => {
      const priceIdr   = roundIdr(pkg.priceUsd * rate);
      const regularIdr = pkg.regularUsd ? roundIdr(pkg.regularUsd * rate) : null;
      const saving     = regularIdr ? Math.round((1 - priceIdr / regularIdr) * 100) : 0;

      return {
        id:            pkg.id,
        months:        pkg.months,
        priceUsd:      pkg.priceUsd,
        priceIdr,
        labelIdr:      formatIdr(priceIdr),
        regularIdr,
        savingPercent: saving,
        isPopular:     pkg.isPopular,
        isLifetime:    pkg.isLifetime,
      };
    });

    return NextResponse.json({
      rate,
      rateSource: source,
      updatedAt: _cachedAt ? new Date(_cachedAt).toISOString() : null,
      packages,
    });
  } catch (err) {
    console.error('Pricing error:', err);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
