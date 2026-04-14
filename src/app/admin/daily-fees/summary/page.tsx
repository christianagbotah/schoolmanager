'use client';

import { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { DollarSign, Download, CalendarDays, TrendingUp } from 'lucide-react';

interface DailySummary { date: string; feeding: number; breakfast: number; classes: number; water: number; transport: number; total: number; count: number; }

export default function DailyFeeSummaryPage() {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [summary, setSummary] = useState<DailySummary | null>(null);
  const [history, setHistory] = useState<DailySummary[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/daily-fees/report?date=${date}`);
      const data = await res.json();
      setSummary(data.summary || null);
      setHistory(data.history || []);
    } catch { toast.error('Failed to load summary'); } finally { setLoading(false); }
  }, [date]);

  useEffect(() => { fetchSummary(); }, [fetchSummary]);

  const exportCSV = () => {
    const headers = ['Date', 'Feeding', 'Breakfast', 'Classes', 'Water', 'Transport', 'Total', 'Count'];
    const rows = history.map(h => [h.date, h.feeding, h.breakfast, h.classes, h.water, h.transport, h.total, h.count]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `daily-fees-${date}.csv`; a.click();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div><h1 className="text-2xl font-bold text-slate-900 tracking-tight">Daily Fee Summary</h1><p className="text-sm text-slate-500 mt-1">View daily fee collection reports</p></div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportCSV}><Download className="w-4 h-4 mr-2" />Export</Button>
          </div>
        </div>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Label className="text-xs">Date</Label>
              <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-48" />
            </div>
          </CardContent>
        </Card>

        {loading ? <div className="grid grid-cols-2 sm:grid-cols-6 gap-4">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
        : summary && (
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-4">
            {[
              { label: 'Feeding', value: summary.feeding, color: 'emerald' },
              { label: 'Breakfast', value: summary.breakfast, color: 'amber' },
              { label: 'Classes', value: summary.classes, color: 'blue' },
              { label: 'Water', value: summary.water, color: 'cyan' },
              { label: 'Transport', value: summary.transport, color: 'purple' },
              { label: 'Total', value: summary.total, color: 'emerald' },
            ].map((s, i) => (
              <Card key={i} className={i === 5 ? 'border-emerald-300 bg-emerald-50' : ''}>
                <CardContent className="p-4 text-center">
                  <p className="text-xs text-slate-500">{s.label}</p>
                  <p className="text-xl font-bold text-slate-900">GH₵ {s.value.toFixed(2)}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><CalendarDays className="w-4 h-4" />Collection History (Last 7 days)</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow className="bg-slate-50"><TableHead className="text-xs font-semibold">Date</TableHead><TableHead className="text-xs font-semibold text-right">Feeding</TableHead><TableHead className="text-xs font-semibold text-right">Breakfast</TableHead><TableHead className="text-xs font-semibold text-right">Classes</TableHead><TableHead className="text-xs font-semibold text-right">Water</TableHead><TableHead className="text-xs font-semibold text-right">Transport</TableHead><TableHead className="text-xs font-semibold text-right">Total</TableHead><TableHead className="text-xs font-semibold text-right">Count</TableHead></TableRow></TableHeader>
              <TableBody>
                {history.length === 0 ? <TableRow><TableCell colSpan={8} className="text-center py-12 text-slate-400"><TrendingUp className="w-10 h-10 mx-auto mb-2 opacity-50" /><p>No collection history</p></TableCell></TableRow>
                : history.map((h, i) => (
                  <TableRow key={i} className="hover:bg-slate-50/50">
                    <TableCell className="text-sm">{h.date}</TableCell>
                    <TableCell className="text-sm text-right font-mono">{h.feeding.toFixed(2)}</TableCell>
                    <TableCell className="text-sm text-right font-mono">{h.breakfast.toFixed(2)}</TableCell>
                    <TableCell className="text-sm text-right font-mono">{h.classes.toFixed(2)}</TableCell>
                    <TableCell className="text-sm text-right font-mono">{h.water.toFixed(2)}</TableCell>
                    <TableCell className="text-sm text-right font-mono">{h.transport.toFixed(2)}</TableCell>
                    <TableCell className="text-sm text-right font-bold font-mono">{h.total.toFixed(2)}</TableCell>
                    <TableCell className="text-sm text-right">{h.count}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
