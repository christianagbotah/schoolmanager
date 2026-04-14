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
import { Search, Plus, UserCog, Eye, Pencil, Trash2, Shield, ChevronLeft, ChevronRight, Mail } from 'lucide-react';

interface Admin {
  admin_id: number; admin_code: string; name: string; email: string; phone: string;
  level: string; active_status: number;
}

const ADMIN_LEVELS = [
  { value: '1', label: 'Super Admin', color: 'bg-red-100 text-red-700' },
  { value: '2', label: 'Administrator', color: 'bg-emerald-100 text-emerald-700' },
  { value: '3', label: 'Manager', color: 'bg-blue-100 text-blue-700' },
  { value: '4', label: 'Cashier', color: 'bg-amber-100 text-amber-700' },
  { value: '5', label: 'Staff', color: 'bg-slate-100 text-slate-600' },
];

function getLevelBadge(level: string) {
  const l = ADMIN_LEVELS.find(x => x.value === level);
  return l ? l.label : `Level ${level}`;
}
function getLevelColor(level: string) {
  const l = ADMIN_LEVELS.find(x => x.value === level);
  return l ? l.color : 'bg-slate-100 text-slate-600';
}

export default function AdminsPage() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(15);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Admin | null>(null);
  const [formSaving, setFormSaving] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', level: '', password: '' });

  const fetchAdmins = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      const res = await fetch(`/api/admins?${params}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setAdmins(Array.isArray(data) ? data : []);
    } catch { toast.error('Failed to load admins'); } finally { setLoading(false); }
  }, [search]);

  useEffect(() => { fetchAdmins(); }, [fetchAdmins]);
  useEffect(() => { const t = setTimeout(() => setPage(1), 400); return () => clearTimeout(t); }, [search]);

  const openAddForm = () => { setEditing(null); setFormData({ name: '', email: '', phone: '', level: '', password: '' }); setFormOpen(true); };
  const openEditForm = (a: Admin) => { setEditing(a); setFormData({ name: a.name, email: a.email, phone: a.phone, level: a.level, password: '' }); setFormOpen(true); };
  const handleSave = async () => {
    if (!formData.name || !formData.email) { toast.error('Name and email are required'); return; }
    setFormSaving(true);
    try {
      const url = editing ? `/api/admins/${editing.admin_id}` : '/api/admins';
      const res = await fetch(url, { method: editing ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
      const data = await res.json(); if (data.error) throw new Error(data.error);
      toast.success(editing ? 'Admin updated' : 'Admin created'); setFormOpen(false); fetchAdmins();
    } catch (err: any) { toast.error(err.message); } finally { setFormSaving(false); }
  };
  const handleDelete = async (id: number) => {
    if (!confirm('Remove this administrator?')) return;
    try {
      const res = await fetch(`/api/admins/${id}`, { method: 'DELETE' });
      const data = await res.json(); if (data.error) throw new Error(data.error);
      toast.success('Admin removed'); fetchAdmins();
    } catch (err: any) { toast.error(err.message); }
  };

  const totalPages = Math.max(1, Math.ceil(admins.length / pageSize));
  const paged = admins.slice((page - 1) * pageSize, page * pageSize);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div><h1 className="text-2xl font-bold text-slate-900 tracking-tight">Administrators</h1><p className="text-sm text-slate-500 mt-1">Manage system administrators and access levels</p></div>
          <Button onClick={openAddForm} className="bg-emerald-600 hover:bg-emerald-700"><Plus className="w-4 h-4 mr-2" />Add Admin</Button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          {ADMIN_LEVELS.map(l => (
            <Card key={l.value}><CardContent className="p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg ${l.color.split(' ')[0]} flex items-center justify-center`}><Shield className={`w-5 h-5 ${l.color.split(' ')[1]}`} /></div>
              <div><p className="text-xs text-slate-500">{l.label}</p><p className="text-lg font-bold">{admins.filter(a => a.level === l.value).length}</p></div>
            </CardContent></Card>
          ))}
        </div>

        <Card>
          <CardContent className="p-4">
            <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><Input placeholder="Search admins..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" /></div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader><TableRow className="bg-slate-50">
                  <TableHead className="text-xs font-semibold">Name</TableHead>
                  <TableHead className="text-xs font-semibold">Code</TableHead>
                  <TableHead className="text-xs font-semibold">Email</TableHead>
                  <TableHead className="text-xs font-semibold hidden lg:table-cell">Phone</TableHead>
                  <TableHead className="text-xs font-semibold">Level</TableHead>
                  <TableHead className="text-xs font-semibold">Status</TableHead>
                  <TableHead className="text-xs font-semibold text-right">Actions</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {loading ? Array.from({ length: 6 }).map((_, i) => <TableRow key={i}>{Array.from({ length: 7 }).map((_, j) => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}</TableRow>)
                  : paged.length === 0 ? <TableRow><TableCell colSpan={7} className="text-center py-12 text-slate-400"><Shield className="w-10 h-10 mx-auto mb-2 opacity-50" /><p>No admins found</p></TableCell></TableRow>
                  : paged.map(a => (
                    <TableRow key={a.admin_id} className="hover:bg-slate-50/50">
                      <TableCell className="font-medium text-sm">{a.name}</TableCell>
                      <TableCell className="text-sm font-mono">{a.admin_code || '—'}</TableCell>
                      <TableCell className="text-sm">{a.email}</TableCell>
                      <TableCell className="text-sm hidden lg:table-cell">{a.phone || '—'}</TableCell>
                      <TableCell><Badge variant="outline" className={`text-xs ${getLevelColor(a.level)}`}>{getLevelBadge(a.level)}</Badge></TableCell>
                      <TableCell><Badge variant="outline" className={a.active_status === 1 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}>{a.active_status === 1 ? 'Active' : 'Inactive'}</Badge></TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditForm(a)}><Pencil className="w-3.5 h-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => handleDelete(a.admin_id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="md:hidden divide-y">
              {paged.length === 0 ? <div className="text-center py-12 text-slate-400"><p>No admins found</p></div>
              : paged.map(a => (
                <div key={a.admin_id} className="p-4 space-y-2">
                  <div className="flex items-start justify-between"><div><p className="font-medium text-sm">{a.name}</p><p className="text-xs text-slate-500">{a.email}</p></div><Badge variant="outline" className={`text-xs ${getLevelColor(a.level)}`}>{getLevelBadge(a.level)}</Badge></div>
                  <div className="flex gap-2 pt-1"><Button variant="outline" size="sm" className="flex-1 h-8 text-xs" onClick={() => openEditForm(a)}><Pencil className="w-3 h-3 mr-1" />Edit</Button></div>
                </div>
              ))}
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t">
                <p className="text-xs text-slate-500">{admins.length} admin(s)</p>
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
          <DialogHeader><DialogTitle>{editing ? 'Edit Admin' : 'Add New Admin'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label className="text-xs">Full Name *</Label><Input placeholder="Full name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="mt-1" /></div>
            <div><Label className="text-xs">Email *</Label><Input type="email" placeholder="Email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="mt-1" /></div>
            <div><Label className="text-xs">Phone</Label><Input placeholder="Phone" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="mt-1" /></div>
            <div><Label className="text-xs">Access Level *</Label><Select value={formData.level} onValueChange={v => setFormData({ ...formData, level: v })}><SelectTrigger className="mt-1"><SelectValue placeholder="Select Level" /></SelectTrigger><SelectContent>{ADMIN_LEVELS.map(l => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}</SelectContent></Select></div>
            {!editing && <div><Label className="text-xs">Password *</Label><Input type="password" placeholder="Set password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} className="mt-1" /></div>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={formSaving || !formData.name || !formData.email || (!editing && !formData.password)} className="bg-emerald-600 hover:bg-emerald-700">{formSaving ? 'Saving...' : editing ? 'Update' : 'Create'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
