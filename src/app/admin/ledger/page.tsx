"use client";

import { useState, useEffect, useCallback } from "react";
import {
  BookCheck, Search, DollarSign, CreditCard, Wallet,
  AlertCircle, RefreshCw, User, ChevronRight, X,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface StudentBalance { student_id: number; name: string; student_code: string; sex: string; totalBilled: number; totalPaid: number; balance: number; invoiceCount: number; }
interface LedgerData { student: { student_id: number; name: string; student_code: string; sex: string; class_reached: string }; summary: { totalBilled: number; totalPaid: number; dailyFeesPaid: number; balance: number; invoiceCount: number; paymentCount: number; paidCount: number; unpaidCount: number }; invoices: any[]; payments: any[]; dailyFees: any[]; }

function fmt(n: number) { return `GHS ${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`; }

export default function LedgerPage() {
  const { toast } = useToast();
  const [students, setStudents] = useState<StudentBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<StudentBalance | null>(null);
  const [ledger, setLedger] = useState<LedgerData | null>(null);
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ limit: "50" });
      if (search) params.set("search", search);
      const res = await fetch(`/api/admin/ledger?${params}`);
      if (!res.ok) throw new Error("Failed to load students");
      setStudents(await res.json());
    } catch {
      setError("Failed to load student data");
    }
    setLoading(false);
  }, [search]);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  const viewLedger = async (student: StudentBalance) => {
    setSelected(student);
    setLedgerLoading(true);
    setDetailOpen(true);
    try {
      const res = await fetch(`/api/admin/ledger?student_id=${student.student_id}`);
      const data = await res.json();
      if (data.error) { toast({ title: "Error", description: data.error, variant: "destructive" }); }
      else { setLedger(data); }
    } catch { toast({ title: "Error loading ledger", variant: "destructive" }); }
    setLedgerLoading(false);
  };

  const totalBilled = students.reduce((s, st) => s + st.totalBilled, 0);
  const totalPaid = students.reduce((s, st) => s + st.totalPaid, 0);
  const totalBalance = students.reduce((s, st) => s + st.balance, 0);
  const withBalance = students.filter(s => s.balance > 0).length;
  const collectionRate = totalBilled > 0 ? ((totalPaid / totalBilled) * 100).toFixed(1) : "0";

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center"><BookCheck className="w-6 h-6" /></div>
              <div><h1 className="text-lg font-bold">Student Ledger</h1><p className="text-violet-200 text-xs hidden sm:block">Account Balance Tracking</p></div>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          {loading ? Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />) : (
            <>
              <MiniStat icon={User} label="Students" value={students.length} color="violet" />
              <MiniStat icon={DollarSign} label="Total Billed" value={fmt(totalBilled)} color="sky" />
              <MiniStat icon={CreditCard} label="Total Paid" value={fmt(totalPaid)} color="emerald" />
              <MiniStat icon={Wallet} label="Outstanding" value={fmt(totalBalance)} color="red" />
              <MiniStat icon={CreditCard} label="Collection" value={`${collectionRate}%`} color="amber" />
            </>
          )}
        </div>

        {/* Collection Rate Bar */}
        {!loading && totalBilled > 0 && (
          <Card className="border-slate-200/60 mb-6"><CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-700">Collection Rate</span>
              <span className="text-sm font-bold">{totalPaid.toLocaleString()} / {totalBilled.toLocaleString()} GHS ({collectionRate}%)</span>
            </div>
            <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all ${parseFloat(collectionRate) >= 80 ? "bg-emerald-500" : parseFloat(collectionRate) >= 50 ? "bg-amber-500" : "bg-red-500"}`}
                style={{ width: `${Math.min(100, parseFloat(collectionRate))}%` }} />
            </div>
          </CardContent></Card>
        )}

        {/* Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input placeholder="Search by name or student code..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 min-h-[44px]" />
            {search && <Button variant="ghost" size="sm" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0" onClick={() => setSearch("")}><X className="w-3 h-3" /></Button>}
          </div>
          <p className="text-sm text-slate-500"><span className="text-red-600 font-medium">{withBalance}</span> students with balance</p>
        </div>

        {error && (
          <Card className="border-red-200 mb-4"><CardContent className="p-6 flex flex-col items-center text-center"><AlertCircle className="w-10 h-10 text-red-500 mb-3" /><p className="font-medium text-slate-900">{error}</p><Button variant="outline" className="mt-3" onClick={fetchStudents}><RefreshCw className="w-4 h-4 mr-2" /> Retry</Button></CardContent></Card>
        )}

        <Card className="border-slate-200/60"><CardContent className="p-0">
          <div className="max-h-[500px] overflow-y-auto">
            {/* Desktop */}
            <div className="hidden md:block">
              <Table>
                <TableHeader><TableRow className="bg-slate-50"><TableHead>Student</TableHead><TableHead>Code</TableHead><TableHead>Invoices</TableHead><TableHead className="text-right">Billed</TableHead><TableHead className="text-right">Paid</TableHead><TableHead className="text-right">Balance</TableHead><TableHead></TableHead></TableRow></TableHeader>
                <TableBody>
                  {loading ? Array.from({ length: 8 }).map((_, i) => <TableRow key={i}><TableCell colSpan={7}><Skeleton className="h-8" /></TableCell></TableRow>) :
                    students.length === 0 ? <TableRow><TableCell colSpan={7} className="text-center text-slate-400 py-12"><User className="w-10 h-10 mx-auto mb-2 opacity-50" /><p>No students found</p></TableCell></TableRow> :
                      students.map(s => (
                        <TableRow key={s.student_id} className={`cursor-pointer hover:bg-slate-50 ${s.balance > 0 ? "" : "opacity-60"}`} onClick={() => viewLedger(s)}>
                          <TableCell><div className="flex items-center gap-2"><Avatar className="w-7 h-7"><AvatarFallback className={`text-[10px] font-semibold ${s.sex === "Male" ? "bg-sky-100 text-sky-700" : "bg-pink-100 text-pink-700"}`}>{s.name.charAt(0)}</AvatarFallback></Avatar><span className="font-medium text-sm">{s.name}</span></div></TableCell>
                          <TableCell className="text-xs font-mono text-slate-500">{s.student_code}</TableCell>
                          <TableCell className="text-sm">{s.invoiceCount}</TableCell>
                          <TableCell className="text-right text-sm">{fmt(s.totalBilled)}</TableCell>
                          <TableCell className="text-right text-sm text-emerald-600">{fmt(s.totalPaid)}</TableCell>
                          <TableCell className="text-right font-medium text-sm text-red-600">{s.balance > 0 ? fmt(s.balance) : "—"}</TableCell>
                          <TableCell><Button size="sm" variant="ghost" className="h-7 text-xs"><ChevronRight className="w-4 h-4" /></Button></TableCell>
                        </TableRow>
                      ))}
                </TableBody>
              </Table>
            </div>
            {/* Mobile */}
            <div className="md:hidden divide-y">
              {loading ? Array.from({ length: 4 }).map((_, i) => <div key={i} className="p-4"><Skeleton className="h-16 rounded-lg" /></div>) :
                students.length === 0 ? <div className="text-center py-12 text-slate-400"><User className="w-10 h-10 mx-auto mb-2 opacity-50" /><p>No students found</p></div> :
                  students.map(s => (
                    <div key={s.student_id} className={`p-4 space-y-2 cursor-pointer ${s.balance > 0 ? "" : "opacity-60"}`} onClick={() => viewLedger(s)}>
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10"><AvatarFallback className={`text-sm font-semibold ${s.sex === "Male" ? "bg-sky-100 text-sky-700" : "bg-pink-100 text-pink-700"}`}>{s.name.charAt(0)}</AvatarFallback></Avatar>
                        <div className="flex-1 min-w-0"><p className="font-medium text-sm truncate">{s.name}</p><p className="text-xs text-slate-500">{s.student_code} · {s.invoiceCount} invoice(s)</p></div>
                        {s.balance > 0 && <Badge className="bg-red-100 text-red-700 text-xs">{fmt(s.balance)}</Badge>}
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-slate-50 rounded-lg p-2 text-center"><p className="text-[10px] text-slate-500">Billed</p><p className="text-xs font-bold">{fmt(s.totalBilled)}</p></div>
                        <div className="bg-emerald-50 rounded-lg p-2 text-center"><p className="text-[10px] text-slate-500">Paid</p><p className="text-xs font-bold text-emerald-700">{fmt(s.totalPaid)}</p></div>
                      </div>
                    </div>
                  ))}
            </div>
          </div>
        </CardContent></Card>
      </main>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}><DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Student Ledger — {selected?.name}</DialogTitle><DialogDescription>{selected?.student_code}</DialogDescription></DialogHeader>
        {ledgerLoading ? <div className="space-y-3 py-4">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-8" />)}</div> : ledger ? (
          <div className="space-y-4">
            <div className="bg-violet-50 rounded-lg p-4 text-center">
              <Avatar className="w-14 h-14 mx-auto mb-2"><AvatarFallback className={`text-lg font-bold ${selected?.sex === "Male" ? "bg-sky-100 text-sky-700" : "bg-pink-100 text-pink-700"}`}>{selected?.name.charAt(0)}</AvatarFallback></Avatar>
              <p className="font-bold text-lg">{selected?.name}</p><p className="text-sm text-slate-500">{selected?.student_code}</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <InfoCard label="Total Billed" value={fmt(ledger.summary.totalBilled)} color="sky" />
              <InfoCard label="Total Paid" value={fmt(ledger.summary.totalPaid)} color="emerald" />
              <InfoCard label="Outstanding" value={fmt(ledger.summary.balance)} color="red" />
              <InfoCard label="Paid Invoices" value={`${ledger.summary.paidCount} / ${ledger.summary.invoiceCount}`} color="violet" />
            </div>
            <Tabs defaultValue="invoices">
              <TabsList className="w-full"><TabsTrigger value="invoices" className="flex-1">Invoices ({ledger.invoices.length})</TabsTrigger><TabsTrigger value="payments" className="flex-1">Payments ({ledger.payments.length})</TabsTrigger><TabsTrigger value="daily" className="flex-1">Daily Fees ({ledger.dailyFees.length})</TabsTrigger></TabsList>
              <TabsContent value="invoices"><div className="max-h-60 overflow-y-auto"><Table><TableHeader><TableRow className="bg-slate-50"><TableHead>Invoice</TableHead><TableHead>Description</TableHead><TableHead>Amount</TableHead><TableHead>Paid</TableHead><TableHead>Balance</TableHead><TableHead>Status</TableHead></TableRow></TableHeader><TableBody>
                {ledger.invoices.length === 0 ? <TableRow><TableCell colSpan={6} className="text-center py-6 text-slate-400">No invoices</TableCell></TableRow> : ledger.invoices.map((inv: any) => (
                  <TableRow key={inv.invoice_id}><TableCell className="text-xs font-mono">{inv.invoice_code || `#${inv.invoice_id}`}</TableCell><TableCell className="text-sm max-w-32 truncate">{inv.title || inv.description || "—"}</TableCell><TableCell className="text-sm">{fmt(inv.amount)}</TableCell><TableCell className="text-sm text-emerald-600">{fmt(inv.amount_paid)}</TableCell><TableCell className="text-sm text-red-600">{fmt(inv.due)}</TableCell><TableCell><Badge className={inv.status === "paid" ? "bg-emerald-100 text-emerald-700 text-xs" : inv.status === "partial" ? "bg-amber-100 text-amber-700 text-xs" : "bg-red-100 text-red-700 text-xs"}>{inv.status}</Badge></TableCell></TableRow>
                ))}
              </TableBody></Table></div></TabsContent>
              <TabsContent value="payments"><div className="max-h-60 overflow-y-auto"><Table><TableHeader><TableRow className="bg-slate-50"><TableHead>Receipt</TableHead><TableHead>Amount</TableHead><TableHead>Method</TableHead><TableHead>Date</TableHead></TableRow></TableHeader><TableBody>
                {ledger.payments.length === 0 ? <TableRow><TableCell colSpan={4} className="text-center py-6 text-slate-400">No payments</TableCell></TableRow> : ledger.payments.map((pay: any) => (
                  <TableRow key={pay.payment_id}><TableCell className="text-xs font-mono">{pay.receipt_code || `#${pay.payment_id}`}</TableCell><TableCell className="text-sm text-emerald-600 font-medium">{fmt(pay.amount)}</TableCell><TableCell className="text-xs capitalize">{(pay.payment_method || "").replace(/_/g, " ")}</TableCell><TableCell className="text-xs text-slate-500">{pay.timestamp ? format(new Date(pay.timestamp), "MMM d, yyyy") : "—"}</TableCell></TableRow>
                ))}
              </TableBody></Table></div></TabsContent>
              <TabsContent value="daily"><div className="max-h-60 overflow-y-auto"><Table><TableHeader><TableRow className="bg-slate-50"><TableHead>Date</TableHead><TableHead>Feeding</TableHead><TableHead>Breakfast</TableHead><TableHead>Classes</TableHead><TableHead>Total</TableHead></TableRow></TableHeader><TableBody>
                {ledger.dailyFees.length === 0 ? <TableRow><TableCell colSpan={5} className="text-center py-6 text-slate-400">No daily fees</TableCell></TableRow> : ledger.dailyFees.map((df: any) => (
                  <TableRow key={df.id}><TableCell className="text-xs">{df.payment_date ? format(new Date(df.payment_date), "MMM d") : "—"}</TableCell><TableCell className="text-xs">{fmt(df.feeding_amount)}</TableCell><TableCell className="text-xs">{fmt(df.breakfast_amount)}</TableCell><TableCell className="text-xs">{fmt(df.classes_amount)}</TableCell><TableCell className="text-sm font-medium">{fmt(df.total_amount)}</TableCell></TableRow>
                ))}
              </TableBody></Table></div></TabsContent>
            </Tabs>
          </div>
        ) : null}
      </DialogContent></Dialog>

      <footer className="bg-white border-t border-slate-200 py-4 mt-auto"><div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center"><p className="text-xs text-slate-400">&copy; {new Date().getFullYear()} School Manager</p></div></footer>
    </div>
  );
}

function MiniStat({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: string; color: string }) {
  const c: Record<string, string> = { violet: "bg-violet-100 text-violet-600", sky: "bg-sky-100 text-sky-600", emerald: "bg-emerald-100 text-emerald-600", red: "bg-red-100 text-red-600", amber: "bg-amber-100 text-amber-600" };
  return (<Card className="border-slate-200/60"><CardContent className="p-4"><div className={`w-8 h-8 rounded-lg ${c[color]} flex items-center justify-center mb-2`}><Icon className="w-4 h-4" /></div><p className="text-xs text-slate-500 mb-1">{label}</p><p className="text-sm font-bold text-slate-900">{value}</p></CardContent></Card>);
}

function InfoCard({ label, value, color }: { label: string; value: string; color: string }) {
  const bg: Record<string, string> = { sky: "bg-sky-50 border-sky-100", emerald: "bg-emerald-50 border-emerald-100", red: "bg-red-50 border-red-100", violet: "bg-violet-50 border-violet-100" };
  return <div className={`rounded-lg border p-3 ${bg[color]} text-center`}><p className="text-[10px] text-slate-500 uppercase">{label}</p><p className="text-sm font-bold">{value}</p></div>;
}
