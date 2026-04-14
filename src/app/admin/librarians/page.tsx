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
import { Search, Plus, Library as LibraryIcon, Eye, Pencil, Trash2, ChevronLeft, ChevronRight, BookCheck } from 'lucide-react';

interface Librarian { librarian_id: number; name: string; email: string; phone: string; active_status: number; }

export default function LibrariansPage() {
  const [librarians, setLibrarians] = useState<Librarian[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Librarian | null>(null);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState({ name: '', email: '', phone: '', password: '' });

  const fetchLibrarians = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/librarians');
      const d = await res.json();
      setLibrarians(Array.isArray(d) ? d : []);
    } catch { toast.error('Failed to load'); } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchLibrarians(); }, [fetchLibrarians]);

  const handleSave = async () => {
    if (!data.name) { toast.error('Name required'); return; }
    setSaving(true);
    try {
      const url = editing ? `/api/librarians/${editing.librarian_id}` : '/api/librarians';
      const res = await fetch(url, { method: editing ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      const d = await res.json(); if (d.error) throw new Error(d.error);
      toast.success(editing ? 'Updated' : 'Created'); setFormOpen(false); fetchLibrarians();
    } catch (err: any) { toast.error(err.message); } finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Remove this librarian?')) return;
    try { const r = await fetch(`/api/librarians/${id}`, { method: 'DELETE' }); const d = await r.json(); if (d.error) throw new Error(d.error); toast.success('Removed'); fetchLibrarians(); } catch (err: any) { toast.error(err.message); }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div><h1 className="text-2xl font-bold text-slate-900 tracking-tight">Librarians</h1><p className="text-sm text-slate-500 mt-1">Manage library staff</p></div>
          <Button onClick={() => { setEditing(null); setData({ name: '', email: '', phone: '', password: '' }); setFormOpen(true); }} className="bg-emerald-600 hover:bg-emerald-700"><Plus className="w-4 h-4 mr-2" />Add Librarian</Button>
        </div>
        <Card><CardContent className="p-0">
          <Table>
            <TableHeader><TableRow className="bg-slate-50"><TableHead className="text-xs font-semibold">Name</TableHead><TableHead className="text-xs font-semibold">Email</TableHead><TableHead className="text-xs font-semibold">Phone</TableHead><TableHead className="text-xs font-semibold">Status</TableHead><TableHead className="text-xs font-semibold text-right">Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {loading ? Array.from({ length: 4 }).map((_, i) => <TableRow key={i}>{Array.from({ length: 5 }).map((_, j) => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}</TableRow>)
              : librarians.length === 0 ? <TableRow><TableCell colSpan={5} className="text-center py-12 text-slate-400"><LibraryIcon className="w-10 h-10 mx-auto mb-2 opacity-50" /><p>No librarians found</p></TableCell></TableRow>
              : librarians.map(l => (
                <TableRow key={l.librarian_id} className="hover:bg-slate-50/50">
                  <TableCell className="font-medium text-sm">{l.name}</TableCell>
                  <TableCell className="text-sm">{l.email || '—'}</TableCell>
                  <TableCell className="text-sm">{l.phone || '—'}</TableCell>
                  <TableCell><Badge variant={l.active_status === 1 ? 'default' : 'secondary'}>{l.active_status === 1 ? 'Active' : 'Inactive'}</Badge></TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditing(l); setData({ name: l.name, email: l.email, phone: l.phone, password: '' }); setFormOpen(true); }}><Pencil className="w-3.5 h-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => handleDelete(l.librarian_id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent></Card>
      </div>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>{editing ? 'Edit' : 'Add'} Librarian</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label className="text-xs">Name *</Label><Input value={data.name} onChange={e => setData({ ...data, name: e.target.value })} className="mt-1" /></div>
            <div><Label className="text-xs">Email</Label><Input type="email" value={data.email} onChange={e => setData({ ...data, email: e.target.value })} className="mt-1" /></div>
            <div><Label className="text-xs">Phone</Label><Input value={data.phone} onChange={e => setData({ ...data, phone: e.target.value })} className="mt-1" /></div>
            {!editing && <div><Label className="text-xs">Password</Label><Input type="password" value={data.password} onChange={e => setData({ ...data, password: e.target.value })} className="mt-1" /></div>}
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button><Button onClick={handleSave} disabled={saving || !data.name} className="bg-emerald-600 hover:bg-emerald-700">{saving ? 'Saving...' : 'Save'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
