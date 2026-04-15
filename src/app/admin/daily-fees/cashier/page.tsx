'use client';

import { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import {
  Wallet, TrendingUp, Banknote, Smartphone, Building, CreditCard,
  Users, Calendar, ArrowUpRight, ArrowDownRight, Clock, Hash,
  ChevronRight,
} from 'lucide-react';
import {
  ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent,
} from '@/components/ui/chart';
import { Bar, BarChart, XAxis, YAxis, PieChart, Pie, Cell } from 'recharts';

interface CashierSummary {
  totalAmount: number; transactionCount: number; uniqueStudents: number;
  cashTotal: number; cashCount: number; momoTotal: number; momoCount: number;
  bankTotal: number; bankCount: number; chequeTotal: number; chequeCount: number;
  feedingTotal: number; breakfastTotal: number; classesTotal: number; waterTotal: number; transportTotal: number;
  yesterdayTotal: number; yesterdayChange: number; weekTotal: number;
}

interface Transaction {
  id: number; transaction_code: string; total_amount: number;
  payment_method: string; collected_by: string; payment_date: string;
  student: { student_id: number; name: string; student_code: string };
}

function fmt(n: number) { return `GH₵ ${(n || 0).toFixed(2)}`; }

const COLORS = ['#10b981', '#8b5cf6', '#0ea5e9', '#f59e0b'];

export default function CashierDashboard() {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [summary, setSummary] = useState<CashierSummary | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [byCollector, setByCollector] = useState<Record<string, { total: number; count: number }>>({});
  const [hourlyBreakdown, setHourlyBreakdown] = useState<{ hour: number; label: string; amount: number }[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/daily-fees/cashier?date=${date}`);
      const data = await res.json();
      setSummary(data.summary);
      setTransactions(data.recentTransactions || []);
      setByCollector(data.byCollector || {});
      setHourlyBreakdown(data.hourlyBreakdown || []);
    } catch { toast.error('Failed to load cashier data'); }
    setLoading(false);
  }, [date]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const pieData = summary ? [
    { name: 'Cash', value: summary.cashTotal, color: '#10b981' },
    { name: 'MoMo', value: summary.momoTotal, color: '#8b5cf6' },
    { name: 'Bank', value: summary.bankTotal, color: '#0ea5e9' },
    { name: 'Cheque', value: summary.chequeTotal, color: '#f59e0b' },
  ].filter(d => d.value > 0) : [];

  const total = summary?.totalAmount || 1;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md">
              <Wallet className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Cashier Dashboard</h1>
              <p className="text-sm text-slate-500 mt-0.5">Today&apos;s collection summary and performance</p>
            </div>
          </div>
          <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-44 h-10" />
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
          </div>
        ) : (
          <>
            {/* Top Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Card className="border-l-4 border-l-emerald-500">
                <CardContent className="p-4">
                  <p className="text-xs text-slate-400 font-medium">Today&apos;s Total</p>
                  <p className="text-xl font-bold font-mono text-emerald-600 mt-1">{fmt(summary?.totalAmount || 0)}</p>
                  <p className="text-[10px] text-slate-400 mt-1">{summary?.transactionCount} transactions</p>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-violet-500">
                <CardContent className="p-4">
                  <p className="text-xs text-slate-400 font-medium">Unique Students</p>
                  <p className="text-xl font-bold font-mono text-violet-600 mt-1">{summary?.uniqueStudents || 0}</p>
                  <p className="text-[10px] text-slate-400 mt-1">served today</p>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-sky-500">
                <CardContent className="p-4">
                  <p className="text-xs text-slate-400 font-medium">This Week</p>
                  <p className="text-xl font-bold font-mono text-sky-600 mt-1">{fmt(summary?.weekTotal || 0)}</p>
                  <p className="text-[10px] text-slate-400 mt-1">Mon – Sun</p>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-amber-500">
                <CardContent className="p-4">
                  <p className="text-xs text-slate-400 font-medium">vs Yesterday</p>
                  <div className="flex items-center gap-1 mt-1">
                    {summary && summary.yesterdayChange >= 0 ? (
                      <ArrowUpRight className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <ArrowDownRight className="w-4 h-4 text-red-500" />
                    )}
                    <p className={`text-xl font-bold font-mono ${(summary?.yesterdayChange || 0) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {Math.abs(summary?.yesterdayChange || 0).toFixed(1)}%
                    </p>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">{fmt(summary?.yesterdayTotal || 0)} yesterday</p>
                </CardContent>
              </Card>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Hourly Collection Chart */}
              <Card className="lg:col-span-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-slate-400" /> Hourly Collection
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <ChartContainer config={{ amount: { label: 'Amount', color: '#10b981' } }} className="h-[260px] w-full">
                    <BarChart data={hourlyBreakdown}>
                      <XAxis dataKey="label" tick={{ fontSize: 10 }} tickLine={false} />
                      <YAxis tick={{ fontSize: 10 }} tickLine={false} tickFormatter={v => `GH₵${v}`} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="amount" fill="var(--color-amount)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              {/* Payment Method Pie */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-slate-400" /> Payment Methods
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  {pieData.length > 0 ? (
                    <ChartContainer config={{}} className="h-[180px] w-full mx-auto">
                      <PieChart>
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={2}>
                          {pieData.map((entry, index) => (
                            <Cell key={index} fill={entry.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ChartContainer>
                  ) : (
                    <div className="h-[180px] flex items-center justify-center text-sm text-slate-400">No data</div>
                  )}
                  <div className="space-y-2 mt-3">
                    {[
                      { label: 'Cash', total: summary?.cashTotal || 0, count: summary?.cashCount || 0, icon: Banknote, color: 'bg-emerald-500' },
                      { label: 'Mobile Money', total: summary?.momoTotal || 0, count: summary?.momoCount || 0, icon: Smartphone, color: 'bg-violet-500' },
                      { label: 'Bank Transfer', total: summary?.bankTotal || 0, count: summary?.bankCount || 0, icon: Building, color: 'bg-sky-500' },
                      { label: 'Cheque', total: summary?.chequeTotal || 0, count: summary?.chequeCount || 0, icon: CreditCard, color: 'bg-amber-500' },
                    ].map(m => (
                      <div key={m.label} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <div className={`w-5 h-5 rounded ${m.color} flex items-center justify-center`}>
                            <m.icon className="w-3 h-3 text-white" />
                          </div>
                          <span className="text-slate-600">{m.label}</span>
                        </div>
                        <div className="text-right">
                          <p className="font-mono font-medium">{fmt(m.total)}</p>
                          <p className="text-[10px] text-slate-400">{m.count} txns</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Fee Type Breakdown + Collector Performance */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Fee Types */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Hash className="w-4 h-4 text-slate-400" /> Collection by Fee Type
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 space-y-3">
                  {[
                    { label: 'Feeding', value: summary?.feedingTotal || 0, color: 'bg-orange-500' },
                    { label: 'Breakfast', value: summary?.breakfastTotal || 0, color: 'bg-amber-500' },
                    { label: 'Classes', value: summary?.classesTotal || 0, color: 'bg-emerald-500' },
                    { label: 'Water', value: summary?.waterTotal || 0, color: 'bg-sky-500' },
                    { label: 'Transport', value: summary?.transportTotal || 0, color: 'bg-violet-500' },
                  ].map(ft => {
                    const pct = total > 0 ? (ft.value / total * 100) : 0;
                    return (
                      <div key={ft.label} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-600">{ft.label}</span>
                          <span className="font-mono font-medium">{fmt(ft.value)}</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${ft.color} transition-all`} style={{ width: `${Math.min(pct, 100)}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              {/* Collector Performance */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Users className="w-4 h-4 text-slate-400" /> Collector Performance
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  {Object.keys(byCollector).length === 0 ? (
                    <p className="text-sm text-slate-400 py-8 text-center">No collectors recorded</p>
                  ) : (
                    <div className="space-y-3">
                      {Object.entries(byCollector).sort((a, b) => b[1].total - a[1].total).map(([name, data]) => (
                        <div key={name} className="flex items-center justify-between p-2 rounded-lg bg-slate-50">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center">
                              <Users className="w-4 h-4 text-violet-600" />
                            </div>
                            <div>
                              <p className="text-xs font-medium">{name}</p>
                              <p className="text-[10px] text-slate-400">{data.count} transactions</p>
                            </div>
                          </div>
                          <p className="font-mono font-bold text-sm">{fmt(data.total)}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Recent Transactions */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-400" /> Recent Transactions
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <ScrollArea className="max-h-96">
                  <div className="space-y-2">
                    {transactions.length === 0 ? (
                      <p className="text-sm text-slate-400 py-8 text-center">No transactions for this date</p>
                    ) : transactions.map(tx => (
                      <div key={tx.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                            <Banknote className="w-4 h-4 text-emerald-600" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-medium truncate">{tx.student?.name || 'Unknown'}</p>
                            <p className="text-[10px] text-slate-400">{tx.student?.student_code} · {tx.collected_by}</p>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="font-mono font-bold text-sm">{fmt(tx.total_amount)}</p>
                          <Badge variant="secondary" className="text-[10px] h-4">{(tx.payment_method || 'cash').replace(/_/g, ' ')}</Badge>
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
