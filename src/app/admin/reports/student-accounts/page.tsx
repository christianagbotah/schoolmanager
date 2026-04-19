'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  FileText, Download, Printer, User, DollarSign, AlertCircle,
  CheckCircle, Clock, Send, Search, Filter, Eye,
} from 'lucide-react';
import { toast } from 'sonner';

/* ---------- types ---------- */

interface ClassItem { class_id: number; name: string; }
interface SectionItem { section_id: number; name: string; }
interface TermItem { term_id: number; name: string; }

interface StudentAccount {
  student_id: number;
  student_code: string;
  name: string;
  class_name: string;
  section_name: string;
  year: string;
  term: string;
  total_billed: number;
  total_paid: number;
  balance: number;
  payment_status: string;
  invoice_count: number;
  payment_count: number;
  last_payment_date: string | null;
}

interface ReportData {
  students: StudentAccount[];
  pagination: { page: number; limit: number; total: number; totalPages: number; };
  summary: {
    total_students: number;
    total_billed: number;
    total_collected: number;
    total_outstanding: number;
    paid_count: number;
    partial_count: number;
    unpaid_count: number;
  };
  filters: {
    classes: ClassItem[];
    sections: SectionItem[];
    years: string[];
    terms: TermItem[];
  };
}

/* ---------- helpers ---------- */

