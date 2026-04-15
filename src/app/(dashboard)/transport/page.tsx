"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Bus, MapPin, Clock, Phone, User, AlertTriangle, Plus, Pencil, Trash2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { RequirePermission } from "@/components/auth/require-permission";
import { PERMISSIONS } from "@/lib/permissions";

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

/**
 * Shared Transport Page
 * - Admin: manages transport routes
 * - Others: view their assigned transport info
 */
export default function TransportPage() {
  const { isLoading: authLoading, isAdmin } = useAuth();
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

  useEffect(() => { if (!authLoading) fetchRoutes(); }, [authLoading, fetchRoutes]);

  if (isLoading) {
    return <div className="space-y-6"><Skeleton className="h-8 w-48" /><div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}</div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Transport</h1>
          <p className="text-sm text-slate-500 mt-1">{isAdmin ? "Manage transport routes and vehicles" : "View your assigned transport information"}</p>
        </div>
        <RequirePermission permission={PERMISSIONS.CAN_MANAGE_TRANSPORT}>
          <Button className="bg-emerald-600 hover:bg-emerald-700 min-w-[44px] min-h-[44px]">
            <Plus className="w-4 h-4 mr-2" /> Add Route
          </Button>
        </RequirePermission>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />{error}
        </div>
      )}

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card className="py-4 border-l-4 border-l-emerald-500"><CardContent className="px-4 pb-0 pt-0"><p className="text-xs font-medium text-slate-500">Active Routes</p><p className="text-2xl font-bold text-emerald-600">{routes.filter((r) => r.status === "active").length}</p></CardContent></Card>
        <Card className="py-4 border-l-4 border-l-blue-500"><CardContent className="px-4 pb-0 pt-0"><p className="text-xs font-medium text-slate-500">Total Routes</p><p className="text-2xl font-bold text-blue-600">{routes.length}</p></CardContent></Card>
        <Card className="py-4 border-l-4 border-l-amber-500"><CardContent className="px-4 pb-0 pt-0"><p className="text-xs font-medium text-slate-500">Vehicles</p><p className="text-2xl font-bold text-amber-600">{routes.filter((r) => r.vehicle_number).length}</p></CardContent></Card>
      </div>

      {routes.length === 0 ? (
        <Card className="gap-4"><CardContent className="py-16"><div className="text-center"><Bus className="w-16 h-16 text-slate-200 mx-auto mb-4" /><h3 className="text-lg font-medium text-slate-600">No transport routes available</h3><p className="text-sm text-slate-400 mt-1">Transport information will appear here when available</p></div></CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {routes.map((route) => (
            <Card key={route.route_id} className="gap-4 hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0"><Bus className="w-5 h-5 text-emerald-600" /></div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-900">{route.route_name}</h3>
                    <Badge variant="outline" className="text-xs mt-1">{route.vehicle_number}</Badge>
                  </div>
                  <Badge variant="secondary" className={route.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}>
                    {route.status || "active"}
                  </Badge>
                </div>
                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-slate-600"><User className="w-4 h-4 text-slate-400" /><span>Driver: <strong>{route.driver_name}</strong></span></div>
                  <div className="flex items-center gap-2 text-slate-600"><Phone className="w-4 h-4 text-slate-400" /><span>{route.driver_phone || "—"}</span></div>
                  <div className="flex items-center gap-2 text-slate-600"><Clock className="w-4 h-4 text-slate-400" /><span>Pickup: {route.pickup_time || "—"} &bull; Drop-off: {route.dropoff_time || "—"}</span></div>
                </div>
                {isAdmin && (
                  <div className="flex gap-1 mt-3 pt-3 border-t border-slate-100">
                    <Button size="sm" variant="ghost" className="h-7 text-xs"><Pencil className="w-3 h-3 mr-1" /> Edit</Button>
                    <Button size="sm" variant="ghost" className="h-7 text-xs text-red-600"><Trash2 className="w-3 h-3 mr-1" /> Delete</Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
