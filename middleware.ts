import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

const publicPaths = [
  "/login",
  "/forgot-password",
  "/reset-password",
  "/activate",
  "/api/auth",
  "/api/cron",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (publicPaths.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return NextResponse.next();
  }
  if (pathname.startsWith("/_next") || pathname.startsWith("/favicon")) {
    return NextResponse.next();
  }
  const session = getSessionCookie(request);
  if (!session) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|.*\\.png$).*)"],
};
