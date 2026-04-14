'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { ArrowLeft, Printer, CreditCard, Users } from 'lucide-react';
import Link from 'next/link';

interface Student { student_id: number; student_code: string; name: string; sex: string; parent_name?: string; parent_phone?: string; class?: { class_id: number; name: string; category: string }; }
interface ClassItem { class_id: number; name: string; category?: string; }

const CLASS_GROUPS = ['CRECHE', 'NURSERY', 'KG', 'BASIC', 'JHS'];

export default function IdCardsPage() {
  const [group, setGroup] = useState('');
  const [classId, setClassId] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [schoolName, setSchoolName] = useState('');

  useEffect(() => {
    fetch('/api/classes?limit=200').then(r => r.json()).then(d => setClasses(Array.isArray(d) ? d : [])).catch(() => {});
    fetch('/api/settings').then(r => r.json()).then(d => { if (d.school_name) setSchoolName(d.school_name); }).catch(() => {});
  }, []);

  const filteredClasses = group ? classes.filter(c => c.category === group) : classes;

  const fetchStudents = async () => {
    if (!classId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/students?classId=${classId}&limit=200`);
      const data = await res.json();
      setStudents(data.students || []);
    } catch { toast.error('Failed to load students'); } finally { setLoading(false); }
  };

  useEffect(() => { if (classId) fetchStudents(); else setStudents([]); }, [classId]);

  const handlePrint = () => window.print();

  const currentYear = new Date().getFullYear();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild><Link href="/admin/students"><ArrowLeft className="w-5 h-5" /></Link></Button>
          <div><h1 className="text-2xl font-bold text-slate-900 tracking-tight">Student ID Cards</h1><p className="text-sm text-slate-500 mt-1">Generate and print ID cards for students</p></div>
        </div>

        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-3 items-end">
              <div className="flex-1">
                <div className="flex gap-2 mb-2 flex-wrap">{CLASS_GROUPS.map(g => (
                  <Button key={g} variant={group === g ? 'default' : 'outline'} size="sm" className="text-xs" onClick={() => { setGroup(group === g ? '' : g); setClassId(''); }}>{g}</Button>
                ))}</div>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <Select value={classId} onValueChange={setClassId}>
                  <SelectTrigger className="w-48"><SelectValue placeholder="Select class" /></SelectTrigger>
                  <SelectContent>{filteredClasses.map(c => <SelectItem key={c.class_id} value={String(c.class_id)}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
                <Button variant="outline" onClick={handlePrint} disabled={students.length === 0}><Printer className="w-4 h-4 mr-2" />Print</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {!classId ? (
          <div className="text-center py-16 text-slate-400"><CreditCard className="w-12 h-12 mx-auto mb-3 opacity-50" /><p className="font-medium">Select a class to generate ID cards</p></div>
        ) : loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-64 rounded-xl" />)}</div>
        ) : students.length === 0 ? (
          <div className="text-center py-16 text-slate-400"><Users className="w-12 h-12 mx-auto mb-3 opacity-50" /><p>No students in this class</p></div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 print:grid-cols-3 print:gap-2" id="id-cards">
            {students.map((s) => (
              <div key={s.student_id} className="bg-white border-2 border-slate-200 rounded-xl overflow-hidden print:border print:border-slate-400 print:shadow-none" style={{ breakInside: 'avoid' }}>
                {/* Card Header */}
                <div className="bg-emerald-600 text-white p-3 text-center">
                  <p className="text-[10px] font-medium uppercase tracking-wider">{schoolName || 'School Name'}</p>
                  <p className="text-[9px] opacity-80">Student Identity Card</p>
                </div>
                {/* Photo placeholder */}
                <div className="flex justify-center -mt-8 mb-2">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 border-4 border-white flex items-center justify-center">
                    <span className="text-2xl font-bold text-emerald-600">{s.name.charAt(0)}</span>
                  </div>
                </div>
                {/* Info */}
                <div className="px-4 pb-4 space-y-1.5 text-center">
                  <p className="font-bold text-sm text-slate-900 truncate">{s.name}</p>
                  <div className="bg-slate-50 rounded-lg p-2 space-y-1 text-[11px]">
                    <div className="flex justify-between"><span className="text-slate-500">Code:</span><span className="font-mono font-medium">{s.student_code}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Class:</span><span className="font-medium">{s.class?.name || ''}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Gender:</span><span className="capitalize">{s.sex}</span></div>
                  </div>
                  <p className="text-[9px] text-slate-400">{currentYear}/{currentYear + 1}</p>
                </div>
                {/* Footer */}
                <div className="bg-slate-50 px-4 py-2 text-center">
                  <div className="w-16 h-16 bg-slate-100 mx-auto rounded flex items-center justify-center mb-1" title="Scan for verification">
                    <CreditCard className="w-6 h-6 text-slate-400" />
                  </div>
                  <p className="text-[8px] text-slate-400">This card is property of the school</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
