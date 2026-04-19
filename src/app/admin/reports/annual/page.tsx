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
  Users, GraduationCap, DollarSign, TrendingUp, TrendingDown, Printer, Download,
  BarChart3, School, Calendar, Wallet, FileBarChart, ChevronRight,
} from 'lucide-react';

interface EnrollmentTrend { month: string; count: number; }
interface FinancialChart { month: string; income: number; expense: number; }
interface AcademicPerf { classId: number; className: string; average: number; studentCount: number; gradeDistribution: Record<string, number>; }
interface Summary { totalStudents: number; totalTeachers: number; totalClasses: number; totalRevenue: number; totalExpenses: number; totalInvoiced: number; totalOutstanding: number; netProfit: number; overallAverage: number; }

function fmt(amount: number) {
  return new Intl.NumberFormat('en-UG', { style: 'currency', currency: 'GHS', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
}

const YEARS = ['2025', '2024', '2023', '2022'];

export default function AnnualReportPage() {
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [summary, setSummary] = useState<Summary | null>(null);
  const [enrollmentTrend, setEnrollmentTrend] = useState<EnrollmentTrend[]>([]);
  const [financialChart, setFinancialChart] = useState<FinancialChart[]>([]);
  const [academicPerformance, setAcademicPerformance] = useState<AcademicPerf[]>([]);
  const [gradeDistribution, setGradeDistribution] = useState<Record<string, number>>({});

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/reports/annual?year=${year}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setSummary(data.summary);
      setEnrollmentTrend(data.enrollmentTrend || []);
      setFinancialChart(data.financialChart || []);
      setAcademicPerformance(data.academicPerformance || []);
      setGradeDistribution(data.gradeDistribution || {});
    } catch {
      toast.error('Failed to load annual report');
    }
    setLoading(false);
  }, [year]);

  useEffect(() => { fetchReport(); }, [fetchReport]);

  const handlePrint = () => window.print();

  const handleExportCSV = () => {
    if (!summary) return;
    const headers = ['Metric', 'Value'];
    const rows = [
      ['Total Students', summary.totalStudents],
      ['Total Teachers', summary.totalTeachers],
      ['Total Classes', summary.totalClasses],
      ['Total Revenue', summary.totalRevenue],
      ['Total Expenses', summary.totalExpenses],
      ['Net Profit', summary.netProfit],
      ['Total Outstanding', summary.totalOutstanding],
      ['School Average', summary.overallAverage],
      ['', ''],
      ['Enrollment Trend', ''],
      ...enrollmentTrend.map((d) => [d.month, d.count]),
      ['', ''],
      ['Financial Overview', ''],
      ...financialChart.map((d) => [`${d.month} Income`, d.income]),
      ...financialChart.map((d) => [`${d.month} Expense`, d.expense]),
      ['', ''],
      ['Class Performance', ''],
      ...academicPerformance.map((c) => [c.className, c.average]),
    ];
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `annual-report-${year}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Annual report exported as CSV');
  };

  const maxEnrollment = Math.max(...enrollmentTrend.map((d) => d.count), 1);
  const maxFinance = Math.max(...financialChart.map((d) => Math.max(d.income, d.expense)), 1);

  const gradeColors: Record<string, string> = { A: 'bg-emerald-500', B: 'bg-sky-500', C: 'bg-amber-500', D: 'bg-orange-500', F: 'bg-red-500' };
  const totalGrades = Object.values(gradeDistribution).reduce((s, v) => s + v, 0) || 1;

  return (
    <DashboardLayout>
      <div className="space-y-6 print:p-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
              <FileBarChart className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Annual Comprehensive Report</h1>
              <p className="text-sm text-slate-500 mt-0.5">School overview, financials, and academic performance</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Select value={year} onValueChange={setYear}>
              <SelectTrigger className="w-32 min-h-[44px]"><SelectValue /></SelectTrigger>
              <SelectContent>{YEARS.map((y) => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent>
            </Select>
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
          <h1 className="text-xl font-bold">Annual Comprehensive Report \u2014 {year}</h1>
          <p className="text-sm text-slate-500">Generated on {new Date().toLocaleDateString()}</p>
        </div>

        {/* Overview Stat Cards */}
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
                    <Users className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-slate-500 font-medium">Total Students</p>
                    <p className="text-xl font-bold text-slate-900">{summary?.totalStudents?.toLocaleString() || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-violet-500 hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-violet-50 flex items-center justify-center flex-shrink-0">
                    <GraduationCap className="w-5 h-5 text-violet-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-slate-500 font-medium">Total Teachers</p>
                    <p className="text-xl font-bold text-slate-900">{summary?.totalTeachers?.toLocaleString() || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-sky-500 hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-sky-50 flex items-center justify-center flex-shrink-0">
                    <Wallet className="w-5 h-5 text-sky-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-slate-500 font-medium">Total Revenue</p>
                    <p className="text-xl font-bold text-slate-900">{fmt(summary?.totalRevenue || 0)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-amber-500 hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
                    <DollarSign className="w-5 h-5 text-amber-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-slate-500 font-medium">Total Expenses</p>
                    <p className="text-xl font-bold text-slate-900">{fmt(summary?.totalExpenses || 0)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Secondary Stat Cards */}
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="border-slate-200/60"><CardContent className="p-4"><Skeleton className="h-14 w-full" /></CardContent></Card>
            ))}
          </div>
        ) : summary && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-slate-200/60 hover:shadow-sm transition-shadow">
              <CardContent className="p-4 text-center">
                <School className="w-5 h-5 text-slate-400 mx-auto mb-1" />
                <p className="text-xs text-slate-500 font-medium">Total Classes</p>
                <p className="text-lg font-bold text-slate-900">{summary.totalClasses}</p>
              </CardContent>
            </Card>
            <Card className="border-slate-200/60 hover:shadow-sm transition-shadow">
              <CardContent className="p-4 text-center">
                <TrendingUp className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
                <p className="text-xs text-slate-500 font-medium">Net Profit</p>
                <p className={`text-lg font-bold ${summary.netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{fmt(summary.netProfit)}</p>
              </CardContent>
            </Card>
            <Card className="border-slate-200/60 hover:shadow-sm transition-shadow">
              <CardContent className="p-4 text-center">
                <Calendar className="w-5 h-5 text-slate-400 mx-auto mb-1" />
                <p className="text-xs text-slate-500 font-medium">Outstanding</p>
                <p className="text-lg font-bold text-amber-600">{fmt(summary.totalOutstanding)}</p>
              </CardContent>
            </Card>
            <Card className="border-slate-200/60 hover:shadow-sm transition-shadow">
              <CardContent className="p-4 text-center">
                <BarChart3 className="w-5 h-5 text-slate-400 mx-auto mb-1" />
                <p className="text-xs text-slate-500 font-medium">School Average</p>
                <p className="text-lg font-bold text-slate-900">{summary.overallAverage}</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Enrollment Trend */}
        <Card className="border-slate-200/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-600" /> Enrollment Trend
            </CardTitle>
            <CardDescription>New student admissions by month in {year}</CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            {loading ? (
              <Skeleton className="h-48 w-full" />
            ) : enrollmentTrend.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                <Users className="w-10 h-10 mb-2 opacity-40" />
                <p className="text-sm">No enrollment data for {year}</p>
              </div>
            ) : (
              <div className="flex items-end gap-1 h-48">
                {enrollmentTrend.map((d, i) => {
                  const height = maxEnrollment > 0 ? (d.count / maxEnrollment) * 100 : 0;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1 group cursor-default">
                      {d.count > 0 && (
                        <span className="text-[10px] font-medium text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity">{d.count}</span>
                      )}
                      <div
                        className="w-full rounded-t-md bg-emerald-500 transition-all hover:bg-emerald-600"
                        style={{ height: `${Math.max(height, 2)}%` }}
                        title={`${d.month}: ${d.count} students`}
                      />
                      <span className="text-[9px] text-slate-400">{d.month}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Financial Chart: Income vs Expenses */}
        <Card className="border-slate-200/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-sky-600" /> Income vs Expenses
            </CardTitle>
            <CardDescription>Monthly financial comparison for {year}</CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            {loading ? (
              <Skeleton className="h-52 w-full" />
            ) : financialChart.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                <DollarSign className="w-10 h-10 mb-2 opacity-40" />
                <p className="text-sm">No financial data for {year}</p>
              </div>
            ) : (
              <div>
                <div className="flex items-end gap-1 h-48">
                  {financialChart.map((d, i) => {
                    const incH = maxFinance > 0 ? (d.income / maxFinance) * 100 : 0;
                    const expH = maxFinance > 0 ? (d.expense / maxFinance) * 100 : 0;
                    return (
                      <div key={i} className="flex-1 flex items-end gap-0.5 group cursor-default">
                        <div
                          className="flex-1 rounded-t-sm bg-sky-500 transition-all hover:bg-sky-600"
                          style={{ height: `${Math.max(incH, 2)}%` }}
                          title={`${d.month} Income: ${fmt(d.income)}`}
                        />
                        <div
                          className="flex-1 rounded-t-sm bg-red-400 transition-all hover:bg-red-500"
                          style={{ height: `${Math.max(expH, 2)}%` }}
                          title={`${d.month} Expense: ${fmt(d.expense)}`}
                        />
                      </div>
                    );
                  })}
                </div>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex gap-4">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded bg-sky-500" />
                      <span className="text-[10px] text-slate-500">Income</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded bg-red-400" />
                      <span className="text-[10px] text-slate-500">Expenses</span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {financialChart.map((d, i) => (
                      <span key={i} className="text-[9px] text-slate-400 flex-1 text-center">{d.month}</span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Academic Performance & Grade Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Class Performance - Desktop Table / Mobile Cards */}
          <Card className="border-slate-200/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-violet-600" /> Class Performance
              </CardTitle>
              <CardDescription>Average scores by class</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-4 space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
              ) : academicPerformance.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                  <GraduationCap className="w-10 h-10 mb-2 opacity-40" />
                  <p className="text-sm">No academic performance data</p>
                </div>
              ) : (
                <>
                  {/* Desktop Table */}
                  <div className="hidden md:block max-h-96 overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50">
                          <TableHead className="text-xs font-semibold">Class</TableHead>
                          <TableHead className="text-xs font-semibold text-right">Avg Score</TableHead>
                          <TableHead className="text-xs font-semibold text-right">Students</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {academicPerformance.map((c) => (
                          <TableRow key={c.classId}>
                            <TableCell className="font-medium text-sm">{c.className}</TableCell>
                            <TableCell className="text-right">
                              <Badge className={c.average >= 70 ? 'bg-emerald-100 text-emerald-700' : c.average >= 50 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}>
                                {c.average}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right text-sm text-slate-600">{c.studentCount}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  {/* Mobile Cards */}
                  <div className="md:hidden divide-y max-h-96 overflow-y-auto">
                    {academicPerformance.map((c) => (
                      <div key={c.classId} className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-violet-50 flex items-center justify-center flex-shrink-0">
                            <GraduationCap className="w-4 h-4 text-violet-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-900">{c.className}</p>
                            <p className="text-xs text-slate-400">{c.studentCount} students</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={c.average >= 70 ? 'bg-emerald-100 text-emerald-700' : c.average >= 50 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}>
                            {c.average}
                          </Badge>
                          <ChevronRight className="w-4 h-4 text-slate-300" />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="px-4 py-3 border-t border-slate-100 bg-slate-50">
                    <span className="text-xs text-slate-500">{academicPerformance.length} classes</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Grade Distribution */}
          <Card className="border-slate-200/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-amber-600" /> Grade Distribution
              </CardTitle>
              <CardDescription>Overall school grade breakdown</CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              {loading ? (
                <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-6 w-full" />)}</div>
              ) : Object.keys(gradeDistribution).length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                  <BarChart3 className="w-10 h-10 mb-2 opacity-40" />
                  <p className="text-sm">No grade data available</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {Object.entries(gradeDistribution)
                    .sort((a, b) => (gradeColors[b[0]] ? 1 : 0) - (gradeColors[a[0]] ? 1 : 0))
                    .map(([grade, count]) => {
                      const pct = (count / totalGrades) * 100;
                      return (
                        <div key={grade} className="flex items-center gap-3">
                          <span className="text-sm font-bold w-6 text-center">{grade}</span>
                          <div className="flex-1 h-5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${gradeColors[grade] || 'bg-slate-400'} transition-all`}
                              style={{ width: `${Math.max(pct, 1)}%` }}
                            />
                          </div>
                          <span className="text-xs text-slate-500 w-14 text-right font-mono">{count} ({pct.toFixed(0)}%)</span>
                        </div>
                      );
                    })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
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
