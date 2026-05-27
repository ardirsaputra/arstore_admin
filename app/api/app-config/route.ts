import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function GET() {
  try {
    const rows = await sql`SELECT key, value FROM app_config`;
    const config: Record<string, any> = {};
    for (const row of rows) {
      config[row.key] = row.value;
    }
    return NextResponse.json(config);
  } catch (err) {
    console.error("App config error:", err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
