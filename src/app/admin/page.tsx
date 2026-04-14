"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  GraduationCap,
  Users,
  School,
  DollarSign,
  AlertTriangle,
  ClipboardCheck,
  UserPlus,
  FileText,
  CheckSquare,
  BarChart3,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  CalendarDays,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
} from "recharts";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useAuth } from "@/hooks/use-auth";
import { format } from "date-fns";

// ─── Types ───────────────────────────────────────────────────
interface DashboardStats {
  totalStudents: number;
  totalTeachers: number;
  totalClasses: number;
  revenueThisTerm: number;
  outstandingFees: number;
  attendanceToday: number;
}

interface RecentPayment {
  id: number;
  studentName: string;
  amount: number;
  method: string;
  date: string | null;
  status: string;
  invoiceCode: string;
}

interface MonthlyRevenueItem {
  month: string;
  revenue: number;
}

interface FeeOverviewItem {
  name: string;
  value: number;
  fill: string;
}

interface DashboardData {
  stats: DashboardStats;
  charts: {
    monthlyRevenue: MonthlyRevenueItem[];
    feeOverview: FeeOverviewItem[];
  };
  recentPayments: RecentPayment[];
  academicTerm: {
    year: string;
    term: string;
  };
}

// ─── Chart Configs ───────────────────────────────────────────
const revenueChartConfig = {
  revenue: {
    label: "Revenue",
    color: "var(--chart-1)",
  },
};

const feeChartConfig = {
  paid: {
    label: "Paid",
    color: "#10b981",
  },
  outstanding: {
    label: "Outstanding",
    color: "#f59e0b",
  },
  overdue: {
    label: "Overdue",
    color: "#ef4444",
  },
};

const PIE_COLORS = ["#10b981", "#f59e0b", "#ef4444"];

// ─── Stat Card Config ────────────────────────────────────────
const statCards = [
  {
    key: "totalStudents" as const,
    label: "Total Students",
    icon: GraduationCap,
    color: "text-emerald-600",
    bgColor: "bg-emerald-50",
    iconBg: "bg-emerald-100",
    borderColor: "border-emerald-200",
  },
  {
    key: "totalTeachers" as const,
    label: "Total Teachers",
    icon: Users,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    iconBg: "bg-blue-100",
    borderColor: "border-blue-200",
  },
  {
    key: "totalClasses" as const,
    label: "Total Classes",
    icon: School,
    color: "text-purple-600",
    bgColor: "bg-purple-50",
    iconBg: "bg-purple-100",
    borderColor: "border-purple-200",
  },
  {
    key: "revenueThisTerm" as const,
    label: "Revenue (This Term)",
    icon: DollarSign,
    color: "text-green-600",
    bgColor: "bg-green-50",
    iconBg: "bg-green-100",
    borderColor: "border-green-200",
    isCurrency: true,
  },
  {
    key: "outstandingFees" as const,
    label: "Outstanding Fees",
    icon: AlertTriangle,
    color: "text-amber-600",
    bgColor: "bg-amber-50",
    iconBg: "bg-amber-100",
    borderColor: "border-amber-200",
    isCurrency: true,
    isNegative: true,
  },
  {
    key: "attendanceToday" as const,
    label: "Attendance Today",
    icon: ClipboardCheck,
    color: "text-cyan-600",
    bgColor: "bg-cyan-50",
    iconBg: "bg-cyan-100",
    borderColor: "border-cyan-200",
  },
];

// ─── Quick Actions ───────────────────────────────────────────
const quickActions = [
  {
    label: "Add New Student",
    icon: UserPlus,
    href: "/admin/students/new",
    variant: "default" as const,
  },
  {
    label: "Create Invoice",
    icon: FileText,
    href: "/admin/invoices/new",
    variant: "outline" as const,
  },
  {
    label: "Mark Attendance",
    icon: CheckSquare,
    href: "/admin/attendance",
    variant: "outline" as const,
  },
  {
    label: "View Reports",
    icon: BarChart3,
    href: "/admin/reports",
    variant: "outline" as const,
  },
];

// ─── Helper: Format currency ─────────────────────────────────
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "GHS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatCompactNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toLocaleString();
}

// ─── Status Badge ────────────────────────────────────────────
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

