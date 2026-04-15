'use client';

import { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import {
  TrendingDown, DollarSign, Calendar, CreditCard, ArrowUpRight, ArrowDownRight, Clock, Tag, Receipt,
  BarChart3, PieChart as PieChartIcon, Target, AlertTriangle, ChevronUp, ChevronDown,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, LineChart, Line, Legend,
} from 'recharts';
import Link from 'next/link';

interface DashboardData {
  overview: {
    totalAmount: number; approvedAmount: number; pendingAmount: number;
    thisMonthAmount: number; thisMonthCount: number; todayAmount: number;
    averageExpense: number; totalCount: number;
  };
  comparison: {
    prevMonthAmount: number; prevMonthCount: number; monthChangePercent: number; isIncrease: boolean;
  };
  categoryBreakdown: { category: string; count: number; total: number }[];
  categoryPieData: { category: string; total: number }[];
  monthlyTrends: { month: number; year: number; total: number; count: number }[];
  methodBreakdown: { method: string; total: number; count: number }[];
  topExpenses: any[];
  recentExpenses: any[];
  budget: {
    totalBudget: number; totalSpent: number;
    accounts: { account_id: number; account_code: string; account_name: string; opening_balance: number; current_balance: number; account_category: string }[];
  };
}

function fmt(n: number) { return `GH\u20B5 ${(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`; }
function fmtShort(n: number) { if (n >= 1000) return `GH\u20B5 ${(n / 1000).toFixed(1)}k`; return `GH\u20B5 ${n.toFixed(0)}`; }

const COLORS = ['#ef4444', '#f59e0b', '#10b981', '#8b5cf6', '#0ea5e9', '#ec4899', '#f97316', '#6366f1', '#14b8a6', '#84cc16'];
const PIE_COLORS = ['#ef4444', '#f59e0b', '#10b981', '#8b5cf6', '#0ea5e9', '#ec4899', '#f97316', '#6366f1', '#14b8a6', '#84cc16'];

export default function ExpenditureDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/expenses/dashboard');
      const d = await res.json();
      setData(d);
    } catch { toast.error('Failed to load dashboard'); }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // Pie chart data
  const pieData = (data?.categoryPieData || []).map((c, i) => ({
    name: c.category || 'Uncategorized', value: c.total, color: PIE_COLORS[i % PIE_COLORS.length],
  }));

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-md">
            <TrendingDown className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Expenditure Dashboard</h1>
            <p className="text-sm text-slate-500 mt-0.5">Overview of school spending and expenses</p>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
          </div>
        ) : (
          <>
            {/* ── Overview Stats ── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {/* Total Spent */}
              <Card className="border-l-4 border-l-red-500">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Total Spent</p>
                    <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center"><DollarSign className="w-4 h-4 text-red-500" /></div>
                  </div>
                  <p className="text-xl font-bold font-mono text-red-600">{fmt(data?.overview.totalAmount || 0)}</p>
                  <p className="text-[10px] text-slate-400 mt-1">{data?.overview.totalCount || 0} transactions</p>
                </CardContent>
              </Card>

              {/* This Month with comparison */}
              <Card className="border-l-4 border-l-emerald-500">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">This Month</p>
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center"><Calendar className="w-4 h-4 text-emerald-500" /></div>
                  </div>
                  <p className="text-xl font-bold font-mono">{fmt(data?.overview.thisMonthAmount || 0)}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <p className="text-[10px] text-slate-400">{data?.overview.thisMonthCount || 0} expenses</p>
                    {data?.comparison && (
                      <span className={`flex items-center text-[10px] font-bold ${data.comparison.isIncrease ? 'text-red-600' : 'text-emerald-600'}`}>
                        {data.comparison.isIncrease ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                        {Math.abs(data.comparison.monthChangePercent)}% vs prev
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Previous Month */}
              <Card className="border-l-4 border-l-sky-500">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Last Month</p>
                    <div className="w-8 h-8 rounded-lg bg-sky-100 flex items-center justify-center"><BarChart3 className="w-4 h-4 text-sky-500" /></div>
                  </div>
                  <p className="text-xl font-bold font-mono text-sky-600">{fmt(data?.comparison?.prevMonthAmount || 0)}</p>
                  <p className="text-[10px] text-slate-400 mt-1">{data?.comparison?.prevMonthCount || 0} expenses</p>
                </CardContent>
              </Card>

              {/* Today */}
              <Card className="border-l-4 border-l-amber-500">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Today</p>
                    <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center"><Clock className="w-4 h-4 text-amber-500" /></div>
                  </div>
                  <p className="text-xl font-bold font-mono text-amber-600">{fmt(data?.overview.todayAmount || 0)}</p>
                  <p className="text-[10px] text-slate-400 mt-1">Avg: {fmt(data?.overview.averageExpense || 0)}</p>
                </CardContent>
              </Card>
            </div>

            {/* ── Month-over-Month Comparison Card ── */}
            {data?.comparison && data.comparison.prevMonthAmount > 0 && (
              <Card className="p-5 bg-gradient-to-r from-slate-50 to-slate-100">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${data.comparison.isIncrease ? 'bg-red-100' : 'bg-emerald-100'}`}>
                      {data.comparison.isIncrease
                        ? <TrendingDown className="w-7 h-7 text-red-600" />
                        : <ArrowDownRight className="w-7 h-7 text-emerald-600" />
                      }
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-700">Month-over-Month Change</p>
                      <p className="text-2xl font-bold text-slate-900">
                        {data.comparison.isIncrease ? '+' : ''}{data.comparison.monthChangePercent}%
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-6 text-sm">
                    <div>
                      <p className="text-slate-400">This Month</p>
                      <p className="font-bold">{fmt(data.overview.thisMonthAmount)}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Last Month</p>
                      <p className="font-bold">{fmt(data.comparison.prevMonthAmount)}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Difference</p>
                      <p className={`font-bold ${data.comparison.isIncrease ? 'text-red-600' : 'text-emerald-600'}`}>
                        {data.comparison.isIncrease ? '+' : ''}{fmt(data.overview.thisMonthAmount - data.comparison.prevMonthAmount)}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* ── Charts Row ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Monthly Trend Line Chart */}
              <Card className="lg:col-span-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-slate-400" /> Monthly Spending Trend (Last 12 Months)
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={(data?.monthlyTrends || []).map(m => ({ ...m, label: monthLabels[(m.month || 1) - 1] }))}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} />
                        <YAxis tick={{ fontSize: 11 }} tickLine={false} tickFormatter={v => fmtShort(v)} />
                        <Tooltip
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                          formatter={(value: number) => [fmt(value), 'Spent']}
                        />
                        <Line type="monotone" dataKey="total" stroke="#ef4444" strokeWidth={3} dot={{ fill: '#ef4444', r: 4, strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Category Pie Chart */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <PieChartIcon className="w-4 h-4 text-slate-400" /> Spending by Category
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  {pieData.length > 0 ? (
                    <>
                      <div className="h-[200px] w-full mx-auto">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={pieData} dataKey="value" nameKey="name"
                              cx="50%" cy="50%" innerRadius={45} outerRadius={80} paddingAngle={2}
                            >
                              {pieData.map((entry, i) => <Cell key={i} fill={entry.color} stroke="none" />)}
                            </Pie>
                            <Tooltip
                              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                              formatter={(value: number) => [fmt(value), 'Spent']}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <ScrollArea className="max-h-[120px] mt-3">
                        <div className="space-y-2">
                          {pieData.slice(0, 8).map((c, i) => {
                            const total = pieData.reduce((s, p) => s + p.value, 0);
                            const pct = total > 0 ? ((c.value / total) * 100).toFixed(1) : '0';
                            return (
                              <div key={i} className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2">
                                  <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: c.color }} />
                                  <span className="text-slate-600 truncate">{c.name}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-slate-400">{pct}%</span>
                                  <span className="font-mono font-medium">{fmt(c.value)}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </ScrollArea>
                    </>
                  ) : (
                    <div className="h-[200px] flex items-center justify-center text-sm text-slate-400">No category data</div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* ── Bottom Row ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Payment Methods */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-slate-400" /> Payment Methods
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 space-y-3">
                  {(data?.methodBreakdown || []).map(m => {
                    const total = data?.overview.totalAmount || 1;
                    const pct = (m.total / total) * 100;
                    return (
                      <div key={m.method} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-600 capitalize">{(m.method || 'other').replace(/_/g, ' ')}</span>
                          <span className="font-mono font-medium">{fmt(m.total)}</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full bg-gradient-to-r from-red-400 to-red-500 transition-all" style={{ width: `${Math.min(pct, 100)}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              {/* Top Expenses */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-slate-400" /> Top 10 Expense Items
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <ScrollArea className="max-h-[300px]">
                    <div className="space-y-2">
                      {(data?.topExpenses || []).map((e, i) => (
                        <div key={e.id} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 transition">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="text-xs font-bold text-slate-300 w-5 text-center">{i + 1}</span>
                            <div className="min-w-0">
                              <p className="text-xs font-medium truncate">{e.title}</p>
                              <p className="text-[10px] text-slate-400">{e.expense_category?.expense_category_name || 'Uncategorized'}{e.expense_date ? ` · ${new Date(e.expense_date).toLocaleDateString()}` : ''}</p>
                            </div>
                          </div>
                          <span className="font-mono font-bold text-sm text-red-600 flex-shrink-0 ml-2">{fmt(e.amount)}</span>
                        </div>
                      ))}
                      {(!data?.topExpenses || data.topExpenses.length === 0) && (
                        <p className="text-sm text-slate-400 py-8 text-center">No expenses recorded</p>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>

            {/* ── Budget vs Actual ── */}
            {data?.budget && data.budget.totalBudget > 0 && (
              <Card className="p-5">
                <CardHeader className="p-0 pb-4">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Target className="w-4 h-4 text-slate-400" /> Budget vs Actual Spending
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 space-y-4">
                  {/* Overall budget bar */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-semibold text-slate-700">Overall Budget Utilization</p>
                      <p className="text-sm font-bold">{fmt(data.budget.totalSpent)} / {fmt(data.budget.totalBudget)}</p>
                    </div>
                    <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${data.budget.totalSpent > data.budget.totalBudget ? 'bg-red-500' : 'bg-emerald-500'}`}
                        style={{ width: `${Math.min((data.budget.totalSpent / Math.max(data.budget.totalBudget, 1)) * 100, 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      {data.budget.totalBudget > 0 ? ((data.budget.totalSpent / data.budget.totalBudget) * 100).toFixed(1) : 0}% utilized
                      {data.budget.totalSpent > data.budget.totalBudget && <span className="text-red-600 font-bold ml-2">OVER BUDGET</span>}
                    </p>
                  </div>

                  {/* Per-account breakdown */}
                  {data.budget.accounts.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {data.budget.accounts.map(acc => {
                        const spent = Math.abs(acc.current_balance || 0);
                        const budget = acc.opening_balance || 0;
                        const pct = budget > 0 ? (spent / budget) * 100 : 0;
                        const overBudget = spent > budget && budget > 0;
                        return (
                          <div key={acc.account_id} className="bg-slate-50 rounded-xl p-3">
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-xs font-semibold text-slate-700 truncate">{acc.account_name}</p>
                              {overBudget && <Badge variant="destructive" className="text-[9px] h-4">Over</Badge>}
                            </div>
                            <div className="h-2 bg-slate-200 rounded-full overflow-hidden mb-1">
                              <div
                                className={`h-full rounded-full ${overBudget ? 'bg-red-500' : pct > 80 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                style={{ width: `${Math.min(pct, 100)}%` }}
                              />
                            </div>
                            <div className="flex items-center justify-between text-[10px]">
                              <span className="text-slate-400">{fmt(spent)}</span>
                              <span className="text-slate-400">of {fmt(budget)}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* ── Monthly Trend Bar Chart ── */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-slate-400" /> Monthly Expense Comparison
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="h-[280px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={(data?.monthlyTrends || []).map(m => ({ ...m, label: monthLabels[(m.month || 1) - 1] }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} />
                      <YAxis tick={{ fontSize: 11 }} tickLine={false} tickFormatter={v => fmtShort(v)} />
                      <Tooltip
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                        formatter={(value: number, name: string) => [name === 'total' ? fmt(value) : value, name === 'total' ? 'Amount' : 'Count']}
                      />
                      <Bar dataKey="total" fill="#ef4444" radius={[6, 6, 0, 0]} name="total" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* ── Recent Expenses ── */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-400" /> Recent Expenses
                  </CardTitle>
                  <Button asChild variant="ghost" size="sm" className="text-xs text-slate-500">
                    <Link href="/admin/expenses">View All</Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <ScrollArea className="max-h-72">
                  <div className="space-y-2">
                    {(data?.recentExpenses || []).map(e => (
                      <div key={e.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition">
                        <div className="min-w-0">
                          <p className="text-xs font-medium truncate">{e.title}</p>
                          <p className="text-[10px] text-slate-400">{e.expense_category?.expense_category_name || '—'} · {e.expense_date ? new Date(e.expense_date).toLocaleDateString() : '—'}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Badge variant="secondary" className="text-[10px] h-5 capitalize">{(e.status || 'pending')}</Badge>
                          <span className="font-mono font-bold text-sm text-red-600">{fmt(e.amount)}</span>
                        </div>
                      </div>
                    ))}
                    {(!data?.recentExpenses || data.recentExpenses.length === 0) && (
                      <p className="text-sm text-slate-400 py-8 text-center">No expenses recorded</p>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
