'use client';

import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { BookCheck, Receipt } from 'lucide-react';
import Link from 'next/link';

export default function LedgerPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div><h1 className="text-2xl font-bold text-slate-900 tracking-tight">Student Ledger</h1><p className="text-sm text-slate-500 mt-1">View individual student financial ledger</p></div>
        <div className="flex gap-4 mb-4">
          <Button asChild variant="outline"><Link href="/admin/invoices"><Receipt className="w-4 h-4 mr-2" />Go to Invoices</Link></Button>
        </div>
        <Card><CardContent className="text-center py-16 text-slate-400"><BookCheck className="w-12 h-12 mx-auto mb-3 opacity-50" /><p className="font-medium">Student ledger</p><p className="text-sm mt-1">Individual student financial ledgers are available through the Invoices module. Click on any student to view their complete payment history.</p></CardContent></Card>
      </div>
    </DashboardLayout>
  );
}
