"use client";

import { useEffect, useState, useCallback } from "react";
import {
  AlertTriangle,
  CreditCard,
  Receipt,
  Loader2,
  DollarSign,
  CheckCircle,
  History,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { format } from "date-fns";

// ─── Types ───────────────────────────────────────────────────
interface StudentItem {
  student_id: number;
  student_code: string;
  name: string;
  first_name: string;
  last_name: string;
}

interface InvoiceItem {
  invoice_id: number;
  invoice_code: string;
  title: string;
  amount: number;
  amount_paid: number;
  due: number;
  status: string;
  year: string;
  term: string;
  creation_timestamp: string | null;
}

interface PaymentItem {
  payment_id: number;
  receipt_code: string;
  invoice_code: string;
  amount: number;
  payment_method: string;
  timestamp: string | null;
  student: { student_id: number; name: string; student_code: string };
}

// ─── Helpers ─────────────────────────────────────────────────
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "GHS", minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(amount);
}

function statusBadge(status: string) {
  switch (status) {
    case "paid": return <Badge className="bg-emerald-100 text-emerald-700">Paid</Badge>;
    case "partial": return <Badge className="bg-blue-100 text-blue-700">Partial</Badge>;
    case "unpaid": return <Badge className="bg-red-100 text-red-700">Unpaid</Badge>;
    default: return <Badge variant="secondary">{status}</Badge>;
  }
}

