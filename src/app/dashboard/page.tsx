"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

/**
 * Unified Dashboard - Routes to the appropriate role-specific dashboard
 * 
 * This page acts as a central entry point for all authenticated users.
 * It detects the user's role and renders the corresponding dashboard component.
 * 
 * Role mapping:
 * - admin / super-admin → /admin (AdminDashboard)
 * - teacher → /teacher (TeacherDashboard)
 * - student → /student (StudentDashboard)
 * - parent → /parent (ParentDashboard)
 * - accountant → /accountant (AccountantDashboard)
 * - librarian → /librarian (LibrarianDashboard)
 */

export default function UnifiedDashboard() {
  const { role, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading || !isAuthenticated || !role) return;

    // Map roles to their dashboard routes
    const roleDashboardMap: Record<string, string> = {
      "super-admin": "/admin",
      admin: "/admin",
      teacher: "/teacher",
      student: "/student",
      parent: "/parent",
      accountant: "/accountant",
      librarian: "/librarian",
      cashier: "/accountant",
      conductor: "/admin",
      receptionist: "/admin",
    };

    const targetPath = roleDashboardMap[role] || "/login";
    
    // Use replace to not leave /dashboard in browser history
    router.replace(targetPath);
  }, [role, isLoading, isAuthenticated, router]);

  // Show loading state while determining the role
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-[#0a0069]" />
        <p className="text-sm text-slate-500">Loading your dashboard...</p>
      </div>
    </div>
  );
}
