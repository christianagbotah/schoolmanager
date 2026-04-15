'use client';

import { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Bus, Plus, Search, Pencil, Trash2, Users, DollarSign, MapPin, CheckCircle, Loader2 } from 'lucide-react';

interface TransportRoute {
  transport_id: number; route_name: string; description: string;
  vehicle_number: string; driver_id: number | null; fare: number;
  facilities: string; studentCount: number;
}

interface Student { student_id: number; name: string; student_code: string; }

export default function TransportPage() {
  const [routes, setRoutes] = useState<TransportRoute[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<TransportRoute | null>(null);
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({ route_name: '', description: '', vehicle_number: '', driver_id: '', fare: '', facilities: '' });

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

  useEffect(() => { fetchRoutes(); }, [fetchRoutes]);

  const openCreate = () => {
    setSelectedRoute(null);
    setForm({ route_name: '', description: '', vehicle_number: '', driver_id: '', fare: '', facilities: '' });
    setFormOpen(true);
  };

  const openEdit = (r: TransportRoute) => {
    setSelectedRoute(r);
    setForm({ route_name: r.route_name, description: r.description, vehicle_number: r.vehicle_number, driver_id: r.driver_id?.toString() || '', fare: r.fare.toString(), facilities: r.facilities });
    setFormOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const url = selectedRoute ? `/api/admin/transport?id=${selectedRoute.transport_id}` : '/api/admin/transport';
      const method = selectedRoute ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      if (!res.ok) throw new Error('Failed');
      toast.success(selectedRoute ? 'Route updated' : 'Route created');
      setFormOpen(false); fetchRoutes();
    } catch { toast.error('Failed to save route'); }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!selectedRoute) return;
    try {
      const res = await fetch(`/api/admin/transport?id=${selectedRoute.transport_id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed');
      toast.success('Route deleted'); setDeleteOpen(false); fetchRoutes();
    } catch { toast.error('Failed to delete'); }
  };

  const fetchStudents = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/students');
      const data = await res.json();
      setStudents(Array.isArray(data) ? data.slice(0, 200) : []);
    } catch { /* empty */ }
  }, []);

  const openAssign = (r: TransportRoute) => {
    setSelectedRoute(r);
    setSelectedStudents([]);
    fetchStudents();
    setAssignOpen(true);
  };

  const handleAssign = async () => {
    if (!selectedRoute || selectedStudents.length === 0) return;
    setSaving(true);
    try {
      // Create bus_attendance records for each student (enrollment)
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
      setAssignOpen(false); fetchRoutes();
    } catch { toast.error('Failed to assign students'); }
    setSaving(false);
  };

  const totalFare = routes.reduce((sum, r) => sum + r.studentCount * r.fare, 0);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Transport Management</h1>
            <p className="text-sm text-slate-500 mt-1">Routes, vehicles and student assignments</p>
          </div>
          <Button onClick={openCreate} className="bg-emerald-600 hover:bg-emerald-700 min-h-[44px]"><Plus className="w-4 h-4 mr-2" /> Add Route</Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-slate-200/60"><CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center"><Bus className="w-5 h-5 text-emerald-600" /></div>
            <div><p className="text-xs text-slate-500">Total Routes</p><p className="text-xl font-bold">{routes.length}</p></div>
          </CardContent></Card>
          <Card className="border-slate-200/60"><CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-sky-100 flex items-center justify-center"><Users className="w-5 h-5 text-sky-600" /></div>
            <div><p className="text-xs text-slate-500">Students</p><p className="text-xl font-bold">{routes.reduce((s, r) => s + r.studentCount, 0)}</p></div>
          </CardContent></Card>
          <Card className="border-slate-200/60"><CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center"><DollarSign className="w-5 h-5 text-amber-600" /></div>
            <div><p className="text-xs text-slate-500">Total Fare</p><p className="text-xl font-bold">GHS {totalFare.toLocaleString()}</p></div>
          </CardContent></Card>
          <Card className="border-slate-200/60"><CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center"><MapPin className="w-5 h-5 text-violet-600" /></div>
            <div><p className="text-xs text-slate-500">Avg Fare</p><p className="text-xl font-bold">GHS {routes.length ? (totalFare / routes.length).toFixed(0) : 0}</p></div>
          </CardContent></Card>
        </div>

        {/* Search */}
        <Card className="border-slate-200/60"><CardContent className="p-4">
          <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input placeholder="Search routes..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 min-h-[44px]" />
          </div>
        </CardContent></Card>

        {/* Routes Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-xl" />)}</div>
        ) : routes.length === 0 ? (
          <Card className="py-12 border-slate-200/60"><CardContent className="flex flex-col items-center"><Bus className="w-12 h-12 text-slate-300 mb-3" /><p className="text-slate-500">No routes found</p></CardContent></Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {routes.map(route => (
              <Card key={route.transport_id} className="hover:shadow-md transition-shadow border-slate-200/60">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center"><Bus className="w-4 h-4 text-emerald-600" /></div>
                      <div><h3 className="font-semibold text-slate-900 text-sm">{route.route_name}</h3><p className="text-xs text-slate-500">{route.vehicle_number || 'No vehicle'}</p></div>
                    </div>
                    <Badge className="bg-emerald-100 text-emerald-700 text-xs">GHS {route.fare}</Badge>
                  </div>
                  {route.description && <p className="text-xs text-slate-500 mb-3 line-clamp-2">{route.description}</p>}
                  {route.facilities && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {route.facilities.split(',').filter(Boolean).slice(0, 3).map((f, i) => (
                        <Badge key={i} variant="secondary" className="text-[10px]">{f.trim()}</Badge>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    <div className="flex items-center gap-1 text-xs text-slate-500"><Users className="w-3 h-3" /><span>{route.studentCount} students</span></div>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" className="h-7 text-xs text-sky-600" onClick={() => openAssign(route)}><Users className="w-3 h-3 mr-1" /> Assign</Button>
                      <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => openEdit(route)}><Pencil className="w-3 h-3" /></Button>
                      <Button size="sm" variant="ghost" className="h-7 text-xs text-red-600" onClick={() => { setSelectedRoute(route); setDeleteOpen(true); }}><Trash2 className="w-3 h-3" /></Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Form Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{selectedRoute ? 'Edit Route' : 'Add New Route'}</DialogTitle><DialogDescription>Configure transport route details</DialogDescription></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2"><Label className="text-xs">Route Name *</Label><Input value={form.route_name} onChange={e => setForm({ ...form, route_name: e.target.value })} placeholder="e.g. Airport - School" /></div>
            <div className="grid gap-2"><Label className="text-xs">Description</Label><Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2"><Label className="text-xs">Vehicle Number</Label><Input value={form.vehicle_number} onChange={e => setForm({ ...form, vehicle_number: e.target.value })} placeholder="e.g. GN 1234-25" /></div>
              <div className="grid gap-2"><Label className="text-xs">Fare (GHS)</Label><Input type="number" value={form.fare} onChange={e => setForm({ ...form, fare: e.target.value })} /></div>
            </div>
            <div className="grid gap-2"><Label className="text-xs">Facilities (comma separated)</Label><Input value={form.facilities} onChange={e => setForm({ ...form, facilities: e.target.value })} placeholder="AC, GPS, First Aid" /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button><Button onClick={handleSave} disabled={saving || !form.route_name.trim()} className="bg-emerald-600 hover:bg-emerald-700">{saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}{selectedRoute ? 'Update' : 'Create'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete Route</AlertDialogTitle><AlertDialogDescription>Are you sure you want to delete <strong>{selectedRoute?.route_name}</strong>?</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Student Assignment Dialog */}
      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Assign Students to {selectedRoute?.route_name}</DialogTitle><DialogDescription>Select students to assign to this route</DialogDescription></DialogHeader>
          <div className="flex items-center gap-2 mb-3">
            <Input placeholder="Search students..." className="flex-1" value="" readOnly />
            <Badge variant="outline" className="text-xs">{selectedStudents.length} selected</Badge>
          </div>
          <div className="space-y-1 max-h-96 overflow-y-auto">
            {students.map(s => (
              <label key={s.student_id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 cursor-pointer">
                <input type="checkbox" checked={selectedStudents.includes(s.student_id)}
                  onChange={e => {
                    if (e.target.checked) setSelectedStudents([...selectedStudents, s.student_id]);
                    else setSelectedStudents(selectedStudents.filter(id => id !== s.student_id));
                  }} className="rounded border-slate-300" />
                <div><p className="text-sm font-medium text-slate-900">{s.name}</p><p className="text-xs text-slate-500">{s.student_code}</p></div>
              </label>
            ))}
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setAssignOpen(false)}>Close</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700" disabled={saving || selectedStudents.length === 0} onClick={handleAssign}>
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null} Assign ({selectedStudents.length})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
