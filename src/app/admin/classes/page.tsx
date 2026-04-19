'use client';

import { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  Search, Plus, BookOpen, Layers, Users, GraduationCap, Hash,
  Pencil, Trash2, Eye, ChevronRight, X, UserCheck,
} from 'lucide-react';

// ─── Constants ──────────────────────────────────────────────────────────────────
const CLASS_NAMES = ['CRECHE', 'NURSERY', 'KG', 'BASIC', 'JHS'];
const CATEGORIES = ['Pre-School', 'Lower Primary', 'Upper Primary', 'JHS'];

// ─── Types ──────────────────────────────────────────────────────────────────────
interface SchoolClass {
  class_id: number;
  name: string;
  name_numeric: number;
  category: string;
  digit: string;
  note: string;
  student_capacity: number;
  teacher?: { teacher_id: number; name: string; teacher_code: string } | null;
  section?: { section_id: number; name: string } | null;
  sections?: { section_id: number; name: string }[];
  _count?: { enrolls: number };
}

interface Section {
  section_id: number;
  name: string;
  nick_name: string;
  numeric_name: number;
  teacher_id: number | null;
  class_id: number;
  teacher?: { teacher_id: number; name: string } | null;
  class?: { class_id: number; name: string; name_numeric: number; category: string } | null;
  _count?: { enrolls: number };
}

interface Teacher {
  teacher_id: number;
  name: string;
}

// ─── Helpers ────────────────────────────────────────────────────────────────────
const getDisplayClassName = (c: SchoolClass) => {
  if (c.name_numeric > 0) return `${c.name} ${c.name_numeric}`;
  return c.name;
};

const categoryColors: Record<string, string> = {
  'Pre-School': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  'Lower Primary': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  'Upper Primary': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  'JHS': 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
};

