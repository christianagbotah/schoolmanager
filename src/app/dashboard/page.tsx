"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  GraduationCap,
  Users,
  BookOpen,
  CreditCard,
  Megaphone,
  BarChart3,
  Receipt,
  Calendar,
  Trophy,
  Bus,
  Library,
  MessageSquare,
  CheckSquare,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useAuth } from "@/hooks/use-auth";
import { RequirePermission } from "@/components/auth/require-permission";

// ─── Quick Stat Card ─────────────────────────────────────────
function StatCard({
  icon: Icon,
  label,
  value,
  color,
  href,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  color: string;
  href?: string;
}) {
  const router = useRouter();
  const iconStyles: Record<string, string> = {
    emerald: "bg-emerald-100 text-emerald-600",
    blue: "bg-blue-100 text-blue-600",
    amber: "bg-amber-100 text-amber-600",
    purple: "bg-purple-100 text-purple-600",
    red: "bg-red-100 text-red-600",
    slate: "bg-slate-100 text-slate-600",
  };

  const content = (
    <Card className="hover:shadow-md transition-shadow cursor-pointer border-slate-200/60">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">{label}</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
          </div>
          <div
            className={`w-10 h-10 rounded-xl ${iconStyles[color] || iconStyles.slate} flex items-center justify-center`}
          >
            <Icon className="w-5 h-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (href) {
    return <div onClick={() => router.push(href)}>{content}</div>;
  }
  return content;
}

// ─── Quick Action Card ───────────────────────────────────────
function QuickAction({
  icon: Icon,
  label,
  href,
  color,
}: {
  icon: React.ElementType;
  label: string;
  href: string;
  color: string;
}) {
  const router = useRouter();
  return (
    <button
      onClick={() => router.push(href)}
      className="flex flex-col items-center gap-2 p-4 rounded-xl border border-slate-200/60 hover:shadow-md hover:border-emerald-200 transition-all min-w-[80px] min-h-[44px]"
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <span className="text-xs font-medium text-slate-600 text-center leading-tight">
        {label}
      </span>
    </button>
  );
}

// ─── Admin Dashboard ─────────────────────────────────────────
function AdminDashboard() {
  const [stats, setStats] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await fetch("/api/admin/dashboard");
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch {
        // Use fallback zeros
      } finally {
        setIsLoading(false);
      }
    }
    loadStats();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Users}
          label="Students"
          value={stats.students || 0}
          color="emerald"
          href="/admin/students"
        />
        <StatCard
          icon={GraduationCap}
          label="Teachers"
          value={stats.teachers || 0}
          color="blue"
          href="/admin/teachers"
        />
        <StatCard
          icon={BookOpen}
          label="Classes"
          value={stats.classes || 0}
          color="purple"
          href="/admin/classes"
        />
        <StatCard
          icon={Receipt}
          label="Revenue"
          value={`GHS ${(stats.revenue || 0).toLocaleString()}`}
          color="amber"
          href="/admin/reports/finance"
        />
      </div>

      {/* Quick actions for admin */}
      <Card className="gap-4">
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-wrap gap-3">
            <QuickAction icon={GraduationCap} label="Admit Student" href="/admin/students/new" color="bg-emerald-100 text-emerald-600" />
            <QuickAction icon={CreditCard} label="Bill Students" href="/admin/invoices" color="bg-red-100 text-red-600" />
            <QuickAction icon={Megaphone} label="Notices" href="/notices" color="bg-amber-100 text-amber-600" />
            <QuickAction icon={MessageSquare} label="Messages" href="/messages" color="bg-blue-100 text-blue-600" />
            <QuickAction icon={CheckSquare} label="Attendance" href="/attendance" color="bg-purple-100 text-purple-600" />
            <QuickAction icon={Calendar} label="Timetable" href="/routine" color="bg-sky-100 text-sky-600" />
            <QuickAction icon={BarChart3} label="Reports" href="/admin/reports/finance" color="bg-rose-100 text-rose-600" />
            <QuickAction icon={Bus} label="Transport" href="/transport" color="bg-orange-100 text-orange-600" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Teacher Dashboard ───────────────────────────────────────
function TeacherDashboard() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={BookOpen} label="My Classes" value={0} color="emerald" href="/teacher/classes" />
        <StatCard icon={CheckSquare} label="Attendance" value={0} color="blue" href="/attendance" />
        <StatCard icon={FileIcon} label="Marks Entry" value={0} color="amber" href="/teacher/marks" />
        <StatCard icon={Megaphone} label="Notices" value={0} color="purple" href="/notices" />
      </div>

      <Card className="gap-4">
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-wrap gap-3">
            <QuickAction icon={CheckSquare} label="Mark Attendance" href="/attendance" color="bg-emerald-100 text-emerald-600" />
            <QuickAction icon={FileIcon} label="Enter Marks" href="/teacher/marks" color="bg-amber-100 text-amber-600" />
            <QuickAction icon={Calendar} label="Timetable" href="/routine" color="bg-sky-100 text-sky-600" />
            <QuickAction icon={MessageSquare} label="Messages" href="/messages" color="bg-blue-100 text-blue-600" />
            <QuickAction icon={Megaphone} label="Notices" href="/notices" color="bg-orange-100 text-orange-600" />
            <QuickAction icon={Trophy} label="Online Exams" href="/online-exams" color="bg-purple-100 text-purple-600" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Student Dashboard ───────────────────────────────────────
