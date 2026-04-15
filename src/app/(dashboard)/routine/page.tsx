"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Calendar, Clock, Printer, AlertTriangle, ChevronLeft, ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { RequirePermission } from "@/components/auth/require-permission";
import { PERMISSIONS } from "@/lib/permissions";

// ─── Types ───────────────────────────────────────────────────
interface ClassItem {
  class_id: number;
  name: string;
  sections: { section_id: number; name: string }[];
}

interface RoutineItem {
  class_routine_id: number;
  section_id: number;
  subject_id: number;
  time_start: string;
  time_end: string;
  day: string;
  room: string;
  section: { section_id: number; name: string };
  subject?: { subject_id: number; name: string };
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const COLORS = [
  "bg-emerald-100 text-emerald-700 border-emerald-200",
  "bg-amber-100 text-amber-700 border-amber-200",
  "bg-purple-100 text-purple-700 border-purple-200",
  "bg-rose-100 text-rose-700 border-rose-200",
  "bg-cyan-100 text-cyan-700 border-cyan-200",
  "bg-orange-100 text-orange-700 border-orange-200",
  "bg-teal-100 text-teal-700 border-teal-200",
  "bg-pink-100 text-pink-700 border-pink-200",
];

/**
 * Shared Routine/Timetable Page
 * - Admin: manages timetables for all classes
 * - Teacher: views timetables for their assigned classes
 * - Student/Parent: views their own class timetable
 */
export default function RoutinePage() {
  const { isAdmin, isTeacher, isStudent, isParent, isLoading: authLoading } = useAuth();
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedSectionId, setSelectedSectionId] = useState("");
  const [routines, setRoutines] = useState<RoutineItem[]>([]);
  const [viewDay, setViewDay] = useState("");
  const [viewMode, setViewMode] = useState<"week" | "day">("week");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClasses = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/classes");
      if (!res.ok) throw new Error("Failed to fetch classes");
      setClasses((await res.json()) || []);
    } catch {
      setError("Failed to load classes");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { if (!authLoading) fetchClasses(); }, [authLoading, fetchClasses]);

  const fetchRoutine = useCallback(async () => {
    if (!selectedSectionId) { setRoutines([]); return; }
    setError(null);
    try {
      const res = await fetch(`/api/routine?section_id=${selectedSectionId}`);
      if (!res.ok) throw new Error("Failed to load routine");
      const data = await res.json();
      setRoutines(data.routines || []);
    } catch {
      setError("Failed to load routine");
    }
  }, [selectedSectionId]);

  useEffect(() => { fetchRoutine(); }, [fetchRoutine]);

  const selectedClass = classes.find((c) => c.class_id === parseInt(selectedClassId));
  const sections = selectedClass?.sections || [];
  const getRoutinesForDay = (day: string) => routines.filter((r) => r.day === day).sort((a, b) => (a.time_start || "").localeCompare(b.time_start || ""));

  if (isLoading) {
    return <div className="space-y-6"><Skeleton className="h-8 w-48" /><div className="space-y-4">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}</div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{isAdmin ? "Timetable" : "My Timetable"}</h1>
          <p className="text-sm text-slate-500 mt-1">Weekly class schedule</p>
        </div>
        <div className="flex gap-2">
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "week" | "day")}>
            <TabsList><TabsTrigger value="week">Week View</TabsTrigger><TabsTrigger value="day">Day View</TabsTrigger></TabsList>
          </Tabs>
          {routines.length > 0 && <Button variant="outline" onClick={() => window.print()} className="min-w-[44px] min-h-[44px] print:hidden"><Printer className="w-4 h-4 mr-2" />Print</Button>}
        </div>
      </div>

      {/* Class/Section Selector */}
      <Card className="gap-4">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Class</Label>
              <Select value={selectedClassId} onValueChange={(v) => { setSelectedClassId(v); setSelectedSectionId(""); }}>
                <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                <SelectContent>{classes.map((c) => <SelectItem key={c.class_id} value={String(c.class_id)}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Section</Label>
              <Select value={selectedSectionId} onValueChange={setSelectedSectionId}>
                <SelectTrigger><SelectValue placeholder="Select section" /></SelectTrigger>
                <SelectContent>{sections.map((s) => <SelectItem key={s.section_id} value={String(s.section_id)}>{s.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {error && <div className="flex items-center gap-3 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm"><AlertTriangle className="w-5 h-5 flex-shrink-0" />{error}</div>}

      {/* Day View */}
      {viewMode === "day" && selectedSectionId && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => { const idx = DAYS.indexOf(viewDay || "Monday"); setViewDay(DAYS[(idx - 1 + DAYS.length) % DAYS.length]); }}><ChevronLeft className="w-4 h-4" /></Button>
            <Select value={viewDay || "Monday"} onValueChange={setViewDay}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>{DAYS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={() => { const idx = DAYS.indexOf(viewDay || "Monday"); setViewDay(DAYS[(idx + 1) % DAYS.length]); }}><ChevronRight className="w-4 h-4" /></Button>
          </div>
          {getRoutinesForDay(viewDay || "Monday").length === 0 ? (
            <Card className="gap-4"><CardContent className="py-16"><div className="text-center"><Calendar className="w-16 h-16 text-slate-200 mx-auto mb-4" /><h3 className="text-lg font-medium text-slate-600">No classes on this day</h3></div></CardContent></Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {getRoutinesForDay(viewDay || "Monday").map((r, i) => (
                <Card key={r.class_routine_id} className={`gap-0 ${COLORS[i % COLORS.length]} border`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2"><Badge variant="secondary" className="text-xs">Period {i + 1}</Badge><Clock className="w-4 h-4 opacity-60" /></div>
                    {r.subject?.name && <p className="text-sm font-bold">{r.subject.name}</p>}
                    <p className="text-sm mt-1">{r.time_start?.substring(0, 5)} — {r.time_end?.substring(0, 5)}</p>
                    <p className="text-xs mt-1 opacity-75">Room: {r.room || "TBD"}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Week View */}
      {viewMode === "week" && selectedSectionId && (
        routines.length === 0 ? (
          <Card className="gap-4"><CardContent className="py-16"><div className="text-center"><Calendar className="w-16 h-16 text-slate-200 mx-auto mb-4" /><h3 className="text-lg font-medium text-slate-600">No routine available</h3><p className="text-sm text-slate-400 mt-1">Timetable has not been set up yet</p></div></CardContent></Card>
        ) : (
          <div className="space-y-4">
            {DAYS.map((day, dayIdx) => {
              const dayRoutines = getRoutinesForDay(day);
              const isToday = dayIdx === new Date().getDay() - 1;
              return (
                <Card key={day} className={`gap-4 ${isToday ? "border-2 border-emerald-300 bg-emerald-50/30" : ""}`}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isToday ? "bg-emerald-200" : "bg-slate-100"}`}><Calendar className={`w-4 h-4 ${isToday ? "text-emerald-700" : "text-slate-500"}`} /></div>
                        <CardTitle className="text-sm font-semibold">{day}</CardTitle>
                        {isToday && <Badge className="bg-emerald-600 text-white">Today</Badge>}
                      </div>
                      <span className="text-xs text-slate-400">{dayRoutines.length} periods</span>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {dayRoutines.length === 0 ? <p className="text-sm text-slate-400 py-2">No classes scheduled</p> : (
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
        )
      )}

      {!selectedSectionId && !isLoading && (
        <Card className="gap-4"><CardContent className="py-16"><div className="text-center"><Calendar className="w-16 h-16 text-slate-200 mx-auto mb-4" /><h3 className="text-lg font-medium text-slate-600">Select a class to view timetable</h3></div></CardContent></Card>
      )}
    </div>
  );
}
