"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Trophy, Eye, Loader2, AlertTriangle, CheckCircle,
  BarChart3, Clock, Users, FileQuestion, Target,
  TrendingUp, Award, ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useAuth } from "@/hooks/use-auth";
import { format } from "date-fns";

// ─── Types ───────────────────────────────────────────────────
interface OnlineExam {
  online_exam_id: number;
  title: string;
  subject_id?: number;
  class_id?: number;
  duration: number;
  status: string;
  total_questions: number;
  created_at?: string;
  subject?: { subject_id: number; name: string };
  class?: { class_id: number; name: string };
  results?: {
    online_exam_result_id: number;
    student_id: number;
    obtained_mark: number;
    total_mark: number;
    status: string;
    student?: { name: string; student_code: string };
  }[];
  _count?: { results: number };
}

interface SubjectItem { subject_id: number; name: string; class?: { class_id: number; name: string } }

// ─── Helpers ─────────────────────────────────────────────────
function getGradeInfo(pct: number): { label: string; color: string } {
  if (pct >= 80) return { label: "A", color: "bg-emerald-100 text-emerald-700" };
  if (pct >= 70) return { label: "B", color: "bg-sky-100 text-sky-700" };
  if (pct >= 60) return { label: "C", color: "bg-blue-100 text-blue-700" };
  if (pct >= 50) return { label: "D", color: "bg-amber-100 text-amber-700" };
  return { label: "F", color: "bg-red-100 text-red-700" };
}

