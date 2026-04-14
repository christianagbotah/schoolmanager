'use client';

import { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  Bar,
  BarChart,
  Line,
  LineChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
} from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  AlertCircle,
  FileDown,
  BarChart3,
  PieChartIcon,
  Clock,
  Users,
} from 'lucide-react';

interface FinanceReport {
  incomeExpense: {
    totalIncome: number;
    totalExpense: number;
    netIncome: number;
  };
  incomeExpenseTrend: { month: string; income: number; expense: number }[];
  outstandingByClass: { class: string; amount: number }[];
  methodDistribution: { method: string; amount: number; count: number }[];
  dailyFeeSummary: {
    total: number;
    feeding: number;
    breakfast: number;
    classes: number;
    water: number;
    transport: number;
  };
  invoiceStatusCounts: { status: string; count: number }[];
}

interface AgingReport {
  current: number;
  days30: number;
  days60: number;
  days90Plus: number;
  total: number;
  items: { studentName: string; studentCode: string; amount: number; days: number }[];
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-UG', { style: 'currency', currency: 'UGX', minimumFractionDigits: 0 }).format(amount);
}

const barChartConfig = {
  income: { label: 'Income', color: '#059669' },
  expense: { label: 'Expense', color: '#dc2626' },
} satisfies ChartConfig;

const lineChartConfig = {
  income: { label: 'Income', color: '#059669' },
  expense: { label: 'Expense', color: '#dc2626' },
} satisfies ChartConfig;

const pieColors = ['#059669', '#7c3aed', '#2563eb', '#d97706', '#dc2626', '#0891b2', '#4f46e5', '#db2777'];

