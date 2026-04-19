'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  BookOpen,
  Plus,
  Trash2,
  Pencil,
  List,
  FileSpreadsheet,
  Upload,
  Download,
  Copy,
  Save,
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
  class?: { class_id: number; name: string; name_numeric?: number; category?: string } | null;
  teacher?: { teacher_id: number; name: string } | null;
  section?: { section_id: number; name: string } | null;
}

interface BulkRow {
  name: string;
  teacher_id: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────
function getClassName(c: SchoolClass) {
  return c.name_numeric > 0 ? `${c.name} ${c.name_numeric}` : c.name;
}

function getSubjectClassName(s: Subject) {
  if (!s.class) return '—';
  const c = s.class;
  const base = c.name_numeric ? `${c.name} ${c.name_numeric}` : c.name;
  const section = s.section?.name || '';
  return section ? `${base} ${section}` : base;
}

// ── Skeleton Components ───────────────────────────────────────────────────
function TableSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-14 w-full rounded-lg" />
      ))}
    </div>
  );
}

// ── Page Component ─────────────────────────────────────────────────────────
export default function SubjectsPage() {
  // Data
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [classFilter, setClassFilter] = useState('__all__');

  // Tab
  const [activeTab, setActiveTab] = useState('list');

  // Dialogs
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<Subject | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Edit form
  const [editForm, setEditForm] = useState({
    name: '',
    teacher_id: '',
    status: 0,
  });

  // Bulk add rows
  const [bulkRows, setBulkRows] = useState<BulkRow[]>([
    { name: '', teacher_id: '' },
  ]);
  const [bulkSaving, setBulkSaving] = useState(false);

  // Import target class
  const [importTargetClass, setImportTargetClass] = useState('');

  // ── Fetch Data ───────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [subjectsRes, classesRes, teachersRes] = await Promise.all([
        fetch('/api/admin/subjects'),
        fetch('/api/admin/classes'),
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

  // ── Filtered Subjects ─────────────────────────────────────────────────────
  const filteredSubjects = useMemo(() => {
    if (classFilter === '__all__') return subjects;
    return subjects.filter((s) => s.class_id === parseInt(classFilter));
  }, [subjects, classFilter]);

  // ── Bulk Row Helpers ─────────────────────────────────────────────────────
  const addBulkRow = () => {
    setBulkRows((prev) => [...prev, { name: '', teacher_id: '' }]);
  };

  const removeBulkRow = (index: number) => {
    if (bulkRows.length <= 1) {
      toast.error('At least one row is required');
      return;
    }
    setBulkRows((prev) => prev.filter((_, i) => i !== index));
  };

  const updateBulkRow = (index: number, field: keyof BulkRow, value: string) => {
    setBulkRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row))
    );
  };

  const saveBulk = async () => {
    const validRows = bulkRows.filter((r) => r.name.trim());
    if (validRows.length === 0) {
      toast.error('At least one subject name is required');
      return;
    }

    if (classFilter === '__all__') {
      toast.error('Please select a class first');
      return;
    }

    setBulkSaving(true);
    try {
      const res = await fetch('/api/admin/subjects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          class_id: parseInt(classFilter),
          subjects: validRows.map((r) => ({
            name: r.name.trim(),
            teacher_id: r.teacher_id || null,
          })),
        }),
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      toast.success(data.message || 'Subjects created');
      setBulkRows([{ name: '', teacher_id: '' }]);
      setActiveTab('list');
      fetchData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save';
      toast.error(msg);
    } finally {
      setBulkSaving(false);
    }
  };

  // ── Import Handlers ──────────────────────────────────────────────────────
  const handleMassImport = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/subjects/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mass' }),
      });
      const data = await res.json();
      if (data.status === 'success') {
        toast.success(data.message);
        fetchData();
      } else {
        toast.error(data.message || 'Import failed');
      }
    } catch {
      toast.error('Import failed');
    } finally {
      setSaving(false);
    }
  };

  const handleClassImport = async () => {
    if (!importTargetClass || importTargetClass === '__none__') {
      toast.error('Please select a target class');
      return;
    }
    if (classFilter === '__all__') {
      toast.error('Please select a source class first');
      return;
    }
    if (importTargetClass === classFilter) {
      toast.error('Please select a different target class');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/admin/subjects/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'copy',
          source_class_id: parseInt(classFilter),
          target_class_id: parseInt(importTargetClass),
        }),
      });
      const data = await res.json();
      if (data.status === 'success') {
        toast.success(data.message);
        setImportTargetClass('');
      } else {
        toast.error(data.message || 'Copy failed');
      }
    } catch {
      toast.error('Copy failed');
    } finally {
      setSaving(false);
    }
  };

  // ── Edit Helpers ─────────────────────────────────────────────────────────
  const openEdit = (s: Subject) => {
    setSelected(s);
    setEditForm({
      name: s.name,
      teacher_id: s.teacher_id ? String(s.teacher_id) : '',
      status: s.status,
    });
    setEditOpen(true);
  };

  const handleEditSave = async () => {
    if (!selected || !editForm.name.trim()) {
      toast.error('Subject name is required');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/admin/subjects/${selected.subject_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editForm.name,
          teacher_id: editForm.teacher_id
            ? parseInt(editForm.teacher_id)
            : null,
          status: editForm.status,
        }),
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      toast.success('Subject updated');
      setEditOpen(false);
      fetchData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/subjects/${selected.subject_id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
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
        <div className="space-y-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-12 w-full max-w-md" />
          <div className="bg-white rounded-xl border border-slate-200/60 p-6">
            <TableSkeleton />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header - matching CI3 gradient header */}
        <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-xl shadow-lg p-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
            <BookOpen className="w-7 h-7" />
            Subject Management
          </h2>
        </div>

        {/* Tabbed Content - matching CI3 tab layout */}
        <div className="bg-white rounded-xl shadow-lg border border-slate-200/60 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            {/* Tab Headers */}
            <div className="border-b border-slate-200">
              <TabsList className="w-full h-auto bg-transparent p-0 rounded-none">
                <TabsTrigger
                  value="list"
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-4 text-base font-semibold rounded-none border-b-2 border-transparent data-[state=active]:border-emerald-600 data-[state=active]:text-emerald-600 data-[state=active]:bg-slate-50 data-[state=active]:shadow-none text-slate-600 hover:text-emerald-600 hover:bg-slate-50 transition-all"
                >
                  <List className="w-5 h-5" />
                  Subject List
                </TabsTrigger>
                <TabsTrigger
                  value="add"
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-4 text-base font-semibold rounded-none border-b-2 border-transparent data-[state=active]:border-emerald-600 data-[state=active]:text-emerald-600 data-[state=active]:bg-slate-50 data-[state=active]:shadow-none text-slate-600 hover:text-emerald-600 hover:bg-slate-50 transition-all"
                >
                  <Plus className="w-5 h-5" />
                  Add Subject
                </TabsTrigger>
              </TabsList>
            </div>

            {/* ═══ LIST TAB ═══ */}
            <TabsContent value="list" className="m-0">
              <div className="p-4 sm:p-6">
                {/* Class Filter - matching CI3 class selector at top */}
                <div className="flex flex-col sm:flex-row gap-3 mb-6">
                  <div className="flex-1 max-w-xs">
                    <Select value={classFilter} onValueChange={setClassFilter}>
                      <SelectTrigger className="min-h-[44px]">
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
                  {classFilter !== '__all__' && (
                    <Button
                      variant="outline"
                      onClick={() => setActiveTab('add')}
                      className="bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100 min-h-[44px]"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Subject to this Class
                    </Button>
                  )}
                </div>

                {/* Subjects Table - matching CI3 columns: Class, Subject Name, Teacher, Options */}
                {filteredSubjects.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center">
                        <BookOpen className="w-8 h-8 text-slate-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-500 text-base">
                          {classFilter !== '__all__'
                            ? 'No subjects found for this class'
                            : 'No subjects yet'}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          {classFilter !== '__all__'
                            ? 'Switch to the Add Subject tab to create one'
                            : 'Select a class to view its subjects'}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Desktop Table */}
                    <div className="hidden md:block overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-slate-50 hover:bg-slate-50">
                            <TableHead className="text-xs font-semibold text-slate-600">
                              Class
                            </TableHead>
                            <TableHead className="text-xs font-semibold text-slate-600">
                              Subject Name
                            </TableHead>
                            <TableHead className="text-xs font-semibold text-slate-600">
                              Teacher
                            </TableHead>
                            <TableHead className="text-xs font-semibold text-slate-600 text-right">
                              Options
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredSubjects.map((s) => (
                            <TableRow
                              key={s.subject_id}
                              className="hover:bg-slate-50/50 transition-colors"
                            >
                              <TableCell className="text-sm text-slate-600">
                                {getSubjectClassName(s)}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                                    <BookOpen className="w-4 h-4 text-emerald-600" />
                                  </div>
                                  <span className="font-semibold text-sm text-slate-900">
                                    {s.name}
                                  </span>
                                  {s.status === 1 && (
                                    <Badge className="text-[10px] bg-emerald-100 text-emerald-700 border-0">
                                      Core
                                    </Badge>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-sm text-slate-600">
                                {s.teacher?.name || (
                                  <span className="text-slate-400">Not assigned</span>
                                )}
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
                                    {getSubjectClassName(s)}
                                  </p>
                                </div>
                                {s.status === 1 && (
                                  <Badge className="text-[10px] bg-emerald-100 text-emerald-700 border-0 flex-shrink-0">
                                    Core
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-slate-500 mt-1">
                                Teacher: {s.teacher?.name || 'Not assigned'}
                              </p>
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

                {/* Import Actions - matching CI3 import section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                  {/* Mass Import */}
                  <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-r-lg">
                    <h4 className="text-lg font-bold text-blue-900 mb-2 flex items-center gap-2">
                      <Upload className="w-5 h-5" />
                      Import All Subjects (Academic Year)
                    </h4>
                    <p className="text-sm text-blue-800 mb-4 leading-relaxed">
                      Import all subjects from the previous academic year for all classes
                    </p>
                    <Button
                      onClick={handleMassImport}
                      disabled={saving}
                      className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white min-h-[44px]"
                    >
                      {saving ? (
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                      ) : (
                        <Download className="w-4 h-4 mr-2" />
                      )}
                      Import All Subjects
                    </Button>
                  </div>

                  {/* Class-Specific Copy */}
                  {classFilter !== '__all__' && filteredSubjects.length > 0 && (
                    <div className="bg-emerald-50 border-l-4 border-emerald-500 p-6 rounded-r-lg">
                      <h4 className="text-lg font-bold text-emerald-900 mb-2 flex items-center gap-2">
                        <Copy className="w-5 h-5" />
                        Copy Subjects to Another Class
                      </h4>
                      <p className="text-sm text-emerald-800 mb-4 leading-relaxed">
                        Create the same subjects for a different class
                      </p>
                      <div className="flex gap-2">
                        <Select
                          value={importTargetClass}
                          onValueChange={setImportTargetClass}
                        >
                          <SelectTrigger className="flex-1 min-h-[44px]">
                            <SelectValue placeholder="Select Target Class" />
                          </SelectTrigger>
                          <SelectContent className="max-h-60">
                            {classes
                              .filter(
                                (c) => String(c.class_id) !== classFilter
                              )
                              .map((c) => (
                                <SelectItem
                                  key={c.class_id}
                                  value={String(c.class_id)}
                                >
                                  {getClassName(c)}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                        <Button
                          onClick={handleClassImport}
                          disabled={saving || !importTargetClass}
                          className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white whitespace-nowrap min-h-[44px]"
                        >
                          {saving ? (
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* ═══ ADD TAB ═══ */}
            <TabsContent value="add" className="m-0">
              <div className="p-4 sm:p-8">
                {/* Bulk Excel Import Section - matching CI3 */}
                <div className="bg-violet-50 border-l-4 border-violet-500 p-6 rounded-r-lg mb-8">
                  <h4 className="text-xl font-bold text-violet-900 mb-3 flex items-center gap-2">
                    <FileSpreadsheet className="w-6 h-6" />
                    Bulk Import from Excel
                  </h4>
                  <p className="text-sm text-violet-800 mb-5 leading-relaxed">
                    Upload an Excel file with multiple subjects at once
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Button
                      variant="outline"
                      className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white border-0 min-h-[44px]"
                      onClick={() => {
                        toast.info('Template download - contact administrator');
                      }}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download Template
                    </Button>
                    <label className="flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-semibold rounded-lg min-h-[44px] cursor-pointer">
                      <Upload className="w-4 h-4" />
                      Choose Excel File
                      <input
                        type="file"
                        accept=".xlsx,.xls"
                        className="hidden"
                        onChange={() => {
                          toast.info('Excel upload - contact administrator');
                        }}
                      />
                    </label>
                    <Button
                      variant="outline"
                      className="bg-gradient-to-r from-violet-600 to-violet-700 hover:from-violet-700 hover:to-violet-800 text-white border-0 min-h-[44px]"
                      onClick={() => {
                        toast.info('Excel upload - contact administrator');
                      }}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Upload & Import
                    </Button>
                  </div>
                </div>

                {/* Class Selector for Bulk Add */}
                <div className="bg-white border border-slate-200 rounded-lg p-6 mb-6">
                  <div className="max-w-xs">
                    <Label className="text-sm font-bold text-slate-700 mb-2 block">
                      Select Class *
                    </Label>
                    <Select value={classFilter} onValueChange={setClassFilter}>
                      <SelectTrigger className="min-h-[44px]">
                        <SelectValue placeholder="Select Class" />
                      </SelectTrigger>
                      <SelectContent className="max-h-60">
                        {classes.map((c) => (
                          <SelectItem key={c.class_id} value={String(c.class_id)}>
                            {getClassName(c)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {classFilter === '__all__' && (
                      <p className="text-xs text-red-500 mt-2">
                        Please select a class to add subjects
                      </p>
                    )}
                  </div>
                </div>

                {/* Multi-Row Subject Form - matching CI3 subjects_table */}
                <div className="bg-white border border-slate-200 rounded-lg p-6">
                  <h4 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                    <Plus className="w-6 h-6" />
                    Add Subject(s)
                  </h4>

                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50 hover:bg-slate-50">
                          <TableHead className="text-xs font-semibold text-slate-600">
                            Subject Name
                          </TableHead>
                          <TableHead className="text-xs font-semibold text-slate-600">
                            Teacher
                          </TableHead>
                          <TableHead className="text-xs font-semibold text-slate-600 text-center w-[80px]">
                            Action
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {bulkRows.map((row, idx) => (
                          <TableRow key={idx}>
                            <TableCell>
                              <Input
                                value={row.name}
                                onChange={(e) =>
                                  updateBulkRow(idx, 'name', e.target.value)
                                }
                                placeholder="Enter subject name"
                                className="min-h-[44px]"
                              />
                            </TableCell>
                            <TableCell>
                              <Select
                                value={row.teacher_id}
                                onValueChange={(v) =>
                                  updateBulkRow(idx, 'teacher_id', v)
                                }
                              >
                                <SelectTrigger className="min-h-[44px]">
                                  <SelectValue placeholder="Select Teacher" />
                                </SelectTrigger>
                                <SelectContent className="max-h-60">
                                  <SelectItem value="__none__">
                                    No Teacher
                                  </SelectItem>
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
                            </TableCell>
                            <TableCell className="text-center">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 min-w-[32px] text-red-500 hover:text-red-700 hover:bg-red-50"
                                onClick={() => removeBulkRow(idx)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  <div className="mt-6 flex flex-col sm:flex-row justify-between gap-3">
                    <Button
                      variant="outline"
                      onClick={addBulkRow}
                      className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white border-0 min-h-[44px]"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Row
                    </Button>

                    <Button
                      onClick={saveBulk}
                      disabled={
                        bulkSaving ||
                        classFilter === '__all__' ||
                        bulkRows.every((r) => !r.name.trim())
                      }
                      className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white min-h-[44px] px-8"
                    >
                      {bulkSaving ? (
                        <span className="flex items-center gap-2">
                          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Saving...
                        </span>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Save All Subjects
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* ── Edit Dialog (matching CI3 modal_edit_subject) ─────────── */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="w-5 h-5 text-emerald-600" />
              Edit Subject
            </DialogTitle>
            <DialogDescription>
              Update subject details below
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label className="text-xs font-semibold">Name *</Label>
              <Input
                value={editForm.name}
                onChange={(e) =>
                  setEditForm({ ...editForm, name: e.target.value })
                }
                placeholder="Subject name"
                className="min-h-[44px]"
              />
            </div>

            <div className="grid gap-2">
              <Label className="text-xs font-semibold">Teacher</Label>
              <Select
                value={editForm.teacher_id || '__none__'}
                onValueChange={(v) =>
                  setEditForm({ ...editForm, teacher_id: v })
                }
              >
                <SelectTrigger className="min-h-[44px]">
                  <SelectValue placeholder="Select Teacher" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  <SelectItem value="__none__">No Teacher</SelectItem>
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

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="edit-core-subject"
                checked={editForm.status === 1}
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    status: e.target.checked ? 1 : 0,
                  })
                }
                className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <Label htmlFor="edit-core-subject" className="text-sm font-medium">
                It is a core subject
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditOpen(false)}
              className="min-h-[44px]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleEditSave}
              disabled={saving || !editForm.name.trim()}
              className="bg-emerald-600 hover:bg-emerald-700 min-h-[44px]"
            >
              {saving ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Updating...
                </span>
              ) : (
                'Edit Subject'
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
              <strong>{selected?.name}</strong>? This action cannot be undone
              and will remove the subject from all associated classes.
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
