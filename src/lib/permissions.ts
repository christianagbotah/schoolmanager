/**
 * Permission Utility Functions
 * Provides helper functions for checking and filtering permissions in the RBAC system.
 */

import { db } from "./db";
import type { MenuItem, MenuSection } from "@/config/menu";

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

/**
 * Permission module constants for easy reference.
 */
export const PERMISSION_MODULES = {
  users: "users",
  academics: "academics",
  attendance: "attendance",
  examination: "examination",
  finance: "finance",
  communication: "communication",
  transport: "transport",
  library: "library",
  inventory: "inventory",
  boarding: "boarding",
  settings: "settings",
  reports: "reports",
  self_service: "self_service",
} as const;

export type PermissionModule = (typeof PERMISSION_MODULES)[keyof typeof PERMISSION_MODULES];

/**
 * Common permission names used throughout the application.
 * These match the permission names defined in the seed data.
 */
export const PERMISSIONS = {
  // Users
  CAN_VIEW_ADMINS_LIST: "can_view_admins_list",
  CAN_CREATE_ADMINS: "can_create_admins",
  CAN_EDIT_ADMINS: "can_edit_admins",
  CAN_DELETE_ADMINS: "can_delete_admins",
  CAN_VIEW_TEACHERS_LIST: "can_view_teachers_list",
  CAN_CREATE_TEACHERS: "can_create_teachers",
  CAN_EDIT_TEACHERS: "can_edit_teachers",
  CAN_DELETE_TEACHERS: "can_delete_teachers",
  CAN_VIEW_PARENTS_LIST: "can_view_parents_list",
  CAN_CREATE_PARENTS: "can_create_parents",
  CAN_EDIT_PARENTS: "can_edit_parents",
  CAN_DELETE_PARENTS: "can_delete_parents",
  CAN_ADMIT_STUDENTS: "can_admit_students",
  CAN_VIEW_STUDENTS_LIST: "can_view_students_list",
  CAN_EDIT_STUDENTS: "can_edit_students",
  CAN_DELETE_STUDENTS: "can_delete_students",
  CAN_MANAGE_USER_ROLES: "can_manage_user_roles",

  // Academics
  CAN_MANAGE_CLASSES: "can_manage_classes",
  CAN_MANAGE_SECTIONS: "can_manage_sections",
  CAN_MANAGE_SUBJECTS: "can_manage_subjects",
  CAN_MANAGE_CLASS_ROUTINE: "can_manage_class_routine",
  CAN_VIEW_CLASS_ROUTINE: "can_view_class_routine",
  CAN_MANAGE_GRADES: "can_manage_grades",

  // Attendance
  CAN_MANAGE_ATTENDANCE: "can_manage_attendance",
  CAN_VIEW_ATTENDANCE_REPORTS: "can_view_attendance_reports",

  // Examination
  CAN_MANAGE_EXAMS: "can_manage_exams",
  CAN_ENTER_MARKS: "can_enter_marks",
  CAN_VIEW_MARKS: "can_view_marks",
  CAN_GENERATE_TERMINAL_REPORTS: "can_generate_terminal_reports",
  CAN_VIEW_BROADSHEET: "can_view_broadsheet",

  // Finance
  CAN_BILL_STUDENTS: "can_bill_students",
  CAN_VIEW_INVOICES: "can_view_invoices",
  CAN_EDIT_INVOICES: "can_edit_invoices",
  CAN_DELETE_INVOICES: "can_delete_invoices",
  CAN_RECEIVE_PAYMENT: "can_receive_payment",
  CAN_VIEW_PAYMENTS: "can_view_payments",
  CAN_APPROVE_PAYMENTS: "can_approve_payments",
  CAN_ENTER_EXPENSES: "can_enter_expenses",
  CAN_VIEW_EXPENSES: "can_view_expenses",
  CAN_VIEW_FINANCIAL_REPORTS: "can_view_financial_reports",
  CAN_RECEIVE_DAILY_FEES: "can_receive_daily_fees",
  CAN_MANAGE_DAILY_FEE_RATES: "can_manage_daily_fee_rates",
  CAN_VIEW_DAILY_FEE_REPORTS: "can_view_daily_fee_reports",
  CAN_MANAGE_BANK_ACCOUNTS: "can_manage_bank_accounts",
  CAN_MANAGE_DISCOUNTS: "can_manage_discounts",
  CAN_GENERATE_RECEIPTS: "can_generate_receipts",
  CAN_VIEW_UNIFIED_FINANCIAL_DASHBOARD: "can_view_unified_financial_dashboard",

  // Communication
  CAN_SEND_SMS: "can_send_sms",
  CAN_MANAGE_NOTICES: "can_manage_notices",
  CAN_SEND_MESSAGES: "can_send_messages",

  // Transport
  CAN_MANAGE_TRANSPORT: "can_manage_transport",
  CAN_MARK_BOARDING_ATTENDANCE: "can_mark_boarding_attendance",

  // Library
  CAN_MANAGE_BOOKS: "can_manage_books",
  CAN_ISSUE_BOOKS: "can_issue_books",
  CAN_RECEIVE_BOOKS: "can_receive_books",
  CAN_REQUEST_BOOKS: "can_request_books",

  // Inventory
  CAN_MANAGE_INVENTORY: "can_manage_inventory",
  CAN_SELL_INVENTORY: "can_sell_inventory",

  // Settings
  CAN_MANAGE_SETTINGS: "can_manage_settings",
  CAN_MANAGE_ROLES_PERMISSIONS: "can_manage_roles_permissions",
  CAN_MANAGE_FRONTEND_CMS: "can_manage_frontend_cms",
  CAN_MANAGE_DEPARTMENTS: "can_manage_departments",
  CAN_MANAGE_DESIGNATIONS: "can_manage_designations",
  CAN_MANAGE_PAYROLL: "can_manage_payroll",
  CAN_MANAGE_EMPLOYEES: "can_manage_employees",

  // Reports
  CAN_VIEW_ACADEMIC_REPORTS: "can_view_academic_reports",
  CAN_EXPORT_DATA: "can_export_data",
  CAN_PRINT_REPORTS: "can_print_reports",

  // Self-service
  CAN_VIEW_OWN_RESULTS: "can_view_own_results",
  CAN_VIEW_OWN_INVOICES: "can_view_own_invoices",
  CAN_VIEW_OWN_ATTENDANCE: "can_view_own_attendance",
  CAN_VIEW_OWN_ROUTINE: "can_view_own_routine",
  CAN_VIEW_CHILDREN_RESULTS: "can_view_children_results",
  CAN_VIEW_CHILDREN_ATTENDANCE: "can_view_children_attendance",
  CAN_MAKE_PAYMENTS: "can_make_payments",
  CAN_VIEW_CHILDREN_INVOICES: "can_view_children_invoices",
} as const;

/**
 * Legacy CI3 permission name mapping.
 * Maps the original CI3 `getAdminPermissions($level, 'Can X')` format
 * to the new permission slug format.
 */
export const CI3_PERMISSION_MAP: Record<string, string> = {
  "Can bill students": "can_bill_students",
  "Can receive payment": "can_receive_payment",
  "Can receive feeding & classes fees": "can_receive_daily_fees",
  "Can view invoices": "can_view_invoices",
  "Can enter expenses": "can_enter_expenses",
  "Can view & print financial reports": "can_view_financial_reports",
  "Can send SMS": "can_send_sms",
  "Can admit students": "can_admit_students",
  "Can view admins list": "can_view_admins_list",
  "Can view teachers list": "can_view_teachers_list",
  "Can view parents list": "can_view_parents_list",
  "view_unified_financial_dashboard": "can_view_unified_financial_dashboard",
  "view_financial_analytics": "can_view_financial_reports",
  "sync_to_accounts": "can_manage_chart_of_accounts",
};
