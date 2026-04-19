'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  BedDouble, Plus, Pencil, Trash2, Users, Home, Building, UserPlus,
  AlertCircle, Search, Eye, X, MapPin, CalendarDays, DoorOpen, Loader2,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface BoardingHouse { house_id: number; house_name: string; house_description: string; house_capacity: number; house_master_id: number | null; house_year_established: string; house_gps_code: string; house_image_link: string; house_master?: { teacher_id: number; name: string } | null; }
interface Dormitory { dormitory_id: number; dormitory_name: string; dormitory_description: string; number_of_rooms: number; number_of_beds: number; house_id: number | null; dormitory_type: string; dormitory_floor: string; dormitory_capacity: number; bed_code_prefix: string; }
interface Assignment { id: number; student_id: number; house_id: number | null; dormitory_id: number | null; bed_number: string; academic_year: string; assigned_at: string | null; is_active: number; }
interface Student { student_id: number; name: string; student_code: string; sex: string; class_name: string; active_status: number; }
interface Teacher { teacher_id: number; name: string; }

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

/* ─── House/Dorm Card Skeleton ─── */
function CardSkeleton() {
  return (
    <Card className="border-slate-200/60">
      <CardContent className="p-5">
        <div className="flex items-start gap-3 mb-4">
          <Skeleton className="w-10 h-10 rounded-lg flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-3 w-48" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 mb-3">
          <Skeleton className="h-14 rounded-lg" />
          <Skeleton className="h-14 rounded-lg" />
          <Skeleton className="h-14 rounded-lg" />
        </div>
        <Skeleton className="h-2 rounded-full" />
      </CardContent>
    </Card>
  );
}

