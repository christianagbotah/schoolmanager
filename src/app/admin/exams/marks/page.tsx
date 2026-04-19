'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { useToast } from '@/hooks/use-toast'
import {
  GraduationCap, Save, Loader2, ArrowLeft, AlertCircle, Printer,
  BookOpen, BarChart3, Trophy, ShieldCheck, ShieldAlert,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Label } from '@/components/ui/label'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { toast } from 'sonner'

// ===== Types =====
interface Exam { exam_id: number; name: string; year: string; type: string; term: number; sem: number }
interface ClassItem { class_id: number; name: string; name_numeric: number; category: string }
interface Section { section_id: number; name: string }
interface Subject { subject_id: number; name: string }
interface GradeScale { grade_id: number; name: string; grade_from: number; grade_to: number; comment: string }

interface MarkRecord {
  student_id: number
  name: string
  student_code: string
  mark_id: number | null
  mark_obtained: number
  comment: string
  test1: number
  group_work: number
  test2: number
  project: number
  sub_total: number
  class_score: number
  term_exam: number
  exam_score: number
}

export default function ExamMarksPage() {
  return (
    <DashboardLayout>
      <ExamMarksModule />
    </DashboardLayout>
  )
}

function ExamMarksModule() {
  const { toast: uiToast } = useToast()
  const printRef = useRef<HTMLDivElement>(null)

  const [exams, setExams] = useState<Exam[]>([])
  const [classes, setClasses] = useState<ClassItem[]>([])
  const [sections, setSections] = useState<Section[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [students, setStudents] = useState<MarkRecord[]>([])
  const [grades, setGrades] = useState<GradeScale[]>([])
  const [loading, setLoading] = useState(true)
  const [marksLoading, setMarksLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const [selectedExam, setSelectedExam] = useState('')
  const [selectedClass, setSelectedClass] = useState('')
  const [selectedSection, setSelectedSection] = useState('')
  const [selectedSubject, setSelectedSubject] = useState('')

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [examsRes, classesRes, gradesRes] = await Promise.all([
        fetch('/api/admin/exams'), fetch('/api/classes'), fetch('/api/grades')
      ])
      const examsData = await examsRes.json()
      const classesData = await classesRes.json()
      const gradesData = await gradesRes.json()
      setExams(Array.isArray(examsData) ? examsData : (examsData.exams || []))
      setClasses(Array.isArray(classesData) ? classesData : [])
      setGrades(Array.isArray(gradesData) ? gradesData : (gradesData.grades || []))
    } catch { toast.error('Failed to fetch data') }
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  useEffect(() => {
    if (!selectedClass) { setSections([]); return }
    const loadSections = async () => {
      try {
        const res = await fetch(`/api/sections?class_id=${selectedClass}`)
        const data = await res.json()
        const secs = Array.isArray(data) ? data : (data.sections || [])
        setSections(secs)
        if (secs.length > 0) setSelectedSection(secs[0].section_id.toString())
        else setSelectedSection('')
      } catch { setSections([]) }
    }
    loadSections()
  }, [selectedClass])

  useEffect(() => {
    if (!selectedClass) { setSubjects([]); return }
    const loadSubjects = async () => {
      try {
        const res = await fetch(`/api/subjects?class_id=${selectedClass}`)
        const data = await res.json()
        setSubjects(Array.isArray(data) ? data : (data.subjects || []))
      } catch { setSubjects([]) }
    }
    loadSubjects()
  }, [selectedClass])

  const loadMarks = useCallback(async () => {
    if (!selectedExam || !selectedClass || !selectedSubject) return
    setMarksLoading(true)
    try {
      const params = new URLSearchParams({
        exam_id: selectedExam, class_id: selectedClass, subject_id: selectedSubject,
      })
      if (selectedSection) params.set('section_id', selectedSection)
      const res = await fetch(`/api/admin/exams/marks?${params}`)
      const data = await res.json()
      setStudents(data.students || [])
    } catch { toast.error('Failed to load marks') }
    setMarksLoading(false)
  }, [selectedExam, selectedClass, selectedSection, selectedSubject])

  useEffect(() => { if (selectedExam && selectedClass && selectedSubject) loadMarks() }, [selectedExam, selectedClass, selectedSection, selectedSubject, loadMarks])

  // CI3 calculation: update sub_total and derived fields
  const updateSubTotal = useCallback((studentId: number, field: string, value: number) => {
    setStudents(prev => prev.map(s => {
      if (s.student_id !== studentId) return s
      const u = { ...s, [field]: value }
      u.sub_total = u.test1 + u.group_work + u.test2 + u.project
      u.class_score = u.sub_total > 0 ? Number((u.sub_total * 50 / 60).toFixed(2)) : 0
      u.exam_score = u.term_exam > 0 ? Number((u.term_exam / 2).toFixed(2)) : 0
      u.mark_obtained = Number((u.class_score + u.exam_score).toFixed(2))
      return u
    }))
  }, [])

  // CI3 calculation: update exam_score and total when term_exam changes
  const updateExamScore = useCallback((studentId: number, value: number) => {
    setStudents(prev => prev.map(s => {
      if (s.student_id !== studentId) return s
      const u = { ...s, term_exam: value }
      u.exam_score = u.term_exam > 0 ? Number((u.term_exam / 2).toFixed(2)) : 0
      u.mark_obtained = Number((u.class_score + u.exam_score).toFixed(2))
      return u
    }))
  }, [])

  // CI3 parity validation before save
  const validateMarks = (): boolean => {
    for (const s of students) {
      if (s.class_score > 50) {
        toast.error(`${s.name}: Column A must not be greater than 50`)
        return false
      }
      if (s.project > 10 || s.group_work > 10) {
        toast.error(`${s.name}: Project/Group Work must not exceed 10`)
        return false
      }
      if (s.test1 > 20 || s.test2 > 20) {
        toast.error(`${s.name}: Class Test/Test 2 must not exceed 20`)
        return false
      }
      if (s.exam_score > 50) {
        toast.error(`${s.name}: Column B must not be greater than 50`)
        return false
      }
    }
    return true
  }

  const handleSave = async () => {
    if (!selectedExam || !selectedClass || !selectedSubject) return
    if (!validateMarks()) return

    setSaving(true)
    try {
      const records = students.map(s => ({
        student_id: s.student_id, subject_id: parseInt(selectedSubject), class_id: parseInt(selectedClass),
        section_id: selectedSection ? parseInt(selectedSection) : null, exam_id: parseInt(selectedExam),
        mark_obtained: s.mark_obtained || 0, comment: s.comment || '',
        test1: s.test1 || 0, group_work: s.group_work || 0, test2: s.test2 || 0, project: s.project || 0,
        sub_total: s.sub_total || 0, class_score: s.class_score || 0, term_exam: s.term_exam || 0, exam_score: s.exam_score || 0,
      }))
      const res = await fetch('/api/admin/exams/marks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ records }) })
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Failed') }
      toast.success(`Marks updated successfully for ${records.length} students`)
      loadMarks()
    } catch (err) { toast.error((err as Error).message) }
    setSaving(false)
  }

  const handlePrintMarksheet = () => {
    window.print()
  }

  const getGrade = (mark: number): { name: string; comment: string } | null => {
    if (mark <= 0) return null
    const grade = grades.find(g => mark >= g.grade_from && mark <= g.grade_to)
    return grade ? { name: grade.name, comment: grade.comment } : null
  }

  const getGradeColor = (name: string): string => {
    const n = name.toLowerCase()
    if (n.startsWith('a') || n.startsWith('1')) return 'bg-emerald-100 text-emerald-700'
    if (n.startsWith('b') || n.startsWith('2')) return 'bg-sky-100 text-sky-700'
    if (n.startsWith('c') || n.startsWith('3')) return 'bg-amber-100 text-amber-700'
    if (n.startsWith('d') || n.startsWith('4')) return 'bg-orange-100 text-orange-700'
    return 'bg-red-100 text-red-700'
  }

  const exam = exams.find(e => e.exam_id.toString() === selectedExam)
  const cls = classes.find(c => c.class_id.toString() === selectedClass)
  const sec = sections.find(s => s.section_id.toString() === selectedSection)
  const subj = subjects.find(s => s.subject_id.toString() === selectedSubject)

  const stats = {
    entered: students.filter(s => s.mark_obtained > 0).length,
    total: students.length,
    avg: students.length > 0 && students.some(s => s.mark_obtained > 0)
      ? (students.reduce((a, s) => a + s.mark_obtained, 0) / students.filter(s => s.mark_obtained > 0).length).toFixed(1)
      : '\u2014',
    highest: students.length > 0 ? Math.max(...students.map(s => s.mark_obtained)) : 0,
    lowest: students.some(s => s.mark_obtained > 0) ? Math.min(...students.filter(s => s.mark_obtained > 0).map(s => s.mark_obtained)) : 0,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button asChild variant="outline" size="icon" className="min-h-[44px] min-w-[44px] print:hidden">
            <Link href="/admin/exams"><ArrowLeft className="w-4 h-4" /></Link>
          </Button>
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Manage Exam Marks</h1>
            <p className="text-sm text-slate-500">Enter and manage student examination marks</p>
          </div>
        </div>
        <div className="flex items-center gap-2 print:hidden">
          {students.length > 0 && (
            <Button onClick={handlePrintMarksheet} variant="outline" className="min-h-[44px]">
              <Printer className="w-4 h-4 mr-2" />Print Marksheet
            </Button>
          )}
          <Button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700 min-h-[44px]" disabled={saving || students.length === 0}>
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}{saving ? 'Saving...' : 'Save Marks'}
          </Button>
        </div>
      </div>

      {/* CI3 Parity: Selector Row */}
      <Card className="border-slate-200/60 print:hidden">
        <CardContent className="p-4">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-600 uppercase">Exam</Label>
                <Select value={selectedExam} onValueChange={setSelectedExam}>
                  <SelectTrigger className="min-h-[44px] text-sm font-bold uppercase"><SelectValue placeholder="Select Exam" /></SelectTrigger>
                  <SelectContent>{exams.map(e => (<SelectItem key={e.exam_id} value={e.exam_id.toString()} className="font-bold uppercase text-sm">{e.name}</SelectItem>))}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-600 uppercase">Class</Label>
                <Select value={selectedClass} onValueChange={v => { setSelectedClass(v); setSelectedSubject('') }}>
                  <SelectTrigger className="min-h-[44px] text-sm font-bold uppercase"><SelectValue placeholder="Select Class" /></SelectTrigger>
                  <SelectContent>{classes.map(c => (<SelectItem key={c.class_id} value={c.class_id.toString()} className="font-bold uppercase text-sm">{c.name} {c.name_numeric}</SelectItem>))}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-600 uppercase">Section</Label>
                <Select value={selectedSection} onValueChange={setSelectedSection}>
                  <SelectTrigger className="min-h-[44px] text-sm font-bold uppercase">
                    <SelectValue placeholder={selectedClass ? (sections.length > 0 ? 'Select Section' : 'N/A') : 'Select Class First'} />
                  </SelectTrigger>
                  <SelectContent>{sections.map(s => (<SelectItem key={s.section_id} value={s.section_id.toString()} className="font-bold uppercase text-sm">{s.name}</SelectItem>))}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-600 uppercase">Subject</Label>
                <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                  <SelectTrigger className="min-h-[44px] text-sm font-bold uppercase">
                    <SelectValue placeholder={selectedClass ? (subjects.length > 0 ? 'Select Subject' : 'No subjects') : 'Select Class First'} />
                  </SelectTrigger>
                  <SelectContent>{subjects.map(s => (<SelectItem key={s.subject_id} value={s.subject_id.toString()} className="font-bold uppercase text-sm">{s.name}</SelectItem>))}</SelectContent>
                </Select>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* CI3 Info Banner */}
      {exam && cls && subj && (
        <Card className="border-emerald-200 bg-emerald-50/50 print:hidden">
          <CardContent className="p-4 text-center space-y-1">
            <h4 className="text-base font-semibold text-slate-800">
              Marks for <span className="text-emerald-700">{exam.name}</span>
            </h4>
            <p className="text-sm text-slate-600">
              {cls.name} {cls.name_numeric} | Section {sec?.name || '\u2014'} | Subject: {subj.name}
            </p>
            {exam.year && (
              <p className="text-xs text-slate-500">
                Academic Year: {exam.year} {exam.term ? `| Term: ${exam.term}` : ''} {exam.sem ? `| Semester: ${exam.sem}` : ''}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      {students.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 print:hidden">
          {[
            { label: 'Entered', value: stats.entered, icon: <ShieldCheck className="w-4 h-4" />, color: 'emerald' },
            { label: 'Total', value: stats.total, icon: <BarChart3 className="w-4 h-4" />, color: 'sky' },
            { label: 'Average', value: stats.avg, icon: <BarChart3 className="w-4 h-4" />, color: 'violet' },
            { label: 'Highest', value: stats.highest, icon: <Trophy className="w-4 h-4" />, color: 'amber' },
            { label: 'Lowest', value: stats.lowest, icon: <ShieldAlert className="w-4 h-4" />, color: 'red' },
          ].map(item => (
            <div key={item.label} className="rounded-xl border border-slate-200/60 border-l-4 border-l-${item.color}-500 bg-white p-3 flex items-center gap-3 hover:-translate-y-0.5 hover:shadow-md transition-all">
              <div className="w-8 h-8 rounded-lg bg-${item.color}-50 flex items-center justify-center text-${item.color}-600 flex-shrink-0">{item.icon}</div>
              <div className="min-w-0">
                <p className="text-lg font-bold text-slate-900 tabular-nums">{item.value}</p>
                <p className="text-[10px] font-semibold text-slate-400 uppercase">{item.label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Marks Table - CI3 Parity with detailed columns */}
      <div ref={printRef}>
        {selectedExam && selectedClass && selectedSubject && (
          <Card className="border-slate-200/60">
            <CardHeader className="pb-4 print:hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-lg">Marks Entry — {exam?.name}</CardTitle>
                  <CardDescription>{cls?.name} {cls?.name_numeric} · {subj?.name} · {students.length} students</CardDescription>
                </div>
              </div>
            </CardHeader>
            {/* Print header */}
            <div className="hidden print:block text-center mb-4 p-4">
              <h2 className="text-xl font-bold">EXAMINATION MARKSHEET</h2>
              <p className="text-sm font-semibold">{exam?.name} | {cls?.name} {cls?.name_numeric} | Section {sec?.name || '\u2014'} | {subj?.name}</p>
              {exam?.year && <p className="text-xs">Academic Year: {exam.year}</p>}
            </div>
            <CardContent>
              {marksLoading ? (
                <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}</div>
              ) : students.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 print:hidden">
                  <AlertCircle className="w-12 h-12 text-slate-300 mb-3" />
                  <h3 className="text-lg font-semibold text-slate-900 mb-1">No Students Found</h3>
                  <p className="text-sm text-slate-500">No enrolled students match the selected criteria</p>
                </div>
              ) : (
                <div className="max-h-[600px] overflow-x-auto overflow-y-auto rounded-lg border border-slate-200 custom-scrollbar">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-700 hover:to-slate-800">
                        <TableHead className="text-white text-center w-[40px] sticky left-0 bg-slate-700 z-10">#</TableHead>
                        <TableHead className="text-white text-center min-w-[70px] sticky left-[40px] bg-slate-700 z-10 hidden md:table-cell">ID</TableHead>
                        <TableHead className="text-white min-w-[160px] sticky left-[110px] bg-slate-700 z-10">Student Name</TableHead>
                        {/* CI3: TASKS header row */}
                        <TableHead className="text-white text-center min-w-[90px]" colSpan={4}>
                          <span className="text-[10px] tracking-widest text-emerald-300 font-bold">TASKS</span>
                        </TableHead>
                        {/* CI3: Calculated columns */}
                        <TableHead className="text-white text-center min-w-[70px] bg-slate-600">
                          <div className="flex flex-col items-center leading-tight">
                            <span className="text-[10px] text-slate-300">Sub Total</span>
                            <span className="text-[10px] text-amber-300">(60)</span>
                          </div>
                        </TableHead>
                        <TableHead className="text-white text-center min-w-[60px] bg-slate-600">
                          <div className="flex flex-col items-center leading-tight">
                            <span className="text-[10px] text-slate-300">50%</span>
                            <span className="text-[10px] text-amber-300">(A)</span>
                          </div>
                        </TableHead>
                        <TableHead className="text-white text-center min-w-[90px]">
                          <span className="text-[10px]">Term Exam</span>
                        </TableHead>
                        <TableHead className="text-white text-center min-w-[60px] bg-slate-600">
                          <div className="flex flex-col items-center leading-tight">
                            <span className="text-[10px] text-slate-300">50%</span>
                            <span className="text-[10px] text-amber-300">(B)</span>
                          </div>
                        </TableHead>
                        <TableHead className="text-white text-center min-w-[60px] bg-slate-500">
                          <div className="flex flex-col items-center leading-tight">
                            <span className="text-[10px] text-slate-200">Total</span>
                            <span className="text-[10px] text-amber-200">(A+B)</span>
                          </div>
                        </TableHead>
                        <TableHead className="text-white text-center min-w-[70px] bg-slate-500">Grade</TableHead>
                      </TableRow>
                      <TableRow className="bg-slate-600 hover:bg-slate-600">
                        <TableHead className="text-slate-300 bg-slate-600 sticky left-0 z-10" />
                        <TableHead className="text-slate-300 bg-slate-600 sticky left-[40px] z-10 hidden md:table-cell" />
                        <TableHead className="text-slate-300 bg-slate-600 sticky left-[110px] z-10" />
                        <TableHead className="text-white text-center bg-slate-600 text-xs">
                          <div className="flex flex-col"><span>Class Test</span><span className="text-emerald-300 text-[10px]">(20)</span></div>
                        </TableHead>
                        <TableHead className="text-white text-center bg-slate-600 text-xs">
                          <div className="flex flex-col"><span>Group Work</span><span className="text-emerald-300 text-[10px]">(10)</span></div>
                        </TableHead>
                        <TableHead className="text-white text-center bg-slate-600 text-xs">
                          <div className="flex flex-col"><span>Test 2</span><span className="text-emerald-300 text-[10px]">(20)</span></div>
                        </TableHead>
                        <TableHead className="text-white text-center bg-slate-600 text-xs">
                          <div className="flex flex-col"><span>Project</span><span className="text-emerald-300 text-[10px]">(10)</span></div>
                        </TableHead>
                        <TableHead className="bg-slate-500" colSpan={6} />
                        <TableHead className="bg-slate-500" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {students.map((student, idx) => {
                        const grade = getGrade(student.mark_obtained)
                        return (
                          <TableRow key={student.student_id} className="hover:bg-slate-50">
                            <TableCell className="text-center text-sm text-slate-500 sticky left-0 bg-white z-10">{idx + 1}</TableCell>
                            <TableCell className="text-center text-xs text-slate-400 font-mono whitespace-nowrap sticky left-[40px] bg-white z-10 hidden md:table-cell">{student.student_code}</TableCell>
                            <TableCell className="font-semibold text-slate-900 text-sm whitespace-nowrap sticky left-[110px] bg-white z-10">{student.name}</TableCell>
                            {/* CI3: Editable Task columns */}
                            <TableCell className="p-1">
                              <Input type="number" min="0" max="20" step="0.5" value={student.test1 || ''} onChange={e => updateSubTotal(student.student_id, 'test1', parseFloat(e.target.value) || 0)} className="h-9 text-center text-sm font-bold border-green-200 focus:border-emerald-500 min-w-[75px]" />
                            </TableCell>
                            <TableCell className="p-1">
                              <Input type="number" min="0" max="10" step="0.5" value={student.group_work || ''} onChange={e => updateSubTotal(student.student_id, 'group_work', parseFloat(e.target.value) || 0)} className="h-9 text-center text-sm font-bold border-green-200 focus:border-emerald-500 min-w-[75px]" />
                            </TableCell>
                            <TableCell className="p-1">
                              <Input type="number" min="0" max="20" step="0.5" value={student.test2 || ''} onChange={e => updateSubTotal(student.student_id, 'test2', parseFloat(e.target.value) || 0)} className="h-9 text-center text-sm font-bold border-green-200 focus:border-emerald-500 min-w-[75px]" />
                            </TableCell>
                            <TableCell className="p-1">
                              <Input type="number" min="0" max="10" step="0.5" value={student.project || ''} onChange={e => updateSubTotal(student.student_id, 'project', parseFloat(e.target.value) || 0)} className="h-9 text-center text-sm font-bold border-green-200 focus:border-emerald-500 min-w-[75px]" />
                            </TableCell>
                            {/* CI3: Calculated columns (read-only) */}
                            <TableCell className="p-1 bg-slate-50/80">
                              <Input type="text" value={student.sub_total || ''} readOnly className="h-9 text-center text-sm font-semibold bg-slate-100 border-slate-300 cursor-not-allowed min-w-[60px]" />
                            </TableCell>
                            <TableCell className="p-1 bg-slate-50/80">
                              <Input type="text" value={student.class_score || ''} readOnly className="h-9 text-center text-sm font-semibold bg-slate-100 border-slate-300 cursor-not-allowed min-w-[50px]" />
                            </TableCell>
                            <TableCell className="p-1">
                              <Input type="number" min="0" step="0.5" value={student.term_exam || ''} onChange={e => updateExamScore(student.student_id, parseFloat(e.target.value) || 0)} className="h-9 text-center text-sm font-bold border-blue-200 focus:border-blue-500 min-w-[80px]" />
                            </TableCell>
                            <TableCell className="p-1 bg-slate-50/80">
                              <Input type="text" value={student.exam_score || ''} readOnly className="h-9 text-center text-sm font-semibold bg-slate-100 border-slate-300 cursor-not-allowed min-w-[50px]" />
                            </TableCell>
                            <TableCell className="p-1 bg-slate-100">
                              <Input type="text" value={student.mark_obtained || ''} readOnly className="h-9 text-center text-sm font-bold text-lg bg-slate-200 border-slate-400 cursor-not-allowed min-w-[50px]" />
                            </TableCell>
                            <TableCell className="text-center bg-slate-50/80">
                              {grade ? (
                                <Badge variant="outline" className={`text-xs font-bold ${getGradeColor(grade.name)}`}>{grade.name}</Badge>
                              ) : <span className="text-xs text-slate-300">{'\u2014'}</span>}
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* CI3 Parity: Sticky Save Button */}
      {students.length > 0 && (
        <div className="flex justify-end sticky bottom-4 z-10 print:hidden">
          <Button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700 min-h-[48px] px-8 shadow-lg text-lg" disabled={saving}>
            {saving ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Saving...</> : <><Save className="w-5 h-5 mr-2" />SAVE CHANGES</>}
          </Button>
        </div>
      )}
    </div>
  )
}
