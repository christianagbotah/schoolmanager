'use client'

import { useState, useEffect, useMemo } from 'react'
import { toast } from 'sonner'
import {
  Calendar, Plus, Clock, MapPin, BookOpen, Trash2, Pencil,
  Loader2, LayoutGrid, Printer, ChevronDown, ChevronRight, Users,
  Copy,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { DashboardLayout } from '@/components/layout/dashboard-layout'

// ===== Types =====
interface RoutineItem {
  class_routine_id: number
  section_id: number
  subject_id: number
  time_start: string
  time_end: string
  day: string
  room: string
  subject?: { subject_id: number; name: string; teacher?: { teacher_id: number; name: string } | null }
  section?: { section_id: number; name: string; class?: { class_id: number; name: string } | null }
}

interface Subject {
  subject_id: number
  name: string
  teacher_id?: number | null
  teacher?: { teacher_id: number; name: string } | null
}

interface Section {
  section_id: number
  name: string
  class_id: number | null
  class?: { class_id: number; name: string } | null
  _count?: { enrolls: number }
  teacher?: { teacher_id: number; name: string } | null
}

interface ClassItem {
  class_id: number
  name: string
  name_numeric: number
  category: string
  section_id: number | null
  sections?: { section_id: number; name: string }[]
  _count?: { enrolls: number }
}

const ALL_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const DAY_SHORT: Record<string, string> = {
  Monday: 'MON', Tuesday: 'TUE', Wednesday: 'WED', Thursday: 'THU', Friday: 'FRI',
  Saturday: 'SAT', Sunday: 'SUN',
}

// Color palette for subjects
const SUBJECT_COLORS = [
  'bg-emerald-100 text-emerald-800 border-emerald-200',
  'bg-sky-100 text-sky-800 border-sky-200',
  'bg-amber-100 text-amber-800 border-amber-200',
  'bg-violet-100 text-violet-800 border-violet-200',
  'bg-rose-100 text-rose-800 border-rose-200',
  'bg-teal-100 text-teal-800 border-teal-200',
  'bg-orange-100 text-orange-800 border-orange-200',
  'bg-cyan-100 text-cyan-800 border-cyan-200',
  'bg-pink-100 text-pink-800 border-pink-200',
  'bg-slate-100 text-slate-800 border-slate-200',
]

function RoutineSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
            <LayoutGrid className="w-5 h-5 text-white" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-44" />
          </div>
        </div>
        <Skeleton className="h-11 w-32 rounded-lg" />
      </div>
      <Skeleton className="h-24 w-full rounded-xl" />
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}
      </div>
    </div>
  )
}

// ===== Main =====
export default function RoutinePage() {
  return (
    <DashboardLayout>
      <RoutineModule />
    </DashboardLayout>
  )
}

