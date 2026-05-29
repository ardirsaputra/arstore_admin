import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

function parseJsonArray(val: unknown) {
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') {
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) return parsed;
    } catch (e) {}
  }
  return [];
}

function toReleaseJson(row: Record<string, unknown>) {
  return {
    id: row.id,
    version_name: row.version_name,
    version_code: row.version_code,
    apk_url: row.apk_url,
    apk_url_arm64: row.apk_url_arm64 ?? null,
    apk_url_arm32: row.apk_url_arm32 ?? null,
    apk_url_x86: row.apk_url_x86 ?? null,
    changelog: parseJsonArray(row.changelog),
    features: parseJsonArray(row.features),
    screenshots: parseJsonArray(row.screenshots),
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
    `;
    return NextResponse.json(rows.map(toReleaseJson));
  } catch (err) {
    console.error("Get download error:", err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
