'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

import {
  User, Mail, Phone, MapPin, Calendar, Droplets, Flag, CreditCard,
  BookOpen, Home, GraduationCap, Heart, Key, ChevronLeft, Edit, Printer,
  DollarSign, FileText, Users, HeartPulse, AlertTriangle, Info, School,
  CheckCircle, XCircle, Clock, TrendingUp, CircleDollarSign,
  ClipboardList, Eye, Shield, Baby, ArrowLeft,
} from 'lucide-react';

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';

// ── Types ──
interface StudentData {
  student_id: number; student_code: string; name: string; first_name: string;
  middle_name: string; last_name: string; sex: string; birthday: string | null;
  blood_group: string; nationality: string; religion: string; address: string;
  email: string; phone: string; student_phone: string; emergency_contact: string;
  ghana_card_id: string; place_of_birth: string; hometown: string; tribe: string;
  admission_date: string | null; username: string; active_status: number;
  special_needs: string; class_reached: string; allergies: string;
  medical_conditions: string; nhis_number: string; nhis_status: string;
  disability_status: number; special_diet: number;
  student_special_diet_details: string; former_school: string; parent_id: number | null;
}
interface ParentData {
  parent_id: number; name: string; guardian_gender: string; guardian_is_the: string;
  email: string; phone: string; address: string; profession: string; designation: string;
  father_name: string; father_phone: string; mother_name: string; mother_phone: string;
  active_status: number;
}
interface EnrollData {
  enroll_id: number; class_id: number; section_id: number; year: string;
  term: string; roll: string; mute: number; residence_type: string;
  class_name: string; class_numeric: number; class_category: string; section_name: string;
}
interface SubjectData { subject_id: number; name: string; teacher_name: string }
interface ExamData {
  exam_id: number; exam_name: string; year: string; term: string; date: string | null;
  class_name: string; class_numeric: number; section_name: string;
  subjects: { subject_id: number; subject_name: string; mark_obtained: number; comment: string }[];
}
interface GradeData { grade_id: number; name: string; comment: string; grade_from: number; grade_to: number }
interface InvoiceData {
  invoice_id: number; invoice_code: string; title: string; description: string;
  amount: number; amount_paid: number; due: number; discount: number;
  creation_timestamp: string | null; payment_timestamp: string | null;
  status: string; year: string; term: string; class_name: string; can_delete: string;
}
interface PaymentData {
  receipt_code: string; timestamp: string | null; payment_method: string;
  total_amount: number; year: string; term: string;
}
interface ProfileResponse {
  student: StudentData;
  parent: ParentData | null;
  enrolls: EnrollData[];
  currentEnroll: EnrollData | null;
  status: string;
  statusColor: string;
  otherStudents: { student_id: number; name: string; student_code: string }[];
  subjects: SubjectData[];
  exams: ExamData[];
  grades: GradeData[];
  terminalReports: {
    report_id: number; year: string; term: string; total_score: number;
    grade: string; rank: number; position: string;
    class: { name: string; name_numeric: number } | null;
  }[];
  attendance: {
    total: number; present: number; absent: number; late: number; rate: number;
    records: { attendance_id: number; date: string; status: string; year: string; term: string }[];
    monthly: { month: string; monthLabel: string; present: number; absent: number; total: number }[];
  };
  invoices: {
    all: InvoiceData[]; receivables: InvoiceData[]; payables: InvoiceData[];
    summary: { totalFees: number; totalPaid: number; totalOutstanding: number };
  };
  payments: PaymentData[];
}

