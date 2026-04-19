'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import {
  ArrowLeft, Loader2, Table2, Printer, Award, GraduationCap,
  BarChart3, Users, Trophy, Medal,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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
import { useToast } from '@/hooks/use-toast'

// ===== Types =====
interface TabulationClass { class_id: number; name: string; name_numeric: number; category: string }
interface TabulationExam { exam_id: number; name: string; type: string; date: string | null; year: string; term: number; sem: number }
interface TabulationSubject { subject_id: number; name: string }
interface TabulationStudent { student_id: number; name: string; student_code: string }
interface GradeScale { grade_id: number; name: string; grade_from: number; grade_to: number }
interface TabulationData {
  class: TabulationClass
  exam: TabulationExam
  subjects: TabulationSubject[]
  students: TabulationStudent[]
  studentMarks: Record<number, Record<number, number>>
  studentTotals: { student_id: number; total: number }[]
  positionMap: Record<number, number>
  subjectAvgs: Record<number, number>
  grades: GradeScale[]
}
interface ClassItem { class_id: number; name: string; name_numeric: number }
interface ExamItem { exam_id: number; name: string; year: string; term: number; sem: number }

export default function TabulationPage() {
  return (
    <DashboardLayout>
      <TabulationModule />
    </DashboardLayout>
  )
}

