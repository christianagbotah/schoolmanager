'use client';

import { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import {
  TrendingDown, DollarSign, Calendar, CreditCard, ArrowUpRight, Clock, Tag, Receipt,
} from 'lucide-react';
import {
  ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent,
} from '@/components/ui/chart';
import { Bar, BarChart, XAxis, YAxis, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

interface DashboardData {
  overview: {
    totalAmount: number; approvedAmount: number; pendingAmount: number;
    thisMonthAmount: number; thisMonthCount: number; todayAmount: number;
    averageExpense: number;
  };
  categoryBreakdown: { category: string; count: number; total: number }[];
  monthlyTrends: { month: number; year: number; total: number; count: number }[];
  methodBreakdown: { method: string; total: number; count: number }[];
  topExpenses: any[];
  recentExpenses: any[];
}

function fmt(n: number) { return `GH₵ ${(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`; }
function fmtShort(n: number) { if (n >= 1000) return `GH₵ ${(n / 1000).toFixed(1)}k`; return `GH₵ ${n.toFixed(0)}`; }

const COLORS = ['#f59e0b', '#ef4444', '#10b981', '#8b5cf6', '#0ea5e9', '#ec4899', '#f97316', '#6366f1', '#14b8a6', '#84cc16'];

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

  const catPie = (data?.categoryBreakdown || []).slice(0, 8).map((c, i) => ({
    name: c.category || 'Uncategorized', value: c.total, color: COLORS[i % COLORS.length],
  }));

  const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

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
            {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
          </div>
        ) : (
          <>
            {/* Overview Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Card className="border-l-4 border-l-red-500">
                <CardContent className="p-4">
                  <p className="text-xs text-slate-400">Total Spent</p>
                  <p className="text-xl font-bold font-mono text-red-600">{fmt(data?.overview.totalAmount || 0)}</p>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-emerald-500">
                <CardContent className="p-4">
                  <p className="text-xs text-slate-400">Approved</p>
                  <p className="text-xl font-bold font-mono text-emerald-600">{fmt(data?.overview.approvedAmount || 0)}</p>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-amber-500">
                <CardContent className="p-4">
                  <p className="text-xs text-slate-400">This Month</p>
                  <p className="text-xl font-bold font-mono">{fmt(data?.overview.thisMonthAmount || 0)}</p>
                  <p className="text-[10px] text-slate-400">{data?.overview.thisMonthCount || 0} expenses</p>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-sky-500">
                <CardContent className="p-4">
                  <p className="text-xs text-slate-400">Today</p>
                  <p className="text-xl font-bold font-mono text-sky-600">{fmt(data?.overview.todayAmount || 0)}</p>
                  <p className="text-[10px] text-slate-400">Avg: {fmt(data?.overview.averageExpense || 0)}</p>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Monthly Trend */}
              <Card className="lg:col-span-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-400" /> Monthly Spending Trend
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <ChartContainer config={{ total: { label: 'Spent', color: '#ef4444' } }} className="h-[280px] w-full">
                    <LineChart data={(data?.monthlyTrends || []).map(m => ({ ...m, label: monthLabels[(m.month || 1) - 1] }))}>
                      <XAxis dataKey="label" tick={{ fontSize: 10 }} tickLine={false} />
                      <YAxis tick={{ fontSize: 10 }} tickLine={false} tickFormatter={v => fmtShort(v)} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Line type="monotone" dataKey="total" stroke="var(--color-total)" strokeWidth={2} dot={{ fill: '#ef4444', r: 4 }} />
                    </LineChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              {/* By Category */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Tag className="w-4 h-4 text-slate-400" /> By Category
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  {catPie.length > 0 ? (
                    <ChartContainer config={{}} className="h-[180px] mx-auto">
                      <PieChart>
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Pie data={catPie} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={35} outerRadius={65} paddingAngle={2}>
                          {catPie.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                        </Pie>
                      </PieChart>
                    </ChartContainer>
                  ) : (
                    <div className="h-[180px] flex items-center justify-center text-sm text-slate-400">No data</div>
                  )}
                  <ScrollArea className="max-h-[160px] mt-3">
                    <div className="space-y-2">
                      {(data?.categoryBreakdown || []).slice(0, 6).map((c, i) => (
                        <div key={i} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                            <span className="text-slate-600 truncate">{c.category || 'Uncategorized'}</span>
                          </div>
                          <span className="font-mono font-medium">{fmt(c.total)}</span>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>

            {/* Payment Methods + Top Expenses */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
                          <div className="h-full rounded-full bg-red-400 transition-all" style={{ width: `${Math.min(pct, 100)}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-slate-400" /> Top Expenses
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <ScrollArea className="max-h-[300px]">
                    <div className="space-y-2">
                      {(data?.topExpenses || []).map((e, i) => (
                        <div key={e.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-50">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-xs font-bold text-slate-400 w-5">{i + 1}</span>
                            <div className="min-w-0">
                              <p className="text-xs font-medium truncate">{e.title}</p>
                              <p className="text-[10px] text-slate-400">{e.expense_category?.expense_category_name || 'Uncategorized'}</p>
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

            {/* Recent Expenses */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-400" /> Recent Expenses
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <ScrollArea className="max-h-72">
                  <div className="space-y-2">
                    {(data?.recentExpenses || []).map(e => (
                      <div key={e.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
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
