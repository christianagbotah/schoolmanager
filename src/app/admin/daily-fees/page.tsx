'use client';

import { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Utensils,
  Coffee,
  BookOpen,
  Droplets,
  Bus,
  GraduationCap,
  Wallet,
  Receipt,
  Save,
  Edit,
  Layers,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Users,
  Clock,
  ArrowRightLeft,
  Search,
  CreditCard,
  Banknote,
  Smartphone,
  Building,
  FileText,
  Printer,
  ChevronDown,
  RotateCcw,
  Calendar,
  BarChart3,
  HandCoins,
} from 'lucide-react';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart';
import { Bar, BarChart, XAxis, YAxis } from 'recharts';

// =================== TYPES ===================
interface ClassInfo {
  class_id: number;
  name: string;
  name_numeric: number;
  category: string;
}

interface FeeRate {
  id: number;
  class_id: number;
  feeding_rate: number;
  breakfast_rate: number;
  classes_rate: number;
  water_rate: number;
  year: string;
  term: string;
  class: { class_id: number; name: string; name_numeric: number; category: string };
}

interface StudentInfo {
  student_id: number;
  name: string;
  student_code: string;
  sex: string;
  class_id: number;
  class_name: string;
  name_numeric: number;
  category?: string;
  section_name: string;
  rates: any | null;
  todayTransaction?: any | null;
}

interface ReportSummary {
  feedingTotal: number;
  breakfastTotal: number;
  classesTotal: number;
  waterTotal: number;
  transportTotal: number;
  totalAmount: number;
  transactionCount: number;
  cashTotal: number;
  cashCount: number;
  mobileMoneyTotal: number;
  mobileMoneyCount: number;
  bankTransferTotal: number;
  bankTransferCount: number;
  chequeTotal: number;
  chequeCount: number;
  byCollector: Record<string, { total: number; count: number }>;
  uniqueStudents: number;
  startDate: string;
  endDate: string;
}

interface DayHistory {
  date: string;
  label: string;
  feeding: number;
  breakfast: number;
  classes: number;
  water: number;
  transport: number;
  total: number;
  count: number;
}

interface HandoverCollector {
  name: string;
  transactionCount: number;
  totalCollected: number;
  feedingTotal: number;
  breakfastTotal: number;
  classesTotal: number;
  waterTotal: number;
  transportTotal: number;
  cashTotal: number;
  cashCount: number;
  momoTotal: number;
  momoCount: number;
  bankTotal: number;
  bankCount: number;
  chequeTotal: number;
  chequeCount: number;
  transactions: any[];
}

// =================== CONSTANTS ===================
const feeTypes = [
  { key: 'feeding', label: 'Feeding', icon: Utensils, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200', gradient: 'from-orange-500 to-red-500' },
  { key: 'breakfast', label: 'Breakfast', icon: Coffee, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', gradient: 'from-amber-400 to-orange-400' },
  { key: 'classes', label: 'Classes', icon: BookOpen, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', gradient: 'from-emerald-500 to-teal-500' },
  { key: 'water', label: 'Water', icon: Droplets, color: 'text-sky-600', bg: 'bg-sky-50', border: 'border-sky-200', gradient: 'from-sky-500 to-cyan-500' },
  { key: 'transport', label: 'Transport', icon: Bus, color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-200', gradient: 'from-violet-500 to-purple-500' },
] as const;

const chartConfig = {
  feeding: { label: 'Feeding', color: '#f97316' },
  breakfast: { label: 'Breakfast', color: '#f59e0b' },
  classes: { label: 'Classes', color: '#10b981' },
  water: { label: 'Water', color: '#0ea5e9' },
  transport: { label: 'Transport', color: '#8b5cf6' },
};

const paymentMethods = [
  { value: 'cash', label: 'Cash', icon: Banknote },
  { value: 'mobile_money', label: 'Mobile Money', icon: Smartphone },
  { value: 'bank_transfer', label: 'Bank Transfer', icon: Building },
  { value: 'cheque', label: 'Cheque', icon: CreditCard },
];

function fmt(n: number) {
  return `GH₵ ${(n || 0).toFixed(2)}`;
}

function fmtShort(n: number) {
  if (n >= 1000) return `GH₵ ${(n / 1000).toFixed(1)}k`;
  return `GH₵ ${n.toFixed(2)}`;
}

// =================== SKELETONS ===================
function StatCardsSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i}><CardContent className="p-4"><Skeleton className="h-16 w-full" /></CardContent></Card>
      ))}
    </div>
  );
}

