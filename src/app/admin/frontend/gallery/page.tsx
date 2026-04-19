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
import { Textarea } from '@/components/ui/textarea';
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
  Layers, Plus, Pencil, Trash2, Search, Eye, Calendar, LayoutDashboard,
  Image, X, Upload, Camera, Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface GalleryImage {
  frontend_gallery_image_id: number;
  gallery_id: number;
  image_name: string;
  caption: string;
  date: string | null;
}

interface Gallery {
  frontend_gallery_id: number;
  title: string;
  description: string;
  date: string | null;
  timestamp: string | null;
  images: GalleryImage[];
}

interface GalleryStats { total: number; totalImages: number; }

function GallerySkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <Skeleton className="w-11 h-11 rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-36" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-11 w-28 rounded-lg" />
          <Skeleton className="h-11 w-32 rounded-lg" />
        </div>
      </div>
      {/* Stat cards skeleton */}
      <div className="grid grid-cols-2 gap-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <Skeleton key={i} className="h-[88px] rounded-xl" />
        ))}
      </div>
      {/* Search skeleton */}
      <Skeleton className="h-11 w-full rounded-lg" />
      {/* Gallery grid skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-48 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export default function GalleryPage() {
  const router = useRouter();
  const [galleries, setGalleries] = useState<Gallery[]>([]);
  const [stats, setStats] = useState<GalleryStats>({ total: 0, totalImages: 0 });
  const [loading, setLoading] = useState(true);
  const [hasFetched, setHasFetched] = useState(false);
  const [search, setSearch] = useState('');

  // Album form dialog
  const [formOpen, setFormOpen] = useState(false);
  const [editGallery, setEditGallery] = useState<Gallery | null>(null);
  const [form, setForm] = useState({ title: '', description: '', date: '' });
  const [saving, setSaving] = useState(false);

  // Image management dialog
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [currentGallery, setCurrentGallery] = useState<Gallery | null>(null);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newImageCaption, setNewImageCaption] = useState('');
  const [addingImage, setAddingImage] = useState(false);

  // Delete dialog
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteGallery, setDeleteGallery] = useState<Gallery | null>(null);
  const [deleteImageOpen, setDeleteImageOpen] = useState(false);
  const [deleteImage, setDeleteImage] = useState<GalleryImage | null>(null);

  const fetchGalleries = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      const res = await fetch(`/api/admin/frontend/gallery?${params}`);
      const data = await res.json();
      setGalleries(data.galleries || []);
      setStats(data.stats || { total: 0, totalImages: 0 });
      setHasFetched(true);
    } catch { /* empty */ }
    setLoading(false);
  }, [search]);

  useEffect(() => { fetchGalleries(); }, [fetchGalleries]);

  const openCreateAlbum = () => {
    setEditGallery(null);
    setForm({ title: '', description: '', date: format(new Date(), 'yyyy-MM-dd') });
    setFormOpen(true);
  };

  const openEditAlbum = (gal: Gallery) => {
    setEditGallery(gal);
    setForm({
      title: gal.title,
      description: gal.description,
      date: gal.date ? format(new Date(gal.date), 'yyyy-MM-dd') : '',
    });
    setFormOpen(true);
  };

  const handleSaveAlbum = async () => {
    if (!form.title.trim()) {
      toast.error('Album title is required');
      return;
    }
    setSaving(true);
    try {
      if (editGallery) {
        await fetch('/api/admin/frontend/gallery', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editGallery.frontend_gallery_id, ...form }),
        });
        toast.success('Album updated');
      } else {
        await fetch('/api/admin/frontend/gallery', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
        toast.success('Album created');
      }
      setFormOpen(false);
      fetchGalleries();
    } catch {
      toast.error('Something went wrong');
    }
    setSaving(false);
  };

  const handleDeleteAlbum = async () => {
    if (!deleteGallery) return;
    try {
      await fetch(`/api/admin/frontend/gallery?id=${deleteGallery.frontend_gallery_id}`, { method: 'DELETE' });
      toast.success(`Album "${deleteGallery.title}" deleted with all images`);
      setDeleteOpen(false);
      fetchGalleries();
    } catch {
      toast.error('Something went wrong');
    }
  };

  const openImageManager = (gal: Gallery) => {
    setCurrentGallery(gal);
    setImageDialogOpen(true);
  };

  const handleAddImage = async () => {
    if (!currentGallery || !newImageUrl.trim()) return;
    setAddingImage(true);
    try {
      await fetch('/api/admin/frontend/gallery?action=add_image', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gallery_id: currentGallery.frontend_gallery_id,
          image_name: newImageUrl,
          caption: newImageCaption,
        }),
      });
      toast.success('Image added');
      setNewImageUrl('');
      setNewImageCaption('');
      fetchGalleries();
      // Refresh current gallery in dialog
      const updated = galleries.find(g => g.frontend_gallery_id === currentGallery.frontend_gallery_id);
      if (updated) {
        const res = await fetch('/api/admin/frontend/gallery');
        const data = await res.json();
        const gal = data.galleries?.find((g: Gallery) => g.frontend_gallery_id === currentGallery.frontend_gallery_id);
        if (gal) setCurrentGallery(gal);
      }
    } catch {
      toast.error('Something went wrong');
    }
    setAddingImage(false);
  };

  const handleDeleteImage = async () => {
    if (!deleteImage) return;
    try {
      await fetch('/api/admin/frontend/gallery?action=remove_image', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_id: deleteImage.frontend_gallery_image_id }),
      });
      toast.success('Image removed');
      setDeleteImageOpen(false);
      fetchGalleries();
      // Refresh
      if (currentGallery) {
        const res = await fetch('/api/admin/frontend/gallery');
        const data = await res.json();
        const gal = data.galleries?.find((g: Gallery) => g.frontend_gallery_id === currentGallery.frontend_gallery_id);
        if (gal) setCurrentGallery(gal);
      }
    } catch {
      toast.error('Something went wrong');
    }
  };

  if (loading && !hasFetched) {
    return (
      <DashboardLayout>
        <GallerySkeleton />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center shadow-lg">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Photo Gallery</h1>
              <p className="text-sm text-slate-500">Manage albums and photo uploads</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="min-h-[44px]" onClick={() => router.push('/admin/frontend')}>
              <LayoutDashboard className="w-4 h-4 mr-2" /> Dashboard
            </Button>
            <Button onClick={openCreateAlbum} className="bg-rose-600 hover:bg-rose-700 min-h-[44px] shadow-md">
              <Plus className="w-4 h-4 mr-2" /> New Album
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-xl border border-slate-200/60 border-l-4 border-l-rose-500 bg-white p-4 flex items-center gap-4 hover:-translate-y-0.5 hover:shadow-lg transition-all">
            <div className="w-11 h-11 rounded-xl bg-rose-500 flex items-center justify-center shrink-0">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Albums</p>
              <p className="text-2xl font-bold text-slate-900 tabular-nums">{stats.total}</p>
            </div>
          </div>
          <div className="rounded-xl border border-slate-200/60 border-l-4 border-l-pink-500 bg-white p-4 flex items-center gap-4 hover:-translate-y-0.5 hover:shadow-lg transition-all">
            <div className="w-11 h-11 rounded-xl bg-pink-500 flex items-center justify-center shrink-0">
              <Camera className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Photos</p>
              <p className="text-2xl font-bold text-pink-600 tabular-nums">{stats.totalImages}</p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input placeholder="Search albums..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 min-h-[44px] bg-slate-50 border-slate-200 focus:bg-white" />
        </div>

        {/* Gallery Grid */}
        {galleries.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white py-16">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-2xl bg-rose-50 flex items-center justify-center mb-4">
                <Layers className="w-7 h-7 text-rose-300" />
              </div>
              <p className="text-slate-500 font-medium">No albums found</p>
              <p className="text-slate-400 text-sm mt-1">Click &quot;New Album&quot; to create your first photo album</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {galleries.map((gal) => (
              <Card key={gal.frontend_gallery_id} className="border-slate-200/60 hover:shadow-lg transition-all overflow-hidden group">
                {/* Thumbnail */}
                <div className="h-36 bg-slate-100 flex items-center justify-center relative overflow-hidden">
                  {gal.images?.length > 0 && gal.images[0].image_name ? (
                    <img src={gal.images[0].image_name} alt={gal.title} className="w-full h-full object-cover" />
                  ) : (
                    <Image className="w-12 h-12 text-slate-300" />
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                    <Button
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 hover:bg-white text-slate-800 min-h-[44px]"
                      onClick={() => openImageManager(gal)}
                    >
                      <Camera className="w-4 h-4 mr-1" /> Manage Photos
                    </Button>
                  </div>
                  <Badge className="absolute top-2 right-2 bg-black/50 text-white text-[10px]">
                    {gal.images?.length || 0} photos
                  </Badge>
                </div>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-sm text-slate-900 truncate">{gal.title}</h3>
                      {gal.description && <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{gal.description}</p>}
                      {gal.date && (
                        <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />{format(new Date(gal.date), 'dd MMM yyyy')}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-0.5 shrink-0">
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-rose-600" onClick={() => openImageManager(gal)}>
                        <Eye className="w-3.5 h-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-amber-600" onClick={() => openEditAlbum(gal)}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-600" onClick={() => { setDeleteGallery(gal); setDeleteOpen(true); }}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Album Form Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {editGallery ? <Pencil className="w-5 h-5 text-rose-600" /> : <Plus className="w-5 h-5 text-rose-600" />}
              {editGallery ? 'Edit Album' : 'New Album'}
            </DialogTitle>
            <DialogDescription>{editGallery ? 'Update album details' : 'Create a new photo album'}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label className="text-sm font-semibold">Album Title *</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Album name" className="min-h-[44px]" />
            </div>
            <div className="grid gap-2">
              <Label className="text-sm font-semibold">Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Brief description" rows={3} />
            </div>
            <div className="grid gap-2">
              <Label className="text-sm font-semibold flex items-center gap-1"><Calendar className="w-4 h-4" /> Date</Label>
              <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="min-h-[44px]" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)} className="min-h-[44px]">Cancel</Button>
            <Button onClick={handleSaveAlbum} className="bg-rose-600 hover:bg-rose-700 min-h-[44px] px-6" disabled={!form.title.trim() || saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {saving ? 'Saving...' : editGallery ? 'Update Album' : 'Create Album'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Manager Dialog */}
      <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Camera className="w-5 h-5 text-rose-600" />
              {currentGallery?.title} — Photos
            </DialogTitle>
            <DialogDescription>Add, view or remove photos from this album</DialogDescription>
          </DialogHeader>

          {/* Add Image Form */}
          <Card className="border-slate-200">
            <CardHeader className="pb-3 pt-4 px-4">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Upload className="w-4 h-4" /> Add New Photo
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-3">
              <div className="grid gap-2">
                <Label className="text-xs text-slate-500">Image URL *</Label>
                <Input value={newImageUrl} onChange={(e) => setNewImageUrl(e.target.value)} placeholder="https://example.com/photo.jpg" className="h-9 bg-slate-50 border-slate-200 focus:bg-white" />
              </div>
              <div className="grid gap-2">
                <Label className="text-xs text-slate-500">Caption</Label>
                <Input value={newImageCaption} onChange={(e) => setNewImageCaption(e.target.value)} placeholder="Photo description" className="h-9 bg-slate-50 border-slate-200 focus:bg-white" />
              </div>
              {newImageUrl && (
                <div className="w-full h-24 rounded-lg bg-slate-100 overflow-hidden">
                  <img src={newImageUrl} alt="Preview" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                </div>
              )}
              <Button size="sm" onClick={handleAddImage} disabled={!newImageUrl.trim() || addingImage} className="bg-rose-600 hover:bg-rose-700 min-h-[44px]">
                {addingImage && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
                <Plus className="w-3 h-3 mr-1" />{addingImage ? 'Adding...' : 'Add Photo'}
              </Button>
            </CardContent>
          </Card>

          {/* Image Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[400px] overflow-y-auto">
            {currentGallery?.images?.length === 0 ? (
              <div className="col-span-full text-center py-8">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
                  <Image className="w-7 h-7 text-slate-300" />
                </div>
                <p className="text-sm text-slate-400">No photos yet</p>
              </div>
            ) : (
              currentGallery?.images?.map((img) => (
                <div key={img.frontend_gallery_image_id} className="relative group rounded-lg overflow-hidden border border-slate-200">
                  <div className="aspect-square bg-slate-100">
                    <img src={img.image_name} alt={img.caption || 'Gallery photo'} className="w-full h-full object-cover" />
                  </div>
                  {img.caption && (
                    <div className="absolute inset-x-0 bottom-0 bg-black/50 text-white text-[10px] p-1.5 truncate">
                      {img.caption}
                    </div>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="absolute top-1 right-1 h-6 w-6 p-0 bg-red-500/80 hover:bg-red-600 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => { setDeleteImage(img); setDeleteImageOpen(true); }}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Album Confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                <Trash2 className="w-4 h-4 text-red-600" />
              </div>
              Delete Album
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong className="text-slate-900">{deleteGallery?.title}</strong>? This will also delete all {deleteGallery?.images?.length || 0} photos in this album. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="min-h-[44px]">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAlbum} className="bg-red-600 hover:bg-red-700 min-h-[44px]">Delete Album</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Image Confirmation */}
      <AlertDialog open={deleteImageOpen} onOpenChange={setDeleteImageOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                <Trash2 className="w-4 h-4 text-red-600" />
              </div>
              Remove Photo
            </AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to remove this photo from the album?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="min-h-[44px]">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteImage} className="bg-red-600 hover:bg-red-700 min-h-[44px]">Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
