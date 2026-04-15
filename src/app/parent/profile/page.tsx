"use client";

import { useEffect, useState, useCallback } from "react";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Loader2,
  Save,
  AlertTriangle,
  CheckCircle,
  Lock,
  Eye,
  EyeOff,
  Users,
  Briefcase,
  GraduationCap,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useAuth } from "@/hooks/use-auth";

// ─── Types ───────────────────────────────────────────────────
interface ChildItem {
  student_id: number;
  student_code: string;
  name: string;
  first_name: string;
  last_name: string;
  sex: string;
  mute: number;
  enrolls: { class: { name: string; name_numeric: number }; section: { name: string } }[];
}

interface ParentProfile {
  parent_id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  profession: string;
  designation: string;
  guardian_gender: string;
  guardian_is_the: string;
  father_name: string;
  father_phone: string;
  mother_name: string;
  mother_phone: string;
  active_status: number;
  children: ChildItem[];
}

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

// ─── Main Component ──────────────────────────────────────────
export default function ParentProfilePage() {
  const { isLoading: authLoading, isParent } = useAuth();
  const [profile, setProfile] = useState<ParentProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit form state
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editProfession, setEditProfession] = useState("");
  const [editFatherName, setEditFatherName] = useState("");
  const [editFatherPhone, setEditFatherPhone] = useState("");
  const [editMotherName, setEditMotherName] = useState("");
  const [editMotherPhone, setEditMotherPhone] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Password change
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isChangingPwd, setIsChangingPwd] = useState(false);
  const [pwdMsg, setPwdMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [pwdDialogOpen, setPwdDialogOpen] = useState(false);

  const fetchProfile = useCallback(async () => {
    if (!isParent) return;
    setIsLoading(true);
    try {
      const res = await fetch("/api/parent/profile");
      if (!res.ok) throw new Error("Failed to fetch profile");
      const data = await res.json();
      setProfile(data);
      setEditEmail(data.email || "");
      setEditPhone(data.phone || "");
      setEditAddress(data.address || "");
      setEditProfession(data.profession || "");
      setEditFatherName(data.father_name || "");
      setEditFatherPhone(data.father_phone || "");
      setEditMotherName(data.mother_name || "");
      setEditMotherPhone(data.mother_phone || "");
    } catch {
      setError("Failed to load profile");
    } finally {
      setIsLoading(false);
    }
  }, [isParent]);

  useEffect(() => {
    if (!authLoading && isParent) fetchProfile();
  }, [authLoading, isParent, fetchProfile]);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMsg(null);
    try {
      const res = await fetch("/api/parent/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: editEmail,
          phone: editPhone,
          address: editAddress,
          profession: editProfession,
          father_name: editFatherName,
          father_phone: editFatherPhone,
          mother_name: editMotherName,
          mother_phone: editMotherPhone,
        }),
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

  const handleChangePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      setPwdMsg({ type: "error", text: "Password must be at least 6 characters" });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwdMsg({ type: "error", text: "Passwords do not match" });
      return;
    }
    setIsChangingPwd(true);
    setPwdMsg(null);
    try {
      const res = await fetch("/api/parent/profile", {
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
      setIsChangingPwd(false);
    }
  };

  if (isLoading || authLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Skeleton className="h-80 w-full rounded-xl" />
            <Skeleton className="h-80 w-full rounded-xl lg:col-span-2" />
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
          <h2 className="text-xl font-semibold">{error}</h2>
          <Button onClick={fetchProfile} variant="outline">Try Again</Button>
        </div>
      </DashboardLayout>
    );
  }

  const activeChildren = (profile?.children || []).filter((c) => c.mute === 0);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">My Profile</h1>
            <p className="text-sm text-slate-500 mt-1">Manage your personal information and account settings</p>
          </div>
          <Dialog open={pwdDialogOpen} onOpenChange={setPwdDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="min-w-[44px] min-h-[44px]">
                <Lock className="w-4 h-4 mr-2" />Change Password
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
                  <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm password" />
                </div>
                <Button onClick={handleChangePassword} disabled={isChangingPwd} className="w-full bg-emerald-600 hover:bg-emerald-700 min-h-[44px]">
                  {isChangingPwd ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Lock className="w-4 h-4 mr-2" />}
                  Update Password
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Card */}
          <Card className="gap-4">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center mx-auto mb-4">
                  <Users className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-lg font-bold text-slate-900">{profile?.name || "Parent"}</h2>
                <p className="text-sm text-slate-500 mt-1">{profile?.guardian_is_the || "Guardian"}</p>
                <div className="flex items-center justify-center gap-2 mt-2">
                  <Badge variant="secondary" className={profile?.active_status === 1 ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}>
                    {profile?.active_status === 1 ? "Active" : "Inactive"}
                  </Badge>
                  <Badge variant="secondary" className="bg-sky-100 text-sky-700">
                    {activeChildren.length} child{activeChildren.length !== 1 ? "ren" : ""}
                  </Badge>
                </div>
              </div>
              <Separator className="my-4" />
              <InfoRow icon={Mail} label="Email" value={profile?.email || ""} />
              <InfoRow icon={Phone} label="Phone" value={profile?.phone || ""} />
              <InfoRow icon={MapPin} label="Address" value={profile?.address || ""} />
              <InfoRow icon={Briefcase} label="Profession" value={profile?.profession || ""} />
            </CardContent>
          </Card>

          {/* Edit Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Edit Personal Info */}
            <Card className="gap-4">
              <CardHeader>
                <CardTitle className="text-base font-semibold">Edit Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {saveMsg && (
                  <div className={`flex items-center gap-2 p-3 rounded-lg text-sm mb-4 ${saveMsg.type === "success" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                    {saveMsg.type === "success" ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                    {saveMsg.text}
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Profession</Label>
                    <Input value={editProfession} onChange={(e) => setEditProfession(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Address</Label>
                    <Input value={editAddress} onChange={(e) => setEditAddress(e.target.value)} />
                  </div>
                </div>
                <div className="flex justify-end mt-6">
                  <Button onClick={handleSave} disabled={isSaving} className="bg-emerald-600 hover:bg-emerald-700 min-w-[44px] min-h-[44px]">
                    {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    Save Changes
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Parent/Guardian Details */}
            <Card className="gap-4">
              <CardHeader>
                <CardTitle className="text-base font-semibold">Parent/Guardian Details</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Father&apos;s Name</Label>
                    <Input value={editFatherName} onChange={(e) => setEditFatherName(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Father&apos;s Phone</Label>
                    <Input value={editFatherPhone} onChange={(e) => setEditFatherPhone(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Mother&apos;s Name</Label>
                    <Input value={editMotherName} onChange={(e) => setEditMotherName(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Mother&apos;s Phone</Label>
                    <Input value={editMotherPhone} onChange={(e) => setEditMotherPhone(e.target.value)} />
                  </div>
                </div>
                <div className="flex justify-end mt-6">
                  <Button onClick={handleSave} disabled={isSaving} className="bg-emerald-600 hover:bg-emerald-700 min-w-[44px] min-h-[44px]">
                    {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    Save Details
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Linked Children */}
            <Card className="gap-4">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <GraduationCap className="w-4 h-4 text-emerald-600" />
                  </div>
                  <CardTitle className="text-base font-semibold">Linked Children</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {activeChildren.length === 0 ? (
                  <div className="text-center py-12">
                    <GraduationCap className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-400 text-sm">No children linked to your account</p>
                    <p className="text-slate-300 text-xs mt-1">Contact the school administrator</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {activeChildren.map((child) => {
                      const enroll = child.enrolls?.[0];
                      return (
                        <div key={child.student_id} className="flex items-center gap-3 p-4 rounded-lg border border-slate-200 hover:border-emerald-200 hover:bg-emerald-50/30 transition-all">
                          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center flex-shrink-0">
                            <span className="text-white font-bold text-sm">
                              {(child.first_name || child.name || "S").charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-slate-900 truncate">{child.name || `${child.first_name} ${child.last_name}`.trim()}</p>
                            <p className="text-xs text-slate-500">
                              {enroll ? `${enroll.class.name} ${enroll.class.name_numeric} — ${enroll.section.name}` : "No class assigned"}
                            </p>
                          </div>
                          <Badge variant="secondary" className="font-mono text-xs">{child.student_code}</Badge>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
