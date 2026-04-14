'use client'

import { useState, useEffect, useCallback } from 'react'
import { useToast } from '@/hooks/use-toast'
import {
  Star, Plus, Pencil, Trash2, Loader2, Award,
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
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
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

const CATEGORY_OPTIONS = ['general', 'creche', 'nursery', 'basic', 'jhs']

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
  const [filterCategory, setFilterCategory] = useState('all')

  const [formOpen, setFormOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [selectedGrade, setSelectedGrade] = useState<GradeScale | null>(null)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    name: '', comment: '', grade_from: '', grade_to: '', category: 'general',
  })

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/grades')
      const data = await res.json()
      setGrades(Array.isArray(data) ? data : (data.grades || []))
    } catch {
      toast({ title: 'Error', description: 'Failed to fetch grades', variant: 'destructive' })
    }
    setLoading(false)
  }, [toast])

  useEffect(() => { fetchData() }, [fetchData])

  const openCreate = () => {
    setSelectedGrade(null)
    setForm({ name: '', comment: '', grade_from: '', grade_to: '', category: 'general' })
    setFormOpen(true)
  }

  const openEdit = (g: GradeScale) => {
    setSelectedGrade(g)
    setForm({
      name: g.name,
      comment: g.comment,
      grade_from: g.grade_from.toString(),
      grade_to: g.grade_to.toString(),
      category: 'general',
    })
    setFormOpen(true)
  }

  const handleSave = async () => {
    if (!form.name.trim() || !form.grade_from || !form.grade_to) {
      toast({ title: 'Error', description: 'Name and score range are required', variant: 'destructive' })
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
          name: form.name,
          comment: form.comment,
          grade_from: parseFloat(form.grade_from),
          grade_to: parseFloat(form.grade_to),
        }),
      })
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Failed') }
      toast({ title: 'Success', description: selectedGrade ? 'Grade updated' : 'Grade created' })
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
      toast({ title: 'Success', description: 'Grade deleted' })
      setDeleteOpen(false)
      fetchData()
    } catch {
      toast({ title: 'Error', description: 'Failed to delete grade', variant: 'destructive' })
    }
  }

  const getGradeColor = (name: string): string => {
    if (name.startsWith('A')) return 'bg-emerald-100 text-emerald-700'
    if (name.startsWith('B')) return 'bg-blue-100 text-blue-700'
    if (name.startsWith('C')) return 'bg-amber-100 text-amber-700'
    if (name.startsWith('D')) return 'bg-orange-100 text-orange-700'
    if (name.startsWith('E') || name.startsWith('F')) return 'bg-red-100 text-red-700'
    return 'bg-slate-100 text-slate-700'
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Grade Management</h1>
          <p className="text-sm text-slate-500 mt-1">Configure grading scales and score ranges</p>
        </div>
        <Button onClick={openCreate} className="bg-emerald-600 hover:bg-emerald-700 min-h-[44px]">
          <Plus className="w-4 h-4 mr-2" /> Add Grade
        </Button>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-emerald-200 bg-emerald-50/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
              <Award className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-lg font-bold text-emerald-700">{grades.length}</p>
              <p className="text-xs text-emerald-600">Total Grades</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-blue-200 bg-blue-50/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <Star className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-lg font-bold text-blue-700">
                {grades.length > 0 ? `${grades[0].grade_from} - ${grades[grades.length - 1].grade_to}` : '—'}
              </p>
              <p className="text-xs text-blue-600">Score Range</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-purple-200 bg-purple-50/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
              <Award className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-lg font-bold text-purple-700">{grades.length}</p>
              <p className="text-xs text-purple-600">Grading Scale</p>
            </div>
          </CardContent>
        </Card>
      </div>

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
              <Star className="w-12 h-12 text-slate-300 mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-1">No grades configured</h3>
              <p className="text-sm text-slate-500 mb-4">Set up your grading scale</p>
              <Button onClick={openCreate} className="bg-emerald-600 hover:bg-emerald-700">
                <Plus className="w-4 h-4 mr-2" /> Add Grade
              </Button>
            </div>
          ) : (
            <div className="max-h-[500px] overflow-y-auto rounded-lg border border-slate-200 custom-scrollbar">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 hover:bg-slate-50">
                    <TableHead>Grade</TableHead>
                    <TableHead>Score Range</TableHead>
                    <TableHead className="hidden sm:table-cell">Comment</TableHead>
                    <TableHead className="w-[80px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {grades.map(grade => (
                    <TableRow key={grade.grade_id} className="hover:bg-slate-50">
                      <TableCell>
                        <Badge className={`text-sm font-bold ${getGradeColor(grade.name)}`}>
                          {grade.name}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        <span className="font-mono font-medium text-slate-900">{grade.grade_from}</span>
                        <span className="text-slate-400 mx-1">—</span>
                        <span className="font-mono font-medium text-slate-900">{grade.grade_to}</span>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-sm text-slate-600">
                        {grade.comment || '—'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(grade)} className="h-8 w-8">
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => { setSelectedGrade(grade); setDeleteOpen(true) }} className="h-8 w-8 text-red-600">
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

      {/* Create/Edit Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedGrade ? 'Edit Grade' : 'Add New Grade'}</DialogTitle>
            <DialogDescription>Define the score range for a grade</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Grade Name *</Label>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g., A+, A, B, C" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>From Score *</Label>
                <Input type="number" min="0" max="100" value={form.grade_from} onChange={e => setForm({ ...form, grade_from: e.target.value })} placeholder="0" />
              </div>
              <div className="grid gap-2">
                <Label>To Score *</Label>
                <Input type="number" min="0" max="100" value={form.grade_to} onChange={e => setForm({ ...form, grade_to: e.target.value })} placeholder="100" />
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
              {selectedGrade ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Grade</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete grade <strong>{selectedGrade?.name}</strong>?
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
