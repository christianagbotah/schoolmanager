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
import { Search, Plus, FileText, Eye, Pencil, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface ExamItem { exam_id: number; name: string; date: string; year: string; type: string; comment: string; class?: { class_id: number; name: string }; }

export default function ExamListPage() {
  const [exams, setExams] = useState<ExamItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ExamItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [classes, setClasses] = useState<{ class_id: number; name: string }[]>([]);
  const [data, setData] = useState({ name: '', date: '', year: new Date().getFullYear().toString(), type: 'terminal', class_id: '', comment: '' });

  const fetchExams = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      const res = await fetch(`/api/exams?${params}`);
      const d = await res.json();
      setExams(Array.isArray(d) ? d : []);
    } catch { toast.error('Failed to load exams'); } finally { setLoading(false); }
  }, [search]);

  useEffect(() => { fetchExams(); }, [fetchExams]);
  useEffect(() => { fetch('/api/classes?limit=100').then(r => r.json()).then(d => setClasses(Array.isArray(d) ? d : [])).catch(() => {}); }, []);

  const handleSave = async () => {
    if (!data.name) { toast.error('Exam name required'); return; }
    setSaving(true);
    try {
      const url = editing ? `/api/exams/${editing.exam_id}` : '/api/exams';
      const res = await fetch(url, { method: editing ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      const d = await res.json(); if (d.error) throw new Error(d.error);
      toast.success(editing ? 'Updated' : 'Created'); setFormOpen(false); fetchExams();
    } catch (err: any) { toast.error(err.message); } finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this exam?')) return;
    try { const r = await fetch(`/api/exams/${id}`, { method: 'DELETE' }); const d = await r.json(); if (d.error) throw new Error(d.error); toast.success('Deleted'); fetchExams(); } catch (err: any) { toast.error(err.message); }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div><h1 className="text-2xl font-bold text-slate-900 tracking-tight">Exam List</h1><p className="text-sm text-slate-500 mt-1">Manage all examinations</p></div>
          <Button onClick={() => { setEditing(null); setData({ name: '', date: '', year: new Date().getFullYear().toString(), type: 'terminal', class_id: '', comment: '' }); setFormOpen(true); }} className="bg-emerald-600 hover:bg-emerald-700"><Plus className="w-4 h-4 mr-2" />Add Exam</Button>
        </div>

        <Card>
          <CardContent className="p-4"><div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><Input placeholder="Search exams..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" /></div></CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader><TableRow className="bg-slate-50"><TableHead className="text-xs font-semibold">Name</TableHead><TableHead className="text-xs font-semibold">Date</TableHead><TableHead className="text-xs font-semibold">Year</TableHead><TableHead className="text-xs font-semibold">Type</TableHead><TableHead className="text-xs font-semibold">Class</TableHead><TableHead className="text-xs font-semibold text-right">Actions</TableHead></TableRow></TableHeader>
                <TableBody>
                  {loading ? Array.from({ length: 6 }).map((_, i) => <TableRow key={i}>{Array.from({ length: 6 }).map((_, j) => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}</TableRow>)
                  : exams.length === 0 ? <TableRow><TableCell colSpan={6} className="text-center py-12 text-slate-400"><FileText className="w-10 h-10 mx-auto mb-2 opacity-50" /><p>No exams found</p></TableCell></TableRow>
                  : exams.map(e => (
                    <TableRow key={e.exam_id} className="hover:bg-slate-50/50">
                      <TableCell className="font-medium text-sm">{e.name}</TableCell>
                      <TableCell className="text-sm">{e.date ? new Date(e.date).toLocaleDateString() : '—'}</TableCell>
                      <TableCell className="text-sm">{e.year || '—'}</TableCell>
                      <TableCell><Badge variant="outline" className="text-xs">{e.type || '—'}</Badge></TableCell>
                      <TableCell className="text-sm">{e.class?.name || '—'}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditing(e); setData({ name: e.name, date: e.date ? e.date.split('T')[0] : '', year: e.year, type: e.type, class_id: e.class ? String(e.class.class_id) : '', comment: e.comment }); setFormOpen(true); }}><Pencil className="w-3.5 h-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => handleDelete(e.exam_id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="md:hidden divide-y">
              {exams.length === 0 ? <div className="text-center py-12 text-slate-400"><p>No exams found</p></div>
              : exams.map(e => <div key={e.exam_id} className="p-4"><p className="font-medium text-sm">{e.name}</p><p className="text-xs text-slate-500">{e.date ? new Date(e.date).toLocaleDateString() : ''} · {e.year} · {e.type}</p></div>)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editing ? 'Edit Exam' : 'Add New Exam'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label className="text-xs">Exam Name *</Label><Input value={data.name} onChange={e => setData({ ...data, name: e.target.value })} className="mt-1" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Date</Label><Input type="date" value={data.date} onChange={e => setData({ ...data, date: e.target.value })} className="mt-1" /></div>
              <div><Label className="text-xs">Year</Label><Input value={data.year} onChange={e => setData({ ...data, year: e.target.value })} className="mt-1" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Type</Label><Select value={data.type} onValueChange={v => setData({ ...data, type: v })}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="terminal">Terminal</SelectItem><SelectItem value="midterm">Mid-term</SelectItem><SelectItem value="quiz">Quiz</SelectItem><SelectItem value="final">Final</SelectItem></SelectContent></Select></div>
              <div><Label className="text-xs">Class</Label><Select value={data.class_id} onValueChange={v => setData({ ...data, class_id: v })}><SelectTrigger className="mt-1"><SelectValue placeholder="All" /></SelectTrigger><SelectContent><SelectItem value="0">All Classes</SelectItem>{classes.map(c => <SelectItem key={c.class_id} value={String(c.class_id)}>{c.name}</SelectItem>)}</SelectContent></Select></div>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button><Button onClick={handleSave} disabled={saving || !data.name} className="bg-emerald-600 hover:bg-emerald-700">{saving ? 'Saving...' : editing ? 'Update' : 'Create'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
