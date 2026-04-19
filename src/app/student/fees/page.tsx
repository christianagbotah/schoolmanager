"use client";

import { useEffect, useState, useCallback } from "react";
import {
  AlertTriangle, Receipt, CreditCard, Loader2, Download,
  Smartphone, DollarSign, CheckCircle, Clock, Eye, X,
  CalendarRange, ChevronDown, ChevronUp, Banknote,
  FileText, Wallet,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
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

interface Installment {
  installment_id: number;
  installment_number: number;
  amount: number;
  paid_amount: number;
  due_date: string | null;
  status: string;
  payment_date: string | null;
  payment_method: string;
}

interface PaymentPlan {
  payment_plan_id: number;
  name: string;
  description: string;
  total_amount: number;
  paid_amount: number;
  status: string;
  start_date: string | null;
  end_date: string | null;
  frequency: string;
  number_of_payments: number;
  fee_structure: { fee_structure_id: number; name: string; year: string; term: string } | null;
  installments: Installment[];
}

// ─── Helpers ─────────────────────────────────────────────────
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency", currency: "GHS", minimumFractionDigits: 0, maximumFractionDigits: 2,
  }).format(amount);
}

function statusBadge(status: string) {
  switch (status) {
    case "paid": return <Badge className="bg-emerald-100 text-emerald-700">Paid</Badge>;
    case "partial": return <Badge className="bg-blue-100 text-blue-700">Partial</Badge>;
    case "unpaid": return <Badge className="bg-red-100 text-red-700">Unpaid</Badge>;
    default: return <Badge variant="secondary">{status}</Badge>;
  }
}

const instStatusConfig: Record<string, { label: string; color: string }> = {
  paid: { label: "Paid", color: "text-emerald-600" },
  pending: { label: "Pending", color: "text-amber-600" },
  overdue: { label: "Overdue", color: "text-red-600" },
  partial: { label: "Partial", color: "text-sky-600" },
};

function isOverdue(dateStr: string | null): boolean {
  if (!dateStr) return false;
  return new Date(dateStr) < new Date();
}

