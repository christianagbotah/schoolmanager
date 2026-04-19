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
  DialogDescription,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  GraduationCap, Save, Edit, Layers, Utensils, Coffee, BookOpen, Droplets,
  Search, RotateCcw, CheckCircle, AlertTriangle,
} from 'lucide-react';

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

interface BulkItem {
  class_id: number; class_name: string; category: string; rate_id: number;
  feeding: string; breakfast: string; classes: string; water: string;
}

function fmt(n: number) { return `GH\u20B5 ${(n || 0).toFixed(2)}`; }

const feeTypes = [
  { key: 'feeding_rate', label: 'Feeding', icon: Utensils, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' },
  { key: 'breakfast_rate', label: 'Breakfast', icon: Coffee, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
  { key: 'classes_rate', label: 'Classes', icon: BookOpen, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  { key: 'water_rate', label: 'Water', icon: Droplets, color: 'text-sky-600', bg: 'bg-sky-50', border: 'border-sky-200' },
];

const feeTypeKeys = ['feeding', 'breakfast', 'classes', 'water'] as const;

export default function DailyFeeRatesPage() {
  const [categories, setCategories] = useState<CategoryGroup[]>([]);
  const [stats, setStats] = useState({ totalClasses: 0, classesWithRates: 0 });
  const [year, setYear] = useState('');
  const [term, setTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [search, setSearch] = useState('');

  // Edit dialog state
  const [editOpen, setEditOpen] = useState(false);
  const [editClass, setEditClass] = useState<RateInfo | null>(null);
  const [editForm, setEditForm] = useState({ feeding: '', breakfast: '', classes: '', water: '' });
  const [saving, setSaving] = useState(false);

  // Bulk assign dialog state
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkItems, setBulkItems] = useState<BulkItem[]>([]);
  const [bulkCategory, setBulkCategory] = useState('');
  const [bulkSaving, setBulkSaving] = useState(false);

  // Bulk "set all" quick values
  const [bulkQuickFeeding, setBulkQuickFeeding] = useState('');
  const [bulkQuickBreakfast, setBulkQuickBreakfast] = useState('');
  const [bulkQuickClasses, setBulkQuickClasses] = useState('');
  const [bulkQuickWater, setBulkQuickWater] = useState('');

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
      toast.success(data.message || 'Rates saved');
      setEditOpen(false);
      fetchRates();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save';
      toast.error(msg);
    }
    setSaving(false);
  };

  const openBulkDialog = (category?: string) => {
    setBulkCategory(category || '');
    // Build items from current categories
    const allClasses = categories
      .filter(c => !category || c.category === category)
      .flatMap(c => c.classes);
    const items: BulkItem[] = allClasses.map(cls => ({
      class_id: cls.class_id,
      class_name: cls.class_name,
      category: cls.category,
      rate_id: 0,
      feeding: String(cls.feeding_rate || 0),
      breakfast: String(cls.breakfast_rate || 0),
      classes: String(cls.classes_rate || 0),
      water: String(cls.water_rate || 0),
    }));
    setBulkItems(items);
    setBulkQuickFeeding('');
    setBulkQuickBreakfast('');
    setBulkQuickClasses('');
    setBulkQuickWater('');
    setBulkOpen(true);
  };

  const applyQuickRates = () => {
    setBulkItems(prev => prev.map(item => ({
      ...item,
      feeding: bulkQuickFeeding || item.feeding,
      breakfast: bulkQuickBreakfast || item.breakfast,
      classes: bulkQuickClasses || item.classes,
      water: bulkQuickWater || item.water,
    })));
    toast.success('Quick rates applied to all classes');
  };

  const updateBulkItem = (classId: number, field: string, value: string) => {
    setBulkItems(prev => prev.map(item =>
      item.class_id === classId ? { ...item, [field]: value } : item
    ));
  };

  const handleBulkSave = async () => {
    setBulkSaving(true);
    try {
      const items = bulkItems.map(item => ({
        class_id: item.class_id,
        feeding_rate: parseFloat(item.feeding) || 0,
        breakfast_rate: parseFloat(item.breakfast) || 0,
        classes_rate: parseFloat(item.classes) || 0,
        water_rate: parseFloat(item.water) || 0,
      }));
      const res = await fetch('/api/admin/daily-fees/rates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'bulk', items }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast.success(data.message || 'Bulk rates saved');
      setBulkOpen(false);
      fetchRates();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save';
      toast.error(msg);
    }
    setBulkSaving(false);
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
              <h1 className="text-2xl font-bold text-slate-900">Daily Fee Rates Management</h1>
              <p className="text-sm text-slate-500 mt-0.5">
                Academic Year {year} &middot; Term {term}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200">
              {stats.classesWithRates}/{stats.totalClasses} configured
            </Badge>
            {stats.totalClasses - stats.classesWithRates > 0 && (
              <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
                <AlertTriangle className="w-3 h-3 mr-1" />
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
          <Button
            onClick={() => openBulkDialog('')}
            className="bg-amber-600 hover:bg-amber-700 min-h-[44px]"
          >
            <Layers className="w-4 h-4 mr-2" />Bulk Assign Rates
          </Button>
        </div>

        {/* Rates Cards (CI3 card layout) */}
        {loading ? (
          <div className="space-y-4">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}</div>
        ) : filteredCategories.length === 0 ? (
          <Card><CardContent className="py-16 text-center text-slate-400"><p>No classes found</p></CardContent></Card>
        ) : (
          <div className="space-y-6">
            {filteredCategories.map(cat => (
              <div key={cat.category}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">{cat.category}</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => openBulkDialog(cat.category)}
                  >
                    <Layers className="w-3 h-3 mr-1" />Bulk Set
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {cat.classes.map(cls => (
                    <Card
                      key={cls.class_id}
                      className={`overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-lg ${
                        cls.hasRates
                          ? 'border-l-4 border-l-emerald-500 border-slate-200/60'
                          : 'border-l-4 border-l-amber-400 border-dashed bg-amber-50/30'
                      }`}
                    >
                      <CardContent className="p-5">
                        {/* Card header */}
                        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                              cls.hasRates ? 'bg-emerald-100' : 'bg-amber-100'
                            }`}>
                              <GraduationCap className={`w-4 h-4 ${
                                cls.hasRates ? 'text-emerald-600' : 'text-amber-600'
                              }`} />
                            </div>
                            <div>
                              <p className="font-semibold text-sm text-slate-800">{cls.class_name}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                {cls.hasRates ? (
                                  <Badge className="text-[10px] h-5 bg-emerald-100 text-emerald-700 border-emerald-200">
                                    <CheckCircle className="w-3 h-3 mr-1" />Rates Set
                                  </Badge>
                                ) : (
                                  <Badge className="text-[10px] h-5 bg-amber-100 text-amber-700 border-amber-200">
                                    <AlertTriangle className="w-3 h-3 mr-1" />Not Set
                                  </Badge>
                                )}
                                {cls.total_rate > 0 && (
                                  <span className="text-[10px] text-slate-400 font-mono">
                                    Total: {fmt(cls.total_rate)}/day
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(cls)}
                            className="h-8 min-w-[44px]"
                          >
                            <Edit className="w-3.5 h-3.5 mr-1" />
                            {cls.hasRates ? 'Edit' : 'Set Rates'}
                          </Button>
                        </div>

                        {/* Rate grid (CI3: 4-col rate grid) */}
                        <div className="grid grid-cols-4 gap-3">
                          {feeTypes.map(ft => (
                            <div
                              key={ft.key}
                              className={`text-center p-3 rounded-xl transition-colors ${ft.bg}`}
                            >
                              <ft.icon className={`w-4 h-4 ${ft.color} mx-auto mb-1.5`} />
                              <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wide">{ft.label}</p>
                              <p className="text-sm font-bold text-slate-800 mt-0.5">
                                {cls.hasRates ? fmt(cls[ft.key as keyof RateInfo] as number) : '---'}
                              </p>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* =================== EDIT DIALOG =================== */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center">
                  <Edit className="w-4 h-4 text-violet-600" />
                </div>
                {editClass?.hasRates ? 'Edit Rates' : 'Set Rates'} &mdash; {editClass?.class_name}
              </DialogTitle>
              <DialogDescription>
                {editClass?.hasRates ? 'Update the daily fee rates for this class' : 'Configure daily fee rates for this class'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              {feeTypes.map(ft => (
                <div key={ft.key} className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-lg ${ft.bg} flex items-center justify-center flex-shrink-0`}>
                    <ft.icon className={`w-4 h-4 ${ft.color}`} />
                  </div>
                  <Label className="text-sm font-medium w-24 flex-shrink-0">{ft.label} Rate</Label>
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-medium">GH\u20B5</span>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={editForm[ft.key.replace('_rate', '') as keyof typeof editForm]}
                      onChange={e => setEditForm({ ...editForm, [ft.key.replace('_rate', '')]: e.target.value })}
                      className="font-mono pl-14"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              ))}
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving} className="bg-violet-600 hover:bg-violet-700">
                {saving ? 'Saving...' : <><Save className="w-4 h-4 mr-1" /> Save Rates</>}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* =================== BULK ASSIGN DIALOG =================== */}
        <Dialog open={bulkOpen} onOpenChange={setBulkOpen}>
          <DialogContent className="sm:max-w-4xl max-h-[85vh]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                  <Layers className="w-4 h-4 text-amber-600" />
                </div>
                Bulk Assign Rates
                {bulkCategory && <Badge variant="outline" className="text-xs">{bulkCategory}</Badge>}
              </DialogTitle>
              <DialogDescription>
                Set daily fee rates for {bulkItems.length} classes at once. Use quick fill or edit individually.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Quick Fill Row */}
              <Card className="border-amber-200 bg-amber-50/50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-semibold text-amber-700">Quick Fill All</p>
                    <Button size="sm" onClick={applyQuickRates} variant="outline" className="h-8 text-xs border-amber-300 text-amber-700 hover:bg-amber-100">
                      <CheckCircle className="w-3 h-3 mr-1" />Apply to All
                    </Button>
                  </div>
                  <div className="grid grid-cols-4 gap-3">
                    {feeTypes.map(ft => {
                      const quickKey = `${ft.key.replace('_rate', '')}Quick` as keyof typeof quickAccessors;
                      return (
                        <div key={ft.key}>
                          <Label className="text-[10px] text-slate-500 uppercase tracking-wider">{ft.label}</Label>
                          <div className="relative mt-1">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">\u20B5</span>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              value={ft.key === 'feeding_rate' ? bulkQuickFeeding : ft.key === 'breakfast_rate' ? bulkQuickBreakfast : ft.key === 'classes_rate' ? bulkQuickClasses : bulkQuickWater}
                              onChange={e => {
                                if (ft.key === 'feeding_rate') setBulkQuickFeeding(e.target.value);
                                else if (ft.key === 'breakfast_rate') setBulkQuickBreakfast(e.target.value);
                                else if (ft.key === 'classes_rate') setBulkQuickClasses(e.target.value);
                                else setBulkQuickWater(e.target.value);
                              }}
                              className="font-mono text-xs pl-7 h-9"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Bulk Items Table */}
              <ScrollArea className="h-[400px]">
                <div className="space-y-1">
                  <div className="grid grid-cols-[1fr_repeat(4,minmax(80px,1fr))] gap-2 px-3 py-2 sticky top-0 bg-white z-10">
                    <p className="text-[10px] font-semibold text-slate-500 uppercase">Class</p>
                    {feeTypes.map(ft => (
                      <p key={ft.key} className="text-[10px] font-semibold text-slate-500 uppercase text-center">{ft.label}</p>
                    ))}
                  </div>
                  <Separator />
                  {bulkItems.map(item => (
                    <div
                      key={item.class_id}
                      className="grid grid-cols-[1fr_repeat(4,minmax(80px,1fr))] gap-2 px-3 py-2.5 hover:bg-slate-50 rounded-lg items-center"
                    >
                      <p className="text-sm font-medium text-slate-700 truncate">{item.class_name}</p>
                      {feeTypeKeys.map(key => (
                        <div key={key} className="relative">
                          <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[9px] text-slate-400">\u20B5</span>
                          <Input
                            type="number"
                            step="0.01"
                            value={item[key]}
                            onChange={e => updateBulkItem(item.class_id, key, e.target.value)}
                            className="font-mono text-xs pl-5 h-8 text-right"
                            placeholder="0.00"
                          />
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setBulkOpen(false)}>Cancel</Button>
              <Button onClick={handleBulkSave} disabled={bulkSaving} className="bg-amber-600 hover:bg-amber-700">
                {bulkSaving ? 'Saving...' : <><Save className="w-4 h-4 mr-1" /> Save All Rates ({bulkItems.length} classes)</>}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}


