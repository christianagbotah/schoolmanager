"use client";

import { useState, useEffect, useCallback } from "react";
import {
  CalendarDays, Plus, Pencil, Trash2, RefreshCw, AlertCircle,
  CheckCircle, XCircle, ChevronDown, ChevronUp, X,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
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
import { Switch } from "@/components/ui/switch";

/* ─── Types ─── */
interface FiscalYear {
  fiscal_year_id: number;
  name: string;
  start_date: string | null;
  end_date: string | null;
  is_active: number;
  status: string;
  _periodCount: number;
  _budgetCount: number;
}

interface FiscalPeriod {
  fiscal_period_id: number;
  fiscal_year_id: number;
  name: string;
  period_number: number;
  start_date: string | null;
  end_date: string | null;
  is_closed: number;
}

function fmtDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/* ─── Component ─── */
export default function FiscalYearsPage() {
  const { toast } = useToast();
  const [fiscalYears, setFiscalYears] = useState<FiscalYear[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [periods, setPeriods] = useState<Record<number, FiscalPeriod[]>>({});
  const [periodsLoading, setPeriodsLoading] = useState(false);

  // Create FY dialog
  const [createFYOpen, setCreateFYOpen] = useState(false);
  const [creatingFY, setCreatingFY] = useState(false);
  const [fyForm, setFyForm] = useState({ name: "", startDate: "", endDate: "", isActive: true });

  // Create Period dialog
  const [createPeriodOpen, setCreatePeriodOpen] = useState(false);
  const [creatingPeriod, setCreatingPeriod] = useState(false);
  const [periodForm, setPeriodForm] = useState({ fiscalYearId: 0, name: "", periodNumber: 0, startDate: "", endDate: "" });

  // Edit FY dialog
  const [editFYOpen, setEditFYOpen] = useState(false);
  const [editingFY, setEditingFY] = useState(false);
  const [editFyForm, setEditFyForm] = useState({ id: 0, name: "", startDate: "", endDate: "", isActive: false });

  // Delete dialog
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchFYs = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/fiscal-years");
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setFiscalYears(data.fiscalYears || []);
    } catch {
      setError("Failed to load fiscal years");
    }
    setLoading(false);
  }, []);

  const fetchPeriods = useCallback(async (fyId: number) => {
    setPeriodsLoading(true);
    try {
      const res = await fetch(`/api/admin/fiscal-periods?fiscalYearId=${fyId}`);
      const data = await res.json();
      if (!data.error) {
        setPeriods((prev) => ({ ...prev, [fyId]: data.periods || [] }));
      }
    } catch { /* silent */ }
    setPeriodsLoading(false);
  }, []);

  useEffect(() => { fetchFYs(); }, [fetchFYs]);

  const toggleExpand = async (fyId: number) => {
    if (expandedId === fyId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(fyId);
    if (!periods[fyId]) {
      await fetchPeriods(fyId);
    }
  };

  /* ─── Create FY ─── */
  const handleCreateFY = async () => {
    if (!fyForm.name) { toast({ title: "Name is required", variant: "destructive" }); return; }
    setCreatingFY(true);
    try {
      const res = await fetch("/api/admin/fiscal-years", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fyForm.name,
          startDate: fyForm.startDate || null,
          endDate: fyForm.endDate || null,
          isActive: fyForm.isActive,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast({ title: "Fiscal year created" });
      setCreateFYOpen(false);
      setFyForm({ name: "", startDate: "", endDate: "", isActive: false });
      fetchFYs();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to create";
      toast({ title: msg, variant: "destructive" });
    }
    setCreatingFY(false);
  };

  /* ─── Create Period ─── */
  const handleCreatePeriod = async () => {
    if (!periodForm.name || !periodForm.fiscalYearId) {
      toast({ title: "Name and fiscal year are required", variant: "destructive" });
      return;
    }
    setCreatingPeriod(true);
    try {
      const res = await fetch("/api/admin/fiscal-periods", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fiscalYearId: periodForm.fiscalYearId,
          name: periodForm.name,
          periodNumber: periodForm.periodNumber,
          startDate: periodForm.startDate || null,
          endDate: periodForm.endDate || null,
          isClosed: false,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast({ title: "Fiscal period created" });
      setCreatePeriodOpen(false);
      setPeriodForm({ fiscalYearId: 0, name: "", periodNumber: 0, startDate: "", endDate: "" });
      if (expandedId) fetchPeriods(expandedId);
      fetchFYs();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to create";
      toast({ title: msg, variant: "destructive" });
    }
    setCreatingPeriod(false);
  };

  /* ─── Toggle Active ─── */
  const handleToggleActive = async (fy: FiscalYear) => {
    try {
      const res = await fetch("/api/admin/fiscal-years", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fy.name,
          startDate: fy.start_date,
          endDate: fy.end_date,
          isActive: fy.is_active === 1 ? false : true,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast({ title: `Fiscal year ${fy.is_active === 1 ? "deactivated" : "activated"}` });
      fetchFYs();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to update";
      toast({ title: msg, variant: "destructive" });
    }
  };

  /* ─── Generate Standard Periods ─── */
  const handleGeneratePeriods = async (fyId: number) => {
    setPeriodsLoading(true);
    try {
      for (let i = 0; i < 12; i++) {
        await fetch("/api/admin/fiscal-periods", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fiscalYearId: fyId,
            name: MONTH_NAMES[i],
            periodNumber: i + 1,
            startDate: null,
            endDate: null,
            isClosed: false,
          }),
        });
      }
      toast({ title: "12 monthly periods generated" });
      await fetchPeriods(fyId);
      fetchFYs();
    } catch {
      toast({ title: "Failed to generate periods", variant: "destructive" });
    }
    setPeriodsLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-sky-600 to-cyan-600 text-white shadow-lg sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <CalendarDays className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-lg font-bold">Fiscal Year Management</h1>
                <p className="text-sky-200 text-xs hidden sm:block">Define fiscal years & periods</p>
              </div>
            </div>
            <Button onClick={() => setCreateFYOpen(true)} className="bg-white text-sky-600 hover:bg-white/90 min-h-[44px]">
              <Plus className="w-4 h-4 mr-2" />Create Fiscal Year
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full space-y-6">
        {/* Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="border-sky-100 bg-sky-50/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-sky-100 flex items-center justify-center">
                  <CalendarDays className="w-5 h-5 text-sky-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-slate-500">Total Years</p>
                  <p className="text-lg font-bold text-slate-900">{fiscalYears.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-slate-500">Active</p>
                  <p className="text-lg font-bold text-emerald-600">{fiscalYears.filter((fy) => fy.is_active === 1).length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center">
                  <CalendarDays className="w-5 h-5 text-violet-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-slate-500">Total Periods</p>
                  <p className="text-lg font-bold text-violet-600">{fiscalYears.reduce((s, fy) => s + fy._periodCount, 0)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                  <CalendarDays className="w-5 h-5 text-amber-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-slate-500">Budgets Linked</p>
                  <p className="text-lg font-bold text-amber-600">{fiscalYears.reduce((s, fy) => s + fy._budgetCount, 0)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Error */}
        {error && (
          <Card className="border-red-200">
            <CardContent className="p-6 flex flex-col items-center text-center">
              <AlertCircle className="w-10 h-10 text-red-500 mb-3" />
              <p className="font-medium text-slate-900">{error}</p>
              <Button variant="outline" className="mt-3" onClick={fetchFYs}>
                <RefreshCw className="w-4 h-4 mr-2" />Retry
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Fiscal Years List */}
        {loading ? Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}><CardContent className="p-6"><Skeleton className="h-12 w-full mb-4" /><Skeleton className="h-4 w-2/3" /></CardContent></Card>
        )) : fiscalYears.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-slate-400">
              <CalendarDays className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p>No fiscal years created yet</p>
              <Button className="mt-3 bg-sky-500 hover:bg-sky-600 text-white" onClick={() => setCreateFYOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />Create First Fiscal Year
              </Button>
            </CardContent>
          </Card>
        ) : fiscalYears.map((fy) => (
          <Card key={fy.fiscal_year_id} className={fy.is_active === 1 ? "border-emerald-200" : ""}>
            <CardContent className="p-0">
              <div
                className="p-4 cursor-pointer hover:bg-slate-50/50 transition-colors"
                onClick={() => toggleExpand(fy.fiscal_year_id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-3 h-3 rounded-full flex-shrink-0 ${fy.is_active === 1 ? "bg-emerald-500" : "bg-slate-300"}`} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-sm">{fy.name}</h3>
                        {fy.is_active === 1 && <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-xs">Active</Badge>}
                        {fy.is_active !== 1 && <Badge variant="secondary" className="text-xs">{fy.status}</Badge>}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {fmtDate(fy.start_date)} — {fmtDate(fy.end_date)}
                        &nbsp;&middot;&nbsp; {fy._periodCount} period(s) &middot; {fy._budgetCount} budget(s)
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs gap-1"
                      onClick={(e) => { e.stopPropagation(); setPeriodForm({ fiscalYearId: fy.fiscal_year_id, name: "", periodNumber: fy._periodCount + 1, startDate: "", endDate: "" }); setCreatePeriodOpen(true); }}
                    >
                      <Plus className="w-3 h-3" />Period
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs gap-1"
                      onClick={(e) => { e.stopPropagation(); handleGeneratePeriods(fy.fiscal_year_id); }}
                    >
                      Auto-generate
                    </Button>
                    <Switch
                      checked={fy.is_active === 1}
                      onCheckedChange={() => { /* handled via toggle */ }}
                      className="hidden"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => { e.stopPropagation(); handleToggleActive(fy); }}
                      title={fy.is_active === 1 ? "Deactivate" : "Activate"}
                    >
                      {fy.is_active === 1 ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <XCircle className="w-4 h-4 text-slate-400" />}
                    </Button>
                    {expandedId === fy.fiscal_year_id ? (
                      <ChevronUp className="w-5 h-5 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                </div>
              </div>

              {/* Expanded periods */}
              {expandedId === fy.fiscal_year_id && (
                <div className="border-t">
                  {periodsLoading ? (
                    <div className="p-4 space-y-2">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={i} className="h-10 w-full" />
                      ))}
                    </div>
                  ) : (periods[fy.fiscal_year_id] || []).length === 0 ? (
                    <div className="p-6 text-center text-slate-400 text-sm">
                      <CalendarDays className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>No periods defined. Add periods manually or auto-generate monthly periods.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-slate-50/50">
                            <TableHead className="text-xs font-semibold">#</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Start Date</TableHead>
                            <TableHead>End Date</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(periods[fy.fiscal_year_id] || []).map((p) => (
                            <TableRow key={p.fiscal_period_id} className="hover:bg-slate-50/50">
                              <TableCell className="text-sm font-mono">{p.period_number}</TableCell>
                              <TableCell className="text-sm font-medium">{p.name}</TableCell>
                              <TableCell className="text-sm">{fmtDate(p.start_date)}</TableCell>
                              <TableCell className="text-sm">{fmtDate(p.end_date)}</TableCell>
                              <TableCell>
                                {p.is_closed === 1 ? (
                                  <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-xs">Closed</Badge>
                                ) : (
                                  <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-xs">Open</Badge>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </main>

      {/* Create FY Dialog */}
      <Dialog open={createFYOpen} onOpenChange={setCreateFYOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Fiscal Year</DialogTitle>
            <DialogDescription>Define a new fiscal year for budgeting</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs">Fiscal Year Name *</Label>
              <Input value={fyForm.name} onChange={(e) => setFyForm({ ...fyForm, name: e.target.value })} placeholder="e.g., FY 2025" className="mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Start Date</Label>
                <Input type="date" value={fyForm.startDate} onChange={(e) => setFyForm({ ...fyForm, startDate: e.target.value })} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">End Date</Label>
                <Input type="date" value={fyForm.endDate} onChange={(e) => setFyForm({ ...fyForm, endDate: e.target.value })} className="mt-1" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={fyForm.isActive} onCheckedChange={(v) => setFyForm({ ...fyForm, isActive: v })} />
              <Label className="text-sm">Set as active fiscal year</Label>
            </div>
            <p className="text-xs text-slate-400">Note: Only one fiscal year can be active at a time. Activating this will deactivate others.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateFYOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateFY} disabled={creatingFY} className="bg-sky-600 hover:bg-sky-700">
              {creatingFY ? "Creating..." : "Create Fiscal Year"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Period Dialog */}
      <Dialog open={createPeriodOpen} onOpenChange={setCreatePeriodOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Fiscal Period</DialogTitle>
            <DialogDescription>Add a new period to a fiscal year</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs">Period Name *</Label>
              <Input value={periodForm.name} onChange={(e) => setPeriodForm({ ...periodForm, name: e.target.value })} placeholder="e.g., Q1, January, Term 1" className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Period Number</Label>
              <Input type="number" value={periodForm.periodNumber || ""} onChange={(e) => setPeriodForm({ ...periodForm, periodNumber: parseInt(e.target.value) || 0 })} placeholder="1" className="mt-1 font-mono" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Start Date</Label>
                <Input type="date" value={periodForm.startDate} onChange={(e) => setPeriodForm({ ...periodForm, startDate: e.target.value })} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">End Date</Label>
                <Input type="date" value={periodForm.endDate} onChange={(e) => setPeriodForm({ ...periodForm, endDate: e.target.value })} className="mt-1" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreatePeriodOpen(false)}>Cancel</Button>
            <Button onClick={handleCreatePeriod} disabled={creatingPeriod} className="bg-sky-600 hover:bg-sky-700">
              {creatingPeriod ? "Adding..." : "Add Period"}
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
