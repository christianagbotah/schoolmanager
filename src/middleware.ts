import { withAuth, NextRequestWithAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { UserRole } from "@/lib/auth";

// Role-based route mapping (where each role should land)
const roleRoutes: Record<string, string> = {
  "super-admin": "/dashboard",
  admin: "/dashboard",
  teacher: "/dashboard",
  student: "/dashboard",
  parent: "/dashboard",
  accountant: "/dashboard",
  librarian: "/dashboard",
  cashier: "/dashboard",
  conductor: "/dashboard",
  receptionist: "/dashboard",
};

// Role-protected route prefixes (legacy routes still accessible)
const protectedRoutes: { path: string; roles: UserRole[] }[] = [
  { path: "/admin", roles: ["admin"] },
  { path: "/teacher", roles: ["teacher"] },
  { path: "/student", roles: ["student"] },
  { path: "/parent", roles: ["parent"] },
  { path: "/accountant", roles: ["accountant"] },
  { path: "/librarian", roles: ["librarian"] },
];

// Public routes that don't require authentication
const publicRoutes = [
  "/",
  "/login",
  "/about",
  "/contact",
  "/gallery",
  "/events",
  "/noticeboard",
  "/admission",
  "/api/",
];

export default withAuth(
  function middleware(req: NextRequestWithAuth) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;

    // Allow public routes
    if (publicRoutes.some((route) => pathname.startsWith(route))) {
      return NextResponse.next();
    }

    // If no token, redirect to login
    if (!token) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    const userRole = (token.role as string) || "student";

    // /dashboard is the unified entry point - allow all authenticated users
    if (pathname === "/dashboard") {
      return NextResponse.next();
    }

    // Check if the route requires a specific role
    const matchedRoute = protectedRoutes.find((route) =>
      pathname.startsWith(route.path)
    );

    if (matchedRoute) {
      // Super-admin has access to all routes
      const effectiveRole = userRole === "super-admin" ? "admin" : userRole;
      if (!matchedRoute.roles.includes(effectiveRole as UserRole)) {
        // Redirect to the unified dashboard
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized({ token, req }) {
        const { pathname } = req.nextUrl;
        // Allow public routes without authentication
        if (publicRoutes.some((route) => pathname.startsWith(route))) {
          return true;
        }
        // Allow access if token exists (user is authenticated)
        return !!token;
      },
    },
    pages: {
      signIn: "/login",
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
