"use client";

import { useEffect, useState, useCallback } from "react";
import { BookOpen, Download, Loader2, AlertTriangle, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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

interface SyllabusItem {
  syllabus_id: number; academic_syllabus_code: string; title: string; description: string;
  file_name: string; file_path: string; upload_date: string | null; uploaded_by: string;
  uploader_type: string; uploader_id: number; subject_id: number; class_id: number;
  year: string; term: string;
  subject: { name: string } | null;
  class: { name: string; name_numeric: number } | null;
}

interface ChildItem { student_id: number; name: string; first_name: string; last_name: string; enrolls: { class: { name: string } }[]; }

export default function ParentSyllabusPage() {
  const { isLoading: authLoading, isParent } = useAuth();
  const [syllabi, setSyllabi] = useState<SyllabusItem[]>([]);
  const [children, setChildren] = useState<ChildItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterChild, setFilterChild] = useState("");

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/parent/syllabus");
      if (res.ok) { const d = await res.json(); setSyllabi(d.syllabi || []); setChildren(d.children || []); }
    } catch { setError("Failed to load syllabus"); }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => { if (!authLoading && isParent) fetchData(); }, [authLoading, isParent, fetchData]);

  const filtered = syllabi.filter((s) => {
    if (!filterChild) return true;
    const child = children.find(c => String(c.student_id) === filterChild);
    if (!child) return true;
    const childClassId = child.enrolls?.[0]?.class?.name;
    return childClassId && s.class?.name?.includes(childClassId);
  });

  const classNames = [...new Set(syllabi.map((s) => s.class?.name ? `${s.class.name} ${s.class.name_numeric}` : "").filter(Boolean))];

  if (isLoading) {
    return <DashboardLayout><div className="space-y-6"><Skeleton className="h-8 w-48" /><div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div></div></DashboardLayout>;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div><h1 className="text-2xl font-bold text-slate-900 tracking-tight">Academic Syllabus</h1><p className="text-sm text-slate-500 mt-1">Download syllabus documents for your children&apos;s classes</p></div>

        <Card className="gap-4">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Filter by Child</Label>
                <Select value={filterChild} onValueChange={setFilterChild}>
                  <SelectTrigger><SelectValue placeholder="All Classes" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Classes</SelectItem>
                    {children.map((c, idx) => (
                      <SelectItem key={c.student_id} value={String(c.student_id)}>{c.name || `${c.first_name} ${c.last_name}`.trim()}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Total Documents</Label>
                <div className="h-10 flex items-center px-3 rounded-md border border-slate-200 bg-white text-sm font-medium"><Badge>{filtered.length} documents</Badge></div>
              </div>
            </div>
          </CardContent>
        </Card>

        {error && <div className="flex items-center gap-3 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm"><AlertTriangle className="w-5 h-5" />{error}</div>}

        <Card className="gap-4">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center"><BookOpen className="w-4 h-4 text-violet-600" /></div>
              <CardTitle className="text-base font-semibold">Syllabus Documents ({filtered.length})</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {filtered.length === 0 ? (
              <div className="text-center py-12"><FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" /><p className="text-slate-400 text-sm">No syllabus found</p></div>
            ) : (
              <div className="max-h-[500px] overflow-y-auto rounded-lg border border-slate-200">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50 hover:bg-slate-50">
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase">#</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase">Title</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase hidden sm:table-cell">Subject</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase hidden sm:table-cell">Class</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase hidden md:table-cell">Uploaded</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((s, idx) => (
                      <TableRow key={s.syllabus_id} className="hover:bg-slate-50">
                        <TableCell className="text-slate-400 text-sm">{idx + 1}</TableCell>
                        <TableCell>
                          <p className="font-medium text-sm">{s.title}</p>
                          {s.description && <p className="text-xs text-slate-400 line-clamp-1">{s.description}</p>}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell"><Badge variant="outline" className="text-xs">{s.subject?.name || "—"}</Badge></TableCell>
                        <TableCell className="hidden sm:table-cell text-sm text-slate-500">{s.class ? `${s.class.name} ${s.class.name_numeric}` : "—"}</TableCell>
                        <TableCell className="hidden md:table-cell text-xs text-slate-400">{s.upload_date ? format(new Date(s.upload_date), "MMM d, yyyy") : "—"}</TableCell>
                        <TableCell className="text-right">
                          {s.file_path && (
                            <Button variant="ghost" size="sm" asChild className="min-w-[44px] min-h-[44px]">
                              <a href={s.file_path} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700">
                                <Download className="w-4 h-4" />Download
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
