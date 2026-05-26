import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const type = searchParams.get("type");
    const used = searchParams.get("used");

    let rows;
    if (type && used !== null) {
      const usedBool = used === "true";
      rows =
        await sql`SELECT * FROM license_codes WHERE type = ${type} AND used = ${usedBool} ORDER BY created_at DESC LIMIT 500`;
    } else if (type) {
      rows =
        await sql`SELECT * FROM license_codes WHERE type = ${type} ORDER BY created_at DESC LIMIT 500`;
    } else if (used !== null) {
      const usedBool = used === "true";
      rows =
        await sql`SELECT * FROM license_codes WHERE used = ${usedBool} ORDER BY created_at DESC LIMIT 500`;
    } else {
      rows =
        await sql`SELECT * FROM license_codes ORDER BY created_at DESC LIMIT 500`;
    }

    return NextResponse.json(rows);
  } catch (err) {
    console.error("Get codes error:", err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
