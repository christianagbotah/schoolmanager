'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths } from 'date-fns'
import { useToast } from '@/hooks/use-toast'
import {
  CheckSquare, Calendar, Users, UserCheck, UserX, Clock, Heart,
  ShieldCheck, Save, Download, ScanBarcode, CheckCheck, ChevronLeft,
  ChevronRight, FileBarChart, Loader2,
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
interface Student {
  student_id: number
  student_code: string
  name: string
  first_name: string
  last_name: string
  sex: string
  active_status: number
}

interface ClassItem {
  class_id: number
  name: string
  name_numeric: number
  category: string
  section_id: number | null
}

interface Section {
  section_id: number
  name: string
}

interface AttendanceRecord {
  attendance_id: number
  student_id: number
  status: string
  timestamp: string | null
}

type AttendanceStatus = 'present' | 'absent' | 'late' | 'sick' | 'excused' | ''

const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string; icon: React.ElementType }> = {
  present: { label: 'Present', color: 'text-emerald-700', bgColor: 'bg-emerald-100 hover:bg-emerald-200 border-emerald-300', icon: UserCheck },
  absent: { label: 'Absent', color: 'text-red-700', bgColor: 'bg-red-100 hover:bg-red-200 border-red-300', icon: UserX },
  late: { label: 'Late', color: 'text-amber-700', bgColor: 'bg-amber-100 hover:bg-amber-200 border-amber-300', icon: Clock },
  sick: { label: 'Sick', color: 'text-orange-700', bgColor: 'bg-orange-100 hover:bg-orange-200 border-orange-300', icon: Heart },
  excused: { label: 'Excused', color: 'text-blue-700', bgColor: 'bg-blue-100 hover:bg-blue-200 border-blue-300', icon: ShieldCheck },
}

const STATUS_LIST: AttendanceStatus[] = ['present', 'absent', 'late', 'sick', 'excused']

// ===== Main Component =====
export default function AttendancePage() {
  return (
    <DashboardLayout>
      <AttendanceModule />
    </DashboardLayout>
  )
}

