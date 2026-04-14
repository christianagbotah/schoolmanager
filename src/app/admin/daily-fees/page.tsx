'use client';

import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  Search,
  Wallet,
  CheckCircle,
  Clock,
  DollarSign,
  User,
  ChevronLeft,
  ChevronRight,
  Utensils,
  Coffee,
  BookOpen,
  Droplets,
  Bus,
  RotateCcw,
} from 'lucide-react';

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

interface Rates {
  id: number;
  class_id: number;
  feeding_rate: number;
  breakfast_rate: number;
  classes_rate: number;
  water_rate: number;
  year: string;
  term: string;
  class: { name: string };
}

interface Transaction {
  id: number;
  transaction_code: string;
  student_id: number;
  payment_date: string;
  feeding_amount: number;
  breakfast_amount: number;
  classes_amount: number;
  water_amount: number;
  transport_amount: number;
  total_amount: number;
  payment_method: string;
  collected_by: string;
  year: string;
  term: string;
  student: { name: string; student_code: string };
}

interface DailySummary {
  totalAmount: number;
  feedingTotal: number;
  breakfastTotal: number;
  classesTotal: number;
  waterTotal: number;
  transportTotal: number;
  byCollector: Record<string, number>;
  transactionCount: number;
}

const feeTypes = [
  { key: 'feeding', label: 'Feeding', color: 'text-orange-600', bg: 'bg-orange-100', icon: Utensils },
  { key: 'breakfast', label: 'Breakfast', color: 'text-amber-600', bg: 'bg-amber-100', icon: Coffee },
  { key: 'classes', label: 'Classes', color: 'text-emerald-600', bg: 'bg-emerald-100', icon: BookOpen },
  { key: 'water', label: 'Water', color: 'text-sky-600', bg: 'bg-sky-100', icon: Droplets },
  { key: 'transport', label: 'Transport', color: 'text-violet-600', bg: 'bg-violet-100', icon: Bus },
] as const;

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-UG', { style: 'currency', currency: 'UGX', minimumFractionDigits: 0 }).format(amount);
}

function formatDateTime(dateStr: string) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

