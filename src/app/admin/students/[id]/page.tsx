'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';

// shadcn/ui components
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';

// Lucide icons
import {
  User, Mail, Phone, MapPin, Calendar, Droplets, Flag, CreditCard,
  BookOpen, Home, GraduationCap, Heart, Key, Lock, UserCheck,
  AlertTriangle, Shield, Baby, Briefcase, Clock, ChevronLeft,
  Edit, Trash2, Download, Eye, DollarSign, TrendingUp, TrendingDown,
  FileText, Info, CheckCircle, XCircle, Activity, Users, HeartPulse,
  School, ClipboardList, CircleDollarSign, Receipt, ArrowLeft,
} from 'lucide-react';

// Types
interface StudentData {
  student_id: number;
  student_code: string;
  name: string;
  first_name: string;
  middle_name: string;
  last_name: string;
  sex: string;
  birthday: string | null;
  blood_group: string;
  nationality: string;
  religion: string;
  address: string;
  email: string;
  phone: string;
  student_phone: string;
  emergency_contact: string;
  ghana_card_id: string;
  place_of_birth: string;
  hometown: string;
  tribe: string;
  admission_date: string | null;
  username: string;
  authentication_key: string;
  active_status: number;
  special_needs: string;
  class_reached: string;
  allergies: string;
  medical_conditions: string;
  nhis_number: string;
  nhis_status: string;
  disability_status: number;
  special_diet: number;
  student_special_diet_details: string;
  former_school: string;
  parent_id: number | null;
}

interface ParentData {
  parent_id: number;
  name: string;
  guardian_gender: string;
  email: string;
  phone: string;
  address: string;
  profession: string;
  father_name: string;
  father_phone: string;
  mother_name: string;
  mother_phone: string;
  authentication_key: string;
  active_status: number;
}

interface EnrollData {
  enroll_id: number;
  class_id: number;
  section_id: number;
  year: string;
  term: string;
  roll: string;
  mute: number;
  residence_type: string;
  class_name: string;
  class_numeric: number;
  class_category: string;
  section_name: string;
}

interface ExamData {
  exam_id: number;
  exam_name: string;
  year: string;
  term: string;
  date: string | null;
  class_id: number;
  class_name: string;
  class_numeric: number;
  section_name: string;
  subjects: {
    subject_id: number;
    subject_name: string;
    mark_obtained: number;
    comment: string;
  }[];
}

interface GradeData {
  grade_id: number;
  name: string;
  comment: string;
  grade_from: number;
  grade_to: number;
}

interface InvoiceData {
  invoice_id: number;
  invoice_code: string;
  title: string;
  amount: number;
  amount_paid: number;
  due: number;
  discount: number;
  creation_timestamp: string | null;
  payment_timestamp: string | null;
  status: string;
  year: string;
  term: string;
  can_delete: string;
}

interface PaymentData {
  receipt_code: string;
  timestamp: string | null;
  payment_method: string;
  total_amount: number;
  year: string;
  term: string;
}

interface ProfileResponse {
  student: StudentData;
  parent: ParentData | null;
  enrolls: EnrollData[];
  currentEnroll: EnrollData | null;
  status: string;
  statusColor: string;
  otherStudents: { student_id: number; name: string; student_code: string }[];
  exams: ExamData[];
  grades: GradeData[];
  invoices: {
    receivables: InvoiceData[];
    payables: InvoiceData[];
  };
  payments: PaymentData[];
  terminalReports: {
    report_id: number;
    year: string;
    term: string;
    total_score: number;
    grade: string;
    rank: number;
    position: string;
    class: { name: string; name_numeric: number } | null;
  }[];
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'N/A';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return 'N/A';
  }
}

function formatDateTime(dateStr: string | null): string {
  if (!dateStr) return 'N/A';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return 'N/A';
  }
}

function getGrade(mark: number, grades: GradeData[]): { name: string; comment: string } {
  for (const g of grades) {
    if (mark >= g.grade_from && mark <= g.grade_to) {
      return { name: g.name, comment: g.comment };
    }
  }
  return { name: 'N/A', comment: '' };
}

function getInitials(name: string): string {
  if (!name) return 'S';
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

const currency = 'GHS';

function formatCurrency(amount: number): string {
  return `${currency} ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Info card component for the profile tabs
function InfoCard({ icon: Icon, iconColor, label, value, className = '' }: {
  icon: React.ElementType;
  iconColor: string;
  label: string;
  value: string | number;
  className?: string;
}) {
  return (
    <div className={`bg-gray-50 p-4 rounded-lg hover:bg-gray-100 transition ${className}`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`h-5 w-5 text-${iconColor}-600`} />
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</p>
      </div>
      <p className="text-lg font-bold text-gray-800 ml-7 break-words">{value || 'N/A'}</p>
    </div>
  );
}

// Gradient info card (parent tab)
function GradientInfoCard({ icon: Icon, bgColor, label, value }: {
  icon: React.ElementType;
  bgColor: string;
  label: string;
  value: string;
}) {
  return (
    <div className={`bg-gradient-to-br ${bgColor} p-4 rounded-xl`}>
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${bgColor.replace('50', '500').replace('100', '600')} flex items-center justify-center`}>
          <Icon className="h-4 w-4 text-white" />
        </div>
        <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">{label}</p>
      </div>
      <p className="text-base font-bold text-gray-800 ml-10 break-words">{value || 'N/A'}</p>
    </div>
  );
}

