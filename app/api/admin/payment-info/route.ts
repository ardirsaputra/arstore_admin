import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function GET() {
  try {
    const rows = await sql`SELECT * FROM payment_info WHERE id = 1`;
    return NextResponse.json(rows[0] ?? {});
  } catch (err) {
    console.error("Get payment info error:", err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      whatsapp,
      email,
      bank_name,
      bank_account,
      bank_holder,
      qris_url,
      note,
    } = body;

    const [updated] = await sql`
      UPDATE payment_info SET
        whatsapp     = ${whatsapp ?? null},
        email        = ${email ?? null},
        bank_name    = ${bank_name ?? null},
        bank_account = ${bank_account ?? null},
        bank_holder  = ${bank_holder ?? null},
        qris_url     = ${qris_url ?? null},
        note         = ${note ?? null},
        updated_at   = NOW()
      WHERE id = 1
      RETURNING *
    `;
    return NextResponse.json(updated);
  } catch (err) {
    console.error("Update payment info error:", err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
