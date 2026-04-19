'use client';

import { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Settings, Smartphone, Send, MessageSquare, Users, Clock, CheckCircle, XCircle,
  Plus, Pencil, Trash2, Zap, FileText, Bell, Archive, ToggleLeft, Loader2,
  CheckCircle2, Phone, GraduationCap, UserCheck, AlertCircle, Hash,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface SMSLog {
  sms_log_id: number; phone_number: string; message: string;
  status: string; sent_at: string | null; gateway: string; recipient_type: string;
}

interface SMSTemplate {
  sms_template_id: number; name: string; content: string;
  category: string; variables: string; is_active: number;
}

interface SMSAutomation {
  sms_automation_id: number; name: string; trigger_event: string;
  template_id: number | null; recipient_group: string; is_active: number;
  cooldown_minutes: number;
}

interface SMSSettings {
  active_sms_service: string; hubtel_sender: string;
  hubtel_client_id: string; hubtel_client_secret: string;
  send_attendance_sms: string;
}

// ============================================================
// Skeleton Components
// ============================================================
function SMSSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48 rounded-lg" />
          <Skeleton className="h-4 w-72 rounded-lg" />
        </div>
        <Skeleton className="h-11 w-40 rounded-lg" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="border-l-4 border-l-slate-200">
            <CardContent className="p-4 flex items-center gap-3">
              <Skeleton className="w-10 h-10 rounded-lg flex-shrink-0" />
              <div className="space-y-1.5 flex-1">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-6 w-14" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Skeleton className="h-12 w-full max-w-2xl rounded-xl" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="border-slate-200/60"><CardContent className="p-5"><Skeleton className="h-32 rounded-xl" /></CardContent></Card>
        ))}
      </div>
    </div>
  );
}

function LogRowSkeleton() {
  return (
    <TableRow>
      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
      <TableCell><Skeleton className="h-4 w-28" /></TableCell>
      <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
      <TableCell><Skeleton className="h-4 w-48" /></TableCell>
      <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
    </TableRow>
  );
}

interface UserOption { id: string; name: string; type: 'student' | 'teacher' | 'parent'; }

