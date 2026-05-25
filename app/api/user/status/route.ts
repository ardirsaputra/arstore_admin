import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.split(" ")[1];
    const userPayload = verifyToken(token);

    if (!userPayload || userPayload.role !== 'user') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = userPayload.id as number;
    const deviceId = req.nextUrl.searchParams.get("deviceId");

    const users = await sql`SELECT * FROM app_users WHERE id = ${userId}`;
    if (users.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    
    const user = users[0];
    
    // Check if expiry date has passed
    let currentStatus = user.status;
    if (user.expiry_date && new Date(user.expiry_date) < new Date()) {
      currentStatus = 'expired';
    }

    const isActiveDevice = deviceId ? user.active_device_id === deviceId : true;

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        status: currentStatus,
        trialStartDate: user.trial_start_date,
        expiryDate: user.expiry_date,
        activeDeviceId: user.active_device_id,
        isActiveDevice,
      },
    });
  } catch (error: any) {
    console.error("User Status Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
