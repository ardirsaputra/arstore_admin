import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const { expiry_date, permanent = false } = await req.json();
    const rows = await sql`SELECT id FROM devices WHERE device_id = ${id}`;
    if (rows.length === 0)
      return NextResponse.json(
        { message: "Perangkat tidak ditemukan" },
        { status: 404 },
      );

    let updated;
    if (permanent) {
      [updated] = await sql`
        UPDATE devices
        SET status = 'active', is_permanent = TRUE, expiry_date = NULL, last_checked_at = NOW()
        WHERE device_id = ${id} RETURNING *
      `;
    } else {
      const expiry = expiry_date
        ? new Date(expiry_date)
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      [updated] = await sql`
        UPDATE devices
        SET status = 'active', is_permanent = FALSE, expiry_date = ${expiry.toISOString()}, last_checked_at = NOW()
        WHERE device_id = ${id} RETURNING *
      `;
    }
    return NextResponse.json({ success: true, device: updated });
  } catch (err) {
    console.error("Activate device error:", err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
