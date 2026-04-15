"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Bus, MapPin, Clock, Phone, User, Loader2, AlertTriangle,
  Navigation, Users,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useAuth } from "@/hooks/use-auth";

// ─── Types ───────────────────────────────────────────────────
interface TransportRoute {
  transport_id: number;
  route_name: string;
  vehicle_number: string;
  driver_name: string;
  driver_phone: string;
  pickup_time: string;
  dropoff_time: string;
  number_of_students?: number;
  status: string;
}

// ─── Main Component ──────────────────────────────────────────
export default function TeacherTransportPage() {
  const { isLoading: authLoading } = useAuth();
  const [routes, setRoutes] = useState<TransportRoute[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRoutes = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/teacher/transport");
      if (res.ok) {
        const data = await res.json();
        setRoutes(Array.isArray(data) ? data : data.routes || []);
      }
    } catch {
      setError("Failed to load transport data");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading) fetchRoutes();
  }, [authLoading, fetchRoutes]);

  const totalRoutes = routes.length;
  const activeRoutes = routes.filter(r => r.status === "active").length;
  const totalStudents = routes.reduce((sum, r) => sum + (r.number_of_students || 0), 0);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Transport Information</h1>
          <p className="text-sm text-slate-500 mt-1">View assigned transport routes and details</p>
        </div>

        {error && (
          <div className="flex items-center gap-3 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />{error}
          </div>
        )}

        {/* ─── Stats ──────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <Card className="py-4 border-l-4 border-l-emerald-500">
            <CardContent className="px-4 pb-0 pt-0">
              <p className="text-xs font-medium text-slate-500">Total Routes</p>
              <p className="text-2xl font-bold text-emerald-600">{totalRoutes}</p>
            </CardContent>
          </Card>
          <Card className="py-4 border-l-4 border-l-violet-500">
            <CardContent className="px-4 pb-0 pt-0">
              <p className="text-xs font-medium text-slate-500">Active Routes</p>
              <p className="text-2xl font-bold text-violet-600">{activeRoutes}</p>
            </CardContent>
          </Card>
          <Card className="py-4 border-l-4 border-l-amber-500 col-span-2 sm:col-span-1">
            <CardContent className="px-4 pb-0 pt-0">
              <p className="text-xs font-medium text-slate-500">Students Using Transport</p>
              <p className="text-2xl font-bold text-amber-600">{totalStudents}</p>
            </CardContent>
          </Card>
        </div>

        {/* ─── Routes Grid / Table ──────────────────────────── */}
        {routes.length === 0 ? (
          <Card className="gap-4">
            <CardContent className="py-16">
              <div className="text-center">
                <Bus className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-600">No transport routes available</h3>
                <p className="text-sm text-slate-400 mt-1">Transport information will appear here when available</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block">
              <Card className="gap-4">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                      <Bus className="w-4 h-4 text-emerald-600" />
                    </div>
                    <CardTitle className="text-base font-semibold">Transport Routes ({routes.length})</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="max-h-96 overflow-y-auto rounded-lg border border-slate-200">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50 hover:bg-slate-50">
                          <TableHead className="text-xs font-semibold text-slate-600 uppercase">Route</TableHead>
                          <TableHead className="text-xs font-semibold text-slate-600 uppercase">Vehicle</TableHead>
                          <TableHead className="text-xs font-semibold text-slate-600 uppercase">Driver</TableHead>
                          <TableHead className="text-xs font-semibold text-slate-600 uppercase hidden lg:table-cell">Phone</TableHead>
                          <TableHead className="text-xs font-semibold text-slate-600 uppercase hidden lg:table-cell">Times</TableHead>
                          <TableHead className="text-xs font-semibold text-slate-600 uppercase hidden xl:table-cell">Students</TableHead>
                          <TableHead className="text-xs font-semibold text-slate-600 uppercase text-center">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {routes.map((route) => (
                          <TableRow key={route.transport_id} className="hover:bg-slate-50">
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                                  <Navigation className="w-4 h-4 text-emerald-600" />
                                </div>
                                <span className="font-medium text-sm text-slate-900">{route.route_name}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-sm text-slate-600">{route.vehicle_number || "—"}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1.5">
                                <User className="w-3.5 h-3.5 text-slate-400" />
                                <span className="text-sm text-slate-900">{route.driver_name}</span>
                              </div>
                            </TableCell>
                            <TableCell className="hidden lg:table-cell text-sm text-slate-500">{route.driver_phone || "—"}</TableCell>
                            <TableCell className="hidden lg:table-cell text-sm text-slate-500">
                              <div className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5 text-slate-400" />
                                {route.pickup_time || "—"} — {route.dropoff_time || "—"}
                              </div>
                            </TableCell>
                            <TableCell className="hidden xl:table-cell text-sm text-slate-500">
                              {route.number_of_students || 0}
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant="secondary" className={
                                route.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"
                              }>
                                {route.status || "active"}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden">
              <div className="grid grid-cols-1 gap-4">
                {routes.map((route) => (
                  <Card key={route.transport_id} className="gap-4 hover:shadow-md transition-shadow">
                    <CardContent className="p-5">
                      <div className="flex items-start gap-3">
                        <div className="w-11 h-11 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                          <Bus className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-slate-900">{route.route_name}</h3>
                            <Badge variant="secondary" className={
                              route.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"
                            }>
                              {route.status || "active"}
                            </Badge>
                          </div>
                          {route.vehicle_number && <Badge variant="outline" className="text-xs mt-1">{route.vehicle_number}</Badge>}
                        </div>
                      </div>
                      <div className="mt-4 space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-slate-600">
                          <User className="w-4 h-4 text-slate-400" />
                          <span>Driver: <strong>{route.driver_name}</strong></span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-600">
                          <Phone className="w-4 h-4 text-slate-400" />
                          <span>{route.driver_phone || "—"}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-600">
                          <Clock className="w-4 h-4 text-slate-400" />
                          <span>Pickup: {route.pickup_time || "—"} • Drop-off: {route.dropoff_time || "—"}</span>
                        </div>
                        {route.number_of_students && (
                          <div className="flex items-center gap-2 text-slate-600">
                            <Users className="w-4 h-4 text-slate-400" />
                            <span>{route.number_of_students} students</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
