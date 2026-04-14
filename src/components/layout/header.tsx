"use client";

import { useState, useRef, useEffect } from "react";
import {
  Menu,
  Bell,
  ChevronDown,
  LogOut,
  Settings,
  User,
  GraduationCap,
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
import type { UserRole } from "@/lib/auth";

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { user, role, logout } = useAuth();
  const [notifications] = useState(3);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const roleColor = role ? roleColors[role as UserRole] : "bg-slate-100 text-slate-700";

  return (
    <header className="sticky top-0 z-30 h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-6">
      {/* Left Section */}
      <div className="flex items-center gap-3">
        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden h-9 w-9"
          onClick={onMenuClick}
        >
          <Menu className="w-5 h-5" />
        </Button>

        {/* School Name - Mobile */}
        <div className="flex items-center gap-2 lg:hidden">
          <div className="w-8 h-8 bg-emerald-700 rounded-lg flex items-center justify-center">
            <GraduationCap className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm font-semibold text-slate-900">
            School Manager
          </span>
        </div>

        {/* Year/Term Selector - Desktop */}
        <div className="hidden lg:block">
          <Select defaultValue="2024-2025">
            <SelectTrigger className="w-[180px] h-9 text-sm">
              <SelectValue placeholder="Select year" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2024-2025">Academic Year 2024-2025</SelectItem>
              <SelectItem value="2023-2024">Academic Year 2023-2024</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="hidden lg:block ml-2">
          <Select defaultValue="term-3">
            <SelectTrigger className="w-[130px] h-9 text-sm">
              <SelectValue placeholder="Select term" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="term-1">Term 1</SelectItem>
              <SelectItem value="term-2">Term 2</SelectItem>
              <SelectItem value="term-3">Term 3</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-2">
        {/* Notification Bell */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative h-9 w-9"
            >
              <Bell className="w-5 h-5 text-slate-500" />
              {notifications > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full w-4.5 h-4.5 flex items-center justify-center min-w-[18px]">
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
              className="h-9 gap-2 px-2 lg:px-3"
            >
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-emerald-100 text-emerald-700 text-xs font-semibold">
                  {user?.name ? getInitials(user.name) : "U"}
                </AvatarFallback>
              </Avatar>
              <div className="hidden sm:flex flex-col items-start">
                <span className="text-sm font-medium text-slate-700 leading-tight">
                  {user?.name || "User"}
                </span>
                <span
                  className={`text-[10px] font-medium px-1.5 py-0 rounded ${roleColor}`}
                >
                  {role ? roleLabels[role as UserRole] : "User"}
                </span>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400 hidden sm:block" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span className="text-sm font-medium">{user?.name || "User"}</span>
                <span className="text-xs text-slate-500">{user?.email || ""}</span>
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
    </header>
  );
}
