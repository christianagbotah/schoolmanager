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
  Wallet, CreditCard, TrendingUp, Users, DollarSign,
  Download, Search, BarChart3, ArrowUpRight, ArrowDownRight, PiggyBank,
} from 'lucide-react';

interface WalletBalance { student_id: number; name: string; student_code: string; feeding_balance: number; breakfast_balance: number; classes_balance: number; water_balance: number; transport_balance: number; total: number; }
interface UsageTrend { date: string; feeding: number; breakfast: number; classes: number; water: number; transport: number; total: number; }
interface TopCreditor { name: string; student_code: string; total_credits: number; transactions: number; }

export default function CreditStatisticsPage() {
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('total');

  const [wallets, setWallets] = useState<WalletBalance[]>([]);
  const [trends, setTrends] = useState<UsageTrend[]>([]);
  const [topCreditors, setTopCreditors] = useState<TopCreditor[]>([]);
  const [summary, setSummary] = useState({ totalBalance: 0, studentsWithCredit: 0, avgBalance: 0, totalCredits: 0 });

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/credits/statistics');
      const data = await res.json();
      setWallets(data.wallets || []);
      setTrends(data.trends || []);
      setTopCreditors(data.topCreditors || []);
      setSummary({
        totalBalance: data.summary?.totalBalance || 0,
        studentsWithCredit: data.summary?.studentsWithCredit || 0,
        avgBalance: data.summary?.avgBalance || 0,
        totalCredits: data.summary?.totalCredits || 0,
      });
    } catch {
      toast.error('Failed to load statistics');
    }
    setLoading(false);
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchStats(); }, [fetchStats]);

  const filteredWallets = wallets.filter(w =>
    search === '' || w.name.toLowerCase().includes(search.toLowerCase()) || w.student_code.toLowerCase().includes(search.toLowerCase())
  ).sort((a, b) => {
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    return b.total - a.total;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div><h1 className="text-2xl font-bold text-slate-900 tracking-tight">Student Credit Statistics</h1><p className="text-sm text-slate-500 mt-1">Monitor student wallet balances and credit usage</p></div>
          <Button variant="outline" size="sm" className="h-9"><Download className="w-4 h-4 mr-2" />Export</Button>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-slate-200/60"><CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center"><Wallet className="w-5 h-5 text-emerald-600" /></div>
            <div><p className="text-xs text-slate-500">Total Balances</p><p className="text-xl font-bold">GHS {summary.totalBalance.toLocaleString()}</p></div>
          </CardContent></Card>
          <Card className="border-slate-200/60"><CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-sky-100 flex items-center justify-center"><Users className="w-5 h-5 text-sky-600" /></div>
            <div><p className="text-xs text-slate-500">Students with Credit</p><p className="text-xl font-bold">{summary.studentsWithCredit}</p></div>
          </CardContent></Card>
          <Card className="border-slate-200/60"><CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center"><CreditCard className="w-5 h-5 text-amber-600" /></div>
            <div><p className="text-xs text-slate-500">Avg Balance</p><p className="text-xl font-bold">GHS {summary.avgBalance.toLocaleString()}</p></div>
          </CardContent></Card>
          <Card className="border-slate-200/60"><CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center"><PiggyBank className="w-5 h-5 text-violet-600" /></div>
            <div><p className="text-xs text-slate-500">Total Credits Given</p><p className="text-xl font-bold">GHS {summary.totalCredits.toLocaleString()}</p></div>
          </CardContent></Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Usage Trend */}
          <Card className="border-slate-200/60">
            <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><BarChart3 className="w-5 h-5 text-emerald-600" />Credit Usage Trend</CardTitle></CardHeader>
            <CardContent>
              {loading ? <Skeleton className="h-48" /> : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {trends.length === 0 ? <p className="text-center text-slate-400 py-8 text-sm">No data</p> : trends.map((t, i) => {
                    const max = Math.max(...trends.map(x => x.total), 1);
                    return (
                      <div key={i} className="flex items-center gap-3">
                        <span className="text-xs text-slate-500 w-20 flex-shrink-0">{t.date}</span>
                        <div className="flex-1 h-5 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(t.total / max) * 100}%` }} /></div>
                        <span className="text-xs font-medium text-slate-700 w-24 text-right">GHS {t.total.toLocaleString()}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Creditors */}
          <Card className="border-slate-200/60">
            <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><TrendingUp className="w-5 h-5 text-amber-600" />Top Creditors</CardTitle><CardDescription className="text-xs">Students with highest credit balances</CardDescription></CardHeader>
            <CardContent className="p-0">
              <div className="max-h-72 overflow-y-auto">
                <Table>
                  <TableHeader><TableRow className="bg-slate-50"><TableHead>Student</TableHead><TableHead>Code</TableHead><TableHead>Transactions</TableHead><TableHead>Total Credits</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {loading ? Array.from({ length: 3 }).map((_, i) => <TableRow key={i}><TableCell colSpan={4}><Skeleton className="h-8" /></TableCell></TableRow>) :
                      topCreditors.length === 0 ? <TableRow><TableCell colSpan={4} className="text-center py-8 text-slate-400 text-sm">No data</TableCell></TableRow> :
                        topCreditors.map((c, i) => (
                          <TableRow key={i}>
                            <TableCell><div className="flex items-center gap-2"><span className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold flex items-center justify-center">{i + 1}</span><span className="text-sm font-medium">{c.name}</span></div></TableCell>
                            <TableCell className="text-xs font-mono text-slate-500">{c.student_code}</TableCell>
                            <TableCell className="text-sm text-slate-500">{c.transactions}</TableCell>
                            <TableCell className="text-sm font-medium text-amber-600">GHS {c.total_credits.toLocaleString()}</TableCell>
                          </TableRow>
                        ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Wallet Balances */}
        <Card className="border-slate-200/60">
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <CardTitle className="text-base flex items-center gap-2"><Wallet className="w-5 h-5 text-sky-600" />All Wallet Balances</CardTitle>
              <div className="flex gap-2">
                <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><Input placeholder="Search student..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 h-9 w-48 text-sm" /></div>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="h-9 w-32 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="total">By Balance</SelectItem><SelectItem value="name">By Name</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-[400px] overflow-y-auto">
              <Table>
                <TableHeader><TableRow className="bg-slate-50"><TableHead>Student</TableHead><TableHead>Feeding</TableHead><TableHead>Breakfast</TableHead><TableHead>Classes</TableHead><TableHead>Water</TableHead><TableHead>Transport</TableHead><TableHead>Total</TableHead></TableRow></TableHeader>
                <TableBody>
                  {loading ? Array.from({ length: 5 }).map((_, i) => <TableRow key={i}><TableCell colSpan={7}><Skeleton className="h-8" /></TableCell></TableRow>) :
                    filteredWallets.length === 0 ? <TableRow><TableCell colSpan={7} className="text-center py-12 text-slate-400 text-sm">No students with credit balances</TableCell></TableRow> :
                      filteredWallets.map((w, i) => (
                        <TableRow key={w.student_id}>
                          <TableCell><div><p className="font-medium text-sm">{w.name}</p><p className="text-xs text-slate-500">{w.student_code}</p></div></TableCell>
                          <TableCell className="text-sm">{w.feeding_balance > 0 ? <span className="text-emerald-700 font-medium">GHS {w.feeding_balance.toFixed(2)}</span> : <span className="text-slate-400">0.00</span>}</TableCell>
                          <TableCell className="text-sm">{w.breakfast_balance > 0 ? <span className="text-amber-700 font-medium">GHS {w.breakfast_balance.toFixed(2)}</span> : <span className="text-slate-400">0.00</span>}</TableCell>
                          <TableCell className="text-sm">{w.classes_balance > 0 ? <span className="text-sky-700 font-medium">GHS {w.classes_balance.toFixed(2)}</span> : <span className="text-slate-400">0.00</span>}</TableCell>
                          <TableCell className="text-sm">{w.water_balance > 0 ? <span className="text-violet-700 font-medium">GHS {w.water_balance.toFixed(2)}</span> : <span className="text-slate-400">0.00</span>}</TableCell>
                          <TableCell className="text-sm">{w.transport_balance > 0 ? <span className="text-rose-700 font-medium">GHS {w.transport_balance.toFixed(2)}</span> : <span className="text-slate-400">0.00</span>}</TableCell>
                          <TableCell className="text-sm font-bold text-emerald-700">GHS {w.total.toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
