'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  Loader2, Smartphone, BarChart3, Eye, List,
} from 'lucide-react';
import { toast } from 'sonner';

interface TriggerEvent { value: string; label: string; description: string; }
interface Template { sms_template_id: number; name: string; content: string; category: string; }
interface AutomationLog { id: number; phone: string; message: string; status: string; sent_at: string; }
interface Automation {
  sms_automation_id: number; name: string; trigger_event: string;
  template_id: number | null; recipient_group: string; is_active: number;
  cooldown_minutes: number; message_template: string; total_sent: number;
}

export default function SmsAutomationPage() {
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [automationStats, setAutomationStats] = useState<Record<number, { sent: number; failed: number; lastRun: string | null }>>({});
  const [templates, setTemplates] = useState<Template[]>([]);
  const [triggerEvents, setTriggerEvents] = useState<TriggerEvent[]>([]);
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0, totalSent: 0, successRate: 0 });
  const [activity, setActivity] = useState<{ date: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ name: '', trigger_event: '', recipient_group: 'parents', is_active: 1, cooldown_minutes: '60', message_template: '' });
  const [saving, setSaving] = useState(false);

  // Delete
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  // Logs dialog
  const [logsDialogOpen, setLogsDialogOpen] = useState(false);
  const [logsAutomation, setLogsAutomation] = useState<Automation | null>(null);
  const [logs, setLogs] = useState<AutomationLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  const chartRef = useRef<HTMLCanvasElement>(null);

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
      setActivity(data.activity || []);
    } catch { toast.error('Failed to load automations'); }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Draw chart on canvas
  useEffect(() => {
    if (activity.length > 0 && chartRef.current) {
      const canvas = chartRef.current;
      const ctx = canvas.getContext('2d');
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);

      const w = rect.width;
      const h = rect.height;
      const padding = { top: 20, right: 20, bottom: 30, left: 40 };
      const chartW = w - padding.left - padding.right;
      const chartH = h - padding.top - padding.bottom;

      const maxVal = Math.max(...activity.map(a => a.count), 1);

      ctx.clearRect(0, 0, w, h);

      // Grid lines
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 0.5;
      for (let i = 0; i <= 4; i++) {
        const y = padding.top + (chartH / 4) * i;
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(w - padding.right, y);
        ctx.stroke();
        ctx.fillStyle = '#94a3b8';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(String(Math.round(maxVal - (maxVal / 4) * i)), padding.left - 8, y + 4);
      }

      // Line + fill
      if (activity.length >= 2) {
        const step = chartW / (activity.length - 1);
        ctx.beginPath();
        ctx.moveTo(padding.left, padding.top + chartH - (activity[0].count / maxVal) * chartH);
        activity.forEach((a, i) => {
          const x = padding.left + step * i;
          const y = padding.top + chartH - (a.count / maxVal) * chartH;
          ctx.lineTo(x, y);
        });
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Fill area
        ctx.lineTo(padding.left + step * (activity.length - 1), padding.top + chartH);
        ctx.lineTo(padding.left, padding.top + chartH);
        ctx.closePath();
        const gradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartH);
        gradient.addColorStop(0, 'rgba(16, 185, 129, 0.2)');
        gradient.addColorStop(1, 'rgba(16, 185, 129, 0)');
        ctx.fillStyle = gradient;
        ctx.fill();

        // X labels
        ctx.fillStyle = '#94a3b8';
        ctx.font = '9px sans-serif';
        ctx.textAlign = 'center';
        activity.forEach((a, i) => {
          if (i % Math.ceil(activity.length / 8) === 0) {
            const x = padding.left + step * i;
            ctx.fillText(a.date.slice(-5), x, h - 5);
          }
        });
      }
    }
  }, [activity]);

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

  const openLogs = async (a: Automation) => {
    setLogsAutomation(a);
    setLogsDialogOpen(true);
    setLogsLoading(true);
    try {
      const res = await fetch(`/api/admin/sms/automation?action=logs&automation_id=${a.sms_automation_id}`);
      const data = await res.json();
      setLogs(data.logs || []);
    } catch { /* empty */ }
    setLogsLoading(false);
  };

  const getEventLabel = (val: string) => triggerEvents.find(e => e.value === val)?.label || val.replace(/_/g, ' ');

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">SMS Automation</h1>
              <p className="text-sm text-slate-500 mt-0.5">Configure automated SMS triggers and bill reminders</p>
            </div>
          </div>
          <Button onClick={openCreate} className="bg-emerald-600 hover:bg-emerald-700 min-h-[44px] shadow-sm">
            <Plus className="w-4 h-4 mr-2" /> Create Automation
          </Button>
        </div>

        {/* Stats Cards - matching CI3 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Automations', value: stats.total, icon: Zap, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-l-emerald-500' },
            { label: 'Active', value: stats.active, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-l-emerald-500' },
            { label: 'Messages Sent', value: stats.totalSent, icon: Send, color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-l-violet-500' },
            { label: 'Success Rate', value: `${stats.successRate}%`, icon: Activity, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-l-amber-500' },
          ].map(s => (
            <Card key={s.label} className={`border-slate-200/60 border-l-4 ${s.border} hover:shadow-sm hover:-translate-y-0.5 transition-all`}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg ${s.bg} flex items-center justify-center flex-shrink-0`}>
                  <s.icon className={`w-5 h-5 ${s.color}`} />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">{s.label}</p>
                  <p className="text-xl font-bold text-slate-900 tabular-nums">{s.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Automations Grid - matching CI3 card layout */}
        {loading ? (
          <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-36 rounded-xl" />)}</div>
        ) : automations.length === 0 ? (
          <Card><CardContent className="py-16 text-center text-slate-400">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 mx-auto mb-3 flex items-center justify-center"><Bell className="w-7 h-7 text-slate-300" /></div>
            <p className="text-sm font-medium">No automations configured</p>
            <p className="text-xs text-slate-400 mt-1">Create your first SMS automation or bill reminder schedule</p>
            <Button variant="outline" size="sm" className="mt-3 min-h-[44px] text-emerald-600 border-emerald-200 hover:bg-emerald-50" onClick={openCreate}><Plus className="w-3.5 h-3.5 mr-1" /> Create First Automation</Button>
          </CardContent></Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {automations.map(a => {
              const aStats = automationStats[a.sms_automation_id] || { sent: 0, failed: 0, lastRun: null };
              return (
                <Card key={a.sms_automation_id} className={`border-slate-200/60 hover:shadow-lg transition-all hover:-translate-y-0.5 ${a.is_active ? '' : 'opacity-60'}`}>
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-slate-900 text-sm">{a.name}</h3>
                      <Badge className={a.is_active === 1 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}>
                        {a.is_active === 1 ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>

                    {/* Meta info */}
                    <div className="flex flex-wrap gap-2 text-[11px] text-slate-500 mb-3">
                      <span className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-md">
                        <Zap className="w-3 h-3" /> {getEventLabel(a.trigger_event)}
                      </span>
                      <span className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-md">
                        <Users className="w-3 h-3" /> {a.recipient_group}
                      </span>
                      <span className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-md">
                        <Send className="w-3 h-3" /> {a.total_sent || aStats.sent || 0} sent
                      </span>
                    </div>

                    {/* Message template preview */}
                    {a.message_template && (
                      <div className="bg-slate-50 p-3 rounded-lg border-l-3 border-emerald-400 mb-4">
                        <p className="text-xs text-slate-600 line-clamp-2">{a.message_template}</p>
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" className="flex-1 min-h-[36px] text-xs text-violet-600 border-violet-200 hover:bg-violet-50">
                        <Smartphone className="w-3 h-3 mr-1" /> Test
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1 min-h-[36px] text-xs text-sky-600 border-sky-200 hover:bg-sky-50" onClick={() => openLogs(a)}>
                        <List className="w-3 h-3 mr-1" /> Logs
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1 min-h-[36px] text-xs text-amber-600 border-amber-200 hover:bg-amber-50" onClick={() => openEdit(a)}>
                        <Edit className="w-3 h-3 mr-1" /> Edit
                      </Button>
                      <Button variant="outline" size="sm" className={`flex-1 min-h-[36px] text-xs ${a.is_active ? 'text-red-600 border-red-200 hover:bg-red-50' : 'text-emerald-600 border-emerald-200 hover:bg-emerald-50'}`} onClick={() => handleToggle(a)}>
                        {a.is_active ? <><PowerOff className="w-3 h-3 mr-1" /> Deactivate</> : <><Power className="w-3 h-3 mr-1" /> Activate</>}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Activity Chart - matching CI3 */}
        {activity.length > 0 && (
          <Card className="border-slate-200/60">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-slate-400" /> Activity (Last {activity.length} Days)
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <canvas ref={chartRef} className="w-full" style={{ height: 160 }} />
            </CardContent>
          </Card>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editId ? 'Edit Automation' : 'Create Automation'}</DialogTitle><DialogDescription>Configure an automated SMS trigger</DialogDescription></DialogHeader>
          <div className="space-y-4 py-2">
            <div><Label className="text-xs">Automation Name *</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g., Absent Student Alert" className="mt-1 min-h-[44px]" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Trigger Event *</Label>
                <Select value={form.trigger_event} onValueChange={v => setForm({ ...form, trigger_event: v })}>
                  <SelectTrigger className="mt-1 min-h-[44px]"><SelectValue placeholder="Select trigger..." /></SelectTrigger>
                  <SelectContent>{triggerEvents.map(te => <SelectItem key={te.value} value={te.value}>{te.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label className="text-xs">Recipient Group</Label>
                <Select value={form.recipient_group} onValueChange={v => setForm({ ...form, recipient_group: v })}>
                  <SelectTrigger className="mt-1 min-h-[44px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="parents">Parents</SelectItem>
                    <SelectItem value="students">Students</SelectItem>
                    <SelectItem value="teachers">Teachers</SelectItem>
                    <SelectItem value="all">All</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div><Label className="text-xs">Cooldown (minutes)</Label><Input type="number" value={form.cooldown_minutes} onChange={e => setForm({ ...form, cooldown_minutes: e.target.value })} className="mt-1 min-h-[44px] font-mono" /></div>
            <div><Label className="text-xs">Custom Message Template</Label>
              <textarea className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 mt-1" value={form.message_template} onChange={e => setForm({ ...form, message_template: e.target.value })} placeholder="e.g., Dear [parent_name], [student_name] was marked absent today." />
              <p className="text-[10px] text-slate-400 mt-1">Variables: [parent_name], [student_name], [student_code], [class_name], [date]</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="min-h-[44px]">Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 min-h-[44px]">{saving ? 'Saving...' : editId ? 'Update' : 'Create'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Logs Dialog */}
      <Dialog open={logsDialogOpen} onOpenChange={setLogsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Logs: {logsAutomation?.name}</DialogTitle><DialogDescription>Execution history for this automation</DialogDescription></DialogHeader>
          {logsLoading ? (
            <div className="space-y-2 py-4">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8 text-slate-400"><MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-30" /><p className="text-sm">No logs yet</p></div>
          ) : (
            <div className="space-y-2">
              {logs.map((log, i) => (
                <div key={log.id || i} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 text-sm">
                  <div className="flex items-center gap-3 min-w-0">
                    <Phone className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <span className="font-mono text-slate-600 truncate">{log.phone}</span>
                  </div>
                  <Badge className={`text-[10px] flex-shrink-0 ${log.status === 'sent' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
                    {log.status === 'sent' ? 'Sent' : 'Failed'}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete Automation</AlertDialogTitle><AlertDialogDescription>This automation and all its logs will be permanently deleted.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel className="min-h-[44px]">Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 min-h-[44px]">Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
