"use client";

import { useState, useEffect, useCallback } from "react";
import {
  UserCog, Plus, Search, Pencil, Trash2, Building2, Briefcase, Eye, Users,
  AlertCircle, RefreshCw, DollarSign, X,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
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
import { format } from "date-fns";

interface Employee {
  id: number; emp_id: string; name: string; designation_id: number | null;
  department_id: number | null; email: string; phone: string;
  birthday: string | null; sex: string; hire_date: string | null;
  salary: number; active_status: number;
  department: { id: number; dep_name: string } | null;
  designation: { id: number; des_name: string } | null;
}
interface Department { id: number; dep_name: string; }
interface Designation { id: number; des_name: string; }

export default function EmployeesPage() {
  const { toast } = useToast();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filterDept, setFilterDept] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [saving, setSaving] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null);

  const [form, setForm] = useState({
    emp_id: "", name: "", designation_id: "", department_id: "",
    email: "", phone: "", birthday: "", sex: "", hire_date: "", salary: "", active_status: true,
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (filterDept !== "all") params.set("department_id", filterDept);
      if (filterStatus !== "all") params.set("status", filterStatus);

      const [empRes, deptRes, desigRes] = await Promise.all([
        fetch(`/api/employees?${params}`),
        fetch("/api/departments"),
        fetch("/api/designations"),
      ]);
      if (!empRes.ok) throw new Error("Failed to load employees");
      setEmployees(await empRes.json());
      setDepartments(await deptRes.json());
      setDesignations(await desigRes.json());
    } catch {
      setError("Failed to load employee data");
    }
    setLoading(false);
  }, [search, filterDept, filterStatus]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openCreate = () => {
    setSelectedEmp(null);
    setForm({ emp_id: "", name: "", designation_id: "", department_id: "", email: "", phone: "", birthday: "", sex: "", hire_date: "", salary: "", active_status: true });
    setFormOpen(true);
  };

  const openEdit = (e: Employee) => {
    setSelectedEmp(e);
    setForm({
      emp_id: e.emp_id, name: e.name, designation_id: e.designation_id?.toString() || "",
      department_id: e.department_id?.toString() || "", email: e.email, phone: e.phone,
      birthday: e.birthday ? e.birthday.split("T")[0] : "", sex: e.sex,
      hire_date: e.hire_date ? e.hire_date.split("T")[0] : "",
      salary: e.salary.toString(), active_status: e.active_status === 1,
    });
    setFormOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast({ title: "Name is required", variant: "destructive" }); return; }
    setSaving(true);
    try {
      const url = selectedEmp ? `/api/employees?id=${selectedEmp.id}` : "/api/employees";
      const method = selectedEmp ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (!res.ok) throw new Error();
      toast({ title: "Success", description: selectedEmp ? "Employee updated" : "Employee created" });
      setFormOpen(false);
      fetchData();
    } catch {
      toast({ title: "Error saving employee", variant: "destructive" });
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!selectedEmp) return;
    try {
      await fetch(`/api/employees?id=${selectedEmp.id}`, { method: "DELETE" });
      toast({ title: "Success", description: `${selectedEmp.name} deleted` });
      setDeleteOpen(false);
      fetchData();
    } catch {
      toast({ title: "Error deleting employee", variant: "destructive" });
    }
  };

  const getInitials = (name: string) => name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  const totalSalary = employees.filter(e => e.active_status === 1).reduce((s, e) => s + e.salary, 0);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center"><UserCog className="w-6 h-6" /></div>
              <div><h1 className="text-lg font-bold">Employees</h1><p className="text-emerald-200 text-xs hidden sm:block">Staff Management</p></div>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {loading ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />) : (
            <>
              <StatCard icon={Users} label="Total Staff" value={employees.length} color="emerald" />
              <StatCard icon={UserCog} label="Active" value={employees.filter(e => e.active_status === 1).length} color="sky" />
              <StatCard icon={Building2} label="Departments" value={departments.length} color="amber" />
              <StatCard icon={DollarSign} label="Monthly Payroll" value={`GHS ${totalSalary.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} color="violet" />
            </>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div className="flex flex-col sm:flex-row gap-3 flex-1">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input placeholder="Search by name, ID, or email..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 min-h-[44px]" />
              {search && <Button variant="ghost" size="sm" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0" onClick={() => setSearch("")}><X className="w-3 h-3" /></Button>}
            </div>
            <Select value={filterDept} onValueChange={setFilterDept}><SelectTrigger className="w-full sm:w-[160px] min-h-[44px]"><SelectValue placeholder="Department" /></SelectTrigger><SelectContent><SelectItem value="all">All Depts</SelectItem>{departments.map(d => <SelectItem key={d.id} value={d.id.toString()}>{d.dep_name}</SelectItem>)}</SelectContent></Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}><SelectTrigger className="w-full sm:w-[120px] min-h-[44px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem><SelectItem value="1">Active</SelectItem><SelectItem value="0">Inactive</SelectItem></SelectContent></Select>
          </div>
          <Button onClick={openCreate} className="bg-emerald-600 hover:bg-emerald-700 min-h-[44px]"><Plus className="w-4 h-4 mr-2" /> Add Employee</Button>
        </div>

        {/* Error State */}
        {error && (
          <Card className="border-red-200 mb-4"><CardContent className="p-6 flex flex-col items-center text-center">
            <AlertCircle className="w-10 h-10 text-red-500 mb-3" />
            <p className="font-medium text-slate-900">{error}</p>
            <Button variant="outline" className="mt-3" onClick={fetchData}><RefreshCw className="w-4 h-4 mr-2" /> Retry</Button>
          </CardContent></Card>
        )}

        {/* Table / Cards */}
        <Card className="border-slate-200/60"><CardContent className="p-0">
          <div className="max-h-[500px] overflow-y-auto">
            {/* Desktop Table */}
            <div className="hidden md:block">
              <Table>
                <TableHeader><TableRow className="bg-slate-50"><TableHead>Employee</TableHead><TableHead>Department</TableHead><TableHead>Designation</TableHead><TableHead className="text-right">Salary</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                <TableBody>
                  {loading ? Array.from({ length: 5 }).map((_, i) => <TableRow key={i}><TableCell colSpan={6}><Skeleton className="h-8" /></TableCell></TableRow>) :
                    employees.length === 0 ? <TableRow><TableCell colSpan={6} className="text-center text-slate-400 py-8">No employees found</TableCell></TableRow> :
                      employees.map(emp => (
                        <TableRow key={emp.id} className={emp.active_status === 0 ? "opacity-60" : ""}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="w-9 h-9"><AvatarFallback className="bg-emerald-100 text-emerald-700 text-xs font-semibold">{getInitials(emp.name)}</AvatarFallback></Avatar>
                              <div><p className="font-medium text-sm">{emp.name}</p><p className="text-xs text-slate-500">{emp.emp_id}</p></div>
                            </div>
                          </TableCell>
                          <TableCell><Badge variant="outline" className="text-xs">{emp.department?.dep_name || "—"}</Badge></TableCell>
                          <TableCell className="text-sm">{emp.designation?.des_name || "—"}</TableCell>
                          <TableCell className="text-right text-sm font-medium">GHS {emp.salary.toLocaleString()}</TableCell>
                          <TableCell><Badge className={emp.active_status === 1 ? "bg-emerald-100 text-emerald-700 text-xs" : "bg-red-100 text-red-700 text-xs"}>{emp.active_status === 1 ? "Active" : "Inactive"}</Badge></TableCell>
                          <TableCell>
                            <div className="flex gap-1 justify-end">
                              <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => { setSelectedEmp(emp); setProfileOpen(true); }}><Eye className="w-3 h-3 mr-1" />View</Button>
                              <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => openEdit(emp)}><Pencil className="w-3 h-3 mr-1" />Edit</Button>
                              <Button size="sm" variant="ghost" className="h-8 text-xs text-red-600" onClick={() => { setSelectedEmp(emp); setDeleteOpen(true); }}><Trash2 className="w-3 h-3" /></Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y">
              {loading ? Array.from({ length: 3 }).map((_, i) => <div key={i} className="p-4"><Skeleton className="h-20 rounded-lg" /></div>) :
                employees.length === 0 ? <div className="text-center py-12 text-slate-400"><Users className="w-10 h-10 mx-auto mb-2 opacity-50" /><p>No employees found</p></div> :
                  employees.map(emp => (
                    <div key={emp.id} className={`p-4 space-y-3 ${emp.active_status === 0 ? "opacity-60" : ""}`}>
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10"><AvatarFallback className="bg-emerald-100 text-emerald-700 text-sm font-semibold">{getInitials(emp.name)}</AvatarFallback></Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{emp.name}</p>
                          <p className="text-xs text-slate-500">{emp.emp_id}</p>
                        </div>
                        <Badge className={emp.active_status === 1 ? "bg-emerald-100 text-emerald-700 text-xs" : "bg-red-100 text-red-700 text-xs"}>{emp.active_status === 1 ? "Active" : "Inactive"}</Badge>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {emp.department && <Badge variant="outline" className="text-[10px]">{emp.department.dep_name}</Badge>}
                        {emp.designation && <Badge variant="outline" className="text-[10px]">{emp.designation.des_name}</Badge>}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-emerald-700">GHS {emp.salary.toLocaleString()}</span>
                        <div className="flex gap-1">
                          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => { setSelectedEmp(emp); setProfileOpen(true); }}><Eye className="w-3 h-3" /></Button>
                          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => openEdit(emp)}><Pencil className="w-3 h-3" /></Button>
                          <Button variant="outline" size="sm" className="h-8 text-xs text-red-500" onClick={() => { setSelectedEmp(emp); setDeleteOpen(true); }}><Trash2 className="w-3 h-3" /></Button>
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
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{selectedEmp ? "Edit Employee" : "Add Employee"}</DialogTitle><DialogDescription>{selectedEmp ? "Update employee information" : "Create a new staff member"}</DialogDescription></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2"><Label>Full Name *</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Enter full name" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2"><Label>Email</Label><Input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="email@example.com" /></div>
              <div className="grid gap-2"><Label>Phone</Label><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="Phone number" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2"><Label>Department</Label><Select value={form.department_id} onValueChange={v => setForm({ ...form, department_id: v })}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent><SelectItem value="none">None</SelectItem>{departments.map(d => <SelectItem key={d.id} value={d.id.toString()}>{d.dep_name}</SelectItem>)}</SelectContent></Select></div>
              <div className="grid gap-2"><Label>Designation</Label><Select value={form.designation_id} onValueChange={v => setForm({ ...form, designation_id: v })}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent><SelectItem value="none">None</SelectItem>{designations.map(d => <SelectItem key={d.id} value={d.id.toString()}>{d.des_name}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2"><Label>Gender</Label><Select value={form.sex} onValueChange={v => setForm({ ...form, sex: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Male">Male</SelectItem><SelectItem value="Female">Female</SelectItem></SelectContent></Select></div>
              <div className="grid gap-2"><Label>Birthday</Label><Input type="date" value={form.birthday} onChange={e => setForm({ ...form, birthday: e.target.value })} /></div>
              <div className="grid gap-2"><Label>Hire Date</Label><Input type="date" value={form.hire_date} onChange={e => setForm({ ...form, hire_date: e.target.value })} /></div>
            </div>
            <div className="grid gap-2"><Label>Salary (GHS)</Label><Input type="number" value={form.salary} onChange={e => setForm({ ...form, salary: e.target.value })} placeholder="Monthly salary" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700" disabled={!form.name.trim() || saving}>{saving ? "Saving..." : selectedEmp ? "Update" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Profile Dialog */}
      <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
        <DialogContent className="max-w-lg">
          {selectedEmp && <>
            <DialogHeader><DialogTitle>Employee Profile</DialogTitle></DialogHeader>
            <div className="flex flex-col items-center py-4">
              <Avatar className="w-20 h-20 mb-4"><AvatarFallback className="bg-emerald-100 text-emerald-700 text-xl font-bold">{getInitials(selectedEmp.name)}</AvatarFallback></Avatar>
              <h3 className="text-xl font-bold">{selectedEmp.name}</h3>
              <p className="text-sm text-slate-500">{selectedEmp.emp_id}</p>
              {selectedEmp.designation && <Badge className="mt-2 bg-emerald-100 text-emerald-700">{selectedEmp.designation.des_name}</Badge>}
              <Badge className={selectedEmp.active_status === 1 ? "mt-1 bg-sky-100 text-sky-700" : "mt-1 bg-red-100 text-red-700"}>{selectedEmp.active_status === 1 ? "Active" : "Inactive"}</Badge>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <InfoItem label="Email" value={selectedEmp.email} /><InfoItem label="Phone" value={selectedEmp.phone} />
              <InfoItem label="Gender" value={selectedEmp.sex} /><InfoItem label="Department" value={selectedEmp.department?.dep_name} />
              <InfoItem label="Salary" value={`GHS ${selectedEmp.salary.toLocaleString()}`} />
              <InfoItem label="Hire Date" value={selectedEmp.hire_date ? format(new Date(selectedEmp.hire_date), "MMM d, yyyy") : ""} />
            </div>
          </>}
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete Employee</AlertDialogTitle><AlertDialogDescription>Are you sure you want to delete <strong>{selectedEmp?.name}</strong>? This will also delete all associated payroll records. This action cannot be undone.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">Delete Permanently</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>

      <footer className="bg-white border-t border-slate-200 py-4 mt-auto"><div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center"><p className="text-xs text-slate-400">&copy; {new Date().getFullYear()} School Manager</p></div></footer>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: string | number; color: string }) {
  const iconBg: Record<string, string> = { emerald: "bg-emerald-100 text-emerald-600", sky: "bg-sky-100 text-sky-600", amber: "bg-amber-100 text-amber-600", violet: "bg-violet-100 text-violet-600" };
  return (<Card className="border-slate-200/60"><CardContent className="p-4"><div className={`w-8 h-8 rounded-lg ${iconBg[color]} flex items-center justify-center mb-2`}><Icon className="w-4 h-4" /></div><p className="text-lg font-bold text-slate-900">{value}</p><p className="text-xs text-slate-500">{label}</p></CardContent></Card>);
}

function InfoItem({ label, value }: { label: string; value?: string | null }) {
  return (<div className="p-3 rounded-lg bg-slate-50"><p className="text-xs text-slate-500">{label}</p><p className="font-medium">{value || "—"}</p></div>);
}
