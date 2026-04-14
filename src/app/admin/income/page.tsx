'use client';

import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { TrendingUp, Receipt } from 'lucide-react';
import Link from 'next/link';

export default function IncomePage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div><h1 className="text-2xl font-bold text-slate-900 tracking-tight">Income</h1><p className="text-sm text-slate-500 mt-1">Track all income sources</p></div>
        <div className="flex gap-4 mb-4">
          <Button asChild variant="outline"><Link href="/admin/reports/finance"><TrendingUp className="w-4 h-4 mr-2" />Financial Reports</Link></Button>
          <Button asChild variant="outline"><Link href="/admin/payments"><Receipt className="w-4 h-4 mr-2" />Payments</Link></Button>
        </div>
        <Card><CardContent className="text-center py-16 text-slate-400"><TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-50" /><p className="font-medium">Income tracking</p><p className="text-sm mt-1">All income from fees, payments, and other sources is tracked through the payment system. Use Financial Reports for detailed analytics.</p></CardContent></Card>
      </div>
    </DashboardLayout>
  );
}
