"use client";

import { useEffect, useState, useCallback } from "react";
import { Megaphone, Search, Calendar, Pin, Eye, Loader2, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useAuth } from "@/hooks/use-auth";
import { format } from "date-fns";

interface Notice {
  id: number; title: string; notice: string; timestamp: string | null;
  start_date: string | null; end_date: string | null; image: string;
  attachment: string; check_sms: number; sms_target: number; status: number;
}

export default function ParentNoticesPage() {
  const { isLoading: authLoading, isParent } = useAuth();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);

  const fetchNotices = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/parent/notices?limit=100");
      if (res.ok) { const d = await res.json(); setNotices(d.notices || []); setTotal(d.total || 0); }
    } catch { /* silent */ }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => { if (!authLoading && isParent) fetchNotices(); }, [authLoading, isParent, fetchNotices]);

  const filtered = notices.filter((n) => {
    const q = search.toLowerCase();
    return n.title?.toLowerCase().includes(q) || n.notice?.toLowerCase().includes(q);
  });

  if (isLoading) return <DashboardLayout><div className="space-y-6"><Skeleton className="h-8 w-48" /><Skeleton className="h-12 w-full" /><div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}</div></div></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div><h1 className="text-2xl font-bold text-slate-900 tracking-tight">Noticeboard</h1><p className="text-sm text-slate-500 mt-1">School announcements and updates</p></div>
          <Badge variant="outline" className="text-sm">{filtered.length} notices</Badge>
        </div>

        <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><Input placeholder="Search notices..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" /></div>

        <Card className="gap-4">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center"><Megaphone className="w-4 h-4 text-amber-600" /></div>
              <CardTitle className="text-base font-semibold">All Notices ({filtered.length})</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {filtered.length === 0 ? (
              <div className="text-center py-12"><Megaphone className="w-12 h-12 text-slate-300 mx-auto mb-3" /><p className="text-slate-400 text-sm">No notices found</p></div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {filtered.map((n) => (
                  <div key={n.id} className="p-4 rounded-lg border border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors" onClick={() => setSelectedNotice(n)}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-semibold text-sm text-slate-900">{n.title}</h4>
                          {n.check_sms === 1 && <Badge className="bg-sky-100 text-sky-700 text-[10px]">SMS</Badge>}
                          {n.attachment && <Badge className="bg-orange-100 text-orange-700 text-[10px]">📎 File</Badge>}
                        </div>
                        <p className="text-xs text-slate-500 line-clamp-2 mt-1">{n.notice}</p>
                        {n.timestamp && <span className="text-[10px] text-slate-400 mt-1 flex items-center gap-1"><Calendar className="w-3 h-3" />{format(new Date(n.timestamp), "MMM d, yyyy")}</span>}
                      </div>
                      <Button variant="ghost" size="sm" className="min-w-[44px] min-h-[44px] flex-shrink-0"><Eye className="w-4 h-4" /></Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={!!selectedNotice} onOpenChange={(o) => !o && setSelectedNotice(null)}>
          <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
            <DialogHeader><DialogTitle className="text-lg">{selectedNotice?.title}</DialogTitle></DialogHeader>
            {selectedNotice && (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {selectedNotice.timestamp && <Badge variant="outline" className="text-xs"><Calendar className="w-3 h-3 mr-1" />{format(new Date(selectedNotice.timestamp), "EEEE, MMMM d, yyyy")}</Badge>}
                  {selectedNotice.check_sms === 1 && <Badge className="bg-sky-100 text-sky-700 text-xs">SMS Alert Sent</Badge>}
                  {selectedNotice.attachment && <Badge className="bg-orange-100 text-orange-700 text-xs">📎 Attachment</Badge>}
                </div>
                <div className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed bg-slate-50 p-4 rounded-lg">{selectedNotice.notice}</div>
                {selectedNotice.start_date && <p className="text-xs text-slate-400">Visible from: {format(new Date(selectedNotice.start_date), "MMM d, yyyy")}</p>}
                {selectedNotice.end_date && <p className="text-xs text-slate-400">Visible until: {format(new Date(selectedNotice.end_date), "MMM d, yyyy")}</p>}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
