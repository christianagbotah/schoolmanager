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
  Settings, Save, Loader2, GraduationCap, CreditCard,
  Building2, Image, Signature, Upload, X, Phone, Mail, MapPin,
  Calendar, FileText, Hash, ShieldCheck, School, Languages,
  Smartphone, Lock, Shield, Palette, Globe,
} from 'lucide-react';

type SettingsMap = Record<string, string>;

/* ═══════════════════════════════════════════════════════════════
   HELPER COMPONENTS
   ═══════════════════════════════════════════════════════════════ */

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
      <div className={`${aspectClass} rounded-xl border-2 border-slate-200 bg-white flex items-center justify-center overflow-hidden flex-shrink-0 relative`}>
        {currentPath ? (
          <>
            <img src={currentPath} alt={label} className="w-full h-full object-contain p-1" />
            <button onClick={() => onUploaded('')} className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 shadow-sm">
              <X className="w-3 h-3" />
            </button>
          </>
        ) : (
          <Icon className="w-10 h-10 text-slate-300" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-700">{label}</p>
        <p className="text-xs text-slate-500 mt-0.5">{description}</p>
        <div className="mt-3 flex items-center gap-2">
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
          <Button variant="outline" size="sm" className="min-h-[44px] h-11 text-xs" disabled={uploading} onClick={() => fileRef.current?.click()}>
            {uploading ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Upload className="w-3.5 h-3.5 mr-1.5" />}
            {currentPath ? 'Replace' : 'Upload'}
          </Button>
          {currentPath && <Badge variant="secondary" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">Active</Badge>}
        </div>
      </div>
    </div>
  );
}

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
      <Input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="min-h-[44px] h-11 text-sm" />
      {hint && <p className="text-[10px] text-amber-600 leading-tight">{hint}</p>}
    </div>
  );
}

