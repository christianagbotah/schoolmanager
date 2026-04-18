'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  ArrowLeft, FileText, Download, Printer, User, DollarSign,
  CheckCircle, Clock, AlertCircle, CreditCard,
} from 'lucide-react';
import { toast } from 'sonner';

/* ---------- types ---------- */

interface StudentInfo {
  student_id: number;
  student_code: string;
  name: string;
  first_name: string;
  last_name: string;
  sex: string;
  phone: string;
  email: string;
  class_name: string;
  section_name: string;
  year: string;
  term: string;
  admission_date: string | null;
  parent_name: string;
  parent_phone: string;
  parent_email: string;
}

interface StatementSummary {
  total_billed: number;
  total_paid: number;
  total_discount: number;
  balance: number;
  payment_status: string;
  invoice_count: number;
  payment_count: number;
  paid_invoices: number;
  partial_invoices: number;
  unpaid_invoices: number;
  last_payment_date: string | null;
}

interface FeeItem {
  invoice_id: number;
  invoice_code: string;
  title: string;
  amount: number;
  discount: number;
  paid: number;
  balance: number;
  status: string;
  created_at: string | null;
  due_date: string | null;
  year: string;
  term: string;
  payment_count: number;
}

interface PaymentEntry {
  type: 'invoice' | 'payment';
  date: string | null;
  amount: number;
  description: string;
  invoice_code: string;
  payment_method: string;
  receipt_no: string;
  running_balance: number;
}

interface StatementData {
  student: StudentInfo;
  summary: StatementSummary;
  fee_schedule: FeeItem[];
  payment_history: PaymentEntry[];
}

/* ---------- helpers ---------- */

