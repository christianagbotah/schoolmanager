"use client";

import { useEffect, useState, useCallback } from "react";
import {
  AlertTriangle, Receipt, Search, Eye,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import { RequirePermission } from "@/components/auth/require-permission";
import { PERMISSIONS } from "@/lib/permissions";
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
  student?: { student_id: number; name: string; student_code: string };
  class_name?: string;
}

interface StudentItem {
  student_id: number;
  student_code: string;
  name: string;
  first_name: string;
  last_name: string;
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

/**
 * Shared Invoices Page
 * - Admin/Accountant: view all invoices with management tools
 * - Student: view own invoices
 * - Parent: view children's invoices
 */
export default function InvoicesPage() {
  const { user, role, isAdmin, isAccountant, isStudent, isParent, isLoading: authLoading } = useAuth();
  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceItem | null>(null);

  // ─── Fetch invoices ─────────────────────────────────────────
  const fetchInvoices = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      let url = "/api/invoices?limit=50";
      if (isStudent && user?.name) {
        url = `/api/invoices?search=${encodeURIComponent(user.name)}&limit=50`;
      } else if (isParent && selectedStudent) {
        const student = students.find((s) => s.student_id === parseInt(selectedStudent));
        url = `/api/invoices?search=${encodeURIComponent(student?.student_code || "")}&limit=50`;
      } else {
        const params = new URLSearchParams();
        if (search) params.set("search", search);
        if (statusFilter) params.set("status", statusFilter);
        url = `/api/invoices?${params}&limit=50`;
      }
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to load invoices");
      const data = await res.json();
      setInvoices(data.invoices || []);
    } catch {
      setError("Failed to load invoices");
    } finally {
      setIsLoading(false);
    }
  }, [isStudent, isParent, user?.name, selectedStudent, students, search, statusFilter]);

  // ─── Fetch students for parent ──────────────────────────────
  const fetchStudents = useCallback(async () => {
    if (!isParent) return;
    try {
      const res = await fetch("/api/students?limit=50");
      if (res.ok) {
        const data = await res.json();
        setStudents(data.students || []);
      }
    } catch { /* silent */ }
  }, [isParent]);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);
  useEffect(() => { fetchInvoices(); }, [fetchInvoices]);

  const totalBilled = invoices.reduce((s, i) => s + (i.amount || 0), 0);
  const totalPaid = invoices.reduce((s, i) => s + (i.amount_paid || 0), 0);
  const totalDue = invoices.reduce((s, i) => s + (i.due || 0), 0);

  if (isLoading) {
    return <div className="space-y-6"><Skeleton className="h-8 w-48" /><div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{isStudent || isParent ? "My Invoices" : "Invoices"}</h1>
        <p className="text-sm text-slate-500 mt-1">{isStudent ? "View your fee invoices and payment history" : isParent ? "View invoices for your children" : "Create and manage student invoices"}</p>
      </div>

      {/* Parent: Child Selector */}
      {isParent && (
        <Card className="gap-4">
          <CardContent className="pt-6">
            <div className="space-y-2">
              <Label>Select Child</Label>
              <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                <SelectTrigger><SelectValue placeholder="Choose a child" /></SelectTrigger>
                <SelectContent>
                  {students.map((s) => (
                    <SelectItem key={s.student_id} value={String(s.student_id)}>{s.name || `${s.first_name} ${s.last_name}`.trim()} — {s.student_code}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="py-4 border-l-4 border-l-slate-400"><CardContent className="px-4 pb-0 pt-0"><p className="text-xs font-medium text-slate-500">Total Billed</p><p className="text-2xl font-bold text-slate-900 tabular-nums">{formatCurrency(totalBilled)}</p></CardContent></Card>
        <Card className="py-4 border-l-4 border-l-emerald-500"><CardContent className="px-4 pb-0 pt-0"><p className="text-xs font-medium text-slate-500">Total Paid</p><p className="text-2xl font-bold text-emerald-600 tabular-nums">{formatCurrency(totalPaid)}</p></CardContent></Card>
        <Card className="py-4 border-l-4 border-l-red-500"><CardContent className="px-4 pb-0 pt-0"><p className="text-xs font-medium text-slate-500">Outstanding</p><p className="text-2xl font-bold text-red-600 tabular-nums">{formatCurrency(totalDue)}</p></CardContent></Card>
      </div>

      {/* Admin/Accountant: Search & Filters */}
      {(isAdmin || isAccountant) && (
        <Card className="gap-4">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Search</Label>
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input placeholder="Search by name or code..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={statusFilter || "all"} onValueChange={(v) => setStatusFilter(v === "all" ? "" : v)}>
                  <SelectTrigger><SelectValue placeholder="All statuses" /></SelectTrigger>
                  <SelectContent><SelectItem value="all">All Statuses</SelectItem><SelectItem value="paid">Paid</SelectItem><SelectItem value="partial">Partial</SelectItem><SelectItem value="unpaid">Unpaid</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {error && <div className="flex items-center gap-3 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm"><AlertTriangle className="w-5 h-5 flex-shrink-0" />{error}</div>}

      {/* Invoice Table */}
      <Card className="gap-4">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center"><Receipt className="w-4 h-4 text-red-600" /></div>
            <CardTitle className="text-base font-semibold">Invoice History</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {invoices.length === 0 ? (
            <div className="text-center py-12"><Receipt className="w-12 h-12 text-slate-300 mx-auto mb-3" /><p className="text-slate-400 text-sm">No invoices found</p></div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-slate-200 max-h-96 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 hover:bg-slate-50">
                    <TableHead className="text-xs font-semibold text-slate-600 uppercase">Invoice</TableHead>
                    {(isAdmin || isAccountant) && <TableHead className="text-xs font-semibold text-slate-600 uppercase">Student</TableHead>}
                    <TableHead className="text-xs font-semibold text-slate-600 uppercase text-right">Amount</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-600 uppercase text-right hidden md:table-cell">Paid</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-600 uppercase text-right">Balance</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-600 uppercase text-center">Status</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-600 uppercase hidden sm:table-cell">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((inv) => (
                    <TableRow key={inv.invoice_id} className="hover:bg-slate-50 cursor-pointer" onClick={() => setSelectedInvoice(inv)}>
                      <TableCell className="font-mono text-sm text-slate-700">{inv.invoice_code}</TableCell>
                      {(isAdmin || isAccountant) && <TableCell className="font-medium text-sm">{inv.student?.name || "Unknown"}</TableCell>}
                      <TableCell className="text-right font-semibold text-sm tabular-nums">{formatCurrency(inv.amount)}</TableCell>
                      <TableCell className="text-right text-sm tabular-nums hidden md:table-cell text-emerald-600">{formatCurrency(inv.amount_paid)}</TableCell>
                      <TableCell className="text-right font-semibold text-sm tabular-nums text-red-600">{formatCurrency(inv.due)}</TableCell>
                      <TableCell className="text-center">{statusBadge(inv.status)}</TableCell>
                      <TableCell className="hidden sm:table-cell text-sm text-slate-500">{inv.creation_timestamp ? format(new Date(inv.creation_timestamp), "MMM d, yyyy") : "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
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
                {(isAdmin || isAccountant) && <div><p className="text-xs text-slate-500">Student</p><p className="font-semibold">{selectedInvoice.student?.name}</p></div>}
                <div><p className="text-xs text-slate-500">Amount</p><p className="font-semibold">{formatCurrency(selectedInvoice.amount)}</p></div>
                <div><p className="text-xs text-slate-500">Paid</p><p className="font-semibold text-emerald-600">{formatCurrency(selectedInvoice.amount_paid)}</p></div>
                <div><p className="text-xs text-slate-500">Balance</p><p className="font-semibold text-red-600">{formatCurrency(selectedInvoice.due)}</p></div>
                <div><p className="text-xs text-slate-500">Status</p><div className="mt-0.5">{statusBadge(selectedInvoice.status)}</div></div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
