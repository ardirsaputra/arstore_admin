import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getAdminFromRequest } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!getAdminFromRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await req.json();
    const { days } = body;

    if (!days || typeof days !== "number" || days <= 0) {
      return NextResponse.json({ error: "Jumlah hari tidak valid" }, { status: 400 });
    }

    const rows = await sql`SELECT * FROM app_users WHERE id = ${id}`;
    if (rows.length === 0) {
      return NextResponse.json({ error: "Pengguna tidak ditemukan" }, { status: 404 });
    }
    const user = rows[0];

    let baseDate = new Date();
    const trialDays = parseInt(process.env.TRIAL_DAYS ?? "30", 10);
    const now = new Date();

    if (user.expiry_date && new Date(user.expiry_date) > now) {
      baseDate = new Date(user.expiry_date);
    } else if (user.trial_start_date) {
      const trialEnd = new Date(user.trial_start_date);
      trialEnd.setDate(trialEnd.getDate() + trialDays);
      if (trialEnd > now) {
        baseDate = trialEnd;
      }
    }

    let newExpiry = new Date(baseDate);
    newExpiry.setDate(newExpiry.getDate() + days);

    await sql`
      UPDATE app_users 
      SET status = 'active', expiry_date = ${newExpiry.toISOString()}
      WHERE id = ${id}
    `;

    return NextResponse.json({ success: true, newExpiry: newExpiry.toISOString() });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
