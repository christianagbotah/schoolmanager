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
import { Search, Users, Eye, Pencil, Trash2, UserPlus, ChevronLeft, ChevronRight, GraduationCap, Phone, Mail } from 'lucide-react';

interface Teacher {
  teacher_id: number; name: string; email: string; phone: string; gender: string;
  blood_group: string; birthday: string; address: string; active_status: number;
  joining_date: string;
  department?: { id: number; dep_name: string };
  designation?: { id: number; des_name: string };
  classes?: { class_id: number; name: string }[];
  subjects?: { subject_id: number; name: string }[];
}
interface Department { id: number; dep_name: string; }
interface Designation { id: number; des_name: string; }

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(15);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [formSaving, setFormSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', gender: '', birthday: '',
    blood_group: '', address: '', department_id: '', designation_id: '', joining_date: '', password: '',
  });
  const [viewOpen, setViewOpen] = useState(false);
  const [viewTeacher, setViewTeacher] = useState<Teacher | null>(null);

  const fetchTeachers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (deptFilter) params.set('department_id', deptFilter);
      if (statusFilter) params.set('status', statusFilter);
      const res = await fetch(`/api/teachers?${params}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setTeachers(Array.isArray(data) ? data : []);
    } catch { toast.error('Failed to load teachers'); } finally { setLoading(false); }
  }, [search, deptFilter, statusFilter]);

  useEffect(() => { fetchTeachers(); }, [fetchTeachers]);
  useEffect(() => { const t = setTimeout(() => setPage(1), 400); return () => clearTimeout(t); }, [search, deptFilter, statusFilter]);
  useEffect(() => {
    fetch('/api/departments').then(r => r.json()).then(d => setDepartments(Array.isArray(d) ? d : [])).catch(() => {});
    fetch('/api/designations').then(r => r.json()).then(d => setDesignations(Array.isArray(d) ? d : [])).catch(() => {});
  }, []);

  const openAddForm = () => {
    setEditingTeacher(null);
    setFormData({ name: '', email: '', phone: '', gender: '', birthday: '', blood_group: '', address: '', department_id: '', designation_id: '', joining_date: '', password: '' });
    setFormOpen(true);
  };
  const openEditForm = (t: Teacher) => {
    setEditingTeacher(t);
    setFormData({ name: t.name, email: t.email, phone: t.phone, gender: t.gender || '', birthday: t.birthday ? t.birthday.split('T')[0] : '', blood_group: t.blood_group || '', address: t.address || '', department_id: t.department ? String(t.department.id) : '', designation_id: t.designation ? String(t.designation.id) : '', joining_date: t.joining_date ? t.joining_date.split('T')[0] : '', password: '' });
    setFormOpen(true);
  };
  const handleSave = async () => {
    if (!formData.name) { toast.error('Teacher name is required'); return; }
    setFormSaving(true);
    try {
      const url = editingTeacher ? `/api/teachers/${editingTeacher.teacher_id}` : '/api/teachers';
      const res = await fetch(url, { method: editingTeacher ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast.success(editingTeacher ? 'Teacher updated' : 'Teacher added');
      setFormOpen(false); fetchTeachers();
    } catch (err: any) { toast.error(err.message || 'Failed'); } finally { setFormSaving(false); }
  };
  const handleDelete = async (id: number) => {
    if (!confirm('Remove this teacher?')) return;
    try {
      const res = await fetch(`/api/teachers/${id}`, { method: 'DELETE' });
      const data = await res.json(); if (data.error) throw new Error(data.error);
      toast.success('Teacher removed'); fetchTeachers();
    } catch (err: any) { toast.error(err.message || 'Failed'); }
  };

  const totalPages = Math.max(1, Math.ceil(teachers.length / pageSize));
  const paged = teachers.slice((page - 1) * pageSize, page * pageSize);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Teachers</h1>
            <p className="text-sm text-slate-500 mt-1">Manage teaching staff and assignments</p>
          </div>
          <Button onClick={openAddForm} className="bg-emerald-600 hover:bg-emerald-700"><UserPlus className="w-4 h-4 mr-2" /> Add Teacher</Button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[{ icon: GraduationCap, label: 'Total', val: teachers.length, color: 'emerald' },
            { icon: Users, label: 'Active', val: teachers.filter(t => t.active_status === 1).length, color: 'emerald' },
            { icon: Phone, label: 'Depts', val: departments.length, color: 'blue' },
            { icon: Mail, label: 'Designations', val: designations.length, color: 'amber' }
          ].map((s, i) => (
            <Card key={i} className={`border-${s.color}-100`}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg bg-${s.color}-100 flex items-center justify-center`}><s.icon className={`w-5 h-5 text-${s.color}-600`} /></div>
                <div><p className="text-xs text-slate-500">{s.label}</p><p className="text-lg font-bold text-slate-900">{s.val}</p></div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col lg:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input placeholder="Search name or email..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
              </div>
              <Select value={deptFilter} onValueChange={v => v === '__all__' ? setDeptFilter('') : setDeptFilter(v)}>
                <SelectTrigger className="w-full lg:w-48"><SelectValue placeholder="All Departments" /></SelectTrigger>
                <SelectContent><SelectItem value="__all__">All</SelectItem>{departments.map(d => <SelectItem key={d.id} value={String(d.id)}>{d.dep_name}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={v => v === '__all__' ? setStatusFilter('') : setStatusFilter(v)}>
                <SelectTrigger className="w-full lg:w-40"><SelectValue placeholder="All Status" /></SelectTrigger>
                <SelectContent><SelectItem value="__all__">All</SelectItem><SelectItem value="1">Active</SelectItem><SelectItem value="0">Inactive</SelectItem></SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader><TableRow className="bg-slate-50">
                  <TableHead className="text-xs font-semibold">Name</TableHead>
                  <TableHead className="text-xs font-semibold">Designation</TableHead>
                  <TableHead className="text-xs font-semibold hidden lg:table-cell">Department</TableHead>
                  <TableHead className="text-xs font-semibold hidden lg:table-cell">Phone</TableHead>
                  <TableHead className="text-xs font-semibold">Email</TableHead>
                  <TableHead className="text-xs font-semibold">Status</TableHead>
                  <TableHead className="text-xs font-semibold text-right">Actions</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {loading ? Array.from({ length: 6 }).map((_, i) => <TableRow key={i}>{Array.from({ length: 7 }).map((_, j) => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}</TableRow>)
                  : paged.length === 0 ? <TableRow><TableCell colSpan={7} className="text-center py-12 text-slate-400"><GraduationCap className="w-10 h-10 mx-auto mb-2 opacity-50" /><p>No teachers found</p></TableCell></TableRow>
                  : paged.map(t => (
                    <TableRow key={t.teacher_id} className="hover:bg-slate-50/50">
                      <TableCell className="font-medium text-sm">{t.name}</TableCell>
                      <TableCell className="text-sm">{t.designation?.des_name || '—'}</TableCell>
                      <TableCell className="text-sm hidden lg:table-cell">{t.department?.dep_name || '—'}</TableCell>
                      <TableCell className="text-sm hidden lg:table-cell">{t.phone || '—'}</TableCell>
                      <TableCell className="text-sm text-slate-500">{t.email || '—'}</TableCell>
                      <TableCell><Badge variant="outline" className={t.active_status === 1 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}>{t.active_status === 1 ? 'Active' : 'Inactive'}</Badge></TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setViewTeacher(t); setViewOpen(true); }}><Eye className="w-3.5 h-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditForm(t)}><Pencil className="w-3.5 h-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => handleDelete(t.teacher_id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="md:hidden divide-y">
              {loading ? Array.from({ length: 4 }).map((_, i) => <div key={i} className="p-4"><Skeleton className="h-4 w-3/4" /></div>)
              : paged.length === 0 ? <div className="text-center py-12 text-slate-400"><p>No teachers found</p></div>
              : paged.map(t => (
                <div key={t.teacher_id} className="p-4 space-y-2">
                  <div className="flex items-start justify-between"><div><p className="font-medium text-sm">{t.name}</p><p className="text-xs text-slate-500">{t.designation?.des_name || ''}</p></div><Badge variant="outline" className={t.active_status === 1 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}>{t.active_status === 1 ? 'Active' : 'Inactive'}</Badge></div>
                  <div className="flex gap-2 pt-1">
                    <Button variant="outline" size="sm" className="flex-1 h-8 text-xs" onClick={() => { setViewTeacher(t); setViewOpen(true); }}><Eye className="w-3 h-3 mr-1" />View</Button>
                    <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => openEditForm(t)}><Pencil className="w-3 h-3" /></Button>
                  </div>
                </div>
              ))}
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t">
                <p className="text-xs text-slate-500">{teachers.length} teacher(s)</p>
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
          <DialogHeader><DialogTitle className="flex items-center gap-2"><UserPlus className="w-5 h-5 text-emerald-600" />{editingTeacher ? 'Edit Teacher' : 'Add New Teacher'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label className="text-xs">Full Name *</Label><Input placeholder="Teacher full name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="mt-1" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Email</Label><Input type="email" placeholder="Email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="mt-1" /></div>
              <div><Label className="text-xs">Phone</Label><Input placeholder="Phone" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="mt-1" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Gender</Label><Select value={formData.gender} onValueChange={v => setFormData({ ...formData, gender: v })}><SelectTrigger className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger><SelectContent><SelectItem value="male">Male</SelectItem><SelectItem value="female">Female</SelectItem></SelectContent></Select></div>
              <div><Label className="text-xs">Blood Group</Label><Select value={formData.blood_group} onValueChange={v => setFormData({ ...formData, blood_group: v })}><SelectTrigger className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => <SelectItem key={bg} value={bg}>{bg}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Date of Birth</Label><Input type="date" value={formData.birthday} onChange={e => setFormData({ ...formData, birthday: e.target.value })} className="mt-1" /></div>
              <div><Label className="text-xs">Joining Date</Label><Input type="date" value={formData.joining_date} onChange={e => setFormData({ ...formData, joining_date: e.target.value })} className="mt-1" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Department</Label><Select value={formData.department_id} onValueChange={v => setFormData({ ...formData, department_id: v })}><SelectTrigger className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{departments.map(d => <SelectItem key={d.id} value={String(d.id)}>{d.dep_name}</SelectItem>)}</SelectContent></Select></div>
              <div><Label className="text-xs">Designation</Label><Select value={formData.designation_id} onValueChange={v => setFormData({ ...formData, designation_id: v })}><SelectTrigger className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{designations.map(d => <SelectItem key={d.id} value={String(d.id)}>{d.des_name}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <div><Label className="text-xs">Address</Label><Input placeholder="Address" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} className="mt-1" /></div>
            {!editingTeacher && <div><Label className="text-xs">Password</Label><Input type="password" placeholder="Login password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} className="mt-1" /></div>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={formSaving || !formData.name} className="bg-emerald-600 hover:bg-emerald-700">{formSaving ? 'Saving...' : editingTeacher ? 'Update' : 'Add Teacher'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Teacher Profile</DialogTitle></DialogHeader>
          {viewTeacher && (
            <div className="space-y-3 text-sm">
              <div className="text-center pb-3 border-b">
                <div className="w-16 h-16 bg-emerald-100 rounded-full mx-auto flex items-center justify-center mb-2"><GraduationCap className="w-8 h-8 text-emerald-600" /></div>
                <p className="font-bold text-lg">{viewTeacher.name}</p>
                <p className="text-xs text-slate-500">{viewTeacher.designation?.des_name || ''} · {viewTeacher.department?.dep_name || ''}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><p className="text-xs text-slate-400">Email</p><p>{viewTeacher.email || '—'}</p></div>
                <div><p className="text-xs text-slate-400">Phone</p><p>{viewTeacher.phone || '—'}</p></div>
                <div><p className="text-xs text-slate-400">Gender</p><p className="capitalize">{viewTeacher.gender || '—'}</p></div>
                <div><p className="text-xs text-slate-400">Blood</p><p>{viewTeacher.blood_group || '—'}</p></div>
                <div><p className="text-xs text-slate-400">Joined</p><p>{viewTeacher.joining_date ? new Date(viewTeacher.joining_date).toLocaleDateString() : '—'}</p></div>
                <div><p className="text-xs text-slate-400">DOB</p><p>{viewTeacher.birthday ? new Date(viewTeacher.birthday).toLocaleDateString() : '—'}</p></div>
              </div>
              {viewTeacher.classes && viewTeacher.classes.length > 0 && <div className="border-t pt-3"><p className="text-xs text-slate-400 mb-1">Classes</p><div className="flex flex-wrap gap-1">{viewTeacher.classes.map(c => <Badge key={c.class_id} variant="outline" className="text-xs">{c.name}</Badge>)}</div></div>}
              {viewTeacher.subjects && viewTeacher.subjects.length > 0 && <div className="border-t pt-3"><p className="text-xs text-slate-400 mb-1">Subjects</p><div className="flex flex-wrap gap-1">{viewTeacher.subjects.map(s => <Badge key={s.subject_id} variant="outline" className="text-xs">{s.name}</Badge>)}</div></div>}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
