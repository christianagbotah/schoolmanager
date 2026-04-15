"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Wallet, Plus, Search, Loader2, AlertTriangle, ArrowUpRight,
  CreditCard, TrendingUp, Users, UtensilsCrossed, Coffee, BookOpen,
  Droplets, Bus,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
  DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { format } from "date-fns";

// ─── Types ───────────────────────────────────────────────────
interface WalletItem {
  id: number;
  student_id: number;
  name: string;
  student_code: string;
  class_name: string;
  feeding_balance: number;
  breakfast_balance: number;
  classes_balance: number;
  water_balance: number;
  transport_balance: number;
  total: number;
}

interface CreditsData {
  wallets: WalletItem[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
  summary: {
    totalBalance: number;
    studentsWithCredit: number;
    avgBalance: number;
    feeding: number;
    breakfast: number;
    classes: number;
    water: number;
    transport: number;
  };
  recentTopUps: any[];
  recentTransactions: any[];
}

// ─── Helpers ─────────────────────────────────────────────────
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "GHS", minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(amount);
}

function StatSkeleton() {
  return <Card className="gap-4 py-4"><CardContent className="px-4 pb-0 pt-0"><div className="flex items-center justify-between"><div className="space-y-2 flex-1"><Skeleton className="h-4 w-24" /><Skeleton className="h-8 w-20" /></div><Skeleton className="h-10 w-10 rounded-xl" /></div></CardContent></Card>;
}

