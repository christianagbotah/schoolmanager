'use client';

import { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import {
  BookOpen, Layers, Plus, Pencil, Trash2, Upload, Copy,
  List, ChevronDown, ChevronRight, Download, X
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────
interface SchoolClass {
  class_id: number;
  name: string;
  name_numeric: number;
  category: string;
  sections?: { section_id: number; name: string }[];
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
  class?: { class_id: number; name: string; name_numeric: number; category: string } | null;
  teacher?: { teacher_id: number; name: string } | null;
  section?: { section_id: number; name: string } | null;
}

interface BulkRow {
  name: string;
  teacher_id: string;
}

const CLASS_GROUPS = [
  { key: 'CRECHE', label: 'Creche', color: 'bg-amber-100 text-amber-800' },
  { key: 'NURSERY', label: 'Nursery', color: 'bg-pink-100 text-pink-800' },
  { key: 'KG', label: 'KG', color: 'bg-green-100 text-green-800' },
  { key: 'BASIC', label: 'Basic', color: 'bg-blue-100 text-blue-800' },
  { key: 'JHS', label: 'JHS', color: 'bg-purple-100 text-purple-800' },
];

// ── Page Component ─────────────────────────────────────────────────────
export default function SubjectsPage() {
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [subjectsLoading, setSubjectsLoading] = useState(false);

  // Subject data
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [subjectMeta, setSubjectMeta] = useState<{ year: string; term: number; sem: number; class_name: string; class_name_numeric: number; section_name: string } | null>(null);
  const [activeTab, setActiveTab] = useState('list');

  // Edit dialog
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<Subject | null>(null);
  const [editSaving, setEditSaving] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', class_id: '', teacher_id: '' });

  // Delete dialog
  const [deleteTarget, setDeleteTarget] = useState<Subject | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Bulk add rows
  const [bulkRows, setBulkRows] = useState<BulkRow[]>([{ name: '', teacher_id: '' }]);
  const [bulkSaving, setBulkSaving] = useState(false);

  // Import dialog
  const [importOpen, setImportOpen] = useState(false);
  const [importTargetClass, setImportTargetClass] = useState('');
  const [importing, setImporting] = useState(false);

  // ── Fetch Classes ─────────────────────────────────────────────────────
  const fetchClasses = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/classes');
      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
      setClasses(list);

      // Auto-expand all groups and select first class
      const groups = new Set<string>();
      list.forEach(c => groups.add(c.category));
      setExpandedGroups(groups);

      if (list.length > 0 && !selectedClassId) {
        setSelectedClassId(list[0].class_id);
      }
    } catch {
      toast.error('Failed to load classes');
    } finally {
      setLoading(false);
    }
  }, [selectedClassId]);

  // ── Fetch Subjects ────────────────────────────────────────────────────
  const fetchSubjects = useCallback(async (classId: number) => {
    setSubjectsLoading(true);
    try {
      const res = await fetch(`/api/admin/subjects?class_id=${classId}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setSubjects(data.subjects || []);
      setSubjectMeta({
        year: data.year || '',
        term: data.term || 0,
        sem: data.sem || 0,
        class_name: data.class_name || '',
        class_name_numeric: data.class_name_numeric || 0,
        section_name: data.section_name || '',
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load subjects';
      toast.error(msg);
      setSubjects([]);
    } finally {
      setSubjectsLoading(false);
    }
  }, []);

  // ── Fetch Teachers ────────────────────────────────────────────────────
  useEffect(() => {
    fetchClasses();
    fetch('/api/admin/teachers?limit=500')
      .then(r => r.json())
      .then(d => {
        const list = d.data || d;
        setTeachers(Array.isArray(list) ? list.map((t: Teacher) => ({ teacher_id: t.teacher_id, name: t.name })) : []);
      })
      .catch(() => {});
  }, [fetchClasses]);

  useEffect(() => {
    if (selectedClassId) fetchSubjects(selectedClassId);
  }, [selectedClassId, fetchSubjects]);

  // ── Class Group Logic ─────────────────────────────────────────────────
  const classesByGroup = classes.reduce<Record<string, SchoolClass[]>>((acc, c) => {
    if (!acc[c.category]) acc[c.category] = [];
    acc[c.category].push(c);
    return acc;
  }, {});

  const toggleGroup = (group: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(group)) next.delete(group);
      else next.add(group);
      return next;
    });
  };

  const getDisplayClassName = (c: SchoolClass) => {
    if (c.name_numeric > 0) return `${c.name} ${c.name_numeric}`;
    return c.name;
  };

  const getFullClassName = (c: SchoolClass) => {
    let displayName = getDisplayClassName(c);
    if (subjectMeta && c.class_id === selectedClassId && subjectMeta.section_name) {
      displayName += ` ${subjectMeta.section_name}`;
    }
    return displayName;
  };

  const activeClass = classes.find(c => c.class_id === selectedClassId);

  // ── Edit Handlers ─────────────────────────────────────────────────────
  const openEdit = (s: Subject) => {
    setEditing(s);
    setEditForm({
      name: s.name,
      class_id: s.class_id ? String(s.class_id) : '',
      teacher_id: s.teacher_id ? String(s.teacher_id) : '',
    });
    setEditOpen(true);
  };

  const handleEditSave = async () => {
    if (!editForm.name.trim()) { toast.error('Subject name is required'); return; }
    if (!editing) return;

    setEditSaving(true);
    try {
      const res = await fetch(`/api/admin/subjects/${editing.subject_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editForm.name,
          class_id: editForm.class_id,
          teacher_id: editForm.teacher_id || null,
          status: 1,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast.success('Subject updated successfully');
      setEditOpen(false);
      if (selectedClassId) fetchSubjects(selectedClassId);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Update failed';
      toast.error(msg);
    } finally {
      setEditSaving(false);
    }
  };

  // ── Delete Handler ────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/subjects/${deleteTarget.subject_id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast.success('Subject deleted successfully');
      setDeleteTarget(null);
      if (selectedClassId) fetchSubjects(selectedClassId);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Delete failed';
      toast.error(msg);
    } finally {
      setDeleting(false);
    }
  };

  // ── Bulk Add Handlers ─────────────────────────────────────────────────
  const addBulkRow = () => {
    setBulkRows(prev => [...prev, { name: '', teacher_id: '' }]);
  };

  const removeBulkRow = (index: number) => {
    if (bulkRows.length <= 1) {
      toast.error('At least one row is required');
      return;
    }
    setBulkRows(prev => prev.filter((_, i) => i !== index));
  };

  const updateBulkRow = (index: number, field: keyof BulkRow, value: string) => {
    setBulkRows(prev => prev.map((row, i) => i === index ? { ...row, [field]: value } : row));
  };

  const handleBulkSave = async () => {
    if (!selectedClassId) { toast.error('Please select a class'); return; }

    const validRows = bulkRows.filter(r => r.name.trim());
    if (validRows.length === 0) { toast.error('At least one subject name is required'); return; }

    setBulkSaving(true);
    try {
      const res = await fetch('/api/admin/subjects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          class_id: selectedClassId,
          subjects: validRows,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast.success(data.message || 'Subjects created successfully');
      setBulkRows([{ name: '', teacher_id: '' }]);
      fetchSubjects(selectedClassId);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create subjects';
      toast.error(msg);
    } finally {
      setBulkSaving(false);
    }
  };

  // ── Import Handler ────────────────────────────────────────────────────
  const handleImport = async () => {
    if (!selectedClassId || !importTargetClass) {
      toast.error('Please select a target class');
      return;
    }

    if (parseInt(importTargetClass) === selectedClassId) {
      toast.error('Please select a different class');
      return;
    }

    setImporting(true);
    try {
      const res = await fetch('/api/admin/subjects/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source_class_id: selectedClassId,
          target_class_id: importTargetClass,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast.success(data.message || 'Subjects imported successfully');
      setImportOpen(false);
      setImportTargetClass('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Import failed';
      toast.error(msg);
    } finally {
      setImporting(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Subject Management</h1>
            <p className="text-sm text-gray-500 mt-1">
              Manage subjects and teacher assignments per class
            </p>
          </div>
          <Button onClick={() => setActiveTab('add')} className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="w-4 h-4 mr-2" />Add Subject
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* ── Left Sidebar: Class Navigation ────────────────────── */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader className="pb-2">
                <h3 className="text-lg font-semibold text-gray-900">Classes</h3>
              </CardHeader>
              <CardContent className="p-2">
                <ul className="space-y-1 max-h-[70vh] overflow-y-auto">
                  {loading ? (
                    Array.from({ length: 8 }).map((_, i) => (
                      <Skeleton key={i} className="h-10 w-full" />
                    ))
                  ) : (
                    CLASS_GROUPS.map(group => {
                      const groupClasses = classesByGroup[group.key] || [];
                      if (groupClasses.length === 0) return null;
                      const isExpanded = expandedGroups.has(group.key);

                      return (
                        <li key={group.key}>
                          <button
                            onClick={() => toggleGroup(group.key)}
                            className="w-full flex items-center gap-2 px-3 py-2 text-left rounded-md hover:bg-gray-50 transition-colors"
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            )}
                            <Badge variant="outline" className={`text-[11px] font-semibold ${group.color}`}>
                              {group.label}
                            </Badge>
                            <span className="text-xs text-gray-400 ml-auto">{groupClasses.length}</span>
                          </button>
                          {isExpanded && (
                            <ul className="ml-2 mt-1 space-y-0.5 border-l-2 border-gray-100 pl-2">
                              {groupClasses.map(c => (
                                <li key={c.class_id}>
                                  <button
                                    onClick={() => setSelectedClassId(c.class_id)}
                                    className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-left text-sm transition-all ${
                                      selectedClassId === c.class_id
                                        ? 'bg-blue-600 text-white font-semibold shadow-sm'
                                        : 'text-gray-700 hover:bg-gray-100'
                                    }`}
                                  >
                                    <Layers className={`w-4 h-4 flex-shrink-0 ${selectedClassId === c.class_id ? 'text-white' : 'text-gray-400'}`} />
                                    <span>{getDisplayClassName(c)}</span>
                                  </button>
                                </li>
                              ))}
                            </ul>
                          )}
                        </li>
                      );
                    })
                  )}
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* ── Right Content ─────────────────────────────────────── */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader className="border-b">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    Subjects
                    {activeClass && (
                      <span className="text-gray-500 font-normal"> — {getFullClassName(activeClass)}</span>
                    )}
                  </h3>
                  {subjectMeta && (
                    <div className="ml-auto flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        Year: {subjectMeta.year}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {subjectMeta.class_name === 'JHSS' ? `Sem ${subjectMeta.sem}` : `Term ${subjectMeta.term}`}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {subjects.length} subject{subjects.length !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <div className="border-b px-4">
                    <TabsList className="h-10 bg-transparent p-0">
                      <TabsTrigger
                        value="list"
                        className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:shadow-none px-4"
                      >
                        <List className="w-4 h-4 mr-1.5" />
                        Subject List
                      </TabsTrigger>
                      <TabsTrigger
                        value="add"
                        className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:shadow-none px-4"
                      >
                        <Plus className="w-4 h-4 mr-1.5" />
                        Add Subject
                      </TabsTrigger>
                    </TabsList>
                  </div>

                  {/* ── Subject List Tab ────────────────────────────── */}
                  <TabsContent value="list">
                    <div className="p-4">
                      {subjectsLoading ? (
                        <div className="space-y-3">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Skeleton key={i} className="h-14 w-full" />
                          ))}
                        </div>
                      ) : !selectedClassId ? (
                        <div className="py-12 text-center text-gray-400">
                          <BookOpen className="w-10 h-10 mx-auto mb-2 opacity-50" />
                          <p>Select a class from the sidebar to view subjects</p>
                        </div>
                      ) : subjects.length === 0 ? (
                        <div className="py-12 text-center text-gray-400">
                          <BookOpen className="w-10 h-10 mx-auto mb-2 opacity-50" />
                          <p>No subjects found for this class.</p>
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-3"
                            onClick={() => setActiveTab('add')}
                          >
                            <Plus className="w-4 h-4 mr-1" />Add Subject
                          </Button>
                        </div>
                      ) : (
                        <>
                          {/* Desktop Table */}
                          <div className="hidden md:block overflow-x-auto">
                            <Table>
                              <TableHeader>
                                <TableRow className="bg-gray-50">
                                  <TableHead className="w-12">#</TableHead>
                                  <TableHead>Class</TableHead>
                                  <TableHead>Subject Name</TableHead>
                                  <TableHead>Teacher</TableHead>
                                  <TableHead className="text-right">Options</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {subjects.map((s, i) => (
                                  <TableRow key={s.subject_id} className="hover:bg-gray-50">
                                    <TableCell className="text-sm text-gray-500">{i + 1}</TableCell>
                                    <TableCell className="text-sm">
                                      {activeClass && (
                                        <span className="font-medium">{getFullClassName(activeClass)}</span>
                                      )}
                                    </TableCell>
                                    <TableCell className="font-semibold text-gray-900">{s.name}</TableCell>
                                    <TableCell className="text-sm">
                                      {s.teacher ? (
                                        <span className="text-blue-600 hover:text-blue-800">
                                          {s.teacher.name}
                                        </span>
                                      ) : (
                                        <span className="text-gray-400">Not assigned</span>
                                      )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                      <div className="flex items-center justify-end gap-1">
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-8 w-8 text-green-600"
                                          onClick={() => openEdit(s)}
                                        >
                                          <Pencil className="w-4 h-4" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-8 w-8 text-red-600"
                                          onClick={() => setDeleteTarget(s)}
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

                          {/* Mobile Cards */}
                          <div className="md:hidden divide-y">
                            {subjects.map((s) => (
                              <div key={s.subject_id} className="py-3 space-y-2">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <p className="font-semibold text-gray-900">{s.name}</p>
                                    <p className="text-xs text-gray-500">
                                      {activeClass ? getFullClassName(activeClass) : ''}
                                    </p>
                                  </div>
                                  <Badge variant={s.status === 1 ? 'default' : 'secondary'} className="text-[10px]">
                                    {s.status === 1 ? 'Active' : 'Inactive'}
                                  </Badge>
                                </div>
                                <p className="text-xs text-gray-500">
                                  Teacher: {s.teacher?.name || 'Not assigned'}
                                </p>
                                <div className="flex gap-2 pt-1">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex-1 h-8 text-xs"
                                    onClick={() => openEdit(s)}
                                  >
                                    <Pencil className="w-3 h-3 mr-1" />Edit
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 text-xs text-red-600 border-red-200 hover:bg-red-50"
                                    onClick={() => setDeleteTarget(s)}
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Import Actions */}
                          {subjects.length > 0 && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
                              {/* Copy Subjects to Another Class */}
                              <div className="bg-green-50 border-l-4 border-green-500 p-5 rounded-r-lg">
                                <h4 className="text-base font-bold text-green-900 mb-2 flex items-center gap-2">
                                  <Copy className="w-5 h-5" />
                                  Copy Subjects to Another Class
                                </h4>
                                <p className="text-sm text-green-800 mb-4">
                                  Create the same subjects for a different class
                                </p>
                                <div className="flex gap-2">
                                  <Select value={importTargetClass} onValueChange={setImportTargetClass}>
                                    <SelectTrigger className="flex-1">
                                      <SelectValue placeholder="Select Class" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {classes
                                        .filter(c => c.class_id !== selectedClassId)
                                        .map(c => (
                                          <SelectItem key={c.class_id} value={String(c.class_id)}>
                                            {getDisplayClassName(c)}
                                          </SelectItem>
                                        ))}
                                    </SelectContent>
                                  </Select>
                                  <Button
                                    onClick={handleImport}
                                    disabled={!importTargetClass || importing}
                                    className="bg-green-600 hover:bg-green-700 whitespace-nowrap"
                                  >
                                    <Copy className="w-4 h-4 mr-1" />
                                    {importing ? 'Copying...' : 'Add Subjects'}
                                  </Button>
                                </div>
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </TabsContent>

                  {/* ── Add Subject Tab ─────────────────────────────── */}
                  <TabsContent value="add">
                    <div className="p-6">
                      {/* Bulk Excel Import Section (UI placeholder) */}
                      <div className="bg-purple-50 border-l-4 border-purple-500 p-6 rounded-r-lg mb-8">
                        <h4 className="text-lg font-bold text-purple-900 mb-2 flex items-center gap-2">
                          <Upload className="w-6 h-6" />
                          Bulk Import from Excel
                        </h4>
                        <p className="text-sm text-purple-800 mb-5">
                          Upload an Excel file with multiple subjects at once
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <Button
                            variant="outline"
                            className="bg-white hover:bg-gray-50 justify-start"
                            disabled
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Download Template
                          </Button>
                          <Button
                            variant="outline"
                            className="bg-white hover:bg-gray-50 justify-start"
                            disabled
                          >
                            <Upload className="w-4 h-4 mr-2" />
                            Choose Excel File
                          </Button>
                          <Button
                            className="bg-purple-600 hover:bg-purple-700 justify-center"
                            disabled
                          >
                            <Upload className="w-4 h-4 mr-2" />
                            Upload &amp; Import
                          </Button>
                        </div>
                        <p className="text-xs text-purple-600 mt-3 italic">
                          Excel import coming soon. Use the form below to add subjects manually.
                        </p>
                      </div>

                      {/* Manual Subject Form */}
                      <div className="bg-white border border-gray-200 rounded-lg p-6">
                        <h4 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                          <Plus className="w-6 h-6 text-blue-600" />
                          Add Subject(s)
                          {activeClass && (
                            <span className="text-sm font-normal text-gray-500 ml-2">
                              for {getFullClassName(activeClass)}
                            </span>
                          )}
                        </h4>

                        {!selectedClassId ? (
                          <div className="py-8 text-center text-gray-400">
                            <p>Please select a class from the sidebar first</p>
                          </div>
                        ) : (
                          <>
                            <div className="overflow-x-auto">
                              <table className="w-full border border-gray-200 rounded-lg overflow-hidden">
                                <thead>
                                  <tr className="bg-gray-50">
                                    <th className="border border-gray-200 px-4 py-3 text-left text-sm font-semibold text-gray-700">
                                      Subject Name
                                    </th>
                                    <th className="border border-gray-200 px-4 py-3 text-left text-sm font-semibold text-gray-700">
                                      Teacher
                                    </th>
                                    <th className="border border-gray-200 px-4 py-3 text-center text-sm font-semibold text-gray-700 w-16">
                                      Action
                                    </th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {bulkRows.map((row, index) => (
                                    <tr key={index} className="hover:bg-gray-50/50">
                                      <td className="border border-gray-200 px-3 py-2">
                                        <Input
                                          placeholder="Enter subject name"
                                          value={row.name}
                                          onChange={(e) => updateBulkRow(index, 'name', e.target.value)}
                                          className="border-0 focus-visible:ring-0 shadow-none h-9"
                                        />
                                      </td>
                                      <td className="border border-gray-200 px-3 py-2">
                                        <Select
                                          value={row.teacher_id}
                                          onValueChange={(v) => updateBulkRow(index, 'teacher_id', v)}
                                        >
                                          <SelectTrigger className="border-0 focus:ring-0 shadow-none h-9">
                                            <SelectValue placeholder="Select Teacher" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="0">Select Teacher</SelectItem>
                                            {teachers.map(t => (
                                              <SelectItem key={t.teacher_id} value={String(t.teacher_id)}>
                                                {t.name}
                                              </SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                      </td>
                                      <td className="border border-gray-200 px-3 py-2 text-center">
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="icon"
                                          className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                                          onClick={() => removeBulkRow(index)}
                                        >
                                          <X className="w-4 h-4" />
                                        </Button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>

                            <div className="mt-6 flex flex-col sm:flex-row justify-between gap-3">
                              <Button
                                type="button"
                                variant="outline"
                                onClick={addBulkRow}
                                className="border-green-200 text-green-700 hover:bg-green-50"
                              >
                                <Plus className="w-4 h-4 mr-2" />
                                Add Row
                              </Button>
                              <Button
                                onClick={handleBulkSave}
                                disabled={bulkSaving || bulkRows.every(r => !r.name.trim())}
                                className="bg-blue-600 hover:bg-blue-700 min-w-[160px]"
                              >
                                {bulkSaving ? (
                                  <span className="flex items-center gap-2">
                                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Saving...
                                  </span>
                                ) : (
                                  <>
                                    <Upload className="w-4 h-4 mr-2" />
                                    Save All Subjects
                                  </>
                                )}
                              </Button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* ── Edit Subject Dialog ──────────────────────────────────── */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Subject</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Subject Name *</Label>
              <Input
                placeholder="e.g. Mathematics"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Class</Label>
              <Select value={editForm.class_id} onValueChange={(v) => setEditForm({ ...editForm, class_id: v })}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map(c => (
                    <SelectItem key={c.class_id} value={String(c.class_id)}>
                      {getDisplayClassName(c)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Teacher</Label>
              <Select value={editForm.teacher_id} onValueChange={(v) => setEditForm({ ...editForm, teacher_id: v })}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select teacher" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Select Teacher</SelectItem>
                  {teachers.map(t => (
                    <SelectItem key={t.teacher_id} value={String(t.teacher_id)}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button
              onClick={handleEditSave}
              disabled={editSaving || !editForm.name.trim()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {editSaving ? 'Updating...' : 'Update'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmation ──────────────────────────────────── */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Delete</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete subject &quot;{deleteTarget?.name}&quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
