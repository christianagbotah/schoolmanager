"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  GraduationCap,
  Users,
  ClipboardCheck,
  DollarSign,
  AlertTriangle,
  CreditCard,
  Receipt,
  MessageSquare,
  Bell,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  Loader2,
  CalendarDays,
  Search,
  BarChart3,
  UserPlus,
  FileText,
  CheckSquare,
  Activity,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import {
  Bar,
  BarChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Pie,
  PieChart,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
} from "recharts";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useAuth } from "@/hooks/use-auth";
import { format } from "date-fns";
import { PERMISSIONS } from "@/lib/permission-constants";

// ─── Types (matches new API response format) ──────────────────
interface DashboardStats {
  totalStudents: number;
  activeTeachers: number;
  activeParents: number;
  attendanceToday: number;
}

interface FinancialStats {
  totalRevenue: number;
  totalBilled: number;
  collectionRate: number;
  collectionLabel: string;
  collectionColor: string;
  pendingPayments: number;
}

interface FinancialSummary {
  unpaidInvoices: { count: number; amount: number };
  totalIncome: { count: number; amount: number };
  totalExpenses: { amount: number };
}

interface RecentPayment {
  studentName: string;
  amount: number;
  method: string;
  date: string | null;
  invoiceCode: string;
}

interface ChartData {
  studentDistribution: { name: string; count: number }[];
  attendanceTrend: { date: string; day: string; count: number }[];
  genderDistribution: { className: string; male: number; female: number; total: number }[];
  residentialDistribution: { className: string; residenceType: string; count: number }[];
}

interface DashboardData {
  academicTerm: { year: string; term: string };
  stats: DashboardStats;
  financial: FinancialStats;
  financialSummary: FinancialSummary;
  charts: ChartData;
  recentPayments: RecentPayment[];
}

// ─── Chart Configs ───────────────────────────────────────────
const classChartConfig = {
  count: { label: "Students", color: "#667eea" },
};

const genderChartConfig = {
  male: { label: "Male", color: "#36a2eb" },
  female: { label: "Female", color: "#ff6384" },
};

const attendanceChartConfig = {
  count: { label: "Present", color: "#fa709a" },
};

const ATTENDANCE_LINE_COLOR = "#fa709a";
const BAR_COLORS = [
  "#667eea", "#f5576c", "#00f2fe", "#fee140",
  "#a78bfa", "#34d399", "#fb923c", "#f472b6",
  "#38bdf8", "#fbbf24",
];

const RESIDENTIAL_COLORS = [
  "rgba(102, 126, 234, 0.8)", "rgba(118, 75, 162, 0.8)",
  "rgba(255, 138, 0, 0.8)", "rgba(0, 200, 83, 0.8)",
];

// ─── Helpers ─────────────────────────────────────────────────
function formatCurrency(amount: number): string {
  const safeAmount = amount ?? 0;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "GHS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(safeAmount);
}

function formatCompactNumber(num: number): string {
  const safeNum = num ?? 0;
  if (safeNum >= 1000000) return (safeNum / 1000000).toFixed(1) + "M";
  if (safeNum >= 1000) return (safeNum / 1000).toFixed(1) + "K";
  return safeNum.toLocaleString();
}

function PaymentStatusBadge({ status }: { status: string }) {
  const variant =
    status === "approved" || status === "paid"
      ? "default"
      : status === "pending"
        ? "secondary"
        : "destructive";
  const label =
    status === "approved" || status === "paid"
      ? "Completed"
      : status.charAt(0).toUpperCase() + status.slice(1);
  return <Badge variant={variant}>{label}</Badge>;
}

// ─── Stat Card Component ─────────────────────────────────────
function StatCard({
  icon: Icon,
  label,
  value,
  gradientFrom,
  gradientTo,
  borderColor,
  subtext,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  gradientFrom: string;
  gradientTo: string;
  borderColor: string;
  subtext?: string;
}) {
  return (
    <div
      className="dashboard-card bg-white rounded-2xl shadow-sm p-7 hover:-translate-y-2 hover:scale-[1.02] hover:shadow-xl transition-all duration-300"
      style={{ borderLeft: `5px solid ${borderColor}` }}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-500 mb-1">{label}</p>
          <p className="text-3xl font-bold text-slate-900 tabular-nums">
            {value}
          </p>
          {subtext && (
            <p className="text-xs text-slate-400 mt-1">{subtext}</p>
          )}
        </div>
        <div
          className={`stat-icon w-16 h-16 rounded-2xl flex items-center justify-center text-3xl text-white bg-gradient-to-br ${gradientFrom} ${gradientTo} flex-shrink-0 ml-4`}
        >
          <Icon className="w-8 h-8" />
        </div>
      </div>
    </div>
  );
}

