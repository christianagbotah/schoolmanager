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
interface StudentInfo {
  student_id: number;
  student_code: string;
  name: string;
  first_name: string;
  last_name: string;
  enrolls: { class: { class_id: number; name: string }; section: { section_id: number; name: string } }[];
}

interface MarkRecord {
  mark_id: number;
  mark_obtained: number;
  comment: string;
  subject: { subject_id: number; name: string };
  exam: { exam_id: number; name: string } | null;
}

interface RoutineItem {
  class_routine_id: number;
  time_start: string;
  time_end: string;
  day: string;
  room: string;
  section_id: number;
  section: { section_id: number; name: string };
}

interface InvoiceItem {
  invoice_id: number;
  invoice_code: string;
  title: string;
  amount: number;
  amount_paid: number;
  due: number;
  status: string;
  year: string;
  term: string;
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

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "GHS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

// ─── Stat Skeleton ───────────────────────────────────────────
function StatSkeleton() {
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
export default function StudentDashboard() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [studentInfo, setStudentInfo] = useState<StudentInfo | null>(null);
  const [recentMarks, setRecentMarks] = useState<MarkRecord[]>([]);
  const [routines, setRoutines] = useState<RoutineItem[]>([]);
  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
  const [attendanceData, setAttendanceData] = useState<{ present: number; total: number }>({ present: 0, total: 0 });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!user?.id) return;
    setIsLoading(true);
    setError(null);
    try {
      const [studentRes, marksRes] = await Promise.all([
        fetch(`/api/students/${user.id}`),
        fetch(`/api/marks?student_id=${user.id}&limit=10`),
      ]);

      if (!studentRes.ok) throw new Error("Failed to load student data");
      const studentData = await studentRes.json();
      setStudentInfo(studentData);

      if (marksRes.ok) {
        const marksData = await marksRes.json();
        setRecentMarks(marksData.marks || []);
      }

      // Get section from enroll
      const enroll = studentData.enrolls?.[0];
      if (enroll) {
        const sectionId = enroll.section?.section_id;

        // Fetch routine, invoices, attendance in parallel
        const [routineRes, invoiceRes, attRes] = await Promise.all([
          sectionId ? fetch(`/api/routine?section_id=${sectionId}`) : Promise.resolve(null),
          fetch(`/api/invoices?studentId=${user.id}&limit=10`),
          fetch(`/api/attendance?student_id=${user.id}&limit=500`),
        ]);

        if (routineRes?.ok) {
          const routineData = await routineRes.json();
          setRoutines(routineData.routines || []);
        }

        if (invoiceRes.ok) {
          const invoiceData = await invoiceRes.json();
          setInvoices(invoiceData.invoices || []);
        }

        if (attRes.ok) {
          const attData = await attRes.json();
          const records = attData.records || [];
          setAttendanceData({
            present: records.filter((r: { status: string }) => r.status === "present" || r.status === "late").length,
            total: records.length,
          });
        }
      }
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

  const todayName = DAYS[new Date().getDay() >= 1 && new Date().getDay() <= 5 ? new Date().getDay() - 1 : 0];
  const todayRoutines = routines.filter((r) => r.day === todayName);
  const feeBalance = invoices.reduce((sum, inv) => sum + (inv.due || 0), 0);
  const attendancePct = attendanceData.total > 0 ? Math.round((attendanceData.present / attendanceData.total) * 100) : 0;
  const enroll = studentInfo?.enrolls?.[0];

  // ─── Loading ───────────────────────────────────────────────
  if (authLoading || isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-32 w-full rounded-xl" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <StatSkeleton key={i} />)}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="h-80 w-full rounded-xl" />
            <Skeleton className="h-80 w-full rounded-xl" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ─── Error ─────────────────────────────────────────────────
  if (error) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-slate-900">Something went wrong</h2>
          <p className="text-slate-500">{error}</p>
          <Button onClick={fetchData} variant="outline"><Loader2 className="w-4 h-4 mr-2" />Try Again</Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
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
                    Welcome, {studentInfo?.name || user?.name || "Student"}!
                  </h1>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    {enroll && (
                      <Badge variant="secondary" className="bg-white/20 text-white hover:bg-white/30">
                        {enroll.class?.name} — {enroll.section?.name}
                      </Badge>
                    )}
                    {studentInfo?.student_code && (
                      <Badge variant="secondary" className="bg-white/20 text-white hover:bg-white/30">
                        {studentInfo.student_code}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              <p className="text-amber-100 text-sm">
                {format(new Date(), "EEEE, MMMM d, yyyy")}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* ─── Stat Cards ──────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="gap-4 py-4 border-l-4 border-l-amber-500 hover:shadow-md transition-shadow">
            <CardContent className="px-4 pb-0 pt-0">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-slate-500">My Subjects</p>
                  <p className="text-2xl font-bold text-amber-600">{recentMarks.length > 0 ? new Set(recentMarks.map(m => m.subject?.name).filter(Boolean)).size : 0}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="gap-4 py-4 border-l-4 border-l-emerald-500 hover:shadow-md transition-shadow">
            <CardContent className="px-4 pb-0 pt-0">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-slate-500">Attendance</p>
                  <p className="text-2xl font-bold text-emerald-600">{attendancePct}%</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <ClipboardCheck className="w-5 h-5 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="gap-4 py-4 border-l-4 border-l-red-500 hover:shadow-md transition-shadow">
            <CardContent className="px-4 pb-0 pt-0">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-slate-500">Fee Balance</p>
                  <p className="text-2xl font-bold text-red-600">{formatCurrency(feeBalance)}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                  <Receipt className="w-5 h-5 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="gap-4 py-4 border-l-4 border-l-purple-500 hover:shadow-md transition-shadow">
            <CardContent className="px-4 pb-0 pt-0">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-slate-500">Recent Marks</p>
                  <p className="text-2xl font-bold text-purple-600">{recentMarks.length}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                  <Award className="w-5 h-5 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ─── Results & Schedule ──────────────────────────── */}
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
                    {recentMarks.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center text-slate-400 py-12">
                          No results available yet
                        </TableCell>
                      </TableRow>
                    ) : (
                      recentMarks.slice(0, 8).map((m) => (
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
                {todayRoutines.length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-400 text-sm">No classes scheduled for today</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {todayRoutines.map((r, i) => (
                      <div key={r.class_routine_id} className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-xs font-bold text-emerald-700">
                          {i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900">Period {i + 1}</p>
                          <p className="text-xs text-slate-500">{r.time_start?.substring(0, 5)} — {r.time_end?.substring(0, 5)} • Room: {r.room || "TBD"}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

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
              <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2.5 rounded-xl border-slate-200 hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700 transition-all group" onClick={() => router.push("/student/results")}>
                <div className="w-10 h-10 rounded-xl bg-slate-100 group-hover:bg-amber-100 flex items-center justify-center transition-colors">
                  <Award className="w-5 h-5" />
                </div>
                <span className="text-xs font-medium">View Results</span>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2.5 rounded-xl border-slate-200 hover:border-red-300 hover:bg-red-50 hover:text-red-700 transition-all group" onClick={() => router.push("/student/invoices")}>
                <div className="w-10 h-10 rounded-xl bg-slate-100 group-hover:bg-red-100 flex items-center justify-center transition-colors">
                  <Receipt className="w-5 h-5" />
                </div>
                <span className="text-xs font-medium">My Invoices</span>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2.5 rounded-xl border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 transition-all group" onClick={() => router.push("/student/routine")}>
                <div className="w-10 h-10 rounded-xl bg-slate-100 group-hover:bg-emerald-100 flex items-center justify-center transition-colors">
                  <Calendar className="w-5 h-5" />
                </div>
                <span className="text-xs font-medium">Class Routine</span>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2.5 rounded-xl border-slate-200 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 transition-all group" onClick={() => router.push("/student/profile")}>
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
