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
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Printer, Search, FileText, X, Calendar, ChevronLeft, ChevronRight, Eye,
} from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';

interface Receipt {
  receipt_id: number; receipt_number: string; amount: number;
  payment_method: string; receipt_type: string; generated_at: string;
  student: { student_id: number; name: string; student_code: string };
  parent?: { parent_id: number; name: string; phone: string } | null;
  payment?: { payment_id: number; payment_method: string; amount: number } | null;
}

function fmt(n: number) { return `GH₵ ${(n || 0).toFixed(2)}`; }
function fmtDate(d: string) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}
function fmtTime(d: string) {
  if (!d) return '';
  return new Date(d).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

export default function PrintReceiptsPage() {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);

  const fetchReceipts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);
      if (search) params.set('search', search);
      params.set('page', String(page));
      params.set('limit', '15');

      const res = await fetch(`/api/admin/receipts?${params}`);
      const data = await res.json();
      setReceipts(data.receipts || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotal(data.pagination?.total || 0);
      setTotalAmount(data.summary?.totalAmount || 0);
    } catch { toast.error('Failed to load receipts'); }
    setLoading(false);
  }, [startDate, endDate, search, page]);

  useEffect(() => { fetchReceipts(); }, [fetchReceipts]);
  useEffect(() => { setPage(1); }, [startDate, endDate, search]);

  const handlePrint = (receipt: Receipt) => {
    const w = window.open('', '_blank', 'width=400,height=600');
    if (!w) return;
    w.document.write(`
      <html><head><title>Receipt ${receipt.receipt_number}</title><style>
        body{font-family:Arial,sans-serif;padding:20px;max-width:350px;margin:auto}
        .center{text-align:center}.bold{font-weight:bold}
        .line{border-top:1px dashed #333;margin:10px 0}
        .row{display:flex;justify-content:space-between;margin:4px 0}
        h2{margin:0}.sm{font-size:12px;color:#666}
      </style></head><body>
        <div class="center"><h2>SCHOOL FEE RECEIPT</h2></div>
        <div class="line"></div>
        <div class="row"><span>Receipt No:</span><span class="bold">${receipt.receipt_number}</span></div>
        <div class="row"><span>Date:</span><span>${fmtDate(receipt.generated_at)}</span></div>
        <div class="line"></div>
        <div class="row"><span>Student:</span><span class="bold">${receipt.student?.name || '—'}</span></div>
        <div class="row"><span>Code:</span><span>${receipt.student?.student_code || '—'}</span></div>
        ${receipt.parent ? `<div class="row"><span>Parent:</span><span>${receipt.parent.name}</span></div>` : ''}
        <div class="line"></div>
        <div class="row"><span>Amount:</span><span class="bold" style="font-size:16px">${fmt(receipt.amount)}</span></div>
        <div class="row"><span>Method:</span><span>${(receipt.payment_method || 'cash').replace(/_/g, ' ').toUpperCase()}</span></div>
        <div class="row"><span>Type:</span><span>${(receipt.receipt_type || 'general').replace(/_/g, ' ')}</span></div>
        <div class="line"></div>
        <p class="center sm">Thank you for your payment!</p>
      </body></html>
    `);
    w.document.close();
    setTimeout(() => w.print(), 300);
  };

  const hasFilters = startDate || endDate || search;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center shadow-md">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Print Receipts</h1>
              <p className="text-sm text-slate-500 mt-0.5">Search and print payment receipts</p>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <Card className="border-l-4 border-l-emerald-500">
            <CardContent className="p-4">
              <p className="text-xs text-slate-400 font-medium">Total Receipts</p>
              <p className="text-xl font-bold font-mono">{total}</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-violet-500">
            <CardContent className="p-4">
              <p className="text-xs text-slate-400 font-medium">Total Amount</p>
              <p className="text-xl font-bold font-mono text-violet-600">{fmt(totalAmount)}</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-rose-500 col-span-2 sm:col-span-1">
            <CardContent className="p-4">
              <p className="text-xs text-slate-400 font-medium">Period</p>
              <p className="text-sm font-mono">{startDate} — {endDate}</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input placeholder="Search name or receipt..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-xs whitespace-nowrap">From:</Label>
                <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-xs whitespace-nowrap">To:</Label>
                <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
              </div>
              {hasFilters && (
                <Button variant="outline" onClick={() => { setSearch(''); setStartDate(''); setEndDate(''); }} className="gap-1">
                  <X className="w-3.5 h-3.5" /> Clear
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Receipt List */}
        <Card>
          <CardContent className="p-0">
            <div className="hidden md:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-slate-50">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500">Receipt #</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500">Student</th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500">Amount</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500">Date</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500">Method</th>
                    <th className="text-center py-3 px-4 text-xs font-semibold text-slate-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}><td colSpan={6} className="py-3 px-4"><Skeleton className="h-4 w-full" /></td></tr>
                  )) : receipts.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-12 text-slate-400">
                      <FileText className="w-10 h-10 mx-auto mb-2 opacity-50" /><p>No receipts found</p>
                    </td></tr>
                  ) : receipts.map(r => (
                    <tr key={r.receipt_id} className="border-b last:border-0 hover:bg-slate-50/50">
                      <td className="py-3 px-4 font-mono text-xs">{r.receipt_number || `RCP-${String(r.receipt_id).padStart(5, '0')}`}</td>
                      <td className="py-3 px-4">
                        <p className="font-medium text-sm">{r.student?.name || '—'}</p>
                        <p className="text-[10px] text-slate-400">{r.student?.student_code}</p>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600">{fmt(r.amount)}</td>
                      <td className="py-3 px-4 text-xs text-slate-500">{fmtDate(r.generated_at)}</td>
                      <td className="py-3 px-4">
                        <Badge variant="secondary" className="text-[10px] h-5">
                          {(r.payment_method || 'cash').replace(/_/g, ' ')}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => setSelectedReceipt(r)}>
                            <Eye className="w-3.5 h-3.5 mr-1" /> View
                          </Button>
                          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => handlePrint(r)}>
                            <Printer className="w-3.5 h-3.5 mr-1" /> Print
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile */}
            <div className="md:hidden divide-y">
              {loading ? Array.from({ length: 3 }).map((_, i) => <div key={i} className="p-4"><Skeleton className="h-4 w-3/4" /></div>) :
                receipts.map(r => (
                  <div key={r.receipt_id} className="p-4 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-sm">{r.student?.name || '—'}</p>
                        <p className="text-xs text-slate-400">{r.receipt_number} · {fmtDate(r.generated_at)}</p>
                      </div>
                      <span className="font-mono font-bold text-emerald-600">{fmt(r.amount)}</span>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1 h-8 text-xs" onClick={() => setSelectedReceipt(r)}>
                        <Eye className="w-3 h-3 mr-1" /> View
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1 h-8 text-xs" onClick={() => handlePrint(r)}>
                        <Printer className="w-3 h-3 mr-1" /> Print
                      </Button>
                    </div>
                  </div>
                ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t">
                <p className="text-xs text-slate-500">{total} receipt(s)</p>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="icon" className="h-8 w-8" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-sm px-2">{page} / {totalPages}</span>
                  <Button variant="outline" size="icon" className="h-8 w-8" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Preview Dialog */}
        <Dialog open={!!selectedReceipt} onOpenChange={() => setSelectedReceipt(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Receipt Preview</DialogTitle>
            </DialogHeader>
            {selectedReceipt && (
              <div className="border rounded-lg p-6 space-y-4 font-mono text-sm">
                <div className="text-center">
                  <h2 className="font-bold text-lg">SCHOOL FEE RECEIPT</h2>
                  <div className="border-t border-dashed border-slate-300 my-3" />
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between"><span>Receipt:</span><span className="font-bold">{selectedReceipt.receipt_number || `RCP-${String(selectedReceipt.receipt_id).padStart(5, '0')}`}</span></div>
                  <div className="flex justify-between"><span>Date:</span><span>{fmtDate(selectedReceipt.generated_at)}</span></div>
                </div>
                <div className="border-t border-dashed border-slate-300 my-2" />
                <div className="space-y-1">
                  <div className="flex justify-between"><span>Student:</span><span className="font-bold">{selectedReceipt.student?.name || '—'}</span></div>
                  <div className="flex justify-between"><span>Code:</span><span>{selectedReceipt.student?.student_code || '—'}</span></div>
                  {selectedReceipt.parent && <div className="flex justify-between"><span>Parent:</span><span>{selectedReceipt.parent.name}</span></div>}
                </div>
                <div className="border-t border-dashed border-slate-300 my-2" />
                <div className="space-y-1">
                  <div className="flex justify-between text-base"><span className="font-bold">Amount:</span><span className="font-bold">{fmt(selectedReceipt.amount)}</span></div>
                  <div className="flex justify-between"><span>Method:</span><span>{(selectedReceipt.payment_method || 'cash').replace(/_/g, ' ').toUpperCase()}</span></div>
                  <div className="flex justify-between"><span>Type:</span><span>{(selectedReceipt.receipt_type || 'general').replace(/_/g, ' ')}</span></div>
                </div>
                <div className="border-t border-dashed border-slate-300 my-2" />
                <p className="text-center text-xs text-slate-400">Thank you for your payment!</p>
                <div className="flex justify-end pt-2">
                  <Button onClick={() => handlePrint(selectedReceipt)} className="bg-rose-600 hover:bg-rose-700">
                    <Printer className="w-4 h-4 mr-2" /> Print Receipt
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
