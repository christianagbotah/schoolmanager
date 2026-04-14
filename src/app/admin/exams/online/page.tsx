'use client';

import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Trophy, Globe, Plus } from 'lucide-react';

export default function OnlineExamsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div><h1 className="text-2xl font-bold text-slate-900 tracking-tight">Online Exams</h1><p className="text-sm text-slate-500 mt-1">Create and manage online examinations</p></div>
          <Button onClick={() => toast.info('Online exams coming soon')} className="bg-emerald-600 hover:bg-emerald-700"><Plus className="w-4 h-4 mr-2" />Create Online Exam</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-dashed border-2 border-slate-300 hover:border-emerald-400 transition-colors cursor-pointer" onClick={() => toast.info('Coming soon')}>
            <CardContent className="p-8 text-center space-y-4">
              <div className="w-16 h-16 bg-emerald-100 rounded-full mx-auto flex items-center justify-center"><Trophy className="w-8 h-8 text-emerald-600" /></div>
              <h3 className="font-semibold text-slate-800">Create Exam</h3>
              <p className="text-sm text-slate-500">Create online exams with multiple choice, true/false, and essay questions.</p>
            </CardContent>
          </Card>
          <Card className="border-dashed border-2 border-slate-300 hover:border-emerald-400 transition-colors cursor-pointer" onClick={() => toast.info('Coming soon')}>
            <CardContent className="p-8 text-center space-y-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full mx-auto flex items-center justify-center"><Globe className="w-8 h-8 text-blue-600" /></div>
              <h3 className="font-semibold text-slate-800">Question Bank</h3>
              <p className="text-sm text-slate-500">Manage a bank of questions organized by subject and class.</p>
            </CardContent>
          </Card>
          <Card className="border-dashed border-2 border-slate-300 hover:border-emerald-400 transition-colors cursor-pointer" onClick={() => toast.info('Coming soon')}>
            <CardContent className="p-8 text-center space-y-4">
              <div className="w-16 h-16 bg-amber-100 rounded-full mx-auto flex items-center justify-center"><Trophy className="w-8 h-8 text-amber-600" /></div>
              <h3 className="font-semibold text-slate-800">Results & Analytics</h3>
              <p className="text-sm text-slate-500">View exam results and performance analytics.</p>
            </CardContent>
          </Card>
        </div>

        <Card><CardContent className="text-center py-16 text-slate-400"><Trophy className="w-12 h-12 mx-auto mb-3 opacity-50" /><p className="font-medium">Online examinations module</p><p className="text-sm mt-1">Create computer-based tests for students with automatic grading.</p></CardContent></Card>
      </div>
    </DashboardLayout>
  );
}
