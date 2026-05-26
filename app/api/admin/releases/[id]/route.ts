import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getAdminFromRequest } from "@/lib/auth";

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

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!getAdminFromRequest(req))
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const numId = Number(id);
  if (!numId)
    return NextResponse.json({ message: "ID tidak valid" }, { status: 400 });

  try {
    const body = await req.json();
    const {
      version_name,
      version_code,
      apk_url,
      apk_url_arm64,
      apk_url_arm32,
      apk_url_x86,
      changelog,
      features,
      screenshots,
      min_android,
      file_size,
      is_published,
      release_date,
    } = body;

    if (
      !version_name ||
      !version_code ||
      !apk_url ||
      !apk_url_arm64 ||
      !apk_url_arm32 ||
      !apk_url_x86
    ) {
      return NextResponse.json(
        { message: "version_name, version_code, dan semua link APK (Universal, ARM64, ARM32, x86) wajib diisi" },
        { status: 400 },
      );
    }

    const rows = await sql`
      UPDATE app_releases SET
        version_name = ${version_name},
        version_code = ${Number(version_code)},
        apk_url      = ${apk_url},
        apk_url_arm64 = ${apk_url_arm64 || null},
        apk_url_arm32 = ${apk_url_arm32 || null},
        apk_url_x86  = ${apk_url_x86 || null},
        changelog    = ${JSON.stringify(Array.isArray(changelog) ? changelog : [])}::jsonb,
        features     = ${JSON.stringify(Array.isArray(features) ? features : [])}::jsonb,
        screenshots  = ${JSON.stringify(Array.isArray(screenshots) ? screenshots : [])}::jsonb,
        min_android  = ${min_android || "Android 7.0+"},
        file_size    = ${file_size || null},
        is_published = ${is_published === true},
        release_date = ${release_date ? new Date(release_date).toISOString() : new Date().toISOString()}
      WHERE id = ${numId}
      RETURNING *
    `;

    if (rows.length === 0)
      return NextResponse.json(
        { message: "Rilis tidak ditemukan" },
        { status: 404 },
      );

    const row = rows[0];
    return NextResponse.json({
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
      is_published: row.is_published,
      release_date: new Date(row.release_date as string).toISOString(),
    });
  } catch (err) {
    console.error("Admin update release error:", err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!getAdminFromRequest(req))
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const numId = Number(id);
  if (!numId)
    return NextResponse.json({ message: "ID tidak valid" }, { status: 400 });

  try {
    await sql`DELETE FROM app_releases WHERE id = ${numId}`;
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Admin delete release error:", err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
