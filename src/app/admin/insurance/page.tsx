"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Shield, Plus, Pencil, Trash2, Search, X, AlertTriangle, RefreshCw, Users, DollarSign, Clock,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
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
import { toast } from "sonner";
import { format, differenceInDays } from "date-fns";

// ─── Types ───────────────────────────────────────────────────────────────────

interface InsurancePolicy {
  id: number; student_id: number; provider_name: string; policy_number: string;
  coverage_amount: number; premium: number; start_date: string | null;
  end_date: string | null; status: string; auto_renewal: number; created_at: string;
}
interface Student { student_id: number; name: string; student_code: string; sex: string; active_status?: number; }

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

function TableSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/60 p-4 sm:p-6">
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
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

// ─── Main Component ──────────────────────────────────────────────────────────

export default function InsurancePage() {
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
  const [saving, setSaving] = useState(false);

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
    } catch {
      toast.error("Failed to load insurance data");
    }
    setLoading(false);
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSave = async () => {
    if (!form.student_id || !form.provider_name.trim() || !form.policy_number.trim()) {
      toast.error("Student, provider, and policy number are required");
      return;
    }
    setSaving(true);
    try {
      const payload = selected
        ? { action: "update", id: selected.id, ...form }
        : { action: "create", ...form };
      await fetch("/api/admin/insurance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      toast.success(selected ? "Policy updated successfully" : "Policy created successfully");
      setFormOpen(false);
      fetchData();
    } catch {
      toast.error("Failed to save policy");
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await fetch(`/api/admin/insurance?id=${deleteId}`, { method: "DELETE" });
      toast.success("Policy deleted");
      setDeleteOpen(false);
      fetchData();
    } catch {
      toast.error("Failed to delete policy");
    }
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

  const clearAllFilters = () => {
    setSearch("");
    setFilterStatus("all");
  };

  const activeFilters = [
    filterStatus !== "all" ? { key: "status", label: `Status: ${filterStatus}` } : null,
  ].filter(Boolean) as { key: string; label: string }[];

  // ─── Loading State ─────────────────────────────────────────────────────────

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-5 sm:space-y-6">
          {/* Title skeleton */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1.5">
              <Skeleton className="h-8 w-52" />
              <Skeleton className="h-4 w-72" />
            </div>
            <Skeleton className="h-11 w-36 rounded-lg" />
          </div>

          {/* Stat cards skeleton */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </div>

          {/* Filter bar skeleton */}
          <div className="bg-white rounded-2xl border border-slate-200/60 p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <Skeleton className="h-11 flex-1 rounded-lg" />
              <Skeleton className="h-11 w-44 rounded-lg" />
            </div>
          </div>

          {/* Table skeleton */}
          <TableSkeleton />
        </div>
      </DashboardLayout>
    );
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <DashboardLayout>
      <div className="space-y-5 sm:space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Insurance Management
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Student insurance policies &amp; coverage tracking
            </p>
          </div>
          <Button
            onClick={() => {
              setSelected(null);
              setForm({ student_id: "", provider_name: "", policy_number: "", coverage_amount: "", premium: "", start_date: "", end_date: "", status: "Active", auto_renewal: false });
              setStudentSearch("");
              setFormOpen(true);
            }}
            className="bg-emerald-600 hover:bg-emerald-700 min-h-[44px]"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Policy
          </Button>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <StatCard
            icon={Users}
            label="Total Insured"
            value={totalInsured}
            subValue={`${students.length} students enrolled`}
            iconBg="bg-emerald-500"
            borderColor="#10b981"
          />
          <StatCard
            icon={Shield}
            label="Active Policies"
            value={activePolicies}
            subValue={totalInsured > 0 ? `${Math.round((activePolicies / totalInsured) * 100)}% active` : undefined}
            iconBg="bg-teal-500"
            borderColor="#14b8a6"
          />
          <StatCard
            icon={AlertTriangle}
            label="Expiring Soon"
            value={expiringSoon}
            subValue={expiringSoon > 0 ? "Within 30 days" : "No expiring policies"}
            iconBg="bg-amber-500"
            borderColor="#f59e0b"
          />
          <StatCard
            icon={DollarSign}
            label="Total Coverage"
            value={`GHC ${(totalCoverage || 0).toLocaleString()}`}
            subValue={`${activePolicies} active policies`}
            iconBg="bg-sky-500"
            borderColor="#0ea5e9"
          />
        </div>

        {/* Expiry warnings */}
        {!loading && policies.some(p => expiryStatus(p.end_date, p.status) !== "normal") && (
          <div className="bg-amber-50 rounded-2xl border border-amber-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span className="text-sm font-semibold text-amber-800">Attention Required</span>
            </div>
            <div className="space-y-1">
              {policies.filter(p => expiryStatus(p.end_date, p.status) === "expired").map(p => (
                <p key={p.id} className="text-xs text-red-700">
                  <span className="font-medium">{getStudentName(p.student_id)}</span> — Policy {p.policy_number} has <strong>expired</strong>
                  {p.end_date ? ` (${format(new Date(p.end_date), "MMM d, yyyy")})` : ""}
                </p>
              ))}
              {policies.filter(p => expiryStatus(p.end_date, p.status) === "expiring-soon").map(p => (
                <p key={p.id} className="text-xs text-amber-700">
                  <span className="font-medium">{getStudentName(p.student_id)}</span> — Policy {p.policy_number} expires in {p.end_date ? `${differenceInDays(new Date(p.end_date), now)} days` : "unknown"}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Filter Bar */}
        <div className="bg-white rounded-2xl border border-slate-200/60 p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search by student, provider, or policy..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-10 min-h-[44px]"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full hover:bg-slate-200 flex items-center justify-center"
                >
                  <X className="w-3 h-3 text-slate-400" />
                </button>
              )}
            </div>
            {/* Status Filter */}
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-44 min-h-[44px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All Status</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Expired">Expired</SelectItem>
                <SelectItem value="Cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Active filter chips */}
          {activeFilters.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mt-3">
              {activeFilters.map(f => (
                <Badge
                  key={f.key}
                  variant="outline"
                  className="bg-slate-50 border-slate-200 text-slate-700 text-xs pr-1 gap-1"
                >
                  {f.label}
                  <button
                    onClick={() => { if (f.key === "status") setFilterStatus("all"); }}
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
        </div>

        {/* Data Table / Mobile Cards */}
        <div className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden">
          {/* Results header */}
          {!loading && filtered.length > 0 && (
            <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-slate-100 bg-slate-50/50">
              <p className="text-xs font-medium text-slate-500">
                Showing {filtered.length} of {policies.length} policies
              </p>
            </div>
          )}

          {/* Desktop Table View */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 hover:bg-slate-50">
                  <TableHead className="text-xs font-semibold text-slate-600">Student</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-600">Provider</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-600">Policy #</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-600">Coverage</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-600">Premium</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-600">Period</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-600">Status</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-600 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-20 text-slate-400">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center">
                          <Shield className="w-8 h-8 text-slate-400" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-500 text-base">No policies found</p>
                          <p className="text-xs text-slate-400 mt-1">
                            {search || filterStatus !== "all"
                              ? "Try adjusting your search or filters"
                              : "Add your first insurance policy to get started"}
                          </p>
                        </div>
                        {!search && filterStatus === "all" && (
                          <Button
                            onClick={() => {
                              setSelected(null);
                              setForm({ student_id: "", provider_name: "", policy_number: "", coverage_amount: "", premium: "", start_date: "", end_date: "", status: "Active", auto_renewal: false });
                              setStudentSearch("");
                              setFormOpen(true);
                            }}
                            variant="outline"
                            className="mt-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50 min-h-[44px]"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Add Policy
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map(policy => {
                    const st = getStudent(policy.student_id);
                    const es = expiryStatus(policy.end_date, policy.status);
                    return (
                      <TableRow
                        key={policy.id}
                        className={`hover:bg-slate-50/50 transition-colors ${es === "expired" ? "bg-red-50/30" : es === "expiring-soon" ? "bg-amber-50/30" : ""}`}
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white bg-gradient-to-br from-emerald-500 to-teal-600 flex-shrink-0">
                              {st?.name?.charAt(0) || "?"}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-sm text-slate-900 truncate">{st?.name || `#${policy.student_id}`}</p>
                              <p className="text-xs text-slate-500">{st?.student_code || ""}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{policy.provider_name || "—"}</TableCell>
                        <TableCell className="text-sm font-mono">{policy.policy_number || "—"}</TableCell>
                        <TableCell className="text-sm font-medium">GHC {(policy.coverage_amount || 0).toLocaleString()}</TableCell>
                        <TableCell className="text-sm">GHC {(policy.premium || 0).toLocaleString()}</TableCell>
                        <TableCell className="text-xs text-slate-500">
                          {policy.start_date ? format(new Date(policy.start_date), "MMM d, yyyy") : "—"} — {policy.end_date ? format(new Date(policy.end_date), "MMM d, yyyy") : "—"}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <Badge variant="outline" className={`text-xs w-fit ${statusColor(policy.status)}`}>{policy.status}</Badge>
                            {expiryBadge(policy.end_date, policy.status)}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 min-w-[32px]"
                              onClick={() => {
                                setSelected(policy);
                                setForm({
                                  student_id: policy.student_id.toString(),
                                  provider_name: policy.provider_name,
                                  policy_number: policy.policy_number,
                                  coverage_amount: policy.coverage_amount.toString(),
                                  premium: policy.premium.toString(),
                                  start_date: policy.start_date ? policy.start_date.split("T")[0] : "",
                                  end_date: policy.end_date ? policy.end_date.split("T")[0] : "",
                                  status: policy.status,
                                  auto_renewal: !!policy.auto_renewal,
                                });
                                setFormOpen(true);
                              }}
                              title="Edit"
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 min-w-[32px] text-red-500 hover:text-red-600 hover:bg-red-50"
                              onClick={() => { setDeleteId(policy.id); setDeleteOpen(true); }}
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <div className="text-center py-20 text-slate-400">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center">
                    <Shield className="w-8 h-8 text-slate-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-500 text-base">No policies found</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {search || filterStatus !== "all" ? "Try adjusting your filters" : "Add your first policy"}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              filtered.map(policy => {
                const st = getStudent(policy.student_id);
                const es = expiryStatus(policy.end_date, policy.status);
                return (
                  <div key={policy.id} className={`p-4 space-y-3 ${es === "expired" ? "bg-red-50/30" : es === "expiring-soon" ? "bg-amber-50/30" : ""}`}>
                    {/* Student info header */}
                    <div className="flex items-start gap-3">
                      <div className="w-11 h-11 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-bold text-white bg-gradient-to-br from-emerald-500 to-teal-600">
                        {st?.name?.charAt(0) || "?"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-semibold text-sm text-slate-900 truncate">{st?.name || `#${policy.student_id}`}</p>
                            <p className="text-xs text-slate-500">{policy.provider_name} · {policy.policy_number}</p>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {policy.auto_renewal === 1 && (
                              <RefreshCw className="w-4 h-4 text-teal-500" title="Auto-renewal" />
                            )}
                            <Badge variant="outline" className={`text-xs shrink-0 ${statusColor(policy.status)}`}>
                              {policy.status}
                            </Badge>
                          </div>
                        </div>
                        {/* Info grid */}
                        <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-slate-500">
                          <p className="flex items-center gap-1.5">
                            <DollarSign className="w-3 h-3 text-slate-400" />
                            <span>Coverage: GHC {(policy.coverage_amount || 0).toLocaleString()}</span>
                          </p>
                          <p className="flex items-center gap-1.5">
                            <DollarSign className="w-3 h-3 text-slate-400" />
                            <span>Premium: GHC {(policy.premium || 0).toLocaleString()}</span>
                          </p>
                          <p className="flex items-center gap-1.5 col-span-2">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>
                              {policy.start_date ? format(new Date(policy.start_date), "MMM d, yyyy") : "—"} — {policy.end_date ? format(new Date(policy.end_date), "MMM d, yyyy") : "—"}
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Expiry badge */}
                    {expiryBadge(policy.end_date, policy.status)}

                    {/* Action buttons */}
                    <div className="flex gap-2 pt-1">
                      <Button
                        variant="outline"
                        className="flex-1 min-h-[44px] text-xs"
                        onClick={() => {
                          setSelected(policy);
                          setForm({
                            student_id: policy.student_id.toString(),
                            provider_name: policy.provider_name,
                            policy_number: policy.policy_number,
                            coverage_amount: policy.coverage_amount.toString(),
                            premium: policy.premium.toString(),
                            start_date: policy.start_date ? policy.start_date.split("T")[0] : "",
                            end_date: policy.end_date ? policy.end_date.split("T")[0] : "",
                            status: policy.status,
                            auto_renewal: !!policy.auto_renewal,
                          });
                          setFormOpen(true);
                        }}
                      >
                        <Pencil className="w-3.5 h-3.5 mr-1.5" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        className="min-h-[44px] min-w-[44px] text-xs text-red-600 border-red-200 hover:bg-red-50"
                        onClick={() => { setDeleteId(policy.id); setDeleteOpen(true); }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* ═══ Form Dialog ═══ */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                <Shield className="w-4 h-4 text-emerald-600" />
              </div>
              {selected ? "Edit Policy" : "Add Insurance Policy"}
            </DialogTitle>
            <DialogDescription>
              {selected ? "Update insurance policy details" : "Enter student insurance policy details"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Student */}
            <div>
              <Label className="text-xs font-medium">Student *</Label>
              <Input
                placeholder="Search students..."
                value={studentSearch}
                onChange={e => setStudentSearch(e.target.value)}
                className="mt-1 min-h-[44px]"
              />
              <Select value={form.student_id} onValueChange={v => setForm({ ...form, student_id: v })}>
                <SelectTrigger className="mt-1.5 min-h-[44px]">
                  <SelectValue placeholder="Select student" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  <SelectItem value="__none__">Choose student...</SelectItem>
                  {filteredStudents.slice(0, 50).map(s => (
                    <SelectItem key={s.student_id} value={s.student_id.toString()}>{s.name} ({s.student_code})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* Provider & Policy */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-medium">Provider Name *</Label>
                <Input
                  value={form.provider_name}
                  onChange={e => setForm({ ...form, provider_name: e.target.value })}
                  placeholder="e.g., GNIC"
                  className="mt-1 min-h-[44px]"
                />
              </div>
              <div>
                <Label className="text-xs font-medium">Policy Number *</Label>
                <Input
                  value={form.policy_number}
                  onChange={e => setForm({ ...form, policy_number: e.target.value })}
                  placeholder="POL-001"
                  className="mt-1 min-h-[44px]"
                />
              </div>
            </div>
            {/* Coverage & Premium */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-medium">Coverage Amount</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.coverage_amount}
                  onChange={e => setForm({ ...form, coverage_amount: e.target.value })}
                  placeholder="0.00"
                  className="mt-1 min-h-[44px]"
                />
              </div>
              <div>
                <Label className="text-xs font-medium">Premium</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.premium}
                  onChange={e => setForm({ ...form, premium: e.target.value })}
                  placeholder="0.00"
                  className="mt-1 min-h-[44px]"
                />
              </div>
            </div>
            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-medium">Start Date *</Label>
                <Input
                  type="date"
                  value={form.start_date}
                  onChange={e => setForm({ ...form, start_date: e.target.value })}
                  className="mt-1 min-h-[44px]"
                />
              </div>
              <div>
                <Label className="text-xs font-medium">End Date *</Label>
                <Input
                  type="date"
                  value={form.end_date}
                  onChange={e => setForm({ ...form, end_date: e.target.value })}
                  className="mt-1 min-h-[44px]"
                />
              </div>
            </div>
            {/* Status & Auto-renewal */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-medium">Status</Label>
                <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                  <SelectTrigger className="mt-1 min-h-[44px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Expired">Expired</SelectItem>
                    <SelectItem value="Cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2 pt-6">
                <Checkbox
                  checked={form.auto_renewal}
                  onCheckedChange={c => setForm({ ...form, auto_renewal: !!c })}
                />
                <Label className="text-sm font-normal">Auto-renewal</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)} className="min-h-[44px]">
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || !form.student_id || !form.provider_name.trim()}
              className="bg-emerald-600 hover:bg-emerald-700 min-h-[44px]"
            >
              {saving && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
              {saving ? "Saving..." : selected ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ Delete Confirmation ═══ */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-red-600" />
              Delete Policy
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this insurance policy? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="min-h-[44px]">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 min-h-[44px]"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
