"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Scale, ArrowLeftRight, AlertTriangle, Loader2, CheckCircle2,
  DollarSign, Receipt, TrendingUp, TrendingDown, Building2,
  Filter, Search, ChevronDown, ChevronUp, Clock, FileText,
  CreditCard, CircleDot,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { format } from "date-fns";

// ─── Types ───────────────────────────────────────────────────
interface ReconciliationData {
  date: string;
  summary: {
    totalPayments: number;
    paymentCount: number;
    totalDailyFees: number;
    expectedDailyFees: number;
    dailyFeeDiscrepancy: number;
    totalExpenses: number;
    expenseCount: number;
    netCashFlow: number;
    journalEntries: number;
    totalDebit: number;
    totalCredit: number;
    journalBalanced: boolean;
  };
  payments: any[];
  dailyFeeTransactions: any[];
  expenses: any[];
  paymentByMethod: Record<string, number>;
  dailyFeeByMethod: Record<string, number>;
  journalEntries: any[];
  bankAccounts: any[];
  attendanceInfo: { presentCount: number; enrolledCount: number };
}

// ─── Helpers ─────────────────────────────────────────────────
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "GHS", minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(amount);
}

function StatSkeleton() {
  return <Card className="gap-4 py-4"><CardContent className="px-4 pb-0 pt-0"><div className="flex items-center justify-between"><div className="space-y-2 flex-1"><Skeleton className="h-4 w-24" /><Skeleton className="h-8 w-20" /></div><Skeleton className="h-10 w-10 rounded-xl" /></div></CardContent></Card>;
}

