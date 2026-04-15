"use client";

import { useEffect, useState, useCallback } from "react";
import {
  AlertTriangle, Loader2, Award, Printer, Download,
  BookOpen, User, GraduationCap, CheckCircle, XCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useAuth } from "@/hooks/use-auth";

// ─── Types ───────────────────────────────────────────────────
interface StudentItem { student_id: number; name: string; }
interface ExamItem { exam_id: number; name: string; type?: string; date?: string; }
interface MarksheetSubject {
  subject_id: number;
  subject_name: string;
  mark_obtained: number;
  grade_name: string;
  grade_comment: string;
  remark: string;
  teacher_comment: string;
}
interface StudentInfo {
  student_id: number;
  student_code: string;
  name: string;
  first_name: string;
  last_name: string;
  sex: string;
  birthday: string | null;
  parent: { name: string; phone: string } | null;
}
interface MarksheetData {
  student: StudentInfo;
  class: { class_id: number; name: string; section_name: string };
  exam: ExamItem | null;
  subjects: MarksheetSubject[];
  totalScore: number;
  subjectsScored: number;
  subjectsTotal: number;
  average: number;
  overallGrade: { name: string; comment: string };
  otherStudents: StudentItem[];
  availableExams: ExamItem[];
}

// ─── Helpers ─────────────────────────────────────────────────
function getGradeColor(grade: string): string {
  if (["A+", "A"].includes(grade)) return "bg-emerald-100 text-emerald-700";
  if (grade === "B") return "bg-teal-100 text-teal-700";
  if (["C", "D"].includes(grade)) return "bg-amber-100 text-amber-700";
  return "bg-red-100 text-red-700";
}

