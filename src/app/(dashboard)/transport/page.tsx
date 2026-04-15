"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Bus, MapPin, Clock, Phone, User, AlertTriangle, Plus, Pencil, Trash2, Users, Route,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/hooks/use-auth";
import { RequirePermission } from "@/components/auth/require-permission";
import { PERMISSIONS } from "@/lib/permissions";
import { useToast } from "@/hooks/use-toast";

// ─── Types ───────────────────────────────────────────────────
interface TransportRoute {
  transport_id: number;
  route_name: string;
  description: string;
  vehicle_number: string;
  driver_id: number | null;
  fare: number;
  facilities: string;
  studentCount?: number;
}

// ─── Shared Transport Page ──────────────────────────────────
export default function TransportPage() {
  const { isLoading: authLoading, isAdmin } = useAuth();
  const { toast } = useToast();
  const [routes, setRoutes] = useState<TransportRoute[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create/Edit dialog
  const [formOpen, setFormOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState<TransportRoute | null>(null);
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formVehicle, setFormVehicle] = useState("");
  const [formFare, setFormFare] = useState("");
  const [formFacilities, setFormFacilities] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Delete dialog
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingRoute, setDeletingRoute] = useState<TransportRoute | null>(null);

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

  const openCreate = () => {
    setEditingRoute(null);
    setFormName(""); setFormDesc(""); setFormVehicle(""); setFormFare(""); setFormFacilities("");
    setFormOpen(true);
  };

  const openEdit = (route: TransportRoute) => {
    setEditingRoute(route);
    setFormName(route.route_name || "");
    setFormDesc(route.description || "");
    setFormVehicle(route.vehicle_number || "");
    setFormFare(String(route.fare || ""));
    setFormFacilities(route.facilities || "");
    setFormOpen(true);
  };

  const handleSave = async () => {
    if (!formName) return;
    setIsSaving(true);
    try {
      const body = {
        route_name: formName,
        description: formDesc,
        vehicle_number: formVehicle,
        fare: formFare ? parseFloat(formFare) : 0,
        facilities: formFacilities,
      };
      const url = editingRoute ? "/api/transport" : "/api/transport";
      const method = editingRoute ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingRoute ? { transport_id: editingRoute.transport_id, ...body } : body),
      });
      if (!res.ok) throw new Error();
      toast({ title: "Success", description: editingRoute ? "Route updated" : "Route created" });
      setFormOpen(false);
      fetchRoutes();
    } catch {
      toast({ title: "Error", variant: "destructive", description: "Failed to save route" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingRoute) return;
    try {
      await fetch(`/api/transport?id=${deletingRoute.transport_id}`, { method: "DELETE" });
      toast({ title: "Success", description: "Route deleted" });
      setDeleteOpen(false);
      setDeletingRoute(null);
      fetchRoutes();
    } catch {
      toast({ title: "Error", variant: "destructive", description: "Failed to delete" });
    }
  };

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
          <Button className="bg-emerald-600 hover:bg-emerald-700 min-w-[44px] min-h-[44px]" onClick={openCreate}>
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
        <Card className="py-4 border-l-4 border-l-emerald-500"><CardContent className="px-4 pb-0 pt-0"><p className="text-xs font-medium text-slate-500">Total Routes</p><p className="text-2xl font-bold text-emerald-600">{routes.length}</p></CardContent></Card>
        <Card className="py-4 border-l-4 border-l-blue-500"><CardContent className="px-4 pb-0 pt-0"><p className="text-xs font-medium text-slate-500">With Vehicles</p><p className="text-2xl font-bold text-blue-600">{routes.filter((r) => r.vehicle_number).length}</p></CardContent></Card>
        <Card className="py-4 border-l-4 border-l-amber-500"><CardContent className="px-4 pb-0 pt-0"><p className="text-xs font-medium text-slate-500">Total Students</p><p className="text-2xl font-bold text-amber-600">{routes.reduce((s, r) => s + (r.studentCount || 0), 0)}</p></CardContent></Card>
      </div>

      {routes.length === 0 ? (
        <Card className="gap-4"><CardContent className="py-16"><div className="text-center"><Bus className="w-16 h-16 text-slate-200 mx-auto mb-4" /><h3 className="text-lg font-medium text-slate-600">No transport routes available</h3><p className="text-sm text-slate-400 mt-1">Transport information will appear here when available</p></div></CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {routes.map((route) => (
            <Card key={route.transport_id} className="gap-4 hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0"><Bus className="w-5 h-5 text-emerald-600" /></div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-900">{route.route_name}</h3>
                    {route.vehicle_number && <Badge variant="outline" className="text-xs mt-1">{route.vehicle_number}</Badge>}
                  </div>
                </div>
                <div className="mt-4 space-y-2 text-sm">
                  {route.description && <p className="text-slate-600">{route.description}</p>}
                  <div className="flex items-center gap-4 text-slate-500">
                    {route.fare > 0 && <span className="flex items-center gap-1"><span className="text-xs">Fare:</span><span className="font-semibold text-emerald-600">GHS {route.fare}</span></span>}
                    {route.studentCount ? (
                      <span className="flex items-center gap-1"><Users className="w-4 h-4" /><span className="text-xs">{route.studentCount} students</span></span>
                    ) : null}
                  </div>
                </div>
                {isAdmin && (
                  <div className="flex gap-1 mt-3 pt-3 border-t border-slate-100">
                    <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => openEdit(route)}><Pencil className="w-3 h-3 mr-1" /> Edit</Button>
                    <Button size="sm" variant="ghost" className="h-8 text-xs text-red-600" onClick={() => { setDeletingRoute(route); setDeleteOpen(true); }}><Trash2 className="w-3 h-3 mr-1" /> Delete</Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <RequirePermission permission={PERMISSIONS.CAN_MANAGE_TRANSPORT}>
        <Dialog open={formOpen} onOpenChange={setFormOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>{editingRoute ? "Edit Route" : "Add Route"}</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2"><Label>Route Name *</Label><Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="e.g., Kasoa Route" /></div>
              <div className="space-y-2"><Label>Description</Label><Textarea value={formDesc} onChange={(e) => setFormDesc(e.target.value)} placeholder="Route description" rows={2} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Vehicle Number</Label><Input value={formVehicle} onChange={(e) => setFormVehicle(e.target.value)} placeholder="e.g., GS-1234" /></div>
                <div className="space-y-2"><Label>Fare (GHS)</Label><Input type="number" step="0.01" value={formFare} onChange={(e) => setFormFare(e.target.value)} placeholder="0.00" /></div>
              </div>
              <div className="space-y-2"><Label>Facilities</Label><Textarea value={formFacilities} onChange={(e) => setFormFacilities(e.target.value)} placeholder="AC, WiFi, etc." rows={2} /></div>
              <Button onClick={handleSave} disabled={isSaving || !formName} className="w-full bg-emerald-600 hover:bg-emerald-700 min-h-[44px]">
                {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                {editingRoute ? "Update Route" : "Add Route"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader><AlertDialogTitle>Delete Route</AlertDialogTitle><AlertDialogDescription>Delete <strong>{deletingRoute?.route_name}</strong>? All associated data will be removed.</AlertDialogDescription></AlertDialogHeader>
            <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction></AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </RequirePermission>
    </div>
  );
}
