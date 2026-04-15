"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen, Users, ClipboardCheck, Award, Clock, FileText,
  GraduationCap, CheckSquare, Loader2, AlertTriangle, Save,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
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
  class: { class_id: number; name: string; name_numeric: number };
  section: { section_id: number; name: string };
}

interface DashboardNotice {
  id: number;
  title: string;
  timestamp: number | null;
  create_timestamp: number;
}

interface StatData {
  totalClasses: number;
  totalSubjects: number;
  totalStudents: number;
  todayPresent: number;
  todayAbsent: number;
  unreadMessages: number;
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
  const { user, isLoading: authLoading, isTeacher } = useAuth();
  const [classes, setClasses] = useState<TeacherClass[]>([]);
  const [subjects, setSubjects] = useState<TeacherSubject[]>([]);
  const [notices, setNotices] = useState<DashboardNotice[]>([]);
  const [stats, setStats] = useState<StatData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    // If not a teacher, redirect
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
                  <p className="text-xs font-medium text-slate-500">My Subjects</p>
                  <p className="text-2xl font-bold text-blue-600">{subjects.length}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                  <GraduationCap className="w-5 h-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="gap-4 py-4 border-l-4 border-l-amber-500 hover:shadow-md transition-shadow">
            <CardContent className="px-4 pb-0 pt-0">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-slate-500">Total Students</p>
                  <p className="text-2xl font-bold text-amber-600">{totalStudents}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                  <Users className="w-5 h-5 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="gap-4 py-4 border-l-4 border-l-emerald-500 hover:shadow-md transition-shadow">
            <CardContent className="px-4 pb-0 pt-0">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-slate-500">Today&apos;s Attendance</p>
                  <p className="text-2xl font-bold text-emerald-600">
                    {stats?.todayPresent || 0}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <ClipboardCheck className="w-5 h-5 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ─── Schedule & Recent Notices ─────────────────────── */}
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
                  {todayName}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="max-h-96 overflow-y-auto">
                {classes.length === 0 && subjects.length === 0 ? (
                  <div className="text-center py-12">
                    <GraduationCap className="w-12 h-12 text-slate-300 mx-auto mb-3" />
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
                        <div className="w-12 h-12 rounded-lg bg-emerald-50 flex flex-col items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-emerald-700 leading-tight">{idx + 1}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 truncate">{subj.name}</p>
                          <p className="text-xs text-slate-500 truncate">
                            {subj.class?.name || "N/A"}{subj.section?.name ? ` — Section ${subj.section.name}` : ""}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Notices */}
          <Card className="gap-4">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                  <FileText className="w-4 h-4 text-amber-600" />
                </div>
                <CardTitle className="text-base font-semibold">
                  Recent Notices
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="max-h-96 overflow-y-auto">
                {notices.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-400 text-sm">No notices</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {notices.slice(0, 5).map((notice) => (
                      <div
                        key={notice.id}
                        className="p-3 rounded-lg border border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-slate-900 truncate">{notice.title}</p>
                            <p className="text-xs text-slate-400 mt-0.5">
                              {notice.create_timestamp
                                ? format(new Date(notice.create_timestamp * 1000), "MMM d, yyyy")
                                : "—"}
                            </p>
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

        {/* ─── My Classes ────────────────────────────────── */}
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
                  <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-400 text-sm">No classes assigned</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {classes.slice(0, 6).map((cls) => (
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
                onClick={() => router.push("/teacher/routine")}
              >
                <div className="w-10 h-10 rounded-xl bg-slate-100 group-hover:bg-emerald-100 flex items-center justify-center transition-colors">
                  <Clock className="w-5 h-5" />
                </div>
                <span className="text-xs font-medium">Timetable</span>
              </Button>

              <Button
                variant="outline"
                className="h-auto py-4 flex flex-col items-center gap-2.5 rounded-xl border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 transition-all group"
                onClick={() => router.push("/teacher/messages")}
              >
                <div className="w-10 h-10 rounded-xl bg-slate-100 group-hover:bg-emerald-100 flex items-center justify-center transition-colors">
                  <FileText className="w-5 h-5" />
                </div>
                <span className="text-xs font-medium">Messages{stats?.unreadMessages ? ` (${stats.unreadMessages})` : ""}</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
