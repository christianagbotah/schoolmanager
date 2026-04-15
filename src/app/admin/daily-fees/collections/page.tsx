'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search,
  User,
  Utensils,
  Coffee,
  BookOpen,
  Droplets,
  Bus,
  CheckCircle,
  RotateCcw,
  Wallet,
  Clock,
  Save,
  ChevronRight,
  Gift,
} from 'lucide-react';
import Link from 'next/link';

interface StudentResult {
  student_id: number;
  name: string;
  student_code: string;
}

interface WalletInfo {
  student_id: number;
  feeding_balance: number;
  breakfast_balance: number;
  classes_balance: number;
  water_balance: number;
  transport_balance: number;
}

interface FeeRateInfo {
  id: number;
  feeding_rate: number;
  breakfast_rate: number;
  classes_rate: number;
  water_rate: number;
}

interface DiscountInfo {
  profile_name: string;
  flat_amount: number;
  flat_percentage: number;
  discount_type: string;
}

interface Transaction {
  id: number;
  transaction_code: string;
  payment_date: string;
  feeding_amount: number;
  breakfast_amount: number;
  classes_amount: number;
  water_amount: number;
  transport_amount: number;
  total_amount: number;
  payment_method: string;
  student: { student_id: number; name: string; student_code: string };
}

// 4 main fee types matching CI3 daily_fee_collection.php
const feeTypes = [
  { key: 'feeding', label: 'Feeding', icon: Utensils, gradient: 'from-pink-500 to-rose-500', iconBg: 'bg-pink-100', iconColor: 'text-pink-600' },
  { key: 'breakfast', label: 'Breakfast', icon: Coffee, gradient: 'from-amber-400 to-yellow-400', iconBg: 'bg-amber-100', iconColor: 'text-amber-600' },
  { key: 'classes', label: 'Classes', icon: BookOpen, gradient: 'from-cyan-500 to-indigo-500', iconBg: 'bg-cyan-100', iconColor: 'text-cyan-600' },
  { key: 'water', label: 'Water', icon: Droplets, gradient: 'from-teal-300 to-emerald-400', iconBg: 'bg-teal-100', iconColor: 'text-teal-600' },
] as const;

function fmt(n: number) {
  return `GH₵ ${(n || 0).toFixed(2)}`;
}

