'use client';

import { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { format } from 'date-fns';
import {
  BarChart3, TrendingUp, DollarSign, Calendar, Download,
  Search, Users, CreditCard, PieChart, ArrowUpRight, ArrowDownRight,
} from 'lucide-react';

interface DailyStats {
  date: string;
  total: number;
  feeding: number;
  breakfast: number;
  classes: number;
  water: number;
  transport: number;
  transactions: number;
}

interface CollectorStat {
  name: string;
  total_collected: number;
  transactions: number;
}

interface TypeStat {
  type: string;
  total: number;
  percentage: number;
}

export default function FeeStatisticsPage() {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('daily');
  const [search, setSearch] = useState('');

  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [collectorStats, setCollectorStats] = useState<CollectorStat[]>([]);
  const [typeStats, setTypeStats] = useState<TypeStat[]>([]);
  const [summary, setSummary] = useState({ total: 0, transactions: 0, avgPerDay: 0, collectors: 0 });

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ period });
      const res = await fetch(`/api/admin/daily-fees/statistics?${params}`);
      const data = await res.json();
      setDailyStats(data.daily || []);
      setCollectorStats(data.collectors || []);
      setTypeStats(data.types || []);
      setSummary({
        total: data.summary?.total || 0,
        transactions: data.summary?.transactions || 0,
        avgPerDay: data.summary?.avgPerDay || 0,
        collectors: data.summary?.collectors || 0,
      });
    } catch {
      toast.error('Failed to load statistics');
    }
    setLoading(false);
  }, [period]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchStats(); }, [fetchStats]);

  const typeColors: Record<string, string> = { feeding: 'bg-emerald-100 text-emerald-700', breakfast: 'bg-amber-100 text-amber-700', classes: 'bg-sky-100 text-sky-700', water: 'bg-violet-100 text-violet-700', transport: 'bg-rose-100 text-rose-700' };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div><h1 className="text-2xl font-bold text-slate-900 tracking-tight">Fee Collection Statistics</h1><p className="text-sm text-slate-500 mt-1">Track daily, weekly, and monthly fee collection trends</p></div>
          <div className="flex gap-2">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="h-9 w-36 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="daily">Daily</SelectItem><SelectItem value="weekly">Weekly</SelectItem><SelectItem value="monthly">Monthly</SelectItem></SelectContent>
            </Select>
            <Button variant="outline" size="sm" className="h-9"><Download className="w-4 h-4" /></Button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-slate-200/60"><CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center"><DollarSign className="w-5 h-5 text-emerald-600" /></div>
            <div><p className="text-xs text-slate-500">Total Collected</p><p className="text-xl font-bold">GHS {summary.total.toLocaleString()}</p></div>
          </CardContent></Card>
          <Card className="border-slate-200/60"><CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-sky-100 flex items-center justify-center"><CreditCard className="w-5 h-5 text-sky-600" /></div>
            <div><p className="text-xs text-slate-500">Transactions</p><p className="text-xl font-bold">{summary.transactions}</p></div>
          </CardContent></Card>
          <Card className="border-slate-200/60"><CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center"><TrendingUp className="w-5 h-5 text-amber-600" /></div>
            <div><p className="text-xs text-slate-500">Avg/Day</p><p className="text-xl font-bold">GHS {summary.avgPerDay.toLocaleString()}</p></div>
          </CardContent></Card>
          <Card className="border-slate-200/60"><CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center"><Users className="w-5 h-5 text-violet-600" /></div>
            <div><p className="text-xs text-slate-500">Collectors</p><p className="text-xl font-bold">{summary.collectors}</p></div>
          </CardContent></Card>
        </div>

        {/* Collection Trend */}
        <Card className="border-slate-200/60">
          <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><BarChart3 className="w-5 h-5 text-emerald-600" />Collection Trend</CardTitle></CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-48" /> : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {dailyStats.length === 0 ? <p className="text-center text-slate-400 py-8 text-sm">No data for this period</p> : dailyStats.map((d, i) => {
                  const maxTotal = Math.max(...dailyStats.map(s => s.total), 1);
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-xs text-slate-500 w-24 flex-shrink-0">{d.date}</span>
                      <div className="flex-1 h-6 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${(d.total / maxTotal) * 100}%` }} />
                      </div>
                      <span className="text-xs font-medium text-slate-700 w-24 text-right">GHS {d.total.toLocaleString()}</span>
                      <span className="text-[10px] text-slate-400 w-8 text-right">{d.transactions}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* By Type */}
          <Card className="border-slate-200/60">
            <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><PieChart className="w-5 h-5 text-amber-600" />By Fee Type</CardTitle></CardHeader>
            <CardContent>
              {loading ? <Skeleton className="h-48" /> : (
                <div className="space-y-3">
                  {typeStats.length === 0 ? <p className="text-center text-slate-400 py-8 text-sm">No data</p> : typeStats.map(t => (
                    <div key={t.type} className="flex items-center gap-3">
                      <Badge className={`${typeColors[t.type] || 'bg-slate-100 text-slate-700'} text-xs capitalize w-20 justify-center`}>{t.type}</Badge>
                      <div className="flex-1 h-5 bg-slate-100 rounded-full overflow-hidden"><div className={`h-full rounded-full ${t.type === 'feeding' ? 'bg-emerald-500' : t.type === 'breakfast' ? 'bg-amber-500' : t.type === 'classes' ? 'bg-sky-500' : t.type === 'water' ? 'bg-violet-500' : 'bg-rose-500'}`} style={{ width: `${t.percentage}%` }} /></div>
                      <span className="text-xs font-medium text-slate-700 w-28 text-right">GHS {t.total.toLocaleString()}</span>
                      <span className="text-[10px] text-slate-400 w-10 text-right">{t.percentage.toFixed(1)}%</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* By Collector */}
          <Card className="border-slate-200/60">
            <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Users className="w-5 h-5 text-violet-600" />By Collector</CardTitle></CardHeader>
            <CardContent className="p-0">
              <div className="max-h-72 overflow-y-auto">
                <Table>
                  <TableHeader><TableRow className="bg-slate-50"><TableHead>Collector</TableHead><TableHead>Transactions</TableHead><TableHead>Total</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {loading ? Array.from({ length: 3 }).map((_, i) => <TableRow key={i}><TableCell colSpan={3}><Skeleton className="h-8" /></TableCell></TableRow>) :
                      collectorStats.length === 0 ? <TableRow><TableCell colSpan={3} className="text-center py-8 text-slate-400 text-sm">No data</TableCell></TableRow> :
                        collectorStats.map((c, i) => (
                          <TableRow key={i}>
                            <TableCell className="text-sm font-medium">{c.name || 'Unknown'}</TableCell>
                            <TableCell className="text-sm text-slate-500">{c.transactions}</TableCell>
                            <TableCell className="text-sm font-medium text-emerald-700">GHS {c.total_collected.toLocaleString()}</TableCell>
                          </TableRow>
                        ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
