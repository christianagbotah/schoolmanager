'use client';

import { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  Banknote, DollarSign, CheckCircle, Clock, Users, CalendarDays,
  Eye, FileText, AlertCircle, RefreshCw, Loader2, TrendingUp,
  CreditCard, Shield, ArrowUpRight,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Employee {
  id: number; emp_id: string; name: string; salary: number; active_status: number;
  department: { dep_name: string } | null;
  designation: { des_name: string } | null;
}
interface Salary {
  pay_id: number; employee_code: string; month: string; year: string;
  basic_salary: number; gross_salary: number; net_salary: number; status: string;
  employee: Employee | null;
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function fmt(n: number) {
  return `GHS ${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// ─── Skeleton Components ─────────────────────────────────────────────────────

function StatCardSkeleton() {
  return (
    <Card className="border-slate-200/60">
      <CardContent className="p-4 flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-lg flex-shrink-0" />
        <div className="space-y-1.5 flex-1">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-6 w-14" />
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function PayrollPage() {
  const [salaries, setSalaries] = useState<Salary[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(String(new Date().getMonth() + 1));
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [filterStatus, setFilterStatus] = useState('all');
  const [processing, setProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState('payroll');

  // Dialog states
  const [payslipOpen, setPayslipOpen] = useState(false);
  const [selectedSalary, setSelectedSalary] = useState<Salary | null>(null);
  const [payOpen, setPayOpen] = useState(false);
  const [paySaving, setPaySaving] = useState(false);

  const [payForm, setPayForm] = useState({
    employee_code: '', month: '', year: '', basic_salary: '', allowance: '', deduction: '', net_salary: '',
  });

  const years = [
    String(new Date().getFullYear()),
    String(new Date().getFullYear() - 1),
    String(new Date().getFullYear() - 2),
  ];

  // ─── Data Fetching ─────────────────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ month: selectedMonth, year: selectedYear });
      if (filterStatus !== 'all') params.set('status', filterStatus);
      const [salRes, empRes] = await Promise.all([
        fetch(`/api/payroll?${params}`),
        fetch('/api/employees?limit=300'),
      ]);
      if (!salRes.ok) throw new Error('Failed to load payroll data');
      const salData = await salRes.json();
      setSalaries(Array.isArray(salData) ? salData : []);
      const empData = await empRes.json();
      setEmployees(Array.isArray(empData) ? empData : []);
    } catch {
      setError('Failed to load payroll data');
    }
    setLoading(false);
  }, [selectedMonth, selectedYear, filterStatus]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ─── Computed ──────────────────────────────────────────────────────────────

  const totalGross = salaries.reduce((s, sl) => s + sl.gross_salary, 0);
  const totalNet = salaries.reduce((s, sl) => s + sl.net_salary, 0);
  const totalBasic = salaries.reduce((s, sl) => s + sl.basic_salary, 0);
  const processed = salaries.filter(s => s.status === 'processed').length;
  const pending = salaries.filter(s => s.status === 'pending').length;
  const activeEmployees = employees.filter(e => e.active_status === 1).length;

  // ─── Handlers ──────────────────────────────────────────────────────────────

  const handleBulkProcess = async () => {
    setProcessing(true);
    try {
      const activeEmps = employees.filter(e => e.active_status === 1);
      if (activeEmps.length === 0) {
        toast.error('No active employees found');
        setProcessing(false);
        return;
      }
      const empPayload = activeEmps.map(e => ({
        emp_id: e.emp_id,
        salary: e.salary,
        gross_salary: Math.round(e.salary * 1.1 * 100) / 100,
        net_salary: Math.round(e.salary * 0.9 * 100) / 100,
      }));
      const res = await fetch('/api/payroll', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month: selectedMonth, year: selectedYear, employees: empPayload }),
      });
      if (!res.ok) throw new Error();
      toast.success(`Payroll processed for ${empPayload.length} employees`);
      fetchData();
    } catch {
      toast.error('Payroll processing failed');
    }
    setProcessing(false);
  };

  const handleIndividualPay = async () => {
    if (!payForm.employee_code || !payForm.basic_salary) {
      toast.error('Employee and basic salary are required');
      return;
    }
    setPaySaving(true);
    try {
      const allowance = parseFloat(payForm.allowance || '0');
      const deduction = parseFloat(payForm.deduction || '0');
      const basic = parseFloat(payForm.basic_salary);
      await fetch('/api/payroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employee_code: payForm.employee_code,
          month: payForm.month,
          year: payForm.year,
          basic_salary: basic,
          gross_salary: basic + allowance,
          net_salary: basic + allowance - deduction,
        }),
      });
      toast.success('Salary recorded successfully');
      setPayOpen(false);
      fetchData();
    } catch {
      toast.error('Failed to record salary');
    }
    setPaySaving(false);
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Payroll Management</h1>
            <p className="text-sm text-slate-500 mt-1">Salary processing, payslips &amp; reports</p>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {loading ? (
            <><StatCardSkeleton /><StatCardSkeleton /><StatCardSkeleton /><StatCardSkeleton /></>
          ) : (
            <>
              <Card className="border-slate-200/60 hover:shadow-sm transition-shadow">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                    <Users className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-slate-500 truncate">Total Staff</p>
                    <p className="text-xl font-bold text-slate-900">{employees.length}</p>
                    <p className="text-[10px] text-slate-400">{activeEmployees} active</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-slate-200/60 hover:shadow-sm transition-shadow">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-sky-100 flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-5 h-5 text-sky-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-slate-500 truncate">Processed</p>
                    <p className="text-xl font-bold text-slate-900">{processed}</p>
                    <p className="text-[10px] text-emerald-500 font-medium">
                      {salaries.length > 0 ? `${Math.round((processed / salaries.length) * 100)}% done` : 'No records'}
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-slate-200/60 hover:shadow-sm transition-shadow">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                    <Clock className="w-5 h-5 text-amber-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-slate-500 truncate">Pending</p>
                    <p className="text-xl font-bold text-slate-900">{pending}</p>
                    <p className="text-[10px] text-amber-500 font-medium">
                      {pending > 0 ? 'Needs processing' : 'All done'}
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-slate-200/60 hover:shadow-sm transition-shadow">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center flex-shrink-0">
                    <DollarSign className="w-5 h-5 text-violet-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-slate-500 truncate">Net Total</p>
                    <p className="text-xl font-bold text-slate-900">{fmt(totalNet)}</p>
                    <p className="text-[10px] text-slate-400">{MONTHS[parseInt(selectedMonth) - 1]} {selectedYear}</p>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-white border border-slate-200 p-1 rounded-xl h-auto flex w-full sm:w-auto">
            <TabsTrigger value="payroll" className="flex-1 min-w-[90px] data-[state=active]:bg-emerald-600 data-[state=active]:text-white rounded-lg py-2 text-sm">
              <Banknote className="w-4 h-4 mr-1.5 hidden sm:inline" /> Payroll
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex-1 min-w-[90px] data-[state=active]:bg-emerald-600 data-[state=active]:text-white rounded-lg py-2 text-sm">
              <FileText className="w-4 h-4 mr-1.5 hidden sm:inline" /> Reports
            </TabsTrigger>
          </TabsList>

          {/* ═══ Payroll Tab ═══ */}
          <TabsContent value="payroll">
            {/* Filter Bar */}
            <Card className="border-slate-200/60 mb-4">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                    <CalendarDays className="w-5 h-5 text-slate-500" />
                    <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                      <SelectTrigger className="w-[150px] min-h-[44px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {MONTHS.map((m, i) => <SelectItem key={i} value={(i + 1).toString()}>{m}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Select value={selectedYear} onValueChange={setSelectedYear}>
                      <SelectTrigger className="w-[100px] min-h-[44px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger className="w-[140px] min-h-[44px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__all__">All Status</SelectItem>
                        <SelectItem value="processed">Processed</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="sm:ml-auto flex gap-2 w-full sm:w-auto">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setPayForm({ employee_code: '', month: selectedMonth, year: selectedYear, basic_salary: '', allowance: '', deduction: '', net_salary: '' });
                        setPayOpen(true);
                      }}
                      className="min-h-[44px] border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                    >
                      <CreditCard className="w-4 h-4 mr-2" />
                      <span className="hidden sm:inline">Record</span> Individual
                    </Button>
                    <Button
                      onClick={handleBulkProcess}
                      className="bg-emerald-600 hover:bg-emerald-700 min-h-[44px] shadow-sm"
                      disabled={processing}
                    >
                      {processing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Banknote className="w-4 h-4 mr-2" />}
                      {processing ? 'Processing...' : 'Process Payroll'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Error State */}
            {error && (
              <Card className="border-red-200 mb-4">
                <CardContent className="py-8 flex flex-col items-center text-center gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center">
                    <AlertCircle className="w-7 h-7 text-red-500" />
                  </div>
                  <p className="font-medium text-slate-900">{error}</p>
                  <Button variant="outline" onClick={fetchData} className="mt-1 border-emerald-200 text-emerald-700 hover:bg-emerald-50 min-h-[44px]">
                    <RefreshCw className="w-4 h-4 mr-2" /> Retry
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Payroll Data */}
            {loading ? (
              <Card className="border-slate-200/60"><CardContent className="p-0">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="p-4 border-b border-slate-100 last:border-0">
                    <Skeleton className="h-10 w-full rounded" />
                  </div>
                ))}
              </CardContent></Card>
            ) : salaries.length === 0 ? (
              <Card className="py-16 border-slate-200/60">
                <CardContent className="flex flex-col items-center gap-3">
                  <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center">
                    <Banknote className="w-8 h-8 text-slate-300" />
                  </div>
                  <div className="text-center">
                    <p className="text-slate-500 font-medium">No payroll records</p>
                    <p className="text-sm text-slate-400 mt-1">
                      {filterStatus !== 'all' ? 'Try changing the status filter' : `No records for ${MONTHS[parseInt(selectedMonth) - 1]} ${selectedYear}`}
                    </p>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setPayForm({ employee_code: '', month: selectedMonth, year: selectedYear, basic_salary: '', allowance: '', deduction: '', net_salary: '' });
                        setPayOpen(true);
                      }}
                      className="min-h-[44px]"
                    >
                      <CreditCard className="w-4 h-4 mr-2" /> Record Salary
                    </Button>
                    <Button onClick={handleBulkProcess} className="bg-emerald-600 hover:bg-emerald-700 min-h-[44px]" disabled={processing}>
                      {processing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Banknote className="w-4 h-4 mr-2" />}
                      Process Payroll
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Desktop Table */}
                <Card className="border-slate-200/60 hidden md:block">
                  <CardContent className="p-0">
                    <div className="max-h-[600px] overflow-y-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-slate-50 hover:bg-slate-50">
                            <TableHead className="text-xs font-semibold text-slate-600">Employee</TableHead>
                            <TableHead className="text-xs font-semibold text-slate-600">Department</TableHead>
                            <TableHead className="text-xs font-semibold text-slate-600 text-right">Basic</TableHead>
                            <TableHead className="text-xs font-semibold text-slate-600 text-right">Gross</TableHead>
                            <TableHead className="text-xs font-semibold text-slate-600 text-right">Net</TableHead>
                            <TableHead className="text-xs font-semibold text-slate-600">Status</TableHead>
                            <TableHead className="text-xs font-semibold text-slate-600 w-24"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {salaries.map(sal => (
                            <TableRow key={sal.pay_id} className="hover:bg-slate-50/50">
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 ${sal.status === 'processed' ? 'bg-emerald-500' : 'bg-amber-500'}`}>
                                    {sal.employee?.name?.charAt(0) || sal.employee_code.charAt(0)}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="font-medium text-sm text-slate-900 truncate">{sal.employee?.name || sal.employee_code}</p>
                                    <p className="text-xs text-slate-400">{sal.employee?.designation?.des_name || ''}</p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="text-xs text-slate-500">{sal.employee?.department?.dep_name || '\u2014'}</TableCell>
                              <TableCell className="text-right text-sm">{fmt(sal.basic_salary)}</TableCell>
                              <TableCell className="text-right text-sm">{fmt(sal.gross_salary)}</TableCell>
                              <TableCell className="text-right text-sm font-semibold text-slate-900">{fmt(sal.net_salary)}</TableCell>
                              <TableCell>
                                <Badge className={`text-xs ${sal.status === 'processed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                  {sal.status === 'processed' ? <CheckCircle className="w-3 h-3 mr-1" /> : <Clock className="w-3 h-3 mr-1" />}
                                  {sal.status}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Button size="sm" variant="ghost" className="h-8 text-xs text-emerald-600 hover:bg-emerald-50 min-h-[36px]" onClick={() => { setSelectedSalary(sal); setPayslipOpen(true); }}>
                                  <Eye className="w-3.5 h-3.5 mr-1" /> View
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                  <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50/50">
                    <p className="text-xs text-slate-500">Showing {salaries.length} record(s)</p>
                    <p className="text-xs font-medium text-emerald-700">Net Total: {fmt(totalNet)}</p>
                  </div>
                </Card>

                {/* Mobile Cards */}
                <div className="md:hidden space-y-3">
                  {salaries.map(sal => (
                    <Card key={sal.pay_id} className={`border-slate-200/60 hover:shadow-sm transition-shadow ${sal.status === 'pending' ? 'border-l-4 border-l-amber-400' : ''}`}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0 ${sal.status === 'processed' ? 'bg-emerald-500' : 'bg-amber-500'}`}>
                              {sal.employee?.name?.charAt(0) || sal.employee_code.charAt(0)}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-sm text-slate-900 truncate">{sal.employee?.name || sal.employee_code}</p>
                              <p className="text-xs text-slate-500">{sal.employee?.department?.dep_name || '\u2014'}</p>
                            </div>
                          </div>
                          <Badge className={`text-[10px] flex-shrink-0 ${sal.status === 'processed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                            {sal.status}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <div className="bg-slate-50 rounded-lg p-2.5 text-center">
                            <p className="text-[10px] text-slate-500">Basic</p>
                            <p className="text-xs font-bold text-slate-900">{fmt(sal.basic_salary)}</p>
                          </div>
                          <div className="bg-slate-50 rounded-lg p-2.5 text-center">
                            <p className="text-[10px] text-slate-500">Gross</p>
                            <p className="text-xs font-bold text-slate-900">{fmt(sal.gross_salary)}</p>
                          </div>
                          <div className="bg-emerald-50 rounded-lg p-2.5 text-center">
                            <p className="text-[10px] text-emerald-600">Net</p>
                            <p className="text-xs font-bold text-emerald-700">{fmt(sal.net_salary)}</p>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full mt-3 h-10 text-xs min-h-[44px]"
                          onClick={() => { setSelectedSalary(sal); setPayslipOpen(true); }}
                        >
                          <Eye className="w-3.5 h-3.5 mr-1.5" /> View Payslip
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <p className="text-xs text-slate-400 text-center mt-2">
                  Showing {salaries.length} record(s) for {MONTHS[parseInt(selectedMonth) - 1]} {selectedYear}
                  {filterStatus !== 'all' && <span> &middot; Filtered by: {filterStatus}</span>}
                </p>
              </>
            )}
          </TabsContent>

          {/* ═══ Reports Tab ═══ */}
          <TabsContent value="reports">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Summary Card */}
              <Card className="border-slate-200/60">
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                      <TrendingUp className="w-4 h-4 text-emerald-600" />
                    </div>
                    <h3 className="font-semibold text-slate-900">
                      Summary &mdash; {MONTHS[parseInt(selectedMonth) - 1]} {selectedYear}
                    </h3>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                      <span className="text-sm text-slate-600">Total Basic</span>
                      <span className="font-mono font-bold text-slate-900">{fmt(totalBasic)}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                      <span className="text-sm text-slate-600">Total Gross</span>
                      <span className="font-mono font-bold text-slate-900">{fmt(totalGross)}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                      <span className="text-sm font-medium text-emerald-700">Total Net (Take Home)</span>
                      <span className="font-mono font-bold text-emerald-700">{fmt(totalNet)}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                      <div>
                        <span className="text-sm text-slate-600">Processing Status</span>
                        <p className="text-xs text-slate-400 mt-0.5">{processed} of {salaries.length} employees</p>
                      </div>
                      <span className="font-mono font-bold text-slate-900">{salaries.length > 0 ? `${Math.round((processed / salaries.length) * 100)}%` : '0%'}</span>
                    </div>
                    <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                        style={{ width: `${salaries.length ? (processed / salaries.length) * 100 : 0}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                      <span className="text-sm text-slate-600">Total Deductions (approx.)</span>
                      <span className="font-mono font-bold text-amber-600">{fmt(totalGross - totalNet)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Top Salaries Card */}
              <Card className="border-slate-200/60">
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center">
                      <ArrowUpRight className="w-4 h-4 text-violet-600" />
                    </div>
                    <h3 className="font-semibold text-slate-900">Top Salaries</h3>
                    <Badge variant="outline" className="text-xs ml-auto border-slate-200">Processed only</Badge>
                  </div>
                  <div className="space-y-1.5 max-h-[360px] overflow-y-auto">
                    {salaries
                      .filter(s => s.status === 'processed')
                      .sort((a, b) => b.net_salary - a.net_salary)
                      .slice(0, 10)
                      .length === 0 ? (
                      <div className="text-center py-8 text-slate-400">
                        <Shield className="w-8 h-8 mx-auto mb-2 opacity-30" />
                        <p className="text-sm">No processed salaries to display</p>
                      </div>
                    ) : (
                      salaries
                        .filter(s => s.status === 'processed')
                        .sort((a, b) => b.net_salary - a.net_salary)
                        .slice(0, 10)
                        .map((s, i) => (
                          <div key={s.pay_id} className="flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 transition-colors">
                            <div className="flex items-center gap-3">
                              <span className={`text-xs font-bold w-5 text-center ${i < 3 ? 'text-emerald-600' : 'text-slate-400'}`}>
                                {i + 1}
                              </span>
                              <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                                {s.employee?.name?.charAt(0) || '?'}
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-slate-900 truncate">{s.employee?.name || s.employee_code}</p>
                                <p className="text-[10px] text-slate-400">{s.employee?.department?.dep_name || ''}</p>
                              </div>
                            </div>
                            <span className="font-mono text-sm font-bold text-slate-900">{fmt(s.net_salary)}</span>
                          </div>
                        ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          DIALOGS
          ═══════════════════════════════════════════════════════════════════════ */}

      {/* Payslip Detail Dialog */}
      <Dialog open={payslipOpen} onOpenChange={setPayslipOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                <FileText className="w-4 h-4 text-emerald-600" />
              </div>
              Payslip Details
            </DialogTitle>
            <DialogDescription>View salary breakdown for this employee</DialogDescription>
          </DialogHeader>
          {selectedSalary && (
            <div className="space-y-4">
              <div className="bg-emerald-50 rounded-lg p-4 text-center">
                <p className="text-sm text-emerald-600">Payslip for</p>
                <p className="text-lg font-bold text-slate-900">{selectedSalary.employee?.name || selectedSalary.employee_code}</p>
                <p className="text-xs text-emerald-500">{MONTHS[parseInt(selectedSalary.month) - 1]} {selectedSalary.year}</p>
                {selectedSalary.employee?.department && (
                  <p className="text-xs text-slate-500 mt-1">{selectedSalary.employee.department.dep_name}</p>
                )}
              </div>
              <div className="space-y-2">
                {[
                  { label: 'Basic Salary', value: selectedSalary.basic_salary, highlight: false },
                  { label: 'Gross Salary', value: selectedSalary.gross_salary, highlight: false },
                  { label: 'Net Salary (Take Home)', value: selectedSalary.net_salary, highlight: true },
                ].map(({ label, value, highlight }) => (
                  <div key={label} className={`flex justify-between items-center p-3 rounded-lg ${highlight ? 'bg-emerald-50 border border-emerald-100' : 'bg-slate-50'}`}>
                    <span className={`text-sm ${highlight ? 'font-medium text-emerald-700' : 'text-slate-600'}`}>{label}</span>
                    <span className={`font-mono font-bold ${highlight ? 'text-emerald-700' : 'text-slate-900'}`}>{fmt(value)}</span>
                  </div>
                ))}
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500">Status</span>
                <Badge className={`text-xs ${selectedSalary.status === 'processed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                  {selectedSalary.status === 'processed' ? <CheckCircle className="w-3 h-3 mr-1" /> : <Clock className="w-3 h-3 mr-1" />}
                  {selectedSalary.status}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500">SSNIT Contribution (5.5%)</span>
                <span className="font-mono text-sm text-slate-700">{fmt(selectedSalary.basic_salary * 0.055)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500">Taxable Income (est.)</span>
                <span className="font-mono text-sm text-slate-700">{fmt(selectedSalary.gross_salary - selectedSalary.basic_salary * 0.055)}</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Individual Pay Dialog */}
      <Dialog open={payOpen} onOpenChange={setPayOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                <CreditCard className="w-4 h-4 text-emerald-600" />
              </div>
              Record Individual Salary
            </DialogTitle>
            <DialogDescription>Manually record salary for a specific employee</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label className="text-xs font-medium">Employee <span className="text-red-500">*</span></Label>
              <Select
                value={payForm.employee_code}
                onValueChange={v => {
                  const emp = employees.find(e => e.emp_id === v);
                  setPayForm({ ...payForm, employee_code: v, basic_salary: emp?.salary.toString() || '' });
                }}
              >
                <SelectTrigger className="min-h-[44px]"><SelectValue placeholder="Select employee" /></SelectTrigger>
                <SelectContent className="max-h-48">
                  {employees.filter(e => e.active_status === 1).map(e => (
                    <SelectItem key={e.emp_id} value={e.emp_id}>{e.name} ({e.emp_id})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label className="text-xs font-medium">Month</Label>
                <Select value={payForm.month} onValueChange={v => setPayForm({ ...payForm, month: v })}>
                  <SelectTrigger className="min-h-[44px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {MONTHS.map((m, i) => <SelectItem key={i} value={(i + 1).toString()}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label className="text-xs font-medium">Year</Label>
                <Select value={payForm.year} onValueChange={v => setPayForm({ ...payForm, year: v })}>
                  <SelectTrigger className="min-h-[44px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label className="text-xs font-medium">Basic <span className="text-red-500">*</span></Label>
                <Input type="number" value={payForm.basic_salary} onChange={e => setPayForm({ ...payForm, basic_salary: e.target.value })} placeholder="0.00" className="min-h-[44px]" />
              </div>
              <div className="grid gap-2">
                <Label className="text-xs font-medium">Allowance</Label>
                <Input type="number" value={payForm.allowance} onChange={e => setPayForm({ ...payForm, allowance: e.target.value })} placeholder="0.00" className="min-h-[44px]" />
              </div>
              <div className="grid gap-2">
                <Label className="text-xs font-medium">Deduction</Label>
                <Input type="number" value={payForm.deduction} onChange={e => setPayForm({ ...payForm, deduction: e.target.value })} placeholder="0.00" className="min-h-[44px]" />
              </div>
            </div>
            {payForm.basic_salary && (
              <div className="bg-slate-50 rounded-lg p-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Gross Salary</span>
                  <span className="font-mono font-bold">{fmt(parseFloat(payForm.basic_salary || '0') + parseFloat(payForm.allowance || '0'))}</span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-slate-500">Net Salary</span>
                  <span className="font-mono font-bold text-emerald-700">
                    {fmt(parseFloat(payForm.basic_salary || '0') + parseFloat(payForm.allowance || '0') - parseFloat(payForm.deduction || '0'))}
                  </span>
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setPayOpen(false)} className="min-h-[44px]">Cancel</Button>
            <Button onClick={handleIndividualPay} disabled={paySaving || !payForm.employee_code || !payForm.basic_salary} className="bg-emerald-600 hover:bg-emerald-700 min-h-[44px]">
              {paySaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              {paySaving ? 'Saving...' : 'Record Salary'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
