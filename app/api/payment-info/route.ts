import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

let migrationRan = false;
async function ensureTable() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS payment_info (
        id INTEGER PRIMARY KEY DEFAULT 1,
        whatsapp VARCHAR(255),
        email VARCHAR(255),
        bank_name VARCHAR(255),
        bank_account VARCHAR(255),
        bank_holder VARCHAR(255),
        qris_url TEXT,
        note TEXT,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT single_row CHECK (id = 1)
      )
    `;
    await sql`INSERT INTO payment_info (id) VALUES (1) ON CONFLICT (id) DO NOTHING`;
  } catch (err) {
    console.error("Migration error payment_info:", err);
  }
}

export async function GET() {
  try {
    if (!migrationRan) {
      await ensureTable();
      migrationRan = true;
    }
    const rows = await sql`SELECT * FROM payment_info WHERE id = 1`;
    return NextResponse.json(rows[0] ?? {});
  } catch (err) {
    console.error("Get payment info error:", err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