// =================== MAIN COMPONENT ===================
export default function DailyFeesDashboard() {
  const [activeTab, setActiveTab] = useState('overview');

  // ========== OVERVIEW STATE ==========
  const [todaySummary, setTodaySummary] = useState<ReportSummary | null>(null);
  const [weekSummary, setWeekSummary] = useState<ReportSummary | null>(null);
  const [monthSummary, setMonthSummary] = useState<ReportSummary | null>(null);
  const [history, setHistory] = useState<DayHistory[]>([]);
  const [overviewLoading, setOverviewLoading] = useState(true);

  // ========== RATES STATE ==========
  const [rates, setRates] = useState<FeeRate[]>([]);
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [ratesLoading, setRatesLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [editClass, setEditClass] = useState<ClassInfo | null>(null);
  const [editRate, setEditRate] = useState<FeeRate | null>(null);
  const [editForm, setEditForm] = useState({ feeding: '', breakfast: '', classes: '', water: '' });
  const [saving, setSaving] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkItems, setBulkItems] = useState<any[]>([]);
  const [bulkSaving, setBulkSaving] = useState(false);

  // ========== COLLECTION STATE ==========
  const [classList, setClassList] = useState<ClassInfo[]>([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [students, setStudents] = useState<StudentInfo[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<StudentInfo | null>(null);
  const [studentSearch, setStudentSearch] = useState('');
  const [allStudents, setAllStudents] = useState<StudentInfo[]>([]);
  const [collectLoading, setCollectLoading] = useState(false);
  const [classRates, setClassRates] = useState<any>(null);

  // Fee toggles
  const [collectFeeding, setCollectFeeding] = useState(false);
  const [collectBreakfast, setCollectBreakfast] = useState(false);
  const [collectClasses, setCollectClasses] = useState(false);
  const [collectWater, setCollectWater] = useState(false);
  const [transportDirection, setTransportDirection] = useState('none');
  const [transportFare, setTransportFare] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [collecting, setCollecting] = useState(false);
  const [lastReceipt, setLastReceipt] = useState<any>(null);

  // ========== HANDOVER STATE ==========
  const [handoverData, setHandoverData] = useState<{
    date: string;
    collectors: HandoverCollector[];
    grandTotal: any;
    allTransactions: any[];
  } | null>(null);
  const [handoverLoading, setHandoverLoading] = useState(true);
  const [handoverDate, setHandoverDate] = useState(new Date().toISOString().split('T')[0]);

  // =================== FETCH DATA ===================
  const fetchOverview = useCallback(async () => {
    setOverviewLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const [todayRes, weekRes, monthRes] = await Promise.all([
        fetch(`/api/admin/daily-fees/report?period=today&date=${today}`),
        fetch(`/api/admin/daily-fees/report?period=week&date=${today}`),
        fetch(`/api/admin/daily-fees/report?period=month&date=${today}`),
      ]);
      const [todayData, weekData, monthData] = await Promise.all([
        todayRes.json(),
        weekRes.json(),
        monthRes.json(),
      ]);
      setTodaySummary(todayData.summary || null);
      setWeekSummary(weekData.summary || null);
      setMonthSummary(monthData.summary || null);
      setHistory(weekData.history || []);
    } catch {
      toast.error('Failed to load overview data');
    } finally {
      setOverviewLoading(false);
    }
  }, []);

  const fetchRates = useCallback(async () => {
    setRatesLoading(true);
    try {
      const res = await fetch('/api/admin/daily-fees/rates');
      const data = await res.json();
      setRates(data.rates || []);
      setClasses(data.classes || []);
      const items = (data.classes || []).map((c: ClassInfo) => {
        const existing = (data.rates || []).find((r: FeeRate) => r.class_id === c.class_id);
        return {
          class_id: c.class_id,
          class_name: `${c.name} ${c.name_numeric}`,
          category: c.category,
          rate_id: existing?.id || 0,
          feeding: String(existing?.feeding_rate || 0),
          breakfast: String(existing?.breakfast_rate || 0),
          classes: String(existing?.classes_rate || 0),
          water: String(existing?.water_rate || 0),
        };
      });
      setBulkItems(items);
    } catch {
      toast.error('Failed to load fee rates');
    } finally {
      setRatesLoading(false);
    }
  }, []);

  const fetchClasses = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/daily-fees/rates');
      const data = await res.json();
      setClassList(data.classes || []);
    } catch {}
  }, []);

  const fetchAllStudents = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/daily-fees/collect');
      const data = await res.json();
      setAllStudents(data.students || []);
    } catch {}
  }, []);

  const fetchHandover = useCallback(async (date?: string) => {
    setHandoverLoading(true);
    try {
      const d = date || new Date().toISOString().split('T')[0];
      const res = await fetch(`/api/admin/daily-fees/handover?date=${d}`);
      const data = await res.json();
      setHandoverData(data);
    } catch {
      toast.error('Failed to load handover data');
    } finally {
      setHandoverLoading(false);
    }
  }, []);

  useEffect(() => { fetchOverview(); fetchRates(); fetchClasses(); fetchAllStudents(); }, [fetchOverview, fetchRates, fetchClasses, fetchAllStudents]);
  useEffect(() => { if (activeTab === 'handover') fetchHandover(handoverDate); }, [activeTab, handoverDate, fetchHandover]);

  // =================== RATES HANDLERS ===================
  const handleEdit = (cls: ClassInfo, rate: FeeRate | null) => {
    setEditClass(cls);
    setEditRate(rate);
    setEditForm({
      feeding: String(rate?.feeding_rate || 0),
      breakfast: String(rate?.breakfast_rate || 0),
      classes: String(rate?.classes_rate || 0),
      water: String(rate?.water_rate || 0),
    });
    setEditOpen(true);
  };

  const handleSaveEdit = async () => {
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
    } catch (err: any) { toast.error(err.message); } finally { setSaving(false); }
  };

  const handleBulkSave = async () => {
    setBulkSaving(true);
    try {
      const items = bulkItems.map((item) => ({
        class_id: item.class_id,
        rate_id: item.rate_id,
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
    } catch (err: any) { toast.error(err.message); } finally { setBulkSaving(false); }
  };

  // =================== COLLECTION HANDLERS ===================
  const handleClassSelect = async (classId: string) => {
    setSelectedClassId(classId);
    setSelectedStudent(null);
    resetCollection();
    if (!classId) { setStudents([]); return; }
    setCollectLoading(true);
    try {
      const res = await fetch(`/api/admin/daily-fees/collect?class_id=${classId}`);
      const data = await res.json();
      setStudents(data.students || []);
      setClassRates(data.rates || null);
    } catch { toast.error('Failed to load students'); } finally { setCollectLoading(false); }
  };

  const handleStudentSelect = (student: StudentInfo) => {
    setSelectedStudent(student);
    resetCollection();
    // If student has rates from their class, use those
    if (student.rates) {
      setClassRates(student.rates);
    }
  };

  const resetCollection = () => {
    setCollectFeeding(false);
    setCollectBreakfast(false);
    setCollectClasses(false);
    setCollectWater(false);
    setTransportDirection('none');
    setTransportFare(0);
    setLastReceipt(null);
  };

  const totalAmount = (classRates?.feeding_rate || 0) * (collectFeeding ? 1 : 0) +
    (classRates?.breakfast_rate || 0) * (collectBreakfast ? 1 : 0) +
    (classRates?.classes_rate || 0) * (collectClasses ? 1 : 0) +
    (classRates?.water_rate || 0) * (collectWater ? 1 : 0) +
    transportFare;

  const handleCollect = async () => {
    if (!selectedStudent) return;
    if (totalAmount <= 0) { toast.error('Please select at least one fee type'); return; }

    setCollecting(true);
    try {
      const res = await fetch('/api/admin/daily-fees/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: selectedStudent.student_id,
          feeding_amount: collectFeeding ? (classRates?.feeding_rate || 0) : 0,
          breakfast_amount: collectBreakfast ? (classRates?.breakfast_rate || 0) : 0,
          classes_amount: collectClasses ? (classRates?.classes_rate || 0) : 0,
          water_amount: collectWater ? (classRates?.water_rate || 0) : 0,
          transport_amount: transportFare,
          payment_method: paymentMethod,
          collected_by: 'Admin',
          payment_date: new Date().toISOString().split('T')[0],
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast.success(data.message || `GH₵ ${totalAmount.toFixed(2)} collected`);
      setLastReceipt(data.transaction);
      // Refresh today stats
      fetchOverview();
    } catch (err: any) { toast.error(err.message); } finally { setCollecting(false); }
  };

  const handlePrintReceipt = () => {
    if (!lastReceipt) return;
    const w = window.open('', '_blank', 'width=400,height=600');
    if (!w) return;
    w.document.write(`
      <html><head><title>Receipt</title><style>
        body{font-family:Arial,sans-serif;padding:20px;max-width:350px;margin:auto}
        .center{text-align:center}.bold{font-weight:bold}
        .line{border-top:1px dashed #333;margin:10px 0}
        .row{display:flex;justify-content:space-between;margin:4px 0}
        h2{margin:0}.sm{font-size:12px;color:#666}
      </style></head><body>
        <div class="center"><h2>DAILY FEE RECEIPT</h2><p class="sm">${new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p></div>
        <div class="line"></div>
        <div class="row"><span>Student:</span><span class="bold">${selectedStudent?.name}</span></div>
        <div class="row"><span>Code:</span><span>${selectedStudent?.student_code}</span></div>
        <div class="row"><span>Class:</span><span>${selectedStudent?.class_name} ${selectedStudent?.name_numeric}</span></div>
        <div class="row"><span>Transaction:</span><span>${lastReceipt.transaction_code}</span></div>
        <div class="line"></div>
        ${lastReceipt.feeding_amount > 0 ? `<div class="row"><span>Feeding:</span><span>GH₵ ${lastReceipt.feeding_amount.toFixed(2)}</span></div>` : ''}
        ${lastReceipt.breakfast_amount > 0 ? `<div class="row"><span>Breakfast:</span><span>GH₵ ${lastReceipt.breakfast_amount.toFixed(2)}</span></div>` : ''}
        ${lastReceipt.classes_amount > 0 ? `<div class="row"><span>Classes:</span><span>GH₵ ${lastReceipt.classes_amount.toFixed(2)}</span></div>` : ''}
        ${lastReceipt.water_amount > 0 ? `<div class="row"><span>Water:</span><span>GH₵ ${lastReceipt.water_amount.toFixed(2)}</span></div>` : ''}
        ${lastReceipt.transport_amount > 0 ? `<div class="row"><span>Transport:</span><span>GH₵ ${lastReceipt.transport_amount.toFixed(2)}</span></div>` : ''}
        <div class="line"></div>
        <div class="row"><span class="bold">TOTAL:</span><span class="bold" style="font-size:18px">GH₵ ${lastReceipt.total_amount.toFixed(2)}</span></div>
        <div class="row"><span>Method:</span><span>${paymentMethod.replace('_', ' ').toUpperCase()}</span></div>
        <div class="line"></div>
        <p class="center sm">Thank you for your payment!</p>
      </body></html>
    `);
    w.document.close();
    setTimeout(() => w.print(), 300);
  };

  // Filtered students for search
  const filteredStudents = studentSearch
    ? allStudents.filter(s => s.name.toLowerCase().includes(studentSearch.toLowerCase()) || s.student_code.toLowerCase().includes(studentSearch.toLowerCase()))
    : allStudents;

  // Group classes by category for rates
  const grouped = classes.reduce<Record<string, ClassInfo[]>>((acc, c) => {
    const cat = c.category || 'Other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(c);
    return acc;
  }, {});
  const getRateForClass = (classId: number) => rates.find((r) => r.class_id === classId);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-md">
                <Wallet className="w-5 h-5 text-white" />
              </div>
              Daily Fee Management
            </h1>
            <p className="text-sm text-slate-500 mt-1 ml-[52px]">Manage rates, collect daily fees, and generate reports</p>
          </div>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
            <TabsTrigger value="overview" className="gap-1.5"><BarChart3 className="w-4 h-4" /><span className="hidden sm:inline">Overview</span></TabsTrigger>
            <TabsTrigger value="rates" className="gap-1.5"><GraduationCap className="w-4 h-4" /><span className="hidden sm:inline">Fee Rates</span></TabsTrigger>
            <TabsTrigger value="collection" className="gap-1.5"><HandCoins className="w-4 h-4" /><span className="hidden sm:inline">Collection</span></TabsTrigger>
            <TabsTrigger value="handover" className="gap-1.5"><ArrowRightLeft className="w-4 h-4" /><span className="hidden sm:inline">Handover</span></TabsTrigger>
          </TabsList>

          {/* ========== OVERVIEW TAB ========== */}
          <TabsContent value="overview" className="mt-6 space-y-6">
            {overviewLoading ? (
              <>
                <StatCardsSkeleton count={3} />
                <StatCardsSkeleton count={5} />
              </>
            ) : (
              <>
                {/* Period Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    { label: "Today's Collection", summary: todaySummary, icon: Calendar, color: 'from-emerald-500 to-teal-500', period: new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }) },
                    { label: "This Week", summary: weekSummary, icon: TrendingUp, color: 'from-sky-500 to-cyan-500', period: weekSummary?.startDate && weekSummary?.endDate ? `${weekSummary.startDate} — ${weekSummary.endDate}` : '' },
                    { label: "This Month", summary: monthSummary, icon: BarChart3, color: 'from-violet-500 to-purple-500', period: new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }) },
                  ].map((periodCard) => (
                    <Card key={periodCard.label} className="overflow-hidden">
                      <div className={`h-1.5 bg-gradient-to-r ${periodCard.color}`} />
                      <CardContent className="p-5">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${periodCard.color} flex items-center justify-center shadow-sm`}>
                              <periodCard.icon className="w-4 h-4 text-white" />
                            </div>
                            <div>
                              <p className="text-xs text-slate-500 font-medium">{periodCard.label}</p>
                              <p className="text-[10px] text-slate-400">{periodCard.period}</p>
                            </div>
                          </div>
                          <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">
                            {periodCard.summary?.transactionCount || 0} txns
                          </Badge>
                        </div>
                        <p className="text-2xl font-bold text-slate-900 font-mono">{fmt(periodCard.summary?.totalAmount || 0)}</p>
                        <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-400">
                          <span><Banknote className="w-3 h-3 inline mr-0.5" />{fmt(periodCard.summary?.cashTotal || 0)}</span>
                          <span><Smartphone className="w-3 h-3 inline mr-0.5" />{fmt(periodCard.summary?.mobileMoneyTotal || 0)}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Fee Type Breakdown */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                  {feeTypes.map((ft) => {
                    const val = todaySummary?.[`${ft.key}Total` as keyof ReportSummary] as number || 0;
                    return (
                      <Card key={ft.key} className={`hover:shadow-md transition-all hover:-translate-y-0.5 cursor-default border-l-4 border-l-transparent`}
                        style={{ borderLeftColor: ft.key === 'feeding' ? '#f97316' : ft.key === 'breakfast' ? '#f59e0b' : ft.key === 'classes' ? '#10b981' : ft.key === 'water' ? '#0ea5e9' : '#8b5cf6' }}>
                        <CardContent className="p-4">
                          <div className={`w-8 h-8 rounded-lg ${ft.bg} flex items-center justify-center mb-2`}>
                            <ft.icon className={`w-4 h-4 ${ft.color}`} />
                          </div>
                          <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">{ft.label}</p>
                          <p className="text-lg font-bold font-mono text-slate-900">{fmt(val)}</p>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                {/* Weekly Chart + Payment Methods */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {/* Chart */}
                  <Card className="lg:col-span-2">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-slate-400" />
                        Weekly Collection Trend
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <ChartContainer config={chartConfig} className="h-[280px] w-full">
                        <BarChart data={history} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                          <XAxis dataKey="label" tick={{ fontSize: 10 }} tickLine={false} />
                          <YAxis tick={{ fontSize: 10 }} tickLine={false} tickFormatter={(v) => fmtShort(v)} />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <ChartLegend content={<ChartLegendContent />} />
                          <Bar dataKey="feeding" stackId="a" fill="var(--color-feeding)" radius={[0, 0, 0, 0]} />
                          <Bar dataKey="breakfast" stackId="a" fill="var(--color-breakfast)" />
                          <Bar dataKey="classes" stackId="a" fill="var(--color-classes)" />
                          <Bar dataKey="water" stackId="a" fill="var(--color-water)" />
                          <Bar dataKey="transport" stackId="a" fill="var(--color-transport)" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ChartContainer>
                    </CardContent>
                  </Card>

                  {/* Payment Methods */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-slate-400" />
                        Today by Method
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0 space-y-3">
                      {[
                        { label: 'Cash', amount: todaySummary?.cashTotal || 0, count: todaySummary?.cashCount || 0, icon: Banknote, color: 'bg-emerald-500' },
                        { label: 'Mobile Money', amount: todaySummary?.mobileMoneyTotal || 0, count: todaySummary?.mobileMoneyCount || 0, icon: Smartphone, color: 'bg-violet-500' },
                        { label: 'Bank Transfer', amount: todaySummary?.bankTransferTotal || 0, count: todaySummary?.bankTransferCount || 0, icon: Building, color: 'bg-sky-500' },
                        { label: 'Cheque', amount: todaySummary?.chequeTotal || 0, count: todaySummary?.chequeCount || 0, icon: CreditCard, color: 'bg-amber-500' },
                      ].map((m) => {
                        const total = todaySummary?.totalAmount || 1;
                        const pct = (m.amount / total * 100);
                        return (
                          <div key={m.label} className="space-y-1">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className={`w-6 h-6 rounded ${m.color} flex items-center justify-center`}>
                                  <m.icon className="w-3 h-3 text-white" />
                                </div>
                                <span className="text-xs font-medium text-slate-700">{m.label}</span>
                              </div>
                              <div className="text-right">
                                <p className="text-xs font-bold font-mono">{fmt(m.amount)}</p>
                                <p className="text-[10px] text-slate-400">{m.count} txns</p>
                              </div>
                            </div>
                            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${m.color} transition-all`} style={{ width: `${Math.min(pct, 100)}%` }} />
                            </div>
                          </div>
                        );
                      })}
                      <Separator />
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-semibold text-slate-600">Total</span>
                        <span className="font-bold font-mono text-slate-900">{fmt(todaySummary?.totalAmount || 0)}</span>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] text-slate-400">{todaySummary?.uniqueStudents || 0} unique students</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Quick Action */}
                <div className="flex flex-wrap gap-3">
                  <Button onClick={() => setActiveTab('collection')} className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-md">
                    <HandCoins className="w-4 h-4 mr-2" />Collect Fees
                  </Button>
                  <Button onClick={() => setActiveTab('rates')} variant="outline">
                    <GraduationCap className="w-4 h-4 mr-2" />Manage Rates
                  </Button>
                  <Button onClick={() => setActiveTab('handover')} variant="outline">
                    <ArrowRightLeft className="w-4 h-4 mr-2" />Cash Handover
                  </Button>
                </div>
              </>
            )}
          </TabsContent>

          {/* ========== FEE RATES TAB ========== */}
          <TabsContent value="rates" className="mt-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {rates.length} classes with rates
                </Badge>
                <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
                  {classes.length - rates.length} missing
                </Badge>
              </div>
              <Button onClick={() => setBulkOpen(true)} className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-md">
                <Layers className="w-4 h-4 mr-2" />Bulk Assign Rates
              </Button>
            </div>

            {ratesLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i}><CardContent className="p-5"><Skeleton className="h-24 w-full" /></CardContent></Card>
                ))}
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(grouped).map(([category, categoryClasses]) => (
                  <div key={category}>
                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">{category || 'Uncategorized'}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {categoryClasses.map((cls) => {
                        const rate = getRateForClass(cls.class_id);
                        const totalRate = rate ? rate.feeding_rate + rate.breakfast_rate + rate.classes_rate + rate.water_rate : 0;
                        return (
                          <Card
                            key={cls.class_id}
                            className={`hover:shadow-md transition-all hover:-translate-y-0.5 ${
                              rate ? 'border-l-4 border-l-violet-500' : 'border-l-4 border-l-amber-400 border-dashed bg-amber-50/30'
                            }`}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                  <div className={`w-8 h-8 rounded-lg ${rate ? 'bg-violet-100' : 'bg-amber-100'} flex items-center justify-center`}>
                                    <GraduationCap className={`w-4 h-4 ${rate ? 'text-violet-600' : 'text-amber-600'}`} />
                                  </div>
                                  <div>
                                    <p className="font-semibold text-sm text-slate-800">{cls.name} {cls.name_numeric}</p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                      {rate ? (
                                        <Badge variant="outline" className="text-[10px] h-5 bg-emerald-50 text-emerald-700 border-emerald-200">Rates Set</Badge>
                                      ) : (
                                        <Badge variant="outline" className="text-[10px] h-5 bg-amber-50 text-amber-700 border-amber-200">No Rates</Badge>
                                      )}
                                      {totalRate > 0 && (
                                        <span className="text-[10px] text-slate-400 font-mono">Total: {fmt(totalRate)}/day</span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <Button variant="outline" size="sm" onClick={() => handleEdit(cls, rate || null)} className="h-8">
                                  <Edit className="w-3.5 h-3.5 mr-1" />{rate ? 'Edit' : 'Set Rates'}
                                </Button>
                              </div>
                              <div className="grid grid-cols-4 gap-2">
                                {feeTypes.filter(ft => ft.key !== 'transport').map((ft) => {
                                  const val = rate ? (rate as any)[`${ft.key}_rate`] : 0;
                                  return (
                                    <div key={ft.key} className={`text-center p-2 rounded-lg ${ft.bg}`}>
                                      <ft.icon className={`w-3.5 h-3.5 ${ft.color} mx-auto mb-1`} />
                                      <p className="text-[10px] text-slate-500">{ft.label}</p>
                                      <p className="text-sm font-bold text-slate-800">{fmt(val)}</p>
                                    </div>
                                  );
                                })}
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ========== COLLECTION TAB ========== */}
          <TabsContent value="collection" className="mt-6 space-y-6">
            {/* Student Selection */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Search className="w-4 h-4 text-slate-400" />
                  Select Student to Collect Fee
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Search Input */}
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Search by Name or Code</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input
                        placeholder="Type student name or code..."
                        value={studentSearch}
                        onChange={(e) => setStudentSearch(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                  </div>
                  {/* Class Filter */}
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Or Filter by Class</Label>
                    <Select value={selectedClassId} onValueChange={handleClassSelect}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select class..." />
                      </SelectTrigger>
                      <SelectContent className="max-h-64">
                        {classList.map((c) => (
                          <SelectItem key={c.class_id} value={String(c.class_id)}>
                            <span className="text-xs text-slate-400 mr-1">{c.category}</span>
                            {c.name} {c.name_numeric}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Student List */}
                {selectedClassId && students.length > 0 && !studentSearch && (
                  <div className="mt-4">
                    <p className="text-xs font-medium text-slate-500 mb-2">
                      {students.length} students in {students[0]?.class_name} {students[0]?.name_numeric}
                      <Badge variant="outline" className="ml-2 text-[10px]">{students.filter(s => s.todayTransaction).length} collected</Badge>
                    </p>
                    <ScrollArea className="h-64">
                      <div className="space-y-1">
                        {students.map((s) => (
                          <button
                            key={s.student_id}
                            onClick={() => handleStudentSelect(s)}
                            className={`w-full flex items-center justify-between p-2.5 rounded-lg text-left transition-all hover:bg-slate-50 ${selectedStudent?.student_id === s.student_id ? 'bg-violet-50 border border-violet-200' : 'border border-transparent'}`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${s.sex === 'male' ? 'bg-sky-100 text-sky-700' : 'bg-pink-100 text-pink-700'}`}>
                                {s.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-slate-800 truncate">{s.name}</p>
                                <p className="text-[10px] text-slate-400">{s.student_code} {s.section_name ? `• ${s.section_name}` : ''}</p>
                              </div>
                            </div>
                            {s.todayTransaction ? (
                              <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200 flex-shrink-0">
                                <CheckCircle className="w-3 h-3 mr-1" />{fmt(s.todayTransaction.total_amount)}
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700 border-amber-200 flex-shrink-0">
                                Pending
                              </Badge>
                            )}
                          </button>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                )}

                {/* Search Results */}
                {studentSearch && (
                  <div className="mt-4">
                    <p className="text-xs font-medium text-slate-500 mb-2">
                      {filteredStudents.length} students found
                    </p>
                    <ScrollArea className="h-64">
                      <div className="space-y-1">
                        {filteredStudents.slice(0, 50).map((s) => (
                          <button
                            key={s.student_id}
                            onClick={() => { setSelectedStudent(s); handleClassSelect(String(s.class_id)); }}
                            className="w-full flex items-center justify-between p-2.5 rounded-lg text-left transition-all hover:bg-slate-50 border border-transparent"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${s.sex === 'male' ? 'bg-sky-100 text-sky-700' : 'bg-pink-100 text-pink-700'}`}>
                                {s.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-slate-800 truncate">{s.name}</p>
                                <p className="text-[10px] text-slate-400">{s.student_code} • {s.class_name} {s.name_numeric}</p>
                              </div>
                            </div>
                            <ChevronDown className="w-4 h-4 text-slate-300" />
                          </button>
                        ))}
                        {filteredStudents.length === 0 && (
                          <p className="text-center text-sm text-slate-400 py-8">No students found</p>
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Fee Collection Form */}
            {selectedStudent && (
              <>
                {/* Student Card */}
                <Card className="border-violet-200 bg-gradient-to-r from-violet-50/50 to-purple-50/50">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold ${selectedStudent.sex === 'male' ? 'bg-sky-200 text-sky-800' : 'bg-pink-200 text-pink-800'}`}>
                        {selectedStudent.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800">{selectedStudent.name}</p>
                        <p className="text-xs text-slate-500">{selectedStudent.student_code} • {selectedStudent.class_name} {selectedStudent.name_numeric}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => { setSelectedStudent(null); resetCollection(); }}>
                      <RotateCcw className="w-4 h-4 mr-1" />Reset
                    </Button>
                  </CardContent>
                </Card>

                {/* Fee Type Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {/* Feeding */}
                  <Card
                    className={`cursor-pointer transition-all hover:-translate-y-0.5 ${collectFeeding ? 'ring-2 ring-orange-400 shadow-md' : ''}`}
                    onClick={() => setCollectFeeding(!collectFeeding)}
                  >
                    <CardContent className="p-4 text-center">
                      <div className={`w-12 h-12 rounded-xl mx-auto mb-2 flex items-center justify-center ${collectFeeding ? 'bg-gradient-to-br from-orange-500 to-red-500 shadow-lg' : 'bg-orange-100'}`}>
                        <Utensils className={`w-6 h-6 ${collectFeeding ? 'text-white' : 'text-orange-600'}`} />
                      </div>
                      <p className="text-xs font-medium text-slate-500">Feeding</p>
                      <p className="text-lg font-bold font-mono text-slate-800">{fmt(classRates?.feeding_rate || 0)}</p>
                      <div className={`mt-2 px-3 py-1 rounded-full text-[10px] font-semibold ${collectFeeding ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-400'}`}>
                        {collectFeeding ? '✓ Selected' : 'Tap to collect'}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Breakfast */}
                  <Card
                    className={`cursor-pointer transition-all hover:-translate-y-0.5 ${collectBreakfast ? 'ring-2 ring-amber-400 shadow-md' : ''}`}
                    onClick={() => setCollectBreakfast(!collectBreakfast)}
                  >
                    <CardContent className="p-4 text-center">
                      <div className={`w-12 h-12 rounded-xl mx-auto mb-2 flex items-center justify-center ${collectBreakfast ? 'bg-gradient-to-br from-amber-400 to-orange-400 shadow-lg' : 'bg-amber-100'}`}>
                        <Coffee className={`w-6 h-6 ${collectBreakfast ? 'text-white' : 'text-amber-600'}`} />
                      </div>
                      <p className="text-xs font-medium text-slate-500">Breakfast</p>
                      <p className="text-lg font-bold font-mono text-slate-800">{fmt(classRates?.breakfast_rate || 0)}</p>
                      <div className={`mt-2 px-3 py-1 rounded-full text-[10px] font-semibold ${collectBreakfast ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-400'}`}>
                        {collectBreakfast ? '✓ Selected' : 'Tap to collect'}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Classes */}
                  <Card
                    className={`cursor-pointer transition-all hover:-translate-y-0.5 ${collectClasses ? 'ring-2 ring-emerald-400 shadow-md' : ''}`}
                    onClick={() => setCollectClasses(!collectClasses)}
                  >
                    <CardContent className="p-4 text-center">
                      <div className={`w-12 h-12 rounded-xl mx-auto mb-2 flex items-center justify-center ${collectClasses ? 'bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg' : 'bg-emerald-100'}`}>
                        <BookOpen className={`w-6 h-6 ${collectClasses ? 'text-white' : 'text-emerald-600'}`} />
                      </div>
                      <p className="text-xs font-medium text-slate-500">Classes</p>
                      <p className="text-lg font-bold font-mono text-slate-800">{fmt(classRates?.classes_rate || 0)}</p>
                      <div className={`mt-2 px-3 py-1 rounded-full text-[10px] font-semibold ${collectClasses ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>
                        {collectClasses ? '✓ Selected' : 'Tap to collect'}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Water */}
                  <Card
                    className={`cursor-pointer transition-all hover:-translate-y-0.5 ${collectWater ? 'ring-2 ring-sky-400 shadow-md' : ''}`}
                    onClick={() => setCollectWater(!collectWater)}
                  >
                    <CardContent className="p-4 text-center">
                      <div className={`w-12 h-12 rounded-xl mx-auto mb-2 flex items-center justify-center ${collectWater ? 'bg-gradient-to-br from-sky-500 to-cyan-500 shadow-lg' : 'bg-sky-100'}`}>
                        <Droplets className={`w-6 h-6 ${collectWater ? 'text-white' : 'text-sky-600'}`} />
                      </div>
                      <p className="text-xs font-medium text-slate-500">Water</p>
                      <p className="text-lg font-bold font-mono text-slate-800">{fmt(classRates?.water_rate || 0)}</p>
                      <div className={`mt-2 px-3 py-1 rounded-full text-[10px] font-semibold ${collectWater ? 'bg-sky-100 text-sky-700' : 'bg-slate-100 text-slate-400'}`}>
                        {collectWater ? '✓ Selected' : 'Tap to collect'}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Transport */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <Bus className="w-4 h-4 text-violet-500" />
                      Transport (Optional)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs font-medium">Direction</Label>
                        <Select value={transportDirection} onValueChange={(v) => {
                          setTransportDirection(v);
                          const base = 0; // transport fare would come from route
                          if (v === 'in' || v === 'out') setTransportFare(base);
                          else if (v === 'both') setTransportFare(base * 2);
                          else setTransportFare(0);
                        }}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Not Using</SelectItem>
                            <SelectItem value="in">Morning Only</SelectItem>
                            <SelectItem value="out">Afternoon Only</SelectItem>
                            <SelectItem value="both">Both Ways</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-medium">Fare Amount (GH₵)</Label>
                        <Input
                          type="number"
                          step="0.50"
                          min="0"
                          value={transportFare || ''}
                          onChange={(e) => setTransportFare(parseFloat(e.target.value) || 0)}
                          placeholder="0.00"
                          className="font-mono text-right"
                          disabled={transportDirection === 'none'}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Total & Collect */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Total Display */}
                  <Card className="bg-gradient-to-r from-violet-500 to-purple-600 border-0 text-white">
                    <CardContent className="p-6 text-center">
                      <p className="text-sm opacity-90 font-medium">Total Amount</p>
                      <p className="text-3xl font-bold font-mono mt-1">{fmt(totalAmount)}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {[collectFeeding && 'Feeding', collectBreakfast && 'Breakfast', collectClasses && 'Classes', collectWater && 'Water', transportDirection !== 'none' && 'Transport'].filter(Boolean).join(' + ')}
                      </p>
                    </CardContent>
                  </Card>

                  {/* Payment Method */}
                  <Card>
                    <CardContent className="p-6 space-y-3">
                      <Label className="text-sm font-semibold flex items-center gap-2">
                        <CreditCard className="w-4 h-4" />Payment Method
                      </Label>
                      <div className="grid grid-cols-2 gap-2">
                        {paymentMethods.map((pm) => (
                          <button
                            key={pm.value}
                            onClick={() => setPaymentMethod(pm.value)}
                            className={`flex items-center gap-2 p-2.5 rounded-lg text-left transition-all border ${paymentMethod === pm.value ? 'border-violet-400 bg-violet-50 shadow-sm' : 'border-slate-200 hover:border-slate-300'}`}
                          >
                            <pm.icon className={`w-4 h-4 ${paymentMethod === pm.value ? 'text-violet-600' : 'text-slate-400'}`} />
                            <span className={`text-xs font-medium ${paymentMethod === pm.value ? 'text-violet-700' : 'text-slate-600'}`}>{pm.label}</span>
                          </button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Action */}
                  <Card className="flex flex-col justify-between">
                    <CardContent className="p-6 flex flex-col items-center justify-center h-full gap-3">
                      {lastReceipt ? (
                        <>
                          <div className="text-center">
                            <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                            <p className="text-sm font-semibold text-emerald-700">Payment Collected!</p>
                            <p className="text-xs text-slate-400 font-mono">{lastReceipt.transaction_code}</p>
                          </div>
                          <div className="flex gap-2 w-full">
                            <Button onClick={handlePrintReceipt} variant="outline" className="flex-1">
                              <Printer className="w-4 h-4 mr-1" />Print
                            </Button>
                            <Button onClick={() => { resetCollection(); }} className="flex-1 bg-violet-600 hover:bg-violet-700">
                              <RotateCcw className="w-4 h-4 mr-1" />Next
                            </Button>
                          </div>
                        </>
                      ) : (
                        <Button
                          onClick={handleCollect}
                          disabled={totalAmount <= 0 || collecting}
                          className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white py-6 text-lg font-bold shadow-lg"
                        >
                          {collecting ? (
                            <span className="flex items-center gap-2"><span className="animate-spin">⟳</span>Processing...</span>
                          ) : (
                            <span className="flex items-center gap-2"><HandCoins className="w-5 h-5" />Collect {fmt(totalAmount)}</span>
                          )}
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </>
            )}

            {/* Empty State */}
            {!selectedStudent && (
              <Card className="border-dashed">
                <CardContent className="p-12 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                    <Search className="w-8 h-8 text-slate-300" />
                  </div>
                  <p className="font-semibold text-slate-500">Select a Student</p>
                  <p className="text-sm text-slate-400 mt-1">Search by name/code or filter by class to begin collecting fees</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ========== HANDOVER TAB ========== */}
          <TabsContent value="handover" className="mt-6 space-y-6">
            {/* Date Selector */}
            <div className="flex items-center gap-3">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Calendar className="w-4 h-4" />Handover Date
              </Label>
              <Input
                type="date"
                value={handoverDate}
                onChange={(e) => setHandoverDate(e.target.value)}
                className="w-auto"
              />
            </div>

            {handoverLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : handoverData ? (
              <>
                {/* Grand Totals */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <Receipt className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
                      <p className="text-[10px] text-slate-400 uppercase">Total Collected</p>
                      <p className="text-xl font-bold font-mono text-slate-900">{fmt(handoverData.grandTotal.totalCollected)}</p>
                      <p className="text-[10px] text-slate-400">{handoverData.grandTotal.transactionCount} transactions</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <Banknote className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
                      <p className="text-[10px] text-slate-400 uppercase">Cash</p>
                      <p className="text-xl font-bold font-mono text-slate-900">{fmt(handoverData.grandTotal.cashTotal)}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <Smartphone className="w-5 h-5 text-violet-600 mx-auto mb-1" />
                      <p className="text-[10px] text-slate-400 uppercase">Mobile Money</p>
                      <p className="text-xl font-bold font-mono text-slate-900">{fmt(handoverData.grandTotal.momoTotal)}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <Building className="w-5 h-5 text-sky-600 mx-auto mb-1" />
                      <p className="text-[10px] text-slate-400 uppercase">Bank Transfer</p>
                      <p className="text-xl font-bold font-mono text-slate-900">{fmt(handoverData.grandTotal.bankTotal)}</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Breakdown by Fee Type */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold">Collection by Fee Type</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-5 gap-3">
                      {feeTypes.map((ft) => {
                        const val = handoverData.grandTotal[`${ft.key}Total` as keyof typeof handoverData.grandTotal] as number || 0;
                        return (
                          <div key={ft.key} className={`text-center p-3 rounded-lg ${ft.bg}`}>
                            <ft.icon className={`w-5 h-5 ${ft.color} mx-auto mb-1`} />
                            <p className="text-[10px] text-slate-500">{ft.label}</p>
                            <p className="text-sm font-bold font-mono">{fmt(val)}</p>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Collector Breakdown */}
                {handoverData.collectors.length > 0 && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <Users className="w-4 h-4 text-slate-400" />
                        Breakdown by Cashier
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {handoverData.collectors.map((collector, idx) => (
                          <div key={collector.name} className="p-4 rounded-lg border border-slate-200">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                                  {collector.name.slice(0, 2).toUpperCase()}
                                </div>
                                <div>
                                  <p className="font-semibold text-sm text-slate-800">{collector.name}</p>
                                  <p className="text-[10px] text-slate-400">{collector.transactionCount} transactions</p>
                                </div>
                              </div>
                              <p className="text-lg font-bold font-mono text-emerald-600">{fmt(collector.totalCollected)}</p>
                            </div>
                            <div className="grid grid-cols-4 gap-2 text-center">
                              <div className="p-2 bg-orange-50 rounded">
                                <Utensils className="w-3.5 h-3.5 text-orange-600 mx-auto mb-0.5" />
                                <p className="text-[10px] text-slate-400">Feeding</p>
                                <p className="text-xs font-bold font-mono">{fmt(collector.feedingTotal)}</p>
                              </div>
                              <div className="p-2 bg-amber-50 rounded">
                                <Coffee className="w-3.5 h-3.5 text-amber-600 mx-auto mb-0.5" />
                                <p className="text-[10px] text-slate-400">Breakfast</p>
                                <p className="text-xs font-bold font-mono">{fmt(collector.breakfastTotal)}</p>
                              </div>
                              <div className="p-2 bg-emerald-50 rounded">
                                <BookOpen className="w-3.5 h-3.5 text-emerald-600 mx-auto mb-0.5" />
                                <p className="text-[10px] text-slate-400">Classes</p>
                                <p className="text-xs font-bold font-mono">{fmt(collector.classesTotal)}</p>
                              </div>
                              <div className="p-2 bg-sky-50 rounded">
                                <Droplets className="w-3.5 h-3.5 text-sky-600 mx-auto mb-0.5" />
                                <p className="text-[10px] text-slate-400">Water</p>
                                <p className="text-xs font-bold font-mono">{fmt(collector.waterTotal)}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4 mt-2 text-[10px] text-slate-500">
                              <span>Cash: {fmt(collector.cashTotal)} ({collector.cashCount})</span>
                              <span>Momo: {fmt(collector.momoTotal)} ({collector.momoCount})</span>
                              <span>Bank: {fmt(collector.bankTotal)} ({collector.bankCount})</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Recent Transactions Table */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <FileText className="w-4 h-4 text-slate-400" />
                      All Transactions ({handoverData.allTransactions.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {handoverData.allTransactions.length === 0 ? (
                      <p className="text-center text-sm text-slate-400 py-8">No transactions for this date</p>
                    ) : (
                      <ScrollArea className="max-h-96">
                        <table className="w-full text-sm">
                          <thead className="sticky top-0 bg-white">
                            <tr className="border-b text-left">
                              <th className="py-2 px-2 text-xs font-semibold text-slate-500">#</th>
                              <th className="py-2 px-2 text-xs font-semibold text-slate-500">Student</th>
                              <th className="py-2 px-2 text-xs font-semibold text-slate-500">Feeding</th>
                              <th className="py-2 px-2 text-xs font-semibold text-slate-500">Breakfast</th>
                              <th className="py-2 px-2 text-xs font-semibold text-slate-500">Classes</th>
                              <th className="py-2 px-2 text-xs font-semibold text-slate-500">Water</th>
                              <th className="py-2 px-2 text-xs font-semibold text-slate-500">Transport</th>
                              <th className="py-2 px-2 text-xs font-semibold text-slate-500">Total</th>
                              <th className="py-2 px-2 text-xs font-semibold text-slate-500">Method</th>
                            </tr>
                          </thead>
                          <tbody>
                            {handoverData.allTransactions.map((tx: any, i: number) => (
                              <tr key={tx.id} className="border-b last:border-0 hover:bg-slate-50">
                                <td className="py-2 px-2 text-xs text-slate-400">{i + 1}</td>
                                <td className="py-2 px-2">
                                  <p className="text-xs font-medium text-slate-700">{tx.student?.name || '-'}</p>
                                  <p className="text-[10px] text-slate-400">{tx.transaction_code}</p>
                                </td>
                                <td className="py-2 px-2 text-xs font-mono">{tx.feeding_amount > 0 ? fmt(tx.feeding_amount) : '-'}</td>
                                <td className="py-2 px-2 text-xs font-mono">{tx.breakfast_amount > 0 ? fmt(tx.breakfast_amount) : '-'}</td>
                                <td className="py-2 px-2 text-xs font-mono">{tx.classes_amount > 0 ? fmt(tx.classes_amount) : '-'}</td>
                                <td className="py-2 px-2 text-xs font-mono">{tx.water_amount > 0 ? fmt(tx.water_amount) : '-'}</td>
                                <td className="py-2 px-2 text-xs font-mono">{tx.transport_amount > 0 ? fmt(tx.transport_amount) : '-'}</td>
                                <td className="py-2 px-2 text-xs font-bold font-mono text-emerald-600">{fmt(tx.total_amount)}</td>
                                <td className="py-2 px-2">
                                  <Badge variant="outline" className="text-[10px]">
                                    {String(tx.payment_method || '').replace('_', ' ').toUpperCase()}
                                  </Badge>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </ScrollArea>
                    )}
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card className="border-dashed">
                <CardContent className="p-12 text-center">
                  <ArrowRightLeft className="w-10 h-10 text-slate-300 mx-auto mb-4" />
                  <p className="font-semibold text-slate-500">No Handover Data</p>
                  <p className="text-sm text-slate-400 mt-1">No fee collections found for this date</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* ========== EDIT RATE DIALOG ========== */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-violet-600" />
              {editRate ? 'Edit' : 'Set'} Fee Rates — {editClass?.name} {editClass?.name_numeric}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            {feeTypes.filter(ft => ft.key !== 'transport').map((ft) => (
              <div key={ft.key} className="space-y-2">
                <Label className="text-xs font-medium flex items-center gap-1.5">
                  <div className={`w-5 h-5 rounded ${ft.bg} flex items-center justify-center`}>
                    <ft.icon className={`w-3 h-3 ${ft.color}`} />
                  </div>
                  {ft.label} Rate (GH₵)
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={editForm[ft.key as keyof typeof editForm]}
                  onChange={(e) => setEditForm({ ...editForm, [ft.key]: e.target.value })}
                  className="text-right font-mono"
                />
              </div>
            ))}
          </div>
          <div className="bg-slate-50 rounded-lg p-3 text-center">
            <p className="text-xs text-slate-400">Total Daily Rate</p>
            <p className="text-lg font-bold text-slate-800">
              {fmt(parseFloat(editForm.feeding) + parseFloat(editForm.breakfast) + parseFloat(editForm.classes) + parseFloat(editForm.water))}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveEdit} disabled={saving} className="bg-violet-600 hover:bg-violet-700">
              <Save className="w-4 h-4 mr-2" />{saving ? 'Saving...' : 'Save Rates'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========== BULK ASSIGN DIALOG ========== */}
      <Dialog open={bulkOpen} onOpenChange={setBulkOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-amber-600" />
              Bulk Assign Fee Rates
            </DialogTitle>
          </DialogHeader>
          <div className="max-h-96 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-white">
                <tr className="border-b">
                  <th className="text-left py-2 px-2 text-xs font-semibold text-slate-500">Class</th>
                  <th className="text-right py-2 px-2 text-xs font-semibold text-slate-500">Feeding</th>
                  <th className="text-right py-2 px-2 text-xs font-semibold text-slate-500">Breakfast</th>
                  <th className="text-right py-2 px-2 text-xs font-semibold text-slate-500">Classes</th>
                  <th className="text-right py-2 px-2 text-xs font-semibold text-slate-500">Water</th>
                </tr>
              </thead>
              <tbody>
                {bulkItems.map((item: any, i: number) => (
                  <tr key={item.class_id} className="border-b last:border-0 hover:bg-slate-50">
                    <td className="py-2 px-2 font-medium text-xs">
                      <span className="inline-block px-2 py-0.5 bg-slate-100 rounded text-[10px] text-slate-500 mr-1">{item.category}</span>
                      {item.class_name}
                    </td>
                    {['feeding', 'breakfast', 'classes', 'water'].map((key) => (
                      <td key={key} className="py-1 px-1">
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item[key]}
                          onChange={(e) => {
                            const updated = [...bulkItems];
                            updated[i] = { ...updated[i], [key]: e.target.value };
                            setBulkItems(updated);
                          }}
                          className="w-24 h-8 text-right text-xs font-mono"
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkOpen(false)}>Cancel</Button>
            <Button onClick={handleBulkSave} disabled={bulkSaving} className="bg-amber-600 hover:bg-amber-700">
              <Save className="w-4 h-4 mr-2" />{bulkSaving ? 'Saving...' : 'Save All Rates'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
