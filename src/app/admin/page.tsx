"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  GraduationCap,
  Users,
  School,
  ClipboardCheck,
  DollarSign,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  Loader2,
  BarChart3,
  Activity,
  UserPlus,
  Receipt,
  CheckSquare,
  Eye,
  PieChart as PieChartIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
} from "recharts";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useAuth } from "@/hooks/use-auth";
import { format } from "date-fns";
import { PERMISSIONS } from "@/lib/permission-constants";

// ─── Types ──────────────────────────────────────────────────
interface DashboardStats {
  totalStudents: number;
  activeTeachers: number;
  activeParents: number;
  totalClasses: number;
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

interface FeeCollectionBreakdown {
  paid: { count: number; amount: number };
  partial: { count: number; amount: number };
  unpaid: { count: number; amount: number };
}

interface ChartData {
  studentDistribution: { name: string; count: number }[];
  attendanceTrend: { date: string; day: string; count: number }[];
  genderDistribution: { className: string; male: number; female: number; total: number }[];
  residentialDistribution: { className: string; residenceType: string; count: number }[];
  feeCollectionBreakdown: FeeCollectionBreakdown;
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
  count: { label: "Students", color: "#10b981" },
};

const genderChartConfig = {
  male: { label: "Male", color: "#3b82f6" },
  female: { label: "Female", color: "#ec4899" },
};

const attendanceChartConfig = {
  count: { label: "Present", color: "#8b5cf6" },
};

const feeChartConfig = {
  paid: { label: "Paid", color: "#10b981" },
  partial: { label: "Partial", color: "#f59e0b" },
  unpaid: { label: "Unpaid", color: "#ef4444" },
};

const ATTENDANCE_LINE_COLOR = "#8b5cf6";

const RESIDENTIAL_COLORS = [
  "rgba(16, 185, 129, 0.8)",
  "rgba(59, 130, 246, 0.8)",
  "rgba(245, 158, 11, 0.8)",
  "rgba(168, 85, 247, 0.8)",
];

const PIE_COLORS = ["#10b981", "#f59e0b", "#ef4444"];

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

// ─── Stat Card Component ─────────────────────────────────────
function StatCard({
  icon: Icon,
  label,
  value,
  trend,
  trendUp,
  iconBg,
  borderColor,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  trend?: string;
  trendUp?: boolean;
  iconBg: string;
  borderColor: string;
}) {
  return (
    <div
      className="group relative bg-white rounded-2xl border border-slate-200/60 p-4 sm:p-5 hover:-translate-y-0.5 hover:shadow-lg hover:border-slate-300/80 transition-all duration-200 flex flex-col"
      style={{ borderLeft: `4px solid ${borderColor}` }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            {label}
          </p>
          <p className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1.5 tabular-nums leading-tight">
            {value}
          </p>
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              <TrendingUp
                className={`w-3.5 h-3.5 ${trendUp !== false ? "text-emerald-500" : "text-red-500"}`}
              />
              <span
                className={`text-xs font-medium ${trendUp !== false ? "text-emerald-600" : "text-red-600"}`}
              >
                {trend}
              </span>
            </div>
          )}
        </div>
        <div
          className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}
        >
          <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
        </div>
      </div>
    </div>
  );
}

// ─── Skeleton Components ─────────────────────────────────────
function StatCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/60 p-4 sm:p-5 flex flex-col">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-2.5">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-8 w-16" />
        </div>
        <Skeleton className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex-shrink-0" />
      </div>
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/60 p-4 sm:p-6">
      <div className="flex items-center gap-2.5 mb-5">
        <Skeleton className="w-8 h-8 rounded-lg" />
        <Skeleton className="h-5 w-48" />
      </div>
      <Skeleton className="h-[220px] sm:h-[260px] w-full rounded-xl" />
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/60 p-4 sm:p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <Skeleton className="w-8 h-8 rounded-lg" />
          <Skeleton className="h-5 w-40" />
        </div>
        <Skeleton className="h-8 w-20 rounded-lg" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}