export default function DailyFeesPage() {
  const [studentSearch, setStudentSearch] = useState('');
  const [searchResults, setSearchResults] = useState<StudentResult[]>([]);
  const [searching, setSearching] = useState(false);

  const [selectedStudent, setSelectedStudent] = useState<{ student_id: number; name: string; student_code: string; className: string } | null>(null);
  const [wallet, setWallet] = useState<WalletInfo | null>(null);
  const [rates, setRates] = useState<Rates | null>(null);
  const [walletLoading, setWalletLoading] = useState(false);

  const [feeSelections, setFeeSelections] = useState<Record<string, boolean>>({});
  const [feeAmounts, setFeeAmounts] = useState<Record<string, string>>({});
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [collecting, setCollecting] = useState(false);

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [transactionsLoading, setTransactionsLoading] = useState(true);
  const [txPage, setTxPage] = useState(1);
  const [txTotalPages, setTxTotalPages] = useState(1);

  const [dailySummary, setDailySummary] = useState<DailySummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);

  const today = todayStr();

  const fetchTodayTransactions = useCallback(async () => {
    setTransactionsLoading(true);
    try {
      const res = await fetch(`/api/daily-fees/transactions?startDate=${today}&endDate=${today}&page=${txPage}&limit=20`);
      const data = await res.json();
      setTransactions(data.transactions || []);
      setTxTotalPages(data.pagination?.totalPages || 1);
    } catch {
      // silent
    } finally {
      setTransactionsLoading(false);
    }
  }, [today, txPage]);

  const fetchDailySummary = useCallback(async () => {
    setSummaryLoading(true);
    try {
      const res = await fetch(`/api/daily-fees/report?startDate=${today}&endDate=${today}`);
      const data = await res.json();
      setDailySummary(data.summary || null);
    } catch {
      // silent
    } finally {
      setSummaryLoading(false);
    }
  }, [today]);

  useEffect(() => {
    fetchTodayTransactions();
    fetchDailySummary();
  }, [fetchTodayTransactions, fetchDailySummary]);

  const handleSearchStudents = async (query: string) => {
    setStudentSearch(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(`/api/students?search=${encodeURIComponent(query)}&limit=15`);
      const data = await res.json();
      setSearchResults(data.students || []);
    } catch {
      // silent
    } finally {
      setSearching(false);
    }
  };

  const handleSelectStudent = async (student: StudentResult) => {
    setSelectedStudent({ ...student, className: '' });
    setSearchResults([]);
    setStudentSearch('');
    setWalletLoading(true);
    setFeeSelections({});
    setFeeAmounts({});

    try {
      const res = await fetch(`/api/daily-fees?studentId=${student.student_id}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setWallet(data.wallet || null);
      setRates(data.rates || null);
      if (data.class) {
        setSelectedStudent((prev) => prev ? { ...prev, className: data.class.name } : prev);
      }
      // Auto-populate amounts from rates
      if (data.rates) {
        const r = data.rates;
        setFeeAmounts({
          feeding: String(r.feeding_rate || 0),
          breakfast: String(r.breakfast_rate || 0),
          classes: String(r.classes_rate || 0),
          water: String(r.water_rate || 0),
          transport: '0',
        });
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to load student wallet');
    } finally {
      setWalletLoading(false);
    }
  };

  const toggleFee = (key: string) => {
    setFeeSelections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const getSelectedTotal = () => {
    return feeTypes
      .filter((ft) => feeSelections[ft.key])
      .reduce((sum, ft) => sum + (parseFloat(feeAmounts[ft.key]) || 0), 0);
  };

  const handleCollect = async () => {
    if (!selectedStudent) return;
    const total = getSelectedTotal();
    if (total <= 0) {
      toast.error('Select at least one fee type with amount > 0');
      return;
    }
    setCollecting(true);
    try {
      const body: Record<string, any> = {
        studentId: selectedStudent.student_id,
        paymentMethod,
        collectedBy: 'Cashier',
        feedingAmount: feeSelections.feeding ? parseFloat(feeAmounts.feeding) || 0 : 0,
        breakfastAmount: feeSelections.breakfast ? parseFloat(feeAmounts.breakfast) || 0 : 0,
        classesAmount: feeSelections.classes ? parseFloat(feeAmounts.classes) || 0 : 0,
        waterAmount: feeSelections.water ? parseFloat(feeAmounts.water) || 0 : 0,
        transportAmount: feeSelections.transport ? parseFloat(feeAmounts.transport) || 0 : 0,
      };
      const res = await fetch('/api/daily-fees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast.success(`Collected ${formatCurrency(total)} from ${selectedStudent.name}`);
      // Refresh wallet and transactions
      handleSelectStudent({ student_id: selectedStudent.student_id, name: selectedStudent.name, student_code: selectedStudent.student_code });
      fetchTodayTransactions();
      fetchDailySummary();
    } catch (err: any) {
      toast.error(err.message || 'Failed to collect fees');
    } finally {
      setCollecting(false);
    }
  };

  const handleReset = () => {
    setSelectedStudent(null);
    setWallet(null);
    setRates(null);
    setFeeSelections({});
    setFeeAmounts({});
    setSearchResults([]);
    setStudentSearch('');
  };

  const progressColor = (balance: number) => {
    if (balance >= 0) return 'bg-emerald-500';
    if (balance >= -5000) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const summaryCards = [
    { label: 'Total Collected', amount: dailySummary?.totalAmount || 0, icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-100' },
    { label: 'Transactions', amount: dailySummary?.transactionCount || 0, icon: CheckCircle, color: 'text-sky-600', bg: 'bg-sky-100', isCount: true },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Daily Fee Collection</h1>
            <p className="text-sm text-slate-500 mt-1">Collect feeding, breakfast, and other daily fees</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Clock className="w-4 h-4" />
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Collection Panel */}
          <div className="lg:col-span-1 space-y-4">
            {/* Search */}
            <Card>
              <CardContent className="p-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Search student code or name..."
                    value={studentSearch}
                    onChange={(e) => handleSearchStudents(e.target.value)}
                    className="pl-10"
                    disabled={!!selectedStudent}
                  />
                  {selectedStudent && (
                    <button className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600" onClick={handleReset}>
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  )}
                </div>
                {searchResults.length > 0 && (
                  <div className="mt-2 max-h-48 overflow-y-auto border rounded-lg">
                    {searchResults.map((s) => (
                      <button
                        key={s.student_id}
                        className="w-full text-left px-3 py-2.5 hover:bg-emerald-50 border-b last:border-0 text-sm transition-colors"
                        onClick={() => handleSelectStudent(s)}
                      >
                        <p className="font-medium">{s.name}</p>
                        <p className="text-xs text-slate-400">{s.student_code}</p>
                      </button>
                    ))}
                  </div>
                )}
                {searching && <Skeleton className="h-8 w-full mt-2" />}
              </CardContent>
            </Card>

            {/* Wallet + Collection Form */}
            {selectedStudent && (
              <>
                {/* Student Info */}
                <Card className="border-emerald-100">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                        <User className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{selectedStudent.name}</p>
                        <p className="text-xs text-slate-400">{selectedStudent.student_code} {selectedStudent.className ? `· ${selectedStudent.className}` : ''}</p>
                      </div>
                    </div>

                    {walletLoading ? (
                      <div className="space-y-2">
                        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-6 w-full" />)}
                      </div>
                    ) : wallet ? (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Wallet Balances</p>
                        {feeTypes.map((ft) => {
                          const bal = (wallet as any)[`${ft.key}_balance`] || 0;
                          return (
                            <div key={ft.key} className="flex items-center gap-3">
                              <div className={`w-7 h-7 rounded flex items-center justify-center ${ft.bg}`}>
                                <ft.icon className={`w-3.5 h-3.5 ${ft.color}`} />
                              </div>
                              <div className="flex-1">
                                <div className="flex justify-between text-xs mb-1">
                                  <span className="text-slate-500">{ft.label}</span>
                                  <span className={`font-mono font-medium ${bal < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                                    {formatCurrency(bal)}
                                  </span>
                                </div>
                                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all ${progressColor(bal)}`}
                                    style={{ width: `${Math.min(100, Math.max(5, 100 + bal / 10))}%` }}
                                  />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-400">No wallet found. First collection will create one.</p>
                    )}
                  </CardContent>
                </Card>

                {/* Fee Collection Form */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Wallet className="w-4 h-4 text-emerald-600" />
                      Collect Fees
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {feeTypes.map((ft) => (
                      <div key={ft.key} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50">
                        <Checkbox
                          checked={feeSelections[ft.key] || false}
                          onCheckedChange={() => toggleFee(ft.key)}
                        />
                        <ft.icon className={`w-4 h-4 ${ft.color}`} />
                        <span className="flex-1 text-sm">{ft.label}</span>
                        <Input
                          type="number"
                          value={feeAmounts[ft.key] || '0'}
                          onChange={(e) => setFeeAmounts({ ...feeAmounts, [ft.key]: e.target.value })}
                          disabled={!feeSelections[ft.key]}
                          className="w-28 h-8 text-right text-sm font-mono"
                        />
                      </div>
                    ))}

                    <Separator />

                    <div>
                      <label className="text-xs text-slate-500">Payment Method</label>
                      <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                        <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cash">Cash</SelectItem>
                          <SelectItem value="mobile_money">Mobile Money</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="bg-emerald-50 rounded-lg p-3 text-center">
                      <p className="text-xs text-slate-500">Total to Collect</p>
                      <p className="text-xl font-bold text-emerald-700 font-mono">{formatCurrency(getSelectedTotal())}</p>
                    </div>

                    <Button
                      onClick={handleCollect}
                      disabled={collecting || getSelectedTotal() <= 0}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 h-10"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      {collecting ? 'Collecting...' : `Collect ${formatCurrency(getSelectedTotal())}`}
                    </Button>
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          {/* Right: Transactions & Summary */}
          <div className="lg:col-span-2 space-y-4">
            {/* Daily Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {summaryLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <Card key={i}><CardContent className="p-3"><Skeleton className="h-12 w-full" /></CardContent></Card>
                ))
              ) : (
                <>
                  {summaryCards.map((sc) => (
                    <Card key={sc.label} className="border-emerald-100">
                      <CardContent className="p-3">
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-lg ${sc.bg} flex items-center justify-center`}>
                            <sc.icon className={`w-4 h-4 ${sc.color}`} />
                          </div>
                          <div>
                            <p className="text-[10px] text-slate-400 font-medium">{sc.label}</p>
                            <p className="text-sm font-bold">{sc.isCount ? sc.amount : formatCurrency(sc.amount as number)}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {feeTypes.map((ft) => {
                    const amt = (dailySummary as any)?.[`${ft.key}Total`] || 0;
                    return (
                      <Card key={ft.key}>
                        <CardContent className="p-3">
                          <div className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-lg ${ft.bg} flex items-center justify-center`}>
                              <ft.icon className={`w-4 h-4 ${ft.color}`} />
                            </div>
                            <div>
                              <p className="text-[10px] text-slate-400 font-medium">{ft.label}</p>
                              <p className="text-sm font-bold font-mono">{formatCurrency(amt)}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </>
              )}
            </div>

            {/* Cashier Handover */}
            {dailySummary && dailySummary.byCollector && Object.keys(dailySummary.byCollector).length > 0 && (
              <Card className="border-amber-200 bg-amber-50/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-amber-800">Cashier Handover Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(dailySummary.byCollector).map(([collector, amount]) => (
                      <div key={collector} className="flex items-center justify-between text-sm">
                        <span className="text-slate-700">{collector}</span>
                        <span className="font-mono font-bold text-amber-700">{formatCurrency(amount)}</span>
                      </div>
                    ))}
                    <Separator />
                    <div className="flex items-center justify-between font-semibold">
                      <span>Grand Total</span>
                      <span className="font-mono text-emerald-700">{formatCurrency(dailySummary.totalAmount)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Today's Transactions */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Today&apos;s Transactions</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {/* Desktop */}
                <div className="hidden md:block">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50">
                        <TableHead className="text-xs font-semibold">Student</TableHead>
                        <TableHead className="text-xs font-semibold">Feeding</TableHead>
                        <TableHead className="text-xs font-semibold">Breakfast</TableHead>
                        <TableHead className="text-xs font-semibold">Classes</TableHead>
                        <TableHead className="text-xs font-semibold">Water</TableHead>
                        <TableHead className="text-xs font-semibold">Transport</TableHead>
                        <TableHead className="text-xs font-semibold text-right">Total</TableHead>
                        <TableHead className="text-xs font-semibold">Method</TableHead>
                        <TableHead className="text-xs font-semibold">Time</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactionsLoading ? (
                        Array.from({ length: 3 }).map((_, i) => (
                          <TableRow key={i}>
                            {Array.from({ length: 9 }).map((_, j) => (
                              <TableCell key={j}><Skeleton className="h-4 w-16" /></TableCell>
                            ))}
                          </TableRow>
                        ))
                      ) : transactions.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={9} className="text-center py-8 text-slate-400">
                            <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No transactions today</p>
                          </TableCell>
                        </TableRow>
                      ) : (
                        transactions.map((tx) => (
                          <TableRow key={tx.id} className="hover:bg-slate-50/50">
                            <TableCell>
                              <p className="font-medium text-sm">{tx.student?.name}</p>
                              <p className="text-xs text-slate-400">{tx.student?.student_code}</p>
                            </TableCell>
                            <TableCell className="font-mono text-xs">{tx.feeding_amount > 0 ? formatCurrency(tx.feeding_amount) : '—'}</TableCell>
                            <TableCell className="font-mono text-xs">{tx.breakfast_amount > 0 ? formatCurrency(tx.breakfast_amount) : '—'}</TableCell>
                            <TableCell className="font-mono text-xs">{tx.classes_amount > 0 ? formatCurrency(tx.classes_amount) : '—'}</TableCell>
                            <TableCell className="font-mono text-xs">{tx.water_amount > 0 ? formatCurrency(tx.water_amount) : '—'}</TableCell>
                            <TableCell className="font-mono text-xs">{tx.transport_amount > 0 ? formatCurrency(tx.transport_amount) : '—'}</TableCell>
                            <TableCell className="text-right font-mono text-sm font-medium text-emerald-600">{formatCurrency(tx.total_amount)}</TableCell>
                            <TableCell>
                              <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium capitalize bg-emerald-100 text-emerald-700">
                                {tx.payment_method.replace(/_/g, ' ')}
                              </span>
                            </TableCell>
                            <TableCell className="text-xs text-slate-500">{formatDateTime(tx.payment_date)}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile */}
                <div className="md:hidden divide-y max-h-96 overflow-y-auto">
                  {transactionsLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="p-3 space-y-2"><Skeleton className="h-4 w-3/4" /><Skeleton className="h-3 w-1/2" /></div>
                    ))
                  ) : transactions.length === 0 ? (
                    <div className="text-center py-8 text-slate-400">
                      <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No transactions today</p>
                    </div>
                  ) : (
                    transactions.map((tx) => (
                      <div key={tx.id} className="p-3 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-sm">{tx.student?.name}</p>
                          <span className="font-mono font-bold text-emerald-600">{formatCurrency(tx.total_amount)}</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {tx.feeding_amount > 0 && <Badge variant="secondary" className="text-[10px] h-5">Feeding {formatCurrency(tx.feeding_amount)}</Badge>}
                          {tx.breakfast_amount > 0 && <Badge variant="secondary" className="text-[10px] h-5">Breakfast {formatCurrency(tx.breakfast_amount)}</Badge>}
                          {tx.classes_amount > 0 && <Badge variant="secondary" className="text-[10px] h-5">Classes {formatCurrency(tx.classes_amount)}</Badge>}
                          {tx.water_amount > 0 && <Badge variant="secondary" className="text-[10px] h-5">Water {formatCurrency(tx.water_amount)}</Badge>}
                          {tx.transport_amount > 0 && <Badge variant="secondary" className="text-[10px] h-5">Transport {formatCurrency(tx.transport_amount)}</Badge>}
                        </div>
                        <p className="text-xs text-slate-400">{tx.payment_method} · {formatDateTime(tx.payment_date)}</p>
                      </div>
                    ))
                  )}
                </div>

                {txTotalPages > 1 && (
                  <div className="flex items-center justify-center gap-1 px-4 py-3 border-t">
                    <Button variant="outline" size="icon" className="h-8 w-8" disabled={txPage <= 1} onClick={() => setTxPage(txPage - 1)}>
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="text-sm px-2">{txPage} / {txTotalPages}</span>
                    <Button variant="outline" size="icon" className="h-8 w-8" disabled={txPage >= txTotalPages} onClick={() => setTxPage(txPage + 1)}>
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
