'use client';

import { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Zap, Plus, Edit, Trash2, Power, PowerOff, Settings, Bell, Users,
  CheckCircle, XCircle, Clock, Send, MessageSquare, Activity,
} from 'lucide-react';

interface TriggerEvent { value: string; label: string; description: string; }
interface Template { sms_template_id: number; name: string; content: string; category: string; }
interface Automation {
  sms_automation_id: number; name: string; trigger_event: string;
  template_id: number | null; recipient_group: string; is_active: number;
  cooldown_minutes: number; message_template: string;
}

export default function SmsAutomationPage() {
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [automationStats, setAutomationStats] = useState<Record<number, { sent: number; failed: number; lastRun: string | null }>>({});
  const [templates, setTemplates] = useState<Template[]>([]);
  const [triggerEvents, setTriggerEvents] = useState<TriggerEvent[]>([]);
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0, totalSent: 0, successRate: 0 });
  const [loading, setLoading] = useState(true);

  // Dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ name: '', trigger_event: '', recipient_group: 'parents', is_active: 1, cooldown_minutes: '60', message_template: '' });
  const [saving, setSaving] = useState(false);

  // Delete
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/sms/automation');
      const data = await res.json();
      setAutomations(data.automations || []);
      setAutomationStats(data.automationStats || {});
      setTemplates(data.templates || []);
      setTriggerEvents(data.triggerEvents || []);
      setStats(data.stats || { total: 0, active: 0, inactive: 0, totalSent: 0, successRate: 0 });
    } catch { toast.error('Failed to load automations'); }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openCreate = () => {
    setEditId(null);
    setForm({ name: '', trigger_event: '', recipient_group: 'parents', is_active: 1, cooldown_minutes: '60', message_template: '' });
    setDialogOpen(true);
  };

  const openEdit = (a: Automation) => {
    setEditId(a.sms_automation_id);
    setForm({
      name: a.name,
      trigger_event: a.trigger_event,
      recipient_group: a.recipient_group || 'parents',
      is_active: a.is_active,
      cooldown_minutes: String(a.cooldown_minutes || 60),
      message_template: a.message_template || '',
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.trigger_event) { toast.error('Name and trigger event required'); return; }
    setSaving(true);
    try {
      const action = editId ? 'update' : 'create';
      const body = {
        action,
        automation_id: editId,
        ...form,
        cooldown_minutes: parseInt(form.cooldown_minutes) || 60,
      };
      const res = await fetch('/api/admin/sms/automation', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast.success(data.message);
      setDialogOpen(false);
      fetchData();
    } catch (err: any) { toast.error(err.message); }
    setSaving(false);
  };

  const handleToggle = async (a: Automation) => {
    try {
      const res = await fetch('/api/admin/sms/automation', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle', automation_id: a.sms_automation_id }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast.success(data.message); fetchData();
    } catch (err: any) { toast.error(err.message); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await fetch(`/api/admin/sms/automation?id=${deleteId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast.success('Automation deleted'); setDeleteOpen(false); setDeleteId(null); fetchData();
    } catch (err: any) { toast.error(err.message); }
  };

  const getEventLabel = (val: string) => triggerEvents.find(e => e.value === val)?.label || val.replace(/_/g, ' ');

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-cyan-600 flex items-center justify-center shadow-md">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">SMS Automation</h1>
              <p className="text-sm text-slate-500 mt-0.5">Configure automated SMS triggers</p>
            </div>
          </div>
          <Button onClick={openCreate} className="bg-sky-600 hover:bg-sky-700">
            <Plus className="w-4 h-4 mr-2" /> New Automation
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          {[
            { label: 'Total Automations', value: stats.total, icon: Zap, color: 'text-sky-600', bg: 'bg-sky-50' },
            { label: 'Active', value: stats.active, icon: Power, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { label: 'Inactive', value: stats.inactive, icon: PowerOff, color: 'text-red-500', bg: 'bg-red-50' },
            { label: 'Messages Sent', value: stats.totalSent, icon: Send, color: 'text-violet-600', bg: 'bg-violet-50' },
            { label: 'Success Rate', value: `${stats.successRate}%`, icon: Activity, color: 'text-amber-600', bg: 'bg-amber-50' },
          ].map(s => (
            <Card key={s.label}><CardContent className="p-4"><div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center`}><s.icon className={`w-4 h-4 ${s.color}`} /></div>
              <div><p className="text-[10px] text-slate-400 uppercase tracking-wide">{s.label}</p><p className="text-lg font-bold">{s.value}</p></div>
            </div></CardContent></Card>
          ))}
        </div>

        {/* Automations List */}
        {loading ? (
          <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}</div>
        ) : automations.length === 0 ? (
          <Card><CardContent className="py-16 text-center text-slate-400">
            <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" /><p className="text-sm">No automations configured</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={openCreate}><Plus className="w-3.5 h-3.5 mr-1" /> Create First Automation</Button>
          </CardContent></Card>
        ) : (
          <div className="space-y-3">
            {automations.map(a => {
              const aStats = automationStats[a.sms_automation_id] || { sent: 0, failed: 0, lastRun: null };
              return (
                <Card key={a.sms_automation_id} className={`hover:shadow-md transition-all ${a.is_active ? '' : 'opacity-60'}`}>
                  <CardContent className="p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${a.is_active ? 'bg-emerald-100' : 'bg-slate-100'}`}>
                          {a.is_active ? <CheckCircle className="w-5 h-5 text-emerald-600" /> : <XCircle className="w-5 h-5 text-slate-400" />}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-sm">{a.name}</p>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-[10px] h-5 bg-sky-50 text-sky-700 border-sky-200">
                              <Bell className="w-3 h-3 mr-1" />{getEventLabel(a.trigger_event)}
                            </Badge>
                            <Badge variant="outline" className="text-[10px] h-5 bg-violet-50 text-violet-700 border-violet-200">
                              <Users className="w-3 h-3 mr-1" />{a.recipient_group || 'parents'}
                            </Badge>
                            <span className="text-[10px] text-slate-400">
                              <Clock className="w-3 h-3 inline mr-0.5" />{a.cooldown_minutes}min cooldown
                            </span>
                          </div>
                          {a.message_template && (
                            <p className="text-[10px] text-slate-400 mt-1.5 line-clamp-1 max-w-md">{a.message_template}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-4 flex-shrink-0">
                        {/* Stats */}
                        <div className="hidden sm:flex items-center gap-3 text-xs">
                          {aStats.sent > 0 && (
                            <div className="text-center">
                              <p className="font-bold text-emerald-600">{aStats.sent}</p>
                              <p className="text-[10px] text-slate-400">Sent</p>
                            </div>
                          )}
                          {aStats.failed > 0 && (
                            <div className="text-center">
                              <p className="font-bold text-red-500">{aStats.failed}</p>
                              <p className="text-[10px] text-slate-400">Failed</p>
                            </div>
                          )}
                          {aStats.lastRun && (
                            <div className="text-center">
                              <p className="text-[10px] text-slate-400">{new Date(aStats.lastRun).toLocaleDateString()}</p>
                              <p className="text-[10px] text-slate-400">Last Run</p>
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleToggle(a)}>
                            {a.is_active ? <PowerOff className="w-3.5 h-3.5 text-amber-500" /> : <Power className="w-3.5 h-3.5 text-emerald-500" />}
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(a)}>
                            <Edit className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => { setDeleteId(a.sms_automation_id); setDeleteOpen(true); }}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Create/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>{editId ? 'Edit Automation' : 'Create Automation'}</DialogTitle><DialogDescription>Configure an automated SMS trigger</DialogDescription></DialogHeader>
            <div className="space-y-4">
              <div><Label className="text-xs">Automation Name *</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g., Absent Student Alert" className="mt-1" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs">Trigger Event *</Label>
                  <Select value={form.trigger_event} onValueChange={v => setForm({ ...form, trigger_event: v })}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Select trigger..." /></SelectTrigger>
                    <SelectContent>
                      {triggerEvents.map(te => <SelectItem key={te.value} value={te.value}>{te.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div><Label className="text-xs">Recipient Group</Label>
                  <Select value={form.recipient_group} onValueChange={v => setForm({ ...form, recipient_group: v })}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="parents">Parents</SelectItem>
                      <SelectItem value="students">Students</SelectItem>
                      <SelectItem value="teachers">Teachers</SelectItem>
                      <SelectItem value="all">All</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div><Label className="text-xs">Cooldown (minutes)</Label><Input type="number" value={form.cooldown_minutes} onChange={e => setForm({ ...form, cooldown_minutes: e.target.value })} className="mt-1 font-mono" /></div>
              <div><Label className="text-xs">Custom Message Template</Label>
                <textarea
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 mt-1"
                  value={form.message_template}
                  onChange={e => setForm({ ...form, message_template: e.target.value })}
                  placeholder="e.g., Dear [parent_name], [student_name] was marked absent today. Please contact the school."
                />
                <p className="text-[10px] text-slate-400 mt-1">Variables: [parent_name], [student_name], [student_code], [class_name], [date]</p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving} className="bg-sky-600 hover:bg-sky-700">{saving ? 'Saving...' : editId ? 'Update' : 'Create'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete Automation</AlertDialogTitle><AlertDialogDescription>This automation and all its logs will be permanently deleted.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}
