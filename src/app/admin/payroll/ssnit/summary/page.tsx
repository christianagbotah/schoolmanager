'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import {
  FileText, Download, Printer, ArrowLeft, Calculator, Calendar,
  TrendingUp, TrendingDown, Minus, BarChart3, Shield, Users, DollarSign,
  CheckCircle, AlertCircle, Clock,
} from 'lucide-react';

interface MonthlyData {
  month: string;
  monthName: string;
  monthNum: number;
  totalEmployees: number;
  totalGross: number;
  employeeDeductions: number;
  employerContributions: number;
  totalContributions: number;
  filingStatus: string;
}

interface AnnualTotals {
  totalEmployees: number;
  totalGross: number;
  employeeDeductions: number;
  employerContributions: number;
  totalContributions: number;
}

interface PrevYearData {
  year: string;
  monthlyData: Array<{ month: string; totalContributions: number }>;
  totalContributions: number;
}

interface SummaryResponse {
  year: string;
  monthlyData: MonthlyData[];
  annualTotals: AnnualTotals;
  previousYear: PrevYearData;
}

function fmt(n: number) {
  return `GHS ${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtShort(n: number) {
  if (n >= 1000000) return `GHS ${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `GHS ${(n / 1000).toFixed(1)}K`;
  return `GHS ${n.toFixed(0)}`;
}

const filingBadge = (status: string) => {
  const config: Record<string, { cls: string; label: string; icon: React.ElementType }> = {
    none: { cls: 'bg-slate-100 text-slate-500', label: 'No Data', icon: Minus },
    draft: { cls: 'bg-amber-100 text-amber-700', label: 'Draft', icon: Clock },
    filed: { cls: 'bg-sky-100 text-sky-700', label: 'Filed', icon: FileText },
    approved: { cls: 'bg-emerald-100 text-emerald-700', label: 'Approved', icon: CheckCircle },
  };
  const c = config[status] || config.none;
  return (
    <Badge className={`${c.cls} text-[10px] font-semibold`}>
      <c.icon className="w-3 h-3 mr-1" />
      {c.label}
    </Badge>
  );
};

export default function SSNITSummaryPage() {
  const router = useRouter();
  const printRef = useRef<HTMLDivElement>(null);

  const [data, setData] = useState<SummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const [selectedYear, setSelectedYear] = useState(String(new Date().getFullYear()));

  const years = [
    String(new Date().getFullYear()),
    String(new Date().getFullYear() - 1),
    String(new Date().getFullYear() - 2),
    String(new Date().getFullYear() - 3),
  ];

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/payroll/ssnit/summary?year=${selectedYear}`);
      if (!res.ok) throw new Error('Failed to load summary');
      const json = await res.json();
      setData(json);
    } catch {
      toast.error('Failed to load SSNIT annual summary');
    }
    setLoading(false);
  }, [selectedYear]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const handleExportCSV = () => {
    if (!data) return;
    const header = 'Month,Employees,Total Gross,Employee Deductions (5.5%),Employer Contributions (8.0%),Total Contributions (13.5%),Filing Status';
    const rows = data.monthlyData.map((m) =>
      [
        m.monthName,
        m.totalEmployees,
        m.totalGross,
        m.employeeDeductions,
        m.employerContributions,
        m.totalContributions,
        m.filingStatus,
      ].join(',')
    );
    const totalsRow = [
      'ANNUAL TOTAL',
      data.annualTotals.totalEmployees,
      data.annualTotals.totalGross,
      data.annualTotals.employeeDeductions,
      data.annualTotals.employerContributions,
      data.annualTotals.totalContributions,
      '',
    ].join(',');
    const blob = new Blob([[header, ...rows, '', totalsRow].join('\n')], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ssnit_annual_summary_${selectedYear}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Summary CSV exported');
  };

  const handleExportPDF = () => {
    const content = printRef.current;
    if (!content) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Please allow popups');
      return;
    }
    printWindow.document.write(`
      <!DOCTYPE html>
      <html><head><title>SSNIT Annual Summary - ${selectedYear}</title>
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 24px; color: #1e293b; }
        .header { text-align: center; border-bottom: 3px solid #0f172a; padding-bottom: 16px; margin-bottom: 24px; }
        .header h1 { font-size: 20px; margin: 0 0 4px; } .header p { font-size: 12px; color: #64748b; margin: 2px 0; }
        table { width: 100%; border-collapse: collapse; font-size: 12px; }
        th { text-align: left; padding: 8px 10px; background: #f1f5f9; border-bottom: 2px solid #0f172a; font-size: 11px; }
        td { padding: 7px 10px; border-bottom: 1px solid #f1f5f9; }
        .totals-row { font-weight: 700; border-top: 2px solid #0f172a; background: #f8fafc; }
        .text-right { text-align: right; }
        .footer { margin-top: 24px; text-align: center; font-size: 10px; color: #94a3b8; }
        @media print { body { padding: 10px; } }
      </style></head><body>
      ${content.innerHTML}
      </body></html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); }, 400);
  };

  // Chart helpers
  const maxContribution = data
    ? Math.max(...data.monthlyData.map((m) => m.totalContributions), 1)
    : 1;

  const getBarHeight = (value: number) => {
    if (value <= 0) return 2;
    return Math.max(4, (value / maxContribution) * 200);
  };

  // Year-over-year comparison
  const yoyChange = data
    ? data.previousYear.totalContributions > 0
      ? ((data.annualTotals.totalContributions - data.previousYear.totalContributions) /
          data.previousYear.totalContributions) *
        100
      : 0
    : 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="h-9 w-9 p-0"
              onClick={() => router.push('/admin/payroll/ssnit')}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                SSNIT Annual Summary
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Monthly contribution trends and annual totals
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Calendar className="w-4 h-4 text-slate-500" />
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-[120px] min-h-[44px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map((y) => (
                  <SelectItem key={y} value={y}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              className="min-h-[44px]"
              onClick={handleExportCSV}
              disabled={loading || !data}
            >
              <Download className="w-4 h-4 mr-2" />
              CSV
            </Button>
            <Button
              variant="outline"
              className="min-h-[44px]"
              onClick={handleExportPDF}
              disabled={loading || !data}
            >
              <Printer className="w-4 h-4 mr-2" />
              PDF
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-xl" />
            ))}
          </div>
        ) : data ? (
          <>
            {/* Annual Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="border-slate-200/60">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                      <Users className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Total Employees (avg/mo)</p>
                      <p className="text-xl font-bold">
                        {data.annualTotals.totalEmployees > 0
                          ? Math.round(data.annualTotals.totalEmployees / 12)
                          : 0}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-slate-200/60">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-sky-100 flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-sky-600" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Annual Gross Salary</p>
                      <p className="text-lg font-bold">{fmtShort(data.annualTotals.totalGross)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-slate-200/60">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                      <Shield className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Total SSNIT (13.5%)</p>
                      <p className="text-lg font-bold text-amber-700">
                        {fmtShort(data.annualTotals.totalContributions)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-slate-200/60">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center">
                      {yoyChange > 0 ? (
                        <TrendingUp className="w-5 h-5 text-emerald-600" />
                      ) : yoyChange < 0 ? (
                        <TrendingDown className="w-5 h-5 text-red-500" />
                      ) : (
                        <Minus className="w-5 h-5 text-slate-400" />
                      )}
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">YoY Change ({data.previousYear.year})</p>
                      <p
                        className={`text-lg font-bold ${
                          yoyChange > 0 ? 'text-emerald-600' : yoyChange < 0 ? 'text-red-600' : 'text-slate-500'
                        }`}
                      >
                        {yoyChange > 0 ? '+' : ''}
                        {yoyChange.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Bar Chart */}
            <Card className="border-slate-200/60">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  Monthly Contribution Trends
                  <span className="text-xs text-slate-400 font-normal">({selectedYear})</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="flex items-end gap-2 md:gap-3 h-[240px] overflow-x-auto pb-2">
                  {data.monthlyData.map((m) => {
                    const height = getBarHeight(m.totalContributions);
                    const prevMonth = data.previousYear.monthlyData.find(
                      (pm) => pm.month === m.month
                    );
                    const prevHeight = prevMonth
                      ? getBarHeight(prevMonth.totalContributions)
                      : 2;
                    return (
                      <div
                        key={m.month}
                        className="flex flex-col items-center flex-1 min-w-[40px] md:min-w-[50px]"
                      >
                        <div className="text-[10px] text-slate-500 mb-1 font-mono">
                          {m.totalContributions > 0
                            ? fmtShort(m.totalContributions)
                            : '—'}
                        </div>
                        <div className="flex items-end gap-0.5 w-full justify-center" style={{ height: '200px' }}>
                          {/* Previous year bar */}
                          <div
                            className="w-3 md:w-4 bg-slate-200 rounded-t-sm transition-all duration-500"
                            style={{ height: `${prevHeight}px` }}
                            title={`${data.previousYear.year}: GHS ${prevMonth?.totalContributions?.toFixed(2) || '0'}`}
                          />
                          {/* Current year bar */}
                          <div
                            className={`w-3 md:w-4 rounded-t-sm transition-all duration-500 ${
                              m.filingStatus === 'approved'
                                ? 'bg-emerald-500'
                                : m.filingStatus === 'filed'
                                ? 'bg-sky-500'
                                : m.totalContributions > 0
                                ? 'bg-amber-400'
                                : 'bg-slate-100'
                            }`}
                            style={{ height: `${height}px` }}
                            title={`${selectedYear}: GHS ${m.totalContributions.toFixed(2)}`}
                          />
                        </div>
                        <div className="text-[9px] md:text-[10px] text-slate-500 mt-1.5 font-medium truncate w-full text-center">
                          {m.monthName.slice(0, 3)}
                        </div>
                      </div>
                    );
                  })}
                </div>
                {/* Chart Legend */}
                <div className="flex items-center justify-center gap-6 mt-4 pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded bg-emerald-500" />
                    <span className="text-[10px] text-slate-500">Approved</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded bg-sky-500" />
                    <span className="text-[10px] text-slate-500">Filed</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded bg-amber-400" />
                    <span className="text-[10px] text-slate-500">Draft</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded bg-slate-200" />
                    <span className="text-[10px] text-slate-500">{data.previousYear.year}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Monthly Comparison Table */}
            <Card className="border-slate-200/60">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Monthly Comparison
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50">
                        <TableHead>Month</TableHead>
                        <TableHead className="text-center">Employees</TableHead>
                        <TableHead className="text-right">Total Gross</TableHead>
                        <TableHead className="text-right">Employee 5.5%</TableHead>
                        <TableHead className="text-right">Employer 8.0%</TableHead>
                        <TableHead className="text-right">Total 13.5%</TableHead>
                        <TableHead className="text-right">{data.previousYear.year}</TableHead>
                        <TableHead className="text-center">YoY %</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.monthlyData.map((m) => {
                        const prevMonth = data.previousYear.monthlyData.find(
                          (pm) => pm.month === m.month
                        );
                        const prevContrib = prevMonth?.totalContributions || 0;
                        const yoy =
                          prevContrib > 0
                            ? ((m.totalContributions - prevContrib) / prevContrib) * 100
                            : m.totalContributions > 0
                            ? 100
                            : 0;

                        return (
                          <TableRow
                            key={m.month}
                            className={
                              m.totalContributions === 0 ? 'opacity-50' : ''
                            }
                          >
                            <TableCell className="font-medium text-sm">
                              {m.monthName}
                            </TableCell>
                            <TableCell className="text-center text-sm">
                              {m.totalEmployees || '—'}
                            </TableCell>
                            <TableCell className="text-sm text-right">
                              {m.totalGross > 0
                                ? m.totalGross.toLocaleString()
                                : '—'}
                            </TableCell>
                            <TableCell className="text-sm text-right text-violet-600">
                              {m.employeeDeductions > 0
                                ? m.employeeDeductions.toLocaleString()
                                : '—'}
                            </TableCell>
                            <TableCell className="text-sm text-right text-rose-600">
                              {m.employerContributions > 0
                                ? m.employerContributions.toLocaleString()
                                : '—'}
                            </TableCell>
                            <TableCell className="text-sm text-right font-bold">
                              {m.totalContributions > 0
                                ? m.totalContributions.toLocaleString()
                                : '—'}
                            </TableCell>
                            <TableCell className="text-sm text-right text-slate-400">
                              {prevContrib > 0
                                ? prevContrib.toLocaleString()
                                : '—'}
                            </TableCell>
                            <TableCell className="text-center">
                              {m.totalContributions > 0 || prevContrib > 0 ? (
                                <div className="flex items-center justify-center gap-1">
                                  {yoy > 0 ? (
                                    <TrendingUp className="w-3 h-3 text-emerald-500" />
                                  ) : yoy < 0 ? (
                                    <TrendingDown className="w-3 h-3 text-red-500" />
                                  ) : (
                                    <Minus className="w-3 h-3 text-slate-400" />
                                  )}
                                  <span
                                    className={`text-[10px] font-semibold ${
                                      yoy > 0
                                        ? 'text-emerald-600'
                                        : yoy < 0
                                        ? 'text-red-600'
                                        : 'text-slate-500'
                                    }`}
                                  >
                                    {yoy > 0 ? '+' : ''}
                                    {yoy.toFixed(1)}%
                                  </span>
                                </div>
                              ) : (
                                '—'
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              {filingBadge(m.filingStatus)}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      {/* Annual Totals Row */}
                      <TableRow className="bg-slate-100 font-bold border-t-2 border-slate-300">
                        <TableCell className="text-sm">ANNUAL TOTAL</TableCell>
                        <TableCell className="text-center text-sm">
                          {data.annualTotals.totalEmployees}
                        </TableCell>
                        <TableCell className="text-sm text-right">
                          {data.annualTotals.totalGross.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-sm text-right text-violet-700">
                          {data.annualTotals.employeeDeductions.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-sm text-right text-rose-700">
                          {data.annualTotals.employerContributions.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-sm text-right text-amber-700">
                          {data.annualTotals.totalContributions.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-sm text-right text-slate-500">
                          {data.previousYear.totalContributions.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            {yoyChange > 0 ? (
                              <TrendingUp className="w-3 h-3 text-emerald-500" />
                            ) : yoyChange < 0 ? (
                              <TrendingDown className="w-3 h-3 text-red-500" />
                            ) : (
                              <Minus className="w-3 h-3 text-slate-400" />
                            )}
                            <span
                              className={`text-xs font-bold ${
                                yoyChange > 0
                                  ? 'text-emerald-600'
                                  : yoyChange < 0
                                  ? 'text-red-600'
                                  : 'text-slate-500'
                              }`}
                            >
                              {yoyChange > 0 ? '+' : ''}
                              {yoyChange.toFixed(1)}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell></TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Year-over-Year Comparison Card */}
            <Card className="border-slate-200/60">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Calculator className="w-4 h-4" />
                  Year-over-Year Comparison
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Current Year */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-emerald-100 text-emerald-700 text-xs font-semibold">
                        {selectedYear}
                      </Badge>
                      <span className="text-sm text-slate-600">Current Year</span>
                    </div>
                    <div className="space-y-2">
                      {[
                        { label: 'Total Gross', value: data.annualTotals.totalGross },
                        { label: 'Employee Deductions', value: data.annualTotals.employeeDeductions },
                        { label: 'Employer Contributions', value: data.annualTotals.employerContributions },
                        { label: 'Total Contributions', value: data.annualTotals.totalContributions },
                      ].map((item) => (
                        <div
                          key={item.label}
                          className="flex justify-between items-center p-2 bg-slate-50 rounded-lg"
                        >
                          <span className="text-xs text-slate-600">{item.label}</span>
                          <span className="text-sm font-bold">{fmt(item.value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Previous Year */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-slate-200 text-slate-600 text-xs font-semibold">
                        {data.previousYear.year}
                      </Badge>
                      <span className="text-sm text-slate-600">Previous Year</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center p-2 bg-slate-50 rounded-lg">
                        <span className="text-xs text-slate-600">Total Contributions</span>
                        <span className="text-sm font-bold">
                          {fmt(data.previousYear.totalContributions)}
                        </span>
                      </div>
                      <Separator />
                      <div className="flex justify-between items-center p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                        <span className="text-xs text-emerald-700 font-medium">
                          Difference
                        </span>
                        <span
                          className={`text-sm font-bold ${
                            yoyChange >= 0 ? 'text-emerald-700' : 'text-red-600'
                          }`}
                        >
                          {yoyChange >= 0 ? '+' : ''}
                          {fmt(
                            data.annualTotals.totalContributions -
                              data.previousYear.totalContributions
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-sky-50 rounded-lg border border-sky-100">
                        <span className="text-xs text-sky-700 font-medium">
                          Percentage Change
                        </span>
                        <span
                          className={`text-sm font-bold ${
                            yoyChange >= 0 ? 'text-sky-700' : 'text-red-600'
                          }`}
                        >
                          {yoyChange > 0 ? '+' : ''}
                          {yoyChange.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Filing Status Summary */}
            <Card className="border-slate-200/60">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Filing Status Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {(() => {
                    const statusCounts = {
                      none: data.monthlyData.filter((m) => m.filingStatus === 'none').length,
                      draft: data.monthlyData.filter((m) => m.filingStatus === 'draft').length,
                      filed: data.monthlyData.filter((m) => m.filingStatus === 'filed').length,
                      approved: data.monthlyData.filter((m) => m.filingStatus === 'approved').length,
                    };
                    const items = [
                      { status: 'approved' as const, color: 'emerald', label: 'Approved' },
                      { status: 'filed' as const, color: 'sky', label: 'Filed' },
                      { status: 'draft' as const, color: 'amber', label: 'Draft' },
                      { status: 'none' as const, color: 'slate', label: 'No Data' },
                    ];
                    return items.map((item) => (
                      <div
                        key={item.status}
                        className={`p-3 rounded-lg border text-center ${
                          item.status === 'approved'
                            ? 'bg-emerald-50 border-emerald-200'
                            : item.status === 'filed'
                            ? 'bg-sky-50 border-sky-200'
                            : item.status === 'draft'
                            ? 'bg-amber-50 border-amber-200'
                            : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <p className="text-2xl font-bold">
                          {statusCounts[item.status]}
                        </p>
                        <p className="text-xs text-slate-600">{item.label}</p>
                        <div className="mt-1.5 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              item.status === 'approved'
                                ? 'bg-emerald-500'
                                : item.status === 'filed'
                                ? 'bg-sky-500'
                                : item.status === 'draft'
                                ? 'bg-amber-400'
                                : 'bg-slate-300'
                            }`}
                            style={{
                              width: `${(statusCounts[item.status] / 12) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </CardContent>
            </Card>

            {/* Hidden Print Content */}
            <div ref={printRef} style={{ display: 'none' }}>
              <div className="header">
                <h1>SSNIT ANNUAL SUMMARY REPORT</h1>
                <p>Social Security and National Insurance Trust — {selectedYear}</p>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>Month</th>
                    <th className="text-right">Employees</th>
                    <th className="text-right">Total Gross</th>
                    <th className="text-right">Employee 5.5%</th>
                    <th className="text-right">Employer 8.0%</th>
                    <th className="text-right">Total 13.5%</th>
                    <th className="text-right">{data.previousYear.year}</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.monthlyData.map((m) => {
                    const prevMonth = data.previousYear.monthlyData.find(
                      (pm) => pm.month === m.month
                    );
                    return (
                      <tr key={m.month}>
                        <td>{m.monthName}</td>
                        <td className="text-right">{m.totalEmployees}</td>
                        <td className="text-right">{m.totalGross.toLocaleString()}</td>
                        <td className="text-right">{m.employeeDeductions.toLocaleString()}</td>
                        <td className="text-right">{m.employerContributions.toLocaleString()}</td>
                        <td className="text-right">{m.totalContributions.toLocaleString()}</td>
                        <td className="text-right">
                          {prevMonth?.totalContributions?.toLocaleString() || '0'}
                        </td>
                        <td>{m.filingStatus.toUpperCase()}</td>
                      </tr>
                    );
                  })}
                  <tr className="totals-row">
                    <td>ANNUAL TOTAL</td>
                    <td className="text-right">{data.annualTotals.totalEmployees}</td>
                    <td className="text-right">{data.annualTotals.totalGross.toLocaleString()}</td>
                    <td className="text-right">{data.annualTotals.employeeDeductions.toLocaleString()}</td>
                    <td className="text-right">{data.annualTotals.employerContributions.toLocaleString()}</td>
                    <td className="text-right">{data.annualTotals.totalContributions.toLocaleString()}</td>
                    <td className="text-right">{data.previousYear.totalContributions.toLocaleString()}</td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
              <div className="footer">
                <p>SSNIT Annual Summary — Generated on {new Date().toLocaleDateString()}</p>
              </div>
            </div>
          </>
        ) : (
          <Card className="border-slate-200/60">
            <CardContent className="p-12 text-center">
              <AlertCircle className="w-10 h-10 mx-auto mb-3 text-slate-400" />
              <p className="text-slate-500">Unable to load SSNIT summary data</p>
              <Button variant="outline" className="mt-4" onClick={fetchSummary}>
                Retry
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
