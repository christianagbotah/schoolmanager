"use client";

import { useEffect, useState, useCallback } from "react";
import {
  AlertTriangle, Loader2, BookOpen, Users, GraduationCap,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useAuth } from "@/hooks/use-auth";

// ─── Types ───────────────────────────────────────────────────
interface SubjectItem {
  subject_id: number;
  name: string;
  class_id: number;
  class?: { class_id: number; name: string; name_numeric: number };
  section?: { section_id: number; name: string };
}

// ─── Main Component ──────────────────────────────────────────
export default function TeacherSubjectsPage() {
  const { isLoading: authLoading } = useAuth();
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ─── Fetch subjects ───────────────────────────────────────
  const fetchSubjects = useCallback(async () => {
    if (authLoading) return;
    setIsLoading(true);
    try {
      const res = await fetch("/api/teacher/subjects");
      if (!res.ok) throw new Error("Failed to fetch subjects");
      const data = await res.json();
      setSubjects(Array.isArray(data) ? data : []);
    } catch {
      setError("Failed to load subjects");
    } finally {
      setIsLoading(false);
    }
  }, [authLoading]);

  useEffect(() => {
    fetchSubjects();
  }, [fetchSubjects]);

  // ─── Group by class ───────────────────────────────────────
  const classGroups = new Map<string, SubjectItem[]>();
  for (const s of subjects) {
    const key = s.class?.name || "Unassigned";
    if (!classGroups.has(key)) classGroups.set(key, []);
    classGroups.get(key)!.push(s);
  }

  const uniqueClasses = Array.from(classGroups.entries());

  // ─── Loading ──────────────────────────────────────────────
  if (authLoading || isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
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
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">My Subjects</h1>
          <p className="text-sm text-slate-500 mt-1">View subjects assigned to you across classes</p>
        </div>

        {/* ─── Error ──────────────────────────────────────── */}
        {error && (
          <div className="flex items-center gap-3 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* ─── Summary Stats ───────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className="gap-4 py-4 border-l-4 border-l-emerald-500">
            <CardContent className="px-4 pb-0 pt-0">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-slate-500">Total Subjects</p>
                  <p className="text-2xl font-bold text-emerald-600">{subjects.length}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="gap-4 py-4 border-l-4 border-l-violet-500">
            <CardContent className="px-4 pb-0 pt-0">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-slate-500">Classes</p>
                  <p className="text-2xl font-bold text-violet-600">{uniqueClasses.length}</p>
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
                  <p className="text-xs font-medium text-slate-500">Avg per Class</p>
                  <p className="text-2xl font-bold text-amber-600">
                    {uniqueClasses.length > 0 ? Math.round(subjects.length / uniqueClasses.length) : 0}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                  <Users className="w-5 h-5 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ─── Subjects by Class ───────────────────────────── */}
        {subjects.length === 0 ? (
          <Card className="gap-4">
            <CardContent className="py-16">
              <div className="text-center">
                <BookOpen className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-600">No Subjects Assigned</h3>
                <p className="text-sm text-slate-400 mt-1">Contact admin to get subject assignments</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {uniqueClasses.map(([className, classSubjects]) => (
              <Card key={className} className="gap-4">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                        <GraduationCap className="w-4 h-4 text-emerald-600" />
                      </div>
                      <div>
                        <CardTitle className="text-base font-semibold">{className}</CardTitle>
                        <p className="text-xs text-slate-500">{classSubjects.length} subject{classSubjects.length !== 1 ? "s" : ""}</p>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {classSubjects.map((s) => (
                      <div
                        key={s.subject_id}
                        className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors"
                      >
                        <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                          <BookOpen className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 truncate">{s.name}</p>
                          {s.section && (
                            <p className="text-xs text-slate-400">Section {s.section.name}</p>
                          )}
                        </div>
                        <Badge variant="outline" className="text-emerald-700 border-emerald-200 text-xs flex-shrink-0">
                          Active
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* ─── Full Table View ─────────────────────────────── */}
        {subjects.length > 0 && (
          <Card className="gap-4">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center">
                  <BookOpen className="w-4 h-4 text-violet-600" />
                </div>
                <CardTitle className="text-base font-semibold">All Subjects</CardTitle>
                <Badge variant="outline" className="ml-auto text-violet-700 border-violet-200">
                  {subjects.length} total
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="max-h-72 overflow-y-auto rounded-lg border border-slate-200">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50 hover:bg-slate-50">
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase w-10">#</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase">Subject</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase hidden sm:table-cell">Class</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase hidden md:table-cell">Section</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subjects.map((s, i) => (
                      <TableRow key={s.subject_id} className="hover:bg-slate-50">
                        <TableCell className="text-sm text-slate-500">{i + 1}</TableCell>
                        <TableCell className="font-medium text-sm text-slate-900">{s.name}</TableCell>
                        <TableCell className="hidden sm:table-cell text-sm text-slate-500">{s.class?.name || "—"}</TableCell>
                        <TableCell className="hidden md:table-cell text-sm text-slate-500">{s.section?.name || "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
