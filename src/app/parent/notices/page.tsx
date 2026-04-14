"use client";

import { useEffect, useState, useCallback } from "react";
import { Megaphone, Search, Calendar, Pin, Eye, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useAuth } from "@/hooks/use-auth";
import { format } from "date-fns";

interface Notice { id: number; title: string; notice: string; is_pinned: number; timestamp: string | null; created_at: string; }

export default function ParentNoticesPage() {
  const { isLoading: authLoading } = useAuth();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);

  const fetchNotices = useCallback(async () => {
    setIsLoading(true);
    try { const res = await fetch("/api/notices?limit=100"); if (res.ok) { const d = await res.json(); setNotices(Array.isArray(d) ? d : []); } } catch { /* silent */ }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => { if (!authLoading) fetchNotices(); }, [authLoading, fetchNotices]);

  const filtered = notices.filter((n) => { const q = search.toLowerCase(); return n.title?.toLowerCase().includes(q) || n.notice?.toLowerCase().includes(q); })
    .sort((a, b) => { if (a.is_pinned && !b.is_pinned) return -1; if (!a.is_pinned && b.is_pinned) return 1; return new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime(); });

  if (isLoading) return <DashboardLayout><div className="space-y-6"><Skeleton className="h-8 w-48" /><Skeleton className="h-12 w-full" /><div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}</div></div></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div><h1 className="text-2xl font-bold text-slate-900 tracking-tight">Noticeboard</h1><p className="text-sm text-slate-500 mt-1">School announcements</p></div>
        <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><Input placeholder="Search notices..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" /></div>

        {filtered.filter((n) => n.is_pinned).length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2"><Pin className="w-4 h-4" />Pinned</h3>
            {filtered.filter((n) => n.is_pinned).map((n) => (
              <Card key={n.id} className="gap-4 border-purple-200 bg-purple-50/30"><CardContent className="p-4">
                <div className="flex items-start justify-between gap-3"><div className="min-w-0"><div className="flex items-center gap-2"><Pin className="w-4 h-4 text-purple-500" /><h4 className="font-semibold text-slate-900">{n.title}</h4></div><p className="text-sm text-slate-500 mt-1 line-clamp-2">{n.notice}</p>{n.timestamp && <span className="text-xs text-slate-400 mt-2 flex items-center gap-1"><Calendar className="w-3 h-3" />{format(new Date(n.timestamp), "MMM d, yyyy")}</span>}</div><Button variant="ghost" size="sm" onClick={() => setSelectedNotice(n)} className="min-w-[44px] min-h-[44px]"><Eye className="w-4 h-4" /></Button></div>
              </CardContent></Card>
            ))}
          </div>
        )}

        <Card className="gap-4"><CardHeader><div className="flex items-center gap-2"><div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center"><Megaphone className="w-4 h-4 text-purple-600" /></div><CardTitle className="text-base font-semibold">All Notices ({filtered.length})</CardTitle></div></CardHeader>
          <CardContent className="pt-0">
            {filtered.length === 0 ? <div className="text-center py-12"><Megaphone className="w-12 h-12 text-slate-300 mx-auto mb-3" /><p className="text-slate-400 text-sm">No notices found</p></div> : (
              <div className="space-y-3 max-h-96 overflow-y-auto">{filtered.map((n) => (
                <div key={n.id} className="p-4 rounded-lg border border-slate-100 hover:bg-slate-50 cursor-pointer" onClick={() => setSelectedNotice(n)}>
                  <div className="flex items-start justify-between gap-3"><div className="min-w-0"><h4 className="font-semibold text-sm text-slate-900">{n.title}</h4><p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{n.notice}</p>{n.timestamp && <span className="text-[10px] text-slate-400 mt-1">{format(new Date(n.timestamp), "MMM d, yyyy")}</span>}</div>{n.is_pinned && <Pin className="w-3.5 h-3.5 text-purple-500" />}</div>
                </div>
              ))}</div>
            )}
          </CardContent></Card>

        <Dialog open={!!selectedNotice} onOpenChange={(o) => !o && setSelectedNotice(null)}><DialogContent className="max-w-lg"><DialogHeader><DialogTitle>{selectedNotice?.title}</DialogTitle></DialogHeader>
          {selectedNotice && <div className="space-y-4">{selectedNotice.timestamp && <p className="text-sm text-slate-400 flex items-center gap-1"><Calendar className="w-4 h-4" />{format(new Date(selectedNotice.timestamp), "EEEE, MMMM d, yyyy")}</p>}<div className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{selectedNotice.notice}</div></div>}
        </DialogContent></Dialog>
      </div>
    </DashboardLayout>
  );
}
