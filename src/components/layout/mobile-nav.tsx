"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  Receipt,
  MoreHorizontal,
} from "lucide-react";
import { getMenuByRole } from "@/config/menu";
import type { UserRole } from "@/lib/auth";

interface MobileNavProps {
  role: UserRole;
}

export function MobileNav({ role }: MobileNavProps) {
  const pathname = usePathname();
  const menus = getMenuByRole(role);

  // Get the first 4 menu items for the bottom nav
  const allItems = menus.flatMap((section) => section.items);
  const navItems = allItems.slice(0, 4);
  const hasMore = allItems.length > 4;

  const defaultNavItems = [
    { label: "Dashboard", href: allItems[0]?.href || "/dashboard", icon: LayoutDashboard },
    { label: "Students", href: allItems[1]?.href || "#", icon: Users },
    { label: "Attendance", href: allItems[2]?.href || "#", icon: ClipboardList },
    { label: "Fees", href: allItems[3]?.href || "#", icon: Receipt },
  ];

  const finalNavItems = navItems.length >= 4 ? navItems : defaultNavItems;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-white border-t border-slate-200 safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {finalNavItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 px-3 py-1.5 rounded-lg min-w-[60px] transition-colors",
                isActive
                  ? "text-emerald-700"
                  : "text-slate-400 active:text-slate-600"
              )}
            >
              <Icon className={cn("w-5 h-5", isActive && "text-emerald-600")} />
              <span className="text-[10px] font-medium leading-tight text-center">
                {item.label}
              </span>
              {isActive && (
                <div className="w-1 h-1 bg-emerald-600 rounded-full mt-0.5" />
              )}
            </Link>
          );
        })}
        {hasMore && (
          <button className="flex flex-col items-center justify-center gap-1 px-3 py-1.5 rounded-lg min-w-[60px] text-slate-400">
            <MoreHorizontal className="w-5 h-5" />
            <span className="text-[10px] font-medium">More</span>
          </button>
        )}
      </div>
    </nav>
  );
}
