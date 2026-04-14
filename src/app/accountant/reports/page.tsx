"use client";

import { useEffect, useState, useCallback } from "react";
import {
  AlertTriangle,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Loader2,
  DollarSign,
  PieChart as PieIcon,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import { Bar, BarChart, XAxis, YAxis, CartesianGrid, Pie, PieChart, Cell } from "recharts";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { format } from "date-fns";

// ─── Types ───────────────────────────────────────────────────
interface ReportData {
  income: number;
  expenses: number;
  net: number;
  monthlyIncome: { month: string; amount: number }[];
  monthlyExpenses: { month: string; amount: number }[];
  expenseCategories: { category: string; amount: number }[];
}

// ─── Helpers ─────────────────────────────────────────────────
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "GHS", minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(amount);
}

const COLORS = ["#10b981", "#f59e0b", "#ef4444", "#3b82f6", "#8b5cf6", "#ec4899", "#14b8a6"];

const incomeChartConfig = { amount: { label: "Income", color: "#10b981" } };
const expenseChartConfig = { amount: { label: "Expenses", color: "#f59e0b" } };
const pieConfig = { value: { label: "Amount" }, current: { label: "Current", color: "#10b981" }, overdue: { label: "Overdue", color: "#ef4444" } };

// ─── Main Component ──────────────────────────────────────────
export default function AccountantReportsPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [payRes, expRes] = await Promise.all([
        fetch("/api/payments?limit=500"),
        fetch("/api/expenses?limit=200"),
      ]);

      let income = 0, expenses = 0;
      const monthMap = new Map<string, number>();
      const expMonthMap = new Map<string, number>();
      const catMap = new Map<string, number>();

      if (payRes.ok) {
        const payData = await payRes.json();
        (payData.payments || []).forEach((p: { amount: number; timestamp: string | null }) => {
          income += p.amount || 0;
          if (p.timestamp) {
            const key = format(new Date(p.timestamp), "MMM yyyy");
            monthMap.set(key, (monthMap.get(key) || 0) + (p.amount || 0));
          }
        });
      }

      if (expRes.ok) {
        const expData = await expRes.json();
        (expData.expenses || []).forEach((e: { amount: number; expense_date: string | null; expense_category: { expense_category_name: string } | null }) => {
          expenses += e.amount || 0;
          if (e.expense_date) {
            const key = format(new Date(e.expense_date), "MMM yyyy");
            expMonthMap.set(key, (expMonthMap.get(key) || 0) + (e.amount || 0));
          }
          if (e.expense_category?.expense_category_name) {
            catMap.set(e.expense_category.expense_category_name, (catMap.get(e.expense_category.expense_category_name) || 0) + (e.amount || 0));
          }
        });
      }

      const months = Array.from(monthMap.keys()).slice(-6);
      const expMonths = Array.from(expMonthMap.keys()).slice(-6);

      setData({
        income,
        expenses,
        net: income - expenses,
        monthlyIncome: months.map(m => ({ month: m.split(" ")[0], amount: monthMap.get(m) || 0 })),
        monthlyExpenses: expMonths.map(m => ({ month: m.split(" ")[0], amount: expMonthMap.get(m) || 0 })),
        expenseCategories: Array.from(catMap.entries()).map(([category, amount]) => ({ category, amount })),
      });
    } catch {
      setError("Failed to load financial reports");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid grid-cols-3 gap-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
          <Skeleton className="h-80 w-full rounded-xl" />
        </div>
      </DashboardLayout>
    );
  }

  if (error || !data) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center"><AlertTriangle className="w-8 h-8 text-red-600" /></div>
          <h2 className="text-xl font-semibold text-slate-900">{error || "No data available"}</h2>
          <Button onClick={fetchData} variant="outline"><Loader2 className="w-4 h-4 mr-2" />Try Again</Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Financial Reports</h1>
          <p className="text-sm text-slate-500 mt-1">Income statements and expense analysis</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="py-4 border-l-4 border-l-emerald-500">
            <CardContent className="px-4 pb-0 pt-0">
              <div className="flex items-center gap-2"><TrendingUp className="w-4 h-4 text-emerald-500" /><p className="text-xs font-medium text-slate-500">Total Income</p></div>
              <p className="text-2xl font-bold text-emerald-600 mt-1 tabular-nums">{formatCurrency(data.income)}</p>
            </CardContent>
          </Card>
          <Card className="py-4 border-l-4 border-l-red-500">
            <CardContent className="px-4 pb-0 pt-0">
              <div className="flex items-center gap-2"><TrendingDown className="w-4 h-4 text-red-500" /><p className="text-xs font-medium text-slate-500">Total Expenses</p></div>
              <p className="text-2xl font-bold text-red-600 mt-1 tabular-nums">{formatCurrency(data.expenses)}</p>
            </CardContent>
          </Card>
          <Card className={`py-4 border-l-4 ${data.net >= 0 ? "border-l-emerald-500" : "border-l-red-500"}`}>
            <CardContent className="px-4 pb-0 pt-0">
              <div className="flex items-center gap-2"><DollarSign className={`w-4 h-4 ${data.net >= 0 ? "text-emerald-500" : "text-red-500"}`} /><p className="text-xs font-medium text-slate-500">Net Revenue</p></div>
              <p className={`text-2xl font-bold mt-1 tabular-nums ${data.net >= 0 ? "text-emerald-600" : "text-red-600"}`}>{formatCurrency(data.net)}</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <Tabs defaultValue="income">
          <TabsList>
            <TabsTrigger value="income" className="min-w-[44px] min-h-[44px]"><TrendingUp className="w-4 h-4 mr-1.5" />Income</TabsTrigger>
            <TabsTrigger value="expenses" className="min-w-[44px] min-h-[44px]"><TrendingDown className="w-4 h-4 mr-1.5" />Expenses</TabsTrigger>
            <TabsTrigger value="categories" className="min-w-[44px] min-h-[44px]"><PieIcon className="w-4 h-4 mr-1.5" />Categories</TabsTrigger>
          </TabsList>

          <TabsContent value="income">
            <Card className="gap-4">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center"><BarChart3 className="w-4 h-4 text-emerald-600" /></div>
                  <CardTitle className="text-base font-semibold">Monthly Income</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {data.monthlyIncome.length === 0 ? (
                  <div className="text-center py-12"><p className="text-slate-400 text-sm">No income data available</p></div>
                ) : (
                  <ChartContainer config={incomeChartConfig} className="h-[300px] w-full">
                    <BarChart data={data.monthlyIncome} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-slate-200" />
                      <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "#94a3b8" }} />
                      <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "#94a3b8" }} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)} />
                      <ChartTooltip content={<ChartTooltipContent formatter={(value) => formatCurrency(value as number)} />} />
                      <Bar dataKey="amount" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={48} />
                    </BarChart>
                  </ChartContainer>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="expenses">
            <Card className="gap-4">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center"><BarChart3 className="w-4 h-4 text-amber-600" /></div>
                  <CardTitle className="text-base font-semibold">Monthly Expenses</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {data.monthlyExpenses.length === 0 ? (
                  <div className="text-center py-12"><p className="text-slate-400 text-sm">No expense data available</p></div>
                ) : (
                  <ChartContainer config={expenseChartConfig} className="h-[300px] w-full">
                    <BarChart data={data.monthlyExpenses} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-slate-200" />
                      <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "#94a3b8" }} />
                      <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "#94a3b8" }} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)} />
                      <ChartTooltip content={<ChartTooltipContent formatter={(value) => formatCurrency(value as number)} />} />
                      <Bar dataKey="amount" fill="#f59e0b" radius={[6, 6, 0, 0]} maxBarSize={48} />
                    </BarChart>
                  </ChartContainer>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="categories">
            <Card className="gap-4">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center"><PieIcon className="w-4 h-4 text-purple-600" /></div>
                  <CardTitle className="text-base font-semibold">Expense Categories</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {data.expenseCategories.length === 0 ? (
                  <div className="text-center py-12"><p className="text-slate-400 text-sm">No category data available</p></div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <ChartContainer config={pieConfig} className="h-[300px] w-full">
                      <PieChart>
                        <ChartTooltip content={<ChartTooltipContent formatter={(value) => formatCurrency(value as number)} />} />
                        <Pie data={data.expenseCategories} cx="50%" cy="45%" innerRadius={55} outerRadius={90} paddingAngle={3} dataKey="amount" nameKey="category" stroke="none">
                          {data.expenseCategories.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <ChartLegend content={<ChartLegendContent />} verticalAlign="bottom" />
                      </PieChart>
                    </ChartContainer>
                    <div className="space-y-3">
                      {data.expenseCategories.map((cat, i) => (
                        <div key={cat.category} className="flex items-center justify-between p-3 rounded-lg border border-slate-100">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                            <span className="text-sm font-medium text-slate-900">{cat.category}</span>
                          </div>
                          <span className="text-sm font-semibold tabular-nums">{formatCurrency(cat.amount)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
