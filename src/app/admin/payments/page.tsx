'use client';

import { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  Search,
  Plus,
  Download,
  CreditCard,
  DollarSign,
  Calendar,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Receipt,
  FileDown,
  Eye,
  Trash2,
} from 'lucide-react';

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

const methodColors: Record<string, string> = {
  cash: 'bg-emerald-100 text-emerald-700',
  mobile_money: 'bg-violet-100 text-violet-700',
  bank_transfer: 'bg-sky-100 text-sky-700',
  cheque: 'bg-amber-100 text-amber-700',
  card: 'bg-rose-100 text-rose-700',
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-UG', { style: 'currency', currency: 'UGX', minimumFractionDigits: 0 }).format(amount);
}

function formatDate(dateStr: string) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatDateTime(dateStr: string) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [method, setMethod] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [year, setYear] = useState('');
  const [term, setTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [summary, setSummary] = useState({ totalCollected: 0, todayTotal: 0, monthTotal: 0 });

  // Record Payment Dialog
  const [recordOpen, setRecordOpen] = useState(false);
  const [studentSearch, setStudentSearch] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [studentInvoices, setStudentInvoices] = useState<Invoice[]>([]);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [payYear, setPayYear] = useState('2026');
  const [payTerm, setPayTerm] = useState('Term 1');
  const [recording, setRecording] = useState(false);

  // View dialog
  const [viewOpen, setViewOpen] = useState(false);
  const [viewPayment, setViewPayment] = useState<Payment | null>(null);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (method) params.set('method', method);
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);
      if (year) params.set('year', year);
      if (term) params.set('term', term);
      params.set('page', String(page));
      params.set('limit', '15');

      const res = await fetch(`/api/admin/payments?${params}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setPayments(data.payments || []);
      setSummary(data.summary || { totalCollected: 0, todayTotal: 0, monthTotal: 0 });
      setTotalPages(data.pagination?.totalPages || 1);
      setTotal(data.pagination?.total || 0);
    } catch {
      toast.error('Failed to load payments');
    } finally {
      setLoading(false);
    }
  }, [search, method, startDate, endDate, year, term, page]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchPayments();
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [method, startDate, endDate, year, term]);

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
      // silent
    }
  };

  const handleSelectStudent = async (student: any) => {
    setSelectedStudent(student);
    setStudentSearch('');
    setSearchResults([]);
    // Fetch unpaid invoices
    try {
      const res = await fetch(`/api/admin/invoices?search=${encodeURIComponent(student.student_code)}&status=unpaid&limit=50`);
      const data = await res.json();
      setStudentInvoices((data.invoices || []).filter((inv: any) => inv.due > 0));
    } catch {
      setStudentInvoices([]);
    }
  };

  const handleRecordPayment = async () => {
    if (!selectedStudent || !paymentAmount || parseFloat(paymentAmount) <= 0) {
      toast.error('Student and valid amount are required');
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
          year: payYear,
          term: payTerm,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast.success(data.message || `Payment recorded. Receipt: ${data.receiptCode}`);
      setRecordOpen(false);
      resetPaymentForm();
      fetchPayments();
    } catch (err: any) {
      toast.error(err.message || 'Failed to record payment');
    } finally {
      setRecording(false);
    }
  };

  const resetPaymentForm = () => {
    setSelectedStudent(null);
    setSearchResults([]);
    setStudentInvoices([]);
    setSelectedInvoiceId('');
    setPaymentAmount('');
    setPaymentMethod('cash');
    setStudentSearch('');
  };

  const handleExportCSV = () => {
    const headers = ['Receipt #', 'Student', 'Invoice', 'Amount', 'Method', 'Date', 'Status'];
    const rows = payments.map((p) => [
      p.receipt_code,
      p.student?.name || '',
      p.invoice?.invoice_code || p.invoice_code || '',
      p.amount,
      p.payment_method,
      formatDateTime(p.timestamp),
      p.approval_status,
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payments-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exported');
  };

  const handleDeletePayment = async (id: number) => {
    try {
      const res = await fetch(`/api/admin/payments/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast.success('Payment deleted');
      fetchPayments();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete payment');
    }
  };

  const selectedInvoice = studentInvoices.find((inv) => inv.invoice_id === Number(selectedInvoiceId));

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Payments</h1>
            <p className="text-sm text-slate-500 mt-1">Track and record fee payments</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExportCSV} className="border-emerald-200 text-emerald-700 hover:bg-emerald-50">
              <FileDown className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
            <Button
              onClick={() => { setRecordOpen(true); resetPaymentForm(); }}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Record Payment
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border-emerald-100">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">Today</p>
                  <p className="text-lg font-bold text-emerald-700">{formatCurrency(summary.todayTotal)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-emerald-100">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">This Month</p>
                  <p className="text-lg font-bold text-emerald-700">{formatCurrency(summary.monthTotal)}</p>
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
                  <p className="text-xs text-slate-500 font-medium">All Time</p>
                  <p className="text-lg font-bold text-slate-900">{formatCurrency(summary.totalCollected)}</p>
                </div>
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
                <Input
                  placeholder="Search student name or receipt number..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <Select value={method} onValueChange={(v) => v === '__all__' ? setMethod('') : setMethod(v)}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Method" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">All Methods</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="mobile_money">Mobile Money</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="cheque">Cheque</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                  </SelectContent>
                </Select>
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full" />
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full" />
                <Select value={year} onValueChange={(v) => v === '__all__' ? setYear('') : setYear(v)}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Year" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">All Years</SelectItem>
                    <SelectItem value="2026">2026</SelectItem>
                    <SelectItem value="2025">2025</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={term} onValueChange={(v) => v === '__all__' ? setTerm('') : setTerm(v)}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Term" /></SelectTrigger>
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

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            {/* Desktop */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="text-xs font-semibold">Receipt #</TableHead>
                    <TableHead className="text-xs font-semibold">Student</TableHead>
                    <TableHead className="text-xs font-semibold">Invoice</TableHead>
                    <TableHead className="text-xs font-semibold text-right">Amount</TableHead>
                    <TableHead className="text-xs font-semibold">Method</TableHead>
                    <TableHead className="text-xs font-semibold">Date</TableHead>
                    <TableHead className="text-xs font-semibold">Status</TableHead>
                    <TableHead className="text-xs font-semibold text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        {Array.from({ length: 8 }).map((_, j) => (
                          <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : payments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-12 text-slate-400">
                        <CreditCard className="w-10 h-10 mx-auto mb-2 opacity-50" />
                        <p>No payments found</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    payments.map((p) => (
                      <TableRow key={p.payment_id} className="hover:bg-slate-50/50">
                        <TableCell className="font-mono text-xs">{p.receipt_code}</TableCell>
                        <TableCell>
                          <p className="font-medium text-sm">{p.student?.name || 'Unknown'}</p>
                          <p className="text-xs text-slate-400">{p.student?.student_code}</p>
                        </TableCell>
                        <TableCell className="text-xs">{p.invoice?.invoice_code || p.invoice_code || '—'}</TableCell>
                        <TableCell className="text-right text-sm font-mono font-medium text-emerald-600">{formatCurrency(p.amount)}</TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize ${methodColors[p.payment_method] || 'bg-gray-100 text-gray-600'}`}>
                            {p.payment_method.replace(/_/g, ' ')}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs text-slate-500">{formatDateTime(p.timestamp)}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={p.approval_status === 'approved' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-amber-100 text-amber-700 border-amber-200'}>
                            {p.approval_status || 'pending'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setViewPayment(p); setViewOpen(true); }} title="View">
                              <Eye className="w-3.5 h-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600" onClick={() => handleDeletePayment(p.payment_id)} title="Delete">
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Mobile */}
            <div className="md:hidden divide-y">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="p-4 space-y-2"><Skeleton className="h-4 w-3/4" /><Skeleton className="h-3 w-1/2" /></div>
                ))
              ) : payments.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <CreditCard className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p>No payments found</p>
                </div>
              ) : (
                payments.map((p) => (
                  <div key={p.payment_id} className="p-4 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-mono text-xs text-slate-500">{p.receipt_code}</p>
                        <p className="font-medium text-sm">{p.student?.name || 'Unknown'}</p>
                      </div>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize ${methodColors[p.payment_method] || 'bg-gray-100 text-gray-600'}`}>
                        {p.payment_method.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-500">{formatDateTime(p.timestamp)}</span>
                      <span className="text-lg font-bold text-emerald-600">{formatCurrency(p.amount)}</span>
                    </div>
                    <div className="flex gap-2 pt-1">
                      <Button variant="outline" size="sm" className="flex-1 h-8 text-xs" onClick={() => { setViewPayment(p); setViewOpen(true); }}><Eye className="w-3 h-3 mr-1" />View</Button>
                      <Button variant="outline" size="sm" className="h-8 text-xs text-red-500" onClick={() => handleDeletePayment(p.payment_id)}><Trash2 className="w-3 h-3" /></Button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t">
                <p className="text-xs text-slate-500">{total} payment(s) total</p>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="icon" className="h-8 w-8" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-sm px-2">{page} / {totalPages}</span>
                  <Button variant="outline" size="icon" className="h-8 w-8" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Record Payment Dialog */}
      <Dialog open={recordOpen} onOpenChange={(open) => { if (!open) resetPaymentForm(); setRecordOpen(open); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-emerald-600" />
              Record Payment
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {!selectedStudent ? (
              <div>
                <Label className="text-xs mb-2 block">Search Student</Label>
                <Input
                  placeholder="Type name or student code..."
                  value={studentSearch}
                  onChange={(e) => handleSearchStudents(e.target.value)}
                />
                {searchResults.length > 0 && (
                  <div className="mt-2 max-h-48 overflow-y-auto border rounded-lg">
                    {searchResults.map((s: any) => (
                      <button
                        key={s.student_id}
                        className="w-full text-left px-3 py-2 hover:bg-emerald-50 border-b last:border-0 text-sm transition-colors"
                        onClick={() => handleSelectStudent(s)}
                      >
                        <span className="font-medium">{s.name}</span>
                        <span className="text-slate-400 ml-2">({s.student_code})</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <>
                <div className="bg-emerald-50 rounded-lg p-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{selectedStudent.name}</p>
                    <p className="text-xs text-slate-500">{selectedStudent.student_code}</p>
                  </div>
                  <Button variant="ghost" size="sm" className="text-xs" onClick={() => { setSelectedStudent(null); setStudentInvoices([]); }}>
                    Change
                  </Button>
                </div>

                {studentInvoices.length > 0 && (
                  <div>
                    <Label className="text-xs mb-2 block">Link to Invoice (Optional)</Label>
                    <Select value={selectedInvoiceId} onValueChange={setSelectedInvoiceId}>
                      <SelectTrigger><SelectValue placeholder="Select invoice" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">No specific invoice</SelectItem>
                        {studentInvoices.map((inv) => (
                          <SelectItem key={inv.invoice_id} value={String(inv.invoice_id)}>
                            {inv.invoice_code} — Due: {formatCurrency(inv.due)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedInvoice && (
                      <p className="text-xs text-slate-500 mt-1">Outstanding: {formatCurrency(selectedInvoice.due)}</p>
                    )}
                  </div>
                )}

                <div>
                  <Label className="text-xs">Amount</Label>
                  <Input
                    type="number"
                    placeholder="Enter amount"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="mt-1 text-lg font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Payment Method</Label>
                    <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
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
                    <Label className="text-xs">Term</Label>
                    <Select value={payTerm} onValueChange={setPayTerm}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Term 1">Term 1</SelectItem>
                        <SelectItem value="Term 2">Term 2</SelectItem>
                        <SelectItem value="Term 3">Term 3</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { resetPaymentForm(); setRecordOpen(false); }}>Cancel</Button>
            <Button
              onClick={handleRecordPayment}
              disabled={recording || !selectedStudent || !paymentAmount}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {recording ? 'Recording...' : 'Record Payment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Payment Dialog */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Payment Details</DialogTitle>
          </DialogHeader>
          {viewPayment && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><p className="text-xs text-slate-400">Receipt #</p><p className="font-mono font-medium">{viewPayment.receipt_code}</p></div>
                <div><p className="text-xs text-slate-400">Amount</p><p className="font-mono font-bold text-emerald-600 text-lg">{formatCurrency(viewPayment.amount)}</p></div>
                <div><p className="text-xs text-slate-400">Student</p><p className="font-medium">{viewPayment.student?.name}</p></div>
                <div><p className="text-xs text-slate-400">Method</p><p className="capitalize">{viewPayment.payment_method.replace(/_/g, ' ')}</p></div>
                <div><p className="text-xs text-slate-400">Invoice</p><p className="font-mono text-xs">{viewPayment.invoice?.invoice_code || '—'}</p></div>
                <div><p className="text-xs text-slate-400">Status</p><Badge variant="outline" className={viewPayment.approval_status === 'approved' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : ''}>{viewPayment.approval_status}</Badge></div>
              </div>
              <div className="text-xs text-slate-400 border-t pt-2 mt-2">
                {formatDateTime(viewPayment.timestamp)} &middot; {viewPayment.year} / {viewPayment.term}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
