'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  ArrowLeft, UserPlus, GraduationCap, Users, Heart, Camera,
  Loader2, ShieldCheck, RotateCcw, AlertTriangle,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// ─── Constants ───────────────────────────────────────────────────────────────

const CLASS_GROUPS = ['CRECHE', 'NURSERY', 'KG', 'BASIC', 'JHS'];

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as const;

// ─── Types ───────────────────────────────────────────────────────────────────

interface ClassItem {
  class_id: number;
  name: string;
  name_numeric: number;
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
  profession: string;
  address: string;
  father_name: string;
  father_phone: string;
  mother_name: string;
  mother_phone: string;
}

// ─── Helper: generate student code ───────────────────────────────────────────

function generateStudentCode(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `STU${year}${random}`;
}

// ─── Section Card Wrapper ────────────────────────────────────────────────────

function SectionCard({
  icon,
  title,
  children,
  accentColor = 'cyan',
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  accentColor?: string;
}) {
  const gradientMap: Record<string, string> = {
    cyan: 'bg-gradient-to-r from-cyan-500 to-sky-400',
    emerald: 'bg-gradient-to-r from-emerald-500 to-teal-400',
    amber: 'bg-gradient-to-r from-amber-500 to-yellow-400',
    purple: 'bg-gradient-to-r from-purple-500 to-fuchsia-400',
    rose: 'bg-gradient-to-r from-rose-500 to-pink-400',
    slate: 'bg-gradient-to-r from-slate-600 to-slate-500',
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div
        className={`${gradientMap[accentColor] || gradientMap.cyan} px-5 py-3 flex items-center gap-2.5`}
      >
        <span className="text-white">{icon}</span>
        <h3 className="text-white font-bold text-base">{title}</h3>
      </div>
      <div className="p-5 md:p-6">{children}</div>
    </div>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function AdmitStudentPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Loading / saving state ──
  const [saving, setSaving] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  // ── Reference data ──
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [sections, setSections] = useState<SectionItem[]>([]);
  const [parents, setParents] = useState<ParentItem[]>([]);
  const [filteredSections, setFilteredSections] = useState<SectionItem[]>([]);

  // ── Filters ──
  const [classGroup, setClassGroup] = useState('');

  // ── Photo ──
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  // ── Personal Information ──
  const [form, setForm] = useState({
    first_name: '',
    middle_name: '',
    last_name: '',
    name: '',
    sex: '',
    birthday: '',
    blood_group: '',
    nationality: 'Ghanaian',
    ghana_card_id: '',
    place_of_birth: '',
    hometown: '',
    tribe: '',
    religion: '',
    custom_religion: '',
    student_phone: '',
    email: '',
    address: '',
    emergency_contact: '',
  });

  // ── Academic Information ──
  const [academic, setAcademic] = useState({
    student_code: generateStudentCode(),
    class_id: '',
    section_id: '',
    admission_date: new Date().toISOString().split('T')[0],
    former_school: '',
    class_reached: '',
    residence_type: 'Day',
    username: '',
    password: '123456',
  });

  // ── Parent / Guardian ──
  const [parentMode, setParentMode] = useState<'none' | 'existing' | 'new'>('none');
  const [selectedParentId, setSelectedParentId] = useState('');
  const [guardianType, setGuardianType] = useState('');
  const [guardianFields, setGuardianFields] = useState({
    phone: '',
    email: '',
    occupation: '',
    address: '',
  });
  const [fatherFields, setFatherFields] = useState({
    name: '',
    phone: '',
    occupation: '',
  });
  const [motherFields, setMotherFields] = useState({
    name: '',
    phone: '',
    occupation: '',
  });

  // ── Medical ──
  const [medical, setMedical] = useState({
    allergies: '',
    medical_conditions: '',
    nhis_number: '',
    nhis_status: 'pending',
    disability_status: 0,
    special_needs: '',
    learning_support: '',
    digital_literacy: 'beginner',
    home_technology_access: 0,
    special_diet: 0,
    student_special_diet_details: '',
  });

  // ── Password visibility ──
  const [showPassword, setShowPassword] = useState(false);

  // ── Fetch reference data ──
  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [classesRes, sectionsRes, parentsRes] = await Promise.all([
          fetch('/api/classes?limit=200'),
          fetch('/api/sections'),
          fetch('/api/parents?limit=500'),
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
    const fn = form.first_name || '';
    const mn = form.middle_name || '';
    const ln = form.last_name || '';
    const fullName = `${fn} ${mn} ${ln}`.replace(/\s+/g, ' ').trim().toUpperCase();
    setForm(prev => ({ ...prev, name: fullName }));
  }, [form.first_name, form.middle_name, form.last_name]);

  // ── Sync username with student_code ──
  useEffect(() => {
    setAcademic(prev => ({ ...prev, username: prev.student_code }));
  }, [academic.student_code]);

  // ── Filter sections when class changes ──
  useEffect(() => {
    if (academic.class_id) {
      setFilteredSections(
        sections.filter(s => s.class_id === parseInt(academic.class_id))
      );
    } else {
      setFilteredSections([]);
    }
  }, [academic.class_id, sections]);

  const filteredClasses = classGroup
    ? classes.filter(c => c.category === classGroup)
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
      reader.onloadend = () => setPhotoPreview(reader.result as string);
      reader.readAsDataURL(file);
    },
    []
  );

  // ── When parent selected + guardian type changed, auto-populate ──
  const handleParentSelect = (parentId: string) => {
    if (parentId === '__placeholder__') {
      setParentMode('none');
      setSelectedParentId('');
      setGuardianType('');
      clearAllParentFields();
      return;
    }
    if (parentId === '__new__') {
      setParentMode('new');
      setSelectedParentId('');
      setGuardianType('');
      clearAllParentFields();
      return;
    }
    if (parentId) {
      setParentMode('existing');
      setSelectedParentId(parentId);
    } else {
      setParentMode('none');
      setSelectedParentId('');
      setGuardianType('');
      clearAllParentFields();
    }
  };

  const handleGuardianTypeChange = (type: string) => {
    setGuardianType(type);
    const parent = parents.find(p => String(p.parent_id) === selectedParentId);
    if (!parent) {
      clearAllParentFields();
      return;
    }

    if (type === 'father') {
      setFatherFields({ name: parent.father_name || parent.name, phone: parent.father_phone || parent.phone, occupation: '' });
      setMotherFields({ name: '', phone: '', occupation: '' });
      setGuardianFields({ phone: '', email: parent.email || '', occupation: parent.profession || '', address: parent.address || '' });
    } else if (type === 'mother') {
      setMotherFields({ name: parent.mother_name || parent.name, phone: parent.mother_phone || parent.phone, occupation: '' });
      setFatherFields({ name: '', phone: '', occupation: '' });
      setGuardianFields({ phone: '', email: parent.email || '', occupation: parent.profession || '', address: parent.address || '' });
    } else if (type === 'other') {
      setGuardianFields({ phone: parent.phone || '', email: parent.email || '', occupation: parent.profession || '', address: parent.address || '' });
      setFatherFields({ name: '', phone: '', occupation: '' });
      setMotherFields({ name: '', phone: '', occupation: '' });
    }
  };

  const clearAllParentFields = () => {
    setFatherFields({ name: '', phone: '', occupation: '' });
    setMotherFields({ name: '', phone: '', occupation: '' });
    setGuardianFields({ phone: '', email: '', occupation: '', address: '' });
  };

  // ── Validation ──
  const validate = (): boolean => {
    if (!form.first_name.trim()) {
      toast.error('First Name is required');
      return false;
    }
    if (!form.last_name.trim()) {
      toast.error('Last Name is required');
      return false;
    }
    if (!form.sex) {
      toast.error('Gender is required');
      return false;
    }
    if (!academic.class_id) {
      toast.error('Class selection is required');
      return false;
    }
    if (!academic.section_id) {
      toast.error('Section selection is required');
      return false;
    }
    if (parentMode === 'none') {
      toast.error('Please select a guardian or register a new one');
      return false;
    }
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      toast.error('Please enter a valid email address');
      return false;
    }
    return true;
  };

  // ── Submit handler ──
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    try {
      let parentId: number | null = null;

      // Step 1: Create new parent if needed
      if (parentMode === 'new') {
        const parentRes = await fetch('/api/parents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: guardianFields.phone ? `Guardian of ${form.name}` : form.name,
            phone: guardianFields.phone,
            email: guardianFields.email,
            profession: guardianFields.occupation,
            address: guardianFields.address,
            father_name: fatherFields.name,
            father_phone: fatherFields.phone,
            mother_name: motherFields.name,
            mother_phone: motherFields.phone,
          }),
        });
        const parentJson = await parentRes.json();
        if (parentJson.error) {
          toast.error(`Failed to create guardian: ${parentJson.error}`);
          return;
        }
        parentId = parentJson.parent_id || null;
      } else if (parentMode === 'existing') {
        parentId = parseInt(selectedParentId);
      }

      // Step 2: Create student
      const payload = {
        // Personal
        first_name: form.first_name,
        middle_name: form.middle_name,
        last_name: form.last_name,
        name: form.name,
        sex: form.sex,
        birthday: form.birthday || null,
        religion: form.religion === 'Others' ? form.custom_religion : form.religion,
        blood_group: form.blood_group,
        nationality: form.nationality,
        ghana_card_id: form.ghana_card_id,
        place_of_birth: form.place_of_birth,
        hometown: form.hometown,
        tribe: form.tribe,
        student_phone: form.student_phone,
        email: form.email.toLowerCase().trim(),
        address: form.address,
        emergency_contact: form.emergency_contact,

        // Academic
        student_code: academic.student_code,
        class_id: academic.class_id,
        section_id: academic.section_id,
        admission_date: academic.admission_date,
        former_school: academic.former_school,
        class_reached: academic.class_reached,
        residence_type: academic.residence_type,

        // Login
        username: academic.student_code,
        password: academic.password,

        // Medical
        allergies: medical.allergies,
        medical_conditions: medical.medical_conditions,
        nhis_number: medical.nhis_number,
        nhis_status: medical.nhis_status,
        disability_status: medical.disability_status,
        special_needs: medical.special_needs,
        special_diet: medical.special_diet,
        student_special_diet_details: medical.student_special_diet_details,

        // Parent
        parent_id: parentId ? String(parentId) : null,

        // Parent details for update
        father_name: fatherFields.name,
        father_phone: fatherFields.phone,
        mother_name: motherFields.name,
        mother_phone: motherFields.phone,
        phone: guardianFields.phone,
        parent_email: guardianFields.email,
      };

      const res = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (data.error) {
        throw new Error(data.error);
      }

      toast.success('Student admitted successfully!');
      router.push('/admin/students');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to admit student';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  // ── Loading skeleton ──
  if (loadingData) {
    return (
      <DashboardLayout>
        <div className="space-y-6 max-w-5xl mx-auto px-4 md:px-6">
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

  // ── Helpers for updating nested state ──
  const sf = (field: string, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }));
  const sa = (field: string, value: string) =>
    setAcademic(prev => ({ ...prev, [field]: value }));
  const sm = (field: string, value: string | number) =>
    setMedical(prev => ({ ...prev, [field]: value }));

  // ── Render ──
  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto px-4 md:px-6 pb-24">
        {/* ── Header ── */}
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/students">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <GraduationCap className="w-6 h-6 text-cyan-600" />
              Student Admission Form
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Complete all required fields to admit a new student
            </p>
          </div>
        </div>

        {/* ── Important Note ── */}
        <div className="bg-amber-50 border border-amber-200 border-l-4 border-l-amber-500 rounded-lg px-4 py-3 mb-6">
          <p className="text-sm text-amber-800">
            <AlertTriangle className="inline w-4 h-4 mr-1 -mt-0.5" />
            <strong>Important:</strong> Admitting new students will automatically create an enrollment
            to the selected class in the running session. Please verify all information before submission.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* ═══════════════════════════════════════════════════════════════════
              SECTION 1 — PERSONAL INFORMATION
              ═══════════════════════════════════════════════════════════════════ */}
          <SectionCard
            icon={<UserPlus className="w-5 h-5" />}
            title="Personal Information"
            accentColor="cyan"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Name fields */}
              <div>
                <Label htmlFor="first_name">First Name <span className="text-red-500">*</span></Label>
                <Input id="first_name" placeholder="Enter first name" value={form.first_name} onChange={e => sf('first_name', e.target.value)} className="mt-1" required />
              </div>
              <div>
                <Label htmlFor="middle_name">Middle Name</Label>
                <Input id="middle_name" placeholder="Enter middle name" value={form.middle_name} onChange={e => sf('middle_name', e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="last_name">Last Name <span className="text-red-500">*</span></Label>
                <Input id="last_name" placeholder="Enter last name" value={form.last_name} onChange={e => sf('last_name', e.target.value)} className="mt-1" required />
              </div>

              {/* Generated name preview */}
              <div className="sm:col-span-2 lg:col-span-3">
                <div className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-2">
                  <p className="text-xs text-slate-500 mb-0.5">Generated Full Name</p>
                  <p className="text-sm font-bold text-slate-800 uppercase tracking-wide">{form.name || '—'}</p>
                </div>
              </div>

              {/* Gender / DOB / Blood Group */}
              <div>
                <Label htmlFor="sex">Gender <span className="text-red-500">*</span></Label>
                <Select value={form.sex} onValueChange={v => sf('sex', v)}>
                  <SelectTrigger id="sex" className="mt-1"><SelectValue placeholder="Select Gender" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="birthday">Date of Birth</Label>
                <Input id="birthday" type="date" value={form.birthday} onChange={e => sf('birthday', e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="blood_group">Blood Group</Label>
                <Select value={form.blood_group} onValueChange={v => sf('blood_group', v)}>
                  <SelectTrigger id="blood_group" className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {BLOOD_GROUPS.map(bg => (
                      <SelectItem key={bg} value={bg}>{bg}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Nationality / Ghana Card / Place of Birth */}
              <div>
                <Label htmlFor="nationality">Nationality</Label>
                <Input id="nationality" placeholder="Nationality" value={form.nationality} onChange={e => sf('nationality', e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="ghana_card_id">Ghana Card ID</Label>
                <Input id="ghana_card_id" placeholder="GHA-XXXXXXXXX-X" value={form.ghana_card_id} onChange={e => sf('ghana_card_id', e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="place_of_birth">Place of Birth</Label>
                <Input id="place_of_birth" placeholder="Enter place of birth" value={form.place_of_birth} onChange={e => sf('place_of_birth', e.target.value)} className="mt-1" />
              </div>

              {/* Hometown / Tribe / Religion */}
              <div>
                <Label htmlFor="hometown">Hometown</Label>
                <Input id="hometown" placeholder="Enter hometown" value={form.hometown} onChange={e => sf('hometown', e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="tribe">Tribe</Label>
                <Input id="tribe" placeholder="Enter tribe" value={form.tribe} onChange={e => sf('tribe', e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="religion">Religion</Label>
                <Select value={form.religion} onValueChange={v => sf('religion', v)}>
                  <SelectTrigger id="religion" className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Christianity">Christianity</SelectItem>
                    <SelectItem value="Islam">Islam</SelectItem>
                    <SelectItem value="Traditional">Traditional</SelectItem>
                    <SelectItem value="Others">Others</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {form.religion === 'Others' && (
                <div className="sm:col-span-2 lg:col-span-3">
                  <Label htmlFor="custom_religion">Specify Religion</Label>
                  <Input id="custom_religion" placeholder="Please specify..." value={form.custom_religion} onChange={e => sf('custom_religion', e.target.value)} className="mt-1" />
                </div>
              )}

              {/* Contact info */}
              <div>
                <Label htmlFor="student_phone">Student Phone</Label>
                <Input id="student_phone" type="tel" placeholder="Student phone" value={form.student_phone} onChange={e => sf('student_phone', e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" type="email" placeholder="student@example.com" value={form.email} onChange={e => sf('email', e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="address">Residential Address</Label>
                <Input id="address" placeholder="Enter address" value={form.address} onChange={e => sf('address', e.target.value)} className="mt-1" />
              </div>
            </div>
          </SectionCard>

          {/* ═══════════════════════════════════════════════════════════════════
              SECTION 2 — STUDENT PHOTO
              ═══════════════════════════════════════════════════════════════════ */}
          <SectionCard
            icon={<Camera className="w-5 h-5" />}
            title="Student Photo"
            accentColor="emerald"
          >
            <div className="flex flex-col items-center gap-4">
              <div className="relative w-36 h-36 rounded-xl border-3 border-dashed border-slate-300 bg-slate-50 flex items-center justify-center overflow-hidden">
                {photoPreview ? (
                  <img src={photoPreview} alt="Student" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center text-slate-400">
                    <UserPlus className="w-10 h-10 mx-auto mb-1 opacity-40" />
                    <p className="text-xs">No photo</p>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                  <Camera className="w-4 h-4 mr-1.5" />
                  {photoPreview ? 'Change Photo' : 'Select Photo'}
                </Button>
                {photoPreview && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => { setPhotoPreview(null); setPhotoFile(null); }}>
                    Remove
                  </Button>
                )}
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
              <p className="text-xs text-slate-400">Accepted formats: JPG, PNG. Max size: 5 MB</p>
            </div>
          </SectionCard>

          {/* ═══════════════════════════════════════════════════════════════════
              SECTION 3 — ACADEMIC INFORMATION
              ═══════════════════════════════════════════════════════════════════ */}
          <SectionCard
            icon={<GraduationCap className="w-5 h-5" />}
            title="Academic Information"
            accentColor="amber"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Student Code */}
              <div>
                <Label htmlFor="student_code">Student ID <span className="text-red-500">*</span></Label>
                <Input id="student_code" value={academic.student_code} onChange={e => sa('student_code', e.target.value)} className="mt-1 font-mono text-sm" readOnly />
              </div>

              {/* Class Group / Class / Section */}
              <div>
                <Label htmlFor="classGroup">Class Group</Label>
                <Select value={classGroup || '__all__'} onValueChange={v => {
                  setClassGroup(v === '__all__' ? '' : v);
                  sa('class_id', '');
                  sa('section_id', '');
                }}>
                  <SelectTrigger id="classGroup" className="mt-1"><SelectValue placeholder="All Groups" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">All Groups</SelectItem>
                    {CLASS_GROUPS.map(g => (
                      <SelectItem key={g} value={g}>{g}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="class_id">Class to Enroll <span className="text-red-500">*</span></Label>
                <Select value={academic.class_id} onValueChange={v => { sa('class_id', v); sa('section_id', ''); }}>
                  <SelectTrigger id="class_id" className="mt-1"><SelectValue placeholder="Select Class" /></SelectTrigger>
                  <SelectContent>
                    {filteredClasses.map(c => (
                      <SelectItem key={c.class_id} value={String(c.class_id)}>
                        {c.name}
                        <span className="ml-1.5 text-[10px] text-muted-foreground">({c.category})</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="section_id">Section <span className="text-red-500">*</span></Label>
                <Select value={academic.section_id} onValueChange={v => sa('section_id', v)}>
                  <SelectTrigger id="section_id" className="mt-1"><SelectValue placeholder={academic.class_id ? 'Select Section' : 'Select Class First'} /></SelectTrigger>
                  <SelectContent>
                    {filteredSections.map(s => (
                      <SelectItem key={s.section_id} value={String(s.section_id)}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Admission Date */}
              <div>
                <Label htmlFor="admission_date">Admission Date</Label>
                <Input id="admission_date" type="date" value={academic.admission_date} onChange={e => sa('admission_date', e.target.value)} className="mt-1" />
              </div>

              {/* Previous Education */}
              <div>
                <Label htmlFor="former_school">Former School</Label>
                <Input id="former_school" placeholder="Previous school" value={academic.former_school} onChange={e => sa('former_school', e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="class_reached">Class Reached</Label>
                <Input id="class_reached" placeholder="Last class completed" value={academic.class_reached} onChange={e => sa('class_reached', e.target.value)} className="mt-1" />
              </div>
            </div>
          </SectionCard>

          {/* ═══════════════════════════════════════════════════════════════════
              SECTION 4 — PARENT / GUARDIAN INFORMATION
              ═══════════════════════════════════════════════════════════════════ */}
          <SectionCard
            icon={<Users className="w-5 h-5" />}
            title="Parent / Guardian Information"
            accentColor="purple"
          >
            <div className="space-y-5">
              {/* Guardian Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="parent_id">Primary Guardian <span className="text-red-500">*</span></Label>
                  <Select value={parentMode === 'none' ? '__placeholder__' : parentMode === 'new' ? '__new__' : selectedParentId} onValueChange={handleParentSelect}>
                    <SelectTrigger id="parent_id" className="mt-1"><SelectValue placeholder="Search or select guardian..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__placeholder__">— Select Guardian —</SelectItem>
                      <SelectItem value="__new__">➕ Register New Guardian</SelectItem>
                      {parents.map(p => (
                        <SelectItem key={p.parent_id} value={String(p.parent_id)}>
                          {p.name}
                          {p.phone ? ` • ${p.phone}` : ''}
                          {p.profession ? ` • ${p.profession}` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {parentMode === 'existing' && (
                  <div>
                    <Label htmlFor="guardian_type">Guardian is the <span className="text-red-500">*</span></Label>
                    <Select value={guardianType} onValueChange={handleGuardianTypeChange}>
                      <SelectTrigger id="guardian_type" className="mt-1"><SelectValue placeholder="Select relationship..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="father">👨 Father</SelectItem>
                        <SelectItem value="mother">👩 Mother</SelectItem>
                        <SelectItem value="other">👤 Other Person</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              {/* Father's Information */}
              <div className="rounded-xl bg-blue-50 border border-blue-200 border-l-4 border-l-blue-500 p-4">
                <h4 className="text-sm font-bold text-blue-800 mb-3">👨 Father&apos;s Information</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="father_name">Father&apos;s Name</Label>
                    <Input id="father_name" placeholder="Enter father's name" value={fatherFields.name} onChange={e => setFatherFields(prev => ({ ...prev, name: e.target.value }))} className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="father_phone">Father&apos;s Phone</Label>
                    <Input id="father_phone" type="tel" placeholder="Enter father's phone" value={fatherFields.phone} onChange={e => setFatherFields(prev => ({ ...prev, phone: e.target.value }))} className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="father_occupation">Father&apos;s Occupation</Label>
                    <Input id="father_occupation" placeholder="Enter occupation" value={fatherFields.occupation} onChange={e => setFatherFields(prev => ({ ...prev, occupation: e.target.value }))} className="mt-1" />
                  </div>
                </div>
              </div>

              {/* Mother's Information */}
              <div className="rounded-xl bg-amber-50 border border-amber-200 border-l-4 border-l-amber-500 p-4">
                <h4 className="text-sm font-bold text-amber-800 mb-3">👩 Mother&apos;s Information</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="mother_name">Mother&apos;s Name</Label>
                    <Input id="mother_name" placeholder="Enter mother's name" value={motherFields.name} onChange={e => setMotherFields(prev => ({ ...prev, name: e.target.value }))} className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="mother_phone">Mother&apos;s Phone</Label>
                    <Input id="mother_phone" type="tel" placeholder="Enter mother's phone" value={motherFields.phone} onChange={e => setMotherFields(prev => ({ ...prev, phone: e.target.value }))} className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="mother_occupation">Mother&apos;s Occupation</Label>
                    <Input id="mother_occupation" placeholder="Enter occupation" value={motherFields.occupation} onChange={e => setMotherFields(prev => ({ ...prev, occupation: e.target.value }))} className="mt-1" />
                  </div>
                </div>
              </div>

              {/* Other Guardian Details (shown when guardian_type=other or parentMode=new) */}
              {(guardianType === 'other' || parentMode === 'new') && (
                <div className="rounded-xl bg-purple-50 border border-purple-200 border-l-4 border-l-purple-500 p-4">
                  <h4 className="text-sm font-bold text-purple-800 mb-3">👤 Guardian Details</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="guardian_phone">Guardian Phone</Label>
                      <Input id="guardian_phone" type="tel" placeholder="Enter guardian phone" value={guardianFields.phone} onChange={e => setGuardianFields(prev => ({ ...prev, phone: e.target.value }))} className="mt-1" />
                    </div>
                    <div>
                      <Label htmlFor="guardian_email">Guardian Email</Label>
                      <Input id="guardian_email" type="email" placeholder="guardian@example.com" value={guardianFields.email} onChange={e => setGuardianFields(prev => ({ ...prev, email: e.target.value }))} className="mt-1" />
                    </div>
                    <div>
                      <Label htmlFor="guardian_occupation">Guardian Occupation</Label>
                      <Input id="guardian_occupation" placeholder="Enter occupation" value={guardianFields.occupation} onChange={e => setGuardianFields(prev => ({ ...prev, occupation: e.target.value }))} className="mt-1" />
                    </div>
                    <div className="sm:col-span-2">
                      <Label htmlFor="guardian_address">Guardian Address</Label>
                      <Input id="guardian_address" placeholder="Enter address" value={guardianFields.address} onChange={e => setGuardianFields(prev => ({ ...prev, address: e.target.value }))} className="mt-1" />
                    </div>
                    <div>
                      <Label htmlFor="emergency_contact">Emergency Contact</Label>
                      <Input id="emergency_contact" type="tel" placeholder="Emergency contact" value={form.emergency_contact} onChange={e => sf('emergency_contact', e.target.value)} className="mt-1" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </SectionCard>

          {/* ═══════════════════════════════════════════════════════════════════
              SECTION 5 — MEDICAL & SPECIAL NEEDS
              ═══════════════════════════════════════════════════════════════════ */}
          <SectionCard
            icon={<Heart className="w-5 h-5" />}
            title="Medical & Special Needs"
            accentColor="rose"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="allergies">Allergies</Label>
                <Textarea id="allergies" rows={2} placeholder="List any allergies..." value={medical.allergies} onChange={e => sm('allergies', e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="medical_conditions">Medical Conditions</Label>
                <Textarea id="medical_conditions" rows={2} placeholder="List any medical conditions..." value={medical.medical_conditions} onChange={e => sm('medical_conditions', e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="nhis_number">NHIS Number</Label>
                <Input id="nhis_number" placeholder="Enter NHIS number" value={medical.nhis_number} onChange={e => sm('nhis_number', e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="nhis_status">NHIS Status</Label>
                <Select value={medical.nhis_status} onValueChange={v => sm('nhis_status', v)}>
                  <SelectTrigger id="nhis_status" className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="disability_status">Disability Status</Label>
                <Select value={String(medical.disability_status)} onValueChange={v => sm('disability_status', parseInt(v))}>
                  <SelectTrigger id="disability_status" className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">No Disability</SelectItem>
                    <SelectItem value="1">Has Disability</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="special_needs">Special Needs</Label>
                <Textarea id="special_needs" rows={2} placeholder="Describe any special needs..." value={medical.special_needs} onChange={e => sm('special_needs', e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="learning_support">Learning Support</Label>
                <Textarea id="learning_support" rows={2} placeholder="Describe learning support needs..." value={medical.learning_support} onChange={e => sm('learning_support', e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="digital_literacy">Digital Literacy Level</Label>
                <Select value={medical.digital_literacy} onValueChange={v => sm('digital_literacy', v)}>
                  <SelectTrigger id="digital_literacy" className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="home_technology_access">Home Technology Access</Label>
                <Select value={String(medical.home_technology_access)} onValueChange={v => sm('home_technology_access', parseInt(v))}>
                  <SelectTrigger id="home_technology_access" className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">No Access</SelectItem>
                    <SelectItem value="1">Has Access</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Special Diet */}
              <div className="flex items-center gap-3 py-2">
                <Switch checked={medical.special_diet === 1} onCheckedChange={checked => sm('special_diet', checked ? 1 : 0)} />
                <Label htmlFor="special_diet" className="cursor-pointer">On Special Diet</Label>
              </div>
              {medical.special_diet === 1 && (
                <div className="sm:col-span-2 lg:col-span-3">
                  <Label htmlFor="student_special_diet_details">Special Diet Details</Label>
                  <Textarea id="student_special_diet_details" rows={2} placeholder="Provide special diet details..." value={medical.student_special_diet_details} onChange={e => sm('student_special_diet_details', e.target.value)} className="mt-1" />
                </div>
              )}
            </div>
          </SectionCard>

          {/* ═══════════════════════════════════════════════════════════════════
              SECTION 6 — RESIDENCE TYPE
              ═══════════════════════════════════════════════════════════════════ */}
          <SectionCard
            icon={<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>}
            title="Residence Type"
            accentColor="slate"
          >
            <div className="max-w-xs">
              <Label htmlFor="residence_type">Residence Type <span className="text-red-500">*</span></Label>
              <Select value={academic.residence_type} onValueChange={v => sa('residence_type', v)}>
                <SelectTrigger id="residence_type" className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Day">Day Student</SelectItem>
                  <SelectItem value="Boarding">Boarding Student</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </SectionCard>

          {/* ═══════════════════════════════════════════════════════════════════
              SECTION 7 — LOGIN CREDENTIALS
              ═══════════════════════════════════════════════════════════════════ */}
          <SectionCard
            icon={<ShieldCheck className="w-5 h-5" />}
            title="Login Credentials"
            accentColor="cyan"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="username">Username</Label>
                <Input id="username" value={academic.username} readOnly className="mt-1 bg-slate-50 font-mono text-sm" />
                <p className="text-xs text-slate-400 mt-1">Auto-generated from Student ID</p>
              </div>
              <div>
                <Label htmlFor="password">Password <span className="text-red-500">*</span></Label>
                <div className="flex gap-1 mt-1">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={academic.password}
                    onChange={e => sa('password', e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setShowPassword(!showPassword)}
                    className="shrink-0"
                  >
                    {showPassword ? <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg> : <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>}
                  </Button>
                </div>
                <p className="text-xs text-slate-400 mt-1">Default: 123456</p>
              </div>
            </div>
          </SectionCard>

          {/* ═══════════════════════════════════════════════════════════════════
              ACTION BUTTONS
              ═══════════════════════════════════════════════════════════════════ */}
          <div className="flex items-center justify-between pt-2">
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                if (window.confirm('Are you sure you want to reset the form? All unsaved data will be lost.')) {
                  window.location.reload();
                }
              }}
            >
              <RotateCcw className="w-4 h-4 mr-1.5" />
              Reset Form
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-8"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 mr-1.5" />
                  Admit Student
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
