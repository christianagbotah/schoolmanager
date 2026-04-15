'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  PartyPopper, Plus, Pencil, Trash2, Search, Eye, Calendar, Clock,
  LayoutDashboard, Image,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface Event {
  frontend_events_id: number;
  title: string;
  description: string;
  image: string;
  date: string | null;
  timestamp: string | null;
}

interface EventStats { total: number; upcoming: number; past: number; }

export default function EventsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [events, setEvents] = useState<Event[]>([]);
  const [stats, setStats] = useState<EventStats>({ total: 0, upcoming: 0, past: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('all');

  // Form dialog
  const [formOpen, setFormOpen] = useState(false);
  const [editEvent, setEditEvent] = useState<Event | null>(null);
  const [form, setForm] = useState({ title: '', description: '', image: '', date: '' });
  const [saving, setSaving] = useState(false);

  // View dialog
  const [viewOpen, setViewOpen] = useState(false);
  const [viewEvent, setViewEvent] = useState<Event | null>(null);

  // Delete dialog
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteEvent, setDeleteEvent] = useState<Event | null>(null);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      const res = await fetch(`/api/admin/frontend/events?${params}`);
      const data = await res.json();
      setEvents(data.events || []);
      setStats(data.stats || { total: 0, upcoming: 0, past: 0 });
    } catch { /* empty */ }
    setLoading(false);
  }, [search]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const filteredEvents = events.filter((e) => {
    if (tab === 'upcoming') return e.date && new Date(e.date) >= new Date();
    if (tab === 'past') return e.date && new Date(e.date) < new Date();
    return true;
  });

  const openCreate = () => {
    setEditEvent(null);
    setForm({ title: '', description: '', image: '', date: format(new Date(), 'yyyy-MM-dd') });
    setFormOpen(true);
  };

  const openEdit = (ev: Event) => {
    setEditEvent(ev);
    setForm({
      title: ev.title,
      description: ev.description,
      image: ev.image,
      date: ev.date ? format(new Date(ev.date), 'yyyy-MM-dd') : '',
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
      if (editEvent) {
        await fetch('/api/admin/frontend/events', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editEvent.frontend_events_id, ...form }),
        });
        toast({ title: 'Success', description: 'Event updated' });
      } else {
        await fetch('/api/admin/frontend/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
        toast({ title: 'Success', description: 'Event created' });
      }
      setFormOpen(false);
      fetchEvents();
    } catch {
      toast({ title: 'Error', variant: 'destructive' });
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deleteEvent) return;
    try {
      await fetch(`/api/admin/frontend/events?id=${deleteEvent.frontend_events_id}`, { method: 'DELETE' });
      toast({ title: 'Success', description: 'Event deleted' });
      setDeleteOpen(false);
      fetchEvents();
    } catch {
      toast({ title: 'Error', variant: 'destructive' });
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
              <PartyPopper className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Events</h1>
              <p className="text-sm text-slate-500">Manage school events and activities</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="min-h-[44px]" onClick={() => router.push('/admin/frontend')}>
              <LayoutDashboard className="w-4 h-4 mr-2" /> Dashboard
            </Button>
            <Button onClick={openCreate} className="bg-emerald-600 hover:bg-emerald-700 min-h-[44px] shadow-md">
              <Plus className="w-4 h-4 mr-2" /> Add Event
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="border-slate-200/60 hover:shadow-md transition-shadow">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center">
                <PartyPopper className="w-5 h-5 text-violet-600" />
              </div>
              <div><p className="text-xs text-slate-500">Total</p><p className="text-xl font-bold">{stats.total}</p></div>
            </CardContent>
          </Card>
          <Card className="border-slate-200/60 hover:shadow-md transition-shadow">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                <Clock className="w-5 h-5 text-emerald-600" />
              </div>
              <div><p className="text-xs text-slate-500">Upcoming</p><p className="text-xl font-bold text-emerald-600">{stats.upcoming}</p></div>
            </CardContent>
          </Card>
          <Card className="border-slate-200/60 hover:shadow-md transition-shadow">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-slate-500" />
              </div>
              <div><p className="text-xs text-slate-500">Past</p><p className="text-xl font-bold text-slate-500">{stats.past}</p></div>
            </CardContent>
          </Card>
        </div>

        {/* Search + Tabs */}
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input placeholder="Search events..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 min-h-[44px]" />
          </div>

          <Tabs value={tab} onValueChange={setTab}>
            <TabsList>
              <TabsTrigger value="all" className="gap-1">All</TabsTrigger>
              <TabsTrigger value="upcoming" className="gap-1">Upcoming</TabsTrigger>
              <TabsTrigger value="past" className="gap-1">Past</TabsTrigger>
            </TabsList>

            <TabsContent value={tab} className="mt-4">
              {loading ? (
                <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}</div>
              ) : filteredEvents.length === 0 ? (
                <Card className="py-16">
                  <CardContent className="flex flex-col items-center">
                    <PartyPopper className="w-16 h-16 text-slate-200 mb-4" />
                    <p className="text-slate-500 font-medium">No events found</p>
                    <p className="text-slate-400 text-sm mt-1">Click &quot;Add Event&quot; to create a new school event</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {/* Desktop Table */}
                  <div className="hidden md:block">
                    <Card className="border-slate-200/60 overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-slate-50">
                            <TableHead className="w-10">#</TableHead>
                            <TableHead className="w-16">Image</TableHead>
                            <TableHead>Title</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredEvents.map((ev, i) => (
                            <TableRow key={ev.frontend_events_id} className="hover:bg-slate-50">
                              <TableCell className="text-sm text-slate-500">{i + 1}</TableCell>
                              <TableCell>
                                <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden">
                                  {ev.image ? <img src={ev.image} alt={ev.title} className="w-full h-full object-cover" /> : <Image className="w-5 h-5 text-slate-300" />}
                                </div>
                              </TableCell>
                              <TableCell>
                                <p className="font-semibold text-sm">{ev.title}</p>
                                <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{ev.description}</p>
                              </TableCell>
                              <TableCell>
                                <span className="text-sm text-slate-600">{ev.date ? format(new Date(ev.date), 'dd MMM yyyy') : '—'}</span>
                              </TableCell>
                              <TableCell>
                                {ev.date && new Date(ev.date) >= new Date() ? (
                                  <Badge className="bg-emerald-100 text-emerald-700 text-[10px]">Upcoming</Badge>
                                ) : (
                                  <Badge className="bg-slate-100 text-slate-500 text-[10px]">Past</Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center justify-end gap-0.5">
                                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-blue-600" onClick={() => { setViewEvent(ev); setViewOpen(true); }}><Eye className="w-3.5 h-3.5" /></Button>
                                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-emerald-600" onClick={() => openEdit(ev)}><Pencil className="w-3.5 h-3.5" /></Button>
                                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-600" onClick={() => { setDeleteEvent(ev); setDeleteOpen(true); }}><Trash2 className="w-3.5 h-3.5" /></Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </Card>
                  </div>

                  {/* Mobile Cards */}
                  <div className="md:hidden space-y-3">
                    {filteredEvents.map((ev) => (
                      <Card key={ev.frontend_events_id} className="border-slate-200/60 hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex gap-3">
                            <div className="w-16 h-16 rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden shrink-0">
                              {ev.image ? <img src={ev.image} alt={ev.title} className="w-full h-full object-cover" /> : <Image className="w-6 h-6 text-slate-300" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <p className="font-semibold text-sm text-slate-900 truncate">{ev.title}</p>
                                <Badge className={`text-[10px] shrink-0 ${ev.date && new Date(ev.date) >= new Date() ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                  {ev.date && new Date(ev.date) >= new Date() ? 'Upcoming' : 'Past'}
                                </Badge>
                              </div>
                              <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{ev.description}</p>
                              {ev.date && (
                                <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />{format(new Date(ev.date), 'dd MMM yyyy')}
                                </p>
                              )}
                              <div className="flex gap-1 mt-2">
                                <Button size="sm" variant="ghost" className="h-7 px-2 text-blue-600" onClick={() => { setViewEvent(ev); setViewOpen(true); }}><Eye className="w-3 h-3 mr-1" />View</Button>
                                <Button size="sm" variant="ghost" className="h-7 px-2 text-emerald-600" onClick={() => openEdit(ev)}><Pencil className="w-3 h-3 mr-1" />Edit</Button>
                                <Button size="sm" variant="ghost" className="h-7 px-2 text-red-600" onClick={() => { setDeleteEvent(ev); setDeleteOpen(true); }}><Trash2 className="w-3 h-3" /></Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Form Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {editEvent ? <Pencil className="w-5 h-5 text-emerald-600" /> : <Plus className="w-5 h-5 text-emerald-600" />}
              {editEvent ? 'Edit Event' : 'Add Event'}
            </DialogTitle>
            <DialogDescription>{editEvent ? 'Update event details' : 'Create a new school event'}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label className="text-sm font-semibold">Title *</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Event title" className="min-h-[44px]" />
            </div>
            <div className="grid gap-2">
              <Label className="text-sm font-semibold">Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Event details..." rows={4} className="min-h-[100px]" />
            </div>
            <div className="grid gap-2">
              <Label className="text-sm font-semibold">Image URL</Label>
              <Input value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} placeholder="https://example.com/event-image.jpg" className="min-h-[44px]" />
              {form.image && (
                <div className="w-full h-32 rounded-lg bg-slate-100 overflow-hidden mt-1">
                  <img src={form.image} alt="Preview" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                </div>
              )}
            </div>
            <div className="grid gap-2">
              <Label className="text-sm font-semibold flex items-center gap-1"><Calendar className="w-4 h-4" /> Event Date *</Label>
              <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="min-h-[44px]" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700 min-h-[44px] px-6" disabled={!form.title.trim() || saving}>
              {saving ? 'Saving...' : editEvent ? 'Update Event' : 'Create Event'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          {viewEvent && (
            <>
              <DialogHeader>
                <DialogTitle>{viewEvent.title}</DialogTitle>
                <DialogDescription className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {viewEvent.date ? format(new Date(viewEvent.date), 'EEEE, dd MMMM yyyy') : 'No date set'}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                {viewEvent.image && (
                  <div className="w-full h-48 rounded-lg bg-slate-100 overflow-hidden">
                    <img src={viewEvent.image} alt={viewEvent.title} className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="prose prose-sm max-w-none">
                  <p className="text-slate-700 whitespace-pre-wrap">{viewEvent.description || 'No description'}</p>
                </div>
                {viewEvent.timestamp && (
                  <p className="text-[10px] text-slate-400">Created: {format(new Date(viewEvent.timestamp), 'dd MMM yyyy, HH:mm')}</p>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Event</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to delete <strong className="text-slate-900">{deleteEvent?.title}</strong>? This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
