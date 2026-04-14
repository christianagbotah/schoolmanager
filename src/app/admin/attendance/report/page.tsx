'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { useToast } from '@/hooks/use-toast'
import {
  FileBarChart, Calendar, Download, ArrowLeft, Users, CheckCircle,
  XCircle, TrendingUp, Loader2,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { DashboardLayout } from '@/components/layout/dashboard-layout'

// ===== Types =====
interface StudentSummary {
  student_id: number
  student_code: string
  name: string
  total_days: number
  present: number
  absent: number
  late: number
  sick: number
  excused: number
  percentage: number
}

interface ClassSummary {
  class_id: number
  class_name: string
  section_name: string
  total_students: number
  avg_attendance: number
  total_present: number
  total_absent: number
}

interface AttendanceRecord {
  attendance_id: number
  student_id: number
  student: { student_id: number; student_code: string; name: string; first_name: string; last_name: string }
  status: string
  timestamp: string | null
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

// ===== Main Component =====
export default function AttendanceReportPage() {
  return (
    <DashboardLayout>
      <AttendanceReportModule />
    </DashboardLayout>
  )
}

function AttendanceReportModule() {
  const { toast } = useToast()
  const [classes, setClasses] = useState<ClassItem[]>([])
  const [sections, setSections] = useState<Section[]>([])

  // Filters
  const [dateFrom, setDateFrom] = useState(format(new Date(), 'yyyy-MM-01'))
  const [dateTo, setDateTo] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [selectedClassId, setSelectedClassId] = useState('')
  const [selectedSectionId, setSelectedSectionId] = useState('')

  // Data
  const [studentSummaries, setStudentSummaries] = useState<StudentSummary[]>([])
  const [classSummaries, setClassSummaries] = useState<ClassSummary[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch('/api/classes').then(r => r.json()),
      fetch('/api/sections').then(r => r.json()),
    ]).then(([cls, sec]) => {
      setClasses(Array.isArray(cls) ? cls : [])
      setSections(Array.isArray(sec) ? sec : [])
    }).catch(() => {})
  }, [])

  const generateReport = useCallback(async () => {
    if (!dateFrom || !dateTo) {
      toast({ title: 'Error', description: 'Please select date range', variant: 'destructive' })
      return
    }

    setLoading(true)
    try {
      const params = new URLSearchParams({ date_from: dateFrom, date_to: dateTo })
      if (selectedClassId) params.set('class_id', selectedClassId)
      if (selectedSectionId) params.set('section_id', selectedSectionId)

      const res = await fetch(`/api/attendance?${params.toString()}&limit=10000`)
      const data = await res.json()
      const records: AttendanceRecord[] = Array.isArray(data) ? data : (data.records || [])

      // Build student summaries
      const studentMap: Record<number, StudentSummary> = {}
      records.forEach(r => {
        if (!studentMap[r.student_id]) {
          studentMap[r.student_id] = {
            student_id: r.student_id,
            student_code: r.student?.student_code || '',
            name: r.student?.name || 'Unknown',
            total_days: 0,
            present: 0,
            absent: 0,
            late: 0,
            sick: 0,
            excused: 0,
            percentage: 0,
          }
        }
        const s = studentMap[r.student_id]
        s.total_days++
        if (r.status === 'present') s.present++
        else if (r.status === 'absent') s.absent++
        else if (r.status === 'late') s.late++
        else if (r.status === 'sick') s.sick++
        else if (r.status === 'excused') s.excused++
      })

      // Calculate percentages
      Object.values(studentMap).forEach(s => {
        s.percentage = s.total_days > 0 ? Math.round(((s.present + s.late) / s.total_days) * 100) : 0
      })

      setStudentSummaries(Object.values(studentMap).sort((a, b) => b.percentage - a.percentage))

      // Build class summaries (simplified)
      const classMap: Record<string, ClassSummary> = {}
      records.forEach(r => {
        // This is simplified - in production you'd join with class data
        const key = `${selectedClassId || 'all'}-${selectedSectionId || 'all'}`
        if (!classMap[key]) {
          classMap[key] = {
            class_id: parseInt(selectedClassId || '0'),
            class_name: selectedClassId ? classes.find(c => c.class_id.toString() === selectedClassId)?.name || 'All Classes' : 'All Classes',
            section_name: selectedSectionId ? sections.find(s => s.section_id.toString() === selectedSectionId)?.name || 'All' : 'All Sections',
            total_students: Object.keys(studentMap).length,
            avg_attendance: 0,
            total_present: 0,
            total_absent: 0,
          }
        }
        classMap[key].total_present++
        if (r.status === 'absent') classMap[key].total_absent++
      })

      Object.values(classMap).forEach(cs => {
        cs.avg_attendance = records.length > 0 ? Math.round((cs.total_present / records.length) * 100) : 0
      })

      setClassSummaries(Object.values(classMap))
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to generate report', variant: 'destructive' })
    }
    setLoading(false)
  }, [dateFrom, dateTo, selectedClassId, selectedSectionId, classes, sections, toast])

  const exportStudentCSV = () => {
    if (studentSummaries.length === 0) return
    const headers = ['#', 'Student Code', 'Name', 'Total Days', 'Present', 'Absent', 'Late', 'Sick', 'Excused', 'Percentage']
    const rows = studentSummaries.map((s, i) => [
      i + 1, s.student_code, s.name, s.total_days, s.present, s.absent, s.late, s.sick, s.excused, s.percentage + '%',
    ])
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    downloadCSV(csv, `attendance_report_${dateFrom}_to_${dateTo}.csv`)
  }

  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/admin/attendance">
            <Button variant="outline" size="icon" className="min-h-[44px] min-w-[44px]">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Attendance Reports</h1>
            <p className="text-sm text-slate-500 mt-1">View attendance summaries and analytics</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card className="border-slate-200/60">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-600">From Date</label>
              <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="min-h-[44px]" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-600">To Date</label>
              <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="min-h-[44px]" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-600">Class</label>
              <Select value={selectedClassId} onValueChange={v => setSelectedClassId(v)}>
                <SelectTrigger className="min-h-[44px]"><SelectValue placeholder="All Classes" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  {classes.map(c => (
                    <SelectItem key={c.class_id} value={c.class_id.toString()}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-600">Section</label>
              <Select value={selectedSectionId} onValueChange={v => setSelectedSectionId(v)}>
                <SelectTrigger className="min-h-[44px]"><SelectValue placeholder="All Sections" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sections</SelectItem>
                  {sections.map(s => (
                    <SelectItem key={s.section_id} value={s.section_id.toString()}>{s.name}</SelectItem>
                  ))}
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

      {/* Report Tabs */}
      <Tabs defaultValue="student">
        <TabsList className="w-full flex mb-6 bg-white border border-slate-200 p-1 rounded-xl h-auto flex-wrap gap-1">
          <TabsTrigger value="student" className="flex-1 min-w-[140px] data-[state=active]:bg-emerald-600 data-[state=active]:text-white rounded-lg py-2.5 text-sm">
            <Users className="w-4 h-4 mr-2" />
            Student-wise
          </TabsTrigger>
          <TabsTrigger value="class" className="flex-1 min-w-[140px] data-[state=active]:bg-emerald-600 data-[state=active]:text-white rounded-lg py-2.5 text-sm">
            <TrendingUp className="w-4 h-4 mr-2" />
            Class-wise
          </TabsTrigger>
        </TabsList>

        <TabsContent value="student">
          <Card className="border-slate-200/60">
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-lg">Student Attendance Summary</CardTitle>
                  <CardDescription>{studentSummaries.length} students</CardDescription>
                </div>
                {studentSummaries.length > 0 && (
                  <Button onClick={exportStudentCSV} variant="outline" className="min-h-[44px]">
                    <Download className="w-4 h-4 mr-2" /> Export CSV
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}
                </div>
              ) : studentSummaries.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <FileBarChart className="w-12 h-12 text-slate-300 mb-4" />
                  <p className="text-slate-500">Generate a report to see student attendance data</p>
                </div>
              ) : (
                <div className="max-h-[500px] overflow-y-auto rounded-lg border border-slate-200 custom-scrollbar">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50 hover:bg-slate-50">
                        <TableHead className="w-[50px]">#</TableHead>
                        <TableHead>Student</TableHead>
                        <TableHead className="hidden sm:table-cell">Code</TableHead>
                        <TableHead className="text-center">Days</TableHead>
                        <TableHead className="text-center hidden md:table-cell">Present</TableHead>
                        <TableHead className="text-center hidden md:table-cell">Absent</TableHead>
                        <TableHead className="text-center">%</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {studentSummaries.map((s, i) => (
                        <TableRow key={s.student_id} className="hover:bg-slate-50">
                          <TableCell className="text-sm text-slate-500">{i + 1}</TableCell>
                          <TableCell className="font-medium text-sm text-slate-900">{s.name}</TableCell>
                          <TableCell className="hidden sm:table-cell text-sm text-slate-500 font-mono">{s.student_code}</TableCell>
                          <TableCell className="text-center text-sm">{s.total_days}</TableCell>
                          <TableCell className="text-center hidden md:table-cell">
                            <span className="text-emerald-600 font-medium">{s.present}</span>
                          </TableCell>
                          <TableCell className="text-center hidden md:table-cell">
                            <span className="text-red-600 font-medium">{s.absent}</span>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge className={
                              s.percentage >= 90 ? 'bg-emerald-100 text-emerald-700' :
                              s.percentage >= 75 ? 'bg-amber-100 text-amber-700' :
                              'bg-red-100 text-red-700'
                            }>
                              {s.percentage}%
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="class">
          <Card className="border-slate-200/60">
            <CardHeader>
              <CardTitle className="text-lg">Class Attendance Summary</CardTitle>
              <CardDescription>Overall attendance by class and section</CardDescription>
            </CardHeader>
            <CardContent>
              {classSummaries.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <TrendingUp className="w-12 h-12 text-slate-300 mb-4" />
                  <p className="text-slate-500">Generate a report to see class attendance data</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {classSummaries.map(cs => (
                    <Card key={cs.class_id} className="border-slate-200">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-semibold text-slate-900">{cs.class_name}</h3>
                          <Badge className={cs.avg_attendance >= 85 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}>
                            {cs.avg_attendance}%
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-500 mb-3">Section: {cs.section_name} | Students: {cs.total_students}</p>
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-1">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-slate-600">{cs.total_present} present</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <XCircle className="w-3.5 h-3.5 text-red-600" />
                            <span className="text-slate-600">{cs.total_absent} absent</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
