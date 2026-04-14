"use client";

import { useEffect, useState, useCallback } from "react";
import {
  AlertTriangle,
  Receipt,
  Loader2,
  Download,
  CreditCard,
  DollarSign,
  CheckCircle,
  Clock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
    style: "currency", currency: "GHS",
    minimumFractionDigits: 0, maximumFractionDigits: 2,
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

// ─── Main Component ──────────────────────────────────────────
export default function StudentInvoicesPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
  const [receipts, setReceipts] = useState<ReceiptItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceItem | null>(null);

  const fetchData = useCallback(async () => {
    if (!user?.id) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/invoices?search=${user.name || user.email}&limit=50`);
      if (!res.ok) throw new Error("Failed to load invoices");
      const data = await res.json();
      setInvoices(data.invoices || []);

      // Fetch receipts
      const receiptRes = await fetch(`/api/receipts?studentId=${user.id}`);
      if (receiptRes.ok) {
        const receiptData = await receiptRes.json();
        setReceipts(Array.isArray(receiptData) ? receiptData : []);
      }
    } catch {
      setError("Failed to load invoices");
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, user?.name, user?.email]);

  useEffect(() => {
    if (!authLoading) fetchData();
  }, [authLoading, fetchData]);

  const totalBilled = invoices.reduce((s, i) => s + (i.amount || 0), 0);
  const totalPaid = invoices.reduce((s, i) => s + (i.amount_paid || 0), 0);
  const totalDue = invoices.reduce((s, i) => s + (i.due || 0), 0);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* ─── Header ─────────────────────────────────────── */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">My Invoices</h1>
          <p className="text-sm text-slate-500 mt-1">View your fee invoices and payment history</p>
        </div>

        {/* ─── Summary ────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="py-4 border-l-4 border-l-slate-400">
            <CardContent className="px-4 pb-0 pt-0">
              <p className="text-xs font-medium text-slate-500">Total Billed</p>
              <p className="text-2xl font-bold text-slate-900 tabular-nums">{formatCurrency(totalBilled)}</p>
            </CardContent>
          </Card>
          <Card className="py-4 border-l-4 border-l-emerald-500">
            <CardContent className="px-4 pb-0 pt-0">
              <p className="text-xs font-medium text-slate-500">Total Paid</p>
              <p className="text-2xl font-bold text-emerald-600 tabular-nums">{formatCurrency(totalPaid)}</p>
            </CardContent>
          </Card>
          <Card className="py-4 border-l-4 border-l-red-500">
            <CardContent className="px-4 pb-0 pt-0">
              <p className="text-xs font-medium text-slate-500">Outstanding Balance</p>
              <p className="text-2xl font-bold text-red-600 tabular-nums">{formatCurrency(totalDue)}</p>
            </CardContent>
          </Card>
        </div>

        {/* ─── Error ───────────────────────────────────────── */}
        {error && (
          <div className="flex items-center gap-3 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />{error}
          </div>
        )}

        {/* ─── Invoice Table ──────────────────────────────── */}
        <Card className="gap-4">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                <Receipt className="w-4 h-4 text-red-600" />
              </div>
              <CardTitle className="text-base font-semibold">Invoice History</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {isLoading ? (
              <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
            ) : invoices.length === 0 ? (
              <div className="text-center py-12">
                <Receipt className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-400 text-sm">No invoices found</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50 hover:bg-slate-50">
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase">Invoice</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase hidden sm:table-cell">Description</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase text-right">Amount</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase text-right hidden md:table-cell">Paid</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase text-right">Balance</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase text-center">Status</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase hidden sm:table-cell">Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.map((inv) => (
                      <TableRow key={inv.invoice_id} className="hover:bg-slate-50">
                        <TableCell className="font-mono text-sm text-slate-700">{inv.invoice_code}</TableCell>
                        <TableCell className="hidden sm:table-cell text-sm text-slate-600 max-w-[200px] truncate">{inv.title || inv.description}</TableCell>
                        <TableCell className="text-right font-semibold text-sm tabular-nums">{formatCurrency(inv.amount)}</TableCell>
                        <TableCell className="text-right text-sm tabular-nums hidden md:table-cell text-emerald-600">{formatCurrency(inv.amount_paid)}</TableCell>
                        <TableCell className="text-right font-semibold text-sm tabular-nums text-red-600">{formatCurrency(inv.due)}</TableCell>
                        <TableCell className="text-center">{statusBadge(inv.status)}</TableCell>
                        <TableCell className="hidden sm:table-cell text-sm text-slate-500">
                          {inv.creation_timestamp ? format(new Date(inv.creation_timestamp), "MMM d, yyyy") : "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ─── Recent Receipts ────────────────────────────── */}
        {receipts.length > 0 && (
          <Card className="gap-4">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                </div>
                <CardTitle className="text-base font-semibold">Payment Receipts</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="max-h-64 overflow-y-auto rounded-lg border border-slate-200">
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
                    {receipts.slice(0, 10).map((r) => (
                      <TableRow key={r.receipt_id} className="hover:bg-slate-50">
                        <TableCell className="font-mono text-sm">{r.receipt_number}</TableCell>
                        <TableCell className="text-right font-semibold text-sm text-emerald-600 tabular-nums">{formatCurrency(r.amount)}</TableCell>
                        <TableCell className="hidden sm:table-cell text-sm text-slate-500 capitalize">{r.payment_method?.replace(/_/g, " ")}</TableCell>
                        <TableCell className="hidden sm:table-cell text-sm text-slate-500">{r.generated_at ? format(new Date(r.generated_at), "MMM d, yyyy") : "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
