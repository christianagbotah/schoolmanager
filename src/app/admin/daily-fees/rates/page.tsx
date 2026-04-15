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
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  GraduationCap, Save, Edit, Layers, Utensils, Coffee, BookOpen, Droplets,
  Search, RotateCcw,
} from 'lucide-react';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

interface ClassInfo {
  class_id: number; name: string; name_numeric: number; category: string;
}

interface RateInfo {
  class_id: number; class_name: string; category: string;
  hasRates: boolean; feeding_rate: number; breakfast_rate: number;
  classes_rate: number; water_rate: number; total_rate: number;
}

interface CategoryGroup {
  category: string;
  classes: RateInfo[];
}

function fmt(n: number) { return `GH₵ ${(n || 0).toFixed(2)}`; }

const feeTypes = [
  { key: 'feeding_rate', label: 'Feeding', icon: Utensils, color: 'text-orange-600', bg: 'bg-orange-50' },
  { key: 'breakfast_rate', label: 'Breakfast', icon: Coffee, color: 'text-amber-600', bg: 'bg-amber-50' },
  { key: 'classes_rate', label: 'Classes', icon: BookOpen, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { key: 'water_rate', label: 'Water', icon: Droplets, color: 'text-sky-600', bg: 'bg-sky-50' },
];

export default function DailyFeeRatesPage() {
  const [categories, setCategories] = useState<CategoryGroup[]>([]);
  const [stats, setStats] = useState({ totalClasses: 0, classesWithRates: 0 });
  const [year, setYear] = useState('');
  const [term, setTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [search, setSearch] = useState('');

  const [editOpen, setEditOpen] = useState(false);
  const [editClass, setEditClass] = useState<RateInfo | null>(null);
  const [editForm, setEditForm] = useState({ feeding: '', breakfast: '', classes: '', water: '' });
  const [saving, setSaving] = useState(false);

  const fetchRates = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/daily-fees/rates');
      const data = await res.json();
      setCategories(data.categories || []);
      setStats(data.stats || { totalClasses: 0, classesWithRates: 0 });
      setYear(data.year || '');
      setTerm(data.term || '');
    } catch { toast.error('Failed to load rates'); }
    setLoading(false);
  }, []);

  useEffect(() => { fetchRates(); }, [fetchRates]);

  const handleEdit = (cls: RateInfo) => {
    setEditClass(cls);
    setEditForm({
      feeding: String(cls.feeding_rate || 0),
      breakfast: String(cls.breakfast_rate || 0),
      classes: String(cls.classes_rate || 0),
      water: String(cls.water_rate || 0),
    });
    setEditOpen(true);
  };

  const handleSave = async () => {
    if (!editClass) return;
    setSaving(true);
    try {
      const res = await fetch('/api/admin/daily-fees/rates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          class_id: editClass.class_id,
          feeding_rate: parseFloat(editForm.feeding) || 0,
          breakfast_rate: parseFloat(editForm.breakfast) || 0,
          classes_rate: parseFloat(editForm.classes) || 0,
          water_rate: parseFloat(editForm.water) || 0,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast.success(data.message);
      setEditOpen(false);
      fetchRates();
    } catch (err: any) { toast.error(err.message); }
    setSaving(false);
  };

  const filteredCategories = categories
    .filter(cat => !categoryFilter || cat.category === categoryFilter)
    .map(cat => ({
      ...cat,
      classes: cat.classes.filter(cls =>
        !search || cls.class_name.toLowerCase().includes(search.toLowerCase())
      ),
    }))
    .filter(cat => cat.classes.length > 0);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-md">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Fee Rates Management</h1>
              <p className="text-sm text-slate-500 mt-0.5">
                Academic Year {year} · Term {term}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200">
              {stats.classesWithRates}/{stats.totalClasses} configured
            </Badge>
            {stats.totalClasses - stats.classesWithRates > 0 && (
              <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
                {stats.totalClasses - stats.classesWithRates} missing
              </Badge>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input placeholder="Search class..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={categoryFilter} onValueChange={v => setCategoryFilter(v === '__all__' ? '' : v)}>
            <SelectTrigger className="w-44"><SelectValue placeholder="All Categories" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All Categories</SelectItem>
              {categories.map(c => <SelectItem key={c.category} value={c.category}>{c.category}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Rates Table */}
        {loading ? (
          <div className="space-y-4">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
        ) : (
          <div className="space-y-6">
            {filteredCategories.length === 0 ? (
              <Card><CardContent className="py-16 text-center text-slate-400"><p>No classes found</p></CardContent></Card>
            ) : filteredCategories.map(cat => (
              <div key={cat.category}>
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">{cat.category}</h3>
                <Card>
                  <CardContent className="p-0">
                    {/* Desktop Table */}
                    <div className="hidden md:block overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b bg-slate-50">
                            <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500">Class</th>
                            {feeTypes.map(ft => (
                              <th key={ft.key} className="text-right py-3 px-4 text-xs font-semibold text-slate-500">{ft.label}</th>
                            ))}
                            <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500">Total/Day</th>
                            <th className="text-center py-3 px-4 text-xs font-semibold text-slate-500">Status</th>
                            <th className="text-center py-3 px-4 text-xs font-semibold text-slate-500">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {cat.classes.map(cls => (
                            <tr key={cls.class_id} className="border-b last:border-0 hover:bg-slate-50/50">
                              <td className="py-3 px-4 font-medium">{cls.class_name}</td>
                              {feeTypes.map(ft => (
                                <td key={ft.key} className="py-3 px-4 text-right font-mono text-xs">
                                  {cls.hasRates ? fmt(cls[ft.key as keyof RateInfo] as number) : '—'}
                                </td>
                              ))}
                              <td className="py-3 px-4 text-right font-mono font-bold">{fmt(cls.total_rate)}</td>
                              <td className="py-3 px-4 text-center">
                                {cls.hasRates ? (
                                  <Badge className="text-[10px] h-5 bg-emerald-100 text-emerald-700 border-emerald-200">Set</Badge>
                                ) : (
                                  <Badge className="text-[10px] h-5 bg-amber-100 text-amber-700 border-amber-200">Missing</Badge>
                                )}
                              </td>
                              <td className="py-3 px-4 text-center">
                                <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => handleEdit(cls)}>
                                  <Edit className="w-3.5 h-3.5 mr-1" />{cls.hasRates ? 'Edit' : 'Set'}
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {/* Mobile Cards */}
                    <div className="md:hidden divide-y">
                      {cat.classes.map(cls => (
                        <div key={cls.class_id} className="p-4 space-y-2">
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-sm">{cls.class_name}</p>
                            {cls.hasRates ? (
                              <Badge className="text-[10px] h-5 bg-emerald-100 text-emerald-700 border-emerald-200">Set</Badge>
                            ) : (
                              <Badge className="text-[10px] h-5 bg-amber-100 text-amber-700 border-amber-200">Missing</Badge>
                            )}
                          </div>
                          <div className="grid grid-cols-4 gap-2">
                            {feeTypes.map(ft => (
                              <div key={ft.key} className={`text-center p-2 rounded-lg ${ft.bg}`}>
                                <ft.icon className={`w-3 h-3 ${ft.color} mx-auto mb-1`} />
                                <p className="text-[10px] text-slate-500">{ft.label}</p>
                                <p className="text-xs font-bold">{cls.hasRates ? fmt(cls[ft.key as keyof RateInfo] as number) : '—'}</p>
                              </div>
                            ))}
                          </div>
                          <Button variant="outline" size="sm" className="w-full h-8 text-xs" onClick={() => handleEdit(cls)}>
                            <Edit className="w-3.5 h-3.5 mr-1" />{cls.hasRates ? 'Edit Rates' : 'Set Rates'}
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        )}

        {/* Edit Dialog */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Rates — {editClass?.class_name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {feeTypes.map(ft => (
                <div key={ft.key} className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg ${ft.bg} flex items-center justify-center`}>
                    <ft.icon className={`w-4 h-4 ${ft.color}`} />
                  </div>
                  <Label className="text-xs w-20">{ft.label} Rate</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={editForm[ft.key.replace('_rate', '') as keyof typeof editForm]}
                    onChange={e => setEditForm({ ...editForm, [ft.key.replace('_rate', '')]: e.target.value })}
                    className="font-mono"
                    placeholder="0.00"
                  />
                </div>
              ))}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving} className="bg-violet-600 hover:bg-violet-700">
                {saving ? 'Saving...' : <><Save className="w-4 h-4 mr-1" /> Save</>}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
