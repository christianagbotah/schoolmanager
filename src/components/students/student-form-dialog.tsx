'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
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
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Plus, Check, X, Search, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface ClassItem {
  class_id: number;
  name: string;
  name_numeric: number;
  sections: Array<{ section_id: number; name: string }>;
}

interface ParentItem {
  parent_id: number;
  name: string;
  email: string;
  phone: string;
}

interface StudentFormData {
  student_id?: number;
  first_name: string;
  middle_name: string;
  last_name: string;
  sex: string;
  religion: string;
  blood_group: string;
  birthday: Date | undefined;
  nationality: string;
  address: string;
  phone: string;
  email: string;
  admission_date: Date | undefined;
  parent_id: string;
  class_id: string;
  section_id: string;
  year: string;
  term: string;
  roll: string;
  username: string;
  special_needs: string;
}

interface StudentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student?: StudentFormData & { student_id: number } | null;
  onSuccess: () => void;
}

const INITIAL_FORM: StudentFormData = {
  first_name: '',
  middle_name: '',
  last_name: '',
  sex: '',
  religion: '',
  blood_group: '',
  birthday: undefined,
  nationality: '',
  address: '',
  phone: '',
  email: '',
  admission_date: new Date(),
  parent_id: '',
  class_id: '',
  section_id: '',
  year: new Date().getFullYear().toString(),
  term: '',
  roll: '',
  username: '',
  special_needs: '',
};

