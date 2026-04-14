'use client';

import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { BellRing, Smartphone } from 'lucide-react';
import Link from 'next/link';

export default function BillRemindersPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div><h1 className="text-2xl font-bold text-slate-900 tracking-tight">Bill Reminders</h1><p className="text-sm text-slate-500 mt-1">Automated fee reminder system</p></div>
        <div className="flex gap-4 mb-4">
          <Button asChild variant="outline"><Link href="/admin/sms"><Smartphone className="w-4 h-4 mr-2" />SMS Settings</Link></Button>
          <Button asChild variant="outline"><Link href="/admin/invoices"><BellRing className="w-4 h-4 mr-2" />Invoices</Link></Button>
        </div>
        <Card>
          <CardContent className="p-6 space-y-4">
            <h3 className="font-semibold text-slate-800">Reminder Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="border-slate-200"><CardContent className="p-4"><p className="font-medium text-sm">Overdue Invoices</p><p className="text-xs text-slate-500 mt-1">Send reminders for invoices past due date</p><Button size="sm" variant="outline" className="mt-2" onClick={() => toast.info('Coming soon')}>Configure</Button></CardContent></Card>
              <Card className="border-slate-200"><CardContent className="p-4"><p className="font-medium text-sm">Pre-due Reminders</p><p className="text-xs text-slate-500 mt-1">Send reminders before invoice due date</p><Button size="sm" variant="outline" className="mt-2" onClick={() => toast.info('Coming soon')}>Configure</Button></CardContent></Card>
              <Card className="border-slate-200"><CardContent className="p-4"><p className="font-medium text-sm">Partial Payment Follow-up</p><p className="text-xs text-slate-500 mt-1">Follow up on partially paid invoices</p><Button size="sm" variant="outline" className="mt-2" onClick={() => toast.info('Coming soon')}>Configure</Button></CardContent></Card>
              <Card className="border-slate-200"><CardContent className="p-4"><p className="font-medium text-sm">Bulk Send</p><p className="text-xs text-slate-500 mt-1">Send reminders to all parents with outstanding fees</p><Button size="sm" className="mt-2 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => toast.info('Coming soon')}>Send All</Button></CardContent></Card>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
