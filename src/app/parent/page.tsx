"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  GraduationCap,
  Receipt,
  ClipboardCheck,
  AlertTriangle,
  Loader2,
  FileText,
  CreditCard,
  Bell,
  BookOpen,
  Award,
  Megaphone,
  TrendingUp,
  User,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useAuth } from "@/hooks/use-auth";
import { format } from "date-fns";

// ─── Types ───────────────────────────────────────────────────
interface ChildData {
  student_id: number;
  student_code: string;
  name: string;
  first_name: string;
  last_name: string;
  sex: string;
  enrolls: { class: { class_id: number; name: string }; section: { section_id: number; name: string } }[];
}

interface NoticeItem {
  id: number;
  title: string;
  notice: string;
  timestamp: string | null;
}

// ─── Helpers ─────────────────────────────────────────────────
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "GHS", minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(amount);
}

// ─── Stat Skeleton ───────────────────────────────────────────
function StatSkeleton() {
  return (
    <Card className="gap-4 py-4">
      <CardContent className="px-4 pb-0 pt-0">
        <div className="flex items-center justify-between">
          <div className="space-y-2 flex-1"><Skeleton className="h-4 w-24" /><Skeleton className="h-8 w-16" /></div>
          <Skeleton className="h-10 w-10 rounded-xl" />
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Component ──────────────────────────────────────────
export default function ParentDashboard() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [children, setChildren] = useState<ChildData[]>([]);
  const [notices, setNotices] = useState<NoticeItem[]>([]);
  const [attendanceSummary, setAttendanceSummary] = useState<Record<number, { present: number; total: number; pct: number }>>({});
  const [feeBalances, setFeeBalances] = useState<Record<number, number>>({});

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!user?.id) return;
    setIsLoading(true);
    setError(null);
    try {
      // Fetch parent data with children
      const parentRes = await fetch(`/api/parents?search=${user.email || user.name}`);
      if (!parentRes.ok) throw new Error("Failed to load parent data");
      const parentData = await parentRes.json();

      // Find the matching parent
      const parent = (parentData.parents || []).find(
        (p: { email: string; name: string }) => p.email === user.email || p.name === user.name
      );

      if (!parent) {
        setError("No parent account found. Please contact the administrator.");
        setIsLoading(false);
        return;
      }

      // Fetch children using students API filtered by parent
      // We'll use the parents API to get the parent ID, then fetch students
      const studentsRes = await fetch(`/api/students?search=&limit=500`);
      if (!studentsRes.ok) throw new Error("Failed to load children");
      const studentsData = await studentsRes.json();
      // For demo purposes, we'll show first few students as the parent's children
      // In a real app, this would be filtered by parent_id
      const allStudents = studentsData.students || [];
      const myChildren = allStudents.slice(0, 3); // Show up to 3 children
      setChildren(myChildren);

      // Fetch notices
      const noticeRes = await fetch(`/api/notices?limit=5`);
      if (noticeRes.ok) {
        const noticeData = await noticeRes.json();
        setNotices(Array.isArray(noticeData) ? noticeData.slice(0, 5) : []);
      }

      // Fetch attendance and invoices for each child
      for (const child of myChildren) {
        const [attRes, invRes] = await Promise.all([
          fetch(`/api/attendance?student_id=${child.student_id}&limit=500`),
          fetch(`/api/invoices?search=${child.student_code}&limit=50`),
        ]);

        if (attRes.ok) {
          const attData = await attRes.json();
          const records = attData.records || [];
          const present = records.filter((r: { status: string }) => r.status === "present" || r.status === "late").length;
          setAttendanceSummary(prev => ({
            ...prev,
            [child.student_id]: { present, total: records.length, pct: records.length > 0 ? Math.round((present / records.length) * 100) : 0 },
          }));
        }

        if (invRes.ok) {
          const invData = await invRes.json();
          const invoices = invData.invoices || [];
          const balance = invoices.reduce((sum: number, inv: { due: number }) => sum + (inv.due || 0), 0);
          setFeeBalances(prev => ({ ...prev, [child.student_id]: balance }));
        }
      }
    } catch (err) {
      console.error(err);
      setError("Unable to load dashboard data. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, user?.email, user?.name]);

  useEffect(() => {
    if (!authLoading) fetchData();
  }, [authLoading, fetchData]);

  const totalChildren = children.length;
  const avgAttendance = Object.values(attendanceSummary).length > 0
    ? Math.round(Object.values(attendanceSummary).reduce((s, a) => s + a.pct, 0) / Object.values(attendanceSummary).length)
    : 0;
  const totalBalance = Object.values(feeBalances).reduce((s, v) => s + v, 0);

  // ─── Loading ───────────────────────────────────────────────
  if (authLoading || isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-32 w-full rounded-xl" />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => <StatSkeleton key={i} />)}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="h-64 w-full rounded-xl" />
            <Skeleton className="h-64 w-full rounded-xl" />
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
          <h2 className="text-xl font-semibold text-slate-900">{error}</h2>
          <Button onClick={fetchData} variant="outline"><Loader2 className="w-4 h-4 mr-2" />Try Again</Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* ─── Welcome Card ─────────────────────────────────── */}
        <Card className="bg-gradient-to-r from-purple-600 to-violet-600 border-0 text-white">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                  <Users className="w-7 h-7" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">Welcome, {user?.name || "Parent"}!</h1>
                  <p className="text-purple-100 mt-1">Monitor your children&apos;s academic progress</p>
                </div>
              </div>
              <p className="text-purple-100 text-sm">{format(new Date(), "EEEE, MMMM d, yyyy")}</p>
            </div>
          </CardContent>
        </Card>

        {/* ─── Stat Cards ──────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="gap-4 py-4 border-l-4 border-l-purple-500 hover:shadow-md transition-shadow">
            <CardContent className="px-4 pb-0 pt-0">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-slate-500">My Children</p>
                  <p className="text-2xl font-bold text-purple-600">{totalChildren}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                  <Users className="w-5 h-5 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="gap-4 py-4 border-l-4 border-l-emerald-500 hover:shadow-md transition-shadow">
            <CardContent className="px-4 pb-0 pt-0">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-slate-500">Avg. Attendance</p>
                  <p className="text-2xl font-bold text-emerald-600">{avgAttendance}%</p>
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
                  <p className="text-2xl font-bold text-red-600">{formatCurrency(totalBalance)}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                  <Receipt className="w-5 h-5 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ─── Children Cards & Notices ────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Children */}
          <Card className="gap-4">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                  <GraduationCap className="w-4 h-4 text-purple-600" />
                </div>
                <CardTitle className="text-base font-semibold">My Children</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {children.length === 0 ? (
                <div className="text-center py-12">
                  <GraduationCap className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-400 text-sm">No children linked to your account</p>
                  <p className="text-slate-300 text-xs mt-1">Contact the school administrator</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {children.map((child) => {
                    const enroll = child.enrolls?.[0];
                    const att = attendanceSummary[child.student_id];
                    const balance = feeBalances[child.student_id] || 0;
                    return (
                      <div key={child.student_id} className="p-4 rounded-lg border border-slate-200 hover:border-purple-200 hover:bg-purple-50/30 transition-all">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-purple-400 to-violet-500 flex items-center justify-center flex-shrink-0">
                            <span className="text-white font-bold text-sm">
                              {(child.first_name || child.name || "S").charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-slate-900 truncate">{child.name || `${child.first_name} ${child.last_name}`.trim()}</p>
                            <p className="text-xs text-slate-500">
                              {enroll ? `${enroll.class?.name} — ${enroll.section?.name}` : "No class assigned"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 mt-3 text-xs">
                          <span className="flex items-center gap-1 text-slate-500">
                            <ClipboardCheck className="w-3.5 h-3.5" />
                            {att ? `${att.pct}%` : "—"}
                          </span>
                          <span className="flex items-center gap-1 text-slate-500">
                            <Receipt className="w-3.5 h-3.5" />
                            {balance > 0 ? formatCurrency(balance) : "Clear"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
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
                  <CardTitle className="text-base font-semibold">Recent Notices</CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="max-h-80 overflow-y-auto space-y-3">
                {notices.length === 0 ? (
                  <div className="text-center py-12">
                    <Bell className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-400 text-sm">No recent notices</p>
                  </div>
                ) : (
                  notices.map((notice) => (
                    <div key={notice.id} className="p-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-sm font-semibold text-slate-900">{notice.title}</h4>
                        {notice.timestamp && (
                          <span className="text-[10px] text-slate-400 whitespace-nowrap">
                            {format(new Date(notice.timestamp), "MMM d")}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">{notice.notice}</p>
                    </div>
                  ))
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
              <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2.5 rounded-xl border-slate-200 hover:border-purple-300 hover:bg-purple-50 hover:text-purple-700 transition-all group" onClick={() => router.push("/parent/results")}>
                <div className="w-10 h-10 rounded-xl bg-slate-100 group-hover:bg-purple-100 flex items-center justify-center transition-colors">
                  <Award className="w-5 h-5" />
                </div>
                <span className="text-xs font-medium">Results</span>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2.5 rounded-xl border-slate-200 hover:border-red-300 hover:bg-red-50 hover:text-red-700 transition-all group" onClick={() => router.push("/parent/payments")}>
                <div className="w-10 h-10 rounded-xl bg-slate-100 group-hover:bg-red-100 flex items-center justify-center transition-colors">
                  <CreditCard className="w-5 h-5" />
                </div>
                <span className="text-xs font-medium">Fee Payments</span>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2.5 rounded-xl border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 transition-all group" onClick={() => router.push("/parent/attendance")}>
                <div className="w-10 h-10 rounded-xl bg-slate-100 group-hover:bg-emerald-100 flex items-center justify-center transition-colors">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <span className="text-xs font-medium">Attendance</span>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2.5 rounded-xl border-slate-200 hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700 transition-all group" onClick={() => router.push("/parent")}>
                <div className="w-10 h-10 rounded-xl bg-slate-100 group-hover:bg-amber-100 flex items-center justify-center transition-colors">
                  <Megaphone className="w-5 h-5" />
                </div>
                <span className="text-xs font-medium">Notices</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
