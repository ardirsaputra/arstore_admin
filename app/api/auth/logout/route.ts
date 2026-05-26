import { NextResponse } from "next/server";
import { AUTH_COOKIE } from "@/lib/auth";

export async function POST() {
  const res = NextResponse.json({ success: true });
  res.cookies.set({ ...AUTH_COOKIE, value: "", maxAge: 0 });
  return res;
}

export const dynamic = 'force-dynamic';
