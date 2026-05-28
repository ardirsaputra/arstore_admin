import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { deviceId, deviceModel } = body;

    if (!deviceId) {
      return NextResponse.json({ error: "deviceId is required" }, { status: 400 });
    }

    // Always log the device into devices table so referrals work even before login
    await sql`
      INSERT INTO devices (device_id, status)
      VALUES (${deviceId}, 'trial')
      ON CONFLICT (device_id) DO UPDATE SET last_checked_at = NOW()
    `;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Device Init Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
