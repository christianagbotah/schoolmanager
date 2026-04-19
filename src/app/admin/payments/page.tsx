'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
  Search,
  Plus,
  Download,
  Wallet,
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
  FilterX,
  GraduationCap,
  Hash,
  CalendarCheck,
  ArrowUpDown,
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

interface ClassItem {
  class_id: number;
  name: string;
  name_numeric: number;
}

interface Invoice {
  invoice_id: number;
  invoice_code: string;
  title: string;
  student_id: number;
  due: number;
  year: string;
  term: string;
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
  };
}

interface StudentOwing {
  student_id: number;
  name: string;
  student_code: string;
  total_due: number;
  class_name: string;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const METHOD_STYLES: Record<string, { bg: string; icon: typeof Banknote; label: string }> = {
  cash: { bg: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: Banknote, label: 'Cash' },
  mobile_money: { bg: 'bg-violet-100 text-violet-700 border-violet-200', icon: Smartphone, label: 'Mobile Money' },
  bank_transfer: { bg: 'bg-sky-100 text-sky-700 border-sky-200', icon: Building2, label: 'Bank Transfer' },
  cheque: { bg: 'bg-amber-100 text-amber-700 border-amber-200', icon: FileText, label: 'Cheque' },
};

const PAYMENT_TYPES = [
  { value: 'income', label: 'Income', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { value: 'expense', label: 'Expense', bg: 'bg-rose-50 text-rose-700 border-rose-200' },
];

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
    second: '2-digit',
  });
}

function formatReceiptDate(dateStr: string) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
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

