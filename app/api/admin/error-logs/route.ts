import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function GET() {
  try {
    // Create table if it doesn't exist just in case
    await sql`
      CREATE TABLE IF NOT EXISTS error_logs (
        id SERIAL PRIMARY KEY,
        device_id VARCHAR(255),
        app_version VARCHAR(255),
        error TEXT,
        stack_trace TEXT,
        resolved BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Add column if table already existed before this update
    await sql`ALTER TABLE error_logs ADD COLUMN IF NOT EXISTS resolved BOOLEAN DEFAULT FALSE;`;

    // Fetch all logs ordered by newest first
    const logs = await sql`
      SELECT * FROM error_logs
      ORDER BY created_at DESC
      LIMIT 100
    `;

    return NextResponse.json(logs);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
