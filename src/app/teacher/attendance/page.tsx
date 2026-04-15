"use client";

import { useEffect, useState, useCallback } from "react";
import {
  AlertTriangle, CheckCircle, Loader2, XCircle, Save, Users, CheckCheck, Clock, UserX,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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

// ─── Types ───────────────────────────────────────────────────
interface ClassItem {
  class_id: number;
  name: string;
  category: string;
  sections: { section_id: number; name: string }[];
  is_class_teacher?: boolean;
}

interface StudentItem {
  student_id: number;
  student_code: string;
  name: string;
  first_name: string;
  last_name: string;
}

// ─── Status Options (matching CI3) ───────────────────────────
const STATUS_OPTIONS = [
  { value: "present", label: "Present", icon: CheckCircle, color: "emerald" },
  { value: "absent", label: "Absent", icon: XCircle, color: "red" },
  { value: "late", label: "Late", icon: Clock, color: "amber" },
  { value: "sick-home", label: "Sick Home", icon: UserX, color: "orange" },
  { value: "sick-clinic", label: "Sick Clinic", icon: UserX, color: "rose" },
] as const;

function getStatusBtnClass(status: string, current: string, color: string) {
  if (current === status) {
    const colors: Record<string, string> = {
      emerald: "bg-emerald-600 hover:bg-emerald-700 text-white",
      red: "bg-red-600 hover:bg-red-700 text-white",
      amber: "bg-amber-600 hover:bg-amber-700 text-white",
      orange: "bg-orange-600 hover:bg-orange-700 text-white",
      rose: "bg-rose-600 hover:bg-rose-700 text-white",
    };
    return colors[color] || colors.emerald;
  }
  const outline: Record<string, string> = {
    emerald: "text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800",
    red: "text-red-700 hover:bg-red-50 hover:text-red-800",
    amber: "text-amber-700 hover:bg-amber-50 hover:text-amber-800",
    orange: "text-orange-700 hover:bg-orange-50 hover:text-orange-800",
    rose: "text-rose-700 hover:bg-rose-50 hover:text-rose-800",
  };
  return outline[color] || outline.emerald;
}

// ─── Main Component ──────────────────────────────────────────
export default function TeacherAttendancePage() {
  const { isLoading: authLoading } = useAuth();
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [students, setStudents] = useState<StudentItem[]>([]);

  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedSectionId, setSelectedSectionId] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [attendanceMap, setAttendanceMap] = useState<Record<number, string>>({});

  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // ─── Fetch classes (teacher-specific) ─────────────────────
  const fetchClasses = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/teacher/classes");
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

  // ─── Fetch students & existing attendance ─────────────────
  const fetchStudents = useCallback(async () => {
    if (!selectedClassId || !selectedSectionId) {
      setStudents([]);
      setAttendanceMap({});
      return;
    }
    setIsLoadingStudents(true);
    setError(null);
    try {
      const [studentsRes, attRes] = await Promise.all([
        fetch(`/api/teacher/students?class_id=${selectedClassId}&section_id=${selectedSectionId}`),
        fetch(`/api/teacher/attendance?class_id=${selectedClassId}&section_id=${selectedSectionId}&date=${selectedDate}`),
      ]);
      if (!studentsRes.ok) throw new Error("Failed to fetch students");

      const studentsData = await studentsRes.json();
      const studentList = Array.isArray(studentsData) ? studentsData : studentsData.students || [];
      setStudents(studentList);

      // Load existing attendance
      const attData = attRes.ok ? await attRes.json() : { records: [] };
      const records = attData.records || [];

      const map: Record<number, string> = {};
      studentList.forEach((s: StudentItem) => {
        const existing = records.find((r: { student_id: number; status: string }) => r.student_id === s.student_id);
        map[s.student_id] = existing?.status || "present";
      });
      setAttendanceMap(map);
    } catch {
      setError("Failed to load students");
    } finally {
      setIsLoadingStudents(false);
    }
  }, [selectedClassId, selectedSectionId, selectedDate]);

  useEffect(() => {
    if (selectedClassId && selectedSectionId) fetchStudents();
  }, [selectedClassId, selectedSectionId, fetchStudents]);

  // ─── Handlers ──────────────────────────────────────────────
  const handleStatusChange = (studentId: number, status: string) => {
    setAttendanceMap((prev) => ({ ...prev, [studentId]: status }));
  };

  const markAllPresent = () => {
    const map: Record<number, string> = {};
    students.forEach((s) => (map[s.student_id] = "present"));
    setAttendanceMap(map);
  };

  const markAllAbsent = () => {
    const map: Record<number, string> = {};
    students.forEach((s) => (map[s.student_id] = "absent"));
    setAttendanceMap(map);
  };

  const handleSave = async () => {
    if (!selectedClassId || !selectedSectionId || students.length === 0) return;
    setIsSaving(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const records = Object.entries(attendanceMap).map(([studentId, status]) => ({
        student_id: parseInt(studentId),
        status,
      }));

      const res = await fetch("/api/teacher/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          class_id: parseInt(selectedClassId),
          section_id: parseInt(selectedSectionId),
          date: selectedDate,
          records,
        }),
      });

      if (!res.ok) throw new Error("Failed to save attendance");
      const data = await res.json();
      setSuccessMsg(`Attendance saved for ${data.count} students`);
    } catch {
      setError("Failed to save attendance. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  // Stats
  const presentCount = students.filter(s => attendanceMap[s.student_id] === "present").length;
  const absentCount = students.filter(s => attendanceMap[s.student_id] === "absent").length;
  const lateCount = students.filter(s => attendanceMap[s.student_id] === "late").length;
  const sickCount = students.filter(s => ["sick-home", "sick-clinic"].includes(attendanceMap[s.student_id] || "")).length;

  const selectedClass = classes.find((c) => c.class_id === parseInt(selectedClassId));
  const sections = selectedClass?.sections || [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* ─── Header ─────────────────────────────────────── */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Mark Attendance</h1>
          <p className="text-sm text-slate-500 mt-1">Record daily student attendance for your classes</p>
        </div>

        {/* ─── Filters ────────────────────────────────────── */}
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
                <Label>Date</Label>
                <Input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ─── Error / Success Messages ───────────────────── */}
        {error && (
          <div className="flex items-center gap-3 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            {error}
          </div>
        )}
        {successMsg && (
          <div className="flex items-center gap-3 p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
            {successMsg}
          </div>
        )}

        {/* ─── Student List ───────────────────────────────── */}
        {selectedClassId && selectedSectionId && (
          <Card className="gap-4">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <Users className="w-4 h-4 text-emerald-600" />
                  </div>
                  <CardTitle className="text-base font-semibold">
                    Students ({students.length})
                  </CardTitle>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={markAllPresent} className="min-w-[44px] min-h-[44px]">
                    <CheckCheck className="w-3.5 h-3.5 mr-1" />
                    <span className="hidden sm:inline">All Present</span>
                  </Button>
                  <Button variant="outline" size="sm" onClick={markAllAbsent} className="min-w-[44px] min-h-[44px]">
                    <XCircle className="w-3.5 h-3.5 mr-1" />
                    <span className="hidden sm:inline">All Absent</span>
                  </Button>
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
              ) : students.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-400 text-sm">No students found in this class</p>
                </div>
              ) : (
                <>
                  {/* Live Stats */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-50 border border-emerald-100">
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                      <span className="text-sm font-medium text-emerald-700">Present: {presentCount}</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-red-50 border border-red-100">
                      <XCircle className="w-4 h-4 text-red-600" />
                      <span className="text-sm font-medium text-red-700">Absent: {absentCount}</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-50 border border-amber-100">
                      <Clock className="w-4 h-4 text-amber-600" />
                      <span className="text-sm font-medium text-amber-700">Late: {lateCount}</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-orange-50 border border-orange-100">
                      <UserX className="w-4 h-4 text-orange-600" />
                      <span className="text-sm font-medium text-orange-700">Sick: {sickCount}</span>
                    </div>
                  </div>

                  <div className="max-h-[500px] overflow-y-auto rounded-lg border border-slate-200">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50 hover:bg-slate-50">
                          <TableHead className="text-xs font-semibold text-slate-600 uppercase">#</TableHead>
                          <TableHead className="text-xs font-semibold text-slate-600 uppercase">Student</TableHead>
                          <TableHead className="text-xs font-semibold text-slate-600 uppercase hidden sm:table-cell">Code</TableHead>
                          <TableHead className="text-xs font-semibold text-slate-600 uppercase text-right">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {students.map((student, idx) => (
                          <TableRow key={student.student_id} className="hover:bg-slate-50">
                            <TableCell className="text-slate-400 text-sm">{idx + 1}</TableCell>
                            <TableCell className="font-medium text-sm text-slate-900">
                              <div className="flex items-center gap-2">
                                <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                                  attendanceMap[student.student_id] === "present" ? "bg-emerald-100" :
                                  attendanceMap[student.student_id] === "absent" ? "bg-red-100" :
                                  attendanceMap[student.student_id] === "late" ? "bg-amber-100" : "bg-orange-100"
                                }`}>
                                  <span className="text-[10px] font-bold text-slate-600">
                                    {student.name?.charAt(0) || student.first_name?.charAt(0) || "?"}
                                  </span>
                                </div>
                                {student.name || `${student.first_name} ${student.last_name}`.trim()}
                              </div>
                            </TableCell>
                            <TableCell className="hidden sm:table-cell text-sm text-slate-500 font-mono">
                              {student.student_code}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1 flex-wrap">
                                {STATUS_OPTIONS.map(({ value, label, icon: Icon, color }) => (
                                  <Button
                                    key={value}
                                    variant={attendanceMap[student.student_id] === value ? "default" : "outline"}
                                    size="sm"
                                    className={`h-8 min-w-[36px] ${getStatusBtnClass(value, attendanceMap[student.student_id] || "", color)}`}
                                    onClick={() => handleStatusChange(student.student_id, value)}
                                    title={label}
                                  >
                                    <Icon className="w-3.5 h-3.5 sm:mr-1" />
                                    <span className="hidden lg:inline text-xs">{label.charAt(0)}</span>
                                  </Button>
                                ))}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Save Button */}
                  <div className="flex justify-end mt-4">
                    <Button
                      onClick={handleSave}
                      disabled={isSaving || students.length === 0}
                      className="bg-emerald-600 hover:bg-emerald-700 min-w-[44px] min-h-[44px]"
                    >
                      {isSaving ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4 mr-2" />
                      )}
                      Save Attendance
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* ─── Empty State ────────────────────────────────── */}
        {!selectedClassId && !isLoading && (
          <Card className="gap-4">
            <CardContent className="py-16">
              <div className="text-center">
                <Users className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-600">Select a class to begin</h3>
                <p className="text-sm text-slate-400 mt-1">Choose a class and section above to mark attendance</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
