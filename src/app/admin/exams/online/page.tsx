'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { format } from 'date-fns';
import {
  Globe, Clock, Plus, Search, BarChart3, Calendar, CheckCircle,
  XCircle, ArrowRight, Users, FileQuestion, TrendingUp, Award,
  Loader2, Eye, Pencil, Trash2, Play,
} from 'lucide-react';

/* ── Types ──────────────────────────────────────────────────── */

interface OnlineExam {
  online_exam_id: number;
  title: string;
  subject_id: number | null;
  class_id: number | null;
  instructions: string;
  minimum_percentage: number;
  start_date: string | null;
  end_date: string | null;
  duration: number;
  status: string;
  subject?: { name: string } | null;
  class?: { name: string } | null;
  _count?: { results: number };
}

interface ExamResult {
  id: number;
  exam_id: number;
  exam: { title: string } | null;
  student: { name: string; student_code: string } | null;
  score: number;
  total: number;
  status: string;
  submitted_at: number;
}

interface SubjectItem {
  subject_id: number;
  name: string;
  class_id: number;
}

/* ── Helpers ────────────────────────────────────────────────── */

function getExamStatus(exam: OnlineExam): { label: string; color: string; icon: React.ElementType } {
  const now = new Date();
  const start = exam.start_date ? new Date(exam.start_date) : null;
  const end = exam.end_date ? new Date(exam.end_date) : null;

  if (exam.status === 'archived') return { label: 'Archived', color: 'bg-slate-100 text-slate-600', icon: XCircle };
  if (exam.status === 'completed') return { label: 'Completed', color: 'bg-violet-100 text-violet-700', icon: CheckCircle };
  if (start && end && now >= start && now <= end) return { label: 'Active', color: 'bg-emerald-100 text-emerald-700', icon: Play };
  if (start && now < start) return { label: 'Upcoming', color: 'bg-sky-100 text-sky-700', icon: Calendar };
  if (end && now > end) return { label: 'Ended', color: 'bg-slate-100 text-slate-600', icon: XCircle };
  return { label: 'Draft', color: 'bg-amber-100 text-amber-700', icon: FileQuestion };
}

