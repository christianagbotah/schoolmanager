'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useToast } from '@/hooks/use-toast'
import {
  Calendar, Plus, Clock, MapPin, BookOpen, Trash2, Pencil,
  Loader2, GripVertical,
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
}

interface Subject {
  subject_id: number
  name: string
}

interface Section {
  section_id: number
  name: string
}

interface ClassItem {
  class_id: number
  name: string
  category: string
  section_id: number | null
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
const DAY_SHORT: Record<string, string> = {
  Monday: 'MON', Tuesday: 'TUE', Wednesday: 'WED', Thursday: 'THU', Friday: 'FRI',
}

// Color palette for subjects
const SUBJECT_COLORS = [
  'bg-emerald-100 text-emerald-800 border-emerald-200',
  'bg-blue-100 text-blue-800 border-blue-200',
  'bg-amber-100 text-amber-800 border-amber-200',
  'bg-purple-100 text-purple-800 border-purple-200',
  'bg-rose-100 text-rose-800 border-rose-200',
  'bg-teal-100 text-teal-800 border-teal-200',
  'bg-orange-100 text-orange-800 border-orange-200',
  'bg-cyan-100 text-cyan-800 border-cyan-200',
  'bg-pink-100 text-pink-800 border-pink-200',
  'bg-indigo-100 text-indigo-800 border-indigo-200',
]

// ===== Main =====
export default function RoutinePage() {
  return (
    <DashboardLayout>
      <RoutineModule />
    </DashboardLayout>
  )
}

function RoutineModule() {
  const { toast } = useToast()

  const [classes, setClasses] = useState<ClassItem[]>([])
  const [sections, setSections] = useState<Section[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [routines, setRoutines] = useState<RoutineItem[]>([])

  const [selectedClassId, setSelectedClassId] = useState('')
  const [selectedSectionId, setSelectedSectionId] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

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
      setSections(Array.isArray(sec) ? sec : [])
      setSubjects(Array.isArray(sub) ? sub : [])
    }).catch(() => {})
  }, [])

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

  useEffect(() => {
    const load = async () => { await refreshRoutines() }
    load()
    // eslint-disable-next-line react-hooks/set-state-in-effect
  }, [selectedSectionId])

  const openCreate = (day?: string) => {
    setSelectedRoutine(null)
    setForm({
      section_id: selectedSectionId,
      subject_id: '',
      time_start: '08:00',
      time_end: '09:00',
      day: day || DAYS[0],
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
      toast({ title: 'Error', description: 'Please fill in all required fields', variant: 'destructive' })
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
        toast({ title: 'Updated', description: 'Routine updated' })
      } else {
        await fetch('/api/routine', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
        toast({ title: 'Created', description: 'Routine item added' })
      }
      setFormOpen(false)
      refreshRoutines()
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to save routine', variant: 'destructive' })
    }
    setSaving(false)
  }

  const handleDelete = async (id: number) => {
    try {
      await fetch(`/api/routine/${id}`, { method: 'DELETE' })
      toast({ title: 'Deleted', description: 'Routine item removed' })
      refreshRoutines()
    } catch {
      toast({ title: 'Error', description: 'Failed to delete', variant: 'destructive' })
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

  const getSubjectColor = (subjectId: number): string => {
    const idx = subjects.findIndex(s => s.subject_id === subjectId)
    return SUBJECT_COLORS[idx % SUBJECT_COLORS.length]
  }

  const getSubjectName = (subjectId: number): string => {
    return subjects.find(s => s.subject_id === subjectId)?.name || 'Unknown'
  }

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Class Routine</h1>
          <p className="text-sm text-slate-500 mt-1">Weekly timetable management</p>
        </div>
        <Button
          onClick={() => openCreate()}
          className="bg-emerald-600 hover:bg-emerald-700 min-h-[44px]"
          disabled={!selectedSectionId}
        >
          <Plus className="w-4 h-4 mr-2" /> Add Period
        </Button>
      </div>

      {/* Class/Section Selector */}
      <Card className="border-slate-200/60">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-600">Class</label>
              <Select value={selectedClassId} onValueChange={v => { setSelectedClassId(v); setSelectedSectionId('') }}>
                <SelectTrigger className="min-h-[44px]"><SelectValue placeholder="Select class" /></SelectTrigger>
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
                <SelectTrigger className="min-h-[44px]"><SelectValue placeholder="Select section" /></SelectTrigger>
                <SelectContent>
                  {sections.map(s => (
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
        <Card className="border-slate-200/60">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Calendar className="w-12 h-12 text-slate-300 mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-1">Select a Section</h3>
            <p className="text-sm text-slate-500">Choose a class and section to view the timetable</p>
          </CardContent>
        </Card>
      ) : loading ? (
        <Card className="border-slate-200/60">
          <CardContent className="p-6 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}
          </CardContent>
        </Card>
      ) : routines.length === 0 ? (
        <Card className="border-slate-200/60">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Calendar className="w-12 h-12 text-slate-300 mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-1">No Routine Set</h3>
            <p className="text-sm text-slate-500 mb-4">Add periods to create the weekly timetable</p>
            <Button onClick={() => openCreate()} className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="w-4 h-4 mr-2" /> Add First Period
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-slate-200/60">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Weekly Timetable</CardTitle>
                <CardDescription>{routines.length} periods per week</CardDescription>
              </div>
              <div className="hidden sm:flex items-center gap-2 flex-wrap">
                {subjects.filter(s => routines.some(r => r.subject_id === s.subject_id)).map((s, i) => (
                  <Badge key={s.subject_id} className={`text-xs ${SUBJECT_COLORS[i % SUBJECT_COLORS.length]}`}>
                    {s.name}
                  </Badge>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Desktop Grid View */}
            <div className="hidden md:block overflow-x-auto">
              <div className="min-w-[700px]">
                {/* Header Row */}
                <div className="grid grid-cols-6 gap-1 mb-1">
                  <div className="p-2 text-xs font-semibold text-slate-500 text-center">Time / Day</div>
                  {DAYS.map(day => (
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
                    <div key={timeStart} className="grid grid-cols-6 gap-1 mb-1">
                      <div className="p-2 text-center">
                        <p className="text-xs font-bold text-slate-700">{timeStart}</p>
                        <p className="text-[10px] text-slate-400">{timeEnd}</p>
                      </div>
                      {DAYS.map(day => {
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
                                <p className="text-xs font-bold truncate w-full text-center">{getSubjectName(routine.subject_id)}</p>
                                <p className="text-[10px] opacity-70 mt-0.5">{routine.time_start}-{routine.time_end}</p>
                                {routine.room && (
                                  <p className="text-[10px] opacity-60 flex items-center gap-0.5 mt-0.5">
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
              {DAYS.map(day => {
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
                                <p className="font-bold text-sm">{getSubjectName(routine.subject_id)}</p>
                                <div className="flex items-center gap-2 mt-1 text-[11px] opacity-75">
                                  <span className="flex items-center gap-0.5"><Clock className="w-3 h-3" />{routine.time_start} - {routine.time_end}</span>
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

      {/* Add/Edit Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedRoutine ? 'Edit Period' : 'Add Period'}</DialogTitle>
            <DialogDescription>
              {selectedRoutine ? 'Update routine details' : 'Add a new period to the timetable'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Subject *</Label>
              <Select value={form.subject_id} onValueChange={v => setForm({ ...form, subject_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
                <SelectContent>
                  {subjects.map(s => <SelectItem key={s.subject_id} value={s.subject_id.toString()}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Day *</Label>
              <Select value={form.day} onValueChange={v => setForm({ ...form, day: v })}>
                <SelectTrigger><SelectValue placeholder="Select day" /></SelectTrigger>
                <SelectContent>
                  {DAYS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Start Time *</Label>
                <Input type="time" value={form.time_start} onChange={e => setForm({ ...form, time_start: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label>End Time *</Label>
                <Input type="time" value={form.time_end} onChange={e => setForm({ ...form, time_end: e.target.value })} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Room</Label>
              <Input value={form.room} onChange={e => setForm({ ...form, room: e.target.value })} placeholder="e.g., Room 101" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
            {selectedRoutine && (
              <Button
                variant="destructive"
                onClick={() => { handleDelete(selectedRoutine.class_routine_id); setFormOpen(false) }}
              >
                <Trash2 className="w-4 h-4 mr-2" /> Delete
              </Button>
            )}
            <Button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700" disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {selectedRoutine ? 'Update' : 'Add'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