// ─── Main Component ──────────────────────────────────────────
export default function ReconciliationPage() {
  const [data, setData] = useState<ReconciliationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [expandedSection, setExpandedSection] = useState<string | null>("payments");

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/accountant/reconciliation?date=${selectedDate}`);
      if (!res.ok) throw new Error("Failed");
      setData(await res.json());
    } catch {
      setError("Unable to load reconciliation data.");
    } finally {
      setIsLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const toggleSection = (section: string) => {
    setExpandedSection(prev => prev === section ? null : section);
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-72" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{Array.from({ length: 4 }).map((_, i) => <StatSkeleton key={i} />)}</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}</div>
          <Skeleton className="h-80 w-full rounded-xl" />
        </div>
      </DashboardLayout>
    );
  }

  if (error || !data) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center"><AlertTriangle className="w-8 h-8 text-red-600" /></div>
          <h2 className="text-xl font-semibold text-slate-900">Something went wrong</h2>
          <p className="text-slate-500">{error}</p>
          <Button onClick={fetchData} variant="outline"><Loader2 className="w-4 h-4 mr-2" />Try Again</Button>
        </div>
      </DashboardLayout>
    );
  }

  const { summary, payments, dailyFeeTransactions, expenses, paymentByMethod, dailyFeeByMethod, journalEntries, bankAccounts, attendanceInfo } = data;
  const discrepancy = summary.dailyFeeDiscrepancy;
  const hasDiscrepancy = Math.abs(discrepancy) > 0.01;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 p-6 text-white shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                <Scale className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Financial Reconciliation</h1>
                <p className="text-emerald-100 text-sm">Compare bank statements with system records</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-white/10 border-white/20 text-white w-44 focus:ring-white/30"
              />
              {hasDiscrepancy && (
                <Badge className="bg-red-100 text-red-700 border-0">
                  <AlertTriangle className="w-3 h-3 mr-1" /> Discrepancy Found
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="gap-4 py-4 border-l-4 border-l-emerald-500 hover:shadow-md transition-shadow">
            <CardContent className="px-4 pb-0 pt-0">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Total Collections</p>
                  <p className="text-xl font-bold text-emerald-600 tabular-nums">{formatCurrency(summary.totalPayments + summary.totalDailyFees)}</p>
                  <p className="text-xs text-slate-400">{summary.paymentCount} payments</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center"><TrendingUp className="w-5 h-5 text-emerald-600" /></div>
              </div>
            </CardContent>
          </Card>

          <Card className="gap-4 py-4 border-l-4 border-l-red-500 hover:shadow-md transition-shadow">
            <CardContent className="px-4 pb-0 pt-0">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Total Expenses</p>
                  <p className="text-xl font-bold text-red-600 tabular-nums">{formatCurrency(summary.totalExpenses)}</p>
                  <p className="text-xs text-slate-400">{summary.expenseCount} items</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center"><TrendingDown className="w-5 h-5 text-red-600" /></div>
              </div>
            </CardContent>
          </Card>

          <Card className="gap-4 py-4 border-l-4 border-l-sky-500 hover:shadow-md transition-shadow">
            <CardContent className="px-4 pb-0 pt-0">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Net Cash Flow</p>
                  <p className={`text-xl font-bold tabular-nums ${summary.netCashFlow >= 0 ? "text-emerald-600" : "text-red-600"}`}>{formatCurrency(summary.netCashFlow)}</p>
                  <p className="text-xs text-slate-400">Today&apos;s net</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-sky-100 flex items-center justify-center"><DollarSign className="w-5 h-5 text-sky-600" /></div>
              </div>
            </CardContent>
          </Card>

          <Card className={`gap-4 py-4 border-l-4 ${hasDiscrepancy ? "border-l-red-500" : "border-l-emerald-500"} hover:shadow-md transition-shadow`}>
            <CardContent className="px-4 pb-0 pt-0">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Daily Fee Match</p>
                  <p className={`text-xl font-bold tabular-nums ${hasDiscrepancy ? "text-red-600" : "text-emerald-600"}`}>
                    {hasDiscrepancy ? formatCurrency(discrepancy) : "Balanced"}
                  </p>
                  <p className="text-xs text-slate-400">
                    Expected: {formatCurrency(summary.expectedDailyFees)} | Actual: {formatCurrency(summary.totalDailyFees)}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                  {hasDiscrepancy ? <AlertTriangle className="w-5 h-5 text-red-600" /> : <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="gap-4 py-4">
            <CardContent className="px-4 pb-0 pt-0">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500 mb-1">Journal Entries</p>
                  <p className="text-2xl font-bold text-slate-700">{summary.journalEntries}</p>
                  <p className="text-xs text-slate-400">
                    D: {formatCurrency(summary.totalDebit)} | C: {formatCurrency(summary.totalCredit)}
                  </p>
                </div>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${summary.journalBalanced ? "bg-emerald-100" : "bg-red-100"}`}>
                  <FileText className={`w-5 h-5 ${summary.journalBalanced ? "text-emerald-600" : "text-red-600"}`} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="gap-4 py-4">
            <CardContent className="px-4 pb-0 pt-0">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500 mb-1">Attendance Rate</p>
                  <p className="text-2xl font-bold text-violet-600">{attendanceInfo.presentCount} / {attendanceInfo.enrolledCount}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center"><CircleDot className="w-5 h-5 text-violet-600" /></div>
              </div>
            </CardContent>
          </Card>

          <Card className="gap-4 py-4">
            <CardContent className="px-4 pb-0 pt-0">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500 mb-1">Bank Accounts</p>
                  <p className="text-2xl font-bold text-sky-600">{bankAccounts.length}</p>
                  <p className="text-xs text-slate-400">
                    {bankAccounts.length > 0 && formatCurrency(bankAccounts.reduce((s: number, a: any) => s + (a.current_balance || 0), 0))} total balance
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-sky-100 flex items-center justify-center"><Building2 className="w-5 h-5 text-sky-600" /></div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Daily Fee Discrepancy */}
        {hasDiscrepancy && (
          <Card className="gap-4 border-2 border-red-200 bg-red-50/30">
            <CardHeader className="pb-0">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <CardTitle className="text-base font-semibold text-red-700">Discrepancy Detected</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-3 rounded-lg bg-white border border-red-200">
                  <p className="text-xs text-slate-500">Expected Daily Fees</p>
                  <p className="text-lg font-bold text-slate-700">{formatCurrency(summary.expectedDailyFees)}</p>
                  <p className="text-xs text-slate-400">{attendanceInfo.presentCount} present students</p>
                </div>
                <div className="p-3 rounded-lg bg-white border border-red-200">
                  <p className="text-xs text-slate-500">Actual Collections</p>
                  <p className="text-lg font-bold text-slate-700">{formatCurrency(summary.totalDailyFees)}</p>
                  <p className="text-xs text-slate-400">{dailyFeeTransactions.length} transactions</p>
                </div>
                <div className="p-3 rounded-lg bg-red-100 border border-red-300">
                  <p className="text-xs text-red-600">Variance</p>
                  <p className={`text-lg font-bold ${discrepancy > 0 ? "text-emerald-700" : "text-red-700"}`}>{formatCurrency(Math.abs(discrepancy))} {discrepancy > 0 ? "over" : "under"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Transaction Sections */}
        {/* Payments */}
        <Card className="gap-4">
          <CardHeader className="pb-0 cursor-pointer" onClick={() => toggleSection("payments")}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center"><Receipt className="w-4 h-4 text-emerald-600" /></div>
                <CardTitle className="text-base font-semibold">Invoice Payments ({payments.length})</CardTitle>
              </div>
              {expandedSection === "payments" ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
            </div>
          </CardHeader>
          {expandedSection === "payments" && (
            <CardContent className="pt-0">
              <div className="max-h-96 overflow-y-auto rounded-lg border border-slate-200">
                <Table>
                  <TableHeader><TableRow className="bg-slate-50 hover:bg-slate-50">
                    <TableHead className="text-xs font-semibold text-slate-600 uppercase">Receipt</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-600 uppercase">Student</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-600 uppercase hidden sm:table-cell">Invoice</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-600 uppercase text-right">Amount</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-600 uppercase hidden md:table-cell">Method</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {payments.length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="text-center text-slate-400 py-8">No payments recorded for this date</TableCell></TableRow>
                    ) : payments.map((p: any) => (
                      <TableRow key={p.payment_id} className="hover:bg-slate-50">
                        <TableCell className="text-sm font-mono">{p.receipt_code}</TableCell>
                        <TableCell className="text-sm font-medium">{p.student?.name || "Unknown"}</TableCell>
                        <TableCell className="hidden sm:table-cell text-sm text-slate-500">{p.invoice?.invoice_code || "—"}</TableCell>
                        <TableCell className="text-right font-semibold text-sm tabular-nums text-emerald-600">{formatCurrency(p.amount)}</TableCell>
                        <TableCell className="hidden md:table-cell text-sm text-slate-500 capitalize">{p.payment_method?.replace(/_/g, " ")}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {Object.keys(paymentByMethod).length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {Object.entries(paymentByMethod).map(([method, amount]) => (
                    <Badge key={method} variant="secondary" className="text-xs">{method.replace(/_/g, " ")}: {formatCurrency(amount)}</Badge>
                  ))}
                </div>
              )}
            </CardContent>
          )}
        </Card>

        {/* Daily Fee Transactions */}
        <Card className="gap-4">
          <CardHeader className="pb-0 cursor-pointer" onClick={() => toggleSection("dailyfees")}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center"><CreditCard className="w-4 h-4 text-amber-600" /></div>
                <CardTitle className="text-base font-semibold">Daily Fee Transactions ({dailyFeeTransactions.length})</CardTitle>
                <Badge className={hasDiscrepancy ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"}>
                  {formatCurrency(summary.totalDailyFees)}
                </Badge>
              </div>
              {expandedSection === "dailyfees" ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
            </div>
          </CardHeader>
          {expandedSection === "dailyfees" && (
            <CardContent className="pt-0">
              <div className="max-h-96 overflow-y-auto rounded-lg border border-slate-200">
                <Table>
                  <TableHeader><TableRow className="bg-slate-50 hover:bg-slate-50">
                    <TableHead className="text-xs font-semibold text-slate-600 uppercase">Code</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-600 uppercase">Student</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-600 uppercase hidden sm:table-cell">Type</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-600 uppercase text-right">Amount</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-600 uppercase hidden md:table-cell">Method</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {dailyFeeTransactions.length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="text-center text-slate-400 py-8">No daily fee transactions</TableCell></TableRow>
                    ) : dailyFeeTransactions.map((t: any) => (
                      <TableRow key={t.id} className="hover:bg-slate-50">
                        <TableCell className="text-sm font-mono">{t.transaction_code || `TXN-${t.id}`}</TableCell>
                        <TableCell className="text-sm font-medium">{t.student?.name || "Unknown"}</TableCell>
                        <TableCell className="hidden sm:table-cell text-sm text-slate-500 capitalize">{t.payment_type}</TableCell>
                        <TableCell className="text-right font-semibold text-sm tabular-nums text-amber-600">{formatCurrency(t.total_amount)}</TableCell>
                        <TableCell className="hidden md:table-cell text-sm text-slate-500 capitalize">{t.payment_method?.replace(/_/g, " ")}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Expenses */}
        <Card className="gap-4">
          <CardHeader className="pb-0 cursor-pointer" onClick={() => toggleSection("expenses")}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center"><TrendingDown className="w-4 h-4 text-red-600" /></div>
                <CardTitle className="text-base font-semibold">Expenses ({expenses.length})</CardTitle>
                <Badge className="bg-red-100 text-red-700">{formatCurrency(summary.totalExpenses)}</Badge>
              </div>
              {expandedSection === "expenses" ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
            </div>
          </CardHeader>
          {expandedSection === "expenses" && (
            <CardContent className="pt-0">
              <div className="max-h-96 overflow-y-auto rounded-lg border border-slate-200">
                <Table>
                  <TableHeader><TableRow className="bg-slate-50 hover:bg-slate-50">
                    <TableHead className="text-xs font-semibold text-slate-600 uppercase">Title</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-600 uppercase hidden sm:table-cell">Description</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-600 uppercase text-right">Amount</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-600 uppercase hidden md:table-cell">Status</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {expenses.length === 0 ? (
                      <TableRow><TableCell colSpan={4} className="text-center text-slate-400 py-8">No expenses recorded</TableCell></TableRow>
                    ) : expenses.map((e: any) => (
                      <TableRow key={e.id} className="hover:bg-slate-50">
                        <TableCell className="text-sm font-medium">{e.title}</TableCell>
                        <TableCell className="hidden sm:table-cell text-sm text-slate-500 max-w-[200px] truncate">{e.description}</TableCell>
                        <TableCell className="text-right font-semibold text-sm tabular-nums text-red-600">{formatCurrency(e.amount)}</TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Badge variant="secondary" className="text-xs capitalize">{e.status}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Journal Entries */}
        {journalEntries.length > 0 && (
          <Card className="gap-4">
            <CardHeader className="pb-0 cursor-pointer" onClick={() => toggleSection("journal")}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center"><FileText className="w-4 h-4 text-slate-600" /></div>
                  <CardTitle className="text-base font-semibold">Journal Entries ({journalEntries.length})</CardTitle>
                  <Badge className={summary.journalBalanced ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}>
                    {summary.journalBalanced ? "Balanced" : "Unbalanced"}
                  </Badge>
                </div>
                {expandedSection === "journal" ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
              </div>
            </CardHeader>
            {expandedSection === "journal" && (
              <CardContent className="pt-0">
                <div className="max-h-96 overflow-y-auto rounded-lg border border-slate-200">
                  <Table>
                    <TableHeader><TableRow className="bg-slate-50 hover:bg-slate-50">
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase">Entry #</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase">Date</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase hidden sm:table-cell">Narration</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase text-right">Debit</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase text-right">Credit</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase">Status</TableHead>
                    </TableRow></TableHeader>
                    <TableBody>
                      {journalEntries.map((e: any) => (
                        <TableRow key={e.entry_id} className="hover:bg-slate-50">
                          <TableCell className="text-sm font-mono">{e.entry_number}</TableCell>
                          <TableCell className="text-sm text-slate-500">{e.entry_date ? format(new Date(e.entry_date), "MMM d") : "—"}</TableCell>
                          <TableCell className="hidden sm:table-cell text-sm text-slate-600 max-w-[200px] truncate">{e.narration}</TableCell>
                          <TableCell className="text-right font-semibold text-sm tabular-nums">{formatCurrency(e.total_debit)}</TableCell>
                          <TableCell className="text-right font-semibold text-sm tabular-nums">{formatCurrency(e.total_credit)}</TableCell>
                          <TableCell>
                            <Badge variant="secondary" className={`text-xs ${e.status === 'verified' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{e.status || 'pending'}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            )}
          </Card>
        )}

        {/* Bank Accounts Summary */}
        {bankAccounts.length > 0 && (
          <Card className="gap-4">
            <CardHeader className="pb-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-sky-100 flex items-center justify-center"><Building2 className="w-4 h-4 text-sky-600" /></div>
                <CardTitle className="text-base font-semibold">Bank Account Balances</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {bankAccounts.map((acc: any) => (
                  <div key={acc.bank_account_id} className="p-4 rounded-lg border border-slate-200 bg-slate-50">
                    <p className="text-sm font-semibold text-slate-800">{acc.account_name}</p>
                    <p className="text-xs text-slate-500">{acc.bank_name} — {acc.account_number}</p>
                    <p className="text-lg font-bold text-sky-600 tabular-nums mt-1">{formatCurrency(acc.current_balance)}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
