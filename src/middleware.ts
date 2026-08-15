import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/auth";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow public auth endpoints
  if (
    pathname.startsWith("/api/auth/login") ||
    pathname.startsWith("/api/auth/register") ||
    pathname.startsWith("/api/auth/logout") ||
    pathname.startsWith("/api/auth/session")
  ) {
    return NextResponse.next();
  }

  // Protect /api routes
  if (pathname.startsWith("/api/")) {
    const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized: Missing authentication session" },
        { status: 401 }
      );
    }

    const session = verifySessionToken(token);
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized: Invalid or expired session" },
        { status: 401 }
      );
    }

    // Forward user and tenant context via request headers for backend handlers
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set("x-user-id", session.userId.toString());
    requestHeaders.set("x-agency-id", session.agencyId.toString());
    requestHeaders.set("x-user-role", session.role);
    requestHeaders.set("x-user-email", session.email);

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*"],
};
