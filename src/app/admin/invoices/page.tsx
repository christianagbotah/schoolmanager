'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import {
  FileText, Search, Plus, Printer, Eye, Pencil, Trash2, Users, DollarSign,
  AlertCircle, ChevronLeft, ChevronRight, Receipt, CreditCard, Tag,
  ShoppingCart, CheckCircle2, XCircle, Info, Edit3, Download,
  X, TrendingUp, Wallet, Clock, BanknoteIcon,
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
interface Receipt { payment_id: number; student_id: number; invoice_id: number | null; invoice_code: string; receipt_code: string; title: string; amount: number; due: number; payment_type: string; payment_method: string; year: string; term: string; timestamp: string; approval_status: string; student: { student_id: number; name: string; student_code: string }; invoice: { invoice_code: string; title: string } | null; }

// ======== CONFIG ========
const statusConfig: Record<string, { label: string; className: string; dotColor: string }> = {
  paid: { label: 'Paid', className: 'bg-emerald-100 text-emerald-700 border-emerald-200', dotColor: 'bg-emerald-500' },
  partial: { label: 'Partial', className: 'bg-amber-100 text-amber-700 border-amber-200', dotColor: 'bg-amber-500' },
  unpaid: { label: 'Unpaid', className: 'bg-red-100 text-red-700 border-red-200', dotColor: 'bg-red-500' },
  overdue: { label: 'Overdue', className: 'bg-rose-100 text-rose-700 border-rose-200', dotColor: 'bg-rose-500' },
};