// ── Helpers ──
function formatDate(d: string | null): string {
  if (!d) return 'N/A';
  try { return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); } catch { return 'N/A'; }
}
function formatDateTime(d: string | null): string {
  if (!d) return 'N/A';
  try { return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }); } catch { return 'N/A'; }
}
function getInitials(name: string): string {
  if (!name) return 'S';
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}
const currency = 'GHS';
function fmtCurrency(n: number): string {
  return `${currency} ${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
function getGrade(mark: number, grades: GradeData[]): { name: string; comment: string } {
  for (const g of grades) {
    if (mark >= g.grade_from && mark <= g.grade_to) return { name: g.name, comment: g.comment };
  }
  return { name: 'N/A', comment: '' };
}
function getInvoiceStatus(inv: InvoiceData): { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; color: string } {
  if (inv.due <= 0) return { label: 'Paid', variant: 'default', color: 'bg-green-100 text-green-800' };
  if (inv.amount_paid > 0 && inv.due > 0) return { label: 'Partial', variant: 'secondary', color: 'bg-amber-100 text-amber-800' };
  return { label: 'Unpaid', variant: 'destructive', color: 'bg-red-100 text-red-800' };
}

// ── Info Card ──
function InfoCard({ icon: Icon, iconBg, label, value }: {
  icon: React.ElementType; iconBg: string; label: string; value: string | number;
}) {
  return (
    <div className="bg-slate-50 p-4 rounded-xl hover:bg-slate-100 transition-colors">
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-7 h-7 rounded-lg ${iconBg} flex items-center justify-center`}>
          <Icon className="h-3.5 w-3.5 text-white" />
        </div>
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{label}</p>
      </div>
      <p className="text-sm font-bold text-slate-800 ml-9 break-words">{value || 'N/A'}</p>
    </div>
  );
}

