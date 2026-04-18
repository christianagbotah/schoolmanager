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
  Printer, BarChart3, Trophy, Users, Target, GraduationCap,
  CheckCircle, XCircle,
} from 'lucide-react';

interface SubjectAverage {
  subjectId: number; subjectName: string; average: number; highest: number;
  lowest: number; passRate: number; totalStudents: number; passedCount: number;
}

interface StudentRanking {
  rank: number; studentId: number; name: string; studentCode: string;
  average: number; total: number; subjects: { subjectId: number; subjectName: string; score: number }[];
}

interface ClassInfo { name: string; name_numeric: number; }

export default function TermlyReportPage() {
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<{ class_id: number; name: string }[]>([]);
  const [classId, setClassId] = useState('');
  const [term, setTerm] = useState('');
  const [year, setYear] = useState('');
  const [classInfo, setClassInfo] = useState<ClassInfo | null>(null);
  const [classAverage, setClassAverage] = useState(0);
  const [overallPassRate, setOverallPassRate] = useState(0);
  const [subjectAverages, setSubjectAverages] = useState<SubjectAverage[]>([]);
  const [studentRankings, setStudentRankings] = useState<StudentRanking[]>([]);
  const [totalStudents, setTotalStudents] = useState(0);

  const fetchClasses = useCallback(async () => {
    try {
      const res = await fetch('/api/classes');
      const data = await res.json();
      setClasses(Array.isArray(data) ? data : []);
    } catch { /* silent */ }
  }, []);

  const fetchReport = useCallback(async () => {
    if (!classId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams({ classId });
      if (term) params.set('term', term);
      if (year) params.set('year', year);

      const res = await fetch(`/api/admin/reports/termly?${params}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setClassInfo(data.classInfo);
      setClassAverage(data.classAverage);
      setOverallPassRate(data.overallPassRate);
      setSubjectAverages(data.subjectAverages || []);
      setStudentRankings(data.studentRankings || []);
      setTotalStudents(data.totalStudents || 0);
    } catch {
      toast.error('Failed to load termly report');
    }
    setLoading(false);
  }, [classId, term, year]);

  useEffect(() => { fetchClasses(); }, [fetchClasses]);
  useEffect(() => { fetchReport(); }, [fetchReport]);

  const handlePrint = () => window.print();

  const maxSubjectAvg = Math.max(...subjectAverages.map((s) => s.average), 100);

  return (
    <DashboardLayout>
      <div className="space-y-6 print:p-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Termly Report</h1>
            <p className="text-sm text-slate-500 mt-1">Subject averages, class rankings, and pass rates</p>
          </div>
          <Button variant="outline" onClick={handlePrint} className="min-h-[44px]">
            <Printer className="w-4 h-4 mr-2" /> Print Report
          </Button>
        </div>

        {/* Print header */}
        <div className="hidden print:block text-center mb-6">
          <h1 className="text-xl font-bold">Termly Report — {classInfo?.name}</h1>
          <p className="text-sm text-slate-500">Term: {term || 'All'} | Year: {year || 'All'} | Generated: {new Date().toLocaleDateString()}</p>
        </div>

        {/* Filters */}
        <Card className="print:hidden border-slate-200/60">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Select value={classId} onValueChange={setClassId}>
                  <SelectTrigger className="h-10"><SelectValue placeholder="Select class" /></SelectTrigger>
                  <SelectContent>
                    {classes.map((c) => <SelectItem key={c.class_id} value={String(c.class_id)}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={term} onValueChange={(v) => v === '__all__' ? setTerm('') : setTerm(v)}>
                  <SelectTrigger className="h-10"><SelectValue placeholder="All Terms" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">All Terms</SelectItem>
                    <SelectItem value="Term 1">Term 1</SelectItem>
                    <SelectItem value="Term 2">Term 2</SelectItem>
                    <SelectItem value="Term 3">Term 3</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={year} onValueChange={(v) => v === '__all__' ? setYear('') : setYear(v)}>
                  <SelectTrigger className="h-10"><SelectValue placeholder="All Years" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">All Years</SelectItem>
                    <SelectItem value="2025/2026">2025/2026</SelectItem>
                    <SelectItem value="2024/2025">2024/2025</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {!classId ? (
          <Card className="border-slate-200/60"><CardContent className="py-16 text-center">
            <GraduationCap className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p className="text-slate-500">Select a class to view the termly report</p>
          </CardContent></Card>
        ) : loading ? (
          <div className="space-y-4">
            <Skeleton className="h-24" />
            <Skeleton className="h-64" />
          </div>
        ) : (
          <>
            {/* Summary */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="border-l-4 border-l-emerald-500">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center"><Target className="w-5 h-5 text-emerald-600" /></div>
                    <div>
                      <p className="text-xs text-slate-500 font-medium">Class Average</p>
                      <p className="text-xl font-bold text-slate-900">{classAverage}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-sky-500">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-sky-50 flex items-center justify-center"><CheckCircle className="w-5 h-5 text-sky-600" /></div>
                    <div>
                      <p className="text-xs text-slate-500 font-medium">Pass Rate</p>
                      <p className="text-xl font-bold text-slate-900">{overallPassRate}%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-violet-500">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-violet-50 flex items-center justify-center"><Users className="w-5 h-5 text-violet-600" /></div>
                    <div>
                      <p className="text-xs text-slate-500 font-medium">Total Students</p>
                      <p className="text-xl font-bold text-slate-900">{totalStudents}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-amber-500">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center"><Trophy className="w-5 h-5 text-amber-600" /></div>
                    <div>
                      <p className="text-xs text-slate-500 font-medium">Top Score</p>
                      <p className="text-xl font-bold text-slate-900">{studentRankings.length > 0 ? studentRankings[0].average : '-'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Subject Averages Chart */}
            <Card className="border-slate-200/60">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2"><BarChart3 className="w-4 h-4 text-emerald-600" /> Class Average by Subject</CardTitle>
                <CardDescription>Subject performance with pass rate indicators</CardDescription>
              </CardHeader>
              <CardContent className="p-4">
                {subjectAverages.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-8">No subject data available</p>
                ) : (
                  <div className="space-y-3">
                    {subjectAverages.map((sub) => (
                      <div key={sub.subjectId} className="flex items-center gap-3">
                        <span className="text-xs font-medium text-slate-600 w-24 truncate" title={sub.subjectName}>{sub.subjectName}</span>
                        <div className="flex-1 h-6 bg-slate-100 rounded-full overflow-hidden relative">
                          <div
                            className={`h-full rounded-full transition-all ${sub.average >= 70 ? 'bg-emerald-500' : sub.average >= 50 ? 'bg-amber-500' : 'bg-red-400'}`}
                            style={{ width: `${Math.max((sub.average / maxSubjectAvg) * 100, 2)}%` }}
                          />
                          <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-slate-700">
                            {sub.average}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 w-16 justify-end">
                          {sub.passRate >= 70 ? (
                            <CheckCircle className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <XCircle className="w-3 h-3 text-red-500" />
                          )}
                          <span className={`text-[10px] font-medium ${sub.passRate >= 70 ? 'text-emerald-700' : 'text-red-600'}`}>{sub.passRate}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Student Ranking Table */}
            <Card className="border-slate-200/60">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2"><Trophy className="w-4 h-4 text-amber-600" /> Student Rankings</CardTitle>
                <CardDescription>Students ranked by average performance</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-[500px] overflow-y-auto">
                  <Table>
                    <TableHeader><TableRow className="bg-slate-50">
                      <TableHead className="w-12">Rank</TableHead>
                      <TableHead>Student</TableHead>
                      {subjectAverages.slice(0, 8).map((sub) => (
                        <TableHead key={sub.subjectId} className="text-center min-w-[56px]">
                          <span className="text-[9px] leading-tight block truncate max-w-[56px]">{sub.subjectName}</span>
                        </TableHead>
                      ))}
                      <TableHead className="text-right">Average</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow></TableHeader>
                    <TableBody>
                      {studentRankings.length === 0 ? (
                        <TableRow><TableCell colSpan={4 + Math.min(subjectAverages.length, 8)} className="text-center py-8 text-sm text-slate-400">No ranking data</TableCell></TableRow>
                      ) : studentRankings.map((student) => (
                        <TableRow key={student.studentId}>
                          <TableCell>
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                              student.rank === 1 ? 'bg-amber-100 text-amber-700' :
                              student.rank === 2 ? 'bg-slate-200 text-slate-600' :
                              student.rank === 3 ? 'bg-orange-100 text-orange-700' :
                              'text-slate-400'
                            }`}>{student.rank}</div>
                          </TableCell>
                          <TableCell>
                            <p className="text-sm font-medium">{student.name}</p>
                            <p className="text-xs text-slate-400">{student.studentCode}</p>
                          </TableCell>
                          {subjectAverages.slice(0, 8).map((sub) => {
                            const score = student.subjects.find((s) => s.subjectId === sub.subjectId);
                            const val = score?.score || 0;
                            return (
                              <TableCell key={sub.subjectId} className="text-center">
                                <span className={`text-sm ${val >= 70 ? 'text-emerald-700 font-medium' : val >= 50 ? 'text-amber-700' : val > 0 ? 'text-red-600' : 'text-slate-300'}`}>
                                  {val > 0 ? val : '-'}
                                </span>
                              </TableCell>
                            );
                          })}
                          <TableCell className="text-right">
                            <Badge className={student.average >= 70 ? 'bg-emerald-100 text-emerald-700' : student.average >= 50 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}>
                              {student.average}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right text-sm font-mono text-slate-600">{student.total}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                {studentRankings.length > 0 && (
                  <div className="px-4 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
                    <span className="text-xs text-slate-500">{studentRankings.length} students</span>
                    <span className="text-xs text-slate-500">
                      Class Average: <strong>{classAverage}</strong> | Pass Rate: <strong>{overallPassRate}%</strong>
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Pass Rate per Subject */}
            <Card className="border-slate-200/60">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2"><Target className="w-4 h-4 text-sky-600" /> Pass Rate per Subject</CardTitle>
                <CardDescription>Percentage of students scoring 50% or above (50% threshold)</CardDescription>
              </CardHeader>
              <CardContent className="p-4">
                {subjectAverages.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-8">No data</p>
                ) : (
                  <div className="space-y-2">
                    {subjectAverages.map((sub) => (
                      <div key={sub.subjectId} className="flex items-center gap-3">
                        <span className="text-xs font-medium text-slate-600 w-24 truncate" title={sub.subjectName}>{sub.subjectName}</span>
                        <div className="flex-1 h-4 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${sub.passRate >= 80 ? 'bg-emerald-500' : sub.passRate >= 60 ? 'bg-amber-500' : 'bg-red-400'}`}
                            style={{ width: `${Math.max(sub.passRate, 1)}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold w-12 text-right">{sub.passRate}%</span>
                        <span className="text-[10px] text-slate-400 w-20 text-right">{sub.passedCount}/{sub.totalStudents}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
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
