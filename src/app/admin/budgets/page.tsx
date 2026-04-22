"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Wallet, TrendingUp, TrendingDown, CircleDollarSign, Plus, Trash2,
  Search, RefreshCw, AlertCircle, Eye, X, Loader2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";

/* ─── Types ─── */
interface BudgetLine {
  budget_line_id?: number;
  account_id?: number | null;
  account_code?: string;
  account_name?: string;
  category: string;
  description: string;
  budgeted_amount: number;
  actual_amount: number;
  variance: number;
}

interface FiscalYear {
  fiscal_year_id: number;
  name: string;
  start_date: string | null;
  end_date: string | null;
  is_active: number;
  status: string;
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
  fiscal_years: FiscalYear | null;
  department: { id: number; dep_name: string } | null;
  _lineCount: number;
  _totalBudgeted: number;
  _totalActual: number;
  _remaining: number;
}

/* ─── Helpers ─── */
function fmt(n: number) {
  return `GHS ${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  draft: { label: "Draft", className: "bg-slate-100 text-slate-700 border-slate-200" },
  active: { label: "Active", className: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  approved: { label: "Approved", className: "bg-teal-100 text-teal-700 border-teal-200" },
  closed: { label: "Closed", className: "bg-amber-100 text-amber-700 border-amber-200" },
  cancelled: { label: "Cancelled", className: "bg-red-100 text-red-700 border-red-200" },
};

const CATEGORY_OPTIONS = [
  "Personnel", "Operations", "Capital Expenditure", "Programs",
  "Maintenance", "Utilities", "Supplies", "Technology",
  "Training", "Transport", "Other",
];

/* ─── Full Page Skeleton ─── */
function BudgetsPageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48 rounded-lg" />
          <Skeleton className="h-4 w-64 rounded-lg" />
        </div>
        <Skeleton className="h-11 w-40 rounded-lg" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="border-l-4 border-l-slate-200">
            <CardContent className="p-4"><Skeleton className="h-16 w-full" /></CardContent>
          </Card>
        ))}
      </div>
      <Card className="border-slate-200/60">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3">
            <Skeleton className="h-11 flex-1 min-w-[200px] rounded-lg" />
            <Skeleton className="h-11 w-[180px] rounded-lg" />
            <Skeleton className="h-11 w-[150px] rounded-lg" />
          </div>
        </CardContent>
      </Card>
      <Card className="border-slate-200/60">
        <CardContent className="p-6">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-lg mb-3" />)}
        </CardContent>
      </Card>
    </div>
  );
}

/* ─── Component ─── */
export default function BudgetsPage() {
  const router = useRouter();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [fiscalYears, setFiscalYears] = useState<FiscalYear[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState({ totalBudgets: 0, totalAmount: 0, totalBudgeted: 0, totalActual: 0, totalRemaining: 0 });

  // Filters
  const [filterStatus, setFilterStatus] = useState("__all__");
  const [filterFiscalYear, setFilterFiscalYear] = useState("__all__");
  const [search, setSearch] = useState("");

  // Create dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: "", fiscalYearId: "__none__", totalAmount: "", description: "", status: "draft",
  });
  const [createLines, setCreateLines] = useState<BudgetLine[]>([
    { category: "", description: "", budgeted_amount: 0, actual_amount: 0, variance: 0 },
  ]);

  // Delete dialog
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchBudgets = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (filterStatus !== "__all__") params.set("status", filterStatus);
      if (filterFiscalYear !== "__all__") params.set("fiscalYearId", filterFiscalYear);
      const res = await fetch(`/api/admin/budgets?${params}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      let items: Budget[] = data.budgets || [];
      if (search) {
        const q = search.toLowerCase();
        items = items.filter((b: Budget) => b.name.toLowerCase().includes(q));
      }
      setBudgets(items);
      setSummary(data.summary || { totalBudgets: 0, totalAmount: 0, totalBudgeted: 0, totalActual: 0, totalRemaining: 0 });
    } catch {
      setError("Failed to load budgets");
    }
    setLoading(false);
  }, [filterStatus, filterFiscalYear, search]);

  const fetchFiscalYears = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/fiscal-years");
      const data = await res.json();
      if (!data.error) setFiscalYears(data.fiscalYears || []);
    } catch { /* silent */ }
  }, []);

  useEffect(() => { fetchFiscalYears(); }, [fetchFiscalYears]);
  useEffect(() => { fetchBudgets(); }, [fetchBudgets]);

  /* ─── Create ─── */
  const handleCreate = async () => {
    if (!createForm.name) { toast.error("Budget name is required"); return; }
    setCreating(true);
    try {
      const lines = createLines.filter((l) => l.description || l.budgeted_amount > 0 || l.category);
      const res = await fetch("/api/admin/budgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: createForm.name,
          fiscalYearId: createForm.fiscalYearId !== "__none__" ? createForm.fiscalYearId : null,
          totalAmount: createForm.totalAmount || 0,
          status: createForm.status,
          description: createForm.description,
          lines,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast.success("Budget created successfully");
      setCreateOpen(false);
      setCreateForm({ name: "", fiscalYearId: "__none__", totalAmount: "", description: "", status: "draft" });
      setCreateLines([{ category: "", description: "", budgeted_amount: 0, actual_amount: 0, variance: 0 }]);
      fetchBudgets();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to create budget";
      toast.error(msg);
    }
    setCreating(false);
  };

  const addLine = () => {
    setCreateLines([...createLines, { category: "", description: "", budgeted_amount: 0, actual_amount: 0, variance: 0 }]);
  };

  const removeLine = (idx: number) => {
    setCreateLines(createLines.filter((_, i) => i !== idx));
  };

  const updateLine = (idx: number, field: keyof BudgetLine, value: string | number) => {
    const updated = [...createLines];
    (updated[idx] as Record<string, string | number>)[field] = value;
    const ba = Number(updated[idx].budgeted_amount) || 0;
    const aa = Number(updated[idx].actual_amount) || 0;
    updated[idx].variance = ba - aa;
    setCreateLines(updated);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/budgets/${deleteId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast.success("Budget cancelled");
      setDeleteOpen(false);
      setDeleteId(null);
      fetchBudgets();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to cancel budget";
      toast.error(msg);
    }
    setDeleting(false);
  };

  const hasFilters = filterStatus !== "__all__" || filterFiscalYear !== "__all__" || search;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Budget Management</h1>
            <p className="text-sm text-slate-500 mt-1">Plan, track & manage school budgets</p>
          </div>
          <Button onClick={() => setCreateOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 min-h-[44px]">
            <Plus className="w-4 h-4 mr-2" /> Create Budget
          </Button>
        </div>

        {loading ? (
          <BudgetsPageSkeleton />
        ) : (
          <>
            {/* Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="border-l-4 border-l-emerald-500 hover:shadow-sm transition-all hover:-translate-y-0.5">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center flex-shrink-0">
                    <Wallet className="w-5 h-5 text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">Total Budgets</p>
                    <p className="text-xl font-bold text-slate-900 tabular-nums">{summary.totalBudgets}</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-sky-500 hover:shadow-sm transition-all hover:-translate-y-0.5">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-sky-500 flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">Budgeted</p>
                    <p className="text-lg font-bold text-slate-900 tabular-nums">{fmt(summary.totalBudgeted)}</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-amber-500 hover:shadow-sm transition-all hover:-translate-y-0.5">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center flex-shrink-0">
                    <TrendingDown className="w-5 h-5 text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">Spent</p>
                    <p className="text-lg font-bold text-slate-900 tabular-nums">{fmt(summary.totalActual)}</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-violet-500 hover:shadow-sm transition-all hover:-translate-y-0.5">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-violet-500 flex items-center justify-center flex-shrink-0">
                    <CircleDollarSign className="w-5 h-5 text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">Remaining</p>
                    <p className={`text-lg font-bold tabular-nums ${summary.totalRemaining >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{fmt(summary.totalRemaining)}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <Card className="border-slate-200/60">
              <CardContent className="p-4">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      placeholder="Search budgets..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-9 bg-slate-50 border-slate-200 focus:bg-white min-h-[44px]"
                    />
                  </div>
                  <Select value={filterFiscalYear} onValueChange={(v) => setFilterFiscalYear(v)}>
                    <SelectTrigger className="w-[180px] min-h-[44px] bg-slate-50 border-slate-200 focus:bg-white"><SelectValue placeholder="All Fiscal Years" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">All Fiscal Years</SelectItem>
                      {fiscalYears.map((fy) => (
                        <SelectItem key={fy.fiscal_year_id} value={String(fy.fiscal_year_id)}>{fy.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v)}>
                    <SelectTrigger className="w-[150px] min-h-[44px] bg-slate-50 border-slate-200 focus:bg-white"><SelectValue placeholder="All Status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">All Status</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                  {hasFilters && (
                    <Button variant="outline" size="sm" onClick={() => { setFilterStatus("__all__"); setFilterFiscalYear("__all__"); setSearch(""); }} className="gap-1 min-h-[44px]">
                      <X className="w-3.5 h-3.5" />Clear
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Error */}
            {error && (
              <Card className="border-red-200">
                <CardContent className="p-6 flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mb-3">
                    <AlertCircle className="w-8 h-8 text-red-400" />
                  </div>
                  <p className="font-medium text-slate-900">{error}</p>
                  <Button variant="outline" className="mt-3 min-h-[44px]" onClick={fetchBudgets}>
                    <RefreshCw className="w-4 h-4 mr-2" />Retry
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Table */}
            <Card className="border-slate-200/60">
              <CardContent className="p-0">
                {/* Desktop */}
                <div className="hidden md:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50">
                        <TableHead className="text-xs font-semibold">Name</TableHead>
                        <TableHead>Fiscal Year</TableHead>
                        <TableHead className="text-right">Budgeted</TableHead>
                        <TableHead className="text-right">Spent</TableHead>
                        <TableHead className="text-right">Remaining</TableHead>
                        <TableHead>Lines</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {budgets.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-12 text-slate-400">
                            <div className="flex flex-col items-center justify-center">
                              <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
                                <Wallet className="w-8 h-8 text-slate-300" />
                              </div>
                              <p className="font-medium text-slate-900 mb-1">No budgets found</p>
                              <p className="text-sm text-slate-500">Create your first budget to get started</p>
                              <Button className="mt-3 min-h-[44px] bg-emerald-500 hover:bg-emerald-600 text-white" onClick={() => setCreateOpen(true)}>
                                <Plus className="w-4 h-4 mr-2" />Create First Budget
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : budgets.map((b) => {
                        const sc = statusConfig[b.status] || statusConfig.draft;
                        return (
                          <TableRow key={b.budget_id} className="hover:bg-slate-50/50 cursor-pointer" onClick={() => router.push(`/admin/budgets/${b.budget_id}`)}>
                            <TableCell>
                              <div>
                                <p className="font-medium text-sm">{b.name}</p>
                                {b.description && <p className="text-xs text-slate-400 truncate max-w-48">{b.description}</p>}
                              </div>
                            </TableCell>
                            <TableCell className="text-sm">{b.fiscal_years?.name || "—"}</TableCell>
                            <TableCell className="text-right font-mono text-sm">{fmt(b._totalBudgeted)}</TableCell>
                            <TableCell className="text-right font-mono text-sm text-orange-600">{fmt(b._totalActual)}</TableCell>
                            <TableCell className="text-right font-mono text-sm text-teal-600">{fmt(b._remaining)}</TableCell>
                            <TableCell className="text-center text-sm">{b._lineCount}</TableCell>
                            <TableCell><Badge variant="outline" className={sc.className}>{sc.label}</Badge></TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                                <Button variant="ghost" size="icon" className="min-w-[32px]" onClick={() => router.push(`/admin/budgets/${b.budget_id}`)}>
                                  <Eye className="w-3.5 h-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="min-w-[32px] text-red-500 hover:text-red-600"
                                  onClick={() => { setDeleteId(b.budget_id); setDeleteOpen(true); }}
                                >
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
                {/* Mobile */}
                <div className="md:hidden divide-y">
                  {budgets.length === 0 ? (
                    <div className="text-center py-12 text-slate-400">
                      <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
                        <Wallet className="w-8 h-8 text-slate-300" />
                      </div>
                      <p className="font-medium text-slate-900 mb-1">No budgets found</p>
                      <p className="text-sm text-slate-500">Create your first budget</p>
                      <Button className="mt-3 min-h-[44px] bg-emerald-500 hover:bg-emerald-600 text-white" onClick={() => setCreateOpen(true)}>
                        <Plus className="w-4 h-4 mr-2" />Create Budget
                      </Button>
                    </div>
                  ) : budgets.map((b) => {
                    const sc = statusConfig[b.status] || statusConfig.draft;
                    return (
                      <div key={b.budget_id} className="p-4 space-y-2 cursor-pointer active:bg-slate-50" onClick={() => router.push(`/admin/budgets/${b.budget_id}`)}>
                        <div className="flex items-start justify-between">
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-sm truncate">{b.name}</p>
                            <p className="text-xs text-slate-400">{b.fiscal_years?.name || "No fiscal year"}</p>
                          </div>
                          <Badge variant="outline" className={sc.className}>{sc.label}</Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div><span className="text-slate-400">Budgeted</span><p className="font-mono font-medium">{fmt(b._totalBudgeted)}</p></div>
                          <div><span className="text-slate-400">Spent</span><p className="font-mono font-medium text-orange-600">{fmt(b._totalActual)}</p></div>
                          <div><span className="text-slate-400">Remaining</span><p className="font-mono font-medium text-teal-600">{fmt(b._remaining)}</p></div>
                        </div>
                        <div className="flex gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
                          <Button variant="outline" size="sm" className="flex-1 min-h-[44px]" onClick={() => router.push(`/admin/budgets/${b.budget_id}`)}>
                            <Eye className="w-3 h-3 mr-1" />View
                          </Button>
                          <Button variant="outline" size="sm" className="min-h-[44px] min-w-[44px] text-red-500" onClick={() => { setDeleteId(b.budget_id); setDeleteOpen(true); }}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Create Budget Dialog */}
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center gap-3 mb-1">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <Plus className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <DialogTitle>Create Budget</DialogTitle>
                  <DialogDescription>Set up a new budget with budget lines</DialogDescription>
                </div>
              </div>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs">Budget Name *</Label>
                  <Input value={createForm.name} onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })} placeholder="e.g., Annual Budget 2025" className="mt-1 min-h-[44px]" />
                </div>
                <div>
                  <Label className="text-xs">Fiscal Year</Label>
                  <Select value={createForm.fiscalYearId} onValueChange={(v) => setCreateForm({ ...createForm, fiscalYearId: v })}>
                    <SelectTrigger className="mt-1 min-h-[44px]"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">No fiscal year</SelectItem>
                      {fiscalYears.map((fy) => (
                        <SelectItem key={fy.fiscal_year_id} value={String(fy.fiscal_year_id)}>{fy.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Total Amount</Label>
                  <Input type="number" value={createForm.totalAmount} onChange={(e) => setCreateForm({ ...createForm, totalAmount: e.target.value })} placeholder="0.00" className="mt-1 font-mono min-h-[44px]" />
                </div>
                <div>
                  <Label className="text-xs">Status</Label>
                  <Select value={createForm.status} onValueChange={(v) => setCreateForm({ ...createForm, status: v })}>
                    <SelectTrigger className="mt-1 min-h-[44px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label className="text-xs">Description</Label>
                <Textarea value={createForm.description} onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })} placeholder="Optional description" className="mt-1" rows={2} />
              </div>

              {/* Budget Lines */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-xs font-semibold uppercase tracking-wide">Budget Lines</Label>
                  <Button variant="outline" size="sm" onClick={addLine} className="gap-1 min-h-[44px]">
                    <Plus className="w-3 h-3" />Add Line
                  </Button>
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {createLines.map((line, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-end bg-slate-50 rounded-lg p-3">
                      <div className="col-span-3">
                        <Label className="text-[10px] text-slate-400">Category</Label>
                        <Select value={line.category} onValueChange={(v) => updateLine(idx, "category", v)}>
                          <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select" /></SelectTrigger>
                          <SelectContent>
                            {CATEGORY_OPTIONS.map((c) => (
                              <SelectItem key={c} value={c}>{c}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-4">
                        <Label className="text-[10px] text-slate-400">Description</Label>
                        <Input
                          value={line.description}
                          onChange={(e) => updateLine(idx, "description", e.target.value)}
                          placeholder="Line item"
                          className="h-8 text-xs"
                        />
                      </div>
                      <div className="col-span-3">
                        <Label className="text-[10px] text-slate-400">Amount</Label>
                        <Input
                          type="number"
                          value={line.budgeted_amount || ""}
                          onChange={(e) => updateLine(idx, "budgeted_amount", parseFloat(e.target.value) || 0)}
                          placeholder="0.00"
                          className="h-8 text-xs font-mono"
                        />
                      </div>
                      <div className="col-span-1">
                        <Button variant="ghost" size="icon" className="min-w-[32px] h-8 text-slate-400 hover:text-red-500" onClick={() => removeLine(idx)}>
                          <X className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)} className="min-h-[44px]">Cancel</Button>
              <Button onClick={handleCreate} disabled={creating} className="bg-emerald-600 hover:bg-emerald-700 min-h-[44px]">
                {creating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}{creating ? "Creating..." : "Create Budget"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirm */}
        <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
                  <Trash2 className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <AlertDialogTitle>Cancel Budget</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will mark the budget as cancelled. The budget data will be preserved but no further changes can be made.
                  </AlertDialogDescription>
                </div>
              </div>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="min-h-[44px]">Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-red-600 hover:bg-red-700 min-h-[44px]">
                {deleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}{deleting ? "Cancelling..." : "Cancel Budget"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}
