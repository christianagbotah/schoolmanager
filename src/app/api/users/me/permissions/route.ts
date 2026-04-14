import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getLegacyUserPermissionNames } from "@/lib/permissions";
import { db } from "@/lib/db";

/**
 * GET /api/users/me/permissions
 * Get the current authenticated user's permissions.
 * Works with both legacy auth (admin/teacher/student tables) and new RBAC User table.
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const userRole = session.user.role;

    let permissionNames: string[] = [];
    let roleName: string = userRole;
    let roleSlug: string = userRole;

    // Try to determine admin level for legacy admin users
    let adminLevel: number | undefined;

    if (userRole === "admin" || userRole === "super-admin") {
      // For admin users, check their level to determine super-admin vs admin
      try {
        const adminUser = await db.admin.findFirst({
          where: { email: session.user.email },
          select: { level: true },
        });
        if (adminUser) {
          adminLevel = parseInt(adminUser.level || "2", 10);
          if (adminLevel === 1) {
            roleSlug = "super-admin";
            roleName = "Super Admin";
          } else {
            roleSlug = "admin";
            roleName = "Admin";
          }
        }
      } catch {
        // If we can't look up, just use default
      }
    }

    // Get permissions based on role slug
    permissionNames = await getLegacyUserPermissionNames(userRole, adminLevel);

    return NextResponse.json({
      success: true,
      data: {
        userId,
        role: roleName,
        roleSlug,
        permissions: permissionNames,
        permissionCount: permissionNames.length,
      },
    });
  } catch (error) {
    console.error("Error fetching user permissions:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch user permissions" },
      { status: 500 }
    );
  }
}
