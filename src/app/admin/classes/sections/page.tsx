'use client';

import { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { PlusCircle, Pencil, Trash2, BookOpen, Layers } from 'lucide-react';
import Link from 'next/link';

interface SchoolClass {
  class_id: number;
  name: string;
  name_numeric: number;
  category: string;
}

interface Section {
  section_id: number;
  name: string;
  nick_name: string;
  numeric_name: number;
  teacher_id: number | null;
  class_id: number | null;
  teacher?: { teacher_id: number; name: string } | null;
  class?: { class_id: number; name: string; name_numeric: number; category: string } | null;
  _count?: { enrolls: number };
}

interface Teacher {
  teacher_id: number;
  name: string;
}

export default function SectionsPage() {
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [sectionsLoading, setSectionsLoading] = useState(false);

  // Form
  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<Section | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    nick_name: '',
    numeric_name: '',
    teacher_id: '',
    class_id: '',
  });

  // Delete
  const [deleteTarget, setDeleteTarget] = useState<Section | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchClasses = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/classes');
      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
      setClasses(list);
      // Auto-select first class
      if (list.length > 0 && !selectedClassId) {
        setSelectedClassId(list[0].class_id);
      }
    } catch {
      toast.error('Failed to load classes');
    } finally {
      setLoading(false);
    }
  }, [selectedClassId]);

  const fetchSections = useCallback(async (classId: number) => {
    setSectionsLoading(true);
    try {
      const res = await fetch(`/api/admin/sections?class_id=${classId}`);
      const data = await res.json();
      setSections(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Failed to load sections');
    } finally {
      setSectionsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClasses();
    fetch('/api/admin/teachers')
      .then(r => r.json())
      .then(d => {
        const list = d.data || d;
        setTeachers(Array.isArray(list) ? list.map((t: Teacher) => ({ teacher_id: t.teacher_id, name: t.name })) : []);
      })
      .catch(() => {});
  }, [fetchClasses]);

  useEffect(() => {
    if (selectedClassId) fetchSections(selectedClassId);
  }, [selectedClassId, fetchSections]);

  const handleClassClick = (classId: number) => {
    setSelectedClassId(classId);
  };

  const openAdd = () => {
    setEditing(null);
    setFormData({
      name: '',
      nick_name: '',
      numeric_name: '',
      teacher_id: '',
      class_id: selectedClassId ? String(selectedClassId) : '',
    });
    setFormOpen(true);
  };

  const openEdit = (s: Section) => {
    setEditing(s);
    setFormData({
      name: s.name,
      nick_name: s.nick_name || '',
      numeric_name: String(s.numeric_name),
      teacher_id: s.teacher_id ? String(s.teacher_id) : '',
      class_id: s.class_id ? String(s.class_id) : '',
    });
    setFormOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name) { toast.error('Section name is required'); return; }
    if (!formData.class_id) { toast.error('Class is required'); return; }

    setSaving(true);
    try {
      const url = editing
        ? `/api/admin/sections/${editing.section_id}`
        : '/api/admin/sections';
      const res = await fetch(url, {
        method: editing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast.success(editing ? 'Section updated' : 'Section created');
      setFormOpen(false);
      fetchSections(parseInt(formData.class_id, 10));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Operation failed';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/sections/${deleteTarget.section_id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast.success('Section deleted');
      setDeleteTarget(null);
      if (selectedClassId) fetchSections(selectedClassId);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Delete failed';
      toast.error(msg);
    } finally {
      setDeleting(false);
    }
  };

  const getDisplayClassName = (c: SchoolClass) => {
    if (c.name_numeric > 0) return `${c.name} ${c.name_numeric}`;
    return c.name;
  };

  const activeClass = classes.find(c => c.class_id === selectedClassId);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Manage Sections</h1>
            <p className="text-sm text-gray-500 mt-1">Manage class sections and assign teachers</p>
          </div>
          <Button onClick={openAdd} className="bg-blue-600 hover:bg-blue-700">
            <PlusCircle className="w-4 h-4 mr-2" />Add New Section
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Class List Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader className="pb-2">
                <h3 className="text-lg font-semibold text-gray-900">Classes</h3>
              </CardHeader>
              <CardContent className="p-2">
                <ul className="space-y-1 max-h-[60vh] overflow-y-auto">
                  {loading ? (
                    Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)
                  ) : classes.map(c => (
                    <li key={c.class_id}>
                      <button
                        onClick={() => handleClassClick(c.class_id)}
                        className={`w-full flex items-center gap-2 px-4 py-3 rounded-lg text-left transition-all ${
                          selectedClassId === c.class_id
                            ? 'bg-blue-600 text-white font-semibold'
                            : 'text-gray-900 hover:bg-gray-100'
                        }`}
                      >
                        <Layers className="w-4 h-4 flex-shrink-0" />
                        <span className="font-medium text-sm">{getDisplayClassName(c)}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Sections Content */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader className="border-b">
                <div className="flex items-center gap-2">
                  <Layers className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    Sections {activeClass && <span className="text-gray-500">— {getDisplayClassName(activeClass)}</span>}
                  </h3>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {sectionsLoading ? (
                  <div className="p-6 space-y-3">
                    {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
                  </div>
                ) : sections.length === 0 ? (
                  <div className="p-12 text-center text-gray-400">
                    <BookOpen className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <p>No sections found for this class.</p>
                    <Button variant="outline" size="sm" className="mt-3" onClick={openAdd}>
                      <PlusCircle className="w-4 h-4 mr-1" />Add Section
                    </Button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50">
                          <TableHead className="w-12">#</TableHead>
                          <TableHead>Section Name</TableHead>
                          <TableHead>Nick Name</TableHead>
                          <TableHead>Teacher</TableHead>
                          <TableHead>Students</TableHead>
                          <TableHead className="text-right">Options</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sections.map((s, i) => (
                          <TableRow key={s.section_id} className="hover:bg-gray-50">
                            <TableCell className="text-sm text-gray-500">{i + 1}</TableCell>
                            <TableCell className="font-semibold text-gray-900">{s.name}</TableCell>
                            <TableCell className="text-sm">{s.nick_name || '—'}</TableCell>
                            <TableCell className="text-sm">
                              {s.teacher?.name || (
                                <span className="text-gray-400">Not assigned</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
                                {s._count?.enrolls || 0}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600" onClick={() => openEdit(s)}>
                                  <Pencil className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600" onClick={() => setDeleteTarget(s)}>
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Section' : 'Add Section'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Section Name *</Label>
              <Input
                placeholder="e.g. A"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value.toUpperCase() })}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Nick Name</Label>
              <Input
                placeholder="e.g. Alpha"
                value={formData.nick_name}
                onChange={e => setFormData({ ...formData, nick_name: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Numeric Order</Label>
              <Input
                type="number"
                placeholder="1"
                value={formData.numeric_name}
                onChange={e => setFormData({ ...formData, numeric_name: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Class *</Label>
              <Select value={formData.class_id} onValueChange={v => setFormData({ ...formData, class_id: v })}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select class" /></SelectTrigger>
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
              <Label>Section Teacher</Label>
              <Select value={formData.teacher_id} onValueChange={v => setFormData({ ...formData, teacher_id: v })}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select teacher" /></SelectTrigger>
                <SelectContent>
                  {teachers.map(t => (
                    <SelectItem key={t.teacher_id} value={String(t.teacher_id)}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving || !formData.name || !formData.class_id} className="bg-blue-600 hover:bg-blue-700">
              {saving ? 'Saving...' : editing ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Delete</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete section &quot;{deleteTarget?.name}&quot;? This action cannot be undone.
              {deleteTarget && deleteTarget._count && deleteTarget._count.enrolls > 0 && (
                <span className="block mt-2 text-red-600 font-semibold">
                  Warning: {deleteTarget._count.enrolls} student(s) enrolled!
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-red-600 hover:bg-red-700">
              {deleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
