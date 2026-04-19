'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  FileText, Download, Printer, Search, DollarSign, Users, Calendar,
  Filter, Eye, Loader2, Building2, CreditCard, X,
} from 'lucide-react';

interface Payslip {
  pay_id: number;
  reference?: string;
  employee_code: string;
  month: string;
  year: string;
  basic_salary: number;
  gross_salary: number;
  net_salary: number;
  total_allowances?: number;
  total_deductions?: number;
  status: string;
  account_number?: string;
  employee?: { name: string; designation?: { des_name: string } | null; department?: { dep_name: string } | null };
}

function derivePayslipDetails(ps: Payslip) {
  const totalAllowances = ps.gross_salary - ps.basic_salary;
  const totalDeductions = ps.gross_salary - ps.net_salary;
  const housing = Math.round(totalAllowances * 0.45 * 100) / 100;
  const transport = Math.round(totalAllowances * 0.30 * 100) / 100;
  const medical = Math.round((totalAllowances - housing - transport) * 100) / 100;
  const tax = Math.round(totalDeductions * 0.45 * 100) / 100;
  const ssnit = Math.round(totalDeductions * 0.35 * 100) / 100;
  const loan = Math.round((totalDeductions - tax - ssnit) * 100) / 100;
  return { housing, transport, medical, tax, ssnit, loan };
}

