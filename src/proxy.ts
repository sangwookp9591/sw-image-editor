import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

export function proxy(request: NextRequest) {
  const session = getSessionCookie(request);
  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return NextResponse.next();
}

// MATCHER DOCUMENTATION:
// This negative-lookahead regex protects ALL routes EXCEPT the ones listed.
// Currently excluded from auth protection:
//   - login, signup   — auth pages (users must access these unauthenticated)
//   - api             — API routes (they handle their own auth via session checks)
//   - _next/static    — Next.js static assets
//   - _next/image     — Next.js image optimization
//   - favicon.ico     — browser favicon
//
// IMPORTANT: When adding new public pages (e.g., /pricing, /about, /terms),
// you MUST add them to this exclusion list. The pattern format is:
//   /((?!login|signup|NEW_PAGE|api|_next/static|_next/image|favicon.ico).*)
// Without updating this list, new public pages will redirect to /login.
export const config = {
  matcher: ["/((?!login|signup|api|_next/static|_next/image|favicon.ico).*)"],
};
