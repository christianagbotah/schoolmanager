"use client";

import { useEffect, useState, useCallback } from "react";
import {
  User, Mail, Phone, MapPin, Calendar, Loader2, Save,
  AlertTriangle, CheckCircle, Lock, Eye, EyeOff,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import { format } from "date-fns";

// ─── Info Row ────────────────────────────────────────────────
function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 py-3">
      <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Icon className="w-4 h-4 text-slate-500" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">{label}</p>
        <p className="text-sm text-slate-900 font-medium mt-0.5 truncate">{value || "—"}</p>
      </div>
    </div>
  );
}

/**
 * Shared Profile Page
 * - All roles can view/edit their own profile
 * - Fetches data from the appropriate API based on user role
 */
export default function ProfilePage() {
  const { user, role, isLoading: authLoading } = useAuth();
  const [profile, setProfile] = useState<Record<string, unknown> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit fields
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Password change
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [pwdMsg, setPwdMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [pwdDialogOpen, setPwdDialogOpen] = useState(false);

  // ─── Fetch profile ─────────────────────────────────────────
  const fetchProfile = useCallback(async () => {
    if (!user?.id) return;
    setIsLoading(true);
    try {
      // TODO: Use role to determine which API to call
      const apiMap: Record<string, string> = {
        admin: `/api/admins/${user.id}`,
        teacher: `/api/teachers/${user.id}`,
        student: `/api/students/${user.id}`,
        parent: `/api/parents/${user.id}`,
        accountant: `/api/admins/${user.id}`,
        librarian: `/api/admins/${user.id}`,
      };
      const url = apiMap[role || ""] || `/api/teachers/${user.id}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        setEditName((data.name as string) || user.name || "");
        setEditEmail((data.email as string) || user.email || "");
        setEditPhone((data.phone as string) || "");
      }
    } catch {
      setError("Failed to load your profile");
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, role, user?.name, user?.email]);

  useEffect(() => {
    if (!authLoading && user?.id) fetchProfile();
  }, [authLoading, user?.id, fetchProfile]);

  // ─── Save profile ──────────────────────────────────────────
  const handleSave = async () => {
    setIsSaving(true);
    setSaveMsg(null);
    try {
      const apiMap: Record<string, string> = {
        admin: `/api/admins/${user?.id}`,
        teacher: `/api/teachers/${user?.id}`,
        student: `/api/students/${user?.id}`,
        parent: `/api/parents/${user?.id}`,
        accountant: `/api/admins/${user?.id}`,
        librarian: `/api/admins/${user?.id}`,
      };
      const url = apiMap[role || ""] || `/api/teachers/${user?.id}`;
      const res = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName, email: editEmail, phone: editPhone }),
      });
      if (!res.ok) throw new Error("Failed to update");
      setSaveMsg({ type: "success", text: "Profile updated successfully" });
      fetchProfile();
    } catch {
      setSaveMsg({ type: "error", text: "Failed to update profile" });
    } finally {
      setIsSaving(false);
    }
  };

  // ─── Change password ───────────────────────────────────────
  const handleChangePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      setPwdMsg({ type: "error", text: "Password must be at least 6 characters" });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwdMsg({ type: "error", text: "Passwords do not match" });
      return;
    }
    setIsChangingPassword(true);
    setPwdMsg(null);
    try {
      const apiMap: Record<string, string> = {
        admin: `/api/admins/${user?.id}`,
        teacher: `/api/teachers/${user?.id}`,
        student: `/api/students/${user?.id}`,
        parent: `/api/parents/${user?.id}`,
        accountant: `/api/admins/${user?.id}`,
        librarian: `/api/admins/${user?.id}`,
      };
      const url = apiMap[role || ""] || `/api/teachers/${user?.id}`;
      const res = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: newPassword }),
      });
      if (!res.ok) throw new Error("Failed");
      setPwdMsg({ type: "success", text: "Password changed successfully" });
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPwdDialogOpen(false), 1500);
    } catch {
      setPwdMsg({ type: "error", text: "Failed to change password" });
    } finally {
      setIsChangingPassword(false);
    }
  };

  // ─── Loading / Error states ────────────────────────────────
  if (isLoading || authLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-80 w-full rounded-xl" />
          <Skeleton className="h-80 w-full rounded-xl lg:col-span-2" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
          <AlertTriangle className="w-8 h-8 text-red-600" />
        </div>
        <h2 className="text-xl font-semibold text-slate-900">{error}</h2>
        <Button onClick={fetchProfile} variant="outline">Try Again</Button>
      </div>
    );
  }

  const profileName = (profile?.name as string) || user?.name || "User";
  const roleLabel = role ? role.charAt(0).toUpperCase() + role.slice(1) : "User";

  return (
    <div className="space-y-6">
      {/* ─── Header ─────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">My Profile</h1>
          <p className="text-sm text-slate-500 mt-1">View and manage your personal information</p>
        </div>
        <Dialog open={pwdDialogOpen} onOpenChange={setPwdDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="min-w-[44px] min-h-[44px]">
              <Lock className="w-4 h-4 mr-2" /> Change Password
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Change Password</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-4">
              {pwdMsg && (
                <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${pwdMsg.type === "success" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                  {pwdMsg.type === "success" ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                  {pwdMsg.text}
                </div>
              )}
              <div className="space-y-2">
                <Label>New Password</Label>
                <div className="relative">
                  <Input type={showPassword ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Enter new password" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Confirm Password</Label>
                <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm new password" />
              </div>
              <Button onClick={handleChangePassword} disabled={isChangingPassword} className="w-full bg-emerald-600 hover:bg-emerald-700 min-h-[44px]">
                {isChangingPassword ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Lock className="w-4 h-4 mr-2" />}
                Update Password
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ─── Profile Card ─────────────────────────────── */}
        <Card className="gap-4">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center mx-auto mb-4">
                <User className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">{profileName}</h2>
              <p className="text-sm text-slate-500 mt-1">{roleLabel}</p>
              <Badge variant="secondary" className="mt-2 bg-emerald-100 text-emerald-700">Active</Badge>
            </div>
            <Separator className="my-4" />
            <InfoRow icon={Mail} label="Email" value={editEmail} />
            <InfoRow icon={Phone} label="Phone" value={editPhone} />
            {(profile?.joining_date || profile?.created_at) && (
              <InfoRow
                icon={Calendar}
                label="Joined"
                value={format(new Date((profile?.joining_date || profile?.created_at) as string), "MMM d, yyyy")}
              />
            )}
          </CardContent>
        </Card>

        {/* ─── Edit Form ────────────────────────────────── */}
        <Card className="gap-4 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Edit Information</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {saveMsg && (
              <div className={`flex items-center gap-2 p-3 rounded-lg text-sm mb-4 ${saveMsg.type === "success" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                {saveMsg.type === "success" ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                {saveMsg.text}
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Full Name</Label><Input value={editName} onChange={(e) => setEditName(e.target.value)} /></div>
              <div className="space-y-2"><Label>Email</Label><Input type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} /></div>
              <div className="space-y-2"><Label>Phone</Label><Input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} /></div>
            </div>
            <div className="flex justify-end mt-6">
              <Button onClick={handleSave} disabled={isSaving} className="bg-emerald-600 hover:bg-emerald-700 min-w-[44px] min-h-[44px]">
                {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Save Changes
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