// ─── Chart Card Wrapper ──────────────────────────────────────
function ChartCard({
  icon: Icon,
  title,
  iconBg,
  badge,
  children,
  className = "",
}: {
  icon: React.ElementType;
  title: string;
  iconBg: string;
  badge?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`bg-white rounded-2xl border border-slate-200/60 p-4 sm:p-6 ${className}`}
    >
      <div className="flex items-center justify-between mb-4 sm:mb-5">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center ${iconBg}`}
          >
            <Icon className="w-4 h-4 text-white" />
          </div>
          <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        </div>
        {badge && (
          <span className="text-[10px] sm:text-xs font-medium text-slate-400 bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-md">
            {badge}
          </span>
        )}
      </div>
      {children}
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
  const colorStyles: Record<string, { bg: string; iconColor: string; hoverBorder: string }> = {
    emerald: { bg: "bg-emerald-50", iconColor: "text-emerald-600", hoverBorder: "hover:border-emerald-300" },
    blue: { bg: "bg-blue-50", iconColor: "text-blue-600", hoverBorder: "hover:border-blue-300" },
    violet: { bg: "bg-violet-50", iconColor: "text-violet-600", hoverBorder: "hover:border-violet-300" },
    amber: { bg: "bg-amber-50", iconColor: "text-amber-600", hoverBorder: "hover:border-amber-300" },
    cyan: { bg: "bg-cyan-50", iconColor: "text-cyan-600", hoverBorder: "hover:border-cyan-300" },
    rose: { bg: "bg-rose-50", iconColor: "text-rose-600", hoverBorder: "hover:border-rose-300" },
  };

  const colors = colorStyles[color] || colorStyles.blue;

  return (
    <button
      onClick={() => onClick(href)}
      className={`group flex items-center gap-3 p-3 sm:p-4 rounded-xl bg-white border border-slate-200/60 ${colors.hoverBorder} hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer w-full`}
    >
      <div
        className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl ${colors.bg} flex items-center justify-center flex-shrink-0`}
      >
        <Icon className={`w-5 h-5 ${colors.iconColor}`} />
      </div>
      <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900 transition-colors text-left truncate">
        {label}
      </span>
      <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 ml-auto flex-shrink-0 transition-colors" />
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
          <h2 className="text-xl font-semibold text-slate-900">
            Something went wrong
          </h2>
          <p className="text-slate-500 text-center max-w-md">{error}</p>
          <Button
            onClick={fetchDashboardData}
            variant="outline"
            className="mt-2 min-h-[44px] px-6"
          >
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
        <div className="space-y-5 sm:space-y-6">
          {/* Title */}
          <div className="space-y-1.5">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-72" />
          </div>

          {/* Stat cards - 6 grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <StatCardSkeleton key={i} />
            ))}
          </div>

          {/* Financial cards */}
          {canViewFinance && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <StatCardSkeleton key={i} />
              ))}
            </div>
          )}

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
            <ChartSkeleton />
            <ChartSkeleton />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
            <ChartSkeleton />
            <ChartSkeleton />
          </div>

          {/* Table */}
          <TableSkeleton />

          {/* Quick Actions */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-xl" />
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Prepare fee collection pie data
  const feeBreakdown = data.charts.feeCollectionBreakdown;
  const feePieData = [
    { name: "Paid", value: feeBreakdown.paid.count, amount: feeBreakdown.paid.amount },
    { name: "Partial", value: feeBreakdown.partial.count, amount: feeBreakdown.partial.amount },
    { name: "Unpaid", value: feeBreakdown.unpaid.count, amount: feeBreakdown.unpaid.amount },
  ].filter((d) => d.value > 0);

  const outstandingAmount = data.financialSummary.unpaidInvoices.amount;

  return (
    <DashboardLayout>
      <div className="space-y-5 sm:space-y-6">
        {/* ═══════════════════════════════════════════════════════
            Page Header
            ═══════════════════════════════════════════════════════ */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-4 border-b border-slate-100">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Admin Dashboard
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">{today}</p>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Badge variant="outline" className="font-normal text-slate-600 border-slate-200">
              {data.academicTerm.year}
            </Badge>
            <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white">
              {data.academicTerm.term}
            </Badge>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════
            Row 1: Key Metric Cards (6 equal cards - CI3 style)
            ═══════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          <StatCard
            icon={GraduationCap}
            label="Total Students"
            value={formatCompactNumber(data.stats.totalStudents)}
            trend={`${data.academicTerm.term}`}
            iconBg="bg-emerald-500"
            borderColor="#10b981"
          />
          <StatCard
            icon={Users}
            label="Teachers"
            value={formatCompactNumber(data.stats.activeTeachers)}
            iconBg="bg-blue-500"
            borderColor="#3b82f6"
          />
          <StatCard
            icon={School}
            label="Classes"
            value={data.stats.totalClasses}
            iconBg="bg-violet-500"
            borderColor="#8b5cf6"
          />
          <StatCard
            icon={DollarSign}
            label="Revenue"
            value={formatCompactNumber(data.financial.totalRevenue)}
            trend={data.financial.collectionRate >= 60 ? `${data.financial.collectionRate}% collected` : undefined}
            trendUp={data.financial.collectionRate >= 60}
            iconBg="bg-teal-500"
            borderColor="#14b8a6"
          />
          <StatCard
            icon={AlertTriangle}
            label="Outstanding"
            value={data.financial.pendingPayments}
            trend={outstandingAmount > 0 ? formatCurrency(outstandingAmount) : "All paid"}
            trendUp={outstandingAmount === 0}
            iconBg="bg-amber-500"
            borderColor="#f59e0b"
          />
          <StatCard
            icon={ClipboardCheck}
            label="Attendance"
            value={formatCompactNumber(data.stats.attendanceToday)}
            iconBg="bg-cyan-500"
            borderColor="#06b6d4"
          />
        </div>

        {/* ═══════════════════════════════════════════════════════
            Row 2: Financial Summary Cards (permission-gated)
            ═══════════════════════════════════════════════════════ */}
        {canViewFinance && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            {/* Total Revenue */}
            <StatCard
              icon={TrendingUp}
              label="Total Revenue"
              value={formatCurrency(data.financial.totalRevenue)}
              trend={`This term (${data.academicTerm.term})`}
              trendUp={true}
              iconBg="bg-emerald-500"
              borderColor="#10b981"
            />
            {/* Collection Rate */}
            <StatCard
              icon={BarChart3}
              label="Collection Rate"
              value={`${data.financial.collectionRate}%`}
              trend={data.financial.collectionLabel}
              trendUp={data.financial.collectionRate >= 60}
              iconBg="bg-blue-500"
              borderColor="#3b82f6"
            />
            {/* Unpaid Amount */}
            <StatCard
              icon={TrendingDown}
              label="Unpaid Invoices"
              value={data.financialSummary.unpaidInvoices.count}
              trend={formatCurrency(data.financialSummary.unpaidInvoices.amount)}
              trendUp={false}
              iconBg="bg-rose-500"
              borderColor="#f43f5e"
            />
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════
            Row 3: Charts - 2 columns
            ═══════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
          {/* Student Distribution by Class */}
          <ChartCard
            icon={BarChart3}
            title="Student Distribution by Class"
            iconBg="bg-emerald-500"
          >
            <ChartContainer
              config={classChartConfig}
              className="h-[220px] sm:h-[280px] w-full"
            >
              <BarChart
                data={data.charts.studentDistribution}
                margin={{ top: 5, right: 5, left: -10, bottom: 0 }}
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
                  tick={{ fontSize: 10, fill: "#94a3b8" }}
                  interval={0}
                  angle={-25}
                  textAnchor="end"
                  height={55}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar
                  dataKey="count"
                  fill="#10b981"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={40}
                />
              </BarChart>
            </ChartContainer>
          </ChartCard>

          {/* Attendance Trend - Last 7 Days */}
          <ChartCard
            icon={Activity}
            title="Attendance Trend"
            iconBg="bg-violet-500"
            badge="Last 7 days"
          >
            <ChartContainer
              config={attendanceChartConfig}
              className="h-[220px] sm:h-[280px] w-full"
            >
              <LineChart
                data={data.charts.attendanceTrend}
                margin={{ top: 5, right: 5, left: -10, bottom: 0 }}
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
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke={ATTENDANCE_LINE_COLOR}
                  strokeWidth={3}
                  dot={{
                    r: 5,
                    fill: ATTENDANCE_LINE_COLOR,
                    strokeWidth: 2,
                    stroke: "#fff",
                  }}
                  activeDot={{
                    r: 7,
                    fill: ATTENDANCE_LINE_COLOR,
                    strokeWidth: 2,
                    stroke: "#fff",
                  }}
                />
              </LineChart>
            </ChartContainer>
          </ChartCard>
        </div>

        {/* ═══════════════════════════════════════════════════════
            Row 4: Demographics + Fee Collection - 3 columns
            ═══════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
          {/* Gender Distribution */}
          <ChartCard
            icon={Users}
            title="Gender Distribution"
            iconBg="bg-blue-500"
          >
            <ChartContainer
              config={genderChartConfig}
              className="h-[220px] sm:h-[260px] w-full"
            >
              <BarChart
                data={data.charts.genderDistribution}
                margin={{ top: 5, right: 5, left: -10, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  className="stroke-slate-100"
                />
                <XAxis
                  dataKey="className"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 9, fill: "#94a3b8" }}
                  interval={0}
                  angle={-25}
                  textAnchor="end"
                  height={55}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar
                  dataKey="male"
                  fill="rgba(59, 130, 246, 0.8)"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={24}
                />
                <Bar
                  dataKey="female"
                  fill="rgba(236, 72, 153, 0.8)"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={24}
                />
              </BarChart>
            </ChartContainer>
          </ChartCard>

          {/* Fee Collection Doughnut */}
          <ChartCard
            icon={PieChartIcon}
            title="Fee Collection"
            iconBg="bg-amber-500"
            badge={data.academicTerm.term}
          >
            {feePieData.length > 0 ? (
              <ChartContainer
                config={feeChartConfig}
                className="h-[220px] sm:h-[260px] w-full"
              >
                <PieChart>
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(value, name) => {
                          const item = feePieData.find(
                            (d) => d.name.toLowerCase() === name
                          );
                          return [
                            `${value} invoices (${formatCurrency(item?.amount ?? 0)})`,
                            name.charAt(0).toUpperCase() + name.slice(1),
                          ];
                        }}
                      />
                    }
                  />
                  <Pie
                    data={feePieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                    nameKey="name"
                    strokeWidth={0}
                  >
                    {feePieData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={PIE_COLORS[index % PIE_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <ChartLegend content={<ChartLegendContent />} />
                </PieChart>
              </ChartContainer>
            ) : (
              <div className="h-[220px] sm:h-[260px] flex items-center justify-center text-slate-400 text-sm">
                No invoice data available
              </div>
            )}
          </ChartCard>

          {/* Residential Distribution */}
          <ChartCard
            icon={BarChart3}
            title="Residential Distribution"
            iconBg="bg-teal-500"
          >
            <ChartContainer
              config={{
                ...Object.fromEntries(
                  [
                    ...new Set(
                      data.charts.residentialDistribution.map(
                        (d) => d.residenceType
                      )
                    ),
                  ].map((type, i) => [
                    type,
                    {
                      label: type,
                      color: RESIDENTIAL_COLORS[i % RESIDENTIAL_COLORS.length],
                    },
                  ])
                ),
              }}
              className="h-[220px] sm:h-[260px] w-full"
            >
              <BarChart
                data={(() => {
                  const classSet = [
                    ...new Set(
                      data.charts.residentialDistribution.map(
                        (d) => d.className
                      )
                    ),
                  ];
                  const typeSet = [
                    ...new Set(
                      data.charts.residentialDistribution.map(
                        (d) => d.residenceType
                      )
                    ),
                  ];
                  return classSet.map((cls) => {
                    const row: Record<string, string | number> = {
                      className: cls,
                    };
                    typeSet.forEach((type) => {
                      const found =
                        data.charts.residentialDistribution.find(
                          (d) =>
                            d.className === cls &&
                            d.residenceType === type
                        );
                      row[type] = found ? found.count : 0;
                    });
                    return row;
                  });
                })()}
                margin={{ top: 5, right: 5, left: -10, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  className="stroke-slate-100"
                />
                <XAxis
                  dataKey="className"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 9, fill: "#94a3b8" }}
                  interval={0}
                  angle={-25}
                  textAnchor="end"
                  height={55}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                {[
                  ...new Set(
                    data.charts.residentialDistribution.map(
                      (d) => d.residenceType
                    )
                  ),
                ].map((type, i) => (
                  <Bar
                    key={type}
                    dataKey={type}
                    fill={
                      RESIDENTIAL_COLORS[i % RESIDENTIAL_COLORS.length]
                    }
                    radius={[4, 4, 0, 0]}
                    maxBarSize={24}
                  />
                ))}
              </BarChart>
            </ChartContainer>
          </ChartCard>
        </div>

        {/* ═══════════════════════════════════════════════════════
            Row 5: Recent Payments Table (permission-gated)
            Mobile: card-based list | Desktop: full table
            ═══════════════════════════════════════════════════════ */}
        {canViewFinance && (
          <div className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden">
            <div className="flex items-center justify-between p-4 sm:p-6 pb-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center">
                  <DollarSign className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-sm font-semibold text-slate-900">
                  Recent Payments
                </h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 min-h-[36px] sm:min-h-[44px]"
                onClick={() => router.push("/admin/payments")}
              >
                View All
                <ArrowUpRight className="w-4 h-4 ml-1" />
              </Button>
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden p-4 pt-3">
              {data.recentPayments.length === 0 ? (
                <div className="text-center text-slate-400 py-12 text-sm">
                  No recent payments found
                </div>
              ) : (
                <div className="space-y-2">
                  {data.recentPayments.map((payment, idx) => (
                    <button
                      key={idx}
                      onClick={() => router.push("/admin/payments")}
                      className="w-full flex items-center justify-between px-3 py-3 rounded-xl border border-slate-100 hover:bg-slate-50 active:bg-slate-100 transition-colors text-left"
                    >
                      <div className="flex-1 min-w-0 mr-3">
                        <p className="text-sm font-medium text-slate-900 truncate">
                          {payment.studentName || "Unknown"}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {payment.date
                            ? format(new Date(payment.date), "MMM d, yyyy")
                            : "—"}
                          {" · "}
                          <span className="capitalize">
                            {payment.method.replace(/_/g, " ")}
                          </span>
                        </p>
                      </div>
                      <p className="text-sm font-bold text-slate-900 tabular-nums flex-shrink-0">
                        {formatCurrency(payment.amount)}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Desktop Table View */}
            <div className="hidden lg:block p-4 sm:p-6 pt-4">
              <div className="overflow-x-auto rounded-xl border border-slate-100">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Student
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Invoice
                      </th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Method
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recentPayments.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="text-center text-slate-400 py-12"
                        >
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
                          <td className="px-4 py-3 text-slate-500 font-mono text-xs">
                            {payment.invoiceCode || "—"}
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-slate-900 tabular-nums">
                            {formatCurrency(payment.amount)}
                          </td>
                          <td className="px-4 py-3 text-slate-500 capitalize">
                            {payment.method.replace(/_/g, " ")}
                          </td>
                          <td className="px-4 py-3 text-slate-500">
                            {payment.date
                              ? format(
                                  new Date(payment.date),
                                  "MMM d, yyyy"
                                )
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

        {/* ═══════════════════════════════════════════════════════
            Row 6: Quick Actions (CI3-style)
            ═══════════════════════════════════════════════════════ */}
        <div>
          <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <div className="w-1.5 h-5 rounded-full bg-emerald-500" />
            Quick Actions
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 sm:gap-4">
            <QuickAction
              icon={UserPlus}
              label="Add Student"
              href="/admin/students/new"
              color="emerald"
              onClick={(href) => router.push(href)}
            />
            <QuickAction
              icon={Receipt}
              label="Create Invoice"
              href="/admin/invoices"
              color="blue"
              onClick={(href) => router.push(href)}
            />
            <QuickAction
              icon={CheckSquare}
              label="Attendance"
              href="/attendance"
              color="violet"
              onClick={(href) => router.push(href)}
            />
            <QuickAction
              icon={Eye}
              label="View Reports"
              href="/admin/reports/annual"
              color="amber"
              onClick={(href) => router.push(href)}
            />
            <QuickAction
              icon={DollarSign}
              label="Take Payment"
              href="/admin/daily-fees/collection"
              color="cyan"
              onClick={(href) => router.push(href)}
            />
            <QuickAction
              icon={GraduationCap}
              label="All Students"
              href="/admin/students"
              color="rose"
              onClick={(href) => router.push(href)}
            />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
