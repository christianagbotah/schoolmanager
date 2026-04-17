"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Wrench, Plus, Pencil, Trash2, Search, X, AlertCircle, CheckCircle2, Clock, Loader2, MapPin, ArrowRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
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
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface MaintenanceRequest {
  id: number; title: string; description: string; priority: string; category: string;
  location: string; reported_by: string; status: string; created_at: string; updated_at: string;
}

const PRIORITIES = ["Low", "Medium", "High", "Urgent"];
const CATEGORIES = ["Electrical", "Plumbing", "Structural", "Furniture", "IT", "Other"];
const STATUSES = ["Open", "In Progress", "Completed", "Closed"];

const STATUS_FLOW: Record<string, string> = {
  Open: "In Progress",
  "In Progress": "Completed",
  Completed: "Closed",
};

export default function MaintenancePage() {
  const { toast } = useToast();
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<MaintenanceRequest | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const [form, setForm] = useState({
    title: "", description: "", priority: "Medium", category: "Other", location: "", reported_by: "",
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/maintenance?action=stats");
      const data = await res.json();
      setRequests(data.requests || []);
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
      await fetch("/api/admin/maintenance", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      toast({ title: selected ? "Request updated" : "Request created" });
      setFormOpen(false);
      fetchData();
    } catch { toast({ title: "Error", variant: "destructive" }); }
  };

  const handleStatusChange = async (id: number, newStatus: string) => {
    try {
      await fetch("/api/admin/maintenance", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "update_status", id, status: newStatus }) });
      toast({ title: `Status updated to ${newStatus}` });
      fetchData();
    } catch { toast({ title: "Invalid status transition", variant: "destructive" }); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await fetch(`/api/admin/maintenance?id=${deleteId}`, { method: "DELETE" });
    toast({ title: "Request deleted" });
    setDeleteOpen(false);
    fetchData();
  };

  const filtered = requests.filter(r => {
    const matchSearch = search === "" || r.title.toLowerCase().includes(search.toLowerCase()) || r.location.toLowerCase().includes(search.toLowerCase()) || r.reported_by.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || r.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const totalRequests = requests.length;
  const openCount = requests.filter(r => r.status === "Open").length;
  const inProgress = requests.filter(r => r.status === "In Progress").length;
  const completed = requests.filter(r => r.status === "Completed" || r.status === "Closed").length;

  const priorityColor = (priority: string) => {
    if (priority === "Low") return "bg-slate-100 text-slate-700 border-slate-200";
    if (priority === "Medium") return "bg-sky-100 text-sky-700 border-sky-200";
    if (priority === "High") return "bg-amber-100 text-amber-700 border-amber-200";
    if (priority === "Urgent") return "bg-red-100 text-red-700 border-red-200";
    return "bg-slate-100 text-slate-700 border-slate-200";
  };

  const statusColor = (status: string) => {
    if (status === "Open") return "bg-sky-100 text-sky-700 border-sky-200";
    if (status === "In Progress") return "bg-amber-100 text-amber-700 border-amber-200";
    if (status === "Completed") return "bg-emerald-100 text-emerald-700 border-emerald-200";
    if (status === "Closed") return "bg-slate-100 text-slate-500 border-slate-200";
    return "bg-slate-100 text-slate-700 border-slate-200";
  };

  const statusIcon = (status: string) => {
    if (status === "Open") return <AlertCircle className="w-3 h-3" />;
    if (status === "In Progress") return <Loader2 className="w-3 h-3" />;
    if (status === "Completed") return <CheckCircle2 className="w-3 h-3" />;
    return <CheckCircle2 className="w-3 h-3" />;
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center"><Wrench className="w-6 h-6" /></div>
              <div><h1 className="text-lg font-bold">Maintenance Management</h1><p className="text-orange-200 text-xs hidden sm:block">Track &amp; manage maintenance requests</p></div>
            </div>
            <Button onClick={() => { setSelected(null); setForm({ title: "", description: "", priority: "Medium", category: "Other", location: "", reported_by: "" }); setFormOpen(true); }} className="bg-white/20 hover:bg-white/30 text-white border-white/30 min-h-[44px]"><Plus className="w-4 h-4 mr-2" /> New Request</Button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {loading ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />) : (
            <>
              <StatCard icon={Wrench} label="Total Requests" value={totalRequests} color="orange" />
              <StatCard icon={AlertCircle} label="Open" value={openCount} color="sky" />
              <StatCard icon={Clock} label="In Progress" value={inProgress} color="amber" />
              <StatCard icon={CheckCircle2} label="Completed" value={completed} color="emerald" />
            </>
          )}
        </div>

        {/* Status Workflow Visual */}
        {!loading && requests.length > 0 && (
          <Card className="border-slate-200/60 mb-6">
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-2 overflow-x-auto">
                {STATUSES.map((s, i) => (
                  <div key={s} className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 border">
                      {statusIcon(s)}<span className="text-xs font-medium">{s}</span>
                      <Badge variant="secondary" className="text-[10px] ml-1">{requests.filter(r => r.status === s).length}</Badge>
                    </div>
                    {i < STATUSES.length - 1 && <ArrowRight className="w-3 h-3 text-slate-400 flex-shrink-0" />}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><Input placeholder="Search requests..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 min-h-[44px]" /></div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[150px] min-h-[44px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent><SelectItem value="all">All Status</SelectItem>{STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>
        </div>

        {/* Desktop Table */}
        <Card className="border-slate-200/60"><CardContent className="p-0">
          <div className="max-h-[500px] overflow-y-auto">
            <div className="hidden md:block">
              <Table>
                <TableHeader><TableRow className="bg-slate-50"><TableHead>Title</TableHead><TableHead>Category</TableHead><TableHead>Priority</TableHead><TableHead>Location</TableHead><TableHead>Status</TableHead><TableHead>Date</TableHead><TableHead className="w-28">Actions</TableHead></TableRow></TableHeader>
                <TableBody>
                  {loading ? Array.from({ length: 5 }).map((_, i) => <TableRow key={i}><TableCell colSpan={7}><Skeleton className="h-8" /></TableCell></TableRow>) :
                    filtered.length === 0 ? <TableRow><TableCell colSpan={7} className="text-center text-slate-400 py-12">No maintenance requests found</TableCell></TableRow> :
                      filtered.map(req => (
                        <TableRow key={req.id}>
                          <TableCell>
                            <div><p className="font-medium text-sm">{req.title}</p><p className="text-xs text-slate-500 max-w-[200px] truncate">{req.description || "No description"}</p></div>
                          </TableCell>
                          <TableCell><Badge variant="outline" className="text-xs">{req.category}</Badge></TableCell>
                          <TableCell><Badge variant="outline" className={priorityColor(req.priority)}>{req.priority}</Badge></TableCell>
                          <TableCell className="text-sm">{req.location ? <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{req.location}</span> : "—"}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Badge variant="outline" className={statusColor(req.status)}>{req.status}</Badge>
                              {STATUS_FLOW[req.status] && (
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild><Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-emerald-600 hover:text-emerald-700"><ArrowRight className="w-3 h-3" /></Button></DropdownMenuTrigger>
                                  <DropdownMenuContent><DropdownMenuItem onClick={() => handleStatusChange(req.id, STATUS_FLOW[req.status])}>Move to {STATUS_FLOW[req.status]}</DropdownMenuItem></DropdownMenuContent>
                                </DropdownMenu>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-xs text-slate-500">{format(new Date(req.created_at), "MMM d, yyyy")}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => { setSelected(req); setForm({ title: req.title, description: req.description, priority: req.priority, category: req.category, location: req.location, reported_by: req.reported_by }); setFormOpen(true); }}><Pencil className="w-3 h-3" /></Button>
                              <Button size="sm" variant="ghost" className="h-7 text-xs text-red-600" onClick={() => { setDeleteId(req.id); setDeleteOpen(true); }}><Trash2 className="w-3 h-3" /></Button>
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
                filtered.length === 0 ? <div className="text-center py-12 text-slate-400"><Wrench className="w-10 h-10 mx-auto mb-2 opacity-50" /><p>No requests found</p></div> :
                  filtered.map(req => (
                    <div key={req.id} className="p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm">{req.title}</p>
                          <p className="text-xs text-slate-500 truncate mt-0.5">{req.description || "No description"}</p>
                        </div>
                        <Badge variant="outline" className={priorityColor(req.priority)} ml-2 flex-shrink-0>{req.priority}</Badge>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        <Badge variant="outline" className="text-[10px]">{req.category}</Badge>
                        {req.location && <Badge variant="outline" className="text-[10px]"><MapPin className="w-2.5 h-2.5 mr-0.5" />{req.location}</Badge>}
                        <Badge variant="outline" className={statusColor(req.status)}>{req.status}</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-slate-400">{format(new Date(req.created_at), "MMM d, yyyy")}{req.reported_by ? ` · ${req.reported_by}` : ""}</p>
                        <div className="flex gap-2">
                          {STATUS_FLOW[req.status] && (
                            <Button variant="outline" size="sm" className="h-7 text-xs text-emerald-600 border-emerald-200" onClick={() => handleStatusChange(req.id, STATUS_FLOW[req.status])}><ArrowRight className="w-3 h-3 mr-1" />{STATUS_FLOW[req.status]}</Button>
                          )}
                          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => { setSelected(req); setForm({ title: req.title, description: req.description, priority: req.priority, category: req.category, location: req.location, reported_by: req.reported_by }); setFormOpen(true); }}><Pencil className="w-3 h-3 mr-1" />Edit</Button>
                          <Button variant="outline" size="sm" className="h-7 text-xs text-red-500" onClick={() => { setDeleteId(req.id); setDeleteOpen(true); }}><Trash2 className="w-3 h-3" /></Button>
                        </div>
                      </div>
                    </div>
                  ))}
            </div>
          </div>
        </CardContent></Card>
      </main>

      {/* Form Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{selected ? "Edit Request" : "New Maintenance Request"}</DialogTitle><DialogDescription>Describe the issue and set priority</DialogDescription></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2"><Label>Title *</Label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Brief title for the issue" /></div>
            <div className="grid gap-2"><Label>Description</Label><Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} placeholder="Detailed description of the issue" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2"><Label>Priority</Label>
                <Select value={form.priority} onValueChange={v => setForm({ ...form, priority: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{PRIORITIES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent></Select>
              </div>
              <div className="grid gap-2"><Label>Category</Label>
                <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2"><Label>Location</Label><Input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="e.g., Block A, Room 101" /></div>
              <div className="grid gap-2"><Label>Reported By</Label><Input value={form.reported_by} onChange={e => setForm({ ...form, reported_by: e.target.value })} placeholder="Name of reporter" /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} className="bg-orange-500 hover:bg-orange-600" disabled={!form.title.trim()}>{selected ? "Update" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete Request</AlertDialogTitle><AlertDialogDescription>Are you sure? This action cannot be undone.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>

      <footer className="bg-white border-t border-slate-200 py-4 mt-auto"><div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center"><p className="text-xs text-slate-400">&copy; {new Date().getFullYear()} School Manager</p></div></footer>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: number | string; color: string }) {
  const colors: Record<string, string> = { orange: "bg-orange-100 text-orange-600", sky: "bg-sky-100 text-sky-600", amber: "bg-amber-100 text-amber-600", emerald: "bg-emerald-100 text-emerald-600" };
  return <Card className="border-slate-200/60"><CardContent className="p-4"><div className={`w-8 h-8 rounded-lg ${colors[color]} flex items-center justify-center mb-2`}><Icon className="w-4 h-4" /></div><p className="text-xl font-bold text-slate-900">{value}</p><p className="text-xs text-slate-500">{label}</p></CardContent></Card>;
}
