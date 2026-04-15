"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Megaphone, Plus, Search, Pencil, Trash2, Eye,
  Calendar, Pin, Globe, Lock, Archive, RotateCcw, FileText,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { RequirePermission } from "@/components/auth/require-permission";
import { PERMISSIONS } from "@/lib/permissions";
import { format } from "date-fns";

// ─── Types ───────────────────────────────────────────────────
interface Notice {
  id: number;
  title: string;
  notice: string;
  is_pinned: boolean;
  show_on_website: boolean;
  visibility_roles: string;
  attachment: string;
  image: string;
  check_sms: number;
  sms_target: number;
  check_email: number;
  start_date: string | null;
  end_date: string | null;
  status: string;
  created_at: string | null;
  timestamp: string | null;
}

interface NoticeStats {
  total: number;
  running: number;
  archived: number;
}

// ─── Notices Page ────────────────────────────────────────────
export default function NoticesPage() {
  const { isAdmin, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [stats, setStats] = useState<NoticeStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("running");

  // Dialog states
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [showOnWebsite, setShowOnWebsite] = useState(true);
  const [sendSms, setSendSms] = useState(false);
  const [smsTarget, setSmsTarget] = useState("0");
  const [sendEmail, setSendEmail] = useState(false);
  const [form, setForm] = useState({ title: "", notice: "" });

  // ─── Fetch notices ─────────────────────────────────────────
  const fetchNotices = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (tab !== "all") params.set("status", tab);
      if (search) params.set("search", search);
      const res = await fetch(`/api/notices?${params}`);
      if (res.ok) {
        const data = await res.json();
        setNotices(data.data || []);
        setStats(data.stats || null);
      }
    } catch {
      setError("Failed to load notices");
    } finally {
      setIsLoading(false);
    }
  }, [tab, search]);

  useEffect(() => {
    if (!authLoading) fetchNotices();
  }, [authLoading, fetchNotices]);

  // ─── Sorted (pinned first, then by date) ─────────────────
  const sortedNotices = [...notices].sort((a, b) => {
    if (a.is_pinned && !b.is_pinned) return -1;
    if (!a.is_pinned && b.is_pinned) return 1;
    return new Date(b.timestamp || b.created_at || 0).getTime() - new Date(a.timestamp || a.created_at || 0).getTime();
  });

  // ─── Admin actions ────────────────────────────────────────
  const openCreate = () => {
    setSelectedNotice(null);
    setForm({ title: "", notice: "" });
    setShowOnWebsite(true);
    setSendSms(false);
    setSmsTarget("0");
    setSendEmail(false);
    setFormOpen(true);
  };

  const openEdit = (n: Notice) => {
    setSelectedNotice(n);
    setForm({ title: n.title, notice: n.notice });
    setShowOnWebsite(n.show_on_website);
    setSendSms(n.check_sms === 1);
    setSmsTarget(String(n.sms_target));
    setSendEmail(n.check_email === 1);
    setFormOpen(true);
  };

  const handleSave = async () => {
    try {
      const body = {
        title: form.title,
        notice: form.notice,
        show_on_website: showOnWebsite,
        check_sms: sendSms ? 1 : 2,
        sms_target: parseInt(smsTarget),
        check_email: sendEmail ? 1 : 2,
      };
      const url = selectedNotice ? `/api/notices` : "/api/notices";
      const method = selectedNotice ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(selectedNotice ? { id: selectedNotice.id, ...body } : body),
      });
      if (!res.ok) throw new Error();
      toast({ title: "Success", description: selectedNotice ? "Notice updated" : "Notice created" });
      setFormOpen(false);
      fetchNotices();
    } catch {
      toast({ title: "Error", variant: "destructive", description: "Failed to save notice" });
    }
  };

  const handleDelete = async () => {
    if (!selectedNotice) return;
    try {
      await fetch(`/api/notices?id=${selectedNotice.id}`, { method: "DELETE" });
      toast({ title: "Success", description: "Notice deleted" });
      setDeleteOpen(false);
      fetchNotices();
    } catch {
      toast({ title: "Error", variant: "destructive", description: "Failed to delete notice" });
    }
  };

  const handleArchive = async (n: Notice) => {
    try {
      const action = n.status === "archived" ? "restore" : "archive";
      await fetch(`/api/notices?id=${n.id}&action=${action}`, { method: "DELETE" });
      toast({ title: "Success", description: action === "archive" ? "Notice archived" : "Notice restored" });
      fetchNotices();
    } catch {
      toast({ title: "Error", variant: "destructive", description: "Action failed" });
    }
  };

  // ─── Loading state ─────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24" />)}</div>
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ─── Header ─────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Noticeboard</h1>
          <p className="text-sm text-slate-500 mt-1">School announcements and notices</p>
        </div>
        <RequirePermission permission={PERMISSIONS.CAN_MANAGE_NOTICES}>
          <Button onClick={openCreate} className="bg-emerald-600 hover:bg-emerald-700 min-w-[44px] min-h-[44px]">
            <Plus className="w-4 h-4 mr-2" /> Add Notice
          </Button>
        </RequirePermission>
      </div>

      {/* ─── Stats ────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="py-4 border-l-4 border-l-emerald-500"><CardContent className="px-4 pb-0 pt-0"><p className="text-xs font-medium text-slate-500">Running</p><p className="text-2xl font-bold text-emerald-600">{stats?.running || 0}</p></CardContent></Card>
        <Card className="py-4 border-l-4 border-l-amber-500"><CardContent className="px-4 pb-0 pt-0"><p className="text-xs font-medium text-slate-500">Archived</p><p className="text-2xl font-bold text-amber-600">{stats?.archived || 0}</p></CardContent></Card>
        <Card className="py-4 border-l-4 border-l-slate-400"><CardContent className="px-4 pb-0 pt-0"><p className="text-xs font-medium text-slate-500">Total</p><p className="text-2xl font-bold text-slate-900">{stats?.total || 0}</p></CardContent></Card>
      </div>

      {/* ─── Tabs ──────────────────────────────────────────── */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="running">Running</TabsTrigger>
          <TabsTrigger value="archived">Archived</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>

        {/* ─── Search ─────────────────────────────────────── */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input placeholder="Search notices..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 min-h-[44px]" />
        </div>

        {error && (
          <div className="flex items-center gap-3 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            ⚠ {error}
          </div>
        )}

        {/* ─── Pinned Notices ──────────────────────────────── */}
        {sortedNotices.filter((n) => n.is_pinned).length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
              <Pin className="w-4 h-4" /> Pinned
            </h3>
            {sortedNotices.filter((n) => n.is_pinned).map((notice) => (
              <Card key={notice.id} className="gap-4 border-amber-200 bg-amber-50/30">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1 cursor-pointer" onClick={() => { setSelectedNotice(notice); setViewOpen(true); }}>
                      <div className="flex items-center gap-2 mb-1">
                        <Pin className="w-4 h-4 text-amber-500 flex-shrink-0" />
                        <h4 className="font-semibold text-slate-900 truncate">{notice.title}</h4>
                      </div>
                      <p className="text-sm text-slate-500 line-clamp-2">{notice.notice}</p>
                      {notice.timestamp && (
                        <span className="text-xs text-slate-400 mt-2 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(notice.timestamp), "MMM d, yyyy")}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Button variant="ghost" size="sm" className="h-7 min-w-[44px] min-h-[44px]" onClick={() => { setSelectedNotice(notice); setViewOpen(true); }}>
                        <Eye className="w-3 h-3" />
                      </Button>
                      {isAdmin && (
                        <>
                          <Button variant="ghost" size="sm" className="h-7 min-w-[44px] min-h-[44px]" onClick={() => openEdit(notice)}>
                            <Pencil className="w-3 h-3" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-7 min-w-[44px] min-h-[44px]" onClick={() => handleArchive(notice)}>
                            <Archive className="w-3 h-3" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-7 text-red-600 min-w-[44px] min-h-[44px]" onClick={() => { setSelectedNotice(notice); setDeleteOpen(true); }}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* ─── All Notices ─────────────────────────────────── */}
        <Card className="gap-4">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                <Megaphone className="w-4 h-4 text-amber-600" />
              </div>
              <CardTitle className="text-base font-semibold">All Notices ({sortedNotices.length})</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {sortedNotices.length === 0 ? (
              <div className="text-center py-12">
                <Megaphone className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-400 text-sm">No notices found</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {sortedNotices.map((notice) => (
                  <div key={notice.id} className="p-4 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => { setSelectedNotice(notice); setViewOpen(true); }}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <h4 className="font-semibold text-sm text-slate-900 truncate">{notice.title}</h4>
                        <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{notice.notice}</p>
                        <div className="flex items-center gap-3 mt-1">
                          {notice.timestamp && <span className="text-[10px] text-slate-400">{format(new Date(notice.timestamp), "MMM d, yyyy")}</span>}
                          {notice.attachment && <span className="text-[10px] text-sky-600 flex items-center gap-0.5"><FileText className="w-3 h-3" /> Attachment</span>}
                          {notice.visibility_roles !== "all" && <Badge variant="outline" className="text-[10px] h-4">{notice.visibility_roles}</Badge>}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {notice.is_pinned && <Pin className="w-3.5 h-3.5 text-amber-500" />}
                        {isAdmin && (
                          <Button variant="ghost" size="sm" className="h-7" onClick={(e) => { e.stopPropagation(); openEdit(notice); }}>
                            <Pencil className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </Tabs>

      {/* ─── View Dialog ─────────────────────────────────── */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedNotice?.title}</DialogTitle>
          </DialogHeader>
          {selectedNotice && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className={selectedNotice.status === "running" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}>
                  {selectedNotice.status === "running" ? "Running" : "Archived"}
                </Badge>
                {selectedNotice.is_pinned && <Badge className="bg-amber-100 text-amber-700">Pinned</Badge>}
                {selectedNotice.show_on_website && <Badge className="bg-sky-100 text-sky-700"><Globe className="w-3 h-3 mr-1" />Website</Badge>}
                {selectedNotice.visibility_roles !== "all" && <Badge variant="outline">{selectedNotice.visibility_roles}</Badge>}
              </div>
              {selectedNotice.timestamp && (
                <p className="text-sm text-slate-400 flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {format(new Date(selectedNotice.timestamp), "EEEE, MMMM d, yyyy")}
                </p>
              )}
              <div className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                {selectedNotice.notice}
              </div>
              {selectedNotice.attachment && (
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <p className="text-xs font-medium text-slate-500 mb-1">Attachment</p>
                  <p className="text-sm text-slate-700">{selectedNotice.attachment}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ─── Create/Edit Dialog (admin only) ─────────────── */}
      <RequirePermission permission={PERMISSIONS.CAN_MANAGE_NOTICES}>
        <Dialog open={formOpen} onOpenChange={setFormOpen}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedNotice ? "Edit Notice" : "Add Notice"}</DialogTitle>
              <DialogDescription>Create or update a notice</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Title *</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Notice title" />
              </div>
              <div className="grid gap-2">
                <Label>Content</Label>
                <Textarea value={form.notice} onChange={(e) => setForm({ ...form, notice: e.target.value })} placeholder="Write your notice here..." rows={6} />
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={showOnWebsite} onCheckedChange={setShowOnWebsite} />
                <Label className="text-sm">Show on website</Label>
                {showOnWebsite ? <Globe className="w-4 h-4 text-emerald-600" /> : <Lock className="w-4 h-4 text-slate-400" />}
              </div>
              <div className="p-3 rounded-lg border border-slate-200 space-y-3">
                <p className="text-xs font-semibold text-slate-600 uppercase">Notifications</p>
                <div className="flex items-center gap-2">
                  <Switch checked={sendSms} onCheckedChange={setSendSms} />
                  <Label className="text-sm">Send SMS</Label>
                </div>
                {sendSms && (
                  <div className="grid gap-2">
                    <Label>SMS Target</Label>
                    <Select value={smsTarget} onValueChange={setSmsTarget}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">All</SelectItem>
                        <SelectItem value="1">Parents</SelectItem>
                        <SelectItem value="2">Teachers</SelectItem>
                        <SelectItem value="3">Students</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Switch checked={sendEmail} onCheckedChange={setSendEmail} />
                  <Label className="text-sm">Send Email</Label>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700" disabled={!form.title.trim()}>
                {selectedNotice ? "Update" : "Publish"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Notice</AlertDialogTitle>
              <AlertDialogDescription>Delete <strong>{selectedNotice?.title}</strong>? This action cannot be undone.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </RequirePermission>
    </div>
  );
}
