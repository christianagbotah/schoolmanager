# Task 4 — RBAC System Implementation

## Summary
Implemented a comprehensive Role-Based Access Control (RBAC) system for the Next.js school management project, replacing the hardcoded role-based approach with a flexible, database-driven permission system.

## Files Created

### 1. `/home/z/my-project/prisma/schema.prisma` (MODIFIED)
Added 4 new models to the existing schema without modifying any existing models:

- **`User`** — Unified user table for RBAC-based auth with `roleId` FK to Role
- **`Role`** — Defines roles with name, slug, description, hierarchy level, isDefault flag
- **`Permission`** — Defines individual permissions with name, displayName, module grouping
- **`RolePermission`** — Many-to-many join table with `isGranted` boolean flag

### 2. `/home/z/my-project/prisma/rbac-seed.ts` (NEW)
Comprehensive seed script creating:

- **10 Roles**: Super Admin, Admin, Accountant, Cashier, Conductor, Teacher, Student, Parent, Librarian, Receptionist
- **90 Permissions** across 13 modules:
  - `users` (17): view/create/edit/delete admins, teachers, parents, students; manage roles
  - `academics` (7): manage classes, sections, subjects, routine, grades, syllabus
  - `attendance` (2): manage attendance, view reports
  - `examination` (7): manage exams, enter/view marks, terminal reports, broadsheet, online exams, portfolio
  - `finance` (22): billing, invoices, payments, expenses, daily fees, bank accounts, chart of accounts, journal entries, discounts, receipts, unified dashboard
  - `communication` (4): SMS, notices, messages, notifications
  - `transport` (4): manage transport, assign students, reports, boarding attendance
  - `library` (4): manage books, issue/receive books, request books
  - `inventory` (3): manage inventory, sell, reports
  - `boarding` (2): manage boarding, assign students
  - `settings` (7): manage settings, roles/permissions, frontend CMS, departments, designations, payroll, employees
  - `reports` (3): academic reports, export data, print reports
  - `self_service` (8): view own results/invoices/attendance/routine, view children's results/attendance/invoices, make payments

- **901 Role-Permission Mappings** — Complete permission assignments for all roles, matching original CI3 patterns (e.g., Admin level 1 → Super Admin with all 90 permissions, Admin level 2 → 76 permissions, etc.)

### 3. `/home/z/my-project/src/lib/permissions.ts` (NEW)
Permission utility functions including:

- `hasPermission(userPermissions, permissionName)` — Check single permission
- `hasAnyPermission(userPermissions, permissions)` — Check ANY from list
- `hasAllPermissions(userPermissions, permissions)` — Check ALL from list
- `filterMenuByPermissions(menuItems, userPermissions)` — Filter menus by permission with recursive child support
- `getUserPermissionNames(userId)` — DB query for unified User permissions
- `getLegacyUserPermissionNames(userType, userLevel)` — Bridge legacy multi-table auth to RBAC
- `PERMISSION_MODULES` — Module constants (users, academics, finance, etc.)
- `PERMISSIONS` — 80+ named permission constants for easy reference
- `CI3_PERMISSION_MAP` — Maps original CI3 permission strings to new slugs

### 4. API Routes (NEW)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/permissions` | GET | List all permissions grouped by module |
| `/api/roles` | GET | List all roles with permission counts |
| `/api/roles` | POST | Create new role |
| `/api/roles/[id]` | GET | Get role with full permission details |
| `/api/roles/[id]` | PUT | Update role metadata |
| `/api/roles/[id]` | DELETE | Delete role (prevents if users assigned) |
| `/api/roles/[id]/permissions` | GET | Get role permissions grouped by module |
| `/api/roles/[id]/permissions` | PUT | Bulk update role permission grants |
| `/api/users/me/permissions` | GET | Get current user's permissions |

All routes include proper error handling, validation, and type safety.

### 5. Files Modified

- **`src/lib/auth.ts`** — Updated NextAuth to:
  - Add new roles (super-admin, cashier, conductor, receptionist)
  - Detect admin level 1 vs 2+ for super-admin/admin distinction
  - Fetch permissions from RBAC system on login
  - Include `roleSlug` and `permissions[]` in JWT and session
  - Added `roleSlug` and `permissions` to AuthUser interface

- **`src/types/next-auth.d.ts`** — Extended NextAuth type declarations:
  - Added `roleSlug: string` and `permissions: string[]` to Session.user
  - Added same to JWT interface
  - Added same to User interface

- **`src/middleware.ts`** — Updated route protection:
  - Expanded `roleRoutes` to include all 10 roles
  - Super-admin accesses `/admin` routes
  - Cashier routes to `/accountant`, conductor/receptionist to `/admin`
  - Proper super-admin passthrough for all protected routes

- **`src/hooks/use-auth.ts`** — Enhanced auth hook:
  - Added `roleSlug`, `permissions` to return value
  - Added `isSuperAdmin` helper
  - Added `hasPermission(permissionName)` — check a single permission
  - Added `hasAnyPermission(permissions[])` — check ANY from list
  - Updated `getDashboardPath()` for all new roles

- **`src/config/menu.ts`** — Updated menu configuration:
  - Changed `Record<UserRole, ...>` to `Record<string, ...>` for flexibility
  - Added new roles to `getMenuByRole()`, `roleLabels`, `roleColors`

## Seed Results
```
Roles: 10
Permissions: 90
Role-Permission Mappings: 901
```

## Database Verification
- `npx prisma generate` — ✅ Success
- `npx prisma db push` — ✅ Database in sync
- `npx tsx prisma/rbac-seed.ts` — ✅ All data seeded

## Dev Server Compilation
- Next.js dev server starts successfully
- All new TypeScript files have zero type errors
- Pre-existing errors in other files are unrelated to this change
