import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { deviceId, deviceModel, appVersion, appBuild } = body;

    if (!deviceId) {
      return NextResponse.json({ error: "deviceId is required" }, { status: 400 });
    }

    // Ensure columns exist to avoid schema errors (safe to run repeatedly)
    await sql`ALTER TABLE devices ADD COLUMN IF NOT EXISTS app_version TEXT`;
    await sql`ALTER TABLE devices ADD COLUMN IF NOT EXISTS app_build TEXT`;

    // Always log the device into devices table so referrals work even before login
    await sql`
      INSERT INTO devices (device_id, status, app_version, app_build)
      VALUES (${deviceId}, 'trial', ${appVersion || null}, ${appBuild || null})
      ON CONFLICT (device_id) DO UPDATE SET 
        last_checked_at = NOW(),
        app_version = EXCLUDED.app_version,
        app_build = EXCLUDED.app_build
    `;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Device Init Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
