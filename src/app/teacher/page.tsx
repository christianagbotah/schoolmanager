"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen, Users, ClipboardCheck, Award, Clock, FileText,
  GraduationCap, CheckSquare, Loader2, AlertTriangle, MessageSquare,
  Calendar, Bell, BarChart3, BookMarked, Megaphone, Bus, Star,
  TrendingUp, UserCheck, UserX,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useAuth } from "@/hooks/use-auth";
import { format } from "date-fns";

// ─── Types ───────────────────────────────────────────────────
interface TeacherClass {
  class_id: number;
  name: string;
  category: string;
  name_numeric: number;
  student_count: number;
  sections: { section_id: number; name: string }[];
  subjects: { subject_id: number; name: string }[];
  is_class_teacher: boolean;
}

interface TeacherSubject {
  subject_id: number;
  name: string;
  class?: { class_id: number; name: string; name_numeric: number };
  section?: { section_id: number; name: string };
}

interface DashboardNotice {
  id: number;
  title: string;
  notice?: string;
  timestamp: number | null;
  create_timestamp: number;
  is_pinned?: number;
  start_date?: string;
  end_date?: string;
}

interface StatData {
  totalClasses: number;
  totalSubjects: number;
  totalStudents: number;
  todayPresent: number;
  todayAbsent: number;
  unreadMessages: number;
}

interface RoutineItem {
  class_routine_id: number;
  day: string;
  time_start: string;
  time_end: string;
  room: string;
  subject?: { subject_id: number; name: string; teacher_id?: number };
  is_mine?: boolean;
  section?: { section_id: number; name: string };
}

// ─── Helpers ──────────────────────────────────────────────────
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
function getTodayName(): string {
  const d = new Date().getDay();
  return d >= 1 && d <= 5 ? DAYS[d - 1] : "Monday";
}

const ROUTINE_COLORS = [
  "bg-emerald-100 text-emerald-700 border-emerald-200",
  "bg-amber-100 text-amber-700 border-amber-200",
  "bg-purple-100 text-purple-700 border-purple-200",
  "bg-rose-100 text-rose-700 border-rose-200",
  "bg-cyan-100 text-cyan-700 border-cyan-200",
  "bg-orange-100 text-orange-700 border-orange-200",
  "bg-teal-100 text-teal-700 border-teal-200",
  "bg-pink-100 text-pink-700 border-pink-200",
];

