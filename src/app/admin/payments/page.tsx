'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  Search,
  Plus,
  Download,
  Wallet,
  CalendarCheck,
  TrendingUp,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  Eye,
  Trash2,
  Receipt,
  Banknote,
  Smartphone,
  Building2,
  FileText,
  Printer,
  User,
  CircleDollarSign,
  X,
  Landmark,
  FilterX,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Payment {
  payment_id: number;
  student_id: number;
  invoice_id: number | null;
  invoice_code: string;
  receipt_code: string;
  title: string;
  amount: number;
  due: number;
  payment_type: string;
  payment_method: string;
  year: string;
  term: string;
  timestamp: string;
  approval_status: string;
  student: {
    student_id: number;
    name: string;
    student_code: string;
  };
  invoice: {
    invoice_code: string;
    title: string;
  } | null;
}

interface Invoice {
  invoice_id: number;
  invoice_code: string;
  title: string;
  student_id: number;
  due: number;
  student: { student_id: number; name: string; student_code: string };
}

interface PaymentStats {
  total: number;
  totalCollected: number;
  todayTotal: number;
  monthTotal: number;
  byMethod: {
    cash: number;
    mobile_money: number;
    cheque: number;
    bank_transfer?: number;
    card?: number;
  };
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const METHOD_STYLES: Record<string, { bg: string; icon: typeof Banknote; label: string }> = {
  cash: { bg: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: Banknote, label: 'Cash' },
  mobile_money: { bg: 'bg-violet-100 text-violet-700 border-violet-200', icon: Smartphone, label: 'Mobile Money' },
  bank_transfer: { bg: 'bg-sky-100 text-sky-700 border-sky-200', icon: Building2, label: 'Bank Transfer' },
  cheque: { bg: 'bg-amber-100 text-amber-700 border-amber-200', icon: FileText, label: 'Cheque' },
  card: { bg: 'bg-rose-100 text-rose-700 border-rose-200', icon: CreditCard, label: 'Card' },
};

const PAGE_SIZE = 15;

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-GH', {
    style: 'currency',
    currency: 'GHS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDate(dateStr: string) {
  if (!dateStr) return '\u2014';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatDateTime(dateStr: string) {
  if (!dateStr) return '\u2014';
  return new Date(dateStr).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function countActiveMethods(byMethod: PaymentStats['byMethod']): number {
  return Object.values(byMethod).filter((v) => v > 0).length;
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function MethodBadge({ method }: { method: string }) {
  const style = METHOD_STYLES[method] || METHOD_STYLES.cash;
  const Icon = style.icon;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium border ${style.bg}`}
    >
      <Icon className="w-3 h-3" />
      {style.label}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const approved = status === 'approved';
  return (
    <Badge
      variant="outline"
      className={
        approved
          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 text-xs capitalize'
          : 'bg-amber-50 text-amber-700 border-amber-200 text-xs capitalize'
      }
    >
      {status || 'pending'}
    </Badge>
  );
}

/* ------------------------------------------------------------------ */
/*  Page Component                                                     */
/* ------------------------------------------------------------------ */

export default function PaymentsPage() {
  /* --- data state --- */
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);

  const [stats, setStats] = useState<PaymentStats>({
    total: 0,
    totalCollected: 0,
    todayTotal: 0,
    monthTotal: 0,
    byMethod: { cash: 0, mobile_money: 0, cheque: 0 },
  });

  /* --- filter state --- */
  const [search, setSearch] = useState('');
  const [method, setMethod] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  /* --- pagination state --- */
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  /* --- record payment dialog --- */
  const [recordOpen, setRecordOpen] = useState(false);
  const [studentSearch, setStudentSearch] = useState('');
  const [searchResults, setSearchResults] = useState<Invoice['student'][]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Invoice['student'] | null>(null);
  const [studentInvoices, setStudentInvoices] = useState<Invoice[]>([]);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [recording, setRecording] = useState(false);

  /* --- view receipt dialog --- */
  const [viewOpen, setViewOpen] = useState(false);
  const [viewPayment, setViewPayment] = useState<Payment | null>(null);

  /* --- delete dialog --- */
  const [deleteTarget, setDeleteTarget] = useState<Payment | null>(null);
  const [deleting, setDeleting] = useState(false);

  /* ---------------------------------------------------------------- */
  /*  Derived                                                          */
  /* ---------------------------------------------------------------- */

  const hasActiveFilters = !!(search || method || statusFilter || startDate || endDate);

  const activeMethodCount = useMemo(() => countActiveMethods(stats.byMethod), [stats.byMethod]);

  const selectedInvoice = useMemo(
    () => studentInvoices.find((inv) => inv.invoice_id === Number(selectedInvoiceId)) ?? null,
    [studentInvoices, selectedInvoiceId],
  );

  /* ---------------------------------------------------------------- */
  /*  Data fetching                                                    */
  /* ---------------------------------------------------------------- */

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await fetch('/api/admin/payments?action=stats');
      const data = await res.json();
      if (data.stats) setStats(data.stats);
    } catch {
      /* silent */
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (method) params.set('method', method);
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);
      if (statusFilter) params.set('status', statusFilter);
      params.set('page', String(page));
      params.set('limit', String(PAGE_SIZE));

      const res = await fetch(`/api/admin/payments?${params}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setPayments(data.payments || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotal(data.pagination?.total || 0);
    } catch {
      toast.error('Failed to load payments');
    } finally {
      setLoading(false);
    }
  }, [search, method, startDate, endDate, statusFilter, page]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  /* debounced search reset */
  useEffect(() => {
    const t = setTimeout(() => setPage(1), 400);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [method, startDate, endDate, statusFilter]);

  /* ---------------------------------------------------------------- */
  /*  Handlers                                                         */
  /* ---------------------------------------------------------------- */

  const clearAllFilters = () => {
    setSearch('');
    setMethod('');
    setStatusFilter('');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  const handleSearchStudents = async (query: string) => {
    setStudentSearch(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    try {
      const res = await fetch(`/api/students?search=${encodeURIComponent(query)}&limit=20`);
      const data = await res.json();
      setSearchResults(data.students || []);
    } catch {
      /* silent */
    }
  };

  const handleSelectStudent = async (student: Invoice['student']) => {
    setSelectedStudent(student);
    setStudentSearch('');
    setSearchResults([]);
    try {
      const res = await fetch(
        `/api/admin/invoices?search=${encodeURIComponent(student.student_code)}&status=unpaid&limit=50`,
      );
      const data = await res.json();
      setStudentInvoices((data.invoices || []).filter((inv: Invoice) => inv.due > 0));
    } catch {
      setStudentInvoices([]);
    }
  };

  /* auto-fill amount when invoice changes */
  useEffect(() => {
    if (selectedInvoice && selectedInvoice.due > 0) {
      setPaymentAmount(String(selectedInvoice.due));
    }
  }, [selectedInvoice]);

  const resetPaymentForm = () => {
    setSelectedStudent(null);
    setSearchResults([]);
    setStudentInvoices([]);
    setSelectedInvoiceId('');
    setPaymentAmount('');
    setPaymentMethod('cash');
    setPaymentReference('');
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setStudentSearch('');
  };

  const handleRecordPayment = async () => {
    if (!selectedStudent || !paymentAmount || parseFloat(paymentAmount) <= 0) {
      toast.error('Student and a valid amount are required');
      return;
    }
    setRecording(true);
    try {
      const res = await fetch('/api/admin/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: selectedStudent.student_id,
          invoiceId: selectedInvoiceId ? parseInt(selectedInvoiceId) : null,
          amount: parseFloat(paymentAmount),
          paymentMethod,
          year: new Date().getFullYear().toString(),
          term: 'Term 1',
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast.success(data.message || `Payment recorded. Receipt: ${data.receiptCode}`);
      setRecordOpen(false);
      resetPaymentForm();
      fetchPayments();
      fetchStats();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to record payment';
      toast.error(msg);
    } finally {
      setRecording(false);
    }
  };

  const handleExportCSV = () => {
    const headers = [
      'Receipt #',
      'Student Name',
      'Student Code',
      'Invoice',
      'Amount',
      'Method',
      'Date',
      'Status',
    ];
    const rows = payments.map((p) => [
      p.receipt_code,
      p.student?.name || '',
      p.student?.student_code || '',
      p.invoice?.invoice_code || p.invoice_code || '',
      p.amount,
      p.payment_method.replace(/_/g, ' '),
      formatDateTime(p.timestamp),
      p.approval_status,
    ]);
    const csv = [headers, ...rows]
      .map((r) => r.map((c) => `"${c}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payments-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Payments exported successfully');
  };

  const handleDeletePayment = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/payments/${deleteTarget.payment_id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast.success('Payment deleted and invoice updated');
      setDeleteTarget(null);
      fetchPayments();
      fetchStats();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete payment';
      toast.error(msg);
    } finally {
      setDeleting(false);
    }
  };

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* ---------- Page Header ---------- */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Payments</h1>
            <p className="text-sm text-slate-500 mt-1">
              Track and record fee payments &middot;{' '}
              <span className="text-slate-400">{total} total</span>
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleExportCSV}
              disabled={payments.length === 0}
              className="border-slate-200 text-slate-600 hover:bg-slate-50 min-h-[44px]"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button
              onClick={() => {
                setRecordOpen(true);
                resetPaymentForm();
              }}
              className="bg-emerald-600 hover:bg-emerald-700 min-h-[44px]"
            >
              <Plus className="w-4 h-4 mr-2" />
              Record Payment
            </Button>
          </div>
        </div>

        {/* ---------- Stat Cards ---------- */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Collected */}
          {statsLoading ? (
            <Card className="border-slate-100">
              <CardContent className="p-4 flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-lg" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-5 w-28" />
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-l-4 border-l-emerald-500 hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium text-slate-500">Total Collected</p>
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <Wallet className="w-4 h-4 text-emerald-600" />
                  </div>
                </div>
                <p className="text-xl font-bold text-slate-900">
                  {formatCurrency(stats.totalCollected)}
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  {stats.total} transaction{stats.total !== 1 ? 's' : ''}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Today's Collection */}
          {statsLoading ? (
            <Card className="border-slate-100">
              <CardContent className="p-4 flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-lg" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-5 w-28" />
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-l-4 border-l-sky-500 hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium text-slate-500">Today&apos;s Collection</p>
                  <div className="w-8 h-8 rounded-lg bg-sky-100 flex items-center justify-center">
                    <CalendarCheck className="w-4 h-4 text-sky-600" />
                  </div>
                </div>
                <p className="text-xl font-bold text-slate-900">
                  {formatCurrency(stats.todayTotal)}
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Monthly Total */}
          {statsLoading ? (
            <Card className="border-slate-100">
              <CardContent className="p-4 flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-lg" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-5 w-28" />
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-l-4 border-l-violet-500 hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium text-slate-500">Monthly Total</p>
                  <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-violet-600" />
                  </div>
                </div>
                <p className="text-xl font-bold text-slate-900">
                  {formatCurrency(stats.monthTotal)}
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Payment Methods Count */}
          {statsLoading ? (
            <Card className="border-slate-100">
              <CardContent className="p-4 flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-lg" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3 w-28" />
                  <Skeleton className="h-5 w-20" />
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-l-4 border-l-amber-500 hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium text-slate-500">Payment Methods</p>
                  <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                    <Landmark className="w-4 h-4 text-amber-600" />
                  </div>
                </div>
                <p className="text-xl font-bold text-slate-900">{activeMethodCount}</p>
                <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                  {Object.entries(stats.byMethod)
                    .filter(([, v]) => v > 0)
                    .map(([key]) => (
                      <span
                        key={key}
                        className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium border ${
                          METHOD_STYLES[key]?.bg || 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {METHOD_STYLES[key]?.label || key}
                      </span>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* ---------- Filter Bar ---------- */}
        <Card className="overflow-hidden">
          <CardContent className="p-4">
            <div className="flex flex-col gap-3">
              {/* Row 1: Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search student name, code, or receipt..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 min-h-[44px] bg-slate-50 border-slate-200 focus:bg-white"
                />
              </div>

              {/* Row 2: Filters */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <Label className="text-[11px] text-slate-400 mb-1 block font-medium">From Date</Label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="min-h-[44px]"
                  />
                </div>
                <div>
                  <Label className="text-[11px] text-slate-400 mb-1 block font-medium">To Date</Label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="min-h-[44px]"
                  />
                </div>
                <div>
                  <Label className="text-[11px] text-slate-400 mb-1 block font-medium">Method</Label>
                  <Select
                    value={method || '__all__'}
                    onValueChange={(v) => (v === '__all__' ? setMethod('') : setMethod(v))}
                  >
                    <SelectTrigger className="min-h-[44px]">
                      <SelectValue placeholder="All Methods" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">All Methods</SelectItem>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="mobile_money">Mobile Money</SelectItem>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      <SelectItem value="cheque">Cheque</SelectItem>
                      <SelectItem value="card">Card</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-[11px] text-slate-400 mb-1 block font-medium">Status</Label>
                  <Select
                    value={statusFilter || '__all__'}
                    onValueChange={(v) => (v === '__all__' ? setStatusFilter('') : setStatusFilter(v))}
                  >
                    <SelectTrigger className="min-h-[44px]">
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">All Status</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Active filter badges */}
            {hasActiveFilters && (
              <div className="flex items-center gap-2 mt-3 pt-3 border-t flex-wrap">
                <span className="text-[11px] text-slate-400 font-medium">Active:</span>
                {search && (
                  <Badge variant="secondary" className="text-xs h-6 gap-1">
                    &quot;{search}&quot;
                    <button
                      onClick={() => setSearch('')}
                      className="hover:text-red-600 rounded-full p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                )}
                {method && (
                  <Badge variant="secondary" className="text-xs h-6 gap-1">
                    {METHOD_STYLES[method]?.label || method}
                    <button
                      onClick={() => setMethod('')}
                      className="hover:text-red-600 rounded-full p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                )}
                {statusFilter && (
                  <Badge variant="secondary" className="text-xs h-6 gap-1 capitalize">
                    {statusFilter}
                    <button
                      onClick={() => setStatusFilter('')}
                      className="hover:text-red-600 rounded-full p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                )}
                {(startDate || endDate) && (
                  <Badge variant="secondary" className="text-xs h-6 gap-1">
                    {startDate || '?'} &rarr; {endDate || '?'}
                    <button
                      onClick={() => {
                        setStartDate('');
                        setEndDate('');
                      }}
                      className="hover:text-red-600 rounded-full p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                )}
                <button
                  onClick={clearAllFilters}
                  className="text-[11px] text-slate-500 hover:text-red-600 font-medium ml-1 flex items-center gap-1"
                >
                  <FilterX className="w-3 h-3" />
                  Clear all
                </button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ---------- Payments Table / Mobile Cards ---------- */}
        <Card>
          <CardContent className="p-0">
            {/* Results count header */}
            {!loading && payments.length > 0 && (
              <div className="hidden md:flex items-center justify-between px-4 pt-4 pb-2">
                <p className="text-xs text-slate-400">
                  Showing {(page - 1) * PAGE_SIZE + 1}&ndash;
                  {Math.min(page * PAGE_SIZE, total)} of {total} payment{total !== 1 ? 's' : ''}
                </p>
              </div>
            )}

            {/* ===== Desktop Table ===== */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
                    <TableHead className="text-xs font-semibold">Student</TableHead>
                    <TableHead className="text-xs font-semibold">Invoice</TableHead>
                    <TableHead className="text-xs font-semibold">Receipt #</TableHead>
                    <TableHead className="text-xs font-semibold text-right">Amount</TableHead>
                    <TableHead className="text-xs font-semibold">Method</TableHead>
                    <TableHead className="text-xs font-semibold">Date</TableHead>
                    <TableHead className="text-xs font-semibold">Status</TableHead>
                    <TableHead className="text-xs font-semibold text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 8 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell>
                          <div className="space-y-1.5">
                            <Skeleton className="h-4 w-28" />
                            <Skeleton className="h-3 w-16" />
                          </div>
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-24" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-28" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-20 ml-auto" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-6 w-24 rounded-md" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-28" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-5 w-16 rounded-md" />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-1">
                            <Skeleton className="h-8 w-8 rounded-md" />
                            <Skeleton className="h-8 w-8 rounded-md" />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : payments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-16">
                        <EmptyState
                          hasFilters={hasActiveFilters}
                          onRecord={() => {
                            setRecordOpen(true);
                            resetPaymentForm();
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  ) : (
                    payments.map((p) => (
                      <TableRow key={p.payment_id} className="hover:bg-slate-50/50 group">
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm text-slate-900">
                              {p.student?.name || 'Unknown'}
                            </p>
                            <p className="text-[11px] text-slate-400 font-mono">
                              {p.student?.student_code}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-slate-600 font-mono">
                          {p.invoice?.invoice_code || p.invoice_code || '\u2014'}
                        </TableCell>
                        <TableCell className="text-xs text-slate-600 font-mono">
                          {p.receipt_code}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="text-sm font-mono font-semibold text-emerald-600">
                            {formatCurrency(p.amount)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <MethodBadge method={p.payment_method} />
                        </TableCell>
                        <TableCell className="text-xs text-slate-500">
                          {formatDate(p.timestamp)}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={p.approval_status} />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 opacity-60 group-hover:opacity-100 transition-opacity"
                              onClick={() => {
                                setViewPayment(p);
                                setViewOpen(true);
                              }}
                              title="View Receipt"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 opacity-60 group-hover:opacity-100 transition-opacity"
                              onClick={() => setDeleteTarget(p)}
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* ===== Mobile Card View ===== */}
            <div className="md:hidden divide-y">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1.5">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                      <Skeleton className="h-6 w-24 rounded-full" />
                    </div>
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-3 w-28" />
                      <Skeleton className="h-5 w-20" />
                    </div>
                    <div className="flex gap-2">
                      <Skeleton className="h-11 flex-1 rounded-lg" />
                      <Skeleton className="h-11 w-11 rounded-lg" />
                    </div>
                  </div>
                ))
              ) : payments.length === 0 ? (
                <div className="py-16 px-4">
                  <EmptyState
                    hasFilters={hasActiveFilters}
                    onRecord={() => {
                      setRecordOpen(true);
                      resetPaymentForm();
                    }}
                  />
                </div>
              ) : (
                payments.map((p) => (
                  <div key={p.payment_id} className="p-4 space-y-3">
                    {/* Top row: student + amount */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium text-sm text-slate-900 truncate">
                          {p.student?.name || 'Unknown'}
                        </p>
                        <p className="text-[11px] text-slate-400 font-mono">
                          {p.student?.student_code}
                        </p>
                      </div>
                      <span className="text-lg font-bold text-emerald-600 flex-shrink-0 tabular-nums">
                        {formatCurrency(p.amount)}
                      </span>
                    </div>

                    {/* Badges row */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <MethodBadge method={p.payment_method} />
                      <StatusBadge status={p.approval_status} />
                    </div>

                    {/* Detail rows */}
                    <div className="space-y-1.5 text-xs text-slate-500 bg-slate-50 rounded-lg p-2.5">
                      <div className="flex justify-between">
                        <span>Invoice</span>
                        <span className="font-mono text-slate-700">
                          {p.invoice?.invoice_code || p.invoice_code || '\u2014'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Receipt</span>
                        <span className="font-mono text-slate-700">{p.receipt_code}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Date</span>
                        <span>{formatDate(p.timestamp)}</span>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-2 pt-0.5">
                      <Button
                        variant="outline"
                        className="flex-1 min-h-[44px] text-xs"
                        onClick={() => {
                          setViewPayment(p);
                          setViewOpen(true);
                        }}
                      >
                        <Eye className="w-4 h-4 mr-1.5" />
                        View Receipt
                      </Button>
                      <Button
                        variant="outline"
                        className="min-h-[44px] min-w-[44px] text-red-500 hover:text-red-600 hover:bg-red-50 px-3"
                        onClick={() => setDeleteTarget(p)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* ===== Pagination ===== */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t">
                <p className="text-xs text-slate-500 md:hidden">
                  Page {page} of {totalPages}
                </p>
                <p className="text-xs text-slate-500 hidden md:block">
                  Showing {(page - 1) * PAGE_SIZE + 1}&ndash;
                  {Math.min(page * PAGE_SIZE, total)} of {total}
                </p>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9"
                    disabled={page <= 1}
                    onClick={() => setPage(page - 1)}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  {/* Page number buttons */}
                  {getPageNumbers(page, totalPages).map((pn, idx) =>
                    pn === '...' ? (
                      <span key={`ellipsis-${idx}`} className="text-xs text-slate-400 px-1">
                        ...
                      </span>
                    ) : (
                      <Button
                        key={pn}
                        variant={pn === page ? 'default' : 'outline'}
                        size="icon"
                        className={`h-9 w-9 text-xs ${pn === page ? 'bg-emerald-600 hover:bg-emerald-700' : ''}`}
                        onClick={() => setPage(pn as number)}
                      >
                        {pn}
                      </Button>
                    ),
                  )}
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9"
                    disabled={page >= totalPages}
                    onClick={() => setPage(page + 1)}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ================================================================ */}
      {/*  Record Payment Dialog                                           */}
      {/* ================================================================ */}
      <Dialog
        open={recordOpen}
        onOpenChange={(open) => {
          if (!open) resetPaymentForm();
          setRecordOpen(open);
        }}
      >
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                <Receipt className="w-4 h-4 text-emerald-600" />
              </div>
              Record Payment
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Student Search */}
            {!selectedStudent ? (
              <div>
                <Label className="text-xs mb-1.5 block font-medium">Search Student</Label>
                <Input
                  placeholder="Type name or student code..."
                  value={studentSearch}
                  onChange={(e) => handleSearchStudents(e.target.value)}
                  className="min-h-[44px]"
                />
                {searchResults.length > 0 && (
                  <div className="mt-2 max-h-48 overflow-y-auto border rounded-lg divide-y">
                    {searchResults.map((s) => (
                      <button
                        key={s.student_id}
                        className="w-full text-left px-4 py-3 hover:bg-emerald-50 text-sm transition-colors min-h-[44px] flex items-center gap-3"
                        onClick={() => handleSelectStudent(s)}
                      >
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                          <User className="w-4 h-4 text-slate-500" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{s.name}</p>
                          <p className="text-xs text-slate-400">{s.student_code}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <>
                {/* Selected Student Chip */}
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-emerald-200 flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-emerald-700" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-slate-900 truncate">
                      {selectedStudent.name}
                    </p>
                    <p className="text-xs text-slate-500">{selectedStudent.student_code}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-slate-500 hover:text-slate-700 min-h-[36px]"
                    onClick={() => {
                      setSelectedStudent(null);
                      setStudentInvoices([]);
                    }}
                  >
                    Change
                  </Button>
                </div>

                {/* Invoice Selection */}
                {studentInvoices.length > 0 && (
                  <div>
                    <Label className="text-xs mb-1.5 block font-medium">
                      Link to Invoice (Optional)
                    </Label>
                    <Select
                      value={selectedInvoiceId || '__none__'}
                      onValueChange={(v) =>
                        setSelectedInvoiceId(v === '__none__' ? '' : v)
                      }
                    >
                      <SelectTrigger className="min-h-[44px]">
                        <SelectValue placeholder="Select invoice" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">No specific invoice</SelectItem>
                        {studentInvoices.map((inv) => (
                          <SelectItem key={inv.invoice_id} value={String(inv.invoice_id)}>
                            {inv.invoice_code} &mdash; Due: {formatCurrency(inv.due)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedInvoice && (
                      <p className="text-xs text-slate-500 mt-1.5 flex items-center gap-1">
                        Outstanding balance:{' '}
                        <span className="font-semibold text-slate-700">
                          {formatCurrency(selectedInvoice.due)}
                        </span>
                      </p>
                    )}
                  </div>
                )}

                {/* Amount */}
                <div>
                  <Label className="text-xs mb-1.5 block font-medium">Amount (GHS) *</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-400">
                      GHS
                    </span>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      className="pl-12 min-h-[44px] text-lg font-mono"
                    />
                  </div>
                </div>

                {/* Method + Date Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs mb-1.5 block font-medium">Payment Method</Label>
                    <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                      <SelectTrigger className="min-h-[44px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="mobile_money">Mobile Money</SelectItem>
                        <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                        <SelectItem value="cheque">Cheque</SelectItem>
                        <SelectItem value="card">Card</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs mb-1.5 block font-medium">Payment Date</Label>
                    <Input
                      type="date"
                      value={paymentDate}
                      onChange={(e) => setPaymentDate(e.target.value)}
                      className="min-h-[44px]"
                    />
                  </div>
                </div>

                {/* Reference */}
                <div>
                  <Label className="text-xs mb-1.5 block font-medium">
                    Reference / Transaction ID
                  </Label>
                  <Input
                    placeholder="e.g. Momo reference, cheque number..."
                    value={paymentReference}
                    onChange={(e) => setPaymentReference(e.target.value)}
                    className="min-h-[44px]"
                  />
                </div>
              </>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                resetPaymentForm();
                setRecordOpen(false);
              }}
              className="min-h-[44px]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleRecordPayment}
              disabled={
                recording ||
                !selectedStudent ||
                !paymentAmount ||
                parseFloat(paymentAmount) <= 0
              }
              className="bg-emerald-600 hover:bg-emerald-700 min-h-[44px]"
            >
              {recording ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  Recording...
                </>
              ) : (
                <>
                  <Receipt className="w-4 h-4 mr-2" />
                  Record Payment
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ================================================================ */}
      {/*  View Receipt Dialog                                             */}
      {/* ================================================================ */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                <Receipt className="w-4 h-4 text-emerald-600" />
              </div>
              Payment Receipt
            </DialogTitle>
          </DialogHeader>

          {viewPayment && (
            <div className="space-y-4">
              {/* Receipt amount header */}
              <div className="text-center py-4 bg-gradient-to-b from-emerald-50 to-white rounded-xl border border-emerald-100">
                <div className="w-12 h-12 rounded-full bg-emerald-100 mx-auto flex items-center justify-center mb-2">
                  <CircleDollarSign className="w-6 h-6 text-emerald-600" />
                </div>
                <p className="text-2xl font-bold text-emerald-600 font-mono">
                  {formatCurrency(viewPayment.amount)}
                </p>
                <div className="mt-2">
                  <StatusBadge status={viewPayment.approval_status} />
                </div>
              </div>

              {/* Details grid */}
              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-xs">Receipt #</span>
                  <span className="font-mono text-xs font-medium">{viewPayment.receipt_code}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-xs">Student</span>
                  <span className="font-medium text-xs">{viewPayment.student?.name || 'Unknown'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-xs">Code</span>
                  <span className="font-mono text-xs">{viewPayment.student?.student_code}</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-xs">Method</span>
                  <MethodBadge method={viewPayment.payment_method} />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-xs">Invoice</span>
                  <span className="font-mono text-xs">
                    {viewPayment.invoice?.invoice_code || viewPayment.invoice_code || '\u2014'}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-xs">Date</span>
                  <span className="text-xs">{formatDateTime(viewPayment.timestamp)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-xs">Term</span>
                  <span className="text-xs">
                    {viewPayment.year} / {viewPayment.term}
                  </span>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setViewOpen(false)}
              className="min-h-[44px] flex-1"
            >
              Close
            </Button>
            <Button
              variant="outline"
              onClick={() => window.print()}
              className="min-h-[44px] flex-1 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
            >
              <Printer className="w-4 h-4 mr-2" />
              Print
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ================================================================ */}
      {/*  Delete Confirmation                                             */}
      {/* ================================================================ */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <AlertDialogTitle>Delete Payment</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="pl-[52px]">
              Are you sure you want to delete this payment of{' '}
              <span className="font-semibold text-slate-900">
                {deleteTarget ? formatCurrency(deleteTarget.amount) : ''}
              </span>{' '}
              from <span className="font-semibold text-slate-900">{deleteTarget?.student?.name}</span>?
              The linked invoice will be updated and the receipt will be removed. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel className="min-h-[44px]">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePayment}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 min-h-[44px]"
            >
              {deleting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  Deleting...
                </>
              ) : (
                'Delete Payment'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}

/* ================================================================== */
/*  Small reusable pieces                                              */
/* ================================================================== */

function EmptyState({ hasFilters, onRecord }: { hasFilters: boolean; onRecord: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 py-8">
      <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center">
        <CircleDollarSign className="w-8 h-8 text-slate-400" />
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold text-slate-700">
          {hasFilters ? 'No payments match your filters' : 'No payments recorded yet'}
        </p>
        <p className="text-xs text-slate-400 mt-1 max-w-xs">
          {hasFilters
            ? 'Try adjusting your search query or clearing some filters.'
            : 'Start by recording your first payment to see it here.'}
        </p>
      </div>
      {!hasFilters && (
        <Button onClick={onRecord} className="bg-emerald-600 hover:bg-emerald-700 mt-1">
          <Plus className="w-4 h-4 mr-2" />
          Record Payment
        </Button>
      )}
    </div>
  );
}

/** Generates an array of page numbers with ellipsis for large page counts. */
function getPageNumbers(current: number, total: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages: (number | '...')[] = [1];

  if (current > 3) pages.push('...');

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  for (let i = start; i <= end; i++) pages.push(i);

  if (current < total - 2) pages.push('...');

  pages.push(total);
  return pages;
}
