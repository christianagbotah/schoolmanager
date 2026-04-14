import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";

/**
 * GET /api/roles
 * List all roles with their permission counts.
 */
export async function GET() {
  try {
    const roles = await db.role.findMany({
      orderBy: [{ level: "asc" }, { name: "asc" }],
      include: {
        rolePermissions: {
          where: { isGranted: true },
          include: {
            permission: {
              select: {
                id: true,
                name: true,
                displayName: true,
                module: true,
              },
            },
          },
        },
        _count: {
          select: {
            users: true,
          },
        },
      },
    });

    const formatted = roles.map((role) => ({
      id: role.id,
      name: role.name,
      slug: role.slug,
      description: role.description,
      level: role.level,
      isDefault: role.isDefault,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
      userCount: role._count.users,
      grantedPermissions: role.rolePermissions.map((rp) => rp.permission),
      grantedPermissionCount: role.rolePermissions.length,
    }));

    return NextResponse.json({
      success: true,
      data: formatted,
      total: formatted.length,
    });
  } catch (error) {
    console.error("Error fetching roles:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch roles" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/roles
 * Create a new role.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, slug, description, level, isDefault } = body as {
      name: string;
      slug: string;
      description?: string;
      level?: number;
      isDefault?: boolean;
    };

    if (!name || !slug) {
      return NextResponse.json(
        { success: false, error: "Name and slug are required" },
        { status: 400 }
      );
    }

    // Check if slug already exists
    const existing = await db.role.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json(
        { success: false, error: "A role with this slug already exists" },
        { status: 409 }
      );
    }

    const role = await db.role.create({
      data: {
        name,
        slug,
        description: description || null,
        level: level ?? 0,
        isDefault: isDefault ?? false,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: role,
        message: `Role "${name}" created successfully`,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating role:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create role" },
      { status: 500 }
    );
  }
}
