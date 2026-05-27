import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function PUT(req: Request, { params }: { params: { key: string } }) {
  try {
    const { key } = params;
    const body = await req.json();
    
    if (body.value === undefined) {
      return NextResponse.json({ message: "value is required" }, { status: 400 });
    }

    await sql`
      INSERT INTO app_config (key, value, updated_at) 
      VALUES (${key}, ${JSON.stringify(body.value)}, NOW()) 
      ON CONFLICT (key) 
      DO UPDATE SET value = ${JSON.stringify(body.value)}, updated_at = NOW()
    `;

    return NextResponse.json({ message: "Config updated successfully", key });
  } catch (err) {
    console.error("App config PUT error:", err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
