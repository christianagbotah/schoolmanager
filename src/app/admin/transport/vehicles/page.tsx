'use client';

import { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
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
  Truck, Plus, Search, Pencil, Trash2, Users, Wrench, Loader2,
  Bus, Car, ChevronRight,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────

interface Vehicle {
  vehicle_id: number;
  vehicle_name: string;
  plate_number: string;
  vehicle_type: string;
  capacity: number;
  driver_id: number | null;
  status: string;
  created_at: string;
  driver: { driver_id: number; name: string } | null;
}

interface DriverOption {
  driver_id: number;
  name: string;
}

// ─── Helpers ──────────────────────────────────────────────────

const VEHICLE_TYPES = ['Bus', 'Van', 'Car'] as const;
const STATUSES = ['Active', 'Under Maintenance', 'Retired'] as const;

function statusBadge(status: string) {
  const map: Record<string, string> = {
    Active: 'bg-emerald-100 text-emerald-700',
    'Under Maintenance': 'bg-amber-100 text-amber-700',
    Retired: 'bg-red-100 text-red-700',
  };
  return map[status] || 'bg-slate-100 text-slate-700';
}

function vehicleTypeIcon(type: string, className = 'w-4 h-4') {
  if (type === 'Car') return <Car className={className} />;
  return <Bus className={className} />;
}

// ─── Component ────────────────────────────────────────────────

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<DriverOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Dialog states
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<Vehicle | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    vehicle_name: '',
    plate_number: '',
    vehicle_type: 'Bus',
    capacity: '',
    driver_id: '',
    status: 'Active',
  });

  // ── Data fetching ──

  const fetchVehicles = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      const res = await fetch(`/api/admin/transport/vehicles?${params}`);
      const data = await res.json();
      setVehicles(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Failed to fetch vehicles');
    }
    setLoading(false);
  }, [search]);

  const fetchDrivers = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/transport/drivers');
      const data = await res.json();
      setDrivers(Array.isArray(data) ? data : []);
    } catch { /* silent */ }
  }, []);

  useEffect(() => { fetchVehicles(); fetchDrivers(); }, [fetchVehicles, fetchDrivers]);

  // ── Stats ──

  const totalVehicles = vehicles.length;
  const activeCount = vehicles.filter(v => v.status === 'Active').length;
  const maintenanceCount = vehicles.filter(v => v.status === 'Under Maintenance').length;

  // ── Form actions ──

  const resetForm = () => {
    setForm({ vehicle_name: '', plate_number: '', vehicle_type: 'Bus', capacity: '', driver_id: '', status: 'Active' });
  };

  const openCreate = () => {
    setSelected(null);
    resetForm();
    setFormOpen(true);
  };

  const openEdit = (v: Vehicle) => {
    setSelected(v);
    setForm({
      vehicle_name: v.vehicle_name,
      plate_number: v.plate_number,
      vehicle_type: v.vehicle_type,
      capacity: v.capacity?.toString() || '',
      driver_id: v.driver_id?.toString() || '',
      status: v.status,
    });
    setFormOpen(true);
  };

  const handleSave = async () => {
    if (!form.vehicle_name.trim() || !form.plate_number.trim()) {
      toast.error('Vehicle name and plate number are required');
      return;
    }
    setSaving(true);
    try {
      const url = selected
        ? `/api/admin/transport/vehicles?id=${selected.vehicle_id}`
        : '/api/admin/transport/vehicles';
      const method = selected ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      toast.success(selected ? 'Vehicle updated' : 'Vehicle created');
      setFormOpen(false);
      fetchVehicles();
    } catch {
      toast.error('Failed to save vehicle');
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!selected) return;
    try {
      const res = await fetch(`/api/admin/transport/vehicles?id=${selected.vehicle_id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      toast.success('Vehicle deleted');
      setDeleteOpen(false);
      fetchVehicles();
    } catch {
      toast.error('Failed to delete vehicle');
    }
  };

  // ── Render ──

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 p-6 text-white">
          <h1 className="text-2xl font-bold tracking-tight">Vehicle Management</h1>
          <p className="text-orange-100 mt-1 text-sm">Manage school transport fleet</p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Card className="border-slate-200/60">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                <Truck className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Total Vehicles</p>
                <p className="text-xl font-bold">{totalVehicles}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-slate-200/60">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                <Bus className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Active</p>
                <p className="text-xl font-bold">{activeCount}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-slate-200/60 col-span-2 md:col-span-1">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <Wrench className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Under Maintenance</p>
                <p className="text-xl font-bold">{maintenanceCount}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search + Add */}
        <Card className="border-slate-200/60">
          <CardContent className="p-4 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search vehicles..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-10 min-h-[44px]"
              />
            </div>
            <Button onClick={openCreate} className="bg-orange-600 hover:bg-orange-700 min-h-[44px] shrink-0">
              <Plus className="w-4 h-4 mr-2" /> Add Vehicle
            </Button>
          </CardContent>
        </Card>

        {/* Desktop Table */}
        {!loading && vehicles.length > 0 && (
          <Card className="border-slate-200/60 hidden md:block">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Plate Number</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Capacity</TableHead>
                    <TableHead>Driver</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vehicles.map(v => (
                    <TableRow key={v.vehicle_id}>
                      <TableCell className="font-medium">{v.vehicle_name}</TableCell>
                      <TableCell><code className="text-xs bg-slate-100 px-2 py-1 rounded">{v.plate_number}</code></TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          {vehicleTypeIcon(v.vehicle_type)}
                          <span className="text-sm">{v.vehicle_type}</span>
                        </div>
                      </TableCell>
                      <TableCell>{v.capacity || '—'}</TableCell>
                      <TableCell>{v.driver?.name || <span className="text-slate-400">Unassigned</span>}</TableCell>
                      <TableCell><Badge className={`${statusBadge(v.status)} text-xs border-0`}>{v.status}</Badge></TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => openEdit(v)}>
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => { setSelected(v); setDeleteOpen(true); }}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Mobile Cards */}
        {!loading && vehicles.length > 0 && (
          <div className="md:hidden space-y-3">
            {vehicles.map(v => (
              <Card key={v.vehicle_id} className="border-slate-200/60">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
                        {vehicleTypeIcon(v.vehicle_type, 'w-4 h-4 text-orange-600')}
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm text-slate-900">{v.vehicle_name}</h3>
                        <p className="text-xs text-slate-500">{v.plate_number}</p>
                      </div>
                    </div>
                    <Badge className={`${statusBadge(v.status)} text-[10px] border-0`}>{v.status}</Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs mb-3">
                    <div>
                      <p className="text-slate-400">Type</p>
                      <p className="font-medium text-slate-700">{v.vehicle_type}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Capacity</p>
                      <p className="font-medium text-slate-700">{v.capacity || '—'}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Driver</p>
                      <p className="font-medium text-slate-700 truncate">{v.driver?.name || 'None'}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2 border-t border-slate-100">
                    <Button size="sm" variant="ghost" className="flex-1 h-9 text-xs" onClick={() => openEdit(v)}>
                      <Pencil className="w-3 h-3 mr-1" /> Edit
                    </Button>
                    <Button size="sm" variant="ghost" className="h-9 px-3 text-xs text-red-600 hover:bg-red-50" onClick={() => { setSelected(v); setDeleteOpen(true); }}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && vehicles.length === 0 && (
          <Card className="py-12 border-slate-200/60">
            <CardContent className="flex flex-col items-center">
              <Truck className="w-12 h-12 text-slate-300 mb-3" />
              <p className="text-slate-500 font-medium">No vehicles found</p>
              <p className="text-slate-400 text-sm mt-1">Add your first vehicle to get started</p>
              <Button onClick={openCreate} className="bg-orange-600 hover:bg-orange-700 mt-4 min-h-[44px]">
                <Plus className="w-4 h-4 mr-2" /> Add Vehicle
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* ─── Form Dialog ─── */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selected ? 'Edit Vehicle' : 'Add New Vehicle'}</DialogTitle>
            <DialogDescription>Configure vehicle details and driver assignment</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label className="text-xs">Vehicle Name *</Label>
              <Input
                value={form.vehicle_name}
                onChange={e => setForm({ ...form, vehicle_name: e.target.value })}
                placeholder="e.g. School Bus A"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label className="text-xs">Plate Number *</Label>
                <Input
                  value={form.plate_number}
                  onChange={e => setForm({ ...form, plate_number: e.target.value })}
                  placeholder="e.g. GN 1234-25"
                />
              </div>
              <div className="grid gap-2">
                <Label className="text-xs">Vehicle Type</Label>
                <Select value={form.vehicle_type} onValueChange={v => setForm({ ...form, vehicle_type: v })}>
                  <SelectTrigger className="min-h-[44px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {VEHICLE_TYPES.map(t => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label className="text-xs">Capacity (seats)</Label>
                <Input
                  type="number"
                  value={form.capacity}
                  onChange={e => setForm({ ...form, capacity: e.target.value })}
                  placeholder="e.g. 52"
                />
              </div>
              <div className="grid gap-2">
                <Label className="text-xs">Status</Label>
                <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                  <SelectTrigger className="min-h-[44px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUSES.map(s => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label className="text-xs">Assign Driver</Label>
              <Select value={form.driver_id} onValueChange={v => setForm({ ...form, driver_id: v })}>
                <SelectTrigger className="min-h-[44px]"><SelectValue placeholder="Select a driver" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— No Driver —</SelectItem>
                  {drivers.map(d => (
                    <SelectItem key={d.driver_id} value={d.driver_id.toString()}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button
              onClick={handleSave}
              disabled={saving || !form.vehicle_name.trim() || !form.plate_number.trim()}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {selected ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Delete Dialog ─── */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Vehicle</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{selected?.vehicle_name}</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
