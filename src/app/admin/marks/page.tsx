'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useToast } from '@/hooks/use-toast'
import {
  GraduationCap, Save, Loader2, ArrowLeft, AlertCircle, CheckCircle2,
  BookOpen, FileText, Search,
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
interface Student {
  student_id: number
  student_code: string
  name: string
  sex: string
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
  const [sections, setSections] = useState<Section[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [grades, setGrades] = useState<GradeScale[]>([])

  // Selections
  const [selectedExamId, setSelectedExamId] = useState('')
  const [selectedClassId, setSelectedClassId] = useState('')
  const [selectedSectionId, setSelectedSectionId] = useState('')
  const [selectedSubjectId, setSelectedSubjectId] = useState('')

  // Marks - keyed by student_id
  const [marksMap, setMarksMap] = useState<Record<number, string>>({})

  // State
  const [saving, setSaving] = useState(false)
  const [studentsLoading, setStudentsLoading] = useState(false)
  const [subjectsLoading, setSubjectsLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)

  // Fetch exams, classes, grades on mount
  useEffect(() => {
    Promise.all([
      fetch('/api/exams').then(r => r.json()),
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
    if (!selectedClassId) {
      setSections([])
      setSubjects([])
      setSelectedSectionId('')
      return
    }

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
    }).catch(() => {
      setSections([])
      setSubjects([])
    }).finally(() => setSubjectsLoading(false))
  }, [selectedClassId])

  // When exam + subject + class selected, fetch enrolled students
  useEffect(() => {
    if (!selectedClassId || !selectedExamId) {
      setStudents([])
      setMarksMap({})
      return
    }

    setStudentsLoading(true)
    // Fetch students enrolled in this class
    const params = new URLSearchParams({
      class_id: selectedClassId,
      limit: '200',
    })
    if (selectedSectionId) params.set('section_id', selectedSectionId)

    fetch(`/api/admin/students?${params.toString()}`)
      .then(r => r.json())
      .then(data => {
        const studentsList = Array.isArray(data) ? data : (data.students || [])
        setStudents(studentsList)
        setMarksMap({})

        // Now fetch existing marks
        if (selectedSubjectId) {
          const markParams = new URLSearchParams({
            exam_id: selectedExamId,
            subject_id: selectedSubjectId,
            class_id: selectedClassId,
            limit: '200',
          })
          fetch(`/api/marks?${markParams.toString()}`)
            .then(r => r.json())
            .then(markData => {
              const records = Array.isArray(markData) ? markData : (markData.marks || [])
              const map: Record<number, string> = {}
              records.forEach((r: { student_id: number; mark_obtained: number }) => {
                map[r.student_id] = r.mark_obtained.toString()
              })
              setMarksMap(map)
            })
            .catch(() => {})
        }
      })
      .catch(() => setStudents([]))
      .finally(() => setStudentsLoading(false))
  }, [selectedClassId, selectedExamId, selectedSectionId])

  // When subject changes, fetch existing marks
  useEffect(() => {
    if (!selectedExamId || !selectedSubjectId || !selectedClassId || students.length === 0) {
      return
    }

    const params = new URLSearchParams({
      exam_id: selectedExamId,
      subject_id: selectedSubjectId,
      class_id: selectedClassId,
      limit: '200',
    })
    fetch(`/api/marks?${params.toString()}`)
      .then(r => r.json())
      .then(data => {
        const records = Array.isArray(data) ? data : (data.marks || [])
        const map: Record<number, string> = {}
        records.forEach((r: { student_id: number; mark_obtained: number }) => {
          map[r.student_id] = r.mark_obtained.toString()
        })
        setMarksMap(map)
      })
      .catch(() => {})
  }, [selectedExamId, selectedSubjectId, selectedClassId, students.length])

  const handleSave = async () => {
    if (!selectedExamId || !selectedSubjectId || !selectedClassId) {
      toast({ title: 'Error', description: 'Please select exam, class, and subject', variant: 'destructive' })
      return
    }

    setSaving(true)
    try {
      const records = students.map(s => ({
        student_id: s.student_id,
        subject_id: parseInt(selectedSubjectId),
        class_id: parseInt(selectedClassId),
        section_id: selectedSectionId ? parseInt(selectedSectionId) : null,
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

  const getGradeColor = (name: string): string => {
    const n = name.toLowerCase()
    if (n.startsWith('a') || n.startsWith('1')) return 'bg-emerald-100 text-emerald-700'
    if (n.startsWith('b') || n.startsWith('2')) return 'bg-blue-100 text-blue-700'
    if (n.startsWith('c') || n.startsWith('3')) return 'bg-amber-100 text-amber-700'
    if (n.startsWith('d') || n.startsWith('4')) return 'bg-orange-100 text-orange-700'
    return 'bg-red-100 text-red-700'
  }

  const stats = {
    entered: Object.values(marksMap).filter(v => v !== '' && v !== '0').length,
    total: students.length,
    avg: Object.values(marksMap).filter(v => v !== '' && v !== '0').length > 0
      ? (Object.values(marksMap).filter(v => v !== '' && v !== '0').reduce((a, b) => a + parseFloat(b), 0) / Object.values(marksMap).filter(v => v !== '' && v !== '0').length).toFixed(1)
      : '—',
  }

  const selectedExam = exams.find(e => e.exam_id.toString() === selectedExamId)
  const selectedClass = classes.find(c => c.class_id.toString() === selectedClassId)
  const selectedSubject = subjects.find(s => s.subject_id.toString() === selectedSubjectId)

  const canSave = selectedExamId && selectedSubjectId && selectedClassId && students.length > 0

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
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Manage Exam Marks</h1>
            <p className="text-sm text-slate-500 mt-1">Enter and manage student examination marks</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" className="min-h-[44px]" size="sm">
            <Link href="/admin/grades">
              <FileText className="w-4 h-4 mr-2" /> Grades
            </Link>
          </Button>
          <Button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700 min-h-[44px]" disabled={!canSave || saving}>
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            {saving ? 'Saving...' : 'Save Marks'}
          </Button>
        </div>
      </div>

      {/* Selector Row matching CI3 marks_manage.php */}
      <Card className="border-slate-200/60">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600 uppercase">Exam</Label>
              <Select value={selectedExamId} onValueChange={setSelectedExamId}>
                <SelectTrigger className="min-h-[52px] text-lg font-bold uppercase">
                  <SelectValue placeholder="Select Exam" />
                </SelectTrigger>
                <SelectContent>
                  {exams.map(e => (
                    <SelectItem key={e.exam_id} value={e.exam_id.toString()} className="font-bold uppercase">
                      {e.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600 uppercase">Class</Label>
              <Select value={selectedClassId} onValueChange={v => { setSelectedClassId(v); setSelectedSubjectId('') }}>
                <SelectTrigger className="min-h-[52px] text-lg font-bold uppercase">
                  <SelectValue placeholder="Select Class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map(c => (
                    <SelectItem key={c.class_id} value={c.class_id.toString()} className="font-bold uppercase">
                      {c.name} {c.name_numeric}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600 uppercase">Section</Label>
              <Select value={selectedSectionId} onValueChange={setSelectedSectionId}>
                <SelectTrigger className="min-h-[52px] text-lg font-bold uppercase">
                  <SelectValue placeholder={selectedClassId ? 'Select Section' : 'Select Class First'} />
                </SelectTrigger>
                <SelectContent>
                  {sections.map(s => (
                    <SelectItem key={s.section_id} value={s.section_id.toString()} className="font-bold uppercase">
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600 uppercase">Subject</Label>
              <Select value={selectedSubjectId} onValueChange={setSelectedSubjectId} disabled={subjectsLoading}>
                <SelectTrigger className="min-h-[52px] text-lg font-bold uppercase">
                  <SelectValue placeholder={selectedClassId ? 'Select Subject' : 'Select Class First'} />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map(s => (
                    <SelectItem key={s.subject_id} value={s.subject_id.toString()} className="font-bold uppercase">
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Info Banner matching CI3 marks_manage_view header */}
      {(selectedExam || selectedClass || selectedSubject) && (
        <Card className="border-emerald-200 bg-emerald-50/50">
          <CardContent className="p-4 text-center">
            <h4 className="text-lg font-semibold text-slate-800">
              Marks for <span className="text-emerald-700">{selectedExam?.name || '—'}</span>
            </h4>
            <p className="text-sm text-slate-600">
              {selectedClass ? `${selectedClass.name} ${selectedClass.name_numeric}` : ''} | {selectedSubject?.name || 'No subject'}
            </p>
          </CardContent>
        </Card>
      )}

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

      {/* Marks Table matching CI3 marks_manage_view.php */}
      <Card className="border-slate-200/60">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Student Marks</CardTitle>
          <CardDescription>
            {selectedExamId && selectedSubjectId
              ? `${selectedExam?.name || ''} — ${selectedSubject?.name || ''}`
              : 'Select exam, class, section, and subject to begin entering marks'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {studentsLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}
            </div>
          ) : !selectedClassId ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                <BookOpen className="w-8 h-8 text-slate-300" />
              </div>
              <p className="text-sm text-slate-500 font-medium">Select a class to load students</p>
            </div>
          ) : students.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center mb-4">
                <AlertCircle className="w-8 h-8 text-amber-400" />
              </div>
              <p className="text-sm text-amber-700 font-medium">No students enrolled in this class</p>
              <p className="text-xs text-amber-600 mt-1">Make sure students are enrolled before entering marks</p>
            </div>
          ) : !selectedSubjectId ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                <GraduationCap className="w-8 h-8 text-slate-300" />
              </div>
              <p className="text-sm text-slate-500 font-medium">Select a subject to enter marks</p>
            </div>
          ) : (
            <div className="max-h-[600px] overflow-y-auto rounded-lg border border-slate-200 custom-scrollbar">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-100 hover:bg-slate-100">
                    <TableHead className="w-[50px] text-center hidden sm:table-cell">#</TableHead>
                    <TableHead className="hidden sm:table-cell">ID</TableHead>
                    <TableHead className="min-w-[180px]">Name</TableHead>
                    <TableHead className="w-[140px] text-center">Mark Obtained</TableHead>
                    <TableHead className="w-[90px] text-center">Grade</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student, idx) => {
                    const markVal = parseFloat(marksMap[student.student_id]) || 0
                    const grade = getGrade(markVal)
                    return (
                      <TableRow key={student.student_id} className="hover:bg-slate-50">
                        <TableCell className="text-center text-sm text-slate-500 hidden sm:table-cell">{idx + 1}</TableCell>
                        <TableCell className="hidden sm:table-cell text-xs text-slate-500 font-mono whitespace-nowrap">
                          {student.student_code}
                        </TableCell>
                        <TableCell>
                          <p className="font-semibold text-slate-900 text-sm whitespace-nowrap">{student.name}</p>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            step="0.5"
                            value={marksMap[student.student_id] || ''}
                            onChange={e => setMarksMap(prev => ({ ...prev, [student.student_id]: e.target.value }))}
                            placeholder="0"
                            className="min-h-[40px] text-center font-bold tabular-nums text-lg border-green-200 focus:border-emerald-500"
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          {grade ? (
                            <Badge variant="outline" className={`text-xs font-bold ${getGradeColor(grade.name)}`}>
                              {grade.name}
                            </Badge>
                          ) : (
                            <span className="text-xs text-slate-300">—</span>
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

      {/* Save button at bottom matching CI3 sticky save */}
      {canSave && (
        <div className="flex justify-end sticky bottom-4 z-10">
          <Button
            onClick={handleSave}
            className="bg-emerald-600 hover:bg-emerald-700 min-h-[48px] px-8 shadow-lg text-lg"
            disabled={saving}
          >
            {saving ? (
              <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Saving...</>
            ) : (
              <><Save className="w-5 h-5 mr-2" /> Save Marks</>
            )}
          </Button>
        </div>
      )}
    </div>
  )
}
