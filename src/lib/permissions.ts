/**
 * Permission Utility Functions (Server-Only)
 * Provides helper functions for checking and filtering permissions in the RBAC system.
 * Uses server-only imports (db/PrismaClient).
 */

import "server-only";

import { db } from "./db";
import type { MenuItem, MenuSection } from "@/config/menu";

// Re-export client-safe constants so existing imports still work
export {
  PERMISSIONS,
  PERMISSION_MODULES,
  CI3_PERMISSION_MAP,
  type PermissionModule,
} from "./permission-constants";

/**
 * Check if a user has a specific permission.
 * @param userPermissions - Array of permission names the user has
 * @param permissionName - The permission name to check
 * @returns true if the user has the permission
 */
export function hasPermission(
  userPermissions: string[],
  permissionName: string
): boolean {
  return userPermissions.includes(permissionName);
}

/**
 * Check if a user has ANY permission from a list.
 * @param userPermissions - Array of permission names the user has
 * @param permissions - Array of permission names to check against
 * @returns true if the user has at least one of the specified permissions
 */
export function hasAnyPermission(
  userPermissions: string[],
  permissions: string[]
): boolean {
  return permissions.some((p) => userPermissions.includes(p));
}

/**
 * Check if a user has ALL permissions from a list.
 * @param userPermissions - Array of permission names the user has
 * @param permissions - Array of permission names to check against
 * @returns true if the user has all of the specified permissions
 */
export function hasAllPermissions(
  userPermissions: string[],
  permissions: string[]
): boolean {
  return permissions.every((p) => userPermissions.includes(p));
}

/**
 * Extended MenuItem that supports permission-based visibility.
 */
export interface PermissionMenuItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: number;
  permission?: string | string[] | null;
  permissionMode?: "any" | "all";
  children?: PermissionMenuItem[];
}

/**
 * Filter menu sections based on user permissions.
 * Removes items the user doesn't have permission to see.
 * If a parent item has children, it's only shown if at least one child is visible.
 *
 * @param menuSections - Array of menu sections
 * @param userPermissions - Array of permission names the user has
 * @returns Filtered array of menu sections the user can access
 */
export function filterMenuByPermissions(
  menuSections: MenuSection[],
  userPermissions: string[]
): MenuSection[] {
  return menuSections
    .map((section) => {
      const filteredItems = filterMenuItems(section.items, userPermissions);
      if (filteredItems.length === 0) return null;
      return { ...section, items: filteredItems };
    })
    .filter((section): section is MenuSection => section !== null);
}

/**
 * Filter menu items (flat list) based on user permissions.
 */
export function filterMenuItems(
  items: MenuItem[],
  userPermissions: string[]
): MenuItem[] {
  return items
    .map((item) => {
      // Cast to PermissionMenuItem to check for permission field
      const permItem = item as unknown as PermissionMenuItem;

      // Check if this item requires a permission
      if (permItem.permission) {
        const requiredPerms = Array.isArray(permItem.permission)
          ? permItem.permission
          : [permItem.permission];
        const mode = permItem.permissionMode || "any";

        const hasAccess =
          mode === "any"
            ? hasAnyPermission(userPermissions, requiredPerms)
            : hasAllPermissions(userPermissions, requiredPerms);

        if (!hasAccess) return null;
      }

      // Recursively filter children
      if (item.children && item.children.length > 0) {
        const filteredChildren = filterMenuItems(
          item.children,
          userPermissions
        );
        if (filteredChildren.length === 0) return null;
        return { ...item, children: filteredChildren } as MenuItem;
      }

      return item;
    })
    .filter((item): item is MenuItem => item !== null);
}

/**
 * Get user's permission names from their role.
 * Queries the database for the user's role and returns all granted permission names.
 *
 * @param userId - The user's ID (from the User table, unified RBAC user)
 * @returns Array of permission name strings the user has been granted
 */
export async function getUserPermissionNames(userId: number): Promise<string[]> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      roleId: true,
      role: {
        select: {
          rolePermissions: {
            where: { isGranted: true },
            select: {
              permission: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!user || !user.role) {
    return [];
  }

  return user.role.rolePermissions.map((rp) => rp.permission.name);
}

/**
 * Get user's permission names from any legacy user table (admin, teacher, etc.)
 * by looking up their associated Role via a slug mapping.
 * This bridges the gap between the old multi-table auth and the new RBAC system.
 *
 * @param userType - The user type (e.g., "admin", "teacher", "student")
 * @param userLevel - The admin level (for admin users, to distinguish super-admin from admin)
 * @returns Array of permission name strings
 */
export async function getLegacyUserPermissionNames(
  userType: string,
  userLevel?: number
): Promise<string[]> {
  // Map legacy user types to role slugs
  let roleSlug: string;

  if (userType === "admin") {
    // Admin level 1 = super-admin, level 2+ = admin
    roleSlug = userLevel === 1 ? "super-admin" : "admin";
  } else {
    roleSlug = userType; // teacher, student, parent, accountant, librarian
  }

  const role = await db.role.findUnique({
    where: { slug: roleSlug },
    select: {
      rolePermissions: {
        where: { isGranted: true },
        select: {
          permission: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  });

  if (!role) {
    return [];
  }

  return role.rolePermissions.map((rp) => rp.permission.name);
}
