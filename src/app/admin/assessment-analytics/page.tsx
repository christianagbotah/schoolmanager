'use client';

import { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import {
  BarChart3, TrendingUp, TrendingDown, Minus, Users, Award, Target, Printer,
  Search, GraduationCap, BookOpen, Trophy, PieChart, ArrowUpRight, ArrowDownRight,
} from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────

interface OverviewData {
  summary: { avgScore: number; passRate: number; distinctionRate: number; totalExams: number; totalStudents: number; totalMarks: number };
  gradeDistribution: { grade: string; count: number; percentage: number }[];
  topStudents: { name: string; student_code: string; avgScore: number; totalMarks: number }[];
  examTrend: { exam: string; avgScore: number; date: string }[];
}

interface ClassData {
  classId: number; className: string; avgScore: number; highest: number; lowest: number; passRate: number; totalMarks: number; students: number;
}

interface SubjectItem {
  subjectId: number; subjectName: string; avgScore: number; highest: number; lowest: number; passRate: number; totalMarks: number; gradeDistribution: Record<string, number>;
}

interface SubjectAnalysis {
  subjects: SubjectItem[]; easiest: SubjectItem | null; hardest: SubjectItem | null;
  heatmapData: { subjectName: string; grades: { grade: string; count: number; percentage: number; color: string }[] }[];
}

interface StudentTrendItem {
  exam: string; date: string; avgScore: number; highest: number; lowest: number; grade: string; subjects: number; scores: number[];
  trend?: string; trendValue?: number;
}

interface StudentTrendData {
  student: { student_id: number; name: string; student_code: string } | null;
  examTrend: StudentTrendItem[];
  gradeProgression: { exam: string; date: string; grade: string; avgScore: number }[];
  subjectPerformance: { subjectId: number; subjectName: string; avgScore: number; highest: number; lowest: number; latestGrade: string; totalExams: number; trend: string }[];
  overallAvg: number; bestSubject: { subjectName: string; avgScore: number } | null; weakestSubject: { subjectName: string; avgScore: number } | null;
  totalExams: number; totalMarks: number;
}

interface ExamItem { examId: number; name: string; date: string; className: string; }
interface ExamAnalysis {
  exam: { exam_id: number; name: string; date: string | null } | null;
  scoreDistribution: { range: string; count: number; percentage: number }[];
  subjectAverages: { subjectId: number; subjectName: string; avgScore: number; totalMarks: number }[];
  passFailRatio: { pass: number; fail: number; passRate: number };
  avgScore: number; totalStudents: number; totalMarks: number;
}

interface StudentSearchItem { student_id: number; name: string; student_code: string; }

// ─── Helper: color for score ──────────────────────────────────
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

function scoreBgColor(score: number) {
  if (score >= 80) return 'bg-emerald-100';
  if (score >= 60) return 'bg-sky-100';
  if (score >= 50) return 'bg-amber-100';
  return 'bg-red-100';
}

function gradeColor(grade: string) {
  const g = grade.toUpperCase();
  if (g === 'A' || g === 'A+') return 'bg-emerald-600';
  if (g === 'B' || g === 'B+') return 'bg-emerald-400';
  if (g === 'C' || g === 'C+') return 'bg-amber-400';
  if (g === 'D') return 'bg-amber-600';
  return 'bg-red-500';
}

// ─── Skeleton Component ────────────────────────────────────────
function SkeletonCard() {
  return (
    <Card className="border-slate-200/60">
      <CardHeader className="pb-3"><Skeleton className="h-5 w-40" /></CardHeader>
      <CardContent><Skeleton className="h-48 w-full" /></CardContent>
    </Card>
  );
}

function SkeletonSummary() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i} className="border-slate-200/60"><CardContent className="p-4"><Skeleton className="h-16 w-full" /></CardContent></Card>
      ))}
    </div>
  );
}

// ─── CSS Pie Chart (conic-gradient) ────────────────────────────
function PieChartCSS({ pass, fail }: { pass: number; fail: number }) {
  const total = pass + fail;
  if (total === 0) return <div className="w-32 h-32 rounded-full bg-slate-200 flex items-center justify-center"><span className="text-xs text-slate-500">No data</span></div>;
  const passDeg = (pass / total) * 360;
  return (
    <div className="flex items-center gap-4">
      <div
        className="w-32 h-32 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ background: `conic-gradient(#10b981 0deg ${passDeg}deg, #ef4444 ${passDeg}deg 360deg)` }}
      >
        <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center">
          <span className="text-sm font-bold text-slate-700">{Math.round((pass / total) * 100)}%</span>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-500" /><span className="text-sm text-slate-600">Pass: {pass}</span></div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-500" /><span className="text-sm text-slate-600">Fail: {fail}</span></div>
      </div>
    </div>
  );
}

