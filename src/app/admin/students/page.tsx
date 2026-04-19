'use client';

import { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/use-auth';
import { PERMISSIONS } from '@/lib/permission-constants';
import {
  Search, Plus, Download, Users, GraduationCap, ChevronLeft, ChevronRight,
  Eye, Pencil, Trash2, UserPlus, Phone, Mail, Calendar, MapPin, X,
  UserCheck, Baby, Venus, Mars, Filter, BookOpenCheck,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

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

interface SectionOption {
  section_id: number;
  name: string;
  class_id: number;
}

// ─── Skeleton Components ─────────────────────────────────────────────────────

function StatCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/60 p-4 sm:p-5 flex flex-col">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-2.5">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-8 w-16" />
        </div>
        <Skeleton className="w-11 h-11 rounded-xl flex-shrink-0" />
      </div>
    </div>
  );
}

function FilterBarSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/60 p-4">
      <div className="flex flex-col lg:flex-row gap-3">
        <Skeleton className="h-11 flex-1 rounded-lg" />
        <div className="flex gap-2">
          <Skeleton className="h-11 w-40 rounded-lg hidden lg:block" />
          <Skeleton className="h-11 w-40 rounded-lg hidden lg:block" />
          <Skeleton className="h-11 w-36 rounded-lg hidden lg:block" />
          <Skeleton className="h-11 w-36 rounded-lg hidden lg:block" />
        </div>
      </div>
      <div className="flex gap-2 mt-3 lg:hidden">
        <Skeleton className="h-9 w-24 rounded-full" />
        <Skeleton className="h-9 w-24 rounded-full" />
        <Skeleton className="h-9 w-24 rounded-full" />
      </div>
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/60 p-4 sm:p-6">
      <div className="space-y-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}

// ─── Stat Card Component ─────────────────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  subValue,
  iconBg,
  borderColor,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  subValue?: string;
  iconBg: string;
  borderColor: string;
}) {
  return (
    <div
      className="group relative bg-white rounded-2xl border border-slate-200/60 p-4 sm:p-5 hover:-translate-y-0.5 hover:shadow-lg hover:border-slate-300/80 transition-all duration-200 flex flex-col"
      style={{ borderLeft: `4px solid ${borderColor}` }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            {label}
          </p>
          <p className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1.5 tabular-nums leading-tight">
            {value}
          </p>
          {subValue && (
            <p className="text-xs text-slate-500 mt-1.5">{subValue}</p>
          )}
        </div>
        <div
          className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}
        >
          <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
        </div>
      </div>
    </div>
  );
}

// ─── Status helpers ──────────────────────────────────────────────────────────

function statusColor(status: string) {
  switch (status) {
    case 'active': return 'border-emerald-200 bg-emerald-50 text-emerald-700';
    case 'inactive': return 'border-slate-200 bg-slate-50 text-slate-600';
    case 'graduated': return 'border-sky-200 bg-sky-50 text-sky-700';
    case 'transferred': return 'border-amber-200 bg-amber-50 text-amber-700';
    default: return 'border-slate-200 bg-slate-50 text-slate-600';
  }
}