// ─── Main Component ──────────────────────────────────────────
export default function TeacherOnlineExamsPage() {
  const { isLoading: authLoading } = useAuth();
  const [exams, setExams] = useState<OnlineExam[]>([]);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"exams" | "results" | "analytics">("exams");
  const [filterSubject, setFilterSubject] = useState("");

  // Detail dialog
  const [selectedExam, setSelectedExam] = useState<OnlineExam | null>(null);

  const fetchExams = useCallback(async () => {
    setIsLoading(true);
    try {
      const [examsRes, subjectsRes] = await Promise.all([
        fetch("/api/teacher/exams"),
        fetch("/api/teacher/subjects"),
      ]);
      if (examsRes.ok) { const d = await examsRes.json(); setExams(Array.isArray(d) ? d : []); }
      if (subjectsRes.ok) { const d = await subjectsRes.json(); setSubjects(Array.isArray(d) ? d : []); }
    } catch {
      setError("Failed to load online exams");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading) fetchExams();
  }, [authLoading, fetchExams]);

  // Computed stats
  const totalExams = exams.length;
  const activeExams = exams.filter(e => e.status === "active").length;
  const totalSubmissions = exams.reduce((sum, e) => sum + (e.results?.length || 0), 0);
  const examsWithResults = exams.filter(e => e.results && e.results.length > 0);

  // Overall average across all exams with results
  const overallAvg = examsWithResults.length > 0
    ? Math.round(examsWithResults.reduce((sum, e) => {
        const avg = e.results!.reduce((s, r) => s + r.obtained_mark, 0) / e.results!.length;
        return sum + avg;
      }, 0) / examsWithResults.length)
    : 0;

  // Pass rate
  const totalResults = examsWithResults.reduce((sum, e) => sum + e.results!.length, 0);
  const passedResults = examsWithResults.reduce((sum, e) => {
    return sum + e.results!.filter(r => {
      const pct = r.total_mark > 0 ? (r.obtained_mark / r.total_mark) * 100 : 0;
      return pct >= 50;
    }).length;
  }, 0);
  const passRate = totalResults > 0 ? Math.round((passedResults / totalResults) * 100) : 0;

  const filteredExams = filterSubject
    ? exams.filter(e => String(e.subject_id) === filterSubject)
    : exams;

  const filteredExamsWithResults = filterSubject
    ? examsWithResults.filter(e => String(e.subject_id) === filterSubject)
    : examsWithResults;

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 w-full" />)}
          </div>
          <Skeleton className="h-96 w-full" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* ─── Header ─────────────────────────────────────── */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Online Exams</h1>
          <p className="text-sm text-slate-500 mt-1">View and analyze online assessments for your classes</p>
        </div>

        {error && (
          <div className="flex items-center gap-3 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />{error}
          </div>
        )}

        {/* ─── Stats ──────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="gap-4 py-4 border-l-4 border-l-emerald-500">
            <CardContent className="px-4 pb-0 pt-0">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-slate-500">Total Exams</p>
                  <p className="text-2xl font-bold text-emerald-600">{totalExams}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-emerald-600" />
                </div>
              </div>
              <div className="mt-2 flex items-center gap-1">
                <span className="text-[10px] text-slate-400">{activeExams} active</span>
              </div>
            </CardContent>
          </Card>
          <Card className="gap-4 py-4 border-l-4 border-l-violet-500">
            <CardContent className="px-4 pb-0 pt-0">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-slate-500">Avg Score</p>
                  <p className="text-2xl font-bold text-violet-600">{overallAvg}%</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
                  <Target className="w-5 h-5 text-violet-600" />
                </div>
              </div>
              <div className="mt-2 flex items-center gap-1">
                <span className="text-[10px] text-slate-400">{totalResults} submissions</span>
              </div>
            </CardContent>
          </Card>
          <Card className="gap-4 py-4 border-l-4 border-l-amber-500">
            <CardContent className="px-4 pb-0 pt-0">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-slate-500">Pass Rate</p>
                  <p className="text-2xl font-bold text-amber-600">{passRate}%</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-amber-600" />
                </div>
              </div>
              <Progress value={passRate} className="mt-2 h-1.5" />
            </CardContent>
          </Card>
          <Card className="gap-4 py-4 border-l-4 border-l-rose-500">
            <CardContent className="px-4 pb-0 pt-0">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-slate-500">My Subjects</p>
                  <p className="text-2xl font-bold text-rose-600">{subjects.length}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center">
                  <Award className="w-5 h-5 text-rose-600" />
                </div>
              </div>
              <div className="mt-2 flex items-center gap-1">
                <span className="text-[10px] text-slate-400">Across {exams.length} exams</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ─── Tabs ───────────────────────────────────────── */}
        <Tabs value={tab} onValueChange={(v) => setTab(v as "exams" | "results" | "analytics")}>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <TabsList>
              <TabsTrigger value="exams">My Exams ({filteredExams.length})</TabsTrigger>
              <TabsTrigger value="results">Results ({examsWithResults.length})</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>
            <div className="sm:ml-auto">
              <Select value={filterSubject === '' ? '__all__' : filterSubject} onValueChange={(v) => setFilterSubject(v === '__all__' ? '' : v)}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="All Subjects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All Subjects</SelectItem>
                  {subjects.map((s) => (
                    <SelectItem key={s.subject_id} value={String(s.subject_id)}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* ─── Exams Tab ─────────────────────────────────── */}
          <TabsContent value="exams" className="mt-4">
            <Card className="gap-4">
              <CardContent className="pt-6">
                {filteredExams.length === 0 ? (
                  <div className="text-center py-16">
                    <Trophy className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-600">No online exams found</h3>
                    <p className="text-sm text-slate-400 mt-1">Exams will appear once created by administrators</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {filteredExams.map((exam) => {
                      const avgMark = exam.results && exam.results.length > 0
                        ? Math.round(exam.results.reduce((sum, r) => sum + r.obtained_mark, 0) / exam.results.length)
                        : 0;
                      return (
                        <div key={exam.online_exam_id} className="flex items-center gap-4 p-4 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => setSelectedExam(exam)}>
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                            exam.status === "active" ? "bg-emerald-100" : exam.status === "closed" ? "bg-slate-100" : "bg-amber-100"
                          }`}>
                            <Trophy className={`w-6 h-6 ${
                              exam.status === "active" ? "text-emerald-600" : exam.status === "closed" ? "text-slate-400" : "text-amber-600"
                            }`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm text-slate-900">{exam.title}</p>
                            <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-400">
                              <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{exam.duration} min</span>
                              <span>{exam.total_questions} questions</span>
                              {exam.subject?.name && <Badge variant="outline" className="text-[10px]">{exam.subject.name}</Badge>}
                              {exam.class?.name && <Badge variant="outline" className="text-[10px]">{exam.class.name}</Badge>}
                            </div>
                            {exam.results && exam.results.length > 0 && (
                              <div className="flex items-center gap-3 mt-1">
                                <span className="text-[10px] text-slate-400">Avg: {avgMark}%</span>
                                <Progress value={avgMark} className="h-1 w-20" />
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Badge variant="secondary" className={
                              exam.status === "active" ? "bg-emerald-100 text-emerald-700" :
                              exam.status === "closed" ? "bg-slate-200 text-slate-600" :
                              "bg-amber-100 text-amber-700"
                            }>
                              {exam.status || "draft"}
                            </Badge>
                            {exam._count && exam._count.results > 0 && (
                              <Badge variant="outline" className="text-[10px]">
                                <Users className="w-3 h-3 mr-0.5" />{exam._count.results}
                              </Badge>
                            )}
                            <ChevronRight className="w-4 h-4 text-slate-300" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ─── Results Tab ────────────────────────────────── */}
          <TabsContent value="results" className="mt-4">
            <Card className="gap-4">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                    <BarChart3 className="w-4 h-4 text-purple-600" />
                  </div>
                  <CardTitle className="text-base font-semibold">Exam Results</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {filteredExamsWithResults.length === 0 ? (
                  <div className="text-center py-16">
                    <BarChart3 className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-600">No results recorded yet</h3>
                    <p className="text-sm text-slate-400 mt-1">Results will appear once students complete exams</p>
                  </div>
                ) : (
                  <div className="space-y-6 max-h-[500px] overflow-y-auto">
                    {filteredExamsWithResults.map((exam) => {
                      const avgMark = exam.results!.length > 0
                        ? Math.round(exam.results!.reduce((sum, r) => sum + r.obtained_mark, 0) / exam.results!.length)
                        : 0;
                      const examPass = exam.results!.filter(r => {
                        const pct = r.total_mark > 0 ? (r.obtained_mark / r.total_mark) * 100 : 0;
                        return pct >= 50;
                      }).length;
                      const grade = getGradeInfo(avgMark);

                      return (
                        <div key={exam.online_exam_id} className="space-y-2">
                          {/* Exam Header */}
                          <div
                            className="flex items-center justify-between p-3 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors"
                            onClick={() => setSelectedExam(exam)}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                                <Trophy className="w-5 h-5 text-purple-600" />
                              </div>
                              <div>
                                <span className="font-medium text-sm">{exam.title}</span>
                                <div className="flex items-center gap-2 mt-0.5">
                                  {exam.subject?.name && <Badge variant="outline" className="text-[10px]">{exam.subject.name}</Badge>}
                                  <Badge variant="secondary" className={`text-[10px] ${grade.color}`}>Avg: {avgMark}%</Badge>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-[10px]">{exam.results?.length} submissions</Badge>
                              <Badge variant="secondary" className="text-[10px] bg-emerald-100 text-emerald-700">{examPass} passed</Badge>
                              <ChevronRight className="w-4 h-4 text-slate-400" />
                            </div>
                          </div>

                          {/* Results Table */}
                          <div className="max-h-48 overflow-y-auto rounded-lg border border-slate-200">
                            <Table>
                              <TableHeader>
                                <TableRow className="bg-slate-50 hover:bg-slate-50">
                                  <TableHead className="text-xs font-semibold text-slate-600 uppercase">#</TableHead>
                                  <TableHead className="text-xs font-semibold text-slate-600 uppercase">Student</TableHead>
                                  <TableHead className="text-xs font-semibold text-slate-600 uppercase text-right">Score</TableHead>
                                  <TableHead className="text-xs font-semibold text-slate-600 uppercase text-center">%</TableHead>
                                  <TableHead className="text-xs font-semibold text-slate-600 uppercase text-center">Grade</TableHead>
                                  <TableHead className="text-xs font-semibold text-slate-600 uppercase text-center">Status</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {exam.results!.sort((a, b) => b.obtained_mark - a.obtained_mark).map((r, idx) => {
                                  const pct = r.total_mark > 0 ? Math.round((r.obtained_mark / r.total_mark) * 100) : 0;
                                  const g = getGradeInfo(pct);
                                  return (
                                    <TableRow key={r.online_exam_result_id} className="hover:bg-slate-50">
                                      <TableCell className="text-xs text-slate-400">{idx + 1}</TableCell>
                                      <TableCell className="text-sm font-medium">{r.student?.name || `Student ${r.student_id}`}</TableCell>
                                      <TableCell className="text-right font-semibold text-sm">{r.obtained_mark}/{r.total_mark}</TableCell>
                                      <TableCell className="text-center">
                                        <Progress value={pct} className="h-1.5 w-16 mx-auto" />
                                        <span className="text-[10px] text-slate-500 mt-0.5 block">{pct}%</span>
                                      </TableCell>
                                      <TableCell className="text-center">
                                        <Badge variant="secondary" className={`text-xs font-bold ${g.color}`}>{g.label}</Badge>
                                      </TableCell>
                                      <TableCell className="text-center">
                                        <Badge variant="secondary" className={
                                          r.status === "passed" ? "bg-emerald-100 text-emerald-700" :
                                          r.status === "failed" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
                                        }>
                                          {r.status || "pending"}
                                        </Badge>
                                      </TableCell>
                                    </TableRow>
                                  );
                                })}
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ─── Analytics Tab ─────────────────────────────── */}
          <TabsContent value="analytics" className="mt-4">
            <Card className="gap-4">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                  </div>
                  <CardTitle className="text-base font-semibold">Performance Analytics</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {filteredExamsWithResults.length === 0 ? (
                  <div className="text-center py-16">
                    <BarChart3 className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-600">No data for analytics</h3>
                    <p className="text-sm text-slate-400 mt-1">Analytics will appear once students complete exams</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Grade Distribution */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold text-slate-700">Grade Distribution (All Exams)</h4>
                      <div className="grid grid-cols-5 gap-3">
                        {[
                          { label: "A (80+)", min: 80, max: 100, color: "emerald" },
                          { label: "B (70-79)", min: 70, max: 79, color: "sky" },
                          { label: "C (60-69)", min: 60, max: 69, color: "blue" },
                          { label: "D (50-59)", min: 50, max: 59, color: "amber" },
                          { label: "F (<50)", min: 0, max: 49, color: "red" },
                        ].map(({ label, min, max, color }) => {
                          const count = filteredExamsWithResults.reduce((sum, e) => {
                            return sum + e.results!.filter(r => {
                              const pct = r.total_mark > 0 ? (r.obtained_mark / r.total_mark) * 100 : 0;
                              return pct >= min && pct <= max;
                            }).length;
                          }, 0);
                          const pct = totalResults > 0 ? Math.round((count / totalResults) * 100) : 0;
                          return (
                            <div key={label} className={`p-3 rounded-lg border border-${color}-200 bg-${color}-50`}>
                              <p className="text-lg font-bold text-slate-900">{count}</p>
                              <p className="text-xs text-slate-500">{label}</p>
                              <Progress value={pct} className={`h-1.5 mt-2 bg-${color}-200`} />
                              <p className="text-[10px] text-slate-400 mt-1">{pct}%</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Per-Exam Summary */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold text-slate-700">Per-Exam Summary</h4>
                      <div className="max-h-64 overflow-y-auto rounded-lg border border-slate-200">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-slate-50 hover:bg-slate-50">
                              <TableHead className="text-xs font-semibold text-slate-600 uppercase">Exam</TableHead>
                              <TableHead className="text-xs font-semibold text-slate-600 uppercase hidden sm:table-cell">Subject</TableHead>
                              <TableHead className="text-xs font-semibold text-slate-600 uppercase text-center">Submissions</TableHead>
                              <TableHead className="text-xs font-semibold text-slate-600 uppercase text-center">Average</TableHead>
                              <TableHead className="text-xs font-semibold text-slate-600 uppercase text-center">Highest</TableHead>
                              <TableHead className="text-xs font-semibold text-slate-600 uppercase text-center">Pass Rate</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredExamsWithResults.map((exam) => {
                              const avgMark = Math.round(exam.results!.reduce((sum, r) => sum + r.obtained_mark, 0) / exam.results!.length);
                              const highest = Math.max(...exam.results!.map(r => r.obtained_mark));
                              const passCount = exam.results!.filter(r => {
                                const pct = r.total_mark > 0 ? (r.obtained_mark / r.total_mark) * 100 : 0;
                                return pct >= 50;
                              }).length;
                              const examPassRate = Math.round((passCount / exam.results!.length) * 100);
                              return (
                                <TableRow key={exam.online_exam_id} className="hover:bg-slate-50">
                                  <TableCell className="text-sm font-medium">{exam.title}</TableCell>
                                  <TableCell className="hidden sm:table-cell text-xs text-slate-500">{exam.subject?.name || "—"}</TableCell>
                                  <TableCell className="text-center text-sm">{exam.results!.length}</TableCell>
                                  <TableCell className="text-center">
                                    <Badge variant="secondary" className={getGradeInfo(avgMark).color}>{avgMark}%</Badge>
                                  </TableCell>
                                  <TableCell className="text-center text-sm font-semibold">{highest}</TableCell>
                                  <TableCell className="text-center">
                                    <Progress value={examPassRate} className="h-1.5 w-16 mx-auto" />
                                    <span className="text-[10px] text-slate-500 block mt-0.5">{examPassRate}%</span>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* ─── Exam Detail Dialog ──────────────────────────── */}
        <Dialog open={!!selectedExam} onOpenChange={(open) => !open && setSelectedExam(null)}>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-emerald-600" />
                {selectedExam?.title}
              </DialogTitle>
            </DialogHeader>
            {selectedExam && (
              <div className="space-y-4">
                {/* Exam Info */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-slate-50">
                    <p className="text-xs text-slate-400">Subject</p>
                    <p className="text-sm font-medium">{selectedExam.subject?.name || "—"}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50">
                    <p className="text-xs text-slate-400">Class</p>
                    <p className="text-sm font-medium">{selectedExam.class?.name || "—"}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50">
                    <p className="text-xs text-slate-400">Duration</p>
                    <p className="text-sm font-medium">{selectedExam.duration} minutes</p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50">
                    <p className="text-xs text-slate-400">Questions</p>
                    <p className="text-sm font-medium">{selectedExam.total_questions}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50">
                    <p className="text-xs text-slate-400">Status</p>
                    <Badge variant="secondary" className={
                      selectedExam.status === "active" ? "bg-emerald-100 text-emerald-700" :
                      selectedExam.status === "closed" ? "bg-slate-200 text-slate-600" :
                      "bg-amber-100 text-amber-700"
                    }>
                      {selectedExam.status || "draft"}
                    </Badge>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50">
                    <p className="text-xs text-slate-400">Submissions</p>
                    <p className="text-sm font-medium">{selectedExam.results?.length || 0}</p>
                  </div>
                </div>

                {/* Results */}
                {selectedExam.results && selectedExam.results.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-purple-500" />
                      Student Results
                    </h4>
                    <div className="max-h-48 overflow-y-auto rounded-lg border border-slate-200">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-slate-50 hover:bg-slate-50">
                            <TableHead className="text-xs">Student</TableHead>
                            <TableHead className="text-xs text-right">Score</TableHead>
                            <TableHead className="text-xs text-center">%</TableHead>
                            <TableHead className="text-xs text-center">Grade</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedExam.results.sort((a, b) => b.obtained_mark - a.obtained_mark).map((r) => {
                            const pct = r.total_mark > 0 ? Math.round((r.obtained_mark / r.total_mark) * 100) : 0;
                            const g = getGradeInfo(pct);
                            return (
                              <TableRow key={r.online_exam_result_id} className="hover:bg-slate-50">
                                <TableCell className="text-sm font-medium">{r.student?.name || `Student ${r.student_id}`}</TableCell>
                                <TableCell className="text-right font-semibold text-sm">{r.obtained_mark}/{r.total_mark}</TableCell>
                                <TableCell className="text-center">
                                  <Badge variant="secondary" className={g.color}>{pct}%</Badge>
                                </TableCell>
                                <TableCell className="text-center">
                                  <Badge variant="secondary" className={`text-xs font-bold ${g.color}`}>{g.label}</Badge>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}

                {(!selectedExam.results || selectedExam.results.length === 0) && (
                  <div className="text-center py-8">
                    <FileQuestion className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-sm text-slate-400">No submissions recorded yet</p>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
