'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  BedDouble, Plus, Pencil, Trash2, Users, DoorOpen, Building2, UserPlus, Search, X, Eye, Loader2,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';

interface Room {
  id: number; room_name: string; room_number: string; room_type: string;
  capacity: number; floor: number; facilities: string; status: string;
  occupants: { id: number; student_id: number; assigned_at: string }[];
}
interface Student { student_id: number; name: string; student_code: string; sex: string; active_status?: number; }

const FACILITIES = ['WiFi', 'AC', 'Fan', 'Desk', 'Wardrobe', 'Attached Bathroom', 'Hot Water', 'Study Lamp'];

/* ─── Stat Card Skeleton ─── */
function StatCardSkeleton() {
  return (
    <Card className="border-slate-200/60">
      <CardContent className="p-4 flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-lg flex-shrink-0" />
        <div className="space-y-1.5 flex-1">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-6 w-12" />
        </div>
      </CardContent>
    </Card>
  );
}

/* ─── Content Skeleton ─── */
function ContentSkeleton() {
  return (
    <Card className="border-slate-200/60">
      <CardContent className="p-0">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-4 border-b border-slate-100 last:border-0">
            <Skeleton className="w-8 h-8 rounded-lg flex-shrink-0" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="w-20 h-8 rounded-md" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export default function DormitoryPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [formOpen, setFormOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<Room | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [assignSearch, setAssignSearch] = useState('');

  const [form, setForm] = useState({ room_name: '', room_number: '', room_type: 'Single', capacity: '1', floor: '1', facilities: [] as string[], status: 'Available' });
  const [assignForm, setAssignForm] = useState({ room_id: '', student_id: '' });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/dormitory?action=stats');
      const data = await res.json();
      setRooms(data.rooms || []);
      setStudents(data.students || []);
    } catch { /* empty */ }
    setLoading(false);
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchData(); }, [fetchData]);

  const openCreate = () => {
    setSelected(null);
    setForm({ room_name: '', room_number: '', room_type: 'Single', capacity: '1', floor: '1', facilities: [], status: 'Available' });
    setFormOpen(true);
  };

  const openEdit = (room: Room) => {
    setSelected(room);
    setForm({
      room_name: room.room_name, room_number: room.room_number, room_type: room.room_type,
      capacity: room.capacity.toString(), floor: room.floor.toString(),
      facilities: room.facilities ? room.facilities.split(',') : [], status: room.status,
    });
    setFormOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = selected
        ? { action: 'update', id: selected.id, ...form }
        : { action: 'create', ...form };
      await fetch('/api/admin/dormitory', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      toast.success(selected ? 'Room updated successfully' : 'Room created successfully');
      setFormOpen(false);
      fetchData();
    } catch { toast.error('Failed to save room'); }
    setSaving(false);
  };

  const handleAssign = async () => {
    if (!assignForm.room_id || !assignForm.student_id) return;
    setSaving(true);
    try {
      await fetch('/api/admin/dormitory', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'assign_student', ...assignForm }) });
      toast.success('Student assigned to room');
      setAssignOpen(false);
      fetchData();
    } catch { toast.error('Failed to assign student'); }
    setSaving(false);
  };

  const handleRemoveStudent = async (roomId: number, studentId: number) => {
    try {
      await fetch('/api/admin/dormitory', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'remove_student', room_id: roomId, student_id: studentId }) });
      toast.success('Student removed from room');
      fetchData();
    } catch { toast.error('Failed to remove student'); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await fetch(`/api/admin/dormitory?id=${deleteId}`, { method: 'DELETE' });
      toast.success('Room deleted');
      setDeleteOpen(false);
      fetchData();
    } catch { toast.error('Failed to delete room'); }
  };

  const getStudentName = (sid: number) => students.find(s => s.student_id === sid)?.name || `Student #${sid}`;
  const getStudent = (sid: number) => students.find(s => s.student_id === sid);

  const filtered = rooms.filter(r => {
    const matchSearch = search === '' || r.room_name.toLowerCase().includes(search.toLowerCase()) || r.room_number.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || r.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const totalRooms = rooms.length;
  const occupied = rooms.filter(r => r.occupants.length >= r.capacity || r.status === 'Occupied').length;
  const available = totalRooms - occupied;
  const totalCapacity = rooms.reduce((s, r) => s + r.capacity, 0);
  const totalOccupants = rooms.reduce((s, r) => s + r.occupants.length, 0);
  const occupancyPct = totalCapacity > 0 ? Math.round((totalOccupants / totalCapacity) * 100) : 0;

  const assignedIds = new Set(rooms.flatMap(r => r.occupants.map(o => o.student_id)));
  const filteredStudents = students.filter(s =>
    s.active_status !== 0 && !assignedIds.has(s.student_id) &&
    (assignSearch === '' || s.name.toLowerCase().includes(assignSearch.toLowerCase()) || s.student_code.toLowerCase().includes(assignSearch.toLowerCase()))
  );

  const statusColor = (status: string) => {
    if (status === 'Available') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (status === 'Occupied') return 'bg-amber-50 text-amber-700 border-amber-200';
    if (status === 'Maintenance') return 'bg-red-50 text-red-700 border-red-200';
    return 'bg-slate-50 text-slate-500 border-slate-200';
  };

  const roomTypeColor = (type: string) => {
    if (type === 'Single') return 'bg-sky-50 text-sky-700';
    if (type === 'Double') return 'bg-violet-50 text-violet-700';
    return 'bg-amber-50 text-amber-700';
  };

  const activeFilters = (filterStatus !== 'all' ? 1 : 0) + (search ? 1 : 0);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Dormitory Management</h1>
            <p className="text-sm text-slate-500 mt-1">Room allocation &amp; occupancy tracking</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => { setAssignForm({ room_id: '', student_id: '' }); setAssignSearch(''); setAssignOpen(true); }} variant="outline" className="min-h-[44px] border-slate-200">
              <UserPlus className="w-4 h-4 mr-2" /> Assign Student
            </Button>
            <Button onClick={openCreate} className="bg-emerald-600 hover:bg-emerald-700 min-h-[44px] shadow-sm">
              <Plus className="w-4 h-4 mr-2" /> Add Room
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {loading ? (
            <><StatCardSkeleton /><StatCardSkeleton /><StatCardSkeleton /><StatCardSkeleton /></>
          ) : (
            <>
              <Card className="border-l-4 border-l-emerald-500 hover:shadow-sm transition-shadow">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                    <DoorOpen className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-slate-500 truncate">Total Rooms</p>
                    <p className="text-xl font-bold text-slate-900">{totalRooms}</p>
                    <p className="text-[10px] text-slate-400">On {new Set(rooms.map(r => r.floor)).size} floors</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-amber-500 hover:shadow-sm transition-shadow">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                    <BedDouble className="w-5 h-5 text-amber-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-slate-500 truncate">Occupied</p>
                    <p className="text-xl font-bold text-slate-900">{occupied}</p>
                    <p className="text-[10px] text-slate-400">{totalRooms > 0 ? Math.round((occupied / totalRooms) * 100) : 0}% filled</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-sky-500 hover:shadow-sm transition-shadow">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-sky-100 flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-5 h-5 text-sky-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-slate-500 truncate">Available</p>
                    <p className="text-xl font-bold text-slate-900">{available}</p>
                    <p className="text-[10px] text-emerald-500 font-medium">Ready for use</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-violet-500 hover:shadow-sm transition-shadow">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center flex-shrink-0">
                    <Users className="w-5 h-5 text-violet-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-slate-500 truncate">Occupancy</p>
                    <p className="text-xl font-bold text-slate-900">{totalOccupants}/{totalCapacity}</p>
                    <p className="text-[10px] text-slate-400">{occupancyPct}% utilized</p>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Occupancy Bar */}
        {!loading && totalCapacity > 0 && (
          <Card className="border-slate-200/60">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-700">Overall Occupancy</span>
                <span className="text-sm font-bold text-slate-900">{totalOccupants}/{totalCapacity} ({occupancyPct}%)</span>
              </div>
              <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-500 ${occupancyPct >= 90 ? 'bg-red-500' : occupancyPct >= 70 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                  style={{ width: `${Math.min(100, occupancyPct)}%` }} />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filter Bar */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search rooms by name or number..."
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
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-[160px] min-h-[44px] bg-slate-50 border-slate-200">
                <SelectValue placeholder="Filter status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Available">Available</SelectItem>
                <SelectItem value="Occupied">Occupied</SelectItem>
                <SelectItem value="Maintenance">Maintenance</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Active Filters */}
          {activeFilters > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-slate-500">Active filters:</span>
              {search && (
                <Badge variant="secondary" className="text-xs h-6 gap-1">
                  &ldquo;{search}&rdquo;
                  <button onClick={() => setSearch('')} className="hover:text-slate-700"><X className="w-3 h-3" /></button>
                </Badge>
              )}
              {filterStatus !== 'all' && (
                <Badge variant="secondary" className="text-xs h-6 gap-1">
                  {filterStatus}
                  <button onClick={() => setFilterStatus('all')} className="hover:text-slate-700"><X className="w-3 h-3" /></button>
                </Badge>
              )}
              <button onClick={() => { setSearch(''); setFilterStatus('all'); }} className="text-xs text-emerald-600 hover:text-emerald-700 font-medium">
                Clear all
              </button>
            </div>
          )}
        </div>

        {/* Data Table */}
        {loading ? (
          <ContentSkeleton />
        ) : filtered.length === 0 ? (
          <Card className="py-16 border-slate-200/60">
            <CardContent className="flex flex-col items-center gap-3">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center">
                <Building2 className="w-8 h-8 text-slate-300" />
              </div>
              <div className="text-center">
                <p className="text-slate-500 font-medium">No rooms found</p>
                <p className="text-sm text-slate-400 mt-1">
                  {activeFilters > 0 ? 'Try adjusting your filters' : 'Add your first room to the dormitory'}
                </p>
              </div>
              {activeFilters === 0 && (
                <Button onClick={openCreate} variant="outline" className="mt-2 min-h-[44px]">
                  <Plus className="w-4 h-4 mr-2" /> Add Room
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Desktop Table */}
            <Card className="border-slate-200/60 hidden md:block">
              <CardContent className="p-0">
                <div className="px-4 py-3 border-b border-slate-100">
                  <p className="text-xs text-slate-500">Showing {filtered.length} of {rooms.length} rooms</p>
                </div>
                <div className="max-h-[500px] overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50 hover:bg-slate-50">
                        <TableHead className="text-xs font-semibold text-slate-600">Room</TableHead>
                        <TableHead className="text-xs font-semibold text-slate-600">Type</TableHead>
                        <TableHead className="text-xs font-semibold text-slate-600">Floor</TableHead>
                        <TableHead className="text-xs font-semibold text-slate-600">Capacity</TableHead>
                        <TableHead className="text-xs font-semibold text-slate-600">Occupants</TableHead>
                        <TableHead className="text-xs font-semibold text-slate-600">Facilities</TableHead>
                        <TableHead className="text-xs font-semibold text-slate-600">Status</TableHead>
                        <TableHead className="text-xs font-semibold text-slate-600 w-28">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map(room => (
                        <TableRow key={room.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                                <DoorOpen className="w-4 h-4 text-slate-500" />
                              </div>
                              <div>
                                <p className="font-medium text-sm text-slate-900">{room.room_name || room.room_number || `Room #${room.id}`}</p>
                                <p className="text-[10px] text-slate-400">#{room.id}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell><Badge variant="secondary" className={`text-[10px] ${roomTypeColor(room.room_type)}`}>{room.room_type}</Badge></TableCell>
                          <TableCell className="text-sm text-slate-600">F{room.floor}</TableCell>
                          <TableCell className="text-sm">
                            <span className={room.occupants.length >= room.capacity ? 'text-red-600 font-medium' : 'text-slate-700'}>
                              {room.occupants.length}/{room.capacity}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {room.occupants.slice(0, 2).map(o => (
                                <Badge key={o.id} variant="outline" className="text-[10px] border-slate-200">{getStudentName(o.student_id)}</Badge>
                              ))}
                              {room.occupants.length > 2 && (
                                <Badge variant="outline" className="text-[10px] border-slate-200">+{room.occupants.length - 2}</Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1 max-w-[140px]">
                              {room.facilities ? room.facilities.split(',').slice(0, 2).map((f, i) => (
                                <Badge key={i} variant="secondary" className="text-[10px] bg-slate-50">{f}</Badge>
                              )) : <span className="text-xs text-slate-400">&mdash;</span>}
                            </div>
                          </TableCell>
                          <TableCell><Badge variant="outline" className={`text-xs ${statusColor(room.status)}`}>{room.status}</Badge></TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button size="sm" variant="ghost" className="h-8 w-8 p-0 min-w-[32px]" onClick={() => { setSelected(room); setViewOpen(true); }}><Eye className="w-3.5 h-3.5" /></Button>
                              <Button size="sm" variant="ghost" className="h-8 w-8 p-0 min-w-[32px]" onClick={() => openEdit(room)}><Pencil className="w-3.5 h-3.5" /></Button>
                              <Button size="sm" variant="ghost" className="h-8 w-8 p-0 min-w-[32px] text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => { setDeleteId(room.id); setDeleteOpen(true); }}><Trash2 className="w-3.5 h-3.5" /></Button>
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
              {filtered.map(room => (
                <Card key={room.id} className="border-slate-200/60">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                          <DoorOpen className="w-5 h-5 text-slate-500" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-sm text-slate-900 truncate">{room.room_name || room.room_number || `Room #${room.id}`}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <Badge variant="secondary" className={`text-[10px] ${roomTypeColor(room.room_type)}`}>{room.room_type}</Badge>
                            <span className="text-[10px] text-slate-400">Floor {room.floor}</span>
                          </div>
                        </div>
                      </div>
                      <Badge variant="outline" className={`text-[10px] flex-shrink-0 ${statusColor(room.status)}`}>{room.status}</Badge>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      <Badge variant="secondary" className="text-[10px] bg-slate-50">
                        {room.occupants.length}/{room.capacity} occupants
                      </Badge>
                      {room.facilities && room.facilities.split(',').slice(0, 3).map((f, i) => (
                        <Badge key={i} variant="outline" className="text-[10px] border-slate-200">{f}</Badge>
                      ))}
                    </div>
                    <div className="flex gap-2 pt-3 border-t border-slate-100">
                      <Button variant="outline" size="sm" className="h-9 text-xs flex-1 min-h-[44px]" onClick={() => { setSelected(room); setViewOpen(true); }}>
                        <Eye className="w-3.5 h-3.5 mr-1.5" />View
                      </Button>
                      <Button variant="outline" size="sm" className="h-9 text-xs flex-1 min-h-[44px]" onClick={() => openEdit(room)}>
                        <Pencil className="w-3.5 h-3.5 mr-1.5" />Edit
                      </Button>
                      <Button variant="outline" size="sm" className="h-9 w-9 text-xs text-red-500 min-h-[44px]" onClick={() => { setDeleteId(room.id); setDeleteOpen(true); }}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Room Form Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                <DoorOpen className="w-4 h-4 text-emerald-600" />
              </div>
              {selected ? 'Edit Room' : 'Add New Room'}
            </DialogTitle>
            <DialogDescription>
              {selected ? 'Update room details and facilities' : 'Configure room details and facilities'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label className="text-xs font-medium">Room Name <span className="text-red-500">*</span></Label>
                <Input value={form.room_name} onChange={e => setForm({ ...form, room_name: e.target.value })} placeholder="e.g., Room 101" className="min-h-[44px]" />
              </div>
              <div className="grid gap-2">
                <Label className="text-xs font-medium">Room Number</Label>
                <Input value={form.room_number} onChange={e => setForm({ ...form, room_number: e.target.value })} placeholder="e.g., A-101" className="min-h-[44px]" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label className="text-xs font-medium">Room Type</Label>
                <Select value={form.room_type} onValueChange={v => setForm({ ...form, room_type: v })}>
                  <SelectTrigger className="min-h-[44px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Single">Single</SelectItem>
                    <SelectItem value="Double">Double</SelectItem>
                    <SelectItem value="Dormitory">Dormitory</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label className="text-xs font-medium">Status</Label>
                <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                  <SelectTrigger className="min-h-[44px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Available">Available</SelectItem>
                    <SelectItem value="Occupied">Occupied</SelectItem>
                    <SelectItem value="Maintenance">Maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label className="text-xs font-medium">Capacity</Label>
                <Input type="number" value={form.capacity} onChange={e => setForm({ ...form, capacity: e.target.value })} className="min-h-[44px]" />
              </div>
              <div className="grid gap-2">
                <Label className="text-xs font-medium">Floor</Label>
                <Input type="number" value={form.floor} onChange={e => setForm({ ...form, floor: e.target.value })} className="min-h-[44px]" />
              </div>
            </div>
            <div className="grid gap-2">
              <Label className="text-xs font-medium">Facilities</Label>
              <div className="grid grid-cols-2 gap-2">{FACILITIES.map(f => (
                <div key={f} className="flex items-center space-x-2 min-h-[36px]">
                  <Checkbox checked={form.facilities.includes(f)} onCheckedChange={checked => setForm({ ...form, facilities: checked ? [...form.facilities, f] : form.facilities.filter(x => x !== f) })} />
                  <Label className="text-xs font-normal">{f}</Label>
                </div>
              ))}</div>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setFormOpen(false)} className="min-h-[44px]">Cancel</Button>
            <Button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700 min-h-[44px]" disabled={!form.room_name.trim() || saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {selected ? 'Update Room' : 'Create Room'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Student Dialog */}
      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center">
                <UserPlus className="w-4 h-4 text-violet-600" />
              </div>
              Assign Student to Room
            </DialogTitle>
            <DialogDescription>Select a student and room for assignment</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label className="text-xs font-medium">Student <span className="text-red-500">*</span></Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input placeholder="Search students..." value={assignSearch} onChange={e => setAssignSearch(e.target.value)} className="pl-10 min-h-[44px]" />
              </div>
              <Select value={assignForm.student_id} onValueChange={v => setAssignForm({ ...assignForm, student_id: v })}>
                <SelectTrigger className="mt-1 min-h-[44px]"><SelectValue placeholder="Select student" /></SelectTrigger>
                <SelectContent className="max-h-60">
                  <SelectItem value="none">Choose student...</SelectItem>
                  {filteredStudents.slice(0, 50).map(s => (
                    <SelectItem key={s.student_id} value={s.student_id.toString()}>{s.name} ({s.student_code})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-400">{filteredStudents.length} unassigned students available</p>
            </div>
            <div className="grid gap-2">
              <Label className="text-xs font-medium">Room <span className="text-red-500">*</span></Label>
              <Select value={assignForm.room_id} onValueChange={v => setAssignForm({ ...assignForm, room_id: v })}>
                <SelectTrigger className="min-h-[44px]"><SelectValue placeholder="Select room" /></SelectTrigger>
                <SelectContent className="max-h-60">
                  <SelectItem value="none">Choose room...</SelectItem>
                  {rooms.filter(r => r.occupants.length < r.capacity && r.status !== 'Maintenance').map(r => (
                    <SelectItem key={r.id} value={r.id.toString()}>
                      {r.room_name || r.room_number || `Room #${r.id}`} ({r.occupants.length}/{r.capacity})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setAssignOpen(false)} className="min-h-[44px]">Cancel</Button>
            <Button onClick={handleAssign} className="bg-emerald-600 hover:bg-emerald-700 min-h-[44px]" disabled={!assignForm.student_id || !assignForm.room_id || saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Assign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Room Dialog */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-sky-100 flex items-center justify-center">
                <DoorOpen className="w-4 h-4 text-sky-600" />
              </div>
              Room Details
            </DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="bg-slate-50 rounded-xl p-4 text-center">
                <div className="w-14 h-14 rounded-2xl bg-sky-100 flex items-center justify-center mx-auto mb-3">
                  <DoorOpen className="w-7 h-7 text-sky-600" />
                </div>
                <p className="font-bold text-lg text-slate-900">{selected.room_name || selected.room_number || `Room #${selected.id}`}</p>
                <div className="flex justify-center gap-2 mt-2">
                  <Badge variant="outline" className={`text-xs ${statusColor(selected.status)}`}>{selected.status}</Badge>
                  <Badge variant="secondary" className={`text-xs ${roomTypeColor(selected.room_type)}`}>{selected.room_type}</Badge>
                  <Badge variant="secondary" className="text-xs">Floor {selected.floor}</Badge>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 rounded-lg p-3 text-center">
                  <p className="text-xl font-bold text-sky-600">{selected.occupants.length}/{selected.capacity}</p>
                  <p className="text-xs text-slate-500">Occupants</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3 text-center">
                  <p className="text-xl font-bold text-emerald-600">{selected.capacity - selected.occupants.length}</p>
                  <p className="text-xs text-slate-500">Available</p>
                </div>
              </div>
              {selected.facilities && (
                <div className="flex flex-wrap gap-1.5">
                  {selected.facilities.split(',').map((f, i) => (
                    <Badge key={i} variant="outline" className="text-xs border-slate-200">{f}</Badge>
                  ))}
                </div>
              )}
              {selected.occupants.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-slate-700">Current Occupants</p>
                  {selected.occupants.map(o => {
                    const st = getStudent(o.student_id);
                    return (
                      <div key={o.id} className="flex items-center justify-between bg-slate-50 rounded-lg p-3">
                        <div className="flex items-center gap-2">
                          <Avatar className="w-8 h-8">
                            <AvatarFallback className="bg-sky-100 text-sky-700 text-xs font-semibold">{st?.name?.charAt(0) || '?'}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium text-slate-900">{st?.name || '#' + o.student_id}</p>
                            <p className="text-[10px] text-slate-400">{st?.student_code || ''}</p>
                          </div>
                        </div>
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-500 hover:bg-red-50 min-w-[32px]" onClick={() => handleRemoveStudent(selected.id, o.student_id)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-6 text-slate-400">
                  <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No occupants assigned</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { if (selected) openEdit(selected); setViewOpen(false); }} className="min-h-[44px]">
              <Pencil className="w-4 h-4 mr-2" />Edit Room
            </Button>
            <Button variant="outline" onClick={() => setViewOpen(false)} className="min-h-[44px]">Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                <Trash2 className="w-4 h-4 text-red-600" />
              </div>
              Delete Room
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this room? This will remove the room and all student assignments. This action cannot be undone.
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
