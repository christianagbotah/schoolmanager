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
  Users, GraduationCap, DollarSign, TrendingUp, TrendingDown, Printer,
  BarChart3, School, Calendar, Wallet,
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

  const maxEnrollment = Math.max(...enrollmentTrend.map((d) => d.count), 1);
  const maxFinance = Math.max(...financialChart.map((d) => Math.max(d.income, d.expense)), 1);

  const gradeColors: Record<string, string> = { A: 'bg-emerald-500', B: 'bg-sky-500', C: 'bg-amber-500', D: 'bg-orange-500', F: 'bg-red-500' };
  const totalGrades = Object.values(gradeDistribution).reduce((s, v) => s + v, 0) || 1;

  return (
    <DashboardLayout>
      <div className="space-y-6 print:p-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Annual Comprehensive Report</h1>
            <p className="text-sm text-slate-500 mt-1">School overview, financials, and academic performance</p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={year} onValueChange={setYear}>
              <SelectTrigger className="w-32 min-h-[44px]"><SelectValue /></SelectTrigger>
              <SelectContent>{YEARS.map((y) => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent>
            </Select>
            <Button variant="outline" onClick={handlePrint} className="min-h-[44px]">
              <Printer className="w-4 h-4 mr-2" /> Print
            </Button>
          </div>
        </div>

        {/* Print header */}
        <div className="hidden print:block text-center mb-6">
          <h1 className="text-xl font-bold">Annual Comprehensive Report — {year}</h1>
          <p className="text-sm text-slate-500">Generated on {new Date().toLocaleDateString()}</p>
        </div>

        {/* Overview Cards */}
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <Card key={i}><CardContent className="p-4"><Skeleton className="h-16" /></CardContent></Card>)}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-l-4 border-l-emerald-500">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center"><Users className="w-5 h-5 text-emerald-600" /></div>
                  <div>
                    <p className="text-xs text-slate-500 font-medium">Total Students</p>
                    <p className="text-xl font-bold text-slate-900">{summary?.totalStudents?.toLocaleString() || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-violet-500">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-violet-50 flex items-center justify-center"><GraduationCap className="w-5 h-5 text-violet-600" /></div>
                  <div>
                    <p className="text-xs text-slate-500 font-medium">Total Teachers</p>
                    <p className="text-xl font-bold text-slate-900">{summary?.totalTeachers?.toLocaleString() || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-sky-500">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-sky-50 flex items-center justify-center"><Wallet className="w-5 h-5 text-sky-600" /></div>
                  <div>
                    <p className="text-xs text-slate-500 font-medium">Total Revenue</p>
                    <p className="text-xl font-bold text-slate-900">{fmt(summary?.totalRevenue || 0)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-amber-500">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center"><DollarSign className="w-5 h-5 text-amber-600" /></div>
                  <div>
                    <p className="text-xs text-slate-500 font-medium">Total Expenses</p>
                    <p className="text-xl font-bold text-slate-900">{fmt(summary?.totalExpenses || 0)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Additional Stats */}
        {!loading && summary && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-slate-200/60"><CardContent className="p-4 text-center">
              <School className="w-5 h-5 text-slate-400 mx-auto mb-1" />
              <p className="text-xs text-slate-500">Total Classes</p>
              <p className="text-lg font-bold">{summary.totalClasses}</p>
            </CardContent></Card>
            <Card className="border-slate-200/60"><CardContent className="p-4 text-center">
              <TrendingUp className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
              <p className="text-xs text-slate-500">Net Profit</p>
              <p className={`text-lg font-bold ${summary.netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{fmt(summary.netProfit)}</p>
            </CardContent></Card>
            <Card className="border-slate-200/60"><CardContent className="p-4 text-center">
              <Calendar className="w-5 h-5 text-slate-400 mx-auto mb-1" />
              <p className="text-xs text-slate-500">Outstanding</p>
              <p className="text-lg font-bold text-amber-600">{fmt(summary.totalOutstanding)}</p>
            </CardContent></Card>
            <Card className="border-slate-200/60"><CardContent className="p-4 text-center">
              <BarChart3 className="w-5 h-5 text-slate-400 mx-auto mb-1" />
              <p className="text-xs text-slate-500">School Average</p>
              <p className="text-lg font-bold">{summary.overallAverage}</p>
            </CardContent></Card>
          </div>
        )}

        {/* Enrollment Trend */}
        <Card className="border-slate-200/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2"><Users className="w-4 h-4 text-emerald-600" /> Enrollment Trend</CardTitle>
            <CardDescription>New student admissions by month in {year}</CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            {loading ? <Skeleton className="h-48" /> : (
              <div className="flex items-end gap-1 h-48">
                {enrollmentTrend.map((d, i) => {
                  const height = maxEnrollment > 0 ? (d.count / maxEnrollment) * 100 : 0;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      {d.count > 0 && <span className="text-[10px] font-medium text-slate-600">{d.count}</span>}
                      <div className="w-full rounded-t-md bg-emerald-500 transition-all" style={{ height: `${Math.max(height, 2)}%` }} title={`${d.month}: ${d.count} students`} />
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
            <CardTitle className="text-base flex items-center gap-2"><BarChart3 className="w-4 h-4 text-sky-600" /> Income vs Expenses</CardTitle>
            <CardDescription>Monthly financial comparison for {year}</CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            {loading ? <Skeleton className="h-52" /> : (
              <div>
                <div className="flex items-end gap-1 h-48">
                  {financialChart.map((d, i) => {
                    const incH = maxFinance > 0 ? (d.income / maxFinance) * 100 : 0;
                    const expH = maxFinance > 0 ? (d.expense / maxFinance) * 100 : 0;
                    return (
                      <div key={i} className="flex-1 flex items-end gap-0.5">
                        <div className="flex-1 rounded-t-sm bg-sky-500 transition-all" style={{ height: `${Math.max(incH, 2)}%` }} title={`${d.month} Income: ${fmt(d.income)}`} />
                        <div className="flex-1 rounded-t-sm bg-red-400 transition-all" style={{ height: `${Math.max(expH, 2)}%` }} title={`${d.month} Expense: ${fmt(d.expense)}`} />
                      </div>
                    );
                  })}
                </div>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex gap-4">
                    <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded bg-sky-500" /><span className="text-[10px] text-slate-500">Income</span></div>
                    <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded bg-red-400" /><span className="text-[10px] text-slate-500">Expenses</span></div>
                  </div>
                  <div className="flex gap-1">
                    {financialChart.map((d, i) => <span key={i} className="text-[9px] text-slate-400 flex-1 text-center">{d.month}</span>)}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Academic Performance & Grade Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="border-slate-200/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2"><GraduationCap className="w-4 h-4 text-violet-600" /> Class Performance</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader><TableRow className="bg-slate-50">
                    <TableHead>Class</TableHead>
                    <TableHead className="text-right">Avg Score</TableHead>
                    <TableHead className="text-right">Students</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {loading ? Array.from({ length: 5 }).map((_, i) => <TableRow key={i}><TableCell colSpan={3}><Skeleton className="h-8" /></TableCell></TableRow>)
                      : academicPerformance.length === 0 ? <TableRow><TableCell colSpan={3} className="text-center py-8 text-sm text-slate-400">No data</TableCell></TableRow>
                      : academicPerformance.map((c) => (
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
            </CardContent>
          </Card>

          <Card className="border-slate-200/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2"><BarChart3 className="w-4 h-4 text-amber-600" /> Grade Distribution</CardTitle>
              <CardDescription>Overall school grade breakdown</CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              {loading ? <Skeleton className="h-48" /> : (
                <div className="space-y-3">
                  {Object.entries(gradeDistribution)
                    .sort((a, b) => (gradeColors[b[0]] ? 1 : 0) - (gradeColors[a[0]] ? 1 : 0))
                    .map(([grade, count]) => {
                      const pct = (count / totalGrades) * 100;
                      return (
                        <div key={grade} className="flex items-center gap-3">
                          <span className="text-sm font-bold w-6 text-center">{grade}</span>
                          <div className="flex-1 h-5 bg-slate-100 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${gradeColors[grade] || 'bg-slate-400'} transition-all`} style={{ width: `${Math.max(pct, 1)}%` }} />
                          </div>
                          <span className="text-xs text-slate-500 w-12 text-right">{count} ({pct.toFixed(0)}%)</span>
                        </div>
                      );
                    })}
                  {Object.keys(gradeDistribution).length === 0 && (
                    <p className="text-sm text-slate-400 text-center py-8">No grade data available</p>
                  )}
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