function fmtDate(d: string) {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function DailyFeeCollectionsPage() {
  const [studentSearch, setStudentSearch] = useState('');
  const [searchResults, setSearchResults] = useState<StudentResult[]>([]);
  const [searching, setSearching] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const [selectedStudent, setSelectedStudent] = useState<{
    student_id: number; name: string; student_code: string; className: string;
  } | null>(null);
  const [wallet, setWallet] = useState<WalletInfo | null>(null);
  const [rates, setRates] = useState<FeeRateInfo | null>(null);
  const [discount, setDiscount] = useState<DiscountInfo | null>(null);
  const [walletLoading, setWalletLoading] = useState(false);

  const [feeToggles, setFeeToggles] = useState<Record<string, boolean>>({});
  const [customAmounts, setCustomAmounts] = useState<Record<string, string>>({});
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [collecting, setCollecting] = useState(false);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);

  // Transport state (CI3 separate section)
  const [transportRoute, setTransportRoute] = useState('');
  const [transportDirection, setTransportDirection] = useState('none');
  const [transportFare, setTransportFare] = useState(0);

  const [recentTx, setRecentTx] = useState<Transaction[]>([]);
  const [txLoading, setTxLoading] = useState(false);

  const fetchRecentTransactions = useCallback(async () => {
    setTxLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const res = await fetch(`/api/admin/daily-fees/transactions?startDate=${today}&endDate=${today}&limit=15`);
      const data = await res.json();
      setRecentTx(data.transactions || []);
    } catch {} finally { setTxLoading(false); }
  }, []);

  useEffect(() => { fetchRecentTransactions(); }, [fetchRecentTransactions]);

  const handleSearch = async (query: string) => {
    setStudentSearch(query);
    if (query.length < 2) { setSearchResults([]); return; }
    setSearching(true);
    try {
      const res = await fetch(`/api/students?search=${encodeURIComponent(query)}&limit=12`);
      const data = await res.json();
      setSearchResults(data.students || []);
    } catch {} finally { setSearching(false); }
  };

  const handleSelectStudent = async (s: StudentResult) => {
    setSelectedStudent({ ...s, className: '' });
    setSearchResults([]);
    setStudentSearch('');
    setWalletLoading(true);
    setFeeToggles({});
    setCustomAmounts({});
    setTransportDirection('none');
    setTransportFare(0);

    try {
      const res = await fetch(`/api/admin/daily-fees/wallet?student_id=${s.student_id}`);
      const data = await res.json();
      setWallet(data.wallet || null);
      setRates(data.rates || null);
      if (data.class?.name) {
        setSelectedStudent((prev) => prev ? { ...prev, className: data.class.name } : prev);
      }

      // Load discount info for this student
      try {
        const discRes = await fetch(`/api/admin/daily-fees/wallet?student_id=${s.student_id}`);
        const discData = await discRes.json();
        if (discData.discount) {
          setDiscount(discData.discount);
        } else {
          setDiscount(null);
        }
      } catch {
        setDiscount(null);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to load student data');
    } finally {
      setWalletLoading(false);
    }
  };

  const getFeeRate = (key: string): number => {
    // If custom amount entered, use that; otherwise use rate
    const custom = parseFloat(customAmounts[key] || '');
    if (custom > 0) return custom;
    if (!rates) return 0;
    return (rates as any)[`${key}_rate`] || 0;
  };

  const getDiscountedRate = (key: string): number => {
    const rate = getFeeRate(key);
    if (!discount || !discount.discount_type) return rate;
    // Check if this fee type is included in the discount
    const types = discount.discount_type.split(',').map(t => t.trim().toLowerCase());
    if (!types.includes(key)) return rate;
    // Apply discount
    if (discount.flat_percentage > 0) {
      return rate * (1 - discount.flat_percentage / 100);
    } else if (discount.flat_amount > 0) {
      return Math.max(0, rate - discount.flat_amount);
    }
    return rate;
  };

  const toggleFee = (key: string) => {
    setFeeToggles(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const transportAmount = transportDirection === 'both' ? transportFare * 2 : (transportDirection !== 'none' ? transportFare : 0);
  const feesTotal = feeTypes.reduce((sum, ft) => {
    return sum + (feeToggles[ft.key] ? getDiscountedRate(ft.key) : 0);
  }, 0);
  const total = feesTotal + transportAmount;

  const handleCollect = async () => {
    if (!selectedStudent) return;
    if (total <= 0) { toast.error('Toggle at least one fee or select transport'); return; }

    setCollecting(true);
    try {
      const body: any = {
        student_id: selectedStudent.student_id,
        payment_method: paymentMethod,
        payment_date: paymentDate,
      };

      // Add toggled fee amounts
      feeTypes.forEach(ft => {
        if (feeToggles[ft.key]) {
          body[`${ft.key}_amount`] = getDiscountedRate(ft.key);
        } else {
          body[`${ft.key}_amount`] = 0;
        }
      });
      body.transport_amount = transportAmount;

      const res = await fetch('/api/admin/daily-fees/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast.success(data.message);
      handleReset();
      fetchRecentTransactions();
    } catch (err: any) {
      toast.error(err.message || 'Failed to collect fees');
    } finally { setCollecting(false); }
  };

  const handleReset = () => {
    setSelectedStudent(null);
    setWallet(null);
    setRates(null);
    setDiscount(null);
    setFeeToggles({});
    setCustomAmounts({});
    setTransportDirection('none');
    setTransportFare(0);
    setTimeout(() => searchRef.current?.focus(), 100);
  };

  const savingsAmount = feeTypes.reduce((sum, ft) => {
    return sum + (feeToggles[ft.key] ? (getFeeRate(ft.key) - getDiscountedRate(ft.key)) : 0);
  }, 0);

  return (
    <DashboardLayout>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/daily-fees"><RotateCcw className="w-4 h-4" /></Link>
          </Button>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Daily Fee Collection</h1>
            <p className="text-xs text-slate-500">POS-style fee collection from students</p>
          </div>
        </div>

        {/* 3-column POS layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left: Student Search */}
          <div className="lg:col-span-3">
            <Card>
              <CardContent className="p-4">
                <h2 className="text-sm font-bold mb-3">Select Student</h2>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <Input
                    ref={searchRef}
                    placeholder="Name or code..."
                    value={studentSearch}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="pl-8 h-9 text-sm"
                    autoFocus
                  />
                </div>
                {searching && <Skeleton className="h-6 w-full mt-2" />}
                <div className="mt-2 max-h-64 overflow-y-auto space-y-0.5">
                  {searchResults.map((s) => (
                    <button
                      key={s.student_id}
                      className="w-full text-left px-2.5 py-2 hover:bg-violet-50 rounded-lg text-sm transition-colors flex items-center gap-2"
                      onClick={() => handleSelectStudent(s)}
                    >
                      <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center">
                        <User className="w-3 h-3 text-slate-500" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-xs truncate">{s.name}</p>
                        <p className="text-[10px] text-slate-400">{s.student_code}</p>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Payment History for selected student */}
                {selectedStudent && (
                  <div className="mt-4 pt-4 border-t">
                    <h3 className="text-xs font-bold text-slate-500 mb-2">Recent Payments</h3>
                    <div className="space-y-1.5 max-h-40 overflow-y-auto">
                      {txLoading ? (
                        <Skeleton className="h-10 w-full" />
                      ) : recentTx.filter(t => t.student?.student_id === selectedStudent.student_id).length > 0 ? (
                        recentTx.filter(t => t.student?.student_id === selectedStudent.student_id).slice(0, 5).map((tx) => (
                          <div key={tx.id} className="p-2 bg-slate-50 rounded-lg">
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-medium">{fmt(tx.total_amount)}</span>
                              <span className="text-[10px] text-slate-400">{fmtDate(tx.payment_date)}</span>
                            </div>
                            <div className="flex gap-1 mt-1 flex-wrap">
                              {tx.feeding_amount > 0 && <Badge variant="secondary" className="text-[8px] h-4 px-1">F:{fmt(tx.feeding_amount)}</Badge>}
                              {tx.breakfast_amount > 0 && <Badge variant="secondary" className="text-[8px] h-4 px-1">B:{fmt(tx.breakfast_amount)}</Badge>}
                              {tx.classes_amount > 0 && <Badge variant="secondary" className="text-[8px] h-4 px-1">C:{fmt(tx.classes_amount)}</Badge>}
                              {tx.water_amount > 0 && <Badge variant="secondary" className="text-[8px] h-4 px-1">W:{fmt(tx.water_amount)}</Badge>}
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-slate-400 text-center py-3">No recent payments</p>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Middle: Transaction */}
          <div className="lg:col-span-5">
            <Card>
              <CardContent className="p-4">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-sm font-bold">Transaction</h2>
                  <div className="flex items-center gap-2">
                    <Input
                      type="date"
                      value={paymentDate}
                      onChange={(e) => setPaymentDate(e.target.value)}
                      className="w-36 h-8 text-xs"
                    />
                  </div>
                </div>

                {selectedStudent ? (
                  <div className="space-y-3">
                    {/* Student Info */}
                    <div className="bg-violet-50 p-3 rounded-lg flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-violet-200 flex items-center justify-center">
                        <User className="w-4 h-4 text-violet-700" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm">{selectedStudent.name}</p>
                        <p className="text-xs text-slate-500">{selectedStudent.student_code} {selectedStudent.className && `· ${selectedStudent.className}`}</p>
                      </div>
                      {discount && (
                        <Badge className="bg-gradient-to-r from-violet-500 to-purple-500 text-white text-[10px] h-6 flex items-center gap-1">
                          <Gift className="w-3 h-3" />
                          {discount.flat_percentage > 0 ? `${discount.flat_percentage}% OFF` : `${fmt(discount.flat_amount)} OFF`}
                        </Badge>
                      )}
                    </div>

                    {/* 4 Fee Cards matching CI3 */}
                    <div className="grid grid-cols-2 gap-3">
                      {feeTypes.map((ft) => {
                        const isActive = feeToggles[ft.key] || false;
                        const rate = getFeeRate(ft.key);
                        const discountedRate = getDiscountedRate(ft.key);
                        const hasDiscount = discountedRate < rate && discountedRate > 0;
                        return (
                          <div
                            key={ft.key}
                            onClick={() => toggleFee(ft.key)}
                            className={`relative rounded-xl p-4 cursor-pointer transition-all border-2 ${
                              isActive
                                ? `bg-gradient-to-br ${ft.gradient} text-white border-transparent shadow-md`
                                : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm'
                            }`}
                          >
                            {/* Toggle indicator */}
                            <div className={`absolute top-2 right-2 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                              isActive ? 'bg-white border-transparent' : 'border-slate-300'
                            }`}>
                              {isActive && <CheckCircle className="w-3 h-3 text-gray-800" />}
                            </div>

                            <div className={`w-8 h-8 rounded-lg ${isActive ? 'bg-white/20' : ft.iconBg} flex items-center justify-center mb-2`}>
                              <ft.icon className={`w-4 h-4 ${isActive ? 'text-white' : ft.iconColor}`} />
                            </div>
                            <p className={`text-xs font-bold ${isActive ? 'text-white/90' : 'text-slate-700'}`}>{ft.label}</p>
                            <p className={`text-lg font-bold mt-0.5 ${isActive ? 'text-white' : 'text-slate-800'} font-mono`}>
                              {isActive ? fmt(discountedRate) : fmt(rate)}
                            </p>
                            {hasDiscount && isActive && (
                              <p className="text-[9px] text-white/70 line-through">{fmt(rate)}</p>
                            )}
                            <p className={`text-[10px] mt-0.5 ${isActive ? 'text-white/70' : 'text-slate-400'}`}>
                              Rate: {fmt(rate)} {isActive ? '✓ Collecting' : 'tap to collect'}
                            </p>
                          </div>
                        );
                      })}
                    </div>

                    {/* Custom Amount Input (optional override) */}
                    {Object.values(feeToggles).some(Boolean) && (
                      <div className="bg-slate-50 p-3 rounded-lg">
                        <p className="text-[10px] text-slate-400 font-medium uppercase mb-2">Custom Amount Override (optional)</p>
                        <div className="grid grid-cols-2 gap-2">
                          {feeTypes.filter(ft => feeToggles[ft.key]).map(ft => (
                            <div key={ft.key} className="flex items-center gap-1">
                              <ft.icon className={`w-3 h-3 ${ft.iconColor} flex-shrink-0`} />
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder={fmt(getFeeRate(ft.key))}
                                value={customAmounts[ft.key] || ''}
                                onChange={(e) => setCustomAmounts(prev => ({ ...prev, [ft.key]: e.target.value }))}
                                onClick={(e) => e.stopPropagation()}
                                className="h-7 text-xs font-mono"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Transport Section matching CI3 */}
                    <div className="border-2 border-dashed border-slate-200 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Bus className="w-4 h-4 text-violet-600" />
                        <h4 className="text-sm font-bold text-violet-700">Transport</h4>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-500 font-medium">Route</label>
                          <Input
                            placeholder="Route name"
                            value={transportRoute}
                            onChange={(e) => setTransportRoute(e.target.value)}
                            className="h-8 text-xs"
                            readOnly
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-500 font-medium">Direction Today</label>
                          <Select value={transportDirection} onValueChange={(v) => setTransportDirection(v)}>
                            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Not Using</SelectItem>
                              <SelectItem value="in">Morning Only</SelectItem>
                              <SelectItem value="out">Afternoon Only</SelectItem>
                              <SelectItem value="both">Both Ways</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      {transportDirection !== 'none' && (
                        <div className="mt-2 p-2 bg-violet-50 rounded-lg flex items-center gap-2">
                          <span className="text-[10px] text-violet-600 font-medium">Transport Fare:</span>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            value={transportFare || ''}
                            onChange={(e) => setTransportFare(parseFloat(e.target.value) || 0)}
                            className="w-24 h-7 text-xs font-mono"
                          />
                          <span className="text-sm font-bold text-violet-700 font-mono">{fmt(transportAmount)}</span>
                        </div>
                      )}
                    </div>

                    {/* Discount Info Banner */}
                    {discount && savingsAmount > 0 && (
                      <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-lg flex items-center gap-2">
                        <Gift className="w-4 h-4 text-emerald-600" />
                        <div className="flex-1">
                          <p className="text-xs font-bold text-emerald-700">Discount Applied: {discount.profile_name}</p>
                          <p className="text-[10px] text-emerald-600">
                            You save {fmt(savingsAmount)} on this transaction
                          </p>
                        </div>
                        <Badge className="bg-emerald-100 text-emerald-700 text-xs">-{fmt(savingsAmount)}</Badge>
                      </div>
                    )}

                    {/* Total Display matching CI3 */}
                    <div className="bg-gradient-to-r from-violet-500 to-purple-600 rounded-xl p-4 text-center text-white shadow-lg">
                      <p className="text-sm opacity-90">Total Amount</p>
                      <p className="text-3xl font-bold">{fmt(total)}</p>
                      <div className="flex justify-center gap-4 mt-1 text-[10px] opacity-80">
                        <span>Fees: {fmt(feesTotal)}</span>
                        {transportAmount > 0 && <span>Transport: {fmt(transportAmount)}</span>}
                      </div>
                    </div>

                    {/* Payment Method */}
                    <div className="bg-white p-3 rounded-xl border">
                      <label className="text-xs font-medium text-slate-700 mb-2 block">Payment Method</label>
                      <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                        <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cash">💵 Cash</SelectItem>
                          <SelectItem value="mobile_money">📱 Mobile Money</SelectItem>
                          <SelectItem value="bank_transfer">🏦 Bank Transfer</SelectItem>
                          <SelectItem value="cheque">📄 Cheque</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        onClick={handleCollect}
                        disabled={collecting || total <= 0}
                        className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 h-11 text-white shadow-md"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        {collecting ? 'Processing...' : `Collect ${fmt(total)}`}
                      </Button>
                      <Button variant="outline" onClick={handleReset} className="h-11">
                        <RotateCcw className="w-4 h-4 mr-2" /> Next Student
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-16 text-slate-400">
                    <Wallet className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">Search and select a student to collect fees</p>
                    <p className="text-xs mt-1 text-slate-300">Use the search panel on the left</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right: Today's Collections */}
          <div className="lg:col-span-4 space-y-4">
            {/* Wallet Overview */}
            {selectedStudent && wallet && !walletLoading && (
              <Card className="border-slate-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs flex items-center gap-2">
                    <Wallet className="w-3.5 h-3.5 text-slate-400" />
                    Wallet Balance
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y">
                    {[
                      { key: 'Feeding', balance: wallet.feeding_balance, icon: Utensils, color: 'text-orange-600' },
                      { key: 'Breakfast', balance: wallet.breakfast_balance, icon: Coffee, color: 'text-amber-600' },
                      { key: 'Classes', balance: wallet.classes_balance, icon: BookOpen, color: 'text-emerald-600' },
                      { key: 'Water', balance: wallet.water_balance, icon: Droplets, color: 'text-sky-600' },
                      { key: 'Transport', balance: wallet.transport_balance, icon: Bus, color: 'text-violet-600' },
                    ].map((w) => (
                      <div key={w.key} className="px-4 py-2 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <w.icon className={`w-3.5 h-3.5 ${w.color}`} />
                          <span className="text-xs text-slate-600">{w.key}</span>
                        </div>
                        <span className="text-xs font-mono font-medium text-slate-800">{fmt(w.balance)}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Today's Collections */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-400" />
                  Today&apos;s Collections
                  {recentTx.length > 0 && (
                    <Badge variant="secondary" className="text-[10px] h-5">{recentTx.length}</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-[calc(100vh-320px)] overflow-y-auto">
                  {txLoading ? (
                    <div className="p-4 space-y-2">
                      {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
                    </div>
                  ) : recentTx.length === 0 ? (
                    <div className="text-center py-8 text-slate-400">
                      <Clock className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      <p className="text-xs">No transactions today</p>
                    </div>
                  ) : (
                    <div className="divide-y">
                      {recentTx.slice(0, 20).map((tx) => (
                        <div key={tx.id} className="px-4 py-2.5 hover:bg-slate-50 transition-colors">
                          <div className="flex justify-between items-center">
                            <div className="min-w-0">
                              <p className="text-xs font-medium truncate">{tx.student?.name}</p>
                              <p className="text-[10px] text-slate-400">{tx.student?.student_code} · {tx.payment_method.replace(/_/g, ' ')}</p>
                            </div>
                            <div className="text-right flex-shrink-0 ml-2">
                              <p className="text-sm font-bold text-emerald-600">{fmt(tx.total_amount)}</p>
                              <p className="text-[10px] text-slate-400">{fmtDate(tx.payment_date)}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
