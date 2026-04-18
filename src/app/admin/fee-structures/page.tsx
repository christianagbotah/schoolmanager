'use client';

import { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  FileText, Search, Plus, Eye, Pencil, Trash2, Users, DollarSign,
  ToggleLeft, ToggleRight, Info, X, Calendar, CheckCircle, Package,
  ChevronDown, ChevronUp, GraduationCap, LayoutGrid,
} from 'lucide-react';

// ======== TYPES ========
interface FeeStructure {
  fee_structure_id: number;
  name: string;
  class_id: number | null;
  year: string;
  term: string;
  total_amount: number;
  description: string;
  is_active: number;
  status: string;
  installment_count: number;
  class: { class_id: number; name: string; name_numeric: number; category: string } | null;
  _count: { payment_plans: number };
}

interface SchoolClass {
  class_id: number;
  name: string;
  name_numeric: number;
  category: string;
}

interface BillItem {
  id: number;
  title: string;
  description: string;
  amount: number;
  bill_category_id: number | null;
  bill_category: { bill_category_id: number; bill_category_name: string } | null;
}

interface FeeStructureDetail extends FeeStructure {
  dueDates: string[];
  billItems: BillItem[];
  enrollCount: number;
  paymentPlanCount: number;
}

// ======== HELPERS ========
function fmt(amount: number) {
  return new Intl.NumberFormat('en-UG', { style: 'currency', currency: 'GHS', minimumFractionDigits: 2 }).format(amount);
}

function fmtDate(d: string) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

const statusBadge: Record<string, { className: string; label: string }> = {
  active: { className: 'bg-emerald-100 text-emerald-700 border-emerald-200', label: 'Active' },
  archived: { className: 'bg-slate-100 text-slate-500 border-slate-200', label: 'Archived' },
  draft: { className: 'bg-amber-100 text-amber-700 border-amber-200', label: 'Draft' },
};

