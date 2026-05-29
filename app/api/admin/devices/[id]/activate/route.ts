import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const body = await req.json();
    const { expiry_date, permanent = false, days } = body;
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
      const devRows = await sql`SELECT * FROM devices WHERE device_id = ${id}`;
      const device = devRows[0];

      let expiry;
      if (expiry_date) {
        // Jika admin memilih tanggal pasti
        expiry = new Date(expiry_date);
      } else {
        // Jika pakai sistem tambah hari
        let baseDate = new Date();
        const trialDays = parseInt(process.env.TRIAL_DAYS ?? "30", 10);
        const now = new Date();

        if (device.expiry_date && new Date(device.expiry_date) > now) {
          baseDate = new Date(device.expiry_date);
        } else if (device.trial_start_date) {
          const trialEnd = new Date(device.trial_start_date);
          trialEnd.setDate(trialEnd.getDate() + trialDays);
          if (trialEnd > now) {
            baseDate = trialEnd;
          }
        }
        
        const daysToAdd = typeof days === "number" && days > 0 ? days : 30;
        expiry = new Date(baseDate);
        expiry.setDate(expiry.getDate() + daysToAdd);
      }

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

export const dynamic = 'force-dynamic';
