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
  FileText,
  Building2,
  Printer,
  Download,
  Scale,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Bar, BarChart, XAxis, YAxis, CartesianGrid, Pie, PieChart, Cell, Line, LineChart } from "recharts";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { format } from "date-fns";

// ─── Types ───────────────────────────────────────────────────
interface ReportData {
  period: { from: string; to: string; fromLabel: string; toLabel: string };
  incomeStatement: {
    totalRevenue: number;
    revenueCount: number;
    totalExpenses: number;
    expenseCount: number;
    netIncome: number;
    profitMargin: number;
  };
  balanceSheet: {
    totalAssets: number;
    totalLiabilities: number;
    bankAccounts: { bankName: string; accountNumber: string; accountName: string; balance: number }[];
  };
  paymentMethods: { method: string; amount: number; count: number }[];
  expenseByCategory: { category: string; amount: number }[];
  monthlyTrend: { month: string; income: number; expenses: number; net: number }[];
  trialBalance: {
    accounts: { code: string; name: string; type: string; category: string; debit: number; credit: number; balance: number }[];
    totalDebit: number;
    totalCredit: number;
    balanced: boolean;
  };
}

// ─── Helpers ─────────────────────────────────────────────────
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "GHS", minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(amount);
}

const COLORS = ["#10b981", "#f59e0b", "#ef4444", "#3b82f6", "#8b5cf6", "#ec4899", "#14b8a6"];

const incomeChartConfig = { amount: { label: "Income", color: "#10b981" } };
const expenseChartConfig = { amount: { label: "Expenses", color: "#f59e0b" } };
const trendConfig = { income: { label: "Income", color: "#10b981" }, expenses: { label: "Expenses", color: "#ef4444" }, net: { label: "Net", color: "#3b82f6" } };
const pieConfig = { value: { label: "Amount" } };

