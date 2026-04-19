"use client";

import { useEffect, useState, useCallback } from "react";
import {
  AlertTriangle, CheckCircle, Loader2, ArrowUpCircle,
  Users, GraduationCap, ChevronRight, Info,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
  name_numeric: number;
  category: string;
  sections: { section_id: number; name: string }[];
  is_class_teacher?: boolean;
}

interface PromotionStudent {
  student_id: number;
  student_code: string;
  name: string;
  sex: string;
  section_id: number;
  section_name: string;
  already_enrolled: boolean;
}

interface PromotionData {
  fromClass: { class_id: number; name: string; name_numeric: number; category: string };
  toClass: { class_id: number; name: string; name_numeric: number; category: string };
  toSections: { section_id: number; name: string }[];
  students: PromotionStudent[];
  total: number;
  alreadyEnrolled: number;
  eligible: number;
}

// ─── Main Component ──────────────────────────────────────────
export default function TeacherPromotionPage() {
  const { isLoading: authLoading, hasPermission } = useAuth();
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [fromClassId, setFromClassId] = useState("");
  const [toClassId, setToClassId] = useState("");
  const [runningYear, setRunningYear] = useState(() => {
    const y = new Date().getFullYear();
    return `${y}-${y + 1}`;
  });
  const [promoting, setPromoting] = useState(false);
  const [promoted, setPromoted] = useState(false);
  const [promotionData, setPromotionData] = useState<PromotionData | null>(null);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [studentTargets, setStudentTargets] = useState<Record<number, number>>({});
  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // ─── Fetch classes ─────────────────────────────────────────
  useEffect(() => {
    if (!authLoading) {
      fetch("/api/teacher/classes")
        .then((r) => r.json())
        .then((d) => setClasses(d || []))
        .catch(() => {});
    }
  }, [authLoading]);

  const fromClass = classes.find((c) => String(c.class_id) === fromClassId);
  const fromGroup = fromClass?.category || "";
  const toGroupClasses = fromGroup
    ? classes
        .filter((c) => c.category === fromGroup)
        .sort((a, b) => a.name_numeric - b.name_numeric)
    : [];

  const runningYearParts = runningYear.split("-");
  const nextYear = runningYearParts[1]
    ? `${runningYearParts[1]}-${parseInt(runningYearParts[1]) + 1}`
    : "";

  // ─── Load Students ────────────────────────────────────────
  const fetchPromotionStudents = useCallback(async () => {
    if (!fromClassId || !toClassId) {
      setError("Select both source and target classes");
      return;
    }
    if (fromClassId === toClassId) {
      setError("Source and target classes cannot be the same");
      return;
    }
    setIsLoadingStudents(true);
    setError(null);
    setStep(2);
    try {
      const params = new URLSearchParams({
        fromClassId,
        toClassId,
        runningYear,
        promotionYear: nextYear,
      });
      const res = await fetch(`/api/teacher/students/promotion?${params}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setPromotionData(data);
      const targets: Record<number, number> = {};
      data.students.forEach((s: PromotionStudent) => {
        targets[s.student_id] = parseInt(toClassId);
      });
      setStudentTargets(targets);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load students");
    } finally {
      setIsLoadingStudents(false);
    }
  }, [fromClassId, toClassId, runningYear, nextYear]);

  // ─── Promote ──────────────────────────────────────────────
  const handlePromote = async () => {
    if (!promotionData) return;
    const promotions = promotionData.students
      .filter((s) => !s.already_enrolled)
      .map((s) => ({
        student_id: s.student_id,
        target_class_id: studentTargets[s.student_id] || parseInt(toClassId),
        section_id: 0,
      }));

    if (promotions.length === 0) {
      setError("No eligible students to promote");
      return;
    }

    setPromoting(true);
    setError(null);
    try {
      const res = await fetch("/api/teacher/students/promotion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromClassId,
          runningYear,
          promotionYear: nextYear,
          promotions,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setPromoted(true);
      setStep(3);
      setSuccessMsg(data.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to promote students");
    } finally {
      setPromoting(false);
    }
  };

  // ─── Check class teacher permission ───────────────────────
  const isClassTeacher = classes.some(
    (c) => c.class_id === parseInt(fromClassId) && c.is_class_teacher
  );

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* ─── Header ─────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Student Promotion</h1>
            <p className="text-sm text-slate-500 mt-1">Promote students to the next academic session</p>
          </div>
          {step > 1 && (
            <Button variant="outline" size="sm" onClick={() => { setStep(1); setPromotionData(null); setPromoted(false); }}>
              Reset
            </Button>
          )}
        </div>

        {/* ─── Step Indicator ─────────────────────────────── */}
        <div className="flex items-center gap-2">
          {["Select Classes", "Manage Students", "Complete"].map((label, i) => (
            <div key={i} className="flex items-center gap-2 flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                step > i + 1 ? "bg-emerald-600 text-white" : step === i + 1 ? "bg-violet-600 text-white" : "bg-slate-200 text-slate-500"
              }`}>
                {step > i + 1 ? <CheckCircle className="w-4 h-4" /> : i + 1}
              </div>
              <span className={`text-sm hidden sm:block ${step === i + 1 ? "text-slate-900 font-medium" : "text-slate-400"}`}>{label}</span>
              {i < 2 && <ChevronRight className="w-4 h-4 text-slate-300 hidden sm:block" />}
            </div>
          ))}
        </div>

        {/* ─── Success ────────────────────────────────────── */}
        {successMsg && (
          <div className="flex items-center gap-3 p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
            {successMsg}
          </div>
        )}

        {/* ─── Error ──────────────────────────────────────── */}
        {error && (
          <div className="flex items-center gap-3 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* ─── Step 1: Class Selection ─────────────────────── */}
        {step === 1 && (
          <>
            <Alert className="bg-sky-50 border-sky-200">
              <Info className="h-4 w-4 text-sky-600" />
              <AlertDescription className="text-sky-800 text-sm">
                Promoting students will create a new enrollment for the {nextYear} session.
                Only class teachers can promote students.
              </AlertDescription>
            </Alert>

            <Card className="gap-4">
              <CardHeader className="pb-0">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center">
                    <GraduationCap className="w-4 h-4 text-violet-600" />
                  </div>
                  <CardTitle className="text-base font-semibold">Promotion Settings</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Current Session</Label>
                      <Input value={runningYear} disabled />
                    </div>
                    <div className="space-y-2">
                      <Label>Promote To Session</Label>
                      <Input value={nextYear} disabled className="bg-slate-50" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Source Class *</Label>
                      <Select value={fromClassId} onValueChange={(v) => { setFromClassId(v); setToClassId(""); }}>
                        <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                        <SelectContent>
                          {classes
                            .filter((c) => c.is_class_teacher)
                            .map((c) => (
                              <SelectItem key={c.class_id} value={String(c.class_id)}>
                                {c.name} {c.name_numeric}
                              </SelectItem>
                            ))}
                          {classes.filter((c) => c.is_class_teacher).length === 0 && (
                            <div className="px-2 py-4 text-center text-sm text-slate-400">No class teacher assignments</div>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Target Class *</Label>
                      <Select value={toClassId} onValueChange={setToClassId}>
                        <SelectTrigger><SelectValue placeholder="Select target" /></SelectTrigger>
                        <SelectContent>
                          {toGroupClasses.length > 0
                            ? toGroupClasses.map((c) => (
                                <SelectItem key={c.class_id} value={String(c.class_id)}>
                                  {c.name} {c.name_numeric}
                                </SelectItem>
                              ))
                            : (
                                <div className="px-2 py-4 text-center text-sm text-slate-400">Select source class first</div>
                              )}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button
                      onClick={fetchPromotionStudents}
                      disabled={!fromClassId || !toClassId || isLoadingStudents || !isClassTeacher}
                      className="bg-violet-600 hover:bg-violet-700 min-w-[44px] min-h-[44px]"
                    >
                      {isLoadingStudents ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Users className="w-4 h-4 mr-2" />}
                      Load Students
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* ─── Step 2: Student Management ──────────────────── */}
        {step === 2 && isLoadingStudents && (
          <Card>
            <CardContent className="p-6 space-y-4">
              <Skeleton className="h-6 w-48" />
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </CardContent>
          </Card>
        )}

        {step === 2 && !isLoadingStudents && promotionData && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Card className="border-l-4 border-l-violet-500">
                <CardContent className="p-3">
                  <p className="text-xs text-slate-500">Total</p>
                  <p className="text-lg font-bold text-slate-900">{promotionData.total}</p>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-emerald-500">
                <CardContent className="p-3">
                  <p className="text-xs text-slate-500">Eligible</p>
                  <p className="text-lg font-bold text-emerald-600">{promotionData.eligible}</p>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-amber-500">
                <CardContent className="p-3">
                  <p className="text-xs text-slate-500">Already Enrolled</p>
                  <p className="text-lg font-bold text-amber-600">{promotionData.alreadyEnrolled}</p>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-sky-500">
                <CardContent className="p-3">
                  <p className="text-xs text-slate-500">From → To</p>
                  <p className="text-sm font-bold text-slate-900">
                    {promotionData.fromClass?.name} → {promotionData.toClass?.name}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Students Table */}
            <Card>
              <CardContent className="p-0">
                <div className="flex items-center justify-between p-4 border-b">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-slate-600" />
                    <span className="font-semibold text-slate-800 text-sm">
                      Students of {promotionData.fromClass?.name} {promotionData.fromClass?.name_numeric}
                    </span>
                  </div>
                  <Button
                    onClick={handlePromote}
                    disabled={promoting || promotionData.eligible === 0}
                    className="bg-emerald-600 hover:bg-emerald-700 min-w-[44px] min-h-[44px]"
                  >
                    {promoting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ArrowUpCircle className="w-4 h-4 mr-2" />}
                    Promote {promotionData.eligible}
                  </Button>
                </div>
                <div className="max-h-[500px] overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50">
                        <TableHead className="text-xs font-semibold w-12">#</TableHead>
                        <TableHead className="text-xs font-semibold">ID</TableHead>
                        <TableHead className="text-xs font-semibold">Name</TableHead>
                        <TableHead className="text-xs font-semibold">Section</TableHead>
                        <TableHead className="text-xs font-semibold">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {promotionData.students.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-12 text-slate-400">No students found</TableCell>
                        </TableRow>
                      ) : (
                        promotionData.students.map((s, i) => (
                          <TableRow key={s.student_id} className={s.already_enrolled ? "bg-slate-50" : "hover:bg-violet-50/50"}>
                            <TableCell className="text-sm text-slate-400">{i + 1}</TableCell>
                            <TableCell className="font-mono text-xs">{s.student_code}</TableCell>
                            <TableCell className="font-medium text-sm">{s.name}</TableCell>
                            <TableCell className="text-sm">{s.section_name || "—"}</TableCell>
                            <TableCell>
                              {s.already_enrolled ? (
                                <Badge className="bg-emerald-100 text-emerald-700"><CheckCircle className="w-3 h-3 mr-1" /> Enrolled</Badge>
                              ) : (
                                <Select
                                  value={String(studentTargets[s.student_id] || toClassId)}
                                  onValueChange={(v) => setStudentTargets((prev) => ({ ...prev, [s.student_id]: parseInt(v) }))}
                                >
                                  <SelectTrigger className="w-56 h-8 text-xs"><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    {toClassId && <SelectItem value={toClassId}>Promote → {promotionData.toClass?.name} {promotionData.toClass?.name_numeric}</SelectItem>}
                                    {fromClassId && <SelectItem value={fromClassId}>Retain in {promotionData.fromClass?.name} {promotionData.fromClass?.name_numeric}</SelectItem>}
                                  </SelectContent>
                                </Select>
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
