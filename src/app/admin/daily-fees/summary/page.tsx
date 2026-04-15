'use client';

import { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import {
  Download,
  CalendarDays,
  DollarSign,
  Utensils,
  Coffee,
  BookOpen,
  Droplets,
  Bus,
  TrendingUp,
  RotateCcw,
} from 'lucide-react';
import Link from 'next/link';

interface DailySummary {
  date: string;
  feeding: number;
  breakfast: number;
  classes: number;
  water: number;
  transport: number;
  total: number;
  count: number;
}

interface TodayStats {
  feedingTotal: number;
  breakfastTotal: number;
  classesTotal: number;
  waterTotal: number;
  transportTotal: number;
  totalAmount: number;
  transactionCount: number;
  cashTotal: number;
  mobileMoneyTotal: number;
  bankTransferTotal: number;
  chequeTotal: number;
  byCollector: Record<string, number>;
}

function fmt(n: number) {
  return `GH₵ ${(n || 0).toFixed(2)}`;
}

export default function DailyFeeSummaryPage() {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [todayStats, setTodayStats] = useState<TodayStats | null>(null);
  const [history, setHistory] = useState<DailySummary[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/daily-fees/report?date=${date}&startDate=${date}&endDate=${date}`);
      const data = await res.json();
      setTodayStats(data.summary || null);
      setHistory(data.history || []);
    } catch {
      toast.error('Failed to load summary');
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => { fetchSummary(); }, [fetchSummary]);

  const exportCSV = () => {
    const headers = ['Date', 'Feeding', 'Breakfast', 'Classes', 'Water', 'Transport', 'Total', 'Transactions'];
    const rows = history.map((h) => [h.date, h.feeding.toFixed(2), h.breakfast.toFixed(2), h.classes.toFixed(2), h.water.toFixed(2), h.transport.toFixed(2), h.total.toFixed(2), h.count]);
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `daily-fees-report-${date}.csv`;
    a.click();
    toast.success('CSV exported');
  };

  const feeCards = [
    { label: 'Feeding', value: todayStats?.feedingTotal || 0, icon: Utensils, color: 'orange', total: todayStats?.feedingTotal || 0 },
    { label: 'Breakfast', value: todayStats?.breakfastTotal || 0, icon: Coffee, color: 'amber', total: todayStats?.breakfastTotal || 0 },
    { label: 'Classes', value: todayStats?.classesTotal || 0, icon: BookOpen, color: 'emerald', total: todayStats?.classesTotal || 0 },
    { label: 'Water', value: todayStats?.waterTotal || 0, icon: Droplets, color: 'sky', total: todayStats?.waterTotal || 0 },
    { label: 'Transport', value: todayStats?.transportTotal || 0, icon: Bus, color: 'violet', total: todayStats?.transportTotal || 0 },
  ];

  const colorMap: Record<string, { bg: string; text: string; border: string }> = {
    orange: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
    sky: { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200' },
    violet: { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200' },
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/admin/daily-fees"><RotateCcw className="w-4 h-4" /></Link>
            </Button>
            <div>
              <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
                Fee Collection Report
              </h1>
              <p className="text-xs text-slate-500 mt-1">Daily fee collection statistics and reports</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={exportCSV}>
              <Download className="w-3.5 h-3.5 mr-1.5" />Export CSV
            </Button>
          </div>
        </div>

        {/* Date Selector */}
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-3">
              <CalendarDays className="w-4 h-4 text-slate-400" />
              <Label className="text-xs font-medium">Date</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-44 h-9" />
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
        ) : todayStats ? (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {feeCards.map((fc) => {
                const c = colorMap[fc.color];
                return (
                  <Card key={fc.label} className={`${c.border} border`}>
                    <CardContent className="p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <div className={`w-6 h-6 rounded ${c.bg} flex items-center justify-center`}>
                          <fc.icon className={`w-3 h-3 ${c.text}`} />
                        </div>
                        <span className="text-[10px] text-slate-400 font-medium uppercase">{fc.label}</span>
                      </div>
                      <p className="text-lg font-bold text-slate-800 font-mono">{fmt(fc.value)}</p>
                    </CardContent>
                  </Card>
                );
              })}
              {/* Grand Total */}
              <Card className="border-emerald-300 bg-gradient-to-br from-emerald-50 to-teal-50 border-2">
                <CardContent className="p-3 text-center">
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                    <span className="text-[10px] text-emerald-600 font-bold uppercase">Total</span>
                  </div>
                  <p className="text-xl font-bold text-emerald-700 font-mono">{fmt(todayStats.totalAmount)}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{todayStats.transactionCount} transactions</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Payment Methods */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Payment Methods</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { label: 'Cash', amount: todayStats.cashTotal, color: 'bg-emerald-500' },
                      { label: 'Mobile Money', amount: todayStats.mobileMoneyTotal, color: 'bg-violet-500' },
                      { label: 'Bank Transfer', amount: todayStats.bankTransferTotal, color: 'bg-sky-500' },
                      { label: 'Cheque', amount: todayStats.chequeTotal, color: 'bg-amber-500' },
                    ].map((m) => {
                      const pct = todayStats.totalAmount > 0 ? (m.amount / todayStats.totalAmount) * 100 : 0;
                      return (
                        <div key={m.label}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-slate-600">{m.label}</span>
                            <span className="font-mono font-medium">{fmt(m.amount)} ({pct.toFixed(1)}%)</span>
                          </div>
                          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${m.color} transition-all`} style={{ width: `${Math.max(2, pct)}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Collector Breakdown */}
              {todayStats.byCollector && Object.keys(todayStats.byCollector).length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">By Collector</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {Object.entries(todayStats.byCollector).map(([collector, amount]) => (
                        <div key={collector} className="flex justify-between items-center py-1.5">
                          <span className="text-sm text-slate-700">{collector}</span>
                          <span className="text-sm font-mono font-bold text-emerald-600">{fmt(amount)}</span>
                        </div>
                      ))}
                      <div className="border-t pt-2 flex justify-between font-semibold">
                        <span className="text-sm">Grand Total</span>
                        <span className="text-sm font-mono text-emerald-700">{fmt(todayStats.totalAmount)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* History Table */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <CalendarDays className="w-4 h-4" />
                  Collection History (Last 7 Days)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50">
                        <TableHead className="text-xs font-semibold">Date</TableHead>
                        <TableHead className="text-xs font-semibold text-right">Feeding</TableHead>
                        <TableHead className="text-xs font-semibold text-right">Breakfast</TableHead>
                        <TableHead className="text-xs font-semibold text-right">Classes</TableHead>
                        <TableHead className="text-xs font-semibold text-right">Water</TableHead>
                        <TableHead className="text-xs font-semibold text-right">Transport</TableHead>
                        <TableHead className="text-xs font-semibold text-right">Total</TableHead>
                        <TableHead className="text-xs font-semibold text-right">Count</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {history.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-12 text-slate-400">
                            <TrendingUp className="w-10 h-10 mx-auto mb-2 opacity-30" />
                            <p className="text-sm">No collection history</p>
                          </TableCell>
                        </TableRow>
                      ) : (
                        history.map((h, i) => (
                          <TableRow key={i} className={`hover:bg-slate-50/50 ${i === 0 ? 'bg-emerald-50/50' : ''}`}>
                            <TableCell className="text-sm font-medium">{h.date} {i === 0 && <Badge className="ml-1 bg-emerald-100 text-emerald-700 text-[9px] h-4">Today</Badge>}</TableCell>
                            <TableCell className="text-sm text-right font-mono">{h.feeding > 0 ? fmt(h.feeding) : '—'}</TableCell>
                            <TableCell className="text-sm text-right font-mono">{h.breakfast > 0 ? fmt(h.breakfast) : '—'}</TableCell>
                            <TableCell className="text-sm text-right font-mono">{h.classes > 0 ? fmt(h.classes) : '—'}</TableCell>
                            <TableCell className="text-sm text-right font-mono">{h.water > 0 ? fmt(h.water) : '—'}</TableCell>
                            <TableCell className="text-sm text-right font-mono">{h.transport > 0 ? fmt(h.transport) : '—'}</TableCell>
                            <TableCell className="text-sm text-right font-bold font-mono">{fmt(h.total)}</TableCell>
                            <TableCell className="text-sm text-right">{h.count}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </>
        ) : null}
      </div>
    </DashboardLayout>
  );
}
