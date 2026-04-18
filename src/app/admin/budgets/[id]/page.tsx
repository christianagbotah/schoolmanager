"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Wallet, ArrowLeft, Save, Plus, Trash2, AlertCircle, RefreshCw,
  Pencil, X, Check, CircleDollarSign, TrendingUp, TrendingDown,
  FileText, Activity,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

/* ─── Types ─── */
interface BudgetLine {
  budget_line_id?: number;
  budget_id?: number;
  account_id?: number | null;
  chart_of_accounts?: {
    account_id: number;
    account_code: string;
    account_name: string;
    account_type: string;
    account_category: string;
  } | null;
  category: string;
  description: string;
  budgeted_amount: number;
  actual_amount: number;
  variance: number;
}

interface UtilizationLog {
  budget_utilization_log_id: number;
  budget_line_id: number;
  transaction_type: string;
  amount: number;
  description: string;
  created_at: string | null;
  created_by: string;
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
  fiscal_years: {
    fiscal_year_id: number;
    name: string;
    start_date: string | null;
    end_date: string | null;
    status: string;
  } | null;
  department: { id: number; dep_name: string } | null;
}

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

const STATUS_OPTIONS = ["draft", "active", "approved", "closed"];

export default function BudgetDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const budgetId = Number(params.id);

  const [budget, setBudget] = useState<Budget | null>(null);
  const [lines, setLines] = useState<BudgetLine[]>([]);
  const [utilizationLogs, setUtilizationLogs] = useState<UtilizationLog[]>([]);
  const [summary, setSummary] = useState({ totalBudgeted: 0, totalActual: 0, totalVariance: 0, lineCount: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Edit mode
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", status: "", description: "", totalAmount: "" });
  const [editLines, setEditLines] = useState<BudgetLine[]>([]);
  const [saving, setSaving] = useState(false);

  // Add line
  const [addLineOpen, setAddLineOpen] = useState(false);
  const [newLine, setNewLine] = useState({ category: "", description: "", budgeted_amount: 0, account_id: null as number | null });
  const [addingLine, setAddingLine] = useState(false);

  // Utilization
  const [utilOpen, setUtilOpen] = useState(false);
  const [utilForm, setUtilForm] = useState({ lineId: 0, amount: "", transaction_type: "expense", description: "", createdBy: "" });
  const [addingUtil, setAddingUtil] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/budgets/${budgetId}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setBudget(data.budget);
      setLines(data.lines || []);
      setUtilizationLogs(data.utilizationLogs || []);
      setSummary(data.summary || { totalBudgeted: 0, totalActual: 0, totalVariance: 0, lineCount: 0 });
      setEditForm({
        name: data.budget.name,
        status: data.budget.status,
        description: data.budget.description,
        totalAmount: String(data.budget.total_amount),
      });
      setEditLines(data.lines || []);
    } catch {
      setError("Failed to load budget");
    }
    setLoading(false);
  }, [budgetId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  /* ─── Save Edit ─── */
  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/budgets/${budgetId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editForm.name,
          status: editForm.status,
          description: editForm.description,
          totalAmount: editForm.totalAmount,
          lines: editLines,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast({ title: "Budget updated" });
      setEditing(false);
      fetchData();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to update";
      toast({ title: msg, variant: "destructive" });
    }
    setSaving(false);
  };

  /* ─── Add Line ─── */
  const handleAddLine = async () => {
    if (!newLine.description && newLine.budgeted_amount === 0) {
      toast({ title: "Provide a description or amount", variant: "destructive" });
      return;
    }
    setAddingLine(true);
    try {
      const updatedLines = [
        ...editLines,
        {
          category: newLine.category,
          description: newLine.description,
          budgeted_amount: newLine.budgeted_amount,
          actual_amount: 0,
          variance: newLine.budgeted_amount,
        },
      ];
      const res = await fetch(`/api/admin/budgets/${budgetId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editForm.name,
          status: editForm.status,
          description: editForm.description,
          totalAmount: editForm.totalAmount,
          lines: updatedLines,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast({ title: "Budget line added" });
      setAddLineOpen(false);
      setNewLine({ category: "", description: "", budgeted_amount: 0, account_id: null });
      setEditing(true);
      setEditLines(updatedLines);
      fetchData();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to add line";
      toast({ title: msg, variant: "destructive" });
    }
    setAddingLine(false);
  };

  /* ─── Remove Line ─── */
  const handleRemoveLine = async (lineId: number) => {
    const updatedLines = editLines.filter((l) => l.budget_line_id !== lineId);
    setEditLines(updatedLines);
    // Auto-save after removal
    setSaving(true);
    try {
      await fetch(`/api/admin/budgets/${budgetId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editForm.name,
          status: editForm.status,
          description: editForm.description,
          totalAmount: editForm.totalAmount,
          lines: updatedLines,
        }),
      });
      toast({ title: "Line removed" });
      fetchData();
    } catch {
      toast({ title: "Failed to remove line", variant: "destructive" });
    }
    setSaving(false);
  };

  /* ─── Add Utilization ─── */
  const handleAddUtil = async () => {
    if (!utilForm.amount || !utilForm.lineId) {
      toast({ title: "Select a line and enter amount", variant: "destructive" });
      return;
    }
    setAddingUtil(true);
    try {
      // Get current line
      const currentLine = lines.find((l) => l.budget_line_id === utilForm.lineId);
      if (!currentLine) throw new Error("Line not found");

      const newActual = (currentLine.actual_amount || 0) + Number(utilForm.amount);
      const newBudgeted = currentLine.budgeted_amount;

      // Update the line's actual_amount
      const updatedLines = lines.map((l) => {
        if (l.budget_line_id === utilForm.lineId) {
          return { ...l, actual_amount: newActual, variance: newBudgeted - newActual };
        }
        return l;
      });

      await fetch(`/api/admin/budgets/${budgetId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: budget?.name,
          status: budget?.status,
          description: budget?.description,
          totalAmount: String(budget?.total_amount || 0),
          lines: updatedLines,
        }),
      });

      // Create utilization log
      await fetch("/api/admin/budgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      toast({ title: "Utilization recorded" });
      setUtilOpen(false);
      setUtilForm({ lineId: 0, amount: "", transaction_type: "expense", description: "", createdBy: "" });
      fetchData();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to record utilization";
      toast({ title: msg, variant: "destructive" });
    }
    setAddingUtil(false);
  };

  const utilizationPercent = summary.totalBudgeted > 0 ? Math.round((summary.totalActual / summary.totalBudgeted) * 100) : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}><CardContent className="p-4"><Skeleton className="h-20 w-full" /></CardContent></Card>
            ))}
          </div>
          <Card><CardContent className="p-4"><Skeleton className="h-64 w-full" /></CardContent></Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <Card className="max-w-md w-full border-red-200">
          <CardContent className="p-6 flex flex-col items-center text-center">
            <AlertCircle className="w-10 h-10 text-red-500 mb-3" />
            <p className="font-medium text-slate-900">{error}</p>
            <Button variant="outline" className="mt-3" onClick={fetchData}>
              <RefreshCw className="w-4 h-4 mr-2" />Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!budget) return null;

  const sc = statusConfig[budget.status] || statusConfig.draft;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 h-10 w-10" onClick={() => router.push("/admin/budgets")}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-bold">{budget.name}</h1>
                  <Badge className={`${sc.className} border`}>{sc.label}</Badge>
                </div>
                <p className="text-emerald-200 text-xs">{budget.fiscal_years?.name || "No fiscal year"} &middot; {budget.description || "No description"}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!editing ? (
                <Button onClick={() => setEditing(true)} variant="outline" className="bg-white/10 border-white/30 text-white hover:bg-white/20 min-h-[44px]">
                  <Pencil className="w-4 h-4 mr-2" />Edit
                </Button>
              ) : (
                <>
                  <Button variant="outline" onClick={() => { setEditing(false); fetchData(); }} className="bg-white/10 border-white/30 text-white hover:bg-white/20 min-h-[44px]">
                    <X className="w-4 h-4 mr-2" />Cancel
                  </Button>
                  <Button onClick={handleSave} disabled={saving} className="bg-white text-emerald-600 hover:bg-white/90 min-h-[44px]">
                    <Save className="w-4 h-4 mr-2" />{saving ? "Saving..." : "Save"}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-violet-100 bg-violet-50/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-violet-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-slate-500">Total Budgeted</p>
                  <p className="text-lg font-bold text-violet-600">{fmt(summary.totalBudgeted)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-orange-100 bg-orange-50/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                  <TrendingDown className="w-5 h-5 text-orange-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-slate-500">Total Spent</p>
                  <p className="text-lg font-bold text-orange-600">{fmt(summary.totalActual)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-teal-100 bg-teal-50/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center">
                  <CircleDollarSign className="w-5 h-5 text-teal-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-slate-500">Remaining</p>
                  <p className="text-lg font-bold text-teal-600">{fmt(summary.totalVariance)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="col-span-2 lg:col-span-1">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-sky-100 flex items-center justify-center">
                  <Activity className="w-5 h-5 text-sky-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-slate-500">Utilization</p>
                  <p className="text-lg font-bold text-sky-600">{utilizationPercent}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Utilization Bar (CSS-based) */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-600" />Budget Utilization
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-slate-500">
                <span>0%</span>
                <span className="font-medium text-slate-700">{utilizationPercent}% utilized ({fmt(summary.totalActual)} of {fmt(summary.totalBudgeted)})</span>
                <span>100%</span>
              </div>
              <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${utilizationPercent > 90 ? "bg-red-500" : utilizationPercent > 70 ? "bg-amber-500" : "bg-emerald-500"}`}
                  style={{ width: `${Math.min(utilizationPercent, 100)}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="lines" className="space-y-4">
          <TabsList className="bg-white border border-slate-200 p-1 rounded-xl h-auto flex w-full sm:w-auto">
            <TabsTrigger value="lines" className="flex-1 min-w-[100px] data-[state=active]:bg-emerald-500 data-[state=active]:text-white rounded-lg py-2">
              <FileText className="w-4 h-4 mr-1" />Budget Lines
            </TabsTrigger>
            <TabsTrigger value="detail" className="flex-1 min-w-[100px] data-[state=active]:bg-emerald-500 data-[state=active]:text-white rounded-lg py-2">
              <Wallet className="w-4 h-4 mr-1" />Details
            </TabsTrigger>
            <TabsTrigger value="logs" className="flex-1 min-w-[100px] data-[state=active]:bg-emerald-500 data-[state=active]:text-white rounded-lg py-2">
              <Activity className="w-4 h-4 mr-1" />Activity
            </TabsTrigger>
          </TabsList>

          {/* Budget Lines Tab */}
          <TabsContent value="lines" className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">{lines.length} budget line(s)</p>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => setUtilOpen(true)} className="bg-orange-500 hover:bg-orange-600 text-white gap-1">
                  <TrendingDown className="w-3.5 h-3.5" />Record Expense
                </Button>
                <Button size="sm" onClick={() => setAddLineOpen(true)} className="bg-emerald-500 hover:bg-emerald-600 text-white gap-1">
                  <Plus className="w-3.5 h-3.5" />Add Line
                </Button>
              </div>
            </div>
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50">
                        <TableHead className="text-xs font-semibold">Category</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Budgeted</TableHead>
                        <TableHead className="text-right">Actual</TableHead>
                        <TableHead className="text-right">Variance</TableHead>
                        <TableHead>Utilization</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lines.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-12 text-slate-400">
                            <FileText className="w-10 h-10 mx-auto mb-2 opacity-50" />
                            <p>No budget lines yet</p>
                          </TableCell>
                        </TableRow>
                      ) : lines.map((line) => {
                        const lineUtil = line.budgeted_amount > 0 ? Math.round((line.actual_amount / line.budgeted_amount) * 100) : 0;
                        return (
                          <TableRow key={line.budget_line_id} className="hover:bg-slate-50/50">
                            <TableCell>
                              {editing ? (
                                <Select value={line.category || ""} onValueChange={(v) => {
                                  const updated = editLines.map((l) => l.budget_line_id === line.budget_line_id ? { ...l, category: v } : l);
                                  setEditLines(updated);
                                }}>
                                  <SelectTrigger className="h-8 w-[140px] text-xs"><SelectValue placeholder="Select" /></SelectTrigger>
                                  <SelectContent>
                                    {CATEGORY_OPTIONS.map((c) => (<SelectItem key={c} value={c}>{c}</SelectItem>))}
                                  </SelectContent>
                                </Select>
                              ) : (
                                <Badge variant="secondary" className="text-xs">{line.category || "—"}</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              {editing ? (
                                <Input
                                  value={editLines.find((l) => l.budget_line_id === line.budget_line_id)?.description || ""}
                                  onChange={(e) => {
                                    const updated = editLines.map((l) => l.budget_line_id === line.budget_line_id ? { ...l, description: e.target.value } : l);
                                    setEditLines(updated);
                                  }}
                                  className="h-8 text-xs"
                                />
                              ) : (
                                <span className="text-sm">{line.description || "—"}</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              {editing ? (
                                <Input
                                  type="number"
                                  value={editLines.find((l) => l.budget_line_id === line.budget_line_id)?.budgeted_amount || ""}
                                  onChange={(e) => {
                                    const updated = editLines.map((l) => {
                                      if (l.budget_line_id === line.budget_line_id) {
                                        const ba = parseFloat(e.target.value) || 0;
                                        return { ...l, budgeted_amount: ba, variance: ba - l.actual_amount };
                                      }
                                      return l;
                                    });
                                    setEditLines(updated);
                                  }}
                                  className="h-8 w-28 text-xs font-mono text-right ml-auto"
                                />
                              ) : (
                                <span className="font-mono text-sm">{fmt(line.budgeted_amount)}</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              {editing ? (
                                <Input
                                  type="number"
                                  value={editLines.find((l) => l.budget_line_id === line.budget_line_id)?.actual_amount || ""}
                                  onChange={(e) => {
                                    const updated = editLines.map((l) => {
                                      if (l.budget_line_id === line.budget_line_id) {
                                        const aa = parseFloat(e.target.value) || 0;
                                        return { ...l, actual_amount: aa, variance: l.budgeted_amount - aa };
                                      }
                                      return l;
                                    });
                                    setEditLines(updated);
                                  }}
                                  className="h-8 w-28 text-xs font-mono text-right ml-auto"
                                />
                              ) : (
                                <span className="font-mono text-sm text-orange-600">{fmt(line.actual_amount)}</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <span className={`font-mono text-sm font-medium ${line.variance < 0 ? "text-red-600" : "text-teal-600"}`}>
                                {fmt(line.variance)}
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2 min-w-[100px]">
                                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${lineUtil > 90 ? "bg-red-500" : lineUtil > 70 ? "bg-amber-500" : "bg-emerald-500"}`}
                                    style={{ width: `${Math.min(lineUtil, 100)}%` }}
                                  />
                                </div>
                                <span className="text-xs text-slate-500 w-8 text-right">{lineUtil}%</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              {editing && (
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600" onClick={() => handleRemoveLine(line.budget_line_id!)}>
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Details Tab */}
          <TabsContent value="detail" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Budget Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {editing ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs">Name</Label>
                      <Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="mt-1" />
                    </div>
                    <div>
                      <Label className="text-xs">Status</Label>
                      <Select value={editForm.status} onValueChange={(v) => setEditForm({ ...editForm, status: v })}>
                        <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {STATUS_OPTIONS.map((s) => (<SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">Total Amount</Label>
                      <Input type="number" value={editForm.totalAmount} onChange={(e) => setEditForm({ ...editForm, totalAmount: e.target.value })} className="mt-1 font-mono" />
                    </div>
                    <div>
                      <Label className="text-xs">Fiscal Year</Label>
                      <Input value={budget.fiscal_years?.name || "None"} disabled className="mt-1" />
                    </div>
                    <div className="sm:col-span-2">
                      <Label className="text-xs">Description</Label>
                      <Textarea value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} className="mt-1" rows={3} />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-slate-50 rounded-lg p-3">
                      <p className="text-xs text-slate-400">Name</p>
                      <p className="text-sm font-medium">{budget.name}</p>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-3">
                      <p className="text-xs text-slate-400">Status</p>
                      <Badge variant="outline" className={sc.className}>{sc.label}</Badge>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-3">
                      <p className="text-xs text-slate-400">Total Amount</p>
                      <p className="text-sm font-medium font-mono">{fmt(budget.total_amount)}</p>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-3">
                      <p className="text-xs text-slate-400">Fiscal Year</p>
                      <p className="text-sm font-medium">{budget.fiscal_years?.name || "None"}</p>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-3">
                      <p className="text-xs text-slate-400">Department</p>
                      <p className="text-sm font-medium">{budget.department?.dep_name || "None"}</p>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-3">
                      <p className="text-xs text-slate-400">Created By</p>
                      <p className="text-sm font-medium">{budget.created_by || "System"}</p>
                    </div>
                    <div className="sm:col-span-2 bg-slate-50 rounded-lg p-3">
                      <p className="text-xs text-slate-400">Description</p>
                      <p className="text-sm">{budget.description || "No description provided"}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="logs" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Utilization Activity</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {utilizationLogs.length === 0 ? (
                  <div className="text-center py-12 text-slate-400">
                    <Activity className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <p>No activity recorded yet</p>
                  </div>
                ) : (
                  <div className="divide-y max-h-96 overflow-y-auto">
                    {utilizationLogs.map((log) => (
                      <div key={log.budget_utilization_log_id} className="p-4 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">{log.description || log.transaction_type}</p>
                          <p className="text-xs text-slate-400">
                            {log.transaction_type} by {log.created_by || "System"} &middot; {log.created_at ? new Date(log.created_at).toLocaleDateString() : ""}
                          </p>
                        </div>
                        <span className="font-mono text-sm font-medium text-orange-600">{fmt(log.amount)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Add Line Dialog */}
      <Dialog open={addLineOpen} onOpenChange={setAddLineOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Budget Line</DialogTitle>
            <DialogDescription>Add a new line item to the budget</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs">Category</Label>
              <Select value={newLine.category} onValueChange={(v) => setNewLine({ ...newLine, category: v })}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  {CATEGORY_OPTIONS.map((c) => (<SelectItem key={c} value={c}>{c}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Description *</Label>
              <Input value={newLine.description} onChange={(e) => setNewLine({ ...newLine, description: e.target.value })} placeholder="e.g., Teacher salaries" className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Budgeted Amount</Label>
              <Input type="number" value={newLine.budgeted_amount || ""} onChange={(e) => setNewLine({ ...newLine, budgeted_amount: parseFloat(e.target.value) || 0 })} placeholder="0.00" className="mt-1 font-mono" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddLineOpen(false)}>Cancel</Button>
            <Button onClick={handleAddLine} disabled={addingLine} className="bg-emerald-600 hover:bg-emerald-700">
              {addingLine ? "Adding..." : "Add Line"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Record Utilization Dialog */}
      <Dialog open={utilOpen} onOpenChange={setUtilOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Record Expense</DialogTitle>
            <DialogDescription>Record actual spending against a budget line</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs">Budget Line *</Label>
              <Select value={utilForm.lineId ? String(utilForm.lineId) : ""} onValueChange={(v) => setUtilForm({ ...utilForm, lineId: Number(v) })}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select line" /></SelectTrigger>
                <SelectContent>
                  {lines.map((l) => (
                    <SelectItem key={l.budget_line_id} value={String(l.budget_line_id)}>
                      {l.description || l.category || `Line ${l.budget_line_id`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Amount *</Label>
              <Input type="number" value={utilForm.amount} onChange={(e) => setUtilForm({ ...utilForm, amount: e.target.value })} placeholder="0.00" className="mt-1 font-mono" />
            </div>
            <div>
              <Label className="text-xs">Transaction Type</Label>
              <Select value={utilForm.transaction_type} onValueChange={(v) => setUtilForm({ ...utilForm, transaction_type: v })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="expense">Expense</SelectItem>
                  <SelectItem value="commitment">Commitment</SelectItem>
                  <SelectItem value="encumbrance">Encumbrance</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Description</Label>
              <Input value={utilForm.description} onChange={(e) => setUtilForm({ ...utilForm, description: e.target.value })} placeholder="e.g., Monthly rent payment" className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Recorded By</Label>
              <Input value={utilForm.createdBy} onChange={(e) => setUtilForm({ ...utilForm, createdBy: e.target.value })} placeholder="Your name" className="mt-1" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUtilOpen(false)}>Cancel</Button>
            <Button onClick={handleAddUtil} disabled={addingUtil} className="bg-orange-500 hover:bg-orange-600 text-white">
              {addingUtil ? "Recording..." : "Record Expense"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <footer className="bg-white border-t border-slate-200 py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-xs text-slate-400">&copy; {new Date().getFullYear()} School Manager</p>
        </div>
      </footer>
    </div>
  );
}
