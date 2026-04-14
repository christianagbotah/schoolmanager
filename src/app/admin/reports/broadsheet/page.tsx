'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { useToast } from '@/hooks/use-toast'
import {
  Table2, ArrowLeft, Loader2, Printer, Download, FileBarChart,
  TrendingUp, Trophy, Users, BookOpen,
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
  rank: number
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
export default function BroadsheetPage() {
  return (
    <DashboardLayout>
      <BroadsheetModule />
    </DashboardLayout>
  )
}

function BroadsheetModule() {
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

  const generateBroadsheet = useCallback(async () => {
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
      toast({ title: 'Error', description: 'Failed to generate broadsheet', variant: 'destructive' })
    }
    setLoading(false)
  }, [selectedClassId, selectedTerm, selectedYear, toast])

  const handlePrint = () => window.print()

  const exportCSV = () => {
    if (students.length === 0) return
    const headers = ['#', 'Student Code', 'Name', ...subjects.map(s => s.name), 'Total', 'Average', 'Grade', 'Position']
    const rows = students.map((s, i) => [
      i + 1, s.student_code, s.name,
      ...subjects.map(sub => s.marks[sub.subject_id] || ''),
      s.total_score, s.average, s.grade, s.rank,
    ])
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `broadsheet_${selectedClassId}_${selectedYear}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button asChild variant="outline" size="icon" className="min-h-[44px] min-w-[44px] print:hidden">
            <Link href="/admin/exams">
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Broadsheet / Tabulation</h1>
            <p className="text-sm text-slate-500 mt-1">Class-wide mark summary with statistics</p>
          </div>
        </div>
        <div className="flex items-center gap-2 print:hidden">
          <Button asChild variant="outline" className="min-h-[44px]">
            <Link href="/admin/reports/terminal">
              <FileBarChart className="w-4 h-4 mr-2" /> Terminal Reports
            </Link>
          </Button>
          {students.length > 0 && (
            <>
              <Button onClick={exportCSV} variant="outline" className="min-h-[44px]">
                <Download className="w-4 h-4 mr-2" /> CSV
              </Button>
              <Button onClick={handlePrint} className="bg-emerald-600 hover:bg-emerald-700 min-h-[44px]">
                <Printer className="w-4 h-4 mr-2" /> Print
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
              <Button onClick={generateBroadsheet} className="bg-emerald-600 hover:bg-emerald-700 w-full min-h-[44px]" disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Table2 className="w-4 h-4 mr-2" />}
                Generate
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content */}
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
              <Table2 className="w-12 h-12 text-slate-300 mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-1">No Broadsheet Generated</h3>
              <p className="text-sm text-slate-500">Select a class and generate a broadsheet</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Print Header */}
            <div className="print:mb-4 hidden print:block text-center">
              <h2 className="text-xl font-bold">CLASS BROADSHEET</h2>
              <p className="text-sm">{classes.find(c => c.class_id.toString() === selectedClassId)?.name} | {selectedTerm} | {selectedYear}</p>
            </div>

            {/* Summary Stats */}
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
                  <p className="text-xs text-amber-600">Top: {students[0]?.total_score || 0}</p>
                </CardContent>
              </Card>
              <Card className="border-slate-200 bg-purple-50/50">
                <CardContent className="p-3 text-center">
                  <TrendingUp className="w-5 h-5 mx-auto mb-1 text-purple-600" />
                  <p className="text-lg font-bold text-purple-700">
                    {Math.round(students.reduce((a, b) => a + b.average, 0) / students.length * 10) / 10}
                  </p>
                  <p className="text-xs text-purple-600">Class Avg</p>
                </CardContent>
              </Card>
            </div>

            {/* Broadsheet Table */}
            <Card className="border-slate-200/60">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50 hover:bg-slate-50">
                        <TableHead className="w-[40px] sticky left-0 bg-slate-50 z-10">#</TableHead>
                        <TableHead className="min-w-[160px] sticky left-[40px] bg-slate-50 z-10">Student</TableHead>
                        {subjects.map(s => (
                          <TableHead key={s.subject_id} className="min-w-[65px] text-center text-xs font-medium">
                            {s.name}
                          </TableHead>
                        ))}
                        <TableHead className="text-center font-bold bg-emerald-50 min-w-[65px]">Total</TableHead>
                        <TableHead className="text-center font-bold bg-blue-50 min-w-[55px]">Avg</TableHead>
                        <TableHead className="text-center min-w-[50px]">Grade</TableHead>
                        <TableHead className="text-center font-bold min-w-[40px]">#</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {students.map((student, idx) => (
                        <TableRow key={student.student_id} className={idx === 0 ? 'bg-amber-50/30' : 'hover:bg-slate-50'}>
                          <TableCell className="text-sm text-slate-500 sticky left-0 bg-white z-10">{idx + 1}</TableCell>
                          <TableCell className="font-medium text-sm sticky left-[40px] bg-white z-10 min-w-[160px]">
                            <div className="flex items-center gap-1.5">
                              {student.rank <= 3 && (
                                <span className={`text-xs ${student.rank === 1 ? 'text-amber-500' : student.rank === 2 ? 'text-slate-400' : 'text-orange-600'}`}>
                                  {student.rank === 1 ? '🥇' : student.rank === 2 ? '🥈' : '🥉'}
                                </span>
                              )}
                              {student.name}
                            </div>
                          </TableCell>
                          {subjects.map(s => {
                            const mark = student.marks[s.subject_id] || 0
                            return (
                              <TableCell key={s.subject_id} className="text-center text-sm tabular-nums px-2">
                                {mark > 0 ? mark : <span className="text-slate-300">—</span>}
                              </TableCell>
                            )
                          })}
                          <TableCell className="text-center font-bold text-sm bg-emerald-50/50 tabular-nums">
                            {student.total_score}
                          </TableCell>
                          <TableCell className="text-center text-sm bg-blue-50/50 tabular-nums">
                            {student.average}
                          </TableCell>
                          <TableCell className="text-center">
                            {student.grade ? (
                              <Badge className={`text-[10px] ${student.average >= 50 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                {student.grade}
                              </Badge>
                            ) : '—'}
                          </TableCell>
                          <TableCell className="text-center font-bold text-sm">{student.rank}</TableCell>
                        </TableRow>
                      ))}

                      {/* Subject Stats Row */}
                      {subjectStats.length > 0 && (
                        <>
                          <TableRow className="bg-slate-100 hover:bg-slate-100 border-t-2 border-slate-300">
                            <TableCell colSpan={2} className="font-semibold text-sm text-slate-700 sticky left-0 bg-slate-100 z-10">HIGHEST</TableCell>
                            {subjectStats.map(s => (
                              <TableCell key={`h-${s.subject_id}`} className="text-center text-sm font-bold text-emerald-700 tabular-nums">
                                {s.highest || '—'}
                              </TableCell>
                            ))}
                            <TableCell colSpan={4} />
                          </TableRow>
                          <TableRow className="bg-slate-50 hover:bg-slate-50">
                            <TableCell colSpan={2} className="font-semibold text-sm text-slate-700 sticky left-0 bg-slate-50 z-10">LOWEST</TableCell>
                            {subjectStats.map(s => (
                              <TableCell key={`l-${s.subject_id}`} className="text-center text-sm font-bold text-red-600 tabular-nums">
                                {s.lowest || '—'}
                              </TableCell>
                            ))}
                            <TableCell colSpan={4} />
                          </TableRow>
                          <TableRow className="bg-slate-100 hover:bg-slate-100 border-t-2 border-slate-300">
                            <TableCell colSpan={2} className="font-semibold text-sm text-slate-700 sticky left-0 bg-slate-100 z-10">AVERAGE</TableCell>
                            {subjectStats.map(s => (
                              <TableCell key={`a-${s.subject_id}`} className="text-center text-sm font-bold text-blue-700 tabular-nums">
                                {s.average || '—'}
                              </TableCell>
                            ))}
                            <TableCell colSpan={4} />
                          </TableRow>
                        </>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}
