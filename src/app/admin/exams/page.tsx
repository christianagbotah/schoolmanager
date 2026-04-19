'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import {
  Search, Plus, FileText, Calendar, BookOpen, TrendingUp,
  Eye, Pencil, Trash2, ChevronLeft, ChevronRight, Loader2,
  GraduationCap, BarChart3, Users, X, Filter,
} from 'lucide-react';

// ===== Types =====
interface Exam {
  exam_id: number;
  name: string;
  date: string | null;
  comment: string;
  year: string;
  class_id: number | null;
  section_id: number | null;
  type: string;
  class: { class_id: number; name: string; category: string } | null;
  _count: { marks_list: number; exam_marks: number };
  subjectsCount: number;
}

interface ClassItem {
  class_id: number;
  name: string;
  category: string;
  name_numeric: number;
}

interface ExamDetail extends Exam {
  marks_list: Array<{
    mark_id: number;
    student_id: number;
    subject_id: number;
    mark_obtained: number;
    comment: string;
    student: { student_id: number; name: string; student_code: string };
    subject: { subject_id: number; name: string };
  }>;
  exam_marks: Array<{
    mark_id: number;
    subject_id: number;
    student_id: number;
    mark_obtained: number;
    comment: string;
    student: { student_id: number; name: string; student_code: string };
    subject: { subject_id: number; name: string };
  }>;
}

interface Summary {
  totalSubjects: number;
  avgScore: number;
}

// ===== Status Helpers =====
function getExamStatus(date: string | null): { label: string; className: string } {
  if (!date) return { label: 'Scheduled', className: 'border-slate-200 bg-slate-50 text-slate-600' };
  const now = new Date();
  const examDate = new Date(date);
  examDate.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);
  const diffDays = Math.floor((now.getTime() - examDate.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return { label: 'Upcoming', className: 'border-sky-200 bg-sky-50 text-sky-700' };
  if (diffDays <= 7) return { label: 'Active', className: 'border-emerald-200 bg-emerald-50 text-emerald-700' };
  if (diffDays <= 30) return { label: 'Grading', className: 'border-amber-200 bg-amber-50 text-amber-700' };
  return { label: 'Completed', className: 'border-slate-200 bg-slate-50 text-slate-600' };
}

function getTypeBadge(type: string): string {
  const t = type?.toLowerCase() || '';
  if (t.includes('final')) return 'border-rose-200 bg-rose-50 text-rose-700';
  if (t.includes('term')) return 'border-violet-200 bg-violet-50 text-violet-700';
  if (t.includes('mid')) return 'border-amber-200 bg-amber-50 text-amber-700';
  if (t.includes('mock')) return 'border-pink-200 bg-pink-50 text-pink-700';
  if (t.includes('quiz')) return 'border-teal-200 bg-teal-50 text-teal-700';
  if (t.includes('test')) return 'border-cyan-200 bg-cyan-50 text-cyan-700';
  return 'border-slate-200 bg-slate-50 text-slate-600';
}

// ===== Skeleton Components =====
function StatCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/60 p-4 sm:p-5 flex flex-col">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-2.5">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-8 w-16" />
        </div>
        <Skeleton className="w-11 h-11 rounded-xl flex-shrink-0" />
      </div>
    </div>
  );
}

function FilterBarSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/60 p-4">
      <div className="flex flex-col lg:flex-row gap-3">
        <Skeleton className="h-11 flex-1 rounded-lg" />
        <div className="flex gap-2">
          <Skeleton className="h-11 w-40 rounded-lg hidden lg:block" />
          <Skeleton className="h-11 w-44 rounded-lg hidden lg:block" />
        </div>
      </div>
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/60 p-4 sm:p-6">
      <div className="space-y-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}

