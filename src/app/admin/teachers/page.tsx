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
import { useAuth } from '@/hooks/use-auth';
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
  Building2,
  Download,
  CheckCircle2,
  XCircle,
  FileText,
  Shield,
  BookOpen,
  IdCard,
  CreditCard,
  Globe,
  Clock,
  X,
  Filter,
  RefreshCw,
  Printer,
  UserCheck,
  UserX,
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

interface Subject {
  subject_id: number;
  name: string;
  teacher_id?: number | null;
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

// ─── Skeleton Components ─────────────────────────────────────────────────────

function StatCardSkeleton() {
  return (
    <Card className="border-slate-200/60">
      <CardContent className="p-5 flex items-center gap-4">
        <Skeleton className="w-12 h-12 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-6 w-12" />
        </div>
      </CardContent>
    </Card>
  );
}

function TableSkeleton() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, i) => (
        <TableRow key={i}>
          <TableCell><Skeleton className="w-9 h-9 rounded-full" /></TableCell>
          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
          <TableCell><Skeleton className="h-4 w-28" /></TableCell>
          <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-14" /></TableCell>
          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
          <TableCell className="hidden xl:table-cell"><Skeleton className="h-4 w-16" /></TableCell>
          <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-28" /></TableCell>
          <TableCell className="hidden xl:table-cell"><Skeleton className="h-4 w-14" /></TableCell>
          <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-24" /></TableCell>
          <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
          <TableCell><Skeleton className="h-8 w-8 rounded-md ml-auto" /></TableCell>
        </TableRow>
      ))}
    </>
  );
}

function MobileCardSkeleton() {
  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center gap-3">
        <Skeleton className="w-12 h-12 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
        <Skeleton className="h-5 w-14 rounded-full" />
      </div>
      <div className="space-y-1.5 pl-15">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-3/4" />
      </div>
      <div className="flex gap-2 pt-1">
        <Skeleton className="h-11 flex-1 rounded-lg" />
        <Skeleton className="h-11 flex-1 rounded-lg" />
        <Skeleton className="h-11 w-11 rounded-lg" />
      </div>
    </div>
  );
}

// ─── Filter Chip ─────────────────────────────────────────────────────────────

