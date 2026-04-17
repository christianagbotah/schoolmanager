'use client';

import { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import {
  BarChart3, PieChart as PieChartIcon, LineChart as LineChartIcon,
  Users, GraduationCap, DollarSign, CalendarCheck,
  Download, Printer, Table2, ChartBar, Loader2,
  FileBarChart, TrendingUp, BarChart3Icon,
} from 'lucide-react';

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line,
} from 'recharts';

/* ---------- color palette ---------- */
const COLORS = ['#10b981', '#f59e0b', '#6366f1', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#ec4899', '#14b8a6', '#84cc16'];

/* ---------- types ---------- */
type ReportType = 'students' | 'teachers' | 'finance' | 'attendance';
type ViewMode = 'chart' | 'table';

interface ReportData {
  report_type: string;
  data: Record<string, any>;
}

const reportTabs = [
  { key: 'students' as ReportType, label: 'Students', icon: Users, color: 'text-emerald-600' },
  { key: 'teachers' as ReportType, label: 'Teachers', icon: GraduationCap, color: 'text-amber-600' },
  { key: 'finance' as ReportType, label: 'Finance', icon: DollarSign, color: 'text-violet-600' },
  { key: 'attendance' as ReportType, label: 'Attendance', icon: CalendarCheck, color: 'text-cyan-600' },
];

function fmt(n: number) { return `GH\u20B5 ${(n || 0).toFixed(2)}`; }
function fmtK(n: number) {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(Math.round(n));
}

/* ---------- component ---------- */
export default function AdvancedReportsPage() {
  const [reportType, setReportType] = useState<ReportType>('students');
  const [viewMode, setViewMode] = useState<ViewMode>('chart');
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 6);
    return d.toISOString().split('T')[0];
  });
  const [toDate, setToDate] = useState(() => new Date().toISOString().split('T')[0]);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        report_type: reportType,
        from: fromDate,
        to: toDate,
      });
      const res = await fetch(`/api/admin/reports/advanced?${params}`);
      const result = await res.json();
      setData(result);
    } catch { toast.error('Failed to load report'); }
    setLoading(false);
  }, [reportType, fromDate, toDate]);

  useEffect(() => { fetchReport(); }, [fetchReport]);

  /* --- export CSV --- */
  const exportCSV = () => {
    if (!data) return;
    const d = data.data;
    let csv = '';
    Object.entries(d).forEach(([key, arr]: [string, any]) => {
      if (!Array.isArray(arr)) return;
      csv += `\n--- ${key} ---\n`;
      const headers = Object.keys(arr[0] || {});
      csv += headers.join(',') + '\n';
      arr.forEach((row: any) => {
        csv += headers.map(h => {
          const val = row[h];
          if (typeof val === 'string' && val.includes(',')) return `"${val}"`;
          return val;
        }).join(',') + '\n';
      });
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${reportType}_report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exported successfully');
  };

  /* --- print --- */
  const handlePrint = () => window.print();

  const toggleView = () => setViewMode(prev => prev === 'chart' ? 'table' : 'chart');

  /* ---------- RENDER REPORT SECTIONS ---------- */
  const renderReport = () => {
    if (!data?.data) return null;
    const d = data.data;

    switch (reportType) {
      case 'students':
        return (
          <div className="space-y-6">
            {/* Gender Distribution */}
            <ReportSection
              title="Gender Distribution"
              viewMode={viewMode}
              toggleView={toggleView}
              chart={
                <div className="flex h-72 items-center justify-center">
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie data={d.genderDistribution} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={4} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                        {d.genderDistribution?.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              }
              table={
                <Table>
                  <TableHeader><TableRow><TableHead>Gender</TableHead><TableHead className="text-right">Count</TableHead><TableHead className="text-right">Percentage</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {d.genderDistribution?.map((row: any, i: number) => {
                      const total = d.genderDistribution?.reduce((s: number, r: any) => s + r.value, 0) || 1;
                      return (
                        <TableRow key={i}>
                          <TableCell className="flex items-center gap-2"><div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />{row.name}</TableCell>
                          <TableCell className="text-right font-semibold">{row.value}</TableCell>
                          <TableCell className="text-right">{((row.value / total) * 100).toFixed(1)}%</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              }
            />

            {/* Age Analysis */}
            <ReportSection
              title="Age Analysis"
              viewMode={viewMode}
              toggleView={toggleView}
              chart={
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={d.ageDistribution}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#10b981" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              }
              table={
                <Table>
                  <TableHeader><TableRow><TableHead>Age Group</TableHead><TableHead className="text-right">Students</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {d.ageDistribution?.map((row: any, i: number) => (
                      <TableRow key={i}><TableCell>{row.name}</TableCell><TableCell className="text-right font-semibold">{row.value}</TableCell></TableRow>
                    ))}
                  </TableBody>
                </Table>
              }
            />

            {/* Enrollment by Class */}
            <ReportSection
              title="Enrollment by Class"
              viewMode={viewMode}
              toggleView={toggleView}
              chart={
                <ResponsiveContainer width="100%" height={Math.max(280, (d.enrollmentByClass?.length || 0) * 28)}>
                  <BarChart data={d.enrollmentByClass} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis type="number" tick={{ fontSize: 12 }} />
                    <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#6366f1" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              }
              table={
                <Table>
                  <TableHeader><TableRow><TableHead>Class</TableHead><TableHead className="text-right">Students</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {d.enrollmentByClass?.map((row: any, i: number) => (
                      <TableRow key={i}><TableCell>{row.name}</TableCell><TableCell className="text-right font-semibold">{row.value}</TableCell></TableRow>
                    ))}
                  </TableBody>
                </Table>
              }
            />

            {/* Admission Trends */}
            {d.admissionTrendData?.length > 0 && (
              <ReportSection
                title="Admission Trends"
                viewMode={viewMode}
                toggleView={toggleView}
                chart={
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={d.admissionTrendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                }
                table={
                  <Table>
                    <TableHeader><TableRow><TableHead>Month</TableHead><TableHead className="text-right">Admissions</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {d.admissionTrendData?.map((row: any, i: number) => (
                        <TableRow key={i}><TableCell>{row.name}</TableCell><TableCell className="text-right font-semibold">{row.value}</TableCell></TableRow>
                      ))}
                    </TableBody>
                  </Table>
                }
              />
            )}
          </div>
        );

      case 'teachers':
        return (
          <div className="space-y-6">
            {/* Designation Distribution */}
            <ReportSection
              title="Qualification / Designation Distribution"
              viewMode={viewMode}
              toggleView={toggleView}
              chart={
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={d.qualificationDistribution}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              }
              table={
                <Table>
                  <TableHeader><TableRow><TableHead>Designation</TableHead><TableHead className="text-right">Count</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {d.qualificationDistribution?.map((row: any, i: number) => (
                      <TableRow key={i}><TableCell>{row.name}</TableCell><TableCell className="text-right font-semibold">{row.value}</TableCell></TableRow>
                    ))}
                  </TableBody>
                </Table>
              }
            />

            {/* Gender */}
            <ReportSection
              title="Gender Distribution"
              viewMode={viewMode}
              toggleView={toggleView}
              chart={
                <div className="flex h-72 items-center justify-center">
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie data={d.genderDistribution} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={4} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                        {d.genderDistribution?.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              }
              table={
                <Table>
                  <TableHeader><TableRow><TableHead>Gender</TableHead><TableHead className="text-right">Count</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {d.genderDistribution?.map((row: any, i: number) => (
                      <TableRow key={i}><TableCell className="flex items-center gap-2"><div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />{row.name}</TableCell><TableCell className="text-right font-semibold">{row.value}</TableCell></TableRow>
                    ))}
                  </TableBody>
                </Table>
              }
            />

            {/* Department Distribution */}
            <ReportSection
              title="Department Distribution"
              viewMode={viewMode}
              toggleView={toggleView}
              chart={
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={d.departmentDistribution}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              }
              table={
                <Table>
                  <TableHeader><TableRow><TableHead>Department</TableHead><TableHead className="text-right">Teachers</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {d.departmentDistribution?.map((row: any, i: number) => (
                      <TableRow key={i}><TableCell>{row.name}</TableCell><TableCell className="text-right font-semibold">{row.value}</TableCell></TableRow>
                    ))}
                  </TableBody>
                </Table>
              }
            />

            {/* Subjects per Teacher */}
            <ReportSection
              title="Subjects Taught per Teacher (Top 15)"
              viewMode={viewMode}
              toggleView={toggleView}
              chart={
                <ResponsiveContainer width="100%" height={Math.max(280, (d.subjectsPerTeacher?.length || 0) * 28)}>
                  <BarChart data={d.subjectsPerTeacher} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis type="number" tick={{ fontSize: 12 }} />
                    <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="subjects" fill="#06b6d4" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              }
              table={
                <Table>
                  <TableHeader><TableRow><TableHead>Teacher</TableHead><TableHead>Code</TableHead><TableHead className="text-right">Subjects</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {d.subjectsPerTeacher?.map((row: any, i: number) => (
                      <TableRow key={i}><TableCell>{row.name}</TableCell><TableCell className="text-slate-500">{row.code}</TableCell><TableCell className="text-right font-semibold">{row.subjects}</TableCell></TableRow>
                    ))}
                  </TableBody>
                </Table>
              }
            />
          </div>
        );

      case 'finance':
        return (
          <div className="space-y-6">
            {/* Revenue Trends */}
            <ReportSection
              title="Revenue Trends"
              viewMode={viewMode}
              toggleView={toggleView}
              chart={
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={d.revenueTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 12 }} tickFormatter={fmtK} />
                    <Tooltip formatter={(v: number) => fmt(v)} />
                    <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} name="Revenue" />
                  </LineChart>
                </ResponsiveContainer>
              }
              table={
                <Table>
                  <TableHeader><TableRow><TableHead>Month</TableHead><TableHead className="text-right">Revenue</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {d.revenueTrend?.map((row: any, i: number) => (
                      <TableRow key={i}><TableCell>{row.name}</TableCell><TableCell className="text-right font-semibold">{fmt(row.value)}</TableCell></TableRow>
                    ))}
                  </TableBody>
                </Table>
              }
            />

            {/* Expense Breakdown */}
            <ReportSection
              title="Expense Breakdown"
              viewMode={viewMode}
              toggleView={toggleView}
              chart={
                <div className="flex h-72 items-center justify-center">
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie data={d.expenseBreakdown} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3} dataKey="value" label={({ name, percent }) => percent > 0.05 ? `${name} ${(percent * 100).toFixed(0)}%` : ''} labelLine={false}>
                        {d.expenseBreakdown?.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(v: number) => fmt(v)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              }
              table={
                <Table>
                  <TableHeader><TableRow><TableHead>Category</TableHead><TableHead className="text-right">Amount</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {d.expenseBreakdown?.map((row: any, i: number) => (
                      <TableRow key={i}><TableCell className="flex items-center gap-2"><div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />{row.name}</TableCell><TableCell className="text-right font-semibold">{fmt(row.value)}</TableCell></TableRow>
                    ))}
                  </TableBody>
                </Table>
              }
            />

            {/* Collection Efficiency */}
            <ReportSection
              title="Collection Efficiency by Class"
              viewMode={viewMode}
              toggleView={toggleView}
              chart={
                <ResponsiveContainer width="100%" height={Math.max(280, (d.collectionEfficiency?.length || 0) * 28)}>
                  <BarChart data={d.collectionEfficiency}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 12 }} tickFormatter={fmtK} />
                    <Tooltip formatter={(v: number) => fmt(v)} />
                    <Legend />
                    <Bar dataKey="total" fill="#ef4444" name="Billed" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="paid" fill="#10b981" name="Collected" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              }
              table={
                <Table>
                  <TableHeader><TableRow><TableHead>Class</TableHead><TableHead className="text-right">Billed</TableHead><TableHead className="text-right">Collected</TableHead><TableHead className="text-right">Efficiency</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {d.collectionEfficiency?.map((row: any, i: number) => (
                      <TableRow key={i}>
                        <TableCell>{row.name}</TableCell>
                        <TableCell className="text-right">{fmt(row.total)}</TableCell>
                        <TableCell className="text-right">{fmt(row.paid)}</TableCell>
                        <TableCell className="text-right"><Badge variant={row.percentage >= 80 ? 'default' : row.percentage >= 50 ? 'secondary' : 'destructive'} className="text-[10px]">{row.percentage}%</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              }
            />

            {/* Payment Methods */}
            <ReportSection
              title="Payment Method Distribution"
              viewMode={viewMode}
              toggleView={toggleView}
              chart={
                <div className="flex h-72 items-center justify-center">
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie data={d.paymentMethods} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={4} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                        {d.paymentMethods?.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(v: number) => fmt(v)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              }
              table={
                <Table>
                  <TableHeader><TableRow><TableHead>Method</TableHead><TableHead className="text-right">Amount</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {d.paymentMethods?.map((row: any, i: number) => (
                      <TableRow key={i}><TableCell className="flex items-center gap-2"><div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />{row.name}</TableCell><TableCell className="text-right font-semibold">{fmt(row.value)}</TableCell></TableRow>
                    ))}
                  </TableBody>
                </Table>
              }
            />
          </div>
        );

      case 'attendance':
        return (
          <div className="space-y-6">
            {/* Daily Trends */}
            <ReportSection
              title="Daily Attendance Trends (Last 30 Days)"
              viewMode={viewMode}
              toggleView={toggleView}
              chart={
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={d.dailyTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="present" stroke="#10b981" strokeWidth={2} name="Present" dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="absent" stroke="#ef4444" strokeWidth={2} name="Absent" dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="late" stroke="#f59e0b" strokeWidth={2} name="Late" dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              }
              table={
                <Table>
                  <TableHeader><TableRow><TableHead>Date</TableHead><TableHead className="text-right">Present</TableHead><TableHead className="text-right">Absent</TableHead><TableHead className="text-right">Late</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {d.dailyTrend?.map((row: any, i: number) => (
                      <TableRow key={i}><TableCell>{row.name}</TableCell><TableCell className="text-right text-emerald-600 font-semibold">{row.present}</TableCell><TableCell className="text-right text-red-600 font-semibold">{row.absent}</TableCell><TableCell className="text-right text-amber-600 font-semibold">{row.late}</TableCell></TableRow>
                    ))}
                  </TableBody>
                </Table>
              }
            />

            {/* Class Comparison */}
            <ReportSection
              title="Class Comparison"
              viewMode={viewMode}
              toggleView={toggleView}
              chart={
                <ResponsiveContainer width="100%" height={Math.max(280, (d.classComparison?.length || 0) * 28)}>
                  <BarChart data={d.classComparison} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis type="number" tick={{ fontSize: 12 }} />
                    <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="present" fill="#10b981" name="Present" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="absent" fill="#ef4444" name="Absent" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              }
              table={
                <Table>
                  <TableHeader><TableRow><TableHead>Class</TableHead><TableHead className="text-right">Present</TableHead><TableHead className="text-right">Absent</TableHead><TableHead className="text-right">Total</TableHead><TableHead className="text-right">Rate</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {d.classComparison?.map((row: any, i: number) => (
                      <TableRow key={i}>
                        <TableCell>{row.name}</TableCell>
                        <TableCell className="text-right text-emerald-600">{row.present}</TableCell>
                        <TableCell className="text-right text-red-600">{row.absent}</TableCell>
                        <TableCell className="text-right">{row.total}</TableCell>
                        <TableCell className="text-right"><Badge variant={row.rate >= 80 ? 'default' : row.rate >= 50 ? 'secondary' : 'destructive'} className="text-[10px]">{row.rate}%</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              }
            />

            {/* Gender Comparison */}
            <ReportSection
              title="Gender Comparison"
              viewMode={viewMode}
              toggleView={toggleView}
              chart={
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={d.genderComparison}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="present" fill="#10b981" name="Present" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="absent" fill="#ef4444" name="Absent" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              }
              table={
                <Table>
                  <TableHeader><TableRow><TableHead>Gender</TableHead><TableHead className="text-right">Present</TableHead><TableHead className="text-right">Absent</TableHead><TableHead className="text-right">Rate</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {d.genderComparison?.map((row: any, i: number) => (
                      <TableRow key={i}>
                        <TableCell>{row.name}</TableCell>
                        <TableCell className="text-right text-emerald-600 font-semibold">{row.present}</TableCell>
                        <TableCell className="text-right text-red-600 font-semibold">{row.absent}</TableCell>
                        <TableCell className="text-right"><Badge variant={row.rate >= 80 ? 'default' : 'secondary'} className="text-[10px]">{row.rate}%</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              }
            />

            {/* Monthly Trend */}
            {d.monthlyTrend?.length > 0 && (
              <ReportSection
                title="Monthly Attendance Trend"
                viewMode={viewMode}
                toggleView={toggleView}
                chart={
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={d.monthlyTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="present" stroke="#10b981" strokeWidth={2} name="Present" dot={{ r: 4 }} />
                      <Line type="monotone" dataKey="absent" stroke="#ef4444" strokeWidth={2} name="Absent" dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                }
                table={
                  <Table>
                    <TableHeader><TableRow><TableHead>Month</TableHead><TableHead className="text-right">Present</TableHead><TableHead className="text-right">Absent</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {d.monthlyTrend?.map((row: any, i: number) => (
                        <TableRow key={i}><TableCell>{row.name}</TableCell><TableCell className="text-right text-emerald-600 font-semibold">{row.present}</TableCell><TableCell className="text-right text-red-600 font-semibold">{row.absent}</TableCell></TableRow>
                      ))}
                    </TableBody>
                  </Table>
                }
              />
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Gradient Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 p-6 text-white shadow-xl">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iNCIvPjwvZz48L2c+PC9zdmc+')] opacity-60" />
          <div className="relative flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
                <FileBarChart className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Advanced Reports</h1>
                <p className="mt-0.5 text-sm text-emerald-100">
                  Comprehensive analytics across students, teachers, finance &amp; attendance
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/10" onClick={exportCSV}>
                <Download className="mr-1.5 h-4 w-4" /> Export CSV
              </Button>
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/10" onClick={handlePrint}>
                <Printer className="mr-1.5 h-4 w-4" /> Print
              </Button>
            </div>
          </div>
        </div>

        {/* Controls: Date Range + View Toggle */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap items-end gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-600">From</Label>
                <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="h-10 w-44" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-600">To</Label>
                <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="h-10 w-44" />
              </div>
              <div className="flex-1" />
              <Button variant="outline" size="sm" onClick={toggleView} className="h-10">
                {viewMode === 'chart' ? <><Table2 className="mr-1.5 h-4 w-4" /> Table View</> : <><ChartBar className="mr-1.5 h-4 w-4" /> Chart View</>}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Report Tabs */}
        <Tabs value={reportType} onValueChange={(v) => setReportType(v as ReportType)}>
          <TabsList className="grid w-full grid-cols-4 h-auto p-1">
            {reportTabs.map(tab => (
              <TabsTrigger key={tab.key} value={tab.key} className="flex items-center gap-2 py-2.5 text-xs sm:text-sm">
                <tab.icon className={`h-4 w-4 ${tab.color}`} />
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {reportTabs.map(tab => (
            <TabsContent key={tab.key} value={tab.key}>
              {loading ? (
                <div className="space-y-6">
                  <Skeleton className="h-8 w-48" />
                  <Skeleton className="h-80 rounded-xl" />
                  <Skeleton className="h-80 rounded-xl" />
                </div>
              ) : (
                renderReport()
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </DashboardLayout>
  );
}

/* ---------- Reusable Report Section ---------- */
function ReportSection({
  title,
  viewMode,
  toggleView,
  chart,
  table,
}: {
  title: string;
  viewMode: ViewMode;
  toggleView: () => void;
  chart: React.ReactNode;
  table: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold text-slate-700">{title}</CardTitle>
          <Button variant="ghost" size="sm" onClick={toggleView} className="h-8 text-xs text-slate-400 hover:text-slate-600">
            {viewMode === 'chart' ? <><Table2 className="mr-1 h-3 w-3" />Table</> : <><BarChart3Icon className="mr-1 h-3 w-3" />Chart</>}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="max-h-[500px] overflow-y-auto">
        {viewMode === 'chart' ? chart : table}
      </CardContent>
    </Card>
  );
}
