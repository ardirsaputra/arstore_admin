import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

function toReleaseJson(row: Record<string, unknown>) {
  return {
    id: row.id,
    version_name: row.version_name,
    version_code: row.version_code,
    apk_url: row.apk_url,
    apk_url_arm64: row.apk_url_arm64 ?? null,
    apk_url_arm32: row.apk_url_arm32 ?? null,
    apk_url_x86: row.apk_url_x86 ?? null,
    changelog: Array.isArray(row.changelog) ? row.changelog : [],
    features: Array.isArray(row.features) ? row.features : [],
    screenshots: Array.isArray(row.screenshots) ? row.screenshots : [],
    min_android: row.min_android,
    file_size: row.file_size ?? null,
    release_date: row.release_date
      ? new Date(row.release_date as string).toISOString()
      : null,
  };
}

export async function GET() {
  try {
    const rows = await sql`
      SELECT * FROM app_releases
      WHERE is_published = TRUE
      ORDER BY release_date DESC
      LIMIT 1
    `;
    if (rows.length === 0) {
      return NextResponse.json(null);
    }
    return NextResponse.json(toReleaseJson(rows[0]));
  } catch (err) {
    console.error("Get download error:", err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
