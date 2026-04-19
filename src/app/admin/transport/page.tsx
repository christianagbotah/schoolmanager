'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
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
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import {
  Bus, Plus, Search, Pencil, Trash2, Users, DollarSign,
  CheckCircle, Loader2, Car, UserCheck,
  Route, GraduationCap, X, Eye,
  Truck, ClipboardCheck, Phone, UserCircle,
  MapPin, ArrowRightLeft, CalendarDays, IdCard, Wrench,
  Navigation, User, CircleDot,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface TransportRoute {
  transport_id: number; route_name: string; route_code: string;
  description: string; vehicle_number: string; driver_id: number | null;
  fare: number; facilities: string; total_stops: number;
  studentCount: number; driver: { driver_id: number; name: string; phone: string; status: string } | null;
}

interface Driver {
  driver_id: number; name: string; phone: string; email: string;
  license_number: string; license_expiry: string | null;
  status: string; vehicle_id: number | null;
  assignedVehicle: { vehicle_id: number; vehicle_name: string; plate_number: string } | null;
}

interface TransportVehicle {
  vehicle_id: number; vehicle_name: string; plate_number: string;
  vehicle_type: string; capacity: number; driver_id: number | null;
  status: string; created_at: string;
  driver: { driver_id: number; name: string } | null;
}

interface Student {
  student_id: number; name: string; student_code: string;
}

interface TransportStudent {
  bus_attendance_id: number; student_id: number; name: string;
  student_code: string; phone: string; class: string; guardian_phone: string;
}

interface AttendanceStudent {
  bus_attendance_id: number; student_id: number; name: string;
  student_code: string; class: string; status: string;
}

// ─── Skeleton Components ─────────────────────────────────────────────────────

function StatCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-slate-200/60 p-4 flex flex-col">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-2.5">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-7 w-14" />
        </div>
        <Skeleton className="w-10 h-10 rounded-xl flex-shrink-0" />
      </div>
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full rounded-lg" />
      ))}
    </div>
  );
}

// ─── Stat Card Component ─────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, subValue, iconBg, borderColor }: {
  icon: React.ElementType; label: string; value: string | number;
  subValue?: string; iconBg: string; borderColor: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200/60 p-4 hover:shadow-sm transition-all flex flex-col" style={{ borderLeft: `4px solid ${borderColor}` }}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">{value}</p>
          {subValue && <p className="text-xs text-slate-500 mt-1">{subValue}</p>}
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
    </div>
  );
}

