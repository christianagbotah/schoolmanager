'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { ArrowLeft, Search, Printer, FileText, GraduationCap } from 'lucide-react';
import Link from 'next/link';

interface Student { student_id: number; student_code: string; name: string; class?: { class_id: number; name: string }; }
interface Exam { exam_id: number; name: string; date: string; year: string; }
interface MarkResult { subject_name: string; mark_obtained: number; max_mark: number; grade: string; }

export default function MarksheetsPage() {
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedExam, setSelectedExam] = useState('');
  const [marks, setMarks] = useState<MarkResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);

  const searchStudents = async () => {
    if (!studentSearch || studentSearch.length < 2) return;
    setSearching(true);
    try {
      const res = await fetch(`/api/students?search=${encodeURIComponent(studentSearch)}&limit=20`);
      const data = await res.json();
      setStudents(data.students || []);
    } catch { toast.error('Search failed'); } finally { setSearching(false); }
  };

  const fetchExams = async () => {
    try {
      const res = await fetch('/api/exams');
      const data = await res.json();
      setExams(Array.isArray(data) ? data : []);
    } catch {}
  };

  const fetchMarks = async () => {
    if (!selectedStudent || !selectedExam) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/marks?student_id=${selectedStudent.student_id}&exam_id=${selectedExam}`);
      const data = await res.json();
      setMarks(data.marks || data || []);
    } catch { setMarks([]); } finally { setLoading(false); }
  };

  const handlePrint = () => window.print();

  const getTotal = () => marks.reduce((sum, m) => sum + m.mark_obtained, 0);
  const getMaxTotal = () => marks.reduce((sum, m) => sum + (m.max_mark || 100), 0);
  const getAverage = () => marks.length > 0 ? getTotal() / marks.length : 0;

  const getGrade = (score: number) => {
    if (score >= 80) return 'A';
    if (score >= 70) return 'B';
    if (score >= 60) return 'C';
    if (score >= 50) return 'D';
    return 'F';
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild><Link href="/admin/students"><ArrowLeft className="w-5 h-5" /></Link></Button>
          <div><h1 className="text-2xl font-bold text-slate-900 tracking-tight">Marksheets</h1><p className="text-sm text-slate-500 mt-1">Generate and print student marksheets</p></div>
        </div>

        <Card>
          <CardContent className="p-6 space-y-4">
            <h3 className="font-semibold text-slate-800">Select Student & Exam</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs">Search Student</Label>
                <div className="relative mt-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input placeholder="Search by name or code..." value={studentSearch} onChange={e => { setStudentSearch(e.target.value); }} onKeyDown={e => e.key === 'Enter' && searchStudents()} className="pl-10" />
                </div>
                {students.length > 0 && (
                  <div className="mt-2 border rounded-lg max-h-40 overflow-y-auto bg-white">
                    {students.map(s => (
                      <button key={s.student_id} className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 flex items-center gap-2" onClick={() => { setSelectedStudent(s); setStudents([]); setStudentSearch(s.name); fetchExams(); }}>
                        <GraduationCap className="w-3 h-3 text-slate-400" />
                        <span>{s.name}</span>
                        <span className="text-xs text-slate-400">({s.student_code})</span>
                        <Badge variant="outline" className="text-[10px] ml-auto">{s.class?.name || ''}</Badge>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <Label className="text-xs">Select Exam</Label>
                <Select value={selectedExam} onValueChange={v => { setSelectedExam(v); }}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select exam" /></SelectTrigger>
                  <SelectContent>{exams.map(e => <SelectItem key={e.exam_id} value={String(e.exam_id)}>{e.name} ({e.year})</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={fetchMarks} disabled={!selectedStudent || !selectedExam || loading} className="bg-emerald-600 hover:bg-emerald-700">
              <FileText className="w-4 h-4 mr-2" />{loading ? 'Loading...' : 'Generate Marksheet'}
            </Button>
          </CardContent>
        </Card>

        {marks.length > 0 && selectedStudent && (
          <Card id="marksheet" className="print:shadow-none print:border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6 print:hidden">
                <h3 className="font-semibold text-slate-800">Marksheet Preview</h3>
                <Button variant="outline" onClick={handlePrint}><Printer className="w-4 h-4 mr-2" />Print</Button>
              </div>

              <div className="text-center mb-6 border-b pb-4">
                <h2 className="text-xl font-bold text-slate-900">STUDENT MARKSHEET</h2>
                <div className="grid grid-cols-2 gap-2 mt-4 text-sm max-w-md mx-auto text-left">
                  <div><span className="text-slate-500">Name:</span> <span className="font-medium">{selectedStudent.name}</span></div>
                  <div><span className="text-slate-500">Code:</span> <span className="font-mono">{selectedStudent.student_code}</span></div>
                  <div><span className="text-slate-500">Class:</span> <span className="font-medium">{selectedStudent.class?.name || '—'}</span></div>
                  <div><span className="text-slate-500">Exam:</span> <span className="font-medium">{exams.find(e => String(e.exam_id) === selectedExam)?.name || ''}</span></div>
                </div>
              </div>

              <Table>
                <TableHeader><TableRow className="bg-slate-100">
                  <TableHead className="text-xs font-semibold">#</TableHead>
                  <TableHead className="text-xs font-semibold">Subject</TableHead>
                  <TableHead className="text-xs font-semibold text-center">Mark Obtained</TableHead>
                  <TableHead className="text-xs font-semibold text-center">Grade</TableHead>
                  <TableHead className="text-xs font-semibold text-center">Remark</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {marks.map((m, i) => {
                    const g = m.grade || getGrade(m.mark_obtained);
                    return (
                      <TableRow key={i}>
                        <TableCell className="text-sm text-slate-400">{i + 1}</TableCell>
                        <TableCell className="font-medium text-sm">{m.subject_name}</TableCell>
                        <TableCell className="text-center text-sm font-mono">{m.mark_obtained}/{m.max_mark || 100}</TableCell>
                        <TableCell className="text-center"><Badge variant="outline" className={g === 'A' ? 'bg-emerald-100 text-emerald-700' : g === 'F' ? 'bg-red-100 text-red-700' : 'bg-slate-100'}>{g}</Badge></TableCell>
                        <TableCell className="text-center text-sm">{m.mark_obtained >= 50 ? 'Credit' : 'Fail'}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              <div className="flex justify-end mt-4 gap-8 text-sm font-medium">
                <div>Total: <span className="font-mono">{getTotal()}/{getMaxTotal()}</span></div>
                <div>Average: <span className="font-mono">{getAverage().toFixed(1)}%</span></div>
                <div>Grade: <Badge variant="outline" className={getGrade(getAverage()) === 'A' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100'}>{getGrade(getAverage())}</Badge></div>
              </div>

              <div className="mt-8 grid grid-cols-2 gap-4 text-center text-sm text-slate-600">
                <div className="border-t pt-2">Teacher's Signature</div>
                <div className="border-t pt-2">Head Teacher's Signature</div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
