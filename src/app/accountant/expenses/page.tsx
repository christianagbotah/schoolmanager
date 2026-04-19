"use client";

import { useEffect, useState, useCallback } from "react";
import {
  AlertTriangle,
  DollarSign,
  Plus,
  Loader2,
  Search,
  Save,
  TrendingDown,
  CheckCircle2,
  XCircle,
  Clock,
  Filter,
  Eye,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import { Bar, BarChart, XAxis, YAxis, CartesianGrid, Cell, PieChart, Pie } from "recharts";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { format } from "date-fns";

// ─── Types ───────────────────────────────────────────────────
interface ExpenseItem {
  id: number;
  title: string;
  description: string;
  amount: number;
  expense_date: string | null;
  payment_method: string;
  status: string;
  expense_category: { expense_category_id: number; expense_category_name: string } | null;
}

interface CategoryItem {
  expense_category_id: number;
  expense_category_name: string;
  expenseCount: number;
  totalAmount: number;
}

interface CategoryBreakdown {
  category: string;
  amount: number;
}

// ─── Helpers ─────────────────────────────────────────────────
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "GHS", minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(amount);
}

function statusBadge(status: string) {
  switch (status) {
    case "approved": return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100">Approved</Badge>;
    case "pending": return <Badge className="bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100">Pending</Badge>;
    case "rejected": return <Badge className="bg-red-100 text-red-700 border-red-200 hover:bg-red-100">Rejected</Badge>;
    default: return <Badge variant="secondary">{status}</Badge>;
  }
}

