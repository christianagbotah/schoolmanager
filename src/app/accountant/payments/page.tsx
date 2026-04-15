"use client";

import { useEffect, useState, useCallback } from "react";
import {
  AlertTriangle,
  CreditCard,
  Plus,
  Loader2,
  Search,
  CheckCircle,
  DollarSign,
  Receipt,
  Wallet,
  Clock,
  BarChart3,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Bar, BarChart, XAxis, YAxis, CartesianGrid, Cell } from "recharts";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { format } from "date-fns";

// ─── Types ───────────────────────────────────────────────────
interface OwingStudent {
  student_id: number;
  student: { student_id: number; name: string; student_code: string };
  class?: { name: string };
  invoice_id: number;
  invoice_code: string;
  title: string;
  amount: number;
  amount_paid: number;
  due: number;
  year: string;
  term: string;
}

interface PaymentItem {
  payment_id: number;
  receipt_code: string;
  invoice_code: string;
  title: string;
  amount: number;
  payment_method: string;
  timestamp: string | null;
  student: { student_id: number; name: string; student_code: string };
}

// ─── Helpers ─────────────────────────────────────────────────
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "GHS", minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(amount);
}

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#8b5cf6", "#ef4444"];
const chartConfig = { amount: { label: "Collected", color: "#10b981" } };

