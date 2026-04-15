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
  Plus, Pencil, Trash2, Zap, FileText, Bell, Archive, ToggleLeft,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
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

export default function SMSPage() {
  const { toast } = useToast();
  const [tab, setTab] = useState('settings');

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

  // Automations state
  const [automations, setAutomations] = useState<SMSAutomation[]>([]);
  const [autoStats, setAutoStats] = useState({ total: 0, active: 0, total_sent: 0, success_rate: 0 });
  const [automationsLoading, setAutomationsLoading] = useState(true);
  const [autoFormOpen, setAutoFormOpen] = useState(false);
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

  useEffect(() => { fetchSettings(); fetchLogs(); fetchTemplates(); fetchAutomations(); }, [fetchSettings, fetchLogs, fetchTemplates, fetchAutomations]);

  // Save settings (mirrors CI3 sms_settings.php)
  const saveSettings = async () => {
    setSettingsSaving(true);
    try {
      await fetch('/api/admin/sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_settings', ...settingsForm }),
      });
      toast({ title: 'Success', description: 'SMS settings updated' });
      fetchSettings();
    } catch {
      toast({ title: 'Error', variant: 'destructive' });
    }
    setSettingsSaving(false);
  };

  // Save template
  const saveTemplate = async () => {
    if (!templateForm.name || !templateForm.content) {
      toast({ title: 'Error', description: 'Name and content required', variant: 'destructive' });
      return;
    }
    try {
      await fetch('/api/admin/sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save_template', ...templateForm }),
      });
      toast({ title: 'Success', description: 'Template saved' });
      setTemplateFormOpen(false);
      fetchTemplates();
    } catch {
      toast({ title: 'Error', variant: 'destructive' });
    }
  };

  // Delete template
  const deleteTemplate = async () => {
    if (!deleteTemplateId) return;
    await fetch(`/api/admin/sms?action=template&id=${deleteTemplateId}`, { method: 'DELETE' });
    toast({ title: 'Success', description: 'Template deleted' });
    setDeleteTemplateOpen(false);
    fetchTemplates();
  };

  // Toggle automation
  const toggleAutomation = async (id: number) => {
    try {
      await fetch('/api/admin/sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle_automation', automation_id: id }),
      });
      fetchAutomations();
    } catch {
      toast({ title: 'Error', variant: 'destructive' });
    }
  };

  // Create automation
  const createAutomation = async () => {
    if (!autoForm.name || !autoForm.trigger_event) {
      toast({ title: 'Error', description: 'Name and trigger event required', variant: 'destructive' });
      return;
    }
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
      toast({ title: 'Success', description: 'Automation created' });
      setAutoFormOpen(false);
      fetchAutomations();
    } catch {
      toast({ title: 'Error', variant: 'destructive' });
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-500 to-sky-700 flex items-center justify-center shadow-lg">
            <Smartphone className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">SMS Management</h1>
            <p className="text-sm text-slate-500">Settings, automation, templates, and logs</p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="settings" className="gap-2 data-[state=active]:bg-sky-600 data-[state=active]:text-white">
              <Settings className="w-4 h-4" /> Settings
            </TabsTrigger>
            <TabsTrigger value="automation" className="gap-2 data-[state=active]:bg-sky-600 data-[state=active]:text-white">
              <Zap className="w-4 h-4" /> Automation
            </TabsTrigger>
            <TabsTrigger value="templates" className="gap-2 data-[state=active]:bg-sky-600 data-[state=active]:text-white">
              <FileText className="w-4 h-4" /> Templates
            </TabsTrigger>
            <TabsTrigger value="logs" className="gap-2 data-[state=active]:bg-sky-600 data-[state=active]:text-white">
              <Archive className="w-4 h-4" /> SMS Logs
            </TabsTrigger>
          </TabsList>

          {/* ============ SETTINGS TAB ============ */}
          <TabsContent value="settings" className="mt-4">
            <Card className="border-slate-200/60">
              <CardContent className="p-6 space-y-6">
                <div className="flex items-center gap-3">
                  <Settings className="w-6 h-6 text-sky-600" />
                  <h2 className="text-xl font-bold text-slate-900">SMS Configuration</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* SMS Service Provider - matches CI3 sms_settings.php */}
                  <div className={`rounded-xl border-2 p-5 transition-all ${settingsForm.active_sms_service !== 'disabled' ? 'border-emerald-500 bg-emerald-50/50' : 'border-slate-200'}`}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Settings className="w-5 h-5 text-sky-600" />
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
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="hubtel">Hubtel SMS</SelectItem>
                            <SelectItem value="disabled">Disabled</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Attendance Notifications - matches CI3 sms_settings.php */}
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
                    <p className="text-sm text-slate-500 mb-4">Automatically send SMS to guardians when attendance is taken with payment details</p>
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

                {/* Hubtel Configuration - matches CI3 sms_settings.php hubtel_config */}
                {settingsForm.active_sms_service !== 'disabled' && (
                  <div className="space-y-4 pt-4 border-t border-slate-200">
                    <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                      <Settings className="w-5 h-5 text-sky-600" /> Hubtel Configuration
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label className="text-xs font-semibold">Sender Name (Max 11 chars)</Label>
                        <Input
                          value={settingsForm.hubtel_sender}
                          onChange={e => setSettingsForm({ ...settingsForm, hubtel_sender: e.target.value })}
                          maxLength={11}
                          placeholder="SchoolName"
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-semibold">Client ID</Label>
                        <Input
                          value={settingsForm.hubtel_client_id}
                          onChange={e => setSettingsForm({ ...settingsForm, hubtel_client_id: e.target.value })}
                          placeholder="Client ID"
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-semibold">Client Secret</Label>
                        <Input
                          type="password"
                          value={settingsForm.hubtel_client_secret}
                          onChange={e => setSettingsForm({ ...settingsForm, hubtel_client_secret: e.target.value })}
                          placeholder="Client Secret"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <Button
                  onClick={saveSettings}
                  disabled={settingsSaving}
                  className="bg-sky-600 hover:bg-sky-700 text-white shadow-md"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  {settingsSaving ? 'Saving...' : 'Save Configuration'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ============ AUTOMATION TAB ============ */}
          <TabsContent value="automation" className="mt-4 space-y-4">
            {/* Stats Cards - matches CI3 sms_automation.php stat-cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="border-slate-200/60">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Total</p>
                    <p className="text-xl font-bold">{autoStats.total}</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-slate-200/60">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Active</p>
                    <p className="text-xl font-bold text-emerald-600">{autoStats.active}</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-slate-200/60">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-sky-100 flex items-center justify-center">
                    <Send className="w-5 h-5 text-sky-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Messages Sent</p>
                    <p className="text-xl font-bold">{autoStats.total_sent}</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-slate-200/60">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Success Rate</p>
                    <p className="text-xl font-bold">{autoStats.success_rate}%</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Automations Grid */}
            <Card className="border-slate-200/60">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Zap className="w-5 h-5 text-sky-600" /> SMS Automations
                </CardTitle>
                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => {
                  setAutoForm({ name: '', trigger_event: '', template_id: '', recipient_group: 'all', is_active: 1, cooldown_minutes: 60 });
                  setAutoFormOpen(true);
                }}>
                  <Plus className="w-4 h-4 mr-1" /> Create
                </Button>
              </CardHeader>
              <CardContent className="p-4">
                {automationsLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />)}
                  </div>
                ) : automations.length === 0 ? (
                  <div className="text-center py-12">
                    <Zap className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                    <p className="text-slate-500">No automations found</p>
                    <p className="text-slate-400 text-sm">Create your first SMS automation</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {automations.map(auto => (
                      <div key={auto.sms_automation_id} className="border border-slate-200 rounded-xl p-5 hover:shadow-md transition-all">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-semibold text-slate-900">{auto.name}</h3>
                          <Badge className={auto.is_active === 1 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}>
                            {auto.is_active === 1 ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        <div className="flex gap-4 text-xs text-slate-500 mb-3">
                          <span className="flex items-center gap-1"><Zap className="w-3 h-3" /> {auto.trigger_event.replace(/_/g, ' ')}</span>
                          <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {auto.recipient_group}</span>
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {auto.cooldown_minutes}min</span>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" className="text-xs flex-1" onClick={() => toggleAutomation(auto.sms_automation_id)}>
                            <ToggleLeft className="w-3 h-3 mr-1" />
                            {auto.is_active === 1 ? 'Deactivate' : 'Activate'}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ============ TEMPLATES TAB ============ */}
          <TabsContent value="templates" className="mt-4 space-y-4">
            <Card className="border-slate-200/60">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="w-5 h-5 text-sky-600" /> SMS Templates
                </CardTitle>
                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => {
                  setEditTemplate(null);
                  setTemplateForm({ name: '', content: '', category: 'general', variables: '' });
                  setTemplateFormOpen(true);
                }}>
                  <Plus className="w-4 h-4 mr-1" /> New Template
                </Button>
              </CardHeader>
              <CardContent className="p-4">
                {templatesLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
                  </div>
                ) : templates.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                    <p className="text-slate-500">No templates yet</p>
                    <p className="text-slate-400 text-sm">Create reusable SMS templates</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {templates.map(t => (
                      <Card key={t.sms_template_id} className="border-slate-200/60 hover:shadow-md transition-all">
                        <CardContent className="p-4 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium text-sm">{t.name}</h3>
                              {t.category && (
                                <Badge variant="outline" className="text-[10px]">{t.category}</Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-sky-600" onClick={() => {
                                setEditTemplate(t);
                                setTemplateForm({ name: t.name, content: t.content, category: t.category, variables: t.variables });
                                setTemplateFormOpen(true);
                              }}>
                                <Pencil className="w-3 h-3" />
                              </Button>
                              <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-500" onClick={() => {
                                setDeleteTemplateId(t.sms_template_id);
                                setDeleteTemplateOpen(true);
                              }}>
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                          <p className="text-sm text-slate-600 line-clamp-3 whitespace-pre-wrap">{t.content}</p>
                          {t.variables && (
                            <p className="text-[10px] text-slate-400">Variables: {t.variables}</p>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ============ LOGS TAB ============ */}
          <TabsContent value="logs" className="mt-4 space-y-4">
            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              <Card className="border-emerald-200 bg-emerald-50/50">
                <CardContent className="p-4 flex items-center gap-3">
                  <CheckCircle className="w-8 h-8 text-emerald-600" />
                  <div>
                    <p className="text-xs text-slate-500">Sent</p>
                    <p className="text-2xl font-bold text-emerald-600">{logStats.sent}</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-red-200 bg-red-50/50">
                <CardContent className="p-4 flex items-center gap-3">
                  <XCircle className="w-8 h-8 text-red-600" />
                  <div>
                    <p className="text-xs text-slate-500">Failed</p>
                    <p className="text-2xl font-bold text-red-600">{logStats.failed}</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-slate-200">
                <CardContent className="p-4 flex items-center gap-3">
                  <MessageSquare className="w-8 h-8 text-slate-600" />
                  <div>
                    <p className="text-xs text-slate-500">Total</p>
                    <p className="text-2xl font-bold">{logStats.total}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Logs Table - matches CI3 sms_log_report.php */}
            <Card className="border-slate-200/60 overflow-hidden">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50">
                      <TableHead className="text-xs font-semibold">Date</TableHead>
                      <TableHead className="text-xs font-semibold">Phone</TableHead>
                      <TableHead className="text-xs font-semibold">Type</TableHead>
                      <TableHead className="text-xs font-semibold">Message</TableHead>
                      <TableHead className="text-xs font-semibold">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logsLoading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}>{Array.from({ length: 5 }).map((_, j) => (
                          <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                        ))}</TableRow>
                      ))
                    ) : logs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-12">
                          <Archive className="w-10 h-10 mx-auto mb-2 text-slate-200" />
                          <p className="text-slate-400">No SMS logs yet</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      logs.map((log, i) => (
                        <TableRow key={log.sms_log_id || i} className="hover:bg-slate-50">
                          <TableCell className="text-xs text-slate-500">
                            {log.sent_at ? format(new Date(log.sent_at), 'yyyy-MM-dd HH:mm') : '—'}
                          </TableCell>
                          <TableCell className="text-sm font-mono">{log.phone_number}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-[10px]">
                              {log.recipient_type.replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase())}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm max-w-xs truncate">{log.message}</TableCell>
                          <TableCell>
                            <Badge className={
                              log.status === 'sent' ? 'bg-emerald-100 text-emerald-700' :
                              log.status === 'failed' ? 'bg-red-100 text-red-700' :
                              'bg-amber-100 text-amber-700'
                            }>
                              {log.status === 'sent' ? 'Sent' : log.status === 'failed' ? 'Failed' : 'Pending'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Template Form Dialog */}
      <Dialog open={templateFormOpen} onOpenChange={setTemplateFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editTemplate ? 'Edit Template' : 'New SMS Template'}</DialogTitle>
            <DialogDescription>Create reusable SMS templates</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label className="text-xs font-semibold">Template Name *</Label>
              <Input value={templateForm.name} onChange={e => setTemplateForm({ ...templateForm, name: e.target.value })} placeholder="e.g., Attendance Alert" />
            </div>
            <div>
              <Label className="text-xs font-semibold">Category</Label>
              <Select value={templateForm.category} onValueChange={v => setTemplateForm({ ...templateForm, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="attendance">Attendance</SelectItem>
                  <SelectItem value="fee">Fee/Billing</SelectItem>
                  <SelectItem value="exam">Exam</SelectItem>
                  <SelectItem value="event">Event</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-semibold">Content *</Label>
              <Textarea value={templateForm.content} onChange={e => setTemplateForm({ ...templateForm, content: e.target.value })} placeholder="Template content..." rows={4} />
            </div>
            <div>
              <Label className="text-xs font-semibold">Variables (comma-separated)</Label>
              <Input value={templateForm.variables} onChange={e => setTemplateForm({ ...templateForm, variables: e.target.value })} placeholder="e.g., student_name, date, class" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTemplateFormOpen(false)}>Cancel</Button>
            <Button onClick={saveTemplate} className="bg-emerald-600 hover:bg-emerald-700">
              {editTemplate ? 'Update' : 'Save Template'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Automation Form Dialog */}
      <Dialog open={autoFormOpen} onOpenChange={setAutoFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create SMS Automation</DialogTitle>
            <DialogDescription>Set up automated SMS triggers</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label className="text-xs font-semibold">Automation Name *</Label>
              <Input value={autoForm.name} onChange={e => setAutoForm({ ...autoForm, name: e.target.value })} placeholder="e.g., Attendance Alert" />
            </div>
            <div>
              <Label className="text-xs font-semibold">Trigger Event *</Label>
              <Select value={autoForm.trigger_event} onValueChange={v => setAutoForm({ ...autoForm, trigger_event: v })}>
                <SelectTrigger><SelectValue placeholder="Select trigger" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="attendance_marked">Attendance Marked</SelectItem>
                  <SelectItem value="fee_overdue">Fee Overdue</SelectItem>
                  <SelectItem value="exam_scheduled">Exam Scheduled</SelectItem>
                  <SelectItem value="student_absent">Student Absent</SelectItem>
                  <SelectItem value="report_published">Report Published</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-semibold">Recipient Group</Label>
              <Select value={autoForm.recipient_group} onValueChange={v => setAutoForm({ ...autoForm, recipient_group: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="parents">Parents</SelectItem>
                  <SelectItem value="teachers">Teachers</SelectItem>
                  <SelectItem value="students">Students</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-semibold">Cooldown (minutes)</Label>
              <Input type="number" value={autoForm.cooldown_minutes} onChange={e => setAutoForm({ ...autoForm, cooldown_minutes: parseInt(e.target.value) || 60 })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAutoFormOpen(false)}>Cancel</Button>
            <Button onClick={createAutomation} className="bg-emerald-600 hover:bg-emerald-700">Create Automation</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Template Confirmation */}
      <AlertDialog open={deleteTemplateOpen} onOpenChange={setDeleteTemplateOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to delete this template? This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deleteTemplate} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
