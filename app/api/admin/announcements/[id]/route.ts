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

// PUT /api/admin/announcements/[id]
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
    const { title, body, type, is_active, starts_at, ends_at } = await req.json();

    const rows = await sql`
      UPDATE announcements SET
        title     = ${title?.trim() ?? ""},
        body      = ${body?.trim() ?? ""},
        type      = ${type ?? "info"},
        is_active = ${is_active !== false},
        starts_at = ${starts_at ? new Date(starts_at).toISOString() : null},
        ends_at   = ${ends_at ? new Date(ends_at).toISOString() : null}
      WHERE id = ${numId}
      RETURNING *
    `;

    if (rows.length === 0)
      return NextResponse.json({ message: "Tidak ditemukan" }, { status: 404 });

    return NextResponse.json(toJson(rows[0]));
  } catch (err) {
    console.error("Admin update announcement error:", err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

// DELETE /api/admin/announcements/[id]
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
    await sql`DELETE FROM announcements WHERE id = ${numId}`;
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Admin delete announcement error:", err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
