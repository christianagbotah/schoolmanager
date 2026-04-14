/**
 * RBAC Seed Data
 * Comprehensive seed for roles, permissions, and role-permission mappings
 * matching the original CI3 school manager's permission patterns.
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ============================================================
// ROLE DEFINITIONS
// ============================================================
const roles = [
  { name: "Super Admin", slug: "super-admin", description: "Full system access with all permissions. Can manage all settings including roles.", level: 1, isDefault: false },
  { name: "Admin", slug: "admin", description: "Administrative access with most permissions. Cannot manage roles or system settings.", level: 2, isDefault: false },
  { name: "Accountant", slug: "accountant", description: "Financial management access: billing, payments, expenses, and financial reports.", level: 3, isDefault: false },
  { name: "Cashier", slug: "cashier", description: "Point-of-sale access: receive payments, manage daily fees, view invoices.", level: 4, isDefault: false },
  { name: "Conductor", slug: "conductor", description: "Transport management: boarding attendance, bus routes, transport fares.", level: 5, isDefault: false },
  { name: "Teacher", slug: "teacher", description: "Academic access: attendance, mark entry, class routines, daily fee collection.", level: 6, isDefault: false },
  { name: "Student", slug: "student", description: "Student portal: view results, invoices, routine, library requests.", level: 7, isDefault: true },
  { name: "Parent", slug: "parent", description: "Parent portal: view children's results, attendance, make payments.", level: 7, isDefault: false },
  { name: "Librarian", slug: "librarian", description: "Library management: books, book requests, returns.", level: 6, isDefault: false },
  { name: "Receptionist", slug: "receptionist", description: "Front desk: admit students, view lists, basic inquiries.", level: 5, isDefault: false },
];

// ============================================================
// PERMISSION DEFINITIONS by MODULE
// ============================================================
const permissions = [
  // --- USERS MODULE ---
  { name: "can_view_admins_list", displayName: "Can View Admins List", module: "users", description: "View the list of administrator accounts" },
  { name: "can_create_admins", displayName: "Can Create Admins", module: "users", description: "Create new administrator accounts" },
  { name: "can_edit_admins", displayName: "Can Edit Admins", module: "users", description: "Modify administrator account details" },
  { name: "can_delete_admins", displayName: "Can Delete Admins", module: "users", description: "Remove administrator accounts" },
  { name: "can_view_teachers_list", displayName: "Can View Teachers List", module: "users", description: "View the list of teacher accounts" },
  { name: "can_create_teachers", displayName: "Can Create Teachers", module: "users", description: "Create new teacher accounts" },
  { name: "can_edit_teachers", displayName: "Can Edit Teachers", module: "users", description: "Modify teacher account details" },
  { name: "can_delete_teachers", displayName: "Can Delete Teachers", module: "users", description: "Remove teacher accounts" },
  { name: "can_view_parents_list", displayName: "Can View Parents List", module: "users", description: "View the list of parent accounts" },
  { name: "can_create_parents", displayName: "Can Create Parents", module: "users", description: "Create new parent accounts" },
  { name: "can_edit_parents", displayName: "Can Edit Parents", module: "users", description: "Modify parent account details" },
  { name: "can_delete_parents", displayName: "Can Delete Parents", module: "users", description: "Remove parent accounts" },
  { name: "can_admit_students", displayName: "Can Admit Students", module: "users", description: "Admit/register new students into the school" },
  { name: "can_view_students_list", displayName: "Can View Students List", module: "users", description: "View the list of all students" },
  { name: "can_edit_students", displayName: "Can Edit Students", module: "users", description: "Modify student records" },
  { name: "can_delete_students", displayName: "Can Delete Students", module: "users", description: "Remove/deactivate student accounts" },
  { name: "can_manage_user_roles", displayName: "Can Manage User Roles", module: "users", description: "Assign and change user roles" },

  // --- ACADEMICS MODULE ---
  { name: "can_manage_classes", displayName: "Can Manage Classes", module: "academics", description: "Create, edit, and delete classes" },
  { name: "can_manage_sections", displayName: "Can Manage Sections", module: "academics", description: "Create, edit, and delete class sections" },
  { name: "can_manage_subjects", displayName: "Can Manage Subjects", module: "academics", description: "Create, edit, and delete subjects" },
  { name: "can_manage_class_routine", displayName: "Can Manage Class Routine", module: "academics", description: "Create and edit class timetables" },
  { name: "can_view_class_routine", displayName: "Can View Class Routine", module: "academics", description: "View class timetables" },
  { name: "can_manage_grades", displayName: "Can Manage Grades", module: "academics", description: "Configure grading scales" },
  { name: "can_manage_syllabus", displayName: "Can Manage Syllabus", module: "academics", description: "Create and manage academic syllabus" },

  // --- ATTENDANCE MODULE ---
  { name: "can_manage_attendance", displayName: "Can Manage Attendance", module: "attendance", description: "Mark and modify student attendance" },
  { name: "can_view_attendance_reports", displayName: "Can View Attendance Reports", module: "attendance", description: "View attendance analytics and reports" },

  // --- EXAMINATION MODULE ---
  { name: "can_manage_exams", displayName: "Can Manage Exams", module: "examination", description: "Create, edit, and delete examinations" },
  { name: "can_enter_marks", displayName: "Can Enter Marks", module: "examination", description: "Enter and modify student exam marks" },
  { name: "can_view_marks", displayName: "Can View Marks", module: "examination", description: "View student marks and scores" },
  { name: "can_generate_terminal_reports", displayName: "Can Generate Terminal Reports", module: "examination", description: "Generate and print terminal/progress reports" },
  { name: "can_view_broadsheet", displayName: "Can View Broadsheet", module: "examination", description: "View class-wide broasheet results" },
  { name: "can_manage_online_exams", displayName: "Can Manage Online Exams", module: "examination", description: "Create and manage online examinations" },
  { name: "can_manage_portfolio", displayName: "Can Manage Portfolio", module: "examination", description: "Create and manage student portfolios" },

  // --- FINANCE MODULE ---
  { name: "can_bill_students", displayName: "Can Bill Students", module: "finance", description: "Create and manage student invoices/bills" },
  { name: "can_view_invoices", displayName: "Can View Invoices", module: "finance", description: "View all invoices" },
  { name: "can_edit_invoices", displayName: "Can Edit Invoices", module: "finance", description: "Modify existing invoices" },
  { name: "can_delete_invoices", displayName: "Can Delete Invoices", module: "finance", description: "Remove invoices" },
  { name: "can_receive_payment", displayName: "Can Receive Payment", module: "finance", description: "Process and record student payments" },
  { name: "can_view_payments", displayName: "Can View Payments", module: "finance", description: "View all payment records" },
  { name: "can_approve_payments", displayName: "Can Approve Payments", module: "finance", description: "Approve pending payments" },
  { name: "can_enter_expenses", displayName: "Can Enter Expenses", module: "finance", description: "Record school expenses" },
  { name: "can_view_expenses", displayName: "Can View Expenses", module: "finance", description: "View expense records" },
  { name: "can_view_financial_reports", displayName: "Can View & Print Financial Reports", module: "finance", description: "Access all financial reports and analytics" },
  { name: "can_manage_bill_categories", displayName: "Can Manage Bill Categories", module: "finance", description: "Create and manage invoice/bill categories" },
  { name: "can_manage_bill_items", displayName: "Can Manage Bill Items", module: "finance", description: "Create and manage individual bill items" },
  { name: "can_receive_daily_fees", displayName: "Can Receive Feeding & Classes Fees", module: "finance", description: "Collect daily feeding and class fees" },
  { name: "can_manage_daily_fee_rates", displayName: "Can Manage Daily Fee Rates", module: "finance", description: "Configure daily fee pricing per class" },
  { name: "can_view_daily_fee_reports", displayName: "Can View Daily Fee Reports", module: "finance", description: "View daily fee collection reports" },
  { name: "can_reconcile_daily_fees", displayName: "Can Reconcile Daily Fees", module: "finance", description: "Reconcile daily fee collections" },
  { name: "can_manage_bank_accounts", displayName: "Can Manage Bank Accounts", module: "finance", description: "Configure school bank accounts" },
  { name: "can_manage_chart_of_accounts", displayName: "Can Manage Chart of Accounts", module: "finance", description: "Configure the chart of accounts" },
  { name: "can_manage_journal_entries", displayName: "Can Manage Journal Entries", module: "finance", description: "Create and manage journal entries" },
  { name: "can_manage_discounts", displayName: "Can Manage Discounts", module: "finance", description: "Create and manage discount profiles and categories" },
  { name: "can_generate_receipts", displayName: "Can Generate Receipts", module: "finance", description: "Generate payment receipts" },
  { name: "can_view_unified_financial_dashboard", displayName: "Can View Unified Financial Dashboard", module: "finance", description: "Access the unified financial dashboard" },

  // --- COMMUNICATION MODULE ---
  { name: "can_send_sms", displayName: "Can Send SMS", module: "communication", description: "Send SMS messages to parents and students" },
  { name: "can_manage_notices", displayName: "Can Manage Notices", module: "communication", description: "Create, edit, and delete school notices" },
  { name: "can_send_messages", displayName: "Can Send Messages", module: "communication", description: "Send direct messages to parents, students, or teachers" },
  { name: "can_manage_notifications", displayName: "Can Manage Notifications", module: "communication", description: "Configure system notifications" },

  // --- TRANSPORT MODULE ---
  { name: "can_manage_transport", displayName: "Can Manage Transport", module: "transport", description: "Create and manage transport routes" },
  { name: "can_assign_transport_students", displayName: "Can Assign Transport Students", module: "transport", description: "Assign students to transport routes" },
  { name: "can_view_transport_reports", displayName: "Can View Transport Reports", module: "transport", description: "View transport usage and fare reports" },
  { name: "can_mark_boarding_attendance", displayName: "Can Mark Boarding Attendance", module: "transport", description: "Mark student boarding/deboarding on buses" },

  // --- LIBRARY MODULE ---
  { name: "can_manage_books", displayName: "Can Manage Books", module: "library", description: "Add, edit, and delete library books" },
  { name: "can_issue_books", displayName: "Can Issue Books", module: "library", description: "Issue books to students" },
  { name: "can_receive_books", displayName: "Can Receive Books", module: "library", description: "Process book returns" },
  { name: "can_request_books", displayName: "Can Request Books", module: "library", description: "Submit book requests (students/parents)" },

  // --- INVENTORY MODULE ---
  { name: "can_manage_inventory", displayName: "Can Manage Inventory", module: "inventory", description: "Manage inventory products and categories" },
  { name: "can_sell_inventory", displayName: "Can Sell Inventory", module: "inventory", description: "Process inventory sales to students" },
  { name: "can_view_inventory_reports", displayName: "Can View Inventory Reports", module: "inventory", description: "View inventory stock and sales reports" },

  // --- BOARDING MODULE ---
  { name: "can_manage_boarding", displayName: "Can Manage Boarding", module: "boarding", description: "Manage boarding houses and dormitories" },
  { name: "can_assign_boarding_students", displayName: "Can Assign Boarding Students", module: "boarding", description: "Assign students to dormitories" },

  // --- SETTINGS MODULE ---
  { name: "can_manage_settings", displayName: "Can Manage Settings", module: "settings", description: "Modify system settings and configurations" },
  { name: "can_manage_roles_permissions", displayName: "Can Manage Roles & Permissions", module: "settings", description: "Create, edit, and delete roles and assign permissions" },
  { name: "can_manage_frontend_cms", displayName: "Can Manage Frontend CMS", module: "settings", description: "Manage the public-facing school website content" },
  { name: "can_manage_departments", displayName: "Can Manage Departments", module: "settings", description: "Create and manage school departments" },
  { name: "can_manage_designations", displayName: "Can Manage Designations", module: "settings", description: "Create and manage staff designations" },
  { name: "can_manage_payroll", displayName: "Can Manage Payroll", module: "settings", description: "Process and manage employee payroll" },
  { name: "can_manage_employees", displayName: "Can Manage Employees", module: "settings", description: "Create, edit, and delete employee records" },

  // --- REPORTS MODULE ---
  { name: "can_view_academic_reports", displayName: "Can View Academic Reports", module: "reports", description: "Access academic performance reports" },
  { name: "can_export_data", displayName: "Can Export Data", module: "reports", description: "Export data to CSV/Excel" },
  { name: "can_print_reports", displayName: "Can Print Reports", module: "reports", description: "Print various system reports" },

  // --- STUDENT SELF-SERVICE ---
  { name: "can_view_own_results", displayName: "Can View Own Results", module: "self_service", description: "Students can view their own exam results" },
  { name: "can_view_own_invoices", displayName: "Can View Own Invoices", module: "self_service", description: "Students can view their own invoices" },
  { name: "can_view_own_attendance", displayName: "Can View Own Attendance", module: "self_service", description: "Students can view their own attendance" },
  { name: "can_view_own_routine", displayName: "Can View Own Routine", module: "self_service", description: "Students can view their class routine" },

  // --- PARENT SELF-SERVICE ---
  { name: "can_view_children_results", displayName: "Can View Children's Results", module: "self_service", description: "Parents can view their children's results" },
  { name: "can_view_children_attendance", displayName: "Can View Children's Attendance", module: "self_service", description: "Parents can view their children's attendance" },
  { name: "can_make_payments", displayName: "Can Make Payments", module: "self_service", description: "Parents can make fee payments online" },
  { name: "can_view_children_invoices", displayName: "Can View Children's Invoices", module: "self_service", description: "Parents can view their children's invoices" },
];

// ============================================================
// ROLE-PERMISSION MAPPINGS
// ============================================================
// Each key is a role slug, value is array of permission names that should be GRANTED (isGranted = true)
const rolePermissionMappings: Record<string, string[]> = {
  "super-admin": [
    // ALL permissions for super admin
    ...permissions.map(p => p.name),
  ],

  "admin": [
    // Users
    "can_view_admins_list",
    "can_create_admins",
    "can_edit_admins",
    "can_view_teachers_list",
    "can_create_teachers",
    "can_edit_teachers",
    "can_delete_teachers",
    "can_view_parents_list",
    "can_create_parents",
    "can_edit_parents",
    "can_delete_parents",
    "can_admit_students",
    "can_view_students_list",
    "can_edit_students",
    "can_delete_students",

    // Academics
    "can_manage_classes",
    "can_manage_sections",
    "can_manage_subjects",
    "can_manage_class_routine",
    "can_view_class_routine",
    "can_manage_grades",
    "can_manage_syllabus",

    // Attendance
    "can_manage_attendance",
    "can_view_attendance_reports",

    // Examination
    "can_manage_exams",
    "can_enter_marks",
    "can_view_marks",
    "can_generate_terminal_reports",
    "can_view_broadsheet",
    "can_manage_online_exams",
    "can_manage_portfolio",

    // Finance (matching CI3 admin level 2)
    "can_bill_students",
    "can_view_invoices",
    "can_edit_invoices",
    "can_delete_invoices",
    "can_receive_payment",
    "can_view_payments",
    "can_approve_payments",
    "can_enter_expenses",
    "can_view_expenses",
    "can_view_financial_reports",
    "can_manage_bill_categories",
    "can_manage_bill_items",
    "can_receive_daily_fees",
    "can_manage_daily_fee_rates",
    "can_view_daily_fee_reports",
    "can_reconcile_daily_fees",
    "can_manage_bank_accounts",
    "can_manage_discounts",
    "can_generate_receipts",
    "can_view_unified_financial_dashboard",

    // Communication
    "can_send_sms",
    "can_manage_notices",
    "can_send_messages",
    "can_manage_notifications",

    // Transport
    "can_manage_transport",
    "can_assign_transport_students",
    "can_view_transport_reports",
    "can_mark_boarding_attendance",

    // Library
    "can_manage_books",
    "can_issue_books",
    "can_receive_books",

    // Inventory
    "can_manage_inventory",
    "can_sell_inventory",
    "can_view_inventory_reports",

    // Boarding
    "can_manage_boarding",
    "can_assign_boarding_students",

    // Settings
    "can_manage_settings",
    "can_manage_departments",
    "can_manage_designations",
    "can_manage_payroll",
    "can_manage_employees",
    "can_manage_frontend_cms",

    // Reports
    "can_view_academic_reports",
    "can_export_data",
    "can_print_reports",
  ],

  "accountant": [
    // Finance
    "can_bill_students",
    "can_view_invoices",
    "can_edit_invoices",
    "can_receive_payment",
    "can_view_payments",
    "can_approve_payments",
    "can_enter_expenses",
    "can_view_expenses",
    "can_view_financial_reports",
    "can_manage_bill_categories",
    "can_manage_bill_items",
    "can_receive_daily_fees",
    "can_manage_daily_fee_rates",
    "can_view_daily_fee_reports",
    "can_reconcile_daily_fees",
    "can_manage_bank_accounts",
    "can_manage_chart_of_accounts",
    "can_manage_journal_entries",
    "can_manage_discounts",
    "can_generate_receipts",
    "can_view_unified_financial_dashboard",

    // Users (limited)
    "can_view_students_list",
    "can_view_parents_list",

    // Reports
    "can_export_data",
    "can_print_reports",
  ],

  "cashier": [
    // Finance (limited)
    "can_view_invoices",
    "can_receive_payment",
    "can_view_payments",
    "can_receive_daily_fees",
    "can_view_daily_fee_reports",
    "can_generate_receipts",
    "can_sell_inventory",

    // Users (limited)
    "can_view_students_list",
  ],

  "conductor": [
    // Transport
    "can_mark_boarding_attendance",
    "can_view_transport_reports",

    // Daily fees (for transport fares)
    "can_receive_daily_fees",

    // Users (limited)
    "can_view_students_list",
  ],

  "teacher": [
    // Academics
    "can_view_class_routine",
    "can_view_marks",

    // Attendance
    "can_manage_attendance",

    // Examination
    "can_enter_marks",
    "can_view_marks",

    // Finance (limited - daily fee collection as in CI3)
    "can_receive_daily_fees",

    // Self-service
    "can_view_own_results",
  ],

  "student": [
    // Self-service
    "can_view_own_results",
    "can_view_own_invoices",
    "can_view_own_attendance",
    "can_view_own_routine",
    "can_request_books",
  ],

  "parent": [
    // Parent self-service
    "can_view_children_results",
    "can_view_children_attendance",
    "can_make_payments",
    "can_view_children_invoices",
  ],

  "librarian": [
    // Library
    "can_manage_books",
    "can_issue_books",
    "can_receive_books",

    // Users (limited)
    "can_view_students_list",
  ],

  "receptionist": [
    // Users
    "can_view_students_list",
    "can_admit_students",
    "can_view_parents_list",
    "can_view_teachers_list",

    // Attendance
    "can_manage_attendance",
  ],
};

async function main() {
  console.log("🔐 Seeding RBAC data...\n");

  // ---- Seed Roles ----
  console.log("📋 Seeding roles...");
  const createdRoles: Record<string, number> = {};
  for (const role of roles) {
    const created = await prisma.role.upsert({
      where: { slug: role.slug },
      update: {
        name: role.name,
        description: role.description,
        level: role.level,
        isDefault: role.isDefault,
      },
      create: role,
    });
    createdRoles[role.slug] = created.id;
    console.log(`  ✅ ${role.name} (level ${role.level})`);
  }
  console.log(`  Created/updated ${roles.length} roles\n`);

  // ---- Seed Permissions ----
  console.log("🔑 Seeding permissions...");
  const createdPermissions: Record<string, number> = {};
  const modules = [...new Set(permissions.map(p => p.module))];
  let count = 0;
  for (const perm of permissions) {
    const created = await prisma.permission.upsert({
      where: { name: perm.name },
      update: {
        displayName: perm.displayName,
        module: perm.module,
        description: perm.description,
      },
      create: perm,
    });
    createdPermissions[perm.name] = created.id;
    count++;
  }
  console.log(`  ✅ Created/updated ${count} permissions across ${modules.length} modules`);
  for (const mod of modules) {
    const modPerms = permissions.filter(p => p.module === mod);
    console.log(`     ${mod}: ${modPerms.length} permissions`);
  }
  console.log();

  // ---- Seed Role-Permission Mappings ----
  console.log("🔗 Seeding role-permission mappings...");
  let mappingCount = 0;
  for (const [roleSlug, permNames] of Object.entries(rolePermissionMappings)) {
    const roleId = createdRoles[roleSlug];
    if (!roleId) {
      console.log(`  ⚠️ Role not found: ${roleSlug}`);
      continue;
    }

    // Get all permission IDs
    for (const permName of permNames) {
      const permissionId = createdPermissions[permName];
      if (!permissionId) {
        console.log(`  ⚠️ Permission not found: ${permName}`);
        continue;
      }

      // Upsert the role-permission mapping
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: { roleId, permissionId },
        },
        update: { isGranted: true },
        create: { roleId, permissionId, isGranted: true },
      });
      mappingCount++;
    }

    // Also create entries for permissions NOT in the list (isGranted = false)
    const grantedPermIds = new Set(
      permNames
        .map(name => createdPermissions[name])
        .filter((id): id is number => id !== undefined)
    );

    const allPermIds = Object.values(createdPermissions);
    const ungrantedPermIds = allPermIds.filter(id => !grantedPermIds.has(id));

    for (const permissionId of ungrantedPermIds) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: { roleId, permissionId },
        },
        update: { isGranted: false },
        create: { roleId, permissionId, isGranted: false },
      });
      mappingCount++;
    }

    const roleInfo = roles.find(r => r.slug === roleSlug);
    console.log(`  ✅ ${roleInfo?.name}: ${permNames.length} granted permissions`);
  }
  console.log(`  Total: ${mappingCount} role-permission mappings\n`);

  // ---- Summary ----
  console.log("📊 RBAC Seed Summary:");
  console.log(`  Roles: ${roles.length}`);
  console.log(`  Permissions: ${permissions.length}`);
  console.log(`  Role-Permission Mappings: ${mappingCount}`);
  console.log("\n✅ RBAC seed completed successfully!\n");
}

main()
  .catch((e) => {
    console.error("❌ RBAC seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
