'use client';

import { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Bar, BarChart, XAxis, YAxis } from 'recharts';
import {
  ChartContainer, ChartTooltip, ChartTooltipContent,
} from '@/components/ui/chart';
import {
  Scale, TrendingUp, TrendingDown, Users, Clock,
  Banknote, Smartphone, Calendar, ArrowUpRight, ArrowDownRight, BarChart3,
} from 'lucide-react';

interface ReconciliationData {
  date: string;
  actual: { feeding: number; breakfast: number; classes: number; water: number; transport: number; total: number; count: number; cash: number; mobileMoney: number; bankTransfer: number };
  expected: { feeding: number; breakfast: number; classes: number; water: number; transport: number; total: number; presentCount: number; enrolledCount: number };
  discrepancies: { feeding: number; breakfast: number; classes: number; water: number; total: number };
  collectors: { name: string; transactionCount: number; totalCollected: number; cashTotal: number; momoTotal: number; uniqueStudents: number }[];
  hourlyBreakdown: { hour: string; count: number; total: number }[];
  transactions: any[];
}

const hourlyChartConfig = {
  total: { label: 'Amount', color: '#059669' },
};

function fmt(n: number) { return `GH\u20B5 ${(n || 0).toFixed(2)}`; }

function fmtShort(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toFixed(0);
}

function ReconciliationSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-7 w-52 mb-1" />
        <Skeleton className="h-4 w-80" />
        <div className="border-b border-slate-100 mt-3" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-72 rounded-2xl" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Skeleton className="h-72 rounded-2xl" />
        <Skeleton className="h-72 rounded-2xl" />
      </div>
      <Skeleton className="h-64 rounded-2xl" />
    </div>
  );
}

