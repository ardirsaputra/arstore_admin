import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { toStatusJson, validateAppRequest } from "@/lib/license-utils";

export async function POST(req: NextRequest) {
  const { valid, error } = validateAppRequest(req);
  if (!valid) return error!;

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
        {
          success: false,
          message: "Akun belum terdaftar untuk perangkat ini",
        },
        { status: 401 },
      );
    }

    if (
      (device.user_email as string).toLowerCase() !==
      email.trim().toLowerCase()
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