// ─── Component ──────────────────────────────────────────────────────────────────
export default function ClassesPage() {
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Sections sub-resource
  const [sections, setSections] = useState<Section[]>([]);
  const [sectionsOpen, setSectionsOpen] = useState(false);
  const [sectionsClass, setSectionsClass] = useState<SchoolClass | null>(null);
  const [sectionsLoading, setSectionsLoading] = useState(false);

  // Section form
  const [sectionFormOpen, setSectionFormOpen] = useState(false);
  const [sectionFormSaving, setSectionFormSaving] = useState(false);
  const [sectionFormData, setSectionFormData] = useState({
    name: '',
    nick_name: '',
    numeric_name: '',
    teacher_id: '',
  });

  // Delete section
  const [deleteSectionTarget, setDeleteSectionTarget] = useState<Section | null>(null);
  const [deletingSection, setDeletingSection] = useState(false);

  // Class form
  const [classFormOpen, setClassFormOpen] = useState(false);
  const [classFormSaving, setClassFormSaving] = useState(false);
  const [editingClass, setEditingClass] = useState<SchoolClass | null>(null);
  const [classFormData, setClassFormData] = useState({
    name: '',
    name_numeric: '',
    category: '',
    teacher_id: '',
    section_name: '',
  });

  // Delete class
  const [deleteClassTarget, setDeleteClassTarget] = useState<SchoolClass | null>(null);
  const [deletingClass, setDeletingClass] = useState(false);

  // View class details
  const [viewClassOpen, setViewClassOpen] = useState(false);
  const [viewClassData, setViewClassData] = useState<SchoolClass | null>(null);

  // ─── Data fetching ───────────────────────────────────────────────────────────
  const fetchClasses = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/classes');
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setClasses(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Failed to load classes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClasses();
    fetch('/api/admin/teachers')
      .then((r) => r.json())
      .then((d) => {
        const list = d.data || d;
        setTeachers(
          Array.isArray(list)
            ? list.map((t: Teacher) => ({ teacher_id: t.teacher_id, name: t.name }))
            : [],
        );
      })
      .catch(() => {});
  }, [fetchClasses]);

  // ─── Filtered data ───────────────────────────────────────────────────────────
  const filteredClasses = classes.filter((c) => {
    const matchSearch =
      !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.category.toLowerCase().includes(search.toLowerCase()) ||
      String(c.name_numeric).includes(search);
    const matchCategory = !categoryFilter || c.category === categoryFilter;
    return matchSearch && matchCategory;
  });

  const hasActiveFilters = search.trim() !== '' || categoryFilter !== '';

  // ─── Stats ───────────────────────────────────────────────────────────────────
  const totalClasses = classes.length;
  const totalSections = classes.reduce((s, c) => s + (c.sections?.length || 0), 0);
  const totalStudents = classes.reduce((s, c) => s + (c._count?.enrolls || 0), 0);
  const uniqueTeacherIds = new Set(
    classes.filter((c) => c.teacher).map((c) => c.teacher!.teacher_id),
  );
  const totalTeachers = uniqueTeacherIds.size;

  // ─── Class CRUD ──────────────────────────────────────────────────────────────
  const openAddClass = () => {
    setEditingClass(null);
    setClassFormData({ name: '', name_numeric: '', category: '', teacher_id: '', section_name: 'A' });
    setClassFormOpen(true);
  };

  const openEditClass = (c: SchoolClass) => {
    setEditingClass(c);
    setClassFormData({
      name: c.name,
      name_numeric: String(c.name_numeric),
      category: c.category,
      teacher_id: c.teacher ? String(c.teacher.teacher_id) : '',
      section_name: '',
    });
    setClassFormOpen(true);
  };

  const handleSaveClass = async () => {
    if (!classFormData.name) {
      toast.error('Class name is required');
      return;
    }
    if (!classFormData.category) {
      toast.error('Category is required');
      return;
    }
    setClassFormSaving(true);
    try {
      const url = editingClass
        ? `/api/admin/classes/${editingClass.class_id}`
        : '/api/admin/classes';
      const method = editingClass ? 'PUT' : 'POST';
      const body = editingClass
        ? {
            name: classFormData.name,
            name_numeric: classFormData.name_numeric,
            category: classFormData.category,
            teacher_id: classFormData.teacher_id,
          }
        : {
            name: classFormData.name,
            name_numeric: classFormData.name_numeric,
            category: classFormData.category,
            teacher_id: classFormData.teacher_id,
            section_name: classFormData.section_name || 'A',
          };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast.success(editingClass ? 'Class updated successfully' : 'Class created successfully');
      setClassFormOpen(false);
      fetchClasses();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Operation failed';
      toast.error(msg);
    } finally {
      setClassFormSaving(false);
    }
  };

  const handleDeleteClass = async () => {
    if (!deleteClassTarget) return;
    setDeletingClass(true);
    try {
      const res = await fetch(`/api/admin/classes/${deleteClassTarget.class_id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast.success('Class deleted successfully');
      setDeleteClassTarget(null);
      fetchClasses();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Delete failed';
      toast.error(msg);
    } finally {
      setDeletingClass(false);
    }
  };

  // ─── Sections management ─────────────────────────────────────────────────────
  const openSections = async (c: SchoolClass) => {
    setSectionsClass(c);
    setSectionsOpen(true);
    setSectionsLoading(true);
    try {
      const res = await fetch(`/api/admin/sections?class_id=${c.class_id}`);
      const data = await res.json();
      setSections(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Failed to load sections');
      setSections([]);
    } finally {
      setSectionsLoading(false);
    }
  };

  const openAddSection = () => {
    setSectionFormData({ name: '', nick_name: '', numeric_name: '', teacher_id: '' });
    setSectionFormOpen(true);
  };

  const handleSaveSection = async () => {
    if (!sectionFormData.name.trim()) {
      toast.error('Section name is required');
      return;
    }
    if (!sectionsClass) return;
    setSectionFormSaving(true);
    try {
      const res = await fetch('/api/admin/sections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...sectionFormData,
          class_id: sectionsClass.class_id,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast.success('Section created successfully');
      setSectionFormOpen(false);
      openSections(sectionsClass);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create section';
      toast.error(msg);
    } finally {
      setSectionFormSaving(false);
    }
  };

  const handleDeleteSection = async () => {
    if (!deleteSectionTarget) return;
    setDeletingSection(true);
    try {
      const res = await fetch(`/api/admin/sections/${deleteSectionTarget.section_id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast.success('Section deleted successfully');
      setDeleteSectionTarget(null);
      if (sectionsClass) openSections(sectionsClass);
      fetchClasses();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete section';
      toast.error(msg);
    } finally {
      setDeletingSection(false);
    }
  };

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* ─── Page Header ──────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
              Classes
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Manage classes, sections and enrollment
            </p>
          </div>
          <Button
            onClick={openAddClass}
            className="bg-emerald-600 hover:bg-emerald-700 min-h-[44px] px-5 shadow-sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Class
          </Button>
        </div>

        {/* ─── Stat Cards ───────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="border-slate-200/60 dark:border-slate-700/60 overflow-hidden">
                <CardContent className="p-5">
                  <div className="flex items-center gap-4">
                    <Skeleton className="w-12 h-12 rounded-xl" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-3 w-20" />
                      <Skeleton className="h-6 w-10" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <>
              {/* Total Classes */}
              <Card className="border-slate-200/60 dark:border-slate-700/60 overflow-hidden hover:shadow-md transition-shadow duration-200">
                <CardContent className="p-5">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
                      <GraduationCap className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                        Total Classes
                      </p>
                      <p className="text-2xl font-bold text-slate-900 dark:text-slate-50 leading-tight">
                        {totalClasses}
                      </p>
                    </div>
                  </div>
                </CardContent>
                <div className="h-1 bg-emerald-500" />
              </Card>

              {/* Total Sections */}
              <Card className="border-slate-200/60 dark:border-slate-700/60 overflow-hidden hover:shadow-md transition-shadow duration-200">
                <CardContent className="p-5">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-sky-50 dark:bg-sky-900/30 flex items-center justify-center flex-shrink-0">
                      <Layers className="w-6 h-6 text-sky-600 dark:text-sky-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                        Total Sections
                      </p>
                      <p className="text-2xl font-bold text-slate-900 dark:text-slate-50 leading-tight">
                        {totalSections}
                      </p>
                    </div>
                  </div>
                </CardContent>
                <div className="h-1 bg-sky-500" />
              </Card>

              {/* Students Enrolled */}
              <Card className="border-slate-200/60 dark:border-slate-700/60 overflow-hidden hover:shadow-md transition-shadow duration-200">
                <CardContent className="p-5">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                      <Users className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                        Students Enrolled
                      </p>
                      <p className="text-2xl font-bold text-slate-900 dark:text-slate-50 leading-tight">
                        {totalStudents}
                      </p>
                    </div>
                  </div>
                </CardContent>
                <div className="h-1 bg-amber-500" />
              </Card>

              {/* Teachers Assigned */}
              <Card className="border-slate-200/60 dark:border-slate-700/60 overflow-hidden hover:shadow-md transition-shadow duration-200">
                <CardContent className="p-5">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-violet-50 dark:bg-violet-900/30 flex items-center justify-center flex-shrink-0">
                      <UserCheck className="w-6 h-6 text-violet-600 dark:text-violet-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                        Teachers Assigned
                      </p>
                      <p className="text-2xl font-bold text-slate-900 dark:text-slate-50 leading-tight">
                        {totalTeachers}
                      </p>
                    </div>
                  </div>
                </CardContent>
                <div className="h-1 bg-violet-500" />
              </Card>
            </>
          )}
        </div>

        {/* ─── Filter Bar ───────────────────────────────────────────────────── */}
        <Card className="border-slate-200/60 dark:border-slate-700/60">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search by class name, category, or digit..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 min-h-[44px]"
                />
              </div>
              <Select
                value={categoryFilter}
                onValueChange={(v) => (v === '__all__' ? setCategoryFilter('') : setCategoryFilter(v))}
              >
                <SelectTrigger className="w-full sm:w-48 min-h-[44px]">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All Categories</SelectItem>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Active Filter Chips */}
            {hasActiveFilters && (
              <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <span className="text-xs text-slate-400 font-medium">Active:</span>
                {search.trim() && (
                  <Badge
                    variant="secondary"
                    className="text-xs gap-1 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700"
                    onClick={() => setSearch('')}
                  >
                    <Search className="w-3 h-3" />
                    &quot;{search}&quot;
                    <X className="w-3 h-3 ml-0.5" />
                  </Badge>
                )}
                {categoryFilter && (
                  <Badge
                    variant="secondary"
                    className="text-xs gap-1 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700"
                    onClick={() => setCategoryFilter('')}
                  >
                    <BookOpen className="w-3 h-3" />
                    {categoryFilter}
                    <X className="w-3 h-3 ml-0.5" />
                  </Badge>
                )}
                <button
                  onClick={() => {
                    setSearch('');
                    setCategoryFilter('');
                  }}
                  className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-medium ml-1"
                >
                  Clear all
                </button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ─── Classes List ─────────────────────────────────────────────────── */}
        <Card className="border-slate-200/60 dark:border-slate-700/60">
          <CardContent className="p-0">
            {/* Desktop Table */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/80 dark:bg-slate-800/40">
                    <TableHead className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                      Class Name
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                      Category
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                      Teacher
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                      Sections
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                      Students
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-slate-600 dark:text-slate-300 text-right">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Skeleton className="w-9 h-9 rounded-lg" />
                            <div className="space-y-1.5">
                              <Skeleton className="h-4 w-24" />
                              <Skeleton className="h-3 w-16" />
                            </div>
                          </div>
                        </TableCell>
                        {Array.from({ length: 5 }).map((_, j) => (
                          <TableCell key={j}>
                            <Skeleton className="h-5 w-16 rounded-full" />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : filteredClasses.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6}>
                        <div className="flex flex-col items-center justify-center py-20 text-slate-400 dark:text-slate-500">
                          <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                            <GraduationCap className="w-8 h-8 opacity-40" />
                          </div>
                          <p className="text-base font-semibold text-slate-600 dark:text-slate-300">
                            No classes found
                          </p>
                          <p className="text-sm mt-1 max-w-xs text-center">
                            {hasActiveFilters
                              ? 'Try adjusting your search or filter criteria'
                              : 'Get started by creating your first class'}
                          </p>
                          {!hasActiveFilters && (
                            <Button
                              onClick={openAddClass}
                              className="mt-4 bg-emerald-600 hover:bg-emerald-700 min-h-[44px]"
                            >
                              <Plus className="w-4 h-4 mr-2" />
                              Add Class
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredClasses.map((c) => (
                      <TableRow
                        key={c.class_id}
                        className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors"
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
                              <GraduationCap className="w-4.5 h-4.5 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div>
                              <p className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                                {getDisplayClassName(c)}
                              </p>
                              <p className="text-xs text-slate-400 font-mono">
                                {c.name_numeric ? `Digit: ${c.name_numeric}` : '\u2014'}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`text-xs capitalize ${categoryColors[c.category] || 'bg-slate-100 text-slate-600'}`}
                          >
                            {c.category || '\u2014'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {c.teacher ? (
                            <span className="text-sm text-slate-700 dark:text-slate-300">
                              {c.teacher.name}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400 italic">
                              Not assigned
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <button
                            onClick={() => openSections(c)}
                            className="inline-flex items-center gap-1.5 text-sm text-emerald-600 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300 hover:underline min-h-[44px] min-w-[44px] justify-start cursor-pointer transition-colors"
                          >
                            <Layers className="w-3.5 h-3.5" />
                            {c.sections?.length || 0} section{(c.sections?.length || 0) !== 1 ? 's' : ''}
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300">
                            <Users className="w-3 h-3 mr-1" />
                            {c._count?.enrolls || 0}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9"
                              onClick={() => {
                                setViewClassData(c);
                                setViewClassOpen(true);
                              }}
                              title="View Details"
                            >
                              <Eye className="w-4 h-4 text-slate-500" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9"
                              onClick={() => openEditClass(c)}
                              title="Edit Class"
                            >
                              <Pencil className="w-4 h-4 text-slate-500" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                              onClick={() => setDeleteClassTarget(c)}
                              title="Delete Class"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <Skeleton className="w-10 h-10 rounded-xl" />
                      <div className="space-y-1.5 flex-1">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Skeleton className="h-6 w-20 rounded-full" />
                      <Skeleton className="h-6 w-16 rounded-full" />
                      <Skeleton className="h-6 w-20 rounded-full" />
                    </div>
                    <Skeleton className="h-11 w-full rounded-lg" />
                  </div>
                ))
              ) : filteredClasses.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400 dark:text-slate-500 px-4">
                  <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                    <GraduationCap className="w-8 h-8 opacity-40" />
                  </div>
                  <p className="text-base font-semibold text-slate-600 dark:text-slate-300">
                    No classes found
                  </p>
                  <p className="text-sm mt-1 text-center">
                    {hasActiveFilters
                      ? 'Try adjusting your search or filters'
                      : 'Get started by creating your first class'}
                  </p>
                  {!hasActiveFilters && (
                    <Button
                      onClick={openAddClass}
                      className="mt-4 bg-emerald-600 hover:bg-emerald-700 min-h-[44px]"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Class
                    </Button>
                  )}
                </div>
              ) : (
                filteredClasses.map((c) => (
                  <div key={c.class_id} className="p-4 space-y-3">
                    {/* Header row */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
                          <GraduationCap className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate">
                            {getDisplayClassName(c)}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                            {c.teacher?.name || 'No teacher assigned'}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9"
                          onClick={() => {
                            setViewClassData(c);
                            setViewClassOpen(true);
                          }}
                        >
                          <Eye className="w-4 h-4 text-slate-500" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9"
                          onClick={() => openEditClass(c)}
                        >
                          <Pencil className="w-4 h-4 text-slate-500" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                          onClick={() => setDeleteClassTarget(c)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Info badges */}
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        variant="outline"
                        className={`text-xs capitalize ${categoryColors[c.category] || 'bg-slate-100 text-slate-600'}`}
                      >
                        {c.category || '\u2014'}
                      </Badge>
                      <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300">
                        <Users className="w-3 h-3 mr-1" />
                        {c._count?.enrolls || 0} students
                      </Badge>
                      <Badge variant="outline" className="text-xs bg-sky-50 text-sky-700 dark:bg-sky-900/20 dark:text-sky-300">
                        <Layers className="w-3 h-3 mr-1" />
                        {c.sections?.length || 0} section{(c.sections?.length || 0) !== 1 ? 's' : ''}
                      </Badge>
                    </div>

                    {/* Manage sections CTA */}
                    <Button
                      variant="ghost"
                      className="w-full h-11 text-sm text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-900/20 dark:hover:text-emerald-300 justify-start rounded-lg"
                      onClick={() => openSections(c)}
                    >
                      <Layers className="w-4 h-4 mr-2" />
                      Manage Sections
                      <ChevronRight className="w-4 h-4 ml-auto" />
                    </Button>
                  </div>
                ))
              )}
            </div>

            {/* Results Count */}
            {!loading && filteredClasses.length > 0 && (
              <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-800">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Showing {filteredClasses.length} of {classes.length} classes
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ─── View Class Details Dialog ─────────────────────────────────────── */}
      <Dialog open={viewClassOpen} onOpenChange={setViewClassOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Class Details</DialogTitle>
            <DialogDescription className="sr-only">
              Detailed information about the selected class
            </DialogDescription>
          </DialogHeader>
          {viewClassData && (
            <div className="space-y-5 text-sm">
              {/* Class header */}
              <div className="text-center pb-5 border-b border-slate-100 dark:border-slate-800">
                <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/40 rounded-2xl mx-auto flex items-center justify-center mb-3">
                  <GraduationCap className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                </div>
                <p className="font-bold text-lg text-slate-900 dark:text-slate-50">
                  {getDisplayClassName(viewClassData)}
                </p>
                <Badge
                  variant="outline"
                  className={`mt-2 capitalize ${categoryColors[viewClassData.category] || 'bg-slate-100 text-slate-600'}`}
                >
                  {viewClassData.category}
                </Badge>
              </div>

              {/* Info grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wide">
                    Numeric
                  </p>
                  <p className="font-semibold font-mono text-slate-900 dark:text-slate-100">
                    {viewClassData.name_numeric || '\u2014'}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wide">
                    Students
                  </p>
                  <p className="font-semibold text-slate-900 dark:text-slate-100">
                    {viewClassData._count?.enrolls || 0}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wide">
                    Sections
                  </p>
                  <p className="font-semibold text-slate-900 dark:text-slate-100">
                    {viewClassData.sections?.length || 0}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wide">
                    Class Teacher
                  </p>
                  <p className="font-semibold text-slate-900 dark:text-slate-100">
                    {viewClassData.teacher?.name || 'Not assigned'}
                  </p>
                </div>
              </div>

              {/* Sections badges */}
              {viewClassData.sections && viewClassData.sections.length > 0 && (
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                  <p className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-2">
                    Sections
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {viewClassData.sections.map((s) => (
                      <Badge
                        key={s.section_id}
                        variant="secondary"
                        className="text-xs font-medium"
                      >
                        {s.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            {viewClassData && (
              <Button
                variant="outline"
                className="mr-auto"
                onClick={() => {
                  setViewClassOpen(false);
                  openEditClass(viewClassData);
                }}
              >
                <Pencil className="w-4 h-4 mr-2" />
                Edit
              </Button>
            )}
            <Button variant="outline" onClick={() => setViewClassOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Add/Edit Class Dialog ─────────────────────────────────────────── */}
      <Dialog open={classFormOpen} onOpenChange={setClassFormOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <GraduationCap className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              {editingClass ? 'Edit Class' : 'Add New Class'}
            </DialogTitle>
            <DialogDescription>
              {editingClass
                ? 'Update the class information below.'
                : 'Fill in the details to create a new class.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Class Name */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Class Name <span className="text-red-500">*</span></Label>
              {editingClass ? (
                <Input
                  value={classFormData.name}
                  onChange={(e) => setClassFormData({ ...classFormData, name: e.target.value })}
                  placeholder="e.g. BASIC"
                  className="min-h-[44px]"
                />
              ) : (
                <Select
                  value={classFormData.name}
                  onValueChange={(v) => setClassFormData({ ...classFormData, name: v })}
                >
                  <SelectTrigger className="min-h-[44px]">
                    <SelectValue placeholder="Select class name" />
                  </SelectTrigger>
                  <SelectContent>
                    {CLASS_NAMES.map((cn) => (
                      <SelectItem key={cn} value={cn}>
                        {cn}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Category */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Category <span className="text-red-500">*</span></Label>
              {editingClass ? (
                <Input
                  value={classFormData.category}
                  onChange={(e) => setClassFormData({ ...classFormData, category: e.target.value })}
                  className="min-h-[44px]"
                />
              ) : (
                <Select
                  value={classFormData.category}
                  onValueChange={(v) => setClassFormData({ ...classFormData, category: v })}
                >
                  <SelectTrigger className="min-h-[44px]">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <Separator />

            {/* Numeric Name */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Numeric Name</Label>
              <Input
                type="text"
                placeholder="e.g. 1, 2, 3"
                value={classFormData.name_numeric}
                onChange={(e) => setClassFormData({ ...classFormData, name_numeric: e.target.value })}
                className="min-h-[44px]"
              />
            </div>

            {/* Class Teacher */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Class Teacher</Label>
              <Select
                value={classFormData.teacher_id}
                onValueChange={(v) => setClassFormData({ ...classFormData, teacher_id: v })}
              >
                <SelectTrigger className="min-h-[44px]">
                  <SelectValue placeholder="Select teacher (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {teachers.map((t) => (
                    <SelectItem key={t.teacher_id} value={String(t.teacher_id)}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Default Section Name (new only) */}
            {!editingClass && (
              <>
                <Separator />
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Default Section Name</Label>
                  <Input
                    placeholder="A"
                    value={classFormData.section_name}
                    onChange={(e) => setClassFormData({ ...classFormData, section_name: e.target.value })}
                    className="min-h-[44px]"
                  />
                  <p className="text-xs text-slate-400">
                    A default section will be created with this name
                  </p>
                </div>
              </>
            )}
          </div>
          <DialogFooter className="gap-2 sm:gap-0 mt-2">
            <Button variant="outline" onClick={() => setClassFormOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveClass}
              disabled={classFormSaving || !classFormData.name || !classFormData.category}
              className="bg-emerald-600 hover:bg-emerald-700 min-h-[44px]"
            >
              {classFormSaving ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  Saving...
                </>
              ) : editingClass ? (
                'Update Class'
              ) : (
                'Create Class'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Delete Class Dialog ───────────────────────────────────────────── */}
      <AlertDialog open={!!deleteClassTarget} onOpenChange={() => setDeleteClassTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <AlertDialogTitle>Delete Class</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="pl-[52px]">
              Are you sure you want to delete{' '}
              <strong>{deleteClassTarget ? getDisplayClassName(deleteClassTarget) : ''}</strong>?
              This action cannot be undone.
              {deleteClassTarget && deleteClassTarget._count && deleteClassTarget._count.enrolls > 0 && (
                <span className="block mt-3 p-2.5 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-600 dark:text-red-400 font-semibold text-xs border border-red-100 dark:border-red-900/40">
                  {deleteClassTarget._count.enrolls} student(s) are currently enrolled!
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="min-h-[44px]">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteClass}
              disabled={deletingClass}
              className="bg-red-600 hover:bg-red-700 min-h-[44px]"
            >
              {deletingClass ? 'Deleting...' : 'Delete Class'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ─── Sections Management Dialog ────────────────────────────────────── */}
      <Dialog open={sectionsOpen} onOpenChange={setSectionsOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center">
                <Layers className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              </div>
              Sections
              <span className="text-slate-400 font-normal text-base">
                \u2014 {sectionsClass ? getDisplayClassName(sectionsClass) : ''}
              </span>
            </DialogTitle>
            <DialogDescription>
              Manage sections, assign teachers and view enrollment
            </DialogDescription>
          </DialogHeader>

          {/* Quick-add inline */}
          <div className="flex gap-2">
            <Input
              placeholder="Quick add (e.g. B, C)..."
              value={sectionFormData.name}
              onChange={(e) =>
                setSectionFormData({ ...sectionFormData, name: e.target.value.toUpperCase() })
              }
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSaveSection();
                }
              }}
              className="flex-1 min-h-[44px]"
            />
            <Button
              onClick={openAddSection}
              className="bg-emerald-600 hover:bg-emerald-700 min-h-[44px]"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Advanced
            </Button>
          </div>

          <Separator />

          {/* Sections list */}
          <ScrollArea className="flex-1 -mx-6 px-6">
            {sectionsLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-3">
                    <Skeleton className="w-10 h-10 rounded-lg" />
                    <div className="space-y-1.5 flex-1">
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-3 w-40" />
                    </div>
                  </div>
                ))}
              </div>
            ) : sections.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3">
                  <Layers className="w-7 h-7 text-slate-400" />
                </div>
                <p className="font-semibold text-slate-600 dark:text-slate-300">No sections yet</p>
                <p className="text-sm text-slate-400 mt-1">
                  Use the input above to quickly add a section
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {sections.map((s) => (
                  <div
                    key={s.section_id}
                    className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-sky-50 dark:bg-sky-900/30 flex items-center justify-center flex-shrink-0">
                      <Hash className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                        Section {s.name}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        <span className="inline-flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {s._count?.enrolls || 0} student{(s._count?.enrolls || 0) !== 1 ? 's' : ''}
                        </span>
                        {s.teacher && (
                          <span className="inline-flex items-center gap-1">
                            <UserCheck className="w-3 h-3" />
                            {s.teacher.name}
                          </span>
                        )}
                        {s.nick_name && (
                          <span className="italic text-slate-400 dark:text-slate-500">
                            &ldquo;{s.nick_name}&rdquo;
                          </span>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex-shrink-0 opacity-60 group-hover:opacity-100 transition-opacity"
                      onClick={() => setDeleteSectionTarget(s)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          <Separator />

          <DialogFooter className="gap-2 sm:gap-0">
            <span className="text-xs text-slate-400 mr-auto">
              {sections.length} section{sections.length !== 1 ? 's' : ''}
            </span>
            <Button variant="outline" onClick={() => setSectionsOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Add Section Dialog (Advanced) ────────────────────────────────── */}
      <Dialog open={sectionFormOpen} onOpenChange={setSectionFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Section</DialogTitle>
            <DialogDescription>
              Create a new section with optional details
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">
                Section Name <span className="text-red-500">*</span>
              </Label>
              <Input
                placeholder="e.g. B, C, D"
                value={sectionFormData.name}
                onChange={(e) =>
                  setSectionFormData({ ...sectionFormData, name: e.target.value.toUpperCase() })
                }
                className="min-h-[44px]"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Nickname (optional)</Label>
              <Input
                placeholder="e.g. Star, Diamond"
                value={sectionFormData.nick_name}
                onChange={(e) => setSectionFormData({ ...sectionFormData, nick_name: e.target.value })}
                className="min-h-[44px]"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Numeric Order</Label>
              <Input
                type="number"
                placeholder="0"
                value={sectionFormData.numeric_name}
                onChange={(e) =>
                  setSectionFormData({ ...sectionFormData, numeric_name: e.target.value })
                }
                className="min-h-[44px]"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Section Teacher</Label>
              <Select
                value={sectionFormData.teacher_id}
                onValueChange={(v) => setSectionFormData({ ...sectionFormData, teacher_id: v })}
              >
                <SelectTrigger className="min-h-[44px]">
                  <SelectValue placeholder="Select teacher (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {teachers.map((t) => (
                    <SelectItem key={t.teacher_id} value={String(t.teacher_id)}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0 mt-2">
            <Button variant="outline" onClick={() => setSectionFormOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveSection}
              disabled={sectionFormSaving || !sectionFormData.name.trim()}
              className="bg-emerald-600 hover:bg-emerald-700 min-h-[44px]"
            >
              {sectionFormSaving ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  Creating...
                </>
              ) : (
                'Create Section'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Delete Section Dialog ─────────────────────────────────────────── */}
      <AlertDialog open={!!deleteSectionTarget} onOpenChange={() => setDeleteSectionTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <AlertDialogTitle>Delete Section</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="pl-[52px]">
              Are you sure you want to delete Section{' '}
              <strong>{deleteSectionTarget?.name}</strong>?
              {deleteSectionTarget && deleteSectionTarget._count && deleteSectionTarget._count.enrolls > 0 && (
                <span className="block mt-3 p-2.5 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-600 dark:text-red-400 font-semibold text-xs border border-red-100 dark:border-red-900/40">
                  {deleteSectionTarget._count.enrolls} student(s) are currently enrolled!
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="min-h-[44px]">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSection}
              disabled={deletingSection}
              className="bg-red-600 hover:bg-red-700 min-h-[44px]"
            >
              {deletingSection ? 'Deleting...' : 'Delete Section'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
