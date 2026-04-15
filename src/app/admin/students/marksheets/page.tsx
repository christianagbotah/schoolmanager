'use client';

import { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  ArrowLeft, Search, Printer, FileText, GraduationCap,
  Users, Loader2, BarChart3, Award,
} from 'lucide-react';
import Link from 'next/link';

interface Student {
  student_id: number;
  student_code: string;
  name: string;
  class?: { class_id: number; name: string };
}

interface MarksheetSubject {
  subject_id: number;
  subject_name: string;
  mark_obtained: number;
  grade_name: string;
  grade_comment: string;
  remark: string;
  position: number;
}

interface ExamItem {
  exam_id: number;
  name: string;
  year: string;
  type: string;
  date: string;
}

interface MarksheetData {
  student: {
    student_id: number;
    student_code: string;
    name: string;
    sex: string;
    birthday: string;
    parent: { name: string; phone: string } | null;
  };
  class: { class_id: number; name: string; section_name: string };
  exam: { exam_id: number; name: string; date: string; year: string } | null;
  subjects: MarksheetSubject[];
  totalScore: number;
  subjectsScored: number;
  subjectsTotal: number;
  average: number;
  overallGrade: { name: string; comment: string };
  otherStudents: { student_id: number; name: string }[];
  availableExams: ExamItem[];
}

