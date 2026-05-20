import { NextResponse, type NextRequest } from "next/server";
import { sessionCookieName } from "./lib/session-constants";

export function middleware(request: NextRequest) {
  const sessionToken = request.cookies.get(sessionCookieName)?.value;

  const isPrivateRoute =
    request.nextUrl.pathname.startsWith("/admin") ||
    request.nextUrl.pathname.startsWith("/dashboard") ||
    request.nextUrl.pathname.startsWith("/onboarding") ||
    request.nextUrl.pathname.startsWith("/billing");

  if (isPrivateRoute && !sessionToken) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/dashboard/:path*", "/onboarding/:path*", "/billing/:path*"]
};