export default function ReconciliationPage() {
  const [data, setData] = useState<ReconciliationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/reconciliation?date=${date}`);
      const result = await res.json();
      setData(result);
    } catch { toast.error('Failed to load reconciliation data'); } finally { setLoading(false); }
  }, [date]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const feeTypes = ['feeding', 'breakfast', 'classes', 'water', 'transport'] as const;
  const feeLabels: Record<string, string> = { feeding: 'Feeding', breakfast: 'Breakfast', classes: 'Classes', water: 'Water', transport: 'Transport' };

  if (loading && !data) return (
    <DashboardLayout>
      <ReconciliationSkeleton />
    </DashboardLayout>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Daily Reconciliation</h1>
            <p className="text-sm text-slate-500 mt-1">Compare expected vs actual collections</p>
          </div>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-40 bg-slate-50 border-slate-200 focus:bg-white min-h-[44px]" />
        </div>

        {data ? (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Expected', value: fmt(data.expected.total), icon: TrendingUp, borderColor: 'border-sky-500', iconBg: 'bg-sky-500' },
                { label: 'Actual', value: fmt(data.actual.total), icon: BarChart3, borderColor: 'border-emerald-500', iconBg: 'bg-emerald-500' },
                {
                  label: 'Discrepancy',
                  value: fmt(Math.abs(data.discrepancies.total)),
                  icon: data.discrepancies.total >= 0 ? ArrowUpRight : ArrowDownRight,
                  borderColor: data.discrepancies.total >= 0 ? 'border-emerald-500' : 'border-red-500',
                  iconBg: data.discrepancies.total >= 0 ? 'bg-emerald-500' : 'bg-red-500',
                  valueClass: data.discrepancies.total < 0 ? 'text-red-600' : 'text-emerald-600',
                },
                { label: 'Transactions', value: data.actual.count.toString(), icon: Users, borderColor: 'border-violet-500', iconBg: 'bg-violet-500' },
              ].map(s => (
                <Card key={s.label} className={`rounded-2xl border-l-4 ${s.borderColor} hover:shadow-lg hover:-translate-y-0.5 transition-all`}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`w-11 h-11 rounded-xl ${s.iconBg} flex items-center justify-center flex-shrink-0`}>
                        <s.icon className="w-5 h-5 text-white" />
                      </div>
                    </div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{s.label}</p>
                    <p className={`text-2xl font-bold tabular-nums ${s.valueClass || 'text-slate-900'}`}>
                      {s.value}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Expected vs Actual by Fee Type */}
            <Card className="rounded-2xl border-slate-200/60">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Scale className="w-4 h-4 text-slate-400" />Expected vs Actual by Fee Type
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {feeTypes.map(ft => {
                    const exp = data.expected[ft] || 0;
                    const act = data.actual[ft] || 0;
                    const disc = act - exp;
                    const pct = exp > 0 ? Math.min(100, (act / exp) * 100) : act > 0 ? 100 : 0;
                    return (
                      <div key={ft} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium text-slate-700">{feeLabels[ft]}</span>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-slate-400">Exp: {fmt(exp)}</span>
                            <span className="font-mono font-bold text-slate-800">{fmt(act)}</span>
                            <Badge variant="outline" className={disc >= 0 ? 'bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]' : 'bg-red-50 text-red-700 border-red-200 text-[10px]'}>
                              {disc >= 0 ? '+' : ''}{fmt(disc)}
                            </Badge>
                          </div>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all ${pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
                <Separator className="my-4" />
                <div className="flex justify-between text-sm">
                  <span className="font-semibold text-slate-600">Collection Rate</span>
                  <span className="font-bold text-emerald-600 font-mono tabular-nums">{data.expected.total > 0 ? ((data.actual.total / data.expected.total) * 100).toFixed(1) : 0}%</span>
                </div>
                <div className="flex justify-between text-xs text-slate-400 mt-1">
                  <span>Present: {data.expected.presentCount} / Enrolled: {data.expected.enrolledCount}</span>
                  <span>Cash: {fmt(data.actual.cash)} &middot; MoMo: {fmt(data.actual.mobileMoney)}</span>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Hourly Breakdown */}
              <Card className="rounded-2xl border-slate-200/60">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-400" />Hourly Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={hourlyChartConfig} className="h-[250px] w-full">
                    <BarChart data={data.hourlyBreakdown} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                      <XAxis dataKey="hour" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => fmtShort(v)} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="total" fill="var(--color-total)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              {/* Collector Summaries */}
              <Card className="rounded-2xl border-slate-200/60">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Users className="w-4 h-4 text-slate-400" />Collector Summaries
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {data.collectors.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 rounded-2xl bg-slate-100 mx-auto flex items-center justify-center mb-3">
                        <Users className="w-8 h-8 text-slate-400" />
                      </div>
                      <p className="text-sm text-slate-500">No collections today</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {data.collectors.map((c, i) => (
                        <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                          <div>
                            <p className="text-sm font-semibold text-slate-800">{c.name}</p>
                            <p className="text-xs text-slate-400">{c.transactionCount} txns &middot; {c.uniqueStudents} students</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold font-mono text-emerald-600 tabular-nums">{fmt(c.totalCollected)}</p>
                            <div className="flex gap-2 text-xs text-slate-400">
                              <span><Banknote className="w-3 h-3 inline" />{fmt(c.cashTotal)}</span>
                              <span><Smartphone className="w-3 h-3 inline" />{fmt(c.momoTotal)}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Recent Transactions */}
            <Card className="rounded-2xl border-slate-200/60">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-slate-400" />Recent Transactions ({data.transactions.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="max-h-96">
                  <div className="hidden md:block">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50">
                          <TableHead className="text-xs">Student</TableHead>
                          <TableHead className="text-xs">Code</TableHead>
                          <TableHead className="text-xs text-right">Feeding</TableHead>
                          <TableHead className="text-xs text-right">Breakfast</TableHead>
                          <TableHead className="text-xs text-right">Classes</TableHead>
                          <TableHead className="text-xs text-right">Total</TableHead>
                          <TableHead className="text-xs">Method</TableHead>
                          <TableHead className="text-xs">Collector</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.transactions.slice(0, 50).map((tx, i) => (
                          <TableRow key={i} className="hover:bg-slate-50/50">
                            <TableCell className="text-sm font-medium">{tx.student?.name}</TableCell>
                            <TableCell className="text-xs font-mono text-slate-500">{tx.student?.student_code}</TableCell>
                            <TableCell className="text-xs font-mono text-right tabular-nums">{fmt(tx.feeding_amount)}</TableCell>
                            <TableCell className="text-xs font-mono text-right tabular-nums">{fmt(tx.breakfast_amount)}</TableCell>
                            <TableCell className="text-xs font-mono text-right tabular-nums">{fmt(tx.classes_amount)}</TableCell>
                            <TableCell className="text-xs font-mono text-right font-bold tabular-nums">{fmt(tx.total_amount)}</TableCell>
                            <TableCell><Badge variant="outline" className="text-[10px]">{tx.payment_method}</Badge></TableCell>
                            <TableCell className="text-xs text-slate-500">{tx.collected_by}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <div className="md:hidden divide-y">
                    {data.transactions.slice(0, 20).map((tx, i) => (
                      <div key={i} className="p-3 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">{tx.student?.name}</p>
                          <p className="text-xs text-slate-400">{tx.payment_method} &middot; {tx.collected_by}</p>
                        </div>
                        <p className="font-mono font-bold text-sm tabular-nums">{fmt(tx.total_amount)}</p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </>
        ) : null}
      </div>
    </DashboardLayout>
  );
}
