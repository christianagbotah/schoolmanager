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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import { Bar, BarChart, XAxis, YAxis, CartesianGrid, Cell } from "recharts";
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

interface CategoryBreakdown {
  category: string;
  amount: number;
}

// ─── Helpers ─────────────────────────────────────────────────
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "GHS", minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(amount);
}

const COLORS = ["#10b981", "#f59e0b", "#ef4444", "#3b82f6", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"];
const chartConfig = { amount: { label: "Expenses", color: "#f59e0b" } };

// ─── Main Component ──────────────────────────────────────────
export default function AccountantExpensesPage() {
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [categories, setCategories] = useState<{ expense_category_id: number; expense_category_name: string }[]>([]);
  const [categoryBreakdown, setCategoryBreakdown] = useState<CategoryBreakdown[]>([]);
  const [monthTotal, setMonthTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formTitle, setFormTitle] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [formCategory, setFormCategory] = useState("");
  const [formMethod, setFormMethod] = useState("cash");
  const [formDate, setFormDate] = useState(new Date().toISOString().split("T")[0]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ type: string; text: string } | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/expenses?limit=100");
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setExpenses(data.expenses || []);
      setMonthTotal(data.summary?.monthTotal || 0);
      setCategoryBreakdown(data.summary?.categoryBreakdown || []);

      // Fetch categories
      const catRes = await fetch("/api/expense-categories");
      if (catRes.ok) {
        const catData = await catRes.json();
        setCategories(Array.isArray(catData) ? catData : []);
      }
    } catch {
      setError("Failed to load expenses");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = search
    ? expenses.filter(e => e.title.toLowerCase().includes(search.toLowerCase()) || e.description?.toLowerCase().includes(search.toLowerCase()))
    : expenses;

  const handleSave = async () => {
    if (!formTitle || !formAmount) return;
    setIsSaving(true);
    setSaveMsg(null);
    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formTitle,
          description: formDesc,
          categoryId: formCategory || null,
          amount: parseFloat(formAmount),
          expenseDate: formDate,
          paymentMethod: formMethod,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      setSaveMsg({ type: "success", text: "Expense recorded successfully" });
      setDialogOpen(false);
      setFormTitle("");
      setFormDesc("");
      setFormAmount("");
      setFormCategory("");
      fetchData();
    } catch {
      setSaveMsg({ type: "error", text: "Failed to record expense" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Expenses</h1>
            <p className="text-sm text-slate-500 mt-1">Track and manage school expenses</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-emerald-600 hover:bg-emerald-700 min-w-[44px] min-h-[44px]">
                <Plus className="w-4 h-4 mr-2" />Add Expense
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add New Expense</DialogTitle></DialogHeader>
              <div className="space-y-4 mt-4">
                {saveMsg && (
                  <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${saveMsg.type === "success" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                    {saveMsg.text}
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Title *</Label><Input value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="Expense title" /></div>
                  <div className="space-y-2"><Label>Amount *</Label><Input type="number" min={0} value={formAmount} onChange={(e) => setFormAmount(e.target.value)} placeholder="0.00" /></div>
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
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2"><Label>Description</Label><Textarea value={formDesc} onChange={(e) => setFormDesc(e.target.value)} placeholder="Optional description" /></div>
                <Button onClick={handleSave} disabled={isSaving || !formTitle || !formAmount} className="w-full bg-emerald-600 hover:bg-emerald-700 min-h-[44px]">
                  {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  Save Expense
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Summary & Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="py-4 border-l-4 border-l-red-500">
            <CardContent className="px-4 pb-0 pt-0">
              <p className="text-xs font-medium text-slate-500">Month Total</p>
              <p className="text-2xl font-bold text-red-600 tabular-nums">{formatCurrency(monthTotal)}</p>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2 gap-4">
            <CardHeader className="pb-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center"><TrendingDown className="w-4 h-4 text-amber-600" /></div>
                <CardTitle className="text-base font-semibold">Category Breakdown</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <ChartContainer config={chartConfig} className="h-[200px] w-full">
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
        </div>

        {/* Search */}
        <Card className="gap-4">
          <CardContent className="pt-6">
            <div className="space-y-2">
              <Label>Search Expenses</Label>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input placeholder="Search by title..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
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
            ) : filtered.length === 0 ? (
              <div className="text-center py-12"><DollarSign className="w-12 h-12 text-slate-300 mx-auto mb-3" /><p className="text-slate-400 text-sm">No expenses found</p></div>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-slate-200 max-h-[500px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50 hover:bg-slate-50">
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase">Title</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase hidden sm:table-cell">Category</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase text-right">Amount</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase hidden sm:table-cell">Method</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase hidden md:table-cell">Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((e) => (
                      <TableRow key={e.id} className="hover:bg-slate-50">
                        <TableCell className="font-medium text-sm">{e.title}</TableCell>
                        <TableCell className="hidden sm:table-cell text-sm text-slate-500">{e.expense_category?.expense_category_name || "—"}</TableCell>
                        <TableCell className="text-right font-semibold text-sm text-red-600 tabular-nums">{formatCurrency(e.amount)}</TableCell>
                        <TableCell className="hidden sm:table-cell text-sm text-slate-500 capitalize">{e.payment_method?.replace(/_/g, " ")}</TableCell>
                        <TableCell className="hidden md:table-cell text-sm text-slate-500">{e.expense_date ? format(new Date(e.expense_date), "MMM d, yyyy") : "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
