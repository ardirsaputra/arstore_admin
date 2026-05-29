import { NextResponse } from "next/server";
import { sendTelegramNotification } from "@/lib/telegram";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { deviceId, appVersion, error, stackTrace } = body;

    // Formatting the error message for Telegram (HTML parse mode)
    const message = `🚨 <b>APP CRASH REPORT</b> 🚨
    
<b>Device ID:</b> <code>${deviceId || 'Unknown'}</code>
<b>Version:</b> <code>${appVersion || 'Unknown'}</code>

<b>Error:</b>
<pre>${error || 'No error message provided'}</pre>

<b>Stack Trace snippet:</b>
<pre>${(stackTrace || '').substring(0, 1500)}</pre>`;

    const success = await sendTelegramNotification(message);

    if (success) {
      return NextResponse.json({ success: true, message: "Error log reported successfully" });
    } else {
      return NextResponse.json({ success: false, message: "Failed to send to Telegram" }, { status: 500 });
    }
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
