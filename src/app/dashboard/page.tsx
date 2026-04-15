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
  TrendingDown,
  AlertTriangle,
  Clock,
  Bell,
  BookCheck,
  DollarSign,
  PiggyBank,
  HandCoins,
  UserCheck,
  FileText,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useAuth } from "@/hooks/use-auth";

// ─── Quick Stat Card ─────────────────────────────────────────
function StatCard({
  icon: Icon,
  label,
  value,
  color,
  href,
  subtitle,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  color: string;
  href?: string;
  subtitle?: string;
}) {
  const router = useRouter();
  const iconStyles: Record<string, string> = {
    emerald: "bg-emerald-100 text-emerald-600",
    blue: "bg-blue-100 text-blue-600",
    amber: "bg-amber-100 text-amber-600",
    purple: "bg-purple-100 text-purple-600",
    red: "bg-red-100 text-red-600",
    slate: "bg-slate-100 text-slate-600",
    sky: "bg-sky-100 text-sky-600",
    rose: "bg-rose-100 text-rose-600",
    orange: "bg-orange-100 text-orange-600",
    teal: "bg-teal-100 text-teal-600",
    violet: "bg-violet-100 text-violet-600",
    indigo: "bg-indigo-100 text-indigo-600",
  };

  const content = (
    <Card className="hover:shadow-md transition-shadow cursor-pointer border-slate-200/60">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-slate-500">{label}</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
            {subtitle && (
              <p className="text-[11px] text-slate-400 mt-0.5 truncate">{subtitle}</p>
            )}
          </div>
          <div
            className={`w-10 h-10 rounded-xl flex-shrink-0 ${iconStyles[color] || iconStyles.slate} flex items-center justify-center`}
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
  badge,
}: {
  icon: React.ElementType;
  label: string;
  href: string;
  color: string;
  badge?: number;
}) {
  const router = useRouter();
  return (
    <button
      onClick={() => router.push(href)}
      className="flex flex-col items-center gap-2 p-4 rounded-xl border border-slate-200/60 hover:shadow-md hover:border-emerald-200 transition-all min-w-[80px] min-h-[44px] relative"
    >
      {badge && badge > 0 && (
        <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
          {badge > 99 ? "99+" : badge}
        </span>
      )}
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <span className="text-xs font-medium text-slate-600 text-center leading-tight">
        {label}
      </span>
    </button>
  );
}

