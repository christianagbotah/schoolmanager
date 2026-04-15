"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import type { UserRole } from "@/lib/auth";
import { hasPermission as checkPermission, hasAnyPermission as checkAnyPermission } from "@/lib/permissions";

export function useAuth() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const user = session?.user ?? null;
  const role = (user?.role as UserRole) ?? null;
  const roleSlug = user?.roleSlug ?? null;
  const isAuthenticated = !!session;
  const isLoading = status === "loading";
  const permissions: string[] = (user?.permissions as string[]) ?? [];

  const isRole = (checkRole: UserRole | UserRole[]): boolean => {
    if (!role) return false;
    if (Array.isArray(checkRole)) {
      return checkRole.includes(role);
    }
    return role === checkRole;
  };

  const isAdmin = isRole("admin") || isRole("super-admin");
  const isTeacher = isRole("teacher");
  const isStudent = isRole("student");
  const isParent = isRole("parent");
  const isAccountant = isRole("accountant");
  const isLibrarian = isRole("librarian");
  const isSuperAdmin = isRole("super-admin");

  const hasPermission = (permissionName: string): boolean => {
    return checkPermission(permissions, permissionName);
  };

  const hasAnyPermission = (requiredPermissions: string[]): boolean => {
    return checkAnyPermission(permissions, requiredPermissions);
  };

  const hasRole = (requiredRoles: UserRole[]): boolean => {
    return isRole(requiredRoles);
  };

  const logout = async (redirectTo: string = "/login") => {
    await signOut({ redirect: false });
    router.push(redirectTo);
    router.refresh();
  };

  const getDashboardPath = (): string => {
    // Unified dashboard for all roles
    return role ? "/dashboard" : "/login";
  };

  return {
    user,
    role,
    roleSlug,
    isAuthenticated,
    isLoading,
    permissions,
    isRole,
    isAdmin,
    isTeacher,
    isStudent,
    isParent,
    isAccountant,
    isLibrarian,
    isSuperAdmin,
    hasPermission,
    hasAnyPermission,
    hasRole,
    logout,
    getDashboardPath,
    session,
  };
}
