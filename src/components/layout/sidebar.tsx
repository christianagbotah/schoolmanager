"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { GraduationCap, ChevronLeft, ChevronRight } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  getMenuByRole,
  type MenuSection,
  type MenuItem,
} from "@/config/menu";
import type { UserRole } from "@/lib/auth";

interface SidebarProps {
  role: UserRole;
  collapsed: boolean;
  onToggle: () => void;
  onCloseMobile?: () => void;
  className?: string;
}

function MenuLink({
  item,
  pathname,
  collapsed,
  onClick,
}: {
  item: MenuItem;
  pathname: string;
  collapsed: boolean;
  onClick?: () => void;
}) {
  const isActive =
    pathname === item.href || pathname.startsWith(item.href + "/");
  const Icon = item.icon;

  const link = (
    <Link
      href={item.href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group",
        isActive
          ? "bg-emerald-50 text-emerald-700 shadow-sm"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
        collapsed && "justify-center px-2"
      )}
    >
      <Icon
        className={cn(
          "w-5 h-5 flex-shrink-0",
          isActive ? "text-emerald-600" : "text-slate-400 group-hover:text-slate-600"
        )}
      />
      {!collapsed && (
        <span className="truncate">{item.label}</span>
      )}
      {!collapsed && item.badge && (
        <span className="ml-auto bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
          {item.badge > 9 ? "9+" : item.badge}
        </span>
      )}
    </Link>
  );

  if (collapsed) {
    return (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>{link}</TooltipTrigger>
        <TooltipContent side="right" className="font-medium">
          {item.label}
          {item.badge && ` (${item.badge})`}
        </TooltipContent>
      </Tooltip>
    );
  }

  return link;
}

export function Sidebar({
  role,
  collapsed,
  onToggle,
  onCloseMobile,
  className,
}: SidebarProps) {
  const pathname = usePathname();
  const menus = getMenuByRole(role);


  return (
    <aside
      className={cn(
        "flex flex-col bg-white border-r border-slate-200 transition-all duration-300",
        collapsed ? "w-[68px]" : "w-64",
        className
      )}
    >
      {/* Logo */}
      <div
        className={cn(
          "flex items-center h-16 border-b border-slate-200 px-4 flex-shrink-0",
          collapsed && "justify-center px-2"
        )}
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-emerald-700 rounded-xl flex items-center justify-center flex-shrink-0">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <h1 className="text-sm font-bold text-slate-900 truncate">
                School Manager
              </h1>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 py-4 px-3">
        <nav className="space-y-6">
          {menus.map((section: MenuSection) => (
            <div key={section.title}>
              {!collapsed && (
                <h3 className="px-3 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  {section.title}
                </h3>
              )}
              {collapsed && (
                <div className="mx-auto mb-2 w-8 h-px bg-slate-200" />
              )}
              <div className="space-y-1">
                {section.items.map((item: MenuItem) => (
                  <MenuLink
                    key={item.href}
                    item={item}
                    pathname={pathname}
                    collapsed={collapsed}
                    onClick={onCloseMobile}
                  />
                ))}
              </div>
            </div>
          ))}
        </nav>
      </ScrollArea>

      {/* Collapse Toggle - desktop only */}
      <div className="hidden lg:flex items-center justify-center h-12 border-t border-slate-200">
        <button
          onClick={onToggle}
          className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <ChevronLeft className="w-5 h-5" />
          )}
        </button>
      </div>
    </aside>
  );
}