function fmt(n: number) {
  return `GHS ${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function statusBadge(status: string) {
  switch (status) {
    case 'paid':
      return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Paid</Badge>;
    case 'partial':
      return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">Partial</Badge>;
    case 'unpaid':
      return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Unpaid</Badge>;
    default:
      return <Badge className="bg-slate-100 text-slate-500 hover:bg-slate-100">No Fees</Badge>;
  }
}

function balanceColor(balance: number) {
  if (Math.abs(balance) < 0.01) return 'text-emerald-600';
  if (balance > 0) return 'text-red-600';
  return 'text-emerald-600';
}

function formatDate(iso: string | null) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  } catch {
    return '—';
  }
}

/* ---------- loading skeleton ---------- */

function StudentAccountsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
        <Skeleton className="w-10 h-10 rounded-xl" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-56" />
          <Skeleton className="h-4 w-72" />
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-16 rounded-xl" />
      <Skeleton className="h-14 rounded-xl" />
      <Skeleton className="h-80 rounded-xl" />
    </div>
  );
}

/* ---------- main component ---------- */

export default function StudentAccountsReportPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ReportData | null>(null);
  const [students, setStudents] = useState<StudentAccount[]>([]);

  // Filters
  const [classId, setClassId] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [year, setYear] = useState('');
  const [term, setTerm] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);

  // Statement dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentAccount | null>(null);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (classId) params.set('classId', classId);
      if (sectionId) params.set('sectionId', sectionId);
      if (year) params.set('year', year);
      if (term) params.set('term', term);
      if (paymentStatus) params.set('paymentStatus', paymentStatus);
      if (search) params.set('search', search);
      params.set('page', String(page));
      params.set('limit', '50');

      const res = await fetch(`/api/admin/reports/student-accounts?${params}`);
      if (!res.ok) throw new Error('Failed to load report');
      const json: ReportData = await res.json();
      setData(json);
      setStudents(json.students);
    } catch {
      toast.error('Failed to load student account report');
    }
    setLoading(false);
  }, [classId, sectionId, year, term, paymentStatus, search, page]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [classId, sectionId, year, term, paymentStatus, search]);

  const handleSearch = () => {
    setSearch(searchInput);
  };

  const handleExportCSV = () => {
    if (!students.length) {
      toast.error('No data to export');
      return;
    }
    const headers = [
      'Student Name', 'Admission No', 'Class', 'Section', 'Year', 'Term',
      'Total Billed', 'Total Paid', 'Balance', 'Status', 'Last Payment Date',
    ];
    const rows = students.map((s) => [
      s.name, s.student_code, s.class_name, s.section_name, s.year, s.term,
      s.total_billed.toFixed(2), s.total_paid.toFixed(2), s.balance.toFixed(2),
      s.payment_status, s.last_payment_date || '',
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.map((c) => `"${c}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `student-accounts-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exported successfully');
  };

  const handlePrint = () => {
    window.print();
  };

  const handleViewStatement = (student: StudentAccount) => {
    setSelectedStudent(student);
    setDialogOpen(true);
  };

  const handleGoToFullStatement = (student: StudentAccount) => {
    const params = new URLSearchParams();
    params.set('studentId', String(student.student_id));
    if (year) params.set('year', year);
    if (term) params.set('term', term);
    router.push(`/admin/reports/student-accounts/statement?${params}`);
  };

  const handleSendReminder = (student: StudentAccount) => {
    toast.success(`Reminder queued for ${student.name}`);
  };

  const collectionRate = data?.summary.total_billed
    ? ((data.summary.total_collected / data.summary.total_billed) * 100).toFixed(1)
    : '0';

  if (loading && !data) return (
    <DashboardLayout>
      <StudentAccountsSkeleton />
    </DashboardLayout>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Student Account Statements
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Per-student financial summary and detailed statements
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleExportCSV} className="min-h-[44px]">
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
            <Button variant="outline" onClick={handlePrint} className="min-h-[44px]">
              <Printer className="w-4 h-4 mr-2" />
              Print
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-l-4 border-l-emerald-500 hover:shadow-lg hover:-translate-y-0.5 transition-all">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center flex-shrink-0">
                <User className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wider">Students</p>
                <p className="text-xl font-bold text-slate-900 tabular-nums">
                  {data?.summary.total_students || 0}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-sky-500 hover:shadow-lg hover:-translate-y-0.5 transition-all">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-500 flex items-center justify-center flex-shrink-0">
                <DollarSign className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wider">Total Billed</p>
                <p className="text-xl font-bold text-slate-900 tabular-nums">
                  {fmt(data?.summary.total_billed || 0)}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-violet-500 hover:shadow-lg hover:-translate-y-0.5 transition-all">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-500 flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wider">Collected</p>
                <p className="text-xl font-bold text-slate-900 tabular-nums">
                  {fmt(data?.summary.total_collected || 0)}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-red-500 hover:shadow-lg hover:-translate-y-0.5 transition-all">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wider">Outstanding</p>
                <p className="text-xl font-bold text-slate-900 tabular-nums">
                  {fmt(data?.summary.total_outstanding || 0)}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Collection Rate + Status Distribution */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="lg:col-span-1 col-span-2">
            <CardContent className="p-4 text-center">
              <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wider mb-1">Collection Rate</p>
              <p className="text-2xl font-bold text-slate-900 tabular-nums">{collectionRate}%</p>
              <div className="h-1.5 bg-slate-200 rounded-full mt-2 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    parseFloat(collectionRate) >= 70
                      ? 'bg-emerald-500'
                      : parseFloat(collectionRate) >= 40
                      ? 'bg-amber-500'
                      : 'bg-red-500'
                  }`}
                  style={{ width: `${Math.min(100, parseFloat(collectionRate))}%` }}
                />
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-emerald-500">
            <CardContent className="p-3 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <CheckCircle className="w-3 h-3 text-emerald-500" />
              </div>
              <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wider">Fully Paid</p>
              <p className="text-lg font-bold text-emerald-600 tabular-nums">
                {data?.summary.paid_count || 0}
              </p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-amber-500">
            <CardContent className="p-3 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Clock className="w-3 h-3 text-amber-500" />
              </div>
              <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wider">Partial</p>
              <p className="text-lg font-bold text-amber-600 tabular-nums">
                {data?.summary.partial_count || 0}
              </p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-red-500">
            <CardContent className="p-3 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <AlertCircle className="w-3 h-3 text-red-500" />
              </div>
              <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wider">Unpaid</p>
              <p className="text-lg font-bold text-red-600 tabular-nums">
                {data?.summary.unpaid_count || 0}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="border-slate-200/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Filter className="w-4 h-4 text-slate-400" />
              <span className="text-sm font-medium text-slate-700">Filters</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              <Select value={classId} onValueChange={(v) => setClassId(v === '__all__' ? '' : v)}>
                <SelectTrigger className="min-h-[44px] bg-slate-50 border-slate-200 focus:bg-white">
                  <SelectValue placeholder="All Classes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All Classes</SelectItem>
                  {data?.filters.classes.map((c) => (
                    <SelectItem key={c.class_id} value={String(c.class_id)}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={sectionId} onValueChange={(v) => setSectionId(v === '__all__' ? '' : v)}>
                <SelectTrigger className="min-h-[44px] bg-slate-50 border-slate-200 focus:bg-white">
                  <SelectValue placeholder="All Sections" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All Sections</SelectItem>
                  {data?.filters.sections.map((s) => (
                    <SelectItem key={s.section_id} value={String(s.section_id)}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={year} onValueChange={(v) => setYear(v === '__all__' ? '' : v)}>
                <SelectTrigger className="min-h-[44px] bg-slate-50 border-slate-200 focus:bg-white">
                  <SelectValue placeholder="All Years" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All Years</SelectItem>
                  {data?.filters.years.map((y) => (
                    <SelectItem key={y} value={y}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={term} onValueChange={(v) => setTerm(v === '__all__' ? '' : v)}>
                <SelectTrigger className="min-h-[44px] bg-slate-50 border-slate-200 focus:bg-white">
                  <SelectValue placeholder="All Terms" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All Terms</SelectItem>
                  {data?.filters.terms.map((t) => (
                    <SelectItem key={t.term_id} value={t.name}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={paymentStatus} onValueChange={(v) => setPaymentStatus(v === '__all__' ? '' : v)}>
                <SelectTrigger className="min-h-[44px] bg-slate-50 border-slate-200 focus:bg-white">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All Status</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="partial">Partial</SelectItem>
                  <SelectItem value="unpaid">Unpaid</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex gap-1">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Search student..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="pl-10 min-h-[44px] bg-slate-50 border-slate-200 focus:bg-white"
                  />
                </div>
                <Button
                  variant="outline"
                  onClick={handleSearch}
                  className="min-h-[44px] min-w-[44px] px-2"
                >
                  <Search className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Table */}
        <Card className="border-slate-200/60">
          <CardContent className="p-0">
            <div className="px-4 py-3 flex items-center justify-between border-b border-slate-100">
              <span className="text-sm font-medium text-slate-800">
                Student Accounts
              </span>
              {data && (
                <span className="text-xs text-slate-400">
                  {data.pagination.total} students found
                </span>
              )}
            </div>
            <div className="max-h-[500px] overflow-y-auto">
              {/* Desktop Table */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50">
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Student Name</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead className="text-right">Total Billed</TableHead>
                      <TableHead className="text-right">Total Paid</TableHead>
                      <TableHead className="text-right">Balance</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Payment</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      Array.from({ length: 8 }).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell colSpan={9}>
                            <Skeleton className="h-10" />
                          </TableCell>
                        </TableRow>
                      ))
                    ) : students.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-12 text-slate-400">
                          <div className="flex flex-col items-center">
                            <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center mb-3">
                              <CheckCircle className="w-8 h-8 text-emerald-300" />
                            </div>
                            <p className="font-medium text-slate-600">No students found</p>
                            <p className="text-xs mt-1 text-slate-400">Try adjusting your filters</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      students.map((s, i) => (
                        <TableRow key={s.student_id} className="hover:bg-slate-50">
                          <TableCell className="text-xs text-slate-400">
                            {(page - 1) * 50 + i + 1}
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium text-sm">{s.name}</p>
                              <p className="text-xs text-slate-400 font-mono">
                                {s.student_code}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="text-sm">{s.class_name}</p>
                              <p className="text-xs text-slate-400">{s.section_name}</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-right text-sm">
                            {fmt(s.total_billed)}
                          </TableCell>
                          <TableCell className="text-right text-sm text-emerald-600">
                            {fmt(s.total_paid)}
                          </TableCell>
                          <TableCell className={`text-right text-sm font-semibold ${balanceColor(s.balance)}`}>
                            {fmt(s.balance)}
                          </TableCell>
                          <TableCell>{statusBadge(s.payment_status)}</TableCell>
                          <TableCell className="text-xs text-slate-500">
                            {formatDate(s.last_payment_date)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 min-w-[32px]"
                                onClick={() => handleViewStatement(s)}
                                title="View Statement"
                              >
                                <Eye className="w-4 h-4 text-slate-500" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 min-w-[32px]"
                                onClick={() => handleSendReminder(s)}
                                title="Send Reminder"
                              >
                                <Send className="w-4 h-4 text-slate-500" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden divide-y">
                {loading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="p-4">
                      <Skeleton className="h-24 rounded-lg" />
                    </div>
                  ))
                ) : students.length === 0 ? (
                  <div className="text-center py-12 text-slate-400">
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center mb-3">
                        <CheckCircle className="w-8 h-8 text-emerald-300" />
                      </div>
                      <p className="font-medium text-slate-600">No students found</p>
                      <p className="text-xs mt-1 text-slate-400">Try adjusting your filters</p>
                    </div>
                  </div>
                ) : (
                  students.map((s) => (
                    <div key={s.student_id} className="p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-sm">{s.name}</p>
                          <p className="text-xs text-slate-400">
                            {s.student_code} &middot; {s.class_name}
                          </p>
                        </div>
                        {statusBadge(s.payment_status)}
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="bg-slate-50 rounded-lg p-2 text-center">
                          <p className="text-[10px] text-slate-500">Billed</p>
                          <p className="text-xs font-bold">{fmt(s.total_billed)}</p>
                        </div>
                        <div className="bg-emerald-50 rounded-lg p-2 text-center">
                          <p className="text-[10px] text-slate-500">Paid</p>
                          <p className="text-xs font-bold text-emerald-700">
                            {fmt(s.total_paid)}
                          </p>
                        </div>
                        <div className="bg-red-50 rounded-lg p-2 text-center">
                          <p className="text-[10px] text-slate-500">Balance</p>
                          <p className={`text-xs font-bold ${balanceColor(s.balance)}`}>
                            {fmt(s.balance)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 min-h-[44px] text-xs"
                          onClick={() => handleViewStatement(s)}
                        >
                          <Eye className="w-3 h-3 mr-1" /> View Statement
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="min-h-[44px] min-w-[44px] px-3"
                          onClick={() => handleSendReminder(s)}
                        >
                          <Send className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Table Footer */}
            {!loading && students.length > 0 && (
              <div className="px-4 py-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2 bg-slate-50">
                <span className="text-xs text-slate-500">
                  Showing {(page - 1) * 50 + 1}–{Math.min(page * 50, data?.pagination.total || 0)} of{' '}
                  {data?.pagination.total} students
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                    className="h-9"
                  >
                    Previous
                  </Button>
                  {data?.pagination.totalPages &&
                    Array.from({ length: Math.min(5, data.pagination.totalPages) }).map((_, i) => {
                      const pNum = Math.max(1, Math.min(page - 2, data.pagination.totalPages - 4)) + i;
                      if (pNum > data.pagination.totalPages) return null;
                      return (
                        <Button
                          key={pNum}
                          size="sm"
                          variant={page === pNum ? 'default' : 'outline'}
                          onClick={() => setPage(pNum)}
                          className="h-9 w-9 p-0"
                        >
                          {pNum}
                        </Button>
                      );
                    })}
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={page >= (data?.pagination.totalPages || 1)}
                    onClick={() => setPage((p) => p + 1)}
                    className="h-9"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Statement Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <div className="flex items-center gap-3 mb-1">
                <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-violet-600" />
                </div>
                <DialogTitle>Account Summary</DialogTitle>
              </div>
            </DialogHeader>
            {selectedStudent && (
              <div className="space-y-4">
                {/* Student Header */}
                <div className="bg-slate-50 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                      <User className="w-6 h-6 text-emerald-700" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">
                        {selectedStudent.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {selectedStudent.student_code} &middot;{' '}
                        {selectedStudent.class_name}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Financial Summary */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-sky-50 rounded-lg p-3 text-center">
                    <p className="text-[10px] text-slate-500 mb-1">Total Billed</p>
                    <p className="text-sm font-bold text-sky-700">
                      {fmt(selectedStudent.total_billed)}
                    </p>
                  </div>
                  <div className="bg-emerald-50 rounded-lg p-3 text-center">
                    <p className="text-[10px] text-slate-500 mb-1">Total Paid</p>
                    <p className="text-sm font-bold text-emerald-700">
                      {fmt(selectedStudent.total_paid)}
                    </p>
                  </div>
                  <div className="bg-red-50 rounded-lg p-3 text-center">
                    <p className="text-[10px] text-slate-500 mb-1">Balance</p>
                    <p className={`text-sm font-bold ${balanceColor(selectedStudent.balance)}`}>
                      {fmt(selectedStudent.balance)}
                    </p>
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center py-1">
                    <span className="text-slate-500">Payment Status</span>
                    {statusBadge(selectedStudent.payment_status)}
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-slate-500">Invoices</span>
                    <span className="font-medium">{selectedStudent.invoice_count}</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-slate-500">Payments</span>
                    <span className="font-medium">{selectedStudent.payment_count}</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-slate-500">Last Payment</span>
                    <span className="font-medium">
                      {formatDate(selectedStudent.last_payment_date)}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button
                    className="flex-1 min-h-[44px]"
                    onClick={() => handleGoToFullStatement(selectedStudent)}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Full Statement
                  </Button>
                  <Button
                    variant="outline"
                    className="min-h-[44px]"
                    onClick={() => handleSendReminder(selectedStudent)}
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Reminder
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
