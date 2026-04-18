'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import {
  Zap, Clock, FileText, DollarSign, RefreshCw, Eye, Settings,
  CheckCircle, XCircle, AlertTriangle, Users, CreditCard,
  Printer, ChevronRight, History, Bus, TrendingUp, CalendarDays,
  BarChart3, Download, ChevronLeft, ChevronRight, Filter,
  Activity, ToggleLeft, ToggleRight,
} from 'lucide-react';

// ======== TYPES ========
interface FeeStructure {
  fee_structure_id: number; name: string; class_id: number | null;
  year: string; term: string; total_amount: number; description: string;
  is_active: number; status: string; installment_count: number; created_at: string;
  class: { class_id: number; name: string; name_numeric: number } | null;
}

interface RecentInvoice {
  invoiceId: number; invoiceCode: string; title: string;
  amount: number; amountPaid: number; status: string;
  createdAt: string | null; studentName: string; studentCode: string; className: string;
}

interface PreviewItem {
  studentId: number; name: string; studentCode: string;
  title: string; amount: number; dueDate: string | null;
  year: string; term: string; className: string;
}

interface BillingHistoryItem {
  billing_history_id: number; student_id: number | null; invoice_id: number | null;
  amount: number; billing_type: string; billing_date: string | null;
  status: string; reference: string;
  student?: { name: string; student_code: string };
}

interface SchoolClass { class_id: number; name: string; }

