'use client';

import { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Tag, Plus, Edit, Trash2, Search, DollarSign, FolderOpen, TrendingDown,
} from 'lucide-react';

interface ExpenseCategory {
  expense_category_id: number;
  expense_category_name: string;
  expenseCount: number;
  totalAmount: number;
}

function fmt(n: number) { return `GH₵ ${(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`; }

export default function ExpenseCategoriesPage() {
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [stats, setStats] = useState({ totalCategories: 0, totalExpenses: 0, totalSpent: 0 });

  const [addOpen, setAddOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [adding, setAdding] = useState(false);

  const [editOpen, setEditOpen] = useState(false);
  const [editCat, setEditCat] = useState<ExpenseCategory | null>(null);
  const [editName, setEditName] = useState('');
  const [saving, setSaving] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteCat, setDeleteCat] = useState<ExpenseCategory | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/expenses/categories');
      const data = await res.json();
      setCategories(data.categories || []);
      setStats(data.stats || { totalCategories: 0, totalExpenses: 0, totalSpent: 0 });
    } catch { toast.error('Failed to load categories'); }
    setLoading(false);
  }, []);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  const handleCreate = async () => {
    if (!newName.trim()) { toast({ title: 'Name required', variant: 'destructive' }); return; }
    setAdding(true);
    try {
      const res = await fetch('/api/admin/expenses/categories', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim() }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast({ title: 'Category created' });
      setAddOpen(false); setNewName('');
      fetchCategories();
    } catch (e: any) { toast({ title: e.message, variant: 'destructive' }); }
    setAdding(false);
  };

  const handleEdit = (cat: ExpenseCategory) => {
    setEditCat(cat); setEditName(cat.expense_category_name); setEditOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editCat || !editName.trim()) return;
    setSaving(true);
    try {
      const res = await fetch('/api/admin/expenses/categories', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editCat.expense_category_id, name: editName.trim() }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast({ title: 'Category updated' }); setEditOpen(false); fetchCategories();
    } catch (e: any) { toast({ title: e.message, variant: 'destructive' }); }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deleteCat) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/expenses/categories?id=${deleteCat.expense_category_id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast({ title: 'Category deleted' }); setDeleteOpen(false); setDeleteCat(null); fetchCategories();
    } catch (e: any) { toast({ title: e.message, variant: 'destructive' }); }
    setDeleting(false);
  };

  const filtered = search
    ? categories.filter(c => c.expense_category_name.toLowerCase().includes(search.toLowerCase()))
    : categories;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-md">
              <Tag className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Expense Categories</h1>
              <p className="text-sm text-slate-500 mt-0.5">Manage expense groupings and classifications</p>
            </div>
          </div>
          <Button onClick={() => setAddOpen(true)} className="bg-amber-600 hover:bg-amber-700">
            <Plus className="w-4 h-4 mr-2" /> New Category
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border-l-4 border-l-amber-500">
            <CardContent className="p-4">
              <p className="text-xs text-slate-400">Total Categories</p>
              <p className="text-xl font-bold">{stats.totalCategories}</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-red-500">
            <CardContent className="p-4">
              <p className="text-xs text-slate-400">Total Expenses</p>
              <p className="text-xl font-bold">{stats.totalExpenses}</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-violet-500">
            <CardContent className="p-4">
              <p className="text-xs text-slate-400">Total Spent</p>
              <p className="text-xl font-bold font-mono text-red-600">{fmt(stats.totalSpent)}</p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input placeholder="Search categories..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>

        {/* Categories Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
          </div>
        ) : filtered.length === 0 ? (
          <Card><CardContent className="py-16 text-center text-slate-400">
            <FolderOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No categories found</p>
          </CardContent></Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(cat => (
              <Card key={cat.expense_category_id} className="hover:border-amber-200 transition-all hover:shadow-md group">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                        <Tag className="w-5 h-5 text-amber-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{cat.expense_category_name}</p>
                        <p className="text-xs text-slate-400">{cat.expenseCount} expense(s)</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="font-mono text-lg font-bold text-red-600">{fmt(cat.totalAmount)}</p>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(cat)}>
                        <Edit className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => { setDeleteCat(cat); setDeleteOpen(true); }}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Add Dialog */}
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogContent className="max-w-sm">
            <DialogHeader><DialogTitle>New Expense Category</DialogTitle><DialogDescription>Enter a name for the new category</DialogDescription></DialogHeader>
            <div><Label className="text-xs">Category Name</Label><Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g., Utilities" className="mt-1" onKeyDown={e => e.key === 'Enter' && handleCreate()} /></div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={adding} className="bg-amber-600 hover:bg-amber-700">{adding ? 'Creating...' : 'Create'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="max-w-sm">
            <DialogHeader><DialogTitle>Edit Category</DialogTitle></DialogHeader>
            <div><Label className="text-xs">Category Name</Label><Input value={editName} onChange={e => setEditName(e.target.value)} className="mt-1" /></div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
              <Button onClick={handleSaveEdit} disabled={saving} className="bg-amber-600 hover:bg-amber-700">{saving ? 'Saving...' : 'Save'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader><AlertDialogTitle>Delete Category</AlertDialogTitle><AlertDialogDescription>Delete &quot;{deleteCat?.expense_category_name}&quot;? Categories with expenses cannot be deleted.</AlertDialogDescription></AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-red-600 hover:bg-red-700">{deleting ? 'Deleting...' : 'Delete'}</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}
