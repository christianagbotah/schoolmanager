"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Users,
  ClipboardCheck,
  Award,
  Clock,
  Loader2,
  AlertTriangle,
  CheckSquare,
  FileText,
  GraduationCap,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
interface TeacherClass {
  class_id: number;
  name: string;
  category: string;
  _count: { enrolls: number };
  sections: { section_id: number; name: string }[];
}

interface RoutineItem {
  class_routine_id: number;
  section_id: number;
  subject_id: number;
  time_start: string;
  time_end: string;
  day: string;
  room: string;
  section: { section_id: number; name: string };
}

interface MarkRecord {
  mark_id: number;
  mark_obtained: number;
  comment: string;
  student: { student_id: number; name: string; student_code: string };
  subject: { subject_id: number; name: string };
  class: { class_id: number; name: string };
  exam: { exam_id: number; name: string } | null;
}

// ─── Helper ──────────────────────────────────────────────────
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
function getTodayName(): string {
  const d = new Date().getDay();
  return d >= 1 && d <= 5 ? DAYS[d - 1] : "Monday";
}

function getGrade(score: number): string {
  if (score >= 90) return "A+";
  if (score >= 80) return "A";
  if (score >= 70) return "B";
  if (score >= 60) return "C";
  if (score >= 50) return "D";
  return "F";
}

