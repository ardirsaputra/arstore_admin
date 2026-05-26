import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function GET() {
  try {
    const [stats] = await sql`
      SELECT
        COUNT(*)::int                                               AS total,
        COUNT(*) FILTER (WHERE status = 'trial')::int              AS trial,
        COUNT(*) FILTER (WHERE status = 'active')::int             AS active,
        COUNT(*) FILTER (WHERE status = 'expired')::int            AS expired
      FROM devices
    `;
    const [codeStats] = await sql`
      SELECT
        COUNT(*)::int                               AS total_codes,
        COUNT(*) FILTER (WHERE used = TRUE)::int    AS used_codes
      FROM license_codes
    `;
    const [frStats] = await sql`
      SELECT COUNT(*) FILTER (WHERE read = FALSE)::int AS unread_feature_requests FROM feature_requests
    `;

    return NextResponse.json({
      ...stats,
      ...codeStats,
      ...frStats,
    });
  } catch (err) {
    console.error("Stats error:", err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
