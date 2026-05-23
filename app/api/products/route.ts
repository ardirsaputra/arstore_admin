import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

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
    sort_order: row.sort_order,
  };
}

export async function GET() {
  try {
    const rows = await sql`
      SELECT * FROM products
      WHERE is_active = TRUE
      ORDER BY category, sort_order, id
    `;
    return NextResponse.json(rows.map(toProductJson));
  } catch (err) {
    console.error("Get products error:", err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
