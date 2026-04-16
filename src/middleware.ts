import { NextRequest, NextResponse } from "next/server";

/**
 * Middleware — currently a pass-through for all routes.
 *
 * Auth protection is handled client-side via useAuth() hook
 * and server-side in individual page components / API routes.
 *
 * Previously this middleware used getToken() from next-auth/jwt
 * to check authentication, but in proxied environments the JWT
 * cookie may not survive the hop, causing ERR_TOO_MANY_REDIRECTS.
 */
export default async function middleware(_req: NextRequest) {
  return NextResponse.next();
}

// Still export a matcher so Next.js knows which routes to invoke middleware for
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
