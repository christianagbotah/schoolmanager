"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Trophy,
  Plus,
  Clock,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Eye,
  Trash2,
  Play,
  BarChart3,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useAuth } from "@/hooks/use-auth";
import { format } from "date-fns";

// ─── Types ───────────────────────────────────────────────────
interface OnlineExam {
  id: number;
  title: string;
  subject_id: number;
  class_id: number;
  duration: number;
  status: string;
  total_questions: number;
  created_at: string;
  subject: { name: string };
  class: { name: string };
}

interface Question {
  id: number;
  exam_id: number;
  question_text: string;
  question_type: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
}

interface ExamResult {
  id: number;
  exam_id: number;
  student_id: number;
  score: number;
  total: number;
  submitted_at: string;
  student: { name: string; student_code: string };
}

// ─── Main Component ──────────────────────────────────────────
export default function TeacherOnlineExamsPage() {
  const { isLoading: authLoading } = useAuth();
  const [exams, setExams] = useState<OnlineExam[]>([]);
  const [results, setResults] = useState<ExamResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Create exam
  const [createOpen, setCreateOpen] = useState(false);
  const [createTitle, setCreateTitle] = useState("");
  const [createSubject, setCreateSubject] = useState("");
  const [createClass, setCreateClass] = useState("");
  const [createDuration, setCreateDuration] = useState("30");
  const [isCreating, setIsCreating] = useState(false);

  // Questions dialog
  const [questionsOpen, setQuestionsOpen] = useState(false);
  const [selectedExam, setSelectedExam] = useState<OnlineExam | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);

  const [tab, setTab] = useState<"exams" | "results">("exams");

  const fetchExams = useCallback(async () => {
    setIsLoading(true);
    try {
      const [examsRes, resultsRes] = await Promise.all([
        fetch("/api/online-exams"),
        fetch("/api/online-exams?type=results"),
      ]);
      if (examsRes.ok) { const d = await examsRes.json(); setExams(Array.isArray(d) ? d : []); }
      if (resultsRes.ok) { const d = await resultsRes.json(); setResults(Array.isArray(d) ? d : []); }
    } catch {
      setError("Failed to load online exams");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading) fetchExams();
  }, [authLoading, fetchExams]);

  const handleCreateExam = async () => {
    if (!createTitle) return;
    setIsCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/online-exams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: createTitle,
          subject_id: parseInt(createSubject) || null,
          class_id: parseInt(createClass) || null,
          duration: parseInt(createDuration) || 30,
        }),
      });
      if (!res.ok) throw new Error("Failed to create exam");
      setSuccessMsg("Exam created successfully");
      setCreateOpen(false);
      setCreateTitle("");
      fetchExams();
    } catch {
      setError("Failed to create exam");
    } finally {
      setIsCreating(false);
    }
  };

  const handleViewQuestions = async (exam: OnlineExam) => {
    setSelectedExam(exam);
    setQuestionsOpen(true);
    try {
      const res = await fetch(`/api/online-exams?exam_id=${exam.id}&type=questions`);
      if (res.ok) { const d = await res.json(); setQuestions(Array.isArray(d) ? d : []); }
    } catch { setQuestions([]); }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Online Exams</h1>
            <p className="text-sm text-slate-500 mt-1">Create and manage online assessments</p>
          </div>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="bg-emerald-600 hover:bg-emerald-700 min-w-[44px] min-h-[44px]">
                <Plus className="w-4 h-4 mr-2" />Create Exam
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create Online Exam</DialogTitle></DialogHeader>
              <div className="space-y-4 mt-4">
                {error && <div className="flex items-center gap-2 p-3 rounded-lg text-sm bg-red-50 text-red-700 border border-red-200"><AlertTriangle className="w-4 h-4" />{error}</div>}
                <div className="space-y-2">
                  <Label>Exam Title</Label>
                  <Input value={createTitle} onChange={(e) => setCreateTitle(e.target.value)} placeholder="e.g., Term 1 Mathematics Quiz" />
                </div>
                <div className="space-y-2">
                  <Label>Duration (minutes)</Label>
                  <Input type="number" value={createDuration} onChange={(e) => setCreateDuration(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Class ID</Label>
                    <Input value={createClass} onChange={(e) => setCreateClass(e.target.value)} placeholder="Class ID" />
                  </div>
                  <div className="space-y-2">
                    <Label>Subject ID</Label>
                    <Input value={createSubject} onChange={(e) => setCreateSubject(e.target.value)} placeholder="Subject ID" />
                  </div>
                </div>
                <Button onClick={handleCreateExam} disabled={isCreating || !createTitle} className="w-full bg-emerald-600 hover:bg-emerald-700 min-h-[44px]">
                  {isCreating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}Create Exam
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {successMsg && (
          <div className="flex items-center gap-3 p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">
            <CheckCircle className="w-5 h-5 flex-shrink-0" />{successMsg}
          </div>
        )}

        <Tabs value={tab} onValueChange={(v) => setTab(v as "exams" | "results")}>
          <TabsList>
            <TabsTrigger value="exams">My Exams ({exams.length})</TabsTrigger>
            <TabsTrigger value="results">Results ({results.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="exams" className="mt-4">
            <Card className="gap-4">
              <CardContent className="pt-6">
                {exams.length === 0 ? (
                  <div className="text-center py-12">
                    <Trophy className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-400 text-sm">No online exams created yet</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {exams.map((exam) => (
                      <div key={exam.id} className="flex items-center gap-4 p-4 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors">
                        <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                          <Trophy className="w-6 h-6 text-emerald-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-slate-900">{exam.title}</p>
                          <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-400">
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{exam.duration} min</span>
                            <span>{exam.total_questions} questions</span>
                            {exam.subject?.name && <span>{exam.subject.name}</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className={
                            exam.status === "active" ? "bg-emerald-100 text-emerald-700" :
                            exam.status === "closed" ? "bg-red-100 text-red-700" :
                            "bg-amber-100 text-amber-700"
                          }>
                            {exam.status || "draft"}
                          </Badge>
                          <Button variant="ghost" size="sm" onClick={() => handleViewQuestions(exam)} className="min-w-[44px] min-h-[44px]">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="results" className="mt-4">
            <Card className="gap-4">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-purple-500" />
                  <CardTitle className="text-base font-semibold">Exam Results</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {results.length === 0 ? (
                  <div className="text-center py-12">
                    <BarChart3 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-400 text-sm">No results available yet</p>
                  </div>
                ) : (
                  <div className="max-h-96 overflow-y-auto rounded-lg border border-slate-200">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50 hover:bg-slate-50">
                          <TableHead className="text-xs font-semibold text-slate-600 uppercase">Student</TableHead>
                          <TableHead className="text-xs font-semibold text-slate-600 uppercase text-right">Score</TableHead>
                          <TableHead className="text-xs font-semibold text-slate-600 uppercase text-center">Percentage</TableHead>
                          <TableHead className="text-xs font-semibold text-slate-600 uppercase hidden sm:table-cell">Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {results.map((r) => {
                          const pct = r.total > 0 ? Math.round((r.score / r.total) * 100) : 0;
                          return (
                            <TableRow key={r.id} className="hover:bg-slate-50">
                              <TableCell className="text-sm font-medium">{r.student?.name || "—"}</TableCell>
                              <TableCell className="text-right font-semibold text-sm">{r.score}/{r.total}</TableCell>
                              <TableCell className="text-center">
                                <Badge variant={pct >= 50 ? "default" : "destructive"} className={pct >= 50 ? "bg-emerald-100 text-emerald-700" : ""}>
                                  {pct}%
                                </Badge>
                              </TableCell>
                              <TableCell className="hidden sm:table-cell text-xs text-slate-400">{r.submitted_at ? format(new Date(r.submitted_at), "MMM d, yyyy") : "—"}</TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* ─── Questions Dialog ────────────────────────────── */}
        <Dialog open={questionsOpen} onOpenChange={setQuestionsOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedExam?.title} — Questions ({questions.length})</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              {questions.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-8">No questions added yet</p>
              ) : (
                questions.map((q, idx) => (
                  <div key={q.id} className="p-3 rounded-lg border border-slate-100">
                    <p className="text-sm font-medium text-slate-900">{idx + 1}. {q.question_text}</p>
                    <p className="text-xs text-slate-400 mt-1">Type: {q.question_type} • Answer: {q.correct_answer}</p>
                    {(q.question_type === "mcq") && (
                      <div className="grid grid-cols-2 gap-1 mt-2 text-xs">
                        {q.option_a && <span className="text-slate-500">A. {q.option_a}</span>}
                        {q.option_b && <span className="text-slate-500">B. {q.option_b}</span>}
                        {q.option_c && <span className="text-slate-500">C. {q.option_c}</span>}
                        {q.option_d && <span className="text-slate-500">D. {q.option_d}</span>}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
