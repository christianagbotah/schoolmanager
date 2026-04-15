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
  Percent, Tag, TrendingDown, Users, DollarSign, BarChart3,
  Download, Filter, PieChart,
} from 'lucide-react';

interface CategoryStat { category: string; count: number; total_discount: number; total_percentage: number; }
interface ProfileStat { profile: string; count: number; total_discount: number; avg_discount: number; }
interface ClassStat { class_name: string; count: number; total_discount: number; }

export default function DiscountReportsPage() {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('all');

  const [categoryStats, setCategoryStats] = useState<CategoryStat[]>([]);
  const [profileStats, setProfileStats] = useState<ProfileStat[]>([]);
  const [classStats, setClassStats] = useState<ClassStat[]>([]);
  const [summary, setSummary] = useState({ totalDiscounts: 0, totalAmount: 0, avgDiscount: 0, studentsWithDiscount: 0 });

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ period });
      const res = await fetch(`/api/admin/discounts/reports?${params}`);
      const data = await res.json();
      setCategoryStats(data.categories || []);
      setProfileStats(data.profiles || []);
      setClassStats(data.classes || []);
      setSummary({
        totalDiscounts: data.summary?.totalDiscounts || 0,
        totalAmount: data.summary?.totalAmount || 0,
        avgDiscount: data.summary?.avgDiscount || 0,
        studentsWithDiscount: data.summary?.studentsWithDiscount || 0,
      });
    } catch {
      toast.error('Failed to load reports');
    }
    setLoading(false);
  }, [period]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchReports(); }, [fetchReports]);

  const totalAmount = classStats.reduce((s, c) => s + c.total_discount, 0);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div><h1 className="text-2xl font-bold text-slate-900 tracking-tight">Discount Reports</h1><p className="text-sm text-slate-500 mt-1">Analytics on discount usage and financial impact</p></div>
          <div className="flex gap-2">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="h-9 w-36 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="all">All Time</SelectItem><SelectItem value="this_term">This Term</SelectItem><SelectItem value="this_year">This Year</SelectItem></SelectContent>
            </Select>
            <Button variant="outline" size="sm" className="h-9"><Download className="w-4 h-4" /></Button>
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-slate-200/60"><CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center"><Tag className="w-5 h-5 text-emerald-600" /></div>
            <div><p className="text-xs text-slate-500">Total Discounts</p><p className="text-xl font-bold">{summary.totalDiscounts}</p></div>
          </CardContent></Card>
          <Card className="border-slate-200/60"><CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center"><TrendingDown className="w-5 h-5 text-red-600" /></div>
            <div><p className="text-xs text-slate-500">Total Amount</p><p className="text-xl font-bold">GHS {summary.totalAmount.toLocaleString()}</p></div>
          </CardContent></Card>
          <Card className="border-slate-200/60"><CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center"><Percent className="w-5 h-5 text-amber-600" /></div>
            <div><p className="text-xs text-slate-500">Avg Discount</p><p className="text-xl font-bold">GHS {summary.avgDiscount.toLocaleString()}</p></div>
          </CardContent></Card>
          <Card className="border-slate-200/60"><CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center"><Users className="w-5 h-5 text-violet-600" /></div>
            <div><p className="text-xs text-slate-500">Students</p><p className="text-xl font-bold">{summary.studentsWithDiscount}</p></div>
          </CardContent></Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* By Profile */}
          <Card className="border-slate-200/60">
            <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><PieChart className="w-5 h-5 text-emerald-600" />By Discount Profile</CardTitle></CardHeader>
            <CardContent>
              {loading ? <Skeleton className="h-48" /> : (
                <div className="space-y-3">
                  {profileStats.length === 0 ? <p className="text-center text-slate-400 py-8 text-sm">No data</p> : profileStats.map((p, i) => {
                    const max = Math.max(...profileStats.map(s => s.total_discount), 1);
                    const colors = ['bg-emerald-500', 'bg-sky-500', 'bg-amber-500', 'bg-violet-500', 'bg-rose-500', 'bg-teal-500'];
                    return (
                      <div key={i} className="flex items-center gap-3">
                        <span className="text-xs text-slate-600 w-28 flex-shrink-0 truncate">{p.profile}</span>
                        <div className="flex-1 h-5 bg-slate-100 rounded-full overflow-hidden"><div className={`h-full rounded-full ${colors[i % colors.length]}`} style={{ width: `${(p.total_discount / max) * 100}%` }} /></div>
                        <span className="text-xs font-medium text-slate-700 w-24 text-right">GHS {p.total_discount.toLocaleString()}</span>
                        <Badge variant="secondary" className="text-[10px]">{p.count}</Badge>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* By Category */}
          <Card className="border-slate-200/60">
            <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><BarChart3 className="w-5 h-5 text-amber-600" />By Category</CardTitle></CardHeader>
            <CardContent className="p-0">
              <div className="max-h-72 overflow-y-auto">
                <Table>
                  <TableHeader><TableRow className="bg-slate-50"><TableHead>Category</TableHead><TableHead>Usage</TableHead><TableHead>Total Amount</TableHead><TableHead>Avg %</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {loading ? Array.from({ length: 3 }).map((_, i) => <TableRow key={i}><TableCell colSpan={4}><Skeleton className="h-8" /></TableCell></TableRow>) :
                      categoryStats.length === 0 ? <TableRow><TableCell colSpan={4} className="text-center py-8 text-slate-400 text-sm">No data</TableCell></TableRow> :
                        categoryStats.map((c, i) => (
                          <TableRow key={i}>
                            <TableCell className="text-sm font-medium capitalize">{c.category}</TableCell>
                            <TableCell className="text-sm text-slate-500">{c.count}</TableCell>
                            <TableCell className="text-sm font-medium text-red-600">GHS {c.total_discount.toLocaleString()}</TableCell>
                            <TableCell className="text-sm">{c.total_percentage.toFixed(1)}%</TableCell>
                          </TableRow>
                        ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* By Class */}
        <Card className="border-slate-200/60">
          <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Users className="w-5 h-5 text-violet-600" />Discount by Class</CardTitle></CardHeader>
          <CardContent className="p-0">
            <div className="max-h-72 overflow-y-auto">
              <Table>
                <TableHeader><TableRow className="bg-slate-50"><TableHead>Class</TableHead><TableHead>Students with Discount</TableHead><TableHead>Total Discount Amount</TableHead><TableHead>% of Total</TableHead></TableRow></TableHeader>
                <TableBody>
                  {loading ? Array.from({ length: 4 }).map((_, i) => <TableRow key={i}><TableCell colSpan={4}><Skeleton className="h-8" /></TableCell></TableRow>) :
                    classStats.length === 0 ? <TableRow><TableCell colSpan={4} className="text-center py-8 text-slate-400 text-sm">No data</TableCell></TableRow> :
                      classStats.map((c, i) => (
                        <TableRow key={i}>
                          <TableCell className="text-sm font-medium">{c.class_name || 'Unknown'}</TableCell>
                          <TableCell className="text-sm text-slate-500">{c.count}</TableCell>
                          <TableCell className="text-sm font-medium text-red-600">GHS {c.total_discount.toLocaleString()}</TableCell>
                          <TableCell className="text-sm">{totalAmount > 0 ? ((c.total_discount / totalAmount) * 100).toFixed(1) : 0}%</TableCell>
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
