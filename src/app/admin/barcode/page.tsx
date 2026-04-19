'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Search, ScanBarcode, ScanLine, CreditCard, UserCircle, CheckCircle } from 'lucide-react';

export default function BarcodePage() {
  const [barcode, setBarcode] = useState('');
  const [result, setResult] = useState<{ type: string; name: string; code: string } | null>(null);
  const [searching, setSearching] = useState(false);

  const handleSearch = async () => {
    if (!barcode.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(`/api/students?search=${encodeURIComponent(barcode)}&limit=1`);
      const data = await res.json();
      const students = data.students || [];
      if (students.length > 0) {
        setResult({ type: 'student', name: students[0].name, code: students[0].student_code });
      } else {
        setResult(null);
        toast.error('No record found for this barcode');
      }
    } catch { toast.error('Search failed'); }
    setSearching(false);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-2xl mx-auto">
        {/* Page Header */}
        <div className="border-b border-slate-100 pb-4">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Barcode Scanner</h1>
          <p className="text-sm text-slate-500 mt-1">Scan or search barcodes to identify students, items, or invoices</p>
        </div>

        {/* Scanner Card */}
        <Card className="rounded-2xl border-slate-200/60">
          <CardContent className="p-6 space-y-5 text-center">
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 mx-auto flex items-center justify-center">
              <ScanBarcode className="w-8 h-8 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800">Scan or Enter Barcode</h3>
              <p className="text-sm text-slate-500 mt-1">Enter a barcode manually or scan using a barcode scanner device</p>
            </div>
            <div className="flex gap-2 max-w-md mx-auto">
              <Input
                placeholder="Enter barcode..."
                value={barcode}
                onChange={e => setBarcode(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                className="flex-1 bg-slate-50 border-slate-200 focus:bg-white min-h-[44px]"
              />
              <Button
                onClick={handleSearch}
                disabled={searching}
                className="bg-emerald-600 hover:bg-emerald-700 min-h-[44px] min-w-[44px]"
              >
                {searching ? (
                  <Skeleton className="w-4 h-4 rounded" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Result Card */}
        {result && (
          <Card className="rounded-2xl border-emerald-200 bg-emerald-50/50">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-500 flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-emerald-800 truncate">{result.name}</p>
                  <p className="text-sm text-emerald-600">{result.type} · {result.code}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty State when no result and not searching */}
        {!result && !searching && barcode === '' && (
          <Card className="rounded-2xl border-slate-200/60">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 mx-auto flex items-center justify-center mb-3">
                <ScanLine className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="font-medium text-slate-700">Ready to Scan</h3>
              <p className="text-sm text-slate-500 mt-1">Enter a barcode above or use a scanner device to look up records</p>
            </CardContent>
          </Card>
        )}

        {/* Info Cards */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="rounded-2xl border-slate-200/60 hover:shadow-lg hover:-translate-y-0.5 transition-all">
            <CardContent className="p-4 text-center">
              <div className="w-11 h-11 rounded-xl bg-emerald-500 flex items-center justify-center mx-auto mb-2">
                <UserCircle className="w-5 h-5 text-white" />
              </div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Students</p>
              <p className="text-sm font-medium text-slate-700 mt-1">Lookup</p>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border-slate-200/60 hover:shadow-lg hover:-translate-y-0.5 transition-all">
            <CardContent className="p-4 text-center">
              <div className="w-11 h-11 rounded-xl bg-sky-500 flex items-center justify-center mx-auto mb-2">
                <CreditCard className="w-5 h-5 text-white" />
              </div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Invoices</p>
              <p className="text-sm font-medium text-slate-700 mt-1">Quick Find</p>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border-slate-200/60 hover:shadow-lg hover:-translate-y-0.5 transition-all">
            <CardContent className="p-4 text-center">
              <div className="w-11 h-11 rounded-xl bg-violet-500 flex items-center justify-center mx-auto mb-2">
                <ScanLine className="w-5 h-5 text-white" />
              </div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Devices</p>
              <p className="text-sm font-medium text-slate-700 mt-1">Supported</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
