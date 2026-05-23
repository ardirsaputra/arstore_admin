import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function GET() {
  try {
    const rows = await sql`SELECT whatsapp, email, note FROM payment_info WHERE id = 1`;
    const row = rows[0] ?? {};
    return NextResponse.json({
      whatsapp: row.whatsapp ?? null,
      email: row.email ?? null,
      note: row.note ?? null,
    });
  } catch (err) {
    console.error("Get contact error:", err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
