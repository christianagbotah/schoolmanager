'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useToast } from '@/hooks/use-toast'
import {
  ArrowLeft, Loader2, Table2, Printer, Search, Award, GraduationCap,
  BarChart3, Users,
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
import { Label } from '@/components/ui/label'
import { DashboardLayout } from '@/components/layout/dashboard-layout'

// ===== Types =====
interface TabulationClass {
  class_id: number
  name: string
  name_numeric: number
  category: string
}

interface TabulationExam {
  exam_id: number
  name: string
  type: string
  date: string | null
  year: string
}

interface TabulationSubject {
  subject_id: number
  name: string
}

interface TabulationStudent {
  student_id: number
  name: string
  student_code: string
}

interface GradeScale {
  grade_id: number
  name: string
  grade_from: number
  grade_to: number
}

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

interface ClassItem {
  class_id: number
  name: string
  name_numeric: number
}

interface ExamItem {
  exam_id: number
  name: string
  year: string
}

// ===== Main =====
export default function TabulationPage() {
  return (
    <DashboardLayout>
      <TabulationModule />
    </DashboardLayout>
  )
}

function TabulationModule() {
  const { toast } = useToast()

  // Dropdown data
  const [classes, setClasses] = useState<ClassItem[]>([])
  const [exams, setExams] = useState<ExamItem[]>([])
  const [years, setYears] = useState<string[]>([])

  // Selections
  const [selectedClassId, setSelectedClassId] = useState('')
  const [selectedExamId, setSelectedExamId] = useState('')
  const [selectedYear, setSelectedYear] = useState('')

  // Tabulation data
  const [data, setData] = useState<TabulationData | null>(null)
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)

  // Fetch classes and exams on mount
  useEffect(() => {
    Promise.all([
      fetch('/api/classes').then(r => r.json()),
      fetch('/api/exams').then(r => r.json()),
    ]).then(([classesData, examsData]) => {
      const classList = Array.isArray(classesData) ? classesData : []
      setClasses(classList)

      const examsList = Array.isArray(examsData) ? examsData : (examsData.exams || [])
      setExams(examsList)

      // Extract unique years
      const uniqueYears = [...new Set(examsList.map(e => e.year).filter(Boolean))]
      setYears(uniqueYears.sort().reverse())

      // Set current year as default
      const currentYear = new Date().getFullYear().toString()
      if (uniqueYears.includes(currentYear)) setSelectedYear(currentYear)
      else if (uniqueYears.length > 0) setSelectedYear(uniqueYears[0])
    }).catch(() => {}).finally(() => setInitialLoading(false))
  }, [])

  // Filter exams by year
  const filteredExams = selectedYear
    ? exams.filter(e => e.year === selectedYear)
    : exams

  // When all selections made, fetch tabulation
  const fetchTabulation = useCallback(async () => {
    if (!selectedClassId || !selectedExamId) {
      setData(null)
      return
    }

    setLoading(true)
    try {
      const params = new URLSearchParams({
        class_id: selectedClassId,
        exam_id: selectedExamId,
      })
      const res = await fetch(`/api/admin/exams/tabulation?${params.toString()}`)
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to fetch tabulation')
      }
      const tabData = await res.json()
      setData(tabData)
    } catch (err) {
      toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' })
      setData(null)
    }
    setLoading(false)
  }, [selectedClassId, selectedExamId, toast])

  useEffect(() => {
    fetchTabulation()
  }, [fetchTabulation])

  const getGrade = (mark: number): { name: string } | null => {
    if (mark <= 0 || !data) return null
    const grade = data.grades.find(g => mark >= g.grade_from && mark <= g.grade_to)
    return grade ? { name: grade.name } : null
  }

  const getGradeColor = (name: string): string => {
    const n = name.toLowerCase()
    if (n.startsWith('a') || n.startsWith('1')) return 'bg-emerald-100 text-emerald-700'
    if (n.startsWith('b') || n.startsWith('2')) return 'bg-blue-100 text-blue-700'
    if (n.startsWith('c') || n.startsWith('3')) return 'bg-amber-100 text-amber-700'
    if (n.startsWith('d') || n.startsWith('4')) return 'bg-orange-100 text-orange-700'
    return 'bg-red-100 text-red-700'
  }

  // Stats
  const highestTotal = data && data.studentTotals.length > 0 ? Math.max(...data.studentTotals.map(s => s.total)) : 0
  const lowestTotal = data && data.studentTotals.length > 0 ? Math.min(...data.studentTotals.map(s => s.total)) : 0
  const classAvg = data && data.studentTotals.length > 0
    ? (data.studentTotals.reduce((a, b) => a + b.total, 0) / data.studentTotals.length).toFixed(1)
    : '0'

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
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              <Table2 className="w-6 h-6 inline-block mr-2 text-emerald-600" />
              Tabulation Sheet
            </h1>
            <p className="text-sm text-slate-500 mt-1">View class-wide examination results matrix</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" className="min-h-[44px]" size="sm">
            <Link href="/admin/marks">
              <GraduationCap className="w-4 h-4 mr-2" /> Mark Entry
            </Link>
          </Button>
          {data && (
            <Button className="bg-emerald-600 hover:bg-emerald-700 min-h-[44px]" size="sm" disabled>
              <Printer className="w-4 h-4 mr-2" /> Print
            </Button>
          )}
        </div>
      </div>

      {/* Selector Row matching CI3 tabulation_sheet.php */}
      <Card className="border-slate-200/60">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600 uppercase">Class</Label>
              <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                <SelectTrigger className="min-h-[52px] text-lg font-bold uppercase">
                  <SelectValue placeholder="Select a Class" />
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
              <Label className="text-xs font-semibold text-slate-600 uppercase">Academic Year</Label>
              <Select value={selectedYear} onValueChange={v => { setSelectedYear(v); setSelectedExamId('') }}>
                <SelectTrigger className="min-h-[52px] text-lg font-bold">
                  <SelectValue placeholder="Select Year" />
                </SelectTrigger>
                <SelectContent>
                  {years.map(y => (
                    <SelectItem key={y} value={y} className="font-bold">{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600 uppercase">Exam</Label>
              <Select value={selectedExamId} onValueChange={setSelectedExamId}>
                <SelectTrigger className="min-h-[52px] text-lg font-bold uppercase">
                  <SelectValue placeholder={selectedYear ? 'Select an Exam' : 'Select Year First'} />
                </SelectTrigger>
                <SelectContent>
                  {filteredExams.map(e => (
                    <SelectItem key={e.exam_id} value={e.exam_id.toString()} className="font-bold uppercase">
                      {e.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button
                onClick={fetchTabulation}
                className="w-full min-h-[52px] bg-emerald-600 hover:bg-emerald-700 text-base font-semibold"
                disabled={!selectedClassId || !selectedExamId}
              >
                <Table2 className="w-5 h-5 mr-2" />
                View Tabulation Sheet
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Info Banner matching CI3 tabulation header */}
      {data && (
        <Card className="border-emerald-200 bg-emerald-50/50">
          <CardContent className="p-4 text-center">
            <h3 className="text-lg font-semibold text-slate-800">
              Exam Tabulation Sheet
            </h3>
            <h4 className="text-sm text-slate-600">
              {data.class.name} {data.class.name_numeric} | {data.exam.name}
            </h4>
            <h4 className="text-xs text-slate-500">
              Academic Year: {data.exam.year}
            </h4>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      {data && data.students.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-xl border border-slate-200 bg-emerald-50 p-3 text-center">
            <p className="text-lg font-bold text-emerald-700">{data.students.length}</p>
            <p className="text-xs text-emerald-600 font-medium">Students</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-blue-50 p-3 text-center">
            <p className="text-lg font-bold text-blue-700">{data.subjects.length}</p>
            <p className="text-xs text-blue-600 font-medium">Subjects</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-amber-50 p-3 text-center">
            <p className="text-lg font-bold text-amber-700">{highestTotal}</p>
            <p className="text-xs text-amber-600 font-medium">Highest Total</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-center">
            <p className="text-lg font-bold text-slate-700">{classAvg}</p>
            <p className="text-xs text-slate-600 font-medium">Class Average</p>
          </div>
        </div>
      )}

      {/* Tabulation Matrix Table matching CI3 */}
      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-16 w-full rounded-lg" />
          <Skeleton className="h-12 w-full rounded-lg" />
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}
        </div>
      ) : data && data.students.length === 0 ? (
        <Card className="border-slate-200/60">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
              <Users className="w-8 h-8 text-slate-300" />
            </div>
            <p className="text-sm font-medium text-slate-500">No students found for this class in the selected exam</p>
          </CardContent>
        </Card>
      ) : data && data.subjects.length === 0 ? (
        <Card className="border-slate-200/60">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
              <BarChart3 className="w-8 h-8 text-slate-300" />
            </div>
            <p className="text-sm font-medium text-slate-500">No subjects found for this class</p>
            <p className="text-xs text-slate-400 mt-1">Add subjects to this class first</p>
          </CardContent>
        </Card>
      ) : data ? (
        <Card className="border-slate-200/60">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table className="text-sm">
                <TableHeader>
                  <TableRow className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-600 hover:to-teal-600">
                    <TableHead className="text-white text-center min-w-[50px] sticky left-0 bg-emerald-600 z-10">
                      #
                    </TableHead>
                    <TableHead className="text-white min-w-[160px] sticky left-[50px] bg-emerald-600 z-10" colSpan={2}>
                      Students
                    </TableHead>
                    {data.subjects.map(subject => (
                      <TableHead key={subject.subject_id} className="text-white text-center min-w-[80px]">
                        <span className="text-xs">
                          {subject.name.length <= 4 ? subject.name.toUpperCase() : subject.name}
                        </span>
                        <br />
                        <span className="text-emerald-200 text-[10px]">
                          Avg: {data.subjectAvgs[subject.subject_id] || 0}
                        </span>
                      </TableHead>
                    ))}
                    <TableHead className="text-white text-center min-w-[80px] bg-teal-600 z-10">
                      Total
                    </TableHead>
                    <TableHead className="text-white text-center min-w-[80px] bg-teal-700 z-10">
                      Grade
                    </TableHead>
                    <TableHead className="text-white text-center min-w-[60px] bg-teal-800 z-10">
                      Position
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.students.map((student, idx) => {
                    const total = data.studentTotals.find(t => t.student_id === student.student_id)?.total || 0
                    const position = data.positionMap[student.student_id] || '—'
                    const grade = getGrade(total)

                    return (
                      <TableRow key={student.student_id} className="hover:bg-slate-50">
                        <TableCell className="text-center text-slate-500 sticky left-0 bg-white z-10">
                          {idx + 1}
                        </TableCell>
                        <TableCell className="font-semibold text-slate-900 whitespace-nowrap sticky left-[50px] bg-white z-10">
                          {student.name}
                        </TableCell>
                        <TableCell className="text-xs text-slate-400 font-mono whitespace-nowrap sticky left-[210px] bg-white z-10 hidden lg:table-cell">
                          {student.student_code}
                        </TableCell>
                        {data.subjects.map(subject => {
                          const mark = data.studentMarks[student.student_id]?.[subject.subject_id] || 0
                          const markGrade = getGrade(mark)
                          return (
                            <TableCell key={subject.subject_id} className="text-center">
                              {mark > 0 ? (
                                <span className={`font-semibold ${mark >= 50 ? 'text-slate-900' : 'text-red-600'}`}>
                                  {mark}
                                </span>
                              ) : (
                                <span className="text-slate-300">—</span>
                              )}
                            </TableCell>
                          )
                        })}
                        <TableCell className="text-center font-bold text-slate-900 bg-slate-50">
                          {total > 0 ? total : <span className="text-slate-300">0</span>}
                        </TableCell>
                        <TableCell className="text-center bg-slate-50">
                          {grade ? (
                            <Badge variant="outline" className={`text-xs font-bold ${getGradeColor(grade.name)}`}>
                              {grade.name}
                            </Badge>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center bg-slate-50">
                          <span className={`font-bold ${position === 1 ? 'text-emerald-600' : position <= 3 ? 'text-blue-600' : 'text-slate-600'}`}>
                            {position}
                          </span>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                  {/* Average Row */}
                  <TableRow className="bg-slate-100 font-semibold hover:bg-slate-100">
                    <TableCell className="text-center sticky left-0 bg-slate-100 z-10">—</TableCell>
                    <TableCell className="sticky left-[50px] bg-slate-100 z-10" colSpan={2}>Class Average</TableCell>
                    {data.subjects.map(subject => (
                      <TableCell key={subject.subject_id} className="text-center">
                        {data.subjectAvgs[subject.subject_id] || '—'}
                      </TableCell>
                    ))}
                    <TableCell className="text-center bg-slate-200">
                      {classAvg}
                    </TableCell>
                    <TableCell className="bg-slate-200" />
                    <TableCell className="bg-slate-200" />
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* Empty state when no selection */}
      {!data && !loading && (
        <Card className="border-slate-200/60">
          <CardContent className="flex flex-col items-center justify-center py-20">
            <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center mb-4">
              <Table2 className="w-10 h-10 text-emerald-300" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Tabulation Sheet</h3>
            <p className="text-sm text-slate-500 text-center max-w-md">
              Select a class, academic year, and exam to generate a class-wide tabulation sheet with student rankings, subject averages, and grades.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
