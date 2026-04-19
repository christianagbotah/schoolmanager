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
import { Separator } from '@/components/ui/separator';
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
import { toast } from 'sonner';
import {
  Bus, Plus, Search, Pencil, Trash2, Users, DollarSign,
  CheckCircle, Loader2, ChevronDown, ChevronRight, Car, UserCheck,
  Wrench, Route, GraduationCap, AlertTriangle, X, Eye, LayoutGrid,
  LayoutList, Download,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface TransportRoute {
  transport_id: number; route_name: string; description: string;
  vehicle_number: string; driver_id: number | null; fare: number;
  facilities: string; studentCount: number;
}

interface Driver {
  driver_id: number; name: string; phone: string; status: string;
}

interface Student {
  student_id: number; name: string; student_code: string;
}

// ─── Facility Helpers ────────────────────────────────────────────────────────

const facilityIcons: Record<string, string> = {
  ac: '\u2744', gps: '\uD83D\uDCCD', wifi: '\uD83D\uDCF6', 'first aid': '\uD83C\uDFE5',
  cctv: '\uD83D\uDCFC', seatbelt: '\uD83D\uDC93',
};

function getFacilityIcon(f: string): string {
  const lower = f.trim().toLowerCase();
  for (const [key, icon] of Object.entries(facilityIcons)) {
    if (lower.includes(key)) return icon;
  }
  return '\u2705';
}

// ─── Skeleton Components ─────────────────────────────────────────────────────

function StatCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/60 p-4 sm:p-5 flex flex-col">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-2.5">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-8 w-16" />
        </div>
        <Skeleton className="w-11 h-11 rounded-xl flex-shrink-0" />
      </div>
    </div>
  );
}

function FilterBarSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/60 p-4">
      <Skeleton className="h-11 w-full rounded-lg" />
    </div>
  );
}

function CardGridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="bg-white rounded-2xl border border-slate-200/60 p-4 space-y-3">
          <div className="flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-xl" />
            <div className="space-y-1.5 flex-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
          <Skeleton className="h-3 w-full" />
          <div className="flex gap-2">
            <Skeleton className="h-5 w-12 rounded-full" />
            <Skeleton className="h-5 w-12 rounded-full" />
          </div>
          <Separator />
          <Skeleton className="h-4 w-24" />
        </div>
      ))}
    </div>
  );
}

