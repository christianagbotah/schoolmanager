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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  Shield, CheckCircle, XCircle, Clock, FileText, Edit,
  AlertTriangle, CreditCard, Percent, Loader2, Filter,
} from 'lucide-react';

interface ApprovalRequest {
  id: number;
  request_type: string;
  reference_code: string;
  title: string;
  description: string;
  requested_by: string;
  status: string;
  reviewed_by: string;
  review_reason: string;
  created_at: string;
  reviewed_at: string | null;
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

const typeConfig: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  invoice_edit: { label: 'Invoice Edit', color: 'text-amber-600', bg: 'bg-amber-50', icon: FileText },
  receipt_correction: { label: 'Receipt Correction', color: 'text-sky-600', bg: 'bg-sky-50', icon: CreditCard },
  discount_approval: { label: 'Discount', color: 'text-emerald-600', bg: 'bg-emerald-50', icon: Percent },
  payment_edit: { label: 'Payment Edit', color: 'text-violet-600', bg: 'bg-violet-50', icon: Edit },
};

const statusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pending', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  approved: { label: 'Approved', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-700 border-red-200' },
};

export default function ApprovalsPage() {
  const [requests, setRequests] = useState<ApprovalRequest[]>([]);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const [actionDialog, setActionDialog] = useState<{ open: boolean; request: ApprovalRequest | null; action: 'approve' | 'reject' }>({ open: false, request: null, action: 'approve' });
  const [reason, setReason] = useState('');
  const [processing, setProcessing] = useState(false);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/approvals?status=${activeTab}`);
      const data = await res.json();
      setRequests(data.requests || []);
      setStatusCounts(data.statusCounts || {});
    } catch { toast.error('Failed to load requests'); } finally { setLoading(false); }
  }, [activeTab]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const handleAction = async () => {
    if (!actionDialog.request) return;
    setProcessing(true);
    try {
      const res = await fetch('/api/admin/approvals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: actionDialog.action,
          id: actionDialog.request.id,
          review_reason: reason,
          reviewed_by: 'Admin',
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast.success(data.message);
      setActionDialog({ open: false, request: null, action: 'approve' });
      setReason('');
      fetchRequests();
    } catch (err: any) { toast.error(err.message); } finally { setProcessing(false); }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-md">
              <Shield className="w-5 h-5 text-white" />
            </div>
            Approval Requests
          </h1>
          <p className="text-sm text-slate-500 mt-1 ml-[52px]">Review and manage pending modification requests</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Pending', count: statusCounts.pending || 0, icon: Clock, color: 'from-amber-500 to-orange-500', bg: 'bg-amber-50' },
            { label: 'Approved', count: statusCounts.approved || 0, icon: CheckCircle, color: 'from-emerald-500 to-teal-500', bg: 'bg-emerald-50' },
            { label: 'Rejected', count: statusCounts.rejected || 0, icon: XCircle, color: 'from-red-500 to-rose-500', bg: 'bg-red-50' },
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

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="pending" className="gap-1.5"><Clock className="w-3.5 h-3.5" />Pending</TabsTrigger>
            <TabsTrigger value="approved" className="gap-1.5"><CheckCircle className="w-3.5 h-3.5" />Approved</TabsTrigger>
            <TabsTrigger value="rejected" className="gap-1.5"><XCircle className="w-3.5 h-3.5" />Rejected</TabsTrigger>
            <TabsTrigger value="all" className="gap-1.5"><Filter className="w-3.5 h-3.5" />All</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-4">
            <Card>
              <CardContent className="p-0">
                <ScrollArea className="max-h-[600px]">
                  {loading ? (
                    <div className="p-4 space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
                  ) : requests.length === 0 ? (
                    <div className="text-center py-16 text-slate-400">
                      <Shield className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p className="text-sm">No {activeTab} requests</p>
                    </div>
                  ) : (
                    <div className="divide-y">
                      {requests.map((req) => {
                        const typeCfg = typeConfig[req.request_type] || { label: req.request_type, color: 'text-slate-600', bg: 'bg-slate-50', icon: FileText };
                        const statusCfg = statusConfig[req.status] || statusConfig.pending;
                        const Icon = typeCfg.icon;
                        return (
                          <div key={req.id} className="p-4 hover:bg-slate-50/50 transition-colors">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex items-start gap-3 min-w-0">
                                <div className={`w-9 h-9 rounded-lg ${typeCfg.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                                  <Icon className={`w-4 h-4 ${typeCfg.color}`} />
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <p className="text-sm font-semibold text-slate-800 truncate">{req.title}</p>
                                    <Badge variant="outline" className={`${statusCfg.color} text-[10px]`}>{statusCfg.label}</Badge>
                                    <Badge variant="outline" className={`${typeCfg.bg} ${typeCfg.color} text-[10px]`}>{typeCfg.label}</Badge>
                                  </div>
                                  {req.description && <p className="text-xs text-slate-500 mt-1 line-clamp-2">{req.description}</p>}
                                  <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-400">
                                    <span>By {req.requested_by}</span>
                                    <span>&middot;</span>
                                    <span>{formatDate(req.created_at)}</span>
                                    {req.reference_code && <><span>&middot;</span><span className="font-mono">{req.reference_code}</span></>}
                                  </div>
                                  {req.review_reason && (
                                    <div className="mt-2 bg-slate-50 rounded-lg p-2">
                                      <p className="text-[10px] text-slate-400">Review reason: {req.review_reason}</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                              {req.status === 'pending' && (
                                <div className="flex gap-1.5 flex-shrink-0">
                                  <Button size="sm" className="h-8 bg-emerald-500 hover:bg-emerald-600 text-white" onClick={() => setActionDialog({ open: true, request: req, action: 'approve' })}>
                                    <CheckCircle className="w-3.5 h-3.5 mr-1" />Approve
                                  </Button>
                                  <Button size="sm" variant="outline" className="h-8 text-red-600 hover:bg-red-50 border-red-200" onClick={() => setActionDialog({ open: true, request: req, action: 'reject' })}>
                                    <XCircle className="w-3.5 h-3.5 mr-1" />Reject
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Action Dialog */}
        <Dialog open={actionDialog.open} onOpenChange={(o) => setActionDialog({ open: o, request: null, action: 'approve' })}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {actionDialog.action === 'approve' ? <CheckCircle className="w-5 h-5 text-emerald-500" /> : <XCircle className="w-5 h-5 text-red-500" />}
                {actionDialog.action === 'approve' ? 'Approve Request' : 'Reject Request'}
              </DialogTitle>
            </DialogHeader>
            {actionDialog.request && (
              <div className="space-y-4">
                <p className="text-sm text-slate-600"><strong>{actionDialog.request.title}</strong></p>
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Reason {actionDialog.action === 'reject' && '(required)'}</Label>
                  <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder={actionDialog.action === 'approve' ? 'Optional reason for approval...' : 'Reason for rejection...'} rows={3} />
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setActionDialog({ open: false, request: null, action: 'approve' })} className="flex-1">Cancel</Button>
                  <Button onClick={handleAction} disabled={processing} className={`flex-1 ${actionDialog.action === 'approve' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-red-500 hover:bg-red-600'} text-white`}>
                    {processing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {actionDialog.action === 'approve' ? 'Approve' : 'Reject'}
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
