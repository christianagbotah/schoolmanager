"use client";

import { useEffect, useState, useCallback } from "react";
import { Calendar, Printer, Loader2, AlertTriangle, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useAuth } from "@/hooks/use-auth";

interface RoutineItem {
  class_routine_id: number; section_id: number; subject_id: number;
  time_start: string; time_end: string; day: string; room: string;
  section: { section_id: number; name: string };
  subject?: { subject_id: number; name: string };
}

interface Child { student_id: number; name: string; first_name: string; last_name: string; enrolls: { section: { section_id: number; name: string } }[]; }

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const COLORS = ["bg-purple-100 text-purple-700 border-purple-200", "bg-amber-100 text-amber-700 border-amber-200", "bg-emerald-100 text-emerald-700 border-emerald-200", "bg-rose-100 text-rose-700 border-rose-200", "bg-cyan-100 text-cyan-700 border-cyan-200", "bg-orange-100 text-orange-700 border-orange-200", "bg-teal-100 text-teal-700 border-teal-200", "bg-pink-100 text-pink-700 border-pink-200"];

export default function ParentRoutinePage() {
  const { isLoading: authLoading } = useAuth();
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChildId, setSelectedChildId] = useState("");
  const [routines, setRoutines] = useState<RoutineItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchChildren = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/students?search=&limit=500");
      if (res.ok) {
        const data = await res.json();
        const kids = (data.students || []).slice(0, 5);
        setChildren(kids);
        if (kids.length > 0) setSelectedChildId(String(kids[0].student_id));
      }
    } catch { setError("Failed to load children"); }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => { if (!authLoading) fetchChildren(); }, [authLoading, fetchChildren]);

  const fetchRoutine = useCallback(async () => {
    if (!selectedChildId) { setRoutines([]); return; }
    setError(null);
    try {
      // Find the child's section
      const child = children.find((c) => String(c.student_id) === selectedChildId);
      const sectionId = child?.enrolls?.[0]?.section?.section_id;
      if (!sectionId) return;
      const res = await fetch(`/api/routine?section_id=${sectionId}`);
      if (res.ok) { const d = await res.json(); setRoutines(d.routines || []); }
    } catch { setError("Failed to load routine"); }
  }, [selectedChildId, children]);

  useEffect(() => { fetchRoutine(); }, [fetchRoutine]);

  const handlePrint = () => window.print();

  if (isLoading) {
    return <DashboardLayout><div className="space-y-6"><Skeleton className="h-8 w-48" /><div className="space-y-4">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}</div></div></DashboardLayout>;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div><h1 className="text-2xl font-bold text-slate-900 tracking-tight">Class Timetable</h1><p className="text-sm text-slate-500 mt-1">View your child&apos;s weekly schedule</p></div>
          {routines.length > 0 && <Button variant="outline" onClick={handlePrint} className="min-w-[44px] min-h-[44px] print:hidden"><Printer className="w-4 h-4 mr-2" />Print</Button>}
        </div>

        {children.length > 0 && (
          <div className="space-y-2 w-full sm:w-48">
            <Label>Select Child</Label>
            <Select value={selectedChildId} onValueChange={setSelectedChildId}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>{children.map((c) => <SelectItem key={c.student_id} value={String(c.student_id)}>{c.name || `${c.first_name} ${c.last_name}`.trim()}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        )}

        {error && <div className="flex items-center gap-3 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm"><AlertTriangle className="w-5 h-5" />{error}</div>}

        {routines.length === 0 && !isLoading ? (
          <Card className="gap-4"><CardContent className="py-16"><div className="text-center"><Calendar className="w-16 h-16 text-slate-200 mx-auto mb-4" /><h3 className="text-lg font-medium text-slate-600">No routine available</h3></div></CardContent></Card>
        ) : (
          <div className="space-y-4">
            {DAYS.map((day, dayIdx) => {
              const dayRoutines = routines.filter((r) => r.day === day).sort((a, b) => (a.time_start || "").localeCompare(b.time_start || ""));
              const isToday = dayIdx === new Date().getDay() - 1;
              return (
                <Card key={day} className={`gap-4 ${isToday ? "border-2 border-purple-300 bg-purple-50/30" : ""}`}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isToday ? "bg-purple-200" : "bg-slate-100"}`}><Calendar className={`w-4 h-4 ${isToday ? "text-purple-700" : "text-slate-500"}`} /></div>
                        <CardTitle className="text-sm font-semibold">{day}</CardTitle>
                        {isToday && <Badge className="bg-purple-600 text-white">Today</Badge>}
                      </div>
                      <span className="text-xs text-slate-400">{dayRoutines.length} periods</span>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {dayRoutines.length === 0 ? <p className="text-sm text-slate-400 py-2">No classes</p> : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                        {dayRoutines.map((r, i) => (
                          <div key={r.class_routine_id} className={`p-3 rounded-lg border ${COLORS[i % COLORS.length]}`}>
                            <div className="flex items-center justify-between mb-1"><span className="text-xs font-bold">Period {i + 1}</span><Clock className="w-3.5 h-3.5 opacity-60" /></div>
                            {r.subject?.name && <p className="text-sm font-semibold">{r.subject.name}</p>}
                            <p className="text-sm">{r.time_start?.substring(0, 5)} — {r.time_end?.substring(0, 5)}</p>
                            <p className="text-xs mt-1 opacity-75">Room: {r.room || "TBD"}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
