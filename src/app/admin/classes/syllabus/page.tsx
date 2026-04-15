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
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { PlusCircle, Trash2, Download, BookOpen, Layers, FileText, Upload } from 'lucide-react';
import Link from 'next/link';

interface SchoolClass {
  class_id: number;
  name: string;
  name_numeric: number;
  category: string;
}

interface Subject {
  subject_id: number;
  name: string;
  class_id?: number | null;
}

interface Syllabus {
  syllabus_id: number;
  academic_syllabus_code: string;
  title: string;
  description: string;
  class_id: number | null;
  subject_id: number | null;
  uploader_type: string;
  uploader_id: number;
  year: string;
  term: string;
  timestamp: number;
  file_name: string;
  class?: { class_id: number; name: string; name_numeric: number } | null;
  subject?: { subject_id: number; name: string } | null;
}

export default function SyllabusPage() {
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [syllabus, setSyllabus] = useState<Syllabus[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [syllabusLoading, setSyllabusLoading] = useState(false);

  // Add form
  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    class_id: '',
    subject_id: '',
    file_name: '',
  });

  // Delete
  const [deleteTarget, setDeleteTarget] = useState<Syllabus | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchClasses = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/classes');
      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
      setClasses(list);
      if (list.length > 0 && !selectedClassId) {
        setSelectedClassId(list[0].class_id);
      }
    } catch {
      toast.error('Failed to load classes');
    } finally {
      setLoading(false);
    }
  }, [selectedClassId]);

  const fetchSyllabus = useCallback(async (classId: number) => {
    setSyllabusLoading(true);
    try {
      const res = await fetch(`/api/admin/syllabus?class_id=${classId}`);
      const data = await res.json();
      setSyllabus(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Failed to load syllabus');
    } finally {
      setSyllabusLoading(false);
    }
  }, []);

  const fetchSubjects = useCallback(async (classId?: number) => {
    try {
      const url = classId ? `/api/subjects?class_id=${classId}` : '/api/subjects';
      const res = await fetch(url);
      const data = await res.json();
      setSubjects(Array.isArray(data) ? data : []);
    } catch {
      setSubjects([]);
    }
  }, []);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  useEffect(() => {
    if (selectedClassId) {
      fetchSyllabus(selectedClassId);
      fetchSubjects(selectedClassId);
    }
  }, [selectedClassId, fetchSyllabus, fetchSubjects]);

  const handleClassClick = (classId: number) => {
    setSelectedClassId(classId);
  };

  const openAdd = () => {
    setFormData({
      title: '',
      description: '',
      class_id: selectedClassId ? String(selectedClassId) : '',
      subject_id: '',
      file_name: '',
    });
    setFormOpen(true);
  };

  const handleSave = async () => {
    if (!formData.title) { toast.error('Title is required'); return; }
    if (!formData.class_id) { toast.error('Class is required'); return; }
    if (!formData.subject_id) { toast.error('Subject is required'); return; }

    setSaving(true);
    try {
      const res = await fetch('/api/admin/syllabus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast.success('Syllabus created successfully');
      setFormOpen(false);
      fetchSyllabus(parseInt(formData.class_id, 10));
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
      const res = await fetch(`/api/admin/syllabus/${deleteTarget.syllabus_id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast.success('Syllabus deleted');
      setDeleteTarget(null);
      if (selectedClassId) fetchSyllabus(selectedClassId);
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

  const formatDate = (timestamp: number) => {
    if (!timestamp) return '—';
    return new Date(timestamp * 1000).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const truncate = (str: string, len: number) => {
    if (!str) return '—';
    return str.length > len ? str.substring(0, len) + '...' : str;
  };

  // Get unique classes from syllabus for sidebar badge
  const activeClass = classes.find(c => c.class_id === selectedClassId);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Academic Syllabus</h1>
            <p className="text-sm text-gray-500 mt-1">Upload and manage syllabus documents per class and subject</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/classes"><BookOpen className="w-4 h-4 mr-1" />Classes</Link>
            </Button>
            <Button onClick={openAdd} className="bg-blue-600 hover:bg-blue-700">
              <PlusCircle className="w-4 h-4 mr-2" />Add Academic Syllabus
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Class Sidebar - Vertical Tabs like CI3 */}
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
                        <span className="font-medium text-sm">Class {getDisplayClassName(c)}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Syllabus Content */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader className="border-b">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    Syllabus {activeClass && <span className="text-gray-500">— Class {getDisplayClassName(activeClass)}</span>}
                  </h3>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {syllabusLoading ? (
                  <div className="p-6 space-y-3">
                    {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
                  </div>
                ) : syllabus.length === 0 ? (
                  <div className="p-12 text-center text-gray-400">
                    <FileText className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <p>No syllabus documents found for this class.</p>
                    <Button variant="outline" size="sm" className="mt-3" onClick={openAdd}>
                      <PlusCircle className="w-4 h-4 mr-1" />Upload Syllabus
                    </Button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50">
                          <TableHead className="w-12">#</TableHead>
                          <TableHead>Title</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Subject</TableHead>
                          <TableHead>Year</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>File</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {syllabus.map((s, i) => (
                          <TableRow key={s.syllabus_id} className="hover:bg-gray-50">
                            <TableCell className="text-sm text-gray-500">{i + 1}</TableCell>
                            <TableCell className="font-semibold text-gray-900">{s.title}</TableCell>
                            <TableCell className="text-sm text-gray-600 max-w-[200px] truncate">{s.description || '—'}</TableCell>
                            <TableCell className="text-sm">
                              {s.subject ? (
                                <Badge variant="outline" className="text-xs">{s.subject.name}</Badge>
                              ) : '—'}
                            </TableCell>
                            <TableCell className="text-sm">{s.year || '—'}</TableCell>
                            <TableCell className="text-sm">{formatDate(s.timestamp)}</TableCell>
                            <TableCell className="text-sm max-w-[120px] truncate" title={s.file_name}>
                              {truncate(s.file_name, 20)}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                {s.file_name && (
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600" title="Download">
                                    <Download className="w-4 h-4" />
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-red-600"
                                  onClick={() => setDeleteTarget(s)}
                                  title="Delete"
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
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Add Syllabus Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Upload Academic Syllabus</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Title *</Label>
              <Input
                placeholder="Syllabus title"
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                placeholder="Brief description of the syllabus content"
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                className="mt-1"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Class *</Label>
                <Select value={formData.class_id} onValueChange={v => setFormData({ ...formData, class_id: v })}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select class" /></SelectTrigger>
                  <SelectContent>
                    {classes.map(c => (
                      <SelectItem key={c.class_id} value={String(c.class_id)}>
                        Class {getDisplayClassName(c)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Subject *</Label>
                <Select value={formData.subject_id} onValueChange={v => setFormData({ ...formData, subject_id: v })}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select subject" /></SelectTrigger>
                  <SelectContent>
                    {subjects.length > 0 ? (
                      subjects.map(s => (
                        <SelectItem key={s.subject_id} value={String(s.subject_id)}>{s.name}</SelectItem>
                      ))
                    ) : (
                      <SelectItem value="none" disabled>No subjects available</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>File Name</Label>
              <div className="flex items-center gap-2 mt-1">
                <Input
                  placeholder="e.g., term1_syllabus.pdf"
                  value={formData.file_name}
                  onChange={e => setFormData({ ...formData, file_name: e.target.value })}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Enter the uploaded file name or leave blank if no file.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button
              onClick={handleSave}
              disabled={saving || !formData.title || !formData.class_id || !formData.subject_id}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {saving ? 'Saving...' : 'Upload Syllabus'}
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
              Are you sure you want to delete &quot;{deleteTarget?.title}&quot;? This action cannot be undone.
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
