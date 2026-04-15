"use client";

import { useEffect, useState, useCallback } from "react";
import {
  BookOpen,
  Download,
  FileText,
  AlertTriangle,
  Loader2,
  GraduationCap,
  User,
  Calendar,
  FolderOpen,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { format } from "date-fns";

// ─── Types ───────────────────────────────────────────────────
interface SyllabusItem {
  syllabus_id: number;
  academic_syllabus_code: string;
  title: string;
  description: string;
  file_name: string;
  file_path: string;
  upload_date: string | null;
  uploaded_by: string;
  subject_id: number;
  class_id: number;
  year: string;
  term: string;
  subject: { name: string } | null;
  class: { name: string; name_numeric: number } | null;
}

interface SubjectItem {
  subject_id: number;
  name: string;
  teacher: { teacher_id: number; name: string } | null;
}

interface EnrollmentInfo {
  class_id: number;
  class_name: string;
  class_numeric: number;
  section_name: string;
  year: string;
  term: string;
}

// ─── Main Component ──────────────────────────────────────────
export default function StudentSyllabusPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [syllabi, setSyllabi] = useState<SyllabusItem[]>([]);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [enrollment, setEnrollment] = useState<EnrollmentInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSubject, setSelectedSubject] = useState("all");

  const fetchData = useCallback(async () => {
    if (!user?.id) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/student/syllabus");
      if (!res.ok) throw new Error("Failed to load syllabus");
      const data = await res.json();
      setSyllabi(data.syllabi || []);
      setSubjects(data.subjects || []);
      setEnrollment(data.enrollment || null);
    } catch {
      setError("Failed to load syllabus data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!authLoading) fetchData();
  }, [authLoading, fetchData]);

  const filteredSyllabi =
    selectedSubject === "all"
      ? syllabi
      : syllabi.filter((s) => s.subject_id === parseInt(selectedSubject));

  const uniqueSubjects = Array.from(
    new Map(syllabi.map((s) => [s.subject_id, s.subject?.name || "Unknown"])).entries()
  );

  // ─── Loading ───────────────────────────────────────────────
  if (authLoading || isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-32 w-full rounded-xl" />
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-xl" />
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ─── Error ─────────────────────────────────────────────────
  if (error) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-slate-900">{error}</h2>
          <Button onClick={fetchData} variant="outline">
            <Loader2 className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* ─── Header ─────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Academic Syllabus</h1>
            <p className="text-sm text-slate-500 mt-1">View syllabus and study materials for your enrolled classes</p>
          </div>
          {enrollment && (
            <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-700 px-3 py-1.5">
              <GraduationCap className="w-3.5 h-3.5 mr-1.5" />
              {enrollment.class_name} {enrollment.class_numeric} — {enrollment.section_name} ({enrollment.year})
            </Badge>
          )}
        </div>

        {/* ─── Subjects Overview ──────────────────────────── */}
        {subjects.length > 0 && (
          <Card className="gap-4">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                  <BookOpen className="w-4 h-4 text-amber-600" />
                </div>
                <CardTitle className="text-base font-semibold">My Subjects</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {subjects.map((s) => (
                  <div
                    key={s.subject_id}
                    className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:border-amber-200 hover:bg-amber-50/30 transition-all cursor-pointer"
                    onClick={() => setSelectedSubject(String(s.subject_id))}
                  >
                    <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                      <BookOpen className="w-4 h-4 text-amber-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{s.name}</p>
                      {s.teacher && (
                        <p className="text-[11px] text-slate-500 truncate">{s.teacher.name}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* ─── Syllabus Materials ─────────────────────────── */}
        <Card className="gap-4">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <FolderOpen className="w-4 h-4 text-emerald-600" />
                </div>
                <CardTitle className="text-base font-semibold">Study Materials</CardTitle>
              </div>
              <div className="flex items-center gap-2">
                {selectedSubject !== "all" && (
                  <Button variant="ghost" size="sm" onClick={() => setSelectedSubject("all")}>
                    View All
                  </Button>
                )}
                <Badge variant="secondary" className="bg-slate-100 text-slate-600">
                  {filteredSyllabi.length} items
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {filteredSyllabi.length === 0 ? (
              <div className="text-center py-16">
                <FileText className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-600">No syllabus materials available</h3>
                <p className="text-sm text-slate-400 mt-1">
                  {selectedSubject !== "all"
                    ? "No materials found for the selected subject"
                    : "Your teachers will upload syllabus materials here"}
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {filteredSyllabi.map((item) => (
                  <div
                    key={item.syllabus_id}
                    className="flex items-start gap-4 p-4 rounded-lg border border-slate-200 hover:border-amber-200 hover:bg-amber-50/20 transition-all"
                  >
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5 text-amber-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-slate-900 truncate">{item.title || "Untitled"}</h4>
                      {item.description && (
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">{item.description}</p>
                      )}
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        {item.subject && (
                          <Badge variant="secondary" className="bg-blue-50 text-blue-700 text-[11px]">
                            {item.subject.name}
                          </Badge>
                        )}
                        {item.year && (
                          <Badge variant="secondary" className="bg-slate-100 text-slate-600 text-[11px]">
                            <Calendar className="w-3 h-3 mr-1" />
                            {item.year} {item.term ? `T${item.term}` : ""}
                          </Badge>
                        )}
                        {item.upload_date && (
                          <span className="text-[11px] text-slate-400">
                            {format(new Date(item.upload_date), "MMM d, yyyy")}
                          </span>
                        )}
                        {item.uploaded_by && (
                          <span className="text-[11px] text-slate-400">
                            <User className="w-3 h-3 inline mr-0.5" />
                            {item.uploaded_by}
                          </span>
                        )}
                      </div>
                    </div>
                    {item.file_path && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-shrink-0 text-emerald-700 border-emerald-200 hover:bg-emerald-50 min-w-[44px] min-h-[44px]"
                        onClick={() => window.open(item.file_path, "_blank")}
                      >
                        <Download className="w-4 h-4 sm:mr-1.5" />
                        <span className="hidden sm:inline text-xs">Download</span>
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
