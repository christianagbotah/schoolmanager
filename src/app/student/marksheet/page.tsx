"use client";

import { useEffect, useState, useCallback } from "react";
import {
  AlertTriangle,
  Award,
  Printer,
  Loader2,
  BarChart3,
  GraduationCap,
  User,
  Trophy,
  MessageSquare,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useAuth } from "@/hooks/use-auth";

// ─── Types ───────────────────────────────────────────────────
interface StudentInfo {
  student_id: number;
  student_code: string;
  name: string;
  first_name: string;
  last_name: string;
  sex: string;
}

interface ExamItem {
  exam_id: number;
  name: string;
  type: string;
  year: string;
  term: string;
  date: string | null;
}

interface GradeItem {
  grade_id: number;
  name: string;
  comment: string;
  grade_from: number;
  grade_to: number;
}

interface MarkRecord {
  mark_id: number;
  mark_obtained: number;
  comment: string;
  subject: { subject_id: number; name: string } | null;
  exam: { exam_id: number; name: string } | null;
}

interface EnrollmentInfo {
  class_id: number;
  class_name: string;
  class_numeric: number;
  section_name: string;
}

interface TerminalReport {
  total_score: number;
  grade: string;
  rank: number;
  position: string;
  teacher_comment: string;
  head_comment: string;
}

// ─── Helpers ─────────────────────────────────────────────────
function getGrade(score: number, grades: GradeItem[]): { name: string; comment: string } {
  for (const g of grades) {
    if (score >= g.grade_from && score <= g.grade_to) return { name: g.name, comment: g.comment };
  }
  if (score >= 80) return { name: "A", comment: "Excellent" };
  if (score >= 70) return { name: "B", comment: "Very Good" };
  if (score >= 60) return { name: "C", comment: "Good" };
  if (score >= 50) return { name: "D", comment: "Credit" };
  return { name: "F", comment: "Fail" };
}

function getGradeColor(score: number): string {
  if (score >= 80) return "bg-emerald-100 text-emerald-700";
  if (score >= 60) return "bg-sky-100 text-sky-700";
  if (score >= 50) return "bg-amber-100 text-amber-700";
  return "bg-red-100 text-red-700";
}

