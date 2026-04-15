'use client';

import { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import {
  Clock, AlertTriangle, DollarSign, Users, Download, Search,
  TrendingDown, FileWarning, ShieldAlert, CheckCircle,
} from 'lucide-react';

interface AgingItem { studentName: string; studentCode: string; invoiceCode: string; amount: number; days: number; createdDate: string; }
interface AgingSummary { current: number; days30: number; days60: number; days90Plus: number; total: number; }

const BUCKET_CONFIG = [
  { key: 'current', label: 'Current (0-30)', color: 'bg-emerald-100 text-emerald-700', barColor: 'bg-emerald-500', maxDays: 30 },
  { key: 'days30', label: '31-60 Days', color: 'bg-amber-100 text-amber-700', barColor: 'bg-amber-500', maxDays: 60 },
  { key: 'days60', label: '61-90 Days', color: 'bg-orange-100 text-orange-700', barColor: 'bg-orange-500', maxDays: 90 },
  { key: 'days90Plus', label: '90+ Days', color: 'bg-red-100 text-red-700', barColor: 'bg-red-500', maxDays: 999 },
];

export default function AgingReportPage() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<AgingItem[]>([]);
  const [summary, setSummary] = useState<AgingSummary>({ current: 0, days30: 0, days60: 0, days90Plus: 0, total: 0 });
  const [search, setSearch] = useState('');
  const [bucketFilter, setBucketFilter] = useState('all');

  const fetchAging = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/reports/aging');
      const data = await res.json();
      setItems((data.items || []).map((item: { studentName: string; studentCode: string; amount: number; days: number; createdDate?: string }) => ({
        ...item,
        invoiceCode: `INV-${String(item.studentCode).slice(-4)}`,
        createdDate: item.createdDate || new Date().toISOString(),
      })));
      setSummary({
        current: data.current || 0,
        days30: data.days30 || 0,
        days60: data.days60 || 0,
        days90Plus: data.days90Plus || 0,
        total: data.total || 0,
      });
    } catch {
      toast.error('Failed to load aging report');
    }
    setLoading(false);
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchAging(); }, [fetchAging]);

  const getBucket = (days: number): string => {
    if (days <= 30) return 'current';
    if (days <= 60) return 'days30';
    if (days <= 90) return 'days60';
    return 'days90Plus';
  };

  const filteredItems = items.filter(item => {
    if (search && !item.studentName.toLowerCase().includes(search.toLowerCase()) && !item.studentCode.toLowerCase().includes(search.toLowerCase())) return false;
    if (bucketFilter !== 'all' && getBucket(item.days) !== bucketFilter) return false;
    return true;
  });

  const filteredTotal = filteredItems.reduce((s, i) => s + i.amount, 0);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div><h1 className="text-2xl font-bold text-slate-900 tracking-tight">Accounts Aging Report</h1><p className="text-sm text-slate-500 mt-1">Track outstanding invoices by age (30/60/90/120+ days)</p></div>
          <Button variant="outline" className="min-h-[44px]"><Download className="w-4 h-4 mr-2" />Export Report</Button>
        </div>

        {/* Aging Buckets */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {BUCKET_CONFIG.map(b => (
            <Card key={b.key} className="border-slate-200/60">
              <CardContent className="p-4 text-center">
                <div className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold mb-2 ${b.color}`}>{b.label}</div>
                <p className="text-xl font-bold text-slate-900">GHS {(summary[b.key as keyof AgingSummary] as number).toLocaleString()}</p>
                {summary.total > 0 && (
                  <p className="text-[10px] text-slate-500 mt-1">{((summary[b.key as keyof AgingSummary] as number) / summary.total * 100).toFixed(1)}% of total</p>
                )}
              </CardContent>
            </Card>
          ))}
          <Card className="border-slate-200/60 bg-slate-50">
            <CardContent className="p-4 text-center">
              <div className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-700 text-white mb-2">Grand Total</div>
              <p className="text-xl font-bold text-slate-900">GHS {summary.total.toLocaleString()}</p>
              <p className="text-[10px] text-slate-500 mt-1">{items.length} outstanding</p>
            </CardContent>
          </Card>
        </div>

        {/* Visual Bar */}
        {summary.total > 0 && (
          <Card className="border-slate-200/60">
            <CardContent className="p-4">
              <p className="text-xs font-medium text-slate-600 mb-2">Aging Distribution</p>
              <div className="h-6 rounded-full overflow-hidden flex">
                {BUCKET_CONFIG.map(b => {
                  const pct = (summary[b.key as keyof AgingSummary] as number) / summary.total * 100;
                  if (pct < 0.5) return null;
                  return <div key={b.key} className={`${b.barColor} transition-all`} style={{ width: `${pct}%` }} title={`${b.label}: GHS ${(summary[b.key as keyof AgingSummary] as number).toLocaleString()}`} />;
                })}
              </div>
              <div className="flex flex-wrap gap-3 mt-2">
                {BUCKET_CONFIG.map(b => (
                  <div key={b.key} className="flex items-center gap-1.5">
                    <div className={`w-2 h-2 rounded-full ${b.barColor}`} />
                    <span className="text-[10px] text-slate-500">{b.label}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <Card className="border-slate-200/60"><CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><Input placeholder="Search student name or code..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 min-h-[44px]" /></div>
            <Select value={bucketFilter} onValueChange={setBucketFilter}>
              <SelectTrigger className="h-[44px] w-full sm:w-44"><SelectValue placeholder="Filter by aging" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Buckets</SelectItem>
                {BUCKET_CONFIG.map(b => <SelectItem key={b.key} value={b.key}>{b.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent></Card>

        {/* Items Table */}
        <Card className="border-slate-200/60"><CardContent className="p-0">
          <div className="max-h-[500px] overflow-y-auto">
            <Table>
              <TableHeader><TableRow className="bg-slate-50">
                <TableHead className="w-12">#</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Amount Due</TableHead>
                <TableHead>Days Outstanding</TableHead>
                <TableHead>Aging Bucket</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {loading ? Array.from({ length: 5 }).map((_, i) => <TableRow key={i}><TableCell colSpan={6}><Skeleton className="h-10" /></TableCell></TableRow>) :
                  filteredItems.length === 0 ? <TableRow><TableCell colSpan={6} className="text-center py-12 text-slate-400"><CheckCircle className="w-10 h-10 mx-auto mb-2 opacity-50" /><p className="font-medium">No overdue invoices</p></TableCell></TableRow> :
                    filteredItems.map((item, i) => {
                      const bucket = BUCKET_CONFIG.find(b => b.key === getBucket(item.days))!;
                      return (
                        <TableRow key={i}>
                          <TableCell className="text-xs text-slate-400">{i + 1}</TableCell>
                          <TableCell className="font-medium text-sm">{item.studentName}</TableCell>
                          <TableCell className="text-xs font-mono text-slate-500">{item.studentCode}</TableCell>
                          <TableCell className="text-sm font-medium text-red-600">GHS {item.amount.toLocaleString()}</TableCell>
                          <TableCell className="text-sm">
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-400" />
                              <span className={item.days > 90 ? 'text-red-600 font-bold' : item.days > 60 ? 'text-orange-600 font-medium' : 'text-slate-700'}>{item.days}</span>
                            </div>
                          </TableCell>
                          <TableCell><Badge className={`${bucket.color} text-xs`}>{bucket.label}</Badge></TableCell>
                        </TableRow>
                      );
                    })}
              </TableBody>
            </Table>
          </div>
          {!loading && filteredItems.length > 0 && (
            <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between bg-slate-50">
              <span className="text-xs text-slate-500">{filteredItems.length} invoices shown</span>
              <span className="text-sm font-bold text-red-600">Total: GHS {filteredTotal.toLocaleString()}</span>
            </div>
          )}
        </CardContent></Card>
      </div>
    </DashboardLayout>
  );
}
