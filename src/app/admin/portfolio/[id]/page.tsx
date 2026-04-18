'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  ArrowLeft, FileText, CheckCircle, XCircle, Clock, Printer,
  User, GraduationCap, BookOpen, BarChart3, Award, MessageSquare,
  Download, AlertCircle,
} from 'lucide-react';
import Link from 'next/link';

// ─── Types ──────────────────────────────────────────────────────

interface StudentInfo {
  student_id: number;
  student_code: string;
  name: string;
  first_name: string;
  last_name: string;
  sex: string;
  birthday: string | null;
  admission_date: string | null;
  phone: string;
  email: string;
  address: string;
}

interface EnrollmentInfo {
  class: { class_id: number; name: string; category: string } | null;
  section: { section_id: number; name: string } | null;
  year: string;
  term: string;
}

interface SBABreakdown {
  category: string;
  label: string;
  weight: number;
  rawScore: number;
  maxScore: number;
  avgScore: number;
  weightedScore: number;
  count: number;
  color: string;
}

interface SubjectData {
  subject_id: number;
  subject_name: string;
  sbaBreakdown: SBABreakdown[];
  weightedScore: number;
  grade: string;
  totalScore: number;
  totalMax: number;
  assessments: AssessmentItem[];
  teacherRemarks: string[];
}

interface AssessmentItem {
  score_id: number;
  header_id: number;
  strand_name: string;
  sub_strand_name: string;
  indicator_text: string;
  score: number;
  max_score: number;
  remarks: string;
  assessment_date: string | null;
  category: string;
  term: string;
  year: string;
}

interface ScoreDistItem {
  range: string;
  count: number;
  percentage: number;
}

interface CumulativeInfo {
  overallScore: number;
  grade: string;
  totalSubjects: number;
  totalAssessments: number;
  reviewedAssessments: number;
  status: string;
}

interface PortfolioDetail {
  student: StudentInfo;
  enrollment: EnrollmentInfo;
  subjects: SubjectData[];
  cumulative: CumulativeInfo;
  scoreDistribution: ScoreDistItem[];
  availableTerms: string[];
  availableYears: string[];
  allTerms: { term_id: number; name: string }[];
  sbaWeights: Record<string, { label: string; weight: number; color: string }>;
}

// ─── Helpers ────────────────────────────────────────────────────

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
    case 'reviewed': return <CheckCircle className="w-4 h-4 text-emerald-600" />;
    case 'submitted': return <Clock className="w-4 h-4 text-amber-600" />;
    default: return <FileText className="w-4 h-4 text-slate-400" />;
  }
}

// ─── Main Page ──────────────────────────────────────────────────