// ─── Stat Card Skeleton ──────────────────────────────────────
function StatCardSkeleton() {
  return (
    <Card className="gap-4 py-4">
      <CardContent className="px-4 pb-0 pt-0">
        <div className="flex items-center justify-between">
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-16" />
          </div>
          <Skeleton className="h-10 w-10 rounded-xl" />
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Component ──────────────────────────────────────────
export default function AdminDashboard() {
  const router = useRouter();
  const { isLoading: authLoading, role } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedTerm, setSelectedTerm] = useState("");

  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/dashboard");
      if (!res.ok) throw new Error("Failed to fetch dashboard data");
      const json = await res.json();
      setData(json);
      setSelectedYear(json.academicTerm.year);
      setSelectedTerm(json.academicTerm.term);
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

  // ─── Loading State ─────────────────────────────────────────
  if (authLoading || isLoading || !data) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          {/* Title skeleton */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-32" />
            </div>
          </div>

          {/* Stat cards skeleton */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <StatCardSkeleton key={i} />
            ))}
          </div>

          {/* Charts skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-3">
              <Skeleton className="h-80 w-full rounded-xl" />
            </div>
            <div className="lg:col-span-2">
              <Skeleton className="h-80 w-full rounded-xl" />
            </div>
          </div>

          {/* Table skeleton */}
          <Skeleton className="h-96 w-full rounded-xl" />
        </div>
      </DashboardLayout>
    );
  }

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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* ─── Page Header ─────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Admin Dashboard
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Overview of your school&apos;s performance and activity
            </p>
          </div>

          {/* Academic Term Selector */}
          <div className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-slate-400" />
            <Select value={selectedYear} onValueChange={setSelectedYear}>
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
            <Select value={selectedTerm} onValueChange={setSelectedTerm}>
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

        {/* ─── Stat Cards ──────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {statCards.map((card) => {
            const value = data.stats[card.key];
            const Icon = card.icon;
            return (
              <Card
                key={card.key}
                className={`gap-4 py-4 border-l-4 ${card.borderColor} hover:shadow-md transition-shadow duration-200`}
              >
                <CardContent className="px-4 pb-0 pt-0">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 min-w-0">
                      <p className="text-xs font-medium text-slate-500 truncate">
                        {card.label}
                      </p>
                      <p className={`text-xl font-bold ${card.color} tabular-nums`}>
                        {card.isCurrency
                          ? formatCurrency(value)
                          : formatCompactNumber(value)}
                      </p>
                    </div>
                    <div
                      className={`w-10 h-10 rounded-xl ${card.iconBg} flex items-center justify-center flex-shrink-0`}
                    >
                      <Icon className={`w-5 h-5 ${card.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* ─── Charts Section ──────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Monthly Revenue Bar Chart */}
          <Card className="lg:col-span-3 gap-4">
            <CardHeader className="pb-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                  </div>
                  <CardTitle className="text-base font-semibold">
                    Monthly Revenue
                  </CardTitle>
                </div>
                <span className="text-xs text-slate-400">Last 6 months</span>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <ChartContainer
                config={revenueChartConfig}
                className="h-[280px] w-full"
              >
                <BarChart
                  data={data.charts.monthlyRevenue}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    className="stroke-slate-200"
                  />
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 12, fill: "#94a3b8" }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 12, fill: "#94a3b8" }}
                    tickFormatter={(v) =>
                      v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)
                    }
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(value) => formatCurrency(value as number)}
                      />
                    }
                  />
                  <Bar
                    dataKey="revenue"
                    fill="var(--chart-1)"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={48}
                  />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Fee Collection Doughnut Chart */}
          <Card className="lg:col-span-2 gap-4">
            <CardHeader className="pb-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                  </div>
                  <CardTitle className="text-base font-semibold">
                    Fee Collection
                  </CardTitle>
                </div>
                <span className="text-xs text-slate-400">This year</span>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <ChartContainer
                config={feeChartConfig}
                className="h-[280px] w-full"
              >
                <PieChart>
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(value) => formatCurrency(value as number)}
                      />
                    }
                  />
                  <Pie
                    data={data.charts.feeOverview}
                    cx="50%"
                    cy="45%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                    nameKey="name"
                    stroke="none"
                  >
                    {data.charts.feeOverview.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={PIE_COLORS[index % PIE_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <ChartLegend
                    content={<ChartLegendContent />}
                    verticalAlign="bottom"
                  />
                </PieChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>

        {/* ─── Recent Activity Table ───────────────────────── */}
        <Card className="gap-4">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                </div>
                <CardTitle className="text-base font-semibold">
                  Recent Payments
                </CardTitle>
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
          </CardHeader>
          <CardContent className="pt-0">
            <div className="max-h-96 overflow-y-auto rounded-lg border border-slate-200 custom-scrollbar">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 hover:bg-slate-50">
                    <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Student
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Invoice
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wider text-right">
                      Amount
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wider hidden sm:table-cell">
                      Method
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wider hidden md:table-cell">
                      Date
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wider text-right">
                      Status
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.recentPayments.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-center text-slate-400 py-12"
                      >
                        No recent payments found
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.recentPayments.map((payment) => (
                      <TableRow
                        key={payment.id}
                        className="cursor-pointer hover:bg-slate-50 transition-colors"
                      >
                        <TableCell className="font-medium text-slate-900 text-sm">
                          {payment.studentName || "Unknown"}
                        </TableCell>
                        <TableCell className="text-slate-500 text-sm font-mono">
                          {payment.invoiceCode || "—"}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-slate-900 text-sm tabular-nums">
                          {formatCurrency(payment.amount)}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-slate-500 text-sm capitalize">
                          {payment.method.replace(/_/g, " ")}
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-slate-500 text-sm">
                          {payment.date
                            ? format(new Date(payment.date), "MMM d, yyyy")
                            : "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          <PaymentStatusBadge status={payment.status} />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* ─── Quick Actions ───────────────────────────────── */}
        <Card className="gap-4">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                <ArrowUpRight className="w-4 h-4 text-emerald-600" />
              </div>
              <CardTitle className="text-base font-semibold">
                Quick Actions
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Button
                    key={action.label}
                    variant={action.variant}
                    className="h-auto py-4 flex flex-col items-center gap-2.5 rounded-xl border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 transition-all duration-200 group"
                    onClick={() => router.push(action.href)}
                  >
                    <div className="w-10 h-10 rounded-xl bg-slate-100 group-hover:bg-emerald-100 flex items-center justify-center transition-colors duration-200">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-medium">{action.label}</span>
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
