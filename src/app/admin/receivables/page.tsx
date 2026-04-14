'use client';

import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Scale, Receipt } from 'lucide-react';
import Link from 'next/link';

export default function ReceivablesPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div><h1 className="text-2xl font-bold text-slate-900 tracking-tight">Receivables</h1><p className="text-sm text-slate-500 mt-1">Outstanding invoices and payment tracking</p></div>
        <div className="flex gap-4 mb-4">
          <Button asChild variant="outline"><Link href="/admin/invoices"><Receipt className="w-4 h-4 mr-2" />Go to Invoices</Link></Button>
          <Button asChild variant="outline"><Link href="/admin/reports/finance"><Scale className="w-4 h-4 mr-2" />Financial Reports</Link></Button>
        </div>
        <Card><CardContent className="text-center py-16 text-slate-400"><Scale className="w-12 h-12 mx-auto mb-3 opacity-50" /><p className="font-medium">Accounts receivable</p><p className="text-sm mt-1">Track outstanding payments and aging reports through the Invoices and Financial Reports modules.</p></CardContent></Card>
      </div>
    </DashboardLayout>
  );
}