// ── Stat Card ──
function StatCard({ label, value, sub, icon: Icon, color }: {
  label: string; value: string; sub?: string; icon: React.ElementType; color: string;
}) {
  return (
    <div className="bg-white rounded-xl p-4 border shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</p>
        <div className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center`}>
          <Icon className="h-4 w-4 text-white" />
        </div>
      </div>
      <p className="text-lg font-bold text-slate-900">{value}</p>
      {sub && <p className="text-[10px] text-slate-400 mt-1">{sub}</p>}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
export default function EnhancedStudentProfile() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const studentId = params.id as string;

  const [data, setData] = useState<ProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/students/${studentId}/profile`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to load student profile');
      }
      const json = await res.json();
      setData(json);
      const tab = searchParams.get('tab');
      if (tab && ['overview', 'academic', 'financial', 'attendance', 'documents'].includes(tab)) {
        setActiveTab(tab);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load student profile');
    } finally {
      setLoading(false);
    }
  }, [studentId, searchParams]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const handleSwitchStudent = (newId: string) => { router.push(`/admin/students/${newId}/profile`); };

  // ── Loading ──
  if (loading) {
    return (
      <DashboardShell>
        {/* Gradient header skeleton */}
        <div className="h-48 md:h-56 bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 rounded-2xl mb-6">
          <div className="p-6 flex flex-col md:flex-row md:items-end gap-4">
            <Skeleton className="w-24 h-24 rounded-full border-4 border-white/30" />
            <div className="space-y-3">
              <Skeleton className="h-8 w-64 bg-white/20" />
              <Skeleton className="h-4 w-40 bg-white/15" />
              <Skeleton className="h-6 w-24 bg-white/15 rounded-full" />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
        <Skeleton className="h-12 w-full mb-6 rounded-xl" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </DashboardShell>
    );
  }

  // ── Error ──
  if (error || !data) {
    return (
      <DashboardShell>
        <Card className="max-w-lg mx-auto p-12 text-center">
          <XCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-800 mb-2">Error Loading Profile</h2>
          <p className="text-slate-500 mb-6">{error || 'Student not found'}</p>
          <Button asChild variant="outline">
            <Link href="/admin/students/lists"><ArrowLeft className="h-4 w-4 mr-2" />Back to Students</Link>
          </Button>
        </Card>
      </DashboardShell>
    );
  }

  const { student, parent, currentEnroll, status, statusColor, otherStudents, subjects,
    exams, grades, terminalReports, attendance, invoices, payments } = data;

  // ── Render ──
  return (
    <DashboardShell>
      {/* ── Back nav + student switcher ── */}
      <div className="flex items-center justify-between mb-4">
        <Button asChild variant="ghost" size="sm" className="text-slate-500 hover:text-slate-800 -ml-2">
          <Link href="/admin/students/lists"><ChevronLeft className="h-4 w-4 mr-1" />Back</Link>
        </Button>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 hidden sm:block">Switch:</span>
          <Select value={studentId} onValueChange={handleSwitchStudent}>
            <SelectTrigger className="w-44 h-8 text-xs"><SelectValue placeholder="Select student" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={studentId}>{student.name} (Current)</SelectItem>
              {otherStudents.map(s => <SelectItem key={s.student_id} value={String(s.student_id)}>{s.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── Gradient Profile Header ── */}
      <div className="relative h-48 md:h-56 bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 rounded-2xl mb-6 overflow-hidden shadow-lg">
        {/* Decorative circles */}
        <div className="absolute -top-16 -right-16 w-64 h-64 bg-white/5 rounded-full" />
        <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-white/5 rounded-full" />

        <div className="relative z-10 p-6 flex flex-col md:flex-row md:items-end gap-4 h-full">
          {/* Avatar */}
          <Avatar className="w-24 h-24 md:w-28 md:h-28 border-4 border-white/30 shadow-xl flex-shrink-0">
            <AvatarFallback className="bg-white/20 backdrop-blur-sm text-white text-3xl font-bold">
              {getInitials(student.name)}
            </AvatarFallback>
          </Avatar>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl md:text-3xl font-bold text-white truncate">{student.name}</h1>
              <span className={`${statusColor} text-white text-[10px] font-bold px-3 py-1 rounded-full`}>{status}</span>
            </div>
            <p className="text-blue-200 text-sm mb-1">ID: {student.student_code}</p>
            {currentEnroll && (
              <Link
                href={`/admin/students/lists?classId=${currentEnroll.class_id}`}
                className="text-white/90 hover:text-white font-medium text-sm inline-flex items-center gap-1.5"
              >
                <GraduationCap className="h-4 w-4" />
                {currentEnroll.class_name} {currentEnroll.class_numeric} &middot; Section {currentEnroll.section_name}
              </Link>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2 flex-shrink-0">
            <Button size="sm" variant="secondary" className="bg-white/15 hover:bg-white/25 text-white border-0 backdrop-blur-sm" asChild>
              <Link href={`/admin/students/${studentId}`}><Edit className="h-4 w-4 mr-1.5" />Edit</Link>
            </Button>
            <Button size="sm" variant="secondary" className="bg-white/15 hover:bg-white/25 text-white border-0 backdrop-blur-sm">
              <Printer className="h-4 w-4 mr-1.5" />Print
            </Button>
          </div>
        </div>
      </div>

      {/* ── Quick stat cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Attendance" value={`${attendance.rate}%`} sub={`${attendance.present} present / ${attendance.total} total`} icon={CheckCircle} color="bg-green-500" />
        <StatCard label="Total Fees" value={fmtCurrency(invoices.summary.totalFees)} sub="All invoices" icon={CircleDollarSign} color="bg-blue-500" />
        <StatCard label="Total Paid" value={fmtCurrency(invoices.summary.totalPaid)} sub={`${payments.length} payments`} icon={DollarSign} color="bg-emerald-500" />
        <StatCard label="Outstanding" value={fmtCurrency(invoices.summary.totalOutstanding)} sub={`${invoices.receivables.length} invoices`} icon={AlertTriangle} color="bg-red-500" />
      </div>

      {/* ── Tabs ── */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <Card className="mb-6 shadow-sm">
          <CardContent className="p-2">
            <ScrollArea className="w-full">
              <TabsList className="w-full justify-start bg-transparent h-auto p-1 gap-1 flex-wrap">
                {[
                  { value: 'overview', icon: Home, label: 'Overview' },
                  { value: 'academic', icon: GraduationCap, label: 'Academic' },
                  { value: 'financial', icon: DollarSign, label: 'Financial' },
                  { value: 'attendance', icon: CheckCircle, label: 'Attendance' },
                  { value: 'documents', icon: FileText, label: 'Documents' },
                ].map(t => (
                  <TabsTrigger
                    key={t.value}
                    value={t.value}
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white px-4 py-2 rounded-lg text-sm font-semibold"
                  >
                    <t.icon className="h-4 w-4 mr-1.5" />{t.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* ════════════════ OVERVIEW TAB ════════════════ */}
        <TabsContent value="overview" className="space-y-6 mt-0">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Personal info */}
            <Card className="lg:col-span-2 p-5">
              <CardHeader className="p-0 pb-4">
                <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center"><User className="h-4 w-4 text-blue-600" /></div>
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  <InfoCard icon={User} iconBg="bg-blue-500" label="Full Name" value={student.name} />
                  <InfoCard icon={Calendar} iconBg="bg-orange-500" label="Date of Birth" value={formatDate(student.birthday)} />
                  <InfoCard icon={User} iconBg="bg-purple-500" label="Gender" value={student.sex ? student.sex.charAt(0).toUpperCase() + student.sex.slice(1) : 'N/A'} />
                  <InfoCard icon={Droplets} iconBg="bg-red-500" label="Blood Group" value={student.blood_group} />
                  <InfoCard icon={Flag} iconBg="bg-green-500" label="Nationality" value={student.nationality} />
                  <InfoCard icon={CreditCard} iconBg="bg-indigo-500" label="Ghana Card ID" value={student.ghana_card_id} />
                  <InfoCard icon={Baby} iconBg="bg-pink-500" label="Place of Birth" value={student.place_of_birth} />
                  <InfoCard icon={Home} iconBg="bg-teal-500" label="Hometown" value={student.hometown} />
                  <InfoCard icon={Calendar} iconBg="bg-cyan-500" label="Admission Date" value={formatDate(student.admission_date)} />
                  <InfoCard icon={Mail} iconBg="bg-red-500" label="Email" value={student.email} />
                  <InfoCard icon={Phone} iconBg="bg-green-500" label="Phone" value={student.phone} />
                  <InfoCard icon={Phone} iconBg="bg-blue-500" label="Student Phone" value={student.student_phone} />
                  <InfoCard icon={AlertTriangle} iconBg="bg-orange-500" label="Emergency Contact" value={student.emergency_contact} />
                  <div className="sm:col-span-2 md:col-span-3 bg-slate-50 p-4 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-7 h-7 rounded-lg bg-purple-500 flex items-center justify-center"><MapPin className="h-3.5 w-3.5 text-white" /></div>
                      <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Address</p>
                    </div>
                    <p className="text-sm font-bold text-slate-800 ml-9 break-words">{student.address || 'N/A'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Parent info card */}
            <div className="space-y-6">
              <Card className="p-5 border-l-4 border-l-indigo-500">
                <CardHeader className="p-0 pb-3">
                  <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <div className="w-9 h-9 rounded-lg bg-indigo-100 flex items-center justify-center"><Users className="h-4 w-4 text-indigo-600" /></div>
                    Parent / Guardian
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 space-y-3">
                  {!parent ? (
                    <div className="text-center py-8">
                      <Users className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                      <p className="text-sm text-slate-400">No parent information</p>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-3">
                        <Avatar className="w-12 h-12"><AvatarFallback className="bg-indigo-100 text-indigo-700 font-bold">{getInitials(parent.name)}</AvatarFallback></Avatar>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-800 truncate">{parent.name}</p>
                          <Badge variant="outline" className="text-[10px]">{parent.guardian_gender || 'Guardian'}</Badge>
                        </div>
                      </div>
                      <Separator />
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-slate-600"><Phone className="h-3.5 w-3.5 text-slate-400" />{parent.phone || 'N/A'}</div>
                        <div className="flex items-center gap-2 text-slate-600"><Mail className="h-3.5 w-3.5 text-slate-400" /><span className="truncate">{parent.email || 'N/A'}</span></div>
                        <div className="flex items-center gap-2 text-slate-600"><Briefcase className="h-3.5 w-3.5 text-slate-400" />{parent.profession || 'N/A'}</div>
                      </div>
                      {(parent.father_name || parent.mother_name) && (
                        <>
                          <Separator />
                          {parent.father_name && (
                            <div className="text-xs"><span className="text-slate-400">Father:</span> <span className="font-medium">{parent.father_name}</span>{parent.father_phone && <span className="text-slate-400 ml-1">({parent.father_phone})</span>}</div>
                          )}
                          {parent.mother_name && (
                            <div className="text-xs"><span className="text-slate-400">Mother:</span> <span className="font-medium">{parent.mother_name}</span>{parent.mother_phone && <span className="text-slate-400 ml-1">({parent.mother_phone})</span>}</div>
                          )}
                        </>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Medical info */}
              {(student.medical_conditions || student.allergies || student.nhis_number) && (
                <Card className="p-5 border-l-4 border-l-red-500">
                  <CardHeader className="p-0 pb-3">
                    <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                      <div className="w-9 h-9 rounded-lg bg-red-100 flex items-center justify-center"><HeartPulse className="h-4 w-4 text-red-600" /></div>
                      Medical
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0 space-y-2">
                    {student.nhis_number && (
                      <div className="text-xs"><span className="text-slate-400">NHIS:</span> <span className="font-medium">{student.nhis_number}</span>
                        <Badge className={`ml-1 text-[9px] ${student.nhis_status === 'active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{student.nhis_status}</Badge>
                      </div>
                    )}
                    {student.blood_group && (
                      <div className="text-xs"><span className="text-slate-400">Blood Group:</span> <span className="font-bold text-red-600">{student.blood_group}</span></div>
                    )}
                    {student.allergies && (
                      <div className="text-xs bg-yellow-50 p-2 rounded-lg"><span className="text-slate-500">Allergies:</span> {student.allergies}</div>
                    )}
                    {student.medical_conditions && (
                      <div className="text-xs bg-orange-50 p-2 rounded-lg"><span className="text-slate-500">Conditions:</span> {student.medical_conditions}</div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        {/* ════════════════ ACADEMIC TAB ════════════════ */}
        <TabsContent value="academic" className="space-y-6 mt-0">
          {/* Current enrollment + subjects */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="p-5">
              <CardHeader className="p-0 pb-3">
                <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <div className="w-9 h-9 rounded-lg bg-purple-100 flex items-center justify-center"><School className="h-4 w-4 text-purple-600" /></div>
                  Current Enrollment
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 space-y-2">
                {currentEnroll ? (
                  <>
                    <InfoCard icon={BookOpen} iconBg="bg-blue-500" label="Class" value={`${currentEnroll.class_name} ${currentEnroll.class_numeric}`} />
                    <InfoCard icon={BookOpen} iconBg="bg-green-500" label="Section" value={currentEnroll.section_name} />
                    <InfoCard icon={Calendar} iconBg="bg-indigo-500" label="Year / Term" value={`${currentEnroll.year} · T${currentEnroll.term}`} />
                    <InfoCard icon={Home} iconBg="bg-orange-500" label="Residence" value={currentEnroll.residence_type || 'N/A'} />
                    <InfoCard icon={ClipboardList} iconBg="bg-purple-500" label="Roll" value={currentEnroll.roll || 'N/A'} />
                  </>
                ) : (
                  <p className="text-sm text-slate-400 py-4 text-center">No active enrollment</p>
                )}
              </CardContent>
            </Card>

            {/* Subjects */}
            <Card className="lg:col-span-2 p-5">
              <CardHeader className="p-0 pb-3">
                <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center"><BookOpen className="h-4 w-4 text-blue-600" /></div>
                  Enrolled Subjects
                  <Badge variant="secondary" className="ml-auto">{subjects.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {subjects.length === 0 ? (
                  <p className="text-sm text-slate-400 py-8 text-center">No subjects found</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-80 overflow-y-auto">
                    {subjects.map(s => (
                      <div key={s.subject_id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <BookOpen className="h-3.5 w-3.5 text-blue-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-800 truncate">{s.name}</p>
                          <p className="text-[10px] text-slate-400">{s.teacher_name}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Marks summary */}
          {exams.length > 0 && (
            <Card className="p-5">
              <CardHeader className="p-0 pb-3">
                <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center"><GraduationCap className="h-4 w-4 text-emerald-600" /></div>
                  Exam Results
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="max-h-[500px]">
                  <div className="space-y-4">
                    {exams.map(exam => {
                      const total = exam.subjects.reduce((s, sub) => s + sub.mark_obtained, 0);
                      const avg = exam.subjects.length > 0 ? (total / exam.subjects.length).toFixed(1) : '0';
                      const bestGrade = getGrade(total / exam.subjects.length, grades);
                      return (
                        <div key={exam.exam_id} className="bg-slate-50 rounded-xl p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <h4 className="font-bold text-slate-800 text-sm">{exam.exam_name}</h4>
                              <p className="text-[10px] text-slate-400">{exam.class_name} {exam.class_numeric} · {exam.year} T{exam.term}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold text-slate-800">{avg}</p>
                              <Badge variant="default" className="text-[10px]">{bestGrade.name}</Badge>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                            {exam.subjects.map(sub => {
                              const g = getGrade(sub.mark_obtained, grades);
                              return (
                                <div key={sub.subject_id} className="bg-white rounded-lg p-2 border">
                                  <p className="text-[10px] text-slate-400 truncate">{sub.subject_name}</p>
                                  <p className="text-sm font-bold text-slate-800">{sub.mark_obtained}</p>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}

          {/* Terminal reports */}
          {terminalReports.length > 0 && (
            <Card className="p-5">
              <CardHeader className="p-0 pb-3">
                <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center"><FileText className="h-4 w-4 text-emerald-600" /></div>
                  Terminal Reports
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-slate-50">
                        <th className="px-4 py-3 text-left font-semibold text-slate-600">Year</th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-600">Term</th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-600">Class</th>
                        <th className="px-4 py-3 text-right font-semibold text-slate-600">Score</th>
                        <th className="px-4 py-3 text-center font-semibold text-slate-600">Grade</th>
                        <th className="px-4 py-3 text-center font-semibold text-slate-600">Position</th>
                      </tr>
                    </thead>
                    <tbody>
                      {terminalReports.map(r => (
                        <tr key={r.report_id} className="border-b hover:bg-slate-50">
                          <td className="px-4 py-3">{r.year}</td>
                          <td className="px-4 py-3">Term {r.term}</td>
                          <td className="px-4 py-3">{r.class ? `${r.class.name} ${r.class.name_numeric}` : 'N/A'}</td>
                          <td className="px-4 py-3 text-right font-semibold">{r.total_score}</td>
                          <td className="px-4 py-3 text-center"><Badge variant={r.grade ? 'default' : 'outline'}>{r.grade || 'N/A'}</Badge></td>
                          <td className="px-4 py-3 text-center font-semibold">{r.position || r.rank || 'N/A'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ════════════════ FINANCIAL TAB ════════════════ */}
        <TabsContent value="financial" className="space-y-6 mt-0">
          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="p-5 border-l-4 border-l-blue-500">
              <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Total Fees</p>
              <p className="text-2xl font-bold text-blue-700 mt-1">{fmtCurrency(invoices.summary.totalFees)}</p>
            </Card>
            <Card className="p-5 border-l-4 border-l-emerald-500">
              <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Total Paid</p>
              <p className="text-2xl font-bold text-emerald-700 mt-1">{fmtCurrency(invoices.summary.totalPaid)}</p>
            </Card>
            <Card className="p-5 border-l-4 border-l-red-500">
              <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Outstanding</p>
              <p className="text-2xl font-bold text-red-600 mt-1">{fmtCurrency(invoices.summary.totalOutstanding)}</p>
            </Card>
          </div>

          {/* Invoice table */}
          <Card className="p-5">
            <CardHeader className="p-0 pb-3">
              <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center"><FileText className="h-4 w-4 text-blue-600" /></div>
                Invoice List
                <Badge variant="secondary" className="ml-auto">{invoices.all.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {invoices.all.length === 0 ? (
                <p className="text-sm text-slate-400 py-8 text-center">No invoices found</p>
              ) : (
                <>
                  {/* Desktop table */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-slate-50">
                          <th className="px-4 py-3 text-left font-semibold text-slate-600">Invoice</th>
                          <th className="px-4 py-3 text-left font-semibold text-slate-600">Title</th>
                          <th className="px-4 py-3 text-right font-semibold text-slate-600">Amount</th>
                          <th className="px-4 py-3 text-right font-semibold text-slate-600">Paid</th>
                          <th className="px-4 py-3 text-right font-semibold text-slate-600">Due</th>
                          <th className="px-4 py-3 text-center font-semibold text-slate-600">Status</th>
                          <th className="px-4 py-3 text-right font-semibold text-slate-600">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {invoices.all.map(inv => {
                          const st = getInvoiceStatus(inv);
                          return (
                            <tr key={inv.invoice_id} className="border-b hover:bg-slate-50">
                              <td className="px-4 py-3 font-mono text-xs">{inv.invoice_code}</td>
                              <td className="px-4 py-3">{inv.title}</td>
                              <td className="px-4 py-3 text-right font-semibold">{fmtCurrency(inv.amount)}</td>
                              <td className="px-4 py-3 text-right text-emerald-600">{fmtCurrency(inv.amount_paid)}</td>
                              <td className="px-4 py-3 text-right font-semibold">{fmtCurrency(inv.due)}</td>
                              <td className="px-4 py-3 text-center"><span className={`text-[10px] font-bold px-2 py-1 rounded-full ${st.color}`}>{st.label}</span></td>
                              <td className="px-4 py-3 text-right text-slate-400 text-xs">{formatDate(inv.creation_timestamp)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  {/* Mobile cards */}
                  <div className="md:hidden space-y-3 max-h-96 overflow-y-auto">
                    {invoices.all.map(inv => {
                      const st = getInvoiceStatus(inv);
                      return (
                        <div key={inv.invoice_id} className="bg-slate-50 rounded-xl p-4">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-xs font-semibold text-slate-800 truncate">{inv.title}</p>
                            <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${st.color}`}>{st.label}</span>
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-xs">
                            <div><span className="text-slate-400">Amount</span><p className="font-bold">{fmtCurrency(inv.amount)}</p></div>
                            <div><span className="text-slate-400">Paid</span><p className="font-bold text-emerald-600">{fmtCurrency(inv.amount_paid)}</p></div>
                            <div><span className="text-slate-400">Due</span><p className="font-bold">{fmtCurrency(inv.due)}</p></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Payment history */}
          <Card className="p-5">
            <CardHeader className="p-0 pb-3">
              <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center"><DollarSign className="h-4 w-4 text-emerald-600" /></div>
                Payment History
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {payments.length === 0 ? (
                <p className="text-sm text-slate-400 py-8 text-center">No payments found</p>
              ) : (
                <ScrollArea className="max-h-80">
                  <div className="space-y-2">
                    {payments.map(p => (
                      <div key={p.receipt_code} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition">
                        <div className="min-w-0">
                          <p className="text-xs font-mono font-semibold">{p.receipt_code}</p>
                          <p className="text-[10px] text-slate-400">{formatDateTime(p.timestamp)} · {(p.payment_method || 'N/A').replace(/_/g, ' ')}</p>
                        </div>
                        <span className="font-bold text-sm text-emerald-600 flex-shrink-0 ml-2">{fmtCurrency(p.total_amount)}</span>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ════════════════ ATTENDANCE TAB ════════════════ */}
        <TabsContent value="attendance" className="space-y-6 mt-0">
          {/* Summary stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-4 text-center">
              <p className="text-3xl font-bold text-green-600">{attendance.present}</p>
              <p className="text-xs text-slate-400 mt-1">Days Present</p>
            </Card>
            <Card className="p-4 text-center">
              <p className="text-3xl font-bold text-red-600">{attendance.absent}</p>
              <p className="text-xs text-slate-400 mt-1">Days Absent</p>
            </Card>
            <Card className="p-4 text-center">
              <p className="text-3xl font-bold text-amber-600">{attendance.late}</p>
              <p className="text-xs text-slate-400 mt-1">Late Arrivals</p>
            </Card>
            <Card className="p-4 text-center">
              <p className="text-3xl font-bold text-blue-600">{attendance.rate}%</p>
              <p className="text-xs text-slate-400 mt-1">Attendance Rate</p>
              <Progress value={attendance.rate} className="mt-2 h-2" />
            </Card>
          </div>

          {/* Monthly chart */}
          {attendance.monthly.length > 0 && (
            <Card className="p-5">
              <CardHeader className="p-0 pb-3">
                <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center"><TrendingUp className="h-4 w-4 text-blue-600" /></div>
                  Monthly Attendance (Last 6 Months)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={attendance.monthly} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="monthLabel" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                        formatter={(value: number, name: string) => [value, name === 'present' ? 'Present' : 'Absent']}
                      />
                      <Bar dataKey="present" fill="#10b981" radius={[4, 4, 0, 0]} name="present" />
                      <Bar dataKey="absent" fill="#ef4444" radius={[4, 4, 0, 0]} name="absent" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent attendance records */}
          <Card className="p-5">
            <CardHeader className="p-0 pb-3">
              <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center"><Clock className="h-4 w-4 text-slate-600" /></div>
                Recent Attendance
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {attendance.records.length === 0 ? (
                <p className="text-sm text-slate-400 py-8 text-center">No attendance records found</p>
              ) : (
                <ScrollArea className="max-h-80">
                  <div className="space-y-1.5">
                    {attendance.records.slice(0, 60).map(r => {
                      const isPresent = r.status === 'present' || r.status === '1';
                      const isLate = r.status === 'late';
                      return (
                        <div key={r.attendance_id} className="flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 transition">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isPresent ? 'bg-green-100' : isLate ? 'bg-amber-100' : 'bg-red-100'}`}>
                              {isPresent ? <CheckCircle className="h-4 w-4 text-green-600" /> : isLate ? <Clock className="h-4 w-4 text-amber-600" /> : <XCircle className="h-4 w-4 text-red-600" />}
                            </div>
                            <div>
                              <p className="text-xs font-medium">{r.date || 'N/A'}</p>
                              <p className="text-[10px] text-slate-400">{r.year} T{r.term}</p>
                            </div>
                          </div>
                          <Badge variant="outline" className={`text-[10px] ${isPresent ? 'border-green-200 text-green-700' : isLate ? 'border-amber-200 text-amber-700' : 'border-red-200 text-red-700'}`}>
                            {isPresent ? 'Present' : isLate ? 'Late' : 'Absent'}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ════════════════ DOCUMENTS TAB ════════════════ */}
        <TabsContent value="documents" className="space-y-6 mt-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Report cards */}
            <Card className="p-5 hover:shadow-md transition-shadow cursor-pointer group">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <FileText className="h-6 w-6 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">Report Cards</h3>
                  <p className="text-xs text-slate-400">{terminalReports.length} available</p>
                </div>
              </div>
              {terminalReports.length > 0 ? (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {terminalReports.map(r => (
                    <div key={r.report_id} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg text-xs">
                      <span>{r.year} Term {r.term}</span>
                      <Badge variant="outline" className="text-[10px]">{r.grade || 'N/A'}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 text-center py-4">No report cards</p>
              )}
            </Card>

            {/* Certificates */}
            <Card className="p-5 hover:shadow-md transition-shadow cursor-pointer group">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Shield className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">Certificates</h3>
                  <p className="text-xs text-slate-400">Academic achievements</p>
                </div>
              </div>
              <p className="text-xs text-slate-400 text-center py-4">No certificates uploaded yet</p>
            </Card>

            {/* ID Card */}
            <Card className="p-5 hover:shadow-md transition-shadow cursor-pointer group">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <CreditCard className="h-6 w-6 text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">Student ID Card</h3>
                  <p className="text-xs text-slate-400">Identity card</p>
                </div>
              </div>
              <div className="bg-gradient-to-br from-indigo-50 to-violet-50 rounded-xl p-4 text-center">
                <Avatar className="w-16 h-16 mx-auto mb-2">
                  <AvatarFallback className="bg-indigo-100 text-indigo-700 font-bold">{getInitials(student.name)}</AvatarFallback>
                </Avatar>
                <p className="font-bold text-sm text-slate-800">{student.name}</p>
                <p className="text-[10px] text-slate-400">{student.student_code}</p>
                <Button size="sm" variant="outline" className="mt-3 text-xs">
                  <Eye className="h-3 w-3 mr-1" />View ID Card
                </Button>
              </div>
            </Card>
          </div>

          {/* Enrollment history */}
          {data.enrolls.length > 0 && (
            <Card className="p-5">
              <CardHeader className="p-0 pb-3">
                <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center"><Clock className="h-4 w-4 text-slate-600" /></div>
                  Enrollment History
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="space-y-2">
                  {data.enrolls.map(e => (
                    <div key={e.enroll_id} className={`flex items-center justify-between p-3 rounded-lg text-sm ${e.mute === 0 ? 'bg-green-50 border border-green-100' : 'bg-slate-50'}`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${e.mute === 0 ? 'bg-green-100' : 'bg-slate-200'}`}>
                          <School className={`h-4 w-4 ${e.mute === 0 ? 'text-green-600' : 'text-slate-400'}`} />
                        </div>
                        <div>
                          <p className="font-semibold">{e.class_name} {e.class_numeric}</p>
                          <p className="text-[10px] text-slate-400">Section {e.section_name} · Roll {e.roll || 'N/A'}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-medium">{e.year} T{e.term}</p>
                        <Badge variant={e.mute === 0 ? 'default' : 'outline'} className="text-[10px]">{e.mute === 0 ? 'Active' : 'Inactive'}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </DashboardShell>
  );
}

// ── Briefcase icon (used for parent occupation) ──
function Briefcase({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect width="20" height="14" x="2" y="7" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  );
}

// ── Dashboard Shell wrapper ──
function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="p-4 md:p-6 max-w-[1400px] mx-auto">
        {children}
      </div>
    </div>
  );
}