// ─── Main Component ──────────────────────────────────────────
export default function CreditsPage() {
  const [data, setData] = useState<CreditsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [topUpForm, setTopUpForm] = useState({ studentId: "", feeding: "", breakfast: "", classes: "", water: "", transport: "", paymentMethod: "cash" });
  const [topUpLoading, setTopUpLoading] = useState(false);
  const [topUpMessage, setTopUpMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      const res = await fetch(`/api/accountant/credits?${params.toString()}`);
      if (!res.ok) throw new Error("Failed");
      setData(await res.json());
    } catch {
      setError("Unable to load credit data.");
    } finally {
      setIsLoading(false);
    }
  }, [search]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleTopUp = async () => {
    if (!topUpForm.studentId) return;
    setTopUpLoading(true);
    setTopUpMessage(null);
    try {
      const res = await fetch("/api/accountant/credits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(topUpForm),
      });
      const result = await res.json();
      if (res.ok) {
        setTopUpMessage({ type: "success", text: result.message });
        setTopUpForm({ studentId: "", feeding: "", breakfast: "", classes: "", water: "", transport: "", paymentMethod: "cash" });
        fetchData();
        setTimeout(() => setDialogOpen(false), 1500);
      } else {
        setTopUpMessage({ type: "error", text: result.error });
      }
    } catch {
      setTopUpMessage({ type: "error", text: "Failed to process top-up" });
    } finally {
      setTopUpLoading(false);
    }
  };

  const topUpTotal = (parseFloat(topUpForm.feeding) || 0) + (parseFloat(topUpForm.breakfast) || 0) +
    (parseFloat(topUpForm.classes) || 0) + (parseFloat(topUpForm.water) || 0) + (parseFloat(topUpForm.transport) || 0);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-72" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{Array.from({ length: 4 }).map((_, i) => <StatSkeleton key={i} />)}</div>
          <Skeleton className="h-80 w-full rounded-xl" />
        </div>
      </DashboardLayout>
    );
  }

  if (error || !data) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center"><AlertTriangle className="w-8 h-8 text-red-600" /></div>
          <h2 className="text-xl font-semibold text-slate-900">Something went wrong</h2>
          <p className="text-slate-500">{error}</p>
          <Button onClick={fetchData} variant="outline"><Loader2 className="w-4 h-4 mr-2" />Try Again</Button>
        </div>
      </DashboardLayout>
    );
  }

  const { wallets, summary, recentTopUps } = data;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 p-6 text-white shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                <Wallet className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Student Credits</h1>
                <p className="text-emerald-100 text-sm">Manage student credit balances and top-ups</p>
              </div>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-white text-emerald-700 hover:bg-emerald-50 shadow-lg">
                  <Plus className="w-4 h-4 mr-2" />Top Up Credits
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Top Up Student Credits</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-1 block">Student ID or Code</label>
                    <Input
                      placeholder="Enter student ID or code"
                      value={topUpForm.studentId}
                      onChange={(e) => setTopUpForm(f => ({ ...f, studentId: e.target.value }))}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-slate-500 mb-1 flex items-center gap-1"><UtensilsCrossed className="w-3 h-3" /> Feeding</label>
                      <Input type="number" step="0.01" min="0" placeholder="0.00" value={topUpForm.feeding} onChange={(e) => setTopUpForm(f => ({ ...f, feeding: e.target.value }))} />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-500 mb-1 flex items-center gap-1"><Coffee className="w-3 h-3" /> Breakfast</label>
                      <Input type="number" step="0.01" min="0" placeholder="0.00" value={topUpForm.breakfast} onChange={(e) => setTopUpForm(f => ({ ...f, breakfast: e.target.value }))} />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-500 mb-1 flex items-center gap-1"><BookOpen className="w-3 h-3" /> Classes</label>
                      <Input type="number" step="0.01" min="0" placeholder="0.00" value={topUpForm.classes} onChange={(e) => setTopUpForm(f => ({ ...f, classes: e.target.value }))} />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-500 mb-1 flex items-center gap-1"><Droplets className="w-3 h-3" /> Water</label>
                      <Input type="number" step="0.01" min="0" placeholder="0.00" value={topUpForm.water} onChange={(e) => setTopUpForm(f => ({ ...f, water: e.target.value }))} />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500 mb-1 flex items-center gap-1"><Bus className="w-3 h-3" /> Transport</label>
                    <Input type="number" step="0.01" min="0" placeholder="0.00" value={topUpForm.transport} onChange={(e) => setTopUpForm(f => ({ ...f, transport: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500 mb-1 block">Payment Method</label>
                    <Select value={topUpForm.paymentMethod} onValueChange={(v) => setTopUpForm(f => ({ ...f, paymentMethod: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="momo">Mobile Money</SelectItem>
                        <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 border">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Total Top-Up</span>
                      <span className="font-bold text-emerald-600">{formatCurrency(topUpTotal)}</span>
                    </div>
                  </div>
                  {topUpMessage && (
                    <div className={`p-3 rounded-lg text-sm ${topUpMessage.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                      {topUpMessage.text}
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                  <Button onClick={handleTopUp} disabled={topUpLoading || !topUpForm.studentId || topUpTotal <= 0} className="bg-emerald-600 hover:bg-emerald-700">
                    {topUpLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Top Up {formatCurrency(topUpTotal)}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="gap-4 py-4 border-l-4 border-l-emerald-500 hover:shadow-md transition-shadow">
            <CardContent className="px-4 pb-0 pt-0">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Total Credits</p>
                  <p className="text-xl font-bold text-emerald-600 tabular-nums">{formatCurrency(summary.totalBalance)}</p>
                  <p className="text-xs text-slate-400">{summary.studentsWithCredit} students</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center"><Wallet className="w-5 h-5 text-emerald-600" /></div>
              </div>
            </CardContent>
          </Card>
          <Card className="gap-4 py-4 border-l-4 border-l-amber-500 hover:shadow-md transition-shadow">
            <CardContent className="px-4 pb-0 pt-0">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Avg Balance</p>
                  <p className="text-xl font-bold text-amber-600 tabular-nums">{formatCurrency(summary.avgBalance)}</p>
                  <p className="text-xs text-slate-400">Per student</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center"><TrendingUp className="w-5 h-5 text-amber-600" /></div>
              </div>
            </CardContent>
          </Card>
          <Card className="gap-4 py-4 border-l-4 border-l-violet-500 hover:shadow-md transition-shadow">
            <CardContent className="px-4 pb-0 pt-0">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Feeding Balances</p>
                  <p className="text-xl font-bold text-violet-600 tabular-nums">{formatCurrency(summary.feeding)}</p>
                  <p className="text-xs text-slate-400">All wallets</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center"><UtensilsCrossed className="w-5 h-5 text-violet-600" /></div>
              </div>
            </CardContent>
          </Card>
          <Card className="gap-4 py-4 border-l-4 border-l-sky-500 hover:shadow-md transition-shadow">
            <CardContent className="px-4 pb-0 pt-0">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Transport Balances</p>
                  <p className="text-xl font-bold text-sky-600 tabular-nums">{formatCurrency(summary.transport)}</p>
                  <p className="text-xs text-slate-400">All wallets</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-sky-100 flex items-center justify-center"><Bus className="w-5 h-5 text-sky-600" /></div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search + Balance breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <Card className="lg:col-span-3 gap-4">
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-3 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Search by name or student code..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="max-h-[500px] overflow-y-auto rounded-lg border border-slate-200">
                <Table>
                  <TableHeader><TableRow className="bg-slate-50 hover:bg-slate-50">
                    <TableHead className="text-xs font-semibold text-slate-600 uppercase">Student</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-600 uppercase hidden sm:table-cell">Class</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-600 uppercase hidden md:table-cell">Feeding</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-600 uppercase hidden md:table-cell">Transport</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-600 uppercase text-right">Total Balance</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {wallets.length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="text-center text-slate-400 py-8">No students found</TableCell></TableRow>
                    ) : wallets.map((w) => (
                      <TableRow key={w.id} className="hover:bg-slate-50">
                        <TableCell>
                          <div>
                            <p className="text-sm font-medium">{w.name}</p>
                            <p className="text-xs text-slate-400">{w.student_code}</p>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-sm text-slate-500">{w.class_name}</TableCell>
                        <TableCell className="hidden md:table-cell text-sm tabular-nums text-slate-600">{formatCurrency(w.feeding_balance)}</TableCell>
                        <TableCell className="hidden md:table-cell text-sm tabular-nums text-slate-600">{formatCurrency(w.transport_balance)}</TableCell>
                        <TableCell className="text-right">
                          <span className={`font-semibold text-sm tabular-nums ${w.total > 0 ? 'text-emerald-600' : 'text-slate-400'}`}>
                            {formatCurrency(w.total)}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Balance Breakdown */}
          <Card className="gap-4">
            <CardHeader className="pb-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center"><CreditCard className="w-4 h-4 text-slate-600" /></div>
                <CardTitle className="text-base font-semibold">Breakdown</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              {[
                { label: "Feeding", amount: summary.feeding, icon: UtensilsCrossed, color: "text-violet-600" },
                { label: "Breakfast", amount: summary.breakfast, icon: Coffee, color: "text-amber-600" },
                { label: "Classes", amount: summary.classes, icon: BookOpen, color: "text-emerald-600" },
                { label: "Water", amount: summary.water, icon: Droplets, color: "text-sky-600" },
                { label: "Transport", amount: summary.transport, icon: Bus, color: "text-red-600" },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                  <div className="flex items-center gap-2">
                    <item.icon className={`w-4 h-4 ${item.color}`} />
                    <span className="text-sm text-slate-600">{item.label}</span>
                  </div>
                  <span className="text-sm font-semibold tabular-nums">{formatCurrency(item.amount)}</span>
                </div>
              ))}
              <div className="flex items-center justify-between pt-2 border-t-2 border-slate-200">
                <span className="text-sm font-semibold text-slate-800">Total</span>
                <span className="text-lg font-bold text-emerald-600 tabular-nums">{formatCurrency(summary.totalBalance)}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Top-ups */}
        {recentTopUps.length > 0 && (
          <Card className="gap-4">
            <CardHeader className="pb-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center"><ArrowUpRight className="w-4 h-4 text-emerald-600" /></div>
                  <CardTitle className="text-base font-semibold">Recent Top-Ups</CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="max-h-96 overflow-y-auto rounded-lg border border-slate-200">
                <Table>
                  <TableHeader><TableRow className="bg-slate-50 hover:bg-slate-50">
                    <TableHead className="text-xs font-semibold text-slate-600 uppercase">Date</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-600 uppercase">Student</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-600 uppercase hidden sm:table-cell">Method</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-600 uppercase text-right">Amount</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {recentTopUps.map((t: any) => (
                      <TableRow key={t.id} className="hover:bg-slate-50">
                        <TableCell className="text-sm text-slate-500">{t.payment_date ? format(new Date(t.payment_date), "MMM d, yyyy") : "—"}</TableCell>
                        <TableCell className="text-sm font-medium">{t.student?.name || "Unknown"}</TableCell>
                        <TableCell className="hidden sm:table-cell text-sm text-slate-500 capitalize">{t.payment_method?.replace(/_/g, " ")}</TableCell>
                        <TableCell className="text-right font-semibold text-sm tabular-nums text-emerald-600">{formatCurrency(t.total_amount)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
