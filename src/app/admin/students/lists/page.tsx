'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  Search, Download, Users, ChevronLeft, ChevronRight,
  Eye, Pencil, Trash2, UserPlus, MoreHorizontal,
  ArrowUpDown, Lock, Unlock, VolumeX, Volume2,
  Shuffle, Home, FileBarChart, FileText, CreditCard,
  Printer, Copy, Check, BarChart3, GraduationCap,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

// ── Constants ──
const CLASS_GROUPS = [
  { key: 'creche', label: 'CRECHE' },
  { key: 'nursery', label: 'NURSERY' },
  { key: 'kg', label: 'KG' },
  { key: 'basic', label: 'BASIC' },
  { key: 'jhs', label: 'JHS' },
] as const;

// ── Types ──
interface StudentRow {
  enroll_id: number;
  student_id: number;
  student_code: string;
  name: string;
  sex: string;
  authentication_key: string;
  active_status: number;
  phone: string;
  email: string;
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

interface ClassItem {
  class_id: number;
  name: string;
  name_numeric: number;
  category: string;
  sections: { section_id: number; name: string; numeric_name: number }[];
}

interface GenderStats {
  males: number;
  females: number;
  unsetGender: number;
  total: number;
}

// ── Gender avatar helper ──
function GenderAvatar({ sex, name }: { sex: string; name: string }) {
  const isFemale = sex?.toLowerCase() === 'female';
  const initial = name?.charAt(0)?.toUpperCase() || '?';
  return (
    <div className={cn(
      'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0',
      isFemale ? 'bg-pink-100 text-pink-700' : 'bg-sky-100 text-sky-700'
    )}>
      {initial}
    </div>
  );
}

// ── Account status badge ──
function AccountStatusBadge({ activeStatus }: { activeStatus: number }) {
  if (activeStatus === 0) {
    return <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-0">Blocked</Badge>;
  }
  return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-0">Active</Badge>;
}

// ── Main Page ──
export default function StudentInformationPage() {
  // Filter state
  const [classGroup, setClassGroup] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSectionId, setSelectedSectionId] = useState('');
  const [search, setSearch] = useState('');
  const debouncedSearch = useRef('');

  // Data state
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [stats, setStats] = useState<GenderStats>({ males: 0, females: 0, unsetGender: 0, total: 0 });
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Reference data
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [classesLoading, setClassesLoading] = useState(false);

