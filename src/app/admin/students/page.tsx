'use client';

import { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  Search, Plus, Download, Users, GraduationCap, ChevronLeft, ChevronRight,
  Eye, Pencil, Trash2, UserPlus,
} from 'lucide-react';
import Link from 'next/link';

interface Student {
  student_id: number;
  student_code: string;
  name: string;
  gender: string;
  dob: string;
  phone: string;
  address: string;
  photo: string;
  parent_id: number;
  class_id: number;
  section_id: number | null;
  dormitory_id: number | null;
  transport_route_id: number | null;
  admission_date: string;
  status: string;
  class?: { class_id: number; name: string };
  section?: { section_id: number; name: string };
  parent?: { parent_id: number; name: string; phone: string };
}

interface ClassOption {
  class_id: number;
  name: string;
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [classes, setClasses] = useState<ClassOption[]>([]);

  // Add/Edit Dialog
  const [formOpen, setFormOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [formSaving, setFormSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '', gender: 'male', dob: '', phone: '', address: '',
    class_id: '', parent_name: '', parent_phone: '', parent_email: '',
  });

  // View Dialog
  const [viewOpen, setViewOpen] = useState(false);
  const [viewStudent, setViewStudent] = useState<Student | null>(null);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (classFilter) params.set('classId', classFilter);
      if (statusFilter) params.set('status', statusFilter);
      params.set('page', String(page));
      params.set('limit', '15');

