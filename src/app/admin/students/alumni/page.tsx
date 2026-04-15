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
  Search, ChevronLeft, ChevronRight,
  GraduationCap, Eye, UserPlus,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { toast } from 'sonner';

// ─── Types ────────────────────────────────────────────────────────────────────
interface AlumniStudent {
  alumni_id: number;
  student_id: number | null;
  name: string;
  email: string;
  phone: string;
  address: string;
  graduation_year: string;
  current_occupation: string;
  is_active: number;
  created_at: string | null;
}

// ─── Account Status Badge ─────────────────────────────────────────────────────
function AccountStatusBadge({ active }: { active: number }) {
  if (active === 0) {
    return <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-0">Inactive</Badge>;
  }
  return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-0">Active</Badge>;
}

// ─── Occupation Badge ─────────────────────────────────────────────────────────
function OccupationBadge({ occupation }: { occupation: string }) {
  if (!occupation) {
    return <span className="text-xs text-slate-400">—</span>;
  }
  return (
    <Badge variant="outline" className="text-xs font-normal text-slate-600">
      {occupation}
    </Badge>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AlumniPage() {
  // Filter state
  const [search, setSearch] = useState('');
  const [yearBatch, setYearBatch] = useState('');
  const debouncedSearch = useRef('');

  // Data state
  const [students, setStudents] = useState<AlumniStudent[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalStudents, setTotalStudents] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Filter options
  const [availableYears, setAvailableYears] = useState<string[]>([]);

  // ── Fetch students ──
  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (debouncedSearch.current) params.set('search', debouncedSearch.current);
      if (yearBatch) params.set('yearBatch', yearBatch);
      params.set('page', String(page));
      params.set('limit', '50');

      const res = await fetch(`/api/admin/alumni?${params}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setStudents(data.students || []);
      setTotalStudents(data.total || 0);
      setTotalPages(data.pagination?.totalPages || 1);

      // Set available filter years from first load
      if (data.filters?.years) {
        setAvailableYears(data.filters.years);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load alumni';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [page, yearBatch]);

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

  const handleYearChange = (year: string) => {
    setYearBatch(year === '__all__' ? '' : year);
    setPage(1);
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
                <GraduationCap className="w-5 h-5 text-amber-600" />
                Alumni / Old Students
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                View graduated and former students
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-2 rounded-xl text-center">
              <p className="text-2xl font-bold">{totalStudents}</p>
              <p className="text-xs opacity-90">Total Alumni</p>
            </div>
          </div>
        </div>

        {/* ─── Filters ─── */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Year batch filter */}
              <Select value={yearBatch || '__all__'} onValueChange={handleYearChange}>
                <SelectTrigger className="sm:w-48">
                  <SelectValue placeholder="All Years" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All Graduation Years</SelectItem>
                  {availableYears.map(year => (
                    <SelectItem key={year} value={year}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search alumni by name, email, phone..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-9 h-9"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ─── Alumni Table ─── */}
        <Card className="overflow-hidden">
          {/* Loading skeleton */}
          {loading && (
            <div className="p-4 space-y-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full rounded" />
              ))}
            </div>
          )}

          {/* Empty state */}
          {!loading && students.length === 0 && (
            <div className="text-center py-16">
              <GraduationCap className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p className="font-medium text-slate-400">No Alumni Found</p>
              <p className="text-sm text-slate-400 mt-1">
                {search || yearBatch
                  ? 'Try adjusting your search or filter criteria.'
                  : 'There are no alumni records yet.'
                }
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
                      <TableHead className="text-xs font-semibold text-slate-700">Name</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-700">Graduation Year</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-700">Address</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-700 hidden md:table-cell">Email</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-700 hidden md:table-cell">Phone</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-700 hidden xl:table-cell">Occupation</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-700 text-center">Status</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-700 hidden xl:table-cell">Date Added</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-700 text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map((s) => (
                      <TableRow key={s.alumni_id} className="hover:bg-slate-50/50">
                        <TableCell>
                          <div className="flex items-center gap-2.5">
                            <div className={cn(
                              'w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0',
                              'bg-amber-100 text-amber-700'
                            )}>
                              {s.name?.charAt(0)?.toUpperCase() || '?'}
                            </div>
                            <div>
                              <p className="font-medium text-sm text-slate-900">{s.name}</p>
                              {s.student_id && (
                                <p className="text-[10px] text-slate-400">ID: {s.student_id}</p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-xs font-semibold">
                            <GraduationCap className="w-3 h-3 mr-1" />
                            {s.graduation_year || '—'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-slate-600 max-w-[180px] truncate">
                          {s.address || '—'}
                        </TableCell>
                        <TableCell className="text-xs text-slate-600 hidden md:table-cell">
                          {s.email ? (
                            <a href={`mailto:${s.email}`} className="text-sky-600 hover:underline">
                              {s.email}
                            </a>
                          ) : '—'}
                        </TableCell>
                        <TableCell className="text-xs text-slate-600 hidden md:table-cell">
                          {s.phone || '—'}
                        </TableCell>
                        <TableCell className="hidden xl:table-cell">
                          <OccupationBadge occupation={s.current_occupation} />
                        </TableCell>
                        <TableCell className="text-center">
                          <AccountStatusBadge active={s.is_active} />
                        </TableCell>
                        <TableCell className="text-xs text-slate-500 hidden xl:table-cell">
                          {s.created_at
                            ? format(new Date(s.created_at), 'MMM d, yyyy')
                            : '—'
                          }
                        </TableCell>
                        <TableCell className="text-center">
                          <Button variant="ghost" size="sm" className="h-8 text-xs" asChild>
                            <Link href={s.student_id ? `/admin/students/${s.student_id}/profile` : '#'}>
                              <Eye className="w-3.5 h-3.5 mr-1" /> View
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Cards */}
              <div className="lg:hidden divide-y">
                {students.map((s) => (
                  <div key={s.alumni_id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={cn(
                          'w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0',
                          'bg-amber-100 text-amber-700'
                        )}>
                          {s.name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-sm text-slate-900 truncate">{s.name}</p>
                          {s.student_id && (
                            <p className="text-[10px] text-slate-400">ID: {s.student_id}</p>
                          )}
                        </div>
                      </div>
                      <AccountStatusBadge active={s.is_active} />
                    </div>
                    <div className="flex items-center gap-3 pl-12 text-xs text-slate-500 flex-wrap">
                      <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-xs">
                        <GraduationCap className="w-3 h-3 mr-1" />
                        {s.graduation_year || '—'}
                      </Badge>
                      {s.current_occupation && (
                        <>
                          <span className="text-slate-300">|</span>
                          <span>{s.current_occupation}</span>
                        </>
                      )}
                      {s.phone && (
                        <>
                          <span className="text-slate-300">|</span>
                          <span>{s.phone}</span>
                        </>
                      )}
                    </div>
                    {s.address && (
                      <p className="text-xs text-slate-400 pl-12 truncate">{s.address}</p>
                    )}
                    <div className="flex items-center gap-2 pl-12 pt-1">
                      {s.email && (
                        <a
                          href={`mailto:${s.email}`}
                          className="text-xs text-sky-600 hover:underline truncate max-w-[200px]"
                        >
                          {s.email}
                        </a>
                      )}
                      <Button variant="outline" size="sm" className="h-7 text-xs ml-auto" asChild>
                        <Link href={s.student_id ? `/admin/students/${s.student_id}/profile` : '#'}>
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
                    Page {page} of {totalPages} ({totalStudents} alumni)
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
      </div>
    </DashboardLayout>
  );
}
