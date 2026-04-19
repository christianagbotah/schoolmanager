"use client";

import { useEffect, useState, useCallback } from "react";
import {
  BookMarked, Download, FileText, Loader2, AlertTriangle,
  Search, Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useAuth } from "@/hooks/use-auth";
import { format } from "date-fns";

// ─── Types ───────────────────────────────────────────────────
interface SyllabusItem {
  id: number;
  title: string;
  description: string;
  class_id: number;
  subject_id: number;
  file_url: string;
  timestamp?: number;
  class: { class_id: number; name: string };
  subject: { subject_id: number; name: string };
}

interface SubjectItem { subject_id: number; name: string; class?: { class_id: number; name: string }; }

// ─── Main Component ──────────────────────────────────────────
export default function TeacherSyllabusPage() {
  const { isLoading: authLoading } = useAuth();
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [syllabi, setSyllabi] = useState<SyllabusItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterSubject, setFilterSubject] = useState("");

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [subjectsRes, syllabusRes] = await Promise.all([
        fetch("/api/teacher/subjects"),
        fetch("/api/teacher/syllabus"),
      ]);
      if (subjectsRes.ok) { const d = await subjectsRes.json(); setSubjects(Array.isArray(d) ? d : []); }
      if (syllabusRes.ok) { const d = await syllabusRes.json(); setSyllabi(Array.isArray(d) ? d : []); }
    } catch {
      setError("Failed to load syllabus data");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading) fetchData();
  }, [authLoading, fetchData]);

  const filteredSyllabi = syllabi.filter((s) => {
    const q = search.toLowerCase();
    const matchSearch = s.title?.toLowerCase().includes(q) || s.description?.toLowerCase().includes(q);
    const matchSubject = !filterSubject || String(s.subject_id) === filterSubject;
    return matchSearch && matchSubject;
  });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Academic Syllabus</h1>
          <p className="text-sm text-slate-500 mt-1">View syllabus documents for your subjects</p>
        </div>

        {error && (
          <div className="flex items-center gap-3 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />{error}
          </div>
        )}

        {/* ─── Filters ─────────────────────────────────────── */}
        <Card className="gap-4">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input placeholder="Search syllabi..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
              </div>
              <Select value={filterSubject} onValueChange={setFilterSubject}>
                <SelectTrigger><SelectValue placeholder="All Subjects" /></SelectTrigger>
                <SelectContent>
                  {subjects.map((s) => (
                    <SelectItem key={s.subject_id} value={String(s.subject_id)}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* ─── Syllabus List ───────────────────────────────── */}
        <Card className="gap-4">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                <BookMarked className="w-4 h-4 text-emerald-600" />
              </div>
              <CardTitle className="text-base font-semibold">Syllabus Documents ({filteredSyllabi.length})</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {filteredSyllabi.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-400 text-sm">No syllabus uploaded yet</p>
                <p className="text-slate-300 text-xs mt-1">Syllabus documents will appear here when uploaded by admin</p>
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto rounded-lg border border-slate-200">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50 hover:bg-slate-50">
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase">Title</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase hidden sm:table-cell">Class</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase hidden sm:table-cell">Subject</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase hidden lg:table-cell">Date</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSyllabi.map((s) => (
                      <TableRow key={s.id} className="hover:bg-slate-50">
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm text-slate-900">{s.title}</p>
                            {s.description && <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{s.description}</p>}
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <Badge variant="outline" className="text-xs">{s.class?.name || "—"}</Badge>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-sm text-slate-500">{s.subject?.name || "—"}</TableCell>
                        <TableCell className="hidden lg:table-cell text-xs text-slate-400">
                          {s.timestamp ? format(new Date(s.timestamp * 1000), "MMM d, yyyy") : "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          {s.file_url && (
                            <Button variant="ghost" size="sm" asChild className="min-w-[44px] min-h-[44px]">
                              <a href={s.file_url} target="_blank" rel="noopener noreferrer">
                                <Download className="w-4 h-4" />
                              </a>
                            </Button>
                          )}
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
