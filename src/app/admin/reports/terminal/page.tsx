'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import {
  FileBarChart, Download, Printer, ArrowLeft, Loader2, Trophy,
  Users, BookOpen, Award, TrendingUp,
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
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { toast } from 'sonner'

// ===== Types =====
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

interface Subject {
  subject_id: number
  name: string
}

interface SubjectStats {
  subject_id: number
  name: string
  highest: number
  lowest: number
  average: number
}

interface ClassItem {
  class_id: number
  name: string
  category: string
}

// ===== Full Page Skeleton =====
function TerminalSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Skeleton className="w-11 h-11 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-48 rounded-lg" />
            <Skeleton className="h-4 w-64 rounded-lg" />
          </div>
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-11 w-28 rounded-lg" />
          <Skeleton className="h-11 w-32 rounded-lg" />
        </div>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-11 rounded-lg" />
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="border-l-4 border-l-slate-200">
            <CardContent className="p-3"><Skeleton className="h-16 w-full" /></CardContent>
          </Card>
        ))}
      </div>
      <Card className="border-slate-200/60">
        <CardContent className="p-6">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-lg mb-3" />)}
        </CardContent>
      </Card>
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
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [students, setStudents] = useState<StudentReport[]>([])
  const [subjectStats, setSubjectStats] = useState<SubjectStats[]>([])
  const [loading, setLoading] = useState(false)

  const [selectedClassId, setSelectedClassId] = useState('')
  const [selectedTerm, setSelectedTerm] = useState('Term 1')
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString())

  useEffect(() => {
    fetch('/api/classes')
      .then(r => r.json())
      .then(data => setClasses(Array.isArray(data) ? data : []))
      .catch(() => {})
  }, [])

  const generateReport = useCallback(async () => {
    if (!selectedClassId) {
      toast.error('Please select a class')
      return
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
    } catch {
      toast.error('Failed to generate report')
    }
    setLoading(false)
  }, [selectedClassId, selectedTerm, selectedYear])

  const handlePrint = () => {
    window.print()
  }

  const getGradeColor = (grade: string): string => {
    if (grade.startsWith('A')) return 'bg-emerald-100 text-emerald-700'
    if (grade.startsWith('B')) return 'bg-sky-100 text-sky-700'
    if (grade.startsWith('C')) return 'bg-amber-100 text-amber-700'
    if (grade.startsWith('D')) return 'bg-orange-100 text-orange-700'
    if (grade.startsWith('E') || grade.startsWith('F')) return 'bg-red-100 text-red-700'
    return 'bg-slate-100 text-slate-700'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <Button asChild variant="outline" size="icon" className="min-h-[44px] min-w-[44px] print:hidden">
            <Link href="/admin/exams">
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Terminal Reports</h1>
            <p className="text-sm text-slate-500 mt-1">Generate and print student terminal reports</p>
          </div>
        </div>
        <div className="flex items-center gap-2 print:hidden">
          <Button asChild variant="outline" className="min-h-[44px]">
            <Link href="/admin/reports/broadsheet">
              <BookOpen className="w-4 h-4 mr-2" /> Broadsheet
            </Link>
          </Button>
          {students.length > 0 && (
            <>
              <Button onClick={handlePrint} variant="outline" className="min-h-[44px]">
                <Printer className="w-4 h-4 mr-2" /> Print
              </Button>
              <Button onClick={handlePrint} className="bg-emerald-600 hover:bg-emerald-700 min-h-[44px]">
                <FileBarChart className="w-4 h-4 mr-2" /> Print All
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card className="border-slate-200/60 print:hidden">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-600">Class</label>
              <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                <SelectTrigger className="min-h-[44px]"><SelectValue placeholder="Select class" /></SelectTrigger>
                <SelectContent>
                  {classes.map(c => <SelectItem key={c.class_id} value={c.class_id.toString()}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-600">Term</label>
              <Select value={selectedTerm} onValueChange={setSelectedTerm}>
                <SelectTrigger className="min-h-[44px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Term 1">Term 1</SelectItem>
                  <SelectItem value="Term 2">Term 2</SelectItem>
                  <SelectItem value="Term 3">Term 3</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-600">Year</label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="min-h-[44px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[2024, 2025, 2026, 2027].map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}
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
          <Card className="border-slate-200/60">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
                <FileBarChart className="w-7 h-7 text-slate-300" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-1">No Report Generated</h3>
              <p className="text-sm text-slate-500">Select a class and generate a report</p>
              <Button
                variant="outline"
                className="mt-4 min-h-[44px] text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                onClick={() => document.querySelector<HTMLButtonElement>('button')?.scrollIntoView({ behavior: 'smooth' })}
              >
                <FileBarChart className="w-4 h-4 mr-2" /> Select Class & Generate
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Report Header */}
            <div className="print:mb-4 hidden print:block text-center">
              <h2 className="text-xl font-bold">SCHOOL TERMINAL REPORT</h2>
              <p className="text-sm">{classes.find(c => c.class_id.toString() === selectedClassId)?.name} | {selectedTerm} | {selectedYear}</p>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 print:hidden">
              <Card className="border-l-4 border-l-emerald-500 hover:shadow-sm transition-all hover:-translate-y-0.5">
                <CardContent className="p-3 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-500 flex items-center justify-center flex-shrink-0">
                    <Users className="w-4 h-4 text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">Students</p>
                    <p className="text-lg font-bold text-slate-900 tabular-nums">{students.length}</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-sky-500 hover:shadow-sm transition-all hover:-translate-y-0.5">
                <CardContent className="p-3 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-sky-500 flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-4 h-4 text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">Subjects</p>
                    <p className="text-lg font-bold text-slate-900 tabular-nums">{subjects.length}</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-amber-500 hover:shadow-sm transition-all hover:-translate-y-0.5">
                <CardContent className="p-3 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-amber-500 flex items-center justify-center flex-shrink-0">
                    <Trophy className="w-4 h-4 text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">Top Student</p>
                    <p className="text-sm font-bold text-slate-900 truncate">{students[0]?.name || '—'}</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-violet-500 hover:shadow-sm transition-all hover:-translate-y-0.5">
                <CardContent className="p-3 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-violet-500 flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="w-4 h-4 text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">Class Avg</p>
                    <p className="text-lg font-bold text-slate-900 tabular-nums">
                      {students.length > 0 ? Math.round(students.reduce((a, b) => a + b.average, 0) / students.length * 10) / 10 : '—'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Report Table */}
            <Card className="border-slate-200/60">
              <CardContent className="p-0">
                <div className="overflow-x-auto max-h-[600px] overflow-y-auto custom-scrollbar">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50 hover:bg-slate-50">
                        <TableHead className="w-[50px] sticky left-0 bg-slate-50 z-10">#</TableHead>
                        <TableHead className="min-w-[180px] sticky left-[50px] bg-slate-50 z-10">Student</TableHead>
                        {subjects.map(s => (
                          <TableHead key={s.subject_id} className="min-w-[70px] text-center text-xs">
                            {s.name}
                          </TableHead>
                        ))}
                        <TableHead className="text-center min-w-[70px]">Total</TableHead>
                        <TableHead className="text-center min-w-[60px]">Avg</TableHead>
                        <TableHead className="text-center min-w-[60px]">Grade</TableHead>
                        <TableHead className="text-center min-w-[50px]">Pos</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {students.map((student, idx) => (
                        <TableRow key={student.student_id} className={idx === 0 ? 'bg-emerald-50/50' : 'hover:bg-slate-50'}>
                          <TableCell className="text-sm text-slate-500 sticky left-0 bg-white z-10">{idx + 1}</TableCell>
                          <TableCell className="font-medium text-sm text-slate-900 sticky left-[50px] bg-white z-10">
                            {student.name}
                            {idx === 0 && <Trophy className="w-3 h-3 inline ml-1 text-amber-500" />}
                          </TableCell>
                          {subjects.map(s => {
                            const mark = student.marks[s.subject_id] || 0
                            return (
                              <TableCell key={s.subject_id} className="text-center text-sm tabular-nums">
                                {mark > 0 ? (
                                  <span className={mark >= 50 ? 'text-emerald-700 font-medium' : 'text-red-600'}>
                                    {mark}
                                  </span>
                                ) : (
                                  <span className="text-slate-300">—</span>
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
                              <span className="text-xs text-slate-400">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center font-bold text-sm">
                            {student.rank}
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
                            <TableCell className="text-center">
                              <Badge className="bg-emerald-100 text-emerald-700">{s.highest}</Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge className="bg-red-100 text-red-700">{s.lowest}</Badge>
                            </TableCell>
                            <TableCell className="text-center font-medium text-sm tabular-nums">{s.average}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Teacher Comments Section */}
            <Card className="border-slate-200/60 print:hidden">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center">
                    <FileBarChart className="w-4 h-4 text-violet-600" />
                  </div>
                  Teacher Comments
                </CardTitle>
                <CardDescription>Optional comments for the terminal report</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <label className="text-xs font-medium text-slate-600">Class Teacher Comment</label>
                    <Textarea placeholder="Enter class teacher's general comment..." rows={2} />
                  </div>
                  <div className="grid gap-2">
                    <label className="text-xs font-medium text-slate-600">Head Teacher Comment</label>
                    <Textarea placeholder="Enter head teacher's comment..." rows={2} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}
