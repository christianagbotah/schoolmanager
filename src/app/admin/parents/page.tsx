'use client';

import { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent } from '@/components/ui/card';
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
  Mail,
  Lock,
  Unlock,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  UserX,
  Copy,
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

type StatusTab = 'all' | 'active' | 'inactive';

// ─── Component ───────────────────────────────────────────
export default function ParentsPage() {
  // Data state
  const [parents, setParents] = useState<ParentRow[]>([]);
  const [totalMale, setTotalMale] = useState(0);
  const [totalFemale, setTotalFemale] = useState(0);
  const [grandTotal, setGrandTotal] = useState(0);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // UI state
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [statusTab, setStatusTab] = useState<StatusTab>('all');
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

  // ─── Fetch parents ──────────────────────────────────
  const fetchParents = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (statusTab === 'active') params.set('status', 'active');
      else if (statusTab === 'inactive') params.set('status', 'inactive');
      params.set('page', page.toString());
      params.set('pageSize', pageSize.toString());

      const res = await fetch(`/api/admin/parents?${params}`);
      const json: ApiResponse = await res.json();
      if (json.error) throw new Error(json.error);

      setParents(json.data || []);
      setTotalMale(json.totalMale || 0);
      setTotalFemale(json.totalFemale || 0);
      setGrandTotal(json.grandTotalGender || 0);
      setTotalRecords(json.pagination?.total || 0);
      setTotalPages(json.pagination?.totalPages || 1);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load parents';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [search, statusTab, page]);

  useEffect(() => {
    fetchParents();
  }, [fetchParents]);

  // Reset page on filter changes
  useEffect(() => {
    setPage(1);
  }, [search, statusTab]);

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

  const openEditForm = async (p: ParentRow) => {
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

      toast.success(editing ? "Parent's data updated successfully" : "Parent's data added successfully");

      if (!editing && data.authentication_key) {
        toast.info(`Authentication Key: ${data.authentication_key}`, { duration: 6000 });
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
      const res = await fetch(`/api/admin/parents/${deleteTarget.parent_id}`, { method: 'DELETE' });
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

  // ─── Render ─────────────────────────────────────────
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Parents</h1>
            <p className="text-sm text-slate-500 mt-1">Manage parent/guardian accounts</p>
          </div>
          <Button onClick={openAddForm} className="bg-emerald-600 hover:bg-emerald-700 text-white">
            <Plus className="w-4 h-4 mr-2" />
            Add New Parent
          </Button>
        </div>

        {/* Status Tabs */}
        <div className="flex gap-2">
          <Button
            variant={statusTab === 'all' ? 'default' : 'outline'}
            className={statusTab === 'all' ? 'bg-blue-600 hover:bg-blue-700 text-white' : ''}
            onClick={() => setStatusTab('all')}
          >
            <Users className="w-4 h-4 mr-1.5" />
            All Parents
          </Button>
          <Button
            variant={statusTab === 'active' ? 'default' : 'outline'}
            className={statusTab === 'active' ? 'bg-green-600 hover:bg-green-700 text-white' : 'text-green-700 border-green-300'}
            onClick={() => setStatusTab('active')}
          >
            <UserCheck className="w-4 h-4 mr-1.5" />
            Active Parents
          </Button>
          <Button
            variant={statusTab === 'inactive' ? 'default' : 'outline'}
            className={statusTab === 'inactive' ? 'bg-red-600 hover:bg-red-700 text-white' : 'text-red-700 border-red-300'}
            onClick={() => setStatusTab('inactive')}
          >
            <UserX className="w-4 h-4 mr-1.5" />
            Inactive Parents
          </Button>
        </div>

        {/* Gender Summary + Search Card */}
        <Card>
          <CardContent className="p-4 space-y-4">
            {/* Gender Stats Bar */}
            <div className="grid grid-cols-3 gap-3">
              <div className="flex items-center gap-2 bg-slate-100 rounded-lg px-3 py-2">
                <span className="text-sm text-slate-600">Males:</span>
                <span className="font-bold text-lg text-slate-800">{totalMale}</span>
              </div>
              <div className="flex items-center gap-2 bg-slate-100 rounded-lg px-3 py-2">
                <span className="text-sm text-slate-600">Females:</span>
                <span className="font-bold text-lg text-slate-800">{totalFemale}</span>
              </div>
              <div className="flex items-center gap-2 bg-slate-100 rounded-lg px-3 py-2">
                <span className="text-sm text-slate-600">Total:</span>
                <span className="font-bold text-lg text-slate-800">{grandTotal}</span>
              </div>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search by name, email, phone, profession..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Data Table Card */}
        <Card>
          <CardContent className="p-0">
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 hover:bg-slate-50">
                    <TableHead className="text-xs font-semibold uppercase">Name</TableHead>
                    <TableHead className="text-xs font-semibold uppercase">Gender</TableHead>
                    <TableHead className="text-xs font-semibold uppercase">Email</TableHead>
                    <TableHead className="text-xs font-semibold uppercase">Auth Key</TableHead>
                    <TableHead className="text-xs font-semibold uppercase">Phone</TableHead>
                    <TableHead className="text-xs font-semibold uppercase">Profession</TableHead>
                    <TableHead className="text-xs font-semibold uppercase">Account Status</TableHead>
                    <TableHead className="text-xs font-semibold uppercase text-right">Options</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                      <TableRow key={i}>
                        {Array.from({ length: 8 }).map((_, j) => (
                          <TableCell key={j}>
                            <Skeleton className="h-4 w-full" />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : parents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-12">
                        <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
                        <p className="text-slate-400">No parents found</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    parents.map((p) => (
                      <TableRow key={p.parent_id} className="hover:bg-slate-50/50">
                        {/* Name */}
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                              {(p.name || '?').charAt(0)}
                            </div>
                            <div>
                              <p className="font-medium text-sm">{p.name}</p>
                              <p className="text-xs text-slate-400">
                                {p.children_count > 0 && `${p.children_count} child(ren)`}
                              </p>
                            </div>
                          </div>
                        </TableCell>

                        {/* Gender */}
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              p.guardian_gender === 'Male'
                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                : p.guardian_gender === 'Female'
                                  ? 'bg-pink-50 text-pink-700 border-pink-200'
                                  : ''
                            }
                          >
                            {p.guardian_gender || '—'}
                          </Badge>
                        </TableCell>

                        {/* Email */}
                        <TableCell>
                          <a
                            href={`mailto:${p.email}`}
                            className="text-sm text-blue-600 hover:underline"
                          >
                            {p.email || '—'}
                          </a>
                        </TableCell>

                        {/* Auth Key */}
                        <TableCell>
                          {p.authentication_key ? (
                            <div className="flex items-center gap-1">
                              <code
                                className="text-xs font-bold tracking-widest bg-slate-100 px-2 py-0.5 rounded cursor-pointer hover:bg-slate-200 transition-colors"
                                onClick={() => copyAuthKey(p.authentication_key)}
                                title="Click to copy"
                              >
                                {p.authentication_key}
                              </code>
                              <Copy className="w-3 h-3 text-slate-400 cursor-pointer" />
                            </div>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </TableCell>

                        {/* Phone */}
                        <TableCell className="text-sm">{p.phone || '—'}</TableCell>

                        {/* Profession */}
                        <TableCell className="text-sm">{p.profession || '—'}</TableCell>

                        {/* Account Status */}
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className={
                                  p.block_limit >= 3
                                    ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                                    : 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                                }
                              >
                                {p.block_limit >= 3 ? (
                                  <>
                                    <Lock className="w-3 h-3 mr-1" />
                                    Blocked
                                  </>
                                ) : (
                                  <>
                                    <UserCheck className="w-3 h-3 mr-1" />
                                    Active
                                  </>
                                )}
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start">
                              <DropdownMenuLabel>Account Status</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              {p.block_limit >= 3 ? (
                                <DropdownMenuItem
                                  onClick={() => confirmBlock(p, 'unblock')}
                                  className="text-green-700 focus:text-green-700"
                                >
                                  <Unlock className="w-4 h-4 mr-2" />
                                  Unblock Account
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem
                                  onClick={() => confirmBlock(p, 'block')}
                                  className="text-red-700 focus:text-red-700"
                                >
                                  <Lock className="w-4 h-4 mr-2" />
                                  Block Account
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>

                        {/* Options */}
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => openView(p)}>
                                <Users className="w-4 h-4 mr-2" />
                                View Profile
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => openEditForm(p)}
                                className="text-green-700 focus:text-green-700"
                              >
                                <Pencil className="w-4 h-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => confirmDelete(p)}
                                className="text-red-600 focus:text-red-600"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
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

            {/* Mobile Card Layout */}
            <div className="md:hidden divide-y">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="p-4 space-y-3">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                ))
              ) : parents.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-slate-400">No parents found</p>
                </div>
              ) : (
                parents.map((p) => (
                  <div key={p.parent_id} className="p-4 space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-xs font-bold">
                          {(p.name || '?').charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{p.name}</p>
                          <p className="text-xs text-slate-400">
                            {p.profession || p.phone || '—'}
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className={
                          p.block_limit >= 3
                            ? 'bg-red-50 text-red-700 border-red-200'
                            : 'bg-green-50 text-green-700 border-green-200'
                        }
                      >
                        {p.block_limit >= 3 ? 'Blocked' : 'Active'}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-1 text-xs text-slate-500">
                      <span>{p.email || 'No email'}</span>
                      <span className="text-right">
                        {p.authentication_key && (
                          <code
                            className="bg-slate-100 px-1.5 py-0.5 rounded cursor-pointer"
                            onClick={() => copyAuthKey(p.authentication_key)}
                          >
                            {p.authentication_key}
                          </code>
                        )}
                      </span>
                    </div>
                    {p.children_count > 0 && (
                      <p className="text-xs text-slate-400">{p.children_count} child(ren)</p>
                    )}
                    <div className="flex gap-2 pt-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 h-8 text-xs"
                        onClick={() => openView(p)}
                      >
                        <Users className="w-3 h-3 mr-1" /> View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs text-green-700 border-green-300"
                        onClick={() => openEditForm(p)}
                      >
                        <Pencil className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs text-red-600 border-red-300"
                        onClick={() => confirmDelete(p)}
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
              <div className="flex items-center justify-between px-4 py-3 border-t">
                <p className="text-xs text-slate-500">
                  Showing {(page - 1) * pageSize + 1}–
                  {Math.min(page * pageSize, totalRecords)} of {totalRecords}
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
                  {getPageNumbers().map((pg, idx) =>
                    typeof pg === 'string' ? (
                      <span key={`ellipsis-${idx}`} className="px-1 text-xs text-slate-400">
                        ...
                      </span>
                    ) : (
                      <Button
                        key={pg}
                        variant={page === pg ? 'default' : 'outline'}
                        size="icon"
                        className={`h-8 w-8 ${page === pg ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
                        onClick={() => setPage(pg)}
                      >
                        {pg}
                      </Button>
                    )
                  )}
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
          </CardContent>
        </Card>
      </div>

      {/* ─── Add/Edit Parent Dialog ─────────────────── */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Parent' : 'Add New Parent'}</DialogTitle>
            <DialogDescription>
              {editing
                ? 'Update the parent/guardian information below.'
                : 'Fill in the details to register a new parent/guardian.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* Name */}
            <div>
              <Label className="text-sm font-medium">
                Name <span className="text-red-500">*</span>
              </Label>
              <Input
                placeholder="Enter full name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-1"
              />
            </div>

            {/* Guardian Gender */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm font-medium">Guardian Gender</Label>
                <Select
                  value={formData.guardian_gender}
                  onValueChange={(v) => setFormData({ ...formData, guardian_gender: v })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Guardian Is The (edit only) */}
              {editing && (
                <div>
                  <Label className="text-sm font-medium">Guardian Is The</Label>
                  <Select
                    value={formData.guardian_is_the}
                    onValueChange={(v) => setFormData({ ...formData, guardian_is_the: v })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mother">Mother</SelectItem>
                      <SelectItem value="father">Father</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* Email & Phone */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm font-medium">Email</Label>
                <Input
                  type="email"
                  placeholder="email@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-sm font-medium">Phone</Label>
                <Input
                  type="tel"
                  placeholder="Phone number"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="mt-1"
                />
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
                  className="mt-1"
                />
                <p className="text-xs text-slate-400 mt-1">
                  Default password: 123456
                </p>
              </div>
            )}

            {/* Address */}
            <div>
              <Label className="text-sm font-medium">Address</Label>
              <Input
                placeholder="Home address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="mt-1"
              />
            </div>

            {/* Profession */}
            <div>
              <Label className="text-sm font-medium">Profession</Label>
              <Input
                placeholder="e.g. Teacher, Nurse, Trader"
                value={formData.profession}
                onChange={(e) => setFormData({ ...formData, profession: e.target.value })}
                className="mt-1"
              />
            </div>

            <Separator />

            {/* PTA Executive */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="is_executive"
                  checked={formData.isExecutive}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isExecutive: !!checked, designation: !checked ? '' : formData.designation })
                  }
                />
                <Label htmlFor="is_executive" className="text-sm font-medium cursor-pointer">
                  A PTA Executive
                </Label>
                <span className={formData.isExecutive ? 'text-green-600 font-bold text-sm' : 'text-slate-400 text-sm'}>
                  {formData.isExecutive ? 'YES' : 'NO'}
                </span>
              </div>

              {/* Designation (conditional) */}
              {formData.isExecutive && (
                <div>
                  <Label className="text-sm font-medium">
                    Designation <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    placeholder="e.g. PTA Chairman"
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    className="mt-1"
                  />
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={formSaving || !formData.name.trim()}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {formSaving
                ? 'Processing...'
                : editing
                  ? 'Update'
                  : 'Add Parent'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── View Profile Dialog ──────────────────────── */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Parent Profile</DialogTitle>
          </DialogHeader>
          {viewLoading ? (
            <div className="space-y-3 py-4">
              <Skeleton className="h-20 w-20 mx-auto rounded-full" />
              <Skeleton className="h-6 w-3/4 mx-auto" />
              <Skeleton className="h-4 w-1/2 mx-auto" />
              <div className="grid grid-cols-2 gap-3 mt-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            </div>
          ) : viewParent ? (
            <div className="space-y-4">
              {/* Avatar & Name */}
              <div className="text-center pb-4 border-b">
                <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full mx-auto flex items-center justify-center mb-3 text-white text-2xl font-bold">
                  {(viewParent.name || '?').charAt(0)}
                </div>
                <h3 className="font-bold text-lg text-slate-900">{viewParent.name}</h3>
                <p className="text-sm text-slate-500">
                  {viewParent.profession && viewParent.profession}
                  {viewParent.profession && viewParent.designation ? ' • ' : ''}
                  {viewParent.designation && (
                    <Badge variant="outline" className="ml-1 text-xs">
                      {viewParent.designation}
                    </Badge>
                  )}
                </p>
                <div className="flex items-center justify-center gap-2 mt-1">
                  <Badge
                    variant="outline"
                    className={
                      viewParent.block_limit >= 3
                        ? 'bg-red-50 text-red-700 border-red-200'
                        : 'bg-green-50 text-green-700 border-green-200'
                    }
                  >
                    {viewParent.block_limit >= 3 ? 'Blocked' : 'Active'}
                  </Badge>
                  {viewParent.authentication_key && (
                    <code
                      className="text-xs font-bold tracking-widest bg-slate-100 px-2 py-0.5 rounded cursor-pointer hover:bg-slate-200"
                      onClick={() => copyAuthKey(viewParent.authentication_key)}
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
                  <p className="text-sm font-medium">{viewParent.guardian_gender || '—'}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-xs text-slate-400 mb-0.5">Guardian Type</p>
                  <p className="text-sm font-medium capitalize">{viewParent.guardian_is_the || '—'}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-xs text-slate-400 mb-0.5">Email</p>
                  <a href={`mailto:${viewParent.email}`} className="text-sm font-medium text-blue-600 hover:underline">
                    {viewParent.email || '—'}
                  </a>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-xs text-slate-400 mb-0.5">Phone</p>
                  <p className="text-sm font-medium">{viewParent.phone || '—'}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3 col-span-2">
                  <p className="text-xs text-slate-400 mb-0.5">Address</p>
                  <p className="text-sm font-medium">{viewParent.address || '—'}</p>
                </div>
              </div>

              {/* Children List */}
              {(viewParent.enrolls && viewParent.enrolls.length > 0) && (
                <div className="border-t pt-4">
                  <h4 className="text-sm font-semibold text-slate-700 mb-2">
                    Children ({viewParent.enrolls.length})
                  </h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {viewParent.enrolls.map((enr) => (
                      <div
                        key={enr.enroll_id}
                        className="flex items-center gap-2 bg-emerald-50 rounded-lg px-3 py-2"
                      >
                        <div className="w-7 h-7 rounded-full bg-emerald-200 flex items-center justify-center text-emerald-700 text-xs font-bold">
                          {enr.student.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{enr.student.name}</p>
                          <p className="text-xs text-slate-500">
                            {enr.class?.name || ''} {enr.section?.name || ''} • {enr.year}
                          </p>
                        </div>
                        <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded">
                          {enr.student.student_code}
                        </code>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* ─── Delete Confirmation Dialog ──────────────── */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Parent</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deleteTarget?.name}</strong>? This action cannot
              be undone. If this parent has linked children, the deletion will be prevented.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteLoading}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleteLoading ? 'Deleting...' : 'Delete'}
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
              className={
                blockAction === 'block'
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }
            >
              {blockLoading
                ? 'Processing...'
                : blockAction === 'block'
                  ? 'Block Account'
                  : 'Unblock Account'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
