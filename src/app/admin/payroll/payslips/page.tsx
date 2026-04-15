'use client';

import { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import {
  FileText, Download, Printer, Search, DollarSign, Users, Calendar,
  Filter, Eye, Loader2, Building2, CreditCard,
} from 'lucide-react';

interface Payslip {
  pay_id: number;
  employee_code: string;
  month: string;
  year: string;
  basic_salary: number;
  gross_salary: number;
  net_salary: number;
  status: string;
  employee?: { name: string; designation?: { des_name: string } | null; department?: { dep_name: string } | null };
}

export default function PayslipsPage() {
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [monthFilter, setMonthFilter] = useState('all');
  const [yearFilter, setYearFilter] = useState('all');

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
          <Button variant="outline" className="min-h-[44px]"><Download className="w-4 h-4 mr-2" />Export All</Button>
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
                <TableHead>Employee</TableHead>
                <TableHead>Emp. Code</TableHead>
                <TableHead>Month/Year</TableHead>
                <TableHead>Basic</TableHead>
                <TableHead>Gross</TableHead>
                <TableHead>Net</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-24">Actions</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {loading ? Array.from({ length: 5 }).map((_, i) => <TableRow key={i}><TableCell colSpan={9}><Skeleton className="h-10" /></TableCell></TableRow>) :
                  filteredPayslips.length === 0 ? <TableRow><TableCell colSpan={9} className="text-center py-12 text-slate-400"><FileText className="w-10 h-10 mx-auto mb-2 opacity-50" /><p className="font-medium">No payslips found</p></TableCell></TableRow> :
                    filteredPayslips.map((ps, i) => (
                      <TableRow key={ps.pay_id}>
                        <TableCell className="text-xs text-slate-400">{i + 1}</TableCell>
                        <TableCell>
                          <div><p className="font-medium text-sm">{ps.employee?.name || ps.employee_code}</p><p className="text-xs text-slate-500">{ps.employee?.designation?.des_name || ''}{ps.employee?.department?.dep_name ? ` · ${ps.employee.department.dep_name}` : ''}</p></div>
                        </TableCell>
                        <TableCell className="text-sm font-mono text-slate-500">{ps.employee_code}</TableCell>
                        <TableCell><Badge variant="outline" className="text-xs">{months[parseInt(ps.month) - 1] || ps.month} {ps.year}</Badge></TableCell>
                        <TableCell className="text-sm">GHS {ps.basic_salary.toLocaleString()}</TableCell>
                        <TableCell className="text-sm">GHS {ps.gross_salary.toLocaleString()}</TableCell>
                        <TableCell className="text-sm font-medium text-emerald-700">GHS {ps.net_salary.toLocaleString()}</TableCell>
                        <TableCell><Badge className={`${ps.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : ps.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'} text-xs`}>{ps.status || 'pending'}</Badge></TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => toast.info('Payslip preview coming soon')}><Eye className="w-3 h-3" /></Button>
                            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => toast.info('Download coming soon')}><Download className="w-3 h-3" /></Button>
                            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => toast.info('Print coming soon')}><Printer className="w-3 h-3" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
              </TableBody>
            </Table>
          </div>
        </CardContent></Card>
      </div>
    </DashboardLayout>
  );
}
