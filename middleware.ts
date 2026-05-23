import { NextRequest, NextResponse } from "next/server";
import { getAdminFromRequest } from "@/lib/auth";

const PROTECTED = [
  "/dashboard",
  "/devices",
  "/codes",
  "/payment-info",
  "/feature-requests",
];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isProtected = PROTECTED.some((p) => pathname.startsWith(p));
  const isAdminApi = pathname.startsWith("/api/admin");

  if (!isProtected && !isAdminApi) return NextResponse.next();

  const admin = getAdminFromRequest(req);
  if (!admin) {
    if (isAdminApi) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/devices/:path*",
    "/codes/:path*",
    "/payment-info/:path*",
    "/feature-requests/:path*",
    "/api/admin/:path*",
  ],
};
