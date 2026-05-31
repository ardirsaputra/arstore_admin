import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getAdminFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  if (!getAdminFromRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Pastikan kolom lifetime ada agar SELECT tidak gagal sebelum migrasi.
    await sql`ALTER TABLE app_users ADD COLUMN IF NOT EXISTS is_permanent BOOLEAN DEFAULT FALSE`;
    const users = await sql`
      SELECT id, email, status, active_device_id, trial_start_date, expiry_date, is_permanent, created_at
      FROM app_users
      ORDER BY created_at DESC
    `;
    return NextResponse.json(users);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
