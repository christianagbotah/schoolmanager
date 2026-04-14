import { withAuth, NextRequestWithAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { UserRole } from "@/lib/auth";

// Role-based route mapping
const roleRoutes: Record<UserRole, string> = {
  admin: "/admin",
  teacher: "/teacher",
  student: "/student",
  parent: "/parent",
  accountant: "/accountant",
  librarian: "/librarian",
};

// Role-protected route prefixes
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

    const userRole = token.role as UserRole;

    // Handle /dashboard redirect to role-specific dashboard
    if (pathname === "/dashboard") {
      const dashboardPath = roleRoutes[userRole];
      return NextResponse.redirect(new URL(dashboardPath, req.url));
    }

    // Check if the route requires a specific role
    const matchedRoute = protectedRoutes.find((route) =>
      pathname.startsWith(route.path)
    );

    if (matchedRoute) {
      if (!matchedRoute.roles.includes(userRole)) {
        // Redirect to the user's own dashboard
        const dashboardPath = roleRoutes[userRole];
        return NextResponse.redirect(new URL(dashboardPath, req.url));
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
