"use client";

import { useEffect, useState, useCallback } from "react";
import {
  BookOpen, Users, Search, ChevronRight, ArrowLeft,
  AlertTriangle, GraduationCap, Eye,
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
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useAuth } from "@/hooks/use-auth";

// ─── Types ───────────────────────────────────────────────────
interface SubjectInfo {
  subject_id: number;
  name: string;
}

interface ClassItem {
  class_id: number;
  name: string;
  name_numeric?: number;
  category?: string;
  _count?: { enrolls: number };
  student_count?: number;
  sections: { section_id: number; name: string }[];
  subjects?: SubjectInfo[];
  is_class_teacher?: boolean;
}

interface StudentItem {
  student_id: number;
  student_code: string;
  name: string;
  first_name: string;
  last_name: string;
  sex: string;
  email?: string;
  phone?: string;
  roll?: number;
}

// ─── Main Component ──────────────────────────────────────────
export default function TeacherClassesPage() {
  const { isLoading: authLoading } = useAuth();
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [selectedClass, setSelectedClass] = useState<ClassItem | null>(null);
  const [selectedSection, setSelectedSection] = useState<string>("");
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"classTeacher" | "subjectTeacher">("classTeacher");

  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ─── Fetch classes ─────────────────────────────────────────
  const fetchClasses = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/teacher/classes");
      if (!res.ok) throw new Error("Failed to fetch classes");
      const data = await res.json();
      setClasses((Array.isArray(data) ? data : []).filter((c: ClassItem) => c.name !== ""));
    } catch {
      setError("Failed to load classes");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading) fetchClasses();
  }, [authLoading, fetchClasses]);

  // ─── Fetch students for selected class/section ─────────────
  const fetchStudents = useCallback(async (cls: ClassItem, sectionId: string) => {
    setIsLoadingStudents(true);
    setError(null);
    try {
      const res = await fetch(`/api/teacher/students?class_id=${cls.class_id}&section_id=${sectionId}`);
      if (!res.ok) throw new Error("Failed to fetch students");
      const data = await res.json();
      setStudents(Array.isArray(data) ? data : data.students || []);
    } catch {
      setError("Failed to load students");
      setStudents([]);
    } finally {
      setIsLoadingStudents(false);
    }
  }, []);

  const handleClassClick = (cls: ClassItem) => {
    const sectionId = cls.sections?.[0]?.section_id;
    if (sectionId) {
      setSelectedClass(cls);
      setSelectedSection(String(sectionId));
      fetchStudents(cls, String(sectionId));
    }
  };

  const handleSectionChange = (sectionId: string) => {
    setSelectedSection(sectionId);
    if (selectedClass) fetchStudents(selectedClass, sectionId);
  };

  const handleBack = () => {
    setSelectedClass(null);
    setStudents([]);
    setSelectedSection("");
    setSearch("");
  };

  const filteredStudents = students.filter((s) => {
    const q = search.toLowerCase();
    return (
      s.name?.toLowerCase().includes(q) ||
      `${s.first_name} ${s.last_name}`.toLowerCase().includes(q) ||
      s.student_code?.toLowerCase().includes(q)
    );
  });

  const classTeacherClasses = classes.filter(c => c.is_class_teacher);
  const subjectTeacherClasses = classes.filter(c => !c.is_class_teacher);

  // ─── Loading State ─────────────────────────────────────────
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full rounded-xl" />
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
        <div className="flex items-center gap-3">
          {selectedClass && (
            <Button variant="ghost" size="sm" onClick={handleBack} className="min-w-[44px] min-h-[44px]">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
          )}
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              {selectedClass ? selectedClass.name : "My Classes"}
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              {selectedClass ? "View students in this class" : "Classes assigned to you"}
            </p>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-3 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* ─── Class List View ─────────────────────────────── */}
        {!selectedClass && (
          <>
            {/* Summary Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <Card className="py-4 border-l-4 border-l-teal-500">
                <CardContent className="px-4 pb-0 pt-0">
                  <p className="text-xs font-medium text-slate-500">Total Classes</p>
                  <p className="text-2xl font-bold text-teal-600">{classes.length}</p>
                </CardContent>
              </Card>
              <Card className="py-4 border-l-4 border-l-violet-500">
                <CardContent className="px-4 pb-0 pt-0">
                  <p className="text-xs font-medium text-slate-500">Class Teacher</p>
                  <p className="text-2xl font-bold text-violet-600">{classTeacherClasses.length}</p>
                </CardContent>
              </Card>
              <Card className="py-4 border-l-4 border-l-amber-500 col-span-2 sm:col-span-1">
                <CardContent className="px-4 pb-0 pt-0">
                  <p className="text-xs font-medium text-slate-500">Total Students</p>
                  <p className="text-2xl font-bold text-amber-600">
                    {classes.reduce((sum, c) => sum + (c.student_count || c._count?.enrolls || 0), 0)}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Class Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {classes.length === 0 ? (
                <div className="col-span-full">
                  <Card className="gap-4">
                    <CardContent className="py-16">
                      <div className="text-center">
                        <BookOpen className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-slate-600">No classes assigned</h3>
                        <p className="text-sm text-slate-400 mt-1">Contact the administrator to assign classes</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                classes.map((cls) => (
                  <Card
                    key={cls.class_id}
                    className="cursor-pointer hover:shadow-md hover:border-emerald-200 transition-all group"
                    onClick={() => handleClassClick(cls)}
                  >
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-11 h-11 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform ${
                            cls.is_class_teacher ? "bg-violet-100" : "bg-emerald-100"
                          }`}>
                            <BookOpen className={`w-5 h-5 ${cls.is_class_teacher ? "text-violet-600" : "text-emerald-600"}`} />
                          </div>
                          <div>
                            <h3 className="font-semibold text-slate-900">{cls.name}</h3>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              {cls.is_class_teacher && (
                                <Badge variant="secondary" className="bg-violet-100 text-violet-700 text-[10px] px-1.5 py-0">
                                  Class Teacher
                                </Badge>
                              )}
                              {cls.category && (
                                <Badge variant="outline" className="text-[10px]">{cls.category}</Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-emerald-500 transition-colors" />
                      </div>
                      <div className="flex items-center gap-4 mt-4 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5" />
                          {cls.student_count || cls._count?.enrolls || 0} students
                        </span>
                        <span className="flex items-center gap-1">
                          <GraduationCap className="w-3.5 h-3.5" />
                          {cls.sections?.length || 0} sections
                        </span>
                        {(cls.subjects?.length || 0) > 0 && (
                          <span className="flex items-center gap-1">
                            <BookOpen className="w-3.5 h-3.5" />
                            {cls.subjects?.length} subjects
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </>
        )}

        {/* ─── Students View ───────────────────────────────── */}
        {selectedClass && (
          <div className="space-y-4">
            {/* Section Tabs & Search */}
            <Card className="gap-4">
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex gap-2 flex-wrap">
                    {selectedClass.sections?.map((s) => (
                      <Button
                        key={s.section_id}
                        variant={selectedSection === String(s.section_id) ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleSectionChange(String(s.section_id))}
                        className={`min-w-[44px] min-h-[44px] ${
                          selectedSection === String(s.section_id) ? "bg-emerald-600 hover:bg-emerald-700" : ""
                        }`}
                      >
                        {s.name}
                      </Button>
                    ))}
                  </div>
                  <div className="relative flex-1 sm:max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      placeholder="Search students..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Students Table */}
            <Card className="gap-4">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                      <Users className="w-4 h-4 text-emerald-600" />
                    </div>
                    <CardTitle className="text-base font-semibold">
                      Students ({filteredStudents.length})
                    </CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {isLoadingStudents ? (
                  <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : filteredStudents.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-400 text-sm">No students found</p>
                  </div>
                ) : (
                  <div className="max-h-96 overflow-y-auto rounded-lg border border-slate-200">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50 hover:bg-slate-50">
                          <TableHead className="text-xs font-semibold text-slate-600 uppercase w-10">#</TableHead>
                          <TableHead className="text-xs font-semibold text-slate-600 uppercase">Name</TableHead>
                          <TableHead className="text-xs font-semibold text-slate-600 uppercase hidden sm:table-cell">Code</TableHead>
                          <TableHead className="text-xs font-semibold text-slate-600 uppercase hidden sm:table-cell">Gender</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredStudents.map((student, idx) => (
                          <TableRow key={student.student_id} className="hover:bg-slate-50">
                            <TableCell className="text-slate-400 text-sm">{student.roll || idx + 1}</TableCell>
                            <TableCell className="font-medium text-sm text-slate-900">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                                  <span className="text-[10px] font-bold text-emerald-700">
                                    {student.name?.charAt(0) || student.first_name?.charAt(0) || "?"}
                                  </span>
                                </div>
                                {student.name || `${student.first_name} ${student.last_name}`.trim()}
                              </div>
                            </TableCell>
                            <TableCell className="hidden sm:table-cell text-sm text-slate-500 font-mono">
                              {student.student_code}
                            </TableCell>
                            <TableCell className="hidden sm:table-cell">
                              <Badge variant="outline" className="text-xs capitalize">
                                {student.sex || "N/A"}
                              </Badge>
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
        )}
      </div>
    </DashboardLayout>
  );
}
