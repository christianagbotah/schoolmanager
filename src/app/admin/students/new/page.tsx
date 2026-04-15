'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  ArrowLeft, Save, UserPlus, GraduationCap, Users, Heart, Camera,
  Loader2, AlertCircle, CheckCircle2,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// ─── Constants ───────────────────────────────────────────────────────────────

const CLASS_GROUPS = ['CRECHE', 'NURSERY', 'KG', 'BASIC', 'JHS'];

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as const;

const RELIGIONS = [
  { value: 'Christianity', label: 'Christianity' },
  { value: 'Islam', label: 'Islam' },
  { value: 'Traditional', label: 'Traditional' },
  { value: 'Others', label: 'Others' },
] as const;

const NHIS_STATUSES = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'pending', label: 'Pending' },
] as const;

// ─── Types ───────────────────────────────────────────────────────────────────

interface ClassItem {
  class_id: number;
  name: string;
  category: string;
}

interface SectionItem {
  section_id: number;
  name: string;
  class_id: number;
}

interface ParentItem {
  parent_id: number;
  name: string;
  phone: string;
  email: string;
}

// ─── Helper: generate student code ───────────────────────────────────────────

function generateStudentCode(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `STU${year}${random}`;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function AdmitStudentPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Loading / saving state ──
  const [saving, setSaving] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [activeTab, setActiveTab] = useState('personal');

  // ── Reference data ──
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [sections, setSections] = useState<SectionItem[]>([]);
  const [parents, setParents] = useState<ParentItem[]>([]);
  const [filteredSections, setFilteredSections] = useState<SectionItem[]>([]);

  // ── Filters ──
  const [group, setGroup] = useState('');
  const [searchParent, setSearchParent] = useState('');

  // ── Photo ──
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  // ── Section 1: Personal Information ──
  const [formData, setFormData] = useState({
    first_name: '',
    middle_name: '',
    last_name: '',
    name: '',
    birthday: '',
    sex: 'male',
    religion: '',
    custom_religion: '',
    blood_group: '',
    nationality: 'Ghanaian',
    ghana_card_id: '',
    place_of_birth: '',
    hometown: '',
    tribe: '',
    phone: '',
    student_phone: '',
    email: '',
    address: '',
    emergency_contact: '',
  });

  // ── Section 2: Academic Information ──
  const [academicData, setAcademicData] = useState({
    class_id: '',
    section_id: '',
    residence_type: 'Day',
    admission_date: new Date().toISOString().split('T')[0],
    former_school: '',
    class_reached: '',
    student_code: generateStudentCode(),
    parent_id: '',
  });

  // ── Section 3: Parent / Guardian Information ──
  const [parentData, setParentData] = useState({
    name: '',
    phone: '',
    email: '',
    profession: '',
    guardian_gender: 'Male',
    address: '',
    father_name: '',
    father_phone: '',
    father_occupation: '',
    mother_name: '',
    mother_phone: '',
    mother_occupation: '',
    parent_email: '',
  });

  // ── Section 4: Medical & Special Needs ──
  const [medicalData, setMedicalData] = useState({
    allergies: '',
    medical_conditions: '',
    nhis_number: '',
    nhis_status: '',
    disability_status: false,
    special_needs: '',
    special_diet: false,
    student_special_diet_details: '',
  });

  // ── Fetch reference data ──
  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [classesRes, sectionsRes, parentsRes] = await Promise.all([
          fetch('/api/classes?limit=200'),
          fetch('/api/sections'),
          fetch('/api/parents?limit=200'),
        ]);
        const [classesData, sectionsData, parentsData] = await Promise.all([
          classesRes.json(),
          sectionsRes.json(),
          parentsRes.json(),
        ]);
        setClasses(Array.isArray(classesData) ? classesData : []);
        setSections(Array.isArray(sectionsData) ? sectionsData : []);
        setParents(Array.isArray(parentsData) ? parentsData : []);
      } catch {
        toast.error('Failed to load reference data');
      } finally {
        setLoadingData(false);
      }
    };
    fetchAll();
  }, []);

  // ── Auto-generate full name (uppercase) ──
  useEffect(() => {
    const fn = formData.first_name || '';
    const mn = formData.middle_name || '';
    const ln = formData.last_name || '';
    const fullName = `${fn} ${mn} ${ln}`.replace(/\s+/g, ' ').trim().toUpperCase();
    setFormData(prev => ({ ...prev, name: fullName }));
  }, [formData.first_name, formData.middle_name, formData.last_name]);

  // ── Filter sections when class changes ──
  useEffect(() => {
    if (academicData.class_id) {
      setFilteredSections(
        sections.filter(s => s.class_id === parseInt(academicData.class_id))
      );
    } else {
      setFilteredSections([]);
    }
  }, [academicData.class_id, sections]);

  const filteredClasses = group
    ? classes.filter(c => c.category === group)
    : classes;

  // ── Photo handler ──
  const handlePhotoChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image must be less than 5 MB');
        return;
      }

      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    },
    []
  );

  // ── Validation ──
  const validate = (): boolean => {
    if (!formData.first_name.trim() || !formData.last_name.trim()) {
      toast.error('First name and Last name are required');
      setActiveTab('personal');
      return false;
    }
    if (!academicData.class_id) {
      toast.error('Class selection is required');
      setActiveTab('academic');
      return false;
    }
    if (!academicData.section_id) {
      toast.error('Section selection is required');
      setActiveTab('academic');
      return false;
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast.error('Please enter a valid email address');
      setActiveTab('personal');
      return false;
    }
    return true;
  };

  // ── Submit handler ──
  const handleSave = async () => {
    if (!validate()) return;

    const hasExistingParent = academicData.parent_id && academicData.parent_id !== '0';
    const isCreatingParent = !hasExistingParent && parentData.name.trim();

    setSaving(true);

    try {
      // ── Step 1: Create parent if needed ──
      let parentId: number | null = null;

      if (hasExistingParent) {
        parentId = parseInt(academicData.parent_id);
      } else if (isCreatingParent) {
        const parentRes = await fetch('/api/parents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(parentData),
        });
        const parentJson = await parentRes.json();
        if (parentJson.error) {
          toast.error(`Failed to create parent: ${parentJson.error}`);
          return;
        }
        parentId = parentJson.parent_id || parentJson.id || null;
      }

      // ── Step 2: Create student ──
      const studentPayload = {
        // Personal
        first_name: formData.first_name,
        middle_name: formData.middle_name,
        last_name: formData.last_name,
        name: formData.name,
        birthday: formData.birthday,
        sex: formData.sex,
        religion: formData.religion === 'Others' ? formData.custom_religion : formData.religion,
        blood_group: formData.blood_group,
        nationality: formData.nationality,
        ghana_card_id: formData.ghana_card_id,
        place_of_birth: formData.place_of_birth,
        hometown: formData.hometown,
        tribe: formData.tribe,
        phone: formData.phone,
        student_phone: formData.student_phone,
        email: formData.email.toLowerCase().trim(),
        address: formData.address,
        emergency_contact: formData.emergency_contact,

        // Academic
        class_id: academicData.class_id,
        section_id: academicData.section_id,
        residence_type: academicData.residence_type,
        admission_date: academicData.admission_date,
        former_school: academicData.former_school,
        class_reached: academicData.class_reached,
        student_code: academicData.student_code,

        // Medical
        allergies: medicalData.allergies,
        medical_conditions: medicalData.medical_conditions,
        nhis_number: medicalData.nhis_number,
        nhis_status: medicalData.nhis_status,
        disability_status: medicalData.disability_status ? 1 : 0,
        special_needs: medicalData.special_needs,
        special_diet: medicalData.special_diet ? 1 : 0,
        student_special_diet_details: medicalData.student_special_diet_details,

        parent_id: parentId ? String(parentId) : '',
        username: formData.email ? formData.email.toLowerCase().trim() : '',
      };

      const res = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(studentPayload),
      });
      const data = await res.json();

      if (data.error) {
        throw new Error(data.error);
      }

      // ── Step 3: Upload photo if provided ──
      if (photoFile && data.student?.student_id) {
        const formDataUpload = new FormData();
        formDataUpload.append('photo', photoFile);
        try {
          await fetch(
            `/api/students/${data.student.student_id}/photo`,
            {
              method: 'POST',
              body: formDataUpload,
            }
          );
        } catch {
          toast.warning('Student created but photo upload failed');
        }
      }

      toast.success('Student enrolled successfully!');
      router.push('/admin/students');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to enroll student';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  // ── Loading skeleton ──
  if (loadingData) {
    return (
      <DashboardLayout>
        <div className="space-y-6 max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-slate-200 animate-pulse" />
            <div className="space-y-2">
              <div className="h-7 w-64 rounded bg-slate-200 animate-pulse" />
              <div className="h-4 w-48 rounded bg-slate-200 animate-pulse" />
            </div>
          </div>
          <div className="h-[600px] rounded-xl bg-slate-200 animate-pulse" />
        </div>
      </DashboardLayout>
    );
  }

  // ── Render ──
  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* ── Page header ── */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/students">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Admit New Student
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Enroll a new student into the school system
            </p>
          </div>
        </div>

        {/* ── Tabbed form ── */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full grid grid-cols-5 mb-2">
            <TabsTrigger value="personal" className="gap-1.5 text-xs sm:text-sm">
              <UserPlus className="w-4 h-4 hidden sm:block" />
              Personal
            </TabsTrigger>
            <TabsTrigger value="academic" className="gap-1.5 text-xs sm:text-sm">
              <GraduationCap className="w-4 h-4 hidden sm:block" />
              Academic
            </TabsTrigger>
            <TabsTrigger value="guardian" className="gap-1.5 text-xs sm:text-sm">
              <Users className="w-4 h-4 hidden sm:block" />
              Guardian
            </TabsTrigger>
            <TabsTrigger value="medical" className="gap-1.5 text-xs sm:text-sm">
              <Heart className="w-4 h-4 hidden sm:block" />
              Medical
            </TabsTrigger>
            <TabsTrigger value="photo" className="gap-1.5 text-xs sm:text-sm">
              <Camera className="w-4 h-4 hidden sm:block" />
              Photo
            </TabsTrigger>
          </TabsList>

          {/* ═══════════════════════════════════════════════════════════════════
              TAB 1 — PERSONAL INFORMATION
              ═══════════════════════════════════════════════════════════════════ */}
          <TabsContent value="personal">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <UserPlus className="w-5 h-5 text-emerald-600" />
                  Personal Information
                </CardTitle>
                <CardDescription>
                  Enter the student&apos;s basic personal details. Name fields are
                  auto-capitalised.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* ── Full Name Preview ── */}
                <div className="rounded-lg bg-slate-50 border border-slate-200 p-3">
                  <p className="text-xs font-medium text-slate-500 mb-0.5">
                    Generated Full Name
                  </p>
                  <p className="text-sm font-semibold text-slate-800 uppercase tracking-wide">
                    {formData.name || '—'}
                  </p>
                </div>

                {/* ── Name Row ── */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="first_name">
                      First Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="first_name"
                      placeholder="First name"
                      value={formData.first_name}
                      onChange={e =>
                        setFormData(prev => ({
                          ...prev,
                          first_name: e.target.value,
                        }))
                      }
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="middle_name">Middle Name</Label>
                    <Input
                      id="middle_name"
                      placeholder="Middle name"
                      value={formData.middle_name}
                      onChange={e =>
                        setFormData(prev => ({
                          ...prev,
                          middle_name: e.target.value,
                        }))
                      }
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="last_name">
                      Last Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="last_name"
                      placeholder="Last name"
                      value={formData.last_name}
                      onChange={e =>
                        setFormData(prev => ({
                          ...prev,
                          last_name: e.target.value,
                        }))
                      }
                      className="mt-1"
                    />
                  </div>
                </div>

                <Separator />

                {/* ── Birthday / Sex / Blood Group ── */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="birthday">Date of Birth</Label>
                    <Input
                      id="birthday"
                      type="date"
                      value={formData.birthday}
                      onChange={e =>
                        setFormData(prev => ({
                          ...prev,
                          birthday: e.target.value,
                        }))
                      }
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="sex">Gender</Label>
                    <Select
                      value={formData.sex}
                      onValueChange={v =>
                        setFormData(prev => ({ ...prev, sex: v }))
                      }
                    >
                      <SelectTrigger id="sex" className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="blood_group">Blood Group</Label>
                    <Select
                      value={formData.blood_group}
                      onValueChange={v =>
                        setFormData(prev => ({ ...prev, blood_group: v }))
                      }
                    >
                      <SelectTrigger id="blood_group" className="mt-1">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {BLOOD_GROUPS.map(bg => (
                          <SelectItem key={bg} value={bg}>
                            {bg}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* ── Religion ── */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="religion">Religion</Label>
                    <Select
                      value={formData.religion}
                      onValueChange={v =>
                        setFormData(prev => ({ ...prev, religion: v }))
                      }
                    >
                      <SelectTrigger id="religion" className="mt-1">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {RELIGIONS.map(r => (
                          <SelectItem key={r.value} value={r.value}>
                            {r.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {formData.religion === 'Others' && (
                    <div className="sm:col-span-2">
                      <Label htmlFor="custom_religion">
                        Specify Religion
                      </Label>
                      <Input
                        id="custom_religion"
                        placeholder="Enter religion"
                        value={formData.custom_religion}
                        onChange={e =>
                          setFormData(prev => ({
                            ...prev,
                            custom_religion: e.target.value,
                          }))
                        }
                        className="mt-1"
                      />
                    </div>
                  )}
                  <div>
                    <Label htmlFor="nationality">Nationality</Label>
                    <Input
                      id="nationality"
                      placeholder="Nationality"
                      value={formData.nationality}
                      onChange={e =>
                        setFormData(prev => ({
                          ...prev,
                          nationality: e.target.value,
                        }))
                      }
                      className="mt-1"
                    />
                  </div>
                </div>

                <Separator />

                {/* ── Ghana Card / Place of Birth / Hometown / Tribe ── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="ghana_card_id">Ghana Card ID</Label>
                    <Input
                      id="ghana_card_id"
                      placeholder="National ID number"
                      value={formData.ghana_card_id}
                      onChange={e =>
                        setFormData(prev => ({
                          ...prev,
                          ghana_card_id: e.target.value,
                        }))
                      }
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="place_of_birth">Place of Birth</Label>
                    <Input
                      id="place_of_birth"
                      placeholder="Place of birth"
                      value={formData.place_of_birth}
                      onChange={e =>
                        setFormData(prev => ({
                          ...prev,
                          place_of_birth: e.target.value,
                        }))
                      }
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="hometown">Hometown</Label>
                    <Input
                      id="hometown"
                      placeholder="Hometown"
                      value={formData.hometown}
                      onChange={e =>
                        setFormData(prev => ({
                          ...prev,
                          hometown: e.target.value,
                        }))
                      }
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="tribe">Tribe / Ethnicity</Label>
                    <Input
                      id="tribe"
                      placeholder="Tribe"
                      value={formData.tribe}
                      onChange={e =>
                        setFormData(prev => ({
                          ...prev,
                          tribe: e.target.value,
                        }))
                      }
                      className="mt-1"
                    />
                  </div>
                </div>

                <Separator />

                {/* ── Contact Information ── */}
                <div>
                  <h4 className="text-sm font-semibold text-slate-700 mb-3">
                    Contact Information
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="phone">Guardian&apos;s Phone</Label>
                      <Input
                        id="phone"
                        placeholder="Guardian contact number"
                        value={formData.phone}
                        onChange={e =>
                          setFormData(prev => ({
                            ...prev,
                            phone: e.target.value,
                          }))
                        }
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="student_phone">Student&apos;s Phone</Label>
                      <Input
                        id="student_phone"
                        placeholder="Student's own number"
                        value={formData.student_phone}
                        onChange={e =>
                          setFormData(prev => ({
                            ...prev,
                            student_phone: e.target.value,
                          }))
                        }
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Student Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="Used for student login (lowercase)"
                        value={formData.email}
                        onChange={e =>
                          setFormData(prev => ({
                            ...prev,
                            email: e.target.value.toLowerCase(),
                          }))
                        }
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="emergency_contact">
                        Emergency Contact
                      </Label>
                      <Input
                        id="emergency_contact"
                        placeholder="Emergency contact number"
                        value={formData.emergency_contact}
                        onChange={e =>
                          setFormData(prev => ({
                            ...prev,
                            emergency_contact: e.target.value,
                          }))
                        }
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>

                {/* ── Address ── */}
                <div>
                  <Label htmlFor="address">Home Address</Label>
                  <Textarea
                    id="address"
                    placeholder="Full residential address"
                    value={formData.address}
                    onChange={e =>
                      setFormData(prev => ({ ...prev, address: e.target.value }))
                    }
                    className="mt-1"
                    rows={2}
                  />
                </div>

                {/* ── Navigation ── */}
                <div className="flex justify-end pt-4 border-t">
                  <Button onClick={() => setActiveTab('academic')}>
                    Next: Academic Info
                    <GraduationCap className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══════════════════════════════════════════════════════════════════
              TAB 2 — ACADEMIC INFORMATION
              ═══════════════════════════════════════════════════════════════════ */}
          <TabsContent value="academic">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <GraduationCap className="w-5 h-5 text-emerald-600" />
                  Academic Information
                </CardTitle>
                <CardDescription>
                  Assign the student to a class and provide academic background.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* ── Class / Section / Residence ── */}
                <div>
                  <h4 className="text-sm font-semibold text-slate-700 mb-3">
                    Class Enrollment
                    <span className="text-red-500 ml-1">*</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="classGroup">Class Group</Label>
                      <Select
                        value={group}
                        onValueChange={v => {
                          setGroup(v === '__all__' ? '' : v);
                          setAcademicData(prev => ({
                            ...prev,
                            class_id: '',
                            section_id: '',
                          }));
                        }}
                      >
                        <SelectTrigger id="classGroup" className="mt-1">
                          <SelectValue placeholder="Filter by group" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__all__">All Groups</SelectItem>
                          {CLASS_GROUPS.map(g => (
                            <SelectItem key={g} value={g}>
                              {g}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="class_id">
                        Class <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={academicData.class_id}
                        onValueChange={v =>
                          setAcademicData(prev => ({
                            ...prev,
                            class_id: v,
                            section_id: '',
                          }))
                        }
                      >
                        <SelectTrigger id="class_id" className="mt-1">
                          <SelectValue placeholder="Select class" />
                        </SelectTrigger>
                        <SelectContent>
                          {filteredClasses.map(c => (
                            <SelectItem
                              key={c.class_id}
                              value={String(c.class_id)}
                            >
                              {c.name}
                              <Badge variant="outline" className="ml-2 text-[10px]">
                                {c.category}
                              </Badge>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="section_id">
                        Section <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={academicData.section_id}
                        onValueChange={v =>
                          setAcademicData(prev => ({
                            ...prev,
                            section_id: v,
                          }))
                        }
                      >
                        <SelectTrigger id="section_id" className="mt-1">
                          <SelectValue placeholder="Select section" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">No Section</SelectItem>
                          {filteredSections.map(s => (
                            <SelectItem
                              key={s.section_id}
                              value={String(s.section_id)}
                            >
                              {s.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* ── Residence / Admission Date / Student Code ── */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="residence_type">Residence Type</Label>
                    <Select
                      value={academicData.residence_type}
                      onValueChange={v =>
                        setAcademicData(prev => ({
                          ...prev,
                          residence_type: v,
                        }))
                      }
                    >
                      <SelectTrigger id="residence_type" className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Day">Day</SelectItem>
                        <SelectItem value="Boarding">Boarding</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="admission_date">Admission Date</Label>
                    <Input
                      id="admission_date"
                      type="date"
                      value={academicData.admission_date}
                      onChange={e =>
                        setAcademicData(prev => ({
                          ...prev,
                          admission_date: e.target.value,
                        }))
                      }
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="student_code">Student Code</Label>
                    <Input
                      id="student_code"
                      placeholder="Auto-generated"
                      value={academicData.student_code}
                      onChange={e =>
                        setAcademicData(prev => ({
                          ...prev,
                          student_code: e.target.value,
                        }))
                      }
                      className="mt-1 font-mono text-sm"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      Auto-generated but editable
                    </p>
                  </div>
                </div>

                <Separator />

                {/* ── Former School / Class Reached ── */}
                <div>
                  <h4 className="text-sm font-semibold text-slate-700 mb-3">
                    Previous Education
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="former_school">Former School</Label>
                      <Input
                        id="former_school"
                        placeholder="Previous school attended"
                        value={academicData.former_school}
                        onChange={e =>
                          setAcademicData(prev => ({
                            ...prev,
                            former_school: e.target.value,
                          }))
                        }
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="class_reached">Class Reached</Label>
                      <Input
                        id="class_reached"
                        placeholder="Last class completed"
                        value={academicData.class_reached}
                        onChange={e =>
                          setAcademicData(prev => ({
                            ...prev,
                            class_reached: e.target.value,
                          }))
                        }
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>

                {/* ── Navigation ── */}
                <div className="flex justify-between pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => setActiveTab('personal')}
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Personal Info
                  </Button>
                  <Button onClick={() => setActiveTab('guardian')}>
                    Next: Guardian Info
                    <Users className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══════════════════════════════════════════════════════════════════
              TAB 3 — PARENT / GUARDIAN INFORMATION
              ═══════════════════════════════════════════════════════════════════ */}
          <TabsContent value="guardian">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Users className="w-5 h-5 text-emerald-600" />
                  Parent / Guardian Information
                </CardTitle>
                <CardDescription>
                  Link to an existing guardian or create a new one. Provide
                  father and mother details separately.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* ── Select Existing Parent ── */}
                <div>
                  <Label htmlFor="parent_select">Select Existing Guardian</Label>
                  <div className="flex gap-2 mt-1">
                    <div className="flex-1">
                      <Select
                        value={academicData.parent_id}
                        onValueChange={v => {
                          setAcademicData(prev => ({
                            ...prev,
                            parent_id: v,
                          }));
                          if (v && v !== '0') {
                            const p = parents.find(
                              x => String(x.parent_id) === v
                            );
                            if (p) {
                              setParentData(prev => ({
                                ...prev,
                                name: p.name,
                                phone: p.phone,
                                email: p.email,
                              }));
                            }
                          } else {
                            setParentData({
                              name: '',
                              phone: '',
                              email: '',
                              profession: '',
                              guardian_gender: 'Male',
                              address: '',
                              father_name: '',
                              father_phone: '',
                              father_occupation: '',
                              mother_name: '',
                              mother_phone: '',
                              mother_occupation: '',
                              parent_email: '',
                            });
                          }
                        }}
                      >
                        <SelectTrigger id="parent_select">
                          <SelectValue placeholder="Search or select parent" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">
                            — Create New Parent —
                          </SelectItem>
                          {parents
                            .filter(
                              p =>
                                !searchParent ||
                                p.name
                                  .toLowerCase()
                                  .includes(searchParent.toLowerCase())
                            )
                            .map(p => (
                              <SelectItem
                                key={p.parent_id}
                                value={String(p.parent_id)}
                              >
                                {p.name} ({p.phone})
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Input
                      placeholder="Filter parents..."
                      value={searchParent}
                      onChange={e => setSearchParent(e.target.value)}
                      className="w-48"
                    />
                  </div>
                </div>

                <Separator />

                {/* ── New Parent Details ── */}
                {!academicData.parent_id || academicData.parent_id === '0' ? (
                  <>
                    {/* Parent / Guardian */}
                    <div>
                      <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                        Guardian Details
                        {!parentData.name && (
                          <Badge
                            variant="outline"
                            className="text-amber-600 border-amber-300 text-[10px]"
                          >
                            Required to create new
                          </Badge>
                        )}
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="guardian_name">
                            Guardian Name{' '}
                            <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="guardian_name"
                            placeholder="Full name"
                            value={parentData.name}
                            onChange={e =>
                              setParentData(prev => ({
                                ...prev,
                                name: e.target.value,
                              }))
                            }
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="guardian_phone">Phone</Label>
                          <Input
                            id="guardian_phone"
                            placeholder="Phone number"
                            value={parentData.phone}
                            onChange={e =>
                              setParentData(prev => ({
                                ...prev,
                                phone: e.target.value,
                              }))
                            }
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="guardian_email">Email</Label>
                          <Input
                            id="guardian_email"
                            type="email"
                            placeholder="Email address"
                            value={parentData.email}
                            onChange={e =>
                              setParentData(prev => ({
                                ...prev,
                                email: e.target.value,
                              }))
                            }
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="guardian_profession">Profession</Label>
                          <Input
                            id="guardian_profession"
                            placeholder="Profession / Occupation"
                            value={parentData.profession}
                            onChange={e =>
                              setParentData(prev => ({
                                ...prev,
                                profession: e.target.value,
                              }))
                            }
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="guardian_gender">Gender</Label>
                          <Select
                            value={parentData.guardian_gender}
                            onValueChange={v =>
                              setParentData(prev => ({
                                ...prev,
                                guardian_gender: v,
                              }))
                            }
                          >
                            <SelectTrigger id="guardian_gender" className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Male">Male</SelectItem>
                              <SelectItem value="Female">Female</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="guardian_address">Address</Label>
                          <Input
                            id="guardian_address"
                            placeholder="Residential address"
                            value={parentData.address}
                            onChange={e =>
                              setParentData(prev => ({
                                ...prev,
                                address: e.target.value,
                              }))
                            }
                            className="mt-1"
                          />
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Father Details */}
                    <div>
                      <h4 className="text-sm font-semibold text-slate-700 mb-3">
                        Father&apos;s Details
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="father_name">Father&apos;s Name</Label>
                          <Input
                            id="father_name"
                            placeholder="Father's full name"
                            value={parentData.father_name}
                            onChange={e =>
                              setParentData(prev => ({
                                ...prev,
                                father_name: e.target.value,
                              }))
                            }
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="father_phone">Father&apos;s Phone</Label>
                          <Input
                            id="father_phone"
                            placeholder="Phone number"
                            value={parentData.father_phone}
                            onChange={e =>
                              setParentData(prev => ({
                                ...prev,
                                father_phone: e.target.value,
                              }))
                            }
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="father_occupation">
                            Father&apos;s Occupation
                          </Label>
                          <Input
                            id="father_occupation"
                            placeholder="Occupation"
                            value={parentData.father_occupation}
                            onChange={e =>
                              setParentData(prev => ({
                                ...prev,
                                father_occupation: e.target.value,
                              }))
                            }
                            className="mt-1"
                          />
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Mother Details */}
                    <div>
                      <h4 className="text-sm font-semibold text-slate-700 mb-3">
                        Mother&apos;s Details
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="mother_name">Mother&apos;s Name</Label>
                          <Input
                            id="mother_name"
                            placeholder="Mother's full name"
                            value={parentData.mother_name}
                            onChange={e =>
                              setParentData(prev => ({
                                ...prev,
                                mother_name: e.target.value,
                              }))
                            }
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="mother_phone">Mother&apos;s Phone</Label>
                          <Input
                            id="mother_phone"
                            placeholder="Phone number"
                            value={parentData.mother_phone}
                            onChange={e =>
                              setParentData(prev => ({
                                ...prev,
                                mother_phone: e.target.value,
                              }))
                            }
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="mother_occupation">
                            Mother&apos;s Occupation
                          </Label>
                          <Input
                            id="mother_occupation"
                            placeholder="Occupation"
                            value={parentData.mother_occupation}
                            onChange={e =>
                              setParentData(prev => ({
                                ...prev,
                                mother_occupation: e.target.value,
                              }))
                            }
                            className="mt-1"
                          />
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Alternative Parent Email */}
                    <div>
                      <Label htmlFor="parent_email">
                        Alternative Parent Email
                      </Label>
                      <Input
                        id="parent_email"
                        type="email"
                        placeholder="Additional email for parent communications"
                        value={parentData.parent_email}
                        onChange={e =>
                          setParentData(prev => ({
                            ...prev,
                            parent_email: e.target.value,
                          }))
                        }
                        className="mt-1 max-w-md"
                      />
                    </div>
                  </>
                ) : (
                  /* Existing parent selected */
                  <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-4">
                    <div className="flex items-center gap-2 text-emerald-700">
                      <CheckCircle2 className="w-5 h-5" />
                      <span className="font-medium">
                        Linked to existing guardian
                      </span>
                    </div>
                    <p className="text-sm text-emerald-600 mt-1">
                      {parentData.name} — {parentData.phone}
                      {parentData.email ? ` — ${parentData.email}` : ''}
                    </p>
                    <p className="text-xs text-emerald-500 mt-2">
                      Select &quot;Create New Parent&quot; to enter new guardian
                      details.
                    </p>
                  </div>
                )}

                {/* ── Navigation ── */}
                <div className="flex justify-between pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => setActiveTab('academic')}
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Academic Info
                  </Button>
                  <Button onClick={() => setActiveTab('medical')}>
                    Next: Medical Info
                    <Heart className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══════════════════════════════════════════════════════════════════
              TAB 4 — MEDICAL & SPECIAL NEEDS
              ═══════════════════════════════════════════════════════════════════ */}
          <TabsContent value="medical">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Heart className="w-5 h-5 text-emerald-600" />
                  Medical &amp; Special Needs
                </CardTitle>
                <CardDescription>
                  Record health information, allergies, and any special
                  requirements for the student.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* ── Health Insurance (NHIS) ── */}
                <div>
                  <h4 className="text-sm font-semibold text-slate-700 mb-3">
                    Health Insurance
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="nhis_number">NHIS Number</Label>
                      <Input
                        id="nhis_number"
                        placeholder="National Health Insurance number"
                        value={medicalData.nhis_number}
                        onChange={e =>
                          setMedicalData(prev => ({
                            ...prev,
                            nhis_number: e.target.value,
                          }))
                        }
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="nhis_status">NHIS Status</Label>
                      <Select
                        value={medicalData.nhis_status}
                        onValueChange={v =>
                          setMedicalData(prev => ({
                            ...prev,
                            nhis_status: v,
                          }))
                        }
                      >
                        <SelectTrigger id="nhis_status" className="mt-1">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          {NHIS_STATUSES.map(s => (
                            <SelectItem key={s.value} value={s.value}>
                              {s.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* ── Allergies & Medical Conditions ── */}
                <div>
                  <h4 className="text-sm font-semibold text-slate-700 mb-3">
                    Medical History
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="allergies">Allergies</Label>
                      <Textarea
                        id="allergies"
                        placeholder="List any known allergies (food, medication, environmental)"
                        value={medicalData.allergies}
                        onChange={e =>
                          setMedicalData(prev => ({
                            ...prev,
                            allergies: e.target.value,
                          }))
                        }
                        className="mt-1"
                        rows={2}
                      />
                    </div>
                    <div>
                      <Label htmlFor="medical_conditions">
                        Medical Conditions
                      </Label>
                      <Textarea
                        id="medical_conditions"
                        placeholder="List any chronic conditions or ongoing treatments"
                        value={medicalData.medical_conditions}
                        onChange={e =>
                          setMedicalData(prev => ({
                            ...prev,
                            medical_conditions: e.target.value,
                          }))
                        }
                        className="mt-1"
                        rows={2}
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* ── Toggles: Disability & Special Diet ── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <Label
                        htmlFor="disability_status"
                        className="text-sm font-medium"
                      >
                        Disability
                      </Label>
                      <p className="text-xs text-slate-500">
                        Does the student have any disability?
                      </p>
                    </div>
                    <Switch
                      id="disability_status"
                      checked={medicalData.disability_status}
                      onCheckedChange={checked =>
                        setMedicalData(prev => ({
                          ...prev,
                          disability_status: checked,
                        }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <Label
                        htmlFor="special_diet"
                        className="text-sm font-medium"
                      >
                        Special Diet
                      </Label>
                      <p className="text-xs text-slate-500">
                        Does the student require a special diet?
                      </p>
                    </div>
                    <Switch
                      id="special_diet"
                      checked={medicalData.special_diet}
                      onCheckedChange={checked =>
                        setMedicalData(prev => ({
                          ...prev,
                          special_diet: checked,
                        }))
                      }
                    />
                  </div>
                </div>

                {/* ── Special Diet Details ── */}
                {medicalData.special_diet && (
                  <div>
                    <Label htmlFor="student_special_diet_details">
                      Special Diet Details
                    </Label>
                    <Textarea
                      id="student_special_diet_details"
                      placeholder="Describe the special dietary requirements"
                      value={medicalData.student_special_diet_details}
                      onChange={e =>
                        setMedicalData(prev => ({
                          ...prev,
                          student_special_diet_details: e.target.value,
                        }))
                      }
                      className="mt-1"
                      rows={2}
                    />
                  </div>
                )}

                {/* ── Special Needs ── */}
                <div>
                  <Label htmlFor="special_needs">Special Needs</Label>
                  <Textarea
                    id="special_needs"
                    placeholder="Describe any special needs, learning support requirements, or accommodations"
                    value={medicalData.special_needs}
                    onChange={e =>
                      setMedicalData(prev => ({
                        ...prev,
                        special_needs: e.target.value,
                      }))
                    }
                    className="mt-1"
                    rows={3}
                  />
                </div>

                {/* ── Navigation ── */}
                <div className="flex justify-between pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => setActiveTab('guardian')}
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Guardian Info
                  </Button>
                  <Button onClick={() => setActiveTab('photo')}>
                    Next: Photo
                    <Camera className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══════════════════════════════════════════════════════════════════
              TAB 5 — PHOTO UPLOAD
              ═══════════════════════════════════════════════════════════════════ */}
          <TabsContent value="photo">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Camera className="w-5 h-5 text-emerald-600" />
                  Student Photo
                </CardTitle>
                <CardDescription>
                  Upload a passport-size photo for the student. JPG, PNG, or
                  WEBP up to 5 MB.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* ── Photo Upload Area ── */}
                <div
                  className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-emerald-400 hover:bg-emerald-50/30 transition-colors cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      fileInputRef.current?.click();
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  aria-label="Upload student photo"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handlePhotoChange}
                  />

                  {photoPreview ? (
                    <div className="space-y-4">
                      <div className="mx-auto w-40 h-40 rounded-xl overflow-hidden border-4 border-slate-200 shadow-sm">
                        <img
                          src={photoPreview}
                          alt="Student photo preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-700">
                          {photoFile?.name}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Click to change photo
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={e => {
                          e.stopPropagation();
                          setPhotoPreview(null);
                          setPhotoFile(null);
                          if (fileInputRef.current) {
                            fileInputRef.current.value = '';
                          }
                        }}
                      >
                        Remove Photo
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="mx-auto w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
                        <Camera className="w-7 h-7 text-slate-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-600">
                          Click to upload student photo
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          JPG, PNG or WEBP (max 5 MB)
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* ── Info Note ── */}
                <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-amber-700">
                    Photo upload is optional. You can add or update the photo
                    later from the student&apos;s profile. The photo will be
                    saved and linked to the student record after enrollment.
                  </p>
                </div>

                {/* ── Navigation ── */}
                <div className="flex justify-between pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => setActiveTab('medical')}
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Medical Info
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* ═══════════════════════════════════════════════════════════════════
            SUBMIT BAR
            ═══════════════════════════════════════════════════════════════════ */}
        <div className="sticky bottom-0 bg-white/80 backdrop-blur-sm border-t rounded-b-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-slate-400">
            Sections marked with <span className="text-red-500">*</span> are
            required. Review all tabs before submitting.
          </p>
          <div className="flex gap-3">
            <Button variant="outline" asChild>
              <Link href="/admin/students">Cancel</Link>
            </Button>
            <Button
              onClick={handleSave}
              disabled={
                saving ||
                !formData.first_name ||
                !formData.last_name ||
                !academicData.class_id
              }
              className="bg-emerald-600 hover:bg-emerald-700 min-w-[160px]"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Enrolling...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Enroll Student
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
