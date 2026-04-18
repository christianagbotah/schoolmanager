"use client";

import { useEffect, useState, useCallback } from "react";
import {
  CheckCircle, XCircle, Clock, Save, Loader2, AlertTriangle,
  ChevronLeft, ChevronRight, Users, Printer, Calendar,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/hooks/use-auth";
import { RequirePermission } from "@/components/auth/require-permission";
import { PERMISSIONS } from "@/lib/permission-constants";
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval, isToday,
  addMonths, subMonths,
} from "date-fns";

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
}

interface AttendanceRecord {
  attendance_id: number;
  student_id: number;
  status: string;
  student?: StudentItem;
  date?: string;
}

// ─── Status helpers ──────────────────────────────────────────
const STATUS_COLORS: Record<string, string> = {
  present: "bg-emerald-500 text-white",
  absent: "bg-red-500 text-white",
  late: "bg-amber-500 text-white",
};
const STATUS_LABELS: Record<string, string> = { present: "P", absent: "A", late: "L" };

/**
 * Shared Attendance Page
 * - Admin: sees all classes, can manage attendance for any class
 * - Teacher: sees own classes, can mark attendance
 * - Student: sees own attendance calendar
 * - Parent: sees children's attendance calendar
 */
export default function AttendancePage() {
  const { user, role, isAdmin, isTeacher, isStudent, isParent, isLoading: authLoading, hasPermission } = useAuth();

  // ─── Teacher/Admin: Mark Attendance ────────────────────────
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [existingAttendance, setExistingAttendance] = useState<AttendanceRecord[]>([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedSectionId, setSelectedSectionId] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [attendanceMap, setAttendanceMap] = useState<Record<number, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // ─── Student/Parent: View Attendance ───────────────────────
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // ─── Shared ───────────────────────────────────────────────
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ─── Fetch classes (teacher/admin) ─────────────────────────
  const fetchClasses = useCallback(async () => {
    if (isStudent || isParent) return;
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
  }, [isStudent, isParent]);

  // ─── Fetch own attendance (student) ────────────────────────
  const fetchOwnAttendance = useCallback(async () => {
    if (!isStudent || !user?.id) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/attendance?student_id=${user.id}&limit=1000`);
      if (res.ok) {
        const data = await res.json();
        setRecords(data.records || []);
      }
    } catch {
      setError("Failed to load attendance");
    } finally {
      setIsLoading(false);
    }
  }, [isStudent, user?.id]);

  useEffect(() => {
    if (!authLoading) {
      if (isStudent) fetchOwnAttendance();
      else fetchClasses();
    }
  }, [authLoading, isStudent, fetchClasses, fetchOwnAttendance]);

  // ─── Fetch students for class/section ──────────────────────
  const fetchStudents = useCallback(async () => {
    if (!selectedClassId || !selectedSectionId) return;
    setIsLoading(true);
    setError(null);
    try {
      const [studentsRes, attRes] = await Promise.all([
        fetch(`/api/students?classId=${selectedClassId}&sectionId=${selectedSectionId}&limit=200`),
        fetch(`/api/attendance?class_id=${selectedClassId}&section_id=${selectedSectionId}&date=${selectedDate}&limit=200`),
      ]);
      if (!studentsRes.ok) throw new Error("Failed");
      const studentsData = await studentsRes.json();
      setStudents(studentsData.students || []);
      const attData = attRes.ok ? await attRes.json() : { records: [] };
      const recs: AttendanceRecord[] = attData.records || [];
      setExistingAttendance(recs);
      const map: Record<number, string> = {};
      (studentsData.students || []).forEach((s: StudentItem) => {
        const existing = recs.find((r) => r.student_id === s.student_id);
        map[s.student_id] = existing?.status || "present";
      });
      setAttendanceMap(map);
    } catch {
      setError("Failed to load students");
    } finally {
      setIsLoading(false);
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
      const recs = Object.entries(attendanceMap).map(([studentId, status]) => ({
        student_id: parseInt(studentId), status,
      }));
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ class_id: parseInt(selectedClassId), section_id: parseInt(selectedSectionId), date: selectedDate, records: recs, marked_by: "teacher" }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setSuccessMsg(`Attendance saved for ${data.count} students`);
    } catch {
      setError("Failed to save attendance");
    } finally {
      setIsSaving(false);
    }
  };

  const selectedClass = classes.find((c) => c.class_id === parseInt(selectedClassId));
  const sections = selectedClass?.sections || [];

  // ─── Loading ───────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}</div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  // ─── Student/Parent View ───────────────────────────────────
  if (isStudent || isParent) {
    const attendanceMapData: Record<string, string> = {};
    records.forEach((r) => {
      const dateStr = r.date ? format(new Date(r.date), "yyyy-MM-dd") : "";
      if (dateStr) attendanceMapData[dateStr] = r.status;
    });
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const presentDays = records.filter((r) => r.status === "present" || r.status === "late").length;
    const absentDays = records.filter((r) => r.status === "absent").length;
    const percentage = records.length > 0 ? Math.round((presentDays / records.length) * 100) : 0;

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{isParent ? "Children&apos;s Attendance" : "My Attendance"}</h1>
            <p className="text-sm text-slate-500 mt-1">{isParent ? "View your children's attendance" : "View your attendance record"}</p>
          </div>
          <Button variant="outline" onClick={() => window.print()} className="min-w-[44px] min-h-[44px] print:hidden"><Printer className="w-4 h-4 mr-2" />Print</Button>
        </div>

        {error && (
          <div className="flex items-center gap-3 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm"><AlertTriangle className="w-5 h-5 flex-shrink-0" />{error}</div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="py-4 border-l-4 border-l-emerald-500"><CardContent className="px-4 pb-0 pt-0"><p className="text-xs font-medium text-slate-500">Present</p><p className="text-2xl font-bold text-emerald-600">{presentDays}</p></CardContent></Card>
          <Card className="py-4 border-l-4 border-l-red-500"><CardContent className="px-4 pb-0 pt-0"><p className="text-xs font-medium text-slate-500">Absent</p><p className="text-2xl font-bold text-red-600">{absentDays}</p></CardContent></Card>
          <Card className="py-4 border-l-4 border-l-amber-500"><CardContent className="px-4 pb-0 pt-0"><p className="text-xs font-medium text-slate-500">Late</p><p className="text-2xl font-bold text-amber-600">{records.filter((r) => r.status === "late").length}</p></CardContent></Card>
          <Card className="py-4 border-l-4 border-l-blue-500"><CardContent className="px-4 pb-0 pt-0"><p className="text-xs font-medium text-slate-500">Percentage</p><p className={`text-2xl font-bold ${percentage >= 75 ? "text-emerald-600" : percentage >= 50 ? "text-amber-600" : "text-red-600"}`}>{percentage}%</p></CardContent></Card>
        </div>

        {/* Calendar */}
        <Card className="gap-4">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="min-w-[44px] min-h-[44px]"><ChevronLeft className="w-4 h-4" /></Button>
                <CardTitle className="text-base font-semibold">{format(currentMonth, "MMMM yyyy")}</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="min-w-[44px] min-h-[44px]"><ChevronRight className="w-4 h-4" /></Button>
              </div>
              <div className="flex gap-2">
                <span className="flex items-center gap-1 text-xs"><span className="w-3 h-3 rounded bg-emerald-500" /> Present</span>
                <span className="flex items-center gap-1 text-xs"><span className="w-3 h-3 rounded bg-red-500" /> Absent</span>
                <span className="flex items-center gap-1 text-xs"><span className="w-3 h-3 rounded bg-amber-500" /> Late</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-7 gap-1">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                <div key={d} className="text-center text-xs font-semibold text-slate-400 py-2">{d}</div>
              ))}
              {Array.from({ length: (monthStart.getDay() + 6) % 7 }).map((_, i) => <div key={`empty-${i}`} />)}
              {days.map((day) => {
                const dateStr = format(day, "yyyy-MM-dd");
                const status = attendanceMapData[dateStr];
                const today = isToday(day);
                return (
                  <div key={dateStr} className={`text-center py-2 rounded-lg text-xs font-medium ${today ? "ring-2 ring-emerald-500" : ""} ${status ? STATUS_COLORS[status] : "text-slate-300 bg-slate-50"}`}>
                    {status ? STATUS_LABELS[status] : format(day, "d")}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* TODO: Parent view - child selector dropdown */}
      </div>
    );
  }

  // ─── Teacher/Admin View ────────────────────────────────────
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Attendance</h1>
        <p className="text-sm text-slate-500 mt-1">{isAdmin ? "Manage attendance for all classes" : "Record daily student attendance for your classes"}</p>
      </div>

      {/* Filters */}
      <Card className="gap-4">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Class</Label>
              <Select value={selectedClassId} onValueChange={(v) => { setSelectedClassId(v); setSelectedSectionId(""); }}>
                <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                <SelectContent>{classes.map((c) => <SelectItem key={c.class_id} value={String(c.class_id)}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Section</Label>
              <Select value={selectedSectionId} onValueChange={setSelectedSectionId}>
                <SelectTrigger><SelectValue placeholder="Select section" /></SelectTrigger>
                <SelectContent>{sections.map((s) => <SelectItem key={s.section_id} value={String(s.section_id)}>{s.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Date</Label>
              <Input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      {error && <div className="flex items-center gap-3 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm"><AlertTriangle className="w-5 h-5" />{error}</div>}
      {successMsg && <div className="flex items-center gap-3 p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm"><CheckCircle className="w-5 h-5" />{successMsg}</div>}

      {/* Student List */}
      {selectedClassId && selectedSectionId && (
        <Card className="gap-4">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center"><Users className="w-4 h-4 text-emerald-600" /></div>
                <CardTitle className="text-base font-semibold">Students ({students.length})</CardTitle>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={markAllPresent}>All Present</Button>
                <Button variant="outline" size="sm" onClick={markAllAbsent}>All Absent</Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {students.length === 0 ? (
              <div className="text-center py-12"><Users className="w-12 h-12 text-slate-300 mx-auto mb-3" /><p className="text-slate-400 text-sm">No students found</p></div>
            ) : (
              <>
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
                          <TableCell className="font-medium text-sm text-slate-900">{student.name || `${student.first_name} ${student.last_name}`.trim()}</TableCell>
                          <TableCell className="hidden sm:table-cell text-sm text-slate-500 font-mono">{student.student_code}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button variant={attendanceMap[student.student_id] === "present" ? "default" : "outline"} size="sm" className={`h-8 min-w-[44px] ${attendanceMap[student.student_id] === "present" ? "bg-emerald-600 hover:bg-emerald-700" : "text-emerald-700"}`} onClick={() => handleStatusChange(student.student_id, "present")}><CheckCircle className="w-3.5 h-3.5 sm:mr-1" /><span className="hidden sm:inline">P</span></Button>
                              <Button variant={attendanceMap[student.student_id] === "absent" ? "default" : "outline"} size="sm" className={`h-8 min-w-[44px] ${attendanceMap[student.student_id] === "absent" ? "bg-red-600 hover:bg-red-700" : "text-red-700"}`} onClick={() => handleStatusChange(student.student_id, "absent")}><XCircle className="w-3.5 h-3.5 sm:mr-1" /><span className="hidden sm:inline">A</span></Button>
                              <Button variant={attendanceMap[student.student_id] === "late" ? "default" : "outline"} size="sm" className={`h-8 min-w-[44px] ${attendanceMap[student.student_id] === "late" ? "bg-amber-600 hover:bg-amber-700" : "text-amber-700"}`} onClick={() => handleStatusChange(student.student_id, "late")}><span className="text-xs font-medium">L</span></Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <div className="flex justify-end mt-4">
                  <RequirePermission permission={PERMISSIONS.CAN_MANAGE_ATTENDANCE}>
                    <Button onClick={handleSave} disabled={isSaving || students.length === 0} className="bg-emerald-600 hover:bg-emerald-700 min-w-[44px] min-h-[44px]">
                      {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />} Save Attendance
                    </Button>
                  </RequirePermission>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {!selectedClassId && !isLoading && (
        <Card className="gap-4">
          <CardContent className="py-16">
            <div className="text-center"><Users className="w-16 h-16 text-slate-200 mx-auto mb-4" /><h3 className="text-lg font-medium text-slate-600">Select a class to begin</h3><p className="text-sm text-slate-400 mt-1">Choose a class and section above to mark attendance</p></div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
