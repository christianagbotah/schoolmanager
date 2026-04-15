"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Loader2,
  CreditCard,
  Receipt,
  BarChart3,
  ArrowUpRight,
  Building2,
  ClipboardList,
  FileText,
  Wallet,
  Users,
  PieChart,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import { Bar, BarChart, XAxis, YAxis, CartesianGrid, Cell } from "recharts";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { format } from "date-fns";

// ─── Types ───────────────────────────────────────────────────
interface DashboardData {
  metrics: {
    total_assets: number;
    total_liabilities: number;
    monthly_revenue: number;
    monthly_expenses: number;
    net_income: number;
    bank_balance: number;
    pending_entries: number;
    budget_used: number;
    budget_total: number;
    budget_percentage: number;
  };
  invoices: {
    totalBilled: number;
    totalCollected: number;
    outstanding: number;
    total: number;
    paid: number;
    partial: number;
    unpaid: number;
  };
  payments: {
    totalCollected: number;
    todayTotal: number;
    todayCount: number;
    monthTotal: number;
    monthCount: number;
  };
  expenses: { total: number; monthTotal: number };
  monthlyData: { month: string; revenue: number; expenses: number }[];
  recentPayments: any[];
  topDebtors: { student_id: number; name: string; student_code: string; outstanding: number }[];
  methodBreakdown: { method: string; amount: number; count: number }[];
}

// ─── Helpers ─────────────────────────────────────────────────
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "GHS", minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(amount);
}

const chartConfig = {
  revenue: { label: "Revenue", color: "#10b981" },
  expenses: { label: "Expenses", color: "#ef4444" },
};

const COLORS = ["#10b981", "#f59e0b", "#ef4444", "#3b82f6", "#8b5cf6", "#ec4899"];

// ─── Skeletons ───────────────────────────────────────────────
function StatSkeleton() {
  return <Card className="gap-4 py-4"><CardContent className="px-4 pb-0 pt-0"><div className="flex items-center justify-between"><div className="space-y-2 flex-1"><Skeleton className="h-4 w-24" /><Skeleton className="h-8 w-20" /></div><Skeleton className="h-10 w-10 rounded-xl" /></div></CardContent></Card>;
}

