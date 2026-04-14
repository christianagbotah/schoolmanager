"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Globe, Plus, Pencil, Trash2, Calendar, Image, Newspaper, PartyPopper, Eye,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface Event { frontend_events_id: number; title: string; description: string; date: string | null; timestamp: string | null; }
interface News { frontend_news_id: number; title: string; description: string; date: string | null; timestamp: string | null; }
interface Gallery {
  frontend_gallery_id: number; title: string; description: string; date: string | null; timestamp: string | null;
  images: { frontend_gallery_image_id: number; image_name: string; caption: string; date: string | null }[];
}

export default function FrontendCMSPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [events, setEvents] = useState<Event[]>([]);
  const [news, setNews] = useState<News[]>([]);
  const [galleries, setGalleries] = useState<Gallery[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("events");

  // Dialog states
  const [eventFormOpen, setEventFormOpen] = useState(false);
  const [newsFormOpen, setNewsFormOpen] = useState(false);
  const [galleryFormOpen, setGalleryFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [viewContent, setViewContent] = useState<string>("");
  const [viewTitle, setViewTitle] = useState("");
  const [deleteType, setDeleteType] = useState("event");
  const [deleteId, setDeleteId] = useState<number>(0);

  const [eventForm, setEventForm] = useState({ title: "", description: "", date: "" });
  const [newsForm, setNewsForm] = useState({ title: "", description: "", date: "" });
  const [galleryForm, setGalleryForm] = useState({ title: "", description: "", date: "" });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [evRes, newsRes, galRes] = await Promise.all([
        fetch("/api/frontend/events/route"),
        fetch("/api/frontend/news/route"),
        fetch("/api/frontend/gallery/route"),
      ]);
      setEvents(await evRes.json());
      setNews(await newsRes.json());
      setGalleries(await galRes.json());
    } catch { /* empty */ }
    setLoading(false);
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchData(); }, [fetchData]);

  const saveEvent = async () => {
    const isNew = !eventForm.title.startsWith("_edit_");
    const id = eventForm.title.startsWith("_edit_") ? parseInt(eventForm.title.replace("_edit_", "")) : null;
    const url = id ? `/api/frontend/events/route?id=${id}` : "/api/frontend/events/route";
    const method = id ? "PUT" : "POST";
    await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: eventForm.title, description: eventForm.description, date: eventForm.date }) });
    toast({ title: "Success" }); setEventFormOpen(false); fetchData();
  };

  const saveNews = async () => {
    const isNew = !newsForm.title.startsWith("_edit_");
    const id = newsForm.title.startsWith("_edit_") ? parseInt(newsForm.title.replace("_edit_", "")) : null;
    const url = id ? `/api/frontend/news/route?id=${id}` : "/api/frontend/news/route";
    const method = id ? "PUT" : "POST";
    await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: newsForm.title, description: newsForm.description, date: newsForm.date }) });
    toast({ title: "Success" }); setNewsFormOpen(false); fetchData();
  };

  const saveGallery = async () => {
    const isNew = !galleryForm.title.startsWith("_edit_");
    const id = galleryForm.title.startsWith("_edit_") ? parseInt(galleryForm.title.replace("_edit_", "")) : null;
    const url = id ? `/api/frontend/gallery/route?id=${id}` : "/api/frontend/gallery/route";
    const method = id ? "PUT" : "POST";
    await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: galleryForm.title, description: galleryForm.description, date: galleryForm.date }) });
    toast({ title: "Success" }); setGalleryFormOpen(false); fetchData();
  };

  const handleDelete = async () => {
    const url = deleteType === "event" ? `/api/frontend/events/route?id=${deleteId}` : deleteType === "news" ? `/api/frontend/news/route?id=${deleteId}` : `/api/frontend/gallery/route?id=${deleteId}`;
    await fetch(url, { method: "DELETE" });
    toast({ title: "Success" }); setDeleteOpen(false); fetchData();
  };

  const openCreate = (type: string) => {
    if (type === "event") { setEventForm({ title: "", description: "", date: new Date().toISOString().split("T")[0] }); setEventFormOpen(true); }
    if (type === "news") { setNewsForm({ title: "", description: "", date: new Date().toISOString().split("T")[0] }); setNewsFormOpen(true); }
    if (type === "gallery") { setGalleryForm({ title: "", description: "", date: new Date().toISOString().split("T")[0] }); setGalleryFormOpen(true); }
  };

  const openEdit = (type: string, item: any) => {
    if (type === "event") { setEventForm({ title: item.title, description: item.description, date: item.date ? item.date.split("T")[0] : "" }); setEventFormOpen(true); }
    if (type === "news") { setNewsForm({ title: item.title, description: item.description, date: item.date ? item.date.split("T")[0] : "" }); setNewsFormOpen(true); }
    if (type === "gallery") { setGalleryForm({ title: item.title, description: item.description, date: item.date ? item.date.split("T")[0] : "" }); setGalleryFormOpen(true); }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="bg-emerald-700 text-white shadow-lg sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center"><Globe className="w-6 h-6" /></div>
              <div><h1 className="text-lg font-bold">Frontend CMS</h1><p className="text-emerald-200 text-xs hidden sm:block">Website Content Management</p></div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/10" onClick={() => router.push("/admin/settings")}>Settings</Button>
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/10" onClick={() => router.push("/")}>Dashboard</Button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-6 bg-white border border-slate-200 p-1 rounded-xl h-auto flex flex-wrap w-full sm:w-auto">
            <TabsTrigger value="events" className="flex-1 min-w-[80px] data-[state=active]:bg-emerald-600 data-[state=active]:text-white rounded-lg py-2 text-sm"><PartyPopper className="w-4 h-4 mr-1 hidden sm:inline" /> Events</TabsTrigger>
            <TabsTrigger value="news" className="flex-1 min-w-[80px] data-[state=active]:bg-emerald-600 data-[state=active]:text-white rounded-lg py-2 text-sm"><Newspaper className="w-4 h-4 mr-1 hidden sm:inline" /> News</TabsTrigger>
            <TabsTrigger value="gallery" className="flex-1 min-w-[80px] data-[state=active]:bg-emerald-600 data-[state=active]:text-white rounded-lg py-2 text-sm"><Image className="w-4 h-4 mr-1 hidden sm:inline" /> Gallery</TabsTrigger>
          </TabsList>

          <TabsContent value="events">
            <div className="flex justify-end mb-4"><Button onClick={() => openCreate("event")} className="bg-emerald-600 hover:bg-emerald-700 min-h-[44px]"><Plus className="w-4 h-4 mr-2" /> Add Event</Button></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {loading ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />) :
                events.map(ev => (
                  <Card key={ev.frontend_events_id} className="border-slate-200/60 hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2"><PartyPopper className="w-5 h-5 text-emerald-600" /><h3 className="font-semibold text-sm">{ev.title}</h3></div>
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" className="h-7" onClick={() => { setViewTitle(ev.title); setViewContent(ev.description); setViewOpen(true); }}><Eye className="w-3 h-3" /></Button>
                          <Button size="sm" variant="ghost" className="h-7" onClick={() => openEdit("event", ev)}><Pencil className="w-3 h-3" /></Button>
                          <Button size="sm" variant="ghost" className="h-7 text-red-600" onClick={() => { setDeleteType("event"); setDeleteId(ev.frontend_events_id); setDeleteOpen(true); }}><Trash2 className="w-3 h-3" /></Button>
                        </div>
                      </div>
                      <p className="text-xs text-slate-500 line-clamp-2">{ev.description}</p>
                      {ev.date && <p className="text-xs text-slate-400 mt-2 flex items-center gap-1"><Calendar className="w-3 h-3" />{format(new Date(ev.date), "MMM d, yyyy")}</p>}
                    </CardContent>
                  </Card>
                ))}
            </div>
          </TabsContent>

          <TabsContent value="news">
            <div className="flex justify-end mb-4"><Button onClick={() => openCreate("news")} className="bg-emerald-600 hover:bg-emerald-700 min-h-[44px]"><Plus className="w-4 h-4 mr-2" /> Add News</Button></div>
            <Card className="border-slate-200/60"><CardContent className="p-0">
              <div className="max-h-[500px] overflow-y-auto">
                <Table>
                  <TableHeader><TableRow className="bg-slate-50"><TableHead>Title</TableHead><TableHead className="hidden sm:table-cell">Date</TableHead><TableHead></TableHead></TableRow></TableHeader>
                  <TableBody>
                    {news.length === 0 ? <TableRow><TableCell colSpan={3} className="text-center text-slate-400 py-8">No news articles</TableCell></TableRow> :
                      news.map(n => (
                        <TableRow key={n.frontend_news_id}>
                          <TableCell className="font-medium text-sm">{n.title}</TableCell>
                          <TableCell className="hidden sm:table-cell text-xs text-slate-500">{n.date ? format(new Date(n.date), "MMM d, yyyy") : "—"}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button size="sm" variant="ghost" className="h-7" onClick={() => { setViewTitle(n.title); setViewContent(n.description); setViewOpen(true); }}><Eye className="w-3 h-3" /></Button>
                              <Button size="sm" variant="ghost" className="h-7" onClick={() => openEdit("news", n)}><Pencil className="w-3 h-3" /></Button>
                              <Button size="sm" variant="ghost" className="h-7 text-red-600" onClick={() => { setDeleteType("news"); setDeleteId(n.frontend_news_id); setDeleteOpen(true); }}><Trash2 className="w-3 h-3" /></Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent></Card>
          </TabsContent>

          <TabsContent value="gallery">
            <div className="flex justify-end mb-4"><Button onClick={() => openCreate("gallery")} className="bg-emerald-600 hover:bg-emerald-700 min-h-[44px]"><Plus className="w-4 h-4 mr-2" /> Add Gallery</Button></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {galleries.map(gal => (
                <Card key={gal.frontend_gallery_id} className="border-slate-200/60 hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2"><Image className="w-5 h-5 text-emerald-600" /><h3 className="font-semibold text-sm">{gal.title}</h3></div>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" className="h-7" onClick={() => openEdit("gallery", gal)}><Pencil className="w-3 h-3" /></Button>
                        <Button size="sm" variant="ghost" className="h-7 text-red-600" onClick={() => { setDeleteType("gallery"); setDeleteId(gal.frontend_gallery_id); setDeleteOpen(true); }}><Trash2 className="w-3 h-3" /></Button>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 mb-2">{gal.description}</p>
                    <Badge variant="secondary" className="text-xs">{gal.images?.length || 0} images</Badge>
                    {gal.date && <p className="text-xs text-slate-400 mt-2">{format(new Date(gal.date), "MMM d, yyyy")}</p>}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Event Form */}
      <Dialog open={eventFormOpen} onOpenChange={setEventFormOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Add Event</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2"><Label>Title *</Label><Input value={eventForm.title} onChange={e => setEventForm({ ...eventForm, title: e.target.value })} /></div>
            <div className="grid gap-2"><Label>Description</Label><Textarea value={eventForm.description} onChange={e => setEventForm({ ...eventForm, description: e.target.value })} rows={4} /></div>
            <div className="grid gap-2"><Label>Date</Label><Input type="date" value={eventForm.date} onChange={e => setEventForm({ ...eventForm, date: e.target.value })} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setEventFormOpen(false)}>Cancel</Button><Button onClick={saveEvent} className="bg-emerald-600 hover:bg-emerald-700" disabled={!eventForm.title.trim()}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* News Form */}
      <Dialog open={newsFormOpen} onOpenChange={setNewsFormOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Add News</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2"><Label>Title *</Label><Input value={newsForm.title} onChange={e => setNewsForm({ ...newsForm, title: e.target.value })} /></div>
            <div className="grid gap-2"><Label>Content</Label><Textarea value={newsForm.description} onChange={e => setNewsForm({ ...newsForm, description: e.target.value })} rows={6} /></div>
            <div className="grid gap-2"><Label>Date</Label><Input type="date" value={newsForm.date} onChange={e => setNewsForm({ ...newsForm, date: e.target.value })} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setNewsFormOpen(false)}>Cancel</Button><Button onClick={saveNews} className="bg-emerald-600 hover:bg-emerald-700" disabled={!newsForm.title.trim()}>Publish</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Gallery Form */}
      <Dialog open={galleryFormOpen} onOpenChange={setGalleryFormOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Add Gallery</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2"><Label>Title *</Label><Input value={galleryForm.title} onChange={e => setGalleryForm({ ...galleryForm, title: e.target.value })} /></div>
            <div className="grid gap-2"><Label>Description</Label><Textarea value={galleryForm.description} onChange={e => setGalleryForm({ ...galleryForm, description: e.target.value })} rows={2} /></div>
            <div className="grid gap-2"><Label>Date</Label><Input type="date" value={galleryForm.date} onChange={e => setGalleryForm({ ...galleryForm, date: e.target.value })} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setGalleryFormOpen(false)}>Cancel</Button><Button onClick={saveGallery} className="bg-emerald-600 hover:bg-emerald-700" disabled={!galleryForm.title.trim()}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{viewTitle}</DialogTitle></DialogHeader>
          <div className="prose prose-sm max-w-none"><p className="text-slate-700 whitespace-pre-wrap">{viewContent || "No content"}</p></div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete</AlertDialogTitle><AlertDialogDescription>Are you sure?</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>

      <footer className="bg-white border-t border-slate-200 py-4 mt-auto"><div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center"><p className="text-xs text-slate-400">&copy; {new Date().getFullYear()} School Manager</p></div></footer>
    </div>
  );
}
