'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { ArrowLeft, ArrowUpCircle, Users, CheckCircle } from 'lucide-react';
import Link from 'next/link';

const CLASS_GROUPS = ['CRECHE', 'NURSERY', 'KG', 'BASIC', 'JHS'];

interface Student { student_id: number; student_code: string; name: string; sex: string; class_id: number; section_id: number; class?: { class_id: number; name: string; category: string }; section?: { section_id: number; name: string }; }
interface ClassItem { class_id: number; name: string; name_numeric: number; category: string; }

export default function PromotionPage() {
  const [fromClass, setFromClass] = useState('');
  const [toClass, setToClass] = useState('');
  const [fromSection, setFromSection] = useState('');
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [term, setTerm] = useState('Term 3');
  const [students, setStudents] = useState<Student[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [promoting, setPromoting] = useState(false);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [promoted, setPromoted] = useState(false);

  useEffect(() => {
    fetch('/api/classes?limit=200').then(r => r.json()).then(d => setClasses(Array.isArray(d) ? d : [])).catch(() => {});
  }, []);

  const groupClasses = (g: string) => classes.filter(c => c.category === g).sort((a, b) => a.name_numeric - b.name_numeric);
  const fromGroup = fromClass ? classes.find(c => String(c.class_id) === fromClass)?.category : '';
  const toGroupClasses = fromGroup ? groupClasses(fromGroup) : [];

  const fetchStudents = async () => {
    if (!fromClass) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('classId', fromClass);
      if (fromSection) params.set('sectionId', fromSection);
      const res = await fetch(`/api/students?${params}&limit=200`);
      const data = await res.json();
      setStudents(data.students || []);
      setSelected(new Set());
    } catch { toast.error('Failed to load students'); } finally { setLoading(false); }
  };

  useEffect(() => { if (fromClass) fetchStudents(); else setStudents([]); }, [fromClass, fromSection]);

  const toggleAll = () => {
    if (selected.size === students.length) setSelected(new Set());
    else setSelected(new Set(students.map(s => s.student_id)));
  };
  const toggle = (id: number) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelected(next);
  };

  const handlePromote = async () => {
    if (!toClass) { toast.error('Select target class'); return; }
    if (selected.size === 0) { toast.error('Select students to promote'); return; }
    if (!confirm(`Promote ${selected.size} student(s) to ${toGroupClasses.find(c => String(c.class_id) === toClass)?.name || 'target class'}?`)) return;
    setPromoting(true);
    try {
      const res = await fetch('/api/students', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'promote', student_ids: Array.from(selected), to_class_id: parseInt(toClass), year, term }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setPromoted(true);
      toast.success(`${selected.size} student(s) promoted successfully`);
    } catch (err: any) { toast.error(err.message); } finally { setPromoting(false); }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild><Link href="/admin/students"><ArrowLeft className="w-5 h-5" /></Link></Button>
          <div><h1 className="text-2xl font-bold text-slate-900 tracking-tight">Student Promotion</h1><p className="text-sm text-slate-500 mt-1">Promote students to the next class</p></div>
        </div>

        {promoted && (
          <Card className="border-emerald-200 bg-emerald-50">
            <CardContent className="p-6 text-center">
              <CheckCircle className="w-12 h-12 text-emerald-600 mx-auto mb-3" />
              <h3 className="font-semibold text-emerald-800">Promotion Complete</h3>
              <p className="text-sm text-emerald-600 mt-1">{selected.size} student(s) have been promoted successfully.</p>
              <Button variant="outline" className="mt-4" onClick={() => { setPromoted(false); setSelected(new Set()); }}>Promote More Students</Button>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="p-6 space-y-4">
            <h3 className="font-semibold text-slate-800">Promotion Settings</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div><Label className="text-xs">From Class *</Label><Select value={fromClass} onValueChange={setFromClass}><SelectTrigger className="mt-1"><SelectValue placeholder="Current class" /></SelectTrigger><SelectContent>{classes.map(c => <SelectItem key={c.class_id} value={String(c.class_id)}>{c.name}</SelectItem>)}</SelectContent></Select></div>
              <div><Label className="text-xs">Section</Label><Select value={fromSection} onValueChange={v => setFromSection(v === '__all__' ? '' : v)}><SelectTrigger className="mt-1"><SelectValue placeholder="All sections" /></SelectTrigger><SelectContent><SelectItem value="__all__">All Sections</SelectItem></SelectContent></Select></div>
              <div><Label className="text-xs">To Class *</Label><Select value={toClass} onValueChange={setToClass}><SelectTrigger className="mt-1"><SelectValue placeholder="Target class" /></SelectTrigger><SelectContent>{toGroupClasses.map(c => <SelectItem key={c.class_id} value={String(c.class_id)}>{c.name}</SelectItem>)}</SelectContent></Select></div>
              <div><Label className="text-xs">Academic Year</Label><Input value={year} onChange={e => setYear(e.target.value)} className="mt-1" /></div>
            </div>
          </CardContent>
        </Card>

        {students.length > 0 && !promoted && (
          <Card>
            <CardContent className="p-0">
              <div className="flex items-center justify-between p-4 border-b">
                <div className="flex items-center gap-3">
                  <Checkbox checked={selected.size === students.length && students.length > 0} onCheckedChange={toggleAll} />
                  <span className="text-sm font-medium">{selected.size} of {students.length} selected</span>
                </div>
                <Button onClick={handlePromote} disabled={promoting || selected.size === 0 || !toClass} className="bg-emerald-600 hover:bg-emerald-700">
                  <ArrowUpCircle className="w-4 h-4 mr-2" />{promoting ? 'Promoting...' : `Promote ${selected.size} Student(s)`}
                </Button>
              </div>
              <div className="overflow-x-auto max-h-96">
                <Table>
                  <TableHeader><TableRow className="bg-slate-50">
                    <TableHead className="w-12"><Checkbox checked={selected.size === students.length && students.length > 0} onCheckedChange={toggleAll} /></TableHead>
                    <TableHead className="text-xs font-semibold">Code</TableHead>
                    <TableHead className="text-xs font-semibold">Name</TableHead>
                    <TableHead className="text-xs font-semibold">Sex</TableHead>
                    <TableHead className="text-xs font-semibold">Section</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {loading ? Array.from({ length: 6 }).map((_, i) => <TableRow key={i}>{Array.from({ length: 5 }).map((_, j) => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}</TableRow>)
                    : students.map(s => (
                      <TableRow key={s.student_id} className={selected.has(s.student_id) ? 'bg-emerald-50' : 'hover:bg-slate-50/50'}>
                        <TableCell><Checkbox checked={selected.has(s.student_id)} onCheckedChange={() => toggle(s.student_id)} /></TableCell>
                        <TableCell className="font-mono text-xs">{s.student_code}</TableCell>
                        <TableCell className="font-medium text-sm">{s.name}</TableCell>
                        <TableCell className="text-sm capitalize">{s.sex}</TableCell>
                        <TableCell className="text-sm">{s.section?.name || '—'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
