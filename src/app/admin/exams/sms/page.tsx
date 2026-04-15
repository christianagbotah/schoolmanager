'use client'

import { useState, useEffect, useCallback } from 'react'
import { useToast } from '@/hooks/use-toast'
import {
  GraduationCap, Send, Loader2, Filter, Users, Mail, MessageSquare,
  AlertCircle, CheckCircle2, Eye, Phone,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { DashboardLayout } from '@/components/layout/dashboard-layout'

// ===== Types =====
interface Exam { exam_id: number; name: string; year: string }
interface ClassItem { class_id: number; name: string; name_numeric: number }
interface MarksPreview {
  student_id: number
  name: string
  student_code: string
  subject: string
  mark_obtained: number
  parent: { name: string; phone: string; email: string } | null
}
interface SendResult {
  sent_count: number
  failed_count: number
  total_students: number
  results: Array<{
    student_name: string
    parent_name: string
    phone: string
    email: string
    status: string
    message: string
  }>
}

// ===== Main =====
export default function ExamSmsPage() {
  return (
    <DashboardLayout>
      <ExamSmsModule />
    </DashboardLayout>
  )
}

function ExamSmsModule() {
  const { toast } = useToast()
  const [exams, setExams] = useState<Exam[]>([])
  const [classes, setClasses] = useState<ClassItem[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)

  const [selectedExam, setSelectedExam] = useState('')
  const [selectedClass, setSelectedClass] = useState('')
  const [receiverType, setReceiverType] = useState('')
  const [method, setMethod] = useState('sms')

  const [previewMarks, setPreviewMarks] = useState<MarksPreview[]>([])
  const [previewLoading, setPreviewLoading] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  const [sendResult, setSendResult] = useState<SendResult | null>(null)
  const [resultOpen, setResultOpen] = useState(false)

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

  const handlePreview = async () => {
    if (!selectedExam || !selectedClass) {
      toast({ title: 'Error', description: 'Please select exam and class', variant: 'destructive' })
      return
    }
    if (!receiverType) {
      toast({ title: 'Error', description: 'Please select receiver type', variant: 'destructive' })
      return
    }

    setPreviewLoading(true)
    setShowPreview(true)
    try {
      const res = await fetch('/api/admin/exams/marks', {
        method: 'GET',
      })
      // Use the marks API to get preview data
      const params = new URLSearchParams({
        exam_id: selectedExam,
        class_id: selectedClass,
        subject_id: '0', // Will be handled on backend
      })

      // For preview, get enrolled students with marks
      const enrollRes = await fetch(`/api/admin/exams/marks?${params}`)
      const enrollData = await enrollRes.json()

      // Get all marks for this exam/class
      const marksRes = await fetch(`/api/marks?exam_id=${selectedExam}&class_id=${selectedClass}`)
      const marksData = await marksRes.json()
      const allMarks = marksData.marks || []

      // Group marks by student
      const studentMap = new Map<number, MarksPreview>()
      for (const m of allMarks) {
        const sid = m.student_id
        if (!studentMap.has(sid)) {
          studentMap.set(sid, {
            student_id: sid,
            name: m.student?.name || 'Unknown',
            student_code: m.student?.student_code || '',
            subject: m.subject?.name || '',
            mark_obtained: 0,
            parent: null,
          })
        }
        const existing = studentMap.get(sid)!
        existing.mark_obtained += m.mark_obtained || 0
      }

      // Try to get parent info from enrollment data
      const enrollStudents = enrollData.students || []
      for (const es of enrollStudents) {
        const existing = studentMap.get(es.student_id)
        if (existing && es.parent) {
          existing.parent = es.parent
        }
      }

      setPreviewMarks(Array.from(studentMap.values()))
    } catch {
      toast({ title: 'Error', description: 'Failed to load preview', variant: 'destructive' })
    }
    setPreviewLoading(false)
  }

  const handleSend = async () => {
    if (!selectedExam || !selectedClass) return
    setSending(true)
    try {
      const res = await fetch('/api/admin/exams/sms-marks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exam_id: parseInt(selectedExam),
          class_id: parseInt(selectedClass),
          method,
          receiver_type: receiverType,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to send')

      setSendResult(data)
      setResultOpen(true)
      toast({
        title: 'Messages Sent',
        description: `${data.sent_count} sent, ${data.failed_count} failed`,
      })
    } catch (err) {
      toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' })
    }
    setSending(false)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 p-6 text-white shadow-lg">
        <h1 className="text-2xl font-bold flex items-center gap-3">
          <MessageSquare className="w-7 h-7" />
          Send Exam Marks via SMS / Email
        </h1>
        <p className="mt-1 text-emerald-100">Send examination results to parents or students</p>
      </div>

      {/* Selector Card */}
      <Card className="border-slate-200/60">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="w-5 h-5 text-emerald-600" />
            Configure Message
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
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger className="min-h-[44px]"><SelectValue placeholder="Select class" /></SelectTrigger>
                  <SelectContent>
                    {classes.map(c => (
                      <SelectItem key={c.class_id} value={c.class_id.toString()}>{c.name} {c.name_numeric}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Receiver *</Label>
                <Select value={receiverType} onValueChange={setReceiverType}>
                  <SelectTrigger className="min-h-[44px]"><SelectValue placeholder="Select receiver" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="parent">Parents</SelectItem>
                    <SelectItem value="student">Students</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Method *</Label>
                <Select value={method} onValueChange={setMethod}>
                  <SelectTrigger className="min-h-[44px]"><SelectValue placeholder="Select method" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sms">SMS Only</SelectItem>
                    <SelectItem value="email">Email Only</SelectItem>
                    <SelectItem value="both">SMS & Email</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <div className="flex items-center gap-3 mt-6 pt-4 border-t">
            <Button
              variant="outline"
              onClick={handlePreview}
              className="min-h-[44px]"
              disabled={!selectedExam || !selectedClass || !receiverType}
            >
              <Eye className="w-4 h-4 mr-2" />
              Preview Marks
            </Button>
            <Button
              onClick={handleSend}
              className="bg-emerald-600 hover:bg-emerald-700 min-h-[44px]"
              disabled={!selectedExam || !selectedClass || !receiverType || sending}
            >
              {sending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
              {sending ? 'Sending...' : `Send via ${method.toUpperCase()}`}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Preview */}
      {showPreview && (
        <Card className="border-slate-200/60">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Marks Preview</CardTitle>
            <CardDescription>{previewMarks.length} student{previewMarks.length !== 1 ? 's' : ''} with marks</CardDescription>
          </CardHeader>
          <CardContent>
            {previewLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}
              </div>
            ) : previewMarks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <AlertCircle className="w-12 h-12 text-slate-300 mb-3" />
                <h3 className="text-lg font-semibold text-slate-900 mb-1">No Marks Found</h3>
                <p className="text-sm text-slate-500">No marks recorded for the selected criteria</p>
              </div>
            ) : (
              <div className="max-h-[400px] overflow-y-auto rounded-lg border border-slate-200 custom-scrollbar">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50 hover:bg-slate-50">
                      <TableHead className="w-10">#</TableHead>
                      <TableHead>Student</TableHead>
                      <TableHead className="text-center">Total Score</TableHead>
                      <TableHead className="hidden sm:table-cell">Parent</TableHead>
                      <TableHead className="hidden sm:table-cell">Contact</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewMarks.map((s, idx) => (
                      <TableRow key={s.student_id} className="hover:bg-slate-50">
                        <TableCell className="text-sm text-slate-500">{idx + 1}</TableCell>
                        <TableCell className="font-semibold text-slate-900">{s.name}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className={
                            s.mark_obtained >= 80 ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                            s.mark_obtained >= 50 ? 'bg-amber-100 text-amber-700 border-amber-200' :
                            'bg-red-100 text-red-700 border-red-200'
                          }>
                            {s.mark_obtained}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-sm text-slate-500">
                          {s.parent?.name || 'N/A'}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-sm text-slate-500">
                          {s.parent?.phone || s.parent?.email || 'N/A'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Results Dialog */}
      <Dialog open={resultOpen} onOpenChange={setResultOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              Send Results
            </DialogTitle>
            <DialogDescription>Summary of message delivery</DialogDescription>
          </DialogHeader>
          {sendResult && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-emerald-50 rounded-lg p-4 text-center">
                  <p className="text-3xl font-bold text-emerald-600">{sendResult.sent_count}</p>
                  <p className="text-sm text-slate-500">Sent</p>
                </div>
                <div className="bg-red-50 rounded-lg p-4 text-center">
                  <p className="text-3xl font-bold text-red-600">{sendResult.failed_count}</p>
                  <p className="text-sm text-slate-500">Failed</p>
                </div>
              </div>
              <div className="max-h-48 overflow-y-auto">
                {sendResult.results.slice(0, 10).map((r, i) => (
                  <div key={i} className="flex items-center gap-2 py-2 text-sm border-b last:border-0">
                    {r.status === 'sent' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                    )}
                    <span className="font-medium text-slate-900">{r.student_name}</span>
                    <span className="text-slate-400 ml-auto">{r.status}</span>
                  </div>
                ))}
                {sendResult.results.length > 10 && (
                  <p className="text-xs text-slate-400 text-center pt-2">
                    ... and {sendResult.results.length - 10} more
                  </p>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setResultOpen(false)} className="bg-emerald-600 hover:bg-emerald-700">
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
