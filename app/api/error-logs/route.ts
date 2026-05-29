import { NextResponse } from "next/server";
import { sendTelegramNotification } from "@/lib/telegram";
import { sql } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { deviceId, appVersion, error, stackTrace } = body;

    // Create table if not exists
    await sql`
      CREATE TABLE IF NOT EXISTS error_logs (
        id SERIAL PRIMARY KEY,
        device_id VARCHAR(255),
        app_version VARCHAR(255),
        error TEXT,
        stack_trace TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Insert to DB
    await sql`
      INSERT INTO error_logs (device_id, app_version, error, stack_trace)
      VALUES (${deviceId || 'Unknown'}, ${appVersion || 'Unknown'}, ${error || ''}, ${stackTrace || ''})
    `;

    // Telegram notification removed as per request
    return NextResponse.json({
      success: true,
      message: "Error log reported successfully to database",
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 },
    );
  }
}
