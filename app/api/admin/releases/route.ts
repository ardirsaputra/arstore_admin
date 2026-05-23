import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getAdminFromRequest } from "@/lib/auth";

function toReleaseJson(row: Record<string, unknown>) {
  return {
    id: row.id,
    version_name: row.version_name,
    version_code: row.version_code,
    apk_url: row.apk_url,
    changelog: Array.isArray(row.changelog) ? row.changelog : [],
    features: Array.isArray(row.features) ? row.features : [],
    screenshots: Array.isArray(row.screenshots) ? row.screenshots : [],
    min_android: row.min_android,
    file_size: row.file_size ?? null,
    is_published: row.is_published,
    release_date: row.release_date
      ? new Date(row.release_date as string).toISOString()
      : null,
    created_at: row.created_at
      ? new Date(row.created_at as string).toISOString()
      : null,
  };
}

export async function GET(req: NextRequest) {
  if (!getAdminFromRequest(req))
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  try {
    const rows = await sql`
      SELECT * FROM app_releases ORDER BY release_date DESC
    `;
    return NextResponse.json(rows.map(toReleaseJson));
  } catch (err) {
    console.error("Admin get releases error:", err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!getAdminFromRequest(req))
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const {
      version_name,
      version_code,
      apk_url,
      changelog,
      features,
      screenshots,
      min_android,
      file_size,
      is_published,
      release_date,
    } = body;

    if (!version_name || !version_code || !apk_url) {
      return NextResponse.json(
        { message: "version_name, version_code, dan apk_url wajib diisi" },
        { status: 400 },
      );
    }

    const rows = await sql`
      INSERT INTO app_releases
        (version_name, version_code, apk_url, changelog, features, screenshots, min_android, file_size, is_published, release_date)
      VALUES (
        ${version_name},
        ${Number(version_code)},
        ${apk_url},
        ${JSON.stringify(Array.isArray(changelog) ? changelog : [])}::jsonb,
        ${JSON.stringify(Array.isArray(features) ? features : [])}::jsonb,
        ${JSON.stringify(Array.isArray(screenshots) ? screenshots : [])}::jsonb,
        ${min_android || "Android 7.0+"},
        ${file_size || null},
        ${is_published === true},
        ${release_date ? new Date(release_date).toISOString() : new Date().toISOString()}
      )
      RETURNING *
    `;
    return NextResponse.json(toReleaseJson(rows[0]), { status: 201 });
  } catch (err) {
    console.error("Admin create release error:", err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
