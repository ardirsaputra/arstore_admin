import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

function toDeviceJson(row: Record<string, unknown>) {
  return {
    device_id: row.device_id,
    device_model: row.device_model,
    status: row.status,
    user_name: row.user_name ?? null,
    user_email: row.user_email ?? null,
    trial_start_date: row.trial_start_date
      ? new Date(row.trial_start_date as string).toISOString()
      : null,
    expiry_date: row.expiry_date
      ? new Date(row.expiry_date as string).toISOString()
      : null,
    is_permanent: row.is_permanent,
    checked_at: row.last_checked_at
      ? new Date(row.last_checked_at as string).toISOString()
      : null,
  };
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const rows = await sql`SELECT * FROM devices WHERE device_id = ${id}`;
    if (rows.length === 0)
      return NextResponse.json(
        { message: "Perangkat tidak ditemukan" },
        { status: 404 },
      );
    return NextResponse.json(toDeviceJson(rows[0]));
  } catch (err) {
    console.error("Get device error:", err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