export default function SMSPage() {
  const [tab, setTab] = useState('compose');

  // Compose state
  const [recipientMode, setRecipientMode] = useState('individual');
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
  const [phoneNumbers, setPhoneNumbers] = useState('');
  const [composeMessage, setComposeMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);

  // Logs state
  const [logs, setLogs] = useState<SMSLog[]>([]);
  const [logStats, setLogStats] = useState({ sent: 0, failed: 0, pending: 0, total: 0 });
  const [logsLoading, setLogsLoading] = useState(true);

  // Templates state
  const [templates, setTemplates] = useState<SMSTemplate[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [templateFormOpen, setTemplateFormOpen] = useState(false);
  const [editTemplate, setEditTemplate] = useState<SMSTemplate | null>(null);
  const [templateForm, setTemplateForm] = useState({ name: '', content: '', category: 'general', variables: '' });
  const [deleteTemplateOpen, setDeleteTemplateOpen] = useState(false);
  const [deleteTemplateId, setDeleteTemplateId] = useState<number | null>(null);
  const [savingTemplate, setSavingTemplate] = useState(false);

  // Automations state
  const [automations, setAutomations] = useState<SMSAutomation[]>([]);
  const [autoStats, setAutoStats] = useState({ total: 0, active: 0, total_sent: 0, success_rate: 0 });
  const [automationsLoading, setAutomationsLoading] = useState(true);
  const [autoFormOpen, setAutoFormOpen] = useState(false);
  const [savingAutomation, setSavingAutomation] = useState(false);
  const [autoForm, setAutoForm] = useState({
    name: '', trigger_event: '', template_id: '', recipient_group: 'all',
    is_active: 1, cooldown_minutes: 60,
  });

  // Settings state
  const [settings, setSettings] = useState<SMSSettings>({
    active_sms_service: 'disabled', hubtel_sender: '', hubtel_client_id: '',
    hubtel_client_secret: '', send_attendance_sms: '0',
  });
  const [settingsForm, setSettingsForm] = useState<SMSSettings>(settings);
  const [settingsSaving, setSettingsSaving] = useState(false);

  // Fetch settings
  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/sms?action=settings');
      const data = await res.json();
      setSettings(data);
      setSettingsForm(data);
    } catch { /* empty */ }
  }, []);

  // Fetch logs
  const fetchLogs = useCallback(async () => {
    setLogsLoading(true);
    try {
      const res = await fetch('/api/admin/sms?action=logs');
      const data = await res.json();
      setLogs(data.logs || []);
      setLogStats(data.stats || { sent: 0, failed: 0, pending: 0, total: 0 });
    } catch { /* empty */ }
    setLogsLoading(false);
  }, []);

  // Fetch templates
  const fetchTemplates = useCallback(async () => {
    setTemplatesLoading(true);
    try {
      const res = await fetch('/api/admin/sms?action=templates');
      setTemplates(await res.json());
    } catch { /* empty */ }
    setTemplatesLoading(false);
  }, []);

  // Fetch automations
  const fetchAutomations = useCallback(async () => {
    setAutomationsLoading(true);
    try {
      const res = await fetch('/api/admin/sms?action=automations');
      const data = await res.json();
      setAutomations(data.automations || []);
      setAutoStats(data.stats || { total: 0, active: 0, total_sent: 0, success_rate: 0 });
    } catch { /* empty */ }
    setAutomationsLoading(false);
  }, []);

  // Fetch users for compose
  const fetchUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      const res = await fetch('/api/admin/sms?action=users');
      const data = await res.json();
      setUsers(data.users || []);
    } catch { /* empty */ }
    setUsersLoading(false);
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchSettings(); fetchLogs(); fetchTemplates(); fetchAutomations(); fetchUsers(); }, [fetchSettings, fetchLogs, fetchTemplates, fetchAutomations, fetchUsers]);

  // Send SMS
  const handleSendSMS = async () => {
    if (recipientMode === 'individual' && selectedRecipients.length === 0) {
      toast.error('Please select at least one recipient');
      return;
    }
    if (recipientMode === 'phone' && !phoneNumbers.trim()) {
      toast.error('Please enter at least one phone number');
      return;
    }
    if (!composeMessage.trim()) {
      toast.error('Please enter a message');
      return;
    }
    setSending(true);
    try {
      const res = await fetch('/api/admin/sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send_sms',
          recipient_mode: recipientMode,
          recipients: recipientMode === 'individual' ? selectedRecipients : undefined,
          phone_numbers: recipientMode === 'phone' ? phoneNumbers : undefined,
          message: composeMessage,
        }),
      });
      const data = await res.json();
      if (data.error) {
        toast.error(data.error);
      } else {
        toast.success(data.message || 'SMS sent successfully');
        setSelectedRecipients([]);
        setPhoneNumbers('');
        setComposeMessage('');
        fetchLogs();
      }
    } catch {
      toast.error('Failed to send SMS. Check your SMS settings and credit balance.');
    }
    setSending(false);
  };

  const toggleRecipient = (id: string) => {
    setSelectedRecipients(prev =>
      prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]
    );
  };

  const students = users.filter(u => u.type === 'student');
  const teachers = users.filter(u => u.type === 'teacher');
  const parents = users.filter(u => u.type === 'parent');
  const recipientCount = recipientMode === 'individual'
    ? selectedRecipients.length
    : recipientMode === 'phone'
      ? phoneNumbers.split(',').filter(p => p.trim()).length
      : 0;

  // Save settings
  const saveSettings = async () => {
    setSettingsSaving(true);
    try {
      await fetch('/api/admin/sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_settings', ...settingsForm }),
      });
      toast.success('SMS settings updated');
      fetchSettings();
    } catch {
      toast.error('Failed to save settings');
    }
    setSettingsSaving(false);
  };

  // Save template
  const saveTemplate = async () => {
    if (!templateForm.name || !templateForm.content) {
      toast.error('Template name and content are required');
      return;
    }
    setSavingTemplate(true);
    try {
      await fetch('/api/admin/sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save_template', ...templateForm }),
      });
      toast.success(editTemplate ? 'Template updated' : 'Template created');
      setTemplateFormOpen(false);
      fetchTemplates();
    } catch {
      toast.error('Failed to save template');
    }
    setSavingTemplate(false);
  };

  // Delete template
  const deleteTemplate = async () => {
    if (!deleteTemplateId) return;
    try {
      await fetch(`/api/admin/sms?action=template&id=${deleteTemplateId}`, { method: 'DELETE' });
      toast.success('Template deleted');
      setDeleteTemplateOpen(false);
      fetchTemplates();
    } catch {
      toast.error('Failed to delete template');
    }
  };

  // Toggle automation
  const toggleAutomation = async (id: number) => {
    try {
      await fetch('/api/admin/sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle_automation', automation_id: id }),
      });
      toast.success('Automation toggled');
      fetchAutomations();
    } catch {
      toast.error('Failed to toggle automation');
    }
  };

  // Create automation
  const createAutomation = async () => {
    if (!autoForm.name || !autoForm.trigger_event) {
      toast.error('Automation name and trigger event are required');
      return;
    }
    setSavingAutomation(true);
    try {
      await fetch('/api/admin/sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_automation',
          ...autoForm,
          template_id: autoForm.template_id ? parseInt(autoForm.template_id) : null,
        }),
      });
      toast.success('Automation created');
      setAutoFormOpen(false);
      fetchAutomations();
    } catch {
      toast.error('Failed to create automation');
    }
    setSavingAutomation(false);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">SMS Management</h1>
            <p className="text-sm text-slate-500 mt-1">Settings, automation, templates, and delivery logs</p>
          </div>
          <Button
            onClick={() => {
              setAutoForm({ name: '', trigger_event: '', template_id: '', recipient_group: 'all', is_active: 1, cooldown_minutes: 60 });
              setAutoFormOpen(true);
            }}
            className="bg-emerald-600 hover:bg-emerald-700 min-h-[44px] shadow-sm"
          >
            <Plus className="w-4 h-4 mr-2" /> New Automation
          </Button>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {logsLoading ? (
            <SMSSkeleton />
          ) : (
            <>
              <Card className="border-l-4 border-l-emerald-500 hover:shadow-sm transition-all hover:-translate-y-0.5">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500 flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-5 h-5 text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">Sent</p>
                    <p className="text-xl font-bold text-slate-900 tabular-nums">{logStats.sent}</p>
                    <p className="text-[10px] text-emerald-500 font-medium">
                      {logStats.total > 0 ? Math.round((logStats.sent / logStats.total) * 100) : 0}% success
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-red-400 hover:shadow-sm transition-all hover:-translate-y-0.5">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-red-500 flex items-center justify-center flex-shrink-0">
                    <XCircle className="w-5 h-5 text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">Failed</p>
                    <p className="text-xl font-bold text-slate-900 tabular-nums">{logStats.failed}</p>
                    <p className="text-[10px] text-red-500 font-medium">
                      {logStats.failed > 0 ? 'Needs attention' : 'All good'}
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-violet-500 hover:shadow-sm transition-all hover:-translate-y-0.5">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-violet-500 flex items-center justify-center flex-shrink-0">
                    <Zap className="w-5 h-5 text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">Automations</p>
                    <p className="text-xl font-bold text-slate-900 tabular-nums">{autoStats.active}/{autoStats.total}</p>
                    <p className="text-[10px] text-slate-400">Active automations</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-amber-500 hover:shadow-sm transition-all hover:-translate-y-0.5">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-500 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">Templates</p>
                    <p className="text-xl font-bold text-slate-900 tabular-nums">{templates.length}</p>
                    <p className="text-[10px] text-slate-400">Reusable templates</p>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Tabs */}
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="mb-4 bg-white border border-slate-200 p-1 rounded-xl h-auto flex w-full sm:w-auto">
            <TabsTrigger value="compose" className="flex-1 min-w-[100px] data-[state=active]:bg-emerald-600 data-[state=active]:text-white rounded-lg py-2 text-sm">
              <Send className="w-4 h-4 mr-1.5 hidden sm:inline" /> Compose
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex-1 min-w-[100px] data-[state=active]:bg-emerald-600 data-[state=active]:text-white rounded-lg py-2 text-sm">
              <Settings className="w-4 h-4 mr-1.5 hidden sm:inline" /> Settings
            </TabsTrigger>
            <TabsTrigger value="automation" className="flex-1 min-w-[100px] data-[state=active]:bg-emerald-600 data-[state=active]:text-white rounded-lg py-2 text-sm">
              <Zap className="w-4 h-4 mr-1.5 hidden sm:inline" /> Automation
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex-1 min-w-[100px] data-[state=active]:bg-emerald-600 data-[state=active]:text-white rounded-lg py-2 text-sm">
              <FileText className="w-4 h-4 mr-1.5 hidden sm:inline" /> Templates
            </TabsTrigger>
            <TabsTrigger value="logs" className="flex-1 min-w-[100px] data-[state=active]:bg-emerald-600 data-[state=active]:text-white rounded-lg py-2 text-sm">
              <Archive className="w-4 h-4 mr-1.5 hidden sm:inline" /> Logs
            </TabsTrigger>
          </TabsList>

          {/* ============ COMPOSE TAB ============ */}
          <TabsContent value="compose">
            <Card className="border-slate-200/60">
              <CardContent className="p-6 space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                    <Send className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Write New SMS Message</h2>
                    <p className="text-sm text-slate-500">Send SMS to students, teachers, parents, or custom numbers</p>
                  </div>
                </div>

                {/* Recipient Selection */}
                <div className="space-y-3">
                  <Label className="text-sm font-semibold">Recipient</Label>
                  <Select value={recipientMode} onValueChange={v => { setRecipientMode(v); setSelectedRecipients([]); }}>
                    <SelectTrigger className="min-h-[44px] max-w-md"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="individual">Send Individually</SelectItem>
                      <SelectItem value="teachers">All Active Teachers</SelectItem>
                      <SelectItem value="students">All Active Students</SelectItem>
                      <SelectItem value="parents">All Active Parents</SelectItem>
                      <SelectItem value="phone">Enter Phone Number</SelectItem>
                    </SelectContent>
                  </Select>

                  {recipientMode === 'individual' && (
                    <div className="max-h-64 overflow-y-auto rounded-xl border border-slate-200 p-4 space-y-4">
                      {usersLoading ? (
                        <div className="space-y-2"><Skeleton className="h-6 w-full" /><Skeleton className="h-6 w-full" /><Skeleton className="h-6 w-3/4" /></div>
                      ) : (
                        <>
                          {students.length > 0 && (
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                                <GraduationCap className="w-4 h-4 text-violet-500" />
                                Active Students ({students.length})
                                <button type="button" className="ml-auto text-xs text-emerald-600 hover:underline" onClick={() => setSelectedRecipients(prev => { const ids = students.map(s => s.id); return prev.length === ids.length && ids.every(id => prev.includes(id)) ? prev.filter(id => !ids.includes(id)) : [...new Set([...prev, ...ids])]; })}>
                                  {students.every(s => selectedRecipients.includes(s.id)) ? 'Deselect All' : 'Select All'}
                                </button>
                              </div>
                              {students.map(s => (
                                <label key={s.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 cursor-pointer">
                                  <input type="checkbox" checked={selectedRecipients.includes(s.id)} onChange={() => toggleRecipient(s.id)} className="rounded border-slate-300" />
                                  <span className="text-sm text-slate-700">{s.name}</span>
                                </label>
                              ))}
                            </div>
                          )}
                          {teachers.length > 0 && (
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                                <UserCheck className="w-4 h-4 text-emerald-500" />
                                Active Teachers ({teachers.length})
                                <button type="button" className="ml-auto text-xs text-emerald-600 hover:underline" onClick={() => setSelectedRecipients(prev => { const ids = teachers.map(t => t.id); return prev.length === ids.length && ids.every(id => prev.includes(id)) ? prev.filter(id => !ids.includes(id)) : [...new Set([...prev, ...ids])]; })}>
                                  {teachers.every(t => selectedRecipients.includes(t.id)) ? 'Deselect All' : 'Select All'}
                                </button>
                              </div>
                              {teachers.map(t => (
                                <label key={t.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 cursor-pointer">
                                  <input type="checkbox" checked={selectedRecipients.includes(t.id)} onChange={() => toggleRecipient(t.id)} className="rounded border-slate-300" />
                                  <span className="text-sm text-slate-700">{t.name}</span>
                                </label>
                              ))}
                            </div>
                          )}
                          {parents.length > 0 && (
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                                <Users className="w-4 h-4 text-amber-500" />
                                Active Parents ({parents.length})
                                <button type="button" className="ml-auto text-xs text-emerald-600 hover:underline" onClick={() => setSelectedRecipients(prev => { const ids = parents.map(p => p.id); return prev.length === ids.length && ids.every(id => prev.includes(id)) ? prev.filter(id => !ids.includes(id)) : [...new Set([...prev, ...ids])]; })}>
                                  {parents.every(p => selectedRecipients.includes(p.id)) ? 'Deselect All' : 'Select All'}
                                </button>
                              </div>
                              {parents.map(p => (
                                <label key={p.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 cursor-pointer">
                                  <input type="checkbox" checked={selectedRecipients.includes(p.id)} onChange={() => toggleRecipient(p.id)} className="rounded border-slate-300" />
                                  <span className="text-sm text-slate-700">{p.name}</span>
                                </label>
                              ))}
                            </div>
                          )}
                          {users.length === 0 && !usersLoading && (
                            <p className="text-sm text-slate-400 text-center py-4">No active users found</p>
                          )}
                        </>
                      )}
                    </div>
                  )}

                  {recipientMode === 'phone' && (
                    <div className="space-y-2">
                      <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Separate each number with a comma</p>
                      <Input type="tel" value={phoneNumbers} onChange={e => setPhoneNumbers(e.target.value)} placeholder="e.g., +233241234567, +233205556677" className="min-h-[44px] max-w-md font-mono" />
                    </div>
                  )}

                  {(recipientMode === 'teachers' || recipientMode === 'students' || recipientMode === 'parents') && (
                    <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-200">
                      <p className="text-sm text-emerald-700">
                        <Send className="w-4 h-4 inline mr-1" />
                        This will send to all active <strong>{recipientMode === 'teachers' ? 'teachers' : recipientMode === 'students' ? 'students' : 'parents'}</strong>
                      </p>
                    </div>
                  )}
                </div>

                {/* Message */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Message</Label>
                  <Textarea value={composeMessage} onChange={e => setComposeMessage(e.target.value)} placeholder="Write your message here..." rows={5} className="min-h-[120px] resize-y" />
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>{composeMessage.length} / 160 characters</span>
                    {composeMessage.length > 160 && (
                      <Badge variant="outline" className="text-amber-600 border-amber-200 text-[10px]">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        {Math.ceil(composeMessage.length / 160)} SMS parts
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <p className="text-sm text-slate-500">
                    <Hash className="w-4 h-4 inline mr-1" />
                    {recipientCount} recipient{recipientCount !== 1 ? 's' : ''} selected
                  </p>
                  <Button onClick={handleSendSMS} disabled={sending || !composeMessage.trim()} className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm min-h-[44px] px-8">
                    {sending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                    {sending ? 'Sending...' : 'Send SMS'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ============ SETTINGS TAB ============ */}
          <TabsContent value="settings">
            <Card className="border-slate-200/60">
              <CardContent className="p-6 space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                    <Settings className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">SMS Configuration</h2>
                    <p className="text-sm text-slate-500">Configure your SMS service provider</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* SMS Service Provider */}
                  <div className={`rounded-xl border-2 p-5 transition-all ${settingsForm.active_sms_service !== 'disabled' ? 'border-emerald-500 bg-emerald-50/50' : 'border-slate-200'}`}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Settings className="w-5 h-5 text-emerald-600" />
                        <h3 className="font-semibold text-slate-900">SMS Service Provider</h3>
                      </div>
                      {settingsForm.active_sms_service !== 'disabled' && (
                        <Badge className="bg-emerald-100 text-emerald-700">ACTIVE</Badge>
                      )}
                    </div>
                    <p className="text-sm text-slate-500 mb-4">Select and configure your SMS service provider</p>
                    <div className="space-y-3">
                      <div>
                        <Label className="text-xs font-semibold">Active Service</Label>
                        <Select value={settingsForm.active_sms_service} onValueChange={v => setSettingsForm({ ...settingsForm, active_sms_service: v })}>
                          <SelectTrigger className="min-h-[44px]"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="hubtel">Hubtel SMS</SelectItem>
                            <SelectItem value="disabled">Disabled</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Attendance Notifications */}
                  <div className={`rounded-xl border-2 p-5 transition-all ${settingsForm.send_attendance_sms === '1' ? 'border-emerald-500 bg-emerald-50/50' : 'border-slate-200'}`}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Bell className="w-5 h-5 text-emerald-600" />
                        <h3 className="font-semibold text-slate-900">Attendance Notifications</h3>
                      </div>
                      {settingsForm.send_attendance_sms === '1' && (
                        <Badge className="bg-emerald-100 text-emerald-700">ENABLED</Badge>
                      )}
                    </div>
                    <p className="text-sm text-slate-500 mb-4">Automatically send SMS to guardians when attendance is taken</p>
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={settingsForm.send_attendance_sms === '1'}
                        onCheckedChange={v => setSettingsForm({ ...settingsForm, send_attendance_sms: v ? '1' : '0' })}
                      />
                      <span className="text-sm text-slate-600">
                        {settingsForm.send_attendance_sms === '1' ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Hubtel Configuration */}
                {settingsForm.active_sms_service !== 'disabled' && (
                  <div className="space-y-4 pt-4 border-t border-slate-200">
                    <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                      <Settings className="w-5 h-5 text-emerald-600" /> Hubtel Configuration
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="grid gap-2">
                        <Label className="text-xs font-semibold">Sender Name (Max 11 chars)</Label>
                        <Input
                          value={settingsForm.hubtel_sender}
                          onChange={e => setSettingsForm({ ...settingsForm, hubtel_sender: e.target.value })}
                          maxLength={11}
                          placeholder="SchoolName"
                          className="min-h-[44px]"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label className="text-xs font-semibold">Client ID</Label>
                        <Input
                          value={settingsForm.hubtel_client_id}
                          onChange={e => setSettingsForm({ ...settingsForm, hubtel_client_id: e.target.value })}
                          placeholder="Client ID"
                          className="min-h-[44px]"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label className="text-xs font-semibold">Client Secret</Label>
                        <Input
                          type="password"
                          value={settingsForm.hubtel_client_secret}
                          onChange={e => setSettingsForm({ ...settingsForm, hubtel_client_secret: e.target.value })}
                          placeholder="Client Secret"
                          className="min-h-[44px]"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <Button
                  onClick={saveSettings}
                  disabled={settingsSaving}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm min-h-[44px]"
                >
                  {settingsSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Settings className="w-4 h-4 mr-2" />}
                  {settingsSaving ? 'Saving...' : 'Save Configuration'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ============ AUTOMATION TAB ============ */}
          <TabsContent value="automation" className="space-y-4">
            {/* Automations Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {automationsLoading ? (
                Array.from({ length: 2 }).map((_, i) => (
                  <Card key={i} className="border-slate-200/60"><CardContent className="p-5"><Skeleton className="h-32 rounded-xl" /></CardContent></Card>
                ))
              ) : automations.length === 0 ? (
                <div className="md:col-span-2">
                  <Card className="py-16 border-slate-200/60">
                    <CardContent className="flex flex-col items-center gap-3">
                      <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center">
                        <Zap className="w-7 h-7 text-slate-300" />
                      </div>
                      <div className="text-center">
                        <p className="text-slate-500 font-medium">No automations found</p>
                        <p className="text-sm text-slate-400 mt-1">Create your first SMS automation</p>
                      </div>
                      <Button
                        variant="outline"
                        className="mt-2 min-h-[44px] text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                        onClick={() => {
                          setAutoForm({ name: '', trigger_event: '', template_id: '', recipient_group: 'all', is_active: 1, cooldown_minutes: 60 });
                          setAutoFormOpen(true);
                        }}
                      >
                        <Plus className="w-4 h-4 mr-2" /> Create Automation
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                automations.map(auto => (
                  <Card key={auto.sms_automation_id} className="border-slate-200/60 hover:shadow-sm transition-shadow">
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${auto.is_active === 1 ? 'bg-emerald-100' : 'bg-slate-100'}`}>
                            <Zap className={`w-4 h-4 ${auto.is_active === 1 ? 'text-emerald-600' : 'text-slate-400'}`} />
                          </div>
                          <h3 className="font-semibold text-slate-900">{auto.name}</h3>
                        </div>
                        <Badge className={auto.is_active === 1 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}>
                          {auto.is_active === 1 ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs text-slate-500 mb-4">
                        <span className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-md">
                          <Zap className="w-3 h-3" /> {auto.trigger_event.replace(/_/g, ' ')}
                        </span>
                        <span className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-md">
                          <Users className="w-3 h-3" /> {auto.recipient_group}
                        </span>
                        <span className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-md">
                          <Clock className="w-3 h-3" /> {auto.cooldown_minutes}min
                        </span>
                      </div>
                      <Button
                        variant="outline"
                        className={`w-full min-h-[44px] ${auto.is_active === 1 ? 'border-red-200 text-red-600 hover:bg-red-50' : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'}`}
                        onClick={() => toggleAutomation(auto.sms_automation_id)}
                      >
                        <ToggleLeft className="w-4 h-4 mr-1.5" />
                        {auto.is_active === 1 ? 'Deactivate' : 'Activate'}
                      </Button>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* ============ TEMPLATES TAB ============ */}
          <TabsContent value="templates" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {templatesLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <Card key={i} className="border-slate-200/60"><CardContent className="p-5"><Skeleton className="h-24 rounded-xl" /></CardContent></Card>
                ))
              ) : templates.length === 0 ? (
                <div className="md:col-span-2">
                  <Card className="py-16 border-slate-200/60">
                    <CardContent className="flex flex-col items-center gap-3">
                      <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center">
                        <FileText className="w-7 h-7 text-slate-300" />
                      </div>
                      <div className="text-center">
                        <p className="text-slate-500 font-medium">No templates yet</p>
                        <p className="text-sm text-slate-400 mt-1">Create reusable SMS templates</p>
                      </div>
                      <Button
                        variant="outline"
                        className="mt-2 min-h-[44px] text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                        onClick={() => {
                          setEditTemplate(null);
                          setTemplateForm({ name: '', content: '', category: 'general', variables: '' });
                          setTemplateFormOpen(true);
                        }}
                      >
                        <Plus className="w-4 h-4 mr-2" /> New Template
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                templates.map(t => (
                  <Card key={t.sms_template_id} className="border-slate-200/60 hover:shadow-sm transition-shadow">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                            <FileText className="w-4 h-4 text-amber-600" />
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-semibold text-sm text-slate-900 truncate">{t.name}</h3>
                            {t.category && (
                              <Badge variant="secondary" className="text-[10px] mt-0.5">{t.category}</Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-9 w-9 p-0 text-emerald-600 hover:bg-emerald-50 min-h-[44px] min-w-[44px]"
                            onClick={() => {
                              setEditTemplate(t);
                              setTemplateForm({ name: t.name, content: t.content, category: t.category, variables: t.variables });
                              setTemplateFormOpen(true);
                            }}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-9 w-9 p-0 text-red-500 hover:bg-red-50 min-h-[44px] min-w-[44px]"
                            onClick={() => {
                              setDeleteTemplateId(t.sms_template_id);
                              setDeleteTemplateOpen(true);
                            }}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm text-slate-600 line-clamp-3 whitespace-pre-wrap bg-slate-50 rounded-lg p-3">{t.content}</p>
                      {t.variables && (
                        <div className="flex flex-wrap gap-1">
                          {t.variables.split(',').map((v, i) => (
                            <Badge key={i} variant="outline" className="text-[10px] font-mono">{'{' + v.trim() + '}'}</Badge>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            {/* Mobile create button */}
            <div className="md:hidden fixed bottom-20 right-4 z-30">
              <Button
                onClick={() => {
                  setEditTemplate(null);
                  setTemplateForm({ name: '', content: '', category: 'general', variables: '' });
                  setTemplateFormOpen(true);
                }}
                className="w-12 h-12 rounded-full bg-emerald-600 hover:bg-emerald-700 shadow-lg"
                size="icon"
              >
                <Plus className="w-5 h-5" />
              </Button>
            </div>
          </TabsContent>

          {/* ============ LOGS TAB ============ */}
          <TabsContent value="logs" className="space-y-4">
            {/* Desktop Table */}
            <Card className="border-slate-200/60 hidden md:block">
              <CardContent className="p-0">
                <div className="max-h-[600px] overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50 hover:bg-slate-50">
                        <TableHead className="text-xs font-semibold text-slate-600">Date</TableHead>
                        <TableHead className="text-xs font-semibold text-slate-600">Phone</TableHead>
                        <TableHead className="text-xs font-semibold text-slate-600">Type</TableHead>
                        <TableHead className="text-xs font-semibold text-slate-600">Message</TableHead>
                        <TableHead className="text-xs font-semibold text-slate-600">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {logsLoading ? (
                        Array.from({ length: 5 }).map((_, i) => <LogRowSkeleton key={i} />)
                      ) : logs.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-16">
                            <div className="flex flex-col items-center gap-2">
                              <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center">
                                <Archive className="w-7 h-7 text-slate-300" />
                              </div>
                              <p className="text-sm font-medium text-slate-500">No SMS logs yet</p>
                              <p className="text-xs text-slate-400">Sent messages will appear here</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        logs.map((log, i) => (
                          <TableRow key={log.sms_log_id || i} className="hover:bg-slate-50">
                            <TableCell className="text-xs text-slate-500">
                              {log.sent_at ? format(new Date(log.sent_at), 'yyyy-MM-dd HH:mm') : '\u2014'}
                            </TableCell>
                            <TableCell className="text-sm font-mono">{log.phone_number}</TableCell>
                            <TableCell>
                              <Badge variant="secondary" className="text-[10px]">
                                {log.recipient_type?.replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase()) || 'N/A'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm max-w-xs truncate">{log.message}</TableCell>
                            <TableCell>
                              <Badge className={
                                log.status === 'sent' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' :
                                log.status === 'failed' ? 'bg-red-100 text-red-700 hover:bg-red-100' :
                                'bg-amber-100 text-amber-700 hover:bg-amber-100'
                              }>
                                {log.status === 'sent' ? 'Sent' : log.status === 'failed' ? 'Failed' : 'Pending'}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-3">
              {logsLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <Card key={i} className="border-slate-200/60"><CardContent className="p-4"><Skeleton className="h-20 rounded-lg" /></CardContent></Card>
                ))
              ) : logs.length === 0 ? (
                <Card className="py-16 border-slate-200/60">
                  <CardContent className="flex flex-col items-center gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center">
                      <Archive className="w-7 h-7 text-slate-300" />
                    </div>
                    <p className="text-slate-500 font-medium">No SMS logs</p>
                  </CardContent>
                </Card>
              ) : (
                logs.map((log, i) => (
                  <Card key={log.sms_log_id || i} className="border-slate-200/60 hover:shadow-sm transition-shadow">
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <Smartphone className="w-4 h-4 text-slate-400 flex-shrink-0" />
                          <span className="text-sm font-mono text-slate-700 truncate">{log.phone_number}</span>
                        </div>
                        <Badge className={`text-[10px] flex-shrink-0 ${
                          log.status === 'sent' ? 'bg-emerald-100 text-emerald-700' :
                          log.status === 'failed' ? 'bg-red-100 text-red-700' :
                          'bg-amber-100 text-amber-700'
                        }`}>
                          {log.status === 'sent' ? 'Sent' : log.status === 'failed' ? 'Failed' : 'Pending'}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-600 line-clamp-2">{log.message}</p>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400">
                        <Clock className="w-3 h-3" />
                        {log.sent_at ? format(new Date(log.sent_at), 'dd MMM, HH:mm') : 'N/A'}
                        {log.recipient_type && (
                          <Badge variant="secondary" className="text-[10px] ml-auto">
                            {log.recipient_type.replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase())}
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            {logs.length > 0 && (
              <p className="text-xs text-slate-400 text-center">
                Showing {logs.length} log(s)
              </p>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Template Form Dialog */}
      <Dialog open={templateFormOpen} onOpenChange={setTemplateFormOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                <FileText className="w-4 h-4 text-amber-600" />
              </div>
              {editTemplate ? 'Edit Template' : 'New SMS Template'}
            </DialogTitle>
            <DialogDescription>{editTemplate ? 'Update the SMS template' : 'Create a reusable SMS template'}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label className="text-xs font-medium">Template Name <span className="text-red-500">*</span></Label>
              <Input value={templateForm.name} onChange={e => setTemplateForm({ ...templateForm, name: e.target.value })} placeholder="e.g., Attendance Alert" className="min-h-[44px]" />
            </div>
            <div className="grid gap-2">
              <Label className="text-xs font-medium">Category</Label>
              <Select value={templateForm.category} onValueChange={v => setTemplateForm({ ...templateForm, category: v })}>
                <SelectTrigger className="min-h-[44px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="attendance">Attendance</SelectItem>
                  <SelectItem value="fee">Fee/Billing</SelectItem>
                  <SelectItem value="exam">Exam</SelectItem>
                  <SelectItem value="event">Event</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label className="text-xs font-medium">Content <span className="text-red-500">*</span></Label>
              <Textarea value={templateForm.content} onChange={e => setTemplateForm({ ...templateForm, content: e.target.value })} placeholder="Template content with {variable} placeholders..." rows={4} className="resize-none" />
              <p className="text-[10px] text-slate-400">Use {'{variable_name}'} as placeholders for dynamic content</p>
            </div>
            <div className="grid gap-2">
              <Label className="text-xs font-medium">Variables (comma-separated)</Label>
              <Input value={templateForm.variables} onChange={e => setTemplateForm({ ...templateForm, variables: e.target.value })} placeholder="e.g., student_name, date, class" className="min-h-[44px]" />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setTemplateFormOpen(false)} className="min-h-[44px]">Cancel</Button>
            <Button onClick={saveTemplate} disabled={savingTemplate || !templateForm.name || !templateForm.content} className="bg-emerald-600 hover:bg-emerald-700 min-h-[44px]">
              {savingTemplate ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              {editTemplate ? 'Update Template' : 'Save Template'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Automation Form Dialog */}
      <Dialog open={autoFormOpen} onOpenChange={setAutoFormOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center">
                <Zap className="w-4 h-4 text-violet-600" />
              </div>
              Create SMS Automation
            </DialogTitle>
            <DialogDescription>Set up automated SMS triggers</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label className="text-xs font-medium">Automation Name <span className="text-red-500">*</span></Label>
              <Input value={autoForm.name} onChange={e => setAutoForm({ ...autoForm, name: e.target.value })} placeholder="e.g., Daily Attendance Alert" className="min-h-[44px]" />
            </div>
            <div className="grid gap-2">
              <Label className="text-xs font-medium">Trigger Event <span className="text-red-500">*</span></Label>
              <Select value={autoForm.trigger_event} onValueChange={v => setAutoForm({ ...autoForm, trigger_event: v })}>
                <SelectTrigger className="min-h-[44px]"><SelectValue placeholder="Select trigger" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="attendance_marked">Attendance Marked</SelectItem>
                  <SelectItem value="fee_overdue">Fee Overdue</SelectItem>
                  <SelectItem value="exam_scheduled">Exam Scheduled</SelectItem>
                  <SelectItem value="student_absent">Student Absent</SelectItem>
                  <SelectItem value="report_published">Report Published</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label className="text-xs font-medium">Recipient Group</Label>
              <Select value={autoForm.recipient_group} onValueChange={v => setAutoForm({ ...autoForm, recipient_group: v })}>
                <SelectTrigger className="min-h-[44px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="parents">Parents</SelectItem>
                  <SelectItem value="teachers">Teachers</SelectItem>
                  <SelectItem value="students">Students</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label className="text-xs font-medium">Cooldown (minutes)</Label>
              <Input type="number" value={autoForm.cooldown_minutes} onChange={e => setAutoForm({ ...autoForm, cooldown_minutes: parseInt(e.target.value) || 60 })} className="min-h-[44px]" />
              <p className="text-[10px] text-slate-400">Minimum time between repeated messages for the same recipient</p>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setAutoFormOpen(false)} className="min-h-[44px]">Cancel</Button>
            <Button onClick={createAutomation} disabled={savingAutomation || !autoForm.name || !autoForm.trigger_event} className="bg-emerald-600 hover:bg-emerald-700 min-h-[44px]">
              {savingAutomation ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Zap className="w-4 h-4 mr-2" />}
              Create Automation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Template Confirmation */}
      <AlertDialog open={deleteTemplateOpen} onOpenChange={setDeleteTemplateOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this template? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="min-h-[44px]">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deleteTemplate} className="bg-red-600 hover:bg-red-700 min-h-[44px]">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
