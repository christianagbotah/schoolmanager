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
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  Search, Wallet, Receipt, Printer, CheckCircle, User,
  Utensils, Coffee, BookOpen, Droplets, Bus, Banknote, Smartphone,
  ChevronRight, ArrowLeft, Loader2, CreditCard,
} from 'lucide-react';

interface Student {
  student_id: number;
  name: string;
  student_code: string;
  sex: string;
  class_name: string;
  name_numeric: number;
  rates: any | null;
}

interface WalletInfo {
  feeding_balance: number;
  breakfast_balance: number;
  classes_balance: number;
  water_balance: number;
  transport_balance: number;
}

const feeTypes = [
  { key: 'feeding', label: 'Feeding', icon: Utensils, color: 'text-orange-600', bg: 'bg-orange-50' },
  { key: 'breakfast', label: 'Breakfast', icon: Coffee, color: 'text-amber-600', bg: 'bg-amber-50' },
  { key: 'classes', label: 'Classes', icon: BookOpen, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { key: 'water', label: 'Water', icon: Droplets, color: 'text-sky-600', bg: 'bg-sky-50' },
  { key: 'transport', label: 'Transport', icon: Bus, color: 'text-violet-600', bg: 'bg-violet-50' },
];

function fmt(n: number) { return `GH\u20B5 ${(n || 0).toFixed(2)}`; }

export default function FeeCollectionPage() {
  const [search, setSearch] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [wallet, setWallet] = useState<WalletInfo | null>(null);
  const [walletLoading, setWalletLoading] = useState(false);

  // Fee selection
  const [selectedFees, setSelectedFees] = useState<Record<string, boolean>>({});
  const [customAmounts, setCustomAmounts] = useState<Record<string, string>>({});
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [collecting, setCollecting] = useState(false);
  const [lastReceipt, setLastReceipt] = useState<any>(null);
  const [receiptOpen, setReceiptOpen] = useState(false);

  const fetchStudents = useCallback(async (query: string) => {
    if (query.length < 1) { setStudents([]); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/daily-fees/collection?search=${encodeURIComponent(query)}`);
      const data = await res.json();
      setStudents(data.students || []);
    } catch { toast.error('Search failed'); } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => fetchStudents(search), 300);
    return () => clearTimeout(timer);
  }, [search, fetchStudents]);

  const handleSelectStudent = async (student: Student) => {
    setSelectedStudent(student);
    setSearch('');
    setStudents([]);
    setSelectedFees({});
    setCustomAmounts({});
    setLastReceipt(null);
    setWalletLoading(true);
    try {
      const res = await fetch(`/api/admin/daily-fees/collection?student_id=${student.student_id}`);
      const data = await res.json();
      setWallet(data.wallet || null);
    } catch { } finally { setWalletLoading(false); }
  };

  const toggleFee = (key: string, rate: number) => {
    setSelectedFees(prev => ({ ...prev, [key]: !prev[key] }));
    if (!selectedFees[key]) {
      setCustomAmounts(prev => ({ ...prev, [key]: String(rate || 0) }));
    }
  };

  const totalAmount = Object.entries(selectedFees).reduce((sum, [key, selected]) => {
    if (!selected) return sum;
    return sum + (parseFloat(customAmounts[key]) || 0);
  }, 0);

  const handleCollect = async () => {
    if (!selectedStudent || totalAmount <= 0) {
      toast.error('Select at least one fee type');
      return;
    }
    setCollecting(true);
    try {
      const payload: any = {
        student_id: selectedStudent.student_id,
        feeding_amount: selectedFees['feeding'] ? parseFloat(customAmounts['feeding'] || '0') : 0,
        breakfast_amount: selectedFees['breakfast'] ? parseFloat(customAmounts['breakfast'] || '0') : 0,
        classes_amount: selectedFees['classes'] ? parseFloat(customAmounts['classes'] || '0') : 0,
        water_amount: selectedFees['water'] ? parseFloat(customAmounts['water'] || '0') : 0,
        transport_amount: selectedFees['transport'] ? parseFloat(customAmounts['transport'] || '0') : 0,
        payment_method: paymentMethod,
        collected_by: 'Admin',
      };
      const res = await fetch('/api/admin/daily-fees/collection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast.success(data.message);
      setLastReceipt(data.receipt);
      setReceiptOpen(true);
      // Refresh wallet
      const wRes = await fetch(`/api/admin/daily-fees/collection?student_id=${selectedStudent.student_id}`);
      const wData = await wRes.json();
      setWallet(wData.wallet || null);
    } catch (err: any) { toast.error(err.message); } finally { setCollecting(false); }
  };

  const handlePrint = () => {
    if (!lastReceipt || !selectedStudent) return;
    const w = window.open('', '_blank', 'width=400,height=600');
    if (!w) return;
    const r = lastReceipt;
    w.document.write(`<html><head><title>Receipt</title><style>
      body{font-family:Arial,sans-serif;padding:20px;max-width:350px;margin:auto}
      .center{text-align:center}.bold{font-weight:bold}
      .line{border-top:1px dashed #333;margin:10px 0}
      .row{display:flex;justify-content:space-between;margin:4px 0}
      h2{margin:0}.sm{font-size:12px;color:#666}
    </style></head><body>
      <div class="center"><h2>DAILY FEE RECEIPT</h2><p class="sm">${r.receipt_number}</p><p class="sm">${new Date().toLocaleDateString()}</p></div>
      <div class="line"></div>
      <div class="row"><span>Student:</span><span class="bold">${r.student_name}</span></div>
      <div class="row"><span>Code:</span><span>${r.student_code}</span></div>
      <div class="line"></div>
      ${r.items.feeding > 0 ? `<div class="row"><span>Feeding:</span><span>${fmt(r.items.feeding)}</span></div>` : ''}
      ${r.items.breakfast > 0 ? `<div class="row"><span>Breakfast:</span><span>${fmt(r.items.breakfast)}</span></div>` : ''}
      ${r.items.classes > 0 ? `<div class="row"><span>Classes:</span><span>${fmt(r.items.classes)}</span></div>` : ''}
      ${r.items.water > 0 ? `<div class="row"><span>Water:</span><span>${fmt(r.items.water)}</span></div>` : ''}
      ${r.items.transport > 0 ? `<div class="row"><span>Transport:</span><span>${fmt(r.items.transport)}</span></div>` : ''}
      <div class="line"></div>
      <div class="row"><span class="bold">TOTAL:</span><span class="bold" style="font-size:18px">${fmt(r.amount)}</span></div>
      <div class="row"><span>Method:</span><span>${r.method.toUpperCase()}</span></div>
      <div class="line"></div>
      <p class="center sm">Thank you for your payment!</p>
    </body></html>`);
    w.document.close();
    setTimeout(() => w.print(), 300);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-md">
              <Wallet className="w-5 h-5 text-white" />
            </div>
            Fee Collection Portal
          </h1>
          <p className="text-sm text-slate-500 mt-1 ml-[52px]">Collect daily fees from students and generate receipts</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Search & Student Selection */}
          <div className="lg:col-span-1 space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Search className="w-4 h-4 text-slate-400" />
                  Search Student
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Type name or student code..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
                {loading && <Skeleton className="h-32 w-full mt-3" />}
                {!loading && students.length > 0 && (
                  <ScrollArea className="h-64 mt-3">
                    <div className="space-y-1">
                      {students.map((s) => (
                        <button
                          key={s.student_id}
                          onClick={() => handleSelectStudent(s)}
                          className="w-full flex items-center gap-3 p-2.5 rounded-lg text-left hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all"
                        >
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${s.sex === 'male' ? 'bg-sky-100 text-sky-700' : 'bg-pink-100 text-pink-700'}`}>
                            {s.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{s.name}</p>
                            <p className="text-[10px] text-slate-400">{s.student_code} &middot; {s.class_name} {s.name_numeric}</p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-300" />
                        </button>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>

            {/* Student Info & Wallet */}
            {selectedStudent && (
              <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50/50 to-teal-50/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold ${selectedStudent.sex === 'male' ? 'bg-sky-100 text-sky-700' : 'bg-pink-100 text-pink-700'}`}>
                      {selectedStudent.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{selectedStudent.name}</p>
                      <p className="text-xs text-slate-500">{selectedStudent.student_code}</p>
                      <p className="text-[10px] text-slate-400">{selectedStudent.class_name} {selectedStudent.name_numeric}</p>
                    </div>
                  </div>
                  {walletLoading ? <Skeleton className="h-20 w-full" /> : wallet && (
                    <div className="space-y-1.5">
                      <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wide">Wallet Balance</p>
                      <div className="grid grid-cols-2 gap-1.5">
                        {feeTypes.map(ft => {
                          const balance = (wallet as any)[`${ft.key}_balance`] || 0;
                          return (
                            <div key={ft.key} className={`${ft.bg} rounded-lg p-2 text-center`}>
                              <ft.icon className={`w-3 h-3 ${ft.color} mx-auto mb-0.5`} />
                              <p className="text-[10px] text-slate-500">{ft.label}</p>
                              <p className="text-xs font-bold text-slate-700">{fmt(balance)}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right: Fee Collection Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-slate-400" />
                  Select Fees to Collect
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!selectedStudent ? (
                  <div className="text-center py-16 text-slate-400">
                    <User className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">Search and select a student to begin</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Fee Type Selection */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {feeTypes.map(ft => {
                        const rate = selectedStudent.rates ? (selectedStudent.rates as any)[`${ft.key}_rate`] || 0 : 0;
                        const isSelected = selectedFees[ft.key] || false;
                        return (
                          <button
                            key={ft.key}
                            onClick={() => toggleFee(ft.key, rate)}
                            className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${
                              isSelected
                                ? 'border-emerald-500 bg-emerald-50 shadow-sm'
                                : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                            }`}
                          >
                            <div className={`w-10 h-10 rounded-lg ${ft.bg} flex items-center justify-center`}>
                              <ft.icon className={`w-5 h-5 ${ft.color}`} />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-semibold text-slate-800">{ft.label}</p>
                                <CheckCircle className={`w-4 h-4 ${isSelected ? 'text-emerald-500' : 'text-slate-200'}`} />
                              </div>
                              <p className="text-xs text-slate-400">Rate: {fmt(rate)}/day</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* Custom Amounts */}
                    {Object.keys(selectedFees).some(k => selectedFees[k]) && (
                      <div className="space-y-2">
                        <Label className="text-xs font-medium text-slate-600">Custom Amounts</Label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {feeTypes.filter(ft => selectedFees[ft.key]).map(ft => (
                            <div key={ft.key} className="space-y-1">
                              <Label className="text-[10px] text-slate-400">{ft.label}</Label>
                              <Input
                                type="number"
                                value={customAmounts[ft.key] || '0'}
                                onChange={(e) => setCustomAmounts(prev => ({ ...prev, [ft.key]: e.target.value }))}
                                className="h-9 text-sm font-mono"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <Separator />

                    {/* Payment Method */}
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-slate-600">Payment Method</Label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => setPaymentMethod('cash')}
                          className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                            paymentMethod === 'cash' ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <Banknote className={`w-5 h-5 ${paymentMethod === 'cash' ? 'text-emerald-600' : 'text-slate-400'}`} />
                          <span className={`text-sm font-medium ${paymentMethod === 'cash' ? 'text-emerald-700' : 'text-slate-600'}`}>Cash</span>
                        </button>
                        <button
                          onClick={() => setPaymentMethod('mobile_money')}
                          className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                            paymentMethod === 'mobile_money' ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <Smartphone className={`w-5 h-5 ${paymentMethod === 'mobile_money' ? 'text-emerald-600' : 'text-slate-400'}`} />
                          <span className={`text-sm font-medium ${paymentMethod === 'mobile_money' ? 'text-emerald-700' : 'text-slate-600'}`}>MoMo</span>
                        </button>
                      </div>
                    </div>

                    <Separator />

                    {/* Total & Collect */}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-slate-400">Total Amount</p>
                        <p className="text-3xl font-bold text-emerald-600 font-mono">{fmt(totalAmount)}</p>
                      </div>
                      <Button
                        onClick={handleCollect}
                        disabled={collecting || totalAmount <= 0}
                        className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg px-8 h-12 text-base"
                      >
                        {collecting ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Receipt className="w-5 h-5 mr-2" />}
                        {collecting ? 'Collecting...' : 'Collect Fee'}
                      </Button>
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
                <CheckCircle className="w-5 h-5 text-emerald-500" />
                Payment Successful
              </DialogTitle>
            </DialogHeader>
            {lastReceipt && (
              <div className="space-y-4">
                <div className="bg-emerald-50 rounded-xl p-4 text-center">
                  <p className="text-sm text-slate-500">Amount Collected</p>
                  <p className="text-3xl font-bold text-emerald-600 font-mono">{fmt(lastReceipt.amount)}</p>
                  <p className="text-xs text-slate-400 mt-1">Receipt: {lastReceipt.receipt_number}</p>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm"><span className="text-slate-500">Student</span><span className="font-medium">{lastReceipt.student_name}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-slate-500">Method</span><span className="font-medium">{lastReceipt.method}</span></div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handlePrint} variant="outline" className="flex-1">
                    <Printer className="w-4 h-4 mr-2" />Print Receipt
                  </Button>
                  <Button onClick={() => setReceiptOpen(false)} className="flex-1 bg-emerald-500 hover:bg-emerald-600">Done</Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