// ─── Skeleton Loading ────────────────────────────────────────
function StatCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-7 border-l-5 border-slate-200">
      <div className="flex items-center justify-between">
        <div className="flex-1 space-y-3">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-9 w-20" />
        </div>
        <Skeleton className="w-16 h-16 rounded-2xl flex-shrink-0 ml-4" />
      </div>
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-6">
      <div className="flex items-center gap-2 mb-6">
        <Skeleton className="w-6 h-6 rounded" />
        <Skeleton className="h-5 w-48" />
      </div>
      <Skeleton className="h-[260px] w-full rounded-xl" />
    </div>
  );
}

// ─── Quick Action Button ─────────────────────────────────────
function QuickAction({
  icon: Icon,
  label,
  href,
  color,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  href: string;
  color: string;
  onClick: (href: string) => void;
}) {
  const colorMap: Record<string, { bg: string; hoverBg: string; hoverBorder: string; iconColor: string }> = {
    emerald: {
      bg: "bg-emerald-50",
      hoverBg: "group-hover:bg-emerald-100",
      hoverBorder: "group-hover:border-emerald-400",
      iconColor: "text-emerald-600",
    },
    blue: {
      bg: "bg-blue-50",
      hoverBg: "group-hover:bg-blue-100",
      hoverBorder: "group-hover:border-blue-400",
      iconColor: "text-blue-600",
    },
    violet: {
      bg: "bg-violet-50",
      hoverBg: "group-hover:bg-violet-100",
      hoverBorder: "group-hover:border-violet-400",
      iconColor: "text-violet-600",
    },
    amber: {
      bg: "bg-amber-50",
      hoverBg: "group-hover:bg-amber-100",
      hoverBorder: "group-hover:border-amber-400",
      iconColor: "text-amber-600",
    },
    cyan: {
      bg: "bg-cyan-50",
      hoverBg: "group-hover:bg-cyan-100",
      hoverBorder: "group-hover:border-cyan-400",
      iconColor: "text-cyan-600",
    },
    rose: {
      bg: "bg-rose-50",
      hoverBg: "group-hover:bg-rose-100",
      hoverBorder: "group-hover:border-rose-400",
      iconColor: "text-rose-600",
    },
  };

  const colors = colorMap[color] || colorMap.blue;

  return (
    <button
      onClick={() => onClick(href)}
      className={`group flex flex-col items-center gap-3 p-5 rounded-xl bg-white border-2 border-slate-100 ${colors.hoverBorder} hover:${colors.hoverBg.replace("group-hover:", "")} hover:-translate-y-1 transition-all duration-300 cursor-pointer w-full`}
    >
      <div
        className={`w-12 h-12 rounded-xl ${colors.bg} ${colors.hoverBg} flex items-center justify-center transition-colors duration-300`}
      >
        <Icon className={`w-6 h-6 ${colors.iconColor}`} />
      </div>
      <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900 transition-colors">
        {label}
      </span>
    </button>
  );
}