export default function PayslipsPage() {
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [monthFilter, setMonthFilter] = useState('all');
  const [yearFilter, setYearFilter] = useState('all');
  const [previewPayslip, setPreviewPayslip] = useState<Payslip | null>(null);
  const [printPayslip, setPrintPayslip] = useState<Payslip | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const fetchPayslips = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (monthFilter !== 'all') params.set('month', monthFilter);
      if (yearFilter !== 'all') params.set('year', yearFilter);
      if (search) params.set('search', search);
      const res = await fetch(`/api/admin/payroll/payslips?${params}`);
      const data = await res.json();
      setPayslips(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Failed to fetch payslips');
    }
    setLoading(false);
  }, [monthFilter, yearFilter, search]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchPayslips(); }, [fetchPayslips]);

  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const years = ['2024', '2025', '2026'];

  const handlePreview = (ps: Payslip) => setPreviewPayslip(ps);

  const handlePrint = (ps: Payslip) => {
    setPrintPayslip(ps);
    setTimeout(() => {
      const content = document.getElementById('payslip-print-content');
      if (!content) return;
      const printWindow = window.open('', '_blank');
      if (!printWindow) { toast.error('Please allow popups to print'); return; }
      printWindow.document.write(`
        <!DOCTYPE html>
        <html><head><title>Payslip - ${ps.employee?.name || ps.employee_code}</title>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 20px; color: #1e293b; }
          .header { text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 16px; margin-bottom: 24px; }
          .header h1 { font-size: 22px; margin: 0 0 4px; } .header p { font-size: 13px; color: #64748b; margin: 0; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 24px; font-size: 14px; }
          .info-grid .label { color: #64748b; } .info-grid .value { font-weight: 600; }
          .section { margin-bottom: 20px; } .section h3 { font-size: 15px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin: 0 0 10px; color: #334155; }
          table { width: 100%; border-collapse: collapse; font-size: 14px; }
          th { text-align: left; padding: 6px 12px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; color: #475569; }
          td { padding: 6px 12px; border-bottom: 1px solid #f1f5f9; }
          .total-row td { font-weight: 700; border-top: 2px solid #0f172a; background: #f8fafc; font-size: 15px; }
          .net-row td { font-weight: 700; border-top: 2px solid #16a34a; color: #16a34a; font-size: 16px; }
          .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 12px; color: #94a3b8; }
          .footer .sig { display: flex; justify-content: space-between; margin-top: 60px; }
          .footer .sig-line { border-top: 1px solid #94a3b8; width: 180px; padding-top: 6px; font-size: 13px; }
          @media print { body { padding: 10px; } }
        </style></head><body>
        ${content.innerHTML}
        </body></html>
      `);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => { printWindow.print(); printWindow.close(); setPrintPayslip(null); }, 400);
    }, 100);
  };

  const handleDownload = (ps: Payslip) => {
    const details = derivePayslipDetails(ps);
    const monthName = months[parseInt(ps.month) - 1] || ps.month;
    const rows = [
      'PAYSLIP DETAILS',
      `Generated: ${new Date().toLocaleDateString()}`,
      '',
      'EMPLOYEE INFORMATION',
      `Employee Name,${ps.employee?.name || 'N/A'}`,
      `Employee ID,${ps.employee_code}`,
      `Department,${ps.employee?.department?.dep_name || 'N/A'}`,
      `Designation,${ps.employee?.designation?.des_name || 'N/A'}`,
      `Pay Period,${monthName} ${ps.year}`,
      `Status,${ps.status || 'pending'}`,
      '',
      'EARNINGS',
      `Basic Salary,GHS ${ps.basic_salary.toLocaleString()}`,
      `Housing Allowance,GHS ${details.housing.toLocaleString()}`,
      `Transport Allowance,GHS ${details.transport.toLocaleString()}`,
      `Medical Allowance,GHS ${details.medical.toLocaleString()}`,
      `Gross Salary,GHS ${ps.gross_salary.toLocaleString()}`,
      '',
      'DEDUCTIONS',
      `Income Tax (PAYE),GHS ${details.tax.toLocaleString()}`,
      `SSNIT Contribution,GHS ${details.ssnit.toLocaleString()}`,
      `Loan Deduction,GHS ${details.loan.toLocaleString()}`,
      `Total Deductions,GHS ${(ps.gross_salary - ps.net_salary).toLocaleString()}`,
      '',
      `Net Pay,GHS ${ps.net_salary.toLocaleString()}`,
      '',
      'This is a computer-generated payslip.',
    ];
    const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payslip_${ps.employee_code}_${ps.month}_${ps.year}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Payslip downloaded successfully');
  };

  const handleExportAll = () => {
    if (filteredPayslips.length === 0) { toast.error('No payslips to export'); return; }
    const header = 'Employee,Employee Code,Month,Year,Basic Salary,Gross Salary,Net Salary,Status';
    const rows = filteredPayslips.map(ps =>
      `${ps.employee?.name || ps.employee_code},${ps.employee_code},${months[parseInt(ps.month) - 1] || ps.month},${ps.year},${ps.basic_salary},${ps.gross_salary},${ps.net_salary},${ps.status || 'pending'}`
    );
    const blob = new Blob([[header, ...rows].join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payslips_export_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${filteredPayslips.length} payslips`);
  };

  const filteredPayslips = payslips.filter(p => {
    if (search && !p.employee?.name?.toLowerCase().includes(search.toLowerCase()) && !p.employee_code.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const totalNet = filteredPayslips.reduce((s, p) => s + p.net_salary, 0);
  const totalGross = filteredPayslips.reduce((s, p) => s + p.gross_salary, 0);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div><h1 className="text-2xl font-bold text-slate-900 tracking-tight">Payslips</h1><p className="text-sm text-slate-500 mt-1">View and manage all generated employee payslips</p></div>
          <div className="flex gap-2">
            <Link href="/admin/payroll">
              <Button className="min-h-[44px] bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
                <DollarSign className="w-5 h-5 mr-2" />
                Pay Salary
              </Button>
            </Link>
            <Button variant="outline" className="min-h-[44px]" onClick={handleExportAll}><Download className="w-4 h-4 mr-2" />Export All</Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-slate-200/60"><CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center"><FileText className="w-5 h-5 text-emerald-600" /></div>
            <div><p className="text-xs text-slate-500">Total Payslips</p><p className="text-xl font-bold">{payslips.length}</p></div>
          </CardContent></Card>
          <Card className="border-slate-200/60"><CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-sky-100 flex items-center justify-center"><DollarSign className="w-5 h-5 text-sky-600" /></div>
            <div><p className="text-xs text-slate-500">Total Gross</p><p className="text-xl font-bold">GHS {totalGross.toLocaleString()}</p></div>
          </CardContent></Card>
          <Card className="border-slate-200/60"><CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center"><CreditCard className="w-5 h-5 text-amber-600" /></div>
            <div><p className="text-xs text-slate-500">Total Net</p><p className="text-xl font-bold">GHS {totalNet.toLocaleString()}</p></div>
          </CardContent></Card>
          <Card className="border-slate-200/60"><CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center"><Users className="w-5 h-5 text-violet-600" /></div>
            <div><p className="text-xs text-slate-500">Employees</p><p className="text-xl font-bold">{new Set(payslips.map(p => p.employee_code)).size}</p></div>
          </CardContent></Card>
        </div>

        {/* Filters */}
        <Card className="border-slate-200/60"><CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><Input placeholder="Search employee name or ID..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 min-h-[44px]" /></div>
            <Select value={monthFilter} onValueChange={setMonthFilter}>
              <SelectTrigger className="h-[44px] w-full sm:w-40"><SelectValue placeholder="Month" /></SelectTrigger>
              <SelectContent><SelectItem value="all">All Months</SelectItem>{months.map((m, i) => <SelectItem key={i} value={(i + 1).toString()}>{m}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={yearFilter} onValueChange={setYearFilter}>
              <SelectTrigger className="h-[44px] w-full sm:w-32"><SelectValue placeholder="Year" /></SelectTrigger>
              <SelectContent><SelectItem value="all">All Years</SelectItem>{years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </CardContent></Card>

        {/* Payslips Table */}
        <Card className="border-slate-200/60"><CardContent className="p-0">
          <div className="max-h-[500px] overflow-y-auto">
            <Table>
              <TableHeader><TableRow className="bg-slate-50">
                <TableHead className="w-12">#</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>ID No</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Account #</TableHead>
                <TableHead>Month</TableHead>
                <TableHead>Year</TableHead>
                <TableHead className="text-right">Basic</TableHead>
                <TableHead className="text-right">Allowances</TableHead>
                <TableHead className="text-right">Gross</TableHead>
                <TableHead className="text-right">Deductions</TableHead>
                <TableHead className="text-right">Net</TableHead>
                <TableHead className="text-center">Action</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {loading ? Array.from({ length: 5 }).map((_, i) => <TableRow key={i}><TableCell colSpan={14}><Skeleton className="h-10" /></TableCell></TableRow>) :
                  filteredPayslips.length === 0 ? <TableRow><TableCell colSpan={14} className="text-center py-12 text-slate-400"><FileText className="w-10 h-10 mx-auto mb-2 opacity-50" /><p className="font-medium">No payslips found</p></TableCell></TableRow> :
                    filteredPayslips.map((ps, i) => (
                      <TableRow key={ps.pay_id} className="hover:bg-gray-100">
                        <TableCell className="px-4 py-3 text-xs text-slate-400">{i + 1}</TableCell>
                        <TableCell className="px-4 py-3"><span className="font-medium">{ps.reference || `PAY-${ps.pay_id}`}</span></TableCell>
                        <TableCell className="px-4 py-3 whitespace-nowrap text-sm font-mono text-slate-500">{ps.employee_code}</TableCell>
                        <TableCell className="px-4 py-3 whitespace-nowrap text-sm font-medium">{ps.employee?.name || ps.employee_code}</TableCell>
                        <TableCell className="px-4 py-3 text-sm text-slate-500">{ps.account_number || '—'}</TableCell>
                        <TableCell className="px-4 py-3 text-sm">{months[parseInt(ps.month) - 1] || ps.month}</TableCell>
                        <TableCell className="px-4 py-3 text-sm">{ps.year}</TableCell>
                        <TableCell className="px-4 py-3 text-right text-sm">{ps.basic_salary.toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                        <TableCell className="px-4 py-3 text-right text-sm text-emerald-600">{(ps.total_allowances || (ps.gross_salary - ps.basic_salary)).toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                        <TableCell className="px-4 py-3 text-right text-sm font-medium">{ps.gross_salary.toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                        <TableCell className="px-4 py-3 text-right text-sm text-red-600">{(ps.total_deductions || (ps.gross_salary - ps.net_salary)).toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                        <TableCell className="px-4 py-3 text-right text-sm font-bold text-emerald-700">{ps.net_salary.toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                        <TableCell className="px-4 py-3 text-center">
                          <Button size="sm" className="py-2 px-3 font-medium text-center text-white bg-sky-600 hover:bg-sky-700 rounded-lg text-xs min-h-[36px]"
                            onClick={() => handlePreview(ps)}>
                            Preview
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
              </TableBody>
            </Table>
          </div>
        </CardContent></Card>
      </div>

      {/* Preview Dialog */}
      <Dialog open={!!previewPayslip} onOpenChange={(open) => { if (!open) setPreviewPayslip(null); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          {previewPayslip && (() => {
            const ps = previewPayslip;
            const d = derivePayslipDetails(ps);
            const monthName = months[parseInt(ps.month) - 1] || ps.month;
            const totalDeductions = ps.gross_salary - ps.net_salary;
            return (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2"><FileText className="w-5 h-5" /> Payslip Preview</DialogTitle>
                  <DialogDescription>Detailed breakdown for {ps.employee?.name || ps.employee_code}</DialogDescription>
                </DialogHeader>

                <div className="space-y-5 mt-2">
                  {/* Employee Info */}
                  <div className="bg-slate-50 rounded-lg p-4 space-y-2">
                    <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2"><Users className="w-4 h-4" /> Employee Information</h4>
                    <Separator />
                    <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
                      <div className="flex justify-between"><span className="text-slate-500">Name</span><span className="font-medium">{ps.employee?.name || 'N/A'}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">ID</span><span className="font-medium font-mono">{ps.employee_code}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Department</span><span className="font-medium">{ps.employee?.department?.dep_name || 'N/A'}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Designation</span><span className="font-medium">{ps.employee?.designation?.des_name || 'N/A'}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Pay Period</span><Badge variant="outline" className="text-xs">{monthName} {ps.year}</Badge></div>
                      <div className="flex justify-between items-center"><span className="text-slate-500">Status</span><Badge className={`${ps.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'} text-xs`}>{ps.status || 'pending'}</Badge></div>
                    </div>
                  </div>

                  {/* Earnings */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2"><DollarSign className="w-4 h-4" /> Earnings</h4>
                    <Separator />
                    <div className="rounded-lg border overflow-hidden">
                      <table className="w-full text-sm">
                        <tbody>
                          <tr className="border-b bg-white"><td className="px-4 py-2 text-slate-600">Basic Salary</td><td className="px-4 py-2 text-right font-medium">GHS {ps.basic_salary.toLocaleString()}</td></tr>
                          <tr className="border-b bg-slate-50/50"><td className="px-4 py-2 text-slate-600 pl-6">Housing Allowance</td><td className="px-4 py-2 text-right text-emerald-600">+ GHS {d.housing.toLocaleString()}</td></tr>
                          <tr className="border-b bg-slate-50/50"><td className="px-4 py-2 text-slate-600 pl-6">Transport Allowance</td><td className="px-4 py-2 text-right text-emerald-600">+ GHS {d.transport.toLocaleString()}</td></tr>
                          <tr className="border-b bg-slate-50/50"><td className="px-4 py-2 text-slate-600 pl-6">Medical Allowance</td><td className="px-4 py-2 text-right text-emerald-600">+ GHS {d.medical.toLocaleString()}</td></tr>
                          <tr className="bg-slate-100 font-bold"><td className="px-4 py-2">Gross Salary</td><td className="px-4 py-2 text-right">GHS {ps.gross_salary.toLocaleString()}</td></tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Deductions */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2"><CreditCard className="w-4 h-4" /> Deductions</h4>
                    <Separator />
                    <div className="rounded-lg border overflow-hidden">
                      <table className="w-full text-sm">
                        <tbody>
                          <tr className="border-b bg-white"><td className="px-4 py-2 text-slate-600">Income Tax (PAYE)</td><td className="px-4 py-2 text-right text-red-600">- GHS {d.tax.toLocaleString()}</td></tr>
                          <tr className="border-b bg-slate-50/50"><td className="px-4 py-2 text-slate-600">SSNIT Contribution</td><td className="px-4 py-2 text-right text-red-600">- GHS {d.ssnit.toLocaleString()}</td></tr>
                          <tr className="border-b bg-slate-50/50"><td className="px-4 py-2 text-slate-600">Loan Deduction</td><td className="px-4 py-2 text-right text-red-600">- GHS {d.loan.toLocaleString()}</td></tr>
                          <tr className="bg-slate-100 font-bold"><td className="px-4 py-2">Total Deductions</td><td className="px-4 py-2 text-right text-red-600">- GHS {totalDeductions.toLocaleString()}</td></tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Net Pay */}
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex items-center justify-between">
                    <span className="text-sm font-semibold text-emerald-800">Net Pay</span>
                    <span className="text-xl font-bold text-emerald-700">GHS {ps.net_salary.toLocaleString()}</span>
                  </div>

                  {/* Footer */}
                  <p className="text-xs text-center text-slate-400 pt-2">This is a computer-generated document and does not require a signature.</p>
                </div>

                <DialogFooter className="flex-row gap-2 sm:justify-between">
                  <Button variant="outline" size="sm" onClick={() => handleDownload(ps)}><Download className="w-4 h-4 mr-2" />Download</Button>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => { setPreviewPayslip(null); handlePrint(ps); }}><Printer className="w-4 h-4 mr-2" />Print</Button>
                    <Button size="sm" variant="secondary" onClick={() => setPreviewPayslip(null)}>Close</Button>
                  </div>
                </DialogFooter>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Hidden Print Content */}
      {printPayslip && (() => {
        const ps = printPayslip;
        const d = derivePayslipDetails(ps);
        const monthName = months[parseInt(ps.month) - 1] || ps.month;
        const totalDeductions = ps.gross_salary - ps.net_salary;
        return (
          <div id="payslip-print-content" ref={printRef} style={{ display: 'none' }}>
            <div className="header">
              <h1>PAYSLIP</h1>
              <p>Confidential - For Employee Use Only</p>
            </div>
            <div className="info-grid">
              <div><span className="label">Employee Name: </span><span className="value">{ps.employee?.name || 'N/A'}</span></div>
              <div><span className="label">Employee ID: </span><span className="value">{ps.employee_code}</span></div>
              <div><span className="label">Department: </span><span className="value">{ps.employee?.department?.dep_name || 'N/A'}</span></div>
              <div><span className="label">Designation: </span><span className="value">{ps.employee?.designation?.des_name || 'N/A'}</span></div>
              <div><span className="label">Pay Period: </span><span className="value">{monthName} {ps.year}</span></div>
              <div><span className="label">Status: </span><span className="value">{(ps.status || 'pending').toUpperCase()}</span></div>
            </div>
            <div className="section">
              <h3>EARNINGS</h3>
              <table><tbody>
                <tr><td>Basic Salary</td><td style={{ textAlign: 'right' }}>GHS {ps.basic_salary.toLocaleString()}</td></tr>
                <tr><td style={{ paddingLeft: '24px' }}>Housing Allowance</td><td style={{ textAlign: 'right' }}>GHS {d.housing.toLocaleString()}</td></tr>
                <tr><td style={{ paddingLeft: '24px' }}>Transport Allowance</td><td style={{ textAlign: 'right' }}>GHS {d.transport.toLocaleString()}</td></tr>
                <tr><td style={{ paddingLeft: '24px' }}>Medical Allowance</td><td style={{ textAlign: 'right' }}>GHS {d.medical.toLocaleString()}</td></tr>
                <tr className="total-row"><td>Gross Salary</td><td style={{ textAlign: 'right' }}>GHS {ps.gross_salary.toLocaleString()}</td></tr>
              </tbody></table>
            </div>
            <div className="section">
              <h3>DEDUCTIONS</h3>
              <table><tbody>
                <tr><td>Income Tax (PAYE)</td><td style={{ textAlign: 'right' }}>GHS {d.tax.toLocaleString()}</td></tr>
                <tr><td>SSNIT Contribution</td><td style={{ textAlign: 'right' }}>GHS {d.ssnit.toLocaleString()}</td></tr>
                <tr><td>Loan Deduction</td><td style={{ textAlign: 'right' }}>GHS {d.loan.toLocaleString()}</td></tr>
                <tr className="total-row"><td>Total Deductions</td><td style={{ textAlign: 'right' }}>GHS {totalDeductions.toLocaleString()}</td></tr>
              </tbody></table>
            </div>
            <div className="section">
              <table><tbody>
                <tr className="net-row"><td style={{ fontSize: '16px' }}>NET PAY</td><td style={{ textAlign: 'right', fontSize: '18px' }}>GHS {ps.net_salary.toLocaleString()}</td></tr>
              </tbody></table>
            </div>
            <div className="footer">
              <p>This is a computer-generated payslip and does not require a physical signature.</p>
              <p>Generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}</p>
              <div className="sig">
                <div className="sig-line">Authorized Signatory</div>
                <div className="sig-line">Employee Signature</div>
              </div>
            </div>
          </div>
        );
      })()}
    </DashboardLayout>
  );
}
