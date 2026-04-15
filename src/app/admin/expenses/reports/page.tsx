'use client';

import { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  TrendingDown, FileText, ChevronLeft, ChevronRight, Download, X,
  DollarSign, Filter, Calendar, CreditCard,
} from 'lucide-react';

interface Expense {
  id: number; title: string; description: string; amount: number;
  expense_date: string; payment_method: string; status: string;
  expense_category: { expense_category_name: string } | null;
}

function fmt(n: number) { return `GH₵ ${(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`; }
function fmtDate(d: string) { if (!d) return '—'; return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }); }

const methodColors: Record<string, string> = {
  cash: 'bg-emerald-100 text-emerald-700', mobile_money: 'bg-violet-100 text-violet-700',
  bank_transfer: 'bg-sky-100 text-sky-700', cheque: 'bg-amber-100 text-amber-700', card: 'bg-rose-100 text-rose-700',
};
const statusConfig: Record<string, { label: string; className: string }> = {
  approved: { label: 'Approved', className: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  pending: { label: 'Pending', className: 'bg-amber-100 text-amber-700 border-amber-200' },
  rejected: { label: 'Rejected', className: 'bg-red-100 text-red-700 border-red-200' },
};

export default function ExpenditureReportsPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(() => { const d = new Date(); d.setDate(1); return d.toISOString().split('T')[0]; });
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [categoryId, setCategoryId] = useState('');
  const [status, setStatus] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [categories, setCategories] = useState<{ expense_category_id: number; expense_category_name: string }[]>([]);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/expenses/categories');
      const data = await res.json();
      setCategories(data.categories || []);
    } catch { /* silent */ }
  }, []);

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);
      if (categoryId) params.set('categoryId', categoryId);
      if (status) params.set('status', status);
      if (paymentMethod) params.set('paymentMethod', paymentMethod);
      params.set('page', String(page));
      params.set('limit', '25');

      const res = await fetch(`/api/admin/expenses/reports?${params}`);
      const data = await res.json();
      setExpenses(data.expenses || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotal(data.pagination?.total || 0);
      setTotalAmount(data.summary?.totalAmount || 0);
    } catch { toast.error('Failed to load report'); }
    setLoading(false);
  }, [startDate, endDate, categoryId, status, paymentMethod, page]);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);
  useEffect(() => { fetchExpenses(); }, [fetchExpenses]);
  useEffect(() => { setPage(1); }, [startDate, endDate, categoryId, status, paymentMethod]);

  const hasFilters = startDate || endDate || categoryId || status || paymentMethod;

  const handleExport = () => {
    const csv = ['Title,Category,Amount,Date,Method,Status'];
    expenses.forEach(e => {
      csv.push(`"${e.title}","${e.expense_category?.expense_category_name || ''}",${e.amount},"${fmtDate(e.expense_date)}","${e.payment_method}","${e.status}"`);
    });
    csv.push(`\n,,,,Total,${totalAmount}`);
    const blob = new Blob([csv.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `expenditure-report-${startDate}-${endDate}.csv`;
    a.click(); URL.revokeObjectURL(url);
    toast({ title: 'Report exported as CSV' });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-md">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Expenditure Reports</h1>
              <p className="text-sm text-slate-500 mt-0.5">Detailed expense report with filters</p>
            </div>
          </div>
          <Button variant="outline" onClick={handleExport} className="gap-2">
            <Download className="w-4 h-4" /> Export CSV
          </Button>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <Card className="border-l-4 border-l-red-500">
            <CardContent className="p-4">
              <p className="text-xs text-slate-400">Total Expenses</p>
              <p className="text-xl font-bold">{total}</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-amber-500">
            <CardContent className="p-4">
              <p className="text-xs text-slate-400">Total Amount</p>
              <p className="text-xl font-bold font-mono text-red-600">{fmt(totalAmount)}</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-sky-500 col-span-2 sm:col-span-1">
            <CardContent className="p-4">
              <p className="text-xs text-slate-400">Period</p>
              <p className="text-sm font-mono">{startDate} — {endDate}</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
              <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
              <Select value={categoryId} onValueChange={v => setCategoryId(v === '__all__' ? '' : v)}>
                <SelectTrigger><SelectValue placeholder="All Categories" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All Categories</SelectItem>
                  {categories.map(c => <SelectItem key={c.expense_category_id} value={String(c.expense_category_id)}>{c.expense_category_name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={status} onValueChange={v => setStatus(v === '__all__' ? '' : v)}>
                <SelectTrigger><SelectValue placeholder="All Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All Status</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
              <Select value={paymentMethod} onValueChange={v => setPaymentMethod(v === '__all__' ? '' : v)}>
                <SelectTrigger><SelectValue placeholder="All Methods" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All Methods</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="mobile_money">Mobile Money</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                </SelectContent>
              </Select>
              {hasFilters && (
                <Button variant="outline" onClick={() => { setStartDate(''); setEndDate(''); setCategoryId(''); setStatus(''); setPaymentMethod(''); }} className="gap-1">
                  <X className="w-3.5 h-3.5" /> Clear
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Report Table */}
        <Card>
          <CardContent className="p-0">
            {/* Desktop */}
            <div className="hidden md:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-slate-50">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500">Title</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500">Category</th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500">Amount</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500">Date</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500">Method</th>
                    <th className="text-center py-3 px-4 text-xs font-semibold text-slate-500">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i}><td colSpan={6} className="py-3 px-4"><Skeleton className="h-4 w-full" /></td></tr>
                  )) : expenses.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-12 text-slate-400">
                      <TrendingDown className="w-10 h-10 mx-auto mb-2 opacity-50" /><p>No expenses found</p>
                    </td></tr>
                  ) : expenses.map(e => {
                    const sc = statusConfig[e.status] || statusConfig.pending;
                    return (
                      <tr key={e.id} className="border-b last:border-0 hover:bg-slate-50/50">
                        <td className="py-3 px-4">
                          <p className="font-medium">{e.title}</p>
                          {e.description && <p className="text-[10px] text-slate-400 truncate max-w-48">{e.description}</p>}
                        </td>
                        <td className="py-3 px-4 text-xs">{e.expense_category?.expense_category_name || '—'}</td>
                        <td className="py-3 px-4 text-right font-mono font-medium text-red-600">{fmt(e.amount)}</td>
                        <td className="py-3 px-4 text-xs text-slate-500">{fmtDate(e.expense_date)}</td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium capitalize ${methodColors[e.payment_method] || 'bg-gray-100 text-gray-600'}`}>
                            {(e.payment_method || 'cash').replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center"><Badge variant="outline" className={sc.className}>{sc.label}</Badge></td>
                      </tr>
                    );
                  })}
                </tbody>
                {expenses.length > 0 && (
                  <tfoot>
                    <tr className="bg-slate-50 font-bold">
                      <td colSpan={2} className="py-3 px-4 text-xs">GRAND TOTAL</td>
                      <td className="py-3 px-4 text-right font-mono text-red-600">{fmt(totalAmount)}</td>
                      <td colSpan={3} className="py-3 px-4 text-xs text-slate-400">{total} expenses</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>

            {/* Mobile */}
            <div className="md:hidden divide-y">
              {loading ? Array.from({ length: 3 }).map((_, i) => <div key={i} className="p-4"><Skeleton className="h-4 w-3/4" /></div>) :
                expenses.map(e => {
                  const sc = statusConfig[e.status] || statusConfig.pending;
                  return (
                    <div key={e.id} className="p-4 space-y-1">
                      <div className="flex items-start justify-between">
                        <div><p className="font-medium text-sm">{e.title}</p><p className="text-xs text-slate-400">{e.expense_category?.expense_category_name || '—'} · {fmtDate(e.expense_date)}</p></div>
                        <Badge variant="outline" className={sc.className}>{sc.label}</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className={`inline-flex px-2 py-0.5 rounded text-xs capitalize ${methodColors[e.payment_method] || 'bg-gray-100 text-gray-600'}`}>
                          {(e.payment_method || 'cash').replace(/_/g, ' ')}
                        </span>
                        <span className="font-mono font-bold text-red-600">{fmt(e.amount)}</span>
                      </div>
                    </div>
                  );
                })}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t">
                <p className="text-xs text-slate-500">{total} expenses</p>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="icon" className="h-8 w-8" disabled={page <= 1} onClick={() => setPage(p => p - 1)}><ChevronLeft className="w-4 h-4" /></Button>
                  <span className="text-sm px-2">{page}/{totalPages}</span>
                  <Button variant="outline" size="icon" className="h-8 w-8" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}><ChevronRight className="w-4 h-4" /></Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
