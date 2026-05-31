// lib/license-utils.ts — Shared utilities for mobile license API routes
// Used by: /api/license/register, /api/license/status, /api/license/activate, etc.

import { NextRequest, NextResponse } from "next/server";

const TRIAL_DAYS = parseInt(process.env.TRIAL_DAYS ?? "30", 10);

// ── App request signature validation ─────────────────────────────────────────
// Flutter app signs each request with:
//   X-App-Key  : utilitasku-v1
//   X-Timestamp: unix ms
//   X-Signature: HMAC-SHA256(appKey:timestamp, appSecret)
//
// Validation is lenient (no HMAC check here) to keep server simple.
// You can add full HMAC-SHA256 verification if needed.

export function validateAppRequest(
  _req: NextRequest,
): { valid: true; error?: undefined } | { valid: false; error: NextResponse } {
  // Currently permissive — add signature validation if you need strict checks.
  return { valid: true };
}

// ── toStatusJson ──────────────────────────────────────────────────────────────
// Converts a DB device row to the LicenseStatus JSON the Flutter app expects.

export function toStatusJson(row: Record<string, unknown>) {
  if (!row) return null;
  const now = new Date();

  let status = row.status as string;

  // Auto-expire
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

  return {
    success: true,
    device_id: row.device_id,
    device_model: row.device_model,
    status,
    activation_type: row.is_permanent
      ? "permanent"
      : status === "trial"
        ? "trial"
        : "timed",
    user_name: row.user_name ?? null,
    user_email: row.user_email ?? null,
    trial_start_date: row.trial_start_date
      ? new Date(row.trial_start_date as string).toISOString()
      : null,
    expiry_date: row.expiry_date
      ? new Date(row.expiry_date as string).toISOString()
      : null,
    is_permanent: row.is_permanent,
    checked_at: now.toISOString(),
  };
}

// ── Rate limiting (in-memory, resets on server restart) ───────────────────────
// Simple per-device counter stored in a Map.

type RateEntry = { count: number; resetAt: number };
const _rateLimits = new Map<string, RateEntry>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 60 * 60 * 1000; // 1 hour

export function checkActivateRateLimit(
  deviceId: string,
): { allowed: true; error?: undefined } | { allowed: false; error: NextResponse } {
  const now = Date.now();
  const entry = _rateLimits.get(deviceId);

  if (!entry || now > entry.resetAt) {
    _rateLimits.set(deviceId, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true };
  }

  if (entry.count >= MAX_ATTEMPTS) {
    const minutesLeft = Math.ceil((entry.resetAt - now) / 60000);
    return {
      allowed: false,
      error: NextResponse.json(
        {
          success: false,
          message: `Terlalu banyak percobaan. Coba lagi dalam ${minutesLeft} menit.`,
        },
        { status: 429 },
      ),
    };
  }

  entry.count++;
  return { allowed: true };
}

export function resetActivateRateLimit(deviceId: string): void {
  _rateLimits.delete(deviceId);
}
