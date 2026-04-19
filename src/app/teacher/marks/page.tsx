"use client";

import { useEffect, useState, useCallback } from "react";
import {
  AlertTriangle, CheckCircle, Loader2, Save, Award, BookOpen,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
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
interface ClassItem {
  class_id: number;
  name: string;
  sections: { section_id: number; name: string }[];
}

interface SubjectItem {
  subject_id: number;
  name: string;
  class?: { class_id: number; name: string; name_numeric: number };
  section?: { section_id: number; name: string };
}

interface ExamItem {
  exam_id: number;
  name: string;
  type?: string;
  class_id?: number;
}

interface StudentItem {
  student_id: number;
  student_code: string;
  name: string;
  first_name: string;
  last_name: string;
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

// ─── Main Component ──────────────────────────────────────────
export default function TeacherMarksPage() {
  const { isLoading: authLoading } = useAuth();
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [allSubjects, setAllSubjects] = useState<SubjectItem[]>([]);
  const [exams, setExams] = useState<ExamItem[]>([]);
  const [students, setStudents] = useState<StudentItem[]>([]);

  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedSectionId, setSelectedSectionId] = useState("");
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [selectedExamId, setSelectedExamId] = useState("");
  const [marksMap, setMarksMap] = useState<Record<number, number>>({});
  const [commentsMap, setCommentsMap] = useState<Record<number, string>>({});

  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // ─── Fetch classes ─────────────────────────────────────────
  const fetchClasses = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/teacher/classes");
      if (!res.ok) throw new Error("Failed to fetch classes");
      const data = await res.json();
      setClasses(data || []);
    } catch {
      setError("Failed to load classes");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading) fetchClasses();
  }, [authLoading, fetchClasses]);

  // ─── Fetch subjects & exams when class changes ─────────────
  useEffect(() => {
    if (!selectedClassId) {
      setAllSubjects([]);
      setExams([]);
      return;
    }
    const fetchData = async () => {
      try {
        const [subjectsRes, marksRes] = await Promise.all([
          fetch("/api/teacher/subjects"),
          fetch(`/api/teacher/marks`),
        ]);

        if (subjectsRes.ok) {
          const data = await subjectsRes.json();
          const subjectList = Array.isArray(data) ? data : [];
          setAllSubjects(subjectList);
        }
        if (marksRes.ok) {
          const data = await marksRes.json();
          setExams(data.exams || []);
        }
      } catch {
        // silently ignore
      }
    };
    fetchData();
  }, [selectedClassId]);

  // ─── Filter subjects by selected class ─────────────────────
  const filteredSubjects = selectedClassId
    ? allSubjects.filter(s => String(s.class?.class_id) === selectedClassId)
    : allSubjects;

  // ─── Fetch students & existing marks ──────────────────────
  const fetchStudentsAndMarks = useCallback(async () => {
    if (!selectedClassId || !selectedSectionId) {
      setStudents([]);
      setMarksMap({});
      setCommentsMap({});
      return;
    }
    setIsLoadingStudents(true);
    setError(null);
    try {
      const studentsRes = await fetch(
        `/api/teacher/students?class_id=${selectedClassId}&section_id=${selectedSectionId}`
      );
      if (!studentsRes.ok) throw new Error("Failed to fetch students");
      const studentsData = await studentsRes.json();
      const studentList = Array.isArray(studentsData) ? studentsData : studentsData.students || [];
      setStudents(studentList);

      // Load existing marks if subject + exam selected
      if (selectedSubjectId && selectedExamId) {
        const marksRes = await fetch(
          `/api/teacher/marks?subject_id=${selectedSubjectId}&exam_id=${selectedExamId}&class_id=${selectedClassId}&section_id=${selectedSectionId}`
        );
        if (marksRes.ok) {
          const marksData = await marksRes.json();
          const marks = marksData.marks || [];
          const mMap: Record<number, number> = {};
          const cMap: Record<number, string> = {};
          studentList.forEach((s: StudentItem) => {
            const existing = marks.find((m: { student_id: number; mark_obtained: number; comment: string }) => m.student_id === s.student_id);
            mMap[s.student_id] = existing?.mark_obtained ?? 0;
            cMap[s.student_id] = existing?.comment ?? "";
          });
          setMarksMap(mMap);
          setCommentsMap(cMap);
        }
      } else {
        const mMap: Record<number, number> = {};
        const cMap: Record<number, string> = {};
        studentList.forEach((s: StudentItem) => {
          mMap[s.student_id] = 0;
          cMap[s.student_id] = "";
        });
        setMarksMap(mMap);
        setCommentsMap(cMap);
      }
    } catch {
      setError("Failed to load students");
    } finally {
      setIsLoadingStudents(false);
    }
  }, [selectedClassId, selectedSectionId, selectedSubjectId, selectedExamId]);

  useEffect(() => {
    if (selectedClassId && selectedSectionId) fetchStudentsAndMarks();
  }, [selectedClassId, selectedSectionId, fetchStudentsAndMarks]);

  // ─── Handlers ──────────────────────────────────────────────
  const handleMarkChange = (studentId: number, value: string) => {
    const mark = parseFloat(value) || 0;
    setMarksMap((prev) => ({ ...prev, [studentId]: mark }));
  };

  const handleCommentChange = (studentId: number, value: string) => {
    setCommentsMap((prev) => ({ ...prev, [studentId]: value }));
  };

  const handleSave = async () => {
    if (!selectedSubjectId || students.length === 0) return;
    setIsSaving(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const records = Object.entries(marksMap).map(([studentId, mark_obtained]) => ({
        student_id: parseInt(studentId),
        subject_id: parseInt(selectedSubjectId),
        class_id: parseInt(selectedClassId),
        section_id: parseInt(selectedSectionId),
        exam_id: selectedExamId ? parseInt(selectedExamId) : null,
        mark_obtained: mark_obtained ?? 0,
        comment: commentsMap[parseInt(studentId)] || "",
      }));

      const res = await fetch("/api/teacher/marks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ records }),
      });

      if (!res.ok) throw new Error("Failed to save marks");
      const data = await res.json();
      setSuccessMsg(`Marks saved for ${data.count} students`);
    } catch {
      setError("Failed to save marks. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const totalMarks = Object.values(marksMap).reduce((s, v) => s + v, 0);
  const avgMarks = students.length > 0 ? (totalMarks / students.length).toFixed(1) : "0";
  const highest = students.length > 0 ? Math.max(...Object.values(marksMap)) : 0;
  const lowest = students.length > 0 ? Math.min(...Object.values(marksMap).filter(v => v > 0)) : 0;

  const selectedClass = classes.find((c) => c.class_id === parseInt(selectedClassId));
  const sections = selectedClass?.sections || [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* ─── Header ─────────────────────────────────────── */}
        <div className="border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-500 flex items-center justify-center">
              <Award className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Marks Entry</h1>
              <p className="text-sm text-slate-500 mt-1">Enter and manage student marks for exams</p>
            </div>
          </div>
        </div>

        {/* ─── Filters ────────────────────────────────────── */}
        <Card className="gap-4">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Class</Label>
                <Select value={selectedClassId} onValueChange={(v) => { setSelectedClassId(v); setSelectedSectionId(""); setSelectedSubjectId(""); setStudents([]); }}>
                  <SelectTrigger className="bg-slate-50 border-slate-200 focus:bg-white"><SelectValue placeholder="Select class" /></SelectTrigger>
                  <SelectContent>
                    {classes.map((c) => (
                      <SelectItem key={c.class_id} value={String(c.class_id)}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Section</Label>
                <Select value={selectedSectionId} onValueChange={setSelectedSectionId}>
                  <SelectTrigger className="bg-slate-50 border-slate-200 focus:bg-white"><SelectValue placeholder="Select section" /></SelectTrigger>
                  <SelectContent>
                    {sections.map((s) => (
                      <SelectItem key={s.section_id} value={String(s.section_id)}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Subject</Label>
                <Select value={selectedSubjectId} onValueChange={setSelectedSubjectId}>
                  <SelectTrigger className="bg-slate-50 border-slate-200 focus:bg-white"><SelectValue placeholder="Select subject" /></SelectTrigger>
                  <SelectContent>
                    {filteredSubjects.map((s) => (
                      <SelectItem key={s.subject_id} value={String(s.subject_id)}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Exam</Label>
                <Select value={selectedExamId} onValueChange={setSelectedExamId}>
                  <SelectTrigger className="bg-slate-50 border-slate-200 focus:bg-white"><SelectValue placeholder="Select exam" /></SelectTrigger>
                  <SelectContent>
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

        {/* ─── Messages ───────────────────────────────────── */}
        {error && (
          <div className="flex items-center gap-3 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            {error}
          </div>
        )}
        {successMsg && (
          <div className="flex items-center gap-3 p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
            {successMsg}
          </div>
        )}

        {/* ─── Student Marks Table ────────────────────────── */}
        {selectedClassId && selectedSectionId && (
          <Card className="gap-4">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                    <Award className="w-4 h-4 text-purple-600" />
                  </div>
                  <CardTitle className="text-base font-semibold">
                    Students ({students.length})
                  </CardTitle>
                </div>
                <div className="flex items-center gap-4 text-sm flex-wrap">
                  <span className="text-slate-500">Total: <span className="font-semibold text-slate-900">{totalMarks}</span></span>
                  <span className="text-slate-500">Avg: <span className="font-semibold text-slate-900">{avgMarks}</span></span>
                  <span className="text-emerald-600">High: <span className="font-semibold">{highest}</span></span>
                  <span className="text-red-600">Low: <span className="font-semibold">{lowest}</span></span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {isLoadingStudents ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : students.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
                    <BookOpen className="w-8 h-8 text-slate-400" />
                  </div>
                  <p className="text-slate-400 text-sm">No students found in this class</p>
                </div>
              ) : (
                <>
                  <div className="max-h-[500px] overflow-y-auto rounded-lg border border-slate-200">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50 hover:bg-slate-50">
                          <TableHead className="text-xs font-semibold text-slate-600 uppercase w-10">#</TableHead>
                          <TableHead className="text-xs font-semibold text-slate-600 uppercase">Student</TableHead>
                          <TableHead className="text-xs font-semibold text-slate-600 uppercase hidden sm:table-cell">Code</TableHead>
                          <TableHead className="text-xs font-semibold text-slate-600 uppercase text-right w-28">Score</TableHead>
                          <TableHead className="text-xs font-semibold text-slate-600 uppercase text-center w-16">Grade</TableHead>
                          <TableHead className="text-xs font-semibold text-slate-600 uppercase hidden md:table-cell">Remarks</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {students.map((student, idx) => {
                          const mark = marksMap[student.student_id] ?? 0;
                          return (
                            <TableRow key={student.student_id} className="hover:bg-slate-50">
                              <TableCell className="text-slate-400 text-sm">{idx + 1}</TableCell>
                              <TableCell className="font-medium text-sm text-slate-900">
                                <div className="flex items-center gap-2">
                                  <div className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                                    <span className="text-[10px] font-bold text-purple-700">
                                      {student.name?.charAt(0) || student.first_name?.charAt(0) || "?"}
                                    </span>
                                  </div>
                                  {student.name || `${student.first_name} ${student.last_name}`.trim()}
                                </div>
                              </TableCell>
                              <TableCell className="hidden sm:table-cell text-sm text-slate-500 font-mono">
                                {student.student_code}
                              </TableCell>
                              <TableCell className="text-right">
                                <Input
                                  type="number"
                                  min={0}
                                  max={100}
                                  value={mark || ""}
                                  onChange={(e) => handleMarkChange(student.student_id, e.target.value)}
                                  className="w-20 text-right h-9 text-sm"
                                  placeholder="0"
                                />
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge className={getGradeColor(mark)} variant="secondary">
                                  {getGrade(mark)}
                                </Badge>
                              </TableCell>
                              <TableCell className="hidden md:table-cell">
                                <Input
                                  value={commentsMap[student.student_id] || ""}
                                  onChange={(e) => handleCommentChange(student.student_id, e.target.value)}
                                  className="h-9 text-sm"
                                  placeholder="Remarks..."
                                />
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>

                  <div className="flex justify-end mt-4">
                    <Button
                      onClick={handleSave}
                      disabled={isSaving || students.length === 0 || !selectedSubjectId}
                      className="bg-emerald-600 hover:bg-emerald-700 min-w-[44px] min-h-[44px]"
                    >
                      {isSaving ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4 mr-2" />
                      )}
                      Save Marks
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* ─── Empty State ────────────────────────────────── */}
        {!selectedClassId && !isLoading && (
          <Card className="gap-4">
            <CardContent className="py-16">
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                  <Award className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-medium text-slate-600">Select a class to begin</h3>
                <p className="text-sm text-slate-400 mt-1">Choose a class, subject, and exam to enter marks</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
