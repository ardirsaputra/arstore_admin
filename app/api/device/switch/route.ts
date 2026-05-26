import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.split(" ")[1];
    const user = verifyToken(token);

    if (!user || user.role !== 'user') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = user.id as number;

    const body = await req.json();
    const { newDeviceId } = body;

    if (!newDeviceId) {
      return NextResponse.json({ error: "newDeviceId is required" }, { status: 400 });
    }

    // Ensure the device exists in the devices table
    await sql`
      INSERT INTO devices (device_id, status, user_email)
      VALUES (${newDeviceId}, 'trial', ${user.email as string})
      ON CONFLICT (device_id) DO UPDATE SET user_email = ${user.email as string}
    `;

    // Update active device in app_users
    await sql`
      UPDATE app_users 
      SET active_device_id = ${newDeviceId}
      WHERE id = ${userId}
    `;

    return NextResponse.json({ success: true, message: "Perangkat berhasil dipindahkan" });
  } catch (error: any) {
    console.error("Device Switch Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
