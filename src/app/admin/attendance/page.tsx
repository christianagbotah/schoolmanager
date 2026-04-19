'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import {
  CalendarCheck, Users, UserCheck, UserX, Clock, Heart,
  ShieldCheck, Save, Download, ScanBarcode, CheckCheck, Zap,
  BarChart3, Bell, Loader2, FileText, Search, Filter, X,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
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
import { toast } from 'sonner'

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

// Status mapping: 1=Present, 2=Absent, 3=Late, 4=Sick-Home, 5=Sick-Clinic
const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string; icon: React.ElementType; badgeClass: string }> = {
  '1': { label: 'Present', color: 'text-emerald-700', bgColor: 'bg-emerald-100 hover:bg-emerald-200 border-emerald-300', icon: UserCheck, badgeClass: 'bg-emerald-100 text-emerald-700' },
  '2': { label: 'Absent', color: 'text-red-700', bgColor: 'bg-red-100 hover:bg-red-200 border-red-300', icon: UserX, badgeClass: 'bg-red-100 text-red-700' },
  '3': { label: 'Late', color: 'text-amber-700', bgColor: 'bg-amber-100 hover:bg-amber-200 border-amber-300', icon: Clock, badgeClass: 'bg-amber-100 text-amber-700' },
  '4': { label: 'Sick-Home', color: 'text-yellow-700', bgColor: 'bg-yellow-100 hover:bg-yellow-200 border-yellow-300', icon: Heart, badgeClass: 'bg-yellow-100 text-yellow-700' },
  '5': { label: 'Sick-Clinic', color: 'text-blue-700', bgColor: 'bg-blue-100 hover:bg-blue-200 border-blue-300', icon: ShieldCheck, badgeClass: 'bg-blue-100 text-blue-700' },
}

const STATUS_KEYS = ['1', '2', '3', '4', '5']

// ===== Skeleton Components =====

function StatCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/60 p-4 sm:p-5 flex flex-col">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-2.5">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-8 w-16" />
        </div>
        <Skeleton className="w-11 h-11 rounded-xl flex-shrink-0" />
      </div>
    </div>
  )
}

function ContentSkeleton() {
  return (
    <div className="space-y-5 sm:space-y-6">
      <Skeleton className="h-11 w-64 rounded-lg" />
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-lg" />
        ))}
      </div>
    </div>
  )
}

// ===== Stat Card Component =====

