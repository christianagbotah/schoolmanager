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
  Printer, Download, BarChart3, Trophy, Users, Target, GraduationCap,
  CheckCircle, XCircle, FileBarChart, ChevronRight, Award, Medal,
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

  const handleExportCSV = () => {
    if (!classInfo) return;
    const headers = ['Rank', 'Student', 'Code', ...subjectAverages.map((s) => s.subjectName), 'Average', 'Total'];
    const rows = studentRankings.map((s) => {
      const scores = subjectAverages.map((sub) => {
        const score = s.subjects.find((sc) => sc.subjectId === sub.subjectId);
        return score?.score || 0;
      });
      return [s.rank, s.name, s.studentCode, ...scores, s.average, s.total];
    });
    const subjectRows = [['', '', 'Average', ...subjectAverages.map((s) => s.average), classAverage, '']];
    const passRows = [['', '', 'Pass Rate', ...subjectAverages.map((s) => `${s.passRate}%`), `${overallPassRate}%`, '']];
    const csv = [headers, ...rows, ['', ''], ['Subject Averages'], headers, subjectRows, passRows].map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `termly-report-${classInfo.name}-${term || 'all'}-${year || 'all'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Termly report exported as CSV');
  };

  const maxSubjectAvg = Math.max(...subjectAverages.map((s) => s.average), 100);

  return (
    <DashboardLayout>
      <div className="space-y-6 print:p-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center flex-shrink-0">
              <FileBarChart className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Termly Report</h1>
              <p className="text-sm text-slate-500 mt-0.5">Subject averages, class rankings, and pass rates</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleExportCSV} className="min-h-[44px]" disabled={!classId}>
              <Download className="w-4 h-4 mr-2" /> Export
            </Button>
            <Button variant="outline" onClick={handlePrint} className="min-h-[44px]" disabled={!classId}>
              <Printer className="w-4 h-4 mr-2" /> Print
            </Button>
          </div>
        </div>

        {/* Print header */}
        <div className="hidden print:block text-center mb-6">
          <h1 className="text-xl font-bold">Termly Report \u2014 {classInfo?.name}</h1>
          <p className="text-sm text-slate-500">Term: {term || 'All'} | Year: {year || 'All'} | Generated: {new Date().toLocaleDateString()}</p>
        </div>

        {/* Filters */}
        <Card className="print:hidden border-slate-200/60">
          <CardContent className="p-4">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-slate-400" />
                <span className="text-sm font-medium text-slate-700">Filters</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-500 mb-1 block">Class *</label>
                  <Select value={classId} onValueChange={setClassId}>
                    <SelectTrigger className="min-h-[44px]"><SelectValue placeholder="Select class" /></SelectTrigger>
                    <SelectContent>
                      {classes.map((c) => <SelectItem key={c.class_id} value={String(c.class_id)}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500 mb-1 block">Term</label>
                  <Select value={term} onValueChange={(v) => v === '__all__' ? setTerm('') : setTerm(v)}>
                    <SelectTrigger className="min-h-[44px]"><SelectValue placeholder="All Terms" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">All Terms</SelectItem>
                      <SelectItem value="Term 1">Term 1</SelectItem>
                      <SelectItem value="Term 2">Term 2</SelectItem>
                      <SelectItem value="Term 3">Term 3</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500 mb-1 block">Year</label>
                  <Select value={year} onValueChange={(v) => v === '__all__' ? setYear('') : setYear(v)}>
                    <SelectTrigger className="min-h-[44px]"><SelectValue placeholder="All Years" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">All Years</SelectItem>
                      <SelectItem value="2025/2026">2025/2026</SelectItem>
                      <SelectItem value="2024/2025">2024/2025</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Empty State: No class selected */}
        {!classId && !loading && (
          <Card className="border-slate-200/60">
            <CardContent className="py-16 text-center">
              <div className="w-16 h-16 rounded-2xl bg-violet-50 flex items-center justify-center mx-auto mb-4">
                <GraduationCap className="w-8 h-8 text-violet-300" />
              </div>
              <p className="text-slate-600 font-medium">Select a class to view the termly report</p>
              <p className="text-sm text-slate-400 mt-1">Choose a class from the filter above to see detailed academic performance</p>
            </CardContent>
          </Card>
        )}

        {/* Loading State */}
        {classId && loading && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="border-l-4 border-l-slate-200"><CardContent className="p-4"><Skeleton className="h-16 w-full" /></CardContent></Card>
              ))}
            </div>
            <Skeleton className="h-64 w-full rounded-xl" />
            <Skeleton className="h-80 w-full rounded-xl" />
          </div>
        )}

        {/* Report Content */}
        {classId && !loading && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="border-l-4 border-l-emerald-500 hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                      <Target className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-slate-500 font-medium">Class Average</p>
                      <p className="text-xl font-bold text-slate-900">{classAverage}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-sky-500 hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-sky-50 flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-5 h-5 text-sky-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-slate-500 font-medium">Pass Rate</p>
                      <p className="text-xl font-bold text-slate-900">{overallPassRate}%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-violet-500 hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-violet-50 flex items-center justify-center flex-shrink-0">
                      <Users className="w-5 h-5 text-violet-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-slate-500 font-medium">Total Students</p>
                      <p className="text-xl font-bold text-slate-900">{totalStudents}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-amber-500 hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
                      <Trophy className="w-5 h-5 text-amber-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-slate-500 font-medium">Top Score</p>
                      <p className="text-xl font-bold text-slate-900">{studentRankings.length > 0 ? studentRankings[0].average : '-'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Top 3 Students Highlight */}
            {studentRankings.length >= 3 && (
              <div className="grid grid-cols-3 gap-3">
                {[1, 2, 3].map((rank) => {
                  const student = studentRankings[rank - 1];
                  if (!student) return null;
                  const isFirst = rank === 1;
                  return (
                    <Card key={rank} className={`border-slate-200/60 ${isFirst ? 'sm:col-span-1' : ''} ${isFirst ? 'bg-gradient-to-br from-amber-50 to-white border-amber-200' : ''}`}>
                      <CardContent className="p-4 text-center">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2 ${
                          rank === 1 ? 'bg-amber-100 text-amber-700' : rank === 2 ? 'bg-slate-200 text-slate-600' : 'bg-orange-100 text-orange-700'
                        }`}>
                          {rank === 1 ? <Award className="w-5 h-5" /> : rank === 2 ? <Medal className="w-5 h-5" /> : <Trophy className="w-5 h-5" />}
                        </div>
                        <p className="text-sm font-semibold text-slate-900 truncate">{student.name}</p>
                        <p className="text-xs text-slate-400">{student.studentCode}</p>
                        <Badge className={`mt-2 ${student.average >= 70 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                          {student.average} avg
                        </Badge>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            {/* Subject Averages Chart */}
            <Card className="border-slate-200/60">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-emerald-600" /> Class Average by Subject
                </CardTitle>
                <CardDescription>Subject performance with pass rate indicators</CardDescription>
              </CardHeader>
              <CardContent className="p-4">
                {subjectAverages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                    <BarChart3 className="w-10 h-10 mb-2 opacity-40" />
                    <p className="text-sm">No subject data available</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {subjectAverages.map((sub) => (
                      <div key={sub.subjectId} className="flex items-center gap-3">
                        <span className="text-xs font-medium text-slate-600 w-24 truncate flex-shrink-0" title={sub.subjectName}>{sub.subjectName}</span>
                        <div className="flex-1 h-6 bg-slate-100 rounded-full overflow-hidden relative">
                          <div
                            className={`h-full rounded-full transition-all ${sub.average >= 70 ? 'bg-emerald-500' : sub.average >= 50 ? 'bg-amber-500' : 'bg-red-400'}`}
                            style={{ width: `${Math.max((sub.average / maxSubjectAvg) * 100, 2)}%` }}
                          />
                          <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-slate-700">
                            {sub.average}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 w-16 justify-end flex-shrink-0">
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

            {/* Student Ranking Table - Desktop / Cards Mobile */}
            <Card className="border-slate-200/60">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-600" /> Student Rankings
                </CardTitle>
                <CardDescription>Students ranked by average performance</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {studentRankings.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                    <Trophy className="w-10 h-10 mb-2 opacity-40" />
                    <p className="text-sm">No ranking data available</p>
                  </div>
                ) : (
                  <>
                    {/* Desktop Table */}
                    <div className="hidden lg:block max-h-[500px] overflow-y-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-slate-50">
                            <TableHead className="w-12">Rank</TableHead>
                            <TableHead>Student</TableHead>
                            {subjectAverages.slice(0, 8).map((sub) => (
                              <TableHead key={sub.subjectId} className="text-center min-w-[56px]">
                                <span className="text-[9px] leading-tight block truncate max-w-[56px]">{sub.subjectName}</span>
                              </TableHead>
                            ))}
                            <TableHead className="text-right">Average</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {studentRankings.map((student) => (
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

                    {/* Mobile Cards */}
                    <div className="lg:hidden divide-y max-h-[500px] overflow-y-auto">
                      {studentRankings.map((student) => (
                        <div key={student.studentId} className="p-4 min-h-[60px]">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                                student.rank === 1 ? 'bg-amber-100 text-amber-700' :
                                student.rank === 2 ? 'bg-slate-200 text-slate-600' :
                                student.rank === 3 ? 'bg-orange-100 text-orange-700' :
                                'bg-slate-100 text-slate-500'
                              }`}>{student.rank}</div>
                              <div>
                                <p className="text-sm font-medium text-slate-900">{student.name}</p>
                                <p className="text-xs text-slate-400">{student.studentCode}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className={student.average >= 70 ? 'bg-emerald-100 text-emerald-700' : student.average >= 50 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}>
                                {student.average}
                              </Badge>
                              <ChevronRight className="w-4 h-4 text-slate-300" />
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-1.5 ml-10">
                            {student.subjects.slice(0, 6).map((s) => (
                              <span key={s.subjectId} className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-slate-50 text-slate-600">
                                <span className="truncate max-w-[60px]">{s.subjectName}</span>
                                <span className={`font-medium ${s.score >= 70 ? 'text-emerald-600' : s.score >= 50 ? 'text-amber-600' : 'text-red-500'}`}>{s.score}</span>
                              </span>
                            ))}
                            {student.subjects.length > 6 && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-50 text-slate-400">+{student.subjects.length - 6} more</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Footer */}
                    <div className="px-4 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
                      <span className="text-xs text-slate-500">{studentRankings.length} students</span>
                      <span className="text-xs text-slate-500">
                        Class Average: <strong>{classAverage}</strong> | Pass Rate: <strong>{overallPassRate}%</strong>
                      </span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Pass Rate per Subject */}
            <Card className="border-slate-200/60">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Target className="w-4 h-4 text-sky-600" /> Pass Rate per Subject
                </CardTitle>
                <CardDescription>Percentage of students scoring 50% or above</CardDescription>
              </CardHeader>
              <CardContent className="p-4">
                {subjectAverages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                    <Target className="w-10 h-10 mb-2 opacity-40" />
                    <p className="text-sm">No pass rate data available</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {subjectAverages.map((sub) => (
                      <div key={sub.subjectId} className="flex items-center gap-3">
                        <span className="text-xs font-medium text-slate-600 w-24 truncate flex-shrink-0" title={sub.subjectName}>{sub.subjectName}</span>
                        <div className="flex-1 h-4 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${sub.passRate >= 80 ? 'bg-emerald-500' : sub.passRate >= 60 ? 'bg-amber-500' : 'bg-red-400'}`}
                            style={{ width: `${Math.max(sub.passRate, 1)}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold w-12 text-right flex-shrink-0">{sub.passRate}%</span>
                        <span className="text-[10px] text-slate-400 w-20 text-right flex-shrink-0">{sub.passedCount}/{sub.totalStudents}</span>
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
