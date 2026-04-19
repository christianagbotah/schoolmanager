'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import {
  FileBarChart, Printer, ArrowLeft, Loader2, Trophy,
  Users, BookOpen, Award, TrendingUp, X, Save,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { toast } from 'sonner'

// ===== Types =====
interface Section {
  section_id: number
  name: string
}

interface ClassItem {
  class_id: number
  name: string
  name_numeric: number
  category: string
}

interface Subject {
  subject_id: number
  name: string
}

interface StudentReport {
  student_id: number
  student_code: string
  name: string
  first_name: string
  last_name: string
  sex: string
  roll: string
  marks: Record<number, number>
  total_score: number
  average: number
  grade: string
  grade_comment: string
  rank: number
  subjects_count: number
  marks_entered: number
}

interface SubjectStats {
  subject_id: number
  name: string
  highest: number
  lowest: number
  average: number
}

// ===== Full Page Skeleton =====
function TerminalSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Skeleton className="w-11 h-11 rounded-lg" />
          <div className="space-y-2"><Skeleton className="h-8 w-48 rounded-lg" /><Skeleton className="h-4 w-64 rounded-lg" /></div>
        </div>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-11 rounded-lg" />)}
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="border-l-4 border-l-slate-200"><CardContent className="p-3"><Skeleton className="h-16 w-full" /></CardContent></Card>
        ))}
      </div>
      <Card className="border-slate-200/60"><CardContent className="p-6">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-lg mb-3" />)}</CardContent></Card>
    </div>
  )
}

