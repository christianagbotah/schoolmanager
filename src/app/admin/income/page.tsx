'use client';

import { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import {
  TrendingUp, DollarSign, CreditCard, Receipt, FileText, AlertCircle,
  Users, ChevronLeft, ChevronRight, Search, Calendar, Eye, ArrowUpRight,
  ArrowDownRight, Wallet, BarChart3, CircleDollarSign,
} from 'lucide-react';
import Link from 'next/link';

// ======== TYPES ========
interface IncomeOverview {
  totalInvoiced: number;
  totalCollected: number;
  totalOutstanding: number;
  todayCollection: number;
  monthCollection: number;
  collectionRate: number;
}

interface InvoiceStats { total: number; paid: number; unpaid: number; partial: number; }
interface PaymentStats { total: number; }
interface MonthlyData { month: number; total: number; }
interface MethodBreakdown { method: string; total: number; }
interface TopDebtor {
  student_id: number; name: string; student_code: string;
  total_owed: number; class_name: string;
}
interface RecentPayment {
  payment_id: number; amount: number; payment_method: string;
  timestamp: string; receipt_code: string;
  student: { name: string; student_code: string };
}
interface ClassBreakdown {
  class_id: number; class_name: string;
  invoice_count: number; total_billed: number;
  total_collected: number; total_outstanding: number;
}

interface Invoice {
  invoice_id: number; student_id: number; title: string; description: string;
  amount: number; amount_paid: number; due: number; discount: number;
  creation_timestamp: string; payment_timestamp: string | null; method: string;
  status: string; year: string; term: string; class_id: number | null;
  invoice_code: string; class_name: string;
  student: { student_id: number; name: string; student_code: string };
}

interface Payment {
  payment_id: number; student_id: number; invoice_id: number | null;
  invoice_code: string; receipt_code: string; title: string;
  amount: number; due: number; payment_type: string; payment_method: string;
  year: string; term: string; timestamp: string; approval_status: string;
  student: { student_id: number; name: string; student_code: string };
}

// ======== HELPERS ========
const monthNames = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function fmt(amount: number) {
  return new Intl.NumberFormat('en-UG', { style: 'currency', currency: 'GHS', minimumFractionDigits: 2 }).format(amount);
}
function fmtDate(d: string) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}
function fmtDateTime(d: string) {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

const statusConfig: Record<string, { label: string; className: string }> = {
  paid: { label: 'Paid', className: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  partial: { label: 'Partial', className: 'bg-amber-100 text-amber-700 border-amber-200' },
  unpaid: { label: 'Unpaid', className: 'bg-red-100 text-red-700 border-red-200' },
};

const methodColors: Record<string, string> = {
  cash: 'bg-emerald-100 text-emerald-700',
  mobile_money: 'bg-violet-100 text-violet-700',
  momo: 'bg-violet-100 text-violet-700',
  bank_transfer: 'bg-sky-100 text-sky-700',
  cheque: 'bg-amber-100 text-amber-700',
  card: 'bg-rose-100 text-rose-700',
};

// ======== MAIN COMPONENT ========
export default function IncomePage() {
  const [activeTab, setActiveTab] = useState('overview');

  // Overview data
  const [overview, setOverview] = useState<IncomeOverview | null>(null);
  const [invoiceStats, setInvoiceStats] = useState<InvoiceStats | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [methodBreakdown, setMethodBreakdown] = useState<MethodBreakdown[]>([]);
  const [topDebtors, setTopDebtors] = useState<TopDebtor[]>([]);
  const [recentPayments, setRecentPayments] = useState<RecentPayment[]>([]);
  const [classBreakdown, setClassBreakdown] = useState<ClassBreakdown[]>([]);
  const [currency, setCurrency] = useState('GHS');
  const [runningYear, setRunningYear] = useState('');
  const [loading, setLoading] = useState(true);

  // Invoices tab
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [invLoading, setInvLoading] = useState(false);
  const [invSearch, setInvSearch] = useState('');
  const [invStatus, setInvStatus] = useState('');
  const [invPage, setInvPage] = useState(1);
  const [invTotalPages, setInvTotalPages] = useState(1);
  const [invTotal, setInvTotal] = useState(0);

  // Payments tab
  const [payments, setPayments] = useState<Payment[]>([]);
  const [payLoading, setPayLoading] = useState(false);
  const [paySearch, setPaySearch] = useState('');
  const [payMethod, setPayMethod] = useState('');
  const [payPage, setPayPage] = useState(1);
  const [payTotalPages, setPayTotalPages] = useState(1);
  const [payTotal, setPayTotal] = useState(0);
  const [paySummary, setPaySummary] = useState({ totalCollected: 0, todayTotal: 0, monthTotal: 0 });

  // Student-specific
  const [studentPayments, setStudentPayments] = useState<Payment[]>([]);
  const [spLoading, setSpLoading] = useState(false);
  const [spStudentId, setSpStudentId] = useState('');
  const [students, setStudents] = useState<any[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(false);

  // ===== FETCH OVERVIEW =====
  const fetchOverview = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/income');
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setOverview(data.overview);
      setInvoiceStats(data.invoiceStats);
      setMonthlyData(data.monthlyData);
      setMethodBreakdown(data.methodBreakdown);
      setTopDebtors(data.topDebtors);
      setRecentPayments(data.recentPayments);
      setClassBreakdown(data.classBreakdown);
      setCurrency(data.currency || 'GHS');
      setRunningYear(data.runningYear || '');
    } catch { toast.error('Failed to load income data'); } finally { setLoading(false); }
  }, []);

  // ===== FETCH INVOICES =====
  const fetchInvoices = useCallback(async () => {
    setInvLoading(true);
    try {
      const params = new URLSearchParams();
      if (invSearch) params.set('search', invSearch);
      if (invStatus) params.set('status', invStatus);
      params.set('page', String(invPage));
      params.set('limit', '15');
      const res = await fetch(`/api/admin/invoices?${params}`);
      const data = await res.json();
      setInvoices(data.invoices || []);
      setInvTotalPages(data.pagination?.totalPages || 1);
      setInvTotal(data.pagination?.total || 0);
    } catch { toast.error('Failed to load invoices'); } finally { setInvLoading(false); }
  }, [invSearch, invStatus, invPage]);

  // ===== FETCH PAYMENTS =====
  const fetchPayments = useCallback(async () => {
    setPayLoading(true);
    try {
      const params = new URLSearchParams();
      if (paySearch) params.set('search', paySearch);
      if (payMethod) params.set('method', payMethod);
      params.set('page', String(payPage));
      params.set('limit', '15');
      const res = await fetch(`/api/admin/payments?${params}`);
      const data = await res.json();
      setPayments(data.payments || []);
      setPayTotalPages(data.pagination?.totalPages || 1);
      setPayTotal(data.pagination?.total || 0);
      setPaySummary(data.summary || { totalCollected: 0, todayTotal: 0, monthTotal: 0 });
    } catch { toast.error('Failed to load payments'); } finally { setPayLoading(false); }
  }, [paySearch, payMethod, payPage]);

  // ===== FETCH STUDENT PAYMENTS =====
  const fetchStudentPayments = useCallback(async () => {
    if (!spStudentId || spStudentId === 'all') {
      setSpLoading(true);
      try {
        const params = new URLSearchParams();
        if (spStudentId === 'all') params.set('limit', '50');
        else params.set('limit', '50');
        const res = await fetch(`/api/admin/payments?${params}`);
        const data = await res.json();
        setStudentPayments(data.payments || []);
      } catch { toast.error('Failed to load payments'); } finally { setSpLoading(false); }
      return;
    }
    setSpLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('search', spStudentId);
      params.set('limit', '50');
      const res = await fetch(`/api/admin/payments?${params}`);
      const data = await res.json();
      setStudentPayments(data.payments || []);
    } catch { toast.error('Failed to load student payments'); } finally { setSpLoading(false); }
  }, [spStudentId]);

  const fetchStudents = useCallback(async () => {
    setStudentsLoading(true);
    try {
      const res = await fetch('/api/students?limit=200');
      const data = await res.json();
      setStudents(data.students || []);
    } catch { /* silent */ } finally { setStudentsLoading(false); }
  }, []);

  // ===== EFFECTS =====
  useEffect(() => { fetchOverview(); fetchStudents(); }, [fetchOverview, fetchStudents]);
  useEffect(() => { if (activeTab === 'invoices') fetchInvoices(); }, [activeTab, fetchInvoices]);
  useEffect(() => { if (activeTab === 'payments') fetchPayments(); }, [activeTab, fetchPayments]);
  useEffect(() => { if (activeTab === 'student-specific') fetchStudentPayments(); }, [activeTab, fetchStudentPayments]);

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => { setInvPage(1); fetchInvoices(); }, 400);
    return () => clearTimeout(t);
  }, [invSearch]);
  useEffect(() => {
    const t = setTimeout(() => { setPayPage(1); fetchPayments(); }, 400);
    return () => clearTimeout(t);
  }, [paySearch]);

  useEffect(() => { setInvPage(1); }, [invStatus]);
  useEffect(() => { setPayPage(1); }, [payMethod]);

  // ===== RENDER ========
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-emerald-600" /> Income & Payments
            </h1>
            <p className="text-sm text-slate-500 mt-1">Track revenue, invoices, and payment history</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild className="border-emerald-200 text-emerald-700 hover:bg-emerald-50">
              <Link href="/admin/invoices"><FileText className="w-4 h-4 mr-2" /> Invoice Management</Link>
            </Button>
            <Button variant="outline" asChild className="border-emerald-200 text-emerald-700 hover:bg-emerald-50">
              <Link href="/admin/payments"><CreditCard className="w-4 h-4 mr-2" /> Payments</Link>
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" className="flex items-center gap-1.5"><BarChart3 className="w-4 h-4" /> Overview</TabsTrigger>
            <TabsTrigger value="invoices" className="flex items-center gap-1.5"><FileText className="w-4 h-4" /> Invoices</TabsTrigger>
            <TabsTrigger value="payments" className="flex items-center gap-1.5"><Receipt className="w-4 h-4" /> Payment History</TabsTrigger>
            <TabsTrigger value="student-specific" className="flex items-center gap-1.5"><Users className="w-4 h-4" /> Student Specific</TabsTrigger>
          </TabsList>

          {/* ============ TAB: OVERVIEW ============ */}
          <TabsContent value="overview" className="space-y-6">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => <Card key={i}><CardContent className="p-6"><Skeleton className="h-20 w-full" /></CardContent></Card>)}
              </div>
            ) : (
              <>
                {/* Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                  <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-0">
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-medium opacity-80">Total Collected</p>
                          <p className="text-2xl font-bold mt-1">{fmt(overview?.totalCollected || 0)}</p>
                          <p className="text-xs opacity-70 mt-1 flex items-center gap-1"><ArrowUpRight className="w-3 h-3" /> All time</p>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                          <DollarSign className="w-6 h-6" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-gradient-to-br from-sky-500 to-sky-600 text-white border-0">
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-medium opacity-80">Total Invoiced</p>
                          <p className="text-2xl font-bold mt-1">{fmt(overview?.totalInvoiced || 0)}</p>
                          <p className="text-xs opacity-70 mt-1">{invoiceStats?.total || 0} invoices</p>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                          <FileText className="w-6 h-6" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-gradient-to-br from-amber-500 to-orange-500 text-white border-0">
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-medium opacity-80">Outstanding</p>
                          <p className="text-2xl font-bold mt-1">{fmt(overview?.totalOutstanding || 0)}</p>
                          <p className="text-xs opacity-70 mt-1 flex items-center gap-1"><ArrowDownRight className="w-3 h-3" /> Unpaid dues</p>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                          <AlertCircle className="w-6 h-6" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-gradient-to-br from-violet-500 to-purple-600 text-white border-0">
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-medium opacity-80">Today</p>
                          <p className="text-2xl font-bold mt-1">{fmt(overview?.todayCollection || 0)}</p>
                          <p className="text-xs opacity-70 mt-1"><Calendar className="w-3 h-3 inline mr-1" />{new Date().toLocaleDateString()}</p>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                          <Wallet className="w-6 h-6" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-gradient-to-br from-teal-500 to-teal-600 text-white border-0">
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-medium opacity-80">This Month</p>
                          <p className="text-2xl font-bold mt-1">{fmt(overview?.monthCollection || 0)}</p>
                          <p className="text-xs opacity-70 mt-1">{new Date().toLocaleDateString('en-US', { month: 'long' })}</p>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                          <CircleDollarSign className="w-6 h-6" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Collection Rate + Invoice Stats */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-slate-500">Collection Rate</CardTitle></CardHeader>
                    <CardContent className="p-6 pt-2">
                      <div className="flex items-end gap-3">
                        <span className="text-4xl font-bold text-slate-900">{(overview?.collectionRate || 0).toFixed(1)}%</span>
                        <span className="text-sm text-slate-400 mb-1">of invoiced amount</span>
                      </div>
                      <Progress value={overview?.collectionRate || 0} className="mt-3 h-3" />
                      <div className="flex justify-between mt-2 text-xs text-slate-400">
                        <span>0%</span><span>Target: 100%</span>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-slate-500">Invoice Breakdown</CardTitle></CardHeader>
                    <CardContent className="p-6 pt-2 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-emerald-500" />
                          <span className="text-sm text-slate-600">Paid</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">{invoiceStats?.paid || 0}</span>
                          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs">
                            {invoiceStats?.total ? ((invoiceStats?.paid / invoiceStats?.total) * 100).toFixed(0) : 0}%
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-amber-500" />
                          <span className="text-sm text-slate-600">Partial</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">{invoiceStats?.partial || 0}</span>
                          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-xs">
                            {invoiceStats?.total ? ((invoiceStats?.partial / invoiceStats?.total) * 100).toFixed(0) : 0}%
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-red-500" />
                          <span className="text-sm text-slate-600">Unpaid</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">{invoiceStats?.unpaid || 0}</span>
                          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-xs">
                            {invoiceStats?.total ? ((invoiceStats?.unpaid / invoiceStats?.total) * 100).toFixed(0) : 0}%
                          </Badge>
                        </div>
                      </div>
                      <div className="pt-2 border-t text-center text-xs text-slate-400">
                        Total: {invoiceStats?.total || 0} invoices
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-slate-500">Payment Methods</CardTitle></CardHeader>
                    <CardContent className="p-6 pt-2 space-y-3">
                      {methodBreakdown.length === 0 ? (
                        <p className="text-sm text-slate-400 text-center py-4">No payments recorded yet</p>
                      ) : methodBreakdown.map((m) => {
                        const totalAll = methodBreakdown.reduce((s, x) => s + x.total, 0);
                        const pct = totalAll > 0 ? (m.total / totalAll * 100) : 0;
                        const colors: Record<string, string> = {
                          cash: 'bg-emerald-500', mobile_money: 'bg-violet-500', momo: 'bg-violet-500',
                          bank_transfer: 'bg-sky-500', cheque: 'bg-amber-500', card: 'bg-rose-500',
                        };
                        return (
                          <div key={m.method} className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span className="capitalize text-slate-600">{(m.method || '').replace(/_/g, ' ')}</span>
                              <span className="font-semibold">{fmt(m.total)}</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-2">
                              <div className={`h-2 rounded-full ${colors[m.method] || 'bg-slate-400'}`} style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </CardContent>
                  </Card>
                </div>

                {/* Monthly Collection + Top Debtors */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Monthly Collection Chart */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-slate-500">Monthly Collection{runningYear ? ` — ${runningYear}` : ''}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                      {monthlyData.length === 0 ? (
                        <p className="text-sm text-slate-400 text-center py-8">No collection data available</p>
                      ) : (
                        <div className="flex items-end gap-2 h-48">
                          {monthlyData.map((m) => {
                            const maxVal = Math.max(...monthlyData.map((d) => d.total), 1);
                            const h = Math.max(4, (m.total / maxVal) * 160);
                            return (
                              <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                                <span className="text-[10px] font-mono text-slate-500">{m.total > 0 ? (m.total / 1000).toFixed(0) + 'k' : '0'}</span>
                                <div className="w-full rounded-t bg-gradient-to-t from-emerald-500 to-emerald-400 hover:from-emerald-600 hover:to-emerald-500 transition-colors" style={{ height: `${h}px` }} />
                                <span className="text-[10px] text-slate-400">{monthNames[m.month]}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Top Debtors */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-slate-500">Top 10 Debtors</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      {topDebtors.length === 0 ? (
                        <p className="text-sm text-slate-400 text-center py-8">No outstanding balances</p>
                      ) : (
                        <ScrollArea className="max-h-56">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="text-xs">#</TableHead>
                                <TableHead className="text-xs">Student</TableHead>
                                <TableHead className="text-xs">Class</TableHead>
                                <TableHead className="text-xs text-right">Owed</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {topDebtors.map((d, i) => (
                                <TableRow key={d.student_id} className="hover:bg-slate-50/50">
                                  <TableCell className="text-xs text-slate-400">{i + 1}</TableCell>
                                  <TableCell className="text-xs">
                                    <p className="font-medium">{d.name}</p>
                                    <p className="text-slate-400">{d.student_code}</p>
                                  </TableCell>
                                  <TableCell className="text-xs text-slate-500">{d.class_name || '—'}</TableCell>
                                  <TableCell className="text-xs text-right font-mono font-semibold text-red-600">{fmt(d.total_owed)}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </ScrollArea>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Class Breakdown */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-slate-500">Collection by Class</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    {classBreakdown.length === 0 ? (
                      <p className="text-sm text-slate-400 text-center py-8">No class data available</p>
                    ) : (
                      <ScrollArea className="max-h-72">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="text-xs">Class</TableHead>
                              <TableHead className="text-xs text-center">Invoices</TableHead>
                              <TableHead className="text-xs text-right">Billed</TableHead>
                              <TableHead className="text-xs text-right">Collected</TableHead>
                              <TableHead className="text-xs text-right">Outstanding</TableHead>
                              <TableHead className="text-xs text-right">Rate</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {classBreakdown.map((c) => {
                              const rate = c.total_billed > 0 ? (c.total_collected / c.total_billed * 100) : 0;
                              return (
                                <TableRow key={c.class_id} className="hover:bg-slate-50/50">
                                  <TableCell className="text-xs font-medium">{c.class_name}</TableCell>
                                  <TableCell className="text-xs text-center">{c.invoice_count}</TableCell>
                                  <TableCell className="text-xs text-right font-mono">{fmt(c.total_billed)}</TableCell>
                                  <TableCell className="text-xs text-right font-mono text-emerald-600">{fmt(c.total_collected)}</TableCell>
                                  <TableCell className="text-xs text-right font-mono text-red-600">{fmt(c.total_outstanding)}</TableCell>
                                  <TableCell className="text-xs text-right">
                                    <Badge variant="outline" className={rate >= 90 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : rate >= 70 ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-red-50 text-red-700 border-red-200'}>
                                      {rate.toFixed(0)}%
                                    </Badge>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </ScrollArea>
                    )}
                  </CardContent>
                </Card>

                {/* Recent Payments */}
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium text-slate-500">Recent Payments</CardTitle>
                      <Button variant="ghost" size="sm" asChild className="text-xs text-emerald-600">
                        <Link href="/admin/payments">View All →</Link>
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    {recentPayments.length === 0 ? (
                      <p className="text-sm text-slate-400 text-center py-8">No payments recorded yet</p>
                    ) : (
                      <ScrollArea className="max-h-64">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="text-xs">Student</TableHead>
                              <TableHead className="text-xs">Receipt</TableHead>
                              <TableHead className="text-xs text-right">Amount</TableHead>
                              <TableHead className="text-xs">Method</TableHead>
                              <TableHead className="text-xs">Date</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {recentPayments.map((p) => (
                              <TableRow key={p.payment_id} className="hover:bg-slate-50/50">
                                <TableCell className="text-xs">
                                  <p className="font-medium">{p.student?.name || 'Unknown'}</p>
                                  <p className="text-slate-400">{p.student?.student_code || ''}</p>
                                </TableCell>
                                <TableCell className="text-xs font-mono text-slate-500">{p.receipt_code || '—'}</TableCell>
                                <TableCell className="text-xs text-right font-mono font-semibold text-emerald-600">{fmt(p.amount)}</TableCell>
                                <TableCell className="text-xs">
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize ${methodColors[p.payment_method] || 'bg-gray-100 text-gray-600'}`}>
                                    {(p.payment_method || 'cash').replace(/_/g, ' ')}
                                  </span>
                                </TableCell>
                                <TableCell className="text-xs text-slate-500">{fmtDateTime(p.timestamp)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </ScrollArea>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          {/* ============ TAB: INVOICES ============ */}
          <TabsContent value="invoices" className="space-y-4">
            {/* Filters */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col lg:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input placeholder="Search student, invoice code..." value={invSearch} onChange={(e) => setInvSearch(e.target.value)} className="pl-10" />
                  </div>
                  <Select value={invStatus || '__all__'} onValueChange={(v) => setInvStatus(v === '__all__' ? '' : v)}>
                    <SelectTrigger className="w-full lg:w-40"><SelectValue placeholder="Status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">All Status</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="partial">Partial</SelectItem>
                      <SelectItem value="unpaid">Unpaid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Table */}
            <Card>
              <CardContent className="p-0">
                <div className="hidden md:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50">
                        <TableHead className="text-xs font-semibold">#</TableHead>
                        <TableHead className="text-xs font-semibold">Student</TableHead>
                        <TableHead className="text-xs font-semibold">Title</TableHead>
                        <TableHead className="text-xs font-semibold text-right">Total</TableHead>
                        <TableHead className="text-xs font-semibold text-right">Paid</TableHead>
                        <TableHead className="text-xs font-semibold">Status</TableHead>
                        <TableHead className="text-xs font-semibold">Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invLoading ? Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}>{Array.from({ length: 7 }).map((_, j) => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}</TableRow>
                      )) : invoices.length === 0 ? (
                        <TableRow><TableCell colSpan={7} className="text-center py-12 text-slate-400"><FileText className="w-10 h-10 mx-auto mb-2 opacity-50" /><p>No invoices found</p></TableCell></TableRow>
                      ) : invoices.map((inv, i) => {
                        const sc = statusConfig[inv.status] || statusConfig.unpaid;
                        return (
                          <TableRow key={inv.invoice_id} className="hover:bg-slate-50/50">
                            <TableCell className="text-xs text-slate-400">{(invPage - 1) * 15 + i + 1}</TableCell>
                            <TableCell className="text-xs"><p className="font-medium">{inv.student?.name || 'Unknown'}</p></TableCell>
                            <TableCell className="text-xs max-w-[150px] truncate">{inv.title}</TableCell>
                            <TableCell className="text-xs text-right font-mono">{fmt(inv.amount)}</TableCell>
                            <TableCell className="text-xs text-right font-mono text-emerald-600">{fmt(inv.amount_paid)}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className={`text-xs ${sc.className}`}>{sc.label}</Badge>
                            </TableCell>
                            <TableCell className="text-xs text-slate-500">{fmtDate(inv.creation_timestamp)}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
                {/* Mobile */}
                <div className="md:hidden divide-y">
                  {invLoading ? Array.from({ length: 3 }).map((_, i) => <div key={i} className="p-4"><Skeleton className="h-16 w-full" /></div>)
                  : invoices.length === 0 ? <div className="text-center py-12 text-slate-400"><p>No invoices found</p></div>
                  : invoices.map((inv) => {
                    const sc = statusConfig[inv.status] || statusConfig.unpaid;
                    return (
                      <div key={inv.invoice_id} className="p-4 space-y-2">
                        <div className="flex items-start justify-between">
                          <div><p className="font-medium text-sm">{inv.student?.name || 'Unknown'}</p><p className="text-xs text-slate-400">{inv.title}</p></div>
                          <Badge variant="outline" className={`text-xs ${sc.className}`}>{sc.label}</Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div><span className="text-slate-400">Total: </span><span className="font-mono">{fmt(inv.amount)}</span></div>
                          <div><span className="text-slate-400">Paid: </span><span className="font-mono text-emerald-600">{fmt(inv.amount_paid)}</span></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {invTotalPages > 1 && (
                  <div className="flex items-center justify-between px-4 py-3 border-t">
                    <p className="text-xs text-slate-500">{invTotal} invoice(s)</p>
                    <div className="flex items-center gap-1">
                      <Button variant="outline" size="icon" className="h-8 w-8" disabled={invPage <= 1} onClick={() => setInvPage(invPage - 1)}><ChevronLeft className="w-4 h-4" /></Button>
                      <span className="text-sm px-2">{invPage}/{invTotalPages}</span>
                      <Button variant="outline" size="icon" className="h-8 w-8" disabled={invPage >= invTotalPages} onClick={() => setInvPage(invPage + 1)}><ChevronRight className="w-4 h-4" /></Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ============ TAB: PAYMENT HISTORY ============ */}
          <TabsContent value="payments" className="space-y-4">
            {/* Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="border-l-4 border-l-emerald-500">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center"><DollarSign className="w-5 h-5 text-emerald-600" /></div>
                    <div><p className="text-xs text-slate-500 font-medium">All Time</p><p className="text-lg font-bold text-slate-900">{fmt(paySummary.totalCollected)}</p></div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-sky-500">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-sky-50 flex items-center justify-center"><Calendar className="w-5 h-5 text-sky-600" /></div>
                    <div><p className="text-xs text-slate-500 font-medium">Today</p><p className="text-lg font-bold text-sky-700">{fmt(paySummary.todayTotal)}</p></div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-violet-500">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-violet-50 flex items-center justify-center"><TrendingUp className="w-5 h-5 text-violet-600" /></div>
                    <div><p className="text-xs text-slate-500 font-medium">This Month</p><p className="text-lg font-bold text-violet-700">{fmt(paySummary.monthTotal)}</p></div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col lg:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input placeholder="Search receipt code, student..." value={paySearch} onChange={(e) => setPaySearch(e.target.value)} className="pl-10" />
                  </div>
                  <Select value={payMethod || '__all__'} onValueChange={(v) => setPayMethod(v === '__all__' ? '' : v)}>
                    <SelectTrigger className="w-full lg:w-48"><SelectValue placeholder="Method" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">All Methods</SelectItem>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="mobile_money">Mobile Money</SelectItem>
                      <SelectItem value="momo">Mobile Money</SelectItem>
                      <SelectItem value="cheque">Cheque</SelectItem>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      <SelectItem value="card">Card</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Table */}
            <Card>
              <CardContent className="p-0">
                <div className="hidden md:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50">
                        <TableHead className="text-xs font-semibold">#</TableHead>
                        <TableHead className="text-xs font-semibold">Title</TableHead>
                        <TableHead className="text-xs font-semibold">Description</TableHead>
                        <TableHead className="text-xs font-semibold">Method</TableHead>
                        <TableHead className="text-xs font-semibold text-right">Amount</TableHead>
                        <TableHead className="text-xs font-semibold">Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payLoading ? Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}>{Array.from({ length: 6 }).map((_, j) => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}</TableRow>
                      )) : payments.length === 0 ? (
                        <TableRow><TableCell colSpan={6} className="text-center py-12 text-slate-400"><Receipt className="w-10 h-10 mx-auto mb-2 opacity-50" /><p>No payments found</p></TableCell></TableRow>
                      ) : payments.map((p, i) => (
                        <TableRow key={p.payment_id} className="hover:bg-slate-50/50">
                          <TableCell className="text-xs text-slate-400">{(payPage - 1) * 15 + i + 1}</TableCell>
                          <TableCell className="text-xs"><p className="font-medium">{p.title}</p><p className="text-slate-400">{p.student?.name || ''}</p></TableCell>
                          <TableCell className="text-xs text-slate-500 max-w-[150px] truncate">{p.invoice_code || '—'}</TableCell>
                          <TableCell className="text-xs">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize ${methodColors[p.payment_method] || 'bg-gray-100 text-gray-600'}`}>
                              {(p.payment_method || 'cash').replace(/_/g, ' ')}
                            </span>
                          </TableCell>
                          <TableCell className="text-xs text-right font-mono font-semibold text-emerald-600">{fmt(p.amount)}</TableCell>
                          <TableCell className="text-xs text-slate-500">{fmtDateTime(p.timestamp)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                {/* Mobile */}
                <div className="md:hidden divide-y">
                  {payLoading ? Array.from({ length: 3 }).map((_, i) => <div key={i} className="p-4"><Skeleton className="h-16 w-full" /></div>)
                  : payments.length === 0 ? <div className="text-center py-12 text-slate-400"><p>No payments found</p></div>
                  : payments.map((p) => (
                    <div key={p.payment_id} className="p-4 space-y-2">
                      <div className="flex items-start justify-between">
                        <div><p className="font-medium text-sm">{p.title}</p><p className="text-xs text-slate-400">{p.student?.name || ''}</p></div>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize ${methodColors[p.payment_method] || 'bg-gray-100 text-gray-600'}`}>
                          {(p.payment_method || 'cash').replace(/_/g, ' ')}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500">{fmtDateTime(p.timestamp)}</span>
                        <span className="text-lg font-bold text-emerald-600">{fmt(p.amount)}</span>
                      </div>
                    </div>
                  ))}
                </div>
                {payTotalPages > 1 && (
                  <div className="flex items-center justify-between px-4 py-3 border-t">
                    <p className="text-xs text-slate-500">{payTotal} payment(s)</p>
                    <div className="flex items-center gap-1">
                      <Button variant="outline" size="icon" className="h-8 w-8" disabled={payPage <= 1} onClick={() => setPayPage(payPage - 1)}><ChevronLeft className="w-4 h-4" /></Button>
                      <span className="text-sm px-2">{payPage}/{payTotalPages}</span>
                      <Button variant="outline" size="icon" className="h-8 w-8" disabled={payPage >= payTotalPages} onClick={() => setPayPage(payPage + 1)}><ChevronRight className="w-4 h-4" /></Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ============ TAB: STUDENT SPECIFIC ============ */}
          <TabsContent value="student-specific" className="space-y-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row gap-3 items-end">
                  <div className="flex-1 w-full">
                    <p className="text-xs font-medium text-slate-500 mb-1.5">Select Student</p>
                    <Select value={spStudentId || '__all__'} onValueChange={setSpStudentId}>
                      <SelectTrigger><SelectValue placeholder="All Students" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Students</SelectItem>
                        {studentsLoading ? <SelectItem value="loading" disabled>Loading...</SelectItem> :
                          students.map((s: any) => (
                            <SelectItem key={s.student_id} value={String(s.student_id)}>
                              {s.name} ({s.student_code})
                            </SelectItem>
                          ))
                        }
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-0">
                <div className="hidden md:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50">
                        <TableHead className="text-xs font-semibold">#</TableHead>
                        <TableHead className="text-xs font-semibold">Title</TableHead>
                        <TableHead className="text-xs font-semibold">Description</TableHead>
                        <TableHead className="text-xs font-semibold">Method</TableHead>
                        <TableHead className="text-xs font-semibold text-right">Amount</TableHead>
                        <TableHead className="text-xs font-semibold">Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {spLoading ? Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}>{Array.from({ length: 6 }).map((_, j) => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}</TableRow>
                      )) : studentPayments.length === 0 ? (
                        <TableRow><TableCell colSpan={6} className="text-center py-12 text-slate-400"><Users className="w-10 h-10 mx-auto mb-2 opacity-50" /><p>Select a student to view their payment history</p></TableCell></TableRow>
                      ) : studentPayments.map((p, i) => (
                        <TableRow key={p.payment_id} className="hover:bg-slate-50/50">
                          <TableCell className="text-xs text-slate-400">{i + 1}</TableCell>
                          <TableCell className="text-xs"><p className="font-medium">{p.title}</p><p className="text-slate-400">{p.student?.name || ''}</p></TableCell>
                          <TableCell className="text-xs text-slate-500 max-w-[150px] truncate">{p.invoice_code || '—'}</TableCell>
                          <TableCell className="text-xs">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize ${methodColors[p.payment_method] || 'bg-gray-100 text-gray-600'}`}>
                              {(p.payment_method || 'cash').replace(/_/g, ' ')}
                            </span>
                          </TableCell>
                          <TableCell className="text-xs text-right font-mono font-semibold text-emerald-600">{fmt(p.amount)}</TableCell>
                          <TableCell className="text-xs text-slate-500">{fmtDateTime(p.timestamp)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                {/* Mobile */}
                <div className="md:hidden divide-y">
                  {spLoading ? Array.from({ length: 3 }).map((_, i) => <div key={i} className="p-4"><Skeleton className="h-16 w-full" /></div>)
                  : studentPayments.length === 0 ? <div className="text-center py-12 text-slate-400"><p>Select a student to view their payment history</p></div>
                  : studentPayments.map((p) => (
                    <div key={p.payment_id} className="p-4 space-y-2">
                      <div className="flex items-start justify-between">
                        <div><p className="font-medium text-sm">{p.title}</p><p className="text-xs text-slate-400">{p.student?.name || ''}</p></div>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize ${methodColors[p.payment_method] || 'bg-gray-100 text-gray-600'}`}>
                          {(p.payment_method || 'cash').replace(/_/g, ' ')}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500">{fmtDateTime(p.timestamp)}</span>
                        <span className="text-lg font-bold text-emerald-600">{fmt(p.amount)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