export function StudentFormDialog({ open, onOpenChange, student, onSuccess }: StudentFormDialogProps) {
  const [form, setForm] = useState<StudentFormData>(INITIAL_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [parents, setParents] = useState<ParentItem[]>([]);
  const [parentSearch, setParentSearch] = useState('');
  const [showNewParent, setShowNewParent] = useState(false);
  const [newParent, setNewParent] = useState({ name: '', email: '', phone: '' });
  const [loadingParents, setLoadingParents] = useState(false);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [birthdayOpen, setBirthdayOpen] = useState(false);
  const [admissionOpen, setAdmissionOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('personal');
  const parentSearchRef = useRef<NodeJS.Timeout | null>(null);

  const isEditing = !!student?.student_id;

  useEffect(() => {
    if (open) {
      setLoadingClasses(true);
      fetch('/api/classes')
        .then(r => r.json())
        .then(data => setClasses(data.classes || []))
        .catch(() => {})
        .finally(() => setLoadingClasses(false));

      setLoadingParents(true);
      fetch('/api/parents')
        .then(r => r.json())
        .then(data => setParents(data.parents || []))
        .catch(() => {})
        .finally(() => setLoadingParents(false));
    }
  }, [open]);

  useEffect(() => {
    if (student && open) {
      setForm({
        first_name: student.first_name || '',
        middle_name: student.middle_name || '',
        last_name: student.last_name || '',
        sex: student.sex || '',
        religion: student.religion || '',
        blood_group: student.blood_group || '',
        birthday: student.birthday ? new Date(student.birthday) : undefined,
        nationality: student.nationality || '',
        address: student.address || '',
        phone: student.phone || '',
        email: student.email || '',
        admission_date: student.admission_date ? new Date(student.admission_date) : new Date(),
        parent_id: student.parent_id ? String(student.parent_id) : '',
        class_id: student.class_id || '',
        section_id: student.section_id || '',
        year: student.year || new Date().getFullYear().toString(),
        term: student.term || '',
        roll: student.roll || '',
        username: student.username || '',
        special_needs: student.special_needs || '',
      });
    } else if (open) {
      setForm(INITIAL_FORM);
    }
    setErrors({});
    setShowNewParent(false);
    setNewParent({ name: '', email: '', phone: '' });
    setActiveSection('personal');
  }, [student, open]);

  const searchParents = useCallback((query: string) => {
    if (parentSearchRef.current) clearTimeout(parentSearchRef.current);
    if (!query.trim()) {
      fetch('/api/parents')
        .then(r => r.json())
        .then(data => setParents(data.parents || []))
        .catch(() => {});
      return;
    }
    parentSearchRef.current = setTimeout(() => {
      fetch(`/api/parents?search=${encodeURIComponent(query)}`)
        .then(r => r.json())
        .then(data => setParents(data.parents || []))
        .catch(() => {});
    }, 300);
  }, []);

  const handleParentSearch = (value: string) => {
    setParentSearch(value);
    searchParents(value);
  };

  const handleCreateParent = async () => {
    if (!newParent.name.trim()) return;
    try {
      const res = await fetch('/api/parents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newParent),
      });
      const data = await res.json();
      if (data.parent) {
        setParents(prev => [data.parent, ...prev]);
        setForm(prev => ({ ...prev, parent_id: String(data.parent.parent_id) }));
        setShowNewParent(false);
        setNewParent({ name: '', email: '', phone: '' });
      }
    } catch (error) {
      console.error('Error creating parent:', error);
    }
  };

  const updateField = (field: keyof StudentFormData, value: string | Date | undefined) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const selectedClass = classes.find(c => String(c.class_id) === form.class_id);
  const availableSections = selectedClass?.sections || [];

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!form.first_name.trim()) newErrors.first_name = 'First name is required';
    if (!form.last_name.trim()) newErrors.last_name = 'Last name is required';
    if (!form.sex) newErrors.sex = 'Gender is required';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = 'Invalid email format';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        parent_id: form.parent_id ? parseInt(form.parent_id) : null,
        birthday: form.birthday ? form.birthday.toISOString() : null,
        admission_date: form.admission_date ? form.admission_date.toISOString() : null,
      };

      const url = isEditing ? `/api/students/${student?.student_id}` : '/api/students';
      const method = isEditing ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        onSuccess();
        onOpenChange(false);
      } else {
        setErrors({ submit: data.error || 'Failed to save student' });
      }
    } catch (error) {
      setErrors({ submit: 'An error occurred. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  const fullName = [form.first_name, form.middle_name, form.last_name].filter(Boolean).join(' ');

  const sections = [
    { id: 'personal', label: 'Personal Info' },
    { id: 'contact', label: 'Contact Info' },
    { id: 'academic', label: 'Academic Info' },
    { id: 'medical', label: 'Medical Info' },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100%-1rem)] sm:max-w-2xl max-h-[95vh] sm:max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-0">
          <DialogTitle>{isEditing ? 'Edit Student' : 'Add New Student'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update student information below.' : 'Fill in the details to register a new student.'}
            {fullName && (
              <span className="ml-2">
                <Badge variant="outline" className="font-normal text-xs">
                  {fullName || 'No name yet'}
                </Badge>
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        {/* Section tabs */}
        <div className="flex gap-1 px-6 pt-4 overflow-x-auto">
          {sections.map(sec => (
            <button
              key={sec.id}
              onClick={() => setActiveSection(sec.id)}
              className={cn(
                'px-3 py-1.5 rounded-md text-sm font-medium whitespace-nowrap transition-colors min-h-[44px]',
                activeSection === sec.id
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'text-muted-foreground hover:bg-muted'
              )}
            >
              {sec.label}
            </button>
          ))}
        </div>

        <Separator />

        <ScrollArea className="flex-1 px-6">
          <div className="py-4 space-y-4">
            {/* Personal Info */}
            {activeSection === 'personal' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="first_name">
                      First Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="first_name"
                      value={form.first_name}
                      onChange={e => updateField('first_name', e.target.value)}
                      placeholder="Enter first name"
                      className={cn(errors.first_name && 'border-red-500')}
                    />
                    {errors.first_name && (
                      <p className="text-xs text-red-500">{errors.first_name}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="middle_name">Middle Name</Label>
                    <Input
                      id="middle_name"
                      value={form.middle_name}
                      onChange={e => updateField('middle_name', e.target.value)}
                      placeholder="Enter middle name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last_name">
                      Last Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="last_name"
                      value={form.last_name}
                      onChange={e => updateField('last_name', e.target.value)}
                      placeholder="Enter last name"
                      className={cn(errors.last_name && 'border-red-500')}
                    />
                    {errors.last_name && (
                      <p className="text-xs text-red-500">{errors.last_name}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sex">
                      Gender <span className="text-red-500">*</span>
                    </Label>
                    <Select value={form.sex} onValueChange={v => updateField('sex', v)}>
                      <SelectTrigger className={cn(errors.sex && 'border-red-500')}>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.sex && (
                      <p className="text-xs text-red-500">{errors.sex}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Birthday</Label>
                    <Popover open={birthdayOpen} onOpenChange={setBirthdayOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            'w-full justify-start text-left font-normal',
                            !form.birthday && 'text-muted-foreground'
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {form.birthday ? format(form.birthday, 'PPP') : 'Pick a date'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={form.birthday}
                          onSelect={d => {
                            updateField('birthday', d);
                            setBirthdayOpen(false);
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="religion">Religion</Label>
                    <Input
                      id="religion"
                      value={form.religion}
                      onChange={e => updateField('religion', e.target.value)}
                      placeholder="Enter religion"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nationality">Nationality</Label>
                    <Input
                      id="nationality"
                      value={form.nationality}
                      onChange={e => updateField('nationality', e.target.value)}
                      placeholder="Enter nationality"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={form.username}
                    onChange={e => updateField('username', e.target.value)}
                    placeholder="Enter username"
                  />
                </div>
              </div>
            )}

            {/* Contact Info */}
            {activeSection === 'contact' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={form.phone}
                      onChange={e => updateField('phone', e.target.value)}
                      placeholder="Enter phone number"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={form.email}
                      onChange={e => updateField('email', e.target.value)}
                      placeholder="Enter email address"
                      className={cn(errors.email && 'border-red-500')}
                    />
                    {errors.email && (
                      <p className="text-xs text-red-500">{errors.email}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    value={form.address}
                    onChange={e => updateField('address', e.target.value)}
                    placeholder="Enter full address"
                    rows={3}
                  />
                </div>

                <Separator />
                <div>
                  <Label className="text-base font-semibold mb-3 block">Parent / Guardian</Label>
                  {showNewParent ? (
                    <div className="space-y-3 p-4 bg-muted rounded-lg">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <Input
                          placeholder="Parent name *"
                          value={newParent.name}
                          onChange={e => setNewParent(p => ({ ...p, name: e.target.value }))}
                        />
                        <Input
                          placeholder="Email"
                          type="email"
                          value={newParent.email}
                          onChange={e => setNewParent(p => ({ ...p, email: e.target.value }))}
                        />
                        <Input
                          placeholder="Phone"
                          value={newParent.phone}
                          onChange={e => setNewParent(p => ({ ...p, phone: e.target.value }))}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={handleCreateParent} className="bg-emerald-600 hover:bg-emerald-700">
                          <Check className="h-4 w-4 mr-1" />
                          Save Parent
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setShowNewParent(false)}>
                          <X className="h-4 w-4 mr-1" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search parents by name, email, phone..."
                          value={parentSearch}
                          onChange={e => handleParentSearch(e.target.value)}
                          className="pl-9"
                        />
                      </div>
                      {loadingParents ? (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Loading parents...
                        </div>
                      ) : (
                        <div className="max-h-48 overflow-y-auto border rounded-lg">
                          {parents.length === 0 ? (
                            <div className="p-4 text-center text-sm text-muted-foreground">
                              No parents found
                            </div>
                          ) : (
                            parents.map(p => (
                              <button
                                key={p.parent_id}
                                onClick={() => {
                                  setForm(prev => ({ ...prev, parent_id: String(p.parent_id) }));
                                  setParentSearch(p.name);
                                }}
                                className={cn(
                                  'w-full flex items-center justify-between px-4 py-2.5 text-sm hover:bg-muted transition-colors border-b last:border-0 min-h-[44px]',
                                  form.parent_id === String(p.parent_id) && 'bg-emerald-50 text-emerald-700'
                                )}
                              >
                                <div>
                                  <span className="font-medium">{p.name}</span>
                                  <span className="text-muted-foreground ml-2">
                                    {p.phone || p.email}
                                  </span>
                                </div>
                                {form.parent_id === String(p.parent_id) && (
                                  <Check className="h-4 w-4 text-emerald-600" />
                                )}
                              </button>
                            ))
                          )}
                        </div>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowNewParent(true)}
                        className="gap-1"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Create New Parent
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Academic Info */}
            {activeSection === 'academic' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Admission Date</Label>
                  <Popover open={admissionOpen} onOpenChange={setAdmissionOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !form.admission_date && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {form.admission_date ? format(form.admission_date, 'PPP') : 'Pick a date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={form.admission_date}
                        onSelect={d => {
                          updateField('admission_date', d);
                          setAdmissionOpen(false);
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Class</Label>
                    {loadingClasses ? (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading...
                      </div>
                    ) : (
                      <Select
                        value={form.class_id}
                        onValueChange={v => {
                          updateField('class_id', v);
                          updateField('section_id', '');
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select class" />
                        </SelectTrigger>
                        <SelectContent>
                          {classes.map(c => (
                            <SelectItem key={c.class_id} value={String(c.class_id)}>
                              {c.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Section</Label>
                    <Select value={form.section_id} onValueChange={v => updateField('section_id', v)}>
                      <SelectTrigger disabled={!form.class_id}>
                        <SelectValue placeholder={form.class_id ? 'Select section' : 'Select class first'} />
                      </SelectTrigger>
                      <SelectContent>
                        {availableSections.map(s => (
                          <SelectItem key={s.section_id} value={String(s.section_id)}>
                            {s.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="year">Year</Label>
                    <Input
                      id="year"
                      value={form.year}
                      onChange={e => updateField('year', e.target.value)}
                      placeholder="e.g. 2025"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="term">Term</Label>
                    <Select value={form.term} onValueChange={v => updateField('term', v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select term" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="First Term">First Term</SelectItem>
                        <SelectItem value="Second Term">Second Term</SelectItem>
                        <SelectItem value="Third Term">Third Term</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="roll">Roll Number</Label>
                    <Input
                      id="roll"
                      value={form.roll}
                      onChange={e => updateField('roll', e.target.value)}
                      placeholder="Enter roll number"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Medical Info */}
            {activeSection === 'medical' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="blood_group">Blood Group</Label>
                    <Select value={form.blood_group} onValueChange={v => updateField('blood_group', v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select blood group" />
                      </SelectTrigger>
                      <SelectContent>
                        {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                          <SelectItem key={bg} value={bg}>
                            {bg}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="special_needs">Special Needs</Label>
                  <Textarea
                    id="special_needs"
                    value={form.special_needs}
                    onChange={e => updateField('special_needs', e.target.value)}
                    placeholder="Enter any special needs or medical conditions"
                    rows={4}
                  />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {errors.submit && (
          <div className="px-6 pb-2">
            <p className="text-sm text-red-500">{errors.submit}</p>
          </div>
        )}

        <Separator />
        <DialogFooter className="px-6 py-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {isEditing ? 'Update Student' : 'Create Student'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
