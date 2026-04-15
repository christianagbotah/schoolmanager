'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import {
  ArrowLeft, Printer, CreditCard, Users, Info,
  AlertTriangle, Loader2, Eye,
} from 'lucide-react';
import Link from 'next/link';

const CLASS_GROUPS = ['CRECHE', 'NURSERY', 'KG', 'BASIC', 'JHS'];
const MAX_SELECT = 6;

interface Student {
  student_id: number;
  student_code: string;
  name: string;
  sex: string;
  section_id: number;
  section_name: string;
  parent_name?: string;
  parent_phone?: string;
  class_name: string;
  class_numeric: number;
  blood_group: string;
}

interface ClassItem { class_id: number; name: string; name_numeric: number; category: string; }

export default function IdCardsPage() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedYear, setSelectedYear] = useState(() => {
    const y = new Date().getFullYear();
    return `${y}-${y + 1}`;
  });
  const [selectedClassId, setSelectedClassId] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [schoolName, setSchoolName] = useState('');
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/admin/classes?limit=200')
      .then(r => r.json())
      .then(d => setClasses(Array.isArray(d) ? d : []))
      .catch(() => {});

    fetch('/api/admin/dashboard')
      .then(r => r.json())
      .then(d => { if (d.settings) { const sn = d.settings.find((s: any) => s.type === 'system_name'); if (sn) setSchoolName(sn.description); } })
      .catch(() => {});
  }, []);

  const fetchStudents = useCallback(async () => {
    if (!selectedClassId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/students?classId=${selectedClassId}&limit=200`);
      const data = await res.json();
      const studentList = data.students || [];
      // Enrich with parent info
      const enriched = studentList.map((s: any) => ({
        ...s,
        class_name: s.class_name || '',
        class_numeric: s.class_name_numeric || 0,
        parent_name: s.parent?.name || '',
        parent_phone: s.parent?.phone || '',
        blood_group: '',
        section_name: s.section_name || '',
      }));
      setStudents(enriched);
      setSelectedIds(new Set());
      setShowPrintPreview(false);
    } catch {
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  }, [selectedClassId]);

  const toggleStudent = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        if (next.size >= MAX_SELECT) {
          toast.error(`Maximum ${MAX_SELECT} students allowed per print batch`);
          return prev;
        }
        next.add(id);
      }
      return next;
    });
  };

  const handlePrint = () => {
    if (selectedIds.size === 0) {
      toast.error('Select at least one student');
      return;
    }
    setShowPrintPreview(true);
    setTimeout(() => {
      window.print();
    }, 500);
  };

  const selectedStudents = students.filter(s => selectedIds.has(s.student_id));
  const selectedClass = classes.find(c => String(c.class_id) === selectedClassId);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/students"><ArrowLeft className="w-5 h-5" /></Link>
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Student ID Cards</h1>
            <p className="text-sm text-slate-500 mt-1">Generate and print student ID cards (max {MAX_SELECT} per batch)</p>
          </div>
        </div>

        {/* Info Banner */}
        <Alert className="bg-sky-50 border-sky-200">
          <Info className="h-4 w-4 text-sky-600" />
          <AlertDescription className="text-sky-800 text-sm">
            Select a year and class, then choose up to {MAX_SELECT} students. The ID cards are arranged {MAX_SELECT} per page for A4 printing.
            Select students carefully as the layout is optimized for {MAX_SELECT} cards.
          </AlertDescription>
        </Alert>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-3 items-end">
              <div>
                <Label className="text-xs text-slate-500">Academic Year</Label>
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger className="mt-1 w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2024-2025">2024-2025</SelectItem>
                    <SelectItem value="2025-2026">2025-2026</SelectItem>
                    <SelectItem value="2026-2027">2026-2027</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <Label className="text-xs text-slate-500">Class</Label>
                <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                  <SelectTrigger className="mt-1 w-full sm:w-48">
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent>
                    {CLASS_GROUPS.map(g => (
                      <div key={g}>
                        <div className="px-2 py-1.5 text-xs font-semibold text-slate-400 uppercase bg-slate-50">{g}</div>
                        {classes.filter(c => c.category === g).sort((a, b) => a.name_numeric - b.name_numeric).map(c => (
                          <SelectItem key={c.class_id} value={String(c.class_id)}>
                            {c.name} {c.name_numeric}
                          </SelectItem>
                        ))}
                      </div>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={fetchStudents} disabled={!selectedClassId} className="bg-violet-600 hover:bg-violet-700">
                <Users className="w-4 h-4 mr-2" /> Load Students
              </Button>
              <Button variant="outline" onClick={handlePrint} disabled={selectedIds.size === 0}>
                <Printer className="w-4 h-4 mr-2" /> Print ID Cards
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Selection Counter */}
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-2">
            <Badge className={`${selectedIds.size >= MAX_SELECT ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
              {selectedIds.size} / {MAX_SELECT} selected
            </Badge>
            {selectedIds.size >= MAX_SELECT && (
              <span className="text-xs text-red-500">Maximum reached. Print these before selecting more.</span>
            )}
          </div>
        )}

        {/* Student List */}
        {!selectedClassId ? (
          <div className="text-center py-16 text-slate-400">
            <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">Select a class to generate ID cards</p>
          </div>
        ) : loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)}
          </div>
        ) : students.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No students found in this class</p>
          </div>
        ) : (
          <>
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto max-h-[400px]">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50">
                        <TableHead className="w-12">
                          <Checkbox
                            checked={selectedIds.size === Math.min(students.length, MAX_SELECT) && students.length > 0}
                            onCheckedChange={() => {
                              if (selectedIds.size === Math.min(students.length, MAX_SELECT)) {
                                setSelectedIds(new Set());
                              } else {
                                const newSet = new Set<number>();
                                students.slice(0, MAX_SELECT).forEach(s => newSet.add(s.student_id));
                                if (newSet.size < students.length && newSet.size >= MAX_SELECT) {
                                  toast.info(`Selected first ${MAX_SELECT} students (maximum)`);
                                }
                                setSelectedIds(newSet);
                              }
                            }}
                          />
                        </TableHead>
                        <TableHead className="text-xs font-semibold">#</TableHead>
                        <TableHead className="text-xs font-semibold">ID No.</TableHead>
                        <TableHead className="text-xs font-semibold">Student Name</TableHead>
                        <TableHead className="text-xs font-semibold">Section</TableHead>
                        <TableHead className="text-xs font-semibold">Selection</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {students.map((s, i) => (
                        <TableRow
                          key={s.student_id}
                          className={`cursor-pointer ${selectedIds.has(s.student_id) ? 'bg-violet-50' : 'hover:bg-slate-50'}`}
                          onClick={() => toggleStudent(s.student_id)}
                        >
                          <TableCell>
                            <Checkbox
                              checked={selectedIds.has(s.student_id)}
                              disabled={!selectedIds.has(s.student_id) && selectedIds.size >= MAX_SELECT}
                              onCheckedChange={() => toggleStudent(s.student_id)}
                            />
                          </TableCell>
                          <TableCell className="text-sm text-slate-400">{i + 1}</TableCell>
                          <TableCell className="font-mono text-xs">{s.student_code}</TableCell>
                          <TableCell className="font-medium text-sm">{s.name}</TableCell>
                          <TableCell className="text-sm">{s.section_name || '—'}</TableCell>
                          <TableCell>
                            {selectedIds.has(s.student_id) && (
                              <Badge className="bg-violet-100 text-violet-700">
                                <Eye className="w-3 h-3 mr-1" /> Selected
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Print Preview - ID Cards */}
            {showPrintPreview && selectedStudents.length > 0 && (
              <Card className="print:shadow-none print:border-0" ref={printRef}>
                <CardHeader className="print:hidden pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Print Preview</CardTitle>
                    <Button size="sm" onClick={() => window.print()}>
                      <Printer className="w-4 h-4 mr-2" /> Print
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 print:gap-4" id="id-cards-print">
                    {selectedStudents.map((s) => (
                      <div key={s.student_id} className="print:break-inside-avoid" style={{ breakInside: 'avoid' }}>
                        {/* ID Card */}
                        <div className="bg-white border-2 border-slate-300 rounded-2xl overflow-hidden shadow-md">
                          {/* Hook */}
                          <div className="bg-slate-800 mx-auto w-16 h-3 rounded-t-md" />

                          {/* Header with school name */}
                          <div className="bg-gradient-to-r from-violet-600 to-violet-700 text-white px-4 pt-3 pb-8 text-center">
                            <p className="text-[11px] font-bold uppercase tracking-widest">
                              {schoolName || 'School Name'}
                            </p>
                            <p className="text-[9px] opacity-80 mt-0.5">Student Identity Card</p>
                          </div>

                          {/* Photo area */}
                          <div className="flex justify-center -mt-6 mb-2">
                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-400 to-violet-500 border-4 border-white flex items-center justify-center shadow-lg">
                              <span className="text-xl font-bold text-white">
                                {s.name.charAt(0)}
                              </span>
                            </div>
                          </div>

                          {/* ID Number */}
                          <div className="text-center -mt-1 mb-1">
                            <span className="bg-slate-800 text-white text-[10px] font-mono px-3 py-0.5 rounded-full">
                              ID#: {s.student_code}
                            </span>
                          </div>

                          {/* Info Body */}
                          <div className="bg-gradient-to-b from-pink-600 to-pink-700 mx-2 rounded-t-3xl px-4 pt-4 pb-6 text-white">
                            <table className="w-full text-[11px]">
                              <tbody>
                                <tr>
                                  <td className="font-bold py-0.5 pr-3 text-left">Name</td>
                                  <td className="text-right">{s.name}</td>
                                </tr>
                                <tr>
                                  <td className="font-bold py-0.5 pr-3 text-left">Parent</td>
                                  <td className="text-right">{s.parent_name || 'N/A'}</td>
                                </tr>
                                <tr>
                                  <td className="font-bold py-0.5 pr-3 text-left">Class</td>
                                  <td className="text-right">{s.class_name}</td>
                                </tr>
                                <tr>
                                  <td className="font-bold py-0.5 pr-3 text-left">Contact</td>
                                  <td className="text-right">{s.parent_phone || 'N/A'}</td>
                                </tr>
                              </tbody>
                            </table>
                          </div>

                          {/* Black bottom design */}
                          <div className="bg-slate-900 mx-2 -mt-3 rounded-b-2xl px-4 py-3 text-center">
                            <p className="text-[8px] text-slate-300 tracking-wider">
                              THIS CARD IS PROPERTY OF THE SCHOOL
                            </p>
                          </div>

                          {/* Footer spacer */}
                          <div className="h-2" />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
