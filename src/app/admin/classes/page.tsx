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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { List, PlusCircle, Upload, Users, Pencil, Trash2, Eye, BookOpen, UploadCloud, Info, Download } from 'lucide-react';
import Link from 'next/link';

// G.E.S Curriculum class names
const CLASS_NAMES = ['CRECHE', 'NURSERY', 'KG', 'BASIC', 'JHS'];
const CATEGORIES = ['Pre-School', 'Lower Primary', 'Upper Primary', 'JHS'];

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

interface Teacher {
  teacher_id: number;
  name: string;
  teacher_code?: string;
}

export default function ClassesPage() {
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [allClasses, setAllClasses] = useState<SchoolClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [activeTab, setActiveTab] = useState('list');

  // Form state
  const [formOpen, setFormOpen] = useState(false);
  const [formSaving, setFormSaving] = useState(false);
  const [editing, setEditing] = useState<SchoolClass | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    name_numeric: '',
    category: '',
    teacher_id: '',
    section_name: '',
  });

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<SchoolClass | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Bulk upload state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const fetchClasses = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/classes');
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setClasses(Array.isArray(data) ? data : []);
      setAllClasses(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Failed to load classes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClasses();
    fetch('/api/admin/teachers')
      .then(r => r.json())
      .then(d => {
        const list = d.data || d;
        setTeachers(Array.isArray(list) ? list.map((t: Teacher) => ({ teacher_id: t.teacher_id, name: t.name, teacher_code: t.teacher_code })) : []);
      })
      .catch(() => {});
  }, [fetchClasses]);

  // Count classes by category
  const getCategoryCount = (cat: string) => allClasses.filter(c => c.category === cat).length;
  const getDisplayClassName = (c: SchoolClass) => {
    if (c.name_numeric > 0) return `${c.name} ${c.name_numeric}`;
    return c.name;
  };

  const openAddForm = () => {
    setEditing(null);
    setFormData({ name: '', name_numeric: '', category: '', teacher_id: '', section_name: '' });
    setFormOpen(true);
  };

  const openEditForm = (c: SchoolClass) => {
    setEditing(c);
    setFormData({
      name: c.name,
      name_numeric: String(c.name_numeric),
      category: c.category,
      teacher_id: c.teacher ? String(c.teacher.teacher_id) : '',
      section_name: '',
    });
    setFormOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name) { toast.error('Class name is required'); return; }
    if (!formData.category) { toast.error('Category is required'); return; }

    setFormSaving(true);
    try {
      const url = editing
        ? `/api/admin/classes/${editing.class_id}`
        : '/api/admin/classes';
      const method = editing ? 'PUT' : 'POST';
      const body = editing
        ? { name: formData.name, name_numeric: formData.name_numeric, category: formData.category, teacher_id: formData.teacher_id }
        : { name: formData.name, name_numeric: formData.name_numeric, category: formData.category, teacher_id: formData.teacher_id, section_name: formData.section_name || 'A' };

      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast.success(editing ? 'Class updated successfully' : 'Class created successfully');
      setFormOpen(false);
      fetchClasses();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Operation failed';
      toast.error(msg);
    } finally {
      setFormSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/classes/${deleteTarget.class_id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast.success('Class deleted successfully');
      setDeleteTarget(null);
      fetchClasses();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Delete failed';
      toast.error(msg);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Tabs: Class List, Add Class, Bulk Upload */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="mb-6 border-b border-gray-200">
            <TabsList className="bg-transparent border-0 h-auto p-0 gap-0">
              <TabsTrigger
                value="list"
                className="inline-flex items-center gap-2 px-6 py-4 border-b-2 rounded-none data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 data-[state=active]:shadow-none data-[state=active]:bg-transparent border-transparent text-gray-500 hover:text-gray-700"
              >
                <List className="w-5 h-5" />
                <span className="text-base font-bold">Class List</span>
              </TabsTrigger>
              <TabsTrigger
                value="add"
                className="inline-flex items-center gap-2 px-6 py-4 border-b-2 rounded-none data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 data-[state=active]:shadow-none data-[state=active]:bg-transparent border-transparent text-gray-500 hover:text-gray-700"
              >
                <PlusCircle className="w-5 h-5" />
                <span className="text-base font-bold">Add Class</span>
              </TabsTrigger>
              <TabsTrigger
                value="bulk"
                className="inline-flex items-center gap-2 px-6 py-4 border-b-2 rounded-none data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 data-[state=active]:shadow-none data-[state=active]:bg-transparent border-transparent text-gray-500 hover:text-gray-700"
              >
                <Upload className="w-5 h-5" />
                <span className="text-base font-bold">Bulk Upload</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* ===== CLASS LIST TAB ===== */}
          <TabsContent value="list" className="mt-0">
            <Card>
              <CardHeader className="border-b">
                <div className="flex items-center gap-2">
                  <List className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-bold text-gray-900">All Classes</h3>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="w-12">#</TableHead>
                        <TableHead>Class Name</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Numeric</TableHead>
                        <TableHead>Section(s)</TableHead>
                        <TableHead>Teacher</TableHead>
                        <TableHead>Students</TableHead>
                        <TableHead className="text-right">Options</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        Array.from({ length: 6 }).map((_, i) => (
                          <TableRow key={i}>
                            {Array.from({ length: 8 }).map((_, j) => (
                              <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                            ))}
                          </TableRow>
                        ))
                      ) : classes.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-12 text-gray-400">
                            <BookOpen className="w-10 h-10 mx-auto mb-2 opacity-50" />
                            <p>No classes found</p>
                          </TableCell>
                        </TableRow>
                      ) : (
                        classes.map((c, i) => (
                          <TableRow key={c.class_id} className="hover:bg-gray-50">
                            <TableCell className="text-sm text-gray-500">{i + 1}</TableCell>
                            <TableCell className="font-semibold text-gray-900">{getDisplayClassName(c)}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs bg-gray-100">{c.category || '—'}</Badge>
                            </TableCell>
                            <TableCell className="font-bold">{c.name_numeric || '—'}</TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {c.sections && c.sections.length > 0
                                  ? c.sections.map(s => <Badge key={s.section_id} variant="secondary" className="text-xs">{s.name}</Badge>)
                                  : <span className="text-sm text-gray-400">None</span>}
                              </div>
                            </TableCell>
                            <TableCell>
                              {c.teacher ? (
                                <Link href={`/admin/teachers`} className="text-blue-600 hover:text-blue-800 hover:underline font-medium text-sm">
                                  {c.teacher.name}
                                </Link>
                              ) : (
                                <span className="text-sm text-gray-400">Not assigned</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
                                {c._count?.enrolls || 0}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center justify-end gap-1">
                                <Button variant="ghost" size="sm" className="h-8 text-blue-600" asChild>
                                  <Link href={`/admin/students/lists?class_id=${c.class_id}`}>
                                    <Users className="w-4 h-4 mr-1" />Students
                                  </Link>
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600" onClick={() => openEditForm(c)}>
                                  <Pencil className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600" onClick={() => setDeleteTarget(c)}>
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
              </CardContent>
            </Card>
          </TabsContent>

          {/* ===== ADD CLASS TAB ===== */}
          <TabsContent value="add" className="mt-0">
            <Card>
              <CardHeader className="border-b">
                <div className="flex items-center gap-2">
                  <PlusCircle className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Create New Class</h3>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="max-w-6xl mx-auto space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <Label className="text-sm font-semibold text-gray-900">Name *</Label>
                      <Select value={formData.name} onValueChange={v => setFormData({ ...formData, name: v })}>
                        <SelectTrigger className="mt-2">
                          <SelectValue placeholder="Select Class Name" />
                        </SelectTrigger>
                        <SelectContent>
                          {CLASS_NAMES.map(cn => <SelectItem key={cn} value={cn}>{cn}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-sm font-semibold text-gray-900">Category *</Label>
                      <Select value={formData.category} onValueChange={v => setFormData({ ...formData, category: v })}>
                        <SelectTrigger className="mt-2">
                          <SelectValue placeholder="Select Category" />
                        </SelectTrigger>
                        <SelectContent>
                          {CATEGORIES.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-sm font-semibold text-gray-900">Numeric Name</Label>
                      <Input
                        type="text"
                        placeholder="e.g., 1, 2, 3"
                        value={formData.name_numeric}
                        onChange={e => setFormData({ ...formData, name_numeric: e.target.value })}
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-semibold text-gray-900">Section</Label>
                      <Input
                        type="text"
                        placeholder="Default: A"
                        value={formData.section_name}
                        onChange={e => setFormData({ ...formData, section_name: e.target.value })}
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-semibold text-gray-900">Teacher</Label>
                      <Select value={formData.teacher_id} onValueChange={v => setFormData({ ...formData, teacher_id: v })}>
                        <SelectTrigger className="mt-2">
                          <SelectValue placeholder="Select Teacher" />
                        </SelectTrigger>
                        <SelectContent>
                          {teachers.map(t => <SelectItem key={t.teacher_id} value={String(t.teacher_id)}>{t.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-end">
                      <Button
                        onClick={handleSave}
                        disabled={formSaving || !formData.name || !formData.category}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3"
                      >
                        {formSaving ? 'Creating...' : 'Create Class'}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ===== BULK UPLOAD TAB ===== */}
          <TabsContent value="bulk" className="mt-0">
            <Card>
              <CardHeader className="border-b">
                <div className="flex items-center gap-2">
                  <Upload className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-bold text-gray-900">Bulk Upload Classes</h3>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                  <div className="p-6 bg-amber-50 border border-amber-200 rounded-lg">
                    <h4 className="flex items-center gap-2 text-amber-800 font-bold text-lg mb-4">
                      <Info className="w-5 h-5" />How It Works
                    </h4>
                    <ol className="space-y-2 text-base text-gray-700 list-decimal list-inside">
                      <li>Download the template below</li>
                      <li>Fill in class details (Name, Category, Numeric, Teacher ID)</li>
                      <li>Upload the completed CSV file</li>
                    </ol>
                  </div>
                  <div className="p-6 bg-green-50 border border-green-200 rounded-lg">
                    <h4 className="flex items-center gap-2 text-green-800 font-bold text-lg mb-4">
                      <Download className="w-5 h-5" />Download Template
                    </h4>
                    <p className="text-base text-gray-700 mb-4">Get the Excel/CSV template with sample data</p>
                    <Button
                      variant="outline"
                      onClick={() => {
                        const csv = 'Name,Category,Numeric,Teacher ID,Section\nBASIC,Lower Primary,1,1,A\nJHS,JHS,1,2,A';
                        const blob = new Blob([csv], { type: 'text/csv' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url; a.download = 'class_template.csv'; a.click();
                        URL.revokeObjectURL(url);
                      }}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <Download className="w-4 h-4 mr-2" />Download CSV Template
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-center w-full">
                  <label
                    className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-all"
                    htmlFor="bulkFile"
                  >
                    <UploadCloud className="w-16 h-16 text-gray-400 mb-4" />
                    <p className="mb-2 text-sm text-gray-500">
                      <span className="font-semibold">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-gray-500">CSV files only</p>
                    {uploadFile && (
                      <p className="mt-4 text-base font-medium text-green-600">{uploadFile.name}</p>
                    )}
                    <input
                      id="bulkFile"
                      type="file"
                      className="hidden"
                      accept=".csv"
                      onChange={e => {
                        if (e.target.files?.[0]) setUploadFile(e.target.files[0]);
                      }}
                    />
                  </label>
                </div>
                <div className="mt-6 text-center">
                  <Button
                    disabled={!uploadFile || uploading}
                    onClick={() => toast.info('Bulk upload coming soon - use Add Class tab instead')}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                  >
                    {uploading ? 'Uploading...' : 'Upload and Create Classes'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Quick links */}
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/classes/sections"><BookOpen className="w-4 h-4 mr-1" />Manage Sections</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/classes/syllabus"><BookOpen className="w-4 h-4 mr-1" />Academic Syllabus</Link>
          </Button>
        </div>
      </div>

      {/* Edit Class Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Class' : 'Add New Class'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Class Name *</Label>
              {editing ? (
                <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="mt-1" />
              ) : (
                <Select value={formData.name} onValueChange={v => setFormData({ ...formData, name: v })}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {CLASS_NAMES.map(cn => <SelectItem key={cn} value={cn}>{cn}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div>
              <Label>Category *</Label>
              {editing ? (
                <Input value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} className="mt-1" />
              ) : (
                <Select value={formData.category} onValueChange={v => setFormData({ ...formData, category: v })}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div>
              <Label>Numeric Name</Label>
              <Input type="text" placeholder="e.g. 1" value={formData.name_numeric} onChange={e => setFormData({ ...formData, name_numeric: e.target.value })} className="mt-1" />
            </div>
            <div>
              <Label>Class Teacher</Label>
              <Select value={formData.teacher_id} onValueChange={v => setFormData({ ...formData, teacher_id: v })}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select Teacher" /></SelectTrigger>
                <SelectContent>
                  {teachers.map(t => <SelectItem key={t.teacher_id} value={String(t.teacher_id)}>{t.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={formSaving || !formData.name || !formData.category} className="bg-blue-600 hover:bg-blue-700">
              {formSaving ? 'Saving...' : editing ? 'Update' : 'Create'}
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
              Are you sure you want to delete this class? This action cannot be undone.
              {deleteTarget && deleteTarget._count && deleteTarget._count.enrolls > 0 && (
                <span className="block mt-2 text-red-600 font-semibold">
                  Warning: {deleteTarget._count.enrolls} student(s) enrolled!
                </span>
              )}
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