function getScoreColor(pct: number): string {
  if (pct >= 80) return 'text-emerald-600';
  if (pct >= 60) return 'text-sky-600';
  if (pct >= 40) return 'text-amber-600';
  return 'text-red-600';
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/* ── Component ──────────────────────────────────────────────── */

export default function OnlineExamsPage() {
  const [exams, setExams] = useState<OnlineExam[]>([]);
  const [results, setResults] = useState<ExamResult[]>([]);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [subjectFilter, setSubjectFilter] = useState('all');

  /* ── Data Fetching ──────────────────────────────────────── */

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [examRes, resultRes, subjectRes] = await Promise.all([
        fetch('/api/admin/exams/online/create'),
        fetch('/api/online-exams?type=results'),
        fetch('/api/subjects'),
      ]);
      const examData = await examRes.json();
      const resultData = await resultRes.json();
      const subjectData = await subjectRes.json();
      setExams(Array.isArray(examData) ? examData : []);
      setResults(Array.isArray(resultData) ? resultData : []);
      setSubjects(Array.isArray(subjectData) ? subjectData : []);
    } catch {
      toast.error('Failed to load online exams data');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, [fetchData]);

  /* ── Derived Data ───────────────────────────────────────── */

  const totalExams = exams.length;
  const activeExams = exams.filter((e) => getExamStatus(e).label === 'Active').length;
  const totalStudentsTested = exams.reduce((sum, e) => sum + (e._count?.results || 0), 0);

  const totalQuestionsFromSettings = 0; // questions stored in settings table, not directly available

  const uniqueSubjects = Array.from(
    new Map(
      exams
        .filter((e) => e.subject)
        .map((e) => [e.subject!.name, { subject_id: e.subject_id, name: e.subject!.name }])
    ).values()
  );

  /* ── Filters ───────────────────────────────────────────── */

  const filteredExams = exams.filter((e) => {
    if (search && !e.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter !== 'all') {
      const status = getExamStatus(e).label.toLowerCase();
      if (status !== statusFilter) return false;
    }
    if (subjectFilter !== 'all' && e.subject_id !== parseInt(subjectFilter)) return false;
    return true;
  });

  /* ── Top Performers ────────────────────────────────────── */

  const topResults = [...results]
    .filter((r) => r.total > 0 && r.student)
    .sort((a, b) => (b.score / b.total) - (a.score / a.total))
    .slice(0, 5);

  const avgScore =
    results.length > 0 && results.some((r) => r.total > 0)
      ? results.filter((r) => r.total > 0).reduce((sum, r) => sum + (r.score / r.total) * 100, 0) /
        results.filter((r) => r.total > 0).length
      : 0;

  /* ── Loading Skeleton ──────────────────────────────────── */

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-10 w-44" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-12 rounded-xl" />
          <Skeleton className="h-[400px] rounded-xl" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Skeleton className="h-[300px] rounded-xl" />
            <Skeleton className="h-[300px] rounded-xl lg:col-span-2" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  /* ── Render ────────────────────────────────────────────── */

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* ── Header ──────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Online Exams</h1>
            <p className="text-sm text-slate-500 mt-1">
              Overview and management of all online examinations
            </p>
          </div>
          <Link href="/admin/exams/online/create">
            <Button className="bg-emerald-600 hover:bg-emerald-700 min-h-[44px]">
              <Plus className="w-4 h-4 mr-2" />
              Create Online Exam
            </Button>
          </Link>
        </div>

        {/* ── Summary Stats ───────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-slate-200/60">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                <Globe className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Total Exams</p>
                <p className="text-xl font-bold text-slate-900">{totalExams}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-slate-200/60">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-sky-100 flex items-center justify-center flex-shrink-0">
                <Play className="w-5 h-5 text-sky-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Active Exams</p>
                <p className="text-xl font-bold text-slate-900">{activeExams}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-slate-200/60">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center flex-shrink-0">
                <FileQuestion className="w-5 h-5 text-violet-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Total Questions</p>
                <p className="text-xl font-bold text-slate-900">
                  {totalQuestionsFromSettings || '—'}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-slate-200/60">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                <Users className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Students Tested</p>
                <p className="text-xl font-bold text-slate-900">{totalStudentsTested}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Quick Actions ───────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link href="/admin/exams/online/create" className="group">
            <Card className="border-slate-200/60 hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-200 transition-colors">
                  <Plus className="w-6 h-6 text-emerald-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-900">Create New Exam</h3>
                  <p className="text-sm text-slate-500 truncate">
                    Set up a new computer-based examination with questions
                  </p>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all flex-shrink-0" />
              </CardContent>
            </Card>
          </Link>
          <Link href="/admin/exams/online/manage" className="group">
            <Card className="border-slate-200/60 hover:border-sky-300 hover:shadow-md transition-all cursor-pointer">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-sky-100 flex items-center justify-center flex-shrink-0 group-hover:bg-sky-200 transition-colors">
                  <BarChart3 className="w-6 h-6 text-sky-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-900">Manage Exams</h3>
                  <p className="text-sm text-slate-500 truncate">
                    View, edit, delete and monitor all online examinations
                  </p>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-sky-600 group-hover:translate-x-1 transition-all flex-shrink-0" />
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* ── Filter Bar ──────────────────────────────────── */}
        <Card className="border-slate-200/60">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search exams by title..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 min-h-[44px]"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-[44px] w-full sm:w-44">
                  <SelectValue placeholder="Filter status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="upcoming">Upcoming</SelectItem>
                  <SelectItem value="ended">Ended</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
              <Select value={subjectFilter} onValueChange={setSubjectFilter}>
                <SelectTrigger className="h-[44px] w-full sm:w-48">
                  <SelectValue placeholder="Filter subject" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  <SelectItem value="all">All Subjects</SelectItem>
                  {uniqueSubjects.map((s) => (
                    <SelectItem key={s.subject_id} value={s.subject_id!.toString()}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* ── Exams Table ─────────────────────────────────── */}
        <Card className="border-slate-200/60">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <FileQuestion className="w-5 h-5 text-emerald-600" />
              Recent &amp; Upcoming Exams
            </CardTitle>
            <CardDescription className="text-xs">
              Showing {filteredExams.length} of {totalExams} exams
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-[480px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead className="hidden sm:table-cell">Subject</TableHead>
                    <TableHead className="hidden md:table-cell">Class</TableHead>
                    <TableHead className="hidden md:table-cell">Duration</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden lg:table-cell">Students</TableHead>
                    <TableHead className="hidden lg:table-cell">Created</TableHead>
                    <TableHead className="w-28">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredExams.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-12 text-slate-400">
                        <Globe className="w-10 h-10 mx-auto mb-2 opacity-50" />
                        <p className="font-medium">No exams found</p>
                        <p className="text-xs mt-1">
                          {search || statusFilter !== 'all' || subjectFilter !== 'all'
                            ? 'Try adjusting your filters'
                            : 'Create your first online exam to get started'}
                        </p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredExams.map((exam, i) => {
                      const status = getExamStatus(exam);
                      const StatusIcon = status.icon;
                      return (
                        <TableRow key={exam.online_exam_id} className="hover:bg-slate-50/80">
                          <TableCell className="text-xs text-slate-400 font-medium">
                            {i + 1}
                          </TableCell>
                          <TableCell>
                            <Link
                              href="/admin/exams/online/manage"
                              className="hover:text-emerald-600 transition-colors"
                            >
                              <p className="font-medium text-sm text-slate-900">
                                {exam.title}
                              </p>
                              <p className="text-xs text-slate-500 mt-0.5">
                                {exam.start_date
                                  ? format(new Date(exam.start_date), 'MMM d, yyyy')
                                  : 'Not scheduled'}
                              </p>
                            </Link>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell text-sm text-slate-600">
                            {exam.subject?.name || '—'}
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-sm text-slate-600">
                            {exam.class?.name || '—'}
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-sm text-slate-600">
                            {exam.duration > 0 ? (
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {exam.duration} min
                              </span>
                            ) : (
                              '—'
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge className={`${status.color} text-xs border-0`}>
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {status.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden lg:table-cell text-sm text-slate-600">
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {exam._count?.results || 0}
                            </span>
                          </TableCell>
                          <TableCell className="hidden lg:table-cell text-xs text-slate-500">
                            {exam.start_date
                              ? format(new Date(exam.start_date), 'MMM d, yyyy')
                              : '—'}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Link href="/admin/exams/online/manage">
                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                                  <Eye className="w-3.5 h-3.5" />
                                </Button>
                              </Link>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 text-slate-500 hover:text-amber-600"
                                onClick={() =>
                                  toast.info('Edit functionality available in Manage page')
                                }
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 text-red-500"
                                onClick={() =>
                                  toast.info('Delete functionality available in Manage page')
                                }
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* ── Bottom Row: Recent Results + Top Performers ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ── Recent Results ─────────────────────────────── */}
          <Card className="border-slate-200/60 lg:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
                Recent Results
              </CardTitle>
              <CardDescription className="text-xs">
                Latest exam submissions and scores
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50">
                      <TableHead>Student</TableHead>
                      <TableHead>Exam</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Grade</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-10 text-slate-400">
                          <BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm font-medium">No results yet</p>
                          <p className="text-xs mt-1">
                            Results will appear once students complete exams
                          </p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      results.slice(0, 10).map((r) => {
                        const pct = r.total > 0 ? Math.round((r.score / r.total) * 100) : 0;
                        return (
                          <TableRow key={r.id} className="hover:bg-slate-50/80">
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Avatar className="w-7 h-7">
                                  <AvatarFallback className="bg-emerald-100 text-emerald-700 text-[10px] font-bold">
                                    {r.student ? getInitials(r.student.name) : '?'}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0">
                                  <p className="text-sm font-medium text-slate-900 truncate max-w-[140px]">
                                    {r.student?.name || 'Unknown'}
                                  </p>
                                  <p className="text-[10px] text-slate-400">
                                    {r.student?.student_code || ''}
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-xs text-slate-600 max-w-[160px] truncate">
                              {r.exam?.title || '—'}
                            </TableCell>
                            <TableCell>
                              <span className={`text-sm font-semibold ${getScoreColor(pct)}`}>
                                {r.score}/{r.total}
                              </span>
                              <span className="text-xs text-slate-400 ml-1">({pct}%)</span>
                            </TableCell>
                            <TableCell>
                              <Badge
                                className={`text-[10px] border-0 ${
                                  pct >= 80
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : pct >= 60
                                      ? 'bg-sky-100 text-sky-700'
                                      : pct >= 40
                                        ? 'bg-amber-100 text-amber-700'
                                        : 'bg-red-100 text-red-700'
                                }`}
                              >
                                {pct >= 80 ? 'A' : pct >= 70 ? 'B' : pct >= 60 ? 'C' : pct >= 50 ? 'D' : 'F'}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* ── Top Performers ────────────────────────────── */}
          <Card className="border-slate-200/60">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Award className="w-5 h-5 text-amber-500" />
                Top Performers
              </CardTitle>
              <CardDescription className="text-xs">Highest scoring students</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {topResults.length === 0 ? (
                <div className="text-center py-10 text-slate-400">
                  <Award className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm font-medium">No results yet</p>
                  <p className="text-xs mt-1">Top performers will appear here</p>
                </div>
              ) : (
                topResults.map((r, i) => {
                  const pct = r.total > 0 ? Math.round((r.score / r.total) * 100) : 0;
                  const rankColors = [
                    'bg-amber-100 text-amber-700',
                    'bg-slate-200 text-slate-600',
                    'bg-orange-100 text-orange-700',
                    'bg-emerald-50 text-emerald-600',
                    'bg-slate-50 text-slate-500',
                  ];
                  return (
                    <div
                      key={r.id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-slate-50/80 hover:bg-slate-100 transition-colors"
                    >
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${rankColors[i] || rankColors[4]}`}
                      >
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">
                          {r.student?.name || 'Unknown'}
                        </p>
                        <p className="text-[10px] text-slate-500 truncate">
                          {r.exam?.title || ''}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className={`text-sm font-bold ${getScoreColor(pct)}`}>{pct}%</p>
                        <Progress
                          value={pct}
                          className="w-16 h-1.5 mt-1"
                        />
                      </div>
                    </div>
                  );
                })
              )}

              {/* Average Score Summary */}
              {results.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">Class Average</span>
                    <span className="text-sm font-bold text-slate-900">
                      {avgScore.toFixed(1)}%
                    </span>
                  </div>
                  <Progress value={avgScore} className="w-full h-2 mt-2" />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Based on {results.filter((r) => r.total > 0).length} submissions
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
