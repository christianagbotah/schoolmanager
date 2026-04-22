'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  FileText, Download, Printer, Calculator, Calendar, Filter,
  Send, CheckCircle, AlertCircle, Users, Shield, ArrowLeft, Building2,
} from 'lucide-react';

interface SSNITRow {
  employeeId: number;
  empId: string;
  name: string;
  department: string;
  departmentId: number | null;
  designation: string;
  basicSalary: number;
  grossSalary: number;
  employeeContribution: number;
  employerContribution: number;
  totalContribution: number;
  ssnitNumber: string;
  ssnitTier: string;
  payrollStatus: string;
}

interface SSNITSummary {
  totalEmployees: number;
  totalGrossSalary: number;
  totalEmployeeDeduction: number;
  totalEmployerContribution: number;
  totalSSNIT: number;
}

interface Department {
  id: number;
  dep_name: string;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function fmt(n: number) {
  return `GHS ${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function SSNITPage() {
  const router = useRouter();
  const printRef = useRef<HTMLDivElement>(null);

  const [employees, setEmployees] = useState<SSNITRow[]>([]);
  const [summary, setSummary] = useState<SSNITSummary | null>(null);
  const [filingStatus, setFilingStatus] = useState<string>('draft');
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [selectedMonth, setSelectedMonth] = useState(String(new Date().getMonth() + 1));
  const [selectedYear, setSelectedYear] = useState(String(new Date().getFullYear()));
  const [filterDept, setFilterDept] = useState('all');
  const [filterType, setFilterType] = useState('all');

  const [confirmSubmitOpen, setConfirmSubmitOpen] = useState(false);

  // Fetch departments
  useEffect(() => {
    fetch('/api/departments')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setDepartments(data);
      })
      .catch(() => {});
  }, []);

  // Generate report
  const generateReport = useCallback(async () => {
    setGenerating(true);
    setLoading(true);
    try {
      const params = new URLSearchParams({
        month: selectedMonth,
        year: selectedYear,
      });
      if (filterDept !== 'all') params.set('departmentId', filterDept);
      if (filterType !== 'all') params.set('employmentType', filterType);

      const res = await fetch(`/api/admin/payroll/ssnit?${params}`);
      if (!res.ok) throw new Error('Failed to generate report');
      const data = await res.json();
      setEmployees(data.employees || []);
      setSummary(data.summary || null);
      setFilingStatus(data.filingStatus || 'draft');
    } catch {
      toast.error('Failed to generate SSNIT report');
    }
    setLoading(false);
    setGenerating(false);
  }, [selectedMonth, selectedYear, filterDept, filterType]);

  // Auto-generate on mount
  useEffect(() => {
    generateReport();
  }, []);

  const handleSubmitToSSNIT = async () => {
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/payroll/ssnit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          month: selectedMonth,
          year: selectedYear,
          filingStatus: 'filed',
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to submit');
      }
      toast.success('SSNIT filing submitted successfully');
      setFilingStatus('filed');
      setConfirmSubmitOpen(false);
      generateReport();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to submit SSNIT filing');
    }
    setSubmitting(false);
  };

  const handleExportCSV = () => {
    if (employees.length === 0) {
      toast.error('No data to export');
      return;
    }
    const monthName = MONTHS[parseInt(selectedMonth) - 1] || selectedMonth;
    const header = 'Employee Name,Staff ID,Department,Basic Salary,SSNIT Tier,Employee 5.5%,Employer 8.0%,Total 13.5%,SSNIT Number';
    const rows = employees.map((e) =>
      [
        e.name,
        e.empId,
        e.department,
        e.basicSalary,
        e.ssnitTier,
        e.employeeContribution,
        e.employerContribution,
        e.totalContribution,
        e.ssnitNumber || 'N/A',
      ].join(',')
    );
    const totalsRow = [
      'TOTALS',
      '',
      `${summary?.totalEmployees || 0} employees`,
      summary?.totalGrossSalary || 0,
      '',
      summary?.totalEmployeeDeduction || 0,
      summary?.totalEmployerContribution || 0,
      summary?.totalSSNIT || 0,
      '',
    ].join(',');
    const blob = new Blob([[header, ...rows, '', totalsRow].join('\n')], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ssnit_report_${monthName}_${selectedYear}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exported successfully');
  };

  const handleExportPDF = () => {
    const content = printRef.current;
    if (!content) {
      toast.error('No content to export');
      return;
    }
    const monthName = MONTHS[parseInt(selectedMonth) - 1] || selectedMonth;
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Please allow popups to export');
      return;
    }
    printWindow.document.write(`
      <!DOCTYPE html>
      <html><head><title>SSNIT Report - ${monthName} ${selectedYear}</title>
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 24px; color: #1e293b; }
        .header { text-align: center; border-bottom: 3px solid #0f172a; padding-bottom: 16px; margin-bottom: 24px; }
        .header h1 { font-size: 20px; margin: 0 0 4px; color: #0f172a; }
        .header p { font-size: 12px; color: #64748b; margin: 2px 0; }
        .summary-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; margin-bottom: 24px; }
        .summary-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; text-align: center; }
        .summary-card .label { font-size: 10px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
        .summary-card .value { font-size: 16px; font-weight: 700; margin-top: 4px; }
        table { width: 100%; border-collapse: collapse; font-size: 11px; }
        th { text-align: left; padding: 8px 10px; background: #f1f5f9; border-bottom: 2px solid #0f172a; color: #334155; font-weight: 600; font-size: 10px; text-transform: uppercase; }
        td { padding: 7px 10px; border-bottom: 1px solid #f1f5f9; }
        .totals-row { font-weight: 700; border-top: 2px solid #0f172a; background: #f8fafc; }
        .totals-row td { font-size: 12px; }
        .text-right { text-align: right; }
        .certification { margin-top: 48px; padding-top: 16px; border-top: 1px solid #e2e8f0; }
        .certification .sig-lines { display: flex; justify-content: space-between; margin-top: 60px; }
        .certification .sig-line { border-top: 1px solid #94a3b8; width: 200px; padding-top: 6px; font-size: 12px; color: #64748b; }
        .footer { margin-top: 24px; text-align: center; font-size: 10px; color: #94a3b8; }
        .status-badge { display: inline-block; padding: 2px 10px; border-radius: 9999px; font-size: 10px; font-weight: 600; }
        .status-draft { background: #fef3c7; color: #92400e; }
        .status-filed { background: #dbeafe; color: #1e40af; }
        .status-approved { background: #d1fae5; color: #065f46; }
        @media print { body { padding: 10px; } }
      </style></head><body>
      ${content.innerHTML}
      </body></html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 400);
  };

  const handlePrint = () => {
    handleExportPDF();
  };

  const years = [
    String(new Date().getFullYear()),
    String(new Date().getFullYear() - 1),
    String(new Date().getFullYear() - 2),
    String(new Date().getFullYear() - 3),
  ];

  const filingBadge = (status: string) => {
    const config: Record<string, { cls: string; label: string }> = {
      draft: { cls: 'bg-amber-100 text-amber-700', label: 'Draft' },
      filed: { cls: 'bg-sky-100 text-sky-700', label: 'Filed' },
      approved: { cls: 'bg-emerald-100 text-emerald-700', label: 'Approved' },
    };
    const c = config[status] || config.draft;
    return <Badge className={`${c.cls} text-xs font-semibold`}>{c.label}</Badge>;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="h-9 w-9 p-0"
              onClick={() => router.push('/admin/payroll')}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                  SSNIT Contributions Report
                </h1>
                {filingBadge(filingStatus)}
              </div>
              <p className="text-sm text-slate-500 mt-1">
                Social Security and National Insurance Trust — Monthly Filing
              </p>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant="outline"
              className="min-h-[44px] text-xs"
              onClick={() => router.push('/admin/payroll/ssnit/summary')}
            >
              <FileText className="w-4 h-4 mr-2" />
              Annual Summary
            </Button>
          </div>
        </div>

        {/* Period Selector & Actions */}
        <Card className="border-slate-200/60">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                <Calendar className="w-5 h-5 text-slate-500" />
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger className="w-[150px] min-h-[44px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTHS.map((m, i) => (
                      <SelectItem key={i} value={(i + 1).toString()}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger className="w-[110px] min-h-[44px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((y) => (
                      <SelectItem key={y} value={y}>
                        {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <Filter className="w-4 h-4 text-slate-400" />
                <Select value={filterDept} onValueChange={setFilterDept}>
                  <SelectTrigger className="w-[160px] min-h-[44px]">
                    <SelectValue placeholder="Department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    {departments.map((d) => (
                      <SelectItem key={d.id} value={String(d.id)}>
                        {d.dep_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-[140px] min-h-[44px]">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="fulltime">Full-time</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="sm:ml-auto flex gap-2 flex-wrap">
                <Button
                  className="bg-emerald-600 hover:bg-emerald-700 min-h-[44px]"
                  onClick={generateReport}
                  disabled={generating}
                >
                  {generating ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  ) : (
                    <Calculator className="w-4 h-4 mr-2" />
                  )}
                  Generate Report
                </Button>
                <Button
                  variant="outline"
                  className="min-h-[44px]"
                  onClick={handleExportCSV}
                  disabled={employees.length === 0}
                >
                  <Download className="w-4 h-4 mr-2" />
                  CSV
                </Button>
                <Button
                  variant="outline"
                  className="min-h-[44px]"
                  onClick={handleExportPDF}
                  disabled={employees.length === 0}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  PDF
                </Button>
                <Button
                  variant="outline"
                  className="min-h-[44px]"
                  onClick={handlePrint}
                  disabled={employees.length === 0}
                >
                  <Printer className="w-4 h-4 mr-2" />
                  Print
                </Button>
                {filingStatus === 'draft' && (
                  <Button
                    className="min-h-[44px] bg-amber-600 hover:bg-amber-700"
                    onClick={() => setConfirmSubmitOpen(true)}
                    disabled={employees.length === 0}
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Submit to SSNIT
                  </Button>
                )}
                {filingStatus === 'filed' && (
                  <Button
                    className="min-h-[44px] bg-emerald-600 hover:bg-emerald-700"
                    onClick={handleSubmitToSSNIT}
                    disabled={submitting}
                  >
                    {submitting ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                    ) : (
                      <CheckCircle className="w-4 h-4 mr-2" />
                    )}
                    Approve Filing
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <Card className="border-slate-200/60">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <Users className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Total Employees</p>
                    <p className="text-xl font-bold">{summary.totalEmployees}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-slate-200/60">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-sky-100 flex items-center justify-center">
                    <Calculator className="w-5 h-5 text-sky-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Total Gross Salary</p>
                    <p className="text-lg font-bold">{fmt(summary.totalGrossSalary)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-slate-200/60">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Total SSNIT (13.5%)</p>
                    <p className="text-lg font-bold text-amber-700">{fmt(summary.totalSSNIT)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-slate-200/60">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-rose-100 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-rose-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Employer (8.0%)</p>
                    <p className="text-lg font-bold text-rose-700">
                      {fmt(summary.totalEmployerContribution)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-slate-200/60">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-violet-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Employee (5.5%)</p>
                    <p className="text-lg font-bold text-violet-700">
                      {fmt(summary.totalEmployeeDeduction)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* SSNIT Rate Info */}
        <Card className="border-slate-200/60 bg-slate-50">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-slate-500" />
                <span className="font-medium text-slate-700">SSNIT Contribution Rates:</span>
              </div>
              <div className="flex flex-wrap gap-3">
                <Badge variant="outline" className="text-xs">
                  Employee: <strong className="ml-1">5.5%</strong>
                </Badge>
                <Badge variant="outline" className="text-xs">
                  Employer: <strong className="ml-1">8.0%</strong>
                </Badge>
                <Badge variant="outline" className="text-xs border-emerald-300 text-emerald-700">
                  Total: <strong className="ml-1">13.5%</strong>
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Table */}
        <Card className="border-slate-200/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Employee SSNIT Contributions
              {summary && (
                <span className="text-xs text-slate-400 font-normal">
                  ({MONTHS[parseInt(selectedMonth) - 1]} {selectedYear})
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-[500px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="w-10">#</TableHead>
                    <TableHead>Employee Name</TableHead>
                    <TableHead>Staff ID</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead className="text-right">Basic Salary</TableHead>
                    <TableHead className="text-center">SSNIT Tier</TableHead>
                    <TableHead className="text-right">Employee 5.5%</TableHead>
                    <TableHead className="text-right">Employer 8.0%</TableHead>
                    <TableHead className="text-right">Total 13.5%</TableHead>
                    <TableHead>SSNIT Number</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell colSpan={11}>
                          <Skeleton className="h-10" />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : employees.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={11} className="text-center py-12 text-slate-400">
                        <Shield className="w-10 h-10 mx-auto mb-2 opacity-50" />
                        <p className="font-medium">No employee data for the selected period</p>
                        <p className="text-xs mt-1">
                          Try generating the report or adjusting filters
                        </p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    <>
                      {employees.map((emp, i) => (
                        <TableRow key={emp.employeeId}>
                          <TableCell className="text-xs text-slate-400">{i + 1}</TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium text-sm">{emp.name}</p>
                              <p className="text-xs text-slate-500">{emp.designation}</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm font-mono text-slate-500">
                            {emp.empId}
                          </TableCell>
                          <TableCell className="text-sm">{emp.department}</TableCell>
                          <TableCell className="text-sm text-right">
                            {emp.basicSalary.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline" className="text-[10px]">
                              {emp.ssnitTier}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-right text-violet-600 font-medium">
                            {emp.employeeContribution.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-sm text-right text-rose-600 font-medium">
                            {emp.employerContribution.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-sm text-right font-bold">
                            {emp.totalContribution.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-xs text-slate-500 font-mono">
                            {emp.ssnitNumber || '—'}
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={`${
                                emp.payrollStatus === 'paid' || emp.payrollStatus === 'processed'
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : 'bg-amber-100 text-amber-700'
                              } text-[10px]`}
                            >
                              {emp.payrollStatus || 'pending'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                      {/* Totals Row */}
                      {summary && (
                        <TableRow className="bg-slate-100 font-bold border-t-2 border-slate-300">
                          <TableCell colSpan={4} className="text-sm">
                            TOTALS ({summary.totalEmployees} employees)
                          </TableCell>
                          <TableCell className="text-sm text-right">
                            {summary.totalGrossSalary.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-center">—</TableCell>
                          <TableCell className="text-sm text-right text-violet-700">
                            {summary.totalEmployeeDeduction.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-sm text-right text-rose-700">
                            {summary.totalEmployerContribution.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-sm text-right text-amber-700">
                            {summary.totalSSNIT.toLocaleString()}
                          </TableCell>
                          <TableCell colSpan={2}></TableCell>
                        </TableRow>
                      )}
                    </>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Employer Certification Section */}
        {summary && summary.totalEmployees > 0 && (
          <Card className="border-slate-200/60">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                  <h3 className="text-sm font-semibold text-slate-700">
                    Employer Certification
                  </h3>
                </div>
                <Separator />
                <p className="text-xs text-slate-500 leading-relaxed">
                  I hereby certify that the information provided in this SSNIT contribution
                  report is accurate and complete for the period of{' '}
                  <strong>
                    {MONTHS[parseInt(selectedMonth) - 1]} {selectedYear}
                  </strong>
                  . All employee contributions have been correctly calculated at 5.5% of
                  basic salary and employer contributions at 8.0% of basic salary, totaling
                  13.5% remittance to the Social Security and National Insurance Trust.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8">
                  <div className="text-center">
                    <div className="border-t border-slate-300 pt-3 mx-8">
                      <p className="text-xs font-medium text-slate-600">
                        Authorized Signatory
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1">
                        Name: ________________________
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1">
                        Date: {new Date().toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="border-t border-slate-300 pt-3 mx-8">
                      <p className="text-xs font-medium text-slate-600">
                        SSNIT Officer
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1">
                        Name: ________________________
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1">
                        Date: ________________________
                      </p>
                    </div>
                  </div>
                </div>
                <div className="text-center pt-4">
                  <p className="text-[10px] text-slate-400">
                    This report is computer-generated and prepared for submission to the
                    Social Security and National Insurance Trust (SSNIT), Ghana.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Hidden Print Content */}
        <div ref={printRef} style={{ display: 'none' }}>
          <div className="header">
            <h1>SSNIT CONTRIBUTION REPORT</h1>
            <p>Social Security and National Insurance Trust</p>
            <p>
              Period: {MONTHS[parseInt(selectedMonth) - 1]} {selectedYear}
            </p>
            <p>
              Status:{' '}
              <span className="status-badge status-{filingStatus}">
                {filingStatus.toUpperCase()}
              </span>
            </p>
          </div>
          <div className="summary-grid">
            <div className="summary-card">
              <div className="label">Employees</div>
              <div className="value">{summary?.totalEmployees || 0}</div>
            </div>
            <div className="summary-card">
              <div className="label">Gross Salary</div>
              <div className="value">{fmt(summary?.totalGrossSalary || 0)}</div>
            </div>
            <div className="summary-card">
              <div className="label">Employee 5.5%</div>
              <div className="value">{fmt(summary?.totalEmployeeDeduction || 0)}</div>
            </div>
            <div className="summary-card">
              <div className="label">Employer 8.0%</div>
              <div className="value">{fmt(summary?.totalEmployerContribution || 0)}</div>
            </div>
            <div className="summary-card">
              <div className="label">Total 13.5%</div>
              <div className="value">{fmt(summary?.totalSSNIT || 0)}</div>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Employee Name</th>
                <th>Staff ID</th>
                <th>Department</th>
                <th className="text-right">Basic Salary</th>
                <th>Tier</th>
                <th className="text-right">Employee 5.5%</th>
                <th className="text-right">Employer 8.0%</th>
                <th className="text-right">Total 13.5%</th>
                <th>SSNIT No.</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((emp, i) => (
                <tr key={emp.employeeId}>
                  <td>{i + 1}</td>
                  <td>{emp.name}</td>
                  <td>{emp.empId}</td>
                  <td>{emp.department}</td>
                  <td className="text-right">{emp.basicSalary.toLocaleString()}</td>
                  <td>{emp.ssnitTier}</td>
                  <td className="text-right">{emp.employeeContribution.toLocaleString()}</td>
                  <td className="text-right">{emp.employerContribution.toLocaleString()}</td>
                  <td className="text-right">{emp.totalContribution.toLocaleString()}</td>
                  <td>{emp.ssnitNumber || 'N/A'}</td>
                </tr>
              ))}
              {summary && (
                <tr className="totals-row">
                  <td colSpan={4}>TOTALS ({summary.totalEmployees} employees)</td>
                  <td className="text-right">{summary.totalGrossSalary.toLocaleString()}</td>
                  <td>—</td>
                  <td className="text-right">{summary.totalEmployeeDeduction.toLocaleString()}</td>
                  <td className="text-right">{summary.totalEmployerContribution.toLocaleString()}</td>
                  <td className="text-right">{summary.totalSSNIT.toLocaleString()}</td>
                  <td></td>
                </tr>
              )}
            </tbody>
          </table>
          <div className="certification">
            <p className="text-xs text-slate-600">
              I certify that this report is accurate and complete for{' '}
              {MONTHS[parseInt(selectedMonth) - 1]} {selectedYear}.
            </p>
            <div className="sig-lines">
              <div className="sig-line">Authorized Signatory</div>
              <div className="sig-line">SSNIT Officer</div>
            </div>
          </div>
          <div className="footer">
            <p>Computer-generated SSNIT report for School Manager</p>
          </div>
        </div>

        {/* Submit Confirmation Dialog */}
        <Dialog open={confirmSubmitOpen} onOpenChange={setConfirmSubmitOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Send className="w-5 h-5 text-amber-600" />
                Submit to SSNIT
              </DialogTitle>
              <DialogDescription>
                You are about to submit the SSNIT contribution report for{' '}
                <strong>
                  {MONTHS[parseInt(selectedMonth) - 1]} {selectedYear}
                </strong>{' '}
                with {summary?.totalEmployees || 0} employees and a total contribution of{' '}
                <strong>{fmt(summary?.totalSSNIT || 0)}</strong>.
              </DialogDescription>
            </DialogHeader>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-2">
              <p className="text-sm text-amber-800 font-medium">
                Please verify the following before submitting:
              </p>
              <ul className="text-xs text-amber-700 space-y-1">
                <li>• All employee records are correct and complete</li>
                <li>• SSNIT numbers have been verified where applicable</li>
                <li>• Contribution calculations are accurate</li>
                <li>• Total remittance matches payroll records</li>
              </ul>
            </div>
            <DialogFooter className="flex-row gap-2">
              <Button variant="outline" onClick={() => setConfirmSubmitOpen(false)}>
                Cancel
              </Button>
              <Button
                className="bg-amber-600 hover:bg-amber-700"
                onClick={handleSubmitToSSNIT}
                disabled={submitting}
              >
                {submitting ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                ) : (
                  <Send className="w-4 h-4 mr-2" />
                )}
                Confirm Submission
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
