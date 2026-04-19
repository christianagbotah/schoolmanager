'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
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
  DialogDescription,
} from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
  TrendingUp,
  Users,
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
  Clock,
  Filter,
  UserPlus,
  ArrowUpRight,
  ArrowDownRight,
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

interface CashierSummary {
  totalAmount: number;
  transactionCount: number;
  uniqueStudents: number;
  cashTotal: number;
  cashCount: number;
  momoTotal: number;
  momoCount: number;
  bankTotal: number;
  bankCount: number;
  chequeTotal: number;
  chequeCount: number;
  feedingTotal: number;
  breakfastTotal: number;
  classesTotal: number;
  waterTotal: number;
  transportTotal: number;
  yesterdayTotal: number;
  yesterdayChange: number;
  weekTotal: number;
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

interface Transaction {
  id: number;
  transaction_code: string;
  student_id: number;
  student?: { student_id: number; name: string; student_code: string };
  feeding_amount: number;
  breakfast_amount: number;
  classes_amount: number;
  water_amount: number;
  transport_amount: number;
  total_amount: number;
  payment_method: string;
  collected_by: string;
  payment_date: string;
}

// =================== CONSTANTS ===================
const feeTypes = [
  { key: 'feeding', label: 'Feeding', icon: Utensils, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' },
  { key: 'breakfast', label: 'Breakfast', icon: Coffee, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
  { key: 'classes', label: 'Classes', icon: BookOpen, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  { key: 'water', label: 'Water', icon: Droplets, color: 'text-sky-600', bg: 'bg-sky-50', border: 'border-sky-200' },
  { key: 'transport', label: 'Transport', icon: Bus, color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-200' },
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
  { value: 'mobile_money', label: 'MoMo', icon: Smartphone },
  { value: 'bank_transfer', label: 'Bank', icon: Building },
  { value: 'cheque', label: 'Cheque', icon: CreditCard },
];

function fmt(n: number) {
  return `GH\u20B5 ${(n || 0).toFixed(2)}`;
}

function fmtShort(n: number) {
  if (n >= 1000) return `GH\u20B5 ${(n / 1000).toFixed(1)}k`;
  return `GH\u20B5 ${n.toFixed(2)}`;
}

function fmtTime(dateStr: string) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

function getInitials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
}

function getMethodBadge(method: string) {
  const m = String(method || '').toLowerCase().replace(/ /g, '_');
  if (m === 'cash') return { label: 'Cash', icon: Banknote, cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
  if (m === 'mobile_money') return { label: 'MoMo', icon: Smartphone, cls: 'bg-violet-50 text-violet-700 border-violet-200' };
  if (m === 'bank_transfer') return { label: 'Bank', icon: Building, cls: 'bg-sky-50 text-sky-700 border-sky-200' };
  if (m === 'cheque') return { label: 'Cheque', icon: CreditCard, cls: 'bg-amber-50 text-amber-700 border-amber-200' };
  return { label: method, icon: CreditCard, cls: 'bg-slate-50 text-slate-700 border-slate-200' };
}

// =================== PAGE SKELETON ===================
function DailyFeesSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="pb-4 border-b border-slate-100">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-7 w-32" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-11 w-36 rounded-lg" />
        </div>
      </div>
      {/* Stat card skeletons */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-slate-200/60 bg-white p-4">
            <div className="flex items-center gap-3">
              <Skeleton className="w-11 h-11 rounded-xl flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <Skeleton className="h-3 w-20 mb-2" />
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-3 w-16 mt-1" />
              </div>
            </div>
          </div>
        ))}
      </div>
      {/* Tabs skeleton */}
      <Skeleton className="h-10 w-full max-w-md rounded-xl" />
      {/* Content skeleton */}
      <div className="rounded-2xl border border-slate-200/60 bg-white">
        <div className="p-4 space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}

// =================== MAIN COMPONENT ===================
export default function DailyFeesDashboard() {
  const [activeTab, setActiveTab] = useState('collection');

  // ========== CASHIER STATE ==========
  const [cashierData, setCashierData] = useState<{
    summary: CashierSummary;
    recentTransactions: Transaction[];
    hourlyBreakdown: { hour: number; label: string; amount: number }[];
    byCollector: Record<string, { total: number; count: number }>;
  } | null>(null);
  const [cashierLoading, setCashierLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Filter state for transactions
  const [txSearch, setTxSearch] = useState('');
  const [txMethodFilter, setTxMethodFilter] = useState('__all__');

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

  // Quick Collect Dialog
  const [quickCollectOpen, setQuickCollectOpen] = useState(false);
  const [quickSearch, setQuickSearch] = useState('');
  const [quickStudent, setQuickStudent] = useState<StudentInfo | null>(null);
  const [quickAmount, setQuickAmount] = useState('');
  const [quickMethod, setQuickMethod] = useState('cash');
  const [quickCollecting, setQuickCollecting] = useState(false);
  const [quickReceipt, setQuickReceipt] = useState<any>(null);

  // ========== OVERVIEW STATE ==========
  const [todaySummary, setTodaySummary] = useState<ReportSummary | null>(null);
  const [weekSummary, setWeekSummary] = useState<ReportSummary | null>(null);
  const [monthSummary, setMonthSummary] = useState<ReportSummary | null>(null);
  const [history, setHistory] = useState<DayHistory[]>([]);
  const [overviewLoading, setOverviewLoading] = useState(true);

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
  const fetchCashier = useCallback(async (date?: string) => {
    setCashierLoading(true);
    try {
      const d = date || new Date().toISOString().split('T')[0];
      const res = await fetch(`/api/admin/daily-fees/cashier?date=${d}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setCashierData(data);
    } catch {
      toast.error('Failed to load cashier data');
    } finally {
      setCashierLoading(false);
    }
  }, []);

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
    } catch { /* empty */ }
  }, []);

  const fetchAllStudents = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/daily-fees/collect');
      const data = await res.json();
      setAllStudents(data.students || []);
    } catch { /* empty */ }
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

  useEffect(() => {
    fetchCashier(selectedDate);
    fetchRates();
    fetchClasses();
    fetchAllStudents();
    fetchOverview();
  }, [selectedDate, fetchCashier, fetchRates, fetchClasses, fetchAllStudents, fetchOverview]);
  useEffect(() => { if (activeTab === 'handover') fetchHandover(handoverDate); }, [activeTab, handoverDate, fetchHandover]);

  // =================== FILTERED TRANSACTIONS ===================
  const filteredTransactions = useMemo(() => {
    let txs = cashierData?.recentTransactions || [];
    if (txMethodFilter !== '__all__') {
      txs = txs.filter(t => String(t.payment_method || '').toLowerCase().replace(/ /g, '_') === txMethodFilter);
    }
    if (txSearch) {
      const q = txSearch.toLowerCase();
      txs = txs.filter(t =>
        t.student?.name?.toLowerCase().includes(q) ||
        t.student?.student_code?.toLowerCase().includes(q) ||
        t.transaction_code?.toLowerCase().includes(q)
      );
    }
    return txs;
  }, [cashierData?.recentTransactions, txMethodFilter, txSearch]);

  // =================== QUICK COLLECT ===================
  const quickFilteredStudents = useMemo(() => {
    if (!quickSearch) return allStudents.slice(0, 30);
    const q = quickSearch.toLowerCase();
    return allStudents.filter(s =>
      s.name.toLowerCase().includes(q) || s.student_code.toLowerCase().includes(q)
    ).slice(0, 30);
  }, [allStudents, quickSearch]);

  const handleQuickCollect = async () => {
    if (!quickStudent) { toast.error('Please select a student'); return; }
    const amt = parseFloat(quickAmount) || 0;
    if (amt <= 0) { toast.error('Please enter a valid amount'); return; }
    setQuickCollecting(true);
    try {
      const res = await fetch('/api/admin/daily-fees/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: quickStudent.student_id,
          feeding_amount: 0,
          breakfast_amount: 0,
          classes_amount: amt,
          water_amount: 0,
          transport_amount: 0,
          payment_method: quickMethod,
          collected_by: 'Admin',
          payment_date: new Date().toISOString().split('T')[0],
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast.success(`GH\u20B5 ${amt.toFixed(2)} collected from ${quickStudent.name}`);
      setQuickReceipt(data.transaction);
      fetchCashier(selectedDate);
      fetchOverview();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Collection failed';
      toast.error(message);
    } finally { setQuickCollecting(false); }
  };

  const resetQuickCollect = () => {
    setQuickStudent(null);
    setQuickAmount('');
    setQuickMethod('cash');
    setQuickSearch('');
    setQuickReceipt(null);
  };

  const handleQuickPrintReceipt = () => {
    if (!quickReceipt || !quickStudent) return;
    printReceipt(quickStudent, quickReceipt, quickMethod);
  };

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
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save';
      toast.error(message);
    } finally { setSaving(false); }
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
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save';
      toast.error(message);
    } finally { setBulkSaving(false); }
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
    if (student.rates) setClassRates(student.rates);
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
      toast.success(data.message || `GH\u20B5 ${totalAmount.toFixed(2)} collected`);
      setLastReceipt(data.transaction);
      fetchCashier(selectedDate);
      fetchOverview();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Collection failed';
      toast.error(message);
    } finally { setCollecting(false); }
  };

  const printReceipt = (student: StudentInfo, receipt: any, method: string) => {
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
        <div class="row"><span>Student:</span><span class="bold">${student?.name}</span></div>
        <div class="row"><span>Code:</span><span>${student?.student_code}</span></div>
        <div class="row"><span>Class:</span><span>${student?.class_name} ${student?.name_numeric}</span></div>
        <div class="row"><span>Transaction:</span><span>${receipt.transaction_code}</span></div>
        <div class="line"></div>
        ${receipt.feeding_amount > 0 ? `<div class="row"><span>Feeding:</span><span>GH\u20B5 ${receipt.feeding_amount.toFixed(2)}</span></div>` : ''}
        ${receipt.breakfast_amount > 0 ? `<div class="row"><span>Breakfast:</span><span>GH\u20B5 ${receipt.breakfast_amount.toFixed(2)}</span></div>` : ''}
        ${receipt.classes_amount > 0 ? `<div class="row"><span>Classes:</span><span>GH\u20B5 ${receipt.classes_amount.toFixed(2)}</span></div>` : ''}
        ${receipt.water_amount > 0 ? `<div class="row"><span>Water:</span><span>GH\u20B5 ${receipt.water_amount.toFixed(2)}</span></div>` : ''}
        ${receipt.transport_amount > 0 ? `<div class="row"><span>Transport:</span><span>GH\u20B5 ${receipt.transport_amount.toFixed(2)}</span></div>` : ''}
        <div class="line"></div>
        <div class="row"><span class="bold">TOTAL:</span><span class="bold" style="font-size:18px">GH\u20B5 ${receipt.total_amount.toFixed(2)}</span></div>
        <div class="row"><span>Method:</span><span>${method.replace(/_/g, ' ').toUpperCase()}</span></div>
        <div class="line"></div>
        <p class="center sm">Thank you for your payment!</p>
      </body></html>
    `);
    w.document.close();
    setTimeout(() => w.print(), 300);
  };

  const handlePrintReceipt = () => {
    if (!lastReceipt || !selectedStudent) return;
    printReceipt(selectedStudent, lastReceipt, paymentMethod);
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

  const summary = cashierData?.summary;
  const initialLoading = cashierLoading && ratesLoading;

  // Active filter chips for transactions
  const txActiveFilters: { label: string; onClear: () => void }[] = [];
  if (txSearch) txActiveFilters.push({ label: `Search: "${txSearch}"`, onClear: () => setTxSearch('') });
  if (txMethodFilter !== '__all__') {
    const methodLabels: Record<string, string> = { cash: 'Cash', mobile_money: 'MoMo', bank_transfer: 'Bank', cheque: 'Cheque' };
    txActiveFilters.push({ label: `Method: ${methodLabels[txMethodFilter] || txMethodFilter}`, onClear: () => setTxMethodFilter('__all__') });
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="pb-4 border-b border-slate-100">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Daily Fees</h1>
              <p className="text-sm text-slate-500 mt-1">Cashier portal \u2014 Collect and track daily fee payments</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => { resetQuickCollect(); setQuickCollectOpen(true); }}
                className="bg-emerald-600 hover:bg-emerald-700 min-h-[44px]"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Quick Collect
              </Button>
            </div>
          </div>
        </div>

        {/* ========== STAT CARDS ========== */}
        {cashierLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-slate-200/60 p-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-11 h-11 rounded-xl" />
                  <div className="flex-1">
                    <Skeleton className="h-3 w-20 mb-2" />
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-3 w-16 mt-1" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {/* Today's Collections */}
            <div className="rounded-2xl border border-slate-200/60 bg-white p-4 hover:-translate-y-0.5 hover:shadow-lg transition-all border-l-4 border-l-emerald-500">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-emerald-500 flex items-center justify-center flex-shrink-0">
                  <Wallet className="w-5 h-5 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Today&apos;s Collections</p>
                  <p className="text-2xl font-bold font-mono tabular-nums">{fmt(summary?.totalAmount || 0)}</p>
                  {summary && summary.yesterdayChange !== 0 && (
                    <p className={`text-[10px] font-medium flex items-center gap-0.5 ${summary.yesterdayChange > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                      {summary.yesterdayChange > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                      {Math.abs(summary.yesterdayChange).toFixed(0)}% vs yesterday
                    </p>
                  )}
                </div>
              </div>
            </div>
            {/* Students Served */}
            <div className="rounded-2xl border border-slate-200/60 bg-white p-4 hover:-translate-y-0.5 hover:shadow-lg transition-all border-l-4 border-l-sky-500">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-sky-500 flex items-center justify-center flex-shrink-0">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Students Served</p>
                  <p className="text-2xl font-bold tabular-nums">{summary?.uniqueStudents || 0}</p>
                  <p className="text-[10px] text-slate-400">{summary?.transactionCount || 0} transactions</p>
                </div>
              </div>
            </div>
            {/* Cash */}
            <div className="rounded-2xl border border-slate-200/60 bg-white p-4 hover:-translate-y-0.5 hover:shadow-lg transition-all border-l-4 border-l-amber-500">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-amber-500 flex items-center justify-center flex-shrink-0">
                  <Banknote className="w-5 h-5 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Cash</p>
                  <p className="text-2xl font-bold font-mono tabular-nums">{fmt(summary?.cashTotal || 0)}</p>
                  <p className="text-[10px] text-slate-400">{summary?.cashCount || 0} payments</p>
                </div>
              </div>
            </div>
            {/* Mobile Money */}
            <div className="rounded-2xl border border-slate-200/60 bg-white p-4 hover:-translate-y-0.5 hover:shadow-lg transition-all border-l-4 border-l-violet-500">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-violet-500 flex items-center justify-center flex-shrink-0">
                  <Smartphone className="w-5 h-5 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Mobile Money</p>
                  <p className="text-2xl font-bold font-mono tabular-nums">{fmt(summary?.momoTotal || 0)}</p>
                  <p className="text-[10px] text-slate-400">{summary?.momoCount || 0} payments</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========== MAIN TABS ========== */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4 bg-white border border-slate-200 p-1 rounded-xl h-auto flex w-full sm:w-auto">
            <TabsTrigger value="collection" className="flex-1 min-w-[80px] data-[state=active]:bg-emerald-600 data-[state=active]:text-white rounded-lg py-2 text-sm">
              <HandCoins className="w-4 h-4 mr-1 hidden sm:inline" /> Collect
            </TabsTrigger>
            <TabsTrigger value="transactions" className="flex-1 min-w-[80px] data-[state=active]:bg-emerald-600 data-[state=active]:text-white rounded-lg py-2 text-sm">
              <Receipt className="w-4 h-4 mr-1 hidden sm:inline" /> Transactions
            </TabsTrigger>
            <TabsTrigger value="overview" className="flex-1 min-w-[80px] data-[state=active]:bg-emerald-600 data-[state=active]:text-white rounded-lg py-2 text-sm">
              <BarChart3 className="w-4 h-4 mr-1 hidden sm:inline" /> Reports
            </TabsTrigger>
            <TabsTrigger value="rates" className="flex-1 min-w-[80px] data-[state=active]:bg-emerald-600 data-[state=active]:text-white rounded-lg py-2 text-sm">
              <GraduationCap className="w-4 h-4 mr-1 hidden sm:inline" /> Rates
            </TabsTrigger>
            <TabsTrigger value="handover" className="flex-1 min-w-[80px] data-[state=active]:bg-emerald-600 data-[state=active]:text-white rounded-lg py-2 text-sm">
              <ArrowRightLeft className="w-4 h-4 mr-1 hidden sm:inline" /> Handover
            </TabsTrigger>
          </TabsList>

          {/* ========== COLLECTION TAB ========== */}
          <TabsContent value="collection" className="mt-4 space-y-4">
            {/* Student Selection */}
            <Card className="border-slate-200/60">
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Search by Name or Code</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input
                        placeholder="Type student name or code..."
                        value={studentSearch}
                        onChange={(e) => setStudentSearch(e.target.value)}
                        className="pl-10 min-h-[44px]"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Or Filter by Class</Label>
                    <Select value={selectedClassId} onValueChange={handleClassSelect}>
                      <SelectTrigger className="min-h-[44px] bg-slate-50">
                        <SelectValue placeholder="Select class..." />
                      </SelectTrigger>
                      <SelectContent className="max-h-64">
                        {classList.map((c) => (
                          <SelectItem key={c.class_id} value={String(c.class_id)}>
                            {c.name} {c.name_numeric}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Student List from class filter */}
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
                            className={`w-full flex items-center justify-between p-3 rounded-lg text-left transition-all min-h-[44px] ${selectedStudent?.student_id === s.student_id ? 'bg-emerald-50 border border-emerald-200' : 'hover:bg-slate-50 border border-transparent'}`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${s.sex === 'male' ? 'bg-sky-100 text-sky-700' : 'bg-pink-100 text-pink-700'}`}>
                                {getInitials(s.name)}
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-slate-800 truncate">{s.name}</p>
                                <p className="text-[10px] text-slate-400">{s.student_code} {s.section_name ? `\u2022 ${s.section_name}` : ''}</p>
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
                    <p className="text-xs font-medium text-slate-500 mb-2">{filteredStudents.length} students found</p>
                    <ScrollArea className="h-64">
                      <div className="space-y-1">
                        {filteredStudents.slice(0, 50).map((s) => (
                          <button
                            key={s.student_id}
                            onClick={() => { setSelectedStudent(s); handleClassSelect(String(s.class_id)); }}
                            className="w-full flex items-center justify-between p-3 rounded-lg text-left transition-all hover:bg-slate-50 border border-transparent min-h-[44px]"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${s.sex === 'male' ? 'bg-sky-100 text-sky-700' : 'bg-pink-100 text-pink-700'}`}>
                                {getInitials(s.name)}
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-slate-800 truncate">{s.name}</p>
                                <p className="text-[10px] text-slate-400">{s.student_code} \u2022 {s.class_name} {s.name_numeric}</p>
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
                <Card className="border-emerald-200 bg-gradient-to-r from-emerald-50/50 to-teal-50/50">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${selectedStudent.sex === 'male' ? 'bg-sky-200 text-sky-800' : 'bg-pink-200 text-pink-800'}`}>
                        {getInitials(selectedStudent.name)}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800">{selectedStudent.name}</p>
                        <p className="text-xs text-slate-500">{selectedStudent.student_code} \u2022 {selectedStudent.class_name} {selectedStudent.name_numeric}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => { setSelectedStudent(null); resetCollection(); }} className="min-h-[44px] min-w-[44px]">
                      <RotateCcw className="w-4 h-4 mr-1" />Reset
                    </Button>
                  </CardContent>
                </Card>

                {/* Fee Type Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {feeTypes.filter(ft => ft.key !== 'transport').map((ft) => {
                    const isActive = ft.key === 'feeding' ? collectFeeding : ft.key === 'breakfast' ? collectBreakfast : ft.key === 'classes' ? collectClasses : ft.key === 'water' ? collectWater : false;
                    const toggle = ft.key === 'feeding' ? () => setCollectFeeding(!collectFeeding) : ft.key === 'breakfast' ? () => setCollectBreakfast(!collectBreakfast) : ft.key === 'classes' ? () => setCollectClasses(!collectClasses) : () => setCollectWater(!collectWater);
                    const rate = classRates ? (classRates as any)[`${ft.key}_rate`] || 0 : 0;
                    return (
                      <Card
                        key={ft.key}
                        className={`cursor-pointer transition-all hover:-translate-y-0.5 min-h-[100px] ${isActive ? 'ring-2 ring-emerald-400 shadow-md' : ''}`}
                        onClick={toggle}
                      >
                        <CardContent className="p-4 text-center flex flex-col items-center justify-center h-full">
                          <div className={`w-12 h-12 rounded-xl mx-auto mb-2 flex items-center justify-center ${isActive ? 'bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg' : `${ft.bg}`}`}>
                            <ft.icon className={`w-6 h-6 ${isActive ? 'text-white' : ft.color}`} />
                          </div>
                          <p className="text-xs font-medium text-slate-500">{ft.label}</p>
                          <p className="text-lg font-bold font-mono text-slate-800">{fmt(rate)}</p>
                          <div className={`mt-2 px-3 py-1 rounded-full text-[10px] font-semibold ${isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>
                            {isActive ? '\u2713 Selected' : 'Tap to collect'}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                {/* Transport */}
                <Card className="border-slate-200/60">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <Bus className="w-4 h-4 text-violet-500" />
                      Transport (Optional)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs font-medium">Direction</Label>
                        <Select value={transportDirection} onValueChange={(v) => {
                          setTransportDirection(v);
                          if (v === 'in' || v === 'out') setTransportFare(0);
                          else if (v === 'both') setTransportFare(0);
                          else setTransportFare(0);
                        }}>
                          <SelectTrigger className="min-h-[44px] bg-slate-50">
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
                        <Label className="text-xs font-medium">Fare Amount (GH\u20B5)</Label>
                        <Input
                          type="number"
                          step="0.50"
                          min="0"
                          value={transportFare || ''}
                          onChange={(e) => setTransportFare(parseFloat(e.target.value) || 0)}
                          placeholder="0.00"
                          className="font-mono text-right min-h-[44px]"
                          disabled={transportDirection === 'none'}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Total & Collect */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="bg-gradient-to-r from-emerald-500 to-teal-500 border-0 text-white">
                    <CardContent className="p-6 text-center flex flex-col justify-center h-full">
                      <p className="text-sm opacity-90 font-medium">Total Amount</p>
                      <p className="text-3xl font-bold font-mono mt-1">{fmt(totalAmount)}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {[collectFeeding && 'Feeding', collectBreakfast && 'Breakfast', collectClasses && 'Classes', collectWater && 'Water', transportDirection !== 'none' && 'Transport'].filter(Boolean).join(' + ') || 'No fees selected'}
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-slate-200/60">
                    <CardContent className="p-6 space-y-3 flex flex-col justify-center h-full">
                      <Label className="text-sm font-semibold flex items-center gap-2">
                        <CreditCard className="w-4 h-4" />Payment Method
                      </Label>
                      <div className="grid grid-cols-2 gap-2">
                        {paymentMethods.map((pm) => (
                          <button
                            key={pm.value}
                            onClick={() => setPaymentMethod(pm.value)}
                            className={`flex items-center gap-2 p-2.5 rounded-lg text-left transition-all border min-h-[44px] ${paymentMethod === pm.value ? 'border-emerald-400 bg-emerald-50 shadow-sm' : 'border-slate-200 hover:border-slate-300'}`}
                          >
                            <pm.icon className={`w-4 h-4 ${paymentMethod === pm.value ? 'text-emerald-600' : 'text-slate-400'}`} />
                            <span className={`text-xs font-medium ${paymentMethod === pm.value ? 'text-emerald-700' : 'text-slate-600'}`}>{pm.label}</span>
                          </button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-slate-200/60 flex flex-col justify-center">
                    <CardContent className="p-6 flex flex-col items-center justify-center h-full gap-3">
                      {lastReceipt ? (
                        <>
                          <div className="text-center">
                            <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                            <p className="text-sm font-semibold text-emerald-700">Payment Collected!</p>
                            <p className="text-xs text-slate-400 font-mono">{lastReceipt.transaction_code}</p>
                          </div>
                          <div className="flex gap-2 w-full">
                            <Button onClick={handlePrintReceipt} variant="outline" className="flex-1 min-h-[44px]">
                              <Printer className="w-4 h-4 mr-1" />Print
                            </Button>
                            <Button onClick={() => { resetCollection(); }} className="flex-1 bg-emerald-600 hover:bg-emerald-700 min-h-[44px]">
                              <RotateCcw className="w-4 h-4 mr-1" />Next
                            </Button>
                          </div>
                        </>
                      ) : (
                        <Button
                          onClick={handleCollect}
                          disabled={totalAmount <= 0 || collecting}
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-6 text-lg font-bold shadow-lg min-h-[44px]"
                        >
                          {collecting ? (
                            <span className="flex items-center gap-2"><span className="animate-spin">\u27F3</span>Processing...</span>
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
              <Card className="border-dashed border-slate-200">
                <CardContent className="py-12 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                    <Search className="w-8 h-8 text-slate-300" />
                  </div>
                  <p className="font-semibold text-slate-500">Select a Student</p>
                  <p className="text-sm text-slate-400 mt-1 mb-4">Search by name/code or filter by class to begin collecting fees</p>
                  <Button
                    variant="outline"
                    onClick={() => { resetQuickCollect(); setQuickCollectOpen(true); }}
                    className="min-h-[44px]"
                  >
                    <UserPlus className="w-4 h-4 mr-2" />Use Quick Collect Instead
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ========== TRANSACTIONS TAB ========== */}
          <TabsContent value="transactions" className="mt-4 space-y-4">
            {/* Filter Bar */}
            <div className="rounded-2xl border border-slate-200/60 bg-white p-4">
              <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                <div className="relative flex-1 w-full sm:max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Search by student name, code, or transaction #..."
                    value={txSearch}
                    onChange={(e) => setTxSearch(e.target.value)}
                    className="pl-10 min-h-[44px] bg-slate-50 border-slate-200 focus:bg-white"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <Input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="w-auto min-h-[44px]"
                    />
                  </div>
                  <Select value={txMethodFilter} onValueChange={setTxMethodFilter}>
                    <SelectTrigger className="w-[140px] min-h-[44px] bg-slate-50 border-slate-200 focus:bg-white">
                      <Filter className="w-4 h-4 mr-1 text-slate-400" />
                      <SelectValue placeholder="Method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">All Methods</SelectItem>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="mobile_money">Mobile Money</SelectItem>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      <SelectItem value="cheque">Cheque</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {/* Active Filter Chips */}
              {txActiveFilters.length > 0 && (
                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  <span className="text-xs text-slate-400 font-medium">Active filters:</span>
                  {txActiveFilters.map((f, i) => (
                    <button
                      key={i}
                      onClick={f.onClear}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-medium hover:bg-emerald-100 transition-colors"
                    >
                      {f.label}
                      <RotateCcw className="w-3 h-3" />
                    </button>
                  ))}
                  <button
                    onClick={() => { setTxSearch(''); setTxMethodFilter('__all__'); }}
                    className="text-xs text-slate-500 hover:text-slate-700 font-medium underline"
                  >
                    Clear all
                  </button>
                </div>
              )}
            </div>

            {/* Desktop Table */}
            {cashierLoading ? (
              <Card className="border-slate-200/60"><CardContent className="p-0">
                <div className="p-6 space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
              </CardContent></Card>
            ) : filteredTransactions.length === 0 ? (
              <Card className="border-dashed border-slate-200">
                <CardContent className="py-12 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                    <Receipt className="w-8 h-8 text-slate-300" />
                  </div>
                  <p className="font-semibold text-slate-500">No Transactions Found</p>
                  <p className="text-sm text-slate-400 mt-1">
                    {txSearch || txMethodFilter !== '__all__' ? 'Try adjusting your filters' : 'No fee collections recorded for this date yet'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-500">Showing <span className="font-semibold">{filteredTransactions.length}</span> transaction{filteredTransactions.length !== 1 ? 's' : ''}</p>
                </div>
                {/* Desktop view */}
                <Card className="hidden md:block rounded-2xl border-slate-200/60">
                  <CardContent className="p-0">
                    <div className="max-h-[600px] overflow-y-auto rounded-2xl">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-slate-50">
                            <TableHead className="text-xs font-semibold text-slate-600">Student</TableHead>
                            <TableHead className="text-xs font-semibold text-slate-600">Code</TableHead>
                            <TableHead className="text-xs font-semibold text-slate-600">Amount</TableHead>
                            <TableHead className="text-xs font-semibold text-slate-600">Method</TableHead>
                            <TableHead className="text-xs font-semibold text-slate-600">Time</TableHead>
                            <TableHead className="text-xs font-semibold text-slate-600">Cashier</TableHead>
                            <TableHead className="text-xs font-semibold text-slate-600">Ref</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredTransactions.map((tx) => {
                            const badge = getMethodBadge(tx.payment_method);
                            return (
                              <TableRow key={tx.id} className="hover:bg-slate-50">
                                <TableCell className="text-sm font-medium">{tx.student?.name || '-'}</TableCell>
                                <TableCell className="text-xs text-slate-500 font-mono">{tx.student?.student_code || '-'}</TableCell>
                                <TableCell className="text-sm font-bold font-mono text-emerald-700">{fmt(tx.total_amount)}</TableCell>
                                <TableCell>
                                  <Badge variant="outline" className={`text-[10px] ${badge.cls}`}>
                                    {badge.label}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-xs text-slate-500">
                                  <div className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />{fmtTime(tx.payment_date)}
                                  </div>
                                </TableCell>
                                <TableCell className="text-xs text-slate-500">{tx.collected_by || '-'}</TableCell>
                                <TableCell className="text-[10px] text-slate-400 font-mono">{tx.transaction_code}</TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>

                {/* Mobile Card View */}
                <div className="md:hidden space-y-2">
                  {filteredTransactions.map((tx) => {
                    const badge = getMethodBadge(tx.payment_method);
                    return (
                      <Card key={tx.id} className="border-slate-200/60">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-xs font-bold text-emerald-700 flex-shrink-0">
                                {getInitials(tx.student?.name || '?')}
                              </div>
                              <div className="min-w-0">
                                <p className="font-semibold text-sm text-slate-800 truncate">{tx.student?.name || '-'}</p>
                                <p className="text-[10px] text-slate-400 font-mono">{tx.student?.student_code}</p>
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="font-bold font-mono text-emerald-700">{fmt(tx.total_amount)}</p>
                              <Badge variant="outline" className={`text-[10px] ${badge.cls}`}>{badge.label}</Badge>
                            </div>
                          </div>
                          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[10px] text-slate-400">
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{fmtTime(tx.payment_date)}</span>
                            <span>by {tx.collected_by || '-'}</span>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </>
            )}
          </TabsContent>

          {/* ========== OVERVIEW / REPORTS TAB ========== */}
          <TabsContent value="overview" className="mt-4 space-y-6">
            {overviewLoading ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}</div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}</div>
              </div>
            ) : (
              <>
                {/* Period Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    { label: "Today's Collection", summary: todaySummary, icon: Calendar, color: 'from-emerald-500 to-teal-500', period: new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }) },
                    { label: "This Week", summary: weekSummary, icon: TrendingUp, color: 'from-sky-500 to-cyan-500', period: weekSummary?.startDate && weekSummary?.endDate ? `${weekSummary.startDate} \u2014 ${weekSummary.endDate}` : '' },
                    { label: "This Month", summary: monthSummary, icon: BarChart3, color: 'from-violet-500 to-purple-500', period: new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }) },
                  ].map((periodCard) => (
                    <Card key={periodCard.label} className="overflow-hidden border-slate-200/60">
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
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {feeTypes.map((ft) => {
                    const val = todaySummary?.[`${ft.key}Total` as keyof ReportSummary] as number || 0;
                    return (
                      <Card key={ft.key} className="border-slate-200/60 hover:shadow-md transition-all hover:-translate-y-0.5 cursor-default">
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

                {/* Weekly Chart */}
                <Card className="border-slate-200/60">
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
              </>
            )}
          </TabsContent>

          {/* ========== FEE RATES TAB ========== */}
          <TabsContent value="rates" className="mt-4 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">{rates.length} classes with rates</Badge>
                <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">{classes.length - rates.length} missing</Badge>
              </div>
              <Button onClick={() => setBulkOpen(true)} className="bg-amber-600 hover:bg-amber-700 min-h-[44px]">
                <Layers className="w-4 h-4 mr-2" />Bulk Assign Rates
              </Button>
            </div>

            {ratesLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
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
                          <Card key={cls.class_id} className={`hover:shadow-md transition-all hover:-translate-y-0.5 ${rate ? 'border-l-4 border-l-emerald-500 border-slate-200/60' : 'border-l-4 border-l-amber-400 border-dashed bg-amber-50/30'}`}>
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                  <div className={`w-8 h-8 rounded-lg ${rate ? 'bg-emerald-100' : 'bg-amber-100'} flex items-center justify-center`}>
                                    <GraduationCap className={`w-4 h-4 ${rate ? 'text-emerald-600' : 'text-amber-600'}`} />
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
                                <Button variant="outline" size="sm" onClick={() => handleEdit(cls, rate || null)} className="h-8 min-w-[44px]">
                                  <Edit className="w-3.5 h-3.5 mr-1" />{rate ? 'Edit' : 'Set'}
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

          {/* ========== HANDOVER TAB ========== */}
          <TabsContent value="handover" className="mt-4 space-y-4">
            <div className="flex items-center gap-3">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Calendar className="w-4 h-4" />Handover Date
              </Label>
              <Input
                type="date"
                value={handoverDate}
                onChange={(e) => setHandoverDate(e.target.value)}
                className="w-auto min-h-[44px]"
              />
            </div>

            {handoverLoading ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 w-full rounded-xl" />)}</div>
                <Skeleton className="h-64 w-full rounded-xl" />
              </div>
            ) : handoverData ? (
              <>
                {/* Grand Totals */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <Card className="border-slate-200/60">
                    <CardContent className="p-4 text-center">
                      <Receipt className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
                      <p className="text-[10px] text-slate-400 uppercase">Total Collected</p>
                      <p className="text-xl font-bold font-mono text-slate-900">{fmt(handoverData.grandTotal.totalCollected)}</p>
                      <p className="text-[10px] text-slate-400">{handoverData.grandTotal.transactionCount} transactions</p>
                    </CardContent>
                  </Card>
                  <Card className="border-slate-200/60">
                    <CardContent className="p-4 text-center">
                      <Banknote className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
                      <p className="text-[10px] text-slate-400 uppercase">Cash</p>
                      <p className="text-xl font-bold font-mono text-slate-900">{fmt(handoverData.grandTotal.cashTotal)}</p>
                    </CardContent>
                  </Card>
                  <Card className="border-slate-200/60">
                    <CardContent className="p-4 text-center">
                      <Smartphone className="w-5 h-5 text-violet-600 mx-auto mb-1" />
                      <p className="text-[10px] text-slate-400 uppercase">Mobile Money</p>
                      <p className="text-xl font-bold font-mono text-slate-900">{fmt(handoverData.grandTotal.momoTotal)}</p>
                    </CardContent>
                  </Card>
                  <Card className="border-slate-200/60">
                    <CardContent className="p-4 text-center">
                      <Building className="w-5 h-5 text-sky-600 mx-auto mb-1" />
                      <p className="text-[10px] text-slate-400 uppercase">Bank Transfer</p>
                      <p className="text-xl font-bold font-mono text-slate-900">{fmt(handoverData.grandTotal.bankTotal)}</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Breakdown by Fee Type */}
                <Card className="border-slate-200/60">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold">Collection by Fee Type</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
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
                  <Card className="border-slate-200/60">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <Users className="w-4 h-4 text-slate-400" />
                        Breakdown by Cashier
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {handoverData.collectors.map((collector) => (
                          <div key={collector.name} className="p-4 rounded-lg border border-slate-200">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white text-xs font-bold">
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

                {/* All Transactions */}
                <Card className="border-slate-200/60">
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
                      <div className="max-h-96 overflow-y-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-slate-50">
                              <TableHead className="text-xs font-semibold text-slate-600">#</TableHead>
                              <TableHead className="text-xs font-semibold text-slate-600">Student</TableHead>
                              <TableHead className="text-xs font-semibold text-slate-600 hidden sm:table-cell">Fees</TableHead>
                              <TableHead className="text-xs font-semibold text-slate-600">Total</TableHead>
                              <TableHead className="text-xs font-semibold text-slate-600">Method</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {handoverData.allTransactions.map((tx: any, i: number) => (
                              <TableRow key={tx.id} className="hover:bg-slate-50">
                                <TableCell className="text-xs text-slate-400">{i + 1}</TableCell>
                                <TableCell>
                                  <p className="text-xs font-medium text-slate-700">{tx.student?.name || '-'}</p>
                                  <p className="text-[10px] text-slate-400">{tx.transaction_code}</p>
                                </TableCell>
                                <TableCell className="hidden sm:table-cell text-xs font-mono text-slate-500">
                                  {[
                                    tx.feeding_amount > 0 ? `F:${fmt(tx.feeding_amount)}` : '',
                                    tx.breakfast_amount > 0 ? `B:${fmt(tx.breakfast_amount)}` : '',
                                    tx.classes_amount > 0 ? `C:${fmt(tx.classes_amount)}` : '',
                                    tx.water_amount > 0 ? `W:${fmt(tx.water_amount)}` : '',
                                    tx.transport_amount > 0 ? `T:${fmt(tx.transport_amount)}` : '',
                                  ].filter(Boolean).join(' ')}
                                </TableCell>
                                <TableCell className="text-xs font-bold font-mono text-emerald-600">{fmt(tx.total_amount)}</TableCell>
                                <TableCell>
                                  <Badge variant="outline" className="text-[10px]">{String(tx.payment_method || '').replace(/_/g, ' ').toUpperCase()}</Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card className="border-dashed">
                <CardContent className="py-12 text-center">
                  <ArrowRightLeft className="w-10 h-10 text-slate-300 mx-auto mb-4" />
                  <p className="font-semibold text-slate-500">No Handover Data</p>
                  <p className="text-sm text-slate-400 mt-1">No fee collections found for this date</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* ========== QUICK COLLECT DIALOG ========== */}
      <Dialog open={quickCollectOpen} onOpenChange={(open) => { if (!open) resetQuickCollect(); setQuickCollectOpen(open); }}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          {quickReceipt ? (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-emerald-700">
                  <CheckCircle className="w-5 h-5" />
                  Payment Collected!
                </DialogTitle>
                <DialogDescription>Transaction completed successfully</DialogDescription>
              </DialogHeader>
              <div className="py-4 text-center space-y-3">
                <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
                  <CheckCircle className="w-8 h-8 text-emerald-600" />
                </div>
                <p className="text-2xl font-bold font-mono text-emerald-700">{fmt(quickReceipt.total_amount)}</p>
                <p className="text-sm text-slate-500">{quickStudent?.name}</p>
                <p className="text-xs text-slate-400 font-mono">{quickReceipt.transaction_code}</p>
              </div>
              <DialogFooter className="flex gap-2 sm:gap-0">
                <Button variant="outline" onClick={handleQuickPrintReceipt} className="flex-1 min-h-[44px]">
                  <Printer className="w-4 h-4 mr-2" />Print Receipt
                </Button>
                <Button onClick={() => { resetQuickCollect(); }} className="flex-1 bg-emerald-600 hover:bg-emerald-700 min-h-[44px]">
                  <RotateCcw className="w-4 h-4 mr-2" />Collect Another
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-emerald-600" />
                  Quick Collect Fee
                </DialogTitle>
                <DialogDescription>Search for a student and enter the collection amount</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                {/* Student Search */}
                <div className="grid gap-2">
                  <Label className="text-xs">Student *</Label>
                  {quickStudent ? (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-50 border border-emerald-200 min-h-[44px]">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${quickStudent.sex === 'male' ? 'bg-sky-100 text-sky-700' : 'bg-pink-100 text-pink-700'}`}>
                        {getInitials(quickStudent.name)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-800 truncate">{quickStudent.name}</p>
                        <p className="text-[10px] text-slate-400">{quickStudent.student_code} \u2022 {quickStudent.class_name} {quickStudent.name_numeric}</p>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => setQuickStudent(null)} className="h-8 w-8 p-0 flex-shrink-0">
                        \u00D7
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                          placeholder="Search by name or student code..."
                          value={quickSearch}
                          onChange={(e) => setQuickSearch(e.target.value)}
                          className="pl-10 min-h-[44px]"
                          autoFocus
                        />
                      </div>
                      {quickSearch && quickFilteredStudents.length > 0 && (
                        <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-lg">
                          {quickFilteredStudents.map((s) => (
                            <button
                              key={s.student_id}
                              onClick={() => { setQuickStudent(s); setQuickSearch(''); }}
                              className="w-full flex items-center gap-2.5 p-3 text-left hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0 min-h-[44px]"
                            >
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${s.sex === 'male' ? 'bg-sky-100 text-sky-700' : 'bg-pink-100 text-pink-700'}`}>
                                {getInitials(s.name)}
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-slate-800 truncate">{s.name}</p>
                                <p className="text-[10px] text-slate-400">{s.student_code} \u2022 {s.class_name} {s.name_numeric}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                      {quickSearch && quickFilteredStudents.length === 0 && (
                        <p className="text-xs text-slate-400 text-center py-4">No students found</p>
                      )}
                    </>
                  )}
                </div>

                {/* Amount */}
                <div className="grid gap-2">
                  <Label className="text-xs">Amount (GH\u20B5) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={quickAmount}
                    onChange={(e) => setQuickAmount(e.target.value)}
                    className="font-mono text-right text-lg min-h-[44px]"
                  />
                </div>

                {/* Payment Method */}
                <div className="grid gap-2">
                  <Label className="text-xs">Payment Method</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {paymentMethods.map((pm) => (
                      <button
                        key={pm.value}
                        type="button"
                        onClick={() => setQuickMethod(pm.value)}
                        className={`flex items-center gap-2 p-3 rounded-lg text-left transition-all border min-h-[44px] ${quickMethod === pm.value ? 'border-emerald-400 bg-emerald-50 shadow-sm' : 'border-slate-200 hover:border-slate-300'}`}
                      >
                        <pm.icon className={`w-4 h-4 ${quickMethod === pm.value ? 'text-emerald-600' : 'text-slate-400'}`} />
                        <span className={`text-xs font-medium ${quickMethod === pm.value ? 'text-emerald-700' : 'text-slate-600'}`}>{pm.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => { resetQuickCollect(); setQuickCollectOpen(false); }} className="min-h-[44px]">Cancel</Button>
                <Button
                  onClick={handleQuickCollect}
                  disabled={!quickStudent || !quickAmount || parseFloat(quickAmount) <= 0 || quickCollecting}
                  className="bg-emerald-600 hover:bg-emerald-700 min-h-[44px]"
                >
                  {quickCollecting ? (
                    <span className="flex items-center gap-2"><span className="animate-spin">\u27F3</span>Processing...</span>
                  ) : (
                    <span className="flex items-center gap-2"><HandCoins className="w-4 h-4" />Collect {quickAmount ? fmt(parseFloat(quickAmount)) : 'GH\u20B5 0.00'}</span>
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ========== EDIT RATE DIALOG ========== */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-emerald-600" />
              {editRate ? 'Edit' : 'Set'} Fee Rates \u2014 {editClass?.name} {editClass?.name_numeric}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            {feeTypes.filter(ft => ft.key !== 'transport').map((ft) => (
              <div key={ft.key} className="space-y-2">
                <Label className="text-xs font-medium flex items-center gap-1.5">
                  <div className={`w-5 h-5 rounded ${ft.bg} flex items-center justify-center`}>
                    <ft.icon className={`w-3 h-3 ${ft.color}`} />
                  </div>
                  {ft.label} Rate (GH\u20B5)
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={editForm[ft.key as keyof typeof editForm]}
                  onChange={(e) => setEditForm({ ...editForm, [ft.key]: e.target.value })}
                  className="text-right font-mono min-h-[44px]"
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
            <Button variant="outline" onClick={() => setEditOpen(false)} className="min-h-[44px]">Cancel</Button>
            <Button onClick={handleSaveEdit} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 min-h-[44px]">
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
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead className="text-left text-xs font-semibold text-slate-500">Class</TableHead>
                  <TableHead className="text-right text-xs font-semibold text-slate-500">Feeding</TableHead>
                  <TableHead className="text-right text-xs font-semibold text-slate-500">Breakfast</TableHead>
                  <TableHead className="text-right text-xs font-semibold text-slate-500">Classes</TableHead>
                  <TableHead className="text-right text-xs font-semibold text-slate-500">Water</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bulkItems.map((item: any, i: number) => (
                  <TableRow key={item.class_id} className="hover:bg-slate-50">
                    <TableCell className="font-medium text-xs">
                      <span className="inline-block px-2 py-0.5 bg-slate-100 rounded text-[10px] text-slate-500 mr-1">{item.category}</span>
                      {item.class_name}
                    </TableCell>
                    {['feeding', 'breakfast', 'classes', 'water'].map((key) => (
                      <TableCell key={key} className="py-1">
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
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkOpen(false)} className="min-h-[44px]">Cancel</Button>
            <Button onClick={handleBulkSave} disabled={bulkSaving} className="bg-amber-600 hover:bg-amber-700 min-h-[44px]">
              <Save className="w-4 h-4 mr-2" />{bulkSaving ? 'Saving...' : 'Save All Rates'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
