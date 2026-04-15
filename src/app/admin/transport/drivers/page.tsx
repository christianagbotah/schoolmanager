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
  UserCircle, Plus, Search, Pencil, Trash2, Users, UserCheck, Loader2,
  Phone, Mail, AlertTriangle, CreditCard,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────

interface Driver {
  driver_id: number;
  name: string;
  phone: string;
  email: string;
  license_number: string;
  license_expiry: string | null;
  address: string;
  vehicle_id: number | null;
  status: string;
  created_at: string;
  assignedVehicle: { vehicle_id: number; vehicle_name: string; plate_number: string } | null;
}

interface VehicleOption {
  vehicle_id: number;
  vehicle_name: string;
  plate_number: string;
}

// ─── Helpers ──────────────────────────────────────────────────

function getLicenseExpiryBadge(expiry: string | null) {
  if (!expiry) return null;
  const now = new Date();
  const exp = new Date(expiry);
  const daysUntil = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (daysUntil < 0) {
    return <Badge className="bg-red-100 text-red-700 text-xs border-0">Expired</Badge>;
  }
  if (daysUntil <= 30) {
    return <Badge className="bg-amber-100 text-amber-700 text-xs border-0">Expiring Soon</Badge>;
  }
  return <Badge className="bg-emerald-100 text-emerald-700 text-xs border-0">Valid</Badge>;
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ─── Component ────────────────────────────────────────────────

export default function DriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<VehicleOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Dialog states
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<Driver | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    license_number: '',
    license_expiry: '',
    vehicle_id: '',
    status: 'Active',
  });

  // ── Data fetching ──

  const fetchDrivers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      const res = await fetch(`/api/admin/transport/drivers?${params}`);
      const data = await res.json();
      setDrivers(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Failed to fetch drivers');
    }
    setLoading(false);
  }, [search]);

  const fetchVehicles = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/transport/vehicles');
      const data = await res.json();
      setVehicles(Array.isArray(data) ? data : []);
    } catch { /* silent */ }
  }, []);

  useEffect(() => { fetchDrivers(); fetchVehicles(); }, [fetchDrivers, fetchVehicles]);

  // ── Stats ──

  const totalDrivers = drivers.length;
  const availableCount = drivers.filter(d => d.status === 'Active' && !d.vehicle_id).length;
  const assignedCount = drivers.filter(d => d.vehicle_id).length;

  // ── Form actions ──

  const resetForm = () => {
    setForm({ name: '', phone: '', email: '', license_number: '', license_expiry: '', vehicle_id: '', status: 'Active' });
  };

  const openCreate = () => {
    setSelected(null);
    resetForm();
    setFormOpen(true);
  };

  const openEdit = (d: Driver) => {
    setSelected(d);
    setForm({
      name: d.name,
      phone: d.phone,
      email: d.email,
      license_number: d.license_number,
      license_expiry: d.license_expiry ? d.license_expiry.split('T')[0] : '',
      vehicle_id: d.vehicle_id?.toString() || '',
      status: d.status,
    });
    setFormOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.license_number.trim()) {
      toast.error('Driver name and license number are required');
      return;
    }
    setSaving(true);
    try {
      const url = selected
        ? `/api/admin/transport/drivers?id=${selected.driver_id}`
        : '/api/admin/transport/drivers';
      const method = selected ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      toast.success(selected ? 'Driver updated' : 'Driver created');
      setFormOpen(false);
      fetchDrivers();
    } catch {
      toast.error('Failed to save driver');
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!selected) return;
    try {
      const res = await fetch(`/api/admin/transport/drivers?id=${selected.driver_id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      toast.success('Driver deleted');
      setDeleteOpen(false);
      fetchDrivers();
    } catch {
      toast.error('Failed to delete driver');
    }
  };

  // ── Render ──

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 p-6 text-white">
          <h1 className="text-2xl font-bold tracking-tight">Driver Management</h1>
          <p className="text-orange-100 mt-1 text-sm">Manage drivers and license information</p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="border-slate-200/60">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                <UserCircle className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Total Drivers</p>
                <p className="text-xl font-bold">{totalDrivers}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-slate-200/60">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                <Users className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Available</p>
                <p className="text-xl font-bold">{availableCount}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-slate-200/60">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-sky-100 flex items-center justify-center">
                <UserCheck className="w-5 h-5 text-sky-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Assigned</p>
                <p className="text-xl font-bold">{assignedCount}</p>
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
                placeholder="Search drivers..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-10 min-h-[44px]"
              />
            </div>
            <Button onClick={openCreate} className="bg-orange-600 hover:bg-orange-700 min-h-[44px] shrink-0">
              <Plus className="w-4 h-4 mr-2" /> Add Driver
            </Button>
          </CardContent>
        </Card>

        {/* Desktop Table */}
        {!loading && drivers.length > 0 && (
          <Card className="border-slate-200/60 hidden md:block">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>License</TableHead>
                    <TableHead>Expiry</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {drivers.map(d => (
                    <TableRow key={d.driver_id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                            <UserCircle className="w-4 h-4 text-orange-600" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">{d.name}</p>
                            {d.email && <p className="text-xs text-slate-400">{d.email}</p>}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Phone className="w-3 h-3 text-slate-400" />
                          {d.phone || '—'}
                        </div>
                      </TableCell>
                      <TableCell><code className="text-xs bg-slate-100 px-2 py-1 rounded">{d.license_number}</code></TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <span className="text-sm">{formatDate(d.license_expiry)}</span>
                          {getLicenseExpiryBadge(d.license_expiry)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {d.assignedVehicle ? (
                          <span className="text-sm">{d.assignedVehicle.vehicle_name}</span>
                        ) : (
                          <span className="text-slate-400 text-sm">Unassigned</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={`${d.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'} text-xs border-0`}>
                          {d.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => openEdit(d)}>
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => { setSelected(d); setDeleteOpen(true); }}>
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
        {!loading && drivers.length > 0 && (
          <div className="md:hidden space-y-3">
            {drivers.map(d => (
              <Card key={d.driver_id} className="border-slate-200/60">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                        <UserCircle className="w-4 h-4 text-orange-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm text-slate-900">{d.name}</h3>
                        <div className="flex items-center gap-1 text-xs text-slate-500">
                          <Phone className="w-3 h-3" /> {d.phone || 'No phone'}
                        </div>
                      </div>
                    </div>
                    <Badge className={`${d.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'} text-[10px] border-0`}>
                      {d.status}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                    <div>
                      <p className="text-slate-400">License</p>
                      <p className="font-medium text-slate-700 truncate">{d.license_number}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Expiry</p>
                      <div className="flex items-center gap-1">
                        <span className="font-medium text-slate-700">{formatDate(d.license_expiry)}</span>
                        {d.license_expiry && (
                          <span className="shrink-0">
                            {getLicenseExpiryBadge(d.license_expiry)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="col-span-2">
                      <p className="text-slate-400">Vehicle</p>
                      <p className="font-medium text-slate-700">
                        {d.assignedVehicle ? `${d.assignedVehicle.vehicle_name} (${d.assignedVehicle.plate_number})` : 'Unassigned'}
                      </p>
                    </div>
                  </div>
                  {d.license_expiry && getLicenseExpiryBadge(d.license_expiry) && (
                    <div className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-1.5 mb-2">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>
                        {new Date(d.license_expiry) < new Date()
                          ? 'License has expired — action required'
                          : `License expiring within 30 days`}
                      </span>
                    </div>
                  )}
                  <div className="flex gap-2 pt-2 border-t border-slate-100">
                    <Button size="sm" variant="ghost" className="flex-1 h-9 text-xs" onClick={() => openEdit(d)}>
                      <Pencil className="w-3 h-3 mr-1" /> Edit
                    </Button>
                    <Button size="sm" variant="ghost" className="h-9 px-3 text-xs text-red-600 hover:bg-red-50" onClick={() => { setSelected(d); setDeleteOpen(true); }}>
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
        {!loading && drivers.length === 0 && (
          <Card className="py-12 border-slate-200/60">
            <CardContent className="flex flex-col items-center">
              <UserCircle className="w-12 h-12 text-slate-300 mb-3" />
              <p className="text-slate-500 font-medium">No drivers found</p>
              <p className="text-slate-400 text-sm mt-1">Add your first driver to get started</p>
              <Button onClick={openCreate} className="bg-orange-600 hover:bg-orange-700 mt-4 min-h-[44px]">
                <Plus className="w-4 h-4 mr-2" /> Add Driver
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* ─── Form Dialog ─── */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selected ? 'Edit Driver' : 'Add New Driver'}</DialogTitle>
            <DialogDescription>Enter driver details and license information</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label className="text-xs">Full Name *</Label>
              <Input
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Kwame Asante"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label className="text-xs">Phone</Label>
                <Input
                  value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                  placeholder="e.g. 024 123 4567"
                />
              </div>
              <div className="grid gap-2">
                <Label className="text-xs">Email</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  placeholder="e.g. driver@school.com"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label className="text-xs">License Number *</Label>
                <Input
                  value={form.license_number}
                  onChange={e => setForm({ ...form, license_number: e.target.value })}
                  placeholder="e.g. D/ABC/1234"
                />
              </div>
              <div className="grid gap-2">
                <Label className="text-xs">License Expiry</Label>
                <Input
                  type="date"
                  value={form.license_expiry}
                  onChange={e => setForm({ ...form, license_expiry: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label className="text-xs">Assign Vehicle</Label>
                <Select value={form.vehicle_id} onValueChange={v => setForm({ ...form, vehicle_id: v })}>
                  <SelectTrigger className="min-h-[44px]"><SelectValue placeholder="Select vehicle" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— No Vehicle —</SelectItem>
                    {vehicles.map(v => (
                      <SelectItem key={v.vehicle_id} value={v.vehicle_id.toString()}>
                        {v.vehicle_name} ({v.plate_number})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label className="text-xs">Status</Label>
                <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                  <SelectTrigger className="min-h-[44px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button
              onClick={handleSave}
              disabled={saving || !form.name.trim() || !form.license_number.trim()}
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
            <AlertDialogTitle>Delete Driver</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{selected?.name}</strong>? This action cannot be undone.
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
