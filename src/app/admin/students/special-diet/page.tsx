'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  Search, ChevronLeft, ChevronRight,
  Utensils, ChevronRight as ArrowRight,
  Eye, Trash2, AlertTriangle, Loader2, GraduationCap,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

// ─── Constants ────────────────────────────────────────────────────────────────
const CLASS_GROUPS = [
  { key: 'CRECHE', label: 'CRECHE' },
  { key: 'NURSERY', label: 'NURSERY' },
  { key: 'KG', label: 'KG' },
  { key: 'BASIC', label: 'BASIC' },
  { key: 'JHS', label: 'JHS' },
];

// ─── Types ────────────────────────────────────────────────────────────────────
interface SpecialDietStudent {
  student_id: number;
  student_code: string;
  name: string;
  sex: string;
  address: string;
  diet_details: string;
  class_id: number;
  class_name: string;
  class_category: string;
  section_id: number;
  section_name: string;
}

// ─── Gender Avatar ────────────────────────────────────────────────────────────
function GenderAvatar({ sex, name }: { sex: string; name: string }) {
  const isFemale = sex?.toLowerCase() === 'female';
  const initial = name?.charAt(0)?.toUpperCase() || '?';
  return (
    <div className={cn(
      'w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shrink-0',
      isFemale ? 'bg-pink-100 text-pink-700' : 'bg-sky-100 text-sky-700'
    )}>
      {initial}
    </div>
  );
}

