"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Users,
  Search,
  Award,
  FileText,
  Eye,
  Loader2,
  AlertTriangle,
  GraduationCap,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useAuth } from "@/hooks/use-auth";

// ─── Types ───────────────────────────────────────────────────
interface ClassItem {
  class_id: number;
  name: string;
  sections: { section_id: number; name: string }[];
}

interface StudentItem {
  student_id: number;
  student_code: string;
  name: string;
  first_name: string;
  last_name: string;
  sex: string;
  email: string;
  phone: string;
  address: string;
  enrolls: { class: { class_id: number; name: string }; section: { section_id: number; name: string } }[];
}

interface MarkRecord {
  mark_id: number;
  mark_obtained: number;
  comment: string;
  subject: { subject_id: number; name: string };
  exam: { exam_id: number; name: string } | null;
}

// ─── Helpers ─────────────────────────────────────────────────
function getGrade(score: number): string {
  if (score >= 90) return "A+";
  if (score >= 80) return "A";
  if (score >= 70) return "B";
  if (score >= 60) return "C";
  if (score >= 50) return "D";
  return "F";
}

function getGradeColor(score: number): string {
  if (score >= 80) return "bg-emerald-100 text-emerald-700";
  if (score >= 60) return "bg-blue-100 text-blue-700";
  if (score >= 50) return "bg-amber-100 text-amber-700";
  return "bg-red-100 text-red-700";
}

