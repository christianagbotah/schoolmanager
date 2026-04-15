"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Megaphone, Pin, Search, Calendar, Loader2, AlertTriangle, Eye,
  Clock, FileText, Paperclip,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useAuth } from "@/hooks/use-auth";
import { format } from "date-fns";

// ─── Types ───────────────────────────────────────────────────
interface Notice {
  id: number;
  title: string;
  notice: string;
  is_pinned: number;
  timestamp: number | null;
  create_timestamp: number;
  start_date?: string;
  end_date?: string;
  attachment?: string;
  image?: string;
}

// ─── Main Component ──────────────────────────────────────────
export default function TeacherNoticesPage() {
  const { isLoading: authLoading } = useAuth();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);

  const fetchNotices = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/teacher/notices");
      if (res.ok) {
        const data = await res.json();
        setNotices(Array.isArray(data) ? data : []);
      }
    } catch {
      setError("Failed to load notices");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading) fetchNotices();
  }, [authLoading, fetchNotices]);

  const pinnedNotices = notices.filter(n => n.is_pinned);
  const filteredNotices = notices
    .filter((n) => {
      const q = search.toLowerCase();
      return n.title?.toLowerCase().includes(q) || n.notice?.toLowerCase().includes(q);
    })
    .sort((a, b) => {
      if (a.is_pinned && !b.is_pinned) return -1;
      if (!a.is_pinned && b.is_pinned) return 1;
      return new Date(b.timestamp || b.create_timestamp || 0).getTime() - new Date(a.timestamp || a.create_timestamp || 0).getTime();
    });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-12 w-full" />
          <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Noticeboard</h1>
          <p className="text-sm text-slate-500 mt-1">School announcements and notices</p>
        </div>

        {/* ─── Search ─────────────────────────────────────── */}
        <Card className="gap-4">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input placeholder="Search notices..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
          </CardContent>
        </Card>

        {error && (
          <div className="flex items-center gap-3 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />{error}
          </div>
        )}

        {/* ─── Pinned Notices ──────────────────────────────── */}
        {pinnedNotices.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
              <Pin className="w-4 h-4" />Pinned ({pinnedNotices.length})
            </h3>
            {pinnedNotices.map((notice) => (
              <Card key={notice.id} className="gap-4 border-amber-200 bg-amber-50/30">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Pin className="w-4 h-4 text-amber-500 flex-shrink-0" />
                        <h4 className="font-semibold text-slate-900 truncate">{notice.title}</h4>
                      </div>
                      <p className="text-sm text-slate-500 mt-1 line-clamp-2">{notice.notice}</p>
                      {notice.create_timestamp && (
                        <span className="text-xs text-slate-400 mt-2 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(notice.create_timestamp * 1000), "MMM d, yyyy")}
                        </span>
                      )}
                      {(notice.attachment || notice.image) && (
                        <span className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                          <Paperclip className="w-3 h-3" />
                          {notice.attachment || notice.image}
                        </span>
                      )}
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setSelectedNotice(notice)} className="min-w-[44px] min-h-[44px]">
                      <Eye className="w-4 h-4" />
                    </Button>
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
                  <div
                    key={notice.id}
                    className="p-4 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer"
                    onClick={() => setSelectedNotice(notice)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          {notice.is_pinned && <Pin className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />}
                          <h4 className="font-semibold text-sm text-slate-900 truncate">{notice.title}</h4>
                        </div>
                        <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{notice.notice}</p>
                        {notice.create_timestamp && (
                          <span className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {format(new Date(notice.create_timestamp * 1000), "MMM d, yyyy")}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ─── Notice Detail ───────────────────────────────── */}
        <Dialog open={!!selectedNotice} onOpenChange={(open) => !open && setSelectedNotice(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {selectedNotice?.is_pinned && <Pin className="w-4 h-4 text-amber-500" />}
                {selectedNotice?.title}
              </DialogTitle>
            </DialogHeader>
            {selectedNotice && (
              <div className="space-y-4">
                {selectedNotice.create_timestamp && (
                  <p className="text-sm text-slate-400 flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {format(new Date(selectedNotice.create_timestamp * 1000), "EEEE, MMMM d, yyyy")}
                  </p>
                )}
                {selectedNotice.start_date && (
                  <p className="text-xs text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Valid: {format(new Date(selectedNotice.start_date), "MMM d")} — {selectedNotice.end_date ? format(new Date(selectedNotice.end_date), "MMM d, yyyy") : "Ongoing"}
                  </p>
                )}
                <div className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed bg-slate-50 rounded-lg p-4">
                  {selectedNotice.notice}
                </div>
                {(selectedNotice.attachment || selectedNotice.image) && (
                  <div className="flex items-center gap-2 text-xs text-slate-400 border-t pt-3">
                    <Paperclip className="w-4 h-4" />
                    <span>Attachment: {selectedNotice.attachment || selectedNotice.image}</span>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
