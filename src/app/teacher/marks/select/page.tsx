"use client";

import { useEffect, useState, useCallback } from "react";
import {
  FileText,
  Loader2,
  AlertTriangle,
  MousePointerClick,
  Clock,
  History,
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
import { useRouter } from "next/navigation";

// ─── Types ───────────────────────────────────────────────────
interface ClassItem { class_id: number; name: string; sections: { section_id: number; name: string }[]; }
interface SubjectItem { subject_id: number; name: string; }
interface ExamItem { exam_id: number; name: string; type: string; }
interface MarkRecord {
  mark_id: number;
  class_id: number;
  section_id: number;
  subject_id: number;
  exam_id: number;
  mark_obtained: number;
  comment: string;
  created_at: string;
  class: { name: string };
  section: { name: string };
  subject: { name: string };
  exam: { name: string } | null;
}

// ─── Main Component ──────────────────────────────────────────
export default function TeacherMarksSelectPage() {
  const { isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedSectionId, setSelectedSectionId] = useState("");
  const [selectedExamId, setSelectedExamId] = useState("");
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [exams, setExams] = useState<ExamItem[]>([]);
  const [history, setHistory] = useState<MarkRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const fetchClasses = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/classes");
      if (res.ok) { const d = await res.json(); setClasses(d || []); }
    } catch { /* silent */ } finally { setIsLoading(false); }
  }, []);

  useEffect(() => { if (!authLoading) fetchClasses(); }, [authLoading, fetchClasses]);

  useEffect(() => {
    if (!selectedClassId) { setSubjects([]); setExams([]); return; }
    const loadSubjectsAndExams = async () => {
      try {
        const [sRes, eRes] = await Promise.all([
          fetch(`/api/subjects?class_id=${selectedClassId}`),
          fetch(`/api/exams?class_id=${selectedClassId}`),
        ]);
        if (sRes.ok) { const d = await sRes.json(); setSubjects(Array.isArray(d) ? d : []); }
        if (eRes.ok) { const d = await eRes.json(); setExams(d.exams || []); }
      } catch { /* silent */ }
    };
    loadSubjectsAndExams();
  }, [selectedClassId]);

  const fetchHistory = useCallback(async () => {
    if (!selectedClassId || !selectedSectionId || !selectedExamId || !selectedSubjectId) {
      setHistory([]);
      return;
    }
    setIsLoadingHistory(true);
    try {
      const res = await fetch(`/api/marks?class_id=${selectedClassId}&section_id=${selectedSectionId}&subject_id=${selectedSubjectId}&exam_id=${selectedExamId}&limit=200`);
      if (res.ok) {
        const d = await res.json();
        setHistory(d.marks || []);
      }
    } catch { setHistory([]); }
    finally { setIsLoadingHistory(false); }
  }, [selectedClassId, selectedSectionId, selectedExamId, selectedSubjectId]);

  const selectedClass = classes.find((c) => c.class_id === parseInt(selectedClassId));
  const sections = selectedClass?.sections || [];

  const handleEnterMarks = () => {
    if (selectedClassId && selectedSectionId && selectedExamId && selectedSubjectId) {
      router.push(`/teacher/marks?class=${selectedClassId}&section=${selectedSectionId}&exam=${selectedExamId}&subject=${selectedSubjectId}`);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6"><Skeleton className="h-8 w-48" /><Skeleton className="h-24 w-full" /><Skeleton className="h-24 w-full" /></div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Select Mark Entry</h1>
          <p className="text-sm text-slate-500 mt-1">Choose class, section, exam, and subject to enter marks</p>
        </div>

        {/* ─── Selectors ───────────────────────────────────── */}
        <Card className="gap-4">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                <MousePointerClick className="w-4 h-4 text-purple-600" />
              </div>
              <CardTitle className="text-base font-semibold">Mark Entry Selection</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Class</Label>
                <Select value={selectedClassId} onValueChange={(v) => { setSelectedClassId(v); setSelectedSectionId(""); setHistory([]); }}>
                  <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                  <SelectContent>{classes.map((c) => <SelectItem key={c.class_id} value={String(c.class_id)}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Section</Label>
                <Select value={selectedSectionId} onValueChange={(v) => { setSelectedSectionId(v); setHistory([]); }}>
                  <SelectTrigger><SelectValue placeholder="Select section" /></SelectTrigger>
                  <SelectContent>{sections.map((s) => <SelectItem key={s.section_id} value={String(s.section_id)}>{s.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Exam</Label>
                <Select value={selectedExamId} onValueChange={(v) => { setSelectedExamId(v); setHistory([]); }}>
                  <SelectTrigger><SelectValue placeholder="Select exam" /></SelectTrigger>
                  <SelectContent>
                    {exams.map((e) => <SelectItem key={e.exam_id} value={String(e.exam_id)}>{e.name} {e.type ? `(${e.type})` : ""}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Subject</Label>
                <Select value={selectedSubjectId} onValueChange={(v) => { setSelectedSubjectId(v); setHistory([]); }}>
                  <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
                  <SelectContent>{subjects.map((s) => <SelectItem key={s.subject_id} value={String(s.subject_id)}>{s.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <Button onClick={handleEnterMarks} disabled={!selectedClassId || !selectedSectionId || !selectedExamId || !selectedSubjectId} className="bg-emerald-600 hover:bg-emerald-700 min-w-[44px] min-h-[44px]">
                <FileText className="w-4 h-4 mr-2" />Enter Marks
              </Button>
              <Button variant="outline" onClick={fetchHistory} disabled={!selectedClassId || !selectedSectionId || !selectedExamId || !selectedSubjectId} className="min-w-[44px] min-h-[44px]">
                <History className="w-4 h-4 mr-2" />View Previous Marks
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* ─── Previous Marks History ──────────────────────── */}
        {history.length > 0 && (
          <Card className="gap-4">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                    <History className="w-4 h-4 text-blue-600" />
                  </div>
                  <CardTitle className="text-base font-semibold">Previous Marks ({history.length})</CardTitle>
                </div>
                <Badge variant="outline">{history.filter((m) => m.mark_obtained > 0).length} entered</Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="max-h-64 overflow-y-auto rounded-lg border border-slate-200">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50 hover:bg-slate-50">
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase">Student</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase text-right">Score</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase hidden sm:table-cell">Comment</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingHistory ? (
                      Array.from({ length: 3 }).map((_, i) => <TableRow key={i}><TableCell colSpan={3}><Skeleton className="h-8 w-full" /></TableCell></TableRow>)
                    ) : (
                      history.map((m) => (
                        <TableRow key={m.mark_id} className="hover:bg-slate-50">
                          <TableCell className="text-sm font-medium">{m.class?.name}</TableCell>
                          <TableCell className="text-right font-semibold text-sm">{m.mark_obtained || 0}</TableCell>
                          <TableCell className="hidden sm:table-cell text-xs text-slate-500">{m.comment || "—"}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ─── Empty State ─────────────────────────────────── */}
        {!selectedClassId && !isLoading && (
          <Card className="gap-4">
            <CardContent className="py-16">
              <div className="text-center">
                <MousePointerClick className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-600">Select options to begin</h3>
                <p className="text-sm text-slate-400 mt-1">Choose class, section, exam, and subject above</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
