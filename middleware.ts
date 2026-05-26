import { NextRequest, NextResponse } from "next/server";

const PROTECTED = [
  "/dashboard",
  "/devices",
  "/codes",
  "/products",
  "/releases",
  "/payment-info",
  "/feature-requests",
];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isProtected = PROTECTED.some((p) => pathname.startsWith(p));
  const isAdminApi = pathname.startsWith("/api/admin");

  if (!isProtected && !isAdminApi) return NextResponse.next();

  // Edge runtime does not support jsonwebtoken, so we just check for cookie presence here.
  // Real token verification happens securely in the Node.js API routes.
  const hasToken = req.cookies.has("arstore_admin_token");
  
  if (!hasToken) {
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
    "/products/:path*",
    "/releases/:path*",
    "/payment-info/:path*",
    "/feature-requests/:path*",
    "/api/admin/:path*",
  ],
};
