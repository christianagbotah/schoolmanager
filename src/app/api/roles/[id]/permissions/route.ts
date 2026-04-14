import { NextResponse } from "next/server";
import { db } from "@/lib/db";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * PUT /api/roles/[id]/permissions
 * Update the permission assignments for a role.
 * Expects body: { permissions: { [permissionId]: boolean } }
 * 
 * Example:
 * {
 *   "permissions": {
 *     "1": true,   // grant permission 1
 *     "2": false,  // revoke permission 2
 *     "3": true    // grant permission 3
 *   }
 * }
 */
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const roleId = parseInt(id, 10);

    if (isNaN(roleId)) {
      return NextResponse.json(
        { success: false, error: "Invalid role ID" },
        { status: 400 }
      );
    }

    // Check if role exists
    const role = await db.role.findUnique({ where: { id: roleId } });
    if (!role) {
      return NextResponse.json(
        { success: false, error: "Role not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { permissions } = body as {
      permissions: Record<string, boolean>;
    };

    if (!permissions || typeof permissions !== "object") {
      return NextResponse.json(
        { success: false, error: "permissions object is required" },
        { status: 400 }
      );
    }

    // Validate all permission IDs exist
    const permissionIds = Object.keys(permissions).map(Number);
    const validPermissions = await db.permission.findMany({
      where: { id: { in: permissionIds } },
      select: { id: true },
    });

    const validIds = new Set(validPermissions.map((p) => p.id));
    const invalidIds = permissionIds.filter((id) => !validIds.has(id));

    if (invalidIds.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid permission IDs: ${invalidIds.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Update permissions in a transaction
    const updates = await db.$transaction(
      permissionIds.map((permissionId) => {
        const isGranted = permissions[String(permissionId)] ?? false;
        return db.rolePermission.upsert({
          where: {
            roleId_permissionId: {
              roleId,
              permissionId,
            },
          },
          update: { isGranted },
          create: {
            roleId,
            permissionId,
            isGranted,
          },
        });
      })
    );

    // Fetch the updated role with permissions
    const updatedRole = await db.role.findUnique({
      where: { id: roleId },
      include: {
        rolePermissions: {
          where: { isGranted: true },
          include: {
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

    return NextResponse.json({
      success: true,
      data: {
        roleId: updatedRole?.id,
        roleName: updatedRole?.name,
        grantedPermissions: updatedRole?.rolePermissions.map(
          (rp) => rp.permission
        ),
        grantedCount: updatedRole?.rolePermissions.length,
      },
      message: `Permissions updated for role "${role.name}" (${updates.length} changes)`,
    });
  } catch (error) {
    console.error("Error updating role permissions:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update role permissions" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/roles/[id]/permissions
 * Get all permissions for a role (both granted and not granted).
 */
export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const roleId = parseInt(id, 10);

    if (isNaN(roleId)) {
      return NextResponse.json(
        { success: false, error: "Invalid role ID" },
        { status: 400 }
      );
    }

    const role = await db.role.findUnique({
      where: { id: roleId },
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    if (!role) {
      return NextResponse.json(
        { success: false, error: "Role not found" },
        { status: 404 }
      );
    }

    // Group permissions by module
    const grouped = role.rolePermissions.reduce<
      Record<string, Array<(typeof role.rolePermissions)[0]>>
    >((acc, rp) => {
      const mod = rp.permission.module;
      if (!acc[mod]) acc[mod] = [];
      acc[mod].push(rp);
      return acc;
    }, {});

    return NextResponse.json({
      success: true,
      data: {
        roleId: role.id,
        roleName: role.name,
        roleSlug: role.slug,
        grouped,
        totalPermissions: role.rolePermissions.length,
        grantedCount: role.rolePermissions.filter((rp) => rp.isGranted).length,
        revokedCount: role.rolePermissions.filter((rp) => !rp.isGranted).length,
      },
    });
  } catch (error) {
    console.error("Error fetching role permissions:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch role permissions" },
      { status: 500 }
    );
  }
}
