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
  ArrowLeft, Printer, FileText, GraduationCap,
  Users, Loader2, BarChart3, Award, Search, TrendingUp,
  ChevronDown, Target, BookOpen, AlertCircle, CheckCircle2,
} from 'lucide-react';
import Link from 'next/link';

// ── Types ──
interface ClassItem {
  class_id: number; name: string; name_numeric: number; category: string;
}
interface SectionItem { section_id: number; name: string }
interface ExamItem {
  exam_id: number; name: string; year: string; term: number; sem: number; type: string; date: string;
}

interface SubjectItem { subject_id: number; name: string }

interface StudentMark {
  student_id: number; student_code: string; name: string; sex: string;
  section_name: string; roll: string;
  marks: { subject_id: number; subject_name: string; mark_obtained: number; grade: string }[];
  total: number; subjects_taken: number; average: number; grade: string; position: number;
}

interface BulkMarksheetData {
  class: ClassItem;
  section: SectionItem | null;
  exam: ExamItem | null;
  subjects: SubjectItem[];
  students: StudentMark[];
  totalStudents: number;
  classes: ClassItem[];
  sections: SectionItem[];
  availableExams: ExamItem[];
  summary: {
    highestScore: number; classAverage: string; studentsAboveAverage: number; totalSubjects: number;
  };
}

const CLASS_GROUPS = ['CRECHE', 'NURSERY', 'KG', 'PRIMARY', 'JHS', 'JHSS'];

