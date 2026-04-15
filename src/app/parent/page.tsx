"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Users, GraduationCap, Receipt, ClipboardCheck, AlertTriangle, Loader2,
  FileText, CreditCard, Bell, BookOpen, Award, Megaphone, TrendingUp,
  UserCheck, BookMarked, CalendarDays, Library,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useAuth } from "@/hooks/use-auth";
import { format } from "date-fns";

// ─── Types ───────────────────────────────────────────────────
interface EnrollInfo {
  class_id: number;
  section_id: number;
  year: string;
  term: string;
  class: { class_id: number; name: string; name_numeric: number; teacher_id: number };
  section: { section_id: number; name: string };
}

interface ChildData {
  student_id: number;
  student_code: string;
  name: string;
  first_name: string;
  last_name: string;
  sex: string;
  birthday: string | null;
  mute: number;
  enrolls: EnrollInfo[];
}

interface NoticeItem {
  id: number;
  title: string;
  notice: string;
  timestamp: string | null;
}

interface DashboardData {
  parent: { parent_id: number; name: string; email: string; phone: string };
  children: ChildData[];
  stats: {
    totalChildren: number;
    activeChildren: number;
    inactiveChildren: number;
    presentToday: number;
    classMasterCount: number;
    subjectTeacherCount: number;
    totalBilled: number;
    totalPaid: number;
    totalDue: number;
  };
  feeBalances: Record<number, number>;
  attendanceSummary: Record<number, { present: number; absent: number; total: number; pct: number }>;
  notices: NoticeItem[];
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
  const { user, isLoading: authLoading, isParent } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    if (!user?.id) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/parent");
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
    if (!authLoading && isParent) fetchDashboard();
  }, [authLoading, isParent, fetchDashboard]);

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
            <Skeleton className="h-72 w-full rounded-xl" />
            <Skeleton className="h-72 w-full rounded-xl" />
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
          <Button onClick={fetchDashboard} variant="outline"><Loader2 className="w-4 h-4 mr-2" />Try Again</Button>
        </div>
      </DashboardLayout>
    );
  }

  if (!data) return null;
  const { children, stats, feeBalances, attendanceSummary, notices } = data;
  const activeChildren = children.filter(c => c.mute === 0);
  const avgAttendance = Object.values(attendanceSummary).length > 0
    ? Math.round(Object.values(attendanceSummary).reduce((s, a) => s + a.pct, 0) / Object.values(attendanceSummary).length)
    : 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* ─── Welcome Card ─────────────────────────────────── */}
        <Card className="bg-gradient-to-r from-emerald-600 to-teal-600 border-0 text-white overflow-hidden relative">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                  <Users className="w-7 h-7" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">Welcome, {data.parent.name || user?.name || "Parent"}!</h1>
                  <p className="text-emerald-100 mt-1">Monitor your children&apos;s academic progress</p>
                </div>
              </div>
              <p className="text-emerald-100 text-sm">{format(new Date(), "EEEE, MMMM d, yyyy")}</p>
            </div>
          </CardContent>
        </Card>

        {/* ─── Stat Cards ──────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="gap-4 py-3 border-l-4 border-l-emerald-500 hover:shadow-md transition-shadow">
            <CardContent className="px-4 pb-0 pt-0">
              <div className="flex items-start justify-between">
                <div className="space-y-1"><p className="text-[11px] font-medium text-slate-500 uppercase">My Children</p><p className="text-2xl font-bold text-emerald-600">{stats.activeChildren}</p><p className="text-[10px] text-slate-400">{stats.inactiveChildren} inactive</p></div>
                <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center"><Users className="w-4 h-4 text-emerald-600" /></div>
              </div>
            </CardContent>
          </Card>
          <Card className="gap-4 py-3 border-l-4 border-l-sky-500 hover:shadow-md transition-shadow">
            <CardContent className="px-4 pb-0 pt-0">
              <div className="flex items-start justify-between">
                <div className="space-y-1"><p className="text-[11px] font-medium text-slate-500 uppercase">Attendance</p><p className="text-2xl font-bold text-sky-600">{stats.presentToday}/{stats.activeChildren}</p><p className="text-[10px] text-slate-400">present today</p></div>
                <div className="w-9 h-9 rounded-xl bg-sky-100 flex items-center justify-center"><ClipboardCheck className="w-4 h-4 text-sky-600" /></div>
              </div>
            </CardContent>
          </Card>
          <Card className="gap-4 py-3 border-l-4 border-l-amber-500 hover:shadow-md transition-shadow">
            <CardContent className="px-4 pb-0 pt-0">
              <div className="flex items-start justify-between">
                <div className="space-y-1"><p className="text-[11px] font-medium text-slate-500 uppercase">Fee Balance</p><p className="text-2xl font-bold text-amber-600">{formatCurrency(stats.totalDue)}</p><p className="text-[10px] text-slate-400">{formatCurrency(stats.totalPaid)} paid</p></div>
                <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center"><Receipt className="w-4 h-4 text-amber-600" /></div>
              </div>
            </CardContent>
          </Card>
          <Card className="gap-4 py-3 border-l-4 border-l-violet-500 hover:shadow-md transition-shadow">
            <CardContent className="px-4 pb-0 pt-0">
              <div className="flex items-start justify-between">
                <div className="space-y-1"><p className="text-[11px] font-medium text-slate-500 uppercase">Teachers</p><p className="text-2xl font-bold text-violet-600">{stats.classMasterCount + stats.subjectTeacherCount}</p><p className="text-[10px] text-slate-400">{stats.classMasterCount} class masters</p></div>
                <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center"><UserCheck className="w-4 h-4 text-violet-600" /></div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ─── Children Cards & Notices ────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Children */}
          <Card className="gap-4">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <GraduationCap className="w-4 h-4 text-emerald-600" />
                  </div>
                  <CardTitle className="text-base font-semibold">My Children</CardTitle>
                </div>
                <Button variant="ghost" size="sm" className="text-xs text-emerald-600" onClick={() => router.push("/parent/children")}>View All</Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {activeChildren.length === 0 ? (
                <div className="text-center py-12">
                  <GraduationCap className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-400 text-sm">No active children linked to your account</p>
                  <p className="text-slate-300 text-xs mt-1">Contact the school administrator</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {activeChildren.map((child) => {
                    const enroll = child.enrolls?.[0];
                    const att = attendanceSummary[child.student_id];
                    const balance = feeBalances[child.student_id] || 0;
                    return (
                      <div key={child.student_id} className="p-4 rounded-lg border border-slate-200 hover:border-emerald-200 hover:bg-emerald-50/30 transition-all cursor-pointer" onClick={() => router.push("/parent/children")}>
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center flex-shrink-0">
                            <span className="text-white font-bold text-sm">{(child.first_name || child.name || "S").charAt(0).toUpperCase()}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-slate-900 truncate">{child.name || `${child.first_name} ${child.last_name}`.trim()}</p>
                            <p className="text-xs text-slate-500">
                              {enroll ? `${enroll.class.name} ${enroll.class.name_numeric} — ${enroll.section.name}` : "No class assigned"}
                            </p>
                          </div>
                          <Badge variant={att?.pct && att.pct >= 80 ? "default" : "secondary"} className={att?.pct && att.pct >= 80 ? "bg-emerald-100 text-emerald-700 text-xs" : "bg-amber-100 text-amber-700 text-xs"}>
                            {att ? `${att.pct}%` : "—"}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 mt-3 text-xs">
                          <span className="flex items-center gap-1 text-slate-500"><ClipboardCheck className="w-3.5 h-3.5" />{att ? `${att.present}/${att.total}` : "—"}</span>
                          <span className="flex items-center gap-1 text-slate-500"><Receipt className="w-3.5 h-3.5" />{balance > 0 ? formatCurrency(balance) : "Clear"}</span>
                          <span className="flex items-center gap-1 text-slate-500"><BookMarked className="w-3.5 h-3.5" />{enroll?.class?.name || "—"}</span>
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
                <Button variant="ghost" size="sm" className="text-xs text-amber-600" onClick={() => router.push("/parent/notices")}>View All</Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="max-h-80 overflow-y-auto space-y-3">
                {notices.length === 0 ? (
                  <div className="text-center py-12"><Bell className="w-12 h-12 text-slate-300 mx-auto mb-3" /><p className="text-slate-400 text-sm">No recent notices</p></div>
                ) : (
                  notices.map((notice) => (
                    <div key={notice.id} className="p-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => router.push("/parent/notices")}>
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-sm font-semibold text-slate-900">{notice.title}</h4>
                        {notice.timestamp && <span className="text-[10px] text-slate-400 whitespace-nowrap">{format(new Date(notice.timestamp), "MMM d")}</span>}
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
              <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center"><FileText className="w-4 h-4 text-slate-600" /></div>
              <CardTitle className="text-base font-semibold">Quick Links</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {[
                { icon: GraduationCap, label: "Children", href: "/parent/children", color: "emerald" },
                { icon: Award, label: "Results", href: "/parent/results", color: "violet" },
                { icon: CreditCard, label: "Payments", href: "/parent/payments", color: "amber" },
                { icon: TrendingUp, label: "Attendance", href: "/parent/attendance", color: "sky" },
                { icon: Megaphone, label: "Notices", href: "/parent/notices", color: "rose" },
                { icon: UserCheck, label: "Teachers", href: "/parent/teachers", color: "teal" },
                { icon: CalendarDays, label: "Timetable", href: "/parent/routine", color: "purple" },
                { icon: BookOpen, label: "Syllabus", href: "/parent/syllabus", color: "orange" },
                { icon: Library, label: "Library", href: "/parent/library", color: "cyan" },
              ].map((item) => (
                <Button key={item.href} variant="outline" className="h-auto py-3 flex flex-col items-center gap-2 rounded-xl border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all group" onClick={() => router.push(item.href)}>
                  <div className={`w-9 h-9 rounded-xl bg-${item.color}-100 group-hover:bg-${item.color}-200 flex items-center justify-center transition-colors`}>
                    <item.icon className="w-4 h-4 text-slate-600" />
                  </div>
                  <span className="text-[11px] font-medium text-slate-600">{item.label}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
