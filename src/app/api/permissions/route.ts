import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * GET /api/permissions
 * List all permissions grouped by module.
 * Admin-only access enforced at the auth layer.
 */
export async function GET() {
  try {
    const permissions = await db.permission.findMany({
      orderBy: [{ module: "asc" }, { displayName: "asc" }],
      include: {
        rolePermissions: {
          include: {
            role: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
      },
    });

    // Group by module
    const grouped = permissions.reduce<
      Record<string, typeof permissions>
    >((acc, perm) => {
      if (!acc[perm.module]) {
        acc[perm.module] = [];
      }
      acc[perm.module].push(perm);
      return acc;
    }, {});

    return NextResponse.json({
      success: true,
      data: {
        all: permissions,
        grouped,
        total: permissions.length,
        modules: Object.keys(grouped),
      },
    });
  } catch (error) {
    console.error("Error fetching permissions:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch permissions" },
      { status: 500 }
    );
  }
}
