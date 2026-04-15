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
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  Search, ChevronLeft, ChevronRight,
  VolumeX, Volume2, Eye, Loader2,
  Lock, Unlock, AlertTriangle,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────
interface MutedStudent {
  student_id: number;
  student_code: string;
  name: string;
  sex: string;
  address: string;
  email: string;
  phone: string;
  active_status: number;
  mute: number;
  class_id: number | null;
  class_name: string;
  class_category: string;
  section_id: number | null;
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

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ student }: { student: MutedStudent }) {
  if (student.active_status === 0 && student.mute === 1) {
    return (
      <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-0 text-xs font-semibold">
        <Lock className="w-3 h-3 mr-1" /> Blocked & Muted
      </Badge>
    );
  }
  return (
    <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-0 text-xs font-semibold">
      <VolumeX className="w-3 h-3 mr-1" /> Muted
    </Badge>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function MutedStudentsPage() {
  // Filter state
  const [search, setSearch] = useState('');
  const debouncedSearch = useRef('');

  // Data state
  const [students, setStudents] = useState<MutedStudent[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalStudents, setTotalStudents] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Action dialog
  const [actionDialog, setActionDialog] = useState<{
    open: boolean;
    studentId: number;
    studentName: string;
    action: 'unmute' | 'unblock';
  }>({ open: false, studentId: 0, studentName: '', action: 'unmute' });
  const [actionLoading, setActionLoading] = useState(false);

  // ── Fetch students ──
  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (debouncedSearch.current) params.set('search', debouncedSearch.current);
      params.set('page', String(page));
      params.set('limit', '50');

      const res = await fetch(`/api/admin/muted-students?${params}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setStudents(data.students || []);
      setTotalStudents(data.total || 0);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load muted students';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [page]);

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

  // ── Handle action (unmute/unblock) ──
  const handleAction = async () => {
    const { studentId, action, studentName } = actionDialog;
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/muted-students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: studentId, action }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      const actionLabel = action === 'unmute' ? 'unmuted' : 'unblocked';
      toast.success(`${studentName} ${actionLabel} successfully`);
      setActionDialog(prev => ({ ...prev, open: false }));
      fetchStudents();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Operation failed';
      toast.error(message);
    } finally {
      setActionLoading(false);
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
                <VolumeX className="w-5 h-5 text-slate-600" />
                Muted / Inactive Students
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Students who are currently muted or inactive
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-r from-slate-500 to-slate-600 text-white px-4 py-2 rounded-xl text-center">
              <p className="text-2xl font-bold">{totalStudents}</p>
              <p className="text-xs opacity-90">Total Muted</p>
            </div>
          </div>
        </div>

        {/* ─── Search ─── */}
        <Card>
          <CardContent className="p-4">
            <div className="relative max-w-md">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search by name, ID, class, or email..."
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
              <Volume2 className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p className="font-medium text-slate-400">No Muted Students</p>
              <p className="text-sm text-slate-400 mt-1">
                Great! There are currently no muted or inactive students.
              </p>
            </div>
          )}

          {/* No search results state */}
          {!loading && students.length === 0 && search && (
            <div className="text-center py-16">
              <Search className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p className="font-medium text-slate-400">No Results Found</p>
              <p className="text-sm text-slate-400 mt-1">Try adjusting your search terms.</p>
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
                      <TableHead className="text-xs font-semibold text-slate-700">Email</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-700 text-center">Status</TableHead>
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
                        <TableCell className="text-sm text-slate-600">
                          {s.class_name}
                        </TableCell>
                        <TableCell className="text-sm text-slate-600">
                          {s.section_name}
                        </TableCell>
                        <TableCell className="text-xs text-slate-600">
                          {s.email || '—'}
                        </TableCell>
                        <TableCell className="text-center">
                          <StatusBadge student={s} />
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            {/* Unmute button */}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                              onClick={() => setActionDialog({
                                open: true,
                                studentId: s.student_id,
                                studentName: s.name,
                                action: 'unmute',
                              })}
                            >
                              <Volume2 className="w-3.5 h-3.5 mr-1" /> Unmute
                            </Button>

                            {/* Unblock button (only if blocked) */}
                            {s.active_status === 0 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 text-xs text-violet-600 hover:text-violet-700 hover:bg-violet-50"
                                onClick={() => setActionDialog({
                                  open: true,
                                  studentId: s.student_id,
                                  studentName: s.name,
                                  action: 'unblock',
                                })}
                              >
                                <Unlock className="w-3.5 h-3.5 mr-1" /> Unblock
                              </Button>
                            )}

                            {/* View profile */}
                            <Button variant="ghost" size="sm" className="h-8 text-xs" asChild>
                              <Link href={`/admin/students/${s.student_id}/profile`}>
                                <Eye className="w-3.5 h-3.5" />
                              </Link>
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
                      <StatusBadge student={s} />
                    </div>
                    <div className="flex items-center gap-3 pl-12 text-xs text-slate-500 flex-wrap">
                      <span>{s.class_name}</span>
                      <span className="text-slate-300">|</span>
                      <span>{s.section_name}</span>
                      {s.email && (
                        <>
                          <span className="text-slate-300">|</span>
                          <span className="truncate max-w-[150px]">{s.email}</span>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-2 pl-12 pt-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs text-emerald-600 hover:bg-emerald-50"
                        onClick={() => setActionDialog({
                          open: true,
                          studentId: s.student_id,
                          studentName: s.name,
                          action: 'unmute',
                        })}
                      >
                        <Volume2 className="w-3 h-3 mr-1" /> Unmute
                      </Button>
                      {s.active_status === 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs text-violet-600 hover:bg-violet-50"
                          onClick={() => setActionDialog({
                            open: true,
                            studentId: s.student_id,
                            studentName: s.name,
                            action: 'unblock',
                          })}
                        >
                          <Unlock className="w-3 h-3 mr-1" /> Unblock
                        </Button>
                      )}
                      <Button variant="outline" size="sm" className="h-7 text-xs" asChild>
                        <Link href={`/admin/students/${s.student_id}/profile`}>
                          <Eye className="w-3 h-3 mr-1" /> View
                        </Link>
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

        {/* ─── Action Confirm Dialog ─── */}
        <Dialog open={actionDialog.open} onOpenChange={(open) => setActionDialog(prev => ({ ...prev, open }))}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {actionDialog.action === 'unmute' ? (
                  <>
                    <Volume2 className="w-5 h-5 text-emerald-600" />
                    Confirm Unmute
                  </>
                ) : (
                  <>
                    <Unlock className="w-5 h-5 text-violet-600" />
                    Confirm Unblock
                  </>
                )}
              </DialogTitle>
              <DialogDescription>
                Are you sure you want to {actionDialog.action}{' '}
                <strong>{actionDialog.studentName}</strong>?
                {actionDialog.action === 'unmute' &&
                  ' This will restore their ability to participate in all activities.'}
                {actionDialog.action === 'unblock' &&
                  ' This will reactivate their account and restore full access.'}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setActionDialog(prev => ({ ...prev, open: false }))}>
                Cancel
              </Button>
              <Button
                className={actionDialog.action === 'unmute'
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-violet-600 hover:bg-violet-700 text-white'
                }
                onClick={handleAction}
                disabled={actionLoading}
              >
                {actionLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {actionDialog.action === 'unmute' ? 'Unmute' : 'Unblock'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
