import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getAdminFromRequest } from "@/lib/auth";

function toJson(r: Record<string, unknown>) {
  return {
    id: r.id,
    title: r.title,
    body: r.body,
    type: r.type,
    is_active: r.is_active,
    starts_at: r.starts_at ? new Date(r.starts_at as string).toISOString() : null,
    ends_at: r.ends_at ? new Date(r.ends_at as string).toISOString() : null,
    created_at: new Date(r.created_at as string).toISOString(),
  };
}

// GET /api/admin/announcements — list all (admin only)
export async function GET(req: NextRequest) {
  if (!getAdminFromRequest(req))
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  try {
    const rows = await sql`
      SELECT * FROM announcements ORDER BY created_at DESC
    `;
    return NextResponse.json(rows.map(toJson));
  } catch (err) {
    console.error("Admin get announcements error:", err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

// POST /api/admin/announcements — create new
export async function POST(req: NextRequest) {
  if (!getAdminFromRequest(req))
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  try {
    const { title, body, type, is_active, starts_at, ends_at } = await req.json();
    if (!title?.trim() || !body?.trim()) {
      return NextResponse.json(
        { message: "title dan body wajib diisi" },
        { status: 400 },
      );
    }

    const rows = await sql`
      INSERT INTO announcements (title, body, type, is_active, starts_at, ends_at)
      VALUES (
        ${title.trim()},
        ${body.trim()},
        ${type ?? "info"},
        ${is_active !== false},
        ${starts_at ? new Date(starts_at).toISOString() : null},
        ${ends_at ? new Date(ends_at).toISOString() : null}
      )
      RETURNING *
    `;
    return NextResponse.json(toJson(rows[0]), { status: 201 });
  } catch (err) {
    console.error("Admin create announcement error:", err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
