"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Percent, Search, Loader2, AlertTriangle, CheckCircle2, XCircle,
  Tag, Users, FileText, TrendingDown, Shield, ToggleLeft, Trash2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { format } from "date-fns";

// ─── Types ───────────────────────────────────────────────────
interface DiscountProfile {
  profile_id: number;
  profile_name: string;
  discount_category: string;
  discount_type: string;
  description: string;
  flat_amount: number;
  flat_percentage: number;
  is_active: number;
}

interface DiscountAssignment {
  assignment_id: number;
  student_id: number;
  profile_id: number;
  discount_category: string;
  year: string;
  term: string;
  is_active: number;
  student: { student_id: number; name: string; student_code: string };
  profile: { profile_name: string; discount_type: string; flat_amount: number; flat_percentage: number } | null;
}

interface DiscountsData {
  profiles: DiscountProfile[];
  assignments: DiscountAssignment[];
  categories: any[];
  stats: {
    totalProfiles: number;
    activeProfiles: number;
    totalAssignments: number;
    invoiceDiscounts: number;
    dailyFeeDiscounts: number;
    totalFlatAmount: number;
    totalInvoiceDiscount: number;
    invoicesWithDiscount: number;
  };
}

// ─── Helpers ─────────────────────────────────────────────────
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "GHS", minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(amount);
}

function StatSkeleton() {
  return <Card className="gap-4 py-4"><CardContent className="px-4 pb-0 pt-0"><div className="flex items-center justify-between"><div className="space-y-2 flex-1"><Skeleton className="h-4 w-24" /><Skeleton className="h-8 w-20" /></div><Skeleton className="h-10 w-10 rounded-xl" /></div></CardContent></Card>;
}

