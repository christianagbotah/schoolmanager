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
  CalendarDays, Users, DollarSign, TrendingUp, TrendingDown, Printer, Download,
  UserCheck, AlertTriangle, UserPlus, BarChart3, FileBarChart, ChevronRight,
  Clock, CreditCard,
} from 'lucide-react';

interface ChartData { date: string; label: string; attendanceRate: number; present: number; absent: number; total: number; }
interface Performer { name: string; studentCode: string; average: number; }
interface Summary { attendanceRate: number; feesCollected: number; totalInvoiced: number; totalPending: number; newAdmissions: number; incidents: number; totalRecords: number; }

function fmt(amount: number) {
  return new Intl.NumberFormat('en-UG', { style: 'currency', currency: 'GHS', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
}

function getWeekRanges() {
  const ranges: { label: string; start: string; end: string }[] = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i * 7);
    const end = new Date(d);
    const start = new Date(end);
    start.setDate(start.getDate() - 6);
    ranges.push({
      label: `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0],
    });
  }
  return ranges;
}

export default function WeeklyReportPage() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [topPerformers, setTopPerformers] = useState<Performer[]>([]);
  const [bottomPerformers, setBottomPerformers] = useState<Performer[]>([]);
  const [classes, setClasses] = useState<{ class_id: number; name: string }[]>([]);
  const [classFilter, setClassFilter] = useState('');
  const [weekIndex, setWeekIndex] = useState('0');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [useCustomRange, setUseCustomRange] = useState(false);

  const weekRanges = getWeekRanges();
  const startDate = useCustomRange ? customStart : weekRanges[parseInt(weekIndex)]?.start || '';
  const endDate = useCustomRange ? customEnd : weekRanges[parseInt(weekIndex)]?.end || '';

  const fetchClasses = useCallback(async () => {
    try {
      const res = await fetch('/api/classes');
      const data = await res.json();
      setClasses(Array.isArray(data) ? data : []);
    } catch { /* silent */ }
  }, []);

  const fetchReport = useCallback(async () => {
    if (!startDate || !endDate) {
      setLoading(false);
      return;
    }
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

  const handleExportCSV = () => {
    if (!summary) return;
    const headers = ['Metric', 'Value'];
    const rows = [
      ['Period', `${startDate} to ${endDate}`],
      ['Attendance Rate', `${summary.attendanceRate}%`],
      ['Fees Collected', summary.feesCollected],
      ['Total Invoiced', summary.totalInvoiced],
      ['Outstanding', summary.totalPending],
      ['New Admissions', summary.newAdmissions],
      ['Discipline Incidents', summary.incidents],
      ['', ''],
      ['Daily Attendance', ''],
      ...chartData.map((d) => [d.label, `${d.attendanceRate}% (${d.present}/${d.total})`]),
      ['', ''],
      ['Top Performers', ''],
      ...topPerformers.map((p, i) => [`#${i + 1} ${p.name}`, p.average]),
      ['', ''],
      ['Needs Improvement', ''],
      ...bottomPerformers.map((p, i) => [`#${i + 1} ${p.name}`, p.average]),
    ];
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `weekly-report-${startDate}-to-${endDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Weekly report exported as CSV');
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 print:p-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-100 flex items-center justify-center flex-shrink-0">
              <CalendarDays className="w-5 h-5 text-sky-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Weekly Academic Summary</h1>
              <p className="text-sm text-slate-500 mt-0.5">Attendance, fee collection, and performance overview</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleExportCSV} className="min-h-[44px]">
              <Download className="w-4 h-4 mr-2" /> Export
            </Button>
            <Button variant="outline" onClick={handlePrint} className="min-h-[44px]">
              <Printer className="w-4 h-4 mr-2" /> Print
            </Button>
          </div>
        </div>

        {/* Print header */}
        <div className="hidden print:block text-center mb-6">
          <h1 className="text-xl font-bold">Weekly Academic Summary</h1>
          <p className="text-sm text-slate-500">{startDate} to {endDate}</p>
        </div>

        {/* Filters */}
        <Card className="print:hidden border-slate-200/60">
          <CardContent className="p-4">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-slate-400" />
                <span className="text-sm font-medium text-slate-700">Filters</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-500 mb-1 block">Week</label>
                  <Select
                    value={useCustomRange ? '__custom__' : weekIndex}
                    onValueChange={(v) => {
                      if (v === '__custom__') { setUseCustomRange(true); }
                      else { setUseCustomRange(false); setWeekIndex(v); }
                    }}
                  >
                    <SelectTrigger className="min-h-[44px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {weekRanges.map((r, i) => (
                        <SelectItem key={i} value={String(i)}>{r.label}</SelectItem>
                      ))}
                      <SelectItem value="__custom__">Custom Range...</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {useCustomRange && (
                  <>
                    <div>
                      <label className="text-xs font-medium text-slate-500 mb-1 block">Start Date</label>
                      <input
                        type="date"
                        value={customStart}
                        onChange={(e) => setCustomStart(e.target.value)}
                        className="w-full min-h-[44px] px-3 rounded-md border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-500 mb-1 block">End Date</label>
                      <input
                        type="date"
                        value={customEnd}
                        onChange={(e) => setCustomEnd(e.target.value)}
                        className="w-full min-h-[44px] px-3 rounded-md border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                      />
                    </div>
                  </>
                )}
                <div>
                  <label className="text-xs font-medium text-slate-500 mb-1 block">Class</label>
                  <Select value={classFilter} onValueChange={(v) => v === '__all__' ? setClassFilter('') : setClassFilter(v)}>
                    <SelectTrigger className="min-h-[44px]"><SelectValue placeholder="All Classes" /></SelectTrigger>
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
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="border-l-4 border-l-slate-200"><CardContent className="p-4"><Skeleton className="h-16 w-full" /></CardContent></Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-l-4 border-l-emerald-500 hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                    <UserCheck className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-slate-500 font-medium">Attendance Rate</p>
                    <p className="text-xl font-bold text-slate-900">{summary?.attendanceRate || 0}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-sky-500 hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-sky-50 flex items-center justify-center flex-shrink-0">
                    <DollarSign className="w-5 h-5 text-sky-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-slate-500 font-medium">Fees Collected</p>
                    <p className="text-xl font-bold text-slate-900">{fmt(summary?.feesCollected || 0)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-violet-500 hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-violet-50 flex items-center justify-center flex-shrink-0">
                    <UserPlus className="w-5 h-5 text-violet-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-slate-500 font-medium">New Admissions</p>
                    <p className="text-xl font-bold text-slate-900">{summary?.newAdmissions || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-amber-500 hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                  </div>
                  <div className="min-w-0">
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
              <Skeleton className="h-48 w-full" />
            ) : chartData.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                <Clock className="w-10 h-10 mb-2 opacity-40" />
                <p className="text-sm">No attendance data for this period</p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-end gap-1 h-48">
                  {chartData.map((d, i) => {
                    const height = maxRate > 0 ? (d.attendanceRate / maxRate) * 100 : 0;
                    const color = d.attendanceRate >= 80 ? 'bg-emerald-500' : d.attendanceRate >= 60 ? 'bg-amber-500' : 'bg-red-500';
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1 group cursor-default">
                        <span className="text-[10px] font-medium text-slate-600">{d.attendanceRate}%</span>
                        <div
                          className={`w-full rounded-t-md transition-all hover:opacity-80 ${color}`}
                          style={{ height: `${height}%`, minHeight: d.total > 0 ? '4px' : '0' }}
                          title={`${d.label}: ${d.attendanceRate}% (${d.present}/${d.total})`}
                        />
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

        {/* Performers - Desktop Table / Mobile Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Top Performers */}
          <Card className="border-slate-200/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" /> Top Performers
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-4 space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
              ) : topPerformers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                  <TrendingUp className="w-10 h-10 mb-2 opacity-40" />
                  <p className="text-sm">No performance data</p>
                </div>
              ) : (
                <>
                  <div className="hidden md:block">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50">
                          <TableHead className="w-8">#</TableHead>
                          <TableHead>Student</TableHead>
                          <TableHead className="text-right">Avg Score</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {topPerformers.map((p, i) => (
                          <TableRow key={i}>
                            <TableCell className="text-xs text-slate-400">{i + 1}</TableCell>
                            <TableCell>
                              <p className="text-sm font-medium">{p.name}</p>
                              <p className="text-xs text-slate-400">{p.studentCode}</p>
                            </TableCell>
                            <TableCell className="text-right">
                              <Badge className="bg-emerald-100 text-emerald-700">{p.average}</Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <div className="md:hidden divide-y max-h-80 overflow-y-auto">
                    {topPerformers.map((p, i) => (
                      <div key={i} className="p-3 flex items-center justify-between min-h-[52px]">
                        <div className="flex items-center gap-3">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                            i === 0 ? 'bg-amber-100 text-amber-700' : i === 1 ? 'bg-slate-200 text-slate-600' : i === 2 ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-500'
                          }`}>
                            {i + 1}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{p.name}</p>
                            <p className="text-xs text-slate-400">{p.studentCode}</p>
                          </div>
                        </div>
                        <Badge className="bg-emerald-100 text-emerald-700">{p.average}</Badge>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Bottom Performers */}
          <Card className="border-slate-200/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-red-500" /> Needs Improvement
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-4 space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
              ) : bottomPerformers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                  <TrendingUp className="w-10 h-10 mb-2 opacity-40" />
                  <p className="text-sm">No students need improvement</p>
                </div>
              ) : (
                <>
                  <div className="hidden md:block">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50">
                          <TableHead className="w-8">#</TableHead>
                          <TableHead>Student</TableHead>
                          <TableHead className="text-right">Avg Score</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {bottomPerformers.map((p, i) => (
                          <TableRow key={i}>
                            <TableCell className="text-xs text-slate-400">{i + 1}</TableCell>
                            <TableCell>
                              <p className="text-sm font-medium">{p.name}</p>
                              <p className="text-xs text-slate-400">{p.studentCode}</p>
                            </TableCell>
                            <TableCell className="text-right">
                              <Badge className="bg-red-100 text-red-700">{p.average}</Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <div className="md:hidden divide-y max-h-80 overflow-y-auto">
                    {bottomPerformers.map((p, i) => (
                      <div key={i} className="p-3 flex items-center justify-between min-h-[52px]">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold bg-red-100 text-red-600 flex-shrink-0">
                            {i + 1}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{p.name}</p>
                            <p className="text-xs text-slate-400">{p.studentCode}</p>
                          </div>
                        </div>
                        <Badge className="bg-red-100 text-red-700">{p.average}</Badge>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Financial Summary */}
        <Card className="border-slate-200/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-sky-600" /> Financial Summary
            </CardTitle>
            <CardDescription>Fee collection overview for the selected period</CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            {loading ? (
              <Skeleton className="h-20 w-full" />
            ) : summary ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-sky-50 rounded-xl border border-sky-100">
                  <p className="text-xs text-slate-500 font-medium mb-1">Total Invoiced</p>
                  <p className="text-lg font-bold text-sky-700">{fmt(summary.totalInvoiced)}</p>
                </div>
                <div className="text-center p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                  <p className="text-xs text-slate-500 font-medium mb-1">Fees Collected</p>
                  <p className="text-lg font-bold text-emerald-700">{fmt(summary.feesCollected)}</p>
                </div>
                <div className="text-center p-4 bg-amber-50 rounded-xl border border-amber-100">
                  <p className="text-xs text-slate-500 font-medium mb-1">Outstanding</p>
                  <p className="text-lg font-bold text-amber-700">{fmt(summary.totalPending)}</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                <CreditCard className="w-10 h-10 mb-2 opacity-40" />
                <p className="text-sm">No financial data</p>
              </div>
            )}
          </CardContent>
        </Card>
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
