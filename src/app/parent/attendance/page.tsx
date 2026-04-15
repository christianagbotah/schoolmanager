"use client";

import { useEffect, useState, useCallback } from "react";
import {
  AlertTriangle, Calendar, Loader2, ClipboardCheck, TrendingUp, Users,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useAuth } from "@/hooks/use-auth";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay } from "date-fns";

interface ChildItem { student_id: number; name: string; first_name: string; last_name: string; student_code: string; }

interface AttendanceRecord {
  attendance_id: number; student_id: number; status: string; date: string; timestamp: string | null;
}

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const STATUS_STYLES: Record<string, string> = {
  "1": "bg-emerald-200 text-emerald-800",
  "2": "bg-red-200 text-red-800",
  "3": "bg-amber-200 text-amber-800",
  "4": "bg-purple-200 text-purple-800",
  "5": "bg-orange-200 text-orange-800",
};
const STATUS_LABELS: Record<string, string> = { "1": "P", "2": "A", "3": "L", "4": "SH", "5": "SC" };
const STATUS_NAMES: Record<string, string> = { "1": "Present", "2": "Absent", "3": "Late", "4": "Sick-Home", "5": "Sick-Clinic" };

export default function ParentAttendancePage() {
  const { isLoading: authLoading, isParent } = useAuth();
  const [children, setChildren] = useState<ChildItem[]>([]);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [summary, setSummary] = useState<Record<number, { present: number; absent: number; late: number; total: number; pct: number }>>({});
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [childListLoading, setChildListLoading] = useState(true);

  const fetchChildren = useCallback(async () => {
    setChildListLoading(true);
    try {
      const res = await fetch("/api/parent/children");
      if (res.ok) {
        const data = await res.json();
        const kids = (data.children || []).filter((c: { mute: number }) => c.mute === 0).map((c: ChildItem & { student_code: string }) => ({
          student_id: c.student_id,
          name: c.name || `${c.first_name} ${c.last_name}`.trim(),
          first_name: c.first_name,
          last_name: c.last_name,
          student_code: c.student_code,
        }));
        setChildren(kids);
        if (kids.length > 0) setSelectedStudent(String(kids[0].student_id));
      }
    } catch { setError("Failed to load children"); }
    finally { setChildListLoading(false); }
  }, []);

  useEffect(() => { if (!authLoading && isParent) fetchChildren(); }, [authLoading, isParent, fetchChildren]);

  const fetchAttendance = useCallback(async () => {
    if (!selectedStudent) { setRecords([]); return; }
    setIsLoading(true);
    setError(null);
    try {
      const monthStr = String(currentMonth + 1).padStart(2, "0");
      const res = await fetch(`/api/parent/attendance?student_id=${selectedStudent}&month=${monthStr}&year=${currentYear}`);
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setRecords(data.records || []);
      setSummary(data.summary || {});
    } catch { setError("Failed to load attendance"); }
    finally { setIsLoading(false); }
  }, [selectedStudent, currentMonth, currentYear]);

  useEffect(() => { fetchAttendance(); }, [fetchAttendance]);

  // Calendar
  const monthStart = startOfMonth(new Date(currentYear, currentMonth));
  const monthEnd = endOfMonth(new Date(currentYear, currentMonth));
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDayOfWeek = getDay(monthStart);

  const attendanceMap = new Map<string, string>();
  records.forEach(r => { if (r.date) attendanceMap.set(r.date, r.status); });

  const childSummary = selectedStudent ? summary[parseInt(selectedStudent)] : null;
  const presentCount = childSummary?.present || 0;
  const absentCount = childSummary?.absent || 0;
  const lateCount = childSummary?.late || 0;
  const totalRecorded = childSummary?.total || 0;
  const pct = childSummary?.pct || 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Attendance Report</h1>
          <p className="text-sm text-slate-500 mt-1">View monthly attendance records for your children</p>
        </div>

        {/* Filters */}
        <Card className="gap-4">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Select Child</Label>
                <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                  <SelectTrigger><SelectValue placeholder="Choose a child" /></SelectTrigger>
                  <SelectContent>
                    {children.map((s) => (
                      <SelectItem key={s.student_id} value={String(s.student_id)}>{s.name} ({s.student_code})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Month</Label>
                <Select value={String(currentMonth)} onValueChange={(v) => setCurrentMonth(parseInt(v))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {MONTHS.map((m, i) => <SelectItem key={i} value={String(i)}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Year</Label>
                <Select value={String(currentYear)} onValueChange={(v) => setCurrentYear(parseInt(v))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((y) => (
                      <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {error && <div className="flex items-center gap-3 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm"><AlertTriangle className="w-5 h-5 flex-shrink-0" />{error}</div>}

        {selectedStudent && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <Card className="py-3 text-center"><CardContent className="px-3 pt-0 pb-0"><p className="text-xs text-slate-500">Days Present</p><p className="text-xl font-bold text-emerald-600">{presentCount}</p></CardContent></Card>
              <Card className="py-3 text-center"><CardContent className="px-3 pt-0 pb-0"><p className="text-xs text-slate-500">Days Absent</p><p className="text-xl font-bold text-red-600">{absentCount}</p></CardContent></Card>
              <Card className="py-3 text-center"><CardContent className="px-3 pt-0 pb-0"><p className="text-xs text-slate-500">Late</p><p className="text-xl font-bold text-amber-600">{lateCount}</p></CardContent></Card>
              <Card className="py-3 text-center"><CardContent className="px-3 pt-0 pb-0"><p className="text-xs text-slate-500">Total Days</p><p className="text-xl font-bold text-slate-900">{totalRecorded}</p></CardContent></Card>
              <Card className="py-3 text-center"><CardContent className="px-3 pt-0 pb-0"><p className="text-xs text-slate-500">Rate</p><p className={`text-xl font-bold ${pct >= 80 ? "text-emerald-600" : pct >= 60 ? "text-amber-600" : "text-red-600"}`}>{pct}%</p></CardContent></Card>
            </div>

            {/* Calendar */}
            <Card className="gap-4">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center"><Calendar className="w-4 h-4 text-emerald-600" /></div>
                  <CardTitle className="text-base font-semibold">{MONTHS[currentMonth]} {currentYear}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {isLoading ? (
                  <div className="space-y-3"><Skeleton className="h-8 w-full" /><Skeleton className="h-48 w-full" /></div>
                ) : (
                  <>
                    <div className="flex flex-wrap gap-3 mb-4">
                      {Object.entries(STATUS_NAMES).map(([code, name]) => (
                        <div key={code} className="flex items-center gap-1.5">
                          <div className={`w-4 h-4 rounded ${STATUS_STYLES[code] || "bg-slate-100"}`} />
                          <span className="text-xs text-slate-500">{name}</span>
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                      {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
                        <div key={d} className="text-center text-xs font-semibold text-slate-500 py-2">{d}</div>
                      ))}
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                      {Array.from({ length: startDayOfWeek }).map((_, i) => <div key={`empty-${i}`} className="aspect-square" />)}
                      {daysInMonth.map(day => {
                        const dateStr = format(day, "yyyy-MM-dd");
                        const status = attendanceMap.get(dateStr);
                        const isWeekend = getDay(day) === 0 || getDay(day) === 6;
                        return (
                          <div key={dateStr} className={`aspect-square rounded-lg flex flex-col items-center justify-center text-xs font-medium transition-colors ${isWeekend ? "bg-slate-50 text-slate-300" : status ? STATUS_STYLES[status] || "bg-slate-100 text-slate-400" : "bg-slate-50 text-slate-400"}`} title={status ? `${format(day, "MMM d")}: ${STATUS_NAMES[status] || status}` : `${format(day, "MMM d")}: No record`}>
                            <span className="text-sm">{format(day, "d")}</span>
                            {status && !isWeekend && <span className="text-[10px] font-bold mt-0.5">{STATUS_LABELS[status]}</span>}
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

        {!selectedStudent && !childListLoading && (
          <Card className="gap-4"><CardContent className="py-16"><div className="text-center"><TrendingUp className="w-16 h-16 text-slate-200 mx-auto mb-4" /><h3 className="text-lg font-medium text-slate-600">Select a child to view attendance</h3></div></CardContent></Card>
        )}
      </div>
    </DashboardLayout>
  );
}
