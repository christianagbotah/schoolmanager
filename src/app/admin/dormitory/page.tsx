'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Building2, Plus, Pencil, Trash2, Users, Search, X, Loader2,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

interface Dormitory {
  dormitory_id: number;
  dormitory_name: string;
  dormitory_description: string;
  number_of_rooms: number;
  number_of_beds: number;
  students_count: number;
}

interface DormStudent {
  id: number;
  student_id: number;
  student: {
    student_id: number;
    name: string;
    email: string;
    phone: string;
    student_code: string;
    class_name: string;
    active_status: number;
  };
}

/* ─── Skeletons ─── */
function TableSkeleton() {
  return (
    <Card className="border-slate-200/60">
      <CardContent className="p-0">
        <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
          <Skeleton className="h-4 w-48" />
        </div>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3 border-b border-slate-50 last:border-0">
            <Skeleton className="w-4 h-4" />
            <Skeleton className="h-4 flex-1 max-w-[200px]" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 flex-1 max-w-[250px]" />
            <Skeleton className="w-20 h-8 rounded-md" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function StudentsSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-3 bg-slate-50 rounded-lg">
          <Skeleton className="w-6 h-6" />
          <Skeleton className="w-6 h-6 rounded-full" />
          <Skeleton className="h-4 flex-1 max-w-[160px]" />
          <Skeleton className="h-4 flex-1 max-w-[180px]" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-20" />
        </div>
      ))}
    </div>
  );
}

