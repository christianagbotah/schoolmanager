'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { useToast } from '@/hooks/use-toast'
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

// ===== Main =====
export default function TerminalReportPage() {
  return (
    <DashboardLayout>
      <TerminalReportModule />
    </DashboardLayout>
  )
}

function TerminalReportModule() {
  const { toast } = useToast()
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
      toast({ title: 'Error', description: 'Please select a class', variant: 'destructive' })
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
      toast({ title: 'Error', description: 'Failed to generate report', variant: 'destructive' })
    }
    setLoading(false)
  }, [selectedClassId, selectedTerm, selectedYear, toast])

  const handlePrint = () => {
    window.print()
  }

  const getGradeColor = (grade: string): string => {
    if (grade.startsWith('A')) return 'bg-emerald-100 text-emerald-700'
    if (grade.startsWith('B')) return 'bg-blue-100 text-blue-700'
    if (grade.startsWith('C')) return 'bg-amber-100 text-amber-700'
    if (grade.startsWith('D')) return 'bg-orange-100 text-orange-700'
    if (grade.startsWith('E') || grade.startsWith('F')) return 'bg-red-100 text-red-700'
    return 'bg-slate-100 text-slate-700'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/admin/exams">
            <Button variant="outline" size="icon" className="min-h-[44px] min-w-[44px] print:hidden">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Terminal Reports</h1>
            <p className="text-sm text-slate-500 mt-1">Generate and print student terminal reports</p>
          </div>
        </div>
        <div className="flex items-center gap-2 print:hidden">
          <Link href="/admin/reports/broadsheet">
            <Button variant="outline" className="min-h-[44px]">
              <BookOpen className="w-4 h-4 mr-2" /> Broadsheet
            </Button>
          </Link>
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
          <Card className="border-slate-200/60">
            <CardContent className="p-6 space-y-4">
              {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}
            </CardContent>
          </Card>
        ) : students.length === 0 ? (
          <Card className="border-slate-200/60">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <FileBarChart className="w-12 h-12 text-slate-300 mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-1">No Report Generated</h3>
              <p className="text-sm text-slate-500">Select a class and generate a report</p>
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
              <Card className="border-slate-200 bg-emerald-50/50">
                <CardContent className="p-3 text-center">
                  <Users className="w-5 h-5 mx-auto mb-1 text-emerald-600" />
                  <p className="text-lg font-bold text-emerald-700">{students.length}</p>
                  <p className="text-xs text-emerald-600">Students</p>
                </CardContent>
              </Card>
              <Card className="border-slate-200 bg-blue-50/50">
                <CardContent className="p-3 text-center">
                  <BookOpen className="w-5 h-5 mx-auto mb-1 text-blue-600" />
                  <p className="text-lg font-bold text-blue-700">{subjects.length}</p>
                  <p className="text-xs text-blue-600">Subjects</p>
                </CardContent>
              </Card>
              <Card className="border-slate-200 bg-amber-50/50">
                <CardContent className="p-3 text-center">
                  <Trophy className="w-5 h-5 mx-auto mb-1 text-amber-600" />
                  <p className="text-lg font-bold text-amber-700">{students[0]?.name || '—'}</p>
                  <p className="text-xs text-amber-600">Top Student</p>
                </CardContent>
              </Card>
              <Card className="border-slate-200 bg-purple-50/50">
                <CardContent className="p-3 text-center">
                  <TrendingUp className="w-5 h-5 mx-auto mb-1 text-purple-600" />
                  <p className="text-lg font-bold text-purple-700">
                    {students.length > 0 ? Math.round(students.reduce((a, b) => a + b.average, 0) / students.length * 10) / 10 : '—'}
                  </p>
                  <p className="text-xs text-purple-600">Class Average</p>
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
                  <CardTitle className="text-lg">Subject Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto rounded-lg border border-slate-200">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50 hover:bg-slate-50">
                          <TableHead>Subject</TableHead>
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
                <CardTitle className="text-lg">Teacher Comments</CardTitle>
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
