"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Users,
  Search,
  Mail,
  Phone,
  Loader2,
  AlertTriangle,
  GraduationCap,
  BookOpen,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useAuth } from "@/hooks/use-auth";

interface Teacher {
  teacher_id: number;
  name: string;
  email: string;
  phone: string;
  designation?: { des_name: string };
  department?: { dep_name: string };
  active_status: number;
}

export default function ParentTeachersPage() {
  const { isLoading: authLoading } = useAuth();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const fetchTeachers = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/teachers?limit=100");
      if (res.ok) { const d = await res.json(); setTeachers(Array.isArray(d) ? d : d.teachers || []); }
    } catch { setError("Failed to load teachers"); }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => { if (!authLoading) fetchTeachers(); }, [authLoading, fetchTeachers]);

  const filtered = teachers.filter((t) => {
    const q = search.toLowerCase();
    return t.name?.toLowerCase().includes(q) || t.designation?.des_name?.toLowerCase().includes(q) || t.department?.dep_name?.toLowerCase().includes(q);
  });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6"><Skeleton className="h-8 w-48" /><Skeleton className="h-12 w-full" /><div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div></div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div><h1 className="text-2xl font-bold text-slate-900 tracking-tight">Teachers</h1><p className="text-sm text-slate-500 mt-1">Class masters and subject teachers</p></div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input placeholder="Search teachers..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>

        {error && (
          <div className="flex items-center gap-3 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm"><AlertTriangle className="w-5 h-5" />{error}</div>
        )}

        <Card className="gap-4">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center"><Users className="w-4 h-4 text-purple-600" /></div>
              <CardTitle className="text-base font-semibold">Teachers ({filtered.length})</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {filtered.length === 0 ? (
              <div className="text-center py-12"><GraduationCap className="w-12 h-12 text-slate-300 mx-auto mb-3" /><p className="text-slate-400 text-sm">No teachers found</p></div>
            ) : (
              <div className="max-h-96 overflow-y-auto rounded-lg border border-slate-200">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50 hover:bg-slate-50">
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase">Name</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase hidden sm:table-cell">Designation</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase hidden md:table-cell">Department</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase hidden sm:table-cell">Contact</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((teacher) => (
                      <TableRow key={teacher.teacher_id} className="hover:bg-slate-50">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                              <span className="text-purple-600 font-bold text-sm">{teacher.name?.charAt(0)}</span>
                            </div>
                            <div>
                              <p className="font-medium text-sm text-slate-900">{teacher.name}</p>
                              <Badge variant="secondary" className={`text-[10px] ${teacher.active_status === 1 ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                                {teacher.active_status === 1 ? "Active" : "Inactive"}
                              </Badge>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-sm text-slate-500">{teacher.designation?.des_name || "—"}</TableCell>
                        <TableCell className="hidden md:table-cell text-sm text-slate-500">{teacher.department?.dep_name || "—"}</TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <div className="flex items-center gap-2">
                            {teacher.email && <span className="flex items-center gap-1 text-xs text-slate-400"><Mail className="w-3 h-3" />{teacher.email}</span>}
                          </div>
                          {teacher.phone && <span className="text-xs text-slate-400">{teacher.phone}</span>}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