// ─── Stat Card Skeleton ──────────────────────────────────────
function StatCardSkeleton() {
  return (
    <Card className="gap-4 py-4">
      <CardContent className="px-4 pb-0 pt-0">
        <div className="flex items-center justify-between">
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-16" />
          </div>
          <Skeleton className="h-10 w-10 rounded-xl" />
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Component ──────────────────────────────────────────
export default function TeacherDashboard() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [classes, setClasses] = useState<TeacherClass[]>([]);
  const [routines, setRoutines] = useState<RoutineItem[]>([]);
  const [recentMarks, setRecentMarks] = useState<MarkRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attendanceToday, setAttendanceToday] = useState(0);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [classesRes, marksRes] = await Promise.all([
        fetch("/api/classes"),
        fetch("/api/marks?limit=10"),
      ]);

      if (!classesRes.ok || !marksRes.ok) throw new Error("Failed to fetch data");

      const classesData = await classesRes.json();
      const marksData = await marksRes.json();

      const myClasses = (classesData || []).filter(
        (c: TeacherClass) => c.name !== ""
      );
      setClasses(myClasses);
      setRecentMarks(marksData.marks || []);

      // Get today's attendance
      const today = format(new Date(), "yyyy-MM-dd");
      const mySectionIds = myClasses.flatMap((c: TeacherClass) =>
        (c.sections || []).map((s) => s.section_id)
      );
      if (mySectionIds.length > 0) {
        const attRes = await fetch(`/api/attendance?date=${today}&limit=200`);
        if (attRes.ok) {
          const attData = await attRes.json();
          const filtered = (attData.records || []).filter((r: { section_id?: number }) =>
            mySectionIds.includes(r.section_id)
          );
          setAttendanceToday(filtered.length);
        }
      }

      // Fetch routine for teacher's sections
      if (mySectionIds.length > 0) {
        const routinePromises = mySectionIds.slice(0, 5).map((sid: number) =>
          fetch(`/api/routine?section_id=${sid}`).then((r) =>
            r.ok ? r.json() : { routines: [] }
          )
        );
        const routineResults = await Promise.all(routinePromises);
        const allRoutines = routineResults.flatMap(
          (r) => r.routines || []
        );
        setRoutines(allRoutines);
      }
    } catch (err) {
      console.error(err);
      setError("Unable to load dashboard data. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading) fetchData();
  }, [authLoading, fetchData]);

  const todayName = getTodayName();
  const todayRoutines = routines.filter((r) => r.day === todayName);
  const totalStudents = classes.reduce(
    (sum, c) => sum + (c._count?.enrolls || 0),
    0
  );

  // ─── Loading State ─────────────────────────────────────────
  if (authLoading || isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="space-y-1">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <StatCardSkeleton key={i} />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="h-80 w-full rounded-xl" />
            <Skeleton className="h-80 w-full rounded-xl" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ─── Error State ───────────────────────────────────────────
  if (error) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-slate-900">Something went wrong</h2>
          <p className="text-slate-500 text-center max-w-md">{error}</p>
          <Button onClick={fetchData} variant="outline" className="mt-2">
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
        {/* ─── Welcome Card ─────────────────────────────────── */}
        <Card className="bg-gradient-to-r from-emerald-600 to-teal-600 border-0 text-white">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold">
                  Welcome back, {user?.name || "Teacher"}!
                </h1>
                <p className="text-emerald-100 mt-1">
                  Here&apos;s your teaching overview for today
                </p>
              </div>
              <Badge variant="secondary" className="bg-white/20 text-white hover:bg-white/30 w-fit">
                {todayName}, {format(new Date(), "MMM d, yyyy")}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* ─── Stat Cards ──────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="gap-4 py-4 border-l-4 border-l-teal-500 hover:shadow-md transition-shadow">
            <CardContent className="px-4 pb-0 pt-0">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-slate-500">My Classes</p>
                  <p className="text-2xl font-bold text-teal-600">{classes.length}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-teal-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="gap-4 py-4 border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
            <CardContent className="px-4 pb-0 pt-0">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-slate-500">Total Students</p>
                  <p className="text-2xl font-bold text-blue-600">{totalStudents}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="gap-4 py-4 border-l-4 border-l-amber-500 hover:shadow-md transition-shadow">
            <CardContent className="px-4 pb-0 pt-0">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-slate-500">Today&apos;s Attendance</p>
                  <p className="text-2xl font-bold text-amber-600">{attendanceToday}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                  <ClipboardCheck className="w-5 h-5 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ─── Schedule & Recent Marks ─────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Today's Schedule */}
          <Card className="gap-4">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <Clock className="w-4 h-4 text-emerald-600" />
                  </div>
                  <CardTitle className="text-base font-semibold">
                    Today&apos;s Schedule
                  </CardTitle>
                </div>
                <Badge variant="outline" className="text-emerald-700 border-emerald-200">
                  {todayRoutines.length} classes
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="max-h-96 overflow-y-auto">
                {todayRoutines.length === 0 ? (
                  <div className="text-center py-12">
                    <GraduationCap className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-400 text-sm">No classes scheduled for today</p>
                    <p className="text-slate-300 text-xs mt-1">Enjoy your free time!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {todayRoutines.map((routine) => (
                      <div
                        key={routine.class_routine_id}
                        className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors"
                      >
                        <div className="w-12 h-12 rounded-lg bg-emerald-50 flex flex-col items-center justify-center flex-shrink-0">
                          <span className="text-xs font-medium text-emerald-700 leading-tight">
                            {routine.time_start?.substring(0, 5) || ""}
                          </span>
                          <span className="text-[10px] text-emerald-500">
                            {routine.time_end?.substring(0, 5) || ""}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 truncate">
                            Period
                          </p>
                          <p className="text-xs text-slate-500 truncate">
                            Section: {routine.section?.name || "N/A"} • Room: {routine.room || "TBD"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Marks Entered */}
          <Card className="gap-4">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                  <Award className="w-4 h-4 text-purple-600" />
                </div>
                <CardTitle className="text-base font-semibold">
                  Recent Marks Entered
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="max-h-96 overflow-y-auto rounded-lg border border-slate-200">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50 hover:bg-slate-50">
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase">
                        Student
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase hidden sm:table-cell">
                        Subject
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase text-right">
                        Score
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase text-right">
                        Grade
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentMarks.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-slate-400 py-12">
                          No marks entered yet
                        </TableCell>
                      </TableRow>
                    ) : (
                      recentMarks.map((m) => (
                        <TableRow key={m.mark_id} className="hover:bg-slate-50">
                          <TableCell className="font-medium text-sm text-slate-900">
                            {m.student?.name || "Unknown"}
                          </TableCell>
                          <TableCell className="hidden sm:table-cell text-sm text-slate-500">
                            {m.subject?.name || "N/A"}
                          </TableCell>
                          <TableCell className="text-right font-semibold text-sm tabular-nums">
                            {m.mark_obtained}
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge
                              variant={
                                m.mark_obtained >= 50 ? "default" : "destructive"
                              }
                            >
                              {getGrade(m.mark_obtained)}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ─── Quick Actions ───────────────────────────────── */}
        <Card className="gap-4">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                <FileText className="w-4 h-4 text-emerald-600" />
              </div>
              <CardTitle className="text-base font-semibold">Quick Actions</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Button
                variant="outline"
                className="h-auto py-4 flex flex-col items-center gap-2.5 rounded-xl border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 transition-all group"
                onClick={() => router.push("/teacher/attendance")}
              >
                <div className="w-10 h-10 rounded-xl bg-slate-100 group-hover:bg-emerald-100 flex items-center justify-center transition-colors">
                  <CheckSquare className="w-5 h-5" />
                </div>
                <span className="text-xs font-medium">Mark Attendance</span>
              </Button>

              <Button
                variant="outline"
                className="h-auto py-4 flex flex-col items-center gap-2.5 rounded-xl border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 transition-all group"
                onClick={() => router.push("/teacher/marks")}
              >
                <div className="w-10 h-10 rounded-xl bg-slate-100 group-hover:bg-emerald-100 flex items-center justify-center transition-colors">
                  <Award className="w-5 h-5" />
                </div>
                <span className="text-xs font-medium">Enter Marks</span>
              </Button>

              <Button
                variant="outline"
                className="h-auto py-4 flex flex-col items-center gap-2.5 rounded-xl border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 transition-all group"
                onClick={() => router.push("/teacher/profile")}
              >
                <div className="w-10 h-10 rounded-xl bg-slate-100 group-hover:bg-emerald-100 flex items-center justify-center transition-colors">
                  <Users className="w-5 h-5" />
                </div>
                <span className="text-xs font-medium">My Profile</span>
              </Button>

              <Button
                variant="outline"
                className="h-auto py-4 flex flex-col items-center gap-2.5 rounded-xl border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 transition-all group"
                onClick={() => router.push("/teacher/classes")}
              >
                <div className="w-10 h-10 rounded-xl bg-slate-100 group-hover:bg-emerald-100 flex items-center justify-center transition-colors">
                  <BookOpen className="w-5 h-5" />
                </div>
                <span className="text-xs font-medium">My Classes</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
