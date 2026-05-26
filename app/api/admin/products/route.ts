import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getAdminFromRequest } from "@/lib/auth";

function toProductJson(row: Record<string, unknown>) {
  return {
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
      SELECT * FROM products ORDER BY category, sort_order, id
    `;
    return NextResponse.json(rows.map(toProductJson));
  } catch (err) {
    console.error("Admin get products error:", err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!getAdminFromRequest(req))
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

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

    if (!name || !category || price == null) {
      return NextResponse.json(
        { message: "name, category, dan price wajib diisi" },
        { status: 400 },
      );
    }

    const featuresJson = JSON.stringify(
      Array.isArray(features) ? features : [],
    );

    const rows = await sql`
      INSERT INTO products (name, category, description, price, duration, features, image_url, is_active, sort_order)
      VALUES (
        ${name},
        ${category},
        ${description ?? null},
        ${Number(price)},
        ${duration ?? null},
        ${featuresJson}::jsonb,
        ${image_url ?? null},
        ${is_active !== false},
        ${sort_order ?? 0}
      )
      RETURNING *
    `;
    return NextResponse.json(toProductJson(rows[0]), { status: 201 });
  } catch (err) {
    console.error("Admin create product error:", err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