export default function StudentProfilePage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const studentId = params.id as string;

  const [data, setData] = useState<ProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('basic_info');

  // Edit dialog
  const [editOpen, setEditOpen] = useState(false);
  const [editData, setEditData] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // Delete dialog
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/students/${studentId}`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to load student profile');
      }
      const json = await res.json();
      setData(json);

      // Check for tab query param
      const tab = searchParams.get('tab');
      if (tab && ['basic_info', 'parent_info', 'exam_marks', 'login', 'accounts'].includes(tab)) {
        setActiveTab(tab);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load student profile');
    } finally {
      setLoading(false);
    }
  }, [studentId, searchParams]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleSwitchStudent = (newStudentId: string) => {
    router.push(`/admin/students/${newStudentId}`);
  };

  const handleOpenEdit = () => {
    if (!data) return;
    setEditData({
      first_name: data.student.first_name || '',
      middle_name: data.student.middle_name || '',
      last_name: data.student.last_name || '',
      sex: data.student.sex || '',
      birthday: data.student.birthday ? data.student.birthday.split('T')[0] : '',
      blood_group: data.student.blood_group || '',
      nationality: data.student.nationality || '',
      religion: data.student.religion || '',
      address: data.student.address || '',
      email: data.student.email || '',
      phone: data.student.phone || '',
      student_phone: data.student.student_phone || '',
      emergency_contact: data.student.emergency_contact || '',
      ghana_card_id: data.student.ghana_card_id || '',
      place_of_birth: data.student.place_of_birth || '',
      hometown: data.student.hometown || '',
      tribe: data.student.tribe || '',
      admission_date: data.student.admission_date ? data.student.admission_date.split('T')[0] : '',
      special_needs: data.student.special_needs || '',
      class_reached: data.student.class_reached || '',
      allergies: data.student.allergies || '',
      medical_conditions: data.student.medical_conditions || '',
      nhis_number: data.student.nhis_number || '',
      nhis_status: data.student.nhis_status || '',
      disability_status: String(data.student.disability_status || '0'),
      special_diet: String(data.student.special_diet || '0'),
      student_special_diet_details: data.student.student_special_diet_details || '',
      former_school: data.student.former_school || '',
    });
    setEditOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!data) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/students/${studentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editData,
          disability_status: parseInt(editData.disability_status || '0'),
          special_diet: parseInt(editData.special_diet || '0'),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to update');
      toast.success(json.message || 'Student profile updated successfully');
      setEditOpen(false);
      fetchProfile();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update student');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/students/${studentId}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to delete');
      toast.success('Student deleted successfully');
      setDeleteOpen(false);
      router.push('/admin/students/lists');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete student');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <Card className="p-6">
              <Skeleton className="w-32 h-32 rounded-full mx-auto mb-4" />
              <Skeleton className="h-8 w-48 mx-auto mb-2" />
              <Skeleton className="h-4 w-36 mx-auto" />
              <Skeleton className="h-10 w-full mt-6" />
            </Card>
          </div>
          <div className="lg:col-span-3 space-y-4">
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6">
        <Card className="max-w-lg mx-auto p-12 text-center">
          <XCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">Error Loading Profile</h2>
          <p className="text-gray-500 mb-6">{error || 'Student not found'}</p>
          <Button asChild variant="outline">
            <Link href="/admin/students/lists">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Students
            </Link>
          </Button>
        </Card>
      </div>
    );
  }

  const { student, parent, currentEnroll, status, statusColor, otherStudents, exams, grades, invoices, payments, terminalReports } = data;

  const totalReceivables = invoices.receivables.reduce((sum, inv) => sum + inv.due, 0);
  const totalPayables = invoices.payables.reduce((sum, inv) => sum + Math.abs(inv.due), 0);
  const totalPayments = payments.reduce((sum, p) => sum + p.total_amount, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Sticky Header */}
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-sm border-b">
        <div className="p-4 md:px-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="icon" className="h-8 w-8">
              <Link href="/admin/students/lists">
                <ChevronLeft className="h-5 w-5" />
              </Link>
            </Button>
            <h1 className="text-xl md:text-2xl font-bold text-gray-800">Student Profile</h1>
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-sm font-medium text-gray-600 hidden sm:block">Switch:</Label>
            <Select value={studentId} onValueChange={handleSwitchStudent}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select student" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={studentId}>{student.name} (Current)</SelectItem>
                {otherStudents.map(s => (
                  <SelectItem key={s.student_id} value={String(s.student_id)}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="p-4 md:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar - Student Card */}
          <div className="lg:col-span-1">
            <Card className="p-5 lg:sticky lg:top-24 overflow-hidden">
              <div className="text-center">
                <div className="relative inline-block mb-4">
                  <Avatar className="w-32 h-32 border-4 border-primary shadow-lg">
                    <AvatarFallback className="bg-gradient-to-br from-primary to-purple-600 text-white text-2xl font-bold">
                      {getInitials(student.name)}
                    </AvatarFallback>
                  </Avatar>
                  <span className={`absolute -bottom-1 -right-1 ${statusColor} text-white text-xs font-bold px-3 py-1 rounded-full`}>
                    {status}
                  </span>
                </div>

                <h2 className="text-xl font-bold text-gray-800 mb-1">{student.name}</h2>
                <p className="text-sm text-gray-500 mb-1">ID: {student.student_code}</p>
                {currentEnroll && (
                  <Link
                    href={`/admin/students/lists?classId=${currentEnroll.class_id}`}
                    className="text-primary hover:text-primary/70 font-medium text-sm"
                  >
                    {currentEnroll.class_name} {currentEnroll.class_numeric} | Section {currentEnroll.section_name}
                  </Link>
                )}

                <div className="mt-4 flex justify-center gap-2">
                  <Badge variant={student.sex?.toLowerCase() === 'male' ? 'default' : 'secondary'}>
                    <User className="h-3 w-3 mr-1" />
                    {student.sex ? student.sex.charAt(0).toUpperCase() + student.sex.slice(1) : 'N/A'}
                  </Badge>
                  {currentEnroll && (
                    <Badge variant="outline">
                      <Home className="h-3 w-3 mr-1" />
                      {currentEnroll.residence_type || 'N/A'}
                    </Badge>
                  )}
                </div>

                <div className="mt-6 space-y-2">
                  <Button className="w-full bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-700 text-white" onClick={handleOpenEdit}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                  <Button variant="outline" className="w-full text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => setDeleteOpen(true)}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Student
                  </Button>
                </div>
              </div>

              {/* Quick Info */}
              <Separator className="my-4" />
              <div className="space-y-3 text-sm">
                {student.email && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Mail className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <span className="truncate">{student.email}</span>
                  </div>
                )}
                {student.phone && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Phone className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <span>{student.phone}</span>
                  </div>
                )}
                {student.birthday && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <span>{formatDate(student.birthday)}</span>
                  </div>
                )}
              </div>

              {/* Enrollment History */}
              {data.enrolls.length > 0 && (
                <>
                  <Separator className="my-4" />
                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Enrollment History</h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {data.enrolls.map(e => (
                      <div key={e.enroll_id} className={`flex items-center justify-between p-2 rounded text-xs ${e.mute === 0 ? 'bg-green-50' : 'bg-gray-50'}`}>
                        <div>
                          <span className="font-semibold">{e.class_name} {e.class_numeric}</span>
                          <span className="text-gray-400 ml-1">{e.section_name}</span>
                        </div>
                        <span className="text-gray-400">{e.year} T{e.term}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </Card>
          </div>

          {/* Right Content Area */}
          <div className="lg:col-span-3">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <Card className="mb-6 sticky top-[52px] z-10">
                <CardContent className="p-2">
                  <ScrollArea className="w-full">
                    <TabsList className="w-full justify-start bg-transparent h-auto p-1 gap-1 flex-wrap">
                      <TabsTrigger value="basic_info" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-purple-600 data-[state=active]:text-white px-4 py-2 rounded-lg text-sm font-semibold">
                        <Home className="h-4 w-4 mr-1.5" />
                        Basic Info
                      </TabsTrigger>
                      <TabsTrigger value="parent_info" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-purple-600 data-[state=active]:text-white px-4 py-2 rounded-lg text-sm font-semibold">
                        <Users className="h-4 w-4 mr-1.5" />
                        Parent Info
                      </TabsTrigger>
                      <TabsTrigger value="exam_marks" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-purple-600 data-[state=active]:text-white px-4 py-2 rounded-lg text-sm font-semibold">
                        <GraduationCap className="h-4 w-4 mr-1.5" />
                        Exam Marks
                      </TabsTrigger>
                      <TabsTrigger value="login" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-purple-600 data-[state=active]:text-white px-4 py-2 rounded-lg text-sm font-semibold">
                        <Key className="h-4 w-4 mr-1.5" />
                        Login
                      </TabsTrigger>
                      <TabsTrigger value="accounts" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-purple-600 data-[state=active]:text-white px-4 py-2 rounded-lg text-sm font-semibold">
                        <DollarSign className="h-4 w-4 mr-1.5" />
                        Accounts
                      </TabsTrigger>
                    </TabsList>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* ========== TAB 1: BASIC INFO ========== */}
              <TabsContent value="basic_info" className="space-y-6 mt-0">
                {/* Personal Information */}
                <Card className="p-5">
                  <CardHeader className="p-0 pb-4">
                    <CardTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
                      <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                        <User className="h-5 w-5 text-blue-600" />
                      </div>
                      Personal Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <InfoCard icon={User} iconColor="blue" label="Full Name" value={student.name} />
                      <InfoCard icon={Calendar} iconColor="orange" label="Birthday" value={formatDate(student.birthday)} />
                      <InfoCard icon={User} iconColor="purple" label="Gender" value={student.sex ? student.sex.charAt(0).toUpperCase() + student.sex.slice(1) : 'N/A'} />
                      <InfoCard icon={Droplets} iconColor="red" label="Blood Group" value={student.blood_group} />
                      <InfoCard icon={Flag} iconColor="green" label="Nationality" value={student.nationality} />
                      <InfoCard icon={CreditCard} iconColor="indigo" label="Ghana Card ID" value={student.ghana_card_id} />
                      <InfoCard icon={Baby} iconColor="pink" label="Place of Birth" value={student.place_of_birth} />
                      <InfoCard icon={Home} iconColor="teal" label="Hometown" value={student.hometown} />
                      <InfoCard icon={Calendar} iconColor="cyan" label="Admission Date" value={formatDate(student.admission_date)} />
                    </div>
                  </CardContent>
                </Card>

                {/* Contact Information */}
                <Card className="p-5">
                  <CardHeader className="p-0 pb-4">
                    <CardTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
                      <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                        <Phone className="h-5 w-5 text-green-600" />
                      </div>
                      Contact Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <InfoCard icon={Mail} iconColor="red" label="Email" value={student.email} />
                      <InfoCard icon={Phone} iconColor="green" label="Phone" value={student.phone} />
                      <InfoCard icon={Phone} iconColor="blue" label="Student Phone" value={student.student_phone} />
                      <InfoCard icon={AlertTriangle} iconColor="orange" label="Emergency Contact" value={student.emergency_contact} />
                      <div className="bg-gray-50 p-4 rounded-lg hover:bg-gray-100 transition md:col-span-2">
                        <div className="flex items-center gap-2 mb-2">
                          <MapPin className="h-5 w-5 text-purple-600" />
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Address</p>
                        </div>
                        <p className="text-lg font-bold text-gray-800 ml-7 break-words">{student.address || 'N/A'}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Academic Information */}
                <Card className="p-5">
                  <CardHeader className="p-0 pb-4">
                    <CardTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
                      <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                        <GraduationCap className="h-5 w-5 text-purple-600" />
                      </div>
                      Academic Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <InfoCard icon={BookOpen} iconColor="blue" label="Class" value={currentEnroll ? `${currentEnroll.class_name} ${currentEnroll.class_numeric}` : 'N/A'} />
                      <InfoCard icon={BookOpen} iconColor="green" label="Section" value={currentEnroll?.section_name || 'N/A'} />
                      <InfoCard icon={Home} iconColor="orange" label="Residence Type" value={currentEnroll?.residence_type ? currentEnroll.residence_type.charAt(0).toUpperCase() + currentEnroll.residence_type.slice(1) : 'N/A'} />
                      <InfoCard icon={Heart} iconColor="green" label="Special Diet" value={student.special_diet === 1 ? 'YES' : 'NO'} />
                      <InfoCard icon={School} iconColor="teal" label="Former School" value={student.former_school} />
                      <InfoCard icon={ClipboardList} iconColor="indigo" label="Class Reached" value={student.class_reached} />
                    </div>
                  </CardContent>
                </Card>

                {/* Health & Medical Information */}
                {(student.medical_conditions || student.allergies || student.disability_status === 1 || student.nhis_number) && (
                  <Card className="p-5 border-l-4 border-l-red-500">
                    <CardHeader className="p-0 pb-4">
                      <CardTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                          <HeartPulse className="h-5 w-5 text-red-600" />
                        </div>
                        Health & Medical Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {student.nhis_number && (
                          <div className="bg-red-50 p-4 rounded-lg">
                            <div className="flex items-center gap-2 mb-1">
                              <CreditCard className="h-4 w-4 text-red-600" />
                              <p className="text-xs font-medium text-gray-500">NHIS Number</p>
                            </div>
                            <p className="text-base font-semibold text-gray-800 ml-6">{student.nhis_number}</p>
                            <Badge className={`ml-6 mt-1 ${student.nhis_status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                              {student.nhis_status ? student.nhis_status.charAt(0).toUpperCase() + student.nhis_status.slice(1) : 'Pending'}
                            </Badge>
                          </div>
                        )}
                        {student.medical_conditions && (
                          <div className="bg-orange-50 p-4 rounded-lg md:col-span-2">
                            <div className="flex items-center gap-2 mb-1">
                              <AlertTriangle className="h-4 w-4 text-orange-600" />
                              <p className="text-xs font-medium text-gray-500">Medical Conditions</p>
                            </div>
                            <p className="text-sm text-gray-700 ml-6">{student.medical_conditions}</p>
                          </div>
                        )}
                        {student.allergies && (
                          <div className="bg-yellow-50 p-4 rounded-lg md:col-span-2">
                            <div className="flex items-center gap-2 mb-1">
                              <AlertTriangle className="h-4 w-4 text-yellow-600" />
                              <p className="text-xs font-medium text-gray-500">Allergies</p>
                            </div>
                            <p className="text-sm text-gray-700 ml-6">{student.allergies}</p>
                          </div>
                        )}
                        {student.disability_status === 1 && (
                          <div className="bg-blue-50 p-4 rounded-lg md:col-span-2">
                            <div className="flex items-center gap-2 mb-1">
                              <Info className="h-4 w-4 text-blue-600" />
                              <p className="text-xs font-medium text-gray-500">Special Needs & Support</p>
                            </div>
                            {student.special_needs && (
                              <p className="text-sm text-gray-700 ml-6 mb-1"><strong>Needs:</strong> {student.special_needs}</p>
                            )}
                          </div>
                        )}
                        {student.special_diet === 1 && student.student_special_diet_details && (
                          <div className="bg-green-50 p-4 rounded-lg md:col-span-2">
                            <div className="flex items-center gap-2 mb-1">
                              <Heart className="h-4 w-4 text-green-600" />
                              <p className="text-xs font-medium text-gray-500">Special Diet Details</p>
                            </div>
                            <p className="text-sm text-gray-700 ml-6">{student.student_special_diet_details}</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Terminal Reports Summary */}
                {terminalReports.length > 0 && (
                  <Card className="p-5">
                    <CardHeader className="p-0 pb-4">
                      <CardTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                          <FileText className="h-5 w-5 text-emerald-600" />
                        </div>
                        Terminal Reports
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b bg-gray-50">
                              <th className="px-4 py-3 text-left font-semibold text-gray-600">Year</th>
                              <th className="px-4 py-3 text-left font-semibold text-gray-600">Term</th>
                              <th className="px-4 py-3 text-left font-semibold text-gray-600">Class</th>
                              <th className="px-4 py-3 text-right font-semibold text-gray-600">Total Score</th>
                              <th className="px-4 py-3 text-center font-semibold text-gray-600">Grade</th>
                              <th className="px-4 py-3 text-center font-semibold text-gray-600">Position</th>
                            </tr>
                          </thead>
                          <tbody>
                            {terminalReports.map((r) => (
                              <tr key={r.report_id} className="border-b hover:bg-gray-50">
                                <td className="px-4 py-3">{r.year}</td>
                                <td className="px-4 py-3">Term {r.term}</td>
                                <td className="px-4 py-3">{r.class ? `${r.class.name} ${r.class.name_numeric}` : 'N/A'}</td>
                                <td className="px-4 py-3 text-right font-semibold">{r.total_score}</td>
                                <td className="px-4 py-3 text-center">
                                  <Badge variant={r.grade ? 'default' : 'outline'}>{r.grade || 'N/A'}</Badge>
                                </td>
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

              {/* ========== TAB 2: PARENT INFO ========== */}
              <TabsContent value="parent_info" className="mt-0">
                {!parent ? (
                  <Card className="p-12 text-center">
                    <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-lg text-gray-500">Parent information is not available</p>
                  </Card>
                ) : (
                  <div className="space-y-6">
                    {/* Primary Guardian */}
                    <Card className="p-5 border-l-4 border-l-primary">
                      <div className="flex items-center justify-between mb-5">
                        <CardTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-purple-700 flex items-center justify-center">
                            <User className="h-5 w-5 text-white" />
                          </div>
                          Primary Guardian ({parent.guardian_gender || 'Guardian'})
                        </CardTitle>
                        <Badge className="bg-primary/10 text-primary">Primary Contact</Badge>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <GradientInfoCard icon={User} bgColor="from-blue-50 to-blue-100" label="Full Name" value={parent.name} />
                        <GradientInfoCard icon={Phone} bgColor="from-green-50 to-green-100" label="Phone Number" value={parent.phone} />
                        <GradientInfoCard icon={Briefcase} bgColor="from-orange-50 to-orange-100" label="Occupation" value={parent.profession} />
                        <GradientInfoCard icon={Mail} bgColor="from-red-50 to-red-100" label="Email" value={parent.email} />
                      </div>
                    </Card>

                    {/* Father&apos;s Information */}
                    <Card className="p-5 border-l-4 border-l-blue-600">
                      <div className="flex items-center justify-between mb-5">
                        <CardTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center">
                            <User className="h-5 w-5 text-white" />
                          </div>
                          Father&apos;s Information
                        </CardTitle>
                        <Badge className="bg-blue-100 text-blue-800">Father</Badge>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <GradientInfoCard icon={User} bgColor="from-blue-50 to-blue-100" label="Father's Name" value={parent.father_name || (parent.guardian_gender === 'Male' ? parent.name : 'N/A')} />
                        <GradientInfoCard icon={Phone} bgColor="from-green-50 to-green-100" label="Father's Phone" value={parent.father_phone || (parent.guardian_gender === 'Male' ? parent.phone : 'N/A')} />
                        <GradientInfoCard icon={Briefcase} bgColor="from-indigo-50 to-indigo-100" label="Father's Occupation" value={parent.guardian_gender === 'Male' ? parent.profession : 'N/A'} />
                        <GradientInfoCard icon={Mail} bgColor="from-cyan-50 to-cyan-100" label="Father's Email" value={parent.guardian_gender === 'Male' ? parent.email : 'N/A'} />
                      </div>
                    </Card>

                    {/* Mother&apos;s Information */}
                    <Card className="p-5 border-l-4 border-l-pink-500">
                      <div className="flex items-center justify-between mb-5">
                        <CardTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-pink-700 flex items-center justify-center">
                            <User className="h-5 w-5 text-white" />
                          </div>
                          Mother&apos;s Information
                        </CardTitle>
                        <Badge className="bg-pink-100 text-pink-800">Mother</Badge>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <GradientInfoCard icon={User} bgColor="from-pink-50 to-pink-100" label="Mother's Name" value={parent.mother_name || (parent.guardian_gender === 'Female' ? parent.name : 'N/A')} />
                        <GradientInfoCard icon={Phone} bgColor="from-rose-50 to-rose-100" label="Mother's Phone" value={parent.mother_phone || (parent.guardian_gender === 'Female' ? parent.phone : 'N/A')} />
                        <GradientInfoCard icon={Briefcase} bgColor="from-purple-50 to-purple-100" label="Mother's Occupation" value={parent.guardian_gender === 'Female' ? parent.profession : 'N/A'} />
                        <GradientInfoCard icon={Mail} bgColor="from-fuchsia-50 to-fuchsia-100" label="Mother's Email" value={parent.guardian_gender === 'Female' ? parent.email : 'N/A'} />
                      </div>
                    </Card>

                    {/* Family Address */}
                    <Card className="p-5 border-l-4 border-l-purple-500">
                      <CardTitle className="text-xl font-bold text-gray-800 flex items-center gap-2 mb-4">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center">
                          <Home className="h-5 w-5 text-white" />
                        </div>
                        Family Address
                      </CardTitle>
                      <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-5 rounded-xl">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-lg bg-purple-500 flex items-center justify-center flex-shrink-0">
                            <MapPin className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-purple-700 uppercase tracking-wide mb-1">Residential Address</p>
                            <p className="text-base font-bold text-gray-800 break-words">{parent.address || 'N/A'}</p>
                          </div>
                        </div>
                      </div>
                    </Card>

                    {/* Parent Portal Access */}
                    <Card className="p-5 border-l-4 border-l-primary">
                      <CardTitle className="text-xl font-bold text-gray-800 flex items-center gap-2 mb-4">
                        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                          <Key className="h-5 w-5 text-white" />
                        </div>
                        Parent Portal Access
                      </CardTitle>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <GradientInfoCard icon={Mail} bgColor="from-indigo-50 to-indigo-100" label="Login Username" value={parent.email} />
                        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 rounded-lg bg-purple-500 flex items-center justify-center">
                              <Key className="h-4 w-4 text-white" />
                            </div>
                            <p className="text-xs font-semibold text-purple-700 uppercase tracking-wide">Authentication Key</p>
                          </div>
                          <p className="text-sm font-mono font-bold text-gray-800 ml-10 bg-white px-3 py-2 rounded border-2 border-purple-200 break-all">
                            {parent.authentication_key || 'N/A'}
                          </p>
                        </div>
                      </div>
                      <div className="mt-4 bg-blue-50 border-l-4 border-blue-500 p-3 rounded">
                        <p className="text-sm text-blue-800">
                          <Info className="h-3 w-3 inline mr-1" />
                          <strong>Note:</strong> Parents can access the portal using their registered email and password to view student progress, attendance, and payments.
                        </p>
                      </div>
                    </Card>
                  </div>
                )}
              </TabsContent>

              {/* ========== TAB 3: EXAM MARKS ========== */}
              <TabsContent value="exam_marks" className="mt-0">
                {exams.length === 0 ? (
                  <Card className="p-12 text-center">
                    <GraduationCap className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-lg text-gray-500">No examination results found</p>
                  </Card>
                ) : (
                  <div className="space-y-6">
                    {exams.map((exam) => {
                      const classScoreTotal = 0; // not stored separately in our schema
                      const examScoreTotal = 0;
                      const totalMarks = exam.subjects.reduce((sum, s) => sum + s.mark_obtained, 0);

                      return (
                        <Card key={exam.exam_id}>
                          {/* Exam Header */}
                          <div className="p-4 rounded-t-xl bg-gradient-to-r from-primary to-purple-600 text-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                            <div className="flex items-center gap-3">
                              <GraduationCap className="h-6 w-6 opacity-80" />
                              <h3 className="font-semibold text-lg">
                                {exam.exam_name} - {exam.class_name} {exam.class_numeric}{exam.section_name}
                              </h3>
                            </div>
                            <div className="text-sm opacity-90">
                              {exam.term ? `Term: ${exam.term}` : ''} | Year: {exam.year ? exam.year.split('-').pop() : 'N/A'}
                            </div>
                          </div>

                          {/* Marks Table */}
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b bg-gray-50">
                                  <th className="px-4 py-3 text-center font-semibold text-gray-600 w-12">S/N</th>
                                  <th className="px-4 py-3 text-center font-semibold text-gray-600">Subject</th>
                                  <th className="px-4 py-3 text-center font-semibold text-gray-600">Score</th>
                                  <th className="px-4 py-3 text-center font-semibold text-gray-600">Grade</th>
                                  <th className="px-4 py-3 text-center font-semibold text-gray-600">Remark</th>
                                </tr>
                              </thead>
                              <tbody>
                                {exam.subjects.map((subj, idx) => {
                                  const { name: gradeName, comment: gradeComment } = getGrade(subj.mark_obtained, grades);
                                  return (
                                    <tr key={subj.subject_id} className="border-b hover:bg-gray-50">
                                      <td className="px-4 py-3 text-center">{idx + 1}</td>
                                      <td className="px-4 py-3 text-center font-medium">
                                        {subj.subject_name.length <= 4 ? subj.subject_name.toUpperCase() : subj.subject_name}
                                      </td>
                                      <td className="px-4 py-3 text-center font-bold">{subj.mark_obtained || 'N/A'}</td>
                                      <td className="px-4 py-3 text-center">
                                        {subj.mark_obtained > 0 ? (
                                          <Badge variant={gradeName === 'N/A' ? 'outline' : 'default'}>{gradeName}</Badge>
                                        ) : (
                                          <span className="text-gray-400">Pending</span>
                                        )}
                                      </td>
                                      <td className="px-4 py-3 text-center text-gray-600">{gradeComment || subj.comment || 'N/A'}</td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                              <tfoot>
                                <tr className="bg-gray-50 font-bold">
                                  <td colSpan={2} className="px-4 py-3 text-center">TOTAL</td>
                                  <td className="px-4 py-3 text-center">{totalMarks || 'N/A'}</td>
                                  <td colSpan={2}></td>
                                </tr>
                              </tfoot>
                            </table>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </TabsContent>

              {/* ========== TAB 4: LOGIN ========== */}
              <TabsContent value="login" className="mt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="p-5">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <Key className="h-6 w-6 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-500 mb-2">Authentication Key</p>
                        <p className="text-xl font-bold text-gray-800 tracking-wider font-mono bg-gray-100 px-4 py-2 rounded break-all">
                          {student.authentication_key}
                        </p>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-5">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                        <User className="h-6 w-6 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-500 mb-2">Username</p>
                        <p className="text-xl font-bold text-gray-800">{student.username}</p>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-5 md:col-span-2">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
                        <Lock className="h-6 w-6 text-red-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-500 mb-2">Password</p>
                        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
                          <p className="text-red-700">
                            <strong>Not Available.</strong> In case of password lost, ask the student to use their email to request a new password.
                          </p>
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>
              </TabsContent>

              {/* ========== TAB 5: ACCOUNTS ========== */}
              <TabsContent value="accounts" className="mt-0 space-y-6">
                {/* Accounts Receivables */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="text-xl font-bold text-gray-500">Accounts Receivables</h3>
                      <p className="text-lg font-extrabold text-green-600">
                        {totalReceivables > 0 ? formatCurrency(totalReceivables) : 'No Outstanding'}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-green-600 border-green-300">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      {invoices.receivables.length} invoice(s)
                    </Badge>
                  </div>
                  <Card className="border-t-4 border-t-green-500">
                    {invoices.receivables.length === 0 ? (
                      <div className="p-8 text-center text-gray-400">
                        <CheckCircle className="h-8 w-8 mx-auto mb-2" />
                        <p>No outstanding receivables</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b bg-gray-50">
                              <th className="px-4 py-3 text-left font-semibold text-gray-600">Date</th>
                              <th className="px-4 py-3 text-left font-semibold text-gray-600">Invoice#</th>
                              <th className="px-4 py-3 text-left font-semibold text-gray-600">Title</th>
                              <th className="px-4 py-3 text-right font-semibold text-gray-600">Total</th>
                              <th className="px-4 py-3 text-right font-semibold text-gray-600">Paid</th>
                              <th className="px-4 py-3 text-right font-semibold text-gray-600">Due</th>
                            </tr>
                          </thead>
                          <tbody>
                            {invoices.receivables.map((inv) => (
                              <tr key={inv.invoice_id} className="border-b hover:bg-gray-50">
                                <td className="px-4 py-3 text-gray-600 uppercase text-xs">{formatDate(inv.creation_timestamp)}</td>
                                <td className="px-4 py-3 font-mono font-semibold">{inv.invoice_code}</td>
                                <td className="px-4 py-3">{inv.title}</td>
                                <td className="px-4 py-3 text-right">{formatCurrency(inv.amount)}</td>
                                <td className="px-4 py-3 text-right text-green-600">{formatCurrency(inv.amount_paid)}</td>
                                <td className="px-4 py-3 text-right font-bold text-red-600">{formatCurrency(inv.due)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </Card>
                </div>

                {/* Accounts Payables */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="text-xl font-bold text-gray-500">Accounts Payables (Overpayments)</h3>
                      <p className="text-lg font-extrabold text-red-600">
                        {totalPayables > 0 ? formatCurrency(totalPayables) : 'No Overpayments'}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-red-600 border-red-300">
                      <TrendingDown className="h-3 w-3 mr-1" />
                      {invoices.payables.length} invoice(s)
                    </Badge>
                  </div>
                  <Card className="border-t-4 border-t-red-500">
                    {invoices.payables.length === 0 ? (
                      <div className="p-8 text-center text-gray-400">
                        <CheckCircle className="h-8 w-8 mx-auto mb-2" />
                        <p>No overpayments / payables</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b bg-gray-50">
                              <th className="px-4 py-3 text-left font-semibold text-gray-600">Date</th>
                              <th className="px-4 py-3 text-left font-semibold text-gray-600">Invoice#</th>
                              <th className="px-4 py-3 text-left font-semibold text-gray-600">Title</th>
                              <th className="px-4 py-3 text-right font-semibold text-gray-600">Overpayment</th>
                            </tr>
                          </thead>
                          <tbody>
                            {invoices.payables.map((inv) => (
                              <tr key={inv.invoice_id} className="border-b hover:bg-gray-50">
                                <td className="px-4 py-3 text-gray-600 uppercase text-xs">{formatDate(inv.creation_timestamp)}</td>
                                <td className="px-4 py-3 font-mono font-semibold">{inv.invoice_code}</td>
                                <td className="px-4 py-3">{inv.title}</td>
                                <td className="px-4 py-3 text-right font-bold text-red-600">{formatCurrency(Math.abs(inv.due))}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </Card>
                </div>

                {/* Payment History */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="text-xl font-bold text-gray-500">Billed Invoices Payment History</h3>
                      <p className="text-lg font-extrabold text-primary">
                        Accumulated: {formatCurrency(totalPayments)}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-primary">
                      <Receipt className="h-3 w-3 mr-1" />
                      {payments.length} receipt(s)
                    </Badge>
                  </div>
                  <Card className="border-t-4 border-t-sky-500">
                    {payments.length === 0 ? (
                      <div className="p-8 text-center text-gray-400">
                        <Receipt className="h-8 w-8 mx-auto mb-2" />
                        <p>No payment history</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b bg-gray-50">
                              <th className="px-4 py-3 text-left font-semibold text-gray-600">Date</th>
                              <th className="px-4 py-3 text-left font-semibold text-gray-600">Receipt#</th>
                              <th className="px-4 py-3 text-left font-semibold text-gray-600">Method</th>
                              <th className="px-4 py-3 text-right font-semibold text-gray-600">Amount</th>
                            </tr>
                          </thead>
                          <tbody>
                            {payments.map((p, idx) => (
                              <tr key={idx} className="border-b hover:bg-gray-50">
                                <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{formatDateTime(p.timestamp)}</td>
                                <td className="px-4 py-3 font-mono font-semibold">{p.receipt_code}</td>
                                <td className="px-4 py-3">{p.payment_method ? p.payment_method.charAt(0).toUpperCase() + p.payment_method.slice(1) : 'N/A'}</td>
                                <td className="px-4 py-3 text-right font-bold text-green-600">{formatCurrency(p.total_amount)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {/* ========== EDIT DIALOG ========== */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Edit Student Profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Personal Info */}
            <div>
              <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                <User className="h-4 w-4" /> Personal Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">First Name *</Label>
                  <Input value={editData.first_name} onChange={e => setEditData({ ...editData, first_name: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Middle Name</Label>
                  <Input value={editData.middle_name} onChange={e => setEditData({ ...editData, middle_name: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Last Name *</Label>
                  <Input value={editData.last_name} onChange={e => setEditData({ ...editData, last_name: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Gender</Label>
                  <Select value={editData.sex} onValueChange={v => setEditData({ ...editData, sex: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Birthday</Label>
                  <Input type="date" value={editData.birthday} onChange={e => setEditData({ ...editData, birthday: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Blood Group</Label>
                  <Input value={editData.blood_group} onChange={e => setEditData({ ...editData, blood_group: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Nationality</Label>
                  <Input value={editData.nationality} onChange={e => setEditData({ ...editData, nationality: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Religion</Label>
                  <Input value={editData.religion} onChange={e => setEditData({ ...editData, religion: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Ghana Card ID</Label>
                  <Input value={editData.ghana_card_id} onChange={e => setEditData({ ...editData, ghana_card_id: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Place of Birth</Label>
                  <Input value={editData.place_of_birth} onChange={e => setEditData({ ...editData, place_of_birth: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Hometown</Label>
                  <Input value={editData.hometown} onChange={e => setEditData({ ...editData, hometown: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Tribe</Label>
                  <Input value={editData.tribe} onChange={e => setEditData({ ...editData, tribe: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Admission Date</Label>
                  <Input type="date" value={editData.admission_date} onChange={e => setEditData({ ...editData, admission_date: e.target.value })} />
                </div>
              </div>
            </div>

            <Separator />

            {/* Contact Info */}
            <div>
              <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                <Phone className="h-4 w-4" /> Contact Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Email</Label>
                  <Input type="email" value={editData.email} onChange={e => setEditData({ ...editData, email: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Phone</Label>
                  <Input value={editData.phone} onChange={e => setEditData({ ...editData, phone: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Student Phone</Label>
                  <Input value={editData.student_phone} onChange={e => setEditData({ ...editData, student_phone: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Emergency Contact</Label>
                  <Input value={editData.emergency_contact} onChange={e => setEditData({ ...editData, emergency_contact: e.target.value })} />
                </div>
                <div className="space-y-1 md:col-span-2">
                  <Label className="text-xs">Address</Label>
                  <Textarea value={editData.address} onChange={e => setEditData({ ...editData, address: e.target.value })} rows={2} />
                </div>
              </div>
            </div>

            <Separator />

            {/* Medical Info */}
            <div>
              <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                <HeartPulse className="h-4 w-4" /> Health & Medical
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">NHIS Number</Label>
                  <Input value={editData.nhis_number} onChange={e => setEditData({ ...editData, nhis_number: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">NHIS Status</Label>
                  <Select value={editData.nhis_status} onValueChange={v => setEditData({ ...editData, nhis_status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Allergies</Label>
                  <Input value={editData.allergies} onChange={e => setEditData({ ...editData, allergies: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Disability Status</Label>
                  <Select value={editData.disability_status} onValueChange={v => setEditData({ ...editData, disability_status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">None</SelectItem>
                      <SelectItem value="1">Has Disability</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Special Diet</Label>
                  <Select value={editData.special_diet} onValueChange={v => setEditData({ ...editData, special_diet: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">No</SelectItem>
                      <SelectItem value="1">Yes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Class Reached</Label>
                  <Input value={editData.class_reached} onChange={e => setEditData({ ...editData, class_reached: e.target.value })} />
                </div>
                <div className="space-y-1 md:col-span-2">
                  <Label className="text-xs">Medical Conditions</Label>
                  <Textarea value={editData.medical_conditions} onChange={e => setEditData({ ...editData, medical_conditions: e.target.value })} rows={2} />
                </div>
                <div className="space-y-1 md:col-span-2">
                  <Label className="text-xs">Special Needs</Label>
                  <Textarea value={editData.special_needs} onChange={e => setEditData({ ...editData, special_needs: e.target.value })} rows={2} />
                </div>
                <div className="space-y-1 md:col-span-2">
                  <Label className="text-xs">Special Diet Details</Label>
                  <Textarea value={editData.student_special_diet_details} onChange={e => setEditData({ ...editData, student_special_diet_details: e.target.value })} rows={2} />
                </div>
                <div className="space-y-1 md:col-span-2">
                  <Label className="text-xs">Former School</Label>
                  <Input value={editData.former_school} onChange={e => setEditData({ ...editData, former_school: e.target.value })} />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveEdit} disabled={saving || !editData.first_name || !editData.last_name}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========== DELETE DIALOG ========== */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Student</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{student.name}</strong>? This action cannot be undone.
              All associated data including enrollment, marks, invoices, and payments will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleting ? 'Deleting...' : 'Delete Student'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
