'use client';

import { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import {
  Search, Plus, BookOpen, Pencil, Trash2, Lock, Unlock, Eye, EyeOff, Copy,
  Users, KeyRound, Library, MapPin, Mail, Phone
} from 'lucide-react';

interface Librarian {
  librarian_id: number; name: string; email: string; phone: string;
  password: string; active_status: number; authentication_key: string;
  block_limit: number; address: string;
}

interface LibrarianStats {
  total: number; blocked: number; active: number;
}

export default function LibrariansPage() {
  const [librarians, setLibrarians] = useState<Librarian[]>([]);
  const [stats, setStats] = useState<LibrarianStats>({ total: 0, blocked: 0, active: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewKey, setViewKey] = useState<number | null>(null);

  // Form state
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Librarian | null>(null);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', password: '', address: '' });

  // Dialog states
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Librarian | null>(null);
  const [blockOpen, setBlockOpen] = useState(false);
  const [blockTarget, setBlockTarget] = useState<Librarian | null>(null);
  const [blockAction, setBlockAction] = useState<'block' | 'unblock'>('block');

  const fetchLibrarians = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      const res = await fetch(`/api/admin/librarians?${params}`);
      const d = await res.json();
      if (d.error) throw new Error(d.error);
      setLibrarians(Array.isArray(d.data) ? d.data : []);
      if (d.stats) setStats(d.stats);
    } catch { toast.error('Failed to load librarians'); } finally { setLoading(false); }
  }, [search, statusFilter]);

  useEffect(() => { fetchLibrarians(); }, [fetchLibrarians]);

  const handleSave = async () => {
    if (!formData.name.trim()) { toast.error('Name is required'); return; }
    if (!editing && !formData.password) { toast.error('Password is required for new librarian'); return; }
    setSaving(true);
    try {
      const url = editing ? `/api/admin/librarians/${editing.librarian_id}` : '/api/admin/librarians';
      const res = await fetch(url, { method: editing ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
      const d = await res.json(); if (d.error) throw new Error(d.error);
      toast.success(editing ? 'Librarian updated successfully' : 'Librarian created successfully');
      setFormOpen(false); fetchLibrarians();
    } catch (err: any) { toast.error(err.message); } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const r = await fetch(`/api/admin/librarians/${deleteTarget.librarian_id}`, { method: 'DELETE' });
      const d = await r.json(); if (d.error) throw new Error(d.error);
      toast.success('Librarian removed permanently'); setDeleteOpen(false); fetchLibrarians();
    } catch (err: any) { toast.error(err.message); }
  };

  const handleBlock = async () => {
    if (!blockTarget) return;
    try {
      const r = await fetch(`/api/admin/librarians/${blockTarget.librarian_id}?action=${blockAction}`, { method: 'DELETE' });
      const d = await r.json(); if (d.error) throw new Error(d.error);
      toast.success(d.message); setBlockOpen(false); fetchLibrarians();
    } catch (err: any) { toast.error(err.message); }
  };

  const copyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    toast.success('Auth key copied to clipboard');
  };

  const openAddForm = () => {
    setEditing(null);
    setFormData({ name: '', email: '', phone: '', password: '', address: '' });
    setFormOpen(true);
  };

  const openEditForm = (l: Librarian) => {
    setEditing(l);
    setFormData({ name: l.name, email: l.email, phone: l.phone, password: '', address: l.address || '' });
    setFormOpen(true);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                <Library className="w-5 h-5 text-white" />
              </div>
              Manage Librarians
            </h1>
            <p className="text-sm text-slate-500 mt-1 ml-12">Library staff accounts and access management</p>
          </div>
          <Button onClick={openAddForm} className="bg-violet-600 hover:bg-violet-700 min-h-[44px] shadow-sm">
            <Plus className="w-4 h-4 mr-2" /> Add Librarian
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="border-slate-200/60 shadow-none">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-violet-100 flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-violet-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500 leading-tight">Total Librarians</p>
                <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-slate-200/60 shadow-none">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                <Users className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500 leading-tight">Active</p>
                <p className="text-2xl font-bold text-emerald-700">{stats.active}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-slate-200/60 shadow-none">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
                <Lock className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500 leading-tight">Blocked</p>
                <p className="text-2xl font-bold text-red-700">{stats.blocked}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search & Filter */}
        <Card className="border-slate-200/60 shadow-none">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search librarians by name, email, or phone..."
                  value={search} onChange={e => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="blocked">Blocked</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card className="border-slate-200/60 shadow-none">
          <CardContent className="p-0">
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/80">
                    <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Name</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Email</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Auth Key</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wider hidden lg:table-cell">Phone</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Account Status</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wider text-right">Options</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? Array.from({ length: 4 }).map((_, i) => (
                    <TableRow key={i}>{Array.from({ length: 6 }).map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                    ))}</TableRow>
                  )) : librarians.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-16 text-slate-400">
                        <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p className="font-medium">No librarians found</p>
                        <p className="text-xs mt-1">Add your first librarian to get started</p>
                      </TableCell>
                    </TableRow>
                  ) : librarians.map(l => {
                    const blocked = l.block_limit === 3;
                    return (
                      <TableRow key={l.librarian_id} className={`hover:bg-slate-50/50 ${blocked ? 'opacity-70' : ''}`}>
                        <TableCell className="font-medium text-sm">
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold ${blocked ? 'bg-red-100 text-red-700' : 'bg-violet-100 text-violet-700'}`}>
                              {l.name?.charAt(0) || 'L'}
                            </div>
                            <div>
                              <p className="font-medium text-slate-900">{l.name}</p>
                              {l.address && (
                                <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                                  <MapPin className="w-3 h-3" /> {l.address}
                                </p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-slate-600">
                          {l.email ? (
                            <span className="flex items-center gap-1.5">
                              <Mail className="w-3 h-3 text-slate-400" />
                              {l.email}
                            </span>
                          ) : '—'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <code className="text-xs font-mono font-bold tracking-widest text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                              {viewKey === l.librarian_id ? l.authentication_key : '••••••'}
                            </code>
                            <TooltipProvider delayDuration={300}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button onClick={() => setViewKey(viewKey === l.librarian_id ? null : l.librarian_id)} className="text-slate-400 hover:text-slate-600 transition-colors">
                                    {viewKey === l.librarian_id ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent>{viewKey === l.librarian_id ? 'Hide' : 'Show'}</TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button onClick={() => copyKey(l.authentication_key)} className="text-slate-400 hover:text-slate-600 transition-colors">
                                    <Copy className="w-3.5 h-3.5" />
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent>Copy key</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-slate-600 hidden lg:table-cell">
                          {l.phone ? (
                            <span className="flex items-center gap-1.5">
                              <Phone className="w-3 h-3 text-slate-400" />
                              {l.phone}
                            </span>
                          ) : '—'}
                        </TableCell>
                        <TableCell>
                          {blocked ? (
                            <Badge className="bg-red-100 text-red-700 text-xs border-0">
                              <Lock className="w-3 h-3 mr-1" /> Blocked
                            </Badge>
                          ) : (
                            <Badge className="bg-emerald-100 text-emerald-700 text-xs border-0">Active</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-0.5">
                            {blocked ? (
                              <TooltipProvider delayDuration={300}>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                      onClick={() => { setBlockTarget(l); setBlockAction('unblock'); setBlockOpen(true); }}>
                                      <Unlock className="w-3.5 h-3.5" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Unblock</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            ) : (
                              <TooltipProvider delayDuration={300}>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                                      onClick={() => { setBlockTarget(l); setBlockAction('block'); setBlockOpen(true); }}>
                                      <Lock className="w-3.5 h-3.5" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Block</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                            <TooltipProvider delayDuration={300}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-slate-100"
                                    onClick={() => openEditForm(l)}>
                                    <Pencil className="w-3.5 h-3.5" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Edit</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            <TooltipProvider delayDuration={300}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                                    onClick={() => { setDeleteTarget(l); setDeleteOpen(true); }}>
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Delete</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Mobile View */}
            <div className="md:hidden divide-y divide-slate-100">
              {loading ? Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-10 h-10 rounded-full" />
                    <div className="flex-1 space-y-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                </div>
              )) : librarians.length === 0 ? (
                <div className="text-center py-16 text-slate-400">
                  <BookOpen className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="font-medium">No librarians found</p>
                </div>
              ) : librarians.map(l => {
                const blocked = l.block_limit === 3;
                return (
                  <div key={l.librarian_id} className={`p-4 space-y-3 ${blocked ? 'opacity-70 bg-red-50/30' : ''}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${blocked ? 'bg-red-100 text-red-700' : 'bg-violet-100 text-violet-700'}`}>
                          {l.name?.charAt(0) || 'L'}
                        </div>
                        <div>
                          <p className="font-medium text-sm text-slate-900">{l.name}</p>
                          <p className="text-xs text-slate-500">{l.email || '—'}</p>
                        </div>
                      </div>
                      {blocked ? (
                        <Badge className="bg-red-100 text-red-700 text-xs border-0"><Lock className="w-3 h-3 mr-1" /> Blocked</Badge>
                      ) : (
                        <Badge className="bg-emerald-100 text-emerald-700 text-xs border-0">Active</Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                      {l.phone && (
                        <span className="flex items-center gap-1"><Phone className="w-3 h-3 text-slate-400" /> {l.phone}</span>
                      )}
                      {l.address && (
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-slate-400" /> {l.address}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-2">
                      <KeyRound className="w-3 h-3 text-slate-400" />
                      <code className="font-mono font-bold tracking-widest">
                        {viewKey === l.librarian_id ? l.authentication_key : '••••••'}
                      </code>
                      <button onClick={() => setViewKey(viewKey === l.librarian_id ? null : l.librarian_id)} className="ml-auto text-slate-400">
                        {viewKey === l.librarian_id ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      </button>
                      <button onClick={() => copyKey(l.authentication_key)} className="text-slate-400">
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      {blocked ? (
                        <Button variant="outline" size="sm" className="flex-1 h-9 text-xs text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                          onClick={() => { setBlockTarget(l); setBlockAction('unblock'); setBlockOpen(true); }}>
                          <Unlock className="w-3 h-3 mr-1" /> Unblock
                        </Button>
                      ) : (
                        <Button variant="outline" size="sm" className="flex-1 h-9 text-xs text-amber-600 border-amber-200 hover:bg-amber-50"
                          onClick={() => { setBlockTarget(l); setBlockAction('block'); setBlockOpen(true); }}>
                          <Lock className="w-3 h-3 mr-1" /> Block
                        </Button>
                      )}
                      <Button variant="outline" size="sm" className="flex-1 h-9 text-xs" onClick={() => openEditForm(l)}>
                        <Pencil className="w-3 h-3 mr-1" /> Edit
                      </Button>
                      <Button variant="outline" size="sm" className="h-9 w-9 text-xs text-red-600 border-red-200 hover:bg-red-50 p-0"
                        onClick={() => { setDeleteTarget(l); setDeleteOpen(true); }}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add/Edit Form Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {editing ? (
                <><Pencil className="w-5 h-5 text-amber-600" /> Edit Librarian</>
              ) : (
                <><Plus className="w-5 h-5 text-violet-600" /> Add New Librarian</>
              )}
            </DialogTitle>
            <DialogDescription>
              {editing ? 'Update librarian account details' : 'Create a new librarian account for library management'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label className="text-xs font-medium">Full Name <span className="text-red-500">*</span></Label>
              <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="mt-1.5" placeholder="Librarian full name" />
            </div>
            <div>
              <Label className="text-xs font-medium">Email</Label>
              <div className="relative mt-1.5">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="pl-10" placeholder="librarian@school.com" />
              </div>
            </div>
            <div>
              <Label className="text-xs font-medium">Phone</Label>
              <div className="relative mt-1.5">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="pl-10" placeholder="+233..." />
              </div>
            </div>
            <div>
              <Label className="text-xs font-medium">Address</Label>
              <div className="relative mt-1.5">
                <MapPin className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <textarea
                  value={formData.address}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Residential or office address"
                  className="w-full min-h-[72px] rounded-md border border-input bg-background px-3 py-2 pl-10 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
              </div>
            </div>
            <div>
              <Label className="text-xs font-medium">
                {editing ? 'New Password (leave blank to keep)' : 'Password'} {!editing && <span className="text-red-500">*</span>}
              </Label>
              <div className="relative mt-1.5">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                  placeholder={editing ? 'Leave blank to keep current' : 'Set a secure password'}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            {editing && (
              <div className="bg-violet-50 border border-violet-200 rounded-lg p-3">
                <p className="text-xs text-slate-500 mb-1">Current Authentication Key</p>
                <code className="text-sm font-mono font-bold tracking-widest text-violet-800">{editing.authentication_key}</code>
              </div>
            )}
          </div>
          <DialogFooter className="gap-2 pt-2">
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button
              onClick={handleSave}
              disabled={saving || !formData.name || (!editing && !formData.password)}
              className="bg-violet-600 hover:bg-violet-700 min-w-[120px]"
            >
              {saving ? 'Saving...' : editing ? 'Update Librarian' : 'Create Librarian'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-700">
              <Trash2 className="w-5 h-5" /> Delete Librarian
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently remove <strong className="text-slate-900">{deleteTarget?.name}</strong>?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">Delete Permanently</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Block/Unblock Confirmation */}
      <AlertDialog open={blockOpen} onOpenChange={setBlockOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              {blockAction === 'block' ? (
                <><Lock className="w-5 h-5 text-amber-600" /> Block Librarian</>
              ) : (
                <><Unlock className="w-5 h-5 text-emerald-600" /> Unblock Librarian</>
              )}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {blockAction === 'block'
                ? <>Are you sure you want to block <strong className="text-slate-900">{blockTarget?.name}</strong>? They will not be able to log in until unblocked.</>
                : <>Are you sure you want to unblock <strong className="text-slate-900">{blockTarget?.name}</strong>? They will regain access immediately.</>}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBlock}
              className={blockAction === 'block' ? 'bg-amber-600 hover:bg-amber-700' : 'bg-emerald-600 hover:bg-emerald-700'}
            >
              {blockAction === 'block' ? 'Block Account' : 'Unblock Account'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
