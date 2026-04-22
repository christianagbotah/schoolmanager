'use client';

import { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  Plus, Search, Wallet, TrendingUp, TrendingDown, BarChart3,
  Pencil, Trash2, Eye, FileDown, ChevronDown, ChevronRight,
  DollarSign, PieChart, ArrowUpRight, ArrowDownRight, X, Filter,
  AlertTriangle, CheckCircle2, Clock, Layers,
} from 'lucide-react';

interface BudgetLine {
  budget_line_id: number;
  budget_id: number;
  account_id: number | null;
  category: string;
  description: string;
  budgeted_amount: number;
  actual_amount: number;
  variance: number;
  chart_of_accounts?: {
    account_id: number;
    account_code: string;
    account_name: string;
    account_type: string;
  } | null;
}

interface Budget {
  budget_id: number;
  name: string;
  fiscal_year_id: number | null;
  department_id: number | null;
  total_amount: number;
  status: string;
  description: string;
  created_by: string;
  lines?: BudgetLine[];
  fiscal_years?: { fiscal_year_id: number; name: string } | null;
  department?: { id: number; dep_name: string } | null;
  _lineCount: number;
  _totalBudgeted: number;
  _totalActual: number;
  _remaining: number;
  _utilizationPercent: number;
}

interface FiscalYear {
  fiscal_year_id: number;
  name: string;
  status: string;
}

interface Department {
  id: number;
  dep_name: string;
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  draft: { label: 'Draft', color: 'bg-slate-100 text-slate-600 border-slate-200', icon: <Clock className="w-3 h-3" /> },
  active: { label: 'Active', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: <CheckCircle2 className="w-3 h-3" /> },
  approved: { label: 'Approved', color: 'bg-sky-100 text-sky-700 border-sky-200', icon: <CheckCircle2 className="w-3 h-3" /> },
  closed: { label: 'Closed', color: 'bg-slate-100 text-slate-500 border-slate-200', icon: <Layers className="w-3 h-3" /> },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-600 border-red-200', icon: <X className="w-3 h-3" /> },
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-UG', { style: 'currency', currency: 'UGX', minimumFractionDigits: 0 }).format(amount);
}

function getUtilColor(pct: number) {
  if (pct >= 90) return 'text-red-600';
  if (pct >= 70) return 'text-amber-600';
  return 'text-emerald-600';
}

