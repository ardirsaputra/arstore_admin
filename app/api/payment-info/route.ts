import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function GET() {
  try {
    const rows = await sql`SELECT * FROM payment_info WHERE id = 1`;
    return NextResponse.json(rows[0] ?? {});
  } catch (err) {
    console.error("Get payment info error:", err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
