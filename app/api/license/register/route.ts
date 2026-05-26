import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { toStatusJson, validateAppRequest } from "@/lib/license-utils";

export async function POST(req: NextRequest) {
  const { valid, error } = validateAppRequest(req);
  if (!valid) return error!;

  try {
    const { device_id, device_model = "" } = await req.json();
    if (!device_id) {
      return NextResponse.json(
        { success: false, message: "device_id wajib diisi" },
        { status: 400 },
      );
    }

    const existing =
      await sql`SELECT * FROM devices WHERE device_id = ${device_id}`;

    if (existing.length > 0) {
      // Device sudah ada: perbarui model & last_checked_at, trial_start_date tetap
      const [updated] = await sql`
        UPDATE devices
        SET device_model = ${device_model || existing[0].device_model},
            last_checked_at = NOW()
        WHERE device_id = ${device_id}
        RETURNING *
      `;
      return NextResponse.json(toStatusJson(updated));
    }

    const [row] = await sql`
      INSERT INTO devices (device_id, device_model, status, trial_start_date)
      VALUES (${device_id}, ${device_model}, 'trial', NOW())
      RETURNING *
    `;
    return NextResponse.json(toStatusJson(row), { status: 201 });
  } catch (err) {
    console.error("Register error:", err);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 },
    );
  }
}

export const dynamic = 'force-dynamic';
