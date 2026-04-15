"use client";

import { useEffect, useState, useCallback } from "react";
import { format } from "date-fns";
import {
  AlertTriangle, Loader2, DollarSign, Search, Filter,
  CreditCard, TrendingUp, CalendarDays,
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
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useAuth } from "@/hooks/use-auth";

// ─── Types ───────────────────────────────────────────────────
interface PaymentItem {
  payment_id: number;
  student_name: string;
  student_code: string;
  class_name: string;
  title: string;
  amount: number;
  payment_type: string;
  payment_method: string;
  date: string | null;
}

// ─── Main Component ──────────────────────────────────────────
export default function TeacherPaymentsPage() {
  const { isLoading: authLoading } = useAuth();
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [feeTypes, setFeeTypes] = useState<string[]>([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  const [dateFrom, setDateFrom] = useState(format(new Date(), "yyyy-MM-01"));
  const [dateTo, setDateTo] = useState(format(new Date(), "yyyy-MM-dd"));
  const [selectedFeeType, setSelectedFeeType] = useState("all");
  const [search, setSearch] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ─── Fetch Payments ───────────────────────────────────────
  const fetchPayments = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ start_date: dateFrom, end_date: dateTo });
      if (selectedFeeType !== "all") params.set("payment_type", selectedFeeType);

      const res = await fetch(`/api/teacher/payments?${params}`);
      if (!res.ok) throw new Error("Failed to fetch payments");
      const data = await res.json();

      setPayments(data.payments || []);
      setTotalAmount(data.summary?.total || 0);
      setTotalCount(data.summary?.count || 0);
      setFeeTypes(data.fee_types || []);
    } catch {
      setError("Failed to load payment data");
    } finally {
      setIsLoading(false);
    }
  }, [dateFrom, dateTo, selectedFeeType]);

  useEffect(() => {
    if (!authLoading) fetchPayments();
  }, [authLoading, fetchPayments]);

  // ─── Filtered ─────────────────────────────────────────────
  const filtered = search
    ? payments.filter((p) =>
        p.student_name.toLowerCase().includes(search.toLowerCase()) ||
        p.student_code.toLowerCase().includes(search.toLowerCase()) ||
        p.title.toLowerCase().includes(search.toLowerCase())
      )
    : payments;

  // ─── Loading ──────────────────────────────────────────────
  if (authLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-[400px] w-full rounded-xl" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* ─── Header ─────────────────────────────────────── */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Fee Payments</h1>
          <p className="text-sm text-slate-500 mt-1">View fee payment collections for your assigned classes</p>
        </div>

        {/* ─── Summary Stats ───────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className="gap-4 py-4 border-l-4 border-l-emerald-500">
            <CardContent className="px-4 pb-0 pt-0">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-slate-500">Total Collected</p>
                  <p className="text-2xl font-bold text-emerald-600">{totalAmount.toLocaleString()}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="gap-4 py-4 border-l-4 border-l-violet-500">
            <CardContent className="px-4 pb-0 pt-0">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-slate-500">Transactions</p>
                  <p className="text-2xl font-bold text-violet-600">{totalCount}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-violet-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="gap-4 py-4 border-l-4 border-l-amber-500">
            <CardContent className="px-4 pb-0 pt-0">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-slate-500">Avg per Transaction</p>
                  <p className="text-2xl font-bold text-amber-600">
                    {totalCount > 0 ? Math.round(totalAmount / totalCount).toLocaleString() : "0"}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ─── Filters ────────────────────────────────────── */}
        <Card className="gap-4">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Fee Type</Label>
                <Select value={selectedFeeType} onValueChange={setSelectedFeeType}>
                  <SelectTrigger><SelectValue placeholder="All Types" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {feeTypes.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Student name..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ─── Error ──────────────────────────────────────── */}
        {error && (
          <div className="flex items-center gap-3 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* ─── Payments Table ──────────────────────────────── */}
        <Card className="gap-4">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold">Payment Records</CardTitle>
                <p className="text-xs text-slate-500">{filtered.length} records</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12">
                <DollarSign className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-400 text-sm">No payment records found</p>
              </div>
            ) : (
              <div className="max-h-[500px] overflow-y-auto rounded-lg border border-slate-200">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50 hover:bg-slate-50">
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase">#</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase">Student</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase hidden md:table-cell">Class</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase">Title</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase text-right">Amount</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase hidden sm:table-cell">Method</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase hidden lg:table-cell">Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((p, i) => (
                      <TableRow key={p.payment_id} className="hover:bg-slate-50">
                        <TableCell className="text-sm text-slate-500">{i + 1}</TableCell>
                        <TableCell className="font-medium text-sm text-slate-900">
                          <div>
                            {p.student_name}
                            <p className="text-[10px] text-slate-400 font-mono">{p.student_code}</p>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-sm text-slate-500">{p.class_name || "—"}</TableCell>
                        <TableCell className="text-sm text-slate-700">{p.title}</TableCell>
                        <TableCell className="text-right font-semibold text-emerald-600 text-sm">
                          {p.amount.toLocaleString()}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <Badge variant="outline" className="text-xs">{p.payment_method || "—"}</Badge>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-sm text-slate-500">
                          {p.date ? format(new Date(p.date), "MMM d, yyyy") : "—"}
                        </TableCell>
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
