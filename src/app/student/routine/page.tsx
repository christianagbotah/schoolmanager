"use client";

import { useEffect, useState, useCallback } from "react";
import {
  AlertTriangle,
  Calendar,
  Clock,
  Loader2,
  GraduationCap,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

// ─── Types ───────────────────────────────────────────────────
interface RoutineItem {
  class_routine_id: number;
  section_id: number;
  subject_id: number;
  time_start: string;
  time_end: string;
  day: string;
  room: string;
  section: { section_id: number; name: string };
  subject?: { subject_id: number; name: string };
}

interface StudentInfo {
  enrolls: { class: { class_id: number; name: string }; section: { section_id: number; name: string } }[];
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const PERIOD_COLORS = [
  "bg-emerald-100 text-emerald-700 border-emerald-200",
  "bg-blue-100 text-blue-700 border-blue-200",
  "bg-purple-100 text-purple-700 border-purple-200",
  "bg-amber-100 text-amber-700 border-amber-200",
  "bg-rose-100 text-rose-700 border-rose-200",
  "bg-cyan-100 text-cyan-700 border-cyan-200",
  "bg-orange-100 text-orange-700 border-orange-200",
  "bg-teal-100 text-teal-700 border-teal-200",
];

// ─── Main Component ──────────────────────────────────────────
export default function StudentRoutinePage() {
  const { user, isLoading: authLoading } = useAuth();
  const [routines, setRoutines] = useState<RoutineItem[]>([]);
  const [studentInfo, setStudentInfo] = useState<StudentInfo | null>(null);
  const [selectedSectionId, setSelectedSectionId] = useState("");
  const [sections, setSections] = useState<{ section_id: number; name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStudentData = useCallback(async () => {
    if (!user?.id) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/students/${user.id}`);
      if (!res.ok) throw new Error("Failed to load student data");
      const data = await res.json();
      setStudentInfo(data);

      const enrollSections = (data.enrolls || []).map(
        (e: { section: { section_id: number; name: string } }) => e.section
      );
      setSections(enrollSections);
      if (enrollSections.length > 0) {
        setSelectedSectionId(String(enrollSections[0].section_id));
      }
    } catch {
      setError("Failed to load student data");
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!authLoading) fetchStudentData();
  }, [authLoading, fetchStudentData]);

  // ─── Fetch routine when section changes ────────────────────
  const fetchRoutine = useCallback(async () => {
    if (!selectedSectionId) {
      setRoutines([]);
      return;
    }
    setError(null);
    try {
      const res = await fetch(`/api/routine?section_id=${selectedSectionId}`);
      if (!res.ok) throw new Error("Failed to load routine");
      const data = await res.json();
      setRoutines(data.routines || []);
    } catch {
      setError("Failed to load routine");
    }
  }, [selectedSectionId]);

  useEffect(() => {
    fetchRoutine();
  }, [fetchRoutine]);

  const getRoutinesForDay = (day: string) =>
    routines.filter((r) => r.day === day);

  const todayIdx = new Date().getDay() - 1;

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="space-y-4">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}</div>
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
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Class Routine</h1>
            <p className="text-sm text-slate-500 mt-1">Your weekly class timetable</p>
          </div>
          {sections.length > 1 && (
            <div className="space-y-2 w-full sm:w-48">
              <Select value={selectedSectionId} onValueChange={setSelectedSectionId}>
                <SelectTrigger>
                  <SelectValue placeholder="Section" />
                </SelectTrigger>
                <SelectContent>
                  {sections.map((s) => (
                    <SelectItem key={s.section_id} value={String(s.section_id)}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* ─── Error ───────────────────────────────────────── */}
        {error && (
          <div className="flex items-center gap-3 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />{error}
          </div>
        )}

        {/* ─── Weekly Timetable ───────────────────────────── */}
        {routines.length === 0 && !isLoading ? (
          <Card className="gap-4">
            <CardContent className="py-16">
              <div className="text-center">
                <Calendar className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-600">No routine available</h3>
                <p className="text-sm text-slate-400 mt-1">Your class routine has not been set up yet</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {DAYS.map((day, dayIdx) => {
              const dayRoutines = getRoutinesForDay(day);
              const isToday = dayIdx === todayIdx;
              return (
                <Card key={day} className={`gap-4 ${isToday ? "border-2 border-emerald-300 bg-emerald-50/30" : ""}`}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isToday ? "bg-emerald-200" : "bg-slate-100"}`}>
                          <Calendar className={`w-4 h-4 ${isToday ? "text-emerald-700" : "text-slate-500"}`} />
                        </div>
                        <CardTitle className="text-sm font-semibold">{day}</CardTitle>
                        {isToday && <Badge className="bg-emerald-600 text-white">Today</Badge>}
                      </div>
                      <span className="text-xs text-slate-400">{dayRoutines.length} periods</span>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {dayRoutines.length === 0 ? (
                      <p className="text-sm text-slate-400 py-2">No classes scheduled</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                        {dayRoutines.map((r, i) => (
                          <div
                            key={r.class_routine_id}
                            className={`p-3 rounded-lg border ${PERIOD_COLORS[i % PERIOD_COLORS.length]}`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-bold">Period {i + 1}</span>
                              <Clock className="w-3.5 h-3.5 opacity-60" />
                            </div>
                            <p className="text-sm font-semibold">{r.time_start?.substring(0, 5)} — {r.time_end?.substring(0, 5)}</p>
                            <p className="text-xs mt-1 opacity-75">Room: {r.room || "TBD"}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
