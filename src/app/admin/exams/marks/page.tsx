'use client'

import { useState, useEffect, useCallback } from 'react'
import { useToast } from '@/hooks/use-toast'
import {
  GraduationCap, Search, Loader2, Save, Filter, FileText, Users, AlertCircle, CheckCircle2,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
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
import { Label } from '@/components/ui/label'
import { DashboardLayout } from '@/components/layout/dashboard-layout'

// ===== Types =====
interface Exam { exam_id: number; name: string; year: string; type: string }
interface ClassItem { class_id: number; name: string; name_numeric: number; category: string }
interface Section { section_id: number; name: string }
interface Subject { subject_id: number; name: string }
interface StudentMark {
  student_id: number
  name: string
  student_code: string
  mark_id: number | null
  mark_obtained: number
  comment: string
  parent: { parent_id: number; name: string; phone: string; email: string } | null
}

// ===== Main =====
export default function ExamMarksPage() {
  return (
    <DashboardLayout>
      <ExamMarksModule />
    </DashboardLayout>
  )
}

function ExamMarksModule() {
  const { toast } = useToast()
  const [exams, setExams] = useState<Exam[]>([])
  const [classes, setClasses] = useState<ClassItem[]>([])
  const [sections, setSections] = useState<Section[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [students, setStudents] = useState<StudentMark[]>([])
  const [loading, setLoading] = useState(true)
  const [marksLoading, setMarksLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const [selectedExam, setSelectedExam] = useState('')
  const [selectedClass, setSelectedClass] = useState('')
  const [selectedSection, setSelectedSection] = useState('')
  const [selectedSubject, setSelectedSubject] = useState('')
  const [markEntries, setMarkEntries] = useState<Record<number, { mark_obtained: number; comment: string }>>({})

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [examsRes, classesRes] = await Promise.all([
        fetch('/api/exams'),
        fetch('/api/classes'),
      ])
      const examsData = await examsRes.json()
      const classesData = await classesRes.json()
      setExams(Array.isArray(examsData) ? examsData : (examsData.exams || []))
      setClasses(Array.isArray(classesData) ? classesData : [])
    } catch {
      toast({ title: 'Error', description: 'Failed to fetch data', variant: 'destructive' })
    }
    setLoading(false)
  }, [toast])

  useEffect(() => { fetchData() }, [fetchData])

  // Load sections when class changes
  useEffect(() => {
    if (!selectedClass) { setSections([]); return }
    const loadSections = async () => {
      try {
        const res = await fetch(`/api/sections?class_id=${selectedClass}`)
        const data = await res.json()
        const secs = Array.isArray(data) ? data : (data.sections || [])
        setSections(secs)
        if (secs.length > 0) setSelectedSection(secs[0].section_id.toString())
        else setSelectedSection('')
      } catch { setSections([]) }
    }
    loadSections()
  }, [selectedClass])

  // Load subjects when class changes
  useEffect(() => {
    if (!selectedClass) { setSubjects([]); return }
    const loadSubjects = async () => {
      try {
        const res = await fetch(`/api/subjects?class_id=${selectedClass}`)
        const data = await res.json()
        setSubjects(Array.isArray(data) ? data : (data.subjects || []))
      } catch { setSubjects([]) }
    }
    loadSubjects()
  }, [selectedClass])

  // Load marks when all selectors are filled
  const loadMarks = useCallback(async () => {
    if (!selectedExam || !selectedClass || !selectedSubject) return
    setMarksLoading(true)
    try {
      const params = new URLSearchParams({
        exam_id: selectedExam,
        class_id: selectedClass,
        subject_id: selectedSubject,
      })
      if (selectedSection) params.set('section_id', selectedSection)

      const res = await fetch(`/api/admin/exams/marks?${params}`)
      const data = await res.json()
      setStudents(data.students || [])

      // Initialize mark entries
      const entries: Record<number, { mark_obtained: number; comment: string }> = {}
      for (const s of (data.students || [])) {
        entries[s.student_id] = { mark_obtained: s.mark_obtained || 0, comment: s.comment || '' }
      }
      setMarkEntries(entries)
    } catch {
      toast({ title: 'Error', description: 'Failed to load marks', variant: 'destructive' })
    }
    setMarksLoading(false)
  }, [selectedExam, selectedClass, selectedSection, selectedSubject, toast])

  useEffect(() => {
    if (selectedExam && selectedClass && selectedSubject) loadMarks()
  }, [selectedExam, selectedClass, selectedSection, selectedSubject, loadMarks])

  const handleSave = async () => {
    if (!selectedExam || !selectedClass || !selectedSubject) return
    setSaving(true)
    try {
      const records = Object.entries(markEntries).map(([studentId, entry]) => ({
        student_id: parseInt(studentId),
        subject_id: parseInt(selectedSubject),
        class_id: parseInt(selectedClass),
        section_id: selectedSection ? parseInt(selectedSection) : null,
        exam_id: parseInt(selectedExam),
        ...entry,
      }))

      const res = await fetch('/api/admin/exams/marks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ records }),
      })

      if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Failed') }
      toast({ title: 'Success', description: `Marks saved for ${records.length} students` })
    } catch (err) {
      toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' })
    }
    setSaving(false)
  }

  const updateMark = (studentId: number, field: 'mark_obtained' | 'comment', value: string) => {
    setMarkEntries(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: field === 'mark_obtained' ? parseFloat(value) || 0 : value,
      },
    }))
  }

  const exam = exams.find(e => e.exam_id.toString() === selectedExam)
  const cls = classes.find(c => c.class_id.toString() === selectedClass)
  const subj = subjects.find(s => s.subject_id.toString() === selectedSubject)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            <GraduationCap className="w-6 h-6 inline-block mr-2 text-emerald-600" />
            Manage Exam Marks
          </h1>
          <p className="text-sm text-slate-500 mt-1">Enter and manage student marks for examinations</p>
        </div>
      </div>

      {/* Filters */}
      <Card className="border-slate-200/60">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="w-5 h-5 text-emerald-600" />
            Select Criteria
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Exam *</Label>
                <Select value={selectedExam} onValueChange={setSelectedExam}>
                  <SelectTrigger className="min-h-[44px]"><SelectValue placeholder="Select exam" /></SelectTrigger>
                  <SelectContent>
                    {exams.map(e => (
                      <SelectItem key={e.exam_id} value={e.exam_id.toString()}>{e.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Class *</Label>
                <Select value={selectedClass} onValueChange={v => { setSelectedClass(v); setSelectedSubject('') }}>
                  <SelectTrigger className="min-h-[44px]"><SelectValue placeholder="Select class" /></SelectTrigger>
                  <SelectContent>
                    {classes.map(c => (
                      <SelectItem key={c.class_id} value={c.class_id.toString()}>{c.name} {c.name_numeric}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Section</Label>
                <Select value={selectedSection} onValueChange={setSelectedSection}>
                  <SelectTrigger className="min-h-[44px]"><SelectValue placeholder={sections.length === 0 ? 'N/A' : 'Select section'} /></SelectTrigger>
                  <SelectContent>
                    {sections.map(s => (
                      <SelectItem key={s.section_id} value={s.section_id.toString()}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Subject *</Label>
                <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                  <SelectTrigger className="min-h-[44px]"><SelectValue placeholder={subjects.length === 0 ? 'Select class first' : 'Select subject'} /></SelectTrigger>
                  <SelectContent>
                    {subjects.map(s => (
                      <SelectItem key={s.subject_id} value={s.subject_id.toString()}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Marks Table */}
      {selectedExam && selectedClass && selectedSubject && (
        <Card className="border-slate-200/60">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-lg">
                  Marks Entry — {exam?.name}
                </CardTitle>
                <CardDescription>
                  {cls?.name} {cls?.name_numeric} &middot; {subj?.name} &middot; {students.length} students
                </CardDescription>
              </div>
              <Button
                onClick={handleSave}
                className="bg-emerald-600 hover:bg-emerald-700 min-h-[44px]"
                disabled={saving || students.length === 0}
              >
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                {saving ? 'Saving...' : 'Save Marks'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {marksLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}
              </div>
            ) : students.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <AlertCircle className="w-12 h-12 text-slate-300 mb-3" />
                <h3 className="text-lg font-semibold text-slate-900 mb-1">No Students Found</h3>
                <p className="text-sm text-slate-500">No enrolled students match the selected criteria</p>
              </div>
            ) : (
              <div className="max-h-[500px] overflow-y-auto rounded-lg border border-slate-200 custom-scrollbar">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50 hover:bg-slate-50">
                      <TableHead className="w-10">#</TableHead>
                      <TableHead className="hidden sm:table-cell">ID</TableHead>
                      <TableHead>Student Name</TableHead>
                      <TableHead className="w-36 text-center">Mark Obtained</TableHead>
                      <TableHead className="hidden md:table-cell w-48">Comment</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map((student, idx) => {
                      const entry = markEntries[student.student_id] || { mark_obtained: 0, comment: '' }
                      return (
                        <TableRow key={student.student_id} className="hover:bg-slate-50 transition-colors">
                          <TableCell className="text-sm text-slate-500">{idx + 1}</TableCell>
                          <TableCell className="hidden sm:table-cell text-sm text-slate-400 font-mono">{student.student_code}</TableCell>
                          <TableCell className="font-semibold text-slate-900">{student.name}</TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              step="0.5"
                              value={entry.mark_obtained || ''}
                              onChange={e => updateMark(student.student_id, 'mark_obtained', e.target.value)}
                              className="h-10 text-center font-semibold min-h-[44px]"
                              placeholder="0"
                            />
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <Input
                              value={entry.comment}
                              onChange={e => updateMark(student.student_id, 'comment', e.target.value)}
                              className="h-10 min-h-[44px]"
                              placeholder="Optional comment"
                            />
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
      )}
    </div>
  )
}
