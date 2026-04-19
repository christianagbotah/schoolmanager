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
  Star,
  Timer,
  PlayCircle,
  BookMarked,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  ClipboardList,
  Eye,
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

// ─── Gradient Color Map for Stat Cards ────────────────────
const gradientStyles: Record<string, string> = {
  emerald: "bg-gradient-to-br from-emerald-500 to-emerald-600",
  teal: "bg-gradient-to-br from-teal-500 to-teal-600",
  amber: "bg-gradient-to-br from-amber-500 to-amber-600",
  rose: "bg-gradient-to-br from-rose-500 to-rose-600",
  orange: "bg-gradient-to-br from-orange-500 to-orange-600",
  violet: "bg-gradient-to-br from-violet-500 to-violet-600",
  sky: "bg-gradient-to-br from-sky-500 to-sky-600",
  slate: "bg-gradient-to-br from-slate-500 to-slate-600",
  red: "bg-gradient-to-br from-red-500 to-red-600",
  purple: "bg-gradient-to-br from-purple-500 to-purple-600",
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

// ─── Gradient Stat Card ───────────────────────────────────
function GradientStatCard({
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
    <Card
      className="hover:shadow-xl transition-all duration-300 cursor-pointer border-0 bg-white group overflow-hidden relative"
    >
      {/* Gradient top accent bar */}
      <div className={`h-1.5 w-full ${gradientStyles[color] || gradientStyles.emerald}`} />
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
              {label}
            </p>
            <p className="text-2xl font-bold text-slate-900 mt-2 leading-none group-hover:scale-105 transition-transform origin-left">
              {value}
            </p>
            <div className="flex items-center gap-2 mt-2">
              {trend && (
                <span
                  className={`inline-flex items-center gap-0.5 text-[11px] font-semibold px-1.5 py-0.5 rounded-full ${
                    trend.up
                      ? "bg-emerald-50 text-emerald-600"
                      : "bg-red-50 text-red-600"
                  }`}
                >
                  {trend.up ? (
                    <ArrowUpRight className="w-3 h-3" />
                  ) : (
                    <ArrowDownRight className="w-3 h-3" />
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
            className={`w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center shadow-sm ${
              gradientStyles[color] || gradientStyles.emerald
            }`}
          >
            <Icon className="w-5 h-5 text-white" />
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

// ─── Timeline Slot (for teacher schedule) ─────────────────
function TimelineSlot({
  period,
  subject,
  className,
  time,
  isCurrent,
  isLast,
}: {
  period: string;
  subject: string;
  className: string;
  time: string;
  isCurrent?: boolean;
  isLast?: boolean;
}) {
  return (
    <div className="flex gap-4">
      {/* Timeline line */}
      <div className="flex flex-col items-center">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 border-2 ${
            isCurrent
              ? "bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/30"
              : "bg-white border-emerald-200 text-emerald-600"
          }`}
        >
          {isCurrent ? (
            <PlayCircle className="w-4 h-4" />
          ) : (
            <span className="text-xs font-bold">P{period}</span>
          )}
        </div>
        {!isLast && (
          <div className={`w-0.5 flex-1 min-h-[32px] ${isCurrent ? "bg-emerald-200" : "bg-slate-200"}`} />
        )}
      </div>

      {/* Content card */}
      <div className={`pb-6 flex-1 ${isLast ? "pb-0" : ""}`}>
        <div
          className={`p-3.5 rounded-xl border transition-all ${
            isCurrent
              ? "bg-emerald-50 border-emerald-200 shadow-sm shadow-emerald-500/10"
              : "bg-white border-slate-200/80 hover:border-emerald-200 hover:bg-emerald-50/30"
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className={`text-sm font-semibold ${isCurrent ? "text-emerald-700" : "text-slate-800"}`}>
                {subject}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">{className}</p>
            </div>
            <div className="flex items-center gap-1 text-xs text-slate-500 flex-shrink-0">
              <Timer className="w-3 h-3" />
              {time}
            </div>
          </div>
          {isCurrent && (
            <Badge className="mt-2 bg-emerald-500 text-white text-[10px] border-0">
              Current Period
            </Badge>
          )}
        </div>
      </div>
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
  const schedule = s.todaySchedule as { period: string; subject: string; class: string; time: string }[] | undefined;
  const subjects = s.subjects as { subjectName: string; className: string; classId: number; sectionName: string }[] | undefined;

  // Determine current period based on time
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentPeriodIndex = schedule ? schedule.findIndex((item) => {
    const parts = item.time.split(" - ");
    if (parts.length < 2) return false;
    const startParts = parts[0].trim().split(/[: ]/);
    let startH = parseInt(startParts[0], 10);
    const startAP = parts[0].trim().toUpperCase().includes("PM");
    if (startAP && startH !== 12) startH += 12;
    if (!startAP && startH === 12) startH = 0;
    const endParts = parts[1].trim().split(/[: ]/);
    let endH = parseInt(endParts[0], 10);
    const endAP = parts[1].trim().toUpperCase().includes("PM");
    if (endAP && endH !== 12) endH += 12;
    if (!endAP && endH === 12) endH = 0;
    const currentMins = currentHour * 60 + currentMinute;
    return currentMins >= startH * 60 && currentMins < endH * 60;
  }) : -1;

  return (
    <div className="space-y-6">
      {/* ── Gradient Stat Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <GradientStatCard
          icon={BookOpen}
          label="My Classes"
          value={s.classCount || 0}
          color="emerald"
          href="/teacher/classes"
          subtitle={`${s.subjectCount || 0} subjects assigned`}
        />
        <GradientStatCard
          icon={GraduationCap}
          label="My Students"
          value={s.studentCount || 0}
          color="teal"
          href="/teacher/students"
          subtitle="Across all classes"
        />
        <GradientStatCard
          icon={CheckSquare}
          label="Attendance Today"
          value={`${s.attendanceRate || 0}%`}
          color="amber"
          href="/teacher/attendance"
          subtitle={`${s.presentToday || 0} present`}
        />
        <GradientStatCard
          icon={Megaphone}
          label="Notices"
          value={s.noticeCount || 0}
          color="rose"
          href="/notices"
        />
      </div>

      {/* ── Today's Schedule Timeline ── */}
      {schedule && schedule.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <SectionHeader
              icon={Clock}
              title="Today's Schedule"
              action={{ label: "Full Timetable", href: "/routine" }}
            />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="max-h-[420px] overflow-y-auto custom-scrollbar pr-2">
              {schedule.map((item, i) => (
                <TimelineSlot
                  key={i}
                  period={item.period}
                  subject={item.subject}
                  className={item.class}
                  time={item.time}
                  isCurrent={i === currentPeriodIndex}
                  isLast={i === schedule.length - 1}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── My Subjects & Classes ── */}
      {subjects && subjects.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <SectionHeader icon={BookOpen} title="My Subjects & Classes" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {subjects.map((subj, i) => {
                const colorIndex = i % 5;
                const colors = [
                  { bg: "bg-emerald-50", border: "border-emerald-200", accent: "bg-emerald-500", text: "text-emerald-700" },
                  { bg: "bg-teal-50", border: "border-teal-200", accent: "bg-teal-500", text: "text-teal-700" },
                  { bg: "bg-violet-50", border: "border-violet-200", accent: "bg-violet-500", text: "text-violet-700" },
                  { bg: "bg-amber-50", border: "border-amber-200", accent: "bg-amber-500", text: "text-amber-700" },
                  { bg: "bg-sky-50", border: "border-sky-200", accent: "bg-sky-500", text: "text-sky-700" },
                ];
                const c = colors[colorIndex];
                return (
                  <div key={i} className={`relative p-4 rounded-xl ${c.bg} border ${c.border} hover:shadow-md transition-all`}>
                    <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-xl ${c.accent}`} />
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-lg ${c.accent} text-white flex items-center justify-center flex-shrink-0 shadow-sm`}>
                        <BookOpen className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className={`text-sm font-semibold ${c.text} truncate`}>{subj.subjectName}</p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="text-xs text-slate-500">{subj.className}</span>
                          <span className="text-slate-300">&middot;</span>
                          <span className="text-xs text-slate-500">Sec {subj.sectionName}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Quick Actions Grid ── */}
      <Card>
        <CardHeader className="pb-3">
          <SectionHeader icon={Activity} title="Quick Actions" />
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-4 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            <QuickAction icon={CheckSquare} label="Attendance" href="/teacher/attendance" color="bg-emerald-50 text-emerald-600" />
            <QuickAction icon={FileText} label="Enter Marks" href="/teacher/marks" color="bg-amber-50 text-amber-600" />
            <QuickAction icon={Calendar} label="Timetable" href="/routine" color="bg-sky-50 text-sky-600" />
            <QuickAction icon={GraduationCap} label="Students" href="/teacher/students" color="bg-teal-50 text-teal-600" />
            <QuickAction icon={MessageSquare} label="Messages" href="/messages" color="bg-violet-50 text-violet-600" />
            <QuickAction icon={Megaphone} label="Notices" href="/notices" color="bg-orange-50 text-orange-600" />
            <QuickAction icon={Trophy} label="Exams" href="/online-exams" color="bg-purple-50 text-purple-600" />
            <QuickAction icon={BookCheck} label="Materials" href="/teacher/study-material" color="bg-rose-50 text-rose-600" />
          </div>
        </CardContent>
      </Card>

      {/* ── Recent Activity Feed ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <SectionHeader icon={ClipboardList} title="Recent Activity" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-0">
              <ActivityItem
                icon={CheckSquare}
                title="Attendance recorded"
                subtitle={`${s.presentToday || 0} students marked present today`}
                time="Today"
                color="bg-emerald-50 text-emerald-600"
              />
              {s.noticeCount > 0 && (
                <ActivityItem
                  icon={Megaphone}
                  title={`${s.noticeCount} new notice${Number(s.noticeCount) > 1 ? "s" : ""}`}
                  subtitle="Check the latest announcements"
                  time="Recent"
                  color="bg-amber-50 text-amber-600"
                />
              )}
              <ActivityItem
                icon={BookOpen}
                title="Schedule updated"
                subtitle="View your weekly timetable"
                time="This week"
                color="bg-sky-50 text-sky-600"
              />
              <ActivityItem
                icon={FileText}
                title="Marks entry"
                subtitle="Enter marks for recent assessments"
                time="Pending"
                color="bg-violet-50 text-violet-600"
              />
            </div>
          </CardContent>
        </Card>

        {/* Attendance summary mini-card */}
        <Card>
          <CardHeader className="pb-3">
            <SectionHeader icon={UserCheck} title="Attendance Overview" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl bg-emerald-50 border border-emerald-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500 text-white flex items-center justify-center">
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Present Today</p>
                    <p className="text-xs text-slate-500">{s.studentCount || 0} total students</p>
                  </div>
                </div>
                <span className="text-2xl font-bold text-emerald-600">{s.attendanceRate || 0}%</span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Present</span>
                  <span className="font-semibold text-emerald-600">{s.presentToday || 0}</span>
                </div>
                <Progress value={Number(s.attendanceRate || 0)} className="h-2.5" />
              </div>
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/60 text-center">
                  <p className="text-lg font-bold text-slate-700">{s.classCount || 0}</p>
                  <p className="text-xs text-slate-500">Classes</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/60 text-center">
                  <p className="text-lg font-bold text-slate-700">{s.subjectCount || 0}</p>
                  <p className="text-xs text-slate-500">Subjects</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
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
  const attendanceRate = Number(s.attendanceRate || 0);
  const avgScore = Number(s.averageScore || 0);

  return (
    <div className="space-y-6">
      {/* ── Enhanced Student Info Banner ── */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-violet-600 via-purple-600 to-emerald-600 p-6 text-white">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-1/2 w-40 h-40 bg-white/5 rounded-full translate-y-1/2" />
        <div className="absolute top-4 right-4">
          <Sparkles className="w-5 h-5 text-white/30" />
        </div>

        <div className="relative flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-sm shadow-lg border border-white/20">
            <GraduationCap className="w-8 h-8" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold tracking-tight">{student?.name || "Student"}</h2>
            <div className="flex flex-wrap items-center gap-2 mt-1.5">
              <span className="text-sm opacity-90 font-mono">{student?.student_code || ""}</span>
              {enroll && (
                <>
                  <span className="opacity-50">|</span>
                  <Badge className="bg-white/20 text-white border-white/30 hover:bg-white/30">
                    {enroll.class.name} {enroll.class.name_numeric}
                  </Badge>
                  <Badge variant="outline" className="text-white/90 border-white/30 hover:bg-white/10">
                    Sec {enroll.section.name}
                  </Badge>
                </>
              )}
            </div>
          </div>
          <div className="hidden sm:flex flex-col items-end gap-1">
            <div className="flex items-center gap-1 text-sm opacity-80">
              <CalendarDays className="w-3.5 h-3.5" />
              <span>{new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}</span>
            </div>
            <div className="flex items-center gap-1 text-sm opacity-80">
              <Clock className="w-3.5 h-3.5" />
              <LiveClock />
            </div>
          </div>
        </div>
      </div>

      {/* ── Performance Summary Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <GradientStatCard
          icon={BarChart3}
          label="Average Score"
          value={avgScore > 0 ? `${avgScore.toFixed(1)}%` : "N/A"}
          color="purple"
          href="/results"
          subtitle={s.examCount ? `${s.examCount} exams taken` : undefined}
        />
        <GradientStatCard
          icon={CheckSquare}
          label="Attendance"
          value={attendanceRate > 0 ? `${attendanceRate.toFixed(0)}%` : "N/A"}
          color="emerald"
          href="/attendance"
          subtitle={s.daysPresent ? `${s.daysPresent} days present` : undefined}
        />
        <GradientStatCard
          icon={Trophy}
          label="Class Rank"
          value={s.rank || "N/A"}
          color="amber"
          href="/results"
          subtitle={s.classSize ? `of ${s.classSize} students` : undefined}
        />
        <GradientStatCard
          icon={Receipt}
          label="Outstanding Fees"
          value={s.outstanding ? `GHS ${Number(s.outstanding).toLocaleString()}` : "GHS 0"}
          color="red"
          href="/invoices"
          subtitle={s.invoiceCount ? `${s.invoiceCount} invoices` : undefined}
        />
      </div>

      {/* ── Performance & Fees Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Academic Performance */}
        <Card>
          <CardHeader className="pb-3">
            <SectionHeader icon={Star} title="Academic Performance" action={{ label: "View Results", href: "/results" }} />
          </CardHeader>
          <CardContent className="pt-0 space-y-4">
            <div className="flex items-center gap-4 p-4 rounded-xl bg-purple-50 border border-purple-100">
              <div className="w-12 h-12 rounded-xl bg-purple-500 text-white flex items-center justify-center shadow-sm">
                <BarChart3 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-purple-600 font-medium">Overall Average</p>
                <p className="text-2xl font-bold text-purple-700">{avgScore > 0 ? `${avgScore.toFixed(1)}%` : "N/A"}</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Performance</span>
                <span className={`font-semibold ${avgScore >= 80 ? "text-emerald-600" : avgScore >= 60 ? "text-amber-600" : avgScore > 0 ? "text-red-600" : "text-slate-400"}`}>
                  {avgScore >= 80 ? "Excellent" : avgScore >= 60 ? "Good" : avgScore > 0 ? "Needs Improvement" : "No data"}
                </span>
              </div>
              <Progress value={avgScore} className="h-2.5" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-100 text-center">
                <p className="text-lg font-bold text-emerald-600">{s.examCount || 0}</p>
                <p className="text-[11px] text-slate-500">Exams</p>
              </div>
              <div className="p-3 rounded-lg bg-sky-50 border border-sky-100 text-center">
                <p className="text-lg font-bold text-sky-600">{attendanceRate > 0 ? `${attendanceRate.toFixed(0)}%` : "--"}</p>
                <p className="text-[11px] text-slate-500">Attendance</p>
              </div>
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-100 text-center">
                <p className="text-lg font-bold text-amber-600">{s.rank || "--"}</p>
                <p className="text-[11px] text-slate-500">Rank</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Fee Status */}
        <Card>
          <CardHeader className="pb-3">
            <SectionHeader icon={Wallet} title="Fee Status" action={{ label: "Pay Now", href: "/student/fees" }} />
          </CardHeader>
          <CardContent className="pt-0 space-y-4">
            <div className="flex items-center gap-4 p-4 rounded-xl bg-red-50 border border-red-100">
              <div className="w-12 h-12 rounded-xl bg-red-500 text-white flex items-center justify-center shadow-sm">
                <Receipt className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-red-600 font-medium">Outstanding Balance</p>
                <p className="text-2xl font-bold text-red-700">
                  GHS {Number(s.outstanding || 0).toLocaleString()}
                </p>
              </div>
            </div>
            {Number(s.outstanding || 0) > 0 && (
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-100 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <p className="text-xs text-amber-700">
                  You have <span className="font-semibold">{s.invoiceCount || 0} unpaid invoice{(s.invoiceCount as number) > 1 ? "s" : ""}</span>. Please pay to avoid penalties.
                </p>
              </div>
            )}
            <div className="flex items-center gap-2">
              <button
                onClick={() => window.location.href = "/student/fees"}
                className="flex-1 min-h-[44px] bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                <CreditCard className="w-4 h-4" />
                Pay Fees Online
              </button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Upcoming Events & Notices ── */}
      {s.notices && Array.isArray(s.notices) && s.notices.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <SectionHeader icon={Bell} title="Upcoming Events & Notices" action={{ label: "View All", href: "/notices" }} />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="max-h-72 overflow-y-auto custom-scrollbar space-y-2">
              {(s.notices as { title: string; notice: string; date: string }[]).slice(0, 5).map((notice, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-200/60">
                  <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0 border border-amber-100">
                    <CalendarDays className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-800 truncate">{notice.title}</p>
                    <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">{notice.notice}</p>
                  </div>
                  <Badge variant="outline" className="text-[10px] flex-shrink-0 text-slate-400">
                    {notice.date ? new Date(notice.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "N/A"}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Quick Actions ── */}
      <Card>
        <CardHeader className="pb-3">
          <SectionHeader icon={Activity} title="Quick Actions" />
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-4 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            <QuickAction icon={BarChart3} label="Results" href="/results" color="bg-purple-50 text-purple-600" />
            <QuickAction icon={Receipt} label="Invoices" href="/invoices" color="bg-red-50 text-red-600" />
            <QuickAction icon={CreditCard} label="Pay Fees" href="/student/fees" color="bg-emerald-50 text-emerald-600" />
            <QuickAction icon={CheckSquare} label="Attendance" href="/attendance" color="bg-sky-50 text-sky-600" />
            <QuickAction icon={Calendar} label="Timetable" href="/routine" color="bg-teal-50 text-teal-600" />
            <QuickAction icon={Trophy} label="Exams" href="/online-exams" color="bg-amber-50 text-amber-600" />
            <QuickAction icon={MessageSquare} label="Messages" href="/messages" color="bg-violet-50 text-violet-600" />
            <QuickAction icon={Library} label="Library" href="/library" color="bg-rose-50 text-rose-600" />
          </div>
        </CardContent>
      </Card>
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

  const children = data.children as { student_id: number; student_code: string; name: string; sex?: string; outstanding?: number; attendance?: number; enrolls: { class: { name: string; name_numeric: string; category: string }; section: { name: string } }[] }[] | undefined;
  const childCount = children?.length || 0;
  const notices = data.notices as { title: string; notice: string; date: string }[] | undefined;
  const avgAttendance = Number(data.avgAttendance || 0);

  return (
    <div className="space-y-6">
      {/* ── Parent Welcome Banner ── */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 p-6 text-white">
        <div className="absolute top-0 right-0 w-56 h-56 bg-white/5 rounded-full -translate-y-1/3 translate-x-1/4" />
        <div className="absolute bottom-0 left-1/3 w-32 h-32 bg-white/5 rounded-full translate-y-1/2" />
        <div className="relative flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-sm shadow-lg border border-white/20">
            <Users className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tight">Parent Portal</h2>
            <p className="text-sm opacity-90 mt-0.5">
              Managing <span className="font-semibold">{childCount}</span> {childCount === 1 ? "child" : "children"} at Greenfield Academy
            </p>
          </div>
        </div>
      </div>

      {/* ── Summary Stat Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <GradientStatCard
          icon={GraduationCap}
          label="My Children"
          value={childCount}
          color="emerald"
          href="/parent/children"
          subtitle="Enrolled students"
        />
        <GradientStatCard
          icon={Receipt}
          label="Total Fees Due"
          value={data.totalOutstanding ? `GHS ${Number(data.totalOutstanding).toLocaleString()}` : "GHS 0"}
          color="red"
          href="/parent/invoices"
        />
        <GradientStatCard
          icon={CreditCard}
          label="Paid (Month)"
          value={data.monthlyPayments ? `GHS ${Number(data.monthlyPayments).toLocaleString()}` : "GHS 0"}
          color="teal"
          href="/parent/payments"
        />
        <GradientStatCard
          icon={CheckSquare}
          label="Avg. Attendance"
          value={avgAttendance > 0 ? `${avgAttendance.toFixed(0)}%` : "N/A"}
          color="sky"
          href="/attendance"
        />
      </div>

      {/* ── Children Cards with Photos & Fee Summary ── */}
      {children && children.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <SectionHeader icon={GraduationCap} title="My Children" action={{ label: "View All", href: "/parent/children" }} />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {children.map((child) => {
                const enroll = child.enrolls?.[0];
                const outstanding = Number(child.outstanding || 0);
                const attendance = Number(child.attendance || 0);
                const initials = child.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
                const genderColor = child.sex?.toLowerCase() === "f"
                  ? { bg: "from-rose-400 to-pink-500", ring: "ring-rose-200" }
                  : { bg: "from-sky-400 to-blue-500", ring: "ring-sky-200" };
                return (
                  <div
                    key={child.student_id}
                    onClick={() => window.location.href = "/parent/children"}
                    className="relative p-5 rounded-xl border border-slate-200/80 hover:shadow-lg cursor-pointer transition-all bg-white group overflow-hidden"
                  >
                    {/* Top accent line */}
                    <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${genderColor.bg}`} />
                    <div className="flex items-start gap-4">
                      {/* Avatar */}
                      <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${genderColor.bg} text-white flex items-center justify-center font-bold text-lg shadow-md ring-4 ${genderColor.ring} group-hover:scale-105 transition-transform`}>
                        {initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-base font-semibold text-slate-800 truncate group-hover:text-emerald-700 transition-colors">{child.name}</p>
                        <p className="text-xs text-slate-400 font-mono">{child.student_code}</p>
                        {enroll && (
                          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                            <Badge variant="outline" className="text-xs font-medium">
                              {enroll.class.name} {enroll.class.name_numeric}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              {enroll.section.name}
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>
                    {/* Fee & attendance summary */}
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200/60">
                        <Wallet className="w-3.5 h-3.5 text-red-500" />
                        <div className="min-w-0">
                          <p className="text-[10px] text-slate-400 uppercase">Fees Due</p>
                          <p className={`text-sm font-bold ${outstanding > 0 ? "text-red-600" : "text-emerald-600"}`}>
                            {outstanding > 0 ? `GHS ${outstanding.toLocaleString()}` : "Clear"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200/60">
                        <CheckSquare className="w-3.5 h-3.5 text-emerald-500" />
                        <div className="min-w-0">
                          <p className="text-[10px] text-slate-400 uppercase">Attendance</p>
                          <p className="text-sm font-bold text-emerald-600">{attendance > 0 ? `${attendance.toFixed(0)}%` : "N/A"}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Combined Attendance View ── */}
      <Card>
        <CardHeader className="pb-3">
          <SectionHeader icon={UserCheck} title="Attendance Overview" action={{ label: "Details", href: "/attendance" }} />
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center gap-4 p-4 rounded-xl bg-emerald-50 border border-emerald-100">
            <div className="w-12 h-12 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-sm">
              <UserCheck className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-slate-800">Average Attendance Across All Children</p>
              <p className="text-xs text-slate-500 mt-0.5">Combined attendance rate</p>
            </div>
            <span className="text-2xl font-bold text-emerald-600">{avgAttendance > 0 ? `${avgAttendance.toFixed(0)}%` : "N/A"}</span>
          </div>
          {avgAttendance > 0 && (
            <div className="mt-3">
              <Progress value={avgAttendance} className="h-2.5" />
              <div className="flex justify-between mt-1">
                <span className="text-[10px] text-slate-400">0%</span>
                <span className="text-[10px] text-slate-400">Target: 95%</span>
              </div>
            </div>
          )}
          {children && children.length > 1 && (
            <div className="mt-4 grid grid-cols-2 lg:grid-cols-3 gap-2">
              {children.map((child) => {
                const att = Number(child.attendance || 0);
                return (
                  <div key={child.student_id} className="flex items-center gap-2 p-2 rounded-lg bg-slate-50">
                    <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-[10px] font-bold">
                      {child.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-700 truncate">{child.name.split(" ")[0]}</p>
                      <div className="flex items-center gap-1">
                        <Progress value={att} className="h-1 flex-1" />
                        <span className="text-[10px] font-semibold text-slate-500">{att > 0 ? `${att.toFixed(0)}%` : "--"}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Quick Actions ── */}
      <Card>
        <CardHeader className="pb-3">
          <SectionHeader icon={Activity} title="Quick Actions" />
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-4 sm:grid-cols-4 lg:grid-cols-8 gap-3">
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

      {/* ── School Notices ── */}
      {notices && notices.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <SectionHeader icon={Bell} title="School Notices" action={{ label: "All Notices", href: "/notices" }} />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="max-h-72 overflow-y-auto custom-scrollbar space-y-2">
              {notices.slice(0, 5).map((notice, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-200/60">
                  <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0 border border-amber-100">
                    <Megaphone className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-800 truncate">{notice.title}</p>
                    <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">{notice.notice}</p>
                  </div>
                  <Badge variant="outline" className="text-[10px] flex-shrink-0 text-slate-400">
                    {notice.date ? new Date(notice.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "N/A"}
                  </Badge>
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
  const monthlyRevenue = Number(s.monthlyRevenue || 0);
  const monthlyExpenses = Number(s.monthlyExpenses || 0);
  const netIncome = Number(s.netIncome || 0);

  return (
    <div className="space-y-6">
      {/* ── Financial KPI Cards with Trend Indicators ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <GradientStatCard
          icon={TrendingUp}
          label="Monthly Revenue"
          value={`GHS ${monthlyRevenue.toLocaleString()}`}
          color="emerald"
          href="/accountant/reports"
          subtitle="This month"
          trend={{ value: "Revenue", up: monthlyRevenue > 0 }}
        />
        <GradientStatCard
          icon={TrendingDown}
          label="Monthly Expenses"
          value={`GHS ${monthlyExpenses.toLocaleString()}`}
          color="red"
          href="/accountant/expenses"
          subtitle="This month"
          trend={{ value: "Expenses", up: false }}
        />
        <GradientStatCard
          icon={Receipt}
          label="Outstanding"
          value={`GHS ${Number(s.outstanding || 0).toLocaleString()}`}
          color="amber"
          href="/admin/receivables"
          subtitle={s.outstandingCount ? `${s.outstandingCount} invoices` : undefined}
          trend={{ value: "Pending", up: false }}
        />
        <GradientStatCard
          icon={PiggyBank}
          label="Bank Balance"
          value={`GHS ${Number(s.bankBalance || 0).toLocaleString()}`}
          color="teal"
          href="/accountant/reports"
        />
      </div>

      {/* ── Secondary Stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={CreditCard} label="Today Collections" value={`GHS ${Number(s.todayTotal || 0).toLocaleString()}`} color="sky" href="/accountant/payments" subtitle={s.todayCount ? `${s.todayCount} payments` : undefined} />
        <StatCard icon={HandCoins} label="Net Income" value={`GHS ${netIncome.toLocaleString()}`} color="violet" href="/accountant/reports" />
        <StatCard icon={BarChart3} label="Pending Entries" value={s.pendingEntries || 0} color="orange" href="/accountant/reconciliation" subtitle="Draft journal entries" />
        <StatCard icon={Users} label="Owing Students" value={s.owingCount || 0} color="rose" href="/accountant/reports" />
      </div>

      {/* ── Revenue vs Expense & Pending Invoices ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue/Expense Chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <SectionHeader icon={BarChart3} title="Revenue vs Expenses" action={{ label: "Reports", href: "/accountant/reports" }} />
          </CardHeader>
          <CardContent className="pt-0">
            {/* CSS-based visual bar chart */}
            <div className="space-y-4 mt-2">
              {/* Revenue bar */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm bg-emerald-500" />
                    <span className="text-sm font-medium text-slate-700">Revenue</span>
                  </div>
                  <span className="text-sm font-bold text-emerald-600">GHS {monthlyRevenue.toLocaleString()}</span>
                </div>
                <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full transition-all duration-700"
                    style={{ width: `${Math.min(100, (monthlyRevenue / Math.max(monthlyRevenue, monthlyExpenses, 1)) * 100)}%` }}
                  />
                </div>
              </div>
              {/* Expenses bar */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm bg-red-500" />
                    <span className="text-sm font-medium text-slate-700">Expenses</span>
                  </div>
                  <span className="text-sm font-bold text-red-600">GHS {monthlyExpenses.toLocaleString()}</span>
                </div>
                <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-red-400 to-red-500 rounded-full transition-all duration-700"
                    style={{ width: `${Math.min(100, (monthlyExpenses / Math.max(monthlyRevenue, monthlyExpenses, 1)) * 100)}%` }}
                  />
                </div>
              </div>
              {/* Net Income */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200/60 mt-2">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${netIncome >= 0 ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600"}`}>
                    {netIncome >= 0 ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Net Income</p>
                    <p className={`text-lg font-bold ${netIncome >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                      GHS {netIncome.toLocaleString()}
                    </p>
                  </div>
                </div>
                <Badge variant={netIncome >= 0 ? "default" : "destructive"} className="text-xs">
                  {netIncome >= 0 ? "Profit" : "Loss"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pending Invoices Alert */}
        <div className="space-y-4">
          <Card className="border-amber-200 bg-gradient-to-b from-amber-50/50 to-white">
            <CardHeader className="pb-2">
              <SectionHeader icon={AlertTriangle} title="Pending Invoices" />
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              <div className="text-center p-4 rounded-xl bg-amber-50 border border-amber-100">
                <p className="text-3xl font-bold text-amber-600">{s.unpaidCount || 0}</p>
                <p className="text-xs text-slate-500 mt-1">Unpaid Invoices</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="text-center p-2.5 rounded-lg bg-emerald-50 border border-emerald-100">
                  <p className="text-base font-bold text-emerald-600">{s.paidCount || 0}</p>
                  <p className="text-[10px] text-slate-500">Paid</p>
                </div>
                <div className="text-center p-2.5 rounded-lg bg-sky-50 border border-sky-100">
                  <p className="text-base font-bold text-sky-600">{s.partialCount || 0}</p>
                  <p className="text-[10px] text-slate-500">Partial</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Collection Rate</span>
                  <span className={`font-bold ${collectionRate >= 70 ? "text-emerald-600" : collectionRate >= 40 ? "text-amber-600" : "text-red-600"}`}>
                    {collectionRate.toFixed(1)}%
                  </span>
                </div>
                <Progress value={collectionRate} className="h-2.5" />
              </div>
            </CardContent>
          </Card>

          {/* Quick stats */}
          <Card>
            <CardHeader className="pb-2">
              <SectionHeader icon={Clock} title="Today&apos;s Summary" />
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                <ActivityItem
                  icon={CircleDollarSign}
                  title={`GHS ${Number(s.todayTotal || 0).toLocaleString()} collected`}
                  subtitle={s.todayCount ? `${s.todayCount} payments today` : "No payments today"}
                  time="Today"
                  color="bg-emerald-50 text-emerald-600"
                />
                <ActivityItem
                  icon={BarChart3}
                  title={`${s.pendingEntries || 0} pending entries`}
                  subtitle="Draft journal entries to review"
                  time="Action"
                  color="bg-orange-50 text-orange-600"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── Recent Transactions Feed ── */}
      <Card>
        <CardHeader className="pb-3">
          <SectionHeader icon={Clock} title="Recent Transactions" action={{ label: "View All", href: "/accountant/payments" }} />
        </CardHeader>
        <CardContent className="pt-0">
          <div className="max-h-72 overflow-y-auto custom-scrollbar">
            <div className="grid grid-cols-4 gap-2 mb-3 px-1">
              <span className="text-[10px] font-semibold text-slate-400 uppercase">Student</span>
              <span className="text-[10px] font-semibold text-slate-400 uppercase">Invoice</span>
              <span className="text-[10px] font-semibold text-slate-400 uppercase text-right">Amount</span>
              <span className="text-[10px] font-semibold text-slate-400 uppercase text-right">Date</span>
            </div>
            <div className="space-y-1">
              {s.recentPayments && Array.isArray(s.recentPayments) && (s.recentPayments as { studentName: string; invoiceNumber?: string; amount: number; date: string; method?: string }[]).length > 0
                ? (s.recentPayments as { studentName: string; invoiceNumber?: string; amount: number; date: string; method?: string }[]).slice(0, 8).map((tx, i) => (
                  <div key={i} className="grid grid-cols-4 gap-2 items-center py-2.5 px-3 rounded-lg hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-200/60">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{tx.studentName}</p>
                      {tx.method && (
                        <p className="text-[10px] text-slate-400">{tx.method}</p>
                      )}
                    </div>
                    <span className="text-xs text-slate-500 font-mono truncate">{tx.invoiceNumber || "--"}</span>
                    <span className="text-sm font-semibold text-emerald-600 text-right">GHS {Number(tx.amount).toLocaleString()}</span>
                    <span className="text-xs text-slate-400 text-right">{tx.date ? new Date(tx.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "N/A"}</span>
                  </div>
                ))
                : (
                  <div className="text-center py-8 text-sm text-slate-400">
                    No recent transactions
                  </div>
                )
              }
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Top Debtors ── */}
      {s.topDebtors && Array.isArray(s.topDebtors) && s.topDebtors.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <SectionHeader icon={AlertTriangle} title="Top Debtors" action={{ label: "Full Report", href: "/accountant/reports" }} />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="max-h-72 overflow-y-auto custom-scrollbar">
              {(s.topDebtors as { studentName: string; outstanding: number; class: string }[]).slice(0, 10).map((debtor, i) => (
                <div key={i} className="flex items-center gap-3 py-2.5 border-b border-slate-100 last:border-0">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${i < 3 ? "bg-red-100 text-red-600 border border-red-200" : "bg-slate-50 text-slate-500 border border-slate-200"}`}>
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

      {/* ── Quick Actions ── */}
      <Card>
        <CardHeader className="pb-3">
          <SectionHeader icon={Activity} title="Quick Actions" />
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <QuickAction icon={Receipt} label="Invoices" href="/invoices" color="bg-red-50 text-red-600" />
            <QuickAction icon={CreditCard} label="Record Payment" href="/accountant/payments" color="bg-emerald-50 text-emerald-600" />
            <QuickAction icon={TrendingDown} label="Expenses" href="/accountant/expenses" color="bg-amber-50 text-amber-600" />
            <QuickAction icon={BarChart3} label="Reports" href="/accountant/reports" color="bg-purple-50 text-purple-600" />
            <QuickAction icon={PiggyBank} label="Payroll" href="/accountant/payroll" color="bg-teal-50 text-teal-600" />
            <QuickAction icon={Scale} label="Reconciliation" href="/accountant/reconciliation" color="bg-sky-50 text-sky-600" />
          </div>
        </CardContent>
      </Card>
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
  const totalBooks = Number(s.totalBooks || 0);
  const availableBooks = Number(s.availableBooks || 0);
  const overdueRequests = Number(s.overdueRequests || 0);
  const pendingRequests = Number(s.pendingRequests || 0);
  const utilizationRate = totalBooks > 0 ? ((totalBooks - availableBooks) / totalBooks * 100) : 0;

  return (
    <div className="space-y-6">
      {/* ── Primary Stat Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <GradientStatCard
          icon={BookOpen}
          label="Total Books"
          value={totalBooks}
          color="emerald"
          href="/librarian/books"
          subtitle={s.uniqueCategories ? `${s.uniqueCategories} categories` : undefined}
        />
        <GradientStatCard
          icon={BookCheck}
          label="Available"
          value={availableBooks}
          color="teal"
          href="/librarian/books"
        />
        <GradientStatCard
          icon={BookMarked}
          label="Issued"
          value={totalBooks - availableBooks}
          color="sky"
          href="/librarian/requests"
          subtitle={utilizationRate > 0 ? `${utilizationRate.toFixed(0)}% circulation` : undefined}
        />
        <GradientStatCard
          icon={AlertTriangle}
          label="Overdue"
          value={overdueRequests}
          color="red"
          href="/librarian/requests"
          subtitle={overdueRequests > 0 ? "Needs attention" : undefined}
          trend={overdueRequests > 0 ? { value: "Urgent", up: false } : undefined}
        />
      </div>

      {/* ── Secondary Stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={HandCoins} label="Collection Value" value={s.totalValue ? `GHS ${Number(s.totalValue).toLocaleString()}` : "GHS 0"} color="violet" />
        <StatCard icon={Users} label="Total Copies" value={s.totalCopies || 0} color="slate" />
        <StatCard icon={CheckSquare} label="Returned" value={s.returnedRequests || 0} color="emerald" />
        <StatCard icon={Megaphone} label="Notices" value={s.noticeCount || 0} color="orange" href="/notices" />
      </div>

      {/* ── Overdue Alert & Activity ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Overdue Books Alert */}
        <Card className={overdueRequests > 0 ? "border-red-200 bg-gradient-to-b from-red-50/50 to-white" : ""}>
          <CardHeader className="pb-3">
            <SectionHeader icon={AlertTriangle} title="Overdue Books" action={{ label: "View All", href: "/librarian/requests" }} />
          </CardHeader>
          <CardContent className="pt-0">
            {overdueRequests > 0 ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-100">
                  <div className="w-12 h-12 rounded-xl bg-red-500 text-white flex items-center justify-center shadow-sm">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-red-600">{overdueRequests}</p>
                    <p className="text-xs text-slate-500">Books overdue</p>
                  </div>
                </div>
                <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-100">
                  <strong>{overdueRequests} book{overdueRequests > 1 ? "s" : ""}</strong> have passed their due date. Contact the borrowers to return them.
                </p>
              </div>
            ) : (
              <div className="text-center py-6">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-2">
                  <BookCheck className="w-6 h-6" />
                </div>
                <p className="text-sm text-slate-500">All books returned on time</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Requests */}
        <Card>
          <CardHeader className="pb-3">
            <SectionHeader icon={Clock} title="Pending Requests" action={{ label: "Manage", href: "/librarian/requests" }} />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-50 border border-amber-100">
              <div className="w-12 h-12 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-sm">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-600">{pendingRequests}</p>
                <p className="text-xs text-slate-500">Awaiting approval</p>
              </div>
            </div>
            {pendingRequests > 0 && (
              <button
                onClick={() => window.location.href = "/librarian/requests"}
                className="w-full mt-3 min-h-[44px] bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                <BookCheck className="w-4 h-4" />
                Review Requests
              </button>
            )}
          </CardContent>
        </Card>

        {/* Library Utilization */}
        <Card>
          <CardHeader className="pb-3">
            <SectionHeader icon={Eye} title="Library Overview" />
          </CardHeader>
          <CardContent className="pt-0 space-y-3">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Utilization Rate</span>
                <span className="font-bold text-sky-600">{utilizationRate.toFixed(0)}%</span>
              </div>
              <Progress value={utilizationRate} className="h-2.5" />
              <p className="text-[10px] text-slate-400">{totalBooks - availableBooks} of {totalBooks} books in circulation</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-100 text-center">
                <p className="text-base font-bold text-emerald-600">{s.returnedRequests || 0}</p>
                <p className="text-[10px] text-slate-500">Returned</p>
              </div>
              <div className="p-2.5 rounded-lg bg-violet-50 border border-violet-100 text-center">
                <p className="text-base font-bold text-violet-600">{s.totalCopies || 0}</p>
                <p className="text-[10px] text-slate-500">Total Copies</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Quick Actions ── */}
      <Card>
        <CardHeader className="pb-3">
          <SectionHeader icon={Activity} title="Quick Actions" />
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <QuickAction icon={BookOpen} label="Manage Books" href="/librarian/books" color="bg-emerald-50 text-emerald-600" />
            <QuickAction icon={BookCheck} label="Book Requests" href="/librarian/requests" badge={pendingRequests} color="bg-teal-50 text-teal-600" />
            <QuickAction icon={CheckSquare} label="Book Returns" href="/librarian/returns" color="bg-amber-50 text-amber-600" />
            <QuickAction icon={Megaphone} label="Notices" href="/notices" color="bg-orange-50 text-orange-600" />
          </div>
        </CardContent>
      </Card>

      {/* ── Most Borrowed Books ── */}
      {s.popularBooks && Array.isArray(s.popularBooks) && s.popularBooks.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <SectionHeader icon={Trophy} title="Most Borrowed Books" action={{ label: "All Books", href: "/librarian/books" }} />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="max-h-72 overflow-y-auto custom-scrollbar">
              {(s.popularBooks as { name: string; author: string; issuedCopies: number; category: string }[]).slice(0, 5).map((book, i) => {
                const medalColors = i === 0 ? "bg-yellow-50 text-yellow-600 border-yellow-100" : i === 1 ? "bg-slate-100 text-slate-600 border-slate-200" : i === 2 ? "bg-amber-50 text-amber-700 border-amber-100" : "bg-slate-50 text-slate-500 border-slate-200";
                const barWidth = Math.min(100, (book.issuedCopies / ((s.popularBooks as { issuedCopies: number }[])[0]?.issuedCopies || 1)) * 100);
                return (
                  <div key={i} className="flex items-center gap-3 py-3 border-b border-slate-100 last:border-0">
                    <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 border ${medalColors}`}>
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium text-slate-800 truncate">{book.name}</p>
                        <Badge variant="secondary" className="text-[10px] flex-shrink-0">
                          {book.issuedCopies}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">{book.author}</p>
                      <div className="mt-1.5 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full transition-all duration-500"
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Recent Activity ── */}
      <Card>
        <CardHeader className="pb-3">
          <SectionHeader icon={ClipboardList} title="Recent Activity" />
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-0">
            <ActivityItem
              icon={BookCheck}
              title={`${s.returnedRequests || 0} books returned`}
              subtitle="Books returned recently"
              time="Recent"
              color="bg-emerald-50 text-emerald-600"
            />
            {pendingRequests > 0 && (
              <ActivityItem
                icon={Clock}
                title={`${pendingRequests} pending requests`}
                subtitle="Awaiting your approval"
                time="Action"
                color="bg-amber-50 text-amber-600"
              />
            )}
            {overdueRequests > 0 && (
              <ActivityItem
                icon={AlertTriangle}
                title={`${overdueRequests} overdue books`}
                subtitle="Follow up with borrowers"
                time="Urgent"
                color="bg-red-50 text-red-600"
              />
            )}
            <ActivityItem
              icon={BookOpen}
              title={`${totalBooks} books in collection`}
              subtitle={`${s.uniqueCategories || 0} categories, ${s.totalCopies || 0} total copies`}
              time="Overview"
              color="bg-sky-50 text-sky-600"
            />
          </div>
        </CardContent>
      </Card>
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
