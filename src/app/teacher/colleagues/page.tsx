"use client";

import { useEffect, useState, useCallback } from "react";
import {
  AlertTriangle, Loader2, Users, Search, Phone, Mail,
  GraduationCap, User,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useAuth } from "@/hooks/use-auth";

// ─── Types ───────────────────────────────────────────────────
interface Colleague {
  teacher_id: number;
  teacher_code: string;
  name: string;
  email: string;
  phone: string;
  gender: string;
  blood_group: string;
  designation_name: string;
  department_name: string;
  subject_count: number;
  top_subjects: string[];
}

// ─── Main Component ──────────────────────────────────────────
export default function TeacherColleaguesPage() {
  const { isLoading: authLoading } = useAuth();
  const [colleagues, setColleagues] = useState<Colleague[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ─── Fetch colleagues ─────────────────────────────────────
  const fetchColleagues = useCallback(async () => {
    if (authLoading) return;
    setIsLoading(true);
    try {
      const res = await fetch("/api/teacher/colleagues");
      if (!res.ok) throw new Error("Failed to fetch colleagues");
      const data = await res.json();
      setColleagues(Array.isArray(data) ? data : []);
    } catch {
      setError("Failed to load colleagues");
    } finally {
      setIsLoading(false);
    }
  }, [authLoading]);

  useEffect(() => {
    fetchColleagues();
  }, [fetchColleagues]);

  // ─── Filtered ─────────────────────────────────────────────
  const filtered = search
    ? colleagues.filter(
        (c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.teacher_code.toLowerCase().includes(search.toLowerCase()) ||
          c.email.toLowerCase().includes(search.toLowerCase()) ||
          c.department_name.toLowerCase().includes(search.toLowerCase()) ||
          c.designation_name.toLowerCase().includes(search.toLowerCase())
      )
    : colleagues;

  // ─── Loading ──────────────────────────────────────────────
  if (authLoading || isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-12 w-64" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-40 rounded-xl" />
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* ─── Header ─────────────────────────────────────── */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Colleagues</h1>
          <p className="text-sm text-slate-500 mt-1">View other teachers in the school</p>
        </div>

        {/* ─── Stats ──────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className="gap-4 py-4 border-l-4 border-l-emerald-500">
            <CardContent className="px-4 pb-0 pt-0">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-slate-500">Total Teachers</p>
                  <p className="text-2xl font-bold text-emerald-600">{colleagues.length}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <Users className="w-5 h-5 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="gap-4 py-4 border-l-4 border-l-violet-500">
            <CardContent className="px-4 pb-0 pt-0">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-slate-500">Departments</p>
                  <p className="text-2xl font-bold text-violet-600">
                    {new Set(colleagues.map((c) => c.department_name).filter(Boolean)).size}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
                  <GraduationCap className="w-5 h-5 text-violet-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="gap-4 py-4 border-l-4 border-l-amber-500">
            <CardContent className="px-4 pb-0 pt-0">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-slate-500">Search Results</p>
                  <p className="text-2xl font-bold text-amber-600">{filtered.length}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                  <Search className="w-5 h-5 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ─── Search ──────────────────────────────────────── */}
        <Card className="gap-4">
          <CardContent className="pt-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search by name, code, email, department..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* ─── Error ──────────────────────────────────────── */}
        {error && (
          <div className="flex items-center gap-3 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* ─── Colleagues Grid ────────────────────────────── */}
        {filtered.length === 0 ? (
          <Card className="gap-4">
            <CardContent className="py-16">
              <div className="text-center">
                <Users className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-600">No Teachers Found</h3>
                <p className="text-sm text-slate-400 mt-1">Try a different search term</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Grid View */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.slice(0, 12).map((c) => (
                <Card key={c.teacher_id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback className="bg-emerald-100 text-emerald-700 text-sm font-semibold">
                          {c.name?.charAt(0) || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">{c.name}</p>
                        <p className="text-xs text-slate-500">{c.designation_name || "Teacher"}</p>
                        {c.department_name && (
                          <Badge variant="outline" className="text-[10px] mt-1">{c.department_name}</Badge>
                        )}
                      </div>
                    </div>
                    <div className="mt-3 space-y-1.5 text-xs text-slate-500">
                      {c.email && (
                        <div className="flex items-center gap-1.5">
                          <Mail className="w-3 h-3" />
                          <span className="truncate">{c.email}</span>
                        </div>
                      )}
                      {c.phone && (
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3 h-3" />
                          <span>{c.phone}</span>
                        </div>
                      )}
                      {c.top_subjects.length > 0 && (
                        <div className="flex items-center gap-1.5">
                          <GraduationCap className="w-3 h-3" />
                          <span className="truncate">{c.top_subjects.slice(0, 3).join(", ")}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100">
                      <span className="text-[10px] text-slate-400 font-mono">{c.teacher_code}</span>
                      <Badge variant="outline" className="text-[10px] text-emerald-700 border-emerald-200 ml-auto">
                        {c.subject_count} subjects
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Full Table */}
            {filtered.length > 0 && (
              <Card className="gap-4">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                      <Users className="w-4 h-4 text-emerald-600" />
                    </div>
                    <CardTitle className="text-base font-semibold">All Teachers</CardTitle>
                    <Badge variant="outline" className="ml-auto text-emerald-700 border-emerald-200">
                      {filtered.length}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="max-h-72 overflow-y-auto rounded-lg border border-slate-200">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50 hover:bg-slate-50">
                          <TableHead className="text-xs font-semibold text-slate-600 uppercase w-10">#</TableHead>
                          <TableHead className="text-xs font-semibold text-slate-600 uppercase">Name</TableHead>
                          <TableHead className="text-xs font-semibold text-slate-600 uppercase hidden sm:table-cell">Designation</TableHead>
                          <TableHead className="text-xs font-semibold text-slate-600 uppercase hidden md:table-cell">Department</TableHead>
                          <TableHead className="text-xs font-semibold text-slate-600 uppercase hidden lg:table-cell">Contact</TableHead>
                          <TableHead className="text-xs font-semibold text-slate-600 uppercase text-center">Subjects</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filtered.map((c, i) => (
                          <TableRow key={c.teacher_id} className="hover:bg-slate-50">
                            <TableCell className="text-sm text-slate-500">{i + 1}</TableCell>
                            <TableCell className="font-medium text-sm text-slate-900">{c.name}</TableCell>
                            <TableCell className="hidden sm:table-cell text-sm text-slate-500">{c.designation_name || "—"}</TableCell>
                            <TableCell className="hidden md:table-cell text-sm text-slate-500">{c.department_name || "—"}</TableCell>
                            <TableCell className="hidden lg:table-cell text-xs text-slate-500">
                              {c.phone || c.email || "—"}
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge className="bg-emerald-100 text-emerald-700">{c.subject_count}</Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
