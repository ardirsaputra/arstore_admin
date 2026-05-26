import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const rows = await sql`SELECT id FROM devices WHERE device_id = ${id}`;
    if (rows.length === 0)
      return NextResponse.json(
        { message: "Perangkat tidak ditemukan" },
        { status: 404 },
      );

    await sql`
      UPDATE devices
      SET status = 'expired', is_permanent = FALSE, expiry_date = NULL, last_checked_at = NOW()
      WHERE device_id = ${id}
    `;
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Revoke device error:", err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
