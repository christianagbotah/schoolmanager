'use client';

import { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Percent,
  Plus,
  Edit,
  Trash2,
  Search,
  Users,
  Tag,
  CheckCircle,
  XCircle,
  DollarSign,
  Filter,
  RotateCcw,
  UserPlus,
  ToggleLeft,
  FileText,
  CalendarCheck,
  Gift,
  LayoutGrid,
  List,
  ChevronRight,
  ArrowUpDown,
  GraduationCap,
} from 'lucide-react';
import Link from 'next/link';

interface DiscountProfile {
  profile_id: number;
  profile_name: string;
  discount_category: string;
  discount_type: string;
  flat_amount: number;
  flat_percentage: number;
  is_active: number;
  description: string;
  assignments?: any[];
}

interface Assignment {
  assignment_id: number;
  student_id: number;
  profile_id: number;
  discount_category: string;
  year: string;
  term: string;
  is_active: number;
  student: { student_id: number; name: string; student_code: string };
  profile: { profile_id: number; profile_name: string; discount_category: string; flat_amount: number; flat_percentage: number };
  class_name?: string;
}

function fmt(n: number) {
  return `GH₵ ${(n || 0).toFixed(2)}`;
}

export default function DiscountsPage() {
  const [activeTab, setActiveTab] = useState('profiles');
  const [profileViewMode, setProfileViewMode] = useState<'table' | 'grid'>('table');
  const [assignmentViewMode, setAssignmentViewMode] = useState<'table' | 'grid'>('table');

  // Profiles state
  const [profiles, setProfiles] = useState<DiscountProfile[]>([]);
  const [profileStats, setProfileStats] = useState({ total: 0, active: 0, inactive: 0, invoice: 0, daily_fees: 0, assignments: 0 });
  const [profilesLoading, setProfilesLoading] = useState(true);
  const [profileSearch, setProfileSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Profile dialog
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<DiscountProfile | null>(null);
  const [profileForm, setProfileForm] = useState({
    profile_name: '',
    discount_category: 'daily_fees',
    discount_type: '',
    discount_method: 'percentage',
    discount_value: '',
    description: '',
  });
  const [savingProfile, setSavingProfile] = useState(false);

  // Delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingProfile, setDeletingProfile] = useState<DiscountProfile | null>(null);

  // Assignments state
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [assignmentsLoading, setAssignmentsLoading] = useState(true);
  const [assignmentSearch, setAssignmentSearch] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [filterTerm, setFilterTerm] = useState('');
  const [filterProfile, setFilterProfile] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [profilesList, setProfilesList] = useState<any[]>([]);
  const [assignmentStats, setAssignmentStats] = useState({ total: 0, active: 0, inactive: 0, uniqueStudents: 0 });

  // Assign dialog
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [assignStudents, setAssignStudents] = useState<any[]>([]);
  const [assignSearch, setAssignSearch] = useState('');
  const [assignProfileId, setAssignProfileId] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([]);

  // Unassign dialog
  const [unassignDialogOpen, setUnassignDialogOpen] = useState(false);
  const [unassigningId, setUnassigningId] = useState<number | null>(null);

  // Edit assignment dialog
  const [editAssignDialogOpen, setEditAssignDialogOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [editAssignProfileId, setEditAssignProfileId] = useState('');
  const [savingAssignEdit, setSavingAssignEdit] = useState(false);

  // Bulk selected
  const [selectedAssignments, setSelectedAssignments] = useState<number[]>([]);

  const fetchProfiles = useCallback(async () => {
    setProfilesLoading(true);
    try {
      const params = new URLSearchParams();
      if (categoryFilter) params.set('category', categoryFilter);
      if (statusFilter) params.set('status', statusFilter);
      if (profileSearch) params.set('search', profileSearch);
      const res = await fetch(`/api/admin/discounts/profiles?${params}`);
      const data = await res.json();
      setProfiles(data.profiles || []);
      setProfileStats(data.stats || { total: 0, active: 0, inactive: 0, invoice: 0, daily_fees: 0, assignments: 0 });
      setProfilesList((data.profiles || []).map((p: DiscountProfile) => ({ profile_id: p.profile_id, profile_name: p.profile_name })));
    } catch { toast.error('Failed to load profiles'); } finally { setProfilesLoading(false); }
  }, [categoryFilter, statusFilter, profileSearch]);

  useEffect(() => { fetchProfiles(); }, [fetchProfiles]);

  const fetchAssignments = useCallback(async () => {
    setAssignmentsLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterYear) params.set('year', filterYear);
      if (filterTerm) params.set('term', filterTerm);
      if (filterProfile) params.set('profile_id', filterProfile);
      const res = await fetch(`/api/admin/discounts/assignments?${params}`);
      const data = await res.json();
      const all = data.assignments || [];
      setAssignments(all);
      if (data.runningYear && !filterYear) setFilterYear(data.runningYear);
      if (data.runningTerm && !filterTerm) setFilterTerm(data.runningTerm);
      if (data.profiles) setProfilesList(data.profiles);
      // Compute stats
      setAssignmentStats({
        total: all.length,
        active: all.filter(a => a.is_active == 1).length,
        inactive: all.filter(a => a.is_active == 0).length,
        uniqueStudents: [...new Set(all.map(a => a.student_id))].length,
      });
    } catch {} finally { setAssignmentsLoading(false); }
  }, [filterYear, filterTerm, filterProfile]);

  useEffect(() => { if (activeTab === 'assignments') fetchAssignments(); }, [activeTab, fetchAssignments]);

  const openCreateProfile = () => {
    setEditingProfile(null);
    setProfileForm({ profile_name: '', discount_category: 'daily_fees', discount_type: '', discount_method: 'percentage', discount_value: '', description: '' });
    setProfileDialogOpen(true);
  };

  const openEditProfile = (p: DiscountProfile) => {
    setEditingProfile(p);
    setProfileForm({
      profile_name: p.profile_name,
      discount_category: p.discount_category,
      discount_type: p.discount_type || '',
      discount_method: p.flat_percentage > 0 ? 'percentage' : 'fixed',
      discount_value: String(p.flat_percentage > 0 ? p.flat_percentage : p.flat_amount),
      description: p.description || '',
    });
    setProfileDialogOpen(true);
  };

  const handleSaveProfile = async () => {
    if (!profileForm.profile_name) { toast.error('Profile name required'); return; }
    setSavingProfile(true);
    try {
      const body: any = {
        ...profileForm,
        discount_value: parseFloat(profileForm.discount_value) || 0,
      };
      if (editingProfile) {
        body.profile_id = editingProfile.profile_id;
        const res = await fetch('/api/admin/discounts/profiles', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        toast.success(data.message);
      } else {
        const res = await fetch('/api/admin/discounts/profiles', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        toast.success(data.message);
      }
      setProfileDialogOpen(false);
      fetchProfiles();
    } catch (err: any) { toast.error(err.message); } finally { setSavingProfile(false); }
  };

  const handleToggleProfile = async (p: DiscountProfile) => {
    try {
      const res = await fetch(`/api/admin/discounts/profiles?id=${p.profile_id}&action=toggle`, { method: 'DELETE' });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast.success(data.message);
      fetchProfiles();
    } catch (err: any) { toast.error(err.message); }
  };

  const handleDeleteProfile = async () => {
    if (!deletingProfile) return;
    try {
      const res = await fetch(`/api/admin/discounts/profiles?id=${deletingProfile.profile_id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast.success(data.message);
      setDeleteDialogOpen(false);
      setDeletingProfile(null);
      fetchProfiles();
    } catch (err: any) { toast.error(err.message); }
  };

  const handleOpenAssign = async () => {
    setSelectedStudentIds([]);
    setAssignProfileId('');
    setAssignSearch('');
    setAssignStudents([]);
    setAssignDialogOpen(true);
    try {
      const res = await fetch('/api/students?limit=500');
      const data = await res.json();
      setAssignStudents((data.students || []).map((s: any) => ({ ...s, selected: false })));
    } catch {}
  };

  const handleBulkAssign = async () => {
    if (selectedStudentIds.length === 0 || !assignProfileId) {
      toast.error('Select students and a profile');
      return;
    }
    setAssigning(true);
    try {
      const profile = profilesList.find((p) => p.profile_id === parseInt(assignProfileId));
      const res = await fetch('/api/admin/discounts/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'bulk',
          student_ids: selectedStudentIds,
          profile_id: parseInt(assignProfileId),
          discount_category: profile?.discount_category || 'daily_fees',
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast.success(data.message);
      setAssignDialogOpen(false);
      fetchAssignments();
      fetchProfiles();
    } catch (err: any) { toast.error(err.message); } finally { setAssigning(false); }
  };

  const handleToggleAssignment = async (id: number) => {
    try {
      const res = await fetch(`/api/admin/discounts/assignments?id=${id}&action=toggle`, { method: 'DELETE' });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast.success(data.message);
      fetchAssignments();
    } catch (err: any) { toast.error(err.message); }
  };

  const handleBulkToggleAssignments = async () => {
    if (selectedAssignments.length === 0) { toast.error('Select assignments first'); return; }
    try {
      const res = await fetch('/api/admin/discounts/assignments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'bulk_toggle', ids: selectedAssignments }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast.success(data.message);
      setSelectedAssignments([]);
      fetchAssignments();
    } catch (err: any) { toast.error(err.message); }
  };

  const handleUnassign = async (id: number) => {
    setUnassigningId(id);
    setUnassignDialogOpen(true);
  };

  const confirmUnassign = async () => {
    if (!unassigningId) return;
    try {
      const res = await fetch(`/api/admin/discounts/assignments?id=${unassigningId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast.success(data.message);
      setUnassignDialogOpen(false);
      setUnassigningId(null);
      fetchAssignments();
      fetchProfiles();
    } catch (err: any) { toast.error(err.message); }
  };

  const openEditAssignment = (a: Assignment) => {
    setEditingAssignment(a);
    setEditAssignProfileId(String(a.profile_id));
    setEditAssignDialogOpen(true);
  };

  const handleSaveEditAssignment = async () => {
    if (!editingAssignment || !editAssignProfileId) return;
    setSavingAssignEdit(true);
    try {
      const res = await fetch(`/api/admin/discounts/assignments`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignment_id: editingAssignment.assignment_id, profile_id: parseInt(editAssignProfileId) }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast.success(data.message);
      setEditAssignDialogOpen(false);
      fetchAssignments();
    } catch (err: any) { toast.error(err.message); } finally { setSavingAssignEdit(false); }
  };

  const filteredStudents = assignSearch.length >= 2
    ? assignStudents.filter((s) => s.name.toLowerCase().includes(assignSearch.toLowerCase()) || s.student_code.toLowerCase().includes(assignSearch.toLowerCase()))
    : assignStudents;

  const toggleStudentSelect = (id: number) => {
    setSelectedStudentIds((prev) => prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]);
  };

  const toggleAssignmentSelect = (id: number) => {
    setSelectedAssignments(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  // Filter assignments by search and status
  const filteredAssignments = assignments.filter(a => {
    const matchSearch = !assignmentSearch ||
      a.student?.name.toLowerCase().includes(assignmentSearch.toLowerCase()) ||
      a.student?.student_code.toLowerCase().includes(assignmentSearch.toLowerCase()) ||
      a.profile?.profile_name.toLowerCase().includes(assignmentSearch.toLowerCase());
    const matchStatus = !filterStatus || String(a.is_active) === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-md">
              <Percent className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Discount Management</h1>
              <p className="text-sm text-slate-500 mt-1">Discount profiles, student assignments, and application</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { label: 'Total Profiles', value: profileStats.total, icon: Tag, color: 'text-violet-600', bg: 'bg-violet-50' },
            { label: 'Active', value: profileStats.active, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { label: 'Invoice Discounts', value: profileStats.invoice, icon: FileText, color: 'text-sky-600', bg: 'bg-sky-50' },
            { label: 'Daily Fees Discounts', value: profileStats.daily_fees, icon: CalendarCheck, color: 'text-amber-600', bg: 'bg-amber-50' },
            { label: 'Total Assignments', value: profileStats.assignments, icon: Users, color: 'text-rose-600', bg: 'bg-rose-50' },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center`}>
                    <s.icon className={`w-4 h-4 ${s.color}`} />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">{s.label}</p>
                    <p className="text-lg font-bold text-slate-900">{s.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="profiles">
              <Tag className="w-3.5 h-3.5 mr-1.5" />
              Discount Profiles
            </TabsTrigger>
            <TabsTrigger value="assignments">
              <Users className="w-3.5 h-3.5 mr-1.5" />
              Student Assignments
            </TabsTrigger>
          </TabsList>

          {/* ===================== PROFILES TAB ===================== */}
          <TabsContent value="profiles" className="mt-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex bg-slate-100 rounded-lg p-0.5">
                  <button onClick={() => setProfileViewMode('table')} className={`p-1.5 rounded-md ${profileViewMode === 'table' ? 'bg-white shadow-sm' : ''}`}>
                    <List className="w-4 h-4" />
                  </button>
                  <button onClick={() => setProfileViewMode('grid')} className={`p-1.5 rounded-md ${profileViewMode === 'grid' ? 'bg-white shadow-sm' : ''}`}>
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                </div>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-40 h-9 text-xs"><Filter className="w-3 h-3 mr-1" /><SelectValue placeholder="All Categories" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Categories</SelectItem>
                    <SelectItem value="invoice">Invoice</SelectItem>
                    <SelectItem value="daily_fees">Daily Fees</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-36 h-9 text-xs"><SelectValue placeholder="All Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Status</SelectItem>
                    <SelectItem value="1">Active</SelectItem>
                    <SelectItem value="0">Inactive</SelectItem>
                  </SelectContent>
                </Select>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <Input placeholder="Search profiles..." value={profileSearch} onChange={(e) => setProfileSearch(e.target.value)} className="pl-8 h-9 w-48 text-xs" />
                </div>
              </div>
              <Button onClick={openCreateProfile} className="bg-violet-600 hover:bg-violet-700 h-9 text-sm shadow-sm">
                <Plus className="w-4 h-4 mr-1.5" /> Create Profile
              </Button>
            </div>

            {profilesLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />)}
              </div>
            ) : profiles.length === 0 ? (
              <Card>
                <CardContent className="py-16 text-center text-slate-400">
                  <Gift className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm font-medium">No discount profiles found</p>
                  <p className="text-xs mt-1">Create your first discount profile to get started</p>
                  <Button onClick={openCreateProfile} className="mt-4 bg-violet-600 hover:bg-violet-700" size="sm">
                    <Plus className="w-3.5 h-3.5 mr-1" /> Create Profile
                  </Button>
                </CardContent>
              </Card>
            ) : profileViewMode === 'table' ? (
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-slate-50">
                          <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500">Profile</th>
                          <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500">Category</th>
                          <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500">Type</th>
                          <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500">Value</th>
                          <th className="text-center py-3 px-4 text-xs font-semibold text-slate-500">Status</th>
                          <th className="text-center py-3 px-4 text-xs font-semibold text-slate-500">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {profiles.map((p) => (
                          <tr key={p.profile_id} className="border-b last:border-0 hover:bg-slate-50/50 transition-colors">
                            <td className="py-3 px-4">
                              <p className="font-medium">{p.profile_name}</p>
                              <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{p.description || 'No description'}</p>
                            </td>
                            <td className="py-3 px-4">
                              <Badge variant="outline" className={p.discount_category === 'invoice' ? 'bg-sky-50 text-sky-700 border-sky-200' : 'bg-amber-50 text-amber-700 border-amber-200'}>
                                {p.discount_category === 'invoice' ? '📄 Invoice' : '📅 Daily Fees'}
                              </Badge>
                            </td>
                            <td className="py-3 px-4">
                              {p.discount_type ? (
                                <div className="flex flex-wrap gap-1">
                                  {p.discount_type.split(',').map((t) => (
                                    <Badge key={t} variant="secondary" className="text-[10px] h-5">{t.trim()}</Badge>
                                  ))}
                                </div>
                              ) : 'N/A'}
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-1.5">
                                <DollarSign className="w-3 h-3 text-slate-400" />
                                <span className="font-mono font-medium">
                                  {p.flat_percentage > 0 ? `${p.flat_percentage}%` : fmt(p.flat_amount)}
                                </span>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <button
                                onClick={() => handleToggleProfile(p)}
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold transition-all ${
                                  p.is_active
                                    ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                }`}
                              >
                                {p.is_active ? <><CheckCircle className="w-3 h-3" /> Active</> : <><XCircle className="w-3 h-3" /> Inactive</>}
                              </button>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center justify-center gap-1">
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditProfile(p)}>
                                  <Edit className="w-3.5 h-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={() => { setDeletingProfile(p); setDeleteDialogOpen(true); }}>
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {profiles.map((p) => (
                  <Card key={p.profile_id} className={`hover:shadow-md transition-all hover:-translate-y-0.5 ${p.is_active ? '' : 'opacity-60'}`}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate">{p.profile_name}</p>
                          <Badge variant="outline" className={`mt-1 text-[10px] h-5 ${p.discount_category === 'invoice' ? 'bg-sky-50 text-sky-700 border-sky-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                            {p.discount_category === 'invoice' ? '📄 Invoice' : '📅 Daily Fees'}
                          </Badge>
                        </div>
                        <button onClick={() => handleToggleProfile(p)} className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${p.is_active ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                          {p.is_active ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                        </button>
                      </div>
                      <div className="space-y-1.5 mb-3">
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-slate-400">Value:</span>
                          <span className="font-mono font-medium">
                            {p.flat_percentage > 0 ? `${p.flat_percentage}%` : fmt(p.flat_amount)}
                          </span>
                        </div>
                        {p.discount_type && (
                          <div className="flex flex-wrap gap-1">
                            {p.discount_type.split(',').map((t) => (
                              <Badge key={t} variant="secondary" className="text-[10px] h-5">{t.trim()}</Badge>
                            ))}
                          </div>
                        )}
                        {p.description && <p className="text-[10px] text-slate-400">{p.description}</p>}
                      </div>
                      <Separator />
                      <div className="flex gap-1 mt-3">
                        <Button variant="outline" size="sm" className="flex-1 h-8 text-xs" onClick={() => openEditProfile(p)}>
                          <Edit className="w-3 h-3 mr-1" /> Edit
                        </Button>
                        <Button variant="outline" size="sm" className="h-8 w-8 text-red-500 p-0" onClick={() => { setDeletingProfile(p); setDeleteDialogOpen(true); }}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ===================== ASSIGNMENTS TAB ===================== */}
          <TabsContent value="assignments" className="mt-4">
            {/* Assignment Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              {[
                { label: 'Total Assignments', value: assignmentStats.total, icon: Users, color: 'text-violet-600', bg: 'bg-violet-50', borderColor: 'border-violet-200' },
                { label: 'Active Discounts', value: assignmentStats.active, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50', borderColor: 'border-emerald-200' },
                { label: 'Inactive Discounts', value: assignmentStats.inactive, icon: XCircle, color: 'text-red-500', bg: 'bg-red-50', borderColor: 'border-red-200' },
                { label: 'Unique Students', value: assignmentStats.uniqueStudents, icon: GraduationCap, color: 'text-sky-600', bg: 'bg-sky-50', borderColor: 'border-sky-200' },
              ].map((s) => (
                <Card key={s.label} className={`border ${s.borderColor}`}>
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center`}>
                        <s.icon className={`w-4 h-4 ${s.color}`} />
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">{s.label}</p>
                        <p className="text-lg font-bold text-slate-900">{s.value}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Toolbar */}
            <Card className="mb-4">
              <CardContent className="p-3">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex items-center gap-2 flex-wrap flex-1">
                    <div className="relative flex-1 min-w-[200px]">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                      <Input placeholder="Search by student, code, or profile..." value={assignmentSearch} onChange={(e) => setAssignmentSearch(e.target.value)} className="pl-8 h-9 w-full text-xs" />
                    </div>
                    <Select value={filterYear} onValueChange={setFilterYear}>
                      <SelectTrigger className="w-32 h-9 text-xs"><SelectValue placeholder="Year" /></SelectTrigger>
                      <SelectContent><SelectItem value="">All Years</SelectItem></SelectContent>
                    </Select>
                    <Select value={filterTerm} onValueChange={setFilterTerm}>
                      <SelectTrigger className="w-28 h-9 text-xs"><SelectValue placeholder="Term" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All Terms</SelectItem>
                        <SelectItem value="1">Term 1</SelectItem>
                        <SelectItem value="2">Term 2</SelectItem>
                        <SelectItem value="3">Term 3</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={filterProfile} onValueChange={setFilterProfile}>
                      <SelectTrigger className="w-40 h-9 text-xs"><SelectValue placeholder="All Profiles" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All Profiles</SelectItem>
                        {profilesList.map((p) => <SelectItem key={p.profile_id} value={String(p.profile_id)}>{p.profile_name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger className="w-32 h-9 text-xs"><SelectValue placeholder="All Status" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All Status</SelectItem>
                        <SelectItem value="1">Active</SelectItem>
                        <SelectItem value="0">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button variant="outline" size="sm" className="h-9 text-xs" onClick={handleBulkToggleAssignments} disabled={selectedAssignments.length === 0}>
                      <ArrowUpDown className="w-3.5 h-3.5 mr-1" /> Bulk Toggle ({selectedAssignments.length})
                    </Button>
                    <Button onClick={handleOpenAssign} className="bg-violet-600 hover:bg-violet-700 h-9 text-sm shadow-sm">
                      <UserPlus className="w-4 h-4 mr-1.5" /> Assign Students
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* View Toggle */}
            <div className="flex bg-slate-100 rounded-lg p-0.5 w-fit mb-4">
              <button onClick={() => setAssignmentViewMode('table')} className={`p-1.5 rounded-md ${assignmentViewMode === 'table' ? 'bg-white shadow-sm' : ''}`}>
                <List className="w-4 h-4" />
              </button>
              <button onClick={() => setAssignmentViewMode('grid')} className={`p-1.5 rounded-md ${assignmentViewMode === 'grid' ? 'bg-white shadow-sm' : ''}`}>
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>

            {/* Assignments Content */}
            {assignmentsLoading ? (
              <div className="p-4 space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
            ) : filteredAssignments.length === 0 ? (
              <Card>
                <CardContent className="py-16 text-center text-slate-400">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No assignments found</p>
                </CardContent>
              </Card>
            ) : assignmentViewMode === 'table' ? (
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-slate-50">
                          <th className="w-10 py-3 px-3 text-xs">
                            <input
                              type="checkbox"
                              checked={selectedAssignments.length > 0 && selectedAssignments.length === filteredAssignments.length}
                              onChange={(e) => setSelectedAssignments(e.target.checked ? filteredAssignments.map(a => a.assignment_id) : [])}
                              className="rounded"
                            />
                          </th>
                          <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500">Student</th>
                          <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500">Code</th>
                          <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500">Profile</th>
                          <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500">Category</th>
                          <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500">Value</th>
                          <th className="text-center py-3 px-4 text-xs font-semibold text-slate-500">Status</th>
                          <th className="text-center py-3 px-4 text-xs font-semibold text-slate-500">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredAssignments.map((a) => (
                          <tr key={a.assignment_id} className={`border-b last:border-0 hover:bg-slate-50/50 ${selectedAssignments.includes(a.assignment_id) ? 'bg-violet-50/30' : ''}`}>
                            <td className="py-3 px-3">
                              <input
                                type="checkbox"
                                checked={selectedAssignments.includes(a.assignment_id)}
                                onChange={() => toggleAssignmentSelect(a.assignment_id)}
                                className="rounded"
                              />
                            </td>
                            <td className="py-3 px-4">
                              <p className="font-medium">{a.student?.name}</p>
                            </td>
                            <td className="py-3 px-4 text-xs text-slate-500 font-mono">{a.student?.student_code}</td>
                            <td className="py-3 px-4">
                              <Badge variant="outline" className="bg-violet-50 text-violet-700 border-violet-200">{a.profile?.profile_name}</Badge>
                            </td>
                            <td className="py-3 px-4">
                              <Badge variant="outline" className={`text-[10px] h-5 ${a.profile?.discount_category === 'invoice' ? 'bg-sky-50 text-sky-700 border-sky-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                                {a.profile?.discount_category || '—'}
                              </Badge>
                            </td>
                            <td className="py-3 px-4">
                              <span className="font-mono text-xs font-medium">
                                {a.profile?.flat_percentage > 0 ? `${a.profile.flat_percentage}%` : fmt(a.profile?.flat_amount || 0)}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <button
                                onClick={() => handleToggleAssignment(a.assignment_id)}
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold transition-all ${
                                  a.is_active == 1
                                    ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                }`}
                              >
                                {a.is_active == 1 ? <><CheckCircle className="w-3 h-3" /> Active</> : <><XCircle className="w-3 h-3" /> Inactive</>}
                              </button>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditAssignment(a)}>
                                  <Edit className="w-3.5 h-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={() => handleUnassign(a.assignment_id)}>
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredAssignments.map((a) => (
                  <Card key={a.assignment_id} className={`hover:shadow-md transition-all hover:-translate-y-0.5 ${a.is_active ? '' : 'opacity-60'} ${selectedAssignments.includes(a.assignment_id) ? 'ring-2 ring-violet-300' : ''}`}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate">{a.student?.name}</p>
                          <p className="text-[10px] text-slate-400">{a.student?.student_code}</p>
                        </div>
                        <button
                          onClick={() => handleToggleAssignment(a.assignment_id)}
                          className={`w-8 h-8 rounded-full flex items-center justify-center transition-all flex-shrink-0 ${
                            a.is_active == 1 ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'
                          }`}
                        >
                          {a.is_active == 1 ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                        </button>
                      </div>
                      <div className="space-y-1.5 mb-3">
                        <div className="flex items-center gap-2 text-xs">
                          <Tag className="w-3 h-3 text-violet-500" />
                          <Badge variant="outline" className="bg-violet-50 text-violet-700 border-violet-200 text-[10px] h-5">{a.profile?.profile_name}</Badge>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <span className="font-medium">
                            {a.profile?.flat_percentage > 0 ? `${a.profile?.flat_percentage}%` : fmt(a.profile?.flat_amount || 0)}
                          </span>
                          <Badge variant="outline" className={`text-[9px] h-4 ${a.profile?.discount_category === 'invoice' ? 'bg-sky-50 text-sky-700 border-sky-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                            {a.profile?.discount_category}
                          </Badge>
                        </div>
                        <p className="text-[10px] text-slate-400">{a.year} · Term {a.term}</p>
                      </div>
                      <Separator />
                      <div className="flex gap-1 mt-3">
                        <Button variant="outline" size="sm" className="flex-1 h-8 text-xs" onClick={() => openEditAssignment(a)}>
                          <Edit className="w-3 h-3 mr-1" /> Edit
                        </Button>
                        <Button variant="outline" size="sm" className="h-8 w-8 text-red-500 p-0" onClick={() => handleUnassign(a.assignment_id)}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Create/Edit Profile Dialog */}
        <Dialog open={profileDialogOpen} onOpenChange={setProfileDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editingProfile ? 'Edit Discount Profile' : 'Create Discount Profile'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Profile Name *</Label>
                <Input placeholder="e.g., Staff Children Discount" value={profileForm.profile_name} onChange={(e) => setProfileForm({ ...profileForm, profile_name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Category *</Label>
                  <Select value={profileForm.discount_category} onValueChange={(v) => setProfileForm({ ...profileForm, discount_category: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily_fees">📅 Daily Fees</SelectItem>
                      <SelectItem value="invoice">📄 Invoice</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Method</Label>
                  <Select value={profileForm.discount_method} onValueChange={(v) => setProfileForm({ ...profileForm, discount_method: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">📊 Percentage (%)</SelectItem>
                      <SelectItem value="fixed">💰 Fixed (GH₵)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Value *</Label>
                  <Input type="number" step="0.01" min="0" placeholder={profileForm.discount_method === 'percentage' ? 'e.g. 50' : 'e.g. 10.00'} value={profileForm.discount_value} onChange={(e) => setProfileForm({ ...profileForm, discount_value: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Fee Types</Label>
                  <Input placeholder="feeding,classes,transport" value={profileForm.discount_type} onChange={(e) => setProfileForm({ ...profileForm, discount_type: e.target.value })} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Description</Label>
                <textarea className="w-full min-h-[60px] rounded-md border border-slate-200 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500" placeholder="Brief description of this discount profile" value={profileForm.description} onChange={(e) => setProfileForm({ ...profileForm, description: e.target.value })} />
              </div>
              {profileForm.discount_value && (
                <div className="bg-violet-50 rounded-lg p-3 text-center border border-violet-200">
                  <p className="text-[10px] text-violet-500 uppercase font-medium">Preview</p>
                  <p className="text-2xl font-bold text-violet-700">
                    {profileForm.discount_method === 'percentage' ? `${profileForm.discount_value}%` : `GH₵ ${parseFloat(profileForm.discount_value || 0).toFixed(2)}`}
                  </p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setProfileDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSaveProfile} disabled={savingProfile || !profileForm.profile_name} className="bg-violet-600 hover:bg-violet-700">
                {savingProfile ? 'Saving...' : editingProfile ? 'Update Profile' : 'Create Profile'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Discount Profile</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete &quot;{deletingProfile?.profile_name}&quot;? This will also remove all student assignments for this profile. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteProfile} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Bulk Assign Dialog */}
        <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
          <DialogContent className="sm:max-w-2xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-violet-600" />
                Assign Discount to Students
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Discount Profile *</Label>
                  <Select value={assignProfileId} onValueChange={setAssignProfileId}>
                    <SelectTrigger><SelectValue placeholder="Select profile" /></SelectTrigger>
                    <SelectContent>
                      {profilesList.map((p) => <SelectItem key={p.profile_id} value={String(p.profile_id)}>{p.profile_name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Search Students</Label>
                  <Input placeholder="Name or code..." value={assignSearch} onChange={(e) => setAssignSearch(e.target.value)} />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-500">{selectedStudentIds.length} student(s) selected</p>
                <Button variant="outline" size="sm" onClick={() => setSelectedStudentIds(filteredStudents.map((s) => s.student_id))}>
                  Select All ({filteredStudents.length})
                </Button>
              </div>
              <div className="max-h-60 overflow-y-auto border rounded-lg">
                {filteredStudents.length === 0 ? (
                  <p className="text-center py-8 text-sm text-slate-400">No students found</p>
                ) : (
                  filteredStudents.slice(0, 50).map((s) => (
                    <div
                      key={s.student_id}
                      onClick={() => toggleStudentSelect(s.student_id)}
                      className={`flex items-center gap-3 px-3 py-2 border-b last:border-0 cursor-pointer hover:bg-slate-50 transition-colors ${
                        selectedStudentIds.includes(s.student_id) ? 'bg-violet-50' : ''
                      }`}
                    >
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                        selectedStudentIds.includes(s.student_id) ? 'bg-violet-600 border-violet-600' : 'border-slate-300'
                      }`}>
                        {selectedStudentIds.includes(s.student_id) && <CheckCircle className="w-3 h-3 text-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{s.name}</p>
                        <p className="text-[10px] text-slate-400">{s.student_code}</p>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                    </div>
                  ))
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleBulkAssign} disabled={assigning || selectedStudentIds.length === 0 || !assignProfileId} className="bg-violet-600 hover:bg-violet-700">
                {assigning ? 'Assigning...' : `Assign to ${selectedStudentIds.length} Student(s)`}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Assignment Dialog */}
        <Dialog open={editAssignDialogOpen} onOpenChange={setEditAssignDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Edit className="w-5 h-5 text-violet-600" />
                Edit Assignment
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              {editingAssignment && (
                <>
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-xs text-slate-500 mb-1">Student</p>
                    <p className="font-semibold text-sm">{editingAssignment.student?.name}</p>
                    <p className="text-[10px] text-slate-400">{editingAssignment.student?.student_code} · {editingAssignment.year} Term {editingAssignment.term}</p>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Discount Profile *</Label>
                    <Select value={editAssignProfileId} onValueChange={setEditAssignProfileId}>
                      <SelectTrigger><SelectValue placeholder="Select profile" /></SelectTrigger>
                      <SelectContent>
                        {profilesList.map((p) => <SelectItem key={p.profile_id} value={String(p.profile_id)}>{p.profile_name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditAssignDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSaveEditAssignment} disabled={savingAssignEdit || !editAssignProfileId} className="bg-violet-600 hover:bg-violet-700">
                {savingAssignEdit ? 'Updating...' : 'Update Assignment'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Unassign Dialog */}
        <AlertDialog open={unassignDialogOpen} onOpenChange={setUnassignDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove Discount Assignment</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to remove this discount assignment? The student will no longer receive this discount.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmUnassign} className="bg-red-600 hover:bg-red-700">Remove</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}
