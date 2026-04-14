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
import { Search, Plus, FileClock, Eye, Pencil, Trash2, Download, ChevronLeft, ChevronRight } from 'lucide-react';

interface StudyMaterial { id: number; title: string; description: string; file_name: string; file_type: string; class_id?: number; subject_id?: number; teacher_id?: number; downloads: number; created_at: string; class?: { class_id: number; name: string }; subject?: { subject_id: number; name: string }; teacher?: { teacher_id: number; name: string }; }

const FILE_ICONS: Record<string, string> = { pdf: '📄', doc: '📝', docx: '📝', xls: '📊', xlsx: '📊', ppt: '📊', pptx: '📊', jpg: '🖼️', png: '🖼️', zip: '📦' };

export default function StudyMaterialPage() {
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(15);
  const [classes, setClasses] = useState<{ class_id: number; name: string }[]>([]);
  const [subjects, setSubjects] = useState<{ subject_id: number; name: string }[]>([]);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<StudyMaterial | null>(null);
  const [formSaving, setFormSaving] = useState(false);
  const [formData, setFormData] = useState({ title: '', description: '', class_id: '', subject_id: '', file: null as File | null });

  const fetchMaterials = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (classFilter) params.set('class_id', classFilter);
      const res = await fetch(`/api/study-material?${params}`);
      const data = await res.json();
      setMaterials(Array.isArray(data) ? data : []);
    } catch { toast.error('Failed to load materials'); } finally { setLoading(false); }
  }, [search, classFilter]);

  useEffect(() => { fetchMaterials(); }, [fetchMaterials]);
  useEffect(() => { const t = setTimeout(() => setPage(1), 400); return () => clearTimeout(t); }, [search, classFilter]);
  useEffect(() => {
    fetch('/api/classes?limit=100').then(r => r.json()).then(d => setClasses(Array.isArray(d) ? d : [])).catch(() => {});
    fetch('/api/subjects').then(r => r.json()).then(d => setSubjects(Array.isArray(d) ? d : [])).catch(() => {});
  }, []);

  const handleSave = async () => {
    if (!formData.title) { toast.error('Title is required'); return; }
    setFormSaving(true);
    try {
      const fd = new FormData();
      fd.append('title', formData.title);
      fd.append('description', formData.description);
      if (formData.class_id) fd.append('class_id', formData.class_id);
      if (formData.subject_id) fd.append('subject_id', formData.subject_id);
      if (formData.file) fd.append('file', formData.file);
      const res = await fetch('/api/study-material', { method: 'POST', body: fd });
      const data = await res.json(); if (data.error) throw new Error(data.error);
      toast.success('Material uploaded'); setFormOpen(false); fetchMaterials();
    } catch (err: any) { toast.error(err.message); } finally { setFormSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this material?')) return;
    try {
      const res = await fetch(`/api/study-material?id=${id}`, { method: 'DELETE' });
      const data = await res.json(); if (data.error) throw new Error(data.error);
      toast.success('Deleted'); fetchMaterials();
    } catch (err: any) { toast.error(err.message); }
  };

  const getFileIcon = (name: string) => {
    const ext = name.split('.').pop()?.toLowerCase() || '';
    return FILE_ICONS[ext] || '📁';
  };

  const totalPages = Math.max(1, Math.ceil(materials.length / pageSize));
  const paged = materials.slice((page - 1) * pageSize, page * pageSize);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div><h1 className="text-2xl font-bold text-slate-900 tracking-tight">Study Materials</h1><p className="text-sm text-slate-500 mt-1">Upload and manage study materials</p></div>
          <Button onClick={() => { setEditing(null); setFormData({ title: '', description: '', class_id: '', subject_id: '', file: null }); setFormOpen(true); }} className="bg-emerald-600 hover:bg-emerald-700"><Plus className="w-4 h-4 mr-2" />Upload Material</Button>
        </div>

        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col lg:flex-row gap-3">
              <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><Input placeholder="Search materials..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" /></div>
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
                  <TableHead className="text-xs font-semibold">Title</TableHead>
                  <TableHead className="text-xs font-semibold">Class</TableHead>
                  <TableHead className="text-xs font-semibold">Subject</TableHead>
                  <TableHead className="text-xs font-semibold">File</TableHead>
                  <TableHead className="text-xs font-semibold">Downloads</TableHead>
                  <TableHead className="text-xs font-semibold text-right">Actions</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {loading ? Array.from({ length: 6 }).map((_, i) => <TableRow key={i}>{Array.from({ length: 6 }).map((_, j) => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}</TableRow>)
                  : paged.length === 0 ? <TableRow><TableCell colSpan={6} className="text-center py-12 text-slate-400"><FileClock className="w-10 h-10 mx-auto mb-2 opacity-50" /><p>No study materials found</p></TableCell></TableRow>
                  : paged.map(m => (
                    <TableRow key={m.id} className="hover:bg-slate-50/50">
                      <TableCell className="font-medium text-sm">{m.title}</TableCell>
                      <TableCell className="text-sm">{m.class?.name || '—'}</TableCell>
                      <TableCell className="text-sm">{m.subject?.name || '—'}</TableCell>
                      <TableCell className="text-sm"><span className="mr-1">{getFileIcon(m.file_name)}</span>{m.file_name}</TableCell>
                      <TableCell className="text-sm"><Download className="w-3 h-3 inline mr-1" />{m.downloads}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => handleDelete(m.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="md:hidden divide-y">
              {paged.length === 0 ? <div className="text-center py-12 text-slate-400"><p>No materials found</p></div>
              : paged.map(m => (
                <div key={m.id} className="p-4 space-y-2">
                  <div className="flex items-start justify-between"><div><p className="font-medium text-sm">{m.title}</p><p className="text-xs text-slate-500">{m.class?.name || ''} · {m.subject?.name || ''}</p></div><span className="text-xl">{getFileIcon(m.file_name)}</span></div>
                  <p className="text-xs text-slate-500">{m.file_name} · {m.downloads} downloads</p>
                  <Button variant="outline" size="sm" className="h-8 text-xs text-red-500" onClick={() => handleDelete(m.id)}><Trash2 className="w-3 h-3 mr-1" />Delete</Button>
                </div>
              ))}
            </div>
            {totalPages > 1 && <div className="flex items-center justify-between px-4 py-3 border-t"><p className="text-xs text-slate-500">{materials.length} material(s)</p><div className="flex items-center gap-1"><Button variant="outline" size="icon" className="h-8 w-8" disabled={page <= 1} onClick={() => setPage(p => p - 1)}><ChevronLeft className="w-4 h-4" /></Button><span className="text-sm px-2">{page}/{totalPages}</span><Button variant="outline" size="icon" className="h-8 w-8" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}><ChevronRight className="w-4 h-4" /></Button></div></div>}
          </CardContent>
        </Card>
      </div>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Upload Study Material</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label className="text-xs">Title *</Label><Input value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="mt-1" /></div>
            <div><Label className="text-xs">Description</Label><Input value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="mt-1" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Class</Label><Select value={formData.class_id} onValueChange={v => setFormData({ ...formData, class_id: v })}><SelectTrigger className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{classes.map(c => <SelectItem key={c.class_id} value={String(c.class_id)}>{c.name}</SelectItem>)}</SelectContent></Select></div>
              <div><Label className="text-xs">Subject</Label><Select value={formData.subject_id} onValueChange={v => setFormData({ ...formData, subject_id: v })}><SelectTrigger className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{subjects.map(s => <SelectItem key={s.subject_id} value={String(s.subject_id)}>{s.name}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <div><Label className="text-xs">File *</Label><Input type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.png,.zip" onChange={e => setFormData({ ...formData, file: e.target.files?.[0] || null })} className="mt-1" /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button><Button onClick={handleSave} disabled={formSaving || !formData.title} className="bg-emerald-600 hover:bg-emerald-700">{formSaving ? 'Uploading...' : 'Upload'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
