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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { format } from 'date-fns';
import {
  Globe, Search, Pencil, Trash2, Eye, Users, Clock, Plus,
  Filter, BarChart3, Calendar, CheckCircle, XCircle, Loader2,
} from 'lucide-react';

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

export default function ManageOnlineExamsPage() {
  const [exams, setExams] = useState<OnlineExam[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [resultsOpen, setResultsOpen] = useState(false);
  const [results, setResults] = useState<Array<{ student: { name: string }; score: number; total_marks: number; percentage: number; submitted_at: string }>>([]);
  const [loadingResults, setLoadingResults] = useState(false);
  const [selectedExam, setSelectedExam] = useState<OnlineExam | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchExams = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/exams/online/create');
      const data = await res.json();
      setExams(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Failed to fetch exams');
    }
    setLoading(false);
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchExams(); }, [fetchExams]);

  const getExamStatus = (exam: OnlineExam): { label: string; color: string; icon: React.ElementType } => {
    const now = new Date();
    const start = exam.start_date ? new Date(exam.start_date) : null;
    const end = exam.end_date ? new Date(exam.end_date) : null;
    if (start && now < start) return { label: 'Upcoming', color: 'bg-sky-100 text-sky-700', icon: Calendar };
    if (start && end && now >= start && now <= end) return { label: 'Active', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle };
    if (end && now > end) return { label: 'Ended', color: 'bg-slate-100 text-slate-600', icon: XCircle };
    return { label: 'Draft', color: 'bg-amber-100 text-amber-700', icon: Clock };
  };

  const filteredExams = exams.filter(e => {
    if (search && !e.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter !== 'all') {
      const status = getExamStatus(e).label.toLowerCase();
      if (status !== statusFilter) return false;
    }
    return true;
  });

  const totalExams = exams.length;
  const activeExams = exams.filter(e => getExamStatus(e).label === 'Active').length;
  const upcomingExams = exams.filter(e => getExamStatus(e).label === 'Upcoming').length;

  const fetchResults = useCallback(async (examId: number) => {
    setLoadingResults(true);
    try {
      const res = await fetch(`/api/online-exams?type=results&examId=${examId}`);
      const data = await res.json();
      setResults(Array.isArray(data) ? data : []);
    } catch {
      setResults([]);
    }
    setLoadingResults(false);
  }, []);

  useEffect(() => {
    if (resultsOpen && selectedExam) {
      fetchResults(selectedExam.online_exam_id);
    }
  }, [resultsOpen, selectedExam, fetchResults]);

  const getGrade = (pct: number): { grade: string; color: string } => {
    if (pct >= 80) return { grade: 'A', color: 'text-emerald-600' };
    if (pct >= 70) return { grade: 'B', color: 'text-sky-600' };
    if (pct >= 60) return { grade: 'C', color: 'text-amber-600' };
    if (pct >= 50) return { grade: 'D', color: 'text-orange-600' };
    return { grade: 'F', color: 'text-red-600' };
  };

  const handleDelete = async () => {
    if (!selectedExam) return;
    setDeleting(true);
    try {
      await fetch(`/api/admin/exams/online/create?id=${selectedExam.online_exam_id}`, { method: 'DELETE' });
      toast.success('Exam deleted');
      setDeleteOpen(false);
      setSelectedExam(null);
      fetchExams();
    } catch {
      toast.error('Failed to delete exam');
    }
    setDeleting(false);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Manage Online Exams</h1>
            <p className="text-sm text-slate-500 mt-1">View, edit and manage all online examinations</p>
          </div>
          <Button onClick={() => window.location.href = '/admin/exams/online/create'} className="bg-emerald-600 hover:bg-emerald-700 min-h-[44px]">
            <Plus className="w-4 h-4 mr-2" /> Create New Exam
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Card className="border-slate-200/60"><CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center"><Globe className="w-5 h-5 text-emerald-600" /></div>
            <div><p className="text-xs text-slate-500">Total Exams</p><p className="text-xl font-bold">{totalExams}</p></div>
          </CardContent></Card>
          <Card className="border-slate-200/60"><CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-sky-100 flex items-center justify-center"><Clock className="w-5 h-5 text-sky-600" /></div>
            <div><p className="text-xs text-slate-500">Active</p><p className="text-xl font-bold">{activeExams}</p></div>
          </CardContent></Card>
          <Card className="border-slate-200/60"><CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center"><Calendar className="w-5 h-5 text-amber-600" /></div>
            <div><p className="text-xs text-slate-500">Upcoming</p><p className="text-xl font-bold">{upcomingExams}</p></div>
          </CardContent></Card>
        </div>

        {/* Filters */}
        <Card className="border-slate-200/60"><CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input placeholder="Search exams..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 min-h-[44px]" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-[44px] w-full sm:w-44"><SelectValue placeholder="Filter status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="upcoming">Upcoming</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="ended">Ended</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent></Card>

        {/* Exams Table */}
        <Card className="border-slate-200/60"><CardContent className="p-0">
          <div className="max-h-[500px] overflow-y-auto">
            <Table>
              <TableHeader><TableRow className="bg-slate-50">
                <TableHead className="w-12">#</TableHead>
                <TableHead>Exam Title</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Pass %</TableHead>
                <TableHead>Results</TableHead>
                <TableHead className="w-28">Actions</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {loading ? Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}><TableCell colSpan={9}><Skeleton className="h-10" /></TableCell></TableRow>
                )) : filteredExams.length === 0 ? (
                  <TableRow><TableCell colSpan={9} className="text-center py-12 text-slate-400"><Globe className="w-10 h-10 mx-auto mb-2 opacity-50" /><p className="font-medium">No exams found</p></TableCell></TableRow>
                ) : filteredExams.map((exam, i) => {
                  const status = getExamStatus(exam);
                  const StatusIcon = status.icon;
                  return (
                    <TableRow key={exam.online_exam_id}>
                      <TableCell className="text-xs text-slate-400">{i + 1}</TableCell>
                      <TableCell>
                        <div><p className="font-medium text-sm text-slate-900">{exam.title}</p><p className="text-xs text-slate-500">{exam.start_date ? format(new Date(exam.start_date), 'MMM d, yyyy') : 'Not set'}</p></div>
                      </TableCell>
                      <TableCell className="text-sm">{exam.subject?.name || '—'}</TableCell>
                      <TableCell className="text-sm">{exam.class?.name || '—'}</TableCell>
                      <TableCell><Badge className={`${status.color} text-xs`}><StatusIcon className="w-3 h-3 mr-1" />{status.label}</Badge></TableCell>
                      <TableCell className="text-sm">{exam.duration > 0 ? `${exam.duration} min` : '—'}</TableCell>
                      <TableCell className="text-sm">{exam.minimum_percentage > 0 ? `${exam.minimum_percentage}%` : '—'}</TableCell>
                      <TableCell className="text-sm">{exam._count?.results || 0}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => {
                            setSelectedExam(exam);
                            setResultsOpen(true);
                          }}><BarChart3 className="w-3 h-3" /></Button>
                          <Button size="sm" variant="ghost" className="h-7 text-xs text-red-600" onClick={() => { setSelectedExam(exam); setDeleteOpen(true); }}><Trash2 className="w-3 h-3" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent></Card>
      </div>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete Exam</AlertDialogTitle><AlertDialogDescription>Are you sure you want to delete <strong>{selectedExam?.title}</strong>? This action cannot be undone and will remove all associated results.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-red-600 hover:bg-red-700">{deleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {/* Results Dialog */}
      <Dialog open={resultsOpen} onOpenChange={setResultsOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Exam Results: {selectedExam?.title}</DialogTitle>
            <DialogDescription>
              {selectedExam?.subject?.name || ''} — {selectedExam?.class?.name || ''}
            </DialogDescription>
          </DialogHeader>
          {loadingResults ? (
            <div className="space-y-3 py-4">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10" />)}
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <BarChart3 className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="font-medium">No results yet</p>
              <p className="text-sm">Students have not submitted any answers for this exam.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-emerald-50 rounded-lg text-center">
                  <p className="text-2xl font-bold text-emerald-700">{results.length}</p>
                  <p className="text-xs text-emerald-600">Submissions</p>
                </div>
                <div className="p-3 bg-sky-50 rounded-lg text-center">
                  <p className="text-2xl font-bold text-sky-700">
                    {results.length > 0 ? Math.round(results.reduce((a, r) => a + r.percentage, 0) / results.length) : 0}%
                  </p>
                  <p className="text-xs text-sky-600">Avg Score</p>
                </div>
                <div className="p-3 bg-amber-50 rounded-lg text-center">
                  <p className="text-2xl font-bold text-amber-700">
                    {results.filter(r => r.percentage >= (selectedExam?.minimum_percentage || 50)).length}
                  </p>
                  <p className="text-xs text-amber-600">Passed</p>
                </div>
              </div>
              <Table>
                <TableHeader><TableRow className="bg-slate-50">
                  <TableHead>#</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Percentage</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead>Submitted</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {results.map((r, i) => {
                    const { grade, color } = getGrade(r.percentage);
                    return (
                      <TableRow key={i}>
                        <TableCell className="text-xs text-slate-400">{i + 1}</TableCell>
                        <TableCell className="text-sm font-medium">{r.student?.name || 'Unknown'}</TableCell>
                        <TableCell className="text-sm">{r.score}/{r.total_marks}</TableCell>
                        <TableCell className="text-sm font-medium">{r.percentage.toFixed(1)}%</TableCell>
                        <TableCell><span className={`font-bold ${color}`}>{grade}</span></TableCell>
                        <TableCell className="text-xs text-slate-500">{r.submitted_at ? format(new Date(r.submitted_at), 'MMM d, yyyy HH:mm') : '—'}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
