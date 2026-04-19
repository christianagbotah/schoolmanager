'use client';

import { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import {
  Search, Plus, Pencil, Trash2, Shield, ChevronLeft, ChevronRight,
  KeyRound, Lock, Unlock, Eye, EyeOff, Copy, UserCog, Users,
  ShieldCheck, ShieldAlert, CircleDot, X,
} from 'lucide-react';

interface Admin {
  admin_id: number; admin_code: string; name: string; first_name: string;
  other_name: string; last_name: string; email: string; phone: string;
  gender: string; level: string; active_status: number;
  authentication_key: string; account_number: string; block_limit: number;
  can_collect_daily_fees: number; collection_point: string; transport_only: number;
}

interface AdminStats {
  total: number; blocked: number; active: number; inactive: number;
}

const ADMIN_LEVELS = [
  { value: '1', label: 'Super Administrator', icon: ShieldCheck, color: 'bg-red-100 text-red-700 border-red-200', dot: 'bg-red-500' },
  { value: '2', label: 'Administrator', icon: Shield, color: 'bg-emerald-100 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  { value: '3', label: 'Accountant', icon: UserCog, color: 'bg-sky-100 text-sky-700 border-sky-200', dot: 'bg-sky-500' },
  { value: '4', label: 'Cashier', icon: CircleDot, color: 'bg-amber-100 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
  { value: '5', label: 'Conductor', icon: ShieldAlert, color: 'bg-violet-100 text-violet-700 border-violet-200', dot: 'bg-violet-500' },
];

function getLevelBadge(level: string) {
  const l = ADMIN_LEVELS.find(x => x.value === level);
  return l ? l.label : `Level ${level}`;
}

function getLevelColor(level: string) {
  const l = ADMIN_LEVELS.find(x => x.value === level);
  return l ? l.color : 'bg-slate-100 text-slate-600 border-slate-200';
}

function getLevelIcon(level: string) {
  const l = ADMIN_LEVELS.find(x => x.value === level);
  return l ? l.icon : Shield;
}

// ─── Page Skeleton ──────────────────────────────────────────────
function AdminsSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header skeleton */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div className="space-y-1.5">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-56" />
        </div>
        <Skeleton className="h-11 w-36" />
      </div>
      {/* Stat card skeletons */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[88px] rounded-2xl" />
        ))}
      </div>
      {/* Filter bar skeleton */}
      <Skeleton className="h-14 rounded-2xl" />
      {/* Table skeleton */}
      <div className="rounded-2xl border">
        <Skeleton className="h-10 w-full rounded-t-2xl" />
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    </div>
  );
}

