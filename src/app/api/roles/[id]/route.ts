import { NextResponse } from "next/server";
import { db } from "@/lib/db";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/roles/[id]
 * Get a single role with full details including all permissions.
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
        _count: {
          select: {
            users: true,
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

    const formatted = {
      ...role,
      userCount: role._count.users,
      permissions: role.rolePermissions.map((rp) => ({
        id: rp.permission.id,
        name: rp.permission.name,
        displayName: rp.permission.displayName,
        module: rp.permission.module,
        description: rp.permission.description,
        isGranted: rp.isGranted,
      })),
    };

    return NextResponse.json({ success: true, data: formatted });
  } catch (error) {
    console.error("Error fetching role:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch role" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/roles/[id]
 * Update a role's basic info (name, description, level, etc.).
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

    const body = await request.json();
    const { name, slug, description, level, isDefault } = body as {
      name?: string;
      slug?: string;
      description?: string | null;
      level?: number;
      isDefault?: boolean;
    };

    // Check if role exists
    const existing = await db.role.findUnique({ where: { id: roleId } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Role not found" },
        { status: 404 }
      );
    }

    // Check slug uniqueness if changing
    if (slug && slug !== existing.slug) {
      const slugExists = await db.role.findUnique({ where: { slug } });
      if (slugExists) {
        return NextResponse.json(
          { success: false, error: "A role with this slug already exists" },
          { status: 409 }
        );
      }
    }

    const role = await db.role.update({
      where: { id: roleId },
      data: {
        ...(name !== undefined && { name }),
        ...(slug !== undefined && { slug }),
        ...(description !== undefined && { description }),
        ...(level !== undefined && { level }),
        ...(isDefault !== undefined && { isDefault }),
      },
    });

    return NextResponse.json({
      success: true,
      data: role,
      message: `Role "${role.name}" updated successfully`,
    });
  } catch (error) {
    console.error("Error updating role:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update role" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/roles/[id]
 * Delete a role. Prevents deletion of roles with assigned users.
 */
export async function DELETE(_request: Request, { params }: RouteParams) {
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
    const existing = await db.role.findUnique({
      where: { id: roleId },
      include: {
        _count: {
          select: { users: true },
        },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Role not found" },
        { status: 404 }
      );
    }

    // Prevent deletion of roles that have users
    if (existing._count.users > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot delete role "${existing.name}" because it has ${existing._count.users} assigned user(s). Reassign or remove users first.`,
        },
        { status: 409 }
      );
    }

    await db.role.delete({
      where: { id: roleId },
    });

    return NextResponse.json({
      success: true,
      message: `Role "${existing.name}" deleted successfully`,
    });
  } catch (error) {
    console.error("Error deleting role:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete role" },
      { status: 500 }
    );
  }
}