// ===== Stat Card Component =====
function StatCard({
  icon: Icon,
  label,
  value,
  subValue,
  iconBg,
  borderColor,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  subValue?: string;
  iconBg: string;
  borderColor: string;
}) {
  return (
    <div
      className="group relative bg-white rounded-2xl border border-slate-200/60 p-4 sm:p-5 hover:-translate-y-0.5 hover:shadow-lg hover:border-slate-300/80 transition-all duration-200 flex flex-col"
      style={{ borderLeft: `4px solid ${borderColor}` }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            {label}
          </p>
          <p className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1.5 tabular-nums leading-tight">
            {value}
          </p>
          {subValue && (
            <p className="text-xs text-slate-500 mt-1.5">{subValue}</p>
          )}
        </div>
        <div
          className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}
        >
          <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
        </div>
      </div>
    </div>
  );
}

// ===== Main Component =====
export default function ExamsPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [summary, setSummary] = useState<Summary>({ totalSubjects: 0, avgScore: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Create/Edit Dialog
  const [formOpen, setFormOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [formSaving, setFormSaving] = useState(false);
  const [form, setForm] = useState({
    name: '', date: '', comment: '', year: new Date().getFullYear().toString(),
    class_id: '', section_id: '', type: '',
  });

  // View Dialog
  const [viewOpen, setViewOpen] = useState(false);
  const [viewExam, setViewExam] = useState<ExamDetail | null>(null);
  const [viewLoading, setViewLoading] = useState(false);

  // Delete Dialog
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteExam, setDeleteExam] = useState<Exam | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Current year
  const currentYear = new Date().getFullYear().toString();

  // Fetch exams
  const fetchExams = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (yearFilter) params.set('year', yearFilter);
      params.set('page', String(page));
      params.set('limit', '15');

      const res = await fetch(`/api/exams?${params}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setExams(data.exams || []);
      setSummary(data.summary || { totalSubjects: 0, avgScore: 0 });
      setTotalPages(data.pagination?.totalPages || 1);
      setTotal(data.pagination?.total || 0);
    } catch {
      toast.error('Failed to load exams');
    } finally {
      setLoading(false);
    }
  }, [yearFilter, page]);

  useEffect(() => { fetchExams(); }, [fetchExams]);

  useEffect(() => { setPage(1); }, [yearFilter, statusFilter]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => { setPage(1); }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch classes for form
  useEffect(() => {
    fetch('/api/classes?limit=100')
      .then(r => r.json())
      .then(d => setClasses(Array.isArray(d) ? d : (d.classes || [])))
      .catch(() => {});
  }, []);

  // Filter exams client-side
  const filteredExams = useMemo(() => {
    return exams.filter(e => {
      if (search && !e.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (statusFilter) {
        const status = getExamStatus(e.date).label.toLowerCase();
        if (status !== statusFilter) return false;
      }
      return true;
    });
  }, [exams, search, statusFilter]);

  // Active filters for chips
  const activeFilters = [
    yearFilter ? { key: 'year', label: `Year: ${yearFilter}` } : null,
    statusFilter ? { key: 'status', label: `Status: ${statusFilter}` } : null,
  ].filter(Boolean) as { key: string; label: string }[];

  const clearFilter = (key: string) => {
    if (key === 'year') setYearFilter('');
    if (key === 'status') setStatusFilter('');
  };

  const clearAllFilters = () => {
    setYearFilter('');
    setStatusFilter('');
    setSearch('');
  };

  // Computed stats
  const activeExamCount = exams.filter(e => {
    const s = getExamStatus(e.date);
    return s.label === 'Active' || s.label === 'Grading';
  }).length;

  const upcomingCount = exams.filter(e => {
    const s = getExamStatus(e.date);
    return s.label === 'Upcoming';
  }).length;

  // Available years
  const availableYears = [...new Set(exams.map(e => e.year).filter(Boolean))].sort().reverse();
  const yearOptions = availableYears.length > 0 ? availableYears : [currentYear];

  // Form handlers
  const openCreate = () => {
    setEditingExam(null);
    setForm({
      name: '', date: '', comment: '', year: currentYear,
      class_id: '', section_id: '', type: '',
    });
    setFormOpen(true);
  };

  const openEdit = (exam: Exam) => {
    setEditingExam(exam);
    setForm({
      name: exam.name,
      date: exam.date ? exam.date.split('T')[0] : '',
      comment: exam.comment,
      year: exam.year,
      class_id: exam.class_id?.toString() || '',
      section_id: exam.section_id?.toString() || '',
      type: exam.type,
    });
    setFormOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error('Exam name is required');
      return;
    }
    setFormSaving(true);
    try {
      const url = editingExam ? `/api/exams/${editingExam.exam_id}` : '/api/exams';
      const method = editingExam ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          name: form.name.toUpperCase(),
          class_id: form.class_id === '__none__' || !form.class_id ? null : parseInt(form.class_id),
          section_id: form.section_id === '__none__' || !form.section_id ? null : parseInt(form.section_id),
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast.success(editingExam ? 'Exam updated successfully' : 'Exam created successfully');
      setFormOpen(false);
      fetchExams();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save exam';
      toast.error(msg);
    } finally {
      setFormSaving(false);
    }
  };

  // View handler
  const openView = async (exam: Exam) => {
    setViewExam(null);
    setViewOpen(true);
    setViewLoading(true);
    try {
      const res = await fetch(`/api/exams/${exam.exam_id}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setViewExam(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load exam details';
      toast.error(msg);
      setViewOpen(false);
    } finally {
      setViewLoading(false);
    }
  };

  // Delete handler
  const handleDelete = async () => {
    if (!deleteExam) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/exams/${deleteExam.exam_id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast.success('Exam deleted successfully');
      setDeleteOpen(false);
      setDeleteExam(null);
      fetchExams();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete exam';
      toast.error(msg);
    } finally {
      setDeleting(false);
    }
  };

  // ── Loading State ───────────────────────────────────────────────────
  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-5 sm:space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1.5">
              <Skeleton className="h-8 w-44" />
              <Skeleton className="h-4 w-72" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-11 w-36 rounded-lg" />
              <Skeleton className="h-11 w-40 rounded-lg" />
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </div>
          <FilterBarSkeleton />
          <TableSkeleton />
        </div>
      </DashboardLayout>
    );
  }

  // ── Render ──────────────────────────────────────────────────────────
  return (
    <DashboardLayout>
      <div className="space-y-5 sm:space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Examinations
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Manage exams, schedules and results
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              asChild
              className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 min-h-[44px]"
            >
              <Link href="/admin/marks">
                <BarChart3 className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">View Results</span>
              </Link>
            </Button>
            <Button
              onClick={openCreate}
              className="bg-emerald-600 hover:bg-emerald-700 min-h-[44px]"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Exam
            </Button>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <StatCard
            icon={FileText}
            label="Total Exams"
            value={total}
            subValue={`${yearOptions.length} academic year${yearOptions.length !== 1 ? 's' : ''}`}
            iconBg="bg-emerald-500"
            borderColor="#10b981"
          />
          <StatCard
            icon={Calendar}
            label="Active Exams"
            value={activeExamCount}
            subValue={`${upcomingCount} upcoming`}
            iconBg="bg-sky-500"
            borderColor="#0ea5e9"
          />
          <StatCard
            icon={BookOpen}
            label="Subjects Covered"
            value={summary.totalSubjects}
            subValue="Across all exams"
            iconBg="bg-violet-500"
            borderColor="#8b5cf6"
          />
          <StatCard
            icon={TrendingUp}
            label="Average Score"
            value={summary.avgScore > 0 ? `${summary.avgScore}%` : '\u2014'}
            subValue="Exam performance"
            iconBg="bg-amber-500"
            borderColor="#f59e0b"
          />
        </div>

        {/* Filter Bar */}
        <div className="bg-white rounded-2xl border border-slate-200/60 p-4">
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search exams..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 min-h-[44px]"
              />
            </div>
            <div className="hidden lg:flex gap-2">
              <Select
                value={yearFilter || '__all__'}
                onValueChange={(v) => setYearFilter(v === '__all__' ? '' : v)}
              >
                <SelectTrigger className="w-40 min-h-[44px]">
                  <SelectValue placeholder="All Years" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All Years</SelectItem>
                  {yearOptions.map((y) => (
                    <SelectItem key={y} value={y}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={statusFilter || '__all__'}
                onValueChange={(v) => setStatusFilter(v === '__all__' ? '' : v)}
              >
                <SelectTrigger className="w-44 min-h-[44px]">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All Status</SelectItem>
                  <SelectItem value="upcoming">Upcoming</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="grading">Grading</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Active filter chips */}
          {(activeFilters.length > 0 || search) && (
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              {activeFilters.map((f) => (
                <Badge
                  key={f.key}
                  variant="outline"
                  className="bg-slate-50 border-slate-200 text-slate-700 text-xs pr-1 gap-1"
                >
                  {f.label}
                  <button
                    onClick={() => clearFilter(f.key)}
                    className="ml-0.5 w-4 h-4 rounded-full hover:bg-slate-200 inline-flex items-center justify-center transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
              {search && (
                <Badge
                  variant="outline"
                  className="bg-slate-50 border-slate-200 text-slate-700 text-xs pr-1 gap-1"
                >
                  Search: {search}
                  <button
                    onClick={() => setSearch('')}
                    className="ml-0.5 w-4 h-4 rounded-full hover:bg-slate-200 inline-flex items-center justify-center transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )}
              <button
                onClick={clearAllFilters}
                className="text-xs text-slate-500 hover:text-slate-700 underline-offset-2 hover:underline transition-colors"
              >
                Clear all
              </button>
            </div>
          )}

          {/* Mobile filter chips */}
          <div className="flex flex-wrap gap-2 mt-3 lg:hidden">
            <Select
              value={yearFilter || '__all__'}
              onValueChange={(v) => setYearFilter(v === '__all__' ? '' : v)}
            >
              <SelectTrigger className="h-9 w-auto text-xs rounded-full border-slate-200">
                <Calendar className="w-3.5 h-3.5 mr-1 text-slate-400" />
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All Years</SelectItem>
                {yearOptions.map((y) => (
                  <SelectItem key={y} value={y}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={statusFilter || '__all__'}
              onValueChange={(v) => setStatusFilter(v === '__all__' ? '' : v)}
            >
              <SelectTrigger className="h-9 w-auto text-xs rounded-full border-slate-200">
                <Filter className="w-3.5 h-3.5 mr-1 text-slate-400" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All</SelectItem>
                <SelectItem value="upcoming">Upcoming</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="grading">Grading</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Data Table / Mobile Card View */}
        <div className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden">
          {/* Results header */}
          {!loading && filteredExams.length > 0 && (
            <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-slate-100 bg-slate-50/50">
              <p className="text-xs font-medium text-slate-500">
                Showing {filteredExams.length} of {total} exam{total !== 1 ? 's' : ''}
              </p>
            </div>
          )}

          {filteredExams.length === 0 ? (
            /* Empty State */
            <div className="text-center py-20">
              <div className="flex flex-col items-center gap-3">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center">
                  <GraduationCap className="w-8 h-8 text-slate-400" />
                </div>
                <div>
                  <p className="font-semibold text-slate-500 text-base">No exams found</p>
                  <p className="text-xs text-slate-400 mt-1">
                    {search || yearFilter || statusFilter
                      ? 'Try adjusting your search or filters'
                      : 'Create your first exam to get started'}
                  </p>
                </div>
                {!search && !yearFilter && !statusFilter && (
                  <Button
                    onClick={openCreate}
                    variant="outline"
                    className="mt-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50 min-h-[44px]"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Exam
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50 hover:bg-slate-50">
                      <TableHead className="text-xs font-semibold text-slate-600">Exam Name</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600">Type</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600">Date</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600">Class</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600">Status</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 text-center">Subjects</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredExams.map((exam) => {
                      const status = getExamStatus(exam.date);
                      return (
                        <TableRow key={exam.exam_id} className="hover:bg-slate-50/50 transition-colors">
                          <TableCell>
                            <div>
                              <p className="font-medium text-sm text-slate-900">{exam.name}</p>
                              {exam.comment && (
                                <p className="text-xs text-slate-400 truncate max-w-[200px]">{exam.comment}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {exam.type ? (
                              <Badge variant="outline" className={`text-xs font-medium border ${getTypeBadge(exam.type)}`}>
                                {exam.type}
                              </Badge>
                            ) : (
                              <span className="text-xs text-slate-400">{'\u2014'}</span>
                            )}
                          </TableCell>
                          <TableCell className="text-sm">
                            {exam.date ? (
                              <span className="inline-flex items-center gap-1 text-slate-600">
                                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                {format(new Date(exam.date), 'MMM d, yyyy')}
                              </span>
                            ) : (
                              <span className="text-slate-400">{'\u2014'}</span>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-slate-600">
                            {exam.class ? exam.class.name : 'All Classes'}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`text-xs font-medium border ${status.className}`}>
                              {status.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
                              {exam.subjectsCount}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 min-w-[32px] text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                onClick={() => openView(exam)}
                                title="View Details"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 min-w-[32px]"
                                onClick={() => openEdit(exam)}
                                title="Edit"
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 min-w-[32px] text-red-500 hover:text-red-600 hover:bg-red-50"
                                onClick={() => { setDeleteExam(exam); setDeleteOpen(true); }}
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden divide-y divide-slate-100">
                {filteredExams.map((exam) => {
                  const status = getExamStatus(exam.date);
                  return (
                    <div key={exam.exam_id} className="p-4 space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center flex-shrink-0">
                          <GraduationCap className="w-5 h-5 text-violet-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="font-semibold text-sm text-slate-900 truncate">{exam.name}</p>
                              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                {exam.type && (
                                  <Badge variant="outline" className={`text-[10px] font-medium border ${getTypeBadge(exam.type)}`}>
                                    {exam.type}
                                  </Badge>
                                )}
                                <span className="text-xs text-slate-400">{exam.year}</span>
                              </div>
                            </div>
                            <Badge variant="outline" className={`text-[10px] font-medium border shrink-0 ${status.className}`}>
                              {status.label}
                            </Badge>
                          </div>

                          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                            {exam.date && (
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-slate-400" />
                                {format(new Date(exam.date), 'MMM d, yyyy')}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <BookOpen className="w-3 h-3 text-slate-400" />
                              {exam.subjectsCount} subject{exam.subjectsCount !== 1 ? 's' : ''}
                            </span>
                            {exam.class && (
                              <span className="flex items-center gap-1">
                                <Users className="w-3 h-3 text-slate-400" />
                                {exam.class.name}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-1">
                        <Button
                          variant="outline"
                          className="flex-1 min-h-[44px] text-xs"
                          onClick={() => openView(exam)}
                        >
                          <Eye className="w-3.5 h-3.5 mr-1.5" />
                          View Details
                        </Button>
                        <Button
                          variant="outline"
                          className="min-h-[44px] min-w-[44px] text-xs"
                          onClick={() => openEdit(exam)}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="outline"
                          className="min-h-[44px] min-w-[44px] text-xs text-red-600 border-red-200 hover:bg-red-50"
                          onClick={() => { setDeleteExam(exam); setDeleteOpen(true); }}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-t bg-slate-50/50">
                  <p className="text-xs text-slate-500">
                    Page {page} of {totalPages} &middot; {total} exam{total !== 1 ? 's' : ''}
                  </p>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 min-w-[32px]"
                      disabled={page <= 1}
                      onClick={() => setPage(page - 1)}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="text-sm px-2 tabular-nums">{page} / {totalPages}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 min-w-[32px]"
                      disabled={page >= totalPages}
                      onClick={() => setPage(page + 1)}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-emerald-600" />
              {editingExam ? 'Edit Exam' : 'Create New Exam'}
            </DialogTitle>
            <DialogDescription>
              {editingExam ? 'Update exam details below' : 'Fill in the details to create a new examination'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs font-medium">Exam Name *</Label>
              <Input
                placeholder="e.g., Mid-Term Examination"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="mt-1.5 min-h-[44px]"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-medium">Exam Date</Label>
                <Input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="mt-1.5 min-h-[44px]"
                />
              </div>
              <div>
                <Label className="text-xs font-medium">Type / Category</Label>
                <Select value={form.type || '__none__'} onValueChange={(v) => setForm({ ...form, type: v === '__none__' ? '' : v })}>
                  <SelectTrigger className="mt-1.5 min-h-[44px]">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">None</SelectItem>
                    <SelectItem value="Mid-Term">Mid-Term</SelectItem>
                    <SelectItem value="Terminal">Terminal</SelectItem>
                    <SelectItem value="Mock">Mock</SelectItem>
                    <SelectItem value="Final">Final</SelectItem>
                    <SelectItem value="Class Test">Class Test</SelectItem>
                    <SelectItem value="Quiz">Quiz</SelectItem>
                    <SelectItem value="Assignment">Assignment</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-medium">Year</Label>
                <Select value={form.year} onValueChange={(v) => setForm({ ...form, year: v })}>
                  <SelectTrigger className="mt-1.5 min-h-[44px]">
                    <SelectValue placeholder="Year" />
                  </SelectTrigger>
                  <SelectContent>
                    {[2023, 2024, 2025, 2026, 2027].map((y) => (
                      <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-medium">Class (Optional)</Label>
                <Select value={form.class_id || '__none__'} onValueChange={(v) => setForm({ ...form, class_id: v })}>
                  <SelectTrigger className="mt-1.5 min-h-[44px]">
                    <SelectValue placeholder="All Classes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">All Classes</SelectItem>
                    {classes.map((c) => (
                      <SelectItem key={c.class_id} value={c.class_id.toString()}>
                        {c.name} {c.name_numeric}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-xs font-medium">Comment</Label>
              <Textarea
                value={form.comment}
                onChange={(e) => setForm({ ...form, comment: e.target.value })}
                placeholder="Additional notes (optional)"
                rows={2}
                className="mt-1.5"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)} className="min-h-[44px]">
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={formSaving || !form.name.trim()}
              className="bg-emerald-600 hover:bg-emerald-700 min-h-[44px]"
            >
              {formSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {formSaving ? 'Saving...' : editingExam ? 'Update Exam' : 'Create Exam'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Exam Details Dialog */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-600" />
              Exam Details
            </DialogTitle>
          </DialogHeader>

          {viewLoading ? (
            <div className="space-y-4 py-4">
              <div className="flex flex-col items-center gap-2">
                <Skeleton className="w-14 h-14 rounded-full" />
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-5 w-24" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 rounded-lg" />
                ))}
              </div>
              <Skeleton className="h-32 w-full rounded-lg" />
            </div>
          ) : viewExam ? (
            <div className="space-y-4">
              {/* Header */}
              <div className="text-center pb-4 border-b">
                <div className="w-14 h-14 bg-emerald-100 rounded-full mx-auto flex items-center justify-center mb-2">
                  <GraduationCap className="w-7 h-7 text-emerald-600" />
                </div>
                <h3 className="font-bold text-lg">{viewExam.name}</h3>
                {viewExam.type && (
                  <Badge variant="outline" className={`mt-1 text-xs font-medium border ${getTypeBadge(viewExam.type)}`}>
                    {viewExam.type}
                  </Badge>
                )}
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider">Date</p>
                  <p className="text-sm font-medium mt-0.5">
                    {viewExam.date ? format(new Date(viewExam.date), 'MMM d, yyyy') : 'Not set'}
                  </p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider">Year</p>
                  <p className="text-sm font-medium mt-0.5">{viewExam.year || '\u2014'}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider">Status</p>
                  <Badge variant="outline" className={`mt-1 text-xs font-medium border ${getExamStatus(viewExam.date).className}`}>
                    {getExamStatus(viewExam.date).label}
                  </Badge>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider">Class</p>
                  <p className="text-sm font-medium mt-0.5">{viewExam.class ? viewExam.class.name : 'All Classes'}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider">Total Marks</p>
                  <p className="text-sm font-medium mt-0.5">{viewExam._count.marks_list + viewExam._count.exam_marks}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider">Subjects</p>
                  <p className="text-sm font-medium mt-0.5">{viewExam.subjectsCount}</p>
                </div>
              </div>

              {/* Comment */}
              {viewExam.comment && (
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Comment</p>
                  <p className="text-sm text-slate-600">{viewExam.comment}</p>
                </div>
              )}

              {/* Subjects List */}
              {(() => {
                const allMarks = [...(viewExam.marks_list || []), ...(viewExam.exam_marks || [])];
                const subjectMap = new Map<number, { name: string; studentCount: number; avgScore: number }>();
                for (const m of allMarks) {
                  if (m.subject_id) {
                    const existing = subjectMap.get(m.subject_id);
                    if (existing) {
                      existing.studentCount += 1;
                      existing.avgScore += m.mark_obtained;
                    } else {
                      subjectMap.set(m.subject_id, {
                        name: m.subject?.name || `Subject ${m.subject_id}`,
                        studentCount: 1,
                        avgScore: m.mark_obtained,
                      });
                    }
                  }
                }
                const subjectsList = Array.from(subjectMap.values()).map(s => ({
                  ...s,
                  avgScore: Math.round((s.avgScore / s.studentCount) * 10) / 10,
                }));

                if (subjectsList.length === 0) return null;

                return (
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                      Subjects ({subjectsList.length})
                    </p>
                    <div className="max-h-48 overflow-y-auto rounded-lg border divide-y">
                      {subjectsList.map((subject, i) => (
                        <div key={i} className="flex items-center justify-between px-3 py-2">
                          <div className="flex items-center gap-2">
                            <BookOpen className="w-4 h-4 text-slate-400" />
                            <span className="text-sm font-medium">{subject.name}</span>
                          </div>
                          <div className="flex items-center gap-3 text-xs">
                            <span className="text-slate-400">{subject.studentCount} student{subject.studentCount !== 1 ? 's' : ''}</span>
                            <span className="font-semibold text-emerald-600">{subject.avgScore}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Empty subjects */}
              {(!viewExam.marks_list || viewExam.marks_list.length === 0) &&
               (!viewExam.exam_marks || viewExam.exam_marks.length === 0) && (
                <div className="text-center py-6 text-slate-400">
                  <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">No marks recorded yet</p>
                  <p className="text-xs">Enter marks from the Mark Entry page</p>
                </div>
              )}
            </div>
          ) : null}

          <DialogFooter>
            <Button variant="outline" onClick={() => setViewOpen(false)} className="min-h-[44px]">Close</Button>
            {viewExam && (
              <>
                <Button variant="outline" onClick={() => { setViewOpen(false); openEdit(viewExam); }} className="min-h-[44px]">
                  <Pencil className="w-4 h-4 mr-1.5" />
                  Edit
                </Button>
                <Button asChild className="bg-emerald-600 hover:bg-emerald-700 min-h-[44px]">
                  <Link href="/admin/marks">
                    <BarChart3 className="w-4 h-4 mr-1.5" />
                    View Results
                  </Link>
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              Delete Exam
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deleteExam?.name}</strong>?
              This action cannot be undone and will also remove all associated marks.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting} className="min-h-[44px]">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 min-h-[44px]"
            >
              {deleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {deleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
