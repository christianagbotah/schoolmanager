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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Search, Plus, BookOpen, Eye, Pencil, Trash2, Users, Layers, BookMarked, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface SchoolClass {
  class_id: number; name: string; name_numeric: number; category: string; digit: string;
  note: string; student_capacity: number;
  teacher?: { teacher_id: number; name: string; email: string };
  section?: { section_id: number; name: string };
  sections?: { section_id: number; name: string }[];
  subjects?: { subject_id: number; name: string }[];
  _count?: { enrolls: number };
}

const CLASS_GROUPS = ['CRECHE', 'NURSERY', 'KG', 'BASIC', 'JHS'];

export default function ClassesPage() {
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [groupFilter, setGroupFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(15);
  const [teachers, setTeachers] = useState<{ teacher_id: number; name: string }[]>([]);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<SchoolClass | null>(null);
  const [formSaving, setFormSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '', name_numeric: '', category: '', teacher_id: '', student_capacity: '', digit: '', note: '', section_id: '',
  });

  const [sectionFormOpen, setSectionFormOpen] = useState(false);
  const [sectionSaving, setSectionSaving] = useState(false);
  const [sectionData, setSectionData] = useState({ name: '', numeric_name: '', teacher_id: '', class_id: '' });
  const [selectedClassForSection, setSelectedClassForSection] = useState<SchoolClass | null>(null);

  const fetchClasses = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (groupFilter) params.set('category', groupFilter);
      const res = await fetch(`/api/classes?${params}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setClasses(Array.isArray(data) ? data : []);
    } catch { toast.error('Failed to load classes'); } finally { setLoading(false); }
  }, [search, groupFilter]);

  useEffect(() => { fetchClasses(); }, [fetchClasses]);
  useEffect(() => { const t = setTimeout(() => setPage(1), 400); return () => clearTimeout(t); }, [search, groupFilter]);
  useEffect(() => { fetch('/api/teachers?limit=200').then(r => r.json()).then(d => setTeachers(Array.isArray(d) ? d : [])).catch(() => {}); }, []);

  const openAddForm = () => {
    setEditing(null);
    setFormData({ name: '', name_numeric: '', category: '', teacher_id: '', student_capacity: '', digit: '', note: '', section_id: '' });
    setFormOpen(true);
  };
  const openEditForm = (c: SchoolClass) => {
    setEditing(c);
    setFormData({ name: c.name, name_numeric: String(c.name_numeric), category: c.category, teacher_id: c.teacher ? String(c.teacher.teacher_id) : '', student_capacity: String(c.student_capacity), digit: c.digit || '', note: c.note || '', section_id: c.section ? String(c.section.section_id) : '' });
    setFormOpen(true);
  };
  const handleSave = async () => {
    if (!formData.name) { toast.error('Class name is required'); return; }
    setFormSaving(true);
    try {
      const url = editing ? `/api/classes/${editing.class_id}` : '/api/classes';
      const res = await fetch(url, { method: editing ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
      const data = await res.json(); if (data.error) throw new Error(data.error);
      toast.success(editing ? 'Class updated' : 'Class created'); setFormOpen(false); fetchClasses();
    } catch (err: any) { toast.error(err.message); } finally { setFormSaving(false); }
  };
  const handleDelete = async (id: number) => {
    if (!confirm('Delete this class? This may affect enrolled students.')) return;
    try {
      const res = await fetch(`/api/classes/${id}`, { method: 'DELETE' });
      const data = await res.json(); if (data.error) throw new Error(data.error);
      toast.success('Class deleted'); fetchClasses();
    } catch (err: any) { toast.error(err.message); }
  };

  // Section management
  const openSectionForm = (c: SchoolClass) => {
    setSelectedClassForSection(c);
    setSectionData({ name: '', numeric_name: '', teacher_id: '', class_id: String(c.class_id) });
    setSectionFormOpen(true);
  };
  const handleSaveSection = async () => {
    if (!sectionData.name) { toast.error('Section name is required'); return; }
    setSectionSaving(true);
    try {
      const res = await fetch('/api/sections', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(sectionData) });
      const data = await res.json(); if (data.error) throw new Error(data.error);
      toast.success('Section created'); setSectionFormOpen(false); fetchClasses();
    } catch (err: any) { toast.error(err.message); } finally { setSectionSaving(false); }
  };
  const handleDeleteSection = async (id: number) => {
    if (!confirm('Delete this section?')) return;
    try {
      const res = await fetch(`/api/sections/${id}`, { method: 'DELETE' });
      const data = await res.json(); if (data.error) throw new Error(data.error);
      toast.success('Section deleted'); fetchClasses();
    } catch (err: any) { toast.error(err.message); }
  };

  const filtered = groupFilter ? classes.filter(c => c.category === groupFilter) : classes;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Classes</h1>
            <p className="text-sm text-slate-500 mt-1">Manage classes, sections, and syllabus</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild><Link href="/admin/classes/sections"><Layers className="w-4 h-4 mr-2" />Sections</Link></Button>
            <Button onClick={openAddForm} className="bg-emerald-600 hover:bg-emerald-700"><Plus className="w-4 h-4 mr-2" />Add Class</Button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {CLASS_GROUPS.map(g => (
            <Card key={g} className={`cursor-pointer hover:shadow-md transition-shadow ${groupFilter === g ? 'ring-2 ring-emerald-500 border-emerald-300' : ''}`} onClick={() => setGroupFilter(groupFilter === g ? '' : g)}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center"><BookOpen className="w-5 h-5 text-emerald-600" /></div>
                <div><p className="text-xs text-slate-500">{g}</p><p className="text-lg font-bold text-slate-900">{classes.filter(c => c.category === g).length}</p></div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col lg:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input placeholder="Search classes..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
              </div>
              <Select value={groupFilter} onValueChange={v => v === '__all__' ? setGroupFilter('') : setGroupFilter(v)}>
                <SelectTrigger className="w-full lg:w-48"><SelectValue placeholder="All Groups" /></SelectTrigger>
                <SelectContent><SelectItem value="__all__">All Groups</SelectItem>{CLASS_GROUPS.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader><TableRow className="bg-slate-50">
                  <TableHead className="text-xs font-semibold">Name</TableHead>
                  <TableHead className="text-xs font-semibold">Numeric</TableHead>
                  <TableHead className="text-xs font-semibold">Category</TableHead>
                  <TableHead className="text-xs font-semibold">Class Teacher</TableHead>
                  <TableHead className="text-xs font-semibold">Students</TableHead>
                  <TableHead className="text-xs font-semibold">Capacity</TableHead>
                  <TableHead className="text-xs font-semibold">Sections</TableHead>
                  <TableHead className="text-xs font-semibold text-right">Actions</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {loading ? Array.from({ length: 6 }).map((_, i) => <TableRow key={i}>{Array.from({ length: 8 }).map((_, j) => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}</TableRow>)
                  : paged.length === 0 ? <TableRow><TableCell colSpan={8} className="text-center py-12 text-slate-400"><BookOpen className="w-10 h-10 mx-auto mb-2 opacity-50" /><p>No classes found</p></TableCell></TableRow>
                  : paged.map(c => (
                    <TableRow key={c.class_id} className="hover:bg-slate-50/50">
                      <TableCell className="font-medium text-sm">{c.name}</TableCell>
                      <TableCell className="text-sm">{c.name_numeric}</TableCell>
                      <TableCell><Badge variant="outline" className="text-xs bg-slate-100">{c.category || '—'}</Badge></TableCell>
                      <TableCell className="text-sm">{c.teacher?.name || '—'}</TableCell>
                      <TableCell className="text-sm">{c._count?.enrolls || 0}</TableCell>
                      <TableCell className="text-sm">{c.student_capacity || 0}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {c.sections?.map(s => (
                            <Badge key={s.section_id} variant="secondary" className="text-xs cursor-pointer" onClick={() => handleDeleteSection(s.section_id)} title="Click to delete">{s.name} ×</Badge>
                          ))}
                          <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => openSectionForm(c)}><Plus className="w-3 h-3" /></Button>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditForm(c)}><Pencil className="w-3.5 h-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => handleDelete(c.class_id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="md:hidden divide-y">
              {loading ? Array.from({ length: 4 }).map((_, i) => <div key={i} className="p-4"><Skeleton className="h-4 w-3/4" /></div>)
              : paged.length === 0 ? <div className="text-center py-12 text-slate-400"><p>No classes found</p></div>
              : paged.map(c => (
                <div key={c.class_id} className="p-4 space-y-2">
                  <div className="flex items-start justify-between"><div><p className="font-medium text-sm">{c.name}</p><p className="text-xs text-slate-500">{c.category} · {c._count?.enrolls || 0} students</p></div><Badge variant="outline" className="text-xs bg-slate-100">{c.category}</Badge></div>
                  <p className="text-xs text-slate-500">Teacher: {c.teacher?.name || '—'} · Sections: {c.sections?.length || 0}</p>
                  <div className="flex gap-2 pt-1">
                    <Button variant="outline" size="sm" className="flex-1 h-8 text-xs" onClick={() => openEditForm(c)}><Pencil className="w-3 h-3 mr-1" />Edit</Button>
                    <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => openSectionForm(c)}><Plus className="w-3 h-3" /></Button>
                  </div>
                </div>
              ))}
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t">
                <p className="text-xs text-slate-500">{filtered.length} class(es)</p>
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
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? 'Edit Class' : 'Add New Class'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label className="text-xs">Class Name *</Label><Input placeholder="e.g. Basic 1" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="mt-1" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Numeric Name</Label><Input type="number" placeholder="e.g. 1" value={formData.name_numeric} onChange={e => setFormData({ ...formData, name_numeric: e.target.value })} className="mt-1" /></div>
              <div><Label className="text-xs">Category</Label><Select value={formData.category} onValueChange={v => setFormData({ ...formData, category: v })}><SelectTrigger className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{CLASS_GROUPS.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Class Teacher</Label><Select value={formData.teacher_id} onValueChange={v => setFormData({ ...formData, teacher_id: v })}><SelectTrigger className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{teachers.map(t => <SelectItem key={t.teacher_id} value={String(t.teacher_id)}>{t.name}</SelectItem>)}</SelectContent></Select></div>
              <div><Label className="text-xs">Capacity</Label><Input type="number" placeholder="0" value={formData.student_capacity} onChange={e => setFormData({ ...formData, student_capacity: e.target.value })} className="mt-1" /></div>
            </div>
            <div><Label className="text-xs">Digit</Label><Input placeholder="e.g. B1" value={formData.digit} onChange={e => setFormData({ ...formData, digit: e.target.value })} className="mt-1" /></div>
            <div><Label className="text-xs">Note</Label><Textarea placeholder="Notes..." value={formData.note} onChange={e => setFormData({ ...formData, note: e.target.value })} className="mt-1" rows={2} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={formSaving || !formData.name} className="bg-emerald-600 hover:bg-emerald-700">{formSaving ? 'Saving...' : editing ? 'Update' : 'Create'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={sectionFormOpen} onOpenChange={setSectionFormOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Add Section to {selectedClassForSection?.name}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label className="text-xs">Section Name *</Label><Input placeholder="e.g. A" value={sectionData.name} onChange={e => setSectionData({ ...sectionData, name: e.target.value })} className="mt-1" /></div>
            <div><Label className="text-xs">Numeric Order</Label><Input type="number" placeholder="1" value={sectionData.numeric_name} onChange={e => setSectionData({ ...sectionData, numeric_name: e.target.value })} className="mt-1" /></div>
            <div><Label className="text-xs">Section Teacher</Label><Select value={sectionData.teacher_id} onValueChange={v => setSectionData({ ...sectionData, teacher_id: v })}><SelectTrigger className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{teachers.map(t => <SelectItem key={t.teacher_id} value={String(t.teacher_id)}>{t.name}</SelectItem>)}</SelectContent></Select></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSectionFormOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveSection} disabled={sectionSaving || !sectionData.name} className="bg-emerald-600 hover:bg-emerald-700">{sectionSaving ? 'Saving...' : 'Add Section'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
