'use client';

import { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
  FileText, Search, Plus, Printer, Eye, Pencil, Trash2, Users, DollarSign,
  AlertCircle, ChevronLeft, ChevronRight, Receipt, CreditCard, Tag, ListPlus,
  ShoppingCart, CheckCircle2, XCircle, Info, Edit3, Ban,
} from 'lucide-react';

// ======== TYPES ========
interface Invoice {
  invoice_id: number; student_id: number; title: string; description: string;
  amount: number; amount_paid: number; due: number; discount: number;
  creation_timestamp: string; payment_timestamp: string | null; method: string;
  status: string; year: string; term: string; class_id: number | null;
  invoice_code: string; class_name: string;
  student: { student_id: number; name: string; student_code: string };
}

interface BillItem {
  id: number; title: string; description: string; amount: number;
  bill_category_id: number | null;
  bill_category: { bill_category_id: number; bill_category_name: string } | null;
}

interface BillCategory { bill_category_id: number; bill_category_name: string; }
interface SchoolClass { class_id: number; name: string; name_numeric: number; category: string; _count: { enrolls: number }; }

// ======== CONFIG ========
const statusConfig: Record<string, { label: string; className: string }> = {
  paid: { label: 'Paid', className: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  partial: { label: 'Partial', className: 'bg-amber-100 text-amber-700 border-amber-200' },
  unpaid: { label: 'Unpaid', className: 'bg-red-100 text-red-700 border-red-200' },
  overdue: { label: 'Overdue', className: 'bg-red-200 text-red-800 border-red-300' },
};

function fmt(amount: number) {
  return new Intl.NumberFormat('en-UG', { style: 'currency', currency: 'GHS', minimumFractionDigits: 2 }).format(amount);
}
function fmtShort(amount: number) {
  return new Intl.NumberFormat('en-UG', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
}
function fmtDate(d: string) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

// ======== MAIN COMPONENT ========
export default function InvoicesPage() {
  const [activeTab, setActiveTab] = useState('invoices');

  // Invoice list state
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

  // Bill items state
  const [billItems, setBillItems] = useState<BillItem[]>([]);
  const [billCategories, setBillCategories] = useState<BillCategory[]>([]);
  const [newItemTitle, setNewItemTitle] = useState('');
  const [newItemAmount, setNewItemAmount] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('');
  const [newItemDesc, setNewItemDesc] = useState('');
  const [addingItem, setAddingItem] = useState(false);

  // Edit bill item
  const [editItem, setEditItem] = useState<BillItem | null>(null);
  const [editItemTitle, setEditItemTitle] = useState('');
  const [editItemAmount, setEditItemAmount] = useState('');
  const [editItemCategory, setEditItemCategory] = useState('');
  const [editItemDesc, setEditItemDesc] = useState('');
  const [savingItem, setSavingItem] = useState(false);

  // Create invoice
  const [createOpen, setCreateOpen] = useState(false);
  const [createStudents, setCreateStudents] = useState<any[]>([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([]);
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [createYear, setCreateYear] = useState('');
  const [createTerm, setCreateTerm] = useState('');
  const [createClassId, setCreateClassId] = useState('');
  const [createDate, setCreateDate] = useState(new Date().toISOString().split('T')[0]);
  const [creating, setCreating] = useState(false);
  const [createMode, setCreateMode] = useState<'single' | 'mass'>('single');

  // Mass bill
  const [massBillClassId, setMassBillClassId] = useState('');
  const [massBillItems, setMassBillItems] = useState<number[]>([]);
  const [massBilling, setMassBilling] = useState(false);

  // View invoice
  const [viewOpen, setViewOpen] = useState(false);
  const [viewInvoice, setViewInvoice] = useState<any>(null);
  const [viewLoading, setViewLoading] = useState(false);

  // Edit invoice
  const [editOpen, setEditOpen] = useState(false);
  const [editInvoice, setEditInvoice] = useState<Invoice | null>(null);
  const [editForm, setEditForm] = useState({ title: '', amount: 0, discount: 0, description: '' });
  const [editing, setEditing] = useState(false);

  // Delete
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Take payment
  const [payOpen, setPayOpen] = useState(false);
  const [payStudentId, setPayStudentId] = useState<number | null>(null);
  const [payStudentsOwing, setPayStudentsOwing] = useState<any[]>([]);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('cash');
  const [payReceiptCode, setPayReceiptCode] = useState('');
  const [payYear, setPayYear] = useState('');
  const [payTerm, setPayTerm] = useState('');
  const [paying, setPaying] = useState(false);
  const [payStudentDetail, setPayStudentDetail] = useState<any>(null);

  // ===== FETCH DATA =====
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
      const res = await fetch(`/api/admin/invoices?${params}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setInvoices(data.invoices || []);
      setSummary(data.summary || { totalBilled: 0, totalCollected: 0, outstanding: 0 });
      setTotalPages(data.pagination?.totalPages || 1);
      setTotal(data.pagination?.total || 0);
    } catch { toast.error('Failed to load invoices'); } finally { setLoading(false); }
  }, [search, classId, status, year, term, page]);

  const fetchClasses = useCallback(async () => {
    try {
      const res = await fetch('/api/classes');
      const data = await res.json();
      setClasses(data || []);
    } catch { /* silent */ }
  }, []);

  const fetchBillItems = useCallback(async () => {
    try {
      const [itemsRes, catsRes] = await Promise.all([
        fetch('/api/admin/invoices?action=bill-items'),
        fetch('/api/admin/invoices?action=bill-categories'),
      ]);
      const itemsData = await itemsRes.json();
      const catsData = await catsRes.json();
      setBillItems(itemsData.billItems || []);
      setBillCategories(catsData.categories || []);
    } catch { /* silent */ }
  }, []);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      const settings = Array.isArray(data) ? data : [];
      const getSetting = (type: string) => settings.find((s: any) => s.type === type)?.description || '';
      const ry = getSetting('running_year');
      const rt = getSetting('running_term');
      if (ry) { setCreateYear(ry); setPayYear(ry); }
      if (rt) { setCreateTerm(rt); setPayTerm(rt); }
    } catch { /* silent */ }
  }, []);

  useEffect(() => { fetchInvoices(); }, [fetchInvoices]);
  useEffect(() => { fetchClasses(); fetchBillItems(); fetchSettings(); }, [fetchClasses, fetchBillItems, fetchSettings]);

  useEffect(() => {
    const timer = setTimeout(() => { setPage(1); fetchInvoices(); }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => { setPage(1); }, [classId, status, year, term]);

  // ===== BILL ITEM HANDLERS =====
  const handleAddBillItem = async () => {
    if (!newItemTitle || !newItemAmount) { toast.error('Title and amount required'); return; }
    setAddingItem(true);
    try {
      const res = await fetch('/api/admin/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'add-bill-item', title: newItemTitle, amount: newItemAmount, description: newItemDesc, billCategoryId: newItemCategory }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast.success(data.message);
      setNewItemTitle(''); setNewItemAmount(''); setNewItemCategory(''); setNewItemDesc('');
      fetchBillItems();
    } catch (err: any) { toast.error(err.message); } finally { setAddingItem(false); }
  };

  const handleStartEditItem = (item: BillItem) => {
    setEditItem(item);
    setEditItemTitle(item.title);
    setEditItemAmount(String(item.amount));
    setEditItemCategory(item.bill_category_id ? String(item.bill_category_id) : '');
    setEditItemDesc(item.description);
  };

  const handleSaveEditItem = async () => {
    if (!editItem) return;
    setSavingItem(true);
    try {
      const res = await fetch('/api/admin/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update-bill-item', id: editItem.id, title: editItemTitle, amount: editItemAmount, description: editItemDesc, billCategoryId: editItemCategory }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast.success(data.message);
      setEditItem(null);
      fetchBillItems();
    } catch (err: any) { toast.error(err.message); } finally { setSavingItem(false); }
  };

  const handleDeleteBillItem = async (id: number) => {
    try {
      const res = await fetch('/api/admin/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete-bill-item', id }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast.success(data.message);
      fetchBillItems();
    } catch (err: any) { toast.error(err.message); }
  };

  // ===== INVOICE CREATION =====
  const handleSearchStudents = async (q: string) => {
    setStudentSearch(q);
    if (q.length < 2) { setCreateStudents([]); return; }
    try {
      const res = await fetch(`/api/students?search=${encodeURIComponent(q)}&limit=20`);
      const data = await res.json();
      setCreateStudents(data.students || []);
    } catch { /* silent */ }
  };

  const handleCreateInvoice = async () => {
    const items = billItems.filter((i) => selectedItems.includes(i.id)).map((i) => ({ title: i.title, amount: i.amount }));
    if (createMode === 'single') {
      if (selectedStudentIds.length === 0) { toast.error('Select at least one student'); return; }
    }
    if (items.length === 0) { toast.error('Select at least one billing item'); return; }

    setCreating(true);
    try {
      const body: any = {
        action: createMode === 'mass' ? 'create-mass' : 'create-single',
        items, date: createDate, term: createTerm, year: createYear,
      };
      if (createMode === 'single') {
        body.studentId = selectedStudentIds[0];
        body.classId = createClassId;
      } else {
        body.classId = massBillClassId;
      }
      const res = await fetch('/api/admin/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast.success(data.message);
      setCreateOpen(false);
      setSelectedStudentIds([]); setSelectedItems([]); setMassBillItems([]);
      fetchInvoices();
    } catch (err: any) { toast.error(err.message); } finally { setCreating(false); }
  };

  // ===== INVOICE ACTIONS =====
  const handleViewInvoice = async (id: number) => {
    setViewOpen(true); setViewLoading(true);
    try {
      const res = await fetch(`/api/admin/invoices/${id}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setViewInvoice(data);
    } catch (err: any) { toast.error(err.message); setViewOpen(false); } finally { setViewLoading(false); }
  };

  const handleEditInvoice = (inv: Invoice) => {
    setEditInvoice(inv);
    setEditForm({ title: inv.title, amount: inv.amount, discount: inv.discount, description: inv.description });
    setEditOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editInvoice) return;
    setEditing(true);
    try {
      const res = await fetch(`/api/admin/invoices/${editInvoice.invoice_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast.success('Invoice updated');
      setEditOpen(false); fetchInvoices();
    } catch (err: any) { toast.error(err.message); } finally { setEditing(false); }
  };

  const handleDeleteInvoice = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/invoices/${deleteId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast.success('Invoice deleted');
      setDeleteOpen(false); setDeleteId(null); fetchInvoices();
    } catch (err: any) { toast.error(err.message); } finally { setDeleting(false); }
  };

  const handlePrintInvoice = (inv: Invoice) => {
    const sc = statusConfig[inv.status] || statusConfig.unpaid;
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`<html><head><title>Invoice ${inv.invoice_code}</title>
      <style>body{font-family:Arial,sans-serif;padding:40px;color:#333;max-width:800px;margin:0 auto}
      table{width:100%;border-collapse:collapse;margin:16px 0}th,td{border:1px solid #ddd;padding:10px;text-align:left}
      th{background:#f5f5f5;font-size:13px}.header{display:flex;justify-content:space-between;margin-bottom:24px;align-items:flex-start}
      .logo{font-size:20px;font-weight:bold;color:#059669}h2{margin:0;color:#1e293b}
      .total-row{font-weight:bold;background:#f0fdf4;border-top:2px solid #059669}
      @media print{body{padding:20px}}</style></head><body>
      <div class="header"><div><div class="logo">School Manager</div><p style="color:#666;font-size:12px">School Fee Invoice</p></div>
      <div style="text-align:right"><h2>INVOICE</h2><p style="font-family:monospace">${inv.invoice_code}</p>
      <p>Date: ${fmtDate(inv.creation_timestamp)}</p>
      <span style="padding:4px 12px;border-radius:20px;font-size:12px;background:${inv.status==='paid'?'#d1fae5':'#fee2e2'};color:${inv.status==='paid'?'#065f46':'#991b1b'}">${sc.label.toUpperCase()}</span></div></div>
      <div style="display:flex;gap:32px;margin-bottom:20px;font-size:14px">
      <div><strong>Bill To:</strong><br/>${inv.student?.name || 'Unknown'}<br/>${inv.student?.student_code || ''}</div>
      <div><strong>Class:</strong> ${inv.class_name || '—'}<br/><strong>Term:</strong> ${inv.term}<br/><strong>Year:</strong> ${inv.year}</div></div>
      <hr style="margin:16px 0">
      <table><thead><tr><th>Description</th><th style="text-align:right">Amount (GHS)</th></tr></thead>
      <tbody><tr><td>${inv.description || inv.title}</td><td style="text-align:right">${fmt(inv.amount)}</td></tr>
      ${inv.discount > 0 ? `<tr><td>Discount</td><td style="text-align:right;color:#059669">-${fmt(inv.discount)}</td></tr>` : ''}
      <tr class="total-row"><td>Total</td><td style="text-align:right">${fmt(inv.amount - inv.discount)}</td></tr>
      <tr><td>Paid</td><td style="text-align:right;color:#059669">${fmt(inv.amount_paid)}</td></tr>
      <tr><td><strong>Balance Due</strong></td><td style="text-align:right;color:${inv.due > 0 ? '#dc2626' : '#059669'}"><strong>${fmt(inv.due)}</strong></td></tr></tbody></table>
      <div style="margin-top:40px;text-align:right"><p>........................</p><p style="font-size:12px;color:#666">For: Finance Department</p></div>
      <div style="text-align:center;margin-top:20px;padding-top:16px;border-top:1px solid #e2e8f0"><p style="font-size:11px;color:#94a3b8">Thank you for your payment</p></div>
      </body></html>`);
    w.document.close();
    setTimeout(() => { w.print(); }, 300);
  };

  // ===== TAKE PAYMENT =====
  const handleOpenTakePayment = async (studentId?: number) => {
    setPayOpen(true);
    try {
      const params = new URLSearchParams();
      params.set('year', payYear);
      params.set('term', payTerm);
      params.set('action', 'students-owing');
      const res = await fetch(`/api/admin/invoices?${params}`);
      const data = await res.json();
      setPayStudentsOwing(data.students || []);
      if (studentId) {
        setPayStudentId(studentId);
        const detail = (data.students || []).find((s: any) => s.student_id === studentId);
        setPayStudentDetail(detail || null);
      }
    } catch { toast.error('Failed to load students'); }
  };

  const handlePayStudentChange = (studentId: string) => {
    const sid = parseInt(studentId);
    setPayStudentId(sid);
    const detail = payStudentsOwing.find((s: any) => s.student_id === sid);
    setPayStudentDetail(detail || null);
  };

  const handleTakePayment = async () => {
    if (!payStudentId || !payAmount || parseFloat(payAmount) <= 0) {
      toast.error('Student and valid amount are required');
      return;
    }
    setPaying(true);
    try {
      const res = await fetch('/api/admin/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: payStudentId, amount: parseFloat(payAmount),
          paymentMethod: payMethod, receiptCode: payReceiptCode,
          year: payYear, term: payTerm, printReceipt: true,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast.success(data.message);
      if (data.change > 0) toast.info(`Change: GHS ${data.change.toFixed(2)}`);

      // Reset and close
      setPayOpen(false); setPayAmount(''); setPayReceiptCode('');
      setPayStudentId(null); setPayStudentDetail(null);
      fetchInvoices();

      // Print receipt
      if (data.printReceipt && data.receiptCode) {
        setTimeout(() => {
          const w = window.open('', '_blank');
          if (w) {
            const student = payStudentsOwing.find((s: any) => s.student_id === payStudentId);
            w.document.write(`<html><head><title>Receipt ${data.receiptCode}</title>
              <style>body{font-family:Arial;padding:40px;color:#333;max-width:600px;margin:0 auto;text-align:center}
              .receipt{border:2px dashed #ccc;padding:30px;border-radius:8px}
              h2{color:#059669;margin:0}table{width:100%;border-collapse:collapse;margin:20px 0}
              th,td{padding:8px;border-bottom:1px solid #eee;text-align:left}
              .amount{font-size:24px;font-weight:bold;color:#059669}
              @media print{body{padding:20px}}</style></head><body>
              <div class="receipt"><h2>RECEIPT</h2>
              <p style="font-family:monospace;font-size:12px;color:#666">${data.receiptCode}</p>
              <hr style="margin:16px 0;border:none;border-top:1px solid #ccc">
              <p><strong>${student?.name || 'Student'}</strong></p>
              <p style="font-size:12px;color:#666">${student?.class_name || ''} ${student?.name_numeric || ''}</p>
              <div class="amount">GHS ${parseFloat(payAmount).toFixed(2)}</div>
              <p style="font-size:12px;color:#666">Method: ${payMethod.toUpperCase()}</p>
              <p style="font-size:12px;color:#666">${new Date().toLocaleString()}</p>
              <hr style="margin:16px 0;border:none;border-top:1px solid #ccc">
              <p style="font-size:11px;color:#999">Thank you for your payment</p></div>
              </body></html>`);
            w.document.close();
            setTimeout(() => w.print(), 300);
          }
        }, 500);
      }
    } catch (err: any) { toast.error(err.message); } finally { setPaying(false); }
  };

  const toggleSelection = (id: number, list: number[], setList: (v: number[]) => void) => {
    setList(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
  };
  const getSelectedTotal = (items: number[]) => billItems.filter((i) => items.includes(i.id)).reduce((s, i) => s + i.amount, 0);

  // ===== RENDER ========
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-6 h-6 text-emerald-600" /> Invoice Management
            </h1>
            <p className="text-sm text-slate-500 mt-1">Create invoices, manage billing items, and track payments</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => handleOpenTakePayment()} className="border-emerald-200 text-emerald-700 hover:bg-emerald-50">
              <CreditCard className="w-4 h-4 mr-2" /> Take Payment
            </Button>
            <Button onClick={() => { setCreateOpen(true); setSelectedStudentIds([]); setSelectedItems([]); setCreateMode('single'); }} className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="w-4 h-4 mr-2" /> Create Invoice
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border-l-4 border-l-emerald-500">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">Total Billed</p>
                  <p className="text-lg font-bold text-slate-900">{fmt(summary.totalBilled)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-emerald-500">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">Total Collected</p>
                  <p className="text-lg font-bold text-emerald-700">{fmt(summary.totalCollected)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-red-500">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">Outstanding</p>
                  <p className="text-lg font-bold text-red-600">{fmt(summary.outstanding)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="invoices" className="flex items-center gap-1.5"><ListPlus className="w-4 h-4" /> Invoice List</TabsTrigger>
            <TabsTrigger value="create" className="flex items-center gap-1.5"><Plus className="w-4 h-4" /> Create Invoice</TabsTrigger>
            <TabsTrigger value="bill-items" className="flex items-center gap-1.5"><Tag className="w-4 h-4" /> Bill Items</TabsTrigger>
          </TabsList>

          {/* TAB: Invoice List */}
          <TabsContent value="invoices" className="space-y-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col lg:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input placeholder="Search student, invoice code..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <Select value={classId} onValueChange={(v) => v === '__all__' ? setClassId('') : setClassId(v)}>
                      <SelectTrigger><SelectValue placeholder="All Classes" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__all__">All Classes</SelectItem>
                        {classes.map((c) => <SelectItem key={c.class_id} value={String(c.class_id)}>{c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Select value={status} onValueChange={(v) => v === '__all__' ? setStatus('') : setStatus(v)}>
                      <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__all__">All Status</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="partial">Partial</SelectItem>
                        <SelectItem value="unpaid">Unpaid</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={year} onValueChange={(v) => v === '__all__' ? setYear('') : setYear(v)}>
                      <SelectTrigger><SelectValue placeholder="Year" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__all__">All Years</SelectItem>
                        <SelectItem value="2025/2026">2025/2026</SelectItem>
                        <SelectItem value="2024/2025">2024/2025</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={term} onValueChange={(v) => v === '__all__' ? setTerm('') : setTerm(v)}>
                      <SelectTrigger><SelectValue placeholder="Term" /></SelectTrigger>
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

            <Card>
              <CardContent className="p-0">
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50">
                        <TableHead className="text-xs font-semibold">Invoice #</TableHead>
                        <TableHead className="text-xs font-semibold">Student</TableHead>
                        <TableHead className="text-xs font-semibold">Title</TableHead>
                        <TableHead className="text-xs font-semibold text-right">Amount</TableHead>
                        <TableHead className="text-xs font-semibold text-right">Paid</TableHead>
                        <TableHead className="text-xs font-semibold text-right">Due</TableHead>
                        <TableHead className="text-xs font-semibold">Status</TableHead>
                        <TableHead className="text-xs font-semibold">Date</TableHead>
                        <TableHead className="text-xs font-semibold text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}>{Array.from({ length: 9 }).map((_, j) => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}</TableRow>
                      )) : invoices.length === 0 ? (
                        <TableRow><TableCell colSpan={9} className="text-center py-12 text-slate-400">
                          <FileText className="w-10 h-10 mx-auto mb-2 opacity-50" /><p>No invoices found</p>
                        </TableCell></TableRow>
                      ) : invoices.map((inv) => {
                        const sc = statusConfig[inv.status] || statusConfig.unpaid;
                        return (
                          <TableRow key={inv.invoice_id} className="hover:bg-slate-50/50">
                            <TableCell className="font-mono text-xs">{inv.invoice_code}</TableCell>
                            <TableCell><p className="font-medium text-sm">{inv.student?.name || 'Unknown'}</p><p className="text-xs text-slate-400">{inv.student?.student_code}</p></TableCell>
                            <TableCell className="text-sm max-w-[150px] truncate">{inv.title}</TableCell>
                            <TableCell className="text-right text-sm font-mono">{fmt(inv.amount)}</TableCell>
                            <TableCell className="text-right text-sm font-mono text-emerald-600">{fmt(inv.amount_paid)}</TableCell>
                            <TableCell className="text-right text-sm font-mono text-red-600">{fmt(inv.due)}</TableCell>
                            <TableCell><Badge variant="outline" className={sc.className}>{sc.label}</Badge></TableCell>
                            <TableCell className="text-xs text-slate-500">{fmtDate(inv.creation_timestamp)}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-0.5">
                                {inv.due > 0 && (
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-600 hover:text-emerald-700" onClick={() => handleOpenTakePayment(inv.student_id)} title="Take Payment"><CreditCard className="w-3.5 h-3.5" /></Button>
                                )}
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleViewInvoice(inv.invoice_id)} title="View"><Eye className="w-3.5 h-3.5" /></Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handlePrintInvoice(inv)} title="Print"><Printer className="w-3.5 h-3.5" /></Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditInvoice(inv)} title="Edit"><Pencil className="w-3.5 h-3.5" /></Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600" onClick={() => { setDeleteId(inv.invoice_id); setDeleteOpen(true); }} title="Delete"><Trash2 className="w-3.5 h-3.5" /></Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
                {/* Mobile Cards */}
                <div className="md:hidden divide-y">
                  {loading ? Array.from({ length: 3 }).map((_, i) => <div key={i} className="p-4 space-y-3"><Skeleton className="h-4 w-3/4" /><Skeleton className="h-3 w-1/2" /></div>)
                  : invoices.length === 0 ? <div className="text-center py-12 text-slate-400"><FileText className="w-10 h-10 mx-auto mb-2 opacity-50" /><p>No invoices found</p></div>
                  : invoices.map((inv) => {
                    const sc = statusConfig[inv.status] || statusConfig.unpaid;
                    return (
                      <div key={inv.invoice_id} className="p-4 space-y-2">
                        <div className="flex items-start justify-between"><div><p className="font-mono text-xs text-slate-500">{inv.invoice_code}</p><p className="font-medium text-sm">{inv.student?.name || 'Unknown'}</p></div><Badge variant="outline" className={sc.className}>{sc.label}</Badge></div>
                        <div className="grid grid-cols-3 text-center text-xs border rounded-lg overflow-hidden">
                          <div className="py-1.5 bg-slate-50"><p className="text-slate-400">Amount</p><p className="font-mono font-medium">{fmt(inv.amount)}</p></div>
                          <div className="py-1.5 border-x"><p className="text-slate-400">Paid</p><p className="font-mono font-medium text-emerald-600">{fmt(inv.amount_paid)}</p></div>
                          <div className="py-1.5 bg-slate-50"><p className="text-slate-400">Due</p><p className="font-mono font-medium text-red-600">{fmt(inv.due)}</p></div>
                        </div>
                        <div className="flex gap-1.5 pt-1">
                          {inv.due > 0 && <Button variant="outline" size="sm" className="flex-1 h-8 text-xs text-emerald-600" onClick={() => handleOpenTakePayment(inv.student_id)}><CreditCard className="w-3 h-3 mr-1" />Pay</Button>}
                          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => handleViewInvoice(inv.invoice_id)}><Eye className="w-3 h-3" /></Button>
                          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => handlePrintInvoice(inv)}><Printer className="w-3 h-3" /></Button>
                          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => handleEditInvoice(inv)}><Pencil className="w-3 h-3" /></Button>
                          <Button variant="outline" size="sm" className="h-8 text-xs text-red-500" onClick={() => { setDeleteId(inv.invoice_id); setDeleteOpen(true); }}><Trash2 className="w-3 h-3" /></Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-4 py-3 border-t">
                    <p className="text-xs text-slate-500">{total} invoice(s)</p>
                    <div className="flex items-center gap-1">
                      <Button variant="outline" size="icon" className="h-8 w-8" disabled={page <= 1} onClick={() => setPage(page - 1)}><ChevronLeft className="w-4 h-4" /></Button>
                      <span className="text-sm px-2">{page}/{totalPages}</span>
                      <Button variant="outline" size="icon" className="h-8 w-8" disabled={page >= totalPages} onClick={() => setPage(page + 1)}><ChevronRight className="w-4 h-4" /></Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB: Create Invoice */}
          <TabsContent value="create" className="space-y-4">
            <Card className="bg-amber-50 border-amber-200">
              <CardContent className="p-4 flex gap-3">
                <Info className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
                <div className="text-sm text-amber-800">
                  <p className="font-semibold mb-1">Create New Invoices</p>
                  <ul className="space-y-0.5 text-amber-700 list-inside list-disc">
                    <li>Create invoices for individual students or bulk-bill an entire class</li>
                    <li>Select billing items from the Bill Items tab to define what the invoice includes</li>
                    <li>Duplicate invoices for the same student, term, and year are automatically prevented</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Mode Toggle */}
            <div className="flex gap-2">
              <Button variant={createMode === 'single' ? 'default' : 'outline'} onClick={() => setCreateMode('single')} className={createMode === 'single' ? 'bg-emerald-600' : ''}>
                <Users className="w-4 h-4 mr-2" /> Single Student
              </Button>
              <Button variant={createMode === 'mass' ? 'default' : 'outline'} onClick={() => setCreateMode('mass')} className={createMode === 'mass' ? 'bg-emerald-600' : ''}>
                <ShoppingCart className="w-4 h-4 mr-2" /> Bulk by Class
              </Button>
            </div>

            <Card>
              <CardContent className="p-6 space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                  <div>
                    <Label className="text-xs font-medium">Date</Label>
                    <Input type="date" value={createDate} onChange={(e) => setCreateDate(e.target.value)} className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs font-medium">Term</Label>
                    <Select value={createTerm} onValueChange={setCreateTerm}>
                      <SelectTrigger className="mt-1"><SelectValue placeholder="Select term" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Term 1">Term 1</SelectItem>
                        <SelectItem value="Term 2">Term 2</SelectItem>
                        <SelectItem value="Term 3">Term 3</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs font-medium">Year</Label>
                    <Select value={createYear} onValueChange={setCreateYear}>
                      <SelectTrigger className="mt-1"><SelectValue placeholder="Select year" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2025/2026">2025/2026</SelectItem>
                        <SelectItem value="2024/2025">2024/2025</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {createMode === 'single' ? (
                    <>
                      <div>
                        <Label className="text-xs font-medium">Class</Label>
                        <Select value={createClassId} onValueChange={(v) => v === '__none__' ? setCreateClassId('') : setCreateClassId(v)}>
                          <SelectTrigger className="mt-1"><SelectValue placeholder="Optional" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none__">No class</SelectItem>
                            {classes.map((c) => <SelectItem key={c.class_id} value={String(c.class_id)}>{c.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs font-medium">Search Student</Label>
                        <Input placeholder="Name or code..." value={studentSearch} onChange={(e) => handleSearchStudents(e.target.value)} className="mt-1" />
                      </div>
                    </>
                  ) : (
                    <div className="sm:col-span-2">
                      <Label className="text-xs font-medium">Class (for bulk billing)</Label>
                      <Select value={massBillClassId} onValueChange={setMassBillClassId}>
                        <SelectTrigger className="mt-1"><SelectValue placeholder="Select class" /></SelectTrigger>
                        <SelectContent>
                          {classes.map((c) => <SelectItem key={c.class_id} value={String(c.class_id)}>{c.name} ({c._count?.enrolls || 0} students)</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                {/* Student Selection (single mode) */}
                {createMode === 'single' && createStudents.length > 0 && (
                  <div className="max-h-40 overflow-y-auto border rounded-lg">
                    {createStudents.map((s: any) => (
                      <label key={s.student_id} className="flex items-center gap-2 px-3 py-2 hover:bg-slate-50 cursor-pointer text-sm border-b last:border-0">
                        <Checkbox checked={selectedStudentIds.includes(s.student_id)} onCheckedChange={() => toggleSelection(s.student_id, selectedStudentIds, setSelectedStudentIds)} />
                        <span className="flex-1">{s.name}</span>
                        <span className="text-xs text-slate-400">{s.student_code}</span>
                      </label>
                    ))}
                  </div>
                )}
                {createMode === 'single' && selectedStudentIds.length > 0 && (
                  <p className="text-xs text-emerald-600 font-medium">{selectedStudentIds.length} student(s) selected</p>
                )}

                <Separator />

                {/* Bill Items Selection */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">Select Billing Items</Label>
                  {billItems.length === 0 ? (
                    <p className="text-sm text-slate-400 italic">No billing items configured. Add items in the Bill Items tab first.</p>
                  ) : (
                    <div className="max-h-48 overflow-y-auto border rounded-lg divide-y">
                      {billItems.map((item) => {
                        const isSelected = createMode === 'mass'
                          ? massBillItems.includes(item.id)
                          : selectedItems.includes(item.id);
                        return (
                          <label key={item.id} className="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 cursor-pointer text-sm">
                            <Checkbox checked={isSelected} onCheckedChange={() => {
                              if (createMode === 'mass') toggleSelection(item.id, massBillItems, setMassBillItems);
                              else toggleSelection(item.id, selectedItems, setSelectedItems);
                            }} />
                            <span className="flex-1">{item.title}</span>
                            {item.bill_category && <Badge variant="secondary" className="text-xs">{item.bill_category.bill_category_name}</Badge>}
                            <span className="font-mono text-sm text-slate-600">{fmt(item.amount)}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Total */}
                {(createMode === 'mass' ? massBillItems.length > 0 : selectedItems.length > 0) && (
                  <div className="bg-emerald-50 rounded-lg p-3 flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700">Total per student:</span>
                    <span className="text-lg font-bold text-emerald-700">{fmt(createMode === 'mass' ? getSelectedTotal(massBillItems) : getSelectedTotal(selectedItems))}</span>
                  </div>
                )}

                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={() => { setSelectedStudentIds([]); setSelectedItems([]); setMassBillItems([]); setStudentSearch(''); }}>Reset</Button>
                  <Button onClick={handleCreateInvoice} disabled={creating || (createMode === 'mass' ? !massBillClassId : selectedStudentIds.length === 0)} className="bg-emerald-600 hover:bg-emerald-700">
                    {creating ? 'Creating...' : createMode === 'mass' ? `Bill ${massBillClassId ? 'Class' : ''}` : `Create Invoice for ${selectedStudentIds.length} Student(s)`}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB: Bill Items */}
          <TabsContent value="bill-items" className="space-y-4">
            {/* Add Bill Item Form */}
            <Card>
              <CardContent className="p-5">
                <h3 className="font-semibold text-sm mb-3 flex items-center gap-2"><Plus className="w-4 h-4 text-emerald-600" /> Add Invoice Item</h3>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                  <div className="md:col-span-1">
                    <Label className="text-xs">Title</Label>
                    <Input placeholder="Bill item title" value={newItemTitle} onChange={(e) => setNewItemTitle(e.target.value)} className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs">Category</Label>
                    <Select value={newItemCategory === '' ? '__none__' : newItemCategory} onValueChange={(v) => setNewItemCategory(v === '__none__' ? '' : v)}>
                      <SelectTrigger className="mt-1"><SelectValue placeholder="Select category" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">No category</SelectItem>
                        {billCategories.map((c) => <SelectItem key={c.bill_category_id} value={String(c.bill_category_id)}>{c.bill_category_name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Amount</Label>
                    <div className="flex mt-1">
                      <span className="inline-flex items-center px-3 text-xs font-bold bg-slate-100 border border-r-0 rounded-l-lg">GHS</span>
                      <Input type="number" placeholder="Amount" value={newItemAmount} onChange={(e) => setNewItemAmount(e.target.value)} className="rounded-l-none" />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Description</Label>
                    <Textarea placeholder="Description" value={newItemDesc} onChange={(e) => setNewItemDesc(e.target.value)} className="mt-1 min-h-[38px] h-[38px]" />
                  </div>
                  <div className="flex items-end">
                    <Button onClick={handleAddBillItem} disabled={addingItem} className="w-full bg-emerald-600 hover:bg-emerald-700">
                      {addingItem ? 'Adding...' : <><Plus className="w-4 h-4 mr-1" /> Add Item</>}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Bill Items Table */}
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50">
                        <TableHead className="w-12 text-xs">#</TableHead>
                        <TableHead className="text-xs">Title</TableHead>
                        <TableHead className="text-xs">Category</TableHead>
                        <TableHead className="text-xs">Amount</TableHead>
                        <TableHead className="text-xs">Description</TableHead>
                        <TableHead className="text-xs text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {billItems.length === 0 ? (
                        <TableRow><TableCell colSpan={6} className="text-center py-8 text-slate-400"><Tag className="w-8 h-8 mx-auto mb-2 opacity-50" /><p>No bill items yet. Add one above.</p></TableCell></TableRow>
                      ) : billItems.map((item, idx) => (
                        editItem?.id === item.id ? (
                          <TableRow key={item.id} className="bg-amber-50">
                            <TableCell className="text-xs">{idx + 1}</TableCell>
                            <TableCell><Input value={editItemTitle} onChange={(e) => setEditItemTitle(e.target.value)} className="h-8 text-sm" /></TableCell>
                            <TableCell>
                              <Select value={editItemCategory === '' ? '__none__' : editItemCategory} onValueChange={(v) => setEditItemCategory(v === '__none__' ? '' : v)}>
                                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="__none__">None</SelectItem>
                                  {billCategories.map((c) => <SelectItem key={c.bill_category_id} value={String(c.bill_category_id)}>{c.bill_category_name}</SelectItem>)}
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell><Input type="number" value={editItemAmount} onChange={(e) => setEditItemAmount(e.target.value)} className="h-8 text-sm w-28" /></TableCell>
                            <TableCell><Input value={editItemDesc} onChange={(e) => setEditItemDesc(e.target.value)} className="h-8 text-sm" /></TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button size="sm" className="h-7 bg-emerald-600 hover:bg-emerald-700 text-xs" onClick={handleSaveEditItem} disabled={savingItem}><CheckCircle2 className="w-3 h-3 mr-1" />{savingItem ? '...' : 'Save'}</Button>
                                <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setEditItem(null)}><XCircle className="w-3 h-3" /></Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : (
                          <TableRow key={item.id} className="hover:bg-slate-50">
                            <TableCell className="text-xs text-slate-500">{idx + 1}</TableCell>
                            <TableCell className="font-medium text-sm">{item.title}</TableCell>
                            <TableCell><Badge variant="secondary" className="text-xs">{item.bill_category?.bill_category_name || '—'}</Badge></TableCell>
                            <TableCell className="font-mono text-sm">{fmt(item.amount)}</TableCell>
                            <TableCell className="text-sm text-slate-500">{item.description || '—'}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button variant="ghost" size="sm" className="h-7 text-xs text-emerald-600" onClick={() => handleStartEditItem(item)}><Edit3 className="w-3 h-3 mr-1" />Edit</Button>
                                <Button variant="ghost" size="sm" className="h-7 text-xs text-red-500" onClick={() => handleDeleteBillItem(item.id)}><Trash2 className="w-3 h-3 mr-1" />Delete</Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* View Invoice Dialog */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Receipt className="w-5 h-5 text-emerald-600" /> Invoice Details</DialogTitle>
          </DialogHeader>
          {viewLoading ? <div className="space-y-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-4 w-full" />)}</div>
          : viewInvoice ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-slate-400 text-xs">Invoice Code</p><p className="font-mono font-medium">{viewInvoice.invoice_code}</p></div>
                <div><p className="text-slate-400 text-xs">Status</p><Badge variant="outline" className={statusConfig[viewInvoice.status]?.className}>{statusConfig[viewInvoice.status]?.label}</Badge></div>
                <div><p className="text-slate-400 text-xs">Student</p><p className="font-medium">{viewInvoice.student?.name}</p><p className="text-xs text-slate-400">{viewInvoice.student?.student_code}</p></div>
                <div><p className="text-slate-400 text-xs">Date</p><p>{fmtDate(viewInvoice.creation_timestamp)}</p></div>
                <div className="col-span-2"><p className="text-slate-400 text-xs">Title</p><p>{viewInvoice.title}</p></div>
              </div>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader><TableRow className="bg-slate-50"><TableHead className="text-xs">Item</TableHead><TableHead className="text-xs text-right">Amount</TableHead></TableRow></TableHeader>
                  <TableBody>
                    <TableRow><TableCell className="text-sm">{viewInvoice.description || viewInvoice.title}</TableCell><TableCell className="text-right font-mono">{fmt(viewInvoice.amount)}</TableCell></TableRow>
                    {viewInvoice.discount > 0 && <TableRow><TableCell className="text-sm text-emerald-600">Discount</TableCell><TableCell className="text-right font-mono text-emerald-600">-{fmt(viewInvoice.discount)}</TableCell></TableRow>}
                    <TableRow className="bg-slate-50 font-bold"><TableCell>Paid</TableCell><TableCell className="text-right font-mono text-emerald-600">{fmt(viewInvoice.amount_paid)}</TableCell></TableRow>
                    <TableRow className="font-bold"><TableCell>Balance Due</TableCell><TableCell className="text-right font-mono text-red-600">{fmt(viewInvoice.due)}</TableCell></TableRow>
                  </TableBody>
                </Table>
              </div>
              {viewInvoice.payments && viewInvoice.payments.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Payment History</p>
                  <div className="max-h-40 overflow-y-auto border rounded-lg divide-y">
                    {viewInvoice.payments.map((p: any) => (
                      <div key={p.payment_id} className="flex items-center justify-between px-3 py-2 text-sm">
                        <div><p className="font-mono text-xs">{p.receipt_code}</p><p className="text-xs text-slate-400">{fmtDate(p.timestamp)}</p></div>
                        <div className="text-right"><p className="font-mono text-emerald-600">{fmt(p.amount)}</p><p className="text-xs capitalize">{p.payment_method?.replace('_', ' ')}</p></div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : null}
          <DialogFooter><Button variant="outline" onClick={() => setViewOpen(false)}>Close</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Invoice Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Edit Invoice</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label className="text-xs">Title</Label><Input value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} className="mt-1" /></div>
            <div><Label className="text-xs">Description</Label><Input value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} className="mt-1" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Amount</Label><Input type="number" value={editForm.amount} onChange={(e) => setEditForm({ ...editForm, amount: parseFloat(e.target.value) || 0 })} className="mt-1" /></div>
              <div><Label className="text-xs">Discount</Label><Input type="number" value={editForm.discount} onChange={(e) => setEditForm({ ...editForm, discount: parseFloat(e.target.value) || 0 })} className="mt-1" /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveEdit} disabled={editing} className="bg-emerald-600 hover:bg-emerald-700">{editing ? 'Saving...' : 'Update'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Delete Invoice</DialogTitle></DialogHeader>
          <p className="text-sm text-slate-600">This will permanently delete this invoice and all associated payments. This action cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteInvoice} disabled={deleting}>{deleting ? 'Deleting...' : 'Delete'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Take Payment Dialog */}
      <Dialog open={payOpen} onOpenChange={setPayOpen}>
        <DialogContent className="max-w-md border-t-4 border-t-emerald-500">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-right font-bold text-slate-500 text-xl">
              TAKE PAYMENT
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Student Selection */}
            <div>
              <Label className="text-xs font-bold text-slate-600">SELECT STUDENT</Label>
              <Select value={payStudentId ? String(payStudentId) : ''} onValueChange={handlePayStudentChange}>
                <SelectTrigger className="mt-1 h-12 text-sm"><SelectValue placeholder="Search students who owe..." /></SelectTrigger>
                <SelectContent>
                  {payStudentsOwing.map((s: any) => (
                    <SelectItem key={s.student_id} value={String(s.student_id)}>
                      {s.name.toUpperCase()} — {s.class_name} {s.name_numeric} (Owes: GHS {fmtShort(s.total_due)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {payStudentDetail && (
              <div className="border rounded-lg p-3 space-y-1">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="font-semibold text-slate-400">NAME:</span><span className="font-semibold uppercase">{payStudentDetail.name}</span>
                  <span className="font-semibold text-slate-400">CLASS:</span><span className="font-semibold uppercase">{payStudentDetail.class_name} {payStudentDetail.name_numeric}</span>
                  <span className="font-semibold text-slate-500">TOTAL PAYABLE:</span><span className="font-semibold text-red-600">{fmt(payStudentDetail.total_due)}</span>
                </div>
              </div>
            )}

            <div className="border-t pt-3 space-y-3">
              <div><Label className="text-xs font-bold text-slate-700">PAYMENT MODE</Label>
                <Select value={payMethod} onValueChange={setPayMethod}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">CASH</SelectItem>
                    <SelectItem value="mobile_money">MOBILE MONEY</SelectItem>
                    <SelectItem value="cheque">CHEQUE</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label className="text-xs font-bold text-slate-700">AMOUNT (GHS)</Label><Input type="number" placeholder="Enter amount" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} className="mt-1 text-lg font-mono" /></div>
              <div><Label className="text-xs font-bold text-slate-700">RECEIPT No.</Label><Input placeholder="Auto-generated if blank" value={payReceiptCode} onChange={(e) => setPayReceiptCode(e.target.value)} className="mt-1 tracking-wider" /></div>
            </div>
          </div>
          <DialogFooter className="flex items-center justify-between sm:justify-between">
            <div className="flex items-center gap-2">
              <Label className="text-xs font-bold uppercase text-slate-500">Print Receipt?</Label>
              <Checkbox defaultChecked />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => { setPayOpen(false); setPayAmount(''); setPayReceiptCode(''); }}>Cancel</Button>
              <Button onClick={handleTakePayment} disabled={paying || !payStudentId || !payAmount} className="bg-emerald-600 hover:bg-emerald-700 min-w-[140px]">
                {paying ? 'Processing...' : 'TAKE PAYMENT'}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
