import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function GET() {
  try {
    await sql`ALTER TABLE devices ADD COLUMN IF NOT EXISTS referral_code VARCHAR(20) UNIQUE`;
    await sql`ALTER TABLE devices ADD COLUMN IF NOT EXISTS referral_uses INTEGER DEFAULT 0`;
    await sql`ALTER TABLE devices ADD COLUMN IF NOT EXISTS has_claimed_referral BOOLEAN DEFAULT FALSE`;
    // Lifetime sejati untuk akun (hanya yang membeli paket lifetime).
    await sql`ALTER TABLE app_users ADD COLUMN IF NOT EXISTS is_permanent BOOLEAN DEFAULT FALSE`;
    return NextResponse.json({ success: true, message: "Migration complete" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
