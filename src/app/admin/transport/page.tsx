"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Bus, Plus, Search, Pencil, Trash2, Users, DollarSign,
  MapPin, Calendar, CheckCircle, Clock, Filter, Loader2, ArrowRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface TransportRoute {
  transport_id: number;
  route_name: string;
  description: string;
  vehicle_number: string;
  driver_id: number | null;
  fare: number;
  facilities: string;
  studentCount: number;
}

interface BusAttendance {
  id: number;
  student_id: number;
  route_id: number | null;
  attendance_date: string | null;
  transport_direction: string;
  boarded_in: string | null;
  boarded_out: string | null;
  total_fare: number;
  student: { student_id: number; name: string; student_code: string };
  transport: { transport_id: number; route_name: string; fare: number } | null;
}

interface Student {
  student_id: number;
  name: string;
  student_code: string;
}

export default function TransportPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [routes, setRoutes] = useState<TransportRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Dialog states
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [attendanceOpen, setAttendanceOpen] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<TransportRoute | null>(null);

  // Attendance
  const [attendance, setAttendance] = useState<BusAttendance[]>([]);
  const [attLoading, setAttLoading] = useState(false);
  const [attDate, setAttDate] = useState(new Date().toISOString().split("T")[0]);
  const [attDirection, setAttDirection] = useState("morning");

  // Students
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);

  // Form
  const [form, setForm] = useState({
    route_name: "", description: "", vehicle_number: "", driver_id: "", fare: "", facilities: "",
  });

  const fetchRoutes = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      const res = await fetch(`/api/transport/route?${params}`);
      setRoutes(await res.json());
    } catch {
      toast({ title: "Error", description: "Failed to fetch routes", variant: "destructive" });
    }
    setLoading(false);
  }, [search, toast]);

  useEffect(() => { fetchRoutes(); }, [fetchRoutes]);

  const openCreate = () => {
    setSelectedRoute(null);
    setForm({ route_name: "", description: "", vehicle_number: "", driver_id: "", fare: "", facilities: "" });
    setFormOpen(true);
  };

  const openEdit = (r: TransportRoute) => {
    setSelectedRoute(r);
    setForm({
      route_name: r.route_name, description: r.description, vehicle_number: r.vehicle_number,
      driver_id: r.driver_id?.toString() || "", fare: r.fare.toString(), facilities: r.facilities,
    });
    setFormOpen(true);
  };

  const handleSave = async () => {
    try {
      const url = selectedRoute
        ? `/api/transport/route?${new URLSearchParams({ id: selectedRoute.transport_id.toString() })}`
        : "/api/transport/route";
      const method = selectedRoute ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed to save");
      toast({ title: "Success", description: selectedRoute ? "Route updated" : "Route created" });
      setFormOpen(false);
      fetchRoutes();
    } catch {
      toast({ title: "Error", description: "Failed to save route", variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!selectedRoute) return;
    try {
      const res = await fetch(`/api/transport/route?${new URLSearchParams({ id: selectedRoute.transport_id.toString() })}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      toast({ title: "Success", description: "Route deleted" });
      setDeleteOpen(false);
      fetchRoutes();
    } catch {
      toast({ title: "Error", description: "Failed to delete", variant: "destructive" });
    }
  };

  const fetchStudents = useCallback(async () => {
    try {
      const res = await fetch("/api/students");
      const data = await res.json();
      setStudents(Array.isArray(data) ? data.slice(0, 100) : []);
    } catch { /* empty */ }
  }, []);

  const openAssign = (r: TransportRoute) => {
    setSelectedRoute(r);
    setSelectedStudents([]);
    fetchStudents();
    setAssignOpen(true);
  };

  const fetchAttendance = async (routeId: number) => {
    setAttLoading(true);
    try {
      const params = new URLSearchParams({ route_id: routeId.toString(), date: attDate, direction: attDirection });
      const res = await fetch(`/api/transport/route/attendance?${params}`);
      setAttendance(await res.json());
    } catch { /* empty */ }
    setAttLoading(false);
  };

  const openAttendance = (r: TransportRoute) => {
    setSelectedRoute(r);
    setAttendanceOpen(true);
    fetchAttendance(r.transport_id);
  };

  const markAttendance = async (studentId: number) => {
    if (!selectedRoute) return;
    try {
      await fetch("/api/transport/route/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_id: studentId,
          route_id: selectedRoute.transport_id,
          attendance_date: attDate,
          transport_direction: attDirection,
          total_fare: selectedRoute.fare,
        }),
      });
      toast({ title: "Success", description: "Attendance marked" });
      fetchAttendance(selectedRoute.transport_id);
    } catch {
      toast({ title: "Error", description: "Failed to mark attendance", variant: "destructive" });
    }
  };

  const totalFare = routes.reduce((sum, r) => sum + r.studentCount * r.fare, 0);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="bg-emerald-700 text-white shadow-lg sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <Bus className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-lg font-bold">Transport</h1>
                <p className="text-emerald-200 text-xs hidden sm:block">Route & Attendance Management</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/10" onClick={() => router.push("/admin/transport/conductor")}>
                Conductor View
              </Button>
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/10" onClick={() => router.push("/")}>
                Dashboard
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard icon={Bus} label="Total Routes" value={routes.length} color="emerald" />
          <StatCard icon={Users} label="Total Students" value={routes.reduce((s, r) => s + r.studentCount, 0)} color="blue" />
          <StatCard icon={DollarSign} label="Total Fare" value={`GHS ${totalFare.toLocaleString()}`} color="amber" />
          <StatCard icon={MapPin} label="Avg Fare" value={`GHS ${routes.length ? (totalFare / routes.length).toFixed(0) : 0}`} color="purple" />
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h2 className="text-xl font-bold text-slate-900">Transport Routes</h2>
          <Button onClick={openCreate} className="bg-emerald-600 hover:bg-emerald-700 min-h-[44px]">
            <Plus className="w-4 h-4 mr-2" /> Add Route
          </Button>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input placeholder="Search routes..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 min-h-[44px]" />
        </div>

        {/* Routes */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
          </div>
        ) : routes.length === 0 ? (
          <Card className="py-12">
            <CardContent className="flex flex-col items-center">
              <Bus className="w-12 h-12 text-slate-300 mb-3" />
              <p className="text-slate-500">No routes found. Add your first transport route.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {routes.map(route => (
              <Card key={route.transport_id} className="hover:shadow-md transition-shadow border-slate-200/60">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                        <Bus className="w-4 h-4 text-emerald-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900 text-sm">{route.route_name}</h3>
                        <p className="text-xs text-slate-500">{route.vehicle_number || "No vehicle"}</p>
                      </div>
                    </div>
                    <Badge className="bg-emerald-100 text-emerald-700 text-xs">GHS {route.fare}</Badge>
                  </div>
                  {route.description && (
                    <p className="text-xs text-slate-500 mb-3 line-clamp-2">{route.description}</p>
                  )}
                  {route.facilities && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {route.facilities.split(",").filter(Boolean).slice(0, 3).map((f, i) => (
                        <Badge key={i} variant="secondary" className="text-[10px]">{f.trim()}</Badge>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    <div className="flex items-center gap-1 text-xs text-slate-500">
                      <Users className="w-3 h-3" />
                      <span>{route.studentCount} students</span>
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" className="h-7 text-xs text-emerald-600 hover:text-emerald-700" onClick={() => openAttendance(route)}>
                        <CheckCircle className="w-3 h-3 mr-1" /> Attendance
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 text-xs text-blue-600 hover:text-blue-700" onClick={() => openAssign(route)}>
                        <Users className="w-3 h-3 mr-1" /> Assign
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => openEdit(route)}>
                        <Pencil className="w-3 h-3" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 text-xs text-red-600" onClick={() => { setSelectedRoute(route); setDeleteOpen(true); }}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Add/Edit Route Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedRoute ? "Edit Route" : "Add New Route"}</DialogTitle>
            <DialogDescription>Configure transport route details</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Route Name *</Label>
              <Input value={form.route_name} onChange={e => setForm({ ...form, route_name: e.target.value })} placeholder="e.g. Airport - School" />
            </div>
            <div className="grid gap-2">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Route description" rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Vehicle Number</Label>
                <Input value={form.vehicle_number} onChange={e => setForm({ ...form, vehicle_number: e.target.value })} placeholder="e.g. GN 1234-25" />
              </div>
              <div className="grid gap-2">
                <Label>Fare (GHS)</Label>
                <Input type="number" value={form.fare} onChange={e => setForm({ ...form, fare: e.target.value })} placeholder="0.00" />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Facilities (comma separated)</Label>
              <Input value={form.facilities} onChange={e => setForm({ ...form, facilities: e.target.value })} placeholder="e.g. AC, GPS, First Aid" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700" disabled={!form.route_name.trim()}>
              {selectedRoute ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Route</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to delete <strong>{selectedRoute?.route_name}</strong>?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Student Assignment Dialog */}
      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Assign Students to {selectedRoute?.route_name}</DialogTitle>
            <DialogDescription>Select students to assign to this route</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {students.map(s => (
              <label key={s.student_id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedStudents.includes(s.student_id)}
                  onChange={e => {
                    if (e.target.checked) setSelectedStudents([...selectedStudents, s.student_id]);
                    else setSelectedStudents(selectedStudents.filter(id => id !== s.student_id));
                  }}
                  className="rounded border-slate-300"
                />
                <div>
                  <p className="text-sm font-medium text-slate-900">{s.name}</p>
                  <p className="text-xs text-slate-500">{s.student_code}</p>
                </div>
              </label>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignOpen(false)}>Close</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700" disabled={selectedStudents.length === 0}>
              Assign ({selectedStudents.length})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Attendance Dialog */}
      <Dialog open={attendanceOpen} onOpenChange={setAttendanceOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Bus Attendance - {selectedRoute?.route_name}</DialogTitle>
            <DialogDescription>Mark attendance for students on this route</DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 mb-4">
            <Input type="date" value={attDate} onChange={e => setAttDate(e.target.value)} className="w-auto" />
            <Select value={attDirection} onValueChange={setAttDirection}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="morning">Morning</SelectItem>
                <SelectItem value="evening">Evening</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => selectedRoute && fetchAttendance(selectedRoute.transport_id)} variant="outline">
              <Search className="w-4 h-4 mr-1" /> Refresh
            </Button>
          </div>
          {attLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 rounded" />)}
            </div>
          ) : attendance.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-8">No attendance records for this date and direction</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Direction</TableHead>
                  <TableHead>Boarded In</TableHead>
                  <TableHead>Fare</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendance.map(a => (
                  <TableRow key={a.id}>
                    <TableCell className="text-sm">{a.student?.name || "Unknown"}</TableCell>
                    <TableCell>
                      <Badge variant={a.transport_direction === "morning" ? "default" : "secondary"} className="text-xs">
                        {a.transport_direction}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-slate-500">
                      {a.boarded_in ? format(new Date(a.boarded_in), "HH:mm") : "—"}
                    </TableCell>
                    <TableCell className="text-sm">GHS {a.total_fare}</TableCell>
                    <TableCell>
                      {!a.boarded_out && (
                        <Button size="sm" variant="ghost" className="h-7 text-xs text-emerald-600"
                          onClick={() => {
                            fetch(`/api/transport/route/attendance`, {
                              method: "PUT",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ id: a.id, boarded_out: true }),
                            }).then(() => selectedRoute && fetchAttendance(selectedRoute.transport_id));
                          }}>
                          Mark Exit
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DialogContent>
      </Dialog>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-xs text-slate-400">&copy; {new Date().getFullYear()} School Manager</p>
        </div>
      </footer>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: {
  icon: React.ElementType; label: string; value: string | number; color: string;
}) {
  const iconBg: Record<string, string> = {
    emerald: "bg-emerald-100 text-emerald-600",
    blue: "bg-blue-100 text-blue-600",
    amber: "bg-amber-100 text-amber-600",
    purple: "bg-purple-100 text-purple-600",
  };
  return (
    <Card className="border-slate-200/60">
      <CardContent className="p-4">
        <div className={`w-8 h-8 rounded-lg ${iconBg[color]} flex items-center justify-center mb-2`}>
          <Icon className="w-4 h-4" />
        </div>
        <p className="text-xl font-bold text-slate-900">{value}</p>
        <p className="text-xs text-slate-500">{label}</p>
      </CardContent>
    </Card>
  );
}
