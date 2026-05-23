import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

const TRIAL_DAYS = parseInt(process.env.TRIAL_DAYS ?? "14", 10);

function toStatusJson(row: Record<string, unknown>) {
  const now = new Date();
  let status = row.status as string;

  if (
    status === "active" &&
    row.expiry_date &&
    !row.is_permanent &&
    now > new Date(row.expiry_date as string)
  ) {
    status = "expired";
  }
  if (status === "trial") {
    const trialEnd = new Date(row.trial_start_date as string);
    trialEnd.setDate(trialEnd.getDate() + TRIAL_DAYS);
    if (now > trialEnd) status = "expired";
  }

  return {
    success: true,
    device_id: row.device_id,
    device_model: row.device_model,
    status,
    activation_type: row.is_permanent
      ? "permanent"
      : status === "trial"
        ? "trial"
        : "timed",
    user_name: row.user_name ?? null,
    user_email: row.user_email ?? null,
    trial_start_date: row.trial_start_date
      ? new Date(row.trial_start_date as string).toISOString()
      : null,
    expiry_date: row.expiry_date
      ? new Date(row.expiry_date as string).toISOString()
      : null,
    is_permanent: row.is_permanent,
    checked_at: now.toISOString(),
  };
}

export async function POST(req: NextRequest) {
  try {
    const { device_id, device_model = "" } = await req.json();
    if (!device_id) {
      return NextResponse.json(
        { success: false, message: "device_id wajib diisi" },
        { status: 400 },
      );
    }

    const existing =
      await sql`SELECT * FROM devices WHERE device_id = ${device_id}`;
    if (existing.length > 0) {
      const [updated] = await sql`
        UPDATE devices SET device_model = ${device_model || existing[0].device_model}, last_checked_at = NOW()
        WHERE device_id = ${device_id} RETURNING *
      `;
      return NextResponse.json(toStatusJson(updated));
    }

    const [row] = await sql`
      INSERT INTO devices (device_id, device_model, status, trial_start_date)
      VALUES (${device_id}, ${device_model}, 'trial', NOW())
      RETURNING *
    `;
    return NextResponse.json(toStatusJson(row), { status: 201 });
  } catch (err) {
    console.error("Register error:", err);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 },
    );
  }
}
