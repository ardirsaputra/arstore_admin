import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { toStatusJson, validateAppRequest } from "@/lib/license-utils";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ deviceId: string }> },
) {
  const { valid, error } = validateAppRequest(req);
  if (!valid) return error!;

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
    if (!json) {
      return NextResponse.json({ success: false, message: "Data tidak valid" }, { status: 500 });
    }

    // Sinkronkan status ke DB jika sudah expired
    if (json.status !== rows[0].status) {
      await sql`
        UPDATE devices
        SET status = ${json.status}, last_checked_at = NOW()
        WHERE device_id = ${deviceId}
      `;
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