// ─── Main Component ──────────────────────────────────────────
export default function StudentMarksheetPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [student, setStudent] = useState<StudentInfo | null>(null);
  const [enrollment, setEnrollment] = useState<EnrollmentInfo | null>(null);
  const [exams, setExams] = useState<ExamItem[]>([]);
  const [grades, setGrades] = useState<GradeItem[]>([]);
  const [selectedExam, setSelectedExam] = useState("");
  const [marks, setMarks] = useState<MarkRecord[]>([]);
  const [terminalReport, setTerminalReport] = useState<TerminalReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ─── Fetch initial data ───────────────────────────────────
  const fetchInitial = useCallback(async () => {
    if (!user?.id) return;
    setIsLoading(true);
    try {
      const res = await fetch("/api/student/marksheet");
      if (!res.ok) throw new Error("Failed to load marksheet");
      const data = await res.json();
      setStudent(data.student || null);
      setEnrollment(data.enrollment || null);
      setExams(data.exams || []);
      setGrades(data.grades || []);
    } catch {
      setError("Failed to load marksheet data");
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!authLoading) fetchInitial();
  }, [authLoading, fetchInitial]);

  // ─── Fetch marks for selected exam ─────────────────────────
  const fetchMarks = useCallback(async () => {
    if (!user?.id || !selectedExam) {
      setMarks([]);
      setTerminalReport(null);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/student/marksheet?exam_id=${selectedExam}`);
      if (!res.ok) throw new Error("Failed to load results");
      const data = await res.json();
      setMarks(data.marks || []);
      setTerminalReport(data.terminalReport || null);
    } catch {
      setError("Failed to load results");
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, selectedExam]);

  useEffect(() => {
    fetchMarks();
  }, [fetchMarks]);

  // ─── Calculations ─────────────────────────────────────────
  const totalScore = marks.reduce((s, m) => s + (m.mark_obtained || 0), 0);
  const average = marks.length > 0 ? (totalScore / marks.length).toFixed(1) : "0";
  const highest = marks.length > 0 ? Math.max(...marks.map((m) => m.mark_obtained)) : 0;
  const lowest = marks.length > 0 ? Math.min(...marks.map((m) => m.mark_obtained)) : 0;
  const subjectsPassed = marks.filter((m) => m.mark_obtained >= 50).length;
  const overallGrade = getGrade(parseFloat(average), grades);

  const handlePrint = () => window.print();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* ─── Header ─────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Marksheet</h1>
            <p className="text-sm text-slate-500 mt-1">View your detailed academic results with grades and teacher comments</p>
          </div>
          {marks.length > 0 && (
            <Button onClick={handlePrint} variant="outline" className="min-w-[44px] min-h-[44px] print:hidden">
              <Printer className="w-4 h-4 mr-2" />
              Print Marksheet
            </Button>
          )}
        </div>

        {/* ─── Exam Selector ───────────────────────────────── */}
        <Card className="gap-4">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Select Exam</Label>
                <Select value={selectedExam} onValueChange={setSelectedExam}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose an exam" />
                  </SelectTrigger>
                  <SelectContent>
                    {exams.map((e) => (
                      <SelectItem key={e.exam_id} value={String(e.exam_id)}>
                        {e.name} {e.type ? `(${e.type})` : ""} — {e.year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ─── Error ───────────────────────────────────────── */}
        {error && (
          <div className="flex items-center gap-3 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* ─── Marksheet Content ──────────────────────────── */}
        {selectedExam && (
          <>
            {/* Student Info Banner */}
            <Card className="bg-gradient-to-r from-amber-500 to-orange-500 border-0 text-white print:shadow-none">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                      <GraduationCap className="w-7 h-7" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">{student?.name || "Student"}</h2>
                      <p className="text-amber-100 text-sm">
                        {student?.student_code} • {enrollment?.class_name} {enrollment?.class_numeric} — {enrollment?.section_name}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-amber-100">Exam</p>
                    <p className="font-bold text-lg">
                      {exams.find((e) => e.exam_id === parseInt(selectedExam))?.name || ""}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 print:grid-cols-5">
              <Card className="py-3 text-center">
                <CardContent className="px-3 pt-0 pb-0">
                  <p className="text-xs text-slate-500">Total Score</p>
                  <p className="text-xl font-bold text-slate-900 tabular-nums">{totalScore}</p>
                </CardContent>
              </Card>
              <Card className="py-3 text-center">
                <CardContent className="px-3 pt-0 pb-0">
                  <p className="text-xs text-slate-500">Average</p>
                  <p className="text-xl font-bold text-emerald-600 tabular-nums">{average}</p>
                </CardContent>
              </Card>
              <Card className="py-3 text-center">
                <CardContent className="px-3 pt-0 pb-0">
                  <p className="text-xs text-slate-500">Highest</p>
                  <p className="text-xl font-bold text-blue-600 tabular-nums">{highest}</p>
                </CardContent>
              </Card>
              <Card className="py-3 text-center">
                <CardContent className="px-3 pt-0 pb-0">
                  <p className="text-xs text-slate-500">Lowest</p>
                  <p className="text-xl font-bold text-amber-600 tabular-nums">{lowest}</p>
                </CardContent>
              </Card>
              <Card className="py-3 text-center">
                <CardContent className="px-3 pt-0 pb-0">
                  <p className="text-xs text-slate-500">Passed</p>
                  <p className="text-xl font-bold text-purple-600">
                    {subjectsPassed}/{marks.length}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Marks Table */}
            <Card className="gap-4">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                    <Award className="w-4 h-4 text-purple-600" />
                  </div>
                  <CardTitle className="text-base font-semibold">Subject Results</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {isLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : marks.length === 0 ? (
                  <div className="text-center py-12">
                    <BarChart3 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-400 text-sm">No results found for this exam</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-lg border border-slate-200">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50 hover:bg-slate-50">
                          <TableHead className="text-xs font-semibold text-slate-600 uppercase w-10">#</TableHead>
                          <TableHead className="text-xs font-semibold text-slate-600 uppercase">Subject</TableHead>
                          <TableHead className="text-xs font-semibold text-slate-600 uppercase text-right">Score</TableHead>
                          <TableHead className="text-xs font-semibold text-slate-600 uppercase text-center">Grade</TableHead>
                          <TableHead className="text-xs font-semibold text-slate-600 uppercase hidden sm:table-cell">Remark</TableHead>
                          <TableHead className="text-xs font-semibold text-slate-600 uppercase hidden md:table-cell">Comment</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {marks.map((m, idx) => {
                          const g = getGrade(m.mark_obtained, grades);
                          return (
                            <TableRow key={m.mark_id} className="hover:bg-slate-50">
                              <TableCell className="text-slate-400 text-sm">{idx + 1}</TableCell>
                              <TableCell className="font-medium text-sm text-slate-900">{m.subject?.name || "N/A"}</TableCell>
                              <TableCell className="text-right font-semibold text-sm tabular-nums">{m.mark_obtained}</TableCell>
                              <TableCell className="text-center">
                                <Badge className={getGradeColor(m.mark_obtained)} variant="secondary">{g.name}</Badge>
                              </TableCell>
                              <TableCell className="hidden sm:table-cell text-sm text-slate-500">{g.comment}</TableCell>
                              <TableCell className="hidden md:table-cell text-xs text-slate-400 max-w-[150px] truncate">
                                {m.comment || "—"}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                        {/* Total Row */}
                        <TableRow className="bg-slate-50 font-bold">
                          <TableCell colSpan={2} className="text-sm">TOTAL</TableCell>
                          <TableCell className="text-right text-sm tabular-nums">{totalScore}</TableCell>
                          <TableCell className="text-center">
                            <Badge className="bg-violet-100 text-violet-700">{overallGrade.name}</Badge>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell text-xs text-slate-600">{overallGrade.comment}</TableCell>
                          <TableCell className="hidden md:table-cell">—</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Terminal Report / Teacher Comments */}
            {terminalReport && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Class Rank & Position */}
                {(terminalReport.rank > 0 || terminalReport.position) && (
                  <Card className="gap-4">
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                          <Trophy className="w-4 h-4 text-amber-600" />
                        </div>
                        <CardTitle className="text-base font-semibold">Class Position</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 rounded-lg bg-amber-50 border border-amber-200">
                          <span className="text-sm text-amber-700 font-medium">Class Rank</span>
                          <span className="text-2xl font-bold text-amber-700">
                            #{terminalReport.rank || terminalReport.position || "—"}
                          </span>
                        </div>
                        {terminalReport.grade && (
                          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
                            <span className="text-sm text-slate-500 font-medium">Overall Grade</span>
                            <Badge className="bg-violet-100 text-violet-700 text-sm px-3">{terminalReport.grade}</Badge>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Teacher Comments */}
                {(terminalReport.teacher_comment || terminalReport.head_comment) && (
                  <Card className="gap-4">
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                          <MessageSquare className="w-4 h-4 text-emerald-600" />
                        </div>
                        <CardTitle className="text-base font-semibold">Comments</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0 space-y-3">
                      {terminalReport.teacher_comment && (
                        <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                          <p className="text-xs font-medium text-emerald-700 mb-1">Class Teacher&apos;s Comment</p>
                          <p className="text-sm text-emerald-800">{terminalReport.teacher_comment}</p>
                        </div>
                      )}
                      {terminalReport.head_comment && (
                        <div className="p-3 rounded-lg bg-sky-50 border border-sky-200">
                          <p className="text-xs font-medium text-sky-700 mb-1">Head of School&apos;s Comment</p>
                          <p className="text-sm text-sky-800">{terminalReport.head_comment}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </>
        )}

        {/* ─── Empty State ─────────────────────────────────── */}
        {!selectedExam && !isLoading && (
          <Card className="gap-4">
            <CardContent className="py-16">
              <div className="text-center">
                <BarChart3 className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-600">Select an exam to view marksheet</h3>
                <p className="text-sm text-slate-400 mt-1">Choose an exam from the dropdown above to see your detailed results</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
