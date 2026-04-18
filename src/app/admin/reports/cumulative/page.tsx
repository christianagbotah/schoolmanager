'use client';

import { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Printer, TrendingUp, TrendingDown, Minus, BarChart3, Users,
  GraduationCap, ArrowUpRight, ArrowDownRight, Equal,
} from 'lucide-react';

interface SubjectScore { subjectId: number; subjectName: string; average: number; trend: 'up' | 'down' | 'stable' | 'none'; }
interface TermAvg { term: string; average: number; }
interface StudentData {
  studentId: number; name: string; studentCode: string;
  termAverages: TermAvg[];
  subjectScores: SubjectScore[];
  cumulativeAverage: number;
}

function TrendIcon({ trend }: { trend: string }) {
  if (trend === 'up') return <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />;
  if (trend === 'down') return <ArrowDownRight className="w-3.5 h-3.5 text-red-500" />;
  if (trend === 'stable') return <Equal className="w-3.5 h-3.5 text-slate-400" />;
  return <Minus className="w-3.5 h-3.5 text-slate-300" />;
}

export default function CumulativeReportPage() {
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<StudentData[]>([]);
  const [subjects, setSubjects] = useState<{ subjectId: number; subjectName: string }[]>([]);
  const [gradeDistribution, setGradeDistribution] = useState<Record<string, number>>({});
  const [classes, setClasses] = useState<{ class_id: number; name: string }[]>([]);
  const [allStudents, setAllStudents] = useState<{ student_id: number; name: string; student_code: string }[]>([]);
  const [filterType, setFilterType] = useState<'class' | 'student'>('class');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');

  const fetchClasses = useCallback(async () => {
    try {
      const res = await fetch('/api/classes');
      const data = await res.json();
      setClasses(Array.isArray(data) ? data : []);
    } catch { /* silent */ }
  }, []);

  const fetchStudentsForClass = useCallback(async (classId: string) => {
    if (!classId) { setAllStudents([]); return; }
    try {
      const res = await fetch(`/api/students?classId=${classId}&limit=100`);
      const data = await res.json();
      setAllStudents(Array.isArray(data.students) ? data.students : Array.isArray(data) ? data : []);
    } catch { setAllStudents([]); }
  }, []);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterType === 'class' && selectedClass) params.set('classId', selectedClass);
      else if (filterType === 'student' && selectedStudent) params.set('studentId', selectedStudent);
      else {
        setStudents([]);
        setSubjects([]);
        setGradeDistribution({});
        setLoading(false);
        return;
      }

      const res = await fetch(`/api/admin/reports/cumulative?${params}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setStudents(data.students || []);
      setSubjects(data.subjects || []);
      setGradeDistribution(data.gradeDistribution || {});
    } catch {
      toast.error('Failed to load cumulative report');
    }
    setLoading(false);
  }, [filterType, selectedClass, selectedStudent]);

  useEffect(() => { fetchClasses(); }, [fetchClasses]);
  useEffect(() => { if (filterType === 'class') fetchStudentsForClass(selectedClass); }, [filterType, selectedClass, fetchStudentsForClass]);
  useEffect(() => { fetchReport(); }, [fetchReport]);

  const handlePrint = () => window.print();

  const gradeColors: Record<string, string> = { A: 'bg-emerald-500', B: 'bg-sky-500', C: 'bg-amber-500', D: 'bg-orange-500', F: 'bg-red-500' };
  const totalGrades = Object.values(gradeDistribution).reduce((s, v) => s + v, 0) || 1;

  return (
    <DashboardLayout>
      <div className="space-y-6 print:p-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Cumulative Student Performance</h1>
            <p className="text-sm text-slate-500 mt-1">Subject-wise cumulative scores with trend indicators</p>
          </div>
          <Button variant="outline" onClick={handlePrint} className="min-h-[44px]">
            <Printer className="w-4 h-4 mr-2" /> Print Report
          </Button>
        </div>

        {/* Print header */}
        <div className="hidden print:block text-center mb-6">
          <h1 className="text-xl font-bold">Cumulative Performance Report</h1>
          <p className="text-sm text-slate-500">Generated on {new Date().toLocaleDateString()}</p>
        </div>

        {/* Filters */}
        <Card className="print:hidden border-slate-200/60">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex gap-2">
                <Select value={filterType} onValueChange={(v) => setFilterType(v as 'class' | 'student')}>
                  <SelectTrigger className="w-36 h-10"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="class">By Class</SelectItem>
                    <SelectItem value="student">By Student</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {filterType === 'class' ? (
                <Select value={selectedClass} onValueChange={(v) => v === '__all__' ? setSelectedClass('') : setSelectedClass(v)}>
                  <SelectTrigger className="h-10 flex-1"><SelectValue placeholder="Select class" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">All Classes</SelectItem>
                    {classes.map((c) => <SelectItem key={c.class_id} value={String(c.class_id)}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              ) : (
                <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                  <SelectTrigger className="h-10 flex-1"><SelectValue placeholder="Select student" /></SelectTrigger>
                  <SelectContent>
                    {allStudents.map((s) => <SelectItem key={s.student_id} value={String(s.student_id)}>{s.name} ({s.student_code})</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Content */}
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-64" />
            <Skeleton className="h-48" />
          </div>
        ) : students.length === 0 ? (
          <Card className="border-slate-200/60"><CardContent className="py-16 text-center">
            <GraduationCap className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p className="text-slate-500">Select a class or student to view cumulative performance data</p>
          </CardContent></Card>
        ) : (
          <>
            {/* Subject-wise scores table */}
            <Card className="border-slate-200/60">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-emerald-600" /> Subject-wise Cumulative Scores
                </CardTitle>
                <CardDescription>Average scores per subject with performance trend</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-96 overflow-y-auto">
                  <Table>
                    <TableHeader><TableRow className="bg-slate-50">
                      <TableHead className="min-w-[44px]">#</TableHead>
                      <TableHead>Student</TableHead>
                      {subjects.map((sub) => (
                        <TableHead key={sub.subjectId} className="text-center min-w-[80px]">
                          <span className="text-[10px] leading-tight block">{sub.subjectName}</span>
                        </TableHead>
                      ))}
                      <TableHead className="text-right">Cumulative</TableHead>
                    </TableRow></TableHeader>
                    <TableBody>
                      {students.map((student, idx) => (
                        <TableRow key={student.studentId}>
                          <TableCell className="text-xs text-slate-400">{idx + 1}</TableCell>
                          <TableCell>
                            <p className="text-sm font-medium">{student.name}</p>
                            <p className="text-xs text-slate-400">{student.studentCode}</p>
                          </TableCell>
                          {subjects.map((sub) => {
                            const score = student.subjectScores.find((s) => s.subjectId === sub.subjectId);
                            const avg = score?.average || 0;
                            const trend = score?.trend || 'none';
                            return (
                              <TableCell key={sub.subjectId} className="text-center">
                                <div className="flex items-center justify-center gap-0.5">
                                  <span className={`text-sm font-medium ${avg >= 70 ? 'text-emerald-700' : avg >= 50 ? 'text-amber-700' : avg > 0 ? 'text-red-600' : 'text-slate-300'}`}>
                                    {avg > 0 ? avg : '-'}
                                  </span>
                                  {avg > 0 && <TrendIcon trend={trend} />}
                                </div>
                              </TableCell>
                            );
                          })}
                          <TableCell className="text-right">
                            <Badge className={student.cumulativeAverage >= 70 ? 'bg-emerald-100 text-emerald-700' : student.cumulativeAverage >= 50 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}>
                              {student.cumulativeAverage}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Grade Distribution */}
            {Object.keys(gradeDistribution).length > 0 && (
              <Card className="border-slate-200/60">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-amber-600" /> Grade Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    {Object.entries(gradeDistribution)
                      .sort((a, b) => b[0].localeCompare(a[0]))
                      .map(([grade, count]) => {
                        const pct = (count / totalGrades) * 100;
                        return (
                          <div key={grade} className="flex items-center gap-3">
                            <span className="text-sm font-bold w-6 text-center">{grade}</span>
                            <div className="flex-1 h-5 bg-slate-100 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${gradeColors[grade] || 'bg-slate-400'} transition-all`} style={{ width: `${Math.max(pct, 1)}%` }} />
                            </div>
                            <span className="text-xs text-slate-500 w-16 text-right">{count} ({pct.toFixed(0)}%)</span>
                          </div>
                        );
                      })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Individual Student Term Trends */}
            {students.length <= 5 && students.map((student) => {
              if (student.termAverages.length === 0) return null;
              return (
                <Card key={student.studentId} className="border-slate-200/60">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Users className="w-4 h-4 text-violet-600" /> {student.name} — Term Progression
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="flex items-end gap-3 h-32">
                      {student.termAverages.map((t, i) => {
                        const height = 100 > 0 ? (t.average / 100) * 100 : 0;
                        const color = t.average >= 70 ? 'bg-emerald-500' : t.average >= 50 ? 'bg-amber-500' : 'bg-red-400';
                        return (
                          <div key={i} className="flex-1 flex flex-col items-center gap-1">
                            <span className="text-[10px] font-medium">{t.average}</span>
                            <div className={`w-full rounded-t-md transition-all ${color}`} style={{ height: `${Math.max(height, 4)}%` }}>
                              &nbsp;
                            </div>
                            <span className="text-[9px] text-slate-400">{t.term}</span>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </>
        )}
      </div>

      <style jsx global>{`
        @media print {
          .print\\:hidden { display: none !important; }
          .print\\:block { display: block !important; }
          .print\\:p-8 { padding: 2rem; }
        }
      `}</style>
    </DashboardLayout>
  );
}