// ─── Quick Action Button ─────────────────────────────────────
function QuickAction({ icon: Icon, label, path, badge, color = "emerald" }: {
  icon: React.ElementType; label: string; path: string; badge?: string; color?: string;
}) {
  const router = useRouter();
  const colorMap: Record<string, { iconBg: string; iconColor: string; hoverBg: string; hoverText: string; hoverBorder: string }> = {
    emerald: { iconBg: "bg-emerald-100", iconColor: "text-emerald-600", hoverBg: "hover:bg-emerald-50", hoverText: "hover:text-emerald-700", hoverBorder: "hover:border-emerald-300" },
    violet: { iconBg: "bg-violet-100", iconColor: "text-violet-600", hoverBg: "hover:bg-violet-50", hoverText: "hover:text-violet-700", hoverBorder: "hover:border-violet-300" },
    amber: { iconBg: "bg-amber-100", iconColor: "text-amber-600", hoverBg: "hover:bg-amber-50", hoverText: "hover:text-amber-700", hoverBorder: "hover:border-amber-300" },
    rose: { iconBg: "bg-rose-100", iconColor: "text-rose-600", hoverBg: "hover:bg-rose-50", hoverText: "hover:text-rose-700", hoverBorder: "hover:border-rose-300" },
    sky: { iconBg: "bg-sky-100", iconColor: "text-sky-600", hoverBg: "hover:bg-sky-50", hoverText: "hover:text-sky-700", hoverBorder: "hover:border-sky-300" },
    orange: { iconBg: "bg-orange-100", iconColor: "text-orange-600", hoverBg: "hover:bg-orange-50", hoverText: "hover:text-orange-700", hoverBorder: "hover:border-orange-300" },
  };
  const c = colorMap[color] || colorMap.emerald;

  return (
    <Button
      variant="outline"
      className={`h-auto py-4 flex flex-col items-center gap-2.5 rounded-xl border-slate-200 ${c.hoverBg} ${c.hoverText} ${c.hoverBorder} transition-all group`}
      onClick={() => router.push(path)}
    >
      <div className={`w-10 h-10 rounded-xl ${c.iconBg} flex items-center justify-center transition-colors`}>
        <Icon className={`w-5 h-5 ${c.iconColor}`} />
      </div>
      <span className="text-xs font-medium">{label}</span>
      {badge && <Badge className="text-[10px] bg-red-500 text-white px-1.5">{badge}</Badge>}
    </Button>
  );
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
          <Skeleton className="h-11 w-11 rounded-xl" />
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Component ──────────────────────────────────────────
export default function TeacherDashboard() {
  const router = useRouter();
  const { user, isLoading: authLoading, isTeacher } = useAuth();
  const [classes, setClasses] = useState<TeacherClass[]>([]);
  const [subjects, setSubjects] = useState<TeacherSubject[]>([]);
  const [notices, setNotices] = useState<DashboardNotice[]>([]);
  const [stats, setStats] = useState<StatData | null>(null);
  const [todayRoutines, setTodayRoutines] = useState<RoutineItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!authLoading && !isTeacher) {
      router.push("/dashboard");
      return;
    }
    if (authLoading || !isTeacher) return;

    setIsLoading(true);
    setError(null);
    try {
      const [dashRes, classesRes] = await Promise.all([
        fetch("/api/teacher/dashboard"),
        fetch("/api/teacher/classes"),
      ]);

      if (!dashRes.ok || !classesRes.ok) throw new Error("Failed to fetch data");

      const dashData = await dashRes.json();
      const classesData = await classesRes.json();

      setStats(dashData.stats);
      setClasses(classesData);
      setSubjects(dashData.subjects || []);
      setNotices(dashData.recentNotices || []);

      // Fetch routine for the first class teacher class
      const ctClasses = (classesData || []).filter((c: TeacherClass) => c.is_class_teacher && c.sections?.length > 0);
      if (ctClasses.length > 0) {
        const sectionId = ctClasses[0].sections[0].section_id;
        const routineRes = await fetch(`/api/teacher/routine?section_id=${sectionId}`);
        if (routineRes.ok) {
          const routineData = await routineRes.json();
          const todayName = getTodayName();
          const allRoutines = routineData.routines || [];
          setTodayRoutines(allRoutines.filter((r: RoutineItem) => r.day === todayName && r.is_mine).sort((a: RoutineItem, b: RoutineItem) => (a.time_start || "").localeCompare(b.time_start || "")));
        }
      }
    } catch (err) {
      console.error(err);
      setError("Unable to load dashboard data. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  }, [authLoading, isTeacher, router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const todayName = getTodayName();
  const totalStudents = classes.reduce((sum, c) => sum + (c.student_count || 0), 0);
  const classTeacherClasses = classes.filter(c => c.is_class_teacher);
  const attendanceRate = stats && stats.todayPresent + stats.todayAbsent > 0
    ? Math.round((stats.todayPresent / (stats.todayPresent + stats.todayAbsent)) * 100)
    : 0;

  // ─── Loading State ─────────────────────────────────────────
  if (authLoading || isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="space-y-1">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-28 w-full rounded-xl" />
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
          <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center">
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
        {/* ─── Page Header ────────────────────────────────── */}
        <div className="border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Teacher Dashboard</h1>
              <p className="text-sm text-slate-500">Your teaching overview and quick actions</p>
            </div>
          </div>
        </div>

        {/* ─── Welcome Card ─────────────────────────────────── */}
        <Card className="bg-gradient-to-r from-emerald-600 to-teal-600 border-0 text-white overflow-hidden relative">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-white" />
            <div className="absolute -right-4 -bottom-12 w-32 h-32 rounded-full bg-white" />
          </div>
          <CardContent className="p-6 relative">
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
                <Calendar className="w-3.5 h-3.5 mr-1.5" />
                {todayName}, {format(new Date(), "MMM d, yyyy")}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* ─── Quick Actions (matching CI3 dashboard) ────────── */}
        <Card className="gap-4">
          <CardHeader className="pb-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-emerald-600" />
              </div>
              <CardTitle className="text-base font-semibold">Quick Actions</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <QuickAction icon={CheckSquare} label="Attendance" path="/teacher/attendance" color="emerald" />
              <QuickAction icon={Award} label="Enter Marks" path="/teacher/marks/select" color="violet" />
              <QuickAction icon={Users} label="Students" path="/teacher/students" color="sky" />
              <QuickAction icon={Clock} label="Timetable" path="/teacher/routine" color="amber" />
              <QuickAction icon={MessageSquare} label="Messages" path="/teacher/messages" color="rose" badge={stats?.unreadMessages ? String(stats.unreadMessages) : undefined} />
              <QuickAction icon={FileText} label="Materials" path="/teacher/study-material" color="orange" />
            </div>
          </CardContent>
        </Card>

        {/* ─── Summary Stats ────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="gap-4 py-4 border-l-4 border-l-teal-500 hover:shadow-lg hover:-translate-y-0.5 transition-all">
            <CardContent className="px-4 pb-0 pt-0">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">My Classes</p>
                  <p className="text-2xl font-bold text-slate-900 tabular-nums">{classes.length}</p>
                  <p className="text-[10px] text-slate-400">{classTeacherClasses.length} as class teacher</p>
                </div>
                <div className="w-11 h-11 rounded-xl bg-teal-500 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="gap-4 py-4 border-l-4 border-l-amber-500 hover:shadow-lg hover:-translate-y-0.5 transition-all">
            <CardContent className="px-4 pb-0 pt-0">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">My Subjects</p>
                  <p className="text-2xl font-bold text-slate-900 tabular-nums">{subjects.length}</p>
                  <p className="text-[10px] text-slate-400">Teaching load</p>
                </div>
                <div className="w-11 h-11 rounded-xl bg-amber-500 flex items-center justify-center">
                  <GraduationCap className="w-5 h-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="gap-4 py-4 border-l-4 border-l-emerald-500 hover:shadow-lg hover:-translate-y-0.5 transition-all">
            <CardContent className="px-4 pb-0 pt-0">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Students</p>
                  <p className="text-2xl font-bold text-slate-900 tabular-nums">{totalStudents}</p>
                  <p className="text-[10px] text-slate-400">Across all classes</p>
                </div>
                <div className="w-11 h-11 rounded-xl bg-emerald-500 flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="gap-4 py-4 border-l-4 border-l-violet-500 hover:shadow-lg hover:-translate-y-0.5 transition-all">
            <CardContent className="px-4 pb-0 pt-0">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Today&apos;s Attendance</p>
                  <p className="text-2xl font-bold text-slate-900 tabular-nums">{stats?.todayPresent || 0}</p>
                  <div className="flex items-center gap-1">
                    <UserCheck className="w-3 h-3 text-emerald-500" />
                    <span className="text-[10px] text-emerald-600">{attendanceRate}%</span>
                  </div>
                </div>
                <div className="w-11 h-11 rounded-xl bg-violet-500 flex items-center justify-center">
                  <ClipboardCheck className="w-5 h-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ─── Class Teacher Per-Class Stats (matching CI3) ─── */}
        {classTeacherClasses.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
              <Star className="w-4 h-4 text-violet-600" />
              Class Teacher Overview
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {classTeacherClasses.map((cls) => (
                <Card key={cls.class_id} className="bg-gradient-to-br from-cyan-500 to-teal-600 border-0 text-white">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                        <Users className="w-5 h-5" />
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold">{cls.student_count || 0}</div>
                        <div className="text-xs opacity-80">Students</div>
                      </div>
                    </div>
                    <h3 className="text-sm font-semibold opacity-90">
                      {cls.name} — {cls.sections?.[0]?.name || ""}
                    </h3>
                    <div className="flex gap-2 mt-2">
                      <Badge className="bg-white/20 text-white text-[10px] border-0">
                        {cls.sections?.length || 0} sections
                      </Badge>
                      {cls.subjects && cls.subjects.length > 0 && (
                        <Badge className="bg-white/20 text-white text-[10px] border-0">
                          {cls.subjects.length} subjects
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* ─── Today's Schedule + Recent Notices ─────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Today's Schedule - with routine data */}
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
                  {todayName}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="max-h-96 overflow-y-auto">
                {todayRoutines.length > 0 ? (
                  <div className="space-y-3">
                    {todayRoutines.map((routine, idx) => (
                      <div
                        key={routine.class_routine_id}
                        className={`flex items-center gap-3 p-3 rounded-lg border ${ROUTINE_COLORS[idx % ROUTINE_COLORS.length]}`}
                      >
                        <div className="w-12 h-12 rounded-lg bg-white/60 flex flex-col items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold leading-tight">{routine.time_start?.substring(0, 5)}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{routine.subject?.name || "N/A"}</p>
                          <p className="text-xs opacity-75">
                            {routine.time_start?.substring(0, 5)} — {routine.time_end?.substring(0, 5)}
                          </p>
                          <p className="text-xs opacity-60">Room: {routine.room || "TBD"}</p>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {routine.section?.name && (
                            <Badge className="text-[10px] bg-white/60 border-0">{routine.section.name}</Badge>
                          )}
                          <Star className="w-3.5 h-3.5 fill-current" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : subjects.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
                      <GraduationCap className="w-8 h-8 text-slate-400" />
                    </div>
                    <p className="text-slate-400 text-sm">No classes assigned yet</p>
                    <p className="text-slate-300 text-xs mt-1">Contact admin to get started</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {subjects.slice(0, 8).map((subj, idx) => (
                      <div
                        key={subj.subject_id}
                        className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors"
                      >
                        <div className={`w-12 h-12 rounded-lg flex flex-col items-center justify-center flex-shrink-0 ${ROUTINE_COLORS[idx % ROUTINE_COLORS.length]}`}>
                          <span className="text-xs font-bold leading-tight">{idx + 1}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 truncate">{subj.name}</p>
                          <p className="text-xs text-slate-500 truncate">
                            {subj.class?.name || "N/A"}{subj.section?.name ? ` — Section ${subj.section.name}` : ""}
                          </p>
                        </div>
                      </div>
                    ))}
                    {subjects.length > 8 && (
                      <Button
                        variant="ghost"
                        className="w-full text-sm text-emerald-600"
                        onClick={() => router.push("/teacher/routine")}
                      >
                        View full timetable →
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Notices */}
          <Card className="gap-4">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                    <Megaphone className="w-4 h-4 text-amber-600" />
                  </div>
                  <CardTitle className="text-base font-semibold">
                    Recent Notices
                  </CardTitle>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-emerald-600"
                  onClick={() => router.push("/teacher/notices")}
                >
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="max-h-96 overflow-y-auto">
                {notices.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
                      <Megaphone className="w-8 h-8 text-slate-400" />
                    </div>
                    <p className="text-slate-400 text-sm">No notices</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {notices.slice(0, 5).map((notice) => (
                      <div
                        key={notice.id}
                        className="p-3 rounded-lg border border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors"
                        onClick={() => router.push("/teacher/notices")}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              {notice.is_pinned && <Bell className="w-3 h-3 text-amber-500 flex-shrink-0" />}
                              <p className="text-sm font-medium text-slate-900 truncate">{notice.title}</p>
                            </div>
                            <p className="text-xs text-slate-400 mt-0.5">
                              {notice.create_timestamp
                                ? format(new Date(notice.create_timestamp * 1000), "MMM d, yyyy")
                                : "—"}
                            </p>
                          </div>
                          {notice.start_date && (
                            <Badge variant="outline" className="text-[10px] text-amber-700 border-amber-200 flex-shrink-0">
                              <Calendar className="w-3 h-3 mr-1" />
                              {format(new Date(notice.start_date), "MMM d")}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ─── My Subjects Table (matching CI3) ─────────────── */}
        {subjects.length > 0 && (
          <Card className="gap-4">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center">
                  <GraduationCap className="w-4 h-4 text-violet-600" />
                </div>
                <CardTitle className="text-base font-semibold">My Subjects</CardTitle>
                <Badge variant="outline" className="ml-auto text-violet-700 border-violet-200">
                  {subjects.length} subjects
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="max-h-72 overflow-y-auto rounded-lg border border-slate-200">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50">
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-600 uppercase">Subject</th>
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-600 uppercase hidden sm:table-cell">Class</th>
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-600 uppercase hidden md:table-cell">Section</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subjects.map((subj) => (
                      <tr key={subj.subject_id} className="border-t border-slate-100 hover:bg-slate-50">
                        <td className="px-4 py-3 font-medium text-slate-900">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-violet-100 flex items-center justify-center flex-shrink-0">
                              <BookOpen className="w-3.5 h-3.5 text-violet-600" />
                            </div>
                            {subj.name}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-500 hidden sm:table-cell">
                          {subj.class?.name || "N/A"}
                        </td>
                        <td className="px-4 py-3 text-slate-500 hidden md:table-cell">
                          {subj.section?.name || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ─── My Classes Grid ─────────────────────────────── */}
        <Card className="gap-4">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center">
                  <BookOpen className="w-4 h-4 text-violet-600" />
                </div>
                <CardTitle className="text-base font-semibold">My Classes</CardTitle>
              </div>
              <Badge variant="outline" className="text-violet-700 border-violet-200">
                {classes.length} classes
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="max-h-72 overflow-y-auto">
              {classes.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
                    <BookOpen className="w-8 h-8 text-slate-400" />
                  </div>
                  <p className="text-slate-400 text-sm">No classes assigned</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {classes.map((cls) => (
                    <div
                      key={cls.class_id}
                      className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors"
                      onClick={() => router.push("/teacher/classes")}
                    >
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${cls.is_class_teacher ? "bg-violet-100" : "bg-slate-100"}`}>
                        <BookOpen className={`w-5 h-5 ${cls.is_class_teacher ? "text-violet-600" : "text-slate-400"}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">{cls.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-slate-400">{cls.student_count} students</span>
                          {cls.is_class_teacher && (
                            <Badge variant="secondary" className="bg-violet-100 text-violet-700 text-[10px] px-1.5 py-0">Class Teacher</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