// ======== HELPERS ========
function fmt(amount: number) {
  return new Intl.NumberFormat('en-UG', { style: 'currency', currency: 'GHS', minimumFractionDigits: 2 }).format(amount);
}
function fmtDate(d: string | null) {
  if (!d) return '\u2014';
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}
function fmtDateTime(d: string | null) {
  if (!d) return '\u2014';
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

const statusConfig: Record<string, { label: string; className: string }> = {
  paid: { label: 'Paid', className: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  partial: { label: 'Partial', className: 'bg-amber-100 text-amber-700 border-amber-200' },
  unpaid: { label: 'Unpaid', className: 'bg-red-100 text-red-700 border-red-200' },
  overdue: { label: 'Overdue', className: 'bg-red-200 text-red-800 border-red-300' },
  completed: { label: 'Completed', className: 'bg-emerald-100 text-emerald-700' },
  pending: { label: 'Pending', className: 'bg-amber-100 text-amber-700' },
  failed: { label: 'Failed', className: 'bg-red-100 text-red-700' },
};

// ======== MAIN COMPONENT ========
export default function AutoBillingPage() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);

  // Dashboard data
  const [configurations, setConfigurations] = useState<FeeStructure[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [recentInvoices, setRecentInvoices] = useState<RecentInvoice[]>([]);
  const [billingHistory, setBillingHistory] = useState<BillingHistoryItem[]>([]);
  const [summary, setSummary] = useState({
    pendingInvoices: 0, generatedThisMonth: 0, totalBilled: 0,
    activeConfigurations: 0, collectionRate: 0,
  });

  // Generate form
  const [formClassId, setFormClassId] = useState('');
  const [formFeeStructureId, setFormFeeStructureId] = useState('');
  const [formYear, setFormYear] = useState('');
  const [formTerm, setFormTerm] = useState('');
  const [formDueDate, setFormDueDate] = useState('');
  const [formDescription, setFormDescription] = useState('');

  // Filters
  const [filterClass, setFilterClass] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterBillingType, setFilterBillingType] = useState('');
  const [historyPage, setHistoryPage] = useState(1);

  // Preview dialog
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewItems, setPreviewItems] = useState<PreviewItem[]>([]);
  const [previewTotal, setPreviewTotal] = useState(0);
  const [previewLoading, setPreviewLoading] = useState(false);

  // Confirm dialog
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [generating, setGenerating] = useState(false);

  // Settings dialog
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [editStructure, setEditStructure] = useState<FeeStructure | null>(null);
  const [editForm, setEditForm] = useState({ name: '', totalAmount: '', year: '', term: '', description: '', installmentCount: '' });
  const [saving, setSaving] = useState(false);

  // ===== FETCH DATA =====
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/auto-billing');
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setConfigurations(data.configurations || []);
      setClasses(data.classes || []);
      setRecentInvoices(data.recentInvoices || []);
      setBillingHistory(data.billingHistory || []);
      setSummary(data.summary || {
        pendingInvoices: 0, generatedThisMonth: 0, totalBilled: 0,
        activeConfigurations: 0, collectionRate: 0,
      });
    } catch {
      toast.error('Failed to load auto-billing data');
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Auto-set year/term when fee structure changes
  useEffect(() => {
    if (formFeeStructureId) {
      const fs = configurations.find((f) => f.fee_structure_id === parseInt(formFeeStructureId));
      if (fs) {
        if (!formYear && fs.year) setFormYear(fs.year);
        if (!formTerm && fs.term) setFormTerm(fs.term);
        if (!formClassId && fs.class_id) setFormClassId(String(fs.class_id));
      }
    }
  }, [formFeeStructureId, configurations, formYear, formTerm, formClassId]);

  // ===== GENERATE HANDLERS =====
  const handlePreview = async () => {
    if (!formFeeStructureId || !formClassId) {
      toast.error('Please select a fee structure and class');
      return;
    }
    setPreviewLoading(true);
    setPreviewOpen(true);
    try {
      const res = await fetch('/api/admin/auto-billing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feeStructureId: formFeeStructureId, classId: formClassId,
          year: formYear, term: formTerm,
          dueDate: formDueDate || undefined,
          description: formDescription || undefined,
          generatePreview: true,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setPreviewItems(data.preview || []);
      setPreviewTotal(data.totalAmount || 0);
    } catch (err: any) {
      toast.error(err.message || 'Failed to generate preview');
      setPreviewOpen(false);
    }
    setPreviewLoading(false);
  };

  const handleGenerate = async () => {
    if (!formFeeStructureId || !formClassId) return;
    setGenerating(true);
    try {
      const res = await fetch('/api/admin/auto-billing/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feeStructureId: formFeeStructureId, classId: formClassId,
          year: formYear, term: formTerm,
          dueDate: formDueDate || undefined,
          description: formDescription || undefined,
          billingDate: new Date().toISOString(),
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast.success(data.message || `Generated ${data.generatedCount} invoices`);
      setConfirmOpen(false);
      setPreviewOpen(false);
      fetchData();
      setFormFeeStructureId('');
      setFormDescription('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to generate invoices');
    }
    setGenerating(false);
  };

  // ===== SETTINGS HANDLERS =====
  const handleEditStructure = (fs: FeeStructure) => {
    setEditStructure(fs);
    setEditForm({
      name: fs.name, totalAmount: String(fs.total_amount),
      year: fs.year, term: fs.term, description: fs.description,
      installmentCount: String(fs.installment_count),
    });
    setSettingsOpen(true);
  };

  const handleSaveSettings = async () => {
    if (!editStructure) return;
    setSaving(true);
    try {
      const res = await fetch('/api/admin/auto-billing', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feeStructureId: editStructure.fee_structure_id,
          name: editForm.name, totalAmount: editForm.totalAmount,
          year: editForm.year, term: editForm.term, description: editForm.description,
          installmentCount: editForm.installmentCount,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast.success(data.message);
      setSettingsOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.message);
    }
    setSaving(false);
  };

  const handleToggleActive = async (fs: FeeStructure) => {
    try {
      const res = await fetch('/api/admin/auto-billing', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feeStructureId: fs.fee_structure_id,
          isActive: fs.is_active === 1 ? false : true,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast.success(fs.is_active === 1 ? 'Configuration deactivated' : 'Configuration activated');
      fetchData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  // ===== FILTERED DATA =====
  const filteredInvoices = recentInvoices.filter((inv) => {
    if (filterClass && inv.className !== classes.find((c) => c.class_id === parseInt(filterClass))?.name) return false;
    if (filterStatus && inv.status !== filterStatus) return false;
    return true;
  });

  const filteredHistory = billingHistory.filter((bh) => {
    if (filterBillingType && bh.billing_type !== filterBillingType) return false;
    if (filterStatus && bh.status !== filterStatus) return false;
    return true;
  });

  const historyPageCount = Math.max(1, Math.ceil(filteredHistory.length / 15));

  // ===== RENDER =====
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Zap className="w-6 h-6 text-emerald-600" /> Auto Billing System
            </h1>
            <p className="text-sm text-slate-500 mt-1">Generate invoices automatically based on fee structures</p>
          </div>
          <div className="flex gap-2">
            <Link href="/admin/auto-billing/history">
              <Button variant="outline" className="border-slate-200">
                <History className="w-4 h-4 mr-2" /> Billing History
              </Button>
            </Link>
            <Link href="/admin/auto-billing/transport">
              <Button variant="outline" className="border-slate-200">
                <Bus className="w-4 h-4 mr-2" /> Transport Billing
              </Button>
            </Link>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid lg:grid-cols-3">
            <TabsTrigger value="dashboard" className="flex items-center gap-1.5"><BarChart3 className="w-4 h-4" /> Dashboard</TabsTrigger>
            <TabsTrigger value="rules" className="flex items-center gap-1.5"><Settings className="w-4 h-4" /> Billing Rules</TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> History</TabsTrigger>
          </TabsList>

          {/* ===== TAB: Dashboard ===== */}
          <TabsContent value="dashboard" className="space-y-6">
            {/* Summary Cards */}
            {loading ? (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => <Card key={i}><CardContent className="p-4"><Skeleton className="h-16" /></CardContent></Card>)}
              </div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border-l-4 border-l-amber-500">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center"><Clock className="w-5 h-5 text-amber-600" /></div>
                      <div>
                        <p className="text-xs text-slate-500 font-medium">Pending Invoices</p>
                        <p className="text-xl font-bold text-slate-900">{summary.pendingInvoices}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-l-4 border-l-emerald-500">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center"><FileText className="w-5 h-5 text-emerald-600" /></div>
                      <div>
                        <p className="text-xs text-slate-500 font-medium">Generated This Month</p>
                        <p className="text-xl font-bold text-slate-900">{summary.generatedThisMonth}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-l-4 border-l-sky-500">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-sky-50 flex items-center justify-center"><DollarSign className="w-5 h-5 text-sky-600" /></div>
                      <div>
                        <p className="text-xs text-slate-500 font-medium">Total Billed</p>
                        <p className="text-xl font-bold text-slate-900">{fmt(summary.totalBilled)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-l-4 border-l-violet-500">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-violet-50 flex items-center justify-center"><TrendingUp className="w-5 h-5 text-violet-600" /></div>
                      <div>
                        <p className="text-xs text-slate-500 font-medium">Collection Rate</p>
                        <p className="text-xl font-bold text-slate-900">{summary.collectionRate.toFixed(1)}%</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Generate Invoices + Configs */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <Card className="lg:col-span-2 border-slate-200/60">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 text-emerald-600" /> Generate Invoices
                  </CardTitle>
                  <CardDescription>Select a fee structure and class to generate invoices for enrolled students</CardDescription>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs font-medium">Fee Structure *</Label>
                      <Select value={formFeeStructureId} onValueChange={setFormFeeStructureId}>
                        <SelectTrigger className="mt-1"><SelectValue placeholder="Select fee structure" /></SelectTrigger>
                        <SelectContent>
                          {configurations.filter(c => c.is_active === 1).map((fs) => (
                            <SelectItem key={fs.fee_structure_id} value={String(fs.fee_structure_id)}>
                              {fs.name} &mdash; {fmt(fs.total_amount)}
                              {fs.class ? ` (${fs.class.name})` : ''}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs font-medium">Class *</Label>
                      <Select value={formClassId} onValueChange={(v) => v === '__none__' ? setFormClassId('') : setFormClassId(v)}>
                        <SelectTrigger className="mt-1"><SelectValue placeholder="Select class" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">All Classes</SelectItem>
                          {classes.map((c) => <SelectItem key={c.class_id} value={String(c.class_id)}>{c.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs font-medium">Academic Year</Label>
                      <Select value={formYear} onValueChange={setFormYear}>
                        <SelectTrigger className="mt-1"><SelectValue placeholder="Select year" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="2025/2026">2025/2026</SelectItem>
                          <SelectItem value="2024/2025">2024/2025</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs font-medium">Term</Label>
                      <Select value={formTerm} onValueChange={setFormTerm}>
                        <SelectTrigger className="mt-1"><SelectValue placeholder="Select term" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Term 1">Term 1</SelectItem>
                          <SelectItem value="Term 2">Term 2</SelectItem>
                          <SelectItem value="Term 3">Term 3</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs font-medium">Due Date</Label>
                      <Input type="date" value={formDueDate} onChange={(e) => setFormDueDate(e.target.value)} className="mt-1" />
                    </div>
                    <div>
                      <Label className="text-xs font-medium">Description (optional)</Label>
                      <Input placeholder="Custom invoice title..." value={formDescription} onChange={(e) => setFormDescription(e.target.value)} className="mt-1" />
                    </div>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <Button variant="outline" onClick={handlePreview} disabled={!formFeeStructureId || !formClassId} className="flex-1 min-h-[44px]">
                      <Eye className="w-4 h-4 mr-2" /> Preview
                    </Button>
                    <Button onClick={() => setConfirmOpen(true)} disabled={!formFeeStructureId || !formClassId} className="flex-1 min-h-[44px] bg-emerald-600 hover:bg-emerald-700">
                      <Zap className="w-4 h-4 mr-2" /> Generate Now
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Active Configs */}
              <Card className="border-slate-200/60">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Settings className="w-4 h-4 text-violet-600" /> Active Configs
                  </CardTitle>
                  <CardDescription className="text-xs">{configurations.filter(c => c.is_active === 1).length} active billing configurations</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="max-h-80 overflow-y-auto">
                    {configurations.filter(c => c.is_active === 1).length === 0 ? (
                      <p className="text-sm text-slate-400 text-center py-8">No active configurations</p>
                    ) : configurations.filter(c => c.is_active === 1).map((fs) => (
                      <div key={fs.fee_structure_id} className="px-4 py-3 border-b border-slate-100 last:border-0 hover:bg-slate-50/50">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{fs.name}</p>
                            <p className="text-xs text-slate-400">{fs.class?.name || 'All'} &middot; {fs.year} &middot; {fs.term}</p>
                            <p className="text-sm font-bold text-emerald-700 mt-0.5">{fmt(fs.total_amount)}</p>
                          </div>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEditStructure(fs)}>
                            <Settings className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Pending/Generated Invoices Table */}
            <Card className="border-slate-200/60">
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Activity className="w-4 h-4 text-amber-600" /> Invoice Overview
                    </CardTitle>
                    <CardDescription>Recent invoices generated through auto-billing</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Select value={filterClass} onValueChange={(v) => v === '__all__' ? setFilterClass('') : setFilterClass(v)}>
                      <SelectTrigger className="h-8 w-[140px] text-xs"><SelectValue placeholder="All Classes" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__all__">All Classes</SelectItem>
                        {classes.map((c) => <SelectItem key={c.class_id} value={String(c.class_id)}>{c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Select value={filterStatus} onValueChange={(v) => v === '__all__' ? setFilterStatus('') : setFilterStatus(v)}>
                      <SelectTrigger className="h-8 w-[120px] text-xs"><SelectValue placeholder="All Status" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__all__">All Status</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="partial">Partial</SelectItem>
                        <SelectItem value="unpaid">Unpaid</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-96 overflow-y-auto">
                  <Table>
                    <TableHeader><TableRow className="bg-slate-50">
                      <TableHead>Invoice</TableHead>
                      <TableHead>Student</TableHead>
                      <TableHead className="hidden sm:table-cell">Class</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="hidden sm:table-cell">Date</TableHead>
                    </TableRow></TableHeader>
                    <TableBody>
                      {loading ? Array.from({ length: 5 }).map((_, i) => <TableRow key={i}><TableCell colSpan={6}><Skeleton className="h-8" /></TableCell></TableRow>)
                        : filteredInvoices.length === 0 ? <TableRow><TableCell colSpan={6} className="text-center py-8 text-sm text-slate-400">No invoices found</TableCell></TableRow>
                        : filteredInvoices.map((inv) => {
                          const sc = statusConfig[inv.status] || statusConfig.unpaid;
                          return (
                            <TableRow key={inv.invoiceId}>
                              <TableCell>
                                <p className="text-sm font-mono">{inv.invoiceCode || `INV-${inv.invoiceId}`}</p>
                                <p className="text-xs text-slate-400 sm:hidden">{inv.className || '\u2014'}</p>
                              </TableCell>
                              <TableCell>
                                <p className="text-sm font-medium">{inv.studentName}</p>
                                <p className="text-xs text-slate-400">{inv.studentCode}</p>
                              </TableCell>
                              <TableCell className="hidden sm:table-cell text-sm text-slate-600">{inv.className || '\u2014'}</TableCell>
                              <TableCell className="text-right text-sm font-mono">{fmt(inv.amount)}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className={sc.className}>{sc.label}</Badge>
                              </TableCell>
                              <TableCell className="hidden sm:table-cell text-xs text-slate-400">{fmtDate(inv.createdAt)}</TableCell>
                            </TableRow>
                          );
                        })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ===== TAB: Billing Rules ===== */}
          <TabsContent value="rules" className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Settings className="w-4 h-4 text-violet-600" /> Billing Configurations
                </CardTitle>
                <CardDescription>Manage fee structures that drive auto-billing. Toggle active/inactive, edit details.</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-[500px] overflow-y-auto">
                  <Table>
                    <TableHeader><TableRow className="bg-slate-50">
                      <TableHead>Name</TableHead>
                      <TableHead className="hidden sm:table-cell">Class</TableHead>
                      <TableHead className="hidden md:table-cell">Year/Term</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="hidden sm:table-cell">Installments</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow></TableHeader>
                    <TableBody>
                      {loading ? Array.from({ length: 4 }).map((_, i) => <TableRow key={i}><TableCell colSpan={7}><Skeleton className="h-8" /></TableCell></TableRow>)
                        : configurations.length === 0 ? <TableRow><TableCell colSpan={7} className="text-center py-8 text-sm text-slate-400">No billing configurations found</TableCell></TableRow>
                        : configurations.map((fs) => (
                          <TableRow key={fs.fee_structure_id} className={fs.is_active !== 1 ? 'opacity-50' : ''}>
                            <TableCell><p className="text-sm font-medium">{fs.name}</p><p className="text-xs text-slate-400">{fs.description || ''}</p></TableCell>
                            <TableCell className="hidden sm:table-cell text-sm">{fs.class?.name || 'All'}</TableCell>
                            <TableCell className="hidden md:table-cell text-xs text-slate-500">{fs.year} &middot; {fs.term}</TableCell>
                            <TableCell className="text-right text-sm font-mono font-medium">{fmt(fs.total_amount)}</TableCell>
                            <TableCell className="hidden sm:table-cell text-sm text-center">{fs.installment_count}</TableCell>
                            <TableCell>
                              <button onClick={() => handleToggleActive(fs)} className="focus:outline-none">
                                {fs.is_active === 1 ? (
                                  <ToggleRight className="w-6 h-6 text-emerald-600" />
                                ) : (
                                  <ToggleLeft className="w-6 h-6 text-slate-300" />
                                )}
                              </button>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditStructure(fs)}>
                                <Settings className="w-3.5 h-3.5" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ===== TAB: History ===== */}
          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-600" /> Recent Billing Activity
                    </CardTitle>
                    <CardDescription>All billing runs and auto-generated invoice records</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Select value={filterBillingType} onValueChange={(v) => v === '__all__' ? setFilterBillingType('') : setFilterBillingType(v)}>
                      <SelectTrigger className="h-8 w-[140px] text-xs"><SelectValue placeholder="All Types" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__all__">All Types</SelectItem>
                        <SelectItem value="auto">Auto</SelectItem>
                        <SelectItem value="manual">Manual</SelectItem>
                        <SelectItem value="transport">Transport</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={filterStatus} onValueChange={(v) => v === '__all__' ? setFilterStatus('') : setFilterStatus(v)}>
                      <SelectTrigger className="h-8 w-[120px] text-xs"><SelectValue placeholder="All Status" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__all__">All Status</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="failed">Failed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-[500px] overflow-y-auto">
                  <Table>
                    <TableHeader><TableRow className="bg-slate-50">
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Student</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow></TableHeader>
                    <TableBody>
                      {loading ? Array.from({ length: 6 }).map((_, i) => <TableRow key={i}><TableCell colSpan={6}><Skeleton className="h-8" /></TableCell></TableRow>)
                        : filteredHistory.length === 0 ? <TableRow><TableCell colSpan={6} className="text-center py-8 text-sm text-slate-400">No billing history found</TableCell></TableRow>
                        : filteredHistory
                          .slice((historyPage - 1) * 15, historyPage * 15)
                          .map((bh) => {
                          const sc = statusConfig[bh.status] || statusConfig.pending;
                          return (
                            <TableRow key={bh.billing_history_id}>
                              <TableCell className="text-xs text-slate-500">{fmtDateTime(bh.billing_date)}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className={
                                  bh.billing_type === 'auto' ? 'bg-sky-50 text-sky-700' :
                                  bh.billing_type === 'transport' ? 'bg-orange-50 text-orange-700' :
                                  'bg-slate-50 text-slate-600'
                                }>{bh.billing_type}</Badge>
                              </TableCell>
                              <TableCell className="text-sm">{bh.student?.name || 'N/A'}</TableCell>
                              <TableCell className="text-right text-sm font-mono">{fmt(bh.amount)}</TableCell>
                              <TableCell className="text-xs text-slate-400 font-mono max-w-[120px] truncate">{bh.reference || '\u2014'}</TableCell>
                              <TableCell><Badge variant="outline" className={sc.className}>{sc.label}</Badge></TableCell>
                            </TableRow>
                          );
                        })}
                    </TableBody>
                  </Table>
                </div>
                {historyPageCount > 1 && (
                  <div className="flex items-center justify-between px-4 py-3 border-t">
                    <p className="text-xs text-slate-500">{filteredHistory.length} record(s)</p>
                    <div className="flex items-center gap-1">
                      <Button variant="outline" size="icon" className="h-8 w-8" disabled={historyPage <= 1} onClick={() => setHistoryPage(historyPage - 1)}><ChevronLeft className="w-4 h-4" /></Button>
                      <span className="text-sm px-2">{historyPage}/{historyPageCount}</span>
                      <Button variant="outline" size="icon" className="h-8 w-8" disabled={historyPage >= historyPageCount} onClick={() => setHistoryPage(historyPage + 1)}><ChevronRight className="w-4 h-4" /></Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Preview Dialog */}
        <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Invoice Preview</DialogTitle>
              <DialogDescription>Review invoices before generating</DialogDescription>
            </DialogHeader>
            {previewLoading ? (
              <div className="space-y-3 py-4">
                <Skeleton className="h-6 w-1/2" />
                <Skeleton className="h-32" />
                <Skeleton className="h-32" />
              </div>
            ) : (
              <div className="space-y-4 py-2">
                <div className="flex items-center justify-between bg-sky-50 rounded-lg p-3">
                  <span className="text-sm font-medium text-sky-700">{previewItems.length} invoice(s)</span>
                  <span className="text-lg font-bold text-sky-700">Total: {fmt(previewTotal)}</span>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  <Table>
                    <TableHeader><TableRow className="bg-slate-50">
                      <TableHead>#</TableHead>
                      <TableHead>Student</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow></TableHeader>
                    <TableBody>
                      {previewItems.map((item, i) => (
                        <TableRow key={i}>
                          <TableCell className="text-xs text-slate-400">{i + 1}</TableCell>
                          <TableCell><p className="text-sm font-medium">{item.name}</p><p className="text-xs text-slate-400">{item.studentCode}</p></TableCell>
                          <TableCell className="text-sm text-slate-600">{item.className || '\u2014'}</TableCell>
                          <TableCell className="text-right text-sm font-mono">{fmt(item.amount)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setPreviewOpen(false)}>Cancel</Button>
              <Button onClick={() => { setPreviewOpen(false); setConfirmOpen(true); }} className="bg-emerald-600 hover:bg-emerald-700">
                <Zap className="w-4 h-4 mr-2" /> Confirm &amp; Generate
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Confirm Dialog */}
        <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Generate Invoices Now?</AlertDialogTitle>
              <AlertDialogDescription>
                This will create {previewItems.length || 'bulk'} invoice(s) for the selected class and fee structure.
                Students with existing pending invoices for the same period will be skipped.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={generating}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleGenerate} disabled={generating} className="bg-emerald-600 hover:bg-emerald-700">
                {generating ? 'Generating...' : 'Yes, Generate'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Settings Dialog */}
        <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Edit Billing Configuration</DialogTitle>
              <DialogDescription>Update fee structure settings</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div>
                <Label className="text-xs font-medium">Name</Label>
                <Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="mt-1" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-medium">Total Amount (GHS)</Label>
                  <Input type="number" step="0.01" value={editForm.totalAmount} onChange={(e) => setEditForm({ ...editForm, totalAmount: e.target.value })} className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs font-medium">Installments</Label>
                  <Input type="number" value={editForm.installmentCount} onChange={(e) => setEditForm({ ...editForm, installmentCount: e.target.value })} className="mt-1" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-medium">Academic Year</Label>
                  <Select value={editForm.year} onValueChange={(v) => setEditForm({ ...editForm, year: v })}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      <SelectItem value="2025/2026">2025/2026</SelectItem>
                      <SelectItem value="2024/2025">2024/2025</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs font-medium">Term</Label>
                  <Select value={editForm.term} onValueChange={(v) => setEditForm({ ...editForm, term: v })}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      <SelectItem value="Term 1">Term 1</SelectItem>
                      <SelectItem value="Term 2">Term 2</SelectItem>
                      <SelectItem value="Term 3">Term 3</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label className="text-xs font-medium">Description</Label>
                <Textarea value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} className="mt-1" rows={2} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSettingsOpen(false)}>Cancel</Button>
              <Button onClick={handleSaveSettings} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