function StatCard({
  icon: Icon,
  label,
  value,
  subValue,
  iconBg,
  borderColor,
  onClick,
}: {
  icon: React.ElementType
  label: string
  value: number
  subValue?: string
  iconBg: string
  borderColor: string
  onClick?: () => void
}) {
  return (
    <div
      className={`group relative bg-white rounded-2xl border border-slate-200/60 p-4 sm:p-5 hover:-translate-y-0.5 hover:shadow-lg hover:border-slate-300/80 transition-all duration-200 flex flex-col cursor-pointer ${onClick ? '' : 'cursor-default'}`}
      style={{ borderLeft: `4px solid ${borderColor}` }}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            {label}
          </p>
          <p className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1.5 tabular-nums leading-tight">
            {value}
          </p>
          {subValue && (
            <p className="text-xs text-slate-500 mt-1.5">{subValue}</p>
          )}
        </div>
        <div
          className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}
        >
          <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
        </div>
      </div>
    </div>
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

// ===== Main Component =====
export default function AttendancePage() {
  return (
    <DashboardLayout>
      <AttendanceModule />
    </DashboardLayout>
  )
}

function AttendanceModule() {
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

  // Reload dashboard stats
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
      toast.error('Please select a class')
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
        const map: Record<number, string> = {}
        data.students.forEach((s: Student) => {
          if (s.status) map[s.student_id] = s.status
        })
        setAttendanceMap(map)
      } else {
        toast.error(data.message || 'Failed to load students')
      }
    } catch {
      toast.error('Failed to load students')
    }
    setStudentsLoading(false)
  }, [selectedClassId, selectedSectionId, selectedDate])

  // Student search filter
  const [studentFilter, setStudentFilter] = useState('')

  const filteredStudents = useMemo(() => {
    if (!studentFilter.trim()) return students
    const q = studentFilter.toLowerCase()
    return students.filter(s =>
      s.name?.toLowerCase().includes(q) ||
      s.student_code?.toLowerCase().includes(q)
    )
  }, [students, studentFilter])

  // Mark all present
  const markAllPresent = () => {
    const map: Record<number, string> = {}
    students.forEach(s => { map[s.student_id] = '1' })
    setAttendanceMap(map)
    toast.success(`${students.length} students marked as present`)
  }

  // Mark all absent (matching CI3)
  const markAllAbsent = () => {
    const map: Record<number, string> = {}
    students.forEach(s => { map[s.student_id] = '2' })
    setAttendanceMap(map)
    toast.success(`${students.length} students marked as absent`)
  }

  // Save attendance
  const saveAttendance = async () => {
    if (!selectedClassId) {
      toast.error('Please select a class')
      return
    }

    const records = students.map(s => ({
      student_id: s.student_id,
      status: attendanceMap[s.student_id] || '2',
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
        toast.success(data.message)
        reloadDashboardStats()
      } else {
        toast.error(data.message || 'Failed to save')
      }
    } catch {
      toast.error('Failed to save attendance')
    }
    setSaving(false)
  }

  // Quick mark all present via API
  const quickMarkAllPresent = async () => {
    if (!quickMarkClass) {
      toast.error('Please select a class')
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
        toast.success(data.message)
        setQuickMarkOpen(false)
        reloadDashboardStats()
      } else {
        toast.error(data.message)
      }
    } catch {
      toast.error('Failed to quick mark')
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
      toast.success(`${student.name} marked`)
      setBarcodeInput('')
    } else {
      toast.error(`No student with code "${code}"`)
    }
  }, [students])

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
    toast.success('Attendance exported')
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

  // ===== Full-page loading state =====
  if (statsLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-5 sm:space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100">
            <div className="space-y-1.5">
              <Skeleton className="h-8 w-56" />
              <Skeleton className="h-4 w-72" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-11 w-32 rounded-lg" />
              <Skeleton className="h-11 w-28 rounded-lg" />
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </div>
          <ContentSkeleton />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-5 sm:space-y-6">
        {/* ═══ Page Header ═══ */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Attendance Management
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {format(new Date(), 'EEEE, MMMM d, yyyy')}
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setQuickMarkOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 min-h-[44px]">
              <Zap className="w-4 h-4 mr-2" />
              Quick Mark
            </Button>
            <Button asChild variant="outline" className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 min-h-[44px]">
              <Link href="/admin/attendance/report">
                <FileText className="w-4 h-4 mr-2" />
                Reports
              </Link>
            </Button>
          </div>
        </div>

        {/* ═══ Stats Cards ═══ */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <StatCard
            icon={Users}
            label="Total Expected"
            value={stats?.total || 0}
            subValue="students today"
            iconBg="bg-violet-500"
            borderColor="#8b5cf6"
            onClick={() => showBreakdown('total')}
          />
          <StatCard
            icon={UserCheck}
            label="Present"
            value={stats?.present || 0}
            subValue={`${stats?.present_percent || 0}% attendance`}
            iconBg="bg-emerald-500"
            borderColor="#10b981"
            onClick={() => showBreakdown('present')}
          />
          <StatCard
            icon={UserX}
            label="Absent + Sick"
            value={stats?.absent || 0}
            subValue={`${stats?.absent_percent || 0}% not present`}
            iconBg="bg-red-500"
            borderColor="#ef4444"
            onClick={() => showBreakdown('absent')}
          />
          <StatCard
            icon={Clock}
            label="Late Arrivals"
            value={stats?.late || 0}
            subValue="needs follow up"
            iconBg="bg-amber-500"
            borderColor="#f59e0b"
            onClick={() => showBreakdown('late')}
          />
        </div>

        {/* ═══ Mark Attendance Card ═══ */}
        <div className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden">
          {/* Card Header */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center">
                <CalendarCheck className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Mark Attendance</h2>
                <p className="text-xs text-slate-500">Select class and date, then mark each student</p>
              </div>
            </div>
            {students.length > 0 && (
              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs">
                {currentStats.marked}/{currentStats.total} marked
              </Badge>
            )}
          </div>

          <div className="p-4 sm:p-6">
            {/* Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Class</label>
                <Select value={selectedClassId} onValueChange={v => { setSelectedClassId(v); setSelectedSectionId('') }}>
                  <SelectTrigger className="min-h-[44px]">
                    <SelectValue placeholder="Select Class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map(c => (
                      <SelectItem key={c.class_id} value={c.class_id.toString()}>
                        {c.name} {c.name_numeric ? c.name_numeric : ''}{' '}
                        <span className="text-slate-400 ml-1">({c.category})</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Section</label>
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
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</label>
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
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">&nbsp;</label>
                <Button onClick={loadStudents} className="w-full min-h-[44px] bg-emerald-600 hover:bg-emerald-700" disabled={studentsLoading}>
                  {studentsLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Users className="w-4 h-4 mr-2" />}
                  Load Students
                </Button>
              </div>
            </div>

            {/* Barcode Scanner */}
            <div className="mb-5">
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

            {/* Student Filter + Stats Bar (matching CI3 initSearchFilter) */}
            {students.length > 0 && (
              <>
                <div className="flex flex-col sm:flex-row gap-3 mb-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      placeholder="Search by name or code..."
                      value={studentFilter}
                      onChange={e => setStudentFilter(e.target.value)}
                      className="pl-10 min-h-[44px]"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-5">
                  <MiniStat label="Total" value={currentStats.total} color="slate" />
                  <MiniStat label="Present" value={currentStats.present} color="emerald" />
                  <MiniStat label="Absent" value={currentStats.absent} color="red" />
                  <MiniStat label="Late" value={currentStats.late} color="amber" />
                  <MiniStat label="Sick-Home" value={currentStats.sickHome} color="yellow" />
                  <MiniStat label="Sick-Clinic" value={currentStats.sickClinic} color="blue" />
                </div>
              </>
            )}

            {/* Students Table */}
            {studentsLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full rounded-lg" />
                ))}
              </div>
            ) : students.length === 0 && selectedClassId ? (
              /* Empty state: class selected but no students */
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                  <Users className="w-8 h-8 text-slate-400" />
                </div>
                <p className="font-semibold text-slate-500 text-base">No students found</p>
                <p className="text-xs text-slate-400 mt-1">No students enrolled in this class/section</p>
              </div>
            ) : students.length > 0 ? (
              <>
                {/* Action Buttons (matching CI3: Select All Present, Mark All Absent) */}
                <div className="flex flex-wrap gap-2 mb-4">
                  <Button onClick={markAllPresent} variant="outline" className="min-h-[44px] border-emerald-200 text-emerald-700 hover:bg-emerald-50">
                    <CheckCheck className="w-4 h-4 mr-2" />
                    Select All Present
                  </Button>
                  <Button onClick={markAllAbsent} variant="outline" className="min-h-[44px] border-red-200 text-red-700 hover:bg-red-50">
                    <X className="w-4 h-4 mr-2" />
                    Mark All Absent
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

                {/* Desktop Table */}
                <div className="hidden md:block max-h-[500px] overflow-y-auto rounded-xl border border-slate-200">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50 hover:bg-slate-50">
                        <TableHead className="w-[50px] text-xs font-semibold text-slate-600">#</TableHead>
                        <TableHead className="min-w-[180px] text-xs font-semibold text-slate-600">Student</TableHead>
                        <TableHead className="hidden sm:table-cell text-xs font-semibold text-slate-600">Code</TableHead>
                        <TableHead className="text-center min-w-[260px] text-xs font-semibold text-slate-600">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredStudents.map((student, idx) => {
                        const currentStatus = attendanceMap[student.student_id] || ''
                        return (
                          <TableRow key={student.student_id} className="hover:bg-slate-50/50 transition-colors">
                            <TableCell className="text-sm text-slate-500">{idx + 1}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                                  {student.name?.charAt(0) || '?'}
                                </div>
                                <div>
                                  <p className="font-medium text-sm text-slate-900">{student.name}</p>
                                  <p className="text-xs text-slate-500 md:hidden">{student.student_code}</p>
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

                {/* Mobile Card View */}
                <div className="md:hidden divide-y divide-slate-100">
                  {filteredStudents.map((student) => {
                    const currentStatus = attendanceMap[student.student_id] || ''
                    const cfg = currentStatus ? STATUS_CONFIG[currentStatus] : null
                    return (
                      <div key={student.student_id} className="p-4 space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                            {student.name?.charAt(0) || '?'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm text-slate-900 truncate">{student.name}</p>
                            <p className="text-xs text-slate-500 font-mono">{student.student_code}</p>
                          </div>
                          {cfg && (
                            <Badge className={`${cfg.badgeClass} text-[10px] flex-shrink-0`}>
                              {cfg.label}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                          {STATUS_KEYS.map(statusKey => {
                            const sc = STATUS_CONFIG[statusKey]
                            const isActive = currentStatus === statusKey
                            return (
                              <button
                                key={statusKey}
                                onClick={() => setAttendanceMap(prev => ({
                                  ...prev,
                                  [student.student_id]: isActive ? '' : statusKey,
                                }))}
                                title={sc.label}
                                className={`min-w-[44px] h-[44px] rounded-lg border-2 flex flex-col items-center justify-center transition-all duration-150 text-[9px] font-semibold gap-0.5 flex-shrink-0 ${
                                  isActive
                                    ? `${sc.bgColor} ${sc.color} border-current scale-105 shadow-sm`
                                    : 'bg-slate-50 text-slate-400 border-slate-200'
                                }`}
                              >
                                <sc.icon className="w-4 h-4" />
                                <span>{sc.label}</span>
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </>
            ) : (
              /* Empty state: no class selected yet */
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                  <CalendarCheck className="w-8 h-8 text-slate-400" />
                </div>
                <p className="font-semibold text-slate-500 text-base">Select a Class</p>
                <p className="text-xs text-slate-400 mt-1 max-w-sm">
                  Choose a class and optionally a section above, then click &ldquo;Load Students&rdquo; to start marking attendance
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ═══ Quick Mark Dialog ═══ */}
      <Dialog open={quickMarkOpen} onOpenChange={setQuickMarkOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                <Zap className="w-4 h-4 text-emerald-600" />
              </div>
              Quick Mark Attendance
            </DialogTitle>
            <DialogDescription>
              Mark all students in a class as present for a specific date.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500">Select Class</label>
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
              <label className="text-xs font-semibold text-slate-500">Date</label>
              <Input type="date" value={quickMarkDate} onChange={e => setQuickMarkDate(e.target.value)} className="min-h-[44px]" />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setQuickMarkOpen(false)} className="min-h-[44px]">Cancel</Button>
            <Button onClick={quickMarkAllPresent} disabled={saving || !quickMarkClass} className="bg-emerald-600 hover:bg-emerald-700 min-h-[44px]">
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Zap className="w-4 h-4 mr-2" />}
              Mark All Present
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ Breakdown Dialog ═══ */}
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
                    <TableHead className="text-xs font-semibold text-slate-600">Class</TableHead>
                    {breakdownType === 'absent' ? (
                      <>
                        <TableHead className="text-center text-xs font-semibold text-slate-600">Absent</TableHead>
                        <TableHead className="text-center text-xs font-semibold text-slate-600">Sick-Home</TableHead>
                        <TableHead className="text-center text-xs font-semibold text-slate-600">Sick-Clinic</TableHead>
                      </>
                    ) : breakdownType === 'present' ? (
                      <>
                        <TableHead className="text-center text-xs font-semibold text-slate-600">Count</TableHead>
                        <TableHead className="text-center text-xs font-semibold text-slate-600">Rate</TableHead>
                      </>
                    ) : (
                      <TableHead className="text-center text-xs font-semibold text-slate-600">Count</TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.by_class.map(cls => (
                    <TableRow key={cls.class_id} className="hover:bg-slate-50/50 transition-colors">
                      <TableCell>
                        <div>
                          <p className="font-semibold text-sm text-slate-900">{cls.class_name}</p>
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
                          <TableCell className="text-center font-semibold text-sm">
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
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mb-3">
                  <BarChart3 className="w-6 h-6 text-slate-400" />
                </div>
                <p className="text-sm text-slate-500 font-medium">No data available</p>
                <p className="text-xs text-slate-400 mt-1">Attendance data will appear here once marked</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
