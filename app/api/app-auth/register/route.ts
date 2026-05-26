import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import bcrypt from "bcryptjs";
import { signToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, deviceId } = body;

    if (!email || !password || !deviceId) {
      return NextResponse.json(
        { error: "Email, password, and deviceId are required" },
        { status: 400 }
      );
    }

    const existingUser = await sql`SELECT id FROM app_users WHERE email = ${email}`;
    if (existingUser.length > 0) {
      return NextResponse.json({ error: "Email already exists" }, { status: 409 });
    }

    const hash = await bcrypt.hash(password, 10);
    const newUser = await sql`
      INSERT INTO app_users (email, password_hash, active_device_id)
      VALUES (${email}, ${hash}, ${deviceId})
      RETURNING id, email, status, trial_start_date, expiry_date
    `;

    // Always log the device into devices table for trial tracking
    await sql`
      INSERT INTO devices (device_id, status, user_email)
      VALUES (${deviceId}, 'trial', ${email})
      ON CONFLICT (device_id) DO UPDATE SET user_email = ${email}
    `;

    const user = newUser[0];
    const token = signToken({ id: user.id, email: user.email, role: 'user' });

    return NextResponse.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        status: user.status,
        trialStartDate: user.trial_start_date,
        expiryDate: user.expiry_date,
        activeDeviceId: deviceId,
      },
    });
  } catch (error: any) {
    console.error("Register Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
