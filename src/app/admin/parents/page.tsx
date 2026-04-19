'use client';

import { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
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
  Users,
  Search,
  Plus,
  Pencil,
  Trash2,
  Phone,
  Lock,
  Unlock,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Eye,
  Copy,
  Baby,
  Mail,
  ShieldCheck,
  ShieldX,
  Briefcase,
  Filter,
  X,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

// ─── Types ───────────────────────────────────────────────
interface ParentRow {
  parent_id: number;
  name: string;
  guardian_gender: string;
  guardian_is_the: string;
  email: string;
  phone: string;
  address: string;
  profession: string;
  designation: string;
  active_status: number;
  authentication_key: string;
  block_limit: number;
  children_count: number;
}

interface ParentDetail extends ParentRow {
  students?: { student_id: number; name: string; student_code: string }[];
  enrolls?: {
    enroll_id: number;
    student: { student_id: number; name: string; student_code: string };
    class: { class_id: number; name: string };
    section: { section_id: number; name: string };
    year: string;
    term: string;
  }[];
}

interface ApiResponse {
  data: ParentRow[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
  totalMale: number;
  totalFemale: number;
  grandTotalGender: number;
}

interface ClassOption {
  class_id: number;
  name: string;
}

// ─── Skeleton Components ─────────────────────────────────

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
      <div className="flex flex-col sm:flex-row gap-3">
        <Skeleton className="h-11 flex-1 rounded-lg" />
        <Skeleton className="h-11 w-48 rounded-lg" />
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

// ─── Stat Card Component ─────────────────────────────────

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

// ─── Component ───────────────────────────────────────────
export default function ParentsPage() {
  // Data state
  const [parents, setParents] = useState<ParentRow[]>([]);
  const [grandTotal, setGrandTotal] = useState(0);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [classes, setClasses] = useState<ClassOption[]>([]);

  // UI state
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('__all__');
  const [page, setPage] = useState(1);
  const pageSize = 15;

  // Dialogs
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ParentDetail | null>(null);
  const [formSaving, setFormSaving] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ParentRow | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [blockOpen, setBlockOpen] = useState(false);
  const [blockTarget, setBlockTarget] = useState<ParentRow | null>(null);
  const [blockAction, setBlockAction] = useState<'block' | 'unblock'>('block');
  const [blockLoading, setBlockLoading] = useState(false);

  const [viewOpen, setViewOpen] = useState(false);
  const [viewParent, setViewParent] = useState<ParentDetail | null>(null);
  const [viewLoading, setViewLoading] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    name: '',
    guardian_gender: 'Male',
    guardian_is_the: '',
    email: '',
    phone: '',
    password: '',
    address: '',
    profession: '',
    isExecutive: false,
    designation: '',
  });

  // ─── Computed stats ────────────────────────────────
  const totalChildren = parents.reduce((sum, p) => sum + (p.children_count || 0), 0);
  const totalContactable = parents.filter(
    (p) => p.phone || p.email
  ).length;
  const totalBlocked = parents.filter((p) => p.block_limit >= 3).length;

  // ─── Active filter chips ──────────────────────────
  const activeFilters = [
    classFilter !== '__all__' ? { key: 'class', label: `Class: ${classes.find(c => String(c.class_id) === classFilter)?.name || classFilter}` } : null,
  ].filter(Boolean) as { key: string; label: string }[];

  const clearFilter = (key: string) => {
    if (key === 'class') setClassFilter('__all__');
  };

  const clearAllFilters = () => {
    setClassFilter('__all__');
    setSearch('');
  };

  // ─── Fetch classes ─────────────────────────────────
  useEffect(() => {
    fetch('/api/classes?limit=100')
      .then((r) => r.json())
      .then((d) => setClasses(d.classes || []))
      .catch(() => {});
  }, []);

  // ─── Fetch parents ──────────────────────────────────
  const fetchParents = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (classFilter !== '__all__') params.set('classId', classFilter);
      params.set('page', page.toString());
      params.set('pageSize', pageSize.toString());

      const res = await fetch(`/api/admin/parents?${params}`);
      const json: ApiResponse = await res.json();
      if (json.error) throw new Error(json.error);

      setParents(json.data || []);
      setGrandTotal(json.grandTotalGender || 0);
      setTotalRecords(json.pagination?.total || 0);
      setTotalPages(json.pagination?.totalPages || 1);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load parents';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [search, classFilter, page]);

  useEffect(() => {
    fetchParents();
  }, [fetchParents]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  // Reset page on filter changes
  useEffect(() => {
    setPage(1);
  }, [classFilter]);

  // ─── Form handlers ──────────────────────────────────
  const resetForm = () => {
    setFormData({
      name: '',
      guardian_gender: 'Male',
      guardian_is_the: '',
      email: '',
      phone: '',
      password: '',
      address: '',
      profession: '',
      isExecutive: false,
      designation: '',
    });
  };

  const openAddForm = () => {
    resetForm();
    setEditing(null);
    setFormOpen(true);
  };

  const openEditForm = async (p: ParentRow | ParentDetail) => {
    setFormSaving(true);
    setFormOpen(true);
    setEditing(null);
    try {
      const res = await fetch(`/api/admin/parents/${p.parent_id}`);
      const detail: ParentDetail = await res.json();
      if (detail.error) throw new Error(detail.error);
      setEditing(detail);
      setFormData({
        name: detail.name,
        guardian_gender: detail.guardian_gender || 'Male',
        guardian_is_the: detail.guardian_is_the || '',
        email: detail.email || '',
        phone: detail.phone || '',
        password: '',
        address: detail.address || '',
        profession: detail.profession || '',
        isExecutive: !!detail.designation,
        designation: detail.designation || '',
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load parent';
      toast.error(message);
      setFormOpen(false);
    } finally {
      setFormSaving(false);
    }
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('Parent name is required');
      return;
    }

    setFormSaving(true);
    try {
      const payload = {
        name: formData.name,
        guardian_gender: formData.guardian_gender,
        guardian_is_the: formData.guardian_is_the,
        email: formData.email || '',
        phone: formData.phone || '',
        address: formData.address || '',
        profession: formData.profession || '',
        designation: formData.isExecutive ? formData.designation : '',
      };

      let url: string;
      let method: string;

      if (editing) {
        url = `/api/admin/parents/${editing.parent_id}`;
        method = 'PUT';
      } else {
        url = '/api/admin/parents';
        method = 'POST';
        (payload as Record<string, unknown>).password = formData.password || '123456';
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      toast.success(
        editing
          ? "Parent's data updated successfully"
          : "Parent's data added successfully"
      );

      if (!editing && data.authentication_key) {
        toast.info(`Authentication Key: ${data.authentication_key}`, {
          duration: 6000,
        });
      }

      setFormOpen(false);
      fetchParents();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save parent';
      toast.error(message);
    } finally {
      setFormSaving(false);
    }
  };

  // ─── Delete handler ─────────────────────────────────
  const confirmDelete = (p: ParentRow) => {
    setDeleteTarget(p);
    setDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/admin/parents/${deleteTarget.parent_id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast.success('Selected Parent Deleted Successfully!');
      setDeleteOpen(false);
      setDeleteTarget(null);
      fetchParents();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to delete';
      toast.error(message);
    } finally {
      setDeleteLoading(false);
    }
  };

  // ─── Block/Unblock handler ──────────────────────────
  const confirmBlock = (p: ParentRow, action: 'block' | 'unblock') => {
    setBlockTarget(p);
    setBlockAction(action);
    setBlockOpen(true);
  };

  const handleBlock = async () => {
    if (!blockTarget) return;
    setBlockLoading(true);
    try {
      const url =
        blockAction === 'block'
          ? `/api/admin/parents/${blockTarget.parent_id}/block`
          : `/api/admin/parents/${blockTarget.parent_id}/unblock`;
      const res = await fetch(url, { method: 'POST' });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast.success(
        blockAction === 'block'
          ? 'User account blocked successfully'
          : 'User account unblocked successfully'
      );
      setBlockOpen(false);
      setBlockTarget(null);
      fetchParents();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update account';
      toast.error(message);
    } finally {
      setBlockLoading(false);
    }
  };

  // ─── View profile handler ───────────────────────────
  const openView = async (p: ParentRow) => {
    setViewOpen(true);
    setViewLoading(true);
    setViewParent(null);
    try {
      const res = await fetch(`/api/admin/parents/${p.parent_id}`);
      const detail: ParentDetail = await res.json();
      if (detail.error) throw new Error(detail.error);
      setViewParent(detail);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load parent';
      toast.error(message);
      setViewOpen(false);
    } finally {
      setViewLoading(false);
    }
  };

  // ─── Copy auth key ──────────────────────────────────
  const copyAuthKey = (key: string) => {
    navigator.clipboard.writeText(key).then(() => {
      toast.success('Auth key copied to clipboard');
    });
  };

  // ─── Page numbers ───────────────────────────────────
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push('...');
      const start = Math.max(2, page - 1);
      const end = Math.min(totalPages - 1, page + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (page < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  // ─── Full-page loading state ────────────────────────
  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-5 sm:space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100">
            <div className="space-y-1.5">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-72" />
            </div>
            <Skeleton className="h-11 w-32 rounded-lg" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </div>
          <FilterBarSkeleton />
          <TableSkeleton />
        </div>
      </DashboardLayout>
    );
  }

  // ─── Render ─────────────────────────────────────────
  return (
    <DashboardLayout>
      <div className="space-y-5 sm:space-y-6">
        {/* ═══ Page Header ═══ */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Parents
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Manage parent/guardian accounts and contact information
            </p>
          </div>
          <Button
            onClick={openAddForm}
            className="bg-emerald-600 hover:bg-emerald-700 min-h-[44px]"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Parent
          </Button>
        </div>

        {/* ═══ Stat Cards ═══ */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <StatCard
            icon={Users}
            label="Total Parents"
            value={grandTotal}
            subValue={totalRecords > 0 ? `${totalRecords} records` : undefined}
            iconBg="bg-emerald-500"
            borderColor="#10b981"
          />
          <StatCard
            icon={Baby}
            label="Children Enrolled"
            value={totalChildren}
            subValue={`across all parents`}
            iconBg="bg-sky-500"
            borderColor="#0ea5e9"
          />
          <StatCard
            icon={Phone}
            label="Contactable"
            value={totalContactable}
            subValue={grandTotal > 0 ? `${Math.round((totalContactable / parents.length) * 100)}% reach rate` : undefined}
            iconBg="bg-amber-500"
            borderColor="#f59e0b"
          />
          <StatCard
            icon={ShieldX}
            label="Blocked"
            value={totalBlocked}
            subValue={totalBlocked > 0 ? 'need attention' : 'all clear'}
            iconBg="bg-rose-500"
            borderColor="#f43f5e"
          />
        </div>

        {/* ═══ Filter Bar ═══ */}
        <div className="bg-white rounded-2xl border border-slate-200/60 p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search by name, email, phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 min-h-[44px]"
              />
            </div>

            {/* Class Filter */}
            <Select
              value={classFilter}
              onValueChange={(v) => setClassFilter(v)}
            >
              <SelectTrigger className="w-full sm:w-48 min-h-[44px]">
                <SelectValue placeholder="All Classes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All Classes</SelectItem>
                {classes.map((c) => (
                  <SelectItem key={c.class_id} value={String(c.class_id)}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Active filter chips */}
          {activeFilters.length > 0 && (
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
        </div>

        {/* ═══ Data Table / Mobile Card View ═══ */}
        <div className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden">
          {/* Results header */}
          {!loading && parents.length > 0 && (
            <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-slate-100 bg-slate-50/50">
              <p className="text-xs font-medium text-slate-500">
                Showing {(page - 1) * pageSize + 1}{'\u2013'}{Math.min(page * pageSize, totalRecords)} of {totalRecords} parents
              </p>
            </div>
          )}

          {/* Desktop Table View */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 hover:bg-slate-50">
                  <TableHead className="text-xs font-semibold text-slate-600">Parent</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-600">Contact</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-600">Children</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-600">Occupation</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-600">Status</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-600">Auth Key</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-600 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {parents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-20">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center">
                          <Users className="w-8 h-8 text-slate-400" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-500 text-base">No parents found</p>
                          <p className="text-xs text-slate-400 mt-1">
                            {search || classFilter !== '__all__'
                              ? 'Try adjusting your search or filters'
                              : 'Get started by adding the first parent'}
                          </p>
                        </div>
                        {!search && classFilter === '__all__' && (
                          <Button
                            variant="outline"
                            className="mt-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50 min-h-[44px]"
                            onClick={openAddForm}
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Add Parent
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  parents.map((p) => (
                    <TableRow key={p.parent_id} className="hover:bg-slate-50/50 transition-colors">
                      {/* Parent Name */}
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {(p.name || '?').charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-sm text-slate-900 truncate">{p.name}</p>
                            <p className="text-xs text-slate-500">
                              {p.guardian_is_the
                                ? p.guardian_is_the.charAt(0).toUpperCase() + p.guardian_is_the.slice(1)
                                : p.guardian_gender || ''}
                            </p>
                          </div>
                        </div>
                      </TableCell>

                      {/* Contact */}
                      <TableCell>
                        <div className="space-y-0.5">
                          {p.email && (
                            <a href={`mailto:${p.email}`} className="text-xs text-slate-600 hover:text-emerald-600 flex items-center gap-1 transition-colors">
                              <Mail className="w-3 h-3 text-slate-400" />
                              <span className="truncate max-w-[180px]">{p.email}</span>
                            </a>
                          )}
                          {p.phone && (
                            <p className="text-xs text-slate-600 flex items-center gap-1">
                              <Phone className="w-3 h-3 text-slate-400" />
                              {p.phone}
                            </p>
                          )}
                          {!p.email && !p.phone && <p className="text-xs text-slate-400">No contact</p>}
                        </div>
                      </TableCell>

                      {/* Children */}
                      <TableCell>
                        {p.children_count > 0 ? (
                          <div className="flex items-center gap-1">
                            <Baby className="w-3.5 h-3.5 text-sky-500" />
                            <span className="text-sm font-medium text-slate-700">{p.children_count}</span>
                            <span className="text-xs text-slate-400">{p.children_count === 1 ? 'child' : 'children'}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">No children</span>
                        )}
                      </TableCell>

                      {/* Occupation */}
                      <TableCell>
                        <p className="text-sm text-slate-600">{p.profession || '\u2014'}</p>
                        {p.designation && (
                          <Badge variant="outline" className="text-[10px] mt-0.5 text-amber-700 border-amber-200 bg-amber-50">
                            {p.designation}
                          </Badge>
                        )}
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className={
                                p.block_limit >= 3
                                  ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100 h-8'
                                  : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 h-8'
                              }
                            >
                              {p.block_limit >= 3 ? (
                                <><ShieldX className="w-3 h-3 mr-1" /> Blocked</>
                              ) : (
                                <><ShieldCheck className="w-3 h-3 mr-1" /> Active</>
                              )}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start">
                            <DropdownMenuLabel>Account Status</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {p.block_limit >= 3 ? (
                              <DropdownMenuItem onClick={() => confirmBlock(p, 'unblock')} className="text-emerald-700 focus:text-emerald-700">
                                <Unlock className="w-4 h-4 mr-2" /> Unblock Account
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem onClick={() => confirmBlock(p, 'block')} className="text-rose-700 focus:text-rose-700">
                                <Lock className="w-4 h-4 mr-2" /> Block Account
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>

                      {/* Auth Key */}
                      <TableCell>
                        {p.authentication_key ? (
                          <div
                            className="flex items-center gap-1 cursor-pointer group"
                            onClick={() => copyAuthKey(p.authentication_key)}
                            title="Click to copy"
                          >
                            <code className="text-xs font-bold tracking-wider bg-slate-100 px-2 py-0.5 rounded group-hover:bg-slate-200 transition-colors">
                              {p.authentication_key}
                            </code>
                            <Copy className="w-3 h-3 text-slate-400 group-hover:text-slate-600 transition-colors" />
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">{'\u2014'}</span>
                        )}
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8 min-w-[32px]" onClick={() => openView(p)} title="View details">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 min-w-[32px]" onClick={() => openEditForm(p)} title="Edit">
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 min-w-[32px]">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>More</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => openView(p)}>
                                <Eye className="w-4 h-4 mr-2" /> View Profile
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openEditForm(p)} className="text-emerald-700 focus:text-emerald-700">
                                <Pencil className="w-4 h-4 mr-2" /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => confirmDelete(p)} className="text-red-600 focus:text-red-600">
                                <Trash2 className="w-4 h-4 mr-2" /> Delete
                              </DropdownMenuItem>
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
          <div className="md:hidden divide-y divide-slate-100">
            {parents.length === 0 ? (
              <div className="text-center py-20 px-4">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center">
                    <Users className="w-8 h-8 text-slate-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-500 text-base">No parents found</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {search || classFilter !== '__all__'
                        ? 'Try adjusting your filters'
                        : 'Add your first parent to get started'}
                    </p>
                  </div>
                  {!search && classFilter === '__all__' && (
                    <Button
                      variant="outline"
                      className="mt-2 min-h-[44px] border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                      onClick={openAddForm}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Parent
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              parents.map((p) => (
                <div key={p.parent_id} className="p-4 space-y-3">
                  {/* Header: Avatar + Name + Status */}
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                      {(p.name || '?').charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-semibold text-sm text-slate-900 truncate">{p.name}</p>
                          <p className="text-xs text-slate-500">
                            {[
                              p.guardian_is_the ? p.guardian_is_the.charAt(0).toUpperCase() + p.guardian_is_the.slice(1) : null,
                              p.profession,
                              p.children_count > 0 ? `${p.children_count} child${p.children_count > 1 ? 'ren' : ''}` : null,
                            ].filter(Boolean).join(' \u00B7 ') || 'No info'}
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className={
                            p.block_limit >= 3
                              ? 'bg-rose-50 text-rose-700 border-rose-200 text-[10px] flex-shrink-0'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] flex-shrink-0'
                          }
                        >
                          {p.block_limit >= 3 ? 'Blocked' : 'Active'}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-1">
                    {p.phone && (
                      <p className="text-xs text-slate-600 flex items-center gap-1.5">
                        <Phone className="w-3 h-3 text-slate-400" />
                        {p.phone}
                      </p>
                    )}
                    {p.email && (
                      <p className="text-xs text-slate-600 flex items-center gap-1.5 truncate">
                        <Mail className="w-3 h-3 text-slate-400 flex-shrink-0" />
                        <span className="truncate">{p.email}</span>
                      </p>
                    )}
                    {!p.phone && !p.email && (
                      <p className="text-xs text-slate-400">No contact info</p>
                    )}
                  </div>

                  {/* Auth Key */}
                  {p.authentication_key && (
                    <div
                      className="flex items-center gap-1.5 cursor-pointer group"
                      onClick={() => copyAuthKey(p.authentication_key)}
                    >
                      <code className="text-[10px] font-bold tracking-wider bg-slate-100 px-2 py-0.5 rounded group-hover:bg-slate-200 transition-colors">
                        {p.authentication_key}
                      </code>
                      <Copy className="w-3 h-3 text-slate-400" />
                      <span className="text-[10px] text-slate-400">tap to copy</span>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-1">
                    <Button
                      variant="outline"
                      className="flex-1 min-h-[44px] h-11 text-xs"
                      onClick={() => openView(p)}
                    >
                      <Eye className="w-3.5 h-3.5 mr-1.5" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 min-h-[44px] h-11 text-xs"
                      onClick={() => openEditForm(p)}
                    >
                      <Pencil className="w-3.5 h-3.5 mr-1.5" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      className="min-h-[44px] min-w-[44px] h-11 text-xs text-red-600 border-red-200 hover:bg-red-50"
                      onClick={() => confirmDelete(p)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-t bg-slate-50/50">
              <p className="text-xs text-slate-500">
                Page {page} of {totalPages} &middot; {totalRecords} total
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
                {getPageNumbers().map((pg, idx) =>
                  typeof pg === 'string' ? (
                    <span key={`ellipsis-${idx}`} className="px-1 text-xs text-slate-400">...</span>
                  ) : (
                    <Button
                      key={pg}
                      variant={page === pg ? 'default' : 'outline'}
                      size="icon"
                      className={`h-8 w-8 min-w-[32px] text-xs ${page === pg ? 'bg-emerald-600 hover:bg-emerald-700' : ''}`}
                      onClick={() => setPage(pg)}
                    >
                      {pg}
                    </Button>
                  )
                )}
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
        </div>
      </div>

      {/* ─── Add/Edit Parent Dialog ─────────────────── */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                <Users className="w-4 h-4 text-emerald-600" />
              </div>
              {editing ? 'Edit Parent' : 'Add New Parent'}
            </DialogTitle>
            <DialogDescription>
              {editing
                ? 'Update the parent/guardian information below.'
                : 'Fill in the details to register a new parent/guardian.'}
            </DialogDescription>
          </DialogHeader>
          {formSaving && !editing ? (
            <div className="space-y-4 py-2">
              <Skeleton className="h-10 w-full" />
              <div className="grid grid-cols-2 gap-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <div className="space-y-4 py-2">
              {/* Name */}
              <div>
                <Label className="text-sm font-medium">Full Name <span className="text-red-500">*</span></Label>
                <Input
                  placeholder="Enter full name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1.5 min-h-[44px]"
                />
              </div>

              {/* Guardian Gender & Relationship */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-sm font-medium">Gender</Label>
                  <Select value={formData.guardian_gender} onValueChange={(v) => setFormData({ ...formData, guardian_gender: v })}>
                    <SelectTrigger className="mt-1.5 min-h-[44px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm font-medium">{editing ? 'Relationship' : 'Guardian Is The'}</Label>
                  <Select
                    value={formData.guardian_is_the || '__none__'}
                    onValueChange={(v) => setFormData({ ...formData, guardian_is_the: v === '__none__' ? '' : v })}
                  >
                    <SelectTrigger className="mt-1.5 min-h-[44px]">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Select...</SelectItem>
                      <SelectItem value="mother">Mother</SelectItem>
                      <SelectItem value="father">Father</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Contact Information */}
              <div>
                <p className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5" /> Contact Information
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-slate-500">Email</Label>
                    <Input
                      type="email"
                      placeholder="email@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="mt-1 min-h-[44px]"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-slate-500">Phone</Label>
                    <Input
                      type="tel"
                      placeholder="Phone number"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="mt-1 min-h-[44px]"
                    />
                  </div>
                </div>
              </div>

              {/* Password (add only) */}
              {!editing && (
                <div>
                  <Label className="text-sm font-medium">Password</Label>
                  <Input
                    type="password"
                    placeholder="Leave blank for default (123456)"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="mt-1.5 min-h-[44px]"
                  />
                  <p className="text-xs text-slate-400 mt-1">Default password: 123456</p>
                </div>
              )}

              {/* Address */}
              <div>
                <Label className="text-sm font-medium">Address</Label>
                <Input
                  placeholder="Home address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="mt-1.5 min-h-[44px]"
                />
              </div>

              {/* Occupation */}
              <div>
                <Label className="text-sm font-medium">Occupation</Label>
                <Input
                  placeholder="e.g. Teacher, Nurse, Trader"
                  value={formData.profession}
                  onChange={(e) => setFormData({ ...formData, profession: e.target.value })}
                  className="mt-1.5 min-h-[44px]"
                />
              </div>

              <Separator />

              {/* PTA Executive */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 min-h-[44px]">
                  <Checkbox
                    id="is_executive"
                    checked={formData.isExecutive}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        isExecutive: !!checked,
                        designation: !checked ? '' : formData.designation,
                      })
                    }
                  />
                  <Label htmlFor="is_executive" className="text-sm font-medium cursor-pointer">
                    PTA Executive
                  </Label>
                  <Badge
                    variant="outline"
                    className={
                      formData.isExecutive
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]'
                        : 'bg-slate-50 text-slate-400 border-slate-200 text-[10px]'
                    }
                  >
                    {formData.isExecutive ? 'YES' : 'NO'}
                  </Badge>
                </div>

                {formData.isExecutive && (
                  <div>
                    <Label className="text-sm font-medium">Designation <span className="text-red-500">*</span></Label>
                    <Input
                      placeholder="e.g. PTA Chairman"
                      value={formData.designation}
                      onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                      className="mt-1.5 min-h-[44px]"
                    />
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setFormOpen(false)} className="min-h-[44px]">Cancel</Button>
            <Button
              onClick={handleSave}
              disabled={formSaving || !formData.name.trim()}
              className="bg-emerald-600 hover:bg-emerald-700 min-h-[44px]"
            >
              {formSaving ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...</>
              ) : editing ? (
                'Update'
              ) : (
                'Add Parent'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── View Parent Details Dialog ──────────────── */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Parent Profile</DialogTitle>
          </DialogHeader>
          {viewLoading ? (
            <div className="space-y-4 py-4">
              <div className="flex flex-col items-center">
                <Skeleton className="h-20 w-20 rounded-full mb-3" />
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-32 mt-1" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-lg" />
                ))}
              </div>
            </div>
          ) : viewParent ? (
            <div className="space-y-4">
              {/* Avatar & Name */}
              <div className="text-center pb-4 border-b">
                <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-full mx-auto flex items-center justify-center mb-3 text-white text-2xl font-bold">
                  {(viewParent.name || '?').charAt(0)}
                </div>
                <h3 className="font-bold text-lg text-slate-900">{viewParent.name}</h3>
                <p className="text-sm text-slate-500 mt-0.5">
                  {viewParent.profession && viewParent.profession}
                  {viewParent.profession && viewParent.designation ? ' \u00B7 ' : ''}
                  {viewParent.designation && (
                    <Badge variant="outline" className="ml-1 text-xs text-amber-700 border-amber-200 bg-amber-50">
                      {viewParent.designation}
                    </Badge>
                  )}
                </p>
                <div className="flex items-center justify-center gap-2 mt-2">
                  <Badge
                    variant="outline"
                    className={
                      viewParent.block_limit >= 3
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }
                  >
                    {viewParent.block_limit >= 3 ? (
                      <><ShieldX className="w-3 h-3 mr-1" /> Blocked</>
                    ) : (
                      <><ShieldCheck className="w-3 h-3 mr-1" /> Active</>
                    )}
                  </Badge>
                  {viewParent.authentication_key && (
                    <code
                      className="text-xs font-bold tracking-wider bg-slate-100 px-2 py-0.5 rounded cursor-pointer hover:bg-slate-200 transition-colors"
                      onClick={() => copyAuthKey(viewParent.authentication_key)}
                      title="Click to copy"
                    >
                      {viewParent.authentication_key}
                    </code>
                  )}
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-xs text-slate-400 mb-0.5">Gender</p>
                  <p className="text-sm font-medium text-slate-900">{viewParent.guardian_gender || '\u2014'}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-xs text-slate-400 mb-0.5">Relationship</p>
                  <p className="text-sm font-medium text-slate-900 capitalize">{viewParent.guardian_is_the || '\u2014'}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-xs text-slate-400 mb-0.5 flex items-center gap-1"><Mail className="w-3 h-3" /> Email</p>
                  {viewParent.email ? (
                    <a href={`mailto:${viewParent.email}`} className="text-sm font-medium text-emerald-600 hover:underline">{viewParent.email}</a>
                  ) : (
                    <p className="text-sm text-slate-400">{'\u2014'}</p>
                  )}
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-xs text-slate-400 mb-0.5 flex items-center gap-1"><Phone className="w-3 h-3" /> Phone</p>
                  <p className="text-sm font-medium text-slate-900">{viewParent.phone || '\u2014'}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-xs text-slate-400 mb-0.5 flex items-center gap-1"><Briefcase className="w-3 h-3" /> Occupation</p>
                  <p className="text-sm font-medium text-slate-900">{viewParent.profession || '\u2014'}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-xs text-slate-400 mb-0.5">Children</p>
                  <p className="text-sm font-medium text-slate-900">{viewParent.enrolls ? viewParent.enrolls.length : viewParent.children_count || 0}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3 col-span-2">
                  <p className="text-xs text-slate-400 mb-0.5">Address</p>
                  <p className="text-sm font-medium text-slate-900">{viewParent.address || '\u2014'}</p>
                </div>
              </div>

              {/* Children List */}
              {viewParent.enrolls && viewParent.enrolls.length > 0 && (
                <div className="border-t pt-4">
                  <h4 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
                    <Baby className="w-4 h-4 text-sky-500" /> Children ({viewParent.enrolls.length})
                  </h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {viewParent.enrolls.map((enr) => (
                      <div key={enr.enroll_id} className="flex items-center gap-2.5 bg-sky-50 rounded-lg px-3 py-2.5">
                        <div className="w-8 h-8 rounded-full bg-sky-200 flex items-center justify-center text-sky-700 text-xs font-bold flex-shrink-0">
                          {enr.student.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate text-slate-900">{enr.student.name}</p>
                          <p className="text-xs text-slate-500">
                            {enr.class?.name || ''}{enr.section?.name ? ` ${enr.section.name}` : ''} {'\u00B7 '} {enr.year}
                          </p>
                        </div>
                        <code className="text-[10px] bg-white px-1.5 py-0.5 rounded border text-slate-500 flex-shrink-0">
                          {enr.student.student_code}
                        </code>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : null}
          <DialogFooter className="gap-2">
            <Button variant="outline" className="min-h-[44px]" onClick={() => setViewOpen(false)}>Close</Button>
            {viewParent && (
              <Button
                variant="outline"
                className="min-h-[44px] border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                onClick={() => { setViewOpen(false); openEditForm(viewParent); }}
              >
                <Pencil className="w-3.5 h-3.5 mr-1.5" /> Edit
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Delete Confirmation Dialog ──────────────── */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                <Trash2 className="w-4 h-4 text-red-600" />
              </div>
              Delete Parent
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deleteTarget?.name}</strong>? This action cannot be undone. If this parent has linked children, the deletion will be prevented.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteLoading}
              className="bg-red-600 hover:bg-red-700 text-white min-h-[44px]"
            >
              {deleteLoading ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Deleting...</>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ─── Block/Unblock Confirmation Dialog ────────── */}
      <AlertDialog open={blockOpen} onOpenChange={setBlockOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {blockAction === 'block' ? 'Block Account' : 'Unblock Account'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {blockAction === 'block'
                ? `Are you sure you want to block ${blockTarget?.name}'s account? They will not be able to log in.`
                : `Are you sure you want to unblock ${blockTarget?.name}'s account? They will be able to log in again.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={blockLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBlock}
              disabled={blockLoading}
              className={`min-h-[44px] ${
                blockAction === 'block'
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
            >
              {blockLoading ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...</>
              ) : blockAction === 'block' ? (
                'Block Account'
              ) : (
                'Unblock Account'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
