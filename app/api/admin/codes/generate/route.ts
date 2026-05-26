import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import crypto from "crypto";

const DURATION_MAP: Record<string, number | null> = {
  monthly: 1,
  "6months": 6,
  yearly: 12,
  "2years": 24,
  lifetime: null,
};

function generateCode(): string {
  const seg = () => crypto.randomBytes(2).toString("hex").toUpperCase();
  return `ARST-${seg()}-${seg()}-${seg()}`;
}

export async function POST(req: NextRequest) {
  try {
    const { type, count = 1 } = await req.json();
    if (!type || !DURATION_MAP.hasOwnProperty(type)) {
      return NextResponse.json(
        { message: "Tipe tidak valid" },
        { status: 400 },
      );
    }
    const qty = Math.min(Math.max(1, parseInt(count, 10)), 100);
    const duration_months = DURATION_MAP[type];

    const generated: string[] = [];
    for (let i = 0; i < qty; i++) {
      let code = generateCode();
      // Retry on collision (extremely rare)
      let attempts = 0;
      while (attempts < 5) {
        try {
          await sql`INSERT INTO license_codes (code, type, duration_months) VALUES (${code}, ${type}, ${duration_months})`;
          generated.push(code);
          break;
        } catch {
          code = generateCode();
          attempts++;
        }
      }
    }

    return NextResponse.json({ success: true, codes: generated });
  } catch (err) {
    console.error("Generate codes error:", err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
