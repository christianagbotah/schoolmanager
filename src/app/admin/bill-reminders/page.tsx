"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Bell, BellRing, Send, Users, AlertTriangle, FileText,
  Search, MessageSquare, DollarSign,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";

interface ParentDebt { parent_id: number; parent_name: string | null; phone: string | null; total_due: number; student_count: number; students: { name: string; student_code: string; totalDue: number; invoiceCount: number }[]; }
interface Stats { totalOverdue: number; totalAmount: number; parentsWithDebt: number; }

function fmt(n: number) { return `GHS ${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`; }

function BillRemindersSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-7 w-48 mb-1" />
        <Skeleton className="h-4 w-72" />
        <div className="border-b border-slate-100 mt-3" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-11 rounded-xl" />
      <Skeleton className="h-64 rounded-2xl" />
    </div>
  );
}

export default function BillRemindersPage() {
  const [data, setData] = useState<{ stats: Stats; parentDebts: ParentDebt[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState("");
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkMsg, setBulkMsg] = useState("");
  const [useCustomMsg, setUseCustomMsg] = useState(false);
  const [singleOpen, setSingleOpen] = useState(false);
  const [selectedParent, setSelectedParent] = useState<ParentDebt | null>(null);
  const [customMsg, setCustomMsg] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/bill-reminders");
      setData(await res.json());
    } catch { /* empty */ }
    setLoading(false);
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchData(); }, [fetchData]);

  const handleBulkSend = async () => {
    setSending(true);
    try {
      const msg = useCustomMsg ? bulkMsg : "";
      const res = await fetch("/api/admin/bill-reminders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "send_bulk", custom_message: msg }) });
      const result = await res.json();
      toast.success(result.message || `Sent to ${result.count} parents`);
      setBulkOpen(false);
      fetchData();
    } catch { toast.error("Failed to send reminders"); }
    setSending(false);
  };

  const handleSendSingle = async () => {
    if (!selectedParent) return;
    setSending(true);
    try {
      const res = await fetch("/api/admin/bill-reminders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "send_to_parent", parent_id: selectedParent.parent_id, custom_message: customMsg }) });
      const result = await res.json();
      toast.success(result.message);
      setSingleOpen(false); fetchData();
    } catch { toast.error("Failed to send reminder"); }
    setSending(false);
  };

  const filteredParents = (data?.parentDebts || []).filter(p =>
    search === "" || (p.parent_name || "").toLowerCase().includes(search.toLowerCase()) || (p.phone || "").includes(search)
  );

  if (loading && !data) return (
    <DashboardLayout>
      <BillRemindersSkeleton />
    </DashboardLayout>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Bill Reminders</h1>
            <p className="text-sm text-slate-500 mt-1">Fee Reminder System</p>
          </div>
          <Button onClick={() => { setBulkMsg(""); setUseCustomMsg(false); setBulkOpen(true); }} className="bg-amber-500 hover:bg-amber-600 min-h-[44px]">
            <Send className="w-4 h-4 mr-2" /> Send All Reminders
          </Button>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: "Overdue Invoices", value: data?.stats.totalOverdue || 0, icon: AlertTriangle, borderColor: "border-amber-500", iconBg: "bg-amber-500" },
            { label: "Total Outstanding", value: fmt(data?.stats.totalAmount || 0), icon: DollarSign, borderColor: "border-red-500", iconBg: "bg-red-500" },
            { label: "Parents with Debt", value: data?.stats.parentsWithDebt || 0, icon: Users, borderColor: "border-violet-500", iconBg: "bg-violet-500" },
          ].map(s => (
            <Card key={s.label} className={`rounded-2xl border-l-4 ${s.borderColor} hover:shadow-lg hover:-translate-y-0.5 transition-all`}>
              <CardContent className="p-4 flex items-center gap-4">
                <div className={`w-11 h-11 rounded-xl ${s.iconBg} flex items-center justify-center flex-shrink-0`}>
                  <s.icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{s.label}</p>
                  <p className="text-2xl font-bold text-slate-900 tabular-nums">{s.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input placeholder="Search by parent name or phone..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 min-h-[44px] bg-slate-50 border-slate-200 focus:bg-white rounded-xl" />
        </div>

        {/* Table */}
        <Card className="rounded-2xl border-slate-200/60">
          <CardContent className="p-0">
            <div className="max-h-[500px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead>Parent</TableHead>
                    <TableHead className="hidden sm:table-cell">Phone</TableHead>
                    <TableHead>Students</TableHead>
                    <TableHead>Total Due</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredParents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-16">
                        <div className="w-16 h-16 rounded-2xl bg-amber-100 mx-auto flex items-center justify-center mb-3">
                          <Bell className="w-8 h-8 text-amber-500" />
                        </div>
                        <p className="text-sm font-medium text-slate-700">No outstanding balances</p>
                        <p className="text-xs text-slate-400 mt-1">All invoices are settled</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredParents.map(p => (
                      <TableRow key={p.parent_id}>
                        <TableCell className="font-medium text-sm">{p.parent_name || "Unknown"}</TableCell>
                        <TableCell className="hidden sm:table-cell text-sm font-mono">{p.phone || "—"}</TableCell>
                        <TableCell><Badge variant="outline" className="text-xs">{p.student_count} student{p.student_count !== 1 ? "s" : ""}</Badge></TableCell>
                        <TableCell className="font-medium text-sm text-red-600">{fmt(p.total_due)}</TableCell>
                        <TableCell>
                          <Button size="sm" variant="outline" className="h-9 min-h-[44px] text-xs text-amber-600 border-amber-200 hover:bg-amber-50" onClick={() => { setSelectedParent(p); setCustomMsg(""); setSingleOpen(true); }}>
                            <MessageSquare className="w-3 h-3 mr-1" />Send
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bulk Send Dialog */}
      <Dialog open={bulkOpen} onOpenChange={setBulkOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center">
                <BellRing className="w-5 h-5 text-white" />
              </div>
              <div>
                <DialogTitle>Send Bulk Bill Reminders</DialogTitle>
              </div>
            </div>
            <DialogDescription>This will send SMS to all parents with outstanding balances</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-amber-50 rounded-lg p-3">
              <p className="text-sm text-amber-700"><AlertTriangle className="w-4 h-4 inline mr-1" />This will send to <strong>{data?.stats.parentsWithDebt || 0}</strong> parents with overdue fees</p>
            </div>
            <div className="flex items-center gap-3"><Switch checked={useCustomMsg} onCheckedChange={setUseCustomMsg} /><Label className="text-sm">Use custom message</Label></div>
            {useCustomMsg && (
              <div className="grid gap-2">
                <Label>Custom Message</Label>
                <Textarea value={bulkMsg} onChange={e => setBulkMsg(e.target.value)} rows={3} placeholder="Use {name} and {amount} as placeholders" className="min-h-[44px]" />
                <p className="text-xs text-slate-400">Available: {'{name}'} = parent name, {'{amount}'} = total due</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkOpen(false)} className="min-h-[44px]">Cancel</Button>
            <Button onClick={handleBulkSend} disabled={sending} className="bg-amber-500 hover:bg-amber-600 min-h-[44px]">{sending ? "Sending..." : "Send All Reminders"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Single Send Dialog */}
      <Dialog open={singleOpen} onOpenChange={setSingleOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center">
                <Send className="w-5 h-5 text-white" />
              </div>
              <div>
                <DialogTitle>Send Reminder to {selectedParent?.parent_name}</DialogTitle>
              </div>
            </div>
            <DialogDescription>Send a fee reminder via SMS</DialogDescription>
          </DialogHeader>
          {selectedParent && (
            <div className="space-y-4">
              <div className="bg-slate-50 rounded-lg p-3 space-y-1">
                <p className="text-sm font-medium">{selectedParent.parent_name}</p>
                <p className="text-xs text-slate-500">{selectedParent.phone}</p>
                <p className="text-xs text-slate-500">{selectedParent.student_count} student{selectedParent.student_count !== 1 ? "s" : ""} · Outstanding: <span className="text-red-600 font-medium">{fmt(selectedParent.total_due)}</span></p>
              </div>
              <div className="grid gap-2">
                <Label>Custom Message (optional)</Label>
                <Textarea value={customMsg} onChange={e => setCustomMsg(e.target.value)} rows={3} placeholder="Override default message" className="min-h-[44px]" />
                <p className="text-xs text-slate-400">Placeholders: {'{name}'}, {'{amount}'}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSingleOpen(false)} className="min-h-[44px]">Cancel</Button>
            <Button onClick={handleSendSingle} disabled={sending} className="bg-amber-500 hover:bg-amber-600 min-h-[44px]">{sending ? "Sending..." : "Send Reminder"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
