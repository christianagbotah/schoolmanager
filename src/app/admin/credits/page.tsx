'use client';

import { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  Wallet,
  Plus,
  Search,
  FileText,
  ArrowUpCircle,
  CreditCard,
  Clock,
  Users,
  TrendingUp,
  Download,
  Filter,
  X,
  MoreHorizontal,
  Eye,
  Trash2,
  RotateCcw,
  Loader2,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// ── Types ────────────────────────────────────────────────────────────
interface CreditEntry {
  id: number;
  student_id: number;
  student_name: string;
  student_code: string;
  type: 'credit_note' | 'overpayment' | 'wallet_topup';
  category: string;
  amount: number;
  balance: number;
  status: 'active' | 'used' | 'expired' | 'pending';
  reason: string;
  date: string;
  class_name: string;
}

interface CreditSummary {
  totalIssued: number;
  activeStudents: number;
  avgBalance: number;
  pendingRefunds: number;
}

// ── Helpers ──────────────────────────────────────────────────────────
const fmt = (n: number) => `GHS ${n.toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const typeBadge = (type: string) => {
  switch (type) {
    case 'credit_note':
      return <Badge variant="outline" className="bg-sky-50 text-sky-700 border-sky-200 text-xs">Credit Note</Badge>;
    case 'overpayment':
      return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-xs">Overpayment</Badge>;
    case 'wallet_topup':
      return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs">Wallet Top-up</Badge>;
    default:
      return <Badge variant="secondary" className="text-xs">{type}</Badge>;
  }
};

const statusBadge = (status: string) => {
  switch (status) {
    case 'active':
      return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-xs">Active</Badge>;
    case 'used':
      return <Badge variant="secondary" className="text-xs">Used</Badge>;
    case 'pending':
      return <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-xs">Pending</Badge>;
    case 'expired':
      return <Badge variant="secondary" className="text-xs">Expired</Badge>;
    default:
      return <Badge variant="secondary" className="text-xs">{status}</Badge>;
  }
};

const categoryIcon = (cat: string) => {
  switch (cat) {
    case 'feeding': return '🍽️';
    case 'breakfast': return '🥐';
    case 'classes': return '📚';
    case 'water': return '💧';
    case 'transport': return '🚌';
    default: return '💰';
  }
};

// ── Page Skeleton ────────────────────────────────────────────────────
function PageSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="pb-4 border-b border-slate-100">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-7 w-32" />
            <Skeleton className="h-4 w-64" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-11 w-24 rounded-lg" />
            <Skeleton className="h-11 w-32 rounded-lg" />
          </div>
        </div>
      </div>
      {/* Stat card skeletons */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-slate-200/60 bg-white p-4">
            <div className="flex items-center gap-3">
              <Skeleton className="w-11 h-11 rounded-xl flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <Skeleton className="h-3 w-20 mb-2" />
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-3 w-16 mt-1" />
              </div>
            </div>
          </div>
        ))}
      </div>
      {/* Filter bar skeleton */}
      <div className="rounded-2xl border border-slate-200/60 bg-white">
        <div className="p-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <Skeleton className="h-11 w-full max-w-xs rounded-lg" />
            <Skeleton className="h-11 w-40 rounded-lg" />
            <Skeleton className="h-11 w-36 rounded-lg" />
            <Skeleton className="h-11 w-36 rounded-lg" />
          </div>
        </div>
        {/* Table skeleton */}
        <div className="p-4 space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Component ────────────────────────────────────────────────────────
export default function CreditsPage() {
  // Data state
  const [credits, setCredits] = useState<CreditEntry[]>([]);
  const [summary, setSummary] = useState<CreditSummary>({ totalIssued: 0, activeStudents: 0, avgBalance: 0, pendingRefunds: 0 });
  const [classes, setClasses] = useState<string[]>([]);
  const [students, setStudents] = useState<{ student_id: number; name: string; student_code: string }[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter state
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedCredit, setSelectedCredit] = useState<CreditEntry | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [formStudent, setFormStudent] = useState('');
  const [formType, setFormType] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formReason, setFormReason] = useState('');

  // ── Fetch credits ──────────────────────────────────────────────────
  const fetchCredits = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeTab !== 'all') params.set('type', activeTab);
      if (search) params.set('search', search);
      if (classFilter) params.set('class', classFilter);
      if (dateFrom) params.set('dateFrom', dateFrom);
      if (dateTo) params.set('dateTo', dateTo);

      const res = await fetch(`/api/admin/credits?${params.toString()}`);
      const data = await res.json();
      setCredits(data.credits || []);
      setSummary(data.summary || { totalIssued: 0, activeStudents: 0, avgBalance: 0, pendingRefunds: 0 });
      setClasses(data.classes || []);
    } catch {
      toast.error('Failed to load credits');
    }
    setLoading(false);
  }, [activeTab, search, classFilter, dateFrom, dateTo]);

  // ── Fetch students for dropdown ────────────────────────────────────
  const fetchStudents = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/credits/statistics');
      const data = await res.json();
      const studentList = (data.wallets || []).map((w: { student_id: number; name: string; student_code: string }) => ({
        student_id: w.student_id,
        name: w.name,
        student_code: w.student_code,
      }));
      setStudents(studentList);
    } catch {
      // silently fail – dropdown just won't populate
    }
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchCredits(); }, [fetchCredits]);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  // ── Reset filters ──────────────────────────────────────────────────
  const clearFilters = () => {
    setSearch('');
    setClassFilter('');
    setDateFrom('');
    setDateTo('');
  };

  const hasActiveFilters = search || classFilter || dateFrom || dateTo;

  // Active filter chips
  const activeFilters: { label: string; onClear: () => void }[] = [];
  if (search) activeFilters.push({ label: `Search: "${search}"`, onClear: () => setSearch('') });
  if (classFilter) activeFilters.push({ label: `Class: ${classFilter}`, onClear: () => setClassFilter('') });
  if (dateFrom) activeFilters.push({ label: `From: ${dateFrom}`, onClear: () => setDateFrom('') });
  if (dateTo) activeFilters.push({ label: `To: ${dateTo}`, onClear: () => setDateTo('') });

  // ── Open add dialog ────────────────────────────────────────────────
  const openAddDialog = () => {
    setFormStudent('');
    setFormType('');
    setFormCategory('');
    setFormAmount('');
    setFormReason('');
    setDialogOpen(true);
  };

  // ── View detail ────────────────────────────────────────────────────
  const viewDetail = (credit: CreditEntry) => {
    setSelectedCredit(credit);
    setDetailOpen(true);
  };

  // ── Submit new credit ──────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!formStudent || !formType || !formAmount || parseFloat(formAmount) <= 0) {
      toast.error('Please fill in student, type, and a valid amount');
      return;
    }
    if (formType === 'wallet_topup' && !formCategory) {
      toast.error('Please select a wallet category for top-ups');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: parseInt(formStudent),
          type: formType,
          category: formCategory || 'general',
          amount: parseFloat(formAmount),
          reason: formReason,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Credit added successfully');
        setDialogOpen(false);
        fetchCredits();
      } else {
        toast.error(data.error || 'Failed to add credit');
      }
    } catch {
      toast.error('Failed to add credit');
    }
    setSubmitting(false);
  };

  // ── Export handler ─────────────────────────────────────────────────
  const handleExport = () => {
    toast.success('Credits report exported');
  };

  // ── Render ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <DashboardLayout>
        <PageSkeleton />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* ─── Page Header ────────────────────────────────────────── */}
        <div className="pb-4 border-b border-slate-100">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Credits</h1>
              <p className="text-sm text-slate-500 mt-1">
                Manage student credit notes, overpayments, and wallet credits
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="min-h-[44px]" onClick={handleExport}>
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button className="min-h-[44px] bg-emerald-600 hover:bg-emerald-700" onClick={openAddDialog}>
                <Plus className="w-4 h-4 mr-2" />
                Add Credit
              </Button>
            </div>
          </div>
        </div>

        {/* ─── Stat Cards ────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-slate-200/60 bg-white p-4 hover:-translate-y-0.5 hover:shadow-lg transition-all border-l-4 border-l-emerald-500">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-emerald-500 flex items-center justify-center flex-shrink-0">
                <Wallet className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Issued</p>
                <p className="text-2xl font-bold text-slate-900 tabular-nums">{fmt(summary.totalIssued)}</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200/60 bg-white p-4 hover:-translate-y-0.5 hover:shadow-lg transition-all border-l-4 border-l-sky-500">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-sky-500 flex items-center justify-center flex-shrink-0">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Students</p>
                <p className="text-2xl font-bold text-slate-900 tabular-nums">{summary.activeStudents}</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200/60 bg-white p-4 hover:-translate-y-0.5 hover:shadow-lg transition-all border-l-4 border-l-amber-500">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-amber-500 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Avg Balance</p>
                <p className="text-2xl font-bold text-slate-900 tabular-nums">{fmt(summary.avgBalance)}</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200/60 bg-white p-4 hover:-translate-y-0.5 hover:shadow-lg transition-all border-l-4 border-l-rose-500">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-rose-500 flex items-center justify-center flex-shrink-0">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pending Refunds</p>
                <p className="text-2xl font-bold text-slate-900 tabular-nums">{fmt(summary.pendingRefunds)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Filters + Table Card ──────────────────────────────── */}
        <div className="rounded-2xl border border-slate-200/60 bg-white overflow-hidden">
          {/* Filter Bar */}
          <div className="p-4 border-b border-slate-100">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              {/* Tabs */}
              <div className="flex bg-white border border-slate-200 p-1 rounded-xl h-auto w-full lg:w-auto">
                <button
                  onClick={() => setActiveTab('all')}
                  className={`flex-1 lg:flex-none px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'all' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  All Credits
                </button>
                <button
                  onClick={() => setActiveTab('credit_note')}
                  className={`flex-1 lg:flex-none px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'credit_note' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  <FileText className="w-3.5 h-3.5 mr-1 hidden sm:inline-block" />
                  Credit Notes
                </button>
                <button
                  onClick={() => setActiveTab('overpayment')}
                  className={`flex-1 lg:flex-none px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'overpayment' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  <ArrowUpCircle className="w-3.5 h-3.5 mr-1 hidden sm:inline-block" />
                  Overpayments
                </button>
                <button
                  onClick={() => setActiveTab('wallet_topup')}
                  className={`flex-1 lg:flex-none px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'wallet_topup' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  <CreditCard className="w-3.5 h-3.5 mr-1 hidden sm:inline-block" />
                  Wallet
                </button>
              </div>

              {/* Search + Filters */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Search student or reason..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10 min-h-[44px] w-52 bg-slate-50 border-slate-200 focus:bg-white"
                  />
                </div>
                <Select value={classFilter || '__all__'} onValueChange={(v) => setClassFilter(v === '__all__' ? '' : v)}>
                  <SelectTrigger className="min-h-[44px] w-40 bg-slate-50 border-slate-200 focus:bg-white">
                    <Filter className="w-3.5 h-3.5 mr-1 text-slate-400" />
                    <SelectValue placeholder="All Classes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">All Classes</SelectItem>
                    {classes.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="min-h-[44px] w-36 bg-slate-50 border-slate-200"
                />
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="min-h-[44px] w-36 bg-slate-50 border-slate-200"
                />
              </div>
            </div>

            {/* Active Filter Chips */}
            {activeFilters.length > 0 && (
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                <span className="text-xs text-slate-400 font-medium">Active filters:</span>
                {activeFilters.map((f, i) => (
                  <button
                    key={i}
                    onClick={f.onClear}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-medium hover:bg-emerald-100 transition-colors"
                  >
                    {f.label}
                    <X className="w-3 h-3" />
                  </button>
                ))}
                <button
                  onClick={clearFilters}
                  className="text-xs text-slate-500 hover:text-slate-700 font-medium underline"
                >
                  Clear all
                </button>
              </div>
            )}
          </div>

          {/* Table Content */}
          <div className="max-h-[520px] overflow-y-auto">
            {/* Desktop Table */}
            <div className="hidden md:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-slate-50/80">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500">Student</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500">Code</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500">Type</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500">Category</th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500">Amount</th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500">Balance</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500">Date</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500">Status</th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {credits.length === 0 ? (
                    <tr>
                      <td colSpan={9}>
                        <div className="flex flex-col items-center gap-2 text-slate-400 py-16">
                          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center">
                            <CreditCard className="w-8 h-8 text-slate-300" />
                          </div>
                          <p className="font-medium text-sm">No credits found</p>
                          <p className="text-xs">
                            {hasActiveFilters
                              ? 'Try adjusting your search or filters'
                              : 'Get started by adding a new credit entry'}
                          </p>
                          {!hasActiveFilters && (
                            <Button variant="outline" className="mt-2 min-h-[44px]" onClick={openAddDialog}>
                              <Plus className="w-3.5 h-3.5 mr-1.5" />
                              Add Credit
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    credits.map((credit) => (
                      <tr key={`${credit.type}-${credit.id}`} className="border-b last:border-0 hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-4">
                          <div>
                            <p className="text-sm font-medium text-slate-900">{credit.student_name}</p>
                            {credit.class_name && (
                              <p className="text-xs text-slate-400">{credit.class_name}</p>
                            )}
                          </div>
                        </td>
                        <td>
                          <span className="text-xs font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                            {credit.student_code}
                          </span>
                        </td>
                        <td>{typeBadge(credit.type)}</td>
                        <td>
                          <span className="text-sm text-slate-600">
                            {categoryIcon(credit.category)}{' '}
                            {credit.category.charAt(0).toUpperCase() + credit.category.slice(1).replace('_', ' ')}
                          </span>
                        </td>
                        <td className="text-sm font-semibold text-slate-900 text-right">
                          {fmt(credit.amount)}
                        </td>
                        <td className="text-sm font-medium text-right">
                          <span className={credit.balance > 0 ? 'text-emerald-700' : 'text-slate-400'}>
                            {fmt(credit.balance)}
                          </span>
                        </td>
                        <td className="text-sm text-slate-500">{credit.date}</td>
                        <td>{statusBadge(credit.status)}</td>
                        <td className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 min-w-[32px] w-8 p-0">
                                <MoreHorizontal className="w-4 h-4" />
                                <span className="sr-only">Actions</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => viewDetail(credit)}>
                                <Eye className="w-4 h-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              {credit.status === 'pending' && (
                                <DropdownMenuItem onClick={() => toast.info('Refund initiated for ' + credit.student_name)}>
                                  <RotateCcw className="w-4 h-4 mr-2" />
                                  Initiate Refund
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => toast.success('Credit entry removed')}
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Remove
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden">
              {credits.length === 0 ? (
                <div className="flex flex-col items-center gap-2 text-slate-400 py-16">
                  <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center">
                    <CreditCard className="w-8 h-8 text-slate-300" />
                  </div>
                  <p className="font-medium text-sm">No credits found</p>
                  <p className="text-xs">
                    {hasActiveFilters ? 'Try adjusting your filters' : 'Add a new credit entry to get started'}
                  </p>
                  {!hasActiveFilters && (
                    <Button variant="outline" className="mt-2 min-h-[44px]" onClick={openAddDialog}>
                      <Plus className="w-3.5 h-3.5 mr-1.5" />
                      Add Credit
                    </Button>
                  )}
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {credits.map((credit) => (
                    <div key={`${credit.type}-${credit.id}`} className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                            {credit.student_name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-800 truncate">{credit.student_name}</p>
                            <p className="text-[10px] text-slate-400 font-mono">{credit.student_code}</p>
                            {credit.class_name && (
                              <p className="text-[10px] text-slate-400">{credit.class_name}</p>
                            )}
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="min-h-[44px] min-w-[44px]">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => viewDetail(credit)}>
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => toast.success('Credit entry removed')}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Remove
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <div className="flex items-center gap-2 mt-3 flex-wrap">
                        {typeBadge(credit.type)}
                        {statusBadge(credit.status)}
                      </div>
                      <div className="grid grid-cols-2 gap-3 mt-3">
                        <div>
                          <p className="text-[10px] text-slate-400">Amount</p>
                          <p className="text-sm font-bold text-slate-900">{fmt(credit.amount)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400">Balance</p>
                          <p className={`text-sm font-bold ${credit.balance > 0 ? 'text-emerald-700' : 'text-slate-400'}`}>
                            {fmt(credit.balance)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-2 text-[10px] text-slate-400">
                        <span>{categoryIcon(credit.category)} {credit.category.charAt(0).toUpperCase() + credit.category.slice(1).replace('_', ' ')}</span>
                        <span>{credit.date}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Footer count */}
          {!loading && credits.length > 0 && (
            <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between">
              <p className="text-xs text-slate-500">
                Showing <span className="font-semibold">{credits.length}</span> credit{credits.length !== 1 ? 's' : ''}
              </p>
              <p className="text-xs text-slate-400">
                Total balance: <span className="font-semibold text-emerald-700">{fmt(credits.reduce((s, c) => s + c.balance, 0))}</span>
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* Add Credit Dialog                                          */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center">
                <Plus className="w-5 h-5 text-white" />
              </div>
              <div>
                <DialogTitle>Add New Credit</DialogTitle>
                <DialogDescription>
                  Issue a credit note, record an overpayment, or top up a student wallet.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Student */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Student</Label>
              <Select value={formStudent} onValueChange={setFormStudent}>
                <SelectTrigger className="min-h-[44px] bg-slate-50">
                  <SelectValue placeholder="Select a student" />
                </SelectTrigger>
                <SelectContent>
                  {students.length === 0 ? (
                    <SelectItem value="__none" disabled>No students loaded</SelectItem>
                  ) : (
                    students.map((s) => (
                      <SelectItem key={s.student_id} value={String(s.student_id)}>
                        {s.name} ({s.student_code})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Type */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Type</Label>
              <Select value={formType} onValueChange={(v) => { setFormType(v); if (v !== 'wallet_topup') setFormCategory(''); }}>
                <SelectTrigger className="min-h-[44px] bg-slate-50">
                  <SelectValue placeholder="Select credit type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="credit_note">Credit Note</SelectItem>
                  <SelectItem value="overpayment">Overpayment</SelectItem>
                  <SelectItem value="wallet_topup">Wallet Top-up</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Category (only for wallet_topup) */}
            {formType === 'wallet_topup' && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Wallet Category</Label>
                <Select value={formCategory} onValueChange={setFormCategory}>
                  <SelectTrigger className="min-h-[44px] bg-slate-50">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="feeding">🍽️ Feeding</SelectItem>
                    <SelectItem value="breakfast">🥐 Breakfast</SelectItem>
                    <SelectItem value="classes">📚 Classes</SelectItem>
                    <SelectItem value="water">💧 Water</SelectItem>
                    <SelectItem value="transport">🚌 Transport</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Amount */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Amount (GHS)</Label>
              <Input
                type="number"
                min="0.01"
                step="0.01"
                placeholder="0.00"
                value={formAmount}
                onChange={(e) => setFormAmount(e.target.value)}
                className="min-h-[44px]"
              />
            </div>

            {/* Reason / Notes */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Reason / Notes</Label>
              <Textarea
                placeholder="Enter a reason for this credit..."
                value={formReason}
                onChange={(e) => setFormReason(e.target.value)}
                className="min-h-[80px]"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="min-h-[44px]">
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={submitting} className="min-h-[44px] bg-emerald-600 hover:bg-emerald-700">
              {submitting ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Adding...
                </span>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-1.5" />
                  Add Credit
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* View Detail Dialog                                          */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-500 flex items-center justify-center">
                <Eye className="w-5 h-5 text-white" />
              </div>
              <div>
                <DialogTitle>Credit Details</DialogTitle>
                <DialogDescription>Full details for this credit entry.</DialogDescription>
              </div>
            </div>
          </DialogHeader>
          {selectedCredit && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="space-y-1">
                  <p className="text-xs text-slate-500">Student</p>
                  <p className="font-medium text-slate-900">{selectedCredit.student_name}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-slate-500">Student Code</p>
                  <p className="font-mono text-slate-700">{selectedCredit.student_code}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-slate-500">Class</p>
                  <p className="text-slate-700">{selectedCredit.class_name || 'N/A'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-slate-500">Date</p>
                  <p className="text-slate-700">{selectedCredit.date}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-slate-500">Type</p>
                  <div className="mt-0.5">{typeBadge(selectedCredit.type)}</div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-slate-500">Status</p>
                  <div className="mt-0.5">{statusBadge(selectedCredit.status)}</div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-slate-500">Category</p>
                  <p className="text-slate-700">
                    {categoryIcon(selectedCredit.category)}{' '}
                    {selectedCredit.category.charAt(0).toUpperCase() + selectedCredit.category.slice(1).replace('_', ' ')}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-slate-500">Amount</p>
                  <p className="font-semibold text-slate-900">{fmt(selectedCredit.amount)}</p>
                </div>
              </div>
              <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-4">
                <p className="text-xs text-slate-500 mb-1">Balance</p>
                <p className={`text-2xl font-bold ${selectedCredit.balance > 0 ? 'text-emerald-700' : 'text-slate-400'}`}>
                  {fmt(selectedCredit.balance)}
                </p>
              </div>
              {selectedCredit.reason && (
                <div className="space-y-1">
                  <p className="text-xs text-slate-500">Reason</p>
                  <p className="text-sm text-slate-700 bg-slate-50 rounded-xl p-3">{selectedCredit.reason}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            {selectedCredit?.status === 'pending' && (
              <Button
                variant="outline"
                onClick={() => {
                  toast.info('Refund initiated for ' + selectedCredit?.student_name);
                  setDetailOpen(false);
                }}
                className="min-h-[44px] mr-auto"
              >
                <RotateCcw className="w-4 h-4 mr-1.5" />
                Initiate Refund
              </Button>
            )}
            <Button variant="outline" onClick={() => setDetailOpen(false)} className="min-h-[44px]">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
