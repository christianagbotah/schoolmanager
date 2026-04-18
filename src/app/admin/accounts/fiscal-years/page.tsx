'use client';

import { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
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
import { toast } from 'sonner';
import {
  Plus, Calendar, DollarSign, BarChart3, Pencil, Trash2,
  ChevronDown, ChevronRight, X, CheckCircle2, Clock, Lock,
  TrendingUp, Layers, Copy,
} from 'lucide-react';

interface FiscalPeriod {
  fiscal_period_id: number;
  fiscal_year_id: number;
  name: string;
  period_number: number;
  start_date: string | null;
  end_date: string | null;
  is_closed: number;
}

interface FiscalYear {
  fiscal_year_id: number;
  name: string;
  start_date: string | null;
  end_date: string | null;
  is_active: number;
  status: string;
  periods: FiscalPeriod[];
  _periodCount: number;
  _budgetCount: number;
  _totalBudgeted: number;
  _totalActual: number;
  _totalVariance: number;
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  active: { label: 'Active', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: <CheckCircle2 className="w-3 h-3" /> },
  draft: { label: 'Draft', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: <Clock className="w-3 h-3" /> },
  closed: { label: 'Closed', color: 'bg-slate-100 text-slate-500 border-slate-200', icon: <Lock className="w-3 h-3" /> },
  planning: { label: 'Planning', color: 'bg-violet-100 text-violet-700 border-violet-200', icon: <Layers className="w-3 h-3" /> },
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-UG', { style: 'currency', currency: 'UGX', minimumFractionDigits: 0 }).format(amount);
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function FiscalYearsPage() {
  const [fiscalYears, setFiscalYears] = useState<FiscalYear[]>([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({ totalFiscalYears: 0, activeCount: 0, totalBudgeted: 0, totalActual: 0 });

  // Dialog states
  const [fyDialogOpen, setFyDialogOpen] = useState(false);
  const [editingFY, setEditingFY] = useState<FiscalYear | null>(null);
  const [fyForm, setFyForm] = useState({ name: '', startDate: '', endDate: '', isActive: true });
  const [periods, setPeriods] = useState([{ name: '', periodNumber: 1, startDate: '', endDate: '', isClosed: false }]);
  const [saving, setSaving] = useState(false);

  // Period dialog states
  const [periodDialogOpen, setPeriodDialogOpen] = useState(false);
  const [selectedFY, setSelectedFY] = useState<FiscalYear | null>(null);
  const [periodForm, setPeriodForm] = useState({ name: '', periodNumber: 1, startDate: '', endDate: '' });
  const [savingPeriod, setSavingPeriod] = useState(false);

  // Expanded rows
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  const fetchFiscalYears = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/accounts/fiscal-years');
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setFiscalYears(data.fiscalYears || []);
      setSummary(data.summary || { totalFiscalYears: 0, activeCount: 0, totalBudgeted: 0, totalActual: 0 });
    } catch {
      toast.error('Failed to load fiscal years');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchFiscalYears(); }, [fetchFiscalYears]);

  const resetFyForm = () => {
    setFyForm({ name: '', startDate: '', endDate: '', isActive: false });
    setPeriods([{ name: '', periodNumber: 1, startDate: '', endDate: '', isClosed: false }]);
    setEditingFY(null);
  };

  const openCreateDialog = () => {
    resetFyForm();
    setFyDialogOpen(true);
  };

  const openEditDialog = (fy: FiscalYear) => {
    setEditingFY(fy);
    setFyForm({
      name: fy.name,
      startDate: fy.start_date ? fy.start_date.split('T')[0] : '',
      endDate: fy.end_date ? fy.end_date.split('T')[0] : '',
      isActive: fy.is_active === 1,
    });
    setPeriods(fy.periods.length > 0
      ? fy.periods.map((p) => ({
          name: p.name,
          periodNumber: p.period_number,
          startDate: p.start_date ? p.start_date.split('T')[0] : '',
          endDate: p.end_date ? p.end_date.split('T')[0] : '',
          isClosed: p.is_closed === 1,
        }))
      : [{ name: '', periodNumber: 1, startDate: '', endDate: '', isClosed: false }]
    );
    setFyDialogOpen(true);
  };

  const handleSaveFY = async () => {
    if (!fyForm.name.trim()) { toast.error('Fiscal year name is required'); return; }
    setSaving(true);
    try {
      if (editingFY) {
        const res = await fetch('/api/admin/accounts/fiscal-years', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fiscalYearId: editingFY.fiscal_year_id,
            name: fyForm.name,
            startDate: fyForm.startDate || null,
            endDate: fyForm.endDate || null,
            isActive: fyForm.isActive,
            status: fyForm.isActive ? 'active' : 'draft',
          }),
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        toast.success('Fiscal year updated');
      } else {
        const res = await fetch('/api/admin/accounts/fiscal-years', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: fyForm.name,
            startDate: fyForm.startDate || null,
            endDate: fyForm.endDate || null,
            isActive: fyForm.isActive,
            periods: periods.filter((p) => p.name.trim()),
          }),
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        toast.success('Fiscal year created');
      }
      setFyDialogOpen(false);
      resetFyForm();
      fetchFiscalYears();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save fiscal year');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteFY = async (id: number) => {
    try {
      const res = await fetch(`/api/admin/accounts/fiscal-years?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast.success('Fiscal year closed');
      fetchFiscalYears();
    } catch (err: any) {
      toast.error(err.message || 'Failed to close fiscal year');
    }
  };

  const handleAddPeriodRow = () => {
    setPeriods([...periods, { name: '', periodNumber: periods.length + 1, startDate: '', endDate: '', isClosed: false }]);
  };

  const handleRemovePeriodRow = (idx: number) => {
    setPeriods(periods.filter((_, i) => i !== idx));
  };

  const updatePeriodField = (idx: number, field: string, value: string | boolean) => {
    const updated = [...periods];
    (updated[idx] as Record<string, unknown>)[field] = value;
    setPeriods(updated);
  };

  const openPeriodDialog = (fy: FiscalYear) => {
    setSelectedFY(fy);
    setPeriodForm({ name: '', periodNumber: (fy._periodCount || 0) + 1, startDate: '', endDate: '' });
    setPeriodDialogOpen(true);
  };

  const handleAddPeriod = async () => {
    if (!selectedFY || !periodForm.name.trim()) { toast.error('Period name is required'); return; }
    setSavingPeriod(true);
    try {
      const res = await fetch('/api/admin/fiscal-periods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fiscalYearId: selectedFY.fiscal_year_id,
          name: periodForm.name,
          periodNumber: periodForm.periodNumber,
          startDate: periodForm.startDate || null,
          endDate: periodForm.endDate || null,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast.success('Period added');
      setPeriodDialogOpen(false);
      fetchFiscalYears();
    } catch (err: any) {
      toast.error(err.message || 'Failed to add period');
    } finally {
      setSavingPeriod(false);
    }
  };

  const toggleExpand = (id: number) => {
    const next = new Set(expandedRows);
    if (next.has(id)) next.delete(id); else next.add(id);
    setExpandedRows(next);
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
            <h1 className="text-2xl font-bold text-slate-900">Fiscal Years</h1>
            <p className="text-sm text-slate-500 mt-1">Manage fiscal years, periods, and budget cycles</p>
          </div>
          <Button onClick={openCreateDialog} className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="w-4 h-4 mr-2" />
            New Fiscal Year
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-emerald-100">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">Total Years</p>
                  <p className="text-lg font-bold text-slate-900">{summary.totalFiscalYears}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-emerald-100">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">Active</p>
                  <p className="text-lg font-bold text-emerald-700">{summary.activeCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-violet-100">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-violet-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">Total Budgeted</p>
                  <p className="text-lg font-bold text-violet-700">{formatCurrency(summary.totalBudgeted)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-amber-100">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">Total Spent</p>
                  <p className="text-lg font-bold text-amber-700">{formatCurrency(summary.totalActual)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Table */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Layers className="w-4 h-4 text-slate-500" />
              All Fiscal Years
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="w-10" />
                    <TableHead className="text-xs font-semibold">Name</TableHead>
                    <TableHead className="text-xs font-semibold">Period</TableHead>
                    <TableHead className="text-xs font-semibold">Status</TableHead>
                    <TableHead className="text-xs font-semibold text-right">Budgeted</TableHead>
                    <TableHead className="text-xs font-semibold text-right">Actual</TableHead>
                    <TableHead className="text-xs font-semibold text-center">Budgets</TableHead>
                    <TableHead className="text-xs font-semibold text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <TableRow key={i}>{Array.from({ length: 8 }).map((_, j) => (<TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>))}</TableRow>
                    ))
                  ) : fiscalYears.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-12 text-slate-400">
                        <Calendar className="w-10 h-10 mx-auto mb-2 opacity-50" />
                        <p>No fiscal years found</p>
                        <p className="text-xs mt-1">Create your first fiscal year to get started</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    fiscalYears.map((fy) => (
                      <>
                        <TableRow key={fy.fiscal_year_id} className="hover:bg-slate-50/50 cursor-pointer" onClick={() => toggleExpand(fy.fiscal_year_id)}>
                          <TableCell className="w-10">
                            {expandedRows.has(fy.fiscal_year_id) ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {fy.is_active === 1 && <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />}
                              <p className="font-medium text-sm">{fy.name}</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs text-slate-500">
                            {fy.start_date && fy.end_date ? `${formatDate(fy.start_date)} — ${formatDate(fy.end_date)}` : '—'}
                          </TableCell>
                          <TableCell>{getStatusBadge(fy.status)}</TableCell>
                          <TableCell className="text-right font-mono text-sm">{formatCurrency(fy._totalBudgeted)}</TableCell>
                          <TableCell className="text-right font-mono text-sm text-amber-600">{formatCurrency(fy._totalActual)}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant="secondary" className="text-xs">{fy._budgetCount}</Badge>
                          </TableCell>
                          <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1">
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditDialog(fy)} title="Edit">
                                <Pencil className="w-3.5 h-3.5" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openPeriodDialog(fy)} title="Add Period">
                                <Plus className="w-3.5 h-3.5" />
                              </Button>
                              {fy.status !== 'closed' && (
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600" onClick={() => handleDeleteFY(fy.fiscal_year_id)} title="Close">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                        {expandedRows.has(fy.fiscal_year_id) && (
                          <TableRow key={`${fy.fiscal_year_id}-periods`}>
                            <TableCell colSpan={8} className="bg-slate-50/50 px-8 py-4">
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                    <Layers className="w-4 h-4" />
                                    Fiscal Periods ({fy.periods.length})
                                  </h4>
                                  <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => openPeriodDialog(fy)}>
                                    <Plus className="w-3 h-3 mr-1" />Add Period
                                  </Button>
                                </div>
                                {fy.periods.length === 0 ? (
                                  <p className="text-sm text-slate-400 italic">No periods defined</p>
                                ) : (
                                  <Table>
                                    <TableHeader>
                                      <TableRow className="bg-white">
                                        <TableHead className="text-xs">#</TableHead>
                                        <TableHead className="text-xs">Period Name</TableHead>
                                        <TableHead className="text-xs">Start</TableHead>
                                        <TableHead className="text-xs">End</TableHead>
                                        <TableHead className="text-xs">Status</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {fy.periods.map((p) => (
                                        <TableRow key={p.fiscal_period_id}>
                                          <TableCell className="text-xs text-slate-500">{p.period_number}</TableCell>
                                          <TableCell className="text-sm font-medium">{p.name}</TableCell>
                                          <TableCell className="text-xs text-slate-500">{formatDate(p.start_date)}</TableCell>
                                          <TableCell className="text-xs text-slate-500">{formatDate(p.end_date)}</TableCell>
                                          <TableCell>
                                            <Badge variant={p.is_closed ? 'secondary' : 'outline'} className={p.is_closed ? 'bg-slate-100 text-slate-500' : 'bg-emerald-100 text-emerald-700'}>
                                              {p.is_closed ? 'Closed' : 'Open'}
                                            </Badge>
                                          </TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                )}
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

            {/* Mobile View */}
            <div className="md:hidden divide-y">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="p-4 space-y-2"><Skeleton className="h-4 w-3/4" /><Skeleton className="h-3 w-1/2" /></div>
                ))
              ) : fiscalYears.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <Calendar className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p>No fiscal years found</p>
                </div>
              ) : (
                fiscalYears.map((fy) => (
                  <div key={fy.fiscal_year_id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {fy.is_active === 1 && <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />}
                        <p className="font-medium text-sm">{fy.name}</p>
                      </div>
                      {getStatusBadge(fy.status)}
                    </div>
                    <p className="text-xs text-slate-500">{fy.start_date && fy.end_date ? `${formatDate(fy.start_date)} — ${formatDate(fy.end_date)}` : '—'}</p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-slate-50 rounded-lg p-2">
                        <p className="text-slate-500">Budgeted</p>
                        <p className="font-mono font-bold">{formatCurrency(fy._totalBudgeted)}</p>
                      </div>
                      <div className="bg-slate-50 rounded-lg p-2">
                        <p className="text-slate-500">Actual</p>
                        <p className="font-mono font-bold text-amber-600">{formatCurrency(fy._totalActual)}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>{fy._periodCount} period(s) &middot; {fy._budgetCount} budget(s)</span>
                    </div>
                    <div className="flex gap-2 pt-1">
                      <Button variant="outline" size="sm" className="flex-1 h-8 text-xs" onClick={() => openEditDialog(fy)}><Pencil className="w-3 h-3 mr-1" />Edit</Button>
                      <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => openPeriodDialog(fy)}><Plus className="w-3 h-3 mr-1" />Period</Button>
                      {fy.status !== 'closed' && (
                        <Button variant="outline" size="sm" className="h-8 text-xs text-red-500" onClick={() => handleDeleteFY(fy.fiscal_year_id)}><Trash2 className="w-3 h-3" /></Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create/Edit Fiscal Year Dialog */}
      <Dialog open={fyDialogOpen} onOpenChange={(open) => { if (!open) resetFyForm(); setFyDialogOpen(open); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-600" />
              {editingFY ? 'Edit Fiscal Year' : 'Create Fiscal Year'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <div>
                <Label className="text-xs mb-1.5 block">Fiscal Year Name *</Label>
                <Input
                  placeholder="e.g. FY 2025/2026"
                  value={fyForm.name}
                  onChange={(e) => setFyForm({ ...fyForm, name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs mb-1.5 block">Start Date</Label>
                  <Input
                    type="date"
                    value={fyForm.startDate}
                    onChange={(e) => setFyForm({ ...fyForm, startDate: e.target.value })}
                  />
                </div>
                <div>
                  <Label className="text-xs mb-1.5 block">End Date</Label>
                  <Input
                    type="date"
                    value={fyForm.endDate}
                    onChange={(e) => setFyForm({ ...fyForm, endDate: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs mb-1.5 block">Status</Label>
                <Select value={fyForm.isActive ? 'active' : 'draft'} onValueChange={(v) => setFyForm({ ...fyForm, isActive: v === 'active' })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Periods Section (only for create) */}
            {!editingFY && (
              <div className="space-y-3 border-t pt-4">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold text-slate-700 flex items-center gap-2">
                    <Layers className="w-3.5 h-3.5" />
                    Fiscal Periods (optional)
                  </Label>
                  <Button variant="outline" size="sm" className="h-7 text-xs" onClick={handleAddPeriodRow}>
                    <Plus className="w-3 h-3 mr-1" />Add Period
                  </Button>
                </div>
                {periods.map((p, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 items-end">
                    <div className="col-span-1">
                      <Label className="text-xs mb-1 block">#</Label>
                      <Input value={p.periodNumber} onChange={(e) => updatePeriodField(idx, 'periodNumber', e.target.value)} className="text-center" disabled />
                    </div>
                    <div className="col-span-4">
                      <Label className="text-xs mb-1 block">Name</Label>
                      <Input placeholder="e.g. Q1" value={p.name} onChange={(e) => updatePeriodField(idx, 'name', e.target.value)} />
                    </div>
                    <div className="col-span-3">
                      <Label className="text-xs mb-1 block">Start</Label>
                      <Input type="date" value={p.startDate} onChange={(e) => updatePeriodField(idx, 'startDate', e.target.value)} />
                    </div>
                    <div className="col-span-3">
                      <Label className="text-xs mb-1 block">End</Label>
                      <Input type="date" value={p.endDate} onChange={(e) => updatePeriodField(idx, 'endDate', e.target.value)} />
                    </div>
                    <div className="col-span-1">
                      <Button variant="ghost" size="icon" className="h-9 w-9 text-red-400 hover:text-red-600" onClick={() => handleRemovePeriodRow(idx)} disabled={periods.length === 1}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { resetFyForm(); setFyDialogOpen(false); }}>Cancel</Button>
            <Button onClick={handleSaveFY} disabled={saving || !fyForm.name.trim()} className="bg-emerald-600 hover:bg-emerald-700">
              {saving ? 'Saving...' : editingFY ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Period Dialog */}
      <Dialog open={periodDialogOpen} onOpenChange={setPeriodDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-violet-600" />
              Add Period to {selectedFY?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs mb-1.5 block">Period Name *</Label>
              <Input placeholder="e.g. Q1, Month 1" value={periodForm.name} onChange={(e) => setPeriodForm({ ...periodForm, name: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs mb-1.5 block">Period Number</Label>
              <Input type="number" value={periodForm.periodNumber} onChange={(e) => setPeriodForm({ ...periodForm, periodNumber: parseInt(e.target.value) || 1 })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs mb-1.5 block">Start Date</Label>
                <Input type="date" value={periodForm.startDate} onChange={(e) => setPeriodForm({ ...periodForm, startDate: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs mb-1.5 block">End Date</Label>
                <Input type="date" value={periodForm.endDate} onChange={(e) => setPeriodForm({ ...periodForm, endDate: e.target.value })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPeriodDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAddPeriod} disabled={savingPeriod || !periodForm.name.trim()} className="bg-violet-600 hover:bg-violet-700">
              {savingPeriod ? 'Adding...' : 'Add Period'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
