"use client";

import { useEffect, useState, useCallback } from "react";
import { format } from "date-fns";
import {
  AlertTriangle, CheckCircle, Loader2, Download, Printer,
  FileBarChart, Users, TrendingUp, CalendarDays,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useAuth } from "@/hooks/use-auth";

// ─── Types ───────────────────────────────────────────────────
interface ClassItem {
  class_id: number;
  name: string;
  category: string;
  sections: { section_id: number; name: string }[];
  is_class_teacher?: boolean;
}

interface StudentSummary {
  student_id: number;
  student_code: string;
  name: string;
  present: number;
  absent: number;
  late: number;
  sick_home: number;
  sick_clinic: number;
  percentage: number;
}

interface ReportStats {
  total_days: number;
  total_present: number;
  total_absent: number;
  total_late: number;
  total_sick_home: number;
  total_sick_clinic: number;
  attendance_rate: number;
  absent_rate: number;
}

// ─── Main Component ──────────────────────────────────────────
export default function TeacherAttendanceReportPage() {
  const { isLoading: authLoading } = useAuth();
  const [classes, setClasses] = useState<ClassItem[]>([]);

  const [selectedClassId, setSelectedClassId] = useState("all");
  const [selectedSectionId, setSelectedSectionId] = useState("all");
  const [dateFrom, setDateFrom] = useState(format(new Date(), "yyyy-MM-01"));
  const [dateTo, setDateTo] = useState(format(new Date(), "yyyy-MM-dd"));

  const [reportStats, setReportStats] = useState<ReportStats | null>(null);
  const [students, setStudents] = useState<StudentSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reportGenerated, setReportGenerated] = useState(false);

  // ─── Fetch classes ─────────────────────────────────────────
  useEffect(() => {
    if (!authLoading) {
      fetch("/api/teacher/classes")
        .then((r) => r.json())
        .then((d) => setClasses(d || []))
        .catch(() => setError("Failed to load classes"));
    }
  }, [authLoading]);

  const sections = selectedClassId !== "all"
    ? (classes.find((c) => c.class_id === parseInt(selectedClassId))?.sections || [])
    : [];

  // ─── Generate Report ──────────────────────────────────────
  const generateReport = useCallback(async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const params = new URLSearchParams({ start_date: dateFrom, end_date: dateTo });
      if (selectedClassId !== "all") params.set("class_id", selectedClassId);
      if (selectedSectionId !== "all") params.set("section_id", selectedSectionId);

      const res = await fetch(`/api/teacher/attendance/report?${params}`);
      if (!res.ok) throw new Error("Failed to generate report");
      const data = await res.json();

      setReportStats(data.data?.stats);
      setStudents(data.data?.students || []);
      setReportGenerated(true);
    } catch {
      setError("Failed to generate report. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  }, [dateFrom, dateTo, selectedClassId, selectedSectionId]);

  // ─── Export CSV ────────────────────────────────────────────
  const exportCSV = () => {
    if (students.length === 0) return;
    const headers = ["#", "Code", "Name", "Present", "Absent", "Late", "Sick-Home", "Sick-Clinic", "Rate"];
    const rows = students.map((s, i) => [
      i + 1, s.student_code, s.name, s.present, s.absent, s.late, s.sick_home, s.sick_clinic, s.percentage + "%",
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attendance_report_${dateFrom}_to_${dateTo}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const printReport = () => window.print();

  // ─── Loading State ─────────────────────────────────────────
  if (authLoading || isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-24 w-full" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-xl" />
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* ─── Header ─────────────────────────────────────── */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Attendance Report</h1>
          <p className="text-sm text-slate-500 mt-1">View attendance analytics for your classes</p>
        </div>

        {/* ─── Filters ────────────────────────────────────── */}
        <Card className="gap-4">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Class</Label>
                <Select value={selectedClassId} onValueChange={(v) => { setSelectedClassId(v); setSelectedSectionId("all"); }}>
                  <SelectTrigger><SelectValue placeholder="All Classes" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All My Classes</SelectItem>
                    {classes.map((c) => (
                      <SelectItem key={c.class_id} value={String(c.class_id)}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Section</Label>
                <Select value={selectedSectionId} onValueChange={setSelectedSectionId}>
                  <SelectTrigger><SelectValue placeholder="All Sections" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sections</SelectItem>
                    {sections.map((s) => (
                      <SelectItem key={s.section_id} value={String(s.section_id)}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
              </div>
            </div>
            <div className="flex justify-end mt-4">
              <Button
                onClick={generateReport}
                disabled={isGenerating}
                className="bg-emerald-600 hover:bg-emerald-700 min-w-[44px] min-h-[44px]"
              >
                {isGenerating ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <TrendingUp className="w-4 h-4 mr-2" />
                )}
                Generate Report
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* ─── Error ──────────────────────────────────────── */}
        {error && (
          <div className="flex items-center gap-3 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* ─── Report Content ─────────────────────────────── */}
        {reportGenerated && reportStats && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="gap-4 py-4 border-l-4 border-l-sky-500">
                <CardContent className="px-4 pb-0 pt-0">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-slate-500">Total School Days</p>
                      <p className="text-2xl font-bold text-sky-600">{reportStats.total_days}</p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-sky-100 flex items-center justify-center">
                      <CalendarDays className="w-5 h-5 text-sky-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="gap-4 py-4 border-l-4 border-l-emerald-500">
                <CardContent className="px-4 pb-0 pt-0">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-slate-500">Total Present</p>
                      <p className="text-2xl font-bold text-emerald-600">{reportStats.total_present}</p>
                      <p className="text-[10px] text-slate-400">{reportStats.attendance_rate}% rate</p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-emerald-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="gap-4 py-4 border-l-4 border-l-red-500">
                <CardContent className="px-4 pb-0 pt-0">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-slate-500">Total Absent</p>
                      <p className="text-2xl font-bold text-red-600">
                        {reportStats.total_absent + reportStats.total_sick_home + reportStats.total_sick_clinic}
                      </p>
                      <p className="text-[10px] text-slate-400">{reportStats.absent_rate}% rate</p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="gap-4 py-4 border-l-4 border-l-amber-500">
                <CardContent className="px-4 pb-0 pt-0">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-slate-500">Average Rate</p>
                      <p className="text-2xl font-bold text-amber-600">{reportStats.attendance_rate}%</p>
                      <p className="text-[10px] text-slate-400">daily average</p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-amber-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Student Details Table */}
            <Card className="gap-4">
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                      <Users className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div>
                      <CardTitle className="text-base font-semibold">Student Attendance</CardTitle>
                      <p className="text-xs text-slate-500">{students.length} students</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={printReport} className="min-w-[44px] min-h-[44px]">
                      <Printer className="w-3.5 h-3.5 mr-1" />
                      <span className="hidden sm:inline">Print</span>
                    </Button>
                    <Button variant="outline" size="sm" onClick={exportCSV} className="min-w-[44px] min-h-[44px]">
                      <Download className="w-3.5 h-3.5 mr-1" />
                      <span className="hidden sm:inline">Export</span>
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {students.length === 0 ? (
                  <div className="text-center py-12">
                    <FileBarChart className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-400 text-sm">No attendance data found</p>
                  </div>
                ) : (
                  <div className="max-h-[500px] overflow-y-auto rounded-lg border border-slate-200">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50 hover:bg-slate-50">
                          <TableHead className="text-xs font-semibold text-slate-600 uppercase">#</TableHead>
                          <TableHead className="text-xs font-semibold text-slate-600 uppercase">Student</TableHead>
                          <TableHead className="text-xs font-semibold text-slate-600 uppercase hidden md:table-cell">Code</TableHead>
                          <TableHead className="text-xs font-semibold text-slate-600 uppercase text-center">Present</TableHead>
                          <TableHead className="text-xs font-semibold text-slate-600 uppercase text-center">Absent</TableHead>
                          <TableHead className="text-xs font-semibold text-slate-600 uppercase text-center hidden lg:table-cell">Late</TableHead>
                          <TableHead className="text-xs font-semibold text-slate-600 uppercase text-center">Rate</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {students.map((s, i) => {
                          const rate = s.percentage;
                          const badgeClass = rate >= 90 ? "bg-emerald-100 text-emerald-700" : rate >= 75 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700";
                          return (
                            <TableRow key={s.student_id} className="hover:bg-slate-50">
                              <TableCell className="text-sm text-slate-500">{i + 1}</TableCell>
                              <TableCell className="font-medium text-sm text-slate-900">{s.name}</TableCell>
                              <TableCell className="hidden md:table-cell text-sm text-slate-500 font-mono">{s.student_code}</TableCell>
                              <TableCell className="text-center"><Badge className="bg-emerald-100 text-emerald-700">{s.present}</Badge></TableCell>
                              <TableCell className="text-center"><Badge className="bg-red-100 text-red-700">{s.absent}</Badge></TableCell>
                              <TableCell className="text-center hidden lg:table-cell"><Badge className="bg-amber-100 text-amber-700">{s.late}</Badge></TableCell>
                              <TableCell className="text-center"><Badge className={badgeClass}>{rate}%</Badge></TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {/* ─── Empty State ────────────────────────────────── */}
        {!reportGenerated && !error && (
          <Card className="gap-4">
            <CardContent className="py-16">
              <div className="text-center">
                <FileBarChart className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-600">Generate a Report</h3>
                <p className="text-sm text-slate-400 mt-1">Select filters and click &ldquo;Generate Report&rdquo; to view attendance analytics</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
