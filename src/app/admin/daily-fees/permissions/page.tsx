'use client';

import { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  Shield, Plus, Search, Save, Loader2, Users, CreditCard,
  DollarSign, CheckCircle, XCircle, UserCheck, UserX, Ban,
} from 'lucide-react';

interface AdminItem { admin_id: number; name: string; email: string; phone: string; level: string; can_collect_daily_fees: number; collection_point: string; }
interface TeacherItem { teacher_id: number; name: string; teacher_code: string; email: string; phone: string; active_status: number; }
interface FeeType { type: string; label: string; }

const FEE_TYPES: FeeType[] = [
  { type: 'feeding', label: 'Feeding' },
  { type: 'breakfast', label: 'Breakfast' },
  { type: 'classes', label: 'Classes' },
  { type: 'water', label: 'Water' },
  { type: 'transport', label: 'Transport' },
];

interface Permission {
  id: number;
  user_type: 'admin' | 'teacher';
  user_id: number;
  user_name: string;
  fee_types: string[];
  collection_point: string;
  is_active: boolean;
}

export default function FeePermissionsPage() {
  const [admins, setAdmins] = useState<AdminItem[]>([]);
  const [teachers, setTeachers] = useState<TeacherItem[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [search, setSearch] = useState('');

  const [selectedUserType, setSelectedUserType] = useState<'admin' | 'teacher'>('admin');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedFeeTypes, setSelectedFeeTypes] = useState<string[]>([]);
  const [collectionPoint, setCollectionPoint] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [adminRes, teacherRes, permRes] = await Promise.all([
        fetch('/api/admins'),
        fetch('/api/teachers'),
        fetch('/api/admin/daily-fees/permissions'),
      ]);
      const adminData = await adminRes.json();
      const teacherData = await teacherRes.json();
      const permData = await permRes.json();
      setAdmins(Array.isArray(adminData) ? adminData : []);
      setTeachers(Array.isArray(teacherData) ? teacherData : []);
      setPermissions(Array.isArray(permData) ? permData : []);
    } catch {
      toast.error('Failed to load data');
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openDialog = () => {
    setSelectedUserType('admin');
    setSelectedUserId('');
    setSelectedFeeTypes([]);
    setCollectionPoint('');
    setDialogOpen(true);
  };

  const toggleFeeType = (type: string) => {
    setSelectedFeeTypes(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]);
  };

  const handleSave = async () => {
    if (!selectedUserId) return toast.error('Please select a user');
    if (selectedFeeTypes.length === 0) return toast.error('Select at least one fee type');
    setSaving(true);
    try {
      const res = await fetch('/api/admin/daily-fees/permissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_type: selectedUserType,
          user_id: parseInt(selectedUserId),
          fee_types: selectedFeeTypes,
          collection_point: collectionPoint,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast.success('Permission saved');
      setDialogOpen(false);
      fetchData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save';
      toast.error(msg);
    }
    setSaving(false);
  };

  const toggleActive = async (perm: Permission) => {
    try {
      await fetch('/api/admin/daily-fees/permissions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: perm.id, is_active: !perm.is_active }),
      });
      toast.success('Permission updated');
      fetchData();
    } catch {
      toast.error('Failed to update');
    }
  };

  const availableUsers = selectedUserType === 'admin' ? admins.filter(a => a.active_status === 1) : teachers.filter(t => t.active_status === 1);
  const existingUserIds = new Set(permissions.filter(p => p.user_type === selectedUserType && p.is_active).map(p => p.user_id));
  const filteredPermissions = permissions.filter(p =>
    search === '' || p.user_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div><h1 className="text-2xl font-bold text-slate-900 tracking-tight">Fee Collection Permissions</h1><p className="text-sm text-slate-500 mt-1">Control who can collect which types of daily fees</p></div>
          <Button onClick={openDialog} className="bg-emerald-600 hover:bg-emerald-700 min-h-[44px]"><Plus className="w-4 h-4 mr-2" />Assign Permission</Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-slate-200/60"><CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center"><Shield className="w-5 h-5 text-emerald-600" /></div>
            <div><p className="text-xs text-slate-500">Total Permissions</p><p className="text-xl font-bold">{permissions.length}</p></div>
          </CardContent></Card>
          <Card className="border-slate-200/60"><CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-sky-100 flex items-center justify-center"><CheckCircle className="w-5 h-5 text-sky-600" /></div>
            <div><p className="text-xs text-slate-500">Active</p><p className="text-xl font-bold">{permissions.filter(p => p.is_active).length}</p></div>
          </CardContent></Card>
          <Card className="border-slate-200/60"><CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center"><CreditCard className="w-5 h-5 text-amber-600" /></div>
            <div><p className="text-xs text-slate-500">Fee Types</p><p className="text-xl font-bold">{FEE_TYPES.length}</p></div>
          </CardContent></Card>
          <Card className="border-slate-200/60"><CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center"><Users className="w-5 h-5 text-violet-600" /></div>
            <div><p className="text-xs text-slate-500">Admins</p><p className="text-xl font-bold">{admins.length}</p></div>
          </CardContent></Card>
        </div>

        {/* Search */}
        <Card className="border-slate-200/60"><CardContent className="p-4">
          <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><Input placeholder="Search by name..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 min-h-[44px]" /></div>
        </CardContent></Card>

        {/* Permissions Table */}
        <Card className="border-slate-200/60"><CardContent className="p-0">
          <div className="max-h-[500px] overflow-y-auto">
            <Table>
              <TableHeader><TableRow className="bg-slate-50">
                <TableHead className="w-12">#</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Fee Types</TableHead>
                <TableHead>Collection Point</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-24">Toggle</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {loading ? Array.from({ length: 5 }).map((_, i) => <TableRow key={i}><TableCell colSpan={7}><Skeleton className="h-10" /></TableCell></TableRow>) :
                  filteredPermissions.length === 0 ? <TableRow><TableCell colSpan={7} className="text-center py-12 text-slate-400"><Shield className="w-10 h-10 mx-auto mb-2 opacity-50" /><p className="font-medium">No permissions configured</p><p className="text-xs mt-1">Assign fee collection permissions to admins or teachers</p></TableCell></TableRow> :
                    filteredPermissions.map((perm, i) => (
                      <TableRow key={perm.id}>
                        <TableCell className="text-xs text-slate-400">{i + 1}</TableCell>
                        <TableCell><div><p className="font-medium text-sm">{perm.user_name}</p></div></TableCell>
                        <TableCell><Badge variant="outline" className="text-xs">{perm.user_type === 'admin' ? 'Admin' : 'Teacher'}</Badge></TableCell>
                        <TableCell><div className="flex flex-wrap gap-1">{perm.fee_types.map(t => <Badge key={t} className="bg-emerald-100 text-emerald-700 text-[10px]">{t}</Badge>)}</div></TableCell>
                        <TableCell className="text-sm">{perm.collection_point || '—'}</TableCell>
                        <TableCell><Badge className={`${perm.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'} text-xs`}>{perm.is_active ? 'Active' : 'Disabled'}</Badge></TableCell>
                        <TableCell>
                          <Switch checked={perm.is_active} onCheckedChange={() => toggleActive(perm)} />
                        </TableCell>
                      </TableRow>
                    ))}
              </TableBody>
            </Table>
          </div>
        </CardContent></Card>
      </div>

      {/* Assign Permission Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Assign Fee Collection Permission</DialogTitle><DialogDescription>Select a user and the fee types they can collect</DialogDescription></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label className="text-xs font-medium text-slate-700">User Type</Label>
              <Select value={selectedUserType} onValueChange={v => { setSelectedUserType(v as 'admin' | 'teacher'); setSelectedUserId(''); }}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="admin">Admin</SelectItem><SelectItem value="teacher">Teacher</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label className="text-xs font-medium text-slate-700">Select User *</Label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Choose user..." /></SelectTrigger>
                <SelectContent className="max-h-60">
                  {availableUsers.map(u => (
                    <SelectItem key={selectedUserType === 'admin' ? (u as AdminItem).admin_id : (u as TeacherItem).teacher_id} value={(selectedUserType === 'admin' ? (u as AdminItem).admin_id : (u as TeacherItem).teacher_id).toString()}>
                      {u.name} {existingUserIds.has(selectedUserType === 'admin' ? (u as AdminItem).admin_id : (u as TeacherItem).teacher_id) ? '(already assigned)' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label className="text-xs font-medium text-slate-700">Fee Types *</Label>
              <div className="flex flex-wrap gap-2">
                {FEE_TYPES.map(ft => (
                  <button key={ft.type} type="button" onClick={() => toggleFeeType(ft.type)} className={`px-3 py-1.5 rounded-lg border-2 text-xs font-medium transition-colors ${selectedFeeTypes.includes(ft.type) ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}>
                    {selectedFeeTypes.includes(ft.type) && <CheckCircle className="w-3 h-3 mr-1 inline" />}{ft.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid gap-2"><Label className="text-xs font-medium text-slate-700">Collection Point</Label><Input value={collectionPoint} onChange={e => setCollectionPoint(e.target.value)} placeholder="e.g. Main Gate, Front Desk" className="h-9 text-sm" /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button><Button onClick={handleSave} disabled={saving || !selectedUserId || selectedFeeTypes.length === 0} className="bg-emerald-600 hover:bg-emerald-700">{saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}Assign</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
