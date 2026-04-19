/**
 * Permission Utility Functions (Server-Only)
 * Provides comprehensive permission-based access control for the RBAC system.
 * Replaces CI3's hardcoded role checks (is_admin, is_teacher, etc.)
 *
 * Server-only imports (db/PrismaClient). For client-side use, import from
 * `@/lib/permission-constants` instead.
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

// ─── Types ──────────────────────────────────────────────────

/**
 * UserSession — minimal shape needed for permission checks.
 * Compatible with NextAuth session.user and our JWT token shape.
 */
export type UserSession = {
  user?: {
    id: string | number;
    email: string;
    name: string;
    role: string;           // "admin", "teacher", "parent", "student", "accountant", "librarian", "super-admin"
    roleSlug?: string;
    permissions?: string[]; // flat list of granted permission names
    roleId?: number;
  };
  permissions?: string[];  // legacy: may sit at session level
};

// ─── Pure permission checks (no DB, usable anywhere) ────────

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
 */
export function hasAnyPermission(
  userPermissions: string[],
  permissions: string[]
): boolean {
  return permissions.some((p) => userPermissions.includes(p));
}

/**
 * Check if a user has ALL permissions from a list.
 */
export function hasAllPermissions(
  userPermissions: string[],
  permissions: string[]
): boolean {
  return permissions.every((p) => userPermissions.includes(p));
}

/**
 * Extract the permission list from a UserSession object.
 * Handles both `session.user.permissions` and `session.permissions`.
 */
export function getSessionPermissions(session: UserSession): string[] {
  if (!session) return [];
  return session?.user?.permissions ?? session?.permissions ?? [];
}

/**
 * Check if a UserSession has a specific permission.
 */
export function sessionHasPermission(
  session: UserSession,
  permissionName: string
): boolean {
  return hasPermission(getSessionPermissions(session), permissionName);
}

// ─── Menu filtering ────────────────────────────────────────

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
      const permItem = item as unknown as PermissionMenuItem;

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

// ─── Database-backed permission queries ────────────────────

/**
 * Get all granted permission names for a given role slug.
 * Example: getPermissionsForRole("teacher") → ["can_view_class_routine", "can_manage_attendance", ...]
 *
 * @param roleSlug - The role slug (e.g., "admin", "teacher", "student", "super-admin")
 * @returns Array of granted permission name strings
 */