export default function DormitoryPage() {
  const [dormitories, setDormitories] = useState<Dormitory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  const [editOpen, setEditOpen] = useState(false);
  const [studentsOpen, setStudentsOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedDorm, setSelectedDorm] = useState<Dormitory | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  // Students dialog state
  const [dormStudents, setDormStudents] = useState<DormStudent[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(false);

  // Form state (CI3 fields: name, number_of_rooms, description)
  const [form, setForm] = useState({ name: '', number_of_rooms: '', description: '' });

  const fetchDormitories = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/dormitory');
      const data = await res.json();
      setDormitories(data.dormitories || []);
    } catch { /* empty */ }
    setLoading(false);
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchDormitories(); }, [fetchDormitories]);

  const openAdd = () => {
    setSelectedDorm(null);
    setForm({ name: '', number_of_rooms: '', description: '' });
  };

  const openEdit = (dorm: Dormitory) => {
    setSelectedDorm(dorm);
    setForm({
      name: dorm.dormitory_name,
      number_of_rooms: dorm.number_of_rooms.toString(),
      description: dorm.dormitory_description || '',
    });
    setEditOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error('Dormitory name is required');
      return;
    }
    setSaving(true);
    try {
      const payload = selectedDorm
        ? { action: 'update', dormitory_id: selectedDorm.dormitory_id, ...form }
        : { action: 'create', ...form };
      await fetch('/api/admin/dormitory', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      toast.success(selectedDorm ? 'Dormitory updated successfully' : 'Dormitory created successfully');
      setEditOpen(false);
      fetchDormitories();
    } catch { toast.error('Failed to save dormitory'); }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await fetch(`/api/admin/dormitory?id=${deleteId}`, { method: 'DELETE' });
      toast.success('Dormitory deleted successfully');
      setDeleteOpen(false);
      fetchDormitories();
    } catch { toast.error('Failed to delete dormitory'); }
  };

  const openStudents = async (dorm: Dormitory) => {
    setSelectedDorm(dorm);
    setStudentsOpen(true);
    setStudentsLoading(true);
    try {
      const res = await fetch(`/api/admin/dormitory?action=students&dormitory_id=${dorm.dormitory_id}`);
      const data = await res.json();
      setDormStudents(data.students || []);
    } catch { setDormStudents([]); }
    setStudentsLoading(false);
  };

  const filtered = dormitories.filter(d =>
    search === '' || d.dormitory_name.toLowerCase().includes(search.toLowerCase())
  );

  const totalRooms = dormitories.reduce((s, d) => s + d.number_of_rooms, 0);
  const totalStudents = dormitories.reduce((s, d) => s + d.students_count, 0);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Dormitory</h1>
            <p className="text-sm text-slate-500 mt-1">Manage dormitories and assigned students</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {loading ? (
            <>
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="border-slate-200/60">
                  <CardContent className="p-4 flex items-center gap-3">
                    <Skeleton className="w-10 h-10 rounded-lg" />
                    <div className="space-y-1.5 flex-1">
                      <Skeleton className="h-3 w-24" />
                      <Skeleton className="h-6 w-12" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </>
          ) : (
            <>
              <Card className="border-l-4 border-l-emerald-500 hover:shadow-sm transition-shadow">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-slate-500 truncate">Dormitories</p>
                    <p className="text-xl font-bold text-slate-900">{dormitories.length}</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-sky-500 hover:shadow-sm transition-shadow">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-sky-100 flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-5 h-5 text-sky-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-slate-500 truncate">Total Rooms</p>
                    <p className="text-xl font-bold text-slate-900">{totalRooms}</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-violet-500 hover:shadow-sm transition-shadow">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center flex-shrink-0">
                    <Users className="w-5 h-5 text-violet-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-slate-500 truncate">Students</p>
                    <p className="text-xl font-bold text-slate-900">{totalStudents}</p>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Tabs: Dormitory List | Add Dormitory (CI3 style) */}
        <Tabs defaultValue="list">
          <TabsList className="mb-4 bg-white border border-slate-200 p-1 rounded-xl h-auto flex w-full sm:w-auto">
            <TabsTrigger value="list" className="flex-1 min-w-[120px] data-[state=active]:bg-emerald-600 data-[state=active]:text-white rounded-lg py-2 text-sm">
              <Building2 className="w-4 h-4 mr-1.5 hidden sm:inline" /> Dormitory List
            </TabsTrigger>
            <TabsTrigger value="add" className="flex-1 min-w-[120px] data-[state=active]:bg-emerald-600 data-[state=active]:text-white rounded-lg py-2 text-sm">
              <Plus className="w-4 h-4 mr-1.5 hidden sm:inline" /> Add Dormitory
            </TabsTrigger>
          </TabsList>

          {/* ═══ DORMITORY LIST ═══ */}
          <TabsContent value="list">
            {/* Search */}
            <div className="mb-4">
              <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search dormitories..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-10 min-h-[44px] bg-slate-50 border-slate-200 focus:bg-white"
                />
                {search && (
                  <Button variant="ghost" size="sm" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0" onClick={() => setSearch('')}>
                    <X className="w-3 h-3" />
                  </Button>
                )}
              </div>
            </div>

            {loading ? (
              <TableSkeleton />
            ) : filtered.length === 0 ? (
              <Card className="py-16 border-slate-200/60">
                <CardContent className="flex flex-col items-center gap-3">
                  <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center">
                    <Building2 className="w-8 h-8 text-slate-300" />
                  </div>
                  <div className="text-center">
                    <p className="text-slate-500 font-medium">No dormitories found</p>
                    <p className="text-sm text-slate-400 mt-1">
                      {search ? 'Try adjusting your search' : 'Add your first dormitory'}
                    </p>
                  </div>
                  {!search && (
                    <Button variant="outline" className="mt-2 min-h-[44px]" onClick={() => document.querySelector<HTMLButtonElement>('[data-value="add"]')?.click()}>
                      <Plus className="w-4 h-4 mr-2" /> Add Dormitory
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Desktop Table (CI3: name, number_of_room, description, options) */}
                <Card className="border-slate-200/60 hidden md:block">
                  <CardContent className="p-0">
                    <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
                      <p className="text-xs text-slate-500">Showing {filtered.length} of {dormitories.length} dormitories</p>
                    </div>
                    <div className="max-h-[500px] overflow-y-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-slate-50 hover:bg-slate-50">
                            <TableHead className="text-xs font-semibold text-slate-600">Dormitory Name</TableHead>
                            <TableHead className="text-xs font-semibold text-slate-600">Number of Rooms</TableHead>
                            <TableHead className="text-xs font-semibold text-slate-600">Description</TableHead>
                            <TableHead className="text-xs font-semibold text-slate-600 w-36">Options</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filtered.map(dorm => (
                            <TableRow key={dorm.dormitory_id}>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                                    <Building2 className="w-4 h-4 text-emerald-600" />
                                  </div>
                                  <div>
                                    <p className="font-medium text-sm text-slate-900">{dorm.dormitory_name}</p>
                                    {dorm.students_count > 0 && (
                                      <p className="text-[10px] text-slate-400">{dorm.students_count} student{dorm.students_count !== 1 ? 's' : ''}</p>
                                    )}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="text-sm text-slate-700 font-medium">{dorm.number_of_rooms}</TableCell>
                              <TableCell className="text-sm text-slate-500 max-w-[250px] truncate">{dorm.dormitory_description || '—'}</TableCell>
                              <TableCell>
                                <div className="flex gap-1">
                                  <Button size="sm" variant="ghost" className="h-8 text-xs gap-1 min-h-[36px] text-violet-600 hover:text-violet-700 hover:bg-violet-50" onClick={() => openStudents(dorm)}>
                                    <Users className="w-3.5 h-3.5" /> Students
                                  </Button>
                                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0 min-w-[32px]" onClick={() => openEdit(dorm)}>
                                    <Pencil className="w-3.5 h-3.5" />
                                  </Button>
                                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0 min-w-[32px] text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => { setDeleteId(dorm.dormitory_id); setDeleteOpen(true); }}>
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>

                {/* Mobile Cards */}
                <div className="md:hidden space-y-3">
                  {filtered.map(dorm => (
                    <Card key={dorm.dormitory_id} className="border-slate-200/60">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                              <Building2 className="w-5 h-5 text-emerald-600" />
                            </div>
                            <div className="min-w-0">
                              <h3 className="font-semibold text-sm text-slate-900">{dorm.dormitory_name}</h3>
                              <p className="text-xs text-slate-500 truncate">{dorm.dormitory_description || 'No description'}</p>
                            </div>
                          </div>
                          <Badge variant="secondary" className="text-xs bg-slate-100 flex-shrink-0">{dorm.number_of_rooms} rooms</Badge>
                        </div>
                        {dorm.students_count > 0 && (
                          <p className="text-[10px] text-violet-600 mb-3">{dorm.students_count} student{dorm.students_count !== 1 ? 's' : ''} assigned</p>
                        )}
                        <div className="flex gap-2 pt-3 border-t border-slate-100">
                          <Button variant="outline" size="sm" className="h-9 text-xs flex-1 min-h-[44px] text-violet-600" onClick={() => openStudents(dorm)}>
                            <Users className="w-3.5 h-3.5 mr-1.5" />Students
                          </Button>
                          <Button variant="outline" size="sm" className="h-9 text-xs flex-1 min-h-[44px]" onClick={() => openEdit(dorm)}>
                            <Pencil className="w-3.5 h-3.5 mr-1.5" />Edit
                          </Button>
                          <Button variant="outline" size="sm" className="h-9 w-9 text-xs text-red-500 min-h-[44px]" onClick={() => { setDeleteId(dorm.dormitory_id); setDeleteOpen(true); }}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </TabsContent>

          {/* ═══ ADD DORMITORY FORM (CI3 style) ═══ */}
          <TabsContent value="add">
            <Card className="border-slate-200/60">
              <CardContent className="p-6">
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-slate-900">Add New Dormitory</h2>
                  <p className="text-sm text-slate-500 mt-1">Fill in the details below to create a dormitory</p>
                </div>
                <div className="space-y-5 max-w-lg">
                  <div className="grid gap-2">
                    <Label className="text-sm font-medium">Dormitory Name <span className="text-red-500">*</span></Label>
                    <Input
                      value={form.name}
                      onChange={e => setForm({ ...form, name: e.target.value })}
                      placeholder="Enter dormitory name"
                      className="min-h-[44px]"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-sm font-medium">Number of Rooms <span className="text-red-500">*</span></Label>
                    <Input
                      type="number"
                      value={form.number_of_rooms}
                      onChange={e => setForm({ ...form, number_of_rooms: e.target.value })}
                      placeholder="Enter number of rooms"
                      className="min-h-[44px]"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-sm font-medium">Description</Label>
                    <Input
                      value={form.description}
                      onChange={e => setForm({ ...form, description: e.target.value })}
                      placeholder="Enter description"
                      className="min-h-[44px]"
                    />
                  </div>
                  <Button
                    onClick={async () => {
                      if (!form.name.trim()) {
                        toast.error('Dormitory name is required');
                        return;
                      }
                      if (!form.number_of_rooms) {
                        toast.error('Number of rooms is required');
                        return;
                      }
                      setSaving(true);
                      try {
                        await fetch('/api/admin/dormitory', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ action: 'create', ...form }),
                        });
                        toast.success('Dormitory created successfully');
                        setForm({ name: '', number_of_rooms: '', description: '' });
                        fetchDormitories();
                      } catch { toast.error('Failed to create dormitory'); }
                      setSaving(false);
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700 min-h-[44px] shadow-sm"
                    disabled={saving}
                  >
                    {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Add Dormitory
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* ═══ EDIT DORMITORY DIALOG (CI3 modal_edit_dormitory) ═══ */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                <Pencil className="w-4 h-4 text-emerald-600" />
              </div>
              Edit Dormitory
            </DialogTitle>
            <DialogDescription>
              Update the dormitory details below
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label className="text-sm font-medium">Dormitory Name <span className="text-red-500">*</span></Label>
              <Input
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="Enter dormitory name"
                className="min-h-[44px]"
              />
            </div>
            <div className="grid gap-2">
              <Label className="text-sm font-medium">Number of Rooms <span className="text-red-500">*</span></Label>
              <Input
                type="number"
                value={form.number_of_rooms}
                onChange={e => setForm({ ...form, number_of_rooms: e.target.value })}
                placeholder="Enter number of rooms"
                className="min-h-[44px]"
              />
            </div>
            <div className="grid gap-2">
              <Label className="text-sm font-medium">Description</Label>
              <Input
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                placeholder="Enter description"
                className="min-h-[44px]"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setEditOpen(false)} className="min-h-[44px]">Cancel</Button>
            <Button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700 min-h-[44px]" disabled={!form.name.trim() || saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Edit Dormitory
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ STUDENTS DIALOG (CI3 modal_dormitory_student) ═══ */}
      <Dialog open={studentsOpen} onOpenChange={setStudentsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center">
                <Users className="w-4 h-4 text-violet-600" />
              </div>
              Students in {selectedDorm?.dormitory_name}
            </DialogTitle>
            <DialogDescription>
              {selectedDorm?.dormitory_description && selectedDorm.dormitory_description}
            </DialogDescription>
          </DialogHeader>

          {studentsLoading ? (
            <StudentsSkeleton />
          ) : dormStudents.length === 0 ? (
            <div className="text-center py-10">
              <Users className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500 font-medium">No students assigned</p>
              <p className="text-sm text-slate-400 mt-1">Students will appear here once assigned to this dormitory</p>
            </div>
          ) : (
            <>
              {/* Desktop: CI3 style table (#, name, email, phone, class) */}
              <div className="hidden sm:block">
                <div className="max-h-[400px] overflow-y-auto rounded-lg border border-slate-200">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50 hover:bg-slate-50">
                        <TableHead className="text-xs font-semibold text-slate-600 w-12">#</TableHead>
                        <TableHead className="text-xs font-semibold text-slate-600">Name</TableHead>
                        <TableHead className="text-xs font-semibold text-slate-600">Email</TableHead>
                        <TableHead className="text-xs font-semibold text-slate-600">Phone</TableHead>
                        <TableHead className="text-xs font-semibold text-slate-600">Class</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dormStudents.map((ds, i) => (
                        <TableRow key={ds.id}>
                          <TableCell className="text-xs text-slate-400">{i + 1}</TableCell>
                          <TableCell>
                            <p className="font-medium text-sm text-slate-900">{ds.student.name}</p>
                            <p className="text-[10px] text-slate-400">{ds.student.student_code}</p>
                          </TableCell>
                          <TableCell className="text-sm text-slate-600">{ds.student.email || '—'}</TableCell>
                          <TableCell className="text-sm text-slate-600">{ds.student.phone || '—'}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs border-slate-200">{ds.student.class_name || '—'}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Mobile: Card list */}
              <div className="sm:hidden space-y-2">
                {dormStudents.map((ds, i) => (
                  <div key={ds.id} className="bg-slate-50 rounded-lg p-3">
                    <div className="flex items-start gap-3">
                      <span className="text-xs text-slate-400 mt-1 w-5">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-slate-900">{ds.student.name}</p>
                        <p className="text-[10px] text-slate-400">{ds.student.student_code}</p>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-xs text-slate-500">
                          {ds.student.email && <span>{ds.student.email}</span>}
                          {ds.student.phone && <span>{ds.student.phone}</span>}
                          {ds.student.class_name && (
                            <Badge variant="outline" className="text-[10px] border-slate-200">{ds.student.class_name}</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-100">
                <span>Total: {dormStudents.length} student{dormStudents.length !== 1 ? 's' : ''}</span>
              </div>
            </>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setStudentsOpen(false)} className="min-h-[44px]">Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ DELETE CONFIRMATION ═══ */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                <Trash2 className="w-4 h-4 text-red-600" />
              </div>
              Delete Dormitory
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this dormitory? Student assignments will be removed. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="min-h-[44px]">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 min-h-[44px]">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
