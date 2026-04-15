"use client";

import { useEffect, useState, useCallback } from "react";
import {
  AlertTriangle, Award, Printer, Loader2, BarChart3, GraduationCap,
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

interface ChildItem { student_id: number; name: string; first_name: string; last_name: string; student_code: string; mute: number; }
interface ExamItem { exam_id: number; name: string; type: string; year: string; term: string; date: string | null; }
interface GradeItem { grade_id: number; name: string; comment: string; grade_from: number; grade_to: number; }
interface MarkRecord {
  mark_id: number; mark_obtained: number; comment: string; class_id: number;
  subject_id: number; exam_id: number;
  subject: { subject_id: number; name: string } | null;
  exam: { exam_id: number; name: string } | null;
}

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

export default function ParentResultsPage() {
  const { isLoading: authLoading, isParent } = useAuth();
  const [children, setChildren] = useState<ChildItem[]>([]);
  const [exams, setExams] = useState<ExamItem[]>([]);
  const [grades, setGrades] = useState<GradeItem[]>([]);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [selectedExam, setSelectedExam] = useState("");
  const [marks, setMarks] = useState<MarkRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && isParent) {
      fetch("/api/parent/results").then(r => r.json()).then(data => {
        setChildren((data.children || []).filter((c: ChildItem) => c.mute === 0));
        setExams(data.exams || []);
        setGrades(data.grades || []);
      }).catch(() => setError("Failed to load data"));
    }
  }, [authLoading, isParent]);

  const fetchMarks = useCallback(async () => {
    if (!selectedStudent || !selectedExam) { setMarks([]); return; }
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/parent/results?student_id=${selectedStudent}&exam_id=${selectedExam}`);
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setMarks(data.marks || []);
      setGrades(data.grades || []);
    } catch { setError("Failed to load results"); }
    finally { setIsLoading(false); }
  }, [selectedStudent, selectedExam]);

  useEffect(() => { fetchMarks(); }, [fetchMarks]);

  const totalScore = marks.reduce((s, m) => s + (m.mark_obtained || 0), 0);
  const average = marks.length > 0 ? (totalScore / marks.length).toFixed(1) : "0";
  const subjectsPassed = marks.filter(m => m.mark_obtained >= 50).length;
  const overallGrade = getGrade(parseFloat(average), grades);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Children&apos;s Results</h1>
            <p className="text-sm text-slate-500 mt-1">View academic performance for your children</p>
          </div>
          {marks.length > 0 && (
            <Button onClick={() => window.print()} variant="outline" className="min-w-[44px] min-h-[44px] print:hidden"><Printer className="w-4 h-4 mr-2" />Print Results</Button>
          )}
        </div>

        {/* Selectors */}
        <Card className="gap-4">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Select Child</Label>
                <Select value={selectedStudent} onValueChange={(v) => { setSelectedStudent(v); setSelectedExam(""); setMarks([]); }}>
                  <SelectTrigger><SelectValue placeholder="Choose a child" /></SelectTrigger>
                  <SelectContent>
                    {children.map((s) => <SelectItem key={s.student_id} value={String(s.student_id)}>{s.name} — {s.student_code}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Select Exam</Label>
                <Select value={selectedExam} onValueChange={setSelectedExam}>
                  <SelectTrigger><SelectValue placeholder="Choose an exam" /></SelectTrigger>
                  <SelectContent>
                    {exams.map((e) => <SelectItem key={e.exam_id} value={String(e.exam_id)}>{e.name} — {e.year} Term {e.term}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {error && <div className="flex items-center gap-3 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm"><AlertTriangle className="w-5 h-5 flex-shrink-0" />{error}</div>}

        {selectedStudent && selectedExam && (
          <>
            {/* Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Card className="py-3 text-center"><CardContent className="px-3 pt-0 pb-0"><p className="text-xs text-slate-500">Total Score</p><p className="text-xl font-bold text-slate-900 tabular-nums">{totalScore}</p></CardContent></Card>
              <Card className="py-3 text-center"><CardContent className="px-3 pt-0 pb-0"><p className="text-xs text-slate-500">Average</p><p className="text-xl font-bold text-emerald-600 tabular-nums">{average}</p></CardContent></Card>
              <Card className="py-3 text-center"><CardContent className="px-3 pt-0 pb-0"><p className="text-xs text-slate-500">Passed</p><p className="text-xl font-bold text-sky-600">{subjectsPassed}/{marks.length}</p></CardContent></Card>
              <Card className="py-3 text-center"><CardContent className="px-3 pt-0 pb-0"><p className="text-xs text-slate-500">Grade</p><p className="text-xl font-bold text-violet-600">{overallGrade.name}</p></CardContent></Card>
            </div>

            {/* Marks Table */}
            <Card className="gap-4">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center"><Award className="w-4 h-4 text-violet-600" /></div>
                  <CardTitle className="text-base font-semibold">{exams.find(e => e.exam_id === parseInt(selectedExam))?.name || "Exam"} — {children.find(s => s.student_id === parseInt(selectedStudent))?.name || "Student"}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {isLoading ? (
                  <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
                ) : marks.length === 0 ? (
                  <div className="text-center py-12"><BarChart3 className="w-12 h-12 text-slate-300 mx-auto mb-3" /><p className="text-slate-400 text-sm">No results found for this exam</p></div>
                ) : (
                  <div className="overflow-x-auto rounded-lg border border-slate-200">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50 hover:bg-slate-50">
                          <TableHead className="text-xs font-semibold text-slate-600 uppercase">#</TableHead>
                          <TableHead className="text-xs font-semibold text-slate-600 uppercase">Subject</TableHead>
                          <TableHead className="text-xs font-semibold text-slate-600 uppercase text-right">Score</TableHead>
                          <TableHead className="text-xs font-semibold text-slate-600 uppercase text-center">Grade</TableHead>
                          <TableHead className="text-xs font-semibold text-slate-600 uppercase hidden sm:table-cell">Remark</TableHead>
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
                              <TableCell className="text-center"><Badge className={getGradeColor(m.mark_obtained)} variant="secondary">{g.name}</Badge></TableCell>
                              <TableCell className="hidden sm:table-cell text-xs text-slate-500">{g.comment}</TableCell>
                            </TableRow>
                          );
                        })}
                        <TableRow className="bg-slate-50 font-bold">
                          <TableCell colSpan={2} className="text-sm">TOTAL</TableCell>
                          <TableCell className="text-right text-sm tabular-nums">{totalScore}</TableCell>
                          <TableCell className="text-center"><Badge className="bg-violet-100 text-violet-700">{overallGrade.name}</Badge></TableCell>
                          <TableCell className="hidden sm:table-cell text-xs text-slate-600">{overallGrade.comment}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {!selectedStudent && (
          <Card className="gap-4"><CardContent className="py-16"><div className="text-center"><GraduationCap className="w-16 h-16 text-slate-200 mx-auto mb-4" /><h3 className="text-lg font-medium text-slate-600">Select a child to view results</h3><p className="text-sm text-slate-400 mt-1">Choose a child and exam from the dropdowns above</p></div></CardContent></Card>
        )}
      </div>
    </DashboardLayout>
  );
}
