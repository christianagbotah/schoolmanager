"use client";

import { useEffect, useState, useCallback } from "react";
import {
  AlertTriangle,
  CreditCard,
  Plus,
  Loader2,
  Search,
  CheckCircle,
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { format } from "date-fns";

// ─── Types ───────────────────────────────────────────────────
interface StudentItem {
  student_id: number;
  student_code: string;
  name: string;
}

interface InvoiceItem {
  invoice_id: number;
  invoice_code: string;
  title: string;
  due: number;
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

// ─── Main Component ──────────────────────────────────────────
export default function AccountantPaymentsPage() {
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<{ todayTotal: number; monthTotal: number; totalCollected: number } | null>(null);

  // New payment form
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formStudentId, setFormStudentId] = useState("");
  const [formInvoiceId, setFormInvoiceId] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [formMethod, setFormMethod] = useState("cash");
  const [isSaving, setIsSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ type: string; text: string } | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ limit: "50" });
      if (search) params.set("search", search);

      const [payRes, stuRes] = await Promise.all([
        fetch(`/api/payments?${params}`),
        fetch("/api/students?limit=200"),
      ]);

      if (payRes.ok) {
        const data = await payRes.json();
        setPayments(data.payments || []);
        setSummary(data.summary || null);
      }
      if (stuRes.ok) {
        const data = await stuRes.json();
        setStudents(data.students || []);
      }
    } catch {
      setError("Failed to load payments");
    } finally {
      setIsLoading(false);
    }
  }, [search]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Fetch invoices when student is selected
  useEffect(() => {
    if (!formStudentId) { setInvoices([]); return; }
    fetch(`/api/invoices?search=${students.find(s => s.student_id === parseInt(formStudentId))?.student_code || ""}&status=unpaid&limit=50`)
      .then(r => r.ok ? r.json() : { invoices: [] })
      .then(d => setInvoices(d.invoices || []));
  }, [formStudentId, students]);

  const handleRecordPayment = async () => {
    if (!formStudentId || !formAmount || !formMethod) return;
    setIsSaving(true);
    setSaveMsg(null);
    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: parseInt(formStudentId),
          invoiceId: formInvoiceId ? parseInt(formInvoiceId) : null,
          amount: parseFloat(formAmount),
          paymentMethod: formMethod,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setSaveMsg({ type: "success", text: data.message || `Payment recorded. Receipt: ${data.receiptCode}` });
      setDialogOpen(false);
      setFormStudentId("");
      setFormInvoiceId("");
      setFormAmount("");
      fetchData();
    } catch {
      setSaveMsg({ type: "error", text: "Failed to record payment" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Payments</h1>
            <p className="text-sm text-slate-500 mt-1">Record and manage student payments</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-emerald-600 hover:bg-emerald-700 min-w-[44px] min-h-[44px]">
                <Plus className="w-4 h-4 mr-2" />Record Payment
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Record New Payment</DialogTitle></DialogHeader>
              <div className="space-y-4 mt-4">
                {saveMsg && (
                  <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${saveMsg.type === "success" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                    {saveMsg.type === "success" ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                    {saveMsg.text}
                  </div>
                )}
                <div className="space-y-2">
                  <Label>Student *</Label>
                  <Select value={formStudentId} onValueChange={(v) => { setFormStudentId(v); setFormInvoiceId(""); }}>
                    <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
                    <SelectContent>{students.map(s => <SelectItem key={s.student_id} value={String(s.student_id)}>{s.name} ({s.student_code})</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Invoice (Optional)</Label>
                  <Select value={formInvoiceId} onValueChange={setFormInvoiceId}>
                    <SelectTrigger><SelectValue placeholder="Select invoice" /></SelectTrigger>
                    <SelectContent>
                      {invoices.map(inv => <SelectItem key={inv.invoice_id} value={String(inv.invoice_id)}>{inv.invoice_code} — {formatCurrency(inv.due)} due</SelectItem>)}
                      {invoices.length === 0 && formStudentId && <SelectItem value="none" disabled>No unpaid invoices</SelectItem>}
                    </SelectContent>
                  </Select>
                </div>
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
                <Button onClick={handleRecordPayment} disabled={isSaving || !formStudentId || !formAmount} className="w-full bg-emerald-600 hover:bg-emerald-700 min-h-[44px]">
                  {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CreditCard className="w-4 h-4 mr-2" />}
                  Record Payment
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Summary */}
        {summary && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Card className="py-3 border-l-4 border-l-emerald-500"><CardContent className="px-3 pt-0 pb-0"><p className="text-xs text-slate-500">Today</p><p className="text-lg font-bold text-emerald-600">{formatCurrency(summary.todayTotal)}</p></CardContent></Card>
            <Card className="py-3 border-l-4 border-l-blue-500"><CardContent className="px-3 pt-0 pb-0"><p className="text-xs text-slate-500">This Month</p><p className="text-lg font-bold text-blue-600">{formatCurrency(summary.monthTotal)}</p></CardContent></Card>
            <Card className="py-3 border-l-4 border-l-slate-400"><CardContent className="px-3 pt-0 pb-0"><p className="text-xs text-slate-500">All Time</p><p className="text-lg font-bold text-slate-900">{formatCurrency(summary.totalCollected)}</p></CardContent></Card>
          </div>
        )}

        {/* Search */}
        <Card className="gap-4">
          <CardContent className="pt-6">
            <div className="space-y-2">
              <Label>Search</Label>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input placeholder="Search by student name or receipt code..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
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
            ) : payments.length === 0 ? (
              <div className="text-center py-12"><CreditCard className="w-12 h-12 text-slate-300 mx-auto mb-3" /><p className="text-slate-400 text-sm">No payments found</p></div>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-slate-200 max-h-[500px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50 hover:bg-slate-50">
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase">Receipt</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase">Student</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase hidden sm:table-cell">Invoice</TableHead>
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
                        <TableCell className="hidden sm:table-cell font-mono text-xs text-slate-500">{p.invoice_code || "—"}</TableCell>
                        <TableCell className="text-right font-semibold text-sm text-emerald-600 tabular-nums">{formatCurrency(p.amount)}</TableCell>
                        <TableCell className="hidden sm:table-cell text-sm text-slate-500 capitalize">{p.payment_method?.replace(/_/g, " ")}</TableCell>
                        <TableCell className="hidden md:table-cell text-sm text-slate-500">{p.timestamp ? format(new Date(p.timestamp), "MMM d, yyyy") : "—"}</TableCell>
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
