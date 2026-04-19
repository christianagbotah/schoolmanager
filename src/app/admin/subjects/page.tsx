'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { toast } from 'sonner';
import {
  BookOpen,
  Plus,
  Search,
  Pencil,
  Trash2,
  GraduationCap,
  Layers,
  LayoutGrid,
  UserCheck,
  X,
  Filter,
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────
interface SchoolClass {
  class_id: number;
  name: string;
  name_numeric: number;
  category: string;
}

interface Teacher {
  teacher_id: number;
  name: string;
}

interface Section {
  section_id: number;
  name: string;
}

interface Subject {
  subject_id: number;
  name: string;
  class_id: number | null;
  teacher_id: number | null;
  section_id: number | null;
  year: string;
  term: number;
  sem: number;
  status: number;
  class?: { class_id: number; name: string } | null;
  teacher?: { teacher_id: number; name: string } | null;
  section?: { section_id: number; name: string } | null;
}

// ── Helpers ────────────────────────────────────────────────────────────────
function getClassName(c: SchoolClass) {
  return c.name_numeric > 0 ? `${c.name} ${c.name_numeric}` : c.name;
}

// ── Skeleton Components ───────────────────────────────────────────────────

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
        <Skeleton className="h-11 w-48 rounded-lg hidden lg:block" />
      </div>
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/60 p-4 sm:p-6">
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}

// ── Stat Card Component ───────────────────────────────────────────────────

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

