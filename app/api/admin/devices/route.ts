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

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const status = searchParams.get("status");
    const q = searchParams.get("q");

    let rows;
    if (status && q) {
      rows = await sql`
        SELECT * FROM devices
        WHERE status = ${status}
          AND (device_id ILIKE ${"%" + q + "%"} OR user_name ILIKE ${"%" + q + "%"} OR user_email ILIKE ${"%" + q + "%"})
        ORDER BY last_checked_at DESC LIMIT 200
      `;
    } else if (status) {
      rows =
        await sql`SELECT * FROM devices WHERE status = ${status} ORDER BY last_checked_at DESC LIMIT 200`;
    } else if (q) {
      rows = await sql`
        SELECT * FROM devices
        WHERE device_id ILIKE ${"%" + q + "%"} OR user_name ILIKE ${"%" + q + "%"} OR user_email ILIKE ${"%" + q + "%"}
        ORDER BY last_checked_at DESC LIMIT 200
      `;
    } else {
      rows =
        await sql`SELECT * FROM devices ORDER BY last_checked_at DESC LIMIT 200`;
    }

    return NextResponse.json(rows.map(toDeviceJson));
  } catch (err) {
    console.error("Get devices error:", err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
