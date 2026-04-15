"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Trophy, Plus, Clock, Play, CheckCircle, Loader2,
  AlertTriangle, BarChart3, Lock, Eye,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/hooks/use-auth";
import { RequirePermission } from "@/components/auth/require-permission";
import { PERMISSIONS } from "@/lib/permissions";
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

interface ExamResult {
  id: number;
  exam_id: number;
  score: number;
  total: number;
  submitted_at: string;
  exam?: { title: string };
  student?: { name: string; student_code: string };
}

interface ExamQuestion {
  id: number;
  question_text: string;
  question_type: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
}

/**
 * Shared Online Exams Page
 * - Teacher: creates and manages online exams
 * - Student: takes online exams and views results
 */
export default function OnlineExamsPage() {
  const { user, isTeacher, isStudent, isLoading: authLoading } = useAuth();
  const [exams, setExams] = useState<OnlineExam[]>([]);
  const [results, setResults] = useState<ExamResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [tab, setTab] = useState<"available" | "results">("available");

  // Teacher: Create exam
  const [createOpen, setCreateOpen] = useState(false);
  const [createTitle, setCreateTitle] = useState("");
  const [createSubject, setCreateSubject] = useState("");
  const [createClass, setCreateClass] = useState("");
  const [createDuration, setCreateDuration] = useState("30");
  const [isCreating, setIsCreating] = useState(false);

  // Questions dialog
  const [questionsOpen, setQuestionsOpen] = useState(false);
  const [selectedExam, setSelectedExam] = useState<OnlineExam | null>(null);
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);

  // Student: Take exam
  const [activeExam, setActiveExam] = useState<OnlineExam | null>(null);
  const [examQuestions, setExamQuestions] = useState<ExamQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ─── Fetch exams ───────────────────────────────────────────
  const fetchExams = useCallback(async () => {
    setIsLoading(true);
    try {
      const [examsRes, resultsRes] = await Promise.all([
        isStudent ? fetch("/api/online-exams?status=active") : fetch("/api/online-exams"),
        fetch(isStudent ? `/api/online-exams?studentId=${user?.id}&type=results` : "/api/online-exams?type=results"),
      ]);
      if (examsRes.ok) { const d = await examsRes.json(); setExams(Array.isArray(d) ? d : []); }
      if (resultsRes.ok) { const d = await resultsRes.json(); setResults(Array.isArray(d) ? d : []); }
    } catch { setError("Failed to load online exams"); }
    finally { setIsLoading(false); }
  }, [isStudent, user?.id]);

  useEffect(() => { if (!authLoading) fetchExams(); }, [authLoading, fetchExams]);

  // ─── Teacher: Create exam ──────────────────────────────────
  const handleCreateExam = async () => {
    if (!createTitle) return;
    setIsCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/online-exams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: createTitle, subject_id: parseInt(createSubject) || null, class_id: parseInt(createClass) || null, duration: parseInt(createDuration) || 30 }),
      });
      if (!res.ok) throw new Error();
      setSuccessMsg("Exam created successfully");
      setCreateOpen(false);
      setCreateTitle("");
      fetchExams();
    } catch { setError("Failed to create exam"); }
    finally { setIsCreating(false); }
  };

  const handleViewQuestions = async (exam: OnlineExam) => {
    setSelectedExam(exam);
    setQuestionsOpen(true);
    try {
      const res = await fetch(`/api/online-exams?exam_id=${exam.id}&type=questions`);
      if (res.ok) { const d = await res.json(); setQuestions(Array.isArray(d) ? d : []); }
    } catch { setQuestions([]); }
  };

  // ─── Student: Take exam ─────────────────────────────────────
  const startExam = async (exam: OnlineExam) => {
    setActiveExam(exam);
    setTimeLeft(exam.duration * 60);
    setAnswers({});
    try {
      const res = await fetch(`/api/online-exams?exam_id=${exam.id}&type=questions`);
      if (res.ok) { const d = await res.json(); setExamQuestions(Array.isArray(d) ? d : []); }
    } catch { setExamQuestions([]); }
  };

  const handleSubmitExam = async () => {
    if (!activeExam || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await fetch("/api/online-exams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "submit", exam_id: activeExam.id, student_id: user?.id, answers }),
      });
      setActiveExam(null); setExamQuestions([]); setAnswers({});
      fetchExams();
    } catch { setError("Failed to submit exam"); }
    finally { setIsSubmitting(false); }
  };

  // Timer
  useEffect(() => {
    if (!activeExam || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((t) => { if (t <= 1) { clearInterval(timer); handleSubmitExam(); return 0; } return t - 1; });
    }, 1000);
    return () => clearInterval(timer);
  }, [activeExam, timeLeft]);

  const takenExamIds = new Set(results.map((r) => r.exam_id));

  if (isLoading) {
    return <div className="space-y-6"><Skeleton className="h-8 w-48" /><div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}</div></div>;
  }

  // ─── Active Exam View ──────────────────────────────────────
  if (activeExam && isStudent) {
    const mins = Math.floor(timeLeft / 60);
    const secs = timeLeft % 60;
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div><h1 className="text-xl font-bold text-slate-900">{activeExam.title}</h1><p className="text-sm text-slate-500">{examQuestions.length} questions</p></div>
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${timeLeft < 300 ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"}`}>
              <Clock className="w-4 h-4" /><span className="font-mono font-bold">{String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}</span>
            </div>
            <Button onClick={handleSubmitExam} disabled={isSubmitting} className="bg-emerald-600 hover:bg-emerald-700 min-w-[44px] min-h-[44px]">
              {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />} Submit
            </Button>
          </div>
        </div>
        <Progress value={Object.keys(answers).length / examQuestions.length * 100} className="h-2" />
        <p className="text-xs text-slate-400">{Object.keys(answers).length}/{examQuestions.length} answered</p>
        <div className="space-y-4">
          {examQuestions.map((q, idx) => (
            <Card key={q.id} className="gap-4"><CardContent className="p-5">
              <p className="font-medium text-sm text-slate-900 mb-4">{idx + 1}. {q.question_text}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {q.option_a && <button onClick={() => setAnswers((p) => ({ ...p, [q.id]: "a" }))} className={`p-3 rounded-lg border text-sm text-left transition-colors ${answers[q.id] === "a" ? "border-emerald-500 bg-emerald-50 text-emerald-700 font-medium" : "border-slate-200 hover:bg-slate-50"}`}>A. {q.option_a}</button>}
                {q.option_b && <button onClick={() => setAnswers((p) => ({ ...p, [q.id]: "b" }))} className={`p-3 rounded-lg border text-sm text-left transition-colors ${answers[q.id] === "b" ? "border-emerald-500 bg-emerald-50 text-emerald-700 font-medium" : "border-slate-200 hover:bg-slate-50"}`}>B. {q.option_b}</button>}
                {q.option_c && <button onClick={() => setAnswers((p) => ({ ...p, [q.id]: "c" }))} className={`p-3 rounded-lg border text-sm text-left transition-colors ${answers[q.id] === "c" ? "border-emerald-500 bg-emerald-50 text-emerald-700 font-medium" : "border-slate-200 hover:bg-slate-50"}`}>C. {q.option_c}</button>}
                {q.option_d && <button onClick={() => setAnswers((p) => ({ ...p, [q.id]: "d" }))} className={`p-3 rounded-lg border text-sm text-left transition-colors ${answers[q.id] === "d" ? "border-emerald-500 bg-emerald-50 text-emerald-700 font-medium" : "border-slate-200 hover:bg-slate-50"}`}>D. {q.option_d}</button>}
              </div>
            </CardContent></Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-slate-900 tracking-tight">Online Exams</h1><p className="text-sm text-slate-500 mt-1">{isTeacher ? "Create and manage online assessments" : "Take online assessments"}</p></div>
        {isTeacher && (
          <RequirePermission permission={PERMISSIONS.CAN_MANAGE_EXAMS}>
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild><Button className="bg-emerald-600 hover:bg-emerald-700 min-w-[44px] min-h-[44px]"><Plus className="w-4 h-4 mr-2" /> Create Exam</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Create Online Exam</DialogTitle></DialogHeader>
                <div className="space-y-4 mt-4">
                  {error && <div className="flex items-center gap-2 p-3 rounded-lg text-sm bg-red-50 text-red-700 border border-red-200"><AlertTriangle className="w-4 h-4" />{error}</div>}
                  <div className="space-y-2"><Label>Exam Title</Label><Input value={createTitle} onChange={(e) => setCreateTitle(e.target.value)} placeholder="e.g., Term 1 Mathematics Quiz" /></div>
                  <div className="space-y-2"><Label>Duration (minutes)</Label><Input type="number" value={createDuration} onChange={(e) => setCreateDuration(e.target.value)} /></div>
                  <div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label>Class ID</Label><Input value={createClass} onChange={(e) => setCreateClass(e.target.value)} placeholder="Class ID" /></div><div className="space-y-2"><Label>Subject ID</Label><Input value={createSubject} onChange={(e) => setCreateSubject(e.target.value)} placeholder="Subject ID" /></div></div>
                  <Button onClick={handleCreateExam} disabled={isCreating || !createTitle} className="w-full bg-emerald-600 hover:bg-emerald-700 min-h-[44px]">{isCreating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />} Create Exam</Button>
                </div>
              </DialogContent>
            </Dialog>
          </RequirePermission>
        )}
      </div>

      {successMsg && <div className="flex items-center gap-3 p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm"><CheckCircle className="w-5 h-5" />{successMsg}</div>}
      {error && <div className="flex items-center gap-3 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm"><AlertTriangle className="w-5 h-5" />{error}</div>}

      {isStudent ? (
        <>
          <div className="flex gap-2">
            <Button variant={tab === "available" ? "default" : "outline"} onClick={() => setTab("available")} className={`min-w-[44px] min-h-[44px] ${tab === "available" ? "bg-amber-600 hover:bg-amber-700" : ""}`}><Trophy className="w-4 h-4 mr-2" /> Available ({exams.length})</Button>
            <Button variant={tab === "results" ? "default" : "outline"} onClick={() => setTab("results")} className={`min-w-[44px] min-h-[44px] ${tab === "results" ? "bg-amber-600 hover:bg-amber-700" : ""}`}><BarChart3 className="w-4 h-4 mr-2" /> Results ({results.length})</Button>
          </div>

          {tab === "available" && (
            <Card className="gap-4"><CardContent className="pt-6">
              {exams.length === 0 ? <div className="text-center py-12"><Trophy className="w-12 h-12 text-slate-300 mx-auto mb-3" /><p className="text-slate-400 text-sm">No exams available</p></div> : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {exams.map((exam) => {
                    const taken = takenExamIds.has(exam.id);
                    return (
                      <div key={exam.id} className="flex items-center gap-4 p-4 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors">
                        <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0"><Trophy className="w-6 h-6 text-amber-600" /></div>
                        <div className="flex-1 min-w-0"><p className="font-semibold text-sm text-slate-900">{exam.title}</p><div className="flex items-center gap-2 mt-1 text-xs text-slate-400"><Clock className="w-3 h-3" />{exam.duration} min &bull; {exam.total_questions} questions</div></div>
                        {taken ? <Badge variant="secondary" className="bg-emerald-100 text-emerald-700"><CheckCircle className="w-3 h-3 mr-1" /> Completed</Badge> : <Button size="sm" onClick={() => startExam(exam)} className="bg-amber-600 hover:bg-amber-700 min-w-[44px] min-h-[44px]"><Play className="w-4 h-4 mr-1" /> Start</Button>}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent></Card>
          )}

          {tab === "results" && (
            <Card className="gap-4"><CardContent className="pt-6">
              {results.length === 0 ? <div className="text-center py-12"><BarChart3 className="w-12 h-12 text-slate-300 mx-auto mb-3" /><p className="text-slate-400 text-sm">No results yet</p></div> : (
                <div className="max-h-96 overflow-y-auto rounded-lg border border-slate-200"><Table><TableHeader><TableRow className="bg-slate-50 hover:bg-slate-50"><TableHead className="text-xs font-semibold text-slate-600 uppercase">Exam</TableHead><TableHead className="text-xs font-semibold text-slate-600 uppercase text-right">Score</TableHead><TableHead className="text-xs font-semibold text-slate-600 uppercase text-center">Grade</TableHead><TableHead className="text-xs font-semibold text-slate-600 uppercase hidden sm:table-cell">Date</TableHead></TableRow></TableHeader><TableBody>
                  {results.map((r) => { const pct = r.total > 0 ? Math.round((r.score / r.total) * 100) : 0; return (<TableRow key={r.id} className="hover:bg-slate-50"><TableCell className="text-sm font-medium">{r.exam?.title || "—"}</TableCell><TableCell className="text-right font-semibold text-sm">{r.score}/{r.total}</TableCell><TableCell className="text-center"><Badge variant={pct >= 50 ? "default" : "destructive"} className={pct >= 50 ? "bg-emerald-100 text-emerald-700" : ""}>{pct}%</Badge></TableCell><TableCell className="hidden sm:table-cell text-xs text-slate-400">{r.submitted_at ? format(new Date(r.submitted_at), "MMM d, yyyy") : "—"}</TableCell></TableRow>); })}
                </TableBody></Table></div>
              )}
            </CardContent></Card>
          )}
        </>
      ) : (
        // Teacher view
        <>
          <Tabs value={tab} onValueChange={(v) => setTab(v as "available" | "results")}>
            <TabsList><TabsTrigger value="available">My Exams ({exams.length})</TabsTrigger><TabsTrigger value="results">Results ({results.length})</TabsTrigger></TabsList>
            <TabsContent value="available" className="mt-4">
              <Card className="gap-4"><CardContent className="pt-6">
                {exams.length === 0 ? <div className="text-center py-12"><Trophy className="w-12 h-12 text-slate-300 mx-auto mb-3" /><p className="text-slate-400 text-sm">No online exams created yet</p></div> : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {exams.map((exam) => (
                      <div key={exam.id} className="flex items-center gap-4 p-4 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors">
                        <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0"><Trophy className="w-6 h-6 text-emerald-600" /></div>
                        <div className="flex-1 min-w-0"><p className="font-semibold text-sm text-slate-900">{exam.title}</p><div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-400"><Clock className="w-3 h-3" />{exam.duration} min<span>{exam.total_questions} questions</span>{exam.subject?.name && <span>{exam.subject.name}</span>}</div></div>
                        <div className="flex items-center gap-2"><Badge variant="secondary" className={exam.status === "active" ? "bg-emerald-100 text-emerald-700" : exam.status === "closed" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}>{exam.status || "draft"}</Badge><Button variant="ghost" size="sm" onClick={() => handleViewQuestions(exam)} className="min-w-[44px] min-h-[44px]"><Eye className="w-4 h-4" /></Button></div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent></Card>
            </TabsContent>
            <TabsContent value="results" className="mt-4">
              <Card className="gap-4"><CardHeader><div className="flex items-center gap-2"><BarChart3 className="w-4 h-4 text-purple-500" /><CardTitle className="text-base font-semibold">Exam Results</CardTitle></div></CardHeader><CardContent className="pt-0">
                {results.length === 0 ? <div className="text-center py-12"><BarChart3 className="w-12 h-12 text-slate-300 mx-auto mb-3" /><p className="text-slate-400 text-sm">No results available yet</p></div> : (
                  <div className="max-h-96 overflow-y-auto rounded-lg border border-slate-200"><Table><TableHeader><TableRow className="bg-slate-50 hover:bg-slate-50"><TableHead className="text-xs font-semibold text-slate-600 uppercase">Student</TableHead><TableHead className="text-xs font-semibold text-slate-600 uppercase text-right">Score</TableHead><TableHead className="text-xs font-semibold text-slate-600 uppercase text-center">Percentage</TableHead><TableHead className="text-xs font-semibold text-slate-600 uppercase hidden sm:table-cell">Date</TableHead></TableRow></TableHeader><TableBody>
                    {results.map((r) => { const pct = r.total > 0 ? Math.round((r.score / r.total) * 100) : 0; return (<TableRow key={r.id} className="hover:bg-slate-50"><TableCell className="text-sm font-medium">{r.student?.name || "—"}</TableCell><TableCell className="text-right font-semibold text-sm">{r.score}/{r.total}</TableCell><TableCell className="text-center"><Badge variant={pct >= 50 ? "default" : "destructive"} className={pct >= 50 ? "bg-emerald-100 text-emerald-700" : ""}>{pct}%</Badge></TableCell><TableCell className="hidden sm:table-cell text-xs text-slate-400">{r.submitted_at ? format(new Date(r.submitted_at), "MMM d, yyyy") : "—"}</TableCell></TableRow>); })}
                  </TableBody></Table></div>
                )}
              </CardContent></Card>
            </TabsContent>
          </Tabs>

          <Dialog open={questionsOpen} onOpenChange={setQuestionsOpen}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader><DialogTitle>{selectedExam?.title} — Questions ({questions.length})</DialogTitle></DialogHeader>
              <div className="space-y-3">
                {questions.length === 0 ? <p className="text-sm text-slate-400 text-center py-8">No questions added yet</p> : questions.map((q, idx) => (
                  <div key={q.id} className="p-3 rounded-lg border border-slate-100"><p className="text-sm font-medium text-slate-900">{idx + 1}. {q.question_text}</p><p className="text-xs text-slate-400 mt-1">Type: {q.question_type} &bull; Answer: {q.correct_answer}</p></div>
                ))}
              </div>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
}