// ─── Main Component ──────────────────────────────────────────
export default function AccountantReportsPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split("T")[0]);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ startDate, endDate });
      const res = await fetch(`/api/accountant/reports?${params}`);
      if (!res.ok) throw new Error("Failed");
      setData(await res.json());
    } catch {
      setError("Failed to load financial reports");
    } finally {
      setIsLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handlePrint = () => window.print();

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-24 rounded-xl" />
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

  const { incomeStatement, balanceSheet, paymentMethods, expenseByCategory, monthlyTrend, trialBalance } = data;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 p-6 text-white shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                <BarChart3 className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Financial Reports</h1>
                <p className="text-violet-100 text-sm">Professional financial reporting and analysis</p>
              </div>
            </div>
            <Button variant="outline" className="bg-white/20 border-white/30 text-white hover:bg-white/30 min-w-[44px] min-h-[44px]" onClick={handlePrint}>
              <Printer className="w-4 h-4 mr-2" />Print Report
            </Button>
          </div>
        </div>

        {/* Date Range Filter */}
        <Card className="gap-4">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-end gap-4">
              <div className="flex-1 space-y-2">
                <Label>From Date</Label>
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div className="flex-1 space-y-2">
                <Label>To Date</Label>
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
              <Button onClick={fetchData} className="bg-violet-600 hover:bg-violet-700 min-w-[44px] min-h-[44px]">
                <BarChart3 className="w-4 h-4 mr-2" />Generate
              </Button>
            </div>
            <p className="text-xs text-slate-400 mt-2">Period: {data.period.fromLabel} — {data.period.toLabel}</p>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Card className="py-4 border-l-4 border-l-emerald-500">
            <CardContent className="px-4 pb-0 pt-0">
              <div className="flex items-center gap-2"><TrendingUp className="w-4 h-4 text-emerald-500" /><p className="text-xs font-medium text-slate-500">Total Income</p></div>
              <p className="text-2xl font-bold text-emerald-600 mt-1 tabular-nums">{formatCurrency(incomeStatement.totalRevenue)}</p>
              <p className="text-xs text-slate-400">{incomeStatement.revenueCount} transactions</p>
            </CardContent>
          </Card>
          <Card className="py-4 border-l-4 border-l-red-500">
            <CardContent className="px-4 pb-0 pt-0">
              <div className="flex items-center gap-2"><TrendingDown className="w-4 h-4 text-red-500" /><p className="text-xs font-medium text-slate-500">Total Expenses</p></div>
              <p className="text-2xl font-bold text-red-600 mt-1 tabular-nums">{formatCurrency(incomeStatement.totalExpenses)}</p>
              <p className="text-xs text-slate-400">{incomeStatement.expenseCount} transactions</p>
            </CardContent>
          </Card>
          <Card className={`py-4 border-l-4 ${incomeStatement.netIncome >= 0 ? "border-l-emerald-500" : "border-l-red-500"}`}>
            <CardContent className="px-4 pb-0 pt-0">
              <div className="flex items-center gap-2"><DollarSign className={`w-4 h-4 ${incomeStatement.netIncome >= 0 ? "text-emerald-500" : "text-red-500"}`} /><p className="text-xs font-medium text-slate-500">Net Revenue</p></div>
              <p className={`text-2xl font-bold mt-1 tabular-nums ${incomeStatement.netIncome >= 0 ? "text-emerald-600" : "text-red-600"}`}>{formatCurrency(incomeStatement.netIncome)}</p>
            </CardContent>
          </Card>
          <Card className="py-4 border-l-4 border-l-sky-500">
            <CardContent className="px-4 pb-0 pt-0">
              <div className="flex items-center gap-2"><Building2 className="w-4 h-4 text-sky-500" /><p className="text-xs font-medium text-slate-500">Total Assets</p></div>
              <p className="text-2xl font-bold text-sky-600 mt-1 tabular-nums">{formatCurrency(balanceSheet.totalAssets)}</p>
            </CardContent>
          </Card>
        </div>

        {/* Report Tabs */}
        <Tabs defaultValue="income" className="space-y-4">
          <TabsList>
            <TabsTrigger value="income" className="min-w-[44px] min-h-[44px]"><TrendingUp className="w-4 h-4 mr-1.5 hidden sm:inline-block" />Income Statement</TabsTrigger>
            <TabsTrigger value="trend" className="min-w-[44px] min-h-[44px]"><BarChart3 className="w-4 h-4 mr-1.5 hidden sm:inline-block" />Trends</TabsTrigger>
            <TabsTrigger value="categories" className="min-w-[44px] min-h-[44px]"><PieIcon className="w-4 h-4 mr-1.5 hidden sm:inline-block" />Categories</TabsTrigger>
            <TabsTrigger value="balance" className="min-w-[44px] min-h-[44px]"><Scale className="w-4 h-4 mr-1.5 hidden sm:inline-block" />Trial Balance</TabsTrigger>
          </TabsList>

          {/* Income Statement */}
          <TabsContent value="income">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="gap-4">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center"><TrendingUp className="w-4 h-4 text-emerald-600" /></div>
                    <CardTitle className="text-base font-semibold">Income Statement</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 space-y-4">
                  <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200">
                    <p className="text-sm font-medium text-emerald-600 mb-2">Revenue</p>
                    <div className="space-y-1.5">
                      {paymentMethods.map(m => (
                        <div key={m.method} className="flex justify-between text-sm">
                          <span className="text-slate-600 capitalize">{m.method?.replace(/_/g, " ")} ({m.count})</span>
                          <span className="font-semibold tabular-nums">{formatCurrency(m.amount)}</span>
                        </div>
                      ))}
                      <div className="flex justify-between text-sm font-bold border-t border-emerald-200 pt-2 mt-2">
                        <span className="text-emerald-700">Total Revenue</span>
                        <span className="text-emerald-700 tabular-nums">{formatCurrency(incomeStatement.totalRevenue)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 rounded-lg bg-red-50 border border-red-200">
                    <p className="text-sm font-medium text-red-600 mb-2">Expenses</p>
                    <div className="space-y-1.5">
                      {expenseByCategory.map(e => (
                        <div key={e.category} className="flex justify-between text-sm">
                          <span className="text-slate-600">{e.category}</span>
                          <span className="font-semibold tabular-nums">{formatCurrency(e.amount)}</span>
                        </div>
                      ))}
                      <div className="flex justify-between text-sm font-bold border-t border-red-200 pt-2 mt-2">
                        <span className="text-red-700">Total Expenses</span>
                        <span className="text-red-700 tabular-nums">{formatCurrency(incomeStatement.totalExpenses)}</span>
                      </div>
                    </div>
                  </div>
                  <div className={`p-4 rounded-lg border ${incomeStatement.netIncome >= 0 ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"}`}>
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-lg">Net Income</span>
                      <span className={`text-2xl font-bold tabular-nums ${incomeStatement.netIncome >= 0 ? "text-emerald-700" : "text-red-700"}`}>
                        {formatCurrency(incomeStatement.netIncome)}
                      </span>
                    </div>
                    <div className="mt-2">
                      <p className="text-xs text-slate-500">Profit Margin: <span className="font-semibold">{incomeStatement.profitMargin.toFixed(1)}%</span></p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Bank Accounts (Balance Sheet) */}
              <Card className="gap-4">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-sky-100 flex items-center justify-center"><Building2 className="w-4 h-4 text-sky-600" /></div>
                    <CardTitle className="text-base font-semibold">Balance Sheet</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 space-y-4">
                  <div className="p-4 rounded-lg bg-sky-50 border border-sky-200">
                    <p className="text-sm font-medium text-sky-600 mb-3">Bank Accounts</p>
                    {balanceSheet.bankAccounts.length === 0 ? (
                      <p className="text-sm text-slate-400">No bank accounts configured</p>
                    ) : (
                      <div className="space-y-3">
                        {balanceSheet.bankAccounts.map((b, i) => (
                          <div key={i} className="flex justify-between items-start">
                            <div>
                              <p className="font-medium text-sm">{b.bankName}</p>
                              <p className="text-xs text-slate-500">{b.accountName} — {b.accountNumber}</p>
                            </div>
                            <span className="font-semibold text-sm text-sky-700 tabular-nums">{formatCurrency(b.balance)}</span>
                          </div>
                        ))}
                        <div className="flex justify-between font-bold border-t border-sky-200 pt-2">
                          <span className="text-sm text-sky-700">Total Assets</span>
                          <span className="text-sky-700 tabular-nums">{formatCurrency(balanceSheet.totalAssets)}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="p-4 rounded-lg bg-red-50 border border-red-200">
                    <p className="text-sm font-medium text-red-600 mb-3">Liabilities</p>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600">Outstanding Invoices</span>
                      <span className="font-semibold text-sm text-red-700 tabular-nums">{formatCurrency(balanceSheet.totalLiabilities)}</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                    <div className="flex justify-between items-center">
                      <span className="font-bold">Net Position</span>
                      <span className={`text-xl font-bold tabular-nums ${balanceSheet.totalAssets - balanceSheet.totalLiabilities >= 0 ? "text-emerald-700" : "text-red-700"}`}>
                        {formatCurrency(balanceSheet.totalAssets - balanceSheet.totalLiabilities)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Trends */}
          <TabsContent value="trend">
            <Card className="gap-4">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-sky-100 flex items-center justify-center"><BarChart3 className="w-4 h-4 text-sky-600" /></div>
                  <CardTitle className="text-base font-semibold">Monthly Trend (12 months)</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {monthlyTrend.length === 0 ? (
                  <div className="text-center py-12"><p className="text-slate-400 text-sm">No trend data available</p></div>
                ) : (
                  <>
                    <ChartContainer config={trendConfig} className="h-[350px] w-full">
                      <BarChart data={monthlyTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-slate-200" />
                        <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} />
                        <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)} />
                        <ChartTooltip content={<ChartTooltipContent formatter={(value) => formatCurrency(value as number)} />} />
                        <ChartLegend content={<ChartLegendContent />} />
                        <Bar dataKey="income" fill="var(--chart-income)" radius={[4, 4, 0, 0]} maxBarSize={32} />
                        <Bar dataKey="expenses" fill="var(--chart-expenses)" radius={[4, 4, 0, 0]} maxBarSize={32} />
                      </BarChart>
                    </ChartContainer>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Categories */}
          <TabsContent value="categories">
            <Card className="gap-4">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center"><PieIcon className="w-4 h-4 text-purple-600" /></div>
                  <CardTitle className="text-base font-semibold">Expense Categories</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {expenseByCategory.length === 0 ? (
                  <div className="text-center py-12"><p className="text-slate-400 text-sm">No category data available</p></div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <ChartContainer config={pieConfig} className="h-[320px] w-full">
                      <PieChart>
                        <ChartTooltip content={<ChartTooltipContent formatter={(value) => formatCurrency(value as number)} />} />
                        <Pie data={expenseByCategory} cx="50%" cy="45%" innerRadius={55} outerRadius={100} paddingAngle={3} dataKey="amount" nameKey="category" stroke="none">
                          {expenseByCategory.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <ChartLegend content={<ChartLegendContent />} verticalAlign="bottom" />
                      </PieChart>
                    </ChartContainer>
                    <div className="space-y-3">
                      {expenseByCategory.map((cat, i) => (
                        <div key={cat.category} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
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

          {/* Trial Balance */}
          <TabsContent value="balance">
            <Card className="gap-4">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center"><Scale className="w-4 h-4 text-amber-600" /></div>
                    <CardTitle className="text-base font-semibold">Trial Balance</CardTitle>
                  </div>
                  <Badge variant={trialBalance.balanced ? "default" : "destructive"} className={trialBalance.balanced ? "bg-emerald-100 text-emerald-700" : ""}>
                    {trialBalance.balanced ? "Balanced" : "Not Balanced"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {trialBalance.accounts.length === 0 ? (
                  <div className="text-center py-12">
                    <Scale className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-400 text-sm">No chart of accounts configured</p>
                    <p className="text-xs text-slate-400 mt-1">Set up accounts in Settings to generate trial balance</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-lg border border-slate-200 max-h-[400px] overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50 hover:bg-slate-50">
                          <TableHead className="text-xs font-semibold text-slate-600 uppercase">Code</TableHead>
                          <TableHead className="text-xs font-semibold text-slate-600 uppercase">Account</TableHead>
                          <TableHead className="text-xs font-semibold text-slate-600 uppercase hidden sm:table-cell">Type</TableHead>
                          <TableHead className="text-xs font-semibold text-slate-600 uppercase text-right">Debit</TableHead>
                          <TableHead className="text-xs font-semibold text-slate-600 uppercase text-right">Credit</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {trialBalance.accounts.map((acc, i) => (
                          <TableRow key={i} className="hover:bg-slate-50">
                            <TableCell className="font-mono text-sm">{acc.code}</TableCell>
                            <TableCell className="font-medium text-sm">{acc.name}</TableCell>
                            <TableCell className="hidden sm:table-cell text-sm text-slate-500">{acc.type}</TableCell>
                            <TableCell className="text-right font-semibold text-sm tabular-nums">{acc.debit > 0 ? formatCurrency(acc.debit) : "—"}</TableCell>
                            <TableCell className="text-right font-semibold text-sm tabular-nums">{acc.credit > 0 ? formatCurrency(acc.credit) : "—"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                      <TableBody>
                        <TableRow className="bg-slate-100 font-bold hover:bg-slate-100">
                          <TableCell colSpan={3} className="text-sm">Total</TableCell>
                          <TableCell className="text-right text-sm tabular-nums">{formatCurrency(trialBalance.totalDebit)}</TableCell>
                          <TableCell className="text-right text-sm tabular-nums">{formatCurrency(trialBalance.totalCredit)}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
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
