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

    const users = await sql`SELECT * FROM app_users WHERE email = ${email}`;
    if (users.length === 0) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const token = signToken({ id: user.id, email: user.email, role: 'user' });

    return NextResponse.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        status: user.status,
        trialStartDate: user.trial_start_date,
        expiryDate: user.is_permanent === true ? null : user.expiry_date,
        isPermanent: user.is_permanent === true,
        activeDeviceId: user.active_device_id,
      },
    });
  } catch (error: any) {
    console.error("Login Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
