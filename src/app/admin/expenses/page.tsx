"use client";

import { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { toast } from 'sonner';
import {
  TrendingDown, DollarSign, Plus, Pencil, Trash2, Tag, FolderOpen,
  X, Search, ChevronLeft, ChevronRight, AlertCircle, RefreshCw, Receipt,
  CheckCircle, Clock, BarChart3, Loader2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

// ─── Types ───────────────────────────────────────────────────────────────────

interface Expense {
  id: number; title: string; description: string; category_id: number | null;
  amount: number; expense_date: string; payment_method: string; status: string;
  expense_category: { expense_category_id: number; expense_category_name: string } | null;
}
interface ExpenseCategory {
  expense_category_id: number; expense_category_name: string;
  expenseCount: number; totalAmount: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(n: number) { return `GHS ${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`; }
function fmtDate(dateStr: string) { if (!dateStr) return "\u2014"; return new Date(dateStr).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }); }

const methodColors: Record<string, string> = { cash: "bg-emerald-100 text-emerald-700", mobile_money: "bg-violet-100 text-violet-700", bank_transfer: "bg-sky-100 text-sky-700", cheque: "bg-amber-100 text-amber-700", card: "bg-rose-100 text-rose-700" };
const statusConfig: Record<string, { label: string; className: string }> = { approved: { label: "Approved", className: "bg-emerald-100 text-emerald-700 border-emerald-200" }, pending: { label: "Pending", className: "bg-amber-100 text-amber-700 border-amber-200" }, rejected: { label: "Rejected", className: "bg-red-100 text-red-700 border-red-200" } };

// ─── Skeleton Components ─────────────────────────────────────────────────────

function StatCardSkeleton() {
  return (
    <div className="rounded-2xl border border-slate-200/60 bg-white p-4 flex items-center gap-3">
      <Skeleton className="w-11 h-11 rounded-xl flex-shrink-0" />
      <div className="space-y-2 flex-1 min-w-0">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-6 w-16" />
      </div>
    </div>
  );
}

function PageSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-3 w-64" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCardSkeleton /><StatCardSkeleton /><StatCardSkeleton /><StatCardSkeleton />
      </div>
      <Skeleton className="h-11 w-full rounded-2xl" />
      <div className="rounded-2xl border border-slate-200/60 overflow-hidden">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="p-4 border-b border-slate-100 last:border-0 flex gap-4 items-center">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-20 ml-auto" />
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("__all__");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [status, setStatus] = useState("__all__");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [summary, setSummary] = useState({ monthTotal: 0, categoryBreakdown: [] as { category: string; amount: number }[] });
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState({ title: "", description: "", categoryId: "__none__", amount: "", expenseDate: new Date().toISOString().split("T")[0], paymentMethod: "cash" });
  const [adding, setAdding] = useState(false);

  const [editOpen, setEditOpen] = useState(false);
  const [editExpense, setEditExpense] = useState<Expense | null>(null);
  const [editForm, setEditForm] = useState({ title: "", description: "", categoryId: "__none__", amount: "", expenseDate: "", paymentMethod: "", status: "" });
  const [editing, setEditing] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [catOpen, setCatOpen] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [creatingCat, setCreatingCat] = useState(false);

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (categoryId !== "__all__") params.set("categoryId", categoryId);
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);
      if (status !== "__all__") params.set("status", status);
      params.set("page", String(page));
      params.set("limit", "15");
      const res = await fetch(`/api/expenses?${params}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setExpenses(data.expenses || []);
      setSummary(data.summary || { monthTotal: 0, categoryBreakdown: [] });
      setTotalPages(data.pagination?.totalPages || 1);
      setTotal(data.pagination?.total || 0);
    } catch { setError("Failed to load expenses"); }
    setLoading(false);
    setInitialLoad(false);
  }, [search, categoryId, startDate, endDate, status, page]);

  const fetchCategories = useCallback(async () => {
    setCategoriesLoading(true);
    try { const res = await fetch("/api/expense-categories"); setCategories(await res.json()); } catch { /* silent */ }
    setCategoriesLoading(false);
  }, []);

  useEffect(() => { fetchExpenses(); }, [fetchExpenses]);
  useEffect(() => { fetchCategories(); }, [fetchCategories]);
  useEffect(() => { setPage(1); }, [search, categoryId, startDate, endDate, status]);

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => { setPage(1); fetchExpenses(); }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const handleAddExpense = async () => {
    if (!addForm.title || !addForm.amount) { toast.error("Title and amount are required"); return; }
    setAdding(true);
    try {
      const res = await fetch("/api/expenses", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: addForm.title, description: addForm.description, categoryId: addForm.categoryId !== "__none__" ? addForm.categoryId : null, amount: addForm.amount, expenseDate: addForm.expenseDate, paymentMethod: addForm.paymentMethod }) });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast.success("Expense created"); setAddOpen(false);
      setAddForm({ title: "", description: "", categoryId: "__none__", amount: "", expenseDate: new Date().toISOString().split("T")[0], paymentMethod: "cash" });
      fetchExpenses(); fetchCategories();
    } catch (e: any) { toast.error(e.message || "Failed to create expense"); }
    setAdding(false);
  };

  const handleEditExpense = (exp: Expense) => {
    setEditExpense(exp);
    setEditForm({ title: exp.title, description: exp.description, categoryId: exp.category_id ? String(exp.category_id) : "__none__", amount: String(exp.amount), expenseDate: exp.expense_date ? new Date(exp.expense_date).toISOString().split("T")[0] : "", paymentMethod: exp.payment_method, status: exp.status });
    setEditOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editExpense) return;
    setEditing(true);
    try {
      const res = await fetch(`/api/expenses/${editExpense.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: editForm.title, description: editForm.description, categoryId: editForm.categoryId !== "__none__" ? editForm.categoryId : null, amount: editForm.amount, expenseDate: editForm.expenseDate, paymentMethod: editForm.paymentMethod, status: editForm.status }) });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast.success("Expense updated"); setEditOpen(false); fetchExpenses();
    } catch (e: any) { toast.error(e.message || "Failed to update"); }
    setEditing(false);
  };

  const handleDeleteExpense = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/expenses/${deleteId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast.success("Expense deleted"); setDeleteOpen(false); setDeleteId(null); fetchExpenses(); fetchCategories();
    } catch (e: any) { toast.error(e.message || "Failed to delete"); }
    setDeleting(false);
  };

  const handleCreateCategory = async () => {
    if (!newCatName.trim()) return;
    setCreatingCat(true);
    try {
      const res = await fetch("/api/expense-categories", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: newCatName.trim() }) });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast.success("Category created"); setCatOpen(false); setNewCatName(""); fetchCategories();
    } catch (e: any) { toast.error(e.message || "Failed to create category"); }
    setCreatingCat(false);
  };

  const clearFilters = () => {
    setSearch(""); setCategoryId("__all__"); setStartDate(""); setEndDate(""); setStatus("__all__");
  };

  const hasFilters = search || categoryId !== "__all__" || startDate || endDate || status !== "__all__";

  const activeFilterChips: { label: string; onDismiss: () => void }[] = [];
  if (search) activeFilterChips.push({ label: `Search: "${search}"`, onDismiss: () => setSearch("") });
  if (categoryId !== "__all__") {
    const cat = categories.find(c => String(c.expense_category_id) === categoryId);
    activeFilterChips.push({ label: cat?.expense_category_name || "Category", onDismiss: () => setCategoryId("__all__") });
  }
  if (startDate) activeFilterChips.push({ label: `From: ${fmtDate(startDate)}`, onDismiss: () => setStartDate("") });
  if (endDate) activeFilterChips.push({ label: `To: ${fmtDate(endDate)}`, onDismiss: () => setEndDate("") });
  if (status !== "__all__") activeFilterChips.push({ label: `Status: ${statusConfig[status]?.label || status}`, onDismiss: () => setStatus("__all__") });

  const approvedCount = expenses.filter(e => e.status === "approved").length;
  const pendingCount = expenses.filter(e => e.status === "pending").length;
  const totalAmount = expenses.reduce((s, e) => s + e.amount, 0);

  // ─── Render ────────────────────────────────────────────────────────────────

  if (initialLoad) {
    return (
      <DashboardLayout>
        <PageSkeleton />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Expenses</h1>
            <p className="text-sm text-slate-500 mt-1">Track &amp; manage school expenses</p>
          </div>
          <Button onClick={() => setAddOpen(true)} className="bg-amber-500 hover:bg-amber-600 min-h-[44px]"><Plus className="w-4 h-4 mr-2" /> Add Expense</Button>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-slate-200/60 bg-white p-4 border-l-4 border-l-emerald-500 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-emerald-500 flex items-center justify-center flex-shrink-0"><DollarSign className="w-5 h-5 text-white" /></div>
              <div className="min-w-0">
                <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">This Month</p>
                <p className="text-xl font-bold text-slate-900 tabular-nums">{fmt(summary.monthTotal)}</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200/60 bg-white p-4 border-l-4 border-l-sky-500 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-sky-500 flex items-center justify-center flex-shrink-0"><BarChart3 className="w-5 h-5 text-white" /></div>
              <div className="min-w-0">
                <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Total Shown</p>
                <p className="text-xl font-bold text-slate-900 tabular-nums">{fmt(totalAmount)}</p>
                <p className="text-[10px] text-slate-400">{total} expense(s)</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200/60 bg-white p-4 border-l-4 border-l-violet-500 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-violet-500 flex items-center justify-center flex-shrink-0"><CheckCircle className="w-5 h-5 text-white" /></div>
              <div className="min-w-0">
                <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Approved</p>
                <p className="text-xl font-bold text-slate-900 tabular-nums">{approvedCount}</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200/60 bg-white p-4 border-l-4 border-l-amber-500 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-amber-500 flex items-center justify-center flex-shrink-0"><Clock className="w-5 h-5 text-white" /></div>
              <div className="min-w-0">
                <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Pending</p>
                <p className="text-xl font-bold text-slate-900 tabular-nums">{pendingCount}</p>
              </div>
            </div>
          </div>
        </div>

        <Tabs defaultValue="expenses" className="space-y-4">
          <TabsList className="bg-white border border-slate-200 p-1 rounded-xl h-auto flex w-full sm:w-auto">
            <TabsTrigger value="expenses" className="flex-1 min-w-[90px] data-[state=active]:bg-amber-500 data-[state=active]:text-white rounded-lg py-2"><Receipt className="w-4 h-4 mr-1" /> Expenses</TabsTrigger>
            <TabsTrigger value="categories" className="flex-1 min-w-[90px] data-[state=active]:bg-amber-500 data-[state=active]:text-white rounded-lg py-2"><Tag className="w-4 h-4 mr-1" /> Categories</TabsTrigger>
          </TabsList>

          <TabsContent value="expenses" className="space-y-4">
            {/* Search + Filters */}
            <div className="rounded-2xl bg-white border border-slate-200/60 p-4 space-y-3">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input placeholder="Search expenses..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 min-h-[44px] bg-slate-50 border-slate-200 focus:bg-white" />
                </div>
                <Select value={categoryId} onValueChange={(v) => setCategoryId(v)}>
                  <SelectTrigger className="w-full sm:w-[180px] min-h-[44px] bg-slate-50 border-slate-200 focus:bg-white"><SelectValue placeholder="All Categories" /></SelectTrigger>
                  <SelectContent><SelectItem value="__all__">All Categories</SelectItem>{categories.map((c) => (<SelectItem key={c.expense_category_id} value={String(c.expense_category_id)}>{c.expense_category_name}</SelectItem>))}</SelectContent>
                </Select>
              </div>
              <div className="flex flex-wrap gap-3">
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full sm:w-auto min-h-[44px] bg-slate-50 border-slate-200 focus:bg-white" placeholder="Start date" />
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full sm:w-auto min-h-[44px] bg-slate-50 border-slate-200 focus:bg-white" placeholder="End date" />
                <Select value={status} onValueChange={(v) => setStatus(v)}>
                  <SelectTrigger className="w-full sm:w-[150px] min-h-[44px] bg-slate-50 border-slate-200 focus:bg-white"><SelectValue placeholder="All Status" /></SelectTrigger>
                  <SelectContent><SelectItem value="__all__">All Status</SelectItem><SelectItem value="approved">Approved</SelectItem><SelectItem value="pending">Pending</SelectItem><SelectItem value="rejected">Rejected</SelectItem></SelectContent>
                </Select>
              </div>
              {/* Active Filter Chips */}
              {activeFilterChips.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="text-xs text-slate-400">Active filters:</span>
                  {activeFilterChips.map((chip, i) => (
                    <button key={i} onClick={chip.onDismiss} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-xs font-medium text-amber-700 hover:bg-amber-100 transition-colors min-h-[28px]">
                      {chip.label}
                      <X className="w-3 h-3" />
                    </button>
                  ))}
                  <button onClick={clearFilters} className="text-xs text-slate-500 hover:text-slate-700 underline underline-offset-2 min-h-[28px]">Clear all</button>
                </div>
              )}
            </div>

            {/* Category Breakdown Summary */}
            {!loading && summary.categoryBreakdown.length > 0 && (
              <div className="rounded-2xl bg-white border border-slate-200/60 p-4">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">By Category This Month</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {summary.categoryBreakdown.map((cb, i) => (
                    <div key={i} className="flex items-center justify-between text-sm bg-slate-50 rounded-lg px-3 py-2">
                      <span className="text-slate-600 truncate">{cb.category}</span>
                      <span className="font-mono font-medium text-red-600 ml-2">{fmt(cb.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="rounded-2xl border border-red-200 p-6 flex flex-col items-center text-center">
                <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mb-3">
                  <AlertCircle className="w-7 h-7 text-red-500" />
                </div>
                <p className="font-medium text-slate-900">{error}</p>
                <Button variant="outline" className="mt-3 min-h-[44px]" onClick={fetchExpenses}><RefreshCw className="w-4 h-4 mr-2" /> Retry</Button>
              </div>
            )}

            {/* Data Table */}
            <div className="rounded-2xl bg-white border border-slate-200/60 overflow-hidden">
              {/* Desktop */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50 hover:bg-slate-50">
                      <TableHead className="text-xs font-semibold">Title</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? Array.from({ length: 5 }).map((_, i) => (<TableRow key={i}>{Array.from({ length: 7 }).map((_, j) => (<TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>))}</TableRow>)) :
                      expenses.length === 0 ? (
                        <TableRow><TableCell colSpan={7}>
                          <div className="flex flex-col items-center py-12 text-slate-400">
                            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
                              <TrendingDown className="w-7 h-7 text-slate-300" />
                            </div>
                            <p className="font-medium text-slate-500">No expenses found</p>
                            <p className="text-sm mt-1">{hasFilters ? "Try adjusting your filters" : "Create your first expense to get started"}</p>
                            {!hasFilters && <Button onClick={() => setAddOpen(true)} variant="outline" className="mt-3 min-h-[44px]"><Plus className="w-4 h-4 mr-2" /> Add Expense</Button>}
                          </div>
                        </TableCell></TableRow>
                      ) : expenses.map((exp) => {
                        const sc = statusConfig[exp.status] || statusConfig.pending;
                        return (
                          <TableRow key={exp.id} className="hover:bg-slate-50/50">
                            <TableCell><p className="font-medium text-sm">{exp.title}</p>{exp.description && <p className="text-xs text-slate-400 truncate max-w-48">{exp.description}</p>}</TableCell>
                            <TableCell className="text-sm">{exp.expense_category?.expense_category_name || "\u2014"}</TableCell>
                            <TableCell className="text-right font-mono text-sm font-medium text-red-600">{fmt(exp.amount)}</TableCell>
                            <TableCell className="text-xs text-slate-500">{fmtDate(exp.expense_date)}</TableCell>
                            <TableCell><span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium capitalize ${methodColors[exp.payment_method] || "bg-gray-100 text-gray-600"}`}>{exp.payment_method.replace(/_/g, " ")}</span></TableCell>
                            <TableCell><Badge variant="outline" className={sc.className}>{sc.label}</Badge></TableCell>
                            <TableCell className="text-right"><div className="flex items-center justify-end gap-1"><Button variant="ghost" size="icon" className="h-8 w-8 min-w-[32px]" onClick={() => handleEditExpense(exp)}><Pencil className="w-3.5 h-3.5" /></Button><Button variant="ghost" size="icon" className="h-8 w-8 min-w-[32px] text-red-500 hover:text-red-600" onClick={() => { setDeleteId(exp.id); setDeleteOpen(true); }}><Trash2 className="w-3.5 h-3.5" /></Button></div></TableCell>
                          </TableRow>
                        );
                      })}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile */}
              <div className="md:hidden divide-y">
                {loading ? Array.from({ length: 3 }).map((_, i) => (<div key={i} className="p-4"><Skeleton className="h-4 w-3/4 mb-2" /><Skeleton className="h-3 w-1/2" /></div>)) :
                  expenses.length === 0 ? (
                    <div className="flex flex-col items-center py-12 text-slate-400">
                      <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
                        <TrendingDown className="w-7 h-7 text-slate-300" />
                      </div>
                      <p className="font-medium text-slate-500">No expenses found</p>
                      {!hasFilters && <Button onClick={() => setAddOpen(true)} variant="outline" className="mt-3 min-h-[44px]"><Plus className="w-4 h-4 mr-2" /> Add Expense</Button>}
                    </div>
                  ) : expenses.map((exp) => {
                    const sc = statusConfig[exp.status] || statusConfig.pending;
                    return (
                      <div key={exp.id} className="p-4 space-y-2">
                        <div className="flex items-start justify-between">
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-sm">{exp.title}</p>
                            <p className="text-xs text-slate-400">{exp.expense_category?.expense_category_name || "Uncategorized"} &middot; {fmtDate(exp.expense_date)}</p>
                          </div>
                          <Badge variant="outline" className={sc.className}>{sc.label}</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium capitalize ${methodColors[exp.payment_method] || "bg-gray-100 text-gray-600"}`}>{exp.payment_method.replace(/_/g, " ")}</span>
                          <span className="font-mono font-bold text-red-600">{fmt(exp.amount)}</span>
                        </div>
                        <div className="flex gap-2 pt-1">
                          <Button variant="outline" size="sm" className="flex-1 h-9 text-xs min-h-[44px]" onClick={() => handleEditExpense(exp)}><Pencil className="w-3 h-3 mr-1" />Edit</Button>
                          <Button variant="outline" size="sm" className="h-9 text-xs text-red-500 min-h-[44px] min-w-[44px]" onClick={() => { setDeleteId(exp.id); setDeleteOpen(true); }}><Trash2 className="w-3 h-3" /></Button>
                        </div>
                      </div>
                    );
                  })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t">
                  <p className="text-xs text-slate-500">Showing {total} expense(s)</p>
                  <div className="flex items-center gap-1">
                    <Button variant="outline" size="icon" className="h-8 w-8 min-w-[32px]" disabled={page <= 1} onClick={() => setPage(page - 1)}><ChevronLeft className="w-4 h-4" /></Button>
                    <span className="text-sm px-2">{page} / {totalPages}</span>
                    <Button variant="outline" size="icon" className="h-8 w-8 min-w-[32px]" disabled={page >= totalPages} onClick={() => setPage(page + 1)}><ChevronRight className="w-4 h-4" /></Button>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="categories" className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">{categories.length} categories</p>
              <Button size="sm" onClick={() => setCatOpen(true)} className="bg-amber-500 hover:bg-amber-600 min-h-[44px]"><Plus className="w-3.5 h-3.5 mr-1" />New Category</Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {categoriesLoading ? Array.from({ length: 6 }).map((_, i) => (<div key={i} className="rounded-2xl border border-slate-200/60 p-4"><Skeleton className="h-6 w-full mb-2" /><Skeleton className="h-4 w-2/3" /></div>)) :
                categories.length === 0 ? (
                  <div className="sm:col-span-2 lg:col-span-3 rounded-2xl border border-slate-200/60 py-12 flex flex-col items-center text-slate-400">
                    <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-3"><FolderOpen className="w-7 h-7 text-slate-300" /></div>
                    <p className="font-medium text-slate-500">No categories yet</p>
                    <p className="text-sm mt-1">Create categories to organize your expenses</p>
                    <Button size="sm" onClick={() => setCatOpen(true)} variant="outline" className="mt-3 min-h-[44px]"><Plus className="w-4 h-4 mr-2" />Create Category</Button>
                  </div>
                ) : categories.map((cat) => (
                  <div key={cat.expense_category_id} className="rounded-2xl border border-slate-200/60 hover:border-amber-200 p-4 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0"><Tag className="w-5 h-5 text-amber-600" /></div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{cat.expense_category_name}</p>
                        <p className="text-xs text-slate-400">{cat.expenseCount} expense(s) &middot; {fmt(cat.totalAmount)}</p>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Add Expense Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center"><Plus className="w-4 h-4 text-amber-600" /></div>
              Add Expense
            </DialogTitle>
            <DialogDescription>Create a new expense record</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div><Label className="text-xs">Title *</Label><Input value={addForm.title} onChange={(e) => setAddForm({ ...addForm, title: e.target.value })} placeholder="e.g., Office Supplies" className="mt-1 min-h-[44px]" /></div>
            <div><Label className="text-xs">Description</Label><Input value={addForm.description} onChange={(e) => setAddForm({ ...addForm, description: e.target.value })} placeholder="Optional details" className="mt-1 min-h-[44px]" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Category</Label><Select value={addForm.categoryId} onValueChange={(v) => setAddForm({ ...addForm, categoryId: v })}><SelectTrigger className="mt-1 min-h-[44px]"><SelectValue placeholder="Select" /></SelectTrigger><SelectContent><SelectItem value="__none__">No category</SelectItem>{categories.map((c) => (<SelectItem key={c.expense_category_id} value={String(c.expense_category_id)}>{c.expense_category_name}</SelectItem>))}</SelectContent></Select></div>
              <div><Label className="text-xs">Amount *</Label><Input type="number" value={addForm.amount} onChange={(e) => setAddForm({ ...addForm, amount: e.target.value })} placeholder="0" className="mt-1 min-h-[44px] font-mono" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Date</Label><Input type="date" value={addForm.expenseDate} onChange={(e) => setAddForm({ ...addForm, expenseDate: e.target.value })} className="mt-1 min-h-[44px]" /></div>
              <div><Label className="text-xs">Payment Method</Label><Select value={addForm.paymentMethod} onValueChange={(v) => setAddForm({ ...addForm, paymentMethod: v })}><SelectTrigger className="mt-1 min-h-[44px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="cash">Cash</SelectItem><SelectItem value="mobile_money">Mobile Money</SelectItem><SelectItem value="bank_transfer">Bank Transfer</SelectItem><SelectItem value="cheque">Cheque</SelectItem><SelectItem value="card">Card</SelectItem></SelectContent></Select></div>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setAddOpen(false)} className="min-h-[44px]">Cancel</Button>
            <Button onClick={handleAddExpense} disabled={adding} className="bg-amber-500 hover:bg-amber-600 min-h-[44px]">
              {adding && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {adding ? "Adding..." : "Add Expense"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Expense Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center"><Pencil className="w-4 h-4 text-amber-600" /></div>
              Edit Expense
            </DialogTitle>
            <DialogDescription>Update expense details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div><Label className="text-xs">Title</Label><Input value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} className="mt-1 min-h-[44px]" /></div>
            <div><Label className="text-xs">Description</Label><Input value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} className="mt-1 min-h-[44px]" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Category</Label><Select value={editForm.categoryId} onValueChange={(v) => setEditForm({ ...editForm, categoryId: v })}><SelectTrigger className="mt-1 min-h-[44px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="__none__">No category</SelectItem>{categories.map((c) => (<SelectItem key={c.expense_category_id} value={String(c.expense_category_id)}>{c.expense_category_name}</SelectItem>))}</SelectContent></Select></div>
              <div><Label className="text-xs">Amount</Label><Input type="number" value={editForm.amount} onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })} className="mt-1 min-h-[44px] font-mono" /></div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div><Label className="text-xs">Date</Label><Input type="date" value={editForm.expenseDate} onChange={(e) => setEditForm({ ...editForm, expenseDate: e.target.value })} className="mt-1 min-h-[44px]" /></div>
              <div><Label className="text-xs">Method</Label><Select value={editForm.paymentMethod} onValueChange={(v) => setEditForm({ ...editForm, paymentMethod: v })}><SelectTrigger className="mt-1 min-h-[44px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="cash">Cash</SelectItem><SelectItem value="mobile_money">Mobile Money</SelectItem><SelectItem value="bank_transfer">Bank Transfer</SelectItem><SelectItem value="cheque">Cheque</SelectItem><SelectItem value="card">Card</SelectItem></SelectContent></Select></div>
              <div><Label className="text-xs">Status</Label><Select value={editForm.status} onValueChange={(v) => setEditForm({ ...editForm, status: v })}><SelectTrigger className="mt-1 min-h-[44px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="approved">Approved</SelectItem><SelectItem value="pending">Pending</SelectItem><SelectItem value="rejected">Rejected</SelectItem></SelectContent></Select></div>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setEditOpen(false)} className="min-h-[44px]">Cancel</Button>
            <Button onClick={handleSaveEdit} disabled={editing} className="bg-amber-500 hover:bg-amber-600 min-h-[44px]">
              {editing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editing ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center"><Trash2 className="w-4 h-4 text-red-600" /></div>
              Delete Expense
            </AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to delete this expense? This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="min-h-[44px]">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteExpense} disabled={deleting} className="bg-red-600 hover:bg-red-700 min-h-[44px]">
              {deleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* New Category Dialog */}
      <Dialog open={catOpen} onOpenChange={setCatOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center"><Tag className="w-4 h-4 text-amber-600" /></div>
              New Expense Category
            </DialogTitle>
            <DialogDescription>Category name for expense grouping</DialogDescription>
          </DialogHeader>
          <div><Label className="text-xs">Category Name</Label><Input value={newCatName} onChange={(e) => setNewCatName(e.target.value)} placeholder="e.g., Utilities" className="mt-1 min-h-[44px]" onKeyDown={(e) => e.key === "Enter" && handleCreateCategory()} /></div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setCatOpen(false)} className="min-h-[44px]">Cancel</Button>
            <Button onClick={handleCreateCategory} disabled={creatingCat} className="bg-amber-500 hover:bg-amber-600 min-h-[44px]">
              {creatingCat && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {creatingCat ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
