import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import {
  toStatusJson,
  validateAppRequest,
  checkActivateRateLimit,
  resetActivateRateLimit,
} from "@/lib/license-utils";

export async function POST(req: NextRequest) {
  const { valid, error } = validateAppRequest(req);
  if (!valid) return error!;

  try {
    const { device_id, code } = await req.json();
    if (!device_id || !code) {
      return NextResponse.json(
        { success: false, message: "device_id dan code wajib diisi" },
        { status: 400 },
      );
    }

    // Rate limit: maks 5 percobaan per jam per device
    const rateCheck = checkActivateRateLimit(device_id);
    if (!rateCheck.allowed) return rateCheck.error!;

    const normalizedCode = code.trim().toUpperCase();
    const codeRows =
      await sql`SELECT * FROM license_codes WHERE code = ${normalizedCode}`;

    if (codeRows.length === 0) {
      return NextResponse.json(
        { success: false, message: "Kode tidak ditemukan" },
        { status: 400 },
      );
    }

    const licCode = codeRows[0];
    if (licCode.used) {
      return NextResponse.json(
        { success: false, message: "Kode sudah pernah digunakan" },
        { status: 400 },
      );
    }

    const devRows =
      await sql`SELECT * FROM devices WHERE device_id = ${device_id}`;
    if (devRows.length === 0) {
      return NextResponse.json(
        { success: false, message: "Perangkat belum terdaftar" },
        { status: 404 },
      );
    }

    const isLifetime = licCode.type === "lifetime";
    let expiryDate: Date | null = null;
    if (!isLifetime && licCode.duration_months) {
      expiryDate = new Date();
      expiryDate.setMonth(expiryDate.getMonth() + licCode.duration_months);
    }

    await sql`
      UPDATE license_codes
      SET used = TRUE, used_by_device_id = ${device_id}, used_at = NOW()
      WHERE code = ${normalizedCode}
    `;

    const [updated] = await sql`
      UPDATE devices
      SET status = 'active',
          is_permanent = ${isLifetime},
          expiry_date = ${expiryDate},
          last_checked_at = NOW()
      WHERE device_id = ${device_id}
      RETURNING *
    `;

    // Reset rate limit setelah aktivasi berhasil
    resetActivateRateLimit(device_id);

    return NextResponse.json(toStatusJson(updated));
  } catch (err) {
    console.error("Activate error:", err);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 },
    );
  }
}
