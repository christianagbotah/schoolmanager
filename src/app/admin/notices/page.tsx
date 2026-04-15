'use client';

import { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover';
import {
  Megaphone, Plus, Search, Pencil, Trash2, Eye, Calendar, Archive, RotateCcw,
  Globe, Lock, MessageSquare, Mail, Bell, Filter, Users, Upload, FileText, X,
  Clock, ChevronDown, CheckCircle2, AlertCircle,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface Notice {
  id: number; title: string; notice: string; timestamp: string | null;
  create_timestamp: number; show_on_website: number; status: number;
  image: string; attachment: string; check_sms: number; sms_target: number;
  check_email: number; notice_timestamp: string | null;
  start_date: string | null; end_date: string | null; visibility_roles: string;
}

interface NoticeStats { total: number; running: number; archived: number; withSms: number; }

const VISIBILITY_OPTIONS = [
  { value: 'all', label: 'Everyone', icon: Users },
  { value: 'teachers', label: 'Teachers', icon: Users },
  { value: 'students', label: 'Students', icon: Users },
  { value: 'parents', label: 'Parents', icon: Users },
];

const SMS_TARGET_MAP: Record<number, string> = {
  0: 'Off', 1: 'All', 2: 'Parents', 3: 'Teachers', 4: 'Students',
};

export default function NoticesPage() {
  const { toast } = useToast();
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
    } catch { /* empty */ }
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
      toast({ title: 'Error', description: 'Title is required', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      if (editNotice) {
        await fetch('/api/admin/notices', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editNotice.id, ...form }),
        });
        toast({ title: 'Success', description: 'Notice updated successfully' });
      } else {
        await fetch('/api/admin/notices', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
        toast({ title: 'Success', description: 'Notice created successfully' });
      }
      setFormOpen(false);
      fetchNotices();
    } catch {
      toast({ title: 'Error', variant: 'destructive' });
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deleteNotice) return;
    try {
      await fetch(`/api/admin/notices?id=${deleteNotice.id}`, { method: 'DELETE' });
      toast({ title: 'Success', description: 'Notice deleted' });
      setDeleteOpen(false);
      fetchNotices();
    } catch {
      toast({ title: 'Error', variant: 'destructive' });
    }
  };

  const handleArchive = async (n: Notice) => {
    try {
      await fetch(`/api/admin/notices?id=${n.id}&action=archive`, { method: 'DELETE' });
      toast({ title: 'Success', description: 'Notice archived' });
      fetchNotices();
    } catch {
      toast({ title: 'Error', variant: 'destructive' });
    }
  };

  const handleRestore = async (n: Notice) => {
    try {
      await fetch(`/api/admin/notices?id=${n.id}&action=restore`, { method: 'DELETE' });
      toast({ title: 'Success', description: 'Notice restored to running' });
      fetchNotices();
    } catch {
      toast({ title: 'Error', variant: 'destructive' });
    }
  };

  const formatDate = (ts: number | null) => {
    if (!ts) return '—';
    return format(new Date(ts * 1000), 'dd MMM, yyyy');
  };

  const isCurrentlyVisible = (n: Notice) => {
    if (n.status !== 1) return false;
    const now = new Date();
    if (n.start_date && new Date(n.start_date) > now) return false;
    if (n.end_date && new Date(n.end_date) < now) return false;
    return true;
  };

  const clearDateFilter = () => {
    setDateFrom('');
    setDateTo('');
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
              <Megaphone className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Noticeboard</h1>
              <p className="text-sm text-slate-500">Create and manage school announcements</p>
            </div>
          </div>
          <Button onClick={openCreate} className="bg-emerald-600 hover:bg-emerald-700 min-h-[44px] shadow-md">
            <Plus className="w-4 h-4 mr-2" /> Add Notice
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="border-slate-200/60 hover:shadow-md transition-shadow">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                <Megaphone className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Total</p>
                <p className="text-xl font-bold">{stats.total}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-slate-200/60 hover:shadow-md transition-shadow">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Running</p>
                <p className="text-xl font-bold text-blue-600">{stats.running}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-slate-200/60 hover:shadow-md transition-shadow">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <Archive className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Archived</p>
                <p className="text-xl font-bold text-amber-600">{stats.archived}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-slate-200/60 hover:shadow-md transition-shadow">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center">
                <Bell className="w-5 h-5 text-violet-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">SMS Alerts</p>
                <p className="text-xl font-bold text-violet-600">{stats.withSms}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={statusTab} onValueChange={setStatusTab}>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <TabsList>
              <TabsTrigger value="running" className="gap-2">
                <Globe className="w-4 h-4" /> Running
              </TabsTrigger>
              <TabsTrigger value="archived" className="gap-2">
                <Archive className="w-4 h-4" /> Archived
              </TabsTrigger>
              <TabsTrigger value="all" className="gap-2">
                <Megaphone className="w-4 h-4" /> All
              </TabsTrigger>
            </TabsList>

            {/* Date Range Filter */}
            <Popover open={dateFilterOpen} onOpenChange={setDateFilterOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 min-h-[38px]">
                  <Filter className="w-4 h-4" />
                  {dateFrom || dateTo ? 'Date Filter Active' : 'Filter by Date'}
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
                    <Input
                      type="date"
                      value={dateFrom}
                      onChange={e => setDateFrom(e.target.value)}
                      className="h-9"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-xs text-slate-500">To</Label>
                    <Input
                      type="date"
                      value={dateTo}
                      onChange={e => setDateTo(e.target.value)}
                      className="h-9"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => { setDateFilterOpen(false); fetchNotices(); }} className="flex-1 bg-emerald-600 hover:bg-emerald-700">
                      Apply
                    </Button>
                    <Button size="sm" variant="outline" onClick={clearDateFilter} className="gap-1">
                      <X className="w-3 h-3" /> Clear
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Search */}
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search notices..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10 min-h-[44px]"
            />
          </div>

          {/* Notice List */}
          <TabsContent value={statusTab} className="mt-4">
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-24 rounded-xl" />
                ))}
              </div>
            ) : notices.length === 0 ? (
              <Card className="py-16">
                <CardContent className="flex flex-col items-center">
                  <Megaphone className="w-16 h-16 text-slate-200 mb-4" />
                  <p className="text-slate-500 font-medium">No notices found</p>
                  <p className="text-slate-400 text-sm mt-1">
                    {statusTab === 'archived' ? 'No archived notices' : 'Click "Add Notice" to create one'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-slate-200/60 overflow-hidden">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50">
                        <TableHead className="text-xs font-semibold w-10">#</TableHead>
                        <TableHead className="text-xs font-semibold min-w-[200px]">Title</TableHead>
                        <TableHead className="text-xs font-semibold">Date Range</TableHead>
                        <TableHead className="text-xs font-semibold">Visibility</TableHead>
                        <TableHead className="text-xs font-semibold">SMS</TableHead>
                        <TableHead className="text-xs font-semibold">Status</TableHead>
                        <TableHead className="text-xs font-semibold text-right">Options</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {notices.map((n, i) => (
                        <TableRow key={n.id} className="hover:bg-slate-50 transition-colors">
                          <TableCell className="text-sm text-slate-500">{i + 1}</TableCell>
                          <TableCell>
                            <div className="flex items-start gap-2">
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-slate-900 text-sm truncate">{n.title}</h3>
                                <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{n.notice}</p>
                                {(n.image || n.attachment) && (
                                  <div className="flex gap-1 mt-1">
                                    {n.image && (
                                      <Badge className="bg-sky-100 text-sky-700 text-[10px] gap-1">
                                        <Upload className="w-3 h-3" /> Image
                                      </Badge>
                                    )}
                                    {n.attachment && (
                                      <Badge className="bg-orange-100 text-orange-700 text-[10px] gap-1">
                                        <FileText className="w-3 h-3" /> File
                                      </Badge>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-slate-600">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-slate-400" />
                              {formatDate(n.create_timestamp)}
                            </div>
                            {n.start_date && n.end_date && (
                              <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                                <Clock className="w-2.5 h-2.5" />
                                {format(new Date(n.start_date), 'dd MMM')} → {format(new Date(n.end_date), 'dd MMM')}
                              </div>
                            )}
                            {n.start_date && !n.end_date && (
                              <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                                <Clock className="w-2.5 h-2.5" />
                                From {format(new Date(n.start_date), 'dd MMM yyyy')}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              <div>
                                {n.show_on_website === 1 ? (
                                  <Badge className="bg-blue-100 text-blue-700 text-[10px] gap-1">
                                    <Globe className="w-3 h-3" /> Public
                                  </Badge>
                                ) : (
                                  <Badge className="bg-slate-100 text-slate-600 text-[10px] gap-1">
                                    <Lock className="w-3 h-3" /> Private
                                  </Badge>
                                )}
                              </div>
                              {n.visibility_roles && n.visibility_roles !== 'all' && (
                                <Badge variant="outline" className="text-[10px] capitalize">
                                  {n.visibility_roles}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {n.check_sms === 1 ? (
                              <div className="flex flex-col gap-0.5">
                                <Badge className="bg-green-100 text-green-700 text-[10px] gap-1">
                                  <Bell className="w-3 h-3" /> On
                                </Badge>
                                <span className="text-[9px] text-slate-400">
                                  {SMS_TARGET_MAP[n.sms_target] || 'All'}
                                </span>
                              </div>
                            ) : (
                              <span className="text-xs text-slate-400">Off</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {n.status === 1 ? (
                              isCurrentlyVisible(n) ? (
                                <Badge className="bg-emerald-100 text-emerald-700 text-[10px] gap-1">
                                  <CheckCircle2 className="w-3 h-3" /> Active
                                </Badge>
                              ) : (
                                <Badge className="bg-amber-100 text-amber-700 text-[10px] gap-1">
                                  <AlertCircle className="w-3 h-3" /> Scheduled
                                </Badge>
                              )
                            ) : (
                              <Badge className="bg-slate-100 text-slate-500 text-[10px] gap-1">
                                <Archive className="w-3 h-3" /> Archived
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-end gap-0.5">
                              <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-blue-600" onClick={() => { setViewNotice(n); setViewOpen(true); }} title="View">
                                <Eye className="w-3.5 h-3.5" />
                              </Button>
                              <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-emerald-600" onClick={() => openEdit(n)} title="Edit">
                                <Pencil className="w-3.5 h-3.5" />
                              </Button>
                              {n.status === 1 ? (
                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-amber-600" onClick={() => handleArchive(n)} title="Archive">
                                  <Archive className="w-3.5 h-3.5" />
                                </Button>
                              ) : (
                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-blue-600" onClick={() => handleRestore(n)} title="Restore">
                                  <RotateCcw className="w-3.5 h-3.5" />
                                </Button>
                              )}
                              <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-600" onClick={() => { setDeleteNotice(n); setDeleteOpen(true); }} title="Delete">
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* ============ Create/Edit Form Dialog ============ */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {editNotice ? <Pencil className="w-5 h-5 text-emerald-600" /> : <Plus className="w-5 h-5 text-emerald-600" />}
              {editNotice ? 'Edit Notice' : 'Add Notice'}
            </DialogTitle>
            <DialogDescription>
              {editNotice ? 'Update notice details and notification settings' : 'Create a new notice and optionally send SMS/email alerts'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-5 py-4">
            {/* Title */}
            <div className="grid gap-2">
              <Label className="text-sm font-semibold">Title *</Label>
              <Input
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                placeholder="Notice title"
                className="min-h-[44px]"
              />
            </div>

            {/* Notice Content */}
            <div className="grid gap-2">
              <Label className="text-sm font-semibold">Notice</Label>
              <Textarea
                value={form.notice}
                onChange={e => setForm({ ...form, notice: e.target.value })}
                placeholder="Write your notice content here..."
                rows={5}
                className="min-h-[100px]"
              />
            </div>

            {/* Date Range Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label className="text-sm font-semibold flex items-center gap-1">
                  <Calendar className="w-4 h-4" /> Event Date *
                </Label>
                <Input
                  type="date"
                  value={form.create_timestamp}
                  onChange={e => setForm({ ...form, create_timestamp: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label className="text-sm font-semibold">Visible From</Label>
                <Input
                  type="date"
                  value={form.start_date}
                  onChange={e => setForm({ ...form, start_date: e.target.value })}
                  placeholder="Start date"
                />
              </div>
              <div className="grid gap-2">
                <Label className="text-sm font-semibold">Visible Until</Label>
                <Input
                  type="date"
                  value={form.end_date}
                  onChange={e => setForm({ ...form, end_date: e.target.value })}
                  placeholder="End date (optional)"
                />
              </div>
            </div>

            {/* Visibility Section */}
            <Card className="border-slate-200">
              <CardHeader className="pb-3 pt-4 px-4">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Users className="w-4 h-4 text-slate-600" /> Visibility & Access
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 space-y-4">
                {/* Show on Website */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Switch checked={form.show_on_website} onCheckedChange={v => setForm({ ...form, show_on_website: v })} />
                    <div>
                      <Label className="text-sm">Show on Website</Label>
                      <p className="text-xs text-slate-400">Display publicly on the school website</p>
                    </div>
                  </div>
                  {form.show_on_website ? <Globe className="w-5 h-5 text-emerald-600" /> : <Lock className="w-5 h-5 text-slate-400" />}
                </div>

                {/* Visibility Roles */}
                <div className="grid gap-2">
                  <Label className="text-sm font-semibold">Visible to</Label>
                  <Select value={form.visibility_roles} onValueChange={v => setForm({ ...form, visibility_roles: v })}>
                    <SelectTrigger className="min-h-[42px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Everyone (All Roles)</SelectItem>
                      <SelectItem value="teachers">Teachers Only</SelectItem>
                      <SelectItem value="students">Students Only</SelectItem>
                      <SelectItem value="parents">Parents Only</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-slate-400">Controls who can see this notice in their dashboard</p>
                </div>
              </CardContent>
            </Card>

            {/* Notifications Section */}
            <Card className="border-slate-200">
              <CardHeader className="pb-3 pt-4 px-4">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Bell className="w-4 h-4 text-slate-600" /> Notifications
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 space-y-4">
                {/* Send SMS */}
                <div className="grid gap-2">
                  <Label className="text-sm font-semibold flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" /> Send SMS Alert
                  </Label>
                  <Select value={String(form.check_sms)} onValueChange={v => setForm({ ...form, check_sms: parseInt(v) })}>
                    <SelectTrigger className="min-h-[42px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Yes — Send SMS</SelectItem>
                      <SelectItem value="2">No — Skip SMS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* SMS Target (conditional) */}
                {form.check_sms === 1 && (
                  <div className="grid gap-2 pl-1 border-l-2 border-emerald-300">
                    <Label className="text-sm font-semibold">Send SMS to...</Label>
                    <Select value={String(form.sms_target)} onValueChange={v => setForm({ ...form, sms_target: parseInt(v) })}>
                      <SelectTrigger className="min-h-[42px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">All (Parents, Teachers, Students)</SelectItem>
                        <SelectItem value="2">Parents Only</SelectItem>
                        <SelectItem value="3">Teachers Only</SelectItem>
                        <SelectItem value="4">Students Only</SelectItem>
                      </SelectContent>
                    </Select>
                    <Badge className="bg-blue-100 text-blue-700 text-xs w-fit">SMS Service</Badge>
                  </div>
                )}

                {/* Send Email Alert */}
                <div className="grid gap-2">
                  <Label className="text-sm font-semibold flex items-center gap-2">
                    <Mail className="w-4 h-4" /> Send Email Alert
                  </Label>
                  <Select value={String(form.check_email)} onValueChange={v => setForm({ ...form, check_email: parseInt(v) })}>
                    <SelectTrigger className="min-h-[42px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Yes — Send Email</SelectItem>
                      <SelectItem value="2">No — Skip Email</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* File Attachments */}
            <Card className="border-slate-200">
              <CardHeader className="pb-3 pt-4 px-4">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Upload className="w-4 h-4 text-slate-600" /> Attachments
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 space-y-3">
                <div className="grid gap-2">
                  <Label className="text-xs text-slate-500">Image</Label>
                  <div className="flex items-center gap-3">
                    <Input
                      type="file"
                      accept="image/*"
                      className="flex-1 file:border-dashed file:border-slate-300 file:rounded-lg file:px-3 file:py-2 file:text-xs file:mr-3"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) setForm({ ...form, image: file.name });
                      }}
                    />
                    {form.image && (
                      <Badge className="bg-sky-100 text-sky-700 text-[10px] gap-1 shrink-0">
                        <Upload className="w-3 h-3" /> {form.image}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label className="text-xs text-slate-500">Document</Label>
                  <div className="flex items-center gap-3">
                    <Input
                      type="file"
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                      className="flex-1 file:border-dashed file:border-slate-300 file:rounded-lg file:px-3 file:py-2 file:text-xs file:mr-3"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) setForm({ ...form, attachment: file.name });
                      }}
                    />
                    {form.attachment && (
                      <Badge className="bg-orange-100 text-orange-700 text-[10px] gap-1 shrink-0">
                        <FileText className="w-3 h-3" /> {form.attachment}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-slate-400">Max 4MB per file. Supported: PDF, DOC, DOCX, XLS, XLSX</p>
                </div>
              </CardContent>
            </Card>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button
              onClick={handleSave}
              className="bg-emerald-600 hover:bg-emerald-700 min-h-[44px] px-6"
              disabled={!form.title.trim() || saving}
            >
              {saving ? 'Saving...' : editNotice ? 'Update Notice' : 'Add Notice'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============ View Dialog ============ */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          {viewNotice && (
            <>
              <DialogHeader>
                <DialogTitle className="text-lg">{viewNotice.title}</DialogTitle>
                <DialogDescription className="flex items-center gap-3 flex-wrap">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {formatDate(viewNotice.create_timestamp)}
                  </span>
                  {viewNotice.start_date && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {format(new Date(viewNotice.start_date), 'dd MMM yyyy')}
                      {viewNotice.end_date && ` → ${format(new Date(viewNotice.end_date), 'dd MMM yyyy')}`}
                    </span>
                  )}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {viewNotice.status === 1 ? (
                    isCurrentlyVisible(viewNotice) ? (
                      <Badge className="bg-emerald-100 text-emerald-700">Active</Badge>
                    ) : (
                      <Badge className="bg-amber-100 text-amber-700">Scheduled</Badge>
                    )
                  ) : (
                    <Badge className="bg-slate-100 text-slate-500">Archived</Badge>
                  )}
                  {viewNotice.show_on_website === 1 ? (
                    <Badge className="bg-blue-100 text-blue-700 gap-1"><Globe className="w-3 h-3" /> Public</Badge>
                  ) : (
                    <Badge className="bg-slate-100 text-slate-600 gap-1"><Lock className="w-3 h-3" /> Private</Badge>
                  )}
                  {viewNotice.visibility_roles && viewNotice.visibility_roles !== 'all' && (
                    <Badge variant="outline" className="capitalize">{viewNotice.visibility_roles}</Badge>
                  )}
                  {viewNotice.check_sms === 1 && (
                    <Badge className="bg-green-100 text-green-700 gap-1">
                      <Bell className="w-3 h-3" /> SMS → {SMS_TARGET_MAP[viewNotice.sms_target]}
                    </Badge>
                  )}
                  {viewNotice.check_email === 1 && (
                    <Badge className="bg-violet-100 text-violet-700 gap-1">
                      <Mail className="w-3 h-3" /> Email
                    </Badge>
                  )}
                </div>

                {/* Attachments */}
                {(viewNotice.image || viewNotice.attachment) && (
                  <div className="bg-slate-50 rounded-lg p-3 space-y-2">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Attachments</p>
                    {viewNotice.image && (
                      <div className="flex items-center gap-2 text-sm">
                        <div className="w-8 h-8 rounded bg-sky-100 flex items-center justify-center">
                          <Upload className="w-4 h-4 text-sky-600" />
                        </div>
                        <span className="text-slate-700">{viewNotice.image}</span>
                      </div>
                    )}
                    {viewNotice.attachment && (
                      <div className="flex items-center gap-2 text-sm">
                        <div className="w-8 h-8 rounded bg-orange-100 flex items-center justify-center">
                          <FileText className="w-4 h-4 text-orange-600" />
                        </div>
                        <span className="text-slate-700">{viewNotice.attachment}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Notice Content */}
                <div className="prose prose-sm max-w-none">
                  <p className="text-slate-700 whitespace-pre-wrap leading-relaxed text-sm">{viewNotice.notice || 'No content'}</p>
                </div>

                {/* Created timestamp */}
                {viewNotice.notice_timestamp && (
                  <p className="text-[10px] text-slate-400">
                    Created: {format(new Date(viewNotice.notice_timestamp), 'dd MMM yyyy, HH:mm:ss')}
                  </p>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ============ Delete Confirmation ============ */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Notice</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong className="text-slate-900">{deleteNotice?.title}</strong>? This action cannot be undone and will remove all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
