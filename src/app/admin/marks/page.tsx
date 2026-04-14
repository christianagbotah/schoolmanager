'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useToast } from '@/hooks/use-toast'
import {
  GraduationCap, Save, Loader2, ArrowLeft, AlertCircle, CheckCircle2,
  BookOpen, FileText,
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
import { DashboardLayout } from '@/components/layout/dashboard-layout'

// ===== Types =====
interface Student {
  student_id: number
  student_code: string
  name: string
  first_name: string
  last_name: string
  sex: string
  active_status: number
}

interface Exam {
  exam_id: number
  name: string
  type: string
  date: string | null
  class_id: number | null
  year: string
}

interface Subject {
  subject_id: number
  name: string
  class_id: number | null
  teacher_id: number | null
}

interface MarkRecord {
  mark_id: number
  student_id: number
  subject_id: number
  class_id: number | null
  section_id: number | null
  exam_id: number | null
  mark_obtained: number
  comment: string
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
  category: string
  section_id: number | null
}

interface Section {
  section_id: number
  name: string
}

// ===== Main =====
export default function MarkEntryPage() {
  return (
    <DashboardLayout>
      <MarkEntryModule />
    </DashboardLayout>
  )
}

function MarkEntryModule() {
  const { toast } = useToast()

  // Dropdown data
  const [exams, setExams] = useState<Exam[]>([])
  const [classes, setClasses] = useState<ClassItem[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [grades, setGrades] = useState<GradeScale[]>([])

  // Selections
  const [selectedExamId, setSelectedExamId] = useState('')
  const [selectedClassId, setSelectedClassId] = useState('')
  const [selectedSubjectId, setSelectedSubjectId] = useState('')

  // Marks
  const [marksMap, setMarksMap] = useState<Record<number, string>>({})
  const [existingMarks, setExistingMarks] = useState<MarkRecord[]>([])

  // State
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [studentsLoading, setStudentsLoading] = useState(false)

  // Fetch exams, classes, grades on mount
  useEffect(() => {
    Promise.all([
      fetch('/api/exams').then(r => r.json()),
      fetch('/api/classes').then(r => r.json()),
      fetch('/api/grades').then(r => r.json()),
    ]).then(([examsData, classesData, gradesData]) => {
      setExams(Array.isArray(examsData) ? examsData : (examsData.exams || []))
      setClasses(Array.isArray(classesData) ? classesData : [])
      setGrades(Array.isArray(gradesData) ? gradesData : (gradesData.grades || []))
    }).catch(() => {})
  }, [])

  // When class changes, fetch subjects and students
  useEffect(() => {
    if (!selectedClassId) {
      setSubjects([])
      setStudents([])
      return
    }

    setStudentsLoading(true)
    Promise.all([
      fetch(`/api/subjects?class_id=${selectedClassId}`).then(r => r.json()),
      fetch(`/api/students?class_id=${selectedClassId}`).then(r => r.json()),
    ]).then(([subjectsData, studentsData]) => {
      setSubjects(Array.isArray(subjectsData) ? subjectsData : [])
      setStudents(Array.isArray(studentsData) ? studentsData : [])
      setMarksMap({})
      setExistingMarks([])
    }).catch(() => {
      setSubjects([])
      setStudents([])
    }).finally(() => setStudentsLoading(false))
  }, [selectedClassId])

  // When exam + subject selected, fetch existing marks
  useEffect(() => {
    if (!selectedExamId || !selectedSubjectId) {
      setExistingMarks([])
      setMarksMap({})
      return
    }

    setLoading(true)
    const params = new URLSearchParams({
      exam_id: selectedExamId,
      subject_id: selectedSubjectId,
      class_id: selectedClassId,
    })
    fetch(`/api/marks?${params.toString()}`)
      .then(r => r.json())
      .then(data => {
        const records: MarkRecord[] = Array.isArray(data) ? data : (data.marks || [])
        setExistingMarks(records)
        const map: Record<number, string> = {}
        records.forEach(r => { map[r.student_id] = r.mark_obtained.toString() })
        setMarksMap(map)
      })
      .catch(() => setExistingMarks([]))
      .finally(() => setLoading(false))
  }, [selectedExamId, selectedSubjectId, selectedClassId])

  const handleSave = async () => {
    if (!selectedExamId || !selectedSubjectId) {
      toast({ title: 'Error', description: 'Please select exam and subject', variant: 'destructive' })
      return
    }

    setSaving(true)
    try {
      const records = students.map(s => ({
        student_id: s.student_id,
        subject_id: parseInt(selectedSubjectId),
        class_id: parseInt(selectedClassId),
        exam_id: parseInt(selectedExamId),
        mark_obtained: parseFloat(marksMap[s.student_id]) || 0,
        comment: '',
      }))

      const res = await fetch('/api/marks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ records }),
      })

      if (!res.ok) throw new Error('Failed to save marks')
      const result = await res.json()
      toast({ title: 'Saved', description: `Marks saved for ${result.count || records.length} students` })
    } catch (err) {
      toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' })
    }
    setSaving(false)
  }

  const getGrade = (mark: number): { name: string; comment: string } | null => {
    if (mark <= 0) return null
    const grade = grades.find(g => mark >= g.grade_from && mark <= g.grade_to)
    return grade ? { name: grade.name, comment: grade.comment } : null
  }

  const stats = {
    entered: Object.values(marksMap).filter(v => v !== '' && v !== '0').length,
    total: students.length,
    avg: Object.values(marksMap).filter(v => v !== '').length > 0
      ? (Object.values(marksMap).filter(v => v !== '').reduce((a, b) => a + parseFloat(b), 0) / Object.values(marksMap).filter(v => v !== '').length).toFixed(1)
      : '—',
  }

  const filteredExams = selectedClassId
    ? exams.filter(e => !e.class_id || e.class_id.toString() === selectedClassId || !selectedClassId)
    : exams

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button asChild variant="outline" size="icon" className="min-h-[44px] min-w-[44px]">
            <Link href="/admin/exams">
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Mark Entry</h1>
            <p className="text-sm text-slate-500 mt-1">Enter and manage student examination marks</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" className="min-h-[44px]">
            <Link href="/admin/grades">
              <FileText className="w-4 h-4 mr-2" /> Grades
            </Link>
          </Button>
          <Button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700 min-h-[44px]" disabled={students.length === 0 || saving}>
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save Marks
          </Button>
        </div>
      </div>

      {/* Selectors */}
      <Card className="border-slate-200/60">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-600">Exam</label>
              <Select value={selectedExamId} onValueChange={setSelectedExamId}>
                <SelectTrigger className="min-h-[44px]">
                  <SelectValue placeholder="Select exam" />
                </SelectTrigger>
                <SelectContent>
                  {filteredExams.map(e => (
                    <SelectItem key={e.exam_id} value={e.exam_id.toString()}>
                      {e.name} ({e.type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-600">Class</label>
              <Select value={selectedClassId} onValueChange={v => { setSelectedClassId(v); setSelectedSubjectId('') }}>
                <SelectTrigger className="min-h-[44px]">
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map(c => (
                    <SelectItem key={c.class_id} value={c.class_id.toString()}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-600">Subject</label>
              <Select value={selectedSubjectId} onValueChange={setSelectedSubjectId}>
                <SelectTrigger className="min-h-[44px]">
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map(s => (
                    <SelectItem key={s.subject_id} value={s.subject_id.toString()}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-slate-200 bg-emerald-50 p-3 text-center">
          <p className="text-lg font-bold text-emerald-700">{stats.entered}</p>
          <p className="text-xs text-emerald-600 font-medium">Marks Entered</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-center">
          <p className="text-lg font-bold text-slate-700">{stats.total}</p>
          <p className="text-xs text-slate-600 font-medium">Total Students</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-blue-50 p-3 text-center">
          <p className="text-lg font-bold text-blue-700">{stats.avg}</p>
          <p className="text-xs text-blue-600 font-medium">Class Average</p>
        </div>
      </div>

      {/* Marks Table */}
      <Card className="border-slate-200/60">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Student Marks</CardTitle>
          <CardDescription>
            {selectedExamId && selectedSubjectId
              ? `${exams.find(e => e.exam_id.toString() === selectedExamId)?.name || ''} - ${subjects.find(s => s.subject_id.toString() === selectedSubjectId)?.name || ''}`
              : 'Select exam, class, and subject to begin'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {studentsLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}
            </div>
          ) : !selectedClassId ? (
            <div className="flex flex-col items-center justify-center py-16">
              <BookOpen className="w-12 h-12 text-slate-300 mb-4" />
              <p className="text-sm text-slate-500">Select a class to load students</p>
            </div>
          ) : students.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <GraduationCap className="w-12 h-12 text-slate-300 mb-4" />
              <p className="text-sm text-slate-500">No students found in this class</p>
            </div>
          ) : (
            <div className="max-h-[600px] overflow-y-auto rounded-lg border border-slate-200 custom-scrollbar">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 hover:bg-slate-50">
                    <TableHead className="w-[50px]">#</TableHead>
                    <TableHead className="min-w-[180px]">Student</TableHead>
                    <TableHead className="hidden sm:table-cell">Code</TableHead>
                    <TableHead className="w-[140px]">Mark</TableHead>
                    <TableHead className="w-[100px]">Grade</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student, idx) => {
                    const markVal = parseFloat(marksMap[student.student_id]) || 0
                    const grade = getGrade(markVal)
                    return (
                      <TableRow key={student.student_id} className="hover:bg-slate-50">
                        <TableCell className="text-sm text-slate-500">{idx + 1}</TableCell>
                        <TableCell>
                          <p className="font-medium text-slate-900 text-sm">{student.name}</p>
                          <p className="text-xs text-slate-500 sm:hidden">{student.student_code}</p>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-sm text-slate-500 font-mono">{student.student_code}</TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            value={marksMap[student.student_id] || ''}
                            onChange={e => setMarksMap(prev => ({ ...prev, [student.student_id]: e.target.value }))}
                            placeholder="0"
                            className="min-h-[40px] text-center font-medium tabular-nums"
                          />
                        </TableCell>
                        <TableCell>
                          {grade ? (
                            <Badge className={markVal >= 50 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}>
                              {grade.name}
                            </Badge>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
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
  )
}
