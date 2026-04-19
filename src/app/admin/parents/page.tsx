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
  Filter,
  X,
  Loader2,
  User,
  Printer,
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
  father_name: string;
  father_phone: string;
  mother_name: string;
  mother_phone: string;
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

type StatusTab = 'all' | 'active' | 'inactive';

// ─── Skeleton Components ─────────────────────────────────

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

function GenderStatSkeleton() {
  return (
    <div className="grid grid-cols-3 gap-4 p-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-1 flex-1">
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-6 w-8" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Component ───────────────────────────────────────────
export default function ParentsPage() {
  // Data state
  const [parents, setParents] = useState<ParentRow[]>([]);
  const [grandTotal, setGrandTotal] = useState(0);
  const [totalMale, setTotalMale] = useState(0);
  const [totalFemale, setTotalFemale] = useState(0);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // UI state
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<StatusTab>('all');
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
    guardian_is_the: 'father',
    email: '',
    phone: '',
    password: '',
    address: '',
    profession: '',
    isExecutive: false,
    designation: '',
    father_name: '',
    father_phone: '',
    mother_name: '',
    mother_phone: '',
  });

  // ─── Fetch parents ──────────────────────────────────
  const fetchParents = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (activeTab === 'active') params.set('status', 'active');
      if (activeTab === 'inactive') params.set('status', 'inactive');
      params.set('page', page.toString());
      params.set('pageSize', pageSize.toString());

      const res = await fetch(`/api/admin/parents?${params}`);
      const json: ApiResponse = await res.json();
      if (json.error) throw new Error(json.error);

      setParents(json.data || []);
      setGrandTotal(json.grandTotalGender || 0);
      setTotalMale(json.totalMale || 0);
      setTotalFemale(json.totalFemale || 0);
      setTotalRecords(json.pagination?.total || 0);
      setTotalPages(json.pagination?.totalPages || 1);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load parents';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [search, activeTab, page]);

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

  // Reset page on tab changes
  useEffect(() => {
    setPage(1);
  }, [activeTab]);

  // ─── Form handlers ──────────────────────────────────
  const resetForm = () => {
    setFormData({
      name: '',
      guardian_gender: 'Male',
      guardian_is_the: 'father',
      email: '',
      phone: '',
      password: '',
      address: '',
      profession: '',
      isExecutive: false,
      designation: '',
      father_name: '',
      father_phone: '',
      mother_name: '',
      mother_phone: '',
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
        guardian_is_the: detail.guardian_is_the || 'father',
        email: detail.email || '',
        phone: detail.phone || '',
        password: '',
        address: detail.address || '',
        profession: detail.profession || '',
        isExecutive: !!detail.designation,
        designation: detail.designation || '',
        father_name: detail.father_name || '',
        father_phone: detail.father_phone || '',
        mother_name: detail.mother_name || '',
        mother_phone: detail.mother_phone || '',
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
      const payload: Record<string, unknown> = {
        name: formData.name,
        guardian_gender: formData.guardian_gender,
        guardian_is_the: formData.guardian_is_the,
        email: formData.email || '',
        phone: formData.phone || '',
        address: formData.address || '',
        profession: formData.profession || '',
        designation: formData.isExecutive ? formData.designation : '',
        father_name: formData.father_name || '',
        father_phone: formData.father_phone || '',
        mother_name: formData.mother_name || '',
        mother_phone: formData.mother_phone || '',
      };

      let url: string;
      let method: string;

      if (editing) {
        url = `/api/admin/parents/${editing.parent_id}`;
        method = 'PUT';
      } else {
        url = '/api/admin/parents';
        method = 'POST';
        payload.password = formData.password || '123456';
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
  if (loading && parents.length === 0) {
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
          <Skeleton className="h-12 w-full rounded-lg" />
          <div className="bg-white rounded-2xl border border-slate-200/60 p-2">
            <GenderStatSkeleton />
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
            Add New Parent
          </Button>
        </div>

        {/* ═══ Tab System (CI3 parity) ═══ */}
        <div className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden">
          <div className="flex border-b border-slate-200">
            <button
              onClick={() => setActiveTab('all')}
              className={`flex-1 px-4 py-3 sm:px-6 sm:py-4 text-sm sm:text-base font-bold transition-all ${
                activeTab === 'all'
                  ? 'bg-sky-600 text-white'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Users className="w-4 h-4 inline-block mr-1.5 -mt-0.5" />
              All Parents
            </button>
            <button
              onClick={() => setActiveTab('active')}
              className={`flex-1 px-4 py-3 sm:px-6 sm:py-4 text-sm sm:text-base font-bold transition-all ${
                activeTab === 'active'
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <ShieldCheck className="w-4 h-4 inline-block mr-1.5 -mt-0.5" />
              Active Parents
            </button>
            <button
              onClick={() => setActiveTab('inactive')}
              className={`flex-1 px-4 py-3 sm:px-6 sm:py-4 text-sm sm:text-base font-bold transition-all ${
                activeTab === 'inactive'
                  ? 'bg-rose-600 text-white'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <ShieldX className="w-4 h-4 inline-block mr-1.5 -mt-0.5" />
              Inactive Parents
            </button>
          </div>

          {/* ═══ Gender Stats Bar (CI3 parity) ═══ */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4 px-4 py-4 sm:px-6 sm:py-5 bg-slate-50 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-sky-100 flex items-center justify-center flex-shrink-0">
                <User className="w-5 h-5 text-sky-600" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Males</p>
                <p className="text-xl sm:text-2xl font-bold text-slate-900">{totalMale}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center flex-shrink-0">
                <User className="w-5 h-5 text-pink-600" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Females</p>
                <p className="text-xl sm:text-2xl font-bold text-slate-900">{totalFemale}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                <Users className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total</p>
                <p className="text-xl sm:text-2xl font-bold text-slate-900">{grandTotal}</p>
              </div>
            </div>
          </div>

          {/* ═══ Search Bar ═══ */}
          <div className="px-4 py-3 border-b border-slate-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search by name, email, phone, profession..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 min-h-[44px] bg-white"
              />
            </div>
          </div>

          {/* ═══ Data Table / Mobile Card View ═══ */}
          {/* Results header */}
          {!loading && parents.length > 0 && (
            <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-slate-100 bg-slate-50/50">
              <p className="text-xs font-medium text-slate-500">
                Showing {(page - 1) * pageSize + 1}&ndash;{Math.min(page * pageSize, totalRecords)} of {totalRecords} parents
              </p>
            </div>
          )}

          {/* Desktop Table View */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 hover:bg-slate-50">
                  <TableHead className="text-xs font-semibold text-slate-600">Name</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-600">Gender</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-600">Email</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-600">Auth Key</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-600">Phone</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-600">Profession</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-600">Status</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-600 text-right">Options</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {parents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-20">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center">
                          <Users className="w-8 h-8 text-slate-400" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-500 text-base">No parents found</p>
                          <p className="text-xs text-slate-400 mt-1">
                            {search
                              ? 'Try adjusting your search'
                              : 'Get started by adding the first parent'}
                          </p>
                        </div>
                        {!search && activeTab === 'all' && (
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
                      {/* Name */}
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${
                            p.guardian_gender === 'Female'
                              ? 'bg-gradient-to-br from-pink-500 to-pink-700'
                              : 'bg-gradient-to-br from-sky-500 to-sky-700'
                          }`}>
                            {(p.name || '?').charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-sm text-slate-900 truncate">{p.name}</p>
                            {p.children_count > 0 && (
                              <p className="text-xs text-slate-500">{p.children_count} child{p.children_count > 1 ? 'ren' : ''}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>

                      {/* Gender */}
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`text-xs ${
                            p.guardian_gender === 'Female'
                              ? 'bg-pink-50 text-pink-700 border-pink-200'
                              : 'bg-sky-50 text-sky-700 border-sky-200'
                          }`}
                        >
                          {p.guardian_gender || '\u2014'}
                        </Badge>
                      </TableCell>

                      {/* Email */}
                      <TableCell>
                        {p.email ? (
                          <a href={`mailto:${p.email}`} className="text-xs text-slate-600 hover:text-emerald-600 flex items-center gap-1 transition-colors">
                            <Mail className="w-3 h-3 text-slate-400 flex-shrink-0" />
                            <span className="truncate max-w-[160px]">{p.email}</span>
                          </a>
                        ) : (
                          <span className="text-xs text-slate-400">{'\u2014'}</span>
                        )}
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

                      {/* Phone */}
                      <TableCell>
                        {p.phone ? (
                          <p className="text-xs text-slate-600 flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-400 flex-shrink-0" />
                            {p.phone}
                          </p>
                        ) : (
                          <span className="text-xs text-slate-400">{'\u2014'}</span>
                        )}
                      </TableCell>

                      {/* Profession */}
                      <TableCell>
                        <div>
                          <p className="text-sm text-slate-600">{p.profession || '\u2014'}</p>
                          {p.designation && (
                            <Badge variant="outline" className="text-[10px] mt-0.5 text-amber-700 border-amber-200 bg-amber-50">
                              {p.designation}
                            </Badge>
                          )}
                        </div>
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
                      {search ? 'Try adjusting your search' : 'Add your first parent to get started'}
                    </p>
                  </div>
                  {!search && activeTab === 'all' && (
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
                    <div className={`w-11 h-11 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 ${
                      p.guardian_gender === 'Female'
                        ? 'bg-gradient-to-br from-pink-500 to-pink-700'
                        : 'bg-gradient-to-br from-sky-500 to-sky-700'
                    }`}>
                      {(p.name || '?').charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-semibold text-sm text-slate-900 truncate">{p.name}</p>
                          <p className="text-xs text-slate-500">
                            {[
                              p.guardian_gender,
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
                      variant={pg === page ? 'default' : 'outline'}
                      size="icon"
                      className={`h-8 w-8 min-w-[32px] text-xs ${pg === page ? 'bg-slate-900 hover:bg-slate-800' : ''}`}
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

      {/* ═══ Add/Edit Form Dialog ═══ */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editing ? 'Edit Parent' : 'Add Parent'}
            </DialogTitle>
            <DialogDescription>
              {editing ? 'Update parent/guardian information' : 'Create a new parent/guardian account'}
            </DialogDescription>
          </DialogHeader>

          {formSaving && !editing ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
              <span className="ml-2 text-sm text-slate-500">Loading parent data...</span>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Row 1: Name + Guardian Gender */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="parent-name">Name *</Label>
                  <Input
                    id="parent-name"
                    placeholder="Enter parent name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="guardian-gender">Guardian Gender</Label>
                  <Select
                    value={formData.guardian_gender}
                    onValueChange={(v) => setFormData({ ...formData, guardian_gender: v })}
                  >
                    <SelectTrigger id="guardian-gender">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Row 2: Guardian Is The + Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="guardian-is-the">Guardian Is The</Label>
                  <Select
                    value={formData.guardian_is_the}
                    onValueChange={(v) => setFormData({ ...formData, guardian_is_the: v })}
                  >
                    <SelectTrigger id="guardian-is-the">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="father">Father</SelectItem>
                      <SelectItem value="mother">Mother</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="parent-email">Email</Label>
                  <Input
                    id="parent-email"
                    type="email"
                    placeholder="Enter email address"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>

              {/* Row 3: Password (add only) + Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {!editing && (
                  <div className="space-y-2">
                    <Label htmlFor="parent-password">Password</Label>
                    <Input
                      id="parent-password"
                      type="password"
                      placeholder="Default: 123456"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    />
                    <p className="text-[10px] text-slate-400">Leave blank for default password</p>
                  </div>
                )}
                <div className={`space-y-2 ${editing ? 'sm:col-span-2' : ''}`}>
                  <Label htmlFor="parent-phone">Phone</Label>
                  <Input
                    id="parent-phone"
                    type="tel"
                    placeholder="Enter phone number"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>

              {/* Row 4: Address + Profession */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="parent-address">Address</Label>
                  <Input
                    id="parent-address"
                    placeholder="Enter address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="parent-profession">Profession</Label>
                  <Input
                    id="parent-profession"
                    placeholder="Enter profession"
                    value={formData.profession}
                    onChange={(e) => setFormData({ ...formData, profession: e.target.value })}
                  />
                </div>
              </div>

              {/* Separator */}
              <Separator />

              {/* PTA Executive */}
              <div className="flex items-center gap-3">
                <Checkbox
                  id="pta-executive"
                  checked={formData.isExecutive}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isExecutive: !!checked, designation: !checked ? '' : formData.designation })
                  }
                />
                <Label htmlFor="pta-executive" className="cursor-pointer font-medium">
                  A PTA Executive
                </Label>
              </div>

              {/* Designation (conditional) */}
              {formData.isExecutive && (
                <div className="space-y-2">
                  <Label htmlFor="parent-designation">Designation *</Label>
                  <Input
                    id="parent-designation"
                    placeholder="Enter PTA designation"
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                  />
                </div>
              )}

              <Separator />

              {/* Father & Mother Info */}
              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-slate-700">Family Details</h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="father-name">Father Name</Label>
                  <Input
                    id="father-name"
                    placeholder="Enter father's name"
                    value={formData.father_name}
                    onChange={(e) => setFormData({ ...formData, father_name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="father-phone">Father Phone</Label>
                  <Input
                    id="father-phone"
                    type="tel"
                    placeholder="Enter father's phone"
                    value={formData.father_phone}
                    onChange={(e) => setFormData({ ...formData, father_phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="mother-name">Mother Name</Label>
                  <Input
                    id="mother-name"
                    placeholder="Enter mother's name"
                    value={formData.mother_name}
                    onChange={(e) => setFormData({ ...formData, mother_name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mother-phone">Mother Phone</Label>
                  <Input
                    id="mother-phone"
                    type="tel"
                    placeholder="Enter mother's phone"
                    value={formData.mother_phone}
                    onChange={(e) => setFormData({ ...formData, mother_phone: e.target.value })}
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setFormOpen(false)} className="min-h-[44px]">
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={formSaving || !formData.name.trim()}
              className="bg-emerald-600 hover:bg-emerald-700 min-h-[44px]"
            >
              {formSaving ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
              ) : editing ? (
                'Update'
              ) : (
                'Add Parent'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ View Profile Dialog ═══ */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Parent Profile</DialogTitle>
            <DialogDescription>Detailed parent/guardian information</DialogDescription>
          </DialogHeader>

          {viewLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
            </div>
          ) : viewParent ? (
            <div className="space-y-5">
              {/* Header */}
              <div className="text-center pb-4 border-b border-slate-100">
                <div className={`w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-3 ${
                  viewParent.guardian_gender === 'Female'
                    ? 'bg-gradient-to-br from-pink-500 to-pink-700'
                    : 'bg-gradient-to-br from-sky-500 to-sky-700'
                }`}>
                  <User className="w-8 h-8 text-white" />
                </div>
                <p className="font-bold text-lg text-slate-900">{viewParent.name}</p>
                <div className="flex items-center justify-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">
                    {viewParent.guardian_gender}
                  </Badge>
                  {viewParent.guardian_is_the && (
                    <Badge variant="outline" className="text-xs bg-slate-100">
                      {viewParent.guardian_is_the}
                    </Badge>
                  )}
                  <Badge
                    variant="outline"
                    className={`text-xs ${
                      viewParent.block_limit >= 3
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}
                  >
                    {viewParent.block_limit >= 3 ? 'Blocked' : 'Active'}
                  </Badge>
                </div>
                {viewParent.authentication_key && (
                  <div
                    className="flex items-center justify-center gap-1.5 mt-2 cursor-pointer group"
                    onClick={() => copyAuthKey(viewParent.authentication_key)}
                  >
                    <code className="text-xs font-bold tracking-wider bg-slate-100 px-2 py-0.5 rounded">
                      {viewParent.authentication_key}
                    </code>
                    <Copy className="w-3 h-3 text-slate-400 group-hover:text-slate-600" />
                  </div>
                )}
              </div>

              {/* Details */}
              <div className="space-y-3 text-sm">
                {viewParent.email && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Email</span>
                    <a href={`mailto:${viewParent.email}`} className="text-emerald-600 hover:underline">{viewParent.email}</a>
                  </div>
                )}
                {viewParent.phone && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Phone</span>
                    <span className="text-slate-900">{viewParent.phone}</span>
                  </div>
                )}
                {viewParent.address && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Address</span>
                    <span className="text-slate-900 text-right max-w-[60%]">{viewParent.address}</span>
                  </div>
                )}
                {viewParent.profession && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Profession</span>
                    <span className="text-slate-900">{viewParent.profession}</span>
                  </div>
                )}
                {viewParent.designation && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Designation</span>
                    <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
                      {viewParent.designation}
                    </Badge>
                  </div>
                )}
              </div>

              <Separator />

              {/* Family Details */}
              <div className="space-y-3 text-sm">
                <h4 className="text-sm font-semibold text-slate-700">Family Details</h4>
                {viewParent.father_name && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Father</span>
                    <span className="text-slate-900">{viewParent.father_name}{viewParent.father_phone ? ` (${viewParent.father_phone})` : ''}</span>
                  </div>
                )}
                {viewParent.mother_name && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Mother</span>
                    <span className="text-slate-900">{viewParent.mother_name}{viewParent.mother_phone ? ` (${viewParent.mother_phone})` : ''}</span>
                  </div>
                )}
              </div>

              {/* Children */}
              {viewParent.students && viewParent.students.length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-slate-700">Children ({viewParent.students.length})</h4>
                    <div className="space-y-1.5">
                      {viewParent.students.map((s) => (
                        <div key={s.student_id} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg text-xs">
                          <span className="font-medium text-slate-900">{s.name}</span>
                          <Badge variant="outline" className="text-[10px]">{s.student_code}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* ═══ Delete Confirmation ═══ */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Delete</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete parent &quot;{deleteTarget?.name}&quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteLoading ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ═══ Block/Unblock Confirmation ═══ */}
      <AlertDialog open={blockOpen} onOpenChange={setBlockOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {blockAction === 'block' ? 'Block Account' : 'Unblock Account'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {blockAction === 'block'
                ? `Are you sure you want to block "${blockTarget?.name}"? They will not be able to access their account.`
                : `Are you sure you want to unblock "${blockTarget?.name}"? They will regain access to their account.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBlock}
              disabled={blockLoading}
              className={blockAction === 'block' ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'}
            >
              {blockLoading ? 'Processing...' : blockAction === 'block' ? 'Block' : 'Unblock'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
