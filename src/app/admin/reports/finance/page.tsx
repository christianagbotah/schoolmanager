'use client';

import { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  Bar, BarChart, Line, LineChart, XAxis, YAxis, CartesianGrid, Cell, Pie, PieChart,
} from 'recharts';
import {
  ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig,
} from '@/components/ui/chart';
import {
  TrendingUp, TrendingDown, DollarSign, AlertCircle, FileDown, BarChart3,
  PieChartIcon, Clock, Users, Printer, Wallet, CreditCard, ChevronRight,
  FileBarChart, CalendarDays, RefreshCw, CheckCircle2, Trophy, Target,
  Building2,
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────────
type ReportType = 'annual' | 'termly' | 'daterange';

interface FinanceReport {
  reportType: ReportType;
  filters: { year: string; term: string; startDate: string; endDate: string };
  incomeExpense: { totalIncome: number; totalExpense: number; netIncome: number; incomeTransactions: number; expenseTransactions: number };
  incomeExpenseTrend: { month: string; year: string; income: number; expense: number }[];
  methodDistribution: { method: string; amount: number; count: number }[];
  feeTypeBreakdown: { type: string; total: number; color: string }[];
  outstandingByClass: { class: string; amount: number }[];
  totalOutstanding: number;
  collectionEfficiency: { rate: number; studentsPaid: number; totalStudents: number; totalInvoiced: number };
  invoiceStatusCounts: { status: string; count: number }[];
  dailyFeeSummary: { total: number; feeding: number; breakfast: number; classes: number; water: number; transport: number };
  topCollectors: { name: string; total: number; transactions: number }[];
  revenueByClass: { class_name: string; total: number }[];
  cashPosition: number;
}

// ── Helpers ────────────────────────────────────────────────
function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-UG', { style: 'currency', currency: 'UGX', minimumFractionDigits: 0 }).format(amount);
}

// ── Chart configs ──────────────────────────────────────────
const trendChartConfig = {
  income: { label: 'Income', color: '#059669' },
  expense: { label: 'Expense', color: '#dc2626' },
} satisfies ChartConfig;

const feeTypeConfig: ChartConfig = {
  feeding: { label: 'Feeding', color: '#f97316' },
  breakfast: { label: 'Breakfast', color: '#eab308' },
  classes: { label: 'Classes', color: '#059669' },
  water: { label: 'Water', color: '#0284c7' },
  transport: { label: 'Transport', color: '#7c3aed' },
};

const paymentMethodConfig = {
  cash: { label: 'Cash', color: '#059669' },
  momo: { label: 'Mobile Money', color: '#0284c7' },
  bank_transfer: { label: 'Bank Transfer', color: '#7c3aed' },
  other: { label: 'Other', color: '#d97706' },
} satisfies ChartConfig;

const pieColors = ['#059669', '#0284c7', '#7c3aed', '#d97706', '#dc2626', '#0891b2', '#4f46e5', '#db2777'];

const invoiceStatusConfig: Record<string, { label: string; color: string }> = {
  paid: { label: 'Paid', color: 'bg-emerald-100 text-emerald-700' },
  partial: { label: 'Partial', color: 'bg-amber-100 text-amber-700' },
  unpaid: { label: 'Unpaid', color: 'bg-gray-100 text-gray-600' },
  overdue: { label: 'Overdue', color: 'bg-red-100 text-red-700' },
};

// ── Report Type Tiles (CI3 parity) ─────────────────────────
const reportTiles: { type: ReportType; label: string; description: string; icon: typeof CalendarDays; color: string }[] = [
  { type: 'annual', label: 'Annual', description: 'Full year financial overview', icon: CalendarDays, color: 'from-emerald-500 to-emerald-600' },
  { type: 'termly', label: 'Termly', description: 'Per-term financial analysis', icon: Target, color: 'from-sky-500 to-sky-600' },
  { type: 'daterange', label: 'Date Range', description: 'Custom date interval report', icon: BarChart3, color: 'from-slate-500 to-slate-600' },
];

// ── Years ──────────────────────────────────────────────────
const currentYear = new Date().getFullYear();
const years = [String(currentYear), String(currentYear - 1), String(currentYear - 2)];

