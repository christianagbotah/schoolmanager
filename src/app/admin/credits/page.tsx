'use client';

import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Banknote, CreditCard } from 'lucide-react';
import Link from 'next/link';

export default function CreditsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div><h1 className="text-2xl font-bold text-slate-900 tracking-tight">Credits</h1><p className="text-sm text-slate-500 mt-1">Manage student credit notes and adjustments</p></div>
        <div className="flex gap-4 mb-4">
          <Button asChild variant="outline"><Link href="/admin/invoices"><CreditCard className="w-4 h-4 mr-2" />Go to Invoices</Link></Button>
        </div>
        <Card><CardContent className="text-center py-16 text-slate-400"><Banknote className="w-12 h-12 mx-auto mb-3 opacity-50" /><p className="font-medium">Credits module</p><p className="text-sm mt-1">Manage credit notes, overpayments, and student wallet credits. Use the Invoices page for full billing management.</p></CardContent></Card>
      </div>
    </DashboardLayout>
  );
}
