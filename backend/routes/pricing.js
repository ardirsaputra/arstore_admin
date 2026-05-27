// routes/pricing.js — Endpoint harga dengan konversi USD → IDR real-time
// GET /api/pricing  (public — dipakai mobile app & web)

const router = require('express').Router();

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

const FALLBACK_RATE_IDR = 16500; // Fallback jika API kurs tidak tersedia
const CACHE_DURATION_MS  = 6 * 60 * 60 * 1000; // Cache kurs selama 6 jam

let _cachedRate  = null;
let _cachedAt    = null;
let _rateSource  = 'fallback';

// ── Ambil kurs USD/IDR dari open.er-api.com (gratis, tanpa API key) ──────────

async function fetchUsdToIdr() {
  if (_cachedRate && _cachedAt && Date.now() - _cachedAt < CACHE_DURATION_MS) {
    return { rate: _cachedRate, source: _rateSource };
  }

  // Primary: open.er-api.com
  try {
    const res  = await fetch('https://open.er-api.com/v6/latest/USD', { signal: AbortSignal.timeout(5000) });
    const json = await res.json();
    if (json.result === 'success' && json.rates?.IDR) {
      _cachedRate = json.rates.IDR;
      _cachedAt   = Date.now();
      _rateSource = 'open.er-api.com';
      return { rate: _cachedRate, source: _rateSource };
    }
  } catch (_) {}

  // Fallback: exchangerate.host
  try {
    const res  = await fetch('https://api.exchangerate.host/latest?base=USD&symbols=IDR', { signal: AbortSignal.timeout(5000) });
    const json = await res.json();
    if (json.success && json.rates?.IDR) {
      _cachedRate = json.rates.IDR;
      _cachedAt   = Date.now();
      _rateSource = 'exchangerate.host';
      return { rate: _cachedRate, source: _rateSource };
    }
  } catch (_) {}

  // Gunakan cache lama jika ada, atau fallback hardcoded
  return { rate: _cachedRate ?? FALLBACK_RATE_IDR, source: 'fallback' };
}

// ── Pembulatan harga IDR agar terlihat natural ─────────────────────────────

function roundIdr(amount) {
  if (amount < 5000)  return Math.round(amount / 500)  * 500;
  if (amount < 20000) return Math.round(amount / 1000) * 1000;
  if (amount < 50000) return Math.round(amount / 2000) * 2000;
  return               Math.round(amount / 5000) * 5000;
}

function formatIdr(amount) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// ── GET /api/pricing ──────────────────────────────────────────────────────────

router.get('/', async (req, res) => {
  try {
    const { rate, source } = await fetchUsdToIdr();

    const packages = BASE_PACKAGES.map(pkg => {
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
        isPopular:     pkg.isPopular ?? false,
        isLifetime:    pkg.isLifetime ?? false,
      };
    });

    res.json({
      rate,
      rateSource:  source,
      updatedAt:   _cachedAt ? new Date(_cachedAt).toISOString() : null,
      packages,
    });
  } catch (err) {
    console.error('Pricing error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
