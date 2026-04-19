"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  Printer,
  Loader2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Percent,
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
import { useAuth } from "@/hooks/use-auth";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, addMonths, subMonths } from "date-fns";

// ─── Types ───────────────────────────────────────────────────
interface AttendanceRecord {
  attendance_id: number;
  student_id: number;
  status: string;
  date: string;
}

// ─── Helpers ─────────────────────────────────────────────────
const STATUS_COLORS: Record<string, string> = {
  present: "bg-emerald-500 text-white",
  absent: "bg-red-500 text-white",
  late: "bg-amber-500 text-white",
};

const STATUS_LABELS: Record<string, string> = {
  present: "P",
  absent: "A",
  late: "L",
};

// ─── Main Component ──────────────────────────────────────────
export default function StudentAttendancePage() {
  const { user, isLoading: authLoading } = useAuth();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [term, setTerm] = useState("all");

  const fetchAttendance = useCallback(async () => {
    if (!user?.id) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/student/attendance`);
      if (res.ok) {
        const data = await res.json();
        setRecords(data.records || []);
      }
    } catch {
      setError("Failed to load attendance data");
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!authLoading) fetchAttendance();
  }, [authLoading, fetchAttendance]);

  // Build attendance map
  const attendanceMap: Record<string, string> = {};
  records.forEach((r) => {
    const dateStr = r.date ? format(new Date(r.date), "yyyy-MM-dd") : "";
    if (dateStr) attendanceMap[dateStr] = r.status;
  });

  // Calendar days
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Filter records by term if needed
  const filteredRecords = records;
  const totalDays = filteredRecords.length;
  const presentDays = filteredRecords.filter((r) => r.status === "present" || r.status === "late").length;
  const absentDays = filteredRecords.filter((r) => r.status === "absent").length;
  const lateDays = filteredRecords.filter((r) => r.status === "late").length;
  const percentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

  const handlePrint = () => window.print();

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="pb-4 border-b border-slate-100">
            <Skeleton className="h-8 w-56" />
            <Skeleton className="h-4 w-64 mt-2" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="py-4">
                <CardContent className="px-4 pb-0 pt-0">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-3 w-20" />
                      <Skeleton className="h-7 w-12" />
                    </div>
                    <Skeleton className="h-11 w-11 rounded-xl" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <Skeleton className="h-80 w-full rounded-2xl" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">My Attendance</h1>
            <p className="text-sm text-slate-500 mt-1">View your attendance record</p>
          </div>
          <Button variant="outline" onClick={handlePrint} className="min-w-[44px] min-h-[44px] print:hidden">
            <Printer className="w-4 h-4 mr-2" />Print
          </Button>
        </div>

        {error && (
          <div className="flex items-center gap-3 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />{error}
          </div>
        )}

        {/* ─── Stats ───────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="py-4 border-l-4 border-l-emerald-500 hover:shadow-lg hover:-translate-y-0.5 transition-all">
            <CardContent className="px-4 pb-0 pt-0">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Present</p>
                  <p className="text-2xl font-bold text-slate-900 tabular-nums">{presentDays}</p>
                </div>
                <div className="w-11 h-11 rounded-xl bg-emerald-500 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="py-4 border-l-4 border-l-red-500 hover:shadow-lg hover:-translate-y-0.5 transition-all">
            <CardContent className="px-4 pb-0 pt-0">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Absent</p>
                  <p className="text-2xl font-bold text-slate-900 tabular-nums">{absentDays}</p>
                </div>
                <div className="w-11 h-11 rounded-xl bg-red-500 flex items-center justify-center">
                  <XCircle className="w-5 h-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="py-4 border-l-4 border-l-amber-500 hover:shadow-lg hover:-translate-y-0.5 transition-all">
            <CardContent className="px-4 pb-0 pt-0">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Late</p>
                  <p className="text-2xl font-bold text-slate-900 tabular-nums">{lateDays}</p>
                </div>
                <div className="w-11 h-11 rounded-xl bg-amber-500 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="py-4 border-l-4 border-l-sky-500 hover:shadow-lg hover:-translate-y-0.5 transition-all">
            <CardContent className="px-4 pb-0 pt-0">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Percentage</p>
                  <p className="text-2xl font-bold text-slate-900 tabular-nums">{percentage}%</p>
                </div>
                <div className="w-11 h-11 rounded-xl bg-sky-500 flex items-center justify-center">
                  <Percent className="w-5 h-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ─── Calendar ────────────────────────────────────── */}
        <Card className="gap-4">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="min-w-[44px] min-h-[44px]">
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <CardTitle className="text-base font-semibold">
                  {format(currentMonth, "MMMM yyyy")}
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="min-w-[44px] min-h-[44px]">
                  <ChevronRight className="w-4 h-4" />
                </Button>
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
              {/* Offset for first day of month */}
              {Array.from({ length: (monthStart.getDay() + 6) % 7 }).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}
              {days.map((day) => {
                const dateStr = format(day, "yyyy-MM-dd");
                const status = attendanceMap[dateStr];
                const today = isToday(day);
                return (
                  <div
                    key={dateStr}
                    className={`text-center py-2 rounded-lg text-xs font-medium ${
                      today ? "ring-2 ring-emerald-500" : ""
                    } ${status ? STATUS_COLORS[status] : "text-slate-300 bg-slate-50"}`}
                  >
                    {status ? STATUS_LABELS[status] : format(day, "d")}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
