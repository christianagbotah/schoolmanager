"use client";

import { useEffect, useState, useCallback } from "react";
import {
  AlertTriangle, CreditCard, Receipt, DollarSign, CheckCircle, History,
  Smartphone, Loader2, Eye, X,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useAuth } from "@/hooks/use-auth";
import { format } from "date-fns";

interface ChildItem { student_id: number; name: string; first_name: string; last_name: string; student_code: string; }
interface InvoiceItem {
  invoice_id: number; invoice_code: string; title: string; amount: number;
  amount_paid: number; due: number; status: string; year: string; term: string;
  creation_timestamp: string | null; payment_timestamp: string | null; student_id: number;
}
interface PaymentItem {
  payment_id: number; receipt_code: string; invoice_code: string; amount: number;
  payment_method: string; payment_type: string; timestamp: string | null;
  approval_status: string; student_id: number;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "GHS", minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(amount);
}

function statusBadge(status: string) {
  const dueNum = parseFloat(status);
  if (status === "paid" || dueNum === 0) return <Badge className="bg-emerald-100 text-emerald-700">Paid</Badge>;
  if (status === "partial") return <Badge className="bg-amber-100 text-amber-700">Partial</Badge>;
  return <Badge className="bg-red-100 text-red-700">Unpaid</Badge>;
}

