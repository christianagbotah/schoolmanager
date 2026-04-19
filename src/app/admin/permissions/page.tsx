"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Shield,
  Plus,
  Pencil,
  Trash2,
  Save,
  ArrowLeft,
  Lock,
  Unlock,
  Loader2,
  AlertTriangle,
  Search,
  Users,
  KeyRound,
  Eye,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ─── Types ───────────────────────────────────────────────────────
interface RoleItem {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  level: number;
  isDefault: boolean;
  userCount: number;
  grantedPermissionCount: number;
  createdAt: string;
  updatedAt: string;
}

interface PermissionItem {
  id: number;
  name: string;
  displayName: string;
  module: string;
  description: string | null;
  isGranted: boolean;
}

interface PermissionGroup {
  [module: string]: PermissionItem[];
}

interface RoleFormData {
  name: string;
  slug: string;
  description: string;
  level: number;
}

// Built-in role slugs that cannot be deleted
const BUILTIN_ROLES = [
  "super-admin",
  "admin",
  "accountant",
  "cashier",
  "conductor",
  "teacher",
  "student",
  "parent",
  "librarian",
  "receptionist",
];

// Module icons and colors
const MODULE_CONFIG: Record<string, { icon: string; color: string; bgColor: string }> = {
  users: { icon: "👥", color: "text-blue-700", bgColor: "bg-blue-50" },
  academics: { icon: "📚", color: "text-violet-700", bgColor: "bg-violet-50" },
  attendance: { icon: "📊", color: "text-emerald-700", bgColor: "bg-emerald-50" },
  examination: { icon: "📝", color: "text-amber-700", bgColor: "bg-amber-50" },
  finance: { icon: "💰", color: "text-green-700", bgColor: "bg-green-50" },
  communication: { icon: "📢", color: "text-cyan-700", bgColor: "bg-cyan-50" },
  transport: { icon: "🚌", color: "text-orange-700", bgColor: "bg-orange-50" },
  library: { icon: "📖", color: "text-rose-700", bgColor: "bg-rose-50" },
  inventory: { icon: "📦", color: "text-violet-700", bgColor: "bg-violet-50" },
  boarding: { icon: "🏠", color: "text-teal-700", bgColor: "bg-teal-50" },
  settings: { icon: "⚙️", color: "text-slate-700", bgColor: "bg-slate-50" },
  reports: { icon: "📈", color: "text-sky-700", bgColor: "bg-sky-50" },
  self_service: { icon: "🔐", color: "text-pink-700", bgColor: "bg-pink-50" },
};

// ─── Slug Generator ──────────────────────────────────────────────
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

// ─── Access Denied ───────────────────────────────────────────────
function AccessDenied() {
  return (
    <DashboardLayout>
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-20 h-20 rounded-2xl bg-red-100 flex items-center justify-center">
          <Lock className="w-10 h-10 text-red-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Access Denied</h2>
        <p className="text-slate-500 text-center max-w-md">
          You do not have permission to access the Permissions Management page.
          Only users with the &quot;Manage Roles &amp; Permissions&quot; permission or Super Admin can access this page.
        </p>
        <Button
          variant="outline"
          className="mt-4 min-h-[44px]"
          onClick={() => (window.location.href = "/admin")}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>
      </div>
    </DashboardLayout>
  );
}

// ─── Page Skeleton ──────────────────────────────────────────────
function PermissionsSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header skeleton */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div className="space-y-1.5">
          <Skeleton className="h-6 w-52" />
          <Skeleton className="h-4 w-60" />
        </div>
        <Skeleton className="h-11 w-32" />
      </div>
      {/* Stat card skeletons */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[88px] rounded-2xl" />
        ))}
      </div>
      {/* Tabs skeleton */}
      <Skeleton className="h-11 w-64 rounded-xl" />
      {/* Table skeleton */}
      <div className="rounded-2xl border">
        <Skeleton className="h-10 w-full rounded-t-2xl" />
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    </div>
  );
}