const COLORS = ["#10b981", "#f59e0b", "#ef4444", "#3b82f6", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"];
const chartConfig = { amount: { label: "Expenses", color: "#f59e0b" } };
const pieConfig = { value: { label: "Amount" } };

// ─── Main Component ──────────────────────────────────────────
export default function AccountantExpensesPage() {
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [categoryBreakdown, setCategoryBreakdown] = useState<CategoryBreakdown[]>([]);
  const [monthTotal, setMonthTotal] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Stats
  const [stats, setStats] = useState<{ pending: { count: number; amount: number }; approved: { count: number; amount: number }; rejected: { count: number; amount: number } } | null>(null);

  // Add expense form
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formTitle, setFormTitle] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [formCategory, setFormCategory] = useState("");
  const [formMethod, setFormMethod] = useState("cash");
  const [formDate, setFormDate] = useState(new Date().toISOString().split("T")[0]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ type: string; text: string } | null>(null);

  // Approve/Reject dialog
  const [actionDialog, setActionDialog] = useState<{ open: boolean; id: number; action: string }>({ open: false, id: 0, action: "" });

  // View dialog
  const [viewExpense, setViewExpense] = useState<ExpenseItem | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ limit: "100" });
      if (search) params.set("search", search);
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (categoryFilter !== "all") params.set("categoryId", categoryFilter);

      const [expRes, catRes] = await Promise.all([
        fetch(`/api/accountant/expenses?${params}`),
        fetch("/api/accountant/expenses/categories"),
      ]);

      if (expRes.ok) {
        const data = await expRes.json();
        setExpenses(data.expenses || []);
        setMonthTotal(data.summary?.monthTotal || 0);
        setTotalAmount(data.summary?.total || 0);
        setTotalCount(data.summary?.totalCount || 0);
        setCategoryBreakdown(data.categoryBreakdown || []);
        setStats(data.stats || null);
      }
      if (catRes.ok) {
        const catData = await catRes.json();
        setCategories(Array.isArray(catData) ? catData : []);
      }
    } catch {
      setError("Failed to load expenses");
    } finally {
      setIsLoading(false);
    }
  }, [search, statusFilter, categoryFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSave = async () => {
    if (!formTitle || !formAmount) return;
    setIsSaving(true);
    setSaveMsg(null);
    try {
      const res = await fetch("/api/accountant/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formTitle,
          description: formDesc,
          categoryId: formCategory || null,
          amount: parseFloat(formAmount),
          expenseDate: formDate,
          paymentMethod: formMethod,
          status: "approved",
        }),
      });
      if (!res.ok) throw new Error("Failed");
      setSaveMsg({ type: "success", text: "Expense recorded successfully" });
      setFormTitle(""); setFormDesc(""); setFormAmount(""); setFormCategory("");
      fetchData();
    } catch {
      setSaveMsg({ type: "error", text: "Failed to record expense" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleStatusChange = async () => {
    if (!actionDialog.id) return;
    try {
      const res = await fetch("/api/accountant/expenses", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: actionDialog.id, status: actionDialog.action }),
      });
      if (res.ok) fetchData();
    } catch { /* silent */ }
    setActionDialog({ open: false, id: 0, action: "" });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 p-6 text-white shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                <TrendingDown className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Expense Management</h1>
                <p className="text-amber-100 text-sm">Track and manage all school expenses</p>
              </div>
            </div>
            <Button className="bg-white text-amber-700 hover:bg-amber-50 min-w-[44px] min-h-[44px] font-semibold" onClick={() => setDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />Add Expense
            </Button>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="py-3 border-l-4 border-l-slate-500"><CardContent className="px-3 pt-0 pb-0"><p className="text-xs text-slate-500">Total Expenses</p><p className="text-lg font-bold text-slate-900 tabular-nums">{formatCurrency(totalAmount)}</p><p className="text-xs text-slate-400">{totalCount} items</p></CardContent></Card>
          <Card className="py-3 border-l-4 border-l-red-500"><CardContent className="px-3 pt-0 pb-0"><div className="flex items-center gap-1"><Clock className="w-3 h-3 text-red-500" /><p className="text-xs text-slate-500">Pending</p></div><p className="text-lg font-bold text-red-600 tabular-nums">{formatCurrency(stats?.pending.amount || 0)}</p><p className="text-xs text-slate-400">{stats?.pending.count || 0} items</p></CardContent></Card>
          <Card className="py-3 border-l-4 border-l-emerald-500"><CardContent className="px-3 pt-0 pb-0"><div className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-emerald-500" /><p className="text-xs text-slate-500">Approved</p></div><p className="text-lg font-bold text-emerald-600 tabular-nums">{formatCurrency(stats?.approved.amount || 0)}</p><p className="text-xs text-slate-400">{stats?.approved.count || 0} items</p></CardContent></Card>
          <Card className="py-3 border-l-4 border-l-amber-500"><CardContent className="px-3 pt-0 pb-0"><div className="flex items-center gap-1"><TrendingDown className="w-3 h-3 text-amber-500" /><p className="text-xs text-slate-500">This Month</p></div><p className="text-lg font-bold text-amber-600 tabular-nums">{formatCurrency(monthTotal)}</p><p className="text-xs text-slate-400">Current month</p></CardContent></Card>
        </div>

        {/* Category Breakdown Chart */}
        {categoryBreakdown.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 gap-4">
              <CardHeader className="pb-0">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center"><TrendingDown className="w-4 h-4 text-amber-600" /></div>
                  <CardTitle className="text-base font-semibold">Category Breakdown (Month)</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <ChartContainer config={chartConfig} className="h-[220px] w-full">
                  <BarChart data={categoryBreakdown} layout="vertical" margin={{ top: 5, right: 10, left: 80, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11, fill: "#94a3b8" }} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)} />
                    <YAxis type="category" dataKey="category" tick={{ fontSize: 11, fill: "#64748b" }} width={75} />
                    <ChartTooltip content={<ChartTooltipContent formatter={(value) => formatCurrency(value as number)} />} />
                    <Bar dataKey="amount" radius={[0, 4, 4, 0]} maxBarSize={24}>
                      {categoryBreakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card className="gap-4">
              <CardHeader className="pb-0">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center"><DollarSign className="w-4 h-4 text-purple-600" /></div>
                  <CardTitle className="text-base font-semibold">Distribution</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <ChartContainer config={pieConfig} className="h-[220px] w-full">
                  <PieChart>
                    <ChartTooltip content={<ChartTooltipContent formatter={(value) => formatCurrency(value as number)} />} />
                    <Pie data={categoryBreakdown} cx="50%" cy="45%" innerRadius={45} outerRadius={75} paddingAngle={3} dataKey="amount" nameKey="category" stroke="none">
                      {categoryBreakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <ChartLegend content={<ChartLegendContent />} verticalAlign="bottom" />
                  </PieChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card className="gap-4">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Search</Label>
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input placeholder="Search expenses..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v)}>
                  <SelectTrigger><SelectValue placeholder="All categories" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map(c => <SelectItem key={c.expense_category_id} value={String(c.expense_category_id)}>{c.expense_category_name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v)}>
                  <SelectTrigger><SelectValue placeholder="All statuses" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {error && (
          <div className="flex items-center gap-3 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />{error}
          </div>
        )}

        {/* Table */}
        <Card className="gap-4">
          <CardContent className="pt-6">
            {isLoading ? (
              <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
            ) : expenses.length === 0 ? (
              <div className="text-center py-12"><DollarSign className="w-12 h-12 text-slate-300 mx-auto mb-3" /><p className="text-slate-400 text-sm">No expenses found</p></div>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-slate-200 max-h-[500px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50 hover:bg-slate-50">
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase">Title</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase hidden sm:table-cell">Category</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase text-right">Amount</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase hidden md:table-cell">Method</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase hidden md:table-cell">Date</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase text-center">Status</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expenses.map((e) => (
                      <TableRow key={e.id} className="hover:bg-slate-50">
                        <TableCell className="font-medium text-sm">{e.title}</TableCell>
                        <TableCell className="hidden sm:table-cell text-sm text-slate-500">{e.expense_category?.expense_category_name || "—"}</TableCell>
                        <TableCell className="text-right font-semibold text-sm text-red-600 tabular-nums">{formatCurrency(e.amount)}</TableCell>
                        <TableCell className="hidden md:table-cell text-sm text-slate-500 capitalize">{e.payment_method?.replace(/_/g, " ")}</TableCell>
                        <TableCell className="hidden md:table-cell text-sm text-slate-500">{e.expense_date ? format(new Date(e.expense_date), "MMM d, yyyy") : "—"}</TableCell>
                        <TableCell className="text-center">{statusBadge(e.status)}</TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setViewExpense(e)}><Eye className="w-4 h-4" /></Button>
                            {e.status === "pending" && (
                              <>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                  onClick={() => setActionDialog({ open: true, id: e.id, action: "approved" })}><CheckCircle2 className="w-4 h-4" /></Button>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                  onClick={() => setActionDialog({ open: true, id: e.id, action: "rejected" })}><XCircle className="w-4 h-4" /></Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add Expense Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Add New Expense</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-2">
              {saveMsg && (
                <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${saveMsg.type === "success" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                  {saveMsg.text}
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Title *</Label><Input value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="Expense title" /></div>
                <div className="space-y-2"><Label>Amount *</Label><Input type="number" min={0} step={0.01} value={formAmount} onChange={(e) => setFormAmount(e.target.value)} placeholder="0.00" /></div>
                <div className="space-y-2"><Label>Category</Label>
                  <Select value={formCategory} onValueChange={setFormCategory}>
                    <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                    <SelectContent>{categories.map(c => <SelectItem key={c.expense_category_id} value={String(c.expense_category_id)}>{c.expense_category_name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>Date</Label><Input type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} /></div>
                <div className="space-y-2"><Label>Payment Method</Label>
                  <Select value={formMethod} onValueChange={setFormMethod}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      <SelectItem value="cheque">Cheque</SelectItem>
                      <SelectItem value="mobile_money">Mobile Money</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2"><Label>Description</Label><Textarea value={formDesc} onChange={(e) => setFormDesc(e.target.value)} placeholder="Optional description" /></div>
              <Button onClick={handleSave} disabled={isSaving || !formTitle || !formAmount} className="w-full bg-amber-600 hover:bg-amber-700 min-h-[44px]">
                {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Save Expense
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Approve/Reject Dialog */}
        <AlertDialog open={actionDialog.open} onOpenChange={(open) => { if (!open) setActionDialog({ open: false, id: 0, action: "" }); }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{actionDialog.action === "approved" ? "Approve" : "Reject"} Expense</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to {actionDialog.action} this expense? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleStatusChange}
                className={actionDialog.action === "approved" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-600 hover:bg-red-700"}>
                {actionDialog.action === "approved" ? "Approve" : "Reject"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* View Expense Dialog */}
        <Dialog open={!!viewExpense} onOpenChange={() => setViewExpense(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle>Expense Details</DialogTitle></DialogHeader>
            {viewExpense && (
              <div className="space-y-4 mt-2">
                <div className="grid grid-cols-2 gap-3">
                  <div><p className="text-xs text-slate-500">Title</p><p className="font-semibold">{viewExpense.title}</p></div>
                  <div><p className="text-xs text-slate-500">Amount</p><p className="font-semibold text-red-600">{formatCurrency(viewExpense.amount)}</p></div>
                  <div><p className="text-xs text-slate-500">Category</p><p className="font-semibold">{viewExpense.expense_category?.expense_category_name || "—"}</p></div>
                  <div><p className="text-xs text-slate-500">Status</p><div className="mt-0.5">{statusBadge(viewExpense.status)}</div></div>
                  <div><p className="text-xs text-slate-500">Payment Method</p><p className="font-semibold capitalize">{viewExpense.payment_method?.replace(/_/g, " ")}</p></div>
                  <div><p className="text-xs text-slate-500">Date</p><p className="font-semibold">{viewExpense.expense_date ? format(new Date(viewExpense.expense_date), "MMM d, yyyy") : "—"}</p></div>
                </div>
                {viewExpense.description && (
                  <div className="p-3 rounded-lg bg-slate-50"><p className="text-xs text-slate-500 mb-1">Description</p><p className="text-sm">{viewExpense.description}</p></div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
