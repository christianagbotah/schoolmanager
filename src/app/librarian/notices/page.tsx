"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Megaphone, Plus, Search, Loader2, AlertTriangle, Trash2,
  CalendarDays, Globe, Eye, Clock, X,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
  DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { format } from "date-fns";

// ─── Types ───────────────────────────────────────────────────
interface Notice {
  id: number;
  title: string;
  notice: string;
  timestamp: string | null;
  create_timestamp: number;
  start_date: string | null;
  end_date: string | null;
  show_on_website: number;
  attachment: string;
  image: string;
}

// ─── Helpers ─────────────────────────────────────────────────
function StatSkeleton() {
  return <Card className="gap-4 py-4"><CardContent className="px-4 pb-0 pt-0"><div className="flex items-center justify-between"><div className="space-y-2 flex-1"><Skeleton className="h-4 w-24" /><Skeleton className="h-8 w-20" /></div><Skeleton className="h-10 w-10 rounded-xl" /></div></CardContent></Card>;
}

// ─── Main Component ──────────────────────────────────────────
export default function LibrarianNoticesPage() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ title: "", notice: "", start_date: "", end_date: "", show_on_website: false });
  const [creating, setCreating] = useState(false);
  const [createMessage, setCreateMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);

  const fetchNotices = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/librarian/notices");
      if (!res.ok) throw new Error("Failed");
      setNotices(await res.json());
    } catch {
      setError("Unable to load notices.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchNotices(); }, [fetchNotices]);

  const filteredNotices = notices.filter(n =>
    n.title.toLowerCase().includes(search.toLowerCase()) ||
    n.notice.toLowerCase().includes(search.toLowerCase())
  );

  const activeNotices = notices.filter(n => {
    if (!n.end_date) return true;
    return new Date(n.end_date) >= new Date();
  });

  const handleCreate = async () => {
    if (!createForm.title) return;
    setCreating(true);
    setCreateMessage(null);
    try {
      const res = await fetch("/api/librarian/notices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createForm),
      });
      const data = await res.json();
      if (res.ok) {
        setCreateMessage({ type: "success", text: "Notice published successfully" });
        setCreateForm({ title: "", notice: "", start_date: "", end_date: "", show_on_website: false });
        fetchNotices();
        setTimeout(() => setDialogOpen(false), 1500);
      } else {
        setCreateMessage({ type: "error", text: data.error });
      }
    } catch {
      setCreateMessage({ type: "error", text: "Failed to create notice" });
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: number) => {
    setDeleting(id);
    try {
      await fetch(`/api/librarian/notices?id=${id}`, { method: "DELETE" });
      fetchNotices();
      if (selectedNotice?.id === id) setSelectedNotice(null);
    } catch {
      // silently fail
    } finally {
      setDeleting(null);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-72" />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">{Array.from({ length: 3 }).map((_, i) => <StatSkeleton key={i} />)}</div>
          <Skeleton className="h-80 w-full rounded-xl" />
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center"><AlertTriangle className="w-8 h-8 text-red-600" /></div>
          <h2 className="text-xl font-semibold text-slate-900">Something went wrong</h2>
          <p className="text-slate-500">{error}</p>
          <Button onClick={fetchNotices} variant="outline"><Loader2 className="w-4 h-4 mr-2" />Try Again</Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 p-6 text-white shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                <Megaphone className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Noticeboard</h1>
                <p className="text-violet-100 text-sm">View and manage library notices</p>
              </div>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-white text-violet-700 hover:bg-violet-50 shadow-lg">
                  <Plus className="w-4 h-4 mr-2" />New Notice
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Create Notice</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-1 block">Title *</label>
                    <Input
                      placeholder="Notice title"
                      value={createForm.title}
                      onChange={(e) => setCreateForm(f => ({ ...f, title: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-1 block">Content</label>
                    <textarea
                      className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      placeholder="Notice content..."
                      value={createForm.notice}
                      onChange={(e) => setCreateForm(f => ({ ...f, notice: e.target.value }))}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-slate-500 mb-1 block">Start Date</label>
                      <Input type="date" value={createForm.start_date} onChange={(e) => setCreateForm(f => ({ ...f, start_date: e.target.value }))} />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-500 mb-1 block">End Date</label>
                      <Input type="date" value={createForm.end_date} onChange={(e) => setCreateForm(f => ({ ...f, end_date: e.target.value }))} />
                    </div>
                  </div>
                  {createMessage && (
                    <div className={`p-3 rounded-lg text-sm ${createMessage.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                      {createMessage.text}
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                  <Button onClick={handleCreate} disabled={creating || !createForm.title} className="bg-violet-600 hover:bg-violet-700">
                    {creating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Publish Notice
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Card className="gap-4 py-4 border-l-4 border-l-violet-500 hover:shadow-md transition-shadow">
            <CardContent className="px-4 pb-0 pt-0">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Total Notices</p>
                  <p className="text-xl font-bold text-violet-600">{notices.length}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center"><Megaphone className="w-5 h-5 text-violet-600" /></div>
              </div>
            </CardContent>
          </Card>
          <Card className="gap-4 py-4 border-l-4 border-l-emerald-500 hover:shadow-md transition-shadow">
            <CardContent className="px-4 pb-0 pt-0">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Active</p>
                  <p className="text-xl font-bold text-emerald-600">{activeNotices.length}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center"><Eye className="w-5 h-5 text-emerald-600" /></div>
              </div>
            </CardContent>
          </Card>
          <Card className="gap-4 py-4 border-l-4 border-l-amber-500 hover:shadow-md transition-shadow">
            <CardContent className="px-4 pb-0 pt-0">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">On Website</p>
                  <p className="text-xl font-bold text-amber-600">{notices.filter(n => n.show_on_website === 1).length}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center"><Globe className="w-5 h-5 text-amber-600" /></div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card className="gap-4">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search notices..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Notices List */}
        {selectedNotice ? (
          <Card className="gap-4">
            <CardHeader className="pb-0">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg font-semibold text-slate-900">{selectedNotice.title}</CardTitle>
                  <div className="flex items-center gap-3 mt-2">
                    {selectedNotice.timestamp && (
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <CalendarDays className="w-3 h-3" />
                        {format(new Date(selectedNotice.timestamp), "MMMM d, yyyy")}
                      </span>
                    )}
                    {selectedNotice.show_on_website === 1 && (
                      <Badge className="bg-amber-100 text-amber-700"><Globe className="w-3 h-3 mr-1" />Website</Badge>
                    )}
                    {selectedNotice.end_date && (
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Until {format(new Date(selectedNotice.end_date), "MMM d, yyyy")}
                      </span>
                    )}
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setSelectedNotice(null)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="prose prose-sm max-w-none">
                <p className="text-slate-600 whitespace-pre-wrap">{selectedNotice.notice || "No content"}</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredNotices.length === 0 ? (
              <Card className="md:col-span-2 gap-4">
                <CardContent className="py-12 text-center">
                  <Megaphone className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500">No notices found</p>
                </CardContent>
              </Card>
            ) : filteredNotices.map((n) => {
              const isActive = !n.end_date || new Date(n.end_date) >= new Date();
              return (
                <Card key={n.id} className="gap-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedNotice(n)}>
                  <CardHeader className="pb-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={`text-xs ${isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                            {isActive ? 'Active' : 'Expired'}
                          </Badge>
                          {n.show_on_website === 1 && (
                            <Badge className="bg-amber-100 text-amber-700 text-xs"><Globe className="w-3 h-3 mr-1" /></Badge>
                          )}
                        </div>
                        <CardTitle className="text-base font-semibold text-slate-900 truncate">{n.title}</CardTitle>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 flex-shrink-0"
                        onClick={(e) => { e.stopPropagation(); handleDelete(n.id); }}
                        disabled={deleting === n.id}
                      >
                        {deleting === n.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm text-slate-500 line-clamp-2 mb-2">{n.notice || "No content"}</p>
                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      {n.timestamp && <span>{format(new Date(n.timestamp), "MMM d, yyyy")}</span>}
                      {n.end_date && <span>→ {format(new Date(n.end_date), "MMM d, yyyy")}</span>}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
