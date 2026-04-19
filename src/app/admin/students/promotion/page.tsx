'use client';

import { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import {
  ArrowLeft, ArrowUpCircle, Users, CheckCircle, AlertTriangle,
  Info, Loader2, ChevronRight, GraduationCap, Eye,
} from 'lucide-react';
import Link from 'next/link';

const CLASS_GROUPS = ['CRECHE', 'NURSERY', 'KG', 'BASIC', 'JHS'];

interface ClassItem {
  class_id: number;
  name: string;
  name_numeric: number;
  category: string;
}

interface SectionItem {
  section_id: number;
  name: string;
}

interface PromotionStudent {
  student_id: number;
  student_code: string;
  name: string;
  sex: string;
  section_id: number;
  section_name: string;
  already_enrolled: boolean;
}

interface PromotionData {
  fromClass: { class_id: number; name: string; name_numeric: number; category: string };
  toClass: { class_id: number; name: string; name_numeric: number; category: string };
  toSections: SectionItem[];
  students: PromotionStudent[];
  total: number;
  alreadyEnrolled: number;
  eligible: number;
}

export default function PromotionPage() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [fromClassId, setFromClassId] = useState('');
  const [toClassId, setToClassId] = useState('');
  const [fromSectionId, setFromSectionId] = useState('');
  const [runningYear, setRunningYear] = useState(() => {
    const y = new Date().getFullYear();
    return `${y}-${y + 1}`;
  });
  const [term, setTerm] = useState('3');
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [promotionData, setPromotionData] = useState<PromotionData | null>(null);
  const [promoting, setPromoting] = useState(false);
  const [promoted, setPromoted] = useState(false);
  // Per-student target class selection (can promote or repeat)
  const [studentTargets, setStudentTargets] = useState<Record<number, number>>({});
  const [fromSections, setFromSections] = useState<SectionItem[]>([]);
  const [step, setStep] = useState(1);

  useEffect(() => {
    fetch('/api/admin/classes?limit=200')
      .then(r => r.json())
      .then(d => setClasses(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, []);

  // Load sections when from class changes
  useEffect(() => {
    if (!fromClassId) {
      setFromSections([]);
      return;
    }
    fetch(`/api/admin/sections?class_id=${fromClassId}`)
      .then(r => r.json())
      .then(d => setFromSections(Array.isArray(d) ? d : []))
      .catch(() => setFromSections([]));
  }, [fromClassId]);

  const fromClass = classes.find(c => String(c.class_id) === fromClassId);
  const toClass = classes.find(c => String(c.class_id) === toClassId);
  const fromGroup = fromClass?.category || '';
  const toGroupClasses = fromGroup ? classes.filter(c => c.category === fromGroup).sort((a, b) => a.name_numeric - b.name_numeric) : [];

  // Compute promotion year
  const runningYearParts = runningYear.split('-');
  const nextYear = runningYearParts[1] ? `${runningYearParts[1]}-${parseInt(runningYearParts[1]) + 1}` : '';

  const fetchPromotionStudents = useCallback(async () => {
    if (!fromClassId || !toClassId) {
      toast.error('Select both source and target classes');
      return;
    }
    if (fromClassId === toClassId) {
      toast.error('Source and target classes cannot be the same');
      return;
    }
    setLoadingStudents(true);
    setStep(2);
    try {
      const params = new URLSearchParams({
        fromClassId,
        toClassId,
        runningYear,
        promotionYear: nextYear,
        term,
      });
      const res = await fetch(`/api/admin/students/promotion?${params}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setPromotionData(data);
      // Initialize target selections: default all to target class
      const targets: Record<number, number> = {};
      data.students.forEach((s: PromotionStudent) => {
        targets[s.student_id] = parseInt(toClassId);
      });
      setStudentTargets(targets);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoadingStudents(false);
    }
  }, [fromClassId, toClassId, runningYear, nextYear, term]);

  const handlePromote = async () => {
    if (!promotionData) return;
    const promotions = promotionData.students
      .filter(s => !s.already_enrolled)
      .map(s => ({
        student_id: s.student_id,
        target_class_id: studentTargets[s.student_id] || parseInt(toClassId),
        section_id: 0,
      }));

    if (promotions.length === 0) {
      toast.error('No eligible students to promote');
      return;
    }

    setPromoting(true);
    try {
      const res = await fetch('/api/admin/students/promotion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromClassId,
          runningYear,
          promotionYear: nextYear,
          term,
          promotions,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setPromoted(true);
      setStep(3);
      toast.success(data.message);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setPromoting(false);
    }
  };

  const groupClasses = (g: string) => classes.filter(c => c.category === g).sort((a, b) => a.name_numeric - b.name_numeric);

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/students"><ArrowLeft className="w-5 h-5" /></Link>
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Student Promotion</h1>
            <p className="text-sm text-slate-500 mt-1">Promote students from one class to the next session</p>
          </div>
          {step > 1 && (
            <Button variant="outline" size="sm" onClick={() => { setStep(1); setPromotionData(null); setPromoted(false); }}>
              Reset
            </Button>
          )}
        </div>

        {/* Step Indicator */}
        <div className="flex items-center gap-2">
          {['Select Classes', 'Manage Students', 'Complete'].map((label, i) => (
            <div key={i} className="flex items-center gap-2 flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                step > i + 1 ? 'bg-emerald-600 text-white' : step === i + 1 ? 'bg-violet-600 text-white' : 'bg-slate-200 text-slate-500'
              }`}>
                {step > i + 1 ? <CheckCircle className="w-4 h-4" /> : i + 1}
              </div>
              <span className={`text-sm hidden sm:block ${step === i + 1 ? 'text-slate-900 font-medium' : 'text-slate-400'}`}>{label}</span>
              {i < 2 && <ChevronRight className="w-4 h-4 text-slate-300 hidden sm:block" />}
            </div>
          ))}
        </div>

        {/* Success Card */}
        {promoted && (
          <Card className="border-emerald-200 bg-emerald-50">
            <CardContent className="p-6 text-center">
              <CheckCircle className="w-12 h-12 text-emerald-600 mx-auto mb-3" />
              <h3 className="font-semibold text-emerald-800">Promotion Complete</h3>
              <p className="text-sm text-emerald-600 mt-1">
                Students have been promoted to {promotionData?.toClass?.name || 'target class'} for the {nextYear} session.
              </p>
              <Button variant="outline" className="mt-4" onClick={() => { setPromoted(false); setStep(1); setPromotionData(null); }}>
                Promote More Students
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 1: Class Selection */}
        {step === 1 && (
          <>
            {/* Info Banner */}
            <Alert className="bg-sky-50 border-sky-200">
              <Info className="h-4 w-4 text-sky-600" />
              <AlertDescription className="text-sky-800 text-sm">
                Promoting students will create a new enrollment for the next session ({nextYear}).
                Each student can be promoted to the target class or retained in the current class.
              </AlertDescription>
            </Alert>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-violet-600" />
                  Promotion Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Academic Year Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-slate-500">Current Session</Label>
                    <Input value={runningYear} onChange={e => setRunningYear(e.target.value)} className="mt-1" disabled />
                  </div>
                  <div>
                    <Label className="text-xs text-slate-500">Promote To Session</Label>
                    <Input value={nextYear} className="mt-1 bg-slate-50" disabled />
                  </div>
                </div>

                {/* Class Selection Row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-xs text-slate-500">Source Class *</Label>
                    <Select value={fromClassId} onValueChange={v => { setFromClassId(v); setToClassId(''); setFromSectionId(''); }}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select source class" />
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
                  <div>
                    <Label className="text-xs text-slate-500">Section</Label>
                    <Select value={fromSectionId} onValueChange={v => setFromSectionId(v === '__all__' ? '' : v)}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="All sections" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__all__">All Sections</SelectItem>
                        {fromSections.map(s => (
                          <SelectItem key={s.section_id} value={String(s.section_id)}>{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs text-slate-500">Target Class *</Label>
                    <Select value={toClassId} onValueChange={setToClassId}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select target class" />
                      </SelectTrigger>
                      <SelectContent>
                        {toGroupClasses.length > 0 ? toGroupClasses.map(c => (
                          <SelectItem key={c.class_id} value={String(c.class_id)}>
                            {c.name} {c.name_numeric}
                          </SelectItem>
                        )) : (
                          <div className="px-2 py-4 text-center text-sm text-slate-400">Select source class first</div>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Term Selection */}
                <div>
                  <Label className="text-xs text-slate-500">Current Term</Label>
                  <Select value={term} onValueChange={setTerm}>
                    <SelectTrigger className="mt-1 w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Term 1</SelectItem>
                      <SelectItem value="2">Term 2</SelectItem>
                      <SelectItem value="3">Term 3</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-end">
                  <Button
                    onClick={fetchPromotionStudents}
                    disabled={!fromClassId || !toClassId || loadingStudents}
                    className="bg-violet-600 hover:bg-violet-700"
                  >
                    {loadingStudents ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Users className="w-4 h-4 mr-2" />}
                    Load Students for Promotion
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Step 2: Student Management */}
        {step === 2 && loadingStudents && (
          <Card>
            <CardContent className="p-6 space-y-4">
              <Skeleton className="h-6 w-48" />
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </CardContent>
          </Card>
        )}

        {step === 2 && !loadingStudents && promotionData && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Card className="border-l-4 border-l-violet-500">
                <CardContent className="p-3">
                  <p className="text-xs text-slate-500">Total Students</p>
                  <p className="text-lg font-bold text-slate-900">{promotionData.total}</p>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-emerald-500">
                <CardContent className="p-3">
                  <p className="text-xs text-slate-500">Eligible</p>
                  <p className="text-lg font-bold text-emerald-600">{promotionData.eligible}</p>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-amber-500">
                <CardContent className="p-3">
                  <p className="text-xs text-slate-500">Already Enrolled</p>
                  <p className="text-lg font-bold text-amber-600">{promotionData.alreadyEnrolled}</p>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-sky-500">
                <CardContent className="p-3">
                  <p className="text-xs text-slate-500">From → To</p>
                  <p className="text-sm font-bold text-slate-900">{promotionData.fromClass?.name} → {promotionData.toClass?.name}</p>
                </CardContent>
              </Card>
            </div>

            {/* Promotion Warning for JHSS */}
            {fromGroup === 'JHSS' && term !== '2' && (
              <Alert className="bg-amber-50 border-amber-200">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800 text-sm">
                  For JHSS classes, promotion can only be done in Semester 2.
                </AlertDescription>
              </Alert>
            )}

            {/* Students Table */}
            <Card>
              <CardContent className="p-0">
                <div className="flex items-center justify-between p-4 border-b">
                  <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Students of {promotionData.fromClass?.name} {promotionData.fromClass?.name_numeric}
                  </h3>
                  <Button
                    onClick={handlePromote}
                    disabled={promoting || promotionData.eligible === 0}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    {promoting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ArrowUpCircle className="w-4 h-4 mr-2" />}
                    Promote {promotionData.eligible} Student(s)
                  </Button>
                </div>
                <div className="overflow-x-auto max-h-[500px]">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50">
                        <TableHead className="text-xs font-semibold w-12">#</TableHead>
                        <TableHead className="text-xs font-semibold">ID No.</TableHead>
                        <TableHead className="text-xs font-semibold">Name</TableHead>
                        <TableHead className="text-xs font-semibold">Section</TableHead>
                        <TableHead className="text-xs font-semibold">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {promotionData.students.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-12 text-slate-400">
                            No students found in this class for the selected session.
                          </TableCell>
                        </TableRow>
                      ) : (
                        promotionData.students.map((s, i) => (
                          <TableRow key={s.student_id} className={s.already_enrolled ? 'bg-slate-50' : 'hover:bg-violet-50/50'}>
                            <TableCell className="text-sm text-slate-400">{i + 1}</TableCell>
                            <TableCell className="font-mono text-xs">{s.student_code}</TableCell>
                            <TableCell className="font-medium text-sm">{s.name}</TableCell>
                            <TableCell className="text-sm">{s.section_name || '—'}</TableCell>
                            <TableCell>
                              {s.already_enrolled ? (
                                <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">
                                  <CheckCircle className="w-3 h-3 mr-1" /> Already Enrolled
                                </Badge>
                              ) : (
                                <Select
                                  value={String(studentTargets[s.student_id] || toClassId)}
                                  onValueChange={v => setStudentTargets(prev => ({ ...prev, [s.student_id]: parseInt(v) }))}
                                >
                                  <SelectTrigger className="w-56 h-8 text-xs">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {toClassId && (
                                    <SelectItem value={toClassId}>
                                      Promote → {promotionData.toClass?.name} {promotionData.toClass?.name_numeric}
                                    </SelectItem>
                                    )}
                                    {fromClassId && (
                                    <SelectItem value={fromClassId}>
                                      Retain in {promotionData.fromClass?.name} {promotionData.fromClass?.name_numeric}
                                    </SelectItem>
                                    )}
                                  </SelectContent>
                                </Select>
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
