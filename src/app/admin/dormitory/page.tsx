"use client";

import { useState, useEffect, useCallback } from "react";
import {
  BedDouble, Plus, Pencil, Trash2, Users, DoorOpen, Building2, UserPlus, Search, X, Eye,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { useToast } from "@/hooks/use-toast";

interface Room {
  id: number; room_name: string; room_number: string; room_type: string;
  capacity: number; floor: number; facilities: string; status: string;
  occupants: { id: number; student_id: number; assigned_at: string }[];
}
interface Student { student_id: number; name: string; student_code: string; sex: string; }

const FACILITIES = ["WiFi", "AC", "Fan", "Desk", "Wardrobe", "Attached Bathroom", "Hot Water", "Study Lamp"];

export default function DormitoryPage() {
  const { toast } = useToast();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<Room | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [assignSearch, setAssignSearch] = useState("");

  const [form, setForm] = useState({ room_name: "", room_number: "", room_type: "Single", capacity: "1", floor: "1", facilities: [] as string[], status: "Available" });
  const [assignForm, setAssignForm] = useState({ room_id: "", student_id: "" });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/dormitory?action=stats");
      const data = await res.json();
      setRooms(data.rooms || []);
      setStudents(data.students || []);
    } catch { /* empty */ }
    setLoading(false);
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSave = async () => {
    try {
      const payload = selected
        ? { action: "update", id: selected.id, ...form }
        : { action: "create", ...form };
      await fetch("/api/admin/dormitory", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      toast({ title: selected ? "Room updated" : "Room created" });
      setFormOpen(false);
      fetchData();
    } catch { toast({ title: "Error", variant: "destructive" }); }
  };

  const handleAssign = async () => {
    if (!assignForm.room_id || !assignForm.student_id) return;
    try {
      await fetch("/api/admin/dormitory", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "assign_student", ...assignForm }) });
      toast({ title: "Student assigned" });
      setAssignOpen(false);
      fetchData();
    } catch { toast({ title: "Error", variant: "destructive" }); }
  };

  const handleRemoveStudent = async (roomId: number, studentId: number) => {
    await fetch("/api/admin/dormitory", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "remove_student", room_id: roomId, student_id: studentId }) });
    toast({ title: "Student removed" });
    fetchData();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await fetch(`/api/admin/dormitory?id=${deleteId}`, { method: "DELETE" });
    toast({ title: "Room deleted" });
    setDeleteOpen(false);
    fetchData();
  };

  const getStudentName = (sid: number) => students.find(s => s.student_id === sid)?.name || `Student #${sid}`;
  const getStudent = (sid: number) => students.find(s => s.student_id === sid);

  const filtered = rooms.filter(r =>
    search === "" || r.room_name.toLowerCase().includes(search.toLowerCase()) || r.room_number.toLowerCase().includes(search.toLowerCase())
  );

  const totalRooms = rooms.length;
  const occupied = rooms.filter(r => r.occupants.length >= r.capacity || r.status === "Occupied").length;
  const available = totalRooms - occupied;
  const totalCapacity = rooms.reduce((s, r) => s + r.capacity, 0);
  const totalOccupants = rooms.reduce((s, r) => s + r.occupants.length, 0);

  const assignedIds = new Set(rooms.flatMap(r => r.occupants.map(o => o.student_id)));
  const filteredStudents = students.filter(s =>
    s.active_status !== 0 && !assignedIds.has(s.student_id) &&
    (assignSearch === "" || s.name.toLowerCase().includes(assignSearch.toLowerCase()) || s.student_code.toLowerCase().includes(assignSearch.toLowerCase()))
  );

  const statusColor = (status: string) => {
    if (status === "Available") return "bg-emerald-100 text-emerald-700 border-emerald-200";
    if (status === "Occupied") return "bg-amber-100 text-amber-700 border-amber-200";
    if (status === "Maintenance") return "bg-red-100 text-red-700 border-red-200";
    return "bg-slate-100 text-slate-700 border-slate-200";
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="bg-gradient-to-r from-sky-600 to-blue-600 text-white shadow-lg sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center"><Building2 className="w-6 h-6" /></div>
              <div><h1 className="text-lg font-bold">Dormitory Management</h1><p className="text-sky-200 text-xs hidden sm:block">Room allocation &amp; occupancy tracking</p></div>
            </div>
            <Button onClick={() => { setSelected(null); setForm({ room_name: "", room_number: "", room_type: "Single", capacity: "1", floor: "1", facilities: [], status: "Available" }); setFormOpen(true); }} className="bg-white/20 hover:bg-white/30 text-white border-white/30 min-h-[44px]"><Plus className="w-4 h-4 mr-2" /> Add Room</Button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {loading ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />) : (
            <>
              <StatCard icon={DoorOpen} label="Total Rooms" value={totalRooms} color="sky" />
              <StatCard icon={BedDouble} label="Occupied" value={occupied} color="amber" />
              <StatCard icon={Building2} label="Available" value={available} color="emerald" />
              <StatCard icon={Users} label="Total Capacity" value={`${totalOccupants}/${totalCapacity}`} color="violet" />
            </>
          )}
        </div>

        {/* Occupancy bar */}
        {!loading && totalCapacity > 0 && (
          <Card className="border-slate-200/60 mb-6">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-700">Overall Occupancy</span>
                <span className="text-sm font-bold">{totalOccupants}/{totalCapacity} ({Math.round((totalOccupants / totalCapacity) * 100)}%)</span>
              </div>
              <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all ${totalOccupants / totalCapacity >= 0.9 ? "bg-red-500" : totalOccupants / totalCapacity >= 0.7 ? "bg-amber-500" : "bg-emerald-500"}`}
                  style={{ width: `${Math.min(100, (totalOccupants / totalCapacity) * 100)}%` }} />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search & Assign */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><Input placeholder="Search rooms..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 min-h-[44px]" /></div>
          <Button onClick={() => { setAssignForm({ room_id: "", student_id: "" }); setAssignSearch(""); setAssignOpen(true); }} className="bg-sky-600 hover:bg-sky-700 min-h-[44px]"><UserPlus className="w-4 h-4 mr-2" /> Assign Student</Button>
        </div>

        {/* Desktop Table */}
        <Card className="border-slate-200/60 mb-6"><CardContent className="p-0">
          <div className="max-h-[500px] overflow-y-auto">
            <div className="hidden md:block">
              <Table>
                <TableHeader><TableRow className="bg-slate-50"><TableHead>Room</TableHead><TableHead>Type</TableHead><TableHead>Floor</TableHead><TableHead>Capacity</TableHead><TableHead>Occupants</TableHead><TableHead>Facilities</TableHead><TableHead>Status</TableHead><TableHead className="w-28">Actions</TableHead></TableRow></TableHeader>
                <TableBody>
                  {loading ? Array.from({ length: 5 }).map((_, i) => <TableRow key={i}><TableCell colSpan={8}><Skeleton className="h-8" /></TableCell></TableRow>) :
                    filtered.length === 0 ? <TableRow><TableCell colSpan={8} className="text-center text-slate-400 py-12">No rooms found</TableCell></TableRow> :
                      filtered.map(room => (
                        <TableRow key={room.id}>
                          <TableCell><div className="flex items-center gap-2"><div className="w-8 h-8 rounded-lg bg-sky-100 flex items-center justify-center"><DoorOpen className="w-4 h-4 text-sky-600" /></div><div><p className="font-medium text-sm">{room.room_name || room.room_number || `Room #${room.id}`}</p><p className="text-xs text-slate-500">#{room.id}</p></div></div></TableCell>
                          <TableCell className="text-sm">{room.room_type}</TableCell>
                          <TableCell className="text-sm">F{room.floor}</TableCell>
                          <TableCell className="text-sm">{room.occupants.length}/{room.capacity}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">{room.occupants.slice(0, 3).map(o => <Badge key={o.id} variant="outline" className="text-[10px]">{getStudentName(o.student_id)}</Badge>)}{room.occupants.length > 3 && <Badge variant="outline" className="text-[10px]">+{room.occupants.length - 3}</Badge>}</div>
                          </TableCell>
                          <TableCell><div className="flex flex-wrap gap-1 max-w-[160px]">{room.facilities ? room.facilities.split(",").slice(0, 2).map((f, i) => <Badge key={i} variant="secondary" className="text-[10px]">{f}</Badge>) : "—"}</div></TableCell>
                          <TableCell><Badge variant="outline" className={statusColor(room.status)}>{room.status}</Badge></TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => { setSelected(room); setViewOpen(true); }}><Eye className="w-3 h-3" /></Button>
                              <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => { setSelected(room); setForm({ room_name: room.room_name, room_number: room.room_number, room_type: room.room_type, capacity: room.capacity.toString(), floor: room.floor.toString(), facilities: room.facilities ? room.facilities.split(",") : [], status: room.status }); setFormOpen(true); }}><Pencil className="w-3 h-3" /></Button>
                              <Button size="sm" variant="ghost" className="h-7 text-xs text-red-600" onClick={() => { setDeleteId(room.id); setDeleteOpen(true); }}><Trash2 className="w-3 h-3" /></Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                </TableBody>
              </Table>
            </div>
            {/* Mobile Cards */}
            <div className="md:hidden divide-y max-h-[500px] overflow-y-auto">
              {loading ? Array.from({ length: 3 }).map((_, i) => <div key={i} className="p-4"><Skeleton className="h-24" /></div>) :
                filtered.length === 0 ? <div className="text-center py-12 text-slate-400"><Building2 className="w-10 h-10 mx-auto mb-2 opacity-50" /><p>No rooms found</p></div> :
                  filtered.map(room => (
                    <div key={room.id} className="p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-sky-100 flex items-center justify-center"><DoorOpen className="w-5 h-5 text-sky-600" /></div>
                          <div><p className="font-semibold text-sm">{room.room_name || room.room_number || `Room #${room.id}`}</p><p className="text-xs text-slate-500">{room.room_type} · Floor {room.floor}</p></div>
                        </div>
                        <Badge variant="outline" className={statusColor(room.status)}>{room.status}</Badge>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant="secondary" className="text-[10px]">{room.occupants.length}/{room.capacity} occupants</Badge>
                        {room.facilities && room.facilities.split(",").slice(0, 2).map((f, i) => <Badge key={i} variant="outline" className="text-[10px]">{f}</Badge>)}
                      </div>
                      <div className="flex gap-2 pt-1">
                        <Button variant="outline" size="sm" className="h-8 text-xs flex-1" onClick={() => { setSelected(room); setViewOpen(true); }}><Eye className="w-3 h-3 mr-1" />View</Button>
                        <Button variant="outline" size="sm" className="h-8 text-xs flex-1" onClick={() => { setSelected(room); setForm({ room_name: room.room_name, room_number: room.room_number, room_type: room.room_type, capacity: room.capacity.toString(), floor: room.floor.toString(), facilities: room.facilities ? room.facilities.split(",") : [], status: room.status }); setFormOpen(true); }}><Pencil className="w-3 h-3 mr-1" />Edit</Button>
                        <Button variant="outline" size="sm" className="h-8 text-xs text-red-500" onClick={() => { setDeleteId(room.id); setDeleteOpen(true); }}><Trash2 className="w-3 h-3" /></Button>
                      </div>
                    </div>
                  ))}
            </div>
          </div>
        </CardContent></Card>
      </main>

      {/* Room Form Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{selected ? "Edit Room" : "Add Room"}</DialogTitle><DialogDescription>Configure room details and facilities</DialogDescription></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2"><Label>Room Name *</Label><Input value={form.room_name} onChange={e => setForm({ ...form, room_name: e.target.value })} placeholder="e.g., Room 101" /></div>
              <div className="grid gap-2"><Label>Room Number</Label><Input value={form.room_number} onChange={e => setForm({ ...form, room_number: e.target.value })} placeholder="e.g., A-101" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2"><Label>Room Type</Label>
                <Select value={form.room_type} onValueChange={v => setForm({ ...form, room_type: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Single">Single</SelectItem><SelectItem value="Double">Double</SelectItem><SelectItem value="Dormitory">Dormitory</SelectItem></SelectContent></Select>
              </div>
              <div className="grid gap-2"><Label>Status</Label>
                <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Available">Available</SelectItem><SelectItem value="Occupied">Occupied</SelectItem><SelectItem value="Maintenance">Maintenance</SelectItem></SelectContent></Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2"><Label>Capacity</Label><Input type="number" value={form.capacity} onChange={e => setForm({ ...form, capacity: e.target.value })} /></div>
              <div className="grid gap-2"><Label>Floor</Label><Input type="number" value={form.floor} onChange={e => setForm({ ...form, floor: e.target.value })} /></div>
            </div>
            <div className="grid gap-2">
              <Label>Facilities</Label>
              <div className="grid grid-cols-2 gap-2">{FACILITIES.map(f => (
                <div key={f} className="flex items-center space-x-2"><Checkbox checked={form.facilities.includes(f)} onCheckedChange={checked => setForm({ ...form, facilities: checked ? [...form.facilities, f] : form.facilities.filter(x => x !== f) })} /><Label className="text-xs font-normal">{f}</Label></div>
              ))}</div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} className="bg-sky-600 hover:bg-sky-700" disabled={!form.room_name.trim()}>{selected ? "Update" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Student Dialog */}
      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Assign Student to Room</DialogTitle><DialogDescription>Select a student and room for assignment</DialogDescription></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2"><Label>Student *</Label>
              <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><Input placeholder="Search students..." value={assignSearch} onChange={e => setAssignSearch(e.target.value)} className="pl-10" /></div>
              <Select value={assignForm.student_id} onValueChange={v => setAssignForm({ ...assignForm, student_id: v })}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select student" /></SelectTrigger>
                <SelectContent className="max-h-60"><SelectItem value="none">Choose student...</SelectItem>{filteredStudents.slice(0, 50).map(s => <SelectItem key={s.student_id} value={s.student_id.toString()}>{s.name} ({s.student_code})</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid gap-2"><Label>Room *</Label>
              <Select value={assignForm.room_id} onValueChange={v => setAssignForm({ ...assignForm, room_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select room" /></SelectTrigger>
                <SelectContent className="max-h-60"><SelectItem value="none">Choose room...</SelectItem>{rooms.filter(r => r.occupants.length < r.capacity && r.status !== "Maintenance").map(r => <SelectItem key={r.id} value={r.id.toString()}>{r.room_name || r.room_number || `Room #${r.id}`} ({r.occupants.length}/{r.capacity})</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignOpen(false)}>Cancel</Button>
            <Button onClick={handleAssign} className="bg-sky-600 hover:bg-sky-700" disabled={!assignForm.student_id || !assignForm.room_id}>Assign</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Room Dialog */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Room Details</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="bg-sky-50 rounded-lg p-4 text-center">
                <div className="w-12 h-12 rounded-full bg-sky-200 flex items-center justify-center mx-auto mb-2"><DoorOpen className="w-6 h-6 text-sky-700" /></div>
                <p className="font-bold text-lg">{selected.room_name || selected.room_number || `Room #${selected.id}`}</p>
                <div className="flex justify-center gap-2 mt-2"><Badge variant="outline" className={statusColor(selected.status)}>{selected.status}</Badge><Badge variant="secondary">{selected.room_type}</Badge><Badge variant="secondary">Floor {selected.floor}</Badge></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 rounded-lg p-3 text-center"><p className="text-xl font-bold text-sky-600">{selected.occupants.length}/{selected.capacity}</p><p className="text-xs text-slate-500">Occupants</p></div>
                <div className="bg-slate-50 rounded-lg p-3 text-center"><p className="text-xl font-bold text-violet-600">{selected.capacity - selected.occupants.length}</p><p className="text-xs text-slate-500">Available</p></div>
              </div>
              {selected.facilities && <div className="flex flex-wrap gap-1">{selected.facilities.split(",").map((f, i) => <Badge key={i} variant="outline">{f}</Badge>)}</div>}
              {selected.occupants.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-slate-700">Occupants</p>
                  {selected.occupants.map(o => {
                    const st = getStudent(o.student_id);
                    return (
                      <div key={o.id} className="flex items-center justify-between bg-slate-50 rounded-lg p-2">
                        <div className="flex items-center gap-2">
                          <Avatar className="w-7 h-7"><AvatarFallback className="bg-sky-100 text-sky-700 text-[10px] font-semibold">{st?.name?.charAt(0) || "?"}</AvatarFallback></Avatar>
                          <div><p className="text-sm font-medium">{st?.name || "#" + o.student_id}</p><p className="text-[10px] text-slate-500">{st?.student_code || ""}</p></div>
                        </div>
                        <Button size="sm" variant="ghost" className="h-7 text-xs text-red-500" onClick={() => handleRemoveStudent(selected.id, o.student_id)}><Trash2 className="w-3 h-3" /></Button>
                      </div>
                    );
                  })}
                </div>
              ) : <p className="text-sm text-slate-400 text-center py-4">No occupants assigned</p>}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete Room</AlertDialogTitle><AlertDialogDescription>Are you sure? This will remove the room and all student assignments.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>

      <footer className="bg-white border-t border-slate-200 py-4 mt-auto"><div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center"><p className="text-xs text-slate-400">&copy; {new Date().getFullYear()} School Manager</p></div></footer>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: number | string; color: string }) {
  const colors: Record<string, string> = { sky: "bg-sky-100 text-sky-600", emerald: "bg-emerald-100 text-emerald-600", amber: "bg-amber-100 text-amber-600", violet: "bg-violet-100 text-violet-600" };
  return <Card className="border-slate-200/60"><CardContent className="p-4"><div className={`w-8 h-8 rounded-lg ${colors[color]} flex items-center justify-center mb-2`}><Icon className="w-4 h-4" /></div><p className="text-xl font-bold text-slate-900">{value}</p><p className="text-xs text-slate-500">{label}</p></CardContent></Card>;
}
