import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

const TRIAL_DAYS = parseInt(process.env.TRIAL_DAYS ?? "30", 10);

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
    name: row.user_name ?? null,
    email: row.user_email ?? null,
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
    const { device_id, email } = await req.json();
    if (!device_id || !email) {
      return NextResponse.json(
        { success: false, message: "device_id dan email wajib diisi" },
        { status: 400 },
      );
    }

    const rows =
      await sql`SELECT * FROM devices WHERE device_id = ${device_id}`;
    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, message: "Perangkat belum terdaftar" },
        { status: 404 },
      );
    }

    const device = rows[0];
    if (!device.user_email) {
      return NextResponse.json(
        { success: false, message: "Akun belum terdaftar untuk perangkat ini" },
        { status: 401 },
      );
    }

    if (
      (device.user_email as string).toLowerCase() !== email.trim().toLowerCase()
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Email tidak cocok dengan akun yang terdaftar",
        },
        { status: 401 },
      );
    }

    await sql`UPDATE devices SET last_checked_at = NOW() WHERE device_id = ${device_id}`;
    return NextResponse.json(toStatusJson(device));
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 },
    );
  }
}
