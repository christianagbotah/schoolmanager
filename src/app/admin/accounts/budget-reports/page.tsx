'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  BarChart3, TrendingUp, TrendingDown, Printer, Download,
  DollarSign, PieChart, ArrowUpRight, ArrowDownRight,
  AlertTriangle, CheckCircle2, Wallet, Layers, Target,
  FileText, Calendar,
} from 'lucide-react';

interface ReportData {
  reportType: string;
  overview: {
    totalBudgets: number;
    totalBudgeted: number;
    totalActual: number;
    totalVariance: number;
    utilizationPercent: number;
    statusBreakdown: { draft: number; active: number; approved: number; closed: number; cancelled: number };
  };
  budgetVsActual: Array<{
    budget_id: number;
    name: string;
    fiscalYear: string;
    department: string;
    status: string;
    totalBudgeted: number;
    totalActual: number;
    variance: number;
    utilizationPercent: number;
    lineCount: number;
    lines: Array<{
      budget_line_id: number;
      accountCode: string;
      accountName: string;
      category: string;
      description: string;
      budgeted_amount: number;
      actual_amount: number;
      variance: number;
      variancePercent: number;
    }>;
  }>;
  utilizationByCategory: Array<{
    category: string;
    budgeted: number;
    actual: number;
    variance: number;
    utilizationPercent: number;
    count: number;
  }>;
  utilizationByDepartment: Array<{
    department: string;
    budgeted: number;
    actual: number;
    variance: number;
    utilizationPercent: number;
    budgetCount: number;
  }>;
  topOverBudget: Array<{
    budget_line_id: number;
    description: string;
    accountName: string;
    budgeted_amount: number;
    actual_amount: number;
    variance: number;
    variancePercent: number;
  }>;
  topUnderBudget: Array<{
    budget_line_id: number;
    description: string;
    accountName: string;
    budgeted_amount: number;
    actual_amount: number;
    variance: number;
    variancePercent: number;
  }>;
  periodComparison: Array<{
    fiscal_year_id: number;
    name: string;
    status: string;
    budgetCount: number;
    totalBudgeted: number;
    totalActual: number;
    totalVariance: number;
  }>;
  monthlyTrend: Array<{ month: string; budgeted: number; actual: number }>;
  filters: { fiscalYearId: number | null; departmentId: number | null };
}

interface FiscalYear {
  fiscal_year_id: number;
  name: string;
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-UG', { style: 'currency', currency: 'UGX', minimumFractionDigits: 0 }).format(amount);
}

function getUtilColor(pct: number) {
  if (pct >= 90) return 'text-red-600';
  if (pct >= 70) return 'text-amber-600';
  return 'text-emerald-600';
}

function getProgressColor(pct: number) {
  if (pct >= 90) return '[&>div]:bg-red-500';
  if (pct >= 70) return '[&>div]:bg-amber-500';
  return '[&>div]:bg-emerald-500';
}