function fmt(amount: number) {
  return new Intl.NumberFormat('en-UG', { style: 'currency', currency: 'GHS', minimumFractionDigits: 2 }).format(amount);
}
function fmtShort(amount: number) {
  return new Intl.NumberFormat('en-UG', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
}
function fmtDate(d: string) {
  if (!d) return '\u2014';
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

// ======== MAIN COMPONENT ========
export default function InvoicesPage() {
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
  const [summary, setSummary] = useState({ totalBilled: 0, totalCollected: 0, outstanding: 0, paidCount: 0 });
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [activeTab, setActiveTab] = useState('all');
  const [mainTab, setMainTab] = useState<'invoices' | 'receipts'>('invoices');

  // Bill items state
  const [billItems, setBillItems] = useState<BillItem[]>([]);
  const [billCategories, setBillCategories] = useState<BillCategory[]>([]);
  const [newItemTitle, setNewItemTitle] = useState('');
  const [newItemAmount, setNewItemAmount] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('');
  const [newItemDesc, setNewItemDesc] = useState('');
  const [addingItem, setAddingItem] = useState(false);
  const [editItem, setEditItem] = useState<BillItem | null>(null);
  const [editItemTitle, setEditItemTitle] = useState('');
  const [editItemAmount, setEditItemAmount] = useState('');
  const [editItemCategory, setEditItemCategory] = useState('');
  const [editItemDesc, setEditItemDesc] = useState('');
  const [savingItem, setSavingItem] = useState(false);

  // Create invoice dialog
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
  const [massBillClassId, setMassBillClassId] = useState('');
  const [massBillItems, setMassBillItems] = useState<number[]>([]);

  // Bill Items dialog
  const [billItemsOpen, setBillItemsOpen] = useState(false);

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

  // Receipts tab (CI3 parity - All Receipts)
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [receiptsLoading, setReceiptsLoading] = useState(false);
 const [receiptsTotal, setReceiptsTotal] = useState(0);
 const [receiptsPage, setReceiptsPage] = useState(1);
 const [receiptsTotalPages, setReceiptsTotalPages] = useState(1);
 const [receiptsSearch, setReceiptsSearch] = useState('');
 const [receiptsMethod, setReceiptsMethod] = useState('');
 const [receiptsStartDate, setReceiptsStartDate] = useState('');
 const [receiptsEndDate, setReceiptsEndDate] = useState('');
 const [receiptsSummary, setReceiptsSummary] = useState({ totalCollected: 0, todayTotal: 0, monthTotal: 0 });
 const [receiptsViewOpen, setReceiptsViewOpen] = useState(false);
  const [receiptsViewPayment, setReceiptsViewPayment] = useState<Receipt | null>(null);

  const [payStudentsOwing, setPayStudentsOwing] = useState<any[]>([]);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('cash');
  const [payReceiptCode, setPayReceiptCode] = useState('');
  const [payYear, setPayYear] = useState('');
  const [payTerm, setPayTerm] = useState('');
  const [paying, setPaying] = useState(false);
  const [payStudentDetail, setPayStudentDetail] = useState<any>(null);

  // ===== DERIVED STATE =====
  const hasActiveFilters = useMemo(() => {
    return !!(search || classId || status || year || term);
  }, [search, classId, status, year, term]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (search) count++;
    if (classId) count++;
    if (status) count++;
    if (year) count++;
    if (term) count++;
    return count;
  }, [search, classId, status, year, term]);

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
      setSummary(data.summary || { totalBilled: 0, totalCollected: 0, outstanding: 0, paidCount: 0 });
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
  }, [search, fetchInvoices]);

  useEffect(() => { setPage(1); }, [classId, status, year, term]);

  // Tab change handler
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (tab === 'all') {
      setStatus('');
    } else if (tab === 'pending') {
      setStatus('unpaid');
    } else {
      setStatus(tab);
    }
    setPage(1);
  };

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
    } catch (err: unknown) { const msg = err instanceof Error ? err.message : 'Failed to add item'; toast.error(msg); } finally { setAddingItem(false); }
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
    } catch (err: unknown) { const msg = err instanceof Error ? err.message : 'Failed to update item'; toast.error(msg); } finally { setSavingItem(false); }
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
    } catch (err: unknown) { const msg = err instanceof Error ? err.message : 'Failed to delete item'; toast.error(msg); }
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
      const body: Record<string, unknown> = {
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
    } catch (err: unknown) { const msg = err instanceof Error ? err.message : 'Failed to create invoice'; toast.error(msg); } finally { setCreating(false); }
  };

  // ===== INVOICE ACTIONS =====
  const handleViewInvoice = async (id: number) => {
    setViewOpen(true); setViewLoading(true);
    try {
      const res = await fetch(`/api/admin/invoices/${id}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setViewInvoice(data);
    } catch (err: unknown) { const msg = err instanceof Error ? err.message : 'Failed to load invoice'; toast.error(msg); setViewOpen(false); } finally { setViewLoading(false); }
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
    } catch (err: unknown) { const msg = err instanceof Error ? err.message : 'Failed to update'; toast.error(msg); } finally { setEditing(false); }
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
    } catch (err: unknown) { const msg = err instanceof Error ? err.message : 'Failed to delete'; toast.error(msg); } finally { setDeleting(false); }
  };

  const handlePrintInvoice = (inv: Invoice) => {
    const sc = statusConfig[inv.status] || statusConfig.unpaid;
    const statusBg = inv.status === 'paid' ? '#d1fae5' : inv.status === 'partial' ? '#fef3c7' : '#fee2e2';
    const statusColor = inv.status === 'paid' ? '#065f46' : inv.status === 'partial' ? '#92400e' : '#991b1b';
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`<html><head><title>Invoice ${inv.invoice_code}</title>
      <style>body{font-family:Arial,sans-serif;padding:40px;color:#333;max-width:800px;margin:0 auto}
      table{width:100%;border-collapse:collapse;margin:16px 0}th,td{border:1px solid #ddd;padding:10px;text-align:left}
      th{background:#f5f5f5;font-size:13px}.total-row{font-weight:bold;background:#f0fdf4;border-top:2px solid #059669}
      .header-table{border:none;margin:0}.header-table td{border:none;padding:4px 0}
      .info-row td{border:none;padding:4px 12px;text-align:right;font-size:13px}
      @media print{body{padding:20px}}</style></head><body>
      <table class="header-table"><tr>
        <td style="vertical-align:top"><div style="font-size:20px;font-weight:bold;color:#059669">School Manager</div><p style="color:#666;font-size:12px">School Fee Invoice</p></td>
        <td style="text-align:right;vertical-align:top"><h2 style="margin:0;color:#1e293b">INVOICE</h2><p style="font-family:monospace;font-size:13px">${inv.invoice_code}</p><p style="font-size:13px">${fmtDate(inv.creation_timestamp)}</p>
        <span style="padding:4px 12px;border-radius:20px;font-size:12px;background:${statusBg};color:${statusColor}">${sc.label.toUpperCase()}</span></td>
      </tr></table>
      <table style="border:none;margin:8px 0"><tr>
        <td style="border:none;padding:0"><h4 style="margin:0;font-size:13px;color:#666">BILL TO</h4>
        <p style="font-size:14px;font-weight:bold;margin:4px 0">${inv.student?.name || 'Unknown'}</p>
        <p style="font-size:12px;color:#666">${inv.student?.student_code || ''}<br/>${inv.class_name || ''}</p></td>
        <td style="border:none;padding:0;text-align:right"><h4 style="margin:0;font-size:13px;color:#666">DETAILS</h4>
        <p style="font-size:12px;margin:4px 0"><strong>Term:</strong> ${inv.term} &nbsp; <strong>Year:</strong> ${inv.year}</p></td>
      </tr></table>
      <hr style="margin:12px 0;border-color:#e2e8f0">
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
        const detail = (data.students || []).find((s: { student_id: number }) => s.student_id === studentId);
        setPayStudentDetail(detail || null);
      }
    } catch { toast.error('Failed to load students'); }
  };

  const handlePayStudentChange = (studentId: string) => {
    const sid = parseInt(studentId);
    setPayStudentId(sid);
    const detail = payStudentsOwing.find((s: { student_id: number }) => s.student_id === sid);
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

      setPayOpen(false); setPayAmount(''); setPayReceiptCode('');
      setPayStudentId(null); setPayStudentDetail(null);
      fetchInvoices();

      if (data.printReceipt && data.receiptCode) {
        setTimeout(() => {
          const w = window.open('', '_blank');
          if (w) {
            const student = payStudentsOwing.find((s: { student_id: number | null }) => s.student_id === payStudentId);
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
    } catch (err: unknown) { const msg = err instanceof Error ? err.message : 'Payment failed'; toast.error(msg); } finally { setPaying(false); }
  };

  // ===== EXPORT CSV =====
  const handleExportCSV = () => {
    const headers = ['Invoice Code', 'Student', 'Class', 'Amount', 'Paid', 'Balance', 'Status', 'Date'];
    const rows = invoices.map(inv => [
      inv.invoice_code, inv.student?.name || '', inv.class_name || '',
      inv.amount, inv.amount_paid, inv.due, inv.status,
      fmtDate(inv.creation_timestamp),
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoices-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exported');
  };

  const clearAllFilters = () => {
    setSearch('');
    setClassId('');
    setStatus('');
    setYear('');
    setTerm('');
    setActiveTab('all');
    setPage(1);
  };

  const toggleSelection = (id: number, list: number[], setList: (v: number[]) => void) => {
    setList(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
  };
  const getSelectedTotal = (items: number[]) => billItems.filter((i) => items.includes(i.id)).reduce((s, i) => s + i.amount, 0);

  // ===== RECEIPTS =====
  const fetchReceipts = useCallback(async () => {
    setReceiptsLoading(true);
    try {
      const params = new URLSearchParams();
      if (receiptsSearch) params.set('search', receiptsSearch);
      if (receiptsMethod) params.set('method', receiptsMethod);
      if (receiptsStartDate) params.set('startDate', receiptsStartDate);
      if (receiptsEndDate) params.set('endDate', receiptsEndDate);
      params.set('page', String(receiptsPage));
      params.set('limit', '15');
      const res = await fetch(`/api/admin/payments?${params}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setReceipts(data.payments || []);
      setReceiptsTotalPages(data.pagination?.totalPages || 1);
      setReceiptsTotal(data.pagination?.total || 0);
      setReceiptsSummary(data.summary || { totalCollected: 0, todayTotal: 0, monthTotal: 0 });
    } catch { toast.error('Failed to load receipts'); } finally { setReceiptsLoading(false); }
  }, [receiptsSearch, receiptsMethod, receiptsStartDate, receiptsEndDate, receiptsPage]);

  useEffect(() => { if (mainTab === 'receipts') fetchReceipts(); }, [fetchReceipts, mainTab]);
  useEffect(() => { setReceiptsPage(1); }, [receiptsSearch, receiptsMethod, receiptsStartDate, receiptsEndDate]);

  const handlePrintReceipt = (r: Receipt) => {
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`<html><head><title>Receipt ${r.receipt_code}</title>
      <style>body{font-family:Arial;padding:40px;color:#333;max-width:600px;margin:0 auto;text-align:center}
      .receipt{border:2px dashed #ccc;padding:30px;border-radius:8px}
      h2{color:#059669;margin:0}table{width:100%;border-collapse:collapse;margin:20px 0}
      th,td{padding:8px;border-bottom:1px solid #eee;text-align:left}
      .amount{font-size:24px;font-weight:bold;color:#059669}
      @media print{body{padding:20px}}</style></head><body>
      <div class="receipt"><h2>RECEIPT</h2>
      <p style="font-family:monospace;font-size:12px;color:#666">${r.receipt_code}</p>
      <hr style="margin:16px 0;border:none;border-top:1px solid #ccc">
      <p><strong>${r.student?.name || 'Student'}</strong></p>
      <p style="font-size:12px;color:#666">${r.student?.student_code || ''}</p>
      <p style="font-size:12px;color:#666">${r.title || ''}</p>
      <div class="amount">GHS ${r.amount.toFixed(2)}</div>
      <p style="font-size:12px;color:#666">Method: ${(r.payment_method || '').replace(/_/g, ' ')}</p>
      <p style="font-size:12px;color:#666">${r.timestamp ? new Date(r.timestamp).toLocaleString() : ''}</p>
      <hr style="margin:16px 0;border:none;border-top:1px solid #ccc">
      <p style="font-size:11px;color:#999">Thank you for your payment</p></div>
      </body></html>`);
    w.document.close();
    setTimeout(() => w.print(), 300);
  };

  // ===== RENDER ========
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Invoices</h1>
            <p className="text-sm text-slate-500 mt-1">Create invoices, manage billing, and track payments</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={handleExportCSV} className="border-slate-200 text-slate-600 hover:bg-slate-50 h-9">
              <Download className="w-4 h-4 mr-1.5" /> Export
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleOpenTakePayment()} className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 h-9">
              <CreditCard className="w-4 h-4 mr-1.5" /> Take Payment
            </Button>
            <Button variant="outline" size="sm" onClick={() => setBillItemsOpen(true)} className="border-slate-200 text-slate-600 hover:bg-slate-50 h-9">
              <Tag className="w-4 h-4 mr-1.5" /> Bill Items
            </Button>
            <Button size="sm" onClick={() => { setCreateOpen(true); setSelectedStudentIds([]); setSelectedItems([]); setMassBillItems([]); setCreateMode('single'); }} className="bg-emerald-600 hover:bg-emerald-700 h-9">
              <Plus className="w-4 h-4 mr-1.5" /> Create Invoice
            </Button>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="border-slate-200/60 overflow-hidden">
                <CardContent className="p-5 flex items-center gap-4">
                  <Skeleton className="w-12 h-12 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-6 w-28" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <>
              <Card className="border-slate-200/60 overflow-hidden hover:shadow-md transition-shadow">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
                    <FileText className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-slate-500 font-medium">Total Invoices</p>
                    <p className="text-2xl font-bold text-slate-900 leading-tight">{total}</p>
                    <p className="text-xs text-slate-400 mt-0.5">Page {page} of {totalPages}</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-slate-200/60 overflow-hidden hover:shadow-md transition-shadow">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-sky-100 flex items-center justify-center shrink-0">
                    <TrendingUp className="w-6 h-6 text-sky-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-slate-500 font-medium">Total Billed</p>
                    <p className="text-2xl font-bold text-sky-700 leading-tight">{fmt(summary.totalBilled)}</p>
                    <p className="text-xs text-slate-400 mt-0.5">All invoices</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-slate-200/60 overflow-hidden hover:shadow-md transition-shadow">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
                    <Wallet className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-slate-500 font-medium">Total Collected</p>
                    <p className="text-2xl font-bold text-emerald-700 leading-tight">{fmt(summary.totalCollected)}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{summary.paidCount} paid invoices</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-slate-200/60 overflow-hidden hover:shadow-md transition-shadow">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                    <AlertCircle className="w-6 h-6 text-red-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-slate-500 font-medium">Outstanding</p>
                    <p className="text-2xl font-bold text-red-600 leading-tight">{fmt(summary.outstanding)}</p>
                    <p className="text-xs text-slate-400 mt-0.5">Balance due</p>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Search + Filters */}
        <Card className="border-slate-200/60">
          <CardContent className="p-4 space-y-3">
            <div className="flex flex-col lg:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search by student name or invoice code..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 h-10"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Select value={classId} onValueChange={(v) => v === '__all__' ? setClassId('') : setClassId(v)}>
                  <SelectTrigger className="w-[150px] h-10"><SelectValue placeholder="All Classes" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">All Classes</SelectItem>
                    {classes.map((c) => <SelectItem key={c.class_id} value={String(c.class_id)}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={year} onValueChange={(v) => v === '__all__' ? setYear('') : setYear(v)}>
                  <SelectTrigger className="w-[140px] h-10"><SelectValue placeholder="All Years" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">All Years</SelectItem>
                    <SelectItem value="2025/2026">2025/2026</SelectItem>
                    <SelectItem value="2024/2025">2024/2025</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={term} onValueChange={(v) => v === '__all__' ? setTerm('') : setTerm(v)}>
                  <SelectTrigger className="w-[130px] h-10"><SelectValue placeholder="All Terms" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">All Terms</SelectItem>
                    <SelectItem value="Term 1">Term 1</SelectItem>
                    <SelectItem value="Term 2">Term 2</SelectItem>
                    <SelectItem value="Term 3">Term 3</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={status || '__all__'} onValueChange={(v) => { if (v === '__all__') { setStatus(''); setActiveTab('all'); } else { setStatus(v); setActiveTab(v); } }}>
                  <SelectTrigger className="w-[130px] h-10"><SelectValue placeholder="All Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">All Status</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="unpaid">Unpaid</SelectItem>
                    <SelectItem value="partial">Partial</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Active Filter Chips */}
            {hasActiveFilters && (
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-xs text-slate-400 font-medium">{activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''} active</span>
                {search && (
                  <Badge variant="secondary" className="gap-1 text-xs pr-1.5 pl-2.5 py-1">
                    Search: &ldquo;{search}&rdquo;
                    <button onClick={() => setSearch('')} className="hover:bg-slate-200 rounded-full p-0.5"><X className="w-3 h-3" /></button>
                  </Badge>
                )}
                {classId && (
                  <Badge variant="secondary" className="gap-1 text-xs pr-1.5 pl-2.5 py-1">
                    Class: {classes.find(c => c.class_id === parseInt(classId))?.name || classId}
                    <button onClick={() => setClassId('')} className="hover:bg-slate-200 rounded-full p-0.5"><X className="w-3 h-3" /></button>
                  </Badge>
                )}
                {status && (
                  <Badge variant="secondary" className="gap-1 text-xs pr-1.5 pl-2.5 py-1">
                    Status: {statusConfig[status]?.label || status}
                    <button onClick={() => { setStatus(''); setActiveTab('all'); }} className="hover:bg-slate-200 rounded-full p-0.5"><X className="w-3 h-3" /></button>
                  </Badge>
                )}
                {year && (
                  <Badge variant="secondary" className="gap-1 text-xs pr-1.5 pl-2.5 py-1">
                    Year: {year}
                    <button onClick={() => setYear('')} className="hover:bg-slate-200 rounded-full p-0.5"><X className="w-3 h-3" /></button>
                  </Badge>
                )}
                {term && (
                  <Badge variant="secondary" className="gap-1 text-xs pr-1.5 pl-2.5 py-1">
                    Term: {term}
                    <button onClick={() => setTerm('')} className="hover:bg-slate-200 rounded-full p-0.5"><X className="w-3 h-3" /></button>
                  </Badge>
                )}
                <button onClick={clearAllFilters} className="text-xs text-slate-500 hover:text-red-600 font-medium ml-1">
                  Clear all
                </button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tabs + Invoice List */}
        <Card className="border-slate-200/60 overflow-hidden">
          <div className="border-b px-4 pt-4">
            <Tabs value={activeTab} onValueChange={handleTabChange}>
              <TabsList className="bg-slate-100">
                <TabsTrigger value="all" className="text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  All
                </TabsTrigger>
                <TabsTrigger value="unpaid" className="text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  Pending
                </TabsTrigger>
                <TabsTrigger value="paid" className="text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  Paid
                </TabsTrigger>
                <TabsTrigger value="partial" className="text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  Partial
                </TabsTrigger>
              </TabsList>

              {/* All tabs share the same content */}
              {['all', 'unpaid', 'paid', 'partial'].map((tab) => (
                <TabsContent key={tab} value={tab} className="mt-0">
                  {/* Results Count */}
                  {!loading && (
                    <div className="flex items-center justify-between px-1 py-3">
                      <p className="text-sm text-slate-500">
                        {total > 0 ? (
                          <>Showing {(page - 1) * 15 + 1}\u2013{Math.min(page * 15, total)} of <span className="font-semibold text-slate-700">{total}</span> invoices</>
                        ) : (
                          <span className="text-slate-400">No results</span>
                        )}
                      </p>
                    </div>
                  )}

                  {/* Desktop Table */}
                  <div className="hidden md:block overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50/80">
                          <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider w-[130px]">Invoice #</TableHead>
                          <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Student</TableHead>
                          <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider hidden lg:table-cell">Title</TableHead>
                          <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider hidden xl:table-cell">Class</TableHead>
                          <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Amount</TableHead>
                          <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Paid</TableHead>
                          <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Balance</TableHead>
                          <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider w-[100px]">Status</TableHead>
                          <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider hidden 2xl:table-cell">Date</TableHead>
                          <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider text-right w-[180px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {loading ? (
                          Array.from({ length: 6 }).map((_, i) => (
                            <TableRow key={i}>
                              <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                              <TableCell><Skeleton className="h-4 w-32" /><Skeleton className="h-3 w-20 mt-1" /></TableCell>
                              <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-28" /></TableCell>
                              <TableCell className="hidden xl:table-cell"><Skeleton className="h-4 w-16" /></TableCell>
                              <TableCell className="text-right"><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                              <TableCell className="text-right"><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                              <TableCell className="text-right"><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                              <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
                              <TableCell className="hidden 2xl:table-cell"><Skeleton className="h-4 w-24" /></TableCell>
                              <TableCell className="text-right"><Skeleton className="h-8 w-28 ml-auto" /></TableCell>
                            </TableRow>
                          ))
                        ) : invoices.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={10} className="h-[320px]">
                              <div className="flex flex-col items-center justify-center text-slate-400">
                                <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                                  <FileText className="w-8 h-8 text-slate-300" />
                                </div>
                                <p className="font-semibold text-slate-600 text-base">No invoices found</p>
                                <p className="text-sm mt-1 mb-4">
                                  {hasActiveFilters ? 'Try adjusting your search or filters' : 'Get started by creating your first invoice'}
                                </p>
                                {!hasActiveFilters && (
                                  <Button size="sm" onClick={() => { setCreateOpen(true); setSelectedStudentIds([]); setSelectedItems([]); setMassBillItems([]); setCreateMode('single'); }} className="bg-emerald-600 hover:bg-emerald-700 h-9">
                                    <Plus className="w-4 h-4 mr-1.5" /> Create Invoice
                                  </Button>
                                )}
                                {hasActiveFilters && (
                                  <Button size="sm" variant="outline" onClick={clearAllFilters} className="h-9">
                                    Clear Filters
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : invoices.map((inv) => {
                          const sc = statusConfig[inv.status] || statusConfig.unpaid;
                          return (
                            <TableRow key={inv.invoice_id} className="hover:bg-slate-50/50 group">
                              <TableCell className="font-mono text-xs text-slate-500">{inv.invoice_code}</TableCell>
                              <TableCell>
                                <p className="font-medium text-sm text-slate-900">{inv.student?.name || 'Unknown'}</p>
                                <p className="text-xs text-slate-400">{inv.student?.student_code}</p>
                              </TableCell>
                              <TableCell className="hidden lg:table-cell">
                                <p className="text-sm text-slate-700 truncate max-w-[200px]">{inv.title || '\u2014'}</p>
                                <p className="text-xs text-slate-400 truncate max-w-[200px]">{inv.description}</p>
                              </TableCell>
                              <TableCell className="hidden xl:table-cell text-sm text-slate-600">{inv.class_name || '\u2014'}</TableCell>
                              <TableCell className="text-right text-sm font-mono text-slate-700">{fmt(inv.amount)}</TableCell>
                              <TableCell className="text-right text-sm font-mono text-emerald-600 font-medium">{fmt(inv.amount_paid)}</TableCell>
                              <TableCell className="text-right text-sm font-mono font-semibold text-red-600">{fmt(inv.due)}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className={`${sc.className} text-xs gap-1.5 px-2`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${sc.dotColor}`} />
                                  {sc.label}
                                </Badge>
                              </TableCell>
                              <TableCell className="hidden 2xl:table-cell text-xs text-slate-500">{fmtDate(inv.creation_timestamp)}</TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-1 opacity-100">
                                  {inv.due > 0 && (
                                    <Button variant="ghost" size="sm" className="h-8 px-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 text-xs" onClick={() => handleOpenTakePayment(inv.student_id)}>
                                      <CreditCard className="w-3.5 h-3.5 mr-1" /> Pay
                                    </Button>
                                  )}
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:bg-slate-100" onClick={() => handleViewInvoice(inv.invoice_id)} title="View Details">
                                    <Eye className="w-3.5 h-3.5" />
                                  </Button>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:bg-slate-100" onClick={() => handlePrintInvoice(inv)} title="Print">
                                    <Printer className="w-3.5 h-3.5" />
                                  </Button>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:bg-slate-100" onClick={() => handleEditInvoice(inv)} title="Edit">
                                    <Pencil className="w-3.5 h-3.5" />
                                  </Button>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50" onClick={() => { setDeleteId(inv.invoice_id); setDeleteOpen(true); }} title="Delete">
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Mobile Cards */}
                  <div className="md:hidden">
                    <ScrollArea className="max-h-[60vh]">
                      {loading ? (
                        <div className="divide-y">
                          {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="p-4 space-y-3">
                              <div className="flex items-center justify-between">
                                <Skeleton className="h-4 w-28" />
                                <Skeleton className="h-5 w-16 rounded-full" />
                              </div>
                              <Skeleton className="h-4 w-40" />
                              <div className="grid grid-cols-3 gap-2">
                                <Skeleton className="h-14 rounded-lg" />
                                <Skeleton className="h-14 rounded-lg" />
                                <Skeleton className="h-14 rounded-lg" />
                              </div>
                              <Skeleton className="h-9 w-full rounded-lg" />
                            </div>
                          ))}
                        </div>
                      ) : invoices.length === 0 ? (
                        <div className="py-20">
                          <div className="flex flex-col items-center text-slate-400">
                            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
                              <FileText className="w-7 h-7 text-slate-300" />
                            </div>
                            <p className="font-semibold text-slate-600 text-sm">No invoices found</p>
                            <p className="text-xs mt-1 mb-3">
                              {hasActiveFilters ? 'Try adjusting your search' : 'Create your first invoice'}
                            </p>
                            {!hasActiveFilters ? (
                              <Button size="sm" onClick={() => { setCreateOpen(true); setSelectedStudentIds([]); setSelectedItems([]); setMassBillItems([]); setCreateMode('single'); }} className="bg-emerald-600 hover:bg-emerald-700 h-9 text-xs">
                                <Plus className="w-3.5 h-3.5 mr-1" /> Create Invoice
                              </Button>
                            ) : (
                              <Button size="sm" variant="outline" onClick={clearAllFilters} className="h-9 text-xs">
                                Clear Filters
                              </Button>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="divide-y">
                          {invoices.map((inv) => {
                            const sc = statusConfig[inv.status] || statusConfig.unpaid;
                            return (
                              <div key={inv.invoice_id} className="p-4 space-y-3">
                                {/* Header */}
                                <div className="flex items-start justify-between gap-2">
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <p className="font-medium text-sm text-slate-900 truncate">{inv.student?.name || 'Unknown'}</p>
                                    </div>
                                    <p className="text-xs text-slate-400">{inv.invoice_code} &middot; {inv.class_name || 'No class'}</p>
                                    {inv.title && <p className="text-xs text-slate-500 truncate mt-0.5">{inv.title}</p>}
                                  </div>
                                  <Badge variant="outline" className={`${sc.className} text-xs gap-1.5 px-2 shrink-0`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${sc.dotColor}`} />
                                    {sc.label}
                                  </Badge>
                                </div>

                                {/* Amount Grid */}
                                <div className="grid grid-cols-3 text-center text-xs border rounded-xl overflow-hidden">
                                  <div className="py-2.5 bg-slate-50/50">
                                    <p className="text-slate-400 mb-0.5">Amount</p>
                                    <p className="font-mono font-semibold text-slate-700">{fmt(inv.amount)}</p>
                                  </div>
                                  <div className="py-2.5 border-x">
                                    <p className="text-slate-400 mb-0.5">Paid</p>
                                    <p className="font-mono font-semibold text-emerald-600">{fmt(inv.amount_paid)}</p>
                                  </div>
                                  <div className="py-2.5 bg-slate-50/50">
                                    <p className="text-slate-400 mb-0.5">Balance</p>
                                    <p className={`font-mono font-semibold ${inv.due > 0 ? 'text-red-600' : 'text-emerald-600'}`}>{fmt(inv.due)}</p>
                                  </div>
                                </div>

                                {/* Date row */}
                                <p className="text-xs text-slate-400">{fmtDate(inv.creation_timestamp)}</p>

                                {/* Action Buttons */}
                                <div className="flex gap-2">
                                  {inv.due > 0 && (
                                    <Button variant="outline" className="flex-1 h-11 text-xs text-emerald-700 border-emerald-200 hover:bg-emerald-50" onClick={() => handleOpenTakePayment(inv.student_id)}>
                                      <CreditCard className="w-3.5 h-3.5 mr-1.5" /> Pay
                                    </Button>
                                  )}
                                  <div className="flex gap-1.5">
                                    <Button variant="outline" className="h-11 w-11 px-0" onClick={() => handleViewInvoice(inv.invoice_id)}>
                                      <Eye className="w-4 h-4" />
                                    </Button>
                                    <Button variant="outline" className="h-11 w-11 px-0" onClick={() => handlePrintInvoice(inv)}>
                                      <Printer className="w-4 h-4" />
                                    </Button>
                                    <Button variant="outline" className="h-11 w-11 px-0" onClick={() => handleEditInvoice(inv)}>
                                      <Pencil className="w-4 h-4" />
                                    </Button>
                                    <Button variant="outline" className="h-11 w-11 px-0 text-red-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200" onClick={() => { setDeleteId(inv.invoice_id); setDeleteOpen(true); }}>
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </ScrollArea>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && !loading && invoices.length > 0 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t bg-slate-50/50">
                      <p className="text-xs text-slate-500 sm:block hidden">
                        Page {page} of {totalPages} &middot; {total} total invoices
                      </p>
                      <p className="text-xs text-slate-500 sm:hidden">
                        {page}/{totalPages}
                      </p>
                      <div className="flex items-center gap-1">
                        <Button variant="outline" size="icon" className="h-8 w-8" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                          <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <div className="hidden sm:flex items-center gap-1 mx-1">
                          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            let pageNum: number;
                            if (totalPages <= 5) {
                              pageNum = i + 1;
                            } else if (page <= 3) {
                              pageNum = i + 1;
                            } else if (page >= totalPages - 2) {
                              pageNum = totalPages - 4 + i;
                            } else {
                              pageNum = page - 2 + i;
                            }
                            return (
                              <Button
                                key={pageNum}
                                variant={pageNum === page ? 'default' : 'outline'}
                                size="icon"
                                className={`h-8 w-8 text-xs ${pageNum === page ? 'bg-emerald-600 hover:bg-emerald-700' : ''}`}
                                onClick={() => setPage(pageNum)}
                              >
                                {pageNum}
                              </Button>
                            );
                          })}
                        </div>
                        <Button variant="outline" size="icon" className="h-8 w-8" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </TabsContent>
              ))}
            </Tabs>
          </div>
        </Card>
      </div>

      {/* ===== DIALOGS ===== */}

      {/* Create Invoice Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                <Plus className="w-4 h-4 text-emerald-600" />
              </div>
              Create Invoice
            </DialogTitle>
            <DialogDescription>Create a new invoice for a student or an entire class.</DialogDescription>
          </DialogHeader>

          {/* Info banner */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-3">
            <Info className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-700">
              Duplicate invoices for the same student, term, and year are automatically prevented.
            </p>
          </div>

          {/* Mode Toggle */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-lg">
            <Button
              variant={createMode === 'single' ? 'default' : 'ghost'}
              onClick={() => setCreateMode('single')}
              className={createMode === 'single' ? 'bg-white shadow-sm hover:bg-white text-emerald-700 h-9 text-sm font-medium' : 'h-9 text-sm text-slate-500 hover:text-slate-700'}
            >
              <Users className="w-4 h-4 mr-1.5" /> Single Student
            </Button>
            <Button
              variant={createMode === 'mass' ? 'default' : 'ghost'}
              onClick={() => setCreateMode('mass')}
              className={createMode === 'mass' ? 'bg-white shadow-sm hover:bg-white text-emerald-700 h-9 text-sm font-medium' : 'h-9 text-sm text-slate-500 hover:text-slate-700'}
            >
              <ShoppingCart className="w-4 h-4 mr-1.5" /> Bulk by Class
            </Button>
          </div>

          <div className="space-y-4">
            {/* Date / Term / Year / Class or Student search */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-medium text-slate-500">Date</Label>
                <Input type="date" value={createDate} onChange={(e) => setCreateDate(e.target.value)} className="mt-1 h-10" />
              </div>
              <div>
                <Label className="text-xs font-medium text-slate-500">Term</Label>
                <Select value={createTerm} onValueChange={setCreateTerm}>
                  <SelectTrigger className="mt-1 h-10"><SelectValue placeholder="Select term" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Term 1">Term 1</SelectItem>
                    <SelectItem value="Term 2">Term 2</SelectItem>
                    <SelectItem value="Term 3">Term 3</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-medium text-slate-500">Year</Label>
                <Select value={createYear} onValueChange={setCreateYear}>
                  <SelectTrigger className="mt-1 h-10"><SelectValue placeholder="Select year" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2025/2026">2025/2026</SelectItem>
                    <SelectItem value="2024/2025">2024/2025</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {createMode === 'single' ? (
                <div>
                  <Label className="text-xs font-medium text-slate-500">Class (optional)</Label>
                  <Select value={createClassId} onValueChange={(v) => v === '__none__' ? setCreateClassId('') : setCreateClassId(v)}>
                    <SelectTrigger className="mt-1 h-10"><SelectValue placeholder="Optional" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">No class</SelectItem>
                      {classes.map((c) => <SelectItem key={c.class_id} value={String(c.class_id)}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div>
                  <Label className="text-xs font-medium text-slate-500">Class (bulk)</Label>
                  <Select value={massBillClassId} onValueChange={setMassBillClassId}>
                    <SelectTrigger className="mt-1 h-10"><SelectValue placeholder="Select class" /></SelectTrigger>
                    <SelectContent>
                      {classes.map((c) => <SelectItem key={c.class_id} value={String(c.class_id)}>{c.name} ({c._count?.enrolls || 0} students)</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* Student Search (single mode) */}
            {createMode === 'single' && (
              <div>
                <Label className="text-xs font-medium text-slate-500">Search Student</Label>
                <Input
                  placeholder="Name or student code..."
                  value={studentSearch}
                  onChange={(e) => handleSearchStudents(e.target.value)}
                  className="mt-1 h-10"
                />
              </div>
            )}

            {/* Student selection (single mode) */}
            {createMode === 'single' && createStudents.length > 0 && (
              <div className="max-h-40 overflow-y-auto border rounded-lg">
                <ScrollArea className="max-h-[160px]">
                  {createStudents.map((s: { student_id: number; name: string; student_code: string }) => (
                    <label key={s.student_id} className="flex items-center gap-2 px-3 py-2.5 hover:bg-slate-50 cursor-pointer text-sm border-b last:border-0">
                      <Checkbox
                        checked={selectedStudentIds.includes(s.student_id)}
                        onCheckedChange={() => toggleSelection(s.student_id, selectedStudentIds, setSelectedStudentIds)}
                      />
                      <span className="flex-1">{s.name}</span>
                      <span className="text-xs text-slate-400 font-mono">{s.student_code}</span>
                    </label>
                  ))}
                </ScrollArea>
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
                <div className="text-center py-6 border rounded-lg bg-slate-50">
                  <Tag className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  <p className="text-sm text-slate-500">No billing items configured.</p>
                  <p className="text-xs text-slate-400 mt-0.5">Add items via the Bill Items button first.</p>
                </div>
              ) : (
                <div className="max-h-48 overflow-y-auto border rounded-lg divide-y">
                  <ScrollArea className="max-h-[192px]">
                    {billItems.map((item) => {
                      const isSelected = createMode === 'mass'
                        ? massBillItems.includes(item.id)
                        : selectedItems.includes(item.id);
                      return (
                        <label key={item.id} className="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 cursor-pointer text-sm border-b last:border-0">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => {
                              if (createMode === 'mass') toggleSelection(item.id, massBillItems, setMassBillItems);
                              else toggleSelection(item.id, selectedItems, setSelectedItems);
                            }}
                          />
                          <span className="flex-1">{item.title}</span>
                          {item.bill_category && <Badge variant="secondary" className="text-xs">{item.bill_category.bill_category_name}</Badge>}
                          <span className="font-mono text-sm text-slate-600">{fmt(item.amount)}</span>
                        </label>
                      );
                    })}
                  </ScrollArea>
                </div>
              )}
            </div>

            {/* Total */}
            {(createMode === 'mass' ? massBillItems.length > 0 : selectedItems.length > 0) && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 flex items-center justify-between">
                <span className="text-sm font-medium text-slate-700">Total per student:</span>
                <span className="text-lg font-bold text-emerald-700">{fmt(createMode === 'mass' ? getSelectedTotal(massBillItems) : getSelectedTotal(selectedItems))}</span>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setSelectedStudentIds([]); setSelectedItems([]); setMassBillItems([]); setStudentSearch(''); }}>
              Reset
            </Button>
            <Button
              onClick={handleCreateInvoice}
              disabled={creating || (createMode === 'mass' ? !massBillClassId : selectedStudentIds.length === 0)}
              className="bg-emerald-600 hover:bg-emerald-700 min-h-[44px]"
            >
              {creating ? (
                <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" /> Creating...</>
              ) : createMode === 'mass' ? (
                `Bill ${massBillClassId ? classes.find(c => c.class_id === parseInt(massBillClassId))?.name || 'Class' : 'Class'}`
              ) : (
                `Create for ${selectedStudentIds.length} Student(s)`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bill Items Dialog */}
      <Dialog open={billItemsOpen} onOpenChange={setBillItemsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-sky-100 flex items-center justify-center">
                <Tag className="w-4 h-4 text-sky-600" />
              </div>
              Bill Items
            </DialogTitle>
            <DialogDescription>Manage billing items and categories used when creating invoices.</DialogDescription>
          </DialogHeader>

          {/* Add Bill Item Form */}
          <div className="bg-slate-50 border rounded-xl p-4 space-y-3">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Add New Item</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <div className="lg:col-span-1">
                <Label className="text-xs">Title</Label>
                <Input placeholder="Item title" value={newItemTitle} onChange={(e) => setNewItemTitle(e.target.value)} className="mt-1 h-10" />
              </div>
              <div>
                <Label className="text-xs">Category</Label>
                <Select value={newItemCategory === '' ? '__none__' : newItemCategory} onValueChange={(v) => setNewItemCategory(v === '__none__' ? '' : v)}>
                  <SelectTrigger className="mt-1 h-10"><SelectValue placeholder="Category" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">No category</SelectItem>
                    {billCategories.map((c) => <SelectItem key={c.bill_category_id} value={String(c.bill_category_id)}>{c.bill_category_name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Amount (GHS)</Label>
                <Input type="number" placeholder="0.00" value={newItemAmount} onChange={(e) => setNewItemAmount(e.target.value)} className="mt-1 h-10" />
              </div>
              <div>
                <Label className="text-xs">Description</Label>
                <Input placeholder="Optional" value={newItemDesc} onChange={(e) => setNewItemDesc(e.target.value)} className="mt-1 h-10" />
              </div>
              <div className="flex items-end">
                <Button onClick={handleAddBillItem} disabled={addingItem} className="w-full bg-emerald-600 hover:bg-emerald-700 h-10">
                  {addingItem ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-1.5" />Adding</> : <><Plus className="w-4 h-4 mr-1.5" /> Add</>}
                </Button>
              </div>
            </div>
          </div>

          {/* Bill Items List */}
          <div className="border rounded-xl overflow-hidden">
            <ScrollArea className="max-h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="w-10 text-xs text-slate-500">#</TableHead>
                    <TableHead className="text-xs text-slate-500">Title</TableHead>
                    <TableHead className="text-xs text-slate-500 hidden sm:table-cell">Category</TableHead>
                    <TableHead className="text-xs text-slate-500">Amount</TableHead>
                    <TableHead className="text-xs text-slate-500 hidden sm:table-cell">Description</TableHead>
                    <TableHead className="text-xs text-slate-500 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {billItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-32 text-center text-slate-400">
                        <div className="flex flex-col items-center">
                          <Tag className="w-8 h-8 mb-2 text-slate-300" />
                          <p className="text-sm">No bill items yet</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : billItems.map((item, idx) => (
                    editItem?.id === item.id ? (
                      <TableRow key={item.id} className="bg-amber-50">
                        <TableCell className="text-xs text-slate-500">{idx + 1}</TableCell>
                        <TableCell><Input value={editItemTitle} onChange={(e) => setEditItemTitle(e.target.value)} className="h-8 text-sm" /></TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <Select value={editItemCategory === '' ? '__none__' : editItemCategory} onValueChange={(v) => setEditItemCategory(v === '__none__' ? '' : v)}>
                            <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="__none__">None</SelectItem>
                              {billCategories.map((c) => <SelectItem key={c.bill_category_id} value={String(c.bill_category_id)}>{c.bill_category_name}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell><Input type="number" value={editItemAmount} onChange={(e) => setEditItemAmount(e.target.value)} className="h-8 text-sm w-28" /></TableCell>
                        <TableCell className="hidden sm:table-cell"><Input value={editItemDesc} onChange={(e) => setEditItemDesc(e.target.value)} className="h-8 text-sm" /></TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button size="sm" className="h-7 bg-emerald-600 hover:bg-emerald-700 text-xs" onClick={handleSaveEditItem} disabled={savingItem}>
                              <CheckCircle2 className="w-3 h-3 mr-1" />{savingItem ? '...' : 'Save'}
                            </Button>
                            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setEditItem(null)}>
                              <XCircle className="w-3 h-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      <TableRow key={item.id} className="hover:bg-slate-50">
                        <TableCell className="text-xs text-slate-500">{idx + 1}</TableCell>
                        <TableCell className="font-medium text-sm">{item.title}</TableCell>
                        <TableCell className="hidden sm:table-cell"><Badge variant="secondary" className="text-xs">{item.bill_category?.bill_category_name || '\u2014'}</Badge></TableCell>
                        <TableCell className="font-mono text-sm">{fmt(item.amount)}</TableCell>
                        <TableCell className="hidden sm:table-cell text-sm text-slate-500">{item.description || '\u2014'}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="sm" className="h-8 text-xs text-emerald-600" onClick={() => handleStartEditItem(item)}>
                              <Edit3 className="w-3 h-3 mr-1" /> Edit
                            </Button>
                            <Button variant="ghost" size="sm" className="h-8 text-xs text-red-500" onClick={() => handleDeleteBillItem(item.id)}>
                              <Trash2 className="w-3 h-3 mr-1" /> Delete
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setBillItemsOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Invoice Dialog */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                <Receipt className="w-4 h-4 text-emerald-600" />
              </div>
              Invoice Details
            </DialogTitle>
            <DialogDescription>Detailed breakdown of the selected invoice.</DialogDescription>
          </DialogHeader>
          {viewLoading ? (
            <div className="space-y-4 py-2">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-4 w-full" />)}
              <Skeleton className="h-32 w-full rounded-lg" />
            </div>
          ) : viewInvoice ? (
            <div className="space-y-4">
              {/* CI3-style Invoice Header: Payment To / Bill To */}
              <div className="border rounded-xl p-4 bg-slate-50">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Payment To</p>
                    <p className="font-bold text-slate-900 text-sm">School Manager</p>
                    <p className="text-xs text-slate-500">School Fee Invoice</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Bill To</p>
                    <p className="font-bold text-slate-900 text-sm">{viewInvoice.student?.name || 'Unknown'}</p>
                    <p className="text-xs text-slate-500 font-mono">{viewInvoice.student?.student_code}</p>
                    <p className="text-xs text-slate-500">{viewInvoice.class_name || '\u2014'} {viewInvoice.class?.name_numeric || ''}</p>
                  </div>
                </div>
                <Separator className="my-3" />
                <div className="grid grid-cols-4 gap-2 text-xs">
                  <div>
                    <p className="text-slate-400">Invoice #</p>
                    <p className="font-mono font-semibold text-slate-700">{viewInvoice.invoice_code}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Date</p>
                    <p className="font-semibold text-slate-700">{fmtDate(viewInvoice.creation_timestamp)}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Status</p>
                    <Badge variant="outline" className={`${statusConfig[viewInvoice.status]?.className} text-xs gap-1 mt-0.5`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${statusConfig[viewInvoice.status]?.dotColor}`} />
                      {statusConfig[viewInvoice.status]?.label}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-slate-400">Year | Term</p>
                    <p className="font-semibold text-slate-700">{viewInvoice.year?.split('-')[1]} | {viewInvoice.term}</p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Line Items Table */}
              <div>
                <p className="text-sm font-medium text-slate-700 mb-2">Invoice Breakdown</p>
                <div className="border rounded-xl overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50">
                        <TableHead className="text-xs text-slate-500">Item</TableHead>
                        <TableHead className="text-xs text-slate-500 text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="text-sm">{viewInvoice.description || viewInvoice.title}</TableCell>
                        <TableCell className="text-right font-mono">{fmt(viewInvoice.amount)}</TableCell>
                      </TableRow>
                      {viewInvoice.discount > 0 && (
                        <TableRow>
                          <TableCell className="text-sm text-emerald-600">Discount</TableCell>
                          <TableCell className="text-right font-mono text-emerald-600">-{fmt(viewInvoice.discount)}</TableCell>
                        </TableRow>
                      )}
                      <TableRow className="bg-slate-50 font-semibold">
                        <TableCell>Net Total</TableCell>
                        <TableCell className="text-right font-mono">{fmt(viewInvoice.amount - viewInvoice.discount)}</TableCell>
                      </TableRow>
                      <TableRow className="font-semibold">
                        <TableCell>Total Paid</TableCell>
                        <TableCell className="text-right font-mono text-emerald-600">{fmt(viewInvoice.amount_paid)}</TableCell>
                      </TableRow>
                      <TableRow className={viewInvoice.due > 0 ? 'bg-red-50 font-bold' : 'bg-emerald-50 font-bold'}>
                        <TableCell>{viewInvoice.due > 0 ? 'Balance Due' : 'Fully Paid'}</TableCell>
                        <TableCell className={`text-right font-mono ${viewInvoice.due > 0 ? 'text-red-600' : 'text-emerald-600'}`}>{fmt(viewInvoice.due)}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Payment History */}
              {viewInvoice.payments && viewInvoice.payments.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-slate-700 mb-2">Payment History</p>
                  <div className="max-h-48 overflow-y-auto border rounded-xl divide-y">
                    <ScrollArea className="max-h-[192px]">
                      {viewInvoice.payments.map((p: { payment_id: number; receipt_code: string; timestamp: string; amount: number; payment_method?: string }) => (
                        <div key={p.payment_id} className="flex items-center justify-between px-3 py-2.5 text-sm">
                          <div>
                            <p className="font-mono text-xs text-slate-600">{p.receipt_code}</p>
                            <p className="text-xs text-slate-400">{fmtDate(p.timestamp)}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-mono text-emerald-600 font-medium">{fmt(p.amount)}</p>
                            <p className="text-xs capitalize text-slate-500">{p.payment_method?.replace('_', ' ')}</p>
                          </div>
                        </div>
                      ))}
                    </ScrollArea>
                  </div>
                </div>
              )}
            </div>
          ) : null}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setViewOpen(false)}>Close</Button>
            {viewInvoice && !viewLoading && (
              <Button variant="outline" className="border-slate-200" onClick={() => handlePrintInvoice(viewInvoice)}>
                <Printer className="w-4 h-4 mr-1.5" /> Print
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Invoice Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                <Pencil className="w-4 h-4 text-amber-600" />
              </div>
              Edit Invoice
            </DialogTitle>
            <DialogDescription>Update invoice details. Changes are saved immediately.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Student name (readonly, CI3 parity) */}
            <div className="border rounded-lg p-3 bg-slate-50">
              <p className="text-xs text-slate-400 mb-0.5">Student</p>
              <p className="font-semibold text-slate-900">{editInvoice?.student?.name || 'Unknown'}</p>
              <p className="text-xs text-slate-400 font-mono">{editInvoice?.invoice_code}</p>
            </div>

            {/* Title + Description */}
            <div>
              <Label className="text-xs font-medium text-slate-500">Title</Label>
              <Input value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} className="mt-1 h-10" />
            </div>
            <div>
              <Label className="text-xs font-medium text-slate-500">Description</Label>
              <Textarea value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} className="mt-1 min-h-[60px]" />
            </div>

            {/* Amount + Discount + Status */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-medium text-slate-500">Amount (GHS)</Label>
                <Input type="number" value={editForm.amount} onChange={(e) => setEditForm({ ...editForm, amount: parseFloat(e.target.value) || 0 })} className="mt-1 h-10" />
              </div>
              <div>
                <Label className="text-xs font-medium text-slate-500">Discount (GHS)</Label>
                <Input type="number" value={editForm.discount} onChange={(e) => setEditForm({ ...editForm, discount: parseFloat(e.target.value) || 0 })} className="mt-1 h-10" />
              </div>
            </div>

            {/* Amount Paid (readonly) + Status (auto-calculated, CI3 parity) */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-medium text-slate-500">Amount Paid</Label>
                <div className="mt-1 h-10 rounded-md border bg-slate-50 px-3 flex items-center text-sm font-mono text-emerald-600 font-medium">
                  {fmt(editInvoice?.amount_paid || 0)}
                </div>
              </div>
              <div>
                <Label className="text-xs font-medium text-slate-500">Status</Label>
                <div className={`mt-1 h-10 rounded-md border px-3 flex items-center text-sm font-semibold ${
                  editInvoice?.status === 'paid' ? 'bg-emerald-100 border-emerald-300 text-emerald-700' :
                  editInvoice?.status === 'partial' ? 'bg-amber-100 border-amber-300 text-amber-700' :
                  'bg-red-100 border-red-300 text-red-700'
                }`}>
                  {editInvoice?.status ? editInvoice.status.charAt(0).toUpperCase() + editInvoice.status.slice(1) : 'Unknown'}
                </div>
              </div>
            </div>

            {/* Due amount summary */}
            <div className={`rounded-lg p-3 text-sm flex items-center justify-between ${
              (editForm.amount - editForm.discount - (editInvoice?.amount_paid || 0)) > 0
                ? 'bg-red-50 border border-red-200 text-red-700'
                : 'bg-emerald-50 border border-emerald-200 text-emerald-700'
            }`}>
              <span className="font-medium">Balance Due:</span>
              <span className="font-bold font-mono">{fmt(Math.max(0, editForm.amount - editForm.discount - (editInvoice?.amount_paid || 0)))}</span>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveEdit} disabled={editing} className="bg-emerald-600 hover:bg-emerald-700 min-h-[44px]">
              {editing ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />Saving...</> : 'Update Invoice'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Invoice AlertDialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                <Trash2 className="w-4 h-4 text-red-600" />
              </div>
              Delete Invoice
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this invoice and all associated payments. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteInvoice} disabled={deleting} className="bg-red-600 hover:bg-red-700">
              {deleting ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />Deleting...</> : 'Delete Invoice'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Take Payment Dialog */}
      <Dialog open={payOpen} onOpenChange={(open) => { setPayOpen(open); if (!open) { setPayAmount(''); setPayReceiptCode(''); setPayStudentId(null); setPayStudentDetail(null); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                <BanknoteIcon className="w-4 h-4 text-emerald-600" />
              </div>
              Take Payment
            </DialogTitle>
            <DialogDescription>Record a payment for a student with outstanding invoices.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Student Selection */}
            <div>
              <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Select Student</Label>
              <Select value={payStudentId ? String(payStudentId) : ''} onValueChange={handlePayStudentChange}>
                <SelectTrigger className="mt-1 h-10"><SelectValue placeholder="Search students who owe..." /></SelectTrigger>
                <SelectContent>
                  {payStudentsOwing.map((s: { student_id: number; name: string; class_name: string; total_due: number }) => (
                    <SelectItem key={s.student_id} value={String(s.student_id)}>
                      {s.name} \u2014 {s.class_name} (Owes: GHS {fmtShort(s.total_due)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Student Detail */}
            {payStudentDetail && (
              <div className="border rounded-xl p-3 bg-slate-50 space-y-0">
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <span className="text-slate-400 text-xs">Name</span>
                  <span className="font-medium text-right">{(payStudentDetail as { name: string }).name}</span>
                  <span className="text-slate-400 text-xs">Class</span>
                  <span className="font-medium text-right">{(payStudentDetail as { class_name: string; name_numeric?: string }).class_name} {(payStudentDetail as { name_numeric?: string }).name_numeric || ''}</span>
                  <span className="text-slate-400 text-xs">Total Payable</span>
                  <span className="font-bold text-right text-red-600">{fmt((payStudentDetail as { total_due: number }).total_due)}</span>
                </div>
              </div>
            )}

            <Separator />

            {/* Payment Details */}
            <div className="space-y-3">
              <div>
                <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Payment Method</Label>
                <Select value={payMethod} onValueChange={setPayMethod}>
                  <SelectTrigger className="mt-1 h-10"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="mobile_money">Mobile Money</SelectItem>
                    <SelectItem value="cheque">Cheque</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Amount (GHS)</Label>
                <Input type="number" placeholder="Enter amount" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} className="mt-1 h-11 text-lg font-mono font-semibold" />
              </div>
              <div>
                <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Receipt No. (optional)</Label>
                <Input placeholder="Auto-generated if blank" value={payReceiptCode} onChange={(e) => setPayReceiptCode(e.target.value)} className="mt-1 h-10 tracking-wider font-mono" />
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setPayOpen(false); setPayAmount(''); setPayReceiptCode(''); }}>
              Cancel
            </Button>
            <Button onClick={handleTakePayment} disabled={paying || !payStudentId || !payAmount} className="bg-emerald-600 hover:bg-emerald-700 min-h-[44px] min-w-[140px]">
              {paying ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />Processing...</> : <><CreditCard className="w-4 h-4 mr-1.5" /> Take Payment</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
