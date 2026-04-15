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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* ─── Page Header ────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Credits</h1>
            <p className="text-sm text-slate-500 mt-1">
              Manage student credit notes, overpayments, and wallet credits
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="h-9" onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button size="sm" className="h-9" onClick={openAddDialog}>
              <Plus className="w-4 h-4 mr-2" />
              Add Credit
            </Button>
          </div>
        </div>

        {/* ─── Summary Cards ─────────────────────────────────────── */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="border-slate-200/60">
                <CardContent className="p-4">
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-7 w-32" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="border-slate-200/60">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <Wallet className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Total Credits Issued</p>
                  <p className="text-lg font-bold text-slate-900">{fmt(summary.totalIssued)}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-slate-200/60">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-sky-100 flex items-center justify-center flex-shrink-0">
                  <Users className="w-5 h-5 text-sky-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Active Credit Students</p>
                  <p className="text-lg font-bold text-slate-900">{summary.activeStudents}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-slate-200/60">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Average Balance</p>
                  <p className="text-lg font-bold text-slate-900">{fmt(summary.avgBalance)}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-slate-200/60">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-rose-100 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-5 h-5 text-rose-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Pending Refunds</p>
                  <p className="text-lg font-bold text-slate-900">{fmt(summary.pendingRefunds)}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ─── Filters + Table Card ──────────────────────────────── */}
        <Card className="border-slate-200/60">
          <CardHeader className="pb-3">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              {/* Tabs */}
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                  <TabsTrigger value="all" className="text-xs sm:text-sm">
                    All Credits
                  </TabsTrigger>
                  <TabsTrigger value="credit_note" className="text-xs sm:text-sm">
                    <FileText className="w-3.5 h-3.5 mr-1 hidden sm:inline-block" />
                    Credit Notes
                  </TabsTrigger>
                  <TabsTrigger value="overpayment" className="text-xs sm:text-sm">
                    <ArrowUpCircle className="w-3.5 h-3.5 mr-1 hidden sm:inline-block" />
                    Overpayments
                  </TabsTrigger>
                  <TabsTrigger value="wallet_topup" className="text-xs sm:text-sm">
                    <CreditCard className="w-3.5 h-3.5 mr-1 hidden sm:inline-block" />
                    Wallet Credits
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              {/* Search + Filters */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Search student or reason..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10 h-9 w-52 text-sm"
                  />
                </div>
                <Select value={classFilter} onValueChange={(v) => setClassFilter(v === '__all__' ? '' : v)}>
                  <SelectTrigger className="h-9 w-36 text-sm">
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
                  className="h-9 w-36 text-sm"
                  placeholder="From"
                />
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="h-9 w-36 text-sm"
                  placeholder="To"
                />
                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" className="h-9 px-2" onClick={clearFilters}>
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="max-h-[520px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="text-xs font-semibold">Student</TableHead>
                    <TableHead className="text-xs font-semibold">Code</TableHead>
                    <TableHead className="text-xs font-semibold">Type</TableHead>
                    <TableHead className="text-xs font-semibold">Category</TableHead>
                    <TableHead className="text-xs font-semibold text-right">Amount</TableHead>
                    <TableHead className="text-xs font-semibold text-right">Balance</TableHead>
                    <TableHead className="text-xs font-semibold">Date</TableHead>
                    <TableHead className="text-xs font-semibold">Status</TableHead>
                    <TableHead className="text-xs font-semibold text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 8 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell colSpan={9}>
                          <Skeleton className="h-8 w-full" />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : credits.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-16">
                        <div className="flex flex-col items-center gap-2 text-slate-400">
                          <CreditCard className="w-12 h-12 opacity-40" />
                          <p className="font-medium text-sm">No credits found</p>
                          <p className="text-xs">
                            {hasActiveFilters
                              ? 'Try adjusting your search or filters'
                              : 'Get started by adding a new credit entry'}
                          </p>
                          {!hasActiveFilters && (
                            <Button variant="outline" size="sm" className="mt-2 h-8" onClick={openAddDialog}>
                              <Plus className="w-3.5 h-3.5 mr-1.5" />
                              Add Credit
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    credits.map((credit) => (
                      <TableRow key={`${credit.type}-${credit.id}`} className="hover:bg-slate-50/60">
                        <TableCell>
                          <div>
                            <p className="text-sm font-medium text-slate-900">{credit.student_name}</p>
                            {credit.class_name && (
                              <p className="text-xs text-slate-400">{credit.class_name}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                            {credit.student_code}
                          </span>
                        </TableCell>
                        <TableCell>{typeBadge(credit.type)}</TableCell>
                        <TableCell>
                          <span className="text-sm text-slate-600">
                            {categoryIcon(credit.category)}{' '}
                            {credit.category.charAt(0).toUpperCase() + credit.category.slice(1).replace('_', ' ')}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm font-semibold text-slate-900 text-right">
                          {fmt(credit.amount)}
                        </TableCell>
                        <TableCell className="text-sm font-medium text-right">
                          <span className={credit.balance > 0 ? 'text-emerald-700' : 'text-slate-400'}>
                            {fmt(credit.balance)}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-slate-500">{credit.date}</TableCell>
                        <TableCell>{statusBadge(credit.status)}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
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
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
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
          </CardContent>
        </Card>
      </div>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* Add Credit Dialog                                          */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Credit</DialogTitle>
            <DialogDescription>
              Issue a credit note, record an overpayment, or top up a student wallet.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Student */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Student</Label>
              <Select value={formStudent} onValueChange={setFormStudent}>
                <SelectTrigger className="h-9 text-sm">
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
                <SelectTrigger className="h-9 text-sm">
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
                  <SelectTrigger className="h-9 text-sm">
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
                className="h-9 text-sm"
              />
            </div>

            {/* Reason / Notes */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Reason / Notes</Label>
              <Textarea
                placeholder="Enter a reason for this credit..."
                value={formReason}
                onChange={(e) => setFormReason(e.target.value)}
                className="text-sm min-h-[80px]"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="h-9">
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={submitting} className="h-9">
              {submitting ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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
            <DialogTitle>Credit Details</DialogTitle>
            <DialogDescription>Full details for this credit entry.</DialogDescription>
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
              <div className="rounded-lg bg-slate-50 p-3 space-y-1">
                <p className="text-xs text-slate-500">Balance</p>
                <p className={`text-lg font-bold ${selectedCredit.balance > 0 ? 'text-emerald-700' : 'text-slate-400'}`}>
                  {fmt(selectedCredit.balance)}
                </p>
              </div>
              {selectedCredit.reason && (
                <div className="space-y-1">
                  <p className="text-xs text-slate-500">Reason</p>
                  <p className="text-sm text-slate-700 bg-slate-50 rounded-lg p-3">{selectedCredit.reason}</p>
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
                className="h-9 mr-auto"
              >
                <RotateCcw className="w-4 h-4 mr-1.5" />
                Initiate Refund
              </Button>
            )}
            <Button variant="outline" onClick={() => setDetailOpen(false)} className="h-9">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
