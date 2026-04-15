"use client";

import { useEffect, useState, useCallback } from "react";
import {
  AlertTriangle,
  Receipt,
  CreditCard,
  Loader2,
  Download,
  Smartphone,
  DollarSign,
  CheckCircle,
  Clock,
  Eye,
  X,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  DialogDescription,
} from "@/components/ui/dialog";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useAuth } from "@/hooks/use-auth";
import { format } from "date-fns";

// ─── Types ───────────────────────────────────────────────────
interface InvoiceItem {
  invoice_id: number;
  invoice_code: string;
  title: string;
  description: string;
  amount: number;
  amount_paid: number;
  due: number;
  discount: number;
  status: string;
  year: string;
  term: string;
  creation_timestamp: string | null;
  payment_timestamp: string | null;
}

interface PaymentItem {
  payment_id: number;
  receipt_code: string;
  invoice_code: string;
  title: string;
  amount: number;
  payment_method: string;
  payment_type: string;
  timestamp: string | null;
  approval_status: string;
}

interface ReceiptItem {
  receipt_id: number;
  receipt_number: string;
  amount: number;
  payment_method: string;
  generated_at: string | null;
}

// ─── Helpers ─────────────────────────────────────────────────
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "GHS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

function statusBadge(status: string) {
  switch (status) {
    case "paid":
      return <Badge className="bg-emerald-100 text-emerald-700">Paid</Badge>;
    case "partial":
      return <Badge className="bg-blue-100 text-blue-700">Partial</Badge>;
    case "unpaid":
      return <Badge className="bg-red-100 text-red-700">Unpaid</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

// ─── Main Component ──────────────────────────────────────────
export default function StudentFeesPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [receipts, setReceipts] = useState<ReceiptItem[]>([]);
  const [moAccountName, setMoAccountName] = useState("");
  const [moAccountNumber, setMoAccountNumber] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("invoices");

  // Payment dialog
  const [payDialogOpen, setPayDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceItem | null>(null);
  const [viewInvoice, setViewInvoice] = useState<InvoiceItem | null>(null);
  const [payName, setPayName] = useState("");
  const [payPhone, setPayPhone] = useState("");
  const [payAmount, setPayAmount] = useState("");
  const [payChannel, setPayChannel] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user?.id) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/student/fees");
      if (!res.ok) throw new Error("Failed to load fee data");
      const data = await res.json();
      setInvoices(data.invoices || []);
      setPayments(data.payments || []);
      setReceipts(data.receipts || []);
      setMoAccountName(data.moAccountName || "");
      setMoAccountNumber(data.moAccountNumber || "");
    } catch {
      setError("Failed to load fee data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!authLoading) fetchData();
  }, [authLoading, fetchData]);

  const totalBilled = invoices.reduce((s, i) => s + (i.amount || 0), 0);
  const totalPaid = invoices.reduce((s, i) => s + (i.amount_paid || 0), 0);
  const totalDue = invoices.reduce((s, i) => s + (i.due || 0), 0);
  const unpaidCount = invoices.filter((i) => i.due > 0).length;

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
      await new Promise((r) => setTimeout(r, 1500));
      setPayDialogOpen(false);
      fetchData();
    } catch {
      setError("Payment submission failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Loading ───────────────────────────────────────────────
  if (authLoading || isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-96 w-full rounded-xl" />
        </div>
      </DashboardLayout>
    );
  }

  // ─── Error ─────────────────────────────────────────────────
  if (error) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-slate-900">Something went wrong</h2>
          <p className="text-slate-500">{error}</p>
          <Button onClick={fetchData} variant="outline">
            <Loader2 className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* ─── Header ─────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Fee Payments</h1>
            <p className="text-sm text-slate-500 mt-1">View invoices, make payments, and download receipts</p>
          </div>
          {moAccountNumber && (
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-sm flex-shrink-0">
              <p className="font-medium text-amber-800">MoMo: {moAccountName}</p>
              <p className="text-amber-700">{moAccountNumber}</p>
            </div>
          )}
        </div>

        {/* ─── Summary Cards ──────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="py-4 border-l-4 border-l-slate-400">
            <CardContent className="px-4 pb-0 pt-0">
              <p className="text-xs font-medium text-slate-500">Total Billed</p>
              <p className="text-xl font-bold text-slate-900 tabular-nums">{formatCurrency(totalBilled)}</p>
            </CardContent>
          </Card>
          <Card className="py-4 border-l-4 border-l-emerald-500">
            <CardContent className="px-4 pb-0 pt-0">
              <p className="text-xs font-medium text-slate-500">Total Paid</p>
              <p className="text-xl font-bold text-emerald-600 tabular-nums">{formatCurrency(totalPaid)}</p>
            </CardContent>
          </Card>
          <Card className="py-4 border-l-4 border-l-red-500">
            <CardContent className="px-4 pb-0 pt-0">
              <p className="text-xs font-medium text-slate-500">Outstanding</p>
              <p className="text-xl font-bold text-red-600 tabular-nums">{formatCurrency(totalDue)}</p>
            </CardContent>
          </Card>
          <Card className="py-4 border-l-4 border-l-amber-500">
            <CardContent className="px-4 pb-0 pt-0">
              <p className="text-xs font-medium text-slate-500">Unpaid Invoices</p>
              <p className="text-xl font-bold text-amber-600">{unpaidCount}</p>
            </CardContent>
          </Card>
        </div>

        {/* ─── Tabs ───────────────────────────────────────── */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="invoices" className="gap-1.5">
              <Receipt className="w-4 h-4" />
              Invoices
            </TabsTrigger>
            <TabsTrigger value="payments" className="gap-1.5">
              <CreditCard className="w-4 h-4" />
              Payment History
            </TabsTrigger>
            <TabsTrigger value="receipts" className="gap-1.5">
              <Download className="w-4 h-4" />
              Receipts
            </TabsTrigger>
          </TabsList>

          {/* Invoices Tab */}
          <TabsContent value="invoices" className="mt-4">
            <Card className="gap-4">
              <CardContent className="pt-6">
                {invoices.length === 0 ? (
                  <div className="text-center py-12">
                    <Receipt className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-400 text-sm">No invoices found</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-lg border border-slate-200 max-h-[400px] overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50 hover:bg-slate-50">
                          <TableHead className="text-xs font-semibold text-slate-600 uppercase">Invoice</TableHead>
                          <TableHead className="text-xs font-semibold text-slate-600 uppercase hidden sm:table-cell">Description</TableHead>
                          <TableHead className="text-xs font-semibold text-slate-600 uppercase text-right">Amount</TableHead>
                          <TableHead className="text-xs font-semibold text-slate-600 uppercase text-right hidden md:table-cell">Paid</TableHead>
                          <TableHead className="text-xs font-semibold text-slate-600 uppercase text-right">Balance</TableHead>
                          <TableHead className="text-xs font-semibold text-slate-600 uppercase text-center">Status</TableHead>
                          <TableHead className="text-xs font-semibold text-slate-600 uppercase text-center">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {invoices.map((inv) => (
                          <TableRow key={inv.invoice_id} className="hover:bg-slate-50">
                            <TableCell className="font-mono text-sm text-slate-700">{inv.invoice_code}</TableCell>
                            <TableCell className="hidden sm:table-cell text-sm text-slate-600 max-w-[200px] truncate">
                              {inv.title || inv.description}
                            </TableCell>
                            <TableCell className="text-right font-semibold text-sm tabular-nums">
                              {formatCurrency(inv.amount)}
                            </TableCell>
                            <TableCell className="text-right text-sm tabular-nums hidden md:table-cell text-emerald-600">
                              {formatCurrency(inv.amount_paid)}
                            </TableCell>
                            <TableCell className="text-right font-semibold text-sm tabular-nums text-red-600">
                              {formatCurrency(inv.due)}
                            </TableCell>
                            <TableCell className="text-center">
                              {statusBadge(inv.status || (inv.due > 0 ? "unpaid" : "paid"))}
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex items-center justify-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                  onClick={() => setViewInvoice(inv)}
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </Button>
                                {inv.due > 0 && (
                                  <Button
                                    size="sm"
                                    className="h-8 bg-emerald-600 hover:bg-emerald-700 text-xs px-2"
                                    onClick={() => openPayDialog(inv)}
                                  >
                                    <Smartphone className="w-3 h-3 mr-1" />
                                    Pay
                                  </Button>
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
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments" className="mt-4">
            <Card className="gap-4">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <CreditCard className="w-4 h-4 text-emerald-600" />
                  </div>
                  <CardTitle className="text-base font-semibold">Payment History</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {payments.length === 0 ? (
                  <div className="text-center py-12">
                    <CreditCard className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-400 text-sm">No payment history found</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-lg border border-slate-200 max-h-[400px] overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50 hover:bg-slate-50">
                          <TableHead className="text-xs font-semibold text-slate-600 uppercase">Receipt #</TableHead>
                          <TableHead className="text-xs font-semibold text-slate-600 uppercase">Title</TableHead>
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
                            <TableCell className="text-sm text-slate-600 max-w-[150px] truncate">{p.title || "—"}</TableCell>
                            <TableCell className="text-right font-semibold text-sm text-emerald-600 tabular-nums">
                              {formatCurrency(p.amount)}
                            </TableCell>
                            <TableCell className="hidden sm:table-cell text-sm text-slate-500 capitalize">
                              {p.payment_method?.replace(/_/g, " ") || "—"}
                            </TableCell>
                            <TableCell className="hidden sm:table-cell text-sm text-slate-500">
                              {p.timestamp ? format(new Date(p.timestamp), "MMM d, yyyy") : "—"}
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge
                                variant="secondary"
                                className={
                                  p.approval_status === "approved"
                                    ? "bg-emerald-100 text-emerald-700 text-xs"
                                    : "bg-amber-100 text-amber-700 text-xs"
                                }
                              >
                                {p.approval_status || "Pending"}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Receipts Tab */}
          <TabsContent value="receipts" className="mt-4">
            <Card className="gap-4">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                    <Download className="w-4 h-4 text-purple-600" />
                  </div>
                  <CardTitle className="text-base font-semibold">Payment Receipts</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {receipts.length === 0 ? (
                  <div className="text-center py-12">
                    <CheckCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-400 text-sm">No receipts available yet</p>
                  </div>
                ) : (
                  <div className="max-h-[400px] overflow-y-auto rounded-lg border border-slate-200">
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
                        {receipts.map((r) => (
                          <TableRow key={r.receipt_id} className="hover:bg-slate-50">
                            <TableCell className="font-mono text-sm">{r.receipt_number}</TableCell>
                            <TableCell className="text-right font-semibold text-sm text-emerald-600 tabular-nums">
                              {formatCurrency(r.amount)}
                            </TableCell>
                            <TableCell className="hidden sm:table-cell text-sm text-slate-500 capitalize">
                              {r.payment_method?.replace(/_/g, " ") || "—"}
                            </TableCell>
                            <TableCell className="hidden sm:table-cell text-sm text-slate-500">
                              {r.generated_at ? format(new Date(r.generated_at), "MMM d, yyyy") : "—"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* ─── View Invoice Dialog ─────────────────────────── */}
        <Dialog open={!!viewInvoice} onOpenChange={() => setViewInvoice(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Invoice Details</DialogTitle>
            </DialogHeader>
            {viewInvoice && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-slate-400 text-xs uppercase">Invoice #</p>
                    <p className="font-mono font-bold">{viewInvoice.invoice_code}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs uppercase">Status</p>
                    {statusBadge(viewInvoice.status || (viewInvoice.due > 0 ? "unpaid" : "paid"))}
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs uppercase">Title</p>
                    <p className="font-medium">{viewInvoice.title}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs uppercase">Year/Term</p>
                    <p className="font-medium">{viewInvoice.year} — Term {viewInvoice.term}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs uppercase">Total Amount</p>
                    <p className="font-bold">{formatCurrency(viewInvoice.amount)}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs uppercase">Amount Paid</p>
                    <p className="font-bold text-emerald-600">{formatCurrency(viewInvoice.amount_paid)}</p>
                  </div>
                  {viewInvoice.discount > 0 && (
                    <div>
                      <p className="text-slate-400 text-xs uppercase">Discount</p>
                      <p className="font-bold text-blue-600">{formatCurrency(viewInvoice.discount)}</p>
                    </div>
                  )}
                </div>
                <div className="p-3 rounded-lg bg-slate-50">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Outstanding Balance</span>
                    <span className={`text-lg font-bold ${viewInvoice.due > 0 ? "text-red-600" : "text-emerald-600"}`}>
                      {formatCurrency(viewInvoice.due)}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-slate-400">
                  Created:{" "}
                  {viewInvoice.creation_timestamp
                    ? format(new Date(viewInvoice.creation_timestamp), "MMMM d, yyyy 'at' HH:mm")
                    : "—"}
                </p>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* ─── Mobile Money Payment Dialog ─────────────────── */}
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
                    <span className="text-amber-700">Invoice:</span>
                    <span className="font-mono font-bold">{selectedInvoice.invoice_code}</span>
                    <span className="text-amber-700">Amount Due:</span>
                    <span className="font-bold text-red-600">{formatCurrency(selectedInvoice.due)}</span>
                    <span className="text-amber-700">Pay to:</span>
                    <span className="font-bold">{moAccountName}</span>
                    <span className="text-amber-700">Number:</span>
                    <span className="font-bold">{moAccountNumber}</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label>Your MoMo Name</Label>
                    <Input
                      value={payName}
                      onChange={(e) => setPayName(e.target.value)}
                      placeholder="Enter your registered name"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label>MoMo Number</Label>
                      <Input
                        value={payPhone}
                        onChange={(e) => setPayPhone(e.target.value)}
                        placeholder="e.g. 024XXXXXXX"
                        type="tel"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Amount (GHS)</Label>
                      <Input
                        value={payAmount}
                        onChange={(e) => setPayAmount(e.target.value)}
                        placeholder="Amount"
                        type="number"
                        min="1"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label>Network</Label>
                    <Select value={payChannel} onValueChange={setPayChannel}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select network" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mtn">MTN MoMo</SelectItem>
                        <SelectItem value="vodafone">Vodafone Cash</SelectItem>
                        <SelectItem value="tigo">AirtelTigo Money</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => setPayDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 min-h-[44px]"
                    onClick={handleSubmitPayment}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Smartphone className="w-4 h-4 mr-2" />
                    )}
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
