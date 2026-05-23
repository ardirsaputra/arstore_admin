import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { device_id, message } = await req.json();
    if (!message || message.trim().length === 0) {
      return NextResponse.json(
        { success: false, message: "Pesan wajib diisi" },
        { status: 400 },
      );
    }

    await sql`
      INSERT INTO feature_requests (device_id, message)
      VALUES (${device_id ?? null}, ${message.trim()})
    `;
    return NextResponse.json(
      { success: true, message: "Permintaan fitur berhasil dikirim" },
      { status: 201 },
    );
  } catch (err) {
    console.error("Submit feature request error:", err);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 },
    );
  }
}