// ─── Main Component ──────────────────────────────────────────
export default function ParentPaymentsPage() {
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStudents = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/students?limit=50");
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setStudents(data.students || []);
    } catch {
      setError("Failed to load children");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  const fetchData = useCallback(async () => {
    if (!selectedStudent) { setInvoices([]); setPayments([]); return; }
    setIsLoading(true);
    setError(null);
    try {
      const [invRes, payRes] = await Promise.all([
        fetch(`/api/invoices?search=${students.find(s => s.student_id === parseInt(selectedStudent))?.student_code || ""}&limit=50`),
        fetch(`/api/payments?search=${students.find(s => s.student_id === parseInt(selectedStudent))?.student_code || ""}&limit=50`),
      ]);

      if (invRes.ok) { const d = await invRes.json(); setInvoices(d.invoices || []); }
      if (payRes.ok) { const d = await payRes.json(); setPayments(d.payments || []); }
    } catch {
      setError("Failed to load payment data");
    } finally {
      setIsLoading(false);
    }
  }, [selectedStudent, students]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const totalBilled = invoices.reduce((s, i) => s + (i.amount || 0), 0);
  const totalPaid = invoices.reduce((s, i) => s + (i.amount_paid || 0), 0);
  const totalDue = invoices.reduce((s, i) => s + (i.due || 0), 0);
  const unpaidCount = invoices.filter(i => i.status === "unpaid" || i.status === "partial").length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Fee Payments</h1>
          <p className="text-sm text-slate-500 mt-1">View invoices and payment history for your children</p>
        </div>

        {/* ─── Child Selector ─────────────────────────────── */}
        <Card className="gap-4">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Select Child</Label>
                <Select value={selectedStudent} onValueChange={(v) => { setSelectedStudent(v); }}>
                  <SelectTrigger><SelectValue placeholder="Choose a child" /></SelectTrigger>
                  <SelectContent>
                    {students.map((s) => (
                      <SelectItem key={s.student_id} value={String(s.student_id)}>
                        {s.name || `${s.first_name} ${s.last_name}`.trim()} — {s.student_code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {error && (
          <div className="flex items-center gap-3 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />{error}
          </div>
        )}

        {selectedStudent && (
          <>
            {/* Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Card className="py-3 border-l-4 border-l-slate-400"><CardContent className="px-3 pt-0 pb-0"><p className="text-xs text-slate-500">Total Billed</p><p className="text-lg font-bold text-slate-900 tabular-nums">{formatCurrency(totalBilled)}</p></CardContent></Card>
              <Card className="py-3 border-l-4 border-l-emerald-500"><CardContent className="px-3 pt-0 pb-0"><p className="text-xs text-slate-500">Total Paid</p><p className="text-lg font-bold text-emerald-600 tabular-nums">{formatCurrency(totalPaid)}</p></CardContent></Card>
              <Card className="py-3 border-l-4 border-l-red-500"><CardContent className="px-3 pt-0 pb-0"><p className="text-xs text-slate-500">Outstanding</p><p className="text-lg font-bold text-red-600 tabular-nums">{formatCurrency(totalDue)}</p></CardContent></Card>
              <Card className="py-3 border-l-4 border-l-amber-500"><CardContent className="px-3 pt-0 pb-0"><p className="text-xs text-slate-500">Unpaid Invoices</p><p className="text-lg font-bold text-amber-600">{unpaidCount}</p></CardContent></Card>
            </div>

            {/* Invoices */}
            <Card className="gap-4">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center"><Receipt className="w-4 h-4 text-red-600" /></div>
                  <CardTitle className="text-base font-semibold">Invoices</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {isLoading ? (
                  <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
                ) : invoices.length === 0 ? (
                  <div className="text-center py-12"><Receipt className="w-12 h-12 text-slate-300 mx-auto mb-3" /><p className="text-slate-400 text-sm">No invoices found</p></div>
                ) : (
                  <div className="overflow-x-auto rounded-lg border border-slate-200 max-h-64 overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50 hover:bg-slate-50">
                          <TableHead className="text-xs font-semibold text-slate-600 uppercase">Invoice</TableHead>
                          <TableHead className="text-xs font-semibold text-slate-600 uppercase hidden sm:table-cell">Description</TableHead>
                          <TableHead className="text-xs font-semibold text-slate-600 uppercase text-right">Amount</TableHead>
                          <TableHead className="text-xs font-semibold text-slate-600 uppercase text-right">Balance</TableHead>
                          <TableHead className="text-xs font-semibold text-slate-600 uppercase text-center">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {invoices.map((inv) => (
                          <TableRow key={inv.invoice_id} className="hover:bg-slate-50">
                            <TableCell className="font-mono text-sm">{inv.invoice_code}</TableCell>
                            <TableCell className="hidden sm:table-cell text-sm text-slate-600 max-w-[200px] truncate">{inv.title}</TableCell>
                            <TableCell className="text-right font-semibold text-sm tabular-nums">{formatCurrency(inv.amount)}</TableCell>
                            <TableCell className="text-right font-semibold text-sm tabular-nums text-red-600">{formatCurrency(inv.due)}</TableCell>
                            <TableCell className="text-center">{statusBadge(inv.status)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Payment History */}
            <Card className="gap-4">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center"><History className="w-4 h-4 text-emerald-600" /></div>
                  <CardTitle className="text-base font-semibold">Payment History</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {payments.length === 0 ? (
                  <div className="text-center py-12"><CreditCard className="w-12 h-12 text-slate-300 mx-auto mb-3" /><p className="text-slate-400 text-sm">No payment history found</p></div>
                ) : (
                  <div className="overflow-x-auto rounded-lg border border-slate-200 max-h-64 overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50 hover:bg-slate-50">
                          <TableHead className="text-xs font-semibold text-slate-600 uppercase">Receipt #</TableHead>
                          <TableHead className="text-xs font-semibold text-slate-600 uppercase text-right">Amount</TableHead>
                          <TableHead className="text-xs font-semibold text-slate-600 uppercase hidden sm:table-cell">Method</TableHead>
                          <TableHead className="text-xs font-semibold text-slate-600 uppercase hidden sm:table-cell">Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {payments.map((p) => (
                          <TableRow key={p.payment_id} className="hover:bg-slate-50">
                            <TableCell className="font-mono text-sm">{p.receipt_code}</TableCell>
                            <TableCell className="text-right font-semibold text-sm text-emerald-600 tabular-nums">{formatCurrency(p.amount)}</TableCell>
                            <TableCell className="hidden sm:table-cell text-sm text-slate-500 capitalize">{p.payment_method?.replace(/_/g, " ")}</TableCell>
                            <TableCell className="hidden sm:table-cell text-sm text-slate-500">{p.timestamp ? format(new Date(p.timestamp), "MMM d, yyyy") : "—"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {!selectedStudent && !isLoading && (
          <Card className="gap-4">
            <CardContent className="py-16">
              <div className="text-center">
                <DollarSign className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-600">Select a child to view payments</h3>
                <p className="text-sm text-slate-400 mt-1">Choose a child from the dropdown above</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