function FilterChip({
  label,
  active,
  onClick,
  color = 'slate',
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  color?: string;
}) {
  const colorClasses: Record<string, string> = {
    slate: active
      ? 'bg-slate-900 text-white border-slate-900 hover:bg-slate-800'
      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300',
    emerald: active
      ? 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700'
      : 'bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50',
    amber: active
      ? 'bg-amber-500 text-white border-amber-500 hover:bg-amber-600'
      : 'bg-white text-amber-700 border-amber-200 hover:bg-amber-50',
    red: active
      ? 'bg-red-600 text-white border-red-600 hover:bg-red-700'
      : 'bg-white text-red-600 border-red-200 hover:bg-red-50',
    sky: active
      ? 'bg-sky-600 text-white border-sky-600 hover:bg-sky-700'
      : 'bg-white text-sky-700 border-sky-200 hover:bg-sky-50',
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all min-h-[32px] ${colorClasses[color] || colorClasses.slate}`}
    >
      {label}
    </button>
  );
}

// ─── Page Component ──────────────────────────────────────────────────────────

export default function TeachersPage() {
  const { isAdmin, hasPermission } = useAuth();

  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [designationFilter, setDesignationFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(15);
  const [totalPages, setTotalPages] = useState(1);
  const [totalMale, setTotalMale] = useState(0);
  const [totalFemale, setTotalFemale] = useState(0);
  const [grandTotal, setGrandTotal] = useState(0);

  const [departments, setDepartments] = useState<Department[]>([]);
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [subjectFilter, setSubjectFilter] = useState('');

  // Form modal
  const [formOpen, setFormOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [formSaving, setFormSaving] = useState(false);
  const [formData, setFormData] = useState<FormData>(emptyForm);
  const [generatingCode, setGeneratingCode] = useState(false);

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
      if (departmentFilter) params.set('department', departmentFilter);
      if (designationFilter) params.set('designation', designationFilter);
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
  }, [search, departmentFilter, designationFilter, statusFilter, page, pageSize]);

  useEffect(() => {
    fetchTeachers();
  }, [fetchTeachers]);

  // Reset page on filter change (debounced for search)
  useEffect(() => {
    setPage(1);
  }, [departmentFilter, designationFilter, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(() => { setPage(1); }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch departments, designations, and subjects
  useEffect(() => {
    Promise.all([
      fetch('/api/admin/departments').then((r) => r.json()),
      fetch('/api/admin/designations').then((r) => r.json()),
      fetch('/api/subjects').then((r) => r.json()).catch(() => []),
    ])
      .then(([depts, desigs, subjs]) => {
        setDepartments(Array.isArray(depts) ? depts : []);
        setDesignations(Array.isArray(desigs) ? desigs : []);
        setSubjects(Array.isArray(subjs) ? subjs : []);
      })
      .catch(() => {});
  }, []);

  // ─── Computed values ──────────────────────────────────────────────────────

  const activeCount = grandTotal > 0 && !statusFilter
    ? grandTotal - teachers.filter(t => t.active_status !== 1).length
    : teachers.filter(t => t.active_status === 1).length;

  const onLeaveCount = teachers.filter(t => t.active_status !== 1 && t.block_limit < 3).length;

  const hasActiveFilters = search || departmentFilter || designationFilter || statusFilter;

  const uniqueSubjectNames = Array.from(
    new Set(subjects.map(s => s.name).filter(Boolean))
  ).sort();

  const teacherIdsForSubject = subjectFilter
    ? new Set(
        subjects
          .filter(s => s.name === subjectFilter && s.teacher_id)
          .map(s => s.teacher_id)
      )
    : null;

  const displayedTeachers = teacherIdsForSubject
    ? teachers.filter(t => teacherIdsForSubject!.has(t.teacher_id))
    : teachers;

  // ─── Form handlers ────────────────────────────────────────────────────────

  const generateTeacherCode = async () => {
    setGeneratingCode(true);
    try {
      const res = await fetch('/api/admin/teachers/generate-code');
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      if (data.teacher_code) {
        setFormData(prev => ({ ...prev, teacher_code: data.teacher_code }));
        toast.success('Staff ID generated successfully');
      }
    } catch {
      toast.error('Failed to generate Staff ID');
    } finally {
      setGeneratingCode(false);
    }
  };

  const openAddForm = () => {
    setEditingTeacher(null);
    setFormData(emptyForm);
    setFormOpen(true);
  };

  const openEditForm = async (teacher: Teacher) => {
    setEditingTeacher(teacher);
    try {
      const res = await fetch(`/api/admin/teachers/${teacher.teacher_id}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);

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

  const handleExportCSV = () => {
    const headers = ['Staff ID', 'Name', 'Gender', 'Email', 'Phone', 'Department', 'Designation', 'Status'];
    const rows = teachers.map(t => [
      t.teacher_code, t.name, t.gender, t.email, t.phone,
      t.department?.dep_name || '', t.designation?.des_name || '',
      t.active_status === 1 ? 'Active' : 'Inactive',
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `teachers-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exported successfully');
  };

  const clearFilters = () => {
    setSearch('');
    setDepartmentFilter('');
    setDesignationFilter('');
    setStatusFilter('');
    setSubjectFilter('');
    setPage(1);
  };

  // ─── Status badge ─────────────────────────────────────────────────────────

  function StatusBadge({ teacher }: { teacher: Teacher }) {
    if (teacher.block_limit >= 3) {
      return (
        <Badge variant="outline" className="border-red-200 bg-red-50 text-red-700 gap-1">
          <XCircle className="w-3 h-3" />
          Blocked
        </Badge>
      );
    }
    if (teacher.active_status === 1) {
      return (
        <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700 gap-1">
          <CheckCircle2 className="w-3 h-3" />
          Active
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700 gap-1">
        <Clock className="w-3 h-3" />
        On Leave
      </Badge>
    );
  }

  const isAddMode = !editingTeacher;

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* ─── Page Header ───────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Teachers</h1>
            <p className="text-sm text-slate-500 mt-1">Manage teaching staff, assignments &amp; accounts</p>
          </div>
          <div className="flex items-center gap-2">
            {(isAdmin || hasPermission('teachers.read')) && (
              <Button
                variant="outline"
                onClick={handleExportCSV}
                className="border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 min-h-[44px]"
              >
                <Download className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Export</span>
              </Button>
            )}
            {(isAdmin || hasPermission('teachers.create')) && (
              <Button
                onClick={openAddForm}
                className="bg-emerald-600 hover:bg-emerald-700 text-white min-h-[44px] shadow-sm"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Add New Teacher
              </Button>
            )}
          </div>
        </div>

        {/* ─── Stat Cards (CI3: Males / Females / Total in table header) ──── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {loading ? (
            <>
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
            </>
          ) : (
            <>
              {/* Males (CI3 parity) */}
              <Card className="border-slate-200/80 hover:shadow-md transition-all duration-200">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-sky-50 flex items-center justify-center flex-shrink-0">
                    <UserCheck className="w-6 h-6 text-sky-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Males</p>
                    <p className="text-2xl font-bold text-sky-700 mt-0.5">{totalMale}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Females (CI3 parity) */}
              <Card className="border-slate-200/80 hover:shadow-md transition-all duration-200">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-pink-50 flex items-center justify-center flex-shrink-0">
                    <UserX className="w-6 h-6 text-pink-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Females</p>
                    <p className="text-2xl font-bold text-pink-700 mt-0.5">{totalFemale}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Total Teachers */}
              <Card className="border-slate-200/80 hover:shadow-md transition-all duration-200">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
                    <GraduationCap className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Total</p>
                    <p className="text-2xl font-bold text-slate-900 mt-0.5">{grandTotal}</p>
                  </div>
                </CardContent>
              </Card>

              {/* On Leave */}
              <Card className="border-slate-200/80 hover:shadow-md transition-all duration-200">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
                    <Clock className="w-6 h-6 text-amber-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">On Leave</p>
                    <p className="text-2xl font-bold text-amber-700 mt-0.5">{onLeaveCount}</p>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* ─── Search & Filters ─────────────────────────────────────────── */}
        <Card className="border-slate-200/80">
          <CardContent className="p-4 space-y-4">
            {/* Search bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search by name, code, or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 min-h-[44px] bg-slate-50 border-slate-200 focus:bg-white"
              />
            </div>

            {/* Filter chips row */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-medium text-slate-500 uppercase tracking-wide">
                <Filter className="w-3.5 h-3.5" />
                Filters
              </div>

              {/* Status chips */}
              <div className="flex flex-wrap gap-2">
                <FilterChip
                  label="All Status"
                  active={!statusFilter}
                  onClick={() => setStatusFilter('')}
                  color="slate"
                />
                <FilterChip
                  label="Active"
                  active={statusFilter === '1'}
                  onClick={() => setStatusFilter(statusFilter === '1' ? '' : '1')}
                  color="emerald"
                />
                <FilterChip
                  label="Inactive"
                  active={statusFilter === '0'}
                  onClick={() => setStatusFilter(statusFilter === '0' ? '' : '0')}
                  color="amber"
                />
              </div>

              {/* Department chips (scrollable) - CI3 parity */}
              {departments.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-slate-400 flex-shrink-0">Department:</span>
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                    <FilterChip
                      label="All"
                      active={!departmentFilter}
                      onClick={() => setDepartmentFilter('')}
                      color="slate"
                    />
                    {departments.map((d) => (
                      <FilterChip
                        key={d.id}
                        label={d.dep_name}
                        active={departmentFilter === String(d.id)}
                        onClick={() => setDepartmentFilter(
                          departmentFilter === String(d.id) ? '' : String(d.id)
                        )}
                        color="sky"
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Designation chips (scrollable) - CI3 parity */}
              {designations.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-slate-400 flex-shrink-0">Designation:</span>
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                    <FilterChip
                      label="All"
                      active={!designationFilter}
                      onClick={() => setDesignationFilter('')}
                      color="slate"
                    />
                    {designations.map((d) => (
                      <FilterChip
                        key={d.id}
                        label={d.des_name}
                        active={designationFilter === String(d.id)}
                        onClick={() => setDesignationFilter(
                          designationFilter === String(d.id) ? '' : String(d.id)
                        )}
                        color="emerald"
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Subject filter */}
              {uniqueSubjectNames.length > 0 && (
                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium text-slate-400 flex-shrink-0">Subject:</span>
                  <Select
                    value={subjectFilter}
                    onValueChange={(v) => setSubjectFilter(v === '__all__' ? '' : v)}
                  >
                    <SelectTrigger className="w-full sm:w-56 min-h-[36px] h-9 text-xs bg-slate-50 border-slate-200">
                      <SelectValue placeholder="All Subjects" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">All Subjects</SelectItem>
                      {uniqueSubjectNames.map((name) => (
                        <SelectItem key={name} value={name}>{name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* Active filter indicators */}
            {hasActiveFilters && (
              <div className="flex items-center flex-wrap gap-2 pt-2 border-t border-slate-100">
                <span className="text-xs text-slate-400">Active:</span>
                {departmentFilter && (
                  <Badge
                    variant="outline"
                    className="gap-1 text-xs cursor-pointer hover:bg-slate-50"
                    onClick={() => setDepartmentFilter('')}
                  >
                    {departments.find(d => String(d.id) === departmentFilter)?.dep_name || departmentFilter}
                    <X className="w-3 h-3" />
                  </Badge>
                )}
                {designationFilter && (
                  <Badge
                    variant="outline"
                    className="gap-1 text-xs cursor-pointer hover:bg-slate-50"
                    onClick={() => setDesignationFilter('')}
                  >
                    {designations.find(d => String(d.id) === designationFilter)?.des_name || designationFilter}
                    <X className="w-3 h-3" />
                  </Badge>
                )}
                {statusFilter && (
                  <Badge
                    variant="outline"
                    className="gap-1 text-xs cursor-pointer hover:bg-slate-50"
                    onClick={() => setStatusFilter('')}
                  >
                    {statusFilter === '1' ? 'Active' : 'Inactive'}
                    <X className="w-3 h-3" />
                  </Badge>
                )}
                {subjectFilter && (
                  <Badge
                    variant="outline"
                    className="gap-1 text-xs cursor-pointer hover:bg-slate-50"
                    onClick={() => setSubjectFilter('')}
                  >
                    {subjectFilter}
                    <X className="w-3 h-3" />
                  </Badge>
                )}
                {search && (
                  <Badge
                    variant="outline"
                    className="gap-1 text-xs cursor-pointer hover:bg-slate-50"
                    onClick={() => setSearch('')}
                  >
                    &ldquo;{search}&rdquo;
                    <X className="w-3 h-3" />
                  </Badge>
                )}
                <button
                  onClick={clearFilters}
                  className="text-xs text-red-500 hover:text-red-700 font-medium ml-2 transition-colors"
                >
                  Clear all
                </button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ─── Results Count ─────────────────────────────────────────────── */}
        {!loading && (
          <div className="flex items-center justify-between px-1">
            <p className="text-sm text-slate-500">
              Showing{' '}
              <span className="font-semibold text-slate-700">
                {displayedTeachers.length}
              </span>{' '}
              of{' '}
              <span className="font-semibold text-slate-700">{grandTotal}</span>{' '}
              teachers
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchTeachers}
              className="h-8 text-slate-400 hover:text-slate-600"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
              Refresh
            </Button>
          </div>
        )}

        {/* ─── Data Card ─────────────────────────────────────────────────── */}
        <Card className="border-slate-200/80 overflow-hidden">
          <CardContent className="p-0">
            {/* Desktop Table - CI3 column parity */}
            <div className="hidden lg:block">
              <Table>
                <TableHeader>
                  {/* CI3: Gender summary row spanning all columns */}
                  <TableRow className="bg-slate-100/80 hover:bg-slate-100/80">
                    <TableCell colSpan={11} className="py-2">
                      <div className="grid grid-cols-3 gap-3 py-1">
                        <div className="text-sm font-semibold text-slate-600">
                          MALES: <Badge variant="outline" className="ml-1 bg-slate-200 border-slate-300 text-slate-800">{totalMale}</Badge>
                        </div>
                        <div className="text-sm font-semibold text-slate-600">
                          FEMALES: <Badge variant="outline" className="ml-1 bg-slate-200 border-slate-300 text-slate-800">{totalFemale}</Badge>
                        </div>
                        <div className="text-sm font-semibold text-slate-600">
                          TOTAL: <Badge variant="outline" className="ml-1 bg-slate-200 border-slate-300 text-slate-800">{grandTotal}</Badge>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                  <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
                    <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider w-16">Photo</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Staff ID</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Name</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Gender</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Qualification</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider hidden xl:table-cell">Form Master</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider hidden lg:table-cell">Email</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider hidden xl:table-cell">Auth Key</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider hidden lg:table-cell">Phone</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Account Status</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider text-right pr-4">Options</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableSkeleton />
                  ) : displayedTeachers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={11}>
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                            <GraduationCap className="w-8 h-8 text-slate-300" />
                          </div>
                          <p className="font-semibold text-slate-600 text-base">No teachers found</p>
                          <p className="text-sm text-slate-400 mt-1 max-w-sm">
                            {hasActiveFilters
                              ? 'No teachers match your current filters. Try adjusting or clearing them.'
                              : 'Get started by adding your first teacher to the system.'}
                          </p>
                          {!hasActiveFilters && (isAdmin || hasPermission('teachers.create')) && (
                            <Button
                              onClick={openAddForm}
                              className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                            >
                              <UserPlus className="w-4 h-4 mr-2" />
                              Add First Teacher
                            </Button>
                          )}
                          {hasActiveFilters && (
                            <Button
                              variant="outline"
                              onClick={clearFilters}
                              className="mt-4 border-slate-200 text-slate-600 hover:bg-slate-50"
                            >
                              <X className="w-4 h-4 mr-2" />
                              Clear Filters
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    displayedTeachers.map((t) => (
                      <TableRow key={t.teacher_id} className="hover:bg-slate-50/50 transition-colors group">
                        {/* Photo */}
                        <TableCell>
                          <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white bg-gradient-to-br from-emerald-500 to-emerald-700 flex-shrink-0 shadow-sm">
                            {t.name?.charAt(0) || '?'}
                          </div>
                        </TableCell>
                        {/* Staff ID */}
                        <TableCell>
                          <code className="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded">{t.teacher_code || '—'}</code>
                        </TableCell>
                        {/* Name */}
                        <TableCell>
                          <p className="font-medium text-sm text-slate-900 truncate">{t.name}</p>
                        </TableCell>
                        {/* Gender */}
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              t.gender === 'Male'
                                ? 'border-sky-200 bg-sky-50 text-sky-700 text-xs font-normal'
                                : 'border-pink-200 bg-pink-50 text-pink-700 text-xs font-normal'
                            }
                          >
                            {t.gender || '—'}
                          </Badge>
                        </TableCell>
                        {/* Qualification (designation) */}
                        <TableCell>
                          <span className="text-sm text-slate-700">{t.designation?.des_name || '—'}</span>
                        </TableCell>
                        {/* Form Master */}
                        <TableCell className="hidden xl:table-cell">
                          {t.form_master.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {t.form_master.map((fm, i) => (
                                <Badge key={i} variant="outline" className="text-xs border-amber-200 text-amber-700 bg-amber-50 font-normal">
                                  {fm}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <span className="text-slate-400 text-sm">—</span>
                          )}
                        </TableCell>
                        {/* Email */}
                        <TableCell className="hidden lg:table-cell">
                          <span className="text-sm text-slate-600 truncate block max-w-[200px]">{t.email}</span>
                        </TableCell>
                        {/* Auth Key */}
                        <TableCell className="hidden xl:table-cell">
                          <code className="text-xs font-mono bg-amber-50 text-amber-700 px-2 py-0.5 rounded">{t.authentication_key || '—'}</code>
                        </TableCell>
                        {/* Phone */}
                        <TableCell className="hidden lg:table-cell">
                          <span className="text-sm text-slate-600">{t.phone || '—'}</span>
                        </TableCell>
                        {/* Account Status */}
                        <TableCell>
                          <StatusBadge teacher={t} />
                        </TableCell>
                        {/* Options (Actions) */}
                        <TableCell className="text-right pr-2">
                          <div className="flex items-center justify-end gap-0.5">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-slate-400 hover:text-emerald-600"
                              onClick={() => { setViewTeacher(t); setViewOpen(true); }}
                              title="View Profile"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            {(isAdmin || hasPermission('teachers.update')) && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-slate-400 hover:text-sky-600"
                                onClick={() => openEditForm(t)}
                                title="Edit"
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>
                            )}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-600" title="More actions">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => { setViewTeacher(t); setViewOpen(true); }}>
                                  <Eye className="w-4 h-4 mr-2 text-emerald-600" />
                                  <span>View Profile</span>
                                </DropdownMenuItem>
                                {(isAdmin || hasPermission('teachers.update')) && (
                                  <DropdownMenuItem onClick={() => openEditForm(t)}>
                                    <Pencil className="w-4 h-4 mr-2 text-sky-600" />
                                    <span>Edit</span>
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                {(isAdmin || hasPermission('teachers.update')) && (
                                  t.block_limit >= 3 ? (
                                    <DropdownMenuItem onClick={() => handleUnblock(t)}>
                                      <Unlock className="w-4 h-4 mr-2 text-emerald-600" />
                                      <span>Unblock Account</span>
                                    </DropdownMenuItem>
                                  ) : (
                                    <DropdownMenuItem onClick={() => handleBlock(t)} className="text-amber-600">
                                      <Lock className="w-4 h-4 mr-2" />
                                      <span>Block Account</span>
                                    </DropdownMenuItem>
                                  )
                                )}
                                {(isAdmin || hasPermission('teachers.delete')) && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => setDeleteTarget(t)} className="text-red-600 focus:text-red-600">
                                      <Trash2 className="w-4 h-4 mr-2" />
                                      <span>Delete</span>
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden divide-y divide-slate-100">
              {loading ? (
                <>
                  <MobileCardSkeleton />
                  <MobileCardSkeleton />
                  <MobileCardSkeleton />
                </>
              ) : displayedTeachers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center px-6">
                  <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                    <GraduationCap className="w-8 h-8 text-slate-300" />
                  </div>
                  <p className="font-semibold text-slate-600">No teachers found</p>
                  <p className="text-sm text-slate-400 mt-1">
                    {hasActiveFilters
                      ? 'Try adjusting your filters.'
                      : 'Add your first teacher to get started.'}
                  </p>
                  {!hasActiveFilters && (isAdmin || hasPermission('teachers.create')) && (
                    <Button
                      onClick={openAddForm}
                      className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white min-h-[44px]"
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      Add Teacher
                    </Button>
                  )}
                  {hasActiveFilters && (
                    <Button
                      variant="outline"
                      onClick={clearFilters}
                      className="mt-4 min-h-[44px]"
                    >
                      Clear Filters
                    </Button>
                  )}
                </div>
              ) : (
                displayedTeachers.map((t) => (
                  <div key={t.teacher_id} className="p-4 space-y-3">
                    {/* Teacher info row */}
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-bold text-white bg-gradient-to-br from-emerald-500 to-emerald-700 shadow-sm">
                        {t.name?.charAt(0) || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-semibold text-sm text-slate-900 truncate">{t.name}</p>
                            <p className="text-xs text-slate-500 mt-0.5">
                              <code className="font-mono bg-slate-100 px-1 rounded text-[10px]">{t.teacher_code}</code>
                              {' '}&middot;{' '}
                              {[t.designation?.des_name, t.department?.dep_name].filter(Boolean).join(' · ') || 'No designation'}
                            </p>
                          </div>
                          <StatusBadge teacher={t} />
                        </div>
                      </div>
                    </div>

                    {/* Gender & Auth Key */}
                    <div className="ml-15 flex items-center gap-2 text-xs">
                      <Badge
                        variant="outline"
                        className={
                          t.gender === 'Male'
                            ? 'border-sky-200 bg-sky-50 text-sky-700 text-xs font-normal'
                            : 'border-pink-200 bg-pink-50 text-pink-700 text-xs font-normal'
                        }
                      >
                        {t.gender}
                      </Badge>
                      <code className="font-mono bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded text-[10px]">{t.authentication_key}</code>
                    </div>

                    {/* Details */}
                    <div className="ml-15 space-y-1 text-xs text-slate-500">
                      <p className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <span className="truncate">{t.email}</span>
                      </p>
                      <p className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>{t.phone}</span>
                      </p>
                      {t.form_master.length > 0 && (
                        <div className="flex items-center gap-1.5 pt-0.5">
                          <BookOpen className="w-3.5 h-3.5 text-amber-500" />
                          <span className="text-amber-700 font-medium">Form Master: {t.form_master.join(', ')}</span>
                        </div>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-2 pt-1">
                      <Button
                        variant="outline"
                        className="flex-1 min-h-[44px] h-11 text-xs border-slate-200 text-slate-600 hover:bg-slate-50"
                        onClick={() => { setViewTeacher(t); setViewOpen(true); }}
                      >
                        <Eye className="w-3.5 h-3.5 mr-1.5" />
                        View
                      </Button>
                      {(isAdmin || hasPermission('teachers.update')) && (
                        <Button
                          variant="outline"
                          className="flex-1 min-h-[44px] h-11 text-xs border-slate-200 text-slate-600 hover:bg-slate-50"
                          onClick={() => openEditForm(t)}
                        >
                          <Pencil className="w-3.5 h-3.5 mr-1.5" />
                          Edit
                        </Button>
                      )}
                      {(isAdmin || hasPermission('teachers.delete')) && (
                        <Button
                          variant="outline"
                          className="min-h-[44px] min-w-[44px] h-11 w-11 text-xs text-red-500 border-red-200 hover:bg-red-50 p-0"
                          onClick={() => setDeleteTarget(t)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50/50">
                <p className="text-xs text-slate-500 sm:hidden">
                  Page {page} of {totalPages}
                </p>
                <p className="text-xs text-slate-500 hidden sm:block">
                  Showing {(page - 1) * pageSize + 1}&ndash;{Math.min(page * pageSize, grandTotal)} of {grandTotal}
                </p>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 min-w-[32px]"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-sm px-2.5 text-slate-600 font-medium min-w-[60px] text-center">
                    {page} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 min-w-[32px]"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ─── Add/Edit Teacher Dialog ────────────────────────────────────────── */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isAddMode ? 'bg-blue-100' : 'bg-green-100'}`}>
                {isAddMode ? (
                  <UserPlus className="w-4 h-4 text-blue-600" />
                ) : (
                  <Pencil className="w-4 h-4 text-green-600" />
                )}
              </div>
              {isAddMode ? 'Add Teacher' : 'Edit Teacher'}
            </DialogTitle>
            <DialogDescription>
              {isAddMode ? 'Fill in the form to add a new teacher.' : 'Update teacher information below.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* ─── Personal Information ─────────────────────────────────── */}
            <div>
              <h3 className={`text-sm font-semibold mb-3 pb-2 border-b flex items-center gap-2 ${isAddMode ? 'text-slate-800 border-blue-300' : 'text-slate-800 border-green-300'}`}>
                <FileText className={`w-4 h-4 ${isAddMode ? 'text-blue-600' : 'text-green-600'}`} />
                Personal Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm">First Name <span className="text-red-500">*</span></Label>
                  <Input placeholder="First name" value={formData.first_name} onChange={(e) => setFormData({ ...formData, first_name: e.target.value })} className="mt-1" />
                </div>
                <div>
                  <Label className="text-sm">Other Name</Label>
                  <Input placeholder="Other name (optional)" value={formData.other_name} onChange={(e) => setFormData({ ...formData, other_name: e.target.value })} className="mt-1" />
                </div>
                <div>
                  <Label className="text-sm">Last Name <span className="text-red-500">*</span></Label>
                  <Input placeholder="Last name" value={formData.last_name} onChange={(e) => setFormData({ ...formData, last_name: e.target.value })} className="mt-1" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                {/* Staff ID - CI3: auto-gen with validate in add, disabled in edit */}
                <div>
                  <Label className="text-sm">Staff ID <span className="text-red-500">*</span></Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      placeholder="e.g. TCH-0001"
                      value={formData.teacher_code}
                      onChange={(e) => setFormData({ ...formData, teacher_code: e.target.value })}
                      disabled={!isAddMode}
                      className={!isAddMode ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}
                    />
                    {isAddMode && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={generateTeacherCode}
                        disabled={generatingCode}
                        className="flex-shrink-0 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                      >
                        {generatingCode ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4" />
                        )}
                        <span className="hidden sm:inline ml-1.5">Validate</span>
                      </Button>
                    )}
                  </div>
                </div>
                <div>
                  <Label className="text-sm">Qualification</Label>
                  <Select value={formData.designation_id} onValueChange={(v) => setFormData({ ...formData, designation_id: v })}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Select qualification" /></SelectTrigger>
                    <SelectContent>
                      {designations.map((d) => (
                        <SelectItem key={d.id} value={String(d.id)}>{d.des_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
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
                <div>
                  <Label className="text-sm">Address</Label>
                  <Input placeholder="Address" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} className="mt-1" />
                </div>
              </div>
            </div>

            {/* ─── Contact Information ─────────────────────────────────── */}
            <div>
              <h3 className={`text-sm font-semibold mb-3 pb-2 border-b flex items-center gap-2 ${isAddMode ? 'text-slate-800 border-blue-300' : 'text-slate-800 border-green-300'}`}>
                <Phone className={`w-4 h-4 ${isAddMode ? 'text-blue-600' : 'text-green-600'}`} />
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
                  <Label className="text-sm">
                    {isAddMode ? 'Password' : 'New Password'} {!isAddMode ? '' : <span className="text-red-500">*</span>}
                  </Label>
                  <Input
                    type="password"
                    placeholder={isAddMode ? 'Password' : 'Leave blank to keep current'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            {/* ─── Identification (CI3 parity) ──────────────────────────── */}
            <div>
              <h3 className={`text-sm font-semibold mb-3 pb-2 border-b flex items-center gap-2 ${isAddMode ? 'text-slate-800 border-blue-300' : 'text-slate-800 border-green-300'}`}>
                <IdCard className={`w-4 h-4 ${isAddMode ? 'text-blue-600' : 'text-green-600'}`} />
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

            {/* ─── Department ───────────────────────────────────────────── */}
            <div>
              <h3 className={`text-sm font-semibold mb-3 pb-2 border-b flex items-center gap-2 ${isAddMode ? 'text-slate-800 border-blue-300' : 'text-slate-800 border-green-300'}`}>
                <Building2 className={`w-4 h-4 ${isAddMode ? 'text-blue-600' : 'text-green-600'}`} />
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

            {/* ─── Social Links (CI3 parity) ───────────────────────────── */}
            <div>
              <h3 className={`text-sm font-semibold mb-3 pb-2 border-b flex items-center gap-2 ${isAddMode ? 'text-slate-800 border-blue-300' : 'text-slate-800 border-green-300'}`}>
                <Globe className={`w-4 h-4 ${isAddMode ? 'text-blue-600' : 'text-green-600'}`} />
                Social Links
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                  <Label className="text-sm">Facebook</Label>
                  <div className="relative mt-1">
                    <Globe className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input placeholder="Facebook URL" value={formData.facebook} onChange={(e) => setFormData({ ...formData, facebook: e.target.value })} className="pl-9" />
                  </div>
                </div>
                <div className="relative">
                  <Label className="text-sm">Twitter</Label>
                  <div className="relative mt-1">
                    <Globe className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input placeholder="Twitter handle" value={formData.twitter} onChange={(e) => setFormData({ ...formData, twitter: e.target.value })} className="pl-9" />
                  </div>
                </div>
                <div className="relative">
                  <Label className="text-sm">LinkedIn</Label>
                  <div className="relative mt-1">
                    <Globe className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input placeholder="LinkedIn URL" value={formData.linkedin} onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })} className="pl-9" />
                  </div>
                </div>
              </div>
            </div>

            {/* ─── Account Information (CI3 parity) ────────────────────── */}
            <div>
              <h3 className={`text-sm font-semibold mb-3 pb-2 border-b flex items-center gap-2 ${isAddMode ? 'text-slate-800 border-blue-300' : 'text-slate-800 border-green-300'}`}>
                <CreditCard className={`w-4 h-4 ${isAddMode ? 'text-blue-600' : 'text-green-600'}`} />
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
            <Button variant="outline" onClick={() => setFormOpen(false)} className="min-h-[44px]">Cancel</Button>
            <Button
              onClick={handleSave}
              disabled={formSaving}
              className={`min-h-[44px] text-white ${isAddMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'}`}
            >
              {formSaving ? (
                <>
                  <span className="animate-spin mr-2 inline-block">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  </span>
                  Saving...
                </>
              ) : isAddMode ? 'Add Teacher' : 'Update Teacher'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── View Teacher Dialog ────────────────────────────────────────────── */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Teacher Profile</DialogTitle>
            <DialogDescription>View detailed teacher information</DialogDescription>
          </DialogHeader>
          {viewTeacher && (
            <div className="space-y-5">
              {/* Avatar header */}
              <div className="text-center pb-4 border-b">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-full mx-auto flex items-center justify-center mb-3 shadow-md">
                  <span className="text-xl font-bold text-white">{viewTeacher.name?.charAt(0) || '?'}</span>
                </div>
                <p className="font-bold text-lg text-slate-900">{viewTeacher.name}</p>
                <p className="text-sm text-slate-500 mt-0.5">
                  {[viewTeacher.designation?.des_name, viewTeacher.department?.dep_name].filter(Boolean).join(' · ') || 'No designation'}
                </p>
                <div className="flex items-center justify-center gap-2 mt-2">
                  <StatusBadge teacher={viewTeacher} />
                  <Badge variant="outline" className={viewTeacher.gender === 'Male' ? 'border-sky-200 text-sky-700 bg-sky-50' : 'border-pink-200 text-pink-700 bg-pink-50'}>
                    {viewTeacher.gender}
                  </Badge>
                </div>
              </div>

              {/* Info grid */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <IdCard className="w-4 h-4 text-slate-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-slate-400 font-medium">Staff ID</p>
                    <p className="font-mono text-xs text-slate-700 mt-0.5">{viewTeacher.teacher_code || '—'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Shield className="w-4 h-4 text-amber-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-slate-400 font-medium">Auth Key</p>
                    <p className="font-mono text-xs text-amber-700 mt-0.5 tracking-widest break-all">{viewTeacher.authentication_key}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Mail className="w-4 h-4 text-slate-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-slate-400 font-medium">Email</p>
                    <p className="text-xs text-slate-700 mt-0.5 truncate">{viewTeacher.email || '—'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Phone className="w-4 h-4 text-slate-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-slate-400 font-medium">Phone</p>
                    <p className="text-xs text-slate-700 mt-0.5">{viewTeacher.phone || '—'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <FileText className="w-4 h-4 text-slate-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-slate-400 font-medium">Date of Birth</p>
                    <p className="text-xs text-slate-700 mt-0.5">{viewTeacher.birthday ? new Date(viewTeacher.birthday).toLocaleDateString() : '—'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <BookOpen className="w-4 h-4 text-slate-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-slate-400 font-medium">Joined</p>
                    <p className="text-xs text-slate-700 mt-0.5">{viewTeacher.joining_date ? new Date(viewTeacher.joining_date).toLocaleDateString() : '—'}</p>
                  </div>
                </div>
              </div>

              {/* Address */}
              {viewTeacher.address && (
                <div className="text-sm">
                  <p className="text-xs text-slate-400 font-medium mb-1">Address</p>
                  <p className="text-slate-700 text-sm">{viewTeacher.address}</p>
                </div>
              )}

              {/* Form Master */}
              {viewTeacher.form_master.length > 0 && (
                <div>
                  <p className="text-xs text-slate-400 font-medium mb-1.5">Form Master</p>
                  <div className="flex flex-wrap gap-1.5">
                    {viewTeacher.form_master.map((fm, i) => (
                      <Badge key={i} variant="outline" className="border-amber-200 text-amber-700 bg-amber-50 text-xs">
                        {fm}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setViewOpen(false)} className="min-h-[44px]">Close</Button>
            {viewTeacher && (isAdmin || hasPermission('teachers.update')) && (
              <Button
                onClick={() => { setViewOpen(false); openEditForm(viewTeacher); }}
                className="bg-green-600 hover:bg-green-700 text-white min-h-[44px]"
              >
                <Pencil className="w-4 h-4 mr-2" />
                Edit
              </Button>
            )}
          </DialogFooter>
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
            <AlertDialogCancel className="min-h-[44px]">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 text-white min-h-[44px]"
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
