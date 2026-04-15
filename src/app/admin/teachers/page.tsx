'use client';

import { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import {
  Search,
  UserPlus,
  Eye,
  Pencil,
  Trash2,
  Lock,
  Unlock,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Phone,
  Mail,
  Users,
  MoreHorizontal,
  Ban,
  CheckCircle2,
  XCircle,
  FileText,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Teacher {
  teacher_id: number;
  name: string;
  first_name: string;
  last_name: string;
  teacher_code: string;
  email: string;
  phone: string;
  gender: string;
  blood_group: string;
  birthday: string | null;
  address: string;
  active_status: number;
  joining_date: string | null;
  authentication_key: string;
  block_limit: number;
  designation: { id: number; des_name: string } | null;
  department: { id: number; dep_name: string } | null;
  form_master: string[];
}

interface Department {
  id: number;
  dep_name: string;
}

interface Designation {
  id: number;
  des_name: string;
}

interface FormData {
  first_name: string;
  other_name: string;
  last_name: string;
  email: string;
  phone: string;
  password: string;
  birthday: string;
  gender: string;
  address: string;
  teacher_code: string;
  designation_id: string;
  department_id: string;
  ghana_card_id: string;
  ssnit_id: string;
  petra_id: string;
  account_number: string;
  account_details: string;
  facebook: string;
  twitter: string;
  linkedin: string;
}

const emptyForm: FormData = {
  first_name: '',
  other_name: '',
  last_name: '',
  email: '',
  phone: '',
  password: '',
  birthday: '',
  gender: '',
  address: '',
  teacher_code: '',
  designation_id: '',
  department_id: '',
  ghana_card_id: '',
  ssnit_id: '',
  petra_id: '',
  account_number: '',
  account_details: '',
  facebook: '',
  twitter: '',
  linkedin: '',
};

// ─── Page Component ──────────────────────────────────────────────────────────

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [genderFilter, setGenderFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(15);
  const [totalPages, setTotalPages] = useState(1);
  const [totalMale, setTotalMale] = useState(0);
  const [totalFemale, setTotalFemale] = useState(0);
  const [grandTotal, setGrandTotal] = useState(0);

  const [departments, setDepartments] = useState<Department[]>([]);
  const [designations, setDesignations] = useState<Designation[]>([]);

  // Form modal
  const [formOpen, setFormOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [formSaving, setFormSaving] = useState(false);
  const [formData, setFormData] = useState<FormData>(emptyForm);

  // View modal
  const [viewOpen, setViewOpen] = useState(false);
  const [viewTeacher, setViewTeacher] = useState<Teacher | null>(null);

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<Teacher | null>(null);
  const [deleting, setDeleting] = useState(false);

  // ─── Data fetching ────────────────────────────────────────────────────────

  const fetchTeachers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (genderFilter) params.set('gender', genderFilter);
      if (statusFilter) params.set('status', statusFilter);
      params.set('page', String(page));
      params.set('pageSize', String(pageSize));

      const res = await fetch(`/api/admin/teachers?${params}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setTeachers(Array.isArray(data.data) ? data.data : []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotalMale(data.totalMale || 0);
      setTotalFemale(data.totalFemale || 0);
      setGrandTotal(data.grandTotal || 0);
    } catch {
      toast.error('Failed to load teachers');
    } finally {
      setLoading(false);
    }
  }, [search, genderFilter, statusFilter, page, pageSize]);

  useEffect(() => {
    fetchTeachers();
  }, [fetchTeachers]);

  // Reset page on filter change
  useEffect(() => {
    setPage(1);
  }, [search, genderFilter, statusFilter]);

  // Fetch departments/designations
  useEffect(() => {
    Promise.all([
      fetch('/api/admin/departments').then((r) => r.json()),
      fetch('/api/admin/designations').then((r) => r.json()),
    ])
      .then(([depts, desigs]) => {
        setDepartments(Array.isArray(depts) ? depts : []);
        setDesignations(Array.isArray(desigs) ? desigs : []);
      })
      .catch(() => {});
  }, []);

  // ─── Form handlers ────────────────────────────────────────────────────────

  const openAddForm = () => {
    setEditingTeacher(null);
    setFormData(emptyForm);
    setFormOpen(true);
  };

  const openEditForm = async (teacher: Teacher) => {
    setEditingTeacher(teacher);
    // Fetch full teacher data for edit
    try {
      const res = await fetch(`/api/admin/teachers/${teacher.teacher_id}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      // Parse social links if they exist
      let social = { facebook: '', twitter: '', linkedin: '' };
      if (data.social_links) {
        try {
          const parsed = JSON.parse(data.social_links);
          if (Array.isArray(parsed) && parsed[0]) {
            social = parsed[0];
          }
        } catch { /* ignore */ }
      }

      setFormData({
        first_name: data.first_name || '',
        other_name: data.other_name || '',
        last_name: data.last_name || '',
        email: data.email || '',
        phone: data.phone || '',
        password: '',
        birthday: data.birthday ? data.birthday.split('T')[0] : '',
        gender: data.gender || '',
        address: data.address || '',
        teacher_code: data.teacher_code || '',
        designation_id: data.designation_id ? String(data.designation_id) : '',
        department_id: data.department_id ? String(data.department_id) : '',
        ghana_card_id: data.ghana_card_id || '',
        ssnit_id: data.ssnit_id || '',
        petra_id: data.petra_id || '',
        account_number: data.account_number || '',
        account_details: data.account_details || '',
        facebook: social.facebook || '',
        twitter: social.twitter || '',
        linkedin: social.linkedin || '',
      });
    } catch {
      toast.error('Failed to load teacher details');
      return;
    }
    setFormOpen(true);
  };

  const handleSave = async () => {
    const errors: string[] = [];
    if (!formData.first_name.trim()) errors.push('First Name is required');
    if (!formData.last_name.trim()) errors.push('Last Name is required');
    if (!formData.email.trim()) errors.push('Email is required');
    if (!formData.gender) errors.push('Gender is required');
    if (!formData.phone.trim()) errors.push('Phone Number is required');
    if (!formData.birthday) errors.push('Date of birth is required');
    if (!formData.ghana_card_id.trim()) errors.push('Ghana Card is required');
    if (!formData.account_number.trim()) errors.push('Account number is required');
    if (!formData.account_details.trim()) errors.push('Account details is required');

    if (!editingTeacher && !formData.password.trim()) {
      errors.push('Password is required');
    }

    if (errors.length > 0) {
      toast.error(errors[0]);
      return;
    }

    setFormSaving(true);
    try {
      const url = editingTeacher
        ? `/api/admin/teachers/${editingTeacher.teacher_id}`
        : '/api/admin/teachers';

      const res = await fetch(url, {
        method: editingTeacher ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();

      if (data.error) {
        toast.error(data.error);
        return;
      }

      toast.success(editingTeacher ? "Teacher's data updated successfully" : "Teacher's data added successfully");

      if (!editingTeacher && data.authentication_key) {
        toast.info(`Authentication Key: ${data.authentication_key}`, {
          duration: 8000,
        });
      }

      setFormOpen(false);
      fetchTeachers();
    } catch {
      toast.error('Failed to save teacher');
    } finally {
      setFormSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/teachers/${deleteTarget.teacher_id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast.success('Selected teacher deleted successfully');
      setDeleteTarget(null);
      fetchTeachers();
    } catch {
      toast.error('Failed to delete teacher');
    } finally {
      setDeleting(false);
    }
  };

  const handleBlock = async (teacher: Teacher) => {
    try {
      const res = await fetch(`/api/admin/teachers/${teacher.teacher_id}/block`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast.success('User account blocked successfully');
      fetchTeachers();
    } catch {
      toast.error('Failed to block account');
    }
  };

  const handleUnblock = async (teacher: Teacher) => {
    try {
      const res = await fetch(`/api/admin/teachers/${teacher.teacher_id}/unblock`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast.success('User account unblocked successfully');
      fetchTeachers();
    } catch {
      toast.error('Failed to unblock account');
    }
  };

  // ─── Derived data ─────────────────────────────────────────────────────────

  const filteredTeachers = teachers; // already server-side filtered

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Teacher Management</h1>
            <p className="text-sm text-slate-500 mt-1">Manage teaching staff, assignments and accounts</p>
          </div>
          <Button onClick={openAddForm} className="bg-emerald-600 hover:bg-emerald-700 shadow-lg">
            <UserPlus className="w-4 h-4 mr-2" />
            Add New Teacher
          </Button>
        </div>

        {/* Gender Summary - matching original CI3 table header */}
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="flex items-center gap-3 bg-blue-50 rounded-lg p-3">
                <Users className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-xs font-medium text-blue-700 uppercase">Males</p>
                  <p className="text-lg font-bold text-blue-900">{totalMale}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-pink-50 rounded-lg p-3">
                <Users className="w-5 h-5 text-pink-600" />
                <div>
                  <p className="text-xs font-medium text-pink-700 uppercase">Females</p>
                  <p className="text-lg font-bold text-pink-900">{totalFemale}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-slate-100 rounded-lg p-3">
                <GraduationCap className="w-5 h-5 text-slate-600" />
                <div>
                  <p className="text-xs font-medium text-slate-700 uppercase">Total</p>
                  <p className="text-lg font-bold text-slate-900">{grandTotal}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search by name, email, or staff ID..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={genderFilter} onValueChange={(v) => (v === '__all__' ? setGenderFilter('') : setGenderFilter(v))}>
                <SelectTrigger className="w-full sm:w-36">
                  <SelectValue placeholder="All Genders" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All Genders</SelectItem>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={(v) => (v === '__all__' ? setStatusFilter('') : setStatusFilter(v))}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All Status</SelectItem>
                  <SelectItem value="1">Active</SelectItem>
                  <SelectItem value="0">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Data Table */}
        <Card>
          <CardContent className="p-0">
            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 hover:bg-slate-50">
                    <TableHead className="px-4 py-3 text-xs font-semibold uppercase">Photo</TableHead>
                    <TableHead className="px-4 py-3 text-xs font-semibold uppercase">Staff ID</TableHead>
                    <TableHead className="px-4 py-3 text-xs font-semibold uppercase">Name</TableHead>
                    <TableHead className="px-4 py-3 text-xs font-semibold uppercase">Gender</TableHead>
                    <TableHead className="px-4 py-3 text-xs font-semibold uppercase">Qualification</TableHead>
                    <TableHead className="px-4 py-3 text-xs font-semibold uppercase">Form Master</TableHead>
                    <TableHead className="px-4 py-3 text-xs font-semibold uppercase">Email</TableHead>
                    <TableHead className="px-4 py-3 text-xs font-semibold uppercase">Auth Key</TableHead>
                    <TableHead className="px-4 py-3 text-xs font-semibold uppercase">Phone</TableHead>
                    <TableHead className="px-4 py-3 text-xs font-semibold uppercase">Account Status</TableHead>
                    <TableHead className="px-4 py-3 text-xs font-semibold uppercase text-right">Options</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                      <TableRow key={i}>
                        {Array.from({ length: 11 }).map((_, j) => (
                          <TableCell key={j}>
                            <Skeleton className="h-5 w-full" />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : filteredTeachers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={11} className="text-center py-12 text-slate-400">
                        <GraduationCap className="w-10 h-10 mx-auto mb-2 opacity-50" />
                        <p>No teachers found</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTeachers.map((t) => (
                      <TableRow key={t.teacher_id} className="hover:bg-slate-50/50">
                        {/* Photo */}
                        <TableCell className="px-4 py-3">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white bg-gradient-to-br from-emerald-500 to-emerald-700">
                            {t.name?.charAt(0) || '?'}
                          </div>
                        </TableCell>
                        {/* Staff ID */}
                        <TableCell className="px-4 py-3 text-sm font-mono">{t.teacher_code || '—'}</TableCell>
                        {/* Name */}
                        <TableCell className="px-4 py-3 font-medium text-sm">{t.name}</TableCell>
                        {/* Gender */}
                        <TableCell className="px-4 py-3 text-sm">
                          <Badge variant="outline" className={t.gender === 'Male' ? 'border-blue-200 text-blue-700 bg-blue-50' : 'border-pink-200 text-pink-700 bg-pink-50'}>
                            {t.gender || '—'}
                          </Badge>
                        </TableCell>
                        {/* Qualification (designation) */}
                        <TableCell className="px-4 py-3 text-sm">{t.designation?.des_name || '—'}</TableCell>
                        {/* Form Master */}
                        <TableCell className="px-4 py-3 text-sm">
                          {t.form_master.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {t.form_master.map((fm, i) => (
                                <Badge key={i} variant="outline" className="text-xs border-amber-200 text-amber-700 bg-amber-50">
                                  {fm}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <span className="text-slate-400">N/A</span>
                          )}
                        </TableCell>
                        {/* Email */}
                        <TableCell className="px-4 py-3 text-sm">
                          <a href={`mailto:${t.email}`} className="text-slate-600 hover:text-emerald-600 transition">
                            {t.email}
                          </a>
                        </TableCell>
                        {/* Auth Key */}
                        <TableCell className="px-4 py-3">
                          <code className="text-sm font-bold tracking-widest text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                            {t.authentication_key}
                          </code>
                        </TableCell>
                        {/* Phone */}
                        <TableCell className="px-4 py-3 text-sm">{t.phone || '—'}</TableCell>
                        {/* Account Status */}
                        <TableCell className="px-4 py-3">
                          {t.block_limit >= 3 ? (
                            <Badge className="bg-red-100 text-red-700 border-red-200 hover:bg-red-100">
                              <XCircle className="w-3 h-3 mr-1" />
                              Blocked
                            </Badge>
                          ) : (
                            <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Active
                            </Badge>
                          )}
                        </TableCell>
                        {/* Options */}
                        <TableCell className="px-4 py-3 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => { setViewTeacher(t); setViewOpen(true); }}>
                                <Eye className="w-4 h-4 mr-2 text-emerald-600" />
                                <span>Profile</span>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => openEditForm(t)}>
                                <Pencil className="w-4 h-4 mr-2 text-emerald-600" />
                                <span>Edit</span>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {t.block_limit >= 3 ? (
                                <DropdownMenuItem onClick={() => handleUnblock(t)}>
                                  <Unlock className="w-4 h-4 mr-2 text-emerald-600" />
                                  <span>Unblock</span>
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem onClick={() => handleBlock(t)} className="text-red-600">
                                  <Lock className="w-4 h-4 mr-2" />
                                  <span>Block</span>
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => setDeleteTarget(t)} className="text-red-600">
                                <Trash2 className="w-4 h-4 mr-2" />
                                <span>Delete</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Cards */}
            <div className="lg:hidden divide-y">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <Skeleton className="w-10 h-10 rounded-full" />
                      <div className="flex-1">
                        <Skeleton className="h-4 w-3/4 mb-1" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </div>
                  </div>
                ))
              ) : filteredTeachers.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <GraduationCap className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p>No teachers found</p>
                </div>
              ) : (
                filteredTeachers.map((t) => (
                  <div key={t.teacher_id} className="p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-bold text-white bg-gradient-to-br from-emerald-500 to-emerald-700">
                        {t.name?.charAt(0) || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate">{t.name}</p>
                            <p className="text-xs text-slate-500">{t.designation?.des_name || ''}</p>
                          </div>
                          {t.block_limit >= 3 ? (
                            <Badge className="bg-red-100 text-red-700 border-red-200 hover:bg-red-100 flex-shrink-0 ml-2">
                              Blocked
                            </Badge>
                          ) : (
                            <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100 flex-shrink-0 ml-2">
                              Active
                            </Badge>
                          )}
                        </div>
                        <div className="mt-1 space-y-0.5 text-xs text-slate-500">
                          <p>{t.email}</p>
                          <p>{t.phone}</p>
                          {t.form_master.length > 0 && (
                            <p className="text-amber-600">
                              Form Master: {t.form_master.join(', ')}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 pt-1">
                      <Button variant="outline" size="sm" className="flex-1 h-8 text-xs" onClick={() => { setViewTeacher(t); setViewOpen(true); }}>
                        <Eye className="w-3 h-3 mr-1" />View
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1 h-8 text-xs" onClick={() => openEditForm(t)}>
                        <Pencil className="w-3 h-3 mr-1" />Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs text-red-600 border-red-200 hover:bg-red-50"
                        onClick={() => setDeleteTarget(t)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t bg-slate-50/50">
                <p className="text-xs text-slate-500">{grandTotal} teacher(s) total</p>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="icon" className="h-8 w-8" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-sm px-2 text-slate-600">
                    {page} / {totalPages}
                  </span>
                  <Button variant="outline" size="icon" className="h-8 w-8" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ─── Add/Edit Teacher Modal ─────────────────────────────────────────── */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <UserPlus className="w-5 h-5 text-emerald-600" />
              {editingTeacher ? 'Edit Teacher' : 'Add Teacher'}
            </DialogTitle>
            <DialogDescription>
              {editingTeacher ? 'Update teacher information below.' : 'Fill in the form to add a new teacher.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Personal Information */}
            <div>
              <h3 className="text-sm font-semibold text-slate-800 mb-3 pb-2 border-b-2 border-emerald-500 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Personal Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm">First Name <span className="text-red-500">*</span></Label>
                  <Input placeholder="First name" value={formData.first_name} onChange={(e) => setFormData({ ...formData, first_name: e.target.value })} className="mt-1" />
                </div>
                <div>
                  <Label className="text-sm">Other Name</Label>
                  <Input placeholder="Other name" value={formData.other_name} onChange={(e) => setFormData({ ...formData, other_name: e.target.value })} className="mt-1" />
                </div>
                <div>
                  <Label className="text-sm">Last Name <span className="text-red-500">*</span></Label>
                  <Input placeholder="Last name" value={formData.last_name} onChange={(e) => setFormData({ ...formData, last_name: e.target.value })} className="mt-1" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <Label className="text-sm">Staff ID <span className="text-red-500">*</span></Label>
                  <Input placeholder="e.g. TCH-0001" value={formData.teacher_code} onChange={(e) => setFormData({ ...formData, teacher_code: e.target.value })} className="mt-1" />
                </div>
                <div>
                  <Label className="text-sm">Qualification</Label>
                  <Select value={formData.designation_id} onValueChange={(v) => setFormData({ ...formData, designation_id: v })}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Select designation" /></SelectTrigger>
                    <SelectContent>
                      {designations.map((d) => (
                        <SelectItem key={d.id} value={String(d.id)}>{d.des_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <Label className="text-sm">Date of Birth <span className="text-red-500">*</span></Label>
                  <Input type="date" value={formData.birthday} onChange={(e) => setFormData({ ...formData, birthday: e.target.value })} className="mt-1" />
                </div>
                <div>
                  <Label className="text-sm">Gender <span className="text-red-500">*</span></Label>
                  <Select value={formData.gender} onValueChange={(v) => setFormData({ ...formData, gender: v })}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Select gender" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="mt-4">
                <Label className="text-sm">Address</Label>
                <Input placeholder="Address" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} className="mt-1" />
              </div>
            </div>

            {/* Contact Information */}
            <div>
              <h3 className="text-sm font-semibold text-slate-800 mb-3 pb-2 border-b-2 border-emerald-500 flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Contact Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm">Phone <span className="text-red-500">*</span></Label>
                  <Input type="tel" placeholder="Phone number" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="mt-1" />
                </div>
                <div>
                  <Label className="text-sm">Email <span className="text-red-500">*</span></Label>
                  <Input type="email" placeholder="Email address" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="mt-1" />
                </div>
                <div>
                  <Label className="text-sm">{!editingTeacher ? 'Password' : 'New Password'} {!editingTeacher && <span className="text-red-500">*</span>}</Label>
                  <Input type="password" placeholder={editingTeacher ? 'Leave blank to keep' : 'Password'} value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className="mt-1" />
                </div>
              </div>
            </div>

            {/* Identification */}
            <div>
              <h3 className="text-sm font-semibold text-slate-800 mb-3 pb-2 border-b-2 border-emerald-500 flex items-center gap-2">
                <Ban className="w-4 h-4" />
                Identification
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm">SSNIT ID</Label>
                  <Input placeholder="SSNIT ID" value={formData.ssnit_id} onChange={(e) => setFormData({ ...formData, ssnit_id: e.target.value })} className="mt-1" />
                </div>
                <div>
                  <Label className="text-sm">Ghana Card ID <span className="text-red-500">*</span></Label>
                  <Input placeholder="Ghana Card ID" value={formData.ghana_card_id} onChange={(e) => setFormData({ ...formData, ghana_card_id: e.target.value })} className="mt-1" />
                </div>
                <div>
                  <Label className="text-sm">Petra ID</Label>
                  <Input placeholder="Petra ID" value={formData.petra_id} onChange={(e) => setFormData({ ...formData, petra_id: e.target.value })} className="mt-1" />
                </div>
              </div>
            </div>

            {/* Department */}
            <div>
              <h3 className="text-sm font-semibold text-slate-800 mb-3 pb-2 border-b-2 border-emerald-500 flex items-center gap-2">
                <GraduationCap className="w-4 h-4" />
                Department
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm">Department</Label>
                  <Select value={formData.department_id} onValueChange={(v) => setFormData({ ...formData, department_id: v })}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Select department" /></SelectTrigger>
                    <SelectContent>
                      {departments.map((d) => (
                        <SelectItem key={d.id} value={String(d.id)}>{d.dep_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Social Links */}
            <div>
              <h3 className="text-sm font-semibold text-slate-800 mb-3 pb-2 border-b-2 border-emerald-500 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Social Links
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm">Facebook</Label>
                  <Input placeholder="Facebook URL" value={formData.facebook} onChange={(e) => setFormData({ ...formData, facebook: e.target.value })} className="mt-1" />
                </div>
                <div>
                  <Label className="text-sm">Twitter</Label>
                  <Input placeholder="Twitter handle" value={formData.twitter} onChange={(e) => setFormData({ ...formData, twitter: e.target.value })} className="mt-1" />
                </div>
                <div>
                  <Label className="text-sm">LinkedIn</Label>
                  <Input placeholder="LinkedIn URL" value={formData.linkedin} onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })} className="mt-1" />
                </div>
              </div>
            </div>

            {/* Account Information */}
            <div>
              <h3 className="text-sm font-semibold text-slate-800 mb-3 pb-2 border-b-2 border-emerald-500 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Account Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm">Account Number <span className="text-red-500">*</span></Label>
                  <Input placeholder="Bank account number" value={formData.account_number} onChange={(e) => setFormData({ ...formData, account_number: e.target.value })} className="mt-1" />
                </div>
                <div>
                  <Label className="text-sm">Account Details <span className="text-red-500">*</span></Label>
                  <Textarea
                    placeholder="Enter Account Name, Branch etc..."
                    value={formData.account_details}
                    onChange={(e) => setFormData({ ...formData, account_details: e.target.value })}
                    className="mt-1"
                    rows={3}
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="pt-4 border-t">
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button
              onClick={handleSave}
              disabled={formSaving}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {formSaving ? (
                <>
                  <span className="animate-spin mr-2">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  </span>
                  Saving...
                </>
              ) : editingTeacher ? (
                'Update Teacher'
              ) : (
                'Add Teacher'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── View Teacher Modal ─────────────────────────────────────────────── */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Teacher Profile</DialogTitle>
          </DialogHeader>
          {viewTeacher && (
            <div className="space-y-4 text-sm">
              {/* Avatar and Name */}
              <div className="text-center pb-4 border-b">
                <div className="w-20 h-20 mx-auto flex items-center justify-center text-2xl font-bold text-white rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 mb-3">
                  {viewTeacher.name?.charAt(0) || '?'}
                </div>
                <p className="font-bold text-lg text-slate-900">{viewTeacher.name}</p>
                <p className="text-xs text-slate-500">
                  {[viewTeacher.designation?.des_name, viewTeacher.department?.dep_name].filter(Boolean).join(' · ') || 'No designation'}
                </p>
                <div className="flex justify-center gap-2 mt-2">
                  {viewTeacher.block_limit >= 3 ? (
                    <Badge className="bg-red-100 text-red-700 border-red-200 hover:bg-red-100">
                      <XCircle className="w-3 h-3 mr-1" />Blocked
                    </Badge>
                  ) : (
                    <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100">
                      <CheckCircle2 className="w-3 h-3 mr-1" />Active
                    </Badge>
                  )}
                  <Badge variant="outline" className={viewTeacher.gender === 'Male' ? 'border-blue-200 text-blue-700 bg-blue-50' : 'border-pink-200 text-pink-700 bg-pink-50'}>
                    {viewTeacher.gender}
                  </Badge>
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                <div>
                  <p className="text-xs text-slate-400 uppercase">Staff ID</p>
                  <p className="font-mono text-sm">{viewTeacher.teacher_code || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase">Auth Key</p>
                  <p className="font-mono text-sm tracking-widest">{viewTeacher.authentication_key}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase">Email</p>
                  <p className="truncate">{viewTeacher.email || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase">Phone</p>
                  <p>{viewTeacher.phone || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase">Date of Birth</p>
                  <p>{viewTeacher.birthday ? new Date(viewTeacher.birthday).toLocaleDateString() : '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase">Joining Date</p>
                  <p>{viewTeacher.joining_date ? new Date(viewTeacher.joining_date).toLocaleDateString() : '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase">Blood Group</p>
                  <p>{viewTeacher.blood_group || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase">Address</p>
                  <p className="truncate">{viewTeacher.address || '—'}</p>
                </div>
              </div>

              {/* Form Master */}
              {viewTeacher.form_master.length > 0 && (
                <div className="border-t pt-3">
                  <p className="text-xs text-slate-400 uppercase mb-1">Form Master</p>
                  <div className="flex flex-wrap gap-1">
                    {viewTeacher.form_master.map((fm, i) => (
                      <Badge key={i} variant="outline" className="text-xs border-amber-200 text-amber-700 bg-amber-50">
                        {fm}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ─── Delete Confirmation ────────────────────────────────────────────── */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Teacher</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deleteTarget?.name}</strong>? This action cannot be undone. All associated data including class assignments, subject assignments, and section assignments will be removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? 'Deleting...' : 'Delete Teacher'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
