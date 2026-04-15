'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { useToast } from '@/hooks/use-toast'
import {
  ArrowLeft, FileBarChart, Download, Printer, Loader2, Users, Calendar,
  TrendingUp,
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
interface ClassItem {
  class_id: number
  name: string
  name_numeric: number
  category: string
}

interface SectionItem {
  section_id: number
  name: string
  class_id: number
}

interface StudentSummary {
  student_id: number
  student_code: string
  name: string
  class_name: string
  section_name: string
  present: number
  absent: number
  late: number
  sick_home: number
  sick_clinic: number
  percentage: number
}

interface ReportStats {
  total_days: number
  total_present: number
  total_absent: number
  total_late: number
  total_sick_home: number
  total_sick_clinic: number
  attendance_rate: number
  absent_rate: number
}

interface WeeklyTrend {
  week: string
  rate: number
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
  const [allSections, setAllSections] = useState<SectionItem[]>([])

  // Filters
  const [reportType, setReportType] = useState('analytics')
  const [selectedClassId, setSelectedClassId] = useState('')
  const [selectedSectionId, setSelectedSectionId] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  const [dateFrom, setDateFrom] = useState(format(new Date(), 'yyyy-MM-01'))
  const [dateTo, setDateTo] = useState(format(new Date(), 'yyyy-MM-dd'))
  // Monthly grid fields
  const [selectedMonth, setSelectedMonth] = useState(String(new Date().getMonth() + 1))
  const [selectedYear, setSelectedYear] = useState('')
  const [selectedTerm, setSelectedTerm] = useState('')

  // Data
  const [reportStats, setReportStats] = useState<ReportStats | null>(null)
  const [weeklyTrend, setWeeklyTrend] = useState<WeeklyTrend[]>([])
  const [students, setStudents] = useState<StudentSummary[]>([])
  const [loading, setLoading] = useState(false)
  const [reportGenerated, setReportGenerated] = useState(false)

  // Load classes/sections
  useEffect(() => {
    Promise.all([
      fetch('/api/admin/classes').then(r => r.json()),
      fetch('/api/admin/sections').then(r => r.json()),
    ]).then(([cls, sec]) => {
      setClasses(Array.isArray(cls) ? cls : [])
      setAllSections(Array.isArray(sec) ? sec : [])
    }).catch(() => {})
  }, [])

  // Filtered sections
  const classSections = selectedClassId
    ? allSections.filter(s => s.class_id === parseInt(selectedClassId))
    : []

  // Load settings for year/term
  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          const yearSetting = data.find((s: { type: string; description: string }) => s.type === 'running_year')
          const termSetting = data.find((s: { type: string; description: string }) => s.type === 'running_term')
          if (yearSetting) setSelectedYear(yearSetting.description)
          if (termSetting) setSelectedTerm(termSetting.description)
        }
      })
      .catch(() => {})
  }, [])

  // Toggle report type fields
  const showDateRange = reportType === 'analytics'
  const showMonthlyFields = reportType === 'monthly_grid'

  // Generate report
  const generateReport = useCallback(async () => {
    if (reportType === 'monthly_grid') {
      if (!selectedClassId) {
        toast({ title: 'Error', description: 'Please select a class for monthly grid report', variant: 'destructive' })
        return
      }
      // Monthly grid opens in new window/print view - simplified here as inline view
      toast({ title: 'Info', description: 'Monthly grid report generation - use analytics view for now' })
      return
    }

    if (!dateFrom || !dateTo) {
      toast({ title: 'Error', description: 'Please select date range', variant: 'destructive' })
      return
    }

    setLoading(true)
    try {
      const params = new URLSearchParams({
        start_date: dateFrom,
        end_date: dateTo,
        report_type: reportType,
      })
      if (selectedClassId && selectedClassId !== 'all') params.set('class_id', selectedClassId)
      if (selectedSectionId && selectedSectionId !== 'all') params.set('section_id', selectedSectionId)
      if (selectedStatus) params.set('status', selectedStatus)

      const res = await fetch(`/api/admin/attendance/report?${params}`)
      const data = await res.json()

      if (data.status === 'success') {
        setReportStats(data.data.stats)
        setWeeklyTrend(data.data.weekly_trend || [])
        setStudents(data.data.students || [])
        setReportGenerated(true)
      } else {
        toast({ title: 'Error', description: data.message || 'Failed to generate report', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to generate report', variant: 'destructive' })
    }
    setLoading(false)
  }, [reportType, dateFrom, dateTo, selectedClassId, selectedSectionId, selectedStatus, toast])

  // Export CSV
  const exportCSV = () => {
    if (students.length === 0) return
    const headers = ['#', 'Student Code', 'Name', 'Class', 'Section', 'Present', 'Absent', 'Late', 'Sick-Home', 'Sick-Clinic', 'Attendance %']
    const rows = students.map((s, i) => [
      i + 1, s.student_code, s.name, s.class_name, s.section_name,
      s.present, s.absent, s.late, s.sick_home, s.sick_clinic, s.percentage + '%',
    ])
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `attendance_report_${dateFrom}_to_${dateTo}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Print report
  const printReport = () => {
    window.print()
  }

  const monthNames = ['', 'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December']

  return (
    <div className="space-y-6">
      {/* Page Header - matching CI3 analytics-header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button asChild variant="outline" size="icon" className="min-h-[44px] min-w-[44px]">
            <Link href="/admin/attendance">
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Attendance Reports</h1>
            <p className="text-sm text-slate-500 mt-1">Comprehensive attendance analytics</p>
          </div>
        </div>
        <Button onClick={exportCSV} className="bg-emerald-600 hover:bg-emerald-700 min-h-[44px]" disabled={students.length === 0}>
          <Download className="w-4 h-4 mr-2" />
          Export Excel
        </Button>
      </div>

      {/* Filter Card - matching CI3 filter-card */}
      <Card className="border-slate-200/60">
        <CardContent className="p-4 md:p-6">
          <div className="flex flex-wrap gap-3 items-end">
            {/* Report Type */}
            <div className="flex-1 min-w-[150px] space-y-1.5">
              <label className="text-xs font-semibold text-slate-600">Report Type</label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger className="min-h-[44px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="analytics">Analytics Summary</SelectItem>
                  <SelectItem value="monthly_grid">Monthly Grid</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Class */}
            <div className="flex-1 min-w-[150px] space-y-1.5">
              <label className="text-xs font-semibold text-slate-600">Class</label>
              <Select value={selectedClassId} onValueChange={v => { setSelectedClassId(v); setSelectedSectionId('') }}>
                <SelectTrigger className="min-h-[44px]">
                  <SelectValue placeholder="All Classes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  {classes.map(c => (
                    <SelectItem key={c.class_id} value={c.class_id.toString()}>
                      {c.name} {c.name_numeric ? c.name_numeric : ''} ({c.category})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Section */}
            <div className="flex-1 min-w-[130px] space-y-1.5">
              <label className="text-xs font-semibold text-slate-600">Section</label>
              <Select value={selectedSectionId} onValueChange={setSelectedSectionId}>
                <SelectTrigger className="min-h-[44px]">
                  <SelectValue placeholder="All Sections" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sections</SelectItem>
                  {classSections.map(s => (
                    <SelectItem key={s.section_id} value={s.section_id.toString()}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status */}
            <div className="flex-1 min-w-[130px] space-y-1.5">
              <label className="text-xs font-semibold text-slate-600">Status</label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="min-h-[44px]">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="1">Present</SelectItem>
                  <SelectItem value="2">Absent</SelectItem>
                  <SelectItem value="3">Late</SelectItem>
                  <SelectItem value="4">Sick-Home</SelectItem>
                  <SelectItem value="5">Sick-Clinic</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Monthly Fields */}
            {showMonthlyFields && (
              <>
                <div className="flex-1 min-w-[120px] space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600">Month</label>
                  <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                    <SelectTrigger className="min-h-[44px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {monthNames.slice(1).map((name, i) => (
                        <SelectItem key={i + 1} value={String(i + 1)}>{name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1 min-w-[120px] space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600">Academic Year</label>
                  <Select value={selectedYear} onValueChange={setSelectedYear}>
                    <SelectTrigger className="min-h-[44px]">
                      <SelectValue placeholder="Select Year" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2024/2025">2024/2025</SelectItem>
                      <SelectItem value="2023/2024">2023/2024</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1 min-w-[100px] space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600">Term</label>
                  <Select value={selectedTerm} onValueChange={setSelectedTerm}>
                    <SelectTrigger className="min-h-[44px]">
                      <SelectValue placeholder="Select Term" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Term 1</SelectItem>
                      <SelectItem value="2">Term 2</SelectItem>
                      <SelectItem value="3">Term 3</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {/* Date Range Fields */}
            {showDateRange && (
              <>
                <div className="flex-1 min-w-[150px] space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600">Start Date</label>
                  <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="min-h-[44px]" />
                </div>
                <div className="flex-1 min-w-[150px] space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600">End Date</label>
                  <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="min-h-[44px]" />
                </div>
              </>
            )}

            {/* Generate Button */}
            <div className="flex-1 min-w-[120px]">
              <Button onClick={generateReport} className="w-full min-h-[44px] bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-700 hover:to-purple-800 text-white border-0" disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <TrendingUp className="w-4 h-4 mr-2" />}
                Generate Report
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Content - matching CI3 report view */}
      {reportGenerated && reportStats && (
        <>
          {/* Stats Grid - matching CI3 */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border p-4 border-l-4 border-l-blue-400 shadow-sm">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Days</p>
              <p className="text-3xl font-bold mt-1">{reportStats.total_days}</p>
              <p className="text-xs text-slate-500 mt-1">school days</p>
            </div>
            <div className="bg-white rounded-xl border p-4 border-l-4 border-l-emerald-400 shadow-sm">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Present</p>
              <p className="text-3xl font-bold mt-1">{reportStats.total_present}</p>
              <p className="text-xs text-slate-500 mt-1">{reportStats.attendance_rate}% rate</p>
            </div>
            <div className="bg-white rounded-xl border p-4 border-l-4 border-l-red-400 shadow-sm">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Absent</p>
              <p className="text-3xl font-bold mt-1">{reportStats.total_absent + reportStats.total_sick_home + reportStats.total_sick_clinic}</p>
              <p className="text-xs text-slate-500 mt-1">{reportStats.absent_rate}% rate</p>
            </div>
            <div className="bg-white rounded-xl border p-4 border-l-4 border-l-amber-400 shadow-sm">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Average Attendance</p>
              <p className="text-3xl font-bold mt-1">{reportStats.attendance_rate}%</p>
              <p className="text-xs text-slate-500 mt-1">daily average</p>
            </div>
          </div>

          {/* Charts Area - matching CI3 chart-grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Trend Chart */}
            <Card className="border-slate-200/60">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Attendance Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                {weeklyTrend.length > 0 ? (
                  <div className="space-y-3">
                    {weeklyTrend.map((w, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <span className="text-xs font-medium text-slate-600 w-16">{w.week}</span>
                        <div className="flex-1 bg-slate-100 rounded-full h-6 relative overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all duration-500 flex items-center justify-end pr-2"
                            style={{ width: `${Math.min(w.rate, 100)}%` }}
                          >
                            <span className="text-[10px] font-bold text-white">{w.rate}%</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-slate-400 py-8">No trend data available</p>
                )}
              </CardContent>
            </Card>

            {/* Status Breakdown - matching CI3 statusChart */}
            <Card className="border-slate-200/60">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileBarChart className="w-4 h-4" />
                  Status Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <StatusRow label="Present" count={reportStats.total_present} color="emerald" total={reportStats.total_present + reportStats.total_absent + reportStats.total_late + reportStats.total_sick_home + reportStats.total_sick_clinic} />
                  <StatusRow label="Absent" count={reportStats.total_absent} color="red" total={reportStats.total_present + reportStats.total_absent + reportStats.total_late + reportStats.total_sick_home + reportStats.total_sick_clinic} />
                  <StatusRow label="Late" count={reportStats.total_late} color="amber" total={reportStats.total_present + reportStats.total_absent + reportStats.total_late + reportStats.total_sick_home + reportStats.total_sick_clinic} />
                  <StatusRow label="Sick-Home" count={reportStats.total_sick_home} color="yellow" total={reportStats.total_present + reportStats.total_absent + reportStats.total_late + reportStats.total_sick_home + reportStats.total_sick_clinic} />
                  <StatusRow label="Sick-Clinic" count={reportStats.total_sick_clinic} color="blue" total={reportStats.total_present + reportStats.total_absent + reportStats.total_late + reportStats.total_sick_home + reportStats.total_sick_clinic} />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Student Details Table - matching CI3 student_table */}
          <Card className="border-slate-200/60">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Student Attendance Details
                  </CardTitle>
                  <CardDescription>{students.length} students</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button onClick={printReport} variant="outline" className="min-h-[44px]">
                    <Printer className="w-4 h-4 mr-2" />
                    Print
                  </Button>
                  <Button onClick={exportCSV} variant="outline" className="min-h-[44px]">
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {students.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <FileBarChart className="w-12 h-12 text-slate-300 mb-4" />
                  <p className="text-slate-500">No student data available for the selected filters</p>
                </div>
              ) : (
                <div className="max-h-[500px] overflow-y-auto rounded-lg border border-slate-200 custom-scrollbar">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50 hover:bg-slate-50">
                        <TableHead className="w-[50px]">#</TableHead>
                        <TableHead>Student Name</TableHead>
                        <TableHead className="hidden md:table-cell">Class</TableHead>
                        <TableHead className="text-center">Present</TableHead>
                        <TableHead className="text-center">Absent</TableHead>
                        <TableHead className="text-center hidden lg:table-cell">Late</TableHead>
                        <TableHead className="text-center hidden lg:table-cell">Sick-Home</TableHead>
                        <TableHead className="text-center hidden lg:table-cell">Sick-Clinic</TableHead>
                        <TableHead className="text-center">Attendance %</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {students.map((s, i) => {
                        const rate = s.percentage
                        const badgeClass = rate >= 90 ? 'bg-emerald-100 text-emerald-700' : rate >= 75 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                        return (
                          <TableRow key={s.student_id} className="hover:bg-slate-50">
                            <TableCell className="text-sm text-slate-500">{i + 1}</TableCell>
                            <TableCell className="font-medium text-sm text-slate-900">{s.name}</TableCell>
                            <TableCell className="hidden md:table-cell">
                              <div>
                                <span className="text-sm">{s.class_name}</span>
                                {s.section_name && (
                                  <span className="text-xs text-slate-500 block">{s.section_name}</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge className="bg-emerald-100 text-emerald-700">{s.present}</Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge className="bg-red-100 text-red-700">{s.absent}</Badge>
                            </TableCell>
                            <TableCell className="text-center hidden lg:table-cell">
                              <Badge className="bg-amber-100 text-amber-700">{s.late}</Badge>
                            </TableCell>
                            <TableCell className="text-center hidden lg:table-cell">
                              <Badge className="bg-yellow-100 text-yellow-700">{s.sick_home}</Badge>
                            </TableCell>
                            <TableCell className="text-center hidden lg:table-cell">
                              <Badge className="bg-blue-100 text-blue-700">{s.sick_clinic}</Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge className={badgeClass}>{rate}%</Badge>
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
        </>
      )}

      {/* No report yet state */}
      {!reportGenerated && !loading && (
        <Card className="border-slate-200/60">
          <CardContent className="py-20 flex flex-col items-center justify-center text-center">
            <FileBarChart className="w-16 h-16 text-slate-200 mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-1">Generate a Report</h3>
            <p className="text-sm text-slate-500 max-w-md">
              Select filters above and click &ldquo;Generate Report&rdquo; to view attendance analytics,
              trends, and individual student statistics.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Loading state */}
      {loading && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-xl" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="h-64 rounded-xl" />
            <Skeleton className="h-64 rounded-xl" />
          </div>
        </div>
      )}
    </div>
  )
}

// ===== Status Row (Doughnut-like breakdown) =====
function StatusRow({ label, count, color, total }: {
  label: string; count: number; color: string; total: number
}) {
  const pct = total > 0 ? Math.round((count / total) * 1000) / 10 : 0

  const colorMap: Record<string, { bg: string; text: string; bar: string }> = {
    emerald: { bg: 'bg-emerald-100', text: 'text-emerald-700', bar: 'from-emerald-400 to-emerald-600' },
    red: { bg: 'bg-red-100', text: 'text-red-700', bar: 'from-red-400 to-red-600' },
    amber: { bg: 'bg-amber-100', text: 'text-amber-700', bar: 'from-amber-400 to-amber-600' },
    yellow: { bg: 'bg-yellow-100', text: 'text-yellow-700', bar: 'from-yellow-400 to-yellow-600' },
    blue: { bg: 'bg-blue-100', text: 'text-blue-700', bar: 'from-blue-400 to-blue-600' },
  }

  const c = colorMap[color] || colorMap.emerald

  return (
    <div className="flex items-center gap-3">
      <Badge className={`${c.bg} ${c.text} min-w-[90px] justify-center`}>
        {label}: {count}
      </Badge>
      <div className="flex-1 bg-slate-100 rounded-full h-4 relative overflow-hidden">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${c.bar} transition-all duration-500`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
      <span className="text-xs font-semibold text-slate-600 w-12 text-right">{pct}%</span>
    </div>
  )
}
