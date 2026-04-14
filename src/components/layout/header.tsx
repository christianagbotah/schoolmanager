"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Menu,
  Bell,
  ChevronDown,
  LogOut,
  Settings,
  User,
  LayoutGrid,
  Search,
  X,
  FileText,
  CreditCard,
  DollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";
import { roleLabels, roleColors } from "@/config/menu";
import { usePathname } from "next/navigation";
import { BackButton } from "./back-button";
import type { UserRole } from "@/lib/auth";

interface HeaderProps {
  onMenuClick: () => void;
  onMetroToggle: () => void;
}

export function Header({ onMenuClick, onMetroToggle }: HeaderProps) {
  const { user, role, logout } = useAuth();
  const pathname = usePathname();
  const [notifications] = useState(3);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

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

  // Auto-close search on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && searchOpen) {
        setSearchOpen(false);
        setSearchQuery("");
      }
      // Ctrl/Cmd+K to open search
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
        setTimeout(() => searchInputRef.current?.focus(), 100);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [searchOpen]);

  // Focus search input when opened
  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 150);
    }
  }, [searchOpen]);

  const handleSearchSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (searchQuery.trim()) {
        // Navigate to students page with search query
        const basePath = role === "admin" ? "/admin/students" : `/${role}`;
        window.location.href = `${basePath}?search=${encodeURIComponent(searchQuery.trim())}`;
        setSearchOpen(false);
        setSearchQuery("");
      }
    },
    [searchQuery, role]
  );

  return (
    <header className="sticky top-0 z-30 bg-[#0a0069] border-b-4 border-red-500">
      <div className="flex items-center justify-between h-14 md:h-16 px-3 md:px-6">
        {/* Left Section */}
        <div className="flex items-center gap-2 md:gap-3 min-w-0">
          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden h-10 w-10 text-white hover:bg-white/10 hover:text-white flex-shrink-0"
            onClick={onMenuClick}
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </Button>

          {/* Back Button (deep navigation) */}
          <BackButton className="text-white/80 hover:text-white hover:bg-white/10" label="Back" showLabelMobile={false} />

          {/* School Name - adaptive sizing */}
          <h1 className="text-white font-extrabold text-sm sm:text-lg md:text-2xl lg:text-4xl truncate">
            School Manager
          </h1>

          {/* Metro Menu Trigger - hidden on mobile */}
          <button
            onClick={onMetroToggle}
            className="hidden md:flex w-10 h-10 md:w-[60px] md:h-[60px] bg-white/10 backdrop-blur-sm rounded-lg items-center justify-center text-white hover:bg-white/20 transition-colors flex-shrink-0"
            aria-label="Open start menu"
          >
            <LayoutGrid className="w-5 h-5 md:w-7 md:h-7" />
          </button>
        </div>

        {/* Center: Search (desktop) */}
        <div className="hidden lg:flex items-center flex-1 max-w-md mx-6">
          <form onSubmit={handleSearchSubmit} className="w-full relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search students, teachers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 bg-white/10 border border-white/20 rounded-lg pl-10 pr-16 text-sm text-white placeholder-white/50 outline-none focus:ring-1 focus:ring-white/30 focus:bg-white/15 transition-all"
            />
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-white/40 bg-white/10 px-1.5 py-0.5 rounded border border-white/10 font-mono">
              ⌘K
            </kbd>
          </form>
        </div>

        {/* Center: Quick Actions (desktop xl) */}
        <div className="hidden xl:flex items-center gap-2">
          <Button
            size="sm"
            className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg px-4 py-2 text-xs font-semibold shadow-md active:scale-95 transition-transform"
            onClick={() => {}}
          >
            <FileText className="w-4 h-4 mr-1.5" />
            Drive List
          </Button>
          <Button
            size="sm"
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg px-4 py-2 text-xs font-semibold shadow-md active:scale-95 transition-transform"
            onClick={() => {}}
          >
            <CreditCard className="w-4 h-4 mr-1.5" />
            Billing
          </Button>
          <Button
            size="sm"
            className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg px-4 py-2 text-xs font-semibold shadow-md active:scale-95 transition-transform"
            onClick={() => {}}
          >
            <DollarSign className="w-4 h-4 mr-1.5" />
            Take Payment
          </Button>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-1.5 md:gap-3">
          {/* Mobile Search Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden h-10 w-10 text-white hover:bg-white/10 hover:text-white"
            onClick={() => setSearchOpen(true)}
            aria-label="Search"
          >
            <Search className="w-5 h-5" />
          </Button>

          {/* Year/Term Selectors (desktop/tablet) */}
          <div className="hidden md:flex items-center gap-2">
            <Select defaultValue="2024-2025">
              <SelectTrigger className="w-[120px] md:w-[150px] h-9 text-xs bg-cyan-600 border-cyan-600 text-white hover:bg-cyan-700 rounded-lg">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2024-2025">2024-2025</SelectItem>
                <SelectItem value="2023-2024">2023-2024</SelectItem>
              </SelectContent>
            </Select>
            <Select defaultValue="term-3">
              <SelectTrigger className="w-[90px] md:w-[110px] h-9 text-xs bg-cyan-600 border-cyan-600 text-white hover:bg-cyan-700 rounded-lg">
                <SelectValue placeholder="Term" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="term-1">Term 1</SelectItem>
                <SelectItem value="term-2">Term 2</SelectItem>
                <SelectItem value="term-3">Term 3</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Notification Bell */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="relative h-10 w-10 text-white hover:bg-white/10 hover:text-white"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5" />
                {notifications > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center animate-pulse min-w-[16px]">
                    {notifications}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel className="flex items-center justify-between">
                <span>Notifications</span>
                <Badge variant="secondary" className="text-xs">
                  {notifications} new
                </Badge>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="flex flex-col items-start gap-1 p-3 cursor-pointer">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full flex-shrink-0" />
                  <span className="text-sm font-medium">New attendance report</span>
                </div>
                <span className="text-xs text-slate-500 pl-4">
                  Class 3A attendance has been submitted
                </span>
                <span className="text-xs text-slate-400 pl-4">2 min ago</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex flex-col items-start gap-1 p-3 cursor-pointer">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full flex-shrink-0" />
                  <span className="text-sm font-medium">Fee payment received</span>
                </div>
                <span className="text-xs text-slate-500 pl-4">
                  Payment of GHS 500 from Parent Account
                </span>
                <span className="text-xs text-slate-400 pl-4">15 min ago</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex flex-col items-start gap-1 p-3 cursor-pointer">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full flex-shrink-0" />
                  <span className="text-sm font-medium">New student enrolled</span>
                </div>
                <span className="text-xs text-slate-500 pl-4">
                  A new student has been added to Basic 1A
                </span>
                <span className="text-xs text-slate-400 pl-4">1 hour ago</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-10 gap-2 px-2 lg:px-3 text-white hover:bg-white/10 hover:text-white"
              >
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-gradient-to-br from-blue-400 to-purple-500 text-white text-xs font-semibold">
                    {user?.name ? getInitials(user.name) : "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:flex flex-col items-start">
                  <span className="text-sm font-medium text-white leading-tight">
                    {user?.name || "User"}
                  </span>
                  <span
                    className={`text-[10px] font-medium px-1.5 py-0 rounded ${roleColor}`}
                  >
                    {role ? roleLabels[role as UserRole] : "User"}
                  </span>
                </div>
                <ChevronDown className="w-4 h-4 text-white/70 hidden md:block" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">
                    {user?.name || "User"}
                  </span>
                  <span className="text-xs text-slate-500">
                    {user?.email || ""}
                  </span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer">
                <User className="w-4 h-4 mr-2" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer text-red-600 focus:text-red-600"
                onClick={() => logout()}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Mobile Search Overlay */}
      {searchOpen && (
        <div className="lg:hidden absolute top-full left-0 right-0 bg-[#0a0069]/95 backdrop-blur-lg border-b border-white/10 p-3 animate-fade-in z-30">
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search students, teachers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-12 bg-white/10 border border-white/20 rounded-xl pl-10 pr-10 text-sm text-white placeholder-white/50 outline-none focus:ring-2 focus:ring-white/30 focus:bg-white/15 transition-all"
              autoComplete="off"
            />
            <button
              type="button"
              onClick={() => {
                setSearchOpen(false);
                setSearchQuery("");
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-white/50 hover:text-white rounded-full hover:bg-white/10 transition-colors"
              aria-label="Close search"
            >
              <X className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </header>
  );
}