function StatusBadge({ status }: { status: string }) {
  return (
    <Badge variant="outline" className={`capitalize text-xs ${statusColor(status)}`}>
      {status}
    </Badge>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function StudentsPage() {
  const { isLoading: authLoading, hasPermission, isSuperAdmin } = useAuth();

  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [sectionFilter, setSectionFilter] = useState('');
  const [genderFilter, setGenderFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [sections, setSections] = useState<SectionOption[]>([]);

  // Permission checks
  const canViewStudents = isSuperAdmin || hasPermission(PERMISSIONS.CAN_VIEW_STUDENTS_LIST);
  const canEditStudents = isSuperAdmin || hasPermission(PERMISSIONS.CAN_EDIT_STUDENTS);
  const canDeleteStudents = isSuperAdmin || hasPermission(PERMISSIONS.CAN_DELETE_STUDENTS);
  const canAdmitStudents = isSuperAdmin || hasPermission(PERMISSIONS.CAN_ADMIT_STUDENTS);

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

  // Delete Dialog
  const [deleteTarget, setDeleteTarget] = useState<Student | null>(null);
  const [deleting, setDeleting] = useState(false);

  // ─── Active filters for chip display ───────────────────────────────────────

  const activeFilters = [
    classFilter ? { key: 'class', label: `Class: ${classes.find(c => String(c.class_id) === classFilter)?.name || classFilter}` } : null,
    sectionFilter ? { key: 'section', label: `Section: ${sections.find(s => String(s.section_id) === sectionFilter)?.name || sectionFilter}` } : null,
    genderFilter ? { key: 'gender', label: `Gender: ${genderFilter}` } : null,
    statusFilter ? { key: 'status', label: `Status: ${statusFilter}` } : null,
  ].filter(Boolean) as { key: string; label: string }[];

  const clearFilter = (key: string) => {
    switch (key) {
      case 'class': setClassFilter(''); break;
      case 'section': setSectionFilter(''); break;
      case 'gender': setGenderFilter(''); break;
      case 'status': setStatusFilter(''); break;
    }
  };

  const clearAllFilters = () => {
    setClassFilter('');
    setSectionFilter('');
    setGenderFilter('');
    setStatusFilter('');
    setSearch('');
  };

  // ─── Data fetching ─────────────────────────────────────────────────────────

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (classFilter) params.set('classId', classFilter);
      if (statusFilter) params.set('status', statusFilter);
      if (genderFilter) params.set('gender', genderFilter);
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
  }, [search, classFilter, sectionFilter, genderFilter, statusFilter, page]);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  useEffect(() => { setPage(1); }, [classFilter, sectionFilter, genderFilter, statusFilter]);

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

  // Fetch sections when class filter changes
  useEffect(() => {
    if (classFilter) {
      fetch(`/api/classes/${classFilter}`)
        .then(r => r.json())
        .then(d => {
          setSections(Array.isArray(d.sections) ? d.sections : []);
        })
        .catch(() => setSections([]));
    } else {
      setSections([]);
      setSectionFilter('');
    }
  }, [classFilter]);

  // ─── Computed stats ────────────────────────────────────────────────────────

  const totalActive = students.filter(s => s.status === 'active').length;
  const totalMale = students.filter(s => s.gender === 'male').length;
  const totalFemale = students.filter(s => s.gender === 'female').length;

  // Count students admitted this year
  const currentYear = new Date().getFullYear();
  const newThisTerm = students.filter(s => {
    if (!s.admission_date) return false;
    return new Date(s.admission_date).getFullYear() === currentYear;
  }).length;

  // ─── Form handlers ─────────────────────────────────────────────────────────

  const openAddForm = () => {
    if (!canAdmitStudents) {
      toast.error('You do not have permission to add students');
      return;
    }
    setEditingStudent(null);
    setFormData({ name: '', gender: 'male', dob: '', phone: '', address: '', class_id: '', parent_name: '', parent_phone: '', parent_email: '' });
    setFormOpen(true);
  };

  const openEditForm = (student: Student) => {
    if (!canEditStudents) {
      toast.error('You do not have permission to edit students');
      return;
    }
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
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save student';
      toast.error(message);
    } finally {
      setFormSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    if (!canDeleteStudents) {
      toast.error('You do not have permission to delete students');
      setDeleteTarget(null);
      return;
    }
    setDeleting(true);
    try {
      const res = await fetch(`/api/students/${deleteTarget.student_id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast.success('Student removed');
      setDeleteTarget(null);
      fetchStudents();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to remove student';
      toast.error(message);
    } finally {
      setDeleting(false);
    }
  };

  const handleExportCSV = () => {
    const headers = ['Code', 'Name', 'Gender', 'Class', 'Section', 'Status', 'Phone', 'Parent', 'Admission Date'];
    const rows = students.map(s => [
      s.student_code, s.name, s.gender, s.class?.name || '', s.section?.name || '',
      s.status, s.phone || '', s.parent?.name || '',
      s.admission_date ? new Date(s.admission_date).toLocaleDateString() : '',
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

  // ─── Loading State ─────────────────────────────────────────────────────────

  if (authLoading || loading) {
    return (
      <DashboardLayout>
        <div className="space-y-5 sm:space-y-6">
          {/* Title skeleton */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1.5">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-72" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-11 w-28 rounded-lg" />
              <Skeleton className="h-11 w-40 rounded-lg" />
            </div>
          </div>

          {/* Stat cards skeleton */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </div>

          {/* Filter bar skeleton */}
          <FilterBarSkeleton />

          {/* Table skeleton */}
          <TableSkeleton />
        </div>
      </DashboardLayout>
    );
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <DashboardLayout>
      <div className="space-y-5 sm:space-y-6">
        {/* ═══════════════════════════════════════════════════════
            Page Header
            ═══════════════════════════════════════════════════════ */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Students
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Manage student enrollment, records and profiles
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleExportCSV}
              className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 min-h-[44px]"
            >
              <Download className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Export</span>
            </Button>
            {canAdmitStudents && (
              <Button
                onClick={openAddForm}
                className="bg-emerald-600 hover:bg-emerald-700 min-h-[44px]"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Enroll Student
              </Button>
            )}
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════
            Quick Stats Row
            ═══════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <StatCard
            icon={GraduationCap}
            label="Total Students"
            value={total}
            subValue={`${classes.length} classes`}
            iconBg="bg-emerald-500"
            borderColor="#10b981"
          />
          <StatCard
            icon={UserCheck}
            label="Active"
            value={totalActive}
            subValue={total > 0 ? `${Math.round((totalActive / total) * 100)}% of total` : undefined}
            iconBg="bg-sky-500"
            borderColor="#0ea5e9"
          />
          <StatCard
            icon={Baby}
            label="New This Year"
            value={newThisTerm}
            subValue={`Admitted in ${currentYear}`}
            iconBg="bg-violet-500"
            borderColor="#8b5cf6"
          />
          <StatCard
            icon={Venus}
            label="Gender Split"
            value={`${totalMale}/${totalFemale}`}
            subValue={`${totalMale} male, ${totalFemale} female`}
            iconBg="bg-amber-500"
            borderColor="#f59e0b"
          />
        </div>

        {/* ═══════════════════════════════════════════════════════
            Filter Bar
            ═══════════════════════════════════════════════════════ */}
        <div className="bg-white rounded-2xl border border-slate-200/60 p-4">
          <div className="flex flex-col lg:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search by name or student code..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 min-h-[44px]"
              />
            </div>

            {/* Desktop Filters */}
            <div className="hidden lg:flex gap-2">
              <Select
                value={classFilter}
                onValueChange={(v) => (v === '__all__' ? setClassFilter('') : setClassFilter(v))}
              >
                <SelectTrigger className="w-48 min-h-[44px]">
                  <SelectValue placeholder="All Classes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All Classes</SelectItem>
                  {classes.map(c => (
                    <SelectItem key={c.class_id} value={String(c.class_id)}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={sectionFilter}
                onValueChange={(v) => (v === '__all__' ? setSectionFilter('') : setSectionFilter(v))}
                disabled={!classFilter}
              >
                <SelectTrigger className="w-40 min-h-[44px]">
                  <SelectValue placeholder="All Sections" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All Sections</SelectItem>
                  {sections.map(s => (
                    <SelectItem key={s.section_id} value={String(s.section_id)}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={genderFilter}
                onValueChange={(v) => (v === '__all__' ? setGenderFilter('') : setGenderFilter(v))}
              >
                <SelectTrigger className="w-36 min-h-[44px]">
                  <SelectValue placeholder="All Genders" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All Genders</SelectItem>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={statusFilter}
                onValueChange={(v) => (v === '__all__' ? setStatusFilter('') : setStatusFilter(v))}
              >
                <SelectTrigger className="w-40 min-h-[44px]">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="graduated">Graduated</SelectItem>
                  <SelectItem value="transferred">Transferred</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Active filter chips + Mobile filter buttons */}
          {(activeFilters.length > 0) && (
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              {activeFilters.map(f => (
                <Badge
                  key={f.key}
                  variant="outline"
                  className="bg-slate-50 border-slate-200 text-slate-700 text-xs pr-1 gap-1"
                >
                  {f.label}
                  <button
                    onClick={() => clearFilter(f.key)}
                    className="ml-0.5 w-4 h-4 rounded-full hover:bg-slate-200 inline-flex items-center justify-center transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
              <button
                onClick={clearAllFilters}
                className="text-xs text-slate-500 hover:text-slate-700 underline-offset-2 hover:underline transition-colors"
              >
                Clear all
              </button>
            </div>
          )}

          {/* Mobile Filter Chips */}
          <div className="flex flex-wrap gap-2 mt-3 lg:hidden">
            <Select
              value={classFilter}
              onValueChange={(v) => (v === '__all__' ? setClassFilter('') : setClassFilter(v))}
            >
              <SelectTrigger className="h-9 w-auto text-xs rounded-full border-slate-200">
                <BookOpenCheck className="w-3.5 h-3.5 mr-1 text-slate-400" />
                <SelectValue placeholder="Class" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All Classes</SelectItem>
                {classes.map(c => (
                  <SelectItem key={c.class_id} value={String(c.class_id)}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={sectionFilter}
              onValueChange={(v) => (v === '__all__' ? setSectionFilter('') : setSectionFilter(v))}
              disabled={!classFilter}
            >
              <SelectTrigger className="h-9 w-auto text-xs rounded-full border-slate-200">
                <BookOpenCheck className="w-3.5 h-3.5 mr-1 text-slate-400" />
                <SelectValue placeholder="Section" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All Sections</SelectItem>
                {sections.map(s => (
                  <SelectItem key={s.section_id} value={String(s.section_id)}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={genderFilter}
              onValueChange={(v) => (v === '__all__' ? setGenderFilter('') : setGenderFilter(v))}
            >
              <SelectTrigger className="h-9 w-auto text-xs rounded-full border-slate-200">
                <Users className="w-3.5 h-3.5 mr-1 text-slate-400" />
                <SelectValue placeholder="Gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All</SelectItem>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={statusFilter}
              onValueChange={(v) => (v === '__all__' ? setStatusFilter('') : setStatusFilter(v))}
            >
              <SelectTrigger className="h-9 w-auto text-xs rounded-full border-slate-200">
                <UserCheck className="w-3.5 h-3.5 mr-1 text-slate-400" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="graduated">Graduated</SelectItem>
                <SelectItem value="transferred">Transferred</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════
            Data Table / Mobile Card View
            ═══════════════════════════════════════════════════════ */}
        <div className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden">
          {/* Results header */}
          {!loading && students.length > 0 && (
            <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-slate-100 bg-slate-50/50">
              <p className="text-xs font-medium text-slate-500">
                Showing {(page - 1) * 15 + 1}–{Math.min(page * 15, total)} of {total} students
              </p>
            </div>
          )}

          {/* Desktop Table View */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 hover:bg-slate-50">
                  <TableHead className="text-xs font-semibold text-slate-600">Student</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-600">Code</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-600">Class</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-600 hidden xl:table-cell">Section</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-600 hidden lg:table-cell">Parent</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-600">Status</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-600 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-20 text-slate-400">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center">
                          <GraduationCap className="w-8 h-8 text-slate-400" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-500 text-base">No students found</p>
                          <p className="text-xs text-slate-400 mt-1">
                            {search || classFilter || statusFilter || genderFilter || sectionFilter
                              ? 'Try adjusting your search or filters'
                              : 'Enroll your first student to get started'}
                          </p>
                        </div>
                        {!search && !classFilter && !statusFilter && !genderFilter && !sectionFilter && canAdmitStudents && (
                          <Button
                            onClick={openAddForm}
                            variant="outline"
                            className="mt-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50 min-h-[44px]"
                          >
                            <UserPlus className="w-4 h-4 mr-2" />
                            Enroll Student
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  students.map((s) => (
                    <TableRow key={s.student_id} className="hover:bg-slate-50/50 transition-colors">
                      {/* Student Avatar + Name */}
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white bg-gradient-to-br from-emerald-500 to-emerald-700 flex-shrink-0">
                            {s.name?.charAt(0) || '?'}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-sm text-slate-900 truncate">{s.name}</p>
                            <p className="text-xs text-slate-500 capitalize flex items-center gap-1">
                              {s.gender === 'male' ? (
                                <Mars className="w-3 h-3 text-blue-500" />
                              ) : (
                                <Venus className="w-3 h-3 text-pink-500" />
                              )}
                              {s.gender}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      {/* Code */}
                      <TableCell>
                        <code className="text-xs font-mono bg-slate-100 px-2 py-0.5 rounded">{s.student_code}</code>
                      </TableCell>
                      {/* Class */}
                      <TableCell>
                        <span className="text-sm text-slate-700">{s.class?.name || '—'}</span>
                      </TableCell>
                      {/* Section (xl+) */}
                      <TableCell className="hidden xl:table-cell">
                        <span className="text-sm text-slate-600">{s.section?.name || '—'}</span>
                      </TableCell>
                      {/* Parent (lg+) */}
                      <TableCell className="hidden lg:table-cell">
                        <div>
                          <p className="text-sm text-slate-700">{s.parent?.name || '—'}</p>
                          <p className="text-xs text-slate-400">{s.parent?.phone || ''}</p>
                        </div>
                      </TableCell>
                      {/* Status */}
                      <TableCell>
                        <StatusBadge status={s.status} />
                      </TableCell>
                      {/* Actions */}
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 min-w-[32px]"
                            onClick={() => { setViewStudent(s); setViewOpen(true); }}
                            title="View Profile"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {canEditStudents && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 min-w-[32px]"
                              onClick={() => openEditForm(s)}
                              title="Edit"
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                          )}
                          {canDeleteStudents && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 min-w-[32px] text-red-500 hover:text-red-600 hover:bg-red-50"
                              onClick={() => setDeleteTarget(s)}
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden divide-y divide-slate-100">
            {students.length === 0 ? (
              <div className="text-center py-20 text-slate-400">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center">
                    <GraduationCap className="w-8 h-8 text-slate-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-500 text-base">No students found</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {search || classFilter || statusFilter || genderFilter || sectionFilter
                        ? 'Try adjusting your filters'
                        : 'Enroll your first student'}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              students.map((s) => (
                <div key={s.student_id} className="p-4 space-y-3">
                  {/* Student info header */}
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-bold text-white bg-gradient-to-br from-emerald-500 to-emerald-700">
                      {s.name?.charAt(0) || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-semibold text-sm text-slate-900 truncate">{s.name}</p>
                          <p className="text-xs text-slate-500 font-mono">{s.student_code}</p>
                        </div>
                        <StatusBadge status={s.status} />
                      </div>
                      {/* Info grid */}
                      <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-slate-500">
                        <p className="flex items-center gap-1.5">
                          <BookOpenCheck className="w-3 h-3 text-slate-400" />
                          <span>{s.class?.name || 'No class'}{s.section?.name ? ` / ${s.section.name}` : ''}</span>
                        </p>
                        <p className="flex items-center gap-1.5 capitalize">
                          {s.gender === 'male' ? <Mars className="w-3 h-3 text-blue-500" /> : <Venus className="w-3 h-3 text-pink-500" />}
                          <span>{s.gender}</span>
                        </p>
                        {s.parent?.name && (
                          <p className="flex items-center gap-1.5 truncate col-span-2">
                            <Users className="w-3 h-3 text-slate-400" />
                            <span className="truncate">{s.parent.name}{s.parent.phone ? ` · ${s.parent.phone}` : ''}</span>
                          </p>
                        )}
                        {s.admission_date && (
                          <p className="flex items-center gap-1.5">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            <span>{new Date(s.admission_date).toLocaleDateString()}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-2 pt-1">
                    <Button
                      variant="outline"
                      className="flex-1 min-h-[44px] text-xs"
                      onClick={() => { setViewStudent(s); setViewOpen(true); }}
                    >
                      <Eye className="w-3.5 h-3.5 mr-1.5" />
                      View
                    </Button>
                    {canEditStudents && (
                      <Button
                        variant="outline"
                        className="flex-1 min-h-[44px] text-xs"
                        onClick={() => openEditForm(s)}
                      >
                        <Pencil className="w-3.5 h-3.5 mr-1.5" />
                        Edit
                      </Button>
                    )}
                    {canDeleteStudents && (
                      <Button
                        variant="outline"
                        className="min-h-[44px] min-w-[44px] text-xs text-red-600 border-red-200 hover:bg-red-50"
                        onClick={() => setDeleteTarget(s)}
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
            <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-t bg-slate-50/50">
              <p className="text-xs text-slate-500">
                Page {page} of {totalPages} · {total} total
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm px-2 text-slate-600 font-medium">
                  {page} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          Add/Edit Student Dialog
          ═══════════════════════════════════════════════════════ */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <UserPlus className="w-5 h-5 text-emerald-600" />
              {editingStudent ? 'Edit Student' : 'Enroll New Student'}
            </DialogTitle>
            <DialogDescription>
              {editingStudent ? 'Update student information below.' : 'Fill in the form to enroll a new student.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Personal Information */}
            <div>
              <h3 className="text-sm font-semibold text-slate-800 mb-3 pb-2 border-b-2 border-emerald-500 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Student Information
              </h3>
              <div className="space-y-4">
                <div>
                  <Label className="text-sm">Full Name <span className="text-red-500">*</span></Label>
                  <Input
                    placeholder="Student full name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-sm">Gender</Label>
                    <Select value={formData.gender} onValueChange={(v) => setFormData({ ...formData, gender: v })}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-sm">Date of Birth</Label>
                    <Input
                      type="date"
                      value={formData.dob}
                      onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-sm">Class <span className="text-red-500">*</span></Label>
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
                  <Label className="text-sm">Phone Number</Label>
                  <Input
                    placeholder="Student phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm">Address</Label>
                  <Input
                    placeholder="Home address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            {/* Parent / Guardian Information */}
            <div>
              <h3 className="text-sm font-semibold text-slate-800 mb-3 pb-2 border-b-2 border-sky-500 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Parent / Guardian Information
              </h3>
              <div className="space-y-4">
                <div>
                  <Label className="text-sm">Parent Name</Label>
                  <Input
                    placeholder="Parent full name"
                    value={formData.parent_name}
                    onChange={(e) => setFormData({ ...formData, parent_name: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-sm">Parent Phone</Label>
                    <Input
                      placeholder="Phone"
                      value={formData.parent_phone}
                      onChange={(e) => setFormData({ ...formData, parent_phone: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-sm">Parent Email</Label>
                    <Input
                      placeholder="Email"
                      value={formData.parent_email}
                      onChange={(e) => setFormData({ ...formData, parent_email: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button
              onClick={handleSave}
              disabled={formSaving || !formData.name || !formData.class_id}
              className="bg-emerald-600 hover:bg-emerald-700 min-h-[44px]"
            >
              {formSaving ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  Saving...
                </>
              ) : editingStudent ? 'Update Student' : 'Enroll Student'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════════════════════════════════
          View Student Dialog
          ═══════════════════════════════════════════════════════ */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Eye className="w-5 h-5 text-emerald-600" />
              Student Profile
            </DialogTitle>
            <DialogDescription>
              Detailed student information
            </DialogDescription>
          </DialogHeader>
          {viewStudent && (
            <div className="space-y-4">
              {/* Avatar header */}
              <div className="text-center pb-4 border-b">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-full mx-auto flex items-center justify-center mb-3">
                  <span className="text-xl font-bold text-white">
                    {viewStudent.name?.charAt(0) || '?'}
                  </span>
                </div>
                <p className="font-bold text-lg text-slate-900">{viewStudent.name}</p>
                <p className="font-mono text-xs text-slate-500 mt-0.5">{viewStudent.student_code}</p>
                <div className="mt-2 flex items-center justify-center gap-2">
                  <StatusBadge status={viewStudent.status} />
                  <span className="text-xs text-slate-400 capitalize flex items-center gap-1">
                    {viewStudent.gender === 'male' ? <Mars className="w-3 h-3 text-blue-500" /> : <Venus className="w-3 h-3 text-pink-500" />}
                    {viewStudent.gender}
                  </span>
                </div>
              </div>

              {/* Info grid */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-start gap-2">
                  <BookOpenCheck className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-slate-400">Class</p>
                    <p className="font-medium text-slate-900">{viewStudent.class?.name || '—'}</p>
                  </div>
                </div>
                {viewStudent.section && (
                  <div className="flex items-start gap-2">
                    <BookOpenCheck className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-slate-400">Section</p>
                      <p className="font-medium text-slate-900">{viewStudent.section.name}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-2">
                  <Calendar className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-slate-400">Admission</p>
                    <p className="font-medium text-slate-900">
                      {viewStudent.admission_date ? new Date(viewStudent.admission_date).toLocaleDateString() : '—'}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Calendar className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-slate-400">DOB</p>
                    <p className="font-medium text-slate-900">
                      {viewStudent.dob ? new Date(viewStudent.dob).toLocaleDateString() : '—'}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2 col-span-2">
                  <Phone className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-slate-400">Phone</p>
                    <p className="font-medium text-slate-900">{viewStudent.phone || '—'}</p>
                  </div>
                </div>
                {viewStudent.address && (
                  <div className="flex items-start gap-2 col-span-2">
                    <MapPin className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-slate-400">Address</p>
                      <p className="font-medium text-slate-900">{viewStudent.address}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Parent section */}
              {viewStudent.parent && (
                <div className="border-t pt-3">
                  <p className="text-xs text-slate-400 mb-2 font-medium uppercase tracking-wider">Parent / Guardian</p>
                  <div className="flex items-center gap-3 bg-slate-50 rounded-xl p-3">
                    <div className="w-9 h-9 rounded-full bg-sky-100 flex items-center justify-center flex-shrink-0">
                      <Users className="w-4 h-4 text-sky-600" />
                    </div>
                    <div>
                      <p className="font-medium text-sm text-slate-900">{viewStudent.parent.name}</p>
                      <p className="text-xs text-slate-500">{viewStudent.parent.phone}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-2">
            {canEditStudents && (
              <Button
                variant="outline"
                onClick={() => {
                  if (viewStudent) {
                    setViewOpen(false);
                    openEditForm(viewStudent);
                  }
                }}
                className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
              >
                <Pencil className="w-4 h-4 mr-2" />
                Edit
              </Button>
            )}
            <Button variant="outline" onClick={() => setViewOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════════════════════════════════
          Delete Confirmation Dialog
          ═══════════════════════════════════════════════════════ */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-4 h-4 text-red-600" />
              </div>
              Remove Student
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove <strong>{deleteTarget?.name}</strong> ({deleteTarget?.student_code})?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {deleting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  Removing...
                </>
              ) : 'Remove Student'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
