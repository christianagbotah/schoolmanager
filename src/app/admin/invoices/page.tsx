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
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  FileText,
  Search,
  Plus,
  Printer,
  Eye,
  Pencil,
  Trash2,
  Users,
  DollarSign,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Receipt,
} from 'lucide-react';

interface Invoice {
  invoice_id: number;
  student_id: number;
  title: string;
  description: string;
  amount: number;
  amount_paid: number;
  due: number;
  discount: number;
  creation_timestamp: string;
  payment_timestamp: string | null;
  method: string;
  status: string;
  year: string;
  term: string;
  class_id: number | null;
  invoice_code: string;
  class_name: string;
  student: {
    student_id: number;
    name: string;
    first_name: string;
    last_name: string;
    student_code: string;
  };
}

interface BillItem {
  id: number;
  title: string;
  description: string;
  amount: number;
  bill_category_id: number | null;
  bill_category: { bill_category_name: string } | null;
}

interface SchoolClass {
  class_id: number;
  name: string;
  category: string;
  _count: { enrolls: number };
}

const statusConfig: Record<string, { label: string; className: string }> = {
  paid: { label: 'Paid', className: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  partial: { label: 'Partial', className: 'bg-amber-100 text-amber-700 border-amber-200' },
  unpaid: { label: 'Unpaid', className: 'bg-gray-100 text-gray-600 border-gray-200' },
  overdue: { label: 'Overdue', className: 'bg-red-100 text-red-700 border-red-200' },
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-UG', { style: 'currency', currency: 'UGX', minimumFractionDigits: 0 }).format(amount);
}

function formatDate(dateStr: string) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [classId, setClassId] = useState('');
  const [status, setStatus] = useState('');
  const [year, setYear] = useState('');
  const [term, setTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [summary, setSummary] = useState({ totalBilled: 0, totalCollected: 0, outstanding: 0 });
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [billItems, setBillItems] = useState<BillItem[]>([]);

  // Create Invoice Dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [createStudents, setCreateStudents] = useState<any[]>([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([]);
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [createYear, setCreateYear] = useState('2026');
  const [createTerm, setCreateTerm] = useState('Term 1');
  const [createClassId, setCreateClassId] = useState('');
  const [creating, setCreating] = useState(false);

  // Mass Bill Dialog
  const [massBillOpen, setMassBillOpen] = useState(false);
  const [massBillClassId, setMassBillClassId] = useState('');
  const [massBillYear, setMassBillYear] = useState('2026');
  const [massBillTerm, setMassBillTerm] = useState('Term 1');
  const [massBillItems, setMassBillItems] = useState<number[]>([]);
  const [massBilling, setMassBilling] = useState(false);

  // View Dialog
  const [viewOpen, setViewOpen] = useState(false);
  const [viewInvoice, setViewInvoice] = useState<any>(null);
  const [viewLoading, setViewLoading] = useState(false);

  // Edit Dialog
  const [editOpen, setEditOpen] = useState(false);
  const [editInvoice, setEditInvoice] = useState<Invoice | null>(null);
  const [editForm, setEditForm] = useState({ title: '', amount: 0, discount: 0, status: '', year: '', term: '' });
  const [editing, setEditing] = useState(false);

  // Delete Dialog
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (classId) params.set('classId', classId);
      if (status) params.set('status', status);
      if (year) params.set('year', year);
      if (term) params.set('term', term);
      params.set('page', String(page));
      params.set('limit', '15');

      const res = await fetch(`/api/invoices?${params}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setInvoices(data.invoices || []);
      setSummary(data.summary || { totalBilled: 0, totalCollected: 0, outstanding: 0 });
      setTotalPages(data.pagination?.totalPages || 1);
      setTotal(data.pagination?.total || 0);
    } catch {
      toast.error('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  }, [search, classId, status, year, term, page]);

  const fetchClasses = useCallback(async () => {
    try {
      const res = await fetch('/api/classes');
      const data = await res.json();
      setClasses(data || []);
    } catch {
      // silent
    }
  }, []);

  const fetchBillItems = useCallback(async () => {
    try {
      const res = await fetch('/api/bill-items');
      const data = await res.json();
      setBillItems(data || []);
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  useEffect(() => {
    fetchClasses();
    fetchBillItems();
  }, [fetchClasses, fetchBillItems]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchInvoices();
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [classId, status, year, term]);

  const handleSearchStudents = async (query: string) => {
    setStudentSearch(query);
    if (query.length < 2) {
      setCreateStudents([]);
      return;
    }
    try {
      const res = await fetch(`/api/students?search=${encodeURIComponent(query)}&limit=20`);
      const data = await res.json();
      setCreateStudents(data.students || []);
    } catch {
      // silent
    }
  };

  const handleCreateInvoice = async () => {
    if (selectedStudentIds.length === 0) {
      toast.error('Select at least one student');
      return;
    }
    if (selectedItems.length === 0) {
      toast.error('Select at least one billing item');
      return;
    }
    setCreating(true);
    try {
      const items = billItems.filter((i) => selectedItems.includes(i.id)).map((i) => ({
        title: i.title,
        amount: i.amount,
      }));
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentIds: selectedStudentIds,
          items,
          year: createYear,
          term: createTerm,
          classId: createClassId || null,
          className: classes.find((c) => c.class_id === Number(createClassId))?.name || '',
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast.success(data.message || 'Invoice(s) created successfully');
      setCreateOpen(false);
      setSelectedStudentIds([]);
      setSelectedItems([]);
      fetchInvoices();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create invoice');
    } finally {
      setCreating(false);
    }
  };

  const handleMassBill = async () => {
    if (!massBillClassId) {
      toast.error('Select a class');
      return;
    }
    if (massBillItems.length === 0) {
      toast.error('Select at least one billing item');
      return;
    }
    setMassBilling(true);
    try {
      const items = billItems.filter((i) => massBillItems.includes(i.id)).map((i) => ({
        title: i.title,
        amount: i.amount,
      }));
      const res = await fetch('/api/invoices/mass-create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classId: massBillClassId,
          items,
          year: massBillYear,
          term: massBillTerm,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast.success(data.message || 'Mass billing completed');
      setMassBillOpen(false);
      setMassBillItems([]);
      fetchInvoices();
    } catch (err: any) {
      toast.error(err.message || 'Mass billing failed');
    } finally {
      setMassBilling(false);
    }
  };

  const handleViewInvoice = async (id: number) => {
    setViewOpen(true);
    setViewLoading(true);
    try {
      const res = await fetch(`/api/invoices/${id}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setViewInvoice(data);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load invoice');
      setViewOpen(false);
    } finally {
      setViewLoading(false);
    }
  };

  const handleEditInvoice = (inv: Invoice) => {
    setEditInvoice(inv);
    setEditForm({
      title: inv.title,
      amount: inv.amount,
      discount: inv.discount,
      status: inv.status,
      year: inv.year,
      term: inv.term,
    });
    setEditOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editInvoice) return;
    setEditing(true);
    try {
      const res = await fetch(`/api/invoices/${editInvoice.invoice_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast.success('Invoice updated');
      setEditOpen(false);
      fetchInvoices();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update invoice');
    } finally {
      setEditing(false);
    }
  };

  const handleDeleteInvoice = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/invoices/${deleteId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast.success('Invoice deleted');
      setDeleteOpen(false);
      setDeleteId(null);
      fetchInvoices();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete invoice');
    } finally {
      setDeleting(false);
    }
  };

  const handlePrint = (inv: Invoice) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    const sc = statusConfig[inv.status] || statusConfig.unpaid;
    printWindow.document.write(`
      <html><head><title>Invoice ${inv.invoice_code}</title>
      <style>body{font-family:Arial;padding:40px;color:#333}table{width:100%;border-collapse:collapse;margin:16px 0}th,td{border:1px solid #ddd;padding:8px;text-align:left}th{background:#f5f5f5}.header{display:flex;justify-content:space-between;margin-bottom:24px}h2{color:#059669;margin:0}</style></head>
      <body><div class="header"><div><h2>INVOICE</h2><p><strong>${inv.invoice_code}</strong></p></div><div style="text-align:right"><p><strong>Status:</strong> <span style="padding:2px 8px;border-radius:4px;font-size:12px;background:${inv.status === 'paid' ? '#d1fae5' : inv.status === 'overdue' ? '#fee2e2' : '#f3f4f6'}">${sc.label.toUpperCase()}</span></p><p>Date: ${formatDate(inv.creation_timestamp)}</p></div></div>
      <p><strong>Student:</strong> ${inv.student?.name || 'Unknown'} (${inv.student?.student_code || ''})</p>
      <p><strong>Class:</strong> ${inv.class_name || '—'} &nbsp;|&nbsp; <strong>Term:</strong> ${inv.term} &nbsp;|&nbsp; <strong>Year:</strong> ${inv.year}</p>
      <hr style="margin:16px 0">
      <table><thead><tr><th>Description</th><th>Amount</th><th>Paid</th><th>Due</th></tr></thead><tbody>
      <tr><td>${inv.description || inv.title}</td><td>${formatCurrency(inv.amount)}</td><td>${formatCurrency(inv.amount_paid)}</td><td style="font-weight:bold;color:${inv.due > 0 ? '#dc2626' : '#059669'}">${formatCurrency(inv.due)}</td></tr>
      </tbody></table>
      <div style="margin-top:32px;text-align:center;color:#888;font-size:12px">Generated on ${new Date().toLocaleString()}</div>
      </body></html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const toggleStudentSelection = (studentId: number) => {
    setSelectedStudentIds((prev) =>
      prev.includes(studentId) ? prev.filter((id) => id !== studentId) : [...prev, studentId]
    );
  };

  const toggleItemSelection = (itemId: number, isMass: boolean = false) => {
    if (isMass) {
      setMassBillItems((prev) =>
        prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]
      );
    } else {
      setSelectedItems((prev) =>
        prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]
      );
    }
  };

  const getSelectedTotal = (items: number[]) =>
    billItems.filter((i) => items.includes(i.id)).reduce((sum, i) => sum + i.amount, 0);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Invoices</h1>
            <p className="text-sm text-slate-500 mt-1">Manage student invoices and billing</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setMassBillOpen(true);
                setMassBillItems([]);
              }}
              className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
            >
              <Users className="w-4 h-4 mr-2" />
              Mass Bill Class
            </Button>
            <Button
              onClick={() => {
                setCreateOpen(true);
                setSelectedStudentIds([]);
                setSelectedItems([]);
              }}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Invoice
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border-emerald-100">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">Total Billed</p>
                  <p className="text-lg font-bold text-slate-900">{formatCurrency(summary.totalBilled)}</p>
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
                  <p className="text-xs text-slate-500 font-medium">Total Collected</p>
                  <p className="text-lg font-bold text-emerald-700">{formatCurrency(summary.totalCollected)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-red-100">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">Outstanding</p>
                  <p className="text-lg font-bold text-red-600">{formatCurrency(summary.outstanding)}</p>
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
                  placeholder="Search student name or invoice code..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Select value={classId} onValueChange={(v) => v === '__all__' ? setClassId('') : setClassId(v)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All Classes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">All Classes</SelectItem>
                    {classes.map((c) => (
                      <SelectItem key={c.class_id} value={String(c.class_id)}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={status} onValueChange={(v) => v === '__all__' ? setStatus('') : setStatus(v)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">All Status</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="partial">Partial</SelectItem>
                    <SelectItem value="unpaid">Unpaid</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={year} onValueChange={(v) => v === '__all__' ? setYear('') : setYear(v)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Year" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">All Years</SelectItem>
                    <SelectItem value="2026">2026</SelectItem>
                    <SelectItem value="2025">2025</SelectItem>
                    <SelectItem value="2024">2024</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={term} onValueChange={(v) => v === '__all__' ? setTerm('') : setTerm(v)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Term" />
                  </SelectTrigger>
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
            {/* Desktop Table */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="text-xs font-semibold">Invoice</TableHead>
                    <TableHead className="text-xs font-semibold">Student</TableHead>
                    <TableHead className="text-xs font-semibold">Class</TableHead>
                    <TableHead className="text-xs font-semibold text-right">Amount</TableHead>
                    <TableHead className="text-xs font-semibold text-right">Paid</TableHead>
                    <TableHead className="text-xs font-semibold text-right">Due</TableHead>
                    <TableHead className="text-xs font-semibold">Status</TableHead>
                    <TableHead className="text-xs font-semibold">Date</TableHead>
                    <TableHead className="text-xs font-semibold text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        {Array.from({ length: 9 }).map((_, j) => (
                          <TableCell key={j}>
                            <Skeleton className="h-4 w-full" />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : invoices.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-12 text-slate-400">
                        <FileText className="w-10 h-10 mx-auto mb-2 opacity-50" />
                        <p>No invoices found</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    invoices.map((inv) => {
                      const sc = statusConfig[inv.status] || statusConfig.unpaid;
                      return (
                        <TableRow key={inv.invoice_id} className="hover:bg-slate-50/50">
                          <TableCell className="font-mono text-xs">{inv.invoice_code}</TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium text-sm">{inv.student?.name || 'Unknown'}</p>
                              <p className="text-xs text-slate-400">{inv.student?.student_code}</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">{inv.class_name || '—'}</TableCell>
                          <TableCell className="text-right text-sm font-mono">{formatCurrency(inv.amount)}</TableCell>
                          <TableCell className="text-right text-sm font-mono text-emerald-600">{formatCurrency(inv.amount_paid)}</TableCell>
                          <TableCell className="text-right text-sm font-mono text-red-600">{formatCurrency(inv.due)}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={sc.className}>{sc.label}</Badge>
                          </TableCell>
                          <TableCell className="text-xs text-slate-500">{formatDate(inv.creation_timestamp)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleViewInvoice(inv.invoice_id)} title="View">
                                <Eye className="w-3.5 h-3.5" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handlePrint(inv)} title="Print">
                                <Printer className="w-3.5 h-3.5" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditInvoice(inv)} title="Edit">
                                <Pencil className="w-3.5 h-3.5" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600" onClick={() => { setDeleteId(inv.invoice_id); setDeleteOpen(true); }} title="Delete">
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="p-4 space-y-3">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                ))
              ) : invoices.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <FileText className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p>No invoices found</p>
                </div>
              ) : (
                invoices.map((inv) => {
                  const sc = statusConfig[inv.status] || statusConfig.unpaid;
                  return (
                    <div key={inv.invoice_id} className="p-4 space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-mono text-xs text-slate-500">{inv.invoice_code}</p>
                          <p className="font-medium text-sm">{inv.student?.name || 'Unknown'}</p>
                        </div>
                        <Badge variant="outline" className={sc.className}>{sc.label}</Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-500">{inv.class_name || '—'} &middot; {formatDate(inv.creation_timestamp)}</span>
                        <span className="font-bold">{formatCurrency(inv.due)} due</span>
                      </div>
                      <div className="grid grid-cols-3 text-center text-xs border rounded-lg overflow-hidden">
                        <div className="py-1.5 bg-slate-50"><p className="text-slate-400">Amount</p><p className="font-mono font-medium">{formatCurrency(inv.amount)}</p></div>
                        <div className="py-1.5 border-x"><p className="text-slate-400">Paid</p><p className="font-mono font-medium text-emerald-600">{formatCurrency(inv.amount_paid)}</p></div>
                        <div className="py-1.5 bg-slate-50"><p className="text-slate-400">Due</p><p className="font-mono font-medium text-red-600">{formatCurrency(inv.due)}</p></div>
                      </div>
                      <div className="flex gap-2 pt-1">
                        <Button variant="outline" size="sm" className="flex-1 h-8 text-xs" onClick={() => handleViewInvoice(inv.invoice_id)}><Eye className="w-3 h-3 mr-1" />View</Button>
                        <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => handlePrint(inv)}><Printer className="w-3 h-3" /></Button>
                        <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => handleEditInvoice(inv)}><Pencil className="w-3 h-3" /></Button>
                        <Button variant="outline" size="sm" className="h-8 text-xs text-red-500" onClick={() => { setDeleteId(inv.invoice_id); setDeleteOpen(true); }}><Trash2 className="w-3 h-3" /></Button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t">
                <p className="text-xs text-slate-500">{total} invoice(s) total</p>
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

      {/* Create Invoice Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Create Invoice</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Year</Label>
                  <Select value={createYear} onValueChange={setCreateYear}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2026">2026</SelectItem>
                      <SelectItem value="2025">2025</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Term</Label>
                  <Select value={createTerm} onValueChange={setCreateTerm}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Term 1">Term 1</SelectItem>
                      <SelectItem value="Term 2">Term 2</SelectItem>
                      <SelectItem value="Term 3">Term 3</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label className="text-xs">Class (Optional)</Label>
                <Select value={createClassId} onValueChange={(v) => v === '__none__' ? setCreateClassId('') : setCreateClassId(v)}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select class" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">No class</SelectItem>
                    {classes.map((c) => (
                      <SelectItem key={c.class_id} value={String(c.class_id)}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div>
                <Label className="text-xs mb-2 block">Search Students</Label>
                <Input
                  placeholder="Type name or student code..."
                  value={studentSearch}
                  onChange={(e) => handleSearchStudents(e.target.value)}
                />
                {createStudents.length > 0 && (
                  <div className="mt-2 max-h-40 overflow-y-auto border rounded-lg">
                    {createStudents.map((s: any) => (
                      <label key={s.student_id} className="flex items-center gap-2 px-3 py-2 hover:bg-slate-50 cursor-pointer text-sm">
                        <Checkbox
                          checked={selectedStudentIds.includes(s.student_id)}
                          onCheckedChange={() => toggleStudentSelection(s.student_id)}
                        />
                        <span>{s.name} ({s.student_code})</span>
                      </label>
                    ))}
                  </div>
                )}
                {selectedStudentIds.length > 0 && (
                  <p className="text-xs text-emerald-600 mt-1">{selectedStudentIds.length} student(s) selected</p>
                )}
              </div>

              <Separator />

              <div>
                <Label className="text-xs mb-2 block">Billing Items</Label>
                {billItems.length === 0 ? (
                  <p className="text-sm text-slate-400">No billing items configured</p>
                ) : (
                  <div className="max-h-40 overflow-y-auto border rounded-lg divide-y">
                    {billItems.map((item) => (
                      <label key={item.id} className="flex items-center gap-2 px-3 py-2 hover:bg-slate-50 cursor-pointer text-sm">
                        <Checkbox
                          checked={selectedItems.includes(item.id)}
                          onCheckedChange={() => toggleItemSelection(item.id)}
                        />
                        <span className="flex-1">{item.title}</span>
                        <span className="font-mono text-xs text-slate-500">{formatCurrency(item.amount)}</span>
                      </label>
                    ))}
                  </div>
                )}
                {selectedItems.length > 0 && (
                  <div className="mt-2 text-sm font-medium text-right">
                    Total per student: <span className="text-emerald-700">{formatCurrency(getSelectedTotal(selectedItems))}</span>
                  </div>
                )}
              </div>
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateInvoice} disabled={creating} className="bg-emerald-600 hover:bg-emerald-700">
              {creating ? 'Creating...' : `Create ${selectedStudentIds.length} Invoice(s)`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mass Bill Dialog */}
      <Dialog open={massBillOpen} onOpenChange={setMassBillOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Mass Bill Class</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Year</Label>
                <Select value={massBillYear} onValueChange={setMassBillYear}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2026">2026</SelectItem>
                    <SelectItem value="2025">2025</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Term</Label>
                <Select value={massBillTerm} onValueChange={setMassBillTerm}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Term 1">Term 1</SelectItem>
                    <SelectItem value="Term 2">Term 2</SelectItem>
                    <SelectItem value="Term 3">Term 3</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-xs">Class</Label>
              <Select value={massBillClassId} onValueChange={setMassBillClassId}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select class" /></SelectTrigger>
                <SelectContent>
                  {classes.map((c) => (
                    <SelectItem key={c.class_id} value={String(c.class_id)}>{c.name} ({c._count?.enrolls || 0} students)</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs mb-2 block">Billing Items</Label>
              <div className="max-h-40 overflow-y-auto border rounded-lg divide-y">
                {billItems.map((item) => (
                  <label key={item.id} className="flex items-center gap-2 px-3 py-2 hover:bg-slate-50 cursor-pointer text-sm">
                    <Checkbox
                      checked={massBillItems.includes(item.id)}
                      onCheckedChange={() => toggleItemSelection(item.id, true)}
                    />
                    <span className="flex-1">{item.title}</span>
                    <span className="font-mono text-xs text-slate-500">{formatCurrency(item.amount)}</span>
                  </label>
                ))}
              </div>
              {massBillItems.length > 0 && (
                <div className="mt-2 text-sm font-medium text-right">
                  Total per student: <span className="text-emerald-700">{formatCurrency(getSelectedTotal(massBillItems))}</span>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMassBillOpen(false)}>Cancel</Button>
            <Button onClick={handleMassBill} disabled={massBilling} className="bg-emerald-600 hover:bg-emerald-700">
              {massBilling ? 'Billing...' : 'Bill Entire Class'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Invoice Dialog */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-emerald-600" />
              Invoice Details
            </DialogTitle>
          </DialogHeader>
          {viewLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-4 w-full" />
              ))}
            </div>
          ) : viewInvoice ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-slate-400 text-xs">Invoice Code</p>
                  <p className="font-mono font-medium">{viewInvoice.invoice_code}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs">Status</p>
                  <Badge variant="outline" className={statusConfig[viewInvoice.status]?.className}>{statusConfig[viewInvoice.status]?.label}</Badge>
                </div>
                <div>
                  <p className="text-slate-400 text-xs">Student</p>
                  <p className="font-medium">{viewInvoice.student?.name}</p>
                  <p className="text-xs text-slate-400">{viewInvoice.student?.student_code}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs">Class / Term</p>
                  <p>{viewInvoice.class_name || '—'} &middot; {viewInvoice.term}</p>
                </div>
              </div>
              <Separator />
              <div className="grid grid-cols-3 gap-3 text-center border rounded-lg overflow-hidden">
                <div className="py-2 bg-slate-50">
                  <p className="text-xs text-slate-400">Amount</p>
                  <p className="font-mono font-bold">{formatCurrency(viewInvoice.amount)}</p>
                </div>
                <div className="py-2 border-x">
                  <p className="text-xs text-slate-400">Paid</p>
                  <p className="font-mono font-bold text-emerald-600">{formatCurrency(viewInvoice.amount_paid)}</p>
                </div>
                <div className="py-2 bg-slate-50">
                  <p className="text-xs text-slate-400">Due</p>
                  <p className="font-mono font-bold text-red-600">{formatCurrency(viewInvoice.due)}</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-400">Description</p>
                <p className="text-sm mt-1">{viewInvoice.description || viewInvoice.title}</p>
              </div>
              <div className="text-xs text-slate-400">
                Created: {formatDate(viewInvoice.creation_timestamp)} | Paid: {formatDate(viewInvoice.payment_timestamp)}
              </div>
              {viewInvoice.payments && viewInvoice.payments.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <p className="text-xs font-semibold mb-2">Payment History</p>
                    <div className="space-y-1">
                      {viewInvoice.payments.map((p: any, i: number) => (
                        <div key={i} className="flex justify-between text-xs bg-slate-50 rounded px-3 py-2">
                          <span>{formatDate(p.timestamp)} - {p.payment_method}</span>
                          <span className="font-mono font-medium text-emerald-600">{formatCurrency(p.amount)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => viewInvoice && handlePrint(viewInvoice)}>
              <Printer className="w-4 h-4 mr-2" />Print
            </Button>
            <Button variant="outline" onClick={() => setViewOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Invoice Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Invoice</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs">Title</Label>
              <Input value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} className="mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Amount</Label>
                <Input type="number" value={editForm.amount} onChange={(e) => setEditForm({ ...editForm, amount: parseFloat(e.target.value) || 0 })} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">Discount</Label>
                <Input type="number" value={editForm.discount} onChange={(e) => setEditForm({ ...editForm, discount: parseFloat(e.target.value) || 0 })} className="mt-1" />
              </div>
            </div>
            <div>
              <Label className="text-xs">Status</Label>
              <Select value={editForm.status} onValueChange={(v) => setEditForm({ ...editForm, status: v })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="unpaid">Unpaid</SelectItem>
                  <SelectItem value="partial">Partial</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveEdit} disabled={editing} className="bg-emerald-600 hover:bg-emerald-700">
              {editing ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Invoice</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-600">Are you sure? This will also delete all associated payments. This action cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancel</Button>
            <Button onClick={handleDeleteInvoice} disabled={deleting} variant="destructive">
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
