'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { useToast } from '@/hooks/use-toast'
import {
  CalendarCheck, Users, UserCheck, UserX, Clock, Heart,
  ShieldCheck, Save, Download, ScanBarcode, CheckCheck, Zap,
  BarChart3, Bell, ArrowRight, Loader2, FileText,
  ChevronRight,
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
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { DashboardLayout } from '@/components/layout/dashboard-layout'

// ===== Types =====
interface ClassItem {
  class_id: number
  name: string
  name_numeric: number
  category: string
  sections: { section_id: number; name: string }[]
}

interface SectionItem {
  section_id: number
  name: string
  class_id: number
}

interface Student {
  student_id: number
  student_code: string
  name: string
  first_name: string
  last_name: string
  sex: string
  active_status: number
  enroll_id: number
  section_id: number
  section_name: string
  status: string
}

interface DashboardStats {
  total: number
  present: number
  absent: number
  late: number
  sick_home: number
  sick_clinic: number
  present_percent: number
  absent_percent: number
  by_class: ClassStat[]
}

interface ClassStat {
  class_id: number
  class_name: string
  total: number
  present: number
  absent: number
  late: number
  sick_home: number
  sick_clinic: number
  present_students: string[]
  absent_students: string[]
  late_students: string[]
  sick_home_students: string[]
  sick_clinic_students: string[]
}

// Status mapping (matching CI3):
// 1 = Present, 2 = Absent, 3 = Late, 4 = Sick-Home, 5 = Sick-Clinic
const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string; icon: React.ElementType; badgeClass: string }> = {
  '1': { label: 'Present', color: 'text-emerald-700', bgColor: 'bg-emerald-100 hover:bg-emerald-200 border-emerald-300', icon: UserCheck, badgeClass: 'bg-emerald-100 text-emerald-700' },
  '2': { label: 'Absent', color: 'text-red-700', bgColor: 'bg-red-100 hover:bg-red-200 border-red-300', icon: UserX, badgeClass: 'bg-red-100 text-red-700' },
  '3': { label: 'Late', color: 'text-amber-700', bgColor: 'bg-amber-100 hover:bg-amber-200 border-amber-300', icon: Clock, badgeClass: 'bg-amber-100 text-amber-700' },
  '4': { label: 'Sick-Home', color: 'text-yellow-700', bgColor: 'bg-yellow-100 hover:bg-yellow-200 border-yellow-300', icon: Heart, badgeClass: 'bg-yellow-100 text-yellow-700' },
  '5': { label: 'Sick-Clinic', color: 'text-blue-700', bgColor: 'bg-blue-100 hover:bg-blue-200 border-blue-300', icon: ShieldCheck, badgeClass: 'bg-blue-100 text-blue-700' },
}

