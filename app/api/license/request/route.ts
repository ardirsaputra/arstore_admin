import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.split(" ")[1];
    const user = verifyToken(token);

    if (!user || user.role !== 'user') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = user.id as number;

    // Check rate limit: max 2 requests per day per user
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const requestsToday = await sql`
      SELECT COUNT(*) as count FROM license_requests 
      WHERE user_id = ${userId} AND created_at >= ${today.toISOString()}
    `;
    
    if (requestsToday[0].count >= 2) {
      return NextResponse.json({ error: "Anda telah mencapai batas maksimum 2 pengajuan per hari." }, { status: 429 });
    }

    const body = await req.json();
    const { requestedMonths, proofImage } = body;

    if (!requestedMonths || !proofImage) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    await sql`
      INSERT INTO license_requests (user_id, requested_months, proof_image, status)
      VALUES (${userId}, ${requestedMonths}, ${proofImage}, 'pending')
    `;

    return NextResponse.json({ success: true, message: "Pengajuan berhasil dikirim" });
  } catch (error: any) {
    console.error("License Request Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