function TabulationModule() {
  const { toast: uiToast } = useToast()
  const printRef = useRef<HTMLDivElement>(null)
  const [classes, setClasses] = useState<ClassItem[]>([])
  const [exams, setExams] = useState<ExamItem[]>([])
  const [years, setYears] = useState<string[]>([])
  const [selectedClassId, setSelectedClassId] = useState('')
  const [selectedExamId, setSelectedExamId] = useState('')
  const [selectedYear, setSelectedYear] = useState('')
  const [selectedTerm, setSelectedTerm] = useState('1')
  const [data, setData] = useState<TabulationData | null>(null)
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)

  useEffect(() => {
    Promise.all([fetch('/api/classes').then(r => r.json()), fetch('/api/admin/exams').then(r => r.json())]).then(([classesData, examsData]) => {
      const classList = Array.isArray(classesData) ? classesData : []
      setClasses(classList)
      const examsList = Array.isArray(examsData) ? examsData : (examsData.exams || [])
      setExams(examsList)
      const uniqueYears = [...new Set(examsList.map(e => e.year).filter(Boolean))]
      setYears(uniqueYears.sort().reverse())
      const currentYear = new Date().getFullYear().toString()
      if (uniqueYears.includes(currentYear)) setSelectedYear(currentYear)
      else if (uniqueYears.length > 0) setSelectedYear(uniqueYears[0])
    }).catch(() => {}).finally(() => setInitialLoading(false))
  }, [])

  const filteredExams = selectedYear ? exams.filter(e => e.year === selectedYear) : exams

  const fetchTabulation = useCallback(async () => {
    if (!selectedClassId || !selectedExamId) { setData(null); return }
    setLoading(true)
    try {
      const params = new URLSearchParams({ class_id: selectedClassId, exam_id: selectedExamId })
      const res = await fetch(`/api/admin/exams/tabulation?${params.toString()}`)
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Failed') }
      setData(await res.json())
    } catch (err) { toast.error((err as Error).message || 'Failed to load tabulation'); setData(null) }
    setLoading(false)
  }, [selectedClassId, selectedExamId])

  useEffect(() => { fetchTabulation() }, [fetchTabulation])

  const getGrade = (mark: number): { name: string } | null => {
    if (mark <= 0 || !data) return null
    const grade = data.grades.find(g => mark >= g.grade_from && mark <= g.grade_to)
    return grade ? { name: grade.name } : null
  }

  const getGradeColor = (name: string): string => {
    const n = name.toLowerCase()
    if (n.startsWith('a') || n.startsWith('1')) return 'bg-emerald-100 text-emerald-700'
    if (n.startsWith('b') || n.startsWith('2')) return 'bg-sky-100 text-sky-700'
    if (n.startsWith('c') || n.startsWith('3')) return 'bg-amber-100 text-amber-700'
    if (n.startsWith('d') || n.startsWith('4')) return 'bg-orange-100 text-orange-700'
    return 'bg-red-100 text-red-700'
  }

  const highestTotal = data && data.studentTotals.length > 0 ? Math.max(...data.studentTotals.map(s => s.total)) : 0
  const lowestTotal = data && data.studentTotals.length > 0 ? Math.min(...data.studentTotals.map(s => s.total)) : 0
  const classAvg = data && data.studentTotals.length > 0
    ? (data.studentTotals.reduce((a, b) => a + b.total, 0) / data.studentTotals.length).toFixed(1) : '0'

  const handlePrint = () => {
    window.print()
  }

  const getPositionIcon = (pos: number) => {
    if (pos === 1) return <Trophy className="w-3 h-3 inline text-amber-500" />
    if (pos === 2) return <Medal className="w-3 h-3 inline text-slate-400" />
    if (pos === 3) return <Medal className="w-3 h-3 inline text-amber-700" />
    return null
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
        <div className="flex items-center gap-3">
          <Button asChild variant="outline" size="icon" className="min-h-[44px] min-w-[44px]">
            <Link href="/admin/exams"><ArrowLeft className="w-4 h-4" /></Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              <Table2 className="w-6 h-6 inline-block mr-2 text-emerald-600" />Tabulation Sheet
            </h1>
            <p className="text-sm text-slate-500 mt-1">View class-wide examination results matrix</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" className="min-h-[44px]" size="sm">
            <Link href="/admin/marks"><GraduationCap className="w-4 h-4 mr-2" />Mark Entry</Link>
          </Button>
          <Button asChild variant="outline" className="min-h-[44px]" size="sm">
            <Link href="/admin/grades"><Award className="w-4 h-4 mr-2" />Grades</Link>
          </Button>
        </div>
      </div>

      {/* CI3 Parity: Selector Row with Class, Term, Year, Exam */}
      <Card className="border-slate-200/60 print:hidden">
        <CardContent className="p-4">
          {initialLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-lg" />)}</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-600 uppercase">Class</Label>
                <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                  <SelectTrigger className="min-h-[44px] text-sm font-bold uppercase"><SelectValue placeholder="Select a Class" /></SelectTrigger>
                  <SelectContent>{classes.map(c => (<SelectItem key={c.class_id} value={c.class_id.toString()} className="font-bold uppercase text-sm">{c.name} {c.name_numeric}</SelectItem>))}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-600 uppercase">Term</Label>
                <Select value={selectedTerm} onValueChange={setSelectedTerm}>
                  <SelectTrigger className="min-h-[44px] text-sm font-bold"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1</SelectItem><SelectItem value="2">2</SelectItem><SelectItem value="3">3</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-600 uppercase">Academic Year</Label>
                <Select value={selectedYear} onValueChange={v => { setSelectedYear(v); setSelectedExamId('') }}>
                  <SelectTrigger className="min-h-[44px] text-sm font-bold"><SelectValue placeholder="Select Year" /></SelectTrigger>
                  <SelectContent>{years.map(y => (<SelectItem key={y} value={y} className="font-bold text-sm">{y}</SelectItem>))}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-600 uppercase">Exam</Label>
                <Select value={selectedExamId} onValueChange={setSelectedExamId}>
                  <SelectTrigger className="min-h-[44px] text-sm font-bold uppercase"><SelectValue placeholder={selectedYear ? 'Select an Exam' : 'Select Year First'} /></SelectTrigger>
                  <SelectContent>{filteredExams.map(e => (<SelectItem key={e.exam_id} value={e.exam_id.toString()} className="font-bold uppercase text-sm">{e.name}</SelectItem>))}</SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button onClick={fetchTabulation} className="w-full min-h-[44px] bg-emerald-600 hover:bg-emerald-700 text-sm font-semibold" disabled={!selectedClassId || !selectedExamId}>
                  <Table2 className="w-4 h-4 mr-2" />View Tabulation Sheet
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* CI3 Parity: Tabulation Content */}
      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-16 w-full rounded-lg" />
          <Skeleton className="h-12 w-full rounded-lg" />
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}
        </div>
      ) : data && data.students.length === 0 ? (
        <Card className="border-slate-200/60 print:hidden">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4"><Users className="w-8 h-8 text-slate-300" /></div>
            <p className="text-sm font-medium text-slate-500">No students found for this class in the selected exam</p>
          </CardContent>
        </Card>
      ) : data && data.subjects.length === 0 ? (
        <Card className="border-slate-200/60 print:hidden">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4"><BarChart3 className="w-8 h-8 text-slate-300" /></div>
            <p className="text-sm font-medium text-slate-500">No subjects found for this class</p>
          </CardContent>
        </Card>
      ) : data ? (
        <>
          {/* CI3: Print header for print view */}
          <div ref={printRef}>
            {/* CI3 Info Banner (screen) / Print Header */}
            <Card className="border-emerald-200 bg-emerald-50/50 print:border-0 print:bg-transparent print:shadow-none print:rounded-none print:p-0 print:mb-6">
              <CardContent className="p-4 text-center space-y-2">
                {/* Print-only school name */}
                <div className="hidden print:block">
                  <h2 className="text-xl font-bold tracking-wider">EXAM TABULATION SHEET</h2>
                </div>
                <h3 className="text-lg font-semibold text-slate-800 print:text-base">
                  {data.class.name} {data.class.name_numeric}
                  {data.exam.term ? ` | Term: ${data.exam.term}` : ''}
                  {data.exam.sem ? ` | Semester: ${data.exam.sem}` : ''}
                </h3>
                <h4 className="text-sm text-slate-600 print:text-xs">
                  {data.exam.name} | Academic Year: {data.exam.year}
                </h4>
              </CardContent>
            </Card>

            {/* Stats (screen only) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 print:hidden mb-4">
              <div className="rounded-xl border border-slate-200 bg-emerald-50 p-3 text-center hover:shadow-sm transition-all hover:-translate-y-0.5">
                <p className="text-lg font-bold text-emerald-700">{data.students.length}</p>
                <p className="text-xs text-emerald-600 font-medium">Students</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-sky-50 p-3 text-center hover:shadow-sm transition-all hover:-translate-y-0.5">
                <p className="text-lg font-bold text-sky-700">{data.subjects.length}</p>
                <p className="text-xs text-sky-600 font-medium">Subjects</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-amber-50 p-3 text-center hover:shadow-sm transition-all hover:-translate-y-0.5">
                <p className="text-lg font-bold text-amber-700">{highestTotal}</p>
                <p className="text-xs text-amber-600 font-medium">Highest Total</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-center hover:shadow-sm transition-all hover:-translate-y-0.5">
                <p className="text-lg font-bold text-slate-700">{classAvg}</p>
                <p className="text-xs text-slate-600 font-medium">Class Average</p>
              </div>
            </div>

            {/* CI3 Parity: Tabulation Matrix */}
            <Card className="border-slate-200/60 print:border print:border-black print:shadow-none print:rounded-none">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table className="text-sm print:text-xs">
                    <TableHeader>
                      <TableRow className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-600 hover:to-teal-600 print:bg-emerald-700">
                        <TableHead className="text-white text-center min-w-[50px] sticky left-0 bg-emerald-600 z-10">#</TableHead>
                        <TableHead className="text-white min-w-[160px] sticky left-[50px] bg-emerald-600 z-10">
                          Students &#8595; | Subjects &#10148;
                        </TableHead>
                        {data.subjects.map(subject => (
                          <TableHead key={subject.subject_id} className="text-white text-center min-w-[80px]">
                            <span className="text-xs">{subject.name.length <= 4 ? subject.name.toUpperCase() : subject.name}</span>
                            <br /><span className="text-emerald-200 text-[10px]">Avg: {data.subjectAvgs[subject.subject_id] || 0}</span>
                          </TableHead>
                        ))}
                        <TableHead className="text-white text-center min-w-[80px] bg-teal-600 z-10">Total</TableHead>
                        <TableHead className="text-white text-center min-w-[80px] bg-teal-600 z-10">Grade</TableHead>
                        <TableHead className="text-white text-center min-w-[60px] bg-teal-700 z-10">Position</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.students.map((student, idx) => {
                        const total = data.studentTotals.find(t => t.student_id === student.student_id)?.total || 0
                        const position = data.positionMap[student.student_id] || '\u2014'
                        const grade = getGrade(total)
                        return (
                          <TableRow key={student.student_id} className={`hover:bg-slate-50 print:hover:bg-transparent ${position === 1 ? 'bg-emerald-50/30' : ''}`}>
                            <TableCell className="text-center text-slate-500 sticky left-0 bg-white z-10 print:bg-white">{idx + 1}</TableCell>
                            <TableCell className="font-semibold text-slate-900 whitespace-nowrap sticky left-[50px] bg-white z-10 print:bg-white print:font-medium">
                              {student.name}
                              {getPositionIcon(position as number)}
                            </TableCell>
                            {data.subjects.map(subject => {
                              const mark = data.studentMarks[student.student_id]?.[subject.subject_id] || 0
                              const subjectGrade = getGrade(mark)
                              return (
                                <TableCell key={subject.subject_id} className="text-center p-1">
                                  <div>
                                    {mark > 0 ? (
                                      <span className={`font-semibold ${mark >= 50 ? 'text-slate-900' : 'text-red-600'}`}>{mark}</span>
                                    ) : <span className="text-slate-300">{'\u2014'}</span>}
                                    {subjectGrade && (
                                      <div className="text-[10px] text-slate-400 hidden xl:block">{subjectGrade.name}</div>
                                    )}
                                  </div>
                                </TableCell>
                              )
                            })}
                            <TableCell className="text-center font-bold text-slate-900 bg-slate-50 print:bg-slate-100">
                              {total > 0 ? total : <span className="text-slate-300">0</span>}
                            </TableCell>
                            <TableCell className="text-center bg-slate-50 print:bg-slate-100">
                              {grade ? <Badge variant="outline" className={`text-xs font-bold ${getGradeColor(grade.name)} print:text-[10px]`}>{grade.name}</Badge> : <span className="text-slate-300">{'\u2014'}</span>}
                            </TableCell>
                            <TableCell className="text-center bg-slate-50 print:bg-slate-100">
                              <span className={`font-bold ${position === 1 ? 'text-emerald-600' : position <= 3 ? 'text-blue-600' : 'text-slate-600'}`}>
                                {position}
                              </span>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                      {/* Average Row */}
                      <TableRow className="bg-slate-100 font-semibold hover:bg-slate-100 print:bg-slate-200">
                        <TableCell className="text-center sticky left-0 bg-slate-100 z-10 print:bg-slate-200">{'\u2014'}</TableCell>
                        <TableCell className="sticky left-[50px] bg-slate-100 z-10 print:bg-slate-200">Class Average</TableCell>
                        {data.subjects.map(subject => (
                          <TableCell key={subject.subject_id} className="text-center print:bg-slate-200">
                            {data.subjectAvgs[subject.subject_id] || '\u2014'}
                          </TableCell>
                        ))}
                        <TableCell className="text-center bg-slate-200 print:bg-slate-300">{classAvg}</TableCell>
                        <TableCell className="bg-slate-200 print:bg-slate-300" />
                        <TableCell className="bg-slate-200 print:bg-slate-300" />
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* CI3: Print Button */}
            <div className="flex justify-center mt-6 print:hidden">
              <Button onClick={handlePrint} className="bg-emerald-600 hover:bg-emerald-700 min-h-[44px] px-8 shadow-lg">
                <Printer className="w-4 h-4 mr-2" />Print Tabulation Sheet
              </Button>
            </div>
          </div>
        </>
      ) : !initialLoading ? (
        <Card className="border-slate-200/60 print:hidden">
          <CardContent className="flex flex-col items-center justify-center py-20">
            <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center mb-4"><Table2 className="w-10 h-10 text-emerald-300" /></div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Tabulation Sheet</h3>
            <p className="text-sm text-slate-500 text-center max-w-md">Select a class, academic year, and exam to generate a class-wide tabulation sheet with student rankings, subject averages, and grades.</p>
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
