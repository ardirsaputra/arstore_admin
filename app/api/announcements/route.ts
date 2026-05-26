import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

// GET /api/announcements — public, no auth required
// Returns all active announcements within their time window
export async function GET() {
  try {
    const now = new Date().toISOString();
    const rows = await sql`
      SELECT id, title, body, type, starts_at, ends_at, created_at
      FROM announcements
      WHERE is_active = TRUE
        AND (starts_at IS NULL OR starts_at <= ${now}::timestamptz)
        AND (ends_at IS NULL OR ends_at >= ${now}::timestamptz)
      ORDER BY created_at DESC
    `;
    return NextResponse.json(
      rows.map((r) => ({
        id: r.id,
        title: r.title,
        body: r.body,
        type: r.type,
        starts_at: r.starts_at ? new Date(r.starts_at as string).toISOString() : null,
        ends_at: r.ends_at ? new Date(r.ends_at as string).toISOString() : null,
        created_at: new Date(r.created_at as string).toISOString(),
      })),
    );
  } catch (err) {
    console.error("Get announcements error:", err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