// ════════════════════════════════════════════════════════════
// COMPONENT
// ════════════════════════════════════════════════════════════
export default function FinanceReportsPage() {
  const [reportType, setReportType] = useState<ReportType>('annual');
  const [year, setYear] = useState(String(currentYear));
  const [term, setTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<FinanceReport | null>(null);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ reportType, year });
      if (term && reportType === 'termly') params.set('term', term);
      if (startDate && reportType === 'daterange') params.set('startDate', startDate);
      if (endDate && reportType === 'daterange') params.set('endDate', endDate);
      const res = await fetch(`/api/admin/reports/finance?${params}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setReport(data);
    } catch {
      toast.error('Failed to load financial report');
    } finally {
      setLoading(false);
    }
  }, [reportType, year, term, startDate, endDate]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  // ── Export CSV ──
  const handleExportCSV = () => {
    if (!report) return;
    const rows = [
      ['Metric', 'Value'],
      ['Total Income', report.incomeExpense.totalIncome],
      ['Total Expenses', report.incomeExpense.totalExpense],
      ['Net Income', report.incomeExpense.netIncome],
      ['Income Transactions', report.incomeExpense.incomeTransactions],
      ['Expense Transactions', report.incomeExpense.expenseTransactions],
      ['Collection Rate', `${report.collectionEfficiency.rate}%`],
      ['Outstanding', report.totalOutstanding],
      ['Cash Position', report.cashPosition],
      [''],
      ['Monthly Breakdown', '', 'Income', 'Expense'],
      ...report.incomeExpenseTrend.map((t) => [t.month, '', t.income, t.expense]),
      [''],
      ['Fee Type Breakdown', 'Amount'],
      ...report.feeTypeBreakdown.map((f) => [f.type, f.total]),
      [''],
      ['Payment Methods', 'Amount', 'Count'],
      ...report.methodDistribution.map((m) => [m.method, m.amount, m.count]),
      [''],
      ['Outstanding by Class', 'Amount'],
      ...report.outstandingByClass.map((c) => [c.class, c.amount]),
      [''],
      ['Top Collectors', 'Total', 'Transactions'],
      ...report.topCollectors.map((c) => [c.name, c.total, c.transactions]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `finance-report-${reportType}-${year}-${term || 'all'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Report exported');
  };

  const handlePrint = () => window.print();

  // ── Derived data ──
  const pieData = report?.methodDistribution.map((d, i) => ({
    name: d.method.charAt(0).toUpperCase() + d.method.slice(1),
    value: d.amount,
    count: d.count,
    fill: pieColors[i % pieColors.length],
  })) || [];

  const pieConfig: ChartConfig = {};
  pieData.forEach((d, i) => {
    pieConfig[d.name.toLowerCase().replace(/\s/g, '_')] = { label: d.name, color: pieColors[i % pieColors.length] };
  });

  const feeTypePieData = report?.feeTypeBreakdown.map((f) => ({
    name: f.type.toLowerCase(),
    value: f.total,
    fill: f.color,
  })) || [];

  const paymentBarData = report?.methodDistribution.map((m, i) => ({
    method: m.method.charAt(0).toUpperCase() + m.method.slice(1),
    amount: m.amount,
    fill: pieColors[i % pieColors.length],
  })) || [];

  const collectorColors = ['bg-emerald-100 text-emerald-700', 'bg-sky-100 text-sky-700', 'bg-violet-100 text-violet-700', 'bg-amber-100 text-amber-700', 'bg-rose-100 text-rose-700'];

  const revenueTotal = report?.revenueByClass.reduce((s, c) => s + c.total, 0) || 1;

  return (
    <DashboardLayout>
      <div className="space-y-6 print:p-8">
        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
              <FileBarChart className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Financial Reports</h1>
              <p className="text-sm text-slate-500 mt-0.5">Revenue, expenses, and financial analysis</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={fetchReport} className="min-h-[44px]">
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportCSV} className="min-h-[44px] border-emerald-200 text-emerald-700 hover:bg-emerald-50">
              <FileDown className="w-4 h-4 mr-2" />Export CSV
            </Button>
            <Button variant="outline" size="sm" onClick={handlePrint} className="min-h-[44px]">
              <Printer className="w-4 h-4 mr-2" />Print
            </Button>
          </div>
        </div>

        {/* Print header */}
        <div className="hidden print:block text-center mb-6">
          <h1 className="text-xl font-bold">
            Financial Reports — {reportType.charAt(0).toUpperCase() + reportType.slice(1)} | {year} {term ? `| ${term}` : ''}
            {startDate && endDate ? ` | ${startDate} to ${endDate}` : ''}
          </h1>
          <p className="text-sm text-slate-500">Generated on {new Date().toLocaleDateString()}</p>
        </div>

        {/* ── Report Type Tiles (CI3 parity) ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 print:hidden">
          {reportTiles.map((tile) => {
            const Icon = tile.icon;
            const active = reportType === tile.type;
            return (
              <button
                key={tile.type}
                onClick={() => {
                  setReportType(tile.type);
                }}
                className={`relative group rounded-xl p-4 text-left transition-all duration-200 border-2 overflow-hidden ${
                  active
                    ? 'border-emerald-500 bg-white shadow-md'
                    : 'border-transparent bg-slate-50 hover:bg-white hover:shadow-sm'
                }`}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${tile.color} opacity-0 group-hover:opacity-5 transition-opacity`} />
                <div className="flex items-center gap-3 relative">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    active ? `bg-gradient-to-br ${tile.color}` : 'bg-slate-200'
                  }`}>
                    <Icon className={`w-5 h-5 ${active ? 'text-white' : 'text-slate-500'}`} />
                  </div>
                  <div>
                    <p className={`font-semibold text-sm ${active ? 'text-slate-900' : 'text-slate-600'}`}>{tile.label}</p>
                    <p className="text-xs text-slate-400">{tile.description}</p>
                  </div>
                  {active && (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 ml-auto flex-shrink-0" />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* ── Filters (CI3 parity: dynamic based on report type) ── */}
        <Card className="print:hidden border-slate-200/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 className="w-4 h-4 text-slate-400" />
              <span className="text-sm font-medium text-slate-700">Report Filters</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {/* Year (always shown for annual/termly) */}
              {(reportType === 'annual' || reportType === 'termly') && (
                <div>
                  <label className="text-xs font-medium text-slate-500 mb-1 block">Academic Year</label>
                  <Select value={year} onValueChange={setYear}>
                    <SelectTrigger className="min-h-[44px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {years.map((y) => (
                        <SelectItem key={y} value={y}>{y}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Term (termly only) */}
              {reportType === 'termly' && (
                <div>
                  <label className="text-xs font-medium text-slate-500 mb-1 block">Term</label>
                  <Select value={term} onValueChange={setTerm}>
                    <SelectTrigger className="min-h-[44px]"><SelectValue placeholder="Select Term" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Term 1">Term 1</SelectItem>
                      <SelectItem value="Term 2">Term 2</SelectItem>
                      <SelectItem value="Term 3">Term 3</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Date Range (daterange only) */}
              {reportType === 'daterange' && (
                <>
                  <div>
                    <label className="text-xs font-medium text-slate-500 mb-1 block">Start Date</label>
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="min-h-[44px]"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500 mb-1 block">End Date</label>
                    <Input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="min-h-[44px]"
                    />
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* ── 6 Summary Metric Cards (CI3 parity) ── */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}><CardContent className="p-4"><Skeleton className="h-20 w-full" /></CardContent></Card>
            ))
          ) : (
            <>
              {/* Total Revenue */}
              <Card className="border-l-4 border-l-emerald-500 hover:shadow-md transition-all hover:-translate-y-0.5">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center">
                      <TrendingUp className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-[10px] text-slate-400">{report?.incomeExpense.incomeTransactions || 0} txns</span>
                  </div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">Total Revenue</p>
                  <p className="text-sm sm:text-base font-bold text-emerald-700 tabular-nums">{formatCurrency(report?.incomeExpense.totalIncome || 0)}</p>
                </CardContent>
              </Card>

              {/* Total Expenditure */}
              <Card className="border-l-4 border-l-red-400 hover:shadow-md transition-all hover:-translate-y-0.5">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-8 h-8 rounded-lg bg-red-500 flex items-center justify-center">
                      <TrendingDown className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-[10px] text-slate-400">{report?.incomeExpense.expenseTransactions || 0} txns</span>
                  </div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">Expenditure</p>
                  <p className="text-sm sm:text-base font-bold text-red-600 tabular-nums">{formatCurrency(report?.incomeExpense.totalExpense || 0)}</p>
                </CardContent>
              </Card>

              {/* Net Income */}
              <Card className={`border-l-4 hover:shadow-md transition-all hover:-translate-y-0.5 ${
                (report?.incomeExpense.netIncome || 0) >= 0 ? 'border-l-emerald-500' : 'border-l-red-400'
              }`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      (report?.incomeExpense.netIncome || 0) >= 0 ? 'bg-emerald-500' : 'bg-red-500'
                    }`}>
                      <DollarSign className="w-4 h-4 text-white" />
                    </div>
                    <Badge variant="outline" className={`text-[10px] px-1.5 ${
                      (report?.incomeExpense.netIncome || 0) >= 0
                        ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                        : 'bg-red-100 text-red-700 border-red-200'
                    }`}>
                      {(report?.incomeExpense.netIncome || 0) >= 0 ? 'Profit' : 'Loss'}
                    </Badge>
                  </div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">Net Income</p>
                  <p className={`text-sm sm:text-base font-bold tabular-nums ${
                    (report?.incomeExpense.netIncome || 0) >= 0 ? 'text-emerald-700' : 'text-red-600'
                  }`}>
                    {formatCurrency(report?.incomeExpense.netIncome || 0)}
                  </p>
                </CardContent>
              </Card>

              {/* Collection Efficiency */}
              <Card className="border-l-4 border-l-sky-500 hover:shadow-md transition-all hover:-translate-y-0.5">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-8 h-8 rounded-lg bg-sky-500 flex items-center justify-center">
                      <Target className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">Collection Rate</p>
                  <p className="text-sm sm:text-base font-bold text-sky-700 tabular-nums">{report?.collectionEfficiency.rate || 0}%</p>
                  <div className="w-full bg-sky-100 rounded-full h-1.5 mt-2">
                    <div
                      className="bg-sky-500 h-1.5 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, report?.collectionEfficiency.rate || 0)}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">{report?.collectionEfficiency.studentsPaid || 0} / {report?.collectionEfficiency.totalStudents || 0} invoices</p>
                </CardContent>
              </Card>

              {/* Outstanding */}
              <Card className="border-l-4 border-l-amber-500 hover:shadow-md transition-all hover:-translate-y-0.5">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center">
                      <AlertCircle className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-[10px] text-slate-400">Pending</span>
                  </div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">Outstanding</p>
                  <p className="text-sm sm:text-base font-bold text-amber-600 tabular-nums">{formatCurrency(report?.totalOutstanding || 0)}</p>
                  <p className="text-[10px] text-slate-400 mt-1">{formatCurrency(report?.collectionEfficiency.totalInvoiced || 0)} invoiced</p>
                </CardContent>
              </Card>

              {/* Cash Position */}
              <Card className="border-l-4 border-l-violet-500 hover:shadow-md transition-all hover:-translate-y-0.5">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-8 h-8 rounded-lg bg-violet-500 flex items-center justify-center">
                      <Building2 className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-[10px] text-slate-400">Live</span>
                  </div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">Cash Position</p>
                  <p className="text-sm sm:text-base font-bold text-violet-700 tabular-nums">{formatCurrency(report?.cashPosition || 0)}</p>
                  <p className="text-[10px] text-slate-400 mt-1">Bank accounts</p>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* ── Tabs ── */}
        <Tabs defaultValue="charts" className="space-y-4 print:hidden">
          <TabsList className="bg-white border border-slate-200 p-1 rounded-xl h-auto flex w-full sm:w-auto">
            <TabsTrigger value="charts" className="flex-1 min-w-[100px] data-[state=active]:bg-emerald-600 data-[state=active]:text-white rounded-lg py-2 text-sm gap-1.5">
              <BarChart3 className="w-3.5 h-3.5" />Charts
            </TabsTrigger>
            <TabsTrigger value="collectors" className="flex-1 min-w-[100px] data-[state=active]:bg-emerald-600 data-[state=active]:text-white rounded-lg py-2 text-sm gap-1.5">
              <Trophy className="w-3.5 h-3.5" />Collectors
            </TabsTrigger>
            <TabsTrigger value="outstanding" className="flex-1 min-w-[100px] data-[state=active]:bg-emerald-600 data-[state=active]:text-white rounded-lg py-2 text-sm gap-1.5">
              <AlertCircle className="w-3.5 h-3.5" />Outstanding
            </TabsTrigger>
            <TabsTrigger value="byclass" className="flex-1 min-w-[100px] data-[state=active]:bg-emerald-600 data-[state=active]:text-white rounded-lg py-2 text-sm gap-1.5">
              <Users className="w-3.5 h-3.5" />By Class
            </TabsTrigger>
          </TabsList>

          {/* ═══ Charts Tab ═══ */}
          <TabsContent value="charts" className="space-y-4">
            {/* ── Row 1: Income vs Expense Trend (full width) ── */}
            <Card className="border-slate-200/60">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  Revenue vs Expenses Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-[300px] w-full" />
                ) : (report?.incomeExpenseTrend || []).length === 0 ? (
                  <div className="h-[300px] flex flex-col items-center justify-center text-slate-400">
                    <BarChart3 className="w-10 h-10 mb-2 opacity-40" />
                    <p className="text-sm">No data available for the selected period</p>
                  </div>
                ) : (
                  <ChartContainer config={trendChartConfig} className="h-[300px] w-full">
                    <BarChart data={report?.incomeExpenseTrend || []} margin={{ top: 5, right: 20, left: 10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => {
                        if (v >= 1000000) return `${(v / 1000000).toFixed(1)}M`;
                        if (v >= 1000) return `${(v / 1000).toFixed(0)}K`;
                        return String(v);
                      }} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="income" fill="var(--color-income)" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="expense" fill="var(--color-expense)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ChartContainer>
                )}
              </CardContent>
            </Card>

            {/* ── Row 2: Fee Type + Payment Methods ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Fee Type Breakdown (CI3: Revenue by Fee Type donut) */}
              <Card className="border-slate-200/60">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-emerald-600" />
                    Revenue by Fee Type
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <Skeleton className="h-[250px] w-full" />
                  ) : feeTypePieData.length === 0 ? (
                    <div className="h-[250px] flex flex-col items-center justify-center text-slate-400">
                      <Wallet className="w-10 h-10 mb-2 opacity-40" />
                      <p className="text-sm">No daily fee data</p>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row items-center gap-4">
                      <ChartContainer config={feeTypeConfig} className="h-[180px] w-[180px]">
                        <PieChart>
                          <Pie data={feeTypePieData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value" paddingAngle={2}>
                            {feeTypePieData.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                            ))}
                          </Pie>
                          <ChartTooltip content={<ChartTooltipContent />} />
                        </PieChart>
                      </ChartContainer>
                      <div className="flex-1 space-y-2">
                        {report?.feeTypeBreakdown.map((f, i) => (
                          <div key={f.type} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: f.color }} />
                              <span className="text-slate-600">{f.type}</span>
                            </div>
                            <span className="font-mono font-medium">{formatCurrency(f.total)}</span>
                          </div>
                        ))}
                        <div className="border-t pt-1 mt-1 flex justify-between">
                          <span className="text-xs font-medium text-slate-500">Total</span>
                          <span className="font-mono font-semibold text-emerald-700 text-sm">{formatCurrency(report?.dailyFeeSummary.total || 0)}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Payment Methods (CI3: horizontal bar) */}
              <Card className="border-slate-200/60">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-emerald-600" />
                    Payment Methods
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <Skeleton className="h-[250px] w-full" />
                  ) : paymentBarData.length === 0 ? (
                    <div className="h-[250px] flex flex-col items-center justify-center text-slate-400">
                      <CreditCard className="w-10 h-10 mb-2 opacity-40" />
                      <p className="text-sm">No payment data</p>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row items-center gap-4">
                      <ChartContainer config={paymentMethodConfig} className="h-[180px] w-[180px]">
                        <PieChart>
                          <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value" paddingAngle={2}>
                            {pieData.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                            ))}
                          </Pie>
                          <ChartTooltip content={<ChartTooltipContent />} />
                        </PieChart>
                      </ChartContainer>
                      <div className="flex-1 space-y-1.5">
                        {report?.methodDistribution.map((m, i) => (
                          <div key={m.method} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: pieColors[i % pieColors.length] }} />
                              <span className="text-slate-600">{m.method.charAt(0).toUpperCase() + m.method.slice(1)}</span>
                            </div>
                            <div className="text-right">
                              <span className="font-mono font-medium">{formatCurrency(m.amount)}</span>
                              <span className="text-xs text-slate-400 ml-1">({m.count})</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* ── Row 3: Collection Trend + Invoice Status ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Collection Trend (CI3: Revenue Trends area chart → line chart) */}
              <Card className="border-slate-200/60">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                    Collection Trend
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <Skeleton className="h-[250px] w-full" />
                  ) : (report?.incomeExpenseTrend || []).length === 0 ? (
                    <div className="h-[250px] flex flex-col items-center justify-center text-slate-400">
                      <TrendingUp className="w-10 h-10 mb-2 opacity-40" />
                      <p className="text-sm">No data available</p>
                    </div>
                  ) : (
                    <ChartContainer config={trendChartConfig} className="h-[250px] w-full">
                      <LineChart data={report?.incomeExpenseTrend || []} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => {
                          if (v >= 1000000) return `${(v / 1000000).toFixed(1)}M`;
                          if (v >= 1000) return `${(v / 1000).toFixed(0)}K`;
                          return String(v);
                        }} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Line type="monotone" dataKey="income" stroke="var(--color-income)" strokeWidth={2} dot={{ r: 4 }} />
                        <Line type="monotone" dataKey="expense" stroke="var(--color-expense)" strokeWidth={2} dot={{ r: 4 }} />
                      </LineChart>
                    </ChartContainer>
                  )}
                </CardContent>
              </Card>

              {/* Invoice Status Summary */}
              <Card className="border-slate-200/60">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-emerald-600" />
                    Invoice Status Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <Skeleton className="h-32 w-full" />
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {report?.invoiceStatusCounts.map((isc) => {
                        const cfg = invoiceStatusConfig[isc.status] || invoiceStatusConfig.unpaid;
                        return (
                          <div key={isc.status} className="flex items-center gap-3 bg-slate-50 rounded-lg p-3 min-h-[52px]">
                            <Badge variant="outline" className={cfg.color}>{cfg.label}</Badge>
                            <span className="text-lg font-bold">{isc.count}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Daily Fee Summary */}
                  {!loading && report?.dailyFeeSummary && (
                    <div className="mt-4 space-y-2">
                      <div className="flex justify-between items-center bg-emerald-50 rounded-lg p-2.5 min-h-[44px]">
                        <span className="text-sm font-medium text-emerald-700">Total Daily Fees</span>
                        <span className="font-mono font-bold text-emerald-700">{formatCurrency(report.dailyFeeSummary.total || 0)}</span>
                      </div>
                      <div className="grid grid-cols-5 gap-1.5">
                        {[
                          { label: 'Feeding', value: report.dailyFeeSummary.feeding },
                          { label: 'Breakfast', value: report.dailyFeeSummary.breakfast },
                          { label: 'Classes', value: report.dailyFeeSummary.classes },
                          { label: 'Water', value: report.dailyFeeSummary.water },
                          { label: 'Transport', value: report.dailyFeeSummary.transport },
                        ].map((item) => (
                          <div key={item.label} className="bg-slate-50 rounded p-1.5 text-center min-h-[44px] flex flex-col items-center justify-center">
                            <p className="text-[10px] text-slate-400">{item.label}</p>
                            <p className="text-[11px] font-mono font-semibold">{formatCurrency(item.value)}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ═══ Top Collectors Tab (CI3 parity) ═══ */}
          <TabsContent value="collectors" className="space-y-4">
            <Card className="border-slate-200/60">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-emerald-600" />
                  Top Collectors
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
                ) : !report?.topCollectors || report.topCollectors.length === 0 ? (
                  <div className="text-center py-12 text-slate-400">
                    <Trophy className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <p>No collection data available</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {report.topCollectors.map((collector, index) => (
                      <div
                        key={collector.name}
                        className={`flex items-center justify-between p-4 rounded-xl ${
                          index === 0 ? 'bg-gradient-to-r from-emerald-50 to-emerald-100' :
                          index === 1 ? 'bg-gradient-to-r from-sky-50 to-sky-100' :
                          index === 2 ? 'bg-gradient-to-r from-violet-50 to-violet-100' :
                          'bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                            index === 0 ? 'bg-emerald-500' :
                            index === 1 ? 'bg-sky-500' :
                            index === 2 ? 'bg-violet-500' :
                            'bg-slate-400'
                          }`}>
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800 text-sm">{collector.name}</p>
                            <p className="text-xs text-slate-500">{collector.transactions} transactions</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-mono font-bold text-slate-800">{formatCurrency(collector.total)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══ Outstanding by Class Tab ═══ */}
          <TabsContent value="outstanding" className="space-y-4">
            <Card className="border-slate-200/60">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-emerald-600" />
                  Outstanding Fees by Class
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {loading ? (
                  <div className="p-4 space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
                ) : !report?.outstandingByClass || report.outstandingByClass.length === 0 ? (
                  <div className="text-center py-12 text-slate-400">
                    <DollarSign className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <p>No outstanding fees</p>
                  </div>
                ) : (
                  <>
                    {/* Desktop */}
                    <div className="hidden md:block max-h-96 overflow-y-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-slate-50">
                            <TableHead className="text-xs font-semibold">#</TableHead>
                            <TableHead className="text-xs font-semibold">Class</TableHead>
                            <TableHead className="text-xs font-semibold text-right">Outstanding Amount</TableHead>
                            <TableHead className="text-xs font-semibold w-48">% of Total</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {report.outstandingByClass.map((cls, i) => {
                            const pct = ((cls.amount / (report.totalOutstanding || 1)) * 100).toFixed(1);
                            return (
                              <TableRow key={i} className="hover:bg-slate-50/50">
                                <TableCell className="text-xs text-slate-400">{i + 1}</TableCell>
                                <TableCell className="font-medium text-sm">{cls.class || 'Unknown'}</TableCell>
                                <TableCell className="text-right font-mono text-sm font-medium text-red-600">{formatCurrency(cls.amount)}</TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                      <div className="h-full bg-red-500 rounded-full" style={{ width: `${Math.min(100, parseFloat(pct))}%` }} />
                                    </div>
                                    <span className="text-xs text-slate-500 w-10 text-right">{pct}%</span>
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                    {/* Mobile */}
                    <div className="md:hidden divide-y max-h-96 overflow-y-auto">
                      {report.outstandingByClass.map((cls, i) => (
                        <div key={i} className="p-4 flex items-center justify-between min-h-[52px]">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0">
                              <DollarSign className="w-4 h-4 text-red-500" />
                            </div>
                            <p className="font-medium text-sm">{cls.class || 'Unknown'}</p>
                          </div>
                          <span className="font-mono font-bold text-red-600 text-sm">{formatCurrency(cls.amount)}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══ Revenue by Class Tab (CI3 parity) ═══ */}
          <TabsContent value="byclass" className="space-y-4">
            <Card className="border-slate-200/60">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-600" />
                  Revenue by Class
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
                ) : !report?.revenueByClass || report.revenueByClass.length === 0 ? (
                  <div className="text-center py-12 text-slate-400">
                    <Users className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <p>No revenue data by class</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {report.revenueByClass.map((cls, index) => {
                      const pct = ((cls.total / revenueTotal) * 100).toFixed(1);
                      return (
                        <div key={cls.class_name} className="p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-400 w-5">{index + 1}.</span>
                              <span className="font-semibold text-slate-700 text-sm">{cls.class_name}</span>
                            </div>
                            <span className="font-mono font-bold text-slate-800 text-sm">{formatCurrency(cls.total)}</span>
                          </div>
                          <div className="w-full bg-slate-200 rounded-full h-1.5">
                            <div
                              className="h-1.5 rounded-full transition-all duration-500"
                              style={{
                                width: `${Math.min(100, parseFloat(pct))}%`,
                                backgroundColor: pieColors[index % pieColors.length],
                              }}
                            />
                          </div>
                          <p className="text-[10px] text-slate-400 mt-1 text-right">{pct}% of total revenue</p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
