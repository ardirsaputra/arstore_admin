import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    await sql`UPDATE error_logs SET resolved = TRUE WHERE id = ${parseInt(id, 10)}`;
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Resolve error log failed:", err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