// ─── Main Component ──────────────────────────────────────────
export default function StudentFeesPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [receipts, setReceipts] = useState<ReceiptItem[]>([]);
  const [paymentPlans, setPaymentPlans] = useState<PaymentPlan[]>([]);
  const [moAccountName, setMoAccountName] = useState("");
  const [moAccountNumber, setMoAccountNumber] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("invoices");

  // Expanded plan state
  const [expandedPlan, setExpandedPlan] = useState<number | null>(null);

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
      setPaymentPlans(data.paymentPlans || []);
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

  // Plan stats
  const activePlanCount = paymentPlans.filter((p) => p.status === "active").length;
  const totalPlanDue = paymentPlans.reduce((s, p) => s + (p.total_amount - p.paid_amount), 0);
  const totalPlanPaid = paymentPlans.reduce((s, p) => s + p.paid_amount, 0);

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
          <div className="pb-4 border-b border-slate-100">
            <Skeleton className="h-8 w-56" />
            <Skeleton className="h-4 w-72 mt-2" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="py-4">
                <CardContent className="px-4 pb-0 pt-0">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-3 w-24" />
                      <Skeleton className="h-7 w-16" />
                    </div>
                    <Skeleton className="h-11 w-11 rounded-xl" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <Skeleton className="h-96 w-full rounded-2xl" />
        </div>
      </DashboardLayout>
    );
  }

  // ─── Error ─────────────────────────────────────────────────
  if (error) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-slate-900">Something went wrong</h2>
          <p className="text-slate-500">{error}</p>
          <Button onClick={fetchData} variant="outline" className="min-h-[44px]">
            <Loader2 className="w-4 h-4 mr-2" /> Try Again
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* ─── Header ─────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Fee Payments</h1>
            <p className="text-sm text-slate-500 mt-1">View invoices, payment plans, and make payments</p>
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
          <Card className="py-4 border-l-4 border-l-slate-400 hover:shadow-lg hover:-translate-y-0.5 transition-all">
            <CardContent className="px-4 pb-0 pt-0">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Billed</p>
                  <p className="text-2xl font-bold text-slate-900 tabular-nums">{formatCurrency(totalBilled)}</p>
                </div>
                <div className="w-11 h-11 rounded-xl bg-slate-400 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="py-4 border-l-4 border-l-emerald-500 hover:shadow-lg hover:-translate-y-0.5 transition-all">
            <CardContent className="px-4 pb-0 pt-0">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Paid</p>
                  <p className="text-2xl font-bold text-slate-900 tabular-nums">{formatCurrency(totalPaid)}</p>
                </div>
                <div className="w-11 h-11 rounded-xl bg-emerald-500 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="py-4 border-l-4 border-l-red-500 hover:shadow-lg hover:-translate-y-0.5 transition-all">
            <CardContent className="px-4 pb-0 pt-0">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Outstanding</p>
                  <p className="text-2xl font-bold text-slate-900 tabular-nums">{formatCurrency(totalDue + totalPlanDue)}</p>
                </div>
                <div className="w-11 h-11 rounded-xl bg-red-500 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="py-4 border-l-4 border-l-amber-500 hover:shadow-lg hover:-translate-y-0.5 transition-all">
            <CardContent className="px-4 pb-0 pt-0">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Plans</p>
                  <p className="text-2xl font-bold text-slate-900 tabular-nums">{activePlanCount}</p>
                </div>
                <div className="w-11 h-11 rounded-xl bg-amber-500 flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ─── Tabs ───────────────────────────────────────── */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="invoices" className="gap-1.5">
              <Receipt className="w-4 h-4" /> Invoices
            </TabsTrigger>
            <TabsTrigger value="plans" className="gap-1.5">
              <CalendarRange className="w-4 h-4" /> Payment Plans
            </TabsTrigger>
            <TabsTrigger value="payments" className="gap-1.5">
              <CreditCard className="w-4 h-4" /> History
            </TabsTrigger>
            <TabsTrigger value="receipts" className="gap-1.5">
              <Download className="w-4 h-4" /> Receipts
            </TabsTrigger>
          </TabsList>

          {/* ─── Invoices Tab ─────────────────────────────── */}
          <TabsContent value="invoices" className="mt-4">
            <Card className="gap-4">
              <CardContent className="pt-6">
                {invoices.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
                      <Receipt className="w-8 h-8 text-slate-400" />
                    </div>
                    <p className="text-slate-500 text-sm font-medium">No invoices found</p>
                    <p className="text-slate-400 text-xs mt-1">Your invoices will appear here once generated</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-lg border border-slate-200 max-h-[400px] overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50 hover:bg-slate-50">
                          <TableHead className="text-xs font-semibold text-slate-600 uppercase">Invoice</TableHead>
                          <TableHead className="text-xs font-semibold text-slate-600 uppercase hidden sm:table-cell">Title</TableHead>
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
                            <TableCell className="hidden sm:table-cell text-sm text-slate-600 max-w-[200px] truncate">{inv.title}</TableCell>
                            <TableCell className="text-right font-semibold text-sm tabular-nums">{formatCurrency(inv.amount)}</TableCell>
                            <TableCell className="text-right text-sm tabular-nums hidden md:table-cell text-emerald-600">{formatCurrency(inv.amount_paid)}</TableCell>
                            <TableCell className="text-right font-semibold text-sm tabular-nums text-red-600">{formatCurrency(inv.due)}</TableCell>
                            <TableCell className="text-center">{statusBadge(inv.status || (inv.due > 0 ? "unpaid" : "paid"))}</TableCell>
                            <TableCell className="text-center">
                              <div className="flex items-center justify-center gap-1">
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setViewInvoice(inv)}>
                                  <Eye className="w-3.5 h-3.5" />
                                </Button>
                                {inv.due > 0 && (
                                  <Button size="sm" className="h-8 bg-emerald-600 hover:bg-emerald-700 text-xs px-2" onClick={() => openPayDialog(inv)}>
                                    <Smartphone className="w-3 h-3 mr-1" /> Pay
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

          {/* ─── Payment Plans Tab ────────────────────────── */}
          <TabsContent value="plans" className="mt-4">
            {paymentPlans.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
                    <CalendarRange className="w-8 h-8 text-slate-400" />
                  </div>
                  <p className="text-sm font-medium text-slate-600">No payment plans assigned</p>
                  <p className="text-xs mt-1 text-slate-400">Contact the school office for fee payment plan setup</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {paymentPlans.map((plan) => {
                  const progress = plan.total_amount > 0 ? (plan.paid_amount / plan.total_amount) * 100 : 0;
                  const isExpanded = expandedPlan === plan.payment_plan_id;
                  const isOverduePlan = plan.installments.some((i) => i.status === "overdue");
                  const remaining = plan.total_amount - plan.paid_amount;

                  return (
                    <Card key={plan.payment_plan_id} className={isOverduePlan ? "border-red-200" : ""}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-sm truncate">{plan.name}</h3>
                              {isOverduePlan && <Badge className="bg-red-100 text-red-700 text-xs">Overdue</Badge>}
                              {plan.status === "completed" && <Badge className="bg-emerald-100 text-emerald-700 text-xs">Completed</Badge>}
                            </div>
                            <p className="text-xs text-slate-400 mt-0.5">
                              {plan.fee_structure?.name || ""} {plan.fee_structure?.year ? `— ${plan.fee_structure.year}` : ""}
                              {plan.fee_structure?.term ? ` / ${plan.fee_structure.term}` : ""}
                            </p>
                          </div>
                          <Button
                            variant="ghost" size="sm" className="h-8 w-8 p-0"
                            onClick={() => setExpandedPlan(isExpanded ? null : plan.payment_plan_id)}
                          >
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </Button>
                        </div>

                        <div className="grid grid-cols-3 gap-3 mb-3">
                          <div className="text-center">
                            <p className="text-xs text-slate-400">Total</p>
                            <p className="text-sm font-bold">{formatCurrency(plan.total_amount)}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-slate-400">Paid</p>
                            <p className="text-sm font-bold text-emerald-600">{formatCurrency(plan.paid_amount)}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-slate-400">Remaining</p>
                            <p className={`text-sm font-bold ${remaining > 0 ? "text-red-600" : "text-emerald-600"}`}>{formatCurrency(remaining)}</p>
                          </div>
                        </div>

                        <div className="space-y-1 mb-1">
                          <div className="flex justify-between text-xs text-slate-400">
                            <span>Progress</span>
                            <span>{Math.round(progress)}%</span>
                          </div>
                          <Progress value={progress} className="h-2" />
                        </div>

                        {/* Expanded installments */}
                        {isExpanded && (
                          <div className="mt-4 space-y-2">
                            <h4 className="text-xs font-semibold text-slate-500 uppercase">Installment Schedule</h4>
                            <div className="max-h-64 overflow-y-auto space-y-2">
                              {plan.installments.map((inst) => {
                                const sc = instStatusConfig[inst.status] || instStatusConfig.pending;
                                const overdue = inst.status === "overdue" || (inst.status === "pending" && isOverdue(inst.due_date));
                                const instRemaining = inst.amount - inst.paid_amount;

                                return (
                                  <div key={inst.installment_id} className={`flex items-center justify-between p-3 rounded-lg border ${overdue ? "border-red-200 bg-red-50/50" : "border-slate-100"}`}>
                                    <div className="flex items-center gap-3">
                                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${inst.status === "paid" ? "bg-emerald-100" : overdue ? "bg-red-100" : "bg-slate-100"}`}>
                                        {inst.status === "paid" ? (
                                          <CheckCircle className="w-4 h-4 text-emerald-600" />
                                        ) : overdue ? (
                                          <AlertTriangle className="w-4 h-4 text-red-600" />
                                        ) : (
                                          <Clock className="w-4 h-4 text-slate-400" />
                                        )}
                                      </div>
                                      <div>
                                        <p className="text-sm font-medium">#{inst.installment_number}</p>
                                        <p className="text-xs text-slate-400 flex items-center gap-1">
                                          <CalendarRange className="w-3 h-3" />
                                          {inst.due_date ? format(new Date(inst.due_date), "MMM d, yyyy") : "—"}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-sm font-bold">{formatCurrency(inst.amount)}</p>
                                      <p className={`text-xs font-medium ${sc.color}`}>{sc.label}</p>
                                      {inst.paid_amount > 0 && inst.status !== "paid" && (
                                        <p className="text-xs text-slate-400">Paid: {formatCurrency(inst.paid_amount)}</p>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}

                {/* Make Payment placeholder */}
                {moAccountNumber && totalPlanDue > 0 && (
                  <Card className="bg-emerald-50 border-emerald-200">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-emerald-800">Outstanding Balance: {formatCurrency(totalPlanDue)}</p>
                        <p className="text-xs text-emerald-600">Contact the school office or pay via MoMo below</p>
                      </div>
                      <Button className="bg-emerald-600 hover:bg-emerald-700">
                        <Smartphone className="w-4 h-4 mr-2" /> Pay Now
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </TabsContent>

          {/* ─── Payments Tab ─────────────────────────────── */}
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
                    <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
                      <CreditCard className="w-8 h-8 text-slate-400" />
                    </div>
                    <p className="text-slate-500 text-sm font-medium">No payment history found</p>
                    <p className="text-slate-400 text-xs mt-1">Your payments will appear here after processing</p>
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
                            <TableCell className="text-right font-semibold text-sm text-emerald-600 tabular-nums">{formatCurrency(p.amount)}</TableCell>
                            <TableCell className="hidden sm:table-cell text-sm text-slate-500 capitalize">{p.payment_method?.replace(/_/g, " ") || "—"}</TableCell>
                            <TableCell className="hidden sm:table-cell text-sm text-slate-500">{p.timestamp ? format(new Date(p.timestamp), "MMM d, yyyy") : "—"}</TableCell>
                            <TableCell className="text-center">
                              <Badge variant="secondary" className={p.approval_status === "approved" ? "bg-emerald-100 text-emerald-700 text-xs" : "bg-amber-100 text-amber-700 text-xs"}>
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

          {/* ─── Receipts Tab ─────────────────────────────── */}
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
                    <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
                      <CheckCircle className="w-8 h-8 text-slate-400" />
                    </div>
                    <p className="text-slate-500 text-sm font-medium">No receipts available yet</p>
                    <p className="text-slate-400 text-xs mt-1">Receipts will be generated after payment confirmation</p>
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
                            <TableCell className="text-right font-semibold text-sm text-emerald-600 tabular-nums">{formatCurrency(r.amount)}</TableCell>
                            <TableCell className="hidden sm:table-cell text-sm text-slate-500 capitalize">{r.payment_method?.replace(/_/g, " ") || "—"}</TableCell>
                            <TableCell className="hidden sm:table-cell text-sm text-slate-500">{r.generated_at ? format(new Date(r.generated_at), "MMM d, yyyy") : "—"}</TableCell>
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
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                  <Receipt className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <DialogTitle>Invoice Details</DialogTitle>
                  <DialogDescription>View your invoice breakdown</DialogDescription>
                </div>
              </div>
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
                </div>
                <div className="p-3 rounded-lg bg-slate-50">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Outstanding Balance</span>
                    <span className={`text-lg font-bold ${viewInvoice.due > 0 ? "text-red-600" : "text-emerald-600"}`}>
                      {formatCurrency(viewInvoice.due)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* ─── Mobile Money Payment Dialog ─────────────────── */}
        <Dialog open={payDialogOpen} onOpenChange={setPayDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <Smartphone className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <DialogTitle>Mobile Money Payment</DialogTitle>
                  <DialogDescription>Enter your payment details below</DialogDescription>
                </div>
              </div>
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
                    <Input value={payName} onChange={(e) => setPayName(e.target.value)} placeholder="Enter your registered name" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label>MoMo Number</Label>
                      <Input value={payPhone} onChange={(e) => setPayPhone(e.target.value)} placeholder="e.g. 024XXXXXXX" type="tel" />
                    </div>
                    <div className="space-y-1">
                      <Label>Amount (GHS)</Label>
                      <Input value={payAmount} onChange={(e) => setPayAmount(e.target.value)} placeholder="Amount" type="number" min="1" />
                    </div>
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
                  <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700 min-h-[44px]" onClick={handleSubmitPayment} disabled={isSubmitting}>
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
