"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Scale, DollarSign, AlertTriangle, TrendingDown, FileText,
  Search, ChevronRight, AlertCircle, RefreshCw, Users,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface Receivable { invoice_id: number; title: string; amount: number; amount_paid: number; due: number; status: string; year: string; term: string; creation_timestamp: string | null; student: { name: string; student_code: string } | null; class: { name: string } | null; }
interface ClassBreakdown { class: string; amount: number; }
interface Stats { totalReceivable: number; totalBilled: number; totalCollected: number; overdueCount: number; invoiceCount: number; }

function fmt(n: number) { return `GHS ${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`; }

export default function ReceivablesPage() {
  const { toast } = useToast();
  const [receivables, setReceivables] = useState<Receivable[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [classBreakdown, setClassBreakdown] = useState<ClassBreakdown[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedInv, setSelectedInv] = useState<Receivable | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (status) params.set("status", status);
      const res = await fetch(`/api/admin/receivables?${params}`);
      if (!res.ok) throw new Error("Failed to load receivables");
      const data = await res.json();
      setReceivables(data.receivables || []);
      setStats(data.stats);
      setClassBreakdown(data.classBreakdown || []);
    } catch {
      setError("Failed to load receivables data");
    }
    setLoading(false);
  }, [status]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const collectionRate = stats?.totalBilled ? ((stats.totalCollected / stats.totalBilled) * 100).toFixed(1) : "0";
  const avgOutstanding = stats?.invoiceCount ? stats.totalReceivable / stats.invoiceCount : 0;
  const overdueRate = stats?.invoiceCount ? ((stats.overdueCount / stats.invoiceCount) * 100).toFixed(1) : "0";

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-lg sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center"><Scale className="w-6 h-6" /></div>
              <div><h1 className="text-lg font-bold">Accounts Receivable</h1><p className="text-rose-200 text-xs hidden sm:block">Outstanding Invoice Tracking</p></div>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {loading ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />) : (
            <>
              <Card className="border-rose-100 bg-rose-50/50"><CardContent className="p-4 flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-rose-100 flex items-center justify-center"><DollarSign className="w-5 h-5 text-rose-600" /></div><div><p className="text-xs text-slate-500">Total Receivable</p><p className="text-xl font-bold text-rose-600">{fmt(stats?.totalReceivable || 0)}</p></div></CardContent></Card>
              <Card className="border-sky-100 bg-sky-50/50"><CardContent className="p-4 flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-sky-100 flex items-center justify-center"><FileText className="w-5 h-5 text-sky-600" /></div><div><p className="text-xs text-slate-500">Total Billed</p><p className="text-xl font-bold text-sky-600">{fmt(stats?.totalBilled || 0)}</p></div></CardContent></Card>
              <Card className="border-emerald-100 bg-emerald-50/50"><CardContent className="p-4 flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center"><TrendingDown className="w-5 h-5 text-emerald-600" /></div><div><p className="text-xs text-slate-500">Collected</p><p className="text-xl font-bold text-emerald-600">{fmt(stats?.totalCollected || 0)}</p></div></CardContent></Card>
              <Card className="border-amber-100 bg-amber-50/50"><CardContent className="p-4 flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center"><AlertTriangle className="w-5 h-5 text-amber-600" /></div><div><p className="text-xs text-slate-500">Overdue</p><p className="text-xl font-bold text-amber-600">{stats?.overdueCount || 0}</p></div></CardContent></Card>
            </>
          )}
        </div>

        {error && (
          <Card className="border-red-200 mb-4"><CardContent className="p-6 flex flex-col items-center text-center"><AlertCircle className="w-10 h-10 text-red-500 mb-3" /><p className="font-medium text-slate-900">{error}</p><Button variant="outline" className="mt-3" onClick={fetchData}><RefreshCw className="w-4 h-4 mr-2" /> Retry</Button></CardContent></Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <Select value={status} onValueChange={v => setStatus(v === "__all__" ? "" : v)}><SelectTrigger className="w-[160px] min-h-[44px]"><SelectValue placeholder="Filter status" /></SelectTrigger><SelectContent><SelectItem value="__all__">All Status</SelectItem><SelectItem value="unpaid">Unpaid</SelectItem><SelectItem value="partial">Partial</SelectItem><SelectItem value="overdue">Overdue (30d+)</SelectItem></SelectContent></Select>
              <p className="text-sm text-slate-500">{stats?.invoiceCount || 0} invoices</p>
            </div>

            <Card className="border-slate-200/60"><CardContent className="p-0">
              <div className="max-h-[500px] overflow-y-auto">
                {/* Desktop */}
                <div className="hidden md:block">
                  <Table>
                    <TableHeader><TableRow className="bg-slate-50"><TableHead>Invoice</TableHead><TableHead>Student</TableHead><TableHead>Class</TableHead><TableHead className="text-right">Billed</TableHead><TableHead className="text-right">Paid</TableHead><TableHead className="text-right">Balance</TableHead><TableHead></TableHead></TableRow></TableHeader>
                    <TableBody>
                      {loading ? Array.from({ length: 8 }).map((_, i) => <TableRow key={i}><TableCell colSpan={7}><Skeleton className="h-8" /></TableCell></TableRow>) :
                        receivables.length === 0 ? <TableRow><TableCell colSpan={7} className="text-center text-slate-400 py-12"><Scale className="w-10 h-10 mx-auto mb-2 opacity-50" /><p>No outstanding invoices</p></TableCell></TableRow> :
                          receivables.map(inv => {
                            const isOverdue = inv.creation_timestamp && new Date(inv.creation_timestamp) < new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
                            return (
                              <TableRow key={inv.invoice_id} className={`cursor-pointer hover:bg-slate-50 ${isOverdue ? "bg-red-50/50" : ""}`} onClick={() => { setSelectedInv(inv); setDetailOpen(true); }}>
                                <TableCell className="text-xs font-mono">{inv.invoice_code || `#${inv.invoice_id}`}</TableCell>
                                <TableCell className="font-medium text-sm">{inv.student?.name || "—"}</TableCell>
                                <TableCell><Badge variant="outline" className="text-xs">{inv.class?.name || "—"}</Badge></TableCell>
                                <TableCell className="text-right text-sm">{fmt(inv.amount)}</TableCell>
                                <TableCell className="text-right text-sm text-emerald-600">{fmt(inv.amount_paid)}</TableCell>
                                <TableCell className="text-right font-medium text-sm text-red-600">{fmt(inv.due)}</TableCell>
                                <TableCell><Button size="sm" variant="ghost" className="h-7"><ChevronRight className="w-4 h-4" /></Button></TableCell>
                              </TableRow>
                            );
                          })}
                    </TableBody>
                  </Table>
                </div>
                {/* Mobile */}
                <div className="md:hidden divide-y">
                  {loading ? Array.from({ length: 4 }).map((_, i) => <div key={i} className="p-4"><Skeleton className="h-16 rounded-lg" /></div>) :
                    receivables.length === 0 ? <div className="text-center py-12 text-slate-400"><Scale className="w-10 h-10 mx-auto mb-2 opacity-50" /><p>No outstanding invoices</p></div> :
                      receivables.map(inv => {
                        const isOverdue = inv.creation_timestamp && new Date(inv.creation_timestamp) < new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
                        return (
                          <div key={inv.invoice_id} className={`p-4 space-y-2 ${isOverdue ? "bg-red-50/50" : ""}`} onClick={() => { setSelectedInv(inv); setDetailOpen(true); }}>
                            <div className="flex items-start justify-between">
                              <div><p className="font-medium text-sm">{inv.student?.name || "—"}</p><p className="text-xs text-slate-400">{inv.class?.name || ""} · {inv.invoice_code || `#${inv.invoice_id}`}</p></div>
                              <Badge className={inv.status === "paid" ? "bg-emerald-100 text-emerald-700 text-xs" : inv.status === "partial" ? "bg-amber-100 text-amber-700 text-xs" : "bg-red-100 text-red-700 text-xs"}>{inv.status}</Badge>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                              <div className="bg-slate-50 rounded-lg p-2 text-center"><p className="text-[10px] text-slate-500">Billed</p><p className="text-xs font-bold">{fmt(inv.amount)}</p></div>
                              <div className="bg-emerald-50 rounded-lg p-2 text-center"><p className="text-[10px] text-slate-500">Paid</p><p className="text-xs font-bold text-emerald-700">{fmt(inv.amount_paid)}</p></div>
                              <div className="bg-red-50 rounded-lg p-2 text-center"><p className="text-[10px] text-slate-500">Due</p><p className="text-xs font-bold text-red-700">{fmt(inv.due)}</p></div>
                            </div>
                          </div>
                        );
                      })}
                </div>
              </div>
            </CardContent></Card>
          </div>

          <div className="space-y-4">
            <Card className="border-slate-200/60"><CardHeader className="pb-3"><CardTitle className="text-base">By Class</CardTitle></CardHeader><CardContent>
              <div className="space-y-2 max-h-64 overflow-y-auto">{classBreakdown.length === 0 ? <p className="text-sm text-slate-400 text-center py-6">No data</p> : classBreakdown.map((cb, i) => {
                const pct = stats?.totalReceivable ? ((cb.amount / stats.totalReceivable) * 100).toFixed(1) : "0";
                return (
                  <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50"><div className="w-8 text-center text-sm font-bold text-slate-400">{i + 1}</div><div className="flex-1 min-w-0"><div className="flex justify-between items-center mb-1"><span className="text-sm font-medium truncate">{cb.class || "Unclassified"}</span><span className="text-xs font-mono text-red-600">{fmt(cb.amount)}</span></div><div className="h-1.5 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-red-400 rounded-full" style={{ width: `${Math.min(100, parseFloat(pct))}%` }} /></div></div></div>
                );
              })}</div>
            </CardContent></Card>

            <Card className="border-slate-200/60"><CardHeader className="pb-3"><CardTitle className="text-base">Summary</CardTitle></CardHeader><CardContent>
              <div className="space-y-2">
                <div className="flex justify-between items-center p-2 bg-slate-50 rounded"><span className="text-sm">Collection Rate</span><span className="font-bold text-sm">{collectionRate}%</span></div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden"><div className={`h-full rounded-full ${parseFloat(collectionRate) >= 70 ? "bg-emerald-500" : parseFloat(collectionRate) >= 40 ? "bg-amber-500" : "bg-red-500"}`} style={{ width: `${Math.min(100, parseFloat(collectionRate))}%` }} /></div>
                <div className="flex justify-between items-center p-2 bg-slate-50 rounded"><span className="text-sm">Avg Outstanding</span><span className="font-bold text-sm">{fmt(avgOutstanding)}</span></div>
                <div className="flex justify-between items-center p-2 bg-slate-50 rounded"><span className="text-sm">Overdue Rate</span><span className="font-bold text-sm">{overdueRate}%</span></div>
              </div>
            </CardContent></Card>

            <Card className="border-slate-200/60"><CardHeader className="pb-3"><CardTitle className="text-base">Top Debtors</CardTitle></CardHeader><CardContent>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {receivables.filter(r => r.due > 0).sort((a, b) => b.due - a.due).slice(0, 8).map((r, i) => (
                  <div key={r.invoice_id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50">
                    <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center"><AvatarFallback className="bg-rose-200 text-rose-700 text-[10px] font-semibold">{r.student?.name?.charAt(0) || "?"}</AvatarFallback></div>
                    <div className="flex-1 min-w-0"><p className="text-sm font-medium truncate">{r.student?.name || "—"}</p><p className="text-xs text-slate-400">{r.student?.student_code || ""}</p></div>
                    <span className="font-mono text-sm font-bold text-red-600">{fmt(r.due)}</span>
                  </div>
                ))}
              </div>
            </CardContent></Card>
          </div>
        </div>
      </main>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}><DialogContent className="max-w-md"><DialogHeader><DialogTitle>Invoice Detail</DialogTitle></DialogHeader>
        {selectedInv && (
          <div className="space-y-3">
            <div className="bg-slate-50 rounded-lg p-4 text-center"><p className="text-xs text-slate-500">{selectedInv.invoice_code || `#${selectedInv.invoice_id}`}</p><p className="text-lg font-bold">{selectedInv.title || selectedInv.description || "Invoice"}</p><p className="text-sm text-slate-500">{selectedInv.student?.name} · {selectedInv.class?.name || "—"}</p></div>
            <div className="grid grid-cols-3 gap-3">{[["Billed", selectedInv.amount], ["Paid", selectedInv.amount_paid], ["Balance", selectedInv.due]].map(([l, v]) => <div key={l as string} className="bg-slate-50 rounded-lg p-3 text-center"><p className="text-xs text-slate-500">{l}</p><p className={`text-sm font-bold ${l === "Balance" ? "text-red-600" : ""}`}>{fmt(v as number)}</p></div>)}</div>
            <div className="flex justify-between items-center"><span className="text-sm">Status</span><Badge className={selectedInv.status === "paid" ? "bg-emerald-100 text-emerald-700" : selectedInv.status === "partial" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}>{selectedInv.status}</Badge></div>
            <div className="flex justify-between items-center"><span className="text-sm">Year/Term</span><span className="text-sm">{selectedInv.year} · {selectedInv.term}</span></div>
          </div>
        )}
      </DialogContent></Dialog>

      <footer className="bg-white border-t border-slate-200 py-4 mt-auto"><div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center"><p className="text-xs text-slate-400">&copy; {new Date().getFullYear()} School Manager</p></div></footer>
    </div>
  );
}
