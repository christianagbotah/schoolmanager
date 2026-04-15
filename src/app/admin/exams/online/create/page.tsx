'use client';

import { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  Plus, Trash2, GripVertical, Clock, BookOpen, CheckCircle, XCircle,
  FileQuestion, ArrowLeft, Loader2, Save, GraduationCap, Target,
  AlertTriangle,
} from 'lucide-react';

interface ClassItem { class_id: number; name: string; }
interface SectionItem { section_id: number; name: string; class_id: number; }
interface SubjectItem { subject_id: number; name: string; class_id: number; }

interface Question {
  id: number;
  type: 'mcq' | 'true_false' | 'fill_blank';
  question_text: string;
  marks: number;
  options: string[];
  correct_answer: string;
}

const emptyQuestion = (): Question => ({
  id: Date.now(),
  type: 'mcq',
  question_text: '',
  marks: 1,
  options: ['', '', '', ''],
  correct_answer: '',
});

export default function CreateOnlineExamPage() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [sections, setSections] = useState<SectionItem[]>([]);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    title: '',
    class_id: '',
    section_id: '',
    subject_id: '',
    start_date: '',
    end_date: '',
    duration: '',
    minimum_percentage: '',
    instructions: '',
  });

  const [questions, setQuestions] = useState<Question[]>([emptyQuestion()]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [classRes, sectionRes, subjectRes] = await Promise.all([
        fetch('/api/classes'),
        fetch('/api/sections'),
        fetch('/api/subjects'),
      ]);
      const classData = await classRes.json();
      const sectionData = await sectionRes.json();
      const subjectData = await subjectRes.json();
      setClasses(Array.isArray(classData) ? classData : []);
      setSections(Array.isArray(sectionData) ? sectionData : []);
      setSubjects(Array.isArray(subjectData) ? subjectData : []);
    } catch {
      toast.error('Failed to load data');
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filteredSections = sections.filter(s => s.class_id === parseInt(form.class_id));
  const filteredSubjects = subjects.filter(s => s.class_id === parseInt(form.class_id));

  const updateQuestion = (index: number, field: keyof Question, value: string | number | string[]) => {
    setQuestions(prev => {
      const updated = [...prev];
      (updated[index] as Record<string, unknown>)[field] = value;
      if (field === 'type') {
        if (value === 'true_false') {
          updated[index].options = ['True', 'False'];
          updated[index].correct_answer = '';
        } else if (value === 'fill_blank') {
          updated[index].options = [];
          updated[index].correct_answer = '';
        } else {
          updated[index].options = ['', '', '', ''];
          updated[index].correct_answer = '';
        }
      }
      return updated;
    });
  };

  const updateOption = (qIndex: number, oIndex: number, value: string) => {
    setQuestions(prev => {
      const updated = [...prev];
      updated[qIndex].options[oIndex] = value;
      return updated;
    });
  };

  const addQuestion = () => setQuestions(prev => [...prev, emptyQuestion()]);
  const removeQuestion = (index: number) => {
    if (questions.length <= 1) return;
    setQuestions(prev => prev.filter((_, i) => i !== index));
  };

  const totalMarks = questions.reduce((s, q) => s + q.marks, 0);

  const handleSave = async () => {
    if (!form.title.trim()) return toast.error('Exam title is required');
    if (!form.subject_id) return toast.error('Please select a subject');
    if (!form.start_date || !form.end_date) return toast.error('Date range is required');
    if (questions.length === 0) return toast.error('Add at least one question');

    const validQuestions = questions.filter(q => q.question_text.trim());
    if (validQuestions.length === 0) return toast.error('All questions are empty');

    setSaving(true);
    try {
      const res = await fetch('/api/admin/exams/online/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          class_id: form.class_id ? parseInt(form.class_id) : null,
          section_id: form.section_id ? parseInt(form.section_id) : null,
          subject_id: parseInt(form.subject_id),
          duration: parseInt(form.duration) || 0,
          minimum_percentage: parseFloat(form.minimum_percentage) || 0,
          questions: validQuestions.map(q => ({
            ...q,
            options: q.options.filter(o => o.trim()),
          })),
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast.success('Online exam created successfully');
      setForm({ title: '', class_id: '', section_id: '', subject_id: '', start_date: '', end_date: '', duration: '', minimum_percentage: '', instructions: '' });
      setQuestions([emptyQuestion()]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create exam';
      toast.error(msg);
    }
    setSaving(false);
  };

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
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => window.history.back()} className="h-9 w-9 p-0">
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Create Online Exam</h1>
              <p className="text-sm text-slate-500 mt-1">Set up a new computer-based examination</p>
            </div>
          </div>
          <Button onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 min-h-[44px]">
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save Exam
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Exam Settings */}
          <div className="lg:col-span-1 space-y-6">
            {/* Basic Info */}
            <Card className="border-slate-200/60">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base"><BookOpen className="w-5 h-5 text-emerald-600" /> Exam Details</CardTitle>
                <CardDescription className="text-xs">Configure the exam basic information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-700">Exam Title *</Label>
                  <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Mid-Term Mathematics Exam" className="h-9 text-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-700">Class</Label>
                  <Select value={form.class_id} onValueChange={v => setForm({ ...form, class_id: v, section_id: '', subject_id: '' })}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select class" /></SelectTrigger>
                    <SelectContent className="max-h-60">{classes.map(c => <SelectItem key={c.class_id} value={c.class_id.toString()}>{c.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-700">Section</Label>
                  <Select value={form.section_id} onValueChange={v => setForm({ ...form, section_id: v })}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select section" /></SelectTrigger>
                    <SelectContent className="max-h-60">{filteredSections.map(s => <SelectItem key={s.section_id} value={s.section_id.toString()}>{s.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-700">Subject *</Label>
                  <Select value={form.subject_id} onValueChange={v => setForm({ ...form, subject_id: v })}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select subject" /></SelectTrigger>
                    <SelectContent className="max-h-60">{filteredSubjects.map(s => <SelectItem key={s.subject_id} value={s.subject_id.toString()}>{s.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Schedule */}
            <Card className="border-slate-200/60">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base"><Clock className="w-5 h-5 text-amber-600" /> Schedule & Rules</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-slate-700">Start Date *</Label>
                    <Input type="datetime-local" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} className="h-9 text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-slate-700">End Date *</Label>
                    <Input type="datetime-local" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} className="h-9 text-sm" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-slate-700">Duration (mins)</Label>
                    <Input type="number" value={form.duration} onChange={e => setForm({ ...form, duration: e.target.value })} placeholder="60" className="h-9 text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-slate-700">Pass Mark (%)</Label>
                    <Input type="number" value={form.minimum_percentage} onChange={e => setForm({ ...form, minimum_percentage: e.target.value })} placeholder="50" className="h-9 text-sm" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-700">Instructions</Label>
                  <Textarea value={form.instructions} onChange={e => setForm({ ...form, instructions: e.target.value })} rows={3} placeholder="Exam instructions for students..." className="text-sm" />
                </div>
              </CardContent>
            </Card>

            {/* Summary */}
            <Card className="border-slate-200/60 bg-gradient-to-br from-emerald-50 to-teal-50">
              <CardContent className="p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center"><GraduationCap className="w-5 h-5 mx-auto text-emerald-600 mb-1" /><p className="text-lg font-bold text-slate-900">{questions.length}</p><p className="text-[10px] text-slate-500">Questions</p></div>
                  <div className="text-center"><Target className="w-5 h-5 mx-auto text-amber-600 mb-1" /><p className="text-lg font-bold text-slate-900">{totalMarks}</p><p className="text-[10px] text-slate-500">Total Marks</p></div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right: Questions */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <FileQuestion className="w-5 h-5 text-emerald-600" /> Questions ({questions.length})
              </h2>
              <Button onClick={addQuestion} variant="outline" size="sm" className="h-9 text-xs">
                <Plus className="w-3 h-3 mr-1" /> Add Question
              </Button>
            </div>

            {questions.map((q, qIndex) => (
              <Card key={q.id} className="border-slate-200/60 hover:shadow-sm transition-shadow">
                <CardContent className="p-4 space-y-4">
                  {/* Question Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-sm">{qIndex + 1}</div>
                      <Select value={q.type} onValueChange={v => updateQuestion(qIndex, 'type', v)}>
                        <SelectTrigger className="h-8 w-36 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="mcq">Multiple Choice</SelectItem>
                          <SelectItem value="true_false">True / False</SelectItem>
                          <SelectItem value="fill_blank">Fill in the Blank</SelectItem>
                        </SelectContent>
                      </Select>
                      <Badge variant="outline" className="text-[10px]">{q.marks} mark{q.marks !== 1 ? 's' : ''}</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input type="number" value={q.marks} onChange={e => updateQuestion(qIndex, 'marks', parseInt(e.target.value) || 0)} className="h-8 w-16 text-xs text-center" />
                      <span className="text-[10px] text-slate-500">marks</span>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-500" onClick={() => removeQuestion(qIndex)} disabled={questions.length <= 1}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>

                  {/* Question Text */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-slate-700">Question Text</Label>
                    <Textarea
                      value={q.question_text}
                      onChange={e => updateQuestion(qIndex, 'question_text', e.target.value)}
                      placeholder={q.type === 'fill_blank' ? 'Use ___ for the blank. e.g. The capital of Ghana is ___' : 'Type your question here...'}
                      rows={2}
                      className="text-sm"
                    />
                  </div>

                  {/* Options */}
                  {q.type === 'mcq' && (
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-slate-700">Options (select correct answer)</Label>
                      {q.options.map((opt, oIndex) => (
                        <div key={oIndex} className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => updateQuestion(qIndex, 'correct_answer', String.fromCharCode(65 + oIndex))}
                            className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-semibold transition-colors flex-shrink-0 ${q.correct_answer === String.fromCharCode(65 + oIndex) ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-300 text-slate-400 hover:border-emerald-300'}`}
                          >
                            {q.correct_answer === String.fromCharCode(65 + oIndex) ? <CheckCircle className="w-3 h-3" /> : String.fromCharCode(65 + oIndex)}
                          </button>
                          <Input
                            value={opt}
                            onChange={e => updateOption(qIndex, oIndex, e.target.value)}
                            placeholder={`Option ${String.fromCharCode(65 + oIndex)}`}
                            className="h-9 text-sm flex-1"
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* True / False */}
                  {q.type === 'true_false' && (
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-slate-700">Correct Answer</Label>
                      <div className="flex gap-3">
                        {['True', 'False'].map(ans => (
                          <button
                            key={ans}
                            onClick={() => updateQuestion(qIndex, 'correct_answer', ans)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 text-sm font-medium transition-colors ${q.correct_answer === ans ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}
                          >
                            {q.correct_answer === ans ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                            {ans}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Fill in blank */}
                  {q.type === 'fill_blank' && (
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-slate-700">Correct Answer</Label>
                      <Input
                        value={q.correct_answer}
                        onChange={e => updateQuestion(qIndex, 'correct_answer', e.target.value)}
                        placeholder="Type the correct answer"
                        className="h-9 text-sm"
                      />
                    </div>
                  )}

                  {!q.question_text.trim() && (
                    <div className="flex items-center gap-1 text-xs text-amber-600"><AlertTriangle className="w-3 h-3" /> Question text is empty</div>
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
