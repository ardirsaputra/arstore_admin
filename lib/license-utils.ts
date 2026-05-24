import { createHmac } from "crypto";
import { NextRequest, NextResponse } from "next/server";

// ── Trial duration ─────────────────────────────────────────────────────────────
// Default 30 hari, override via env var TRIAL_DAYS
export const TRIAL_DAYS = parseInt(process.env.TRIAL_DAYS ?? "30", 10);

// ── Shared status serializer ───────────────────────────────────────────────────
// Satu-satunya tempat logika expiry dihitung — dipakai oleh semua license routes.
export function toStatusJson(row: Record<string, unknown>) {
  const now = new Date();
  let status = row.status as string;

  if (
    status === "active" &&
    row.expiry_date &&
    !row.is_permanent &&
    now > new Date(row.expiry_date as string)
  ) {
    status = "expired";
  }
  if (status === "trial" && row.trial_start_date) {
    const trialEnd = new Date(row.trial_start_date as string);
    trialEnd.setDate(trialEnd.getDate() + TRIAL_DAYS);
    if (now > trialEnd) status = "expired";
  }

  // activation_type: cocokkan dengan yang diharapkan Flutter client
  let activationType: string;
  if (row.is_permanent) {
    activationType = "permanent";
  } else if (status === "trial") {
    activationType = "trial";
  } else if (row.expiry_date) {
    // Hitung durasi bulan dari expiry_date untuk menentukan tipe
    const months =
      row.trial_start_date || row.created_at
        ? Math.round(
            (new Date(row.expiry_date as string).getTime() - now.getTime()) /
              (1000 * 60 * 60 * 24 * 30),
          )
        : 0;
    if (months <= 1) activationType = "monthly";
    else if (months <= 6) activationType = "6months";
    else if (months <= 12) activationType = "yearly";
    else activationType = "2years";
  } else {
    activationType = "trial";
  }

  return {
    success: true,
    device_id: row.device_id,
    device_model: row.device_model,
    status,
    activation_type: activationType,
    user_name: row.user_name ?? null,
    user_email: row.user_email ?? null,
    trial_start_date: row.trial_start_date
      ? new Date(row.trial_start_date as string).toISOString()
      : null,
    expiry_date: row.expiry_date
      ? new Date(row.expiry_date as string).toISOString()
      : null,
    is_permanent: !!row.is_permanent,
    checked_at: now.toISOString(),
  };
}

// ── API Request Signature Validation ──────────────────────────────────────────
// Flutter mengirim header: X-App-Key, X-Timestamp, X-Signature
// Signature = HMAC-SHA256("appKey:timestamp", APP_SECRET)
// Timestamp ditolak jika selisih > 5 menit.

const APP_KEY = process.env.API_APP_KEY ?? "utilitasku-v1";
const APP_SECRET = process.env.API_APP_SECRET ?? "utsk-arstore-2025";
const TIMESTAMP_TOLERANCE_MS = 5 * 60 * 1000; // 5 menit

export function validateAppRequest(req: NextRequest): {
  valid: boolean;
  error?: NextResponse;
} {
  const appKey = req.headers.get("x-app-key");
  const timestamp = req.headers.get("x-timestamp");
  const signature = req.headers.get("x-signature");

  // Jika tidak ada header sama sekali: biarkan lolos (backward compat sementara)
  // Setelah semua client update, ganti ke: return { valid: false, error: ... }
  if (!appKey && !timestamp && !signature) {
    return { valid: true };
  }

  if (!appKey || !timestamp || !signature) {
    return {
      valid: false,
      error: NextResponse.json(
        { success: false, message: "Header autentikasi tidak lengkap" },
        { status: 401 },
      ),
    };
  }

  if (appKey !== APP_KEY) {
    return {
      valid: false,
      error: NextResponse.json(
        { success: false, message: "App key tidak valid" },
        { status: 401 },
      ),
    };
  }

  // Validasi timestamp (tolak request lama/replay attack)
  const ts = parseInt(timestamp, 10);
  if (isNaN(ts) || Math.abs(Date.now() - ts) > TIMESTAMP_TOLERANCE_MS) {
    return {
      valid: false,
      error: NextResponse.json(
        { success: false, message: "Request kadaluarsa" },
        { status: 401 },
      ),
    };
  }

  // Verifikasi HMAC signature
  const expected = createHmac("sha256", APP_SECRET)
    .update(`${APP_KEY}:${timestamp}`)
    .digest("hex");

  if (signature !== expected) {
    return {
      valid: false,
      error: NextResponse.json(
        { success: false, message: "Signature tidak valid" },
        { status: 401 },
      ),
    };
  }

  return { valid: true };
}

// ── In-memory rate limiter untuk activate endpoint ────────────────────────────
// Mencegah brute-force kode aktivasi.
// Catatan: reset saat serverless instance restart — cukup untuk proteksi dasar.
// Untuk produksi besar, ganti dengan Redis/Vercel KV.

const activateAttempts = new Map<string, { count: number; resetAt: number }>();
const RATE_WINDOW_MS = 60 * 60 * 1000; // 1 jam
const MAX_ATTEMPTS = 5;

export function checkActivateRateLimit(deviceId: string): {
  allowed: boolean;
  error?: NextResponse;
} {
  const now = Date.now();
  const entry = activateAttempts.get(deviceId);

  if (!entry || now > entry.resetAt) {
    activateAttempts.set(deviceId, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return { allowed: true };
  }

  if (entry.count >= MAX_ATTEMPTS) {
    const retryAfterSec = Math.ceil((entry.resetAt - now) / 1000);
    return {
      allowed: false,
      error: NextResponse.json(
        {
          success: false,
          message: `Terlalu banyak percobaan. Coba lagi dalam ${Math.ceil(retryAfterSec / 60)} menit.`,
        },
        {
          status: 429,
          headers: { "Retry-After": String(retryAfterSec) },
        },
      ),
    };
  }

  entry.count++;
  return { allowed: true };
}

export function resetActivateRateLimit(deviceId: string) {
  activateAttempts.delete(deviceId);
}
