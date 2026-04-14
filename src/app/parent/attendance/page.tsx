"use client";

import { useEffect, useState, useCallback } from "react";
import {
  AlertTriangle,
  Calendar,
  Loader2,
  ClipboardCheck,
  Users,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameMonth, isSameDay, subMonths, addMonths } from "date-fns";

// ─── Types ───────────────────────────────────────────────────
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
  timestamp: string | null;
}

// ─── Helpers ─────────────────────────────────────────────────
const STATUS_STYLES: Record<string, string> = {
  present: "bg-emerald-200 text-emerald-800",
  absent: "bg-red-200 text-red-800",
  late: "bg-amber-200 text-amber-800",
};

const STATUS_LABELS: Record<string, string> = {
  present: "P",
  absent: "A",
  late: "L",
};

// ─── Main Component ──────────────────────────────────────────
export default function ParentAttendancePage() {
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStudents = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/students?limit=50");
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setStudents(data.students || []);
    } catch {
      setError("Failed to load children");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  const fetchAttendance = useCallback(async () => {
    if (!selectedStudent) { setRecords([]); return; }
    setIsLoading(true);
    setError(null);
    try {
      const start = format(startOfMonth(currentMonth), "yyyy-MM-dd");
      const end = format(endOfMonth(currentMonth), "yyyy-MM-dd");
      const res = await fetch(`/api/attendance?student_id=${selectedStudent}&date_from=${start}&date_to=${end}&limit=500`);
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setRecords(data.records || []);
    } catch {
      setError("Failed to load attendance");
    } finally {
      setIsLoading(false);
    }
  }, [selectedStudent, currentMonth]);

  useEffect(() => { fetchAttendance(); }, [fetchAttendance]);

  // ─── Build calendar data ──────────────────────────────────
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDayOfWeek = getDay(monthStart); // 0=Sun

  const attendanceMap = new Map<string, string>();
  records.forEach(r => {
    if (r.timestamp) {
      attendanceMap.set(format(new Date(r.timestamp), "yyyy-MM-dd"), r.status);
    }
  });

  const presentCount = records.filter(r => r.status === "present" || r.status === "late").length;
  const absentCount = records.filter(r => r.status === "absent").length;
  const totalRecorded = records.length;
  const pct = totalRecorded > 0 ? Math.round((presentCount / totalRecorded) * 100) : 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Attendance Report</h1>
          <p className="text-sm text-slate-500 mt-1">View monthly attendance records for your children</p>
        </div>

        {/* ─── Filters ────────────────────────────────────── */}
        <Card className="gap-4">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Select Child</Label>
                <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                  <SelectTrigger><SelectValue placeholder="Choose a child" /></SelectTrigger>
                  <SelectContent>
                    {students.map((s) => (
                      <SelectItem key={s.student_id} value={String(s.student_id)}>
                        {s.name || `${s.first_name} ${s.last_name}`.trim()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Month</Label>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" className="h-10 w-10 flex-shrink-0" onClick={() => setCurrentMonth(prev => subMonths(prev, 1))}>
                    &larr;
                  </Button>
                  <div className="flex-1 h-10 flex items-center justify-center rounded-md border border-slate-200 bg-white text-sm font-medium text-slate-900">
                    {format(currentMonth, "MMMM yyyy")}
                  </div>
                  <Button variant="outline" size="icon" className="h-10 w-10 flex-shrink-0" onClick={() => setCurrentMonth(prev => addMonths(prev, 1))}>
                    &rarr;
                  </Button>
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

        {selectedStudent && (
          <>
            {/* Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Card className="py-3 text-center"><CardContent className="px-3 pt-0 pb-0"><p className="text-xs text-slate-500">Days Present</p><p className="text-xl font-bold text-emerald-600">{presentCount}</p></CardContent></Card>
              <Card className="py-3 text-center"><CardContent className="px-3 pt-0 pb-0"><p className="text-xs text-slate-500">Days Absent</p><p className="text-xl font-bold text-red-600">{absentCount}</p></CardContent></Card>
              <Card className="py-3 text-center"><CardContent className="px-3 pt-0 pb-0"><p className="text-xs text-slate-500">Total Recorded</p><p className="text-xl font-bold text-slate-900">{totalRecorded}</p></CardContent></Card>
              <Card className="py-3 text-center"><CardContent className="px-3 pt-0 pb-0"><p className="text-xs text-slate-500">Attendance %</p><p className="text-xl font-bold text-blue-600">{pct}%</p></CardContent></Card>
            </div>

            {/* Calendar */}
            <Card className="gap-4">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center"><Calendar className="w-4 h-4 text-emerald-600" /></div>
                  <CardTitle className="text-base font-semibold">{format(currentMonth, "MMMM yyyy")} Calendar</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {isLoading ? (
                  <div className="space-y-3"><Skeleton className="h-8 w-full" /><Skeleton className="h-48 w-full" /></div>
                ) : (
                  <>
                    {/* Legend */}
                    <div className="flex flex-wrap gap-3 mb-4">
                      <div className="flex items-center gap-1.5"><div className="w-4 h-4 rounded bg-emerald-200" /><span className="text-xs text-slate-500">Present</span></div>
                      <div className="flex items-center gap-1.5"><div className="w-4 h-4 rounded bg-red-200" /><span className="text-xs text-slate-500">Absent</span></div>
                      <div className="flex items-center gap-1.5"><div className="w-4 h-4 rounded bg-amber-200" /><span className="text-xs text-slate-500">Late</span></div>
                      <div className="flex items-center gap-1.5"><div className="w-4 h-4 rounded bg-slate-100" /><span className="text-xs text-slate-500">No Data</span></div>
                    </div>
                    {/* Day Headers */}
                    <div className="grid grid-cols-7 gap-1">
                      {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
                        <div key={d} className="text-center text-xs font-semibold text-slate-500 py-2">{d}</div>
                      ))}
                    </div>
                    {/* Calendar Grid */}
                    <div className="grid grid-cols-7 gap-1">
                      {Array.from({ length: startDayOfWeek }).map((_, i) => (
                        <div key={`empty-${i}`} className="aspect-square" />
                      ))}
                      {daysInMonth.map(day => {
                        const dateStr = format(day, "yyyy-MM-dd");
                        const status = attendanceMap.get(dateStr);
                        const isWeekend = getDay(day) === 0 || getDay(day) === 6;
                        return (
                          <div
                            key={dateStr}
                            className={`aspect-square rounded-lg flex flex-col items-center justify-center text-xs font-medium transition-colors ${
                              isWeekend ? "bg-slate-50 text-slate-300" :
                              status ? STATUS_STYLES[status] || "bg-slate-100 text-slate-400" : "bg-slate-50 text-slate-400"
                            }`}
                            title={status ? `${format(day, "MMM d")}: ${status}` : `${format(day, "MMM d")}: No record`}
                          >
                            <span className="text-sm">{format(day, "d")}</span>
                            {status && !isWeekend && (
                              <span className="text-[10px] font-bold mt-0.5">{STATUS_LABELS[status]}</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {!selectedStudent && !isLoading && (
          <Card className="gap-4">
            <CardContent className="py-16">
              <div className="text-center">
                <TrendingUp className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-600">Select a child to view attendance</h3>
                <p className="text-sm text-slate-400 mt-1">Choose a child from the dropdown above</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