export default function ParentPaymentsPage() {
  const { isLoading: authLoading, isParent } = useAuth();
  const [children, setChildren] = useState<ChildItem[]>([]);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [moAccountName, setMoAccountName] = useState("");
  const [moAccountNumber, setMoAccountNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [payDialogOpen, setPayDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceItem | null>(null);
  const [viewInvoice, setViewInvoice] = useState<InvoiceItem | null>(null);

  // Payment form
  const [payName, setPayName] = useState("");
  const [payPhone, setPayPhone] = useState("");
  const [payAmount, setPayAmount] = useState("");
  const [payChannel, setPayChannel] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && isParent) {
      fetch("/api/parent/payments").then(r => r.json()).then(data => {
        setChildren(data.children || []);
        setMoAccountName(data.moAccountName || "");
        setMoAccountNumber(data.moAccountNumber || "");
      }).catch(() => setError("Failed to load data"));
    }
  }, [authLoading, isParent]);

  const fetchData = useCallback(async () => {
    if (!selectedStudent) { setInvoices([]); setPayments([]); return; }
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/parent/payments?student_id=${selectedStudent}`);
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setInvoices(data.invoices || []);
      setPayments(data.payments || []);
    } catch { setError("Failed to load payment data"); }
    finally { setIsLoading(false); }
  }, [selectedStudent]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const totalBilled = invoices.reduce((s, i) => s + (i.amount || 0), 0);
  const totalPaid = invoices.reduce((s, i) => s + (i.amount_paid || 0), 0);
  const totalDue = invoices.reduce((s, i) => s + (i.due || 0), 0);
  const unpaidCount = invoices.filter(i => i.due > 0).length;

  const openPayDialog = (inv: InvoiceItem) => {
    setSelectedInvoice(inv);
    setPayAmount(String(inv.due));
    setPayName("");
    setPayPhone("");
    setPayChannel("");
    setPayDialogOpen(true);
  };

  const handleSubmitPayment = async () => {
    if (!payName || !payPhone || !payAmount || !payChannel || !selectedInvoice) return;
    setIsSubmitting(true);
    try {
      // In real app, this would call a payment API
      await new Promise(r => setTimeout(r, 1500));
      setPayDialogOpen(false);
      fetchData();
    } catch { setError("Payment submission failed"); }
    finally { setIsSubmitting(false); }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div><h1 className="text-2xl font-bold text-slate-900 tracking-tight">Fee Payments</h1><p className="text-sm text-slate-500 mt-1">View invoices and payment history for your children</p></div>

        {/* Child Selector */}
        <Card className="gap-4">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Select Child</Label>
                <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                  <SelectTrigger><SelectValue placeholder="Choose a child" /></SelectTrigger>
                  <SelectContent>
                    {children.map((s) => <SelectItem key={s.student_id} value={String(s.student_id)}>{s.name} — {s.student_code}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              {moAccountNumber && (
                <div className="space-y-2">
                  <Label>Mobile Money Details</Label>
                  <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-sm">
                    <p className="font-medium text-amber-800">{moAccountName}</p>
                    <p className="text-amber-700">{moAccountNumber}</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {error && <div className="flex items-center gap-3 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm"><AlertTriangle className="w-5 h-5 flex-shrink-0" />{error}</div>}

        {selectedStudent && (
          <>
            {/* Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Card className="py-3 border-l-4 border-l-slate-400"><CardContent className="px-3 pt-0 pb-0"><p className="text-xs text-slate-500">Total Billed</p><p className="text-lg font-bold text-slate-900 tabular-nums">{formatCurrency(totalBilled)}</p></CardContent></Card>
              <Card className="py-3 border-l-4 border-l-emerald-500"><CardContent className="px-3 pt-0 pb-0"><p className="text-xs text-slate-500">Total Paid</p><p className="text-lg font-bold text-emerald-600 tabular-nums">{formatCurrency(totalPaid)}</p></CardContent></Card>
              <Card className="py-3 border-l-4 border-l-red-500"><CardContent className="px-3 pt-0 pb-0"><p className="text-xs text-slate-500">Outstanding</p><p className="text-lg font-bold text-red-600 tabular-nums">{formatCurrency(totalDue)}</p></CardContent></Card>
              <Card className="py-3 border-l-4 border-l-amber-500"><CardContent className="px-3 pt-0 pb-0"><p className="text-xs text-slate-500">Unpaid</p><p className="text-lg font-bold text-amber-600">{unpaidCount}</p></CardContent></Card>
            </div>

            {/* Invoices */}
            <Card className="gap-4">
              <CardHeader>
                <div className="flex items-center gap-2"><div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center"><Receipt className="w-4 h-4 text-red-600" /></div><CardTitle className="text-base font-semibold">Invoices</CardTitle></div>
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
                          <TableHead className="text-xs font-semibold text-slate-600 uppercase hidden sm:table-cell">Title</TableHead>
                          <TableHead className="text-xs font-semibold text-slate-600 uppercase text-right">Amount</TableHead>
                          <TableHead className="text-xs font-semibold text-slate-600 uppercase text-right">Balance</TableHead>
                          <TableHead className="text-xs font-semibold text-slate-600 uppercase text-center">Status</TableHead>
                          <TableHead className="text-xs font-semibold text-slate-600 uppercase text-center">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {invoices.map((inv) => (
                          <TableRow key={inv.invoice_id} className="hover:bg-slate-50">
                            <TableCell className="font-mono text-sm">{inv.invoice_code}</TableCell>
                            <TableCell className="hidden sm:table-cell text-sm text-slate-600 max-w-[200px] truncate">{inv.title} {inv.year && `(${inv.year} T${inv.term})`}</TableCell>
                            <TableCell className="text-right font-semibold text-sm tabular-nums">{formatCurrency(inv.amount)}</TableCell>
                            <TableCell className="text-right font-semibold text-sm tabular-nums text-red-600">{formatCurrency(inv.due)}</TableCell>
                            <TableCell className="text-center">{statusBadge(inv.status || (inv.due > 0 ? "unpaid" : "paid"))}</TableCell>
                            <TableCell className="text-center">
                              <div className="flex items-center justify-center gap-1">
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setViewInvoice(inv)}><Eye className="w-3.5 h-3.5" /></Button>
                                {inv.due > 0 && (
                                  <Button size="sm" className="h-8 bg-emerald-600 hover:bg-emerald-700 text-xs px-2" onClick={() => openPayDialog(inv)}><Smartphone className="w-3 h-3 mr-1" />Pay</Button>
                                )}
                              </div>
                            </TableCell>
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
                <div className="flex items-center gap-2"><div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center"><History className="w-4 h-4 text-emerald-600" /></div><CardTitle className="text-base font-semibold">Payment History</CardTitle></div>
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
                          <TableHead className="text-xs font-semibold text-slate-600 uppercase text-center">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {payments.map((p) => (
                          <TableRow key={p.payment_id} className="hover:bg-slate-50">
                            <TableCell className="font-mono text-sm">{p.receipt_code || "—"}</TableCell>
                            <TableCell className="text-right font-semibold text-sm text-emerald-600 tabular-nums">{formatCurrency(p.amount)}</TableCell>
                            <TableCell className="hidden sm:table-cell text-sm text-slate-500 capitalize">{p.payment_method?.replace(/_/g, " ") || "—"}</TableCell>
                            <TableCell className="hidden sm:table-cell text-sm text-slate-500">{p.timestamp ? format(new Date(p.timestamp), "MMM d, yyyy") : "—"}</TableCell>
                            <TableCell className="text-center"><Badge variant={p.approval_status === "approved" ? "default" : "secondary"} className={p.approval_status === "approved" ? "bg-emerald-100 text-emerald-700 text-xs" : "bg-amber-100 text-amber-700 text-xs"}>{p.approval_status || "Pending"}</Badge></TableCell>
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
          <Card className="gap-4"><CardContent className="py-16"><div className="text-center"><DollarSign className="w-16 h-16 text-slate-200 mx-auto mb-4" /><h3 className="text-lg font-medium text-slate-600">Select a child to view payments</h3><p className="text-sm text-slate-400 mt-1">Choose a child from the dropdown above</p></div></CardContent></Card>
        )}

        {/* View Invoice Dialog */}
        <Dialog open={!!viewInvoice} onOpenChange={() => setViewInvoice(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Invoice Details</DialogTitle></DialogHeader>
            {viewInvoice && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><p className="text-slate-400 text-xs uppercase">Invoice #</p><p className="font-mono font-bold">{viewInvoice.invoice_code}</p></div>
                  <div><p className="text-slate-400 text-xs uppercase">Status</p>{statusBadge(viewInvoice.status || (viewInvoice.due > 0 ? "unpaid" : "paid"))}</div>
                  <div><p className="text-slate-400 text-xs uppercase">Title</p><p className="font-medium">{viewInvoice.title}</p></div>
                  <div><p className="text-slate-400 text-xs uppercase">Year/Term</p><p className="font-medium">{viewInvoice.year} — Term {viewInvoice.term}</p></div>
                  <div><p className="text-slate-400 text-xs uppercase">Total Amount</p><p className="font-bold">{formatCurrency(viewInvoice.amount)}</p></div>
                  <div><p className="text-slate-400 text-xs uppercase">Amount Paid</p><p className="font-bold text-emerald-600">{formatCurrency(viewInvoice.amount_paid)}</p></div>
                </div>
                <div className="p-3 rounded-lg bg-slate-50">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Outstanding Balance</span>
                    <span className={`text-lg font-bold ${viewInvoice.due > 0 ? "text-red-600" : "text-emerald-600"}`}>{formatCurrency(viewInvoice.due)}</span>
                  </div>
                </div>
                <p className="text-xs text-slate-400">Created: {viewInvoice.creation_timestamp ? format(new Date(viewInvoice.creation_timestamp), "MMMM d, yyyy 'at' HH:mm") : "—"}</p>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Pay Dialog (Mobile Money) */}
        <Dialog open={payDialogOpen} onOpenChange={setPayDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Mobile Money Payment</DialogTitle>
              <DialogDescription>Enter your payment details below</DialogDescription>
            </DialogHeader>
            {selectedInvoice && (
              <div className="space-y-4">
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <span className="text-amber-700">Invoice:</span><span className="font-mono font-bold">{selectedInvoice.invoice_code}</span>
                    <span className="text-amber-700">Amount Due:</span><span className="font-bold text-red-600">{formatCurrency(selectedInvoice.due)}</span>
                    <span className="text-amber-700">Pay to:</span><span className="font-bold">{moAccountName}</span>
                    <span className="text-amber-700">Number:</span><span className="font-bold">{moAccountNumber}</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="space-y-1"><Label>Your MoMo Name</Label><Input value={payName} onChange={e => setPayName(e.target.value)} placeholder="Enter your registered name" /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1"><Label>MoMo Number</Label><Input value={payPhone} onChange={e => setPayPhone(e.target.value)} placeholder="e.g. 024XXXXXXX" type="tel" /></div>
                    <div className="space-y-1"><Label>Amount (GHS)</Label><Input value={payAmount} onChange={e => setPayAmount(e.target.value)} placeholder="Amount" type="number" min="1" /></div>
                  </div>
                  <div className="space-y-1">
                    <Label>Network</Label>
                    <Select value={payChannel} onValueChange={setPayChannel}>
                      <SelectTrigger><SelectValue placeholder="Select network" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mtn">MTN MoMo</SelectItem>
                        <SelectItem value="vodafone">Vodafone Cash</SelectItem>
                        <SelectItem value="tigo">AirtelTigo Money</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => setPayDialogOpen(false)}>Cancel</Button>
                  <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700" onClick={handleSubmitPayment} disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Smartphone className="w-4 h-4 mr-2" />}
                    Submit Payment
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
