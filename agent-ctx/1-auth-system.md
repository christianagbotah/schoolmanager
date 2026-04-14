# Task 1: Auth & Authorization System for School Manager

## Summary

Built a comprehensive authentication and authorization system for a Next.js 16 school management system migrated from CodeIgniter 3. The system supports 6 user roles with JWT-based sessions.

## Files Created/Modified

### Core Auth System
- **`src/lib/auth.ts`** - NextAuth.js v4 configuration with CredentialsProvider. Authenticates against 6 database tables (admin, teacher, student, parent, accountant, librarian). Supports login by email or username (students). Includes account status validation.
- **`src/app/api/auth/[...nextauth]/route.ts`** - NextAuth API route handler
- **`src/middleware.ts`** - Route protection middleware with role-based access control
- **`src/types/next-auth.d.ts`** - TypeScript type augmentations for NextAuth session/JWT

### Login Page
- **`src/app/login/page.tsx`** - Modern mobile-first login page with:
  - Split layout (branding left, form right) on desktop
  - Full-width form on mobile
  - Email/username + password fields with icons
  - Quick-access demo account buttons for all 6 roles
  - Loading states, error messages
  - Emerald green school branding theme

### Auth Hooks
- **`src/hooks/use-auth.ts`** - Client-side auth hook wrapping useSession with:
  - Role checking helpers (isAdmin, isTeacher, etc.)
  - Permission checking
  - Logout function
  - Dashboard path resolution

### Layout Components
- **`src/components/layout/sidebar.tsx`** - Collapsible sidebar with role-based menu items, Lucide icons, tooltips
- **`src/components/layout/header.tsx`** - Top bar with hamburger menu, school name, year/term selector, notifications, user dropdown
- **`src/components/layout/mobile-nav.tsx`** - Bottom navigation bar for mobile (5 key items)
- **`src/components/layout/dashboard-layout.tsx`** - Wrapper combining sidebar + header + main content

### Configuration
- **`src/config/menu.ts`** - Role-based menu definitions for all 6 roles with icons
- **`src/components/providers/auth-provider.tsx`** - SessionProvider wrapper

### Database & Seed
- **`prisma/seed.ts`** - Seed script creating demo users, classes, subjects, sections, enrollments
- **`.env`** / **`.env.local`** - Environment configuration with NEXTAUTH_SECRET

## Database Schema Note
The existing Prisma schema (from CodeIgniter migration) was preserved. The auth system adapts to the existing column naming convention (`active_status`, `admin_id`, `student_code`, etc.).

## Demo Accounts (password: password123)
- Admin: admin@school.com
- Teacher: teacher@school.com
- Student: student@school.com (or username: student)
- Parent: parent@school.com
- Accountant: accountant@school.com
- Librarian: librarian@school.com