      const res = await fetch(`/api/students?${params}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setStudents(data.students || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotal(data.pagination?.total || 0);
    } catch {
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  }, [search, classFilter, statusFilter, page]);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  useEffect(() => { setPage(1); }, [classFilter, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(() => { setPage(1); }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    fetch('/api/classes?limit=100')
      .then(r => r.json())
      .then(d => setClasses(d.classes || []))
      .catch(() => {});
  }, []);

  const openAddForm = () => {
    setEditingStudent(null);
    setFormData({ name: '', gender: 'male', dob: '', phone: '', address: '', class_id: '', parent_name: '', parent_phone: '', parent_email: '' });
    setFormOpen(true);
  };

  const openEditForm = (student: Student) => {
    setEditingStudent(student);
    setFormData({
      name: student.name,
      gender: student.gender || 'male',
      dob: student.dob ? student.dob.split('T')[0] : '',
      phone: student.phone || '',
      address: student.address || '',
      class_id: String(student.class_id || ''),
      parent_name: student.parent?.name || '',
      parent_phone: student.parent?.phone || '',
      parent_email: '',
    });
    setFormOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.class_id) {
      toast.error('Student name and class are required');
      return;
    }
    setFormSaving(true);
    try {
      const url = editingStudent ? `/api/students/${editingStudent.student_id}` : '/api/students';
      const method = editingStudent ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast.success(editingStudent ? 'Student updated' : 'Student enrolled successfully');
      setFormOpen(false);
      fetchStudents();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save student');
    } finally {
      setFormSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to remove this student?')) return;
    try {
      const res = await fetch(`/api/students/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast.success('Student removed');
      fetchStudents();
    } catch (err: any) {
      toast.error(err.message || 'Failed to remove student');
    }
  };

  const handleExportCSV = () => {
    const headers = ['Code', 'Name', 'Gender', 'Class', 'Status', 'Phone'];
    const rows = students.map(s => [
      s.student_code, s.name, s.gender, s.class?.name || '', s.status, s.phone || '',
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `students-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exported');
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-emerald-100 text-emerald-700';
      case 'inactive': return 'bg-slate-100 text-slate-600';
      case 'graduated': return 'bg-blue-100 text-blue-700';
      case 'transferred': return 'bg-amber-100 text-amber-700';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Students</h1>
            <p className="text-sm text-slate-500 mt-1">Manage student enrollment and records</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExportCSV} className="border-emerald-200 text-emerald-700 hover:bg-emerald-50">
              <Download className="w-4 h-4 mr-2" /> Export
            </Button>
            <Button onClick={openAddForm} className="bg-emerald-600 hover:bg-emerald-700">
              <UserPlus className="w-4 h-4 mr-2" /> Enroll Student
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="border-emerald-100">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                <Users className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Total</p>
                <p className="text-lg font-bold text-slate-900">{total}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-emerald-100">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Active</p>
                <p className="text-lg font-bold text-emerald-700">{students.filter(s => s.status === 'active').length}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-blue-100">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Classes</p>
                <p className="text-lg font-bold text-blue-700">{classes.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-amber-100">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <Search className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Showing</p>
                <p className="text-lg font-bold text-amber-700">{students.length}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col lg:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search by name or student code..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={classFilter} onValueChange={(v) => v === '__all__' ? setClassFilter('') : setClassFilter(v)}>
                <SelectTrigger className="w-full lg:w-48"><SelectValue placeholder="All Classes" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All Classes</SelectItem>
                  {classes.map(c => (
                    <SelectItem key={c.class_id} value={String(c.class_id)}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={(v) => v === '__all__' ? setStatusFilter('') : setStatusFilter(v)}>
                <SelectTrigger className="w-full lg:w-40"><SelectValue placeholder="All Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="graduated">Graduated</SelectItem>
                  <SelectItem value="transferred">Transferred</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            {/* Desktop */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="text-xs font-semibold">Code</TableHead>
                    <TableHead className="text-xs font-semibold">Name</TableHead>
                    <TableHead className="text-xs font-semibold">Gender</TableHead>
                    <TableHead className="text-xs font-semibold">Class</TableHead>
                    <TableHead className="text-xs font-semibold">Parent</TableHead>
                    <TableHead className="text-xs font-semibold">Status</TableHead>
                    <TableHead className="text-xs font-semibold text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 8 }).map((_, i) => (
                      <TableRow key={i}>
                        {Array.from({ length: 7 }).map((_, j) => (
                          <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : students.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12 text-slate-400">
                        <Users className="w-10 h-10 mx-auto mb-2 opacity-50" />
                        <p>No students found</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    students.map((s) => (
                      <TableRow key={s.student_id} className="hover:bg-slate-50/50">
                        <TableCell className="font-mono text-xs">{s.student_code}</TableCell>
                        <TableCell className="font-medium text-sm">{s.name}</TableCell>
                        <TableCell className="capitalize text-sm">{s.gender}</TableCell>
                        <TableCell className="text-sm">{s.class?.name || '—'}</TableCell>
                        <TableCell>
                          <p className="text-sm">{s.parent?.name || '—'}</p>
                          <p className="text-xs text-slate-400">{s.parent?.phone || ''}</p>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`capitalize ${statusColor(s.status)}`}>
                            {s.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setViewStudent(s); setViewOpen(true); }} title="View">
                              <Eye className="w-3.5 h-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditForm(s)} title="Edit">
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600" onClick={() => handleDelete(s.student_id)} title="Delete">
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Mobile */}
            <div className="md:hidden divide-y">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="p-4 space-y-2"><Skeleton className="h-4 w-3/4" /><Skeleton className="h-3 w-1/2" /></div>
                ))
              ) : students.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <Users className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p>No students found</p>
                </div>
              ) : (
                students.map((s) => (
                  <div key={s.student_id} className="p-4 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-mono text-xs text-slate-500">{s.student_code}</p>
                        <p className="font-medium text-sm">{s.name}</p>
                      </div>
                      <Badge variant="outline" className={`capitalize ${statusColor(s.status)}`}>{s.status}</Badge>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span>{s.class?.name || 'No class'}</span>
                      <span>|</span>
                      <span className="capitalize">{s.gender}</span>
                    </div>
                    <div className="flex gap-2 pt-1">
                      <Button variant="outline" size="sm" className="flex-1 h-8 text-xs" onClick={() => { setViewStudent(s); setViewOpen(true); }}><Eye className="w-3 h-3 mr-1" />View</Button>
                      <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => openEditForm(s)}><Pencil className="w-3 h-3" /></Button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t">
                <p className="text-xs text-slate-500">{total} student(s)</p>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="icon" className="h-8 w-8" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-sm px-2">{page} / {totalPages}</span>
                  <Button variant="outline" size="icon" className="h-8 w-8" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add/Edit Student Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-emerald-600" />
              {editingStudent ? 'Edit Student' : 'Enroll New Student'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs">Full Name *</Label>
              <Input placeholder="Student full name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Gender</Label>
                <Select value={formData.gender} onValueChange={(v) => setFormData({ ...formData, gender: v })}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Date of Birth</Label>
                <Input type="date" value={formData.dob} onChange={(e) => setFormData({ ...formData, dob: e.target.value })} className="mt-1" />
              </div>
            </div>
            <div>
              <Label className="text-xs">Class *</Label>
              <Select value={formData.class_id} onValueChange={(v) => setFormData({ ...formData, class_id: v })}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select class" /></SelectTrigger>
                <SelectContent>
                  {classes.map(c => (
                    <SelectItem key={c.class_id} value={String(c.class_id)}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Phone Number</Label>
              <Input placeholder="Student phone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Address</Label>
              <Input placeholder="Home address" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} className="mt-1" />
            </div>

            <div className="border-t pt-4">
              <p className="text-sm font-medium text-slate-700 mb-3">Parent / Guardian Information</p>
              <div className="space-y-3">
                <div>
                  <Label className="text-xs">Parent Name</Label>
                  <Input placeholder="Parent full name" value={formData.parent_name} onChange={(e) => setFormData({ ...formData, parent_name: e.target.value })} className="mt-1" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Parent Phone</Label>
                    <Input placeholder="Phone" value={formData.parent_phone} onChange={(e) => setFormData({ ...formData, parent_phone: e.target.value })} className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs">Parent Email</Label>
                    <Input placeholder="Email" value={formData.parent_email} onChange={(e) => setFormData({ ...formData, parent_email: e.target.value })} className="mt-1" />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={formSaving || !formData.name || !formData.class_id} className="bg-emerald-600 hover:bg-emerald-700">
              {formSaving ? 'Saving...' : editingStudent ? 'Update' : 'Enroll Student'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Student Dialog */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Student Details</DialogTitle>
          </DialogHeader>
          {viewStudent && (
            <div className="space-y-3 text-sm">
              <div className="text-center pb-3 border-b">
                <div className="w-16 h-16 bg-emerald-100 rounded-full mx-auto flex items-center justify-center mb-2">
                  <Users className="w-8 h-8 text-emerald-600" />
                </div>
                <p className="font-bold text-lg">{viewStudent.name}</p>
                <p className="font-mono text-xs text-slate-500">{viewStudent.student_code}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><p className="text-xs text-slate-400">Class</p><p className="font-medium">{viewStudent.class?.name || '—'}</p></div>
                <div><p className="text-xs text-slate-400">Gender</p><p className="capitalize">{viewStudent.gender}</p></div>
                <div><p className="text-xs text-slate-400">Status</p><Badge variant="outline" className={statusColor(viewStudent.status)}>{viewStudent.status}</Badge></div>
                <div><p className="text-xs text-slate-400">Admission</p><p>{viewStudent.admission_date ? new Date(viewStudent.admission_date).toLocaleDateString() : '—'}</p></div>
                <div><p className="text-xs text-slate-400">Phone</p><p>{viewStudent.phone || '—'}</p></div>
                <div><p className="text-xs text-slate-400">DOB</p><p>{viewStudent.dob ? new Date(viewStudent.dob).toLocaleDateString() : '—'}</p></div>
              </div>
              {viewStudent.parent && (
                <div className="border-t pt-3">
                  <p className="text-xs text-slate-400 mb-1">Parent / Guardian</p>
                  <p className="font-medium">{viewStudent.parent.name}</p>
                  <p className="text-xs text-slate-500">{viewStudent.parent.phone}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
