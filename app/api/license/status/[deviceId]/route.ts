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
  ) {
    status = "expired";
  }
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

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ deviceId: string }> },
) {
  const { deviceId } = await params;
  try {
    const rows = await sql`SELECT * FROM devices WHERE device_id = ${deviceId}`;
    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, message: "Perangkat belum terdaftar" },
        { status: 404 },
      );
    }

    const json = toStatusJson(rows[0]);
    if (json.status !== rows[0].status) {
      await sql`UPDATE devices SET status = ${json.status}, last_checked_at = NOW() WHERE device_id = ${deviceId}`;
    } else {
      await sql`UPDATE devices SET last_checked_at = NOW() WHERE device_id = ${deviceId}`;
    }
    return NextResponse.json(json);
  } catch (err) {
    console.error("Status error:", err);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 },
    );
  }
}
