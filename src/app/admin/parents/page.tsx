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
import { Search, Plus, Users, Eye, Pencil, Trash2, UserPlus, ChevronLeft, ChevronRight, GraduationCap, Phone, Mail } from 'lucide-react';

interface Parent {
  parent_id: number; name: string; guardian_gender: string; email: string; phone: string;
  address: string; profession: string; father_name: string; father_phone: string;
  mother_name: string; mother_phone: string; active_status: number;
  students?: { student_id: number; name: string; student_code: string }[];
}

export default function ParentsPage() {
  const [parents, setParents] = useState<Parent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(15);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Parent | null>(null);
  const [formSaving, setFormSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '', guardian_gender: '', email: '', phone: '', address: '', profession: '',
    father_name: '', father_phone: '', mother_name: '', mother_phone: '',
  });

  const [viewOpen, setViewOpen] = useState(false);
  const [viewParent, setViewParent] = useState<Parent | null>(null);

  const fetchParents = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      const res = await fetch(`/api/parents?${params}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setParents(Array.isArray(data) ? data : []);
    } catch { toast.error('Failed to load parents'); } finally { setLoading(false); }
  }, [search]);

  useEffect(() => { fetchParents(); }, [fetchParents]);
  useEffect(() => { const t = setTimeout(() => setPage(1), 400); return () => clearTimeout(t); }, [search]);

  const openAddForm = () => {
    setEditing(null);
    setFormData({ name: '', guardian_gender: '', email: '', phone: '', address: '', profession: '', father_name: '', father_phone: '', mother_name: '', mother_phone: '' });
    setFormOpen(true);
  };
  const openEditForm = (p: Parent) => {
    setEditing(p);
    setFormData({ name: p.name, guardian_gender: p.guardian_gender || '', email: p.email, phone: p.phone, address: p.address || '', profession: p.profession || '', father_name: p.father_name || '', father_phone: p.father_phone || '', mother_name: p.mother_name || '', mother_phone: p.mother_phone || '' });
    setFormOpen(true);
  };
  const handleSave = async () => {
    if (!formData.name) { toast.error('Parent name is required'); return; }
    setFormSaving(true);
    try {
      const url = editing ? `/api/parents/${editing.parent_id}` : '/api/parents';
      const res = await fetch(url, { method: editing ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
      const data = await res.json(); if (data.error) throw new Error(data.error);
      toast.success(editing ? 'Parent updated' : 'Parent added'); setFormOpen(false); fetchParents();
    } catch (err: any) { toast.error(err.message); } finally { setFormSaving(false); }
  };
  const handleDelete = async (id: number) => {
    if (!confirm('Remove this parent? Linked students will lose their parent reference.')) return;
    try {
      const res = await fetch(`/api/parents/${id}`, { method: 'DELETE' });
      const data = await res.json(); if (data.error) throw new Error(data.error);
      toast.success('Parent removed'); fetchParents();
    } catch (err: any) { toast.error(err.message); }
  };

  const totalPages = Math.max(1, Math.ceil(parents.length / pageSize));
  const paged = parents.slice((page - 1) * pageSize, page * pageSize);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div><h1 className="text-2xl font-bold text-slate-900 tracking-tight">Parents</h1><p className="text-sm text-slate-500 mt-1">Manage parent/guardian records</p></div>
          <Button onClick={openAddForm} className="bg-emerald-600 hover:bg-emerald-700"><UserPlus className="w-4 h-4 mr-2" />Add Parent</Button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <Card className="border-emerald-100"><CardContent className="p-4 flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center"><Users className="w-5 h-5 text-emerald-600" /></div><div><p className="text-xs text-slate-500">Total</p><p className="text-lg font-bold">{parents.length}</p></div></CardContent></Card>
          <Card className="border-emerald-100"><CardContent className="p-4 flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center"><Phone className="w-5 h-5 text-emerald-600" /></div><div><p className="text-xs text-slate-500">Active</p><p className="text-lg font-bold text-emerald-700">{parents.filter(p => p.active_status === 1).length}</p></div></CardContent></Card>
          <Card className="border-blue-100"><CardContent className="p-4 flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center"><GraduationCap className="w-5 h-5 text-blue-600" /></div><div><p className="text-xs text-slate-500">Students</p><p className="text-lg font-bold text-blue-700">{parents.reduce((sum, p) => sum + (p.students?.length || 0), 0)}</p></div></CardContent></Card>
        </div>

        <Card>
          <CardContent className="p-4">
            <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><Input placeholder="Search parents..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" /></div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader><TableRow className="bg-slate-50">
                  <TableHead className="text-xs font-semibold">Name</TableHead>
                  <TableHead className="text-xs font-semibold">Phone</TableHead>
                  <TableHead className="text-xs font-semibold">Email</TableHead>
                  <TableHead className="text-xs font-semibold hidden lg:table-cell">Children</TableHead>
                  <TableHead className="text-xs font-semibold">Status</TableHead>
                  <TableHead className="text-xs font-semibold text-right">Actions</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {loading ? Array.from({ length: 6 }).map((_, i) => <TableRow key={i}>{Array.from({ length: 6 }).map((_, j) => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}</TableRow>)
                  : paged.length === 0 ? <TableRow><TableCell colSpan={6} className="text-center py-12 text-slate-400"><Users className="w-10 h-10 mx-auto mb-2 opacity-50" /><p>No parents found</p></TableCell></TableRow>
                  : paged.map(p => (
                    <TableRow key={p.parent_id} className="hover:bg-slate-50/50">
                      <TableCell className="font-medium text-sm">{p.name}</TableCell>
                      <TableCell className="text-sm">{p.phone || '—'}</TableCell>
                      <TableCell className="text-sm text-slate-500">{p.email || '—'}</TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <div className="flex flex-wrap gap-1">{(p.students || []).map(s => <Badge key={s.student_id} variant="outline" className="text-xs">{s.name}</Badge>)}</div>
                      </TableCell>
                      <TableCell><Badge variant="outline" className={p.active_status === 1 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}>{p.active_status === 1 ? 'Active' : 'Inactive'}</Badge></TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setViewParent(p); setViewOpen(true); }}><Eye className="w-3.5 h-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditForm(p)}><Pencil className="w-3.5 h-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => handleDelete(p.parent_id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="md:hidden divide-y">
              {paged.length === 0 ? <div className="text-center py-12 text-slate-400"><p>No parents found</p></div>
              : paged.map(p => (
                <div key={p.parent_id} className="p-4 space-y-2">
                  <div className="flex items-start justify-between"><div><p className="font-medium text-sm">{p.name}</p><p className="text-xs text-slate-500">{p.phone} · {p.email}</p></div><Badge variant="outline" className={p.active_status === 1 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}>{p.active_status === 1 ? 'Active' : 'Inactive'}</Badge></div>
                  <div className="flex gap-2 pt-1"><Button variant="outline" size="sm" className="flex-1 h-8 text-xs" onClick={() => { setViewParent(p); setViewOpen(true); }}><Eye className="w-3 h-3 mr-1" />View</Button><Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => openEditForm(p)}><Pencil className="w-3 h-3" /></Button></div>
                </div>
              ))}
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t">
                <p className="text-xs text-slate-500">{parents.length} parent(s)</p>
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
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? 'Edit Parent' : 'Add New Parent'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label className="text-xs">Guardian Name *</Label><Input placeholder="Full name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="mt-1" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Gender</Label><Select value={formData.guardian_gender} onValueChange={v => setFormData({ ...formData, guardian_gender: v })}><SelectTrigger className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger><SelectContent><SelectItem value="male">Male</SelectItem><SelectItem value="female">Female</SelectItem></SelectContent></Select></div>
              <div><Label className="text-xs">Profession</Label><Input placeholder="Profession" value={formData.profession} onChange={e => setFormData({ ...formData, profession: e.target.value })} className="mt-1" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Email</Label><Input type="email" placeholder="Email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="mt-1" /></div>
              <div><Label className="text-xs">Phone</Label><Input placeholder="Phone" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="mt-1" /></div>
            </div>
            <div><Label className="text-xs">Address</Label><Input placeholder="Address" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} className="mt-1" /></div>
            <div className="border-t pt-4"><p className="text-sm font-medium text-slate-700 mb-3">Father Details</p>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs">Father Name</Label><Input placeholder="Father name" value={formData.father_name} onChange={e => setFormData({ ...formData, father_name: e.target.value })} className="mt-1" /></div>
                <div><Label className="text-xs">Father Phone</Label><Input placeholder="Phone" value={formData.father_phone} onChange={e => setFormData({ ...formData, father_phone: e.target.value })} className="mt-1" /></div>
              </div>
            </div>
            <div className="border-t pt-4"><p className="text-sm font-medium text-slate-700 mb-3">Mother Details</p>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs">Mother Name</Label><Input placeholder="Mother name" value={formData.mother_name} onChange={e => setFormData({ ...formData, mother_name: e.target.value })} className="mt-1" /></div>
                <div><Label className="text-xs">Mother Phone</Label><Input placeholder="Phone" value={formData.mother_phone} onChange={e => setFormData({ ...formData, mother_phone: e.target.value })} className="mt-1" /></div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={formSaving || !formData.name} className="bg-emerald-600 hover:bg-emerald-700">{formSaving ? 'Saving...' : editing ? 'Update' : 'Add Parent'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Parent Details</DialogTitle></DialogHeader>
          {viewParent && (
            <div className="space-y-3 text-sm">
              <div className="text-center pb-3 border-b">
                <div className="w-16 h-16 bg-purple-100 rounded-full mx-auto flex items-center justify-center mb-2"><Users className="w-8 h-8 text-purple-600" /></div>
                <p className="font-bold text-lg">{viewParent.name}</p>
                <p className="text-xs text-slate-500">{viewParent.profession || ''}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><p className="text-xs text-slate-400">Email</p><p>{viewParent.email || '—'}</p></div>
                <div><p className="text-xs text-slate-400">Phone</p><p>{viewParent.phone || '—'}</p></div>
                <div><p className="text-xs text-slate-400">Father</p><p>{viewParent.father_name || '—'}</p></div>
                <div><p className="text-xs text-slate-400">Mother</p><p>{viewParent.mother_name || '—'}</p></div>
              </div>
              {viewParent.students && viewParent.students.length > 0 && (
                <div className="border-t pt-3">
                  <p className="text-xs text-slate-400 mb-1">Children ({viewParent.students.length})</p>
                  <div className="space-y-1">{viewParent.students.map(s => <div key={s.student_id} className="flex items-center gap-2 text-sm"><GraduationCap className="w-3 h-3 text-slate-400" /><span>{s.name}</span><span className="text-xs text-slate-400">{s.student_code}</span></div>)}</div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
