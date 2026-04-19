'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import {
  GraduationCap, Save, Loader2, ArrowLeft, AlertCircle, CheckCircle2,
  BookOpen, FileText, Users, BarChart3, Printer, Trophy,
  ShieldCheck, ShieldAlert,
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

// ===== Types =====
interface Exam {
  exam_id: number
  name: string
  type: string
  date: string | null
  class_id: number | null
  year: string
  term: number
  sem: number
}

interface Subject {
  subject_id: number
  name: string
  class_id: number | null
}

interface GradeScale {
  grade_id: number
  name: string
  grade_from: number
  grade_to: number
  comment: string
}

interface ClassItem {
  class_id: number
  name: string
  name_numeric: number
  category: string
}

interface Section {
  section_id: number
  name: string
}

// CI3 detailed mark record
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

function MarksSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3"><Skeleton className="w-11 h-11 rounded-lg" /><div className="space-y-2"><Skeleton className="h-6 w-48" /><Skeleton className="h-4 w-60" /></div></div>
        <div className="flex gap-2"><Skeleton className="h-11 w-24 rounded-lg" /><Skeleton className="h-11 w-32 rounded-lg" /></div>
      </div>
      <Skeleton className="h-24 w-full rounded-xl" />
      <div className="grid grid-cols-3 gap-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-[88px] rounded-xl" />)}</div>
      <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}</div>
    </div>
  )
}

export default function MarkEntryPage() {
  return (
    <DashboardLayout>
      <MarkEntryModule />
    </DashboardLayout>
  )
}

