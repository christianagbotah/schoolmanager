'use client';

import { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Percent, Plus, Edit, Trash2, Search, CheckCircle, XCircle, Gift, LayoutGrid, List,
  Filter, Users, Tag, DollarSign, FileText,
} from 'lucide-react';

interface Profile {
  profile_id: number; profile_name: string; discount_category: string;
  discount_type: string; flat_amount: number; flat_percentage: number;
  is_active: number; description: string;
}

function fmt(n: number) { return `GH₵ ${(n || 0).toFixed(2)}`; }

export default function DiscountProfilesPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0, assignments: 0 });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  const [form, setForm] = useState({ profile_name: '', discount_category: 'daily_fees', discount_type: '', discount_method: 'percentage', discount_value: '', description: '' });
  const [saving, setSaving] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingProfile, setDeletingProfile] = useState<Profile | null>(null);

  const fetchProfiles = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (categoryFilter) params.set('category', categoryFilter);
      if (statusFilter) params.set('status', statusFilter);
      if (search) params.set('search', search);
      const res = await fetch(`/api/admin/discounts/profiles?${params}`);
      const data = await res.json();
      setProfiles(data.profiles || []);
      setStats(data.stats || { total: 0, active: 0, inactive: 0, assignments: 0 });
    } catch { toast.error('Failed to load profiles'); }
    setLoading(false);
  }, [categoryFilter, statusFilter, search]);

  useEffect(() => { fetchProfiles(); }, [fetchProfiles]);

  const openCreate = () => {
    setEditingProfile(null);
    setForm({ profile_name: '', discount_category: 'daily_fees', discount_type: '', discount_method: 'percentage', discount_value: '', description: '' });
    setDialogOpen(true);
  };

  const openEdit = (p: Profile) => {
    setEditingProfile(p);
    setForm({
      profile_name: p.profile_name,
      discount_category: p.discount_category,
      discount_type: p.discount_type || '',
      discount_method: p.flat_percentage > 0 ? 'percentage' : 'fixed',
      discount_value: String(p.flat_percentage > 0 ? p.flat_percentage : p.flat_amount),
      description: p.description || '',
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.profile_name) { toast.error('Profile name required'); return; }
    setSaving(true);
    try {
      const body: any = { ...form, discount_value: parseFloat(form.discount_value) || 0 };
      if (editingProfile) body.profile_id = editingProfile.profile_id;
      const method = editingProfile ? 'PUT' : 'POST';
      const res = await fetch('/api/admin/discounts/profiles', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast.success(data.message);
      setDialogOpen(false);
      fetchProfiles();
    } catch (err: any) { toast.error(err.message); }
    setSaving(false);
  };

  const handleToggle = async (p: Profile) => {
    try {
      const res = await fetch(`/api/admin/discounts/profiles?id=${p.profile_id}&action=toggle`, { method: 'DELETE' });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast.success(data.message); fetchProfiles();
    } catch (err: any) { toast.error(err.message); }
  };

  const handleDelete = async () => {
    if (!deletingProfile) return;
    try {
      const res = await fetch(`/api/admin/discounts/profiles?id=${deletingProfile.profile_id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast.success(data.message); setDeleteOpen(false); setDeletingProfile(null); fetchProfiles();
    } catch (err: any) { toast.error(err.message); }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-md">
              <Percent className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Discount Profiles</h1>
              <p className="text-sm text-slate-500 mt-0.5">Create and manage discount schemes</p>
            </div>
          </div>
          <Button onClick={openCreate} className="bg-violet-600 hover:bg-violet-700">
            <Plus className="w-4 h-4 mr-2" /> Create Profile
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card><CardContent className="p-4"><div className="flex items-center gap-2"><div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center"><Tag className="w-4 h-4 text-violet-600" /></div><div><p className="text-[10px] text-slate-400">Total Profiles</p><p className="text-lg font-bold">{stats.total}</p></div></div></CardContent></Card>
          <Card><CardContent className="p-4"><div className="flex items-center gap-2"><div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center"><CheckCircle className="w-4 h-4 text-emerald-600" /></div><div><p className="text-[10px] text-slate-400">Active</p><p className="text-lg font-bold text-emerald-600">{stats.active}</p></div></div></CardContent></Card>
          <Card><CardContent className="p-4"><div className="flex items-center gap-2"><div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center"><XCircle className="w-4 h-4 text-red-500" /></div><div><p className="text-[10px] text-slate-400">Inactive</p><p className="text-lg font-bold text-red-500">{stats.inactive}</p></div></div></CardContent></Card>
          <Card><CardContent className="p-4"><div className="flex items-center gap-2"><div className="w-8 h-8 rounded-lg bg-sky-50 flex items-center justify-center"><Users className="w-4 h-4 text-sky-600" /></div><div><p className="text-[10px] text-slate-400">Assignments</p><p className="text-lg font-bold">{stats.assignments}</p></div></div></CardContent></Card>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input placeholder="Search profiles..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={categoryFilter} onValueChange={v => setCategoryFilter(v === '__all__' ? '' : v)}>
            <SelectTrigger className="w-40"><SelectValue placeholder="All Types" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All Types</SelectItem>
              <SelectItem value="invoice">Invoice</SelectItem>
              <SelectItem value="daily_fees">Daily Fees</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={v => setStatusFilter(v === '__all__' ? '' : v)}>
            <SelectTrigger className="w-32"><SelectValue placeholder="All" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All</SelectItem>
              <SelectItem value="1">Active</SelectItem>
              <SelectItem value="0">Inactive</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex bg-slate-100 rounded-lg p-0.5">
            <button onClick={() => setViewMode('table')} className={`p-1.5 rounded-md ${viewMode === 'table' ? 'bg-white shadow-sm' : ''}`}><List className="w-4 h-4" /></button>
            <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-md ${viewMode === 'grid' ? 'bg-white shadow-sm' : ''}`}><LayoutGrid className="w-4 h-4" /></button>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />)}</div>
        ) : profiles.length === 0 ? (
          <Card><CardContent className="py-16 text-center text-slate-400"><Gift className="w-12 h-12 mx-auto mb-3 opacity-30" /><p>No profiles found</p></CardContent></Card>
        ) : viewMode === 'table' ? (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b bg-slate-50">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500">Profile</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500">Category</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500">Value</th>
                    <th className="text-center py-3 px-4 text-xs font-semibold text-slate-500">Status</th>
                    <th className="text-center py-3 px-4 text-xs font-semibold text-slate-500">Actions</th>
                  </tr></thead>
                  <tbody>
                    {profiles.map(p => (
                      <tr key={p.profile_id} className="border-b last:border-0 hover:bg-slate-50/50">
                        <td className="py-3 px-4">
                          <p className="font-medium">{p.profile_name}</p>
                          <p className="text-[10px] text-slate-400 line-clamp-1">{p.description || 'No description'}</p>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant="outline" className={p.discount_category === 'invoice' ? 'bg-sky-50 text-sky-700 border-sky-200' : 'bg-amber-50 text-amber-700 border-amber-200'}>
                            {p.discount_category === 'invoice' ? 'Invoice' : 'Daily Fees'}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 font-mono font-medium">
                          {p.flat_percentage > 0 ? `${p.flat_percentage}%` : fmt(p.flat_amount)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button onClick={() => handleToggle(p)} className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold ${p.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                            {p.is_active ? <><CheckCircle className="w-3 h-3" />Active</> : <><XCircle className="w-3 h-3" />Inactive</>}
                          </button>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(p)}><Edit className="w-3.5 h-3.5" /></Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={() => { setDeletingProfile(p); setDeleteOpen(true); }}><Trash2 className="w-3.5 h-3.5" /></Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {profiles.map(p => (
              <Card key={p.profile_id} className={`hover:shadow-md transition-all ${p.is_active ? '' : 'opacity-60'}`}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{p.profile_name}</p>
                      <Badge variant="outline" className={`mt-1 text-[10px] h-5 ${p.discount_category === 'invoice' ? 'bg-sky-50 text-sky-700 border-sky-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                        {p.discount_category === 'invoice' ? 'Invoice' : 'Daily Fees'}
                      </Badge>
                    </div>
                    <button onClick={() => handleToggle(p)} className={`w-8 h-8 rounded-full flex items-center justify-center ${p.is_active ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                      {p.is_active ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                    </button>
                  </div>
                  <div className="space-y-1 mb-3">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-slate-400">Value:</span>
                      <span className="font-mono font-medium">{p.flat_percentage > 0 ? `${p.flat_percentage}%` : fmt(p.flat_amount)}</span>
                    </div>
                    {p.description && <p className="text-[10px] text-slate-400">{p.description}</p>}
                  </div>
                  <div className="flex gap-1">
                    <Button variant="outline" size="sm" className="flex-1 h-8 text-xs" onClick={() => openEdit(p)}><Edit className="w-3 h-3 mr-1" />Edit</Button>
                    <Button variant="outline" size="sm" className="h-8 w-8 text-red-500 p-0" onClick={() => { setDeletingProfile(p); setDeleteOpen(true); }}><Trash2 className="w-3 h-3" /></Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Create/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>{editingProfile ? 'Edit Discount Profile' : 'Create Discount Profile'}</DialogTitle><DialogDescription>Define a discount scheme for students</DialogDescription></DialogHeader>
            <div className="space-y-4">
              <div><Label className="text-xs">Profile Name *</Label><Input value={form.profile_name} onChange={e => setForm({ ...form, profile_name: e.target.value })} placeholder="e.g., Sibling Discount" className="mt-1" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs">Category</Label>
                  <Select value={form.discount_category} onValueChange={v => setForm({ ...form, discount_category: v })}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="invoice">Invoice</SelectItem><SelectItem value="daily_fees">Daily Fees</SelectItem></SelectContent></Select>
                </div>
                <div><Label className="text-xs">Method</Label>
                  <Select value={form.discount_method} onValueChange={v => setForm({ ...form, discount_method: v })}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="percentage">Percentage (%)</SelectItem><SelectItem value="fixed">Fixed Amount</SelectItem></SelectContent></Select>
                </div>
              </div>
              <div><Label className="text-xs">Value *</Label><Input type="number" step="0.01" value={form.discount_value} onChange={e => setForm({ ...form, discount_value: e.target.value })} placeholder={form.discount_method === 'percentage' ? '10' : '50.00'} className="mt-1 font-mono" /></div>
              <div><Label className="text-xs">Description</Label><Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Optional details" className="mt-1" /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving} className="bg-violet-600 hover:bg-violet-700">{saving ? 'Saving...' : editingProfile ? 'Update' : 'Create'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete Profile</AlertDialogTitle><AlertDialogDescription>Delete &quot;{deletingProfile?.profile_name}&quot;? All student assignments will also be removed.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}
