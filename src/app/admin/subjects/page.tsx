'use client';

import { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Search, Plus, Globe, Eye, Pencil, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';

interface Subject {
  subject_id: number; name: string; year: string;
  class?: { class_id: number; name: string; category: string };
  teacher?: { teacher_id: number; name: string };
  section?: { section_id: number; name: string };
}

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [classes, setClasses] = useState<{ class_id: number; name: string; category: string }[]>([]);
  const [teachers, setTeachers] = useState<{ teacher_id: number; name: string }[]>([]);
  const [sections, setSections] = useState<{ section_id: number; name: string; class_id: number }[]>([]);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Subject | null>(null);
  const [formSaving, setFormSaving] = useState(false);
  const [formData, setFormData] = useState({ name: '', class_id: '', teacher_id: '', section_id: '', year: '' });

  const fetchSubjects = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (classFilter) params.set('class_id', classFilter);
      const res = await fetch(`/api/subjects?${params}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setSubjects(Array.isArray(data) ? data : []);
    } catch { toast.error('Failed to load subjects'); } finally { setLoading(false); }
  }, [search, classFilter]);

  useEffect(() => { fetchSubjects(); }, [fetchSubjects]);
  useEffect(() => { const t = setTimeout(() => setPage(1), 400); return () => clearTimeout(t); }, [search, classFilter]);
  useEffect(() => {
    fetch('/api/classes?limit=100').then(r => r.json()).then(d => setClasses(Array.isArray(d) ? d : [])).catch(() => {});
    fetch('/api/teachers?limit=200').then(r => r.json()).then(d => setTeachers(Array.isArray(d) ? d : [])).catch(() => {});
    fetch('/api/sections').then(r => r.json()).then(d => setSections(Array.isArray(d) ? d : [])).catch(() => {});
  }, []);

  const openAddForm = () => { setEditing(null); setFormData({ name: '', class_id: '', teacher_id: '', section_id: '', year: '' }); setFormOpen(true); };
  const openEditForm = (s: Subject) => {
    setEditing(s);
    setFormData({ name: s.name, class_id: s.class ? String(s.class.class_id) : '', teacher_id: s.teacher ? String(s.teacher.teacher_id) : '', section_id: s.section ? String(s.section.section_id) : '', year: s.year || '' });
    setFormOpen(true);
  };
  const handleSave = async () => {
    if (!formData.name) { toast.error('Subject name is required'); return; }
    setFormSaving(true);
    try {
      const url = editing ? `/api/subjects/${editing.subject_id}` : '/api/subjects';
      const res = await fetch(url, { method: editing ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
      const data = await res.json(); if (data.error) throw new Error(data.error);
      toast.success(editing ? 'Subject updated' : 'Subject created'); setFormOpen(false); fetchSubjects();
    } catch (err: any) { toast.error(err.message); } finally { setFormSaving(false); }
  };
  const handleDelete = async (id: number) => {
    if (!confirm('Delete this subject?')) return;
    try {
      const res = await fetch(`/api/subjects/${id}`, { method: 'DELETE' });
      const data = await res.json(); if (data.error) throw new Error(data.error);
      toast.success('Subject deleted'); fetchSubjects();
    } catch (err: any) { toast.error(err.message); }
  };

  const filteredSections = formData.class_id ? sections.filter(s => s.class_id === parseInt(formData.class_id)) : sections;
  const totalPages = Math.max(1, Math.ceil(subjects.length / pageSize));
  const paged = subjects.slice((page - 1) * pageSize, page * pageSize);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div><h1 className="text-2xl font-bold text-slate-900 tracking-tight">Subjects</h1><p className="text-sm text-slate-500 mt-1">Manage academic subjects and teacher assignments</p></div>
          <Button onClick={openAddForm} className="bg-emerald-600 hover:bg-emerald-700"><Plus className="w-4 h-4 mr-2" />Add Subject</Button>
        </div>

        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col lg:flex-row gap-3">
              <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><Input placeholder="Search subjects..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" /></div>
              <Select value={classFilter} onValueChange={v => v === '__all__' ? setClassFilter('') : setClassFilter(v)}>
                <SelectTrigger className="w-full lg:w-48"><SelectValue placeholder="All Classes" /></SelectTrigger>
                <SelectContent><SelectItem value="__all__">All Classes</SelectItem>{classes.map(c => <SelectItem key={c.class_id} value={String(c.class_id)}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader><TableRow className="bg-slate-50">
                  <TableHead className="text-xs font-semibold">Subject Name</TableHead>
                  <TableHead className="text-xs font-semibold">Class</TableHead>
                  <TableHead className="text-xs font-semibold">Section</TableHead>
                  <TableHead className="text-xs font-semibold">Teacher</TableHead>
                  <TableHead className="text-xs font-semibold">Year</TableHead>
                  <TableHead className="text-xs font-semibold text-right">Actions</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {loading ? Array.from({ length: 8 }).map((_, i) => <TableRow key={i}>{Array.from({ length: 6 }).map((_, j) => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}</TableRow>)
                  : paged.length === 0 ? <TableRow><TableCell colSpan={6} className="text-center py-12 text-slate-400"><Globe className="w-10 h-10 mx-auto mb-2 opacity-50" /><p>No subjects found</p></TableCell></TableRow>
                  : paged.map(s => (
                    <TableRow key={s.subject_id} className="hover:bg-slate-50/50">
                      <TableCell className="font-medium text-sm">{s.name}</TableCell>
                      <TableCell className="text-sm">{s.class?.name || '—'} <Badge variant="outline" className="text-[10px] ml-1">{s.class?.category || ''}</Badge></TableCell>
                      <TableCell className="text-sm">{s.section?.name || '—'}</TableCell>
                      <TableCell className="text-sm">{s.teacher?.name || '—'}</TableCell>
                      <TableCell className="text-sm">{s.year || '—'}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditForm(s)}><Pencil className="w-3.5 h-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => handleDelete(s.subject_id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="md:hidden divide-y">
              {loading ? Array.from({ length: 4 }).map((_, i) => <div key={i} className="p-4"><Skeleton className="h-4 w-3/4" /></div>)
              : paged.length === 0 ? <div className="text-center py-12 text-slate-400"><p>No subjects found</p></div>
              : paged.map(s => (
                <div key={s.subject_id} className="p-4 space-y-2">
                  <div className="flex items-start justify-between"><div><p className="font-medium text-sm">{s.name}</p><p className="text-xs text-slate-500">{s.class?.name || ''} · {s.section?.name || ''}</p></div></div>
                  <p className="text-xs text-slate-500">Teacher: {s.teacher?.name || '—'}</p>
                  <div className="flex gap-2 pt-1"><Button variant="outline" size="sm" className="flex-1 h-8 text-xs" onClick={() => openEditForm(s)}><Pencil className="w-3 h-3 mr-1" />Edit</Button></div>
                </div>
              ))}
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t">
                <p className="text-xs text-slate-500">{subjects.length} subject(s)</p>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="icon" className="h-8 w-8" disabled={page <= 1} onClick={() => setPage(p => p - 1)}><ChevronLeft className="w-4 h-4" /></Button>
                  <span className="text-sm px-2">{page}/{totalPages}</span>
                  <Button variant="outline" size="icon" className="h-8 w-8" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}><ChevronRight className="w-4 h-4" /></Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editing ? 'Edit Subject' : 'Add New Subject'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label className="text-xs">Subject Name *</Label><Input placeholder="e.g. Mathematics" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="mt-1" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Class</Label><Select value={formData.class_id} onValueChange={v => setFormData({ ...formData, class_id: v, section_id: '' })}><SelectTrigger className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{classes.map(c => <SelectItem key={c.class_id} value={String(c.class_id)}>{c.name}</SelectItem>)}</SelectContent></Select></div>
              <div><Label className="text-xs">Section</Label><Select value={formData.section_id} onValueChange={v => setFormData({ ...formData, section_id: v })}><SelectTrigger className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger><SelectContent><SelectItem value="0">No Section</SelectItem>{filteredSections.map(s => <SelectItem key={s.section_id} value={String(s.section_id)}>{s.name}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Teacher</Label><Select value={formData.teacher_id} onValueChange={v => setFormData({ ...formData, teacher_id: v })}><SelectTrigger className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{teachers.map(t => <SelectItem key={t.teacher_id} value={String(t.teacher_id)}>{t.name}</SelectItem>)}</SelectContent></Select></div>
              <div><Label className="text-xs">Year</Label><Input placeholder="e.g. 2025" value={formData.year} onChange={e => setFormData({ ...formData, year: e.target.value })} className="mt-1" /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={formSaving || !formData.name} className="bg-emerald-600 hover:bg-emerald-700">{formSaving ? 'Saving...' : editing ? 'Update' : 'Create'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
