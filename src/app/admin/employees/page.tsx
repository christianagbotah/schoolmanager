'use client';

import { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
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
import { format } from 'date-fns';
import {
  UserCog, Plus, Search, Pencil, Trash2, Building2, Briefcase, Eye, Users,
  AlertCircle, RefreshCw, DollarSign, X, Mail, Phone, Calendar, Venus, Mars,
  Download, Filter, UserPlus,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

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
      <div className="flex flex-col lg:flex-row gap-3">
        <Skeleton className="h-11 flex-1 rounded-lg" />
        <div className="flex gap-2">
          <Skeleton className="h-11 w-48 rounded-lg hidden lg:block" />
          <Skeleton className="h-11 w-36 rounded-lg hidden lg:block" />
        </div>
      </div>
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/60 p-4 sm:p-6">
      <div className="space-y-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-lg" />
        ))}
      </div>
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

// ─── Info Item ───────────────────────────────────────────────────────────────

function InfoItem({ label, value, icon: Icon }: { label: string; value?: string | null; icon?: React.ElementType }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50/80">
      {Icon && (
        <div className="w-8 h-8 rounded-lg bg-white border border-slate-200/60 flex items-center justify-center flex-shrink-0">
          <Icon className="w-4 h-4 text-slate-400" />
        </div>
      )}
      <div className="min-w-0">
        <p className="text-xs text-slate-400">{label}</p>
        <p className="font-medium text-sm text-slate-800 truncate">{value || '\u2014'}</p>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [saving, setSaving] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null);

  const [form, setForm] = useState({
    emp_id: '', name: '', designation_id: '', department_id: '',
    email: '', phone: '', birthday: '', sex: '', hire_date: '', salary: '', active_status: true,
  });

  // ─── Active filters ────────────────────────────────────────────────────────

  const activeFilters = [
    filterDept ? { key: 'dept', label: `Dept: ${departments.find(d => d.id.toString() === filterDept)?.dep_name || filterDept}` } : null,
    filterStatus ? { key: 'status', label: `Status: ${filterStatus === '1' ? 'Active' : 'Inactive'}` } : null,
  ].filter(Boolean) as { key: string; label: string }[];

  const clearFilter = (key: string) => {
    if (key === 'dept') setFilterDept('');
    if (key === 'status') setFilterStatus('');
  };

  const clearAllFilters = () => {
    setFilterDept('');
    setFilterStatus('');
    setSearch('');
  };

  // ─── Data fetching ─────────────────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (filterDept) params.set('department_id', filterDept);
      if (filterStatus) params.set('status', filterStatus);

      const [empRes, deptRes, desigRes] = await Promise.all([
        fetch(`/api/employees?${params}`),
        fetch('/api/departments'),
        fetch('/api/designations'),
      ]);
      if (!empRes.ok) throw new Error('Failed to load employees');
      setEmployees(await empRes.json());
      setDepartments(await deptRes.json());
      setDesignations(await desigRes.json());
    } catch {
      setError('Failed to load employee data');
    }
    setLoading(false);
  }, [search, filterDept, filterStatus]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ─── Computed stats ────────────────────────────────────────────────────────

  const activeCount = employees.filter(e => e.active_status === 1).length;
  const inactiveCount = employees.filter(e => e.active_status === 0).length;
  const totalSalary = employees.filter(e => e.active_status === 1).reduce((s, e) => s + e.salary, 0);
  const maleCount = employees.filter(e => e.sex === 'Male').length;
  const femaleCount = employees.filter(e => e.sex === 'Female').length;

  // ─── Form handlers ─────────────────────────────────────────────────────────

  const openCreate = () => {
    setSelectedEmp(null);
    setForm({ emp_id: '', name: '', designation_id: '', department_id: '', email: '', phone: '', birthday: '', sex: '', hire_date: '', salary: '', active_status: true });
    setFormOpen(true);
  };

  const openEdit = (e: Employee) => {
    setSelectedEmp(e);
    setForm({
      emp_id: e.emp_id, name: e.name, designation_id: e.designation_id?.toString() || '',
      department_id: e.department_id?.toString() || '', email: e.email, phone: e.phone,
      birthday: e.birthday ? e.birthday.split('T')[0] : '', sex: e.sex,
      hire_date: e.hire_date ? e.hire_date.split('T')[0] : '',
      salary: e.salary.toString(), active_status: e.active_status === 1,
    });
    setFormOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Name is required'); return; }
    setSaving(true);
    try {
      const url = selectedEmp ? `/api/employees?id=${selectedEmp.id}` : '/api/employees';
      const method = selectedEmp ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      if (!res.ok) throw new Error();
      toast.success(selectedEmp ? 'Employee updated' : 'Employee created');
      setFormOpen(false);
      fetchData();
    } catch {
      toast.error('Error saving employee');
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!selectedEmp) return;
    try {
      await fetch(`/api/employees?id=${selectedEmp.id}`, { method: 'DELETE' });
      toast.success(`${selectedEmp.name} deleted`);
      setDeleteOpen(false);
      fetchData();
    } catch {
      toast.error('Error deleting employee');
    }
  };

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const handleExportCSV = () => {
    const headers = ['ID', 'Name', 'Department', 'Designation', 'Email', 'Phone', 'Gender', 'Salary', 'Status', 'Hire Date'];
    const rows = employees.map(e => [
      e.emp_id, e.name, e.department?.dep_name || '', e.designation?.des_name || '',
      e.email, e.phone, e.sex, e.salary.toString(), e.active_status === 1 ? 'Active' : 'Inactive',
      e.hire_date ? new Date(e.hire_date).toLocaleDateString() : '',
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `employees-${new Date().toISOString().split('T')[0]}.csv`;
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
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-72" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-11 w-28 rounded-lg" />
              <Skeleton className="h-11 w-36 rounded-lg" />
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <StatCardSkeleton /><StatCardSkeleton /><StatCardSkeleton /><StatCardSkeleton />
          </div>
          <FilterBarSkeleton />
          <TableSkeleton />
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
              Employees
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Staff management, departments and payroll
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
              <UserPlus className="w-4 h-4 mr-2" />
              Add Employee
            </Button>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════
            Quick Stats Row
            ═══════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <StatCard
            icon={Users}
            label="Total Staff"
            value={employees.length}
            subValue={`${activeCount} active, ${inactiveCount} inactive`}
            iconBg="bg-emerald-500"
            borderColor="#10b981"
          />
          <StatCard
            icon={UserCog}
            label="Active"
            value={activeCount}
            subValue={employees.length > 0 ? `${Math.round((activeCount / employees.length) * 100)}% of total` : undefined}
            iconBg="bg-sky-500"
            borderColor="#0ea5e9"
          />
          <StatCard
            icon={Building2}
            label="Departments"
            value={departments.length}
            subValue={`${designations.length} designations`}
            iconBg="bg-amber-500"
            borderColor="#f59e0b"
          />
          <StatCard
            icon={DollarSign}
            label="Monthly Payroll"
            value={`GHS ${totalSalary.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
            subValue={`Male ${maleCount} / Female ${femaleCount}`}
            iconBg="bg-violet-500"
            borderColor="#8b5cf6"
          />
        </div>

        {/* ═══════════════════════════════════════════════════════
            Error State
            ═══════════════════════════════════════════════════════ */}
        {error && (
          <div className="bg-white rounded-2xl border border-red-200 p-6 flex flex-col items-center text-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center">
              <AlertCircle className="w-7 h-7 text-red-500" />
            </div>
            <div>
              <p className="font-semibold text-slate-900">{error}</p>
              <p className="text-xs text-slate-500 mt-1">Check your connection and try again</p>
            </div>
            <Button variant="outline" onClick={fetchData} className="mt-1 border-emerald-200 text-emerald-700 hover:bg-emerald-50 min-h-[44px]">
              <RefreshCw className="w-4 h-4 mr-2" /> Retry
            </Button>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════
            Filter Bar
            ═══════════════════════════════════════════════════════ */}
        <div className="bg-white rounded-2xl border border-slate-200/60 p-4">
          <div className="flex flex-col lg:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search by name, ID, or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 min-h-[44px] bg-slate-50 border-slate-200 focus:bg-white"
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

            {/* Desktop Filters */}
            <div className="hidden lg:flex gap-2">
              <Select
                value={filterDept}
                onValueChange={(v) => (v === '__all__' ? setFilterDept('') : setFilterDept(v))}
              >
                <SelectTrigger className="w-48 min-h-[44px]">
                  <SelectValue placeholder="All Departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All Departments</SelectItem>
                  {departments.map(d => (
                    <SelectItem key={d.id} value={d.id.toString()}>{d.dep_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={filterStatus}
                onValueChange={(v) => (v === '__all__' ? setFilterStatus('') : setFilterStatus(v))}
              >
                <SelectTrigger className="w-36 min-h-[44px]">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All Status</SelectItem>
                  <SelectItem value="1">Active</SelectItem>
                  <SelectItem value="0">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Active filter chips */}
          {activeFilters.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              {activeFilters.map(f => (
                <Badge
                  key={f.key}
                  variant="outline"
                  className="bg-slate-50 border-slate-200 text-slate-700 text-xs pr-1 gap-1"
                >
                  {f.label}
                  <button
                    onClick={() => clearFilter(f.key)}
                    className="ml-0.5 w-4 h-4 rounded-full hover:bg-slate-200 inline-flex items-center justify-center transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
              <button
                onClick={clearAllFilters}
                className="text-xs text-slate-500 hover:text-slate-700 underline-offset-2 hover:underline transition-colors"
              >
                Clear all
              </button>
            </div>
          )}

          {/* Mobile Filter Chips */}
          <div className="flex flex-wrap gap-2 mt-3 lg:hidden">
            <Select
              value={filterDept}
              onValueChange={(v) => (v === '__all__' ? setFilterDept('') : setFilterDept(v))}
            >
              <SelectTrigger className="h-9 w-auto text-xs rounded-full border-slate-200">
                <Building2 className="w-3.5 h-3.5 mr-1 text-slate-400" />
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All Departments</SelectItem>
                {departments.map(d => (
                  <SelectItem key={d.id} value={d.id.toString()}>{d.dep_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filterStatus}
              onValueChange={(v) => (v === '__all__' ? setFilterStatus('') : setFilterStatus(v))}
            >
              <SelectTrigger className="h-9 w-auto text-xs rounded-full border-slate-200">
                <UserCog className="w-3.5 h-3.5 mr-1 text-slate-400" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All Status</SelectItem>
                <SelectItem value="1">Active</SelectItem>
                <SelectItem value="0">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════
            Data Table / Mobile Card View
            ═══════════════════════════════════════════════════════ */}
        <div className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden">
          {/* Results header */}
          {employees.length > 0 && (
            <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-slate-100 bg-slate-50/50">
              <p className="text-xs font-medium text-slate-500">
                Showing {employees.length} of {employees.length} employees
              </p>
            </div>
          )}

          {/* Desktop Table View */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 hover:bg-slate-50">
                  <TableHead className="text-xs font-semibold text-slate-600">Employee</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-600">Department</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-600">Designation</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-600 hidden xl:table-cell">Gender</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-600 hidden lg:table-cell">Contact</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-600 text-right">Salary</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-600">Status</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-600 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-20 text-slate-400">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center">
                          <Users className="w-8 h-8 text-slate-400" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-500 text-base">No employees found</p>
                          <p className="text-xs text-slate-400 mt-1">
                            {search || filterDept || filterStatus
                              ? 'Try adjusting your search or filters'
                              : 'Add your first employee to get started'}
                          </p>
                        </div>
                        {!search && !filterDept && !filterStatus && (
                          <Button
                            onClick={openCreate}
                            variant="outline"
                            className="mt-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50 min-h-[44px]"
                          >
                            <UserPlus className="w-4 h-4 mr-2" />
                            Add Employee
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  employees.map(emp => (
                    <TableRow
                      key={emp.id}
                      className={`hover:bg-slate-50/50 transition-colors ${emp.active_status === 0 ? 'opacity-60' : ''}`}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white bg-gradient-to-br from-emerald-500 to-emerald-700 flex-shrink-0">
                            {getInitials(emp.name)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-sm text-slate-900 truncate">{emp.name}</p>
                            <p className="text-xs text-slate-500 font-mono">{emp.emp_id}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {emp.department ? (
                          <Badge variant="outline" className="text-xs border-slate-200 text-slate-700">{emp.department.dep_name}</Badge>
                        ) : (
                          <span className="text-sm text-slate-400">{'\u2014'}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-slate-700">{emp.designation?.des_name || '\u2014'}</TableCell>
                      <TableCell className="hidden xl:table-cell">
                        <span className="inline-flex items-center gap-1 text-xs text-slate-600">
                          {emp.sex === 'Male' ? <Mars className="w-3 h-3 text-blue-500" /> : emp.sex === 'Female' ? <Venus className="w-3 h-3 text-pink-500" /> : null}
                          {emp.sex}
                        </span>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <div>
                          <p className="text-sm text-slate-700 truncate">{emp.email || '\u2014'}</p>
                          <p className="text-xs text-slate-400">{emp.phone || ''}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-sm font-semibold text-slate-900 tabular-nums">
                        GHS {emp.salary.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={emp.active_status === 1
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700 text-xs'
                            : 'border-slate-200 bg-slate-50 text-slate-600 text-xs'
                          }
                        >
                          {emp.active_status === 1 ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 min-w-[32px]"
                            onClick={() => { setSelectedEmp(emp); setProfileOpen(true); }}
                            title="View Profile"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 min-w-[32px]"
                            onClick={() => openEdit(emp)}
                            title="Edit"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 min-w-[32px] text-red-500 hover:text-red-600 hover:bg-red-50"
                            onClick={() => { setSelectedEmp(emp); setDeleteOpen(true); }}
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden divide-y divide-slate-100">
            {employees.length === 0 ? (
              <div className="text-center py-20 text-slate-400">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center">
                    <Users className="w-8 h-8 text-slate-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-500 text-base">No employees found</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {search || filterDept || filterStatus
                        ? 'Try adjusting your filters'
                        : 'Add your first employee'}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              employees.map(emp => (
                <div key={emp.id} className={`p-4 space-y-3 ${emp.active_status === 0 ? 'opacity-60' : ''}`}>
                  {/* Employee header */}
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-bold text-white bg-gradient-to-br from-emerald-500 to-emerald-700">
                      {getInitials(emp.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-semibold text-sm text-slate-900 truncate">{emp.name}</p>
                          <p className="text-xs text-slate-500 font-mono">{emp.emp_id}</p>
                        </div>
                        <Badge
                          variant="outline"
                          className={emp.active_status === 1
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700 text-xs'
                            : 'border-slate-200 bg-slate-50 text-slate-600 text-xs'
                          }
                        >
                          {emp.active_status === 1 ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      {/* Info grid */}
                      <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-slate-500">
                        {emp.department && (
                          <p className="flex items-center gap-1.5">
                            <Building2 className="w-3 h-3 text-slate-400" />
                            <span className="truncate">{emp.department.dep_name}</span>
                          </p>
                        )}
                        {emp.designation && (
                          <p className="flex items-center gap-1.5">
                            <Briefcase className="w-3 h-3 text-slate-400" />
                            <span className="truncate">{emp.designation.des_name}</span>
                          </p>
                        )}
                        {emp.email && (
                          <p className="flex items-center gap-1.5 truncate">
                            <Mail className="w-3 h-3 text-slate-400" />
                            <span className="truncate">{emp.email}</span>
                          </p>
                        )}
                        {emp.phone && (
                          <p className="flex items-center gap-1.5">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{emp.phone}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Salary and actions */}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-sm font-semibold text-emerald-700 tabular-nums">
                      GHS {emp.salary.toLocaleString()}
                    </span>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="min-h-[44px] min-w-[44px] text-xs"
                        onClick={() => { setSelectedEmp(emp); setProfileOpen(true); }}
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="outline"
                        className="min-h-[44px] min-w-[44px] text-xs"
                        onClick={() => openEdit(emp)}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="outline"
                        className="min-h-[44px] min-w-[44px] text-xs text-red-600 border-red-200 hover:bg-red-50"
                        onClick={() => { setSelectedEmp(emp); setDeleteOpen(true); }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          Form Dialog (Add / Edit)
          ═══════════════════════════════════════════════════════ */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                <UserCog className="w-4 h-4 text-emerald-600" />
              </div>
              {selectedEmp ? 'Edit Employee' : 'Add Employee'}
            </DialogTitle>
            <DialogDescription>
              {selectedEmp ? 'Update employee information below' : 'Fill in the details to create a new staff member'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label className="text-xs font-medium">Full Name <span className="text-red-500">*</span></Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Enter full name"
                className="min-h-[44px]"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label className="text-xs font-medium">Email</Label>
                <Input
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="email@example.com"
                  className="min-h-[44px]"
                />
              </div>
              <div className="grid gap-2">
                <Label className="text-xs font-medium">Phone</Label>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="Phone number"
                  className="min-h-[44px]"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label className="text-xs font-medium">Department</Label>
                <Select value={form.department_id} onValueChange={(v) => setForm({ ...form, department_id: v === '__none__' ? '' : v })}>
                  <SelectTrigger className="min-h-[44px]">
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">None</SelectItem>
                    {departments.map(d => (
                      <SelectItem key={d.id} value={d.id.toString()}>{d.dep_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label className="text-xs font-medium">Designation</Label>
                <Select value={form.designation_id} onValueChange={(v) => setForm({ ...form, designation_id: v === '__none__' ? '' : v })}>
                  <SelectTrigger className="min-h-[44px]">
                    <SelectValue placeholder="Select designation" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">None</SelectItem>
                    {designations.map(d => (
                      <SelectItem key={d.id} value={d.id.toString()}>{d.des_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label className="text-xs font-medium">Gender</Label>
                <Select value={form.sex} onValueChange={(v) => setForm({ ...form, sex: v })}>
                  <SelectTrigger className="min-h-[44px]">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label className="text-xs font-medium">Birthday</Label>
                <Input
                  type="date"
                  value={form.birthday}
                  onChange={(e) => setForm({ ...form, birthday: e.target.value })}
                  className="min-h-[44px]"
                />
              </div>
              <div className="grid gap-2">
                <Label className="text-xs font-medium">Hire Date</Label>
                <Input
                  type="date"
                  value={form.hire_date}
                  onChange={(e) => setForm({ ...form, hire_date: e.target.value })}
                  className="min-h-[44px]"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label className="text-xs font-medium">Salary (GHS)</Label>
              <Input
                type="number"
                value={form.salary}
                onChange={(e) => setForm({ ...form, salary: e.target.value })}
                placeholder="Monthly salary"
                className="min-h-[44px]"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setFormOpen(false)} className="min-h-[44px]">Cancel</Button>
            <Button
              onClick={handleSave}
              className="bg-emerald-600 hover:bg-emerald-700 min-h-[44px]"
              disabled={!form.name.trim() || saving}
            >
              {saving ? 'Saving...' : selectedEmp ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════════════════════════════════
          View Profile Dialog
          ═══════════════════════════════════════════════════════ */}
      <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          {selectedEmp && (
            <>
              <DialogHeader>
                <DialogTitle>Employee Profile</DialogTitle>
                <DialogDescription>Detailed employee information</DialogDescription>
              </DialogHeader>
              <div className="flex flex-col items-center py-4">
                <div className="w-20 h-20 rounded-full flex items-center justify-center text-xl font-bold text-white bg-gradient-to-br from-emerald-500 to-emerald-700 mb-3">
                  {getInitials(selectedEmp.name)}
                </div>
                <h3 className="text-lg font-bold text-slate-900">{selectedEmp.name}</h3>
                <p className="text-sm text-slate-500 font-mono">{selectedEmp.emp_id}</p>
                <div className="flex gap-2 mt-2">
                  {selectedEmp.designation && (
                    <Badge className="bg-emerald-100 text-emerald-700 text-xs">{selectedEmp.designation.des_name}</Badge>
                  )}
                  <Badge
                    variant="outline"
                    className={selectedEmp.active_status === 1
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700 text-xs'
                      : 'border-slate-200 bg-slate-50 text-slate-600 text-xs'
                    }
                  >
                    {selectedEmp.active_status === 1 ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <InfoItem label="Email" value={selectedEmp.email} icon={Mail} />
                <InfoItem label="Phone" value={selectedEmp.phone} icon={Phone} />
                <InfoItem label="Gender" value={selectedEmp.sex} icon={selectedEmp.sex === 'Male' ? Mars : Venus} />
                <InfoItem label="Department" value={selectedEmp.department?.dep_name} icon={Building2} />
                <InfoItem label="Designation" value={selectedEmp.designation?.des_name} icon={Briefcase} />
                <InfoItem
                  label="Hire Date"
                  value={selectedEmp.hire_date ? format(new Date(selectedEmp.hire_date), 'MMM d, yyyy') : undefined}
                  icon={Calendar}
                />
                <InfoItem label="Birthday" value={selectedEmp.birthday ? format(new Date(selectedEmp.birthday), 'MMM d, yyyy') : undefined} icon={Calendar} />
                <InfoItem label="Monthly Salary" value={`GHS ${selectedEmp.salary.toLocaleString()}`} icon={DollarSign} />
              </div>
              <DialogFooter className="gap-2 sm:gap-0 mt-4">
                <Button variant="outline" onClick={() => setProfileOpen(false)} className="min-h-[44px]">Close</Button>
                <Button
                  onClick={() => { setProfileOpen(false); openEdit(selectedEmp); }}
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
                <Trash2 className="w-4 h-4 text-red-600" />
              </div>
              Delete Employee
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <p>
                  Are you sure you want to delete <strong>{selectedEmp?.name}</strong>?
                </p>
                <p className="text-amber-600 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  This will also delete all associated payroll records. This action cannot be undone.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="min-h-[44px]">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 min-h-[44px]">
              Delete Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
