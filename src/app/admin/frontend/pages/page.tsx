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
  FileText, Plus, Pencil, Trash2, Eye, LayoutDashboard, Clock, Save,
  Info, Shield, BookOpen, Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Page {
  frontend_pages_id: number;
  title: string;
  slug: string;
  content: string;
  updated_at: string | null;
}

function PagesSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <Skeleton className="w-11 h-11 rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-56" />
          </div>
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-11 w-28 rounded-lg" />
          <Skeleton className="h-11 w-28 rounded-lg" />
        </div>
      </div>
      {/* Tabs skeleton */}
      <Skeleton className="h-10 w-64 rounded-lg" />
      {/* Content skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-48 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export default function PagesPage() {
  const router = useRouter();
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasFetched, setHasFetched] = useState(false);
  const [activeTab, setActiveTab] = useState('pages');

  // Editor dialog
  const [editorOpen, setEditorOpen] = useState(false);
  const [editPage, setEditPage] = useState<Page | null>(null);
  const [editorForm, setEditorForm] = useState({ title: '', slug: '', content: '' });
  const [saving, setSaving] = useState(false);

  // View dialog
  const [viewOpen, setViewOpen] = useState(false);
  const [viewPage, setViewPage] = useState<Page | null>(null);

  // Delete dialog
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletePageItem, setDeletePageItem] = useState<Page | null>(null);

  // New page dialog
  const [newPageOpen, setNewPageOpen] = useState(false);
  const [newPageForm, setNewPageForm] = useState({ title: '', slug: '', content: '' });
  const [creating, setCreating] = useState(false);

  const fetchPages = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/frontend/pages');
      const data = await res.json();
      setPages(data.pages || []);
      setHasFetched(true);
    } catch { /* empty */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchPages(); }, [fetchPages]);

  const slugify = (text: string): string =>
    text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  const openEdit = (page: Page) => {
    setEditPage(page);
    setEditorForm({ title: page.title, slug: page.slug, content: page.content });
    setEditorOpen(true);
  };

  const handleSave = async () => {
    if (!editPage) return;
    if (!editorForm.title.trim()) {
      toast.error('Title is required');
      return;
    }
    setSaving(true);
    try {
      await fetch('/api/admin/frontend/pages', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editPage.frontend_pages_id, ...editorForm }),
      });
      toast.success(`"${editorForm.title}" saved successfully`);
      setEditorOpen(false);
      fetchPages();
    } catch {
      toast.error('Something went wrong');
    }
    setSaving(false);
  };

  const openCreatePage = () => {
    setNewPageForm({ title: '', slug: '', content: '' });
    setNewPageOpen(true);
  };

  const handleCreate = async () => {
    if (!newPageForm.title.trim() || !newPageForm.slug.trim()) {
      toast.error('Title and slug are required');
      return;
    }
    setCreating(true);
    try {
      const res = await fetch('/api/admin/frontend/pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPageForm),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || 'Failed to create page');
      } else {
        toast.success(`"${newPageForm.title}" created`);
        setNewPageOpen(false);
        fetchPages();
      }
    } catch {
      toast.error('Something went wrong');
    }
    setCreating(false);
  };

  const handleDelete = async () => {
    if (!deletePageItem) return;
    try {
      await fetch(`/api/admin/frontend/pages?id=${deletePageItem.frontend_pages_id}`, { method: 'DELETE' });
      toast.success(`Page "${deletePageItem.title}" deleted`);
      setDeleteOpen(false);
      fetchPages();
    } catch {
      toast.error('Something went wrong');
    }
  };

  const getPageIcon = (slug: string) => {
    if (slug.includes('about')) return <Info className="w-5 h-5 text-sky-600" />;
    if (slug.includes('privacy')) return <Shield className="w-5 h-5 text-violet-600" />;
    if (slug.includes('terms')) return <BookOpen className="w-5 h-5 text-amber-600" />;
    return <FileText className="w-5 h-5 text-slate-600" />;
  };

  const getPageColor = (slug: string) => {
    if (slug.includes('about')) return 'bg-sky-100 text-sky-700';
    if (slug.includes('privacy')) return 'bg-violet-100 text-violet-700';
    if (slug.includes('terms')) return 'bg-amber-100 text-amber-700';
    return 'bg-slate-100 text-slate-700';
  };

  const defaultPages = [
    { title: 'About Us', slug: 'about-us', icon: <Info className="w-5 h-5 text-sky-600" />, color: 'from-sky-500 to-blue-600', badgeColor: 'bg-sky-100 text-sky-700', desc: 'School history, mission and values' },
    { title: 'Privacy Policy', slug: 'privacy-policy', icon: <Shield className="w-5 h-5 text-violet-600" />, color: 'from-violet-500 to-purple-600', badgeColor: 'bg-violet-100 text-violet-700', desc: 'Data privacy and protection policy' },
    { title: 'Terms & Conditions', slug: 'terms-conditions', icon: <BookOpen className="w-5 h-5 text-amber-600" />, color: 'from-amber-500 to-orange-600', badgeColor: 'bg-amber-100 text-amber-700', desc: 'Website terms and conditions of use' },
  ];

  if (loading && !hasFetched) {
    return (
      <DashboardLayout>
        <PagesSkeleton />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center shadow-lg">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Static Pages</h1>
              <p className="text-sm text-slate-500">Edit About Us, Privacy Policy, Terms & Conditions</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="min-h-[44px]" onClick={() => router.push('/admin/frontend')}>
              <LayoutDashboard className="w-4 h-4 mr-2" /> Dashboard
            </Button>
            <Button onClick={openCreatePage} className="bg-sky-600 hover:bg-sky-700 min-h-[44px] shadow-md">
              <Plus className="w-4 h-4 mr-2" /> New Page
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="pages" className="gap-1"><FileText className="w-4 h-4" /> Quick Edit</TabsTrigger>
            <TabsTrigger value="all" className="gap-1"><BookOpen className="w-4 h-4" /> All Pages</TabsTrigger>
          </TabsList>

          {/* Quick Edit Tab */}
          <TabsContent value="pages" className="mt-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {defaultPages.map((dp) => {
                const page = pages.find((p) => p.slug === dp.slug);
                const hasContent = page && page.content.trim().length > 0;
                return (
                  <Card key={dp.slug} className="border-slate-200/60 hover:shadow-lg transition-all overflow-hidden">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${dp.color} flex items-center justify-center shadow-sm`}>
                            {dp.icon}
                          </div>
                          <div>
                            <CardTitle className="text-sm">{dp.title}</CardTitle>
                            <p className="text-[11px] text-slate-400">{dp.desc}</p>
                          </div>
                        </div>
                        {hasContent && <Badge className={`${dp.badgeColor} text-[10px]`}>Active</Badge>}
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0 space-y-3">
                      {page?.updated_at && (
                        <p className="text-[11px] text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Last edited: {format(new Date(page.updated_at), 'dd MMM yyyy, HH:mm')}
                        </p>
                      )}
                      <div className="flex gap-2">
                        {page && (
                          <Button
                            size="sm"
                            className="flex-1 min-h-[44px]"
                            onClick={() => openEdit(page)}
                            variant={hasContent ? 'default' : 'outline'}
                          >
                            <Pencil className="w-3.5 h-3.5 mr-1" />
                            {hasContent ? 'Edit Content' : 'Write Content'}
                          </Button>
                        )}
                        {page && hasContent && (
                          <Button size="sm" variant="outline" className="min-h-[44px]" onClick={() => { setViewPage(page); setViewOpen(true); }}>
                            <Eye className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* All Pages Tab */}
          <TabsContent value="all" className="mt-4">
            <div className="space-y-3">
              {/* Desktop Table */}
              <div className="hidden md:block">
                <Card className="border-slate-200/60 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50">
                        <TableHead className="w-10">#</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Slug</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Last Updated</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pages.map((p, i) => (
                        <TableRow key={p.frontend_pages_id} className="hover:bg-slate-50 transition-colors">
                          <TableCell className="text-sm text-slate-500">{i + 1}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getPageIcon(p.slug)}
                              <span className="font-semibold text-sm">{p.title}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <code className="text-xs bg-slate-100 px-2 py-1 rounded">{p.slug}</code>
                          </TableCell>
                          <TableCell>
                            <Badge className={`${getPageColor(p.slug)} text-[10px]`}>
                              {p.content.trim() ? 'Has Content' : 'Empty'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-slate-500">
                              {p.updated_at ? format(new Date(p.updated_at), 'dd MMM yyyy') : 'Never'}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-end gap-0.5">
                              <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-blue-600" onClick={() => { setViewPage(p); setViewOpen(true); }}><Eye className="w-3.5 h-3.5" /></Button>
                              <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-sky-600" onClick={() => openEdit(p)}><Pencil className="w-3.5 h-3.5" /></Button>
                              <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-600" onClick={() => { setDeletePageItem(p); setDeleteOpen(true); }}><Trash2 className="w-3.5 h-3.5" /></Button>
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
                {pages.map((p) => (
                  <Card key={p.frontend_pages_id} className="border-slate-200/60 hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          {getPageIcon(p.slug)}
                          <div className="min-w-0">
                            <p className="font-semibold text-sm text-slate-900 truncate">{p.title}</p>
                            <code className="text-[11px] bg-slate-100 px-1.5 py-0.5 rounded">{p.slug}</code>
                          </div>
                        </div>
                        <Badge className={`${getPageColor(p.slug)} text-[10px] shrink-0`}>
                          {p.content.trim() ? 'Active' : 'Empty'}
                        </Badge>
                      </div>
                      {p.updated_at && (
                        <p className="text-[11px] text-slate-400 mt-2 flex items-center gap-1">
                          <Clock className="w-3 h-3" />{format(new Date(p.updated_at), 'dd MMM yyyy, HH:mm')}
                        </p>
                      )}
                      <div className="flex gap-1 mt-3">
                        <Button size="sm" variant="ghost" className="min-h-[44px] px-3 text-blue-600" onClick={() => { setViewPage(p); setViewOpen(true); }}><Eye className="w-3 h-3 mr-1" />View</Button>
                        <Button size="sm" variant="ghost" className="min-h-[44px] px-3 text-sky-600" onClick={() => openEdit(p)}><Pencil className="w-3 h-3 mr-1" />Edit</Button>
                        <Button size="sm" variant="ghost" className="min-h-[44px] px-3 text-red-600" onClick={() => { setDeletePageItem(p); setDeleteOpen(true); }}><Trash2 className="w-3 h-3" /></Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Editor Dialog */}
      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="w-5 h-5 text-sky-600" /> Edit: {editPage?.title}
            </DialogTitle>
            <DialogDescription>Update the content for this static page</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label className="text-sm font-semibold">Page Title *</Label>
                <Input value={editorForm.title} onChange={(e) => setEditorForm({ ...editorForm, title: e.target.value })} className="min-h-[44px]" />
              </div>
              <div className="grid gap-2">
                <Label className="text-sm font-semibold">URL Slug *</Label>
                <Input value={editorForm.slug} onChange={(e) => setEditorForm({ ...editorForm, slug: e.target.value })} className="min-h-[44px]" />
                <p className="text-[11px] text-slate-400">URL: /pages/{editorForm.slug}</p>
              </div>
            </div>
            <div className="grid gap-2">
              <Label className="text-sm font-semibold flex items-center gap-1">
                <FileText className="w-4 h-4" /> Page Content
              </Label>
              <Textarea
                value={editorForm.content}
                onChange={(e) => setEditorForm({ ...editorForm, content: e.target.value })}
                placeholder="Write your page content here. You can use plain text or HTML formatting..."
                rows={16}
                className="min-h-[300px] font-mono text-sm"
              />
              <div className="flex items-center justify-between">
                <p className="text-[11px] text-slate-400">{editorForm.content.length} characters</p>
                <p className="text-[11px] text-slate-400">Tip: Use HTML tags for formatting (e.g., &lt;h2&gt;, &lt;p&gt;, &lt;ul&gt;)</p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditorOpen(false)} className="min-h-[44px]">Cancel</Button>
            <Button onClick={handleSave} className="bg-sky-600 hover:bg-sky-700 min-h-[44px] px-6" disabled={!editorForm.title.trim() || saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              <Save className="w-4 h-4 mr-2" />{saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {viewPage && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {getPageIcon(viewPage.slug)} {viewPage.title}
                </DialogTitle>
                <DialogDescription className="flex items-center gap-3">
                  <code className="text-xs bg-slate-100 px-2 py-0.5 rounded">{viewPage.slug}</code>
                  {viewPage.updated_at && (
                    <span className="flex items-center gap-1 text-xs text-slate-400">
                      <Clock className="w-3 h-3" /> Updated: {format(new Date(viewPage.updated_at), 'dd MMM yyyy, HH:mm')}
                    </span>
                  )}
                </DialogDescription>
              </DialogHeader>
              <div className="prose prose-sm max-w-none">
                {viewPage.content.trim() ? (
                  <div className="bg-slate-50 rounded-lg p-4 whitespace-pre-wrap text-sm text-slate-700 leading-relaxed">
                    {viewPage.content}
                  </div>
                ) : (
                  <div className="bg-slate-50 rounded-lg p-8 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-slate-200 flex items-center justify-center mx-auto mb-3">
                      <FileText className="w-7 h-7 text-slate-400" />
                    </div>
                    <p className="text-slate-400">No content yet. Click &quot;Edit&quot; to add content.</p>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* New Page Dialog */}
      <Dialog open={newPageOpen} onOpenChange={setNewPageOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-sky-600" /> Create New Page
            </DialogTitle>
            <DialogDescription>Add a new static page to the website</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label className="text-sm font-semibold">Page Title *</Label>
              <Input
                value={newPageForm.title}
                onChange={(e) => setNewPageForm({ ...newPageForm, title: e.target.value, slug: slugify(e.target.value) })}
                placeholder="Page title"
                className="min-h-[44px]"
              />
            </div>
            <div className="grid gap-2">
              <Label className="text-sm font-semibold">URL Slug *</Label>
              <Input value={newPageForm.slug} onChange={(e) => setNewPageForm({ ...newPageForm, slug: e.target.value })} placeholder="page-url-slug" className="min-h-[44px]" />
              <p className="text-[11px] text-slate-400">Auto-generated from title. URL: /pages/{newPageForm.slug}</p>
            </div>
            <div className="grid gap-2">
              <Label className="text-sm font-semibold">Content</Label>
              <Textarea
                value={newPageForm.content}
                onChange={(e) => setNewPageForm({ ...newPageForm, content: e.target.value })}
                placeholder="Page content..."
                rows={6}
                className="min-h-[120px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewPageOpen(false)} className="min-h-[44px]">Cancel</Button>
            <Button onClick={handleCreate} className="bg-sky-600 hover:bg-sky-700 min-h-[44px] px-6" disabled={!newPageForm.title.trim() || !newPageForm.slug.trim() || creating}>
              {creating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              <Plus className="w-4 h-4 mr-2" />{creating ? 'Creating...' : 'Create Page'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                <Trash2 className="w-4 h-4 text-red-600" />
              </div>
              Delete Page
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong className="text-slate-900">{deletePageItem?.title}</strong>? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="min-h-[44px]">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 min-h-[44px]">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
