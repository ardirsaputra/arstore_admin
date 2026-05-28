import { NextResponse } from "next/server";
import { sendTelegramNotification } from "@/lib/telegram";

export async function GET() {
  try {
    const success = await sendTelegramNotification("🚨 <b>Test Notifikasi</b>\n\nIni adalah pesan percobaan dari sistem UtilitasKu untuk memastikan bot Telegram berjalan dengan normal.");
    
    if (success) {
      return NextResponse.json({ success: true, message: "Pesan test berhasil dikirim ke Telegram" });
    } else {
      return NextResponse.json({ success: false, message: "Gagal mengirim pesan, cek console backend untuk detail error (pastikan TELEGRAM_BOT_TOKEN dan TELEGRAM_CHAT_ID sudah di-set)." }, { status: 500 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
