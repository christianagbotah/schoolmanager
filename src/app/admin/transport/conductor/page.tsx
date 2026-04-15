'use client';

import { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  Search, Bus, Wallet, Banknote, Smartphone, Users, Sun, Moon,
  CheckCircle, Printer, ChevronRight, Loader2, TrendingUp, Clock,
  MapPin, User, CircleDollarSign, Receipt,
} from 'lucide-react';

/* ---------- types ---------- */
interface TransportRoute {
  transport_id: number;
  route_name: string;
  vehicle_number: string;
  fare: number;
}

interface Student {
  student_id: number;
  name: string;
  student_code: string;
  sex: string;
}

interface Collection {
  id: number;
  collection_code: string;
  student_id: number;
  route_id: number | null;
  direction: string;
  amount: number;
  payment_method: string;
  collected_by: string;
  collection_date: string;
  student: { name: string; student_code: string; sex: string };
  transport: { route_name: string; vehicle_number: string } | null;
}

interface Stats {
  total_collections: number;
  total_amount: number;
  cash_amount: number;
  momo_amount: number;
  morning_count: number;
  afternoon_count: number;
  unique_students: number;
}

function fmt(n: number) { return `GH\u20B5 ${(n || 0).toFixed(2)}`; }

/* ---------- component ---------- */
export default function ConductorCollectionPage() {
  const [routes, setRoutes] = useState<TransportRoute[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats | null>(null);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [filteredCollections, setFilteredCollections] = useState<Collection[]>([]);

  const [selectedRoute, setSelectedRoute] = useState<string>('');
  const [search, setSearch] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);

  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [direction, setDirection] = useState('morning');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [collecting, setCollecting] = useState(false);

  const [lastReceipt, setLastReceipt] = useState<any>(null);
  const [receiptOpen, setReceiptOpen] = useState(false);

  /* --- fetch initial data --- */
  const fetchInitial = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/transport/conductor');
      const data = await res.json();
      setRoutes(data.routes || []);
      setStats(data.stats || null);
      setCollections(data.todayCollections || []);
      setFilteredCollections(data.todayCollections || []);
    } catch { toast.error('Failed to load data'); }
    setLoading(false);
  }, []);

  useEffect(() => { fetchInitial(); }, [fetchInitial]);

  /* --- search students --- */
  useEffect(() => {
    if (search.length < 1) { setStudents([]); return; }
    const timer = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await fetch(`/api/admin/transport/conductor?search=${encodeURIComponent(search)}`);
        const data = await res.json();
        setStudents(data.students || []);
      } catch { /* empty */ }
      setSearchLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  /* --- filter by route --- */
  const handleRouteChange = async (val: string) => {
    setSelectedRoute(val);
    if (!val) {
      setFilteredCollections(collections);
      return;
    }
    try {
      const res = await fetch(`/api/admin/transport/conductor?route_id=${val}`);
      const data = await res.json();
      setFilteredCollections(data.filteredCollections || []);
    } catch { setFilteredCollections([]); }
  };

  /* --- select student --- */
  const handleSelectStudent = (student: Student) => {
    setSelectedStudent(student);
    setSearch('');
    setStudents([]);
    const route = routes.find(r => r.transport_id === parseInt(selectedRoute || '0'));
    if (route) setAmount(String(route.fare || 0));
  };

  /* --- collect --- */
  const handleCollect = async () => {
    if (!selectedStudent || !amount || parseFloat(amount) <= 0) {
      toast.error('Select a student and enter a valid amount');
      return;
    }
    setCollecting(true);
    try {
      const payload: any = {
        student_id: selectedStudent.student_id,
        route_id: selectedRoute ? parseInt(selectedRoute) : null,
        direction,
        amount: parseFloat(amount),
        payment_method: paymentMethod,
        collected_by: 'Conductor',
      };
      const res = await fetch('/api/admin/transport/conductor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast.success(data.message);
      setLastReceipt(data.receipt);
      setReceiptOpen(true);
      setSelectedStudent(null);
      setAmount('');
      fetchInitial();
    } catch (err: any) { toast.error(err.message); }
    finally { setCollecting(false); }
  };

  /* --- print receipt --- */
  const handlePrint = () => {
    if (!lastReceipt) return;
    const r = lastReceipt;
    const w = window.open('', '_blank', 'width=400,height=600');
    if (!w) return;
    w.document.write(`<html><head><title>Transport Receipt</title><style>
      body{font-family:Arial,sans-serif;padding:20px;max-width:350px;margin:auto}
      .center{text-align:center}.bold{font-weight:bold}
      .line{border-top:1px dashed #333;margin:10px 0}
      .row{display:flex;justify-content:space-between;margin:4px 0}
      h2{margin:0}.sm{font-size:12px;color:#666}
    </style></head><body>
      <div class="center"><h2>TRANSPORT COLLECTION</h2><p class="sm">${r.collection_code}</p><p class="sm">${r.date}</p></div>
      <div class="line"></div>
      <div class="row"><span>Student:</span><span class="bold">${r.student_name}</span></div>
      <div class="row"><span>Code:</span><span>${r.student_code}</span></div>
      <div class="row"><span>Route:</span><span>${r.route_name}</span></div>
      <div class="row"><span>Direction:</span><span>${r.direction.toUpperCase()}</span></div>
      <div class="line"></div>
      <div class="row"><span class="bold">TOTAL:</span><span class="bold" style="font-size:18px">${fmt(r.amount)}</span></div>
      <div class="row"><span>Method:</span><span>${r.method.toUpperCase()}</span></div>
      <div class="row"><span>Collected By:</span><span>${r.collected_by}</span></div>
      <div class="line"></div>
      <p class="center sm">Thank you for your payment!</p>
    </body></html>`);
    w.document.close();
    setTimeout(() => w.print(), 300);
  };

  /* --- refresh filtered data when collections change --- */
  useEffect(() => {
    if (!selectedRoute) { setFilteredCollections(collections); }
  }, [collections, selectedRoute]);

  const displayCollections = selectedRoute ? filteredCollections : collections;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Gradient Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 p-6 text-white shadow-xl">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iNCIvPjwvZz48L2c+PC9zdmc+')] opacity-60" />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
                <Bus className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Conductor Collection Portal</h1>
                <p className="mt-0.5 text-sm text-indigo-100">
                  Daily transport fare collection &amp; tracking
                </p>
              </div>
            </div>
            <div className="hidden items-center gap-2 text-sm text-indigo-100 sm:flex">
              <Clock className="h-4 w-4" />
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>
        </div>

        {/* Stat Cards */}
        {loading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
          </div>
        ) : stats && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <Card className="border-indigo-100 bg-gradient-to-br from-indigo-50 to-white">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-indigo-500"><TrendingUp className="h-4 w-4" /><span className="text-[10px] font-semibold uppercase tracking-wider">Today&apos;s Collections</span></div>
                <p className="mt-2 text-2xl font-bold text-indigo-700">{stats.total_collections}</p>
                <p className="text-xs text-indigo-400">{stats.unique_students} students</p>
              </CardContent>
            </Card>
            <Card className="border-emerald-100 bg-gradient-to-br from-emerald-50 to-white">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-emerald-500"><Banknote className="h-4 w-4" /><span className="text-[10px] font-semibold uppercase tracking-wider">Cash</span></div>
                <p className="mt-2 text-2xl font-bold text-emerald-700">{fmt(stats.cash_amount)}</p>
                <p className="text-xs text-emerald-400">Collected today</p>
              </CardContent>
            </Card>
            <Card className="border-violet-100 bg-gradient-to-br from-violet-50 to-white">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-violet-500"><Smartphone className="h-4 w-4" /><span className="text-[10px] font-semibold uppercase tracking-wider">Mobile Money</span></div>
                <p className="mt-2 text-2xl font-bold text-violet-700">{fmt(stats.momo_amount)}</p>
                <p className="text-xs text-violet-400">Collected today</p>
              </CardContent>
            </Card>
            <Card className="border-amber-100 bg-gradient-to-br from-amber-50 to-white">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-amber-500"><Sun className="h-4 w-4" /><span className="text-[10px] font-semibold uppercase tracking-wider">Morning</span></div>
                <p className="mt-2 text-2xl font-bold text-amber-700">{stats.morning_count}</p>
                <p className="text-xs text-amber-400">Pickups</p>
              </CardContent>
            </Card>
            <Card className="border-orange-100 bg-gradient-to-br from-orange-50 to-white">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-orange-500"><Moon className="h-4 w-4" /><span className="text-[10px] font-semibold uppercase tracking-wider">Afternoon</span></div>
                <p className="mt-2 text-2xl font-bold text-orange-700">{stats.afternoon_count}</p>
                <p className="text-xs text-orange-400">Drop-offs</p>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left: Search & Route */}
          <div className="space-y-4 lg:col-span-1">
            {/* Route Selector */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-indigo-400" />
                  Select Route
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={selectedRoute} onValueChange={handleRouteChange}>
                  <SelectTrigger className="min-h-[44px]"><SelectValue placeholder="All Routes" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">All Routes</SelectItem>
                    {routes.map(r => (
                      <SelectItem key={r.transport_id} value={String(r.transport_id)}>
                        {r.route_name} &middot; {r.vehicle_number}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Student Search */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Search className="h-4 w-4 text-indigo-400" />
                  Search Student
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    placeholder="Type name or student code..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
                {searchLoading && <Skeleton className="mt-3 h-32 w-full" />}
                {!searchLoading && students.length > 0 && (
                  <ScrollArea className="mt-3 h-64">
                    <div className="space-y-1">
                      {students.map((s) => (
                        <button
                          key={s.student_id}
                          onClick={() => handleSelectStudent(s)}
                          className="flex w-full items-center gap-3 rounded-lg border border-transparent p-2.5 text-left transition-all hover:border-slate-200 hover:bg-slate-50"
                        >
                          <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${s.sex === 'male' ? 'bg-sky-100 text-sky-700' : 'bg-pink-100 text-pink-700'}`}>
                            {s.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">{s.name}</p>
                            <p className="text-[10px] text-slate-400">{s.student_code}</p>
                          </div>
                          <ChevronRight className="h-4 w-4 text-slate-300" />
                        </button>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>

            {/* Selected Student Card */}
            {selectedStudent && (
              <Card className="border-indigo-200 bg-gradient-to-br from-indigo-50/50 to-violet-50/50">
                <CardContent className="p-4">
                  <div className="mb-3 flex items-center gap-3">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-full text-sm font-bold ${selectedStudent.sex === 'male' ? 'bg-sky-100 text-sky-700' : 'bg-pink-100 text-pink-700'}`}>
                      {selectedStudent.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{selectedStudent.name}</p>
                      <p className="text-xs text-slate-500">{selectedStudent.student_code}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right: Collection Form + Table */}
          <div className="space-y-4 lg:col-span-2">
            {/* Quick Collection Form */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <CircleDollarSign className="h-4 w-4 text-indigo-400" />
                  Quick Collection
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!selectedStudent ? (
                  <div className="py-12 text-center text-slate-400">
                    <User className="mx-auto mb-3 h-12 w-12 opacity-30" />
                    <p className="text-sm">Search and select a student to begin</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium text-slate-600">Route</Label>
                        <Select value={selectedRoute || ''} onValueChange={setSelectedRoute}>
                          <SelectTrigger className="min-h-[44px]"><SelectValue placeholder="Select route" /></SelectTrigger>
                          <SelectContent>
                            {routes.map(r => (
                              <SelectItem key={r.transport_id} value={String(r.transport_id)}>
                                {r.route_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium text-slate-600">Direction</Label>
                        <Select value={direction} onValueChange={setDirection}>
                          <SelectTrigger className="min-h-[44px]"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="morning">Morning</SelectItem>
                            <SelectItem value="afternoon">Afternoon</SelectItem>
                            <SelectItem value="both">Both</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium text-slate-600">Amount (GH\u20B5)</Label>
                        <Input
                          type="number"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          className="min-h-[44px] font-mono text-sm"
                          placeholder="0.00"
                        />
                      </div>
                    </div>

                    {/* Payment Method */}
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-slate-600">Payment Method</Label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => setPaymentMethod('cash')}
                          className={`flex items-center gap-3 rounded-xl border-2 p-3 transition-all ${paymentMethod === 'cash' ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:border-slate-300'}`}
                        >
                          <Banknote className={`h-5 w-5 ${paymentMethod === 'cash' ? 'text-indigo-600' : 'text-slate-400'}`} />
                          <span className={`text-sm font-medium ${paymentMethod === 'cash' ? 'text-indigo-700' : 'text-slate-600'}`}>Cash</span>
                        </button>
                        <button
                          onClick={() => setPaymentMethod('mobile_money')}
                          className={`flex items-center gap-3 rounded-xl border-2 p-3 transition-all ${paymentMethod === 'mobile_money' ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:border-slate-300'}`}
                        >
                          <Smartphone className={`h-5 w-5 ${paymentMethod === 'mobile_money' ? 'text-indigo-600' : 'text-slate-400'}`} />
                          <span className={`text-sm font-medium ${paymentMethod === 'mobile_money' ? 'text-indigo-700' : 'text-slate-600'}`}>MoMo</span>
                        </button>
                      </div>
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-slate-400">Total Amount</p>
                        <p className="font-mono text-3xl font-bold text-indigo-600">{fmt(parseFloat(amount) || 0)}</p>
                      </div>
                      <Button
                        onClick={handleCollect}
                        disabled={collecting || !amount || parseFloat(amount) <= 0}
                        className="h-12 bg-gradient-to-r from-indigo-500 to-violet-500 px-8 text-base text-white shadow-lg hover:from-indigo-600 hover:to-violet-600"
                      >
                        {collecting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Receipt className="mr-2 h-5 w-5" />}
                        {collecting ? 'Collecting...' : 'Collect Fare'}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Today's Collection Table */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Wallet className="h-4 w-4 text-indigo-400" />
                    Today&apos;s Collections
                    <Badge variant="secondary" className="ml-1 text-[10px]">{displayCollections.length}</Badge>
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="max-h-96 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead className="hidden sm:table-cell">Route</TableHead>
                        <TableHead>Direction</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead className="hidden md:table-cell">Method</TableHead>
                        <TableHead className="hidden lg:table-cell">Time</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {displayCollections.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="py-8 text-center text-slate-400">
                            No collections recorded yet today
                          </TableCell>
                        </TableRow>
                      ) : (
                        displayCollections.map((c) => (
                          <TableRow key={c.id}>
                            <TableCell>
                              <p className="text-sm font-medium">{c.student?.name || 'Unknown'}</p>
                              <p className="text-[10px] text-slate-400">{c.student?.student_code}</p>
                            </TableCell>
                            <TableCell className="hidden sm:table-cell text-sm">{c.transport?.route_name || 'N/A'}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className={`text-[10px] ${c.direction === 'morning' ? 'border-amber-200 bg-amber-50 text-amber-700' : c.direction === 'afternoon' ? 'border-orange-200 bg-orange-50 text-orange-700' : 'border-violet-200 bg-violet-50 text-violet-700'}`}>
                                {c.direction === 'morning' && <><Sun className="mr-1 h-3 w-3" />AM</>}
                                {c.direction === 'afternoon' && <><Moon className="mr-1 h-3 w-3" />PM</>}
                                {c.direction === 'both' && <>Both</>}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right font-mono text-sm font-semibold text-slate-700">
                              {fmt(c.amount)}
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                              <Badge variant="outline" className="text-[10px]">
                                {c.payment_method === 'cash' ? <><Banknote className="mr-1 h-3 w-3" />Cash</> : <><Smartphone className="mr-1 h-3 w-3" />MoMo</>}
                              </Badge>
                            </TableCell>
                            <TableCell className="hidden lg:table-cell text-xs text-slate-500">
                              {new Date(c.collection_date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Daily Summary */}
                {displayCollections.length > 0 && (
                  <div className="mt-4 rounded-xl bg-gradient-to-r from-indigo-50 to-violet-50 p-4">
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                      <div>
                        <p className="text-[10px] font-medium uppercase tracking-wider text-indigo-400">Total</p>
                        <p className="text-lg font-bold text-indigo-700">{fmt(displayCollections.reduce((s, c) => s + c.amount, 0))}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-medium uppercase tracking-wider text-emerald-400">Cash</p>
                        <p className="text-lg font-bold text-emerald-700">{fmt(displayCollections.filter(c => c.payment_method === 'cash').reduce((s, c) => s + c.amount, 0))}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-medium uppercase tracking-wider text-violet-400">MoMo</p>
                        <p className="text-lg font-bold text-violet-700">{fmt(displayCollections.filter(c => c.payment_method === 'mobile_money').reduce((s, c) => s + c.amount, 0))}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">Students</p>
                        <p className="text-lg font-bold text-slate-700">{new Set(displayCollections.map(c => c.student_id)).size}</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Receipt Dialog */}
        <Dialog open={receiptOpen} onOpenChange={setReceiptOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-indigo-500" />
                Collection Successful
              </DialogTitle>
            </DialogHeader>
            {lastReceipt && (
              <div className="space-y-4">
                <div className="rounded-xl bg-gradient-to-br from-indigo-50 to-violet-50 p-4 text-center">
                  <p className="text-sm text-slate-500">Amount Collected</p>
                  <p className="font-mono text-3xl font-bold text-indigo-600">{fmt(lastReceipt.amount)}</p>
                  <p className="mt-1 text-xs text-slate-400">Ref: {lastReceipt.collection_code}</p>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm"><span className="text-slate-500">Student</span><span className="font-medium">{lastReceipt.student_name}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-slate-500">Route</span><span className="font-medium">{lastReceipt.route_name}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-slate-500">Direction</span><span className="font-medium">{lastReceipt.direction}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-slate-500">Method</span><span className="font-medium">{lastReceipt.method}</span></div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handlePrint} variant="outline" className="flex-1">
                    <Printer className="mr-2 h-4 w-4" />Print Receipt
                  </Button>
                  <Button onClick={() => setReceiptOpen(false)} className="flex-1 bg-indigo-500 hover:bg-indigo-600">Done</Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
