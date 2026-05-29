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

    // Formatting the error message for Telegram (HTML parse mode)
    const message = `🚨 <b>APP CRASH REPORT</b> 🚨
    
<b>Device ID:</b> <code>${deviceId || "Unknown"}</code>
<b>Version:</b> <code>${appVersion || "Unknown"}</code>

<b>Error:</b>
<pre>${error || "No error message provided"}</pre>

<b>Stack Trace snippet:</b>
<pre>${(stackTrace || "").substring(0, 1500)}</pre>`;

    const success = await sendTelegramNotification(message);

    if (success) {
      return NextResponse.json({
        success: true,
        message: "Error log reported successfully",
      });
    } else {
      return NextResponse.json(
        { success: false, message: "Failed to send to Telegram" },
        { status: 500 },
      );
    }
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 },
    );
  }
}
