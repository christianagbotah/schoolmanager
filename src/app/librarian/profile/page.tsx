"use client";

import { useEffect, useState, useCallback } from "react";
import {
  User, Lock, Mail, Phone, MapPin, Save, Loader2, AlertTriangle,
  CheckCircle2, BookOpen, Library,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { DashboardLayout } from "@/components/layout/dashboard-layout";

// ─── Types ───────────────────────────────────────────────────
interface LibrarianProfile {
  librarian_id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  active_status: number;
  stats: {
    bookCount: number;
    issuedCount: number;
    pendingCount: number;
  };
}

// ─── Helpers ─────────────────────────────────────────────────
function StatSkeleton() {
  return <Card className="gap-4 py-4"><CardContent className="px-4 pb-0 pt-0"><div className="flex items-center justify-between"><div className="space-y-2 flex-1"><Skeleton className="h-4 w-24" /><Skeleton className="h-8 w-20" /></div><Skeleton className="h-10 w-10 rounded-xl" /></div></CardContent></Card>;
}

// ─── Main Component ──────────────────────────────────────────
export default function LibrarianProfilePage() {
  const [profile, setProfile] = useState<LibrarianProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit form
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({ email: "", phone: "", address: "" });
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Password form
  const [passwordForm, setPasswordForm] = useState({ password: "", confirmPassword: "" });
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchProfile = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/librarian/profile");
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setProfile(data);
      setFormData({ email: data.email || "", phone: data.phone || "", address: data.address || "" });
    } catch {
      setError("Unable to load profile.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const handleSaveProfile = async () => {
    setSaving(true);
    setSaveMessage(null);
    try {
      const res = await fetch("/api/librarian/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (res.ok) {
        setSaveMessage({ type: "success", text: data.message });
        setEditMode(false);
        fetchProfile();
      } else {
        setSaveMessage({ type: "error", text: data.error });
      }
    } catch {
      setSaveMessage({ type: "error", text: "Failed to update profile" });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordForm.password !== passwordForm.confirmPassword) {
      setPasswordMessage({ type: "error", text: "Passwords do not match" });
      return;
    }
    if (passwordForm.password.length < 6) {
      setPasswordMessage({ type: "error", text: "Password must be at least 6 characters" });
      return;
    }
    setSavingPassword(true);
    setPasswordMessage(null);
    try {
      const res = await fetch("/api/librarian/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: passwordForm.password }),
      });
      const data = await res.json();
      if (res.ok) {
        setPasswordMessage({ type: "success", text: data.message });
        setPasswordForm({ password: "", confirmPassword: "" });
      } else {
        setPasswordMessage({ type: "error", text: data.error });
      }
    } catch {
      setPasswordMessage({ type: "error", text: "Failed to change password" });
    } finally {
      setSavingPassword(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-72" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Skeleton className="h-80 rounded-xl" />
            <Skeleton className="h-80 md:col-span-2 rounded-xl" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !profile) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center"><AlertTriangle className="w-8 h-8 text-red-600" /></div>
          <h2 className="text-xl font-semibold text-slate-900">Something went wrong</h2>
          <p className="text-slate-500">{error}</p>
          <Button onClick={fetchProfile} variant="outline"><Loader2 className="w-4 h-4 mr-2" />Try Again</Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 p-6 text-white shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
              <User className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">My Profile</h1>
              <p className="text-violet-100 text-sm">Manage your personal information and account settings</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Profile Card */}
          <Card className="gap-4">
            <CardHeader className="pb-0">
              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 rounded-full bg-violet-100 flex items-center justify-center mb-3">
                  <span className="text-2xl font-bold text-violet-600">
                    {profile.name?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-slate-900">{profile.name}</h3>
                <Badge className="bg-violet-100 text-violet-700 mt-1">Librarian</Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              <Separator />
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 rounded-lg bg-violet-50 border border-violet-200">
                  <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center mx-auto mb-1">
                    <BookOpen className="w-4 h-4 text-violet-600" />
                  </div>
                  <p className="text-lg font-bold text-violet-700">{profile.stats.bookCount}</p>
                  <p className="text-xs text-violet-600">Books</p>
                </div>
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                  <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-1">
                    <BookOpen className="w-4 h-4 text-amber-600" />
                  </div>
                  <p className="text-lg font-bold text-amber-700">{profile.stats.issuedCount}</p>
                  <p className="text-xs text-amber-600">Issued</p>
                </div>
                <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                  <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-1">
                    <BookOpen className="w-4 h-4 text-red-600" />
                  </div>
                  <p className="text-lg font-bold text-red-700">{profile.stats.pendingCount}</p>
                  <p className="text-xs text-red-600">Pending</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Right: Edit Forms */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information */}
            <Card className="gap-4">
              <CardHeader className="pb-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center"><User className="w-4 h-4 text-violet-600" /></div>
                    <CardTitle className="text-base font-semibold">Personal Information</CardTitle>
                  </div>
                  {!editMode ? (
                    <Button variant="outline" size="sm" onClick={() => setEditMode(true)}>Edit</Button>
                  ) : (
                    <Button variant="ghost" size="sm" onClick={() => { setEditMode(false); setFormData({ email: profile.email, phone: profile.phone, address: profile.address }); setSaveMessage(null); }}>Cancel</Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-0 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-slate-500 mb-1 block">Full Name</label>
                    <Input value={profile.name} disabled className="bg-slate-50" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500 mb-1 block">Role</label>
                    <Input value="Librarian" disabled className="bg-slate-50" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500 mb-1 flex items-center gap-1"><Mail className="w-3 h-3" /> Email</label>
                    <Input
                      value={formData.email}
                      onChange={(e) => setFormData(f => ({ ...f, email: e.target.value }))}
                      disabled={!editMode}
                      type="email"
                      placeholder="email@example.com"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500 mb-1 flex items-center gap-1"><Phone className="w-3 h-3" /> Phone</label>
                    <Input
                      value={formData.phone}
                      onChange={(e) => setFormData(f => ({ ...f, phone: e.target.value }))}
                      disabled={!editMode}
                      placeholder="Phone number"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-xs font-medium text-slate-500 mb-1 flex items-center gap-1"><MapPin className="w-3 h-3" /> Address</label>
                    <Input
                      value={formData.address}
                      onChange={(e) => setFormData(f => ({ ...f, address: e.target.value }))}
                      disabled={!editMode}
                      placeholder="Address"
                    />
                  </div>
                </div>

                {saveMessage && (
                  <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${saveMessage.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                    {saveMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                    {saveMessage.text}
                  </div>
                )}

                {editMode && (
                  <div className="flex justify-end">
                    <Button onClick={handleSaveProfile} disabled={saving} className="bg-violet-600 hover:bg-violet-700">
                      {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                      Save Changes
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Change Password */}
            <Card className="gap-4">
              <CardHeader className="pb-0">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center"><Lock className="w-4 h-4 text-amber-600" /></div>
                  <CardTitle className="text-base font-semibold">Change Password</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-0 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-slate-500 mb-1 block">New Password</label>
                    <Input
                      type="password"
                      value={passwordForm.password}
                      onChange={(e) => setPasswordForm(f => ({ ...f, password: e.target.value }))}
                      placeholder="Min 6 characters"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500 mb-1 block">Confirm Password</label>
                    <Input
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm(f => ({ ...f, confirmPassword: e.target.value }))}
                      placeholder="Confirm password"
                    />
                  </div>
                </div>

                {passwordMessage && (
                  <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${passwordMessage.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                    {passwordMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                    {passwordMessage.text}
                  </div>
                )}

                <div className="flex justify-end">
                  <Button
                    onClick={handleChangePassword}
                    disabled={savingPassword || !passwordForm.password || !passwordForm.confirmPassword}
                    className="bg-amber-600 hover:bg-amber-700"
                  >
                    {savingPassword ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Lock className="w-4 h-4 mr-2" />}
                    Update Password
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
