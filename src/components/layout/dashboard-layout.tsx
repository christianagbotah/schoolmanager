"use client";

import { useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { MobileNav } from "./mobile-nav";
import { useAuth } from "@/hooks/use-auth";

interface DashboardLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function DashboardLayout({ children, className }: DashboardLayoutProps) {
  const { role, isLoading } = useAuth();
  const pathname = usePathname();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const closeMobileSidebar = useCallback(() => {
    setMobileSidebarOpen(false);
  }, []);

  // Close mobile sidebar on route change - handled via key prop
  const prevPathname = useState(pathname)[0];
  const hasPathChanged = prevPathname !== pathname;

  if (isLoading || !role) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-slate-50" key={pathname}>
      {/* Desktop Sidebar */}
      <div className="hidden lg:block flex-shrink-0">
        <Sidebar
          role={role}
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileSidebarOpen && !hasPathChanged && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={closeMobileSidebar}
          />

          {/* Sidebar */}
          <div className="absolute inset-y-0 left-0 w-64 z-50">
            <div className="absolute top-3 right-3 z-10">
              <button
                onClick={closeMobileSidebar}
                className="p-1.5 rounded-lg bg-white/90 text-slate-600 shadow-sm hover:bg-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <Sidebar
              role={role}
              collapsed={false}
              onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
              onCloseMobile={closeMobileSidebar}
            />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header onMenuClick={() => setMobileSidebarOpen(true)} />

        <main
          className={cn(
            "flex-1 p-4 lg:p-6 pb-24 lg:pb-6",
            className
          )}
        >
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNav role={role} />
    </div>
  );
}
