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
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import {
  CalendarRange, Search, Plus, Eye, Pencil, Trash2, Users, DollarSign,
  ToggleLeft, ToggleRight, Info, Clock, CheckCircle, AlertTriangle,
  Calendar, CreditCard, ArrowUpRight, X, Receipt,
} from 'lucide-react';

// ======== TYPES ========
interface PaymentPlan {
  payment_plan_id: number;
  name: string;
  description: string;
  number_of_payments: number;
  frequency: string;
  is_active: number;
  total_amount: number;
  paid_amount: number;
  status: string;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  student: { student_id: number; name: string; student_code: string } | null;
  fee_structure: { fee_structure_id: number; name: string; year: string; term: string } | null;
  _count: { installments: number };
}

interface PaymentInstallment {
  installment_id: number;
  payment_plan_id: number;
  installment_number: number;
  amount: number;
  paid_amount: number;
  due_date: string | null;
  status: string;
  payment_date: string | null;
  payment_method: string;
  student: { student_id: number; name: string; student_code: string } | null;
  invoice: { invoice_id: number; invoice_code: string; amount: number; status: string } | null;
}

interface PlanDetail {
  plan: PaymentPlan;
  installments: PaymentInstallment[];
  stats: {
    totalAmount: number;
    paidAmount: number;
    remaining: number;
    totalInstallments: number;
    pendingCount: number;
    paidCount: number;
    overdueCount: number;
    partialCount: number;
    progress: number;
  };
}

interface FeeStructure {
  fee_structure_id: number;
  name: string;
  year: string;
  term: string;
  total_amount: number;
}

// ======== HELPERS ========
function fmt(amount: number) {
  return new Intl.NumberFormat('en-UG', { style: 'currency', currency: 'GHS', minimumFractionDigits: 2 }).format(amount);
}

function fmtDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function isOverdue(dateStr: string | null): boolean {
  if (!dateStr) return false;
  const due = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return due < today;
}

const frequencyLabels: Record<string, string> = {
  weekly: 'Weekly', 'bi-weekly': 'Bi-Weekly', monthly: 'Monthly',
  quarterly: 'Quarterly', 'semi-annually': 'Semi-Annually', annually: 'Annually',
};

const statusConfig: Record<string, { label: string; className: string; icon: any }> = {
  pending: { label: 'Pending', className: 'bg-amber-100 text-amber-700 border-amber-200', icon: Clock },
  paid: { label: 'Paid', className: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: CheckCircle },
  overdue: { label: 'Overdue', className: 'bg-red-100 text-red-700 border-red-200', icon: AlertTriangle },
  partial: { label: 'Partial', className: 'bg-sky-100 text-sky-700 border-sky-200', icon: DollarSign },
};

