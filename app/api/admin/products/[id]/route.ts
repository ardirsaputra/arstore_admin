import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getAdminFromRequest } from "@/lib/auth";

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
      name,
      category,
      description,
      price,
      duration,
      features,
      image_url,
      is_active,
      sort_order,
    } = body;

    const featuresJson = JSON.stringify(
      Array.isArray(features) ? features : [],
    );

    const rows = await sql`
      UPDATE products SET
        name        = ${name},
        category    = ${category},
        description = ${description ?? null},
        price       = ${Number(price)},
        duration    = ${duration ?? null},
        features    = ${featuresJson}::jsonb,
        image_url   = ${image_url ?? null},
        is_active   = ${is_active !== false},
        sort_order  = ${sort_order ?? 0}
      WHERE id = ${numId}
      RETURNING *
    `;

    if (rows.length === 0)
      return NextResponse.json(
        { message: "Produk tidak ditemukan" },
        { status: 404 },
      );

    const row = rows[0];
    return NextResponse.json({
      id: row.id,
      name: row.name,
      category: row.category,
      description: row.description ?? null,
      price: Number(row.price),
      duration: row.duration ?? null,
      features: Array.isArray(row.features) ? row.features : [],
      image_url: row.image_url ?? null,
      is_active: row.is_active,
      sort_order: row.sort_order,
    });
  } catch (err) {
    console.error("Admin update product error:", err);
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
    await sql`DELETE FROM products WHERE id = ${numId}`;
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Admin delete product error:", err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
