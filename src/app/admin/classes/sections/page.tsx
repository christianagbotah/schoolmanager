'use client';

import { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Plus, Layers, Pencil, Trash2, ChevronLeft, ChevronRight, BookOpen } from 'lucide-react';

interface Section { section_id: number; name: string; numeric_name: number; teacher_id: number | null; class_id: number | null; teacher?: { teacher_id: number; name: string }; class?: { class_id: number; name: string }; }

export default function SectionsPage() {
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [teachers, setTeachers] = useState<{ teacher_id: number; name: string }[]>([]);
  const [classes, setClasses] = useState<{ class_id: number; name: string }[]>([]);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Section | null>(null);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState({ name: '', numeric_name: '', teacher_id: '', class_id: '' });

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [secRes, teachRes, clsRes] = await Promise.all([fetch('/api/sections'), fetch('/api/teachers?limit=200'), fetch('/api/classes?limit=100')]);
      const [secJson, teachJson, clsJson] = await Promise.all([secRes.json(), teachRes.json(), clsRes.json()]);
      setSections(Array.isArray(secJson) ? secJson : []);
      setTeachers(Array.isArray(teachJson) ? teachJson : []);
      setClasses(Array.isArray(clsJson) ? clsJson : []);
    } catch { toast.error('Failed to load sections'); } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleSave = async () => {
    if (!data.name) { toast.error('Section name required'); return; }
    setSaving(true);
    try {
      const url = editing ? `/api/sections/${editing.section_id}` : '/api/sections';
      const res = await fetch(url, { method: editing ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      const result = await res.json(); if (result.error) throw new Error(result.error);
      toast.success(editing ? 'Updated' : 'Created'); setFormOpen(false); fetchAll();
    } catch (err: any) { toast.error(err.message); } finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this section?')) return;
    try {
      const res = await fetch(`/api/sections/${id}`, { method: 'DELETE' });
      const data = await res.json(); if (data.error) throw new Error(data.error);
      toast.success('Deleted'); fetchAll();
    } catch (err: any) { toast.error(err.message); }
  };

  const openAdd = () => { setEditing(null); setData({ name: '', numeric_name: '', teacher_id: '', class_id: '' }); setFormOpen(true); };
  const openEdit = (s: Section) => { setEditing(s); setData({ name: s.name, numeric_name: String(s.numeric_name), teacher_id: s.teacher_id ? String(s.teacher_id) : '', class_id: s.class_id ? String(s.class_id) : '' }); setFormOpen(true); };

  const sectionsByClass = classes.reduce((acc, c) => { acc[c.class_id] = sections.filter(s => s.class_id === c.class_id); return acc; }, {} as Record<number, Section[]>);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div><h1 className="text-2xl font-bold text-slate-900 tracking-tight">Class Sections</h1><p className="text-sm text-slate-500 mt-1">Manage class sections across all classes</p></div>
          <Button onClick={openAdd} className="bg-emerald-600 hover:bg-emerald-700"><Plus className="w-4 h-4 mr-2" />Add Section</Button>
        </div>

        {loading ? <div className="space-y-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32" />)}</div>
        : classes.length === 0 ? <Card><CardContent className="text-center py-12 text-slate-400"><BookOpen className="w-10 h-10 mx-auto mb-2 opacity-50" /><p>No classes found. Add classes first.</p></CardContent></Card>
        : (
          <div className="space-y-4">
            {classes.map(c => (
              <Card key={c.class_id}>
                <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><BookOpen className="w-4 h-4 text-emerald-600" />{c.name} <Badge variant="outline" className="text-xs">{(sectionsByClass[c.class_id] || []).length} section(s)</Badge></CardTitle></CardHeader>
                <CardContent>
                  {(sectionsByClass[c.class_id] || []).length === 0 ? (
                    <p className="text-sm text-slate-400 py-2">No sections. Add one to this class.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {(sectionsByClass[c.class_id] || []).map(s => (
                        <div key={s.section_id} className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg border">
                          <span className="font-medium text-sm">{s.name}</span>
                          {s.teacher && <span className="text-xs text-slate-500">({s.teacher.name})</span>}
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openEdit(s)}><Pencil className="w-3 h-3" /></Button>
                          <Button variant="ghost" size="icon" className="h-6 w-6 text-red-500" onClick={() => handleDelete(s.section_id)}><Trash2 className="w-3 h-3" /></Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>{editing ? 'Edit Section' : 'Add Section'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label className="text-xs">Section Name *</Label><Input placeholder="e.g. A" value={data.name} onChange={e => setData({ ...data, name: e.target.value })} className="mt-1" /></div>
            <div><Label className="text-xs">Numeric Order</Label><Input type="number" placeholder="1" value={data.numeric_name} onChange={e => setData({ ...data, numeric_name: e.target.value })} className="mt-1" /></div>
            <div><Label className="text-xs">Class</Label><Select value={data.class_id} onValueChange={v => setData({ ...data, class_id: v })}><SelectTrigger className="mt-1"><SelectValue placeholder="Select class" /></SelectTrigger><SelectContent>{classes.map(c => <SelectItem key={c.class_id} value={String(c.class_id)}>{c.name}</SelectItem>)}</SelectContent></Select></div>
            <div><Label className="text-xs">Section Teacher</Label><Select value={data.teacher_id} onValueChange={v => setData({ ...data, teacher_id: v })}><SelectTrigger className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{teachers.map(t => <SelectItem key={t.teacher_id} value={String(t.teacher_id)}>{t.name}</SelectItem>)}</SelectContent></Select></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button><Button onClick={handleSave} disabled={saving || !data.name} className="bg-emerald-600 hover:bg-emerald-700">{saving ? 'Saving...' : editing ? 'Update' : 'Create'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
