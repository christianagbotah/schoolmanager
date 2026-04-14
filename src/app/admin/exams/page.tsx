'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { useToast } from '@/hooks/use-toast'
import {
  FileText, Plus, Search, MoreHorizontal, Pencil, Trash2, Eye,
  Calendar, GraduationCap, Loader2, Filter,
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
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { DashboardLayout } from '@/components/layout/dashboard-layout'

// ===== Types =====
interface Exam {
  exam_id: number
  name: string
  date: string | null
  comment: string
  year: string
  class_id: number | null
  section_id: number | null
  type: string
  class: { class_id: number; name: string; category: string } | null
}

interface ClassItem {
  class_id: number
  name: string
  category: string
}

interface Section {
  section_id: number
  name: string
}

const EXAM_TYPES = ['Mid-term', 'Terminal', 'Mock', 'Final', 'Class Test', 'Quiz', 'Assignment']

// ===== Main =====
export default function ExamsPage() {
  return (
    <DashboardLayout>
      <ExamsModule />
    </DashboardLayout>
  )
}

function ExamsModule() {
  const { toast } = useToast()
  const [exams, setExams] = useState<Exam[]>([])
  const [classes, setClasses] = useState<ClassItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [filterClass, setFilterClass] = useState('all')

  // Dialog states
  const [formOpen, setFormOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null)

  // Form
  const [form, setForm] = useState({
    name: '', date: '', comment: '', year: new Date().getFullYear().toString(),
    class_id: '', section_id: '', type: '',
  })
  const [saving, setSaving] = useState(false)

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

  const openCreate = () => {
    setSelectedExam(null)
    setForm({ name: '', date: '', comment: '', year: new Date().getFullYear().toString(), class_id: '', section_id: '', type: '' })
    setFormOpen(true)
  }

  const openEdit = (exam: Exam) => {
    setSelectedExam(exam)
    setForm({
      name: exam.name,
      date: exam.date ? exam.date.split('T')[0] : '',
      comment: exam.comment,
      year: exam.year,
      class_id: exam.class_id?.toString() || '',
      section_id: exam.section_id?.toString() || '',
      type: exam.type,
    })
    setFormOpen(true)
  }

  const handleSave = async () => {
    if (!form.name.trim() || !form.type) {
      toast({ title: 'Error', description: 'Name and type are required', variant: 'destructive' })
      return
    }
    setSaving(true)
    try {
      const url = selectedExam ? `/api/exams/${selectedExam.exam_id}` : '/api/exams'
      const method = selectedExam ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          class_id: form.class_id === 'none' || !form.class_id ? null : parseInt(form.class_id),
          section_id: form.section_id === 'none' || !form.section_id ? null : parseInt(form.section_id),
        }),
      })
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Failed') }
      toast({ title: 'Success', description: selectedExam ? 'Exam updated' : 'Exam created' })
      setFormOpen(false)
      fetchData()
    } catch (err) {
      toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' })
    }
    setSaving(false)
  }

  const handleDelete = async () => {
    if (!selectedExam) return
    try {
      const res = await fetch(`/api/exams/${selectedExam.exam_id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      toast({ title: 'Success', description: 'Exam deleted' })
      setDeleteOpen(false)
      fetchData()
    } catch {
      toast({ title: 'Error', description: 'Failed to delete exam', variant: 'destructive' })
    }
  }

  const filteredExams = exams.filter(e => {
    if (search && !e.name.toLowerCase().includes(search.toLowerCase())) return false
    if (filterType !== 'all' && e.type !== filterType) return false
    if (filterClass !== 'all' && e.class_id?.toString() !== filterClass) return false
    return true
  })

  const typeColors: Record<string, string> = {
    'Mid-term': 'bg-blue-100 text-blue-700',
    'Terminal': 'bg-emerald-100 text-emerald-700',
    'Mock': 'bg-amber-100 text-amber-700',
    'Final': 'bg-red-100 text-red-700',
    'Class Test': 'bg-purple-100 text-purple-700',
    'Quiz': 'bg-pink-100 text-pink-700',
    'Assignment': 'bg-teal-100 text-teal-700',
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Examinations</h1>
          <p className="text-sm text-slate-500 mt-1">Manage exams and assessments</p>
        </div>
        <Button onClick={openCreate} className="bg-emerald-600 hover:bg-emerald-700 min-h-[44px]">
          <Plus className="w-4 h-4 mr-2" /> Create Exam
        </Button>
      </div>

      <Card className="border-slate-200/60">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg">Exam List</CardTitle>
              <CardDescription>{filteredExams.length} exam{filteredExams.length !== 1 ? 's' : ''} found</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button asChild variant="outline" className="min-h-[44px]">
                <Link href="/admin/marks">
                  <GraduationCap className="w-4 h-4 mr-2" />
                  Mark Entry
                </Link>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input placeholder="Search exams..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 min-h-[44px]" />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full sm:w-[160px] min-h-[44px]"><SelectValue placeholder="Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {EXAM_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterClass} onValueChange={setFilterClass}>
              <SelectTrigger className="w-full sm:w-[180px] min-h-[44px]"><SelectValue placeholder="Class" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {classes.map(c => <SelectItem key={c.class_id} value={c.class_id.toString()}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}
            </div>
          ) : filteredExams.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <FileText className="w-12 h-12 text-slate-300 mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-1">No exams found</h3>
              <p className="text-sm text-slate-500">Create your first exam to get started</p>
            </div>
          ) : (
            <div className="max-h-[500px] overflow-y-auto rounded-lg border border-slate-200 custom-scrollbar">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 hover:bg-slate-50">
                    <TableHead>Exam Name</TableHead>
                    <TableHead className="hidden sm:table-cell">Class</TableHead>
                    <TableHead className="hidden md:table-cell">Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="hidden lg:table-cell">Year</TableHead>
                    <TableHead className="w-[50px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredExams.map(exam => (
                    <TableRow key={exam.exam_id} className="hover:bg-slate-50">
                      <TableCell className="font-medium text-sm text-slate-900">{exam.name}</TableCell>
                      <TableCell className="hidden sm:table-cell text-sm text-slate-600">
                        {exam.class ? exam.class.name : '—'}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-slate-600">
                        {exam.date ? format(new Date(exam.date), 'MMM d, yyyy') : '—'}
                      </TableCell>
                      <TableCell>
                        <Badge className={`text-xs ${typeColors[exam.type] || 'bg-slate-100 text-slate-700'}`}>
                          {exam.type || '—'}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-sm text-slate-600">{exam.year}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEdit(exam)}>
                              <Pencil className="w-4 h-4 mr-2" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => { setSelectedExam(exam); setDeleteOpen(true) }} className="text-red-600">
                              <Trash2 className="w-4 h-4 mr-2" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedExam ? 'Edit Exam' : 'Create New Exam'}</DialogTitle>
            <DialogDescription>
              {selectedExam ? 'Update exam details' : 'Fill in details to create a new exam'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Exam Name *</Label>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g., Term 1 Final Exam" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Type *</Label>
                <Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}>
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    {EXAM_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Date</Label>
                <Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Class</Label>
                <Select value={form.class_id} onValueChange={v => setForm({ ...form, class_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Class</SelectItem>
                    {classes.map(c => <SelectItem key={c.class_id} value={c.class_id.toString()}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Year</Label>
                <Select value={form.year} onValueChange={v => setForm({ ...form, year: v })}>
                  <SelectTrigger><SelectValue placeholder="Year" /></SelectTrigger>
                  <SelectContent>
                    {[2024, 2025, 2026, 2027].map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Comment</Label>
              <Textarea value={form.comment} onChange={e => setForm({ ...form, comment: e.target.value })} placeholder="Additional notes..." rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700" disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {selectedExam ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Exam</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{selectedExam?.name}</strong>? This may affect associated marks.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
