"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Trophy,
  Clock,
  Play,
  CheckCircle,
  Loader2,
  AlertTriangle,
  BarChart3,
  Lock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
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
import { format } from "date-fns";

interface OnlineExam {
  id: number;
  title: string;
  subject_id: number;
  class_id: number;
  duration: number;
  status: string;
  total_questions: number;
  subject: { name: string };
  class: { name: string };
}

interface ExamResult {
  id: number;
  exam_id: number;
  score: number;
  total: number;
  submitted_at: string;
  exam: { title: string };
}

interface ExamQuestion {
  id: number;
  question_text: string;
  question_type: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
}

export default function StudentOnlineExamsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [exams, setExams] = useState<OnlineExam[]>([]);
  const [results, setResults] = useState<ExamResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"available" | "results">("available");

  // Take exam state
  const [activeExam, setActiveExam] = useState<OnlineExam | null>(null);
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user?.id) return;
    setIsLoading(true);
    try {
      const [examsRes, resultsRes] = await Promise.all([
        fetch("/api/online-exams?status=active"),
        fetch(`/api/online-exams?studentId=${user.id}&type=results`),
      ]);
      if (examsRes.ok) { const d = await examsRes.json(); setExams(Array.isArray(d) ? d : []); }
      if (resultsRes.ok) { const d = await resultsRes.json(); setResults(Array.isArray(d) ? d : []); }
    } catch { setError("Failed to load exams"); }
    finally { setIsLoading(false); }
  }, [user?.id]);

  useEffect(() => { if (!authLoading) fetchData(); }, [authLoading, fetchData]);

  // Timer
  useEffect(() => {
    if (!activeExam || timeLeft <= 0) return;
    const timer = setInterval(() => { setTimeLeft((t) => { if (t <= 1) { clearInterval(timer); handleSubmitExam(); return 0; } return t - 1; }); }, 1000);
    return () => clearInterval(timer);
  }, [activeExam, timeLeft]);

  const startExam = async (exam: OnlineExam) => {
    setActiveExam(exam);
    setTimeLeft(exam.duration * 60);
    setAnswers({});
    try {
      const res = await fetch(`/api/online-exams?exam_id=${exam.id}&type=questions`);
      if (res.ok) { const d = await res.json(); setQuestions(Array.isArray(d) ? d : []); }
    } catch { setQuestions([]); }
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
      setActiveExam(null); setQuestions([]); setAnswers({});
      fetchData();
    } catch { setError("Failed to submit exam"); }
    finally { setIsSubmitting(false); }
  };

  const takenExamIds = new Set(results.map((r) => r.exam_id));

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6"><Skeleton className="h-8 w-48" /><div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}</div></div>
      </DashboardLayout>
    );
  }

  // Active exam view
  if (activeExam) {
    const mins = Math.floor(timeLeft / 60);
    const secs = timeLeft % 60;
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-slate-900">{activeExam.title}</h1>
              <p className="text-sm text-slate-500">{questions.length} questions</p>
            </div>
            <div className="flex items-center gap-3">
              <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${timeLeft < 300 ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"}`}>
                <Clock className="w-4 h-4" />
                <span className="font-mono font-bold">{String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}</span>
              </div>
              <Button onClick={handleSubmitExam} disabled={isSubmitting} className="bg-emerald-600 hover:bg-emerald-700 min-w-[44px] min-h-[44px]">
                {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}Submit
              </Button>
            </div>
          </div>
          <Progress value={Object.keys(answers).length / questions.length * 100} className="h-2" />
          <p className="text-xs text-slate-400">{Object.keys(answers).length}/{questions.length} answered</p>

          <div className="space-y-4">
            {questions.map((q, idx) => (
              <Card key={q.id} className="gap-4">
                <CardContent className="p-5">
                  <p className="font-medium text-sm text-slate-900 mb-4">{idx + 1}. {q.question_text}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {q.option_a && (
                      <button onClick={() => setAnswers((p) => ({ ...p, [q.id]: "a" }))} className={`p-3 rounded-lg border text-sm text-left transition-colors ${answers[q.id] === "a" ? "border-emerald-500 bg-emerald-50 text-emerald-700 font-medium" : "border-slate-200 hover:bg-slate-50"}`}>
                        A. {q.option_a}
                      </button>
                    )}
                    {q.option_b && (
                      <button onClick={() => setAnswers((p) => ({ ...p, [q.id]: "b" }))} className={`p-3 rounded-lg border text-sm text-left transition-colors ${answers[q.id] === "b" ? "border-emerald-500 bg-emerald-50 text-emerald-700 font-medium" : "border-slate-200 hover:bg-slate-50"}`}>
                        B. {q.option_b}
                      </button>
                    )}
                    {q.option_c && (
                      <button onClick={() => setAnswers((p) => ({ ...p, [q.id]: "c" }))} className={`p-3 rounded-lg border text-sm text-left transition-colors ${answers[q.id] === "c" ? "border-emerald-500 bg-emerald-50 text-emerald-700 font-medium" : "border-slate-200 hover:bg-slate-50"}`}>
                        C. {q.option_c}
                      </button>
                    )}
                    {q.option_d && (
                      <button onClick={() => setAnswers((p) => ({ ...p, [q.id]: "d" }))} className={`p-3 rounded-lg border text-sm text-left transition-colors ${answers[q.id] === "d" ? "border-emerald-500 bg-emerald-50 text-emerald-700 font-medium" : "border-slate-200 hover:bg-slate-50"}`}>
                        D. {q.option_d}
                      </button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div><h1 className="text-2xl font-bold text-slate-900 tracking-tight">Online Exams</h1><p className="text-sm text-slate-500 mt-1">Take online assessments</p></div>

        {error && (
          <div className="flex items-center gap-3 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm"><AlertTriangle className="w-5 h-5" />{error}</div>
        )}

        <div className="flex gap-2">
          <Button variant={tab === "available" ? "default" : "outline"} onClick={() => setTab("available")} className={`min-w-[44px] min-h-[44px] ${tab === "available" ? "bg-amber-600 hover:bg-amber-700" : ""}`}>
            <Trophy className="w-4 h-4 mr-2" />Available ({exams.length})
          </Button>
          <Button variant={tab === "results" ? "default" : "outline"} onClick={() => setTab("results")} className={`min-w-[44px] min-h-[44px] ${tab === "results" ? "bg-amber-600 hover:bg-amber-700" : ""}`}>
            <BarChart3 className="w-4 h-4 mr-2" />Results ({results.length})
          </Button>
        </div>

        {tab === "available" && (
          <Card className="gap-4">
            <CardContent className="pt-6">
              {exams.length === 0 ? (
                <div className="text-center py-12"><Trophy className="w-12 h-12 text-slate-300 mx-auto mb-3" /><p className="text-slate-400 text-sm">No exams available</p></div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {exams.map((exam) => {
                    const taken = takenExamIds.has(exam.id);
                    return (
                      <div key={exam.id} className="flex items-center gap-4 p-4 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors">
                        <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0"><Trophy className="w-6 h-6 text-amber-600" /></div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-slate-900">{exam.title}</p>
                          <div className="flex items-center gap-2 mt-1 text-xs text-slate-400"><Clock className="w-3 h-3" />{exam.duration} min • {exam.total_questions} questions</div>
                        </div>
                        {taken ? (
                          <Badge variant="secondary" className="bg-emerald-100 text-emerald-700"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>
                        ) : (
                          <Button size="sm" onClick={() => startExam(exam)} className="bg-amber-600 hover:bg-amber-700 min-w-[44px] min-h-[44px]"><Play className="w-4 h-4 mr-1" />Start</Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {tab === "results" && (
          <Card className="gap-4">
            <CardContent className="pt-6">
              {results.length === 0 ? (
                <div className="text-center py-12"><BarChart3 className="w-12 h-12 text-slate-300 mx-auto mb-3" /><p className="text-slate-400 text-sm">No results yet</p></div>
              ) : (
                <div className="max-h-96 overflow-y-auto rounded-lg border border-slate-200">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50 hover:bg-slate-50">
                        <TableHead className="text-xs font-semibold text-slate-600 uppercase">Exam</TableHead>
                        <TableHead className="text-xs font-semibold text-slate-600 uppercase text-right">Score</TableHead>
                        <TableHead className="text-xs font-semibold text-slate-600 uppercase text-center">Grade</TableHead>
                        <TableHead className="text-xs font-semibold text-slate-600 uppercase hidden sm:table-cell">Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {results.map((r) => {
                        const pct = r.total > 0 ? Math.round((r.score / r.total) * 100) : 0;
                        return (
                          <TableRow key={r.id} className="hover:bg-slate-50">
                            <TableCell className="text-sm font-medium">{r.exam?.title || "—"}</TableCell>
                            <TableCell className="text-right font-semibold text-sm">{r.score}/{r.total}</TableCell>
                            <TableCell className="text-center"><Badge variant={pct >= 50 ? "default" : "destructive"} className={pct >= 50 ? "bg-emerald-100 text-emerald-700" : ""}>{pct}%</Badge></TableCell>
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
        )}
      </div>
    </DashboardLayout>
  );
}
