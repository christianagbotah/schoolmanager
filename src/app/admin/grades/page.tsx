'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
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
import { toast } from 'sonner'
import {
  Search, Plus, Award, GraduationCap, Baby, Loader2, Pencil, Trash2,
  BarChart3, CheckCircle2, X, Filter,
} from 'lucide-react'

// ===== Types =====
interface BasicGrade {
  grade_id: number
  name: string
  comment: string
  grade_from: number
  grade_to: number
}

interface JHSGrade {
  grade_2_id: number
  name: string
  comment: string
  grade_from: number
  grade_to: number
  point: number
}

interface CrecheGrade {
  grade_creche_id: number
  name: string
  abbrev: string
  comment: string
  grade_from: number
  grade_to: number
}

interface UnifiedGrade {
  id: number
  name: string
  comment: string
  grade_from: number
  grade_to: number
  gradePoint: number | null
  category: 'basic' | 'jhs' | 'creche'
}

type CategoryFilter = '__all__' | 'basic' | 'jhs' | 'creche'

// ─── Skeleton Components ─────────────────────────────────────────────────────

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
  );
}

function TableSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/60 p-4 sm:p-6">
      <div className="space-y-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}

// ─── Stat Card Component ─────────────────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  subValue,
  iconBg,
  borderColor,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  subValue?: string;
  iconBg: string;
  borderColor: string;
}) {
  return (
    <div
      className="group relative bg-white rounded-2xl border border-slate-200/60 p-4 sm:p-5 hover:-translate-y-0.5 hover:shadow-lg hover:border-slate-300/80 transition-all duration-200 flex flex-col"
      style={{ borderLeft: `4px solid ${borderColor}` }}
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
  );
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
  // Data state
  const [basicGrades, setBasicGrades] = useState<BasicGrade[]>([])
  const [jhsGrades, setJhsGrades] = useState<JHSGrade[]>([])
  const [crecheGrades, setCrecheGrades] = useState<CrecheGrade[]>([])
  const [loading, setLoading] = useState(true)

  // Filter state
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('__all__')

  // Dialog state
  const [formOpen, setFormOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [selectedGrade, setSelectedGrade] = useState<UnifiedGrade | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Form state
  const [form, setForm] = useState({
    name: '',
    grade_from: '',
    grade_to: '',
    grade_point: '',
    comment: '',
    category: 'basic' as 'basic' | 'jhs' | 'creche',
  })

  // Fetch all grades from 3 tables
  const fetchAllGrades = useCallback(async () => {
    setLoading(true)
    try {
      const [basicRes, jhsRes, crecheRes] = await Promise.all([
        fetch('/api/grades').then(r => r.json()),
        fetch('/api/admin/grades/jhs').then(r => r.json()),
        fetch('/api/admin/grades/creche').then(r => r.json()),
      ])
      setBasicGrades((basicRes.grades || []).sort((a: BasicGrade, b: BasicGrade) => b.grade_from - a.grade_from))
      setJhsGrades((jhsRes.grades || []).sort((a: JHSGrade, b: JHSGrade) => b.grade_from - a.grade_from))
      setCrecheGrades(crecheRes.grades || [])
    } catch {
      toast.error('Failed to fetch grades')
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetchAllGrades() }, [fetchAllGrades])

  // Unified grades list
  const unifiedGrades = useMemo((): UnifiedGrade[] => {
    const basic: UnifiedGrade[] = basicGrades.map(g => ({
      id: g.grade_id, name: g.name, comment: g.comment,
      grade_from: g.grade_from, grade_to: g.grade_to,
      gradePoint: null, category: 'basic',
    }))
    const jhs: UnifiedGrade[] = jhsGrades.map(g => ({
      id: g.grade_2_id, name: g.name, comment: g.comment,
      grade_from: g.grade_from, grade_to: g.grade_to,
      gradePoint: g.point, category: 'jhs',
    }))
    const creche: UnifiedGrade[] = crecheGrades.map(g => ({
      id: g.grade_creche_id, name: g.name, comment: g.comment,
      grade_from: g.grade_from, grade_to: g.grade_to,
      gradePoint: null, category: 'creche',
    }))
    return [...basic, ...jhs, ...creche]
  }, [basicGrades, jhsGrades, crecheGrades])

  // Filtered grades
  const filteredGrades = useMemo(() => {
    let result = unifiedGrades
    if (categoryFilter !== '__all__') {
      result = result.filter(g => g.category === categoryFilter)
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(g =>
        g.name.toLowerCase().includes(q) || g.comment.toLowerCase().includes(q)
      )
    }
    return result
  }, [unifiedGrades, categoryFilter, search])

  // Stats
  const stats = useMemo(() => ({
    total: unifiedGrades.length,
    basic: basicGrades.length,
    jhs: jhsGrades.length,
    creche: crecheGrades.length,
  }), [unifiedGrades.length, basicGrades.length, jhsGrades.length, crecheGrades.length])

  // Active filters
  const activeFilters = [
    categoryFilter !== '__all__' ? { key: 'category', label: `Category: ${categoryFilter === 'basic' ? 'Basic JHS' : categoryFilter === 'jhs' ? 'JHS (Graded)' : 'Creche / Nursery'}` } : null,
  ].filter(Boolean) as { key: string; label: string }[];

  const clearFilter = (key: string) => {
    if (key === 'category') setCategoryFilter('__all__')
  }

  const clearAllFilters = () => {
    setSearch('')
    setCategoryFilter('__all__')
  }

  // Category badge config
  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'basic': return { label: 'Basic JHS', className: 'bg-emerald-100 text-emerald-700 border-emerald-200' }
      case 'jhs': return { label: 'JHS', className: 'bg-sky-100 text-sky-700 border-sky-200' }
      case 'creche': return { label: 'Creche / Nursery', className: 'bg-amber-100 text-amber-700 border-amber-200' }
      default: return { label: category, className: 'bg-slate-100 text-slate-700 border-slate-200' }
    }
  }

  const getGradeColor = (name: string): string => {
    const n = name.toLowerCase()
    if (n.startsWith('a') || n.startsWith('1') || n.startsWith('ex')) return 'bg-emerald-100 text-emerald-700 border-emerald-200'
    if (n.startsWith('b') || n.startsWith('2') || n.startsWith('v')) return 'bg-sky-100 text-sky-700 border-sky-200'
    if (n.startsWith('c') || n.startsWith('3') || n.startsWith('g')) return 'bg-amber-100 text-amber-700 border-amber-200'
    if (n.startsWith('d') || n.startsWith('4') || n.startsWith('s')) return 'bg-orange-100 text-orange-700 border-orange-200'
    if (n.startsWith('e') || n.startsWith('f') || n.startsWith('5') || n.startsWith('6') || n.startsWith('7') || n.startsWith('8') || n.startsWith('9') || n.startsWith('0')) return 'bg-red-100 text-red-700 border-red-200'
    return 'bg-slate-100 text-slate-700 border-slate-200'
  }

  // Form handlers
  const openCreate = (category?: 'basic' | 'jhs' | 'creche') => {
    setSelectedGrade(null)
    setForm({
      name: '',
      grade_from: '',
      grade_to: '',
      grade_point: '',
      comment: '',
      category: category || 'basic',
    })
    setFormOpen(true)
  }

  const openEdit = (g: UnifiedGrade) => {
    setSelectedGrade(g)
    setForm({
      name: g.name,
      grade_from: g.grade_from.toString(),
      grade_to: g.grade_to.toString(),
      grade_point: g.gradePoint !== null ? g.gradePoint.toString() : '',
      comment: g.comment,
      category: g.category,
    })
    setFormOpen(true)
  }

  const confirmDelete = (g: UnifiedGrade) => {
    setSelectedGrade(g)
    setDeleteOpen(true)
  }

  const handleSave = async () => {
    if (!form.name.trim() || !form.grade_from || !form.grade_to) {
      toast.error('Name and mark range are required')
      return
    }
    setSaving(true)
    try {
      const payload = {
        name: form.name.toUpperCase(),
        comment: form.comment,
        grade_from: parseFloat(form.grade_from),
        grade_to: parseFloat(form.grade_to),
      }

      if (form.category === 'jhs') {
        (payload as Record<string, unknown>).point = form.grade_point ? parseFloat(form.grade_point) : 0
      }

      const isEditing = selectedGrade !== null

      if (isEditing) {
        const category = selectedGrade!.category
        let url: string
        if (category === 'basic') url = `/api/grades/${selectedGrade!.id}`
        else if (category === 'jhs') url = `/api/admin/grades/jhs/${selectedGrade!.id}`
        else url = `/api/admin/grades/creche/${selectedGrade!.id}`

        const res = await fetch(url, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Failed to update') }
        toast.success('Grade updated successfully')
      } else {
        const category = form.category
        let url: string
        if (category === 'basic') url = '/api/grades'
        else if (category === 'jhs') url = '/api/admin/grades/jhs'
        else url = '/api/admin/grades/creche'

        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Failed to create') }
        toast.success('Grade created successfully')
      }

      setFormOpen(false)
      fetchAllGrades()
    } catch (err) {
      toast.error((err as Error).message)
    }
    setSaving(false)
  }

  const handleDelete = async () => {
    if (!selectedGrade) return
    setDeleting(true)
    try {
      const category = selectedGrade.category
      let url: string
      if (category === 'basic') url = `/api/grades/${selectedGrade.id}`
      else if (category === 'jhs') url = `/api/admin/grades/jhs/${selectedGrade.id}`
      else url = `/api/admin/grades/creche/${selectedGrade.id}`

      const res = await fetch(url, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      toast.success('Grade deleted successfully')
      setDeleteOpen(false)
      fetchAllGrades()
    } catch {
      toast.error('Failed to delete grade')
    }
    setDeleting(false)
  }

  // ─── Loading State ─────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="space-y-5 sm:space-y-6">
        {/* Title skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1.5">
            <Skeleton className="h-8 w-44" />
            <Skeleton className="h-4 w-72" />
          </div>
          <Skeleton className="h-11 w-32 rounded-lg" />
        </div>

        {/* Stat cards skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>

        {/* Filter bar skeleton */}
        <div className="bg-white rounded-2xl border border-slate-200/60 p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <Skeleton className="h-11 flex-1 rounded-lg" />
            <Skeleton className="h-11 w-48 rounded-lg" />
          </div>
        </div>

        {/* Table skeleton */}
        <TableSkeleton />
      </div>
    )
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Grading System
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Configure and manage academic grading scales
          </p>
        </div>
        <Button
          onClick={() => openCreate()}
          className="bg-emerald-600 hover:bg-emerald-700 min-h-[44px]"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Grade
        </Button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          icon={GraduationCap}
          label="Total Grades"
          value={stats.total}
          subValue="All categories combined"
          iconBg="bg-emerald-500"
          borderColor="#10b981"
        />
        <StatCard
          icon={Award}
          label="Basic JHS"
          value={stats.basic}
          subValue={`${stats.total > 0 ? Math.round((stats.basic / stats.total) * 100) : 0}% of total`}
          iconBg="bg-emerald-500"
          borderColor="#059669"
        />
        <StatCard
          icon={BarChart3}
          label="JHS (Graded)"
          value={stats.jhs}
          subValue="With grade points"
          iconBg="bg-sky-500"
          borderColor="#0ea5e9"
        />
        <StatCard
          icon={Baby}
          label="Creche / Nursery"
          value={stats.creche}
          subValue="Pre-school grades"
          iconBg="bg-amber-500"
          borderColor="#f59e0b"
        />
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/60 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search grades..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 min-h-[44px]"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full hover:bg-slate-200 flex items-center justify-center"
              >
                <X className="w-3 h-3 text-slate-400" />
              </button>
            )}
          </div>
          {/* Category Filter */}
          <Select
            value={categoryFilter}
            onValueChange={(v) => setCategoryFilter(v as CategoryFilter)}
          >
            <SelectTrigger className="w-full sm:w-48 min-h-[44px]">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All Categories</SelectItem>
              <SelectItem value="basic">Basic JHS</SelectItem>
              <SelectItem value="jhs">JHS (Graded)</SelectItem>
              <SelectItem value="creche">Creche / Nursery</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Active filter chips */}
        {activeFilters.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mt-3">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            {activeFilters.map(f => (
              <Badge
                key={f.key}
                variant="outline"
                className="bg-slate-50 border-slate-200 text-slate-700 text-xs pr-1 gap-1"
              >
                {f.label}
                <button
                  onClick={() => clearFilter(f.key)}
                  className="ml-0.5 w-4 h-4 rounded-full hover:bg-slate-200 inline-flex items-center justify-center transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
            <button
              onClick={clearAllFilters}
              className="text-xs text-slate-500 hover:text-slate-700 underline-offset-2 hover:underline transition-colors"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* Data Table / Mobile Cards */}
      <div className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden">
        {/* Results header */}
        {!loading && filteredGrades.length > 0 && (
          <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-slate-100 bg-slate-50/50">
            <p className="text-xs font-medium text-slate-500">
              Showing {filteredGrades.length} of {unifiedGrades.length} grade{unifiedGrades.length !== 1 ? 's' : ''}
            </p>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-xs text-slate-500">
                {stats.basic} Basic &middot; {stats.jhs} JHS &middot; {stats.creche} Creche
              </span>
            </div>
          </div>
        )}

        {/* Desktop Table View */}
        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 hover:bg-slate-50">
                <TableHead className="text-xs font-semibold text-slate-600">Grade Name</TableHead>
                <TableHead className="text-xs font-semibold text-slate-600">Category</TableHead>
                <TableHead className="text-xs font-semibold text-slate-600">From Mark</TableHead>
                <TableHead className="text-xs font-semibold text-slate-600">To Mark</TableHead>
                <TableHead className="text-xs font-semibold text-slate-600">Grade Point</TableHead>
                <TableHead className="text-xs font-semibold text-slate-600">Remark</TableHead>
                <TableHead className="text-xs font-semibold text-slate-600 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredGrades.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-20 text-slate-400">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center">
                        <Award className="w-8 h-8 text-slate-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-500 text-base">No Grades Found</p>
                        <p className="text-xs text-slate-400 mt-1">
                          {search || categoryFilter !== '__all__'
                            ? 'Try adjusting your search or filter'
                            : 'Set up your grading scale to get started'}
                        </p>
                      </div>
                      {!search && categoryFilter === '__all__' && (
                        <Button
                          onClick={() => openCreate()}
                          variant="outline"
                          className="mt-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50 min-h-[44px]"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Grade
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredGrades.map((grade) => {
                  const catBadge = getCategoryBadge(grade.category)
                  return (
                    <TableRow key={`${grade.category}-${grade.id}`} className="hover:bg-slate-50/50 transition-colors">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={`text-sm font-bold min-w-[48px] justify-center ${getGradeColor(grade.name)}`}>
                            {grade.name}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-xs ${catBadge.className}`}>
                          {catBadge.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-semibold text-slate-700">
                        {grade.grade_from}%
                      </TableCell>
                      <TableCell className="font-semibold text-slate-700">
                        {grade.grade_to}%
                      </TableCell>
                      <TableCell>
                        {grade.gradePoint !== null ? (
                          <Badge variant="secondary" className="font-mono">
                            {grade.gradePoint}
                          </Badge>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-slate-500 max-w-[200px] truncate">
                        {grade.comment || '—'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 min-w-[32px]"
                            onClick={() => openEdit(grade)}
                            title="Edit"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 min-w-[32px] text-red-500 hover:text-red-600 hover:bg-red-50"
                            onClick={() => confirmDelete(grade)}
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden divide-y divide-slate-100">
          {filteredGrades.length === 0 ? (
            <div className="text-center py-20">
              <div className="flex flex-col items-center gap-3">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center">
                  <Award className="w-8 h-8 text-slate-400" />
                </div>
                <div>
                  <p className="font-semibold text-slate-500 text-base">No Grades Found</p>
                  <p className="text-xs text-slate-400 mt-1">
                    {search || categoryFilter !== '__all__'
                      ? 'Try adjusting your filters'
                      : 'Set up your grading scale'}
                  </p>
                </div>
                {!search && categoryFilter === '__all__' && (
                  <Button
                    onClick={() => openCreate()}
                    variant="outline"
                    className="mt-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50 min-h-[44px]"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Grade
                  </Button>
                )}
              </div>
            </div>
          ) : (
            filteredGrades.map((grade) => {
              const catBadge = getCategoryBadge(grade.category)
              return (
                <div key={`${grade.category}-${grade.id}`} className="p-4 space-y-3">
                  {/* Grade header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={`text-sm font-bold ${getGradeColor(grade.name)}`}>
                        {grade.name}
                      </Badge>
                    </div>
                    <Badge variant="outline" className={`text-xs shrink-0 ${catBadge.className}`}>
                      {catBadge.label}
                    </Badge>
                  </div>
                  {grade.comment && (
                    <p className="text-sm text-slate-500">{grade.comment}</p>
                  )}
                  {/* Mark range grid */}
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-400">From:</span>
                      <span className="font-semibold text-slate-700">{grade.grade_from}%</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-400">To:</span>
                      <span className="font-semibold text-slate-700">{grade.grade_to}%</span>
                    </div>
                  </div>
                  {grade.gradePoint !== null && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <span className="text-slate-400">GP:</span>
                      <Badge variant="secondary" className="font-mono text-xs">{grade.gradePoint}</Badge>
                    </div>
                  )}
                  {/* Action buttons */}
                  <div className="flex gap-2 pt-1">
                    <Button
                      variant="outline"
                      className="flex-1 min-h-[44px] text-xs"
                      onClick={() => openEdit(grade)}
                    >
                      <Pencil className="w-3.5 h-3.5 mr-1.5" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      className="min-h-[44px] min-w-[44px] text-xs text-red-600 border-red-200 hover:bg-red-50"
                      onClick={() => confirmDelete(grade)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* ═══ Add/Edit Dialog ═══ */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                <GraduationCap className="w-4 h-4 text-emerald-600" />
              </div>
              {selectedGrade ? 'Edit Grade' : 'Add New Grade'}
            </DialogTitle>
            <DialogDescription>
              {selectedGrade ? 'Update the grading scale details' : 'Define a new grading scale entry'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* Category */}
            <div>
              <Label className="text-xs font-medium">Category</Label>
              <Select
                value={form.category}
                onValueChange={(v) => setForm({ ...form, category: v as 'basic' | 'jhs' | 'creche' })}
                disabled={!!selectedGrade}
              >
                <SelectTrigger className="mt-1 min-h-[44px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="basic">Basic JHS</SelectItem>
                  <SelectItem value="jhs">JHS (Graded)</SelectItem>
                  <SelectItem value="creche">Creche / Nursery</SelectItem>
                </SelectContent>
              </Select>
              {selectedGrade && (
                <p className="text-xs text-slate-400 mt-1">Category cannot be changed when editing</p>
              )}
            </div>

            {/* Grade Name */}
            <div>
              <Label className="text-xs font-medium">Grade Name *</Label>
              <Input
                placeholder="e.g., EXCELLENT, VERY GOOD, A+, 1"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="mt-1 min-h-[44px]"
              />
            </div>

            {/* Mark Range */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-medium">From Mark (%) *</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  placeholder="e.g., 80"
                  value={form.grade_from}
                  onChange={(e) => setForm({ ...form, grade_from: e.target.value })}
                  className="mt-1 min-h-[44px]"
                />
              </div>
              <div>
                <Label className="text-xs font-medium">To Mark (%) *</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  placeholder="e.g., 100"
                  value={form.grade_to}
                  onChange={(e) => setForm({ ...form, grade_to: e.target.value })}
                  className="mt-1 min-h-[44px]"
                />
              </div>
            </div>

            {/* Grade Point (JHS only) */}
            {form.category === 'jhs' && (
              <div>
                <Label className="text-xs font-medium">Grade Point</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.1"
                  placeholder="e.g., 4.0"
                  value={form.grade_point}
                  onChange={(e) => setForm({ ...form, grade_point: e.target.value })}
                  className="mt-1 min-h-[44px]"
                />
                <p className="text-xs text-slate-400 mt-1">Numeric grade point for JHS grading</p>
              </div>
            )}

            {/* Comment */}
            <div>
              <Label className="text-xs font-medium">Remark / Comment</Label>
              <Textarea
                placeholder="e.g., Excellent performance, Good work"
                value={form.comment}
                onChange={(e) => setForm({ ...form, comment: e.target.value })}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)} className="min-h-[44px]">
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || !form.name.trim() || !form.grade_from || !form.grade_to}
              className="bg-emerald-600 hover:bg-emerald-700 min-h-[44px]"
            >
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {saving ? 'Saving...' : selectedGrade ? 'Update Grade' : 'Create Grade'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ Delete Confirmation ═══ */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-red-600" />
              Delete Grade
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete grade{' '}
              <strong className="text-slate-900">{selectedGrade?.name}</strong>
              {' '}({selectedGrade?.grade_from}% – {selectedGrade?.grade_to}%)?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="min-h-[44px]">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 min-h-[44px]"
            >
              {deleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {deleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
