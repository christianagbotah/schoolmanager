'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
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
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/use-auth';
import { PERMISSIONS } from '@/lib/permission-constants';
import {
  Search, Download, Users, GraduationCap, ChevronLeft, ChevronRight,
  Eye, Pencil, Trash2, UserPlus, Phone, Mail, Calendar, MapPin, X,
  UserCheck, Venus, Mars, Filter, BookOpenCheck, Printer, UserX, UserRoundCheck,
  Ban, ImageOff, Image, MoreHorizontal, ArrowUpDown,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Student {
  enroll_id: number;
  student_id: number;
  student_code: string;
  name: string;
  first_name: string;
  last_name: string;
  sex: string;
  phone: string;
  email: string;
  address: string;
  birthday: string | null;
  active_status: number;
  admission_date: string | null;
  roll: string;
  residence_type: string;
  class_id: number;
  class_name: string;
  class_name_numeric: number;
  class_category: string;
  section_id: number;
  section_name: string;
  parent: { parent_id: number; name: string; phone: string } | null;
}

interface ClassOption {
  class_id: number;
  name: string;
  name_numeric: number;
}

interface StudentStats {
  males: number;
  females: number;
  unknownGender: number;
  totalActive: number;
  totalInactive: number;
  total: number;
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
        </div>
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

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return '—';
  }
}

