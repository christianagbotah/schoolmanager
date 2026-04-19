'use client';

import { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { format } from 'date-fns';
import {
  MessageSquare, Search, Download, Phone, CheckCircle, XCircle,
  Clock, Send, Users, Filter, Loader2,
} from 'lucide-react';

interface SmsLogItem {
  id: number;
  recipient: string;
  recipient_type: string;
  message: string;
  status: string;
  sent_at: string;
  sent_by: string;
}

export default function SmsLogPage() {
  const [logs, setLogs] = useState<SmsLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: '50' });
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (search) params.set('search', search);
      const res = await fetch(`/api/admin/sms/log?${params}`);
      const data = await res.json();
      setLogs(data.logs || []);
      setTotalPages(data.totalPages || 1);
    } catch {
      toast.error('Failed to load SMS log');
    }
    setLoading(false);
  }, [page, statusFilter, search]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
    delivered: { label: 'Delivered', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
    sent: { label: 'Sent', color: 'bg-sky-100 text-sky-700', icon: Send },
    failed: { label: 'Failed', color: 'bg-red-100 text-red-700', icon: XCircle },
    pending: { label: 'Pending', color: 'bg-amber-100 text-amber-700', icon: Clock },
  };

  const totalLogs = logs.length;
  const deliveredCount = logs.filter(l => l.status === 'delivered').length;
  const failedCount = logs.filter(l => l.status === 'failed').length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div><h1 className="text-2xl font-bold text-slate-900 tracking-tight">SMS Log</h1><p className="text-sm text-slate-500 mt-1">History of all sent SMS messages</p></div>
          <Button variant="outline" className="min-h-[44px]"><Download className="w-4 h-4 mr-2" />Export Log</Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-slate-200/60"><CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center"><MessageSquare className="w-5 h-5 text-emerald-600" /></div>
            <div><p className="text-xs text-slate-500">Total SMS</p><p className="text-xl font-bold">{totalLogs}</p></div>
          </CardContent></Card>
          <Card className="border-slate-200/60"><CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-sky-100 flex items-center justify-center"><Send className="w-5 h-5 text-sky-600" /></div>
            <div><p className="text-xs text-slate-500">Sent</p><p className="text-xl font-bold">{totalLogs - failedCount}</p></div>
          </CardContent></Card>
          <Card className="border-slate-200/60"><CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center"><CheckCircle className="w-5 h-5 text-emerald-600" /></div>
            <div><p className="text-xs text-slate-500">Delivered</p><p className="text-xl font-bold">{deliveredCount}</p></div>
          </CardContent></Card>
          <Card className="border-slate-200/60"><CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center"><XCircle className="w-5 h-5 text-red-600" /></div>
            <div><p className="text-xs text-slate-500">Failed</p><p className="text-xl font-bold">{failedCount}</p></div>
          </CardContent></Card>
        </div>

        {/* Filters */}
        <Card className="border-slate-200/60"><CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><Input placeholder="Search recipient or message..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="pl-10 min-h-[44px]" /></div>
            <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setPage(1); }}>
              <SelectTrigger className="h-[44px] w-full sm:w-40"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent></Card>

        {/* Log Table */}
        <Card className="border-slate-200/60"><CardContent className="p-0">
          <div className="max-h-[500px] overflow-y-auto">
            <Table>
              <TableHeader><TableRow className="bg-slate-50">
                <TableHead>Date</TableHead>
                <TableHead>Student / Recipient</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Message</TableHead>
                <TableHead>Status</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {loading ? Array.from({ length: 8 }).map((_, i) => <TableRow key={i}><TableCell colSpan={6}><Skeleton className="h-10" /></TableCell></TableRow>) :
                  logs.length === 0 ? <TableRow><TableCell colSpan={6} className="text-center py-12 text-slate-400"><MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-50" /><p className="font-medium">No SMS messages found</p></TableCell></TableRow> :
                    logs.map((log, i) => {
                      const cfg = statusConfig[log.status] || statusConfig.pending;
                      const StatusIcon = cfg.icon;
                      return (
                        <TableRow key={log.id}>
                          <TableCell className="text-xs text-slate-500">{log.sent_at ? format(new Date(log.sent_at), 'yyyy-MM-dd HH:mm') : '—'}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Phone className="w-3 h-3 text-slate-400" />
                              <span className="text-sm font-medium">{log.recipient || 'Unknown'}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm font-mono text-slate-600">{log.phone || '—'}</TableCell>
                          <TableCell><Badge variant="outline" className="text-[10px] capitalize">{log.recipient_type || 'general'}</Badge></TableCell>
                          <TableCell><p className="text-sm text-slate-700 max-w-[200px] truncate">{log.message || 'No message'}</p></TableCell>
                          <TableCell><Badge className={`${cfg.color} text-xs`}><StatusIcon className="w-3 h-3 mr-1" />{cfg.label}</Badge></TableCell>
                        </TableRow>
                      );
                    })}
              </TableBody>
            </Table>
          </div>
        </CardContent></Card>

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <Button variant="outline" size="sm" className="h-8" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
            <span className="text-sm text-slate-500">Page {page} of {totalPages}</span>
            <Button variant="outline" size="sm" className="h-8" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