export default function MarksheetsPage() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSectionId, setSelectedSectionId] = useState('');
  const [selectedExamId, setSelectedExamId] = useState('');
  const [sections, setSections] = useState<SectionItem[]>([]);
  const [availableExams, setAvailableExams] = useState<ExamItem[]>([]);
  const [data, setData] = useState<BulkMarksheetData | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(true);

  // Load classes on mount
  useEffect(() => {
    fetch('/api/admin/classes?limit=200')
      .then(r => r.json())
      .then(d => {
        setClasses(Array.isArray(d) ? d : []);
        setLoadingInitial(false);
      })
      .catch(() => setLoadingInitial(false));
  }, []);

  // Load sections when class changes
  useEffect(() => {
    if (!selectedClassId) {
      setSections([]);
      setAvailableExams([]);
      return;
    }
    fetch(`/api/admin/sections?class_id=${selectedClassId}`)
      .then(r => r.json())
      .then(d => {
        setSections(Array.isArray(d) ? d : []);
        if (Array.isArray(d) && d.length > 0 && !selectedSectionId) {
          setSelectedSectionId(String(d[0].section_id));
        }
      })
      .catch(() => setSections([]));

    fetch(`/api/admin/exams?class_id=${selectedClassId}`)
      .then(r => r.json())
      .then(d => {
        setAvailableExams(Array.isArray(d) ? d : []);
      })
      .catch(() => setAvailableExams([]));
  }, [selectedClassId]);

  const fetchMarksheet = useCallback(async () => {
    if (!selectedClassId || !selectedExamId) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        class_id: selectedClassId,
        exam_id: selectedExamId,
      });
      if (selectedSectionId) params.set('section_id', selectedSectionId);

      const res = await fetch(`/api/admin/students/bulk-marksheet?${params}`);
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setData(json);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load marksheet');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [selectedClassId, selectedSectionId, selectedExamId]);

  // Auto-fetch when all selections are made
  useEffect(() => {
    if (selectedClassId && selectedExamId) {
      fetchMarksheet();
    }
  }, [fetchMarksheet]);

  const groupClasses = (g: string) =>
    classes.filter(c => c.category === g).sort((a, b) => a.name_numeric - b.name_numeric);

  const handlePrint = () => window.print();

  const getGradeBadgeColor = (grade: string) => {
    if (grade === 'A' || grade === 'A1') return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    if (grade === 'B' || grade === 'B2' || grade === 'B3') return 'bg-sky-100 text-sky-700 border-sky-200';
    if (grade === 'C' || grade === 'C4' || grade === 'C5' || grade === 'C6') return 'bg-amber-100 text-amber-700 border-amber-200';
    if (grade === 'D' || grade === 'D7') return 'bg-orange-100 text-orange-700 border-orange-200';
    if (grade === 'E' || grade === 'E8') return 'bg-red-100 text-red-700 border-red-200';
    return 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const getPositionBadge = (pos: number, total: number) => {
    if (pos <= 0) return 'text-gray-300';
    if (pos === 1) return 'text-amber-600 font-bold';
    if (pos <= 3) return 'text-sky-600 font-semibold';
    return 'text-slate-600';
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/students"><ArrowLeft className="w-5 h-5" /></Link>
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Bulk Marksheets</h1>
            <p className="text-sm text-slate-500 mt-1">View class-wide mark sheets with student positions</p>
          </div>
          {data && (
            <Button variant="outline" onClick={handlePrint} className="print:hidden">
              <Printer className="w-4 h-4 mr-2" />Print Marksheet
            </Button>
          )}
        </div>

        {/* Filters */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-violet-600" />
              Select Class, Section &amp; Exam
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Class selector */}
              <div>
                <Label className="text-xs font-medium text-slate-500 mb-1.5 block">Class *</Label>
                <Select value={selectedClassId} onValueChange={(v) => { setSelectedClassId(v); setSelectedSectionId(''); setSelectedExamId(''); setData(null); }}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={loadingInitial ? 'Loading...' : 'Select class'} />
                  </SelectTrigger>
                  <SelectContent>
                    {CLASS_GROUPS.map(g => (
                      <div key={g}>
                        <div className="px-2 py-1.5 text-xs font-semibold text-slate-400 uppercase bg-slate-50">{g}</div>
                        {groupClasses(g).map(c => (
                          <SelectItem key={c.class_id} value={String(c.class_id)}>
                            {c.name} {c.name_numeric}
                          </SelectItem>
                        ))}
                      </div>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Section selector */}
              <div>
                <Label className="text-xs font-medium text-slate-500 mb-1.5 block">Section</Label>
                <Select value={selectedSectionId} onValueChange={(v) => { setSelectedSectionId(v === '__all__' ? '' : v); setData(null); }}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={sections.length === 0 ? 'Select class first' : 'All sections'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">All Sections</SelectItem>
                    {sections.map(s => (
                      <SelectItem key={s.section_id} value={String(s.section_id)}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Exam selector */}
              <div>
                <Label className="text-xs font-medium text-slate-500 mb-1.5 block">Exam *</Label>
                <Select value={selectedExamId} onValueChange={(v) => { setSelectedExamId(v); setData(null); }}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={availableExams.length === 0 ? 'Select class first' : 'Choose exam'} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableExams.length === 0 && (
                      <div className="px-2 py-4 text-center text-sm text-slate-400">No exams found for this class</div>
                    )}
                    {availableExams.map(e => (
                      <SelectItem key={e.exam_id} value={String(e.exam_id)}>
                        {e.name} — Year {e.year?.split('-')?.[1] || ''} | {e.sem ? `Sem ${e.sem}` : `Term ${e.term}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Loading State */}
        {loading && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-20 rounded-xl" />
              ))}
            </div>
            <Card>
              <CardContent className="p-4 space-y-3">
                <Skeleton className="h-6 w-64" />
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Marksheet Results */}
        {!loading && data && (
          <div id="marksheet" className="space-y-4 print:space-y-2">
            {/* Summary Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Card className="border-l-4 border-l-violet-500">
                <CardContent className="p-3">
                  <p className="text-xs text-slate-400 font-semibold">Total Students</p>
                  <p className="text-xl font-bold text-slate-900">{data.totalStudents}</p>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-emerald-500">
                <CardContent className="p-3">
                  <p className="text-xs text-slate-400 font-semibold">Highest Score</p>
                  <p className="text-xl font-bold text-emerald-600">{data.summary.highestScore}</p>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-sky-500">
                <CardContent className="p-3">
                  <p className="text-xs text-slate-400 font-semibold">Class Average</p>
                  <p className="text-xl font-bold text-sky-600">{data.summary.classAverage}%</p>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-amber-500">
                <CardContent className="p-3">
                  <p className="text-xs text-slate-400 font-semibold">Above Average</p>
                  <p className="text-xl font-bold text-amber-600">{data.summary.studentsAboveAverage}/{data.totalStudents}</p>
                </CardContent>
              </Card>
            </div>

            {/* Marksheet Header Info */}
            <Card className="print:shadow-none print:border-0">
              <CardContent className="p-4 print:p-2">
                <div className="bg-gradient-to-r from-violet-50 to-sky-50 rounded-xl p-4 print:bg-gray-100">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                    <div>
                      <span className="text-slate-500 text-xs">Class:</span>
                      <p className="font-semibold">{data.class.name} {data.class.name_numeric}</p>
                    </div>
                    <div>
                      <span className="text-slate-500 text-xs">Section:</span>
                      <p className="font-semibold">{data.section?.name || 'All'}</p>
                    </div>
                    <div>
                      <span className="text-slate-500 text-xs">Exam:</span>
                      <p className="font-semibold">{data.exam?.name || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-slate-500 text-xs">Year:</span>
                      <p className="font-semibold">{data.exam?.year || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Marks Table */}
                <div className="overflow-x-auto mt-4">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-800 print:bg-slate-200">
                        <TableHead className="text-xs font-semibold text-slate-50 print:text-slate-800 w-12 text-center">#</TableHead>
                        <TableHead className="text-xs font-semibold text-slate-50 print:text-slate-800 min-w-[180px]">Student Name</TableHead>
                        <TableHead className="text-xs font-semibold text-slate-50 print:text-slate-800 w-16 text-center">ID</TableHead>
                        <TableHead className="text-xs font-semibold text-slate-50 print:text-slate-800 w-16 text-center">Sex</TableHead>
                        {data.subjects.map(s => (
                          <TableHead key={s.subject_id} className="text-xs font-semibold text-slate-50 print:text-slate-800 min-w-[60px] text-center print:text-[10px]">
                            <span className="hidden lg:inline">{s.name.length > 6 ? s.name.substring(0, 6) : s.name}</span>
                            <span className="lg:hidden">{s.name.length > 4 ? s.name.substring(0, 4) : s.name}</span>
                          </TableHead>
                        ))}
                        <TableHead className="text-xs font-semibold text-slate-50 print:text-slate-800 text-center min-w-[60px]">Total</TableHead>
                        <TableHead className="text-xs font-semibold text-slate-50 print:text-slate-800 text-center min-w-[50px]">Avg</TableHead>
                        <TableHead className="text-xs font-semibold text-slate-50 print:text-slate-800 text-center min-w-[50px]">Grade</TableHead>
                        <TableHead className="text-xs font-semibold text-slate-50 print:text-slate-800 text-center min-w-[50px]">Pos</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.students.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5 + data.subjects.length + 4} className="text-center py-16 text-slate-400">
                            <div className="flex flex-col items-center gap-2">
                              <AlertCircle className="w-10 h-10 text-slate-300" />
                              <p className="font-medium">No students found</p>
                              <p className="text-sm">No students enrolled in this class for the selected filters.</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        <>
                          {data.students.map((student, idx) => (
                            <TableRow
                              key={student.student_id}
                              className={`border-b hover:bg-slate-50 print:hover:bg-white ${
                                student.position === 1 ? 'bg-amber-50/50 print:bg-amber-50' :
                                student.position <= 3 ? 'bg-sky-50/30' : ''
                              }`}
                            >
                              <TableCell className="text-sm text-slate-400 text-center">{idx + 1}</TableCell>
                              <TableCell className="font-medium text-sm text-slate-800">
                                {student.name}
                              </TableCell>
                              <TableCell className="text-xs text-slate-500 text-center font-mono">{student.student_code}</TableCell>
                              <TableCell className="text-xs text-slate-500 text-center">
                                {student.sex ? student.sex.charAt(0).toUpperCase() : '—'}
                              </TableCell>
                              {data.subjects.map(s => {
                                const markEntry = student.marks.find(m => m.subject_id === s.subject_id);
                                const score = markEntry?.mark_obtained || 0;
                                const isLow = score > 0 && score < 50;
                                return (
                                  <TableCell
                                    key={s.subject_id}
                                    className={`text-center text-sm font-mono print:text-xs ${
                                      isLow ? 'text-red-600 bg-red-50/50' :
                                      score > 0 ? 'font-semibold text-slate-800' : 'text-slate-300'
                                    }`}
                                  >
                                    {score > 0 ? score : '—'}
                                  </TableCell>
                                );
                              })}
                              <TableCell className="text-center font-bold text-sm text-slate-900 bg-slate-50 print:bg-slate-100">
                                {student.total}
                              </TableCell>
                              <TableCell className={`text-center text-sm font-mono ${
                                student.average >= 50 ? 'text-emerald-600' : student.average > 0 ? 'text-red-600' : 'text-slate-300'
                              }`}>
                                {student.average > 0 ? student.average.toFixed(1) : '—'}
                              </TableCell>
                              <TableCell className="text-center">
                                {student.total > 0 ? (
                                  <Badge variant="outline" className={`text-[10px] print:text-[9px] ${getGradeBadgeColor(student.grade)}`}>
                                    {student.grade}
                                  </Badge>
                                ) : (
                                  <span className="text-slate-300 text-sm">—</span>
                                )}
                              </TableCell>
                              <TableCell className="text-center">
                                {student.total > 0 ? (
                                  <span className={`text-sm ${getPositionBadge(student.position, data.totalStudents)}`}>
                                    {student.position}
                                    {student.position === 1 && <Award className="w-3 h-3 inline ml-0.5 text-amber-500" />}
                                  </span>
                                ) : (
                                  <span className="text-slate-300 text-sm">—</span>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}

                          {/* Averages Row */}
                          <TableRow className="bg-slate-100 font-bold print:bg-slate-200">
                            <TableCell colSpan={4} className="text-center text-sm text-slate-600">
                              Class Average
                            </TableCell>
                            {data.subjects.map(s => {
                              const subjectMarks = data.students
                                .map(st => st.marks.find(m => m.subject_id === s.subject_id))
                                .filter(m => m && m.mark_obtained > 0);
                              const avg = subjectMarks.length > 0
                                ? (subjectMarks.reduce((sum, m) => sum + m.mark_obtained, 0) / subjectMarks.length).toFixed(1)
                                : '—';
                              return (
                                <TableCell key={s.subject_id} className="text-center text-sm text-slate-700 font-mono">
                                  {avg}
                                </TableCell>
                              );
                            })}
                            <TableCell className="text-center text-sm text-slate-700">
                              {data.summary.classAverage}%
                            </TableCell>
                            <TableCell className="text-center text-sm text-slate-400">
                              —
                            </TableCell>
                            <TableCell className="text-center text-sm text-slate-400">
                              —
                            </TableCell>
                            <TableCell className="text-center text-sm text-slate-400">
                              —
                            </TableCell>
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
        {!loading && !data && !loadingInitial && (
          <div className="text-center py-16 text-slate-400">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">Select a class, section and exam to view the marksheet</p>
            <p className="text-sm mt-1">Use the filters above to get started</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
