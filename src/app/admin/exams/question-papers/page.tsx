'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useToast } from '@/hooks/use-toast'
import {
  FileText, Upload, Trash2, Download, Eye, Loader2, Plus, Search,
  GraduationCap, File, X, Filter,
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
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { DashboardLayout } from '@/components/layout/dashboard-layout'

// ===== Types =====
interface Exam { exam_id: number; name: string; year: string }
interface ClassItem { class_id: number; name: string; name_numeric: number }
interface Teacher { teacher_id: number; name: string }
interface QuestionPaper {
  question_paper_id: number
  title: string
  class_id: number | null
  exam_id: number | null
  teacher_id: number | null
  file_path: string
  description: string
  upload_date: string | null
  class_name: string
  teacher_name: string
  exam: { exam_id: number; name: string } | null
}

// ===== Main =====
export default function QuestionPapersPage() {
  return (
    <DashboardLayout>
      <QuestionPapersModule />
    </DashboardLayout>
  )
}

function QuestionPapersModule() {
  const { toast } = useToast()
  const [papers, setPapers] = useState<QuestionPaper[]>([])
  const [exams, setExams] = useState<Exam[]>([])
  const [classes, setClasses] = useState<ClassItem[]>([])
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [search, setSearch] = useState('')

  const [formOpen, setFormOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [selectedPaper, setSelectedPaper] = useState<QuestionPaper | null>(null)

  const [filterExam, setFilterExam] = useState('')
  const [filterClass, setFilterClass] = useState('')

  const [form, setForm] = useState({
    title: '', class_id: '', exam_id: '', teacher_id: '', description: '',
  })
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [papersRes, examsRes, classesRes, teachersRes] = await Promise.all([
        fetch('/api/admin/exams/question-papers'),
        fetch('/api/exams'),
        fetch('/api/classes'),
        fetch('/api/teachers'),
      ])
      const papersData = await papersRes.json()
      setPapers(papersData.papers || [])
      const examsData = await examsRes.json()
      setExams(Array.isArray(examsData) ? examsData : (examsData.exams || []))
      const classesData = await classesRes.json()
      setClasses(Array.isArray(classesData) ? classesData : [])
      const teachersData = await teachersRes.json()
      setTeachers(Array.isArray(teachersData) ? teachersData : [])
    } catch {
      toast({ title: 'Error', description: 'Failed to fetch data', variant: 'destructive' })
    }
    setLoading(false)
  }, [toast])

  useEffect(() => { fetchData() }, [fetchData])

  const openCreate = () => {
    setSelectedPaper(null)
    setForm({ title: '', class_id: '', exam_id: '', teacher_id: '', description: '' })
    setSelectedFile(null)
    setFormOpen(true)
  }

  const handleUpload = async () => {
    if (!form.title.trim()) {
      toast({ title: 'Error', description: 'Title is required', variant: 'destructive' })
      return
    }
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('title', form.title)
      formData.append('description', form.description)
      if (form.class_id) formData.append('class_id', form.class_id)
      if (form.exam_id) formData.append('exam_id', form.exam_id)
      if (form.teacher_id) formData.append('teacher_id', form.teacher_id)
      if (selectedFile) formData.append('file', selectedFile)

      const res = await fetch('/api/admin/exams/question-papers', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Failed') }
      toast({ title: 'Success', description: 'Question paper uploaded successfully' })
      setFormOpen(false)
      fetchData()
    } catch (err) {
      toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' })
    }
    setUploading(false)
  }

  const handleDelete = async () => {
    if (!selectedPaper) return
    try {
      const res = await fetch(`/api/admin/exams/question-papers?id=${selectedPaper.question_paper_id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed')
      toast({ title: 'Success', description: 'Question paper deleted' })
      setDeleteOpen(false)
      fetchData()
    } catch {
      toast({ title: 'Error', description: 'Failed to delete', variant: 'destructive' })
    }
  }

  const filteredPapers = papers.filter(p => {
    if (search && !p.title.toLowerCase().includes(search.toLowerCase())) return false
    if (filterExam && p.exam_id?.toString() !== filterExam) return false
    if (filterClass && p.class_id?.toString() !== filterClass) return false
    return true
  })

  const getFileIcon = (filePath: string) => {
    const ext = filePath.split('.').pop()?.toLowerCase()
    if (['pdf'].includes(ext)) return <FileText className="w-4 h-4 text-red-500" />
    if (['doc', 'docx'].includes(ext)) return <FileText className="w-4 h-4 text-blue-500" />
    return <File className="w-4 h-4 text-slate-500" />
  }

  const statCards = [
    { label: 'Total Papers', value: papers.length, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'With Files', value: papers.filter(p => p.file_path).length, color: 'text-teal-600', bg: 'bg-teal-50' },
    { label: 'This Exam', value: filterExam ? filteredPapers.length : papers.length, color: 'text-amber-600', bg: 'bg-amber-50' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            <FileText className="w-6 h-6 inline-block mr-2 text-emerald-600" />
            Question Papers
          </h1>
          <p className="text-sm text-slate-500 mt-1">Upload and manage examination question papers</p>
        </div>
        <Button onClick={openCreate} className="bg-emerald-600 hover:bg-emerald-700 min-h-[44px]">
          <Upload className="w-4 h-4 mr-2" /> Upload Paper
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

      {/* Papers List */}
      <Card className="border-slate-200/60">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg">Uploaded Papers</CardTitle>
              <CardDescription>{filteredPapers.length} paper{filteredPapers.length !== 1 ? 's' : ''} found</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-10 w-48 min-h-[44px]"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2"><Filter className="w-4 h-4" /> Filter by Exam</Label>
              <Select value={filterExam} onValueChange={v => setFilterExam(v === 'all' ? '' : v)}>
                <SelectTrigger className="min-h-[44px]"><SelectValue placeholder="All exams" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Exams</SelectItem>
                  {exams.map(e => (
                    <SelectItem key={e.exam_id} value={e.exam_id.toString()}>{e.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2"><GraduationCap className="w-4 h-4" /> Filter by Class</Label>
              <Select value={filterClass} onValueChange={v => setFilterClass(v === 'all' ? '' : v)}>
                <SelectTrigger className="min-h-[44px]"><SelectValue placeholder="All classes" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  {classes.map(c => (
                    <SelectItem key={c.class_id} value={c.class_id.toString()}>{c.name} {c.name_numeric}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}
            </div>
          ) : filteredPapers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                <FileText className="w-8 h-8 text-slate-300" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-1">No Papers Found</h3>
              <p className="text-sm text-slate-500 mb-4">Upload your first question paper</p>
              <Button onClick={openCreate} className="bg-emerald-600 hover:bg-emerald-700">
                <Upload className="w-4 h-4 mr-2" /> Upload Paper
              </Button>
            </div>
          ) : (
            <div className="max-h-[500px] overflow-y-auto rounded-lg border border-slate-200 custom-scrollbar">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 hover:bg-slate-50">
                    <TableHead className="w-10">#</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead className="hidden sm:table-cell">Class</TableHead>
                    <TableHead className="hidden md:table-cell">Exam</TableHead>
                    <TableHead className="hidden lg:table-cell">Teacher</TableHead>
                    <TableHead className="hidden md:table-cell">File</TableHead>
                    <TableHead className="w-[100px] text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPapers.map((paper, idx) => (
                    <TableRow key={paper.question_paper_id} className="hover:bg-slate-50 transition-colors">
                      <TableCell className="text-sm text-slate-500">{idx + 1}</TableCell>
                      <TableCell className="font-semibold text-slate-900">{paper.title}</TableCell>
                      <TableCell className="hidden sm:table-cell text-sm text-slate-500">{paper.class_name || '—'}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant="outline" className="text-xs">{paper.exam?.name || '—'}</Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-sm text-slate-500">{paper.teacher_name || '—'}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        {paper.file_path ? (
                          <a href={paper.file_path} target="_blank" className="flex items-center gap-1.5 text-emerald-600 hover:text-emerald-700 text-sm">
                            {getFileIcon(paper.file_path)}
                            <span className="truncate max-w-[100px]">View</span>
                          </a>
                        ) : '—'}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button variant="ghost" size="sm"
                            onClick={() => { setSelectedPaper(paper); setDeleteOpen(true) }}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50" title="Delete">
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

      {/* Upload Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-emerald-600" />
              Upload Question Paper
            </DialogTitle>
            <DialogDescription>Add a new question paper for an examination</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Title *</Label>
              <Input
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                placeholder="e.g., Mathematics Mid-Term 2024"
                className="min-h-[44px]"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Class</Label>
                <Select value={form.class_id} onValueChange={v => setForm({ ...form, class_id: v })}>
                  <SelectTrigger className="min-h-[44px]"><SelectValue placeholder="Select class" /></SelectTrigger>
                  <SelectContent>
                    {classes.map(c => (
                      <SelectItem key={c.class_id} value={c.class_id.toString()}>{c.name} {c.name_numeric}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Exam</Label>
                <Select value={form.exam_id} onValueChange={v => setForm({ ...form, exam_id: v })}>
                  <SelectTrigger className="min-h-[44px]"><SelectValue placeholder="Select exam" /></SelectTrigger>
                  <SelectContent>
                    {exams.map(e => (
                      <SelectItem key={e.exam_id} value={e.exam_id.toString()}>{e.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Teacher</Label>
              <Select value={form.teacher_id} onValueChange={v => setForm({ ...form, teacher_id: v })}>
                <SelectTrigger className="min-h-[44px]"><SelectValue placeholder="Select teacher" /></SelectTrigger>
                <SelectContent>
                  {teachers.map(t => (
                    <SelectItem key={t.teacher_id} value={t.teacher_id.toString()}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>File (PDF, DOC, DOCX)</Label>
              <div className="border-2 border-dashed border-slate-300 rounded-xl p-4 text-center hover:border-emerald-400 transition-colors">
                {selectedFile ? (
                  <div className="flex items-center justify-center gap-2">
                    <File className="w-5 h-5 text-emerald-600" />
                    <span className="text-sm font-medium text-slate-700">{selectedFile.name}</span>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => { setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = '' }}>
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ) : (
                  <label className="cursor-pointer flex flex-col items-center gap-2">
                    <Upload className="w-8 h-8 text-slate-400" />
                    <span className="text-sm text-slate-500">Click to select file</span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.doc,.docx"
                      className="hidden"
                      onChange={e => setSelectedFile(e.target.files?.[0] || null)}
                    />
                  </label>
                )}
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                placeholder="Brief description (optional)"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button onClick={handleUpload} className="bg-emerald-600 hover:bg-emerald-700" disabled={uploading}>
              {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
              {uploading ? 'Uploading...' : 'Upload Paper'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Question Paper</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{selectedPaper?.title}</strong>? The associated file will also be removed. This action cannot be undone.
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