function getProgressColor(pct: number) {
  if (pct >= 90) return '[&>div]:bg-red-500';
  if (pct >= 70) return '[&>div]:bg-amber-500';
  return '[&>div]:bg-emerald-500';
}

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [fiscalYears, setFiscalYears] = useState<FiscalYear[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterFiscalYear, setFilterFiscalYear] = useState('');
  const [summary, setSummary] = useState({ totalBudgets: 0, totalAmount: 0, totalBudgeted: 0, totalActual: 0, totalRemaining: 0 });

  // Budget dialog
  const [budgetDialogOpen, setBudgetDialogOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [budgetForm, setBudgetForm] = useState({ name: '', fiscalYearId: '', departmentId: '', totalAmount: '', status: 'draft', description: '' });
  const [budgetLinesForm, setBudgetLinesForm] = useState<Array<{ accountId: string; category: string; description: string; budgetedAmount: string }>>([{ accountId: '', category: '', description: '', budgetedAmount: '' }]);
  const [saving, setSaving] = useState(false);

  // Detail view
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);
  const [detailLines, setDetailLines] = useState<BudgetLine[]>([]);
  const [detailSummary, setDetailSummary] = useState({ totalBudgeted: 0, totalActual: 0, totalVariance: 0, lineCount: 0, utilizationPercent: 0 });
  const [detailLoading, setDetailLoading] = useState(false);

  // Line dialog
  const [lineDialogOpen, setLineDialogOpen] = useState(false);
  const [editingLine, setEditingLine] = useState<BudgetLine | null>(null);
  const [lineForm, setLineForm] = useState({ accountId: '', category: '', description: '', budgetedAmount: '', actualAmount: '' });
  const [savingLine, setSavingLine] = useState(false);

  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  const fetchBudgets = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterStatus) params.set('status', filterStatus);
      if (filterFiscalYear) params.set('fiscalYearId', filterFiscalYear);

      const res = await fetch(`/api/admin/accounts/budgets?${params}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setBudgets(data.budgets || []);
      setSummary(data.summary || { totalBudgets: 0, totalAmount: 0, totalBudgeted: 0, totalActual: 0, totalRemaining: 0 });
    } catch {
      toast.error('Failed to load budgets');
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterFiscalYear]);

  const fetchFiscalYears = async () => {
    try {
      const res = await fetch('/api/admin/accounts/fiscal-years');
      const data = await res.json();
      setFiscalYears((data.fiscalYears || []).map((fy: FiscalYear) => ({ fiscal_year_id: fy.fiscal_year_id, name: fy.name, status: fy.status })));
    } catch { /* silent */ }
  };

  const fetchDepartments = async () => {
    try {
      const res = await fetch('/api/admin/departments');
      const data = await res.json();
      setDepartments(data.departments || []);
    } catch { /* silent */ }
  };

  useEffect(() => { fetchBudgets(); fetchFiscalYears(); fetchDepartments(); }, [fetchBudgets]);

  const filteredBudgets = budgets.filter((b) =>
    !search || b.name.toLowerCase().includes(search.toLowerCase()) || (b.description || '').toLowerCase().includes(search.toLowerCase())
  );

  // Budget CRUD
  const resetBudgetForm = () => {
    setBudgetForm({ name: '', fiscalYearId: '', departmentId: '', totalAmount: '', status: 'draft', description: '' });
    setBudgetLinesForm([{ accountId: '', category: '', description: '', budgetedAmount: '' }]);
    setEditingBudget(null);
  };

  const openCreateBudget = () => { resetBudgetForm(); setBudgetDialogOpen(true); };

  const openEditBudget = (b: Budget) => {
    setEditingBudget(b);
    setBudgetForm({
      name: b.name,
      fiscalYearId: b.fiscal_year_id ? String(b.fiscal_year_id) : '',
      departmentId: b.department_id ? String(b.department_id) : '',
      totalAmount: String(b.total_amount),
      status: b.status,
      description: b.description || '',
    });
    if (b.lines && b.lines.length > 0) {
      setBudgetLinesForm(b.lines.map((l) => ({
        accountId: l.account_id ? String(l.account_id) : '',
        category: l.category,
        description: l.description,
        budgetedAmount: String(l.budgeted_amount),
      })));
    } else {
      setBudgetLinesForm([{ accountId: '', category: '', description: '', budgetedAmount: '' }]);
    }
    setBudgetDialogOpen(true);
  };

  const handleSaveBudget = async () => {
    if (!budgetForm.name.trim()) { toast.error('Budget name is required'); return; }
    setSaving(true);
    try {
      if (editingBudget) {
        const res = await fetch('/api/admin/accounts/budgets', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            budgetId: editingBudget.budget_id,
            name: budgetForm.name,
            fiscalYearId: budgetForm.fiscalYearId || null,
            departmentId: budgetForm.departmentId || null,
            totalAmount: budgetForm.totalAmount || 0,
            status: budgetForm.status,
            description: budgetForm.description,
          }),
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        toast.success('Budget updated');
      } else {
        const res = await fetch('/api/admin/accounts/budgets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: budgetForm.name,
            fiscalYearId: budgetForm.fiscalYearId || null,
            departmentId: budgetForm.departmentId || null,
            totalAmount: budgetForm.totalAmount || 0,
            status: budgetForm.status,
            description: budgetForm.description,
            lines: budgetLinesForm.filter((l) => l.description.trim() || l.budgetedAmount),
          }),
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        toast.success('Budget created');
      }
      setBudgetDialogOpen(false);
      resetBudgetForm();
      fetchBudgets();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save budget');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBudget = async (id: number) => {
    try {
      const res = await fetch(`/api/admin/accounts/budgets?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast.success('Budget cancelled');
      fetchBudgets();
    } catch (err: any) {
      toast.error(err.message || 'Failed to cancel budget');
    }
  };

  // Detail view
  const openDetail = async (b: Budget) => {
    setSelectedBudget(b);
    setDetailOpen(true);
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/admin/accounts/budgets/${b.budget_id}/lines`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setDetailLines(data.lines || []);
      setDetailSummary(data.summary || { totalBudgeted: 0, totalActual: 0, totalVariance: 0, lineCount: 0, utilizationPercent: 0 });
    } catch (err: any) {
      toast.error(err.message || 'Failed to load budget details');
    } finally {
      setDetailLoading(false);
    }
  };

  // Line CRUD
  const openAddLine = () => {
    setEditingLine(null);
    setLineForm({ accountId: '', category: '', description: '', budgetedAmount: '', actualAmount: '' });
    setLineDialogOpen(true);
  };

  const openEditLine = (line: BudgetLine) => {
    setEditingLine(line);
    setLineForm({
      accountId: line.account_id ? String(line.account_id) : '',
      category: line.category,
      description: line.description,
      budgetedAmount: String(line.budgeted_amount),
      actualAmount: String(line.actual_amount),
    });
    setLineDialogOpen(true);
  };

  const handleSaveLine = async () => {
    if (!lineForm.description.trim() && !lineForm.budgetedAmount) { toast.error('Line description or amount is required'); return; }
    if (!selectedBudget) return;
    setSavingLine(true);
    try {
      if (editingLine) {
        const res = await fetch(`/api/admin/accounts/budgets/${selectedBudget.budget_id}/lines`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            budgetLineId: editingLine.budget_line_id,
            accountId: lineForm.accountId || null,
            category: lineForm.category,
            description: lineForm.description,
            budgetedAmount: lineForm.budgetedAmount,
            actualAmount: lineForm.actualAmount,
          }),
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        toast.success('Line updated');
      } else {
        const res = await fetch(`/api/admin/accounts/budgets/${selectedBudget.budget_id}/lines`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            accountId: lineForm.accountId || null,
            category: lineForm.category,
            description: lineForm.description,
            budgetedAmount: lineForm.budgetedAmount,
          }),
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        toast.success('Line added');
      }
      setLineDialogOpen(false);
      openDetail(selectedBudget);
    } catch (err: any) {
      toast.error(err.message || 'Failed to save line');
    } finally {
      setSavingLine(false);
    }
  };

  const handleDeleteLine = async (lineId: number) => {
    if (!selectedBudget) return;
    try {
      const res = await fetch(`/api/admin/accounts/budgets/${selectedBudget.budget_id}/lines?lineId=${lineId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast.success('Line deleted');
      openDetail(selectedBudget);
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete line');
    }
  };

  const toggleExpand = (id: number) => {
    const next = new Set(expandedRows);
    if (next.has(id)) next.delete(id); else next.add(id);
    setExpandedRows(next);
  };

  const handleExportCSV = () => {
    const headers = ['Budget', 'Fiscal Year', 'Status', 'Budgeted', 'Actual', 'Remaining', 'Utilization %'];
    const rows = filteredBudgets.map((b) => [
      b.name,
      b.fiscal_years?.name || '—',
      b.status,
      b._totalBudgeted,
      b._totalActual,
      b._remaining,
      b._utilizationPercent + '%',
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `budgets-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exported');
  };

  const addBudgetLineRow = () => {
    setBudgetLinesForm([...budgetLinesForm, { accountId: '', category: '', description: '', budgetedAmount: '' }]);
  };

  const removeBudgetLineRow = (idx: number) => {
    setBudgetLinesForm(budgetLinesForm.filter((_, i) => i !== idx));
  };

  const updateBudgetLineField = (idx: number, field: string, value: string) => {
    const updated = [...budgetLinesForm];
    (updated[idx] as Record<string, string>)[field] = value;
    setBudgetLinesForm(updated);
  };

  const getStatusBadge = (status: string) => {
    const config = statusConfig[status] || statusConfig.draft;
    return (
      <Badge variant="outline" className={`gap-1 text-xs ${config.color}`}>
        {config.icon}
        {config.label}
      </Badge>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Budget Management</h1>
            <p className="text-sm text-slate-500 mt-1">Create and manage budgets with line-item tracking</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExportCSV} className="border-slate-200">
              <FileDown className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button onClick={openCreateBudget} className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="w-4 h-4 mr-2" />
              New Budget
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="border-emerald-100">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                  <Wallet className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-slate-500 font-medium truncate">Total Budgets</p>
                  <p className="text-lg font-bold text-slate-900">{summary.totalBudgets}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-violet-100">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-violet-100 flex items-center justify-center shrink-0">
                  <BarChart3 className="w-4 h-4 text-violet-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-slate-500 font-medium truncate">Total Budgeted</p>
                  <p className="text-sm font-bold text-violet-700 truncate">{formatCurrency(summary.totalBudgeted)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-amber-100">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                  <TrendingUp className="w-4 h-4 text-amber-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-slate-500 font-medium truncate">Spent</p>
                  <p className="text-sm font-bold text-amber-700 truncate">{formatCurrency(summary.totalActual)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-sky-100">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-sky-100 flex items-center justify-center shrink-0">
                  <DollarSign className="w-4 h-4 text-sky-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-slate-500 font-medium truncate">Remaining</p>
                  <p className="text-sm font-bold text-sky-700 truncate">{formatCurrency(summary.totalRemaining)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-emerald-100 col-span-2 lg:col-span-1">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                  <PieChart className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-slate-500 font-medium truncate">Avg Utilization</p>
                  <p className="text-lg font-bold text-slate-900">
                    {summary.totalBudgeted > 0 ? Math.round((summary.totalActual / summary.totalBudgeted) * 100) : 0}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input placeholder="Search budgets..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
              </div>
              <Select value={filterStatus} onValueChange={(v) => v === '__all__' ? setFilterStatus('') : setFilterStatus(v)}>
                <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All Status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterFiscalYear} onValueChange={(v) => v === '__all__' ? setFilterFiscalYear('') : setFilterFiscalYear(v)}>
                <SelectTrigger className="w-full sm:w-48"><SelectValue placeholder="Fiscal Year" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All Years</SelectItem>
                  {fiscalYears.map((fy) => (
                    <SelectItem key={fy.fiscal_year_id} value={String(fy.fiscal_year_id)}>{fy.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Budgets Table */}
        <Card>
          <CardContent className="p-0">
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="w-10" />
                    <TableHead className="text-xs font-semibold">Budget</TableHead>
                    <TableHead className="text-xs font-semibold">Fiscal Year</TableHead>
                    <TableHead className="text-xs font-semibold">Status</TableHead>
                    <TableHead className="text-xs font-semibold text-right">Budgeted</TableHead>
                    <TableHead className="text-xs font-semibold text-right">Actual</TableHead>
                    <TableHead className="text-xs font-semibold">Utilization</TableHead>
                    <TableHead className="text-xs font-semibold text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>{Array.from({ length: 8 }).map((_, j) => (<TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>))}</TableRow>
                    ))
                  ) : filteredBudgets.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-12 text-slate-400">
                        <Wallet className="w-10 h-10 mx-auto mb-2 opacity-50" />
                        <p>No budgets found</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredBudgets.map((b) => (
                      <>
                        <TableRow key={b.budget_id} className="hover:bg-slate-50/50">
                          <TableCell className="w-10 cursor-pointer" onClick={() => toggleExpand(b.budget_id)}>
                            {expandedRows.has(b.budget_id) ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                          </TableCell>
                          <TableCell>
                            <p className="font-medium text-sm">{b.name}</p>
                            <p className="text-xs text-slate-400 truncate max-w-48">{b.department?.dep_name || ''}</p>
                          </TableCell>
                          <TableCell className="text-xs text-slate-500">{b.fiscal_years?.name || '—'}</TableCell>
                          <TableCell>{getStatusBadge(b.status)}</TableCell>
                          <TableCell className="text-right font-mono text-sm">{formatCurrency(b._totalBudgeted)}</TableCell>
                          <TableCell className="text-right font-mono text-sm text-amber-600">{formatCurrency(b._totalActual)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2 min-w-32">
                              <Progress value={Math.min(b._utilizationPercent, 100)} className={`h-2 flex-1 ${getProgressColor(b._utilizationPercent)}`} />
                              <span className={`text-xs font-medium ${getUtilColor(b._utilizationPercent)}`}>{b._utilizationPercent}%</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openDetail(b)} title="View Details">
                                <Eye className="w-3.5 h-3.5" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditBudget(b)} title="Edit">
                                <Pencil className="w-3.5 h-3.5" />
                              </Button>
                              {b.status !== 'cancelled' && b.status !== 'closed' && (
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600" onClick={() => handleDeleteBudget(b.budget_id)} title="Cancel">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                        {expandedRows.has(b.budget_id) && b.lines && b.lines.length > 0 && (
                          <TableRow key={`${b.budget_id}-lines`}>
                            <TableCell colSpan={8} className="bg-slate-50/50 px-12 py-4">
                              <div className="space-y-2">
                                <h4 className="text-xs font-semibold text-slate-500 mb-2">Budget Lines ({b.lines.length})</h4>
                                {b.lines.map((line) => (
                                  <div key={line.budget_line_id} className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border">
                                    <div className="flex items-center gap-3 min-w-0">
                                      {line.chart_of_accounts && (
                                        <Badge variant="outline" className="text-xs shrink-0">{line.chart_of_accounts.account_code}</Badge>
                                      )}
                                      <span className="text-sm truncate">{line.description || line.category || 'Unnamed'}</span>
                                    </div>
                                    <div className="flex items-center gap-4 shrink-0 ml-4">
                                      <span className="text-xs font-mono text-slate-500">{formatCurrency(line.budgeted_amount)}</span>
                                      <span className="text-xs font-mono text-amber-600">{formatCurrency(line.actual_amount)}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </>
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
              ) : filteredBudgets.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <Wallet className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p>No budgets found</p>
                </div>
              ) : (
                filteredBudgets.map((b) => (
                  <div key={b.budget_id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <p className="font-medium text-sm">{b.name}</p>
                      {getStatusBadge(b.status)}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-slate-50 rounded-lg p-2">
                        <p className="text-slate-500">Budgeted</p>
                        <p className="font-mono font-bold">{formatCurrency(b._totalBudgeted)}</p>
                      </div>
                      <div className="bg-slate-50 rounded-lg p-2">
                        <p className="text-slate-500">Actual</p>
                        <p className="font-mono font-bold text-amber-600">{formatCurrency(b._totalActual)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress value={Math.min(b._utilizationPercent, 100)} className={`h-2 flex-1 ${getProgressColor(b._utilizationPercent)}`} />
                      <span className={`text-xs font-medium ${getUtilColor(b._utilizationPercent)}`}>{b._utilizationPercent}%</span>
                    </div>
                    <div className="flex gap-2 pt-1">
                      <Button variant="outline" size="sm" className="flex-1 h-8 text-xs" onClick={() => openDetail(b)}><Eye className="w-3 h-3 mr-1" />Details</Button>
                      <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => openEditBudget(b)}><Pencil className="w-3 h-3" /></Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create/Edit Budget Dialog */}
      <Dialog open={budgetDialogOpen} onOpenChange={(open) => { if (!open) resetBudgetForm(); setBudgetDialogOpen(open); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wallet className="w-5 h-5 text-emerald-600" />
              {editingBudget ? 'Edit Budget' : 'Create Budget'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label className="text-xs mb-1.5 block">Budget Name *</Label>
                <Input placeholder="e.g. Operations Budget 2025" value={budgetForm.name} onChange={(e) => setBudgetForm({ ...budgetForm, name: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs mb-1.5 block">Fiscal Year</Label>
                <Select value={budgetForm.fiscalYearId} onValueChange={(v) => setBudgetForm({ ...budgetForm, fiscalYearId: v })}>
                  <SelectTrigger><SelectValue placeholder="Select year" /></SelectTrigger>
                  <SelectContent>
                    {fiscalYears.map((fy) => (
                      <SelectItem key={fy.fiscal_year_id} value={String(fy.fiscal_year_id)}>{fy.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs mb-1.5 block">Department</Label>
                <Select value={budgetForm.departmentId} onValueChange={(v) => setBudgetForm({ ...budgetForm, departmentId: v })}>
                  <SelectTrigger><SelectValue placeholder="Select dept" /></SelectTrigger>
                  <SelectContent>
                    {departments.map((d) => (
                      <SelectItem key={d.id} value={String(d.id)}>{d.dep_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs mb-1.5 block">Total Amount</Label>
                <Input type="number" placeholder="0" value={budgetForm.totalAmount} onChange={(e) => setBudgetForm({ ...budgetForm, totalAmount: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs mb-1.5 block">Status</Label>
                <Select value={budgetForm.status} onValueChange={(v) => setBudgetForm({ ...budgetForm, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <Label className="text-xs mb-1.5 block">Description</Label>
                <Textarea placeholder="Optional description..." value={budgetForm.description} onChange={(e) => setBudgetForm({ ...budgetForm, description: e.target.value })} rows={2} />
              </div>
            </div>

            {/* Budget Lines (create only) */}
            {!editingBudget && (
              <div className="space-y-3 border-t pt-4">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold text-slate-700 flex items-center gap-2">
                    <Layers className="w-3.5 h-3.5" />
                    Budget Lines (optional)
                  </Label>
                  <Button variant="outline" size="sm" className="h-7 text-xs" onClick={addBudgetLineRow}>
                    <Plus className="w-3 h-3 mr-1" />Add Line
                  </Button>
                </div>
                {budgetLinesForm.map((line, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 items-end">
                    <div className="col-span-3">
                      {idx === 0 && <Label className="text-xs mb-1 block">Category</Label>}
                      <Input placeholder="e.g. Salaries" value={line.category} onChange={(e) => updateBudgetLineField(idx, 'category', e.target.value)} />
                    </div>
                    <div className="col-span-4">
                      {idx === 0 && <Label className="text-xs mb-1 block">Description</Label>}
                      <Input placeholder="Line item description" value={line.description} onChange={(e) => updateBudgetLineField(idx, 'description', e.target.value)} />
                    </div>
                    <div className="col-span-4">
                      {idx === 0 && <Label className="text-xs mb-1 block">Amount</Label>}
                      <Input type="number" placeholder="0" value={line.budgetedAmount} onChange={(e) => updateBudgetLineField(idx, 'budgetedAmount', e.target.value)} />
                    </div>
                    <div className="col-span-1">
                      <Button variant="ghost" size="icon" className="h-9 w-9 text-red-400 hover:text-red-600" onClick={() => removeBudgetLineRow(idx)} disabled={budgetLinesForm.length === 1}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { resetBudgetForm(); setBudgetDialogOpen(false); }}>Cancel</Button>
            <Button onClick={handleSaveBudget} disabled={saving || !budgetForm.name.trim()} className="bg-emerald-600 hover:bg-emerald-700">
              {saving ? 'Saving...' : editingBudget ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Budget Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wallet className="w-5 h-5 text-emerald-600" />
              {selectedBudget?.name}
              {getStatusBadge(selectedBudget?.status || 'draft')}
            </DialogTitle>
          </DialogHeader>
          {selectedBudget && (
            <div className="space-y-4">
              {/* Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-xs text-slate-500">Budgeted</p>
                  <p className="font-mono font-bold text-violet-700">{formatCurrency(detailSummary.totalBudgeted)}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-xs text-slate-500">Actual</p>
                  <p className="font-mono font-bold text-amber-700">{formatCurrency(detailSummary.totalActual)}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-xs text-slate-500">Variance</p>
                  <p className={`font-mono font-bold ${detailSummary.totalVariance >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                    {formatCurrency(detailSummary.totalVariance)}
                  </p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-xs text-slate-500">Utilization</p>
                  <p className={`font-bold ${getUtilColor(detailSummary.utilizationPercent)}`}>{detailSummary.utilizationPercent}%</p>
                  <Progress value={Math.min(detailSummary.utilizationPercent, 100)} className={`h-2 mt-1 ${getProgressColor(detailSummary.utilizationPercent)}`} />
                </div>
              </div>

              {/* Add Line Button */}
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-slate-700">Budget Lines ({detailLines.length})</h4>
                <Button size="sm" className="h-8 text-xs bg-violet-600 hover:bg-violet-700" onClick={openAddLine}>
                  <Plus className="w-3 h-3 mr-1" />Add Line
                </Button>
              </div>

              {/* Lines Table */}
              {detailLoading ? (
                <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
              ) : detailLines.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <Layers className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No budget lines yet</p>
                </div>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50">
                        <TableHead className="text-xs">Account</TableHead>
                        <TableHead className="text-xs">Category</TableHead>
                        <TableHead className="text-xs">Description</TableHead>
                        <TableHead className="text-xs text-right">Budgeted</TableHead>
                        <TableHead className="text-xs text-right">Actual</TableHead>
                        <TableHead className="text-xs text-right">Variance</TableHead>
                        <TableHead className="text-xs text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {detailLines.map((line) => (
                        <TableRow key={line.budget_line_id} className="hover:bg-slate-50/50">
                          <TableCell className="text-xs font-mono text-slate-500">{line.chart_of_accounts?.account_code || '—'}</TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="text-xs">{line.category || '—'}</Badge>
                          </TableCell>
                          <TableCell className="text-sm">{line.description || '—'}</TableCell>
                          <TableCell className="text-right font-mono text-sm">{formatCurrency(line.budgeted_amount)}</TableCell>
                          <TableCell className="text-right font-mono text-sm text-amber-600">{formatCurrency(line.actual_amount)}</TableCell>
                          <TableCell className="text-right font-mono text-sm">
                            <span className={line.variance >= 0 ? 'text-emerald-600' : 'text-red-600'}>
                              {line.variance >= 0 ? '+' : ''}{formatCurrency(line.variance)}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditLine(line)} title="Edit">
                                <Pencil className="w-3 h-3" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={() => handleDeleteLine(line.budget_line_id)} title="Delete">
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Line Dialog */}
      <Dialog open={lineDialogOpen} onOpenChange={setLineDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-violet-600" />
              {editingLine ? 'Edit Budget Line' : 'Add Budget Line'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs mb-1.5 block">Category</Label>
              <Input placeholder="e.g. Salaries, Utilities" value={lineForm.category} onChange={(e) => setLineForm({ ...lineForm, category: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs mb-1.5 block">Description *</Label>
              <Input placeholder="Line item description" value={lineForm.description} onChange={(e) => setLineForm({ ...lineForm, description: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs mb-1.5 block">Budgeted Amount</Label>
                <Input type="number" placeholder="0" value={lineForm.budgetedAmount} onChange={(e) => setLineForm({ ...lineForm, budgetedAmount: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs mb-1.5 block">Actual Amount</Label>
                <Input type="number" placeholder="0" value={lineForm.actualAmount} onChange={(e) => setLineForm({ ...lineForm, actualAmount: e.target.value })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLineDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveLine} disabled={savingLine || !lineForm.description.trim()} className="bg-violet-600 hover:bg-violet-700">
              {savingLine ? 'Saving...' : editingLine ? 'Update' : 'Add'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
