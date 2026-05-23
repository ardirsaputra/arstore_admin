import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { sql } from "@/lib/db";
import { signToken, AUTH_COOKIE } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();
    if (!username || !password) {
      return NextResponse.json(
        { message: "Username dan password wajib diisi" },
        { status: 400 },
      );
    }

    const rows =
      await sql`SELECT * FROM admin_users WHERE username = ${username} LIMIT 1`;
    if (rows.length === 0) {
      return NextResponse.json(
        { message: "Username atau password salah" },
        { status: 401 },
      );
    }

    const valid = await bcrypt.compare(password, rows[0].password_hash);
    if (!valid) {
      return NextResponse.json(
        { message: "Username atau password salah" },
        { status: 401 },
      );
    }

    const token = signToken({ username });
    const res = NextResponse.json({ success: true });
    res.cookies.set({ ...AUTH_COOKIE, value: token });
    return res;
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
