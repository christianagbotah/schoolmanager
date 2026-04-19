"use client";

import { useEffect, useState, useCallback } from "react";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Loader2,
  Save,
  AlertTriangle,
  CheckCircle,
  Lock,
  Eye,
  EyeOff,
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
import { format } from "date-fns";

// ─── Types ───────────────────────────────────────────────────
interface StudentProfile {
  student_id: number;
  student_code: string;
  name: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  sex: string;
  blood_group: string;
  birthday: string | null;
  address: string;
  admission_date: string | null;
  active_status: number;
  username: string;
  enrolls: { class: { class_id: number; name: string }; section: { section_id: number; name: string } }[];
  parent: { parent_id: number; name: string; phone: string; email: string } | null;
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
export default function StudentProfilePage() {
  const { user, isLoading: authLoading } = useAuth();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isChangingPwd, setIsChangingPwd] = useState(false);
  const [pwdMsg, setPwdMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [pwdDialogOpen, setPwdDialogOpen] = useState(false);

  const fetchProfile = useCallback(async () => {
    if (!user?.id) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/student/profile`);
      if (!res.ok) throw new Error("Failed to fetch profile");
      const data = await res.json();
      setProfile(data);
      setEditEmail(data.email || "");
      setEditPhone(data.phone || "");
      setEditAddress(data.address || "");
    } catch {
      setError("Failed to load profile");
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!authLoading) fetchProfile();
  }, [authLoading, fetchProfile]);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMsg(null);
    try {
      const res = await fetch(`/api/student/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: editEmail, phone: editPhone, address: editAddress }),
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
      const res = await fetch(`/api/student/profile`, {
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
          <div className="pb-4 border-b border-slate-100">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64 mt-2" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Skeleton className="h-96 w-full rounded-2xl" />
            <Skeleton className="h-96 w-full rounded-2xl lg:col-span-2" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold">{error}</h2>
          <Button onClick={fetchProfile} variant="outline" className="min-h-[44px]">Try Again</Button>
        </div>
      </DashboardLayout>
    );
  }

  const enroll = profile?.enrolls?.[0];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">My Profile</h1>
            <p className="text-sm text-slate-500 mt-1">Your personal information and account details</p>
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
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mx-auto mb-4">
                  <GraduationCap className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-lg font-bold text-slate-900">{profile?.name || "Student"}</h2>
                <p className="text-sm text-slate-500 mt-1">{enroll?.class?.name} — {enroll?.section?.name}</p>
                <div className="flex items-center justify-center gap-2 mt-2">
                  <Badge variant="outline" className="font-mono text-xs">{profile?.student_code}</Badge>
                  <Badge variant="secondary" className={profile?.active_status === 1 ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}>
                    {profile?.active_status === 1 ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>
              <Separator className="my-4" />
              <InfoRow icon={Mail} label="Email" value={profile?.email || ""} />
              <InfoRow icon={Phone} label="Phone" value={profile?.phone || ""} />
              <InfoRow icon={Calendar} label="Admission Date" value={profile?.admission_date ? format(new Date(profile.admission_date), "MMM d, yyyy") : ""} />
              {profile?.parent && (
                <>
                  <Separator className="my-2" />
                  <InfoRow icon={User} label="Parent/Guardian" value={profile.parent.name} />
                  <InfoRow icon={Phone} label="Parent Phone" value={profile.parent.phone} />
                </>
              )}
            </CardContent>
          </Card>

          {/* Edit Form */}
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
                <div className="space-y-2">
                  <Label>Username</Label>
                  <Input value={profile?.username || ""} disabled />
                </div>
                <div className="space-y-2">
                  <Label>Student Code</Label>
                  <Input value={profile?.student_code || ""} disabled />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Gender</Label>
                  <Input value={profile?.sex || ""} disabled />
                </div>
                <div className="space-y-2">
                  <Label>Blood Group</Label>
                  <Input value={profile?.blood_group || ""} disabled />
                </div>
                <div className="space-y-2 sm:col-span-2">
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
        </div>
      </div>
    </DashboardLayout>
  );
}
