'use client'

import { useState, useEffect, useCallback } from 'react'
import { useToast } from '@/hooks/use-toast'
import {
  Star, Plus, Pencil, Trash2, Loader2, Award, GraduationCap, X,
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
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { DashboardLayout } from '@/components/layout/dashboard-layout'

// ===== Types =====
interface GradeScale {
  grade_id: number
  name: string
  comment: string
  grade_from: number
  grade_to: number
}

// ===== Main =====
export default function GradesPage() {
  return (
    <DashboardLayout>
      <GradesModule />
    </DashboardLayout>
  )
}

function GradesModule() {
  const { toast } = useToast()
  const [grades, setGrades] = useState<GradeScale[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  const [formOpen, setFormOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [selectedGrade, setSelectedGrade] = useState<GradeScale | null>(null)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    name: '', grade_point: '', grade_from: '', grade_to: '', gpa: '', comment: '',
  })

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/grades')
      const data = await res.json()
      const list = Array.isArray(data) ? data : (data.grades || [])
      // Sort by grade_from descending (highest first)
      setGrades(list.sort((a: GradeScale, b: GradeScale) => b.grade_from - a.grade_from))
    } catch {
      toast({ title: 'Error', description: 'Failed to fetch grades', variant: 'destructive' })
    }
    setLoading(false)
  }, [toast])

  useEffect(() => { fetchData() }, [fetchData])

  const openCreate = () => {
    setSelectedGrade(null)
    setForm({ name: '', grade_point: '', grade_from: '', grade_to: '', gpa: '', comment: '' })
    setFormOpen(true)
  }

  const openEdit = (g: GradeScale) => {
    setSelectedGrade(g)
    setForm({
      name: g.name,
      grade_point: '',
      grade_from: g.grade_from.toString(),
      grade_to: g.grade_to.toString(),
      gpa: '',
      comment: g.comment,
    })
    setFormOpen(true)
  }

  const handleSave = async () => {
    if (!form.name.trim() || !form.grade_from || !form.grade_to) {
      toast({ title: 'Error', description: 'Name and mark range are required', variant: 'destructive' })
      return
    }
    setSaving(true)
    try {
      const url = selectedGrade ? `/api/grades/${selectedGrade.grade_id}` : '/api/grades'
      const method = selectedGrade ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.toUpperCase(),
          comment: form.comment,
          grade_from: parseFloat(form.grade_from),
          grade_to: parseFloat(form.grade_to),
        }),
      })
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Failed') }
      toast({ title: 'Success', description: selectedGrade ? 'Grade updated successfully' : 'Grade created successfully' })
      setFormOpen(false)
      fetchData()
    } catch (err) {
      toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' })
    }
    setSaving(false)
  }

  const handleDelete = async () => {
    if (!selectedGrade) return
    try {
      const res = await fetch(`/api/grades/${selectedGrade.grade_id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed')
      toast({ title: 'Success', description: 'Grade deleted successfully' })
      setDeleteOpen(false)
      fetchData()
    } catch {
      toast({ title: 'Error', description: 'Failed to delete grade', variant: 'destructive' })
    }
  }

  const getGradeColor = (name: string): string => {
    const n = name.toLowerCase()
    if (n.startsWith('a') || n.startsWith('1')) return 'bg-emerald-100 text-emerald-700 border-emerald-200'
    if (n.startsWith('b') || n.startsWith('2')) return 'bg-blue-100 text-blue-700 border-blue-200'
    if (n.startsWith('c') || n.startsWith('3')) return 'bg-amber-100 text-amber-700 border-amber-200'
    if (n.startsWith('d') || n.startsWith('4')) return 'bg-orange-100 text-orange-700 border-orange-200'
    if (n.startsWith('e') || n.startsWith('f') || n.startsWith('5') || n.startsWith('6') || n.startsWith('7') || n.startsWith('8') || n.startsWith('9')) return 'bg-red-100 text-red-700 border-red-200'
    return 'bg-slate-100 text-slate-700 border-slate-200'
  }

  // Stats matching CI3: Total Grades, Highest Grade, Lowest Grade, Pass Mark
  const maxMark = grades.length > 0 ? Math.max(...grades.map(g => g.grade_to)) : 0
  const minMark = grades.length > 0 ? Math.min(...grades.map(g => g.grade_from)) : 0
  const passGrades = grades.filter(g => g.grade_from >= 50)
  const passMark = passGrades.length > 0 ? Math.min(...passGrades.map(g => g.grade_from)) : 50

  const statCards = [
    { label: 'Total Grades', value: grades.length, color: 'text-emerald-600', icon: <Award className="w-5 h-5" />, borderColor: 'border-emerald-200' },
    { label: 'Highest Grade', value: `${maxMark}%`, color: 'text-blue-600', icon: <Star className="w-5 h-5" />, borderColor: 'border-blue-200' },
    { label: 'Lowest Grade', value: `${minMark}%`, color: 'text-amber-600', icon: <Star className="w-5 h-5" />, borderColor: 'border-amber-200' },
    { label: 'Pass Mark', value: `${passMark}%`, color: 'text-purple-600', icon: <GraduationCap className="w-5 h-5" />, borderColor: 'border-purple-200' },
  ]

  return (
    <div className="space-y-6">
      {/* Header matching CI3 */}
      <div className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 p-6 text-white shadow-lg">
        <h1 className="text-2xl font-bold flex items-center gap-3">
          <GraduationCap className="w-7 h-7" />
          Grading System Management
        </h1>
        <p className="mt-1 text-emerald-100">Configure and manage academic grading scales</p>
      </div>

      {/* Stats matching CI3 grade-stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {statCards.map((stat, i) => (
          <Card key={i} className={`border-l-4 ${stat.borderColor} hover:-translate-y-0.5 transition-transform`}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <span className={stat.color}>{stat.icon}</span>
                <p className="text-xs font-medium text-slate-500">{stat.label}</p>
              </div>
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Grade Table matching CI3 */}
      <Card className="border-slate-200/60">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Grading Scale</CardTitle>
          <CardDescription>Define score ranges for each grade letter</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}
            </div>
          ) : grades.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                <Award className="w-8 h-8 text-slate-300" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-1">No Grades Configured</h3>
              <p className="text-sm text-slate-500 mb-4">Set up your grading scale</p>
              <Button onClick={openCreate} className="bg-emerald-600 hover:bg-emerald-700">
                <Plus className="w-4 h-4 mr-2" /> Add Grade
              </Button>
            </div>
          ) : (
            <div className="max-h-[500px] overflow-y-auto rounded-lg border border-slate-200 custom-scrollbar">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-600 hover:to-teal-600">
                    <TableHead className="text-white">#</TableHead>
                    <TableHead className="text-white">Grade Name</TableHead>
                    <TableHead className="text-white">Grade</TableHead>
                    <TableHead className="text-white">Mark Range</TableHead>
                    <TableHead className="text-white hidden sm:table-cell">Comment</TableHead>
                    <TableHead className="text-white text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {grades.map((grade, idx) => (
                    <TableRow key={grade.grade_id} className="hover:bg-slate-50 transition-colors">
                      <TableCell className="text-sm text-slate-500 font-medium">{idx + 1}</TableCell>
                      <TableCell className="font-semibold text-slate-900">{grade.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-sm font-bold min-w-[50px] text-center ${getGradeColor(grade.name)}`}>
                          {grade.name}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                          <span>{grade.grade_from}%</span>
                          <span className="text-slate-300">—</span>
                          <span>{grade.grade_to}%</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-sm text-slate-500">
                        {grade.comment || '—'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEdit(grade)}
                            className="h-8 px-3 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                          >
                            <Pencil className="w-3.5 h-3.5 mr-1" />
                            <span className="text-xs">Edit</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => { setSelectedGrade(grade); setDeleteOpen(true) }}
                            className="h-8 px-3 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-3.5 h-3.5 mr-1" />
                            <span className="text-xs">Delete</span>
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

      {/* Floating Add Button matching CI3 toggle-form */}
      <button
        onClick={() => setShowForm(!showForm)}
        className="fixed bottom-6 right-6 bg-gradient-to-r from-emerald-600 to-teal-600 text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-transform z-50"
      >
        {showForm ? <X className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
      </button>

      {/* Sliding Add Form matching CI3 add-grade-form */}
      {showForm && (
        <Card className="border-slate-200 max-w-2xl mx-auto shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="text-center py-6 border-b">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              <GraduationCap className="w-6 h-6 inline-block mr-2" />
              Create New Grade
            </h2>
            <p className="text-sm text-slate-500 mt-1">Define a new grading scale with mark ranges</p>
          </div>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-emerald-600" />
                  Grade Name
                </Label>
                <Input
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g., EXCELLENT, VERY GOOD"
                  className="min-h-[44px]"
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-emerald-600" />
                  Grade Symbol
                </Label>
                <Input
                  value={form.grade_point}
                  onChange={e => setForm({ ...form, grade_point: e.target.value })}
                  placeholder="e.g., A+, A, B+, 1, 2"
                  className="min-h-[44px]"
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  Minimum Mark (%)
                </Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={form.grade_from}
                  onChange={e => setForm({ ...form, grade_from: e.target.value })}
                  placeholder="e.g., 80.5"
                  className="min-h-[44px]"
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  Maximum Mark (%)
                </Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={form.grade_to}
                  onChange={e => setForm({ ...form, grade_to: e.target.value })}
                  placeholder="e.g., 100"
                  className="min-h-[44px]"
                />
              </div>
            </div>
            <div className="space-y-2 mt-5">
              <Label className="flex items-center gap-2">
                Comment / Remark
              </Label>
              <Textarea
                value={form.comment}
                onChange={e => setForm({ ...form, comment: e.target.value })}
                placeholder="e.g., Excellent performance, Good work"
                rows={2}
              />
            </div>
            <div className="flex items-center justify-center gap-3 pt-6 border-t mt-6">
              <Button
                variant="outline"
                onClick={() => setShowForm(false)}
                className="min-h-[44px] px-6"
              >
                <X className="w-4 h-4 mr-2" /> Cancel
              </Button>
              <Button
                onClick={async () => {
                  if (!form.name.trim() || !form.grade_from || !form.grade_to) {
                    toast({ title: 'Error', description: 'Name and mark range are required', variant: 'destructive' })
                    return
                  }
                  setSaving(true)
                  try {
                    const res = await fetch('/api/grades', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        name: form.name.toUpperCase(),
                        comment: form.comment,
                        grade_from: parseFloat(form.grade_from),
                        grade_to: parseFloat(form.grade_to),
                      }),
                    })
                    if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Failed') }
                    toast({ title: 'Success', description: 'Grade created successfully' })
                    setShowForm(false)
                    setForm({ name: '', grade_point: '', grade_from: '', grade_to: '', gpa: '', comment: '' })
                    fetchData()
                  } catch (err) {
                    toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' })
                  }
                  setSaving(false)
                }}
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 min-h-[44px] px-6"
                disabled={saving}
              >
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                {saving ? 'Creating...' : 'Create Grade'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Grade</DialogTitle>
            <DialogDescription>Update grading scale details</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Grade Name *</Label>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g., A+, A, B, C" className="min-h-[44px]" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>From Score *</Label>
                <Input type="number" min="0" max="100" value={form.grade_from} onChange={e => setForm({ ...form, grade_from: e.target.value })} placeholder="0" className="min-h-[44px]" />
              </div>
              <div className="grid gap-2">
                <Label>To Score *</Label>
                <Input type="number" min="0" max="100" value={form.grade_to} onChange={e => setForm({ ...form, grade_to: e.target.value })} placeholder="100" className="min-h-[44px]" />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Comment</Label>
              <Textarea value={form.comment} onChange={e => setForm({ ...form, comment: e.target.value })} placeholder="e.g., Excellent" rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700" disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {saving ? 'Updating...' : 'Update Grade'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Delete</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete grade <strong>{selectedGrade?.name}</strong> ({selectedGrade?.grade_from}% - {selectedGrade?.grade_to}%)? This action cannot be undone.
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