// ─── Class Category Badge ─────────────────────────────────────────────────────
function ClassCategoryBadge({ category }: { category: string }) {
  const colorMap: Record<string, string> = {
    CRECHE: 'bg-purple-100 text-purple-700 border-purple-200',
    NURSERY: 'bg-cyan-100 text-cyan-700 border-cyan-200',
    KG: 'bg-amber-100 text-amber-700 border-amber-200',
    BASIC: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    JHS: 'bg-rose-100 text-rose-700 border-rose-200',
  };
  const classes = colorMap[category] || 'bg-slate-100 text-slate-700 border-slate-200';
  return (
    <Badge variant="outline" className={cn('text-xs font-semibold', classes)}>
      {category || '—'}
    </Badge>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function SpecialDietPage() {
  // Filter state
  const [classGroup, setClassGroup] = useState('');
  const [search, setSearch] = useState('');
  const debouncedSearch = useRef('');

  // Data state
  const [students, setStudents] = useState<SpecialDietStudent[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalStudents, setTotalStudents] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Remove dialog
  const [removeDialog, setRemoveDialog] = useState<{
    open: boolean;
    studentId: number;
    studentName: string;
  }>({ open: false, studentId: 0, studentName: '' });
  const [removeLoading, setRemoveLoading] = useState(false);

  // ── Fetch students ──
  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (classGroup) params.set('classGroup', classGroup);
      if (debouncedSearch.current) params.set('search', debouncedSearch.current);
      params.set('page', String(page));
      params.set('limit', '50');

      const res = await fetch(`/api/admin/special-diet?${params}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setStudents(data.students || []);
      setTotalStudents(data.total || 0);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load students';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [classGroup, page]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      debouncedSearch.current = search;
      setPage(1);
      fetchStudents();
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  // Reset page when class group changes
  const handleGroupChange = (group: string) => {
    setClassGroup(group === classGroup ? '' : group);
    setPage(1);
  };

  // ── Remove student from special diet ──
  const handleRemove = async () => {
    const { studentId } = removeDialog;
    setRemoveLoading(true);
    try {
      const res = await fetch('/api/admin/special-diet', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: studentId }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast.success(data.message);
      setRemoveDialog(prev => ({ ...prev, open: false }));
      fetchStudents();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to remove student';
      toast.error(message);
    } finally {
      setRemoveLoading(false);
    }
  };

  // ── Render ──
  return (
    <DashboardLayout>
      <div className="space-y-4">
        {/* ─── Page Header ─── */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/admin/students">
                <ChevronLeft className="w-5 h-5" />
              </Link>
            </Button>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <Utensils className="w-5 h-5 text-fuchsia-600" />
                Students on Special Diet
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Students requiring special dietary considerations
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-r from-fuchsia-500 to-rose-500 text-white px-4 py-2 rounded-xl">
              <p className="text-2xl font-bold">{totalStudents}</p>
              <p className="text-xs opacity-90">Total Students</p>
            </div>
          </div>
        </div>

        {/* ─── Filters ─── */}
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

            {/* Search */}
            <div className="relative max-w-md">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search by name, ID, or address..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
          </CardContent>
        </Card>

        {/* ─── Student Table ─── */}
        <Card className="overflow-hidden">
          {/* Loading skeleton */}
          {loading && (
            <div className="p-4 space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full rounded" />
              ))}
            </div>
          )}

          {/* Empty state */}
          {!loading && students.length === 0 && (
            <div className="text-center py-16">
              <Utensils className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p className="font-medium text-slate-400">No Students on Special Diet</p>
              <p className="text-sm text-slate-400 mt-1">
                There are currently no students requiring special dietary considerations.
              </p>
            </div>
          )}

          {/* Desktop Table */}
          {!loading && students.length > 0 && (
            <>
              <div className="hidden lg:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50 hover:bg-slate-50">
                      <TableHead className="text-xs font-semibold text-slate-700">ID No</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-700">Name</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-700">Gender</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-700">Class</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-700">Section</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-700">Diet Details</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-700">Address</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-700 text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map((s) => (
                      <TableRow key={s.student_id} className="hover:bg-slate-50/50">
                        <TableCell className="font-mono text-xs text-slate-600">
                          {s.student_code || '—'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2.5">
                            <GenderAvatar sex={s.sex} name={s.name} />
                            <span className="font-medium text-sm text-slate-900">{s.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm capitalize text-slate-600">
                          {s.sex || '—'}
                        </TableCell>
                        <TableCell>
                          <ClassCategoryBadge category={s.class_category} />
                          <span className="ml-1.5 text-xs text-slate-600">{s.class_name}</span>
                        </TableCell>
                        <TableCell className="text-sm text-slate-600">
                          {s.section_name || '—'}
                        </TableCell>
                        <TableCell className="text-xs text-slate-600 max-w-[200px] truncate">
                          {s.diet_details || (
                            <Badge className="bg-gradient-to-r from-fuchsia-500 to-rose-500 text-white border-0 text-xs">
                              <Utensils className="w-3 h-3 mr-1" /> Special Diet
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-slate-600 max-w-[150px] truncate">
                          {s.address || '—'}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Button variant="ghost" size="sm" className="h-8 text-xs" asChild>
                              <Link href={`/admin/students/${s.student_id}/profile`}>
                                <Eye className="w-3.5 h-3.5 mr-1" /> View
                              </Link>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => setRemoveDialog({
                                open: true,
                                studentId: s.student_id,
                                studentName: s.name,
                              })}
                            >
                              <Trash2 className="w-3.5 h-3.5 mr-1" /> Remove
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Cards */}
              <div className="lg:hidden divide-y">
                {students.map((s) => (
                  <div key={s.student_id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <GenderAvatar sex={s.sex} name={s.name} />
                        <div className="min-w-0">
                          <p className="font-medium text-sm text-slate-900 truncate">{s.name}</p>
                          <p className="font-mono text-xs text-slate-400">{s.student_code || '—'}</p>
                        </div>
                      </div>
                      <Badge className="bg-gradient-to-r from-fuchsia-500 to-rose-500 text-white border-0 text-xs shrink-0">
                        <Utensils className="w-3 h-3 mr-1" /> Special Diet
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 pl-12 text-xs text-slate-500 flex-wrap">
                      <ClassCategoryBadge category={s.class_category} />
                      <span>{s.class_name}</span>
                      <span className="text-slate-300">|</span>
                      <span>{s.section_name || '—'}</span>
                      {s.diet_details && (
                        <>
                          <span className="text-slate-300">|</span>
                          <span className="truncate max-w-[150px]">{s.diet_details}</span>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-2 pl-12 pt-1">
                      <Button variant="outline" size="sm" className="h-7 text-xs" asChild>
                        <Link href={`/admin/students/${s.student_id}/profile`}>
                          <Eye className="w-3 h-3 mr-1" /> View Profile
                        </Link>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs text-red-600 hover:bg-red-50"
                        onClick={() => setRemoveDialog({
                          open: true,
                          studentId: s.student_id,
                          studentName: s.name,
                        })}
                      >
                        <Trash2 className="w-3 h-3 mr-1" /> Remove
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t">
                  <p className="text-xs text-slate-500">
                    Page {page} of {totalPages} ({totalStudents} student(s))
                  </p>
                  <div className="flex items-center gap-1">
                    <Button variant="outline" size="icon" className="h-8 w-8"
                      disabled={page <= 1} onClick={() => setPage(page - 1)}>
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum: number;
                      if (totalPages <= 5) pageNum = i + 1;
                      else if (page <= 3) pageNum = i + 1;
                      else if (page >= totalPages - 2) pageNum = totalPages - 4 + i;
                      else pageNum = page - 2 + i;
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

        {/* ─── Remove Dialog ─── */}
        <Dialog open={removeDialog.open} onOpenChange={(open) => setRemoveDialog(prev => ({ ...prev, open }))}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                Remove from Special Diet
              </DialogTitle>
              <DialogDescription>
                Are you sure you want to remove <strong>{removeDialog.studentName}</strong> from the special diet list?
                Their dietary information will be cleared.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setRemoveDialog(prev => ({ ...prev, open: false }))}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleRemove}
                disabled={removeLoading}
              >
                {removeLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Remove
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
