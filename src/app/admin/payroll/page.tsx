'use client';

import { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { toast } from 'sonner';
import {
  Banknote, DollarSign, CheckCircle, Clock, Users, CalendarDays,
  AlertCircle, RefreshCw, Loader2, TrendingUp, CreditCard, Shield,
  ArrowUpRight, X, ChevronRight, FileText, UserCheck, Landmark,
  Calculator, Percent,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from '@/components/ui/dialog';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Employee {
  id: number; emp_id: string; name: string; salary: number; active_status: number;
  department: { dep_name: string } | null;
  designation: { des_name: string } | null;
  account_number?: string;
}

interface Salary {
  pay_id: number; employee_code: string; month: string; year: string;
  basic_salary: number; gross_salary: number; net_salary: number;
  total_allowances: number; total_deductions: number; status: string;
  reference?: string;
  employee: Employee | null;
}

interface PayrollForm {
  basicSalary: string;
  marketPremium: string;
  teachingAllowance: string;
  responsibilityAllowance: string;
  extraClasses: string;
  ruralAllowance: string;
  otherAllowances: string;
  ssnit: string;
  incomeTax: string;
  petra: string;
  getfund: string;
  salaryAdvance: string;
  nhil: string;
  welfare: string;
  gnat: string;
  loans: string;
  otherDeductions: string;
  workingDays: string;
  daysPresent: string;
}

function fmt(n: number) {
  return `GH\u20B5 ${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// ─── Skeleton Components ─────────────────────────────────────────────────────

function StatCardSkeleton() {
  return (
    <div className="rounded-2xl border border-slate-200/60 bg-white p-4 flex items-center gap-3">
      <Skeleton className="w-11 h-11 rounded-xl flex-shrink-0" />
      <div className="space-y-2 flex-1 min-w-0">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-6 w-16" />
      </div>
    </div>
  );
}

function PageSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <Skeleton className="h-8 w-56" />
      <Skeleton className="h-3 w-72" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Skeleton className="h-[600px] rounded-2xl" />
        <Skeleton className="h-[600px] rounded-2xl lg:col-span-2" />
      </div>
    </div>
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
  const [successOpen, setSuccessOpen] = useState(false);

  // Payroll form (CI3 parity)
  const [payrollForm, setPayrollForm] = useState<PayrollForm>({
    basicSalary: '',
    marketPremium: '',
    teachingAllowance: '',
    responsibilityAllowance: '',
    extraClasses: '',
    ruralAllowance: '',
    otherAllowances: '',
    ssnit: '',
    incomeTax: '',
    petra: '',
    getfund: '',
    salaryAdvance: '',
    nhil: '',
    welfare: '',
    gnat: '',
    loans: '',
    otherDeductions: '',
    workingDays: '22',
    daysPresent: '22',
  });

  // Selected staff IDs (multi-select)
  const [selectedStaff, setSelectedStaff] = useState<string[]>([]);

  // Summary values
  const [summary, setSummary] = useState({
    basic: 0, totalAllowances: 0, gross: 0,
    statutoryDeductions: 0, otherDeductions: 0, totalDeductions: 0, net: 0,
  });

  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];

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

  // ─── Payroll Calculation Logic (CI3 Parity) ────────────────────────────────

  const calculatePayroll = useCallback(() => {
    const pf = (key: keyof PayrollForm) => parseFloat(payrollForm[key]) || 0;

    // Attendance ratio
    const workingDays = pf('workingDays') || 22;
    const daysPresent = Math.min(pf('daysPresent'), workingDays);
    const attendanceRatio = workingDays > 0 ? daysPresent / workingDays : 1;

    // Allowances
    const basicSalary = pf('basicSalary');
    const adjustedBasic = basicSalary * attendanceRatio;
    const totalAllowances = pf('marketPremium') + pf('teachingAllowance') +
      pf('responsibilityAllowance') + pf('extraClasses') + pf('ruralAllowance') +
      pf('otherAllowances');
    const grossSalary = adjustedBasic + totalAllowances;

    // Deductions
    const incomeTax = pf('incomeTax');
    const petra = pf('petra');
    const getfund = pf('getfund');
    const nhil = pf('nhil');
    const statutoryDeductions = incomeTax + petra + getfund + nhil;
    const ssnit = pf('ssnit');
    const gnat = pf('gnat');
    const loans = pf('loans');
    const welfare = pf('welfare');
    const advance = pf('salaryAdvance');
    const otherDeductions = pf('otherDeductions');
    const otherDeds = gnat + loans + welfare + advance + otherDeductions;
    const totalDeductions = ssnit + statutoryDeductions + otherDeds;
    const netSalary = grossSalary - totalDeductions;

    setSummary({
      basic: adjustedBasic,
      totalAllowances,
      gross: grossSalary,
      statutoryDeductions,
      otherDeductions: ssnit + otherDeds,
      totalDeductions,
      net: netSalary,
    });
  }, [payrollForm]);

  const autoCalculateDeductions = useCallback(() => {
    const pf = (key: keyof PayrollForm) => parseFloat(payrollForm[key]) || 0;
    const grossBeforeDeductions = pf('basicSalary') + pf('marketPremium') +
      pf('teachingAllowance') + pf('responsibilityAllowance') + pf('ruralAllowance') +
      pf('extraClasses') + pf('otherAllowances');

    // Ghana statutory rates
    const ssnitRate = 0.135;
    const tier2Rate = 0.05;

    setPayrollForm(prev => ({
      ...prev,
      ssnit: (grossBeforeDeductions * ssnitRate).toFixed(2),
      petra: (grossBeforeDeductions * tier2Rate).toFixed(2),
      getfund: '0.00',
      nhil: '0.00',
      incomeTax: '0.00',
    }));

    // Will recalculate after state update via useEffect
    setTimeout(() => {
      setPayrollForm(prev => {
        const pf2 = (key: keyof PayrollForm) => parseFloat(prev[key]) || 0;
        const grossBD = pf2('basicSalary') + pf2('marketPremium') +
          pf2('teachingAllowance') + pf2('responsibilityAllowance') + pf2('ruralAllowance') +
          pf2('extraClasses') + pf2('otherAllowances');
        return {
          ...prev,
          ssnit: (grossBD * ssnitRate).toFixed(2),
          petra: (grossBD * tier2Rate).toFixed(2),
        };
      });
    }, 50);
  }, [payrollForm]);

  // Recalculate on form change
  useEffect(() => {
    calculatePayroll();
  }, [calculatePayroll]);

  // Auto-calculate days absent
  useEffect(() => {
    const workingDays = parseInt(payrollForm.workingDays) || 22;
    const daysPresent = parseInt(payrollForm.daysPresent) || 22;
    // Days absent is derived
  }, [payrollForm.workingDays, payrollForm.daysPresent]);

  // ─── Handlers ──────────────────────────────────────────────────────────────

  const handleProcessPayment = async () => {
    if (selectedStaff.length === 0) {
      toast.error('No staff selected. Please select at least one staff member.');
      return;
    }
    setProcessing(true);
    try {
      const basic = parseFloat(payrollForm.basicSalary) || 0;
      const res = await fetch('/api/payroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employee_code: selectedStaff[0],
          month: selectedMonth,
          year: selectedYear,
          basic_salary: summary.basic,
          gross_salary: summary.gross,
          net_salary: summary.net,
          total_allowances: summary.totalAllowances,
          total_deductions: summary.totalDeductions,
        }),
      });
      if (!res.ok) throw new Error();
      setSuccessOpen(true);
      fetchData();
    } catch {
      toast.error('Payment processing failed');
    }
    setProcessing(false);
  };

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

  // ─── Render ────────────────────────────────────────────────────────────────

  if (loading && salaries.length === 0) {
    return (
      <DashboardLayout>
        <PageSkeleton />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="flex items-center justify-center mb-3">
            <div className="w-10 h-6 bg-red-600 rounded mr-1.5" />
            <div className="w-10 h-6 bg-yellow-400 rounded mr-1.5" />
            <div className="w-10 h-6 bg-emerald-600 rounded" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Staffs Payroll System</h1>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-white border border-slate-200 p-1 rounded-xl h-auto flex w-full sm:w-auto">
            <TabsTrigger value="payroll" className="flex-1 min-w-[90px] data-[state=active]:bg-emerald-600 data-[state=active]:text-white rounded-lg py-2 text-sm">
              <Banknote className="w-4 h-4 mr-1.5 hidden sm:inline" /> Monthly Payroll
            </TabsTrigger>
            <TabsTrigger value="records" className="flex-1 min-w-[90px] data-[state=active]:bg-emerald-600 data-[state=active]:text-white rounded-lg py-2 text-sm">
              <FileText className="w-4 h-4 mr-1.5 hidden sm:inline" /> Payroll Records
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex-1 min-w-[90px] data-[state=active]:bg-emerald-600 data-[state=active]:text-white rounded-lg py-2 text-sm">
              <TrendingUp className="w-4 h-4 mr-1.5 hidden sm:inline" /> Reports
            </TabsTrigger>
          </TabsList>

          {/* ═══ Monthly Payroll Tab (CI3 Parity) ═══ */}
          <TabsContent value="payroll">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* ─── Left Column: Staff Info + Quick Stats ─── */}
              <div className="space-y-6 h-fit lg:max-h-[85vh] lg:overflow-y-auto">
                {/* Staff Information */}
                <Card className="border-slate-200/60">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <UserCheck className="w-5 h-5 text-emerald-600" />
                      Staff Information
                    </h3>
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium">Staff ID</Label>
                        <Select
                          value={selectedStaff.length > 0 ? selectedStaff[selectedStaff.length - 1] : ''}
                          onValueChange={(v) => {
                            setSelectedStaff(prev => [...prev, v]);
                          }}
                        >
                          <SelectTrigger className="min-h-[44px]">
                            <SelectValue placeholder="Select staff..." />
                          </SelectTrigger>
                          <SelectContent className="max-h-60">
                            {/* Admins group */}
                            {employees.filter(e => e.emp_id.startsWith('ADM') || e.designation?.des_name?.toLowerCase().includes('admin')).length > 0 && (
                              <div className="px-2 py-1.5 text-xs font-semibold text-slate-400 bg-slate-50">
                                Administrators
                              </div>
                            )}
                            {employees.filter(e => e.emp_id.startsWith('ADM') || e.designation?.des_name?.toLowerCase().includes('admin')).map(e => (
                              <SelectItem key={e.emp_id} value={e.emp_id}>
                                {e.emp_id} / {e.name}
                              </SelectItem>
                            ))}
                            {/* Teachers group */}
                            {employees.filter(e => e.emp_id.startsWith('TCH') || e.designation?.des_name?.toLowerCase().includes('teacher')).length > 0 && (
                              <div className="px-2 py-1.5 text-xs font-semibold text-slate-400 bg-slate-50 mt-1">
                                Teachers
                              </div>
                            )}
                            {employees.filter(e => e.emp_id.startsWith('TCH') || e.designation?.des_name?.toLowerCase().includes('teacher')).map(e => (
                              <SelectItem key={e.emp_id} value={e.emp_id}>
                                {e.emp_id} / {e.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Selected staff badges */}
                      {selectedStaff.length > 0 && (
                        <div className="space-y-2">
                          <Label className="text-xs font-medium">Selected Staff ({selectedStaff.length})</Label>
                          <div className="flex flex-wrap gap-1.5">
                            {selectedStaff.map(id => {
                              const emp = employees.find(e => e.emp_id === id);
                              return (
                                <Badge key={id} variant="outline" className="text-xs gap-1 bg-emerald-50 border-emerald-200 text-emerald-700">
                                  {emp?.name || id}
                                  <button onClick={() => setSelectedStaff(prev => prev.filter(s => s !== id))}>
                                    <X className="w-3 h-3" />
                                  </button>
                                </Badge>
                              );
                            })}
                            {selectedStaff.length > 0 && (
                              <button
                                onClick={() => setSelectedStaff([])}
                                className="text-xs text-red-500 hover:text-red-600"
                              >
                                Clear all
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Stats */}
                <Card className="border-slate-200/60">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Calculator className="w-5 h-5 text-emerald-600" />
                      Quick Stats
                    </h3>
                    <div className="space-y-4">
                      <div className="bg-emerald-50 p-3 rounded-lg">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-emerald-800">Net Salary</span>
                          <span className="font-bold text-emerald-800">{fmt(summary.net)}</span>
                        </div>
                      </div>
                      <div className="bg-sky-50 p-3 rounded-lg">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-sky-800">Gross Salary</span>
                          <span className="font-bold text-sky-800">{fmt(summary.gross)}</span>
                        </div>
                      </div>
                      <div className="bg-red-50 p-3 rounded-lg">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-red-800">Total Deductions</span>
                          <span className="font-bold text-red-800">{fmt(summary.totalDeductions)}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* ─── Right Column: Payroll Form (CI3 Parity) ─── */}
              <div className="lg:col-span-2 h-fit lg:max-h-[85vh] lg:overflow-y-auto">
                <Card className="border-slate-200/60">
                  <CardContent className="p-6">
                    {/* Month selector */}
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Monthly Payroll — <span id="currentMonth">{months[parseInt(selectedMonth) - 1]} {selectedYear}</span>
                      </h3>
                      <div className="flex items-center gap-2">
                        <CalendarDays className="w-4 h-4 text-slate-400" />
                        <Input
                          type="month"
                          value={`${selectedYear}-${selectedMonth.padStart(2, '0')}`}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val) {
                              const [y, m] = val.split('-');
                              setSelectedYear(y);
                              setSelectedMonth(parseInt(m).toString());
                            }
                          }}
                          className="w-auto min-h-[44px]"
                        />
                      </div>
                    </div>

                    {/* ═══ Basic Salary & Allowances (CI3 Parity) ═══ */}
                    <div className="border border-emerald-200 rounded-lg p-4 mb-6">
                      <h4 className="text-md font-semibold text-emerald-700 mb-4 flex items-center gap-2">
                        <DollarSign className="w-4 h-4" />
                        Basic Salary &amp; Allowances
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium">Basic Salary (GH₵)</Label>
                          <Input type="number" step="0.01" placeholder="2500.00"
                            value={payrollForm.basicSalary}
                            onChange={e => setPayrollForm(p => ({ ...p, basicSalary: e.target.value }))}
                            className="min-h-[44px]" />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium">Market Premium (GH₵)</Label>
                          <Input type="number" step="0.01" placeholder="300.00"
                            value={payrollForm.marketPremium}
                            onChange={e => setPayrollForm(p => ({ ...p, marketPremium: e.target.value }))}
                            className="min-h-[44px]" />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium">Teaching Allowance (GH₵)</Label>
                          <Input type="number" step="0.01" placeholder="200.00"
                            value={payrollForm.teachingAllowance}
                            onChange={e => setPayrollForm(p => ({ ...p, teachingAllowance: e.target.value }))}
                            className="min-h-[44px]" />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium">Responsibility Allowance (GH₵)</Label>
                          <Input type="number" step="0.01" placeholder="150.00"
                            value={payrollForm.responsibilityAllowance}
                            onChange={e => setPayrollForm(p => ({ ...p, responsibilityAllowance: e.target.value }))}
                            className="min-h-[44px]" />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium">Extra Classes (GH₵)</Label>
                          <Input type="number" step="0.01" placeholder="0.00"
                            value={payrollForm.extraClasses}
                            onChange={e => setPayrollForm(p => ({ ...p, extraClasses: e.target.value }))}
                            className="min-h-[44px]" />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium">Rural Allowance (GH₵)</Label>
                          <Input type="number" step="0.01" placeholder="0.00"
                            value={payrollForm.ruralAllowance}
                            onChange={e => setPayrollForm(p => ({ ...p, ruralAllowance: e.target.value }))}
                            className="min-h-[44px]" />
                        </div>
                        <div className="space-y-1.5 md:col-start-2">
                          <Label className="text-xs font-medium">Other Allowance (GH₵)</Label>
                          <Input type="number" step="0.01" placeholder="0.00"
                            value={payrollForm.otherAllowances}
                            onChange={e => setPayrollForm(p => ({ ...p, otherAllowances: e.target.value }))}
                            className="min-h-[44px]" />
                        </div>
                      </div>
                    </div>

                    {/* ═══ Deductions (CI3 Parity) ═══ */}
                    <div className="border border-red-200 rounded-lg p-4 mb-6">
                      <h4 className="text-md font-semibold text-red-700 mb-4 flex items-center gap-2">
                        <Percent className="w-4 h-4" />
                        Deductions
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium">SSNIT (13.5%) (GH₵) — Tier 1</Label>
                          <Input type="number" step="0.01" placeholder="0.00"
                            value={payrollForm.ssnit}
                            onChange={e => setPayrollForm(p => ({ ...p, ssnit: e.target.value }))}
                            className="min-h-[44px]" />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium">Income Tax — PAYE (GH₵)</Label>
                          <Input type="number" step="0.01" placeholder="0.00"
                            value={payrollForm.incomeTax}
                            onChange={e => setPayrollForm(p => ({ ...p, incomeTax: e.target.value }))}
                            className="min-h-[44px]" />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium">PETRA (5%) (GH₵) — Tier 2</Label>
                          <Input type="number" step="0.01" placeholder="50.00"
                            value={payrollForm.petra}
                            onChange={e => setPayrollForm(p => ({ ...p, petra: e.target.value }))}
                            className="min-h-[44px]" />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium">GETFund (2.5%) (GH₵)</Label>
                          <Input type="number" step="0.01" placeholder="0.00"
                            value={payrollForm.getfund}
                            onChange={e => setPayrollForm(p => ({ ...p, getfund: e.target.value }))}
                            className="min-h-[44px]" />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium">Salary Advance (GH₵)</Label>
                          <Input type="number" step="0.01" placeholder="0.00"
                            value={payrollForm.salaryAdvance}
                            onChange={e => setPayrollForm(p => ({ ...p, salaryAdvance: e.target.value }))}
                            className="min-h-[44px]" />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium">NHIL (2.5%) (GH₵)</Label>
                          <Input type="number" step="0.01" placeholder="0.00"
                            value={payrollForm.nhil}
                            onChange={e => setPayrollForm(p => ({ ...p, nhil: e.target.value }))}
                            className="min-h-[44px]" />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium">Welfare Deductions (GH₵)</Label>
                          <Input type="number" step="0.01" placeholder="0.00"
                            value={payrollForm.welfare}
                            onChange={e => setPayrollForm(p => ({ ...p, welfare: e.target.value }))}
                            className="min-h-[44px]" />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium">GNAT Dues (GH₵)</Label>
                          <Input type="number" step="0.01" placeholder="10.00"
                            value={payrollForm.gnat}
                            onChange={e => setPayrollForm(p => ({ ...p, gnat: e.target.value }))}
                            className="min-h-[44px]" />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium">Loan Deductions (GH₵)</Label>
                          <Input type="number" step="0.01" placeholder="0.00"
                            value={payrollForm.loans}
                            onChange={e => setPayrollForm(p => ({ ...p, loans: e.target.value }))}
                            className="min-h-[44px]" />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium">Other Deductions (GH₵)</Label>
                          <Input type="number" step="0.01" placeholder="0.00"
                            value={payrollForm.otherDeductions}
                            onChange={e => setPayrollForm(p => ({ ...p, otherDeductions: e.target.value }))}
                            className="min-h-[44px]" />
                        </div>
                      </div>
                    </div>

                    {/* ═══ Attendance Information (CI3 Parity) ═══ */}
                    <div className="border border-sky-200 rounded-lg p-4 mb-6">
                      <h4 className="text-md font-semibold text-sky-700 mb-4 flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Attendance Information
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium">Working Days</Label>
                          <Input type="number" min="1" max="31"
                            value={payrollForm.workingDays}
                            onChange={e => {
                              const wd = parseInt(e.target.value) || 22;
                              const dp = parseInt(payrollForm.daysPresent) || 22;
                              setPayrollForm(p => ({
                                ...p,
                                workingDays: String(wd),
                                daysPresent: String(Math.min(dp, wd)),
                              }));
                            }}
                            className="min-h-[44px]" />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium">Days Present</Label>
                          <Input type="number" min="0" max="31"
                            value={payrollForm.daysPresent}
                            onChange={e => {
                              const wd = parseInt(payrollForm.workingDays) || 22;
                              const dp = Math.min(parseInt(e.target.value) || 0, wd);
                              setPayrollForm(p => ({ ...p, daysPresent: String(dp) }));
                            }}
                            className="min-h-[44px]" />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium">Days Absent</Label>
                          <Input type="number" min="0" max="31" readOnly
                            value={String(Math.max(0, (parseInt(payrollForm.workingDays) || 22) - (parseInt(payrollForm.daysPresent) || 22)))}
                            className="min-h-[44px] bg-slate-50" />
                        </div>
                      </div>
                    </div>

                    {/* ═══ Payroll Summary (CI3 Parity) ═══ */}
                    <div className="bg-slate-50 p-6 rounded-lg mb-6">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">Payroll Summary</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Basic Salary:</span>
                            <span className="text-sm font-medium">{fmt(summary.basic)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Total Allowances:</span>
                            <span className="text-sm font-medium text-emerald-600">{fmt(summary.totalAllowances)}</span>
                          </div>
                          <div className="flex justify-between border-t pt-2">
                            <span className="text-sm font-medium text-gray-900">Gross Salary:</span>
                            <span className="text-sm font-bold text-sky-600">{fmt(summary.gross)}</span>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Statutory Deductions:</span>
                            <span className="text-sm font-medium text-red-600">{fmt(summary.statutoryDeductions)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Other Deductions:</span>
                            <span className="text-sm font-medium text-red-600">{fmt(summary.otherDeductions)}</span>
                          </div>
                          <div className="flex justify-between border-t pt-2">
                            <span className="text-sm font-medium text-gray-900">Net Salary:</span>
                            <span className="text-lg font-bold text-emerald-600">{fmt(summary.net)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* ═══ Action Buttons (CI3 Parity) ═══ */}
                    <div className="flex flex-col sm:flex-row gap-3 sticky bottom-0 bg-white pt-6 pb-2 z-50">
                      <Button variant="outline" className="flex-1 min-h-[56px] border-sky-200 text-sky-700 hover:bg-sky-50"
                        onClick={() => calculatePayroll()}>
                        <Calculator className="w-4 h-4 mr-2" />
                        Calculate Payroll
                      </Button>
                      <Button variant="outline" className="flex-1 min-h-[56px] border-red-200 text-red-700 hover:bg-red-50"
                        onClick={autoCalculateDeductions}>
                        <Landmark className="w-4 h-4 mr-2" />
                        Auto Calculate Deductions
                      </Button>
                      <Button className="flex-1 min-h-[56px] bg-emerald-600 hover:bg-emerald-700"
                        onClick={handleProcessPayment} disabled={processing}>
                        {processing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CreditCard className="w-4 h-4 mr-2" />}
                        Process Payment
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* ═══ Payroll Records Tab ═══ */}
          <TabsContent value="records">
            {/* Error State */}
            {error && (
              <div className="rounded-2xl border border-red-200 p-8 flex flex-col items-center text-center gap-3 mb-4">
                <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center">
                  <AlertCircle className="w-7 h-7 text-red-500" />
                </div>
                <p className="font-medium text-slate-900">{error}</p>
                <Button variant="outline" onClick={fetchData} className="mt-1 border-emerald-200 text-emerald-700 hover:bg-emerald-50 min-h-[44px]">
                  <RefreshCw className="w-4 h-4 mr-2" /> Retry
                </Button>
              </div>
            )}

            {/* Filter Bar */}
            <div className="rounded-2xl bg-white border border-slate-200/60 p-4 mb-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                  <CalendarDays className="w-5 h-5 text-slate-500" />
                  <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                    <SelectTrigger className="w-[150px] min-h-[44px] bg-slate-50 border-slate-200 focus:bg-white"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {months.map((m, i) => <SelectItem key={i} value={(i + 1).toString()}>{m}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Select value={selectedYear} onValueChange={setSelectedYear}>
                    <SelectTrigger className="w-[100px] min-h-[44px] bg-slate-50 border-slate-200 focus:bg-white"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-[140px] min-h-[44px] bg-slate-50 border-slate-200 focus:bg-white"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">All Status</SelectItem>
                      <SelectItem value="processed">Processed</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="sm:ml-auto flex gap-2 w-full sm:w-auto">
                  <Button onClick={handleBulkProcess} className="bg-emerald-600 hover:bg-emerald-700 min-h-[44px] shadow-sm" disabled={processing}>
                    {processing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Banknote className="w-4 h-4 mr-2" />}
                    Process All Payroll
                  </Button>
                </div>
              </div>
            </div>

            {/* Payroll Data */}
            {salaries.length === 0 ? (
              <div className="rounded-2xl border border-slate-200/60 py-16 flex flex-col items-center">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
                  <Banknote className="w-8 h-8 text-slate-300" />
                </div>
                <div className="text-center">
                  <p className="text-slate-500 font-medium">No payroll records</p>
                  <p className="text-sm text-slate-400 mt-1">
                    {filterStatus !== 'all' ? 'Try changing the status filter' : `No records for ${months[parseInt(selectedMonth) - 1]} ${selectedYear}`}
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="rounded-2xl bg-white border border-slate-200/60 overflow-hidden hidden md:block">
                  <div className="max-h-[600px] overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50 hover:bg-slate-50">
                          <TableHead className="text-xs font-semibold text-slate-600">Employee</TableHead>
                          <TableHead className="text-xs font-semibold text-slate-600 text-right">Basic</TableHead>
                          <TableHead className="text-xs font-semibold text-slate-600 text-right">Allowances</TableHead>
                          <TableHead className="text-xs font-semibold text-slate-600 text-right">Gross</TableHead>
                          <TableHead className="text-xs font-semibold text-slate-600 text-right">Deductions</TableHead>
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
                            <TableCell className="text-right text-sm">{fmt(sal.basic_salary)}</TableCell>
                            <TableCell className="text-right text-sm text-emerald-600">{fmt(sal.total_allowances || 0)}</TableCell>
                            <TableCell className="text-right text-sm">{fmt(sal.gross_salary)}</TableCell>
                            <TableCell className="text-right text-sm text-red-600">{fmt(sal.total_deductions || (sal.gross_salary - sal.net_salary))}</TableCell>
                            <TableCell className="text-right text-sm font-semibold text-slate-900">{fmt(sal.net_salary)}</TableCell>
                            <TableCell>
                              <Badge className={`text-xs ${sal.status === 'processed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                {sal.status === 'processed' ? <CheckCircle className="w-3 h-3 mr-1" /> : <Clock className="w-3 h-3 mr-1" />}
                                {sal.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Button size="sm" variant="ghost" className="h-8 text-xs text-emerald-600 hover:bg-emerald-50 min-h-[36px] min-w-[32px]" onClick={() => { setSelectedSalary(sal); setPayslipOpen(true); }}>
                                View
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50/50">
                    <p className="text-xs text-slate-500">Showing {salaries.length} record(s)</p>
                    <p className="text-xs font-medium text-emerald-700">Net Total: {fmt(totalNet)}</p>
                  </div>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden space-y-3">
                  {salaries.map(sal => (
                    <div key={sal.pay_id} className="rounded-2xl border border-slate-200/60 hover:shadow-sm transition-shadow p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0 ${sal.status === 'processed' ? 'bg-emerald-500' : 'bg-amber-500'}`}>
                            {sal.employee?.name?.charAt(0) || sal.employee_code.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-sm text-slate-900 truncate">{sal.employee?.name || sal.employee_code}</p>
                            <p className="text-xs text-slate-500">{sal.employee?.department?.dep_name || ''}</p>
                          </div>
                        </div>
                        <Badge className={`text-[10px] flex-shrink-0 ${sal.status === 'processed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                          {sal.status}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-slate-50 rounded-lg p-2.5 text-center">
                          <p className="text-[10px] text-slate-500">Basic</p>
                          <p className="text-xs font-bold text-slate-900">{fmt(sal.basic_salary)}</p>
                        </div>
                        <div className="bg-emerald-50 rounded-lg p-2.5 text-center">
                          <p className="text-[10px] text-emerald-600">Net</p>
                          <p className="text-xs font-bold text-emerald-700">{fmt(sal.net_salary)}</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" className="w-full mt-3 h-10 text-xs min-h-[44px]"
                        onClick={() => { setSelectedSalary(sal); setPayslipOpen(true); }}>
                        View Payslip
                      </Button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </TabsContent>

          {/* ═══ Reports Tab ═══ */}
          <TabsContent value="reports">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Summary Card */}
              <div className="rounded-2xl border border-slate-200/60 p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                  </div>
                  <h3 className="font-semibold text-slate-900">
                    Summary — {months[parseInt(selectedMonth) - 1]} {selectedYear}
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
                </div>
              </div>

              {/* Top Salaries Card */}
              <div className="rounded-2xl border border-slate-200/60 p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center">
                    <ArrowUpRight className="w-4 h-4 text-violet-600" />
                  </div>
                  <h3 className="font-semibold text-slate-900">Top Salaries</h3>
                  <Badge variant="outline" className="text-xs ml-auto border-slate-200">Processed only</Badge>
                </div>
                <div className="space-y-1.5 max-h-[360px] overflow-y-auto">
                  {salaries.filter(s => s.status === 'processed').sort((a, b) => b.net_salary - a.net_salary).slice(0, 10).length === 0 ? (
                    <div className="text-center py-8 text-slate-400">
                      <Shield className="w-7 h-7 text-slate-300 mx-auto mb-2" />
                      <p className="text-sm">No processed salaries</p>
                    </div>
                  ) : (
                    salaries.filter(s => s.status === 'processed').sort((a, b) => b.net_salary - a.net_salary).slice(0, 10).map((s, i) => (
                      <div key={s.pay_id} className="flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-3">
                          <span className={`text-xs font-bold w-5 text-center ${i < 3 ? 'text-emerald-600' : 'text-slate-400'}`}>{i + 1}</span>
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
              </div>
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
                <p className="text-xs text-emerald-500">{months[parseInt(selectedSalary.month) - 1]} {selectedSalary.year}</p>
                {selectedSalary.employee?.department && (
                  <p className="text-xs text-slate-500 mt-1">{selectedSalary.employee.department.dep_name}</p>
                )}
              </div>
              <div className="space-y-2">
                {[
                  { label: 'Basic Salary', value: selectedSalary.basic_salary },
                  { label: 'Total Allowances', value: selectedSalary.total_allowances || 0 },
                  { label: 'Gross Salary', value: selectedSalary.gross_salary },
                  { label: 'Total Deductions', value: selectedSalary.total_deductions || (selectedSalary.gross_salary - selectedSalary.net_salary) },
                  { label: 'Net Salary (Take Home)', value: selectedSalary.net_salary, highlight: true },
                ].map(({ label, value, highlight }) => (
                  <div key={label} className={`flex justify-between items-center p-3 rounded-lg ${highlight ? 'bg-emerald-50 border border-emerald-100' : 'bg-slate-50'}`}>
                    <span className={`text-sm ${highlight ? 'font-medium text-emerald-700' : 'text-slate-600'}`}>{label}</span>
                    <span className={`font-mono font-bold ${highlight ? 'text-emerald-700 text-lg' : 'text-slate-900'}`}>{fmt(value)}</span>
                  </div>
                ))}
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500">Status</span>
                <Badge className={`text-xs ${selectedSalary.status === 'processed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                  {selectedSalary.status}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500">SSNIT Contribution (13.5%)</span>
                <span className="font-mono text-sm text-slate-700">{fmt(selectedSalary.basic_salary * 0.135)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500">Taxable Income (est.)</span>
                <span className="font-mono text-sm text-slate-700">{fmt(selectedSalary.gross_salary - selectedSalary.basic_salary * 0.135)}</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Success Modal (CI3 Parity) */}
      <Dialog open={successOpen} onOpenChange={setSuccessOpen}>
        <DialogContent className="max-w-sm">
          <div className="text-center py-4 space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-100 p-3 mx-auto flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-emerald-500" />
            </div>
            <div>
              <p className="text-lg font-semibold text-gray-900">Payment Processed Successfully!</p>
              <p className="text-sm text-gray-500 mt-1">The staff&apos;s salary has been processed and will be paid to their account.</p>
            </div>
            <Button onClick={() => { setSuccessOpen(false); fetchData(); }} className="bg-emerald-600 hover:bg-emerald-700 min-h-[44px]">
              Continue
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
