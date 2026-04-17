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
  Newspaper, Plus, Pencil, Trash2, Search, Eye, Calendar, LayoutDashboard,
  Image, FileText,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface NewsArticle {
  frontend_news_id: number;
  title: string;
  description: string;
  image: string;
  date: string | null;
  timestamp: string | null;
}

interface NewsStats { total: number; thisMonth: number; }

export default function NewsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [stats, setStats] = useState<NewsStats>({ total: 0, thisMonth: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Form dialog
  const [formOpen, setFormOpen] = useState(false);
  const [editArticle, setEditArticle] = useState<NewsArticle | null>(null);
  const [form, setForm] = useState({ title: '', description: '', image: '', date: '' });
  const [saving, setSaving] = useState(false);

  // View dialog
  const [viewOpen, setViewOpen] = useState(false);
  const [viewArticle, setViewArticle] = useState<NewsArticle | null>(null);

  // Delete dialog
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteArticle, setDeleteArticle] = useState<NewsArticle | null>(null);

  const fetchNews = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      const res = await fetch(`/api/admin/frontend/news?${params}`);
      const data = await res.json();
      setNews(data.news || []);
      setStats(data.stats || { total: 0, thisMonth: 0 });
    } catch { /* empty */ }
    setLoading(false);
  }, [search]);

  useEffect(() => { fetchNews(); }, [fetchNews]);

  const openCreate = () => {
    setEditArticle(null);
    setForm({ title: '', description: '', image: '', date: format(new Date(), 'yyyy-MM-dd') });
    setFormOpen(true);
  };

  const openEdit = (n: NewsArticle) => {
    setEditArticle(n);
    setForm({
      title: n.title,
      description: n.description,
      image: n.image,
      date: n.date ? format(new Date(n.date), 'yyyy-MM-dd') : '',
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
      if (editArticle) {
        await fetch('/api/admin/frontend/news', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editArticle.frontend_news_id, ...form }),
        });
        toast({ title: 'Success', description: 'Article updated' });
      } else {
        await fetch('/api/admin/frontend/news', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
        toast({ title: 'Success', description: 'Article published' });
      }
      setFormOpen(false);
      fetchNews();
    } catch {
      toast({ title: 'Error', variant: 'destructive' });
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deleteArticle) return;
    try {
      await fetch(`/api/admin/frontend/news?id=${deleteArticle.frontend_news_id}`, { method: 'DELETE' });
      toast({ title: 'Success', description: 'Article deleted' });
      setDeleteOpen(false);
      fetchNews();
    } catch {
      toast({ title: 'Error', variant: 'destructive' });
    }
  };

  const truncateText = (text: string, len: number) => text.length > len ? text.substring(0, len) + '...' : text;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg">
              <Newspaper className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">News & Articles</h1>
              <p className="text-sm text-slate-500">Publish news and announcements for the website</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="min-h-[44px]" onClick={() => router.push('/admin/frontend')}>
              <LayoutDashboard className="w-4 h-4 mr-2" /> Dashboard
            </Button>
            <Button onClick={openCreate} className="bg-amber-600 hover:bg-amber-700 min-h-[44px] shadow-md">
              <Plus className="w-4 h-4 mr-2" /> Publish Article
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="border-slate-200/60 hover:shadow-md transition-shadow">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <Newspaper className="w-5 h-5 text-amber-600" />
              </div>
              <div><p className="text-xs text-slate-500">Total Articles</p><p className="text-xl font-bold">{stats.total}</p></div>
            </CardContent>
          </Card>
          <Card className="border-slate-200/60 hover:shadow-md transition-shadow">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-emerald-600" />
              </div>
              <div><p className="text-xs text-slate-500">This Month</p><p className="text-xl font-bold text-emerald-600">{stats.thisMonth}</p></div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input placeholder="Search articles..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 min-h-[44px]" />
        </div>

        {/* News List */}
        {loading ? (
          <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}</div>
        ) : news.length === 0 ? (
          <Card className="py-16">
            <CardContent className="flex flex-col items-center">
              <Newspaper className="w-16 h-16 text-slate-200 mb-4" />
              <p className="text-slate-500 font-medium">No articles found</p>
              <p className="text-slate-400 text-sm mt-1">Click &quot;Publish Article&quot; to create your first article</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {/* Desktop Table */}
            <div className="hidden md:block">
              <Card className="border-slate-200/60 overflow-hidden">
                <div className="max-h-[600px] overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50">
                        <TableHead className="w-10">#</TableHead>
                        <TableHead className="w-16">Image</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead className="w-36">Date</TableHead>
                        <TableHead className="w-32 text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {news.map((n, i) => (
                        <TableRow key={n.frontend_news_id} className="hover:bg-slate-50 transition-colors">
                          <TableCell className="text-sm text-slate-500">{i + 1}</TableCell>
                          <TableCell>
                            <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden">
                              {n.image ? <img src={n.image} alt={n.title} className="w-full h-full object-cover" /> : <FileText className="w-5 h-5 text-slate-300" />}
                            </div>
                          </TableCell>
                          <TableCell>
                            <p className="font-semibold text-sm">{n.title}</p>
                            <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{truncateText(n.description, 80)}</p>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-slate-600">{n.date ? format(new Date(n.date), 'dd MMM yyyy') : '—'}</span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-end gap-0.5">
                              <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-blue-600" onClick={() => { setViewArticle(n); setViewOpen(true); }}><Eye className="w-3.5 h-3.5" /></Button>
                              <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-amber-600" onClick={() => openEdit(n)}><Pencil className="w-3.5 h-3.5" /></Button>
                              <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-600" onClick={() => { setDeleteArticle(n); setDeleteOpen(true); }}><Trash2 className="w-3.5 h-3.5" /></Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </Card>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-3">
              {news.map((n) => (
                <Card key={n.frontend_news_id} className="border-slate-200/60 hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex gap-3">
                      <div className="w-16 h-16 rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden shrink-0">
                        {n.image ? <img src={n.image} alt={n.title} className="w-full h-full object-cover" /> : <FileText className="w-6 h-6 text-slate-300" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-slate-900 truncate">{n.title}</p>
                        <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{truncateText(n.description, 60)}</p>
                        {n.date && (
                          <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />{format(new Date(n.date), 'dd MMM yyyy')}
                          </p>
                        )}
                        <div className="flex gap-1 mt-2">
                          <Button size="sm" variant="ghost" className="h-7 px-2 text-blue-600" onClick={() => { setViewArticle(n); setViewOpen(true); }}><Eye className="w-3 h-3 mr-1" />View</Button>
                          <Button size="sm" variant="ghost" className="h-7 px-2 text-amber-600" onClick={() => openEdit(n)}><Pencil className="w-3 h-3 mr-1" />Edit</Button>
                          <Button size="sm" variant="ghost" className="h-7 px-2 text-red-600" onClick={() => { setDeleteArticle(n); setDeleteOpen(true); }}><Trash2 className="w-3 h-3" /></Button>
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

      {/* Form Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {editArticle ? <Pencil className="w-5 h-5 text-amber-600" /> : <Plus className="w-5 h-5 text-amber-600" />}
              {editArticle ? 'Edit Article' : 'Publish Article'}
            </DialogTitle>
            <DialogDescription>{editArticle ? 'Update article details' : 'Create a new news article'}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label className="text-sm font-semibold">Title *</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Article title" className="min-h-[44px]" />
            </div>
            <div className="grid gap-2">
              <Label className="text-sm font-semibold">Content</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Write your article content..." rows={8} className="min-h-[160px]" />
            </div>
            <div className="grid gap-2">
              <Label className="text-sm font-semibold">Image URL</Label>
              <Input value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} placeholder="https://example.com/article-image.jpg" className="min-h-[44px]" />
              {form.image && (
                <div className="w-full h-32 rounded-lg bg-slate-100 overflow-hidden mt-1">
                  <img src={form.image} alt="Preview" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                </div>
              )}
            </div>
            <div className="grid gap-2">
              <Label className="text-sm font-semibold flex items-center gap-1"><Calendar className="w-4 h-4" /> Publish Date</Label>
              <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="min-h-[44px]" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} className="bg-amber-600 hover:bg-amber-700 min-h-[44px] px-6" disabled={!form.title.trim() || saving}>
              {saving ? 'Saving...' : editArticle ? 'Update Article' : 'Publish Article'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          {viewArticle && (
            <>
              <DialogHeader>
                <DialogTitle>{viewArticle.title}</DialogTitle>
                <DialogDescription className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {viewArticle.date ? format(new Date(viewArticle.date), 'EEEE, dd MMMM yyyy') : 'No date'}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                {viewArticle.image && (
                  <div className="w-full h-48 rounded-lg bg-slate-100 overflow-hidden">
                    <img src={viewArticle.image} alt={viewArticle.title} className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="prose prose-sm max-w-none">
                  <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">{viewArticle.description || 'No content'}</p>
                </div>
                {viewArticle.timestamp && (
                  <p className="text-[10px] text-slate-400">Created: {format(new Date(viewArticle.timestamp), 'dd MMM yyyy, HH:mm')}</p>
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
            <AlertDialogTitle>Delete Article</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to delete <strong className="text-slate-900">{deleteArticle?.title}</strong>? This cannot be undone.</AlertDialogDescription>
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
