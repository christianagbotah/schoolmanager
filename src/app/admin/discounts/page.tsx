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
import { Search, Plus, Percent, Eye, Pencil, Trash2, ChevronLeft, ChevronRight, Users } from 'lucide-react';

interface DiscountCategory { category_id: number; code: string; name: string; discount_type: string; description: string; is_active: number; }
interface DiscountProfile { profile_id: number; profile_name: string; discount_category: string; description: string; flat_amount: number; flat_percentage: number; is_active: number; }

export default function DiscountsPage() {
  const [categories, setCategories] = useState<DiscountCategory[]>([]);
  const [profiles, setProfiles] = useState<DiscountProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('categories');

  // Category form
  const [catFormOpen, setCatFormOpen] = useState(false);
  const [catEditing, setCatEditing] = useState<DiscountCategory | null>(null);
  const [catSaving, setCatSaving] = useState(false);
  const [catData, setCatData] = useState({ code: '', name: '', discount_type: 'percentage', description: '' });

  // Profile form
  const [profFormOpen, setProfFormOpen] = useState(false);
  const [profEditing, setProfEditing] = useState<DiscountProfile | null>(null);
  const [profSaving, setProfSaving] = useState(false);
  const [profData, setProfData] = useState({ profile_name: '', discount_category: '', description: '', flat_amount: '', flat_percentage: '' });

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [catRes, profRes] = await Promise.all([fetch('/api/discounts?type=categories'), fetch('/api/discounts?type=profiles')]);
      const catJson = await catRes.json(); const profJson = await profRes.json();
      setCategories(Array.isArray(catJson) ? catJson : []);
      setProfiles(Array.isArray(profJson) ? profJson : []);
    } catch { toast.error('Failed to load discounts'); } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const saveCategory = async () => {
    if (!catData.name) { toast.error('Category name required'); return; }
    setCatSaving(true);
    try {
      const res = await fetch('/api/discounts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...catData, type: 'category', id: catEditing?.category_id }) });
      const data = await res.json(); if (data.error) throw new Error(data.error);
      toast.success(catEditing ? 'Updated' : 'Created'); setCatFormOpen(false); fetchAll();
    } catch (err: any) { toast.error(err.message); } finally { setCatSaving(false); }
  };

  const saveProfile = async () => {
    if (!profData.profile_name) { toast.error('Profile name required'); return; }
    setProfSaving(true);
    try {
      const res = await fetch('/api/discounts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...profData, type: 'profile', id: profEditing?.profile_id }) });
      const data = await res.json(); if (data.error) throw new Error(data.error);
      toast.success(profEditing ? 'Updated' : 'Created'); setProfFormOpen(false); fetchAll();
    } catch (err: any) { toast.error(err.message); } finally { setProfSaving(false); }
  };

  const deleteItem = async (type: string, id: number) => {
    if (!confirm('Delete this item?')) return;
    try {
      const res = await fetch(`/api/discounts?type=${type}&id=${id}`, { method: 'DELETE' });
      const data = await res.json(); if (data.error) throw new Error(data.error);
      toast.success('Deleted'); fetchAll();
    } catch (err: any) { toast.error(err.message); }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div><h1 className="text-2xl font-bold text-slate-900 tracking-tight">Discounts</h1><p className="text-sm text-slate-500 mt-1">Manage discount categories and profiles</p></div>
          {tab === 'categories' ? (
            <Button onClick={() => { setCatEditing(null); setCatData({ code: '', name: '', discount_type: 'percentage', description: '' }); setCatFormOpen(true); }} className="bg-emerald-600 hover:bg-emerald-700"><Plus className="w-4 h-4 mr-2" />Add Category</Button>
          ) : (
            <Button onClick={() => { setProfEditing(null); setProfData({ profile_name: '', discount_category: '', description: '', flat_amount: '', flat_percentage: '' }); setProfFormOpen(true); }} className="bg-emerald-600 hover:bg-emerald-700"><Plus className="w-4 h-4 mr-2" />Add Profile</Button>
          )}
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList><TabsTrigger value="categories">Categories ({categories.length})</TabsTrigger><TabsTrigger value="profiles">Profiles ({profiles.length})</TabsTrigger></TabsList>

          <TabsContent value="categories">
            <Card><CardContent className="p-0">
              <Table>
                <TableHeader><TableRow className="bg-slate-50"><TableHead className="text-xs font-semibold">Code</TableHead><TableHead className="text-xs font-semibold">Name</TableHead><TableHead className="text-xs font-semibold">Type</TableHead><TableHead className="text-xs font-semibold">Description</TableHead><TableHead className="text-xs font-semibold">Status</TableHead><TableHead className="text-xs font-semibold text-right">Actions</TableHead></TableRow></TableHeader>
                <TableBody>
                  {loading ? Array.from({ length: 4 }).map((_, i) => <TableRow key={i}>{Array.from({ length: 6 }).map((_, j) => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}</TableRow>)
                  : categories.length === 0 ? <TableRow><TableCell colSpan={6} className="text-center py-12 text-slate-400"><Percent className="w-10 h-10 mx-auto mb-2 opacity-50" /><p>No discount categories</p></TableCell></TableRow>
                  : categories.map(c => (
                    <TableRow key={c.category_id} className="hover:bg-slate-50/50">
                      <TableCell className="font-mono text-xs">{c.code || '—'}</TableCell>
                      <TableCell className="font-medium text-sm">{c.name}</TableCell>
                      <TableCell><Badge variant="outline" className="text-xs">{c.discount_type}</Badge></TableCell>
                      <TableCell className="text-sm text-slate-500 max-w-xs truncate">{c.description}</TableCell>
                      <TableCell><Badge variant={c.is_active ? 'default' : 'secondary'}>{c.is_active ? 'Active' : 'Inactive'}</Badge></TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setCatEditing(c); setCatData({ code: c.code, name: c.name, discount_type: c.discount_type, description: c.description }); setCatFormOpen(true); }}><Pencil className="w-3.5 h-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => deleteItem('category', c.category_id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent></Card>
          </TabsContent>

          <TabsContent value="profiles">
            <Card><CardContent className="p-0">
              <Table>
                <TableHeader><TableRow className="bg-slate-50"><TableHead className="text-xs font-semibold">Name</TableHead><TableHead className="text-xs font-semibold">Category</TableHead><TableHead className="text-xs font-semibold">Amount</TableHead><TableHead className="text-xs font-semibold">Percentage</TableHead><TableHead className="text-xs font-semibold">Status</TableHead><TableHead className="text-xs font-semibold text-right">Actions</TableHead></TableRow></TableHeader>
                <TableBody>
                  {loading ? Array.from({ length: 4 }).map((_, i) => <TableRow key={i}>{Array.from({ length: 6 }).map((_, j) => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}</TableRow>)
                  : profiles.length === 0 ? <TableRow><TableCell colSpan={6} className="text-center py-12 text-slate-400"><Percent className="w-10 h-10 mx-auto mb-2 opacity-50" /><p>No discount profiles</p></TableCell></TableRow>
                  : profiles.map(p => (
                    <TableRow key={p.profile_id} className="hover:bg-slate-50/50">
                      <TableCell className="font-medium text-sm">{p.profile_name}</TableCell>
                      <TableCell className="text-sm">{p.discount_category}</TableCell>
                      <TableCell className="text-sm font-mono">{p.flat_amount > 0 ? `GH₵ ${p.flat_amount}` : '—'}</TableCell>
                      <TableCell className="text-sm">{p.flat_percentage > 0 ? `${p.flat_percentage}%` : '—'}</TableCell>
                      <TableCell><Badge variant={p.is_active ? 'default' : 'secondary'}>{p.is_active ? 'Active' : 'Inactive'}</Badge></TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setProfEditing(p); setProfData({ profile_name: p.profile_name, discount_category: p.discount_category, description: p.description, flat_amount: String(p.flat_amount), flat_percentage: String(p.flat_percentage) }); setProfFormOpen(true); }}><Pencil className="w-3.5 h-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => deleteItem('profile', p.profile_id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent></Card>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={catFormOpen} onOpenChange={setCatFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{catEditing ? 'Edit Category' : 'Add Discount Category'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label className="text-xs">Category Name *</Label><Input value={catData.name} onChange={e => setCatData({ ...catData, name: e.target.value })} className="mt-1" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Code</Label><Input value={catData.code} onChange={e => setCatData({ ...catData, code: e.target.value })} className="mt-1" /></div>
              <div><Label className="text-xs">Type</Label><Select value={catData.discount_type} onValueChange={v => setCatData({ ...catData, discount_type: v })}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="percentage">Percentage</SelectItem><SelectItem value="fixed">Fixed Amount</SelectItem></SelectContent></Select></div>
            </div>
            <div><Label className="text-xs">Description</Label><Textarea value={catData.description} onChange={e => setCatData({ ...catData, description: e.target.value })} className="mt-1" rows={2} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setCatFormOpen(false)}>Cancel</Button><Button onClick={saveCategory} disabled={catSaving} className="bg-emerald-600 hover:bg-emerald-700">{catSaving ? 'Saving...' : catEditing ? 'Update' : 'Create'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={profFormOpen} onOpenChange={setProfFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{profEditing ? 'Edit Profile' : 'Add Discount Profile'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label className="text-xs">Profile Name *</Label><Input value={profData.profile_name} onChange={e => setProfData({ ...profData, profile_name: e.target.value })} className="mt-1" /></div>
            <div><Label className="text-xs">Category</Label><Select value={profData.discount_category} onValueChange={v => setProfData({ ...profData, discount_category: v })}><SelectTrigger className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{categories.map(c => <SelectItem key={c.category_id} value={c.name}>{c.name}</SelectItem>)}</SelectContent></Select></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Flat Amount (GH₵)</Label><Input type="number" value={profData.flat_amount} onChange={e => setProfData({ ...profData, flat_amount: e.target.value })} className="mt-1" /></div>
              <div><Label className="text-xs">Percentage (%)</Label><Input type="number" value={profData.flat_percentage} onChange={e => setProfData({ ...profData, flat_percentage: e.target.value })} className="mt-1" /></div>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setProfFormOpen(false)}>Cancel</Button><Button onClick={saveProfile} disabled={profSaving} className="bg-emerald-600 hover:bg-emerald-700">{profSaving ? 'Saving...' : profEditing ? 'Update' : 'Create'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