function RoutineModule() {
  const [classes, setClasses] = useState<ClassItem[]>([])
  const [allSections, setAllSections] = useState<Section[]>([])
  const [allSubjects, setAllSubjects] = useState<Subject[]>([])
  const [routines, setRoutines] = useState<RoutineItem[]>([])

  const [selectedClassId, setSelectedClassId] = useState('')
  const [selectedSectionId, setSelectedSectionId] = useState('')
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  // Accordion state for class list view
  const [expandedClass, setExpandedClass] = useState<string | null>(null)

  const [formOpen, setFormOpen] = useState(false)
  const [selectedRoutine, setSelectedRoutine] = useState<RoutineItem | null>(null)
  const [form, setForm] = useState({
    section_id: '', subject_id: '', time_start: '', time_end: '', day: '', room: '',
  })

  useEffect(() => {
    Promise.all([
      fetch('/api/classes').then(r => r.json()),
      fetch('/api/sections').then(r => r.json()),
      fetch('/api/subjects').then(r => r.json()),
    ]).then(([cls, sec, sub]) => {
      setClasses(Array.isArray(cls) ? cls : [])
      setAllSections(Array.isArray(sec) ? sec : [])
      setAllSubjects(Array.isArray(sub) ? sub : [])
    }).catch(() => {}).finally(() => setInitialLoading(false))
  }, [])

  // Filtered sections for selected class
  const filteredSections = useMemo(() => {
    if (!selectedClassId) return []
    return allSections.filter(s => s.class_id === parseInt(selectedClassId))
  }, [selectedClassId, allSections])

  // Filtered subjects for selected section
  const filteredSubjects = useMemo(() => {
    if (!selectedSectionId) return []
    return allSubjects.filter(s => s.section_id === parseInt(selectedSectionId))
  }, [selectedSectionId, allSubjects])

  // All routines for a class (for accordion list view)
  const [classRoutines, setClassRoutines] = useState<RoutineItem[]>([])
  const [classRoutinesLoading, setClassRoutinesLoading] = useState(false)

  const refreshRoutines = async () => {
    if (!selectedSectionId) { setRoutines([]); return }
    setLoading(true)
    try {
      const res = await fetch(`/api/routine?section_id=${selectedSectionId}`)
      const data = await res.json()
      setRoutines(data.routines || [])
    } catch {
      setRoutines([])
    }
    setLoading(false)
  }

  const refreshClassRoutines = async (classId: string) => {
    setClassRoutinesLoading(true)
    try {
      const res = await fetch(`/api/routine?class_id=${classId}`)
      const data = await res.json()
      setClassRoutines(data.routines || [])
    } catch {
      setClassRoutines([])
    }
    setClassRoutinesLoading(false)
  }

  useEffect(() => {
    const load = async () => { await refreshRoutines() }
    load()
  }, [selectedSectionId])

  // Toggle accordion class
  const toggleClass = (classId: string) => {
    if (expandedClass === classId) {
      setExpandedClass(null)
      setClassRoutines([])
    } else {
      setExpandedClass(classId)
      refreshClassRoutines(classId)
    }
  }

  const openCreate = (day?: string) => {
    setSelectedRoutine(null)
    setForm({
      section_id: selectedSectionId,
      subject_id: '',
      time_start: '08:00',
      time_end: '09:00',
      day: day || ALL_DAYS[0],
      room: '',
    })
    setFormOpen(true)
  }

  const openEdit = (routine: RoutineItem) => {
    setSelectedRoutine(routine)
    setForm({
      section_id: routine.section_id.toString(),
      subject_id: routine.subject_id.toString(),
      time_start: routine.time_start,
      time_end: routine.time_end,
      day: routine.day,
      room: routine.room,
    })
    setFormOpen(true)
  }

  const handleSave = async () => {
    if (!form.subject_id || !form.time_start || !form.time_end || !form.day) {
      toast.error('Please fill in all required fields')
      return
    }

    setSaving(true)
    try {
      if (selectedRoutine) {
        await fetch('/api/routine', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ class_routine_id: selectedRoutine.class_routine_id, ...form }),
        })
        toast.success('Routine updated')
      } else {
        await fetch('/api/routine', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
        toast.success('Routine item added')
      }
      setFormOpen(false)
      refreshRoutines()
    } catch {
      toast.error('Failed to save routine')
    }
    setSaving(false)
  }

  const handleDelete = async (id: number) => {
    try {
      await fetch(`/api/routine/${id}`, { method: 'DELETE' })
      toast.success('Routine item removed')
      refreshRoutines()
    } catch {
      toast.error('Failed to delete')
    }
  }

  // Get unique time slots
  const timeSlots = useMemo(() => {
    const slots = new Set<string>()
    routines.forEach(r => { slots.add(r.time_start); slots.add(r.time_end) })
    return Array.from(slots).sort()
  }, [routines])

  // Build grid: days x time slots
  const routineGrid = useMemo(() => {
    if (timeSlots.length < 2) return {}
    const grid: Record<string, RoutineItem> = {}
    routines.forEach(r => {
      const key = `${r.day}-${r.time_start}`
      grid[key] = r
    })
    return grid
  }, [routines, timeSlots])

  // Get active days (days that have routines)
  const activeDays = useMemo(() => {
    const usedDays = new Set(routines.map(r => r.day))
    return ALL_DAYS.filter(d => usedDays.has(d))
  }, [routines])

  // Get period slots
  const periods = useMemo(() => {
    if (routines.length === 0) return []
    const sortedRoutines = [...routines].sort((a, b) => a.time_start.localeCompare(b.time_start))
    const seen = new Set<string>()
    return sortedRoutines.filter(r => {
      if (seen.has(r.time_start)) return false
      seen.add(r.time_start)
      return true
    }).map(r => r.time_start)
  }, [routines])

  const handlePrint = () => {
    window.print()
  }

  const getSubjectColor = (subjectId: number): string => {
    const idx = allSubjects.findIndex(s => s.subject_id === subjectId)
    return SUBJECT_COLORS[idx % SUBJECT_COLORS.length]
  }

  const getSubjectName = (routine: RoutineItem): string => {
    return routine.subject?.name || 'Unknown'
  }

  const getTeacherName = (routine: RoutineItem): string => {
    return routine.subject?.teacher?.name || ''
  }

  // Stat cards
  const routineStats = useMemo(() => {
    const totalPeriods = routines.length
    const subjectsUsed = new Set(routines.map(r => r.subject_id)).size
    const daysActive = new Set(routines.map(r => r.day)).size
    return { totalPeriods, subjectsUsed, daysActive }
  }, [routines])

  // Group class routines by section and day for accordion view
  const classRoutinesByDay = useMemo(() => {
    const grouped: Record<string, Record<string, RoutineItem[]>> = {}
    classRoutines.forEach(r => {
      const sectionName = r.section?.name || 'Unknown'
      if (!grouped[sectionName]) grouped[sectionName] = {}
      if (!grouped[sectionName][r.day]) grouped[sectionName][r.day] = []
      grouped[sectionName][r.day].push(r)
    })
    // Sort each day's routines by time
    Object.values(grouped).forEach(dayMap => {
      Object.entries(dayMap).forEach(([day, items]) => {
        dayMap[day] = items.sort((a, b) => a.time_start.localeCompare(b.time_start))
      })
    })
    return grouped
  }, [classRoutines])

  if (initialLoading) {
    return <RoutineSkeleton />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
            <LayoutGrid className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Class Routine</h1>
            <p className="text-sm text-slate-500">Weekly timetable management</p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="outline"
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 min-h-[44px]"
          >
            {viewMode === 'grid' ? <Copy className="w-4 h-4 mr-2" /> : <LayoutGrid className="w-4 h-4 mr-2" />}
            {viewMode === 'grid' ? 'Class List' : 'Grid View'}
          </Button>
          <Button
            onClick={handlePrint}
            className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 min-h-[44px]"
          >
            <Printer className="w-4 h-4 mr-2" /> Print
          </Button>
          <Button
            onClick={() => openCreate()}
            className="bg-emerald-600 hover:bg-emerald-700 min-h-[44px]"
          >
            <Plus className="w-4 h-4 mr-2" /> Add Period
          </Button>
        </div>
      </div>

      {/* ===================== CLASS LIST VIEW (CI3 accordion parity) ===================== */}
      {viewMode === 'list' && (
        <div className="space-y-3">
          {classes.length === 0 ? (
            <Card className="border-slate-200/60">
              <CardContent className="py-12 text-center">
                <p className="text-slate-500">No classes found. Create classes first.</p>
              </CardContent>
            </Card>
          ) : (
            classes.map(cls => {
              const isExpanded = expandedClass === cls.class_id.toString()
              const sectionsForClass = allSections.filter(s => s.class_id === cls.class_id)
              const classRoutineCount = classRoutines.filter(r => r.section?.class?.class_id === cls.class_id).length

              return (
                <Card key={cls.class_id} className="border-slate-200/60 overflow-hidden">
                  <button
                    onClick={() => toggleClass(cls.class_id.toString())}
                    className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                        <BookOpen className="w-4 h-4 text-emerald-600" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-slate-900">Class {cls.name}</h3>
                        <p className="text-xs text-slate-500">
                          {sectionsForClass.length} section{sectionsForClass.length !== 1 ? 's' : ''}
                          {isExpanded && classRoutineCount > 0 ? ` · ${classRoutineCount} periods` : ''}
                          {cls.category ? ` · ${cls.category}` : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isExpanded && (
                        <Button
                          size="sm"
                          className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700"
                          onClick={(e) => {
                            e.stopPropagation()
                            if (sectionsForClass.length > 0) {
                              setSelectedClassId(cls.class_id.toString())
                              setSelectedSectionId(sectionsForClass[0].section_id.toString())
                              setViewMode('grid')
                              setTimeout(() => openCreate(), 100)
                            }
                          }}
                        >
                          <Plus className="w-3 h-3 mr-1" /> Add
                        </Button>
                      )}
                      {isExpanded ? <ChevronDown className="w-5 h-5 text-slate-400" /> : <ChevronRight className="w-5 h-5 text-slate-400" />}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-slate-100 bg-slate-50/50 p-5">
                      {classRoutinesLoading ? (
                        <div className="space-y-3">
                          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}
                        </div>
                      ) : sectionsForClass.length === 0 ? (
                        <div className="text-center py-6">
                          <p className="text-xs text-slate-500">No sections in this class.</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {sectionsForClass.map(section => {
                            const dayMap = classRoutinesByDay[section.name]
                            if (!dayMap || Object.keys(dayMap).length === 0) {
                              return (
                                <div key={section.section_id} className="rounded-lg border border-slate-200 bg-white p-4">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Users className="w-4 h-4 text-slate-500" />
                                    <span className="text-sm font-semibold text-slate-700">{section.name}</span>
                                    {section.teacher && (
                                      <Badge variant="secondary" className="text-[10px] ml-2">{section.teacher.name}</Badge>
                                    )}
                                  </div>
                                  <p className="text-xs text-slate-400 ml-6">No routine set for this section.</p>
                                </div>
                              )
                            }
                            return (
                              <div key={section.section_id} className="rounded-lg border border-slate-200 bg-white overflow-hidden">
                                <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 border-b border-slate-200">
                                  <Users className="w-4 h-4 text-slate-600" />
                                  <span className="text-sm font-semibold text-slate-700">{section.name}</span>
                                  {section.teacher && (
                                    <Badge variant="secondary" className="text-[10px] ml-2">{section.teacher.name}</Badge>
                                  )}
                                </div>
                                <div className="divide-y divide-slate-100">
                                  {ALL_DAYS.filter(d => dayMap[d] && dayMap[d].length > 0).map(day => (
                                    <div key={day} className="px-4 py-3">
                                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{day}</p>
                                      <div className="flex flex-wrap gap-2">
                                        {dayMap[day].map(routine => (
                                          <div
                                            key={routine.class_routine_id}
                                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium cursor-pointer hover:shadow-sm transition-all ${getSubjectColor(routine.subject_id)}`}
                                            onClick={() => {
                                              setSelectedSectionId(routine.section_id.toString())
                                              setViewMode('grid')
                                              setTimeout(() => openEdit(routine), 100)
                                            }}
                                          >
                                            <span>{getSubjectName(routine)}</span>
                                            <span className="opacity-60">({routine.time_start}-{routine.time_end})</span>
                                            {getTeacherName(routine) && (
                                              <span className="opacity-50">· {getTeacherName(routine)}</span>
                                            )}
                                            {routine.room && (
                                              <MapPin className="w-3 h-3 opacity-50" />
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              )
            })
          )}
        </div>
      )}

      {/* ===================== GRID VIEW ===================== */}
      {viewMode === 'grid' && (
        <>
          {/* Class/Section Selector */}
          <Card className="border-slate-200/60">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-600">Class</label>
                  <Select value={selectedClassId} onValueChange={v => { setSelectedClassId(v); setSelectedSectionId(''); setRoutines([]) }}>
                    <SelectTrigger className="min-h-[44px] bg-slate-50 border-slate-200 focus:bg-white"><SelectValue placeholder="Select class" /></SelectTrigger>
                    <SelectContent>
                      {classes.map(c => (
                        <SelectItem key={c.class_id} value={c.class_id.toString()}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-600">Section</label>
                  <Select value={selectedSectionId} onValueChange={setSelectedSectionId}>
                    <SelectTrigger className="min-h-[44px] bg-slate-50 border-slate-200 focus:bg-white"><SelectValue placeholder="Select section" /></SelectTrigger>
                    <SelectContent>
                      {filteredSections.map(s => (
                        <SelectItem key={s.section_id} value={s.section_id.toString()}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Timetable Grid */}
          {!selectedSectionId ? (
            <div className="rounded-2xl border border-slate-200 bg-white">
              <div className="flex flex-col items-center justify-center py-16">
                <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center mb-4">
                  <Calendar className="w-7 h-7 text-emerald-300" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-1">Select a Section</h3>
                <p className="text-sm text-slate-500">Choose a class and section to view the timetable</p>
              </div>
            </div>
          ) : loading ? (
            <Card className="border-slate-200/60">
              <CardContent className="p-6 space-y-4">
                {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}
              </CardContent>
            </Card>
          ) : routines.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white">
              <div className="flex flex-col items-center justify-center py-16">
                <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center mb-4">
                  <Calendar className="w-7 h-7 text-emerald-300" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-1">No Routine Set</h3>
                <p className="text-sm text-slate-500 mb-4">Add periods to create the weekly timetable</p>
                <Button onClick={() => openCreate()} className="bg-emerald-600 hover:bg-emerald-700 min-h-[44px]">
                  <Plus className="w-4 h-4 mr-2" /> Add First Period
                </Button>
              </div>
            </div>
          ) : (
            <Card className="border-slate-200/60">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <CardTitle className="text-lg">Weekly Timetable</CardTitle>
                    <CardDescription>{routines.length} periods per week</CardDescription>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-100">
                      <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-xs font-semibold text-emerald-700">{routineStats.totalPeriods}</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-50 border border-sky-100">
                      <Calendar className="w-3.5 h-3.5 text-sky-600" />
                      <span className="text-xs font-semibold text-sky-700">{routineStats.daysActive} days</span>
                    </div>
                    <div className="hidden sm:flex items-center gap-2 flex-wrap">
                      {allSubjects.filter(s => routines.some(r => r.subject_id === s.subject_id)).map((s, i) => (
                        <Badge key={s.subject_id} className={`text-xs ${SUBJECT_COLORS[i % SUBJECT_COLORS.length]}`}>
                          {s.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Desktop Grid View */}
                <div className="hidden md:block overflow-x-auto">
                  <div className="min-w-[700px]">
                    {/* Header Row */}
                    <div className={`grid gap-1 mb-1 ${activeDays.length + 1}`}>
                      <div className="p-2 text-xs font-semibold text-slate-500 text-center">Time / Day</div>
                      {activeDays.map(day => (
                        <div key={day} className="p-2 text-xs font-bold text-slate-700 text-center bg-slate-100 rounded-lg uppercase">
                          {day}
                        </div>
                      ))}
                    </div>

                    {/* Time Slot Rows */}
                    {periods.map(timeStart => {
                      const periodRoutines = routines.filter(r => r.time_start === timeStart)
                      const timeEnd = periodRoutines[0]?.time_end || ''
                      return (
                        <div key={timeStart} className={`grid gap-1 mb-1 ${activeDays.length + 1}`}>
                          <div className="p-2 text-center">
                            <p className="text-xs font-bold text-slate-700">{timeStart}</p>
                            <p className="text-[10px] text-slate-400">{timeEnd}</p>
                          </div>
                          {activeDays.map(day => {
                            const routine = routineGrid[`${day}-${timeStart}`]
                            return (
                              <div
                                key={`${day}-${timeStart}`}
                                onClick={() => routine ? openEdit(routine) : openCreate(day)}
                                className={`min-h-[60px] rounded-lg border-2 border-dashed cursor-pointer transition-all p-2 flex flex-col items-center justify-center ${
                                  routine
                                    ? getSubjectColor(routine.subject_id) + ' border-solid hover:shadow-md'
                                    : 'border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50'
                                }`}
                              >
                                {routine ? (
                                  <>
                                    <p className="text-xs font-bold truncate w-full text-center">{getSubjectName(routine)}</p>
                                    <p className="text-[10px] opacity-70 mt-0.5">{routine.time_start}-{routine.time_end}</p>
                                    {getTeacherName(routine) && (
                                      <p className="text-[10px] opacity-60 mt-0.5 flex items-center gap-0.5">
                                        <Users className="w-2.5 h-2.5" />{getTeacherName(routine)}
                                      </p>
                                    )}
                                    {routine.room && (
                                      <p className="text-[10px] opacity-50 flex items-center gap-0.5 mt-0.5">
                                        <MapPin className="w-2.5 h-2.5" />{routine.room}
                                      </p>
                                    )}
                                  </>
                                ) : (
                                  <Plus className="w-4 h-4 text-slate-300" />
                                )}
                              </div>
                            )
                          })}
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Mobile View - Day Tabs */}
                <div className="md:hidden space-y-4">
                  {activeDays.map(day => {
                    const dayRoutines = routines.filter(r => r.day === day)
                    return (
                      <div key={day}>
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className="bg-emerald-100 text-emerald-700 font-bold">{DAY_SHORT[day]}</Badge>
                          <span className="text-sm font-medium text-slate-700">{day}</span>
                          <span className="text-xs text-slate-400 ml-auto">{dayRoutines.length} periods</span>
                        </div>
                        {dayRoutines.length === 0 ? (
                          <div
                            onClick={() => openCreate(day)}
                            className="border-2 border-dashed border-slate-200 rounded-lg p-4 text-center cursor-pointer hover:border-emerald-300 hover:bg-emerald-50/50 transition-colors"
                          >
                            <Plus className="w-4 h-4 mx-auto text-slate-300 mb-1" />
                            <p className="text-xs text-slate-400">Tap to add period</p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {dayRoutines.sort((a, b) => a.time_start.localeCompare(b.time_start)).map(routine => (
                              <div
                                key={routine.class_routine_id}
                                onClick={() => openEdit(routine)}
                                className={`rounded-lg border p-3 cursor-pointer hover:shadow-md transition-all ${getSubjectColor(routine.subject_id)}`}
                              >
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="font-bold text-sm">{getSubjectName(routine)}</p>
                                    <div className="flex items-center gap-2 mt-1 text-[11px] opacity-75">
                                      <span className="flex items-center gap-0.5"><Clock className="w-3 h-3" />{routine.time_start} - {routine.time_end}</span>
                                      {getTeacherName(routine) && (
                                        <span className="flex items-center gap-0.5"><Users className="w-3 h-3" />{getTeacherName(routine)}</span>
                                      )}
                                      {routine.room && <span className="flex items-center gap-0.5"><MapPin className="w-3 h-3" />{routine.room}</span>}
                                    </div>
                                  </div>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 opacity-50 hover:opacity-100" onClick={(e) => { e.stopPropagation(); handleDelete(routine.class_routine_id) }}>
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedRoutine ? <Pencil className="w-5 h-5 text-emerald-600" /> : <Plus className="w-5 h-5 text-emerald-600" />}
              {selectedRoutine ? 'Edit Period' : 'Add Period'}
            </DialogTitle>
            <DialogDescription>
              {selectedRoutine ? 'Update routine details' : 'Add a new period to the timetable'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Subject *</Label>
              <Select value={form.subject_id} onValueChange={v => setForm({ ...form, subject_id: v })}>
                <SelectTrigger className="bg-slate-50 border-slate-200 focus:bg-white"><SelectValue placeholder="Select subject" /></SelectTrigger>
                <SelectContent>
                  {filteredSubjects.map(s => (
                    <SelectItem key={s.subject_id} value={s.subject_id.toString()}>
                      {s.name}{s.teacher ? ` (${s.teacher.name})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Day *</Label>
              <Select value={form.day} onValueChange={v => setForm({ ...form, day: v })}>
                <SelectTrigger className="bg-slate-50 border-slate-200 focus:bg-white"><SelectValue placeholder="Select day" /></SelectTrigger>
                <SelectContent>
                  {ALL_DAYS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Start Time *</Label>
                <Input type="time" value={form.time_start} onChange={e => setForm({ ...form, time_start: e.target.value })} className="min-h-[44px]" />
              </div>
              <div className="grid gap-2">
                <Label>End Time *</Label>
                <Input type="time" value={form.time_end} onChange={e => setForm({ ...form, time_end: e.target.value })} className="min-h-[44px]" />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Room</Label>
              <Input value={form.room} onChange={e => setForm({ ...form, room: e.target.value })} placeholder="e.g., Room 101" className="min-h-[44px]" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)} className="min-h-[44px]">Cancel</Button>
            {selectedRoutine && (
              <Button
                variant="destructive"
                onClick={() => { handleDelete(selectedRoutine.class_routine_id); setFormOpen(false) }}
                className="min-h-[44px]"
              >
                <Trash2 className="w-4 h-4 mr-2" /> Delete
              </Button>
            )}
            <Button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700 min-h-[44px]" disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {selectedRoutine ? 'Update' : 'Add'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