// ─── Main Component ──────────────────────────────────────────
export default function AccountantPaymentsPage() {
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [owingStudents, setOwingStudents] = useState<OwingStudent[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<{ todayTotal: number; todayCount: number; monthTotal: number; monthCount: number; totalCollected: number; totalCount: number } | null>(null);
  const [methodBreakdown, setMethodBreakdown] = useState<{ method: string; amount: number; count: number }[]>([]);
  const [page, setPage] = useState(1);

  // Record payment form
  const [dialogOpen, setDialogOpen] = useState(false);
  const [studentSearch, setStudentSearch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<OwingStudent | null>(null);
  const [studentInvoices, setStudentInvoices] = useState<OwingStudent[]>([]);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [formMethod, setFormMethod] = useState("cash");
  const [isSaving, setIsSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ type: string; text: string } | null>(null);
  const [receiptResult, setReceiptResult] = useState<{ receiptCode: string } | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ limit: "30", page: String(page) });
      if (search) params.set("search", search);

      const res = await fetch(`/api/accountant/payments?${params}`);
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setPayments(data.payments || []);
      setSummary(data.summary || null);
      setOwingStudents(data.owingStudents || []);
      setMethodBreakdown(data.methodBreakdown || []);
    } catch {
      setError("Failed to load payments");
    } finally {
      setIsLoading(false);
    }
  }, [search, page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filteredOwing = studentSearch
    ? owingStudents.filter(o =>
        o.student?.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
        o.student?.student_code.toLowerCase().includes(studentSearch.toLowerCase())
      )
    : owingStudents;

  // When student selected, load their invoices
  useEffect(() => {
    if (!selectedStudent) { setStudentInvoices([]); return; }
    const invs = owingStudents.filter(o => o.student_id === selectedStudent.student_id);
    setStudentInvoices(invs);
    setSelectedInvoiceId(invs.length > 0 ? String(invs[0].invoice_id) : "");
    setFormAmount(invs.length > 0 ? String(invs[0].due) : "");
  }, [selectedStudent, owingStudents]);

  const openRecordDialog = () => {
    setDialogOpen(true);
    setSaveMsg(null);
    setReceiptResult(null);
    setSelectedStudent(null);
    setStudentSearch("");
    setFormAmount("");
    setSelectedInvoiceId("");
  };

  const handleRecordPayment = async () => {
    if (!selectedStudent || !formAmount || !formMethod) return;
    setIsSaving(true);
    setSaveMsg(null);
    try {
      const res = await fetch("/api/accountant/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: selectedStudent.student_id,
          invoiceId: selectedInvoiceId ? parseInt(selectedInvoiceId) : null,
          amount: parseFloat(formAmount),
          paymentMethod: formMethod,
          year: selectedStudent.year,
          term: selectedStudent.term,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setReceiptResult({ receiptCode: data.receiptCode });
      setSaveMsg({ type: "success", text: `Payment of ${formatCurrency(parseFloat(formAmount))} recorded successfully` });
      fetchData();
    } catch {
      setSaveMsg({ type: "error", text: "Failed to record payment" });
    } finally {
      setIsSaving(false);
    }
  };

  const getInitials = (name: string) => {
    return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 p-6 text-white shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                <CreditCard className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Payment Management</h1>
                <p className="text-emerald-100 text-sm">Record and manage student fee payments</p>
              </div>
            </div>
            <Button className="bg-white text-emerald-700 hover:bg-emerald-50 min-w-[44px] min-h-[44px] font-semibold" onClick={openRecordDialog}>
              <Plus className="w-4 h-4 mr-2" />Record Payment
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="py-3 border-l-4 border-l-emerald-500"><CardContent className="px-3 pt-0 pb-0"><div className="flex items-center gap-1"><Clock className="w-3 h-3 text-emerald-500" /><p className="text-xs text-slate-500">Today</p></div><p className="text-lg font-bold text-emerald-600 tabular-nums">{formatCurrency(summary?.todayTotal || 0)}</p><p className="text-xs text-slate-400">{summary?.todayCount || 0} transactions</p></CardContent></Card>
          <Card className="py-3 border-l-4 border-l-sky-500"><CardContent className="px-3 pt-0 pb-0"><div className="flex items-center gap-1"><Wallet className="w-3 h-3 text-sky-500" /><p className="text-xs text-slate-500">This Month</p></div><p className="text-lg font-bold text-sky-600 tabular-nums">{formatCurrency(summary?.monthTotal || 0)}</p><p className="text-xs text-slate-400">{summary?.monthCount || 0} transactions</p></CardContent></Card>
          <Card className="py-3 border-l-4 border-l-slate-500"><CardContent className="px-3 pt-0 pb-0"><div className="flex items-center gap-1"><DollarSign className="w-3 h-3 text-slate-500" /><p className="text-xs text-slate-500">All Time</p></div><p className="text-lg font-bold text-slate-900 tabular-nums">{formatCurrency(summary?.totalCollected || 0)}</p><p className="text-xs text-slate-400">{summary?.totalCount || 0} total</p></CardContent></Card>
          <Card className="py-3 border-l-4 border-l-amber-500"><CardContent className="px-3 pt-0 pb-0"><div className="flex items-center gap-1"><AlertTriangle className="w-3 h-3 text-amber-500" /><p className="text-xs text-slate-500">Owing Students</p></div><p className="text-lg font-bold text-amber-600">{owingStudents.length}</p><p className="text-xs text-slate-400">With outstanding balance</p></CardContent></Card>
        </div>

        {/* Method Breakdown Chart + Search */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {methodBreakdown.length > 0 && (
            <Card className="gap-4">
              <CardHeader className="pb-0">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center"><BarChart3 className="w-4 h-4 text-emerald-600" /></div>
                  <CardTitle className="text-base font-semibold">Payment Methods</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <ChartContainer config={chartConfig} className="h-[200px] w-full">
                  <BarChart data={methodBreakdown} layout="vertical" margin={{ top: 5, right: 10, left: 80, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11, fill: "#94a3b8" }} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)} />
                    <YAxis type="category" dataKey="method" tick={{ fontSize: 11, fill: "#64748b" }} width={75} tickFormatter={(v: string) => v.replace(/_/g, " ")} />
                    <ChartTooltip content={<ChartTooltipContent formatter={(value) => formatCurrency(value as number)} />} />
                    <Bar dataKey="amount" radius={[0, 4, 4, 0]} maxBarSize={24}>
                      {methodBreakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          )}

          <Card className={`gap-4 ${methodBreakdown.length === 0 ? "lg:col-span-3" : "lg:col-span-2"}`}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center"><Receipt className="w-4 h-4 text-slate-600" /></div>
                  <CardTitle className="text-base font-semibold">Payment History</CardTitle>
                </div>
              </div>
              <div className="space-y-2 mb-4">
                <Label>Search</Label>
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input placeholder="Search by student name or receipt code..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="pl-9" />
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm mb-4">
                  <AlertTriangle className="w-4 h-4" />{error}
                </div>
              )}

              {isLoading ? (
                <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
              ) : payments.length === 0 ? (
                <div className="text-center py-12"><CreditCard className="w-12 h-12 text-slate-300 mx-auto mb-3" /><p className="text-slate-400 text-sm">No payments found</p></div>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-slate-200 max-h-[400px] overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50 hover:bg-slate-50">
                        <TableHead className="text-xs font-semibold text-slate-600 uppercase">Receipt</TableHead>
                        <TableHead className="text-xs font-semibold text-slate-600 uppercase">Student</TableHead>
                        <TableHead className="text-xs font-semibold text-slate-600 uppercase hidden md:table-cell">Invoice</TableHead>
                        <TableHead className="text-xs font-semibold text-slate-600 uppercase text-right">Amount</TableHead>
                        <TableHead className="text-xs font-semibold text-slate-600 uppercase hidden sm:table-cell">Method</TableHead>
                        <TableHead className="text-xs font-semibold text-slate-600 uppercase hidden md:table-cell">Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payments.map((p) => (
                        <TableRow key={p.payment_id} className="hover:bg-slate-50">
                          <TableCell className="font-mono text-sm">{p.receipt_code}</TableCell>
                          <TableCell className="font-medium text-sm">{p.student?.name || "Unknown"}</TableCell>
                          <TableCell className="hidden md:table-cell font-mono text-xs text-slate-500">{p.invoice_code || "—"}</TableCell>
                          <TableCell className="text-right font-semibold text-sm text-emerald-600 tabular-nums">{formatCurrency(p.amount)}</TableCell>
                          <TableCell className="hidden sm:table-cell text-sm text-slate-500 capitalize">{p.payment_method?.replace(/_/g, " ")}</TableCell>
                          <TableCell className="hidden md:table-cell text-sm text-slate-500">{p.timestamp ? format(new Date(p.timestamp), "MMM d, yyyy") : "—"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-slate-500">Showing page {page}</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
                  <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)}>Next</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Record Payment Dialog */}
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) { setReceiptResult(null); setSaveMsg(null); } }}>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Record Payment</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-2">
              {receiptResult ? (
                <div className="text-center space-y-4 py-6">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
                    <CheckCircle className="w-8 h-8 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-emerald-700">Payment Recorded!</p>
                    <p className="text-sm text-slate-500 mt-1">Receipt: <span className="font-mono font-semibold">{receiptResult.receiptCode}</span></p>
                  </div>
                  <div className="flex gap-3 justify-center">
                    <Button variant="outline" onClick={() => { setReceiptResult(null); setSelectedStudent(null); }}>Record Another</Button>
                    <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => setDialogOpen(false)}>Done</Button>
                  </div>
                </div>
              ) : (
                <>
                  {saveMsg && (
                    <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${saveMsg.type === "success" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                      {saveMsg.type === "success" ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                      {saveMsg.text}
                    </div>
                  )}

                  {/* Student selector - who owes */}
                  {!selectedStudent ? (
                    <div className="space-y-2">
                      <Label>Select Student (Owing Fees)</Label>
                      <div className="relative">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <Input placeholder="Search by name or code..." value={studentSearch} onChange={(e) => setStudentSearch(e.target.value)} className="pl-9" />
                      </div>
                      <div className="max-h-60 overflow-y-auto rounded-lg border">
                        {filteredOwing.length === 0 ? (
                          <p className="text-center text-slate-400 text-sm py-8">No students with outstanding fees</p>
                        ) : (
                          filteredOwing.map((o) => (
                            <button key={o.invoice_id} type="button" onClick={() => setSelectedStudent(o)}
                              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 border-b last:border-b-0 transition-colors text-left">
                              <div className="w-9 h-9 rounded-full bg-sky-100 flex items-center justify-center text-sky-700 text-xs font-bold flex-shrink-0">
                                {getInitials(o.student?.name || "U")}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate">{o.student?.name}</p>
                                <p className="text-xs text-slate-500">{o.student?.student_code} • {o.class?.name || ""} • {o.title}</p>
                              </div>
                              <div className="text-right flex-shrink-0">
                                <p className="font-semibold text-sm text-red-600">{formatCurrency(o.due)}</p>
                                <p className="text-xs text-slate-400">outstanding</p>
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Selected student info */}
                      <div className="p-4 rounded-lg bg-sky-50 border border-sky-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-sky-200 flex items-center justify-center text-sky-800 text-sm font-bold">
                              {getInitials(selectedStudent.student?.name || "U")}
                            </div>
                            <div>
                              <p className="font-semibold text-sm">{selectedStudent.student?.name}</p>
                              <p className="text-xs text-slate-500">{selectedStudent.student?.student_code} • Term {selectedStudent.term}, {selectedStudent.year}</p>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => setSelectedStudent(null)}>Change</Button>
                        </div>
                      </div>

                      {/* Invoice selector */}
                      <div className="space-y-2">
                        <Label>Invoice</Label>
                        <Select value={selectedInvoiceId} onValueChange={(v) => {
                          setSelectedInvoiceId(v);
                          const inv = studentInvoices.find(i => String(i.invoice_id) === v);
                          if (inv) setFormAmount(String(inv.due));
                        }}>
                          <SelectTrigger><SelectValue placeholder="Select invoice" /></SelectTrigger>
                          <SelectContent>
                            {studentInvoices.map(inv => (
                              <SelectItem key={inv.invoice_id} value={String(inv.invoice_id)}>
                                {inv.invoice_code} — {inv.title} ({formatCurrency(inv.due)} due)
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Amount *</Label>
                          <Input type="number" min={0} step={0.01} value={formAmount} onChange={(e) => setFormAmount(e.target.value)} placeholder="0.00" />
                        </div>
                        <div className="space-y-2">
                          <Label>Payment Method *</Label>
                          <Select value={formMethod} onValueChange={setFormMethod}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="cash">Cash</SelectItem>
                              <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                              <SelectItem value="mobile_money">Mobile Money</SelectItem>
                              <SelectItem value="cheque">Cheque</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <Button onClick={handleRecordPayment} disabled={isSaving || !formAmount} className="w-full bg-emerald-600 hover:bg-emerald-700 min-h-[44px]">
                        {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CreditCard className="w-4 h-4 mr-2" />}
                        Record Payment — {formatCurrency(parseFloat(formAmount) || 0)}
                      </Button>
                    </>
                  )}
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