export default function PortfolioDetailPage() {
  const params = useParams();
  const router = useRouter();
  const studentId = params.id as string;

  const [data, setData] = useState<PortfolioDetail | null>(null);
  const [loading, setLoading] = useState(true);

  // Review dialog
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewAction, setReviewAction] = useState('');
  const [reviewRemarks, setReviewRemarks] = useState('');
  const [reviewSaving, setReviewSaving] = useState(false);

  // Expanded subject
  const [expandedSubject, setExpandedSubject] = useState<number | null>(null);

  // ─── Fetch data ──────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/portfolio/${studentId}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const json = await res.json();
      setData(json);
    } catch {
      toast.error('Failed to load portfolio data');
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ─── Review actions ──────────────────────────────────────────
  const openReviewDialog = (action: string) => {
    setReviewAction(action);
    setReviewRemarks('');
    setReviewOpen(true);
  };

  const handleReview = async () => {
    setReviewSaving(true);
    try {
      let action = reviewAction;
      let remarks = reviewRemarks;

      if (action === 'approve') {
        action = 'bulk_review';
        remarks = remarks || 'Approved by admin';
      } else if (action === 'reject') {
        action = 'bulk_review';
        remarks = remarks || 'Revision requested — please review and resubmit';
      } else {
        action = 'bulk_review';
        remarks = remarks || 'Reviewed by admin';
      }

      const res = await fetch(`/api/admin/portfolio/${studentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, remarkText: remarks }),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      toast.success(json.message);
      setReviewOpen(false);
      fetchData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Review action failed');
    } finally {
      setReviewSaving(false);
    }
  };

  // ─── Print ───────────────────────────────────────────────────
  const handlePrint = () => window.print();

  // ─── Export ───────────────────────────────────────────────────
  const handleExportCSV = () => {
    if (!data) return;
    const headers = ['Subject', 'Classwork (20%)', 'Homework (15%)', 'Tests (25%)', 'Projects (15%)', 'Quizzes (10%)', 'Exam (15%)', 'Weighted Score', 'Grade'];
    const rows = data.subjects.map(s => {
      const compMap: Record<string, SBABreakdown> = {};
      s.sbaBreakdown.forEach(b => { compMap[b.category] = b; });
      return [
        s.subject_name,
        String(compMap.classwork?.avgScore || 0),
        String(compMap.homework?.avgScore || 0),
        String(compMap.tests?.avgScore || 0),
        String(compMap.projects?.avgScore || 0),
        String(compMap.quizzes?.avgScore || 0),
        String(compMap.exam?.avgScore || 0),
        String(s.weightedScore),
        s.grade,
      ];
    });
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `portfolio-${data.student.student_code}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Portfolio exported to CSV');
  };

  // ═══════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-32 w-full" />
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
          <Skeleton className="h-64 w-full" />
        </div>
      </DashboardLayout>
    );
  }

  if (!data) {
    return (
      <DashboardLayout>
        <div className="text-center py-20">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-slate-400" />
          <h2 className="text-lg font-semibold text-slate-700">Portfolio Not Found</h2>
          <p className="text-sm text-slate-500 mt-1">Could not load portfolio data for this student</p>
          <Link href="/admin/portfolio">
            <Button className="mt-4"><ArrowLeft className="w-4 h-4 mr-2" />Back to Portfolios</Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const { student, enrollment, subjects, cumulative, scoreDistribution } = data;

  return (
    <DashboardLayout>
      <div className="space-y-6 print:space-y-4">
        {/* ─── Header ─────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
          <div className="flex items-center gap-3">
            <Link href="/admin/portfolio">
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Portfolio Detail</h1>
              <p className="text-sm text-slate-500 mt-0.5">
                {student.name} &middot; {student.student_code}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExportCSV} className="border-emerald-200 text-emerald-700 hover:bg-emerald-50">
              <Download className="w-4 h-4 mr-2" />Export CSV
            </Button>
            <Button variant="outline" size="sm" onClick={handlePrint} className="border-slate-200 text-slate-600 hover:bg-slate-50">
              <Printer className="w-4 h-4 mr-2" />Print
            </Button>
          </div>
        </div>

        {/* ─── Student Info Card ──────────────────────────────── */}
        <Card className="print:shadow-none print:border">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-start gap-6">
              {/* Photo Placeholder */}
              <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                <span className="text-2xl font-bold text-emerald-700">{student.name.charAt(0)}</span>
              </div>

              {/* Student Details */}
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider font-medium">Full Name</p>
                  <p className="text-sm font-semibold text-slate-900 mt-0.5">{student.name}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider font-medium">Student Code</p>
                  <p className="text-sm font-semibold text-slate-900 font-mono mt-0.5">{student.student_code}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider font-medium">Class</p>
                  <p className="text-sm font-semibold text-slate-900 mt-0.5">
                    {enrollment?.class?.name || 'Not Enrolled'}
                    {enrollment?.section?.name && ` — ${enrollment.section.name}`}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider font-medium">Gender</p>
                  <p className="text-sm font-semibold text-slate-900 capitalize mt-0.5">{student.sex || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider font-medium">Admission Date</p>
                  <p className="text-sm text-slate-700 mt-0.5">
                    {student.admission_date ? new Date(student.admission_date).toLocaleDateString() : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider font-medium">Term / Year</p>
                  <p className="text-sm text-slate-700 mt-0.5">{enrollment?.term || '—'} / {enrollment?.year || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider font-medium">Phone</p>
                  <p className="text-sm text-slate-700 mt-0.5">{student.phone || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider font-medium">Status</p>
                  <Badge variant="outline" className={`mt-0.5 capitalize flex items-center gap-1 w-fit ${statusColor(cumulative.status)}`}>
                    {statusIcon(cumulative.status)} {cumulative.status}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ─── Summary Cards ──────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="print:shadow-none print:border">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Cumulative SBA Score</p>
                <p className={`text-xl font-bold ${scoreColor(cumulative.overallScore)}`}>{cumulative.overallScore}%</p>
              </div>
            </CardContent>
          </Card>
          <Card className="print:shadow-none print:border">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <Award className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Overall Grade</p>
                <Badge variant="outline" className={`text-lg font-bold px-3 ${gradeBadgeColor(cumulative.grade)}`}>
                  {cumulative.grade}
                </Badge>
              </div>
            </CardContent>
          </Card>
          <Card className="print:shadow-none print:border">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-sky-100 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-sky-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Subjects</p>
                <p className="text-xl font-bold text-slate-900">{cumulative.totalSubjects}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="print:shadow-none print:border">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center">
                <FileText className="w-5 h-5 text-violet-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Assessments</p>
                <p className="text-xl font-bold text-slate-900">{cumulative.totalAssessments}</p>
                <p className="text-[10px] text-slate-400">{cumulative.reviewedAssessments} reviewed</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ─── Score Distribution Chart ───────────────────────── */}
        {scoreDistribution.length > 0 && (
          <Card className="print:shadow-none print:border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-emerald-600" />
                Score Distribution
              </CardTitle>
              <CardDescription>Distribution of assessment scores across all subjects</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-4 h-40 px-4">
                {scoreDistribution.map((d) => (
                  <div key={d.range} className="flex-1 flex flex-col items-center gap-2">
                    <span className="text-xs font-medium text-slate-600">{d.count}</span>
                    <div className="w-full flex justify-center" style={{ height: '100%' }}>
                      <div
                        className={`w-3/4 rounded-t transition-all duration-500 ${
                          d.percentage > 30 ? 'bg-emerald-500' : d.percentage > 15 ? 'bg-amber-500' : d.percentage > 0 ? 'bg-red-400' : 'bg-slate-200'
                        }`}
                        style={{
                          height: `${Math.max(d.percentage * 2, 4)}%`,
                          alignSelf: 'flex-end',
                        }}
                      />
                    </div>
                    <span className="text-xs text-slate-500 font-medium">{d.range}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* ─── SBA Components Table ───────────────────────────── */}
        <Card className="print:shadow-none print:border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="w-5 h-5 text-sky-600" />
              SBA Components by Subject
            </CardTitle>
            <CardDescription>
              Breakdown of School-Based Assessment components with weighted scores
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="text-xs font-semibold min-w-[160px]">Subject</TableHead>
                    <TableHead className="text-xs font-semibold text-center">Classwork (20%)</TableHead>
                    <TableHead className="text-xs font-semibold text-center">Homework (15%)</TableHead>
                    <TableHead className="text-xs font-semibold text-center">Tests (25%)</TableHead>
                    <TableHead className="text-xs font-semibold text-center">Projects (15%)</TableHead>
                    <TableHead className="text-xs font-semibold text-center">Quiz (10%)</TableHead>
                    <TableHead className="text-xs font-semibold text-center">Exam (15%)</TableHead>
                    <TableHead className="text-xs font-semibold text-center">Weighted Score</TableHead>
                    <TableHead className="text-xs font-semibold text-center">Grade</TableHead>
                    <TableHead className="text-xs font-semibold text-center print:hidden">Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subjects.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-12 text-slate-400">
                        <BookOpen className="w-10 h-10 mx-auto mb-2 opacity-50" />
                        <p>No SBA data available for this student</p>
                        <p className="text-xs mt-1">Portfolio scores will appear once assessments are recorded</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    subjects.map((subj) => {
                      const compMap: Record<string, SBABreakdown> = {};
                      subj.sbaBreakdown.forEach(b => { compMap[b.category] = b; });

                      return (
                        <TableRow key={subj.subject_id} className="hover:bg-slate-50/50">
                          <TableCell className="font-medium text-sm">{subj.subject_name}</TableCell>
                          <TableCell className="text-center">
                            <SBAComponentCell comp={compMap.classwork} />
                          </TableCell>
                          <TableCell className="text-center">
                            <SBAComponentCell comp={compMap.homework} />
                          </TableCell>
                          <TableCell className="text-center">
                            <SBAComponentCell comp={compMap.tests} />
                          </TableCell>
                          <TableCell className="text-center">
                            <SBAComponentCell comp={compMap.projects} />
                          </TableCell>
                          <TableCell className="text-center">
                            <SBAComponentCell comp={compMap.quizzes} />
                          </TableCell>
                          <TableCell className="text-center">
                            <SBAComponentCell comp={compMap.exam} />
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex flex-col items-center">
                              <span className={`text-sm font-bold ${scoreColor(subj.weightedScore)}`}>{subj.weightedScore}%</span>
                              <div className="w-16 h-1.5 bg-slate-100 rounded-full mt-1 overflow-hidden">
                                <div className={`h-full rounded-full ${scoreBarColor(subj.weightedScore)}`} style={{ width: `${Math.max(subj.weightedScore, 2)}%` }} />
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline" className={`text-xs font-bold ${gradeBadgeColor(subj.grade)}`}>{subj.grade}</Badge>
                          </TableCell>
                          <TableCell className="text-center print:hidden">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs"
                              onClick={() => setExpandedSubject(expandedSubject === subj.subject_id ? null : subj.subject_id)}
                            >
                              {expandedSubject === subj.subject_id ? 'Hide' : 'View'}
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}

                  {/* Cumulative Row */}
                  {subjects.length > 0 && (
                    <TableRow className="bg-slate-50 font-semibold">
                      <TableCell className="text-sm">Cumulative SBA</TableCell>
                      {['classwork', 'homework', 'tests', 'projects', 'quizzes', 'exam'].map(cat => {
                        const catScores = subjects
                          .map(s => s.sbaBreakdown.find(b => b.category === cat)?.avgScore || 0)
                          .filter(s => s > 0);
                        const avg = catScores.length > 0 ? catScores.reduce((a, b) => a + b, 0) / catScores.length : 0;
                        return (
                          <TableCell key={cat} className="text-center text-sm">
                            <span className={scoreColor(avg)}>{avg > 0 ? avg.toFixed(1) : '—'}</span>
                          </TableCell>
                        );
                      })}
                      <TableCell className="text-center">
                        <span className={`text-base font-bold ${scoreColor(cumulative.overallScore)}`}>{cumulative.overallScore}%</span>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className={`text-sm font-bold px-3 ${gradeBadgeColor(cumulative.grade)}`}>
                          {cumulative.grade}
                        </Badge>
                      </TableCell>
                      <TableCell />
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* ─── Expanded Subject Detail ─────────────────────────── */}
        {expandedSubject !== null && (() => {
          const subj = subjects.find(s => s.subject_id === expandedSubject);
          if (!subj) return null;

          return (
            <Card className="print:shadow-none print:border">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-violet-600" />
                  {subj.subject_name} — Detailed Assessments
                </CardTitle>
                <CardDescription>
                  {subj.assessments.length} assessment(s) recorded
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {subj.assessments.length === 0 ? (
                  <p className="text-center text-slate-400 py-8 text-sm">No detailed assessment records</p>
                ) : (
                  <div className="max-h-80 overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50">
                          <TableHead className="text-xs">Strand</TableHead>
                          <TableHead className="text-xs">Sub-strand</TableHead>
                          <TableHead className="text-xs">Indicator</TableHead>
                          <TableHead className="text-xs text-center">Score</TableHead>
                          <TableHead className="text-xs text-center">Max</TableHead>
                          <TableHead className="text-xs text-center">%</TableHead>
                          <TableHead className="text-xs">Category</TableHead>
                          <TableHead className="text-xs">Remarks</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {subj.assessments.map((a) => (
                          <TableRow key={a.score_id} className="hover:bg-slate-50/50">
                            <TableCell className="text-sm max-w-[120px] truncate">{a.strand_name || '—'}</TableCell>
                            <TableCell className="text-sm max-w-[120px] truncate">{a.sub_strand_name || '—'}</TableCell>
                            <TableCell className="text-sm max-w-[150px] truncate">{a.indicator_text || '—'}</TableCell>
                            <TableCell className="text-center text-sm font-medium">{a.score}</TableCell>
                            <TableCell className="text-center text-sm text-slate-500">{a.max_score}</TableCell>
                            <TableCell className="text-center">
                              <span className={`text-sm font-medium ${scoreColor(a.max_score > 0 ? (a.score / a.max_score) * 100 : 0)}`}>
                                {a.max_score > 0 ? ((a.score / a.max_score) * 100).toFixed(0) : 0}%
                              </span>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant="outline" className="text-[10px] capitalize" style={{ borderColor: subj.sbaBreakdown.find(b => b.category === a.category)?.color || '#94a3b8' }}>
                                {a.category}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs text-slate-500 max-w-[150px] truncate">{a.remarks || '—'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}

                {/* Teacher Remarks */}
                {subj.teacherRemarks.length > 0 && (
                  <div className="border-t p-4 space-y-2">
                    <p className="text-xs font-medium text-slate-600 flex items-center gap-1">
                      <MessageSquare className="w-3 h-3" />Teacher Remarks ({subj.teacherRemarks.length})
                    </p>
                    {subj.teacherRemarks.map((r, i) => (
                      <p key={i} className="text-sm text-slate-600 bg-slate-50 rounded p-2">{r}</p>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })()}

        {/* ─── Subject-wise SBA Breakdown Visual ──────────────── */}
        {subjects.length > 0 && (
          <Card className="print:shadow-none print:border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-amber-600" />
                Subject Performance Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {subjects.map((subj) => (
                  <div key={subj.subject_id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-700">{subj.subject_name}</span>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-bold ${scoreColor(subj.weightedScore)}`}>{subj.weightedScore}%</span>
                        <Badge variant="outline" className={`text-[10px] ${gradeBadgeColor(subj.grade)}`}>{subj.grade}</Badge>
                      </div>
                    </div>
                    {/* Stacked bar for SBA components */}
                    <div className="h-6 bg-slate-100 rounded overflow-hidden flex">
                      {subj.sbaBreakdown.map((comp) => {
                        const width = comp.count > 0 ? Math.max(comp.avgScore * comp.weight / 100, 1) : 0;
                        return (
                          <div
                            key={comp.category}
                            className="h-full transition-all duration-500"
                            style={{ width: `${width}%`, backgroundColor: comp.color, minWidth: width > 0 ? '2px' : '0' }}
                            title={`${comp.label}: ${comp.avgScore}% (weight: ${comp.weight}%)`}
                          />
                        );
                      })}
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1">
                      {subj.sbaBreakdown.map((comp) => (
                        <span key={comp.category} className="flex items-center gap-1 text-[10px] text-slate-500">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: comp.color }} />
                          {comp.label}: {comp.avgScore}%
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Legend */}
              <div className="flex flex-wrap gap-4 mt-4 pt-3 border-t">
                {subjects[0]?.sbaBreakdown.map((comp) => (
                  <div key={comp.category} className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded" style={{ backgroundColor: comp.color }} />
                    <span className="text-xs text-slate-600">{comp.label} ({comp.weight}%)</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* ─── Action Buttons ──────────────────────────────────── */}
        <Card className="print:hidden">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={() => openReviewDialog('approve')}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              >
                <CheckCircle className="w-4 h-4 mr-2" />Approve Portfolio
              </Button>
              <Button
                onClick={() => openReviewDialog('reject')}
                variant="outline"
                className="flex-1 border-amber-200 text-amber-700 hover:bg-amber-50"
              >
                <XCircle className="w-4 h-4 mr-2" />Request Revision
              </Button>
              <Button
                onClick={() => openReviewDialog('comment')}
                variant="outline"
                className="flex-1 border-sky-200 text-sky-700 hover:bg-sky-50"
              >
                <MessageSquare className="w-4 h-4 mr-2" />Add Comment
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ─── Review Dialog ────────────────────────────────────── */}
      <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {reviewAction === 'approve' && <><CheckCircle className="w-5 h-5 text-emerald-600" />Approve Portfolio</>}
              {reviewAction === 'reject' && <><XCircle className="w-5 h-5 text-amber-600" />Request Revision</>}
              {reviewAction === 'comment' && <><MessageSquare className="w-5 h-5 text-sky-600" />Add Comment</>}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-slate-500">
              {reviewAction === 'approve' && 'Confirm approval for this student\'s portfolio.'}
              {reviewAction === 'reject' && 'Request revision for this student\'s portfolio. Add a reason below.'}
              {reviewAction === 'comment' && 'Add review comments for this student\'s portfolio.'}
            </p>
            <Textarea
              placeholder={
                reviewAction === 'approve' ? 'Optional approval notes...' :
                reviewAction === 'reject' ? 'Reason for revision request...' :
                'Enter your comments...'
              }
              value={reviewRemarks}
              onChange={(e) => setReviewRemarks(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewOpen(false)}>Cancel</Button>
            <Button
              onClick={handleReview}
              disabled={reviewSaving}
              className={
                reviewAction === 'approve' ? 'bg-emerald-600 hover:bg-emerald-700' :
                reviewAction === 'reject' ? 'bg-amber-600 hover:bg-amber-700' :
                'bg-sky-600 hover:bg-sky-700'
              }
            >
              {reviewSaving ? 'Saving...' :
               reviewAction === 'approve' ? 'Approve' :
               reviewAction === 'reject' ? 'Request Revision' :
               'Save Comment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

// ─── SBA Component Cell ────────────────────────────────────────

function SBAComponentCell({ comp }: { comp?: SBABreakdown }) {
  if (!comp || comp.count === 0) {
    return <span className="text-xs text-slate-400">—</span>;
  }

  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className={`text-xs font-semibold ${scoreColor(comp.avgScore)}`}>{comp.avgScore.toFixed(1)}</span>
      <div className="w-12 h-1 bg-slate-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.max(comp.avgScore, 2)}%`, backgroundColor: comp.color }} />
      </div>
      <span className="text-[9px] text-slate-400">{comp.count} item(s)</span>
    </div>
  );
}