function MarkEntryModule() {
  const printRef = useRef<HTMLDivElement>(null)

  const [exams, setExams] = useState<Exam[]>([])
  const [classes, setClasses] = useState<ClassItem[]>([])
  const [sections, setSections] = useState<Section[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [students, setStudents] = useState<MarkRecord[]>([])
  const [grades, setGrades] = useState<GradeScale[]>([])

  const [selectedExamId, setSelectedExamId] = useState('')
  const [selectedClassId, setSelectedClassId] = useState('')
  const [selectedSectionId, setSelectedSectionId] = useState('')
  const [selectedSubjectId, setSelectedSubjectId] = useState('')

  const [saving, setSaving] = useState(false)
  const [studentsLoading, setStudentsLoading] = useState(false)
  const [subjectsLoading, setSubjectsLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)

  // Fetch exams, classes, grades on mount
  useEffect(() => {
    Promise.all([
      fetch('/api/admin/exams').then(r => r.json()),
      fetch('/api/classes').then(r => r.json()),
      fetch('/api/grades').then(r => r.json()),
    ]).then(([examsData, classesData, gradesData]) => {
      const examsList = Array.isArray(examsData) ? examsData : (examsData.exams || [])
      setExams(examsList)
      setClasses(Array.isArray(classesData) ? classesData : [])
      const gList = Array.isArray(gradesData) ? gradesData : (gradesData.grades || [])
      setGrades(gList.sort((a: GradeScale, b: GradeScale) => b.grade_from - a.grade_from))
    }).catch(() => {}).finally(() => setInitialLoading(false))
  }, [])

  // When class changes, fetch sections and subjects
  useEffect(() => {
    if (!selectedClassId) { setSections([]); setSubjects([]); setSelectedSectionId(''); return }
    setSubjectsLoading(true)
    Promise.all([
      fetch(`/api/sections?class_id=${selectedClassId}`).then(r => r.json()),
      fetch(`/api/subjects?class_id=${selectedClassId}`).then(r => r.json()),
    ]).then(([sectionsData, subjectsData]) => {
      const secs = Array.isArray(sectionsData) ? sectionsData : []
      setSections(secs)
      if (secs.length > 0) setSelectedSectionId(secs[0].section_id.toString())
      else setSelectedSectionId('')
      setSubjects(Array.isArray(subjectsData) ? subjectsData : [])
      setSelectedSubjectId('')
    }).catch(() => { setSections([]); setSubjects([]) }).finally(() => setSubjectsLoading(false))
  }, [selectedClassId])

  // Load marks when all selectors filled
  const loadMarks = useCallback(async () => {
    if (!selectedExamId || !selectedClassId || !selectedSubjectId) { setStudents([]); return }
    setStudentsLoading(true)
    try {
      const params = new URLSearchParams({
        exam_id: selectedExamId, class_id: selectedClassId, subject_id: selectedSubjectId,
      })
      if (selectedSectionId) params.set('section_id', selectedSectionId)
      const res = await fetch(`/api/admin/exams/marks?${params.toString()}`)
      const data = await res.json()
      setStudents(data.students || [])
    } catch { toast.error('Failed to load marks') }
    setStudentsLoading(false)
  }, [selectedExamId, selectedClassId, selectedSectionId, selectedSubjectId])

  useEffect(() => { loadMarks() }, [loadMarks])

  // CI3 mark calculation: update sub_total and derived fields
  const updateSubTotal = useCallback((studentId: number, field: string, value: number) => {
    setStudents(prev => prev.map(s => {
      if (s.student_id !== studentId) return s
      const updated = { ...s, [field]: value }
      updated.sub_total = updated.test1 + updated.group_work + updated.test2 + updated.project
      updated.class_score = updated.sub_total > 0 ? Number((updated.sub_total * 50 / 60).toFixed(2)) : 0
      updated.exam_score = updated.term_exam > 0 ? Number((updated.term_exam / 2).toFixed(2)) : 0
      updated.mark_obtained = Number((updated.class_score + updated.exam_score).toFixed(2))
      return updated
    }))
  }, [])

  // CI3 mark calculation: update exam_score and total when term_exam changes
  const updateExamScore = useCallback((studentId: number, value: number) => {
    setStudents(prev => prev.map(s => {
      if (s.student_id !== studentId) return s
      const updated = { ...s, term_exam: value }
      updated.exam_score = updated.term_exam > 0 ? Number((updated.term_exam / 2).toFixed(2)) : 0
      updated.mark_obtained = Number((updated.class_score + updated.exam_score).toFixed(2))
      return updated
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
    if (!selectedExamId || !selectedSubjectId || !selectedClassId) {
      toast.error('Please select exam, class, and subject'); return
    }
    if (!validateMarks()) return

    setSaving(true)
    try {
      const records = students.map(s => ({
        student_id: s.student_id,
        subject_id: parseInt(selectedSubjectId),
        class_id: parseInt(selectedClassId),
        section_id: selectedSectionId ? parseInt(selectedSectionId) : null,
        exam_id: parseInt(selectedExamId),
        mark_obtained: s.mark_obtained || 0,
        comment: s.comment || '',
        test1: s.test1 || 0,
        group_work: s.group_work || 0,
        test2: s.test2 || 0,
        project: s.project || 0,
        sub_total: s.sub_total || 0,
        class_score: s.class_score || 0,
        term_exam: s.term_exam || 0,
        exam_score: s.exam_score || 0,
      }))
      const res = await fetch('/api/admin/exams/marks', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ records }),
      })
      if (!res.ok) throw new Error('Failed to save marks')
      const result = await res.json()
      toast.success(`Marks updated successfully for ${result.count || records.length} students`)
      loadMarks()
    } catch (err) {
      toast.error((err as Error).message || 'Failed to save marks')
    }
    setSaving(false)
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

  const stats = useMemo(() => {
    const entered = students.filter(s => s.mark_obtained > 0).length
    const avg = students.length > 0 && entered > 0
      ? (students.reduce((a, s) => a + s.mark_obtained, 0) / entered).toFixed(1)
      : '\u2014'
    const highest = students.length > 0 ? Math.max(...students.map(s => s.mark_obtained)) : 0
    const lowest = students.filter(s => s.mark_obtained > 0).length > 0
      ? Math.min(...students.filter(s => s.mark_obtained > 0).map(s => s.mark_obtained))
      : 0
    return { entered, total: students.length, avg, highest, lowest }
  }, [students])

  const selectedExam = exams.find(e => e.exam_id.toString() === selectedExamId)
  const selectedClass = classes.find(c => c.class_id.toString() === selectedClassId)
  const selectedSubject = subjects.find(s => s.subject_id.toString() === selectedSubjectId)
  const selectedSection = sections.find(s => s.section_id.toString() === selectedSectionId)

  const canSave = selectedExamId && selectedSubjectId && selectedClassId && students.length > 0

  if (initialLoading) return <MarksSkeleton />

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100">
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
          <Button asChild variant="outline" className="min-h-[44px]" size="sm">
            <Link href="/admin/grades"><FileText className="w-4 h-4 mr-2" />Grades</Link>
          </Button>
          {students.length > 0 && (
            <Button onClick={() => window.print()} variant="outline" className="min-h-[44px]" size="sm">
              <Printer className="w-4 h-4 mr-2" />Print
            </Button>
          )}
          <Button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700 min-h-[44px]" disabled={!canSave || saving}>
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            {saving ? 'Saving...' : 'Save Marks'}
          </Button>
        </div>
      </div>

      {/* CI3 Parity: Selector Row */}
      <Card className="border-slate-200/60 print:hidden">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600 uppercase">Exam</Label>
              <Select value={selectedExamId} onValueChange={setSelectedExamId}>
                <SelectTrigger className="min-h-[52px] text-lg font-bold uppercase bg-slate-50 border-slate-200 focus:bg-white">
                  <SelectValue placeholder="Select Exam" />
                </SelectTrigger>
                <SelectContent>
                  {exams.map(e => (<SelectItem key={e.exam_id} value={e.exam_id.toString()} className="font-bold uppercase">{e.name}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600 uppercase">Class</Label>
              <Select value={selectedClassId} onValueChange={v => { setSelectedClassId(v); setSelectedSubjectId('') }}>
                <SelectTrigger className="min-h-[52px] text-lg font-bold uppercase bg-slate-50 border-slate-200 focus:bg-white">
                  <SelectValue placeholder="Select Class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map(c => (<SelectItem key={c.class_id} value={c.class_id.toString()} className="font-bold uppercase">{c.name} {c.name_numeric}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600 uppercase">Section</Label>
              <Select value={selectedSectionId} onValueChange={setSelectedSectionId}>
                <SelectTrigger className="min-h-[52px] text-lg font-bold uppercase bg-slate-50 border-slate-200 focus:bg-white">
                  <SelectValue placeholder={selectedClassId ? 'Select Section' : 'Select Class First'} />
                </SelectTrigger>
                <SelectContent>
                  {sections.map(s => (<SelectItem key={s.section_id} value={s.section_id.toString()} className="font-bold uppercase">{s.name}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600 uppercase">Subject</Label>
              <Select value={selectedSubjectId} onValueChange={setSelectedSubjectId} disabled={subjectsLoading}>
                <SelectTrigger className="min-h-[52px] text-lg font-bold uppercase bg-slate-50 border-slate-200 focus:bg-white">
                  <SelectValue placeholder={selectedClassId ? 'Select Subject' : 'Select Class First'} />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map(s => (<SelectItem key={s.subject_id} value={s.subject_id.toString()} className="font-bold uppercase">{s.name}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CI3 Info Banner */}
      {(selectedExam || selectedClass || selectedSubject) && (
        <Card className="border-emerald-200 bg-emerald-50/50 print:hidden">
          <CardContent className="p-4 text-center space-y-1">
            <h4 className="text-lg font-semibold text-slate-800">
              Marks for <span className="text-emerald-700">{selectedExam?.name || '\u2014'}</span>
            </h4>
            <p className="text-sm text-slate-600">
              {selectedClass ? `${selectedClass.name} ${selectedClass.name_numeric}` : ''} | Section {selectedSection?.name || '\u2014'} | Subject: {selectedSubject?.name || 'No subject'}
            </p>
            {selectedExam?.year && (
              <p className="text-xs text-slate-500">
                Academic Year: {selectedExam.year} {selectedExam.term ? `| Term: ${selectedExam.term}` : ''} {selectedExam.sem ? `| Semester: ${selectedExam.sem}` : ''}
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
            { label: 'Total', value: stats.total, icon: <Users className="w-4 h-4" />, color: 'sky' },
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

      {/* CI3 Parity: Detailed Mark Entry Table */}
      <div ref={printRef}>
        <Card className="border-slate-200/60">
          <CardHeader className="pb-4 print:hidden">
            <CardTitle className="text-lg">Student Marks</CardTitle>
            <CardDescription>{selectedExamId && selectedSubjectId ? `${selectedExam?.name || ''} \u2014 ${selectedSubject?.name || ''}` : 'Select exam, class, section, and subject'}</CardDescription>
          </CardHeader>
          {/* Print header */}
          <div className="hidden print:block text-center mb-4 p-4">
            <h2 className="text-xl font-bold">EXAMINATION MARKSHEET</h2>
            <p className="text-sm font-semibold">{selectedExam?.name} | {selectedClass?.name} {selectedClass?.name_numeric} | Section {selectedSection?.name || '\u2014'} | {selectedSubject?.name}</p>
            {selectedExam?.year && <p className="text-xs">Academic Year: {selectedExam.year}</p>}
          </div>
          <CardContent>
            {studentsLoading ? (
              <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}</div>
            ) : !selectedClassId ? (
              <div className="flex flex-col items-center justify-center py-16 print:hidden">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4"><BookOpen className="w-7 h-7 text-slate-300" /></div>
                <p className="text-sm text-slate-500 font-medium">Select a class to load students</p>
              </div>
            ) : students.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 print:hidden">
                <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center mb-4"><AlertCircle className="w-7 h-7 text-amber-400" /></div>
                <p className="text-sm text-amber-700 font-medium">No students enrolled</p>
                <p className="text-xs text-amber-600 mt-1">Enroll students before entering marks</p>
              </div>
            ) : !selectedSubjectId ? (
              <div className="flex flex-col items-center justify-center py-16 print:hidden">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4"><GraduationCap className="w-7 h-7 text-slate-300" /></div>
                <p className="text-sm text-slate-500 font-medium">Select a subject to enter marks</p>
              </div>
            ) : (
              <div className="max-h-[600px] overflow-y-auto rounded-lg border border-slate-200 custom-scrollbar">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-700 hover:to-slate-800">
                      <TableHead className="text-white text-center w-[40px] sticky left-0 bg-slate-700 z-10">#</TableHead>
                      <TableHead className="text-white text-center min-w-[60px] sticky left-[40px] bg-slate-700 z-10 hidden md:table-cell">ID</TableHead>
                      <TableHead className="text-white min-w-[160px] sticky left-[100px] bg-slate-700 z-10 md:sticky md:left-[100px]">Name</TableHead>
                      {/* TASKS header */}
                      <TableHead className="text-white text-center min-w-[90px]" colSpan={4}>
                        <span className="text-[10px] tracking-widest text-emerald-300 font-bold">TASKS</span>
                      </TableHead>
                      {/* Calculated */}
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
                      <TableHead className="text-slate-300 bg-slate-600 sticky left-[100px] z-10 md:sticky md:left-[100px]" />
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
                          <TableCell className="text-center text-xs text-slate-500 font-mono whitespace-nowrap sticky left-[40px] bg-white z-10 hidden md:table-cell">{student.student_code}</TableCell>
                          <TableCell className="font-semibold text-slate-900 text-sm whitespace-nowrap sticky left-[100px] bg-white z-10 md:sticky md:left-[100px]">{student.name}</TableCell>
                          {/* CI3: Editable Task columns */}
                          <TableCell className="p-1">
                            <Input type="number" min="0" max="20" step="0.5" value={student.test1 || ''} onChange={e => updateSubTotal(student.student_id, 'test1', parseFloat(e.target.value) || 0)} className="h-10 text-center font-bold text-sm border-green-200 focus:border-emerald-500 min-w-[70px]" />
                          </TableCell>
                          <TableCell className="p-1">
                            <Input type="number" min="0" max="10" step="0.5" value={student.group_work || ''} onChange={e => updateSubTotal(student.student_id, 'group_work', parseFloat(e.target.value) || 0)} className="h-10 text-center font-bold text-sm border-green-200 focus:border-emerald-500 min-w-[70px]" />
                          </TableCell>
                          <TableCell className="p-1">
                            <Input type="number" min="0" max="20" step="0.5" value={student.test2 || ''} onChange={e => updateSubTotal(student.student_id, 'test2', parseFloat(e.target.value) || 0)} className="h-10 text-center font-bold text-sm border-green-200 focus:border-emerald-500 min-w-[70px]" />
                          </TableCell>
                          <TableCell className="p-1">
                            <Input type="number" min="0" max="10" step="0.5" value={student.project || ''} onChange={e => updateSubTotal(student.student_id, 'project', parseFloat(e.target.value) || 0)} className="h-10 text-center font-bold text-sm border-green-200 focus:border-emerald-500 min-w-[70px]" />
                          </TableCell>
                          {/* CI3: Calculated columns (read-only) */}
                          <TableCell className="p-1 bg-slate-50">
                            <Input type="text" value={student.sub_total || ''} readOnly className="h-10 text-center font-semibold text-sm bg-slate-100 border-slate-300 cursor-not-allowed min-w-[60px]" />
                          </TableCell>
                          <TableCell className="p-1 bg-slate-50">
                            <Input type="text" value={student.class_score || ''} readOnly className="h-10 text-center font-semibold text-sm bg-slate-100 border-slate-300 cursor-not-allowed min-w-[50px]" />
                          </TableCell>
                          {/* CI3: Term Exam (editable) */}
                          <TableCell className="p-1">
                            <Input type="number" min="0" step="0.5" value={student.term_exam || ''} onChange={e => updateExamScore(student.student_id, parseFloat(e.target.value) || 0)} className="h-10 text-center font-bold text-sm border-blue-200 focus:border-blue-500 min-w-[80px]" />
                          </TableCell>
                          <TableCell className="p-1 bg-slate-50">
                            <Input type="text" value={student.exam_score || ''} readOnly className="h-10 text-center font-semibold text-sm bg-slate-100 border-slate-300 cursor-not-allowed min-w-[50px]" />
                          </TableCell>
                          {/* CI3: Total (read-only) */}
                          <TableCell className="p-1 bg-slate-100">
                            <Input type="text" value={student.mark_obtained || ''} readOnly className="h-10 text-center font-bold text-lg bg-slate-200 border-slate-400 cursor-not-allowed min-w-[50px]" />
                          </TableCell>
                          <TableCell className="text-center bg-slate-50">
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
      </div>

      {/* CI3 Parity: Sticky Save Button */}
      {canSave && (
        <div className="flex justify-end sticky bottom-4 z-10 print:hidden">
          <Button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700 min-h-[48px] px-8 shadow-lg text-lg" disabled={saving}>
            {saving ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Saving...</> : <><Save className="w-5 h-5 mr-2" />SAVE CHANGES</>}
          </Button>
        </div>
      )}
    </div>
  )
}
