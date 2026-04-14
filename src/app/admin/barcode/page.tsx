'use client';

import { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Search, Plus, ScanBarcode, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';

export default function BarcodePage() {
  const [scanning, setScanning] = useState(false);
  const [barcode, setBarcode] = useState('');
  const [result, setResult] = useState<{ type: string; name: string; code: string } | null>(null);

  const handleSearch = async () => {
    if (!barcode) return;
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
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-2xl mx-auto">
        <div><h1 className="text-2xl font-bold text-slate-900 tracking-tight">Barcode Scanner</h1><p className="text-sm text-slate-500 mt-1">Scan or search barcodes to identify students, items, or invoices</p></div>

        <Card>
          <CardContent className="p-6 space-y-4 text-center">
            <div className="w-24 h-24 bg-slate-100 rounded-full mx-auto flex items-center justify-center mb-4">
              <ScanBarcode className="w-12 h-12 text-slate-400" />
            </div>
            <h3 className="font-semibold text-slate-800">Scan or Enter Barcode</h3>
            <p className="text-sm text-slate-500">Enter a barcode manually or scan using a barcode scanner device</p>
            <div className="flex gap-2 max-w-md mx-auto">
              <Input placeholder="Enter barcode..." value={barcode} onChange={e => setBarcode(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()} className="flex-1" />
              <Button onClick={handleSearch} className="bg-emerald-600 hover:bg-emerald-700">Search</Button>
            </div>
          </CardContent>
        </Card>

        {result && (
          <Card className="border-emerald-200 bg-emerald-50">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center"><ScanBarcode className="w-6 h-6 text-emerald-600" /></div>
                <div>
                  <p className="font-semibold text-emerald-800">{result.name}</p>
                  <p className="text-sm text-emerald-600">{result.type} · {result.code}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