export async function getPermissionsForRole(
  roleSlug: string
): Promise<string[]> {
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

/**
 * Get all unique module names that a role has at least one granted permission for.
 * Example: getAccessibleModules("teacher") → ["academics", "attendance", "examination"]
 *
 * @param roleSlug - The role slug
 * @returns Array of module name strings
 */
export async function getAccessibleModules(
  roleSlug: string
): Promise<string[]> {
  const role = await db.role.findUnique({
    where: { slug: roleSlug },
    select: {
      rolePermissions: {
        where: { isGranted: true },
        select: {
          permission: {
            select: {
              module: true,
            },
          },
        },
      },
    },
  });

  if (!role) {
    return [];
  }

  // Use Set to deduplicate modules
  const modules = new Set<string>();
  for (const rp of role.rolePermissions) {
    if (rp.permission.module) {
      modules.add(rp.permission.module);
    }
  }

  return Array.from(modules);
}

/**
 * Check if a user session can access a specific module.
 * This is the primary gatekeeper for page-level access control.
 *
 * It works by:
 * 1. First checking if the session has a matching permission in their pre-loaded list
 * 2. Falls back to checking via the role slug against the database
 *
 * @param session - The user session object
 * @param moduleName - The module to check (e.g., "students", "finance", "dashboard")
 * @returns true if the user can access any feature in the module
 */
export async function canAccessModule(
  session: UserSession,
  moduleName: string
): Promise<boolean> {
  const perms = getSessionPermissions(session);

  // Permission name patterns per module (any permission starting with the module prefix)
  // Map module names to known permission prefixes
  const modulePermissionPrefixes: Record<string, string[]> = {
    dashboard: ["can_view"],        // dashboard access is implied by any session
    students: [
      "can_view_students_list", "can_admit_students", "can_edit_students",
      "can_delete_students", "can_view_own_results", "can_view_own_invoices",
      "can_view_own_attendance", "can_view_own_routine", "can_request_books",
    ],
    teachers: [
      "can_view_teachers_list", "can_create_teachers", "can_edit_teachers",
      "can_delete_teachers",
    ],
    parents: [
      "can_view_parents_list", "can_create_parents", "can_edit_parents",
      "can_delete_parents", "can_view_children_results", "can_view_children_attendance",
      "can_make_payments", "can_view_children_invoices",
    ],
    classes: ["can_manage_classes", "can_manage_sections"],
    subjects: ["can_manage_subjects"],
    attendance: ["can_manage_attendance", "can_view_attendance_reports", "can_view_own_attendance", "can_view_children_attendance"],
    exams: ["can_manage_exams", "can_enter_marks", "can_view_marks", "can_manage_online_exams"],
    grades: ["can_manage_grades", "can_generate_terminal_reports", "can_view_broadsheet", "can_view_academic_reports"],
    fees: [
      "can_bill_students", "can_view_invoices", "can_receive_payment", "can_view_payments",
      "can_receive_daily_fees", "can_manage_daily_fee_rates", "can_view_daily_fee_reports",
      "can_manage_fee_settings", "can_manage_discounts", "can_generate_receipts",
      "can_view_financial_reports", "can_make_payments", "can_view_children_invoices",
    ],
    finance: [
      "can_bill_students", "can_view_invoices", "can_receive_payment", "can_view_payments",
      "can_enter_expenses", "can_view_expenses", "can_view_financial_reports",
      "can_manage_bank_accounts", "can_manage_payroll", "can_manage_discounts",
    ],
    expenses: ["can_enter_expenses", "can_view_expenses", "can_view_financial_reports"],
    reports: ["can_view_academic_reports", "can_view_financial_reports", "can_export_data", "can_print_reports"],
    messages: ["can_send_messages", "can_send_sms"],
    notices: ["can_manage_notices"],
    timetable: ["can_manage_class_routine", "can_view_class_routine"],
    transport: ["can_manage_transport", "can_view_transport_reports"],
    library: ["can_manage_books", "can_issue_books", "can_request_books"],
    hostel: ["can_manage_boarding", "can_assign_boarding_students"],
    events: ["can_manage_frontend_cms"],
    gallery: ["can_manage_frontend_cms"],
    syllabus: ["can_manage_syllabus"],
    settings: ["can_manage_settings", "can_manage_roles_permissions"],
    payroll: ["can_manage_payroll"],
    inventory: ["can_manage_inventory", "can_sell_inventory"],
    online_exams: ["can_manage_online_exams", "can_manage_exams"],
  };

  // Check against pre-loaded session permissions
  const relevantPerms = modulePermissionPrefixes[moduleName];
  if (relevantPerms) {
    for (const perm of relevantPerms) {
      if (perms.includes(perm)) {
        return true;
      }
    }
  }

  // Fallback: check via DB if we have a role slug
  const roleSlug = session?.user?.roleSlug || session?.user?.role;
  if (roleSlug) {
    try {
      const accessible = await getAccessibleModules(roleSlug);
      if (accessible.includes(moduleName)) {
        return true;
      }
    } catch {
      // DB error — fail closed
    }
  }

  // Super-admin always has access
  if (session?.user?.role === "super-admin") {
    return true;
  }

  return false;
}

/**
 * Check if a user session can access a specific page/module.
 * Convenience wrapper around canAccessModule for route protection.
 *
 * @param session - The user session object
 * @param module - The module name to check
 * @returns true if the user can access the module
 */
export async function canAccessPage(
  session: UserSession,
  module: string
): Promise<boolean> {
  return canAccessModule(session, module);
}

// ─── User-specific permission queries ───────────────────────

/**
 * Get user's permission names from their unified User record.
 * Queries the database for the user's role and returns all granted permission names.
 *
 * @param userId - The user's ID (from the User table, unified RBAC user)
 * @returns Array of permission name strings the user has been granted
 */
export async function getUserPermissionNames(userId: number): Promise<string[]> {
  try {
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
  } catch {
    // User table might not exist yet in legacy setup
    return [];
  }
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
  let roleSlug: string;

  if (userType === "admin") {
    roleSlug = userLevel === 1 ? "super-admin" : "admin";
  } else {
    roleSlug = userType;
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

// ─── Module → Permission Mapping (static) ──────────────────

/**
 * Mapping of module names to the minimum required permission for access.
 * Used by canAccessPage when checking page-level authorization.
 */
export const MODULE_ACCESS_PERMISSIONS: Record<string, string[]> = {
  dashboard: [],
  students: ["can_view_students_list", "can_admit_students", "can_view_own_results", "can_view_own_invoices", "can_view_own_attendance"],
  teachers: ["can_view_teachers_list", "can_create_teachers"],
  parents: ["can_view_parents_list", "can_create_parents", "can_view_children_results"],
  classes: ["can_manage_classes"],
  subjects: ["can_manage_subjects"],
  attendance: ["can_manage_attendance", "can_view_attendance_reports", "can_view_own_attendance"],
  exams: ["can_manage_exams", "can_enter_marks", "can_view_marks", "can_view_academic_reports"],
  grades: ["can_manage_grades", "can_generate_terminal_reports"],
  fees: ["can_bill_students", "can_view_invoices", "can_receive_payment", "can_make_payments"],
  finance: ["can_view_financial_reports", "can_bill_students", "can_receive_payment", "can_enter_expenses"],
  expenses: ["can_enter_expenses", "can_view_expenses"],
  reports: ["can_view_academic_reports", "can_view_financial_reports"],
  messages: ["can_send_messages"],
  notices: ["can_manage_notices"],
  timetable: ["can_manage_class_routine", "can_view_class_routine"],
  transport: ["can_manage_transport"],
  library: ["can_manage_books", "can_issue_books", "can_request_books"],
  hostel: ["can_manage_boarding"],
  events: ["can_manage_frontend_cms"],
  gallery: ["can_manage_frontend_cms"],
  syllabus: ["can_manage_syllabus"],
  settings: ["can_manage_settings"],
  payroll: ["can_manage_payroll"],
  inventory: ["can_manage_inventory"],
  online_exams: ["can_manage_online_exams", "can_manage_exams"],
};