// ===== Individual Student Report Card Component =====
function StudentReportCard({
  student, subjects, selectedClass, selectedTerm, selectedYear, selectedSection,
  teacherComment, headComment,
}: {
  student: StudentReport
  subjects: Subject[]
  selectedClass: ClassItem | undefined
  selectedTerm: string
  selectedYear: string
  selectedSection: Section | undefined
  teacherComment: string
  headComment: string
}) {
  const getGradeColor = (grade: string): string => {
    if (grade.startsWith('A')) return 'bg-emerald-100 text-emerald-700'
    if (grade.startsWith('B')) return 'bg-sky-100 text-sky-700'
    if (grade.startsWith('C')) return 'bg-amber-100 text-amber-700'
    if (grade.startsWith('D')) return 'bg-orange-100 text-orange-700'
    if (grade.startsWith('E') || grade.startsWith('F')) return 'bg-red-100 text-red-700'
    return 'bg-slate-100 text-slate-700'
  }

  const getMarkColor = (mark: number): string => {
    if (mark >= 80) return 'text-emerald-700 font-bold'
    if (mark >= 60) return 'text-sky-700 font-semibold'
    if (mark >= 50) return 'text-amber-700 font-medium'
    if (mark > 0) return 'text-red-600 font-medium'
    return 'text-slate-300'
  }

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6 space-y-4">
      {/* Report Header */}
      <div className="text-center space-y-1 border-b border-slate-200 pb-4">
        <h2 className="text-xl font-bold tracking-wider text-slate-900">TERMINAL REPORT</h2>
        <p className="text-sm font-semibold text-slate-700">
          {selectedClass?.name || ''} {selectedClass?.name_numeric || ''}
          {selectedSection ? ` - ${selectedSection.name}` : ''}
        </p>
        <p className="text-xs text-slate-500">
          {selectedTerm} | Academic Year: {selectedYear}
        </p>
      </div>

      {/* Student Info */}
      <div className="grid grid-cols-2 gap-4 text-sm border-b border-slate-100 pb-3">
        <div>
          <p className="text-slate-500">Student Name:</p>
          <p className="font-bold text-slate-900 text-base">{student.name}</p>
        </div>
        <div>
          <p className="text-slate-500">Student Code:</p>
          <p className="font-semibold text-slate-700 font-mono">{student.student_code}</p>
        </div>
        <div>
          <p className="text-slate-500">Sex:</p>
          <p className="font-semibold text-slate-700">{student.sex || '\u2014'}</p>
        </div>
        <div>
          <p className="text-slate-500">Roll:</p>
          <p className="font-semibold text-slate-700">{student.roll || '\u2014'}</p>
        </div>
      </div>

      {/* Marks Table */}
      <div className="overflow-x-auto">
        <Table className="text-sm">
          <TableHeader>
            <TableRow className="bg-slate-100 hover:bg-slate-100">
              <TableHead className="text-xs font-bold text-slate-600">Subject</TableHead>
              <TableHead className="text-center text-xs font-bold text-slate-600 w-[70px]">Score</TableHead>
              <TableHead className="text-center text-xs font-bold text-slate-600 w-[60px]">Grade</TableHead>
              <TableHead className="text-center text-xs font-bold text-slate-600 w-[60px]">Remark</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {subjects.map(s => {
              const mark = student.marks[s.subject_id] || 0
              const grade = mark > 0 ? (mark >= 80 ? 'A1' : mark >= 70 ? 'B2' : mark >= 65 ? 'B3' : mark >= 60 ? 'C4' : mark >= 55 ? 'C5' : mark >= 50 ? 'C6' : mark >= 45 ? 'D7' : mark >= 40 ? 'E8' : 'F9') : '\u2014'
              const remark = mark > 0 ? (mark >= 50 ? 'PASS' : 'FAIL') : '\u2014'
              return (
                <TableRow key={s.subject_id} className="hover:bg-slate-50">
                  <TableCell className="font-medium text-slate-800">{s.name}</TableCell>
                  <TableCell className={`text-center ${getMarkColor(mark)}`}>{mark > 0 ? mark : '\u2014'}</TableCell>
                  <TableCell className="text-center">
                    {mark > 0 ? (
                      <Badge variant="outline" className={`text-xs font-bold ${getGradeColor(grade)}`}>{grade}</Badge>
                    ) : <span className="text-slate-300">{'\u2014'}</span>}
                  </TableCell>
                  <TableCell className="text-center">
                    {mark > 0 ? (
                      <span className={`text-xs font-semibold ${mark >= 50 ? 'text-emerald-600' : 'text-red-600'}`}>{remark}</span>
                    ) : <span className="text-slate-300">{'\u2014'}</span>}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      {/* Summary Row */}
      <div className="grid grid-cols-4 gap-3 border-t border-slate-200 pt-3">
        <div className="text-center">
          <p className="text-[10px] text-slate-400 uppercase font-semibold">Total</p>
          <p className="text-lg font-bold text-slate-900">{student.total_score}</p>
        </div>
        <div className="text-center">
          <p className="text-[10px] text-slate-400 uppercase font-semibold">Average</p>
          <p className="text-lg font-bold text-slate-900">{student.average}</p>
        </div>
        <div className="text-center">
          <p className="text-[10px] text-slate-400 uppercase font-semibold">Grade</p>
          {student.grade ? (
            <Badge variant="outline" className={`text-sm font-bold ${getGradeColor(student.grade)}`}>{student.grade}</Badge>
          ) : <span className="text-lg font-bold text-slate-400">{'\u2014'}</span>}
        </div>
        <div className="text-center">
          <p className="text-[10px] text-slate-400 uppercase font-semibold">Position</p>
          <p className={`text-lg font-bold ${student.rank === 1 ? 'text-emerald-600' : student.rank <= 3 ? 'text-blue-600' : 'text-slate-700'}`}>
            {student.rank} {student.rank === 1 ? 'st' : student.rank === 2 ? 'nd' : student.rank === 3 ? 'rd' : 'th'}
          </p>
        </div>
      </div>

      {/* Comments */}
      <div className="space-y-3 border-t border-slate-200 pt-3">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Class Teacher&apos;s Comment</p>
          <p className="text-sm text-slate-700 italic bg-slate-50 rounded p-2 min-h-[40px]">
            {teacherComment || (student.grade_comment || 'Needs improvement')}
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Head Teacher&apos;s Comment</p>
          <p className="text-sm text-slate-700 italic bg-slate-50 rounded p-2 min-h-[40px]">
            {headComment || 'Keep up the good work!'}
          </p>
        </div>
      </div>

      {/* Signatures */}
      <div className="grid grid-cols-2 gap-8 pt-4 mt-2">
        <div className="text-center">
          <div className="border-t border-slate-400 pt-2 mt-8">
            <p className="text-xs font-semibold text-slate-600">Class Teacher</p>
          </div>
        </div>
        <div className="text-center">
          <div className="border-t border-slate-400 pt-2 mt-8">
            <p className="text-xs font-semibold text-slate-600">Head Teacher</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ===== Main =====
export default function TerminalReportPage() {
  return (
    <DashboardLayout>
      <TerminalReportModule />
    </DashboardLayout>
  )
}

function TerminalReportModule() {
  const printRef = useRef<HTMLDivElement>(null)

  const [classes, setClasses] = useState<ClassItem[]>([])
  const [sections, setSections] = useState<Section[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [students, setStudents] = useState<StudentReport[]>([])
  const [subjectStats, setSubjectStats] = useState<SubjectStats[]>([])
  const [loading, setLoading] = useState(false)

  const [selectedClassId, setSelectedClassId] = useState('')
  const [selectedSectionId, setSelectedSectionId] = useState('')
  const [selectedTerm, setSelectedTerm] = useState('1')
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString())

  const [teacherComment, setTeacherComment] = useState('')
  const [headComment, setHeadComment] = useState('')

  // Individual student report viewer
  const [viewingStudent, setViewingStudent] = useState<StudentReport | null>(null)

  useEffect(() => {
    Promise.all([
      fetch('/api/classes').then(r => r.json()),
      fetch('/api/settings').then(r => r.json()).catch(() => ({})),
    ]).then(([classesData, settingsData]) => {
      setClasses(Array.isArray(classesData) ? classesData : [])
      const sy = settingsData?.running_year
      if (sy) setSelectedYear(sy)
    }).catch(() => {})
  }, [])

  useEffect(() => {
    if (!selectedClassId) { setSections([]); return }
    fetch(`/api/sections?class_id=${selectedClassId}`)
      .then(r => r.json())
      .then(data => {
        const secs = Array.isArray(data) ? data : []
        setSections(secs)
        if (secs.length > 0) setSelectedSectionId(secs[0].section_id.toString())
      })
      .catch(() => setSections([]))
  }, [selectedClassId])

  const generateReport = useCallback(async () => {
    if (!selectedClassId) {
      toast.error('Please select a class'); return
    }
    setLoading(true)
    try {
      const params = new URLSearchParams({
        class_id: selectedClassId,
        term: selectedTerm,
        year: selectedYear,
      })
      const res = await fetch(`/api/reports/terminal?${params.toString()}`)
      const data = await res.json()
      setStudents(data.students || [])
      setSubjects(data.subjects || [])
      setSubjectStats(data.subject_stats || [])
    } catch { toast.error('Failed to generate report') }
    setLoading(false)
  }, [selectedClassId, selectedTerm, selectedYear])

  const handleSaveComments = async () => {
    if (!selectedClassId || students.length === 0) return
    try {
      const reports = students.map(s => ({
        student_id: s.student_id,
        class_id: parseInt(selectedClassId),
        term: selectedTerm,
        year: selectedYear,
        total_score: s.total_score,
        grade: s.grade,
        rank: s.rank,
        position: `${s.rank}`,
        teacher_comment: teacherComment,
        head_comment: headComment,
      }))
      const res = await fetch('/api/reports/terminal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reports }),
      })
      if (!res.ok) throw new Error('Failed to save')
      toast.success('Comments saved successfully')
    } catch { toast.error('Failed to save comments') }
  }

  const handlePrint = () => { window.print() }

  const handlePrintStudent = (student: StudentReport) => {
    setViewingStudent(student)
    setTimeout(() => {
      window.print()
    }, 300)
  }

  const getGradeColor = (grade: string): string => {
    if (grade.startsWith('A')) return 'bg-emerald-100 text-emerald-700'
    if (grade.startsWith('B')) return 'bg-sky-100 text-sky-700'
    if (grade.startsWith('C')) return 'bg-amber-100 text-amber-700'
    if (grade.startsWith('D')) return 'bg-orange-100 text-orange-700'
    if (grade.startsWith('E') || grade.startsWith('F')) return 'bg-red-100 text-red-700'
    return 'bg-slate-100 text-slate-700'
  }

  const selectedClass = classes.find(c => c.class_id.toString() === selectedClassId)
  const selectedSection = sections.find(s => s.section_id.toString() === selectedSectionId)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3 print:hidden">
          <Button asChild variant="outline" size="icon" className="min-h-[44px] min-w-[44px]">
            <Link href="/admin/exams"><ArrowLeft className="w-4 h-4" /></Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              <FileBarChart className="w-6 h-6 inline-block mr-2 text-emerald-600" />Terminal Reports
            </h1>
            <p className="text-sm text-slate-500 mt-1">Generate and print student terminal reports</p>
          </div>
        </div>
        <div className="flex items-center gap-2 print:hidden">
          <Button asChild variant="outline" className="min-h-[44px]">
            <Link href="/admin/reports/broadsheet"><BookOpen className="w-4 h-4 mr-2" />Broadsheet</Link>
          </Button>
          {students.length > 0 && (
            <>
              <Button onClick={handlePrint} variant="outline" className="min-h-[44px]">
                <Printer className="w-4 h-4 mr-2" />Print All
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card className="border-slate-200/60 print:hidden">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600 uppercase">Class</label>
              <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                <SelectTrigger className="min-h-[44px]"><SelectValue placeholder="Select class" /></SelectTrigger>
                <SelectContent>
                  {classes.map(c => <SelectItem key={c.class_id} value={c.class_id.toString()}>{c.name} {c.name_numeric}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600 uppercase">Section</label>
              <Select value={selectedSectionId} onValueChange={setSelectedSectionId}>
                <SelectTrigger className="min-h-[44px]"><SelectValue placeholder={selectedClassId ? (sections.length > 0 ? 'Select section' : 'No sections') : 'Select class first'} /></SelectTrigger>
                <SelectContent>
                  {sections.map(s => <SelectItem key={s.section_id} value={s.section_id.toString()}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600 uppercase">Term</label>
              <Select value={selectedTerm} onValueChange={setSelectedTerm}>
                <SelectTrigger className="min-h-[44px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Term 1</SelectItem>
                  <SelectItem value="2">Term 2</SelectItem>
                  <SelectItem value="3">Term 3</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600 uppercase">Year</label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="min-h-[44px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[2023, 2024, 2025, 2026, 2027].map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={generateReport} className="bg-emerald-600 hover:bg-emerald-700 w-full min-h-[44px]" disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileBarChart className="w-4 h-4 mr-2" />}
                Generate
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Content */}
      <div ref={printRef}>
        {loading ? (
          <TerminalSkeleton />
        ) : students.length === 0 ? (
          <Card className="border-slate-200/60 print:hidden">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
                <FileBarChart className="w-7 h-7 text-slate-300" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-1">No Report Generated</h3>
              <p className="text-sm text-slate-500">Select a class, section, term, and year to generate a terminal report</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Report Header for Print */}
            <div className="hidden print:block text-center mb-6">
              <h2 className="text-xl font-bold tracking-wider">SCHOOL TERMINAL REPORT</h2>
              <p className="text-sm font-semibold">{selectedClass?.name} {selectedClass?.name_numeric} {selectedSection ? `- ${selectedSection.name}` : ''} | {selectedTerm} | {selectedYear}</p>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 print:hidden">
              <Card className="border-l-4 border-l-emerald-500 hover:shadow-sm transition-all hover:-translate-y-0.5">
                <CardContent className="p-3 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-500 flex items-center justify-center flex-shrink-0"><Users className="w-4 h-4 text-white" /></div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">Students</p>
                    <p className="text-lg font-bold text-slate-900 tabular-nums">{students.length}</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-sky-500 hover:shadow-sm transition-all hover:-translate-y-0.5">
                <CardContent className="p-3 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-sky-500 flex items-center justify-center flex-shrink-0"><BookOpen className="w-4 h-4 text-white" /></div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">Subjects</p>
                    <p className="text-lg font-bold text-slate-900 tabular-nums">{subjects.length}</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-amber-500 hover:shadow-sm transition-all hover:-translate-y-0.5">
                <CardContent className="p-3 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-amber-500 flex items-center justify-center flex-shrink-0"><Trophy className="w-4 h-4 text-white" /></div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">Top Student</p>
                    <p className="text-sm font-bold text-slate-900 truncate">{students[0]?.name || '\u2014'}</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-violet-500 hover:shadow-sm transition-all hover:-translate-y-0.5">
                <CardContent className="p-3 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-violet-500 flex items-center justify-center flex-shrink-0"><TrendingUp className="w-4 h-4 text-white" /></div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">Class Avg</p>
                    <p className="text-lg font-bold text-slate-900 tabular-nums">
                      {students.length > 0 ? Math.round(students.reduce((a, b) => a + b.average, 0) / students.length * 10) / 10 : '\u2014'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Class Summary Table */}
            <Card className="border-slate-200/60 print:border print:border-black">
              <CardHeader className="pb-4 print:hidden">
                <CardTitle className="text-lg flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <Award className="w-4 h-4 text-emerald-600" />
                  </div>
                  Class Summary
                </CardTitle>
                <CardDescription>{selectedClass?.name} {selectedClass?.name_numeric} | {selectedTerm} | {selectedYear}</CardDescription>
              </CardHeader>
              {/* Print header */}
              <div className="hidden print:block text-center font-bold text-sm mb-2 px-4">
                Class: {selectedClass?.name} {selectedClass?.name_numeric} {selectedSection ? `- ${selectedSection.name}` : ''} | Term: {selectedTerm} | Year: {selectedYear}
              </div>
              <CardContent className="p-0">
                <div className="overflow-x-auto max-h-[500px] overflow-y-auto custom-scrollbar">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50 hover:bg-slate-50 print:bg-slate-200">
                        <TableHead className="w-[50px] sticky left-0 bg-slate-50 z-10 print:bg-slate-200">#</TableHead>
                        <TableHead className="min-w-[180px] sticky left-[50px] bg-slate-50 z-10 print:bg-slate-200">Student</TableHead>
                        <TableHead className="min-w-[60px] text-center hidden md:table-cell print:table-cell">Code</TableHead>
                        {subjects.map(s => (
                          <TableHead key={s.subject_id} className="min-w-[65px] text-center text-xs">
                            {s.name}
                          </TableHead>
                        ))}
                        <TableHead className="text-center min-w-[70px]">Total</TableHead>
                        <TableHead className="text-center min-w-[60px]">Avg</TableHead>
                        <TableHead className="text-center min-w-[60px]">Grade</TableHead>
                        <TableHead className="text-center min-w-[50px]">Pos</TableHead>
                        <TableHead className="text-center min-w-[50px] print:hidden">View</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {students.map((student, idx) => (
                        <TableRow key={student.student_id} className={idx === 0 ? 'bg-emerald-50/50' : 'hover:bg-slate-50'}>
                          <TableCell className="text-sm text-slate-500 sticky left-0 bg-white z-10 print:bg-white">{idx + 1}</TableCell>
                          <TableCell className="font-medium text-sm text-slate-900 sticky left-[50px] bg-white z-10 print:bg-white">
                            {student.name}
                            {idx === 0 && <Trophy className="w-3 h-3 inline ml-1 text-amber-500" />}
                          </TableCell>
                          <TableCell className="text-center text-xs text-slate-400 font-mono hidden md:table-cell print:table-cell">{student.student_code}</TableCell>
                          {subjects.map(s => {
                            const mark = student.marks[s.subject_id] || 0
                            return (
                              <TableCell key={s.subject_id} className="text-center text-sm tabular-nums">
                                {mark > 0 ? (
                                  <span className={mark >= 50 ? 'text-emerald-700 font-medium' : 'text-red-600'}>{mark}</span>
                                ) : (
                                  <span className="text-slate-300">{'\u2014'}</span>
                                )}
                              </TableCell>
                            )
                          })}
                          <TableCell className="text-center font-bold text-sm">{student.total_score}</TableCell>
                          <TableCell className="text-center text-sm tabular-nums">{student.average}</TableCell>
                          <TableCell className="text-center">
                            {student.grade ? (
                              <Badge className={`text-xs ${getGradeColor(student.grade)}`}>{student.grade}</Badge>
                            ) : (
                              <span className="text-xs text-slate-400">{'\u2014'}</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center font-bold text-sm">
                            {student.rank}
                          </TableCell>
                          <TableCell className="text-center print:hidden">
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handlePrintStudent(student)}>
                              <Printer className="w-3.5 h-3.5" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Subject Statistics */}
            {subjectStats.length > 0 && (
              <Card className="border-slate-200/60 print:hidden">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                      <Award className="w-4 h-4 text-emerald-600" />
                    </div>
                    Subject Statistics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto rounded-lg border border-slate-200">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50 hover:bg-slate-50">
                          <TableHead className="text-xs font-semibold">Subject</TableHead>
                          <TableHead className="text-center">Highest</TableHead>
                          <TableHead className="text-center">Lowest</TableHead>
                          <TableHead className="text-center">Average</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {subjectStats.map(s => (
                          <TableRow key={s.subject_id} className="hover:bg-slate-50">
                            <TableCell className="font-medium text-sm">{s.name}</TableCell>
                            <TableCell className="text-center"><Badge className="bg-emerald-100 text-emerald-700">{s.highest}</Badge></TableCell>
                            <TableCell className="text-center"><Badge className="bg-red-100 text-red-700">{s.lowest}</Badge></TableCell>
                            <TableCell className="text-center font-medium text-sm tabular-nums">{s.average}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Teacher & Head Comments */}
            <Card className="border-slate-200/60 print:hidden">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center">
                    <FileBarChart className="w-4 h-4 text-violet-600" />
                  </div>
                  Teacher Comments
                </CardTitle>
                <CardDescription>These comments will appear on all student terminal reports</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label className="text-xs font-medium text-slate-600">Class Teacher Comment</Label>
                  <Textarea
                    placeholder="Enter class teacher's general comment for all students..."
                    rows={2}
                    value={teacherComment}
                    onChange={e => setTeacherComment(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label className="text-xs font-medium text-slate-600">Head Teacher Comment</Label>
                  <Textarea
                    placeholder="Enter head teacher's comment for all students..."
                    rows={2}
                    value={headComment}
                    onChange={e => setHeadComment(e.target.value)}
                  />
                </div>
                <div className="flex justify-end">
                  <Button onClick={handleSaveComments} className="bg-emerald-600 hover:bg-emerald-700 min-h-[44px]" disabled={students.length === 0}>
                    <Save className="w-4 h-4 mr-2" />Save Comments
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Individual Student Report Modal for Print */}
      {viewingStudent && (
        <div className="hidden print:block" ref={el => {
          if (el) {
            // Create a new print container with just the student report
            el.innerHTML = ''
          }
        }}>
          {/* This section is handled by window.print after setting viewingStudent */}
        </div>
      )}

      {/* Print-only individual student report */}
      {viewingStudent && (
        <div className="hidden print:block">
          <StudentReportCard
            student={viewingStudent}
            subjects={subjects}
            selectedClass={selectedClass}
            selectedTerm={selectedTerm}
            selectedYear={selectedYear}
            selectedSection={selectedSection}
            teacherComment={teacherComment}
            headComment={headComment}
          />
        </div>
      )}

      {/* Screen overlay for individual student report (also prints) */}
      {viewingStudent && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 print:hidden" onClick={() => setViewingStudent(null)}>
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between rounded-t-xl z-10">
              <h3 className="font-semibold text-slate-900">Student Report Card</h3>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => handlePrintStudent(viewingStudent)}>
                  <Printer className="w-3.5 h-3.5 mr-1" />Print
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setViewingStudent(null)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="p-4">
              <StudentReportCard
                student={viewingStudent}
                subjects={subjects}
                selectedClass={selectedClass}
                selectedTerm={selectedTerm}
                selectedYear={selectedYear}
                selectedSection={selectedSection}
                teacherComment={teacherComment}
                headComment={headComment}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