// ======== MAIN COMPONENT ========
export default function FeeStructuresPage() {
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [termFilter, setTermFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [summary, setSummary] = useState({ total: 0, active: 0, totalCollectible: 0 });
  const [activeTab, setActiveTab] = useState('structures');

  // Create/Edit dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editItem, setEditItem] = useState<FeeStructure | null>(null);
  const [form, setForm] = useState({
    name: '', classId: '', year: '', term: '', totalAmount: '', description: '',
    installmentCount: '1', dueDates: [] as string[],
  });
  const [saving, setSaving] = useState(false);

  // View dialog
  const [viewOpen, setViewOpen] = useState(false);
  const [viewItem, setViewItem] = useState<FeeStructureDetail | null>(null);
  const [viewLoading, setViewLoading] = useState(false);

  // Assign dialog
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignStructure, setAssignStructure] = useState<FeeStructure | null>(null);
  const [studentSearch, setStudentSearch] = useState('');
  const [studentResults, setStudentResults] = useState<any[]>([]);
  const [assignedStudents, setAssignedStudents] = useState<any[]>([]);
  const [assigning, setAssigning] = useState(false);

  // Bill items
  const [billItems, setBillItems] = useState<BillItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [expandedStructure, setExpandedStructure] = useState<number | null>(null);

  // ===== FETCH =====
  const fetchFeeStructures = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (classFilter) params.set('classId', classFilter);
      if (yearFilter) params.set('year', yearFilter);
      if (termFilter) params.set('term', termFilter);
      if (statusFilter) params.set('status', statusFilter);
      const res = await fetch(`/api/admin/fee-structures?${params}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setFeeStructures(data.feeStructures || []);
      setSummary(data.summary || { total: 0, active: 0, totalCollectible: 0 });
    } catch {
      toast.error('Failed to load fee structures');
    } finally {
      setLoading(false);
    }
  }, [search, classFilter, yearFilter, termFilter, statusFilter]);

  const fetchClasses = useCallback(async () => {
    try {
      const res = await fetch('/api/classes');
      const data = await res.json();
      setClasses(data || []);
    } catch { /* silent */ }
  }, []);

  const fetchBillItems = useCallback(async () => {
    try {
      const res = await fetch('/api/bill-items');
      const data = await res.json();
      setBillItems(data || []);
    } catch { /* silent */ }
  }, []);

  useEffect(() => { fetchFeeStructures(); }, [fetchFeeStructures]);
  useEffect(() => { fetchClasses(); fetchBillItems(); }, [fetchClasses, fetchBillItems]);
  useEffect(() => {
    const timer = setTimeout(() => { fetchFeeStructures(); }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  // ===== HANDLERS =====
  const resetForm = () => setForm({
    name: '', classId: '', year: '', term: '', totalAmount: '', description: '',
    installmentCount: '1', dueDates: [],
  });

  const handleCreate = () => {
    resetForm();
    setSelectedItems([]);
    setCreateOpen(true);
  };

  const handleEdit = (item: FeeStructure) => {
    setEditItem(item);
    setForm({
      name: item.name,
      classId: item.class_id ? String(item.class_id) : '',
      year: item.year,
      term: item.term,
      totalAmount: String(item.total_amount),
      description: item.description,
      installmentCount: String(item.installment_count),
      dueDates: [],
    });
    setEditOpen(true);
  };

  const handleSaveCreate = async () => {
    if (!form.name || !form.totalAmount) {
      toast.error('Name and total amount are required');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/admin/fee-structures', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          classId: form.classId,
          year: form.year,
          term: form.term,
          totalAmount: form.totalAmount,
          description: form.description,
          installmentCount: form.installmentCount,
          dueDates: form.dueDates.length > 0 ? form.dueDates : undefined,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast.success(data.message);
      setCreateOpen(false);
      resetForm();
      fetchFeeStructures();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editItem) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/fee-structures/${editItem.fee_structure_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          classId: form.classId,
          year: form.year,
          term: form.term,
          totalAmount: form.totalAmount,
          description: form.description,
          installmentCount: form.installmentCount,
          dueDatesJson: form.dueDates.length > 0 ? JSON.stringify(form.dueDates) : '[]',
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast.success(data.message);
      setEditOpen(false);
      fetchFeeStructures();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (item: FeeStructure) => {
    try {
      const res = await fetch(`/api/admin/fee-structures/${item.fee_structure_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: item.is_active === 1 ? false : true }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast.success(item.is_active === 1 ? 'Fee structure deactivated' : 'Fee structure activated');
      fetchFeeStructures();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`/api/admin/fee-structures/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast.success(data.message);
      fetchFeeStructures();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleView = async (id: number) => {
    setViewOpen(true);
    setViewLoading(true);
    try {
      const res = await fetch(`/api/admin/fee-structures/${id}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setViewItem(data);
    } catch (err: any) {
      toast.error(err.message);
      setViewOpen(false);
    } finally {
      setViewLoading(false);
    }
  };

  const toggleBillItem = (id: number) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const autoCalculateTotal = () => {
    const total = billItems
      .filter((i) => selectedItems.includes(i.id))
      .reduce((s, i) => s + i.amount, 0);
    setForm((prev) => ({ ...prev, totalAmount: String(total) }));
  };

  useEffect(() => { autoCalculateTotal(); }, [selectedItems]);

  // Due date management
  const handleInstallmentCountChange = (count: string) => {
    const n = parseInt(count) || 1;
    setForm((prev) => {
      const newDates = [...prev.dueDates];
      while (newDates.length < n) {
        const lastDate = newDates.length > 0 ? new Date(newDates[newDates.length - 1]) : new Date();
        lastDate.setMonth(lastDate.getMonth() + 1);
        newDates.push(lastDate.toISOString().split('T')[0]);
      }
      while (newDates.length > n) newDates.pop();
      return { ...prev, installmentCount: count, dueDates: newDates };
    });
  };

  const handleDueDateChange = (index: number, value: string) => {
    setForm((prev) => {
      const newDates = [...prev.dueDates];
      newDates[index] = value;
      return { ...prev, dueDates: newDates };
    });
  };

  // Assign to students
  const handleOpenAssign = (item: FeeStructure) => {
    setAssignStructure(item);
    setStudentSearch('');
    setStudentResults([]);
    setAssignedStudents([]);
    setAssignOpen(true);
  };

  const handleStudentSearch = async (query: string) => {
    setStudentSearch(query);
    if (query.length < 2) {
      setStudentResults([]);
      return;
    }
    try {
      const res = await fetch(`/api/students?search=${encodeURIComponent(query)}&limit=20`);
      const data = await res.json();
      setStudentResults(data.students || []);
    } catch {
      // silent
    }
  };

  const handleAddStudent = (student: any) => {
    if (!assignedStudents.find((s) => s.student_id === student.student_id)) {
      setAssignedStudents((prev) => [...prev, student]);
    }
    setStudentSearch('');
    setStudentResults([]);
  };

  const handleRemoveStudent = (studentId: number) => {
    setAssignedStudents((prev) => prev.filter((s) => s.student_id !== studentId));
  };

  const handleAssignPlans = async () => {
    if (!assignStructure || assignedStudents.length === 0) return;
    setAssigning(true);
    try {
      for (const student of assignedStudents) {
        const installmentCount = assignStructure.installment_count || 1;
        const amountPerInstallment = assignStructure.total_amount / installmentCount;
        const baseDate = new Date();

        const plan = await fetch('/api/admin/payment-plans', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: `${assignStructure.name} - ${student.name}`,
            description: `Payment plan for ${student.name}`,
            numberOfPayments: installmentCount,
            frequency: 'monthly',
            totalAmount: assignStructure.total_amount,
            startDate: baseDate.toISOString().split('T')[0],
            studentId: student.student_id,
            feeStructureId: assignStructure.fee_structure_id,
          }),
        });

        if (plan.ok) {
          const planData = await plan.json();
          toast.success(`Plan created for ${student.name}`);
        }
      }
      setAssignOpen(false);
      fetchFeeStructures();
    } catch (err: any) {
      toast.error('Failed to assign plans');
    } finally {
      setAssigning(false);
    }
  };

  // ===== RENDER =====
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-6 h-6 text-emerald-600" /> Fee Structures
            </h1>
            <p className="text-sm text-slate-500 mt-1">Define and manage fee structures for classes and terms</p>
          </div>
          <Button onClick={handleCreate} className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="w-4 h-4 mr-2" /> Create Fee Structure
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border-l-4 border-l-emerald-500">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <ToggleRight className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">Active Structures</p>
                  <p className="text-lg font-bold text-slate-900">{summary.active}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-amber-500">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">Total Structures</p>
                  <p className="text-lg font-bold text-slate-900">{summary.total}</p>
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
                  <p className="text-xs text-slate-500 font-medium">Total Collectible</p>
                  <p className="text-lg font-bold text-emerald-700">{fmt(summary.totalCollectible)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="structures" className="flex items-center gap-1.5">
              <LayoutGrid className="w-4 h-4" /> Fee Structures
            </TabsTrigger>
            <TabsTrigger value="builder" className="flex items-center gap-1.5">
              <Package className="w-4 h-4" /> Bill Items Builder
            </TabsTrigger>
          </TabsList>

          {/* TAB: Structures List */}
          <TabsContent value="structures" className="space-y-4">
            {/* Filters */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col lg:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input placeholder="Search fee structures..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <Select value={classFilter} onValueChange={(v) => v === '__all__' ? setClassFilter('') : setClassFilter(v)}>
                      <SelectTrigger><SelectValue placeholder="All Classes" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__all__">All Classes</SelectItem>
                        {classes.map((c) => <SelectItem key={c.class_id} value={String(c.class_id)}>{c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Select value={yearFilter} onValueChange={(v) => v === '__all__' ? setYearFilter('') : setYearFilter(v)}>
                      <SelectTrigger><SelectValue placeholder="Year" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__all__">All Years</SelectItem>
                        <SelectItem value="2025/2026">2025/2026</SelectItem>
                        <SelectItem value="2024/2025">2024/2025</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={termFilter} onValueChange={(v) => v === '__all__' ? setTermFilter('') : setTermFilter(v)}>
                      <SelectTrigger><SelectValue placeholder="Term" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__all__">All Terms</SelectItem>
                        <SelectItem value="Term 1">Term 1</SelectItem>
                        <SelectItem value="Term 2">Term 2</SelectItem>
                        <SelectItem value="Term 3">Term 3</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={statusFilter} onValueChange={(v) => v === '__all__' ? setStatusFilter('') : setStatusFilter(v)}>
                      <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__all__">All Status</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="archived">Archived</SelectItem>
                        <SelectItem value="draft">Draft</SelectItem>
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
                <div className="hidden md:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50">
                        <TableHead className="text-xs font-semibold">Name</TableHead>
                        <TableHead className="text-xs font-semibold">Class</TableHead>
                        <TableHead className="text-xs font-semibold">Year / Term</TableHead>
                        <TableHead className="text-xs font-semibold text-right">Total</TableHead>
                        <TableHead className="text-xs font-semibold">Installments</TableHead>
                        <TableHead className="text-xs font-semibold">Plans</TableHead>
                        <TableHead className="text-xs font-semibold">Status</TableHead>
                        <TableHead className="text-xs font-semibold text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}>{Array.from({ length: 8 }).map((_, j) => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}</TableRow>
                      )) : feeStructures.length === 0 ? (
                        <TableRow><TableCell colSpan={8} className="text-center py-12 text-slate-400">
                          <FileText className="w-10 h-10 mx-auto mb-2 opacity-50" /><p>No fee structures found</p>
                        </TableCell></TableRow>
                      ) : feeStructures.map((item) => (
                        <>
                          <TableRow key={item.fee_structure_id} className="hover:bg-slate-50/50">
                            <TableCell>
                              <div>
                                <p className="font-medium text-sm">{item.name}</p>
                                {item.description && <p className="text-xs text-slate-400 max-w-[200px] truncate">{item.description}</p>}
                              </div>
                            </TableCell>
                            <TableCell><Badge variant="outline">{item.class?.name || 'All Classes'}</Badge></TableCell>
                            <TableCell className="text-sm">
                              <span>{item.year || '—'}</span>
                              {item.term && <span className="text-slate-400 ml-1">/ {item.term}</span>}
                            </TableCell>
                            <TableCell className="text-right text-sm font-mono font-medium">{fmt(item.total_amount)}</TableCell>
                            <TableCell className="text-sm">{item.installment_count}</TableCell>
                            <TableCell className="text-sm">{item._count.payment_plans}</TableCell>
                            <TableCell>
                              <Badge className={statusBadge[item.status]?.className || statusBadge.active.className}>
                                {statusBadge[item.status]?.label || item.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-0.5">
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleView(item.fee_structure_id)} title="View"><Eye className="w-3.5 h-3.5" /></Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(item)} title="Edit"><Pencil className="w-3.5 h-3.5" /></Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenAssign(item)} title="Assign"><Users className="w-3.5 h-3.5" /></Button>
                                <Button variant="ghost" size="icon" className={`h-8 w-8 ${item.is_active === 1 ? 'text-amber-500' : 'text-emerald-500'}`} onClick={() => handleToggleActive(item)} title={item.is_active === 1 ? 'Deactivate' : 'Activate'}>
                                  {item.is_active === 1 ? <ToggleRight className="w-3.5 h-3.5" /> : <ToggleLeft className="w-3.5 h-3.5" />}
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600" onClick={() => handleDelete(item.fee_structure_id)} title="Delete"><Trash2 className="w-3.5 h-3.5" /></Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        </>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile */}
                <div className="md:hidden divide-y">
                  {loading ? Array.from({ length: 3 }).map((_, i) => <div key={i} className="p-4 space-y-3"><Skeleton className="h-4 w-3/4" /><Skeleton className="h-3 w-1/2" /></div>)
                  : feeStructures.length === 0 ? <div className="text-center py-12 text-slate-400"><FileText className="w-10 h-10 mx-auto mb-2 opacity-50" /><p>No fee structures found</p></div>
                  : feeStructures.map((item) => (
                    <div key={item.fee_structure_id} className="p-4 space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-sm">{item.name}</p>
                          <p className="text-xs text-slate-400">{item.class?.name || 'All Classes'} &middot; {item.year} {item.term}</p>
                        </div>
                        <Badge className={statusBadge[item.status]?.className || statusBadge.active.className}>
                          {statusBadge[item.status]?.label || item.status}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <p className="text-lg font-bold text-emerald-700">{fmt(item.total_amount)}</p>
                          <span className="text-xs text-slate-400">{item.installment_count} installments</span>
                        </div>
                        <div className="flex gap-1.5">
                          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => handleView(item.fee_structure_id)}><Eye className="w-3 h-3" /></Button>
                          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => handleEdit(item)}><Pencil className="w-3 h-3" /></Button>
                          <Button variant="outline" size="sm" className="h-8 text-xs text-red-500" onClick={() => handleDelete(item.fee_structure_id)}><Trash2 className="w-3 h-3" /></Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB: Bill Items Builder */}
          <TabsContent value="builder" className="space-y-4">
            <Card className="bg-sky-50 border-sky-200">
              <CardContent className="p-4 flex gap-3">
                <Info className="w-5 h-5 text-sky-600 mt-0.5 shrink-0" />
                <div className="text-sm text-sky-800">
                  <p className="font-semibold mb-1">Bill Items Builder</p>
                  <p>Select bill items to auto-calculate the total amount when creating a fee structure.</p>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <Card className="lg:col-span-2">
                <CardContent className="p-4">
                  <h3 className="font-semibold text-sm mb-3">Available Bill Items</h3>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {billItems.map((item) => {
                      const isSelected = selectedItems.includes(item.id);
                      return (
                        <div
                          key={item.id}
                          className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${isSelected ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-200 hover:bg-slate-50'}`}
                          onClick={() => toggleBillItem(item.id)}
                        >
                          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${isSelected ? 'bg-emerald-600 border-emerald-600' : 'border-slate-300'}`}>
                            {isSelected && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{item.title}</p>
                            <p className="text-xs text-slate-400">
                              {item.bill_category?.bill_category_name || 'Uncategorized'}
                              {item.description ? ` · ${item.description}` : ''}
                            </p>
                          </div>
                          <p className="text-sm font-mono font-medium text-emerald-700">{fmt(item.amount)}</p>
                        </div>
                      );
                    })}
                    {billItems.length === 0 && (
                      <p className="text-sm text-slate-400 text-center py-8">No bill items available.</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 space-y-4">
                  <h3 className="font-semibold text-sm">Summary</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Selected Items</span>
                      <span className="font-medium">{selectedItems.length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Total</span>
                      <span className="font-bold text-emerald-700">
                        {fmt(billItems.filter((i) => selectedItems.includes(i.id)).reduce((s, i) => s + i.amount, 0))}
                      </span>
                    </div>
                  </div>
                  {selectedItems.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-slate-500">Selected Items:</p>
                      {billItems.filter((i) => selectedItems.includes(i.id)).map((item) => (
                        <div key={item.id} className="flex items-center justify-between text-xs">
                          <span className="truncate">{item.title}</span>
                          <span className="font-mono">{fmt(item.amount)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {selectedItems.length > 0 && (
                    <Button variant="outline" size="sm" className="w-full text-red-500" onClick={() => setSelectedItems([])}>
                      <X className="w-3 h-3 mr-1" /> Clear Selection
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Create Dialog */}
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Fee Structure</DialogTitle>
              <DialogDescription>Define a new fee structure with bill items and installments</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div>
                <Label className="text-xs font-medium">Name *</Label>
                <Input placeholder="e.g., Term 1 Fees 2025/2026" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-medium">Class</Label>
                  <Select value={form.classId} onValueChange={(v) => v === '__none__' ? setForm({ ...form, classId: '' }) : setForm({ ...form, classId: v })}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Select class" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">All Classes</SelectItem>
                      {classes.map((c) => <SelectItem key={c.class_id} value={String(c.class_id)}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs font-medium">Academic Year</Label>
                  <Select value={form.year} onValueChange={(v) => setForm({ ...form, year: v })}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Select year" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2025/2026">2025/2026</SelectItem>
                      <SelectItem value="2024/2025">2024/2025</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-medium">Term</Label>
                  <Select value={form.term} onValueChange={(v) => setForm({ ...form, term: v })}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Select term" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Term 1">Term 1</SelectItem>
                      <SelectItem value="Term 2">Term 2</SelectItem>
                      <SelectItem value="Term 3">Term 3</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs font-medium">Total Amount (GHS) *</Label>
                  <Input type="number" step="0.01" placeholder="0.00" value={form.totalAmount} onChange={(e) => setForm({ ...form, totalAmount: e.target.value })} className="mt-1" />
                </div>
              </div>

              {/* Installment Configuration */}
              <div className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-500" />
                  <Label className="text-xs font-semibold">Installment Configuration</Label>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-medium">Number of Installments</Label>
                    <Select value={form.installmentCount} onValueChange={(v) => handleInstallmentCountChange(v)}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5, 6, 8, 10, 12].map((n) => (
                          <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end">
                    {form.totalAmount && form.installmentCount && (
                      <p className="text-sm font-medium text-emerald-700">
                        {fmt(parseFloat(form.totalAmount || '0') / parseInt(form.installmentCount))} each
                      </p>
                    )}
                  </div>
                </div>

                {parseInt(form.installmentCount) > 1 && (
                  <div>
                    <Label className="text-xs font-medium mb-2 block">Due Dates</Label>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {form.dueDates.map((date, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <span className="text-xs text-slate-400 w-6 shrink-0">#{idx + 1}</span>
                          <Input type="date" value={date} onChange={(e) => handleDueDateChange(idx, e.target.value)} className="text-xs h-8" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {selectedItems.length > 0 && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                  <p className="text-xs font-medium text-emerald-700 mb-1">
                    {selectedItems.length} bill item(s) selected — Auto-calculated
                  </p>
                  <p className="text-sm font-bold text-emerald-800">
                    {fmt(billItems.filter((i) => selectedItems.includes(i.id)).reduce((s, i) => s + i.amount, 0))}
                  </p>
                </div>
              )}

              <div>
                <Label className="text-xs font-medium">Description</Label>
                <Textarea placeholder="Optional description..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="mt-1" rows={2} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button onClick={handleSaveCreate} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
                {saving ? 'Creating...' : 'Create Structure'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Fee Structure</DialogTitle>
              <DialogDescription>Update fee structure details</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div>
                <Label className="text-xs font-medium">Name *</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-medium">Class</Label>
                  <Select value={form.classId} onValueChange={(v) => v === '__none__' ? setForm({ ...form, classId: '' }) : setForm({ ...form, classId: v })}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Select class" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">All Classes</SelectItem>
                      {classes.map((c) => <SelectItem key={c.class_id} value={String(c.class_id)}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs font-medium">Academic Year</Label>
                  <Select value={form.year} onValueChange={(v) => setForm({ ...form, year: v })}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Select year" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2025/2026">2025/2026</SelectItem>
                      <SelectItem value="2024/2025">2024/2025</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-medium">Term</Label>
                  <Select value={form.term} onValueChange={(v) => setForm({ ...form, term: v })}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Select term" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Term 1">Term 1</SelectItem>
                      <SelectItem value="Term 2">Term 2</SelectItem>
                      <SelectItem value="Term 3">Term 3</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs font-medium">Total Amount (GHS)</Label>
                  <Input type="number" step="0.01" value={form.totalAmount} onChange={(e) => setForm({ ...form, totalAmount: e.target.value })} className="mt-1" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-medium">Installments</Label>
                  <Select value={form.installmentCount} onValueChange={(v) => handleInstallmentCountChange(v)}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6, 8, 10, 12].map((n) => (
                        <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label className="text-xs font-medium">Description</Label>
                <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="mt-1" rows={2} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
              <Button onClick={handleSaveEdit} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* View Dialog */}
        <Dialog open={viewOpen} onOpenChange={setViewOpen}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Fee Structure Details</DialogTitle>
            </DialogHeader>
            {viewLoading ? (
              <div className="space-y-4 py-4">
                <Skeleton className="h-6 w-1/2" /><Skeleton className="h-4 w-full" /><Skeleton className="h-32 w-full" />
              </div>
            ) : viewItem ? (
              <div className="space-y-6 py-2">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs text-slate-500">Name</p>
                    <p className="text-sm font-semibold">{viewItem.name}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-slate-500">Class</p>
                    <Badge variant="outline">{viewItem.class?.name || 'All Classes'}</Badge>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-slate-500">Status</p>
                    <Badge className={statusBadge[viewItem.status]?.className || statusBadge.active.className}>
                      {statusBadge[viewItem.status]?.label || viewItem.status}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-slate-500">Year / Term</p>
                    <p className="text-sm">{viewItem.year || '—'} / {viewItem.term || '—'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-slate-500">Installments</p>
                    <p className="text-sm font-medium">{viewItem.installment_count}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-slate-500">Total Amount</p>
                    <p className="text-lg font-bold text-emerald-700">{fmt(viewItem.total_amount)}</p>
                  </div>
                </div>

                {viewItem.description && (
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Description</p>
                    <p className="text-sm text-slate-700">{viewItem.description}</p>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-emerald-50 rounded-lg p-3 text-center">
                    <p className="text-xs text-slate-500">Enrolled</p>
                    <p className="text-sm font-bold">{viewItem.enrollCount}</p>
                  </div>
                  <div className="bg-sky-50 rounded-lg p-3 text-center">
                    <p className="text-xs text-slate-500">Payment Plans</p>
                    <p className="text-sm font-bold">{viewItem.paymentPlanCount}</p>
                  </div>
                  <div className="bg-amber-50 rounded-lg p-3 text-center">
                    <p className="text-xs text-slate-500">Revenue</p>
                    <p className="text-sm font-bold text-emerald-700">{fmt(viewItem.total_amount * viewItem.enrollCount)}</p>
                  </div>
                </div>

                {/* Due Dates */}
                {viewItem.dueDates && viewItem.dueDates.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Installment Due Dates</h4>
                    <div className="flex flex-wrap gap-2">
                      {viewItem.dueDates.map((date, idx) => (
                        <Badge key={idx} variant="outline" className="bg-slate-50">
                          #{idx + 1}: {fmtDate(date)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Bill Items */}
                {viewItem.billItems && viewItem.billItems.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Bill Items ({viewItem.billItems.length})</h4>
                    <div className="max-h-48 overflow-y-auto space-y-1">
                      {viewItem.billItems.map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-2 rounded border text-sm">
                          <div>
                            <span className="font-medium">{item.title}</span>
                            {item.bill_category && (
                              <span className="text-xs text-slate-400 ml-2">({item.bill_category.bill_category_name})</span>
                            )}
                          </div>
                          <span className="font-mono font-medium text-emerald-700">{fmt(item.amount)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </DialogContent>
        </Dialog>

        {/* Assign to Students Dialog */}
        <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Assign Fee Structure to Students</DialogTitle>
              <DialogDescription>
                {assignStructure && `Assign "${assignStructure.name}" (${fmt(assignStructure.total_amount)}) to students`}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div>
                <Label className="text-xs font-medium">Search Students</Label>
                <Input
                  placeholder="Type name or student code..."
                  value={studentSearch}
                  onChange={(e) => handleStudentSearch(e.target.value)}
                  className="mt-1"
                />
                {studentResults.length > 0 && (
                  <div className="mt-2 max-h-48 overflow-y-auto border rounded-lg">
                    {studentResults.map((s: any) => (
                      <button
                        key={s.student_id}
                        className="w-full text-left px-3 py-2 hover:bg-emerald-50 border-b last:border-0 text-sm transition-colors"
                        onClick={() => handleAddStudent(s)}
                      >
                        <span className="font-medium">{s.name}</span>
                        <span className="text-slate-400 ml-2">({s.student_code})</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {assignedStudents.length > 0 && (
                <div>
                  <Label className="text-xs font-medium mb-2 block">
                    Selected Students ({assignedStudents.length})
                  </Label>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {assignedStudents.map((s) => (
                      <div key={s.student_id} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                        <div>
                          <p className="text-sm font-medium">{s.name}</p>
                          <p className="text-xs text-slate-400">{s.student_code}</p>
                        </div>
                        <Button variant="ghost" size="sm" className="h-7 text-red-500" onClick={() => handleRemoveStudent(s.student_id)}>
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {assignStructure && assignedStudents.length > 0 && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                  <p className="text-xs text-emerald-700">
                    {assignedStudents.length} student(s) x {fmt(assignStructure.total_amount)} = <strong>{fmt(assignStructure.total_amount * assignedStudents.length)}</strong>
                  </p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAssignOpen(false)}>Cancel</Button>
              <Button onClick={handleAssignPlans} disabled={assigning || assignedStudents.length === 0} className="bg-emerald-600 hover:bg-emerald-700">
                {assigning ? 'Assigning...' : `Assign to ${assignedStudents.length} Student(s)`}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
