"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  Menu,
  X,
  GraduationCap,
  LogOut,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  getMenuByRole,
  roleLabels,
  roleColors,
  type MenuSection,
  type MenuItem,
} from "@/config/menu";
import { filterMenuByPermissions } from "@/lib/permissions";
import { useAuth } from "@/hooks/use-auth";
import type { UserRole } from "@/lib/auth";

// ─── Constants ──────────────────────────────────────────────
const SIDEBAR_KEY = "school-manager-sidebar-collapsed";

interface SidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

// ─── SubMenuLink ────────────────────────────────────────────
function SubMenuLink({
  item,
  pathname,
  depth = 0,
  onClick,
}: {
  item: MenuItem;
  pathname: string;
  depth?: number;
  onClick?: () => void;
}) {
  const isActive =
    pathname === item.href || pathname.startsWith(item.href + "/");
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 py-2.5 pr-3 rounded-lg text-sm transition-all duration-150 min-h-[40px]",
        depth > 0 && "pl-12",
        depth === 0 && "pl-11",
        isActive
          ? "bg-blue-500/10 text-white font-medium"
          : "text-slate-400 hover:text-white hover:bg-white/5"
      )}
    >
      <Icon className="w-4 h-4 flex-shrink-0" />
      <span className="truncate">{item.label}</span>
    </Link>
  );
}

