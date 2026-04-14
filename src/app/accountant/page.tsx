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
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Bar, BarChart, XAxis, YAxis, CartesianGrid } from "recharts";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useAuth } from "@/hooks/use-auth";
import { format } from "date-fns";

// ─── Types ───────────────────────────────────────────────────
interface PaymentSummary {
  totalCollected: number;
  todayTotal: number;
  monthTotal: number;
}

interface PaymentRecord {
  payment_id: number;
  receipt_code: string;
  student: { student_id: number; name: string; student_code: string };
  amount: number;
  payment_method: string;
  timestamp: string | null;
}

interface InvoiceSummary {
  totalBilled: number;
  totalCollected: number;
  outstanding: number;
}

interface ExpenseSummary {
  monthTotal: number;
}

// ─── Helpers ─────────────────────────────────────────────────
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "GHS", minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(amount);
}

function formatCompact(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toLocaleString();
}

const chartConfig = { revenue: { label: "Revenue", color: "#10b981" } };

// ─── Stat Skeleton ───────────────────────────────────────────
function StatSkeleton() {
  return (
    <Card className="gap-4 py-4">
      <CardContent className="px-4 pb-0 pt-0">
        <div className="flex items-center justify-between">
          <div className="space-y-2 flex-1"><Skeleton className="h-4 w-24" /><Skeleton className="h-8 w-20" /></div>
          <Skeleton className="h-10 w-10 rounded-xl" />
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Component ──────────────────────────────────────────
export default function AccountantDashboard() {
  const router = useRouter();
  const { isLoading: authLoading } = useAuth();
  const [paymentSummary, setPaymentSummary] = useState<PaymentSummary | null>(null);
  const [recentPayments, setRecentPayments] = useState<PaymentRecord[]>([]);
  const [invoiceSummary, setInvoiceSummary] = useState<InvoiceSummary | null>(null);
  const [expenseSummary, setExpenseSummary] = useState<ExpenseSummary | null>(null);
  const [monthlyData, setMonthlyData] = useState<{ month: string; revenue: number }[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [payRes, invRes, expRes, allPayRes] = await Promise.all([
        fetch("/api/payments?limit=10"),
        fetch("/api/invoices?limit=1"),
        fetch("/api/expenses?limit=1"),
        fetch("/api/payments?limit=200"),
      ]);

      if (payRes.ok) {
        const data = await payRes.json();
        setPaymentSummary(data.summary || null);
        setRecentPayments(data.payments || []);
      }

      if (invRes.ok) {
        const data = await invRes.json();
        setInvoiceSummary(data.summary || null);
      }

      if (expRes.ok) {
        const data = await expRes.json();
        setExpenseSummary({ monthTotal: data.summary?.monthTotal || 0 });
      }

      // Build monthly chart data from all payments
      if (allPayRes.ok) {
        const allData = await allPayRes.json();
        const payments = allData.payments || [];
        const now = new Date();
        const months = Array.from({ length: 6 }, (_, i) => {
          const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
          return { label: format(d, "MMM"), month: d.getMonth(), year: d.getFullYear() };
        });

        const chartData = months.map(m => {
          const total = payments
            .filter((p: PaymentRecord) => {
              if (!p.timestamp) return false;
              const d = new Date(p.timestamp);
              return d.getMonth() === m.month && d.getFullYear() === m.year;
            })
            .reduce((sum: number, p: PaymentRecord) => sum + (p.amount || 0), 0);
          return { month: m.label, revenue: Math.round(total * 100) / 100 };
        });
        setMonthlyData(chartData);
      }
    } catch {
      setError("Unable to load dashboard data. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading) fetchData();
  }, [authLoading, fetchData]);

  // ─── Loading ───────────────────────────────────────────────
  if (authLoading || isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <StatSkeleton key={i} />)}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-3"><Skeleton className="h-80 w-full rounded-xl" /></div>
            <div className="lg:col-span-2"><Skeleton className="h-80 w-full rounded-xl" /></div>
          </div>
          <Skeleton className="h-96 w-full rounded-xl" />
        </div>
      </DashboardLayout>
    );
  }

  // ─── Error ─────────────────────────────────────────────────
  if (error) {
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* ─── Header ─────────────────────────────────────── */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Accountant Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">Financial overview and transaction management</p>
        </div>

        {/* ─── Stat Cards ──────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="gap-4 py-4 border-l-4 border-l-emerald-500 hover:shadow-md transition-shadow">
            <CardContent className="px-4 pb-0 pt-0">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-slate-500">Today&apos;s Collections</p>
                  <p className="text-xl font-bold text-emerald-600">{formatCurrency(paymentSummary?.todayTotal || 0)}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center"><DollarSign className="w-5 h-5 text-emerald-600" /></div>
              </div>
            </CardContent>
          </Card>
          <Card className="gap-4 py-4 border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
            <CardContent className="px-4 pb-0 pt-0">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-slate-500">Month Total</p>
                  <p className="text-xl font-bold text-blue-600">{formatCurrency(paymentSummary?.monthTotal || 0)}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center"><TrendingUp className="w-5 h-5 text-blue-600" /></div>
              </div>
            </CardContent>
          </Card>
          <Card className="gap-4 py-4 border-l-4 border-l-amber-500 hover:shadow-md transition-shadow">
            <CardContent className="px-4 pb-0 pt-0">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-slate-500">Outstanding</p>
                  <p className="text-xl font-bold text-amber-600">{formatCurrency(invoiceSummary?.outstanding || 0)}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center"><AlertTriangle className="w-5 h-5 text-amber-600" /></div>
              </div>
            </CardContent>
          </Card>
          <Card className="gap-4 py-4 border-l-4 border-l-red-500 hover:shadow-md transition-shadow">
            <CardContent className="px-4 pb-0 pt-0">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-slate-500">Month Expenses</p>
                  <p className="text-xl font-bold text-red-600">{formatCurrency(expenseSummary?.monthTotal || 0)}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center"><TrendingDown className="w-5 h-5 text-red-600" /></div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ─── Chart & Quick Stats ─────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Revenue Chart */}
          <Card className="lg:col-span-3 gap-4">
            <CardHeader className="pb-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center"><BarChart3 className="w-4 h-4 text-emerald-600" /></div>
                  <CardTitle className="text-base font-semibold">Revenue Trend</CardTitle>
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
                  <Bar dataKey="revenue" fill="var(--chart-1)" radius={[6, 6, 0, 0]} maxBarSize={48} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Financial Summary */}
          <Card className="lg:col-span-2 gap-4">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center"><DollarSign className="w-4 h-4 text-blue-600" /></div>
                <CardTitle className="text-base font-semibold">Financial Summary</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-0 space-y-4">
              <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200">
                <p className="text-xs font-medium text-emerald-600 mb-1">Total Collected</p>
                <p className="text-2xl font-bold text-emerald-700">{formatCurrency(invoiceSummary?.totalCollected || 0)}</p>
              </div>
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                <p className="text-xs font-medium text-slate-600 mb-1">Total Billed</p>
                <p className="text-2xl font-bold text-slate-900">{formatCurrency(invoiceSummary?.totalBilled || 0)}</p>
              </div>
              <div className="p-4 rounded-lg bg-red-50 border border-red-200">
                <p className="text-xs font-medium text-red-600 mb-1">Outstanding Fees</p>
                <p className="text-2xl font-bold text-red-700">{formatCurrency(invoiceSummary?.outstanding || 0)}</p>
              </div>
              <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                <p className="text-xs font-medium text-blue-600 mb-1">Net Revenue (Month)</p>
                <p className="text-2xl font-bold text-blue-700">
                  {formatCurrency((paymentSummary?.monthTotal || 0) - (expenseSummary?.monthTotal || 0))}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ─── Recent Transactions ─────────────────────────── */}
        <Card className="gap-4">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center"><CreditCard className="w-4 h-4 text-emerald-600" /></div>
                <CardTitle className="text-base font-semibold">Recent Transactions</CardTitle>
              </div>
              <Button variant="ghost" size="sm" className="text-emerald-700" onClick={() => router.push("/accountant/payments")}>
                View All <ArrowUpRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="max-h-96 overflow-y-auto rounded-lg border border-slate-200">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 hover:bg-slate-50">
                    <TableHead className="text-xs font-semibold text-slate-600 uppercase">Student</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-600 uppercase">Receipt</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-600 uppercase text-right">Amount</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-600 uppercase hidden sm:table-cell">Method</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-600 uppercase hidden md:table-cell">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentPayments.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center text-slate-400 py-12">No recent transactions</TableCell></TableRow>
                  ) : (
                    recentPayments.map((p) => (
                      <TableRow key={p.payment_id} className="hover:bg-slate-50">
                        <TableCell className="font-medium text-sm">{p.student?.name || "Unknown"}</TableCell>
                        <TableCell className="font-mono text-xs text-slate-500">{p.receipt_code}</TableCell>
                        <TableCell className="text-right font-semibold text-sm tabular-nums text-emerald-600">{formatCurrency(p.amount)}</TableCell>
                        <TableCell className="hidden sm:table-cell text-sm text-slate-500 capitalize">{p.payment_method?.replace(/_/g, " ")}</TableCell>
                        <TableCell className="hidden md:table-cell text-sm text-slate-500">{p.timestamp ? format(new Date(p.timestamp), "MMM d, yyyy") : "—"}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
