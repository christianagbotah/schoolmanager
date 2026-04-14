"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import type { UserRole } from "@/lib/auth";

export function useAuth() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const user = session?.user ?? null;
  const role = (user?.role as UserRole) ?? null;
  const isAuthenticated = !!session;
  const isLoading = status === "loading";

  const isRole = (checkRole: UserRole | UserRole[]): boolean => {
    if (!role) return false;
    if (Array.isArray(checkRole)) {
      return checkRole.includes(role);
    }
    return role === checkRole;
  };

  const isAdmin = isRole("admin");
  const isTeacher = isRole("teacher");
  const isStudent = isRole("student");
  const isParent = isRole("parent");
  const isAccountant = isRole("accountant");
  const isLibrarian = isRole("librarian");

  const hasPermission = (requiredRoles: UserRole[]): boolean => {
    return isRole(requiredRoles);
  };

  const logout = async (redirectTo: string = "/login") => {
    await signOut({ redirect: false });
    router.push(redirectTo);
    router.refresh();
  };

  const getDashboardPath = (): string => {
    const dashboardPaths: Record<UserRole, string> = {
      admin: "/admin",
      teacher: "/teacher",
      student: "/student",
      parent: "/parent",
      accountant: "/accountant",
      librarian: "/librarian",
    };
    return role ? dashboardPaths[role] : "/login";
  };

  return {
    user,
    role,
    isAuthenticated,
    isLoading,
    isRole,
    isAdmin,
    isTeacher,
    isStudent,
    isParent,
    isAccountant,
    isLibrarian,
    hasPermission,
    logout,
    getDashboardPath,
    session,
  };
}
