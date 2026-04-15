"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Briefcase, Search, Loader2, AlertTriangle, CheckCircle2, DollarSign,
  Users, FileText, TrendingUp, CalendarDays, Building2, ChevronDown,
  Download, Play,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
  DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { format } from "date-fns";

// ─── Types ───────────────────────────────────────────────────
interface Employee {
  id: number;
  emp_id: string;
  name: string;
  salary: number;
  designation_name: string;
  department_name: string;
  active_status: number;
  lastSalary: any;
}

interface Payslip {
  pay_id: number;
  employee_code: string;
  month: string;
  year: string;
  basic_salary: number;
  gross_salary: number;
  net_salary: number;
  status: string;
  employee: {
    name: string;
    emp_id: string;
    designation: { des_name: string };
    department: { dep_name: string };
  };
}

interface PayrollData {
  employees: Employee[];
  payslips: Payslip[];
  departments: any[];
  designations: any[];
  summary: {
    totalPayroll: number;
    processedCount: number;
    pendingCount: number;
    totalEmployees: number;
    monthlyTotals: { month: string; year: string; total: number }[];
  };
}

// ─── Helpers ─────────────────────────────────────────────────
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "GHS", minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(amount);
}

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function StatSkeleton() {
  return <Card className="gap-4 py-4"><CardContent className="px-4 pb-0 pt-0"><div className="flex items-center justify-between"><div className="space-y-2 flex-1"><Skeleton className="h-4 w-24" /><Skeleton className="h-8 w-20" /></div><Skeleton className="h-10 w-10 rounded-xl" /></div></CardContent></Card>;
}

