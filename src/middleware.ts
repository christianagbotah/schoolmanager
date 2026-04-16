import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { UserRole } from "@/lib/auth";

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
  "/api/auth",
  "/api/settings",
  "/api/frontend",
  "/api/roles",
];

// Role-protected route prefixes (legacy routes still accessible)
const protectedRoutes: { path: string; roles: UserRole[] }[] = [
  { path: "/admin", roles: ["admin"] },
  { path: "/teacher", roles: ["teacher"] },
  { path: "/student", roles: ["student"] },
  { path: "/parent", roles: ["parent"] },
  { path: "/accountant", roles: ["accountant"] },
  { path: "/librarian", roles: ["librarian"] },
];

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow public routes without authentication
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Allow NextAuth API routes
  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  // Allow static files and images
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/images") ||
    pathname.startsWith("/upload") ||
    pathname.endsWith(".ico") ||
    pathname.endsWith(".svg") ||
    pathname.endsWith(".png") ||
    pathname.endsWith(".jpg") ||
    pathname.endsWith(".jpeg") ||
    pathname.endsWith(".gif") ||
    pathname.endsWith(".webp")
  ) {
    return NextResponse.next();
  }

  // Get JWT token
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // If no token, redirect to login
  if (!token) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const userRole = (token.role as string) || "student";

  // /dashboard is the unified entry point — allow all authenticated users
  if (pathname === "/dashboard" || pathname.startsWith("/dashboard")) {
    return NextResponse.next();
  }

  // Shared pages — allow all authenticated users
  const sharedPages = [
    "/notices", "/messages", "/profile", "/attendance", "/routine",
    "/transport", "/library", "/invoices", "/payments", "/results", "/online-exams",
  ];
  if (sharedPages.some((page) => pathname === page || pathname.startsWith(page + "/"))) {
    return NextResponse.next();
  }

  // Check if the route requires a specific role (legacy routes)
  const matchedRoute = protectedRoutes.find((route) =>
    pathname.startsWith(route.path)
  );

  if (matchedRoute) {
    // Super-admin has access to all routes
    const effectiveRole = userRole === "super-admin" ? "admin" : userRole;
    if (!matchedRoute.roles.includes(effectiveRole as UserRole)) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
