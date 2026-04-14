"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Banknote,
  Download,
  Printer,
  Loader2,
  AlertTriangle,
  Calendar,
  DollarSign,
  Shield,
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
} from "@/components/ui/dialog";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useAuth } from "@/hooks/use-auth";
import { format } from "date-fns";

// ─── Types ───────────────────────────────────────────────────
interface Payslip {
  id: number;
  month: string;
  year: string;
  basic_salary: number;
  allowance: number;
  ssnit_deduction: number;
  nhil: number;
  getfund: number;
  tax: number;
  other_deductions: number;
  net_pay: number;
  status: string;
  generated_at: string;
}

// ─── Helpers ─────────────────────────────────────────────────
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "GHS", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
}

// ─── Main Component ──────────────────────────────────────────
export default function TeacherPayslipsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPayslip, setSelectedPayslip] = useState<Payslip | null>(null);

  const fetchPayslips = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/payslips?teacherId=${user?.id}`);
      if (res.ok) {
        const data = await res.json();
        setPayslips(Array.isArray(data) ? data : []);
      }
    } catch {
      // Use demo data if API fails
      setPayslips([]);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!authLoading) fetchPayslips();
  }, [authLoading, fetchPayslips]);

  const handlePrint = () => window.print();

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">My Payslips</h1>
            <p className="text-sm text-slate-500 mt-1">Monthly salary details and deductions</p>
          </div>
          <Button variant="outline" onClick={handlePrint} className="min-w-[44px] min-h-[44px] print:hidden">
            <Printer className="w-4 h-4 mr-2" />Print
          </Button>
        </div>

        {/* ─── Summary ─────────────────────────────────────── */}
        {payslips.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="py-4 border-l-4 border-l-emerald-500">
              <CardContent className="px-4 pb-0 pt-0">
                <p className="text-xs font-medium text-slate-500">Latest Net Pay</p>
                <p className="text-2xl font-bold text-emerald-600 tabular-nums">{formatCurrency(payslips[0]?.net_pay || 0)}</p>
                <p className="text-xs text-slate-400 mt-1">{payslips[0]?.month} {payslips[0]?.year}</p>
              </CardContent>
            </Card>
            <Card className="py-4 border-l-4 border-l-blue-500">
              <CardContent className="px-4 pb-0 pt-0">
                <p className="text-xs font-medium text-slate-500">Total Gross (YTD)</p>
                <p className="text-2xl font-bold text-blue-600 tabular-nums">{formatCurrency(payslips.reduce((s, p) => s + (p.basic_salary + p.allowance), 0))}</p>
              </CardContent>
            </Card>
            <Card className="py-4 border-l-4 border-l-red-500">
              <CardContent className="px-4 pb-0 pt-0">
                <p className="text-xs font-medium text-slate-500">Total Deductions (YTD)</p>
                <p className="text-2xl font-bold text-red-600 tabular-nums">{formatCurrency(payslips.reduce((s, p) => s + p.ssnit_deduction + p.nhil + p.getfund + p.tax + p.other_deductions, 0))}</p>
              </CardContent>
            </Card>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-3 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />{error}
          </div>
        )}

        {/* ─── Payslip List ────────────────────────────────── */}
        <Card className="gap-4">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                <Banknote className="w-4 h-4 text-emerald-600" />
              </div>
              <CardTitle className="text-base font-semibold">Payslip History ({payslips.length})</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {payslips.length === 0 ? (
              <div className="text-center py-12">
                <Banknote className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-400 text-sm">No payslips available yet</p>
                <p className="text-slate-300 text-xs mt-1">Payslips will appear once generated by the administrator</p>
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto rounded-lg border border-slate-200">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50 hover:bg-slate-50">
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase">Period</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase hidden sm:table-cell">Basic Salary</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase hidden md:table-cell">Deductions</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase text-right">Net Pay</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase text-center">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payslips.map((p) => {
                      const deductions = p.ssnit_deduction + p.nhil + p.getfund + p.tax + p.other_deductions;
                      return (
                        <TableRow key={p.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => setSelectedPayslip(p)}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-slate-400" />
                              <span className="font-medium text-sm">{p.month} {p.year}</span>
                            </div>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell text-sm tabular-nums">{formatCurrency(p.basic_salary + p.allowance)}</TableCell>
                          <TableCell className="hidden md:table-cell text-sm tabular-nums text-red-600">{formatCurrency(deductions)}</TableCell>
                          <TableCell className="text-right font-bold text-sm tabular-nums text-emerald-600">{formatCurrency(p.net_pay)}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant="secondary" className={p.status === "paid" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}>
                              {p.status || "pending"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ─── Payslip Detail ──────────────────────────────── */}
        <Dialog open={!!selectedPayslip} onOpenChange={(open) => !open && setSelectedPayslip(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Payslip — {selectedPayslip?.month} {selectedPayslip?.year}</DialogTitle>
            </DialogHeader>
            {selectedPayslip && (
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-500" />Earnings
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-slate-500">Basic Salary</span><span className="font-medium">{formatCurrency(selectedPayslip.basic_salary)}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Allowance</span><span className="font-medium">{formatCurrency(selectedPayslip.allowance)}</span></div>
                  <div className="flex justify-between border-t pt-2 font-bold"><span>Gross Pay</span><span>{formatCurrency(selectedPayslip.basic_salary + selectedPayslip.allowance)}</span></div>
                </div>

                <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-2 pt-2">
                  <Shield className="w-4 h-4 text-red-500" />Deductions (Ghana Statutory)
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-slate-500">SSNIT (13.5%)</span><span className="text-red-600">{formatCurrency(selectedPayslip.ssnit_deduction)}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">NHIL (2.5%)</span><span className="text-red-600">{formatCurrency(selectedPayslip.nhil)}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">GETFund (2.5%)</span><span className="text-red-600">{formatCurrency(selectedPayslip.getfund)}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Income Tax</span><span className="text-red-600">{formatCurrency(selectedPayslip.tax)}</span></div>
                  {selectedPayslip.other_deductions > 0 && (
                    <div className="flex justify-between"><span className="text-slate-500">Other Deductions</span><span className="text-red-600">{formatCurrency(selectedPayslip.other_deductions)}</span></div>
                  )}
                  <div className="flex justify-between border-t pt-2 font-bold"><span>Total Deductions</span><span className="text-red-600">{formatCurrency(selectedPayslip.ssnit_deduction + selectedPayslip.nhil + selectedPayslip.getfund + selectedPayslip.tax + selectedPayslip.other_deductions)}</span></div>
                </div>

                <div className="flex justify-between bg-emerald-50 rounded-lg p-4 font-bold text-lg">
                  <span>Net Pay</span>
                  <span className="text-emerald-600">{formatCurrency(selectedPayslip.net_pay)}</span>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
