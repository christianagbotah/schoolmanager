'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
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
  Image, Plus, Pencil, Trash2, Search, Eye, ArrowUpDown, GripVertical, LayoutDashboard,
  Globe, Lock,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface Slide {
  frontend_slider_id: number;
  title: string;
  subtitle: string;
  image: string;
  button_text: string;
  button_url: string;
  sort_order: number;
  status: number;
  timestamp: string | null;
}

interface SlideStats { total: number; active: number; inactive: number; }

export default function SliderPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [slides, setSlides] = useState<Slide[]>([]);
  const [stats, setStats] = useState<SlideStats>({ total: 0, active: 0, inactive: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Form dialog
  const [formOpen, setFormOpen] = useState(false);
  const [editSlide, setEditSlide] = useState<Slide | null>(null);
  const [form, setForm] = useState({
    title: '', subtitle: '', image: '', button_text: '', button_url: '',
    sort_order: 0, status: true,
  });
  const [saving, setSaving] = useState(false);

  // Preview dialog
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewSlide, setPreviewSlide] = useState<Slide | null>(null);

  // Delete dialog
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteSlide, setDeleteSlide] = useState<Slide | null>(null);

  const fetchSlides = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      const res = await fetch(`/api/admin/frontend/slider?${params}`);
      const data = await res.json();
      setSlides(data.slides || []);
      setStats(data.stats || { total: 0, active: 0, inactive: 0 });
    } catch { /* empty */ }
    setLoading(false);
  }, [search]);

  useEffect(() => { fetchSlides(); }, [fetchSlides]);

  const openCreate = () => {
    setEditSlide(null);
    setForm({ title: '', subtitle: '', image: '', button_text: '', button_url: '', sort_order: 0, status: true });
    setFormOpen(true);
  };

  const openEdit = (slide: Slide) => {
    setEditSlide(slide);
    setForm({
      title: slide.title,
      subtitle: slide.subtitle,
      image: slide.image,
      button_text: slide.button_text,
      button_url: slide.button_url,
      sort_order: slide.sort_order,
      status: slide.status === 1,
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
      if (editSlide) {
        await fetch('/api/admin/frontend/slider', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editSlide.frontend_slider_id, ...form }),
        });
        toast({ title: 'Success', description: 'Slide updated successfully' });
      } else {
        await fetch('/api/admin/frontend/slider', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
        toast({ title: 'Success', description: 'Slide created successfully' });
      }
      setFormOpen(false);
      fetchSlides();
    } catch {
      toast({ title: 'Error', variant: 'destructive' });
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deleteSlide) return;
    try {
      await fetch(`/api/admin/frontend/slider?id=${deleteSlide.frontend_slider_id}`, { method: 'DELETE' });
      toast({ title: 'Success', description: 'Slide deleted' });
      setDeleteOpen(false);
      fetchSlides();
    } catch {
      toast({ title: 'Error', variant: 'destructive' });
    }
  };

  const toggleStatus = async (slide: Slide) => {
    try {
      await fetch('/api/admin/frontend/slider', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: slide.frontend_slider_id, status: slide.status === 1 ? 0 : 1 }),
      });
      toast({ title: 'Success', description: `Slide ${slide.status === 1 ? 'deactivated' : 'activated'}` });
      fetchSlides();
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
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg">
              <Image className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Hero Slider</h1>
              <p className="text-sm text-slate-500">Manage homepage hero banner slides</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="min-h-[44px]" onClick={() => router.push('/admin/frontend')}>
              <LayoutDashboard className="w-4 h-4 mr-2" /> Dashboard
            </Button>
            <Button onClick={openCreate} className="bg-violet-600 hover:bg-violet-700 min-h-[44px] shadow-md">
              <Plus className="w-4 h-4 mr-2" /> Add Slide
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="border-slate-200/60 hover:shadow-md transition-shadow">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center">
                <Image className="w-5 h-5 text-violet-600" />
              </div>
              <div><p className="text-xs text-slate-500">Total</p><p className="text-xl font-bold">{stats.total}</p></div>
            </CardContent>
          </Card>
          <Card className="border-slate-200/60 hover:shadow-md transition-shadow">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                <Globe className="w-5 h-5 text-emerald-600" />
              </div>
              <div><p className="text-xs text-slate-500">Active</p><p className="text-xl font-bold text-emerald-600">{stats.active}</p></div>
            </CardContent>
          </Card>
          <Card className="border-slate-200/60 hover:shadow-md transition-shadow">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                <Lock className="w-5 h-5 text-slate-500" />
              </div>
              <div><p className="text-xs text-slate-500">Inactive</p><p className="text-xl font-bold text-slate-500">{stats.inactive}</p></div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input placeholder="Search slides..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 min-h-[44px]" />
        </div>

        {/* Slide List */}
        {loading ? (
          <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}</div>
        ) : slides.length === 0 ? (
          <Card className="py-16">
            <CardContent className="flex flex-col items-center">
              <Image className="w-16 h-16 text-slate-200 mb-4" />
              <p className="text-slate-500 font-medium">No slides found</p>
              <p className="text-slate-400 text-sm mt-1">Click &quot;Add Slide&quot; to create your first hero slide</p>
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
                      <TableHead className="w-12"><ArrowUpDown className="w-4 h-4" /></TableHead>
                      <TableHead>Preview</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead className="hidden lg:table-cell">Button</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {slides.map((slide, i) => (
                      <TableRow key={slide.frontend_slider_id} className="hover:bg-slate-50 transition-colors">
                        <TableCell className="text-sm text-slate-500">{i + 1}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-slate-400">
                            <GripVertical className="w-4 h-4" />
                            <span className="text-xs">{slide.sort_order}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="w-24 h-14 rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden">
                            {slide.image ? (
                              <img src={slide.image} alt={slide.title} className="w-full h-full object-cover" />
                            ) : (
                              <Image className="w-6 h-6 text-slate-300" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-semibold text-slate-900 text-sm">{slide.title}</p>
                            {slide.subtitle && <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{slide.subtitle}</p>}
                          </div>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          {slide.button_text ? (
                            <Badge variant="outline" className="text-xs">{slide.button_text}</Badge>
                          ) : <span className="text-xs text-slate-400">—</span>}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={`text-[10px] cursor-pointer ${slide.status === 1 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}
                            onClick={() => toggleStatus(slide)}
                          >
                            {slide.status === 1 ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-0.5">
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-blue-600" onClick={() => { setPreviewSlide(slide); setPreviewOpen(true); }}>
                              <Eye className="w-3.5 h-3.5" />
                            </Button>
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-violet-600" onClick={() => openEdit(slide)}>
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-600" onClick={() => { setDeleteSlide(slide); setDeleteOpen(true); }}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
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
              {slides.map((slide) => (
                <Card key={slide.frontend_slider_id} className="border-slate-200/60">
                  <CardContent className="p-4">
                    <div className="flex gap-3">
                      <div className="w-20 h-14 rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden shrink-0">
                        {slide.image ? (
                          <img src={slide.image} alt={slide.title} className="w-full h-full object-cover" />
                        ) : (
                          <Image className="w-6 h-6 text-slate-300" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-semibold text-sm text-slate-900 truncate">{slide.title}</p>
                            {slide.subtitle && <p className="text-xs text-slate-500 line-clamp-1">{slide.subtitle}</p>}
                          </div>
                          <Badge className={`text-[10px] shrink-0 ${slide.status === 1 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                            {slide.status === 1 ? 'Active' : 'Off'}
                          </Badge>
                        </div>
                        <div className="flex gap-1 mt-2">
                          <Button size="sm" variant="ghost" className="h-7 px-2 text-blue-600" onClick={() => { setPreviewSlide(slide); setPreviewOpen(true); }}>
                            <Eye className="w-3 h-3 mr-1" /> View
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7 px-2 text-violet-600" onClick={() => openEdit(slide)}>
                            <Pencil className="w-3 h-3 mr-1" /> Edit
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7 px-2 text-red-600" onClick={() => { setDeleteSlide(slide); setDeleteOpen(true); }}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {editSlide ? <Pencil className="w-5 h-5 text-violet-600" /> : <Plus className="w-5 h-5 text-violet-600" />}
              {editSlide ? 'Edit Slide' : 'Add Slide'}
            </DialogTitle>
            <DialogDescription>
              {editSlide ? 'Update hero slide details' : 'Create a new hero banner slide for the homepage'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label className="text-sm font-semibold">Title *</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Slide headline" className="min-h-[44px]" />
            </div>
            <div className="grid gap-2">
              <Label className="text-sm font-semibold">Subtitle</Label>
              <Input value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} placeholder="Supporting text" className="min-h-[44px]" />
            </div>
            <div className="grid gap-2">
              <Label className="text-sm font-semibold">Image URL</Label>
              <Input value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} placeholder="https://example.com/image.jpg" className="min-h-[44px]" />
              {form.image && (
                <div className="w-full h-32 rounded-lg bg-slate-100 overflow-hidden mt-1">
                  <img src={form.image} alt="Preview" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label className="text-sm font-semibold">Button Text</Label>
                <Input value={form.button_text} onChange={(e) => setForm({ ...form, button_text: e.target.value })} placeholder="Learn More" className="min-h-[44px]" />
              </div>
              <div className="grid gap-2">
                <Label className="text-sm font-semibold">Button URL</Label>
                <Input value={form.button_url} onChange={(e) => setForm({ ...form, button_url: e.target.value })} placeholder="/contact" className="min-h-[44px]" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label className="text-sm font-semibold">Sort Order</Label>
                <Input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })} className="min-h-[44px]" />
              </div>
              <div className="flex items-center justify-end pt-6">
                <div className="flex items-center gap-2">
                  <Switch checked={form.status} onCheckedChange={(v) => setForm({ ...form, status: v })} />
                  <Label className="text-sm">{form.status ? 'Active' : 'Inactive'}</Label>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} className="bg-violet-600 hover:bg-violet-700 min-h-[44px] px-6" disabled={!form.title.trim() || saving}>
              {saving ? 'Saving...' : editSlide ? 'Update Slide' : 'Create Slide'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-lg">
          {previewSlide && (
            <>
              <DialogHeader>
                <DialogTitle>{previewSlide.title}</DialogTitle>
                <DialogDescription>Slide preview</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                {previewSlide.image ? (
                  <div className="w-full h-48 rounded-lg bg-slate-100 overflow-hidden">
                    <img src={previewSlide.image} alt={previewSlide.title} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-full h-48 rounded-lg bg-slate-100 flex items-center justify-center">
                    <Image className="w-12 h-12 text-slate-300" />
                  </div>
                )}
                <div>
                  <p className="text-sm text-slate-600">{previewSlide.subtitle}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {previewSlide.button_text && <Badge variant="outline">{previewSlide.button_text}</Badge>}
                  {previewSlide.button_url && <Badge className="bg-slate-100">{previewSlide.button_url}</Badge>}
                  <Badge className={previewSlide.status === 1 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}>
                    {previewSlide.status === 1 ? 'Active' : 'Inactive'}
                  </Badge>
                  <Badge className="bg-slate-100">Order: {previewSlide.sort_order}</Badge>
                </div>
                {previewSlide.timestamp && (
                  <p className="text-[10px] text-slate-400">Created: {format(new Date(previewSlide.timestamp), 'dd MMM yyyy, HH:mm')}</p>
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
            <AlertDialogTitle>Delete Slide</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong className="text-slate-900">{deleteSlide?.title}</strong>? This action cannot be undone.
            </AlertDialogDescription>
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