export default function BoardingPage() {
  const [houses, setHouses] = useState<BoardingHouse[]>([]);
  const [dormitories, setDormitories] = useState<Dormitory[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [assignSearch, setAssignSearch] = useState('');
  const [activeTab, setActiveTab] = useState('houses');

  const [houseFormOpen, setHouseFormOpen] = useState(false);
  const [dormFormOpen, setDormFormOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedHouse, setSelectedHouse] = useState<BoardingHouse | null>(null);
  const [selectedDorm, setSelectedDorm] = useState<Dormitory | null>(null);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [deleteType, setDeleteType] = useState('house');

  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [houseForm, setHouseForm] = useState({ house_name: '', house_description: '', house_capacity: '', house_master_id: '', house_year_established: '', house_gps_code: '' });
  const [dormForm, setDormForm] = useState({ dormitory_name: '', dormitory_description: '', number_of_rooms: '', number_of_beds: '', house_id: '', dormitory_type: 'Male', dormitory_floor: '', dormitory_capacity: '', bed_code_prefix: '' });
  const [assignForm, setAssignForm] = useState({ student_id: '', house_id: '', dormitory_id: '', bed_number: '', academic_year: '' });
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [dataRes, studentRes] = await Promise.all([
        fetch('/api/admin/boarding?action=stats'),
        fetch('/api/students?limit=500'),
      ]);
      const data = await dataRes.json();
      setHouses(data.houses || []);
      setDormitories(data.dormitories || []);
      setTeachers(data.teachers || []);
      const stData = await studentRes.json();
      setStudents(Array.isArray(stData) ? stData : []);
      // Load assignments separately for full data
      const assRes = await fetch('/api/admin/boarding');
      const assData = await assRes.json();
      setAssignments(assData.assignments || []);
    } catch { /* empty */ }
    setLoading(false);
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchData(); }, [fetchData]);

  const openCreateHouse = () => {
    setSelectedHouse(null);
    setHouseForm({ house_name: '', house_description: '', house_capacity: '', house_master_id: '', house_year_established: '', house_gps_code: '' });
    setHouseFormOpen(true);
  };

  const openEditHouse = (house: BoardingHouse) => {
    setSelectedHouse(house);
    setHouseForm({ house_name: house.house_name, house_description: house.house_description, house_capacity: house.house_capacity.toString(), house_master_id: house.house_master_id?.toString() || '', house_year_established: house.house_year_established || '', house_gps_code: house.house_gps_code || '' });
    setHouseFormOpen(true);
  };

  const openCreateDorm = () => {
    setSelectedDorm(null);
    setDormForm({ dormitory_name: '', dormitory_description: '', number_of_rooms: '', number_of_beds: '', house_id: '', dormitory_type: 'Male', dormitory_floor: '', dormitory_capacity: '', bed_code_prefix: '' });
    setDormFormOpen(true);
  };

  const openEditDorm = (dorm: Dormitory) => {
    setSelectedDorm(dorm);
    setDormForm({ dormitory_name: dorm.dormitory_name, dormitory_description: dorm.dormitory_description, number_of_rooms: dorm.number_of_rooms.toString(), number_of_beds: dorm.number_of_beds.toString(), house_id: dorm.house_id?.toString() || '', dormitory_type: dorm.dormitory_type || 'Male', dormitory_floor: dorm.dormitory_floor || '', dormitory_capacity: dorm.dormitory_capacity.toString(), bed_code_prefix: dorm.bed_code_prefix || '' });
    setDormFormOpen(true);
  };

  const handleSaveHouse = async () => {
    setSaving(true);
    try {
      const payload = { action: selectedHouse ? 'update_house' : 'create_house', house_id: selectedHouse?.house_id, ...houseForm };
      await fetch('/api/admin/boarding', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      toast.success(selectedHouse ? 'House updated successfully' : 'House created successfully');
      setHouseFormOpen(false);
      fetchData();
    } catch { toast.error('Failed to save house'); }
    setSaving(false);
  };

  const handleSaveDorm = async () => {
    setSaving(true);
    try {
      const payload = { action: selectedDorm ? 'update_dormitory' : 'create_dormitory', dormitory_id: selectedDorm?.dormitory_id, ...dormForm };
      await fetch('/api/admin/boarding', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      toast.success(selectedDorm ? 'Dormitory updated successfully' : 'Dormitory created successfully');
      setDormFormOpen(false);
      fetchData();
    } catch { toast.error('Failed to save dormitory'); }
    setSaving(false);
  };

  const getHouseMasterName = (house: BoardingHouse) => house.house_master?.name || 'N/A';
  const getDormHouseName = (dorm: Dormitory) => {
    if (!dorm.house_id) return '\u2014';
    const h = houses.find(h => h.house_id === dorm.house_id);
    return h?.house_name || '\u2014';
  };

  const handleAssign = async () => {
    if (!assignForm.student_id) return;
    setSaving(true);
    try {
      await fetch('/api/admin/boarding', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'assign_student', ...assignForm }) });
      toast.success('Student assigned successfully');
      setAssignOpen(false);
      fetchData();
    } catch { toast.error('Failed to assign student'); }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await fetch(`/api/admin/boarding?action=${deleteType}&id=${deleteId}`, { method: 'DELETE' });
      toast.success('Deleted successfully');
      setDeleteOpen(false);
      fetchData();
    } catch { toast.error('Failed to delete'); }
  };

  const getStudentName = (sid: number) => students.find(s => s.student_id === sid)?.name || `Student #${sid}`;
  const getStudent = (sid: number) => students.find(s => s.student_id === sid);
  const getHouseName = (hid: number | null) => houses.find(h => h.house_id === hid)?.house_name || '\u2014';
  const getDormName = (did: number | null) => dormitories.find(d => d.dormitory_id === did)?.dormitory_name || '\u2014';

  const assignedStudents = assignments.filter(a => a.is_active === 1);
  const filteredAssignments = assignedStudents.filter(a =>
    search === '' || getStudentName(a.student_id).toLowerCase().includes(search.toLowerCase())
  );
  const occ = (h: BoardingHouse) => assignments.filter(a => a.is_active === 1 && a.house_id === h.house_id).length;
  const dormOcc = (d: Dormitory) => assignments.filter(a => a.is_active === 1 && a.dormitory_id === d.dormitory_id).length;
  const filteredStudents = students.filter(s =>
    s.active_status === 1 && (assignSearch === '' || s.name.toLowerCase().includes(assignSearch.toLowerCase()) || s.student_code.toLowerCase().includes(assignSearch.toLowerCase()))
  );
  const usedStudentIds = new Set(assignedStudents.map(a => a.student_id));
  const availableStudents = filteredStudents.filter(s => !usedStudentIds.has(s.student_id));

  const totalBeds = dormitories.reduce((s, d) => s + d.number_of_beds, 0);
  const totalOccupied = assignedStudents.filter(a => a.bed_number).length;
  const totalRooms = dormitories.reduce((s, d) => s + d.number_of_rooms, 0);
  const totalCapacity = houses.reduce((s, h) => s + h.house_capacity, 0);
  const occupancyPct = totalBeds > 0 ? Math.round((totalOccupied / totalBeds) * 100) : 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Boarding Management</h1>
            <p className="text-sm text-slate-500 mt-1">Houses, dormitories &amp; student assignments</p>
          </div>
          <Button
            onClick={() => { setAssignForm({ student_id: '', house_id: '', dormitory_id: '', bed_number: '', academic_year: new Date().getFullYear().toString() }); setAssignSearch(''); setAssignOpen(true); }}
            className="bg-emerald-600 hover:bg-emerald-700 min-h-[44px] shadow-sm"
          >
            <UserPlus className="w-4 h-4 mr-2" /> Assign Student
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {loading ? (
            <>
              <StatCardSkeleton /><StatCardSkeleton /><StatCardSkeleton />
              <StatCardSkeleton /><StatCardSkeleton /><StatCardSkeleton />
            </>
          ) : (
            <>
              <Card className="border-l-4 border-l-emerald-500 hover:shadow-sm transition-shadow">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                    <Home className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-slate-500 truncate">Houses</p>
                    <p className="text-xl font-bold text-slate-900">{houses.length}</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-sky-500 hover:shadow-sm transition-shadow">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-sky-100 flex items-center justify-center flex-shrink-0">
                    <Building className="w-5 h-5 text-sky-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-slate-500 truncate">Dormitories</p>
                    <p className="text-xl font-bold text-slate-900">{dormitories.length}</p>
                    <p className="text-[10px] text-slate-400">{totalRooms} rooms</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-violet-500 hover:shadow-sm transition-shadow">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center flex-shrink-0">
                    <Users className="w-5 h-5 text-violet-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-slate-500 truncate">Assigned</p>
                    <p className="text-xl font-bold text-slate-900">{assignedStudents.length}</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-amber-500 hover:shadow-sm transition-shadow">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                    <BedDouble className="w-5 h-5 text-amber-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-slate-500 truncate">Total Beds</p>
                    <p className="text-xl font-bold text-slate-900">{totalBeds}</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-rose-500 hover:shadow-sm transition-shadow">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-rose-100 flex items-center justify-center flex-shrink-0">
                    <DoorOpen className="w-5 h-5 text-rose-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-slate-500 truncate">Occupied Beds</p>
                    <p className="text-xl font-bold text-slate-900">{totalOccupied}</p>
                    <p className="text-[10px] text-slate-400">{occupancyPct}%</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-teal-500 hover:shadow-sm transition-shadow">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center flex-shrink-0">
                    <AlertCircle className="w-5 h-5 text-teal-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-slate-500 truncate">Total Capacity</p>
                    <p className="text-xl font-bold text-slate-900">{totalCapacity}</p>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Occupancy Bar */}
        {!loading && totalBeds > 0 && (
          <Card className="border-slate-200/60">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-700">Bed Occupancy Rate</span>
                <span className="text-sm font-bold text-slate-900">{totalOccupied}/{totalBeds} ({occupancyPct}%)</span>
              </div>
              <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-500 ${occupancyPct >= 90 ? 'bg-red-500' : occupancyPct >= 70 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                  style={{ width: `${Math.min(100, occupancyPct)}%` }} />
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4 bg-white border border-slate-200 p-1 rounded-xl h-auto flex w-full sm:w-auto">
            <TabsTrigger value="houses" className="flex-1 min-w-[100px] data-[state=active]:bg-emerald-600 data-[state=active]:text-white rounded-lg py-2 text-sm">
              <Home className="w-4 h-4 mr-1.5 hidden sm:inline" /> Houses ({houses.length})
            </TabsTrigger>
            <TabsTrigger value="dormitories" className="flex-1 min-w-[100px] data-[state=active]:bg-emerald-600 data-[state=active]:text-white rounded-lg py-2 text-sm">
              <Building className="w-4 h-4 mr-1.5 hidden sm:inline" /> Dormitories ({dormitories.length})
            </TabsTrigger>
            <TabsTrigger value="students" className="flex-1 min-w-[100px] data-[state=active]:bg-emerald-600 data-[state=active]:text-white rounded-lg py-2 text-sm">
              <Users className="w-4 h-4 mr-1.5 hidden sm:inline" /> Students ({assignedStudents.length})
            </TabsTrigger>
          </TabsList>

          {/* Houses Tab */}
          <TabsContent value="houses">
            <div className="flex justify-end mb-4">
              <Button onClick={openCreateHouse} className="bg-emerald-600 hover:bg-emerald-700 min-h-[44px] shadow-sm">
                <Plus className="w-4 h-4 mr-2" /> Add House
              </Button>
            </div>
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)}
              </div>
            ) : houses.length === 0 ? (
              <Card className="py-16 border-slate-200/60">
                <CardContent className="flex flex-col items-center gap-3">
                  <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center">
                    <Home className="w-8 h-8 text-slate-300" />
                  </div>
                  <div className="text-center">
                    <p className="text-slate-500 font-medium">No boarding houses yet</p>
                    <p className="text-sm text-slate-400 mt-1">Create your first boarding house</p>
                  </div>
                  <Button onClick={openCreateHouse} variant="outline" className="mt-2 min-h-[44px]">
                    <Plus className="w-4 h-4 mr-2" /> Add House
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {houses.map(house => {
                  const houseOcc = occ(house);
                  const housePct = house.house_capacity > 0 ? Math.round((houseOcc / house.house_capacity) * 100) : 0;
                  return (
                    <Card key={house.house_id} className="border-l-4 border-l-emerald-500 hover:shadow-md transition-shadow">
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                              <Home className="w-5 h-5 text-emerald-600" />
                            </div>
                            <div className="min-w-0">
                              <h3 className="font-semibold text-slate-900">{house.house_name}</h3>
                              <p className="text-xs text-slate-500 truncate">{house.house_description || 'No description'}</p>
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3 mb-3">
                          <div className="bg-slate-50 rounded-lg p-2 text-center">
                            <p className="text-lg font-bold text-emerald-600">{house.house_capacity}</p>
                            <p className="text-[10px] text-slate-500">Capacity</p>
                          </div>
                          <div className="bg-slate-50 rounded-lg p-2 text-center">
                            <p className="text-lg font-bold text-violet-600">{houseOcc}</p>
                            <p className="text-[10px] text-slate-500">Assigned</p>
                          </div>
                        </div>
                        {(house.house_master_id || house.house_year_established) && (
                          <div className="flex flex-wrap gap-1.5 mb-2 text-[10px] text-slate-500">
                            {house.house_master_id && (
                              <Badge variant="outline" className="text-[10px] border-slate-200"><Users className="w-3 h-3 mr-0.5" />{getHouseMasterName(house)}</Badge>
                            )}
                            {house.house_year_established && (
                              <Badge variant="secondary" className="text-[10px]">{house.house_year_established}</Badge>
                            )}
                          </div>
                        )}
                        {house.house_capacity > 0 && (
                          <div className="mb-3">
                            <div className="flex justify-between text-xs text-slate-500 mb-1">
                              <span>Occupancy</span>
                              <span>{houseOcc}/{house.house_capacity}</span>
                            </div>
                            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full transition-all ${housePct >= 100 ? 'bg-red-500' : housePct >= 80 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                style={{ width: `${Math.min(100, housePct)}%` }} />
                            </div>
                          </div>
                        )}
                        <div className="flex gap-1 pt-3 border-t border-slate-100">
                          <Button size="sm" variant="ghost" className="h-8 text-xs flex-1 min-h-[36px]" onClick={() => openEditHouse(house)}>
                            <Pencil className="w-3.5 h-3.5 mr-1" />Edit
                          </Button>
                          <Button size="sm" variant="ghost" className="h-8 text-xs text-red-500 min-h-[36px]" onClick={() => { setDeleteType('house'); setDeleteId(house.house_id); setDeleteOpen(true); }}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Dormitories Tab */}
          <TabsContent value="dormitories">
            <div className="flex justify-end mb-4">
              <Button onClick={openCreateDorm} className="bg-emerald-600 hover:bg-emerald-700 min-h-[44px] shadow-sm">
                <Plus className="w-4 h-4 mr-2" /> Add Dormitory
              </Button>
            </div>
            {dormitories.length === 0 && !loading ? (
              <Card className="py-16 border-slate-200/60">
                <CardContent className="flex flex-col items-center gap-3">
                  <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center">
                    <Building className="w-8 h-8 text-slate-300" />
                  </div>
                  <div className="text-center">
                    <p className="text-slate-500 font-medium">No dormitories yet</p>
                    <p className="text-sm text-slate-400 mt-1">Create your first dormitory</p>
                  </div>
                  <Button onClick={openCreateDorm} variant="outline" className="mt-2 min-h-[44px]">
                    <Plus className="w-4 h-4 mr-2" /> Add Dormitory
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {(loading ? Array.from({ length: 3 }) : dormitories).map((dorm, idx) => {
                  if (loading) return <CardSkeleton key={idx} />;
                  const dOcc = dormOcc(dorm);
                  const dPct = dorm.number_of_beds > 0 ? Math.round((dOcc / dorm.number_of_beds) * 100) : 0;
                  return (
                    <Card key={dorm.dormitory_id} className="border-l-4 border-l-sky-500 hover:shadow-md transition-shadow">
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-sky-100 flex items-center justify-center flex-shrink-0">
                              <Building className="w-5 h-5 text-sky-600" />
                            </div>
                            <div className="min-w-0">
                              <h3 className="font-semibold text-slate-900">{dorm.dormitory_name}</h3>
                              <p className="text-xs text-slate-500 truncate">{dorm.dormitory_description || 'No description'}</p>
                              {dorm.house_id && <p className="text-[10px] text-emerald-600 font-medium mt-0.5">{getDormHouseName(dorm)}</p>}
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 mb-3">
                          <div className="bg-slate-50 rounded-lg p-2 text-center">
                            <p className="text-lg font-bold text-sky-600">{dorm.number_of_rooms}</p>
                            <p className="text-[10px] text-slate-500">Rooms</p>
                          </div>
                          <div className="bg-slate-50 rounded-lg p-2 text-center">
                            <p className="text-lg font-bold text-amber-600">{dorm.number_of_beds}</p>
                            <p className="text-[10px] text-slate-500">Beds</p>
                          </div>
                          <div className="bg-slate-50 rounded-lg p-2 text-center">
                            <p className="text-lg font-bold text-violet-600">{dOcc}</p>
                            <p className="text-[10px] text-slate-500">Occupied</p>
                          </div>
                        </div>
                        {dorm.number_of_beds > 0 && (
                          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full transition-all ${dPct >= 100 ? 'bg-red-500' : dPct >= 80 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                              style={{ width: `${Math.min(100, dPct)}%` }} />
                          </div>
                        )}
                        <div className="flex gap-1 pt-3 border-t border-slate-100">
                          <Button size="sm" variant="ghost" className="h-8 text-xs flex-1 min-h-[36px]" onClick={() => openEditDorm(dorm)}>
                            <Pencil className="w-3.5 h-3.5 mr-1" />Edit
                          </Button>
                          <Button size="sm" variant="ghost" className="h-8 text-xs text-red-500 min-h-[36px]" onClick={() => { setDeleteType('dormitory'); setDeleteId(dorm.dormitory_id); setDeleteOpen(true); }}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Student Assignments Tab */}
          <TabsContent value="students">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search by name or code..."
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
              <Card className="border-slate-200/60">
                <CardContent className="p-0">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-4 p-4 border-b border-slate-100 last:border-0">
                      <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
                      <div className="flex-1 space-y-1.5"><Skeleton className="h-4 w-40" /><Skeleton className="h-3 w-24" /></div>
                      <Skeleton className="h-5 w-16 rounded-full" />
                    </div>
                  ))}
                </CardContent>
              </Card>
            ) : filteredAssignments.length === 0 ? (
              <Card className="py-16 border-slate-200/60">
                <CardContent className="flex flex-col items-center gap-3">
                  <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center">
                    <Users className="w-8 h-8 text-slate-300" />
                  </div>
                  <div className="text-center">
                    <p className="text-slate-500 font-medium">No students assigned</p>
                    <p className="text-sm text-slate-400 mt-1">
                      {search ? 'Try a different search term' : 'Assign students to boarding houses or dormitories'}
                    </p>
                  </div>
                  {!search && (
                    <Button onClick={() => { setAssignForm({ student_id: '', house_id: '', dormitory_id: '', bed_number: '', academic_year: new Date().getFullYear().toString() }); setAssignSearch(''); setAssignOpen(true); }} variant="outline" className="mt-2 min-h-[44px]">
                      <UserPlus className="w-4 h-4 mr-2" /> Assign Student
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
                      <p className="text-xs text-slate-500">Showing {filteredAssignments.length} of {assignedStudents.length} assigned students</p>
                    </div>
                    <div className="max-h-[500px] overflow-y-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-slate-50 hover:bg-slate-50">
                            <TableHead className="text-xs font-semibold text-slate-600 w-12">#</TableHead>
                            <TableHead className="text-xs font-semibold text-slate-600">Student</TableHead>
                            <TableHead className="text-xs font-semibold text-slate-600">House</TableHead>
                            <TableHead className="text-xs font-semibold text-slate-600">Dormitory</TableHead>
                            <TableHead className="text-xs font-semibold text-slate-600">Bed</TableHead>
                            <TableHead className="text-xs font-semibold text-slate-600">Academic Year</TableHead>
                            <TableHead className="text-xs font-semibold text-slate-600">Assigned</TableHead>
                            <TableHead className="text-xs font-semibold text-slate-600 w-20">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredAssignments.map((a, i) => {
                            const st = getStudent(a.student_id);
                            return (
                              <TableRow key={a.id}>
                                <TableCell className="text-xs text-slate-400">{i + 1}</TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <Avatar className="w-8 h-8">
                                      <AvatarFallback className="bg-emerald-100 text-emerald-700 text-xs font-semibold">{st?.name?.charAt(0) || '?'}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <p className="font-medium text-sm text-slate-900">{st?.name || `#${a.student_id}`}</p>
                                      <p className="text-[10px] text-slate-400">{st?.student_code || ''}</p>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell><Badge variant="outline" className="text-xs border-emerald-200">{getHouseName(a.house_id)}</Badge></TableCell>
                                <TableCell className="text-sm text-slate-700">{getDormName(a.dormitory_id)}</TableCell>
                                <TableCell className="text-sm font-mono">{a.bed_number || '\u2014'}</TableCell>
                                <TableCell className="text-sm text-slate-600">{a.academic_year || '\u2014'}</TableCell>
                                <TableCell className="text-xs text-slate-500">{a.assigned_at ? format(new Date(a.assigned_at), 'MMM d, yyyy') : '\u2014'}</TableCell>
                                <TableCell>
                                  <div className="flex gap-1">
                                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0 min-w-[32px]" onClick={() => { setSelectedAssignment(a); setViewOpen(true); }}><Eye className="w-3.5 h-3.5" /></Button>
                                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0 min-w-[32px] text-red-500 hover:bg-red-50" onClick={() => { setDeleteType('assignment'); setDeleteId(a.id); setDeleteOpen(true); }}><Trash2 className="w-3.5 h-3.5" /></Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>

                {/* Mobile Cards */}
                <div className="md:hidden space-y-3">
                  {filteredAssignments.map(a => {
                    const st = getStudent(a.student_id);
                    return (
                      <Card key={a.id} className="border-slate-200/60">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3 mb-3">
                            <Avatar className="w-10 h-10">
                              <AvatarFallback className="bg-emerald-100 text-emerald-700 text-sm font-semibold">{st?.name?.charAt(0) || '?'}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm text-slate-900 truncate">{st?.name || `#${a.student_id}`}</p>
                              <p className="text-[10px] text-slate-400">{st?.student_code || ''}</p>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-1.5 mb-3">
                            {a.house_id && <Badge variant="outline" className="text-[10px] border-emerald-200">{getHouseName(a.house_id)}</Badge>}
                            {a.dormitory_id && <Badge variant="outline" className="text-[10px] border-sky-200">{getDormName(a.dormitory_id)}</Badge>}
                            {a.bed_number && <Badge variant="outline" className="text-[10px] border-slate-300">Bed: {a.bed_number}</Badge>}
                            {a.academic_year && <Badge variant="secondary" className="text-[10px]">{a.academic_year}</Badge>}
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-slate-400 mb-3">
                            <span>{a.assigned_at ? format(new Date(a.assigned_at), 'MMM d, yyyy') : ''}</span>
                          </div>
                          <div className="flex gap-2 pt-3 border-t border-slate-100">
                            <Button variant="outline" size="sm" className="h-9 text-xs flex-1 min-h-[44px]" onClick={() => { setSelectedAssignment(a); setViewOpen(true); }}>
                              <Eye className="w-3.5 h-3.5 mr-1.5" />View
                            </Button>
                            <Button variant="outline" size="sm" className="h-9 w-9 text-xs text-red-500 min-h-[44px]" onClick={() => { setDeleteType('assignment'); setDeleteId(a.id); setDeleteOpen(true); }}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* House Form Dialog */}
      <Dialog open={houseFormOpen} onOpenChange={setHouseFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                <Home className="w-4 h-4 text-emerald-600" />
              </div>
              {selectedHouse ? 'Edit House' : 'Add Boarding House'}
            </DialogTitle>
            <DialogDescription>{selectedHouse ? 'Update house details and capacity' : 'Set up house details and capacity'}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label className="text-xs font-medium">House Name <span className="text-red-500">*</span></Label>
              <Input value={houseForm.house_name} onChange={e => setHouseForm({ ...houseForm, house_name: e.target.value })} placeholder="e.g., Greenfield House" className="min-h-[44px]" />
            </div>
            <div className="grid gap-2">
              <Label className="text-xs font-medium">Description</Label>
              <Textarea value={houseForm.house_description} onChange={e => setHouseForm({ ...houseForm, house_description: e.target.value })} rows={2} placeholder="Brief description" className="min-h-[44px]" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label className="text-xs font-medium">Capacity</Label>
                <Input type="number" value={houseForm.house_capacity} onChange={e => setHouseForm({ ...houseForm, house_capacity: e.target.value })} placeholder="Number of students" className="min-h-[44px]" />
              </div>
              <div className="grid gap-2">
                <Label className="text-xs font-medium">Year Established</Label>
                <Input value={houseForm.house_year_established} onChange={e => setHouseForm({ ...houseForm, house_year_established: e.target.value })} placeholder="e.g., 1995" className="min-h-[44px]" />
              </div>
            </div>
            <div className="grid gap-2">
              <Label className="text-xs font-medium">House Master</Label>
              <Select value={houseForm.house_master_id} onValueChange={v => setHouseForm({ ...houseForm, house_master_id: v })}>
                <SelectTrigger className="min-h-[44px]"><SelectValue placeholder="Select teacher" /></SelectTrigger>
                <SelectContent className="max-h-60">
                  <SelectItem value="">None</SelectItem>
                  {teachers.map(t => (
                    <SelectItem key={t.teacher_id} value={t.teacher_id.toString()}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label className="text-xs font-medium">GPS Code</Label>
              <Input value={houseForm.house_gps_code} onChange={e => setHouseForm({ ...houseForm, house_gps_code: e.target.value })} placeholder="e.g., GA-123-4567" className="min-h-[44px]" />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setHouseFormOpen(false)} className="min-h-[44px]">Cancel</Button>
            <Button onClick={handleSaveHouse} className="bg-emerald-600 hover:bg-emerald-700 min-h-[44px]" disabled={!houseForm.house_name.trim() || saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {selectedHouse ? 'Update House' : 'Create House'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dormitory Form Dialog */}
      <Dialog open={dormFormOpen} onOpenChange={setDormFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-sky-100 flex items-center justify-center">
                <Building className="w-4 h-4 text-sky-600" />
              </div>
              {selectedDorm ? 'Edit Dormitory' : 'Add Dormitory'}
            </DialogTitle>
            <DialogDescription>{selectedDorm ? 'Update dormitory details' : 'Configure dormitory details'}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label className="text-xs font-medium">Dormitory Name <span className="text-red-500">*</span></Label>
              <Input value={dormForm.dormitory_name} onChange={e => setDormForm({ ...dormForm, dormitory_name: e.target.value })} placeholder="e.g., Block A" className="min-h-[44px]" />
            </div>
            <div className="grid gap-2">
              <Label className="text-xs font-medium">Boarding House</Label>
              <Select value={dormForm.house_id} onValueChange={v => setDormForm({ ...dormForm, house_id: v })}>
                <SelectTrigger className="min-h-[44px]"><SelectValue placeholder="Select house" /></SelectTrigger>
                <SelectContent className="max-h-60">
                  <SelectItem value="">None</SelectItem>
                  {houses.map(h => (
                    <SelectItem key={h.house_id} value={h.house_id.toString()}>{h.house_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label className="text-xs font-medium">Bed Capacity</Label>
                <Input type="number" value={dormForm.dormitory_capacity} onChange={e => setDormForm({ ...dormForm, dormitory_capacity: e.target.value })} placeholder="Max beds" className="min-h-[44px]" />
              </div>
              <div className="grid gap-2">
                <Label className="text-xs font-medium">Type</Label>
                <Select value={dormForm.dormitory_type} onValueChange={v => setDormForm({ ...dormForm, dormitory_type: v })}>
                  <SelectTrigger className="min-h-[44px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Mixed">Mixed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label className="text-xs font-medium">Floor</Label>
                <Input value={dormForm.dormitory_floor} onChange={e => setDormForm({ ...dormForm, dormitory_floor: e.target.value })} placeholder="e.g., 1st Floor" className="min-h-[44px]" />
              </div>
              <div className="grid gap-2">
                <Label className="text-xs font-medium">Bed Code Prefix</Label>
                <Input value={dormForm.bed_code_prefix} onChange={e => setDormForm({ ...dormForm, bed_code_prefix: e.target.value })} placeholder="e.g., A-" className="min-h-[44px]" />
              </div>
            </div>
            <div className="grid gap-2">
              <Label className="text-xs font-medium">Description</Label>
              <Textarea value={dormForm.dormitory_description} onChange={e => setDormForm({ ...dormForm, dormitory_description: e.target.value })} rows={2} placeholder="Brief description" className="min-h-[44px]" />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDormFormOpen(false)} className="min-h-[44px]">Cancel</Button>
            <Button onClick={handleSaveDorm} className="bg-emerald-600 hover:bg-emerald-700 min-h-[44px]" disabled={!dormForm.dormitory_name.trim() || saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {selectedDorm ? 'Update Dormitory' : 'Create Dormitory'}
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
              Assign Student to Boarding
            </DialogTitle>
            <DialogDescription>Link a student to a house and/or dormitory</DialogDescription>
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
                  {availableStudents.slice(0, 50).map(s => (
                    <SelectItem key={s.student_id} value={s.student_id.toString()}>{s.name} ({s.student_code})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-400">{availableStudents.length} unassigned students available</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label className="text-xs font-medium">House</Label>
                <Select value={assignForm.house_id} onValueChange={v => setAssignForm({ ...assignForm, house_id: v })}>
                  <SelectTrigger className="min-h-[44px]"><SelectValue placeholder="None" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {houses.map(h => <SelectItem key={h.house_id} value={h.house_id.toString()}>{h.house_name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label className="text-xs font-medium">Dormitory</Label>
                <Select value={assignForm.dormitory_id} onValueChange={v => setAssignForm({ ...assignForm, dormitory_id: v })}>
                  <SelectTrigger className="min-h-[44px]"><SelectValue placeholder="None" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {dormitories.map(d => <SelectItem key={d.dormitory_id} value={d.dormitory_id.toString()}>{d.dormitory_name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label className="text-xs font-medium">Bed Number</Label>
                <Input value={assignForm.bed_number} onChange={e => setAssignForm({ ...assignForm, bed_number: e.target.value })} placeholder="e.g., A-12" className="min-h-[44px]" />
              </div>
              <div className="grid gap-2">
                <Label className="text-xs font-medium">Academic Year</Label>
                <Input value={assignForm.academic_year} onChange={e => setAssignForm({ ...assignForm, academic_year: e.target.value })} placeholder="2025" className="min-h-[44px]" />
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setAssignOpen(false)} className="min-h-[44px]">Cancel</Button>
            <Button onClick={handleAssign} className="bg-emerald-600 hover:bg-emerald-700 min-h-[44px]" disabled={!assignForm.student_id || saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Assign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Assignment Dialog */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                <Eye className="w-4 h-4 text-emerald-600" />
              </div>
              Assignment Details
            </DialogTitle>
          </DialogHeader>
          {selectedAssignment && (() => {
            const st = getStudent(selectedAssignment.student_id);
            return (
              <div className="space-y-4">
                <div className="bg-slate-50 rounded-xl p-4 text-center">
                  <Avatar className="w-14 h-14 mx-auto mb-2">
                    <AvatarFallback className="bg-emerald-200 text-emerald-800 text-lg font-bold">{st?.name?.charAt(0) || '?'}</AvatarFallback>
                  </Avatar>
                  <p className="font-bold text-lg text-slate-900">{st?.name || `#${selectedAssignment.student_id}`}</p>
                  <p className="text-sm text-slate-500">{st?.student_code}{st?.class_name ? ` \u00b7 ${st.class_name}` : ''}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 rounded-lg p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Home className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-[10px] text-slate-500">House</span>
                    </div>
                    <p className="text-sm font-medium text-slate-900">{getHouseName(selectedAssignment.house_id)}</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Building className="w-3.5 h-3.5 text-sky-600" />
                      <span className="text-[10px] text-slate-500">Dormitory</span>
                    </div>
                    <p className="text-sm font-medium text-slate-900">{getDormName(selectedAssignment.dormitory_id)}</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <BedDouble className="w-3.5 h-3.5 text-amber-600" />
                      <span className="text-[10px] text-slate-500">Bed</span>
                    </div>
                    <p className="text-sm font-medium text-slate-900">{selectedAssignment.bed_number || 'Not assigned'}</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <CalendarDays className="w-3.5 h-3.5 text-violet-600" />
                      <span className="text-[10px] text-slate-500">Academic Year</span>
                    </div>
                    <p className="text-sm font-medium text-slate-900">{selectedAssignment.academic_year || '\u2014'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <MapPin className="w-4 h-4 flex-shrink-0" />
                  <span>Assigned {selectedAssignment.assigned_at ? format(new Date(selectedAssignment.assigned_at), 'MMMM d, yyyy') : 'Unknown'}</span>
                </div>
              </div>
            );
          })()}
          <DialogFooter>
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
              Delete {deleteType === 'house' ? 'House' : deleteType === 'dormitory' ? 'Dormitory' : 'Assignment'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this {deleteType}? This action cannot be undone.
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
