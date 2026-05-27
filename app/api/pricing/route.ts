import { NextResponse } from 'next/server';

// ── Konfigurasi paket harga (nilai dalam USD) ────────────────────────────────

const BASE_PACKAGES = [
  { id: 'monthly',  months: 1,    priceUsd: 0.20, isPopular: false, isLifetime: false },
  { id: '3months',  months: 3,    priceUsd: 0.50, regularUsd: 0.60, isPopular: false, isLifetime: false },
  { id: '6months',  months: 6,    priceUsd: 1.00, regularUsd: 1.20, isPopular: false, isLifetime: false },
  { id: 'yearly',   months: 12,   priceUsd: 1.80, regularUsd: 2.40, isPopular: true,  isLifetime: false },
  { id: '18months', months: 18,   priceUsd: 2.50, regularUsd: 3.60, isPopular: false, isLifetime: false },
  { id: '2years',   months: 24,   priceUsd: 3.00, regularUsd: 4.80, isPopular: false, isLifetime: false },
  { id: 'lifetime', months: null, priceUsd: 6.00, isPopular: false, isLifetime: true  },
];

const FALLBACK_RATE_IDR = 16500;
const CACHE_DURATION_MS = 6 * 60 * 60 * 1000;

let _cachedRate: number | null = null;
let _cachedAt: number | null = null;
let _rateSource = 'fallback';

async function fetchUsdToIdr(): Promise<{ rate: number; source: string }> {
  if (_cachedRate && _cachedAt && Date.now() - _cachedAt < CACHE_DURATION_MS) {
    return { rate: _cachedRate, source: _rateSource };
  }

  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD', { next: { revalidate: 21600 } });
    const json = await res.json();
    if (json.result === 'success' && json.rates?.IDR) {
      _cachedRate = json.rates.IDR;
      _cachedAt = Date.now();
      _rateSource = 'open.er-api.com';
      return { rate: _cachedRate as number, source: _rateSource };
    }
  } catch (_) {}

  try {
    const res = await fetch('https://api.exchangerate.host/latest?base=USD&symbols=IDR', { next: { revalidate: 21600 } });
    const json = await res.json();
    if (json.success && json.rates?.IDR) {
      _cachedRate = json.rates.IDR;
      _cachedAt = Date.now();
      _rateSource = 'exchangerate.host';
      return { rate: _cachedRate as number, source: _rateSource };
    }
  } catch (_) {}

  return { rate: _cachedRate ?? FALLBACK_RATE_IDR, source: 'fallback' };
}

function roundIdr(amount: number) {
  if (amount < 5000)  return Math.round(amount / 500)  * 500;
  if (amount < 20000) return Math.round(amount / 1000) * 1000;
  if (amount < 50000) return Math.round(amount / 2000) * 2000;
  return               Math.round(amount / 5000) * 5000;
}

function formatIdr(amount: number) {
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

    const packages = BASE_PACKAGES.map(pkg => {
      const safeRate = rate ?? FALLBACK_RATE_IDR;
      const priceIdr = roundIdr(pkg.priceUsd * safeRate);
      const regularIdr = pkg.regularUsd ? roundIdr(pkg.regularUsd * safeRate) : null;
      const saving = regularIdr ? Math.round((1 - priceIdr / regularIdr) * 100) : 0;

      return {
        id: pkg.id,
        months: pkg.months,
        priceUsd: pkg.priceUsd,
        priceIdr,
        labelIdr: formatIdr(priceIdr),
        regularIdr,
        savingPercent: saving,
        isPopular: pkg.isPopular ?? false,
        isLifetime: pkg.isLifetime ?? false,
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
