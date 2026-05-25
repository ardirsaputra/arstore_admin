// lib/auth.ts — JWT helpers and auth cookie configuration for Next.js App Router

import jwt from "jsonwebtoken";
import type { NextRequest } from "next/server";

const JWT_SECRET = process.env.JWT_SECRET ?? "arstore-secret-change-me";
const JWT_EXPIRES = "7d";

export const AUTH_COOKIE = {
  name: "arstore_admin_token",
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 7, // 7 days in seconds
};

export function signToken(payload: Record<string, unknown>): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES });
}

export function verifyToken(token: string): Record<string, unknown> | null {
  try {
    return jwt.verify(token, JWT_SECRET) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/**
 * Reads the admin JWT from the request cookie and verifies it.
 * Returns the decoded payload if valid, null otherwise.
 */
export function getAdminFromRequest(
  req: NextRequest,
): Record<string, unknown> | null {
  const token = req.cookies.get(AUTH_COOKIE.name)?.value;
  if (!token) return null;
  return verifyToken(token);
}
