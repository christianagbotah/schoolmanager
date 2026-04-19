'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { format } from 'date-fns';
import {
  Globe, Search, Pencil, Trash2, Eye, Users, Clock, Plus,
  BarChart3, Calendar, CheckCircle, XCircle, Loader2, Settings,
  Play, Share2, Ban,
} from 'lucide-react';

interface OnlineExam {
  online_exam_id: number;
  title: string;
  subject_id: number | null;
  class_id: number | null;
  section_id: number | null;
  instructions: string;
  minimum_percentage: number;
  start_date: string | null;
  end_date: string | null;
  duration: number;
  status: string;
  subject?: { name: string } | null;
  class?: { name: string } | null;
  section?: { name: string } | null;
  _count?: { results: number };
}

export default function ManageOnlineExamsPage() {
  const [exams, setExams] = useState<OnlineExam[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusTab, setStatusTab] = useState('active');
  const [searchInput, setSearchInput] = useState('');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [resultsOpen, setResultsOpen] = useState(false);
  const [results, setResults] = useState<Array<{ student: { name: string }; score: number; total_marks: number; percentage: number; submitted_at: string }>>([]);
  const [loadingResults, setLoadingResults] = useState(false);
  const [selectedExam, setSelectedExam] = useState<OnlineExam | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [publishing, setPublishing] = useState(false);

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

  useEffect(() => { fetchExams(); }, [fetchExams]);

  const getExamStatus = (exam: OnlineExam): { label: string; color: string; icon: React.ElementType } => {
    // CI3 uses 'published', 'pending', 'expired' statuses
    if (exam.status === 'published') return { label: 'Published', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle };
    if (exam.status === 'expired') return { label: 'Expired', color: 'bg-red-100 text-red-700', icon: XCircle };
    if (exam.status === 'pending') return { label: 'Pending', color: 'bg-amber-100 text-amber-700', icon: Clock };
    // Fallback: date-based
    const now = new Date();
    const start = exam.start_date ? new Date(exam.start_date) : null;
    const end = exam.end_date ? new Date(exam.end_date) : null;
    if (start && end && now >= start && now <= end) return { label: 'Active', color: 'bg-emerald-100 text-emerald-700', icon: Play };
    if (start && now < start) return { label: 'Upcoming', color: 'bg-sky-100 text-sky-700', icon: Calendar };
    if (end && now > end) return { label: 'Ended', color: 'bg-slate-100 text-slate-600', icon: XCircle };
    return { label: 'Draft', color: 'bg-amber-100 text-amber-700', icon: Clock };
  };

  // Split exams into active and expired for CI3 tabs
  const activeExams = exams.filter(e => {
    const status = getExamStatus(e);
    return status.label !== 'Expired' && status.label !== 'Ended';
  });
  const expiredExams = exams.filter(e => {
    const status = getExamStatus(e);
    return status.label === 'Expired' || status.label === 'Ended';
  });

  const displayExams = statusTab === 'active' ? activeExams : expiredExams;

  const filteredExams = displayExams.filter(e => {
    if (search && !e.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

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

  const handleStatusChange = async (exam: OnlineExam, newStatus: string) => {
    setPublishing(true);
    try {
      const res = await fetch(`/api/admin/exams/online/create?id=${exam.online_exam_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error();
      toast.success(`Exam ${newStatus === 'published' ? 'published' : 'cancelled'} successfully`);
      fetchExams();
    } catch {
      toast.error(`Failed to ${newStatus} exam`);
    }
    setPublishing(false);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Manage Online Exams</h1>
            <p className="text-sm text-slate-500 mt-1">View, edit, publish and manage all online examinations</p>
          </div>
          <Link href="/admin/exams/online/create">
            <Button className="bg-emerald-600 hover:bg-emerald-700 min-h-[44px]">
              <Plus className="w-4 h-4 mr-2" /> Create New Exam
            </Button>
          </Link>
        </div>

        {/* CI3-style Active/Expired Tabs */}
        <Tabs value={statusTab} onValueChange={setStatusTab}>
          <TabsList className="bg-white border border-slate-200 p-1 rounded-xl h-auto flex w-full sm:w-auto">
            <TabsTrigger
              value="active"
              className={`flex-1 min-w-[120px] rounded-lg py-2 text-sm ${statusTab === 'active' ? 'data-[state=active]:bg-sky-700 data-[state=active]:text-white' : ''}`}
            >
              <CheckCircle className="w-4 h-4 mr-1.5" />
              Active Exams
            </TabsTrigger>
            <TabsTrigger
              value="expired"
              className={`flex-1 min-w-[120px] rounded-lg py-2 text-sm ${statusTab === 'expired' ? 'data-[state=active]:bg-red-600 data-[state=active]:text-white' : ''}`}
            >
              <XCircle className="w-4 h-4 mr-1.5" />
              Expired Exams
            </TabsTrigger>
          </TabsList>

          {/* ═══ Active Exams Table ═══ */}
          <TabsContent value="active">
            <Card className="border-slate-200/60">
              <CardContent className="p-0">
                <div className="max-h-[600px] overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50 hover:bg-slate-50">
                        <TableHead className="text-xs font-semibold text-slate-600">Exam Name</TableHead>
                        <TableHead className="text-xs font-semibold text-slate-600">Class &amp; Section</TableHead>
                        <TableHead className="text-xs font-semibold text-slate-600">Subject</TableHead>
                        <TableHead className="text-xs font-semibold text-slate-600">Exam Date</TableHead>
                        <TableHead className="text-xs font-semibold text-slate-600">Status</TableHead>
                        <TableHead className="text-xs font-semibold text-slate-600 text-center">Options</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? Array.from({ length: 6 }).map((_, i) => (
                        <TableRow key={i}><TableCell colSpan={6}><Skeleton className="h-10" /></TableCell></TableRow>
                      )) : filteredExams.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-16 text-slate-400">
                            <Globe className="w-12 h-12 mx-auto mb-3 opacity-40" />
                            <p className="font-medium text-slate-500">{statusTab === 'active' ? 'No active exams' : 'No expired exams'}</p>
                            <p className="text-xs text-slate-400 mt-1">
                              {search ? 'Try adjusting your search' : statusTab === 'active' ? 'Create your first online exam' : 'No expired exams yet'}
                            </p>
                          </TableCell>
                        </TableRow>
                      ) : filteredExams.map((exam) => {
                        const status = getExamStatus(exam);
                        const StatusIcon = status.icon;
                        return (
                          <TableRow key={exam.online_exam_id} className="hover:bg-slate-50/80">
                            {/* Exam Name - linked to manage questions */}
                            <TableCell>
                              <Link
                                href={`/admin/exams/online/manage`}
                                className="font-medium text-sm text-sky-600 hover:text-sky-700 hover:underline transition-colors"
                              >
                                {exam.title}
                              </Link>
                            </TableCell>
                            {/* Class & Section */}
                            <TableCell className="text-sm text-slate-600">
                              <div>
                                <span className="font-medium">{exam.class?.name || '—'}</span>
                                {exam.section && (
                                  <span className="text-xs text-slate-500 block">
                                    Section: {exam.section.name}
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            {/* Subject */}
                            <TableCell className="text-sm text-slate-600">
                              {exam.subject?.name || '—'}
                            </TableCell>
                            {/* Exam Date */}
                            <TableCell className="text-sm text-slate-600">
                              <div>
                                <span className="font-medium">
                                  {exam.start_date ? format(new Date(exam.start_date), 'MMM d, yyyy') : 'Not set'}
                                </span>
                                <span className="text-xs text-slate-500 block">
                                  {exam.start_date && exam.end_date
                                    ? `${format(new Date(exam.start_date), 'HH:mm')} - ${format(new Date(exam.end_date), 'HH:mm')}`
                                    : 'Not scheduled'}
                                </span>
                              </div>
                            </TableCell>
                            {/* Status */}
                            <TableCell>
                              <Badge className={`${status.color} text-xs border-0`}>
                                <StatusIcon className="w-3 h-3 mr-1" />
                                {status.label}
                              </Badge>
                            </TableCell>
                            {/* Options (CI3 parity: manage questions, edit, delete, publish/cancel, view result) */}
                            <TableCell className="text-center">
                              <div className="flex items-center justify-center gap-1 flex-wrap">
                                {/* Manage Questions */}
                                <Link href={`/admin/exams/online/manage`}>
                                  <Button size="sm" variant="ghost" className="h-8 text-xs text-sky-600 hover:text-sky-700 hover:bg-sky-50">
                                    <Settings className="w-3 h-3 mr-1" />
                                    Questions
                                  </Button>
                                </Link>
                                {/* Edit */}
                                <Button
                                  size="sm" variant="ghost"
                                  className="h-8 text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                  onClick={() => toast.info('Edit functionality available in Create page')}
                                >
                                  <Pencil className="w-3 h-3 mr-1" />
                                  Edit
                                </Button>
                                {/* Delete */}
                                <Button
                                  size="sm" variant="ghost"
                                  className="h-8 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                                  onClick={() => { setSelectedExam(exam); setDeleteOpen(true); }}
                                >
                                  <Trash2 className="w-3 h-3 mr-1" />
                                  Delete
                                </Button>
                                {/* Publish / Cancel (CI3 parity) */}
                                {exam.status === 'pending' && (
                                  <Button
                                    size="sm"
                                    className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                                    onClick={() => handleStatusChange(exam, 'published')}
                                    disabled={publishing}
                                  >
                                    {publishing ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Share2 className="w-3 h-3 mr-1" />}
                                    Publish
                                  </Button>
                                )}
                                {exam.status === 'published' && (
                                  <Button
                                    size="sm"
                                    className="h-8 text-xs bg-red-600 hover:bg-red-700 text-white"
                                    onClick={() => handleStatusChange(exam, 'expired')}
                                    disabled={publishing}
                                  >
                                    {publishing ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Ban className="w-3 h-3 mr-1" />}
                                    Cancel
                                  </Button>
                                )}
                                {(exam.status === 'expired' || exam.status === 'ended') && (
                                  <Button size="sm" variant="outline" className="h-8 text-xs" disabled>
                                    <Ban className="w-3 h-3 mr-1" />
                                    Expired
                                  </Button>
                                )}
                                {/* View Result */}
                                <Button
                                  size="sm"
                                  className="h-8 text-xs bg-slate-600 hover:bg-slate-700 text-white"
                                  onClick={() => { setSelectedExam(exam); setResultsOpen(true); }}
                                >
                                  <Eye className="w-3 h-3 mr-1" />
                                  Results
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══ Expired Exams Table ═══ */}
          <TabsContent value="expired">
            <Card className="border-slate-200/60">
              <CardContent className="p-0">
                <div className="max-h-[600px] overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50 hover:bg-slate-50">
                        <TableHead className="text-xs font-semibold text-slate-600">Exam Name</TableHead>
                        <TableHead className="text-xs font-semibold text-slate-600">Class &amp; Section</TableHead>
                        <TableHead className="text-xs font-semibold text-slate-600">Subject</TableHead>
                        <TableHead className="text-xs font-semibold text-slate-600">Exam Date</TableHead>
                        <TableHead className="text-xs font-semibold text-slate-600">Status</TableHead>
                        <TableHead className="text-xs font-semibold text-slate-600 text-center">Options</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredExams.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-16 text-slate-400">
                            <XCircle className="w-12 h-12 mx-auto mb-3 opacity-40" />
                            <p className="font-medium text-slate-500">No expired exams</p>
                          </TableCell>
                        </TableRow>
                      ) : filteredExams.map((exam) => {
                        const status = getExamStatus(exam);
                        const StatusIcon = status.icon;
                        return (
                          <TableRow key={exam.online_exam_id} className="hover:bg-slate-50/80">
                            <TableCell>
                              <Link href="/admin/exams/online/manage" className="font-medium text-sm text-slate-700">
                                {exam.title}
                              </Link>
                            </TableCell>
                            <TableCell className="text-sm text-slate-600">
                              <div>
                                <span className="font-medium">{exam.class?.name || '—'}</span>
                                {exam.section && (
                                  <span className="text-xs text-slate-500 block">Section: {exam.section.name}</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-sm text-slate-600">{exam.subject?.name || '—'}</TableCell>
                            <TableCell className="text-sm text-slate-600">
                              <div>
                                <span className="font-medium">{exam.start_date ? format(new Date(exam.start_date), 'MMM d, yyyy') : '—'}</span>
                                <span className="text-xs text-slate-500 block">
                                  {exam.start_date && exam.end_date
                                    ? `${format(new Date(exam.start_date), 'HH:mm')} - ${format(new Date(exam.end_date), 'HH:mm')}`
                                    : ''}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className={`${status.color} text-xs border-0`}>
                                <StatusIcon className="w-3 h-3 mr-1" />
                                {status.label}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex items-center justify-center gap-1 flex-wrap">
                                <Button
                                  size="sm"
                                  className="h-8 text-xs bg-slate-600 hover:bg-slate-700 text-white"
                                  onClick={() => { setSelectedExam(exam); setResultsOpen(true); }}
                                >
                                  <Eye className="w-3 h-3 mr-1" />
                                  Results
                                </Button>
                                <Button
                                  size="sm" variant="ghost"
                                  className="h-8 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                                  onClick={() => { setSelectedExam(exam); setDeleteOpen(true); }}
                                >
                                  <Trash2 className="w-3 h-3 mr-1" />
                                  Delete
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Delete Confirmation */}
        <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Exam</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete <strong>{selectedExam?.title}</strong>? This action cannot be undone and will remove all associated results.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-red-600 hover:bg-red-700">
                {deleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Results Dialog */}
        <Dialog open={resultsOpen} onOpenChange={setResultsOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Exam Results: {selectedExam?.title}</DialogTitle>
              <DialogDescription>
                {selectedExam?.subject?.name || ''} — {selectedExam?.class?.name || ''} {selectedExam?.section?.name ? `(Section: ${selectedExam.section.name})` : ''}
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
      </div>
    </DashboardLayout>
  );
}