// Simple bar chart component using divs
function BarChart({ data, maxValue }: { data: Array<{ label: string; value: number; color: string }>; maxValue: number }) {
  return (
    <div className="flex items-end gap-2 h-48">
      {data.map((item, idx) => (
        <div key={idx} className="flex-1 flex flex-col items-center gap-1">
          <span className="text-xs font-mono text-slate-600">{maxValue > 0 ? Math.round((item.value / maxValue) * 100) : 0}%</span>
          <div
            className="w-full rounded-t-md transition-all duration-500"
            style={{
              height: `${maxValue > 0 ? Math.max((item.value / maxValue) * 160, 4) : 4}px`,
              backgroundColor: item.color,
              minHeight: '4px',
            }}
          />
          <span className="text-[10px] text-slate-500 text-center leading-tight truncate w-full">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

// Horizontal bar chart for categories
function HorizontalBarChart({ data, maxValue }: { data: Array<{ label: string; budgeted: number; actual: number }>; maxValue: number }) {
  return (
    <div className="space-y-3">
      {data.map((item, idx) => (
        <div key={idx} className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-slate-700 truncate max-w-32">{item.label}</span>
            <span className="font-mono text-slate-500">{formatCurrency(item.actual)}</span>
          </div>
          <div className="relative h-6 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="absolute left-0 top-0 h-full bg-violet-400 rounded-full transition-all duration-500"
              style={{ width: `${maxValue > 0 ? Math.max((item.budgeted / maxValue) * 100, 1) : 1}%` }}
            />
            <div
              className="absolute left-0 top-0 h-full bg-emerald-500 rounded-full transition-all duration-500 opacity-80"
              style={{ width: `${maxValue > 0 ? Math.max((item.actual / maxValue) * 100, 1) : 1}%` }}
            />
          </div>
        </div>
      ))}
      <div className="flex items-center gap-4 text-xs text-slate-500 pt-2">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-violet-400" />
          <span>Budgeted</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-emerald-500" />
          <span>Actual</span>
        </div>
      </div>
    </div>
  );
}

export default function BudgetReportsPage() {
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [fiscalYears, setFiscalYears] = useState<FiscalYear[]>([]);
  const [filterFiscalYear, setFilterFiscalYear] = useState('__all__');
  const printRef = useRef<HTMLDivElement>(null);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterFiscalYear !== '__all__') params.set('fiscalYearId', filterFiscalYear);

      const res = await fetch(`/api/admin/accounts/budget-reports?${params}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setReport(data);
    } catch {
      toast.error('Failed to load budget report');
    } finally {
      setLoading(false);
    }
  }, [filterFiscalYear]);

  const fetchFiscalYears = async () => {
    try {
      const res = await fetch('/api/admin/accounts/fiscal-years');
      const data = await res.json();
      setFiscalYears(data.fiscalYears || []);
    } catch { /* silent */ }
  };

  useEffect(() => { fetchFiscalYears(); }, []);
  useEffect(() => { fetchReport(); }, [fetchReport]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    if (!report) return;
    const headers = ['Budget', 'Fiscal Year', 'Department', 'Status', 'Budgeted', 'Actual', 'Variance', 'Utilization %'];
    const rows = report.budgetVsActual.map((b) => [
      b.name, b.fiscalYear, b.department, b.status, b.totalBudgeted, b.totalActual, b.variance, b.utilizationPercent,
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `budget-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Report exported');
  };

  return (
    <DashboardLayout>
      <div className="space-y-6" ref={printRef}>
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Budget Reports</h1>
            <p className="text-sm text-slate-500 mt-1">Budget vs actual analysis, utilization tracking, and variance reports</p>
          </div>
          <div className="flex gap-2">
            <Select value={filterFiscalYear} onValueChange={setFilterFiscalYear}>
              <SelectTrigger className="w-48"><SelectValue placeholder="All Fiscal Years" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All Fiscal Years</SelectItem>
                {fiscalYears.map((fy) => (
                  <SelectItem key={fy.fiscal_year_id} value={String(fy.fiscal_year_id)}>{fy.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={handleExportCSV} className="border-slate-200">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" onClick={handlePrint} className="border-slate-200">
              <Printer className="w-4 h-4 mr-2" />
              Print
            </Button>
          </div>
        </div>

        {/* Print header */}
        <div className="hidden print:block">
          <div className="text-center mb-4">
            <h1 className="text-xl font-bold">Budget Performance Report</h1>
            <p className="text-sm text-slate-500">
              Generated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              {report?.filters?.fiscalYearId && ` | Fiscal Year Filter: Active`}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i}><CardContent className="p-4"><Skeleton className="h-20 w-full" /></CardContent></Card>
            ))}
          </div>
        ) : report ? (
          <>
            {/* Overview Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="border-violet-100">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center">
                      <BarChart3 className="w-5 h-5 text-violet-600" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 font-medium">Total Budgeted</p>
                      <p className="text-lg font-bold text-violet-700">{formatCurrency(report.overview.totalBudgeted)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-amber-100">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 font-medium">Total Spent</p>
                      <p className="text-lg font-bold text-amber-700">{formatCurrency(report.overview.totalActual)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className={`border-2 ${report.overview.totalVariance >= 0 ? 'border-emerald-100' : 'border-red-100'}`}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${report.overview.totalVariance >= 0 ? 'bg-emerald-100' : 'bg-red-100'}`}>
                      {report.overview.totalVariance >= 0
                        ? <ArrowUpRight className="w-5 h-5 text-emerald-600" />
                        : <ArrowDownRight className="w-5 h-5 text-red-600" />
                      }
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 font-medium">Total Variance</p>
                      <p className={`text-lg font-bold ${report.overview.totalVariance >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                        {formatCurrency(report.overview.totalVariance)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-emerald-100">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                      <Target className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 font-medium">Avg Utilization</p>
                      <div className="flex items-center gap-2">
                        <p className={`text-lg font-bold ${getUtilColor(report.overview.utilizationPercent)}`}>
                          {report.overview.utilizationPercent}%
                        </p>
                      </div>
                    </div>
                  </div>
                  <Progress value={Math.min(report.overview.utilizationPercent, 100)} className={`h-2 mt-2 ${getProgressColor(report.overview.utilizationPercent)}`} />
                </CardContent>
              </Card>
            </div>

            {/* Status Breakdown */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Layers className="w-4 h-4 text-slate-500" />
                  Budget Status Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {Object.entries(report.overview.statusBreakdown).map(([status, count]) => (
                    <div key={status} className="text-center p-3 bg-slate-50 rounded-lg">
                      <p className="text-2xl font-bold text-slate-900">{count}</p>
                      <p className="text-xs text-slate-500 capitalize mt-1">{status}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Tabs defaultValue="comparison" className="print:hidden">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="comparison">Budget vs Actual</TabsTrigger>
                <TabsTrigger value="categories">By Category</TabsTrigger>
                <TabsTrigger value="variance">Variance</TabsTrigger>
                <TabsTrigger value="trend">Trend</TabsTrigger>
              </TabsList>

              {/* Budget vs Actual Tab */}
              <TabsContent value="comparison" className="space-y-4">
                {/* Chart */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-violet-500" />
                      Budget vs Actual by Budget
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    {report.budgetVsActual.length > 0 ? (
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <p className="text-xs text-slate-500 mb-2 font-medium">Budgeted</p>
                          <BarChart
                            data={report.budgetVsActual.slice(0, 8).map((b) => ({
                              label: b.name.length > 12 ? b.name.substring(0, 12) + '...' : b.name,
                              value: b.totalBudgeted,
                              color: '#8b5cf6',
                            }))}
                            maxValue={Math.max(...report.budgetVsActual.map((b) => b.totalBudgeted), 1)}
                          />
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 mb-2 font-medium">Actual</p>
                          <BarChart
                            data={report.budgetVsActual.slice(0, 8).map((b) => ({
                              label: b.name.length > 12 ? b.name.substring(0, 12) + '...' : b.name,
                              value: b.totalActual,
                              color: '#f59e0b',
                            }))}
                            maxValue={Math.max(...report.budgetVsActual.map((b) => b.totalBudgeted), 1)}
                          />
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-slate-400 text-center py-8">No budget data available</p>
                    )}
                  </CardContent>
                </Card>

                {/* Comparison Table */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                      <FileText className="w-4 h-4 text-slate-500" />
                      Detailed Comparison
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-slate-50">
                            <TableHead className="text-xs font-semibold">Budget</TableHead>
                            <TableHead className="text-xs font-semibold">Fiscal Year</TableHead>
                            <TableHead className="text-xs font-semibold">Dept</TableHead>
                            <TableHead className="text-xs font-semibold text-right">Budgeted</TableHead>
                            <TableHead className="text-xs font-semibold text-right">Actual</TableHead>
                            <TableHead className="text-xs font-semibold text-right">Variance</TableHead>
                            <TableHead className="text-xs font-semibold">Utilization</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {report.budgetVsActual.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={7} className="text-center py-8 text-slate-400">No data</TableCell>
                            </TableRow>
                          ) : (
                            report.budgetVsActual.map((b) => (
                              <TableRow key={b.budget_id} className="hover:bg-slate-50/50">
                                <TableCell>
                                  <div>
                                    <p className="font-medium text-sm">{b.name}</p>
                                    <Badge variant="outline" className="text-xs mt-0.5">{b.status}</Badge>
                                  </div>
                                </TableCell>
                                <TableCell className="text-xs text-slate-500">{b.fiscalYear}</TableCell>
                                <TableCell className="text-xs text-slate-500">{b.department}</TableCell>
                                <TableCell className="text-right font-mono text-sm">{formatCurrency(b.totalBudgeted)}</TableCell>
                                <TableCell className="text-right font-mono text-sm text-amber-600">{formatCurrency(b.totalActual)}</TableCell>
                                <TableCell className="text-right font-mono text-sm">
                                  <span className={b.variance >= 0 ? 'text-emerald-600' : 'text-red-600'}>
                                    {b.variance >= 0 ? '+' : ''}{formatCurrency(b.variance)}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2 min-w-28">
                                    <Progress value={Math.min(b.utilizationPercent, 100)} className={`h-2 flex-1 ${getProgressColor(b.utilizationPercent)}`} />
                                    <span className={`text-xs font-medium ${getUtilColor(b.utilizationPercent)}`}>{b.utilizationPercent}%</span>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* By Category Tab */}
              <TabsContent value="categories" className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Category Chart */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base font-semibold flex items-center gap-2">
                        <PieChart className="w-4 h-4 text-violet-500" />
                        Utilization by Category
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      {report.utilizationByCategory.length > 0 ? (
                        <HorizontalBarChart
                          data={report.utilizationByCategory.map((c) => ({
                            label: c.category,
                            budgeted: c.budgeted,
                            actual: c.actual,
                          }))}
                          maxValue={Math.max(...report.utilizationByCategory.map((c) => c.budgeted), 1)}
                        />
                      ) : (
                        <p className="text-sm text-slate-400 text-center py-8">No category data</p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Category Table */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base font-semibold">Category Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="max-h-96 overflow-y-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-slate-50 sticky top-0">
                              <TableHead className="text-xs font-semibold">Category</TableHead>
                              <TableHead className="text-xs font-semibold">Lines</TableHead>
                              <TableHead className="text-xs font-semibold text-right">Budgeted</TableHead>
                              <TableHead className="text-xs font-semibold text-right">Actual</TableHead>
                              <TableHead className="text-xs font-semibold">Util %</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {report.utilizationByCategory.length === 0 ? (
                              <TableRow><TableCell colSpan={5} className="text-center py-8 text-slate-400">No data</TableCell></TableRow>
                            ) : (
                              report.utilizationByCategory.map((c, idx) => (
                                <TableRow key={idx} className="hover:bg-slate-50/50">
                                  <TableCell className="font-medium text-sm">{c.category}</TableCell>
                                  <TableCell className="text-xs text-slate-500">{c.count}</TableCell>
                                  <TableCell className="text-right font-mono text-sm">{formatCurrency(c.budgeted)}</TableCell>
                                  <TableCell className="text-right font-mono text-sm text-amber-600">{formatCurrency(c.actual)}</TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-2 min-w-24">
                                      <Progress value={Math.min(c.utilizationPercent, 100)} className={`h-2 flex-1 ${getProgressColor(c.utilizationPercent)}`} />
                                      <span className={`text-xs font-medium ${getUtilColor(c.utilizationPercent)}`}>{c.utilizationPercent}%</span>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Department Chart */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base font-semibold flex items-center gap-2">
                        <Layers className="w-4 h-4 text-emerald-500" />
                        Utilization by Department
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      {report.utilizationByDepartment.length > 0 ? (
                        <HorizontalBarChart
                          data={report.utilizationByDepartment.map((d) => ({
                            label: d.department,
                            budgeted: d.budgeted,
                            actual: d.actual,
                          }))}
                          maxValue={Math.max(...report.utilizationByDepartment.map((d) => d.budgeted), 1)}
                        />
                      ) : (
                        <p className="text-sm text-slate-400 text-center py-8">No department data</p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Department Table */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base font-semibold">Department Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="max-h-96 overflow-y-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-slate-50 sticky top-0">
                              <TableHead className="text-xs font-semibold">Department</TableHead>
                              <TableHead className="text-xs font-semibold">Budgets</TableHead>
                              <TableHead className="text-xs font-semibold text-right">Budgeted</TableHead>
                              <TableHead className="text-xs font-semibold text-right">Actual</TableHead>
                              <TableHead className="text-xs font-semibold">Util %</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {report.utilizationByDepartment.length === 0 ? (
                              <TableRow><TableCell colSpan={5} className="text-center py-8 text-slate-400">No data</TableCell></TableRow>
                            ) : (
                              report.utilizationByDepartment.map((d, idx) => (
                                <TableRow key={idx} className="hover:bg-slate-50/50">
                                  <TableCell className="font-medium text-sm">{d.department}</TableCell>
                                  <TableCell className="text-xs text-slate-500">{d.budgetCount}</TableCell>
                                  <TableCell className="text-right font-mono text-sm">{formatCurrency(d.budgeted)}</TableCell>
                                  <TableCell className="text-right font-mono text-sm text-amber-600">{formatCurrency(d.actual)}</TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-2 min-w-24">
                                      <Progress value={Math.min(d.utilizationPercent, 100)} className={`h-2 flex-1 ${getProgressColor(d.utilizationPercent)}`} />
                                      <span className={`text-xs font-medium ${getUtilColor(d.utilizationPercent)}`}>{d.utilizationPercent}%</span>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Variance Analysis Tab */}
              <TabsContent value="variance" className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Over Budget */}
                  <Card className="border-red-100">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base font-semibold flex items-center gap-2 text-red-700">
                        <ArrowDownRight className="w-4 h-4" />
                        Top Over Budget Items
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="max-h-96 overflow-y-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-red-50 sticky top-0">
                              <TableHead className="text-xs font-semibold">Item</TableHead>
                              <TableHead className="text-xs font-semibold">Account</TableHead>
                              <TableHead className="text-xs font-semibold text-right">Budgeted</TableHead>
                              <TableHead className="text-xs font-semibold text-right">Actual</TableHead>
                              <TableHead className="text-xs font-semibold text-right">Over</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {report.topOverBudget.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={5} className="text-center py-8 text-slate-400">
                                  <CheckCircle2 className="w-6 h-6 mx-auto mb-1 text-emerald-500" />
                                  <p className="text-sm">No over-budget items</p>
                                </TableCell>
                              </TableRow>
                            ) : (
                              report.topOverBudget.map((item, idx) => (
                                <TableRow key={idx} className="hover:bg-red-50/50">
                                  <TableCell className="text-sm">{item.description || '—'}</TableCell>
                                  <TableCell className="text-xs text-slate-500">{item.accountName}</TableCell>
                                  <TableCell className="text-right font-mono text-xs">{formatCurrency(item.budgeted_amount)}</TableCell>
                                  <TableCell className="text-right font-mono text-xs text-red-600">{formatCurrency(item.actual_amount)}</TableCell>
                                  <TableCell className="text-right font-mono text-xs text-red-600 font-bold">
                                    {formatCurrency(Math.abs(item.variance))}
                                  </TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Under Budget */}
                  <Card className="border-emerald-100">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base font-semibold flex items-center gap-2 text-emerald-700">
                        <ArrowUpRight className="w-4 h-4" />
                        Top Under Budget Items
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="max-h-96 overflow-y-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-emerald-50 sticky top-0">
                              <TableHead className="text-xs font-semibold">Item</TableHead>
                              <TableHead className="text-xs font-semibold">Account</TableHead>
                              <TableHead className="text-xs font-semibold text-right">Budgeted</TableHead>
                              <TableHead className="text-xs font-semibold text-right">Actual</TableHead>
                              <TableHead className="text-xs font-semibold text-right">Saved</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {report.topUnderBudget.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={5} className="text-center py-8 text-slate-400">No under-budget items</TableCell>
                              </TableRow>
                            ) : (
                              report.topUnderBudget.map((item, idx) => (
                                <TableRow key={idx} className="hover:bg-emerald-50/50">
                                  <TableCell className="text-sm">{item.description || '—'}</TableCell>
                                  <TableCell className="text-xs text-slate-500">{item.accountName}</TableCell>
                                  <TableCell className="text-right font-mono text-xs">{formatCurrency(item.budgeted_amount)}</TableCell>
                                  <TableCell className="text-right font-mono text-xs text-amber-600">{formatCurrency(item.actual_amount)}</TableCell>
                                  <TableCell className="text-right font-mono text-xs text-emerald-600 font-bold">
                                    +{formatCurrency(item.variance)}
                                  </TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Period Comparison */}
                  <Card className="lg:col-span-2">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base font-semibold flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-slate-500" />
                        Period-over-Period Comparison (by Fiscal Year)
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-slate-50">
                              <TableHead className="text-xs font-semibold">Fiscal Year</TableHead>
                              <TableHead className="text-xs font-semibold">Status</TableHead>
                              <TableHead className="text-xs font-semibold text-center">Budgets</TableHead>
                              <TableHead className="text-xs font-semibold text-right">Budgeted</TableHead>
                              <TableHead className="text-xs font-semibold text-right">Actual</TableHead>
                              <TableHead className="text-xs font-semibold text-right">Variance</TableHead>
                              <TableHead className="text-xs font-semibold">Util %</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {report.periodComparison.length === 0 ? (
                              <TableRow><TableCell colSpan={7} className="text-center py-8 text-slate-400">No data</TableCell></TableRow>
                            ) : (
                              report.periodComparison.map((p) => {
                                const utilPct = p.totalBudgeted > 0 ? Math.round((p.totalActual / p.totalBudgeted) * 100) : 0;
                                return (
                                  <TableRow key={p.fiscal_year_id} className="hover:bg-slate-50/50">
                                    <TableCell className="font-medium text-sm">{p.name}</TableCell>
                                    <TableCell>
                                      <Badge variant="outline" className={`text-xs ${p.status === 'active' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500'}`}>
                                        {p.status}
                                      </Badge>
                                    </TableCell>
                                    <TableCell className="text-center text-sm">{p.budgetCount}</TableCell>
                                    <TableCell className="text-right font-mono text-sm">{formatCurrency(p.totalBudgeted)}</TableCell>
                                    <TableCell className="text-right font-mono text-sm text-amber-600">{formatCurrency(p.totalActual)}</TableCell>
                                    <TableCell className="text-right font-mono text-sm">
                                      <span className={p.totalVariance >= 0 ? 'text-emerald-600' : 'text-red-600'}>
                                        {p.totalVariance >= 0 ? '+' : ''}{formatCurrency(p.totalVariance)}
                                      </span>
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex items-center gap-2 min-w-24">
                                        <Progress value={Math.min(utilPct, 100)} className={`h-2 flex-1 ${getProgressColor(utilPct)}`} />
                                        <span className={`text-xs font-medium ${getUtilColor(utilPct)}`}>{utilPct}%</span>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                );
                              })
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Trend Tab */}
              <TabsContent value="trend" className="space-y-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-violet-500" />
                      Monthly Expenditure Trend (Last 12 Months)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    {report.monthlyTrend.length > 0 ? (
                      <BarChart
                        data={report.monthlyTrend.map((m) => ({
                          label: m.month.split(' ')[0],
                          value: m.actual,
                          color: '#10b981',
                        }))}
                        maxValue={Math.max(...report.monthlyTrend.map((m) => m.actual), 1)}
                      />
                    ) : (
                      <p className="text-sm text-slate-400 text-center py-8">No monthly data available</p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-semibold">Monthly Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="max-h-96 overflow-y-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-slate-50 sticky top-0">
                            <TableHead className="text-xs font-semibold">Month</TableHead>
                            <TableHead className="text-xs font-semibold text-right">Expenditure</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {report.monthlyTrend.map((m, idx) => (
                            <TableRow key={idx} className="hover:bg-slate-50/50">
                              <TableCell className="text-sm font-medium">{m.month}</TableCell>
                              <TableCell className="text-right font-mono text-sm text-amber-600">{formatCurrency(m.actual)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Print-only full comparison table */}
            <div className="hidden print:block space-y-4 mt-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold">Budget vs Actual Comparison</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-100">
                        <TableHead>Budget</TableHead>
                        <TableHead>Fiscal Year</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead className="text-right">Budgeted</TableHead>
                        <TableHead className="text-right">Actual</TableHead>
                        <TableHead className="text-right">Variance</TableHead>
                        <TableHead>Util %</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {report.budgetVsActual.map((b) => (
                        <TableRow key={b.budget_id}>
                          <TableCell className="font-medium">{b.name}</TableCell>
                          <TableCell>{b.fiscalYear}</TableCell>
                          <TableCell>{b.department}</TableCell>
                          <TableCell className="text-right font-mono">{formatCurrency(b.totalBudgeted)}</TableCell>
                          <TableCell className="text-right font-mono">{formatCurrency(b.totalActual)}</TableCell>
                          <TableCell className={`text-right font-mono ${b.variance >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                            {formatCurrency(b.variance)}
                          </TableCell>
                          <TableCell>{b.utilizationPercent}%</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </>
        ) : null}
      </div>
    </DashboardLayout>
  );
}