// ─── Status Badge ────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const isActive = status === 'Active';
  return (
    <Badge variant="secondary" className={`text-[10px] font-semibold px-2 py-0.5 ${isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
      <CircleDot className="w-2.5 h-2.5 mr-1" />
      {status || 'Active'}
    </Badge>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function TransportPage() {
  // ─── Core Data ────────────────────────────────────────────────────────────
  const [routes, setRoutes] = useState<TransportRoute[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<TransportVehicle[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('routes');

  // ─── Route Dialog States ──────────────────────────────────────────────────
  const [routeFormOpen, setRouteFormOpen] = useState(false);
  const [routeDeleteOpen, setRouteDeleteOpen] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<TransportRoute | null>(null);
  const [routeSaving, setRouteSaving] = useState(false);
  const [routeFormErrors, setRouteFormErrors] = useState<Record<string, string>>({});
  const [routeForm, setRouteForm] = useState({
    route_name: '', description: '', vehicle_number: '', driver_id: '',
    fare: '', facilities: '',
  });

  // ─── Vehicle Dialog States ────────────────────────────────────────────────
  const [vehicleFormOpen, setVehicleFormOpen] = useState(false);
  const [vehicleDeleteOpen, setVehicleDeleteOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<TransportVehicle | null>(null);
  const [vehicleSaving, setVehicleSaving] = useState(false);
  const [vehicleFormErrors, setVehicleFormErrors] = useState<Record<string, string>>({});
  const [vehicleForm, setVehicleForm] = useState({
    vehicle_name: '', plate_number: '', vehicle_type: 'Bus',
    capacity: '', driver_id: '', status: 'Active',
  });

  // ─── Driver Dialog States ─────────────────────────────────────────────────
  const [driverFormOpen, setDriverFormOpen] = useState(false);
  const [driverDeleteOpen, setDriverDeleteOpen] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [driverSaving, setDriverSaving] = useState(false);
  const [driverFormErrors, setDriverFormErrors] = useState<Record<string, string>>({});
  const [driverForm, setDriverForm] = useState({
    name: '', phone: '', email: '', license_number: '',
    license_expiry: '', vehicle_id: '', status: 'Active',
  });

  // ─── Assign Students Dialog States ────────────────────────────────────────
  const [assignOpen, setAssignOpen] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
  const [studentSearch, setStudentSearch] = useState('');

  // ─── Reassign Dialog States ───────────────────────────────────────────────
  const [reassignOpen, setReassignOpen] = useState(false);
  const [reassignStudent, setReassignStudent] = useState<TransportStudent | null>(null);
  const [reassignToRoute, setReassignToRoute] = useState('');

  // ─── Students Tab State ───────────────────────────────────────────────────
  const [studentsTabRoute, setStudentsTabRoute] = useState<string>('');
  const [transportStudents, setTransportStudents] = useState<TransportStudent[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(false);

  // ─── Attendance Tab State ─────────────────────────────────────────────────
  const [attendanceRoute, setAttendanceRoute] = useState<string>('');
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceSession, setAttendanceSession] = useState('both');
  const [attendanceStudents, setAttendanceStudents] = useState<AttendanceStudent[]>([]);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [attendanceLoaded, setAttendanceLoaded] = useState(false);
  const [attendanceSaving, setAttendanceSaving] = useState(false);

  // ─── Computed ─────────────────────────────────────────────────────────────

  const driverMap = useMemo(() => {
    const map = new Map<number, Driver>();
    drivers.forEach(d => map.set(d.driver_id, d));
    return map;
  }, [drivers]);

  const filteredStudents = useMemo(() => {
    if (!studentSearch.trim()) return students;
    const q = studentSearch.toLowerCase();
    return students.filter(s =>
      s.name.toLowerCase().includes(q) || s.student_code.toLowerCase().includes(q)
    );
  }, [students, studentSearch]);

  const filteredRoutes = useMemo(() => {
    if (!search.trim()) return routes;
    const q = search.toLowerCase();
    return routes.filter(r =>
      r.route_name.toLowerCase().includes(q) ||
      r.vehicle_number.toLowerCase().includes(q) ||
      r.description.toLowerCase().includes(q)
    );
  }, [routes, search]);

  const totalFare = routes.reduce((sum, r) => sum + r.studentCount * r.fare, 0);
  const totalStudents = routes.reduce((s, r) => s + r.studentCount, 0);
  const activeDriverCount = drivers.filter(d => d.status === 'Active').length;

  // ─── Data Fetching ────────────────────────────────────────────────────────

  const fetchRoutes = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      const res = await fetch(`/api/admin/transport?${params}`);
      const data = await res.json();
      setRoutes(Array.isArray(data) ? data : []);
    } catch { toast.error('Failed to fetch routes'); }
    setLoading(false);
  }, [search]);

  const fetchDrivers = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/transport/drivers');
      const data = await res.json();
      setDrivers(Array.isArray(data) ? data : []);
    } catch { /* empty */ }
  }, []);

  const fetchVehicles = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/transport/vehicles');
      const data = await res.json();
      setVehicles(Array.isArray(data) ? data : []);
    } catch { /* empty */ }
  }, []);

  useEffect(() => { fetchRoutes(); fetchDrivers(); fetchVehicles(); }, [fetchRoutes, fetchDrivers, fetchVehicles]);

  const fetchStudents = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/students');
      const data = await res.json();
      setStudents(Array.isArray(data) ? data.slice(0, 200) : []);
    } catch { /* empty */ }
  }, []);

  // ═══════════════════════════════════════════════════════════════════════════
  // ROUTE CRUD
  // ═══════════════════════════════════════════════════════════════════════════

  const validateRouteForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!routeForm.route_name.trim()) errors.route_name = 'Route name is required';
    if (!routeForm.vehicle_number.trim()) errors.vehicle_number = 'Vehicle number is required';
    if (routeForm.fare && isNaN(Number(routeForm.fare))) errors.fare = 'Fare must be a number';
    if (routeForm.fare && Number(routeForm.fare) < 0) errors.fare = 'Fare cannot be negative';
    setRouteFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const openCreateRoute = () => {
    setSelectedRoute(null);
    setRouteForm({ route_name: '', description: '', vehicle_number: '', driver_id: '', fare: '', facilities: '' });
    setRouteFormErrors({});
    setRouteFormOpen(true);
  };

  const openEditRoute = (r: TransportRoute) => {
    setSelectedRoute(r);
    setRouteForm({
      route_name: r.route_name, description: r.description, vehicle_number: r.vehicle_number,
      driver_id: r.driver_id?.toString() || '', fare: r.fare.toString(), facilities: r.facilities,
    });
    setRouteFormErrors({});
    setRouteFormOpen(true);
  };

  const handleSaveRoute = async () => {
    if (!validateRouteForm()) return;
    setRouteSaving(true);
    try {
      const url = selectedRoute ? `/api/admin/transport?id=${selectedRoute.transport_id}` : '/api/admin/transport';
      const method = selectedRoute ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...routeForm, driver_id: routeForm.driver_id || null, fare: routeForm.fare ? Number(routeForm.fare) : 0 }),
      });
      if (!res.ok) throw new Error('Failed');
      toast.success(selectedRoute ? 'Route updated successfully' : 'Route created successfully');
      setRouteFormOpen(false);
      fetchRoutes();
    } catch { toast.error('Failed to save route'); }
    setRouteSaving(false);
  };

  const handleDeleteRoute = async () => {
    if (!selectedRoute) return;
    try {
      const res = await fetch(`/api/admin/transport?id=${selectedRoute.transport_id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed');
      toast.success('Route deleted');
      setRouteDeleteOpen(false);
      fetchRoutes();
    } catch { toast.error('Failed to delete route'); }
  };

  const openAssign = (r: TransportRoute) => {
    setSelectedRoute(r);
    setSelectedStudents([]);
    setStudentSearch('');
    fetchStudents();
    setAssignOpen(true);
  };

  const handleAssign = async () => {
    if (!selectedRoute || selectedStudents.length === 0) return;
    setRouteSaving(true);
    try {
      const res = await fetch('/api/admin/transport/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batch_assign: true,
          student_ids: selectedStudents,
          route_id: selectedRoute.transport_id,
          attendance_date: new Date().toISOString().split('T')[0],
          total_fare: selectedRoute.fare,
        }),
      });
      if (!res.ok) throw new Error('Failed');
      toast.success(`${selectedStudents.length} student(s) assigned to ${selectedRoute.route_name}`);
      setAssignOpen(false);
      fetchRoutes();
    } catch { toast.error('Failed to assign students'); }
    setRouteSaving(false);
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // VEHICLE CRUD
  // ═══════════════════════════════════════════════════════════════════════════

  const validateVehicleForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!vehicleForm.vehicle_name.trim()) errors.vehicle_name = 'Vehicle name is required';
    if (!vehicleForm.plate_number.trim()) errors.plate_number = 'Plate number is required';
    setVehicleFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const openCreateVehicle = () => {
    setSelectedVehicle(null);
    setVehicleForm({ vehicle_name: '', plate_number: '', vehicle_type: 'Bus', capacity: '', driver_id: '', status: 'Active' });
    setVehicleFormErrors({});
    setVehicleFormOpen(true);
  };

  const openEditVehicle = (v: TransportVehicle) => {
    setSelectedVehicle(v);
    setVehicleForm({
      vehicle_name: v.vehicle_name, plate_number: v.plate_number,
      vehicle_type: v.vehicle_type, capacity: v.capacity.toString(),
      driver_id: v.driver_id?.toString() || '', status: v.status,
    });
    setVehicleFormErrors({});
    setVehicleFormOpen(true);
  };

  const handleSaveVehicle = async () => {
    if (!validateVehicleForm()) return;
    setVehicleSaving(true);
    try {
      const url = selectedVehicle ? `/api/admin/transport/vehicles?id=${selectedVehicle.vehicle_id}` : '/api/admin/transport/vehicles';
      const method = selectedVehicle ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...vehicleForm,
          driver_id: vehicleForm.driver_id || null,
          capacity: vehicleForm.capacity ? Number(vehicleForm.capacity) : 0,
        }),
      });
      if (!res.ok) throw new Error('Failed');
      toast.success(selectedVehicle ? 'Vehicle updated successfully' : 'Vehicle created successfully');
      setVehicleFormOpen(false);
      fetchVehicles();
      fetchDrivers();
      fetchRoutes();
    } catch { toast.error('Failed to save vehicle'); }
    setVehicleSaving(false);
  };

  const handleDeleteVehicle = async () => {
    if (!selectedVehicle) return;
    try {
      const res = await fetch(`/api/admin/transport/vehicles?id=${selectedVehicle.vehicle_id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed');
      toast.success('Vehicle deleted');
      setVehicleDeleteOpen(false);
      fetchVehicles();
      fetchDrivers();
    } catch { toast.error('Failed to delete vehicle'); }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // DRIVER CRUD
  // ═══════════════════════════════════════════════════════════════════════════

  const validateDriverForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!driverForm.name.trim()) errors.name = 'Driver name is required';
    if (!driverForm.license_number.trim()) errors.license_number = 'License number is required';
    setDriverFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const openCreateDriver = () => {
    setSelectedDriver(null);
    setDriverForm({ name: '', phone: '', email: '', license_number: '', license_expiry: '', vehicle_id: '', status: 'Active' });
    setDriverFormErrors({});
    setDriverFormOpen(true);
  };

  const openEditDriver = (d: Driver) => {
    setSelectedDriver(d);
    setDriverForm({
      name: d.name, phone: d.phone, email: d.email,
      license_number: d.license_number, license_expiry: d.license_expiry || '',
      vehicle_id: d.vehicle_id?.toString() || '', status: d.status,
    });
    setDriverFormErrors({});
    setDriverFormOpen(true);
  };

  const handleSaveDriver = async () => {
    if (!validateDriverForm()) return;
    setDriverSaving(true);
    try {
      const url = selectedDriver ? `/api/admin/transport/drivers?id=${selectedDriver.driver_id}` : '/api/admin/transport/drivers';
      const method = selectedDriver ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...driverForm,
          vehicle_id: driverForm.vehicle_id || null,
        }),
      });
      if (!res.ok) throw new Error('Failed');
      toast.success(selectedDriver ? 'Driver updated successfully' : 'Driver created successfully');
      setDriverFormOpen(false);
      fetchDrivers();
      fetchVehicles();
      fetchRoutes();
    } catch { toast.error('Failed to save driver'); }
    setDriverSaving(false);
  };

  const handleDeleteDriver = async () => {
    if (!selectedDriver) return;
    try {
      const res = await fetch(`/api/admin/transport/drivers?id=${selectedDriver.driver_id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed');
      toast.success('Driver deleted');
      setDriverDeleteOpen(false);
      fetchDrivers();
      fetchVehicles();
    } catch { toast.error('Failed to delete driver'); }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // STUDENTS TAB
  // ═══════════════════════════════════════════════════════════════════════════

  const loadTransportStudents = useCallback(async () => {
    if (!studentsTabRoute) { toast.error('Please select a route'); return; }
    setStudentsLoading(true);
    try {
      const res = await fetch(`/api/admin/transport/attendance?action=students&route_id=${studentsTabRoute}`);
      const data = await res.json();
      setTransportStudents(Array.isArray(data) ? data : []);
    } catch { toast.error('Failed to load students'); }
    setStudentsLoading(false);
  }, [studentsTabRoute]);

  const handleUnassign = async (student: TransportStudent) => {
    try {
      const res = await fetch(`/api/admin/transport/attendance?student_id=${student.student_id}&route_id=${studentsTabRoute}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed');
      toast.success(`${student.name} removed from route`);
      loadTransportStudents();
      fetchRoutes();
    } catch { toast.error('Failed to unassign student'); }
  };

  const handleReassign = (student: TransportStudent) => {
    setReassignStudent(student);
    setReassignToRoute('');
    setReassignOpen(true);
  };

  const confirmReassign = async () => {
    if (!reassignStudent || !reassignToRoute) { toast.error('Please select a route'); return; }
    try {
      const res = await fetch('/api/admin/transport/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reassign: true,
          student_id: reassignStudent.student_id,
          from_route_id: parseInt(studentsTabRoute),
          to_route_id: parseInt(reassignToRoute),
        }),
      });
      if (!res.ok) throw new Error('Failed');
      toast.success(`${reassignStudent.name} reassigned successfully`);
      setReassignOpen(false);
      loadTransportStudents();
      fetchRoutes();
    } catch { toast.error('Failed to reassign student'); }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // ATTENDANCE TAB
  // ═══════════════════════════════════════════════════════════════════════════

  const loadAttendance = useCallback(async () => {
    if (!attendanceRoute) { toast.error('Please select a route'); return; }
    setAttendanceLoading(true);
    try {
      const params = new URLSearchParams({
        action: 'attendance',
        route_id: attendanceRoute,
        date: attendanceDate,
        session: attendanceSession,
      });
      const res = await fetch(`/api/admin/transport/attendance?${params}`);
      const data = await res.json();
      setAttendanceStudents(Array.isArray(data) ? data : []);
      setAttendanceLoaded(true);
    } catch { toast.error('Failed to load students for attendance'); }
    setAttendanceLoading(false);
  }, [attendanceRoute, attendanceDate, attendanceSession]);

  const markAllAttendance = (status: string) => {
    setAttendanceStudents(prev => prev.map(s => ({ ...s, status })));
  };

  const handleAttendanceChange = (studentId: number, status: string) => {
    setAttendanceStudents(prev => prev.map(s =>
      s.student_id === studentId ? { ...s, status } : s
    ));
  };

  const saveAttendance = async () => {
    if (!attendanceRoute) return;
    setAttendanceSaving(true);
    try {
      const attendance: Record<string, string> = {};
      attendanceStudents.forEach(s => { attendance[s.student_id.toString()] = s.status; });

      const res = await fetch('/api/admin/transport/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mark_attendance: true,
          route_id: parseInt(attendanceRoute),
          date: attendanceDate,
          session: attendanceSession,
          attendance,
        }),
      });
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      toast.success(`Attendance saved for ${data.count} students`);
    } catch { toast.error('Failed to save attendance'); }
    setAttendanceSaving(false);
  };

  // ─── Loading State ─────────────────────────────────────────────────────────

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-5">
          <Skeleton className="h-8 w-56" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCardSkeleton /><StatCardSkeleton /><StatCardSkeleton /><StatCardSkeleton />
          </div>
          <TableSkeleton />
        </div>
      </DashboardLayout>
    );
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <DashboardLayout>
      <div className="space-y-5">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Transport Management</h1>
            <p className="text-sm text-slate-500 mt-0.5">Routes, vehicles, drivers, students and attendance</p>
          </div>
          <div className="flex gap-2">
            {activeTab === 'routes' && (
              <Button onClick={openCreateRoute} className="bg-emerald-600 hover:bg-emerald-700 min-h-[44px] shadow-sm">
                <Plus className="w-4 h-4 mr-2" /> Add Route
              </Button>
            )}
            {activeTab === 'vehicles' && (
              <Button onClick={openCreateVehicle} className="bg-emerald-600 hover:bg-emerald-700 min-h-[44px] shadow-sm">
                <Plus className="w-4 h-4 mr-2" /> Add Vehicle
              </Button>
            )}
            {activeTab === 'drivers' && (
              <Button onClick={openCreateDriver} className="bg-emerald-600 hover:bg-emerald-700 min-h-[44px] shadow-sm">
                <Plus className="w-4 h-4 mr-2" /> Add Driver
              </Button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard icon={Bus} label="Routes" value={routes.length} subValue={`${activeDriverCount} active drivers`} iconBg="bg-emerald-500" borderColor="#10b981" />
          <StatCard icon={Car} label="Vehicles" value={vehicles.length} subValue="Fleet total" iconBg="bg-sky-500" borderColor="#0ea5e9" />
          <StatCard icon={Users} label="Students" value={totalStudents} subValue={`Across ${routes.length} routes`} iconBg="bg-amber-500" borderColor="#f59e0b" />
          <StatCard icon={DollarSign} label="Revenue" value={`GHS ${totalFare.toLocaleString()}`} subValue="Monthly total" iconBg="bg-violet-500" borderColor="#8b5cf6" />
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-white border border-slate-200 p-1 rounded-xl h-auto flex w-full sm:w-auto overflow-x-auto">
            <TabsTrigger value="routes" className="flex-1 min-w-[90px] data-[state=active]:bg-emerald-600 data-[state=active]:text-white rounded-lg py-2 text-sm whitespace-nowrap">
              <Route className="w-4 h-4 mr-1.5 hidden sm:inline" /> Routes
            </TabsTrigger>
            <TabsTrigger value="vehicles" className="flex-1 min-w-[90px] data-[state=active]:bg-emerald-600 data-[state=active]:text-white rounded-lg py-2 text-sm whitespace-nowrap">
              <Truck className="w-4 h-4 mr-1.5 hidden sm:inline" /> Vehicles
            </TabsTrigger>
            <TabsTrigger value="drivers" className="flex-1 min-w-[90px] data-[state=active]:bg-emerald-600 data-[state=active]:text-white rounded-lg py-2 text-sm whitespace-nowrap">
              <User className="w-4 h-4 mr-1.5 hidden sm:inline" /> Drivers
            </TabsTrigger>
            <TabsTrigger value="students" className="flex-1 min-w-[90px] data-[state=active]:bg-emerald-600 data-[state=active]:text-white rounded-lg py-2 text-sm whitespace-nowrap">
              <GraduationCap className="w-4 h-4 mr-1.5 hidden sm:inline" /> Students
            </TabsTrigger>
            <TabsTrigger value="attendance" className="flex-1 min-w-[90px] data-[state=active]:bg-emerald-600 data-[state=active]:text-white rounded-lg py-2 text-sm whitespace-nowrap">
              <ClipboardCheck className="w-4 h-4 mr-1.5 hidden sm:inline" /> Attendance
            </TabsTrigger>
          </TabsList>

          {/* ═══════════════════════════════════════════════════════════════════
              ROUTES TAB
          ═══════════════════════════════════════════════════════════════════ */}
          <TabsContent value="routes">
            {/* Search */}
            <div className="bg-white rounded-xl border border-slate-200/60 p-4 mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input placeholder="Search routes by name, vehicle or description..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 min-h-[44px]" />
                {search && (
                  <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full hover:bg-slate-200 flex items-center justify-center">
                    <X className="w-3 h-3 text-slate-400" />
                  </button>
                )}
              </div>
            </div>

            {filteredRoutes.length === 0 ? (
              <Card className="py-16 border-slate-200/60">
                <CardContent className="flex flex-col items-center gap-3">
                  <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center"><Bus className="w-8 h-8 text-slate-300" /></div>
                  <p className="text-slate-500 font-medium">No routes found</p>
                  <p className="text-sm text-slate-400">{search ? 'Try a different search' : 'Create your first transport route'}</p>
                  {!search && <Button onClick={openCreateRoute} variant="outline" className="mt-2 min-h-[44px]"><Plus className="w-4 h-4 mr-2" /> Add Route</Button>}
                </CardContent>
              </Card>
            ) : (
              <Card className="border-slate-200/60">
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50 hover:bg-slate-50">
                          <TableHead className="text-xs font-semibold text-slate-600">Route Name</TableHead>
                          <TableHead className="text-xs font-semibold text-slate-600">Vehicle</TableHead>
                          <TableHead className="text-xs font-semibold text-slate-600">Driver</TableHead>
                          <TableHead className="text-xs font-semibold text-slate-600 text-right">Fare</TableHead>
                          <TableHead className="text-xs font-semibold text-slate-600 hidden md:table-cell">Facilities</TableHead>
                          <TableHead className="text-xs font-semibold text-slate-600 hidden lg:table-cell">Students</TableHead>
                          <TableHead className="text-xs font-semibold text-slate-600">Status</TableHead>
                          <TableHead className="text-xs font-semibold text-slate-600 text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredRoutes.map(route => {
                          const driver = route.driver_id ? driverMap.get(route.driver_id) : null;
                          const facilityList = route.facilities ? route.facilities.split(',').filter(Boolean) : [];
                          return (
                            <TableRow key={route.transport_id} className="hover:bg-slate-50/50">
                              <TableCell>
                                <div className="min-w-0">
                                  <p className="font-medium text-sm text-slate-900">{route.route_name}</p>
                                  {route.description && <p className="text-xs text-slate-400 truncate max-w-[200px]">{route.description}</p>}
                                </div>
                              </TableCell>
                              <TableCell>
                                {route.vehicle_number ? (
                                  <span className="inline-flex items-center gap-1.5 text-sm text-slate-700">
                                    <Car className="w-3.5 h-3.5 text-slate-400" />
                                    <span className="font-mono text-xs">{route.vehicle_number}</span>
                                  </span>
                                ) : <span className="text-xs text-slate-400 italic">Not Assigned</span>}
                              </TableCell>
                              <TableCell>
                                {driver ? (
                                  <span className="inline-flex items-center gap-1.5 text-sm text-slate-700">
                                    <UserCircle className="w-3.5 h-3.5 text-slate-400" />
                                    {driver.name}
                                  </span>
                                ) : <span className="text-xs text-slate-400 italic">Not Assigned</span>}
                              </TableCell>
                              <TableCell className="text-right">
                                <span className="text-sm font-semibold text-slate-900">GHS {route.fare}</span>
                              </TableCell>
                              <TableCell className="hidden md:table-cell">
                                {facilityList.length > 0 ? (
                                  <div className="flex flex-wrap gap-1">
                                    {facilityList.slice(0, 3).map((f, i) => (
                                      <Badge key={i} variant="outline" className="text-[10px] border-slate-200 text-slate-500">{f.trim()}</Badge>
                                    ))}
                                    {facilityList.length > 3 && (
                                      <Badge variant="outline" className="text-[10px] border-slate-200 text-slate-400">+{facilityList.length - 3}</Badge>
                                    )}
                                  </div>
                                ) : <span className="text-xs text-slate-400">—</span>}
                              </TableCell>
                              <TableCell className="hidden lg:table-cell">
                                <Badge variant="outline" className="text-xs border-slate-200">
                                  <GraduationCap className="w-3 h-3 mr-1 text-slate-400" />{route.studentCount}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <StatusBadge status="Active" />
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-0.5">
                                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openAssign(route)} title="Assign Students">
                                    <Users className="w-4 h-4" />
                                  </Button>
                                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditRoute(route)} title="Edit Route">
                                    <Pencil className="w-4 h-4" />
                                  </Button>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => { setSelectedRoute(route); setRouteDeleteOpen(true); }} title="Delete Route">
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
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
            )}
          </TabsContent>

          {/* ═══════════════════════════════════════════════════════════════════
              VEHICLES TAB
          ═══════════════════════════════════════════════════════════════════ */}
          <TabsContent value="vehicles">
            {vehicles.length === 0 ? (
              <Card className="py-16 border-slate-200/60">
                <CardContent className="flex flex-col items-center gap-3">
                  <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center"><Truck className="w-8 h-8 text-slate-300" /></div>
                  <p className="text-slate-500 font-medium">No vehicles registered</p>
                  <p className="text-sm text-slate-400">Add your first vehicle to the fleet</p>
                  <Button onClick={openCreateVehicle} variant="outline" className="mt-2 min-h-[44px]"><Plus className="w-4 h-4 mr-2" /> Add Vehicle</Button>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-slate-200/60">
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50 hover:bg-slate-50">
                          <TableHead className="text-xs font-semibold text-slate-600">Vehicle Number</TableHead>
                          <TableHead className="text-xs font-semibold text-slate-600 hidden sm:table-cell">Type</TableHead>
                          <TableHead className="text-xs font-semibold text-slate-600 hidden md:table-cell">Capacity</TableHead>
                          <TableHead className="text-xs font-semibold text-slate-600">Driver</TableHead>
                          <TableHead className="text-xs font-semibold text-slate-600 hidden lg:table-cell">Route</TableHead>
                          <TableHead className="text-xs font-semibold text-slate-600">Status</TableHead>
                          <TableHead className="text-xs font-semibold text-slate-600 text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {vehicles.map(vehicle => {
                          const assignedRoute = routes.find(r => r.vehicle_number === vehicle.plate_number);
                          return (
                            <TableRow key={vehicle.vehicle_id} className="hover:bg-slate-50/50">
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 rounded-lg bg-sky-50 flex items-center justify-center border border-sky-100">
                                    <Truck className="w-4 h-4 text-sky-600" />
                                  </div>
                                  <div>
                                    <p className="font-semibold text-sm text-slate-900">{vehicle.vehicle_name}</p>
                                    <p className="text-xs font-mono text-slate-400">{vehicle.plate_number}</p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="hidden sm:table-cell text-sm text-slate-600">{vehicle.vehicle_type || 'N/A'}</TableCell>
                              <TableCell className="hidden md:table-cell text-sm text-slate-600">{vehicle.capacity > 0 ? `${vehicle.capacity} seats` : '—'}</TableCell>
                              <TableCell>
                                {vehicle.driver ? (
                                  <span className="text-sm text-slate-700">{vehicle.driver.name}</span>
                                ) : <span className="text-xs text-slate-400 italic">Not Assigned</span>}
                              </TableCell>
                              <TableCell className="hidden lg:table-cell">
                                {assignedRoute ? (
                                  <span className="text-sm text-slate-700">{assignedRoute.route_name}</span>
                                ) : <span className="text-xs text-slate-400 italic">Not Assigned</span>}
                              </TableCell>
                              <TableCell><StatusBadge status={vehicle.status} /></TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-0.5">
                                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditVehicle(vehicle)} title="Edit Vehicle"><Pencil className="w-4 h-4" /></Button>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => { setSelectedVehicle(vehicle); setVehicleDeleteOpen(true); }} title="Delete Vehicle"><Trash2 className="w-4 h-4" /></Button>
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
            )}
          </TabsContent>

          {/* ═══════════════════════════════════════════════════════════════════
              DRIVERS TAB
          ═══════════════════════════════════════════════════════════════════ */}
          <TabsContent value="drivers">
            {drivers.length === 0 ? (
              <Card className="py-16 border-slate-200/60">
                <CardContent className="flex flex-col items-center gap-3">
                  <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center"><UserCheck className="w-8 h-8 text-slate-300" /></div>
                  <p className="text-slate-500 font-medium">No drivers registered</p>
                  <p className="text-sm text-slate-400">Add your first driver</p>
                  <Button onClick={openCreateDriver} variant="outline" className="mt-2 min-h-[44px]"><Plus className="w-4 h-4 mr-2" /> Add Driver</Button>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-slate-200/60">
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50 hover:bg-slate-50">
                          <TableHead className="text-xs font-semibold text-slate-600">Name</TableHead>
                          <TableHead className="text-xs font-semibold text-slate-600 hidden sm:table-cell">Phone</TableHead>
                          <TableHead className="text-xs font-semibold text-slate-600 hidden md:table-cell">License #</TableHead>
                          <TableHead className="text-xs font-semibold text-slate-600">Assigned Vehicle</TableHead>
                          <TableHead className="text-xs font-semibold text-slate-600">Status</TableHead>
                          <TableHead className="text-xs font-semibold text-slate-600 text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {drivers.map(driver => (
                          <TableRow key={driver.driver_id} className="hover:bg-slate-50/50">
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center border border-emerald-100">
                                  <User className="w-4 h-4 text-emerald-600" />
                                </div>
                                <p className="font-medium text-sm text-slate-900">{driver.name}</p>
                              </div>
                            </TableCell>
                            <TableCell className="hidden sm:table-cell">
                              {driver.phone ? (
                                <span className="inline-flex items-center gap-1 text-sm text-slate-600"><Phone className="w-3 h-3 text-slate-400" />{driver.phone}</span>
                              ) : <span className="text-xs text-slate-400">—</span>}
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                              {driver.license_number ? (
                                <span className="inline-flex items-center gap-1 text-sm text-slate-600"><IdCard className="w-3 h-3 text-slate-400" />{driver.license_number}</span>
                              ) : <span className="text-xs text-slate-400">N/A</span>}
                            </TableCell>
                            <TableCell>
                              {driver.assignedVehicle ? (
                                <span className="text-sm text-slate-700">{driver.assignedVehicle.plate_number}</span>
                              ) : <span className="text-xs text-slate-400 italic">Not Assigned</span>}
                            </TableCell>
                            <TableCell><StatusBadge status={driver.status} /></TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-0.5">
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditDriver(driver)} title="Edit Driver"><Pencil className="w-4 h-4" /></Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => { setSelectedDriver(driver); setDriverDeleteOpen(true); }} title="Delete Driver"><Trash2 className="w-4 h-4" /></Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ═══════════════════════════════════════════════════════════════════
              STUDENTS TAB
          ═══════════════════════════════════════════════════════════════════ */}
          <TabsContent value="students">
            <Card className="border-slate-200/60">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row gap-3 mb-4">
                  <div className="flex-1">
                    <Label className="text-xs font-medium text-slate-600 mb-1 block">Select Route</Label>
                    <Select value={studentsTabRoute} onValueChange={setStudentsTabRoute}>
                      <SelectTrigger className="min-h-[44px]"><SelectValue placeholder="Choose a route..." /></SelectTrigger>
                      <SelectContent>
                        {routes.map(r => (
                          <SelectItem key={r.transport_id} value={r.transport_id.toString()}>{r.route_name} ({r.studentCount} students)</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end">
                    <Button onClick={loadTransportStudents} disabled={!studentsTabRoute || studentsLoading} className="bg-emerald-600 hover:bg-emerald-700 min-h-[44px]">
                      {studentsLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Search className="w-4 h-4 mr-2" />}
                      Load Students
                    </Button>
                  </div>
                </div>

                {transportStudents.length > 0 && (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50 hover:bg-slate-50">
                          <TableHead className="text-xs font-semibold text-slate-600">Code</TableHead>
                          <TableHead className="text-xs font-semibold text-slate-600">Name</TableHead>
                          <TableHead className="text-xs font-semibold text-slate-600 hidden sm:table-cell">Class</TableHead>
                          <TableHead className="text-xs font-semibold text-slate-600 hidden md:table-cell">Guardian Phone</TableHead>
                          <TableHead className="text-xs font-semibold text-slate-600 text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {transportStudents.map(student => (
                          <TableRow key={student.bus_attendance_id} className="hover:bg-slate-50/50">
                            <TableCell className="text-xs font-mono text-sky-600">{student.student_code}</TableCell>
                            <TableCell className="text-sm font-medium text-slate-900">{student.name}</TableCell>
                            <TableCell className="hidden sm:table-cell text-sm text-slate-600">{student.class || '—'}</TableCell>
                            <TableCell className="hidden md:table-cell text-sm text-slate-600">{student.guardian_phone || '—'}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button size="sm" variant="ghost" className="h-8 text-xs text-emerald-600 hover:bg-emerald-50" onClick={() => handleReassign(student)}>
                                  <ArrowRightLeft className="w-3 h-3 mr-1" /> Reassign
                                </Button>
                                <Button size="sm" variant="ghost" className="h-8 text-xs text-red-500 hover:bg-red-50" onClick={() => handleUnassign(student)}>
                                  <Trash2 className="w-3 h-3 mr-1" /> Unassign
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}

                {studentsTabRoute && !studentsLoading && transportStudents.length === 0 && (
                  <div className="py-12 text-center text-slate-400">
                    <Users className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="text-sm font-medium">No students assigned to this route</p>
                  </div>
                )}

                {!studentsTabRoute && (
                  <div className="py-12 text-center text-slate-400">
                    <GraduationCap className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="text-sm font-medium">Select a route to view assigned students</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══════════════════════════════════════════════════════════════════
              ATTENDANCE TAB
          ═══════════════════════════════════════════════════════════════════ */}
          <TabsContent value="attendance">
            <Card className="border-slate-200/60">
              <CardContent className="p-4">
                {/* Filters */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div>
                    <Label className="text-xs font-medium text-slate-600 mb-1 block">Route</Label>
                    <Select value={attendanceRoute} onValueChange={setAttendanceRoute}>
                      <SelectTrigger className="min-h-[44px]"><SelectValue placeholder="Select route..." /></SelectTrigger>
                      <SelectContent>
                        {routes.map(r => (
                          <SelectItem key={r.transport_id} value={r.transport_id.toString()}>{r.route_name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-slate-600 mb-1 block">Date</Label>
                    <Input type="date" value={attendanceDate} onChange={e => setAttendanceDate(e.target.value)} className="min-h-[44px]" />
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-slate-600 mb-1 block">Session</Label>
                    <Select value={attendanceSession} onValueChange={setAttendanceSession}>
                      <SelectTrigger className="min-h-[44px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="both">Both</SelectItem>
                        <SelectItem value="morning">Morning</SelectItem>
                        <SelectItem value="afternoon">Afternoon</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end">
                    <Button onClick={loadAttendance} disabled={!attendanceRoute || attendanceLoading} className="bg-emerald-600 hover:bg-emerald-700 min-h-[44px] w-full">
                      {attendanceLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Search className="w-4 h-4 mr-2" />}
                      Load
                    </Button>
                  </div>
                </div>

                {attendanceLoaded && attendanceStudents.length > 0 && (
                  <>
                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 min-h-[40px]" onClick={() => markAllAttendance('present')}>
                        <CheckCircle className="w-3.5 h-3.5 mr-1.5" /> Mark All Present
                      </Button>
                      <Button size="sm" className="bg-red-600 hover:bg-red-700 min-h-[40px]" onClick={() => markAllAttendance('absent')}>
                        <X className="w-3.5 h-3.5 mr-1.5" /> Mark All Absent
                      </Button>
                      <Button size="sm" className="bg-violet-600 hover:bg-violet-700 min-h-[40px] ml-auto" onClick={saveAttendance} disabled={attendanceSaving}>
                        {attendanceSaving ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <ClipboardCheck className="w-3.5 h-3.5 mr-1.5" />}
                        Save Attendance
                      </Button>
                    </div>

                    {/* Attendance Table */}
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-slate-50 hover:bg-slate-50">
                            <TableHead className="text-xs font-semibold text-slate-600">Code</TableHead>
                            <TableHead className="text-xs font-semibold text-slate-600">Name</TableHead>
                            <TableHead className="text-xs font-semibold text-slate-600 hidden sm:table-cell">Class</TableHead>
                            <TableHead className="text-xs font-semibold text-slate-600">Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {attendanceStudents.map(student => (
                            <TableRow key={student.student_id} className="hover:bg-slate-50/50">
                              <TableCell className="text-xs font-mono text-sky-600">{student.student_code}</TableCell>
                              <TableCell className="text-sm font-medium text-slate-900">{student.name}</TableCell>
                              <TableCell className="hidden sm:table-cell text-sm text-slate-600">{student.class || '—'}</TableCell>
                              <TableCell>
                                <Select value={student.status} onValueChange={v => handleAttendanceChange(student.student_id, v)}>
                                  <SelectTrigger className={`h-9 w-[120px] text-xs font-semibold ${
                                    student.status === 'present' ? 'text-emerald-700 border-emerald-200 bg-emerald-50' :
                                    student.status === 'absent' ? 'text-red-700 border-red-200 bg-red-50' :
                                    'text-amber-700 border-amber-200 bg-amber-50'
                                  }`}>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="present">Present</SelectItem>
                                    <SelectItem value="absent">Absent</SelectItem>
                                    <SelectItem value="late">Late</SelectItem>
                                  </SelectContent>
                                </Select>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </>
                )}

                {attendanceLoaded && attendanceStudents.length === 0 && (
                  <div className="py-12 text-center text-slate-400">
                    <ClipboardCheck className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="text-sm font-medium">No students found on this route</p>
                  </div>
                )}

                {!attendanceLoaded && (
                  <div className="py-12 text-center text-slate-400">
                    <MapPin className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="text-sm font-medium">Select a route and click Load to view students</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          DIALOGS
      ═══════════════════════════════════════════════════════════════════════ */}

      {/* ─── Add/Edit Route Dialog ─── */}
      <Dialog open={routeFormOpen} onOpenChange={setRouteFormOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                <Bus className="w-4 h-4 text-emerald-600" />
              </div>
              {selectedRoute ? 'Edit Route' : 'Add New Route'}
            </DialogTitle>
            <DialogDescription>{selectedRoute ? 'Update route details below' : 'Fill in the details to create a new transport route'}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label className="text-xs font-medium">Route Name <span className="text-red-500">*</span></Label>
                <Input value={routeForm.route_name} onChange={e => { setRouteForm({ ...routeForm, route_name: e.target.value }); setRouteFormErrors(p => ({ ...p, route_name: '' })); }} placeholder="e.g. Airport Road - Campus" className={routeFormErrors.route_name ? 'border-red-300' : ''} />
                {routeFormErrors.route_name && <p className="text-xs text-red-500">{routeFormErrors.route_name}</p>}
              </div>
              <div className="grid gap-2">
                <Label className="text-xs font-medium">Vehicle Number <span className="text-red-500">*</span></Label>
                <Input value={routeForm.vehicle_number} onChange={e => { setRouteForm({ ...routeForm, vehicle_number: e.target.value }); setRouteFormErrors(p => ({ ...p, vehicle_number: '' })); }} placeholder="e.g. GH-1234-20" className={routeFormErrors.vehicle_number ? 'border-red-300' : ''} />
                {routeFormErrors.vehicle_number && <p className="text-xs text-red-500">{routeFormErrors.vehicle_number}</p>}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label className="text-xs font-medium">Route Fare (GHS) <span className="text-red-500">*</span></Label>
                <Input type="number" step="0.01" min="0" value={routeForm.fare} onChange={e => { setRouteForm({ ...routeForm, fare: e.target.value }); setRouteFormErrors(p => ({ ...p, fare: '' })); }} placeholder="0.00" className={routeFormErrors.fare ? 'border-red-300' : ''} />
                {routeFormErrors.fare && <p className="text-xs text-red-500">{routeFormErrors.fare}</p>}
              </div>
              <div className="grid gap-2">
                <Label className="text-xs font-medium">Assign Driver</Label>
                <Select value={routeForm.driver_id} onValueChange={v => setRouteForm({ ...routeForm, driver_id: v })}>
                  <SelectTrigger className="min-h-[44px]"><SelectValue placeholder="Select a driver" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— No Driver —</SelectItem>
                    {drivers.map(d => (
                      <SelectItem key={d.driver_id} value={d.driver_id.toString()}>{d.name} ({d.phone})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label className="text-xs font-medium">Facilities / Stops</Label>
              <Textarea value={routeForm.facilities} onChange={e => setRouteForm({ ...routeForm, facilities: e.target.value })} rows={2} placeholder="AC, GPS, WiFi (comma-separated). Each item counts as a stop." />
              <p className="text-[10px] text-slate-400">Comma-separated list. Each item is displayed as a stop count.</p>
            </div>
            <div className="grid gap-2">
              <Label className="text-xs font-medium">Description</Label>
              <Textarea value={routeForm.description} onChange={e => setRouteForm({ ...routeForm, description: e.target.value })} rows={2} placeholder="Optional route description..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRouteFormOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveRoute} disabled={routeSaving || !routeForm.route_name.trim() || !routeForm.vehicle_number.trim()} className="bg-emerald-600 hover:bg-emerald-700">
              {routeSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {selectedRoute ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Delete Route Dialog ─── */}
      <AlertDialog open={routeDeleteOpen} onOpenChange={setRouteDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Route</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to delete <strong>{selectedRoute?.route_name}</strong>? All student assignments will also be removed.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteRoute} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ─── Add/Edit Vehicle Dialog ─── */}
      <Dialog open={vehicleFormOpen} onOpenChange={setVehicleFormOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-sky-100 flex items-center justify-center">
                <Truck className="w-4 h-4 text-sky-600" />
              </div>
              {selectedVehicle ? 'Edit Vehicle' : 'Add New Vehicle'}
            </DialogTitle>
            <DialogDescription>{selectedVehicle ? 'Update vehicle details' : 'Register a new vehicle in the fleet'}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label className="text-xs font-medium">Vehicle Name <span className="text-red-500">*</span></Label>
                <Input value={vehicleForm.vehicle_name} onChange={e => { setVehicleForm({ ...vehicleForm, vehicle_name: e.target.value }); setVehicleFormErrors(p => ({ ...p, vehicle_name: '' })); }} placeholder="e.g. Toyota Hiace" className={vehicleFormErrors.vehicle_name ? 'border-red-300' : ''} />
                {vehicleFormErrors.vehicle_name && <p className="text-xs text-red-500">{vehicleFormErrors.vehicle_name}</p>}
              </div>
              <div className="grid gap-2">
                <Label className="text-xs font-medium">Plate Number <span className="text-red-500">*</span></Label>
                <Input value={vehicleForm.plate_number} onChange={e => { setVehicleForm({ ...vehicleForm, plate_number: e.target.value }); setVehicleFormErrors(p => ({ ...p, plate_number: '' })); }} placeholder="e.g. GH-1234-20" className={vehicleFormErrors.plate_number ? 'border-red-300' : ''} />
                {vehicleFormErrors.plate_number && <p className="text-xs text-red-500">{vehicleFormErrors.plate_number}</p>}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label className="text-xs font-medium">Vehicle Type</Label>
                <Select value={vehicleForm.vehicle_type} onValueChange={v => setVehicleForm({ ...vehicleForm, vehicle_type: v })}>
                  <SelectTrigger className="min-h-[44px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Bus">Bus</SelectItem>
                    <SelectItem value="Minibus">Minibus</SelectItem>
                    <SelectItem value="Van">Van</SelectItem>
                    <SelectItem value="Car">Car</SelectItem>
                    <SelectItem value="SUV">SUV</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label className="text-xs font-medium">Seating Capacity</Label>
                <Input type="number" min="0" value={vehicleForm.capacity} onChange={e => setVehicleForm({ ...vehicleForm, capacity: e.target.value })} placeholder="e.g. 33" />
              </div>
            </div>
            <div className="grid gap-2">
              <Label className="text-xs font-medium">Assign Driver</Label>
              <Select value={vehicleForm.driver_id} onValueChange={v => setVehicleForm({ ...vehicleForm, driver_id: v })}>
                <SelectTrigger className="min-h-[44px]"><SelectValue placeholder="Select a driver" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— No Driver —</SelectItem>
                  {drivers.map(d => (
                    <SelectItem key={d.driver_id} value={d.driver_id.toString()}>{d.name} ({d.phone})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label className="text-xs font-medium">Status</Label>
              <Select value={vehicleForm.status} onValueChange={v => setVehicleForm({ ...vehicleForm, status: v })}>
                <SelectTrigger className="min-h-[44px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                  <SelectItem value="Maintenance">Maintenance</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVehicleFormOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveVehicle} disabled={vehicleSaving || !vehicleForm.vehicle_name.trim() || !vehicleForm.plate_number.trim()} className="bg-emerald-600 hover:bg-emerald-700">
              {vehicleSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {selectedVehicle ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Delete Vehicle Dialog ─── */}
      <AlertDialog open={vehicleDeleteOpen} onOpenChange={setVehicleDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Vehicle</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to delete <strong>{selectedVehicle?.vehicle_name}</strong> ({selectedVehicle?.plate_number})? This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteVehicle} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ─── Add/Edit Driver Dialog ─── */}
      <Dialog open={driverFormOpen} onOpenChange={setDriverFormOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                <User className="w-4 h-4 text-amber-600" />
              </div>
              {selectedDriver ? 'Edit Driver' : 'Add New Driver'}
            </DialogTitle>
            <DialogDescription>{selectedDriver ? 'Update driver details' : 'Register a new driver'}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label className="text-xs font-medium">Full Name <span className="text-red-500">*</span></Label>
                <Input value={driverForm.name} onChange={e => { setDriverForm({ ...driverForm, name: e.target.value }); setDriverFormErrors(p => ({ ...p, name: '' })); }} placeholder="e.g. Kwame Asante" className={driverFormErrors.name ? 'border-red-300' : ''} />
                {driverFormErrors.name && <p className="text-xs text-red-500">{driverFormErrors.name}</p>}
              </div>
              <div className="grid gap-2">
                <Label className="text-xs font-medium">Phone <span className="text-red-500">*</span></Label>
                <Input value={driverForm.phone} onChange={e => setDriverForm({ ...driverForm, phone: e.target.value })} placeholder="e.g. 024-123-4567" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label className="text-xs font-medium">License Number <span className="text-red-500">*</span></Label>
                <Input value={driverForm.license_number} onChange={e => { setDriverForm({ ...driverForm, license_number: e.target.value }); setDriverFormErrors(p => ({ ...p, license_number: '' })); }} placeholder="e.g. D/ABC/1234/2020" className={driverFormErrors.license_number ? 'border-red-300' : ''} />
                {driverFormErrors.license_number && <p className="text-xs text-red-500">{driverFormErrors.license_number}</p>}
              </div>
              <div className="grid gap-2">
                <Label className="text-xs font-medium">License Expiry</Label>
                <Input type="date" value={driverForm.license_expiry} onChange={e => setDriverForm({ ...driverForm, license_expiry: e.target.value })} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label className="text-xs font-medium">Email</Label>
              <Input type="email" value={driverForm.email} onChange={e => setDriverForm({ ...driverForm, email: e.target.value })} placeholder="e.g. driver@email.com" />
            </div>
            <div className="grid gap-2">
              <Label className="text-xs font-medium">Assign Vehicle</Label>
              <Select value={driverForm.vehicle_id} onValueChange={v => setDriverForm({ ...driverForm, vehicle_id: v })}>
                <SelectTrigger className="min-h-[44px]"><SelectValue placeholder="Select a vehicle" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— No Vehicle —</SelectItem>
                  {vehicles.map(v => (
                    <SelectItem key={v.vehicle_id} value={v.vehicle_id.toString()}>{v.vehicle_name} ({v.plate_number})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDriverFormOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveDriver} disabled={driverSaving || !driverForm.name.trim() || !driverForm.license_number.trim()} className="bg-emerald-600 hover:bg-emerald-700">
              {driverSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {selectedDriver ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Delete Driver Dialog ─── */}
      <AlertDialog open={driverDeleteOpen} onOpenChange={setDriverDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Driver</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to delete <strong>{selectedDriver?.name}</strong>? This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteDriver} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ─── Assign Students Dialog ─── */}
      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Assign Students to {selectedRoute?.route_name}</DialogTitle>
            <DialogDescription>Select students to assign to this route</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input placeholder="Search students..." value={studentSearch} onChange={e => setStudentSearch(e.target.value)} className="pl-10" />
            </div>
            <div className="border rounded-lg max-h-80 overflow-y-auto">
              {filteredStudents.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-8">No students found</p>
              ) : (
                filteredStudents.map(student => (
                  <label key={student.student_id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 cursor-pointer border-b last:border-0">
                    <Checkbox
                      checked={selectedStudents.includes(student.student_id)}
                      onCheckedChange={() => {
                        setSelectedStudents(prev =>
                          prev.includes(student.student_id)
                            ? prev.filter(id => id !== student.student_id)
                            : [...prev, student.student_id]
                        );
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900">{student.name}</p>
                      <p className="text-xs text-slate-400">{student.student_code}</p>
                    </div>
                  </label>
                ))
              )}
            </div>
            {selectedStudents.length > 0 && (
              <p className="text-sm text-emerald-600 font-medium">{selectedStudents.length} student(s) selected</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignOpen(false)}>Cancel</Button>
            <Button onClick={handleAssign} disabled={routeSaving || selectedStudents.length === 0} className="bg-emerald-600 hover:bg-emerald-700">
              {routeSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Assign ({selectedStudents.length})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Reassign Dialog ─── */}
      <Dialog open={reassignOpen} onOpenChange={setReassignOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reassign Student</DialogTitle>
            <DialogDescription>Move <strong>{reassignStudent?.name}</strong> to a new route</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select value={reassignToRoute} onValueChange={setReassignToRoute}>
              <SelectTrigger className="min-h-[44px]"><SelectValue placeholder="Select new route..." /></SelectTrigger>
              <SelectContent>
                {routes.filter(r => r.transport_id.toString() !== studentsTabRoute).map(r => (
                  <SelectItem key={r.transport_id} value={r.transport_id.toString()}>{r.route_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReassignOpen(false)}>Cancel</Button>
            <Button onClick={confirmReassign} disabled={!reassignToRoute} className="bg-emerald-600 hover:bg-emerald-700">Reassign</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
