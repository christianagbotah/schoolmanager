'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { ArrowLeft, Save, UserPlus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const CLASS_GROUPS = ['CRECHE', 'NURSERY', 'KG', 'BASIC', 'JHS'];

interface ClassItem { class_id: number; name: string; category: string; }
interface SectionItem { section_id: number; name: string; class_id: number; }
interface ParentItem { parent_id: number; name: string; phone: string; email: string; }

export default function AdmitStudentPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [sections, setSections] = useState<SectionItem[]>([]);
  const [parents, setParents] = useState<ParentItem[]>([]);
  const [filteredSections, setFilteredSections] = useState<SectionItem[]>([]);
  const [searchParent, setSearchParent] = useState('');

  const [group, setGroup] = useState('');
  const [formData, setFormData] = useState({
    first_name: '', middle_name: '', last_name: '', name: '',
    sex: 'male', birthday: '', religion: '', blood_group: '', nationality: 'Ghanaian',
    address: '', phone: '', email: '', parent_id: '',
    class_id: '', section_id: '', special_needs: '',
  });
  const [parentData, setParentData] = useState({ name: '', phone: '', email: '', profession: '' });

  useEffect(() => {
    fetch('/api/classes?limit=200').then(r => r.json()).then(d => setClasses(Array.isArray(d) ? d : [])).catch(() => {});
    fetch('/api/sections').then(r => r.json()).then(d => setSections(Array.isArray(d) ? d : [])).catch(() => {});
    fetch('/api/parents?limit=200').then(r => r.json()).then(d => setParents(Array.isArray(d) ? d : [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (formData.class_id) {
      setFilteredSections(sections.filter(s => s.class_id === parseInt(formData.class_id)));
    } else {
      setFilteredSections([]);
    }
  }, [formData.class_id, sections]);

  useEffect(() => {
    const fn = formData.first_name || '';
    const mn = formData.middle_name || '';
    const ln = formData.last_name || '';
    setFormData(prev => ({ ...prev, name: `${fn} ${mn} ${ln}`.replace(/\s+/g, ' ').trim() }));
  }, [formData.first_name, formData.middle_name, formData.last_name]);

  const filteredClasses = group ? classes.filter(c => c.category === group) : classes;

  const handleSave = async () => {
    const fullName = `${formData.first_name} ${formData.last_name}`.trim();
    if (!fullName || !formData.class_id) {
      toast.error('First/Last name and class are required');
      return;
    }
    setSaving(true);
    try {
      let parentId = formData.parent_id ? parseInt(formData.parent_id) : null;
      if (!parentId && parentData.name) {
        const parentRes = await fetch('/api/parents', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(parentData),
        });
        const parentJson = await parentRes.json();
        if (parentJson.parent_id) parentId = parentJson.parent_id;
      }

      const res = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, parent_id: parentId ? String(parentId) : '' }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast.success('Student enrolled successfully');
      router.push('/admin/students');
    } catch (err: any) {
      toast.error(err.message || 'Failed to enroll student');
    } finally { setSaving(false); }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-3xl mx-auto">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild><Link href="/admin/students"><ArrowLeft className="w-5 h-5" /></Link></Button>
          <div><h1 className="text-2xl font-bold text-slate-900 tracking-tight">Admit New Student</h1><p className="text-sm text-slate-500 mt-1">Enroll a new student into the school system</p></div>
        </div>

        <Card>
          <CardContent className="p-6 space-y-6">
            <div className="flex items-center gap-2 mb-4"><UserPlus className="w-5 h-5 text-emerald-600" /><h2 className="font-semibold text-slate-800">Student Information</h2></div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div><Label className="text-xs">First Name *</Label><Input placeholder="First name" value={formData.first_name} onChange={e => setFormData({ ...formData, first_name: e.target.value })} className="mt-1" /></div>
              <div><Label className="text-xs">Middle Name</Label><Input placeholder="Middle name" value={formData.middle_name} onChange={e => setFormData({ ...formData, middle_name: e.target.value })} className="mt-1" /></div>
              <div><Label className="text-xs">Last Name *</Label><Input placeholder="Last name" value={formData.last_name} onChange={e => setFormData({ ...formData, last_name: e.target.value })} className="mt-1" /></div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div><Label className="text-xs">Gender *</Label><Select value={formData.sex} onValueChange={v => setFormData({ ...formData, sex: v })}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="male">Male</SelectItem><SelectItem value="female">Female</SelectItem></SelectContent></Select></div>
              <div><Label className="text-xs">Date of Birth</Label><Input type="date" value={formData.birthday} onChange={e => setFormData({ ...formData, birthday: e.target.value })} className="mt-1" /></div>
              <div><Label className="text-xs">Blood Group</Label><Select value={formData.blood_group} onValueChange={v => setFormData({ ...formData, blood_group: v })}><SelectTrigger className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => <SelectItem key={bg} value={bg}>{bg}</SelectItem>)}</SelectContent></Select></div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div><Label className="text-xs">Religion</Label><Input placeholder="Religion" value={formData.religion} onChange={e => setFormData({ ...formData, religion: e.target.value })} className="mt-1" /></div>
              <div><Label className="text-xs">Nationality</Label><Input placeholder="Nationality" value={formData.nationality} onChange={e => setFormData({ ...formData, nationality: e.target.value })} className="mt-1" /></div>
              <div><Label className="text-xs">Phone</Label><Input placeholder="Student phone" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="mt-1" /></div>
            </div>

            <div><Label className="text-xs">Address</Label><Textarea placeholder="Home address" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} className="mt-1" rows={2} /></div>
            <div><Label className="text-xs">Special Needs</Label><Textarea placeholder="Any special needs or notes" value={formData.special_needs} onChange={e => setFormData({ ...formData, special_needs: e.target.value })} className="mt-1" rows={2} /></div>

            <div className="border-t pt-6">
              <h3 className="font-semibold text-slate-800 mb-4">Class Enrollment</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <Label className="text-xs">Class Group</Label>
                  <Select value={group} onValueChange={v => { setGroup(v); setFormData(prev => ({ ...prev, class_id: '', section_id: '' })); }}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Filter by group" /></SelectTrigger>
                    <SelectContent><SelectItem value="__all__">All Groups</SelectItem>{CLASS_GROUPS.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Class *</Label>
                  <Select value={formData.class_id} onValueChange={v => setFormData({ ...formData, class_id: v, section_id: '' })}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Select class" /></SelectTrigger>
                    <SelectContent>{filteredClasses.map(c => <SelectItem key={c.class_id} value={String(c.class_id)}>{c.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Section</Label>
                  <Select value={formData.section_id} onValueChange={v => setFormData({ ...formData, section_id: v })}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Select section" /></SelectTrigger>
                    <SelectContent><SelectItem value="0">No Section</SelectItem>{filteredSections.map(s => <SelectItem key={s.section_id} value={String(s.section_id)}>{s.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="font-semibold text-slate-800 mb-4">Parent / Guardian</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs">Existing Parent</Label>
                  <Select value={formData.parent_id} onValueChange={v => { setFormData({ ...formData, parent_id: v }); if (v) { const p = parents.find(x => String(x.parent_id) === v); if (p) setParentData({ name: p.name, phone: p.phone, email: p.email, profession: '' }); } else { setParentData({ name: '', phone: '', email: '', profession: '' }); } }}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Search or select parent" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">— Create New Parent —</SelectItem>
                      {parents.filter(p => !searchParent || p.name.toLowerCase().includes(searchParent.toLowerCase())).map(p => <SelectItem key={p.parent_id} value={String(p.parent_id)}>{p.name} ({p.phone})</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {!formData.parent_id && (
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div><Label className="text-xs">Parent Name *</Label><Input placeholder="Guardian name" value={parentData.name} onChange={e => setParentData({ ...parentData, name: e.target.value })} className="mt-1" /></div>
                  <div><Label className="text-xs">Parent Phone</Label><Input placeholder="Phone" value={parentData.phone} onChange={e => setParentData({ ...parentData, phone: e.target.value })} className="mt-1" /></div>
                  <div><Label className="text-xs">Parent Email</Label><Input placeholder="Email" value={parentData.email} onChange={e => setParentData({ ...parentData, email: e.target.value })} className="mt-1" /></div>
                  <div><Label className="text-xs">Profession</Label><Input placeholder="Profession" value={parentData.profession} onChange={e => setParentData({ ...parentData, profession: e.target.value })} className="mt-1" /></div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" asChild><Link href="/admin/students">Cancel</Link></Button>
              <Button onClick={handleSave} disabled={saving || !formData.first_name || !formData.last_name || !formData.class_id} className="bg-emerald-600 hover:bg-emerald-700">
                <Save className="w-4 h-4 mr-2" />{saving ? 'Enrolling...' : 'Enroll Student'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
