import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = session.user.role;
    const roleSlug = session.user.roleSlug;

    // Map to the RBAC role slug for permission lookup
    let mappedRoleSlug: string;
    if (role === "super-admin") {
      mappedRoleSlug = "super-admin";
    } else {
      mappedRoleSlug = roleSlug || role;
    }

    // Find the role in the RBAC system
    const roleRecord = await db.role.findUnique({
      where: { slug: mappedRoleSlug },
      select: {
        id: true,
        slug: true,
        name: true,
        level: true,
        rolePermissions: {
          where: { isGranted: true },
          select: {
            permission: {
              select: {
                name: true,
                displayName: true,
                module: true,
              },
            },
          },
        },
      },
    });

    if (!roleRecord) {
      // Fallback: return empty permissions
      return NextResponse.json({
        permissions: [],
        role: mappedRoleSlug,
        roleLabel: role,
        roleLevel: 0,
      });
    }

    const permissions = roleRecord.rolePermissions.map((rp) => rp.permission.name);

    return NextResponse.json({
      permissions,
      role: roleRecord.slug,
      roleLabel: roleRecord.name,
      roleLevel: roleRecord.level,
    });
  } catch (error) {
    console.error("Error fetching permissions:", error);
    return NextResponse.json(
      { error: "Failed to fetch permissions" },
      { status: 500 }
    );
  }
}
