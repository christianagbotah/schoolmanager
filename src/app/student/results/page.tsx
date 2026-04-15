"use client";

import { useEffect, useState, useCallback } from "react";
import {
  AlertTriangle,
  Award,
  Printer,
  Loader2,
  FileText,
  BarChart3,
  Download,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
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
interface MarkRecord {
  mark_id: number;
  mark_obtained: number;
  comment: string;
  subject: { subject_id: number; name: string };
  exam: { exam_id: number; name: string; type: string } | null;
}

interface ExamItem {
  exam_id: number;
  name: string;
  type: string;
  year: string;
}

// ─── Helpers ─────────────────────────────────────────────────
function getGrade(score: number): string {
  if (score >= 90) return "A+";
  if (score >= 80) return "A";
  if (score >= 70) return "B";
  if (score >= 60) return "C";
  if (score >= 50) return "D";
  return "F";
}

function getGradeColor(score: number): string {
  if (score >= 80) return "bg-emerald-100 text-emerald-700";
  if (score >= 60) return "bg-blue-100 text-blue-700";
  if (score >= 50) return "bg-amber-100 text-amber-700";
  return "bg-red-100 text-red-700";
}

function getGradeRemark(grade: string): string {
  const remarks: Record<string, string> = {
    "A+": "Outstanding", A: "Excellent", B: "Very Good",
    C: "Good", D: "Satisfactory", F: "Needs Improvement",
  };
  return remarks[grade] || "";
}

// ─── Main Component ──────────────────────────────────────────
export default function StudentResultsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [exams, setExams] = useState<ExamItem[]>([]);
  const [selectedExam, setSelectedExam] = useState("");
  const [marks, setMarks] = useState<MarkRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ─── Fetch exams ───────────────────────────────────────────
  const fetchExams = useCallback(async () => {
    if (!user?.id) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/student/results`);
      if (!res.ok) throw new Error("Failed to load exams");
      const data = await res.json();
      setExams((data.exams || []).map((e: { exam_id: number; name: string; type: string; year: string; date: string | null }) => ({
        exam_id: e.exam_id,
        name: e.name,
        type: e.type || "",
        year: e.year || "",
      })));
    } catch {
      setError("Failed to load exams");
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!authLoading) fetchExams();
  }, [authLoading, fetchExams]);

  // ─── Fetch marks for selected exam ─────────────────────────
  const fetchMarks = useCallback(async () => {
    if (!user?.id || !selectedExam) {
      setMarks([]);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/student/results?exam_id=${selectedExam}`);
      if (!res.ok) throw new Error("Failed to load results");
      const data = await res.json();
      setMarks(data.marks || []);
    } catch {
      setError("Failed to load results");
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, selectedExam]);

  useEffect(() => {
    fetchMarks();
  }, [fetchMarks]);

  // ─── Calculations ──────────────────────────────────────────
  const totalScore = marks.reduce((sum, m) => sum + (m.mark_obtained || 0), 0);
  const average = marks.length > 0 ? (totalScore / marks.length).toFixed(1) : "0";
  const highest = marks.length > 0 ? Math.max(...marks.map(m => m.mark_obtained)) : 0;
  const lowest = marks.length > 0 ? Math.min(...marks.map(m => m.mark_obtained)) : 0;
  const subjectsPassed = marks.filter(m => m.mark_obtained >= 50).length;

  const handlePrint = () => {
    window.print();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* ─── Header ─────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">My Results</h1>
            <p className="text-sm text-slate-500 mt-1">View your academic performance across all exams</p>
          </div>
          {marks.length > 0 && (
            <Button onClick={handlePrint} variant="outline" className="min-w-[44px] min-h-[44px] print:hidden">
              <Printer className="w-4 h-4 mr-2" />
              Print Results
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

        {/* ─── Results ─────────────────────────────────────── */}
        {selectedExam && (
          <>
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
                  <p className="text-xs text-slate-500">Subjects Passed</p>
                  <p className="text-xl font-bold text-purple-600">{subjectsPassed}/{marks.length}</p>
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
                  <CardTitle className="text-base font-semibold">
                    {exams.find(e => e.exam_id === parseInt(selectedExam))?.name || "Exam"} Results
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {isLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
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
                          <TableHead className="text-xs font-semibold text-slate-600 uppercase">#</TableHead>
                          <TableHead className="text-xs font-semibold text-slate-600 uppercase">Subject</TableHead>
                          <TableHead className="text-xs font-semibold text-slate-600 uppercase text-right">Score</TableHead>
                          <TableHead className="text-xs font-semibold text-slate-600 uppercase text-center">Grade</TableHead>
                          <TableHead className="text-xs font-semibold text-slate-600 uppercase hidden sm:table-cell">Remarks</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {marks.map((m, idx) => {
                          const grade = getGrade(m.mark_obtained);
                          return (
                            <TableRow key={m.mark_id} className="hover:bg-slate-50">
                              <TableCell className="text-slate-400 text-sm">{idx + 1}</TableCell>
                              <TableCell className="font-medium text-sm text-slate-900">{m.subject?.name || "N/A"}</TableCell>
                              <TableCell className="text-right font-semibold text-sm tabular-nums">{m.mark_obtained}</TableCell>
                              <TableCell className="text-center">
                                <Badge className={getGradeColor(m.mark_obtained)} variant="secondary">{grade}</Badge>
                              </TableCell>
                              <TableCell className="hidden sm:table-cell text-sm text-slate-500">{getGradeRemark(grade)}</TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {/* ─── Empty State ─────────────────────────────────── */}
        {!selectedExam && !isLoading && (
          <Card className="gap-4">
            <CardContent className="py-16">
              <div className="text-center">
                <BarChart3 className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-600">Select an exam to view results</h3>
                <p className="text-sm text-slate-400 mt-1">Choose an exam from the dropdown above</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
