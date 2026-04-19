'use client';

import { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toast } from 'sonner';
import {
  Megaphone, Plus, Search, Pencil, Trash2, Eye, Calendar, Archive, RotateCcw,
  Globe, Lock, MessageSquare, Mail, Bell, Filter, Users, X,
  Clock, ChevronDown, CheckCircle2, AlertCircle, Send,
} from 'lucide-react';
import { format } from 'date-fns';

interface Notice {
  id: number; title: string; notice: string; timestamp: string | null;
  create_timestamp: number; show_on_website: number; status: number;
  image: string; attachment: string; check_sms: number; sms_target: number;
  check_email: number; notice_timestamp: string | null;
  start_date: string | null; end_date: string | null; visibility_roles: string;
}

interface NoticeStats { total: number; running: number; archived: number; withSms: number; }

const SMS_TARGET_MAP: Record<number, string> = {
  0: 'Off', 1: 'All', 2: 'Parents', 3: 'Teachers', 4: 'Students',
};

function NoticePageSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-44" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-11 w-32 rounded-lg" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="border-slate-200/60">
            <CardContent className="p-4 flex items-center gap-3">
              <Skeleton className="w-10 h-10 rounded-lg flex-shrink-0" />
              <div className="space-y-1.5 flex-1">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-6 w-14" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-10 w-28 rounded-lg" />
        <Skeleton className="h-10 w-28 rounded-lg" />
        <Skeleton className="h-10 w-28 rounded-lg" />
      </div>
      <div className="flex gap-3">
        <Skeleton className="h-11 flex-1 rounded-lg" />
        <Skeleton className="h-11 w-28 rounded-lg" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="border-slate-200/60">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Skeleton className="w-8 h-8 rounded-lg" />
                <Skeleton className="h-4 w-20 rounded-full" />
                <Skeleton className="h-4 w-16 ml-auto" />
              </div>
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-2/3" />
              <div className="flex gap-1.5">
                <Skeleton className="h-5 w-12 rounded-full" />
                <Skeleton className="h-5 w-14 rounded-full" />
              </div>
              <div className="flex gap-1 pt-2 border-t border-slate-100">
                <Skeleton className="h-8 w-14 rounded-md" />
                <Skeleton className="h-8 w-14 rounded-md" />
                <Skeleton className="h-8 w-14 rounded-md" />
                <Skeleton className="h-8 w-8 rounded-md ml-auto" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function NoticesPage() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [stats, setStats] = useState<NoticeStats>({ total: 0, running: 0, archived: 0, withSms: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusTab, setStatusTab] = useState('running');
  const [dateFilterOpen, setDateFilterOpen] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Form dialog
  const [formOpen, setFormOpen] = useState(false);
  const [editNotice, setEditNotice] = useState<Notice | null>(null);
  const [form, setForm] = useState({
    title: '', notice: '', create_timestamp: '', image: '', attachment: '',
    show_on_website: true, check_sms: 2, sms_target: 1, check_email: 2,
    visibility_roles: 'all', start_date: '', end_date: '',
  });
  const [saving, setSaving] = useState(false);

  // View dialog
  const [viewOpen, setViewOpen] = useState(false);
  const [viewNotice, setViewNotice] = useState<Notice | null>(null);

  // Delete dialog
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteNotice, setDeleteNotice] = useState<Notice | null>(null);

  const fetchNotices = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ status: statusTab });
      if (search) params.set('search', search);
      if (dateFrom) params.set('date_from', dateFrom);
      if (dateTo) params.set('date_to', dateTo);
      const res = await fetch(`/api/admin/notices?${params}`);
      const data = await res.json();
      setNotices(data.notices || []);
      setStats(data.stats || { total: 0, running: 0, archived: 0, withSms: 0 });
    } catch {
      toast.error('Failed to load notices');
    }
    setLoading(false);
  }, [search, statusTab, dateFrom, dateTo]);

  useEffect(() => { fetchNotices(); }, [fetchNotices]);

  const openCreate = () => {
    setEditNotice(null);
    setForm({
      title: '', notice: '',
      create_timestamp: format(new Date(), 'yyyy-MM-dd'),
      image: '', attachment: '',
      show_on_website: true, check_sms: 2, sms_target: 1, check_email: 2,
      visibility_roles: 'all',
      start_date: format(new Date(), 'yyyy-MM-dd'),
      end_date: '',
    });
    setFormOpen(true);
  };

  const openEdit = (n: Notice) => {
    setEditNotice(n);
    setForm({
      title: n.title,
      notice: n.notice,
      create_timestamp: n.create_timestamp ? format(new Date(n.create_timestamp * 1000), 'yyyy-MM-dd') : '',
      image: n.image || '',
      attachment: n.attachment || '',
      show_on_website: n.show_on_website === 1,
      check_sms: n.check_sms,
      sms_target: n.sms_target || 1,
      check_email: n.check_email,
      visibility_roles: n.visibility_roles || 'all',
      start_date: n.start_date ? format(new Date(n.start_date), 'yyyy-MM-dd') : '',
      end_date: n.end_date ? format(new Date(n.end_date), 'yyyy-MM-dd') : '',
    });
    setFormOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast.error('Title is required');
      return;
    }
    setSaving(true);
    try {
      if (editNotice) {
        const res = await fetch('/api/admin/notices', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editNotice.id, ...form }),
        });
        if (!res.ok) throw new Error('Failed');
        toast.success('Notice updated successfully');
      } else {
        const res = await fetch('/api/admin/notices', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
        if (!res.ok) throw new Error('Failed');
        toast.success('Notice created successfully');
      }
      setFormOpen(false);
      fetchNotices();
    } catch {
      toast.error('Failed to save notice');
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deleteNotice) return;
    try {
      const res = await fetch(`/api/admin/notices?id=${deleteNotice.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed');
      toast.success('Notice deleted');
      setDeleteOpen(false);
      fetchNotices();
    } catch {
      toast.error('Failed to delete notice');
    }
  };

  const handleArchive = async (n: Notice) => {
    try {
      await fetch(`/api/admin/notices?id=${n.id}&action=archive`, { method: 'DELETE' });
      toast.success('Notice archived');
      fetchNotices();
    } catch {
      toast.error('Failed to archive notice');
    }
  };

  const handleRestore = async (n: Notice) => {
    try {
      await fetch(`/api/admin/notices?id=${n.id}&action=restore`, { method: 'DELETE' });
      toast.success('Notice restored to running');
      fetchNotices();
    } catch {
      toast.error('Failed to restore notice');
    }
  };

  const formatDate = (ts: number | null) => {
    if (!ts) return '--';
    return format(new Date(ts * 1000), 'dd MMM, yyyy');
  };

  const isCurrentlyVisible = (n: Notice) => {
    if (n.status !== 1) return false;
    const now = new Date();
    if (n.start_date && new Date(n.start_date) > now) return false;
    if (n.end_date && new Date(n.end_date) < now) return false;
    return true;
  };

  const getStatusBadge = (n: Notice) => {
    if (n.status !== 1) {
      return <Badge className="bg-slate-100 text-slate-500 text-xs gap-1"><Archive className="w-3 h-3" /> Archived</Badge>;
    }
    if (isCurrentlyVisible(n)) {
      return <Badge className="bg-emerald-100 text-emerald-700 text-xs gap-1"><CheckCircle2 className="w-3 h-3" /> Published</Badge>;
    }
    return <Badge className="bg-amber-100 text-amber-700 text-xs gap-1"><AlertCircle className="w-3 h-3" /> Scheduled</Badge>;
  };

  return (
    <DashboardLayout>
      {loading ? (
        <NoticePageSkeleton />
      ) : (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Noticeboard</h1>
            <p className="text-sm text-slate-500 mt-1">Create and manage school announcements</p>
          </div>
          <Button onClick={openCreate} className="bg-emerald-600 hover:bg-emerald-700 min-h-[44px] shadow-sm">
            <Plus className="w-4 h-4 mr-2" /> Add Notice
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="border-slate-200/60 hover:shadow-sm transition-shadow">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                <Megaphone className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-slate-500 truncate">Total Notices</p>
                <p className="text-xl font-bold text-slate-900">{stats.total}</p>
                <p className="text-[10px] text-slate-400">All time</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-slate-200/60 hover:shadow-sm transition-shadow">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-sky-100 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-5 h-5 text-sky-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-slate-500 truncate">Published</p>
                <p className="text-xl font-bold text-slate-900">{stats.running}</p>
                <p className="text-[10px] text-sky-500 font-medium">Active now</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-slate-200/60 hover:shadow-sm transition-shadow">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                <Archive className="w-5 h-5 text-amber-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-slate-500 truncate">Draft</p>
                <p className="text-xl font-bold text-slate-900">{stats.archived}</p>
                <p className="text-[10px] text-slate-400">Not published</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-slate-200/60 hover:shadow-sm transition-shadow">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center flex-shrink-0">
                <Send className="w-5 h-5 text-violet-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-slate-500 truncate">SMS Sent</p>
                <p className="text-xl font-bold text-slate-900">{stats.withSms}</p>
                <p className="text-[10px] text-slate-400">Via SMS gateway</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={statusTab} onValueChange={setStatusTab}>
          <TabsList className="mb-4 bg-white border border-slate-200 p-1 rounded-xl h-auto flex w-full sm:w-auto">
            <TabsTrigger value="running" className="flex-1 min-w-[100px] data-[state=active]:bg-emerald-600 data-[state=active]:text-white rounded-lg py-2 text-sm">
              <Megaphone className="w-4 h-4 mr-1 hidden sm:inline" /> Running
            </TabsTrigger>
            <TabsTrigger value="archived" className="flex-1 min-w-[100px] data-[state=active]:bg-emerald-600 data-[state=active]:text-white rounded-lg py-2 text-sm">
              <Archive className="w-4 h-4 mr-1 hidden sm:inline" /> Draft
            </TabsTrigger>
            <TabsTrigger value="all" className="flex-1 min-w-[100px] data-[state=active]:bg-emerald-600 data-[state=active]:text-white rounded-lg py-2 text-sm">
              <Globe className="w-4 h-4 mr-1 hidden sm:inline" /> All
            </TabsTrigger>
          </TabsList>

          <TabsContent value={statusTab}>
            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input placeholder="Search by title or content..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 min-h-[44px]" />
              </div>
              <div className="flex gap-2">
                {/* Date Range Filter */}
                <Popover open={dateFilterOpen} onOpenChange={setDateFilterOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="gap-2 min-h-[44px]">
                      <Filter className="w-4 h-4" />
                      {dateFrom || dateTo ? 'Filtered' : 'Date Range'}
                      {(dateFrom || dateTo) && (
                        <Badge className="bg-emerald-100 text-emerald-700 text-[10px] ml-1">On</Badge>
                      )}
                      <ChevronDown className="w-3 h-3" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80" align="end">
                    <div className="space-y-3">
                      <h4 className="font-semibold text-sm text-slate-900">Filter by Date Range</h4>
                      <div className="grid gap-2">
                        <Label className="text-xs text-slate-500">From</Label>
                        <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
                      </div>
                      <div className="grid gap-2">
                        <Label className="text-xs text-slate-500">To</Label>
                        <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => { setDateFilterOpen(false); fetchNotices(); }} className="flex-1 bg-emerald-600 hover:bg-emerald-700">
                          Apply
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => { setDateFrom(''); setDateTo(''); }} className="gap-1">
                          <X className="w-3 h-3" /> Clear
                        </Button>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
                <Button onClick={openCreate} className="bg-emerald-600 hover:bg-emerald-700 min-h-[44px]">
                  <Plus className="w-4 h-4 mr-2" /> Add Notice
                </Button>
              </div>
            </div>

            {notices.length === 0 ? (
              /* Empty State */
              <Card className="border-slate-200/60">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                    <Megaphone className="w-8 h-8 text-slate-300" />
                  </div>
                  <p className="text-slate-500 font-medium">No notices found</p>
                  <p className="text-sm text-slate-400 mt-1">
                    {statusTab === 'archived' ? 'No draft notices yet' : search ? 'Try adjusting your search or filters' : 'Click "Add Notice" to create one'}
                  </p>
                  {statusTab !== 'archived' && (
                    <Button onClick={openCreate} variant="outline" className="mt-4 min-h-[44px]">
                      <Plus className="w-4 h-4 mr-2" /> Add Notice
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              /* Notice Card Grid */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {notices.map(n => (
                  <Card key={n.id} className="hover:shadow-md transition-shadow border-slate-200/60 flex flex-col">
                    <CardContent className="p-4 flex-1 flex flex-col">
                      {/* Card Header: Status + Date */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                            <Megaphone className="w-4 h-4 text-emerald-600" />
                          </div>
                          {getStatusBadge(n)}
                        </div>
                        <span className="text-xs text-slate-400 flex items-center gap-1 flex-shrink-0">
                          <Calendar className="w-3 h-3" />
                          {formatDate(n.create_timestamp)}
                        </span>
                      </div>

                      {/* Title */}
                      <h3 className="font-semibold text-slate-900 text-sm leading-snug mb-1 line-clamp-2">{n.title}</h3>

                      {/* Preview Text */}
                      <p className="text-xs text-slate-500 line-clamp-2 mb-3 flex-1">{n.notice || 'No content'}</p>

                      {/* Date Range */}
                      {(n.start_date || n.end_date) && (
                        <div className="text-[10px] text-slate-400 flex items-center gap-1 mb-3">
                          <Clock className="w-3 h-3" />
                          {n.start_date && `From ${format(new Date(n.start_date), 'dd MMM')}`}
                          {n.start_date && n.end_date && ' \u2192 '}
                          {n.end_date && `To ${format(new Date(n.end_date), 'dd MMM')}`}
                        </div>
                      )}

                      {/* Indicators Row */}
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {/* Visibility */}
                        {n.show_on_website === 1 ? (
                          <Badge className="bg-blue-100 text-blue-700 text-[10px] gap-1 px-1.5 py-0">
                            <Globe className="w-2.5 h-2.5" /> Public
                          </Badge>
                        ) : (
                          <Badge className="bg-slate-100 text-slate-500 text-[10px] gap-1 px-1.5 py-0">
                            <Lock className="w-2.5 h-2.5" /> Private
                          </Badge>
                        )}
                        {/* Target Audience */}
                        {n.visibility_roles && n.visibility_roles !== 'all' && (
                          <Badge variant="outline" className="text-[10px] capitalize px-1.5 py-0">
                            <Users className="w-2.5 h-2.5 mr-0.5" /> {n.visibility_roles}
                          </Badge>
                        )}
                        {/* SMS */}
                        {n.check_sms === 1 && (
                          <Badge className="bg-green-100 text-green-700 text-[10px] gap-1 px-1.5 py-0">
                            <MessageSquare className="w-2.5 h-2.5" /> SMS
                          </Badge>
                        )}
                        {/* Email */}
                        {n.check_email === 1 && (
                          <Badge className="bg-violet-100 text-violet-700 text-[10px] gap-1 px-1.5 py-0">
                            <Mail className="w-2.5 h-2.5" /> Email
                          </Badge>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-1 pt-3 border-t border-slate-100 mt-auto">
                        <Button size="sm" variant="ghost" className="h-9 text-xs text-slate-600 flex-1 min-w-[44px]" onClick={() => { setViewNotice(n); setViewOpen(true); }}>
                          <Eye className="w-3.5 h-3.5 mr-1" /> View
                        </Button>
                        <Button size="sm" variant="ghost" className="h-9 text-xs flex-1 min-w-[44px]" onClick={() => openEdit(n)}>
                          <Pencil className="w-3.5 h-3.5 mr-1" /> Edit
                        </Button>
                        {n.status === 1 ? (
                          <Button size="sm" variant="ghost" className="h-9 text-xs text-amber-600 flex-1 min-w-[44px]" onClick={() => handleArchive(n)}>
                            <Archive className="w-3.5 h-3.5 mr-1" /> Draft
                          </Button>
                        ) : (
                          <Button size="sm" variant="ghost" className="h-9 text-xs text-sky-600 flex-1 min-w-[44px]" onClick={() => handleRestore(n)}>
                            <RotateCcw className="w-3.5 h-3.5 mr-1" /> Restore
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" className="h-9 text-xs text-red-600 min-w-[44px]" onClick={() => { setDeleteNotice(n); setDeleteOpen(true); }}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
      )}

      {/* ============ Add/Edit Notice Dialog ============ */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                <Megaphone className="w-4 h-4 text-emerald-600" />
              </div>
              {editNotice ? 'Edit Notice' : 'Add New Notice'}
            </DialogTitle>
            <DialogDescription>
              {editNotice ? 'Update notice details and publishing options' : 'Create a new school announcement with publishing options'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Title */}
            <div className="grid gap-2">
              <Label className="text-xs font-medium">Notice Title *</Label>
              <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Enter notice title" className="min-h-[44px]" />
            </div>

            {/* Content */}
            <div className="grid gap-2">
              <Label className="text-xs font-medium">Notice Content</Label>
              <Textarea value={form.notice} onChange={e => setForm({ ...form, notice: e.target.value })} placeholder="Write your notice content here..." rows={5} />
            </div>

            {/* Dates */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label className="text-xs font-medium">Event Date</Label>
                <Input type="date" value={form.create_timestamp} onChange={e => setForm({ ...form, create_timestamp: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label className="text-xs font-medium">Visible From</Label>
                <Input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label className="text-xs font-medium">Visible Until</Label>
                <Input type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} />
              </div>
            </div>

            {/* Target Roles */}
            <div className="grid gap-2">
              <Label className="text-xs font-medium">Target Audience</Label>
              <Select value={form.visibility_roles} onValueChange={v => setForm({ ...form, visibility_roles: v })}>
                <SelectTrigger className="min-h-[44px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Everyone</SelectItem>
                  <SelectItem value="teachers">Teachers Only</SelectItem>
                  <SelectItem value="students">Students Only</SelectItem>
                  <SelectItem value="parents">Parents Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Toggles */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex items-center justify-between rounded-lg border border-slate-200 p-3">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-slate-500" />
                  <Label className="text-xs font-medium">Show on Website</Label>
                </div>
                <Switch checked={form.show_on_website} onCheckedChange={v => setForm({ ...form, show_on_website: v })} />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-slate-200 p-3">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-slate-500" />
                  <Label className="text-xs font-medium">Send SMS</Label>
                </div>
                <Switch checked={form.check_sms === 1} onCheckedChange={v => setForm({ ...form, check_sms: v ? 1 : 2 })} />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-slate-200 p-3">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-slate-500" />
                  <Label className="text-xs font-medium">Send Email</Label>
                </div>
                <Switch checked={form.check_email === 1} onCheckedChange={v => setForm({ ...form, check_email: v ? 1 : 2 })} />
              </div>
            </div>

            {/* SMS Target (conditional) */}
            {form.check_sms === 1 && (
              <div className="grid gap-2 pl-4 border-l-2 border-emerald-300">
                <Label className="text-xs font-medium">SMS Target</Label>
                <Select value={String(form.sms_target)} onValueChange={v => setForm({ ...form, sms_target: parseInt(v) })}>
                  <SelectTrigger className="min-h-[44px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">All (Parents, Teachers, Students)</SelectItem>
                    <SelectItem value="2">Parents Only</SelectItem>
                    <SelectItem value="3">Teachers Only</SelectItem>
                    <SelectItem value="4">Students Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Publish Toggle */}
            <div className="flex items-center justify-between rounded-lg bg-emerald-50 border border-emerald-200 p-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <div>
                  <Label className="text-xs font-semibold text-emerald-800">Publish Now</Label>
                  <p className="text-[10px] text-emerald-600">Make visible immediately</p>
                </div>
              </div>
              <Switch checked={form.show_on_website} onCheckedChange={v => setForm({ ...form, show_on_website: v })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700 min-h-[44px]" disabled={!form.title.trim() || saving}>
              {saving ? 'Saving...' : editNotice ? 'Update Notice' : 'Create Notice'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============ View Notice Dialog ============ */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          {viewNotice && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-sky-100 flex items-center justify-center">
                    <Eye className="w-4 h-4 text-sky-600" />
                  </div>
                  Notice Details
                </DialogTitle>
                <DialogDescription>
                  <span className="text-base font-semibold text-slate-900">{viewNotice.title}</span>
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {getStatusBadge(viewNotice)}
                  {viewNotice.show_on_website === 1 ? (
                    <Badge className="bg-blue-100 text-blue-700 text-xs gap-1"><Globe className="w-3 h-3" /> Public</Badge>
                  ) : (
                    <Badge className="bg-slate-100 text-slate-600 text-xs gap-1"><Lock className="w-3 h-3" /> Private</Badge>
                  )}
                  {viewNotice.visibility_roles && viewNotice.visibility_roles !== 'all' && (
                    <Badge variant="outline" className="text-xs capitalize"><Users className="w-3 h-3 mr-1" /> {viewNotice.visibility_roles}</Badge>
                  )}
                  {viewNotice.check_sms === 1 && (
                    <Badge className="bg-green-100 text-green-700 text-xs gap-1"><MessageSquare className="w-3 h-3" /> SMS {'\u2192'} {SMS_TARGET_MAP[viewNotice.sms_target]}</Badge>
                  )}
                  {viewNotice.check_email === 1 && (
                    <Badge className="bg-violet-100 text-violet-700 text-xs gap-1"><Mail className="w-3 h-3" /> Email</Badge>
                  )}
                </div>

                <div className="bg-slate-50 rounded-lg p-4">
                  <p className="text-slate-700 whitespace-pre-wrap leading-relaxed text-sm">{viewNotice.notice || 'No content'}</p>
                </div>

                {viewNotice.notice_timestamp && (
                  <p className="text-[10px] text-slate-400">
                    Created: {format(new Date(viewNotice.notice_timestamp), 'dd MMM yyyy, HH:mm:ss')}
                  </p>
                )}

                <DialogFooter className="gap-2 sm:gap-0">
                  <Button variant="outline" onClick={() => setViewOpen(false)} className="min-h-[44px]">Close</Button>
                  <Button onClick={() => { setViewOpen(false); openEdit(viewNotice); }} className="bg-emerald-600 hover:bg-emerald-700 min-h-[44px]">
                    <Pencil className="w-4 h-4 mr-1.5" /> Edit
                  </Button>
                </DialogFooter>
                <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {formatDate(viewNotice.create_timestamp)}
                  {viewNotice.start_date && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 ml-2" />
                      {format(new Date(viewNotice.start_date), 'dd MMM yyyy')}
                      {viewNotice.end_date && ` \u2192 ${format(new Date(viewNotice.end_date), 'dd MMM yyyy')}`}
                    </span>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ============ Delete Confirmation Dialog ============ */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                <AlertCircle className="w-4 h-4 text-red-600" />
              </div>
              Delete Notice
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deleteNotice?.title}</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="min-h-[44px]">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 min-h-[44px]">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
