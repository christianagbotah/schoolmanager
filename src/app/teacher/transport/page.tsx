"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Bus,
  MapPin,
  Clock,
  Phone,
  User,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

// ─── Types ───────────────────────────────────────────────────
interface TransportRoute {
  route_id: number;
  route_name: string;
  vehicle_number: string;
  driver_name: string;
  driver_phone: string;
  pickup_time: string;
  dropoff_time: string;
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
      const res = await fetch("/api/transport?limit=100");
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {routes.map((route) => (
              <Card key={route.route_id} className="gap-4 hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                      <Bus className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900">{route.route_name}</h3>
                      <Badge variant="outline" className="text-xs mt-1">{route.vehicle_number}</Badge>
                    </div>
                    <Badge variant="secondary" className={route.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}>
                      {route.status || "active"}
                    </Badge>
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
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
