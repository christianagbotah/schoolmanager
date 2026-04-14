'use client';

import { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Search, Plus, Send, Smartphone, MessageSquare, Trash2, Clock, CheckCircle, XCircle, Users, ChevronLeft, ChevronRight } from 'lucide-react';

interface SMSRecord { id?: number; recipients: string; message: string; status: string; created_at: string; }
interface SMSTemplate { id?: number; name: string; content: string; }

export default function SMSPage() {
  const [tab, setTab] = useState('compose');
  const [history, setHistory] = useState<SMSRecord[]>([]);
  const [templates, setTemplates] = useState<SMSTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const [recipientType, setRecipientType] = useState('all_parents');
  const [selectedClass, setSelectedClass] = useState('');
  const [message, setMessage] = useState('');
  const [customNumbers, setCustomNumbers] = useState('');
  const [classes, setClasses] = useState<{ class_id: number; name: string }[]>([]);

  const [templateFormOpen, setTemplateFormOpen] = useState(false);
  const [templateData, setTemplateData] = useState({ name: '', content: '' });

  const fetchSMS = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/sms');
      const data = await res.json();
      setHistory(Array.isArray(data.history) ? data.history : []);
      setTemplates(Array.isArray(data.templates) ? data.templates : []);
    } catch { toast.error('Failed to load SMS data'); } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchSMS(); }, [fetchSMS]);
  useEffect(() => { fetch('/api/classes?limit=100').then(r => r.json()).then(d => setClasses(Array.isArray(d) ? d : [])).catch(() => {}); }, []);

  const handleSend = async () => {
    if (!message.trim()) { toast.error('Message is required'); return; }
    setSending(true);
    try {
      const res = await fetch('/api/sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipient_type: recipientType, class_id: selectedClass, message, custom_numbers: customNumbers }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast.success(`SMS sent to ${data.count || 0} recipients`);
      setMessage('');
    } catch (err: any) { toast.error(err.message); } finally { setSending(false); }
  };

  const saveTemplate = async () => {
    if (!templateData.name || !templateData.content) { toast.error('Name and content required'); return; }
    try {
      const res = await fetch('/api/sms', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'save_template', ...templateData }) });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast.success('Template saved');
      setTemplateFormOpen(false);
      fetchSMS();
    } catch (err: any) { toast.error(err.message); }
  };

  const applyTemplate = (t: SMSTemplate) => { setMessage(t.content); setTab('compose'); };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div><h1 className="text-2xl font-bold text-slate-900 tracking-tight">SMS Management</h1><p className="text-sm text-slate-500 mt-1">Send bulk SMS and manage templates</p></div>
          <Button onClick={() => setTemplateFormOpen(true)} variant="outline"><Plus className="w-4 h-4 mr-2" />New Template</Button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="border-emerald-100"><CardContent className="p-4 flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center"><Send className="w-5 h-5 text-emerald-600" /></div><div><p className="text-xs text-slate-500">Sent</p><p className="text-lg font-bold">{history.filter(h => h.status === 'sent').length}</p></div></CardContent></Card>
          <Card className="border-blue-100"><CardContent className="p-4 flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center"><MessageSquare className="w-5 h-5 text-blue-600" /></div><div><p className="text-xs text-slate-500">Total</p><p className="text-lg font-bold">{history.length}</p></div></CardContent></Card>
          <Card className="border-amber-100"><CardContent className="p-4 flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center"><Smartphone className="w-5 h-5 text-amber-600" /></div><div><p className="text-xs text-slate-500">Failed</p><p className="text-lg font-bold text-red-600">{history.filter(h => h.status === 'failed').length}</p></div></CardContent></Card>
          <Card className="border-purple-100"><CardContent className="p-4 flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center"><Users className="w-5 h-5 text-purple-600" /></div><div><p className="text-xs text-slate-500">Templates</p><p className="text-lg font-bold">{templates.length}</p></div></CardContent></Card>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList><TabsTrigger value="compose">Compose</TabsTrigger><TabsTrigger value="history">History</TabsTrigger><TabsTrigger value="templates">Templates</TabsTrigger></TabsList>

          <TabsContent value="compose">
            <Card><CardContent className="p-6 space-y-4">
              <h3 className="font-semibold text-slate-800">Compose SMS</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><Label className="text-xs">Recipient Type</Label><Select value={recipientType} onValueChange={setRecipientType}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent>
                  <SelectItem value="all_parents">All Parents</SelectItem>
                  <SelectItem value="all_students">All Students</SelectItem>
                  <SelectItem value="all_teachers">All Teachers</SelectItem>
                  <SelectItem value="class_parents">Class Parents</SelectItem>
                  <SelectItem value="custom">Custom Numbers</SelectItem>
                </SelectContent></Select></div>
                <div><Label className="text-xs">Class (for class parents)</Label><Select value={selectedClass} onValueChange={setSelectedClass}><SelectTrigger className="mt-1"><SelectValue placeholder="Select class" /></SelectTrigger><SelectContent>{classes.map(c => <SelectItem key={c.class_id} value={String(c.class_id)}>{c.name}</SelectItem>)}</SelectContent></Select></div>
              </div>
              {recipientType === 'custom' && <div><Label className="text-xs">Phone Numbers (comma-separated)</Label><Textarea placeholder="0240000000, 0200000000" value={customNumbers} onChange={e => setCustomNumbers(e.target.value)} className="mt-1" rows={2} /></div>}
              <div><Label className="text-xs">Message * ({message.length}/160 chars)</Label><Textarea placeholder="Type your SMS message here..." value={message} onChange={e => setMessage(e.target.value)} className="mt-1" rows={4} maxLength={160} /></div>
              {templates.length > 0 && <div><p className="text-xs text-slate-400 mb-2">Quick Templates:</p><div className="flex flex-wrap gap-2">{templates.slice(0, 5).map(t => <Badge key={t.id} variant="outline" className="cursor-pointer hover:bg-slate-100" onClick={() => applyTemplate(t)}>{t.name}</Badge>)}</div></div>}
              <Button onClick={handleSend} disabled={sending || !message.trim()} className="bg-emerald-600 hover:bg-emerald-700"><Send className="w-4 h-4 mr-2" />{sending ? 'Sending...' : 'Send SMS'}</Button>
            </CardContent></Card>
          </TabsContent>

          <TabsContent value="history">
            <Card><CardContent className="p-0">
              <Table>
                <TableHeader><TableRow className="bg-slate-50"><TableHead className="text-xs font-semibold">Date</TableHead><TableHead className="text-xs font-semibold">Recipients</TableHead><TableHead className="text-xs font-semibold">Message</TableHead><TableHead className="text-xs font-semibold">Status</TableHead></TableRow></TableHeader>
                <TableBody>
                  {loading ? Array.from({ length: 5 }).map((_, i) => <TableRow key={i}>{Array.from({ length: 4 }).map((_, j) => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}</TableRow>)
                  : history.length === 0 ? <TableRow><TableCell colSpan={4} className="text-center py-12 text-slate-400"><MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-50" /><p>No SMS history</p></TableCell></TableRow>
                  : history.map((h, i) => (
                    <TableRow key={h.id || i}><TableCell className="text-xs text-slate-500">{h.created_at ? new Date(h.created_at).toLocaleDateString() : '—'}</TableCell><TableCell className="text-sm">{h.recipients}</TableCell><TableCell className="text-sm max-w-xs truncate">{h.message}</TableCell>
                    <TableCell><Badge variant={h.status === 'sent' ? 'default' : 'destructive'}>{h.status}</Badge></TableCell></TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent></Card>
          </TabsContent>

          <TabsContent value="templates">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {templates.map(t => (
                <Card key={t.id}><CardContent className="p-4 space-y-2">
                  <div className="flex items-center justify-between"><p className="font-medium text-sm">{t.name}</p><Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-600" onClick={() => applyTemplate(t)}><Send className="w-3.5 h-3.5" /></Button></div>
                  <p className="text-sm text-slate-600">{t.content}</p>
                </CardContent></Card>
              ))}
              {templates.length === 0 && <div className="col-span-2 text-center py-12 text-slate-400"><MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-50" /><p>No templates. Create one above.</p></div>}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={templateFormOpen} onOpenChange={setTemplateFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>New SMS Template</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label className="text-xs">Template Name *</Label><Input value={templateData.name} onChange={e => setTemplateData({ ...templateData, name: e.target.value })} className="mt-1" /></div>
            <div><Label className="text-xs">Content *</Label><Textarea value={templateData.content} onChange={e => setTemplateData({ ...templateData, content: e.target.value })} className="mt-1" rows={4} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setTemplateFormOpen(false)}>Cancel</Button><Button onClick={saveTemplate} className="bg-emerald-600 hover:bg-emerald-700">Save Template</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
