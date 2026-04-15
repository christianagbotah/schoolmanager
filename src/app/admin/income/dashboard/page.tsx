'use client';

import { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import {
  DollarSign, TrendingUp, CreditCard, Users, Calendar, Clock,
  ArrowUpRight, FileText, Wallet, AlertTriangle,
} from 'lucide-react';
import {
  ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent,
} from '@/components/ui/chart';
import { Bar, BarChart, XAxis, YAxis, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

interface IncomeData {
  currency: string; runningYear: string; runningTerm: string;
  overview: {
    totalInvoiced: number; totalCollected: number; totalOutstanding: number;
    todayCollection: number; monthCollection: number; collectionRate: number;
  };
  invoiceStats: { total: number; paid: number; unpaid: number; partial: number };
  monthlyTrend: { month: number; year: number; total: number; count: number }[];
  methodBreakdown: { method: string; total: number; count: number }[];
  recentPayments: any[];
  receivablesByClass: any[];
  topDebtors: any[];
}

function fmt(n: number) { return `GH₵ ${(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`; }
function fmtShort(n: number) { if (n >= 1000) return `GH₵ ${(n / 1000).toFixed(1)}k`; return `GH₵ ${n.toFixed(0)}`; }

const COLORS = ['#10b981', '#8b5cf6', '#0ea5e9', '#f59e0b', '#ef4444', '#ec4899'];

export default function IncomeDashboard() {
  const [data, setData] = useState<IncomeData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/income/dashboard');
      const d = await res.json();
      setData(d);
    } catch { toast.error('Failed to load income data'); }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const invoicePie = [
    { name: 'Paid', value: data?.invoiceStats.paid || 0, color: '#10b981' },
    { name: 'Partial', value: data?.invoiceStats.partial || 0, color: '#f59e0b' },
    { name: 'Unpaid', value: data?.invoiceStats.unpaid || 0, color: '#ef4444' },
  ].filter(d => d.value > 0);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md">
            <DollarSign className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Income Dashboard</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {data?.runningYear} · Term {data?.runningTerm} · Currency: {data?.currency}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
          </div>
        ) : (
          <>
            {/* Overview Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              <Card className="border-l-4 border-l-violet-500">
                <CardContent className="p-4">
                  <p className="text-xs text-slate-400">Total Invoiced</p>
                  <p className="text-lg font-bold font-mono">{fmt(data?.overview.totalInvoiced || 0)}</p>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-emerald-500">
                <CardContent className="p-4">
                  <p className="text-xs text-slate-400">Total Collected</p>
                  <p className="text-lg font-bold font-mono text-emerald-600">{fmt(data?.overview.totalCollected || 0)}</p>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-red-500">
                <CardContent className="p-4">
                  <p className="text-xs text-slate-400">Outstanding</p>
                  <p className="text-lg font-bold font-mono text-red-600">{fmt(data?.overview.totalOutstanding || 0)}</p>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-sky-500">
                <CardContent className="p-4">
                  <p className="text-xs text-slate-400">Today</p>
                  <p className="text-lg font-bold font-mono text-sky-600">{fmt(data?.overview.todayCollection || 0)}</p>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-amber-500">
                <CardContent className="p-4">
                  <p className="text-xs text-slate-400">This Month</p>
                  <p className="text-lg font-bold font-mono">{fmt(data?.overview.monthCollection || 0)}</p>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-teal-500">
                <CardContent className="p-4">
                  <p className="text-xs text-slate-400">Collection Rate</p>
                  <div className="flex items-center gap-1">
                    <ArrowUpRight className="w-4 h-4 text-emerald-500" />
                    <p className="text-lg font-bold font-mono text-teal-600">{(data?.overview.collectionRate || 0).toFixed(1)}%</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Monthly Trend */}
              <Card className="lg:col-span-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-slate-400" /> Monthly Payment Trend
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <ChartContainer config={{ total: { label: 'Collected', color: '#10b981' } }} className="h-[280px] w-full">
                    <BarChart data={(data?.monthlyTrend || []).map(m => ({ ...m, label: monthLabels[(m.month || 1) - 1] }))}>
                      <XAxis dataKey="label" tick={{ fontSize: 10 }} tickLine={false} />
                      <YAxis tick={{ fontSize: 10 }} tickLine={false} tickFormatter={v => fmtShort(v)} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="total" fill="var(--color-total)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              {/* Invoice Status Pie */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <FileText className="w-4 h-4 text-slate-400" /> Invoice Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  {invoicePie.length > 0 ? (
                    <ChartContainer config={{}} className="h-[180px] mx-auto">
                      <PieChart>
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Pie data={invoicePie} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={35} outerRadius={65} paddingAngle={2}>
                          {invoicePie.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                        </Pie>
                      </PieChart>
                    </ChartContainer>
                  ) : (
                    <div className="h-[180px] flex items-center justify-center text-sm text-slate-400">No data</div>
                  )}
                  <div className="grid grid-cols-3 gap-2 mt-3">
                    <div className="text-center p-2 rounded-lg bg-emerald-50">
                      <p className="text-lg font-bold text-emerald-600">{data?.invoiceStats.paid || 0}</p>
                      <p className="text-[10px] text-slate-500">Paid</p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-amber-50">
                      <p className="text-lg font-bold text-amber-600">{data?.invoiceStats.partial || 0}</p>
                      <p className="text-[10px] text-slate-500">Partial</p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-red-50">
                      <p className="text-lg font-bold text-red-600">{data?.invoiceStats.unpaid || 0}</p>
                      <p className="text-[10px] text-slate-500">Unpaid</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Receivables by Class + Payment Methods */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-slate-400" /> Receivables by Class
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <ScrollArea className="max-h-[320px]">
                    <div className="space-y-2">
                      {(data?.receivablesByClass || []).map((c, i) => (
                        <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-slate-50">
                          <div className="min-w-0">
                            <p className="text-xs font-medium">{c.class_name}</p>
                            <p className="text-[10px] text-slate-400">{c.invoice_count} invoices</p>
                          </div>
                          <div className="text-right flex-shrink-0 ml-2">
                            {c.outstanding > 0 ? (
                              <p className="font-mono font-bold text-xs text-red-600">{fmt(c.outstanding)}</p>
                            ) : (
                              <Badge variant="outline" className="text-[10px] h-5 bg-emerald-50 text-emerald-700 border-emerald-200">Settled</Badge>
                            )}
                          </div>
                        </div>
                      ))}
                      {(!data?.receivablesByClass || data.receivablesByClass.length === 0) && (
                        <p className="text-sm text-slate-400 py-8 text-center">No data</p>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-slate-400" /> Payment Methods
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3 mb-4">
                    {(data?.methodBreakdown || []).map(m => {
                      const total = data?.overview.totalCollected || 1;
                      const pct = (m.total / total) * 100;
                      return (
                        <div key={m.method} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-600 capitalize">{(m.method || 'other').replace(/_/g, ' ')}</span>
                            <span className="font-mono font-medium">{fmt(m.total)}</span>
                          </div>
                          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${Math.min(pct, 100)}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Top Debtors</p>
                  <ScrollArea className="max-h-[180px]">
                    <div className="space-y-2">
                      {(data?.topDebtors || []).map((d, i) => (
                        <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-red-50/50">
                          <div className="min-w-0">
                            <p className="text-xs font-medium truncate">{d.name}</p>
                            <p className="text-[10px] text-slate-400">{d.student_code} · {d.unpaid_invoices} unpaid</p>
                          </div>
                          <span className="font-mono font-bold text-xs text-red-600 flex-shrink-0 ml-2">{fmt(d.total_owed)}</span>
                        </div>
                      ))}
                      {(!data?.topDebtors || data.topDebtors.length === 0) && (
                        <p className="text-sm text-slate-400 text-center py-4">No outstanding debts</p>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>

            {/* Recent Payments */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-400" /> Recent Payments
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <ScrollArea className="max-h-72">
                  <div className="space-y-2">
                    {(data?.recentPayments || []).map((p, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                            <DollarSign className="w-4 h-4 text-emerald-600" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-medium truncate">{p.student?.name || 'Unknown'}</p>
                            <p className="text-[10px] text-slate-400">{p.student?.student_code} · {p.timestamp ? new Date(p.timestamp).toLocaleDateString() : '—'}</p>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="font-mono font-bold text-sm text-emerald-600">{fmt(p.amount)}</p>
                          <Badge variant="secondary" className="text-[10px] h-4">{(p.payment_method || 'cash').replace(/_/g, ' ')}</Badge>
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
