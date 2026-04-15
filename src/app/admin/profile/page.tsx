'use client';

import { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  User, Mail, Phone, Lock, Camera, Save, Loader2, Shield,
  Pencil, Key, Upload, X, CheckCircle,
} from 'lucide-react';

interface AdminProfile {
  admin_id: number;
  name: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  gender: string;
  level: string;
  image: string;
  active_status: number;
}

export default function AdminProfilePage() {
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [editForm, setEditForm] = useState({ name: '', email: '', phone: '', gender: '' });
  const [passwordForm, setPasswordForm] = useState({ current_password: '', new_password: '', confirm_password: '' });

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/profile');
      const data = await res.json();
      if (data.admin_id) {
        setProfile(data);
        setEditForm({ name: data.name, email: data.email, phone: data.phone, gender: data.gender });
      }
    } catch {
      toast.error('Failed to load profile');
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const handleSaveProfile = async () => {
    if (!editForm.name.trim()) return toast.error('Name is required');
    if (!editForm.email.trim()) return toast.error('Email is required');
    setSaving(true);
    try {
      const res = await fetch('/api/admin/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast.success('Profile updated successfully');
      setEditOpen(false);
      fetchProfile();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update';
      toast.error(msg);
    }
    setSaving(false);
  };

  const handleChangePassword = async () => {
    if (!passwordForm.current_password) return toast.error('Current password is required');
    if (!passwordForm.new_password) return toast.error('New password is required');
    if (passwordForm.new_password.length < 6) return toast.error('Password must be at least 6 characters');
    if (passwordForm.new_password !== passwordForm.confirm_password) return toast.error('Passwords do not match');
    setSaving(true);
    try {
      const res = await fetch('/api/admin/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'change_password', ...passwordForm }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast.success('Password changed successfully');
      setPasswordOpen(false);
      setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to change password';
      toast.error(msg);
    }
    setSaving(false);
  };

  const handleUploadPicture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/admin/profile', { method: 'POST', body: fd });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast.success('Profile picture updated');
      fetchProfile();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Upload failed';
      toast.error(msg);
    }
    setUploading(false);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Skeleton className="h-[300px] rounded-xl" />
            <Skeleton className="h-[300px] rounded-xl lg:col-span-2" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div><h1 className="text-2xl font-bold text-slate-900 tracking-tight">My Profile</h1><p className="text-sm text-slate-500 mt-1">Manage your account settings and preferences</p></div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Card */}
          <Card className="border-slate-200/60">
            <CardContent className="p-6 text-center space-y-4">
              <div className="relative inline-block">
                <Avatar className="w-24 h-24 mx-auto">
                  <AvatarFallback className="bg-emerald-100 text-emerald-700 text-2xl font-bold">
                    {profile?.name?.charAt(0)?.toUpperCase() || 'A'}
                  </AvatarFallback>
                </Avatar>
                <label className="absolute -bottom-1 -right-1 w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-emerald-700 transition-colors shadow-sm">
                  {uploading ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <Camera className="w-4 h-4 text-white" />}
                  <input type="file" accept="image/*" className="hidden" onChange={handleUploadPicture} />
                </label>
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">{profile?.name || 'Admin'}</h2>
                <p className="text-sm text-slate-500">{profile?.email || 'No email'}</p>
                <div className="flex items-center justify-center gap-2 mt-2">
                  <Badge className="bg-emerald-100 text-emerald-700 text-xs"><Shield className="w-3 h-3 mr-1" />{profile?.level || 'Admin'}</Badge>
                  <Badge className={`${profile?.active_status === 1 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'} text-xs`}>{profile?.active_status === 1 ? 'Active' : 'Inactive'}</Badge>
                </div>
              </div>
              <Separator />
              <div className="space-y-2 text-left">
                <div className="flex items-center gap-2 text-sm"><Phone className="w-4 h-4 text-slate-400" /><span className="text-slate-700">{profile?.phone || 'No phone'}</span></div>
                <div className="flex items-center gap-2 text-sm"><Mail className="w-4 h-4 text-slate-400" /><span className="text-slate-700">{profile?.email || 'No email'}</span></div>
                <div className="flex items-center gap-2 text-sm"><User className="w-4 h-4 text-slate-400" /><span className="text-slate-700 capitalize">{profile?.gender || 'Not set'}</span></div>
              </div>
            </CardContent>
          </Card>

          {/* Profile Details & Actions */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-slate-200/60">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div><CardTitle className="text-base flex items-center gap-2"><User className="w-5 h-5 text-emerald-600" /> Personal Information</CardTitle><CardDescription className="text-xs">Your personal details</CardDescription></div>
                  <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setEditOpen(true)}><Pencil className="w-3 h-3 mr-1" />Edit</Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InfoField label="Full Name" value={profile?.name || '—'} />
                  <InfoField label="Email Address" value={profile?.email || '—'} />
                  <InfoField label="Phone Number" value={profile?.phone || '—'} />
                  <InfoField label="Gender" value={profile?.gender || '—'} />
                  <InfoField label="Access Level" value={profile?.level || '—'} />
                  <InfoField label="Status" value={profile?.active_status === 1 ? 'Active' : 'Inactive'} />
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200/60">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div><CardTitle className="text-base flex items-center gap-2"><Lock className="w-5 h-5 text-amber-600" /> Security</CardTitle><CardDescription className="text-xs">Password and security settings</CardDescription></div>
                  <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setPasswordOpen(true)}><Key className="w-3 h-3 mr-1" />Change Password</Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center"><Shield className="w-5 h-5 text-amber-600" /></div>
                  <div><p className="text-sm font-medium text-slate-700">Password Security</p><p className="text-xs text-slate-500">Last changed: Unknown. Click &quot;Change Password&quot; to update.</p></div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Edit Profile Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Edit Profile</DialogTitle><DialogDescription>Update your personal information</DialogDescription></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2"><Label className="text-xs">Full Name *</Label><Input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} placeholder="Your full name" className="h-9 text-sm" /></div>
            <div className="grid gap-2"><Label className="text-xs">Email *</Label><Input type="email" value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} placeholder="email@example.com" className="h-9 text-sm" /></div>
            <div className="grid gap-2"><Label className="text-xs">Phone</Label><Input value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} placeholder="+233XXXXXXXXX" className="h-9 text-sm" /></div>
            <div className="grid gap-2"><Label className="text-xs">Gender</Label>
              <select value={editForm.gender} onChange={e => setEditForm({ ...editForm, gender: e.target.value })} className="h-9 text-sm rounded-md border border-input bg-background px-3">
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button><Button onClick={handleSaveProfile} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">{saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}Save Changes</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog open={passwordOpen} onOpenChange={setPasswordOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Change Password</DialogTitle><DialogDescription>Enter your current and new password</DialogDescription></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2"><Label className="text-xs">Current Password *</Label><Input type="password" value={passwordForm.current_password} onChange={e => setPasswordForm({ ...passwordForm, current_password: e.target.value })} placeholder="Enter current password" className="h-9 text-sm" /></div>
            <div className="grid gap-2"><Label className="text-xs">New Password *</Label><Input type="password" value={passwordForm.new_password} onChange={e => setPasswordForm({ ...passwordForm, new_password: e.target.value })} placeholder="Enter new password" className="h-9 text-sm" /></div>
            <div className="grid gap-2"><Label className="text-xs">Confirm Password *</Label><Input type="password" value={passwordForm.confirm_password} onChange={e => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })} placeholder="Confirm new password" className="h-9 text-sm" /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setPasswordOpen(false)}>Cancel</Button><Button onClick={handleChangePassword} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">{saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Lock className="w-4 h-4 mr-2" />}Change Password</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

function InfoField({ label, value }: { label: string; value: string }) {
  return <div><p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">{label}</p><p className="text-sm font-medium text-slate-900">{value}</p></div>;
}