// ── Page Component ─────────────────────────────────────────────────────────
export default function SubjectsPage() {
  // Data
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('__all__');

  // Dialogs
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<Subject | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Form state
  const [form, setForm] = useState({
    name: '',
    class_id: '',
    teacher_id: '',
    section_id: '',
  });

  // ── Active Filters ─────────────────────────────────────────────────────
  const activeFilters = [
    classFilter !== '__all__'
      ? { key: 'class', label: `Class: ${classes.find(c => String(c.class_id) === classFilter)?.name || classFilter}` }
      : null,
  ].filter(Boolean) as { key: string; label: string }[];

  const clearFilter = (key: string) => {
    if (key === 'class') setClassFilter('__all__');
  };

  const clearAllFilters = () => {
    setClassFilter('__all__');
    setSearch('');
  };

  // ── Fetch Data ───────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [subjectsRes, classesRes, teachersRes] = await Promise.all([
        fetch('/api/subjects'),
        fetch('/api/classes'),
        fetch('/api/admin/teachers?pageSize=500'),
      ]);

      const subjectsData = await subjectsRes.json();
      setSubjects(Array.isArray(subjectsData) ? subjectsData : []);

      const classesData = await classesRes.json();
      setClasses(Array.isArray(classesData) ? classesData : []);

      const teachersData = await teachersRes.json();
      const tList = teachersData.data || teachersData;
      setTeachers(Array.isArray(tList) ? tList : []);
    } catch {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Fetch sections when class changes in form
  useEffect(() => {
    if (form.class_id && form.class_id !== '__none__') {
      fetch(`/api/classes?id=${form.class_id}`)
        .then((r) => r.json())
        .then((d) => {
          const secs = d.sections || d.section || [];
          setSections(Array.isArray(secs) ? secs : secs ? [secs] : []);
        })
        .catch(() => setSections([]));
    } else {
      setSections([]);
    }
  }, [form.class_id]);

  // ── Filtered & Stats ─────────────────────────────────────────────────────
  const filteredSubjects = useMemo(() => {
    let list = subjects;

    if (classFilter !== '__all__') {
      list = list.filter(
        (s) => s.class_id === parseInt(classFilter)
      );
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.teacher?.name.toLowerCase().includes(q) ||
          s.class?.name.toLowerCase().includes(q)
      );
    }

    return list;
  }, [subjects, classFilter, search]);

  const stats = useMemo(() => {
    const assigned = subjects.filter((s) => s.class_id !== null);
    const active = subjects.filter((s) => s.status === 1);
    const teacherIds = new Set(subjects.filter((s) => s.teacher_id !== null).map((s) => s.teacher_id));
    const classIds = new Set(subjects.filter((s) => s.class_id !== null).map((s) => s.class_id));
    return {
      total: subjects.length,
      assigned: assigned.length,
      active: active.length,
      teachersTeaching: teacherIds.size,
      classesCovered: classIds.size,
    };
  }, [subjects]);

  // ── Form Helpers ─────────────────────────────────────────────────────────
  const openCreate = () => {
    setSelected(null);
    setForm({ name: '', class_id: '', teacher_id: '', section_id: '' });
    setFormOpen(true);
  };

  const openEdit = (s: Subject) => {
    setSelected(s);
    setForm({
      name: s.name,
      class_id: s.class_id ? String(s.class_id) : '',
      teacher_id: s.teacher_id ? String(s.teacher_id) : '',
      section_id: s.section_id ? String(s.section_id) : '',
    });
    setFormOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error('Subject name is required');
      return;
    }

    setSaving(true);
    try {
      const url = selected
        ? `/api/subjects/${selected.subject_id}`
        : '/api/subjects';
      const method = selected ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          class_id:
            form.class_id && form.class_id !== '__none__'
              ? parseInt(form.class_id)
              : null,
          teacher_id:
            form.teacher_id && form.teacher_id !== '__none__'
              ? parseInt(form.teacher_id)
              : null,
          section_id:
            form.section_id && form.section_id !== '__none__'
              ? parseInt(form.section_id)
              : null,
        }),
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Failed to save');
      }

      toast.success(selected ? 'Subject updated' : 'Subject created');
      setFormOpen(false);
      fetchData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/subjects/${selected.subject_id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete');
      toast.success('Subject deleted');
      setDeleteOpen(false);
      setSelected(null);
      fetchData();
    } catch {
      toast.error('Failed to delete subject');
    } finally {
      setDeleting(false);
    }
  };

  // ── Loading State ───────────────────────────────────────────────────────

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-5 sm:space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1.5">
              <Skeleton className="h-8 w-52" />
              <Skeleton className="h-4 w-72" />
            </div>
            <Skeleton className="h-11 w-40 rounded-lg" />
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

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <DashboardLayout>
      <div className="space-y-5 sm:space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Subjects
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Manage subjects and teacher assignments
            </p>
          </div>
          <Button
            onClick={openCreate}
            className="bg-emerald-600 hover:bg-emerald-700 min-h-[44px]"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Subject
          </Button>
        </div>

        {/* ── Stat Cards ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <StatCard
            icon={BookOpen}
            label="Total Subjects"
            value={stats.total}
            subValue={`${stats.active} active`}
            iconBg="bg-emerald-500"
            borderColor="#10b981"
          />
          <StatCard
            icon={LayoutGrid}
            label="Assigned to Classes"
            value={stats.assigned}
            subValue={stats.total > 0 ? `${Math.round((stats.assigned / stats.total) * 100)}% of total` : undefined}
            iconBg="bg-sky-500"
            borderColor="#0ea5e9"
          />
          <StatCard
            icon={UserCheck}
            label="Teachers Teaching"
            value={stats.teachersTeaching}
            subValue={`${teachers.length} total teachers`}
            iconBg="bg-violet-500"
            borderColor="#8b5cf6"
          />
          <StatCard
            icon={Layers}
            label="Classes Covered"
            value={stats.classesCovered}
            subValue={`${classes.length} total classes`}
            iconBg="bg-amber-500"
            borderColor="#f59e0b"
          />
        </div>

        {/* ── Filter Bar ─────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-200/60 p-4">
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search by subject, teacher, or class..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 min-h-[44px]"
              />
            </div>
            <Select value={classFilter} onValueChange={setClassFilter}>
              <SelectTrigger className="w-full lg:w-52 min-h-[44px]">
                <SelectValue placeholder="All Classes" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                <SelectItem value="__all__">All Classes</SelectItem>
                {classes.map((c) => (
                  <SelectItem key={c.class_id} value={String(c.class_id)}>
                    {getClassName(c)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Active filter chips */}
          {activeFilters.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              {activeFilters.map((f) => (
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
              {search && (
                <Badge
                  variant="outline"
                  className="bg-slate-50 border-slate-200 text-slate-700 text-xs pr-1 gap-1"
                >
                  Search: {search}
                  <button
                    onClick={() => setSearch('')}
                    className="ml-0.5 w-4 h-4 rounded-full hover:bg-slate-200 inline-flex items-center justify-center transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )}
              <button
                onClick={clearAllFilters}
                className="text-xs text-slate-500 hover:text-slate-700 underline-offset-2 hover:underline transition-colors"
              >
                Clear all
              </button>
            </div>
          )}
        </div>

        {/* ── Data Table / Mobile Card View ────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden">
          {/* Results header */}
          {filteredSubjects.length > 0 && (
            <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-slate-100 bg-slate-50/50">
              <p className="text-xs font-medium text-slate-500">
                Showing {filteredSubjects.length} of {subjects.length} subjects
              </p>
            </div>
          )}

          {filteredSubjects.length === 0 ? (
            /* Empty State */
            <div className="text-center py-20">
              <div className="flex flex-col items-center gap-3">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center">
                  <BookOpen className="w-8 h-8 text-slate-400" />
                </div>
                <div>
                  <p className="font-semibold text-slate-500 text-base">
                    {search || classFilter !== '__all__'
                      ? 'No subjects found'
                      : 'No subjects yet'}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    {search || classFilter !== '__all__'
                      ? 'Try adjusting your search or filter criteria.'
                      : 'Get started by adding your first subject.'}
                  </p>
                </div>
                {!search && classFilter === '__all__' && (
                  <Button
                    onClick={openCreate}
                    variant="outline"
                    className="mt-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50 min-h-[44px]"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Subject
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50 hover:bg-slate-50">
                      <TableHead className="text-xs font-semibold text-slate-600">
                        Subject
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600">
                        Class
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600">
                        Teacher
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600">
                        Section
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600">
                        Status
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 text-right">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSubjects.map((s) => (
                      <TableRow key={s.subject_id} className="hover:bg-slate-50/50 transition-colors">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                              <BookOpen className="w-4 h-4 text-emerald-600" />
                            </div>
                            <span className="font-medium text-sm text-slate-900">
                              {s.name}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-slate-600">
                          {s.class?.name || (
                            <span className="text-slate-400">Not assigned</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-slate-600">
                          {s.teacher?.name || (
                            <span className="text-slate-400">Not assigned</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-slate-600">
                          {s.section?.name || (
                            <span className="text-slate-400">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`text-xs font-medium ${
                              s.status === 1
                                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                : 'border-slate-200 bg-slate-50 text-slate-600'
                            }`}
                          >
                            {s.status === 1 ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 min-w-[32px] text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                              onClick={() => openEdit(s)}
                              title="Edit Subject"
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 min-w-[32px] text-red-500 hover:text-red-600 hover:bg-red-50"
                              onClick={() => {
                                setSelected(s);
                                setDeleteOpen(true);
                              }}
                              title="Delete Subject"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden divide-y divide-slate-100">
                {filteredSubjects.map((s) => (
                  <div key={s.subject_id} className="p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                        <BookOpen className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-semibold text-sm text-slate-900 truncate">
                              {s.name}
                            </p>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {s.class?.name || 'No class'}
                            </p>
                          </div>
                          <Badge
                            variant="outline"
                            className={`text-[10px] font-medium flex-shrink-0 ${
                              s.status === 1
                                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                : 'border-slate-200 bg-slate-50 text-slate-600'
                            }`}
                          >
                            {s.status === 1 ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>

                        <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-slate-500">
                          <p className="flex items-center gap-1.5">
                            <UserCheck className="w-3 h-3 text-slate-400" />
                            <span className="truncate">{s.teacher?.name || 'Not assigned'}</span>
                          </p>
                          <p className="flex items-center gap-1.5">
                            <Layers className="w-3 h-3 text-slate-400" />
                            <span>{s.section?.name || '—'}</span>
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-1">
                      <Button
                        variant="outline"
                        className="flex-1 min-h-[44px] text-xs"
                        onClick={() => openEdit(s)}
                      >
                        <Pencil className="w-3.5 h-3.5 mr-1.5" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        className="min-h-[44px] min-w-[44px] text-xs text-red-600 border-red-200 hover:bg-red-50"
                        onClick={() => {
                          setSelected(s);
                          setDeleteOpen(true);
                        }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Add/Edit Dialog ─────────────────────────────────────────── */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-emerald-600" />
              {selected ? 'Edit Subject' : 'Add New Subject'}
            </DialogTitle>
            <DialogDescription>
              {selected
                ? 'Update subject details and assignments below'
                : 'Fill in the details to create a new subject'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label className="text-xs font-medium">Subject Name *</Label>
              <Input
                value={form.name}
                onChange={(e) =>
                  setForm({ ...form, name: e.target.value })
                }
                placeholder="e.g. Mathematics"
                className="min-h-[44px]"
              />
            </div>

            <div className="grid gap-2">
              <Label className="text-xs font-medium">Class</Label>
              <Select
                value={form.class_id || '__none__'}
                onValueChange={(v) =>
                  setForm({ ...form, class_id: v, section_id: '' })
                }
              >
                <SelectTrigger className="min-h-[44px]">
                  <SelectValue placeholder="Select class (optional)" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  <SelectItem value="__none__">No class</SelectItem>
                  {classes.map((c) => (
                    <SelectItem key={c.class_id} value={String(c.class_id)}>
                      {getClassName(c)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label className="text-xs font-medium">Teacher</Label>
              <Select
                value={form.teacher_id || '__none__'}
                onValueChange={(v) =>
                  setForm({ ...form, teacher_id: v })
                }
              >
                <SelectTrigger className="min-h-[44px]">
                  <SelectValue placeholder="Select teacher (optional)" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  <SelectItem value="__none__">No teacher</SelectItem>
                  {teachers.map((t) => (
                    <SelectItem
                      key={t.teacher_id}
                      value={String(t.teacher_id)}
                    >
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label className="text-xs font-medium">Section</Label>
              <Select
                value={form.section_id || '__none__'}
                onValueChange={(v) =>
                  setForm({ ...form, section_id: v })
                }
                disabled={!form.class_id || form.class_id === '__none__'}
              >
                <SelectTrigger className="min-h-[44px]">
                  <SelectValue placeholder="Select a class first" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  <SelectItem value="__none__">No section</SelectItem>
                  {sections.map((sec) => (
                    <SelectItem
                      key={sec.section_id}
                      value={String(sec.section_id)}
                    >
                      {sec.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!form.class_id && (
                <p className="text-xs text-slate-400 mt-1">
                  Select a class to see available sections
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setFormOpen(false)}
              className="min-h-[44px]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              className="bg-emerald-600 hover:bg-emerald-700 min-h-[44px]"
              disabled={saving || !form.name.trim()}
            >
              {saving ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </span>
              ) : selected ? (
                'Update'
              ) : (
                'Create'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmation ─────────────────────────────────────── */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              Delete Subject
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{' '}
              <strong>{selected?.name}</strong>? This action cannot be
              undone and will remove the subject from all associated classes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="min-h-[44px]">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 min-h-[44px]"
            >
              {deleting ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Deleting...
                </span>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
