'use client';

import { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Bar, BarChart, Line, LineChart, XAxis, YAxis, CartesianGrid } from 'recharts';
import {
  ChartContainer, ChartTooltip, ChartTooltipContent,
} from '@/components/ui/chart';
import {
  TrendingUp, Users, BarChart3, Target, Percent, Wallet, Clock, GraduationCap,
} from 'lucide-react';

interface EfficiencyData {
  period: string;
  schoolDays: number;
  totalEnrolled: number;
  summary: { totalExpected: number; totalActual: number; overallEfficiency: number; uniquePayers: number; studentCoverage: number; totalTransactions: number };
  feeTypeEfficiency: { expected: Record<string, number>; actual: Record<string, number>; efficiency: Record<string, number> };
  classEfficiency: { className: string; expectedDaily: number; expectedTotal: number; actual: number; efficiency: number; students: number }[];
  dailyTrend: { date: string; actual: number; expected: number }[];
  paymentMethods: { cash: number; mobileMoney: number; bankTransfer: number };
}

function fmt(n: number) { return `GH\u20B5 ${(n || 0).toFixed(2)}`; }
function fmtShort(n: number) { return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : n.toFixed(0); }

const lineChartConfig = {
  actual: { label: 'Actual', color: '#059669' },
  expected: { label: 'Expected', color: '#d97706' },
};

const barChartConfig = {
  efficiency: { label: 'Efficiency %', color: '#8b5cf6' },
};

const feeTypeColors: Record<string, string> = {
  feeding: '#f97316', breakfast: '#f59e0b', classes: '#10b981', water: '#0ea5e9',
};