function ToggleField({ label, description, checked, onCheckedChange, enabledText = 'Enabled', disabledText = 'Disabled', icon: Icon }: {
  label: string; description: string; checked: boolean; onCheckedChange: (v: boolean) => void;
  enabledText?: string; disabledText?: string; icon?: React.ElementType;
}) {
  return (
    <div className="flex items-center justify-between py-3 px-4 rounded-lg bg-slate-50">
      <div className="flex items-center gap-3">
        {Icon && <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0"><Icon className="w-4 h-4 text-slate-600" /></div>}
        <div>
          <Label className="text-xs font-medium text-slate-700">{label}</Label>
          <p className="text-[10px] text-slate-500">{description}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Badge variant="secondary" className={`text-[10px] ${checked ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
          {checked ? enabledText : disabledText}
        </Badge>
        <Switch checked={checked} onCheckedChange={onCheckedChange} />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN
   ═══════════════════════════════════════════════════════════════ */

export default function SettingsPage() {
  const [settingsMap, setSettingsMap] = useState<SettingsMap>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  const [schoolForm, setSchoolForm] = useState({
    system_name: '', system_title: '', location: '', address: '',
    box_number: '', digital_address: '', website_address: '',
    phone_json: '[]', ssnit_number: '', currency: 'GHS',
    system_email: '', language: 'english', timezone: 'Africa/Accra',
  });
  const [academicForm, setAcademicForm] = useState({
    running_year: '', running_term: '', term_ending: '', next_term_begins: '',
    running_sem: '', sem_ending: '', next_sem_begins: '',
    half_payment_week: 'First Week of the Term', full_payment_date: '',
    receipt_style: 'style_1', terminal_report_style: 'style_1',
    boarding_system: 'no', fee_collection_mode: 'separated',
    raw_score: 'no',
  });
  const [idForm, setIdForm] = useState({
    teacher_code_prefix: '', teacher_code_format: '',
    student_code_prefix: '', student_code_format: '',
    invoice_number_format: '1',
  });
  const [financeForm, setFinanceForm] = useState({
    mo_account_name: '', mo_account_number: '', purchase_code: '',
  });
  const [securityForm, setSecurityForm] = useState({
    auto_lock_enabled: 'no',
  });

  const [schoolLogo, setSchoolLogo] = useState('');
  const [signature, setSignature] = useState('');
  const [ssnitLogo, setSsnitLogo] = useState('');

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/settings');
      const data = await res.json();
      const map: SettingsMap = data.map || {};
      setSettingsMap(map);

      setSchoolForm(f => ({
        ...f,
        system_name: map.system_name || '', system_title: map.system_title || '',
        location: map.location || '', address: map.address || '',
        box_number: map.box_number || '', digital_address: map.digital_address || '',
        website_address: map.website_address || '',
        phone_json: map.phone_json || '[]', ssnit_number: map.ssnit_number || '',
        currency: map.currency || 'GHS', system_email: map.system_email || '',
        language: map.language || 'english', timezone: map.timezone || 'Africa/Accra',
      }));
      setAcademicForm(f => ({
        ...f,
        running_year: map.running_year || '', running_term: map.running_term || '',
        term_ending: map.term_ending || '', next_term_begins: map.next_term_begins || '',
        running_sem: map.running_sem || '', sem_ending: map.sem_ending || '',
        next_sem_begins: map.next_sem_begins || '',
        half_payment_week: map.half_payment_week || 'First Week of the Term',
        full_payment_date: map.full_payment_date || '',
        receipt_style: map.receipt_style || 'style_1',
        terminal_report_style: map.terminal_report_style || 'style_1',
        boarding_system: map.boarding_system || 'no',
        fee_collection_mode: map.fee_collection_mode || 'separated',
        raw_score: map.raw_score || 'no',
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
      setSecurityForm(f => ({
        ...f,
        auto_lock_enabled: map.auto_lock_enabled || 'no',
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
      toast.success(`${section} settings saved`);
      fetchSettings();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save';
      toast.error(msg);
    }
    setSaving(null);
  };

  const saveAll = async () => {
    setSaving('all');
    try {
      const all = { ...schoolForm, ...academicForm, ...idForm, ...financeForm, ...securityForm };
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: all }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast.success('All settings saved successfully');
      fetchSettings();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save';
      toast.error(msg);
    }
    setSaving(null);
  };

  const phones: string[] = (() => { try { return JSON.parse(schoolForm.phone_json || '[]'); } catch { return ['']; } })();
  const setPhones = (p: string[]) => setSchoolForm(f => ({ ...f, phone_json: JSON.stringify(p) }));

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100">
            <div className="space-y-2"><Skeleton className="h-8 w-48 rounded-lg" /><Skeleton className="h-4 w-72 rounded-lg" /></div>
            <Skeleton className="h-11 w-36 rounded-lg" />
          </div>
          <Skeleton className="h-12 w-full max-w-3xl rounded-xl" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="h-[420px] rounded-xl" /><Skeleton className="h-[420px] rounded-xl" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Inline components
  const SaveBtn = ({ section, formData }: { section: string; formData: Record<string, string> }) => (
    <Button onClick={() => saveSection(section, formData)} className="w-full bg-emerald-600 hover:bg-emerald-700 min-h-[44px] h-11 text-sm font-medium" disabled={saving !== null}>
      {saving === section ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : <><Save className="w-4 h-4 mr-2" /> Save {section}</>}
    </Button>
  );

  const SectionCard = ({ icon: Icon, title, description, children, saveSection: saveLabel, saveData, iconColor = 'text-emerald-600', iconBg = 'bg-emerald-100' }: {
    icon: React.ElementType; title: string; description?: string;
    children: React.ReactNode; saveSection?: string; saveData?: Record<string, string>;
    iconColor?: string; iconBg?: string;
  }) => (
    <Card className="border-slate-200/60 hover:shadow-sm transition-shadow">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2.5 text-base">
          <div className={`w-8 h-8 rounded-lg ${iconBg} flex items-center justify-center flex-shrink-0`}>
            <Icon className={`w-4 h-4 ${iconColor}`} />
          </div>
          {title}
        </CardTitle>
        {description && <CardDescription className="text-xs ml-[42px]">{description}</CardDescription>}
      </CardHeader>
      <CardContent className="space-y-4">
        {children}
        {saveLabel && saveData && (<><Separator /><SaveBtn section={saveLabel} formData={saveData} /></>)}
      </CardContent>
    </Card>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">System Settings</h1>
            <p className="text-sm text-slate-500 mt-1">Manage school information, academic calendar, and preferences</p>
          </div>
          <Button onClick={saveAll} className="bg-emerald-600 hover:bg-emerald-700 min-h-[44px] h-11 text-sm font-medium self-start sm:self-auto" disabled={saving !== null}>
            {saving === 'all' ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving All...</> : <><Save className="w-4 h-4 mr-2" /> Save All Changes</>}
          </Button>
        </div>

        {/* Tabs — matching CI3 modern layout: General, Branding, Academic, Payment, Security, Advanced */}
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="mb-6 bg-white border border-slate-200 p-1 rounded-xl h-auto flex w-full overflow-x-auto">
            <TabsTrigger value="general" className="flex-1 min-w-[80px] data-[state=active]:bg-emerald-600 data-[state=active]:text-white rounded-lg py-2 text-xs sm:text-sm">
              <Building2 className="w-3.5 h-3.5 mr-1 hidden sm:inline" /> General
            </TabsTrigger>
            <TabsTrigger value="branding" className="flex-1 min-w-[80px] data-[state=active]:bg-emerald-600 data-[state=active]:text-white rounded-lg py-2 text-xs sm:text-sm">
              {/* eslint-disable-next-line jsx-a11y/alt-text */}
              <Image className="w-3.5 h-3.5 mr-1 hidden sm:inline" /> Branding
            </TabsTrigger>
            <TabsTrigger value="academic" className="flex-1 min-w-[80px] data-[state=active]:bg-emerald-600 data-[state=active]:text-white rounded-lg py-2 text-xs sm:text-sm">
              <GraduationCap className="w-3.5 h-3.5 mr-1 hidden sm:inline" /> Academic
            </TabsTrigger>
            <TabsTrigger value="payment" className="flex-1 min-w-[80px] data-[state=active]:bg-emerald-600 data-[state=active]:text-white rounded-lg py-2 text-xs sm:text-sm">
              <CreditCard className="w-3.5 h-3.5 mr-1 hidden sm:inline" /> Payment
            </TabsTrigger>
            <TabsTrigger value="security" className="flex-1 min-w-[80px] data-[state=active]:bg-emerald-600 data-[state=active]:text-white rounded-lg py-2 text-xs sm:text-sm">
              <Shield className="w-3.5 h-3.5 mr-1 hidden sm:inline" /> Security
            </TabsTrigger>
            <TabsTrigger value="advanced" className="flex-1 min-w-[80px] data-[state=active]:bg-emerald-600 data-[state=active]:text-white rounded-lg py-2 text-xs sm:text-sm">
              <Settings className="w-3.5 h-3.5 mr-1 hidden sm:inline" /> Advanced
            </TabsTrigger>
          </TabsList>

          {/* ═══════════════════════════════════════════════════
              GENERAL TAB — school info, contact, currency, language
              ═══════════════════════════════════════════════════ */}
          <TabsContent value="general">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SectionCard icon={School} title="School Information" description="Basic school details shown on reports and receipts" saveSection="General" saveData={schoolForm}>
                <SField label="System Name" value={schoolForm.system_name} onChange={v => setSchoolForm({ ...schoolForm, system_name: v })} placeholder="e.g. GREAT MINDS INTERNATIONAL SCHOOL" icon={Building2} required />
                <SField label="School Slogan / Motto" value={schoolForm.system_title} onChange={v => setSchoolForm({ ...schoolForm, system_title: v })} placeholder="e.g. Nurturing Tomorrow's Leaders" icon={GraduationCap} />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <SField label="Location" value={schoolForm.location} onChange={v => setSchoolForm({ ...schoolForm, location: v })} placeholder="e.g. Accra, Ghana" icon={MapPin} required />
                  <SField label="Address" value={schoolForm.address} onChange={v => setSchoolForm({ ...schoolForm, address: v })} placeholder="e.g. 123 Education Street" icon={MapPin} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <SField label="Box Number" value={schoolForm.box_number} onChange={v => setSchoolForm({ ...schoolForm, box_number: v })} placeholder="P.O. Box GP 12345" icon={Mail} />
                  <SField label="Digital Address" value={schoolForm.digital_address} onChange={v => setSchoolForm({ ...schoolForm, digital_address: v })} placeholder="e.g. GA-123-4567" icon={MapPin} />
                </div>
                <SField label="Website Address" value={schoolForm.website_address} onChange={v => setSchoolForm({ ...schoolForm, website_address: v })} placeholder="e.g. https://www.school.com" icon={Globe} />
                <SField label="SSNIT Establishment Number" value={schoolForm.ssnit_number} onChange={v => setSchoolForm({ ...schoolForm, ssnit_number: v })} placeholder="SSNIT number" icon={ShieldCheck} />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <SField label="System Email" value={schoolForm.system_email} onChange={v => setSchoolForm({ ...schoolForm, system_email: v })} placeholder="admin@school.com" type="email" icon={Mail} required />
                  <SField label="Currency" value={schoolForm.currency} onChange={v => setSchoolForm({ ...schoolForm, currency: v })} placeholder="GHS" icon={CreditCard} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-slate-700 flex items-center gap-1.5"><Languages className="w-3.5 h-3.5 text-slate-400" /> Language</Label>
                    <Select value={schoolForm.language} onValueChange={v => setSchoolForm({ ...schoolForm, language: v })}>
                      <SelectTrigger className="min-h-[44px] h-11 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="english">English</SelectItem>
                        <SelectItem value="french">French</SelectItem>
                        <SelectItem value="spanish">Spanish</SelectItem>
                        <SelectItem value="arabic">Arabic</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-slate-700 flex items-center gap-1.5"><Globe className="w-3.5 h-3.5 text-slate-400" /> Timezone</Label>
                    <Select value={schoolForm.timezone} onValueChange={v => setSchoolForm({ ...schoolForm, timezone: v })}>
                      <SelectTrigger className="min-h-[44px] h-11 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Africa/Accra">Africa/Accra (GMT)</SelectItem>
                        <SelectItem value="Africa/Lagos">Africa/Lagos (WAT)</SelectItem>
                        <SelectItem value="Africa/Nairobi">Africa/Nairobi (EAT)</SelectItem>
                        <SelectItem value="Europe/London">Europe/London (GMT/BST)</SelectItem>
                        <SelectItem value="UTC">UTC</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {/* Phone Numbers */}
                <div>
                  <Label className="text-xs font-medium text-slate-700 flex items-center gap-1.5 mb-2"><Phone className="w-3.5 h-3.5 text-slate-400" /> Phone Numbers</Label>
                  <div className="space-y-2">
                    {phones.map((p, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="w-10 h-11 flex items-center justify-center rounded-lg bg-slate-100 flex-shrink-0"><Phone className="w-4 h-4 text-slate-500" /></div>
                        <Input value={p} onChange={(e) => { const n = [...phones]; n[i] = e.target.value; setPhones(n); }} placeholder={`Phone ${i + 1}`} className="min-h-[44px] h-11 text-sm flex-1" />
                        {phones.length > 1 && (
                          <Button variant="ghost" size="sm" className="min-h-[44px] h-11 w-11 p-0 text-red-400 hover:text-red-600 hover:bg-red-50" onClick={() => setPhones(phones.filter((_, idx) => idx !== i))}>
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    {phones.length < 5 && (
                      <Button variant="outline" size="sm" className="min-h-[44px] h-11 text-xs mt-1" onClick={() => setPhones([...phones, ''])}>+ Add Phone</Button>
                    )}
                  </div>
                </div>
              </SectionCard>

              {/* Quick stats / overview */}
              <div className="space-y-6">
                <SectionCard icon={Palette} title="Quick Overview" description="Current system configuration snapshot" iconColor="text-violet-600" iconBg="bg-violet-100">
                  <div className="space-y-3">
                    {[
                      { label: 'School Name', value: schoolForm.system_name || 'Not set' },
                      { label: 'Location', value: schoolForm.location || 'Not set' },
                      { label: 'Email', value: schoolForm.system_email || 'Not set' },
                      { label: 'Currency', value: schoolForm.currency || 'GHS' },
                      { label: 'Language', value: schoolForm.language || 'english' },
                      { label: 'Running Year', value: academicForm.running_year || 'Not set' },
                      { label: 'Running Term', value: academicForm.running_term || 'Not set' },
                      { label: 'Boarding', value: academicForm.boarding_system },
                    ].map(item => (
                      <div key={item.label} className="flex items-center justify-between py-2 px-3 rounded-lg bg-slate-50">
                        <span className="text-xs text-slate-500">{item.label}</span>
                        <span className="text-xs font-semibold text-slate-700 max-w-[200px] truncate">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </SectionCard>

                <SectionCard icon={CreditCard} title="Payment & Finance" description="Mobile money account and licensing" saveSection="Finance" saveData={financeForm} iconColor="text-sky-600" iconBg="bg-sky-100">
                  <SField label="MoMo Account Name" value={financeForm.mo_account_name} onChange={v => setFinanceForm({ ...financeForm, mo_account_name: v })} placeholder="School MoMo account name" icon={CreditCard} />
                  <SField label="MoMo Account Number" value={financeForm.mo_account_number} onChange={v => setFinanceForm({ ...financeForm, mo_account_number: v })} placeholder="+233XXXXXXXXX" icon={Smartphone} />
                  <Separator />
                  <SField label="Purchase Code" value={financeForm.purchase_code} onChange={v => setFinanceForm({ ...financeForm, purchase_code: v })} placeholder="License purchase code" icon={ShieldCheck} />
                </SectionCard>
              </div>
            </div>
          </TabsContent>

          {/* ═══════════════════════════════════════════════════
              BRANDING TAB — logos, signatures
              ═══════════════════════════════════════════════════ */}
          <TabsContent value="branding">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <SectionCard icon={Image} title="School Logo" description="Displayed on reports, receipts & terminal reports" iconColor="text-violet-600" iconBg="bg-violet-100">
                <UploadCard label="School Logo" description="Recommended: 200x200px PNG" settingKey="school_logo" currentPath={schoolLogo} onUploaded={setSchoolLogo} icon={Image} />
              </SectionCard>
              <SectionCard icon={Signature} title="Head Teacher Signature" description="Displayed on terminal reports" iconColor="text-amber-600" iconBg="bg-amber-100">
                <UploadCard label="Signature" description="Below head teacher's comment" settingKey="head_teacher_signature" currentPath={signature} onUploaded={setSignature} icon={Signature} aspectClass="w-36 h-20" />
              </SectionCard>
              <SectionCard icon={ShieldCheck} title="SSNIT Logo" description="Displayed on staff payslips" iconColor="text-sky-600" iconBg="bg-sky-100">
                <UploadCard label="SSNIT Logo" description="SSNIT contribution details" settingKey="ssnit_logo" currentPath={ssnitLogo} onUploaded={setSsnitLogo} icon={ShieldCheck} />
              </SectionCard>
            </div>
          </TabsContent>

          {/* ═══════════════════════════════════════════════════
              ACADEMIC TAB — calendar, terms, grading, reports
              ═══════════════════════════════════════════════════ */}
          <TabsContent value="academic">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SectionCard icon={Calendar} title="Academic Calendar" description="Current session, term dates, and semester configuration" saveSection="Academic" saveData={academicForm}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-slate-700">Running Year / Session</Label>
                    <Input value={academicForm.running_year} onChange={e => setAcademicForm({ ...academicForm, running_year: e.target.value })} placeholder="e.g. 2025" className="min-h-[44px] h-11 text-sm" />
                    <p className="text-[10px] text-amber-600">Contact admin to change</p>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-slate-700">Running Term</Label>
                    <Input value={academicForm.running_term} onChange={e => setAcademicForm({ ...academicForm, running_term: e.target.value })} placeholder="e.g. Term 1" className="min-h-[44px] h-11 text-sm" />
                    <p className="text-[10px] text-amber-600">Contact admin to change</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <SField label="Term Ending" value={academicForm.term_ending} onChange={v => setAcademicForm({ ...academicForm, term_ending: v })} type="date" icon={Calendar} />
                  <SField label="Next Term Begins" value={academicForm.next_term_begins} onChange={v => setAcademicForm({ ...academicForm, next_term_begins: v })} type="date" icon={Calendar} />
                </div>
                <Separator />
                <div className="p-4 rounded-lg bg-sky-50 border border-sky-100">
                  <p className="text-xs font-semibold text-sky-700 mb-3 flex items-center gap-1.5"><GraduationCap className="w-3.5 h-3.5" /> Semester Configuration (JHSS)</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1"><Label className="text-[10px] text-sky-600">Running Semester</Label><Input value={academicForm.running_sem} onChange={e => setAcademicForm({ ...academicForm, running_sem: e.target.value })} placeholder="Semester 1" className="min-h-[44px] h-11 text-xs" /></div>
                    <div className="space-y-1"><Label className="text-[10px] text-sky-600">Semester Ending</Label><Input type="date" value={academicForm.sem_ending} onChange={e => setAcademicForm({ ...academicForm, sem_ending: e.target.value })} className="min-h-[44px] h-11 text-xs" /></div>
                    <div className="space-y-1"><Label className="text-[10px] text-sky-600">Next Semester Begins</Label><Input type="date" value={academicForm.next_sem_begins} onChange={e => setAcademicForm({ ...academicForm, next_sem_begins: e.target.value })} className="min-h-[44px] h-11 text-xs" /></div>
                  </div>
                </div>
              </SectionCard>

              <div className="space-y-6">
                <SectionCard icon={GraduationCap} title="Grading & Reports" description="Receipt styles, report formats, WAEC grading" saveSection="Preferences" saveData={academicForm} iconColor="text-violet-600" iconBg="bg-violet-100">
                  {/* WAEC Grading Toggle — CI3 parity */}
                  <ToggleField
                    label="WAEC Standard Grading"
                    description="Use WAEC grading standards (A1-F9) for assessments"
                    checked={academicForm.raw_score === 'yes'}
                    onCheckedChange={(c) => setAcademicForm({ ...academicForm, raw_score: c ? 'yes' : 'no' })}
                    icon={GraduationCap}
                  />
                  {academicForm.raw_score === 'yes' && (
                    <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-100">
                      <p className="text-[10px] font-semibold text-emerald-700 mb-2">WAEC Grading Scale:</p>
                      <div className="grid grid-cols-3 gap-1 text-[10px] text-emerald-700">
                        <span>A1: 80-100%</span><span>B2: 70-79%</span><span>B3: 65-69%</span>
                        <span>C4: 60-64%</span><span>C5: 55-59%</span><span>C6: 50-54%</span>
                        <span>D7: 45-49%</span><span>E8: 40-44%</span><span>F9: 0-39%</span>
                      </div>
                    </div>
                  )}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-slate-700 flex items-center gap-1.5"><FileText className="w-3.5 h-3.5 text-slate-400" /> Receipt Style</Label>
                    <Select value={academicForm.receipt_style} onValueChange={v => setAcademicForm({ ...academicForm, receipt_style: v })}>
                      <SelectTrigger className="min-h-[44px] h-11 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="style_1">Style 1 — Classic</SelectItem>
                        <SelectItem value="style_2">Style 2 — Modern</SelectItem>
                        <SelectItem value="style_3">Style 3 — Compact</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-slate-700 flex items-center gap-1.5"><FileText className="w-3.5 h-3.5 text-slate-400" /> Terminal Report Style</Label>
                    <Select value={academicForm.terminal_report_style} onValueChange={v => setAcademicForm({ ...academicForm, terminal_report_style: v })}>
                      <SelectTrigger className="min-h-[44px] h-11 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="style_1">Style 1 — Standard</SelectItem>
                        <SelectItem value="style_2">Style 2 — Detailed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <ToggleField label="School Has Boarding" description="Enable boarding/dormitory features" checked={academicForm.boarding_system === 'yes'} onCheckedChange={(c) => setAcademicForm({ ...academicForm, boarding_system: c ? 'yes' : 'no' })} />
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-slate-700 flex items-center gap-1.5"><CreditCard className="w-3.5 h-3.5 text-slate-400" /> Fee Collection Mode</Label>
                    <Select value={academicForm.fee_collection_mode} onValueChange={v => setAcademicForm({ ...academicForm, fee_collection_mode: v })}>
                      <SelectTrigger className="min-h-[44px] h-11 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="integrated">Integrated (Daily + Invoice)</SelectItem>
                        <SelectItem value="separated">Separated (Independent)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-[10px] text-slate-500">{academicForm.fee_collection_mode === 'integrated' ? 'Daily fees and invoice fees collected together' : 'Daily fees and invoice fees managed independently'}</p>
                  </div>
                </SectionCard>

                <SectionCard icon={CreditCard} title="Payment Deadlines" description="Configure when fees are expected" saveSection="Deadlines" saveData={academicForm} iconColor="text-amber-600" iconBg="bg-amber-100">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-slate-700 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-slate-400" /> Part Payment Expected By</Label>
                    <Select value={academicForm.half_payment_week} onValueChange={v => setAcademicForm({ ...academicForm, half_payment_week: v })}>
                      <SelectTrigger className="min-h-[44px] h-11 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="First Week of the Term">First Week of the Term</SelectItem>
                        <SelectItem value="Second Week of the Term">Second Week of the Term</SelectItem>
                        <SelectItem value="Third Week of the Term">Third Week of the Term</SelectItem>
                        <SelectItem value="Forth Week of the Term">Fourth Week of the Term</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <SField label="Full Payment Expected By" value={academicForm.full_payment_date} onChange={v => setAcademicForm({ ...academicForm, full_payment_date: v })} type="date" icon={Calendar} />
                </SectionCard>
              </div>
            </div>
          </TabsContent>

          {/* ═══════════════════════════════════════════════════
              PAYMENT TAB — mobile money, purchase code
              ═══════════════════════════════════════════════════ */}
          <TabsContent value="payment">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SectionCard icon={Smartphone} title="Mobile Money Settings" description="Configure mobile money payment account" saveSection="MoMo" saveData={financeForm} iconColor="text-emerald-600" iconBg="bg-emerald-100">
                <SField label="MoMo Account Name" value={financeForm.mo_account_name} onChange={v => setFinanceForm({ ...financeForm, mo_account_name: v })} placeholder="School MoMo account name" icon={CreditCard} />
                <SField label="MoMo Account Number" value={financeForm.mo_account_number} onChange={v => setFinanceForm({ ...financeForm, mo_account_number: v })} placeholder="+233XXXXXXXXX" icon={Phone} />
              </SectionCard>
              <SectionCard icon={ShieldCheck} title="Licensing" description="Product license and activation" saveSection="License" saveData={financeForm} iconColor="text-violet-600" iconBg="bg-violet-100">
                <SField label="Purchase Code" value={financeForm.purchase_code} onChange={v => setFinanceForm({ ...financeForm, purchase_code: v })} placeholder="License purchase code" icon={ShieldCheck} />
              </SectionCard>
            </div>
          </TabsContent>

          {/* ═══════════════════════════════════════════════════
              SECURITY TAB — auto-lock, financial controls
              ═══════════════════════════════════════════════════ */}
          <TabsContent value="security">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SectionCard icon={Lock} title="Financial Security" description="Protect financial data integrity" saveSection="Security" saveData={securityForm} iconColor="text-red-600" iconBg="bg-red-100">
                <ToggleField
                  label="Auto-Lock Invoices & Payments"
                  description="Automatically lock financial records to prevent unauthorized modifications"
                  checked={securityForm.auto_lock_enabled === 'yes'}
                  onCheckedChange={(c) => setSecurityForm({ ...securityForm, auto_lock_enabled: c ? 'yes' : 'no' })}
                  icon={Lock}
                />
                {securityForm.auto_lock_enabled === 'yes' && (
                  <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-100">
                    <p className="text-[10px] font-semibold text-emerald-700 mb-1">When Auto-Lock is Enabled:</p>
                    <ul className="text-[10px] text-emerald-700 space-y-0.5 ml-3 list-disc">
                      <li>Payments locked immediately after creation</li>
                      <li>Invoices locked when fully paid</li>
                      <li>Locked records require approval to edit</li>
                      <li>Maintains financial data integrity</li>
                    </ul>
                  </div>
                )}
              </SectionCard>
            </div>
          </TabsContent>

          {/* ═══════════════════════════════════════════════════
              ADVANCED TAB — ID formats, invoice numbering
              ═══════════════════════════════════════════════════ */}
          <TabsContent value="advanced">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SectionCard icon={Hash} title="ID Formats" description="Configure auto-generated code prefixes and formats" saveSection="ID Formats" saveData={idForm} iconColor="text-amber-600" iconBg="bg-amber-100">
                <div className="p-4 rounded-lg bg-violet-50 border border-violet-100">
                  <p className="text-xs font-semibold text-violet-700 mb-3 flex items-center gap-1.5"><GraduationCap className="w-3.5 h-3.5" /> Staff ID Configuration</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <SField label="Staff ID Prefix" value={idForm.teacher_code_prefix} onChange={v => setIdForm({ ...idForm, teacher_code_prefix: v })} placeholder="e.g. STF" icon={Hash} />
                    <SField label="Staff ID Format" value={idForm.teacher_code_format} onChange={v => setIdForm({ ...idForm, teacher_code_format: v })} placeholder="e.g. 000000" icon={FileText} />
                  </div>
                </div>
                <Separator />
                <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-100">
                  <p className="text-xs font-semibold text-emerald-700 mb-3 flex items-center gap-1.5"><GraduationCap className="w-3.5 h-3.5" /> Student ID Configuration</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <SField label="Student ID Prefix" value={idForm.student_code_prefix} onChange={v => setIdForm({ ...idForm, student_code_prefix: v })} placeholder="e.g. STU" icon={Hash} />
                    <SField label="Student ID Format" value={idForm.student_code_format} onChange={v => setIdForm({ ...idForm, student_code_format: v })} placeholder="e.g. 000000" icon={FileText} />
                  </div>
                </div>
                <Separator />
                <div className="p-4 rounded-lg bg-amber-50 border border-amber-100">
                  <p className="text-xs font-semibold text-amber-700 mb-3 flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" /> Invoice Numbering</p>
                  <SField label="Invoice Number Format" value={idForm.invoice_number_format} onChange={v => setIdForm({ ...idForm, invoice_number_format: v })} placeholder="Numeric starting number" type="number" icon={Hash} />
                  <p className="text-[10px] text-red-500 mt-1">Numeric only — controls the starting number for invoice codes</p>
                </div>
              </SectionCard>

              {/* Theme link */}
              <SectionCard icon={Palette} title="Theme Customization" description="Customize colors, fonts, and layout of your school portal" iconColor="text-violet-600" iconBg="bg-violet-100">
                <div className="p-4 rounded-lg bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 text-center">
                  <Palette className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-700 mb-1">Theme Settings</p>
                  <p className="text-xs text-slate-500 mb-3">Choose from predefined themes or customize your own colors</p>
                  <a href="/admin/settings/theme">
                    <Button variant="outline" className="bg-white min-h-[44px]">Open Theme Settings</Button>
                  </a>
                </div>
              </SectionCard>
            </div>
          </TabsContent>
        </Tabs>

        {/* Floating Save Button */}
        <div className="fixed bottom-6 right-6 z-50 hidden sm:block">
          <Button onClick={saveAll} className="bg-emerald-600 hover:bg-emerald-700 min-h-[44px] shadow-lg rounded-full px-6" disabled={saving !== null}>
            {saving === 'all' ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : <><Save className="w-4 h-4 mr-2" /> Save All Settings</>}
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
