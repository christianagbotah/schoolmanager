"use client";

import { useCallback, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Search,
  PlusCircle,
  Bell,
  User,
  GraduationCap,
  FileText,
  CreditCard,
  ClipboardList,
  BookOpen,
  BookCheck,
  DollarSign,
  Receipt,
  BarChart3,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getMenuByRole } from "@/config/menu";
import { useAuth } from "@/hooks/use-auth";
import type { UserRole } from "@/lib/auth";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: number;
}

interface BottomNavProps {
  /** Override notification count */
  notificationCount?: number;
  /** Custom items to show (overrides role-based items) */
  items?: NavItem[];
  /** Optional onQuickAction callback for FAB */
  onQuickAction?: () => void;
  className?: string;
}

// Role-based nav configuration
const ROLE_NAV_CONFIG: Record<string, Omit<NavItem, "badge">[]> = {
  admin: [
    { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { label: "Students", href: "/admin/students", icon: GraduationCap },
    { label: "Search", href: "/admin/students", icon: Search },
    { label: "Alerts", href: "/admin/notices", icon: Bell },
    { label: "Profile", href: "/admin/settings", icon: User },
  ],
  teacher: [
    { label: "Dashboard", href: "/teacher", icon: LayoutDashboard },
    { label: "Attendance", href: "/teacher/attendance", icon: ClipboardList },
    { label: "Marks", href: "/teacher/marks", icon: FileText },
    { label: "Alerts", href: "/teacher", icon: Bell },
    { label: "Profile", href: "/teacher/profile", icon: User },
  ],
  student: [
    { label: "Dashboard", href: "/student", icon: LayoutDashboard },
    { label: "Results", href: "/student/results", icon: FileText },
    { label: "Invoices", href: "/student/invoices", icon: Receipt },
    { label: "Alerts", href: "/student", icon: Bell },
    { label: "Profile", href: "/student/profile", icon: User },
  ],
  parent: [
    { label: "Dashboard", href: "/parent", icon: LayoutDashboard },
    { label: "Results", href: "/parent/results", icon: FileText },
    { label: "Payments", href: "/parent/payments", icon: CreditCard },
    { label: "Alerts", href: "/parent", icon: Bell },
    { label: "Profile", href: "/parent", icon: User },
  ],
  accountant: [
    { label: "Dashboard", href: "/accountant", icon: LayoutDashboard },
    { label: "Invoices", href: "/accountant/invoices", icon: Receipt },
    { label: "Payments", href: "/accountant/payments", icon: CreditCard },
    { label: "Alerts", href: "/accountant", icon: Bell },
    { label: "Profile", href: "/accountant", icon: User },
  ],
  librarian: [
    { label: "Dashboard", href: "/librarian", icon: LayoutDashboard },
    { label: "Books", href: "/librarian/books", icon: BookCheck },
    { label: "Requests", href: "/librarian/requests", icon: BookOpen },
    { label: "Alerts", href: "/librarian", icon: Bell },
    { label: "Profile", href: "/librarian", icon: User },
  ],
};

// Add touch ripple effect via CSS
function RippleButton({
  children,
  href,
  active,
  badge,
  onClick,
}: {
  children: React.ReactNode;
  href?: string;
  active: boolean;
  badge?: number;
  onClick?: () => void;
}) {
  const content = (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center gap-0.5 px-1 py-1.5 rounded-xl",
        "min-w-[52px] min-h-[52px] transition-all duration-200 ease-out",
        "active:scale-90",
        active
          ? "text-[#0a0069]"
          : "text-slate-400 active:text-slate-600"
      )}
    >
      {/* Active indicator dot */}
      {active && (
        <span className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-5 h-1 bg-[#0a0069] rounded-full" />
      )}
      {children}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="relative flex-shrink-0 flex-1 flex justify-center">
        {content}
        {badge !== undefined && badge > 0 && (
          <span className="absolute top-0 right-1/2 translate-x-3 min-w-[16px] h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-1">
            {badge > 9 ? "9+" : badge}
          </span>
        )}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="relative flex-shrink-0 flex-1 flex justify-center"
    >
      {content}
      {badge !== undefined && badge > 0 && (
        <span className="absolute top-0 right-1/2 translate-x-3 min-w-[16px] h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-1">
          {badge > 9 ? "9+" : badge}
        </span>
      )}
    </button>
  );
}

export function BottomNav({
  notificationCount = 3,
  items: customItems,
  onQuickAction,
  className,
}: BottomNavProps) {
  const pathname = usePathname();
  const { role } = useAuth();

  const navItems = useMemo<NavItem[]>(() => {
    if (customItems) return customItems;
    const roleKey = role || "admin";
    const baseItems = ROLE_NAV_CONFIG[roleKey] || ROLE_NAV_CONFIG.admin;
    return baseItems.map((item) => ({
      ...item,
      badge: item.label === "Alerts" ? notificationCount : undefined,
    }));
  }, [customItems, role, notificationCount]);

  const isActive = useCallback(
    (href: string) => {
      return pathname === href || pathname.startsWith(href + "/");
    },
    [pathname]
  );

  // Don't render on desktop
  return (
    <nav
      className={cn(
        "fixed bottom-0 left-0 right-0 z-40 md:hidden",
        "bg-white/95 backdrop-blur-lg border-t border-slate-200/80",
        "pb-[env(safe-area-inset-bottom,0px)]",
        className
      )}
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="flex items-end justify-around px-1 pt-1 max-w-lg mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);

          return (
            <RippleButton
              key={item.href + item.label}
              href={item.href}
              active={active}
              badge={item.badge}
            >
              <Icon
                className={cn(
                  "w-5 h-5 transition-transform duration-200",
                  active && "scale-110"
                )}
                strokeWidth={active ? 2.5 : 2}
              />
              <span
                className={cn(
                  "text-[10px] font-medium leading-tight",
                  active && "font-semibold"
                )}
              >
                {item.label}
              </span>
            </RippleButton>
          );
        })}
      </div>
    </nav>
  );
}