export default function CollectionEfficiencyPage() {
  const [data, setData] = useState<EfficiencyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('week');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/collection-efficiency?period=${period}`);
      const result = await res.json();
      setData(result);
    } catch { toast.error('Failed to load efficiency data'); } finally { setLoading(false); }
  }, [period]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const feeTypes = ['feeding', 'breakfast', 'classes', 'water'] as const;
  const feeLabels: Record<string, string> = { feeding: 'Feeding', breakfast: 'Breakfast', classes: 'Classes', water: 'Water' };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-4 border-b border-slate-100">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Collection Efficiency</h1>
            <p className="text-sm text-slate-500 mt-0.5">Track fee collection performance metrics</p>
          </div>
          <div className="flex gap-2">
            {['today', 'week', 'month', 'quarter'].map(p => (
              <Button key={p} variant={period === p ? 'default' : 'outline'} size="sm" onClick={() => setPeriod(p)}
                className={period === p ? 'bg-violet-500 hover:bg-violet-600' : ''}>
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">{Array.from({ length: 4 }).map((_, i) => <Card key={i} className="border-l-4 border-l-slate-200"><CardContent className="p-4"><div className="flex items-center gap-3"><Skeleton className="w-11 h-11 rounded-xl" /><div className="flex-1 space-y-2"><Skeleton className="h-3 w-20" /><Skeleton className="h-6 w-16" /></div></div><Skeleton className="h-3 w-28 mt-1" /></CardContent></Card>)}</div>
            <Card className="border-slate-200/60"><CardContent className="p-4"><Skeleton className="h-64 w-full" /></CardContent></Card>
          </div>
        ) : data ? (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { label: 'Overall Efficiency', value: `${data.summary.overallEfficiency.toFixed(1)}%`, icon: Target, borderColor: 'border-l-violet-500', iconBg: 'bg-violet-500', sub: `Expected: ${fmt(data.summary.totalExpected)}` },
                { label: 'Total Collected', value: fmt(data.summary.totalActual), icon: Wallet, borderColor: 'border-l-emerald-500', iconBg: 'bg-emerald-500', sub: `${data.summary.totalTransactions} transactions` },
                { label: 'Student Coverage', value: `${data.summary.studentCoverage.toFixed(1)}%`, icon: Users, borderColor: 'border-l-sky-500', iconBg: 'bg-sky-500', sub: `${data.summary.uniquePayers} / ${data.totalEnrolled} students` },
                { label: 'School Days', value: String(data.schoolDays), icon: Clock, borderColor: 'border-l-amber-500', iconBg: 'bg-amber-500', sub: `Period: ${period}` },
              ].map(s => (
                <Card key={s.label} className={`${s.borderColor} hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200`}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-1">
                      <div className={`${s.iconBg} w-11 h-11 rounded-xl flex items-center justify-center`}>
                        <s.icon className="w-5 h-5 text-white" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{s.label}</p>
                        <p className="text-2xl font-bold text-slate-900 tabular-nums">{s.value}</p>
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-400 ml-14">{s.sub}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Tabs defaultValue="byFeeType">
              <TabsList>
                <TabsTrigger value="byFeeType" className="gap-1.5"><BarChart3 className="w-3.5 h-3.5" />By Fee Type</TabsTrigger>
                <TabsTrigger value="byClass" className="gap-1.5"><GraduationCap className="w-3.5 h-3.5" />By Class</TabsTrigger>
                <TabsTrigger value="trend" className="gap-1.5"><TrendingUp className="w-3.5 h-3.5" />Trend</TabsTrigger>
              </TabsList>

              <TabsContent value="byFeeType" className="mt-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold">Fee Type Collection Efficiency</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {feeTypes.map(ft => {
                        const exp = data.feeTypeEfficiency.expected[ft] || 0;
                        const act = data.feeTypeEfficiency.actual[ft] || 0;
                        const eff = data.feeTypeEfficiency.efficiency[ft] || 0;
                        return (
                          <div key={ft} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: feeTypeColors[ft] }} />
                                <span className="text-sm font-medium text-slate-700">{feeLabels[ft]}</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-xs text-slate-400">Exp/day: {fmt(exp)}</span>
                                <span className="font-mono text-sm font-bold">{fmt(act)}</span>
                                <Badge variant="outline" className={eff >= 80 ? 'bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]' : eff >= 50 ? 'bg-amber-50 text-amber-700 border-amber-200 text-[10px]' : 'bg-red-50 text-red-700 border-red-200 text-[10px]'}>
                                  {eff.toFixed(1)}%
                                </Badge>
                              </div>
                            </div>
                            <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, eff)}%`, backgroundColor: feeTypeColors[ft] }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <Separator className="my-4" />
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Payment Methods</span>
                      <div className="flex gap-4 text-xs text-slate-500">
                        <span>Cash: {fmt(data.paymentMethods.cash)}</span>
                        <span>MoMo: {fmt(data.paymentMethods.mobileMoney)}</span>
                        <span>Bank: {fmt(data.paymentMethods.bankTransfer)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="byClass" className="mt-4">
                <Card>
                  <CardContent className="p-0">
                    <ScrollArea className="max-h-[500px]">
                      <div className="divide-y">
                        {data.classEfficiency.length === 0 ? (
                          <div className="text-center py-12 text-slate-400">
                        <div className="w-16 h-16 rounded-2xl bg-violet-100 flex items-center justify-center mx-auto mb-3">
                          <GraduationCap className="w-7 h-7 text-violet-500" />
                        </div>
                        <p className="text-sm">No class data available</p>
                      </div>
                        ) : (
                          data.classEfficiency.map((cls, i) => {
                            const eff = cls.efficiency;
                            return (
                              <div key={i} className="flex items-center gap-4 p-4 hover:bg-slate-50/50">
                                <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center">
                                  <GraduationCap className="w-4 h-4 text-violet-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-slate-800 truncate">{cls.className}</p>
                                  <p className="text-[10px] text-slate-400">{cls.students} students &middot; {fmt(cls.expectedDaily)}/day expected</p>
                                </div>
                                <div className="w-32">
                                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                    <div className={`h-full rounded-full ${eff >= 80 ? 'bg-emerald-500' : eff >= 50 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${Math.min(100, eff)}%` }} />
                                  </div>
                                </div>
                                <div className="text-right w-20">
                                  <p className={`text-sm font-bold font-mono ${eff >= 80 ? 'text-emerald-600' : eff >= 50 ? 'text-amber-600' : 'text-red-600'}`}>{eff.toFixed(1)}%</p>
                                  <p className="text-[10px] text-slate-400">{fmt(cls.actual)}</p>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="trend" className="mt-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold">Daily Collection Trend</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {data.dailyTrend.length === 0 ? (
                      <div className="text-center py-12 text-slate-400">
                        <div className="w-16 h-16 rounded-2xl bg-sky-100 flex items-center justify-center mx-auto mb-3">
                          <TrendingUp className="w-7 h-7 text-sky-500" />
                        </div>
                        <p className="text-sm">No trend data</p>
                      </div>
                    ) : (
                      <ChartContainer config={lineChartConfig} className="h-[300px] w-full">
                        <LineChart data={data.dailyTrend} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                          <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => fmtShort(v)} />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Line type="monotone" dataKey="expected" stroke="var(--color-expected)" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                          <Line type="monotone" dataKey="actual" stroke="var(--color-actual)" strokeWidth={2} dot={{ r: 3 }} />
                        </LineChart>
                      </ChartContainer>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        ) : null}
      </div>
    </DashboardLayout>
  );
}