function PaymentTypeBadge({ type }: { type: string }) {
  const found = PAYMENT_TYPES.find((pt) => pt.value === type);
  if (!found) return <span className="text-xs text-slate-500 capitalize">{type || '\u2014'}</span>;
  return (
    <Badge variant="outline" className={`text-xs capitalize border ${found.bg}`}>
      {found.label}
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
  const [paymentType, setPaymentType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [classes, setClasses] = useState<ClassItem[]>([]);

  /* --- pagination state --- */
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  /* --- record payment dialog --- */
  const [recordOpen, setRecordOpen] = useState(false);
  const [studentsOwing, setStudentsOwing] = useState<StudentOwing[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<StudentOwing | null>(null);
  const [studentInvoices, setStudentInvoices] = useState<Invoice[]>([]);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentDescription, setPaymentDescription] = useState('');
  const [paymentYear, setPaymentYear] = useState('');
  const [paymentTerm, setPaymentTerm] = useState('');
  const [momoTransactionId, setMomoTransactionId] = useState('');
  const [bankName, setBankName] = useState('');
  const [chequeNumber, setChequeNumber] = useState('');
  const [printReceipt, setPrintReceipt] = useState(true);
  const [recording, setRecording] = useState(false);
  const [loadingStudent, setLoadingStudent] = useState(false);

  /* --- view receipt dialog --- */
  const [viewOpen, setViewOpen] = useState(false);
  const [viewPayment, setViewPayment] = useState<Payment | null>(null);
  const [receiptPayments, setReceiptPayments] = useState<Payment[]>([]);
  const [loadingReceipt, setLoadingReceipt] = useState(false);

  /* --- delete dialog --- */
  const [deleteTarget, setDeleteTarget] = useState<Payment | null>(null);
  const [deleting, setDeleting] = useState(false);

  const receiptRef = useRef<HTMLDivElement>(null);

  /* ---------------------------------------------------------------- */
  /*  Derived                                                          */
  /* ---------------------------------------------------------------- */

  const hasActiveFilters = !!(search || method || paymentType || startDate || endDate || classFilter);

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

  const fetchClasses = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/payments?action=classes');
      const data = await res.json();
      if (data.classes) setClasses(data.classes);
    } catch {
      /* silent */
    }
  }, []);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (method) params.set('method', method);
      if (paymentType) params.set('paymentType', paymentType);
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);
      if (classFilter) params.set('classId', classFilter);
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
  }, [search, method, paymentType, startDate, endDate, classFilter, page]);

  useEffect(() => {
    fetchStats();
    fetchClasses();
  }, [fetchStats, fetchClasses]);

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
  }, [method, startDate, endDate, paymentType, classFilter]);

  /* ---------------------------------------------------------------- */
  /*  Handlers                                                         */
  /* ---------------------------------------------------------------- */

  const clearAllFilters = () => {
    setSearch('');
    setMethod('');
    setPaymentType('');
    setStartDate('');
    setEndDate('');
    setClassFilter('');
    setPage(1);
  };

  const fetchStudentsOwing = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/invoices?status=unpaid&limit=200');
      const data = await res.json();
      if (data.invoices && data.invoices.length > 0) {
        // Aggregate by student
        const studentMap = new Map<number, StudentOwing>();
        for (const inv of data.invoices) {
          if (inv.due <= 0) continue;
          const existing = studentMap.get(inv.student_id);
          if (existing) {
            existing.total_due += inv.due;
          } else {
            studentMap.set(inv.student_id, {
              student_id: inv.student_id,
              name: inv.student?.name || 'Unknown',
              student_code: inv.student?.student_code || '',
              total_due: inv.due,
              class_name: (inv as any).class_name || '',
            });
          }
        }
        // Filter students who actually owe and sort
        const owingStudents = Array.from(studentMap.values())
          .filter((s) => s.total_due > 0)
          .sort((a, b) => a.name.localeCompare(b.name));
        setStudentsOwing(owingStudents);
      }
    } catch {
      /* silent */
    }
  }, []);

  const openRecordDialog = async () => {
    resetPaymentForm();
    setRecordOpen(true);
    setLoadingStudent(true);
    await fetchStudentsOwing();
    setLoadingStudent(false);
  };

  const handleSelectStudent = async (studentOwing: StudentOwing) => {
    setSelectedStudent(studentOwing);
    // Fetch the student's unpaid invoices
    try {
      const res = await fetch(
        `/api/admin/invoices?search=${encodeURIComponent(studentOwing.student_code)}&status=unpaid&limit=50`,
      );
      const data = await res.json();
      const unpaid = (data.invoices || []).filter((inv: Invoice) => inv.due > 0);
      setStudentInvoices(unpaid);
      // Set year/term from first invoice if available
      if (unpaid.length > 0) {
        setPaymentYear(unpaid[0].year || '');
        setPaymentTerm(unpaid[0].term || '');
      }
      // Auto-fill total owed
      if (studentOwing.total_due > 0) {
        setPaymentAmount(String(studentOwing.total_due));
      }
    } catch {
      setStudentInvoices([]);
    }
  };

  const resetPaymentForm = () => {
    setSelectedStudent(null);
    setStudentsOwing([]);
    setStudentInvoices([]);
    setPaymentAmount('');
    setPaymentMethod('cash');
    setPaymentDescription('');
    setPaymentYear('');
    setPaymentTerm('');
    setMomoTransactionId('');
    setBankName('');
    setChequeNumber('');
    setPrintReceipt(true);
  };

  const handleRecordPayment = async () => {
    if (!selectedStudent || !paymentAmount || parseFloat(paymentAmount) <= 0) {
      toast.error('Student and a valid amount are required');
      return;
    }
    if (paymentMethod === 'momo' && !momoTransactionId) {
      toast.error('Transaction ID is required for Mobile Money');
      return;
    }
    if (paymentMethod === 'cheque' && (!bankName || !chequeNumber)) {
      toast.error('Bank name and cheque number are required for Cheque');
      return;
    }

    setRecording(true);
    try {
      const res = await fetch('/api/admin/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: selectedStudent.student_id,
          amount: parseFloat(paymentAmount),
          paymentMethod,
          description: paymentDescription || undefined,
          year: paymentYear || new Date().getFullYear().toString(),
          term: paymentTerm || 'Term 1',
          momoTransactionId: paymentMethod === 'momo' ? momoTransactionId : undefined,
          bankName: paymentMethod === 'cheque' ? bankName : undefined,
          chequeNumber: paymentMethod === 'cheque' ? chequeNumber : undefined,
          printReceipt,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      toast.success(data.message || `Payment recorded. Receipt: ${data.receiptCode}`);

      if (printReceipt && data.receiptCode) {
        // Open receipt view
        const firstPayment = data.payments?.[0];
        if (firstPayment) {
          const enriched: Payment = {
            ...firstPayment,
            student: { student_id: selectedStudent.student_id, name: selectedStudent.name, student_code: selectedStudent.student_code },
            invoice: null,
          };
          setViewPayment(enriched);
          setReceiptPayments(data.payments || []);
          setViewOpen(true);
        }
      }

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

  const handleViewReceipt = async (p: Payment) => {
    setViewPayment(p);
    setViewOpen(true);
    setLoadingReceipt(true);

    try {
      // Fetch all payments with the same receipt code
      const res = await fetch(`/api/admin/payments/${p.payment_id}`);
      const paymentData = await res.json();

      if (paymentData.receipt_code) {
        // Get all payments for this receipt
        const allRes = await fetch(
          `/api/admin/payments?search=${encodeURIComponent(paymentData.receipt_code)}&limit=50`,
        );
        const allData = await allRes.json();
        const sameReceipt = (allData.payments || []).filter(
          (pp: Payment) => pp.receipt_code === paymentData.receipt_code,
        );
        setReceiptPayments(sameReceipt.length > 1 ? sameReceipt : [p]);
      } else {
        setReceiptPayments([p]);
      }
    } catch {
      setReceiptPayments([p]);
    } finally {
      setLoadingReceipt(false);
    }
  };

  const handlePrintReceipt = () => {
    if (!receiptRef.current) return;
    const printWindow = window.open('', 'Receipt', 'height=600,width=400');
    if (!printWindow) return;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Receipt</title>
        <style>
          body { font-family: Arial, sans-serif; font-size: 13px; margin: 0; padding: 20px; color: #1a1a1a; }
          .receipt-container { max-width: 320px; margin: 0 auto; border: 1px solid #d0cccc; padding: 16px; }
          .receipt-header { text-align: center; margin-bottom: 12px; }
          .receipt-header h2 { margin: 0 0 4px; font-size: 18px; color: #000; }
          .receipt-header .address { font-size: 11px; color: #444; }
          .receipt-header .contact { font-size: 11px; color: #444; }
          .official-badge { display: inline-block; background: #000; color: #fff; padding: 4px 16px; border-radius: 8px; font-size: 16px; font-weight: bold; margin: 8px 0; }
          table { width: 100%; border-collapse: collapse; }
          table th, table td { padding: 3px 4px; text-align: left; font-size: 12px; }
          table th { text-align: left; }
          table .right { text-align: right; }
          hr { border: none; border-top: 1px solid #ccc; margin: 8px 0; }
          .items-table th { border-bottom: 1px solid #999; }
          .items-table td { border-bottom: 1px dotted #ddd; }
          .total-row td { font-weight: bold; font-size: 13px; }
          .footer-section { margin-top: 12px; }
          .footer-section td { font-size: 11px; }
          .watermark { color: #a09e9f; font-size: 20px; text-align: center; transform: rotate(-15deg); margin-top: 8px; }
          .thank-you { text-align: center; font-size: 12px; margin-top: 8px; }
          @media print {
            body { padding: 0; }
            .receipt-container { border: none; padding: 8px; }
          }
        </style>
      </head>
      <body>${receiptRef.current.innerHTML}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  const handleExportCSV = () => {
    const headers = [
      'Receipt #',
      'Student Name',
      'Student Code',
      'Title',
      'Amount',
      'Method',
      'Type',
      'Date',
      'Status',
    ];
    const rows = payments.map((p) => [
      p.receipt_code,
      p.student?.name || '',
      p.student?.student_code || '',
      p.title || '',
      p.amount,
      p.payment_method.replace(/_/g, ' '),
      p.payment_type || '',
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

  const totalAmountPaid = useMemo(() => {
    return receiptPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
  }, [receiptPayments]);

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* ---------- Page Header ---------- */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Payment History</h1>
            <p className="text-sm text-slate-500 mt-1">
              Track and record all payments &middot;{' '}
              <span className="text-slate-400">{total} total records</span>
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
              onClick={openRecordDialog}
              className="bg-emerald-600 hover:bg-emerald-700 min-h-[44px]"
            >
              <Plus className="w-4 h-4 mr-2" />
              Take Payment
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
                    <ArrowUpDown className="w-4 h-4 text-violet-600" />
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

          {/* Number of Transactions */}
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
                  <p className="text-xs font-medium text-slate-500">Transactions</p>
                  <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                    <Hash className="w-4 h-4 text-amber-600" />
                  </div>
                </div>
                <p className="text-xl font-bold text-slate-900">{stats.total}</p>
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
                  placeholder="Search student name, code, receipt, or title..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 min-h-[44px] bg-slate-50 border-slate-200 focus:bg-white"
                />
              </div>

              {/* Row 2: Filters - 6 columns on lg, 3 on sm */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
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
                  <Label className="text-[11px] text-slate-400 mb-1 block font-medium">Class</Label>
                  <Select
                    value={classFilter || '__all__'}
                    onValueChange={(v) => (v === '__all__' ? setClassFilter('') : setClassFilter(v))}
                  >
                    <SelectTrigger className="min-h-[44px]">
                      <SelectValue placeholder="All Classes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">All Classes</SelectItem>
                      {classes.map((c) => (
                        <SelectItem key={c.class_id} value={String(c.class_id)}>
                          {c.name} {c.name_numeric}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                      {Object.entries(METHOD_STYLES).map(([key, val]) => (
                        <SelectItem key={key} value={key}>
                          {val.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-[11px] text-slate-400 mb-1 block font-medium">Type</Label>
                  <Select
                    value={paymentType || '__all__'}
                    onValueChange={(v) => (v === '__all__' ? setPaymentType('') : setPaymentType(v))}
                  >
                    <SelectTrigger className="min-h-[44px]">
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">All Types</SelectItem>
                      <SelectItem value="income">Income</SelectItem>
                      <SelectItem value="expense">Expense</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-[11px] text-slate-400 mb-1 block font-medium">Status</Label>
                  <Select
                    value="__all__"
                    onValueChange={() => {}}
                  >
                    <SelectTrigger className="min-h-[44px]" disabled>
                      <SelectValue placeholder="Approved" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="approved">Approved</SelectItem>
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
                    <button onClick={() => setSearch('')} className="hover:text-red-600 rounded-full p-0.5">
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                )}
                {method && (
                  <Badge variant="secondary" className="text-xs h-6 gap-1">
                    {METHOD_STYLES[method]?.label || method}
                    <button onClick={() => setMethod('')} className="hover:text-red-600 rounded-full p-0.5">
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                )}
                {paymentType && (
                  <Badge variant="secondary" className="text-xs h-6 gap-1 capitalize">
                    {paymentType}
                    <button onClick={() => setPaymentType('')} className="hover:text-red-600 rounded-full p-0.5">
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                )}
                {classFilter && (
                  <Badge variant="secondary" className="text-xs h-6 gap-1">
                    {classes.find((c) => String(c.class_id) === classFilter)?.name || 'Class'}
                    <button onClick={() => setClassFilter('')} className="hover:text-red-600 rounded-full p-0.5">
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                )}
                {(startDate || endDate) && (
                  <Badge variant="secondary" className="text-xs h-6 gap-1">
                    {startDate || '?'} &rarr; {endDate || '?'}
                    <button
                      onClick={() => { setStartDate(''); setEndDate(''); }}
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
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
                    <TableHead className="text-xs font-semibold">Receipt #</TableHead>
                    <TableHead className="text-xs font-semibold">Student</TableHead>
                    <TableHead className="text-xs font-semibold">Title</TableHead>
                    <TableHead className="text-xs font-semibold text-right">Amount</TableHead>
                    <TableHead className="text-xs font-semibold">Method</TableHead>
                    <TableHead className="text-xs font-semibold">Type</TableHead>
                    <TableHead className="text-xs font-semibold">Date</TableHead>
                    <TableHead className="text-xs font-semibold">Status</TableHead>
                    <TableHead className="text-xs font-semibold text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 8 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell>
                          <div className="space-y-1.5">
                            <Skeleton className="h-4 w-28" />
                            <Skeleton className="h-3 w-16" />
                          </div>
                        </TableCell>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-24 rounded-md" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-16 rounded-md" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-16 rounded-md" /></TableCell>
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
                      <TableCell colSpan={9} className="text-center py-16">
                        <EmptyState
                          hasFilters={hasActiveFilters}
                          onRecord={openRecordDialog}
                        />
                      </TableCell>
                    </TableRow>
                  ) : (
                    payments.map((p) => (
                      <TableRow key={p.payment_id} className="hover:bg-slate-50/50 group">
                        <TableCell className="text-xs text-slate-600 font-mono">
                          {p.receipt_code}
                        </TableCell>
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
                        <TableCell className="text-xs text-slate-600 max-w-[180px] truncate">
                          {p.title || p.invoice?.title || '\u2014'}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="text-sm font-mono font-semibold text-emerald-600">
                            {formatCurrency(p.amount)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <MethodBadge method={p.payment_method} />
                        </TableCell>
                        <TableCell>
                          <PaymentTypeBadge type={p.payment_type} />
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
                              onClick={() => handleViewReceipt(p)}
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
                  <EmptyState hasFilters={hasActiveFilters} onRecord={openRecordDialog} />
                </div>
              ) : (
                payments.map((p) => (
                  <div key={p.payment_id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium text-sm text-slate-900 truncate">
                          {p.student?.name || 'Unknown'}
                        </p>
                        <p className="text-[11px] text-slate-400 font-mono">
                          {p.receipt_code} &middot; {p.student?.student_code}
                        </p>
                      </div>
                      <span className="text-lg font-bold text-emerald-600 flex-shrink-0 tabular-nums">
                        {formatCurrency(p.amount)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <MethodBadge method={p.payment_method} />
                      <PaymentTypeBadge type={p.payment_type} />
                      <StatusBadge status={p.approval_status} />
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-500 bg-slate-50 rounded-lg p-2.5">
                      <div className="flex justify-between">
                        <span>Title</span>
                        <span className="text-slate-700 max-w-[160px] truncate">{p.title || '\u2014'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Date</span>
                        <span>{formatDate(p.timestamp)}</span>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-0.5">
                      <Button
                        variant="outline"
                        className="flex-1 min-h-[44px] text-xs"
                        onClick={() => handleViewReceipt(p)}
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
                  {getPageNumbers(page, totalPages).map((pn, idx) =>
                    pn === '...' ? (
                      <span key={`ellipsis-${idx}`} className="text-xs text-slate-400 px-1">...</span>
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
      {/*  Take Payment Dialog (CI3 modal_take_payment parity)              */}
      {/* ================================================================ */}
      <Dialog
        open={recordOpen}
        onOpenChange={(open) => {
          if (!open) resetPaymentForm();
          setRecordOpen(open);
        }}
      >
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                <Receipt className="w-4 h-4 text-emerald-600" />
              </div>
              Take Payment
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5">
            {/* ---- SELECT STUDENT ---- */}
            <div className="border-b border-b-slate-300 pb-4">
              <p className="text-slate-600 font-mono font-bold text-sm mb-3">SELECT STUDENT</p>
              {loadingStudent ? (
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full rounded-lg" />
                  <Skeleton className="h-12 w-full rounded-lg" />
                </div>
              ) : (
                <Select
                  value={selectedStudent ? String(selectedStudent.student_id) : ''}
                  onValueChange={(v) => {
                    const found = studentsOwing.find((s) => String(s.student_id) === v);
                    if (found) handleSelectStudent(found);
                  }}
                >
                  <SelectTrigger className="min-h-[52px] text-base">
                    <SelectValue placeholder="Search students who owe..." />
                  </SelectTrigger>
                  <SelectContent>
                    {studentsOwing.map((s) => (
                      <SelectItem key={s.student_id} value={String(s.student_id)}>
                        <span className="uppercase font-medium">{s.name}</span>
                        <span className="ml-2 text-slate-400 text-xs">
                          {s.class_name} (Owes: {formatCurrency(s.total_due)})
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* ---- STUDENT DETAILS ---- */}
            {selectedStudent && (
              <div className="grid grid-cols-2 gap-3">
                <p className="col-span-2 text-slate-600 font-mono font-bold text-sm border-b border-b-slate-400 pb-2">
                  STUDENT&apos;S DETAILS
                </p>
                <p className="text-sm font-semibold text-slate-400">NAME:</p>
                <p className="text-sm font-semibold text-slate-400 uppercase">{selectedStudent.name}</p>
                <p className="text-sm font-semibold text-slate-400">CLASS:</p>
                <p className="text-sm font-semibold text-slate-400 uppercase">{selectedStudent.class_name}</p>
                <p className="text-sm font-semibold text-slate-500">TOTAL PAYABLE:</p>
                <p className="text-sm font-semibold text-slate-500 uppercase">
                  {formatCurrency(selectedStudent.total_due)}
                </p>
              </div>
            )}

            {/* ---- PAYMENT FORM ---- */}
            {selectedStudent && (
              <>
                <Separator />

                {/* Payment Mode */}
                <div>
                  <Label className="block mb-2 font-bold text-slate-700 text-sm">PAYMENT MODE</Label>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger className="min-h-[52px] text-base">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">CASH</SelectItem>
                      <SelectItem value="mobile_money">MOBILE MONEY</SelectItem>
                      <SelectItem value="bank_transfer">BANK TRANSFER</SelectItem>
                      <SelectItem value="cheque">CHEQUE</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Amount */}
                <div>
                  <Label className="block mb-2 font-bold text-slate-700 text-sm">AMOUNT</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-400">GHS</span>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      className="pl-12 min-h-[52px] text-lg font-mono"
                      autoFocus
                    />
                  </div>
                </div>

                {/* Description (CI3: title/description field) */}
                <div>
                  <Label className="block mb-2 font-bold text-slate-700 text-sm">DESCRIPTION</Label>
                  <Textarea
                    placeholder="Payment description (e.g. School fees, Transport fee...)"
                    value={paymentDescription}
                    onChange={(e) => setPaymentDescription(e.target.value)}
                    className="min-h-[44px] resize-none"
                    rows={2}
                  />
                </div>

                {/* Conditional: Mobile Money fields */}
                {paymentMethod === 'mobile_money' && (
                  <div>
                    <Label className="block mb-2 font-bold text-slate-700 text-sm">TRANSACTION ID</Label>
                    <Input
                      placeholder="e.g. 60560211080"
                      value={momoTransactionId}
                      onChange={(e) => setMomoTransactionId(e.target.value)}
                      className="min-h-[44px] tracking-wider"
                    />
                  </div>
                )}

                {/* Conditional: Cheque fields */}
                {paymentMethod === 'cheque' && (
                  <div className="space-y-3">
                    <div>
                      <Label className="block mb-2 font-bold text-slate-700 text-sm">BANK NAME</Label>
                      <Input
                        placeholder="e.g. Ecobank"
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        className="min-h-[44px]"
                      />
                    </div>
                    <div>
                      <Label className="block mb-2 font-bold text-slate-700 text-sm">CHEQUE No.</Label>
                      <Input
                        placeholder="e.g. 00112345678123456789123"
                        value={chequeNumber}
                        onChange={(e) => setChequeNumber(e.target.value)}
                        className="min-h-[44px] tracking-wider"
                      />
                    </div>
                  </div>
                )}

                {/* Year and Term */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="block mb-2 font-bold text-slate-700 text-sm">YEAR</Label>
                    <Input
                      placeholder="e.g. 2024-2025"
                      value={paymentYear}
                      onChange={(e) => setPaymentYear(e.target.value)}
                      className="min-h-[44px]"
                    />
                  </div>
                  <div>
                    <Label className="block mb-2 font-bold text-slate-700 text-sm">TERM</Label>
                    <Select value={paymentTerm || '__none__'} onValueChange={(v) => setPaymentTerm(v === '__none__' ? '' : v)}>
                      <SelectTrigger className="min-h-[44px]">
                        <SelectValue placeholder="Select term" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">Select term</SelectItem>
                        <SelectItem value="Term 1">Term 1</SelectItem>
                        <SelectItem value="Term 2">Term 2</SelectItem>
                        <SelectItem value="Term 3">Term 3</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Print Receipt toggle */}
                <div className="flex items-center gap-3">
                  <Label className="block font-bold text-slate-500 uppercase text-sm">Print Receipt?</Label>
                  <button
                    type="button"
                    onClick={() => setPrintReceipt(!printReceipt)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      printReceipt ? 'bg-emerald-600' : 'bg-slate-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        printReceipt ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                  <span className="text-xs font-medium text-slate-500">{printReceipt ? 'YES' : 'NO'}</span>
                </div>
              </>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => { resetPaymentForm(); setRecordOpen(false); }}
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
                  Processing...
                </>
              ) : (
                <>
                  <Receipt className="w-4 h-4 mr-2" />
                  TAKE PAYMENT
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ================================================================ */}
      {/*  View Receipt Dialog (CI3 modal_receipt parity)                  */}
      {/* ================================================================ */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-sm max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                <Receipt className="w-4 h-4 text-emerald-600" />
              </div>
              Official Receipt
            </DialogTitle>
          </DialogHeader>

          {loadingReceipt ? (
            <div className="space-y-3 py-8">
              <Skeleton className="h-6 w-32 mx-auto" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4 mx-auto" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : viewPayment ? (
            <div ref={receiptRef}>
              <div className="receipt-container border border-slate-300 rounded-lg p-4">
                {/* Header */}
                <div className="text-center mb-4">
                  <p className="font-bold text-sm text-slate-900">School Manager</p>
                  <p className="text-[11px] text-slate-500">School Address</p>
                  <p className="text-[11px] text-slate-500">Phone | Email</p>
                  <div className="mt-2 inline-block bg-slate-900 text-white px-4 py-1.5 rounded-lg text-sm font-bold">
                    Official Receipt
                  </div>
                </div>

                {/* Student & payment details */}
                <table className="w-full text-xs mb-3">
                  <tbody>
                    <tr>
                      <th className="text-left text-slate-500 font-normal py-0.5">Received From:</th>
                      <td className="text-right font-medium capitalize">{viewPayment.student?.name || 'Unknown'}</td>
                    </tr>
                    <tr>
                      <th className="text-left text-slate-500 font-normal py-0.5">Year | Term:</th>
                      <td className="text-right">{viewPayment.year} | {viewPayment.term}</td>
                    </tr>
                    <tr>
                      <th className="text-left text-slate-500 font-normal py-0.5">Paid On:</th>
                      <td className="text-right">{formatReceiptDate(viewPayment.timestamp)}</td>
                    </tr>
                    <tr>
                      <th className="text-left text-slate-500 font-normal py-0.5">Receipt No.:</th>
                      <td className="text-right font-mono">{viewPayment.receipt_code}</td>
                    </tr>
                    <tr>
                      <th className="text-left text-slate-500 font-normal py-0.5">Invoice No.:</th>
                      <td className="text-right font-mono">
                        {viewPayment.invoice?.invoice_code || viewPayment.invoice_code || '\u2014'}
                      </td>
                    </tr>
                    <tr>
                      <th className="text-left text-slate-500 font-normal py-0.5">Currency:</th>
                      <td className="text-right">GHS</td>
                    </tr>
                    <tr>
                      <th className="text-left text-slate-500 font-normal py-0.5">Issued On:</th>
                      <td className="text-right">{formatReceiptDate(new Date().toISOString())}</td>
                    </tr>
                  </tbody>
                </table>

                {/* Items table */}
                <table className="w-full text-xs mb-2">
                  <thead>
                    <tr className="border-b border-slate-300">
                      <th className="text-left py-1 w-8">S/N</th>
                      <th className="text-left py-1">ITEM</th>
                      <th className="text-right py-1">PAID</th>
                    </tr>
                  </thead>
                  <tbody>
                    {receiptPayments.map((rp, idx) => (
                      <tr key={rp.payment_id} className="border-b border-dotted border-slate-200">
                        <td className="py-1">{idx + 1}</td>
                        <td className="py-1">{rp.title || 'Fee Payment'}</td>
                        <td className="text-right py-1 font-mono">
                          {rp.amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={3}><hr className="border-slate-300" /></td>
                    </tr>
                    <tr>
                      <td colSpan={2} className="text-right py-1 font-bold">Amount Paid:</td>
                      <td className="text-right py-1 font-bold font-mono">
                        {totalAmountPaid.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                      </td>
                    </tr>
                    <tr>
                      <td colSpan={2} className="text-right py-1">Total Payable:</td>
                      <td className="text-right py-1 font-mono">
                        {(totalAmountPaid + (viewPayment.due || 0)).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                      </td>
                    </tr>
                    <tr>
                      <td colSpan={2} className="text-right py-1 font-bold">Arrears:</td>
                      <td className="text-right py-1 font-bold font-mono">
                        {(viewPayment.due || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                      </td>
                    </tr>
                  </tfoot>
                </table>

                {/* Footer */}
                <hr className="border-slate-300 my-2" />
                <table className="w-full text-xs">
                  <tbody>
                    <tr>
                      <td className="py-1">
                        <strong>Cashier:</strong><br />
                        <span className="text-slate-500">System</span>
                        <hr />
                      </td>
                      <td className="text-right py-1 align-top">
                        <strong>Method:</strong><br />
                        <span className="capitalize">{viewPayment.payment_method?.replace(/_/g, ' ')}</span>
                        <hr />
                      </td>
                    </tr>
                  </tbody>
                </table>

                <div className="text-center mt-3 text-xs">
                  <p className="text-slate-500 italic">Excellence in Education!!!</p>
                  <p className="font-bold mt-1">Thank You</p>
                </div>
              </div>
            </div>
          ) : null}

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
              onClick={handlePrintReceipt}
              disabled={loadingReceipt}
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
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
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
              <span className="font-semibold text-slate-900">{deleteTarget ? formatCurrency(deleteTarget.amount) : ''}</span>{' '}
              from <span className="font-semibold text-slate-900">{deleteTarget?.student?.name}</span>?
              The linked invoice will be updated and the receipt will be removed. This action cannot be undone.
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
          Take Payment
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
