"use client";

import { useState, useEffect, useCallback } from "react";
import {
  AlertTriangle, Loader2, Plus, Trash2, Save, Clock,
  BookOpen, FileQuestion, GraduationCap, Target, CheckCircle, XCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useAuth } from "@/hooks/use-auth";

// ─── Types ───────────────────────────────────────────────────
interface ClassItem { class_id: number; name: string; sections: { section_id: number; name: string }[]; }
interface SubjectItem { subject_id: number; name: string; class_id?: number; }

interface Question {
  id: number;
  type: "mcq" | "true_false" | "fill_blank";
  question_text: string;
  marks: number;
  options: string[];
  correct_answer: string;
}

const emptyQuestion = (): Question => ({
  id: Date.now(),
  type: "mcq",
  question_text: "",
  marks: 1,
  options: ["", "", "", ""],
  correct_answer: "",
});

// ─── Main Component ──────────────────────────────────────────
export default function TeacherCreateOnlineExamPage() {
  const { isLoading: authLoading } = useAuth();
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [allSubjects, setAllSubjects] = useState<SubjectItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    title: "",
    class_id: "",
    subject_id: "",
    start_date: "",
    end_date: "",
    duration: "",
    minimum_percentage: "",
    instructions: "",
  });

  const [questions, setQuestions] = useState<Question[]>([emptyQuestion()]);

  // ─── Fetch teacher's classes and subjects ──────────────────
  const fetchData = useCallback(async () => {
    if (authLoading) return;
    setLoading(true);
    try {
      const [classRes, subjectRes] = await Promise.all([
        fetch("/api/teacher/classes"),
        fetch("/api/teacher/subjects"),
      ]);
      const classData = await classRes.json();
      const subjectData = await subjectRes.json();
      setClasses(classData || []);
      setAllSubjects(Array.isArray(subjectData) ? subjectData : []);
    } catch {
      toast.error("Failed to load data");
    }
    setLoading(false);
  }, [authLoading]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filteredSections = classes.find((c) => c.class_id === parseInt(form.class_id))?.sections || [];
  const filteredSubjects = form.class_id
    ? allSubjects.filter((s) => String(s.class_id) === form.class_id)
    : allSubjects;

  // ─── Question helpers ─────────────────────────────────────
  const updateQuestion = (index: number, field: keyof Question, value: string | number | string[]) => {
    setQuestions((prev) => {
      const updated = [...prev];
      (updated[index] as Record<string, unknown>)[field] = value;
      if (field === "type") {
        if (value === "true_false") {
          updated[index].options = ["True", "False"];
          updated[index].correct_answer = "";
        } else if (value === "fill_blank") {
          updated[index].options = [];
          updated[index].correct_answer = "";
        } else {
          updated[index].options = ["", "", "", ""];
          updated[index].correct_answer = "";
        }
      }
      return updated;
    });
  };

  const updateOption = (qIndex: number, oIndex: number, value: string) => {
    setQuestions((prev) => {
      const updated = [...prev];
      updated[qIndex].options[oIndex] = value;
      return updated;
    });
  };

  const addQuestion = () => setQuestions((prev) => [...prev, emptyQuestion()]);
  const removeQuestion = (index: number) => {
    if (questions.length <= 1) return;
    setQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  const totalMarks = questions.reduce((s, q) => s + q.marks, 0);

  // ─── Save ─────────────────────────────────────────────────
  const handleSave = async () => {
    if (!form.title.trim()) return toast.error("Exam title is required");
    if (!form.subject_id) return toast.error("Please select a subject");
    if (questions.length === 0) return toast.error("Add at least one question");

    setSaving(true);
    try {
      const res = await fetch("/api/teacher/online-exams/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          class_id: form.class_id ? parseInt(form.class_id) : null,
          subject_id: parseInt(form.subject_id),
          duration: parseInt(form.duration) || 0,
          minimum_percentage: parseFloat(form.minimum_percentage) || 0,
          questions: questions.filter((q) => q.question_text.trim()),
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast.success("Online exam created successfully");
      setForm({ title: "", class_id: "", subject_id: "", start_date: "", end_date: "", duration: "", minimum_percentage: "", instructions: "" });
      setQuestions([emptyQuestion()]);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to create exam");
    }
    setSaving(false);
  };

  // ─── Loading ──────────────────────────────────────────────
  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-[600px] rounded-xl" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* ─── Header ─────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Create Online Exam</h1>
            <p className="text-sm text-slate-500 mt-1">Set up a new computer-based examination for your subjects</p>
          </div>
          <Button onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 min-w-[44px] min-h-[44px]">
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save Exam
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ─── Left: Settings ───────────────────────────── */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="gap-4">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <BookOpen className="w-5 h-5 text-emerald-600" /> Exam Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-700">Exam Title *</Label>
                  <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Mid-Term Mathematics" className="h-9 text-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-700">Class</Label>
                  <Select value={form.class_id} onValueChange={(v) => { setForm({ ...form, class_id: v, subject_id: "" }); }}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select class" /></SelectTrigger>
                    <SelectContent className="max-h-60">
                      {classes.map((c) => (
                        <SelectItem key={c.class_id} value={String(c.class_id)}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-700">Subject *</Label>
                  <Select value={form.subject_id} onValueChange={(v) => setForm({ ...form, subject_id: v })}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select subject" /></SelectTrigger>
                    <SelectContent className="max-h-60">
                      {filteredSubjects.map((s) => (
                        <SelectItem key={s.subject_id} value={String(s.subject_id)}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card className="gap-4">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Clock className="w-5 h-5 text-amber-600" /> Schedule & Rules
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-slate-700">Start Date *</Label>
                    <Input type="datetime-local" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} className="h-9 text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-slate-700">End Date *</Label>
                    <Input type="datetime-local" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} className="h-9 text-sm" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-slate-700">Duration (mins)</Label>
                    <Input type="number" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} placeholder="60" className="h-9 text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-slate-700">Pass Mark (%)</Label>
                    <Input type="number" value={form.minimum_percentage} onChange={(e) => setForm({ ...form, minimum_percentage: e.target.value })} placeholder="50" className="h-9 text-sm" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-700">Instructions</Label>
                  <Textarea value={form.instructions} onChange={(e) => setForm({ ...form, instructions: e.target.value })} rows={3} placeholder="Exam instructions..." className="text-sm" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 border-0">
              <CardContent className="p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <GraduationCap className="w-5 h-5 mx-auto text-emerald-600 mb-1" />
                    <p className="text-lg font-bold text-slate-900">{questions.length}</p>
                    <p className="text-[10px] text-slate-500">Questions</p>
                  </div>
                  <div className="text-center">
                    <Target className="w-5 h-5 mx-auto text-amber-600 mb-1" />
                    <p className="text-lg font-bold text-slate-900">{totalMarks}</p>
                    <p className="text-[10px] text-slate-500">Total Marks</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ─── Right: Questions ──────────────────────────── */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <FileQuestion className="w-5 h-5 text-emerald-600" /> Questions ({questions.length})
              </h2>
              <Button onClick={addQuestion} variant="outline" size="sm" className="h-9 text-xs min-w-[44px] min-h-[44px]">
                <Plus className="w-3 h-3 mr-1" /> Add
              </Button>
            </div>

            {questions.map((q, qIndex) => (
              <Card key={q.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-sm">{qIndex + 1}</div>
                      <Select value={q.type} onValueChange={(v) => updateQuestion(qIndex, "type", v)}>
                        <SelectTrigger className="h-8 w-36 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="mcq">Multiple Choice</SelectItem>
                          <SelectItem value="true_false">True / False</SelectItem>
                          <SelectItem value="fill_blank">Fill in the Blank</SelectItem>
                        </SelectContent>
                      </Select>
                      <Badge variant="outline" className="text-[10px]">{q.marks} mark{q.marks !== 1 ? "s" : ""}</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input type="number" value={q.marks} onChange={(e) => updateQuestion(qIndex, "marks", parseInt(e.target.value) || 0)} className="h-8 w-16 text-xs text-center" />
                      <span className="text-[10px] text-slate-500">marks</span>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-500" onClick={() => removeQuestion(qIndex)} disabled={questions.length <= 1}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-slate-700">Question Text</Label>
                    <Textarea value={q.question_text} onChange={(e) => updateQuestion(qIndex, "question_text", e.target.value)} placeholder={q.type === "fill_blank" ? "Use ___ for blank. e.g. Capital of Ghana is ___" : "Type your question..."} rows={2} className="text-sm" />
                  </div>

                  {q.type === "mcq" && (
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-slate-700">Options (select correct)</Label>
                      {q.options.map((opt, oIndex) => (
                        <div key={oIndex} className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => updateQuestion(qIndex, "correct_answer", String.fromCharCode(65 + oIndex))}
                            className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-semibold transition-colors flex-shrink-0 ${
                              q.correct_answer === String.fromCharCode(65 + oIndex) ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-300 text-slate-400 hover:border-emerald-300"
                            }`}
                          >
                            {q.correct_answer === String.fromCharCode(65 + oIndex) ? <CheckCircle className="w-3 h-3" /> : String.fromCharCode(65 + oIndex)}
                          </button>
                          <Input value={opt} onChange={(e) => updateOption(qIndex, oIndex, e.target.value)} placeholder={`Option ${String.fromCharCode(65 + oIndex)}`} className="h-9 text-sm flex-1" />
                        </div>
                      ))}
                    </div>
                  )}

                  {q.type === "true_false" && (
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-slate-700">Correct Answer</Label>
                      <div className="flex gap-3">
                        {["True", "False"].map((ans) => (
                          <button
                            key={ans}
                            type="button"
                            onClick={() => updateQuestion(qIndex, "correct_answer", ans)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 text-sm font-medium transition-colors ${
                              q.correct_answer === ans ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-slate-200 text-slate-500 hover:border-slate-300"
                            }`}
                          >
                            {q.correct_answer === ans ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                            {ans}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {q.type === "fill_blank" && (
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-slate-700">Correct Answer</Label>
                      <Input value={q.correct_answer} onChange={(e) => updateQuestion(qIndex, "correct_answer", e.target.value)} placeholder="Type the correct answer" className="h-9 text-sm" />
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}

            <Button onClick={addQuestion} variant="outline" className="w-full h-12 border-dashed text-slate-500 hover:text-emerald-600 hover:border-emerald-300">
              <Plus className="w-4 h-4 mr-2" /> Add Another Question
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
