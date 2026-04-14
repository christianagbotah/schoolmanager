"use client";

import { useEffect, useState, useCallback } from "react";
import {
  AlertTriangle,
  Receipt,
  Plus,
  Loader2,
  Search,
  Download,
  Eye,
  Filter,
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
  class_name: string;
  creation_timestamp: string | null;
  payment_timestamp: string | null;
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
export default function AccountantInvoicesPage() {
  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<{ totalBilled: number; totalCollected: number; outstanding: number } | null>(null);
  const [page, setPage] = useState(1);

  const fetchInvoices = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ limit: "20", page: String(page) });
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);

      const res = await fetch(`/api/invoices?${params}`);
      if (!res.ok) throw new Error("Failed to load invoices");
      const data = await res.json();
      setInvoices(data.invoices || []);
      setSummary(data.summary || null);
    } catch {
      setError("Failed to load invoices");
    } finally {
      setIsLoading(false);
    }
  }, [search, statusFilter, page]);

  useEffect(() => { fetchInvoices(); }, [fetchInvoices]);

  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceItem | null>(null);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Invoices</h1>
            <p className="text-sm text-slate-500 mt-1">Create and manage student invoices</p>
          </div>
        </div>

        {/* Summary */}
        {summary && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Card className="py-3 border-l-4 border-l-slate-400"><CardContent className="px-3 pt-0 pb-0"><p className="text-xs text-slate-500">Total Billed</p><p className="text-lg font-bold text-slate-900 tabular-nums">{formatCurrency(summary.totalBilled)}</p></CardContent></Card>
            <Card className="py-3 border-l-4 border-l-emerald-500"><CardContent className="px-3 pt-0 pb-0"><p className="text-xs text-slate-500">Collected</p><p className="text-lg font-bold text-emerald-600 tabular-nums">{formatCurrency(summary.totalCollected)}</p></CardContent></Card>
            <Card className="py-3 border-l-4 border-l-red-500"><CardContent className="px-3 pt-0 pb-0"><p className="text-xs text-slate-500">Outstanding</p><p className="text-lg font-bold text-red-600 tabular-nums">{formatCurrency(summary.outstanding)}</p></CardContent></Card>
          </div>
        )}

        {/* Filters */}
        <Card className="gap-4">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Search</Label>
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input placeholder="Search by name or invoice code..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="pl-9" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v === "all" ? "" : v); setPage(1); }}>
                  <SelectTrigger><SelectValue placeholder="All statuses" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="partial">Partial</SelectItem>
                    <SelectItem value="unpaid">Unpaid</SelectItem>
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

        {/* Table */}
        <Card className="gap-4">
          <CardContent className="pt-6">
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
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase">Student</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase hidden md:table-cell">Description</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase text-right">Amount</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase text-right">Balance</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase text-center">Status</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase hidden sm:table-cell">Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.map((inv) => (
                      <TableRow key={inv.invoice_id} className="hover:bg-slate-50 cursor-pointer" onClick={() => setSelectedInvoice(inv)}>
                        <TableCell className="font-mono text-sm text-slate-700">{inv.invoice_code}</TableCell>
                        <TableCell className="font-medium text-sm">{inv.student?.name || "Unknown"}</TableCell>
                        <TableCell className="hidden md:table-cell text-sm text-slate-600 max-w-[200px] truncate">{inv.title || inv.description}</TableCell>
                        <TableCell className="text-right font-semibold text-sm tabular-nums">{formatCurrency(inv.amount)}</TableCell>
                        <TableCell className="text-right font-semibold text-sm tabular-nums text-red-600">{formatCurrency(inv.due)}</TableCell>
                        <TableCell className="text-center">{statusBadge(inv.status)}</TableCell>
                        <TableCell className="hidden sm:table-cell text-sm text-slate-500">{inv.creation_timestamp ? format(new Date(inv.creation_timestamp), "MMM d, yyyy") : "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
            {/* Pagination */}
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-slate-500">Showing page {page}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
                <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)}>Next</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Invoice Detail Dialog */}
        <Dialog open={!!selectedInvoice} onOpenChange={() => setSelectedInvoice(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle>Invoice Details</DialogTitle></DialogHeader>
            {selectedInvoice && (
              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-3">
                  <div><p className="text-xs text-slate-500">Invoice Code</p><p className="font-mono font-semibold">{selectedInvoice.invoice_code}</p></div>
                  <div><p className="text-xs text-slate-500">Student</p><p className="font-semibold">{selectedInvoice.student?.name}</p></div>
                  <div><p className="text-xs text-slate-500">Amount</p><p className="font-semibold">{formatCurrency(selectedInvoice.amount)}</p></div>
                  <div><p className="text-xs text-slate-500">Paid</p><p className="font-semibold text-emerald-600">{formatCurrency(selectedInvoice.amount_paid)}</p></div>
                  <div><p className="text-xs text-slate-500">Balance</p><p className="font-semibold text-red-600">{formatCurrency(selectedInvoice.due)}</p></div>
                  <div><p className="text-xs text-slate-500">Status</p><div className="mt-0.5">{statusBadge(selectedInvoice.status)}</div></div>
                </div>
                {selectedInvoice.description && (
                  <div><p className="text-xs text-slate-500">Description</p><p className="text-sm">{selectedInvoice.description}</p></div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
