"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Shield, Plus, Pencil, Trash2, Search, X, AlertTriangle, RefreshCw, Users, DollarSign, Clock,
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
import { format, differenceInDays } from "date-fns";

interface InsurancePolicy {
  id: number; student_id: number; provider_name: string; policy_number: string;
  coverage_amount: number; premium: number; start_date: string | null;
  end_date: string | null; status: string; auto_renewal: number; created_at: string;
}
interface Student { student_id: number; name: string; student_code: string; sex: string; }

export default function InsurancePage() {
  const { toast } = useToast();
  const [policies, setPolicies] = useState<InsurancePolicy[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<InsurancePolicy | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [studentSearch, setStudentSearch] = useState("");

  const [form, setForm] = useState({
    student_id: "", provider_name: "", policy_number: "", coverage_amount: "",
    premium: "", start_date: "", end_date: "", status: "Active", auto_renewal: false,
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/insurance?action=stats");
      const data = await res.json();
      setPolicies(data.insurances || []);
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
      await fetch("/api/admin/insurance", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      toast({ title: selected ? "Policy updated" : "Policy created" });
      setFormOpen(false);
      fetchData();
    } catch { toast({ title: "Error", variant: "destructive" }); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await fetch(`/api/admin/insurance?id=${deleteId}`, { method: "DELETE" });
    toast({ title: "Policy deleted" });
    setDeleteOpen(false);
    fetchData();
  };

  const getStudentName = (sid: number) => students.find(s => s.student_id === sid)?.name || `Student #${sid}`;
  const getStudent = (sid: number) => students.find(s => s.student_id === sid);

  const now = new Date();

  const expiryStatus = (endDate: string | null, status: string) => {
    if (!endDate) return "normal";
    if (status !== "Active") return "expired";
    const diff = differenceInDays(new Date(endDate), now);
    if (diff < 0) return "expired";
    if (diff <= 30) return "expiring-soon";
    return "normal";
  };

  const expiryBadge = (endDate: string | null, status: string) => {
    const es = expiryStatus(endDate, status);
    if (es === "expired") return <Badge className="bg-red-100 text-red-700 text-xs">Expired</Badge>;
    if (es === "expiring-soon") return <Badge className="bg-amber-100 text-amber-700 text-xs">Expiring Soon</Badge>;
    return null;
  };

  const filteredStudents = students.filter(s =>
    s.active_status !== 0 &&
    (studentSearch === "" || s.name.toLowerCase().includes(studentSearch.toLowerCase()) || s.student_code.toLowerCase().includes(studentSearch.toLowerCase()))
  );

  const filtered = policies.filter(p => {
    const matchSearch = search === "" || getStudentName(p.student_id).toLowerCase().includes(search.toLowerCase()) || p.provider_name.toLowerCase().includes(search.toLowerCase()) || p.policy_number.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || p.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const totalInsured = policies.length;
  const activePolicies = policies.filter(p => p.status === "Active").length;
  const expiringSoon = policies.filter(p => expiryStatus(p.end_date, p.status) === "expiring-soon").length;
  const totalCoverage = policies.reduce((s, p) => s + p.coverage_amount, 0);

  const statusColor = (status: string) => {
    if (status === "Active") return "bg-emerald-100 text-emerald-700 border-emerald-200";
    if (status === "Expired" || status === "Cancelled") return "bg-red-100 text-red-700 border-red-200";
    return "bg-slate-100 text-slate-700 border-slate-200";
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center"><Shield className="w-6 h-6" /></div>
              <div><h1 className="text-lg font-bold">Insurance Management</h1><p className="text-emerald-200 text-xs hidden sm:block">Student insurance policies &amp; coverage</p></div>
            </div>
            <Button onClick={() => { setSelected(null); setForm({ student_id: "", provider_name: "", policy_number: "", coverage_amount: "", premium: "", start_date: "", end_date: "", status: "Active", auto_renewal: false }); setStudentSearch(""); setFormOpen(true); }} className="bg-white/20 hover:bg-white/30 text-white border-white/30 min-h-[44px]"><Plus className="w-4 h-4 mr-2" /> Add Policy</Button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {loading ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />) : (
            <>
              <StatCard icon={Users} label="Total Insured" value={totalInsured} color="emerald" />
              <StatCard icon={Shield} label="Active Policies" value={activePolicies} color="teal" />
              <StatCard icon={AlertTriangle} label="Expiring Soon" value={expiringSoon} color="amber" />
              <StatCard icon={DollarSign} label="Total Coverage" value={`GHC ${(totalCoverage || 0).toLocaleString()}`} color="sky" />
            </>
          )}
        </div>

        {/* Expiry warnings */}
        {!loading && policies.some(p => expiryStatus(p.end_date, p.status) !== "normal") && (
          <Card className="border-amber-200 bg-amber-50/50 mb-6">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2"><AlertTriangle className="w-4 h-4 text-amber-600" /><span className="text-sm font-medium text-amber-800">Attention Required</span></div>
              <div className="space-y-1">
                {policies.filter(p => expiryStatus(p.end_date, p.status) === "expired").map(p => (
                  <p key={p.id} className="text-xs text-red-700"><span className="font-medium">{getStudentName(p.student_id)}</span> - Policy {p.policy_number} has <strong>expired</strong>{p.end_date ? ` (${format(new Date(p.end_date), "MMM d, yyyy")})` : ""}</p>
                ))}
                {policies.filter(p => expiryStatus(p.end_date, p.status) === "expiring-soon").map(p => (
                  <p key={p.id} className="text-xs text-amber-700"><span className="font-medium">{getStudentName(p.student_id)}</span> - Policy {p.policy_number} expires in {p.end_date ? `${differenceInDays(new Date(p.end_date), now)} days` : "unknown"}</p>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><Input placeholder="Search by student, provider, or policy..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 min-h-[44px]" /></div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[140px] min-h-[44px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent><SelectItem value="all">All Status</SelectItem><SelectItem value="Active">Active</SelectItem><SelectItem value="Expired">Expired</SelectItem><SelectItem value="Cancelled">Cancelled</SelectItem></SelectContent>
          </Select>
        </div>

        {/* Desktop Table */}
        <Card className="border-slate-200/60"><CardContent className="p-0">
          <div className="max-h-[500px] overflow-y-auto">
            <div className="hidden md:block">
              <Table>
                <TableHeader><TableRow className="bg-slate-50"><TableHead>Student</TableHead><TableHead>Provider</TableHead><TableHead>Policy #</TableHead><TableHead>Coverage</TableHead><TableHead>Premium</TableHead><TableHead>Period</TableHead><TableHead>Status</TableHead><TableHead className="w-24">Actions</TableHead></TableRow></TableHeader>
                <TableBody>
                  {loading ? Array.from({ length: 5 }).map((_, i) => <TableRow key={i}><TableCell colSpan={8}><Skeleton className="h-8" /></TableCell></TableRow>) :
                    filtered.length === 0 ? <TableRow><TableCell colSpan={8} className="text-center text-slate-400 py-12">No insurance policies found</TableCell></TableRow> :
                      filtered.map(policy => {
                        const st = getStudent(policy.student_id);
                        return (
                          <TableRow key={policy.id}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Avatar className="w-7 h-7"><AvatarFallback className="bg-emerald-100 text-emerald-700 text-[10px] font-semibold">{st?.name?.charAt(0) || "?"}</AvatarFallback></Avatar>
                                <div><p className="font-medium text-sm">{st?.name || `#${policy.student_id}`}</p><p className="text-xs text-slate-500">{st?.student_code || ""}</p></div>
                              </div>
                            </TableCell>
                            <TableCell className="text-sm">{policy.provider_name || "—"}</TableCell>
                            <TableCell className="text-sm font-mono">{policy.policy_number || "—"}</TableCell>
                            <TableCell className="text-sm font-medium">GHC {(policy.coverage_amount || 0).toLocaleString()}</TableCell>
                            <TableCell className="text-sm">GHC {(policy.premium || 0).toLocaleString()}</TableCell>
                            <TableCell className="text-xs text-slate-500">{policy.start_date ? format(new Date(policy.start_date), "MMM d, yyyy") : "—"} — {policy.end_date ? format(new Date(policy.end_date), "MMM d, yyyy") : "—"}</TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-1"><Badge variant="outline" className={statusColor(policy.status)}>{policy.status}</Badge>{expiryBadge(policy.end_date, policy.status)}</div>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => { setSelected(policy); setForm({ student_id: policy.student_id.toString(), provider_name: policy.provider_name, policy_number: policy.policy_number, coverage_amount: policy.coverage_amount.toString(), premium: policy.premium.toString(), start_date: policy.start_date ? policy.start_date.split("T")[0] : "", end_date: policy.end_date ? policy.end_date.split("T")[0] : "", status: policy.status, auto_renewal: !!policy.auto_renewal }); setFormOpen(true); }}><Pencil className="w-3 h-3" /></Button>
                                <Button size="sm" variant="ghost" className="h-7 text-xs text-red-600" onClick={() => { setDeleteId(policy.id); setDeleteOpen(true); }}><Trash2 className="w-3 h-3" /></Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                </TableBody>
              </Table>
            </div>
            {/* Mobile Cards */}
            <div className="md:hidden divide-y max-h-[500px] overflow-y-auto">
              {loading ? Array.from({ length: 3 }).map((_, i) => <div key={i} className="p-4"><Skeleton className="h-24" /></div>) :
                filtered.length === 0 ? <div className="text-center py-12 text-slate-400"><Shield className="w-10 h-10 mx-auto mb-2 opacity-50" /><p>No policies found</p></div> :
                  filtered.map(policy => {
                    const st = getStudent(policy.student_id);
                    const es = expiryStatus(policy.end_date, policy.status);
                    return (
                      <div key={policy.id} className={`p-4 space-y-2 ${es === "expired" ? "bg-red-50/50" : es === "expiring-soon" ? "bg-amber-50/50" : ""}`}>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <Avatar className="w-9 h-9"><AvatarFallback className="bg-emerald-100 text-emerald-700 text-xs font-semibold">{st?.name?.charAt(0) || "?"}</AvatarFallback></Avatar>
                            <div><p className="font-medium text-sm">{st?.name || `#${policy.student_id}`}</p><p className="text-xs text-slate-500">{policy.provider_name} · {policy.policy_number}</p></div>
                          </div>
                          {policy.auto_renewal === 1 && <RefreshCw className="w-4 h-4 text-teal-500" title="Auto-renewal" />}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="secondary" className="text-[10px]">GHC {(policy.coverage_amount || 0).toLocaleString()}</Badge>
                          <Badge variant="outline" className={statusColor(policy.status)}>{policy.status}</Badge>
                          {expiryBadge(policy.end_date, policy.status)}
                        </div>
                        <p className="text-xs text-slate-500 flex items-center gap-1"><Clock className="w-3 h-3" />{policy.start_date ? format(new Date(policy.start_date), "MMM d") : "—"} — {policy.end_date ? format(new Date(policy.end_date), "MMM d, yyyy") : "—"}</p>
                        <div className="flex gap-2 pt-1">
                          <Button variant="outline" size="sm" className="h-8 text-xs flex-1" onClick={() => { setSelected(policy); setForm({ student_id: policy.student_id.toString(), provider_name: policy.provider_name, policy_number: policy.policy_number, coverage_amount: policy.coverage_amount.toString(), premium: policy.premium.toString(), start_date: policy.start_date ? policy.start_date.split("T")[0] : "", end_date: policy.end_date ? policy.end_date.split("T")[0] : "", status: policy.status, auto_renewal: !!policy.auto_renewal }); setFormOpen(true); }}><Pencil className="w-3 h-3 mr-1" />Edit</Button>
                          <Button variant="outline" size="sm" className="h-8 text-xs text-red-500" onClick={() => { setDeleteId(policy.id); setDeleteOpen(true); }}><Trash2 className="w-3 h-3" /></Button>
                        </div>
                      </div>
                    );
                  })}
            </div>
          </div>
        </CardContent></Card>
      </main>

      {/* Form Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{selected ? "Edit Policy" : "Add Insurance Policy"}</DialogTitle><DialogDescription>Enter student insurance policy details</DialogDescription></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2"><Label>Student *</Label>
              <Input placeholder="Search students..." value={studentSearch} onChange={e => setStudentSearch(e.target.value)} />
              <Select value={form.student_id} onValueChange={v => setForm({ ...form, student_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
                <SelectContent className="max-h-60"><SelectItem value="none">Choose student...</SelectItem>{filteredStudents.slice(0, 50).map(s => <SelectItem key={s.student_id} value={s.student_id.toString()}>{s.name} ({s.student_code})</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2"><Label>Provider Name *</Label><Input value={form.provider_name} onChange={e => setForm({ ...form, provider_name: e.target.value })} placeholder="e.g., GNIC" /></div>
              <div className="grid gap-2"><Label>Policy Number *</Label><Input value={form.policy_number} onChange={e => setForm({ ...form, policy_number: e.target.value })} placeholder="POL-001" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2"><Label>Coverage Amount</Label><Input type="number" step="0.01" value={form.coverage_amount} onChange={e => setForm({ ...form, coverage_amount: e.target.value })} placeholder="0.00" /></div>
              <div className="grid gap-2"><Label>Premium</Label><Input type="number" step="0.01" value={form.premium} onChange={e => setForm({ ...form, premium: e.target.value })} placeholder="0.00" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2"><Label>Start Date *</Label><Input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} /></div>
              <div className="grid gap-2"><Label>End Date *</Label><Input type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2"><Label>Status</Label>
                <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Active">Active</SelectItem><SelectItem value="Expired">Expired</SelectItem><SelectItem value="Cancelled">Cancelled</SelectItem></SelectContent></Select>
              </div>
              <div className="flex items-center space-x-2 pt-6"><Checkbox checked={form.auto_renewal} onCheckedChange={c => setForm({ ...form, auto_renewal: !!c })} /><Label className="text-sm font-normal">Auto-renewal</Label></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700" disabled={!form.student_id || !form.provider_name.trim()}>{selected ? "Update" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete Policy</AlertDialogTitle><AlertDialogDescription>Are you sure? This action cannot be undone.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>

      <footer className="bg-white border-t border-slate-200 py-4 mt-auto"><div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center"><p className="text-xs text-slate-400">&copy; {new Date().getFullYear()} School Manager</p></div></footer>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: number | string; color: string }) {
  const colors: Record<string, string> = { emerald: "bg-emerald-100 text-emerald-600", teal: "bg-teal-100 text-teal-600", amber: "bg-amber-100 text-amber-600", sky: "bg-sky-100 text-sky-600" };
  return <Card className="border-slate-200/60"><CardContent className="p-4"><div className={`w-8 h-8 rounded-lg ${colors[color]} flex items-center justify-center mb-2`}><Icon className="w-4 h-4" /></div><p className="text-xl font-bold text-slate-900">{value}</p><p className="text-xs text-slate-500">{label}</p></CardContent></Card>;
}