// ─── MenuItemComponent ──────────────────────────────────────
function MenuItemComponent({
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
  const hasChildren = item.children && item.children.length > 0;
  const isInChild = hasChildren && item.children
    ? item.children.some((c) => pathname === c.href || pathname.startsWith(c.href + "/"))
    : false;
  const [manuallyExpanded, setManuallyExpanded] = useState(false);
  const expanded = manuallyExpanded || isActive || isInChild;
  const Icon = item.icon;

  const toggleExpand = useCallback(
    (e: React.MouseEvent) => {
      if (hasChildren) {
        e.preventDefault();
        e.stopPropagation();
        setManuallyExpanded((prev) => !prev);
      }
    },
    [hasChildren]
  );

  const linkContent = (
    <button
      onClick={toggleExpand}
      className={cn(
        "flex items-center w-full gap-3 py-3 px-4 rounded-lg text-sm transition-all duration-150 group relative min-h-[44px]",
        collapsed && "justify-center px-2",
        isActive
          ? "bg-gradient-to-r from-blue-500/20 to-blue-600/10 font-semibold text-white"
          : "text-slate-300 hover:bg-blue-500/10 hover:text-white"
      )}
    >
      <Icon
        className={cn(
          "w-5 h-5 flex-shrink-0 transition-colors",
          isActive
            ? "text-blue-400"
            : "text-slate-400 group-hover:text-white"
        )}
      />
      {!collapsed && (
        <>
          <span className="truncate flex-1 text-left">{item.label}</span>
          {hasChildren && (
            <ChevronRight
              className={cn(
                "w-4 h-4 flex-shrink-0 text-slate-500 transition-transform duration-200",
                expanded && "rotate-90"
              )}
            />
          )}
        </>
      )}
    </button>
  );

  // Collapsed: show tooltip and flyout on hover
  if (collapsed) {
    return (
      <div className="relative group/sidebar-item">
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
          <TooltipContent side="right" className="font-medium">
            {item.label}
          </TooltipContent>
        </Tooltip>

        {/* Flyout for children when collapsed */}
        {hasChildren && expanded && (
          <div className="absolute left-full top-0 ml-2 z-50 hidden group-hover/sidebar-item:block">
            <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-xl p-3 min-w-[220px]">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400 px-3 mb-2">
                {item.label}
              </div>
              {item.children!.map((child) => (
                <SubMenuLink
                  key={child.href}
                  item={child}
                  pathname={pathname}
                  depth={0}
                  onClick={onClick}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      {!hasChildren ? (
        <Link href={item.href} onClick={onClick}>
          {linkContent}
        </Link>
      ) : (
        linkContent
      )}

      {/* Expanded sub-menu */}
      {hasChildren && expanded && !collapsed && (
        <div className="bg-black/20 rounded-lg mt-1 mb-1 py-2">
          {item.children!.map((child) => (
            <SubMenuLink
              key={child.href}
              item={child}
              pathname={pathname}
              depth={0}
              onClick={onClick}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── User Profile Card ──────────────────────────────────────
function UserProfileCard({ collapsed, onClick }: { collapsed: boolean; onClick?: () => void }) {
  const { user, role, logout } = useAuth();

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const roleColor = role
    ? roleColors[role as UserRole] || "bg-slate-100 text-slate-700"
    : "bg-slate-100 text-slate-700";

  if (collapsed) {
    return (
      <div className="flex flex-col items-center gap-2 py-3 px-2">
        <Avatar className="h-9 w-9">
          <AvatarFallback className="bg-gradient-to-br from-blue-400 to-purple-500 text-white text-xs font-semibold">
            {user?.name ? getInitials(user.name) : "U"}
          </AvatarFallback>
        </Avatar>
      </div>
    );
  }

  return (
    <div className="px-4 py-3 flex items-center gap-3 border-b border-white/10">
      <Avatar className="h-10 w-10 flex-shrink-0">
        <AvatarFallback className="bg-gradient-to-br from-blue-400 to-purple-500 text-white text-sm font-semibold">
          {user?.name ? getInitials(user.name) : "U"}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">
          {user?.name || "User"}
        </p>
        <span
          className={cn(
            "text-[10px] font-medium px-1.5 py-0.5 rounded inline-block mt-0.5",
            roleColor
          )}
        >
          {role ? roleLabels[role as UserRole] || role : "User"}
        </span>
      </div>
    </div>
  );
}

// ─── Sidebar ────────────────────────────────────────────────
export function Sidebar({
  collapsed: collapsedProp,
  onToggle,
  mobileOpen,
  onCloseMobile,
}: SidebarProps) {
  const { role, permissions, logout } = useAuth();
  const pathname = usePathname();
  const sidebarRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef(0);
  const isSwipeClose = useRef(false);

  // Internal collapsed state (persisted in localStorage)
  const [internalCollapsed, setInternalCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(SIDEBAR_KEY) === "true";
    }
    return false;
  });
  const [searchQuery, setSearchQuery] = useState("");

  const collapsed = collapsedProp ?? internalCollapsed;

  const toggleCollapse = useCallback(() => {
    const next = !collapsed;
    setInternalCollapsed(next);
    localStorage.setItem(SIDEBAR_KEY, String(next));
    onToggle?.();
  }, [collapsed, onToggle]);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && mobileOpen) {
        onCloseMobile?.();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [mobileOpen, onCloseMobile]);

  // Prevent body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  // Swipe to close on mobile
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    isSwipeClose.current = false;
  }, []);

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!sidebarRef.current) return;
      const diff = e.touches[0].clientX - touchStartX.current;
      if (diff > 60) {
        isSwipeClose.current = true;
      }
    },
    []
  );

  const handleTouchEnd = useCallback(() => {
    if (isSwipeClose.current) {
      onCloseMobile?.();
    }
    isSwipeClose.current = false;
  }, [onCloseMobile]);

  // Get filtered menus
  const rawMenus = role ? getMenuByRole(role) : [];
  const menus = filterMenuByPermissions(rawMenus, permissions);

  // Filter menus by search
  const filteredMenus = searchQuery.trim()
    ? menus
        .map((section) => ({
          ...section,
          items: section.items.filter((item) =>
            item.label.toLowerCase().includes(searchQuery.toLowerCase())
          ),
        }))
        .filter((section) => section.items.length > 0)
    : menus;

  const sidebarContent = (
    <div
      className={cn(
        "flex flex-col h-full bg-gradient-to-b from-slate-800 to-slate-900 transition-all duration-300 ease-in-out",
        collapsed ? "w-[72px]" : "w-[280px]"
      )}
    >
      {/* User Profile Card */}
      <UserProfileCard collapsed={collapsed} onClick={onCloseMobile} />

      {/* Logo Section */}
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-white/10 flex-shrink-0">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center flex-shrink-0">
          <GraduationCap className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <h1 className="text-sm font-bold text-white truncate">
              School Manager
            </h1>
            <p className="text-[10px] text-slate-400 truncate">
              Management System
            </p>
          </div>
        )}
      </div>

      {/* Search Bar */}
      {!collapsed && (
        <div className="px-4 pt-3 pb-1 flex-shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              type="text"
              placeholder="Search menu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/10 border border-white/20 text-white placeholder-white/40 rounded-lg px-4 py-2 pl-10 text-sm outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all min-h-[40px]"
            />
          </div>
        </div>
      )}

      {/* Navigation */}
      <ScrollArea className="flex-1 py-2">
        <nav className="space-y-1 px-2.5">
          {filteredMenus.map((section: MenuSection) => (
            <div key={section.title}>
              {!collapsed && (
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-4 pt-4 pb-2">
                  {section.title}
                </h3>
              )}
              {collapsed && (
                <Separator className="my-2 bg-white/10" />
              )}
              <div className="space-y-0.5">
                {section.items.map((item: MenuItem) => (
                  <MenuItemComponent
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

      {/* Bottom section: Collapse toggle + Logout */}
      <div className="flex-shrink-0 border-t border-white/10 p-2 space-y-1">
        {/* Collapse Toggle - desktop/tablet only */}
        <button
          onClick={toggleCollapse}
          className={cn(
            "hidden md:flex items-center justify-center w-full rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors",
            collapsed ? "h-10" : "gap-3 py-2.5 px-4 min-h-[40px]"
          )}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <>
              <ChevronLeft className="w-5 h-5" />
              <span className="text-sm">Collapse</span>
            </>
          )}
        </button>

        {/* Logout */}
        <button
          onClick={() => {
            onCloseMobile?.();
            logout();
          }}
          className={cn(
            "flex items-center justify-center w-full rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors",
            collapsed ? "h-10" : "gap-3 py-2.5 px-4 min-h-[44px]"
          )}
          aria-label="Sign out"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span className="text-sm">Sign Out</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop & Tablet sidebar */}
      <aside
        className={cn(
          "hidden md:flex flex-col h-screen sticky top-0 flex-shrink-0 transition-all duration-300 z-40",
          collapsed ? "w-[72px]" : "w-[280px]"
        )}
      >
        {sidebarContent}
      </aside>

      {/* Mobile drawer with swipe-to-close */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
            onClick={onCloseMobile}
          />
          {/* Sidebar drawer */}
          <div
            ref={sidebarRef}
            className="absolute inset-y-0 left-0 w-[280px] z-50 animate-slide-in-left"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <button
              onClick={onCloseMobile}
              className="absolute top-3 right-3 z-10 p-1.5 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
              aria-label="Close sidebar"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="h-full">{sidebarContent}</div>
          </div>
        </div>
      )}
    </>
  );
}
