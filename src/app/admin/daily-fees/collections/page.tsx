'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { DollarSign, Receipt, Search, Users, ArrowLeft, Download, Wallet } from 'lucide-react';
import Link from 'next/link';

interface Student { student_id: number; student_code: string; name: string; class?: { name: string }; }
interface Wallet { feeding_balance: number; breakfast_balance: number; classes_balance: number; water_balance: number; transport_balance: number; }

export default function DailyFeeCollectionsPage() {
  const [tab, setTab] = useState('collect');
  const [search, setSearch] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [collections, setCollections] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [fees, setFees] = useState({ feeding: '', breakfast: '', classes: '', water: '', transport: '' });
  const [method, setMethod] = useState('cash');
  const [collecting, setCollecting] = useState(false);

  const searchStudents = async () => {
    if (search.length < 2) return;
    try {
      const res = await fetch(`/api/students?search=${encodeURIComponent(search)}&limit=20`);
      const data = await res.json();
      setStudents(data.students || []);
    } catch {}
  };

  const selectStudent = async (s: Student) => {
    setSelectedStudent(s);
    setStudents([]);
    setSearch(s.name);
    try {
      const res = await fetch(`/api/daily-fees/wallet?student_id=${s.student_id}`);
      const data = await res.json();
      setWallet(data);
    } catch { setWallet(null); }
    fetchCollections(s.student_id);
  };

  const fetchCollections = async (studentId: number) => {
    try {
      const res = await fetch(`/api/daily-fees/transactions?student_id=${studentId}`);
      const data = await res.json();
      setCollections(Array.isArray(data) ? data : []);
    } catch { setCollections([]); }
  };

  const handleCollect = async () => {
    if (!selectedStudent) return;
    const amounts = { feeding: parseFloat(fees.feeding) || 0, breakfast: parseFloat(fees.breakfast) || 0, classes: parseFloat(fees.classes) || 0, water: parseFloat(fees.water) || 0, transport: parseFloat(fees.transport) || 0 };
    const total = Object.values(amounts).reduce((a, b) => a + b, 0);
    if (total <= 0) { toast.error('Enter at least one fee amount'); return; }

    setCollecting(true);
    try {
      const res = await fetch('/api/daily-fees/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: selectedStudent.student_id, ...amounts, payment_method: method }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast.success(`GH₵ ${total.toFixed(2)} collected successfully`);
      setFees({ feeding: '', breakfast: '', classes: '', water: '', transport: '' });
      selectStudent(selectedStudent);
    } catch (err: any) { toast.error(err.message); } finally { setCollecting(false); }
  };

  const totalCollected = (fees.feeding ? parseFloat(fees.feeding) : 0) + (fees.breakfast ? parseFloat(fees.breakfast) : 0) + (fees.classes ? parseFloat(fees.classes) : 0) + (fees.water ? parseFloat(fees.water) : 0) + (fees.transport ? parseFloat(fees.transport) : 0);

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild><Link href="/admin/daily-fees"><ArrowLeft className="w-5 h-5" /></Link></Button>
          <div><h1 className="text-2xl font-bold text-slate-900 tracking-tight">Daily Fee Collections</h1><p className="text-sm text-slate-500 mt-1">Collect daily fees from students</p></div>
        </div>

        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input placeholder="Search student by name or code..." value={search} onChange={e => { setSearch(e.target.value); if (e.target.value.length >= 2) searchStudents(); }} className="pl-10" />
            </div>
            {students.length > 0 && (
              <div className="border rounded-lg max-h-40 overflow-y-auto">
                {students.map(s => (
                  <button key={s.student_id} className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 flex items-center gap-2" onClick={() => selectStudent(s)}>
                    <Users className="w-3 h-3 text-slate-400" /><span>{s.name}</span><span className="text-xs text-slate-400">({s.student_code})</span><Badge variant="outline" className="text-[10px] ml-auto">{s.class?.name}</Badge>
                  </button>
                ))}
              </div>
            )}

            {selectedStudent && (
              <>
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <div><p className="font-medium">{selectedStudent.name}</p><p className="text-xs text-slate-500">{selectedStudent.student_code} · {selectedStudent.class?.name}</p></div>
                    <Badge variant="outline" className="bg-emerald-100 text-emerald-700"><Wallet className="w-3 h-3 mr-1" />Wallet</Badge>
                  </div>
                  {wallet && (
                    <div className="grid grid-cols-5 gap-2 mb-4">
                      {(['feeding', 'breakfast', 'classes', 'water', 'transport'] as const).map(f => (
                        <div key={f} className="text-center p-2 bg-slate-50 rounded-lg">
                          <p className="text-[10px] text-slate-400 capitalize">{f}</p>
                          <p className="text-sm font-bold text-slate-700">GH₵ {(wallet as any)[`${f}_balance`] || 0}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="border-t pt-4 space-y-3">
                  <h3 className="font-semibold text-slate-800">Collect Fees</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    {(['feeding', 'breakfast', 'classes', 'water', 'transport'] as const).map(f => (
                      <div key={f}>
                        <Label className="text-xs capitalize">{f} (GH₵)</Label>
                        <Input type="number" placeholder="0.00" value={(fees as any)[f]} onChange={e => setFees({ ...fees, [f]: e.target.value })} className="mt-1" />
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1"><Label className="text-xs">Payment Method</Label><Select value={method} onValueChange={setMethod}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="cash">Cash</SelectItem><SelectItem value="mobile_money">Mobile Money</SelectItem><SelectItem value="bank_transfer">Bank Transfer</SelectItem></SelectContent></Select></div>
                    <div className="text-right pt-4"><p className="text-xs text-slate-500">Total</p><p className="text-xl font-bold text-emerald-700">GH₵ {totalCollected.toFixed(2)}</p></div>
                  </div>
                  <Button onClick={handleCollect} disabled={collecting || totalCollected <= 0} className="w-full bg-emerald-600 hover:bg-emerald-700">
                    <DollarSign className="w-4 h-4 mr-2" />{collecting ? 'Collecting...' : `Collect GH₵ ${totalCollected.toFixed(2)}`}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {collections.length > 0 && (
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Recent Collections for {selectedStudent?.name}</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {collections.map((c: any, i: number) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div><p className="text-sm font-medium">GH₵ {c.total_amount?.toFixed(2)}</p><p className="text-xs text-slate-400">{c.payment_date ? new Date(c.payment_date).toLocaleDateString() : ''} · {c.payment_method}</p></div>
                    <Badge variant="outline" className="bg-emerald-100 text-emerald-700">Collected</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
