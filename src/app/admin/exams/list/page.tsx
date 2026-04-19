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
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Search, Plus, FileText, Eye, Pencil, Trash2, Loader2, GraduationCap } from 'lucide-react';
import Link from 'next/link';

interface ExamCategory { exam_category_id: number; name: string; }

interface ExamItem {
  exam_id: number;
  name: string;
  date: string | null;
  year: string;
  type: string;
  comment: string;
  category_id: number | null;
  class?: { class_id: number; name: string; name_numeric: number };
  category?: ExamCategory | null;
  subjectsCount?: number;
}

export default function ExamListPage() {
  const [exams, setExams] = useState<ExamItem[]>([]);
  const [categories, setCategories] = useState<ExamCategory[]>([]);
  const [classes, setClasses] = useState<{ class_id: number; name: string; name_numeric: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ExamItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState({
    name: '', date: '', year: new Date().getFullYear().toString(), type: '',
    class_id: '', comment: '', category_id: '', term: '1', sem: '1',
  });

  const fetchExams = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      const res = await fetch(`/api/admin/exams?${params}`);
      const d = await res.json();
      setExams(d.exams || []);
      setCategories(d.categories || []);
    } catch { toast.error('Failed to load exams'); } finally { setLoading(false); }
  }, [search]);

  useEffect(() => { fetchExams(); }, [fetchExams]);
  useEffect(() => {
    fetch('/api/classes?limit=100').then(r => r.json()).then(d => setClasses(Array.isArray(d) ? d : (d.classes || []))).catch(() => {});
  }, []);

  const handleSave = async () => {
    if (!data.name) { toast.error('Exam name required'); return; }
    setSaving(true);
    try {
      const url = editing ? `/api/admin/exams/${editing.exam_id}` : '/api/admin/exams';
      const res = await fetch(url, {
        method: editing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          name: data.name.toUpperCase(),
          class_id: data.class_id === '__none__' || !data.class_id ? null : parseInt(data.class_id),
          category_id: data.category_id === '__none__' || !data.category_id ? null : parseInt(data.category_id),
          term: parseInt(data.term) || 0,
          sem: parseInt(data.sem) || 0,
        }),
      });
      const d = await res.json(); if (d.error) throw new Error(d.error);
      toast.success(editing ? 'Updated' : 'Created'); setFormOpen(false); fetchExams();
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : 'Failed'); } finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this exam? This will also delete all associated marks.')) return;
    try {
      const r = await fetch(`/api/admin/exams/${id}`, { method: 'DELETE' });
      const d = await r.json(); if (d.error) throw new Error(d.error);
      toast.success('Deleted'); fetchExams();
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : 'Failed'); }
  };

  const openCreate = () => {
    setEditing(null);
    setData({ name: '', date: '', year: new Date().getFullYear().toString(), type: '', class_id: '', comment: '', category_id: '', term: '1', sem: '1' });
    setFormOpen(true);
  };

  const openEdit = (e: ExamItem) => {
    setEditing(e);
    setData({
      name: e.name, date: e.date ? e.date.split('T')[0] : '', year: e.year, type: e.type,
      class_id: e.class ? String(e.class.class_id) : '', comment: e.comment,
      category_id: e.category_id?.toString() || '', term: '1', sem: '1',
    });
    setFormOpen(true);
  };

  const getCategoryName = (exam: ExamItem) => exam.category?.name || exam.type || '—';

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <GraduationCap className="w-6 h-6 text-emerald-600" /> Exam List
            </h1>
            <p className="text-sm text-slate-500 mt-1">Manage all examinations</p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline" className="min-h-[44px]">
              <Link href="/admin/marks">Manage Marks</Link>
            </Button>
            <Button onClick={openCreate} className="bg-emerald-600 hover:bg-emerald-700 min-h-[44px]">
              <Plus className="w-4 h-4 mr-2" />Add Exam
            </Button>
          </div>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input placeholder="Search exams..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 min-h-[44px]" />
            </div>
          </CardContent>
        </Card>

        {/* CI3 Parity: Table with Name, Date, Year, Category, Class, Actions */}
        <Card>
          <CardContent className="p-0">
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 hover:bg-slate-50">
                    <TableHead className="text-xs font-semibold text-slate-600">Name</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-600">Date</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-600">Year</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-600">Category</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-600">Class</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-600 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? Array.from({ length: 6 }).map((_, i) => <TableRow key={i}>{Array.from({ length: 6 }).map((_, j) => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}</TableRow>)
                    : exams.length === 0 ? <TableRow><TableCell colSpan={6} className="text-center py-12 text-slate-400"><FileText className="w-10 h-10 mx-auto mb-2 opacity-50" /><p>No exams found</p></TableCell></TableRow>
                    : exams.map(e => (
                      <TableRow key={e.exam_id} className="hover:bg-slate-50/50">
                        <TableCell className="font-medium text-sm">{e.name}</TableCell>
                        <TableCell className="text-sm">{e.date ? new Date(e.date).toLocaleDateString() : '—'}</TableCell>
                        <TableCell className="text-sm">{e.year || '—'}</TableCell>
                        <TableCell><Badge variant="outline" className="text-xs">{getCategoryName(e)}</Badge></TableCell>
                        <TableCell className="text-sm">{e.class ? `${e.class.name} ${e.class.name_numeric}` : '—'}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(e)}><Pencil className="w-3.5 h-3.5" /></Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => handleDelete(e.exam_id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
            {/* Mobile */}
            <div className="md:hidden divide-y">
              {exams.length === 0 ? <div className="text-center py-12 text-slate-400"><p>No exams found</p></div>
                : exams.map(e => (
                  <div key={e.exam_id} className="p-4">
                    <p className="font-medium text-sm">{e.name}</p>
                    <p className="text-xs text-slate-500 mt-1">{e.date ? new Date(e.date).toLocaleDateString() : ''} · {e.year} · {getCategoryName(e)}</p>
                    {e.class && <p className="text-xs text-slate-400 mt-0.5">{e.class.name} {e.class.name_numeric}</p>}
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* CI3 Parity: Add/Edit Dialog with name, date, category, year, class, term, comment */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? 'Edit Exam' : 'Add New Exam'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label className="text-xs font-medium">Exam Name *</Label><Input value={data.name} onChange={e => setData({ ...data, name: e.target.value })} className="mt-1 min-h-[44px]" placeholder="e.g., Mid-Term Examination" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs font-medium">Date</Label><Input type="date" value={data.date} onChange={e => setData({ ...data, date: e.target.value })} className="mt-1 min-h-[44px]" /></div>
              <div>
                <Label className="text-xs font-medium">Category *</Label>
                <Select value={data.category_id || '__none__'} onValueChange={v => setData({ ...data, category_id: v })}>
                  <SelectTrigger className="mt-1 min-h-[44px]"><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">None</SelectItem>
                    {categories.map(c => <SelectItem key={c.exam_category_id} value={c.exam_category_id.toString()}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs font-medium">Year</Label><Input value={data.year} onChange={e => setData({ ...data, year: e.target.value })} className="mt-1 min-h-[44px]" /></div>
              <div>
                <Label className="text-xs font-medium">Class</Label>
                <Select value={data.class_id || '__none__'} onValueChange={v => setData({ ...data, class_id: v })}>
                  <SelectTrigger className="mt-1 min-h-[44px]"><SelectValue placeholder="All Classes" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">All Classes</SelectItem>
                    {classes.map(c => <SelectItem key={c.class_id} value={String(c.class_id)}>{c.name} {c.name_numeric}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-medium">Term</Label>
                <Select value={data.term} onValueChange={v => setData({ ...data, term: v })}>
                  <SelectTrigger className="mt-1 min-h-[44px]"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="1">1</SelectItem><SelectItem value="2">2</SelectItem><SelectItem value="3">3</SelectItem></SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-medium">Semester</Label>
                <Select value={data.sem} onValueChange={v => setData({ ...data, sem: v })}>
                  <SelectTrigger className="mt-1 min-h-[44px]"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="1">1</SelectItem><SelectItem value="2">2</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
            <div><Label className="text-xs font-medium">Comment</Label><Textarea value={data.comment} onChange={e => setData({ ...data, comment: e.target.value })} className="mt-1" rows={2} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)} className="min-h-[44px]">Cancel</Button>
            <Button onClick={handleSave} disabled={saving || !data.name} className="bg-emerald-600 hover:bg-emerald-700 min-h-[44px]">
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}{saving ? 'Saving...' : editing ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
