'use client';

import { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { ArrowLeft, Download, ListChecks, GraduationCap, Users } from 'lucide-react';
import Link from 'next/link';

const CLASS_GROUPS = ['CRECHE', 'NURSERY', 'KG', 'BASIC', 'JHS'];

interface Student {
  student_id: number; student_code: string; name: string; sex: string; phone: string;
  class?: { class_id: number; name: string; category: string };
  section?: { section_id: number; name: string };
  parent?: { parent_id: number; name: string; phone: string };
}

interface ClassItem { class_id: number; name: string; category: string; }
interface SectionItem { section_id: number; name: string; class_id: number; }

export default function StudentsByClassPage() {
  const [group, setGroup] = useState('');
  const [classId, setClassId] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [sections, setSections] = useState<SectionItem[]>([]);
  const [filteredSections, setFilteredSections] = useState<SectionItem[]>([]);

  useEffect(() => {
    fetch('/api/classes?limit=200').then(r => r.json()).then(d => setClasses(Array.isArray(d) ? d : [])).catch(() => {});
    fetch('/api/sections').then(r => r.json()).then(d => setSections(Array.isArray(d) ? d : [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (classId) {
      setFilteredSections(sections.filter(s => s.class_id === parseInt(classId)));
      setSectionId('');
    } else { setFilteredSections([]); }
  }, [classId, sections]);

  const filteredClasses = group ? classes.filter(c => c.category === group) : classes;

  const fetchStudents = useCallback(async () => {
    if (!classId) { setStudents([]); return; }
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('classId', classId);
      if (sectionId) params.set('sectionId', sectionId);
      const res = await fetch(`/api/students?${params}&limit=200`);
      const data = await res.json();
      setStudents(data.students || []);
    } catch { toast.error('Failed to load students'); } finally { setLoading(false); }
  }, [classId, sectionId]);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  const handleExportCSV = () => {
    const headers = ['Code', 'Name', 'Sex', 'Class', 'Section', 'Parent', 'Phone'];
    const rows = students.map(s => [s.student_code, s.name, s.sex, s.class?.name || '', s.section?.name || '', s.parent?.name || '', s.parent?.phone || '']);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `class-list-${new Date().toISOString().split('T')[0]}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success('Class list exported');
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild><Link href="/admin/students"><ArrowLeft className="w-5 h-5" /></Link></Button>
          <div><h1 className="text-2xl font-bold text-slate-900 tracking-tight">Students by Class</h1><p className="text-sm text-slate-500 mt-1">View students organized by class and section</p></div>
        </div>

        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <div className="flex gap-2 mb-3 flex-wrap">
                  {CLASS_GROUPS.map(g => (
                    <Button key={g} variant={group === g ? 'default' : 'outline'} size="sm" className="text-xs" onClick={() => { setGroup(group === g ? '' : g); setClassId(''); setSectionId(''); }}>{g}</Button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 w-full sm:w-auto">
                <Select value={classId} onValueChange={v => setClassId(v)}>
                  <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                  <SelectContent>{filteredClasses.map(c => <SelectItem key={c.class_id} value={String(c.class_id)}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
                <Select value={sectionId} onValueChange={v => setSectionId(v)}>
                  <SelectTrigger><SelectValue placeholder="Section" /></SelectTrigger>
                  <SelectContent><SelectItem value="__all__">All Sections</SelectItem>{filteredSections.map(s => <SelectItem key={s.section_id} value={String(s.section_id)}>{s.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {classId && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <p className="text-sm text-slate-600">{students.length} student(s) in {filteredClasses.find(c => String(c.class_id) === classId)?.name || ''}</p>
            </div>
            {students.length > 0 && <Button variant="outline" onClick={handleExportCSV}><Download className="w-4 h-4 mr-2" />Export CSV</Button>}
          </div>
        )}

        <Card>
          <CardContent className="p-0">
            {!classId ? (
              <div className="text-center py-16 text-slate-400">
                <ListChecks className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="font-medium">Select a class to view students</p>
                <p className="text-sm mt-1">Use the filters above to choose a class group and class</p>
              </div>
            ) : loading ? (
              <div className="p-8 space-y-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
            ) : students.length === 0 ? (
              <div className="text-center py-16 text-slate-400"><Users className="w-12 h-12 mx-auto mb-3 opacity-50" /><p>No students enrolled in this class</p></div>
            ) : (
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader><TableRow className="bg-slate-50">
                    <TableHead className="text-xs font-semibold w-12">#</TableHead>
                    <TableHead className="text-xs font-semibold">Code</TableHead>
                    <TableHead className="text-xs font-semibold">Name</TableHead>
                    <TableHead className="text-xs font-semibold">Sex</TableHead>
                    <TableHead className="text-xs font-semibold">Section</TableHead>
                    <TableHead className="text-xs font-semibold">Parent</TableHead>
                    <TableHead className="text-xs font-semibold">Phone</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {students.map((s, i) => (
                      <TableRow key={s.student_id} className="hover:bg-slate-50/50">
                        <TableCell className="text-xs text-slate-400">{i + 1}</TableCell>
                        <TableCell className="font-mono text-xs">{s.student_code}</TableCell>
                        <TableCell className="font-medium text-sm">{s.name}</TableCell>
                        <TableCell className="text-sm capitalize">{s.sex}</TableCell>
                        <TableCell className="text-sm">{s.section?.name || '—'}</TableCell>
                        <TableCell className="text-sm">{s.parent?.name || '—'}</TableCell>
                        <TableCell className="text-sm">{s.parent?.phone || '—'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