// ─── Main Component ──────────────────────────────────────────
export default function PayrollPage() {
  const [data, setData] = useState<PayrollData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), "MMMM"));
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [processDialogOpen, setProcessDialogOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [processResult, setProcessResult] = useState<{ processed: number; errors: string[] } | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (selectedMonth) params.set("month", selectedMonth);
      if (selectedYear) params.set("year", selectedYear);
      const res = await fetch(`/api/accountant/payroll?${params.toString()}`);
      if (!res.ok) throw new Error("Failed");
      setData(await res.json());
    } catch {
      setError("Unable to load payroll data.");
    } finally {
      setIsLoading(false);
    }
  }, [search, selectedMonth, selectedYear]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleProcessPayroll = async () => {
    if (!data) return;
    setProcessing(true);
    setProcessResult(null);
    try {
      const empCodes = data.employees.map(e => e.emp_id);
      const res = await fetch("/api/accountant/payroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month: selectedMonth, year: selectedYear, employeeCodes: empCodes }),
      });
      const result = await res.json();
      if (res.ok) {
        setProcessResult({ processed: result.processed, errors: result.errors });
        fetchData();
      }
    } catch {
      setProcessResult({ processed: 0, errors: ["Failed to process payroll"] });
    } finally {
      setProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-72" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{Array.from({ length: 4 }).map((_, i) => <StatSkeleton key={i} />)}</div>
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

  const { employees, payslips, summary } = data;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 p-6 text-white shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                <Briefcase className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Payroll Management</h1>
                <p className="text-emerald-100 text-sm">Process monthly payroll and view payslips</p>
              </div>
            </div>
            <Dialog open={processDialogOpen} onOpenChange={setProcessDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-white text-emerald-700 hover:bg-emerald-50 shadow-lg">
                  <Play className="w-4 h-4 mr-2" />Process Payroll
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Process Payroll</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="p-4 rounded-lg bg-amber-50 border border-amber-200">
                    <p className="text-sm text-amber-800">
                      <strong>Warning:</strong> This will generate payslips for <strong>{employees.length}</strong> employees for <strong>{selectedMonth} {selectedYear}</strong>.
                    </p>
                  </div>
                  {processResult && (
                    <div className={`p-3 rounded-lg text-sm ${processResult.processed > 0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                      <p>{processResult.processed} payslips processed.</p>
                      {processResult.errors.length > 0 && (
                        <ul className="mt-2 text-xs space-y-1">
                          {processResult.errors.map((e, i) => <li key={i}>• {e}</li>)}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                  <Button onClick={handleProcessPayroll} disabled={processing || employees.length === 0} className="bg-emerald-600 hover:bg-emerald-700">
                    {processing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Confirm Processing
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="gap-4 py-4 border-l-4 border-l-emerald-500 hover:shadow-md transition-shadow">
            <CardContent className="px-4 pb-0 pt-0">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Total Payroll</p>
                  <p className="text-xl font-bold text-emerald-600 tabular-nums">{formatCurrency(summary.totalPayroll)}</p>
                  <p className="text-xs text-slate-400">{selectedMonth} {selectedYear}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center"><DollarSign className="w-5 h-5 text-emerald-600" /></div>
              </div>
            </CardContent>
          </Card>
          <Card className="gap-4 py-4 border-l-4 border-l-sky-500 hover:shadow-md transition-shadow">
            <CardContent className="px-4 pb-0 pt-0">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Employees</p>
                  <p className="text-xl font-bold text-sky-600">{summary.totalEmployees}</p>
                  <p className="text-xs text-slate-400">Active staff</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-sky-100 flex items-center justify-center"><Users className="w-5 h-5 text-sky-600" /></div>
              </div>
            </CardContent>
          </Card>
          <Card className="gap-4 py-4 border-l-4 border-l-amber-500 hover:shadow-md transition-shadow">
            <CardContent className="px-4 pb-0 pt-0">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Processed</p>
                  <p className="text-xl font-bold text-amber-600">{summary.processedCount}</p>
                  <p className="text-xs text-slate-400">Payslips generated</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center"><FileText className="w-5 h-5 text-amber-600" /></div>
              </div>
            </CardContent>
          </Card>
          <Card className="gap-4 py-4 border-l-4 border-l-red-500 hover:shadow-md transition-shadow">
            <CardContent className="px-4 pb-0 pt-0">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Pending</p>
                  <p className="text-xl font-bold text-red-600">{summary.pendingCount}</p>
                  <p className="text-xs text-slate-400">Awaiting processing</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center"><CalendarDays className="w-5 h-5 text-red-600" /></div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Month/Year Filter */}
        <Card className="gap-4">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Search by name or employee ID..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-44"><SelectValue placeholder="Month" /></SelectTrigger>
                <SelectContent>
                  {MONTHS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-32"><SelectValue placeholder="Year" /></SelectTrigger>
                <SelectContent>
                  {[2024, 2025, 2026].map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Tabs: Payslips | Employees */}
        <Tabs defaultValue="payslips">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="payslips">Payslips</TabsTrigger>
            <TabsTrigger value="employees">Employees</TabsTrigger>
          </TabsList>

          {/* Payslips Tab */}
          <TabsContent value="payslips">
            <Card className="gap-4">
              <CardHeader className="pb-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center"><FileText className="w-4 h-4 text-emerald-600" /></div>
                    <CardTitle className="text-base font-semibold">
                      Payslips — {selectedMonth} {selectedYear}
                    </CardTitle>
                    <Badge className="bg-emerald-100 text-emerald-700">{payslips.length}</Badge>
                  </div>
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-1" />Export
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="max-h-[500px] overflow-y-auto rounded-lg border border-slate-200">
                  <Table>
                    <TableHeader><TableRow className="bg-slate-50 hover:bg-slate-50">
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase">Employee</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase hidden sm:table-cell">Department</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase text-right hidden md:table-cell">Basic</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase text-right hidden md:table-cell">Gross</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase text-right">Net Salary</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase text-center">Status</TableHead>
                    </TableRow></TableHeader>
                    <TableBody>
                      {payslips.length === 0 ? (
                        <TableRow><TableCell colSpan={6} className="text-center text-slate-400 py-8">
                          No payslips for {selectedMonth} {selectedYear}. Click "Process Payroll" to generate.
                        </TableCell></TableRow>
                      ) : payslips.map((p) => (
                        <TableRow key={p.pay_id} className="hover:bg-slate-50">
                          <TableCell>
                            <div>
                              <p className="text-sm font-medium">{p.employee?.name || "Unknown"}</p>
                              <p className="text-xs text-slate-400">{p.employee?.emp_id}</p>
                            </div>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell text-sm text-slate-500">{p.employee?.department?.des_name || "—"}</TableCell>
                          <TableCell className="hidden md:table-cell text-right text-sm tabular-nums text-slate-600">{formatCurrency(p.basic_salary)}</TableCell>
                          <TableCell className="hidden md:table-cell text-right text-sm tabular-nums text-slate-600">{formatCurrency(p.gross_salary)}</TableCell>
                          <TableCell className="text-right font-semibold text-sm tabular-nums text-emerald-600">{formatCurrency(p.net_salary)}</TableCell>
                          <TableCell className="text-center">
                            <Badge className="bg-emerald-100 text-emerald-700">{p.status || 'processed'}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                {payslips.length > 0 && (
                  <div className="mt-3 p-3 rounded-lg bg-slate-50 border flex justify-between items-center">
                    <span className="text-sm text-slate-500">Total ({payslips.length} employees)</span>
                    <span className="text-lg font-bold text-emerald-600 tabular-nums">{formatCurrency(payslips.reduce((s, p) => s + p.net_salary, 0))}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Employees Tab */}
          <TabsContent value="employees">
            <Card className="gap-4">
              <CardHeader className="pb-0">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-sky-100 flex items-center justify-center"><Users className="w-4 h-4 text-sky-600" /></div>
                  <CardTitle className="text-base font-semibold">Employee List ({employees.length})</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="max-h-[500px] overflow-y-auto rounded-lg border border-slate-200">
                  <Table>
                    <TableHeader><TableRow className="bg-slate-50 hover:bg-slate-50">
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase">Employee</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase hidden sm:table-cell">Designation</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase hidden md:table-cell">Department</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase text-right">Salary</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase text-center">Status</TableHead>
                    </TableRow></TableHeader>
                    <TableBody>
                      {employees.length === 0 ? (
                        <TableRow><TableCell colSpan={5} className="text-center text-slate-400 py-8">No employees found</TableCell></TableRow>
                      ) : employees.map((e) => (
                        <TableRow key={e.id} className="hover:bg-slate-50">
                          <TableCell>
                            <div>
                              <p className="text-sm font-medium">{e.name}</p>
                              <p className="text-xs text-slate-400">{e.emp_id}</p>
                            </div>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell text-sm text-slate-500">{e.designation_name}</TableCell>
                          <TableCell className="hidden md:table-cell text-sm text-slate-500">{e.department_name}</TableCell>
                          <TableCell className="text-right font-semibold text-sm tabular-nums text-sky-600">{formatCurrency(e.salary)}</TableCell>
                          <TableCell className="text-center">
                            <Badge className="bg-emerald-100 text-emerald-700">Active</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
