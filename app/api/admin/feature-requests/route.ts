import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function GET() {
  try {
    const rows =
      await sql`SELECT * FROM feature_requests ORDER BY created_at DESC LIMIT 200`;
    return NextResponse.json(rows);
  } catch (err) {
    console.error("Get feature requests error:", err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
