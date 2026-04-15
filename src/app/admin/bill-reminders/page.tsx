"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Bell, BellRing, Send, Users, AlertTriangle, FileText,
  CheckCircle, Search, MessageSquare,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";

interface ParentDebt { parent_id: number; parent_name: string | null; phone: string | null; total_due: number; student_count: number; students: { name: string; student_code: string; totalDue: number; invoiceCount: number }[]; }
interface Stats { totalOverdue: number; totalAmount: number; parentsWithDebt: number; }

function fmt(n: number) { return `GHS ${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`; }

export default function BillRemindersPage() {
  const { toast } = useToast();
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
      toast({ title: "Success", description: result.message || `Sent to ${result.count} parents` });
      setBulkOpen(false);
      fetchData();
    } catch { toast({ title: "Error", variant: "destructive" }); }
    setSending(false);
  };

  const handleSendSingle = async () => {
    if (!selectedParent) return;
    setSending(true);
    try {
      const res = await fetch("/api/admin/bill-reminders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "send_to_parent", parent_id: selectedParent.parent_id, custom_message: customMsg }) });
      const result = await res.json();
      toast({ title: "Success", description: result.message });
      setSingleOpen(false); fetchData();
    } catch { toast({ title: "Error", variant: "destructive" }); }
    setSending(false);
  };

  const filteredParents = (data?.parentDebts || []).filter(p =>
    search === "" || (p.parent_name || "").toLowerCase().includes(search.toLowerCase()) || (p.phone || "").includes(search)
  );

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center"><BellRing className="w-6 h-6" /></div>
              <div><h1 className="text-lg font-bold">Bill Reminders</h1><p className="text-amber-200 text-xs hidden sm:block">Fee Reminder System</p></div>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {loading ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />) : (
            <>
              <Card className="border-amber-100 bg-amber-50/50"><CardContent className="p-4 flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center"><AlertTriangle className="w-5 h-5 text-amber-600" /></div><div><p className="text-xs text-slate-500">Overdue Invoices</p><p className="text-xl font-bold text-amber-600">{data?.stats.totalOverdue || 0}</p></div></CardContent></Card>
              <Card className="border-red-100 bg-red-50/50"><CardContent className="p-4 flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center"><FileText className="w-5 h-5 text-red-600" /></div><div><p className="text-xs text-slate-500">Total Outstanding</p><p className="text-xl font-bold text-red-600">{fmt(data?.stats.totalAmount || 0)}</p></div></CardContent></Card>
              <Card className="border-violet-100 bg-violet-50/50"><CardContent className="p-4 flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center"><Users className="w-5 h-5 text-violet-600" /></div><div><p className="text-xs text-slate-500">Parents with Debt</p><p className="text-xl font-bold text-violet-600">{data?.stats.parentsWithDebt || 0}</p></div></CardContent></Card>
            </>
          )}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><Input placeholder="Search by parent name or phone..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 min-h-[44px]" /></div>
          <Button onClick={() => { setBulkMsg(""); setUseCustomMsg(false); setBulkOpen(true); }} className="bg-amber-500 hover:bg-amber-600 min-h-[44px]"><Send className="w-4 h-4 mr-2" /> Send All Reminders</Button>
        </div>

        <Card className="border-slate-200/60"><CardContent className="p-0">
          <div className="max-h-[500px] overflow-y-auto">
            <Table>
              <TableHeader><TableRow className="bg-slate-50"><TableHead>Parent</TableHead><TableHead className="hidden sm:table-cell">Phone</TableHead><TableHead>Students</TableHead><TableHead>Total Due</TableHead><TableHead></TableHead></TableRow></TableHeader>
              <TableBody>
                {loading ? Array.from({ length: 5 }).map((_, i) => <TableRow key={i}><TableCell colSpan={5}><Skeleton className="h-8" /></TableCell></TableRow>) :
                  filteredParents.length === 0 ? <TableRow><TableCell colSpan={5} className="text-center text-slate-400 py-12"><Bell className="w-10 h-10 mx-auto mb-2 opacity-50" /><p>No outstanding balances</p></TableCell></TableRow> :
                    filteredParents.map(p => (
                      <TableRow key={p.parent_id}>
                        <TableCell className="font-medium text-sm">{p.parent_name || "Unknown"}</TableCell>
                        <TableCell className="hidden sm:table-cell text-sm font-mono">{p.phone || "—"}</TableCell>
                        <TableCell><Badge variant="outline" className="text-xs">{p.student_count} student{p.student_count !== 1 ? "s" : ""}</Badge></TableCell>
                        <TableCell className="font-medium text-sm text-red-600">{fmt(p.total_due)}</TableCell>
                        <TableCell><Button size="sm" variant="outline" className="h-8 text-xs text-amber-600 border-amber-200 hover:bg-amber-50" onClick={() => { setSelectedParent(p); setCustomMsg(""); setSingleOpen(true); }}><MessageSquare className="w-3 h-3 mr-1" />Send</Button></TableCell>
                      </TableRow>
                    ))}
              </TableBody>
            </Table>
          </div>
        </CardContent></Card>
      </main>

      <Dialog open={bulkOpen} onOpenChange={setBulkOpen}><DialogContent className="max-w-md"><DialogHeader><DialogTitle>Send Bulk Bill Reminders</DialogTitle><DialogDescription>This will send SMS to all parents with outstanding balances</DialogDescription></DialogHeader>
        <div className="space-y-4 py-4">
          <div className="bg-amber-50 rounded-lg p-3"><p className="text-sm text-amber-700"><AlertTriangle className="w-4 h-4 inline mr-1" />This will send to <strong>{data?.stats.parentsWithDebt || 0}</strong> parents with overdue fees</p></div>
          <div className="flex items-center gap-3"><Switch checked={useCustomMsg} onCheckedChange={setUseCustomMsg} /><Label className="text-sm">Use custom message</Label></div>
          {useCustomMsg && (
            <div className="grid gap-2"><Label>Custom Message</Label><Textarea value={bulkMsg} onChange={e => setBulkMsg(e.target.value)} rows={3} placeholder="Use {name} and {amount} as placeholders" /><p className="text-xs text-slate-400">Available: {'{name}'} = parent name, {'{amount}'} = total due</p></div>
          )}
        </div>
        <DialogFooter><Button variant="outline" onClick={() => setBulkOpen(false)}>Cancel</Button><Button onClick={handleBulkSend} disabled={sending} className="bg-amber-500 hover:bg-amber-600">{sending ? "Sending..." : "Send All Reminders"}</Button></DialogFooter>
      </DialogContent></Dialog>

      <Dialog open={singleOpen} onOpenChange={setSingleOpen}><DialogContent className="max-w-md"><DialogHeader><DialogTitle>Send Reminder to {selectedParent?.parent_name}</DialogTitle></DialogHeader>
        {selectedParent && (
          <div className="space-y-4">
            <div className="bg-slate-50 rounded-lg p-3 space-y-1">
              <p className="text-sm font-medium">{selectedParent.parent_name}</p>
              <p className="text-xs text-slate-500">{selectedParent.phone}</p>
              <p className="text-xs text-slate-500">{selectedParent.student_count} student{selectedParent.student_count !== 1 ? "s" : ""} · Outstanding: <span className="text-red-600 font-medium">{fmt(selectedParent.total_due)}</span></p>
            </div>
            <div className="grid gap-2"><Label>Custom Message (optional)</Label><Textarea value={customMsg} onChange={e => setCustomMsg(e.target.value)} rows={3} placeholder="Override default message" /><p className="text-xs text-slate-400">Placeholders: {'{name}'}, {'{amount}'}</p></div>
          </div>
        )}
        <DialogFooter><Button variant="outline" onClick={() => setSingleOpen(false)}>Cancel</Button><Button onClick={handleSendSingle} disabled={sending} className="bg-amber-500 hover:bg-amber-600">{sending ? "Sending..." : "Send Reminder"}</Button></DialogFooter>
      </DialogContent></Dialog>

      <footer className="bg-white border-t border-slate-200 py-4 mt-auto"><div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center"><p className="text-xs text-slate-400">&copy; {new Date().getFullYear()} School Manager</p></div></footer>
    </div>
  );
}
