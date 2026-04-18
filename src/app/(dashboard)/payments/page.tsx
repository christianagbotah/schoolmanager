"use client";

import { useEffect, useState, useCallback } from "react";
import {
  AlertTriangle, CreditCard, Receipt, DollarSign, History, Search,
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
import { useAuth } from "@/hooks/use-auth";
import { PERMISSIONS } from "@/lib/permission-constants";
import { format } from "date-fns";

// ─── Types ───────────────────────────────────────────────────
interface PaymentItem {
  payment_id: number;
  receipt_code: string;
  invoice_code: string;
  amount: number;
  payment_method: string;
  timestamp: string | null;
  student?: { student_id: number; name: string; student_code: string };
}

interface StudentItem {
  student_id: number;
  student_code: string;
  name: string;
  first_name: string;
  last_name: string;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "GHS", minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(amount);
}

/**
 * Shared Payments Page
 * - Admin/Accountant: view all payments
 * - Parent: view children's payment history
 */
export default function PaymentsPage() {
  const { isAdmin, isAccountant, isParent, isLoading: authLoading } = useAuth();
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStudents = useCallback(async () => {
    if (!isParent) return;
    setIsLoading(true);
    try {
      const res = await fetch("/api/students?limit=50");
      if (res.ok) { const data = await res.json(); setStudents(data.students || []); }
    } catch { setError("Failed to load children"); }
    finally { setIsLoading(false); }
  }, [isParent]);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  const fetchPayments = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      let url = "/api/payments?limit=50";
      if (search) url = `/api/payments?search=${encodeURIComponent(search)}&limit=50`;
      const res = await fetch(url);
      if (res.ok) { const d = await res.json(); setPayments(d.payments || []); }
    } catch { setError("Failed to load payments"); }
    finally { setIsLoading(false); }
  }, [search]);

  useEffect(() => { fetchPayments(); }, [fetchPayments]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Payments</h1>
        <p className="text-sm text-slate-500 mt-1">{isParent ? "View payment history for your children" : "View all payment records"}</p>
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

      {/* Admin/Accountant: Search */}
      {(isAdmin || isAccountant) && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input placeholder="Search by name, code, or receipt..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 min-h-[44px]" />
        </div>
      )}

      {error && <div className="flex items-center gap-3 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm"><AlertTriangle className="w-5 h-5 flex-shrink-0" />{error}</div>}

      {/* Payments Table */}
      <Card className="gap-4">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center"><CreditCard className="w-4 h-4 text-emerald-600" /></div>
            <CardTitle className="text-base font-semibold">Payment History ({payments.length})</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {isLoading ? (
            <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : payments.length === 0 ? (
            <div className="text-center py-12"><CreditCard className="w-12 h-12 text-slate-300 mx-auto mb-3" /><p className="text-slate-400 text-sm">No payment records found</p></div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-slate-200 max-h-96 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 hover:bg-slate-50">
                    <TableHead className="text-xs font-semibold text-slate-600 uppercase">Receipt #</TableHead>
                    {(isAdmin || isAccountant) && <TableHead className="text-xs font-semibold text-slate-600 uppercase">Student</TableHead>}
                    <TableHead className="text-xs font-semibold text-slate-600 uppercase text-right">Amount</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-600 uppercase hidden sm:table-cell">Method</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-600 uppercase hidden sm:table-cell">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((p) => (
                    <TableRow key={p.payment_id} className="hover:bg-slate-50">
                      <TableCell className="font-mono text-sm">{p.receipt_code}</TableCell>
                      {(isAdmin || isAccountant) && <TableCell className="text-sm font-medium">{p.student?.name || "—"}</TableCell>}
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
    </div>
  );
}
