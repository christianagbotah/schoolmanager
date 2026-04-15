'use client'

import { useState, useEffect, useCallback } from 'react'
import { useToast } from '@/hooks/use-toast'
import {
  GraduationCap, Plus, Pencil, Trash2, Loader2, Star, X, Baby,
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
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Label } from '@/components/ui/label'
import { DashboardLayout } from '@/components/layout/dashboard-layout'

// ===== Types =====
interface CrecheGrade {
  grade_creche_id: number
  name: string
  abbrev: string
  grade_from: number
  grade_to: number
  comment: string
}

// ===== Main =====
export default function CrecheGradesPage() {
  return (
    <DashboardLayout>
      <CrecheGradesModule />
    </DashboardLayout>
  )
}

function CrecheGradesModule() {
  const { toast } = useToast()
  const [grades, setGrades] = useState<CrecheGrade[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('list')

  const [formOpen, setFormOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [selectedGrade, setSelectedGrade] = useState<CrecheGrade | null>(null)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    name: '', abbrev: '', comment: '',
  })

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/grades/creche')
      const data = await res.json()
      setGrades(Array.isArray(data.grades) ? data.grades : [])
    } catch {
      toast({ title: 'Error', description: 'Failed to fetch creche grades', variant: 'destructive' })
    }
    setLoading(false)
  }, [toast])

  useEffect(() => { fetchData() }, [fetchData])

  const openCreate = () => {
    setSelectedGrade(null)
    setForm({ name: '', abbrev: '', comment: '' })
    setFormOpen(true)
  }

  const openEdit = (g: CrecheGrade) => {
    setSelectedGrade(g)
    setForm({ name: g.name, abbrev: g.abbrev || '', comment: g.comment || '' })
    setFormOpen(true)
  }

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast({ title: 'Error', description: 'Grade name is required', variant: 'destructive' })
      return
    }
    setSaving(true)
    try {
      const url = selectedGrade
        ? `/api/admin/grades/creche?id=${selectedGrade.grade_creche_id}`
        : '/api/admin/grades/creche'
      const method = selectedGrade ? 'PUT' : 'POST'

      if (selectedGrade) {
        // Update via delete + create (simple approach for SQLite)
        await fetch(`/api/admin/grades/creche?id=${selectedGrade.grade_creche_id}`, { method: 'DELETE' })
      }

      const res = await fetch('/api/admin/grades/creche', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          abbrev: form.abbrev,
          comment: form.comment,
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
      const res = await fetch(`/api/admin/grades/creche?id=${selectedGrade.grade_creche_id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed')
      toast({ title: 'Success', description: 'Grade deleted successfully' })
      setDeleteOpen(false)
      fetchData()
    } catch {
      toast({ title: 'Error', description: 'Failed to delete grade', variant: 'destructive' })
    }
  }

  const getBadgeColor = (name: string) => {
    const n = name.toLowerCase()
    if (n.includes('excellent')) return 'bg-emerald-100 text-emerald-700 border-emerald-200'
    if (n.includes('very good')) return 'bg-teal-100 text-teal-700 border-teal-200'
    if (n.includes('good')) return 'bg-sky-100 text-sky-700 border-sky-200'
    if (n.includes('fair')) return 'bg-amber-100 text-amber-700 border-amber-200'
    if (n.includes('poor') || n.includes('needs')) return 'bg-red-100 text-red-700 border-red-200'
    return 'bg-slate-100 text-slate-700 border-slate-200'
  }

  const statCards = [
    { label: 'Total Grades', value: grades.length, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'With Abbreviation', value: grades.filter(g => g.abbrev).length, color: 'text-teal-600', bg: 'bg-teal-50' },
    { label: 'With Comments', value: grades.filter(g => g.comment).length, color: 'text-amber-600', bg: 'bg-amber-50' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 p-6 text-white shadow-lg">
        <h1 className="text-2xl font-bold flex items-center gap-3">
          <Baby className="w-7 h-7" />
          Creche & Nursery Grading
        </h1>
        <p className="mt-1 text-emerald-100">Configure assessment ratings for early childhood education</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {statCards.map((stat, i) => (
          <Card key={i} className={`${stat.bg} rounded-xl p-4 border`}>
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-xs text-slate-500 font-medium mt-1">{stat.label}</p>
          </Card>
        ))}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-white border rounded-xl p-1 w-full sm:w-auto grid grid-cols-2 sm:inline-flex">
          <TabsTrigger value="list" className="rounded-lg min-h-[44px]">
            <GraduationCap className="w-4 h-4 mr-2" /> Grade List
          </TabsTrigger>
          <TabsTrigger value="add" className="rounded-lg min-h-[44px]">
            <Plus className="w-4 h-4 mr-2" /> Add New Grade
          </TabsTrigger>
        </TabsList>

        {/* Grade List */}
        <TabsContent value="list" className="mt-6">
          <Card className="border-slate-200/60">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Assessment Grades</CardTitle>
              <CardDescription>{grades.length} grade{grades.length !== 1 ? 's' : ''} configured for creche & nursery</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}
                </div>
              ) : grades.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                    <Baby className="w-8 h-8 text-slate-300" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-1">No Grades Found</h3>
                  <p className="text-sm text-slate-500 mb-4">Create assessment ratings for early childhood</p>
                  <Button onClick={() => setActiveTab('add')} className="bg-emerald-600 hover:bg-emerald-700">
                    <Plus className="w-4 h-4 mr-2" /> Create First Grade
                  </Button>
                </div>
              ) : (
                <div className="max-h-[500px] overflow-y-auto rounded-lg border border-slate-200 custom-scrollbar">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-600 hover:to-teal-600">
                        <TableHead className="text-white">#</TableHead>
                        <TableHead className="text-white">Grade Name</TableHead>
                        <TableHead className="text-white">Abbreviation</TableHead>
                        <TableHead className="text-white hidden sm:table-cell">Comment</TableHead>
                        <TableHead className="text-white text-center">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {grades.map((grade, idx) => (
                        <TableRow key={grade.grade_creche_id} className="hover:bg-slate-50 transition-colors">
                          <TableCell className="text-sm text-slate-500 font-medium">{idx + 1}</TableCell>
                          <TableCell className="font-semibold text-slate-900">{grade.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`text-sm font-bold ${getBadgeColor(grade.name)}`}>
                              {grade.abbrev || '—'}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell text-sm text-slate-500">
                            {grade.comment || '—'}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-center gap-1">
                              <Button variant="ghost" size="sm" onClick={() => openEdit(grade)}
                                className="h-8 px-3 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50">
                                <Pencil className="w-3.5 h-3.5 mr-1" />
                                <span className="text-xs">Edit</span>
                              </Button>
                              <Button variant="ghost" size="sm"
                                onClick={() => { setSelectedGrade(grade); setDeleteOpen(true) }}
                                className="h-8 px-3 text-red-600 hover:text-red-700 hover:bg-red-50">
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
        </TabsContent>

        {/* Add New Grade */}
        <TabsContent value="add" className="mt-6">
          <Card className="border-slate-200/60 max-w-2xl mx-auto shadow-xl">
            <div className="text-center py-6 border-b">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                <Baby className="w-6 h-6 inline-block mr-2" />
                Create New Creche Grade
              </h2>
              <p className="text-sm text-slate-500 mt-1">Define an assessment rating for early childhood education</p>
            </div>
            <CardContent className="p-6">
              <div className="space-y-5">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-emerald-600" />
                    Grade Full Name *
                  </Label>
                  <Input
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g., Excellent, Very Good, Good, Fair, Needs Attention"
                    className="min-h-[44px]"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-emerald-600" />
                    Abbreviation
                  </Label>
                  <Input
                    value={form.abbrev}
                    onChange={e => setForm({ ...form, abbrev: e.target.value })}
                    placeholder="e.g., EX, VG, G, F, NA"
                    className="min-h-[44px]"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Comment / Remark</Label>
                  <Input
                    value={form.comment}
                    onChange={e => setForm({ ...form, comment: e.target.value })}
                    placeholder="e.g., Outstanding performance, Good progress"
                    className="min-h-[44px]"
                  />
                </div>
                <div className="flex items-center justify-center gap-3 pt-6 border-t mt-6">
                  <Button variant="outline" onClick={() => setForm({ name: '', abbrev: '', comment: '' })} className="min-h-[44px] px-6">
                    <X className="w-4 h-4 mr-2" /> Clear
                  </Button>
                  <Button
                    onClick={async () => {
                      if (!form.name.trim()) {
                        toast({ title: 'Error', description: 'Grade name is required', variant: 'destructive' })
                        return
                      }
                      setSaving(true)
                      try {
                        const res = await fetch('/api/admin/grades/creche', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify(form),
                        })
                        if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Failed') }
                        toast({ title: 'Success', description: 'Creche grade created successfully' })
                        setForm({ name: '', abbrev: '', comment: '' })
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
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Creche Grade</DialogTitle>
            <DialogDescription>Update assessment grade details</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Grade Name *</Label>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="e.g., Excellent" className="min-h-[44px]" />
            </div>
            <div className="grid gap-2">
              <Label>Abbreviation</Label>
              <Input value={form.abbrev} onChange={e => setForm({ ...form, abbrev: e.target.value })}
                placeholder="e.g., EX" className="min-h-[44px]" />
            </div>
            <div className="grid gap-2">
              <Label>Comment</Label>
              <Input value={form.comment} onChange={e => setForm({ ...form, comment: e.target.value })}
                placeholder="e.g., Outstanding" className="min-h-[44px]" />
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
            <AlertDialogTitle>Delete Grade</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{selectedGrade?.name}</strong>? This action cannot be undone.
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
