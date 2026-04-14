"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { MetroMenu } from "./metro-menu";
import { BottomNav } from "./bottom-nav";
import { Footer } from "./footer";
import { useAuth } from "@/hooks/use-auth";
import { Skeleton } from "@/components/ui/skeleton";

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

  // Auto-open metro menu on root dashboard after 1 second (desktop only)
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

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        {/* Skeleton header */}
        <div className="h-14 md:h-16 bg-[#0a0069] border-b-4 border-red-500 flex items-center px-4 gap-4">
          <Skeleton className="h-10 w-10 rounded-lg bg-white/10" />
          <Skeleton className="h-6 w-32 rounded bg-white/10" />
          <div className="flex-1" />
          <Skeleton className="h-10 w-10 rounded-lg bg-white/10" />
          <Skeleton className="h-10 w-10 rounded-lg bg-white/10" />
        </div>
        {/* Skeleton content */}
        <div className="flex-1 p-4 md:p-8 space-y-4">
          <Skeleton className="h-8 w-64 rounded-lg" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-28 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    );
  }

  // Don't render dashboard content if not authenticated (redirect will happen)
  if (!isAuthenticated || !role) {
    return null;
  }

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Desktop & Tablet Sidebar */}
      <Sidebar
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={closeMobileSidebar}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Header */}
        <Header
          onMenuClick={() => setMobileSidebarOpen(true)}
          onMetroToggle={() => setMetroOpen((prev) => !prev)}
        />

        {/* Content with CSS-based page transition */}
        <main
          key={pathname}
          className={cn(
            "flex-1 p-4 pt-5 md:p-6 md:pt-8 lg:p-8 lg:pt-10",
            "animate-fade-in",
            className
          )}
        >
          {children}
        </main>

        {/* Footer - hidden on mobile to make room for bottom nav */}
        <div className="hidden md:block">
          <Footer />
        </div>

        {/* Bottom padding for mobile bottom nav */}
        <div className="md:hidden h-16 flex-shrink-0" />
      </div>

      {/* Bottom Navigation - mobile only */}
      <BottomNav />

      {/* Metro Menu Overlay */}
      <MetroMenu
        open={metroOpen}
        onClose={() => setMetroOpen(false)}
      />
    </div>
  );
}
