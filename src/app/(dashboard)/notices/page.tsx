"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Megaphone,
  Plus,
  Search,
  Pencil,
  Trash2,
  Eye,
  Calendar,
  Pin,
  Globe,
  Lock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
  is_pinned: number;
  timestamp: string | null;
  created_at: string;
}

// ─── Notices Page ────────────────────────────────────────────
/**
 * Shared Notices Page
 * - All roles can view notices
 * - Admin users can create, edit, delete notices
 */
export default function NoticesPage() {
  const { isAdmin, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  // Dialog states
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [showOnWebsite, setShowOnWebsite] = useState(true);
  const [form, setForm] = useState({ title: "", notice: "" });

  // ─── Fetch notices ─────────────────────────────────────────
  const fetchNotices = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      const res = await fetch(`/api/notices?${params}`);
      if (res.ok) {
        const data = await res.json();
        setNotices(Array.isArray(data) ? data : []);
      }
    } catch {
      setError("Failed to load notices");
    } finally {
      setIsLoading(false);
    }
  }, [search]);

  useEffect(() => {
    if (!authLoading) fetchNotices();
  }, [authLoading, fetchNotices]);

  // ─── Filtered + sorted ─────────────────────────────────────
  const filteredNotices = notices
    .filter((n) => {
      const q = search.toLowerCase();
      return n.title?.toLowerCase().includes(q) || n.notice?.toLowerCase().includes(q);
    })
    .sort((a, b) => {
      if (a.is_pinned && !b.is_pinned) return -1;
      if (!a.is_pinned && b.is_pinned) return 1;
      return new Date(b.timestamp || b.created_at || 0).getTime() - new Date(a.timestamp || a.created_at || 0).getTime();
    });

  // ─── Admin actions ────────────────────────────────────────
  const openCreate = () => {
    setSelectedNotice(null);
    setForm({ title: "", notice: "" });
    setShowOnWebsite(true);
    setFormOpen(true);
  };

  const openEdit = (n: Notice) => {
    setSelectedNotice(n);
    setForm({ title: n.title, notice: n.notice });
    setFormOpen(true);
  };

  const handleSave = async () => {
    try {
      const url = selectedNotice ? `/api/notices?id=${selectedNotice.id}` : "/api/notices";
      const method = selectedNotice ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
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

  // ─── Loading state ─────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-12 w-full" />
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
      {filteredNotices.filter((n) => n.is_pinned).length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
            <Pin className="w-4 h-4" /> Pinned
          </h3>
          {filteredNotices.filter((n) => n.is_pinned).map((notice) => (
            <Card key={notice.id} className="gap-4 border-amber-200 bg-amber-50/30">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
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
            <CardTitle className="text-base font-semibold">All Notices ({filteredNotices.length})</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {filteredNotices.length === 0 ? (
            <div className="text-center py-12">
              <Megaphone className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-400 text-sm">No notices found</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredNotices.map((notice) => (
                <div key={notice.id} className="p-4 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => { setSelectedNotice(notice); setViewOpen(true); }}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h4 className="font-semibold text-sm text-slate-900 truncate">{notice.title}</h4>
                      <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{notice.notice}</p>
                      {notice.timestamp && (
                        <span className="text-[10px] text-slate-400 mt-1">{format(new Date(notice.timestamp), "MMM d, yyyy")}</span>
                      )}
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

      {/* ─── View Dialog ─────────────────────────────────── */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedNotice?.title}</DialogTitle>
          </DialogHeader>
          {selectedNotice && (
            <div className="space-y-4">
              {selectedNotice.timestamp && (
                <p className="text-sm text-slate-400 flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {format(new Date(selectedNotice.timestamp), "EEEE, MMMM d, yyyy")}
                </p>
              )}
              <div className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                {selectedNotice.notice}
              </div>
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
