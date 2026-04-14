'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { DollarSign, HandCoins, CheckCircle, Printer } from 'lucide-react';

export default function DailyFeeHandoverPage() {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [summary, setSummary] = useState({ total: 0, cash: 0, mobile_money: 0, bank_transfer: 0, count: 0 });
  const [loading, setLoading] = useState(false);
  const [handoverTo, setHandoverTo] = useState('');
  const [handingOver, setHandingOver] = useState(false);
  const [handedOver, setHandedOver] = useState(false);

  useEffect(() => {
    const fetchSummary = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/daily-fees/report?date=${date}`);
        const data = await res.json();
        setSummary(data.summary || { total: 0, cash: 0, mobile_money: 0, bank_transfer: 0, count: 0 });
      } catch {} finally { setLoading(false); }
    };
    fetchSummary();
  }, [date]);

  const handleHandover = async () => {
    if (!handoverTo) { toast.error('Enter handover recipient name'); return; }
    setHandingOver(true);
    try {
      const res = await fetch('/api/daily-fees', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'handover', date, handover_to: handoverTo, total: summary.total }) });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast.success('Handover recorded successfully');
      setHandedOver(true);
    } catch (err: any) { toast.error(err.message); } finally { setHandingOver(false); }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-2xl mx-auto">
        <div><h1 className="text-2xl font-bold text-slate-900 tracking-tight">Daily Fee Handover</h1><p className="text-sm text-slate-500 mt-1">Record daily cash handover to management</p></div>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Label className="text-xs">Date</Label>
              <Input type="date" value={date} onChange={e => { setDate(e.target.value); setHandedOver(false); }} className="w-48" />
            </div>
          </CardContent>
        </Card>

        {handedOver && (
          <Card className="border-emerald-200 bg-emerald-50">
            <CardContent className="p-6 text-center">
              <CheckCircle className="w-12 h-12 text-emerald-600 mx-auto mb-3" />
              <h3 className="font-semibold text-emerald-800">Handover Complete</h3>
              <p className="text-sm text-emerald-600 mt-1">GH₵ {summary.total.toFixed(2)} handed over to {handoverTo}</p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><DollarSign className="w-4 h-4 text-emerald-600" />Collection Summary</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-lg"><p className="text-xs text-slate-500">Cash</p><p className="text-xl font-bold">GH₵ {summary.cash.toFixed(2)}</p></div>
              <div className="p-4 bg-slate-50 rounded-lg"><p className="text-xs text-slate-500">Mobile Money</p><p className="text-xl font-bold">GH₵ {summary.mobile_money.toFixed(2)}</p></div>
              <div className="p-4 bg-slate-50 rounded-lg"><p className="text-xs text-slate-500">Bank Transfer</p><p className="text-xl font-bold">GH₵ {summary.bank_transfer.toFixed(2)}</p></div>
              <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200"><p className="text-xs text-slate-500">Total Collected</p><p className="text-xl font-bold text-emerald-700">GH₵ {summary.total.toFixed(2)}</p><p className="text-xs text-slate-400">{summary.count} transactions</p></div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><HandCoins className="w-4 h-4" />Handover Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div><Label className="text-xs">Handover To *</Label><Input placeholder="Name of the person receiving" value={handoverTo} onChange={e => setHandoverTo(e.target.value)} className="mt-1" /></div>
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm font-medium text-amber-800">Amount to handover: GH₵ {summary.total.toFixed(2)}</p>
              <p className="text-xs text-amber-600 mt-1">Please verify the physical cash count before submitting</p>
            </div>
            <Button onClick={handleHandover} disabled={handingOver || !handoverTo || summary.total <= 0} className="w-full bg-emerald-600 hover:bg-emerald-700">
              <HandCoins className="w-4 h-4 mr-2" />{handingOver ? 'Recording...' : 'Record Handover'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
