"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
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
  Clock,
  Banknote,
  Smartphone,
  CreditCard,
  Building2,
  Megaphone,
  AlertCircle,
  Volume2,
  FileText,
  Bell,
  Sparkles,
  UserX,
  FileWarning,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

const dailyCollectionConfig = {
  amount: { label: "Collections", color: "#10b981" },
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

function getMethodIcon(method: string) {
  const m = method.toLowerCase().replace(/[_\s-]/g, "");
  if (m.includes("cash")) return Banknote;
  if (m.includes("momo") || m.includes("mobile")) return Smartphone;
  if (m.includes("cheque")) return FileText;
  if (m.includes("bank") || m.includes("transfer")) return Building2;
  if (m.includes("card")) return CreditCard;
  return Banknote;
}

function getMethodColor(method: string) {
  const m = method.toLowerCase().replace(/[_\s-]/g, "");
  if (m.includes("cash")) return "bg-emerald-100 text-emerald-700";
  if (m.includes("momo") || m.includes("mobile")) return "bg-violet-100 text-violet-700";
  if (m.includes("cheque")) return "bg-amber-100 text-amber-700";
  if (m.includes("bank") || m.includes("transfer")) return "bg-sky-100 text-sky-700";
  if (m.includes("card")) return "bg-rose-100 text-rose-700";
  return "bg-slate-100 text-slate-700";
}

// ─── Mini Sparkline Component ────────────────────────────────
function MiniSparkline({ data, color }: { data: number[]; color: string }) {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 60;
  const h = 24;
  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((v - min) / range) * (h - 4) - 2;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg width={w} height={h} className="mt-1 opacity-60">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
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
  gradientFrom,
  sparkData,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  trend?: string;
  trendUp?: boolean;
  iconBg: string;
  borderColor: string;
  gradientFrom?: string;
  sparkData?: number[];
}) {
  return (
    <div
      className="group relative bg-white rounded-2xl border border-slate-200/60 overflow-hidden hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/50 hover:border-slate-300/80 transition-all duration-300 flex flex-col"
    >
      {/* Gradient top border */}
      <div
        className="h-1 w-full"
        style={{
          background: `linear-gradient(90deg, ${borderColor}, ${gradientFrom || borderColor}88)`,
        }}
      />
      <div className="p-4 sm:p-5 flex-1">
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
          <div className="flex flex-col items-end gap-1">
            <div
              className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm ${iconBg}`}
            >
              <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            {sparkData && sparkData.length > 1 && (
              <MiniSparkline data={sparkData} color={borderColor} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Skeleton Components ─────────────────────────────────────
function StatCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden flex flex-col">
      <Skeleton className="h-1 w-full" />
      <div className="p-4 sm:p-5 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 space-y-2.5">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-8 w-16" />
          </div>
          <Skeleton className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex-shrink-0" />
        </div>
      </div>
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/60 p-4 sm:p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <Skeleton className="w-8 h-8 rounded-lg" />
          <Skeleton className="h-5 w-48" />
        </div>
        <Skeleton className="h-8 w-32 rounded-lg" />
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
  extra,
  className = "",
}: {
  icon: React.ElementType;
  title: string;
  iconBg: string;
  badge?: string;
  children: React.ReactNode;
  extra?: React.ReactNode;
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
        <div className="flex items-center gap-2">
          {badge && (
            <span className="text-[10px] sm:text-xs font-medium text-slate-400 bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-md">
              {badge}
            </span>
          )}
          {extra}
        </div>
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
  gradient,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  href: string;
  gradient: string;
  onClick: (href: string) => void;
}) {
  return (
    <button
      onClick={() => onClick(href)}
      className="group relative flex items-center gap-3 p-4 sm:p-5 rounded-2xl text-white overflow-hidden hover:-translate-y-1 hover:shadow-lg transition-all duration-300 cursor-pointer w-full min-h-[56px]"
      style={{ background: gradient }}
    >
      {/* Glass overlay */}
      <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors duration-300" />
      <div className="relative flex items-center gap-3 w-full">
        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0 backdrop-blur-sm">
          <Icon className="w-5 h-5 text-white" />
        </div>
        <span className="text-sm font-semibold text-left truncate flex-1">
          {label}
        </span>
        <ArrowUpRight className="w-4 h-4 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all flex-shrink-0" />
      </div>
    </button>
  );
}

// ─── Live Clock Component ────────────────────────────────────
function LiveClock() {
  const [time, setTime] = useState(() => new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-2 text-slate-500">
      <Clock className="w-4 h-4" />
      <span className="text-sm font-mono tabular-nums">
        {format(time, "h:mm:ss a")}
      </span>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────
export default function AdminDashboard() {
  const router = useRouter();
  const { isLoading: authLoading, role, isSuperAdmin, hasPermission, user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState("week");

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

  // Generate daily collection spark data from recent payments
  const dailyCollections = useMemo(() => {
    if (!data?.recentPayments) return [];
    const dailyMap: Record<string, number> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dailyMap[format(d, "yyyy-MM-dd")] = 0;
    }
    data.recentPayments.forEach((p) => {
      if (p.date) {
        const key = format(new Date(p.date), "yyyy-MM-dd");
        if (key in dailyMap) {
          dailyMap[key] += p.amount;
        }
      }
    });
    return Object.entries(dailyMap).map(([date, amount]) => ({
      day: format(new Date(date + "T00:00:00"), "EEE"),
      date,
      amount: Math.round(amount),
    }));
  }, [data]);

  // Period label for charts
  const periodLabel =
    period === "week" ? "This Week" : period === "month" ? "This Month" : "This Term";

  // Generate sparkline data for stat cards
  const sparkData = useMemo(() => {
    if (!data?.charts.attendanceTrend) return [];
    return data.charts.attendanceTrend.map((d) => d.count);
  }, [data]);

  // Admin name from session
  const adminName = user?.name || "Administrator";

  // Pending action items (derived from dashboard data)
  const pendingItems = useMemo(() => {
    if (!data) return [];
    const items: { icon: React.ElementType; label: string; value: string; color: string; href: string }[] = [];
    if (data.financialSummary.unpaidInvoices.count > 0) {
      items.push({
        icon: FileWarning,
        label: "Unpaid Invoices",
        value: `${data.financialSummary.unpaidInvoices.count} invoices (${formatCurrency(data.financialSummary.unpaidInvoices.amount)})`,
        color: "text-amber-600 bg-amber-50",
        href: "/admin/invoices",
      });
    }
    if (data.financial.pendingPayments > 0) {
      items.push({
        icon: AlertCircle,
        label: "Outstanding Fees",
        value: `${data.financial.pendingPayments} pending payments`,
        color: "text-rose-600 bg-rose-50",
        href: "/admin/daily-fees/collection",
      });
    }
    if (data.financial.collectionRate < 60) {
      items.push({
        icon: TrendingDown,
        label: "Low Collection Rate",
        value: `Only ${data.financial.collectionRate}% collected this term`,
        color: "text-orange-600 bg-orange-50",
        href: "/admin/reports/collection-efficiency",
      });
    }
    return items;
  }, [data]);

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
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="space-y-1.5">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-40" />
            </div>
            <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-24 rounded-lg" />
              <Skeleton className="h-8 w-20 rounded-lg" />
            </div>
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
            <ChartSkeleton />
            <ChartSkeleton />
            <ChartSkeleton />
          </div>

          {/* Table */}
          <TableSkeleton />

          {/* Quick Actions */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-2xl" />
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
            Page Header — Welcome, Live Clock, School Info
            ═══════════════════════════════════════════════════════ */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-5 sm:p-6 text-white">
          {/* Decorative circles */}
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-emerald-500/10 -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-1/3 w-40 h-40 rounded-full bg-violet-500/10 translate-y-1/2" />

          <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Welcome back,</p>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight mt-0.5">
                  {adminName}
                </h1>
                <p className="text-sm text-slate-400 mt-1">{today}</p>
              </div>
            </div>
            <div className="flex flex-col sm:items-end gap-2">
              <LiveClock />
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-medium text-slate-300 bg-slate-700/50 border border-slate-600/50 px-3 py-1.5 rounded-lg">
                  {data.academicTerm.year}
                </span>
                <span className="text-xs font-medium text-emerald-300 bg-emerald-500/20 border border-emerald-500/30 px-3 py-1.5 rounded-lg">
                  {data.academicTerm.term}
                </span>
                {canViewFinance && (
                  <span className="text-xs font-medium text-sky-300 bg-sky-500/20 border border-sky-500/30 px-3 py-1.5 rounded-lg">
                    {data.stats.totalStudents} Students
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════
            Row 1: Key Metric Cards (6 equal cards)
            ═══════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          <StatCard
            icon={GraduationCap}
            label="Total Students"
            value={formatCompactNumber(data.stats.totalStudents)}
            trend={`${data.academicTerm.term}`}
            iconBg="bg-emerald-500"
            borderColor="#10b981"
            gradientFrom="#34d399"
            sparkData={sparkData}
          />
          <StatCard
            icon={Users}
            label="Teachers"
            value={formatCompactNumber(data.stats.activeTeachers)}
            iconBg="bg-blue-500"
            borderColor="#3b82f6"
            gradientFrom="#60a5fa"
          />
          <StatCard
            icon={School}
            label="Classes"
            value={data.stats.totalClasses}
            iconBg="bg-violet-500"
            borderColor="#8b5cf6"
            gradientFrom="#a78bfa"
          />
          <StatCard
            icon={DollarSign}
            label="Revenue"
            value={formatCompactNumber(data.financial.totalRevenue)}
            trend={data.financial.collectionRate >= 60 ? `${data.financial.collectionRate}% collected` : undefined}
            trendUp={data.financial.collectionRate >= 60}
            iconBg="bg-teal-500"
            borderColor="#14b8a6"
            gradientFrom="#2dd4bf"
          />
          <StatCard
            icon={AlertTriangle}
            label="Outstanding"
            value={data.financial.pendingPayments}
            trend={outstandingAmount > 0 ? formatCurrency(outstandingAmount) : "All paid"}
            trendUp={outstandingAmount === 0}
            iconBg="bg-amber-500"
            borderColor="#f59e0b"
            gradientFrom="#fbbf24"
          />
          <StatCard
            icon={ClipboardCheck}
            label="Attendance"
            value={formatCompactNumber(data.stats.attendanceToday)}
            iconBg="bg-cyan-500"
            borderColor="#06b6d4"
            gradientFrom="#22d3ee"
            sparkData={sparkData}
          />
        </div>

        {/* ═══════════════════════════════════════════════════════
            Pending Action Items (only if items exist)
            ═══════════════════════════════════════════════════════ */}
        {pendingItems.length > 0 && (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border border-amber-200/60 p-4 sm:p-5">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center">
                <Bell className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-sm font-semibold text-amber-900">
                Needs Attention
              </h3>
              <Badge className="bg-amber-500 hover:bg-amber-600 text-white text-[10px] px-2 py-0.5">
                {pendingItems.length}
              </Badge>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {pendingItems.map((item, idx) => {
                const ItemIcon = item.icon;
                return (
                  <button
                    key={idx}
                    onClick={() => router.push(item.href)}
                    className="flex items-start gap-3 p-3 rounded-xl bg-white/70 border border-amber-100 hover:bg-white hover:shadow-sm transition-all cursor-pointer text-left min-h-[44px]"
                  >
                    <div
                      className={`w-9 h-9 rounded-lg ${item.color} flex items-center justify-center flex-shrink-0`}
                    >
                      <ItemIcon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900">
                        {item.label}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5 truncate">
                        {item.value}
                      </p>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════
            Row 2: Financial Summary + Daily Collection Mini Chart
            ═══════════════════════════════════════════════════════ */}
        {canViewFinance && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 sm:gap-4">
            <StatCard
              icon={TrendingUp}
              label="Total Revenue"
              value={formatCurrency(data.financial.totalRevenue)}
              trend={`This term (${data.academicTerm.term})`}
              trendUp={true}
              iconBg="bg-emerald-500"
              borderColor="#10b981"
              gradientFrom="#34d399"
            />
            <StatCard
              icon={BarChart3}
              label="Collection Rate"
              value={`${data.financial.collectionRate}%`}
              trend={data.financial.collectionLabel}
              trendUp={data.financial.collectionRate >= 60}
              iconBg="bg-blue-500"
              borderColor="#3b82f6"
              gradientFrom="#60a5fa"
            />
            <StatCard
              icon={TrendingDown}
              label="Unpaid Invoices"
              value={data.financialSummary.unpaidInvoices.count}
              trend={formatCurrency(data.financialSummary.unpaidInvoices.amount)}
              trendUp={false}
              iconBg="bg-rose-500"
              borderColor="#f43f5e"
              gradientFrom="#fb7185"
            />
            {/* Daily Collections Mini Bar Chart */}
            <div className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden">
              <div className="h-1 w-full bg-gradient-to-r from-emerald-500 to-teal-400" />
              <div className="p-4 sm:p-5">
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500 flex items-center justify-center">
                    <BarChart3 className="w-3.5 h-3.5 text-white" />
                  </div>
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Daily Collections
                  </h4>
                </div>
                <ChartContainer
                  config={dailyCollectionConfig}
                  className="h-[80px] w-full"
                >
                  <BarChart
                    data={dailyCollections}
                    margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
                  >
                    <XAxis
                      dataKey="day"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 9, fill: "#94a3b8" }}
                    />
                    <YAxis hide />
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          formatter={(value) => [formatCurrency(value as number), "Collected"]}
                        />
                      }
                    />
                    <Bar
                      dataKey="amount"
                      fill="#10b981"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={28}
                    />
                  </BarChart>
                </ChartContainer>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════
            Row 3: Charts - Period Selector + 2 columns
            ═══════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
          {/* Student Distribution by Class */}
          <ChartCard
            icon={BarChart3}
            title="Student Distribution by Class"
            iconBg="bg-emerald-500"
            extra={
              <Tabs value={period} onValueChange={setPeriod}>
                <TabsList className="h-8 text-xs">
                  <TabsTrigger value="week" className="text-xs px-2.5 h-7 min-h-[28px]">Week</TabsTrigger>
                  <TabsTrigger value="month" className="text-xs px-2.5 h-7 min-h-[28px]">Month</TabsTrigger>
                  <TabsTrigger value="term" className="text-xs px-2.5 h-7 min-h-[28px]">Term</TabsTrigger>
                </TabsList>
              </Tabs>
            }
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
            badge={periodLabel}
            extra={
              <Tabs value={period} onValueChange={setPeriod}>
                <TabsList className="h-8 text-xs">
                  <TabsTrigger value="week" className="text-xs px-2.5 h-7 min-h-[28px]">Week</TabsTrigger>
                  <TabsTrigger value="month" className="text-xs px-2.5 h-7 min-h-[28px]">Month</TabsTrigger>
                  <TabsTrigger value="term" className="text-xs px-2.5 h-7 min-h-[28px]">Term</TabsTrigger>
                </TabsList>
              </Tabs>
            }
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
            Mobile: card-based list with payment method icons
            Desktop: alternating row table
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
                className="text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 min-h-[44px] px-4"
                onClick={() => router.push("/admin/payments")}
              >
                View All
                <ArrowUpRight className="w-4 h-4 ml-1" />
              </Button>
            </div>

            {/* Mobile Card View with payment method icons */}
            <div className="lg:hidden p-4 pt-3">
              {data.recentPayments.length === 0 ? (
                <div className="text-center text-slate-400 py-12 text-sm">
                  No recent payments found
                </div>
              ) : (
                <div className="space-y-2">
                  {data.recentPayments.map((payment, idx) => {
                    const MethodIcon = getMethodIcon(payment.method);
                    return (
                      <button
                        key={idx}
                        onClick={() => router.push("/admin/payments")}
                        className="w-full flex items-center gap-3 px-3 py-3 rounded-xl border border-slate-100 hover:bg-slate-50 active:bg-slate-100 transition-colors text-left min-h-[44px]"
                      >
                        <div
                          className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${getMethodColor(payment.method)}`}
                        >
                          <MethodIcon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 truncate">
                            {payment.studentName || "Unknown"}
                          </p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {payment.date
                              ? format(new Date(payment.date), "MMM d, yyyy")
                              : "\u2014"}
                            {" \u00B7 "}
                            <span className="capitalize">
                              {payment.method.replace(/_/g, " ")}
                            </span>
                          </p>
                        </div>
                        <p className="text-sm font-bold text-slate-900 tabular-nums flex-shrink-0">
                          {formatCurrency(payment.amount)}
                        </p>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Desktop Table View with alternating rows */}
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
                      data.recentPayments.map((payment, idx) => {
                        const MethodIcon = getMethodIcon(payment.method);
                        return (
                          <tr
                            key={idx}
                            className={`border-b border-slate-50 hover:bg-slate-50/50 transition-colors cursor-pointer ${idx % 2 === 1 ? "bg-slate-25" : ""}`}
                            style={idx % 2 === 1 ? { backgroundColor: "#f8fafc" } : undefined}
                            onClick={() => router.push("/admin/payments")}
                          >
                            <td className="px-4 py-3 font-medium text-slate-900">
                              {payment.studentName || "Unknown"}
                            </td>
                            <td className="px-4 py-3 text-slate-500 font-mono text-xs">
                              {payment.invoiceCode || "\u2014"}
                            </td>
                            <td className="px-4 py-3 text-right font-semibold text-slate-900 tabular-nums">
                              {formatCurrency(payment.amount)}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <div
                                  className={`w-6 h-6 rounded flex items-center justify-center ${getMethodColor(payment.method)}`}
                                >
                                  <MethodIcon className="w-3 h-3" />
                                </div>
                                <span className="text-slate-600 capitalize">
                                  {payment.method.replace(/_/g, " ")}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-slate-500">
                              {payment.date
                                ? format(
                                    new Date(payment.date),
                                    "MMM d, yyyy"
                                  )
                                : "\u2014"}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════
            Row 6: Announcements / Notices Preview
            ═══════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
          {/* Quick Actions */}
          <div>
            <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <div className="w-1.5 h-5 rounded-full bg-emerald-500" />
              Quick Actions
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <QuickAction
                icon={UserPlus}
                label="Add Student"
                href="/admin/students/new"
                gradient="linear-gradient(135deg, #10b981, #059669)"
                onClick={(href) => router.push(href)}
              />
              <QuickAction
                icon={Receipt}
                label="Create Invoice"
                href="/admin/invoices"
                gradient="linear-gradient(135deg, #3b82f6, #2563eb)"
                onClick={(href) => router.push(href)}
              />
              <QuickAction
                icon={CheckSquare}
                label="Attendance"
                href="/attendance"
                gradient="linear-gradient(135deg, #8b5cf6, #7c3aed)"
                onClick={(href) => router.push(href)}
              />
              <QuickAction
                icon={Eye}
                label="View Reports"
                href="/admin/reports/annual"
                gradient="linear-gradient(135deg, #f59e0b, #d97706)"
                onClick={(href) => router.push(href)}
              />
              <QuickAction
                icon={DollarSign}
                label="Take Payment"
                href="/admin/daily-fees/collection"
                gradient="linear-gradient(135deg, #06b6d4, #0891b2)"
                onClick={(href) => router.push(href)}
              />
              <QuickAction
                icon={GraduationCap}
                label="All Students"
                href="/admin/students"
                gradient="linear-gradient(135deg, #f43f5e, #e11d48)"
                onClick={(href) => router.push(href)}
              />
            </div>
          </div>

          {/* Announcements / Notices Preview */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <div className="w-1.5 h-5 rounded-full bg-amber-500" />
                Announcements
              </h3>
              <Button
                variant="ghost"
                size="sm"
                className="text-slate-500 hover:text-slate-700 min-h-[44px] px-3"
                onClick={() => router.push("/admin/notices")}
              >
                View All
                <ArrowUpRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden">
              <div className="divide-y divide-slate-100">
                {/* Notice 1 */}
                <div className="p-4 hover:bg-slate-50/50 transition-colors cursor-pointer min-h-[44px]">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Megaphone className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-slate-900 truncate">
                          Mid-Term Examination Schedule Released
                        </p>
                        <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 text-[10px] px-1.5 py-0 flex-shrink-0">
                          New
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                        The mid-term examination schedule for all classes has been published. Please ensure all teachers and students are informed about the dates and subjects.
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1.5">
                        2 hours ago
                      </p>
                    </div>
                  </div>
                </div>
                {/* Notice 2 */}
                <div className="p-4 hover:bg-slate-50/50 transition-colors cursor-pointer min-h-[44px]">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-sky-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Volume2 className="w-4 h-4 text-sky-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">
                        Fee Payment Deadline Reminder
                      </p>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                        Parents are reminded that the final installment of fees is due by the end of this month. Please ensure timely payments to avoid late fees.
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1.5">
                        1 day ago
                      </p>
                    </div>
                  </div>
                </div>
                {/* Notice 3 */}
                <div className="p-4 hover:bg-slate-50/50 transition-colors cursor-pointer min-h-[44px]">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-violet-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <School className="w-4 h-4 text-violet-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">
                        Parent-Teacher Conference
                      </p>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                        The upcoming parent-teacher conference is scheduled for next Friday. All parents are encouraged to attend and discuss their children&apos;s progress.
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1.5">
                        3 days ago
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