const planStatusConfig: Record<string, { label: string; className: string }> = {
  active: { label: 'Active', className: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  completed: { label: 'Completed', className: 'bg-sky-100 text-sky-700 border-sky-200' },
  cancelled: { label: 'Cancelled', className: 'bg-slate-100 text-slate-500 border-slate-200' },
};

// ======== MAIN COMPONENT ========
export default function PaymentPlansPage() {
  const [paymentPlans, setPaymentPlans] = useState<PaymentPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [summary, setSummary] = useState({ total: 0, active: 0, overdueAmount: 0, collectedAmount: 0 });
  const [activeTab, setActiveTab] = useState('plans');

  // Create dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({
    name: '', description: '', numberOfPayments: '3', frequency: 'monthly',
    startDate: '', totalAmount: '', studentSearch: '',
  });
  const [saving, setSaving] = useState(false);
  const [studentResults, setStudentResults] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([]);
  const [selectedFeeStructure, setSelectedFeeStructure] = useState('');

  // View dialog
  const [viewOpen, setViewOpen] = useState(false);
  const [viewData, setViewData] = useState<PlanDetail | null>(null);
  const [viewLoading, setViewLoading] = useState(false);

  // Record payment dialog
  const [payOpen, setPayOpen] = useState(false);
  const [payInstallment, setPayInstallment] = useState<PaymentInstallment | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('cash');
  const [paying, setPaying] = useState(false);

  // ===== FETCH =====
  const fetchPlans = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      const res = await fetch(`/api/admin/payment-plans?${params}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setPaymentPlans(data.paymentPlans || []);
      setSummary(data.summary || { total: 0, active: 0, overdueAmount: 0, collectedAmount: 0 });
    } catch {
      toast.error('Failed to load payment plans');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  const fetchFeeStructures = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/fee-structures?status=active');
      const data = await res.json();
      setFeeStructures(data.feeStructures || []);
    } catch { /* silent */ }
  }, []);

  useEffect(() => { fetchPlans(); fetchFeeStructures(); }, [fetchPlans, fetchFeeStructures]);

  useEffect(() => {
    const timer = setTimeout(() => { fetchPlans(); }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  // ===== HANDLERS =====
  const resetForm = () => setForm({
    name: '', description: '', numberOfPayments: '3', frequency: 'monthly',
    startDate: '', totalAmount: '', studentSearch: '',
  });

  const handleCreate = () => {
    resetForm();
    setSelectedStudent(null);
    setSelectedFeeStructure('');
    setCreateOpen(true);
  };

  const handleStudentSearch = async (query: string) => {
    setForm((prev) => ({ ...prev, studentSearch: query }));
    if (query.length < 2) {
      setStudentResults([]);
      return;
    }
    try {
      const res = await fetch(`/api/students?search=${encodeURIComponent(query)}&limit=20`);
      const data = await res.json();
      setStudentResults(data.students || []);
    } catch { /* silent */ }
  };

  const handleSelectStudent = (student: any) => {
    setSelectedStudent(student);
    setForm((prev) => ({ ...prev, studentSearch: '', name: `${student.name}'s Payment Plan` }));
    setStudentResults([]);
  };

  const handleSaveCreate = async () => {
    if (!form.name || !form.totalAmount) {
      toast.error('Name and total amount are required');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/admin/payment-plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          description: form.description,
          numberOfPayments: form.numberOfPayments,
          frequency: form.frequency,
          startDate: form.startDate || new Date().toISOString().split('T')[0],
          totalAmount: form.totalAmount,
          studentId: selectedStudent?.student_id,
          feeStructureId: selectedFeeStructure || undefined,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast.success(data.message);
      setCreateOpen(false);
      resetForm();
      fetchPlans();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (item: PaymentPlan) => {
    try {
      const res = await fetch('/api/admin/payment-plans', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: item.payment_plan_id,
          isActive: item.is_active === 1 ? false : true,
          status: item.is_active === 1 ? 'cancelled' : 'active',
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast.success(item.is_active === 1 ? 'Plan cancelled' : 'Plan activated');
      fetchPlans();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleView = async (id: number) => {
    setViewOpen(true);
    setViewLoading(true);
    setViewData(null);
    try {
      const res = await fetch(`/api/admin/payment-plans/${id}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setViewData(data);
    } catch (err: any) {
      toast.error(err.message);
      setViewOpen(false);
    } finally {
      setViewLoading(false);
    }
  };

  const handleOpenPay = (installment: PaymentInstallment) => {
    setPayInstallment(installment);
    const remaining = installment.amount - installment.paid_amount;
    setPayAmount(String(remaining));
    setPayMethod('cash');
    setPayOpen(true);
  };

  const handleRecordPayment = async () => {
    if (!payInstallment || !payAmount || parseFloat(payAmount) <= 0) {
      toast.error('Valid amount is required');
      return;
    }
    setPaying(true);
    try {
      const res = await fetch(`/api/admin/payment-plans/${payInstallment.payment_plan_id}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          installmentId: payInstallment.installment_id,
          amount: parseFloat(payAmount),
          paymentMethod: payMethod,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast.success(data.message);
      setPayOpen(false);
      // Refresh view data
      if (viewData) {
        handleView(viewData.plan.payment_plan_id);
      }
      fetchPlans();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setPaying(false);
    }
  };

  const filteredPlans = paymentPlans.filter((p) =>
    !search ||
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.student?.name.toLowerCase().includes(search.toLowerCase()) ||
    p.fee_structure?.name.toLowerCase().includes(search.toLowerCase())
  );

  // ===== RENDER =====
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-4 border-b border-slate-100">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Payment Plans</h1>
            <p className="text-sm text-slate-500 mt-0.5">Create and manage installment payment plans</p>
          </div>
          <Button onClick={handleCreate} className="bg-emerald-600 hover:bg-emerald-700 min-h-[44px]">
            <Plus className="w-4 h-4 mr-2" /> Create Payment Plan
          </Button>
        </div>

        {/* Summary Cards */}
        {loading && !paymentPlans.length ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="border-l-4 border-l-slate-200"><CardContent className="p-4"><div className="flex items-center gap-3"><Skeleton className="w-11 h-11 rounded-xl" /><div className="flex-1 space-y-2"><Skeleton className="h-3 w-20" /><Skeleton className="h-6 w-16" /></div></div></CardContent></Card>
            ))}
          </div>
        ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-l-4 border-l-emerald-500 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-emerald-500 w-11 h-11 rounded-xl flex items-center justify-center">
                  <CalendarRange className="w-5 h-5 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Plans</p>
                  <p className="text-2xl font-bold text-slate-900 tabular-nums">{summary.active}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-amber-500 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-amber-500 w-11 h-11 rounded-xl flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Overdue Amount</p>
                  <p className="text-2xl font-bold text-slate-900 tabular-nums">{fmt(summary.overdueAmount)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-sky-500 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-sky-500 w-11 h-11 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Collected</p>
                  <p className="text-2xl font-bold text-slate-900 tabular-nums">{fmt(summary.collectedAmount)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-violet-500 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-violet-500 w-11 h-11 rounded-xl flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Plans</p>
                  <p className="text-2xl font-bold text-slate-900 tabular-nums">{summary.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="plans" className="flex items-center gap-1.5">
              <CalendarRange className="w-4 h-4" /> Payment Plans
            </TabsTrigger>
            <TabsTrigger value="timeline" className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" /> Overview
            </TabsTrigger>
          </TabsList>

          <TabsContent value="plans" className="space-y-4">
            {/* Filters */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input placeholder="Search plans, students..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
                  </div>
                  <Select value={statusFilter} onValueChange={(v) => v === '__all__' ? setStatusFilter('') : setStatusFilter(v)}>
                    <SelectTrigger className="w-full sm:w-48 bg-slate-50 border-slate-200 focus:bg-white"><SelectValue placeholder="All Status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
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
                        <TableHead className="text-xs font-semibold">Plan</TableHead>
                        <TableHead className="text-xs font-semibold">Student</TableHead>
                        <TableHead className="text-xs font-semibold">Fee Structure</TableHead>
                        <TableHead className="text-xs font-semibold text-right">Total</TableHead>
                        <TableHead className="text-xs font-semibold text-right">Paid</TableHead>
                        <TableHead className="text-xs font-semibold">Progress</TableHead>
                        <TableHead className="text-xs font-semibold">Status</TableHead>
                        <TableHead className="text-xs font-semibold text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}>{Array.from({ length: 8 }).map((_, j) => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}</TableRow>
                      )) : filteredPlans.length === 0 ? (
                        <TableRow><TableCell colSpan={8} className="text-center py-12 text-slate-400">
                          <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto mb-3"><CalendarRange className="w-7 h-7 text-emerald-500" /></div>
                          <p className="font-medium">No payment plans found</p>
                          <p className="text-xs mt-0.5">Create a plan to get started</p>
                        </TableCell></TableRow>
                      ) : filteredPlans.map((plan) => {
                        const progress = plan.total_amount > 0 ? (plan.paid_amount / plan.total_amount) * 100 : 0;
                        const pc = planStatusConfig[plan.status] || planStatusConfig.active;
                        return (
                          <TableRow key={plan.payment_plan_id} className="hover:bg-slate-50/50">
                            <TableCell>
                              <p className="font-medium text-sm">{plan.name}</p>
                              <p className="text-xs text-slate-400">{plan.frequency} &middot; {plan.number_of_payments} installments</p>
                            </TableCell>
                            <TableCell>
                              {plan.student ? (
                                <div>
                                  <p className="text-sm">{plan.student.name}</p>
                                  <p className="text-xs text-slate-400">{plan.student.student_code}</p>
                                </div>
                              ) : <span className="text-xs text-slate-400">Template</span>}
                            </TableCell>
                            <TableCell>
                              <span className="text-xs">{plan.fee_structure?.name || '—'}</span>
                            </TableCell>
                            <TableCell className="text-right text-sm font-mono">{fmt(plan.total_amount)}</TableCell>
                            <TableCell className="text-right text-sm font-mono text-emerald-600">{fmt(plan.paid_amount)}</TableCell>
                            <TableCell className="min-w-[120px]">
                              <div className="space-y-1">
                                <Progress value={progress} className="h-2" />
                                <p className="text-xs text-slate-400 text-right">{Math.round(progress)}%</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className={pc.className}>{pc.label}</Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-0.5">
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleView(plan.payment_plan_id)} title="View"><Eye className="w-3.5 h-3.5" /></Button>
                                <Button variant="ghost" size="icon" className={`h-8 w-8 ${plan.status === 'cancelled' ? 'text-emerald-500' : 'text-amber-500'}`} onClick={() => handleToggleActive(plan)} title={plan.status === 'cancelled' ? 'Activate' : 'Cancel'}>
                                  {plan.status === 'cancelled' ? <ToggleLeft className="w-3.5 h-3.5" /> : <ToggleRight className="w-3.5 h-3.5" />}
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile */}
                <div className="md:hidden divide-y">
                  {loading ? Array.from({ length: 3 }).map((_, i) => <div key={i} className="p-4 space-y-3"><Skeleton className="h-4 w-3/4" /><Skeleton className="h-3 w-1/2" /></div>)
                  : filteredPlans.length === 0 ? <div className="text-center py-12 text-slate-400"><div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto mb-3"><CalendarRange className="w-7 h-7 text-emerald-500" /></div><p className="font-medium">No payment plans found</p></div>
                  : filteredPlans.map((plan) => {
                    const progress = plan.total_amount > 0 ? (plan.paid_amount / plan.total_amount) * 100 : 0;
                    const pc = planStatusConfig[plan.status] || planStatusConfig.active;
                    return (
                      <div key={plan.payment_plan_id} className="p-4 space-y-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium text-sm">{plan.name}</p>
                            <p className="text-xs text-slate-400">{plan.student?.name || 'Template'} &middot; {plan.number_of_payments} x {frequencyLabels[plan.frequency] || plan.frequency}</p>
                          </div>
                          <Badge className={pc.className}>{pc.label}</Badge>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-emerald-600 font-medium">{fmt(plan.paid_amount)}</span>
                          <span className="text-slate-400">of {fmt(plan.total_amount)}</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                        <div className="flex gap-1.5 pt-1">
                          <Button variant="outline" size="sm" className="flex-1 min-h-[44px] text-xs" onClick={() => handleView(plan.payment_plan_id)}><Eye className="w-3 h-3 mr-1" />View</Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB: Overview */}
          <TabsContent value="timeline" className="space-y-4">
            <Card className="bg-emerald-50 border-emerald-200">
              <CardContent className="p-4 flex gap-3">
                <Info className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
                <div className="text-sm text-emerald-800">
                  <p className="font-semibold mb-1">Payment Plans Overview</p>
                  <p>Summary of all active and completed payment plans. Click any plan to view detailed installment schedule.</p>
                </div>
              </CardContent>
            </Card>

            {paymentPlans.filter((p) => p.status === 'active').length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {paymentPlans.filter((p) => p.status === 'active').slice(0, 8).map((plan) => {
                  const progress = plan.total_amount > 0 ? (plan.paid_amount / plan.total_amount) * 100 : 0;
                  return (
                    <Card key={plan.payment_plan_id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleView(plan.payment_plan_id)}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <h4 className="font-semibold text-sm">{plan.name}</h4>
                            <p className="text-xs text-slate-400">
                              {plan.student?.name || 'Template'} &middot; {plan.number_of_payments} {frequencyLabels[plan.frequency] || plan.frequency}
                            </p>
                          </div>
                          <Badge className="bg-emerald-100 text-emerald-700">Active</Badge>
                        </div>
                        <div className="flex items-center justify-between text-sm mb-2">
                          <span className="text-emerald-600 font-medium">{fmt(plan.paid_amount)}</span>
                          <span className="text-slate-400">of {fmt(plan.total_amount)}</span>
                        </div>
                        <Progress value={progress} className="h-2 mb-1" />
                        <div className="flex justify-between text-xs text-slate-400">
                          <span>{Math.round(progress)}% complete</span>
                          <span className="flex items-center gap-1"><ArrowUpRight className="w-3 h-3" /> Details</span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card>
                <CardContent className="p-12 text-center text-slate-400">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto mb-3"><CalendarRange className="w-7 h-7 text-emerald-500" /></div>
                  <p className="font-medium">No active payment plans</p>
                  <p className="text-xs mt-0.5">Create a plan to track installments</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Create Dialog */}
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Payment Plan</DialogTitle>
              <DialogDescription>Set up a new installment payment plan</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              {/* Student Search */}
              <div>
                <Label className="text-xs font-medium">Student (Optional)</Label>
                {!selectedStudent ? (
                  <>
                    <Input
                      placeholder="Search student name or code..."
                      value={form.studentSearch}
                      onChange={(e) => handleStudentSearch(e.target.value)}
                      className="mt-1"
                    />
                    {studentResults.length > 0 && (
                      <div className="mt-2 max-h-40 overflow-y-auto border rounded-lg">
                        {studentResults.map((s: any) => (
                          <button key={s.student_id} className="w-full text-left px-3 py-2 hover:bg-emerald-50 border-b last:border-0 text-sm" onClick={() => handleSelectStudent(s)}>
                            <span className="font-medium">{s.name}</span>
                            <span className="text-slate-400 ml-2">({s.student_code})</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="mt-1 bg-emerald-50 rounded-lg p-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{selectedStudent.name}</p>
                      <p className="text-xs text-slate-500">{selectedStudent.student_code}</p>
                    </div>
                    <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setSelectedStudent(null)}>
                      <X className="w-3 h-3 mr-1" />Change
                    </Button>
                  </div>
                )}
              </div>

              {/* Fee Structure */}
              <div>
                <Label className="text-xs font-medium">Fee Structure (Optional)</Label>
                <Select value={selectedFeeStructure} onValueChange={(v) => {
                  setSelectedFeeStructure(v === '__none__' ? '' : v);
                  if (v !== '__none__') {
                    const fs = feeStructures.find((f) => String(f.fee_structure_id) === v);
                    if (fs) {
                      setForm((prev) => ({ ...prev, totalAmount: String(fs.total_amount) }));
                    }
                  }
                }}>
                  <SelectTrigger className="mt-1 bg-slate-50 border-slate-200 focus:bg-white"><SelectValue placeholder="Select fee structure" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">None</SelectItem>
                    {feeStructures.map((fs) => (
                      <SelectItem key={fs.fee_structure_id} value={String(fs.fee_structure_id)}>
                        {fs.name} — {fmt(fs.total_amount)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs font-medium">Plan Name *</Label>
                <Input placeholder="e.g., 3-Month Term Plan" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs font-medium">Description</Label>
                <Textarea placeholder="Optional..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="mt-1" rows={2} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-medium">Installments *</Label>
                  <Select value={form.numberOfPayments} onValueChange={(v) => setForm({ ...form, numberOfPayments: v })}>
                    <SelectTrigger className="mt-1 bg-slate-50 border-slate-200 focus:bg-white"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6, 8, 10, 12].map((n) => (
                        <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs font-medium">Frequency *</Label>
                  <Select value={form.frequency} onValueChange={(v) => setForm({ ...form, frequency: v })}>
                    <SelectTrigger className="mt-1 bg-slate-50 border-slate-200 focus:bg-white"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="bi-weekly">Bi-Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                      <SelectItem value="semi-annually">Semi-Annually</SelectItem>
                      <SelectItem value="annually">Annually</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-medium">Start Date</Label>
                  <Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs font-medium">Total Amount (GHS) *</Label>
                  <Input type="number" step="0.01" placeholder="0.00" value={form.totalAmount} onChange={(e) => setForm({ ...form, totalAmount: e.target.value })} className="mt-1" />
                </div>
              </div>
              {form.totalAmount && form.numberOfPayments && (
                <div className="bg-sky-50 border border-sky-200 rounded-lg p-3">
                  <p className="text-xs font-medium text-sky-700 mb-1">Each Installment</p>
                  <p className="text-lg font-bold text-sky-800">
                    {fmt(parseFloat(form.totalAmount || '0') / parseInt(form.numberOfPayments))}
                  </p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button onClick={handleSaveCreate} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
                {saving ? 'Creating...' : 'Create Plan'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* View Dialog */}
        <Dialog open={viewOpen} onOpenChange={setViewOpen}>
          <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Payment Plan Details</DialogTitle>
            </DialogHeader>
            {viewLoading ? (
              <div className="space-y-4 py-4">
                <Skeleton className="h-6 w-1/2" /><Skeleton className="h-4 w-full" /><Skeleton className="h-64 w-full" />
              </div>
            ) : viewData ? (
              <div className="space-y-6 py-2">
                {/* Plan Info */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs text-slate-500">Plan Name</p>
                    <p className="text-sm font-semibold">{viewData.plan.name}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-slate-500">Student</p>
                    <p className="text-sm">{viewData.plan.student?.name || 'Template'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-slate-500">Fee Structure</p>
                    <p className="text-sm">{viewData.plan.fee_structure?.name || '—'}</p>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-slate-50 rounded-lg p-3 text-center">
                    <p className="text-xs text-slate-500">Total</p>
                    <p className="text-sm font-bold">{fmt(viewData.stats.totalAmount)}</p>
                  </div>
                  <div className="bg-emerald-50 rounded-lg p-3 text-center">
                    <p className="text-xs text-emerald-600">Paid</p>
                    <p className="text-sm font-bold text-emerald-700">{fmt(viewData.stats.paidAmount)}</p>
                  </div>
                  <div className="bg-amber-50 rounded-lg p-3 text-center">
                    <p className="text-xs text-amber-600">Remaining</p>
                    <p className="text-sm font-bold text-amber-700">{fmt(viewData.stats.remaining)}</p>
                  </div>
                  <div className="bg-sky-50 rounded-lg p-3 text-center">
                    <p className="text-xs text-sky-600">Progress</p>
                    <p className="text-sm font-bold text-sky-700">{Math.round(viewData.stats.progress)}%</p>
                  </div>
                </div>

                <Progress value={viewData.stats.progress} className="h-3" />

                <div className="flex gap-3 flex-wrap">
                  <div className="flex items-center gap-1.5 text-xs"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500" /><span>Paid: {viewData.stats.paidCount}</span></div>
                  <div className="flex items-center gap-1.5 text-xs"><div className="w-2.5 h-2.5 rounded-full bg-amber-500" /><span>Pending: {viewData.stats.pendingCount}</span></div>
                  <div className="flex items-center gap-1.5 text-xs"><div className="w-2.5 h-2.5 rounded-full bg-red-500" /><span>Overdue: {viewData.stats.overdueCount}</span></div>
                  <div className="flex items-center gap-1.5 text-xs"><div className="w-2.5 h-2.5 rounded-full bg-sky-500" /><span>Partial: {viewData.stats.partialCount}</span></div>
                </div>

                {/* Installment Timeline */}
                <div>
                  <h4 className="text-sm font-semibold mb-3">Installment Schedule</h4>
                  {viewData.installments.length > 0 ? (
                    <div className="relative">
                      <div className="absolute left-[18px] top-2 bottom-2 w-0.5 bg-slate-200" />
                      <div className="space-y-0">
                        {viewData.installments.map((inst) => {
                          const sc = statusConfig[inst.status] || statusConfig.pending;
                          const StatusIcon = sc.icon;
                          const isOverdueInst = inst.status === 'overdue' || (inst.status === 'pending' && isOverdue(inst.due_date));
                          const remaining = inst.amount - inst.paid_amount;

                          return (
                            <div key={inst.installment_id} className={`flex gap-4 py-3 relative ${isOverdueInst ? 'bg-red-50/50' : ''}`}>
                              <div className={`relative z-10 w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                                inst.status === 'paid' ? 'bg-emerald-100' :
                                isOverdueInst ? 'bg-red-100' : 'bg-amber-100'
                              }`}>
                                <StatusIcon className={`w-4 h-4 ${
                                  inst.status === 'paid' ? 'text-emerald-600' :
                                  isOverdueInst ? 'text-red-600' : 'text-amber-600'
                                }`} />
                              </div>
                              <div className="flex-1 min-w-0 bg-white rounded-lg border p-3">
                                <div className="flex items-center justify-between mb-1">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-semibold text-slate-700">#{inst.installment_number}</span>
                                    <Badge className={sc.className} style={{ fontSize: '10px', padding: '1px 6px' }}>
                                      {isOverdueInst && inst.status === 'pending' ? 'Overdue' : sc.label}
                                    </Badge>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-sm font-bold">{fmt(inst.amount)}</p>
                                    {inst.paid_amount > 0 && <p className="text-xs text-emerald-600">Paid: {fmt(inst.paid_amount)}</p>}
                                  </div>
                                </div>
                                <div className="flex items-center gap-3 text-xs text-slate-400">
                                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {fmtDate(inst.due_date)}</span>
                                  {inst.payment_date && <span className="flex items-center gap-1 text-emerald-600"><CheckCircle className="w-3 h-3" /> {fmtDate(inst.payment_date)}</span>}
                                  {inst.payment_method && <span className="capitalize">{inst.payment_method}</span>}
                                </div>
                                {remaining > 0 && (
                                  <div className="mt-2 flex items-center gap-2">
                                    <Button
                                      size="sm"
                                      className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700"
                                      onClick={() => handleOpenPay(inst)}
                                    >
                                      <CreditCard className="w-3 h-3 mr-1" />
                                      Record Payment
                                    </Button>
                                    <span className="text-xs text-red-500 font-medium">Remaining: {fmt(remaining)}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-400 text-center py-8">No installments found</p>
                  )}
                </div>
              </div>
            ) : null}
          </DialogContent>
        </Dialog>

        {/* Record Payment Dialog */}
        <Dialog open={payOpen} onOpenChange={setPayOpen}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-emerald-600" />
                Record Payment
              </DialogTitle>
              <DialogDescription>
                Installment #{payInstallment?.installment_number} — {payInstallment ? fmt(payInstallment.amount - payInstallment.paid_amount) : ''}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              {payInstallment && (
                <div className="bg-slate-50 rounded-lg p-3 text-sm space-y-1">
                  <div className="flex justify-between"><span className="text-slate-500">Installment Amount</span><span className="font-medium">{fmt(payInstallment.amount)}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Already Paid</span><span className="text-emerald-600">{fmt(payInstallment.paid_amount)}</span></div>
                  <div className="flex justify-between border-t pt-1"><span className="font-medium">Remaining</span><span className="font-bold text-red-600">{fmt(payInstallment.amount - payInstallment.paid_amount)}</span></div>
                </div>
              )}
              <div>
                <Label className="text-xs font-medium">Payment Amount (GHS)</Label>
                <Input type="number" step="0.01" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs font-medium">Payment Method</Label>
                <Select value={payMethod} onValueChange={setPayMethod}>
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
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setPayOpen(false)}>Cancel</Button>
              <Button onClick={handleRecordPayment} disabled={paying} className="bg-emerald-600 hover:bg-emerald-700">
                {paying ? 'Recording...' : 'Record Payment'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