export default function AdminsPage() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [stats, setStats] = useState<AdminStats>({ total: 0, blocked: 0, active: 0, inactive: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(15);
  const [viewKey, setViewKey] = useState<number | null>(null);

  // Form state
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Admin | null>(null);
  const [formSaving, setFormSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '', other_name: '', last_name: '', email: '', phone: '',
    gender: '', level: '', password: '', account_number: '',
  });

  // Dialog states
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Admin | null>(null);
  const [blockOpen, setBlockOpen] = useState(false);
  const [blockTarget, setBlockTarget] = useState<Admin | null>(null);
  const [blockAction, setBlockAction] = useState<'block' | 'unblock'>('block');

  // Simulated current admin level (level 1 = super admin)
  const currentAdminLevel = '1';

  const fetchAdmins = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (levelFilter !== 'all') params.set('level', levelFilter);
      const res = await fetch(`/api/admin/admins?${params}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setAdmins(Array.isArray(data.data) ? data.data : []);
      if (data.stats) setStats(data.stats);
    } catch (err: any) { toast.error(err.message || 'Failed to load admins'); } finally { setLoading(false); }
  }, [search, statusFilter, levelFilter]);

  useEffect(() => { fetchAdmins(); }, [fetchAdmins]);
  useEffect(() => { setPage(1); }, [search, statusFilter, levelFilter]);

  const openAddForm = () => {
    setEditing(null);
    setFormData({ first_name: '', other_name: '', last_name: '', email: '', phone: '', gender: '', level: '', password: '', account_number: '' });
    setFormOpen(true);
  };

  const openEditForm = (a: Admin) => {
    setEditing(a);
    setFormData({
      first_name: a.first_name || '', other_name: a.other_name || '',
      last_name: a.last_name || '', email: a.email, phone: a.phone,
      gender: a.gender || '', level: a.level || '', password: '', account_number: a.account_number || '',
    });
    setFormOpen(true);
  };

  const handleSave = async () => {
    const fullName = [formData.first_name, formData.other_name, formData.last_name].filter(Boolean).join(' ');
    if (!fullName.trim() || !formData.email.trim()) { toast.error('Name and email are required'); return; }
    if (!formData.level) { toast.error('Designation level is required'); return; }
    if (!editing && !formData.password) { toast.error('Password is required for new admin'); return; }

    setFormSaving(true);
    try {
      const url = editing ? `/api/admin/admins/${editing.admin_id}` : '/api/admin/admins';
      const res = await fetch(url, {
        method: editing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, name: fullName }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast.success(editing ? 'Admin updated successfully' : 'Admin created successfully');
      setFormOpen(false); fetchAdmins();
    } catch (err: any) { toast.error(err.message); } finally { setFormSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/admin/admins/${deleteTarget.admin_id}`, { method: 'DELETE' });
      const data = await res.json(); if (data.error) throw new Error(data.error);
      toast.success('Admin removed permanently'); setDeleteOpen(false); fetchAdmins();
    } catch (err: any) { toast.error(err.message); }
  };

  const handleBlock = async () => {
    if (!blockTarget) return;
    try {
      const res = await fetch(`/api/admin/admins/${blockTarget.admin_id}?action=${blockAction}`, { method: 'DELETE' });
      const data = await res.json(); if (data.error) throw new Error(data.error);
      toast.success(data.message);
      setBlockOpen(false); fetchAdmins();
    } catch (err: any) { toast.error(err.message); }
  };

  const copyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    toast.success('Auth key copied to clipboard');
  };

  const totalPages = Math.max(1, Math.ceil(admins.length / pageSize));
  const paged = admins.slice((page - 1) * pageSize, page * pageSize);
  const hasActiveFilters = search || statusFilter !== 'all' || levelFilter !== 'all';

  const isBlocked = (a: Admin) => a.block_limit === 3;

  return (
    <DashboardLayout>
      {loading && admins.length === 0 && !stats.total ? (
        <AdminsSkeleton />
      ) : (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Manage Administrators</h1>
              <p className="text-sm text-slate-500 mt-0.5">System admin users, access levels & authentication keys</p>
            </div>
            {currentAdminLevel === '1' && (
              <Button onClick={openAddForm} className="bg-emerald-600 hover:bg-emerald-700 min-h-[44px] shadow-sm">
                <Plus className="w-4 h-4 mr-2" /> Add New Admin
              </Button>
            )}
          </div>

          {/* Stat Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {/* Total */}
            <div className="bg-white rounded-2xl border border-slate-200/60 p-4 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200 border-l-4 border-l-slate-500">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-500 flex items-center justify-center flex-shrink-0">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Total Admins</p>
                  <p className="text-2xl font-bold text-slate-900 tabular-nums">{stats.total}</p>
                </div>
              </div>
            </div>
            {/* Active */}
            <div className="bg-white rounded-2xl border border-slate-200/60 p-4 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200 border-l-4 border-l-emerald-500">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center flex-shrink-0">
                  <ShieldCheck className="w-5 h-5 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Active</p>
                  <p className="text-2xl font-bold text-emerald-600 tabular-nums">{stats.active}</p>
                </div>
              </div>
            </div>
            {/* Blocked */}
            <div className="bg-white rounded-2xl border border-slate-200/60 p-4 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200 border-l-4 border-l-red-500">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-500 flex items-center justify-center flex-shrink-0">
                  <Lock className="w-5 h-5 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Blocked</p>
                  <p className="text-2xl font-bold text-red-600 tabular-nums">{stats.blocked}</p>
                </div>
              </div>
            </div>
            {/* Inactive */}
            <div className="bg-white rounded-2xl border border-slate-200/60 p-4 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200 border-l-4 border-l-amber-500">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center flex-shrink-0">
                  <ShieldAlert className="w-5 h-5 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Inactive</p>
                  <p className="text-2xl font-bold text-amber-600 tabular-nums">{stats.inactive}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Search & Filters */}
          <div className="bg-white rounded-2xl border border-slate-200/60 p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search admins by name, email, phone, or code..."
                  value={search} onChange={e => setSearch(e.target.value)}
                  className="pl-10 min-h-[44px] bg-slate-50 border-slate-200 focus:bg-white"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-40 min-h-[44px] bg-slate-50 border-slate-200 focus:bg-white">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="blocked">Blocked</SelectItem>
                </SelectContent>
              </Select>
              <Select value={levelFilter} onValueChange={setLevelFilter}>
                <SelectTrigger className="w-full sm:w-48 min-h-[44px] bg-slate-50 border-slate-200 focus:bg-white">
                  <SelectValue placeholder="Designation" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  {ADMIN_LEVELS.map(l => (
                    <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Active filter chips */}
            {hasActiveFilters && (
              <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-slate-100">
                <span className="text-xs text-slate-400">Active filters:</span>
                {search && (
                  <Badge variant="outline" className="text-xs gap-1 bg-slate-50">
                    Search: &ldquo;{search}&rdquo;
                    <button onClick={() => setSearch('')} className="hover:text-red-600"><X className="w-3 h-3" /></button>
                  </Badge>
                )}
                {statusFilter !== 'all' && (
                  <Badge variant="outline" className="text-xs gap-1 capitalize bg-slate-50">
                    {statusFilter}
                    <button onClick={() => setStatusFilter('all')} className="hover:text-red-600"><X className="w-3 h-3" /></button>
                  </Badge>
                )}
                {levelFilter !== 'all' && (
                  <Badge variant="outline" className="text-xs gap-1 bg-slate-50">
                    {ADMIN_LEVELS.find(l => l.value === levelFilter)?.label || levelFilter}
                    <button onClick={() => setLevelFilter('all')} className="hover:text-red-600"><X className="w-3 h-3" /></button>
                  </Badge>
                )}
                <button onClick={() => { setSearch(''); setStatusFilter('all'); setLevelFilter('all'); }} className="text-xs text-slate-500 hover:text-red-600 ml-1">Clear all</button>
              </div>
            )}
          </div>

          {/* Admin Table */}
          <div className="rounded-2xl border border-slate-200/60 bg-white overflow-hidden">
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/80">
                    <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Full Name</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Email</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Auth Key</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wider hidden lg:table-cell">Phone</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Designation</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wider text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? Array.from({ length: 6 }).map((_, i) => (
                    <TableRow key={i}>{Array.from({ length: 7 }).map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                    ))}</TableRow>
                  )) : paged.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-16">
                        <div className="flex flex-col items-center">
                          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                            <Users className="w-8 h-8 text-slate-300" />
                          </div>
                          <p className="text-slate-500 font-medium">No admins found</p>
                          <p className="text-slate-400 text-xs mt-1">Try adjusting your search or filters</p>
                          {hasActiveFilters && (
                            <Button variant="outline" size="sm" onClick={() => { setSearch(''); setStatusFilter('all'); setLevelFilter('all'); }} className="mt-4 min-h-[44px]">
                              Clear Filters
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : paged.map(a => {
                    const blocked = isBlocked(a);
                    const LevelIcon = getLevelIcon(a.level);
                    return (
                      <TableRow key={a.admin_id} className={`hover:bg-slate-50/50 ${blocked ? 'opacity-70' : ''}`}>
                        <TableCell className="font-medium text-sm">
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold ${blocked ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                              {a.name?.charAt(0) || 'A'}
                            </div>
                            <div>
                              <p className="font-medium text-slate-900">{a.name}</p>
                              <p className="text-xs text-slate-400 font-mono">{a.admin_code}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-slate-600">{a.email || '—'}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <code className="text-xs font-mono font-bold tracking-widest text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                              {viewKey === a.admin_id ? a.authentication_key : '••••••'}
                            </code>
                            <TooltipProvider delayDuration={300}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button onClick={() => setViewKey(viewKey === a.admin_id ? null : a.admin_id)} className="text-slate-400 hover:text-slate-600 transition-colors min-h-[44px] min-w-[32px] flex items-center justify-center">
                                    {viewKey === a.admin_id ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent>{viewKey === a.admin_id ? 'Hide' : 'Show'}</TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button onClick={() => copyKey(a.authentication_key)} className="text-slate-400 hover:text-slate-600 transition-colors min-h-[44px] min-w-[32px] flex items-center justify-center">
                                    <Copy className="w-3.5 h-3.5" />
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent>Copy key</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-slate-600 hidden lg:table-cell">{a.phone || '—'}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`text-xs font-medium ${getLevelColor(a.level)}`}>
                            <LevelIcon className="w-3 h-3 mr-1" />
                            {getLevelBadge(a.level)}
                          </Badge>
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
                                    <Button variant="ghost" size="icon" className="min-w-[32px] h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                      onClick={() => { setBlockTarget(a); setBlockAction('unblock'); setBlockOpen(true); }}>
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
                                    <Button variant="ghost" size="icon" className="min-w-[32px] h-8 w-8 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                                      onClick={() => { setBlockTarget(a); setBlockAction('block'); setBlockOpen(true); }}>
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
                                  <Button variant="ghost" size="icon" className="min-w-[32px] h-8 w-8 hover:bg-slate-100" onClick={() => openEditForm(a)}>
                                    <Pencil className="w-3.5 h-3.5" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Edit</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            <TooltipProvider delayDuration={300}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="icon" className="min-w-[32px] h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                                    onClick={() => { setDeleteTarget(a); setDeleteOpen(true); }}>
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
              {loading ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-10 h-10 rounded-full" />
                    <div className="flex-1 space-y-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                  <Skeleton className="h-3 w-full" />
                </div>
              )) : paged.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8 text-slate-300" />
                  </div>
                  <p className="text-slate-500 font-medium">No admins found</p>
                </div>
              ) : paged.map(a => {
                const blocked = isBlocked(a);
                const LevelIcon = getLevelIcon(a.level);
                return (
                  <div key={a.admin_id} className={`p-4 space-y-3 ${blocked ? 'opacity-70 bg-red-50/30' : ''}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${blocked ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                          {a.name?.charAt(0) || 'A'}
                        </div>
                        <div>
                          <p className="font-medium text-sm text-slate-900">{a.name}</p>
                          <p className="text-xs text-slate-500">{a.email}</p>
                        </div>
                      </div>
                      {blocked ? (
                        <Badge className="bg-red-100 text-red-700 text-xs border-0"><Lock className="w-3 h-3 mr-1" /> Blocked</Badge>
                      ) : (
                        <Badge className="bg-emerald-100 text-emerald-700 text-xs border-0">Active</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <Badge variant="outline" className={`text-xs font-medium ${getLevelColor(a.level)}`}>
                        <LevelIcon className="w-3 h-3 mr-1" />
                        {getLevelBadge(a.level)}
                      </Badge>
                      {a.phone && <span className="text-slate-400">• {a.phone}</span>}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-2">
                      <KeyRound className="w-3 h-3 text-slate-400" />
                      <code className="font-mono font-bold tracking-widest">
                        {viewKey === a.admin_id ? a.authentication_key : '••••••'}
                      </code>
                      <button onClick={() => setViewKey(viewKey === a.admin_id ? null : a.admin_id)} className="ml-auto text-slate-400 min-h-[44px] min-w-[32px] flex items-center justify-center">
                        {viewKey === a.admin_id ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      </button>
                      <button onClick={() => copyKey(a.authentication_key)} className="text-slate-400 min-h-[44px] min-w-[32px] flex items-center justify-center">
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      {blocked ? (
                        <Button variant="outline" size="sm" className="flex-1 h-11 text-xs text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                          onClick={() => { setBlockTarget(a); setBlockAction('unblock'); setBlockOpen(true); }}>
                          <Unlock className="w-3 h-3 mr-1" /> Unblock
                        </Button>
                      ) : (
                        <Button variant="outline" size="sm" className="flex-1 h-11 text-xs text-amber-600 border-amber-200 hover:bg-amber-50"
                          onClick={() => { setBlockTarget(a); setBlockAction('block'); setBlockOpen(true); }}>
                          <Lock className="w-3 h-3 mr-1" /> Block
                        </Button>
                      )}
                      <Button variant="outline" size="sm" className="flex-1 h-11 text-xs" onClick={() => openEditForm(a)}>
                        <Pencil className="w-3 h-3 mr-1" /> Edit
                      </Button>
                      <Button variant="outline" size="sm" className="h-11 w-11 text-xs text-red-600 border-red-200 hover:bg-red-50 p-0"
                        onClick={() => { setDeleteTarget(a); setDeleteOpen(true); }}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
                <p className="text-xs text-slate-500">
                  Showing {((page - 1) * pageSize) + 1}–{Math.min(page * pageSize, admins.length)} of {admins.length} admin(s)
                </p>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="icon" className="h-9 w-9 min-w-[36px]" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-sm px-3 font-medium">{page} / {totalPages}</span>
                  <Button variant="outline" size="icon" className="h-9 w-9 min-w-[36px]" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add/Edit Form Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${editing ? 'bg-amber-100' : 'bg-emerald-100'}`}>
                {editing ? <Pencil className="w-4 h-4 text-amber-600" /> : <Plus className="w-4 h-4 text-emerald-600" />}
              </div>
              {editing ? 'Edit Administrator' : 'Add New Administrator'}
            </DialogTitle>
            <DialogDescription>
              {editing ? 'Update admin account details and permissions' : 'Create a new administrator account with access level'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            {/* Name fields */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs font-medium">First Name <span className="text-red-500">*</span></Label>
                <Input placeholder="John" value={formData.first_name} onChange={e => setFormData({ ...formData, first_name: e.target.value })} className="mt-1.5 min-h-[44px]" />
              </div>
              <div>
                <Label className="text-xs font-medium">Other Name</Label>
                <Input placeholder="Middle" value={formData.other_name} onChange={e => setFormData({ ...formData, other_name: e.target.value })} className="mt-1.5 min-h-[44px]" />
              </div>
              <div>
                <Label className="text-xs font-medium">Last Name <span className="text-red-500">*</span></Label>
                <Input placeholder="Doe" value={formData.last_name} onChange={e => setFormData({ ...formData, last_name: e.target.value })} className="mt-1.5 min-h-[44px]" />
              </div>
            </div>
            {/* Email & Phone */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-medium">Email <span className="text-red-500">*</span></Label>
                <Input type="email" placeholder="admin@school.com" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="mt-1.5 min-h-[44px]" />
              </div>
              <div>
                <Label className="text-xs font-medium">Phone</Label>
                <Input placeholder="+233..." value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="mt-1.5 min-h-[44px]" />
              </div>
            </div>
            {/* Gender & Level */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-medium">Gender</Label>
                <Select value={formData.gender} onValueChange={v => setFormData({ ...formData, gender: v })}>
                  <SelectTrigger className="mt-1.5 min-h-[44px]"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-medium">Designation <span className="text-red-500">*</span></Label>
                <Select value={formData.level} onValueChange={v => setFormData({ ...formData, level: v })}>
                  <SelectTrigger className="mt-1.5 min-h-[44px]"><SelectValue placeholder="Select Level" /></SelectTrigger>
                  <SelectContent>
                    {ADMIN_LEVELS.map(l => (
                      <SelectItem key={l.value} value={l.value}>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${l.dot}`} />
                          {l.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {/* Account Number */}
            <div>
              <Label className="text-xs font-medium">Account Number</Label>
              <Input placeholder="Bank account number" value={formData.account_number} onChange={e => setFormData({ ...formData, account_number: e.target.value })} className="mt-1.5 min-h-[44px]" />
            </div>
            {/* Password */}
            <div>
              <Label className="text-xs font-medium">
                {editing ? 'New Password (leave blank to keep current)' : 'Password'} {!editing && <span className="text-red-500">*</span>}
              </Label>
              <div className="relative mt-1.5">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder={editing ? 'Leave blank to keep current password' : 'Set a secure password'}
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                  className="min-h-[44px]"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 min-h-[44px] min-w-[32px] flex items-center justify-center">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            {/* Editing info */}
            {editing && (
              <div className="bg-sky-50 border border-sky-200 rounded-lg p-3">
                <p className="text-xs text-slate-500 mb-1">Current Authentication Key</p>
                <code className="text-sm font-mono font-bold tracking-widest text-sky-800">{editing.authentication_key}</code>
              </div>
            )}
          </div>
          <DialogFooter className="gap-2 pt-2">
            <Button variant="outline" onClick={() => setFormOpen(false)} className="min-h-[44px]">Cancel</Button>
            <Button
              onClick={handleSave}
              disabled={formSaving || !formData.first_name || !formData.last_name || !formData.email || !formData.level || (!editing && !formData.password)}
              className="bg-emerald-600 hover:bg-emerald-700 min-w-[120px] min-h-[44px]"
            >
              {formSaving ? 'Saving...' : editing ? 'Update Admin' : 'Create Admin'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                <Trash2 className="w-4 h-4 text-red-600" />
              </div>
              Delete Administrator
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently remove <strong className="text-slate-900">{deleteTarget?.name}</strong>?
              This action cannot be undone and all their data will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="min-h-[44px]">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 min-h-[44px]">Delete Permanently</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Block/Unblock Confirmation */}
      <AlertDialog open={blockOpen} onOpenChange={setBlockOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${blockAction === 'block' ? 'bg-amber-100' : 'bg-emerald-100'}`}>
                {blockAction === 'block' ? <Lock className="w-4 h-4 text-amber-600" /> : <Unlock className="w-4 h-4 text-emerald-600" />}
              </div>
              {blockAction === 'block' ? 'Block Administrator' : 'Unblock Administrator'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {blockAction === 'block'
                ? <>Are you sure you want to block <strong className="text-slate-900">{blockTarget?.name}</strong>? They will not be able to log in until unblocked.</>
                : <>Are you sure you want to unblock <strong className="text-slate-900">{blockTarget?.name}</strong>? They will be able to log in again immediately.</>}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="min-h-[44px]">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBlock}
              className={`min-h-[44px] ${blockAction === 'block' ? 'bg-amber-600 hover:bg-amber-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}
            >
              {blockAction === 'block' ? 'Block Account' : 'Unblock Account'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