  // Bulk actions
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false);

  // Move students dialog
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const [moveTargetClass, setMoveTargetClass] = useState('');
  const [moveTargetSection, setMoveTargetSection] = useState('');
  const [moveLoading, setMoveLoading] = useState(false);

  // Change residence dialog
  const [residenceDialogOpen, setResidenceDialogOpen] = useState(false);
  const [residenceType, setResidenceType] = useState('');
  const [residenceLoading, setResidenceLoading] = useState(false);

  // Account action confirm dialog
  const [accountActionDialog, setAccountActionDialog] = useState<{
    open: boolean;
    studentId: number;
    studentName: string;
    action: 'block' | 'unblock' | 'mute' | 'unmute';
  }>({ open: false, studentId: 0, studentName: '', action: 'block' });
  const [accountActionLoading, setAccountActionLoading] = useState(false);

  // Single delete dialog
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    studentId: number;
    studentName: string;
  }>({ open: false, studentId: 0, studentName: '' });
  const [deleteLoading, setDeleteLoading] = useState(false);

  // ── Load all classes on mount ──
  useEffect(() => {
    setClassesLoading(true);
    fetch('/api/classes?limit=200')
      .then(r => r.json())
      .then(d => setClasses(Array.isArray(d) ? d : []))
      .catch(() => toast.error('Failed to load classes'))
      .finally(() => setClassesLoading(false));
  }, []);

  // ── Filtered classes by group ──
  const filteredClasses = useMemo(() => {
    if (!classGroup) return classes;
    return classes.filter(c => c.category === classGroup);
  }, [classes, classGroup]);

  // ── Sections for selected class ──
  const filteredSections = useMemo(() => {
    if (!selectedClassId) return [];
    const cls = classes.find(c => c.class_id === parseInt(selectedClassId));
    return cls?.sections || [];
  }, [classes, selectedClassId]);

  // ── Reset filters when group changes ──
  const handleGroupChange = (group: string) => {
    setClassGroup(group === classGroup ? '' : group);
    setSelectedClassId('');
    setSelectedSectionId('');
    setPage(1);
  };

  const handleClassChange = (classId: string) => {
    setSelectedClassId(classId);
    setSelectedSectionId('');
    setPage(1);
  };

  const handleSectionChange = (sectionId: string) => {
    setSelectedSectionId(sectionId);
    setPage(1);
  };

  // ── Fetch students ──
  const fetchStudents = useCallback(async () => {
    if (!selectedClassId) {
      setStudents([]);
      setStats({ males: 0, females: 0, unsetGender: 0, total: 0 });
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('classId', selectedClassId);
      if (selectedSectionId && selectedSectionId !== '__all__') {
        params.set('sectionId', selectedSectionId);
      }
      if (debouncedSearch.current) {
        params.set('search', debouncedSearch.current);
      }
      params.set('page', String(page));
      params.set('limit', '50');

      const res = await fetch(`/api/admin/students?${params}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setStudents(data.students || []);
      setStats(data.stats || { males: 0, females: 0, unsetGender: 0, total: 0 });
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load students');
    } finally {
      setLoading(false);
    }
  }, [selectedClassId, selectedSectionId, page]);

  // Re-fetch when filters or page change
  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      debouncedSearch.current = search;
      if (selectedClassId) {
        setPage(1);
        fetchStudents();
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  // ── Selection handlers ──
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

  // Clear selection when class changes
  useEffect(() => { setSelectedIds(new Set()); }, [selectedClassId, selectedSectionId]);

  // ── Account actions ──
  const handleAccountAction = async () => {
    const { studentId, action, studentName } = accountActionDialog;
    setAccountActionLoading(true);
    try {
      const res = await fetch('/api/admin/students', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, student_id: studentId }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast.success(data.message);
      setAccountActionDialog(prev => ({ ...prev, open: false }));
      fetchStudents();
    } catch (err: any) {
      toast.error(err.message || 'Action failed');
    } finally {
      setAccountActionLoading(false);
    }
  };

  // ── Delete single student ──
  const handleDeleteSingle = async () => {
    const { studentId } = deleteDialog;
    setDeleteLoading(true);
    try {
      const res = await fetch('/api/admin/students', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentIds: [studentId], classId: selectedClassId }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast.success(data.message);
      setDeleteDialog(prev => ({ ...prev, open: false }));
      setSelectedIds(new Set());
      fetchStudents();
    } catch (err: any) {
      toast.error(err.message || 'Delete failed');
    } finally {
      setDeleteLoading(false);
    }
  };

  // ── Bulk delete ──
  const handleBulkDelete = async () => {
    setBulkDeleteLoading(true);
    try {
      const res = await fetch('/api/admin/students', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentIds: Array.from(selectedIds), classId: selectedClassId }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast.success(data.message);
      setBulkDeleteOpen(false);
      setSelectedIds(new Set());
      fetchStudents();
    } catch (err: any) {
      toast.error(err.message || 'Bulk delete failed');
    } finally {
      setBulkDeleteLoading(false);
    }
  };

  // ── Move students ──
  const handleMoveStudents = async () => {
    if (!moveTargetClass) { toast.error('Please select a target class'); return; }
    setMoveLoading(true);
    try {
      const res = await fetch('/api/admin/students', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'move',
          student_ids: Array.from(selectedIds),
          to_class_id: moveTargetClass,
          to_section_id: moveTargetSection || undefined,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast.success(data.message);
      setMoveDialogOpen(false);
      setSelectedIds(new Set());
      fetchStudents();
    } catch (err: any) {
      toast.error(err.message || 'Move failed');
    } finally {
      setMoveLoading(false);
    }
  };

  // ── Change residence ──
  const handleChangeResidence = async () => {
    if (!residenceType) { toast.error('Please select a residence type'); return; }
    setResidenceLoading(true);
    try {
      const res = await fetch('/api/admin/students', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'change_residence',
          student_ids: Array.from(selectedIds),
          residence_type: residenceType,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast.success(data.message);
      setResidenceDialogOpen(false);
      setSelectedIds(new Set());
      fetchStudents();
    } catch (err: any) {
      toast.error(err.message || 'Residence update failed');
    } finally {
      setResidenceLoading(false);
    }
  };

  // ── Export CSV ──
  const handleExportCSV = () => {
    const headers = ['Roll', 'ID No', 'Name', 'Gender', 'Residence', 'Auth Key', 'Status', 'Parent', 'Parent Phone'];
    const rows = students.map(s => [
      s.roll, s.student_code, s.name, s.sex, s.residence_type || '—',
      s.authentication_key, s.active_status === 1 ? 'Active' : 'Blocked',
      s.parent?.name || '—', s.parent?.phone || '—',
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(csv);
    const a = document.createElement('a');
    a.href = url;
    a.download = `student-information-${selectedClassName}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Student list exported as CSV');
  };

  // ── Copy table data ──
  const handleCopyTable = () => {
    const text = students.map(s =>
      `${s.roll}\t${s.student_code}\t${s.name}\t${s.sex}\t${s.residence_type || '—'}\t${s.parent?.name || '—'}`
    ).join('\n');
    navigator.clipboard.writeText(`Roll\tID No\tName\tGender\tResidence\tParent\n${text}`);
    toast.success('Table data copied to clipboard');
  };

  // ── Helpers ──
  const selectedClassName = selectedClassId
    ? classes.find(c => c.class_id === parseInt(selectedClassId))?.name || ''
    : '';

  // ── Render ──
  return (
    <DashboardLayout>
      <div className="space-y-4">
        {/* ─── Page Header ─── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/admin/students"><ChevronLeft className="w-5 h-5" /></Link>
            </Button>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Student Information
                {selectedClassName && (
                  <span className="text-slate-500 font-normal"> — {selectedClassName}</span>
                )}
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                {selectedClassId
                  ? `${stats.total} student(s) enrolled`
                  : 'Select a class to view students'
                }
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {selectedClassId && students.length > 0 && (
              <>
                <Button variant="outline" size="sm" onClick={handleCopyTable}>
                  <Copy className="w-4 h-4 mr-1.5" /> Copy
                </Button>
                <Button variant="outline" size="sm" onClick={handleExportCSV}>
                  <Download className="w-4 h-4 mr-1.5" /> CSV
                </Button>
              </>
            )}
            <Button size="sm" asChild>
              <Link href="/admin/students/new">
                <UserPlus className="w-4 h-4 mr-1.5" /> Admit Student
              </Link>
            </Button>
          </div>
        </div>

        {/* ─── Quick Action Buttons (original CI3 layout) ─── */}
        {selectedClassId && (
          <Card className="border-t-2 border-t-sky-500">
            <CardContent className="p-3">
              {/* Mobile: 2 rows */}
              <div className="grid grid-cols-2 gap-2 md:hidden">
                <Button variant="destructive" className="h-12 text-sm font-bold" asChild>
                  <Link href={`/admin/students/marksheets?classId=${selectedClassId}`}>
                    <BarChart3 className="w-4 h-4 mr-1.5" /> Marksheets
                  </Link>
                </Button>
                <Button variant="destructive" className="h-12 text-sm font-bold" asChild>
                  <Link href={`/admin/reports/broadsheet?classId=${selectedClassId}`}>
                    <BarChart3 className="w-4 h-4 mr-1.5" /> Cummulative
                  </Link>
                </Button>
                <Button variant="default" className="h-12 text-sm font-bold bg-emerald-600 hover:bg-emerald-700" asChild>
                  <Link href={`/admin/invoices?classId=${selectedClassId}`}>
                    <CreditCard className="w-4 h-4 mr-1.5" /> Bills
                  </Link>
                </Button>
                <Button className="h-12 text-sm font-bold" asChild>
                  <Link href="/admin/students/new">
                    <UserPlus className="w-4 h-4 mr-1.5" /> Admit
                  </Link>
                </Button>
                <Button variant="default" className="h-12 text-sm font-bold bg-sky-600 hover:bg-sky-700 col-span-2" asChild>
                  <Link href={`/admin/students/lists/print?classId=${selectedClassId}`}>
                    <Printer className="w-4 h-4 mr-1.5" /> Print Info
                  </Link>
                </Button>
              </div>
              {/* Desktop: 5 columns */}
              <div className="hidden md:grid md:grid-cols-5 gap-2">
                <Button variant="destructive" className="h-14 text-base font-bold">
                  <BarChart3 className="w-5 h-5 mr-2" /> Bulk Marksheets
                </Button>
                <Button variant="default" className="h-14 text-base font-bold bg-emerald-600 hover:bg-emerald-700" asChild>
                  <Link href={`/admin/invoices?classId=${selectedClassId}`}>
                    <CreditCard className="w-5 h-5 mr-2" /> Print Bills
                  </Link>
                </Button>
                <Button className="h-14 text-base font-bold" asChild>
                  <Link href="/admin/students/new">
                    <UserPlus className="w-5 h-5 mr-2" /> Admit Student
                  </Link>
                </Button>
                <Button variant="default" className="h-14 text-base font-bold bg-sky-600 hover:bg-sky-700" asChild>
                  <Link href={`/admin/students/lists/print?classId=${selectedClassId}`}>
                    <Printer className="w-5 h-5 mr-2" /> Print Info
                  </Link>
                </Button>
                <Button variant="default" className="h-14 text-base font-bold bg-emerald-600 hover:bg-emerald-700" asChild>
                  <Link href={`/admin/reports/broadsheet?classId=${selectedClassId}`}>
                    <BarChart3 className="w-5 h-5 mr-2" /> Cumulative Reports
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ─── Class Group Navigation + Filters ─── */}
        <Card>
          <CardContent className="p-4 space-y-3">
            {/* Class Group Tabs */}
            <div className="flex flex-wrap gap-2">
              {CLASS_GROUPS.map(g => (
                <Button
                  key={g.key}
                  variant={classGroup === g.key ? 'default' : 'outline'}
                  size="sm"
                  className="text-xs font-semibold"
                  onClick={() => handleGroupChange(g.key)}
                >
                  {g.label}
                </Button>
              ))}
            </div>

            {/* Class + Section Selectors + Search */}
            <div className="flex flex-col sm:flex-row gap-2">
              <Select value={selectedClassId} onValueChange={handleClassChange}>
                <SelectTrigger className="sm:w-48">
                  <SelectValue placeholder={classesLoading ? 'Loading...' : 'Select class'} />
                </SelectTrigger>
                <SelectContent>
                  {filteredClasses.map(c => (
                    <SelectItem key={c.class_id} value={String(c.class_id)}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedSectionId} onValueChange={handleSectionChange}>
                <SelectTrigger className="sm:w-40">
                  <SelectValue placeholder="Section" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All Sections</SelectItem>
                  {filteredSections.map(s => (
                    <SelectItem key={s.section_id} value={String(s.section_id)}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedClassId && (
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Search student..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="pl-9 h-9"
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* ─── Gender Statistics Bar ─── */}
        {selectedClassId && !loading && (
          <Card className="bg-slate-50">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 sm:divide-x sm:divide-white">
                <div className="flex items-center justify-between sm:justify-start gap-2">
                  <span className="text-slate-500 text-sm font-semibold">TOTAL MALES:</span>
                  <span className="font-bold text-lg">{stats.males}</span>
                </div>
                <div className="flex items-center justify-between sm:justify-start gap-2">
                  <span className="text-slate-500 text-sm font-semibold">TOTAL FEMALES:</span>
                  <span className="font-bold text-lg">{stats.females}</span>
                </div>
                <div className="flex items-center justify-between sm:justify-start gap-2">
                  <span className="text-slate-500 text-sm font-semibold">UNSET GENDER:</span>
                  <span className="font-bold text-lg">{stats.unsetGender}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ─── No class selected state ─── */}
        {!selectedClassId && (
          <Card>
            <CardContent className="text-center py-16">
              <Users className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p className="font-medium text-slate-400">Select a class to view students</p>
              <p className="text-sm text-slate-400 mt-1">Choose a class group and class from the filters above</p>
            </CardContent>
          </Card>
        )}

        {/* ─── Student Data Table ─── */}
        {selectedClassId && (
          <Card className="overflow-hidden">
            {/* Loading skeleton */}
            {loading && (
              <div className="p-4 space-y-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full rounded" />
                ))}
              </div>
            )}

            {/* Empty state */}
            {!loading && students.length === 0 && (
              <div className="text-center py-16">
                <GraduationCap className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p className="font-medium text-slate-400">No students found</p>
                <p className="text-sm text-slate-400 mt-1">No students enrolled in this class</p>
              </div>
            )}

            {/* Desktop Table */}
            {!loading && students.length > 0 && (
              <>
                <div className="hidden lg:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50 hover:bg-slate-50">
                        <TableHead className="w-10 px-3">
                          <Checkbox
                            checked={selectedIds.size === students.length && students.length > 0}
                            onCheckedChange={toggleSelectAll}
                          />
                        </TableHead>
                        <TableHead className="text-xs font-semibold text-slate-700">ID No</TableHead>
                        <TableHead className="text-xs font-semibold text-slate-700">Name</TableHead>
                        <TableHead className="text-xs font-semibold text-slate-700">Gender</TableHead>
                        <TableHead className="text-xs font-semibold text-slate-700">Residence</TableHead>
                        <TableHead className="text-xs font-semibold text-slate-700 text-center">Auth Key</TableHead>
                        <TableHead className="text-xs font-semibold text-slate-700 text-center">Status</TableHead>
                        <TableHead className="text-xs font-semibold text-slate-700 text-center">Options</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {students.map((s) => (
                        <TableRow key={s.enroll_id} className="hover:bg-slate-50/50">
                          {/* Checkbox */}
                          <TableCell className="px-3">
                            <Checkbox
                              checked={selectedIds.has(s.student_id)}
                              onCheckedChange={() => toggleSelect(s.student_id)}
                            />
                          </TableCell>

                          {/* ID No */}
                          <TableCell className="font-mono text-xs text-slate-600">
                            {s.student_code || '—'}
                          </TableCell>

                          {/* Name + Avatar */}
                          <TableCell>
                            <div className="flex items-center gap-2.5">
                              <GenderAvatar sex={s.sex} name={s.name} />
                              <div>
                                <p className="font-medium text-sm text-slate-900">{s.name}</p>
                              </div>
                            </div>
                          </TableCell>

                          {/* Gender */}
                          <TableCell className="text-sm capitalize text-slate-600">
                            {s.sex || '—'}
                          </TableCell>

                          {/* Residence Type */}
                          <TableCell className="text-sm text-slate-600">
                            {s.residence_type ? (
                              <Badge variant="outline" className="text-xs capitalize">{s.residence_type}</Badge>
                            ) : '—'}
                          </TableCell>

                          {/* Auth Key */}
                          <TableCell className="text-center">
                            <span className="font-mono text-xs tracking-widest font-bold text-slate-600">
                              {s.authentication_key || '—'}
                            </span>
                          </TableCell>

                          {/* Account Status */}
                          <TableCell className="text-center">
                            <AccountStatusBadge activeStatus={s.active_status} />
                          </TableCell>

                          {/* Options */}
                          <TableCell className="text-center">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="w-4 h-4" />
                                  <span className="sr-only">Options</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem asChild>
                                  <Link href={`/admin/students/marksheets?studentId=${s.student_id}`}>
                                    <BarChart3 className="w-4 h-4 mr-2" /> Mark Sheet
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                  <Link href={`/admin/sms?studentId=${s.student_id}`}>
                                    <FileText className="w-4 h-4 mr-2" /> Send SMS
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild>
                                  <Link href={`/admin/students/${s.student_id}/profile`}>
                                    <Eye className="w-4 h-4 mr-2 text-blue-600" />
                                    <span className="text-blue-600">Profile</span>
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                  <Link href={`/admin/students/${s.student_id}/edit`}>
                                    <Pencil className="w-4 h-4 mr-2 text-emerald-600" />
                                    <span className="text-emerald-600">Edit</span>
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                  <Link href={`/admin/students/${s.student_id}/id-card`}>
                                    <FileText className="w-4 h-4 mr-2 text-purple-600" />
                                    <span className="text-purple-600">Generate ID</span>
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                {/* Account status actions */}
                                {s.active_status === 1 ? (
                                  <DropdownMenuItem
                                    onClick={() => setAccountActionDialog({
                                      open: true, studentId: s.student_id, studentName: s.name, action: 'block',
                                    })}
                                  >
                                    <Lock className="w-4 h-4 mr-2 text-red-600" />
                                    <span className="text-red-600">Block Account</span>
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem
                                    onClick={() => setAccountActionDialog({
                                      open: true, studentId: s.student_id, studentName: s.name, action: 'unblock',
                                    })}
                                  >
                                    <Unlock className="w-4 h-4 mr-2 text-emerald-600" />
                                    <span className="text-emerald-600">Unblock Account</span>
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => setDeleteDialog({
                                    open: true, studentId: s.student_id, studentName: s.name,
                                  })}
                                  className="text-red-600 focus:text-red-600"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" /> Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile Cards */}
                <div className="lg:hidden divide-y">
                  {students.map((s) => (
                    <div key={s.enroll_id} className="p-3 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Checkbox
                            checked={selectedIds.has(s.student_id)}
                            onCheckedChange={() => toggleSelect(s.student_id)}
                          />
                          <GenderAvatar sex={s.sex} name={s.name} />
                          <div className="min-w-0">
                            <p className="font-medium text-sm text-slate-900 truncate">{s.name}</p>
                            <p className="font-mono text-xs text-slate-400">{s.student_code || '—'}</p>
                          </div>
                        </div>
                        <AccountStatusBadge activeStatus={s.active_status} />
                      </div>
                      <div className="flex items-center gap-3 pl-9 text-xs text-slate-500">
                        <span className="capitalize">{s.sex}</span>
                        {s.residence_type && (
                          <>
                            <span className="text-slate-300">|</span>
                            <span className="capitalize">{s.residence_type}</span>
                          </>
                        )}
                        {s.authentication_key && (
                          <>
                            <span className="text-slate-300">|</span>
                            <span className="font-mono tracking-wider">{s.authentication_key}</span>
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-2 pl-9 pt-1">
                        <Button variant="outline" size="sm" className="h-7 text-xs" asChild>
                          <Link href={`/admin/students/${s.student_id}/profile`}>
                            <Eye className="w-3 h-3 mr-1" /> Profile
                          </Link>
                        </Button>
                        <Button variant="outline" size="sm" className="h-7 text-xs" asChild>
                          <Link href={`/admin/students/${s.student_id}/edit`}>
                            <Pencil className="w-3 h-3 mr-1" /> Edit
                          </Link>
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="h-7 text-xs">
                              <MoreHorizontal className="w-3 h-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/students/marksheets?studentId=${s.student_id}`}>
                                <BarChart3 className="w-3.5 h-3.5 mr-2" /> Mark Sheet
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/sms?studentId=${s.student_id}`}>
                                <FileText className="w-3.5 h-3.5 mr-2" /> SMS
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/students/${s.student_id}/id-card`}>
                                <FileText className="w-3.5 h-3.5 mr-2 text-purple-600" />
                                <span className="text-purple-600">Generate ID</span>
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {s.active_status === 1 ? (
                              <DropdownMenuItem
                                onClick={() => setAccountActionDialog({
                                  open: true, studentId: s.student_id, studentName: s.name, action: 'block',
                                })}
                                className="text-red-600"
                              >
                                <Lock className="w-3.5 h-3.5 mr-2" /> Block
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                onClick={() => setAccountActionDialog({
                                  open: true, studentId: s.student_id, studentName: s.name, action: 'unblock',
                                })}
                                className="text-emerald-600"
                              >
                                <Unlock className="w-3.5 h-3.5 mr-2" /> Unblock
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => setDeleteDialog({
                                open: true, studentId: s.student_id, studentName: s.name,
                              })}
                              className="text-red-600 focus:text-red-600"
                            >
                              <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-4 py-3 border-t">
                    <p className="text-xs text-slate-500">
                      Page {page} of {totalPages} ({stats.total} student(s))
                    </p>
                    <div className="flex items-center gap-1">
                      <Button variant="outline" size="icon" className="h-8 w-8"
                        disabled={page <= 1} onClick={() => setPage(page - 1)}>
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum: number;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (page <= 3) {
                          pageNum = i + 1;
                        } else if (page >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = page - 2 + i;
                        }
                        return (
                          <Button key={pageNum} variant={page === pageNum ? 'default' : 'outline'}
                            size="icon" className="h-8 w-8" onClick={() => setPage(pageNum)}>
                            {pageNum}
                          </Button>
                        );
                      })}
                      <Button variant="outline" size="icon" className="h-8 w-8"
                        disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </Card>
        )}

        {/* ─── Bulk Action Bar (fixed bottom, appears when items selected) ─── */}
        {selectedIds.size > 0 && (
          <div className="fixed bottom-16 md:bottom-0 left-0 right-0 z-50 md:left-64 md:right-0 transition-transform duration-300">
            <div className="bg-[#522b76] mx-2 md:mx-0 rounded-t-lg shadow-2xl">
              <div className="px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 rounded-full p-2">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  <div className="text-white">
                    <p className="text-xs opacity-80">Selected</p>
                    <p className="text-xl font-bold">{selectedIds.size}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap justify-center">
                  <Button
                    variant="ghost"
                    className="bg-white text-purple-700 hover:bg-slate-100 font-semibold text-sm"
                    onClick={() => setMoveDialogOpen(true)}
                  >
                    <Shuffle className="w-4 h-4 mr-1.5" /> Move Students
                  </Button>
                  <Button
                    variant="ghost"
                    className="bg-white text-purple-700 hover:bg-slate-100 font-semibold text-sm"
                    onClick={() => setResidenceDialogOpen(true)}
                  >
                    <Home className="w-4 h-4 mr-1.5" /> Change Residence
                  </Button>
                  <Button
                    variant="ghost"
                    className="bg-red-500 text-white hover:bg-red-600 font-semibold text-sm"
                    onClick={() => setBulkDeleteOpen(true)}
                  >
                    <Trash2 className="w-4 h-4 mr-1.5" /> Delete Selected
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ─── Dialogs ─── */}

      {/* Single Student Delete Confirmation */}
      <Dialog open={deleteDialog.open} onOpenChange={o => setDeleteDialog(prev => ({ ...prev, open: o }))}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogDescription>
              Are you sure you want to permanently delete <strong>{deleteDialog.studentName}</strong>?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteDialog(prev => ({ ...prev, open: false }))}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteSingle} disabled={deleteLoading}>
              {deleteLoading ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Confirmation */}
      <Dialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirm Bulk Delete</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{selectedIds.size}</strong> selected student(s)?
              This action is irreversible!
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setBulkDeleteOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleBulkDelete} disabled={bulkDeleteLoading}>
              {bulkDeleteLoading ? 'Deleting...' : 'Delete Selected'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Account Action Confirmation */}
      <Dialog open={accountActionDialog.open} onOpenChange={o => setAccountActionDialog(prev => ({ ...prev, open: o }))}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {accountActionDialog.action === 'block' && 'Block Student Account'}
              {accountActionDialog.action === 'unblock' && 'Unblock Student Account'}
              {accountActionDialog.action === 'mute' && 'Mute Student Account'}
              {accountActionDialog.action === 'unmute' && 'Unmute Student Account'}
            </DialogTitle>
            <DialogDescription>
              {accountActionDialog.action === 'block' && `Are you sure you want to block ${accountActionDialog.studentName}'s account?`}
              {accountActionDialog.action === 'unblock' && `Are you sure you want to unblock ${accountActionDialog.studentName}'s account?`}
              {accountActionDialog.action === 'mute' && `Are you sure you want to mute ${accountActionDialog.studentName}'s account?`}
              {accountActionDialog.action === 'unmute' && `Are you sure you want to unmute ${accountActionDialog.studentName}'s account?`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setAccountActionDialog(prev => ({ ...prev, open: false }))}>
              Cancel
            </Button>
            <Button
              onClick={handleAccountAction}
              disabled={accountActionLoading}
              variant={accountActionDialog.action === 'unblock' || accountActionDialog.action === 'unmute' ? 'default' : 'destructive'}
              className={accountActionDialog.action === 'unblock' || accountActionDialog.action === 'unmute' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
            >
              {accountActionLoading ? 'Processing...' : accountActionDialog.action.charAt(0).toUpperCase() + accountActionDialog.action.slice(1)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Move Students Dialog */}
      <Dialog open={moveDialogOpen} onOpenChange={setMoveDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Move {selectedIds.size} Student(s)</DialogTitle>
            <DialogDescription>
              Select the target class and section to move the selected students to.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Target Class *</Label>
              <Select value={moveTargetClass} onValueChange={setMoveTargetClass}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map(c => (
                    <SelectItem key={c.class_id} value={String(c.class_id)}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {moveTargetClass && (
              <div>
                <Label className="text-xs">Target Section</Label>
                <Select value={moveTargetSection} onValueChange={setMoveTargetSection}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select section" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.find(c => c.class_id === parseInt(moveTargetClass))?.sections.map(s => (
                      <SelectItem key={s.section_id} value={String(s.section_id)}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setMoveDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleMoveStudents} disabled={moveLoading || !moveTargetClass}>
              {moveLoading ? 'Moving...' : 'Move Students'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Residence Dialog */}
      <Dialog open={residenceDialogOpen} onOpenChange={setResidenceDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Change Residence Type</DialogTitle>
            <DialogDescription>
              Update the residence type for {selectedIds.size} selected student(s).
            </DialogDescription>
          </DialogHeader>
          <div>
            <Label className="text-xs">Residence Type *</Label>
            <Select value={residenceType} onValueChange={setResidenceType}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Day">Day Student</SelectItem>
                <SelectItem value="Boarder">Boarder</SelectItem>
                <SelectItem value="Semi-Boarder">Semi-Boarder</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setResidenceDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleChangeResidence} disabled={residenceLoading || !residenceType}>
              {residenceLoading ? 'Updating...' : 'Update'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
