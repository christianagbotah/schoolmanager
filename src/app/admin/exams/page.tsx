'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { useToast } from '@/hooks/use-toast'
import {
  FileText, Plus, Search, MoreHorizontal, Pencil, Trash2, Eye,
  Calendar, GraduationCap, Loader2, Filter, List, CheckCircle2,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
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
  name_numeric: number
}

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
  const [activeTab, setActiveTab] = useState('list')

  // Dialog states
  const [formOpen, setFormOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null)
  const [saving, setSaving] = useState(false)

  // Form
  const [form, setForm] = useState({
    name: '', date: '', comment: '', year: new Date().getFullYear().toString(),
    class_id: '', section_id: '', type: '',
  })

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
    if (!form.name.trim()) {
      toast({ title: 'Error', description: 'Exam name is required', variant: 'destructive' })
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
          name: form.name.toUpperCase(),
          class_id: form.class_id === 'none' || !form.class_id ? null : parseInt(form.class_id),
          section_id: form.section_id === 'none' || !form.section_id ? null : parseInt(form.section_id),
        }),
      })
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Failed') }
      toast({ title: 'Success', description: selectedExam ? 'Exam updated successfully' : 'Exam created successfully' })
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
      toast({ title: 'Success', description: 'Exam deleted successfully' })
      setDeleteOpen(false)
      fetchData()
    } catch {
      toast({ title: 'Error', description: 'Failed to delete exam', variant: 'destructive' })
    }
  }

  const filteredExams = exams.filter(e => {
    if (search && !e.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const getCategoryLabel = (exam: Exam) => {
    if (exam.type) return exam.type
    return 'General'
  }

  const getCategoryColor = (exam: Exam) => {
    const type = exam.type?.toLowerCase() || ''
    if (type.includes('final')) return 'bg-red-100 text-red-700 border-red-200'
    if (type.includes('term')) return 'bg-emerald-100 text-emerald-700 border-emerald-200'
    if (type.includes('mid')) return 'bg-amber-100 text-amber-700 border-amber-200'
    if (type.includes('mock')) return 'bg-purple-100 text-purple-700 border-purple-200'
    if (type.includes('quiz')) return 'bg-pink-100 text-pink-700 border-pink-200'
    if (type.includes('test')) return 'bg-teal-100 text-teal-700 border-teal-200'
    return 'bg-slate-100 text-slate-700 border-slate-200'
  }

  const statCards = [
    { label: 'Total Exams', value: exams.length, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'This Year', value: exams.filter(e => e.year === new Date().getFullYear().toString()).length, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'With Date', value: exams.filter(e => e.date).length, color: 'text-amber-600', bg: 'bg-amber-50' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            <GraduationCap className="w-6 h-6 inline-block mr-2 text-emerald-600" />
            Manage Exam
          </h1>
          <p className="text-sm text-slate-500 mt-1">Configure and manage examinations</p>
        </div>
        <Button onClick={openCreate} className="bg-emerald-600 hover:bg-emerald-700 min-h-[44px]">
          <Plus className="w-4 h-4 mr-2" /> Add New Exam
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {statCards.map((stat, i) => (
          <div key={i} className={`${stat.bg} rounded-xl p-4 border`}>
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-xs text-slate-500 font-medium mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs matching CI3: Exam List, Add New Exam */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-white border rounded-xl p-1 w-full sm:w-auto grid grid-cols-2 sm:inline-flex">
          <TabsTrigger value="list" className="rounded-lg min-h-[44px]">
            <List className="w-4 h-4 mr-2" /> Exam List
          </TabsTrigger>
          <TabsTrigger value="add" className="rounded-lg min-h-[44px]">
            <Plus className="w-4 h-4 mr-2" /> Add New Exam
          </TabsTrigger>
        </TabsList>

        {/* Exam List Tab */}
        <TabsContent value="list" className="mt-6">
          <Card className="border-slate-200/60">
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-lg">Exam List</CardTitle>
                  <CardDescription>{filteredExams.length} exam{filteredExams.length !== 1 ? 's' : ''} found</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button asChild variant="outline" className="min-h-[44px]" size="sm">
                    <Link href="/admin/marks">
                      <GraduationCap className="w-4 h-4 mr-2" />
                      Mark Entry
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="min-h-[44px]" size="sm">
                    <Link href="/admin/exams/tabulation">
                      <Eye className="w-4 h-4 mr-2" />
                      Tabulation
                    </Link>
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Search */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search exams..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-10 min-h-[44px]"
                />
              </div>

              {/* Table or Empty State */}
              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}
                </div>
              ) : filteredExams.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                    <GraduationCap className="w-8 h-8 text-slate-300" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-1">No Exams Found</h3>
                  <p className="text-sm text-slate-500 mb-4">Get started by creating your first exam</p>
                  <Button onClick={() => { setActiveTab('add') }} className="bg-emerald-600 hover:bg-emerald-700">
                    <Plus className="w-4 h-4 mr-2" /> Create First Exam
                  </Button>
                </div>
              ) : (
                <div className="max-h-[500px] overflow-y-auto rounded-lg border border-slate-200 custom-scrollbar">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50 hover:bg-slate-50">
                        <TableHead>Exam Name</TableHead>
                        <TableHead className="hidden sm:table-cell">Date</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead className="hidden md:table-cell">Year</TableHead>
                        <TableHead className="hidden lg:table-cell">Class</TableHead>
                        <TableHead className="w-[100px] text-center">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredExams.map(exam => (
                        <TableRow key={exam.exam_id} className="hover:bg-slate-50 transition-colors">
                          <TableCell className="font-semibold text-slate-900">{exam.name}</TableCell>
                          <TableCell className="hidden sm:table-cell text-sm text-slate-500">
                            {exam.date ? (
                              <span className="inline-flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5" />
                                {format(new Date(exam.date), 'MMM d, yyyy')}
                              </span>
                            ) : '—'}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`text-xs font-semibold ${getCategoryColor(exam)}`}>
                              {getCategoryLabel(exam)}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-sm text-slate-500">{exam.year}</TableCell>
                          <TableCell className="hidden lg:table-cell text-sm text-slate-500">
                            {exam.class ? exam.class.name : '—'}
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEdit(exam)}
                                className="h-8 w-8 p-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                title="Edit"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => { setSelectedExam(exam); setDeleteOpen(true) }}
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                title="Delete"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
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

        {/* Add New Exam Tab */}
        <TabsContent value="add" className="mt-6">
          <Card className="border-slate-200/60 max-w-2xl mx-auto">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-xl">Create New Exam</CardTitle>
              <CardDescription>Fill in the details below to create a new examination</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-5">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-emerald-600" />
                    Exam Name *
                  </Label>
                  <Input
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    placeholder="Enter exam name (e.g., Mid-Term Examination)"
                    className="min-h-[48px] text-lg"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-emerald-600" />
                      Exam Date
                    </Label>
                    <Input
                      type="date"
                      value={form.date}
                      onChange={e => setForm({ ...form, date: e.target.value })}
                      className="min-h-[48px]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Filter className="w-4 h-4 text-emerald-600" />
                      Type / Category
                    </Label>
                    <Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}>
                      <SelectTrigger className="min-h-[48px]">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Mid-Term">Mid-Term</SelectItem>
                        <SelectItem value="Terminal">Terminal</SelectItem>
                        <SelectItem value="Mock">Mock</SelectItem>
                        <SelectItem value="Final">Final</SelectItem>
                        <SelectItem value="Class Test">Class Test</SelectItem>
                        <SelectItem value="Quiz">Quiz</SelectItem>
                        <SelectItem value="Assignment">Assignment</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Year</Label>
                    <Select value={form.year} onValueChange={v => setForm({ ...form, year: v })}>
                      <SelectTrigger className="min-h-[48px]">
                        <SelectValue placeholder="Year" />
                      </SelectTrigger>
                      <SelectContent>
                        {[2023, 2024, 2025, 2026, 2027].map(y => (
                          <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Class (Optional)</Label>
                    <Select value={form.class_id} onValueChange={v => setForm({ ...form, class_id: v })}>
                      <SelectTrigger className="min-h-[48px]">
                        <SelectValue placeholder="Select class" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">All Classes</SelectItem>
                        {classes.map(c => (
                          <SelectItem key={c.class_id} value={c.class_id.toString()}>
                            {c.name} {c.name_numeric}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Comment</Label>
                  <Textarea
                    value={form.comment}
                    onChange={e => setForm({ ...form, comment: e.target.value })}
                    placeholder="Additional notes (optional)"
                    rows={2}
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setForm({ name: '', date: '', comment: '', year: new Date().getFullYear().toString(), class_id: '', section_id: '', type: '' })
                    }}
                  >
                    Reset
                  </Button>
                  <Button
                    onClick={handleSave}
                    className="bg-emerald-600 hover:bg-emerald-700 min-h-[44px] px-8"
                    disabled={saving}
                  >
                    {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                    {saving ? 'Creating...' : 'Create Exam'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Exam</DialogTitle>
            <DialogDescription>Update exam details</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Exam Name *</Label>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g., Term 1 Final Exam" className="min-h-[44px]" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Date</Label>
                <Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="min-h-[44px]" />
              </div>
              <div className="grid gap-2">
                <Label>Type</Label>
                <Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}>
                  <SelectTrigger className="min-h-[44px]"><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Mid-Term">Mid-Term</SelectItem>
                    <SelectItem value="Terminal">Terminal</SelectItem>
                    <SelectItem value="Mock">Mock</SelectItem>
                    <SelectItem value="Final">Final</SelectItem>
                    <SelectItem value="Class Test">Class Test</SelectItem>
                    <SelectItem value="Quiz">Quiz</SelectItem>
                    <SelectItem value="Assignment">Assignment</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Year</Label>
                <Select value={form.year} onValueChange={v => setForm({ ...form, year: v })}>
                  <SelectTrigger className="min-h-[44px]"><SelectValue placeholder="Year" /></SelectTrigger>
                  <SelectContent>
                    {[2023, 2024, 2025, 2026, 2027].map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Class</Label>
                <Select value={form.class_id} onValueChange={v => setForm({ ...form, class_id: v })}>
                  <SelectTrigger className="min-h-[44px]"><SelectValue placeholder="Select class" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">All Classes</SelectItem>
                    {classes.map(c => <SelectItem key={c.class_id} value={c.class_id.toString()}>{c.name} {c.name_numeric}</SelectItem>)}
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
              {saving ? 'Updating...' : 'Update Exam'}
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
              Are you sure you want to delete <strong>{selectedExam?.name}</strong>? This action cannot be undone and will also remove all associated marks.
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