export default function MarksheetsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [searching, setSearching] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [marksheetData, setMarksheetData] = useState<MarksheetData | null>(null);
  const [loading, setLoading] = useState(false);

  const searchStudents = async () => {
    if (!studentSearch || studentSearch.length < 2) return;
    setSearching(true);
    try {
      const res = await fetch(`/api/students?search=${encodeURIComponent(studentSearch)}&limit=20`);
      const data = await res.json();
      setStudents(data.students || []);
    } catch {
      toast.error('Search failed');
    } finally {
      setSearching(false);
    }
  };

  const fetchMarksheet = useCallback(async (studentId: number, examId?: number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ student_id: String(studentId) });
      if (examId) params.set('exam_id', String(examId));
      const res = await fetch(`/api/admin/students/marksheet?${params}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setMarksheetData(data);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load marksheet');
      setMarksheetData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSelectStudent = (student: Student) => {
    setSelectedStudent(student);
    setStudents([]);
    setStudentSearch(student.name);
    fetchMarksheet(student.student_id);
  };

  const handleSwitchStudent = (studentId: number) => {
    const currentExam = marksheetData?.exam?.exam_id;
    const s = marksheetData?.otherStudents.find(os => os.student_id === studentId);
    if (s) {
      setSelectedStudent({ student_id: studentId, name: s.name });
      fetchMarksheet(studentId, currentExam);
    }
  };

  const handleExamChange = (examId: string) => {
    if (selectedStudent) {
      fetchMarksheet(selectedStudent.student_id, parseInt(examId));
    }
  };

  const handlePrint = () => window.print();

  const getGradeBadgeColor = (grade: string) => {
    if (grade === 'A' || grade === 'A1') return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    if (grade === 'B' || grade === 'B2' || grade === 'B3') return 'bg-sky-100 text-sky-700 border-sky-200';
    if (grade === 'C' || grade === 'C4' || grade === 'C5' || grade === 'C6') return 'bg-amber-100 text-amber-700 border-amber-200';
    if (grade === 'D' || grade === 'D7') return 'bg-orange-100 text-orange-700 border-orange-200';
    return 'bg-red-100 text-red-700 border-red-200';
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/students"><ArrowLeft className="w-5 h-5" /></Link>
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Student Marksheets</h1>
            <p className="text-sm text-slate-500 mt-1">View and print student mark sheets</p>
          </div>
          {marksheetData && (
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="w-4 h-4 mr-2" /> Print Marksheet
            </Button>
          )}
        </div>

        {/* Student Search & Selection */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <Label className="text-xs text-slate-500">Search Student</Label>
                <div className="relative mt-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    placeholder="Search by name or student code..."
                    value={studentSearch}
                    onChange={e => setStudentSearch(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && searchStudents()}
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  />
                  {searching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 animate-spin" />}
                </div>
                {students.length > 0 && (
                  <div className="mt-2 border rounded-lg max-h-48 overflow-y-auto bg-white shadow-sm">
                    {students.map(s => (
                      <button
                        key={s.student_id}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-violet-50 flex items-center gap-2 border-b last:border-b-0"
                        onClick={() => handleSelectStudent(s)}
                      >
                        <GraduationCap className="w-3 h-3 text-violet-400" />
                        <span>{s.name}</span>
                        <span className="text-xs text-slate-400">({s.student_code})</span>
                        <Badge variant="outline" className="text-[10px] ml-auto">{s.class?.name || ''}</Badge>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Exam Selector */}
              {marksheetData && marksheetData.availableExams.length > 0 && (
                <div className="w-full lg:w-56">
                  <Label className="text-xs text-slate-500">Select Exam</Label>
                  <Select onValueChange={handleExamChange}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder={marksheetData.exam?.name || 'Select exam'} />
                    </SelectTrigger>
                    <SelectContent>
                      {marksheetData.availableExams.map(e => (
                        <SelectItem key={e.exam_id} value={String(e.exam_id)}>
                          {e.name} ({e.year})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* Student Switcher */}
            {marksheetData && marksheetData.otherStudents.length > 0 && (
              <div className="pt-2 border-t">
                <Label className="text-xs text-slate-500 mb-1 block">Switch to Student:</Label>
                <Select onValueChange={v => handleSwitchStudent(parseInt(v))}>
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder={marksheetData.student.name} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={String(marksheetData.student.student_id)}>
                      {marksheetData.student.name} (current)
                    </SelectItem>
                    {marksheetData.otherStudents.map(os => (
                      <SelectItem key={os.student_id} value={String(os.student_id)}>{os.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Loading */}
        {loading && (
          <Card>
            <CardContent className="p-6 space-y-3">
              <Skeleton className="h-6 w-48" />
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </CardContent>
          </Card>
        )}

        {/* Marksheet */}
        {!loading && marksheetData && (
          <div id="marksheet" className="space-y-4">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Card className="border-l-4 border-l-violet-500">
                <CardContent className="p-3">
                  <p className="text-xs text-slate-500">Total Score</p>
                  <p className="text-xl font-bold text-slate-900">{marksheetData.totalScore}</p>
                  <p className="text-xs text-slate-400">of {marksheetData.subjectsTotal} subjects</p>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-sky-500">
                <CardContent className="p-3">
                  <p className="text-xs text-slate-500">Average</p>
                  <p className="text-xl font-bold text-sky-600">{marksheetData.average.toFixed(1)}%</p>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-emerald-500">
                <CardContent className="p-3">
                  <p className="text-xs text-slate-500">Overall Grade</p>
                  <Badge className={`mt-1 text-sm ${getGradeBadgeColor(marksheetData.overallGrade.name)}`}>
                    {marksheetData.overallGrade.name}
                  </Badge>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-amber-500">
                <CardContent className="p-3">
                  <p className="text-xs text-slate-500">Subjects Scored</p>
                  <p className="text-xl font-bold text-amber-600">{marksheetData.subjectsScored}/{marksheetData.subjectsTotal}</p>
                </CardContent>
              </Card>
            </div>

            {/* Marksheet Table */}
            <Card className="print:shadow-none print:border-0">
              <CardHeader className="print:hidden pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-violet-600" />
                  Marksheet — {marksheetData.student.name}
                  {marksheetData.exam && <Badge variant="outline">{marksheetData.exam.name}</Badge>}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 print:p-2">
                {/* Student Info */}
                <div className="bg-gradient-to-r from-violet-50 to-sky-50 rounded-xl p-4 mb-4 print:bg-gray-100">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                    <div>
                      <span className="text-slate-500 text-xs">Student:</span>
                      <p className="font-semibold">{marksheetData.student.name}</p>
                    </div>
                    <div>
                      <span className="text-slate-500 text-xs">Code:</span>
                      <p className="font-mono">{marksheetData.student.student_code}</p>
                    </div>
                    <div>
                      <span className="text-slate-500 text-xs">Class:</span>
                      <p className="font-semibold">{marksheetData.class.name}</p>
                    </div>
                    <div>
                      <span className="text-slate-500 text-xs">Exam:</span>
                      <p className="font-semibold">{marksheetData.exam?.name || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Marks Table */}
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-100">
                        <TableHead className="text-xs font-semibold w-12 text-center">#</TableHead>
                        <TableHead className="text-xs font-semibold">Subject</TableHead>
                        <TableHead className="text-xs font-semibold text-center">Mark Obtained</TableHead>
                        <TableHead className="text-xs font-semibold text-center">Grade</TableHead>
                        <TableHead className="text-xs font-semibold text-center">Remark</TableHead>
                        <TableHead className="text-xs font-semibold text-center">Position</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {marksheetData.subjects.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-12 text-slate-400">
                            No subjects or marks found. Enter marks first in Examination → Manage Exam Marks.
                          </TableCell>
                        </TableRow>
                      ) : (
                        <>
                          {marksheetData.subjects.map((m, i) => (
                            <TableRow key={m.subject_id} className={m.mark_obtained < 50 ? 'bg-red-50/50' : ''}>
                              <TableCell className="text-sm text-slate-400 text-center">{i + 1}</TableCell>
                              <TableCell className="font-medium text-sm">
                                {m.subject_name.length <= 4 ? m.subject_name.toUpperCase() : m.subject_name}
                              </TableCell>
                              <TableCell className="text-center">
                                <span className={`font-mono text-sm font-semibold ${m.mark_obtained > 0 ? '' : 'text-slate-300'}`}>
                                  {m.mark_obtained > 0 ? m.mark_obtained : 'N/A'}
                                </span>
                              </TableCell>
                              <TableCell className="text-center">
                                {m.mark_obtained > 0 ? (
                                  <Badge variant="outline" className={getGradeBadgeColor(m.grade_name)}>
                                    {m.grade_name}
                                  </Badge>
                                ) : (
                                  <span className="text-slate-300 text-sm">N/A</span>
                                )}
                              </TableCell>
                              <TableCell className="text-center text-sm">
                                {m.mark_obtained > 0 ? (
                                  <Badge variant="outline" className={m.remark === 'Credit' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}>
                                    {m.remark}
                                  </Badge>
                                ) : (
                                  <span className="text-slate-300 text-sm">N/A</span>
                                )}
                              </TableCell>
                              <TableCell className="text-center text-sm">
                                {m.position > 0 ? (
                                  <span className={`font-semibold ${m.position === 1 ? 'text-emerald-600' : m.position <= 3 ? 'text-sky-600' : 'text-slate-600'}`}>
                                    {m.position}
                                    {m.position === 1 && <Award className="w-3 h-3 inline ml-1" />}
                                  </span>
                                ) : (
                                  <span className="text-slate-300 text-sm">—</span>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                          {/* Total Row */}
                          <TableRow className="bg-slate-100 font-bold">
                            <TableCell className="text-center" colSpan={2}>TOTAL</TableCell>
                            <TableCell className="text-center font-mono">{marksheetData.totalScore}</TableCell>
                            <TableCell className="text-center">
                              <Badge className={getGradeBadgeColor(marksheetData.overallGrade.name)}>
                                {marksheetData.overallGrade.name}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant="outline" className={marksheetData.average >= 50 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}>
                                {marksheetData.average >= 50 ? 'Credit' : 'Fail'}
                              </Badge>
                            </TableCell>
                            <TableCell />
                          </TableRow>
                        </>
                      )}
                    </TableBody>
                  </Table>
                </div>

                <Separator className="my-4 print:my-2" />

                {/* Signature Lines */}
                <div className="grid grid-cols-2 gap-8 text-center text-sm text-slate-600 print:mt-4">
                  <div className="border-t-2 border-slate-300 pt-2">
                    <p className="font-medium">Class Teacher&apos;s Signature</p>
                  </div>
                  <div className="border-t-2 border-slate-300 pt-2">
                    <p className="font-medium">Head Teacher&apos;s Signature</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Empty State */}
        {!loading && !marksheetData && !selectedStudent && (
          <div className="text-center py-16 text-slate-400">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">Search for a student to view their marksheet</p>
            <p className="text-sm mt-1">Enter a name or student code above</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