function fmt(n: number) {
  return `GHS ${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(iso: string | null) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  } catch {
    return '—';
  }
}

function formatDateTime(iso: string | null) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return '—';
  }
}

function feeStatusBadge(status: string) {
  switch (status) {
    case 'paid':
      return <Badge className="bg-emerald-100 text-emerald-700 text-xs hover:bg-emerald-100">Paid</Badge>;
    case 'partial':
      return <Badge className="bg-amber-100 text-amber-700 text-xs hover:bg-amber-100">Partial</Badge>;
    case 'overdue':
      return <Badge className="bg-red-100 text-red-700 text-xs hover:bg-red-100">Overdue</Badge>;
    case 'unpaid':
      return <Badge className="bg-red-100 text-red-700 text-xs hover:bg-red-100">Unpaid</Badge>;
    default:
      return <Badge className="bg-slate-100 text-slate-500 text-xs hover:bg-slate-100">{status}</Badge>;
  }
}

/* ---------- main component ---------- */

export default function StudentStatementPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const studentId = searchParams.get('studentId') || '';
  const yearParam = searchParams.get('year') || '';
  const termParam = searchParams.get('term') || '';

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<StatementData | null>(null);

  const fetchStatement = useCallback(async () => {
    if (!studentId) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('studentId', studentId);
      if (yearParam) params.set('year', yearParam);
      if (termParam) params.set('term', termParam);

      const res = await fetch(`/api/admin/reports/student-accounts/statement?${params}`);
      if (!res.ok) throw new Error('Failed to load statement');
      const json: StatementData = await res.json();
      setData(json);
    } catch {
      toast.error('Failed to load student statement');
    }
    setLoading(false);
  }, [studentId, yearParam, termParam]);

  useEffect(() => {
    fetchStatement();
  }, [fetchStatement]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    if (!data) return;
    const feeHeaders = ['Invoice', 'Description', 'Amount', 'Discount', 'Paid', 'Balance', 'Status'];
    const feeRows = data.fee_schedule.map((f) => [
      f.invoice_code, f.title, f.amount.toFixed(2), f.discount.toFixed(2),
      f.paid.toFixed(2), f.balance.toFixed(2), f.status,
    ]);
    const payHeaders = ['Date', 'Type', 'Description', 'Amount', 'Method', 'Receipt', 'Running Balance'];
    const payRows = data.payment_history.map((p) => [
      formatDate(p.date), p.type === 'invoice' ? 'Billed' : 'Payment',
      p.description, p.amount.toFixed(2), p.payment_method,
      p.receipt_no, p.running_balance.toFixed(2),
    ]);

    const csv = [
      `Student: ${data.student.name} (${data.student.student_code})`,
      `Class: ${data.student.class_name} - ${data.student.section_name}`,
      `Period: ${data.student.year} / ${data.student.term}`,
      '',
      '=== Account Summary ===',
      `Total Billed,${data.summary.total_billed.toFixed(2)}`,
      `Total Paid,${data.summary.total_paid.toFixed(2)}`,
      `Balance,${data.summary.balance.toFixed(2)}`,
      '',
      '=== Fee Schedule ===',
      feeHeaders.join(','),
      ...feeRows.map((r) => r.map((c) => `"${c}"`).join(',')),
      '',
      '=== Transaction History ===',
      payHeaders.join(','),
      ...payRows.map((r) => r.map((c) => `"${c}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `statement-${data.student.student_code}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Statement exported successfully');
  };

  if (!studentId) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <AlertCircle className="w-12 h-12 mb-3 opacity-50" />
          <p className="text-lg font-medium">No student selected</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => router.push('/admin/reports/student-accounts')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Reports
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
          <Button
            variant="ghost"
            onClick={() => router.push('/admin/reports/student-accounts')}
            className="min-h-[44px] w-fit"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Reports
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleExportCSV} className="min-h-[44px]">
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
            <Button variant="outline" onClick={handlePrint} className="min-h-[44px]">
              <Printer className="w-4 h-4 mr-2" />
              Print Statement
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="space-y-6">
            <Skeleton className="h-32 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-64 rounded-xl" />
          </div>
        ) : !data ? (
          <Card>
            <CardContent className="py-12 text-center text-slate-400">
              <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-lg font-medium">Student not found</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Print Header - only visible when printing */}
            <div className="hidden print:block mb-6">
              <div className="flex items-center justify-between border-b-2 border-slate-800 pb-4 mb-4">
                <div>
                  <h1 className="text-xl font-bold text-slate-900">Student Account Statement</h1>
                  <p className="text-sm text-slate-500">
                    Generated: {new Date().toLocaleDateString('en-GB')}
                  </p>
                </div>
                <div className="text-right text-sm text-slate-500">
                  <p>Period: {data.student.year} / {data.student.term}</p>
                </div>
              </div>
            </div>

            {/* Student Info Header */}
            <Card className="border-teal-100 print:shadow-none print:border-slate-300">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                  {/* Avatar */}
                  <div className="w-16 h-16 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0">
                    <User className="w-8 h-8 text-teal-700" />
                  </div>
                  {/* Info */}
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-2">
                    <div>
                      <p className="text-xs text-slate-400 uppercase tracking-wide">Student Name</p>
                      <p className="font-semibold text-slate-900">{data.student.name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 uppercase tracking-wide">Admission No</p>
                      <p className="font-medium text-slate-700 font-mono">{data.student.student_code}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 uppercase tracking-wide">Class</p>
                      <p className="font-medium text-slate-700">
                        {data.student.class_name} — {data.student.section_name}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 uppercase tracking-wide">Academic Year</p>
                      <p className="font-medium text-slate-700">{data.student.year}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 uppercase tracking-wide">Term</p>
                      <p className="font-medium text-slate-700">{data.student.term}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 uppercase tracking-wide">Parent / Guardian</p>
                      <p className="font-medium text-slate-700">{data.student.parent_name}</p>
                      {data.student.parent_phone && (
                        <p className="text-xs text-slate-400">{data.student.parent_phone}</p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Account Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 print:grid-cols-4 print:gap-3">
              <Card className="border-sky-100 bg-sky-50/50 print:shadow-none print:border-slate-300 print:bg-white">
                <CardContent className="p-4 text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <FileText className="w-3 h-3 text-sky-500" />
                    <p className="text-[10px] text-slate-500 uppercase">Total Billed</p>
                  </div>
                  <p className="text-lg font-bold text-sky-700">{fmt(data.summary.total_billed)}</p>
                </CardContent>
              </Card>
              <Card className="border-emerald-100 bg-emerald-50/50 print:shadow-none print:border-slate-300 print:bg-white">
                <CardContent className="p-4 text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <CheckCircle className="w-3 h-3 text-emerald-500" />
                    <p className="text-[10px] text-slate-500 uppercase">Total Paid</p>
                  </div>
                  <p className="text-lg font-bold text-emerald-700">{fmt(data.summary.total_paid)}</p>
                </CardContent>
              </Card>
              <Card className={`print:shadow-none print:border-slate-300 print:bg-white ${
                data.summary.balance <= 0 ? 'border-emerald-100 bg-emerald-50/50' : 'border-red-100 bg-red-50/50'
              }`}>
                <CardContent className="p-4 text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <DollarSign className={`w-3 h-3 ${data.summary.balance <= 0 ? 'text-emerald-500' : 'text-red-500'}`} />
                    <p className="text-[10px] text-slate-500 uppercase">Balance</p>
                  </div>
                  <p className={`text-lg font-bold ${data.summary.balance <= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                    {fmt(Math.abs(data.summary.balance))}
                    {data.summary.balance > 0 && <span className="text-xs ml-1">owed</span>}
                    {data.summary.balance < 0 && <span className="text-xs ml-1">credit</span>}
                  </p>
                </CardContent>
              </Card>
              <Card className="print:shadow-none print:border-slate-300 print:bg-white">
                <CardContent className="p-4 text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    {data.summary.payment_status === 'paid' ? (
                      <CheckCircle className="w-3 h-3 text-emerald-500" />
                    ) : data.summary.payment_status === 'partial' ? (
                      <Clock className="w-3 h-3 text-amber-500" />
                    ) : (
                      <AlertCircle className="w-3 h-3 text-red-500" />
                    )}
                    <p className="text-[10px] text-slate-500 uppercase">Status</p>
                  </div>
                  <p className={`text-lg font-bold ${
                    data.summary.payment_status === 'paid' ? 'text-emerald-700' :
                    data.summary.payment_status === 'partial' ? 'text-amber-700' : 'text-red-700'
                  }`}>
                    {data.summary.payment_status === 'paid' ? 'Paid in Full' :
                     data.summary.payment_status === 'partial' ? 'Partially Paid' :
                     data.summary.payment_status === 'no_fees' ? 'No Fees' : 'Outstanding'}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Fee Schedule */}
            <Card className="border-slate-200/60 print:shadow-none print:border-slate-300">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-medium text-slate-800 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-teal-600" />
                  Fee Schedule
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50">
                        <TableHead>Invoice</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead className="text-right">Discount</TableHead>
                        <TableHead className="text-right">Paid</TableHead>
                        <TableHead className="text-right">Balance</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="hidden lg:table-cell">Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.fee_schedule.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-8 text-slate-400">
                            No fee items found for the selected period
                          </TableCell>
                        </TableRow>
                      ) : (
                        data.fee_schedule.map((fee) => (
                          <TableRow key={fee.invoice_id} className="hover:bg-slate-50">
                            <TableCell className="font-mono text-xs">{fee.invoice_code}</TableCell>
                            <TableCell className="text-sm">{fee.title}</TableCell>
                            <TableCell className="text-right text-sm">{fmt(fee.amount)}</TableCell>
                            <TableCell className="text-right text-sm text-emerald-600">
                              {fee.discount > 0 ? fmt(fee.discount) : '—'}
                            </TableCell>
                            <TableCell className="text-right text-sm text-emerald-600">
                              {fmt(fee.paid)}
                            </TableCell>
                            <TableCell className={`text-right text-sm font-medium ${
                              fee.balance <= 0 ? 'text-emerald-600' : 'text-red-600'
                            }`}>
                              {fmt(fee.balance)}
                            </TableCell>
                            <TableCell>{feeStatusBadge(fee.status)}</TableCell>
                            <TableCell className="hidden lg:table-cell text-xs text-slate-500">
                              {formatDate(fee.created_at)}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
                {data.fee_schedule.length > 0 && (
                  <div className="px-4 py-3 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-1 text-xs text-slate-500">
                    <span>{data.fee_schedule.length} invoice(s)</span>
                    <div className="flex items-center gap-4">
                      <span>Paid: <strong className="text-emerald-600">{data.summary.paid_invoices}</strong></span>
                      <span>Partial: <strong className="text-amber-600">{data.summary.partial_invoices}</strong></span>
                      <span>Unpaid: <strong className="text-red-600">{data.summary.unpaid_invoices}</strong></span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Transaction History */}
            <Card className="border-slate-200/60 print:shadow-none print:border-slate-300">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-medium text-slate-800 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-teal-600" />
                  Transaction History
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50">
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead className="hidden md:table-cell">Method</TableHead>
                        <TableHead className="hidden lg:table-cell">Receipt</TableHead>
                        <TableHead className="text-right">Running Balance</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.payment_history.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-slate-400">
                            No transactions found
                          </TableCell>
                        </TableRow>
                      ) : (
                        data.payment_history.map((entry, i) => (
                          <TableRow
                            key={i}
                            className={`hover:bg-slate-50 ${
                              entry.type === 'payment' ? 'bg-emerald-50/30' : ''
                            }`}
                          >
                            <TableCell className="text-xs text-slate-600">
                              {formatDate(entry.date)}
                            </TableCell>
                            <TableCell>
                              {entry.type === 'invoice' ? (
                                <Badge className="bg-sky-100 text-sky-700 text-[10px] hover:bg-sky-100">
                                  Billed
                                </Badge>
                              ) : (
                                <Badge className="bg-emerald-100 text-emerald-700 text-[10px] hover:bg-emerald-100">
                                  Payment
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-sm">{entry.description}</TableCell>
                            <TableCell className={`text-right text-sm font-medium ${
                              entry.type === 'invoice' ? 'text-slate-900' : 'text-emerald-600'
                            }`}>
                              {entry.type === 'invoice' ? '+' : '-'}{fmt(entry.amount)}
                            </TableCell>
                            <TableCell className="hidden md:table-cell text-xs text-slate-500">
                              {entry.payment_method || '—'}
                            </TableCell>
                            <TableCell className="hidden lg:table-cell font-mono text-xs text-slate-500">
                              {entry.receipt_no || '—'}
                            </TableCell>
                            <TableCell className={`text-right text-sm font-medium ${
                              entry.running_balance <= 0 ? 'text-emerald-600' : 'text-red-600'
                            }`}>
                              {fmt(entry.running_balance)}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
                {data.payment_history.length > 0 && (
                  <div className="px-4 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
                    <span>{data.payment_history.length} transaction(s)</span>
                    <span>
                      Last payment:{' '}
                      <strong>{formatDateTime(data.summary.last_payment_date)}</strong>
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Account Summary Footer */}
            <Card className="border-slate-300 print:shadow-none">
              <CardContent className="p-6">
                <h3 className="text-sm font-semibold text-slate-800 mb-4 uppercase tracking-wide">
                  Account Summary
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs text-slate-400">Total Invoices</p>
                    <p className="text-lg font-bold text-slate-900">{data.summary.invoice_count}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-slate-400">Total Payments</p>
                    <p className="text-lg font-bold text-slate-900">{data.summary.payment_count}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-slate-400">Total Discount Applied</p>
                    <p className="text-lg font-bold text-emerald-600">
                      {fmt(data.summary.total_discount)}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-slate-400">Outstanding Balance</p>
                    <p className={`text-lg font-bold ${
                      data.summary.balance <= 0 ? 'text-emerald-600' : 'text-red-600'
                    }`}>
                      {fmt(data.summary.balance)}
                    </p>
                  </div>
                </div>

                <Separator className="my-4" />

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-400">
                  <p>
                    Statement generated on{' '}
                    {new Date().toLocaleDateString('en-GB', {
                      day: '2-digit', month: 'long', year: 'numeric',
                    })}
                  </p>
                  <p className="font-mono">
                    Student: {data.student.name} ({data.student.student_code})
                  </p>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