// ─── Main Component ──────────────────────────────────────────
export default function DiscountsPage() {
  const [data, setData] = useState<DiscountsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      const res = await fetch(`/api/accountant/discounts?${params.toString()}`);
      if (!res.ok) throw new Error("Failed");
      setData(await res.json());
    } catch {
      setError("Unable to load discount data.");
    } finally {
      setIsLoading(false);
    }
  }, [search]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleAction = async (assignmentId: number, action: string) => {
    setActionLoading(`${assignmentId}-${action}`);
    try {
      const res = await fetch("/api/accountant/discounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignmentId, action }),
      });
      if (res.ok) {
        fetchData();
      }
    } catch {
      // silently fail
    } finally {
      setActionLoading(null);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-72" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{Array.from({ length: 4 }).map((_, i) => <StatSkeleton key={i} />)}</div>
          <Skeleton className="h-80 w-full rounded-xl" />
        </div>
      </DashboardLayout>
    );
  }

  if (error || !data) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center"><AlertTriangle className="w-8 h-8 text-red-600" /></div>
          <h2 className="text-xl font-semibold text-slate-900">Something went wrong</h2>
          <p className="text-slate-500">{error}</p>
          <Button onClick={fetchData} variant="outline"><Loader2 className="w-4 h-4 mr-2" />Try Again</Button>
        </div>
      </DashboardLayout>
    );
  }

  const { profiles, assignments, stats } = data;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 p-6 text-white shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                <Percent className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Discount Management</h1>
                <p className="text-amber-100 text-sm">View and manage student discount assignments</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="gap-4 py-4 border-l-4 border-l-amber-500 hover:shadow-md transition-shadow">
            <CardContent className="px-4 pb-0 pt-0">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Active Profiles</p>
                  <p className="text-xl font-bold text-amber-600">{stats.activeProfiles}</p>
                  <p className="text-xs text-slate-400">{stats.totalProfiles} total</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center"><Tag className="w-5 h-5 text-amber-600" /></div>
              </div>
            </CardContent>
          </Card>
          <Card className="gap-4 py-4 border-l-4 border-l-emerald-500 hover:shadow-md transition-shadow">
            <CardContent className="px-4 pb-0 pt-0">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Total Assignments</p>
                  <p className="text-xl font-bold text-emerald-600">{stats.totalAssignments}</p>
                  <p className="text-xs text-slate-400">Students with discounts</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center"><Users className="w-5 h-5 text-emerald-600" /></div>
              </div>
            </CardContent>
          </Card>
          <Card className="gap-4 py-4 border-l-4 border-l-violet-500 hover:shadow-md transition-shadow">
            <CardContent className="px-4 pb-0 pt-0">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Invoice Discounts</p>
                  <p className="text-xl font-bold text-violet-600">{formatCurrency(stats.totalInvoiceDiscount)}</p>
                  <p className="text-xs text-slate-400">{stats.invoicesWithDiscount} invoices</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center"><FileText className="w-5 h-5 text-violet-600" /></div>
              </div>
            </CardContent>
          </Card>
          <Card className="gap-4 py-4 border-l-4 border-l-sky-500 hover:shadow-md transition-shadow">
            <CardContent className="px-4 pb-0 pt-0">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Flat Discounts</p>
                  <p className="text-xl font-bold text-sky-600">{formatCurrency(stats.totalFlatAmount)}</p>
                  <p className="text-xs text-slate-400">{stats.invoiceDiscounts} invoice / {stats.dailyFeeDiscounts} daily</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-sky-100 flex items-center justify-center"><TrendingDown className="w-5 h-5 text-sky-600" /></div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs: Profiles | Assignments */}
        <Tabs defaultValue="assignments">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="assignments">Student Assignments</TabsTrigger>
            <TabsTrigger value="profiles">Discount Profiles</TabsTrigger>
          </TabsList>

          {/* Assignments Tab */}
          <TabsContent value="assignments" className="space-y-4">
            <Card className="gap-4">
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row gap-3 mb-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      placeholder="Search by student name or code..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="max-h-[500px] overflow-y-auto rounded-lg border border-slate-200">
                  <Table>
                    <TableHeader><TableRow className="bg-slate-50 hover:bg-slate-50">
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase">Student</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase hidden sm:table-cell">Profile</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase hidden md:table-cell">Category</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase text-center">Status</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase text-center">Actions</TableHead>
                    </TableRow></TableHeader>
                    <TableBody>
                      {assignments.length === 0 ? (
                        <TableRow><TableCell colSpan={5} className="text-center text-slate-400 py-8">No discount assignments found</TableCell></TableRow>
                      ) : assignments.map((a) => (
                        <TableRow key={a.assignment_id} className={`hover:bg-slate-50 ${a.is_active ? '' : 'opacity-60'}`}>
                          <TableCell>
                            <div>
                              <p className="text-sm font-medium">{a.student?.name || "Unknown"}</p>
                              <p className="text-xs text-slate-400">{a.student?.student_code}</p>
                            </div>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell text-sm text-slate-600">{a.profile?.profile_name || "—"}</TableCell>
                          <TableCell className="hidden md:table-cell">
                            <Badge variant="secondary" className="text-xs capitalize">{a.discount_category?.replace(/_/g, " ") || "—"}</Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            {a.is_active ? (
                              <Badge className="bg-emerald-100 text-emerald-700"><CheckCircle2 className="w-3 h-3 mr-1" />Active</Badge>
                            ) : (
                              <Badge className="bg-slate-100 text-slate-500"><XCircle className="w-3 h-3 mr-1" />Inactive</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className={`h-8 w-8 p-0 ${a.is_active ? 'text-amber-600 hover:text-amber-700 hover:bg-amber-50' : 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50'}`}
                                onClick={() => handleAction(a.assignment_id, a.is_active ? 'deactivate' : 'activate')}
                                disabled={!!actionLoading}
                              >
                                {actionLoading === `${a.assignment_id}-${a.is_active ? 'deactivate' : 'activate'}` ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => handleAction(a.assignment_id, 'delete')}
                                disabled={!!actionLoading}
                              >
                                {actionLoading === `${a.assignment_id}-delete` ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Profiles Tab */}
          <TabsContent value="profiles" className="space-y-4">
            <Card className="gap-4">
              <CardHeader className="pb-0">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center"><Tag className="w-4 h-4 text-amber-600" /></div>
                  <CardTitle className="text-base font-semibold">Discount Profiles</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="max-h-[500px] overflow-y-auto rounded-lg border border-slate-200">
                  <Table>
                    <TableHeader><TableRow className="bg-slate-50 hover:bg-slate-50">
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase">Profile Name</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase hidden sm:table-cell">Category</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase hidden md:table-cell">Description</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase text-right">Amount</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase text-center">Status</TableHead>
                    </TableRow></TableHeader>
                    <TableBody>
                      {profiles.length === 0 ? (
                        <TableRow><TableCell colSpan={5} className="text-center text-slate-400 py-8">No discount profiles found</TableCell></TableRow>
                      ) : profiles.map((p) => (
                        <TableRow key={p.profile_id} className={`hover:bg-slate-50 ${p.is_active ? '' : 'opacity-60'}`}>
                          <TableCell className="text-sm font-medium">{p.profile_name}</TableCell>
                          <TableCell className="hidden sm:table-cell">
                            <Badge variant="secondary" className="text-xs capitalize">{p.discount_category?.replace(/_/g, " ")}</Badge>
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-sm text-slate-500 max-w-[200px] truncate">{p.description}</TableCell>
                          <TableCell className="text-right text-sm tabular-nums font-semibold">
                            {p.flat_percentage > 0 ? `${p.flat_percentage}%` : formatCurrency(p.flat_amount)}
                          </TableCell>
                          <TableCell className="text-center">
                            {p.is_active ? (
                              <Badge className="bg-emerald-100 text-emerald-700">Active</Badge>
                            ) : (
                              <Badge className="bg-slate-100 text-slate-500">Inactive</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