function AttendanceModule() {
  const { toast } = useToast()

  // Data
  const [classes, setClasses] = useState<ClassItem[]>([])
  const [sections, setSections] = useState<Section[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [existingAttendance, setExistingAttendance] = useState<AttendanceRecord[]>([])
  const [monthlyHeatmap, setMonthlyHeatmap] = useState<Record<string, number>>({})

  // Filters
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [selectedClassId, setSelectedClassId] = useState('')
  const [selectedSectionId, setSelectedSectionId] = useState('')
  const [barcodeInput, setBarcodeInput] = useState('')

  // State
  const [attendanceMap, setAttendanceMap] = useState<Record<number, AttendanceStatus>>({})
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [studentsLoading, setStudentsLoading] = useState(false)
  const [calendarMonth, setCalendarMonth] = useState(new Date())

  // Fetch classes and sections on mount
  useEffect(() => {
    fetch('/api/classes')
      .then(r => r.json())
      .then(data => { setClasses(Array.isArray(data) ? data : []) })
      .catch(() => {})

    fetch('/api/sections')
      .then(r => r.json())
      .then(data => { setSections(Array.isArray(data) ? data : []) })
      .catch(() => {})
  }, [])

  // Fetch students when class/section selected
  useEffect(() => {
    if (!selectedClassId || !selectedSectionId) {
      setStudents([])
      setAttendanceMap({})
      setExistingAttendance([])
      return
    }

    setStudentsLoading(true)
    const params = new URLSearchParams({ class_id: selectedClassId, section_id: selectedSectionId })
    fetch(`/api/students?${params.toString()}`)
      .then(r => r.json())
      .then(data => {
        setStudents(Array.isArray(data) ? data : [])
        setAttendanceMap({})
      })
      .catch(() => setStudents([]))
      .finally(() => setStudentsLoading(false))
  }, [selectedClassId, selectedSectionId])

  // Fetch existing attendance for selected date
  useEffect(() => {
    if (!selectedClassId || !selectedSectionId || !selectedDate) return
    setLoading(true)
    const params = new URLSearchParams({
      class_id: selectedClassId,
      section_id: selectedSectionId,
      date: selectedDate,
    })
    fetch(`/api/attendance?${params.toString()}`)
      .then(r => r.json())
      .then(data => {
        const records: AttendanceRecord[] = Array.isArray(data) ? data : (data.records || [])
        setExistingAttendance(records)
        const map: Record<number, AttendanceStatus> = {}
        records.forEach(r => { map[r.student_id] = r.status as AttendanceStatus })
        setAttendanceMap(map)
      })
      .catch(() => setExistingAttendance([]))
      .finally(() => setLoading(false))
  }, [selectedClassId, selectedSectionId, selectedDate])

  // Fetch monthly heatmap data
  useEffect(() => {
    if (!selectedClassId || !selectedSectionId) return
    const monthStart = format(startOfMonth(calendarMonth), 'yyyy-MM-dd')
    const monthEnd = format(endOfMonth(calendarMonth), 'yyyy-MM-dd')
    const params = new URLSearchParams({
      class_id: selectedClassId,
      section_id: selectedSectionId,
      date_from: monthStart,
      date_to: monthEnd,
    })
    fetch(`/api/attendance?${params.toString()}`)
      .then(r => r.json())
      .then(data => {
        const records: AttendanceRecord[] = Array.isArray(data) ? data : (data.records || [])
        const heatMap: Record<string, number> = {}
        records.forEach(r => {
          if (r.timestamp) {
            const day = format(new Date(r.timestamp), 'yyyy-MM-dd')
            heatMap[day] = (heatMap[day] || 0) + 1
          }
        })
        setMonthlyHeatmap(heatMap)
      })
      .catch(() => {})
  }, [selectedClassId, selectedSectionId, calendarMonth])

  // Barcode scanner: when student code is entered, find the student
  const handleBarcodeScan = useCallback((code: string) => {
    const student = students.find(s => s.student_code.toLowerCase() === code.toLowerCase())
    if (student) {
      setAttendanceMap(prev => ({
        ...prev,
        [student.student_id]: prev[student.student_id] || 'present',
      }))
      toast({ title: 'Student Found', description: `${student.name} - marked ${attendanceMap[student.student_id] || 'present'}` })
      setBarcodeInput('')
    } else {
      toast({ title: 'Not Found', description: `No student with code "${code}" in this class`, variant: 'destructive' })
    }
  }, [students, attendanceMap, toast])

  // Mark all present
  const markAllPresent = () => {
    const map: Record<number, AttendanceStatus> = {}
    students.forEach(s => { map[s.student_id] = 'present' })
    setAttendanceMap(map)
    toast({ title: 'All Marked Present', description: `${students.length} students marked as present` })
  }

  // Save attendance
  const saveAttendance = async () => {
    if (!selectedClassId || !selectedSectionId) {
      toast({ title: 'Error', description: 'Please select a class and section', variant: 'destructive' })
      return
    }

    setSaving(true)
    try {
      const records = students.map(s => ({
        student_id: s.student_id,
        status: attendanceMap[s.student_id] || 'absent',
      }))

      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          class_id: parseInt(selectedClassId),
          section_id: parseInt(selectedSectionId),
          date: selectedDate,
          records,
        }),
      })

      if (!res.ok) throw new Error('Failed to save')
      const result = await res.json()
      toast({ title: 'Saved', description: `Attendance saved for ${result.count || records.length} students` })
    } catch (err) {
      toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' })
    }
    setSaving(false)
  }

  // Export CSV
  const exportCSV = () => {
    if (students.length === 0) return
    const headers = ['Roll', 'Student Code', 'Name', 'Status']
    const rows = students.map((s, i) => [i + 1, s.student_code, s.name, attendanceMap[s.student_id] || 'not marked'])
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `attendance_${selectedDate}_class${selectedClassId}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Stats
  const stats = useMemo(() => {
    const present = Object.values(attendanceMap).filter(s => s === 'present').length
    const absent = Object.values(attendanceMap).filter(s => s === 'absent').length
    const late = Object.values(attendanceMap).filter(s => s === 'late').length
    const sick = Object.values(attendanceMap).filter(s => s === 'sick').length
    const excused = Object.values(attendanceMap).filter(s => s === 'excused').length
    return { present, absent, late, sick, excused, total: students.length, marked: Object.keys(attendanceMap).length }
  }, [attendanceMap, students.length])

  // Calendar days
  const calendarDays = useMemo(() => {
    const start = startOfMonth(calendarMonth)
    const end = endOfMonth(calendarMonth)
    return eachDayOfInterval({ start, end })
  }, [calendarMonth])

  const filteredSections = useMemo(() => {
    const cls = classes.find(c => c.class_id.toString() === selectedClassId)
    if (!cls) return sections
    return sections.filter(s => s.section_id === cls.section_id || true) // Show all sections for now
  }, [selectedClassId, classes, sections])

  const activeStudentCount = students.filter(s => s.active_status === 1).length

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Attendance</h1>
          <p className="text-sm text-slate-500 mt-1">Mark and track daily student attendance</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin/attendance/report">
            <Button variant="outline" className="min-h-[44px]">
              <FileBarChart className="w-4 h-4 mr-2" />
              Reports
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters Card */}
      <Card className="border-slate-200/60">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Date */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-600">Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={e => setSelectedDate(e.target.value)}
                  className="pl-10 min-h-[44px]"
                />
              </div>
            </div>

            {/* Class */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-600">Class</label>
              <Select value={selectedClassId} onValueChange={v => { setSelectedClassId(v); setSelectedSectionId('') }}>
                <SelectTrigger className="min-h-[44px]">
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map(c => (
                    <SelectItem key={c.class_id} value={c.class_id.toString()}>
                      {c.name} <span className="text-slate-400 ml-1">({c.category})</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Section */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-600">Section</label>
              <Select value={selectedSectionId} onValueChange={setSelectedSectionId}>
                <SelectTrigger className="min-h-[44px]">
                  <SelectValue placeholder="Select section" />
                </SelectTrigger>
                <SelectContent>
                  {filteredSections.map(s => (
                    <SelectItem key={s.section_id} value={s.section_id.toString()}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Barcode Scanner */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-600">Barcode / Student Code</label>
              <div className="relative">
                <ScanBarcode className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Scan or type code..."
                  value={barcodeInput}
                  onChange={e => setBarcodeInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleBarcodeScan(barcodeInput) }}
                  className="pl-10 min-h-[44px]"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatBadge icon={Users} label="Total" value={stats.total} color="slate" />
        <StatBadge icon={UserCheck} label="Present" value={stats.present} color="emerald" />
        <StatBadge icon={UserX} label="Absent" value={stats.absent} color="red" />
        <StatBadge icon={Clock} label="Late" value={stats.late} color="amber" />
        <StatBadge icon={Heart} label="Sick" value={stats.sick} color="orange" />
        <StatBadge icon={ShieldCheck} label="Excused" value={stats.excused} color="blue" />
      </div>

      <Tabs defaultValue="attendance" className="w-full">
        <TabsList className="w-full flex mb-6 bg-white border border-slate-200 p-1 rounded-xl h-auto flex-wrap gap-1">
          <TabsTrigger value="attendance" className="flex-1 min-w-[120px] data-[state=active]:bg-emerald-600 data-[state=active]:text-white rounded-lg py-2.5 text-sm">
            <CheckSquare className="w-4 h-4 mr-2" />
            Mark Attendance
          </TabsTrigger>
          <TabsTrigger value="calendar" className="flex-1 min-w-[120px] data-[state=active]:bg-emerald-600 data-[state=active]:text-white rounded-lg py-2.5 text-sm">
            <Calendar className="w-4 h-4 mr-2" />
            Monthly View
          </TabsTrigger>
        </TabsList>

        {/* Attendance Tab */}
        <TabsContent value="attendance">
          <Card className="border-slate-200/60">
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-lg">Student Attendance</CardTitle>
                  <CardDescription>
                    {activeStudentCount} active student{activeStudentCount !== 1 ? 's' : ''} | {stats.marked} / {stats.total} marked
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button onClick={markAllPresent} variant="outline" className="min-h-[44px]" disabled={students.length === 0}>
                    <CheckCheck className="w-4 h-4 mr-2" />
                    Mark All Present
                  </Button>
                  <Button onClick={saveAttendance} className="bg-emerald-600 hover:bg-emerald-700 min-h-[44px]" disabled={students.length === 0 || saving}>
                    {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    Save
                  </Button>
                  <Button onClick={exportCSV} variant="outline" className="min-h-[44px]" disabled={students.length === 0}>
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {studentsLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-14 w-full rounded-lg" />
                  ))}
                </div>
              ) : !selectedClassId || !selectedSectionId ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                    <CheckSquare className="w-8 h-8 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-1">Select a Class & Section</h3>
                  <p className="text-sm text-slate-500 max-w-sm">Choose a class and section above to start marking attendance</p>
                </div>
              ) : students.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                    <Users className="w-8 h-8 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-1">No Students Found</h3>
                  <p className="text-sm text-slate-500">No students enrolled in this class/section</p>
                </div>
              ) : (
                <div className="max-h-[600px] overflow-y-auto rounded-lg border border-slate-200 custom-scrollbar">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50 hover:bg-slate-50">
                        <TableHead className="w-[50px]">#</TableHead>
                        <TableHead className="min-w-[200px]">Student</TableHead>
                        <TableHead className="hidden sm:table-cell">Code</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {students.map((student, idx) => {
                        const currentStatus = attendanceMap[student.student_id] || ''
                        return (
                          <TableRow key={student.student_id} className="hover:bg-slate-50">
                            <TableCell className="text-sm text-slate-500">{idx + 1}</TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium text-slate-900 text-sm">{student.name}</p>
                                <p className="text-xs text-slate-500 sm:hidden">{student.student_code}</p>
                              </div>
                            </TableCell>
                            <TableCell className="hidden sm:table-cell text-sm text-slate-500 font-mono">{student.student_code}</TableCell>
                            <TableCell>
                              <div className="flex items-center justify-center">
                                <div className="flex items-center gap-1">
                                  {STATUS_LIST.map(status => {
                                    const cfg = STATUS_CONFIG[status]
                                    const isActive = currentStatus === status
                                    return (
                                      <button
                                        key={status}
                                        onClick={() => setAttendanceMap(prev => ({
                                          ...prev,
                                          [student.student_id]: isActive ? '' : status,
                                        }))}
                                        title={cfg.label}
                                        className={`min-w-[36px] h-[36px] rounded-lg border-2 flex items-center justify-center transition-all duration-150 text-xs font-medium ${
                                          isActive ? cfg.bgColor + ' ' + cfg.color + ' border-current scale-105 shadow-sm' : 'bg-slate-50 text-slate-400 border-slate-200 hover:border-slate-300'
                                        }`}
                                      >
                                        <cfg.icon className="w-4 h-4" />
                                      </button>
                                    )
                                  })}
                                </div>
                              </div>
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
        </TabsContent>

        {/* Calendar Tab */}
        <TabsContent value="calendar">
          <Card className="border-slate-200/60">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Attendance Heatmap</CardTitle>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" onClick={() => setCalendarMonth(prev => subMonths(prev, 1))} className="h-9 w-9">
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-sm font-medium min-w-[140px] text-center">{format(calendarMonth, 'MMMM yyyy')}</span>
                  <Button variant="outline" size="icon" onClick={() => setCalendarMonth(prev => addMonths(prev, 1))} className="h-9 w-9">
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <CardDescription>Density of attendance records (darker = more records)</CardDescription>
            </CardHeader>
            <CardContent>
              {!selectedClassId || !selectedSectionId ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Calendar className="w-12 h-12 text-slate-300 mb-4" />
                  <p className="text-sm text-slate-500">Select a class and section to view the heatmap</p>
                </div>
              ) : (
                <div className="grid grid-cols-7 gap-1">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                    <div key={d} className="text-center text-xs font-medium text-slate-500 py-2">{d}</div>
                  ))}
                  {calendarDays.map(day => {
                    const dateStr = format(day, 'yyyy-MM-dd')
                    const count = monthlyHeatmap[dateStr] || 0
                    const isToday = isSameDay(day, new Date())
                    const isFuture = day > new Date()
                    const intensity = Math.min(count / Math.max(stats.total, 1), 1)
                    const bgIntensity = isFuture ? 'bg-slate-50' : count === 0 ? 'bg-slate-100' : `bg-emerald-${Math.max(200, Math.round(500 - intensity * 300))}`
                    return (
                      <div
                        key={dateStr}
                        className={`aspect-square rounded-lg flex flex-col items-center justify-center text-xs transition-colors ${
                          isToday ? 'ring-2 ring-emerald-500' : ''
                        } ${isFuture ? 'text-slate-300' : 'text-slate-700'} ${count === 0 && !isFuture ? 'bg-slate-100' : ''} ${
                          count > 0 ? getHeatmapColor(intensity) : ''
                        }`}
                      >
                        <span className="font-medium">{format(day, 'd')}</span>
                        {count > 0 && <span className="text-[10px] opacity-75">{count}</span>}
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// ===== Stat Badge =====
function StatBadge({ icon: Icon, label, value, color }: {
  icon: React.ElementType; label: string; value: number; color: string
}) {
  const colors: Record<string, string> = {
    slate: 'bg-slate-50 border-slate-200 text-slate-700',
    emerald: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    red: 'bg-red-50 border-red-200 text-red-700',
    amber: 'bg-amber-50 border-amber-200 text-amber-700',
    orange: 'bg-orange-50 border-orange-200 text-orange-700',
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
  }
  const iconColors: Record<string, string> = {
    slate: 'text-slate-500',
    emerald: 'text-emerald-600',
    red: 'text-red-600',
    amber: 'text-amber-600',
    orange: 'text-orange-600',
    blue: 'text-blue-600',
  }

  return (
    <div className={`rounded-xl border p-3 flex items-center gap-3 ${colors[color]}`}>
      <Icon className={`w-5 h-5 ${iconColors[color]}`} />
      <div>
        <p className="text-lg font-bold">{value}</p>
        <p className="text-[11px] font-medium opacity-70">{label}</p>
      </div>
    </div>
  )
}

function getHeatmapColor(intensity: number): string {
  if (intensity >= 0.9) return 'bg-emerald-600 text-white'
  if (intensity >= 0.7) return 'bg-emerald-500 text-white'
  if (intensity >= 0.5) return 'bg-emerald-400 text-white'
  if (intensity >= 0.3) return 'bg-emerald-300 text-emerald-900'
  if (intensity > 0) return 'bg-emerald-200 text-emerald-800'
  return 'bg-slate-100 text-slate-600'
}
