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
import { toast } from 'sonner';
import { Search, Plus, Smartphone, Send, Pencil, Trash2, MessageSquare } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

export default function SettingsSMSPage() {
  const [config, setConfig] = useState({ api_key: '', sender_name: '', provider: 'hubtel', webhook_url: '' });
  const [saving, setSaving] = useState(false);
  const [smsLog, setSmsLog] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await fetch('/api/settings');
        const data = await res.json();
        setConfig(prev => ({
          ...prev,
          api_key: data.sms_api_key || '',
          sender_name: data.sms_sender_name || '',
          provider: data.sms_provider || 'hubtel',
        }));
      } catch {}
      setLoading(false);
    };
    fetchConfig();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_sms', ...config }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast.success('SMS settings saved');
    } catch (err: any) { toast.error(err.message); } finally { setSaving(false); }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-3xl mx-auto">
        <div><h1 className="text-2xl font-bold text-slate-900 tracking-tight">SMS Settings</h1><p className="text-sm text-slate-500 mt-1">Configure SMS API integration</p></div>

        <Tabs defaultValue="config">
          <TabsList><TabsTrigger value="config">API Configuration</TabsTrigger><TabsTrigger value="test">Send Test</TabsTrigger></TabsList>

          <TabsContent value="config">
            <Card>
              <CardHeader><CardTitle className="text-base">Hubtel SMS Integration</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div><Label className="text-xs">SMS Provider</Label><Select value={config.provider} onValueChange={v => setConfig({ ...config, provider: v })}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="hubtel">Hubtel</SelectItem><SelectItem value="twilio">Twilio</SelectItem><SelectItem value="custom">Custom API</SelectItem></SelectContent></Select></div>
                <div><Label className="text-xs">API Key</Label><Input type="password" value={config.api_key} onChange={e => setConfig({ ...config, api_key: e.target.value })} className="mt-1" placeholder="Enter your SMS API key" /></div>
                <div><Label className="text-xs">Sender Name</Label><Input value={config.sender_name} onChange={e => setConfig({ ...config, sender_name: e.target.value })} className="mt-1" placeholder="e.g. SCHNAME" maxLength={11} /></div>
                <Button onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">{saving ? 'Saving...' : 'Save Settings'}</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="test">
            <Card>
              <CardHeader><CardTitle className="text-base">Send Test SMS</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <TestSMSForm />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}

function TestSMSForm() {
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!phone || !message) { toast.error('Phone and message required'); return; }
    setSending(true);
    try {
      const res = await fetch('/api/sms', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ recipient_type: 'custom', custom_numbers: phone, message }) });
      const data = await res.json(); if (data.error) throw new Error(data.error);
      toast.success('Test SMS sent');
    } catch (err: any) { toast.error(err.message); } finally { setSending(false); }
  };

  return (
    <>
      <div><Label className="text-xs">Phone Number *</Label><Input value={phone} onChange={e => setPhone(e.target.value)} className="mt-1" placeholder="0240000000" /></div>
      <div><Label className="text-xs">Message *</Label><Textarea value={message} onChange={e => setMessage(e.target.value)} className="mt-1" rows={3} placeholder="Type test message..." /></div>
      <Button onClick={handleSend} disabled={sending} className="bg-emerald-600 hover:bg-emerald-700"><Send className="w-4 h-4 mr-2" />{sending ? 'Sending...' : 'Send Test SMS'}</Button>
    </>
  );
}
