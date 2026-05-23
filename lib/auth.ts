import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";

const JWT_SECRET = process.env.JWT_SECRET!;
const COOKIE_NAME = "arstore_admin_token";

export interface AdminPayload {
  username: string;
  iat?: number;
  exp?: number;
}

export function signToken(payload: { username: string }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "8h" });
}

export function verifyToken(token: string): AdminPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AdminPayload;
  } catch {
    return null;
  }
}

/** Returns admin payload from the request cookie, or null if invalid. */
export function getAdminFromRequest(req: NextRequest): AdminPayload | null {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

/** Returns admin payload from the server-component cookie store, or null. */
export async function getAdminFromCookies(): Promise<AdminPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export const AUTH_COOKIE = {
  name: COOKIE_NAME,
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: 60 * 60 * 8, // 8 hours
  path: "/",
};
