"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Trophy, Plus, Clock, Play, CheckCircle, Loader2,
  AlertTriangle, BarChart3, Eye, Pencil, Trash2,
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
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { RequirePermission } from "@/components/auth/require-permission";
import { PERMISSIONS } from "@/lib/permissions";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

// ─── Types ───────────────────────────────────────────────────
interface OnlineExam {
  id: number;
  title: string;
  subject_id: number | null;
  class_id: number | null;
  duration: number;
  status: string;
  total_questions: number;
  instructions: string;
  minimum_percentage: number;
  created_at: string;
  subject: { name: string } | null;
  class: { name: string } | null;
}

interface ExamResult {
  id: number;
  exam_id: number;
  exam: { title: string } | null;
  student: { name: string; student_code: string } | null;
  score: number;
  total: number;
  status: string;
}

// ─── Shared Online Exams Page ────────────────────────────────
export default function OnlineExamsPage() {
  const { isTeacher, isStudent, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [exams, setExams] = useState<OnlineExam[]>([]);
  const [results, setResults] = useState<ExamResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Teacher: Create/edit exam
  const [createOpen, setCreateOpen] = useState(false);
  const [editExam, setEditExam] = useState<OnlineExam | null>(null);
  const [createTitle, setCreateTitle] = useState("");
  const [createDuration, setCreateDuration] = useState("30");
  const [createInstructions, setCreateInstructions] = useState("");
  const [createClassId, setCreateClassId] = useState("");
  const [createSubjectId, setCreateSubjectId] = useState("");
  const [createStatus, setCreateStatus] = useState("draft");
  const [classes, setClasses] = useState<{ class_id: number; name: string }[]>([]);
  const [subjects, setSubjects] = useState<{ subject_id: number; name: string }[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  // Student: Take exam
  const [activeExam, setActiveExam] = useState<OnlineExam | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete confirm
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingExam, setDeletingExam] = useState<OnlineExam | null>(null);

  // ─── Fetch ────────────────────────────────────────────────
  const fetchExams = useCallback(async () => {
    setIsLoading(true);
    try {
      const [examsRes, resultsRes] = await Promise.all([
        fetch("/api/online-exams"),
        fetch("/api/online-exams?type=results"),
      ]);
      if (examsRes.ok) { const d = await examsRes.json(); setExams(Array.isArray(d) ? d : []); }
      if (resultsRes.ok) { const d = await resultsRes.json(); setResults(Array.isArray(d) ? d : []); }
    } catch { setError("Failed to load online exams"); }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => {
    if (!authLoading) fetchExams();
    // Load classes and subjects for teacher
    fetch("/api/classes").then(r => r.ok ? r.json() : []).then(d => {
      setClasses((d || []).map((c: any) => ({ class_id: c.class_id, name: c.name })));
    }).catch(() => {});
    fetch("/api/subjects").then(r => r.ok ? r.json() : []).then(d => {
      setSubjects((d || []).map((s: any) => ({ subject_id: s.subject_id, name: s.name })));
    }).catch(() => {});
  }, [authLoading, fetchExams]);

  // ─── Teacher: Create exam ────────────────────────────────
  const openCreateDialog = () => {
    setEditExam(null);
    setCreateTitle(""); setCreateDuration("30"); setCreateInstructions("");
    setCreateClassId(""); setCreateSubjectId(""); setCreateStatus("draft");
    setCreateOpen(true);
  };

  const openEditDialog = (exam: OnlineExam) => {
    setEditExam(exam);
    setCreateTitle(exam.title);
    setCreateDuration(String(exam.duration));
    setCreateInstructions(exam.instructions);
    setCreateClassId(exam.class_id ? String(exam.class_id) : "");
    setCreateSubjectId(exam.subject_id ? String(exam.subject_id) : "");
    setCreateStatus(exam.status);
    setCreateOpen(true);
  };

  const handleSaveExam = async () => {
    if (!createTitle) return;
    setIsCreating(true);
    setError(null);
    try {
      const body: any = {
        title: createTitle,
        duration: parseInt(createDuration) || 30,
        instructions: createInstructions,
        class_id: createClassId ? parseInt(createClassId) : null,
        subject_id: createSubjectId ? parseInt(createSubjectId) : null,
        status: createStatus,
      };
      const res = await fetch("/api/online-exams", {
        method: editExam ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editExam ? { id: editExam.id, ...body } : body),
      });
      if (!res.ok) throw new Error();
      toast({ title: "Success", description: editExam ? "Exam updated" : "Exam created" });
      setCreateOpen(false);
      fetchExams();
    } catch {
      setError("Failed to save exam");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteExam = async () => {
    if (!deletingExam) return;
    try {
      await fetch(`/api/online-exams?id=${deletingExam.id}`, { method: "DELETE" });
      toast({ title: "Success", description: "Exam deleted" });
      setDeleteOpen(false);
      setDeletingExam(null);
      fetchExams();
    } catch {
      toast({ title: "Error", variant: "destructive", description: "Failed to delete" });
    }
  };

  // ─── Student: Take exam ──────────────────────────────────
  const startExam = (exam: OnlineExam) => {
    setActiveExam(exam);
    setTimeLeft(exam.duration * 60);
    setAnswers({});
  };

  const handleSubmitExam = async () => {
    if (!activeExam || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await fetch("/api/online-exams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "submit", exam_id: activeExam.id, student_id: 1, answers }),
      });
      toast({ title: "Success", description: "Exam submitted" });
      setActiveExam(null);
      fetchExams();
    } catch {
      setError("Failed to submit exam");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Timer
  useEffect(() => {
    if (!activeExam || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) { clearInterval(timer); handleSubmitExam(); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [activeExam, timeLeft]);

  const takenExamIds = new Set(results.map((r) => r.exam_id));

  // ─── Loading ─────────────────────────────────────────────
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
          <div><h1 className="text-xl font-bold text-slate-900">{activeExam.title}</h1><p className="text-sm text-slate-500">{activeExam.total_questions} questions</p></div>
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${timeLeft < 300 ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"}`}>
              <Clock className="w-4 h-4" /><span className="font-mono font-bold">{String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}</span>
            </div>
            <Button onClick={handleSubmitExam} disabled={isSubmitting} className="bg-emerald-600 hover:bg-emerald-700 min-w-[44px] min-h-[44px]">
              {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />} Submit
            </Button>
          </div>
        </div>
        <Progress value={Object.keys(answers).length / Math.max(activeExam.total_questions, 1) * 100} className="h-2" />
        <p className="text-xs text-slate-400">{Object.keys(answers).length}/{activeExam.total_questions} answered</p>
        <div className="text-center py-12">
          <BarChart3 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">Exam questions will appear here once added by teachers</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Online Exams</h1>
          <p className="text-sm text-slate-500 mt-1">{isTeacher ? "Create and manage online assessments" : "Take online assessments"}</p>
        </div>
        {isTeacher && (
          <RequirePermission permission={PERMISSIONS.CAN_MANAGE_EXAMS}>
            <Button className="bg-emerald-600 hover:bg-emerald-700 min-w-[44px] min-h-[44px]" onClick={openCreateDialog}>
              <Plus className="w-4 h-4 mr-2" /> Create Exam
            </Button>
          </RequirePermission>
        )}
      </div>

      {error && <div className="flex items-center gap-3 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm"><AlertTriangle className="w-5 h-5 flex-shrink-0" />{error}</div>}

      {isStudent ? (
        <StudentView exams={exams} results={results} takenExamIds={takenExamIds} startExam={startExam} />
      ) : (
        <TeacherView
          exams={exams} results={results}
          classes={classes} subjects={subjects}
          openCreate={openCreateDialog} openEdit={openEditDialog}
          deleteExam={deletingExam} setDeleteOpen={setDeleteOpen} setDeletingExam={setDeletingExam}
        />
      )}

      {/* Create/Edit Exam Dialog */}
      <RequirePermission permission={PERMISSIONS.CAN_MANAGE_EXAMS}>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>{editExam ? "Edit Online Exam" : "Create Online Exam"}</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-4">
              {error && <div className="flex items-center gap-2 p-3 rounded-lg text-sm bg-red-50 text-red-700 border border-red-200"><AlertTriangle className="w-4 h-4" />{error}</div>}
              <div className="space-y-2"><Label>Exam Title</Label><Input value={createTitle} onChange={(e) => setCreateTitle(e.target.value)} placeholder="e.g., Term 1 Mathematics Quiz" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Class</Label>
                  <Select value={createClassId} onValueChange={setCreateClassId}>
                    <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                    <SelectContent>{classes.map(c => <SelectItem key={c.class_id} value={String(c.class_id)}>{c.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>Subject</Label>
                  <Select value={createSubjectId} onValueChange={setCreateSubjectId}>
                    <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
                    <SelectContent>{subjects.map(s => <SelectItem key={s.subject_id} value={String(s.subject_id)}>{s.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Duration (minutes)</Label><Input type="number" value={createDuration} onChange={(e) => setCreateDuration(e.target.value)} /></div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={createStatus} onValueChange={setCreateStatus}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2"><Label>Instructions</Label><Textarea value={createInstructions} onChange={(e) => setCreateInstructions(e.target.value)} placeholder="Instructions for students..." rows={3} /></div>
              <Button onClick={handleSaveExam} disabled={isCreating || !createTitle} className="w-full bg-emerald-600 hover:bg-emerald-700 min-h-[44px]">
                {isCreating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                {editExam ? "Update Exam" : "Create Exam"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader><AlertDialogTitle>Delete Exam</AlertDialogTitle><AlertDialogDescription>Delete <strong>{deletingExam?.title}</strong>? All results will also be deleted.</AlertDialogDescription></AlertDialogHeader>
            <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDeleteExam} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction></AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </RequirePermission>
    </div>
  );
}

// ─── Student View ──────────────────────────────────────────
function StudentView({ exams, results, takenExamIds, startExam }: {
  exams: OnlineExam[]; results: ExamResult[]; takenExamIds: Set<number>;
  startExam: (exam: OnlineExam) => void;
}) {
  const [tab, setTab] = useState<"available" | "results">("available");

  return (
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
                    <div className="flex-1 min-w-0"><p className="font-semibold text-sm text-slate-900">{exam.title}</p><div className="flex items-center gap-2 mt-1 text-xs text-slate-400"><Clock className="w-3 h-3" />{exam.duration} min &bull; {exam.class?.name || ""}</div></div>
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
            <div className="max-h-96 overflow-y-auto rounded-lg border border-slate-200"><Table><TableHeader><TableRow className="bg-slate-50 hover:bg-slate-50"><TableHead className="text-xs font-semibold text-slate-600 uppercase">Exam</TableHead><TableHead className="text-xs font-semibold text-slate-600 uppercase text-right">Score</TableHead><TableHead className="text-xs font-semibold text-slate-600 uppercase text-center">Grade</TableHead></TableRow></TableHeader><TableBody>
              {results.map((r) => { const pct = r.total > 0 ? Math.round((r.score / r.total) * 100) : 0; return (<TableRow key={r.id} className="hover:bg-slate-50"><TableCell className="text-sm font-medium">{r.exam?.title || "—"}</TableCell><TableCell className="text-right font-semibold text-sm">{r.score}/{r.total}</TableCell><TableCell className="text-center"><Badge variant={pct >= 50 ? "default" : "destructive"} className={pct >= 50 ? "bg-emerald-100 text-emerald-700" : ""}>{pct}%</Badge></TableCell></TableRow>); })}
            </TableBody></Table></div>
          )}
        </CardContent></Card>
      )}
    </>
  );
}

// ─── Teacher View ──────────────────────────────────────────
function TeacherView({ exams, results, classes, subjects, openCreate, openEdit, deleteExam, setDeleteOpen, setDeletingExam }: {
  exams: OnlineExam[]; results: ExamResult[]; classes: { class_id: number; name: string }[];
  subjects: { subject_id: number; name: string }[];
  openCreate: () => void; openEdit: (exam: OnlineExam) => void;
  deleteExam: OnlineExam | null; setDeleteOpen: (v: boolean) => void;
  setDeletingExam: (e: OnlineExam | null) => void;
}) {
  const [tab, setTab] = useState<"exams" | "results">("exams");

  return (
    <Tabs value={tab} onValueChange={(v) => setTab(v as "exams" | "results")}>
      <TabsList>
        <TabsTrigger value="exams">My Exams ({exams.length})</TabsTrigger>
        <TabsTrigger value="results">Results ({results.length})</TabsTrigger>
      </TabsList>

      <TabsContent value="exams" className="mt-4">
        <Card className="gap-4"><CardContent className="pt-6">
          {exams.length === 0 ? <div className="text-center py-12"><Trophy className="w-12 h-12 text-slate-300 mx-auto mb-3" /><p className="text-slate-400 text-sm">No online exams created yet</p></div> : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {exams.map((exam) => (
                <div key={exam.id} className="flex items-center gap-4 p-4 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors">
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0"><Trophy className="w-6 h-6 text-emerald-600" /></div>
                  <div className="flex-1 min-w-0"><p className="font-semibold text-sm text-slate-900">{exam.title}</p><div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-400"><Clock className="w-3 h-3" />{exam.duration} min{exam.subject?.name ? <span>{exam.subject.name}</span> : null}{exam.class?.name ? <span>{exam.class.name}</span> : null}</div></div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className={exam.status === "published" ? "bg-emerald-100 text-emerald-700" : exam.status === "closed" ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-600"}>{exam.status || "draft"}</Badge>
                    <Button variant="ghost" size="sm" onClick={() => openEdit(exam)} className="min-w-[44px] min-h-[44px]"><Pencil className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="sm" onClick={() => { setDeletingExam(exam); setDeleteOpen(true); }} className="h-9 w-9 text-red-600"><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent></Card>
      </TabsContent>

      <TabsContent value="results" className="mt-4">
        <Card className="gap-4">
          <CardHeader><div className="flex items-center gap-2"><BarChart3 className="w-4 h-4 text-purple-500" /><CardTitle className="text-base font-semibold">Exam Results</CardTitle></div></CardHeader>
          <CardContent className="pt-0">
            {results.length === 0 ? <div className="text-center py-12"><BarChart3 className="w-12 h-12 text-slate-300 mx-auto mb-3" /><p className="text-slate-400 text-sm">No results available yet</p></div> : (
              <div className="max-h-96 overflow-y-auto rounded-lg border border-slate-200"><Table><TableHeader><TableRow className="bg-slate-50 hover:bg-slate-50"><TableHead className="text-xs font-semibold text-slate-600 uppercase">Student</TableHead><TableHead className="text-xs font-semibold text-slate-600 uppercase text-right">Score</TableHead><TableHead className="text-xs font-semibold text-slate-600 uppercase text-center">Percentage</TableHead></TableRow></TableHeader><TableBody>
                {results.map((r) => { const pct = r.total > 0 ? Math.round((r.score / r.total) * 100) : 0; return (<TableRow key={r.id} className="hover:bg-slate-50"><TableCell className="text-sm font-medium">{r.student?.name || "—"}</TableCell><TableCell className="text-right font-semibold text-sm">{r.score}/{r.total}</TableCell><TableCell className="text-center"><Badge variant={pct >= 50 ? "default" : "destructive"} className={pct >= 50 ? "bg-emerald-100 text-emerald-700" : ""}>{pct}%</Badge></TableCell></TableRow>); })}
              </TableBody></Table></div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