// ─── Main Component ──────────────────────────────────────────
export default function AdminDashboard() {
  const router = useRouter();
  const { isLoading: authLoading, role, isSuperAdmin, hasPermission } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [filterDate, setFilterDate] = useState("");
  const [filterTerm, setFilterTerm] = useState("");
  const [filterYear, setFilterYear] = useState("");
  const [filterSearch, setFilterSearch] = useState("");

  // Permission checks
  const canViewFinance =
    isSuperAdmin ||
    hasPermission(PERMISSIONS.CAN_VIEW_PAYMENTS) ||
    hasPermission(PERMISSIONS.CAN_VIEW_INVOICES) ||
    hasPermission(PERMISSIONS.CAN_VIEW_FINANCIAL_REPORTS);

  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/dashboard");
      if (!res.ok) throw new Error("Failed to fetch dashboard data");
      const json = await res.json();
      setData(json);
      setFilterYear(json.academicTerm.year);
      setFilterTerm(json.academicTerm.term);
    } catch (err) {
      console.error(err);
      setError("Unable to load dashboard data. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && role) {
      fetchDashboardData();
    }
  }, [authLoading, role, fetchDashboardData]);

  const today = format(new Date(), "EEEE, MMMM d, yyyy");

  // ─── Error State ──────────────────────────────────────────
  if (error) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-slate-900">Something went wrong</h2>
          <p className="text-slate-500 text-center max-w-md">{error}</p>
          <Button onClick={fetchDashboardData} variant="outline" className="mt-2">
            <Loader2 className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  // ─── Loading State ─────────────────────────────────────────
  if (authLoading || isLoading || !data) {
    return (
      <DashboardLayout>
        <div className="space-y-8">
          {/* Title skeleton */}
          <div className="space-y-2">
            <Skeleton className="h-8 w-56" />
            <Skeleton className="h-4 w-72" />
          </div>

          {/* Filter skeleton (super admin) */}
          {isSuperAdmin && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full rounded-lg" />
              ))}
            </div>
          )}

          {/* Stat cards skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <StatCardSkeleton key={i} />
            ))}
          </div>

          {/* Financial skeleton */}
          {canViewFinance && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <StatCardSkeleton key={i} />
              ))}
            </div>
          )}

          {/* Charts skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartSkeleton />
            <ChartSkeleton />
          </div>

          {/* Gender + Residential skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartSkeleton />
            <ChartSkeleton />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* ─── Page Header ───────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
              Dashboard Overview
            </h1>
            <p className="text-slate-500 mt-1">
              Welcome back! Here&apos;s what&apos;s happening at your school today.
            </p>
            <p className="text-sm text-slate-400 mt-0.5">{today}</p>
          </div>
          <div className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-slate-400" />
            <Select value={filterYear} onValueChange={setFilterYear}>
              <SelectTrigger className="w-[110px]" size="sm">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={data.academicTerm.year}>
                  {data.academicTerm.year}
                </SelectItem>
                <SelectItem value={String(Number(data.academicTerm.year) - 1)}>
                  {Number(data.academicTerm.year) - 1}
                </SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterTerm} onValueChange={setFilterTerm}>
              <SelectTrigger className="w-[120px]" size="sm">
                <SelectValue placeholder="Term" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Term 1">Term 1</SelectItem>
                <SelectItem value="Term 2">Term 2</SelectItem>
                <SelectItem value="Term 3">Term 3</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* ─── Filter Section (Super Admin Only) ─────────────── */}
        {isSuperAdmin && (
          <div className="bg-white rounded-2xl shadow-sm p-5 border border-slate-100">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Date
                </label>
                <Input
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="h-9"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Term
                </label>
                <Select value={filterTerm} onValueChange={setFilterTerm}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Select Term" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Term 1">Term 1</SelectItem>
                    <SelectItem value="Term 2">Term 2</SelectItem>
                    <SelectItem value="Term 3">Term 3</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Year
                </label>
                <Select value={filterYear} onValueChange={setFilterYear}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Select Year" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={data.academicTerm.year}>
                      {data.academicTerm.year}
                    </SelectItem>
                    <SelectItem value={String(Number(data.academicTerm.year) - 1)}>
                      {Number(data.academicTerm.year) - 1}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Search
                </label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    type="text"
                    placeholder="Search students..."
                    value={filterSearch}
                    onChange={(e) => setFilterSearch(e.target.value)}
                    className="h-9 pl-8"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── Row 1: Key Metric Cards (4 columns) ──────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            icon={GraduationCap}
            label="Total Students"
            value={formatCompactNumber(data.stats.totalStudents)}
            gradientFrom="from-indigo-500"
            gradientTo="to-purple-600"
            borderColor="#667eea"
            subtext={`${data.academicTerm.term}, ${data.academicTerm.year}`}
          />
          <StatCard
            icon={Users}
            label="Active Teachers"
            value={formatCompactNumber(data.stats.activeTeachers)}
            gradientFrom="from-pink-400"
            gradientTo="to-rose-500"
            borderColor="#f5576c"
          />
          <StatCard
            icon={Users}
            label="Active Parents"
            value={formatCompactNumber(data.stats.activeParents)}
            gradientFrom="from-blue-400"
            gradientTo="to-cyan-400"
            borderColor="#00f2fe"
          />
          <StatCard
            icon={ClipboardCheck}
            label="Attendance Today"
            value={formatCompactNumber(data.stats.attendanceToday)}
            gradientFrom="from-pink-400"
            gradientTo="to-amber-400"
            borderColor="#fee140"
          />
        </div>

        {/* ─── Row 2: Financial Overview (3 columns, admin only) ── */}
        {canViewFinance && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Total Revenue */}
            <div
              className="dashboard-card bg-white rounded-2xl shadow-sm p-7 hover:-translate-y-2 hover:scale-[1.02] hover:shadow-xl transition-all duration-300"
              style={{ borderLeft: "5px solid #10b981" }}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-500 mb-1">
                    Total Revenue
                  </p>
                  <p className="text-2xl font-bold text-slate-900 tabular-nums">
                    {formatCurrency(data.financial.totalRevenue)}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    This term ({data.academicTerm.term})
                  </p>
                </div>
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl text-white bg-gradient-to-br from-emerald-400 to-teal-400 flex-shrink-0 ml-4">
                  <DollarSign className="w-8 h-8" />
                </div>
              </div>
            </div>

            {/* Collection Rate */}
            <div
              className="dashboard-card bg-white rounded-2xl shadow-sm p-7 hover:-translate-y-2 hover:scale-[1.02] hover:shadow-xl transition-all duration-300"
              style={{ borderLeft: "5px solid #3b82f6" }}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-500 mb-1">
                    Collection Rate
                  </p>
                  <div className="flex items-center gap-3">
                    <p className="text-2xl font-bold text-slate-900 tabular-nums">
                      {data.financial.collectionRate}%
                    </p>
                    <Badge
                      variant="outline"
                      className={`text-xs font-semibold border ${data.financial.collectionColor}`}
                    >
                      {data.financial.collectionLabel}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Academic year {data.academicTerm.year}
                  </p>
                </div>
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl text-white bg-gradient-to-br from-blue-400 to-indigo-500 flex-shrink-0 ml-4">
                  <TrendingUp className="w-8 h-8" />
                </div>
              </div>
            </div>

            {/* Pending Payments */}
            <div
              className="dashboard-card bg-white rounded-2xl shadow-sm p-7 hover:-translate-y-2 hover:scale-[1.02] hover:shadow-xl transition-all duration-300"
              style={{ borderLeft: "5px solid #ec4899" }}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-500 mb-1">
                    Pending Payments
                  </p>
                  <p className="text-2xl font-bold text-slate-900 tabular-nums">
                    {data.financial.pendingPayments}
                  </p>
                  <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                    <TrendingDown className="w-3 h-3" />
                    Students with unpaid invoices
                  </p>
                </div>
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl text-white bg-gradient-to-br from-pink-400 to-rose-500 flex-shrink-0 ml-4">
                  <AlertTriangle className="w-8 h-8" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── Row 3: Charts (2 columns) ─────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Student Distribution by Class */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                  <BarChart3 className="w-4 h-4 text-indigo-600" />
                </div>
                <h3 className="text-base font-semibold text-slate-900">
                  Student Distribution by Class
                </h3>
              </div>
            </div>
            <ChartContainer
              config={classChartConfig}
              className="h-[300px] w-full"
            >
              <BarChart
                data={data.charts.studentDistribution}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  className="stroke-slate-100"
                />
                <XAxis
                  dataKey="name"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  interval={0}
                  angle={-20}
                  textAnchor="end"
                  height={60}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12, fill: "#94a3b8" }}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar
                  dataKey="count"
                  fill="#667eea"
                  radius={[8, 8, 0, 0]}
                  maxBarSize={40}
                />
              </BarChart>
            </ChartContainer>
          </div>

          {/* Attendance Trend - Last 7 Days */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-cyan-100 flex items-center justify-center">
                  <Activity className="w-4 h-4 text-cyan-600" />
                </div>
                <h3 className="text-base font-semibold text-slate-900">
                  Attendance Trend
                </h3>
              </div>
              <span className="text-xs text-slate-400 bg-slate-50 px-2 py-1 rounded-md">
                Last 7 days
              </span>
            </div>
            <ChartContainer
              config={attendanceChartConfig}
              className="h-[300px] w-full"
            >
              <LineChart
                data={data.charts.attendanceTrend}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  className="stroke-slate-100"
                />
                <XAxis
                  dataKey="day"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12, fill: "#94a3b8" }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12, fill: "#94a3b8" }}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke={ATTENDANCE_LINE_COLOR}
                  strokeWidth={3}
                  dot={{ r: 5, fill: ATTENDANCE_LINE_COLOR, strokeWidth: 2, stroke: "#fff" }}
                  activeDot={{ r: 7, fill: ATTENDANCE_LINE_COLOR, strokeWidth: 2, stroke: "#fff" }}
                />
              </LineChart>
            </ChartContainer>
          </div>
        </div>

        {/* ─── Row 4: Gender + Residential (2 columns) ───────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Gender Distribution by Class (grouped bar - matches original CI3) */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                  <Users className="w-4 h-4 text-purple-600" />
                </div>
                <h3 className="text-base font-semibold text-slate-900">
                  Gender Distribution by Class
                </h3>
              </div>
              <ChartLegend content={<ChartLegendContent />} />
            </div>
            <ChartContainer
              config={genderChartConfig}
              className="h-[300px] w-full"
            >
              <BarChart
                data={data.charts.genderDistribution}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-slate-100" />
                <XAxis dataKey="className" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: "#94a3b8" }} interval={0} angle={-20} textAnchor="end" height={60} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "#94a3b8" }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="male" fill="rgba(54, 162, 235, 0.8)" radius={[4, 4, 0, 0]} maxBarSize={30} />
                <Bar dataKey="female" fill="rgba(255, 99, 132, 0.8)" radius={[4, 4, 0, 0]} maxBarSize={30} />
              </BarChart>
            </ChartContainer>
          </div>

          {/* Residential Distribution by Class (matches original CI3) */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                  <BarChart3 className="w-4 h-4 text-amber-600" />
                </div>
                <h3 className="text-base font-semibold text-slate-900">
                  Residential Distribution by Class
                </h3>
              </div>
              <ChartLegend content={<ChartLegendContent />} />
            </div>
            <ChartContainer
              config={{
                ...Object.fromEntries(
                  [...new Set(data.charts.residentialDistribution.map(d => d.residenceType))].map((type, i) => [
                    type, { label: type, color: RESIDENTIAL_COLORS[i % RESIDENTIAL_COLORS.length] },
                  ])
                )}
              }
              className="h-[300px] w-full"
            >
              <BarChart
                data={(() => {
                  const classSet = [...new Set(data.charts.residentialDistribution.map(d => d.className))];
                  const typeSet = [...new Set(data.charts.residentialDistribution.map(d => d.residenceType))];
                  return classSet.map(cls => {
                    const row: Record<string, string | number> = { className: cls };
                    typeSet.forEach(type => {
                      const found = data.charts.residentialDistribution.find(d => d.className === cls && d.residenceType === type);
                      row[type] = found ? found.count : 0;
                    });
                    return row;
                  });
                })()}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-slate-100" />
                <XAxis dataKey="className" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: "#94a3b8" }} interval={0} angle={-20} textAnchor="end" height={60} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "#94a3b8" }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                {[...new Set(data.charts.residentialDistribution.map(d => d.residenceType))].map((type, i) => (
                  <Bar key={type} dataKey={type} fill={RESIDENTIAL_COLORS[i % RESIDENTIAL_COLORS.length]} radius={[4, 4, 0, 0]} maxBarSize={30} />
                ))}
              </BarChart>
            </ChartContainer>
          </div>
        </div>

        {/* ─── Recent Payments Table ─────────────────────────── */}
        {canViewFinance && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="flex items-center justify-between p-6 pb-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                </div>
                <h3 className="text-base font-semibold text-slate-900">
                  Recent Payments
                </h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50"
                onClick={() => router.push("/admin/payments")}
              >
                View All
                <ArrowUpRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
            <div className="p-6 pt-4">
              <div className="max-h-96 overflow-y-auto rounded-xl border border-slate-100 custom-scrollbar">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Student
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden sm:table-cell">
                        Invoice
                      </th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">
                        Method
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden lg:table-cell">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recentPayments.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center text-slate-400 py-12">
                          No recent payments found
                        </td>
                      </tr>
                    ) : (
                      data.recentPayments.map((payment, idx) => (
                        <tr
                          key={idx}
                          className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors cursor-pointer"
                          onClick={() => router.push("/admin/payments")}
                        >
                          <td className="px-4 py-3 font-medium text-slate-900">
                            {payment.studentName || "Unknown"}
                          </td>
                          <td className="px-4 py-3 text-slate-500 font-mono hidden sm:table-cell">
                            {payment.invoiceCode || "—"}
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-slate-900 tabular-nums">
                            {formatCurrency(payment.amount)}
                          </td>
                          <td className="px-4 py-3 text-slate-500 capitalize hidden md:table-cell">
                            {payment.method.replace(/_/g, " ")}
                          </td>
                          <td className="px-4 py-3 text-slate-500 hidden lg:table-cell">
                            {payment.date
                              ? format(new Date(payment.date), "MMM d, yyyy")
                              : "—"}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ─── Financial Summary (Super Admin Only) ────────────── */}
        {isSuperAdmin && data.financialSummary && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-emerald-600" />
              </div>
              <h3 className="text-base font-semibold text-slate-900">
                Financial Summary
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Unpaid Invoices */}
              <button
                onClick={() => router.push("/admin/invoices")}
                className="text-left dashboard-card rounded-2xl shadow-sm p-6 hover:-translate-y-1 hover:shadow-lg transition-all duration-300 text-white"
                style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" }}
              >
                <p className="text-sm font-medium text-white/80 mb-1">Unpaid Invoices</p>
                <p className="text-2xl font-bold">{formatCurrency(data.financialSummary.unpaidInvoices.amount)}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="secondary" className="bg-white/20 text-white border-white/30 text-xs">
                    {data.financialSummary.unpaidInvoices.count} invoices
                  </Badge>
                </div>
              </button>

              {/* Total Income */}
              <div
                className="dashboard-card rounded-2xl shadow-sm p-6 hover:-translate-y-1 hover:shadow-lg transition-all duration-300 text-white"
                style={{ background: "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)" }}
              >
                <p className="text-sm font-medium text-white/80 mb-1">Total Income</p>
                <p className="text-2xl font-bold">{formatCurrency(data.financialSummary.totalIncome.amount)}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="secondary" className="bg-white/20 text-white border-white/30 text-xs">
                    {data.financialSummary.totalIncome.count} receipts
                  </Badge>
                </div>
              </div>

              {/* Total Expenses */}
              <button
                onClick={() => router.push("/admin/expenses")}
                className="text-left dashboard-card rounded-2xl shadow-sm p-6 hover:-translate-y-1 hover:shadow-lg transition-all duration-300 text-white"
                style={{ background: "linear-gradient(135deg, #ee0979 0%, #ff6a00 100%)" }}
              >
                <p className="text-sm font-medium text-white/80 mb-1">Total Expenses</p>
                <p className="text-2xl font-bold">{formatCurrency(data.financialSummary.totalExpenses.amount)}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="secondary" className="bg-white/20 text-white border-white/30 text-xs">
                    All time
                  </Badge>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* ─── Quick Actions (6 columns) ─────────────────────── */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4 text-slate-600" />
            </div>
            <h3 className="text-base font-semibold text-slate-900">
              Quick Actions
            </h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <QuickAction
              icon={GraduationCap}
              label="Add Student"
              href="/admin/students"
              color="emerald"
              onClick={(href) => router.push(href)}
            />
            <QuickAction
              icon={CheckSquare}
              label="Mark Attendance"
              href="/admin/attendance"
              color="blue"
              onClick={(href) => router.push(href)}
            />
            <QuickAction
              icon={Receipt}
              label="Student Billing"
              href="/admin/invoices"
              color="violet"
              onClick={(href) => router.push(href)}
            />
            <QuickAction
              icon={CreditCard}
              label="Take Payment"
              href="/admin/payments"
              color="amber"
              onClick={(href) => router.push(href)}
            />
            <QuickAction
              icon={MessageSquare}
              label="Send Message"
              href="/admin/messages"
              color="cyan"
              onClick={(href) => router.push(href)}
            />
            <QuickAction
              icon={Bell}
              label="Bill Reminders"
              href="/admin/invoices"
              color="rose"
              onClick={(href) => router.push(href)}
            />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
