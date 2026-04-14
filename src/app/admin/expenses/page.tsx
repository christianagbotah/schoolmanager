'use client';

import { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  Plus,
  DollarSign,
  Trash2,
  Pencil,
  ChevronLeft,
  ChevronRight,
  Receipt,
  Tag,
  TrendingDown,
  FolderOpen,
  X,
} from 'lucide-react';

interface Expense {
  id: number;
  title: string;
  description: string;
  category_id: number | null;
  amount: number;
  expense_date: string;
  payment_method: string;
  status: string;
  expense_category: {
    expense_category_id: number;
    expense_category_name: string;
  } | null;
}

interface ExpenseCategory {
  expense_category_id: number;
  expense_category_name: string;
  expenseCount: number;
  totalAmount: number;
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-UG', { style: 'currency', currency: 'UGX', minimumFractionDigits: 0 }).format(amount);
}

function formatDate(dateStr: string) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

const methodColors: Record<string, string> = {
  cash: 'bg-emerald-100 text-emerald-700',
  mobile_money: 'bg-violet-100 text-violet-700',
  bank_transfer: 'bg-sky-100 text-sky-700',
  cheque: 'bg-amber-100 text-amber-700',
  card: 'bg-rose-100 text-rose-700',
};

const statusConfig: Record<string, { label: string; className: string }> = {
  approved: { label: 'Approved', className: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  pending: { label: 'Pending', className: 'bg-amber-100 text-amber-700 border-amber-200' },
  rejected: { label: 'Rejected', className: 'bg-red-100 text-red-700 border-red-200' },
};

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryId, setCategoryId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [summary, setSummary] = useState({ monthTotal: 0, categoryBreakdown: [] as { category: string; amount: number }[] });
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  // Add Expense Dialog
  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState({
    title: '',
    description: '',
    categoryId: '',
    amount: '',
    expenseDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'cash',
  });
  const [adding, setAdding] = useState(false);

  // Edit Dialog
  const [editOpen, setEditOpen] = useState(false);
  const [editExpense, setEditExpense] = useState<Expense | null>(null);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    categoryId: '',
    amount: '',
    expenseDate: '',
    paymentMethod: '',
    status: '',
  });
  const [editing, setEditing] = useState(false);

  // Delete Dialog
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  // New Category Dialog
  const [catOpen, setCatOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [creatingCat, setCreatingCat] = useState(false);

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (categoryId) params.set('categoryId', categoryId);
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);
      if (status) params.set('status', status);
      params.set('page', String(page));
      params.set('limit', '15');

      const res = await fetch(`/api/expenses?${params}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setExpenses(data.expenses || []);
      setSummary(data.summary || { monthTotal: 0, categoryBreakdown: [] });
      setTotalPages(data.pagination?.totalPages || 1);
      setTotal(data.pagination?.total || 0);
    } catch {
      toast.error('Failed to load expenses');
    } finally {
      setLoading(false);
    }
  }, [categoryId, startDate, endDate, status, page]);

  const fetchCategories = useCallback(async () => {
    setCategoriesLoading(true);
    try {
      const res = await fetch('/api/expense-categories');
      const data = await res.json();
      setCategories(data || []);
    } catch {
      // silent
    } finally {
      setCategoriesLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    setPage(1);
  }, [categoryId, startDate, endDate, status]);

  const handleAddExpense = async () => {
    if (!addForm.title || !addForm.amount) {
      toast.error('Title and amount are required');
      return;
    }
    setAdding(true);
    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: addForm.title,
          description: addForm.description,
          categoryId: addForm.categoryId || null,
          amount: addForm.amount,
          expenseDate: addForm.expenseDate,
          paymentMethod: addForm.paymentMethod,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast.success('Expense created');
      setAddOpen(false);
      setAddForm({ title: '', description: '', categoryId: '', amount: '', expenseDate: new Date().toISOString().split('T')[0], paymentMethod: 'cash' });
      fetchExpenses();
      fetchCategories();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create expense');
    } finally {
      setAdding(false);
    }
  };

  const handleEditExpense = (exp: Expense) => {
    setEditExpense(exp);
    setEditForm({
      title: exp.title,
      description: exp.description,
      categoryId: exp.category_id ? String(exp.category_id) : '',
      amount: String(exp.amount),
      expenseDate: exp.expense_date ? new Date(exp.expense_date).toISOString().split('T')[0] : '',
      paymentMethod: exp.payment_method,
      status: exp.status,
    });
    setEditOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editExpense) return;
    setEditing(true);
    try {
      const res = await fetch(`/api/expenses/${editExpense.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editForm.title,
          description: editForm.description,
          categoryId: editForm.categoryId || null,
          amount: editForm.amount,
          expenseDate: editForm.expenseDate,
          paymentMethod: editForm.paymentMethod,
          status: editForm.status,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast.success('Expense updated');
      setEditOpen(false);
      fetchExpenses();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update expense');
    } finally {
      setEditing(false);
    }
  };

  const handleDeleteExpense = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/expenses/${deleteId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast.success('Expense deleted');
      setDeleteOpen(false);
      setDeleteId(null);
      fetchExpenses();
      fetchCategories();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete expense');
    } finally {
      setDeleting(false);
    }
  };

  const handleCreateCategory = async () => {
    if (!newCatName.trim()) {
      toast.error('Category name is required');
      return;
    }
    setCreatingCat(true);
    try {
      const res = await fetch('/api/expense-categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCatName.trim() }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast.success('Category created');
      setCatOpen(false);
      setNewCatName('');
      fetchCategories();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create category');
    } finally {
      setCreatingCat(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Expenses</h1>
            <p className="text-sm text-slate-500 mt-1">Track and manage school expenses</p>
          </div>
          <Button
            onClick={() => setAddOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Expense
          </Button>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border-emerald-100">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">This Month Total</p>
                  <p className="text-lg font-bold text-red-600">{formatCurrency(summary.monthTotal)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-emerald-100 sm:col-span-2">
            <CardContent className="p-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">By Category This Month</p>
              {summary.categoryBreakdown.length === 0 ? (
                <p className="text-sm text-slate-400">No expenses this month</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {summary.categoryBreakdown.map((cb, i) => (
                    <div key={i} className="flex items-center justify-between text-sm bg-slate-50 rounded px-2.5 py-1.5">
                      <span className="text-slate-600 truncate">{cb.category}</span>
                      <span className="font-mono font-medium text-red-600 ml-2">{formatCurrency(cb.amount)}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="expenses" className="space-y-4">
          <TabsList>
            <TabsTrigger value="expenses" className="gap-1.5">
              <Receipt className="w-3.5 h-3.5" />
              Expenses
            </TabsTrigger>
            <TabsTrigger value="categories" className="gap-1.5">
              <Tag className="w-3.5 h-3.5" />
              Categories
            </TabsTrigger>
          </TabsList>

          {/* Expenses Tab */}
          <TabsContent value="expenses" className="space-y-4">
            {/* Filters */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col lg:flex-row gap-3">
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 flex-1">
                    <Select value={categoryId} onValueChange={(v) => v === '__all__' ? setCategoryId('') : setCategoryId(v)}>
                      <SelectTrigger className="w-full"><SelectValue placeholder="All Categories" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__all__">All Categories</SelectItem>
                        {categories.map((c) => (
                          <SelectItem key={c.expense_category_id} value={String(c.expense_category_id)}>{c.expense_category_name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full" />
                    <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full" />
                    <Select value={status} onValueChange={(v) => v === '__all__' ? setStatus('') : setStatus(v)}>
                      <SelectTrigger className="w-full"><SelectValue placeholder="All Status" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__all__">All Status</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                    {(categoryId || startDate || endDate || status) && (
                      <Button variant="outline" onClick={() => { setCategoryId(''); setStartDate(''); setEndDate(''); setStatus(''); }} className="gap-1">
                        <X className="w-3.5 h-3.5" />Clear
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Table */}
            <Card>
              <CardContent className="p-0">
                <div className="hidden md:block">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50">
                        <TableHead className="text-xs font-semibold">Title</TableHead>
                        <TableHead className="text-xs font-semibold">Category</TableHead>
                        <TableHead className="text-xs font-semibold text-right">Amount</TableHead>
                        <TableHead className="text-xs font-semibold">Date</TableHead>
                        <TableHead className="text-xs font-semibold">Method</TableHead>
                        <TableHead className="text-xs font-semibold">Status</TableHead>
                        <TableHead className="text-xs font-semibold text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        Array.from({ length: 5 }).map((_, i) => (
                          <TableRow key={i}>
                            {Array.from({ length: 7 }).map((_, j) => (
                              <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                            ))}
                          </TableRow>
                        ))
                      ) : expenses.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-12 text-slate-400">
                            <TrendingDown className="w-10 h-10 mx-auto mb-2 opacity-50" />
                            <p>No expenses found</p>
                          </TableCell>
                        </TableRow>
                      ) : (
                        expenses.map((exp) => {
                          const sc = statusConfig[exp.status] || statusConfig.pending;
                          return (
                            <TableRow key={exp.id} className="hover:bg-slate-50/50">
                              <TableCell>
                                <p className="font-medium text-sm">{exp.title}</p>
                                {exp.description && <p className="text-xs text-slate-400 truncate max-w-48">{exp.description}</p>}
                              </TableCell>
                              <TableCell className="text-sm">{exp.expense_category?.expense_category_name || '—'}</TableCell>
                              <TableCell className="text-right font-mono text-sm font-medium text-red-600">{formatCurrency(exp.amount)}</TableCell>
                              <TableCell className="text-xs text-slate-500">{formatDate(exp.expense_date)}</TableCell>
                              <TableCell>
                                <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium capitalize ${methodColors[exp.payment_method] || 'bg-gray-100 text-gray-600'}`}>
                                  {exp.payment_method.replace(/_/g, ' ')}
                                </span>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className={sc.className}>{sc.label}</Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditExpense(exp)} title="Edit">
                                    <Pencil className="w-3.5 h-3.5" />
                                  </Button>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600" onClick={() => { setDeleteId(exp.id); setDeleteOpen(true); }} title="Delete">
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile */}
                <div className="md:hidden divide-y">
                  {loading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="p-4 space-y-2"><Skeleton className="h-4 w-3/4" /><Skeleton className="h-3 w-1/2" /></div>
                    ))
                  ) : expenses.length === 0 ? (
                    <div className="text-center py-12 text-slate-400">
                      <TrendingDown className="w-10 h-10 mx-auto mb-2 opacity-50" />
                      <p>No expenses found</p>
                    </div>
                  ) : (
                    expenses.map((exp) => {
                      const sc = statusConfig[exp.status] || statusConfig.pending;
                      return (
                        <div key={exp.id} className="p-4 space-y-2">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-medium text-sm">{exp.title}</p>
                              <p className="text-xs text-slate-400">{exp.expense_category?.expense_category_name || 'Uncategorized'} &middot; {formatDate(exp.expense_date)}</p>
                            </div>
                            <Badge variant="outline" className={sc.className}>{sc.label}</Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium capitalize ${methodColors[exp.payment_method] || 'bg-gray-100 text-gray-600'}`}>
                              {exp.payment_method.replace(/_/g, ' ')}
                            </span>
                            <span className="font-mono font-bold text-red-600">{formatCurrency(exp.amount)}</span>
                          </div>
                          <div className="flex gap-2 pt-1">
                            <Button variant="outline" size="sm" className="flex-1 h-8 text-xs" onClick={() => handleEditExpense(exp)}><Pencil className="w-3 h-3 mr-1" />Edit</Button>
                            <Button variant="outline" size="sm" className="h-8 text-xs text-red-500" onClick={() => { setDeleteId(exp.id); setDeleteOpen(true); }}><Trash2 className="w-3 h-3" /></Button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-4 py-3 border-t">
                    <p className="text-xs text-slate-500">{total} expense(s)</p>
                    <div className="flex items-center gap-1">
                      <Button variant="outline" size="icon" className="h-8 w-8" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <span className="text-sm px-2">{page} / {totalPages}</span>
                      <Button variant="outline" size="icon" className="h-8 w-8" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Categories Tab */}
          <TabsContent value="categories" className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">{categories.length} categories</p>
              <Button size="sm" onClick={() => setCatOpen(true)} className="bg-emerald-600 hover:bg-emerald-700">
                <Plus className="w-3.5 h-3.5 mr-1" />New Category
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {categoriesLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i}><CardContent className="p-4"><Skeleton className="h-6 w-full mb-2" /><Skeleton className="h-4 w-2/3" /></CardContent></Card>
                ))
              ) : categories.length === 0 ? (
                <Card className="sm:col-span-2 lg:col-span-3">
                  <CardContent className="py-12 text-center text-slate-400">
                    <FolderOpen className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <p>No categories yet</p>
                  </CardContent>
                </Card>
              ) : (
                categories.map((cat) => (
                  <Card key={cat.expense_category_id} className="hover:border-emerald-200 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                          <Tag className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{cat.expense_category_name}</p>
                          <p className="text-xs text-slate-400">{cat.expenseCount} expense(s) &middot; {formatCurrency(cat.totalAmount)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Add Expense Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Expense</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs">Title *</Label>
              <Input value={addForm.title} onChange={(e) => setAddForm({ ...addForm, title: e.target.value })} placeholder="e.g., Office Supplies" className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Description</Label>
              <Input value={addForm.description} onChange={(e) => setAddForm({ ...addForm, description: e.target.value })} placeholder="Optional details" className="mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Category</Label>
                <Select value={addForm.categoryId} onValueChange={(v) => setAddForm({ ...addForm, categoryId: v === '__none__' ? '' : v })}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">No category</SelectItem>
                    {categories.map((c) => (
                      <SelectItem key={c.expense_category_id} value={String(c.expense_category_id)}>{c.expense_category_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Amount *</Label>
                <Input type="number" value={addForm.amount} onChange={(e) => setAddForm({ ...addForm, amount: e.target.value })} placeholder="0" className="mt-1 font-mono" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Date</Label>
                <Input type="date" value={addForm.expenseDate} onChange={(e) => setAddForm({ ...addForm, expenseDate: e.target.value })} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">Payment Method</Label>
                <Select value={addForm.paymentMethod} onValueChange={(v) => setAddForm({ ...addForm, paymentMethod: v })}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="mobile_money">Mobile Money</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="cheque">Cheque</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={handleAddExpense} disabled={adding} className="bg-emerald-600 hover:bg-emerald-700">
              {adding ? 'Adding...' : 'Add Expense'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Expense Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Expense</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs">Title</Label>
              <Input value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Description</Label>
              <Input value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} className="mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Category</Label>
                <Select value={editForm.categoryId} onValueChange={(v) => setEditForm({ ...editForm, categoryId: v === '__none__' ? '' : v })}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">No category</SelectItem>
                    {categories.map((c) => (
                      <SelectItem key={c.expense_category_id} value={String(c.expense_category_id)}>{c.expense_category_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Amount</Label>
                <Input type="number" value={editForm.amount} onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })} className="mt-1 font-mono" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs">Date</Label>
                <Input type="date" value={editForm.expenseDate} onChange={(e) => setEditForm({ ...editForm, expenseDate: e.target.value })} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">Method</Label>
                <Select value={editForm.paymentMethod} onValueChange={(v) => setEditForm({ ...editForm, paymentMethod: v })}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="mobile_money">Mobile Money</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="cheque">Cheque</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Status</Label>
                <Select value={editForm.status} onValueChange={(v) => setEditForm({ ...editForm, status: v })}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveEdit} disabled={editing} className="bg-emerald-600 hover:bg-emerald-700">
              {editing ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Expense</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-600">Are you sure you want to delete this expense? This action cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancel</Button>
            <Button onClick={handleDeleteExpense} disabled={deleting} variant="destructive">
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Category Dialog */}
      <Dialog open={catOpen} onOpenChange={setCatOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>New Expense Category</DialogTitle>
          </DialogHeader>
          <div>
            <Label className="text-xs">Category Name</Label>
            <Input
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              placeholder="e.g., Utilities"
              className="mt-1"
              onKeyDown={(e) => e.key === 'Enter' && handleCreateCategory()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCatOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateCategory} disabled={creatingCat} className="bg-emerald-600 hover:bg-emerald-700">
              {creatingCat ? 'Creating...' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