// ─── Stat Card Component ─────────────────────────────────────────
function StatCard({ icon: Icon, label, value, color, borderColor }: {
  icon: typeof CheckCircle2;
  label: string;
  value: string | number;
  color: string;
  borderColor: string;
}) {
  return (
    <div className={`bg-white rounded-2xl border border-slate-200/60 p-4 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200 border-l-4 ${borderColor}`}>
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center flex-shrink-0`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-bold text-slate-900 tabular-nums">{value}</p>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────
export default function PermissionsPage() {
  const { isLoading: authLoading, isSuperAdmin, hasPermission } = useAuth();

  // Page state
  const [activeTab, setActiveTab] = useState<string>("roles");
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [allPermissions, setAllPermissions] = useState<PermissionItem[]>([]);
  const [permissionsGrouped, setPermissionsGrouped] = useState<PermissionGroup>({});
  const [modules, setModules] = useState<string[]>([]);

  // Loading states
  const [isLoadingRoles, setIsLoadingRoles] = useState(true);
  const [isLoadingPermissions, setIsLoadingPermissions] = useState(true);

  // Role CRUD dialog
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleItem | null>(null);
  const [roleForm, setRoleForm] = useState<RoleFormData>({
    name: "",
    slug: "",
    description: "",
    level: 0,
  });
  const [isSavingRole, setIsSavingRole] = useState(false);

  // Delete confirmation
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingRole, setDeletingRole] = useState<RoleItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Permission grid view
  const [selectedRole, setSelectedRole] = useState<RoleItem | null>(null);
  const [rolePermissions, setRolePermissions] = useState<PermissionGroup>({});
  const [permissionChanges, setPermissionChanges] = useState<Record<string, boolean>>({});
  const [isLoadingRolePerms, setIsLoadingRolePerms] = useState(false);
  const [isSavingPermissions, setIsSavingPermissions] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // ─── Fetch Roles ────────────────────────────────────────────
  const fetchRoles = useCallback(async () => {
    setIsLoadingRoles(true);
    try {
      const res = await fetch("/api/roles");
      const json = await res.json();
      if (json.success) {
        setRoles(json.data);
      }
    } catch (err) {
      console.error("Error fetching roles:", err);
      toast.error("Failed to load roles");
    } finally {
      setIsLoadingRoles(false);
    }
  }, []);

  // ─── Fetch All Permissions ──────────────────────────────────
  const fetchPermissions = useCallback(async () => {
    setIsLoadingPermissions(true);
    try {
      const res = await fetch("/api/permissions");
      const json = await res.json();
      if (json.success) {
        setAllPermissions(json.data.all);
        setPermissionsGrouped(json.data.grouped);
        setModules(json.data.modules);
      }
    } catch (err) {
      console.error("Error fetching permissions:", err);
      toast.error("Failed to load permissions");
    } finally {
      setIsLoadingPermissions(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading) {
      fetchRoles();
      fetchPermissions();
    }
  }, [authLoading, fetchRoles, fetchPermissions]);

  // ─── Access Control ─────────────────────────────────────────
  const canManagePermissions = isSuperAdmin || hasPermission("can_manage_roles_permissions");

  if (authLoading) {
    return (
      <DashboardLayout>
        <PermissionsSkeleton />
      </DashboardLayout>
    );
  }

  if (!canManagePermissions) {
    return <AccessDenied />;
  }

  // ─── Role CRUD Handlers ─────────────────────────────────────
  const openCreateDialog = () => {
    setEditingRole(null);
    setRoleForm({ name: "", slug: "", description: "", level: 5 });
    setRoleDialogOpen(true);
  };

  const openEditDialog = (role: RoleItem) => {
    setEditingRole(role);
    setRoleForm({
      name: role.name,
      slug: role.slug,
      description: role.description || "",
      level: role.level,
    });
    setRoleDialogOpen(true);
  };

  const handleRoleFormChange = (field: keyof RoleFormData, value: string | number) => {
    setRoleForm((prev) => {
      const updated = { ...prev, [field]: value };
      // Auto-generate slug from name (only when creating new role)
      if (field === "name" && !editingRole) {
        updated.slug = generateSlug(value as string);
      }
      return updated;
    });
  };

  const handleSaveRole = async () => {
    if (!roleForm.name.trim() || !roleForm.slug.trim()) {
      toast.error("Name and slug are required");
      return;
    }

    setIsSavingRole(true);
    try {
      const url = editingRole ? `/api/roles/${editingRole.id}` : "/api/roles";
      const method = editingRole ? "PUT" : "POST";
      const body = editingRole
        ? { name: roleForm.name, slug: roleForm.slug, description: roleForm.description || null, level: Number(roleForm.level) }
        : { name: roleForm.name, slug: roleForm.slug, description: roleForm.description || null, level: Number(roleForm.level) };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const json = await res.json();

      if (json.success) {
        toast.success(editingRole
          ? `Role "${roleForm.name}" updated successfully`
          : `Role "${roleForm.name}" created successfully`);
        setRoleDialogOpen(false);
        fetchRoles();
      } else {
        toast.error(json.error || "Failed to save role");
      }
    } catch (err) {
      console.error("Error saving role:", err);
      toast.error("Failed to save role");
    } finally {
      setIsSavingRole(false);
    }
  };

  const openDeleteDialog = (role: RoleItem) => {
    setDeletingRole(role);
    setDeleteDialogOpen(true);
  };

  const handleDeleteRole = async () => {
    if (!deletingRole) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/roles/${deletingRole.id}`, { method: "DELETE" });
      const json = await res.json();

      if (json.success) {
        toast.success(`Role "${deletingRole.name}" deleted successfully`);
        setDeleteDialogOpen(false);
        setDeletingRole(null);
        fetchRoles();
      } else {
        toast.error(json.error || "Failed to delete role");
      }
    } catch (err) {
      console.error("Error deleting role:", err);
      toast.error("Failed to delete role");
    } finally {
      setIsDeleting(false);
    }
  };

  // ─── Permission Grid Handlers ───────────────────────────────
  const openPermissionGrid = async (role: RoleItem) => {
    setSelectedRole(role);
    setPermissionChanges({});
    setIsLoadingRolePerms(true);

    try {
      const res = await fetch(`/api/roles/${role.id}/permissions`);
      const json = await res.json();

      if (json.success) {
        const grouped: PermissionGroup = {};
        for (const [mod, perms] of Object.entries(json.data.grouped)) {
          grouped[mod] = (perms as Array<{ permission: PermissionItem; isGranted: boolean }>).map(
            (rp) => ({
              id: rp.permission.id,
              name: rp.permission.name,
              displayName: rp.permission.displayName,
              module: rp.permission.module,
              description: rp.permission.description,
              isGranted: rp.isGranted,
            })
          );
        }
        setRolePermissions(grouped);
      }
    } catch (err) {
      console.error("Error fetching role permissions:", err);
      toast.error("Failed to load role permissions");
    } finally {
      setIsLoadingRolePerms(false);
    }
  };

  const togglePermission = (permissionId: number, currentState: boolean) => {
    const key = String(permissionId);
    setPermissionChanges((prev) => {
      const next = { ...prev };
      if (prev.hasOwnProperty(key)) {
        delete next[key];
      } else {
        next[key] = !currentState;
      }
      return next;
    });
  };

  const getEffectivePermissionState = (
    permission: PermissionItem,
    changes: Record<string, boolean>
  ): boolean => {
    const key = String(permission.id);
    if (changes.hasOwnProperty(key)) {
      return changes[key];
    }
    return permission.isGranted;
  };

  const hasUnsavedChanges = Object.keys(permissionChanges).length > 0;

  const handleSavePermissions = async () => {
    if (!selectedRole || !hasUnsavedChanges) return;

    const allRolePerms = Object.values(rolePermissions).flat();
    const permissionsMap: Record<string, boolean> = {};

    for (const perm of allRolePerms) {
      const key = String(perm.id);
      if (permissionChanges.hasOwnProperty(key)) {
        permissionsMap[key] = permissionChanges[key];
      } else {
        permissionsMap[key] = perm.isGranted;
      }
    }

    setIsSavingPermissions(true);
    try {
      const res = await fetch(`/api/roles/${selectedRole.id}/permissions`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ permissions: permissionsMap }),
      });

      const json = await res.json();

      if (json.success) {
        toast.success(json.message || `Permissions updated for "${selectedRole.name}"`);
        setPermissionChanges({});
        await openPermissionGrid(selectedRole);
        fetchRoles();
      } else {
        toast.error(json.error || "Failed to update permissions");
      }
    } catch (err) {
      console.error("Error saving permissions:", err);
      toast.error("Failed to update permissions");
    } finally {
      setIsSavingPermissions(false);
    }
  };

  const toggleModule = (module: string, currentAllGranted: boolean) => {
    const modulePerms = rolePermissions[module] || [];
    const newChanges: Record<string, boolean> = {};

    for (const perm of modulePerms) {
      const key = String(perm.id);
      if (permissionChanges.hasOwnProperty(key)) {
        continue;
      }
      newChanges[key] = !currentAllGranted;
    }

    setPermissionChanges((prev) => {
      const cleaned = { ...prev };
      for (const perm of modulePerms) {
        const key = String(perm.id);
        if (cleaned.hasOwnProperty(key)) {
          delete cleaned[key];
        }
      }
      return { ...cleaned, ...newChanges };
    });
  };

  // ─── Filtered permission modules ────────────────────────────
  const filteredModules = searchQuery.trim()
    ? modules.filter((mod) => {
        const modulePerms = rolePermissions[mod] || [];
        return modulePerms.some(
          (p) =>
            p.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
      })
    : modules;

  // ─── Permission Grid View ──────────────────────────────────
  if (selectedRole) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 min-w-[36px]"
                onClick={() => {
                  setSelectedRole(null);
                  setRolePermissions({});
                  setPermissionChanges({});
                }}
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                    {selectedRole.name}
                  </h1>
                  {selectedRole.isDefault && (
                    <Badge variant="secondary" className="text-xs">Default</Badge>
                  )}
                  {BUILTIN_ROLES.includes(selectedRole.slug) && (
                    <Badge variant="outline" className="text-xs border-slate-300">Built-in</Badge>
                  )}
                </div>
                <p className="text-sm text-slate-500 mt-0.5">
                  {selectedRole.description || `Manage permissions for the ${selectedRole.name} role`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {hasUnsavedChanges && (
                <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50">
                  {Object.keys(permissionChanges).length} unsaved change{Object.keys(permissionChanges).length !== 1 ? "s" : ""}
                </Badge>
              )}
              <Button
                onClick={handleSavePermissions}
                disabled={!hasUnsavedChanges || isSavingPermissions}
                className="bg-emerald-600 hover:bg-emerald-700 min-h-[44px]"
              >
                {isSavingPermissions ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
                ) : (
                  <><Save className="w-4 h-4 mr-2" /> Save Changes</>
                )}
              </Button>
            </div>
          </div>

          {/* Stats */}
          {isLoadingRolePerms ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-[88px] rounded-2xl" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <StatCard
                icon={CheckCircle2}
                label="Granted"
                value={Object.values(rolePermissions).flat().filter((p) => getEffectivePermissionState(p, permissionChanges)).length}
                color="bg-emerald-500"
                borderColor="border-l-emerald-500"
              />
              <StatCard
                icon={XCircle}
                label="Revoked"
                value={Object.values(rolePermissions).flat().filter((p) => !getEffectivePermissionState(p, permissionChanges)).length}
                color="bg-slate-400"
                borderColor="border-l-slate-400"
              />
              <StatCard
                icon={KeyRound}
                label="Total"
                value={Object.values(rolePermissions).flat().length}
                color="bg-sky-500"
                borderColor="border-l-sky-500"
              />
              <StatCard
                icon={Users}
                label="Users"
                value={selectedRole.userCount}
                color="bg-violet-500"
                borderColor="border-l-violet-500"
              />
            </div>
          )}

          {/* Search */}
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search permissions..."
              className="pl-10 min-h-[44px] bg-slate-50 border-slate-200 focus:bg-white"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Permission Grid */}
          {isLoadingRolePerms ? (
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-2xl border">
                  <div className="p-4 space-y-3">
                    <Skeleton className="h-6 w-40" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredModules.map((module) => {
                const modulePerms = rolePermissions[module] || [];
                const config = MODULE_CONFIG[module] || { icon: "📋", color: "text-slate-700", bgColor: "bg-slate-50" };

                if (modulePerms.length === 0) return null;

                const allGranted = modulePerms.every(
                  (p) => getEffectivePermissionState(p, permissionChanges)
                );
                const grantedCount = modulePerms.filter(
                  (p) => getEffectivePermissionState(p, permissionChanges)
                ).length;

                const filteredPerms = searchQuery.trim()
                  ? modulePerms.filter(
                      (p) =>
                        p.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        p.name.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                  : modulePerms;

                if (filteredPerms.length === 0) return null;

                return (
                  <div key={module} className="rounded-2xl border border-slate-200/60 bg-white overflow-hidden">
                    {/* Module Header */}
                    <div className={`flex items-center justify-between px-4 py-3 ${config.bgColor} border-b`}>
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{config.icon}</span>
                        <div>
                          <h3 className={`font-semibold text-sm capitalize ${config.color}`}>
                            {module.replace(/_/g, " ")}
                          </h3>
                          <p className="text-xs text-slate-500">
                            {grantedCount} of {modulePerms.length} granted
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs h-9 min-h-[36px]"
                        onClick={() => toggleModule(module, allGranted)}
                      >
                        {allGranted ? (
                          <><XCircle className="w-3.5 h-3.5 mr-1" /> Revoke All</>
                        ) : (
                          <><CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Grant All</>
                        )}
                      </Button>
                    </div>

                    {/* Permissions List */}
                    <div className="divide-y">
                      {filteredPerms.map((permission) => {
                        const effectiveState = getEffectivePermissionState(permission, permissionChanges);
                        const isChanged = permissionChanges.hasOwnProperty(String(permission.id));

                        return (
                          <div
                            key={permission.id}
                            className={`flex items-center justify-between px-4 py-3 gap-4 transition-colors min-h-[52px] ${
                              isChanged
                                ? effectiveState
                                  ? "bg-emerald-50/60"
                                  : "bg-amber-50/60"
                                : "hover:bg-slate-50"
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              {effectiveState ? (
                                <Unlock className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                              ) : (
                                <Lock className="w-4 h-4 text-slate-400 flex-shrink-0" />
                              )}
                              <div className="min-w-0">
                                <p className={`text-sm font-medium ${effectiveState ? "text-slate-900" : "text-slate-500"}`}>
                                  {permission.displayName}
                                </p>
                                {permission.description && (
                                  <p className="text-xs text-slate-400 truncate hidden sm:block">
                                    {permission.description}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {isChanged && (
                                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-amber-200 text-amber-800">
                                  modified
                                </span>
                              )}
                              <Switch
                                checked={effectiveState}
                                onCheckedChange={() => togglePermission(permission.id, effectiveState)}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {filteredModules.length === 0 && (
                <div className="rounded-2xl border border-slate-200/60 bg-white py-16">
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                      <Search className="w-8 h-8 text-slate-300" />
                    </div>
                    <p className="text-slate-500 font-medium">No permissions match your search</p>
                    <p className="text-slate-400 text-sm mt-1">Try a different search term</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </DashboardLayout>
    );
  }

  // ─── Main View (Roles Table + Permissions Overview) ─────────
  const levelBadgeColor = (level: number) => {
    if (level <= 1) return "bg-red-100 text-red-700 border-red-200";
    if (level <= 2) return "bg-amber-100 text-amber-700 border-amber-200";
    if (level <= 4) return "bg-sky-100 text-sky-700 border-sky-200";
    if (level <= 6) return "bg-emerald-100 text-emerald-700 border-emerald-200";
    return "bg-slate-100 text-slate-700 border-slate-200";
  };

  const mainLoading = isLoadingRoles || isLoadingPermissions;

  return (
    <DashboardLayout>
      {mainLoading && roles.length === 0 ? (
        <PermissionsSkeleton />
      ) : (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                Permissions Management
              </h1>
              <p className="text-sm text-slate-500 mt-0.5">
                Manage roles and control access to system features
              </p>
            </div>
            <Button
              onClick={openCreateDialog}
              className="bg-emerald-600 hover:bg-emerald-700 min-h-[44px] shadow-sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Role
            </Button>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="bg-white border border-slate-200 p-1 rounded-xl h-auto flex w-full sm:w-auto">
              <TabsTrigger
                value="roles"
                className="flex-1 min-w-[120px] data-[state=active]:bg-emerald-600 data-[state=active]:text-white rounded-lg py-2 text-sm min-h-[44px]"
              >
                <Users className="w-4 h-4 mr-1.5 hidden sm:inline" />
                Roles
              </TabsTrigger>
              <TabsTrigger
                value="permissions"
                className="flex-1 min-w-[120px] data-[state=active]:bg-emerald-600 data-[state=active]:text-white rounded-lg py-2 text-sm min-h-[44px]"
              >
                <KeyRound className="w-4 h-4 mr-1.5 hidden sm:inline" />
                All Permissions
              </TabsTrigger>
            </TabsList>

            {/* ─── Roles Tab ──────────────────────────────────── */}
            <TabsContent value="roles">
              <div className="rounded-2xl border border-slate-200/60 bg-white overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-base font-semibold">System Roles</p>
                      <p className="text-xs text-slate-500">
                        {roles.length} role{roles.length !== 1 ? "s" : ""} configured
                      </p>
                    </div>
                  </div>
                </div>
                <div className="overflow-hidden">
                  {isLoadingRoles ? (
                    <div className="p-6 space-y-3">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="flex items-center gap-4">
                          <Skeleton className="h-5 w-32" />
                          <Skeleton className="h-5 w-24" />
                          <Skeleton className="h-5 w-16" />
                          <Skeleton className="h-5 w-12" />
                          <Skeleton className="h-8 w-8 ml-auto" />
                          <Skeleton className="h-8 w-8" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-slate-50 hover:bg-slate-50">
                            <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                              Role Name
                            </TableHead>
                            <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wider hidden sm:table-cell">
                              Slug
                            </TableHead>
                            <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wider hidden md:table-cell">
                              Level
                            </TableHead>
                            <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wider text-center">
                              Users
                            </TableHead>
                            <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wider text-center hidden sm:table-cell">
                              Permissions
                            </TableHead>
                            <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wider text-right">
                              Actions
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {roles.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={6} className="text-center py-16">
                                <div className="flex flex-col items-center">
                                  <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                                    <Shield className="w-8 h-8 text-slate-300" />
                                  </div>
                                  <p className="text-slate-500 font-medium">No roles found</p>
                                  <p className="text-slate-400 text-sm mt-1">Click &quot;Create Role&quot; to add one</p>
                                  <Button variant="outline" size="sm" onClick={openCreateDialog} className="mt-4 min-h-[44px]">
                                    <Plus className="w-4 h-4 mr-1.5" /> Create Role
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ) : (
                            roles.map((role) => {
                              const isBuiltin = BUILTIN_ROLES.includes(role.slug);
                              return (
                                <TableRow key={role.id} className="cursor-pointer group" onClick={() => openPermissionGrid(role)}>
                                  <TableCell className="font-medium">
                                    <div className="flex items-center gap-2">
                                      <Shield className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition-colors" />
                                      <div>
                                        <span className="text-sm text-slate-900">{role.name}</span>
                                        {role.isDefault && (
                                          <Badge variant="secondary" className="text-[10px] ml-2 px-1.5 py-0">
                                            Default
                                          </Badge>
                                        )}
                                      </div>
                                    </div>
                                  </TableCell>
                                  <TableCell className="hidden sm:table-cell">
                                    <code className="text-xs bg-slate-100 px-2 py-1 rounded font-mono text-slate-600">
                                      {role.slug}
                                    </code>
                                  </TableCell>
                                  <TableCell className="hidden md:table-cell">
                                    <Badge variant="outline" className={`text-[10px] px-2 py-0 ${levelBadgeColor(role.level)}`}>
                                      Level {role.level}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-center">
                                    <span className="text-sm text-slate-700 font-medium tabular-nums">
                                      {role.userCount}
                                    </span>
                                  </TableCell>
                                  <TableCell className="text-center hidden sm:table-cell">
                                    <span className="text-sm text-slate-700 font-medium tabular-nums">
                                      {role.grantedPermissionCount}
                                    </span>
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="min-w-[32px] h-8 w-8"
                                        onClick={() => openPermissionGrid(role)}
                                        title="View/Edit Permissions"
                                      >
                                        <Eye className="w-3.5 h-3.5 text-emerald-600" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="min-w-[32px] h-8 w-8"
                                        onClick={() => openEditDialog(role)}
                                        title="Edit Role"
                                      >
                                        <Pencil className="w-3.5 h-3.5 text-slate-500" />
                                      </Button>
                                      {!isBuiltin && (
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="min-w-[32px] h-8 w-8 hover:bg-red-50 hover:text-red-600"
                                          onClick={() => openDeleteDialog(role)}
                                          title="Delete Role"
                                          disabled={role.userCount > 0}
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </Button>
                                      )}
                                    </div>
                                  </TableCell>
                                </TableRow>
                              );
                            })
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* ─── Permissions Overview Tab ────────────────────── */}
            <TabsContent value="permissions">
              {isLoadingPermissions ? (
                <div className="space-y-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="rounded-2xl border">
                      <div className="p-4 space-y-3">
                        <Skeleton className="h-6 w-40" />
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-64" />
                          <Skeleton className="h-4 w-48" />
                          <Skeleton className="h-4 w-56" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Summary Card */}
                  <div className="rounded-2xl border border-slate-200/60 bg-white overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-100">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-base font-semibold">System Permissions Overview</p>
                          <p className="text-xs text-slate-500">
                            {allPermissions.length} permissions across {modules.length} modules
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                        {modules.map((mod) => {
                          const config = MODULE_CONFIG[mod] || { icon: "📋", color: "text-slate-700", bgColor: "bg-slate-50" };
                          const count = permissionsGrouped[mod]?.length || 0;
                          return (
                            <div
                              key={mod}
                              className={`rounded-xl border px-3 py-2.5 text-center ${config.bgColor} border-slate-200/60 hover:shadow-sm transition-shadow cursor-default`}
                            >
                              <span className="text-lg">{config.icon}</span>
                              <p className={`text-xs font-semibold capitalize mt-1 ${config.color}`}>
                                {mod.replace(/_/g, " ")}
                              </p>
                              <p className="text-[10px] text-slate-500">{count} perm{count !== 1 ? "s" : ""}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* All Permissions by Module */}
                  {modules.map((mod) => {
                    const config = MODULE_CONFIG[mod] || { icon: "📋", color: "text-slate-700", bgColor: "bg-slate-50" };
                    const perms = permissionsGrouped[mod] || [];

                    return (
                      <div key={mod} className="rounded-2xl border border-slate-200/60 bg-white overflow-hidden">
                        <div className={`flex items-center gap-3 px-4 py-3 ${config.bgColor} border-b`}>
                          <span className="text-xl">{config.icon}</span>
                          <div>
                            <h3 className={`font-semibold text-sm capitalize ${config.color}`}>
                              {mod.replace(/_/g, " ")}
                            </h3>
                            <p className="text-xs text-slate-500">
                              {perms.length} permission{perms.length !== 1 ? "s" : ""}
                            </p>
                          </div>
                        </div>
                        <div className="divide-y">
                          {perms.map((perm) => (
                            <div key={perm.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors">
                              <code className="text-xs font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded flex-shrink-0">
                                {perm.name}
                              </code>
                              <span className="text-sm text-slate-700">{perm.displayName}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      )}

      {/* ─── Create/Edit Role Dialog ─────────────────────────── */}
      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${editingRole ? 'bg-amber-100' : 'bg-emerald-100'}`}>
                {editingRole ? <Pencil className="w-4 h-4 text-amber-600" /> : <Plus className="w-4 h-4 text-emerald-600" />}
              </div>
              {editingRole ? "Edit Role" : "Create Role"}
            </DialogTitle>
            <DialogDescription>
              {editingRole
                ? `Edit the "${editingRole.name}" role details`
                : "Create a new custom role with specific permissions"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="role-name">Role Name</Label>
              <Input
                id="role-name"
                placeholder="e.g., HR Manager"
                value={roleForm.name}
                onChange={(e) => handleRoleFormChange("name", e.target.value)}
                className="min-h-[44px]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role-slug">Slug</Label>
              <Input
                id="role-slug"
                placeholder="e.g., hr-manager"
                value={roleForm.slug}
                onChange={(e) => handleRoleFormChange("slug", e.target.value)}
                className="font-mono text-sm min-h-[44px]"
              />
              <p className="text-xs text-slate-400">
                Auto-generated from name. Used for internal identification.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="role-description">Description</Label>
              <Textarea
                id="role-description"
                placeholder="Describe what this role does..."
                value={roleForm.description}
                onChange={(e) => handleRoleFormChange("description", e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role-level">Access Level</Label>
              <Select value={String(roleForm.level)} onValueChange={(v) => handleRoleFormChange("level", Number(v))}>
                <SelectTrigger className="min-h-[44px]">
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Level 1 — Highest (Super Admin)</SelectItem>
                  <SelectItem value="2">Level 2 — Administrator</SelectItem>
                  <SelectItem value="3">Level 3 — Manager</SelectItem>
                  <SelectItem value="4">Level 4 — Specialist</SelectItem>
                  <SelectItem value="5">Level 5 — Operator</SelectItem>
                  <SelectItem value="6">Level 6 — Staff</SelectItem>
                  <SelectItem value="7">Level 7 — Basic (Lowest)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-400">
                Lower level numbers have higher access priority.
              </p>
            </div>
          </div>
          <Separator />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRoleDialogOpen(false)}
              disabled={isSavingRole}
              className="min-h-[44px]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveRole}
              disabled={isSavingRole || !roleForm.name.trim() || !roleForm.slug.trim()}
              className="bg-emerald-600 hover:bg-emerald-700 min-h-[44px]"
            >
              {isSavingRole ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
              ) : editingRole ? (
                <><Save className="w-4 h-4 mr-2" /> Update Role</>
              ) : (
                <><Plus className="w-4 h-4 mr-2" /> Create Role</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Delete Confirmation Dialog ──────────────────────── */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                <Trash2 className="w-4 h-4 text-red-600" />
              </div>
              Delete Role
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deletingRole ? (
                <>
                  Are you sure you want to delete the <strong>&quot;{deletingRole.name}&quot;</strong> role?
                  {deletingRole.userCount > 0 ? (
                    <span className="block mt-2 text-amber-600 font-medium">
                      This role has {deletingRole.userCount} assigned user(s) and cannot be deleted.
                      Reassign users first.
                    </span>
                  ) : (
                    <span className="block mt-2 text-slate-500">
                      This action cannot be undone. All permission mappings for this role will be removed.
                    </span>
                  )}
                </>
              ) : (
                "Are you sure you want to delete this role?"
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting} className="min-h-[44px]">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteRole}
              disabled={isDeleting || (deletingRole?.userCount ?? 0) > 0}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600 min-h-[44px]"
            >
              {isDeleting ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Deleting...</>
              ) : (
                <><Trash2 className="w-4 h-4 mr-2" /> Delete Role</>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
