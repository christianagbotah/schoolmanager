'use client';

import { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Calendar, Users, DollarSign, TrendingUp, TrendingDown, Printer,
  UserCheck, AlertTriangle, UserPlus, BarChart3,
} from 'lucide-react';

interface ChartData { date: string; label: string; attendanceRate: number; present: number; absent: number; total: number; }
interface Performer { name: string; studentCode: string; average: number; }
interface Summary { attendanceRate: number; feesCollected: number; totalInvoiced: number; totalPending: number; newAdmissions: number; incidents: number; totalRecords: number; }

function fmt(amount: number) {
  return new Intl.NumberFormat('en-UG', { style: 'currency', currency: 'GHS', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
}

export default function WeeklyReportPage() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [topPerformers, setTopPerformers] = useState<Performer[]>([]);
  const [bottomPerformers, setBottomPerformers] = useState<Performer[]>([]);
  const [classes, setClasses] = useState<{ class_id: number; name: string }[]>([]);
  const [classFilter, setClassFilter] = useState('');
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

  const fetchClasses = useCallback(async () => {
    try {
      const res = await fetch('/api/classes');
      const data = await res.json();
      setClasses(Array.isArray(data) ? data : []);
    } catch { /* silent */ }
  }, []);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ startDate, endDate });
      if (classFilter) params.set('classId', classFilter);
      const res = await fetch(`/api/admin/reports/weekly?${params}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setSummary(data.summary);
      setChartData(data.chartData || []);
      setTopPerformers(data.topPerformers || []);
      setBottomPerformers(data.bottomPerformers || []);
    } catch {
      toast.error('Failed to load weekly report');
    }
    setLoading(false);
  }, [startDate, endDate, classFilter]);

  useEffect(() => { fetchClasses(); }, [fetchClasses]);
  useEffect(() => { fetchReport(); }, [fetchReport]);

  const maxRate = Math.max(...chartData.map((d) => d.attendanceRate), 100);

  const handlePrint = () => window.print();

  return (
    <DashboardLayout>
      <div className="space-y-6 print:p-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Weekly Academic Summary</h1>
            <p className="text-sm text-slate-500 mt-1">Attendance, fee collection, and performance overview</p>
          </div>
          <Button variant="outline" onClick={handlePrint} className="min-h-[44px]">
            <Printer className="w-4 h-4 mr-2" /> Print Report
          </Button>
        </div>

        {/* Print header */}
        <div className="hidden print:block text-center mb-6">
          <h1 className="text-xl font-bold">Weekly Academic Summary</h1>
          <p className="text-sm text-slate-500">{startDate} to {endDate}</p>
        </div>

        {/* Filters */}
        <Card className="print:hidden border-slate-200/60">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-500 mb-1 block">Start Date</label>
                  <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                    className="w-full h-10 px-3 rounded-md border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500 mb-1 block">End Date</label>
                  <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
                    className="w-full h-10 px-3 rounded-md border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500 mb-1 block">Class</label>
                  <Select value={classFilter} onValueChange={(v) => v === '__all__' ? setClassFilter('') : setClassFilter(v)}>
                    <SelectTrigger className="h-10"><SelectValue placeholder="All Classes" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">All Classes</SelectItem>
                      {classes.map((c) => <SelectItem key={c.class_id} value={String(c.class_id)}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <Card key={i}><CardContent className="p-4"><Skeleton className="h-16" /></CardContent></Card>)}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-l-4 border-l-emerald-500">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                    <UserCheck className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-medium">Attendance Rate</p>
                    <p className="text-xl font-bold text-slate-900">{summary?.attendanceRate || 0}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-sky-500">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-sky-50 flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-sky-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-medium">Fees Collected</p>
                    <p className="text-xl font-bold text-slate-900">{fmt(summary?.feesCollected || 0)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-violet-500">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-violet-50 flex items-center justify-center">
                    <UserPlus className="w-5 h-5 text-violet-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-medium">New Admissions</p>
                    <p className="text-xl font-bold text-slate-900">{summary?.newAdmissions || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-amber-500">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-medium">Discipline Incidents</p>
                    <p className="text-xl font-bold text-slate-900">{summary?.incidents || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Attendance Chart */}
        <Card className="border-slate-200/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-600" /> Weekly Attendance Trend
            </CardTitle>
            <CardDescription>Daily attendance rates across the selected period</CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            {loading ? (
              <Skeleton className="h-48" />
            ) : chartData.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-12">No attendance data for this period</p>
            ) : (
              <div className="space-y-2">
                <div className="flex items-end gap-1 h-48">
                  {chartData.map((d, i) => {
                    const height = maxRate > 0 ? (d.attendanceRate / maxRate) * 100 : 0;
                    const color = d.attendanceRate >= 80 ? 'bg-emerald-500' : d.attendanceRate >= 60 ? 'bg-amber-500' : 'bg-red-500';
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <span className="text-[10px] font-medium text-slate-600">{d.attendanceRate}%</span>
                        <div className={`w-full rounded-t-md transition-all ${color}`} style={{ height: `${height}%`, minHeight: d.total > 0 ? '4px' : '0' }} title={`${d.label}: ${d.attendanceRate}% (${d.present}/${d.total})`}>
                          &nbsp;
                        </div>
                        <span className="text-[9px] text-slate-400 text-center leading-tight truncate w-full">{d.label}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="flex gap-4 mt-3">
                  <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded bg-emerald-500" /><span className="text-[10px] text-slate-500">80%+</span></div>
                  <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded bg-amber-500" /><span className="text-[10px] text-slate-500">60-79%</span></div>
                  <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded bg-red-500" /><span className="text-[10px] text-slate-500">&lt;60%</span></div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Performers Table */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="border-slate-200/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" /> Top Performers
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow className="bg-slate-50">
                  <TableHead className="w-8">#</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead className="text-right">Avg Score</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {loading ? Array.from({ length: 3 }).map((_, i) => <TableRow key={i}><TableCell colSpan={3}><Skeleton className="h-8" /></TableCell></TableRow>)
                    : topPerformers.length === 0 ? <TableRow><TableCell colSpan={3} className="text-center py-8 text-slate-400 text-sm">No data</TableCell></TableRow>
                    : topPerformers.map((p, i) => (
                      <TableRow key={i}>
                        <TableCell className="text-xs text-slate-400">{i + 1}</TableCell>
                        <TableCell><p className="text-sm font-medium">{p.name}</p><p className="text-xs text-slate-400">{p.studentCode}</p></TableCell>
                        <TableCell className="text-right"><Badge className="bg-emerald-100 text-emerald-700">{p.average}</Badge></TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card className="border-slate-200/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-red-500" /> Needs Improvement
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow className="bg-slate-50">
                  <TableHead className="w-8">#</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead className="text-right">Avg Score</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {loading ? Array.from({ length: 3 }).map((_, i) => <TableRow key={i}><TableCell colSpan={3}><Skeleton className="h-8" /></TableCell></TableRow>)
                    : bottomPerformers.length === 0 ? <TableRow><TableCell colSpan={3} className="text-center py-8 text-slate-400 text-sm">No data</TableCell></TableRow>
                    : bottomPerformers.map((p, i) => (
                      <TableRow key={i}>
                        <TableCell className="text-xs text-slate-400">{i + 1}</TableCell>
                        <TableCell><p className="text-sm font-medium">{p.name}</p><p className="text-xs text-slate-400">{p.studentCode}</p></TableCell>
                        <TableCell className="text-right"><Badge className="bg-red-100 text-red-700">{p.average}</Badge></TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Financial Summary */}
        {summary && (
          <Card className="border-slate-200/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-sky-600" /> Financial Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 bg-sky-50 rounded-lg">
                  <p className="text-xs text-slate-500 font-medium">Total Invoiced</p>
                  <p className="text-lg font-bold text-sky-700">{fmt(summary.totalInvoiced)}</p>
                </div>
                <div className="text-center p-3 bg-emerald-50 rounded-lg">
                  <p className="text-xs text-slate-500 font-medium">Fees Collected</p>
                  <p className="text-lg font-bold text-emerald-700">{fmt(summary.feesCollected)}</p>
                </div>
                <div className="text-center p-3 bg-amber-50 rounded-lg">
                  <p className="text-xs text-slate-500 font-medium">Outstanding</p>
                  <p className="text-lg font-bold text-amber-700">{fmt(summary.totalPending)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <style jsx global>{`
        @media print {
          .print\\:hidden { display: none !important; }
          .print\\:block { display: block !important; }
          .print\\:p-8 { padding: 2rem; }
        }
      `}</style>
    </DashboardLayout>
  );
}
