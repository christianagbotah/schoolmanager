'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import {
  Settings, Save, Loader2, Globe, GraduationCap, Palette, CreditCard,
  Building2, Image, Signature, Upload, X, Phone, Mail, MapPin,
  Calendar, FileText, Hash, ShieldCheck, School, Languages,
} from 'lucide-react';

type SettingsMap = Record<string, string>;

// ── Upload Card Component ──────────────────────────────────────
function UploadCard({
  label,
  description,
  settingKey,
  currentPath,
  onUploaded,
  icon: Icon,
  aspectClass = 'w-28 h-28',
}: {
  label: string;
  description: string;
  settingKey: string;
  currentPath: string;
  onUploaded: (path: string) => void;
  icon: React.ElementType;
  aspectClass?: string;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('type', settingKey);

      const res = await fetch('/api/admin/settings/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      onUploaded(data.path);
      toast.success(`${label} uploaded successfully`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Upload failed';
      toast.error(msg);
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div className="flex items-start gap-4 p-4 rounded-xl border border-dashed border-slate-200 hover:border-emerald-300 transition-colors bg-slate-50/50">
      {/* Preview */}
      <div className={`${aspectClass} rounded-xl border-2 border-slate-200 bg-white flex items-center justify-center overflow-hidden flex-shrink-0 relative`}>
        {currentPath ? (
          <>
            <img src={currentPath} alt={label} className="w-full h-full object-contain p-1" />
            <button
              onClick={() => onUploaded('')}
              className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 shadow-sm"
            >
              <X className="w-3 h-3" />
            </button>
          </>
        ) : (
          <Icon className="w-10 h-10 text-slate-300" />
        )}
      </div>

      {/* Info & Upload */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-700">{label}</p>
        <p className="text-xs text-slate-500 mt-0.5">{description}</p>
        <div className="mt-3 flex items-center gap-2">
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs"
            disabled={uploading}
            onClick={() => fileRef.current?.click()}
          >
            {uploading ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Upload className="w-3 h-3 mr-1" />}
            {currentPath ? 'Replace' : 'Upload'}
          </Button>
          {currentPath && (
            <Badge variant="secondary" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">
              Active
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Phone Input ────────────────────────────────────────────────
function PhoneInputs({
  phones,
  onChange,
}: {
  phones: string[];
  onChange: (phones: string[]) => void;
}) {
  const addPhone = () => onChange([...phones, '']);
  const removePhone = (i: number) => onChange(phones.filter((_, idx) => idx !== i));
  const updatePhone = (i: number, v: string) => {
    const next = [...phones];
    next[i] = v;
    onChange(next);
  };

  return (
    <div className="space-y-2">
      {phones.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <Phone className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <Input
            value={p}
            onChange={(e) => updatePhone(i, e.target.value)}
            placeholder={`Phone ${i + 1} (e.g. +233XXXXXXXXX)`}
            className="h-9 text-sm flex-1"
          />
          {phones.length > 1 && (
            <Button variant="ghost" size="sm" className="h-9 w-9 p-0 text-red-400 hover:text-red-600 hover:bg-red-50" onClick={() => removePhone(i)}>
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      ))}
      {phones.length < 5 && (
        <Button variant="outline" size="sm" className="h-8 text-xs mt-1" onClick={addPhone}>
          + Add Phone Number
        </Button>
      )}
    </div>
  );
}

// ── Settings Field ─────────────────────────────────────────────
function SField({ label, value, onChange, placeholder, type = 'text', hint, icon: Icon, required }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; hint?: string;
  icon?: React.ElementType; required?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-slate-700 flex items-center gap-1.5">
        {Icon && <Icon className="w-3.5 h-3.5 text-slate-400" />}
        {label}
        {required && <span className="text-red-400">*</span>}
      </Label>
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-9 text-sm"
      />
      {hint && <p className="text-[10px] text-amber-600 leading-tight">{hint}</p>}
    </div>
  );
}

export default function SettingsPage() {
  const [settingsMap, setSettingsMap] = useState<SettingsMap>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  // ── Form State ────────────────────────────────────────────
  const [schoolForm, setSchoolForm] = useState({
    system_name: '', system_title: '', location: '', address: '',
    box_number: '', digital_address: '', website_address: '',
    phone_json: '[]', ssnit_number: '', currency: 'GHS',
    system_email: '', language: 'english',
  });
  const [academicForm, setAcademicForm] = useState({
    running_year: '', running_term: '', term_ending: '', next_term_begins: '',
    running_sem: '', sem_ending: '', next_sem_begins: '',
    half_payment_week: 'First Week of the Term', full_payment_date: '',
    receipt_style: 'style_1', terminal_report_style: 'style_1',
    boarding_system: 'no', fee_collection_mode: 'separated',
  });
  const [idForm, setIdForm] = useState({
    teacher_code_prefix: '', teacher_code_format: '',
    student_code_prefix: '', student_code_format: '',
    invoice_number_format: '1',
  });
  const [financeForm, setFinanceForm] = useState({
    mo_account_name: '', mo_account_number: '', purchase_code: '',
  });
  const [themeForm, setThemeForm] = useState({
    app_theme: 'default', theme_primary: '#10b981', theme_secondary: '#059669', theme_accent: '#f59e0b',
  });

  // Upload state
  const [schoolLogo, setSchoolLogo] = useState('');
  const [signature, setSignature] = useState('');
  const [ssnitLogo, setSsnitLogo] = useState('');

  // ── Fetch Settings ────────────────────────────────────────
  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/settings');
      const data = await res.json();
      const map: SettingsMap = data.map || {};
      setSettingsMap(map);

      setSchoolForm(f => ({
        ...f,
        system_name: map.system_name || '',
        system_title: map.system_title || '',
        location: map.location || '',
        address: map.address || '',
        box_number: map.box_number || '',
        digital_address: map.digital_address || '',
        website_address: map.website_address || '',
        phone_json: map.phone_json || '[]',
        ssnit_number: map.ssnit_number || '',
        currency: map.currency || 'GHS',
        system_email: map.system_email || '',
        language: map.language || 'english',
      }));

      setAcademicForm(f => ({
        ...f,
        running_year: map.running_year || '',
        running_term: map.running_term || '',
        term_ending: map.term_ending || '',
        next_term_begins: map.next_term_begins || '',
        running_sem: map.running_sem || '',
        sem_ending: map.sem_ending || '',
        next_sem_begins: map.next_sem_begins || '',
        half_payment_week: map.half_payment_week || 'First Week of the Term',
        full_payment_date: map.full_payment_date || '',
        receipt_style: map.receipt_style || 'style_1',
        terminal_report_style: map.terminal_report_style || 'style_1',
        boarding_system: map.boarding_system || 'no',
        fee_collection_mode: map.fee_collection_mode || 'separated',
      }));

      setIdForm(f => ({
        ...f,
        teacher_code_prefix: map.teacher_code_prefix || '',
        teacher_code_format: map.teacher_code_format || '',
        student_code_prefix: map.student_code_prefix || '',
        student_code_format: map.student_code_format || '',
        invoice_number_format: map.invoice_number_format || '1',
      }));

      setFinanceForm(f => ({
        ...f,
        mo_account_name: map.mo_account_name || '',
        mo_account_number: map.mo_account_number || '',
        purchase_code: map.purchase_code || '',
      }));

      setThemeForm(f => ({
        ...f,
        app_theme: map.app_theme || 'default',
        theme_primary: map.theme_primary || '#10b981',
        theme_secondary: map.theme_secondary || '#059669',
        theme_accent: map.theme_accent || '#f59e0b',
      }));

      setSchoolLogo(map.school_logo || '');
      setSignature(map.head_teacher_signature || '');
      setSsnitLogo(map.ssnit_logo || '');
    } catch {
      toast.error('Failed to load settings');
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  // ── Save Handler ──────────────────────────────────────────
  const saveSection = async (section: string, formData: Record<string, string>) => {
    setSaving(section);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: formData }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast.success(`${section} settings saved successfully`);
      fetchSettings();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save';
      toast.error(msg);
    }
    setSaving(null);
  };

  const getPhones = (): string[] => {
    try { return JSON.parse(schoolForm.phone_json || '[]'); }
    catch { return ['']; }
  };

  const setPhones = (phones: string[]) => {
    setSchoolForm(f => ({ ...f, phone_json: JSON.stringify(phones) }));
  };

  const phones = getPhones();

  // ── Loading State ─────────────────────────────────────────
  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-72" />
          <Skeleton className="h-10 w-full max-w-2xl" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="h-[500px] rounded-xl" />
            <Skeleton className="h-[500px] rounded-xl" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ── Save Button Component ─────────────────────────────────
  const SaveBtn = ({ section, formData }: { section: string; formData: Record<string, string> }) => (
    <Button
      onClick={() => saveSection(section, formData)}
      className="w-full bg-emerald-600 hover:bg-emerald-700 min-h-[44px] text-sm font-medium"
      disabled={saving !== null}
    >
      {saving === section ? (
        <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
      ) : (
        <><Save className="w-4 h-4 mr-2" /> Save {section} Settings</>
      )}
    </Button>
  );

  // ── Card Wrapper ──────────────────────────────────────────
  const SectionCard = ({ icon: Icon, title, description, children, saveSection: saveLabel, saveData }: {
    icon: React.ElementType; title: string; description?: string;
    children: React.ReactNode; saveSection?: string; saveData?: Record<string, string>;
  }) => (
    <Card className="border-slate-200/60">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon className="w-5 h-5 text-emerald-600" /> {title}
        </CardTitle>
        {description && <CardDescription className="text-xs">{description}</CardDescription>}
      </CardHeader>
      <CardContent className="space-y-3">
        {children}
        {saveLabel && saveData && (
          <>
            <Separator />
            <SaveBtn section={saveLabel} formData={saveData} />
          </>
        )}
      </CardContent>
    </Card>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">System Settings</h1>
          <p className="text-sm text-slate-500 mt-1">Configure school information, academic calendar, and system preferences</p>
        </div>

        <Tabs defaultValue="school" className="w-full">
          <TabsList className="mb-6 bg-white border border-slate-200 p-1 rounded-xl h-auto flex w-full sm:w-auto overflow-x-auto">
            <TabsTrigger value="school" className="flex-1 min-w-[100px] data-[state=active]:bg-emerald-600 data-[state=active]:text-white rounded-lg py-2 text-sm">
              <School className="w-4 h-4 mr-1 hidden sm:inline" /> School
            </TabsTrigger>
            <TabsTrigger value="academic" className="flex-1 min-w-[100px] data-[state=active]:bg-emerald-600 data-[state=active]:text-white rounded-lg py-2 text-sm">
              <Calendar className="w-4 h-4 mr-1 hidden sm:inline" /> Academic
            </TabsTrigger>
            <TabsTrigger value="finance" className="flex-1 min-w-[100px] data-[state=active]:bg-emerald-600 data-[state=active]:text-white rounded-lg py-2 text-sm">
              <CreditCard className="w-4 h-4 mr-1 hidden sm:inline" /> Finance
            </TabsTrigger>
            <TabsTrigger value="ids" className="flex-1 min-w-[100px] data-[state=active]:bg-emerald-600 data-[state=active]:text-white rounded-lg py-2 text-sm">
              <Hash className="w-4 h-4 mr-1 hidden sm:inline" /> IDs
            </TabsTrigger>
            <TabsTrigger value="theme" className="flex-1 min-w-[100px] data-[state=active]:bg-emerald-600 data-[state=active]:text-white rounded-lg py-2 text-sm">
              <Palette className="w-4 h-4 mr-1 hidden sm:inline" /> Theme
            </TabsTrigger>
          </TabsList>

          {/* ═══════════════ SCHOOL TAB ═══════════════ */}
          <TabsContent value="school">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* School Information Card */}
              <SectionCard
                icon={Globe}
                title="School Information"
                description="Basic school details shown on reports, receipts, and terminal reports"
                saveSection="School"
                saveData={schoolForm}
              >
                <SField label="System Name" value={schoolForm.system_name} onChange={v => setSchoolForm({ ...schoolForm, system_name: v })}
                  placeholder="e.g. GREAT MINDS INTERNATIONAL SCHOOL" icon={Building2} required />
                <SField label="School Slogan / System Title" value={schoolForm.system_title} onChange={v => setSchoolForm({ ...schoolForm, system_title: v })}
                  placeholder="e.g. Nurturing Tomorrow's Leaders" icon={GraduationCap} />
                <SField label="Location" value={schoolForm.location} onChange={v => setSchoolForm({ ...schoolForm, location: v })}
                  placeholder="e.g. Accra, Ghana" icon={MapPin} required />
                <SField label="Address" value={schoolForm.address} onChange={v => setSchoolForm({ ...schoolForm, address: v })}
                  placeholder="e.g. 123 Education Street" icon={MapPin} required />
                <SField label="Box Number" value={schoolForm.box_number} onChange={v => setSchoolForm({ ...schoolForm, box_number: v })}
                  placeholder="P.O. Box GP 12345" icon={Mail} />
                <SField label="Digital Address" value={schoolForm.digital_address} onChange={v => setSchoolForm({ ...schoolForm, digital_address: v })}
                  placeholder="e.g. GA-123-4567" icon={MapPin} />
                <SField label="Website" value={schoolForm.website_address} onChange={v => setSchoolForm({ ...schoolForm, website_address: v })}
                  placeholder="https://www.school.com" type="url" icon={Globe} />

                <Separator className="my-1" />

                {/* Phone Numbers */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-700 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" /> Phone Numbers
                    <span className="text-red-400">*</span>
                  </Label>
                  <PhoneInputs phones={phones} onChange={setPhones} />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <SField label="SSNIT Number" value={schoolForm.ssnit_number} onChange={v => setSchoolForm({ ...schoolForm, ssnit_number: v })}
                    placeholder="SSNIT number" icon={ShieldCheck} />
                  <SField label="Currency" value={schoolForm.currency} onChange={v => setSchoolForm({ ...schoolForm, currency: v })}
                    placeholder="GHS" icon={CreditCard} />
                </div>

                <SField label="System Email" value={schoolForm.system_email} onChange={v => setSchoolForm({ ...schoolForm, system_email: v })}
                  placeholder="admin@school.com" type="email" icon={Mail} required />

                {/* Language Dropdown */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-700 flex items-center gap-1.5">
                    <Languages className="w-3.5 h-3.5 text-slate-400" /> Language
                  </Label>
                  <Select value={schoolForm.language} onValueChange={v => setSchoolForm({ ...schoolForm, language: v })}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="english">English</SelectItem>
                      <SelectItem value="french">French</SelectItem>
                      <SelectItem value="spanish">Spanish</SelectItem>
                      <SelectItem value="arabic">Arabic</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </SectionCard>

              {/* Uploads & Branding Card */}
              <SectionCard
                icon={Image}
                title="Uploads & Branding"
                description="School logos and signatures used across the system"
              >
                <UploadCard
                  label="School Logo"
                  description="Displayed on reports, receipts & terminal reports. Recommended: 200x200px PNG."
                  settingKey="school_logo"
                  currentPath={schoolLogo}
                  onUploaded={setSchoolLogo}
                  icon={Image}
                />

                <Separator />

                <UploadCard
                  label="Head Teacher Signature"
                  description="Displayed on terminal reports below the head teacher's comment."
                  settingKey="head_teacher_signature"
                  currentPath={signature}
                  onUploaded={setSignature}
                  icon={Signature}
                  aspectClass="w-36 h-20"
                />

                <Separator />

                <UploadCard
                  label="SSNIT Logo"
                  description="Displayed on staff payslips for SSNIT contribution details."
                  settingKey="ssnit_logo"
                  currentPath={ssnitLogo}
                  onUploaded={setSsnitLogo}
                  icon={ShieldCheck}
                />
              </SectionCard>
            </div>
          </TabsContent>

          {/* ═══════════════ ACADEMIC TAB ═══════════════ */}
          <TabsContent value="academic">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* Academic Calendar */}
              <SectionCard
                icon={Calendar}
                title="Academic Calendar"
                description="Current session, term dates, and semester configuration"
                saveSection="Academic Calendar"
                saveData={academicForm}
              >
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-slate-700">Running Year / Session</Label>
                    <Input value={academicForm.running_year} onChange={e => setAcademicForm({ ...academicForm, running_year: e.target.value })}
                      placeholder="e.g. 2025" className="h-9 text-sm" />
                    <p className="text-[10px] text-amber-600">Contact system admin to change</p>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-slate-700">Running Term</Label>
                    <Input value={academicForm.running_term} onChange={e => setAcademicForm({ ...academicForm, running_term: e.target.value })}
                      placeholder="e.g. Term 1" className="h-9 text-sm" />
                    <p className="text-[10px] text-amber-600">Contact system admin to change</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <SField label="Term Ending" value={academicForm.term_ending} onChange={v => setAcademicForm({ ...academicForm, term_ending: v })}
                    placeholder="" type="date" icon={Calendar} />
                  <SField label="Next Term Begins" value={academicForm.next_term_begins} onChange={v => setAcademicForm({ ...academicForm, next_term_begins: v })}
                    placeholder="" type="date" icon={Calendar} />
                </div>

                <Separator className="my-1" />

                {/* Semester Fields (for JHSS classes) */}
                <div className="p-3 rounded-lg bg-sky-50 border border-sky-100">
                  <p className="text-xs font-semibold text-sky-700 mb-3 flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5" /> Semester Configuration (JHSS)
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label className="text-[10px] text-sky-600">Running Semester</Label>
                      <Input value={academicForm.running_sem} onChange={e => setAcademicForm({ ...academicForm, running_sem: e.target.value })}
                        placeholder="e.g. Semester 1" className="h-8 text-xs" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] text-sky-600">Semester Ending</Label>
                      <Input type="date" value={academicForm.sem_ending} onChange={e => setAcademicForm({ ...academicForm, sem_ending: e.target.value })}
                        className="h-8 text-xs" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] text-sky-600">Next Semester Begins</Label>
                      <Input type="date" value={academicForm.next_sem_begins} onChange={e => setAcademicForm({ ...academicForm, next_sem_begins: e.target.value })}
                        className="h-8 text-xs" />
                    </div>
                  </div>
                </div>
              </SectionCard>

              {/* School Preferences & Payment Settings */}
              <div className="space-y-6">
                <SectionCard
                  icon={Settings}
                  title="School Preferences"
                  description="Receipt styles, report formats, and system behavior"
                  saveSection="Preferences"
                  saveData={academicForm}
                >
                  {/* Receipt Style */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-slate-700 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-slate-400" /> Receipt Style
                    </Label>
                    <Select value={academicForm.receipt_style} onValueChange={v => setAcademicForm({ ...academicForm, receipt_style: v })}>
                      <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="style_1">Style 1 — Classic</SelectItem>
                        <SelectItem value="style_2">Style 2 — Modern</SelectItem>
                        <SelectItem value="style_3">Style 3 — Compact</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Terminal Report Style */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-slate-700 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-slate-400" /> Terminal Report Style
                    </Label>
                    <Select value={academicForm.terminal_report_style} onValueChange={v => setAcademicForm({ ...academicForm, terminal_report_style: v })}>
                      <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="style_1">Style 1 — Standard</SelectItem>
                        <SelectItem value="style_2">Style 2 — Detailed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Boarding System */}
                  <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-slate-50">
                    <div>
                      <Label className="text-xs font-medium text-slate-700">School Has Boarding</Label>
                      <p className="text-[10px] text-slate-500">Enable boarding/dormitory features</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Label className="text-xs text-slate-600">
                        {academicForm.boarding_system === 'yes' ? 'Yes' : 'No'}
                      </Label>
                      <Switch
                        checked={academicForm.boarding_system === 'yes'}
                        onCheckedChange={(checked) => setAcademicForm({ ...academicForm, boarding_system: checked ? 'yes' : 'no' })}
                      />
                    </div>
                  </div>

                  {/* Fee Collection Mode */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-slate-700 flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5 text-slate-400" /> Fee Collection Mode
                    </Label>
                    <Select value={academicForm.fee_collection_mode} onValueChange={v => setAcademicForm({ ...academicForm, fee_collection_mode: v })}>
                      <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="integrated">Integrated (Daily + Invoice)</SelectItem>
                        <SelectItem value="separated">Separated (Independent)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-[10px] text-slate-500">
                      {academicForm.fee_collection_mode === 'integrated'
                        ? 'Daily fees and invoice fees are collected together'
                        : 'Daily fees and invoice fees are managed independently'}
                    </p>
                  </div>
                </SectionCard>

                {/* Payment Deadlines */}
                <SectionCard
                  icon={CreditCard}
                  title="Payment Deadlines"
                  description="Configure when fees are expected to be paid"
                  saveSection="Payment Deadlines"
                  saveData={academicForm}
                >
                  {/* Half Payment Week */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-slate-700 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" /> Part Payment Expected By
                    </Label>
                    <Select value={academicForm.half_payment_week} onValueChange={v => setAcademicForm({ ...academicForm, half_payment_week: v })}>
                      <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="First Week of the Term">First Week of the Term</SelectItem>
                        <SelectItem value="Second Week of the Term">Second Week of the Term</SelectItem>
                        <SelectItem value="Third Week of the Term">Third Week of the Term</SelectItem>
                        <SelectItem value="Fourth Week of the Term">Fourth Week of the Term</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <SField label="Full Payment Deadline" value={academicForm.full_payment_date} onChange={v => setAcademicForm({ ...academicForm, full_payment_date: v })}
                    placeholder="" type="date" icon={Calendar} />
                </SectionCard>
              </div>
            </div>
          </TabsContent>

          {/* ═══════════════ FINANCE TAB ═══════════════ */}
          <TabsContent value="finance">
            <div className="max-w-2xl">
              <SectionCard
                icon={CreditCard}
                title="Mobile Money & Payment"
                description="Configure payment and mobile money account details for fee collection"
                saveSection="Finance"
                saveData={financeForm}
              >
                <SField label="MoMo Account Name" value={financeForm.mo_account_name} onChange={v => setFinanceForm({ ...financeForm, mo_account_name: v })}
                  placeholder="School MoMo account name" icon={CreditCard} />
                <SField label="MoMo Account Number" value={financeForm.mo_account_number} onChange={v => setFinanceForm({ ...financeForm, mo_account_number: v })}
                  placeholder="+233XXXXXXXXX" icon={Phone} />
                <Separator />
                <SField label="Purchase Code" value={financeForm.purchase_code} onChange={v => setFinanceForm({ ...financeForm, purchase_code: v })}
                  placeholder="License purchase code" icon={ShieldCheck} />
              </SectionCard>
            </div>
          </TabsContent>

          {/* ═══════════════ IDs TAB ═══════════════ */}
          <TabsContent value="ids">
            <div className="max-w-2xl">
              <SectionCard
                icon={Hash}
                title="Staff & Student ID Formats"
                description="Configure ID prefix and format for auto-generated codes"
                saveSection="ID Formats"
                saveData={idForm}
              >
                {/* Staff ID */}
                <div className="p-3 rounded-lg bg-violet-50 border border-violet-100">
                  <p className="text-xs font-semibold text-violet-700 mb-3 flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5" /> Staff ID Configuration
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <SField label="Staff ID Prefix" value={idForm.teacher_code_prefix} onChange={v => setIdForm({ ...idForm, teacher_code_prefix: v })}
                      placeholder="e.g. STF" icon={Hash} />
                    <SField label="Staff ID Format" value={idForm.teacher_code_format} onChange={v => setIdForm({ ...idForm, teacher_code_format: v })}
                      placeholder="e.g. 000000" icon={FileText} />
                  </div>
                </div>

                <Separator />

                {/* Student ID */}
                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-100">
                  <p className="text-xs font-semibold text-emerald-700 mb-3 flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5" /> Student ID Configuration
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <SField label="Student ID Prefix" value={idForm.student_code_prefix} onChange={v => setIdForm({ ...idForm, student_code_prefix: v })}
                      placeholder="e.g. STU" icon={Hash} />
                    <SField label="Student ID Format" value={idForm.student_code_format} onChange={v => setIdForm({ ...idForm, student_code_format: v })}
                      placeholder="e.g. 000000" icon={FileText} />
                  </div>
                </div>

                <Separator />

                {/* Invoice Numbering */}
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-100">
                  <p className="text-xs font-semibold text-amber-700 mb-3 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" /> Invoice Numbering
                  </p>
                  <SField label="Invoice Number Format" value={idForm.invoice_number_format} onChange={v => setIdForm({ ...idForm, invoice_number_format: v })}
                    placeholder="Numeric starting number" type="number" icon={Hash} />
                  <p className="text-[10px] text-red-500 mt-1">Numeric only — controls the starting number for invoice codes</p>
                </div>
              </SectionCard>
            </div>
          </TabsContent>

          {/* ═══════════════ THEME TAB ═══════════════ */}
          <TabsContent value="theme">
            <SectionCard
              icon={Palette}
              title="Theme Customization"
              description="Choose a predefined theme or customize colors for your school portal"
              saveSection="Theme"
              saveData={themeForm}
            >
              {/* Predefined Themes */}
              <div>
                <p className="text-sm font-semibold text-slate-700 mb-3">Predefined Themes</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { key: 'default', name: 'Default Emerald', primary: '#10b981', secondary: '#059669', accent: '#f59e0b' },
                    { key: 'ocean', name: 'Ocean Blue', primary: '#2E3192', secondary: '#1BFFFF', accent: '#00d4ff' },
                    { key: 'sunset', name: 'Sunset Orange', primary: '#f12711', secondary: '#f5af19', accent: '#ff6b6b' },
                    { key: 'forest', name: 'Forest Green', primary: '#134E5E', secondary: '#71B280', accent: '#38ef7d' },
                    { key: 'royal', name: 'Royal Purple', primary: '#5f27cd', secondary: '#341f97', accent: '#a29bfe' },
                    { key: 'crimson', name: 'Crimson Red', primary: '#c0392b', secondary: '#e74c3c', accent: '#ff7979' },
                    { key: 'teal', name: 'Teal Mint', primary: '#16a085', secondary: '#1abc9c', accent: '#48c9b0' },
                    { key: 'midnight', name: 'Midnight', primary: '#2c3e50', secondary: '#34495e', accent: '#3498db' },
                  ].map(theme => (
                    <div
                      key={theme.key}
                      onClick={() => setThemeForm({
                        ...themeForm,
                        app_theme: theme.key,
                        theme_primary: theme.primary,
                        theme_secondary: theme.secondary,
                        theme_accent: theme.accent,
                      })}
                      className={`cursor-pointer rounded-lg border-2 overflow-hidden transition-all hover:shadow-md hover:-translate-y-0.5 ${
                        themeForm.app_theme === theme.key
                          ? 'border-emerald-500 ring-2 ring-emerald-200'
                          : 'border-slate-200'
                      }`}
                    >
                      <div className="h-16 relative" style={{ background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.secondary} 100%)` }}>
                        <div className="absolute bottom-0 left-0 right-0 h-4" style={{ background: theme.accent }} />
                        {themeForm.app_theme === theme.key && (
                          <div className="absolute top-1 right-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="p-2 bg-white text-center">
                        <p className="text-xs font-semibold text-slate-700">{theme.name}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Custom Colors */}
              <div>
                <p className="text-sm font-semibold text-slate-700 mb-3">Custom Theme Colors</p>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: 'Primary Color', key: 'theme_primary' },
                    { label: 'Secondary Color', key: 'theme_secondary' },
                    { label: 'Accent Color', key: 'theme_accent' },
                  ].map(({ label, key }) => (
                    <div key={key} className="space-y-1.5">
                      <Label className="text-xs font-medium text-slate-700">{label}</Label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={themeForm[key as keyof typeof themeForm]}
                          onChange={e => setThemeForm({ ...themeForm, [key]: e.target.value })}
                          className="w-10 h-10 rounded-lg border border-slate-200 cursor-pointer"
                        />
                        <Input
                          value={themeForm[key as keyof typeof themeForm]}
                          onChange={e => setThemeForm({ ...themeForm, [key]: e.target.value })}
                          className="flex-1 h-9 text-sm font-mono"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </SectionCard>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
