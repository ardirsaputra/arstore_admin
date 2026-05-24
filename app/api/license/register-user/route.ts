import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { validateAppRequest } from "@/lib/license-utils";

export async function POST(req: NextRequest) {
  const { valid, error } = validateAppRequest(req);
  if (!valid) return error!;

  try {
    // Catatan: field 'password' diabaikan — tidak disimpan di backend
    const { device_id, name, email } = await req.json();
    if (!device_id) {
      return NextResponse.json(
        { success: false, message: "device_id wajib diisi" },
        { status: 400 },
      );
    }

    const rows =
      await sql`SELECT id FROM devices WHERE device_id = ${device_id}`;
    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, message: "Perangkat belum terdaftar" },
        { status: 404 },
      );
    }

    await sql`
      UPDATE devices
      SET user_name = ${name ?? null}, user_email = ${email ?? null}
      WHERE device_id = ${device_id}
    `;
    return NextResponse.json({
      success: true,
      message: "Data pengguna berhasil disimpan",
    });
  } catch (err) {
    console.error("Register user error:", err);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 },
    );
  }
}
