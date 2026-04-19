"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  AlertTriangle, Loader2, User, Phone, Mail, MapPin,
  GraduationCap, BookOpen, DollarSign, ClipboardCheck,
  Calendar, ArrowLeft, CreditCard,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useAuth } from "@/hooks/use-auth";

// ─── Types ───────────────────────────────────────────────────
interface StudentData {
  student_id: number;
  student_code: string;
  name: string;
  first_name: string;
  last_name: string;
  sex: string;
  birthday: string | null;
  email: string;
  phone: string;
  address: string;
  blood_group: string;
  religion: string;
  nationality: string;
  admission_date: string | null;
  active_status: number;
  parent: { name: string; phone: string; email: string; profession: string } | null;
  class_name: string;
  section_name: string;
  roll: string;
}

interface MarkItem {
  subject_name: string;
  exam_name: string;
  mark_obtained: number;
  comment: string;
}

interface InvoiceItem {
  invoice_id: number;
  title: string;
  amount: number;
  amount_paid: number;
  due: number;
  status: string;
  year: string;
  term: string;
}

// ─── Main Component ──────────────────────────────────────────
export default function TeacherStudentProfilePage() {
  const { isLoading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const studentId = params.id as string;

  const [student, setStudent] = useState<StudentData | null>(null);
  const [attendance, setAttendance] = useState({ present: 0, absent: 0, late: 0, total: 0, rate: 0 });
  const [marks, setMarks] = useState<MarkItem[]>([]);
  const [fees, setFees] = useState<{ invoices: InvoiceItem[]; total_fees: number; total_paid: number; total_due: number }>({ invoices: [], total_fees: 0, total_paid: 0, total_due: 0 });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ─── Fetch student data ───────────────────────────────────
  useEffect(() => {
    if (!studentId || authLoading) return;
    let cancelled = false;
    fetch(`/api/teacher/students/${studentId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load student");
        return res.json();
      })
      .then((data) => {
        if (cancelled) return;
        setStudent(data.student);
        setAttendance(data.attendance);
        setMarks(data.marks || []);
        setFees(data.fees || { invoices: [], total_fees: 0, total_paid: 0, total_due: 0 });
      })
      .catch((err) => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, [studentId, authLoading]);

  // ─── Loading ──────────────────────────────────────────────
  if (authLoading || isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-40 w-full rounded-xl" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="h-64 rounded-xl" />
            <Skeleton className="h-64 rounded-xl" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* ─── Header ─────────────────────────────────────── */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="min-w-[44px] min-h-[44px]">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Student Profile</h1>
            <p className="text-sm text-slate-500 mt-1">View student details and performance</p>
          </div>
          {student && (
            <Badge className={`${student.active_status === 1 ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
              {student.active_status === 1 ? "Active" : "Inactive"}
            </Badge>
          )}
        </div>

        {/* ─── Error ──────────────────────────────────────── */}
        {error && (
          <div className="flex items-center gap-3 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            {error}
          </div>
        )}

        {student && (
          <>
            {/* ─── Student Info Card ─────────────────────────── */}
            <Card className="bg-gradient-to-r from-emerald-600 to-teal-600 border-0 text-white">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <Avatar className="w-16 h-16 border-2 border-white/30">
                    <AvatarFallback className="bg-white/20 text-white text-xl font-bold">
                      {student.name?.charAt(0) || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold">{student.name}</h2>
                    <p className="text-emerald-100 text-sm font-mono">{student.student_code}</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <Badge className="bg-white/20 text-white border-0 text-xs">
                        {student.class_name} — {student.section_name}
                      </Badge>
                      <Badge className="bg-white/20 text-white border-0 text-xs">
                        {student.sex}
                      </Badge>
                      {student.roll && (
                        <Badge className="bg-white/20 text-white border-0 text-xs">
                          Roll: {student.roll}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ─── Summary Stats ─────────────────────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="gap-4 py-4 border-l-4 border-l-emerald-500">
                <CardContent className="px-4 pb-0 pt-0">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-slate-500">Attendance</p>
                      <p className="text-2xl font-bold text-emerald-600">{attendance.rate}%</p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                      <ClipboardCheck className="w-5 h-5 text-emerald-600" />
                    </div>
                  </div>
                  <Progress value={attendance.rate} className="mt-2 h-1.5" />
                </CardContent>
              </Card>
              <Card className="gap-4 py-4 border-l-4 border-l-violet-500">
                <CardContent className="px-4 pb-0 pt-0">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-slate-500">Marks Records</p>
                      <p className="text-2xl font-bold text-violet-600">{marks.length}</p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
                      <BookOpen className="w-5 h-5 text-violet-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="gap-4 py-4 border-l-4 border-l-amber-500">
                <CardContent className="px-4 pb-0 pt-0">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-slate-500">Total Fees</p>
                      <p className="text-2xl font-bold text-amber-600">{fees.total_fees.toLocaleString()}</p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-amber-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="gap-4 py-4 border-l-4 border-l-teal-500">
                <CardContent className="px-4 pb-0 pt-0">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-slate-500">Fees Due</p>
                      <p className={`text-2xl font-bold ${fees.total_due > 0 ? "text-red-600" : "text-teal-600"}`}>
                        {fees.total_due.toLocaleString()}
                      </p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-teal-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* ─── Info + Parent ─────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="gap-4">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                      <User className="w-4 h-4 text-emerald-600" />
                    </div>
                    <CardTitle className="text-base font-semibold">Personal Information</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-slate-500">Date of Birth</p>
                      <p className="font-medium text-slate-900">{student.birthday ? format(new Date(student.birthday), "MMM d, yyyy") : "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Blood Group</p>
                      <p className="font-medium text-slate-900">{student.blood_group || "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Religion</p>
                      <p className="font-medium text-slate-900">{student.religion || "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Nationality</p>
                      <p className="font-medium text-slate-900">{student.nationality || "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Admission Date</p>
                      <p className="font-medium text-slate-900">{student.admission_date ? format(new Date(student.admission_date), "MMM d, yyyy") : "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Roll</p>
                      <p className="font-medium text-slate-900">{student.roll || "—"}</p>
                    </div>
                    {student.address && (
                      <div className="col-span-2">
                        <p className="text-xs text-slate-500">Address</p>
                        <p className="font-medium text-slate-900">{student.address}</p>
                      </div>
                    )}
                    {student.email && (
                      <div>
                        <p className="text-xs text-slate-500">Email</p>
                        <p className="font-medium text-slate-900">{student.email}</p>
                      </div>
                    )}
                    {student.phone && (
                      <div>
                        <p className="text-xs text-slate-500">Phone</p>
                        <p className="font-medium text-slate-900">{student.phone}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="gap-4">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center">
                      <GraduationCap className="w-4 h-4 text-violet-600" />
                    </div>
                    <CardTitle className="text-base font-semibold">Parent / Guardian</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {student.parent ? (
                    <div className="space-y-3 text-sm">
                      <div>
                        <p className="text-xs text-slate-500">Name</p>
                        <p className="font-medium text-slate-900">{student.parent.name || "—"}</p>
                      </div>
                      {student.parent.phone && (
                        <div>
                          <p className="text-xs text-slate-500">Phone</p>
                          <p className="font-medium text-slate-900">{student.parent.phone}</p>
                        </div>
                      )}
                      {student.parent.email && (
                        <div>
                          <p className="text-xs text-slate-500">Email</p>
                          <p className="font-medium text-slate-900">{student.parent.email}</p>
                        </div>
                      )}
                      {student.parent.profession && (
                        <div>
                          <p className="text-xs text-slate-500">Profession</p>
                          <p className="font-medium text-slate-900">{student.parent.profession}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-400 text-center py-8">No parent/guardian information available</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* ─── Attendance Details ────────────────────────── */}
            <Card className="gap-4">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <ClipboardCheck className="w-4 h-4 text-emerald-600" />
                  </div>
                  <CardTitle className="text-base font-semibold">Attendance Summary</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 border border-emerald-100">
                    <div className="w-8 h-8 rounded-lg bg-emerald-200 flex items-center justify-center">
                      <span className="text-xs font-bold text-emerald-700">{attendance.present}</span>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Present</p>
                      <p className="text-sm font-semibold text-emerald-700">{attendance.total > 0 ? Math.round((attendance.present / attendance.total) * 100) : 0}%</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-100">
                    <div className="w-8 h-8 rounded-lg bg-red-200 flex items-center justify-center">
                      <span className="text-xs font-bold text-red-700">{attendance.absent}</span>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Absent</p>
                      <p className="text-sm font-semibold text-red-700">{attendance.total > 0 ? Math.round((attendance.absent / attendance.total) * 100) : 0}%</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 border border-amber-100">
                    <div className="w-8 h-8 rounded-lg bg-amber-200 flex items-center justify-center">
                      <span className="text-xs font-bold text-amber-700">{attendance.late}</span>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Late</p>
                      <p className="text-sm font-semibold text-amber-700">{attendance.total > 0 ? Math.round((attendance.late / attendance.total) * 100) : 0}%</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-sky-50 border border-sky-100">
                    <div className="w-8 h-8 rounded-lg bg-sky-200 flex items-center justify-center">
                      <span className="text-xs font-bold text-sky-700">{attendance.total}</span>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Total Days</p>
                      <p className="text-sm font-semibold text-sky-700">recorded</p>
                    </div>
                  </div>
                </div>
                <Progress value={attendance.rate} className="h-2" />
              </CardContent>
            </Card>

            {/* ─── Marks ─────────────────────────────────────── */}
            <Card className="gap-4">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center">
                    <BookOpen className="w-4 h-4 text-violet-600" />
                  </div>
                  <CardTitle className="text-base font-semibold">Recent Marks</CardTitle>
                  <Badge variant="outline" className="ml-auto text-violet-700 border-violet-200">{marks.length} records</Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {marks.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-8">No marks records available</p>
                ) : (
                  <div className="max-h-64 overflow-y-auto rounded-lg border border-slate-200">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50 hover:bg-slate-50">
                          <TableHead className="text-xs font-semibold text-slate-600 uppercase">Subject</TableHead>
                          <TableHead className="text-xs font-semibold text-slate-600 uppercase hidden sm:table-cell">Exam</TableHead>
                          <TableHead className="text-xs font-semibold text-slate-600 uppercase text-right">Score</TableHead>
                          <TableHead className="text-xs font-semibold text-slate-600 uppercase hidden md:table-cell">Comment</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {marks.slice(0, 20).map((m, i) => {
                          const score = m.mark_obtained;
                          const grade = score >= 80 ? "A" : score >= 70 ? "B" : score >= 60 ? "C" : score >= 50 ? "D" : "F";
                          const gradeColor = score >= 80 ? "bg-emerald-100 text-emerald-700" : score >= 60 ? "bg-blue-100 text-blue-700" : score >= 50 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700";
                          return (
                            <TableRow key={i} className="hover:bg-slate-50">
                              <TableCell className="font-medium text-sm">{m.subject_name}</TableCell>
                              <TableCell className="hidden sm:table-cell text-sm text-slate-500">{m.exam_name || "—"}</TableCell>
                              <TableCell className="text-right">
                                <span className="font-semibold text-sm">{score}</span>
                                <Badge className={`${gradeColor} ml-2 text-xs`}>{grade}</Badge>
                              </TableCell>
                              <TableCell className="hidden md:table-cell text-xs text-slate-500">{m.comment || "—"}</TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* ─── Fee Status ─────────────────────────────────── */}
            <Card className="gap-4">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                    <DollarSign className="w-4 h-4 text-amber-600" />
                  </div>
                  <CardTitle className="text-base font-semibold">Fee Status</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="p-3 rounded-lg bg-slate-50 border text-center">
                    <p className="text-xs text-slate-500">Total</p>
                    <p className="text-lg font-bold text-slate-900">{fees.total_fees.toLocaleString()}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-emerald-50 border text-center">
                    <p className="text-xs text-slate-500">Paid</p>
                    <p className="text-lg font-bold text-emerald-600">{fees.total_paid.toLocaleString()}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-red-50 border text-center">
                    <p className="text-xs text-slate-500">Due</p>
                    <p className={`text-lg font-bold ${fees.total_due > 0 ? "text-red-600" : "text-emerald-600"}`}>{fees.total_due.toLocaleString()}</p>
                  </div>
                </div>
                {fees.invoices.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-8">No invoice records available</p>
                ) : (
                  <div className="max-h-64 overflow-y-auto rounded-lg border border-slate-200">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50 hover:bg-slate-50">
                          <TableHead className="text-xs font-semibold text-slate-600 uppercase">Invoice</TableHead>
                          <TableHead className="text-xs font-semibold text-slate-600 uppercase text-right">Amount</TableHead>
                          <TableHead className="text-xs font-semibold text-slate-600 uppercase text-right">Paid</TableHead>
                          <TableHead className="text-xs font-semibold text-slate-600 uppercase text-right">Due</TableHead>
                          <TableHead className="text-xs font-semibold text-slate-600 uppercase text-center">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {fees.invoices.map((inv) => (
                          <TableRow key={inv.invoice_id} className="hover:bg-slate-50">
                            <TableCell className="text-sm">{inv.title}</TableCell>
                            <TableCell className="text-right text-sm">{inv.amount.toLocaleString()}</TableCell>
                            <TableCell className="text-right text-sm text-emerald-600">{inv.amount_paid.toLocaleString()}</TableCell>
                            <TableCell className="text-right text-sm text-red-600">{inv.due.toLocaleString()}</TableCell>
                            <TableCell className="text-center">
                              <Badge className={inv.status === "paid" ? "bg-emerald-100 text-emerald-700" : inv.due <= 0 ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}>
                                {inv.status === "paid" ? "Paid" : inv.due <= 0 ? "Paid" : "Unpaid"}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