// ─── Stat Card Component ─────────────────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  subValue,
  iconBg,
  borderColor,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  subValue?: string;
  iconBg: string;
  borderColor: string;
}) {
  return (
    <div
      className="group relative bg-white rounded-2xl border border-slate-200/60 p-4 sm:p-5 hover:-translate-y-0.5 hover:shadow-lg hover:border-slate-300/80 transition-all duration-200 flex flex-col"
      style={{ borderLeft: `4px solid ${borderColor}` }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            {label}
          </p>
          <p className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1.5 tabular-nums leading-tight">
            {value}
          </p>
          {subValue && (
            <p className="text-xs text-slate-500 mt-1.5">{subValue}</p>
          )}
        </div>
        <div
          className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}
        >
          <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function TransportPage() {
  const [routes, setRoutes] = useState<TransportRoute[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [expandedCard, setExpandedCard] = useState<number | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<TransportRoute | null>(null);
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);
  const [studentSearch, setStudentSearch] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState({
    route_name: '', description: '', vehicle_number: '', driver_id: '',
    fare: '', facilities: '',
  });

  // ─── Computed ──────────────────────────────────────────────────────────────

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
  const activeDrivers = drivers.filter(d => d.status === 'Active').length;

  // ─── Data Fetching ─────────────────────────────────────────────────────────

  const fetchRoutes = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      const res = await fetch(`/api/admin/transport?${params}`);
      const data = await res.json();
      setRoutes(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Failed to fetch routes');
    }
    setLoading(false);
  }, [search]);

  const fetchDrivers = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/transport/drivers');
      const data = await res.json();
      setDrivers(Array.isArray(data) ? data : []);
    } catch { /* empty */ }
  }, []);

  useEffect(() => { fetchRoutes(); fetchDrivers(); }, [fetchRoutes, fetchDrivers]);

  const fetchStudents = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/students');
      const data = await res.json();
      setStudents(Array.isArray(data) ? data.slice(0, 200) : []);
    } catch { /* empty */ }
  }, []);

  // ─── Form Handlers ─────────────────────────────────────────────────────────

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!form.route_name.trim()) errors.route_name = 'Route name is required';
    if (form.fare && isNaN(Number(form.fare))) errors.fare = 'Fare must be a number';
    if (form.fare && Number(form.fare) < 0) errors.fare = 'Fare cannot be negative';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const openCreate = () => {
    setSelectedRoute(null);
    setForm({ route_name: '', description: '', vehicle_number: '', driver_id: '', fare: '', facilities: '' });
    setFormErrors({});
    setFormOpen(true);
  };

  const openEdit = (r: TransportRoute) => {
    setSelectedRoute(r);
    setForm({
      route_name: r.route_name, description: r.description, vehicle_number: r.vehicle_number,
      driver_id: r.driver_id?.toString() || '', fare: r.fare.toString(), facilities: r.facilities,
    });
    setFormErrors({});
    setFormOpen(true);
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    setSaving(true);
    try {
      const url = selectedRoute ? `/api/admin/transport?id=${selectedRoute.transport_id}` : '/api/admin/transport';
      const method = selectedRoute ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          driver_id: form.driver_id || null,
          fare: form.fare ? Number(form.fare) : 0,
        }),
      });
      if (!res.ok) throw new Error('Failed');
      toast.success(selectedRoute ? 'Route updated successfully' : 'Route created successfully');
      setFormOpen(false);
      fetchRoutes();
    } catch {
      toast.error('Failed to save route');
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!selectedRoute) return;
    try {
      const res = await fetch(`/api/admin/transport?id=${selectedRoute.transport_id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed');
      toast.success('Route deleted');
      setDeleteOpen(false);
      fetchRoutes();
    } catch {
      toast.error('Failed to delete');
    }
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
    setSaving(true);
    try {
      for (const studentId of selectedStudents) {
        await fetch('/api/admin/transport/attendance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            student_id: studentId,
            route_id: selectedRoute.transport_id,
            attendance_date: new Date().toISOString().split('T')[0],
            transport_direction: 'morning',
            total_fare: selectedRoute.fare,
          }),
        });
      }
      toast.success(`${selectedStudents.length} student(s) assigned to ${selectedRoute.route_name}`);
      setAssignOpen(false);
      fetchRoutes();
    } catch {
      toast.error('Failed to assign students');
    }
    setSaving(false);
  };

  const handleExportCSV = () => {
    const headers = ['Route Name', 'Vehicle Number', 'Driver', 'Fare (GHS)', 'Students', 'Total Revenue', 'Facilities'];
    const rows = routes.map(r => {
      const driver = r.driver_id ? driverMap.get(r.driver_id) : null;
      return [
        r.route_name, r.vehicle_number, driver?.name || '', r.fare.toString(),
        r.studentCount.toString(), (r.studentCount * r.fare).toString(), r.facilities,
      ];
    });
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transport-routes-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exported');
  };

  // ─── Loading State ─────────────────────────────────────────────────────────

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-5 sm:space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1.5">
              <Skeleton className="h-8 w-56" />
              <Skeleton className="h-4 w-72" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-11 w-28 rounded-lg" />
              <Skeleton className="h-11 w-32 rounded-lg" />
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <StatCardSkeleton /><StatCardSkeleton /><StatCardSkeleton /><StatCardSkeleton />
          </div>
          <FilterBarSkeleton />
          <CardGridSkeleton />
        </div>
      </DashboardLayout>
    );
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <DashboardLayout>
      <div className="space-y-5 sm:space-y-6">
        {/* ═══════════════════════════════════════════════════════
            Page Header
            ═══════════════════════════════════════════════════════ */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Transport Management
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Routes, vehicles and student assignments
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleExportCSV}
              className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 min-h-[44px]"
            >
              <Download className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Export</span>
            </Button>
            <Button
              onClick={openCreate}
              className="bg-emerald-600 hover:bg-emerald-700 min-h-[44px] shadow-sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Route
            </Button>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════
            Quick Stats Row
            ═══════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <StatCard
            icon={Bus}
            label="Total Routes"
            value={routes.length}
            subValue={`${activeDrivers} active drivers`}
            iconBg="bg-emerald-500"
            borderColor="#10b981"
          />
          <StatCard
            icon={Users}
            label="Students"
            value={totalStudents}
            subValue={`Assigned across ${routes.length} routes`}
            iconBg="bg-sky-500"
            borderColor="#0ea5e9"
          />
          <StatCard
            icon={DollarSign}
            label="Total Revenue"
            value={`GHS ${totalFare.toLocaleString()}`}
            subValue="Monthly fare collection"
            iconBg="bg-amber-500"
            borderColor="#f59e0b"
          />
          <StatCard
            icon={Route}
            label="Avg Fare"
            value={`GHS ${routes.length ? (totalFare / routes.length).toFixed(0) : 0}`}
            subValue="Per route average"
            iconBg="bg-violet-500"
            borderColor="#8b5cf6"
          />
        </div>

        {/* ═══════════════════════════════════════════════════════
            Search + View Toggle
            ═══════════════════════════════════════════════════════ */}
        <div className="bg-white rounded-2xl border border-slate-200/60 p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search routes by name, vehicle, or description..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 min-h-[44px]"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full hover:bg-slate-200 flex items-center justify-center transition-colors"
                >
                  <X className="w-3 h-3 text-slate-400" />
                </button>
              )}
            </div>

            {/* View Mode Toggle */}
            <div className="flex border border-slate-200 rounded-lg overflow-hidden flex-shrink-0">
              <button
                onClick={() => setViewMode('grid')}
                className={`flex items-center gap-1.5 px-3 min-h-[44px] text-xs font-medium transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-emerald-50 text-emerald-700 border-r border-slate-200'
                    : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
                <span className="hidden sm:inline">Cards</span>
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-1.5 px-3 min-h-[44px] text-xs font-medium transition-colors ${
                  viewMode === 'table'
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                <LayoutList className="w-4 h-4" />
                <span className="hidden sm:inline">Table</span>
              </button>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════
            Empty State
            ═══════════════════════════════════════════════════════ */}
        {filteredRoutes.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-200/60 py-16 sm:py-20">
            <div className="flex flex-col items-center gap-4 px-4">
              <div className="w-20 h-20 rounded-2xl bg-slate-100 flex items-center justify-center">
                <Bus className="w-10 h-10 text-slate-300" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-slate-600 text-lg">No routes found</p>
                <p className="text-sm text-slate-400 mt-1.5 max-w-sm">
                  {search
                    ? 'Try a different search term to find what you are looking for'
                    : 'Create your first transport route to start managing school transportation'}
                </p>
              </div>
              {!search && (
                <Button
                  onClick={openCreate}
                  variant="outline"
                  className="mt-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50 min-h-[44px]"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Route
                </Button>
              )}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════
            Grid View (Cards)
            ═══════════════════════════════════════════════════════ */}
        {filteredRoutes.length > 0 && viewMode === 'grid' && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredRoutes.map(route => {
                const driver = route.driver_id ? driverMap.get(route.driver_id) : null;
                const isExpanded = expandedCard === route.transport_id;
                return (
                  <Card
                    key={route.transport_id}
                    className={`rounded-2xl border-slate-200/60 hover:shadow-md transition-all ${
                      isExpanded ? 'ring-2 ring-emerald-200 shadow-md' : ''
                    }`}
                  >
                    <CardContent className="p-4 sm:p-5">
                      {/* Route Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-100 to-emerald-50 flex items-center justify-center flex-shrink-0 border border-emerald-200/50">
                            <Bus className="w-5 h-5 text-emerald-600" />
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-semibold text-slate-900 text-sm truncate">{route.route_name}</h3>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              {route.vehicle_number ? (
                                <Badge variant="outline" className="text-[10px] font-normal text-slate-500 gap-1 h-5">
                                  <Car className="w-3 h-3" /> {route.vehicle_number}
                                </Badge>
                              ) : (
                                <span className="text-[10px] text-slate-400 italic">No vehicle assigned</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <Badge className="bg-emerald-100 text-emerald-700 text-xs font-semibold flex-shrink-0">
                          GHS {route.fare}
                        </Badge>
                      </div>

                      {/* Driver */}
                      {driver && (
                        <div className="flex items-center gap-2 mb-2 px-1">
                          <UserCheck className="w-3.5 h-3.5 text-sky-500" />
                          <span className="text-xs text-slate-600">{driver.name}</span>
                          <Badge
                            variant="secondary"
                            className={`text-[10px] h-4 px-1.5 ${
                              driver.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            {driver.status}
                          </Badge>
                        </div>
                      )}

                      {/* Facilities */}
                      {route.facilities && route.facilities.split(',').filter(Boolean).length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {route.facilities.split(',').filter(Boolean).slice(0, 4).map((f, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center gap-0.5 text-[10px] bg-slate-50 text-slate-600 px-2 py-0.5 rounded-full border border-slate-100"
                            >
                              {getFacilityIcon(f)} {f.trim()}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Description */}
                      {route.description && (
                        <p className="text-xs text-slate-500 mb-3 line-clamp-2">{route.description}</p>
                      )}

                      {/* Stats footer */}
                      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                        <div className="flex items-center gap-3 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <GraduationCap className="w-3 h-3" /> {route.studentCount} students
                          </span>
                          <span className="flex items-center gap-1 tabular-nums">
                            <DollarSign className="w-3 h-3" /> GHS {(route.studentCount * route.fare).toLocaleString()}
                          </span>
                        </div>
                        <button
                          onClick={() => setExpandedCard(isExpanded ? null : route.transport_id)}
                          className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center transition-colors"
                        >
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-slate-400" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-slate-400" />
                          )}
                        </button>
                      </div>

                      {/* Expanded actions */}
                      {isExpanded && (
                        <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-9 text-xs min-h-[36px]"
                            onClick={() => openAssign(route)}
                          >
                            <Users className="w-3.5 h-3.5 mr-1.5" /> Assign Students
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-9 text-xs min-h-[36px]"
                            onClick={() => { setSelectedRoute(route); setViewOpen(true); }}
                          >
                            <Eye className="w-3.5 h-3.5 mr-1.5" /> View
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-9 text-xs min-h-[36px]"
                            onClick={() => openEdit(route)}
                          >
                            <Pencil className="w-3.5 h-3.5 mr-1.5" /> Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-9 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 min-h-[36px]"
                            onClick={() => { setSelectedRoute(route); setDeleteOpen(true); }}
                          >
                            <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Delete
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            <p className="text-xs text-slate-400 text-center pb-2">
              Showing {filteredRoutes.length} of {routes.length} routes
            </p>
          </>
        )}

        {/* ═══════════════════════════════════════════════════════
            Table View
            ═══════════════════════════════════════════════════════ */}
        {filteredRoutes.length > 0 && viewMode === 'table' && (
          <div className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden">
            {/* Results header */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-slate-100 bg-slate-50/50">
              <p className="text-xs font-medium text-slate-500">
                Showing {filteredRoutes.length} of {routes.length} routes
              </p>
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 hover:bg-slate-50">
                    <TableHead className="text-xs font-semibold text-slate-600">Route</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-600">Vehicle</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-600 hidden xl:table-cell">Driver</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-600 hidden lg:table-cell">Facilities</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-600 text-center">Students</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-600 text-right">Fare</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-600 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRoutes.map(route => {
                    const driver = route.driver_id ? driverMap.get(route.driver_id) : null;
                    return (
                      <TableRow key={route.transport_id} className="hover:bg-slate-50/50 transition-colors">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-100 to-emerald-50 flex items-center justify-center flex-shrink-0 border border-emerald-200/50">
                              <Bus className="w-4 h-4 text-emerald-600" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-sm text-slate-900 truncate">{route.route_name}</p>
                              {route.description && (
                                <p className="text-xs text-slate-400 truncate max-w-[200px]">{route.description}</p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {route.vehicle_number ? (
                            <span className="inline-flex items-center gap-1 text-xs text-slate-700">
                              <Car className="w-3 h-3 text-slate-400" />
                              {route.vehicle_number}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400 italic">None</span>
                          )}
                        </TableCell>
                        <TableCell className="hidden xl:table-cell">
                          {driver ? (
                            <div>
                              <p className="text-sm text-slate-700">{driver.name}</p>
                              <Badge
                                variant="secondary"
                                className={`text-[10px] h-4 px-1.5 mt-0.5 ${
                                  driver.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'
                                }`}
                              >
                                {driver.status}
                              </Badge>
                            </div>
                          ) : (
                            <span className="text-sm text-slate-400">{'\u2014'}</span>
                          )}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          {route.facilities && route.facilities.split(',').filter(Boolean).length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {route.facilities.split(',').filter(Boolean).slice(0, 3).map((f, i) => (
                                <span key={i} className="text-[10px] bg-slate-50 text-slate-600 px-1.5 py-0.5 rounded-full border border-slate-100">
                                  {getFacilityIcon(f)} {f.trim()}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-sm text-slate-400">{'\u2014'}</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className="text-xs border-slate-200">
                            <GraduationCap className="w-3 h-3 mr-1 text-slate-400" />
                            {route.studentCount}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="text-sm font-semibold text-slate-900 tabular-nums">GHS {route.fare}</span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 min-w-[32px]"
                              onClick={() => openAssign(route)}
                              title="Assign Students"
                            >
                              <Users className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 min-w-[32px]"
                              onClick={() => openEdit(route)}
                              title="Edit"
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 min-w-[32px] text-red-500 hover:text-red-600 hover:bg-red-50"
                              onClick={() => { setSelectedRoute(route); setDeleteOpen(true); }}
                              title="Delete"
                            >
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

            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-slate-100">
              {filteredRoutes.map(route => {
                const driver = route.driver_id ? driverMap.get(route.driver_id) : null;
                return (
                  <div key={route.transport_id} className="p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-100 to-emerald-50 flex items-center justify-center flex-shrink-0 border border-emerald-200/50">
                        <Bus className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-semibold text-sm text-slate-900 truncate">{route.route_name}</p>
                            <p className="text-xs text-slate-500">{route.vehicle_number || 'No vehicle'}</p>
                          </div>
                          <Badge className="bg-emerald-100 text-emerald-700 text-xs font-semibold flex-shrink-0">
                            GHS {route.fare}
                          </Badge>
                        </div>
                        <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-slate-500">
                          {driver && (
                            <p className="flex items-center gap-1.5">
                              <UserCheck className="w-3 h-3 text-sky-500" />
                              <span className="truncate">{driver.name}</span>
                            </p>
                          )}
                          <p className="flex items-center gap-1.5">
                            <GraduationCap className="w-3 h-3 text-slate-400" />
                            <span>{route.studentCount} students</span>
                          </p>
                          <p className="flex items-center gap-1.5">
                            <DollarSign className="w-3 h-3 text-slate-400" />
                            <span className="tabular-nums">GHS {(route.studentCount * route.fare).toLocaleString()}</span>
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 pt-1">
                      <Button
                        variant="outline"
                        className="flex-1 min-h-[44px] text-xs"
                        onClick={() => openAssign(route)}
                      >
                        <Users className="w-3.5 h-3.5 mr-1.5" />
                        Assign
                      </Button>
                      <Button
                        variant="outline"
                        className="min-h-[44px] min-w-[44px] text-xs"
                        onClick={() => openEdit(route)}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="outline"
                        className="min-h-[44px] min-w-[44px] text-xs text-red-600 border-red-200 hover:bg-red-50"
                        onClick={() => { setSelectedRoute(route); setDeleteOpen(true); }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>

            <p className="text-xs text-slate-400 text-center px-4 sm:px-6 py-3 border-t bg-slate-50/50">
              Showing {filteredRoutes.length} of {routes.length} routes
            </p>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════
          Create/Edit Route Dialog
          ═══════════════════════════════════════════════════════ */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                <Bus className="w-4 h-4 text-emerald-600" />
              </div>
              {selectedRoute ? 'Edit Route' : 'Add New Route'}
            </DialogTitle>
            <DialogDescription>Configure the transport route details below</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label className="text-xs font-medium">Route Name <span className="text-red-500">*</span></Label>
              <Input
                value={form.route_name}
                onChange={(e) => { setForm({ ...form, route_name: e.target.value }); setFormErrors(prev => ({ ...prev, route_name: '' })); }}
                placeholder="e.g. Airport - School"
                className={`min-h-[44px] ${formErrors.route_name ? 'border-red-300 focus-visible:ring-red-200' : ''}`}
              />
              {formErrors.route_name && <p className="text-xs text-red-500">{formErrors.route_name}</p>}
            </div>

            <div className="grid gap-2">
              <Label className="text-xs font-medium">Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={2}
                placeholder="Route description or notes..."
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label className="text-xs font-medium">Vehicle Number</Label>
                <Input
                  value={form.vehicle_number}
                  onChange={(e) => setForm({ ...form, vehicle_number: e.target.value })}
                  placeholder="e.g. GN 1234-25"
                  className="min-h-[44px]"
                />
              </div>
              <div className="grid gap-2">
                <Label className="text-xs font-medium">Driver</Label>
                <Select value={form.driver_id} onValueChange={(v) => setForm({ ...form, driver_id: v === '__none__' ? '' : v })}>
                  <SelectTrigger className="min-h-[44px]">
                    <SelectValue placeholder="Select driver" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    <SelectItem value="__none__">No driver</SelectItem>
                    {drivers.filter(d => d.status === 'Active').map(d => (
                      <SelectItem key={d.driver_id} value={d.driver_id.toString()}>
                        {d.name} {d.phone ? `(${d.phone})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label className="text-xs font-medium">Fare (GHS)</Label>
                <Input
                  type="number" step="0.01" min="0"
                  value={form.fare}
                  onChange={(e) => { setForm({ ...form, fare: e.target.value }); setFormErrors(prev => ({ ...prev, fare: '' })); }}
                  placeholder="0.00"
                  className={`min-h-[44px] ${formErrors.fare ? 'border-red-300 focus-visible:ring-red-200' : ''}`}
                />
                {formErrors.fare && <p className="text-xs text-red-500">{formErrors.fare}</p>}
              </div>
              <div className="grid gap-2">
                <Label className="text-xs font-medium">Facilities</Label>
                <Input
                  value={form.facilities}
                  onChange={(e) => setForm({ ...form, facilities: e.target.value })}
                  placeholder="AC, GPS, First Aid"
                  className="min-h-[44px]"
                />
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setFormOpen(false)} className="min-h-[44px]">Cancel</Button>
            <Button
              onClick={handleSave}
              disabled={saving || !form.route_name.trim()}
              className="bg-emerald-600 hover:bg-emerald-700 min-h-[44px]"
            >
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {selectedRoute ? 'Update Route' : 'Create Route'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════════════════════════════════
          View Route Details Dialog
          ═══════════════════════════════════════════════════════ */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          {selectedRoute && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <Bus className="w-4 h-4 text-emerald-600" />
                  </div>
                  Route Details
                </DialogTitle>
                <DialogDescription>Full information about this transport route</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                {/* Route Name & Fare */}
                <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-100 to-emerald-50 flex items-center justify-center border border-emerald-200/50">
                    <Bus className="w-7 h-7 text-emerald-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-slate-900">{selectedRoute.route_name}</h3>
                    <p className="text-sm text-slate-500">{selectedRoute.vehicle_number || 'No vehicle assigned'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-emerald-700 tabular-nums">GHS {selectedRoute.fare}</p>
                    <p className="text-xs text-slate-400">per student</p>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50/80">
                    <div className="w-8 h-8 rounded-lg bg-white border border-slate-200/60 flex items-center justify-center flex-shrink-0">
                      <UserCheck className="w-4 h-4 text-sky-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-slate-400">Driver</p>
                      <p className="font-medium text-sm text-slate-800">
                        {selectedRoute.driver_id ? driverMap.get(selectedRoute.driver_id)?.name || '\u2014' : 'Not assigned'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50/80">
                    <div className="w-8 h-8 rounded-lg bg-white border border-slate-200/60 flex items-center justify-center flex-shrink-0">
                      <GraduationCap className="w-4 h-4 text-violet-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-slate-400">Students</p>
                      <p className="font-medium text-sm text-slate-800">{selectedRoute.studentCount}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50/80">
                    <div className="w-8 h-8 rounded-lg bg-white border border-slate-200/60 flex items-center justify-center flex-shrink-0">
                      <DollarSign className="w-4 h-4 text-amber-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-slate-400">Revenue</p>
                      <p className="font-medium text-sm text-slate-800 tabular-nums">
                        GHS {(selectedRoute.studentCount * selectedRoute.fare).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50/80">
                    <div className="w-8 h-8 rounded-lg bg-white border border-slate-200/60 flex items-center justify-center flex-shrink-0">
                      <Wrench className="w-4 h-4 text-slate-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-slate-400">Facilities</p>
                      <p className="font-medium text-sm text-slate-800 truncate">
                        {selectedRoute.facilities || 'None specified'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Description */}
                {selectedRoute.description && (
                  <div className="p-3 rounded-xl bg-slate-50/80">
                    <p className="text-xs text-slate-400 mb-1">Description</p>
                    <p className="text-sm text-slate-700">{selectedRoute.description}</p>
                  </div>
                )}

                {/* Facilities chips */}
                {selectedRoute.facilities && selectedRoute.facilities.split(',').filter(Boolean).length > 0 && (
                  <div className="p-3 rounded-xl bg-slate-50/80">
                    <p className="text-xs text-slate-400 mb-2">Facilities</p>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedRoute.facilities.split(',').filter(Boolean).map((f, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1 text-xs bg-white text-slate-600 px-2.5 py-1 rounded-lg border border-slate-200/60"
                        >
                          {getFacilityIcon(f)} {f.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <DialogFooter className="gap-2 sm:gap-0 mt-4">
                <Button variant="outline" onClick={() => setViewOpen(false)} className="min-h-[44px]">Close</Button>
                <Button
                  onClick={() => { setViewOpen(false); openEdit(selectedRoute); }}
                  className="bg-emerald-600 hover:bg-emerald-700 min-h-[44px]"
                >
                  <Pencil className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════════════════════════════════
          Delete Confirmation
          ═══════════════════════════════════════════════════════ */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-red-600" />
              </div>
              Delete Route
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <p>
                  Are you sure you want to delete <strong>{selectedRoute?.route_name}</strong>?
                </p>
                {selectedRoute && selectedRoute.studentCount > 0 && (
                  <p className="text-amber-600 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    This route has {selectedRoute.studentCount} assigned student(s). They will be unassigned.
                  </p>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="min-h-[44px]">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 min-h-[44px]">
              Delete Route
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ═══════════════════════════════════════════════════════
          Student Assignment Dialog
          ═══════════════════════════════════════════════════════ */}
      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-sky-100 flex items-center justify-center">
                <Users className="w-4 h-4 text-sky-600" />
              </div>
              Assign Students to Route
            </DialogTitle>
            <DialogDescription>
              {selectedRoute?.route_name} {'\u00B7'} Fare: GHS {selectedRoute?.fare}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search students by name or code..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                className="pl-10 min-h-[44px]"
              />
            </div>

            {/* Selected count */}
            {selectedStudents.length > 0 && (
              <div className="flex items-center gap-2 px-1">
                <Badge className="bg-emerald-100 text-emerald-700 text-xs">
                  {selectedStudents.length} selected
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-slate-500 h-7"
                  onClick={() => setSelectedStudents([])}
                >
                  Clear all
                </Button>
              </div>
            )}

            {/* Student list */}
            <div className="space-y-1 max-h-96 overflow-y-auto">
              {filteredStudents.length === 0 ? (
                <div className="py-8 text-center text-slate-400">
                  <GraduationCap className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No students found</p>
                </div>
              ) : (
                filteredStudents.map(s => (
                  <label
                    key={s.student_id}
                    className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-colors ${
                      selectedStudents.includes(s.student_id)
                        ? 'bg-emerald-50 border border-emerald-200'
                        : 'hover:bg-slate-50 border border-transparent'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedStudents.includes(s.student_id)}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedStudents([...selectedStudents, s.student_id]);
                        else setSelectedStudents(selectedStudents.filter(id => id !== s.student_id));
                      }}
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                        <GraduationCap className="w-4 h-4 text-slate-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">{s.name}</p>
                        <p className="text-xs text-slate-500">{s.student_code}</p>
                      </div>
                    </div>
                    {selectedStudents.includes(s.student_id) && (
                      <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    )}
                  </label>
                ))
              )}
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setAssignOpen(false)} className="min-h-[44px]">Close</Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 min-h-[44px]"
              disabled={saving || selectedStudents.length === 0}
              onClick={handleAssign}
            >
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Assign ({selectedStudents.length})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
