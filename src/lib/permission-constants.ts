/**
 * Permission Constants & Pure Helpers (Client-Safe)
 * Pure constants, type definitions, and stateless helper functions.
 * No server-only imports — safe to use in client components.
 */

import type { MenuItem, MenuSection } from "@/config/menu";

// ─── Pure helper functions (no server deps) ──────────────────

export function hasPermission(
  userPermissions: string[],
  permissionName: string
): boolean {
  return userPermissions.includes(permissionName);
}

export function hasAnyPermission(
  userPermissions: string[],
  permissions: string[]
): boolean {
  return permissions.some((p) => userPermissions.includes(p));
}

export function hasAllPermissions(
  userPermissions: string[],
  permissions: string[]
): boolean {
  return permissions.every((p) => userPermissions.includes(p));
}

export interface PermissionMenuItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: number;
  permission?: string | string[] | null;
  permissionMode?: "any" | "all";
  children?: PermissionMenuItem[];
}

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
        const filteredChildren = filterMenuItems(item.children, userPermissions);
        if (filteredChildren.length === 0) return null;
        return { ...item, children: filteredChildren } as MenuItem;
      }
      return item;
    })
    .filter((item): item is MenuItem => item !== null);
}

// ─── Constants ──────────────────────────────────────────────

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
