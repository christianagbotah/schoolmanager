'use client';

import { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import {
  FileText, CheckCircle, XCircle, Clock, BarChart3, Download, Search, Filter,
  ChevronLeft, ChevronRight, Eye, Users, Award, TrendingUp, Printer, MoreHorizontal,
} from 'lucide-react';
import Link from 'next/link';

// ─── Types ──────────────────────────────────────────────────────

interface PortfolioItem {
  student_id: number;
  student_code: string;
  student_name: string;
  sex: string;
  class_id: number | null;
  class_name: string;
  term: string;
  year: string;
  overallScore: number;
  grade: string;
  status: string;
  subjectCount: number;
  avgSubjectScore: number;
}

interface FilterOption {
  term_id?: number;
  name: string;
  class_id?: number;
}

interface StatisticsData {
  total: number;
  draft: number;
  submitted: number;
  reviewed: number;
  avgScore: number;
  passRate: number;
  distinctionRate: number;
  gradeDistribution: { grade: string; count: number; percentage: number }[];
  topPerformers: { student_id: number; student_name: string; student_code: string; overallScore: number; grade: string }[];
}

// ─── Helpers ────────────────────────────────────────────────────

function statusColor(status: string) {
  switch (status) {
    case 'reviewed': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    case 'submitted': return 'bg-amber-100 text-amber-700 border-amber-200';
    case 'draft': return 'bg-slate-100 text-slate-500 border-slate-200';
    default: return 'bg-slate-100 text-slate-500 border-slate-200';
  }
}

function statusIcon(status: string) {
  switch (status) {
    case 'reviewed': return <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />;
    case 'submitted': return <Clock className="w-3.5 h-3.5 text-amber-600" />;
    case 'draft': return <FileText className="w-3.5 h-3.5 text-slate-400" />;
    default: return <FileText className="w-3.5 h-3.5 text-slate-400" />;
  }
}

function scoreColor(score: number) {
  if (score >= 80) return 'text-emerald-600';
  if (score >= 60) return 'text-sky-600';
  if (score >= 50) return 'text-amber-600';
  return 'text-red-600';
}

function scoreBarColor(score: number) {
  if (score >= 80) return 'bg-emerald-500';
  if (score >= 60) return 'bg-sky-500';
  if (score >= 50) return 'bg-amber-500';
  return 'bg-red-500';
}

function gradeBadgeColor(grade: string) {
  const g = grade.toUpperCase();
  if (g === 'A' || g === 'A+') return 'bg-emerald-100 text-emerald-700 border-emerald-200';
  if (g === 'B' || g === 'B+') return 'bg-sky-100 text-sky-700 border-sky-200';
  if (g === 'C' || g === 'C+') return 'bg-amber-100 text-amber-700 border-amber-200';
  if (g === 'D') return 'bg-orange-100 text-orange-700 border-orange-200';
  return 'bg-red-100 text-red-700 border-red-200';
}

// ─── Main Page ──────────────────────────────────────────────────

export default function PortfolioPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [portfolios, setPortfolios] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [termFilter, setTermFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Filter options
  const [classes, setClasses] = useState<FilterOption[]>([]);
  const [terms, setTerms] = useState<FilterOption[]>([]);

  // Statistics
  const [statistics, setStatistics] = useState<StatisticsData | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // Selection for bulk actions
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  // Detail modal
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailData, setDetailData] = useState<Record<string, unknown> | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Remarks dialog
  const [remarksOpen, setRemarksOpen] = useState(false);
  const [remarksText, setRemarksText] = useState('');
  const [remarksSaving, setRemarksSaving] = useState(false);

  // ─── Fetch portfolios ────────────────────────────────────────
  const fetchPortfolios = useCallback(async () => {
    if (activeTab === 'statistics') return;

    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (classFilter) params.set('classId', classFilter);
      if (termFilter) params.set('term', termFilter);
      if (statusFilter) params.set('status', statusFilter);
      params.set('tab', activeTab);
      params.set('page', String(page));
      params.set('limit', '15');

      const res = await fetch(`/api/admin/portfolio?${params}`);
      const data = await res.json();

      if (data.portfolios) {
        setPortfolios(data.portfolios);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotal(data.pagination?.total || 0);
      } else if (data.statistics) {
        setStatistics(data.statistics);
      }

      if (data.filters) {
        setClasses(data.filters.classes || []);
        if (terms.length === 0 && data.filters.terms) {
          setTerms(data.filters.terms);
        }
      }
    } catch {
      toast.error('Failed to load portfolios');
    } finally {
      setLoading(false);
    }
  }, [search, classFilter, termFilter, statusFilter, activeTab, page, terms.length]);

  useEffect(() => { fetchPortfolios(); }, [fetchPortfolios]);

  // Reset page on filter change
  useEffect(() => { setPage(1); }, [classFilter, termFilter, statusFilter, activeTab]);
  useEffect(() => {
    const timer = setTimeout(() => { setPage(1); }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  // ─── Fetch statistics ────────────────────────────────────────
  const fetchStatistics = useCallback(async () => {
    setStatsLoading(true);
    try {
      const params = new URLSearchParams({ tab: 'statistics' });
      if (classFilter) params.set('classId', classFilter);
      if (termFilter) params.set('term', termFilter);
      const res = await fetch(`/api/admin/portfolio?${params}`);
      const data = await res.json();
      if (data.statistics) setStatistics(data.statistics);
    } catch {
      toast.error('Failed to load statistics');
    } finally {
      setStatsLoading(false);
    }
  }, [classFilter, termFilter]);

  // ─── Tab change ──────────────────────────────────────────────
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setSelectedIds.clear();
    if (tab === 'statistics') fetchStatistics();
  };

  // ─── View detail ─────────────────────────────────────────────
  const viewDetail = async (studentId: number) => {
    setDetailOpen(true);
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/admin/portfolio/${studentId}`);
      const data = await res.json();
      setDetailData(data);
    } catch {
      toast.error('Failed to load portfolio detail');
    } finally {
      setDetailLoading(false);
    }
  };

  // ─── Export CSV ──────────────────────────────────────────────
  const handleExportCSV = () => {
    const headers = ['Student Code', 'Student Name', 'Class', 'Term', 'Year', 'Overall Score', 'Grade', 'Status', 'Subjects'];
    const rows = portfolios.map(p => [
      p.student_code, p.student_name, p.class_name, p.term, p.year,
      String(p.overallScore), p.grade, p.status, String(p.subjectCount),
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `portfolios-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exported successfully');
  };

  // ─── Bulk actions ────────────────────────────────────────────
  const handleBulkAction = async (action: string) => {
    if (selectedIds.size === 0) {
      toast.error('No portfolios selected');
      return;
    }
    if (action === 'review') {
      setRemarksOpen(true);
      return;
    }

    try {
      const res = await fetch('/api/admin/portfolio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'bulk_review',
          portfolioIds: Array.from(selectedIds),
          remarks: action === 'approve' ? 'Approved' : action === 'reject' ? 'Needs revision' : 'Reviewed by admin',
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast.success(data.message);
      setSelectedIds.clear();
      fetchPortfolios();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Bulk action failed');
    }
  };

  const handleSaveRemarks = async () => {
    setRemarksSaving(true);
    try {
      const res = await fetch('/api/admin/portfolio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'bulk_review',
          portfolioIds: Array.from(selectedIds),
          remarks: remarksText || 'Reviewed by admin',
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast.success(data.message);
      setRemarksOpen(false);
      setRemarksText('');
      setSelectedIds.clear();
      fetchPortfolios();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to save remarks');
    } finally {
      setRemarksSaving(false);
    }
  };

  // ─── Toggle selection ────────────────────────────────────────
  const toggleSelect = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === portfolios.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(portfolios.map(p => p.student_id)));
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* ─── Header ─────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <FileText className="w-6 h-6 text-emerald-600" />
              Portfolio / SBA
            </h1>
            <p className="text-sm text-slate-500 mt-1">Manage school-based assessment portfolios</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExportCSV} className="border-emerald-200 text-emerald-700 hover:bg-emerald-50">
              <Download className="w-4 h-4 mr-2" />Export CSV
            </Button>
            <Link href="/admin/portfolio">
              <Button variant="outline" className="border-slate-200 text-slate-600 hover:bg-slate-50">
                <Printer className="w-4 h-4 mr-2" />Print
              </Button>
            </Link>
          </div>
        </div>

        {/* ─── Tabs ───────────────────────────────────────────── */}
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <TabsList className="flex-wrap gap-1">
              <TabsTrigger value="all"><FileText className="w-4 h-4 mr-1.5" />All Portfolios</TabsTrigger>
              <TabsTrigger value="pending"><Clock className="w-4 h-4 mr-1.5" />Pending Review</TabsTrigger>
              <TabsTrigger value="reviewed"><CheckCircle className="w-4 h-4 mr-1.5" />Reviewed</TabsTrigger>
              <TabsTrigger value="statistics"><BarChart3 className="w-4 h-4 mr-1.5" />Statistics</TabsTrigger>
            </TabsList>

            {selectedIds.size > 0 && (
              <div className="flex items-center gap-2 print:hidden">
                <span className="text-xs text-slate-500 font-medium">{selectedIds.size} selected</span>
                <Button size="sm" variant="outline" className="h-8 text-xs border-emerald-200 text-emerald-700" onClick={() => handleBulkAction('review')}>
                  <CheckCircle className="w-3 h-3 mr-1" />Approve
                </Button>
                <Button size="sm" variant="outline" className="h-8 text-xs border-amber-200 text-amber-700" onClick={() => handleBulkAction('reject')}>
                  <XCircle className="w-3 h-3 mr-1" />Reject
                </Button>
                <Button size="sm" variant="outline" className="h-8 text-xs border-sky-200 text-sky-700" onClick={() => handleBulkAction('review')}>
                  <FileText className="w-3 h-3 mr-1" />Add Remarks
                </Button>
              </div>
            )}
          </div>

          {/* ─── ALL / PENDING / REVIEWED TABS ─────────────────── */}
          {['all', 'pending', 'reviewed'].includes(activeTab) && (
            <>
              {/* Filters */}
              <Card className="mt-4">
                <CardContent className="p-4">
                  <div className="flex flex-col lg:flex-row gap-3">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input
                        placeholder="Search by student name or code..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Select value={classFilter} onValueChange={(v) => v === '__all__' ? setClassFilter('') : setClassFilter(v)}>
                        <SelectTrigger className="w-full lg:w-44"><SelectValue placeholder="All Classes" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__all__">All Classes</SelectItem>
                          {classes.map(c => (
                            <SelectItem key={c.class_id} value={String(c.class_id)}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select value={termFilter} onValueChange={(v) => v === '__all__' ? setTermFilter('') : setTermFilter(v)}>
                        <SelectTrigger className="w-full lg:w-40"><SelectValue placeholder="All Terms" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__all__">All Terms</SelectItem>
                          {terms.map(t => (
                            <SelectItem key={t.term_id} value={t.name}>{t.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select value={statusFilter} onValueChange={(v) => v === '__all__' ? setStatusFilter('') : setStatusFilter(v)}>
                        <SelectTrigger className="w-full lg:w-40"><SelectValue placeholder="All Status" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__all__">All Status</SelectItem>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="submitted">Submitted</SelectItem>
                          <SelectItem value="reviewed">Reviewed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Table */}
              <TabsContent value={activeTab} className="mt-4">
                <Card>
                  <CardContent className="p-0">
                    {/* Desktop Table */}
                    <div className="hidden md:block">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-slate-50">
                            <TableHead className="w-10">
                              <Checkbox
                                checked={portfolios.length > 0 && selectedIds.size === portfolios.length}
                                onCheckedChange={toggleSelectAll}
                              />
                            </TableHead>
                            <TableHead className="text-xs font-semibold">Student</TableHead>
                            <TableHead className="text-xs font-semibold">Class</TableHead>
                            <TableHead className="text-xs font-semibold">Term</TableHead>
                            <TableHead className="text-xs font-semibold text-center">Score</TableHead>
                            <TableHead className="text-xs font-semibold text-center">Grade</TableHead>
                            <TableHead className="text-xs font-semibold text-center">Status</TableHead>
                            <TableHead className="text-xs font-semibold text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {loading ? (
                            Array.from({ length: 8 }).map((_, i) => (
                              <TableRow key={i}>
                                {Array.from({ length: 8 }).map((_, j) => (
                                  <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                                ))}
                              </TableRow>
                            ))
                          ) : portfolios.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={8} className="text-center py-12 text-slate-400">
                                <FileText className="w-10 h-10 mx-auto mb-2 opacity-50" />
                                <p>No portfolios found</p>
                                <p className="text-xs mt-1">Portfolio scores will appear once teachers record SBA assessments</p>
                              </TableCell>
                            </TableRow>
                          ) : (
                            portfolios.map((p) => (
                              <TableRow key={`${p.student_id}-${p.class_id}-${p.term}`} className="hover:bg-slate-50/50">
                                <TableCell>
                                  <Checkbox
                                    checked={selectedIds.has(p.student_id)}
                                    onCheckedChange={() => toggleSelect(p.student_id)}
                                  />
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                                      p.overallScore >= 80 ? 'bg-emerald-100 text-emerald-700' :
                                      p.overallScore >= 60 ? 'bg-sky-100 text-sky-700' :
                                      p.overallScore >= 50 ? 'bg-amber-100 text-amber-700' :
                                      'bg-red-100 text-red-700'
                                    }`}>
                                      {p.student_name.charAt(0)}
                                    </div>
                                    <div>
                                      <p className="text-sm font-medium">{p.student_name}</p>
                                      <p className="text-xs text-slate-400 font-mono">{p.student_code}</p>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell className="text-sm">{p.class_name}</TableCell>
                                <TableCell className="text-sm text-slate-500">{p.term || '—'}</TableCell>
                                <TableCell className="text-center">
                                  <span className={`text-sm font-bold ${scoreColor(p.overallScore)}`}>{p.overallScore}%</span>
                                </TableCell>
                                <TableCell className="text-center">
                                  <Badge variant="outline" className={`text-xs font-bold ${gradeBadgeColor(p.grade)}`}>{p.grade}</Badge>
                                </TableCell>
                                <TableCell className="text-center">
                                  <Badge variant="outline" className={`text-xs capitalize flex items-center gap-1 w-fit mx-auto ${statusColor(p.status)}`}>
                                    {statusIcon(p.status)} {p.status}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex items-center justify-end gap-1">
                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => viewDetail(p.student_id)} title="View Details">
                                      <Eye className="w-3.5 h-3.5" />
                                    </Button>
                                    <Link href={`/admin/portfolio/${p.student_id}`}>
                                      <Button variant="ghost" size="icon" className="h-8 w-8" title="Full Portfolio">
                                        <MoreHorizontal className="w-3.5 h-3.5" />
                                      </Button>
                                    </Link>
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
                          <div key={i} className="p-4 space-y-2"><Skeleton className="h-4 w-3/4" /><Skeleton className="h-3 w-1/2" /></div>
                        ))
                      ) : portfolios.length === 0 ? (
                        <div className="text-center py-12 text-slate-400">
                          <FileText className="w-10 h-10 mx-auto mb-2 opacity-50" />
                          <p>No portfolios found</p>
                        </div>
                      ) : (
                        portfolios.map((p) => (
                          <div key={`${p.student_id}-${p.class_id}-${p.term}`} className="p-4 space-y-2">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-2">
                                <Checkbox
                                  checked={selectedIds.has(p.student_id)}
                                  onCheckedChange={() => toggleSelect(p.student_id)}
                                />
                                <div>
                                  <p className="font-medium text-sm">{p.student_name}</p>
                                  <p className="text-xs text-slate-400 font-mono">{p.student_code}</p>
                                </div>
                              </div>
                              <Badge variant="outline" className={`text-[10px] capitalize ${statusColor(p.status)}`}>
                                {statusIcon(p.status)} {p.status}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-slate-500 pl-7">
                              <span>{p.class_name}</span>
                              <span>|</span>
                              <span>{p.term || '—'}</span>
                              <span>|</span>
                              <span className={scoreColor(p.overallScore)}>{p.overallScore}%</span>
                              <Badge variant="outline" className={`text-[10px] ${gradeBadgeColor(p.grade)}`}>{p.grade}</Badge>
                            </div>
                            <div className="flex gap-2 pl-7 pt-1">
                              <Button variant="outline" size="sm" className="flex-1 h-8 text-xs" onClick={() => viewDetail(p.student_id)}>
                                <Eye className="w-3 h-3 mr-1" />View
                              </Button>
                              <Link href={`/admin/portfolio/${p.student_id}`}>
                                <Button variant="outline" size="sm" className="h-8 text-xs">Full</Button>
                              </Link>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-between px-4 py-3 border-t">
                        <p className="text-xs text-slate-500">{total} portfolio(s)</p>
                        <div className="flex items-center gap-1">
                          <Button variant="outline" size="icon" className="h-8 w-8" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                            <ChevronLeft className="w-4 h-4" />
                          </Button>
                          <span className="text-sm px-2">{page} / {totalPages}</span>
                          <Button variant="outline" size="icon" className="h-8 w-8" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                            <ChevronRight className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </>
          )}

          {/* ─── STATISTICS TAB ────────────────────────────────── */}
          <TabsContent value="statistics" className="mt-6 space-y-6">
            {statsLoading ? (
              <>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Card key={i}><CardContent className="p-4"><Skeleton className="h-16 w-full" /></CardContent></Card>
                  ))}
                </div>
                <Card><CardContent className="p-4"><Skeleton className="h-64 w-full" /></CardContent></Card>
              </>
            ) : statistics ? (
              <>
                {/* Summary Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card className="border-emerald-100"><CardContent className="p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center"><Users className="w-5 h-5 text-emerald-600" /></div>
                    <div><p className="text-xs text-slate-500">Total Portfolios</p><p className="text-xl font-bold text-slate-900">{statistics.total}</p></div>
                  </CardContent></Card>
                  <Card className="border-amber-100"><CardContent className="p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center"><Clock className="w-5 h-5 text-amber-600" /></div>
                    <div><p className="text-xs text-slate-500">Pending Review</p><p className="text-xl font-bold text-amber-700">{statistics.submitted}</p></div>
                  </CardContent></Card>
                  <Card className="border-emerald-100"><CardContent className="p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center"><CheckCircle className="w-5 h-5 text-emerald-600" /></div>
                    <div><p className="text-xs text-slate-500">Reviewed</p><p className="text-xl font-bold text-emerald-700">{statistics.reviewed}</p></div>
                  </CardContent></Card>
                  <Card className="border-sky-100"><CardContent className="p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-sky-100 flex items-center justify-center"><TrendingUp className="w-5 h-5 text-sky-600" /></div>
                    <div><p className="text-xs text-slate-500">Average Score</p><p className={`text-xl font-bold ${scoreColor(statistics.avgScore)}`}>{statistics.avgScore}%</p></div>
                  </CardContent></Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Grade Distribution */}
                  <Card>
                    <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><BarChart3 className="w-5 h-5 text-emerald-600" />Grade Distribution</CardTitle></CardHeader>
                    <CardContent>
                      {statistics.gradeDistribution.length === 0 ? (
                        <p className="text-center text-slate-400 py-8 text-sm">No grade data available</p>
                      ) : (
                        <div className="space-y-3">
                          {statistics.gradeDistribution.map((g) => (
                            <div key={g.grade} className="flex items-center gap-3">
                              <span className="w-10 text-sm font-medium text-slate-700 flex-shrink-0">{g.grade}</span>
                              <div className="flex-1 h-7 bg-slate-100 rounded overflow-hidden relative">
                                <div
                                  className={`h-full rounded transition-all duration-500 ${gradeBarColor2(g.grade)}`}
                                  style={{ width: `${Math.max(g.percentage, 2)}%` }}
                                />
                                <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white mix-blend-difference">{g.count}</span>
                              </div>
                              <span className="w-14 text-xs text-slate-500 text-right flex-shrink-0">{g.percentage.toFixed(1)}%</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Pass/Rate Stats */}
                  <Card>
                    <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Award className="w-5 h-5 text-amber-600" />Performance Overview</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-slate-600">Pass Rate (≥50%)</span>
                          <span className="font-bold text-emerald-600">{statistics.passRate}%</span>
                        </div>
                        <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${statistics.passRate}%` }} />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-slate-600">Distinction Rate (≥80%)</span>
                          <span className="font-bold text-amber-600">{statistics.distinctionRate}%</span>
                        </div>
                        <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-amber-500 rounded-full transition-all duration-500" style={{ width: `${statistics.distinctionRate}%` }} />
                        </div>
                      </div>
                      <div className="pt-2 border-t space-y-2">
                        <div className="flex justify-between text-sm"><span className="text-slate-500">Draft</span><span className="font-medium">{statistics.draft}</span></div>
                        <div className="flex justify-between text-sm"><span className="text-slate-500">Submitted</span><span className="font-medium text-amber-600">{statistics.submitted}</span></div>
                        <div className="flex justify-between text-sm"><span className="text-slate-500">Reviewed</span><span className="font-medium text-emerald-600">{statistics.reviewed}</span></div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Top Performers */}
                {statistics.topPerformers.length > 0 && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2"><Award className="w-5 h-5 text-amber-500" />Top 10 Performers</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-slate-50">
                            <TableHead className="w-12">#</TableHead>
                            <TableHead>Student</TableHead>
                            <TableHead className="text-center">Score</TableHead>
                            <TableHead className="text-center">Grade</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {statistics.topPerformers.map((s, i) => (
                            <TableRow key={s.student_id} className="hover:bg-slate-50/50 cursor-pointer" onClick={() => viewDetail(s.student_id)}>
                              <TableCell>
                                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${i < 3 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
                                  {i + 1}
                                </span>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${scoreBarColor2(s.overallScore)}`}>
                                    {s.student_name.charAt(0)}
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium">{s.student_name}</p>
                                    <p className="text-xs text-slate-400 font-mono">{s.student_code}</p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="text-center">
                                <span className={`text-sm font-bold ${scoreColor(s.overallScore)}`}>{s.overallScore}%</span>
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge variant="outline" className={`text-xs font-bold ${gradeBadgeColor(s.grade)}`}>{s.grade}</Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <Card><CardContent className="py-12 text-center text-slate-400">
                <BarChart3 className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p>No statistics available</p>
              </CardContent></Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* ─── Detail Modal ──────────────────────────────────────── */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-600" />
              Portfolio Detail
            </DialogTitle>
          </DialogHeader>

          {detailLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : detailData ? (
            <div className="space-y-4">
              {/* Student Info */}
              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg">
                <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center text-xl font-bold text-emerald-700">
                  {(detailData.student as Record<string, string>)?.name?.charAt(0) || 'S'}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-slate-900">{(detailData.student as Record<string, string>)?.name}</h3>
                  <p className="text-sm text-slate-500">
                    {(detailData.enrollment as Record<string, Record<string, string>>)?.class?.name || 'No class'} &middot;
                    Term: {(detailData.enrollment as Record<string, string>)?.term || '—'} &middot;
                    {(detailData.cumulative as Record<string, string>)?.status || 'draft'}
                  </p>
                </div>
                <div className="text-right">
                  <p className={`text-2xl font-bold ${scoreColor((detailData.cumulative as Record<string, number>)?.overallScore || 0)}`}>
                    {(detailData.cumulative as Record<string, number>)?.overallScore || 0}%
                  </p>
                  <Badge variant="outline" className={gradeBadgeColor((detailData.cumulative as Record<string, string>)?.grade || 'N/A')}>
                    {(detailData.cumulative as Record<string, string>)?.grade || 'N/A'}
                  </Badge>
                </div>
              </div>

              {/* Score Distribution */}
              {(detailData.scoreDistribution as Array<Record<string, number>>)?.length > 0 && (
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-slate-700">Score Distribution</CardTitle></CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="flex items-end gap-2 h-24">
                      {(detailData.scoreDistribution as Array<Record<string, number>>).map((d) => (
                        <div key={d.range} className="flex-1 flex flex-col items-center gap-1">
                          <span className="text-[10px] text-slate-500 font-medium">{d.count}</span>
                          <div
                            className="w-full rounded-t transition-all duration-500"
                            style={{
                              height: `${Math.max(d.percentage, 5)}%`,
                              backgroundColor: d.percentage > 30 ? '#10b981' : d.percentage > 15 ? '#f59e0b' : '#ef4444',
                              minHeight: '4px',
                            }}
                          />
                          <span className="text-[10px] text-slate-400">{d.range}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Subjects Breakdown */}
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-slate-700">Subject Performance</CardTitle></CardHeader>
                <CardContent className="p-0">
                  <div className="max-h-64 overflow-y-auto">
                    {(detailData.subjects as Array<Record<string, unknown>>)?.map((subj: Record<string, unknown>) => (
                      <div key={subj.subject_id} className="flex items-center gap-3 px-4 py-3 border-b last:border-0">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{String(subj.subject_name)}</p>
                          <p className="text-xs text-slate-400">{Number(subj.subjectCount || 0)} assessments</p>
                        </div>
                        <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden flex-shrink-0">
                          <div
                            className={`h-full rounded-full ${scoreBarColor(Number(subj.weightedScore || 0))}`}
                            style={{ width: `${Math.max(Number(subj.weightedScore || 0), 2)}%` }}
                          />
                        </div>
                        <span className={`text-sm font-bold w-12 text-right flex-shrink-0 ${scoreColor(Number(subj.weightedScore || 0))}`}>
                          {Number(subj.weightedScore || 0)}%
                        </span>
                        <Badge variant="outline" className={`text-[10px] w-8 justify-center flex-shrink-0 ${gradeBadgeColor(String(subj.grade || 'N/A'))}`}>
                          {String(subj.grade || 'N/A')}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2 border-t">
                <Link href={`/admin/portfolio/${(detailData.student as Record<string, number>)?.student_id}`} className="flex-1">
                  <Button className="w-full bg-emerald-600 hover:bg-emerald-700">
                    <Eye className="w-4 h-4 mr-2" />View Full Portfolio
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <p className="text-center text-slate-400 py-8">No data available</p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Remarks Dialog ────────────────────────────────────── */}
      <Dialog open={remarksOpen} onOpenChange={setRemarksOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-sky-600" />
              Add Review Remarks
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-slate-500">Add review remarks to {selectedIds.size} selected portfolio(s)</p>
            <Textarea
              placeholder="Enter review remarks..."
              value={remarksText}
              onChange={(e) => setRemarksText(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRemarksOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveRemarks} disabled={remarksSaving} className="bg-sky-600 hover:bg-sky-700">
              {remarksSaving ? 'Saving...' : 'Save Remarks'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

// ─── Additional helpers for grade colors in statistics ──────────

function gradeBarColor2(grade: string) {
  const g = grade.toUpperCase();
  if (g === 'A' || g === 'A+') return 'bg-emerald-500';
  if (g === 'B' || g === 'B+') return 'bg-emerald-400';
  if (g === 'C' || g === 'C+') return 'bg-amber-400';
  if (g === 'D') return 'bg-amber-600';
  return 'bg-red-500';
}

function scoreBarColor2(score: number) {
  if (score >= 80) return 'bg-emerald-100 text-emerald-700';
  if (score >= 60) return 'bg-sky-100 text-sky-700';
  if (score >= 50) return 'bg-amber-100 text-amber-700';
  return 'bg-red-100 text-red-700';
}
