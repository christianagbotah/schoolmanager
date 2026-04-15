"use client";

import { useEffect, useState, useCallback } from "react";
import {
  User, Mail, Phone, MapPin, Calendar, Loader2, Save,
  AlertTriangle, CheckCircle, Lock, Eye, EyeOff,
  GraduationCap, Award, Building2, Hash, Shield, Camera,
  Briefcase, Heart, CreditCard,
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
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useAuth } from "@/hooks/use-auth";
import { format } from "date-fns";

// ─── Types ───────────────────────────────────────────────────
interface TeacherProfile {
  teacher_id: number;
  name: string;
  first_name?: string;
  last_name?: string;
  teacher_code: string;
  email: string;
  phone: string;
  gender: string;
  blood_group: string;
  birthday: string | null;
  address: string;
  joining_date: string | null;
  active_status: number;
  designation?: { des_name: string };
  department?: { dep_name: string };
  salary?: number;
  qualifications?: string;
}

// ─── Info Row ────────────────────────────────────────────────
function InfoRow({ icon: Icon, label, value, mono = false }: { icon: React.ElementType; label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start gap-3 py-3">
      <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Icon className="w-4 h-4 text-slate-500" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">{label}</p>
        <p className={`text-sm text-slate-900 font-medium mt-0.5 truncate ${mono ? "font-mono" : ""}`}>{value || "—"}</p>
      </div>
    </div>
  );
}