// ─── Main Component ──────────────────────────────────────────
export default function TeacherMarksheetPage() {
  const { isLoading: authLoading } = useAuth();
  const [data, setData] = useState<MarksheetData | null>(null);
  const [exams, setExams] = useState<ExamItem[]>([]);
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [selectedExamId, setSelectedExamId] = useState("0");
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ─── Fetch available exams and students on first load ─────
  const fetchInitial = useCallback(async () => {
    if (authLoading) return;
    setIsLoading(true);
    try {
      // Load first student from teacher's classes
      const studentsRes = await fetch("/api/teacher/students");
      if (studentsRes.ok) {
        const studentsData = await studentsRes.json();
        const list = studentsData.students || [];
        setStudents(list);
        if (list.length > 0 && !selectedStudentId) {
          setSelectedStudentId(String(list[0].student_id));
        }
      }
    } catch {
      // silently ignore
    } finally {
      setIsLoading(false);
    }
  }, [authLoading, selectedStudentId]);

  useEffect(() => {
    fetchInitial();
  }, [fetchInitial]);

  // ─── Fetch marksheet when student/exam changes ────────────
  const fetchMarksheet = useCallback(async () => {
    if (!selectedStudentId) return;
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ student_id: selectedStudentId });
      if (selectedExamId && selectedExamId !== "0") params.set("exam_id", selectedExamId);

      const res = await fetch(`/api/teacher/students/marksheet?${params}`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to load marksheet");
      }
      const marksheetData = await res.json();
      setData(marksheetData);
      setExams(marksheetData.availableExams || []);
      setStudents(marksheetData.otherStudents
        ? [{ student_id: marksheetData.student.student_id, name: marksheetData.student.name }, ...marksheetData.otherStudents]
        : students
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load marksheet");
    } finally {
      setIsLoading(false);
    }
  }, [selectedStudentId, selectedExamId]);

  useEffect(() => {
    if (selectedStudentId) fetchMarksheet();
  }, [selectedStudentId, fetchMarksheet]);

  // ─── Print ────────────────────────────────────────────────
  const printMarksheet = () => window.print();

  // ─── Loading ──────────────────────────────────────────────
  if (authLoading || (isLoading && !data)) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-[400px] w-full rounded-xl" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* ─── Header ─────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Marksheet</h1>
            <p className="text-sm text-slate-500 mt-1">Generate and view student marksheets</p>
          </div>
          {data && (
            <Button variant="outline" onClick={printMarksheet} className="min-w-[44px] min-h-[44px]">
              <Printer className="w-4 h-4 mr-2" />
              Print
            </Button>
          )}
        </div>

        {/* ─── Filters ────────────────────────────────────── */}
        <Card className="gap-4">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Student</Label>
                <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                  <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
                  <SelectContent className="max-h-60">
                    {students.map((s) => (
                      <SelectItem key={s.student_id} value={String(s.student_id)}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Exam</Label>
                <Select value={selectedExamId} onValueChange={setSelectedExamId}>
                  <SelectTrigger><SelectValue placeholder="All Exams" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">All Exams</SelectItem>
                    {exams.map((e) => (
                      <SelectItem key={e.exam_id} value={String(e.exam_id)}>
                        {e.name} {e.type ? `(${e.type})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ─── Error ──────────────────────────────────────── */}
        {error && (
          <div className="flex items-center gap-3 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* ─── Marksheet Content ──────────────────────────── */}
        {isLoading && data && (
          <div className="space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        )}

        {data && !isLoading && (
          <>
            {/* Student Info Card */}
            <Card className="bg-gradient-to-r from-emerald-600 to-teal-600 border-0 text-white">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <p className="text-emerald-200 text-xs font-medium">Student</p>
                    <p className="text-lg font-bold">{data.student.name}</p>
                    <p className="text-emerald-100 text-sm font-mono">{data.student.student_code}</p>
                  </div>
                  <div>
                    <p className="text-emerald-200 text-xs font-medium">Class</p>
                    <p className="text-lg font-bold">{data.class.name}</p>
                    <p className="text-emerald-100 text-sm">{data.class.section_name}</p>
                  </div>
                  <div>
                    <p className="text-emerald-200 text-xs font-medium">Exam</p>
                    <p className="text-lg font-bold">{data.exam?.name || "All Exams"}</p>
                    {data.exam?.type && <p className="text-emerald-100 text-sm">{data.exam.type}</p>}
                  </div>
                  <div>
                    <p className="text-emerald-200 text-xs font-medium">Parent/Guardian</p>
                    <p className="text-lg font-bold">{data.student.parent?.name || "N/A"}</p>
                    <p className="text-emerald-100 text-sm">{data.student.parent?.phone || ""}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="gap-4 py-4 border-l-4 border-l-emerald-500">
                <CardContent className="px-4 pb-0 pt-0">
                  <p className="text-xs font-medium text-slate-500">Total Score</p>
                  <p className="text-2xl font-bold text-emerald-600">{data.totalScore}</p>
                  <p className="text-[10px] text-slate-400">{data.subjectsScored} of {data.subjectsTotal} subjects</p>
                </CardContent>
              </Card>
              <Card className="gap-4 py-4 border-l-4 border-l-violet-500">
                <CardContent className="px-4 pb-0 pt-0">
                  <p className="text-xs font-medium text-slate-500">Average</p>
                  <p className="text-2xl font-bold text-violet-600">{data.average}</p>
                </CardContent>
              </Card>
              <Card className="gap-4 py-4 border-l-4 border-l-amber-500">
                <CardContent className="px-4 pb-0 pt-0">
                  <p className="text-xs font-medium text-slate-500">Overall Grade</p>
                  <Badge className={`${getGradeColor(data.overallGrade.name)} text-base px-3 py-1 mt-1`}>
                    {data.overallGrade.name} — {data.overallGrade.comment}
                  </Badge>
                </CardContent>
              </Card>
              <Card className="gap-4 py-4 border-l-4 border-l-teal-500">
                <CardContent className="px-4 pb-0 pt-0">
                  <p className="text-xs font-medium text-slate-500">Subjects</p>
                  <p className="text-2xl font-bold text-teal-600">
                    {data.subjects.filter((s) => s.remark === "Credit").length}
                    <span className="text-base font-normal text-slate-400"> / {data.subjectsTotal}</span>
                  </p>
                  <p className="text-[10px] text-slate-400">credits</p>
                </CardContent>
              </Card>
            </div>

            {/* Subject Marks Table */}
            <Card className="gap-4">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <Award className="w-4 h-4 text-emerald-600" />
                  </div>
                  <CardTitle className="text-base font-semibold">Subject Results</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {data.subjects.length === 0 ? (
                  <div className="text-center py-12">
                    <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-400 text-sm">No subjects or marks available</p>
                  </div>
                ) : (
                  <div className="max-h-[500px] overflow-y-auto rounded-lg border border-slate-200">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50 hover:bg-slate-50">
                          <TableHead className="text-xs font-semibold text-slate-600 uppercase w-10">#</TableHead>
                          <TableHead className="text-xs font-semibold text-slate-600 uppercase">Subject</TableHead>
                          <TableHead className="text-xs font-semibold text-slate-600 uppercase text-right">Score</TableHead>
                          <TableHead className="text-xs font-semibold text-slate-600 uppercase text-center">Grade</TableHead>
                          <TableHead className="text-xs font-semibold text-slate-600 uppercase text-center">Remark</TableHead>
                          <TableHead className="text-xs font-semibold text-slate-600 uppercase hidden md:table-cell">Comment</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.subjects.map((s, i) => (
                          <TableRow key={s.subject_id} className="hover:bg-slate-50">
                            <TableCell className="text-sm text-slate-500">{i + 1}</TableCell>
                            <TableCell className="font-medium text-sm text-slate-900">{s.subject_name}</TableCell>
                            <TableCell className="text-right font-semibold text-sm">{s.mark_obtained}</TableCell>
                            <TableCell className="text-center">
                              <Badge className={getGradeColor(s.grade_name)}>{s.grade_name}</Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              {s.remark === "Credit" ? (
                                <CheckCircle className="w-4 h-4 text-emerald-600 mx-auto" />
                              ) : s.mark_obtained > 0 ? (
                                <XCircle className="w-4 h-4 text-red-500 mx-auto" />
                              ) : (
                                <span className="text-xs text-slate-400">N/A</span>
                              )}
                            </TableCell>
                            <TableCell className="hidden md:table-cell text-xs text-slate-500">{s.teacher_comment || "—"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {/* ─── Empty State ────────────────────────────────── */}
        {!data && !isLoading && !error && (
          <Card className="gap-4">
            <CardContent className="py-16">
              <div className="text-center">
                <GraduationCap className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-600">Select a Student</h3>
                <p className="text-sm text-slate-400 mt-1">Choose a student to generate their marksheet</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