// ─── SVG Line Chart ────────────────────────────────────────────
function LineChartSVG({ data, width = 600, height = 200 }: { data: { label: string; value: number }[]; width?: number; height?: number }) {
  if (data.length === 0) return <div className="text-center text-slate-400 py-8 text-sm">No data to display</div>;
  if (data.length === 1) {
    return (
      <div className="flex items-center justify-center py-4">
        <div className="w-4 h-4 rounded-full bg-emerald-500" />
        <span className="ml-2 text-sm text-slate-600">{data[0].label}: {data[0].value}</span>
      </div>
    );
  }

  const padding = { top: 20, right: 20, bottom: 40, left: 45 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;
  const maxVal = Math.max(...data.map(d => d.value), 1);
  const minVal = 0;

  const points = data.map((d, i) => ({
    x: padding.left + (i / (data.length - 1)) * chartW,
    y: padding.top + chartH - ((d.value - minVal) / (maxVal - minVal)) * chartH,
    ...d,
  }));

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${padding.top + chartH} L ${points[0].x} ${padding.top + chartH} Z`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" preserveAspectRatio="xMidYMid meet">
      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map((frac, i) => {
        const y = padding.top + chartH * (1 - frac);
        const val = Math.round(minVal + frac * (maxVal - minVal));
        return (
          <g key={i}>
            <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="#e2e8f0" strokeWidth={1} />
            <text x={padding.left - 5} y={y + 4} textAnchor="end" className="fill-slate-400" fontSize={10}>{val}</text>
          </g>
        );
      })}
      {/* Area */}
      <path d={areaPath} fill="url(#areaGradient)" opacity={0.3} />
      <defs>
        <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
        </linearGradient>
      </defs>
      {/* Line */}
      <polyline points={points.map(p => `${p.x},${p.y}`).join(' ')} fill="none" stroke="#10b981" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      {/* Dots and labels */}
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r={4} fill="#10b981" stroke="white" strokeWidth={2} />
          <text x={p.x} y={padding.top + chartH + 20} textAnchor="middle" className="fill-slate-500" fontSize={9} transform={`rotate(-30, ${p.x}, ${padding.top + chartH + 20})`}>
            {p.label.length > 12 ? p.label.substring(0, 12) + '...' : p.label}
          </text>
        </g>
      ))}
    </svg>
  );
}

// ─── Main Page ─────────────────────────────────────────────────
export default function AssessmentAnalyticsPage() {
  const [activeTab, setActiveTab] = useState('overview');

  // ─── Overview state ───
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [overviewLoading, setOverviewLoading] = useState(true);

  // ─── Class state ───
  const [classData, setClassData] = useState<ClassData[]>([]);
  const [classLoading, setClassLoading] = useState(false);

  // ─── Subject state ───
  const [subjectData, setSubjectData] = useState<SubjectAnalysis | null>(null);
  const [subjectLoading, setSubjectLoading] = useState(false);
  const [subjectClassFilter, setSubjectClassFilter] = useState('');

  // ─── Student trend state ───
  const [studentSearch, setStudentSearch] = useState('');
  const [studentResults, setStudentResults] = useState<StudentSearchItem[]>([]);
  const [studentSearchOpen, setStudentSearchOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [studentTrend, setStudentTrend] = useState<StudentTrendData | null>(null);
  const [studentLoading, setStudentLoading] = useState(false);

  // ─── Exam state ───
  const [examList, setExamList] = useState<ExamItem[]>([]);
  const [examListLoading, setExamListLoading] = useState(false);
  const [selectedExamId, setSelectedExamId] = useState<number | null>(null);
  const [examAnalysis, setExamAnalysis] = useState<ExamAnalysis | null>(null);
  const [examLoading, setExamLoading] = useState(false);

  // ─── Classes for filters ───
  const [classes, setClasses] = useState<{ class_id: number; name: string }[]>([]);

  // ─── Load classes ───
  useEffect(() => {
    fetch('/api/admin/classes')
      .then(r => r.json())
      .then(data => setClasses(Array.isArray(data) ? data : data.classes || []))
      .catch(() => {});
  }, []);

  // ─── Fetch Overview ───
  const fetchOverview = useCallback(async () => {
    setOverviewLoading(true);
    try {
      const res = await fetch('/api/admin/assessment-analytics?type=overview');
      const data = await res.json();
      setOverview(data);
    } catch {
      toast.error('Failed to load overview');
    }
    setOverviewLoading(false);
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchOverview(); }, [fetchOverview]);

  // ─── Fetch Class Comparison ───
  const fetchClassData = useCallback(async () => {
    setClassLoading(true);
    try {
      const res = await fetch('/api/admin/assessment-analytics?type=class');
      const data = await res.json();
      setClassData(data.classes || []);
    } catch {
      toast.error('Failed to load class comparison');
    }
    setClassLoading(false);
  }, []);

  // ─── Fetch Subject Analysis ───
  const fetchSubjectData = useCallback(async (classId?: string) => {
    setSubjectLoading(true);
    try {
      const params = new URLSearchParams({ type: 'subject' });
      if (classId) params.set('classId', classId);
      const res = await fetch(`/api/admin/assessment-analytics?${params}`);
      const data = await res.json();
      setSubjectData(data);
    } catch {
      toast.error('Failed to load subject analysis');
    }
    setSubjectLoading(false);
  }, []);

  // ─── Student Search ───
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (studentSearch.length < 2) { setStudentResults([]); setStudentSearchOpen(false); return; }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/admin/students?search=${encodeURIComponent(studentSearch)}&limit=10`);
        const data = await res.json();
        setStudentResults(Array.isArray(data) ? data.slice(0, 10) : []);
        setStudentSearchOpen(true);
      } catch { /* ignore */ }
    }, 300);
    return () => clearTimeout(timer);
  }, [studentSearch]);

  // ─── Fetch Student Trend ───
  const fetchStudentTrend = useCallback(async (sid: number) => {
    setStudentLoading(true);
    try {
      const res = await fetch(`/api/admin/assessment-analytics/student-trend?studentId=${sid}`);
      const data = await res.json();
      setStudentTrend(data);
    } catch {
      toast.error('Failed to load student trend');
    }
    setStudentLoading(false);
  }, []);

  // ─── Fetch Exam List ───
  const fetchExamList = useCallback(async () => {
    setExamListLoading(true);
    try {
      const res = await fetch('/api/admin/assessment-analytics?type=exam');
      const data = await res.json();
      setExamList(data.exams || []);
    } catch {
      toast.error('Failed to load exam list');
    }
    setExamListLoading(false);
  }, []);

  // ─── Fetch Exam Analysis ───
  const fetchExamAnalysis = useCallback(async (eid: number) => {
    setExamLoading(true);
    try {
      const res = await fetch(`/api/admin/assessment-analytics?type=exam&examId=${eid}`);
      const data = await res.json();
      setExamAnalysis(data);
    } catch {
      toast.error('Failed to load exam analysis');
    }
    setExamLoading(false);
  }, []);

  // ─── Tab change handler ───
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (tab === 'class' && classData.length === 0 && !classLoading) fetchClassData();
    if (tab === 'subject' && !subjectData && !subjectLoading) fetchSubjectData();
    if (tab === 'student' && examList.length === 0 && !examListLoading) { /* student search on demand */ }
    if (tab === 'exam' && examList.length === 0 && !examListLoading) fetchExamList();
  };

  // ─── Print ───
  const handlePrint = () => {
    window.print();
  };

  // ═══════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════
  return (
    <DashboardLayout>
      <div className="space-y-6 print:space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Assessment Analytics</h1>
            <p className="text-sm text-slate-500 mt-1">Comprehensive graphs and performance analytics</p>
          </div>
          <Button variant="outline" size="sm" className="h-9" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-2" />Export to PDF
          </Button>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="print:hidden">
          <TabsList className="flex-wrap gap-1">
            <TabsTrigger value="overview"><BarChart3 className="w-4 h-4 mr-1.5" />Overview</TabsTrigger>
            <TabsTrigger value="class"><Users className="w-4 h-4 mr-1.5" />Classes</TabsTrigger>
            <TabsTrigger value="subject"><BookOpen className="w-4 h-4 mr-1.5" />Subjects</TabsTrigger>
            <TabsTrigger value="student"><GraduationCap className="w-4 h-4 mr-1.5" />Student</TabsTrigger>
            <TabsTrigger value="exam"><Target className="w-4 h-4 mr-1.5" />Exams</TabsTrigger>
          </TabsList>

          {/* ─── OVERVIEW TAB ──────────────────────────────────── */}
          <TabsContent value="overview" className="space-y-6 mt-6">
            {overviewLoading ? (
              <>
                <SkeletonSummary />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">{Array.from({ length: 2 }).map((_, i) => <SkeletonCard key={i} />)}</div>
              </>
            ) : overview ? (
              <>
                {/* Summary Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card className="border-slate-200/60"><CardContent className="p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center"><Target className="w-5 h-5 text-emerald-600" /></div>
                    <div><p className="text-xs text-slate-500">Average Score</p><p className={`text-xl font-bold ${scoreColor(overview.summary.avgScore)}`}>{overview.summary.avgScore}%</p></div>
                  </CardContent></Card>
                  <Card className="border-slate-200/60"><CardContent className="p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-sky-100 flex items-center justify-center"><TrendingUp className="w-5 h-5 text-sky-600" /></div>
                    <div><p className="text-xs text-slate-500">Pass Rate</p><p className="text-xl font-bold text-sky-600">{overview.summary.passRate}%</p></div>
                  </CardContent></Card>
                  <Card className="border-slate-200/60"><CardContent className="p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center"><Award className="w-5 h-5 text-amber-600" /></div>
                    <div><p className="text-xs text-slate-500">Distinction Rate</p><p className="text-xl font-bold text-amber-600">{overview.summary.distinctionRate}%</p></div>
                  </CardContent></Card>
                  <Card className="border-slate-200/60"><CardContent className="p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center"><PieChart className="w-5 h-5 text-violet-600" /></div>
                    <div><p className="text-xs text-slate-500">Total Records</p><p className="text-xl font-bold text-slate-800">{overview.summary.totalMarks.toLocaleString()}</p><p className="text-[10px] text-slate-400">{overview.summary.totalExams} exams &middot; {overview.summary.totalStudents} students</p></div>
                  </CardContent></Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Grade Distribution */}
                  <Card className="border-slate-200/60">
                    <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><PieChart className="w-5 h-5 text-emerald-600" />Grade Distribution</CardTitle></CardHeader>
                    <CardContent>
                      {overview.gradeDistribution.length === 0 ? (
                        <p className="text-center text-slate-400 py-8 text-sm">No grade data available</p>
                      ) : (
                        <div className="space-y-3">
                          {overview.gradeDistribution.map((g) => (
                            <div key={g.grade} className="flex items-center gap-3">
                              <span className="w-10 text-sm font-medium text-slate-700 flex-shrink-0">{g.grade}</span>
                              <div className="flex-1 h-7 bg-slate-100 rounded overflow-hidden relative">
                                <div
                                  className={`h-full rounded ${gradeColor(g.grade)} transition-all duration-500`}
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

                  {/* Exam Performance Trend */}
                  <Card className="border-slate-200/60">
                    <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><TrendingUp className="w-5 h-5 text-sky-600" />Exam Performance Trend</CardTitle></CardHeader>
                    <CardContent>
                      {overview.examTrend.length === 0 ? (
                        <p className="text-center text-slate-400 py-8 text-sm">No exam trend data</p>
                      ) : (
                        <LineChartSVG
                          data={overview.examTrend.map(e => ({ label: e.exam, value: e.avgScore }))}
                        />
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Top Students */}
                <Card className="border-slate-200/60">
                  <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Trophy className="w-5 h-5 text-amber-500" />Top 10 Students</CardTitle><CardDescription>Ranked by average score across all exams</CardDescription></CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader><TableRow className="bg-slate-50"><TableHead className="w-12">#</TableHead><TableHead>Student</TableHead><TableHead className="text-center">Exams</TableHead><TableHead className="text-right">Avg Score</TableHead></TableRow></TableHeader>
                        <TableBody>
                          {overview.topStudents.length === 0 ? (
                            <TableRow><TableCell colSpan={4} className="text-center py-8 text-slate-400 text-sm">No student data</TableCell></TableRow>
                          ) : (
                            overview.topStudents.map((s, i) => (
                              <TableRow key={i}>
                                <TableCell>
                                  <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${i < 3 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
                                    {i + 1}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${scoreBgColor(s.avgScore)}`}>
                                      <span className="text-xs font-bold">{s.name.charAt(0)}</span>
                                    </div>
                                    <div><p className="text-sm font-medium">{s.name}</p><p className="text-xs text-slate-400 font-mono">{s.student_code}</p></div>
                                  </div>
                                </TableCell>
                                <TableCell className="text-center text-sm text-slate-500">{s.totalMarks}</TableCell>
                                <TableCell className="text-right"><span className={`text-sm font-bold ${scoreColor(s.avgScore)}`}>{s.avgScore}%</span></TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card className="border-slate-200/60"><CardContent className="py-12 text-center text-slate-400">No assessment data found</CardContent></Card>
            )}
          </TabsContent>

          {/* ─── CLASS COMPARISON TAB ─────────────────────────── */}
          <TabsContent value="class" className="space-y-6 mt-6">
            {classLoading ? (
              <><SkeletonSummary /><SkeletonCard /></>
            ) : classData.length === 0 ? (
              <Card className="border-slate-200/60"><CardContent className="py-12 text-center text-slate-400">No class performance data found</CardContent></Card>
            ) : (
              <>
                {/* Bar chart comparing class averages */}
                <Card className="border-slate-200/60">
                  <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><BarChart3 className="w-5 h-5 text-emerald-600" />Class Average Comparison</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {classData.map((c, i) => {
                        const maxAvg = Math.max(...classData.map(x => x.avgScore), 1);
                        return (
                          <div key={c.classId} className="flex items-center gap-3">
                            <span className="w-24 text-sm font-medium text-slate-700 flex-shrink-0 truncate">{c.className}</span>
                            <div className="flex-1 h-8 bg-slate-100 rounded overflow-hidden relative">
                              <div
                                className={`h-full rounded transition-all duration-500 ${scoreBarColor(c.avgScore)}`}
                                style={{ width: `${(c.avgScore / maxAvg) * 100}%` }}
                              />
                              <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-slate-700">{c.avgScore}%</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Class Stats Table */}
                <Card className="border-slate-200/60">
                  <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Users className="w-5 h-5 text-sky-600" />Class-wise Statistics</CardTitle></CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader><TableRow className="bg-slate-50"><TableHead>Class</TableHead><TableHead>Students</TableHead><TableHead className="text-right">Avg Score</TableHead><TableHead className="text-right">Highest</TableHead><TableHead className="text-right">Lowest</TableHead><TableHead className="text-right">Pass Rate</TableHead><TableHead className="text-center">Performance</TableHead></TableRow></TableHeader>
                        <TableBody>
                          {classData.map((c) => (
                            <TableRow key={c.classId}>
                              <TableCell className="font-medium text-sm">{c.className}</TableCell>
                              <TableCell className="text-sm text-slate-500">{c.students}</TableCell>
                              <TableCell className="text-right"><span className={`text-sm font-bold ${scoreColor(c.avgScore)}`}>{c.avgScore}%</span></TableCell>
                              <TableCell className="text-right text-sm text-emerald-600 font-medium">{c.highest}%</TableCell>
                              <TableCell className="text-right text-sm text-red-600 font-medium">{c.lowest}%</TableCell>
                              <TableCell className="text-right">
                                <span className={`text-sm font-medium ${c.passRate >= 70 ? 'text-emerald-600' : c.passRate >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                                  {c.passRate}%
                                </span>
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge variant={c.passRate >= 80 ? 'default' : c.passRate >= 50 ? 'secondary' : 'destructive'} className="text-[10px]">
                                  {c.passRate >= 80 ? 'Excellent' : c.passRate >= 70 ? 'Good' : c.passRate >= 50 ? 'Average' : 'Needs Improvement'}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          {/* ─── SUBJECT ANALYSIS TAB ─────────────────────────── */}
          <TabsContent value="subject" className="space-y-6 mt-6">
            {/* Class filter */}
            <div className="flex items-center gap-3 print:hidden">
              <span className="text-sm text-slate-500">Filter by class:</span>
              <Select value={subjectClassFilter === '' ? '__all__' : subjectClassFilter} onValueChange={(v) => { const val = v === '__all__' ? '' : v; setSubjectClassFilter(val); fetchSubjectData(val || undefined); }}>
                <SelectTrigger className="w-48 h-9"><SelectValue placeholder="All Classes" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All Classes</SelectItem>
                  {classes.map(c => <SelectItem key={c.class_id} value={String(c.class_id)}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {subjectLoading ? (
              <><SkeletonSummary /><SkeletonCard /></>
            ) : subjectData ? (
              <>
                {/* Hardest/Easiest */}
                {(subjectData.easiest || subjectData.hardest) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {subjectData.easiest && (
                      <Card className="border-emerald-200 bg-emerald-50/30"><CardContent className="p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center"><ArrowUpRight className="w-5 h-5 text-emerald-600" /></div>
                        <div><p className="text-xs text-emerald-600 font-medium">Easiest Subject</p><p className="text-lg font-bold text-emerald-800">{subjectData.easiest.subjectName}</p><p className="text-xs text-emerald-600">Avg: {subjectData.easiest.avgScore}% &middot; Pass: {subjectData.easiest.passRate}%</p></div>
                      </CardContent></Card>
                    )}
                    {subjectData.hardest && (
                      <Card className="border-red-200 bg-red-50/30"><CardContent className="p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center"><ArrowDownRight className="w-5 h-5 text-red-600" /></div>
                        <div><p className="text-xs text-red-600 font-medium">Hardest Subject</p><p className="text-lg font-bold text-red-800">{subjectData.hardest.subjectName}</p><p className="text-xs text-red-600">Avg: {subjectData.hardest.avgScore}% &middot; Pass: {subjectData.hardest.passRate}%</p></div>
                      </CardContent></Card>
                    )}
                  </div>
                )}

                {/* Subject bars */}
                <Card className="border-slate-200/60">
                  <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><BookOpen className="w-5 h-5 text-emerald-600" />Subject Average Scores</CardTitle></CardHeader>
                  <CardContent>
                    {subjectData.subjects.length === 0 ? (
                      <p className="text-center text-slate-400 py-8 text-sm">No subject data available</p>
                    ) : (
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {subjectData.subjects.map((s) => (
                          <div key={s.subjectId} className="flex items-center gap-3">
                            <span className="w-32 text-sm font-medium text-slate-700 flex-shrink-0 truncate">{s.subjectName}</span>
                            <div className="flex-1 h-7 bg-slate-100 rounded overflow-hidden relative">
                              <div
                                className={`h-full rounded transition-all duration-500 ${scoreBarColor(s.avgScore)}`}
                                style={{ width: `${Math.max(s.avgScore, 2)}%` }}
                              />
                              <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-slate-700">{s.avgScore}%</span>
                            </div>
                            <span className="w-16 text-xs text-slate-500 text-right flex-shrink-0">{s.totalMarks} marks</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Heatmap-style grid */}
                {subjectData.heatmapData.length > 0 && (
                  <Card className="border-slate-200/60">
                    <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><BarChart3 className="w-5 h-5 text-amber-600" />Grade Distribution Heatmap</CardTitle><CardDescription>Color-coded by grade ranges across subjects</CardDescription></CardHeader>
                    <CardContent>
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {subjectData.heatmapData.map((row, i) => (
                          <div key={i} className="flex items-center gap-3">
                            <span className="w-32 text-xs font-medium text-slate-600 flex-shrink-0 truncate">{row.subjectName}</span>
                            <div className="flex-1 flex gap-1 h-6">
                              {row.grades.map((g, j) => (
                                <div
                                  key={j}
                                  className={`${g.color} rounded-sm flex items-center justify-center text-[10px] font-bold text-white transition-all duration-300 hover:opacity-80`}
                                  style={{ width: `${Math.max(g.percentage, 8)}%`, minWidth: '24px' }}
                                  title={`${g.grade}: ${g.count}`}
                                >
                                  {g.grade}
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center gap-4 mt-4 pt-3 border-t">
                        <span className="text-[10px] text-slate-400">Legend:</span>
                        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-emerald-600" /><span className="text-[10px] text-slate-500">A</span></div>
                        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-emerald-400" /><span className="text-[10px] text-slate-500">B</span></div>
                        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-amber-400" /><span className="text-[10px] text-slate-500">C</span></div>
                        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-amber-600" /><span className="text-[10px] text-slate-500">D</span></div>
                        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-red-500" /><span className="text-[10px] text-slate-500">E/F</span></div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <Card className="border-slate-200/60"><CardContent className="py-12 text-center text-slate-400">No subject data found</CardContent></Card>
            )}
          </TabsContent>

          {/* ─── STUDENT TREND TAB ─────────────────────────────── */}
          <TabsContent value="student" className="space-y-6 mt-6">
            {/* Student Selector */}
            <Card className="border-slate-200/60 print:hidden">
              <CardContent className="p-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Search student by name or code..."
                    value={studentSearch}
                    onChange={e => setStudentSearch(e.target.value)}
                    className="pl-10 h-10"
                  />
                  {studentSearchOpen && studentResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                      {studentResults.map(s => (
                        <button
                          key={s.student_id}
                          className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 flex items-center gap-3 border-b border-slate-100 last:border-0"
                          onClick={() => { setSelectedStudentId(s.student_id); setStudentSearch(s.name); setStudentSearchOpen(false); fetchStudentTrend(s.student_id); }}
                        >
                          <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600">{s.name.charAt(0)}</div>
                          <div><p className="font-medium">{s.name}</p><p className="text-xs text-slate-400 font-mono">{s.student_code}</p></div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {studentLoading ? (
              <><SkeletonSummary /><SkeletonCard /><SkeletonCard /></>
            ) : studentTrend ? (
              <>
                {/* Student summary */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card className="border-slate-200/60"><CardContent className="p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center"><GraduationCap className="w-5 h-5 text-emerald-600" /></div>
                    <div><p className="text-xs text-slate-500">Overall Average</p><p className={`text-xl font-bold ${scoreColor(studentTrend.overallAvg)}`}>{studentTrend.overallAvg}%</p></div>
                  </CardContent></Card>
                  <Card className="border-slate-200/60"><CardContent className="p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-sky-100 flex items-center justify-center"><Target className="w-5 h-5 text-sky-600" /></div>
                    <div><p className="text-xs text-slate-500">Total Exams</p><p className="text-xl font-bold text-slate-800">{studentTrend.totalExams}</p></div>
                  </CardContent></Card>
                  <Card className="border-slate-200/60"><CardContent className="p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center"><ArrowUpRight className="w-5 h-5 text-emerald-600" /></div>
                    <div><p className="text-xs text-slate-500">Best Subject</p><p className="text-sm font-bold text-emerald-700">{studentTrend.bestSubject?.subjectName || 'N/A'}</p><p className="text-xs text-emerald-600">{studentTrend.bestSubject?.avgScore}%</p></div>
                  </CardContent></Card>
                  <Card className="border-slate-200/60"><CardContent className="p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center"><ArrowDownRight className="w-5 h-5 text-red-600" /></div>
                    <div><p className="text-xs text-slate-500">Weakest Subject</p><p className="text-sm font-bold text-red-700">{studentTrend.weakestSubject?.subjectName || 'N/A'}</p><p className="text-xs text-red-600">{studentTrend.weakestSubject?.avgScore}%</p></div>
                  </CardContent></Card>
                </div>

                {/* Performance line chart */}
                <Card className="border-slate-200/60">
                  <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><TrendingUp className="w-5 h-5 text-emerald-600" />Performance Trend Across Exams</CardTitle></CardHeader>
                  <CardContent>
                    {studentTrend.examTrend.length < 2 ? (
                      <p className="text-center text-slate-400 py-8 text-sm">Need at least 2 exams to show trend</p>
                    ) : (
                      <LineChartSVG
                        data={studentTrend.examTrend.map(e => ({ label: e.exam, value: e.avgScore }))}
                      />
                    )}
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Exam-by-exam scores with trend */}
                  <Card className="border-slate-200/60">
                    <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><BarChart3 className="w-5 h-5 text-sky-600" />Exam Scores</CardTitle></CardHeader>
                    <CardContent>
                      <div className="space-y-2 max-h-80 overflow-y-auto">
                        {studentTrend.examTrend.length === 0 ? (
                          <p className="text-center text-slate-400 py-8 text-sm">No exam data</p>
                        ) : (
                          studentTrend.examTrend.map((e, i) => (
                            <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium text-slate-700 truncate">{e.exam}</span>
                                  <Badge className={`text-[10px] ${gradeColor(e.grade)} text-white`}>{e.grade}</Badge>
                                  {e.trend && e.trend !== 'stable' && (
                                    e.trend === 'up' ? <TrendingUp className="w-3.5 h-3.5 text-emerald-500" /> : <TrendingDown className="w-3.5 h-3.5 text-red-500" />
                                  )}
                                </div>
                                <p className="text-xs text-slate-400">{e.date} &middot; {e.subjects} subjects</p>
                              </div>
                              <div className="flex-shrink-0 flex items-center gap-2">
                                <span className={`text-sm font-bold ${scoreColor(e.avgScore)}`}>{e.avgScore}%</span>
                                <span className="text-[10px] text-slate-400">{e.highest}-{e.lowest}</span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Subject breakdown */}
                  <Card className="border-slate-200/60">
                    <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><BookOpen className="w-5 h-5 text-amber-600" />Subject Breakdown</CardTitle></CardHeader>
                    <CardContent>
                      <div className="space-y-2 max-h-80 overflow-y-auto">
                        {studentTrend.subjectPerformance.length === 0 ? (
                          <p className="text-center text-slate-400 py-8 text-sm">No subject data</p>
                        ) : (
                          studentTrend.subjectPerformance.map((s) => (
                            <div key={s.subjectId} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium text-slate-700 truncate">{s.subjectName}</span>
                                  <Badge className={`text-[10px] ${gradeColor(s.latestGrade)} text-white`}>{s.latestGrade}</Badge>
                                  {s.trend === 'up' && <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />}
                                  {s.trend === 'down' && <TrendingDown className="w-3.5 h-3.5 text-red-500" />}
                                  {s.trend === 'stable' && <Minus className="w-3.5 h-3.5 text-slate-400" />}
                                </div>
                                <p className="text-xs text-slate-400">{s.totalExams} exams &middot; Range: {s.lowest}-{s.highest}</p>
                              </div>
                              <div className="flex-1 max-w-24">
                                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                  <div className={`h-full rounded-full ${scoreBarColor(s.avgScore)}`} style={{ width: `${Math.max(s.avgScore, 2)}%` }} />
                                </div>
                              </div>
                              <span className={`text-sm font-bold flex-shrink-0 ${scoreColor(s.avgScore)}`}>{s.avgScore}%</span>
                            </div>
                          ))
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Grade Progression */}
                <Card className="border-slate-200/60">
                  <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Award className="w-5 h-5 text-violet-600" />Grade Progression</CardTitle></CardHeader>
                  <CardContent>
                    {studentTrend.gradeProgression.length === 0 ? (
                      <p className="text-center text-slate-400 py-8 text-sm">No grade progression data</p>
                    ) : (
                      <div className="flex flex-wrap items-center gap-2">
                        {studentTrend.gradeProgression.map((g, i) => (
                          <div key={i} className="flex items-center gap-2">
                            {i > 0 && <div className="w-6 h-0.5 bg-slate-300" />}
                            <div className="flex flex-col items-center">
                              <Badge className={`${gradeColor(g.grade)} text-white text-xs`}>{g.grade}</Badge>
                              <span className="text-[10px] text-slate-400 mt-1 max-w-20 text-center truncate">{g.exam}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card className="border-slate-200/60"><CardContent className="py-16 text-center">
                <GraduationCap className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-400">Select a student to view their performance trend</p>
              </CardContent></Card>
            )}
          </TabsContent>

          {/* ─── EXAM ANALYSIS TAB ─────────────────────────────── */}
          <TabsContent value="exam" className="space-y-6 mt-6">
            {/* Exam selector */}
            <Card className="border-slate-200/60 print:hidden">
              <CardContent className="p-4">
                <Select
                  value={selectedExamId ? String(selectedExamId) : ''}
                  onValueChange={(v) => { const eid = parseInt(v); setSelectedExamId(eid); fetchExamAnalysis(eid); }}
                >
                  <SelectTrigger className="h-10"><SelectValue placeholder="Select an exam..." /></SelectTrigger>
                  <SelectContent>
                    {examListLoading ? (
                      <SelectItem value="_loading" disabled>Loading...</SelectItem>
                    ) : (
                      examList.map(e => (
                        <SelectItem key={e.examId} value={String(e.examId)}>
                          {e.name} {e.date && `(${e.date})`} {e.className && `- ${e.className}`}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {examLoading ? (
              <><SkeletonSummary /><SkeletonCard /><SkeletonCard /></>
            ) : examAnalysis && selectedExamId ? (
              <>
                {/* Summary */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card className="border-slate-200/60"><CardContent className="p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center"><Target className="w-5 h-5 text-emerald-600" /></div>
                    <div><p className="text-xs text-slate-500">Average Score</p><p className={`text-xl font-bold ${scoreColor(examAnalysis.avgScore)}`}>{examAnalysis.avgScore}%</p></div>
                  </CardContent></Card>
                  <Card className="border-slate-200/60"><CardContent className="p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-sky-100 flex items-center justify-center"><Users className="w-5 h-5 text-sky-600" /></div>
                    <div><p className="text-xs text-slate-500">Students</p><p className="text-xl font-bold text-slate-800">{examAnalysis.totalStudents}</p></div>
                  </CardContent></Card>
                  <Card className="border-slate-200/60"><CardContent className="p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center"><PieChart className="w-5 h-5 text-amber-600" /></div>
                    <div><p className="text-xs text-slate-500">Pass Rate</p><p className={`text-xl font-bold ${examAnalysis.passFailRatio.passRate >= 70 ? 'text-emerald-600' : examAnalysis.passFailRatio.passRate >= 50 ? 'text-amber-600' : 'text-red-600'}`}>{examAnalysis.passFailRatio.passRate}%</p></div>
                  </CardContent></Card>
                  <Card className="border-slate-200/60"><CardContent className="p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center"><BarChart3 className="w-5 h-5 text-violet-600" /></div>
                    <div><p className="text-xs text-slate-500">Total Entries</p><p className="text-xl font-bold text-slate-800">{examAnalysis.totalMarks}</p></div>
                  </CardContent></Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Score Distribution Histogram */}
                  <Card className="border-slate-200/60">
                    <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><BarChart3 className="w-5 h-5 text-emerald-600" />Score Distribution</CardTitle></CardHeader>
                    <CardContent>
                      {examAnalysis.scoreDistribution.length === 0 ? (
                        <p className="text-center text-slate-400 py-8 text-sm">No distribution data</p>
                      ) : (
                        <div className="space-y-3">
                          {examAnalysis.scoreDistribution.map((d) => {
                            const barColor = d.range === '81-100' ? 'bg-emerald-500' : d.range === '61-80' ? 'bg-sky-500' : d.range === '41-60' ? 'bg-amber-500' : d.range === '21-40' ? 'bg-orange-500' : 'bg-red-500';
                            return (
                              <div key={d.range} className="flex items-center gap-3">
                                <span className="w-16 text-sm font-medium text-slate-700 flex-shrink-0">{d.range}</span>
                                <div className="flex-1 h-8 bg-slate-100 rounded overflow-hidden relative">
                                  <div
                                    className={`h-full rounded ${barColor} transition-all duration-500`}
                                    style={{ width: `${Math.max(d.percentage, 2)}%` }}
                                  />
                                  <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-slate-700">{d.count}</span>
                                </div>
                                <span className="w-14 text-xs text-slate-500 text-right flex-shrink-0">{d.percentage}%</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Pass/Fail Pie Chart */}
                  <Card className="border-slate-200/60">
                    <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><PieChart className="w-5 h-5 text-sky-600" />Pass / Fail Ratio</CardTitle></CardHeader>
                    <CardContent>
                      <div className="flex justify-center py-4">
                        <PieChartCSS pass={examAnalysis.passFailRatio.pass} fail={examAnalysis.passFailRatio.fail} />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Subject averages for exam */}
                <Card className="border-slate-200/60">
                  <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><BookOpen className="w-5 h-5 text-amber-600" />Average Score by Subject</CardTitle></CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader><TableRow className="bg-slate-50"><TableHead>Subject</TableHead><TableHead className="text-center">Entries</TableHead><TableHead className="text-right">Avg Score</TableHead><TableHead className="w-40">Performance</TableHead></TableRow></TableHeader>
                        <TableBody>
                          {examAnalysis.subjectAverages.length === 0 ? (
                            <TableRow><TableCell colSpan={4} className="text-center py-8 text-slate-400 text-sm">No subject data for this exam</TableCell></TableRow>
                          ) : (
                            examAnalysis.subjectAverages.map((s) => (
                              <TableRow key={s.subjectId}>
                                <TableCell className="font-medium text-sm">{s.subjectName}</TableCell>
                                <TableCell className="text-center text-sm text-slate-500">{s.totalMarks}</TableCell>
                                <TableCell className="text-right"><span className={`text-sm font-bold ${scoreColor(s.avgScore)}`}>{s.avgScore}%</span></TableCell>
                                <TableCell>
                                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <div className={`h-full rounded-full ${scoreBarColor(s.avgScore)}`} style={{ width: `${Math.max(s.avgScore, 2)}%` }} />
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card className="border-slate-200/60"><CardContent className="py-16 text-center">
                <Target className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-400">Select an exam to view detailed analysis</p>
              </CardContent></Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
