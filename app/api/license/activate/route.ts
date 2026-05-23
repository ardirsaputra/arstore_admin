import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

const TRIAL_DAYS = parseInt(process.env.TRIAL_DAYS ?? "14", 10);

function toStatusJson(row: Record<string, unknown>) {
  const now = new Date();
  let status = row.status as string;
  if (
    status === "active" &&
    row.expiry_date &&
    !row.is_permanent &&
    now > new Date(row.expiry_date as string)
  )
    status = "expired";
  if (status === "trial") {
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

export async function POST(req: NextRequest) {
  try {
    const { device_id, code } = await req.json();
    if (!device_id || !code) {
      return NextResponse.json(
        { success: false, message: "device_id dan code wajib diisi" },
        { status: 400 },
      );
    }

    const normalizedCode = code.trim().toUpperCase();
    const codeRows =
      await sql`SELECT * FROM license_codes WHERE code = ${normalizedCode}`;
    if (codeRows.length === 0)
      return NextResponse.json(
        { success: false, message: "Kode tidak ditemukan" },
        { status: 400 },
      );

    const licCode = codeRows[0];
    if (licCode.used)
      return NextResponse.json(
        { success: false, message: "Kode sudah pernah digunakan" },
        { status: 400 },
      );

    const devRows =
      await sql`SELECT * FROM devices WHERE device_id = ${device_id}`;
    if (devRows.length === 0)
      return NextResponse.json(
        { success: false, message: "Perangkat belum terdaftar" },
        { status: 404 },
      );

    const isLifetime = licCode.type === "lifetime";
    let expiryDate: Date | null = null;
    if (!isLifetime && licCode.duration_months) {
      expiryDate = new Date();
      expiryDate.setMonth(expiryDate.getMonth() + licCode.duration_months);
    }

    await sql`UPDATE license_codes SET used = TRUE, used_by_device_id = ${device_id}, used_at = NOW() WHERE code = ${normalizedCode}`;

    const [updated] = await sql`
      UPDATE devices
      SET status = 'active', is_permanent = ${isLifetime}, expiry_date = ${expiryDate}, last_checked_at = NOW()
      WHERE device_id = ${device_id}
      RETURNING *
    `;
    return NextResponse.json(toStatusJson(updated));
  } catch (err) {
    console.error("Activate error:", err);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 },
    );
  }
}