// ─── Recent Activity Item ────────────────────────────────────
function ActivityItem({
  icon: Icon,
  title,
  subtitle,
  time,
  color,
}: {
  icon: React.ElementType;
  title: string;
  subtitle: string;
  time: string;
  color: string;
}) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-slate-100 last:border-0">
      <div className={`w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center ${color}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-slate-800 truncate">{title}</p>
        <p className="text-xs text-slate-400 truncate">{subtitle}</p>
      </div>
      <span className="text-[11px] text-slate-400 flex-shrink-0 whitespace-nowrap">{time}</span>
    </div>
  );
}

// ─── Loading Skeleton ────────────────────────────────────────
function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-64" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-48 rounded-xl" />
      <Skeleton className="h-64 rounded-xl" />
    </div>
  );
}

// ─── Admin Dashboard ─────────────────────────────────────────
function AdminDashboard() {
  const [stats, setStats] = useState<Record<string, unknown>>({});
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

  if (isLoading) return <DashboardSkeleton />;

  const s = stats;
  return (
    <div className="space-y-6">
      {/* Primary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={GraduationCap} label="Students" value={s.students || 0} color="emerald" href="/admin/students" subtitle="Active enrolled" />
        <StatCard icon={Users} label="Teachers" value={s.teachers || 0} color="blue" href="/admin/teachers" subtitle="Teaching staff" />
        <StatCard icon={BookOpen} label="Classes" value={s.classes || 0} color="purple" href="/admin/classes" subtitle={s.sections ? `${s.sections} sections` : undefined} />
        <StatCard icon={DollarSign} label="Revenue" value={`GHS ${Number(s.revenue || 0).toLocaleString()}`} color="amber" href="/admin/reports/finance" subtitle={s.collectionRate ? `${Number(s.collectionRate).toFixed(1)}% collection` : undefined} />
      </div>

      {/* Secondary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={CreditCard} label="Pending Invoices" value={s.pendingInvoices || 0} color="red" href="/admin/receivables" />
        <StatCard icon={UserCheck} label="Attendance Today" value={`${s.attendanceRate || 0}%`} color="sky" href="/attendance" />
        <StatCard icon={Users} label="Parents" value={s.parents || 0} color="teal" href="/admin/parents" />
        <StatCard icon={Receipt} label="Payments (Month)" value={`GHS ${Number(s.monthlyPayments || 0).toLocaleString()}`} color="violet" href="/admin/payments" />
      </div>

      {/* Quick actions */}
      <Card className="gap-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-wrap gap-3">
            <QuickAction icon={GraduationCap} label="Admit Student" href="/admin/students/new" color="bg-emerald-100 text-emerald-600" />
            <QuickAction icon={CreditCard} label="Bill Students" href="/admin/invoices" color="bg-red-100 text-red-600" />
            <QuickAction icon={HandCoins} label="Daily Fees" href="/admin/daily-fees" color="bg-teal-100 text-teal-600" />
            <QuickAction icon={CheckSquare} label="Attendance" href="/attendance" color="bg-purple-100 text-purple-600" />
            <QuickAction icon={Calendar} label="Timetable" href="/routine" color="bg-sky-100 text-sky-600" />
            <QuickAction icon={BarChart3} label="Reports" href="/admin/reports/finance" color="bg-rose-100 text-rose-600" />
            <QuickAction icon={Megaphone} label="Notices" href="/notices" color="bg-amber-100 text-amber-600" />
            <QuickAction icon={MessageSquare} label="Messages" href="/messages" color="bg-blue-100 text-blue-600" />
            <QuickAction icon={Bus} label="Transport" href="/admin/transport" color="bg-orange-100 text-orange-600" />
            <QuickAction icon={Library} label="Library" href="/admin/library" color="bg-indigo-100 text-indigo-600" />
            <QuickAction icon={Trophy} label="Online Exams" href="/admin/exams/online/create" color="bg-yellow-100 text-yellow-600" />
            <QuickAction icon={FileText} label="Terminal Reports" href="/admin/reports/terminal" color="bg-violet-100 text-violet-600" />
          </div>
        </CardContent>
      </Card>

      {/* Financial overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <PiggyBank className="w-4 h-4 text-emerald-600" />
              Financial Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Total Billed</span>
                <span className="text-sm font-semibold text-slate-900">GHS {Number(s.totalBilled || 0).toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Total Collected</span>
                <span className="text-sm font-semibold text-emerald-600">GHS {Number(s.totalCollected || 0).toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Outstanding</span>
                <span className="text-sm font-semibold text-red-600">GHS {Number(s.outstanding || 0).toLocaleString()}</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2 mt-2">
                <div
                  className="bg-emerald-500 rounded-full h-2 transition-all"
                  style={{ width: `${Math.min(100, Number(s.collectionRate || 0))}%` }}
                />
              </div>
              <p className="text-xs text-slate-400 text-right">
                {Number(s.collectionRate || 0).toFixed(1)}% collection rate
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              Action Items
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2.5">
              {s.pendingInvoices > 0 && (
                <ActivityItem
                  icon={Receipt}
                  title={`${s.pendingInvoices} unpaid invoices`}
                  subtitle="Follow up on outstanding payments"
                  time="Now"
                  color="bg-red-100 text-red-600"
                />
              )}
              {s.overdueStudents > 0 && (
                <ActivityItem
                  icon={AlertTriangle}
                  title={`${s.overdueStudents} students with arrears`}
                  subtitle="Send reminders or contact parents"
                  time="Urgent"
                  color="bg-amber-100 text-amber-600"
                />
              )}
              {s.mutedStudents > 0 && (
                <ActivityItem
                  icon={Users}
                  title={`${s.mutedStudents} muted students`}
                  subtitle="Review muted student accounts"
                  time="Review"
                  color="bg-slate-100 text-slate-600"
                />
              )}
              <ActivityItem
                icon={Bell}
                title="System health check"
                subtitle="Review settings, backup data"
                time="Weekly"
                color="bg-blue-100 text-blue-600"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─── Teacher Dashboard ───────────────────────────────────────
function TeacherDashboard() {
  const [stats, setStats] = useState<Record<string, unknown>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await fetch("/api/teacher/dashboard");
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch {
        // fallback
      } finally {
        setIsLoading(false);
      }
    }
    loadStats();
  }, []);

  if (isLoading) return <DashboardSkeleton />;

  const s = stats;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={BookOpen} label="My Classes" value={s.classCount || 0} color="emerald" href="/teacher/classes" subtitle={`${s.subjectCount || 0} subjects assigned`} />
        <StatCard icon={GraduationCap} label="My Students" value={s.studentCount || 0} color="blue" href="/teacher/students" subtitle="Across all classes" />
        <StatCard icon={CheckSquare} label="Attendance Today" value={`${s.attendanceRate || 0}%`} color="purple" href="/teacher/attendance" subtitle={`${s.presentToday || 0} present`} />
        <StatCard icon={Megaphone} label="Notices" value={s.noticeCount || 0} color="amber" href="/notices" />
      </div>

      {/* My subjects card */}
      {s.subjects && Array.isArray(s.subjects) && s.subjects.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-blue-600" />
              My Subjects & Classes
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {(s.subjects as { subjectName: string; className: string; classId: number; sectionName: string }[]).map((subj, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200/60">
                  <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{subj.subjectName}</p>
                    <p className="text-xs text-slate-400 truncate">{subj.className} - {subj.sectionName}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick actions */}
      <Card className="gap-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-wrap gap-3">
            <QuickAction icon={CheckSquare} label="Mark Attendance" href="/teacher/attendance" color="bg-emerald-100 text-emerald-600" />
            <QuickAction icon={FileText} label="Enter Marks" href="/teacher/marks" color="bg-amber-100 text-amber-600" />
            <QuickAction icon={Calendar} label="Timetable" href="/routine" color="bg-sky-100 text-sky-600" />
            <QuickAction icon={GraduationCap} label="My Students" href="/teacher/students" color="bg-blue-100 text-blue-600" />
            <QuickAction icon={MessageSquare} label="Messages" href="/messages" color="bg-violet-100 text-violet-600" />
            <QuickAction icon={Megaphone} label="Notices" href="/notices" color="bg-orange-100 text-orange-600" />
            <QuickAction icon={Trophy} label="Online Exams" href="/online-exams" color="bg-purple-100 text-purple-600" />
            <QuickAction icon={BookCheck} label="Study Material" href="/teacher/study-material" color="bg-rose-100 text-rose-600" />
          </div>
        </CardContent>
      </Card>

      {/* Today's Schedule */}
      {s.todaySchedule && Array.isArray(s.todaySchedule) && s.todaySchedule.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-600" />
              Today&apos;s Schedule
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              {(s.todaySchedule as { period: string; subject: string; class: string; time: string }[]).map((item, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-indigo-50/50 border border-indigo-100">
                  <div className="w-12 h-12 rounded-lg bg-indigo-100 text-indigo-600 flex flex-col items-center justify-center flex-shrink-0">
                    <span className="text-[10px] font-medium">P{item.period}</span>
                    <Clock className="w-3 h-3" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-800">{item.subject}</p>
                    <p className="text-xs text-slate-400">{item.class} | {item.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── Student Dashboard ───────────────────────────────────────
function StudentDashboard() {
  const [stats, setStats] = useState<Record<string, unknown>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await fetch("/api/student/dashboard");
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch {
        // fallback
      } finally {
        setIsLoading(false);
      }
    }
    loadStats();
  }, []);

  if (isLoading) return <DashboardSkeleton />;

  const s = stats;
  const student = s.student as { name?: string; student_code?: string; class?: string; section?: string; sex?: string } | undefined;
  const enroll = s.enroll as { class: { name: string; name_numeric: string; category: string }; section: { name: string } } | undefined;

  return (
    <div className="space-y-6">
      {/* Student info banner */}
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl p-5 text-white">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center">
            <GraduationCap className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-lg font-bold">{student?.name || "Student"}</h2>
            <p className="text-sm opacity-90">
              {student?.student_code || ""}
              {enroll ? ` | ${enroll.class.name} ${enroll.class.name_numeric} - ${enroll.section.name}` : ""}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={BarChart3} label="Average Score" value={s.averageScore ? `${Number(s.averageScore).toFixed(1)}%` : "N/A"} color="purple" href="/results" subtitle={s.examCount ? `${s.examCount} exams taken` : undefined} />
        <StatCard icon={Receipt} label="Outstanding Fees" value={s.outstanding ? `GHS ${Number(s.outstanding).toLocaleString()}` : "GHS 0"} color="red" href="/invoices" subtitle={s.invoiceCount ? `${s.invoiceCount} invoices` : undefined} />
        <StatCard icon={CheckSquare} label="Attendance" value={s.attendanceRate ? `${Number(s.attendanceRate).toFixed(0)}%` : "N/A"} color="emerald" href="/attendance" subtitle={s.daysPresent ? `${s.daysPresent} days present` : undefined} />
        <StatCard icon={Trophy} label="Rank" value={s.rank || "N/A"} color="amber" href="/results" subtitle={s.classSize ? `of ${s.classSize} students` : undefined} />
      </div>

      {/* Quick actions */}
      <Card className="gap-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-wrap gap-3">
            <QuickAction icon={BarChart3} label="My Results" href="/results" color="bg-purple-100 text-purple-600" />
            <QuickAction icon={Receipt} label="My Invoices" href="/invoices" color="bg-red-100 text-red-600" />
            <QuickAction icon={CreditCard} label="Pay Fees" href="/student/fees" color="bg-emerald-100 text-emerald-600" />
            <QuickAction icon={CheckSquare} label="Attendance" href="/attendance" color="bg-sky-100 text-sky-600" />
            <QuickAction icon={Calendar} label="Timetable" href="/routine" color="bg-blue-100 text-blue-600" />
            <QuickAction icon={Trophy} label="Online Exams" href="/online-exams" color="bg-amber-100 text-amber-600" />
            <QuickAction icon={MessageSquare} label="Messages" href="/messages" color="bg-violet-100 text-violet-600" />
            <QuickAction icon={Library} label="Library" href="/library" color="bg-rose-100 text-rose-600" />
          </div>
        </CardContent>
      </Card>

      {/* Recent notices */}
      {s.notices && Array.isArray(s.notices) && s.notices.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-600" />
              Recent Notices
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-1">
              {(s.notices as { title: string; notice: string; date: string }[]).slice(0, 5).map((notice, i) => (
                <div key={i} className="flex items-start gap-3 py-2.5 border-b border-slate-100 last:border-0">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Megaphone className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-800 truncate">{notice.title}</p>
                    <p className="text-xs text-slate-400 line-clamp-1">{notice.notice}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── Parent Dashboard ────────────────────────────────────────
function ParentDashboard() {
  const [data, setData] = useState<Record<string, unknown>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch("/api/parent");
        if (res.ok) {
          const result = await res.json();
          setData(result);
        }
      } catch {
        // fallback
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  if (isLoading) return <DashboardSkeleton />;

  const children = data.children as { student_id: number; student_code: string; name: string; enrolls: { class: { name: string; name_numeric: string; category: string }; section: { name: string } }[] }[] | undefined;
  const childCount = children?.length || 0;

  return (
    <div className="space-y-6">
      {/* Children overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={GraduationCap} label="My Children" value={childCount} color="purple" href="/parent/children" subtitle="Enrolled students" />
        <StatCard icon={Receipt} label="Total Fees Due" value={data.totalOutstanding ? `GHS ${Number(data.totalOutstanding).toLocaleString()}` : "GHS 0"} color="red" href="/parent/invoices" />
        <StatCard icon={CreditCard} label="Paid (Month)" value={data.monthlyPayments ? `GHS ${Number(data.monthlyPayments).toLocaleString()}` : "GHS 0"} color="emerald" href="/parent/payments" />
        <StatCard icon={CheckSquare} label="Avg. Attendance" value={data.avgAttendance ? `${Number(data.avgAttendance).toFixed(0)}%` : "N/A"} color="blue" href="/attendance" />
      </div>

      {/* Children cards */}
      {children && children.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-purple-600" />
              My Children
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {children.map((child) => {
                const enroll = child.enrolls?.[0];
                return (
                  <div
                    key={child.student_id}
                    onClick={() => window.location.href = `/parent/children`}
                    className="p-4 rounded-xl border border-slate-200/60 hover:shadow-md cursor-pointer transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-semibold text-sm">
                        {child.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">{child.name}</p>
                        <p className="text-xs text-slate-400">{child.student_code}</p>
                      </div>
                    </div>
                    {enroll && (
                      <div className="mt-3 flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {enroll.class.name} {enroll.class.name_numeric}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {enroll.section.name}
                        </Badge>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick actions */}
      <Card className="gap-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-wrap gap-3">
            <QuickAction icon={BarChart3} label="Results" href="/results" color="bg-purple-100 text-purple-600" />
            <QuickAction icon={CreditCard} label="Pay Fees" href="/parent/payments" color="bg-red-100 text-red-600" />
            <QuickAction icon={Receipt} label="Invoices" href="/parent/invoices" color="bg-emerald-100 text-emerald-600" />
            <QuickAction icon={CheckSquare} label="Attendance" href="/attendance" color="bg-sky-100 text-sky-600" />
            <QuickAction icon={Calendar} label="Timetable" href="/routine" color="bg-blue-100 text-blue-600" />
            <QuickAction icon={MessageSquare} label="Messages" href="/messages" color="bg-violet-100 text-violet-600" />
            <QuickAction icon={Megaphone} label="Notices" href="/notices" color="bg-orange-100 text-orange-600" />
            <QuickAction icon={Users} label="Teachers" href="/parent/teachers" color="bg-indigo-100 text-indigo-600" />
          </div>
        </CardContent>
      </Card>

      {/* Recent notices */}
      {data.notices && Array.isArray(data.notices) && data.notices.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-600" />
              School Notices
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-1">
              {(data.notices as { title: string; notice: string; date: string }[]).slice(0, 5).map((notice, i) => (
                <div key={i} className="flex items-start gap-3 py-2.5 border-b border-slate-100 last:border-0">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Megaphone className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-800 truncate">{notice.title}</p>
                    <p className="text-xs text-slate-400 line-clamp-1">{notice.notice}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── Accountant Dashboard ────────────────────────────────────
function AccountantDashboard() {
  const [stats, setStats] = useState<Record<string, unknown>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await fetch("/api/accountant/dashboard");
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch {
        // fallback
      } finally {
        setIsLoading(false);
      }
    }
    loadStats();
  }, []);

  if (isLoading) return <DashboardSkeleton />;

  const s = stats;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={TrendingUp} label="Monthly Revenue" value={`GHS ${Number(s.monthlyRevenue || 0).toLocaleString()}`} color="emerald" href="/accountant/reports" subtitle="This month" />
        <StatCard icon={TrendingDown} label="Monthly Expenses" value={`GHS ${Number(s.monthlyExpenses || 0).toLocaleString()}`} color="red" href="/accountant/expenses" subtitle="This month" />
        <StatCard icon={Receipt} label="Outstanding" value={`GHS ${Number(s.outstanding || 0).toLocaleString()}`} color="amber" href="/admin/receivables" subtitle={s.outstandingCount ? `${s.outstandingCount} invoices` : undefined} />
        <StatCard icon={PiggyBank} label="Bank Balance" value={`GHS ${Number(s.bankBalance || 0).toLocaleString()}`} color="blue" href="/accountant/reports" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={CreditCard} label="Today Collections" value={`GHS ${Number(s.todayTotal || 0).toLocaleString()}`} color="teal" href="/accountant/payments" subtitle={s.todayCount ? `${s.todayCount} payments` : undefined} />
        <StatCard icon={HandCoins} label="Net Income" value={`GHS ${Number(s.netIncome || 0).toLocaleString()}`} color="violet" href="/accountant/reports" />
        <StatCard icon={BarChart3} label="Pending Entries" value={s.pendingEntries || 0} color="orange" href="/accountant/reconciliation" subtitle="Draft journal entries" />
        <StatCard icon={Users} label="Owing Students" value={s.owingCount || 0} color="rose" href="/accountant/reports" />
      </div>

      {/* Collection rate */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            Collection Performance
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-500">Invoice Collection Rate</span>
                <span className="text-sm font-bold text-emerald-600">
                  {s.collectionRate ? `${Number(s.collectionRate).toFixed(1)}%` : "0%"}
                </span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full h-3 transition-all"
                  style={{ width: `${Math.min(100, Number(s.collectionRate || 0))}%` }}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 pt-2">
              <div className="text-center">
                <p className="text-lg font-bold text-emerald-600">{s.paidCount || 0}</p>
                <p className="text-xs text-slate-400">Paid</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-amber-600">{s.partialCount || 0}</p>
                <p className="text-xs text-slate-400">Partial</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-red-600">{s.unpaidCount || 0}</p>
                <p className="text-xs text-slate-400">Unpaid</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick actions */}
      <Card className="gap-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-wrap gap-3">
            <QuickAction icon={Receipt} label="Invoices" href="/invoices" color="bg-red-100 text-red-600" />
            <QuickAction icon={CreditCard} label="Record Payment" href="/accountant/payments" color="bg-emerald-100 text-emerald-600" />
            <QuickAction icon={TrendingDown} label="Expenses" href="/accountant/expenses" color="bg-amber-100 text-amber-600" />
            <QuickAction icon={BarChart3} label="Reports" href="/accountant/reports" color="bg-purple-100 text-purple-600" />
            <QuickAction icon={PiggyBank} label="Payroll" href="/accountant/payroll" color="bg-blue-100 text-blue-600" />
            <QuickAction icon={ScaleIcon} label="Reconciliation" href="/accountant/reconciliation" color="bg-sky-100 text-sky-600" />
          </div>
        </CardContent>
      </Card>

      {/* Top debtors */}
      {s.topDebtors && Array.isArray(s.topDebtors) && s.topDebtors.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              Top Debtors
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-1">
              {(s.topDebtors as { studentName: string; outstanding: number; class: string }[]).slice(0, 10).map((debtor, i) => (
                <div key={i} className="flex items-center gap-3 py-2.5 border-b border-slate-100 last:border-0">
                  <span className="w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-800 truncate">{debtor.studentName}</p>
                    <p className="text-xs text-slate-400">{debtor.class}</p>
                  </div>
                  <span className="text-sm font-semibold text-red-600 flex-shrink-0">
                    GHS {Number(debtor.outstanding).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Scale icon alias for Accountant
import { Scale as ScaleIcon } from "lucide-react";

// ─── Librarian Dashboard ─────────────────────────────────────
function LibrarianDashboard() {
  const [stats, setStats] = useState<Record<string, unknown>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await fetch("/api/librarian/books");
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch {
        // fallback
      } finally {
        setIsLoading(false);
      }
    }
    loadStats();
  }, []);

  if (isLoading) return <DashboardSkeleton />;

  const s = stats;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={BookOpen} label="Total Books" value={s.totalBooks || 0} color="emerald" href="/librarian/books" subtitle={s.uniqueCategories ? `${s.uniqueCategories} categories` : undefined} />
        <StatCard icon={BookCheck} label="Available" value={s.availableBooks || 0} color="blue" href="/librarian/books" />
        <StatCard icon={Clock} label="Pending Requests" value={s.pendingRequests || 0} color="amber" href="/librarian/requests" />
        <StatCard icon={AlertTriangle} label="Overdue" value={s.overdueRequests || 0} color="red" href="/librarian/requests" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={HandCoins} label="Collection Value" value={s.totalValue ? `GHS ${Number(s.totalValue).toLocaleString()}` : "GHS 0"} color="violet" />
        <StatCard icon={Users} label="Total Copies" value={s.totalCopies || 0} color="teal" />
        <StatCard icon={CheckSquare} label="Returned" value={s.returnedRequests || 0} color="sky" />
        <StatCard icon={Megaphone} label="Notices" value={s.noticeCount || 0} color="orange" href="/notices" />
      </div>

      {/* Quick actions */}
      <Card className="gap-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-wrap gap-3">
            <QuickAction icon={BookOpen} label="Manage Books" href="/librarian/books" color="bg-emerald-100 text-emerald-600" />
            <QuickAction icon={BookCheck} label="Book Requests" href="/librarian/requests" badge={Number(s.pendingRequests || 0)} color="bg-blue-100 text-blue-600" />
            <QuickAction icon={CheckSquare} label="Book Returns" href="/librarian/returns" color="bg-amber-100 text-amber-600" />
            <QuickAction icon={Megaphone} label="Notices" href="/notices" color="bg-orange-100 text-orange-600" />
          </div>
        </CardContent>
      </Card>

      {/* Popular books */}
      {s.popularBooks && Array.isArray(s.popularBooks) && s.popularBooks.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-600" />
              Most Borrowed Books
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-1">
              {(s.popularBooks as { name: string; author: string; issuedCopies: number; category: string }[]).slice(0, 5).map((book, i) => {
                const medalColors = i === 0 ? "bg-yellow-100 text-yellow-600" : i === 1 ? "bg-slate-200 text-slate-600" : i === 2 ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-500";
                return (
                  <div key={i} className="flex items-center gap-3 py-2.5 border-b border-slate-100 last:border-0">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${medalColors}`}>
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-800 truncate">{book.name}</p>
                      <p className="text-xs text-slate-400">{book.author}</p>
                    </div>
                    <Badge variant="secondary" className="text-xs flex-shrink-0">
                      {book.issuedCopies} issued
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

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
        <DashboardSkeleton />
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