function StudentDashboard() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={BarChart3} label="Results" value={0} color="purple" href="/results" />
        <StatCard icon={Receipt} label="Invoices" value={0} color="red" href="/invoices" />
        <StatCard icon={CheckSquare} label="Attendance" value={0} color="emerald" href="/attendance" />
        <StatCard icon={Calendar} label="Timetable" href="/routine" color="blue" />
      </div>

      <Card className="gap-4">
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-wrap gap-3">
            <QuickAction icon={BarChart3} label="My Results" href="/results" color="bg-purple-100 text-purple-600" />
            <QuickAction icon={Receipt} label="My Invoices" href="/invoices" color="bg-red-100 text-red-600" />
            <QuickAction icon={CheckSquare} label="Attendance" href="/attendance" color="bg-emerald-100 text-emerald-600" />
            <QuickAction icon={Calendar} label="Timetable" href="/routine" color="bg-sky-100 text-sky-600" />
            <QuickAction icon={Trophy} label="Online Exams" href="/online-exams" color="bg-amber-100 text-amber-600" />
            <QuickAction icon={MessageSquare} label="Messages" href="/messages" color="bg-blue-100 text-blue-600" />
            <QuickAction icon={Megaphone} label="Notices" href="/notices" color="bg-orange-100 text-orange-600" />
            <QuickAction icon={Library} label="Library" href="/library" color="bg-rose-100 text-rose-600" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Parent Dashboard ────────────────────────────────────────
function ParentDashboard() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Children" value={0} color="purple" href="/parent/children" />
        <StatCard icon={BarChart3} label="Results" value={0} color="emerald" href="/results" />
        <StatCard icon={CreditCard} label="Payments" value={0} color="red" href="/payments" />
        <StatCard icon={CheckSquare} label="Attendance" value={0} color="blue" href="/attendance" />
      </div>

      <Card className="gap-4">
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-wrap gap-3">
            <QuickAction icon={BarChart3} label="Children's Results" href="/results" color="bg-purple-100 text-purple-600" />
            <QuickAction icon={CreditCard} label="Fee Payments" href="/payments" color="bg-red-100 text-red-600" />
            <QuickAction icon={CheckSquare} label="Attendance" href="/attendance" color="bg-emerald-100 text-emerald-600" />
            <QuickAction icon={Calendar} label="Timetable" href="/routine" color="bg-sky-100 text-sky-600" />
            <QuickAction icon={MessageSquare} label="Messages" href="/messages" color="bg-blue-100 text-blue-600" />
            <QuickAction icon={Megaphone} label="Notices" href="/notices" color="bg-orange-100 text-orange-600" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Accountant Dashboard ────────────────────────────────────
function AccountantDashboard() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Receipt} label="Invoices" value={0} color="red" href="/invoices" />
        <StatCard icon={CreditCard} label="Payments" value={0} color="emerald" href="/payments" />
        <StatCard icon={TrendingDown} label="Expenses" value={0} color="amber" href="/accountant/expenses" />
        <StatCard icon={BarChart3} label="Reports" value={0} color="purple" href="/accountant/reports" />
      </div>

      <Card className="gap-4">
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-wrap gap-3">
            <QuickAction icon={Receipt} label="Invoices" href="/invoices" color="bg-red-100 text-red-600" />
            <QuickAction icon={CreditCard} label="Payments" href="/payments" color="bg-emerald-100 text-emerald-600" />
            <QuickAction icon={TrendingDown} label="Expenses" href="/accountant/expenses" color="bg-amber-100 text-amber-600" />
            <QuickAction icon={BarChart3} label="Reports" href="/accountant/reports" color="bg-purple-100 text-purple-600" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Librarian Dashboard ─────────────────────────────────────
function LibrarianDashboard() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={BookOpen} label="Books" value={0} color="emerald" href="/library" />
        <StatCard icon={Library} label="Requests" value={0} color="blue" href="/librarian/requests" />
      </div>

      <Card className="gap-4">
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-wrap gap-3">
            <QuickAction icon={BookOpen} label="Books" href="/library" color="bg-emerald-100 text-emerald-600" />
            <QuickAction icon={Library} label="Requests" href="/librarian/requests" color="bg-blue-100 text-blue-600" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Placeholder icons ───────────────────────────────────────
// Using aliases to avoid import errors
import { FileText as FileIcon, TrendingDown } from "lucide-react";

// ─── Main Unified Dashboard ──────────────────────────────────
export default function UnifiedDashboard() {
  const { role, isLoading, isAuthenticated, isAdmin, isTeacher, isStudent, isParent, isAccountant, isLibrarian, user } = useAuth();
  const router = useRouter();

  // Redirect unauthenticated users
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading || !isAuthenticated || !role) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </DashboardLayout>
    );
  }

  const roleLabel = role === "super-admin" ? "Super Admin" : role.charAt(0).toUpperCase() + role.slice(1);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* ─── Welcome Header ─────────────────────────────── */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Welcome back, {user?.name || roleLabel}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            <Badge variant="outline" className="mr-2">{roleLabel}</Badge>
            Here&apos;s your dashboard overview
          </p>
        </div>

        {/* ─── Role-specific Dashboard ─────────────────────── */}
        {isAdmin && <AdminDashboard />}
        {isTeacher && <TeacherDashboard />}
        {isStudent && <StudentDashboard />}
        {isParent && <ParentDashboard />}
        {isAccountant && <AccountantDashboard />}
        {isLibrarian && <LibrarianDashboard />}
      </div>
    </DashboardLayout>
  );
}
