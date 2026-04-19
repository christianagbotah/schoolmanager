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
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { toast } from "sonner";

interface Receivable { invoice_id: number; title: string; amount: number; amount_paid: number; due: number; status: string; year: string; term: string; creation_timestamp: string | null; student: { name: string; student_code: string } | null; class: { name: string } | null; invoice_code?: string; description?: string; }
interface ClassBreakdown { class: string; amount: number; }
interface Stats { totalReceivable: number; totalBilled: number; totalCollected: number; overdueCount: number; invoiceCount: number; }

function fmt(n: number) { return `GHS ${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`; }

function ReceivablesSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-7 w-56 mb-1" />
        <Skeleton className="h-4 w-72" />
        <div className="border-b border-slate-100 mt-3" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-11 rounded-xl" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Skeleton className="lg:col-span-2 h-64 rounded-2xl" />
        <div className="space-y-4">
          <Skeleton className="h-48 rounded-2xl" />
          <Skeleton className="h-48 rounded-2xl" />
          <Skeleton className="h-48 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

export default function ReceivablesPage() {
  const [receivables, setReceivables] = useState<Receivable[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [classBreakdown, setClassBreakdown] = useState<ClassBreakdown[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("__all__");
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedInv, setSelectedInv] = useState<Receivable | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (status !== "__all__") params.set("status", status);
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

  if (loading && !receivables.length) return (
    <DashboardLayout>
      <ReceivablesSkeleton />
    </DashboardLayout>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="border-b border-slate-100 pb-4">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Accounts Receivable</h1>
          <p className="text-sm text-slate-500 mt-1">Outstanding Invoice Tracking</p>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Receivable", value: fmt(stats?.totalReceivable || 0), icon: DollarSign, borderColor: "border-rose-500", iconBg: "bg-rose-500" },
            { label: "Total Billed", value: fmt(stats?.totalBilled || 0), icon: FileText, borderColor: "border-sky-500", iconBg: "bg-sky-500" },
            { label: "Collected", value: fmt(stats?.totalCollected || 0), icon: TrendingDown, borderColor: "border-emerald-500", iconBg: "bg-emerald-500" },
            { label: "Overdue", value: (stats?.overdueCount || 0).toString(), icon: AlertTriangle, borderColor: "border-amber-500", iconBg: "bg-amber-500" },
          ].map(s => (
            <Card key={s.label} className={`rounded-2xl border-l-4 ${s.borderColor} hover:shadow-lg hover:-translate-y-0.5 transition-all`}>
              <CardContent className="p-4 flex items-center gap-4">
                <div className={`w-11 h-11 rounded-xl ${s.iconBg} flex items-center justify-center flex-shrink-0`}>
                  <s.icon className="w-5 h-5 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{s.label}</p>
                  <p className="text-2xl font-bold text-slate-900 tabular-nums truncate">{s.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {error && (
          <Card className="rounded-2xl border-red-200">
            <CardContent className="p-6 flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center mb-3">
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
              <p className="font-medium text-slate-900">{error}</p>
              <Button variant="outline" className="mt-3 min-h-[44px]" onClick={fetchData}>
                <RefreshCw className="w-4 h-4 mr-2" /> Retry
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <Select value={status} onValueChange={v => setStatus(v)}>
                <SelectTrigger className="w-[160px] min-h-[44px] bg-slate-50 border-slate-200 focus:bg-white">
                  <SelectValue placeholder="Filter status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All Status</SelectItem>
                  <SelectItem value="unpaid">Unpaid</SelectItem>
                  <SelectItem value="partial">Partial</SelectItem>
                  <SelectItem value="overdue">Overdue (30d+)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-slate-500">{stats?.invoiceCount || 0} invoices</p>
            </div>

            <Card className="rounded-2xl border-slate-200/60">
              <CardContent className="p-0">
                <div className="max-h-[500px] overflow-y-auto">
                  {/* Desktop */}
                  <div className="hidden md:block">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50">
                          <TableHead>Invoice</TableHead>
                          <TableHead>Student</TableHead>
                          <TableHead>Class</TableHead>
                          <TableHead className="text-right">Billed</TableHead>
                          <TableHead className="text-right">Paid</TableHead>
                          <TableHead className="text-right">Balance</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {receivables.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-16">
                              <div className="w-16 h-16 rounded-2xl bg-slate-100 mx-auto flex items-center justify-center mb-3">
                                <Scale className="w-8 h-8 text-slate-400" />
                              </div>
                              <p className="text-sm font-medium text-slate-700">No outstanding invoices</p>
                              <p className="text-xs text-slate-400 mt-1">All invoices have been settled</p>
                            </TableCell>
                          </TableRow>
                        ) : (
                          receivables.map(inv => {
                            const isOverdue = inv.creation_timestamp && new Date(inv.creation_timestamp) < new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
                            return (
                              <TableRow key={inv.invoice_id} className={`cursor-pointer hover:bg-slate-50 ${isOverdue ? "bg-red-50/50" : ""}`} onClick={() => { setSelectedInv(inv); setDetailOpen(true); }}>
                                <TableCell className="text-xs font-mono">{inv.invoice_code || `#${inv.invoice_id}`}</TableCell>
                                <TableCell className="font-medium text-sm">{inv.student?.name || "—"}</TableCell>
                                <TableCell><Badge variant="outline" className="text-xs">{inv.class?.name || "—"}</Badge></TableCell>
                                <TableCell className="text-right text-sm tabular-nums">{fmt(inv.amount)}</TableCell>
                                <TableCell className="text-right text-sm text-emerald-600 tabular-nums">{fmt(inv.amount_paid)}</TableCell>
                                <TableCell className="text-right font-medium text-sm text-red-600 tabular-nums">{fmt(inv.due)}</TableCell>
                                <TableCell><Button size="sm" variant="ghost" className="h-9 min-w-[44px]"><ChevronRight className="w-4 h-4" /></Button></TableCell>
                              </TableRow>
                            );
                          })
                        )}
                      </TableBody>
                    </Table>
                  </div>
                  {/* Mobile */}
                  <div className="md:hidden divide-y">
                    {receivables.length === 0 ? (
                      <div className="text-center py-16">
                        <div className="w-16 h-16 rounded-2xl bg-slate-100 mx-auto flex items-center justify-center mb-3">
                          <Scale className="w-8 h-8 text-slate-400" />
                        </div>
                        <p className="text-sm font-medium text-slate-700">No outstanding invoices</p>
                        <p className="text-xs text-slate-400 mt-1">All invoices have been settled</p>
                      </div>
                    ) : (
                      receivables.map(inv => {
                        const isOverdue = inv.creation_timestamp && new Date(inv.creation_timestamp) < new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
                        return (
                          <div key={inv.invoice_id} className={`p-4 space-y-2 ${isOverdue ? "bg-red-50/50" : ""}`} onClick={() => { setSelectedInv(inv); setDetailOpen(true); }}>
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="font-medium text-sm">{inv.student?.name || "—"}</p>
                                <p className="text-xs text-slate-400">{inv.class?.name || ""} · {inv.invoice_code || `#${inv.invoice_id}`}</p>
                              </div>
                              <Badge className={inv.status === "paid" ? "bg-emerald-100 text-emerald-700 text-xs" : inv.status === "partial" ? "bg-amber-100 text-amber-700 text-xs" : "bg-red-100 text-red-700 text-xs"}>{inv.status}</Badge>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                              <div className="bg-slate-50 rounded-lg p-2 text-center">
                                <p className="text-[10px] text-slate-500">Billed</p>
                                <p className="text-xs font-bold tabular-nums">{fmt(inv.amount)}</p>
                              </div>
                              <div className="bg-emerald-50 rounded-lg p-2 text-center">
                                <p className="text-[10px] text-slate-500">Paid</p>
                                <p className="text-xs font-bold text-emerald-700 tabular-nums">{fmt(inv.amount_paid)}</p>
                              </div>
                              <div className="bg-red-50 rounded-lg p-2 text-center">
                                <p className="text-[10px] text-slate-500">Due</p>
                                <p className="text-xs font-bold text-red-700 tabular-nums">{fmt(inv.due)}</p>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card className="rounded-2xl border-slate-200/60">
              <CardHeader className="pb-3"><CardTitle className="text-base">By Class</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {classBreakdown.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 mx-auto flex items-center justify-center mb-2">
                        <Users className="w-6 h-6 text-slate-400" />
                      </div>
                      <p className="text-sm text-slate-400">No data</p>
                    </div>
                  ) : classBreakdown.map((cb, i) => {
                    const pct = stats?.totalReceivable ? ((cb.amount / stats.totalReceivable) * 100).toFixed(1) : "0";
                    return (
                      <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50">
                        <div className="w-8 text-center text-sm font-bold text-slate-400">{i + 1}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm font-medium truncate">{cb.class || "Unclassified"}</span>
                            <span className="text-xs font-mono text-red-600 tabular-nums">{fmt(cb.amount)}</span>
                          </div>
                          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-red-400 rounded-full" style={{ width: `${Math.min(100, parseFloat(pct))}%` }} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-slate-200/60">
              <CardHeader className="pb-3"><CardTitle className="text-base">Summary</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between items-center p-2 bg-slate-50 rounded-lg">
                    <span className="text-sm">Collection Rate</span>
                    <span className="font-bold text-sm tabular-nums">{collectionRate}%</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${parseFloat(collectionRate) >= 70 ? "bg-emerald-500" : parseFloat(collectionRate) >= 40 ? "bg-amber-500" : "bg-red-500"}`} style={{ width: `${Math.min(100, parseFloat(collectionRate))}%` }} />
                  </div>
                  <div className="flex justify-between items-center p-2 bg-slate-50 rounded-lg">
                    <span className="text-sm">Avg Outstanding</span>
                    <span className="font-bold text-sm tabular-nums">{fmt(avgOutstanding)}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-slate-50 rounded-lg">
                    <span className="text-sm">Overdue Rate</span>
                    <span className="font-bold text-sm tabular-nums">{overdueRate}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-slate-200/60">
              <CardHeader className="pb-3"><CardTitle className="text-base">Top Debtors</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {receivables.filter(r => r.due > 0).sort((a, b) => b.due - a.due).slice(0, 8).length === 0 ? (
                    <div className="text-center py-6">
                      <div className="w-12 h-12 rounded-2xl bg-rose-100 mx-auto flex items-center justify-center mb-2">
                        <Users className="w-6 h-6 text-rose-400" />
                      </div>
                      <p className="text-sm text-slate-400">No debtors</p>
                    </div>
                  ) : (
                    receivables.filter(r => r.due > 0).sort((a, b) => b.due - a.due).slice(0, 8).map((r, i) => (
                      <div key={r.invoice_id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50">
                        <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center">
                          <AvatarFallback className="bg-rose-200 text-rose-700 text-[10px] font-semibold">{r.student?.name?.charAt(0) || "?"}</AvatarFallback>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{r.student?.name || "—"}</p>
                          <p className="text-xs text-slate-400">{r.student?.student_code || ""}</p>
                        </div>
                        <span className="font-mono text-sm font-bold text-red-600 tabular-nums">{fmt(r.due)}</span>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-xl bg-rose-500 flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <DialogTitle>Invoice Detail</DialogTitle>
                <DialogDescription>View invoice details</DialogDescription>
              </div>
            </div>
          </DialogHeader>
          {selectedInv && (
            <div className="space-y-3">
              <div className="bg-slate-50 rounded-lg p-4 text-center">
                <p className="text-xs text-slate-500">{selectedInv.invoice_code || `#${selectedInv.invoice_id}`}</p>
                <p className="text-lg font-bold">{selectedInv.title || selectedInv.description || "Invoice"}</p>
                <p className="text-sm text-slate-500">{selectedInv.student?.name} · {selectedInv.class?.name || "—"}</p>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[["Billed", selectedInv.amount], ["Paid", selectedInv.amount_paid], ["Balance", selectedInv.due]].map(([l, v]) => (
                  <div key={l as string} className="bg-slate-50 rounded-lg p-3 text-center">
                    <p className="text-xs text-slate-500">{l}</p>
                    <p className={`text-sm font-bold tabular-nums ${l === "Balance" ? "text-red-600" : ""}`}>{fmt(v as number)}</p>
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Status</span>
                <Badge className={selectedInv.status === "paid" ? "bg-emerald-100 text-emerald-700" : selectedInv.status === "partial" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}>
                  {selectedInv.status}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Year/Term</span>
                <span className="text-sm">{selectedInv.year} · {selectedInv.term}</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
