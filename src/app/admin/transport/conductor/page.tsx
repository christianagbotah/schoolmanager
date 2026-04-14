/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Bus, CheckCircle, Clock, DollarSign, Search, Users, ChevronRight,
  LogOut, ArrowLeft,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";

interface TransportRoute {
  transport_id: number;
  route_name: string;
  vehicle_number: string;
  fare: number;
}

interface BusAttendance {
  id: number;
  student_id: number;
  route_id: number | null;
  attendance_date: string | null;
  transport_direction: string;
  boarded_in: string | null;
  boarded_out: string | null;
  total_fare: number;
  student: { student_id: number; name: string; student_code: string };
}

interface Student {
  student_id: number;
  name: string;
  student_code: string;
}

export default function ConductorPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [routes, setRoutes] = useState<TransportRoute[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedRoute, setSelectedRoute] = useState<string>("");
  const [direction, setDirection] = useState("morning");
  const [attendance, setAttendance] = useState<BusAttendance[]>([]);
  const [attLoading, setAttLoading] = useState(false);
  const [searchStudent, setSearchStudent] = useState("");
  const [searchCode, setSearchCode] = useState("");
  const [todayLog, setTodayLog] = useState<BusAttendance[]>([]);
  const [totalCollected, setTotalCollected] = useState(0);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [routesRes, studentsRes] = await Promise.all([
        fetch("/api/transport/route"),
        fetch("/api/students"),
      ]);
      setRoutes(await routesRes.json());
      const stData = await studentsRes.json();
      setStudents(Array.isArray(stData) ? stData.slice(0, 200) : []);
    } catch { /* empty */ }
    setLoading(false);
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchData(); }, [fetchData]);

  const fetchAttendance = async () => {
    if (!selectedRoute) return;
    setAttLoading(true);
    try {
      const today = new Date().toISOString().split("T")[0];
      const params = new URLSearchParams({
        route_id: selectedRoute,
        date: today,
        direction,
      });
      const res = await fetch(`/api/transport/route/attendance?${params}`);
      const data = await res.json();
      setAttendance(Array.isArray(data) ? data : []);
    } catch { /* empty */ }
    setAttLoading(false);
  };

  useEffect(() => {
    if (selectedRoute) {
      const doFetch = () => fetchAttendance();
      doFetch();
    }
  }, [selectedRoute, direction, fetchAttendance]);

  const handleBoard = async (studentId: number) => {
    const route = routes.find(r => r.transport_id === parseInt(selectedRoute));
    if (!route) return;
    const today = new Date().toISOString().split("T")[0];
    try {
      await fetch("/api/transport/route/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_id: studentId,
          route_id: parseInt(selectedRoute),
          attendance_date: today,
          transport_direction: direction,
          total_fare: route.fare,
        }),
      });
      toast({ title: "Boarded", description: "Student boarded successfully" });
      fetchAttendance();
      fetchTodayLog();
    } catch {
      toast({ title: "Error", description: "Failed to board student", variant: "destructive" });
    }
  };

  const handleExit = async (id: number) => {
    try {
      await fetch("/api/transport/route/attendance", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, boarded_out: true }),
      });
      toast({ title: "Exited", description: "Student marked as exited" });
      fetchAttendance();
      fetchTodayLog();
    } catch {
      toast({ title: "Error", description: "Failed to mark exit", variant: "destructive" });
    }
  };

  const fetchTodayLog = async () => {
    if (!selectedRoute) return;
    try {
      const today = new Date().toISOString().split("T")[0];
      const params = new URLSearchParams({ route_id: selectedRoute, date: today });
      const res = await fetch(`/api/transport/route/attendance?${params}`);
      const data = await res.json();
      setTodayLog(Array.isArray(data) ? data : []);
      setTotalCollected(Array.isArray(data) ? data.reduce((sum: number, a: BusAttendance) => sum + a.total_fare, 0) : 0);
    } catch { /* empty */ }
  };

  useEffect(() => {
    if (selectedRoute) {
      const doFetch = () => fetchTodayLog();
      doFetch();
    }
  }, [selectedRoute, direction, fetchTodayLog]);

  const filteredStudents = students.filter(s =>
    s.name.toLowerCase().includes(searchStudent.toLowerCase()) ||
    s.student_code.toLowerCase().includes(searchCode.toLowerCase())
  );

  const activeRoute = routes.find(r => r.transport_id === parseInt(selectedRoute));

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="bg-emerald-700 text-white shadow-lg sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <Bus className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-lg font-bold">Bus Conductor</h1>
                <p className="text-emerald-200 text-xs hidden sm:block">Boarding & Fare Collection</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="text-white hover:bg-white/10" onClick={() => router.push("/admin/transport")}>
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full">
        {loading ? (
          <div className="space-y-4"><Skeleton className="h-20 rounded-xl" /><Skeleton className="h-96 rounded-xl" /></div>
        ) : (
          <div className="space-y-6">
            {/* Route & Direction Selection */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <Label>Route</Label>
                <Select value={selectedRoute} onValueChange={setSelectedRoute}>
                  <SelectTrigger className="min-h-[44px]"><SelectValue placeholder="Select route" /></SelectTrigger>
                  <SelectContent>
                    {routes.map(r => (
                      <SelectItem key={r.transport_id} value={r.transport_id.toString()}>
                        {r.route_name} ({r.vehicle_number})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-full sm:w-40">
                <Label>Direction</Label>
                <Select value={direction} onValueChange={setDirection}>
                  <SelectTrigger className="min-h-[44px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="morning">Morning</SelectItem>
                    <SelectItem value="evening">Evening</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              <Card className="border-emerald-200 bg-emerald-50">
                <CardContent className="p-3 text-center">
                  <Users className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
                  <p className="text-lg font-bold text-emerald-700">{todayLog.length}</p>
                  <p className="text-xs text-emerald-600">Boarded</p>
                </CardContent>
              </Card>
              <Card className="border-amber-200 bg-amber-50">
                <CardContent className="p-3 text-center">
                  <DollarSign className="w-5 h-5 text-amber-600 mx-auto mb-1" />
                  <p className="text-lg font-bold text-amber-700">GHS {totalCollected.toFixed(0)}</p>
                  <p className="text-xs text-amber-600">Collected</p>
                </CardContent>
              </Card>
              <Card className="border-blue-200 bg-blue-50">
                <CardContent className="p-3 text-center">
                  <Clock className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                  <p className="text-lg font-bold text-blue-700">{todayLog.filter(a => !a.boarded_out).length}</p>
                  <p className="text-xs text-blue-600">On Bus</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Board Students */}
              <Card className="border-slate-200/60">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Board Students</CardTitle>
                  <Input
                    placeholder="Search by name or code..."
                    value={searchStudent || searchCode}
                    onChange={e => { setSearchStudent(e.target.value); setSearchCode(e.target.value); }}
                    className="min-h-[44px]"
                  />
                </CardHeader>
                <CardContent>
                  <div className="max-h-96 overflow-y-auto space-y-1">
                    {filteredStudents.slice(0, 50).map(s => {
                      const isBoarded = attendance.some(a => a.student_id === s.student_id);
                      return (
                        <div key={s.student_id} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50">
                          <div>
                            <p className="text-sm font-medium text-slate-900">{s.name}</p>
                            <p className="text-xs text-slate-500">{s.student_code}</p>
                          </div>
                          <Button
                            size="sm"
                            variant={isBoarded ? "secondary" : "default"}
                            className={isBoarded ? "" : "bg-emerald-600 hover:bg-emerald-700"}
                            disabled={isBoarded || !selectedRoute}
                            onClick={() => handleBoard(s.student_id)}
                          >
                            {isBoarded ? <><CheckCircle className="w-3 h-3 mr-1" /> On</> : <><Users className="w-3 h-3 mr-1" /> Board</>}
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Daily Log */}
              <Card className="border-slate-200/60">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Daily Log - {activeRoute?.route_name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="max-h-96 overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Student</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Fare</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {todayLog.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center text-slate-400 py-8">
                              No entries yet
                            </TableCell>
                          </TableRow>
                        ) : (
                          todayLog.map(a => (
                            <TableRow key={a.id}>
                              <TableCell>
                                <p className="text-sm">{a.student?.name || "Unknown"}</p>
                                <p className="text-xs text-slate-500">{a.student?.student_code}</p>
                              </TableCell>
                              <TableCell>
                                {a.boarded_out ? (
                                  <Badge variant="secondary" className="text-xs">Exited</Badge>
                                ) : (
                                  <Badge className="bg-emerald-100 text-emerald-700 text-xs">On Bus</Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-sm font-medium">GHS {a.total_fare}</TableCell>
                              <TableCell>
                                {!a.boarded_out && (
                                  <Button size="sm" variant="ghost" className="h-7 text-xs text-red-600" onClick={() => handleExit(a.id)}>
                                    <LogOut className="w-3 h-3 mr-1" /> Exit
                                  </Button>
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
            </div>
          </div>
        )}
      </main>

      <footer className="bg-white border-t border-slate-200 py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-xs text-slate-400">&copy; {new Date().getFullYear()} School Manager</p>
        </div>
      </footer>
    </div>
  );
}
