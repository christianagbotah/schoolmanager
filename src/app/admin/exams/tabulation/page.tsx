'use client';

import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Table2, BookOpen, Printer } from 'lucide-react';
import Link from 'next/link';

export default function TabulationPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        <div><h1 className="text-2xl font-bold text-slate-900 tracking-tight">Tabulation Sheet</h1><p className="text-sm text-slate-500 mt-1">View and print class-wide brood sheets</p></div>
        <Card>
          <CardContent className="p-6 space-y-4">
            <h3 className="font-semibold text-slate-800">Generate Brood Sheet</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div><Label className="text-xs">Class</Label><Select><SelectTrigger className="mt-1"><SelectValue placeholder="Select class" /></SelectTrigger><SelectContent><SelectItem value="1">Basic 1</SelectItem><SelectItem value="2">Basic 2</SelectItem></SelectContent></Select></div>
              <div><Label className="text-xs">Exam</Label><Select><SelectTrigger className="mt-1"><SelectValue placeholder="Select exam" /></SelectTrigger><SelectContent><SelectItem value="t1">Term 1 Exam</SelectItem></SelectContent></Select></div>
              <div><Label className="text-xs">Year</Label><Select><SelectTrigger className="mt-1"><SelectValue placeholder="Year" /></SelectTrigger><SelectContent><SelectItem value="2025">2025</SelectItem><SelectItem value="2024">2024</SelectItem></SelectContent></Select></div>
            </div>
            <Button onClick={() => toast.info('Tabulation report coming soon')} className="bg-emerald-600 hover:bg-emerald-700"><Table2 className="w-4 h-4 mr-2" />Generate Brood Sheet</Button>
          </CardContent>
        </Card>
        <Card><CardContent className="text-center py-16 text-slate-400"><Table2 className="w-12 h-12 mx-auto mb-3 opacity-50" /><p className="font-medium">Tabulation sheet module</p><p className="text-sm mt-1">Select class, exam and year to generate a class-wide brood sheet with student rankings.</p></CardContent></Card>
      </div>
    </DashboardLayout>
  );
}
