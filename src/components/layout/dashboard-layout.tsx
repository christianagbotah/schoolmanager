"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { MetroMenu } from "./metro-menu";
import { Footer } from "./footer";
import { useAuth } from "@/hooks/use-auth";

interface DashboardLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function DashboardLayout({ children, className }: DashboardLayoutProps) {
  const { role, isLoading, isAuthenticated } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [metroOpen, setMetroOpen] = useState(false);

  const closeMobileSidebar = useCallback(() => {
    setMobileSidebarOpen(false);
  }, []);

  // Redirect unauthenticated users to login
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      const loginUrl = `/login?callbackUrl=${encodeURIComponent(pathname)}`;
      router.replace(loginUrl);
    }
  }, [isLoading, isAuthenticated, pathname, router]);

  // Auto-open metro menu on root dashboard after 1 second
  const metroAutoOpened = useRef(false);
  useEffect(() => {
    if (pathname === "/" && !metroAutoOpened.current && !metroOpen) {
      metroAutoOpened.current = true;
      const timer = setTimeout(() => {
        setMetroOpen(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [pathname, metroOpen]);

  // Show loading spinner only while session is being checked (not forever)
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-500">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render dashboard content if not authenticated (redirect will happen)
  if (!isAuthenticated || !role) {
    return null;
  }

  return (
    <div className="min-h-screen flex bg-gray-50" key={pathname}>
      {/* Desktop Sidebar */}
      <Sidebar
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={closeMobileSidebar}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <Header
          onMenuClick={() => setMobileSidebarOpen(true)}
          onMetroToggle={() => setMetroOpen((prev) => !prev)}
        />

        {/* Content */}
        <main
          className={cn(
            "flex-1 p-4 pt-6 md:p-8 md:pt-8 lg:p-10 lg:pt-10",
            className
          )}
        >
          {children}
        </main>

        {/* Footer */}
        <Footer />
      </div>

      {/* Metro Menu Overlay */}
      <MetroMenu
        open={metroOpen}
        onClose={() => setMetroOpen(false)}
      />
    </div>
  );
}
