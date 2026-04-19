"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  ClipboardCheck,
  Receipt,
  Calendar,
  Award,
  Loader2,
  AlertTriangle,
  Clock,
  FileText,
  TrendingUp,
  GraduationCap,
  User,
  Bell,
  LayoutDashboard,
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
interface DashboardData {
  student: {
    student_id: number;
    student_code: string;
    name: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    sex: string;
    birthday: string | null;
    address: string;
    admission_date: string | null;
    username: string;
    active_status: number;
  };
  parent: { parent_id: number; name: string; phone: string; email: string } | null;
  enroll: {
    class_id: number;
    section_id: number;
    year: string;
    term: string;
    class_name: string;
    class_numeric: number;
    section_name: string;
    class_category: string;
  } | null;
  recentMarks: {
    mark_id: number;
    mark_obtained: number;
    comment: string;
    subject: { subject_id: number; name: string } | null;
    exam: { exam_id: number; name: string } | null;
  }[];
  attendance: { present: number; total: number; percentage: number };
  invoices: {
    invoice_id: number;
    invoice_code: string;
    title: string;
    amount: number;
    amount_paid: number;
    due: number;
    status: string;
    creation_timestamp: string | null;
  }[];
  feeBalance: number;
  todayRoutines: {
    class_routine_id: number;
    time_start: string;
    time_end: string;
    day: string;
    room: string;
    section_id: number;
    section: { section_id: number; name: string };
  }[];
  notices: { id: number; title: string; notice: string; timestamp: string | null; create_timestamp: number }[];
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

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "GHS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

// ─── Full-Page Skeleton ─────────────────────────────────────
function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-slate-100">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-80 mt-2" />
      </div>
      <Skeleton className="h-36 w-full rounded-2xl" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="py-4">
            <CardContent className="px-4 pb-0 pt-0">
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-8 w-16" />
                </div>
                <Skeleton className="h-11 w-11 rounded-xl" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Skeleton className="h-80 w-full rounded-2xl" />
        <Skeleton className="h-80 w-full rounded-2xl" />
      </div>
      <Skeleton className="h-48 w-full rounded-2xl" />
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────
export default function StudentDashboard() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!user?.id) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/student/dashboard");
      if (!res.ok) throw new Error("Failed to load dashboard");
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error(err);
      setError("Unable to load dashboard data. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!authLoading) fetchData();
  }, [authLoading, fetchData]);

  const enrollment = data?.enroll;
  const feeBalance = data?.feeBalance || 0;
  const attendancePct = data?.attendance?.percentage || 0;
  const subjects = new Set(
    (data?.recentMarks || []).map((m) => m.subject?.name).filter(Boolean)
  ).size;

  // ─── Loading ───────────────────────────────────────────────
  if (authLoading || isLoading) {
    return (
      <DashboardLayout>
        <DashboardSkeleton />
      </DashboardLayout>
    );
  }

  // ─── Error ─────────────────────────────────────────────────
  if (error) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-slate-900">Something went wrong</h2>
          <p className="text-slate-500">{error}</p>
          <Button onClick={fetchData} variant="outline" className="min-h-[44px]">
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
        {/* ─── Page Header ─────────────────────────────────── */}
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className="w-11 h-11 rounded-xl bg-amber-500 flex items-center justify-center">
            <LayoutDashboard className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
            <p className="text-sm text-slate-500">Welcome back! Here&apos;s your overview.</p>
          </div>
        </div>

        {/* ─── Welcome Card ─────────────────────────────────── */}
        <Card className="bg-gradient-to-r from-amber-500 to-orange-500 border-0 text-white">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                  <GraduationCap className="w-7 h-7" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">
                    Welcome, {data?.student?.name || user?.name || "Student"}!
                  </h1>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    {enrollment && (
                      <Badge variant="secondary" className="bg-white/20 text-white hover:bg-white/30">
                        {enrollment.class_name} {enrollment.class_numeric} — {enrollment.section_name}
                      </Badge>
                    )}
                    {data?.student?.student_code && (
                      <Badge variant="secondary" className="bg-white/20 text-white hover:bg-white/30">
                        {data.student.student_code}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              <p className="text-amber-100 text-sm">{format(new Date(), "EEEE, MMMM d, yyyy")}</p>
            </div>
          </CardContent>
        </Card>

        {/* ─── Stat Cards ──────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="py-4 border-l-4 border-l-amber-500 hover:shadow-lg hover:-translate-y-0.5 transition-all">
            <CardContent className="px-4 pb-0 pt-0">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">My Subjects</p>
                  <p className="text-2xl font-bold text-slate-900 tabular-nums">{subjects}</p>
                </div>
                <div className="w-11 h-11 rounded-xl bg-amber-500 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="py-4 border-l-4 border-l-emerald-500 hover:shadow-lg hover:-translate-y-0.5 transition-all">
            <CardContent className="px-4 pb-0 pt-0">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Attendance</p>
                  <p className="text-2xl font-bold text-slate-900 tabular-nums">{attendancePct}%</p>
                </div>
                <div className="w-11 h-11 rounded-xl bg-emerald-500 flex items-center justify-center">
                  <ClipboardCheck className="w-5 h-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="py-4 border-l-4 border-l-red-500 hover:shadow-lg hover:-translate-y-0.5 transition-all">
            <CardContent className="px-4 pb-0 pt-0">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Fee Balance</p>
                  <p className="text-2xl font-bold text-slate-900 tabular-nums">{formatCurrency(feeBalance)}</p>
                </div>
                <div className="w-11 h-11 rounded-xl bg-red-500 flex items-center justify-center">
                  <Receipt className="w-5 h-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="py-4 border-l-4 border-l-violet-500 hover:shadow-lg hover:-translate-y-0.5 transition-all">
            <CardContent className="px-4 pb-0 pt-0">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Recent Marks</p>
                  <p className="text-2xl font-bold text-slate-900 tabular-nums">{data?.recentMarks?.length || 0}</p>
                </div>
                <div className="w-11 h-11 rounded-xl bg-violet-500 flex items-center justify-center">
                  <Award className="w-5 h-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ─── Results & Schedule & Notices ────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Results */}
          <Card className="gap-4">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-purple-600" />
                  </div>
                  <CardTitle className="text-base font-semibold">Recent Results</CardTitle>
                </div>
                <Button variant="ghost" size="sm" className="text-emerald-700" onClick={() => router.push("/student/results")}>
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="max-h-80 overflow-y-auto rounded-lg border border-slate-200">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50 hover:bg-slate-50">
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase">Subject</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase text-right">Score</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase text-right">Grade</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(!data?.recentMarks || data.recentMarks.length === 0) ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center text-slate-400 py-12">
                          No results available yet
                        </TableCell>
                      </TableRow>
                    ) : (
                      data.recentMarks.slice(0, 8).map((m) => (
                        <TableRow key={m.mark_id} className="hover:bg-slate-50">
                          <TableCell className="text-sm font-medium text-slate-900">{m.subject?.name || "N/A"}</TableCell>
                          <TableCell className="text-right font-semibold text-sm tabular-nums">{m.mark_obtained}</TableCell>
                          <TableCell className="text-right">
                            <Badge variant={m.mark_obtained >= 50 ? "default" : "destructive"}>
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

          {/* Today's Schedule */}
          <Card className="gap-4">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <Clock className="w-4 h-4 text-emerald-600" />
                  </div>
                  <CardTitle className="text-base font-semibold">Today&apos;s Schedule</CardTitle>
                </div>
                <Button variant="ghost" size="sm" className="text-emerald-700" onClick={() => router.push("/student/routine")}>
                  Full Routine
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="max-h-80 overflow-y-auto">
                {(!data?.todayRoutines || data.todayRoutines.length === 0) ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
                      <Calendar className="w-8 h-8 text-slate-400" />
                    </div>
                    <p className="text-slate-500 text-sm font-medium">No classes scheduled for today</p>
                    <p className="text-slate-400 text-xs mt-1">Enjoy your free time!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {data.todayRoutines.map((r, i) => (
                      <div key={r.class_routine_id} className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-xs font-bold text-emerald-700">
                          {i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900">Period {i + 1}</p>
                          <p className="text-xs text-slate-500">
                            {r.time_start?.substring(0, 5)} — {r.time_end?.substring(0, 5)} • Room: {r.room || "TBD"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ─── Recent Notices ───────────────────────────────── */}
        {data?.notices && data.notices.length > 0 && (
          <Card className="gap-4">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                    <Bell className="w-4 h-4 text-amber-600" />
                  </div>
                  <CardTitle className="text-base font-semibold">Recent Notices</CardTitle>
                </div>
                <Button variant="ghost" size="sm" className="text-emerald-700" onClick={() => router.push("/student/notices")}>
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {data.notices.slice(0, 3).map((n) => (
                  <div key={n.id} className="p-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors">
                    <h4 className="text-sm font-semibold text-slate-900">{n.title}</h4>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-1">{n.notice}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* ─── Quick Links ─────────────────────────────────── */}
        <Card className="gap-4">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                <FileText className="w-4 h-4 text-emerald-600" />
              </div>
              <CardTitle className="text-base font-semibold">Quick Links</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Button variant="outline" className="h-auto py-4 min-h-[44px] flex flex-col items-center gap-2.5 rounded-xl border-slate-200 hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700 transition-all group" onClick={() => router.push("/student/results")}>
                <div className="w-10 h-10 rounded-xl bg-slate-100 group-hover:bg-amber-100 flex items-center justify-center transition-colors">
                  <Award className="w-5 h-5" />
                </div>
                <span className="text-xs font-medium">View Results</span>
              </Button>
              <Button variant="outline" className="h-auto py-4 min-h-[44px] flex flex-col items-center gap-2.5 rounded-xl border-slate-200 hover:border-red-300 hover:bg-red-50 hover:text-red-700 transition-all group" onClick={() => router.push("/student/invoices")}>
                <div className="w-10 h-10 rounded-xl bg-slate-100 group-hover:bg-red-100 flex items-center justify-center transition-colors">
                  <Receipt className="w-5 h-5" />
                </div>
                <span className="text-xs font-medium">My Invoices</span>
              </Button>
              <Button variant="outline" className="h-auto py-4 min-h-[44px] flex flex-col items-center gap-2.5 rounded-xl border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 transition-all group" onClick={() => router.push("/student/routine")}>
                <div className="w-10 h-10 rounded-xl bg-slate-100 group-hover:bg-emerald-100 flex items-center justify-center transition-colors">
                  <Calendar className="w-5 h-5" />
                </div>
                <span className="text-xs font-medium">Class Routine</span>
              </Button>
              <Button variant="outline" className="h-auto py-4 min-h-[44px] flex flex-col items-center gap-2.5 rounded-xl border-slate-200 hover:border-sky-300 hover:bg-sky-50 hover:text-sky-700 transition-all group" onClick={() => router.push("/student/profile")}>
                <div className="w-10 h-10 rounded-xl bg-slate-100 group-hover:bg-blue-100 flex items-center justify-center transition-colors">
                  <User className="w-5 h-5" />
                </div>
                <span className="text-xs font-medium">My Profile</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