// ─── Main Component ──────────────────────────────────────────
export default function AccountantDashboard() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/accountant/dashboard");
      if (!res.ok) throw new Error("Failed");
      setData(await res.json());
    } catch {
      setError("Unable to load dashboard data. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{Array.from({ length: 4 }).map((_, i) => <StatSkeleton key={i} />)}</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}</div>
          <Skeleton className="h-80 w-full rounded-xl" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">{Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-80 rounded-xl" />)}</div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !data) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center"><AlertTriangle className="w-8 h-8 text-red-600" /></div>
          <h2 className="text-xl font-semibold text-slate-900">Something went wrong</h2>
          <p className="text-slate-500">{error}</p>
          <Button onClick={fetchData} variant="outline"><Loader2 className="w-4 h-4 mr-2" />Try Again</Button>
        </div>
      </DashboardLayout>
    );
  }

  const { metrics, invoices, payments, expenses: expSummary, monthlyData, recentPayments, topDebtors, methodBreakdown } = data;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* ─── Header ─────────────────────────────────────── */}
        <div className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 p-6 text-white shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                <Wallet className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Accounts Dashboard</h1>
                <p className="text-emerald-100 text-sm">Comprehensive financial overview and analytics</p>
              </div>
            </div>
            <div className="text-right text-sm">
              <p className="text-emerald-200">{format(new Date(), "EEEE, MMMM d, yyyy")}</p>
              <p className="text-white font-semibold">Net Income: {formatCurrency(metrics.net_income)}</p>
            </div>
          </div>
        </div>

        {/* ─── Primary Metrics (4 cards) ──────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="gap-4 py-4 border-l-4 border-l-emerald-500 hover:shadow-md transition-shadow">
            <CardContent className="px-4 pb-0 pt-0">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Monthly Revenue</p>
                  <p className="text-xl font-bold text-emerald-600 tabular-nums">{formatCurrency(metrics.monthly_revenue)}</p>
                  <p className="text-xs text-slate-400">{payments.monthCount} transactions</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center"><TrendingUp className="w-5 h-5 text-emerald-600" /></div>
              </div>
            </CardContent>
          </Card>
          <Card className="gap-4 py-4 border-l-4 border-l-red-500 hover:shadow-md transition-shadow">
            <CardContent className="px-4 pb-0 pt-0">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Monthly Expenses</p>
                  <p className="text-xl font-bold text-red-600 tabular-nums">{formatCurrency(metrics.monthly_expenses)}</p>
                  <p className="text-xs text-slate-400">This month</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center"><TrendingDown className="w-5 h-5 text-red-600" /></div>
              </div>
            </CardContent>
          </Card>
          <Card className="gap-4 py-4 border-l-4 border-l-amber-500 hover:shadow-md transition-shadow">
            <CardContent className="px-4 pb-0 pt-0">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Outstanding</p>
                  <p className="text-xl font-bold text-amber-600 tabular-nums">{formatCurrency(invoices.outstanding)}</p>
                  <p className="text-xs text-slate-400">{invoices.unpaid} unpaid</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center"><AlertTriangle className="w-5 h-5 text-amber-600" /></div>
              </div>
            </CardContent>
          </Card>
          <Card className="gap-4 py-4 border-l-4 border-l-sky-500 hover:shadow-md transition-shadow">
            <CardContent className="px-4 pb-0 pt-0">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Bank Balance</p>
                  <p className="text-xl font-bold text-sky-600 tabular-nums">{formatCurrency(metrics.bank_balance)}</p>
                  <p className="text-xs text-slate-400">Total assets</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-sky-100 flex items-center justify-center"><Building2 className="w-5 h-5 text-sky-600" /></div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ─── Secondary Metrics (3 cards) ────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="gap-4 py-4">
            <CardContent className="px-4 pb-0 pt-0">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500 mb-1">Net Income</p>
                  <p className={`text-2xl font-bold tabular-nums ${metrics.net_income >= 0 ? "text-emerald-600" : "text-red-600"}`}>{formatCurrency(metrics.net_income)}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center"><BarChart3 className="w-5 h-5 text-emerald-600" /></div>
              </div>
            </CardContent>
          </Card>
          <Card className="gap-4 py-4">
            <CardContent className="px-4 pb-0 pt-0">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500 mb-1">Today&apos;s Collections</p>
                  <p className="text-2xl font-bold text-emerald-600 tabular-nums">{formatCurrency(payments.todayTotal)}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center"><DollarSign className="w-5 h-5 text-teal-600" /></div>
              </div>
            </CardContent>
          </Card>
          <Card className="gap-4 py-4">
            <CardContent className="px-4 pb-0 pt-0">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500 mb-1">Pending Entries</p>
                  <p className="text-2xl font-bold text-amber-600">{metrics.pending_entries}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center"><ClipboardList className="w-5 h-5 text-amber-600" /></div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ─── Budget Utilization ─────────────────────────── */}
        {metrics.budget_total > 0 && (
          <Card className="gap-4">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center"><PieChart className="w-4 h-4 text-violet-600" /></div>
                  <CardTitle className="text-base font-semibold">Budget Utilization</CardTitle>
                </div>
                <Badge variant={metrics.budget_percentage > 90 ? "destructive" : metrics.budget_percentage > 75 ? "secondary" : "default"} className={metrics.budget_percentage > 90 ? "" : metrics.budget_percentage > 75 ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}>
                  {metrics.budget_percentage.toFixed(1)}% utilized
                </Badge>
              </div>
              <Progress value={Math.min(metrics.budget_percentage, 100)} className={`h-3 ${metrics.budget_percentage > 90 ? "[&>div]:bg-red-500" : metrics.budget_percentage > 75 ? "[&>div]:bg-amber-500" : "[&>div]:bg-emerald-500"}`} />
              <div className="flex justify-between mt-2 text-sm text-slate-500">
                <span>Spent: {formatCurrency(metrics.budget_used)}</span>
                <span>Budget: {formatCurrency(metrics.budget_total)}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ─── Chart & Invoice Breakdown ─────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 gap-4">
            <CardHeader className="pb-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center"><BarChart3 className="w-4 h-4 text-emerald-600" /></div>
                  <CardTitle className="text-base font-semibold">Revenue vs Expenses</CardTitle>
                </div>
                <span className="text-xs text-slate-400">Last 6 months</span>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <ChartContainer config={chartConfig} className="h-[280px] w-full">
                <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-slate-200" />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "#94a3b8" }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "#94a3b8" }} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)} />
                  <ChartTooltip content={<ChartTooltipContent formatter={(value) => formatCurrency(value as number)} />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Bar dataKey="revenue" fill="var(--chart-revenue)" radius={[6, 6, 0, 0]} maxBarSize={36} />
                  <Bar dataKey="expenses" fill="var(--chart-expenses)" radius={[6, 6, 0, 0]} maxBarSize={36} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card className="gap-4">
            <CardHeader className="pb-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-sky-100 flex items-center justify-center"><FileText className="w-4 h-4 text-sky-600" /></div>
                <CardTitle className="text-base font-semibold">Invoice Breakdown</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-0 space-y-4">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                  <p className="text-lg font-bold text-emerald-700">{invoices.paid}</p>
                  <p className="text-xs text-emerald-600 font-medium">Paid</p>
                </div>
                <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                  <p className="text-lg font-bold text-blue-700">{invoices.partial}</p>
                  <p className="text-xs text-blue-600 font-medium">Partial</p>
                </div>
                <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                  <p className="text-lg font-bold text-red-700">{invoices.unpaid}</p>
                  <p className="text-xs text-red-600 font-medium">Unpaid</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <p className="text-xs text-slate-500 mb-1">Collection Rate</p>
                  <div className="flex items-center gap-2">
                    <Progress value={invoices.totalBilled > 0 ? (invoices.totalCollected / invoices.totalBilled) * 100 : 0} className="h-2 flex-1" />
                    <span className="text-sm font-semibold text-slate-700 tabular-nums">{invoices.totalBilled > 0 ? ((invoices.totalCollected / invoices.totalBilled) * 100).toFixed(1) : 0}%</span>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <p className="text-xs text-slate-500 mb-1">Payment Methods (Month)</p>
                  <div className="space-y-1.5">
                    {methodBreakdown.slice(0, 3).map((m) => (
                      <div key={m.method} className="flex items-center justify-between text-sm">
                        <span className="text-slate-600 capitalize">{m.method?.replace(/_/g, " ")}</span>
                        <span className="font-semibold tabular-nums">{formatCurrency(m.amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ─── Quick Actions ──────────────────────────────── */}
        <Card className="gap-4">
          <CardContent className="pt-6">
            <h3 className="text-base font-semibold text-slate-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Button variant="outline" className="h-auto py-4 flex-col gap-2 hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-700" onClick={() => router.push("/accountant/invoices")}>
                <Receipt className="w-6 h-6" /><span className="text-sm font-medium">Invoices</span>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex-col gap-2 hover:bg-sky-50 hover:border-sky-200 hover:text-sky-700" onClick={() => router.push("/accountant/payments")}>
                <CreditCard className="w-6 h-6" /><span className="text-sm font-medium">Record Payment</span>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex-col gap-2 hover:bg-amber-50 hover:border-amber-200 hover:text-amber-700" onClick={() => router.push("/accountant/expenses")}>
                <TrendingDown className="w-6 h-6" /><span className="text-sm font-medium">Expenses</span>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex-col gap-2 hover:bg-violet-50 hover:border-violet-200 hover:text-violet-700" onClick={() => router.push("/accountant/reports")}>
                <BarChart3 className="w-6 h-6" /><span className="text-sm font-medium">Reports</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* ─── Recent Payments & Top Debtors ─────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="gap-4">
            <CardHeader className="pb-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center"><CreditCard className="w-4 h-4 text-emerald-600" /></div>
                  <CardTitle className="text-base font-semibold">Recent Transactions</CardTitle>
                </div>
                <Button variant="ghost" size="sm" className="text-emerald-700" onClick={() => router.push("/accountant/payments")}>View All <ArrowUpRight className="w-4 h-4 ml-1" /></Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="max-h-80 overflow-y-auto rounded-lg border border-slate-200">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50 hover:bg-slate-50">
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase">Student</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase text-right">Amount</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase hidden sm:table-cell">Method</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentPayments.length === 0 ? (
                      <TableRow><TableCell colSpan={3} className="text-center text-slate-400 py-8">No recent transactions</TableCell></TableRow>
                    ) : recentPayments.map((p: any) => (
                      <TableRow key={p.payment_id} className="hover:bg-slate-50">
                        <TableCell className="font-medium text-sm">{p.student?.name || "Unknown"}</TableCell>
                        <TableCell className="text-right font-semibold text-sm tabular-nums text-emerald-600">{formatCurrency(p.amount)}</TableCell>
                        <TableCell className="hidden sm:table-cell text-sm text-slate-500 capitalize">{p.payment_method?.replace(/_/g, " ")}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Card className="gap-4">
            <CardHeader className="pb-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center"><Users className="w-4 h-4 text-red-600" /></div>
                <CardTitle className="text-base font-semibold">Top Debtors</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="max-h-80 overflow-y-auto rounded-lg border border-slate-200">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50 hover:bg-slate-50">
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase">#</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase">Student</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase text-right">Outstanding</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topDebtors.length === 0 ? (
                      <TableRow><TableCell colSpan={3} className="text-center text-slate-400 py-8">No outstanding balances</TableCell></TableRow>
                    ) : topDebtors.map((d, i) => (
                      <TableRow key={d.student_id} className="hover:bg-slate-50">
                        <TableCell className="text-sm text-slate-400">{i + 1}</TableCell>
                        <TableCell className="font-medium text-sm">{d.name}</TableCell>
                        <TableCell className="text-right font-semibold text-sm tabular-nums text-red-600">{formatCurrency(d.outstanding)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
