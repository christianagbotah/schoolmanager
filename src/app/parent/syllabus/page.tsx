"use client";

import { useEffect, useState, useCallback } from "react";
import { BookOpen, Download, Loader2, AlertTriangle } from "lucide-react";
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

interface Syllabus { id: number; title: string; description: string; class_id: number; subject_id: number; file_url: string; class: { name: string }; subject: { name: string }; }

export default function ParentSyllabusPage() {
  const { isLoading: authLoading } = useAuth();
  const [syllabi, setSyllabi] = useState<Syllabus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterClass, setFilterClass] = useState("");

  const fetchSyllabi = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/syllabus");
      if (res.ok) { const d = await res.json(); setSyllabi(Array.isArray(d) ? d : []); }
    } catch { setError("Failed to load syllabus"); }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => { if (!authLoading) fetchSyllabi(); }, [authLoading, fetchSyllabi]);

  const filtered = syllabi.filter((s) => !filterClass || String(s.class_id) === filterClass);
  const classNames = [...new Set(syllabi.map((s) => s.class?.name).filter(Boolean))];

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6"><Skeleton className="h-8 w-48" /><div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div></div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div><h1 className="text-2xl font-bold text-slate-900 tracking-tight">Academic Syllabus</h1><p className="text-sm text-slate-500 mt-1">Download syllabus documents</p></div>

        <Card className="gap-4">
          <CardContent className="pt-6">
            <div className="max-w-xs space-y-2">
              <Label>Filter by Class</Label>
              <Select value={filterClass} onValueChange={setFilterClass}>
                <SelectTrigger><SelectValue placeholder="All Classes" /></SelectTrigger>
                <SelectContent>
                  {classNames.map((name, idx) => {
                    const cls = syllabi.find((s) => s.class?.name === name);
                    return <SelectItem key={cls?.class_id || idx} value={String(cls?.class_id || "")}>{name}</SelectItem>;
                  })}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {error && <div className="flex items-center gap-3 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm"><AlertTriangle className="w-5 h-5" />{error}</div>}

        <Card className="gap-4">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center"><BookOpen className="w-4 h-4 text-purple-600" /></div>
              <CardTitle className="text-base font-semibold">Syllabus Documents ({filtered.length})</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {filtered.length === 0 ? (
              <div className="text-center py-12"><BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" /><p className="text-slate-400 text-sm">No syllabus found</p></div>
            ) : (
              <div className="max-h-96 overflow-y-auto rounded-lg border border-slate-200">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50 hover:bg-slate-50">
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase">Title</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase hidden sm:table-cell">Class</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase hidden sm:table-cell">Subject</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((s) => (
                      <TableRow key={s.id} className="hover:bg-slate-50">
                        <TableCell><p className="font-medium text-sm">{s.title}</p>{s.description && <p className="text-xs text-slate-400 line-clamp-1">{s.description}</p>}</TableCell>
                        <TableCell className="hidden sm:table-cell"><Badge variant="outline" className="text-xs">{s.class?.name || "—"}</Badge></TableCell>
                        <TableCell className="hidden sm:table-cell text-sm text-slate-500">{s.subject?.name || "—"}</TableCell>
                        <TableCell className="text-right">
                          {s.file_url && (
                            <Button variant="ghost" size="sm" asChild className="min-w-[44px] min-h-[44px]">
                              <a href={s.file_url} target="_blank" rel="noopener noreferrer"><Download className="w-4 h-4" /></a>
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