function GenderIcon({ sex }: { sex: string }) {
  const s = sex?.toLowerCase();
  if (s === 'male') return <Mars className="w-3.5 h-3.5 text-blue-500" />;
  if (s === 'female') return <Venus className="w-3.5 h-3.5 text-pink-500" />;
  return <Users className="w-3.5 h-3.5 text-slate-400" />;
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function StudentsPage() {
  const { isLoading: authLoading, hasPermission, isSuperAdmin } = useAuth();
  const printRef = useRef<HTMLDivElement>(null);

  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [genderFilter, setGenderFilter] = useState('');
  const [residenceFilter, setResidenceFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showPhotos, setShowPhotos] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState<StudentStats | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const [classes, setClasses] = useState<ClassOption[]>([]);

  // Permission checks
  const canViewStudents = isSuperAdmin || hasPermission(PERMISSIONS.CAN_VIEW_STUDENTS_LIST);
  const canEditStudents = isSuperAdmin || hasPermission(PERMISSIONS.CAN_EDIT_STUDENTS);
  const canDeleteStudents = isSuperAdmin || hasPermission(PERMISSIONS.CAN_DELETE_STUDENTS);
  const canAdmitStudents = isSuperAdmin || hasPermission(PERMISSIONS.CAN_ADMIT_STUDENTS);
  const canExportData = isSuperAdmin || hasPermission(PERMISSIONS.CAN_EXPORT_DATA);
  const canPrintReports = isSuperAdmin || hasPermission(PERMISSIONS.CAN_PRINT_REPORTS);

  // View Dialog
  const [viewOpen, setViewOpen] = useState(false);
  const [viewStudent, setViewStudent] = useState<Student | null>(null);

  // Delete Dialog
  const [deleteTarget, setDeleteTarget] = useState<Student | null>(null);
  const [deleting, setDeleting] = useState(false);

  // ─── Active filters ────────────────────────────────────────────────────────

  const activeFilters = [
    classFilter ? { key: 'class', label: `Class: ${classes.find(c => String(c.class_id) === classFilter)?.name || classFilter}` } : null,
    genderFilter ? { key: 'gender', label: `Gender: ${genderFilter}` } : null,
    residenceFilter ? { key: 'residence', label: `Residence: ${residenceFilter}` } : null,
    statusFilter ? { key: 'status', label: `Status: ${statusFilter === '1' ? 'Active' : 'Inactive'}` } : null,
  ].filter(Boolean) as { key: string; label: string }[];

  const clearFilter = (key: string) => {
    switch (key) {
      case 'class': setClassFilter(''); break;
      case 'gender': setGenderFilter(''); break;
      case 'residence': setResidenceFilter(''); break;
      case 'status': setStatusFilter(''); break;
    }
  };

  const clearAllFilters = () => {
    setClassFilter('');
    setGenderFilter('');
    setResidenceFilter('');
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
      if (genderFilter) params.set('gender', genderFilter);
      if (residenceFilter) params.set('residence', residenceFilter);
      if (statusFilter) params.set('activeStatus', statusFilter);
      params.set('page', String(page));
      params.set('limit', '50');

      const res = await fetch(`/api/admin/students?${params}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setStudents(data.students || []);
      setStats(data.stats || null);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotal(data.pagination?.total || 0);
    } catch {
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  }, [search, classFilter, genderFilter, residenceFilter, statusFilter, page]);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  useEffect(() => { setPage(1); }, [classFilter, genderFilter, residenceFilter, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(() => { setPage(1); }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    fetch('/api/admin/students?limit=1')
      .then(r => r.json())
      .then(d => {
        if (d.stats) setStats(d.stats);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch('/api/classes?limit=100')
      .then(r => r.json())
      .then(d => {
        const list: ClassOption[] = (d.classes || []).map((c: { class_id: number; name: string; name_numeric: number }) => ({
          class_id: c.class_id,
          name: c.name,
          name_numeric: c.name_numeric || 0,
        }));
        list.sort((a, b) => (a.name_numeric || 0) - (b.name_numeric || 0));
        setClasses(list);
      })
      .catch(() => {});
  }, []);

  // ─── Selection ─────────────────────────────────────────────────────────────

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === students.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(students.map(s => s.student_id)));
    }
  };

  // ─── Delete handler ────────────────────────────────────────────────────────

  const handleDelete = async () => {
    if (!deleteTarget) return;
    if (!canDeleteStudents) {
      toast.error('You do not have permission to delete students');
      setDeleteTarget(null);
      return;
    }
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/students`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentIds: [deleteTarget.student_id] }),
      });
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

  // ─── Block/Unblock handler ─────────────────────────────────────────────────

  const handleToggleBlock = async (student: Student) => {
    const action = student.active_status === 1 ? 'block' : 'unblock';
    try {
      const res = await fetch('/api/admin/students', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, student_id: student.student_id }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast.success(data.message);
      fetchStudents();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Operation failed';
      toast.error(message);
    }
  };

  // ─── Export CSV ────────────────────────────────────────────────────────────

  const handleExportCSV = () => {
    const headers = ['Code', 'Name', 'Gender', 'Class', 'Section', 'Address', 'Residence', 'DOB', 'Parent', 'Phone', 'Status'];
    const rows = students.map(s => [
      s.student_code, s.name, s.sex, s.class_name, s.section_name,
      s.address || '', s.residence_type || '',
      s.birthday ? new Date(s.birthday).toLocaleDateString() : '',
      s.parent?.name || '', s.parent?.phone || '',
      s.active_status === 1 ? 'Active' : 'Inactive',
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

  // ─── Print handler ─────────────────────────────────────────────────────────

  const handlePrint = () => {
    if (!printRef.current) return;
    const printWindow = window.open('', 'Print Students List', 'height=800,width=1200');
    if (!printWindow) return;
    printWindow.document.write('<!DOCTYPE html><html><head><title>All Active Students</title>');
    printWindow.document.write('<style>');
    printWindow.document.write('body { font-family: Arial, sans-serif; margin: 10px; font-size: 8px; }');
    printWindow.document.write('table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 7px; table-layout: fixed; }');
    printWindow.document.write('th, td { border: 1px solid #ccc; padding: 2px; text-align: left; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }');
    printWindow.document.write('th { background-color: #666; color: white; font-weight: bold; font-size: 8px; }');
    printWindow.document.write('td { font-size: 7px; }');
    printWindow.document.write('h4 { margin: 3px 0; color: #000; font-size: 10px; }');
    printWindow.document.write('.text-muted { color: #666; font-size: 8px; }');
    printWindow.document.write('.ml-5 { margin-left: 5px; }');
    printWindow.document.write('@media print { body { margin: 5px; } @page { size: landscape; margin: 10mm; } }');
    printWindow.document.write('</style></head><body>');
    printWindow.document.write('<h2 style="text-align: center; margin-bottom: 15px; font-size: 12px;">All Active Students</h2>');
    printWindow.document.write(printRef.current.innerHTML);
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    setTimeout(() => { printWindow.focus(); printWindow.print(); printWindow.close(); }, 500);
  };

  // ─── Loading State ─────────────────────────────────────────────────────────

  if (authLoading || loading) {
    return (
      <DashboardLayout>
        <div className="space-y-5 sm:space-y-6">
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
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
            <StatCardSkeleton /> <StatCardSkeleton /> <StatCardSkeleton />
            <StatCardSkeleton /> <StatCardSkeleton />
          </div>
          <FilterBarSkeleton />
          <TableSkeleton />
        </div>
      </DashboardLayout>
    );
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <DashboardLayout>
      <div className="space-y-5 sm:space-y-6">
        {/* ═══════════ Page Header ═══════════ */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              All Active Students
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {stats ? (
                <>
                  Male: <span className="font-semibold text-blue-600">{stats.males.toLocaleString()}</span>{' | '}
                  Female: <span className="font-semibold text-pink-600">{stats.females.toLocaleString()}</span>{' | '}
                  Unknown: <span className="font-semibold text-slate-600">{stats.unknownGender.toLocaleString()}</span>
                </>
              ) : 'Loading statistics...'}
            </p>
          </div>
          <div className="flex gap-2">
            {canExportData && (
              <Button variant="outline" onClick={handleExportCSV} className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 min-h-[44px]">
                <Download className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Export</span>
              </Button>
            )}
            {canPrintReports && (
              <Button variant="outline" onClick={handlePrint} className="border-slate-200 text-slate-700 hover:bg-slate-50 min-h-[44px]">
                <Printer className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Print</span>
              </Button>
            )}
            {canAdmitStudents && (
              <Button onClick={() => toast.info('Navigate to Student Admission to add new students')} className="bg-emerald-600 hover:bg-emerald-700 min-h-[44px]">
                <UserPlus className="w-4 h-4 mr-2" />
                Enroll Student
              </Button>
            )}
          </div>
        </div>

        {/* ═══════════ Quick Stats ═══════════ */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          <StatCard
            icon={GraduationCap}
            label="Total Students"
            value={stats?.total || 0}
            subValue="Currently enrolled"
            iconBg="bg-emerald-500"
            borderColor="#10b981"
          />
          <StatCard
            icon={UserCheck}
            label="Active"
            value={stats?.totalActive || 0}
            iconBg="bg-sky-500"
            borderColor="#0ea5e9"
          />
          <StatCard
            icon={UserX}
            label="Inactive"
            value={stats?.totalInactive || 0}
            iconBg="bg-slate-400"
            borderColor="#94a3b8"
          />
          <StatCard
            icon={Mars}
            label="Male"
            value={stats?.males || 0}
            iconBg="bg-blue-500"
            borderColor="#3b82f6"
          />
          <StatCard
            icon={Venus}
            label="Female"
            value={stats?.females || 0}
            iconBg="bg-pink-500"
            borderColor="#ec4899"
          />
        </div>

        {/* ═══════════ Filter Bar ═══════════ */}
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
              <Select value={classFilter} onValueChange={(v) => (v === '__all__' ? setClassFilter('') : setClassFilter(v))}>
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

              <Select value={genderFilter} onValueChange={(v) => (v === '__all__' ? setGenderFilter('') : setGenderFilter(v))}>
                <SelectTrigger className="w-36 min-h-[44px]">
                  <SelectValue placeholder="All Genders" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All Genders</SelectItem>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                </SelectContent>
              </Select>

              <Select value={residenceFilter} onValueChange={(v) => (v === '__all__' ? setResidenceFilter('') : setResidenceFilter(v))}>
                <SelectTrigger className="w-40 min-h-[44px]">
                  <SelectValue placeholder="All Residence" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All Residence</SelectItem>
                  <SelectItem value="Day">Day</SelectItem>
                  <SelectItem value="Boarding">Boarding</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={(v) => (v === '__all__' ? setStatusFilter('') : setStatusFilter(v))}>
                <SelectTrigger className="w-40 min-h-[44px]">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All Status</SelectItem>
                  <SelectItem value="1">Active</SelectItem>
                  <SelectItem value="0">Inactive</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant={showPhotos ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowPhotos(!showPhotos)}
                className="min-h-[44px]"
              >
                {showPhotos ? <Image className="w-4 h-4 mr-1.5" /> : <ImageOff className="w-4 h-4 mr-1.5" />}
                {showPhotos ? 'Hide Photos' : 'Show Photos'}
              </Button>
            </div>
          </div>

          {/* Active filter chips */}
          {activeFilters.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              {activeFilters.map(f => (
                <Badge key={f.key} variant="outline" className="bg-slate-50 border-slate-200 text-slate-700 text-xs pr-1 gap-1">
                  {f.label}
                  <button
                    onClick={() => clearFilter(f.key)}
                    className="ml-0.5 w-4 h-4 rounded-full hover:bg-slate-200 inline-flex items-center justify-center transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
              <button onClick={clearAllFilters} className="text-xs text-slate-500 hover:text-slate-700 underline-offset-2 hover:underline transition-colors">
                Clear all
              </button>
            </div>
          )}

          {/* Mobile Filters */}
          <div className="flex flex-wrap gap-2 mt-3 lg:hidden">
            <Select value={classFilter} onValueChange={(v) => (v === '__all__' ? setClassFilter('') : setClassFilter(v))}>
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
            <Select value={genderFilter} onValueChange={(v) => (v === '__all__' ? setGenderFilter('') : setGenderFilter(v))}>
              <SelectTrigger className="h-9 w-auto text-xs rounded-full border-slate-200">
                <Users className="w-3.5 h-3.5 mr-1 text-slate-400" />
                <SelectValue placeholder="Gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All</SelectItem>
                <SelectItem value="Male">Male</SelectItem>
                <SelectItem value="Female">Female</SelectItem>
              </SelectContent>
            </Select>
            <Select value={residenceFilter} onValueChange={(v) => (v === '__all__' ? setResidenceFilter('') : setResidenceFilter(v))}>
              <SelectTrigger className="h-9 w-auto text-xs rounded-full border-slate-200">
                <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400" />
                <SelectValue placeholder="Residence" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All</SelectItem>
                <SelectItem value="Day">Day</SelectItem>
                <SelectItem value="Boarding">Boarding</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(v) => (v === '__all__' ? setStatusFilter('') : setStatusFilter(v))}>
              <SelectTrigger className="h-9 w-auto text-xs rounded-full border-slate-200">
                <UserCheck className="w-3.5 h-3.5 mr-1 text-slate-400" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All</SelectItem>
                <SelectItem value="1">Active</SelectItem>
                <SelectItem value="0">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* ═══════════ Bulk Actions Bar ═══════════ */}
        {selectedIds.size > 0 && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-3 flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-emerald-800">
              {selectedIds.size} student{selectedIds.size > 1 ? 's' : ''} selected
            </p>
            <div className="flex gap-2">
              {canExportData && (
                <Button variant="outline" size="sm" onClick={() => { handleExportCSV(); setSelectedIds(new Set()); }} className="min-h-[36px]">
                  <Download className="w-3.5 h-3.5 mr-1.5" /> Export Selected
                </Button>
              )}
              {canDeleteStudents && (
                <Button variant="outline" size="sm" onClick={async () => {
                  try {
                    const res = await fetch('/api/admin/students', {
                      method: 'DELETE',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ studentIds: Array.from(selectedIds) }),
                    });
                    const data = await res.json();
                    if (data.error) throw new Error(data.error);
                    toast.success(data.message);
                    setSelectedIds(new Set());
                    fetchStudents();
                  } catch (err: unknown) {
                    const msg = err instanceof Error ? err.message : 'Failed to delete';
                    toast.error(msg);
                  }
                }} className="min-h-[36px] text-red-600 border-red-200 hover:bg-red-50">
                  <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Delete Selected
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={() => setSelectedIds(new Set())} className="min-h-[36px]">
                <X className="w-3.5 h-3.5" /> Clear
              </Button>
            </div>
          </div>
        )}

        {/* ═══════════ Data Table ═══════════ */}
        <div className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden">
          {/* Results header */}
          {!loading && students.length > 0 && (
            <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-slate-100 bg-slate-50/50">
              <p className="text-xs font-medium text-slate-500">
                Showing {(page - 1) * 50 + 1}–{Math.min(page * 50, total)} of {total} students
              </p>
            </div>
          )}

          {/* Printable content */}
          <div ref={printRef}>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 hover:bg-slate-50">
                    <TableHead className="text-xs font-semibold text-slate-600 w-10">
                      <Checkbox
                        checked={students.length > 0 && selectedIds.size === students.length}
                        onCheckedChange={toggleSelectAll}
                      />
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-slate-600 w-10">S/N</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-600">ID No</TableHead>
                    <TableHead className={`text-xs font-semibold text-slate-600 ${!showPhotos ? 'hidden' : ''} w-16`}>Photo</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-600">Name</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-600 w-20">Gender</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-600 hidden xl:table-cell">Address</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-600 w-24">Residence</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-600 w-28">DOB</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-600 hidden lg:table-cell">Parent</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-600 w-28">Contact</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-600 text-right w-36">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={12} className="text-center py-20 text-slate-400">
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center">
                            <GraduationCap className="w-8 h-8 text-slate-400" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-500 text-base">No students found</p>
                            <p className="text-xs text-slate-400 mt-1">
                              {search || classFilter || genderFilter || residenceFilter || statusFilter
                                ? 'Try adjusting your search or filters'
                                : 'Enroll your first student to get started'}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    students.map((s, idx) => (
                      <TableRow
                        key={s.enroll_id}
                        className={`hover:bg-slate-50/50 transition-colors ${s.active_status === 0 ? 'opacity-60' : ''}`}
                      >
                        <TableCell>
                          <Checkbox
                            checked={selectedIds.has(s.student_id)}
                            onCheckedChange={() => toggleSelect(s.student_id)}
                          />
                        </TableCell>
                        <TableCell className="text-xs text-slate-500 font-mono">{(page - 1) * 50 + idx + 1}</TableCell>
                        <TableCell>
                          <code className="text-xs font-mono bg-slate-100 px-2 py-0.5 rounded">{s.student_code}</code>
                        </TableCell>
                        <TableCell className={!showPhotos ? 'hidden' : ''}>
                          <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white bg-gradient-to-br from-emerald-500 to-emerald-700 flex-shrink-0">
                            {s.name?.charAt(0) || '?'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="font-medium text-sm text-slate-900">{s.name}</p>
                          {s.active_status === 0 && (
                            <Badge variant="outline" className="border-red-200 bg-red-50 text-red-600 text-[10px] mt-0.5">Inactive</Badge>
                          )}
                        </TableCell>
                        <TableCell className="capitalize">
                          <div className="flex items-center gap-1.5">
                            <GenderIcon sex={s.sex} />
                            <span className="text-sm text-slate-700">{s.sex || '—'}</span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden xl:table-cell">
                          <p className="text-sm text-slate-600 max-w-[200px] truncate">{s.address || '—'}</p>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`text-xs ${s.residence_type === 'Boarding' ? 'border-amber-200 bg-amber-50 text-amber-700' : 'border-slate-200 bg-slate-50 text-slate-600'}`}>
                            {s.residence_type || '—'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-slate-600">{formatDate(s.birthday)}</TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <div>
                            <p className="text-sm text-slate-700">{s.parent?.name || '—'}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm text-slate-600">{s.parent?.phone || s.phone || '—'}</p>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost" size="icon" className="h-8 w-8 min-w-[32px]"
                              onClick={() => { setViewStudent(s); setViewOpen(true); }}
                              title="View Profile"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            {canEditStudents && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 min-w-[32px]" title="More actions">
                                    <MoreHorizontal className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleToggleBlock(s)}>
                                    {s.active_status === 1 ? (
                                      <><Ban className="w-4 h-4 mr-2" /> Block Student</>
                                    ) : (
                                      <><UserRoundCheck className="w-4 h-4 mr-2" /> Unblock Student</>
                                    )}
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-red-600 focus:text-red-600"
                                    onClick={() => setDeleteTarget(s)}
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" /> Remove Student
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                            {!canEditStudents && canDeleteStudents && (
                              <Button
                                variant="ghost" size="icon"
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
                    <p className="font-semibold text-slate-500 text-base">No students found</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {search || classFilter || genderFilter || residenceFilter || statusFilter
                        ? 'Try adjusting your filters'
                        : 'Enroll your first student'}
                    </p>
                  </div>
                </div>
              ) : (
                students.map((s, idx) => (
                  <div key={s.enroll_id} className="p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      {showPhotos && (
                        <div className="w-11 h-11 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-bold text-white bg-gradient-to-br from-emerald-500 to-emerald-700">
                          {s.name?.charAt(0) || '?'}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-semibold text-sm text-slate-900 truncate">{s.name}</p>
                            <p className="text-xs text-slate-500 font-mono">{s.student_code}</p>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <GenderIcon sex={s.sex} />
                            {s.active_status === 0 && (
                              <Badge variant="outline" className="border-red-200 bg-red-50 text-red-600 text-[10px]">Off</Badge>
                            )}
                          </div>
                        </div>
                        <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-slate-500">
                          <p className="flex items-center gap-1.5">
                            <BookOpenCheck className="w-3 h-3 text-slate-400" />
                            <span>{s.class_name}{s.section_name ? ` / ${s.section_name}` : ''}</span>
                          </p>
                          <p className="flex items-center gap-1.5">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            <span>{s.residence_type || '—'}</span>
                          </p>
                          {s.parent?.name && (
                            <p className="flex items-center gap-1.5 truncate col-span-2">
                              <Users className="w-3 h-3 text-slate-400" />
                              <span className="truncate">{s.parent.name}{s.parent.phone ? ` · ${s.parent.phone}` : ''}</span>
                            </p>
                          )}
                          <p className="flex items-center gap-1.5">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            <span>{formatDate(s.birthday)}</span>
                          </p>
                          {(s.parent?.phone || s.phone) && (
                            <p className="flex items-center gap-1.5">
                              <Phone className="w-3 h-3 text-slate-400" />
                              <span>{s.parent?.phone || s.phone}</span>
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 pt-1">
                      <Button variant="outline" className="flex-1 min-h-[44px] text-xs" onClick={() => { setViewStudent(s); setViewOpen(true); }}>
                        <Eye className="w-3.5 h-3.5 mr-1.5" /> View
                      </Button>
                      {canEditStudents && (
                        <Button variant="outline" className="min-h-[44px] min-w-[44px] text-xs" onClick={() => handleToggleBlock(s)}>
                          {s.active_status === 1 ? <Ban className="w-3.5 h-3.5" /> : <UserRoundCheck className="w-3.5 h-3.5" />}
                        </Button>
                      )}
                      {canDeleteStudents && (
                        <Button variant="outline" className="min-h-[44px] min-w-[44px] text-xs text-red-600 border-red-200 hover:bg-red-50" onClick={() => setDeleteTarget(s)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-t bg-slate-50/50">
              <p className="text-xs text-slate-500">Page {page} of {totalPages} · {total} total</p>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="icon" className="h-8 w-8" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm px-2 text-slate-600 font-medium">{page} / {totalPages}</span>
                <Button variant="outline" size="icon" className="h-8 w-8" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Total row (CI3 parity) */}
          {!loading && students.length > 0 && (
            <div className="px-4 sm:px-6 py-3 border-t-2 border-slate-300 bg-slate-50">
              <p className="text-sm font-bold text-slate-800">
                Total: <span className="text-emerald-600">{total} students currently enrolled.</span>
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ═══════════ View Student Dialog ═══════════ */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Eye className="w-5 h-5 text-emerald-600" />
              Student Profile
            </DialogTitle>
            <DialogDescription>Detailed student information</DialogDescription>
          </DialogHeader>
          {viewStudent && (
            <div className="space-y-4">
              {/* Avatar header */}
              <div className="text-center pb-4 border-b">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-full mx-auto flex items-center justify-center mb-3">
                  <span className="text-xl font-bold text-white">{viewStudent.name?.charAt(0) || '?'}</span>
                </div>
                <p className="font-bold text-lg text-slate-900">{viewStudent.name}</p>
                <p className="font-mono text-xs text-slate-500 mt-0.5">{viewStudent.student_code}</p>
                <div className="mt-2 flex items-center justify-center gap-2">
                  <Badge variant="outline" className={viewStudent.active_status === 1 ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-red-200 bg-red-50 text-red-600'}>
                    {viewStudent.active_status === 1 ? 'Active' : 'Inactive'}
                  </Badge>
                  <span className="text-xs text-slate-400 capitalize flex items-center gap-1">
                    <GenderIcon sex={viewStudent.sex} />
                    {viewStudent.sex || '—'}
                  </span>
                </div>
              </div>
              {/* Info grid */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-start gap-2">
                  <BookOpenCheck className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-slate-400">Class</p>
                    <p className="font-medium text-slate-900">{viewStudent.class_name}{viewStudent.section_name ? ` / ${viewStudent.section_name}` : ''}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-slate-400">Residence</p>
                    <p className="font-medium text-slate-900">{viewStudent.residence_type || '—'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Calendar className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-slate-400">DOB</p>
                    <p className="font-medium text-slate-900">{formatDate(viewStudent.birthday)}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Calendar className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-slate-400">Admission</p>
                    <p className="font-medium text-slate-900">{formatDate(viewStudent.admission_date)}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Phone className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-slate-400">Phone</p>
                    <p className="font-medium text-slate-900">{viewStudent.phone || '—'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Mail className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-slate-400">Email</p>
                    <p className="font-medium text-slate-900 truncate">{viewStudent.email || '—'}</p>
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
              {/* Parent */}
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
            <Button variant="outline" onClick={() => setViewOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══════════ Delete Confirmation Dialog ═══════════ */}
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