const STATUS_KEYS = ['1', '2', '3', '4', '5']

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

  // === Dashboard State ===
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)

  // === Mark Attendance State ===
  const [classes, setClasses] = useState<ClassItem[]>([])
  const [allSections, setAllSections] = useState<SectionItem[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [selectedClassId, setSelectedClassId] = useState('')
  const [selectedSectionId, setSelectedSectionId] = useState('')
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [barcodeInput, setBarcodeInput] = useState('')
  const [attendanceMap, setAttendanceMap] = useState<Record<number, string>>({})
  const [studentsLoading, setStudentsLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  // === Breakdown Dialog ===
  const [breakdownOpen, setBreakdownOpen] = useState(false)
  const [breakdownType, setBreakdownType] = useState<string>('total')

  // === Quick Mark Dialog ===
  const [quickMarkOpen, setQuickMarkOpen] = useState(false)
  const [quickMarkClass, setQuickMarkClass] = useState('')
  const [quickMarkDate, setQuickMarkDate] = useState(format(new Date(), 'yyyy-MM-dd'))

  // Reload dashboard stats (called from event handlers, not effects)
  const reloadDashboardStats = () => {
    setStatsLoading(true)
    fetch('/api/admin/attendance?action=stats')
      .then(r => r.json())
      .then(data => {
        if (data.status === 'success') setStats(data.data)
      })
      .catch(() => {})
      .finally(() => setStatsLoading(false))
  }

  // Load dashboard stats on mount
  useEffect(() => {
    let cancelled = false
    fetch('/api/admin/attendance?action=stats')
      .then(r => r.json())
      .then(data => {
        if (!cancelled && data.status === 'success') setStats(data.data)
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setStatsLoading(false) })
    return () => { cancelled = true }
  }, [])

  // Load classes
  useEffect(() => {
    fetch('/api/admin/classes')
      .then(r => r.json())
      .then(data => { setClasses(Array.isArray(data) ? data : []) })
      .catch(() => {})

    fetch('/api/admin/sections')
      .then(r => r.json())
      .then(data => { setAllSections(Array.isArray(data) ? data : []) })
      .catch(() => {})
  }, [])

  // Filtered sections for selected class
  const classSections = useMemo(() => {
    if (!selectedClassId) return []
    return allSections.filter(s => s.class_id === parseInt(selectedClassId))
  }, [selectedClassId, allSections])

  // Load students when class+section+date selected
  const loadStudents = useCallback(async () => {
    if (!selectedClassId) {
      toast({ title: 'Error', description: 'Please select a class', variant: 'destructive' })
      return
    }

    setStudentsLoading(true)
    try {
      const params = new URLSearchParams({
        action: 'students',
        class_id: selectedClassId,
        date: selectedDate,
      })
      if (selectedSectionId) params.set('section_id', selectedSectionId)

      const res = await fetch(`/api/admin/attendance?${params}`)
      const data = await res.json()
      if (data.status === 'success') {
        setStudents(data.students)
        // Pre-fill from existing attendance
        const map: Record<number, string> = {}
        data.students.forEach((s: Student) => {
          if (s.status) map[s.student_id] = s.status
        })
        setAttendanceMap(map)
      } else {
        toast({ title: 'Error', description: data.message || 'Failed to load students', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to load students', variant: 'destructive' })
    }
    setStudentsLoading(false)
  }, [selectedClassId, selectedSectionId, selectedDate, toast])

  // Mark all present
  const markAllPresent = () => {
    const map: Record<number, string> = {}
    students.forEach(s => { map[s.student_id] = '1' })
    setAttendanceMap(map)
    toast({ title: 'All Marked Present', description: `${students.length} students marked as present` })
  }

  // Save attendance
  const saveAttendance = async () => {
    if (!selectedClassId) {
      toast({ title: 'Error', description: 'Please select a class', variant: 'destructive' })
      return
    }

    const records = students.map(s => ({
      student_id: s.student_id,
      status: attendanceMap[s.student_id] || '2', // Default to absent
    }))

    setSaving(true)
    try {
      const res = await fetch('/api/admin/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          class_id: parseInt(selectedClassId),
          section_id: selectedSectionId ? parseInt(selectedSectionId) : null,
          date: selectedDate,
          records,
        }),
      })
      const data = await res.json()
      if (data.status === 'success') {
        toast({ title: 'Saved', description: data.message })
        // Reload stats
        reloadDashboardStats()
      } else {
        toast({ title: 'Error', description: data.message || 'Failed to save', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to save attendance', variant: 'destructive' })
    }
    setSaving(false)
  }

  // Quick mark all present via API
  const quickMarkAllPresent = async () => {
    if (!quickMarkClass) {
      toast({ title: 'Error', description: 'Please select a class', variant: 'destructive' })
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/admin/attendance/quick-mark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          class_id: parseInt(quickMarkClass),
          date: quickMarkDate,
        }),
      })
      const data = await res.json()
      if (data.status === 'success') {
        toast({ title: 'Quick Mark', description: data.message })
        setQuickMarkOpen(false)
        reloadDashboardStats()
      } else {
        toast({ title: 'Error', description: data.message, variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to quick mark', variant: 'destructive' })
    }
    setSaving(false)
  }

  // Barcode scan
  const handleBarcodeScan = useCallback((code: string) => {
    const student = students.find(s => s.student_code?.toLowerCase() === code.toLowerCase())
    if (student) {
      setAttendanceMap(prev => ({
        ...prev,
        [student.student_id]: prev[student.student_id] || '1',
      }))
      toast({ title: 'Student Found', description: `${student.name} marked` })
      setBarcodeInput('')
    } else {
      toast({ title: 'Not Found', description: `No student with code "${code}"`, variant: 'destructive' })
    }
  }, [students, toast])

  // Export CSV
  const exportCSV = () => {
    if (students.length === 0) return
    const headers = ['#', 'Student Code', 'Name', 'Status']
    const rows = students.map((s, i) => [
      i + 1, s.student_code, s.name,
      STATUS_CONFIG[attendanceMap[s.student_id] || '']?.label || 'Not Marked',
    ])
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `attendance_${selectedDate}_class${selectedClassId}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Stats computed from current attendance map
  const currentStats = useMemo(() => {
    const present = Object.values(attendanceMap).filter(s => s === '1').length
    const absent = Object.values(attendanceMap).filter(s => s === '2').length
    const late = Object.values(attendanceMap).filter(s => s === '3').length
    const sickHome = Object.values(attendanceMap).filter(s => s === '4').length
    const sickClinic = Object.values(attendanceMap).filter(s => s === '5').length
    return { present, absent, late, sickHome, sickClinic, total: students.length, marked: Object.keys(attendanceMap).length }
  }, [attendanceMap, students.length])

  // Show breakdown dialog
  const showBreakdown = (type: string) => {
    setBreakdownType(type)
    setBreakdownOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* Page Header - matching CI3 dashboard */}
      <div className="bg-gradient-to-r from-violet-600 to-purple-700 rounded-2xl p-6 md:p-8 text-white shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
              <CalendarCheck className="w-8 h-8" />
              Attendance Management
            </h1>
            <p className="text-white/80 mt-1 text-sm md:text-base">
              {format(new Date(), 'EEEE, MMMM d, yyyy')}
            </p>
          </div>
          <div className="flex gap-3">
            <Button onClick={() => setQuickMarkOpen(true)} className="bg-emerald-500 hover:bg-emerald-600 text-white border-0 min-h-[44px]">
              <Zap className="w-4 h-4 mr-2" />
              Quick Mark
            </Button>
            <Button asChild variant="outline" className="bg-white/10 hover:bg-white/20 text-white border-white/20 min-h-[44px]">
              <Link href="/admin/attendance/report">
                <FileText className="w-4 h-4 mr-2" />
                Reports
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards - matching CI3 dashboard */}
      {statsLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : stats ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Expected"
            value={stats.total}
            subtext="students"
            colorClass="border-violet-400"
            onClick={() => showBreakdown('total')}
          />
          <StatCard
            label="Present"
            value={stats.present}
            subtext={`${stats.present_percent}% attendance`}
            colorClass="border-emerald-400"
            onClick={() => showBreakdown('present')}
          />
          <StatCard
            label="Absent + Sick"
            value={stats.absent}
            subtext={`${stats.absent_percent}% not present`}
            colorClass="border-red-400"
            onClick={() => showBreakdown('absent')}
          />
          <StatCard
            label="Late Arrivals"
            value={stats.late}
            subtext="needs follow up"
            colorClass="border-amber-400"
            onClick={() => showBreakdown('late')}
          />
        </div>
      ) : null}

      {/* Quick Action Cards - matching CI3 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <ActionCard
          icon={Users}
          title="Student Attendance"
          description="Mark by class"
          color="violet"
          onClick={() => {}}
        />
        <ActionCard
          icon={BarChart3}
          title="Analytics"
          description="View trends"
          color="amber"
          onClick={() => window.location.href = '/admin/attendance/report'}
        />
        <ActionCard
          icon={Bell}
          title="Notifications"
          description="Alert parents"
          color="red"
          onClick={() => toast({ title: 'Notifications', description: 'Absent notifications would be sent to parents' })}
        />
        <ActionCard
          icon={Download}
          title="Export Data"
          description="Excel / PDF"
          color="emerald"
          onClick={exportCSV}
        />
      </div>

      {/* Mark Attendance Tab Section - matching CI3 mark_attendance */}
      <Card className="border-slate-200/60">
        <CardHeader className="border-b bg-gradient-to-r from-violet-600 to-purple-700 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-white">
              <CalendarCheck className="w-5 h-5" />
              <CardTitle className="text-lg text-white">Mark Attendance</CardTitle>
            </div>
            <Badge variant="outline" className="bg-white/10 text-white border-white/20">
              {currentStats.marked}/{currentStats.total} marked
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-4 md:p-6">
          {/* Filters - matching CI3 mark_attendance filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Class</label>
              <Select value={selectedClassId} onValueChange={v => { setSelectedClassId(v); setSelectedSectionId('') }}>
                <SelectTrigger className="min-h-[44px]">
                  <SelectValue placeholder="Select Class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map(c => (
                    <SelectItem key={c.class_id} value={c.class_id.toString()}>
                      {c.name} {c.name_numeric ? c.name_numeric : ''} <span className="text-slate-400 ml-1">({c.category})</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Section</label>
              <Select value={selectedSectionId} onValueChange={setSelectedSectionId}>
                <SelectTrigger className="min-h-[44px]">
                  <SelectValue placeholder="Select Section" />
                </SelectTrigger>
                <SelectContent>
                  {classSections.map(s => (
                    <SelectItem key={s.section_id} value={s.section_id.toString()}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Date</label>
              <div className="relative">
                <CalendarCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={e => setSelectedDate(e.target.value)}
                  className="pl-10 min-h-[44px]"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">&nbsp;</label>
              <Button onClick={loadStudents} className="w-full min-h-[44px] bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-700 hover:to-purple-800 text-white border-0" disabled={studentsLoading}>
                {studentsLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Users className="w-4 h-4 mr-2" />}
                Load Students
              </Button>
            </div>
          </div>

          {/* Barcode Scanner - matching CI3 */}
          <div className="mb-6">
            <div className="relative max-w-sm">
              <ScanBarcode className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Scan barcode or type student code..."
                value={barcodeInput}
                onChange={e => setBarcodeInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleBarcodeScan(barcodeInput) }}
                className="pl-10 min-h-[44px]"
              />
            </div>
          </div>

          {/* Current Stats Bar */}
          {students.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-6">
              <MiniStat label="Total" value={currentStats.total} color="slate" />
              <MiniStat label="Present" value={currentStats.present} color="emerald" />
              <MiniStat label="Absent" value={currentStats.absent} color="red" />
              <MiniStat label="Late" value={currentStats.late} color="amber" />
              <MiniStat label="Sick-Home" value={currentStats.sickHome} color="yellow" />
              <MiniStat label="Sick-Clinic" value={currentStats.sickClinic} color="blue" />
            </div>
          )}

          {/* Students Table */}
          {studentsLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full rounded-lg" />
              ))}
            </div>
          ) : students.length === 0 && selectedClassId ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Users className="w-12 h-12 text-slate-300 mb-4" />
              <p className="text-slate-500">No students enrolled in this class/section</p>
            </div>
          ) : students.length > 0 ? (
            <>
              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2 mb-4">
                <Button onClick={markAllPresent} variant="outline" className="min-h-[44px]">
                  <CheckCheck className="w-4 h-4 mr-2" />
                  Mark All Present
                </Button>
                <Button onClick={saveAttendance} className="bg-emerald-600 hover:bg-emerald-700 min-h-[44px]" disabled={saving}>
                  {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  Save Attendance
                </Button>
                <Button onClick={exportCSV} variant="outline" className="min-h-[44px]">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>

              <div className="max-h-[500px] overflow-y-auto rounded-lg border border-slate-200 custom-scrollbar">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50 hover:bg-slate-50">
                      <TableHead className="w-[50px]">#</TableHead>
                      <TableHead className="min-w-[180px]">Student</TableHead>
                      <TableHead className="hidden sm:table-cell">Code</TableHead>
                      <TableHead className="text-center min-w-[260px]">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map((student, idx) => {
                      const currentStatus = attendanceMap[student.student_id] || ''
                      return (
                        <TableRow key={student.student_id} className="hover:bg-slate-50">
                          <TableCell className="text-sm text-slate-500">{idx + 1}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-100 to-purple-100 flex items-center justify-center text-xs font-bold text-violet-700">
                                {student.name?.charAt(0) || '?'}
                              </div>
                              <div>
                                <p className="font-medium text-slate-900 text-sm">{student.name}</p>
                                <p className="text-xs text-slate-500 sm:hidden">{student.student_code}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell text-sm text-slate-500 font-mono">{student.student_code}</TableCell>
                          <TableCell>
                            <div className="flex items-center justify-center gap-1">
                              {STATUS_KEYS.map(statusKey => {
                                const cfg = STATUS_CONFIG[statusKey]
                                const isActive = currentStatus === statusKey
                                return (
                                  <button
                                    key={statusKey}
                                    onClick={() => setAttendanceMap(prev => ({
                                      ...prev,
                                      [student.student_id]: isActive ? '' : statusKey,
                                    }))}
                                    title={cfg.label}
                                    className={`min-w-[40px] h-[40px] rounded-lg border-2 flex flex-col items-center justify-center transition-all duration-150 text-[10px] font-semibold gap-0.5 ${
                                      isActive
                                        ? `${cfg.bgColor} ${cfg.color} border-current scale-105 shadow-sm`
                                        : 'bg-slate-50 text-slate-400 border-slate-200 hover:border-slate-300'
                                    }`}
                                  >
                                    <cfg.icon className="w-4 h-4" />
                                    <span className="hidden xl:inline">{cfg.label}</span>
                                  </button>
                                )
                              })}
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <CalendarCheck className="w-12 h-12 text-slate-300 mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-1">Select a Class</h3>
              <p className="text-sm text-slate-500 max-w-sm">Choose a class and optionally a section above, then click &ldquo;Load Students&rdquo; to start marking attendance</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Mark Dialog */}
      <Dialog open={quickMarkOpen} onOpenChange={setQuickMarkOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-violet-600" />
              Quick Mark Attendance
            </DialogTitle>
            <DialogDescription>
              Mark all students in a class as present for a specific date.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600">Select Class</label>
              <Select value={quickMarkClass} onValueChange={setQuickMarkClass}>
                <SelectTrigger className="min-h-[44px]">
                  <SelectValue placeholder="Select a class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map(c => (
                    <SelectItem key={c.class_id} value={c.class_id.toString()}>
                      {c.name} {c.name_numeric ? c.name_numeric : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600">Date</label>
              <Input type="date" value={quickMarkDate} onChange={e => setQuickMarkDate(e.target.value)} className="min-h-[44px]" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setQuickMarkOpen(false)}>Cancel</Button>
            <Button onClick={quickMarkAllPresent} disabled={saving || !quickMarkClass} className="bg-emerald-600 hover:bg-emerald-700">
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Zap className="w-4 h-4 mr-2" />}
              Mark All Present
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Breakdown Dialog */}
      <Dialog open={breakdownOpen} onOpenChange={setBreakdownOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>
              {breakdownType === 'total' && 'Total Students by Class'}
              {breakdownType === 'present' && 'Present Students by Class'}
              {breakdownType === 'absent' && 'Absent Students Breakdown'}
              {breakdownType === 'late' && 'Late Arrivals by Class'}
            </DialogTitle>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto">
            {stats?.by_class && stats.by_class.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 hover:bg-slate-50">
                    <TableHead>Class</TableHead>
                    {breakdownType === 'absent' ? (
                      <>
                        <TableHead className="text-center">Absent</TableHead>
                        <TableHead className="text-center">Sick-Home</TableHead>
                        <TableHead className="text-center">Sick-Clinic</TableHead>
                      </>
                    ) : breakdownType === 'present' ? (
                      <>
                        <TableHead className="text-center">Count</TableHead>
                        <TableHead className="text-center">Rate</TableHead>
                      </>
                    ) : (
                      <TableHead className="text-center">Count</TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.by_class.map(cls => (
                    <TableRow key={cls.class_id}>
                      <TableCell>
                        <div>
                          <p className="font-semibold text-slate-900">{cls.class_name}</p>
                          {/* Student name badges */}
                          <div className="flex flex-wrap gap-1 mt-1">
                            {(breakdownType === 'present' ? cls.present_students :
                              breakdownType === 'absent' ? cls.absent_students :
                              breakdownType === 'late' ? cls.late_students :
                              []).map((name, i) => (
                              <Badge key={i} variant="outline" className="text-[10px] px-1.5 py-0">
                                {name}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </TableCell>
                      {breakdownType === 'absent' ? (
                        <>
                          <TableCell className="text-center">
                            <Badge className="bg-red-100 text-red-700">{cls.absent}</Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge className="bg-amber-100 text-amber-700">{cls.sick_home}</Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge className="bg-blue-100 text-blue-700">{cls.sick_clinic}</Badge>
                          </TableCell>
                        </>
                      ) : breakdownType === 'present' ? (
                        <>
                          <TableCell className="text-center">
                            <Badge className="bg-emerald-100 text-emerald-700">{cls.present}/{cls.total}</Badge>
                          </TableCell>
                          <TableCell className="text-center font-semibold">
                            {cls.total > 0 ? Math.round((cls.present / cls.total) * 1000) / 10 : 0}%
                          </TableCell>
                        </>
                      ) : (
                        <TableCell className="text-center">
                          <Badge className={
                            breakdownType === 'late' ? 'bg-amber-100 text-amber-700' : 'bg-violet-100 text-violet-700'
                          }>
                            {breakdownType === 'total' ? cls.total : cls.late}
                          </Badge>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-center text-slate-500 py-8">No data available</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ===== Stat Card =====
function StatCard({ label, value, subtext, colorClass, onClick }: {
  label: string; value: number; subtext: string; colorClass: string; onClick: () => void
}) {
  return (
    <Card
      className="cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all border-l-4 bg-white"
      style={{ borderLeftColor: undefined }}
      onClick={onClick}
    >
      <CardContent className={`p-4 rounded-xl border-l-4 ${colorClass}`}>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</p>
        <p className="text-3xl font-bold mt-1">{value}</p>
        <p className="text-xs text-slate-500 mt-1">{subtext}</p>
      </CardContent>
    </Card>
  )
}

// ===== Action Card =====
function ActionCard({ icon: Icon, title, description, color, onClick }: {
  icon: React.ElementType; title: string; description: string; color: string; onClick: () => void
}) {
  const colorMap: Record<string, string> = {
    violet: 'text-violet-600 hover:bg-violet-50',
    amber: 'text-amber-600 hover:bg-amber-50',
    red: 'text-red-600 hover:bg-red-50',
    emerald: 'text-emerald-600 hover:bg-emerald-50',
  }

  return (
    <Card
      className={`cursor-pointer hover:-translate-y-1 hover:shadow-md transition-all ${colorMap[color] || ''}`}
      onClick={onClick}
    >
      <CardContent className="p-4 text-center">
        <Icon className="w-8 h-8 mx-auto mb-2" />
        <p className="font-semibold text-sm text-slate-900">{title}</p>
        <p className="text-xs text-slate-500 mt-1">{description}</p>
      </CardContent>
    </Card>
  )
}

// ===== Mini Stat =====
function MiniStat({ label, value, color }: { label: string; value: number; color: string }) {
  const bgMap: Record<string, string> = {
    slate: 'bg-slate-50 text-slate-700 border-slate-200',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    red: 'bg-red-50 text-red-700 border-red-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    yellow: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
  }

  return (
    <div className={`rounded-lg border p-2 text-center ${bgMap[color] || bgMap.slate}`}>
      <p className="text-lg font-bold leading-tight">{value}</p>
      <p className="text-[10px] font-medium opacity-70">{label}</p>
    </div>
  )
}