export default function FinanceReportsPage() {
  const [year, setYear] = useState('2026');
  const [term, setTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<FinanceReport | null>(null);

  const [agingLoading, setAgingLoading] = useState(true);
  const [aging, setAging] = useState<AgingReport | null>(null);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ year });
      if (term) params.set('term', term);
      const res = await fetch(`/api/reports/finance?${params}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setReport(data);
    } catch {
      toast.error('Failed to load financial report');
    } finally {
      setLoading(false);
    }
  }, [year, term]);

  const fetchAging = useCallback(async () => {
    setAgingLoading(true);
    try {
      const res = await fetch('/api/reports/aging');
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setAging(data);
    } catch {
      toast.error('Failed to load aging report');
    } finally {
      setAgingLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReport();
    fetchAging();
  }, [fetchReport, fetchAging]);

  const handleExportCSV = () => {
    if (!report) return;
    const headers = ['Metric', 'Value'];
    const rows = [
      ['Total Revenue', report.incomeExpense.totalIncome],
      ['Total Expenses', report.incomeExpense.totalExpense],
      ['Net Income', report.incomeExpense.netIncome],
      ['', ''],
      ['Outstanding by Class', ''],
      ...report.outstandingByClass.map((o) => [o.class, o.amount]),
    ];
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `finance-report-${year}-${term || 'all'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Report exported');
  };

  const handleExportAgingCSV = () => {
    if (!aging) return;
    const headers = ['Student', 'Code', 'Outstanding Amount', 'Days'];
    const rows = aging.items.map((i) => [i.studentName, i.studentCode, i.amount, i.days]);
    const summaryRows = [['', '', '', ''], ['Current (0-30 days)', aging.current], ['31-60 days', aging.days30], ['61-90 days', aging.days60], ['90+ days', aging.days90Plus], ['Total', aging.total]];
    const csv = [headers, ...rows, ...summaryRows].map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aging-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Aging report exported');
  };

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

  const invoiceStatusConfig: Record<string, { label: string; color: string }> = {
    paid: { label: 'Paid', color: 'bg-emerald-100 text-emerald-700' },
    partial: { label: 'Partial', color: 'bg-amber-100 text-amber-700' },
    unpaid: { label: 'Unpaid', color: 'bg-gray-100 text-gray-600' },
    overdue: { label: 'Overdue', color: 'bg-red-100 text-red-700' },
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Financial Reports</h1>
            <p className="text-sm text-slate-500 mt-1">Revenue, expenses, and financial analysis</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExportAgingCSV} className="border-emerald-200 text-emerald-700 hover:bg-emerald-50">
              <FileDown className="w-4 h-4 mr-2" />Aging CSV
            </Button>
            <Button variant="outline" onClick={handleExportCSV} className="border-emerald-200 text-emerald-700 hover:bg-emerald-50">
              <FileDown className="w-4 h-4 mr-2" />Export Report
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <TrendingUp className="w-4 h-4" />
                Filters:
              </div>
              <div className="flex gap-3">
                <Select value={year} onValueChange={setYear}>
                  <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2026">2026</SelectItem>
                    <SelectItem value="2025">2025</SelectItem>
                    <SelectItem value="2024">2024</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={term} onValueChange={(v) => setTerm(v === '__all__' ? '' : v)}>
                  <SelectTrigger className="w-32"><SelectValue placeholder="All Terms" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">All Terms</SelectItem>
                    <SelectItem value="Term 1">Term 1</SelectItem>
                    <SelectItem value="Term 2">Term 2</SelectItem>
                    <SelectItem value="Term 3">Term 3</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}><CardContent className="p-4"><Skeleton className="h-16 w-full" /></CardContent></Card>
            ))
          ) : (
            <>
              <Card className="border-emerald-100">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wide">Total Revenue</p>
                      <p className="text-base sm:text-lg font-bold text-emerald-700">{formatCurrency(report?.incomeExpense.totalIncome || 0)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-red-100">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                      <TrendingDown className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wide">Total Expenses</p>
                      <p className="text-base sm:text-lg font-bold text-red-600">{formatCurrency(report?.incomeExpense.totalExpense || 0)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-emerald-100">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wide">Net Income</p>
                      <p className={`text-base sm:text-lg font-bold ${(report?.incomeExpense.netIncome || 0) >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                        {formatCurrency(report?.incomeExpense.netIncome || 0)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-amber-100">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                      <AlertCircle className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wide">Outstanding Fees</p>
                      <p className="text-base sm:text-lg font-bold text-amber-600">{formatCurrency(aging?.total || 0)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        <Tabs defaultValue="charts" className="space-y-4">
          <TabsList>
            <TabsTrigger value="charts" className="gap-1.5">
              <BarChart3 className="w-3.5 h-3.5" />
              Charts
            </TabsTrigger>
            <TabsTrigger value="aging" className="gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              Aging Report
            </TabsTrigger>
            <TabsTrigger value="outstanding" className="gap-1.5">
              <Users className="w-3.5 h-3.5" />
              Outstanding
            </TabsTrigger>
          </TabsList>

          {/* Charts Tab */}
          <TabsContent value="charts" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Revenue vs Expenses Bar Chart */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-emerald-600" />
                    Revenue vs Expenses
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <Skeleton className="h-[250px] w-full" />
                  ) : (report?.incomeExpenseTrend || []).length === 0 ? (
                    <div className="h-[250px] flex items-center justify-center text-slate-400 text-sm">No data available</div>
                  ) : (
                    <ChartContainer config={barChartConfig} className="h-[250px] w-full">
                      <BarChart data={report?.incomeExpenseTrend || []} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="income" fill="var(--color-income)" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="expense" fill="var(--color-expense)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ChartContainer>
                  )}
                </CardContent>
              </Card>

              {/* Payment Methods Pie Chart */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <PieChartIcon className="w-4 h-4 text-emerald-600" />
                    Payment Methods
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <Skeleton className="h-[250px] w-full" />
                  ) : pieData.length === 0 ? (
                    <div className="h-[250px] flex items-center justify-center text-slate-400 text-sm">No data available</div>
                  ) : (
                    <div className="flex flex-col sm:flex-row items-center gap-4">
                      <ChartContainer config={pieConfig} className="h-[200px] w-[200px]">
                        <PieChart>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={80}
                            dataKey="value"
                            paddingAngle={2}
                          >
                            {pieData.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                            ))}
                          </Pie>
                          <ChartTooltip content={<ChartTooltipContent />} />
                        </PieChart>
                      </ChartContainer>
                      <div className="flex-1 space-y-1.5">
                        {pieData.map((d, i) => (
                          <div key={d.name} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: pieColors[i % pieColors.length] }} />
                              <span className="text-slate-600">{d.name}</span>
                            </div>
                            <div className="text-right">
                              <span className="font-mono font-medium">{formatCurrency(d.value)}</span>
                              <span className="text-xs text-slate-400 ml-1">({d.count})</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Collection Trend Line Chart */}
              <Card className="lg:col-span-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                    Collection Trend (6 Months)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <Skeleton className="h-[250px] w-full" />
                  ) : (report?.incomeExpenseTrend || []).length === 0 ? (
                    <div className="h-[250px] flex items-center justify-center text-slate-400 text-sm">No data available</div>
                  ) : (
                    <ChartContainer config={lineChartConfig} className="h-[250px] w-full">
                      <LineChart data={report?.incomeExpenseTrend || []} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Line type="monotone" dataKey="income" stroke="var(--color-income)" strokeWidth={2} dot={{ r: 4 }} />
                        <Line type="monotone" dataKey="expense" stroke="var(--color-expense)" strokeWidth={2} dot={{ r: 4 }} />
                      </LineChart>
                    </ChartContainer>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Invoice Status & Daily Fee Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Invoice Status */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Invoice Status Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <Skeleton className="h-32 w-full" />
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {report?.invoiceStatusCounts.map((isc) => {
                        const cfg = invoiceStatusConfig[isc.status] || invoiceStatusConfig.unpaid;
                        return (
                          <div key={isc.status} className="flex items-center gap-3 bg-slate-50 rounded-lg p-3">
                            <Badge variant="outline" className={cfg.color}>{cfg.label}</Badge>
                            <span className="text-lg font-bold">{isc.count}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Daily Fee Summary */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Daily Fee Collections ({year})</CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <Skeleton className="h-32 w-full" />
                  ) : (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center bg-emerald-50 rounded-lg p-2.5">
                        <span className="text-sm font-medium text-emerald-700">Total Daily Fees</span>
                        <span className="font-mono font-bold text-emerald-700">{formatCurrency(report?.dailyFeeSummary.total || 0)}</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                        {[
                          { label: 'Feeding', value: report?.dailyFeeSummary.feeding || 0, color: 'text-orange-600' },
                          { label: 'Breakfast', value: report?.dailyFeeSummary.breakfast || 0, color: 'text-amber-600' },
                          { label: 'Classes', value: report?.dailyFeeSummary.classes || 0, color: 'text-emerald-600' },
                          { label: 'Water', value: report?.dailyFeeSummary.water || 0, color: 'text-sky-600' },
                          { label: 'Transport', value: report?.dailyFeeSummary.transport || 0, color: 'text-violet-600' },
                        ].map((item) => (
                          <div key={item.label} className="bg-slate-50 rounded p-2 text-center">
                            <p className="text-[10px] text-slate-400">{item.label}</p>
                            <p className={`text-xs font-mono font-semibold ${item.color}`}>{formatCurrency(item.value)}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Aging Report Tab */}
          <TabsContent value="aging" className="space-y-4">
            {/* Aging Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {agingLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <Card key={i}><CardContent className="p-3"><Skeleton className="h-14 w-full" /></CardContent></Card>
                ))
              ) : (
                <>
                  <Card>
                    <CardContent className="p-3 text-center">
                      <p className="text-[10px] text-slate-400 uppercase tracking-wide">Current</p>
                      <p className="text-sm font-bold text-emerald-700 font-mono">{formatCurrency(aging?.current || 0)}</p>
                      <p className="text-[10px] text-slate-400">0-30 days</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-3 text-center">
                      <p className="text-[10px] text-slate-400 uppercase tracking-wide">31-60</p>
                      <p className="text-sm font-bold text-amber-600 font-mono">{formatCurrency(aging?.days30 || 0)}</p>
                      <p className="text-[10px] text-slate-400">days</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-3 text-center">
                      <p className="text-[10px] text-slate-400 uppercase tracking-wide">61-90</p>
                      <p className="text-sm font-bold text-orange-600 font-mono">{formatCurrency(aging?.days60 || 0)}</p>
                      <p className="text-[10px] text-slate-400">days</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-3 text-center">
                      <p className="text-[10px] text-slate-400 uppercase tracking-wide">90+</p>
                      <p className="text-sm font-bold text-red-600 font-mono">{formatCurrency(aging?.days90Plus || 0)}</p>
                      <p className="text-[10px] text-slate-400">days</p>
                    </CardContent>
                  </Card>
                  <Card className="border-emerald-200">
                    <CardContent className="p-3 text-center">
                      <p className="text-[10px] text-slate-400 uppercase tracking-wide">Total</p>
                      <p className="text-sm font-bold text-emerald-700 font-mono">{formatCurrency(aging?.total || 0)}</p>
                      <p className="text-[10px] text-slate-400">{aging?.items.length || 0} invoices</p>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>

            {/* Aging Table */}
            <Card>
              <CardContent className="p-0">
                {/* Desktop */}
                <div className="hidden md:block">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50">
                        <TableHead className="text-xs font-semibold">#</TableHead>
                        <TableHead className="text-xs font-semibold">Student</TableHead>
                        <TableHead className="text-xs font-semibold">Code</TableHead>
                        <TableHead className="text-xs font-semibold text-right">Outstanding</TableHead>
                        <TableHead className="text-xs font-semibold text-right">Days</TableHead>
                        <TableHead className="text-xs font-semibold">Aging</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {agingLoading ? (
                        Array.from({ length: 5 }).map((_, i) => (
                          <TableRow key={i}>
                            {Array.from({ length: 6 }).map((_, j) => (
                              <TableCell key={j}><Skeleton className="h-4 w-16" /></TableCell>
                            ))}
                          </TableRow>
                        ))
                      ) : !aging?.items || aging.items.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-12 text-slate-400">
                            <Clock className="w-10 h-10 mx-auto mb-2 opacity-50" />
                            <p>No overdue invoices</p>
                          </TableCell>
                        </TableRow>
                      ) : (
                        aging.items.slice(0, 50).map((item, i) => (
                          <TableRow key={i} className="hover:bg-slate-50/50">
                            <TableCell className="text-xs text-slate-400">{i + 1}</TableCell>
                            <TableCell className="font-medium text-sm">{item.studentName}</TableCell>
                            <TableCell className="text-xs font-mono text-slate-500">{item.studentCode}</TableCell>
                            <TableCell className="text-right font-mono text-sm font-medium text-red-600">{formatCurrency(item.amount)}</TableCell>
                            <TableCell className="text-right font-mono text-sm">{item.days}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className={
                                item.days <= 30 ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                                item.days <= 60 ? 'bg-amber-100 text-amber-700 border-amber-200' :
                                item.days <= 90 ? 'bg-orange-100 text-orange-700 border-orange-200' :
                                'bg-red-100 text-red-700 border-red-200'
                              }>
                                {item.days <= 30 ? 'Current' : item.days <= 60 ? '31-60' : item.days <= 90 ? '61-90' : '90+'}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile */}
                <div className="md:hidden divide-y max-h-96 overflow-y-auto">
                  {agingLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="p-3"><Skeleton className="h-4 w-3/4" /></div>
                    ))
                  ) : !aging?.items || aging.items.length === 0 ? (
                    <div className="text-center py-12 text-slate-400">
                      <Clock className="w-10 h-10 mx-auto mb-2 opacity-50" />
                      <p>No overdue invoices</p>
                    </div>
                  ) : (
                    aging.items.slice(0, 30).map((item, i) => (
                      <div key={i} className="p-3 flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">{item.studentName}</p>
                          <p className="text-xs text-slate-400">{item.studentCode} &middot; {item.days} days</p>
                        </div>
                        <div className="text-right">
                          <p className="font-mono font-bold text-red-600 text-sm">{formatCurrency(item.amount)}</p>
                          <Badge variant="outline" className={
                            item.days <= 30 ? 'bg-emerald-100 text-emerald-700 border-emerald-200 text-[10px]' :
                            item.days <= 60 ? 'bg-amber-100 text-amber-700 border-amber-200 text-[10px]' :
                            'bg-red-100 text-red-700 border-red-200 text-[10px]'
                          }>
                            {item.days <= 30 ? 'Current' : item.days <= 60 ? '31-60' : '90+'}
                          </Badge>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Outstanding by Class Tab */}
          <TabsContent value="outstanding" className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-600" />
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
                  <div className="hidden md:block">
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
                          const pct = ((cls.amount / (aging?.total || 1)) * 100).toFixed(1);
                          return (
                            <TableRow key={i} className="hover:bg-slate-50/50">
                              <TableCell className="text-xs text-slate-400">{i + 1}</TableCell>
                              <TableCell className="font-medium text-sm">{cls.class || 'Unknown'}</TableCell>
                              <TableCell className="text-right font-mono text-sm font-medium text-red-600">{formatCurrency(cls.amount)}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-red-500 rounded-full"
                                      style={{ width: `${Math.min(100, parseFloat(pct))}%` }}
                                    />
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
                )}
                {/* Mobile version */}
                {!loading && report?.outstandingByClass && report.outstandingByClass.length > 0 && (
                  <div className="md:hidden divide-y">
                    {report.outstandingByClass.map((cls, i) => (
                      <div key={i} className="p-3 flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">{cls.class || 'Unknown'}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-mono font-bold text-red-600">{formatCurrency(cls.amount)}</p>
                        </div>
                      </div>
                    ))}
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