// ─── Avatar Initials ────────────────────────────────────────
function AvatarInitials({ name, size = "lg" }: { name: string; size?: "sm" | "lg" }) {
  const initials = name?.split(" ").map(n => n.charAt(0)).join("").toUpperCase().slice(0, 2) || "?";
  const sizeClasses = size === "lg" ? "w-20 h-20 text-2xl" : "w-10 h-10 text-sm";
  return (
    <div className={`${sizeClasses} rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold shadow-lg`}>
      {initials}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────
export default function TeacherProfilePage() {
  const { user, isLoading: authLoading } = useAuth();
  const [profile, setProfile] = useState<TeacherProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit fields
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Password change
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [pwdMsg, setPwdMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [pwdDialogOpen, setPwdDialogOpen] = useState(false);

  // ─── Fetch profile ──────────────────────────────────────
  const fetchProfile = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/teacher/profile");
      if (!res.ok) throw new Error("Failed to fetch profile");
      const data = await res.json();
      setProfile(data);
      setEditName(data.name || "");
      setEditEmail(data.email || "");
      setEditPhone(data.phone || "");
      setEditAddress(data.address || "");
    } catch {
      setError("Failed to load your profile");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading) fetchProfile();
  }, [authLoading, fetchProfile]);

  // ─── Save profile ──────────────────────────────────────
  const handleSave = async () => {
    setIsSaving(true);
    setSaveMsg(null);
    try {
      const res = await fetch("/api/teacher/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName,
          email: editEmail,
          phone: editPhone,
          address: editAddress,
        }),
      });
      if (!res.ok) throw new Error("Failed to update profile");
      setSaveMsg({ type: "success", text: "Profile updated successfully" });
      fetchProfile();
    } catch {
      setSaveMsg({ type: "error", text: "Failed to update profile" });
    } finally {
      setIsSaving(false);
    }
  };

  // ─── Change password ───────────────────────────────────
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
      const res = await fetch("/api/teacher/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: newPassword }),
      });
      if (!res.ok) throw new Error("Failed to change password");
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

  if (isLoading || authLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Skeleton className="h-96 w-full rounded-xl" />
            <Skeleton className="h-96 w-full rounded-xl lg:col-span-2" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-slate-900">{error}</h2>
          <Button onClick={fetchProfile} variant="outline">Try Again</Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
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
                <Lock className="w-4 h-4 mr-2" />
                Change Password
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Lock className="w-5 h-5 text-slate-700" />
                  Change Password
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                {pwdMsg && (
                  <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
                    pwdMsg.type === "success" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"
                  }`}>
                    {pwdMsg.type === "success" ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                    {pwdMsg.text}
                  </div>
                )}
                <div className="space-y-2">
                  <Label>New Password</Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {newPassword && newPassword.length < 6 && (
                    <p className="text-xs text-red-500">Minimum 6 characters</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Confirm Password</Label>
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                  />
                  {confirmPassword && newPassword !== confirmPassword && (
                    <p className="text-xs text-red-500">Passwords do not match</p>
                  )}
                </div>
                <Button
                  onClick={handleChangePassword}
                  disabled={isChangingPassword || !newPassword || !confirmPassword || newPassword.length < 6 || newPassword !== confirmPassword}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 min-h-[44px]"
                >
                  {isChangingPassword ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Lock className="w-4 h-4 mr-2" />}
                  Update Password
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ─── Profile Card ─────────────────────────────── */}
          <Card className="gap-0 overflow-hidden">
            {/* Gradient Header */}
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-6 text-center text-white relative">
              <div className="absolute -bottom-10 left-1/2 -translate-x-1/2">
                <AvatarInitials name={profile?.name || "Teacher"} />
              </div>
            </div>

            {/* Content */}
            <CardContent className="pt-14 pb-6 px-6">
              <div className="text-center mb-1">
                <h2 className="text-lg font-bold text-slate-900">{profile?.name || "Teacher"}</h2>
                {profile?.designation?.des_name && (
                  <p className="text-sm text-slate-500 mt-0.5">{profile.designation.des_name}</p>
                )}
              </div>

              <div className="flex items-center justify-center gap-1 mt-3 flex-wrap">
                {profile?.department && (
                  <Badge variant="outline" className="mt-1"><Building2 className="w-3 h-3 mr-1" />{profile.department.dep_name}</Badge>
                )}
                <Badge variant="secondary" className={`mt-1 ${profile?.active_status === 1 ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                  {profile?.active_status === 1 ? "Active" : "Inactive"}
                </Badge>
              </div>

              <Separator className="my-5" />

              <div>
                <InfoRow icon={Mail} label="Email" value={profile?.email || ""} />
                <InfoRow icon={Phone} label="Phone" value={profile?.phone || ""} />
                <InfoRow icon={Hash} label="Teacher Code" value={profile?.teacher_code || ""} mono />
                <InfoRow icon={Calendar} label="Joining Date" value={profile?.joining_date ? format(new Date(profile.joining_date), "MMM d, yyyy") : ""} />
                {profile?.birthday && (
                  <InfoRow icon={Heart} label="Birthday" value={format(new Date(profile.birthday), "MMM d, yyyy")} />
                )}
                {profile?.gender && (
                  <InfoRow icon={User} label="Gender" value={profile.gender.charAt(0).toUpperCase() + profile.gender.slice(1)} />
                )}
                {profile?.blood_group && (
                  <InfoRow icon={CreditCard} label="Blood Group" value={profile.blood_group} />
                )}
                {profile?.address && (
                  <InfoRow icon={MapPin} label="Address" value={profile.address} />
                )}
              </div>
            </CardContent>
          </Card>

          {/* ─── Edit Form ────────────────────────────────── */}
          <Card className="gap-4 lg:col-span-2">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <Save className="w-4 h-4 text-emerald-600" />
                </div>
                <CardTitle className="text-base font-semibold">Edit Information</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {saveMsg && (
                <div className={`flex items-center gap-2 p-3 rounded-lg text-sm mb-4 ${
                  saveMsg.type === "success" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"
                }`}>
                  {saveMsg.type === "success" ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                  {saveMsg.text}
                </div>
              )}

              <div className="space-y-6">
                {/* Contact Information */}
                <div>
                  <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                    <Phone className="w-4 h-4 text-slate-500" />
                    Contact Information
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Full Name</Label>
                      <Input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Enter your full name" />
                    </div>
                    <div className="space-y-2">
                      <Label>Email Address</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} className="pl-9" placeholder="your@email.com" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Phone Number</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} className="pl-9" placeholder="+233 XXX XXX XXXX" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Address</Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input value={editAddress} onChange={(e) => setEditAddress(e.target.value)} className="pl-9" placeholder="Enter your address" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Read-Only Information */}
                <div>
                  <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-slate-500" />
                    Employment Details
                    <Badge variant="outline" className="text-[10px] text-slate-400 ml-1">Managed by Admin</Badge>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Gender</Label>
                      <Input value={profile?.gender || ""} disabled className="bg-slate-50" />
                    </div>
                    <div className="space-y-2">
                      <Label>Blood Group</Label>
                      <Input value={profile?.blood_group || ""} disabled className="bg-slate-50" />
                    </div>
                    <div className="space-y-2">
                      <Label>Birthday</Label>
                      <Input
                        value={profile?.birthday ? format(new Date(profile.birthday), "yyyy-MM-dd") : ""}
                        disabled
                        className="bg-slate-50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Teacher Code</Label>
                      <Input value={profile?.teacher_code || ""} disabled className="bg-slate-50 font-mono" />
                    </div>
                    <div className="space-y-2">
                      <Label>Joining Date</Label>
                      <Input
                        value={profile?.joining_date ? format(new Date(profile.joining_date), "yyyy-MM-dd") : ""}
                        disabled
                        className="bg-slate-50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Designation</Label>
                      <Input value={profile?.designation?.des_name || ""} disabled className="bg-slate-50" />
                    </div>
                  </div>
                </div>

                {/* Save Button */}
                <div className="flex justify-end pt-2">
                  <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="bg-emerald-600 hover:bg-emerald-700 min-w-[44px] min-h-[44px]"
                  >
                    {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    Save Changes
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
