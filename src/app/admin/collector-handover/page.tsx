'use client';

import { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  ArrowRightLeft, CheckCircle, XCircle, Clock, Plus, Users,
  Banknote, Smartphone, Building, Shield, Loader2, Calendar,
} from 'lucide-react';

interface Handover {
  id: number;
  from_collector: string;
  to_collector: string;
  handover_date: string;
  cash_amount: number;
  momo_amount: number;
  bank_amount: number;
  total_amount: number;
  transaction_count: number;
  notes: string;
  status: string;
  verified_by: string;
  verified_at: string | null;
  created_at: string;
}

interface CollectorToday {
  name: string;
  cash: number;
  momo: number;
  bank: number;
  total: number;
  count: number;
}

function fmt(n: number) { return `GH\u20B5 ${(n || 0).toFixed(2)}`; }
function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

const statusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pending Verification', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  verified: { label: 'Verified', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-700 border-red-200' },
};

export default function CollectorHandoverPage() {
  const [handovers, setHandovers] = useState<Handover[]>([]);
  const [collectors, setCollectors] = useState<CollectorToday[]>([]);
  const [stats, setStats] = useState({ pending: 0, verified: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [actionDialog, setActionDialog] = useState<{ open: boolean; handover: Handover | null; action: 'verify' | 'reject' }>({ open: false, handover: null, action: 'verify' });
  const [processing, setProcessing] = useState(false);
  const [form, setForm] = useState({ from_collector: '', to_collector: '', cash_amount: '', momo_amount: '', bank_amount: '', notes: '' });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/collector-handover');
      const data = await res.json();
      setHandovers(data.handovers || []);
      setCollectors(data.collectorsToday || []);
      setStats(data.stats || { pending: 0, verified: 0, total: 0 });
    } catch { toast.error('Failed to load handover data'); } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCreate = async () => {
    if (!form.from_collector || !form.to_collector) {
      toast.error('From and To collector are required');
      return;
    }
    setProcessing(true);
    try {
      const res = await fetch('/api/admin/collector-handover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          from_collector: form.from_collector,
          to_collector: form.to_collector,
          cash_amount: parseFloat(form.cash_amount) || 0,
          momo_amount: parseFloat(form.momo_amount) || 0,
          bank_amount: parseFloat(form.bank_amount) || 0,
          notes: form.notes,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast.success(data.message);
      setCreateOpen(false);
      setForm({ from_collector: '', to_collector: '', cash_amount: '', momo_amount: '', bank_amount: '', notes: '' });
      fetchData();
    } catch (err: any) { toast.error(err.message); } finally { setProcessing(false); }
  };

  const handleAction = async () => {
    if (!actionDialog.handover) return;
    setProcessing(true);
    try {
      const res = await fetch('/api/admin/collector-handover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: actionDialog.action,
          id: actionDialog.handover.id,
          verified_by: 'Admin',
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast.success(data.message);
      setActionDialog({ open: false, handover: null, action: 'verify' });
      fetchData();
    } catch (err: any) { toast.error(err.message); } finally { setProcessing(false); }
  };

  const prefillFromCollector = (name: string) => {
    setForm(prev => ({ ...prev, from_collector: name }));
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center shadow-md">
                <ArrowRightLeft className="w-5 h-5 text-white" />
              </div>
              Collector Handover
            </h1>
            <p className="text-sm text-slate-500 mt-1 ml-[52px]">Manage handover records between fee collectors</p>
          </div>
          <Button onClick={() => setCreateOpen(true)} className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white shadow-md">
            <Plus className="w-4 h-4 mr-2" />New Handover
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Pending', count: stats.pending, icon: Clock, color: 'from-amber-500 to-orange-500' },
            { label: 'Verified', count: stats.verified, icon: CheckCircle, color: 'from-emerald-500 to-teal-500' },
            { label: 'Total Records', count: stats.total, icon: Shield, color: 'from-sky-500 to-cyan-500' },
          ].map(s => (
            <Card key={s.label}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${s.color} flex items-center justify-center shadow-sm`}>
                  <s.icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wide">{s.label}</p>
                  <p className="text-xl font-bold text-slate-900">{s.count}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Today's Collector Summary */}
        {collectors.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2"><Users className="w-4 h-4 text-slate-400" />Today&apos;s Collections by Collector</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {collectors.map((c, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 cursor-pointer transition-colors" onClick={() => prefillFromCollector(c.name)}>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{c.name}</p>
                      <p className="text-[10px] text-slate-400">{c.count} transactions</p>
                      <div className="flex gap-2 mt-1 text-[10px]">
                        <span className="text-slate-400"><Banknote className="w-3 h-3 inline" /> {fmt(c.cash)}</span>
                        <span className="text-slate-400"><Smartphone className="w-3 h-3 inline" /> {fmt(c.momo)}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold font-mono text-emerald-600">{fmt(c.total)}</p>
                      <Button variant="ghost" size="sm" className="text-[10px] h-6 mt-1">Use as From</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Handover Records */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Handover Records</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-4 space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
            ) : handovers.length === 0 ? (
              <div className="text-center py-16 text-slate-400">
                <ArrowRightLeft className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No handover records yet</p>
              </div>
            ) : (
              <ScrollArea className="max-h-[500px]">
                <div className="hidden md:block">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50">
                        <TableHead className="text-xs">From</TableHead>
                        <TableHead className="text-xs">To</TableHead>
                        <TableHead className="text-xs text-right">Cash</TableHead>
                        <TableHead className="text-xs text-right">MoMo</TableHead>
                        <TableHead className="text-xs text-right">Bank</TableHead>
                        <TableHead className="text-xs text-right">Total</TableHead>
                        <TableHead className="text-xs">Status</TableHead>
                        <TableHead className="text-xs">Date</TableHead>
                        <TableHead className="text-xs">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {handovers.map((h) => {
                        const stCfg = statusConfig[h.status] || statusConfig.pending;
                        return (
                          <TableRow key={h.id} className="hover:bg-slate-50/50">
                            <TableCell className="text-sm font-medium">{h.from_collector}</TableCell>
                            <TableCell className="text-sm">{h.to_collector}</TableCell>
                            <TableCell className="text-xs font-mono text-right">{fmt(h.cash_amount)}</TableCell>
                            <TableCell className="text-xs font-mono text-right">{fmt(h.momo_amount)}</TableCell>
                            <TableCell className="text-xs font-mono text-right">{fmt(h.bank_amount)}</TableCell>
                            <TableCell className="text-sm font-mono font-bold text-right">{fmt(h.total_amount)}</TableCell>
                            <TableCell><Badge variant="outline" className={`${stCfg.color} text-[10px]`}>{stCfg.label}</Badge></TableCell>
                            <TableCell className="text-xs text-slate-500">{formatDate(h.handover_date)}</TableCell>
                            <TableCell>
                              {h.status === 'pending' && (
                                <div className="flex gap-1">
                                  <Button size="sm" className="h-7 bg-emerald-500 hover:bg-emerald-600 text-white" onClick={() => setActionDialog({ open: true, handover: h, action: 'verify' })}>
                                    <CheckCircle className="w-3 h-3" />
                                  </Button>
                                  <Button size="sm" variant="outline" className="h-7 text-red-600 hover:bg-red-50 border-red-200" onClick={() => setActionDialog({ open: true, handover: h, action: 'reject' })}>
                                    <XCircle className="w-3 h-3" />
                                  </Button>
                                </div>
                              )}
                              {h.verified_by && <p className="text-[10px] text-slate-400">By {h.verified_by}</p>}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
                <div className="md:hidden divide-y">
                  {handovers.map((h) => {
                    const stCfg = statusConfig[h.status] || statusConfig.pending;
                    return (
                      <div key={h.id} className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <ArrowRightLeft className="w-4 h-4 text-slate-400" />
                            <span className="text-sm font-medium">{h.from_collector} → {h.to_collector}</span>
                          </div>
                          <Badge variant="outline" className={`${stCfg.color} text-[10px]`}>{stCfg.label}</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="text-xs text-slate-400">{formatDate(h.handover_date)}</div>
                          <p className="font-mono font-bold text-sm">{fmt(h.total_amount)}</p>
                        </div>
                        <div className="flex gap-2 mt-2 text-[10px] text-slate-400">
                          <span>Cash: {fmt(h.cash_amount)}</span>
                          <span>MoMo: {fmt(h.momo_amount)}</span>
                          <span>Bank: {fmt(h.bank_amount)}</span>
                        </div>
                        {h.status === 'pending' && (
                          <div className="flex gap-2 mt-3">
                            <Button size="sm" className="h-7 bg-emerald-500 hover:bg-emerald-600 text-white flex-1" onClick={() => setActionDialog({ open: true, handover: h, action: 'verify' })}>
                              <CheckCircle className="w-3 h-3 mr-1" />Verify
                            </Button>
                            <Button size="sm" variant="outline" className="h-7 text-red-600 hover:bg-red-50 border-red-200 flex-1" onClick={() => setActionDialog({ open: true, handover: h, action: 'reject' })}>
                              <XCircle className="w-3 h-3 mr-1" />Reject
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        {/* Create Dialog */}
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2"><Plus className="w-5 h-5 text-teal-500" />New Handover Record</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">From Collector</Label>
                  <Input value={form.from_collector} onChange={(e) => setForm(p => ({ ...p, from_collector: e.target.value }))} placeholder="Collector name" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">To Collector</Label>
                  <Input value={form.to_collector} onChange={(e) => setForm(p => ({ ...p, to_collector: e.target.value }))} placeholder="Recipient name" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Cash Amount</Label>
                  <Input type="number" value={form.cash_amount} onChange={(e) => setForm(p => ({ ...p, cash_amount: e.target.value }))} placeholder="0.00" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">MoMo Amount</Label>
                  <Input type="number" value={form.momo_amount} onChange={(e) => setForm(p => ({ ...p, momo_amount: e.target.value }))} placeholder="0.00" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Bank Amount</Label>
                  <Input type="number" value={form.bank_amount} onChange={(e) => setForm(p => ({ ...p, bank_amount: e.target.value }))} placeholder="0.00" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Notes</Label>
                <Textarea value={form.notes} onChange={(e) => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Optional notes..." rows={2} />
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <span className="text-sm font-medium">Total</span>
                <span className="text-lg font-bold font-mono text-teal-600">{fmt((parseFloat(form.cash_amount) || 0) + (parseFloat(form.momo_amount) || 0) + (parseFloat(form.bank_amount) || 0))}</span>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setCreateOpen(false)} className="flex-1">Cancel</Button>
                <Button onClick={handleCreate} disabled={processing} className="flex-1 bg-teal-500 hover:bg-teal-600 text-white">
                  {processing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Create Record
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Verify/Reject Dialog */}
        <Dialog open={actionDialog.open} onOpenChange={(o) => setActionDialog({ open: o, handover: null, action: 'verify' })}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {actionDialog.action === 'verify' ? <CheckCircle className="w-5 h-5 text-emerald-500" /> : <XCircle className="w-5 h-5 text-red-500" />}
                {actionDialog.action === 'verify' ? 'Verify Handover' : 'Reject Handover'}
              </DialogTitle>
            </DialogHeader>
            {actionDialog.handover && (
              <div className="space-y-4">
                <div className="bg-slate-50 rounded-lg p-3 space-y-1">
                  <p className="text-sm"><strong>{actionDialog.handover.from_collector}</strong> → <strong>{actionDialog.handover.to_collector}</strong></p>
                  <p className="text-sm font-mono font-bold">{fmt(actionDialog.handover.total_amount)}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setActionDialog({ open: false, handover: null, action: 'verify' })} className="flex-1">Cancel</Button>
                  <Button onClick={handleAction} disabled={processing} className={`flex-1 ${actionDialog.action === 'verify' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-red-500 hover:bg-red-600'} text-white`}>
                    {processing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {actionDialog.action === 'verify' ? 'Verify' : 'Reject'}
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
