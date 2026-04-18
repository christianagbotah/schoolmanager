"use client";

import { useEffect, useState } from "react";
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
  Scale,
  ArrowRight,
  Activity,
  CalendarDays,
  CircleDollarSign,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useAuth } from "@/hooks/use-auth";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// ─── Icon Color Map ───────────────────────────────────────
const iconStyles: Record<string, string> = {
  emerald: "bg-emerald-50 text-emerald-600 border border-emerald-100",
  teal: "bg-teal-50 text-teal-600 border border-teal-100",
  amber: "bg-amber-50 text-amber-600 border border-amber-100",
  rose: "bg-rose-50 text-rose-600 border border-rose-100",
  orange: "bg-orange-50 text-orange-600 border border-orange-100",
  violet: "bg-violet-50 text-violet-600 border border-violet-100",
  sky: "bg-sky-50 text-sky-600 border border-sky-100",
  slate: "bg-slate-50 text-slate-600 border border-slate-100",
  red: "bg-red-50 text-red-600 border border-red-100",
  purple: "bg-purple-50 text-purple-600 border border-purple-100",
};

// ─── Live Clock ────────────────────────────────────────────
function LiveClock() {
  const [time, setTime] = useState<string>("");
  const [date, setDate] = useState<string>("");

  useEffect(() => {
    function tick() {
      const now = new Date();
      setTime(
        now.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
      setDate(
        now.toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      );
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="text-right">
      <p className="text-sm font-semibold text-slate-800 tabular-nums">
        {time}
      </p>
      <p className="text-xs text-slate-500">{date}</p>
    </div>
  );
}

// ─── Section Header ────────────────────────────────────────
function SectionHeader({
  icon: Icon,
  title,
  action,
}: {
  icon: React.ElementType;
  title: string;
  action?: { label: string; href: string };
}) {
  const router = useRouter();
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-emerald-600" />
        <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
      </div>
      {action && (
        <button
          onClick={() => router.push(action.href)}
          className="text-xs font-medium text-emerald-600 hover:text-emerald-700 flex items-center gap-1 transition-colors"
        >
          {action.label}
          <ArrowRight className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────
function StatCard({
  icon: Icon,
  label,
  value,
  color = "emerald",
  href,
  subtitle,
  trend,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  color?: string;
  href?: string;
  subtitle?: string;
  trend?: { value: string; up: boolean };
}) {
  const router = useRouter();
  const content = (
    <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer border-slate-200/80 bg-white group">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
              {label}
            </p>
            <p className="text-2xl font-bold text-slate-900 mt-2 leading-none">
              {value}
            </p>
            <div className="flex items-center gap-2 mt-2">
              {trend && (
                <span
                  className={`text-xs font-semibold flex items-center gap-0.5 ${
                    trend.up ? "text-emerald-600" : "text-red-500"
                  }`}
                >
                  {trend.up ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  {trend.value}
                </span>
              )}
              {subtitle && !trend && (
                <p className="text-[11px] text-slate-400 truncate">
                  {subtitle}
                </p>
              )}
            </div>
            {subtitle && trend && (
              <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                {subtitle}
              </p>
            )}
          </div>
          <div
            className={`w-11 h-11 rounded-xl flex-shrink-0 flex items-center justify-center ${
              iconStyles[color] || iconStyles.emerald
            }`}
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

// ─── Quick Action ──────────────────────────────────────────
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
      className="flex flex-col items-center gap-2.5 p-4 rounded-xl bg-white border border-slate-200/80 hover:shadow-md hover:border-emerald-200 hover:bg-emerald-50/30 transition-all min-w-[80px] min-h-[44px] relative group"
    >
      {badge && badge > 0 && (
        <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
          {badge > 99 ? "99+" : badge}
        </span>
      )}
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center ${color} group-hover:scale-110 transition-transform`}
      >
        <Icon className="w-5 h-5" />
      </div>
      <span className="text-xs font-medium text-slate-600 text-center leading-tight">
        {label}
      </span>
    </button>
  );
}

// ─── Activity Item ────────────────────────────────────────
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
      <div
        className={`w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center ${color}`}
      >
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-slate-800 truncate">{title}</p>
        <p className="text-xs text-slate-400 truncate">{subtitle}</p>
      </div>
      <span className="text-[11px] text-slate-400 flex-shrink-0 whitespace-nowrap">
        {time}
      </span>
    </div>
  );
}

// ─── Loading Skeleton ──────────────────────────────────────
function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-56 mb-2" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-10 w-40" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[108px] rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Skeleton className="h-72 rounded-xl lg:col-span-2" />
        <Skeleton className="h-72 rounded-xl" />
      </div>
      <Skeleton className="h-48 rounded-xl" />
    </div>
  );
}

// ─── Admin Dashboard ──────────────────────────────────────
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
        // fallback
      } finally {
        setIsLoading(false);
      }
    }
    loadStats();
  }, []);

  if (isLoading) return <DashboardSkeleton />;

  const s = stats;

  // Build chart data from recent payments
  const recentPayments = s.recentPayments as
    | { studentName: string; amount: number; timestamp: string }[]
    | undefined;
  const chartData = recentPayments
    ? recentPayments
        .slice(0, 7)
        .reverse()
        .map((p) => ({
          name:
            new Date(p.timestamp).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            }) || "N/A",
          amount: Number(p.amount) || 0,
        }))
    : [];

  const collectionRate = Number(s.collectionRate || 0);

  return (
    <div className="space-y-6">
      {/* ── Key Metrics ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={GraduationCap}
          label="Total Students"
          value={s.students || 0}
          color="emerald"
          href="/admin/students"
          subtitle="Active enrolled"
        />
        <StatCard
          icon={Users}
          label="Total Teachers"
          value={s.teachers || 0}
          color="teal"
          href="/admin/teachers"
          subtitle="Teaching staff"
        />
        <StatCard
          icon={Users}
          label="Total Parents"
          value={s.parents || 0}
          color="sky"
          href="/admin/parents"
          subtitle="Registered guardians"
        />
        <StatCard
          icon={CircleDollarSign}
          label="Total Revenue"
          value={`GHS ${Number(s.revenue || 0).toLocaleString()}`}
          color="amber"
          href="/admin/reports/finance"
          subtitle={`${collectionRate.toFixed(1)}% collection rate`}
          trend={{ value: `${collectionRate.toFixed(1)}%`, up: collectionRate > 50 }}
        />
      </div>

      {/* ── Chart + Financial + Action Items ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue Chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <SectionHeader
              icon={BarChart3}
              title="Recent Collections"
              action={{ label: "View Reports", href: "/admin/reports/finance" }}
            />
          </CardHeader>
          <CardContent className="pt-2">
            {chartData.length > 0 ? (
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    margin={{ top: 5, right: 5, left: -15, bottom: 5 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#f1f5f9"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11, fill: "#94a3b8" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "#94a3b8" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "8px",
                        border: "1px solid #e2e8f0",
                        fontSize: "12px",
                        boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
                      }}
                      formatter={(value: number) => [
                        `GHS ${value.toLocaleString()}`,
                        "Amount",
                      ]}
                    />
                    <Bar
                      dataKey="amount"
                      fill="#059669"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={48}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-56 flex items-center justify-center text-sm text-slate-400">
                No payment data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Financial Overview + Action Items */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <SectionHeader icon={PiggyBank} title="Financial Summary" />
            </CardHeader>
            <CardContent className="pt-2 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Total Billed</span>
                <span className="text-sm font-semibold text-slate-800">
                  GHS {Number(s.totalBilled || 0).toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Collected</span>
                <span className="text-sm font-semibold text-emerald-600">
                  GHS {Number(s.totalCollected || 0).toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Outstanding</span>
                <span className="text-sm font-semibold text-red-600">
                  GHS {Number(s.outstanding || 0).toLocaleString()}
                </span>
              </div>
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">
                    Collection Rate
                  </span>
                  <span className="text-xs font-bold text-emerald-600">
                    {collectionRate.toFixed(1)}%
                  </span>
                </div>
                <Progress value={collectionRate} className="h-2" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <SectionHeader icon={AlertTriangle} title="Action Items" />
            </CardHeader>
            <CardContent className="pt-2">
              <div className="max-h-40 overflow-y-auto custom-scrollbar">
                {s.pendingInvoices > 0 && (
                  <ActivityItem
                    icon={Receipt}
                    title={`${s.pendingInvoices} unpaid invoices`}
                    subtitle="Follow up on outstanding payments"
                    time="Now"
                    color="bg-red-50 text-red-600"
                  />
                )}
                {s.overdueStudents > 0 && (
                  <ActivityItem
                    icon={AlertTriangle}
                    title={`${s.overdueStudents} students with arrears`}
                    subtitle="Send reminders to parents"
                    time="Urgent"
                    color="bg-amber-50 text-amber-600"
                  />
                )}
                {s.mutedStudents > 0 && (
                  <ActivityItem
                    icon={Users}
                    title={`${s.mutedStudents} muted students`}
                    subtitle="Review muted accounts"
                    time="Review"
                    color="bg-slate-50 text-slate-600"
                  />
                )}
                <ActivityItem
                  icon={Bell}
                  title="System health check"
                  subtitle="Review settings & backup"
                  time="Weekly"
                  color="bg-sky-50 text-sky-600"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── Secondary Stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={CreditCard}
          label="Pending Invoices"
          value={s.pendingInvoices || 0}
          color="red"
          href="/admin/receivables"
        />
        <StatCard
          icon={UserCheck}
          label="Attendance Today"
          value={`${s.attendanceRate || 0}%`}
          color="teal"
          href="/attendance"
          subtitle="Present rate"
        />
        <StatCard
          icon={BookOpen}
          label="Classes"
          value={s.classes || 0}
          color="purple"
          href="/admin/classes"
          subtitle={s.sections ? `${s.sections} sections` : undefined}
        />
        <StatCard
          icon={Receipt}
          label="Payments (Month)"
          value={`GHS ${Number(s.monthlyPayments || 0).toLocaleString()}`}
          color="violet"
          href="/admin/payments"
        />
      </div>

      {/* ── Quick Actions ── */}
      <Card>
        <CardHeader className="pb-3">
          <SectionHeader icon={Activity} title="Quick Actions" />
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-wrap gap-3">
            <QuickAction icon={GraduationCap} label="Admit Student" href="/admin/students/new" color="bg-emerald-50 text-emerald-600" />
            <QuickAction icon={CreditCard} label="Bill Students" href="/admin/invoices" color="bg-red-50 text-red-600" />
            <QuickAction icon={HandCoins} label="Daily Fees" href="/admin/daily-fees" color="bg-teal-50 text-teal-600" />
            <QuickAction icon={CheckSquare} label="Attendance" href="/attendance" color="bg-purple-50 text-purple-600" />
            <QuickAction icon={Calendar} label="Timetable" href="/routine" color="bg-sky-50 text-sky-600" />
            <QuickAction icon={BarChart3} label="Reports" href="/admin/reports/finance" color="bg-amber-50 text-amber-600" />
            <QuickAction icon={Megaphone} label="Notices" href="/notices" color="bg-orange-50 text-orange-600" />
            <QuickAction icon={MessageSquare} label="Messages" href="/messages" color="bg-violet-50 text-violet-600" />
            <QuickAction icon={Bus} label="Transport" href="/admin/transport" color="bg-rose-50 text-rose-600" />
            <QuickAction icon={Library} label="Library" href="/admin/library" color="bg-teal-50 text-teal-600" />
            <QuickAction icon={Trophy} label="Online Exams" href="/admin/exams/online/create" color="bg-amber-50 text-amber-600" />
            <QuickAction icon={FileText} label="Terminal Reports" href="/admin/reports/terminal" color="bg-slate-50 text-slate-600" />
          </div>
        </CardContent>
      </Card>

      {/* ── Recent Activity ── */}
      {recentPayments && recentPayments.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <SectionHeader
              icon={Clock}
              title="Recent Payments"
              action={{ label: "View All", href: "/admin/payments" }}
            />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="max-h-72 overflow-y-auto custom-scrollbar">
              {recentPayments.slice(0, 8).map((p, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 py-2.5 border-b border-slate-100 last:border-0"
                >
                  <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                    <CircleDollarSign className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-800 truncate">
                      {p.studentName}
                    </p>
                    <p className="text-xs text-slate-400">
                      {new Date(p.timestamp).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-emerald-600 flex-shrink-0">
                    GHS {Number(p.amount).toLocaleString()}
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

// ─── Teacher Dashboard ──────────────────────────────────────
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
        <StatCard icon={GraduationCap} label="My Students" value={s.studentCount || 0} color="teal" href="/teacher/students" subtitle="Across all classes" />
        <StatCard icon={CheckSquare} label="Attendance Today" value={`${s.attendanceRate || 0}%`} color="amber" href="/teacher/attendance" subtitle={`${s.presentToday || 0} present`} />
        <StatCard icon={Megaphone} label="Notices" value={s.noticeCount || 0} color="rose" href="/notices" />
      </div>

      {/* My subjects card */}
      {s.subjects && Array.isArray(s.subjects) && s.subjects.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <SectionHeader icon={BookOpen} title="My Subjects & Classes" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {(s.subjects as { subjectName: string; className: string; classId: number; sectionName: string }[]).map((subj, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200/60">
                  <div className="w-9 h-9 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center flex-shrink-0 border border-teal-100">
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
      <Card>
        <CardHeader className="pb-3">
          <SectionHeader icon={Activity} title="Quick Actions" />
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-wrap gap-3">
            <QuickAction icon={CheckSquare} label="Mark Attendance" href="/teacher/attendance" color="bg-emerald-50 text-emerald-600" />
            <QuickAction icon={FileText} label="Enter Marks" href="/teacher/marks" color="bg-amber-50 text-amber-600" />
            <QuickAction icon={Calendar} label="Timetable" href="/routine" color="bg-sky-50 text-sky-600" />
            <QuickAction icon={GraduationCap} label="My Students" href="/teacher/students" color="bg-teal-50 text-teal-600" />
            <QuickAction icon={MessageSquare} label="Messages" href="/messages" color="bg-violet-50 text-violet-600" />
            <QuickAction icon={Megaphone} label="Notices" href="/notices" color="bg-orange-50 text-orange-600" />
            <QuickAction icon={Trophy} label="Online Exams" href="/online-exams" color="bg-purple-50 text-purple-600" />
            <QuickAction icon={BookCheck} label="Study Material" href="/teacher/study-material" color="bg-rose-50 text-rose-600" />
          </div>
        </CardContent>
      </Card>

      {/* Today's Schedule */}
      {s.todaySchedule && Array.isArray(s.todaySchedule) && s.todaySchedule.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <SectionHeader icon={Clock} title="Today's Schedule" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              {(s.todaySchedule as { period: string; subject: string; class: string; time: string }[]).map((item, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-emerald-50/50 border border-emerald-100">
                  <div className="w-12 h-12 rounded-lg bg-emerald-100 text-emerald-600 flex flex-col items-center justify-center flex-shrink-0">
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

// ─── Student Dashboard ──────────────────────────────────────
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
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl p-5 text-white">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
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
      <Card>
        <CardHeader className="pb-3">
          <SectionHeader icon={Activity} title="Quick Actions" />
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-wrap gap-3">
            <QuickAction icon={BarChart3} label="My Results" href="/results" color="bg-purple-50 text-purple-600" />
            <QuickAction icon={Receipt} label="My Invoices" href="/invoices" color="bg-red-50 text-red-600" />
            <QuickAction icon={CreditCard} label="Pay Fees" href="/student/fees" color="bg-emerald-50 text-emerald-600" />
            <QuickAction icon={CheckSquare} label="Attendance" href="/attendance" color="bg-sky-50 text-sky-600" />
            <QuickAction icon={Calendar} label="Timetable" href="/routine" color="bg-teal-50 text-teal-600" />
            <QuickAction icon={Trophy} label="Online Exams" href="/online-exams" color="bg-amber-50 text-amber-600" />
            <QuickAction icon={MessageSquare} label="Messages" href="/messages" color="bg-violet-50 text-violet-600" />
            <QuickAction icon={Library} label="Library" href="/library" color="bg-rose-50 text-rose-600" />
          </div>
        </CardContent>
      </Card>

      {/* Recent notices */}
      {s.notices && Array.isArray(s.notices) && s.notices.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <SectionHeader icon={Bell} title="Recent Notices" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="max-h-72 overflow-y-auto custom-scrollbar">
              {(s.notices as { title: string; notice: string; date: string }[]).slice(0, 5).map((notice, i) => (
                <div key={i} className="flex items-start gap-3 py-2.5 border-b border-slate-100 last:border-0">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0 mt-0.5 border border-amber-100">
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

// ─── Parent Dashboard ───────────────────────────────────────
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={GraduationCap} label="My Children" value={childCount} color="emerald" href="/parent/children" subtitle="Enrolled students" />
        <StatCard icon={Receipt} label="Total Fees Due" value={data.totalOutstanding ? `GHS ${Number(data.totalOutstanding).toLocaleString()}` : "GHS 0"} color="red" href="/parent/invoices" />
        <StatCard icon={CreditCard} label="Paid (Month)" value={data.monthlyPayments ? `GHS ${Number(data.monthlyPayments).toLocaleString()}` : "GHS 0"} color="teal" href="/parent/payments" />
        <StatCard icon={CheckSquare} label="Avg. Attendance" value={data.avgAttendance ? `${Number(data.avgAttendance).toFixed(0)}%` : "N/A"} color="sky" href="/attendance" />
      </div>

      {/* Children cards */}
      {children && children.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <SectionHeader icon={GraduationCap} title="My Children" action={{ label: "View All", href: "/parent/children" }} />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {children.map((child) => {
                const enroll = child.enrolls?.[0];
                return (
                  <div
                    key={child.student_id}
                    onClick={() => window.location.href = `/parent/children`}
                    className="p-4 rounded-xl border border-slate-200/80 hover:shadow-md cursor-pointer transition-all bg-white"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-semibold text-sm border border-emerald-100">
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
      <Card>
        <CardHeader className="pb-3">
          <SectionHeader icon={Activity} title="Quick Actions" />
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-wrap gap-3">
            <QuickAction icon={BarChart3} label="Results" href="/results" color="bg-purple-50 text-purple-600" />
            <QuickAction icon={CreditCard} label="Pay Fees" href="/parent/payments" color="bg-red-50 text-red-600" />
            <QuickAction icon={Receipt} label="Invoices" href="/parent/invoices" color="bg-emerald-50 text-emerald-600" />
            <QuickAction icon={CheckSquare} label="Attendance" href="/attendance" color="bg-sky-50 text-sky-600" />
            <QuickAction icon={Calendar} label="Timetable" href="/routine" color="bg-teal-50 text-teal-600" />
            <QuickAction icon={MessageSquare} label="Messages" href="/messages" color="bg-violet-50 text-violet-600" />
            <QuickAction icon={Megaphone} label="Notices" href="/notices" color="bg-orange-50 text-orange-600" />
            <QuickAction icon={Users} label="Teachers" href="/parent/teachers" color="bg-slate-50 text-slate-600" />
          </div>
        </CardContent>
      </Card>

      {/* Recent notices */}
      {data.notices && Array.isArray(data.notices) && data.notices.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <SectionHeader icon={Bell} title="School Notices" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="max-h-72 overflow-y-auto custom-scrollbar">
              {(data.notices as { title: string; notice: string; date: string }[]).slice(0, 5).map((notice, i) => (
                <div key={i} className="flex items-start gap-3 py-2.5 border-b border-slate-100 last:border-0">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0 mt-0.5 border border-amber-100">
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

// ─── Accountant Dashboard ───────────────────────────────────
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
  const collectionRate = Number(s.collectionRate || 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={TrendingUp} label="Monthly Revenue" value={`GHS ${Number(s.monthlyRevenue || 0).toLocaleString()}`} color="emerald" href="/accountant/reports" subtitle="This month" />
        <StatCard icon={TrendingDown} label="Monthly Expenses" value={`GHS ${Number(s.monthlyExpenses || 0).toLocaleString()}`} color="red" href="/accountant/expenses" subtitle="This month" />
        <StatCard icon={Receipt} label="Outstanding" value={`GHS ${Number(s.outstanding || 0).toLocaleString()}`} color="amber" href="/admin/receivables" subtitle={s.outstandingCount ? `${s.outstandingCount} invoices` : undefined} />
        <StatCard icon={PiggyBank} label="Bank Balance" value={`GHS ${Number(s.bankBalance || 0).toLocaleString()}`} color="teal" href="/accountant/reports" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={CreditCard} label="Today Collections" value={`GHS ${Number(s.todayTotal || 0).toLocaleString()}`} color="sky" href="/accountant/payments" subtitle={s.todayCount ? `${s.todayCount} payments` : undefined} />
        <StatCard icon={HandCoins} label="Net Income" value={`GHS ${Number(s.netIncome || 0).toLocaleString()}`} color="violet" href="/accountant/reports" />
        <StatCard icon={BarChart3} label="Pending Entries" value={s.pendingEntries || 0} color="orange" href="/accountant/reconciliation" subtitle="Draft journal entries" />
        <StatCard icon={Users} label="Owing Students" value={s.owingCount || 0} color="rose" href="/accountant/reports" />
      </div>

      {/* Collection performance */}
      <Card>
        <CardHeader className="pb-3">
          <SectionHeader icon={TrendingUp} title="Collection Performance" />
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Invoice Collection Rate</span>
                <span className="text-sm font-bold text-emerald-600">
                  {collectionRate.toFixed(1)}%
                </span>
              </div>
              <Progress value={collectionRate} className="h-3" />
            </div>
            <div className="grid grid-cols-3 gap-4 pt-2">
              <div className="text-center p-3 rounded-lg bg-emerald-50 border border-emerald-100">
                <p className="text-lg font-bold text-emerald-600">{s.paidCount || 0}</p>
                <p className="text-xs text-slate-500">Paid</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-amber-50 border border-amber-100">
                <p className="text-lg font-bold text-amber-600">{s.partialCount || 0}</p>
                <p className="text-xs text-slate-500">Partial</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-red-50 border border-red-100">
                <p className="text-lg font-bold text-red-600">{s.unpaidCount || 0}</p>
                <p className="text-xs text-slate-500">Unpaid</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick actions */}
      <Card>
        <CardHeader className="pb-3">
          <SectionHeader icon={Activity} title="Quick Actions" />
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-wrap gap-3">
            <QuickAction icon={Receipt} label="Invoices" href="/invoices" color="bg-red-50 text-red-600" />
            <QuickAction icon={CreditCard} label="Record Payment" href="/accountant/payments" color="bg-emerald-50 text-emerald-600" />
            <QuickAction icon={TrendingDown} label="Expenses" href="/accountant/expenses" color="bg-amber-50 text-amber-600" />
            <QuickAction icon={BarChart3} label="Reports" href="/accountant/reports" color="bg-purple-50 text-purple-600" />
            <QuickAction icon={PiggyBank} label="Payroll" href="/accountant/payroll" color="bg-teal-50 text-teal-600" />
            <QuickAction icon={Scale} label="Reconciliation" href="/accountant/reconciliation" color="bg-sky-50 text-sky-600" />
          </div>
        </CardContent>
      </Card>

      {/* Top debtors */}
      {s.topDebtors && Array.isArray(s.topDebtors) && s.topDebtors.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <SectionHeader icon={AlertTriangle} title="Top Debtors" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="max-h-72 overflow-y-auto custom-scrollbar">
              {(s.topDebtors as { studentName: string; outstanding: number; class: string }[]).slice(0, 10).map((debtor, i) => (
                <div key={i} className="flex items-center gap-3 py-2.5 border-b border-slate-100 last:border-0">
                  <span className="w-6 h-6 rounded-full bg-red-50 text-red-600 flex items-center justify-center text-xs font-bold flex-shrink-0 border border-red-100">
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

// ─── Librarian Dashboard ────────────────────────────────────
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
        <StatCard icon={BookCheck} label="Available" value={s.availableBooks || 0} color="teal" href="/librarian/books" />
        <StatCard icon={Clock} label="Pending Requests" value={s.pendingRequests || 0} color="amber" href="/librarian/requests" />
        <StatCard icon={AlertTriangle} label="Overdue" value={s.overdueRequests || 0} color="red" href="/librarian/requests" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={HandCoins} label="Collection Value" value={s.totalValue ? `GHS ${Number(s.totalValue).toLocaleString()}` : "GHS 0"} color="violet" />
        <StatCard icon={Users} label="Total Copies" value={s.totalCopies || 0} color="sky" />
        <StatCard icon={CheckSquare} label="Returned" value={s.returnedRequests || 0} color="emerald" />
        <StatCard icon={Megaphone} label="Notices" value={s.noticeCount || 0} color="orange" href="/notices" />
      </div>

      {/* Quick actions */}
      <Card>
        <CardHeader className="pb-3">
          <SectionHeader icon={Activity} title="Quick Actions" />
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-wrap gap-3">
            <QuickAction icon={BookOpen} label="Manage Books" href="/librarian/books" color="bg-emerald-50 text-emerald-600" />
            <QuickAction icon={BookCheck} label="Book Requests" href="/librarian/requests" badge={Number(s.pendingRequests || 0)} color="bg-teal-50 text-teal-600" />
            <QuickAction icon={CheckSquare} label="Book Returns" href="/librarian/returns" color="bg-amber-50 text-amber-600" />
            <QuickAction icon={Megaphone} label="Notices" href="/notices" color="bg-orange-50 text-orange-600" />
          </div>
        </CardContent>
      </Card>

      {/* Popular books */}
      {s.popularBooks && Array.isArray(s.popularBooks) && s.popularBooks.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <SectionHeader icon={Trophy} title="Most Borrowed Books" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="max-h-72 overflow-y-auto custom-scrollbar">
              {(s.popularBooks as { name: string; author: string; issuedCopies: number; category: string }[]).slice(0, 5).map((book, i) => {
                const medalColors = i === 0 ? "bg-yellow-50 text-yellow-600 border-yellow-100" : i === 1 ? "bg-slate-100 text-slate-600 border-slate-200" : i === 2 ? "bg-amber-50 text-amber-700 border-amber-100" : "bg-slate-50 text-slate-500 border-slate-200";
                return (
                  <div key={i} className="flex items-center gap-3 py-2.5 border-b border-slate-100 last:border-0">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 border ${medalColors}`}>
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

// ─── Main Unified Dashboard ─────────────────────────────────
export default function UnifiedDashboard() {
  const { role, isLoading, isAuthenticated, isAdmin, isTeacher, isStudent, isParent, isAccountant, isLibrarian, user } = useAuth();
  const router = useRouter();

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
        {/* ─── Welcome Header with Live Clock ──────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Welcome back, {user?.name || roleLabel}
            </h1>
            <div className="flex items-center gap-2 mt-1.5">
              <Badge
                variant="outline"
                className="text-emerald-700 border-emerald-200 bg-emerald-50 font-medium"
              >
                {roleLabel}
              </Badge>
              <span className="text-sm text-slate-500">
                Here&apos;s your dashboard overview
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-slate-500 flex-shrink-0">
            <CalendarDays className="w-4 h-4 text-emerald-600" />
            <LiveClock />
          </div>
        </div>

        {/* ─── Role-specific Dashboard ──────────────── */}
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
