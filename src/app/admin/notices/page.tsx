"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Megaphone, Plus, Search, Pencil, Trash2, Eye, Calendar, Globe, Lock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
import { format } from "date-fns";

interface Notice {
  id: number; title: string; notice: string; timestamp: string | null;
}

export default function NoticesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);
  const [showOnWebsite, setShowOnWebsite] = useState(true);

  const [form, setForm] = useState({ title: "", notice: "" });

  const fetchNotices = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      const res = await fetch(`/api/notices/route?${params}`);
      setNotices(await res.json());
    } catch { /* empty */ }
    setLoading(false);
  }, [search]);

  useEffect(() => { fetchNotices(); }, [fetchNotices]);

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
      const url = selectedNotice ? `/api/notices/route?id=${selectedNotice.id}` : "/api/notices/route";
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
      toast({ title: "Error", variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!selectedNotice) return;
    await fetch(`/api/notices/route?id=${selectedNotice.id}`, { method: "DELETE" });
    toast({ title: "Success", description: "Notice deleted" });
    setDeleteOpen(false);
    fetchNotices();
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="bg-emerald-700 text-white shadow-lg sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center"><Megaphone className="w-6 h-6" /></div>
              <div><h1 className="text-lg font-bold">Noticeboard</h1><p className="text-emerald-200 text-xs hidden sm:block">Announcements</p></div>
            </div>
            <Button variant="ghost" size="sm" className="text-white hover:bg-white/10" onClick={() => router.push("/")}>Dashboard</Button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input placeholder="Search notices..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 min-h-[44px]" />
          </div>
          <Button onClick={openCreate} className="bg-emerald-600 hover:bg-emerald-700 min-h-[44px]"><Plus className="w-4 h-4 mr-2" /> Add Notice</Button>
        </div>

        {loading ? (
          <div className="space-y-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}</div>
        ) : notices.length === 0 ? (
          <Card className="py-12"><CardContent className="flex flex-col items-center"><Megaphone className="w-12 h-12 text-slate-300 mb-3" /><p className="text-slate-500">No notices yet</p></CardContent></Card>
        ) : (
          <div className="space-y-4">
            {notices.map(notice => (
              <Card key={notice.id} className="border-slate-200/60 hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-slate-900">{notice.title}</h3>
                        <Badge className="bg-emerald-100 text-emerald-700 text-xs flex-shrink-0"><Globe className="w-3 h-3 mr-1" />Public</Badge>
                      </div>
                      <p className="text-sm text-slate-600 line-clamp-2">{notice.notice}</p>
                    </div>
                    <div className="flex items-center gap-1 ml-3 flex-shrink-0">
                      <Button size="sm" variant="ghost" className="h-7" onClick={() => { setSelectedNotice(notice); setViewOpen(true); }}><Eye className="w-3 h-3" /></Button>
                      <Button size="sm" variant="ghost" className="h-7" onClick={() => openEdit(notice)}><Pencil className="w-3 h-3" /></Button>
                      <Button size="sm" variant="ghost" className="h-7 text-red-600" onClick={() => { setSelectedNotice(notice); setDeleteOpen(true); }}><Trash2 className="w-3 h-3" /></Button>
                    </div>
                  </div>
                  {notice.timestamp && (
                    <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(notice.timestamp), "MMM d, yyyy 'at' HH:mm")}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{selectedNotice ? "Edit Notice" : "Add Notice"}</DialogTitle><DialogDescription>Create or update a notice</DialogDescription></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2"><Label>Title *</Label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Notice title" /></div>
            <div className="grid gap-2"><Label>Content</Label><Textarea value={form.notice} onChange={e => setForm({ ...form, notice: e.target.value })} placeholder="Write your notice here..." rows={6} /></div>
            <div className="flex items-center gap-2">
              <Switch checked={showOnWebsite} onCheckedChange={setShowOnWebsite} />
              <Label className="text-sm">Show on website</Label>
              {showOnWebsite ? <Globe className="w-4 h-4 text-emerald-600" /> : <Lock className="w-4 h-4 text-slate-400" />}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700" disabled={!form.title.trim()}>{selectedNotice ? "Update" : "Publish"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          {selectedNotice && (
            <>
              <DialogHeader><DialogTitle>{selectedNotice.title}</DialogTitle></DialogHeader>
              <div className="prose prose-sm max-w-none">
                <p className="text-slate-700 whitespace-pre-wrap">{selectedNotice.notice}</p>
                {selectedNotice.timestamp && <p className="text-xs text-slate-400 mt-4">{format(new Date(selectedNotice.timestamp), "MMMM d, yyyy 'at' HH:mm")}</p>}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete Notice</AlertDialogTitle><AlertDialogDescription>Delete <strong>{selectedNotice?.title}</strong>?</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>

      <footer className="bg-white border-t border-slate-200 py-4 mt-auto"><div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center"><p className="text-xs text-slate-400">&copy; {new Date().getFullYear()} School Manager</p></div></footer>
    </div>
  );
}