// ─── Main Component ──────────────────────────────────────────
export default function TeacherStudentsPage() {
  const { isLoading: authLoading } = useAuth();
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedSectionId, setSelectedSectionId] = useState("");
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Detail dialog
  const [selectedStudent, setSelectedStudent] = useState<StudentItem | null>(null);
  const [studentMarks, setStudentMarks] = useState<MarkRecord[]>([]);
  const [isLoadingMarks, setIsLoadingMarks] = useState(false);

  // ─── Fetch classes ─────────────────────────────────────────
  const fetchClasses = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/classes");
      if (!res.ok) throw new Error("Failed to fetch classes");
      const data = await res.json();
      setClasses(data || []);
    } catch {
      setError("Failed to load classes");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading) fetchClasses();
  }, [authLoading, fetchClasses]);

  // ─── Fetch students ────────────────────────────────────────
  useEffect(() => {
    const fetchStudents = async () => {
      if (!selectedClassId || !selectedSectionId) {
        setStudents([]);
        return;
      }
      setError(null);
      try {
        const res = await fetch(`/api/students?classId=${selectedClassId}&sectionId=${selectedSectionId}&limit=200`);
        if (!res.ok) throw new Error("Failed to fetch students");
        const data = await res.json();
        setStudents(data.students || []);
      } catch {
        setError("Failed to load students");
      }
    };
    fetchStudents();
  }, [selectedClassId, selectedSectionId]);

  // ─── View student details ──────────────────────────────────
  const handleViewStudent = async (student: StudentItem) => {
    setSelectedStudent(student);
    setIsLoadingMarks(true);
    try {
      const res = await fetch(`/api/marks?student_id=${student.student_id}&limit=200`);
      if (res.ok) {
        const data = await res.json();
        setStudentMarks(data.marks || []);
      }
    } catch {
      // silent
    } finally {
      setIsLoadingMarks(false);
    }
  };

  const selectedClass = classes.find((c) => c.class_id === parseInt(selectedClassId));
  const sections = selectedClass?.sections || [];

  const filteredStudents = students.filter((s) => {
    const q = search.toLowerCase();
    return (
      s.name?.toLowerCase().includes(q) ||
      `${s.first_name} ${s.last_name}`.toLowerCase().includes(q) ||
      s.student_code?.toLowerCase().includes(q)
    );
  });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-12 w-full" />
          <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Student Information</h1>
          <p className="text-sm text-slate-500 mt-1">View students in your assigned classes</p>
        </div>

        {/* ─── Filters ─────────────────────────────────────── */}
        <Card className="gap-4">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Class</Label>
                <Select value={selectedClassId} onValueChange={(v) => { setSelectedClassId(v); setSelectedSectionId(""); }}>
                  <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                  <SelectContent>
                    {classes.map((c) => (
                      <SelectItem key={c.class_id} value={String(c.class_id)}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Section</Label>
                <Select value={selectedSectionId} onValueChange={setSelectedSectionId}>
                  <SelectTrigger><SelectValue placeholder="Select section" /></SelectTrigger>
                  <SelectContent>
                    {sections.map((s) => (
                      <SelectItem key={s.section_id} value={String(s.section_id)}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input placeholder="Search by name or code..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {error && (
          <div className="flex items-center gap-3 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />{error}
          </div>
        )}

        {/* ─── Student Table ───────────────────────────────── */}
        {selectedClassId && selectedSectionId && (
          <Card className="gap-4">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <Users className="w-4 h-4 text-emerald-600" />
                </div>
                <CardTitle className="text-base font-semibold">
                  Students ({filteredStudents.length})
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {filteredStudents.length === 0 ? (
                <div className="text-center py-12">
                  <GraduationCap className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-400 text-sm">No students found</p>
                </div>
              ) : (
                <div className="max-h-[500px] overflow-y-auto rounded-lg border border-slate-200">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50 hover:bg-slate-50">
                        <TableHead className="text-xs font-semibold text-slate-600 uppercase">#</TableHead>
                        <TableHead className="text-xs font-semibold text-slate-600 uppercase">Name</TableHead>
                        <TableHead className="text-xs font-semibold text-slate-600 uppercase hidden sm:table-cell">Code</TableHead>
                        <TableHead className="text-xs font-semibold text-slate-600 uppercase hidden md:table-cell">Gender</TableHead>
                        <TableHead className="text-xs font-semibold text-slate-600 uppercase text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredStudents.map((student, idx) => (
                        <TableRow key={student.student_id} className="hover:bg-slate-50">
                          <TableCell className="text-slate-400 text-sm">{idx + 1}</TableCell>
                          <TableCell className="font-medium text-sm text-slate-900">
                            {student.name || `${student.first_name} ${student.last_name}`.trim()}
                          </TableCell>
                          <TableCell className="hidden sm:table-cell text-sm text-slate-500 font-mono">{student.student_code}</TableCell>
                          <TableCell className="hidden md:table-cell">
                            <Badge variant="outline" className="text-xs capitalize">{student.sex || "N/A"}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" onClick={() => handleViewStudent(student)} className="min-w-[44px] min-h-[44px]">
                              <Eye className="w-4 h-4 mr-1" />
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* ─── Empty State ─────────────────────────────────── */}
        {!selectedClassId && !isLoading && (
          <Card className="gap-4">
            <CardContent className="py-16">
              <div className="text-center">
                <Users className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-600">Select a class to view students</h3>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ─── Student Detail Dialog ───────────────────────── */}
        <Dialog open={!!selectedStudent} onOpenChange={(open) => !open && setSelectedStudent(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Student Profile</DialogTitle>
            </DialogHeader>
            {selectedStudent && (
              <div className="space-y-6">
                {/* Profile Header */}
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
                    <GraduationCap className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">
                      {selectedStudent.name || `${selectedStudent.first_name} ${selectedStudent.last_name}`.trim()}
                    </h3>
                    <div className="flex gap-2 mt-1">
                      <Badge variant="outline" className="font-mono text-xs">{selectedStudent.student_code}</Badge>
                      <Badge variant="secondary" className="text-xs capitalize">{selectedStudent.sex}</Badge>
                    </div>
                  </div>
                </div>

                {/* Info */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-400 text-xs uppercase">Email</p>
                    <p className="text-slate-900 font-medium">{selectedStudent.email || "—"}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs uppercase">Phone</p>
                    <p className="text-slate-900 font-medium">{selectedStudent.phone || "—"}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-slate-400 text-xs uppercase">Address</p>
                    <p className="text-slate-900 font-medium">{selectedStudent.address || "—"}</p>
                  </div>
                </div>

                {/* Marks / Results */}
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                    <Award className="w-4 h-4 text-purple-500" />
                    Academic Results
                  </h4>
                  {isLoadingMarks ? (
                    <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
                  ) : studentMarks.length === 0 ? (
                    <p className="text-sm text-slate-400">No marks recorded yet</p>
                  ) : (
                    <div className="max-h-64 overflow-y-auto rounded-lg border border-slate-200">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-slate-50 hover:bg-slate-50">
                            <TableHead className="text-xs">Subject</TableHead>
                            <TableHead className="text-xs text-right">Score</TableHead>
                            <TableHead className="text-xs text-center">Grade</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {studentMarks.map((m) => (
                            <TableRow key={m.mark_id} className="hover:bg-slate-50">
                              <TableCell className="text-sm">{m.subject?.name || "N/A"}</TableCell>
                              <TableCell className="text-right text-sm font-semibold">{m.mark_obtained}</TableCell>
                              <TableCell className="text-center">
                                <Badge className={getGradeColor(m.mark_obtained)} variant="secondary">{getGrade(m.mark_obtained)}</Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
